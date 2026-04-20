from services.email_service import send_email


def _full_name(first_name, last_name):
    return " ".join(part for part in [first_name, last_name] if part).strip()


def _patient_email(appointment, patient_info=None):
    if appointment.patient and appointment.patient.user:
        return appointment.patient.user.email

    if appointment.proxyBooking and appointment.proxyBooking.email:
        return appointment.proxyBooking.email

    if patient_info:
        return patient_info.get("email")

    return None


def _patient_name(appointment, patient_info=None):
    if appointment.patient:
        if appointment.patient.fullName:
            return appointment.patient.fullName
        if appointment.patient.user:
            name = _full_name(appointment.patient.user.firstName, appointment.patient.user.lastName)
            if name:
                return name

    if appointment.proxyBooking:
        name = _full_name(appointment.proxyBooking.firstName, appointment.proxyBooking.lastName)
        if name:
            return name

    if patient_info:
        name = _full_name(patient_info.get("firstName"), patient_info.get("lastName"))
        if name:
            return name

    return "bệnh nhân"


def _doctor_name(appointment):
    if appointment.doctor and appointment.doctor.user:
        name = _full_name(appointment.doctor.user.firstName, appointment.doctor.user.lastName)
        if name:
            return f"Bác sĩ {name}"

    if appointment.doctorId:
        return f"Bác sĩ #{appointment.doctorId}"

    return "bác sĩ"


def _clinic_name(appointment):
    if appointment.clinic and appointment.clinic.name:
        return appointment.clinic.name
    return "phòng khám"


def _appointment_time(appointment):
    if not appointment.appointmentDate:
        return "chưa cập nhật"
    return appointment.appointmentDate.strftime("%H:%M ngày %d/%m/%Y")


def _send_appointment_email(appointment, subject, intro, patient_info=None, extra_lines=None):
    email = _patient_email(appointment, patient_info=patient_info)
    if not email:
        return False

    lines = [
        f"Xin chào {_patient_name(appointment, patient_info=patient_info)},",
        "",
        intro,
        "",
        f"Mã lịch hẹn: #{appointment.appointmentId}",
        f"Thời gian khám: {_appointment_time(appointment)}",
        f"Bác sĩ: {_doctor_name(appointment)}",
        f"Địa điểm: {_clinic_name(appointment)}",
    ]

    if extra_lines:
        lines.extend(["", *extra_lines])

    lines.extend([
        "",
        "Vui lòng kiểm tra lại thông tin lịch hẹn trước khi đến khám.",
        "Trân trọng,",
        "Hệ thống đặt lịch khám",
    ])

    return send_email(email, subject, "\n".join(lines))


def notify_appointment_created(appointment, patient_info=None):
    return _send_appointment_email(
        appointment,
        "Xác nhận đặt lịch khám",
        "Lịch khám của bạn đã được ghi nhận thành công.",
        patient_info=patient_info,
    )


def notify_appointment_rescheduled(appointment):
    return _send_appointment_email(
        appointment,
        "Thông báo đổi lịch khám",
        "Lịch khám của bạn đã được cập nhật sang thời gian mới.",
    )


def notify_appointment_cancelled(appointment):
    extra_lines = []
    if appointment.cancelReason:
        extra_lines.append(f"Lý do hủy: {appointment.cancelReason}")

    return _send_appointment_email(
        appointment,
        "Thông báo hủy lịch khám",
        "Lịch khám của bạn đã được hủy.",
        extra_lines=extra_lines,
    )
