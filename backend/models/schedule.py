from datetime import datetime, time, timedelta
from db.db import db


class Schedule(db.Model):
    __tablename__ = "schedules"

    scheduleId   = db.Column(db.Integer, primary_key=True, autoincrement=True)
    doctorID     = db.Column(db.Integer, db.ForeignKey("doctors.doctorID"), nullable=False)
    clinicID     = db.Column(db.Integer, db.ForeignKey("clinics.clinicID"), nullable=True)
    workDate     = db.Column(db.Date,    nullable=False)
    startTime    = db.Column(db.Time,    nullable=False)
    endTime      = db.Column(db.Time,    nullable=False)
    isAvailable  = db.Column(db.Boolean, default=True, nullable=False)
    slotDuration = db.Column(db.Integer, default=30, nullable=False)  # minutes

    # Relationships
    doctor       = db.relationship("Doctor",      back_populates="schedules")
    clinic       = db.relationship("Clinic",      back_populates="schedules")
    appointments = db.relationship("Appointment", back_populates="schedule")

    def getAvailableSlots(self) -> list:
        if not self.isAvailable:
            return []

        slots = []
        booked_times = {
            a.appointmentDate.time()
            for a in self.appointments
            if a.status.value not in ("CANCELLED",)
        }

        start  = datetime.combine(self.workDate, self.startTime)
        end    = datetime.combine(self.workDate, self.endTime)
        delta  = timedelta(minutes=self.slotDuration)
        cursor = start

        while cursor + delta <= end:
            t = cursor.time()
            slots.append({
                "time":      t.strftime("%H:%M"),
                "available": t not in booked_times,
            })
            cursor += delta
        return slots

    def checkConflict(self, new_start: time, new_end: time) -> bool:
        for appt in self.appointments:
            if appt.status.value == "CANCELLED":
                continue
            slot_end = (
                datetime.combine(self.workDate, appt.appointmentDate.time())
                + timedelta(minutes=self.slotDuration)
            ).time()
            appt_time = appt.appointmentDate.time()
            if not (new_end <= appt_time or new_start >= slot_end):
                return True
        return False

    def to_dict(self):
        return {
            "scheduleId":   self.scheduleId,
            "doctorID":     self.doctorID,
            "clinicID":     self.clinicID,
            "workDate":     self.workDate.isoformat(),
            "startTime":    self.startTime.strftime("%H:%M"),
            "endTime":      self.endTime.strftime("%H:%M"),
            "isAvailable":  self.isAvailable,
            "slotDuration": self.slotDuration,
        }