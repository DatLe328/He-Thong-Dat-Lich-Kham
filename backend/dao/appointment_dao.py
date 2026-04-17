from __future__ import annotations
from datetime import datetime

from sqlalchemy import func
from db.db import db

from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.user import User


class AppointmentDAO:
    @staticmethod
    def create(
        userId: int,
        doctorId: int,
        appointmentDate: datetime,
        scheduleId: int = None,
        clinicId: int = None,
        reason: str = None,
        isProxy: bool = False,
        patientInfo: dict = None
    ):
        if not isProxy:
            patient = Patient.query.filter_by(userID=userId).first()

            if not patient:
                patient = Patient(userID=userId)
                db.session.add(patient)
                db.session.flush()
        else:
            if not patientInfo:
                return None, "Thiếu thông tin bệnh nhân"

            email = patientInfo.get("email")
            first_name = patientInfo.get("firstName")

            if not email or not first_name:
                return None, "Thiếu thông tin patient"

            user = User.query.filter_by(email=email).first()

            if not user:
                user = User(
                    email=email,
                    firstName=first_name,
                    lastName=patientInfo.get("lastName"),
                    role="PATIENT"
                )
                db.session.add(user)
                db.session.flush()

            patient = Patient.query.filter_by(userID=user.userID).first()

            if not patient:
                patient = Patient(userID=user.userID)
                db.session.add(patient)
                db.session.flush()

        if scheduleId:
            conflict_msg = AppointmentDAO._check_slot_conflict(
                scheduleId, appointmentDate
            )
            if conflict_msg:
                return None, conflict_msg

        appt = Appointment(
            patientId=patient.patientID,
            doctorId=doctorId,
            scheduleId=scheduleId,
            clinicId=clinicId,
            appointmentDate=appointmentDate,
            reason=reason,
            status=AppointmentStatus.PENDING,
        )

        db.session.add(appt)
        db.session.commit()

        AppointmentDAO._notify(
            userId=patient.userID,
            appointmentId=appt.appointmentId,
            message=f"Lịch hẹn #{appt.appointmentId} đã được tạo."
        )

        return appt, None

    @staticmethod
    def _check_slot_conflict(schedule_id, appointment_date):
        schedule = Schedule.query.get(schedule_id)
        if not schedule:
            return "Schedule not found"

        if not schedule.isAvailable:
            return "Schedule closed"

        if appointment_date.date() != schedule.workDate:
            return "Wrong date"

        appt_time = appointment_date.time()

        if not (schedule.startTime <= appt_time < schedule.endTime):
            return "Out of working hours"

        conflicts = Appointment.query.filter(
            Appointment.scheduleId == schedule_id,
            Appointment.status != AppointmentStatus.CANCELLED
        ).all()

        for c in conflicts:
            if c.appointmentDate.time() == appt_time:
                return "Slot already booked"

        return None

    @staticmethod
    def _notify(userId, appointmentId, message):
        notif = Notification(
            userId=userId,
            appointmentId=appointmentId,
            message=message,
            channel="IN_APP",
        )
        db.session.add(notif)
        db.session.commit()