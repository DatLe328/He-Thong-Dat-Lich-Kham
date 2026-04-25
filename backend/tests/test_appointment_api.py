import sys
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import pytest
from app import create_app
from unittest.mock import patch, MagicMock
from models.appointment import AppointmentStatus



@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True

    with app.app_context():
        with app.test_client() as client:
            yield client



@patch("dao.appointment_dao.AppointmentDAO.create")
@patch("db.db.db.session")
def test_create_success(mock_db, mock_create, client):
    mock_appt = MagicMock()
    mock_appt.appointmentId = 1
    mock_appt.status = AppointmentStatus.PENDING
    mock_appt.expiresAt.isoformat.return_value = "2099-01-01T10:00:00"

    mock_create.return_value = (mock_appt, None)

    res = client.post("/api/appointments", json={
        "appointmentDate": "2099-01-01T10:00:00",
        "doctorId": 1
    })

    assert res.status_code == 201
    assert res.get_json()["data"]["appointmentId"] == 1


def test_create_invalid_date(client):
    res = client.post("/api/appointments", json={
        "appointmentDate": "abc"
    })

    assert res.status_code == 400


@patch("dao.appointment_dao.AppointmentDAO.create")
def test_create_dao_error(mock_create, client):
    mock_create.return_value = (None, "Error")

    res = client.post("/api/appointments", json={
        "appointmentDate": "2099-01-01T10:00:00"
    })

    assert res.status_code == 409


@patch("dao.appointment_dao.AppointmentDAO.create")
def test_create_exception(mock_create, client):
    mock_create.side_effect = Exception("DB error")

    res = client.post("/api/appointments", json={
        "appointmentDate": "2099-01-01T10:00:00"
    })

    assert res.status_code == 500


@patch("dao.appointment_dao.AppointmentDAO.create")
@patch("db.db.db.session")
def test_create_with_patient_info(mock_db, mock_create, client):
    mock_appt = MagicMock()
    mock_appt.appointmentId = 2
    mock_appt.status = AppointmentStatus.PENDING
    mock_appt.expiresAt.isoformat.return_value = "2099-01-01T10:00:00"

    mock_create.return_value = (mock_appt, None)

    res = client.post("/api/appointments", json={
        "appointmentDate": "2099-01-01T10:00:00",
        "doctorId": 1,
        "patientInfo": {
            "firstName": "A",
            "lastName": "B"
        }
    })

    assert res.status_code == 201



@patch("models.appointment.Appointment.query")
def test_get_all(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.to_dict.return_value = {"id": 1}

    mock_query.order_by.return_value.all.return_value = [mock_appt]

    res = client.get("/api/appointments")

    assert res.status_code == 200
    assert len(res.get_json()["data"]) == 1


@patch("models.appointment.Appointment.query")
def test_get_by_doctor(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.to_dict.return_value = {"doctorId": 1}

    mock_query.filter_by.return_value.order_by.return_value.all.return_value = [mock_appt]

    res = client.get("/api/appointments?doctorId=1")

    assert res.status_code == 200


@patch("models.appointment.Appointment.query")
def test_get_by_phone(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.to_dict.return_value = {"id": 1}

    mock_query.join.return_value.filter.return_value.order_by.return_value.all.return_value = [mock_appt]

    res = client.get("/api/appointments?phone=0901")

    assert res.status_code == 200


@patch("models.appointment.Appointment.query")
def test_get_by_user(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.to_dict.return_value = {"id": 1}

    mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_appt]

    res = client.get("/api/appointments?userId=1")

    assert res.status_code == 200


@patch("models.appointment.Appointment.query")
def test_userid_priority_over_phone(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.to_dict.return_value = {"id": 1}

    mock_query.filter.return_value.order_by.return_value.all.return_value = [mock_appt]

    res = client.get("/api/appointments?userId=1&phone=0901")

    assert res.status_code == 200
    mock_query.join.assert_not_called()


@patch("models.appointment.Appointment.query")
def test_get_exception(mock_query, client):
    mock_query.order_by.side_effect = Exception("DB error")

    res = client.get("/api/appointments")

    assert res.status_code == 500



@patch("models.appointment.Appointment.query")
@patch("threading.Thread")
@patch("db.db.db.session")
def test_cancel_success(mock_db, mock_thread, mock_query, client):
    mock_appt = MagicMock()
    mock_appt.appointmentId = 1
    mock_appt.status = AppointmentStatus.PENDING
    mock_appt.to_dict.return_value = {"status": "CANCELLED"}

    mock_query.get.return_value = mock_appt
    mock_thread.return_value.start = MagicMock()

    res = client.post("/api/appointments/1/cancel", json={
        "reason": "test"
    })

    assert res.status_code == 200
    assert res.get_json()["success"] is True


@patch("models.appointment.Appointment.query")
def test_cancel_not_found(mock_query, client):
    mock_query.get.return_value = None

    res = client.post("/api/appointments/999/cancel")

    assert res.status_code == 404


@patch("models.appointment.Appointment.query")
def test_cancel_completed(mock_query, client):
    mock_appt = MagicMock()
    mock_appt.status = AppointmentStatus.COMPLETED

    mock_query.get.return_value = mock_appt

    res = client.post("/api/appointments/1/cancel")

    assert res.status_code == 400