import os
import sys
import tempfile
import types
import unittest
from datetime import datetime
from pathlib import Path
from unittest.mock import patch

try:
    import requests  # type: ignore[import-not-found]
except ModuleNotFoundError:
    requests = types.ModuleType("requests")

    class RequestException(Exception):
        pass

    requests.RequestException = RequestException
    requests.post = lambda *args, **kwargs: None
    sys.modules["requests"] = requests

try:
    import flask_migrate  # type: ignore[import-not-found]
except ModuleNotFoundError:
    flask_migrate = types.ModuleType("flask_migrate")

    class Migrate:
        def init_app(self, *args, **kwargs):
            return None

    flask_migrate.Migrate = Migrate
    sys.modules["flask_migrate"] = flask_migrate

try:
    import dateutil  # type: ignore[import-not-found]
except ModuleNotFoundError:
    dateutil = types.ModuleType("dateutil")
    parser_module = types.ModuleType("dateutil.parser")

    def isoparse(value):
        return datetime.fromisoformat(value)

    parser_module.isoparse = isoparse
    dateutil.parser = parser_module
    sys.modules["dateutil"] = dateutil
    sys.modules["dateutil.parser"] = parser_module

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config import Config
from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.user import User, UserRole
from routes.chatbot import chatbot_bp


class ChatbotApiTestCase(unittest.TestCase):
    def setUp(self):
        self.db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.db_file.close()

        Config.SQLALCHEMY_DATABASE_URI = f"sqlite:///{self.db_file.name}"
        Config.SQLALCHEMY_TRACK_MODIFICATIONS = False

        self.app = create_app()
        self.app.config.update(TESTING=True)
        self.client = self.app.test_client()

        with self.app.app_context():
            db.drop_all()
            db.create_all()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()

        os.unlink(self.db_file.name)

    def make_user(self, first_name, last_name, email, phone, role):
        user = User(
            firstName=first_name,
            lastName=last_name,
            email=email,
            phone=phone,
            role=role,
        )
        user.set_password("secret123")
        db.session.add(user)
        db.session.flush()
        return user

    def make_patient(self, user):
        patient = Patient(
            userID=user.userID,
            fullName=f"{user.firstName} {user.lastName}",
            phone=user.phone,
        )
        db.session.add(patient)
        db.session.flush()
        return patient

    def make_clinic(self, name, phone):
        clinic = Clinic(
            name=name,
            address="123 Nguyen Trai",
            phone=phone,
            specialties="Tim mach, Da lieu",
        )
        db.session.add(clinic)
        db.session.flush()
        return clinic

    def make_doctor(self, user, clinic, specialization, license_number, rating):
        doctor = Doctor(
            userID=user.userID,
            clinicID=clinic.clinicID,
            specialization=specialization,
            licenseNumber=license_number,
            bio="Bac si kinh nghiem.",
            rating=rating,
        )
        db.session.add(doctor)
        db.session.flush()
        return doctor

    def make_appointment(self, patient, doctor, clinic, appointment_date, status):
        appointment = Appointment(
            patientId=patient.patientID if patient else None,
            doctorId=doctor.doctorID,
            clinicId=clinic.clinicID if clinic else None,
            appointmentDate=appointment_date,
            reason="Kham tong quat",
            status=status,
        )
        db.session.add(appointment)
        db.session.flush()
        return appointment

    def seed_chatbot_data(self):
        clinic = self.make_clinic("Phong kham Trung Tam", "19009999")

        doctor_user_a = self.make_user(
            "Minh",
            "An",
            "minh.an@example.com",
            "0901000001",
            UserRole.DOCTOR,
        )
        doctor_user_b = self.make_user(
            "Ha",
            "Tran",
            "ha.tran@example.com",
            "0901000002",
            UserRole.DOCTOR,
        )
        patient_user = self.make_user(
            "Lan",
            "Nguyen",
            "lan.nguyen@example.com",
            "0902000001",
            UserRole.PATIENT,
        )

        doctor_a = self.make_doctor(
            doctor_user_a,
            clinic,
            "Tim mach",
            "GP-001",
            4.9,
        )
        doctor_b = self.make_doctor(
            doctor_user_b,
            clinic,
            "Da lieu",
            "GP-002",
            4.2,
        )
        patient = self.make_patient(patient_user)

        appointment = self.make_appointment(
            patient,
            doctor_a,
            clinic,
            datetime(2099, 1, 1, 9, 0),
            AppointmentStatus.CONFIRMED,
        )

        db.session.commit()

        return {
            "clinic": clinic,
            "doctor_a": doctor_a,
            "doctor_b": doctor_b,
            "patient_user": patient_user,
            "appointment": appointment,
        }

    def test_chatbot_returns_400_when_question_missing(self):
        response = self.client.post("/api/chatbot/ask", json={})

        self.assertEqual(response.status_code, 400)
        body = response.get_json()
        self.assertFalse(body["success"])
        self.assertEqual(body["message"], "Thiếu question.")


if __name__ == "__main__":
    unittest.main()
