from datetime import date, datetime, time

from db.db import db
from models.appointment import Appointment, AppointmentStatus
from models.clinic import Clinic
from models.doctor import Doctor
from models.notification import Notification
from models.patient import Patient
from models.proxy_booking import ProxyBooking
from models.review import Review
from models.schedule import Schedule
from models.user import User, UserRole


def _get_or_create_user(**kwargs):
    user = User.query.filter_by(email=kwargs["email"]).first()
    if user:
        for key, value in kwargs.items():
            if key == "password":
                continue
            if value is None:
                continue
            if hasattr(user, key):
                setattr(user, key, value)
        if "password" in kwargs:
            user.set_password(kwargs["password"])
        return user, False

    password = kwargs.pop("password")
    user = User(**kwargs)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()
    return user, True


def _get_or_create_clinic(name, **kwargs):
    clinic = Clinic.query.filter_by(name=name).first()
    if clinic:
        for key, value in kwargs.items():
            if value is not None and hasattr(clinic, key):
                setattr(clinic, key, value)
        return clinic, False

    clinic = Clinic(name=name, **kwargs)
    db.session.add(clinic)
    db.session.flush()
    return clinic, True


def _get_or_create_doctor(user, **kwargs):
    doctor = Doctor.query.filter_by(userID=user.userID).first()
    if doctor:
        for key, value in kwargs.items():
            if value is not None and hasattr(doctor, key):
                setattr(doctor, key, value)
        return doctor, False

    doctor = Doctor(userID=user.userID, **kwargs)
    db.session.add(doctor)
    db.session.flush()
    return doctor, True


def _get_or_create_patient(user, **kwargs):
    patient = Patient.query.filter_by(userID=user.userID).first()
    if patient:
        for key, value in kwargs.items():
            if value is not None and hasattr(patient, key):
                setattr(patient, key, value)
        return patient, False

    full_name = kwargs.pop("fullName", f"{user.firstName} {user.lastName}")
    patient = Patient(userID=user.userID, fullName=full_name, **kwargs)
    db.session.add(patient)
    db.session.flush()
    return patient, True


def _get_or_create_schedule(**kwargs):
    schedule = Schedule.query.filter_by(
        doctorID=kwargs["doctorID"],
        clinicID=kwargs.get("clinicID"),
        workDate=kwargs["workDate"],
        startTime=kwargs["startTime"],
        endTime=kwargs["endTime"],
    ).first()
    if schedule:
        for key, value in kwargs.items():
            if value is not None and hasattr(schedule, key):
                setattr(schedule, key, value)
        return schedule, False

    schedule = Schedule(**kwargs)
    db.session.add(schedule)
    db.session.flush()
    return schedule, True


def _get_or_create_appointment(**kwargs):
    appointment = Appointment.query.filter_by(
        doctorId=kwargs.get("doctorId"),
        patientId=kwargs.get("patientId"),
        scheduleId=kwargs.get("scheduleId"),
        clinicId=kwargs.get("clinicId"),
        appointmentDate=kwargs.get("appointmentDate"),
    ).first()
    if appointment:
        for key, value in kwargs.items():
            if key == "status" and value is not None:
                appointment.status = value
                continue
            if value is not None and hasattr(appointment, key):
                setattr(appointment, key, value)
        return appointment, False

    appointment = Appointment(**kwargs)
    db.session.add(appointment)
    db.session.flush()
    return appointment, True


def _get_or_create_proxy_booking(**kwargs):
    proxy = ProxyBooking.query.filter_by(appointmentId=kwargs["appointmentId"]).first()
    if proxy:
        for key, value in kwargs.items():
            if key == "appointmentId":
                continue
            if value is not None and hasattr(proxy, key):
                setattr(proxy, key, value)
        return proxy, False

    proxy = ProxyBooking(**kwargs)
    db.session.add(proxy)
    db.session.flush()
    return proxy, True


def _get_or_create_notification(**kwargs):
    notif = Notification.query.filter_by(
        appointmentId=kwargs.get("appointmentId"),
        userId=kwargs.get("userId"),
        message=kwargs.get("message"),
    ).first()
    if notif:
        for key, value in kwargs.items():
            if value is not None and hasattr(notif, key):
                setattr(notif, key, value)
        return notif, False

    notif = Notification(**kwargs)
    db.session.add(notif)
    db.session.flush()
    return notif, True


def _get_or_create_review(**kwargs):
    review = Review.query.filter_by(appointmentId=kwargs["appointmentId"]).first()
    if review:
        for key, value in kwargs.items():
            if key == "appointmentId":
                continue
            if value is not None and hasattr(review, key):
                setattr(review, key, value)
        review._recalc_doctor_rating()
        return review, False

    review = Review(**kwargs)
    review.submit()
    return review, True


