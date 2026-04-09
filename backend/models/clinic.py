from db.db import db


class Clinic(db.Model):
    __tablename__ = "clinics"

    clinicID    = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name        = db.Column(db.String(200), nullable=False)
    address     = db.Column(db.String(300), nullable=True)
    phone       = db.Column(db.String(20),  nullable=True)
    specialties = db.Column(db.Text, nullable=True) 

    # Relationships
    doctors      = db.relationship("Doctor",      back_populates="clinic")
    schedules    = db.relationship("Schedule",    back_populates="clinic")
    appointments = db.relationship("Appointment", back_populates="clinic")

    def getDoctors(self):
        return self.doctors

    def getAvailableSlots(self):
        slots = []
        for schedule in self.schedules:
            slots.extend(schedule.getAvailableSlots())
        return slots

    def search(self, keyword: str):
        return Clinic.query.filter(
            Clinic.name.ilike(f"%{keyword}%")
        ).all()

    def getProfile(self):
        return self.to_dict(include_doctors=True)

    def get_specialties_list(self):
        if not self.specialties:
            return []
        return [s.strip() for s in self.specialties.split(",")]

    def set_specialties_list(self, lst: list):
        self.specialties = ", ".join(lst)

    def to_dict(self, include_doctors=False):
        data = {
            "clinicID":    self.clinicID,
            "name":        self.name,
            "address":     self.address,
            "phone":       self.phone,
            "specialties": self.get_specialties_list(),
        }
        if include_doctors:
            data["doctors"] = [d.to_dict(include_user=True) for d in self.doctors]
        return data