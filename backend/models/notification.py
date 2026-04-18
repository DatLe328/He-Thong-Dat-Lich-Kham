from datetime import datetime
from db.db import db


class Notification(db.Model):
    __tablename__ = "notifications"

    notifId = db.Column(db.Integer, primary_key=True, autoincrement=True)

    appointmentId = db.Column(
        db.Integer,
        db.ForeignKey("appointments.appointmentId"),
        nullable=True
    )

    userId = db.Column(
        db.Integer,
        db.ForeignKey("users.userID"),
        nullable=False
    )

    message = db.Column(db.Text, nullable=False)
    channel = db.Column(db.String(50), default="IN_APP", nullable=False)
    createdAt = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # RELATIONSHIPS (FIX QUAN TRỌNG)
    user = db.relationship(
        "User",
        back_populates="notifications",
        lazy=True
    )

    appointment = db.relationship(
        "Appointment",
        back_populates="notifications",
        lazy=True
    )

    def send(self):
        if self.channel == "EMAIL":
            # TODO: send email
            pass
        elif self.channel == "SMS":
            # TODO: send SMS
            pass

    def to_dict(self):
        return {
            "notifId":       self.notifId,
            "appointmentId": self.appointmentId,
            "userId":        self.userId,
            "message":       self.message,
            "channel":       self.channel,
            "createdAt":     self.createdAt.isoformat(),
        }