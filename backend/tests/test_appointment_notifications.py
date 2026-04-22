import sys
import unittest
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from services.appointment_notifications import (
    _send_appointment_email,
    notify_appointment_cancelled,
    notify_appointment_created,
    notify_appointment_rescheduled,
)


class AppointmentNotificationsTestCase(unittest.TestCase):
    def make_appointment(
        self,
        *,
        appointment_id=101,
        appointment_date=datetime(2099, 1, 2, 14, 30),
        patient=None,
        proxy_booking=None,
        doctor=None,
        doctor_id=7,
        clinic=None,
        cancel_reason=None,
    ):
        return SimpleNamespace(
            appointmentId=appointment_id,
            appointmentDate=appointment_date,
            patient=patient,
            proxyBooking=proxy_booking,
            doctor=doctor,
            doctorId=doctor_id,
            clinic=clinic,
            cancelReason=cancel_reason,
        )

    def make_user(self, **overrides):
        data = {
            "firstName": "Lan",
            "lastName": "Nguyen",
            "email": "patient@example.com",
        }
        data.update(overrides)
        return SimpleNamespace(**data)

    def make_patient(self, **overrides):
        data = {
            "fullName": "Lan Nguyen",
            "user": self.make_user(),
        }
        data.update(overrides)
        return SimpleNamespace(**data)

    def make_doctor(self, **overrides):
        data = {
            "user": SimpleNamespace(firstName="Minh", lastName="Tran"),
        }
        data.update(overrides)
        return SimpleNamespace(**data)

    def make_clinic(self, **overrides):
        data = {"name": "Phòng khám Trung Tâm"}
        data.update(overrides)
        return SimpleNamespace(**data)

    @patch("services.appointment_notifications.send_email", return_value=True)
    def test_notify_appointment_created_uses_registered_patient_contact(self, mock_send_email):
        appointment = self.make_appointment(
            patient=self.make_patient(),
            doctor=self.make_doctor(),
            clinic=self.make_clinic(),
        )

        result = notify_appointment_created(appointment)

        self.assertTrue(result)
        mock_send_email.assert_called_once()
        to_email, subject, body = mock_send_email.call_args.args
        self.assertEqual(to_email, "patient@example.com")
        self.assertEqual(subject, "Xác nhận đặt lịch khám")
        self.assertIn("Xin chào Lan Nguyen,", body)
        self.assertIn("Lịch khám của bạn đã được ghi nhận thành công.", body)
        self.assertIn("Mã lịch hẹn: #101", body)
        self.assertIn("Thời gian khám: 14:30 ngày 02/01/2099", body)
        self.assertIn("Bác sĩ: Bác sĩ Minh Tran", body)
        self.assertIn("Địa điểm: Phòng khám Trung Tâm", body)
        self.assertIn("Hệ thống đặt lịch khám", body)

    @patch("services.appointment_notifications.send_email", return_value=True)
    def test_notify_appointment_created_falls_back_to_guest_patient_info(self, mock_send_email):
        appointment = self.make_appointment(doctor=None, clinic=None, doctor_id=12)
        patient_info = {
            "firstName": "Khach",
            "lastName": "Le",
            "email": "guest@example.com",
        }

        result = notify_appointment_created(appointment, patient_info=patient_info)

        self.assertTrue(result)
        to_email, subject, body = mock_send_email.call_args.args
        self.assertEqual(to_email, "guest@example.com")
        self.assertEqual(subject, "Xác nhận đặt lịch khám")
        self.assertIn("Xin chào Khach Le,", body)
        self.assertIn("Bác sĩ: Bác sĩ #12", body)
        self.assertIn("Địa điểm: phòng khám", body)

    @patch("services.appointment_notifications.send_email", return_value=True)
    def test_notify_appointment_rescheduled_uses_proxy_booking_contact(self, mock_send_email):
        proxy_booking = SimpleNamespace(
            firstName="Mai",
            lastName="Pham",
            email="proxy@example.com",
        )
        appointment = self.make_appointment(
            patient=None,
            proxy_booking=proxy_booking,
            doctor=self.make_doctor(),
        )

        result = notify_appointment_rescheduled(appointment)

        self.assertTrue(result)
        to_email, subject, body = mock_send_email.call_args.args
        self.assertEqual(to_email, "proxy@example.com")
        self.assertEqual(subject, "Thông báo đổi lịch khám")
        self.assertIn("Xin chào Mai Pham,", body)
        self.assertIn("Lịch khám của bạn đã được cập nhật sang thời gian mới.", body)

    @patch("services.appointment_notifications.send_email", return_value=True)
    def test_notify_appointment_cancelled_includes_cancel_reason(self, mock_send_email):
        appointment = self.make_appointment(
            patient=self.make_patient(),
            cancel_reason="Bác sĩ bận lịch đột xuất",
        )

        result = notify_appointment_cancelled(appointment)

        self.assertTrue(result)
        to_email, subject, body = mock_send_email.call_args.args
        self.assertEqual(to_email, "patient@example.com")
        self.assertEqual(subject, "Thông báo hủy lịch khám")
        self.assertIn("Lịch khám của bạn đã được hủy.", body)
        self.assertIn("Lý do hủy: Bác sĩ bận lịch đột xuất", body)

    @patch("services.appointment_notifications.send_email")
    def test_send_appointment_email_returns_false_when_no_recipient(self, mock_send_email):
        appointment = self.make_appointment(patient=None, proxy_booking=None, doctor=None, clinic=None)

        result = _send_appointment_email(
            appointment,
            "Thông báo",
            "Nội dung",
            patient_info={"firstName": "Vo", "lastName": "Danh"},
        )

        self.assertFalse(result)
        mock_send_email.assert_not_called()

    @patch("services.appointment_notifications.send_email", return_value=True)
    def test_send_appointment_email_uses_generic_patient_name_when_missing(self, mock_send_email):
        appointment = self.make_appointment(
            appointment_date=None,
            patient=None,
            proxy_booking=None,
            doctor=None,
            doctor_id=None,
            clinic=None,
        )

        result = _send_appointment_email(appointment, "Thông báo chung", "Nội dung", patient_info={"email": "anon@example.com"})

        self.assertTrue(result)
        to_email, subject, body = mock_send_email.call_args.args
        self.assertEqual(to_email, "anon@example.com")
        self.assertEqual(subject, "Thông báo chung")
        self.assertIn("Xin chào bệnh nhân,", body)
        self.assertIn("Thời gian khám: chưa cập nhật", body)
        self.assertIn("Bác sĩ: bác sĩ", body)
        self.assertIn("Địa điểm: phòng khám", body)


if __name__ == "__main__":
    unittest.main()
