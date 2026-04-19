import enum
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from db.db import db


class UserRole(enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR  = "DOCTOR"
    ADMIN   = "ADMIN"


class User(db.Model):
    __tablename__ = "users"

    userID       = db.Column(db.Integer, primary_key=True, autoincrement=True)
    firstName    = db.Column(db.String(100), nullable=False)
    lastName     = db.Column(db.String(100), nullable=False)
    phone        = db.Column(db.String(20),  unique=True,  nullable=True)
    email        = db.Column(db.String(150), unique=True,  nullable=False)
    passwordHash = db.Column(db.String(256), nullable=False)
    googleID     = db.Column(db.String(200), unique=True,  nullable=True)
    role         = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    gender       = db.Column(db.String(10),  nullable=True)
    dateOfBirth  = db.Column(db.Date,        nullable=True)
    address      = db.Column(db.String(300), nullable=True)
    createdAt    = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updatedAt    = db.Column(db.DateTime, default=datetime.utcnow,
                             onupdate=datetime.utcnow, nullable=False)

    doctor  = db.relationship("Doctor",  back_populates="user", uselist=False,
                               cascade="all, delete-orphan")
    patient = db.relationship("Patient", back_populates="user", uselist=False,
                               cascade="all, delete-orphan")
    notifications = db.relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy=True
    )

    def set_password(self, raw: str):
        self.passwordHash = generate_password_hash(raw)

    def check_password(self, raw: str) -> bool:
        return check_password_hash(self.passwordHash, raw)

    def login(self) -> bool:
        return True

    def logout(self) -> None:
        pass

    def to_dict(self):
        return {
            "userID":      self.userID,
            "firstName":   self.firstName,
            "lastName":    self.lastName,
            "phone":       self.phone,
            "email":       self.email,
            "googleID":    self.googleID,
            "role":        self.role.value,
            "gender":      self.gender,
            "dateOfBirth": self.dateOfBirth.isoformat() if self.dateOfBirth else None,
            "address":     self.address,
            "createdAt":   self.createdAt.isoformat(),
            "updatedAt":   self.updatedAt.isoformat(),
        }