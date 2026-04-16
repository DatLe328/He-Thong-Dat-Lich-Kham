import secrets
from datetime import datetime

from flask import Blueprint, current_app, request, jsonify
from sqlalchemy import or_

from db.db import db
from models.user import User, UserRole

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_request_data():
    return request.get_json(silent=True) or {}


def _date(value):
    try:
        return datetime.strptime(value, "%Y-%m-%d").date() if value else None
    except ValueError:
        return None


def _split_google_name(name, given_name=None, family_name=None):
    first_name = (given_name or "").strip()
    last_name = (family_name or "").strip()

    if first_name or last_name:
        return first_name or "Google", last_name or "User"

    parts = (name or "").strip().split()
    if not parts:
        return "Google", "User"

    if len(parts) == 1:
        return parts[0], "User"

    return " ".join(parts[:-1]), parts[-1]


def _serialize_auth_user(user, provider="credentials", avatar=None):
    data = user.to_dict()
    return {
        "id": str(data["userID"]),
        "name": f"{data['firstName']} {data['lastName']}".strip(),
        "email": data["email"],
        "phone": data["phone"],
        "role": data["role"],
        "provider": provider,
        "avatar": avatar,
        "gender": data["gender"],
        "dateOfBirth": data["dateOfBirth"],
        "address": data["address"],
    }


def _verify_google_credential(credential, client_id):

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    return id_token.verify_oauth2_token(
        credential,
        google_requests.Request(),
        client_id,
    )


@auth_bp.route("/register", methods=["POST"])
def register():
    data = _get_request_data()

    email = (data.get("email") or "").strip().lower()
    first_name = (data.get("firstName") or "").strip()
    last_name = (data.get("lastName") or "").strip()
    phone = (data.get("phone") or "").strip() or None
    gender = (data.get("gender") or "").strip() or None
    date_of_birth_raw = data.get("dateOfBirth")
    date_of_birth = _date(date_of_birth_raw)
    address = (data.get("address") or "").strip() or None
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

    # check missing fields
    if not email or not first_name or not last_name or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # check password confirm
    if not confirm_password:
        return jsonify({"error": "Missing confirmPassword"}), 400

    if password != confirm_password:
        return jsonify({"error": "Passwords do not match"}), 400

    if date_of_birth_raw and not date_of_birth:
        return jsonify({"error": "Invalid dateOfBirth"}), 400

    # check email exists
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    # check phone exists
    if phone and User.query.filter_by(phone=phone).first():
        return jsonify({"error": "Phone already exists"}), 400


    user = User(
        email=email,
        firstName=first_name,
        lastName=last_name,
        phone=phone,
        gender=gender,
        dateOfBirth=date_of_birth,
        address=address,
        role=UserRole.PATIENT.value
    )

    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "message": "Register success",
        "user": user.to_dict()
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = _get_request_data()

    identifier = data.get("identifier")  # email hoặc phone
    password = data.get("password")

    if not identifier or not password:
        return jsonify({"error": "Missing credentials"}), 400

    # find user by email or phone
    user = User.query.filter(
        or_(
            User.email == identifier,
            User.phone == identifier
        )
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.check_password(password):
        return jsonify({"error": "Wrong password"}), 401

    return jsonify({
        "message": "Login success",
        "user": user.to_dict()
    }), 200


@auth_bp.route("/google", methods=["POST"])
def google_login():
    data = _get_request_data()
    credential = data.get("credential")
    client_id = current_app.config.get("GOOGLE_CLIENT_ID")

    if not credential:
        return jsonify({"error": "Missing Google credential"}), 400

    if not client_id:
        return jsonify({"error": "Missing GOOGLE_CLIENT_ID config"}), 500

    try:
        google_profile = _verify_google_credential(credential, client_id)
    except ValueError:
        return jsonify({"error": "Invalid Google credential"}), 401
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500

    google_id = google_profile.get("sub")
    email = (google_profile.get("email") or "").strip().lower()
    email_verified = google_profile.get("email_verified")

    if not google_id or not email:
        return jsonify({"error": "Google profile missing required fields"}), 400

    if email_verified is False:
        return jsonify({"error": "Google email is not verified"}), 401

    user = User.query.filter(
        or_(
            User.googleID == google_id,
            User.email == email,
        )
    ).first()

    if user:
        if not user.googleID:
            user.googleID = google_id
            db.session.commit()
    else:
        first_name, last_name = _split_google_name(
            google_profile.get("name"),
            google_profile.get("given_name"),
            google_profile.get("family_name"),
        )

        user = User(
            firstName=first_name,
            lastName=last_name,
            email=email,
            googleID=google_id,
            role=UserRole.PATIENT,
        )
        user.set_password(f"google-oauth:{google_id}:{secrets.token_urlsafe(24)}")
        db.session.add(user)
        db.session.commit()

    return jsonify({
        "message": "Google login success",
        "user": _serialize_auth_user(
            user,
            provider="google",
            avatar=google_profile.get("picture"),
        ),
    }), 200
