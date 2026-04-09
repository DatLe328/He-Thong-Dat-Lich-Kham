from db.db import db


class Patient(db.Model):
    __tablename__ = "patients"

    patientID   = db.Column(db.Integer, primary_key=True, autoincrement=True)
    userID      = db.Column(db.Integer, db.ForeignKey("users.userID"),
                             unique=True, nullable=False)
    insuranceId = db.Column(db.String(100), nullable=True)
    bloodType   = db.Column(db.String(10),  nullable=True)

    # Relationships
    user         = db.relationship("User",        back_populates="patient")
    appointments = db.relationship("Appointment", back_populates="patient")
    reviews      = db.relationship("Review",      back_populates="patient")

    def getAppointments(self):
        return self.appointments

    def receiveNotif(self):
        if self.user:
            return self.user.notifications
        return []

    def updateProfile(self, **kwargs):
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
            elif self.user and hasattr(self.user, key):
                setattr(self.user, key, value)

    def to_dict(self, include_user=True):
        data = {
            "patientID":   self.patientID,
            "userID":      self.userID,
            "insuranceId": self.insuranceId,
            "bloodType":   self.bloodType,
        }
        if include_user and self.user:
            data["user"] = self.user.to_dict()
        return data