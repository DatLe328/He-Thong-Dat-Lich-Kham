from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, time, timedelta
from models.appointment import Appointment, AppointmentStatus
from models.doctor import Doctor
from models.schedule import Schedule
from db.db import db
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def expire_appointments(app):
    with app.app_context():
        now = datetime.now()

        try:

            expired = Appointment.query.filter(
                Appointment.status == AppointmentStatus.PENDING,
                Appointment.paymentLocked == True,
                Appointment.expiresAt.isnot(None),
                Appointment.expiresAt <= now
            ).limit(500).all()

            if not expired:
                logger.info("[CRON] Không có lịch nào cần huỷ.")
                return

            count = 0

            for appt in expired:

                if appt.status != AppointmentStatus.PENDING:
                    continue

                appt.status = AppointmentStatus.CANCELLED
                appt.paymentLocked = False
                appt.updatedAt = now
                appt.cancelReason = "Tự động huỷ do quá hạn thanh toán 5 phút"

                count += 1

            db.session.commit()

            logger.info(
                f"[CRON] Đã huỷ {count} lịch hẹn hết hạn lúc {now.strftime('%Y-%m-%d %H:%M:%S')}"
            )

        except Exception as e:
            db.session.rollback()
            logger.error(f"[CRON ERROR] {str(e)}")


def _generate_schedules_core(days_ahead=30):
    now = datetime.now()
    today = now.date()

    # Config
    work_start_time = time(8, 0)
    work_end_time = time(17, 0)
    slot_duration = 30  # minutes
    working_days = [0, 1, 2, 3, 4]  # Monday=0 to Friday=4

    doctors = Doctor.query.all()
    if not doctors:
        logger.info("[SCHEDULE GENERATOR] Không có bác sĩ nào.")
        return 0

    total_created = 0

    for doctor in doctors:
        doctor_id = doctor.doctorID
        current_date = today

        for _ in range(days_ahead):
            if current_date.weekday() in working_days:
                existing = Schedule.query.filter_by(
                    doctorID=doctor_id,
                    workDate=current_date,
                    startTime=work_start_time,
                    endTime=work_end_time,
                ).first()

                if not existing:
                    schedule = Schedule(
                        doctorID=doctor_id,
                        clinicID=doctor.clinicID,
                        workDate=current_date,
                        startTime=work_start_time,
                        endTime=work_end_time,
                        isAvailable=True,
                        slotDuration=slot_duration,
                    )
                    db.session.add(schedule)
                    total_created += 1

            current_date += timedelta(days=1)

    db.session.commit()

    if total_created > 0:
        logger.info(
            f"[SCHEDULE GENERATOR] Đã tạo {total_created} lịch mới lúc {now.strftime('%Y-%m-%d %H:%M:%S')}"
        )
    else:
        logger.info("[SCHEDULE GENERATOR] Không có lịch mới cần tạo.")

    return total_created


def generate_schedules(app=None, days_ahead=30):
    """Auto-generate schedules cho N ngày tới (Thứ Hai - Thứ Sáu, 8:00-17:00)."""
    try:
        if app is not None:
            with app.app_context():
                return _generate_schedules_core(days_ahead=days_ahead)

        return _generate_schedules_core(days_ahead=days_ahead)
    except Exception as e:
        db.session.rollback()
        logger.error(f"[SCHEDULE GENERATOR ERROR] {str(e)}")
        raise


def start_scheduler(app):
    try:
        # chỉ chạy 1 process thật
        if os.environ.get("WERKZEUG_RUN_MAIN") != "true" and app.debug:
            return

        if not scheduler.get_job("expire_appointments_job"):

            scheduler.add_job(
                id="expire_appointments_job",
                func=expire_appointments,
                trigger="interval",
                minutes=1,
                args=[app],
                max_instances=1,
                coalesce=True
            )

        if not scheduler.get_job("generate_schedules_job"):

            scheduler.add_job(
                id="generate_schedules_job",
                func=generate_schedules,
                trigger="cron",
                hour=2,  # Chạy lúc 2:00 AM hàng ngày
                minute=0,
                args=[app],
                max_instances=1,
                coalesce=True
            )

        if not scheduler.running:
            scheduler.start()
            logger.info("[SCHEDULER] Appointment cron started")
            logger.info("[SCHEDULER] Schedule generator started (2:00 AM daily)")

    except Exception as e:
        logger.error(f"[SCHEDULER ERROR] {str(e)}")