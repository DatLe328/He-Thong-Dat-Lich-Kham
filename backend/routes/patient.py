from datetime import datetime

from flask import Blueprint, jsonify, request

from dao.patient_dao import PatientDAO

patient_bp = Blueprint("patient", __name__, url_prefix="/api/patients")


def _date(v):
    try:
        return datetime.strptime(v, "%Y-%m-%d").date() if v else None
    except ValueError:
        return None


def _paginate_meta(p):
    return {
        "total": p.total,
        "pages": p.pages,
        "page": p.page,
        "perPage": p.per_page,
        "hasNext": p.has_next,
        "hasPrev": p.has_prev,
    }


def _not_found():
    return jsonify({"success": False, "message": "Không tìm thấy bệnh nhân."}), 404


@patient_bp.route("", methods=["POST"])
def create_patient():
    d = request.get_json(silent=True) or {}
    missing = [f for f in ["firstName", "lastName", "email", "password"] if not d.get(f)]
    if missing:
        return jsonify({"success": False, "message": f"Thiếu trường: {missing}"}), 400

    date_of_birth = _date(d.get("dateOfBirth"))
    if d.get("dateOfBirth") and not date_of_birth:
        return jsonify({"success": False, "message": "dateOfBirth không hợp lệ."}), 400

    try:
        patient = PatientDAO.create(
            firstName=d["firstName"],
            lastName=d["lastName"],
            email=d["email"].strip().lower(),
            password=d["password"],
            phone=d.get("phone"),
            gender=d.get("gender"),
            dateOfBirth=date_of_birth,
            address=d.get("address"),
            insuranceId=d.get("insuranceId"),
            bloodType=d.get("bloodType"),
        )
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 409

    return jsonify({
        "success": True,
        "message": "Tạo bệnh nhân thành công.",
        "data": patient.to_dict(),
    }), 201


@patient_bp.route("", methods=["GET"])
def list_patients():
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))
    keyword = request.args.get("keyword", "").strip() or None

    pag = PatientDAO.search(keyword=keyword, page=page, per_page=per_page)
    return jsonify({
        "success": True,
        "data": [patient.to_dict() for patient in pag.items],
        "pagination": _paginate_meta(pag),
    }), 200


@patient_bp.route("/<int:patient_id>", methods=["GET"])
def get_patient(patient_id):
    patient = PatientDAO.get_by_id(patient_id)
    if not patient:
        return _not_found()
    return jsonify({"success": True, "data": patient.to_dict()}), 200


@patient_bp.route("/<int:patient_id>", methods=["PUT"])
def update_patient(patient_id):
    d = request.get_json(silent=True) or {}
    if "dateOfBirth" in d:
        date_of_birth = _date(d.get("dateOfBirth"))
        if d.get("dateOfBirth") and not date_of_birth:
            return jsonify({"success": False, "message": "dateOfBirth không hợp lệ."}), 400
        d["dateOfBirth"] = date_of_birth

    patient = PatientDAO.update_profile(patient_id, **d)
    if not patient:
        return _not_found()
    return jsonify({
        "success": True,
        "message": "Cập nhật bệnh nhân thành công.",
        "data": patient.to_dict(),
    }), 200


@patient_bp.route("/<int:patient_id>", methods=["DELETE"])
def delete_patient(patient_id):
    if not PatientDAO.delete(patient_id):
        return _not_found()
    return jsonify({"success": True, "message": "Đã xoá hồ sơ bệnh nhân."}), 200
