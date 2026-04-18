from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule import Schedule
from models.notification import Notification
from models.patient import Patient
from models.proxy_booking import ProxyBooking


class AppointmentDAO:

    @staticmethod
    def create(
        userId,
        doctorId,
        appointmentDate,
        scheduleId=None,
        clinicId=None,
        reason=None,
        isProxy=False,
        patientInfo=None
    ):

        # =========================
        # GET PATIENT
        # =========================
        patient = Patient.query.filter_by(userID=userId).first()

        if not patient:
            return None, "Chưa có hồ sơ bệnh nhân"

        proxy_data = None
        proxy = None

        # =========================
        # PROXY BOOKING
        # =========================
        if isProxy:
            if not patientInfo:
                return None, "Thiếu thông tin người đặt hộ"

            proxy_data = {
                "fullName": f"{patientInfo.get('lastName','')} {patientInfo.get('firstName','')}".strip(),
                "phone": patientInfo.get("phone"),
                "email": patientInfo.get("email"),
                "gender": patientInfo.get("gender"),
                "address": patientInfo.get("address"),
            }

        # =========================
        # CHECK SCHEDULE
        # =========================
        if scheduleId:
            schedule = Schedule.query.get(scheduleId)
            if not schedule or not schedule.isAvailable:
                return None, "Lịch không khả dụng"

        try:

            # =========================
            # CREATE APPOINTMENT
            # =========================
            appt = Appointment(
                patientId=patient.patientID,
                doctorId=doctorId,
                scheduleId=scheduleId,
                clinicId=clinicId,
                appointmentDate=appointmentDate,
                reason=reason,
                status=AppointmentStatus.PENDING
            )

            db.session.add(appt)
            db.session.flush()  # lấy appointmentId

            # =========================
            # CREATE PROXY BOOKING (NẾU CÓ)
            # =========================
            if isProxy and patientInfo:
                proxy = ProxyBooking(
                    appointmentId=appt.appointmentId,
                    firstName=patientInfo.get("firstName", "").strip(),
                    lastName=patientInfo.get("lastName", "").strip(),
                    phone=patientInfo.get("phone"),
                    email=patientInfo.get("email"),
                    gender=patientInfo.get("gender"),
                    address=patientInfo.get("address")
                )

                db.session.add(proxy)

            # =========================
            # NOTIFICATION
            # =========================
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
            return None, str(e)