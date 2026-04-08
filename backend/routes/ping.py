from flask import Blueprint, jsonify

health_bp = Blueprint("health_bp", __name__)

@health_bp.route("/ping", methods=["GET"])
def get_health():
    return jsonify({"data":"pong"})