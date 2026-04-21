from flask import Blueprint, request, jsonify
import requests
import hmac
import hashlib
import uuid
from datetime import datetime, timezone

from db.db import db
from models.payment import Payment
from models.appointment import Appointment

momo_bp = Blueprint("momo", __name__, url_prefix="/api/momo")

import os

MOMO_ENDPOINT = os.getenv("MOMO_ENDPOINT")

PARTNER_CODE = os.getenv("MOMO_PARTNER_CODE")
ACCESS_KEY = os.getenv("MOMO_ACCESS_KEY")
SECRET_KEY = os.getenv("MOMO_SECRET_KEY")

RETURN_URL = os.getenv("MOMO_RETURN_URL")
NOTIFY_URL = os.getenv("MOMO_NOTIFY_URL")



@momo_bp.route("/create", methods=["POST"])
def create_payment():
    try:
        data = request.get_json() or {}

        amount = str(data.get("amount", 50000))
        appointment_id = data.get("appointmentId")

        if not appointment_id:
            return jsonify({"message": "Thiếu appointmentId"}), 400

        order_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        order_info = "Thanh toan dat lich kham"


        raw_signature = (
            f"accessKey={ACCESS_KEY}"
            f"&amount={amount}"
            f"&extraData="
            f"&ipnUrl={NOTIFY_URL}"
            f"&orderId={order_id}"
            f"&orderInfo={order_info}"
            f"&partnerCode={PARTNER_CODE}"
            f"&redirectUrl={RETURN_URL}"
            f"&requestId={request_id}"
            f"&requestType=captureWallet"
        )

        signature = hmac.new(
            SECRET_KEY.encode("utf-8"),
            raw_signature.encode(),
            hashlib.sha256
        ).hexdigest()


        payment = Payment(
            orderId=order_id,
            amount=float(amount),
            status="PENDING",
            appointmentId=appointment_id,
            createdAt=datetime.now()
        )

        db.session.add(payment)
        db.session.commit()


        payload = {
            "partnerCode": PARTNER_CODE,
            "accessKey": ACCESS_KEY,
            "requestId": request_id,
            "amount": amount,
            "orderId": order_id,
            "orderInfo": order_info,
            "redirectUrl": RETURN_URL,
            "ipnUrl": NOTIFY_URL,
            "extraData": "",
            "requestType": "captureWallet",
            "signature": signature,
            "lang": "vi"
        }

        res = requests.post(MOMO_ENDPOINT, json=payload, timeout=10)

        return jsonify(res.json())

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@momo_bp.route("/ipn", methods=["POST"])
def momo_ipn():
    try:
        data = request.get_json() or {}
        order_id = data.get("orderId")
        result_code = data.get("resultCode")

        payment = Payment.query.filter_by(orderId=order_id).first()

        if not payment:
            return jsonify({"message": "Payment not found"}), 404


        if payment.status == "PAID":
            return jsonify({"message": "Already processed"}), 200

        if result_code == 0:
            payment.status = "PAID"

            appt = Appointment.query.filter_by(
                appointmentId=payment.appointmentId
            ).first()

            if appt:
                appt.status = "CONFIRMED"

        else:
            payment.status = "FAILED"

        db.session.commit()

        return jsonify({"message": "OK"})

    except Exception as e:
        print("IPN ERROR:", str(e))
        return jsonify({"message": "ERROR"}), 500