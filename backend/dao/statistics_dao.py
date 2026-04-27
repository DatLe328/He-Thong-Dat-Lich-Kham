from datetime import date, datetime, time, timedelta

from sqlalchemy import func,or_

from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.user import User


class StatisticsDAO:
    @staticmethod
    def _day_start(value: date):
        return datetime.combine(value, time.min) if value else None

    @staticmethod
    def _next_day_start(value: date):
        return datetime.combine(value + timedelta(days=1), time.min) if value else None

    @staticmethod
    def _apply_appointment_filters(query, start_date=None, end_date=None,
                                   doctor_id=None, clinic_id=None):
        if start_date:
            query = query.filter(Appointment.appointmentDate >= StatisticsDAO._day_start(start_date))
        if end_date:
            query = query.filter(Appointment.appointmentDate < StatisticsDAO._next_day_start(end_date))
        if doctor_id:
            query = query.filter(Appointment.doctorId == doctor_id)
        if clinic_id:
            query = query.filter(Appointment.clinicId == clinic_id)
        return query

    @staticmethod
    def _status_key(status):
        return status.value if hasattr(status, "value") else str(status)

    @staticmethod
    def _empty_status_counts():
        return {status.value: 0 for status in AppointmentStatus}

    @staticmethod
    def _date_key(value):
        return value.isoformat() if hasattr(value, "isoformat") else str(value)

    @staticmethod
    def appointments_by_status(start_date=None, end_date=None, doctor_id=None, clinic_id=None):
        query = db.session.query(
            Appointment.status,
            func.count(Appointment.appointmentId),
        )
        query = StatisticsDAO._apply_appointment_filters(
            query,
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        )

        result = StatisticsDAO._empty_status_counts()
        for status, total in query.group_by(Appointment.status).all():
            result[StatisticsDAO._status_key(status)] = int(total or 0)
        return result

    @staticmethod
    def daily_appointments(start_date=None, end_date=None, doctor_id=None, clinic_id=None):
        query = db.session.query(
            func.date(Appointment.appointmentDate).label("appointment_day"),
            func.count(Appointment.appointmentId).label("total"),
        )
        query = StatisticsDAO._apply_appointment_filters(
            query,
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        )
        rows = query.group_by("appointment_day").order_by("appointment_day").all()

        totals_by_day = {
            StatisticsDAO._date_key(row.appointment_day): int(row.total or 0)
            for row in rows
        }

        if start_date and end_date:
            data = []
            cursor = start_date
            while cursor <= end_date:
                key = cursor.isoformat()
                data.append({"date": key, "total": totals_by_day.get(key, 0)})
                cursor += timedelta(days=1)
            return data

        return [
            {"date": StatisticsDAO._date_key(row.appointment_day), "total": int(row.total or 0)}
            for row in rows
        ]

    @staticmethod
    def overview(start_date=None, end_date=None, doctor_id=None, clinic_id=None):
        appointments = StatisticsDAO._apply_appointment_filters(
            Appointment.query,
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        )
        scoped_all_time = StatisticsDAO._apply_appointment_filters(
            Appointment.query,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        )

        today = date.today()
        today_appointments = StatisticsDAO._apply_appointment_filters(
            Appointment.query,
            start_date=today,
            end_date=today,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        )
        upcoming_appointments = scoped_all_time.filter(
            Appointment.appointmentDate >= datetime.now(),
            Appointment.status != AppointmentStatus.CANCELLED,
        )

        registered_appointments = StatisticsDAO._apply_appointment_filters(
            db.session.query(Appointment).join(
                Patient, Appointment.patientId == Patient.patientID
            ),
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        ).filter(
            Patient.userID.isnot(None)
        ).count()
        guest_appointments = StatisticsDAO._apply_appointment_filters(
            db.session.query(Appointment).join(
                Patient, Appointment.patientId == Patient.patientID, isouter=True
            ),
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
            clinic_id=clinic_id,
        ).filter(
            or_(
                Patient.userID.is_(None),
                Patient.patientID.is_(None)
            )
        ).count()
        unique_patients = appointments.filter(Appointment.patientId.isnot(None)).with_entities(
            func.count(func.distinct(Appointment.patientId))
        ).scalar() or 0
        total_patients = db.session.query(func.count(Patient.patientID)).scalar() or 0
        total_doctors = db.session.query(func.count(Doctor.doctorID)).scalar() or 0
        total_clinics = db.session.query(func.count(Clinic.clinicID)).scalar() or 0

        return {
            "totalAppointments": appointments.count(),
            "todayAppointments": today_appointments.count(),
            "upcomingAppointments": upcoming_appointments.count(),
            "registeredAppointments": registered_appointments,
            "guestAppointments": guest_appointments,
            "uniquePatients": int(unique_patients),
            "totalPatients": int(total_patients),
            "totalDoctors": int(total_doctors),
            "totalClinics": int(total_clinics),
            "appointmentsByStatus": StatisticsDAO.appointments_by_status(
                start_date=start_date,
                end_date=end_date,
                doctor_id=doctor_id,
                clinic_id=clinic_id,
            ),
            "dateRange": {
                "from": start_date.isoformat() if start_date else None,
                "to": end_date.isoformat() if end_date else None,
            },
        }

    @staticmethod
    def top_doctors(start_date=None, end_date=None, clinic_id=None, limit=5):
        query = db.session.query(
            Doctor.doctorID,
            User.firstName,
            User.lastName,
            Doctor.specialization,
            Doctor.rating,
            func.count(Appointment.appointmentId).label("totalAppointments"),
        ).join(Appointment, Appointment.doctorId == Doctor.doctorID).join(
            User, User.userID == Doctor.userID
        )
        query = StatisticsDAO._apply_appointment_filters(
            query,
            start_date=start_date,
            end_date=end_date,
            clinic_id=clinic_id,
        )

        rows = query.group_by(
            Doctor.doctorID,
            User.firstName,
            User.lastName,
            Doctor.specialization,
            Doctor.rating,
        ).order_by(func.count(Appointment.appointmentId).desc()).limit(limit).all()

        return [
            {
                "doctorID": row.doctorID,
                "doctorName": f"{row.firstName} {row.lastName}".strip(),
                "specialization": row.specialization,
                "rating": row.rating,
                "totalAppointments": int(row.totalAppointments or 0),
            }
            for row in rows
        ]

    @staticmethod
    def top_clinics(start_date=None, end_date=None, doctor_id=None, limit=5):
        query = db.session.query(
            Clinic.clinicID,
            Clinic.name,
            Clinic.address,
            func.count(Appointment.appointmentId).label("totalAppointments"),
        ).join(Appointment, Appointment.clinicId == Clinic.clinicID)
        query = StatisticsDAO._apply_appointment_filters(
            query,
            start_date=start_date,
            end_date=end_date,
            doctor_id=doctor_id,
        )

        rows = query.group_by(
            Clinic.clinicID,
            Clinic.name,
            Clinic.address,
        ).order_by(func.count(Appointment.appointmentId).desc()).limit(limit).all()

        return [
            {
                "clinicID": row.clinicID,
                "clinicName": row.name,
                "address": row.address,
                "totalAppointments": int(row.totalAppointments or 0),
            }
            for row in rows
        ]
