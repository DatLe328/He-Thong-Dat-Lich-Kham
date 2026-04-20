from flask import Blueprint, request, jsonify
from dao.review_dao import ReviewDAO

review_bp = Blueprint("review", __name__, url_prefix="/api/reviews")


# ── Helpers ────────────────────────────────────────────────────────────────
def _ok(data=None, msg="Thành công.", code=200, **extra):
    body = {"success": True, "message": msg}
    if data is not None:
        body["data"] = data
    body.update(extra)
    return jsonify(body), code

def _err(msg, code=400):
    return jsonify({"success": False, "message": msg}), code

def _paginate_meta(p):
    return {
        "total":   p.total,
        "pages":   p.pages,
        "page":    p.page,
        "perPage": p.per_page,
        "hasNext": p.has_next,
        "hasPrev": p.has_prev,
    }

def _parse_include(args) -> dict:
    """Đọc query params include_patient, include_doctor, include_appointment."""
    return {
        "include_patient":     args.get("include_patient",     "false").lower() == "true",
        "include_doctor":      args.get("include_doctor",      "false").lower() == "true",
        "include_appointment": args.get("include_appointment", "false").lower() == "true",
    }


# ══════════════════════════════════════════════════════════════════
# CRUD
# ══════════════════════════════════════════════════════════════════

@review_bp.route("", methods=["POST"])
def create_review():
    """
    Tạo đánh giá mới.

    Body JSON:
      patientId*      int    — ID của bệnh nhân đánh giá
      appointmentId*  int    — ID lịch hẹn (phải COMPLETED, chưa có review)
      rating*         int    — 1 đến 5
      comment         str    — nội dung nhận xét (tùy chọn)

    Business rules được kiểm tra trong DAO:
      ✓ Appointment phải COMPLETED
      ✓ Appointment phải thuộc về patientId
      ✓ Mỗi appointment chỉ được đánh giá 1 lần
      ✓ Rating 1–5
    """
    d = request.get_json(silent=True) or {}

    missing = [f for f in ["patientId", "appointmentId", "rating"] if d.get(f) is None]
    if missing:
        return _err(f"Thiếu trường bắt buộc: {missing}")

    # Ép kiểu rating thành int (phòng trường hợp client gửi string)
    try:
        rating = int(d["rating"])
    except (ValueError, TypeError):
        return _err("rating phải là số nguyên.")

    review, err = ReviewDAO.create(
        patientId=d["patientId"],
        appointmentId=d["appointmentId"],
        rating=rating,
        comment=d.get("comment"),
    )
    if err:
        code = 404 if "tìm thấy" in err else 409 if "rồi" in err or "quyền" in err else 400
        return _err(err, code)

    return _ok(review.to_dict(), "Đánh giá đã được gửi thành công.", 201)


