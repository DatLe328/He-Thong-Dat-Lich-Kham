from flask import Blueprint, jsonify, request
from db.db import db
from models.user import User, UserRole
from datetime import datetime

user_bp = Blueprint("user", __name__, url_prefix="/api/users")


# =========================
# GET ALL USERS (FULL DATA)
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
            "message": f"Thiếu: {missing}"
        }), 400

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
        role=UserRole[d.get("role", "PATIENT")]
    )

    user.set_password(d["password"])

    if d.get("dateOfBirth"):
        try:
            user.dateOfBirth = datetime.strptime(d["dateOfBirth"], "%Y-%m-%d").date()
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
# UPDATE USER (FULL)
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

    # update fields
    user.firstName = d.get("firstName", user.firstName)
    user.lastName  = d.get("lastName", user.lastName)
    user.phone     = d.get("phone", user.phone)
    user.gender    = d.get("gender", user.gender)
    user.address   = d.get("address", user.address)

    if d.get("email"):
        # check duplicate email
        if User.query.filter(User.email == d["email"], User.userID != user_id).first():
            return jsonify({
                "success": False,
                "message": "EMAIL_EXISTS"
            }), 409
        user.email = d["email"]

    if d.get("role"):
        try:
            user.role = UserRole[d["role"]]
        except:
            pass

    if d.get("dateOfBirth"):
        try:
            user.dateOfBirth = datetime.strptime(d["dateOfBirth"], "%Y-%m-%d").date()
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

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Xóa người dùng thành công"
    }), 200