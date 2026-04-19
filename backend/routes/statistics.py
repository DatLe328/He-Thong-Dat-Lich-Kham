from datetime import datetime, timedelta, date

from flask import Blueprint, jsonify, request

from dao.statistics_dao import StatisticsDAO

statistics_bp = Blueprint("statistics", __name__, url_prefix="/api/statistics")


def _parse_date_arg(name):
    raw = request.args.get(name)
    if not raw:
        return None, None
    try:
        return datetime.strptime(raw, "%Y-%m-%d").date(), None
    except ValueError:
        return None, f"{name} phải có định dạng YYYY-MM-DD"


def _parse_int_arg(name):
    raw = request.args.get(name)
    if raw in (None, ""):
        return None, None
    try:
        value = int(raw)
    except ValueError:
        return None, f"{name} phải là số nguyên"
    if value <= 0:
        return None, f"{name} phải lớn hơn 0"
    return value, None


def _filters(default_last_days=None):
    start_date, err = _parse_date_arg("from")
    if err:
        return None, err

    end_date, err = _parse_date_arg("to")
    if err:
        return None, err

    if default_last_days and not start_date and not end_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=default_last_days - 1)

    if start_date and end_date and start_date > end_date:
        return None, "from không được lớn hơn to"

    doctor_id, err = _parse_int_arg("doctor_id")
    if err:
        return None, err

    clinic_id, err = _parse_int_arg("clinic_id")
    if err:
        return None, err

    return {
        "start_date": start_date,
        "end_date": end_date,
        "doctor_id": doctor_id,
        "clinic_id": clinic_id,
    }, None


def _limit(default=5, maximum=20):
    value, err = _parse_int_arg("limit")
    if err:
        return None, err
    return min(value or default, maximum), None


def _err(message, code=400):
    return jsonify({"success": False, "message": message}), code


@statistics_bp.route("/overview", methods=["GET"])
def overview():
    filters, err = _filters()
    if err:
        return _err(err)

    data = StatisticsDAO.overview(**filters)
    return jsonify({"success": True, "data": data}), 200


@statistics_bp.route("/appointments/status", methods=["GET"])
def appointments_by_status():
    filters, err = _filters()
    if err:
        return _err(err)

    data = StatisticsDAO.appointments_by_status(**filters)
    return jsonify({"success": True, "data": data}), 200


@statistics_bp.route("/appointments/daily", methods=["GET"])
def daily_appointments():
    filters, err = _filters(default_last_days=30)
    if err:
        return _err(err)

    data = StatisticsDAO.daily_appointments(**filters)
    return jsonify({"success": True, "data": data}), 200


@statistics_bp.route("/doctors/top", methods=["GET"])
def top_doctors():
    filters, err = _filters()
    if err:
        return _err(err)

    limit, err = _limit()
    if err:
        return _err(err)

    data = StatisticsDAO.top_doctors(
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        clinic_id=filters["clinic_id"],
        limit=limit,
    )
    return jsonify({"success": True, "data": data}), 200


@statistics_bp.route("/clinics/top", methods=["GET"])
def top_clinics():
    filters, err = _filters()
    if err:
        return _err(err)

    limit, err = _limit()
    if err:
        return _err(err)

    data = StatisticsDAO.top_clinics(
        start_date=filters["start_date"],
        end_date=filters["end_date"],
        doctor_id=filters["doctor_id"],
        limit=limit,
    )
    return jsonify({"success": True, "data": data}), 200
