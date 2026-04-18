from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.proxy_booking import ProxyBooking


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
        # LOGIN MODE / GUEST MODE
        # =========================
        patient = None

        if userId:
            patient = Patient.query.filter_by(userID=userId).first()
            if not patient:
                return None, "Không tìm thấy bệnh nhân"
        else:
            if not patientInfo:
                return None, "Thiếu thông tin người đặt lịch"

        # =========================
        # CHECK SCHEDULE
        # =========================
        if scheduleId:
            schedule = Schedule.query.get(scheduleId)
            if not schedule or not schedule.isAvailable:
                return None, "Lịch không khả dụng"

        # =========================
        # CHECK TRÙNG SLOT (FIX 409)
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
                patientId=patient.patientID if patient and not isProxy else None,
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
            print("DAO ERROR:", e)  # 🔥 debug thật
            return None, str(e)