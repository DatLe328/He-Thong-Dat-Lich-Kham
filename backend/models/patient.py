from db.db import db


class Patient(db.Model):
    __tablename__ = "patients"

    patientID = db.Column(db.Integer, primary_key=True, autoincrement=True)


    userID = db.Column(db.Integer, db.ForeignKey("users.userID"), nullable=False)

    fullName = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    gender = db.Column(db.String(10), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    dateOfBirth = db.Column(db.Date, nullable=True)

    insuranceId = db.Column(db.String(100), nullable=True)
    bloodType = db.Column(db.String(10), nullable=True)

    user = db.relationship("User", back_populates="patient")
    appointments = db.relationship("Appointment", back_populates="patient")
    reviews = db.relationship("Review", back_populates="patient")

    def to_dict(self):
        return {
            "patientID": self.patientID,
            "userID": self.userID,
            "fullName": self.fullName,
            "phone": self.phone,
            "gender": self.gender,
            "address": self.address,
            "dateOfBirth": self.dateOfBirth.isoformat() if self.dateOfBirth else None,
            "insuranceId": self.insuranceId,
            "bloodType": self.bloodType,
        }