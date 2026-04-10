import { Link, useParams } from "react-router-dom";
import DoctorAvatar from "../components/DoctorAvatar";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { doctors } from "../data/doctors";

function DoctorDetailPage() {
  const { user } = useAuth();
  const { getDoctorSchedule } = useClinic();
  const { doctorId } = useParams();
  const doctor = doctors.find((item) => item.id === doctorId);

  if (!doctor) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Không tìm thấy hồ sơ bác sĩ</h2>
              <p>Dữ liệu có thể đã thay đổi hoặc đường dẫn chưa chính xác.</p>
              <Link to="/doctors" className="button button--primary">
                Quay lại danh sách bác sĩ
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const resolvedSchedule = getDoctorSchedule(doctor.id);
  const bookingPath = user
    ? `/appointments/book?doctorId=${doctor.id}`
    : `/auth?tab=login&redirect=${encodeURIComponent(
        `/appointments/book?doctorId=${doctor.id}`
      )}`;

  return (
    <div className="page">
      <section className="doctor-hero">
        <div className="container doctor-hero__grid">
          <div className="doctor-hero__main">
            <DoctorAvatar
              name={doctor.name}
              large
            />

            <div>
              <span className="eyebrow eyebrow--light">Hồ sơ bác sĩ</span>
              <h1>{doctor.name}</h1>
              <p className="lead">{doctor.title}</p>
              <p>{doctor.bio}</p>

              <div className="tag-row">
                {doctor.specialties.map((item) => (
                  <span key={item} className="tag tag--light">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="hero-side-card">
            <div className="stat-pair">
              <strong>{doctor.rating}/5</strong>
              <span>{doctor.reviewCount} đánh giá</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.experienceYears} năm</strong>
              <span>Kinh nghiệm</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.nextAvailable}</strong>
              <span>Lịch gần nhất</span>
            </div>
            <Link to={bookingPath} className="button button--light button--block">
              {user ? "Đặt lịch khám với bác sĩ" : "Đăng nhập để đặt lịch"}
            </Link>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container profile-layout">
          <div className="profile-main">
            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Tổng quan</span>
                  <h2>Thông tin hồ sơ bác sĩ</h2>
                </div>
              </div>

              <div className="bullet-list">
                {doctor.aboutBullets.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>

            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Lịch làm việc</span>
                  <h2>Khung giờ đang mở</h2>
                </div>
              </div>

              <div className="schedule-grid">
                {resolvedSchedule.map((day) => (
                  <div key={day.key} className={`schedule-day schedule-day--${day.status}`}>
                    <div className="schedule-day__header">
                      <strong>{day.label}</strong>
                      <span>
                        {day.availableCount > 0
                          ? `Còn ${day.availableCount} khung giờ trống`
                          : day.bookedCount > 0
                            ? `${day.bookedCount} khung giờ đã có lịch`
                            : day.note ?? "Chưa mở lịch"}
                      </span>
                    </div>

                    <div className="slot-list">
                      {day.slots.map((slot) =>
                        slot.status === "available" ? (
                          <Link
                            key={`${day.key}-${slot.hour}`}
                            to={`/appointments/book?doctorId=${doctor.id}&day=${day.key}&hour=${slot.hour}`}
                            className="slot slot--action"
                          >
                            {slot.hour}
                          </Link>
                        ) : slot.status === "booked" ? (
                          <span key={`${day.key}-${slot.hour}`} className="slot slot--booked">
                            {slot.hour}
                          </span>
                        ) : slot.status === "blocked" ? (
                          <span key={`${day.key}-${slot.hour}`} className="slot slot--blocked">
                            {slot.hour}
                          </span>
                        ) : (
                          <span key={`${day.key}-${slot.hour}`} className="slot slot--off">
                            {slot.hour}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Đánh giá</span>
                  <h2>Nhận xét từ bệnh nhân</h2>
                </div>
              </div>

              <div className="review-list">
                {doctor.reviews.map((review) => (
                  <article key={review.id} className="review-card">
                    <div className="review-card__header">
                      <strong>{review.patientName}</strong>
                      <span>{review.createdAt}</span>
                    </div>
                    <p>{review.comment}</p>
                    <small>Điểm đánh giá: {review.rating}/5</small>
                  </article>
                ))}
              </div>
            </article>
          </div>

          <aside className="profile-side">
            <article className="sidebar-card">
              <span className="eyebrow">Nơi công tác</span>
              <h3>{doctor.clinic}</h3>
              <p>{doctor.location}</p>
              <p>Số điện thoại phòng khám: {doctor.clinicPhone}</p>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Thông tin hồ sơ</span>
              <p>Giấy phép hành nghề: {doctor.licenseNumber}</p>
              <p>Giới tính: {doctor.gender}</p>
              <p>Ngày sinh: {doctor.dateOfBirth}</p>
              <p>Địa chỉ liên hệ: {doctor.address}</p>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Dịch vụ</span>
              <div className="tag-row">
                {doctor.services.map((service) => (
                  <span key={service} className="tag">
                    {service}
                  </span>
                ))}
              </div>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Triệu chứng phù hợp</span>
              <div className="tag-row">
                {doctor.symptomFocus.map((symptom) => (
                  <span key={symptom} className="tag">
                    {symptom}
                  </span>
                ))}
              </div>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Học vấn và chứng chỉ</span>
              <ul className="text-list">
                {doctor.education.map((item) => (
                  <li key={item}>{item}</li>
                ))}
                {doctor.certificates.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Ngôn ngữ</span>
              <p>{doctor.languages.join(" - ")}</p>
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default DoctorDetailPage;
