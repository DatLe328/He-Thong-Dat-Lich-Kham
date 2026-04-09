import enum
from datetime import datetime
from db.db import db


class AppointmentStatus(enum.Enum):
    PENDING   = "PENDING"
    CONFIRMED = "CONFIRMED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Appointment(db.Model):
    __tablename__ = "appointments"

    appointmentId   = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patientId       = db.Column(db.Integer, db.ForeignKey("patients.patientID"), nullable=False)
    doctorId        = db.Column(db.Integer, db.ForeignKey("doctors.doctorID", ondelete="SET NULL"), nullable=True)
    scheduleId      = db.Column(db.Integer, db.ForeignKey("schedules.scheduleId"), nullable=True)
    clinicId        = db.Column(db.Integer, db.ForeignKey("clinics.clinicID"),   nullable=True)
    appointmentDate = db.Column(db.DateTime, nullable=False)
    reason          = db.Column(db.Text,    nullable=True)
    status          = db.Column(db.Enum(AppointmentStatus),
                                 default=AppointmentStatus.PENDING, nullable=False)
    cancelReason    = db.Column(db.Text,    nullable=True)
    createdAt       = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updatedAt       = db.Column(db.DateTime, default=datetime.utcnow,
                                 onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient       = db.relationship("Patient",  back_populates="appointments")
    doctor        = db.relationship("Doctor",   back_populates="appointments")
    schedule      = db.relationship("Schedule", back_populates="appointments")
    clinic        = db.relationship("Clinic",   back_populates="appointments")
    review        = db.relationship("Review",   back_populates="appointment", uselist=False,
                                     cascade="all, delete-orphan")
    notifications = db.relationship("Notification", back_populates="appointment",
                                     cascade="all, delete-orphan")

    def cancel(self, reason: str = None):
        self.status       = AppointmentStatus.CANCELLED
        self.cancelReason = reason

    def update(self, data: dict):
        allowed = {"appointmentDate", "reason", "status", "scheduleId", "clinicId"}
        for key, value in data.items():
            if key in allowed and hasattr(self, key):
                setattr(self, key, value)

    def getDetail(self):
        return self.to_dict(full=True)

    def to_dict(self, full=False):
        data = {
            "appointmentId":   self.appointmentId,
            "patientId":       self.patientId,
            "doctorId":        self.doctorId,
            "scheduleId":      self.scheduleId,
            "clinicId":        self.clinicId,
            "appointmentDate": self.appointmentDate.isoformat(),
            "reason":          self.reason,
            "status":          self.status.value,
            "cancelReason":    self.cancelReason,
            "createdAt":       self.createdAt.isoformat(),
            "updatedAt":       self.updatedAt.isoformat(),
        }
        if full:
            if self.patient and self.patient.user:
                data["patient"] = self.patient.to_dict()
            if self.doctor and self.doctor.user:
                data["doctor"] = self.doctor.to_dict()
            if self.clinic:
                data["clinic"] = self.clinic.to_dict()
            if self.schedule:
                data["schedule"] = self.schedule.to_dict()
        return data