from flask import Blueprint, request, jsonify
from sqlalchemy import or_

from db.db import db
from models.user import User, UserRole

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    email = data.get("email")
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    phone = data.get("phone")
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
    data = request.get_json()

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