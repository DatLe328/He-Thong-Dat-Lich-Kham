from flask import Blueprint, request, jsonify
from datetime import datetime
from dao.doctor_dao import DoctorDAO

doctor_bp = Blueprint("doctor", __name__, url_prefix="/api/doctors")


def _date(v):
    try:
        return datetime.strptime(v, "%Y-%m-%d").date() if v else None
    except ValueError:
        return None

def _datetime(v):
    try:
        return datetime.fromisoformat(v) if v else None
    except ValueError:
        return None

def _paginate_meta(p):
    return {"total": p.total, "pages": p.pages, "page": p.page,
            "perPage": p.per_page, "hasNext": p.has_next, "hasPrev": p.has_prev}

def _not_found():
    return jsonify({"success": False, "message": "Không tìm thấy bác sĩ."}), 404


@doctor_bp.route("", methods=["POST"])
def create_doctor():
    d = request.get_json(silent=True) or {}
    missing = [f for f in ["firstName", "lastName", "email", "password"] if not d.get(f)]
    if missing:
        return jsonify({"success": False, "message": f"Thiếu trường: {missing}"}), 400

    try:
        doctor = DoctorDAO.create(
            firstName=d["firstName"], lastName=d["lastName"],
            email=d["email"],        password=d["password"],
            specialization=d.get("specialization"),
            licenseNumber =d.get("licenseNumber"),
            bio           =d.get("bio"),
            clinicID      =d.get("clinicID"),
            phone         =d.get("phone"),
            gender        =d.get("gender"),
            dateOfBirth   =_date(d.get("dateOfBirth")),
            address       =d.get("address"),
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 409

    return jsonify({"success": True, "message": "Tạo bác sĩ thành công.", "data": doctor.to_dict()}), 201


@doctor_bp.route("", methods=["GET"])
def list_doctors():
    page     = max(1, request.args.get("page",      1,  type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    keyword  = request.args.get("keyword",       "").strip() or None
    spec     = request.args.get("specialization","").strip() or None
    clinic   = request.args.get("clinic_id",     type=int)

    pag = DoctorDAO.search(keyword=keyword, specialization=spec,
                            clinic_id=clinic, page=page, per_page=per_page)
    return jsonify({
        "success":    True,
        "data":       [doc.to_dict() for doc in pag.items],
        "pagination": _paginate_meta(pag),
    }), 200


@doctor_bp.route("/<int:doctor_id>", methods=["GET"])
def get_doctor(doctor_id):
    doctor = DoctorDAO.get_by_id(doctor_id)
    if not doctor:
        return _not_found()
    include_clinic = request.args.get("include_clinic", "false").lower() == "true"
    return jsonify({"success": True, "data": doctor.to_dict(include_clinic=include_clinic)}), 200


@doctor_bp.route("/<int:doctor_id>", methods=["PUT"])
def update_doctor(doctor_id):
    d = request.get_json(silent=True) or {}
    if "dateOfBirth" in d:
        d["dateOfBirth"] = _date(d["dateOfBirth"])

    doctor = DoctorDAO.update_profile(doctor_id, **d)
    if not doctor:
        return _not_found()
    return jsonify({"success": True, "message": "Cập nhật thành công.", "data": doctor.to_dict()}), 200


@doctor_bp.route("/<int:doctor_id>", methods=["DELETE"])
def delete_doctor(doctor_id):
    if not DoctorDAO.delete(doctor_id):
        return _not_found()
    return jsonify({"success": True, "message": "Đã xoá profile bác sĩ."}), 200


@doctor_bp.route("/<int:doctor_id>/hard", methods=["DELETE"])
def hard_delete_doctor(doctor_id):
    if not DoctorDAO.hard_delete(doctor_id):
        return _not_found()
    return jsonify({"success": True, "message": "Đã xoá hoàn toàn bác sĩ và tài khoản."}), 200


@doctor_bp.route("/<int:doctor_id>/appointments", methods=["GET"])
def get_appointments(doctor_id):
    if not DoctorDAO.get_by_id(doctor_id):
        return _not_found()

    status   = request.args.get("status")
    upcoming = request.args.get("upcoming", "false").lower() == "true"

    appointments = DoctorDAO.get_appointments(doctor_id, status=status, upcoming_only=upcoming)
    return jsonify({
        "success": True,
        "data":    [a.to_dict() for a in appointments],
        "total":   len(appointments),
    }), 200


@doctor_bp.route("/<int:doctor_id>/appointments/<int:appt_id>/reschedule", methods=["PATCH"])
def reschedule_appointment(doctor_id, appt_id):
    if not DoctorDAO.get_by_id(doctor_id):
        return _not_found()

    d        = request.get_json(silent=True) or {}
    new_date = _datetime(d.get("appointmentDate"))
    if not new_date:
        return jsonify({"success": False, "message": "appointmentDate không hợp lệ (ISO format)."}), 400

    appt = DoctorDAO.reschedule_appointment(
        appt_id, new_date, new_schedule_id=d.get("scheduleId")
    )
    if not appt:
        return jsonify({"success": False, "message": "Không tìm thấy lịch hẹn."}), 404

    return jsonify({"success": True, "message": "Đã dời lịch hẹn.", "data": appt.to_dict()}), 200


@doctor_bp.route("/<int:doctor_id>/appointments/<int:appt_id>/cancel", methods=["PATCH"])
def cancel_appointment(doctor_id, appt_id):
    if not DoctorDAO.get_by_id(doctor_id):
        return _not_found()

    d    = request.get_json(silent=True) or {}
    appt = DoctorDAO.cancel_appointment(appt_id, reason=d.get("reason"))
    if not appt:
        return jsonify({"success": False, "message": "Không tìm thấy lịch hẹn."}), 404

    return jsonify({"success": True, "message": "Đã huỷ lịch hẹn.", "data": appt.to_dict()}), 200


@doctor_bp.route("/<int:doctor_id>/schedules", methods=["GET"])
def get_schedules(doctor_id):
    doctor = DoctorDAO.get_by_id(doctor_id)
    if not doctor:
        return _not_found()

    include_slots = request.args.get("slots", "false").lower() == "true"
    result = []
    for s in doctor.schedules:
        data = s.to_dict()
        if include_slots:
            data["slots"] = s.getAvailableSlots()
        result.append(data)

    return jsonify({"success": True, "data": result, "total": len(result)}), 200


@doctor_bp.route("/<int:doctor_id>/reviews", methods=["GET"])
def get_reviews(doctor_id):
    doctor = DoctorDAO.get_by_id(doctor_id)
    if not doctor:
        return _not_found()

    return jsonify({
        "success":     True,
        "data":        [r.to_dict() for r in doctor.reviews],
        "total":       len(doctor.reviews),
        "avgRating":   doctor.rating,
    }), 200