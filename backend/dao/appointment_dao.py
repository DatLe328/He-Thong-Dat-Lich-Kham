from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.proxy_booking import ProxyBooking
from models.user import User, UserRole


# =========================
# UTILS
# =========================
def build_full_name(user):
    return f"{user.firstName or ''} {user.lastName or ''}".strip()


def map_gender(g):
    if not g:
        return None
    g = g.lower()
    if g == "male":
        return "Nam"
    if g == "female":
        return "Nữ"
    return g


def create_patient_from_user(user):
    patient = Patient(
        userID=user.userID,
        fullName=build_full_name(user),
        phone=user.phone,
        gender=user.gender,
        address=user.address,
        dateOfBirth=user.dateOfBirth,
    )
    db.session.add(patient)
    db.session.flush()
    return patient


# =========================
# DAO
# =========================
class AppointmentDAO:

    @staticmethod
    def create(
        userId=None,
        doctorId=None,
        appointmentDate=None,
        scheduleId=None,
        clinicId=None,
        reason=None,
        patientInfo=None,
        note=None
    ):

        # =========================
        # VALIDATE
        # =========================
        if not doctorId or not scheduleId or not appointmentDate:
            return None, "Thiếu dữ liệu bắt buộc"

        if not userId and not patientInfo:
            return None, "Thiếu thông tin bệnh nhân"

        patient = None

        # =========================
        # USER LOGIN
        # =========================
        if userId:
            patient = Patient.query.filter_by(userID=userId).first()

            if not patient:
                user = db.session.get(User, userId)
                if not user:
                    return None, "Không tìm thấy user"

                if user.role != UserRole.PATIENT:
                    return None, "Không phải bệnh nhân"

                patient = create_patient_from_user(user)

        # =========================
        # GUEST / PROXY
        # =========================
        else:
            phone = patientInfo.get("phone")

            if not phone:
                return None, "Thiếu số điện thoại"

            patient = Patient.query.filter_by(phone=phone).first()

            if not patient:
                patient = Patient(
                    fullName=f"{patientInfo.get('lastName','')} {patientInfo.get('firstName','')}".strip(),
                    phone=phone,
                    gender=map_gender(patientInfo.get("gender")),
                    address=patientInfo.get("address"),
                    dateOfBirth=patientInfo.get("dateOfBirth"),
                    userID=None
                )
                db.session.add(patient)
                db.session.flush()

        # =========================
        # CHECK SCHEDULE
        # =========================
        schedule = Schedule.query.get(scheduleId)
        if not schedule or not schedule.isAvailable:
            return None, "Lịch không khả dụng"

        # =========================
        # DUPLICATE CHECK
        # =========================
        existing = Appointment.query.filter(
            Appointment.scheduleId == scheduleId,
            Appointment.appointmentDate == appointmentDate,
            Appointment.status != AppointmentStatus.CANCELLED
        ).first()

        if existing:
            return None, "Khung giờ đã được đặt"

        try:
            appt = Appointment(
                patientId=patient.patientID,
                doctorId=doctorId,
                scheduleId=scheduleId,
                clinicId=clinicId,
                appointmentDate=appointmentDate,
                reason=reason,
                status=AppointmentStatus.PENDING,
                note=note,
            )

            db.session.add(appt)
            db.session.flush()

            # =========================
            # PROXY BOOKING
            # =========================
            if patientInfo:
                db.session.add(ProxyBooking(
                    appointmentId=appt.appointmentId,
                    firstName=patientInfo.get("firstName"),
                    lastName=patientInfo.get("lastName"),
                    phone=patientInfo.get("phone"),
                    email=patientInfo.get("email"),
                    gender=map_gender(patientInfo.get("gender")),
                    address=patientInfo.get("address"),
                ))

            # =========================
            # NOTIFICATION
            # =========================
            if userId:
                db.session.add(Notification(
                    userId=userId,
                    appointmentId=appt.appointmentId,
                    message=f"Đặt lịch #{appt.appointmentId} thành công",
                    channel="IN_APP"
                ))

            db.session.flush()
            return appt, None

        except Exception as e:
            db.session.rollback()
            return None, str(e)