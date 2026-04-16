from typing import Optional
from sqlalchemy import or_, func
from db.db import db
from models.user    import User, UserRole
from models.doctor  import Doctor
from models.appointment import Appointment, AppointmentStatus
from datetime import datetime


class DoctorDAO:

    # ── CREATE ────────────────────────────────────────────────────
    @staticmethod
    def create(
        firstName: str, lastName: str, email: str, password: str,
        specialization: str = None, licenseNumber: str = None,
        bio: str = None, clinicID: int = None,
        phone: str = None, gender: str = None,
        dateOfBirth=None, address: str = None,
    ) -> Doctor:
        user = User(
            firstName=firstName, lastName=lastName,
            email=email, phone=phone, gender=gender,
            dateOfBirth=dateOfBirth, address=address,
            role=UserRole.DOCTOR,
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()

        doctor = Doctor(
            userID=user.userID,
            clinicID=clinicID,
            specialization=specialization,
            licenseNumber=licenseNumber,
            bio=bio,
        )
        db.session.add(doctor)
        db.session.commit()
        db.session.refresh(doctor)
        return doctor

    # ── READ ──────────────────────────────────────────────────────
    @staticmethod
    def get_by_id(doctor_id: int) -> Optional[Doctor]:
        return Doctor.query.get(doctor_id)

    @staticmethod
    def get_by_user_id(user_id: int) -> Optional[Doctor]:
        return Doctor.query.filter_by(userID=user_id).first()

    @staticmethod
    def get_by_license(license_number: str) -> Optional[Doctor]:
        return Doctor.query.filter_by(licenseNumber=license_number).first()

    @staticmethod
    def search(keyword: str = None, specialization: str = None,
               clinic_id: int = None, page: int = 1, per_page: int = 20):
        q = Doctor.query.join(User)
        if keyword:
            like = f"%{keyword}%"
            q = q.filter(or_(
                User.firstName.ilike(like), User.lastName.ilike(like),
                Doctor.bio.ilike(like), User.email.ilike(like),
                User.phone.ilike(like),
                Doctor.specialization.ilike(like),
                Doctor.licenseNumber.ilike(like),
            ))
        if specialization:
            q = q.filter(Doctor.specialization.ilike(f"%{specialization}%"))
        if clinic_id:
            q = q.filter(Doctor.clinicID == clinic_id)
        return q.paginate(page=page, per_page=per_page, error_out=False)

    # ── UPDATE ────────────────────────────────────────────────────
    @staticmethod
    def update_profile(doctor_id: int, **kwargs) -> Optional[Doctor]:
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return None

        doctor_fields = {"specialization", "licenseNumber", "bio", "clinicID"}
        user_fields   = {"phone", "gender", "dateOfBirth", "address", "firstName", "lastName"}

        for key, value in kwargs.items():
            if value is None:
                continue
            if key in doctor_fields:
                setattr(doctor, key, value)
            elif key in user_fields and doctor.user:
                setattr(doctor.user, key, value)

        db.session.commit()
        db.session.refresh(doctor)
        return doctor

    @staticmethod
    def update_rating(doctor_id: int) -> Optional[Doctor]:
        """Recalculate rating from all reviews."""
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return None
        from models.review import Review
        avg = db.session.query(func.avg(Review.rating)).filter_by(
            doctorId=doctor_id
        ).scalar()
        doctor.rating = round(float(avg), 2) if avg else 0.0
        db.session.commit()
        db.session.refresh(doctor)
        return doctor

    # ── DELETE ────────────────────────────────────────────────────
    @staticmethod
    def delete(doctor_id: int) -> bool:
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return False
        doctor.user.role = UserRole.PATIENT
        db.session.delete(doctor)
        db.session.commit()
        return True

    @staticmethod
    def hard_delete(doctor_id: int) -> bool:
        doctor = Doctor.query.get(doctor_id)
        if not doctor:
            return False
        db.session.delete(doctor.user)   # cascade deletes doctor
        db.session.commit()
        return True

    # ── APPOINTMENTS ──────────────────────────────────────────────
    @staticmethod
    def get_appointments(doctor_id: int, status: str = None, upcoming_only=False):
        q = Appointment.query.filter_by(doctorId=doctor_id)
        if status:
            try:
                q = q.filter_by(status=AppointmentStatus[status.upper()])
            except KeyError:
                pass
        if upcoming_only:
            q = q.filter(Appointment.appointmentDate >= datetime.utcnow())
        return q.order_by(Appointment.appointmentDate).all()

    @staticmethod
    def reschedule_appointment(appointment_id: int, new_date: datetime,
                                new_schedule_id: int = None) -> Optional[Appointment]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None
        appt.appointmentDate = new_date
        if new_schedule_id:
            appt.scheduleId = new_schedule_id
        db.session.commit()
        return appt

    @staticmethod
    def cancel_appointment(appointment_id: int, reason: str = None) -> Optional[Appointment]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None
        appt.cancel(reason)
        db.session.commit()
        return appt
