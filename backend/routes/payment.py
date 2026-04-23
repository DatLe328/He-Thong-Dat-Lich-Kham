from flask import Blueprint, request, jsonify
import requests
import hmac
import hashlib
import uuid
import os
import json
from datetime import datetime, timezone

from db.db import db
from models.payment import Payment
from models.appointment import Appointment, AppointmentStatus
from flask import current_app
import threading

from routes.appointment import send_async_email

momo_bp = Blueprint("momo", __name__, url_prefix="/api/momo")


@momo_bp.route("/create", methods=["POST"])
def create_payment():
    try:
        data = request.get_json() or {}
        appointment_id = data.get("appointmentId")

        if not appointment_id:
            return jsonify({"success": False, "message": "Missing appointmentId"}), 400

        appt = Appointment.query.get(appointment_id)
        if not appt:
            return jsonify({"success": False, "message": "Appointment not found"}), 404

        # 🔥 KHÔNG lấy amount từ FE
        amount = appt.price if hasattr(appt, "price") else 50000

        # LOCK appointment
        appt.paymentLocked = True
        appt.status = AppointmentStatus.PENDING

        db.session.commit()

        partner_code = os.getenv("MOMO_PARTNER_CODE").strip()
        access_key = os.getenv("MOMO_ACCESS_KEY").strip()
        secret_key = os.getenv("MOMO_SECRET_KEY").strip()
        endpoint = os.getenv("MOMO_ENDPOINT").strip()
        return_url = os.getenv("MOMO_RETURN_URL").strip()
        notify_url = os.getenv("MOMO_NOTIFY_URL").strip()

        order_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        order_info = f"Thanh toan lich hen {appointment_id}"
        extra_data = ""
        request_type = "captureWallet"

        raw_signature = (
            f"accessKey={access_key}&amount={amount}&extraData={extra_data}&"
            f"ipnUrl={notify_url}&orderId={order_id}&orderInfo={order_info}&"
            f"partnerCode={partner_code}&redirectUrl={return_url}&"
            f"requestId={request_id}&requestType={request_type}"
        )

        signature = hmac.new(
            secret_key.encode(),
            raw_signature.encode(),
            hashlib.sha256
        ).hexdigest()

        payload = {
            "partnerCode": partner_code,
            "requestId": request_id,
            "amount": amount,
            "orderId": order_id,
            "orderInfo": order_info,
            "redirectUrl": return_url,
            "ipnUrl": notify_url,
            "extraData": extra_data,
            "requestType": request_type,
            "signature": signature,
            "lang": "vi"
        }

        response = requests.post(endpoint, json=payload, timeout=10)
        res_data = response.json()

        if res_data.get("resultCode") == 0:
            payment = Payment(
                orderId=order_id,
                amount=amount,
                status="PENDING",
                appointmentId=appointment_id,
                createdAt=datetime.now(timezone.utc)
            )
            db.session.add(payment)
            db.session.commit()

            return jsonify({
                "success": True,
                "payUrl": res_data.get("payUrl")
            })

        return jsonify({
            "success": False,
            "message": res_data.get("message")
        }), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

@momo_bp.route("/ipn", methods=["POST"])
def momo_ipn():
    try:
        data = request.get_json()
        print("🔥 IPN HIT:", data)

        order_id = data.get("orderId")
        result_code = data.get("resultCode")

        if not order_id:
            return jsonify({"message": "Missing orderId"}), 400

        payment = Payment.query.filter_by(orderId=order_id).first()

        if not payment:
            return jsonify({"message": "Payment not found"}), 404

        # 🔥 CHỐNG DUPLICATE IPN
        if payment.status == "PAID":
            return jsonify({"message": "Already processed"}), 200

        # =========================
        # SUCCESS
        # =========================
        if result_code == 0:
            payment.status = "PAID"

            appt = Appointment.query.get(payment.appointmentId)

            if appt:
                appt.status = AppointmentStatus.CONFIRMED
                appt.paymentLocked = False
                appt.paymentStatus = "PAID"
                appt.updatedAt = datetime.now(timezone.utc)

                # =========================
                # 🔥 SEND EMAIL AFTER PAYMENT
                # =========================
                app = current_app._get_current_object()

                patient_info = {
                    "email": appt.patient.user.email if appt.patient and appt.patient.user else None,
                    "firstName": appt.patient.user.firstName if appt.patient and appt.patient.user else None,
                    "lastName": appt.patient.user.lastName if appt.patient and appt.patient.user else None,
                }

                threading.Thread(
                    target=send_async_email,
                    args=(app, appt.appointmentId, patient_info, "create")
                ).start()

        # =========================
        # FAILED
        # =========================
        else:
            payment.status = "FAILED"

        db.session.commit()

        return jsonify({"message": "OK"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500