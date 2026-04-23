from db.db import db


def _build_full_name(user):
    if not user:
        return ""
    return " ".join(
        part.strip()
        for part in [user.firstName or "", user.lastName or ""]
        if part and part.strip()
    )


class Patient(db.Model):
    __tablename__ = "patients"

    patientID = db.Column(db.Integer, primary_key=True, autoincrement=True)


    userID = db.Column(db.Integer, db.ForeignKey("users.userID"), nullable=True)

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

    def to_dict(self, include_user=True):
        data = {
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

        if include_user and self.user:
            data["user"] = self.user.to_dict()

        return data


@db.event.listens_for(Patient, "before_insert")
@db.event.listens_for(Patient, "before_update")
def _sync_patient_full_name(mapper, connection, target):
    if target.fullName:
        return

    if target.user:
        target.fullName = _build_full_name(target.user)
        return

    if target.userID:
        users_table = db.metadata.tables["users"]
        row = connection.execute(
            users_table.select()
            .with_only_columns(users_table.c.firstName, users_table.c.lastName)
            .where(users_table.c.userID == target.userID)
        ).first()
        if row:
            target.fullName = " ".join(part for part in [row.firstName, row.lastName] if part)
