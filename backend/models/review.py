from datetime import datetime
from db.db import db


class Review(db.Model):
    __tablename__ = "reviews"

    reviewId      = db.Column(db.Integer, primary_key=True, autoincrement=True)
    patientId     = db.Column(db.Integer, db.ForeignKey("patients.patientID"), nullable=False)
    doctorId      = db.Column(db.Integer, db.ForeignKey("doctors.doctorID", ondelete="SET NULL"), nullable=True)
    appointmentId = db.Column(db.Integer, db.ForeignKey("appointments.appointmentId"),
                               unique=True, nullable=False)  # one review per appointment
    rating        = db.Column(db.Integer, nullable=False)   # 1-5
    comment       = db.Column(db.Text,    nullable=True)
    createdAt     = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    patient     = db.relationship("Patient",     back_populates="reviews")
    doctor      = db.relationship("Doctor",      back_populates="reviews")
    appointment = db.relationship("Appointment", back_populates="review")

    def submit(self):
        from db.db import db as _db
        from sqlalchemy import func
        _db.session.add(self)
        _db.session.flush()

        avg = _db.session.query(func.avg(Review.rating)).filter_by(
            doctorId=self.doctorId
        ).scalar()
        if avg is not None:
            self.doctor.rating = round(float(avg), 2)

    def to_dict(self):
        return {
            "reviewId":      self.reviewId,
            "patientId":     self.patientId,
            "doctorId":      self.doctorId,
            "appointmentId": self.appointmentId,
            "rating":        self.rating,
            "comment":       self.comment,
            "createdAt":     self.createdAt.isoformat(),
        }