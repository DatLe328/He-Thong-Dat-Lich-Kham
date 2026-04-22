from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.proxy_booking import ProxyBooking
from models.user import User, UserRole


def _build_full_name(user):
    return " ".join(
        part.strip()
        for part in [user.firstName or "", user.lastName or ""]
        if part and part.strip()
    )


def _create_patient_from_user(user):
    patient = Patient(
        userID=user.userID,
        fullName=_build_full_name(user),
        phone=user.phone,
        gender=user.gender,
        address=user.address,
        dateOfBirth=user.dateOfBirth,
    )
    db.session.add(patient)
    db.session.flush()
    return patient


class AppointmentDAO:

    @staticmethod
    def create(
        userId=None,
        doctorId=None,
        appointmentDate=None,
        scheduleId=None,
        clinicId=None,
        reason=None,
        isProxy=False,
        patientInfo=None
    ):

        # =========================
        # VALIDATE
        # =========================
        if not userId and not patientInfo:
            return None, "Thiếu thông tin người đặt lịch"

        patient = None

        # =========================
        # USER LOGIN
        # =========================
        if userId:
            patient = Patient.query.filter_by(userID=userId).first()

            if not patient:
                user = db.session.get(User, userId)
                if not user:
                    return None, "Không tìm thấy người dùng"

                if user.role != UserRole.PATIENT:
                    return None, "Tài khoản không phải bệnh nhân"

                patient = _create_patient_from_user(user)

        # =========================
        # GUEST / PROXY → AUTO CREATE PATIENT
        # =========================
        else:
            phone = patientInfo.get("phone")

            patient = Patient.query.filter_by(phone=phone).first()

            if not patient:
                patient = Patient(
                    fullName=f"{patientInfo.get('lastName','')} {patientInfo.get('firstName','')}".strip(),
                    phone=phone,
                    gender=patientInfo.get("gender"),
                    address=patientInfo.get("address"),
                )
                db.session.add(patient)
                db.session.flush()

        # =========================
        # CHECK SCHEDULE
        # =========================
        if scheduleId:
            schedule = Schedule.query.get(scheduleId)
            if not schedule or not schedule.isAvailable:
                return None, "Lịch không khả dụng"

        # =========================
        # CHECK DUPLICATE SLOT
        # =========================
        if scheduleId:
            existing = Appointment.query.filter(
                Appointment.scheduleId == scheduleId,
                Appointment.appointmentDate == appointmentDate,
                Appointment.status != AppointmentStatus.CANCELLED
            ).first()

            if existing:
                return None, "Khung giờ này đã được đặt"

        try:

            # =========================
            # CREATE APPOINTMENT
            # =========================
            appt = Appointment(
                patientId=patient.patientID,   # 🔥 FIX QUAN TRỌNG
                doctorId=doctorId,
                scheduleId=scheduleId,
                clinicId=clinicId,
                appointmentDate=appointmentDate,
                reason=reason,
                status=AppointmentStatus.PENDING
            )

            db.session.add(appt)
            db.session.flush()

            # =========================
            # PROXY BOOKING
            # =========================
            if isProxy and patientInfo:
                proxy = ProxyBooking(
                    appointmentId=appt.appointmentId,
                    firstName=(patientInfo.get("firstName") or "").strip(),
                    lastName=(patientInfo.get("lastName") or "").strip(),
                    phone=patientInfo.get("phone"),
                    email=patientInfo.get("email"),
                    gender=patientInfo.get("gender"),
                    address=patientInfo.get("address")
                )
                db.session.add(proxy)

            # =========================
            # NOTIFICATION
            # =========================
            if userId:
                notif = Notification(
                    userId=userId,
                    appointmentId=appt.appointmentId,
                    message=f"Đặt lịch #{appt.appointmentId} thành công",
                    channel="IN_APP"
                )
                db.session.add(notif)

            db.session.commit()
            return appt, None

        except Exception as e:
            db.session.rollback()
            print("DAO ERROR:", e)
            return None, str(e)