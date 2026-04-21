from datetime import datetime
from db.db import db


class Payment(db.Model):
    __tablename__ = "payments"

    id = db.Column(db.Integer, primary_key=True)

    orderId = db.Column(db.String(100), unique=True, nullable=False, index=True)

    amount = db.Column(db.Float, nullable=False)

    status = db.Column(
        db.String(50),
        nullable=False,
        default="PENDING"
    )  # PENDING, PAID, FAILED

    appointmentId = db.Column(
        db.Integer,
        db.ForeignKey("appointments.appointmentId"),
        nullable=False
    )

    createdAt = db.Column(db.DateTime, default=datetime.now, nullable=False)
