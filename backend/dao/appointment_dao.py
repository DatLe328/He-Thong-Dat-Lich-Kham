from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import or_, and_
from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.schedule    import Schedule
from models.notification import Notification


class AppointmentDAO:
    @staticmethod
    def create(
        patientId: int,
        doctorId: int,
        appointmentDate: datetime,
        scheduleId: int = None,
        clinicId: int = None,
        reason: str = None,
    ) -> tuple[Appointment, str]:
        if scheduleId:
            conflict_msg = AppointmentDAO._check_slot_conflict(
                scheduleId, appointmentDate, exclude_id=None
            )
            if conflict_msg:
                return None, conflict_msg

        appt = Appointment(
            patientId=patientId,
            doctorId=doctorId,
            scheduleId=scheduleId,
            clinicId=clinicId,
            appointmentDate=appointmentDate,
            reason=reason,
            status=AppointmentStatus.PENDING,
        )
        db.session.add(appt)
        db.session.commit()
        db.session.refresh(appt)

        AppointmentDAO._notify(
            userId=appt.patient.userID,
            appointmentId=appt.appointmentId,
            message=f"Lịch hẹn #{appt.appointmentId} đã được tạo. Trạng thái: PENDING.",
        )

        return appt, None

    @staticmethod
    def get_by_id(appointment_id: int, full=False) -> Optional[Appointment]:
        return Appointment.query.get(appointment_id)

    @staticmethod
    def search(
        patient_id: int = None,
        doctor_id: int = None,
        clinic_id: int = None,
        schedule_id: int = None,
        status: str = None,
        date_from: datetime = None,
        date_to: datetime = None,
        upcoming_only: bool = False,
        page: int = 1,
        per_page: int = 20,
    ):
        q = Appointment.query

        if patient_id:
            q = q.filter_by(patientId=patient_id)
        if doctor_id:
            q = q.filter_by(doctorId=doctor_id)
        if clinic_id:
            q = q.filter_by(clinicId=clinic_id)
        if schedule_id:
            q = q.filter_by(scheduleId=schedule_id)
        if status:
            try:
                q = q.filter_by(status=AppointmentStatus[status.upper()])
            except KeyError:
                pass
        if date_from:
            q = q.filter(Appointment.appointmentDate >= date_from)
        if date_to:
            q = q.filter(Appointment.appointmentDate <= date_to)
        if upcoming_only:
            q = q.filter(Appointment.appointmentDate >= datetime.utcnow())

        q = q.order_by(Appointment.appointmentDate.asc())
        return q.paginate(page=page, per_page=per_page, error_out=False)

    @staticmethod
    def confirm(appointment_id: int) -> tuple[Optional[Appointment], str]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None, "Không tìm thấy lịch hẹn."
        if appt.status != AppointmentStatus.PENDING:
            return None, f"Không thể xác nhận lịch hẹn ở trạng thái {appt.status.value}."

        appt.status = AppointmentStatus.CONFIRMED
        db.session.commit()

        AppointmentDAO._notify(
            userId=appt.patient.userID,
            appointmentId=appt.appointmentId,
            message=f"Lịch hẹn #{appt.appointmentId} đã được XÁC NHẬN vào {appt.appointmentDate.strftime('%d/%m/%Y %H:%M')}.",
        )
        return appt, None

    @staticmethod
    def complete(appointment_id: int) -> tuple[Optional[Appointment], str]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None, "Không tìm thấy lịch hẹn."
        if appt.status != AppointmentStatus.CONFIRMED:
            return None, f"Không thể hoàn thành lịch hẹn ở trạng thái {appt.status.value}."

        appt.status = AppointmentStatus.COMPLETED
        db.session.commit()

        AppointmentDAO._notify(
            userId=appt.patient.userID,
            appointmentId=appt.appointmentId,
            message=f"Lịch hẹn #{appt.appointmentId} đã HOÀN THÀNH. Cảm ơn bạn đã sử dụng dịch vụ.",
        )
        return appt, None

    @staticmethod
    def cancel(
        appointment_id: int,
        reason: str = None,
        cancelled_by: str = "patient",  # "patient" | "doctor" | "admin"
    ) -> tuple[Optional[Appointment], str]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None, "Không tìm thấy lịch hẹn."
        if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
            return None, f"Không thể huỷ lịch hẹn ở trạng thái {appt.status.value}."

        appt.cancel(reason)
        db.session.commit()

        msg = f"Lịch hẹn #{appt.appointmentId} đã bị HUỶ bởi {cancelled_by}."
        if reason:
            msg += f" Lý do: {reason}"
        AppointmentDAO._notify(
            userId=appt.patient.userID,
            appointmentId=appt.appointmentId,
            message=msg,
        )
        if appt.doctor:
            AppointmentDAO._notify(
                userId=appt.doctor.userID,
                appointmentId=appt.appointmentId,
                message=msg,
            )
        return appt, None

    @staticmethod
    def reschedule(
        appointment_id: int,
        new_date: datetime,
        new_schedule_id: int = None,
    ) -> tuple[Optional[Appointment], str]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return None, "Không tìm thấy lịch hẹn."
        if appt.status in (AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED):
            return None, f"Không thể dời lịch hẹn ở trạng thái {appt.status.value}."

        sid = new_schedule_id or appt.scheduleId
        if sid:
            conflict_msg = AppointmentDAO._check_slot_conflict(
                sid, new_date, exclude_id=appointment_id
            )
            if conflict_msg:
                return None, conflict_msg

        old_date = appt.appointmentDate
        appt.appointmentDate = new_date
        if new_schedule_id:
            appt.scheduleId = new_schedule_id
        appt.status = AppointmentStatus.PENDING

        db.session.commit()

        AppointmentDAO._notify(
            userId=appt.patient.userID,
            appointmentId=appt.appointmentId,
            message=(
                f"Lịch hẹn #{appt.appointmentId} đã được DỜI LỊCH "
                f"từ {old_date.strftime('%d/%m/%Y %H:%M')} "
                f"sang {new_date.strftime('%d/%m/%Y %H:%M')}."
            ),
        )
        return appt, None

    @staticmethod
    def delete(appointment_id: int) -> tuple[bool, str]:
        appt = Appointment.query.get(appointment_id)
        if not appt:
            return False, "Không tìm thấy lịch hẹn."
        if appt.status not in (AppointmentStatus.PENDING, AppointmentStatus.CANCELLED):
            return False, "Chỉ được xoá lịch hẹn ở trạng thái PENDING hoặc CANCELLED."

        db.session.delete(appt)
        db.session.commit()
        return True, None

    @staticmethod
    def get_available_slots(schedule_id: int) -> tuple[Optional[list], str]:
        schedule = Schedule.query.get(schedule_id)
        if not schedule:
            return None, "Không tìm thấy lịch làm việc."
        return schedule.getAvailableSlots(), None

    @staticmethod
    def get_stats(doctor_id: int = None, patient_id: int = None) -> dict:
        from sqlalchemy import func
        q = db.session.query(
            Appointment.status,
            func.count(Appointment.appointmentId).label("count")
        )
        if doctor_id:
            q = q.filter(Appointment.doctorId == doctor_id)
        if patient_id:
            q = q.filter(Appointment.patientId == patient_id)

        rows = q.group_by(Appointment.status).all()
        stats = {s.value: 0 for s in AppointmentStatus}
        for row in rows:
            stats[row.status.value] = row.count
        stats["total"] = sum(stats.values())
        return stats

    @staticmethod
    def _check_slot_conflict(
        schedule_id: int,
        appointment_date: datetime,
        exclude_id: int = None,
    ) -> Optional[str]:
        schedule = Schedule.query.get(schedule_id)
        if not schedule:
            return "Không tìm thấy lịch làm việc."
        if not schedule.isAvailable:
            return "Lịch làm việc này không còn hoạt động."
        if appointment_date.date() != schedule.workDate:
            return (
                f"Ngày hẹn ({appointment_date.date()}) không khớp với "
                f"ngày làm việc của lịch ({schedule.workDate})."
            )

        appt_time = appointment_date.time()
        if not (schedule.startTime <= appt_time < schedule.endTime):
            return (
                f"Giờ hẹn {appt_time.strftime('%H:%M')} nằm ngoài "
                f"khung giờ làm việc {schedule.startTime.strftime('%H:%M')}–"
                f"{schedule.endTime.strftime('%H:%M')}."
            )

        slot_end = (
            datetime.combine(schedule.workDate, appt_time)
            + timedelta(minutes=schedule.slotDuration)
        ).time()

        conflict_q = Appointment.query.filter(
            Appointment.scheduleId == schedule_id,
            Appointment.status.notin_([AppointmentStatus.CANCELLED]),
        )
        if exclude_id:
            conflict_q = conflict_q.filter(
                Appointment.appointmentId != exclude_id
            )

        for existing in conflict_q.all():
            e_time = existing.appointmentDate.time()
            e_end  = (
                datetime.combine(schedule.workDate, e_time)
                + timedelta(minutes=schedule.slotDuration)
            ).time()
            if not (slot_end <= e_time or appt_time >= e_end):
                return (
                    f"Slot {appt_time.strftime('%H:%M')} đã được đặt. "
                    "Vui lòng chọn giờ khác."
                )
        return None

    @staticmethod
    def _notify(userId: int, appointmentId: int, message: str):
        notif = Notification(
            userId=userId,
            appointmentId=appointmentId,
            message=message,
            channel="IN_APP",
        )
        db.session.add(notif)
        db.session.commit()