from flask import Blueprint, jsonify, request
from db.db import db
from models.user import User, UserRole
from datetime import datetime
from models.doctor import Doctor

user_bp = Blueprint("user", __name__, url_prefix="/api/users")


# =========================
# GET ALL USERS
# =========================
@user_bp.route("", methods=["GET"])
def get_users():
    users = User.query.order_by(User.userID.desc()).all()

    return jsonify({
        "success": True,
        "data": [u.to_dict() for u in users]
    }), 200


# =========================
# GET USER BY ID
# =========================
@user_bp.route("/<int:user_id>", methods=["GET"])
def get_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy người dùng"
        }), 404

    return jsonify({
        "success": True,
        "data": user.to_dict()
    }), 200


# =========================
# CREATE USER
# =========================
@user_bp.route("", methods=["POST"])
def create_user():
    d = request.get_json() or {}

    required = ["firstName", "lastName", "email", "password"]
    missing = [f for f in required if not d.get(f)]

    if missing:
        return jsonify({
            "success": False,
            "message": f"Thiếu: {', '.join(missing)}"
        }), 400

    role = d.get("role", "PATIENT")

    # ❌ Không cho tạo ADMIN
    if role == "ADMIN":
        return jsonify({
            "success": False,
            "message": "FORBIDDEN_ADMIN_CREATE"
        }), 403

    # duplicate email
    if User.query.filter_by(email=d["email"]).first():
        return jsonify({
            "success": False,
            "message": "EMAIL_EXISTS"
        }), 409

    user = User(
        firstName=d["firstName"],
        lastName=d["lastName"],
        email=d["email"],
        phone=d.get("phone"),
        gender=d.get("gender"),
        address=d.get("address"),
        role=UserRole[role]
    )

    user.set_password(d["password"])

    if d.get("dateOfBirth"):
        try:
            user.dateOfBirth = datetime.strptime(
                d["dateOfBirth"], "%Y-%m-%d"
            ).date()
        except:
            pass

    db.session.add(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Tạo user thành công",
        "data": user.to_dict()
    }), 201


# =========================
# UPDATE USER
# =========================
@user_bp.route("/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy người dùng"
        }), 404

    d = request.get_json() or {}

    # ❌ Không cho sửa ADMIN
    if user.role == UserRole.ADMIN:
        return jsonify({
            "success": False,
            "message": "CANNOT_MODIFY_ADMIN"
        }), 403

    # ===== BASIC INFO =====
    user.firstName = d.get("firstName", user.firstName)
    user.lastName  = d.get("lastName", user.lastName)
    user.phone     = d.get("phone", user.phone)
    user.gender    = d.get("gender", user.gender)
    user.address   = d.get("address", user.address)

    # ===== EMAIL =====
    if d.get("email"):
        if User.query.filter(
            User.email == d["email"],
            User.userID != user_id
        ).first():
            return jsonify({
                "success": False,
                "message": "EMAIL_EXISTS"
            }), 409

        user.email = d["email"]

    # =========================
    # ROLE SYNC USER ↔ DOCTOR
    # =========================
    if d.get("role"):
        new_role = d["role"]

        if new_role == "ADMIN":
            return jsonify({
                "success": False,
                "message": "FORBIDDEN_ADMIN_ROLE"
            }), 403

        try:
            new_role_enum = UserRole[new_role]
        except:
            return jsonify({
                "success": False,
                "message": "INVALID_ROLE"
            }), 400

        old_role = user.role

        # ===== CHUYỂN SANG DOCTOR =====
        if new_role_enum == UserRole.DOCTOR:
            doctor = Doctor.query.filter_by(userID=user.userID).first()

            if not doctor:
                doctor = Doctor(
                    userID=user.userID,
                    clinicID=d.get("clinicID"),
                    specialization=d.get("specialization", "Chưa cập nhật"),
                    licenseNumber=d.get("licenseNumber", f"AUTO-{user.userID}"),
                    bio=d.get("bio"),
                    rating=0
                )
                db.session.add(doctor)

        # ===== RỜI DOCTOR =====
        if old_role == UserRole.DOCTOR and new_role_enum != UserRole.DOCTOR:
            doctor = Doctor.query.filter_by(userID=user.userID).first()
            if doctor:
                db.session.delete(doctor)

        user.role = new_role_enum

    # ===== DATE =====
    if d.get("dateOfBirth"):
        try:
            user.dateOfBirth = datetime.strptime(
                d["dateOfBirth"], "%Y-%m-%d"
            ).date()
        except:
            pass

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Cập nhật thành công",
        "data": user.to_dict()
    }), 200


# =========================
# DELETE USER
# =========================
@user_bp.route("/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "success": False,
            "message": "Không tìm thấy người dùng"
        }), 404


    if user.role == UserRole.ADMIN:
        return jsonify({
            "success": False,
            "message": "FORBIDDEN_DELETE_ADMIN"
        }), 403

    try:
        # nếu là doctor thì xoá doctor trước
        doctor = Doctor.query.filter_by(userID=user.userID).first()
        if doctor:
            db.session.delete(doctor)

        db.session.delete(user)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Xóa user thành công"
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

