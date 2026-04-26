import sys
from pathlib import Path

# FIX IMPORT
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


# =========================
# CREATE PAYMENT
# =========================
@patch("routes.payment.requests.post")
@patch("models.payment.Payment")
@patch("models.appointment.Appointment.query")
@patch("db.db.db.session")
def test_create_payment_success(mock_db, mock_query, mock_payment_cls, mock_post, client):
    # mock appointment
    mock_appt = MagicMock()
    mock_appt.price = 100000
    mock_query.get.return_value = mock_appt

    # mock momo response
    mock_post.return_value.json.return_value = {
        "resultCode": 0,
        "payUrl": "https://momo.test/pay"
    }

    # set env
    with patch.dict("os.environ", {
        "MOMO_PARTNER_CODE": "test",
        "MOMO_ACCESS_KEY": "test",
        "MOMO_SECRET_KEY": "test",
        "MOMO_ENDPOINT": "https://test",
        "MOMO_RETURN_URL": "https://return",
        "MOMO_NOTIFY_URL": "https://notify",
    }):
        res = client.post("/api/momo/create", json={
            "appointmentId": 1
        })

    assert res.status_code == 200
    assert res.get_json()["success"] is True


def test_create_payment_missing_id(client):
    res = client.post("/api/momo/create", json={})
    assert res.status_code == 400


@patch("models.appointment.Appointment.query")
def test_create_payment_not_found(mock_query, client):
    mock_query.get.return_value = None

    res = client.post("/api/momo/create", json={
        "appointmentId": 999
    })

    assert res.status_code == 404


@patch("routes.payment.requests.post")
@patch("models.appointment.Appointment.query")
def test_create_payment_momo_fail(mock_query, mock_post, client):
    mock_appt = MagicMock()
    mock_query.get.return_value = mock_appt

    mock_post.return_value.json.return_value = {
        "resultCode": 1,
        "message": "Failed"
    }

    with patch.dict("os.environ", {
        "MOMO_PARTNER_CODE": "test",
        "MOMO_ACCESS_KEY": "test",
        "MOMO_SECRET_KEY": "test",
        "MOMO_ENDPOINT": "https://test",
        "MOMO_RETURN_URL": "https://return",
        "MOMO_NOTIFY_URL": "https://notify",
    }):
        res = client.post("/api/momo/create", json={
            "appointmentId": 1
        })

    assert res.status_code == 400


@patch("routes.payment.requests.post")
@patch("models.appointment.Appointment.query")
def test_create_payment_exception(mock_query, mock_post, client):
    mock_query.get.side_effect = Exception("DB error")

    res = client.post("/api/momo/create", json={
        "appointmentId": 1
    })

    assert res.status_code == 500


# =========================
# MOMO IPN
# =========================
@patch("models.payment.Payment.query")
@patch("models.appointment.Appointment.query")
@patch("threading.Thread")
@patch("db.db.db.session")
def test_ipn_success(mock_db, mock_thread, mock_appt_query, mock_payment_query, client):
    # mock payment
    mock_payment = MagicMock()
    mock_payment.status = "PENDING"
    mock_payment.appointmentId = 1
    mock_payment_query.filter_by.return_value.first.return_value = mock_payment

    # mock appointment
    mock_appt = MagicMock()
    mock_appt.patient.user.email = "test@mail.com"
    mock_appt.patient.user.firstName = "A"
    mock_appt.patient.user.lastName = "B"
    mock_appt_query.get.return_value = mock_appt

    mock_thread.return_value.start = MagicMock()

    res = client.post("/api/momo/ipn", json={
        "orderId": "123",
        "resultCode": 0
    })

    assert res.status_code == 200
    assert mock_payment.status == "PAID"


@patch("models.payment.Payment.query")
def test_ipn_missing_order_id(mock_query, client):
    res = client.post("/api/momo/ipn", json={})
    assert res.status_code == 400


@patch("models.payment.Payment.query")
def test_ipn_payment_not_found(mock_query, client):
    mock_query.filter_by.return_value.first.return_value = None

    res = client.post("/api/momo/ipn", json={
        "orderId": "123"
    })

    assert res.status_code == 404


@patch("models.payment.Payment.query")
def test_ipn_duplicate(mock_query, client):
    mock_payment = MagicMock()
    mock_payment.status = "PAID"

    mock_query.filter_by.return_value.first.return_value = mock_payment

    res = client.post("/api/momo/ipn", json={
        "orderId": "123",
        "resultCode": 0
    })

    assert res.status_code == 200


@patch("models.payment.Payment.query")
@patch("db.db.db.session")
def test_ipn_failed(mock_db, mock_query, client):
    mock_payment = MagicMock()
    mock_payment.status = "PENDING"

    mock_query.filter_by.return_value.first.return_value = mock_payment

    res = client.post("/api/momo/ipn", json={
        "orderId": "123",
        "resultCode": 1
    })

    assert res.status_code == 200
    assert mock_payment.status == "FAILED"


@patch("models.payment.Payment.query")
def test_ipn_exception(mock_query, client):
    mock_query.filter_by.side_effect = Exception("DB error")

    res = client.post("/api/momo/ipn", json={
        "orderId": "123"
    })

    assert res.status_code == 500