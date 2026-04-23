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

momo_bp = Blueprint("momo", __name__, url_prefix="/api/momo")


@momo_bp.route("/create", methods=["POST"])
def create_payment():
    try:
        data = request.get_json() or {}
        appointment_id = data.get("appointmentId")
        amount = int(data.get("amount", 50000))

        if not appointment_id:
            return jsonify({"success": False, "message": "Missing appointmentId"}), 400

        # Lấy config và strip() để loại bỏ xuống dòng/khoảng trắng
        partner_code = os.getenv("MOMO_PARTNER_CODE").strip()
        access_key = os.getenv("MOMO_ACCESS_KEY").strip()
        secret_key = os.getenv("MOMO_SECRET_KEY").strip()
        endpoint = os.getenv("MOMO_ENDPOINT").strip()
        return_url = os.getenv("MOMO_RETURN_URL").strip()
        notify_url = os.getenv("MOMO_NOTIFY_URL").strip()

        # Thông tin định danh giao dịch
        order_id = str(uuid.uuid4())
        request_id = str(uuid.uuid4())
        order_info = f"Thanh toan lich hen {appointment_id}"
        # MoMo yêu cầu extraData KHÔNG ĐƯỢC NULL. Dùng chuỗi rỗng.
        extra_data = ""
        request_type = "captureWallet"

        # BƯỚC CỰC KỲ QUAN TRỌNG: TẠO CHỮ KÝ (SIGNATURE)
        # Thứ tự các field này là bất di bất dịch theo tài liệu MoMo V2
        raw_signature = (
            f"accessKey={access_key}&"
            f"amount={amount}&"
            f"extraData={extra_data}&"
            f"ipnUrl={notify_url}&"
            f"orderId={order_id}&"
            f"orderInfo={order_info}&"
            f"partnerCode={partner_code}&"
            f"redirectUrl={return_url}&"
            f"requestId={request_id}&"
            f"requestType={request_type}"
        )

        signature = hmac.new(
            secret_key.encode("utf-8"),
            raw_signature.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        # BUILD PAYLOAD GỬI ĐI
        # Chú ý: Không gửi thừa field partnerName hay storeId nếu vẫn bị lỗi format
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

        # Gửi request bằng json= thay vì data= để requests tự xử lý Content-Type
        response = requests.post(endpoint, json=payload, timeout=10)
        res_data = response.json()



        if res_data.get("resultCode") == 0:
            # Lưu DB
            payment = Payment(
                orderId=order_id,
                amount=amount,
                status="PENDING",
                appointmentId=appointment_id,
                createdAt=datetime.now(timezone.utc)
            )
            db.session.add(payment)
            db.session.commit()
            return jsonify({"success": True, "payUrl": res_data.get("payUrl")})

        return jsonify({
            "success": False,
            "message": res_data.get("message"),
            "subErrors": res_data.get("subErrors")
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

        # SUCCESS
        if result_code == 0:
            payment.status = "PAID"

            # update appointment luôn
            appt = Appointment.query.get(payment.appointmentId)
            if appt:
                appt.status = AppointmentStatus.CONFIRMED
                appt.paymentLocked = False
                appt.updatedAt = datetime.now(timezone.utc)

        # FAILED
        else:
            payment.status = "FAILED"

        db.session.commit()

        return jsonify({"message": "OK"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500