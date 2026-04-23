import os
import sys
import tempfile
import unittest
from datetime import date, datetime, time, timedelta
from pathlib import Path

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


class StatisticsApiTestCase(unittest.TestCase):
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
            self.seed_statistics_data()

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

    def make_patient(self, user, insurance_id, blood_type):
        patient = Patient(
            userID=user.userID,
            fullName=f"{user.firstName} {user.lastName}",
            phone=user.phone,
            insuranceId=insurance_id,
            bloodType=blood_type,
        )
        db.session.add(patient)
        db.session.flush()
        return patient

    def make_doctor(self, user, clinic, specialization, license_number, rating):
        doctor = Doctor(
            userID=user.userID,
            clinicID=clinic.clinicID,
            specialization=specialization,
            licenseNumber=license_number,
            rating=rating,
        )
        db.session.add(doctor)
        db.session.flush()
        return doctor

    def make_appointment(self, *, patient, doctor, clinic, appointment_date, status):
        appointment = Appointment(
            patientId=patient.patientID if patient else None,
            doctorId=doctor.doctorID,
            clinicId=clinic.clinicID,
            appointmentDate=appointment_date,
            reason="Đặt lịch khám",
            status=status,
        )
        db.session.add(appointment)
        db.session.flush()
        return appointment

    def seed_statistics_data(self):
        today = date.today()
        self.past_day = today - timedelta(days=1)
        self.today = today
        self.future_day = today + timedelta(days=1)
        self.future_day_2 = today + timedelta(days=2)

        clinic_a = Clinic(
            name="Phòng khám Trung Tâm",
            address="123 Nguyễn Trãi",
            phone="19009999",
            specialties="Tim mạch, Nội tổng quát",
        )
        clinic_b = Clinic(
            name="Phòng khám Bình An",
            address="456 Lê Lợi",
            phone="19008888",
            specialties="Da liễu",
        )
        db.session.add_all([clinic_a, clinic_b])
        db.session.flush()

        doctor_user_a = self.make_user(
            "Minh",
            "An",
            "minhan@example.com",
            "0901000001",
            UserRole.DOCTOR,
        )
        doctor_user_b = self.make_user(
            "Thu",
            "Ha",
            "thuha@example.com",
            "0901000002",
            UserRole.DOCTOR,
        )
        patient_user_a = self.make_user(
            "Lan",
            "Nguyen",
            "lan.nguyen@example.com",
            "0902000001",
            UserRole.PATIENT,
        )
        patient_user_b = self.make_user(
            "Nam",
            "Le",
            "nam.le@example.com",
            "0902000002",
            UserRole.PATIENT,
        )

        patient_a = self.make_patient(patient_user_a, "BH-001", "O")
        patient_b = self.make_patient(patient_user_b, "BH-002", "A")

        doctor_a = self.make_doctor(
            doctor_user_a,
            clinic_a,
            "Tim mạch",
            "GP-001",
            4.8,
        )
        doctor_b = self.make_doctor(
            doctor_user_b,
            clinic_b,
            "Da liễu",
            "GP-002",
            4.5,
        )

        self.clinic_a_id = clinic_a.clinicID
        self.clinic_b_id = clinic_b.clinicID
        self.doctor_a_id = doctor_a.doctorID
        self.doctor_b_id = doctor_b.doctorID

        self.make_appointment(
            patient=patient_a,
            doctor=doctor_a,
            clinic=clinic_a,
            appointment_date=datetime.combine(self.today, time.min),
            status=AppointmentStatus.CONFIRMED,
        )
        self.make_appointment(
            patient=patient_a,
            doctor=doctor_a,
            clinic=clinic_a,
            appointment_date=datetime.combine(self.future_day, time(10, 0)),
            status=AppointmentStatus.PENDING,
        )
        self.make_appointment(
            patient=None,
            doctor=doctor_a,
            clinic=clinic_a,
            appointment_date=datetime.combine(self.past_day, time(11, 0)),
            status=AppointmentStatus.CANCELLED,
        )
        self.make_appointment(
            patient=patient_b,
            doctor=doctor_b,
            clinic=clinic_b,
            appointment_date=datetime.combine(self.future_day_2, time(12, 0)),
            status=AppointmentStatus.COMPLETED,
        )
        self.make_appointment(
            patient=None,
            doctor=doctor_b,
            clinic=clinic_b,
            appointment_date=datetime.combine(self.past_day, time(13, 0)),
            status=AppointmentStatus.PENDING,
        )

        db.session.commit()

    def test_overview_returns_expected_aggregates(self):
        response = self.client.get("/api/statistics/overview")

        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        data = body["data"]

        self.assertTrue(body["success"])
        self.assertEqual(data["totalAppointments"], 5)
        self.assertEqual(data["todayAppointments"], 1)
        self.assertEqual(data["upcomingAppointments"], 2)
        self.assertEqual(data["registeredAppointments"], 3)
        self.assertEqual(data["guestAppointments"], 2)
        self.assertEqual(data["uniquePatients"], 2)
        self.assertEqual(data["totalPatients"], 2)
        self.assertEqual(data["totalDoctors"], 2)
        self.assertEqual(data["totalClinics"], 2)
        self.assertEqual(
            data["appointmentsByStatus"],
            {
                "PENDING": 2,
                "CONFIRMED": 1,
                "COMPLETED": 1,
                "CANCELLED": 1,
            },
        )
        self.assertEqual(data["dateRange"], {"from": None, "to": None})

    def test_overview_supports_date_and_entity_filters(self):
        response = self.client.get(
            f"/api/statistics/overview?from={self.past_day.isoformat()}"
            f"&to={self.future_day.isoformat()}"
            f"&doctor_id={self.doctor_a_id}&clinic_id={self.clinic_a_id}"
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]

        self.assertEqual(data["totalAppointments"], 3)
        self.assertEqual(data["todayAppointments"], 1)
        self.assertEqual(data["upcomingAppointments"], 1)
        self.assertEqual(data["registeredAppointments"], 2)
        self.assertEqual(data["guestAppointments"], 1)
        self.assertEqual(data["uniquePatients"], 1)
        self.assertEqual(
            data["appointmentsByStatus"],
            {
                "PENDING": 1,
                "CONFIRMED": 1,
                "COMPLETED": 0,
                "CANCELLED": 1,
            },
        )
        self.assertEqual(
            data["dateRange"],
            {"from": self.past_day.isoformat(), "to": self.future_day.isoformat()},
        )

    def test_daily_appointments_returns_zero_filled_series_for_date_range(self):
        response = self.client.get(
            f"/api/statistics/appointments/daily?from={self.past_day.isoformat()}"
            f"&to={self.future_day_2.isoformat()}"
            f"&doctor_id={self.doctor_a_id}&clinic_id={self.clinic_a_id}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["data"],
            [
                {"date": self.past_day.isoformat(), "total": 1},
                {"date": self.today.isoformat(), "total": 1},
                {"date": self.future_day.isoformat(), "total": 1},
                {"date": self.future_day_2.isoformat(), "total": 0},
            ],
        )

    def test_top_endpoints_return_ranked_results_with_filters_and_limit(self):
        top_doctors_response = self.client.get(
            f"/api/statistics/doctors/top?clinic_id={self.clinic_a_id}&limit=1"
        )
        self.assertEqual(top_doctors_response.status_code, 200)
        self.assertEqual(
            top_doctors_response.get_json()["data"],
            [
                {
                    "doctorID": self.doctor_a_id,
                    "doctorName": "Minh An",
                    "specialization": "Tim mạch",
                    "rating": 4.8,
                    "totalAppointments": 3,
                }
            ],
        )

        top_clinics_response = self.client.get(
            f"/api/statistics/clinics/top?doctor_id={self.doctor_b_id}&limit=1"
        )
        self.assertEqual(top_clinics_response.status_code, 200)
        self.assertEqual(
            top_clinics_response.get_json()["data"],
            [
                {
                    "clinicID": self.clinic_b_id,
                    "clinicName": "Phòng khám Bình An",
                    "address": "456 Lê Lợi",
                    "totalAppointments": 2,
                }
            ],
        )

    def test_statistics_endpoints_validate_query_params(self):
        invalid_from = self.client.get("/api/statistics/overview?from=2026/01/01")
        self.assertEqual(invalid_from.status_code, 400)
        self.assertEqual(
            invalid_from.get_json()["message"],
            "from phải có định dạng YYYY-MM-DD",
        )

        invalid_range = self.client.get("/api/statistics/appointments/status?from=2026-02-02&to=2026-02-01")
        self.assertEqual(invalid_range.status_code, 400)
        self.assertEqual(invalid_range.get_json()["message"], "from không được lớn hơn to")

        invalid_doctor = self.client.get("/api/statistics/appointments/daily?doctor_id=0")
        self.assertEqual(invalid_doctor.status_code, 400)
        self.assertEqual(invalid_doctor.get_json()["message"], "doctor_id phải lớn hơn 0")

        invalid_limit = self.client.get("/api/statistics/doctors/top?limit=abc")
        self.assertEqual(invalid_limit.status_code, 400)
        self.assertEqual(invalid_limit.get_json()["message"], "limit phải là số nguyên")


if __name__ == "__main__":
    unittest.main()
