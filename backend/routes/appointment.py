from flask import Blueprint, request, jsonify
from datetime import datetime
from dao.appointment_dao import AppointmentDAO
from services.appointment_notifications import notify_appointment_created

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

    appt_date = _dt(d["appointmentDate"])
    if not appt_date:
        return _err("appointmentDate không hợp lệ")

    # =========================
    # MODE (FIX CHUẨN)
    # =========================
    user_id = d.get("userId")
    patient_info = d.get("patientInfo")
    mode = d.get("mode")  # 👈 QUAN TRỌNG

    is_proxy = mode == "proxy"   # ✅ chỉ proxy khi có mode
    is_guest = not user_id and patient_info and not is_proxy

    # =========================
    # VALIDATE
    # =========================
    if not user_id and not patient_info:
        return _err("Thiếu thông tin người đặt lịch")

    if (is_proxy or is_guest) and not patient_info.get("phone"):
        return _err("Thiếu số điện thoại")

    # =========================
    # BUILD REASON
    # =========================
    reason = d.get("reason")

    if not reason:
        if is_proxy:
            first = patient_info.get("firstName") or ""
            last = patient_info.get("lastName") or ""

            reason = (
                f"ĐẶT HỘ | "
                f"Tên: {last} {first} | "
                f"SĐT: {patient_info.get('phone', '')}"
            )

        elif is_guest:
            first = patient_info.get("firstName") or ""
            last = patient_info.get("lastName") or ""

            reason = (
                f"KHÁCH | "
                f"Tên: {last} {first} | "
                f"SĐT: {patient_info.get('phone', '')}"
            )
        else:
            reason = "Đặt lịch khám"

    # =========================
    # DAO CALL
    # =========================
    appt, err = AppointmentDAO.create(
        userId=user_id,
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

    notify_appointment_created(appt, patient_info=patient_info)

    return _ok(appt.to_dict(), "Đặt lịch thành công", 201)
