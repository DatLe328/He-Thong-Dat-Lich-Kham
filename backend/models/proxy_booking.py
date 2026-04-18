from datetime import datetime
from db.db import db


class ProxyBooking(db.Model):
    __tablename__ = "proxy_bookings"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)

    appointmentId = db.Column(
        db.Integer,
        db.ForeignKey("appointments.appointmentId"),
        nullable=False
    )

    firstName = db.Column(db.String(100), nullable=False)
    lastName = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(150))
    gender = db.Column(db.String(10))
    address = db.Column(db.String(255))

    createdAt = db.Column(db.DateTime, default=datetime.now, nullable=False)

    # ✅ FIX QUAN TRỌNG NHẤT
    appointment = db.relationship(
        "Appointment",
        back_populates="proxyBooking",
        foreign_keys=[appointmentId]
    )

    def to_dict(self):
        return {
            "id": self.id,
            "appointmentId": self.appointmentId,
            "firstName": self.firstName,
            "lastName": self.lastName,
            "phone": self.phone,
            "email": self.email,
            "gender": self.gender,
            "address": self.address,
            "createdAt": self.createdAt.isoformat()
        }