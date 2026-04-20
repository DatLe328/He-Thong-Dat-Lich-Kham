from __future__ import annotations
from typing import Optional
from sqlalchemy import func, desc

from db.db import db
from models.review      import Review
from models.appointment import Appointment, AppointmentStatus


class ReviewDAO:

    # ──────────────────────────────────────────────────────────────
    # CREATE
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def create(
        patientId: int,
        appointmentId: int,
        rating: int,
        comment: str = None,
    ) -> tuple[Optional[Review], str]:
        # Validate rating
        if not isinstance(rating, int) or not (1 <= rating <= 5):
            return None, "Rating phải là số nguyên từ 1 đến 5."

        appt = Appointment.query.get(appointmentId)
        if not appt:
            return None, "Không tìm thấy lịch hẹn."
        if appt.patientId != patientId:
            return None, "Bạn không có quyền đánh giá lịch hẹn này."
        if appt.status != AppointmentStatus.COMPLETED:
            return None, "Chỉ có thể đánh giá lịch hẹn đã HOÀN THÀNH."

        existing = Review.query.filter_by(appointmentId=appointmentId).first()
        if existing:
            return None, "Lịch hẹn này đã được đánh giá rồi."

        review = Review(
            patientId=patientId,
            doctorId=appt.doctorId,
            appointmentId=appointmentId,
            rating=rating,
            comment=comment,
        )
        review.submit() 
        db.session.commit()
        db.session.refresh(review)
        return review, None

    @staticmethod
    def get_by_id(review_id: int) -> Optional[Review]:
        return Review.query.get(review_id)

    @staticmethod
    def get_by_appointment(appointment_id: int) -> Optional[Review]:
        return Review.query.filter_by(appointmentId=appointment_id).first()

    @staticmethod
    def search(
        doctor_id: int = None,
        patient_id: int = None,
        min_rating: int = None,
        max_rating: int = None,
        sort_by: str = "newest",   # newest | oldest | rating_asc | rating_desc
        page: int = 1,
        per_page: int = 20,
    ):
        q = Review.query

        if doctor_id:
            q = q.filter_by(doctorId=doctor_id)
        if patient_id:
            q = q.filter_by(patientId=patient_id)
        if min_rating is not None:
            q = q.filter(Review.rating >= min_rating)
        if max_rating is not None:
            q = q.filter(Review.rating <= max_rating)

        sort_map = {
            "newest":      desc(Review.createdAt),
            "oldest":      Review.createdAt.asc(),
            "rating_asc":  Review.rating.asc(),
            "rating_desc": desc(Review.rating),
        }
        q = q.order_by(sort_map.get(sort_by, desc(Review.createdAt)))

        return q.paginate(page=page, per_page=per_page, error_out=False)

    # ──────────────────────────────────────────────────────────────
    # UPDATE
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def update(
        review_id: int,
        patient_id: int,
        rating: int = None,
        comment: str = None,
    ) -> tuple[Optional[Review], str]:
        review = Review.query.get(review_id)
        if not review:
            return None, "Không tìm thấy đánh giá."
        if review.patientId != patient_id:
            return None, "Bạn không có quyền chỉnh sửa đánh giá này."

        if rating is not None:
            if not isinstance(rating, int) or not (1 <= rating <= 5):
                return None, "Rating phải là số nguyên từ 1 đến 5."
            review.rating = rating
            review._recalc_doctor_rating()

        if comment is not None:
            review.comment = comment

        db.session.commit()
        db.session.refresh(review)
        return review, None

    # ──────────────────────────────────────────────────────────────
    # DELETE
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def delete(
        review_id: int,
        patient_id: int = None,
    ) -> tuple[bool, str]:
        review = Review.query.get(review_id)
        if not review:
            return False, "Không tìm thấy đánh giá."
        if patient_id and review.patientId != patient_id:
            return False, "Bạn không có quyền xoá đánh giá này."

        doctor = review.doctor
        db.session.delete(review)
        db.session.flush()

        if doctor:
            avg = db.session.query(func.avg(Review.rating)).filter(
                Review.doctorId == doctor.doctorID
            ).scalar()
            doctor.rating = round(float(avg), 2) if avg else 0.0

        db.session.commit()
        return True, None

    @staticmethod
    def get_stats(doctor_id: int) -> dict:
        rows = (
            db.session.query(Review.rating, func.count(Review.reviewId).label("cnt"))
            .filter(Review.doctorId == doctor_id)
            .group_by(Review.rating)
            .all()
        )

        distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        total = 0
        total_score = 0
        for rating, cnt in rows:
            distribution[str(rating)] = cnt
            total       += cnt
            total_score += rating * cnt

        avg = round(total_score / total, 2) if total else 0.0

        return {
            "doctorId":     doctor_id,
            "avgRating":    avg,
            "totalReviews": total,
            "distribution": distribution,
        }