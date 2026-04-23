from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from models.appointment import Appointment, AppointmentStatus
from db.db import db
import logging

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
                # 🔒 double safety check
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



def start_scheduler(app):
    try:

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

        if not scheduler.running:
            scheduler.start()
            logger.info("[SCHEDULER] Appointment cron started")

    except Exception as e:
        logger.error(f"[SCHEDULER ERROR] {str(e)}")