from __future__ import annotations
from datetime import datetime
from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.user import User


class AppointmentDAO:
    @staticmethod
    def create(userId, doctorId, appointmentDate, scheduleId=None, clinicId=None, reason=None, isProxy=False,
               patientInfo=None):
        if not isProxy:
            patient = Patient.query.filter_by(userID=userId).first()
            if not patient:
                patient = Patient(userID=userId)
                db.session.add(patient)
                db.session.flush()
        else:
            if not patientInfo: return None, "Thiếu thông tin bệnh nhân"
            email = patientInfo.get("email")
            first_name = patientInfo.get("firstName")
            if not email or not first_name: return None, "Thiếu thông tin"

            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, firstName=first_name, lastName=patientInfo.get("lastName"), role="PATIENT")
                db.session.add(user)
                db.session.flush()
            patient = Patient.query.filter_by(userID=user.userID).first()
            if not patient:
                patient = Patient(userID=user.userID)
                db.session.add(patient)
                db.session.flush()

        if scheduleId:
            conflict_msg = AppointmentDAO._check_slot_conflict(scheduleId, appointmentDate)
            if conflict_msg: return None, conflict_msg

        try:
            appt = Appointment(
                patientId=patient.patientID,
                doctorId=doctorId,
                scheduleId=scheduleId,
                clinicId=clinicId,
                appointmentDate=appointmentDate,
                reason=reason,
                status=AppointmentStatus.PENDING
            )
            db.session.add(appt)
            db.session.flush()

            notif = Notification(
                userId=patient.userID,
                appointmentId=appt.appointmentId,
                message=f"Lịch hẹn #{appt.appointmentId} đã được tạo.",
                channel="IN_APP"
            )
            db.session.add(notif)
            db.session.commit()
            return appt, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    @staticmethod
    def _check_slot_conflict(schedule_id, appointment_date):
        schedule = Schedule.query.get(schedule_id)
        if not schedule or not schedule.isAvailable: return "Lịch không khả dụng"
        if appointment_date.date() != schedule.workDate: return "Sai ngày"

        appt_time = appointment_date.time()
        if not (schedule.startTime <= appt_time < schedule.endTime): return "Ngoài giờ làm việc"

        conflicts = Appointment.query.filter(
            Appointment.scheduleId == schedule_id,
            Appointment.status != AppointmentStatus.CANCELLED
        ).all()
        for c in conflicts:
            if c.appointmentDate.time() == appt_time: return "Khung giờ đã được đặt"
        return None