def seed_demo_data():
    clinic, clinic_created = _get_or_create_clinic(
        "Phòng khám Trung Tâm",
        address="123 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh",
        phone="19009999",
        specialties="Tim mạch, Da liễu, Nội tổng quát",
    )

    admin_user, admin_created = _get_or_create_user(
        firstName="System",
        lastName="Admin",
        phone="0909000000",
        email="admin@example.com",
        password="admin123",
        role=UserRole.ADMIN,
        gender="Khác",
        address="Quận 1, TP. Hồ Chí Minh",
    )

    doctor_user_1, doctor_user_1_created = _get_or_create_user(
        firstName="Minh",
        lastName="An",
        phone="0901000001",
        email="minhan@example.com",
        password="secret123",
        role=UserRole.DOCTOR,
        gender="Nam",
        dateOfBirth=date(1985, 3, 20),
        address="Quận 1, TP. Hồ Chí Minh",
    )
    doctor_user_2, doctor_user_2_created = _get_or_create_user(
        firstName="Thu",
        lastName="Hà",
        phone="0901000002",
        email="thuha@example.com",
        password="secret123",
        role=UserRole.DOCTOR,
        gender="Nữ",
        dateOfBirth=date(1988, 8, 14),
        address="Quận 3, TP. Hồ Chí Minh",
    )
    doctor_user_3, doctor_user_3_created = _get_or_create_user(
        firstName="Quang",
        lastName="Huy",
        phone="0901000003",
        email="quanghuy@example.com",
        password="secret123",
        role=UserRole.DOCTOR,
        gender="Nam",
        dateOfBirth=date(1990, 11, 2),
        address="TP. Thủ Đức, TP. Hồ Chí Minh",
    )

    patient_user_1, patient_user_1_created = _get_or_create_user(
        firstName="Lan",
        lastName="Nguyễn",
        phone="0902000001",
        email="lan.nguyen@example.com",
        password="secret123",
        role=UserRole.PATIENT,
        gender="Nữ",
        dateOfBirth=date(1995, 5, 20),
        address="Quận 1, TP. Hồ Chí Minh",
    )
    patient_user_2, patient_user_2_created = _get_or_create_user(
        firstName="Nam",
        lastName="Lê",
        phone="0902000002",
        email="nam.le@example.com",
        password="secret123",
        role=UserRole.PATIENT,
        gender="Nam",
        dateOfBirth=date(1993, 9, 12),
        address="Quận 5, TP. Hồ Chí Minh",
    )

    doctor_1, doctor_1_created = _get_or_create_doctor(
        doctor_user_1,
        clinicID=clinic.clinicID,
        specialization="Tim mạch",
        licenseNumber="GP-001",
        bio="Bác sĩ tim mạch có kinh nghiệm khám và theo dõi điều trị dài hạn.",
    )
    doctor_2, doctor_2_created = _get_or_create_doctor(
        doctor_user_2,
        clinicID=clinic.clinicID,
        specialization="Da liễu",
        licenseNumber="GP-002",
        bio="Tập trung điều trị mụn, viêm da và các bệnh da liễu thường gặp.",
    )
    doctor_3, doctor_3_created = _get_or_create_doctor(
        doctor_user_3,
        clinicID=None,
        specialization="Nội tổng quát",
        licenseNumber="GP-003",
        bio="Khám nội tổng quát, tư vấn sức khỏe định kỳ.",
    )

    patient_1, patient_1_created = _get_or_create_patient(
        patient_user_1,
        fullName="Lan Nguyễn",
        phone="0902000001",
        gender="Nữ",
        address="Quận 1, TP. Hồ Chí Minh",
        dateOfBirth=date(1995, 5, 20),
        insuranceId="BH-001",
        bloodType="O",
    )
    patient_2, patient_2_created = _get_or_create_patient(
        patient_user_2,
        fullName="Nam Lê",
        phone="0902000002",
        gender="Nam",
        address="Quận 5, TP. Hồ Chí Minh",
        dateOfBirth=date(1993, 9, 12),
        insuranceId="BH-002",
        bloodType="A",
    )

    schedule_1, schedule_1_created = _get_or_create_schedule(
        doctorID=doctor_1.doctorID,
        clinicID=clinic.clinicID,
        workDate=date(2026, 5, 1),
        startTime=time(9, 0),
        endTime=time(12, 0),
        isAvailable=True,
        slotDuration=30,
    )
    schedule_2, schedule_2_created = _get_or_create_schedule(
        doctorID=doctor_1.doctorID,
        clinicID=clinic.clinicID,
        workDate=date(2026, 5, 2),
        startTime=time(13, 0),
        endTime=time(17, 0),
        isAvailable=True,
        slotDuration=30,
    )
    schedule_3, schedule_3_created = _get_or_create_schedule(
        doctorID=doctor_2.doctorID,
        clinicID=clinic.clinicID,
        workDate=date(2026, 5, 1),
        startTime=time(8, 0),
        endTime=time(11, 30),
        isAvailable=True,
        slotDuration=30,
    )
    schedule_4, schedule_4_created = _get_or_create_schedule(
        doctorID=doctor_3.doctorID,
        clinicID=None,
        workDate=date(2026, 5, 3),
        startTime=time(14, 0),
        endTime=time(17, 0),
        isAvailable=True,
        slotDuration=30,
    )

    appointment_1, appointment_1_created = _get_or_create_appointment(
        patientId=patient_1.patientID,
        doctorId=doctor_1.doctorID,
        scheduleId=schedule_1.scheduleId,
        clinicId=clinic.clinicID,
        appointmentDate=datetime(2026, 5, 1, 9, 0),
        reason="Đau ngực nhẹ khi vận động",
        status=AppointmentStatus.COMPLETED,
    )
    appointment_2, appointment_2_created = _get_or_create_appointment(
        patientId=patient_2.patientID,
        doctorId=doctor_1.doctorID,
        scheduleId=schedule_1.scheduleId,
        clinicId=clinic.clinicID,
        appointmentDate=datetime(2026, 5, 1, 9, 30),
        reason="Tái khám huyết áp",
        status=AppointmentStatus.COMPLETED,
    )
    appointment_3, appointment_3_created = _get_or_create_appointment(
        patientId=patient_1.patientID,
        doctorId=doctor_2.doctorID,
        scheduleId=schedule_3.scheduleId,
        clinicId=clinic.clinicID,
        appointmentDate=datetime(2026, 5, 1, 8, 30),
        reason="Nổi mẩn da",
        status=AppointmentStatus.PENDING,
    )
    appointment_4, appointment_4_created = _get_or_create_appointment(
        patientId=patient_2.patientID,
        doctorId=doctor_3.doctorID,
        scheduleId=schedule_4.scheduleId,
        clinicId=None,
        appointmentDate=datetime(2026, 5, 3, 14, 30),
        reason="Khám sức khỏe tổng quát",
        status=AppointmentStatus.CANCELLED,
        cancelReason="Bệnh nhân bận đột xuất",
    )
    appointment_5, appointment_5_created = _get_or_create_appointment(
        patientId=None,
        doctorId=doctor_2.doctorID,
        scheduleId=schedule_3.scheduleId,
        clinicId=clinic.clinicID,
        appointmentDate=datetime(2026, 5, 1, 10, 0),
        reason="Đặt lịch hộ cho người thân",
        status=AppointmentStatus.PENDING,
    )

    proxy_1, proxy_1_created = _get_or_create_proxy_booking(
        appointmentId=appointment_5.appointmentId,
        firstName="Ngọc",
        lastName="Trần",
        phone="0903000004",
        email="ngoc.tran@example.com",
        gender="Nữ",
        address="Quận 7, TP. Hồ Chí Minh",
    )

    notification_1, notification_1_created = _get_or_create_notification(
        appointmentId=appointment_1.appointmentId,
        userId=patient_user_1.userID,
        message=f"Đặt lịch #{appointment_1.appointmentId} thành công",
        channel="IN_APP",
    )
    notification_2, notification_2_created = _get_or_create_notification(
        appointmentId=appointment_3.appointmentId,
        userId=patient_user_1.userID,
        message=f"Nhắc lịch cho lịch hẹn #{appointment_3.appointmentId}",
        channel="IN_APP",
    )
    notification_3, notification_3_created = _get_or_create_notification(
        appointmentId=appointment_4.appointmentId,
        userId=patient_user_2.userID,
        message=f"Lịch hẹn #{appointment_4.appointmentId} đã bị hủy",
        channel="IN_APP",
    )
    notification_4, notification_4_created = _get_or_create_notification(
        appointmentId=None,
        userId=admin_user.userID,
        message="Database seed completed successfully.",
        channel="IN_APP",
    )

    review_1, review_1_created = _get_or_create_review(
        patientId=patient_1.patientID,
        doctorId=doctor_1.doctorID,
        appointmentId=appointment_1.appointmentId,
        rating=5,
        comment="Bác sĩ tư vấn rõ ràng, dễ hiểu.",
    )
    review_2, review_2_created = _get_or_create_review(
        patientId=patient_2.patientID,
        doctorId=doctor_1.doctorID,
        appointmentId=appointment_2.appointmentId,
        rating=4,
        comment="Khám nhanh, đúng hẹn.",
    )

    db.session.commit()

    return {
        "clinic": clinic.clinicID,
        "users": {
            "admin": admin_user.userID,
            "doctor_1": doctor_user_1.userID,
            "doctor_2": doctor_user_2.userID,
            "doctor_3": doctor_user_3.userID,
            "patient_1": patient_user_1.userID,
            "patient_2": patient_user_2.userID,
        },
        "doctors": [doctor_1.doctorID, doctor_2.doctorID, doctor_3.doctorID],
        "patients": [patient_1.patientID, patient_2.patientID],
        "schedules": [schedule_1.scheduleId, schedule_2.scheduleId, schedule_3.scheduleId, schedule_4.scheduleId],
        "appointments": [
            appointment_1.appointmentId,
            appointment_2.appointmentId,
            appointment_3.appointmentId,
            appointment_4.appointmentId,
            appointment_5.appointmentId,
        ],
        "reviews": [review_1.reviewId, review_2.reviewId],
        "proxy_bookings": [proxy_1.id],
        "notifications": [
            notification_1.notifId,
            notification_2.notifId,
            notification_3.notifId,
            notification_4.notifId,
        ],
    }