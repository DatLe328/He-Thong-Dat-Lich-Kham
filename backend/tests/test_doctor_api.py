import os
import sys
import tempfile
import unittest
from datetime import date, datetime, time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config import Config
from db.db import db
from models.appointment import Appointment
from models.clinic import Clinic
from models.doctor import Doctor
from models.patient import Patient
from models.review import Review
from models.schedule import Schedule
from models.user import User, UserRole


class DoctorApiTestCase(unittest.TestCase):
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

    def doctor_payload(self, **overrides):
        payload = {
            "firstName": "Minh",
            "lastName": "An",
            "email": "minhan@example.com",
            "password": "secret123",
            "specialization": "Tim mạch",
            "licenseNumber": "GP-001",
            "bio": "Bác sĩ có kinh nghiệm khám chuyên khoa.",
            "phone": "0901000001",
            "gender": "Nam",
            "dateOfBirth": "1985-03-20",
            "address": "Quận 1, TP. Hồ Chí Minh",
        }
        payload.update(overrides)
        return payload

    def create_doctor(self, **overrides):
        response = self.client.post("/api/doctors", json=self.doctor_payload(**overrides))
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["data"]

    def seed_clinic(self):
        clinic = Clinic(
            name="Phòng khám Trung Tâm",
            address="123 Nguyễn Trãi",
            phone="19009999",
            specialties="Tim mạch, Nội tổng quát",
        )
        db.session.add(clinic)
        db.session.commit()
        return clinic

    def seed_patient(self):
        user = User(
            firstName="Lan",
            lastName="Nguyen",
            email="patient@example.com",
            phone="0902000002",
            role=UserRole.PATIENT,
        )
        user.set_password("secret123")
        db.session.add(user)
        db.session.flush()

        patient = Patient(userID=user.userID, insuranceId="BH-001", bloodType="O")
        db.session.add(patient)
        db.session.commit()
        return patient

    def test_create_list_get_update_and_delete_doctor(self):
        created = self.create_doctor()
        doctor_id = created["doctorID"]

        self.assertEqual(created["specialization"], "Tim mạch")
        self.assertEqual(created["user"]["email"], "minhan@example.com")

        list_response = self.client.get("/api/doctors")
        self.assertEqual(list_response.status_code, 200)
        list_body = list_response.get_json()
        self.assertTrue(list_body["success"])
        self.assertEqual(list_body["pagination"]["total"], 1)
        self.assertEqual(list_body["data"][0]["doctorID"], doctor_id)

        keyword_response = self.client.get("/api/doctors?keyword=Minh")
        self.assertEqual(keyword_response.status_code, 200)
        self.assertEqual(keyword_response.get_json()["pagination"]["total"], 1)

        license_response = self.client.get("/api/doctors?keyword=GP-001")
        self.assertEqual(license_response.status_code, 200)
        license_body = license_response.get_json()
        self.assertEqual(license_body["pagination"]["total"], 1)
        self.assertEqual(license_body["data"][0]["doctorID"], doctor_id)

        phone_response = self.client.get("/api/doctors?keyword=0901000001")
        self.assertEqual(phone_response.status_code, 200)
        phone_body = phone_response.get_json()
        self.assertEqual(phone_body["pagination"]["total"], 1)
        self.assertEqual(phone_body["data"][0]["doctorID"], doctor_id)

        specialty_response = self.client.get("/api/doctors?specialization=Tim")
        self.assertEqual(specialty_response.status_code, 200)
        specialty_body = specialty_response.get_json()
        self.assertEqual(specialty_body["pagination"]["total"], 1)
        self.assertEqual(specialty_body["data"][0]["doctorID"], doctor_id)

        detail_response = self.client.get(f"/api/doctors/{doctor_id}")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.get_json()["data"]["doctorID"], doctor_id)

        update_response = self.client.put(
            f"/api/doctors/{doctor_id}",
            json={
                "specialization": "Da liễu",
                "phone": "0903000003",
                "address": "Quận 3, TP. Hồ Chí Minh",
            },
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["data"]
        self.assertEqual(updated["specialization"], "Da liễu")
        self.assertEqual(updated["user"]["phone"], "0903000003")
        self.assertEqual(updated["user"]["address"], "Quận 3, TP. Hồ Chí Minh")

        delete_response = self.client.delete(f"/api/doctors/{doctor_id}")
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.get_json()["success"])

        missing_response = self.client.get(f"/api/doctors/{doctor_id}")
        self.assertEqual(missing_response.status_code, 404)

    def test_create_doctor_validation_and_duplicate_email(self):
        missing_response = self.client.post(
            "/api/doctors",
            json={
                "firstName": "Thiếu",
                "lastName": "Email",
                "password": "secret123",
            },
        )
        self.assertEqual(missing_response.status_code, 400)
        self.assertIn("Thiếu trường", missing_response.get_json()["message"])

        self.create_doctor()

        duplicate_response = self.client.post(
            "/api/doctors",
            json=self.doctor_payload(licenseNumber="GP-002"),
        )
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertFalse(duplicate_response.get_json()["success"])

    def test_filter_doctors_by_specialization_and_clinic(self):
        with self.app.app_context():
            clinic = self.seed_clinic()
            clinic_id = clinic.clinicID

        self.create_doctor(clinicID=clinic_id)
        self.create_doctor(
            firstName="Thu",
            lastName="Ha",
            email="thuha@example.com",
            phone="0901000002",
            specialization="Da liễu",
            licenseNumber="GP-002",
            clinicID=clinic_id,
        )

        specialization_response = self.client.get(
            "/api/doctors?specialization=Da%20li%E1%BB%85u"
        )
        self.assertEqual(specialization_response.status_code, 200)
        specialization_body = specialization_response.get_json()
        self.assertEqual(specialization_body["pagination"]["total"], 1)
        self.assertEqual(specialization_body["data"][0]["specialization"], "Da liễu")

        clinic_response = self.client.get(f"/api/doctors?clinic_id={clinic_id}")
        self.assertEqual(clinic_response.status_code, 200)
        self.assertEqual(clinic_response.get_json()["pagination"]["total"], 2)

    def test_doctor_detail_schedules_reviews_and_appointment_actions(self):
        with self.app.app_context():
            clinic = self.seed_clinic()
            clinic_id = clinic.clinicID

        created = self.create_doctor(clinicID=clinic_id)
        doctor_id = created["doctorID"]

        with self.app.app_context():
            patient = self.seed_patient()

            schedule = Schedule(
                doctorID=doctor_id,
                clinicID=clinic_id,
                workDate=date(2099, 1, 1),
                startTime=time(9, 0),
                endTime=time(10, 0),
                isAvailable=True,
                slotDuration=30,
            )
            db.session.add(schedule)
            db.session.flush()

            appointment = Appointment(
                patientId=patient.patientID,
                doctorId=doctor_id,
                scheduleId=schedule.scheduleId,
                clinicId=clinic_id,
                appointmentDate=datetime(2099, 1, 1, 9, 0),
                reason="Đau ngực",
            )
            db.session.add(appointment)
            db.session.flush()

            review = Review(
                patientId=patient.patientID,
                doctorId=doctor_id,
                appointmentId=appointment.appointmentId,
                rating=5,
                comment="Bác sĩ tư vấn rõ ràng.",
            )
            db.session.add(review)

            doctor = db.session.get(Doctor, doctor_id)
            doctor.rating = 5
            db.session.commit()

            appointment_id = appointment.appointmentId
            schedule_id = schedule.scheduleId

        detail_response = self.client.get(f"/api/doctors/{doctor_id}?include_clinic=true")
        self.assertEqual(detail_response.status_code, 200)
        detail = detail_response.get_json()["data"]
        self.assertEqual(detail["clinic"]["name"], "Phòng khám Trung Tâm")

        schedule_response = self.client.get(f"/api/doctors/{doctor_id}/schedules?slots=true")
        self.assertEqual(schedule_response.status_code, 200)
        schedule_body = schedule_response.get_json()
        self.assertEqual(schedule_body["total"], 1)
        self.assertEqual(schedule_body["data"][0]["slots"][0], {"time": "09:00", "available": False})
        self.assertEqual(schedule_body["data"][0]["slots"][1], {"time": "09:30", "available": True})

        reviews_response = self.client.get(f"/api/doctors/{doctor_id}/reviews")
        self.assertEqual(reviews_response.status_code, 200)
        reviews_body = reviews_response.get_json()
        self.assertEqual(reviews_body["total"], 1)
        self.assertEqual(reviews_body["avgRating"], 5)
        self.assertEqual(reviews_body["data"][0]["comment"], "Bác sĩ tư vấn rõ ràng.")

        appointments_response = self.client.get(
            f"/api/doctors/{doctor_id}/appointments?upcoming=true"
        )
        self.assertEqual(appointments_response.status_code, 200)
        self.assertEqual(appointments_response.get_json()["total"], 1)

        reschedule_response = self.client.patch(
            f"/api/doctors/{doctor_id}/appointments/{appointment_id}/reschedule",
            json={
                "appointmentDate": "2099-01-01T09:30:00",
                "scheduleId": schedule_id,
            },
        )
        self.assertEqual(reschedule_response.status_code, 200)
        self.assertTrue(
            reschedule_response.get_json()["data"]["appointmentDate"].startswith(
                "2099-01-01T09:30:00"
            )
        )

        cancel_response = self.client.patch(
            f"/api/doctors/{doctor_id}/appointments/{appointment_id}/cancel",
            json={"reason": "Bệnh nhân đổi lịch"},
        )
        self.assertEqual(cancel_response.status_code, 200)
        cancelled = cancel_response.get_json()["data"]
        self.assertEqual(cancelled["status"], "CANCELLED")
        self.assertEqual(cancelled["cancelReason"], "Bệnh nhân đổi lịch")


if __name__ == "__main__":
    unittest.main()
