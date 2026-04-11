from flask import Blueprint, request, jsonify
from datetime import datetime
from dao.appointment_dao import AppointmentDAO

appointment_bp = Blueprint("appointment", __name__, url_prefix="/api/appointments")


def _dt(v: str):
    if not v:
        return None
    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M"):
        try:
            return datetime.strptime(v, fmt)
        except ValueError:
            continue
    return None

def _date(v: str):
    try:
        return datetime.strptime(v, "%Y-%m-%d") if v else None
    except ValueError:
        return None

def _paginate_meta(p):
    return {
        "total":   p.total,
        "pages":   p.pages,
        "page":    p.page,
        "perPage": p.per_page,
        "hasNext": p.has_next,
        "hasPrev": p.has_prev,
    }

def _err(msg, code=400):
    return jsonify({"success": False, "message": msg}), code

def _ok(data=None, msg="Thành công.", code=200, **extra):
    body = {"success": True, "message": msg}
    if data is not None:
        body["data"] = data
    body.update(extra)
    return jsonify(body), code


@appointment_bp.route("", methods=["POST"])
def create_appointment():
    d = request.get_json(silent=True) or {}

    missing = [f for f in ["patientId", "doctorId", "appointmentDate"] if not d.get(f)]
    if missing:
        return _err(f"Thiếu trường bắt buộc: {missing}")

    appt_date = _dt(d["appointmentDate"])
    if not appt_date:
        return _err("appointmentDate không hợp lệ. Dùng định dạng ISO: '2026-04-20T09:00'.")

    if appt_date < datetime.utcnow():
        return _err("Không thể đặt lịch hẹn trong quá khứ.")

    appt, err = AppointmentDAO.create(
        patientId=d["patientId"],
        doctorId=d["doctorId"],
        appointmentDate=appt_date,
        scheduleId=d.get("scheduleId"),
        clinicId=d.get("clinicId"),
        reason=d.get("reason"),
    )
    if err:
        return _err(err, 409)

    return _ok(appt.to_dict(), "Tạo lịch hẹn thành công.", 201)


@appointment_bp.route("", methods=["GET"])
def list_appointments():
    page     = max(1, request.args.get("page",     1,  type=int))
    per_page = min(100, max(1, request.args.get("per_page", 20, type=int)))

    pag = AppointmentDAO.search(
        patient_id   = request.args.get("patient_id",  type=int),
        doctor_id    = request.args.get("doctor_id",   type=int),
        clinic_id    = request.args.get("clinic_id",   type=int),
        schedule_id  = request.args.get("schedule_id", type=int),
        status       = request.args.get("status"),
        date_from    = _date(request.args.get("date_from")),
        date_to      = _date(request.args.get("date_to")),
        upcoming_only= request.args.get("upcoming", "false").lower() == "true",
        page=page, per_page=per_page,
    )

    return _ok(
        [a.to_dict() for a in pag.items],
        pagination=_paginate_meta(pag),
    )


@appointment_bp.route("/<int:appointment_id>", methods=["GET"])
def get_appointment(appointment_id):
    appt = AppointmentDAO.get_by_id(appointment_id)
    if not appt:
        return _err("Không tìm thấy lịch hẹn.", 404)
    return _ok(appt.to_dict())


@appointment_bp.route("/<int:appointment_id>", methods=["PUT"])
def update_appointment(appointment_id):
    appt = AppointmentDAO.get_by_id(appointment_id)
    if not appt:
        return _err("Không tìm thấy lịch hẹn.", 404)
    if appt.status in ("COMPLETED", "CANCELLED"):
        return _err(f"Không thể chỉnh sửa lịch hẹn ở trạng thái {appt.status.value}.")

    d = request.get_json(silent=True) or {}
    allowed = {"reason", "clinicId"}
    for key in allowed:
        if key in d:
            setattr(appt, key, d[key])

    from db.db import db
    db.session.commit()
    return _ok(appt.to_dict(), "Cập nhật thành công.")


@appointment_bp.route("/<int:appointment_id>", methods=["DELETE"])
def delete_appointment(appointment_id):
    ok, err = AppointmentDAO.delete(appointment_id)
    if not ok:
        code = 404 if "tìm thấy" in err else 400
        return _err(err, code)
    return _ok(msg="Đã xoá lịch hẹn.")

@appointment_bp.route("/<int:appointment_id>/confirm", methods=["PATCH"])
def confirm_appointment(appointment_id):
    appt, err = AppointmentDAO.confirm(appointment_id)
    if err:
        code = 404 if "tìm thấy" in err else 409
        return _err(err, code)
    return _ok(appt.to_dict(), "Lịch hẹn đã được xác nhận.")


@appointment_bp.route("/<int:appointment_id>/complete", methods=["PATCH"])
def complete_appointment(appointment_id):
    appt, err = AppointmentDAO.complete(appointment_id)
    if err:
        code = 404 if "tìm thấy" in err else 409
        return _err(err, code)
    return _ok(appt.to_dict(), "Lịch hẹn đã hoàn thành.")


@appointment_bp.route("/<int:appointment_id>/cancel", methods=["PATCH"])
def cancel_appointment(appointment_id):
    d = request.get_json(silent=True) or {}
    appt, err = AppointmentDAO.cancel(
        appointment_id,
        reason=d.get("reason"),
        cancelled_by=d.get("cancelled_by", "patient"),
    )
    if err:
        code = 404 if "tìm thấy" in err else 409
        return _err(err, code)
    return _ok(appt.to_dict(), "Lịch hẹn đã được huỷ.")


@appointment_bp.route("/<int:appointment_id>/reschedule", methods=["PATCH"])
def reschedule_appointment(appointment_id):
    d = request.get_json(silent=True) or {}
    new_date = _dt(d.get("appointmentDate"))
    if not new_date:
        return _err("appointmentDate không hợp lệ. Dùng định dạng ISO.")

    if new_date < datetime.utcnow():
        return _err("Không thể dời lịch về quá khứ.")

    appt, err = AppointmentDAO.reschedule(
        appointment_id,
        new_date=new_date,
        new_schedule_id=d.get("scheduleId"),
    )
    if err:
        code = 404 if "tìm thấy" in err else 409
        return _err(err, code)
    return _ok(appt.to_dict(), "Đã dời lịch hẹn thành công.")

@appointment_bp.route("/<int:appointment_id>/detail", methods=["GET"])
def get_appointment_detail(appointment_id):
    appt = AppointmentDAO.get_by_id(appointment_id)
    if not appt:
        return _err("Không tìm thấy lịch hẹn.", 404)
    return _ok(appt.to_dict(full=True))


@appointment_bp.route("/slots/<int:schedule_id>", methods=["GET"])
def get_available_slots(schedule_id):
    slots, err = AppointmentDAO.get_available_slots(schedule_id)
    if err:
        return _err(err, 404)

    available_count = sum(1 for s in slots if s["available"])
    return _ok(
        slots,
        total=len(slots),
        available=available_count,
        booked=len(slots) - available_count,
    )


@appointment_bp.route("/stats", methods=["GET"])
def get_stats():
    doctor_id  = request.args.get("doctor_id",  type=int)
    patient_id = request.args.get("patient_id", type=int)

    stats = AppointmentDAO.get_stats(doctor_id=doctor_id, patient_id=patient_id)
    return _ok(stats)