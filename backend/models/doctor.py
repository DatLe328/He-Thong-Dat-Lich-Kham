from db.db import db


class Doctor(db.Model):
    __tablename__ = "doctors"

    doctorID       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userID         = db.Column(db.Integer, db.ForeignKey("users.userID"),
                                unique=True, nullable=False)
    clinicID       = db.Column(db.Integer, db.ForeignKey("clinics.clinicID"),
                                nullable=True)   # doctor may belong to a clinic
    specialization = db.Column(db.String(200), nullable=True)
    licenseNumber  = db.Column(db.String(100), unique=True, nullable=True)
    bio            = db.Column(db.Text,        nullable=True)
    rating         = db.Column(db.Float,       default=0.0, nullable=False)

    # Relationships
    user         = db.relationship("User",   back_populates="doctor")
    clinic       = db.relationship("Clinic", back_populates="doctors")
    schedules    = db.relationship("Schedule",    back_populates="doctor",
                                   cascade="all, delete-orphan")
    appointments = db.relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctorId", passive_deletes=True)
    reviews      = db.relationship("Review", back_populates="doctor", foreign_keys="Review.doctorId", passive_deletes=True)

    def getAppointment(self):
        return self.appointments

    def searchBySpecialty(self, specialty: str):
        return Doctor.query.filter(
            Doctor.specialization.ilike(f"%{specialty}%")
        ).all()

    def updateProfile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)

    def to_dict(self, include_user=True, include_clinic=False):
        data = {
            "doctorID":       self.doctorID,
            "userID":         self.userID,
            "clinicID":       self.clinicID,
            "specialization": self.specialization,
            "licenseNumber":  self.licenseNumber,
            "bio":            self.bio,
            "rating":         self.rating,
        }
        if include_user and self.user:
            data["user"] = self.user.to_dict()
        if include_clinic and self.clinic:
            data["clinic"] = self.clinic.to_dict(include_doctors=False)
        return data