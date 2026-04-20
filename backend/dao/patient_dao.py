from typing import Optional

from sqlalchemy import or_

from db.db import db
from models.patient import Patient
from models.user import User, UserRole


def _build_full_name(first_name: str = None, last_name: str = None) -> str:
    return " ".join(
        part.strip() for part in [first_name or "", last_name or ""] if part and part.strip()
    )


class PatientDAO:
    @staticmethod
    def create(
        firstName: str,
        lastName: str,
        email: str,
        password: str,
        phone: str = None,
        gender: str = None,
        dateOfBirth=None,
        address: str = None,
        insuranceId: str = None,
        bloodType: str = None,
    ) -> Patient:
        user = User.query.filter_by(email=email).first()
        if user and user.patient:
            raise ValueError("Email đã tồn tại.")

        if not user:
            user = User(
                firstName=firstName,
                lastName=lastName,
                email=email,
                phone=phone,
                gender=gender,
                dateOfBirth=dateOfBirth,
                address=address,
                role=UserRole.PATIENT,
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

        patient = Patient(
            userID=user.userID,
            fullName=_build_full_name(firstName, lastName),
            phone=phone,
            gender=gender,
            dateOfBirth=dateOfBirth,
            address=address,
            insuranceId=insuranceId,
            bloodType=bloodType,
        )
        db.session.add(patient)
        db.session.commit()
        db.session.refresh(patient)
        return patient

    @staticmethod
    def get_by_id(patient_id: int) -> Optional[Patient]:
        return db.session.get(Patient, patient_id)

    @staticmethod
    def search(keyword: str = None, page: int = 1, per_page: int = 20):
        q = Patient.query.join(User)
        if keyword:
            like = f"%{keyword}%"
            q = q.filter(
                or_(
                    User.firstName.ilike(like),
                    User.lastName.ilike(like),
                    User.email.ilike(like),
                    User.phone.ilike(like),
                    Patient.insuranceId.ilike(like),
                    Patient.bloodType.ilike(like),
                )
            )
        return q.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def update_profile(patient_id: int, **kwargs) -> Optional[Patient]:
        patient = db.session.get(Patient, patient_id)
        if not patient:
            return None

        patient_fields = {"insuranceId", "bloodType"}
        user_fields = {
            "firstName",
            "lastName",
            "phone",
            "gender",
            "dateOfBirth",
            "address",
        }

        for key, value in kwargs.items():
            if value is None:
                continue
            if key in patient_fields:
                setattr(patient, key, value)
            elif key in user_fields and patient.user:
                setattr(patient.user, key, value)
                if hasattr(patient, key):
                    setattr(patient, key, value)

        if patient.user and ("firstName" in kwargs or "lastName" in kwargs):
            patient.fullName = _build_full_name(
                patient.user.firstName,
                patient.user.lastName,
            )

        db.session.commit()
        db.session.refresh(patient)
        return patient

    @staticmethod
    def delete(patient_id: int) -> bool:
        patient = db.session.get(Patient, patient_id)
        if not patient:
            return False
        db.session.delete(patient)
        db.session.commit()
        return True
