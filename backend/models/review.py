from datetime import datetime
from sqlalchemy import func
from db.db import db


class Review(db.Model):
    __tablename__ = "reviews"

    reviewId      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patientId     = db.Column(db.Integer, db.ForeignKey("patients.patientID"), nullable=False)
    doctorId      = db.Column(db.Integer, db.ForeignKey("doctors.doctorID", ondelete="SET NULL"), nullable=True)
    appointmentId = db.Column(db.Integer, db.ForeignKey("appointments.appointmentId"),
                               unique=True, nullable=False)  # 1 review / 1 appointment
    rating        = db.Column(db.Integer,  nullable=False)   # 1–5
    comment       = db.Column(db.Text,     nullable=True)
    createdAt     = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updatedAt     = db.Column(db.DateTime, default=datetime.utcnow,
                               onupdate=datetime.utcnow, nullable=False)

    # Relationships
    patient     = db.relationship("Patient",     back_populates="reviews")
    doctor      = db.relationship("Doctor",      back_populates="reviews")
    appointment = db.relationship("Appointment", back_populates="review")

    # ── UML method ────────────────────────────────────────────────
    def submit(self):
        db.session.add(self)
        db.session.flush()
        self._recalc_doctor_rating()

    def _recalc_doctor_rating(self):
        if self.doctor:
            avg = db.session.query(func.avg(Review.rating)).filter(
                Review.doctorId == self.doctorId
            ).scalar()
            self.doctor.rating = round(float(avg), 2) if avg else 0.0

    def to_dict(self, include_patient=False, include_doctor=False, include_appointment=False):
        data = {
            "reviewId":      self.reviewId,
            "patientId":     self.patientId,
            "doctorId":      self.doctorId,
            "appointmentId": self.appointmentId,
            "rating":        self.rating,
            "comment":       self.comment,
            "createdAt":     self.createdAt.isoformat(),
            "updatedAt":     self.updatedAt.isoformat(),
        }
        if include_patient and self.patient:
            data["patient"] = self.patient.to_dict()
        if include_doctor and self.doctor:
            data["doctor"] = self.doctor.to_dict(include_user=True)
        if include_appointment and self.appointment:
            data["appointment"] = self.appointment.to_dict()
        return data