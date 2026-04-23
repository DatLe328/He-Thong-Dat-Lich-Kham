import enum

from db.db import db
from datetime import datetime




class AppointmentStatus(enum.Enum):
    PENDING   = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Appointment(db.Model):
    __tablename__ = "appointments"

    appointmentId = db.Column(db.Integer, primary_key=True, autoincrement=True)

    patientId = db.Column(db.Integer, db.ForeignKey("patients.patientID"), nullable=True)


    doctorId = db.Column(db.Integer, db.ForeignKey("doctors.doctorID", ondelete="SET NULL"), nullable=True)

    scheduleId = db.Column(db.Integer, db.ForeignKey("schedules.scheduleId"), nullable=True)

    clinicId = db.Column(db.Integer, db.ForeignKey("clinics.clinicID"), nullable=True)

    appointmentDate = db.Column(db.DateTime, nullable=False)
    reason = db.Column(db.Text, nullable=True)
    note = db.Column(db.Text, nullable=True)
    status = db.Column(db.Enum(AppointmentStatus), default=AppointmentStatus.PENDING, nullable=False)

    cancelReason = db.Column(db.Text, nullable=True)

    createdAt = db.Column(db.DateTime, default=datetime.now, nullable=False)
    updatedAt = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)
    expiresAt = db.Column(db.DateTime, nullable=True)
    paymentLocked = db.Column(db.Boolean, default=False)
    paymentLockedAt = db.Column(db.DateTime, nullable=True)

    # relationships
    patient = db.relationship("Patient", back_populates="appointments")
    doctor = db.relationship("Doctor", back_populates="appointments")
    schedule = db.relationship("Schedule", back_populates="appointments")
    clinic = db.relationship("Clinic", back_populates="appointments")
    notifications = db.relationship(
        "Notification",
        back_populates="appointment",
        cascade="all, delete-orphan"
    )
    review = db.relationship(
        "Review",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan"
    )
    proxyBooking = db.relationship(
        "ProxyBooking",
        back_populates="appointment",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="[ProxyBooking.appointmentId]"
    )

    def to_dict(self):
        proxy = self.proxyBooking

        return {
            "appointmentId": self.appointmentId,
            "patientId": self.patientId,
            "doctorId": self.doctorId,
            "scheduleId": self.scheduleId,
            "clinicId": self.clinicId,
            "appointmentDate": self.appointmentDate.isoformat() if self.appointmentDate else None,
            "reason": self.reason,
            "note": self.note,
            "status": self.status.value,
            "cancelReason": self.cancelReason,


            "proxyFirstName": proxy.firstName if proxy else None,
            "proxyLastName": proxy.lastName if proxy else None,
            "proxyPhone": proxy.phone if proxy else None,
            "proxyEmail": proxy.email if proxy else None,
            "proxyGender": proxy.gender if proxy else None,
            "proxyAddress": proxy.address if proxy else None,

            "createdAt": self.createdAt.isoformat(),
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
            "expiresAt": self.expiresAt.isoformat() if self.expiresAt else None,
        }

    def cancel(self, reason="USER_CANCEL"):
        self.status = AppointmentStatus.CANCELLED
        self.cancelReason = reason
        self.updatedAt = datetime.now()

    def mark_no_show(self):
        self.status = AppointmentStatus.CANCELLED
        self.cancelReason = "NO_SHOW"
        self.updatedAt = datetime.now()