@review_bp.route("", methods=["GET"])
def list_reviews():
    """
    Danh sách đánh giá với filter + sắp xếp + phân trang.

    Query params:
      doctor_id    int
      patient_id   int
      min_rating   int   (1–5)
      max_rating   int   (1–5)
      sort_by      newest | oldest | rating_asc | rating_desc  (default: newest)
      page         int   (default: 1)
      per_page     int   (default: 20, max: 100)
      include_patient     true/false
      include_doctor      true/false
      include_appointment true/false
    """
    page     = max(1, request.args.get("page",     1,  type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    include  = _parse_include(request.args)

    pag = ReviewDAO.search(
        doctor_id  = request.args.get("doctor_id",  type=int),
        patient_id = request.args.get("patient_id", type=int),
        min_rating = request.args.get("min_rating", type=int),
        max_rating = request.args.get("max_rating", type=int),
        sort_by    = request.args.get("sort_by", "newest"),
        page=page, per_page=per_page,
    )

    return _ok(
        [r.to_dict(**include) for r in pag.items],
        pagination=_paginate_meta(pag),
    )


@review_bp.route("/<int:review_id>", methods=["GET"])
def get_review(review_id):
    """
    Chi tiết 1 đánh giá.

    Query params (tùy chọn):
      include_patient     true/false
      include_doctor      true/false
      include_appointment true/false
    """
    review = ReviewDAO.get_by_id(review_id)
    if not review:
        return _err("Không tìm thấy đánh giá.", 404)

    include = _parse_include(request.args)
    return _ok(review.to_dict(**include))


@review_bp.route("/<int:review_id>/detail", methods=["GET"])
def get_review_detail(review_id):
    """Full detail — bao gồm patient + doctor + appointment."""
    review = ReviewDAO.get_by_id(review_id)
    if not review:
        return _err("Không tìm thấy đánh giá.", 404)

    return _ok(review.to_dict(
        include_patient=True,
        include_doctor=True,
        include_appointment=True,
    ))


@review_bp.route("/<int:review_id>", methods=["PUT"])
def update_review(review_id):
    """
    Chỉnh sửa đánh giá (chỉ chủ sở hữu).

    Body JSON:
      patientId*  int   — dùng để xác thực quyền sở hữu
      rating      int   — 1–5 (tùy chọn)
      comment     str   (tùy chọn)
    """
    d = request.get_json(silent=True) or {}

    if not d.get("patientId"):
        return _err("Thiếu patientId để xác thực quyền sở hữu.")

    rating = None
    if "rating" in d:
        try:
            rating = int(d["rating"])
        except (ValueError, TypeError):
            return _err("rating phải là số nguyên.")

    review, err = ReviewDAO.update(
        review_id=review_id,
        patient_id=d["patientId"],
        rating=rating,
        comment=d.get("comment"),
    )
    if err:
        code = 404 if "tìm thấy" in err else 403 if "quyền" in err else 400
        return _err(err, code)

    return _ok(review.to_dict(), "Cập nhật đánh giá thành công.")


@review_bp.route("/<int:review_id>", methods=["DELETE"])
def delete_review(review_id):
    """
    Xoá đánh giá.
    - Patient xoá review của mình: truyền query param patient_id
    - Admin xoá: không cần truyền patient_id

    Query params:
      patient_id  int  (tùy chọn — bỏ qua nếu admin)
    """
    patient_id = request.args.get("patient_id", type=int)

    ok, err = ReviewDAO.delete(review_id, patient_id=patient_id)
    if not ok:
        code = 404 if "tìm thấy" in err else 403 if "quyền" in err else 400
        return _err(err, code)

    return _ok(msg="Đã xoá đánh giá.")


# ══════════════════════════════════════════════════════════════════
# TIỆN ÍCH
# ══════════════════════════════════════════════════════════════════

@review_bp.route("/appointment/<int:appointment_id>", methods=["GET"])
def get_review_by_appointment(appointment_id):
    """
    Lấy review của một lịch hẹn cụ thể.
    Trả về 404 nếu chưa có review.
    """
    review = ReviewDAO.get_by_appointment(appointment_id)
    if not review:
        return _err("Lịch hẹn này chưa có đánh giá.", 404)

    include = _parse_include(request.args)
    return _ok(review.to_dict(**include))


@review_bp.route("/doctor/<int:doctor_id>", methods=["GET"])
def get_doctor_reviews(doctor_id):
    """
    Tất cả review của một bác sĩ.

    Query params: sort_by, min_rating, max_rating, page, per_page,
                  include_patient, include_appointment
    """
    page     = max(1, request.args.get("page",     1,  type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    include  = _parse_include(request.args)

    pag = ReviewDAO.search(
        doctor_id  = doctor_id,
        min_rating = request.args.get("min_rating", type=int),
        max_rating = request.args.get("max_rating", type=int),
        sort_by    = request.args.get("sort_by", "newest"),
        page=page, per_page=per_page,
    )

    return _ok(
        [r.to_dict(**include) for r in pag.items],
        pagination=_paginate_meta(pag),
    )


@review_bp.route("/doctor/<int:doctor_id>/stats", methods=["GET"])
def get_doctor_stats(doctor_id):
    """
    Thống kê rating của một bác sĩ.

    Response:
      {
        "doctorId": 1,
        "avgRating": 4.5,
        "totalReviews": 20,
        "distribution": { "1": 0, "2": 1, "3": 2, "4": 8, "5": 9 }
      }
    """
    stats = ReviewDAO.get_stats(doctor_id)
    return _ok(stats)


@review_bp.route("/patient/<int:patient_id>", methods=["GET"])
def get_patient_reviews(patient_id):
    """
    Tất cả review mà một bệnh nhân đã gửi.

    Query params: sort_by, page, per_page, include_doctor, include_appointment
    """
    page     = max(1, request.args.get("page",     1,  type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    include  = _parse_include(request.args)

    pag = ReviewDAO.search(
        patient_id = patient_id,
        sort_by    = request.args.get("sort_by", "newest"),
        page=page, per_page=per_page,
    )

    return _ok(
        [r.to_dict(**include) for r in pag.items],
        pagination=_paginate_meta(pag),
    )