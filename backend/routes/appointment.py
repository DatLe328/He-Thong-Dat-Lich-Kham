from flask import Blueprint, request, jsonify
from datetime import datetime
from dao.appointment_dao import AppointmentDAO

appointment_bp = Blueprint("appointment", __name__, url_prefix="/api/appointments")


def _dt(v: str):
    if not v:
        return None
    try:
        return datetime.strptime(v, "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        try:
            return datetime.strptime(v, "%Y-%m-%dT%H:%M")
        except ValueError:
            return None


def _err(msg, code=400):
    return jsonify({"success": False, "message": msg}), code


def _ok(data=None, msg="OK", code=200):
    return jsonify({"success": True, "message": msg, "data": data}), code


@appointment_bp.route("", methods=["POST"])
def create_appointment():
    d = request.get_json(silent=True) or {}

    # =========================
    # VALIDATION
    # =========================
    if not d.get("doctorId"):
        return _err("Thiếu doctorId")

    if not d.get("appointmentDate"):
        return _err("Thiếu appointmentDate")

    if not d.get("userId"):
        return _err("Thiếu userId")

    appt_date = _dt(d["appointmentDate"])
    if not appt_date:
        return _err("appointmentDate không hợp lệ")

    # =========================
    # MODE
    # =========================
    mode = d.get("mode", "self")
    is_proxy = mode == "proxy"

    patient_info = d.get("patientInfo") if is_proxy else None

    # =========================
    # BUILD REASON (FIX QUAN TRỌNG)
    # =========================
    reason = d.get("reason")

    if is_proxy and patient_info:
        reason = (
            f"ĐẶT HỘ | "
            f"Tên: {patient_info.get('name')} | "
            f"SĐT: {patient_info.get('phone')} | "
            f"GT: {patient_info.get('gender')} | "
            f"ĐC: {patient_info.get('address')}"
        )

    # =========================
    # CALL DAO
    # =========================
    appt, err = AppointmentDAO.create(
        userId=d["userId"],
        doctorId=d["doctorId"],
        appointmentDate=appt_date,
        scheduleId=d.get("scheduleId"),
        clinicId=d.get("clinicId"),
        reason=reason,
        isProxy=is_proxy,
        patientInfo=patient_info
    )

    if err:
        return _err(err, 409)

    return _ok(appt.to_dict(), "Đặt lịch thành công", 201)