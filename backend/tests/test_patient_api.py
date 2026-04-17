import os
import sys
import tempfile
import unittest
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from config import Config
from db.db import db


class PatientApiTestCase(unittest.TestCase):
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

    def patient_payload(self, **overrides):
        payload = {
            "firstName": "Lan",
            "lastName": "Nguyen",
            "email": "lan.nguyen@example.com",
            "password": "secret123",
            "phone": "0902000002",
            "gender": "Nữ",
            "dateOfBirth": "1995-04-12",
            "address": "Quận 5, TP. Hồ Chí Minh",
            "insuranceId": "BH-001",
            "bloodType": "O",
        }
        payload.update(overrides)
        return payload

    def create_patient(self, **overrides):
        response = self.client.post("/api/patients", json=self.patient_payload(**overrides))
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["data"]

    def test_create_list_get_update_and_delete_patient(self):
        created = self.create_patient()
        patient_id = created["patientID"]

        self.assertEqual(created["insuranceId"], "BH-001")
        self.assertEqual(created["bloodType"], "O")
        self.assertEqual(created["user"]["email"], "lan.nguyen@example.com")
        self.assertEqual(created["user"]["role"], "PATIENT")

        list_response = self.client.get("/api/patients")
        self.assertEqual(list_response.status_code, 200)
        list_body = list_response.get_json()
        self.assertTrue(list_body["success"])
        self.assertEqual(list_body["pagination"]["total"], 1)
        self.assertEqual(list_body["data"][0]["patientID"], patient_id)

        keyword_response = self.client.get("/api/patients?keyword=Lan")
        self.assertEqual(keyword_response.status_code, 200)
        self.assertEqual(keyword_response.get_json()["pagination"]["total"], 1)

        insurance_response = self.client.get("/api/patients?keyword=BH-001")
        self.assertEqual(insurance_response.status_code, 200)
        insurance_body = insurance_response.get_json()
        self.assertEqual(insurance_body["pagination"]["total"], 1)
        self.assertEqual(insurance_body["data"][0]["patientID"], patient_id)

        phone_response = self.client.get("/api/patients?keyword=0902000002")
        self.assertEqual(phone_response.status_code, 200)
        self.assertEqual(phone_response.get_json()["pagination"]["total"], 1)

        detail_response = self.client.get(f"/api/patients/{patient_id}")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.get_json()["data"]["patientID"], patient_id)

        update_response = self.client.put(
            f"/api/patients/{patient_id}",
            json={
                "insuranceId": "BH-002",
                "bloodType": "A",
                "phone": "0903000003",
                "address": "Quận 10, TP. Hồ Chí Minh",
            },
        )
        self.assertEqual(update_response.status_code, 200)
        updated = update_response.get_json()["data"]
        self.assertEqual(updated["insuranceId"], "BH-002")
        self.assertEqual(updated["bloodType"], "A")
        self.assertEqual(updated["user"]["phone"], "0903000003")
        self.assertEqual(updated["user"]["address"], "Quận 10, TP. Hồ Chí Minh")

        delete_response = self.client.delete(f"/api/patients/{patient_id}")
        self.assertEqual(delete_response.status_code, 200)
        self.assertTrue(delete_response.get_json()["success"])

        missing_response = self.client.get(f"/api/patients/{patient_id}")
        self.assertEqual(missing_response.status_code, 404)

    def test_create_patient_validation_duplicate_email_and_invalid_date(self):
        missing_response = self.client.post(
            "/api/patients",
            json={
                "firstName": "Thiếu",
                "lastName": "Email",
                "password": "secret123",
            },
        )
        self.assertEqual(missing_response.status_code, 400)
        self.assertIn("Thiếu trường", missing_response.get_json()["message"])

        invalid_date_response = self.client.post(
            "/api/patients",
            json=self.patient_payload(email="date@example.com", dateOfBirth="12-04-1995"),
        )
        self.assertEqual(invalid_date_response.status_code, 400)
        self.assertIn("dateOfBirth", invalid_date_response.get_json()["message"])

        self.create_patient()

        duplicate_response = self.client.post(
            "/api/patients",
            json=self.patient_payload(phone="0902000003", insuranceId="BH-003"),
        )
        self.assertEqual(duplicate_response.status_code, 409)
        self.assertFalse(duplicate_response.get_json()["success"])

    def test_filter_patients_with_pagination(self):
        self.create_patient()
        self.create_patient(
            firstName="Hoa",
            lastName="Tran",
            email="hoa.tran@example.com",
            phone="0902000004",
            insuranceId="BH-004",
            bloodType="AB",
        )

        blood_type_response = self.client.get("/api/patients?keyword=AB")
        self.assertEqual(blood_type_response.status_code, 200)
        blood_type_body = blood_type_response.get_json()
        self.assertEqual(blood_type_body["pagination"]["total"], 1)
        self.assertEqual(blood_type_body["data"][0]["bloodType"], "AB")

        paged_response = self.client.get("/api/patients?page=1&per_page=1")
        self.assertEqual(paged_response.status_code, 200)
        paged_body = paged_response.get_json()
        self.assertEqual(paged_body["pagination"]["total"], 2)
        self.assertEqual(paged_body["pagination"]["perPage"], 1)
        self.assertEqual(len(paged_body["data"]), 1)


if __name__ == "__main__":
    unittest.main()
