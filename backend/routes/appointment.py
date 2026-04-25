from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta, timezone
from dateutil import parser
import threading

from db.db import db
from dao.appointment_dao import AppointmentDAO
from models.appointment import Appointment, AppointmentStatus
from services.appointment_notifications import (
    notify_appointment_created,
    notify_appointment_cancelled
)
from models.proxy_booking import ProxyBooking
appointment_bp = Blueprint("appointment", __name__, url_prefix="/api/appointments")



def now():
    return datetime.now(timezone.utc)


def parse_datetime(value: str):
    if not value:
        return None
    try:
        value = value.replace(" ", "T") if "T" not in value else value
        dt = parser.isoparse(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except:
        return None


def err(msg, code=400):
    return jsonify({"success": False, "message": msg}), code


def ok(data=None, msg="OK", code=200):
    return jsonify({"success": True, "message": msg, "data": data}), code



def send_async_email(app, appt_id, patient_info=None, mode="create"):
    with app.app_context():
        try:
            appt = (
                db.session.query(Appointment)
                .filter_by(appointmentId=appt_id)
                .first()
            )


            _ = appt.patient
            _ = appt.patient.user if appt.patient else None
            _ = appt.doctor
            _ = appt.doctor.user if appt.doctor else None
            _ = appt.clinic
            _ = appt.schedule


            if not patient_info:
                patient_info = {
                    "email": appt.patient.user.email if appt.patient and appt.patient.user else None,
                    "firstName": appt.patient.user.firstName if appt.patient and appt.patient.user else None,
                    "lastName": appt.patient.user.lastName if appt.patient and appt.patient.user else None,
                }
            else:

                patient_info["email"] = patient_info.get("email") or (appt.patient.user.email if appt.patient and appt.patient.user else None)
                patient_info["firstName"] = patient_info.get("firstName") or (appt.patient.user.firstName if appt.patient and appt.patient.user else None)
                patient_info["lastName"] = patient_info.get("lastName") or (appt.patient.user.lastName if appt.patient and appt.patient.user else None)

            if mode == "create":
                notify_appointment_created(appt, patient_info=patient_info)

            elif mode == "cancel":
                notify_appointment_cancelled(appt)

        except Exception as e:
            app.logger.error(f"LỖI GỬI MAIL NGẦM: {e}")



@appointment_bp.route("", methods=["GET"])
def get_appointments():
    try:
        user_id = request.args.get("userId")
        doctor_id = request.args.get("doctorId")
        phone = request.args.get("phone")

        query = Appointment.query


        if user_id:
            query = query.filter(Appointment.patient.has(userID=user_id))


        elif phone:


            query = query.join(ProxyBooking, Appointment.appointmentId == ProxyBooking.appointmentId) \
                .filter(ProxyBooking.phone == phone)

        if doctor_id:
            query = query.filter_by(doctorId=doctor_id)

        appointments = query.order_by(Appointment.createdAt.desc()).all()

        return ok([a.to_dict() for a in appointments])

    except Exception as e:
        print(f"GET APPOINTMENTS ERROR: {e}")
        return err(str(e), 500)



@appointment_bp.route("", methods=["POST"])
def create_appointment():
    try:
        d = request.get_json(silent=True) or {}
        appointment_date = parse_datetime(d.get("appointmentDate"))

        if not appointment_date:
            return err("Ngày hẹn không hợp lệ")

        user_id = d.get("userId")
        patient_info = d.get("patientInfo")
        doctor_id = d.get("doctorId")
        schedule_id = d.get("scheduleId")
        clinic_id = d.get("clinicId")

        if not user_id:
            reason = "Đặt lịch khách vãng lai"
        elif not patient_info:
            reason = "Đặt lịch khám"
        else:
            reason = "Đặt hộ người thân"

        appt, error = AppointmentDAO.create(
            userId=user_id,
            doctorId=doctor_id,
            appointmentDate=appointment_date,
            scheduleId=schedule_id,
            clinicId=clinic_id,
            patientInfo=patient_info,
            reason=d.get("reason") or reason
        )

        if error:
            return err(error, 409)

        _now = datetime.now()
        appt.status = AppointmentStatus.PENDING
        appt.createdAt = _now
        appt.updatedAt = _now
        appt.paymentLocked = True
        appt.expiresAt = _now + timedelta(minutes=5)

        db.session.commit()
        db.session.refresh(appt)

        app = current_app._get_current_object()
        appt_id = appt.appointmentId


        safe_patient_info = {
            "email": (patient_info or {}).get("email"),
            "firstName": (patient_info or {}).get("firstName"),
            "lastName": (patient_info or {}).get("lastName"),
            "phone": (patient_info or {}).get("phone"),
        }



        return ok({
            "appointmentId": appt.appointmentId,
            "status": appt.status.value,
            "expiresAt": appt.expiresAt.isoformat()
        }, "Tạo lịch thành công", 201)

    except Exception as e:
        db.session.rollback()
        return err(str(e), 500)



@appointment_bp.route("/<int:id>/cancel", methods=["POST"])
def cancel_appointment(id):
    try:
        appt = Appointment.query.get(id)

        if not appt:
            return err("Không tìm thấy lịch hẹn", 404)

        if appt.status == AppointmentStatus.COMPLETED:
            return err("Không thể huỷ lịch đã hoàn thành")

        data = request.get_json(silent=True) or {}

        appt.status = AppointmentStatus.CANCELLED
        appt.cancelReason = data.get("reason", "Bệnh nhân tự huỷ lịch")
        appt.updatedAt = now()

        db.session.commit()
        db.session.refresh(appt)

        app = current_app._get_current_object()
        appt_id = appt.appointmentId

        threading.Thread(
            target=send_async_email,
            args=(app, appt_id, None, "cancel")
        ).start()

        return ok(appt.to_dict(), "Đã huỷ lịch")

    except Exception as e:
        db.session.rollback()
        return err(str(e), 500)