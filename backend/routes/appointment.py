from flask import Blueprint, request, jsonify
from datetime import datetime
from dao.appointment_dao import AppointmentDAO
from services.appointment_notifications import notify_appointment_created
from models.appointment import Appointment, AppointmentStatus
from db.db import db
from models.proxy_booking import ProxyBooking
from models.patient import Patient

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


# =========================
# CREATE APPOINTMENT
# =========================
@appointment_bp.route("", methods=["POST"])
def create_appointment():
    d = request.get_json(silent=True) or {}

    if not d.get("doctorId"):
        return _err("Thiếu doctorId")

    if not d.get("appointmentDate"):
        return _err("Thiếu appointmentDate")

    appt_date = _dt(d["appointmentDate"])
    if not appt_date:
        return _err("appointmentDate không hợp lệ")

    user_id = d.get("userId")
    patient_info = d.get("patientInfo")
    mode = d.get("mode")

    is_proxy = mode == "proxy"
    is_guest = not user_id and patient_info and not is_proxy

    if not user_id and not patient_info:
        return _err("Thiếu thông tin người đặt lịch")

    if (is_proxy or is_guest) and not patient_info.get("phone"):
        return _err("Thiếu số điện thoại")

    reason = d.get("reason") or "Đặt lịch khám"

    if is_proxy:
        reason = f"ĐẶT HỘ | {patient_info.get('lastName')} {patient_info.get('firstName')} "

    if is_guest:
        reason = f"KHÁCH |  {patient_info.get('lastName')} {patient_info.get('firstName')} "

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


# =========================
# GET APPOINTMENTS
# =========================
@appointment_bp.route("", methods=["GET"])
def get_appointments():
    try:
        user_id = request.args.get("userId", type=int)
        phone = request.args.get("phone")

        query = Appointment.query

        if user_id:
            patient = Patient.query.filter_by(userID=user_id).first()
            if not patient:
                return _ok([])
            query = query.filter_by(patientId=patient.patientID)

        elif phone:
            query = query.join(ProxyBooking).filter(
                ProxyBooking.phone == phone
            )

        else:
            return _err("Thiếu userId hoặc phone")

        data = [
            appt.to_dict()
            for appt in query.order_by(Appointment.createdAt.desc()).all()
        ]

        return _ok(data)

    except Exception as e:
        return _err(str(e), 500)


# =========================
# CANCEL
# =========================
@appointment_bp.route("/<int:id>/cancel", methods=["POST"])
def cancel_appointment(id):

    appt = Appointment.query.get(id)

    if not appt:
        return _err("Không tìm thấy", 404)

    if appt.status == AppointmentStatus.COMPLETED:
        return _err("Không thể huỷ lịch đã hoàn thành")

    appt.status = AppointmentStatus.CANCELLED
    appt.cancelReason = request.get_json().get("reason", "Bệnh nhân tự huỷ lịch")
    appt.updatedAt = datetime.now()

    db.session.commit()

    return _ok(appt.to_dict(), "Đã huỷ lịch")