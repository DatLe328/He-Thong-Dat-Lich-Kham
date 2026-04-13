import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DoctorAvatar from "../components/DoctorAvatar";
import { fetchDoctorProfile } from "../lib/doctors";
import { DoctorProfile } from "../types";

function DoctorDetailPage() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDoctor = async () => {
      if (!doctorId) {
        setError("Không tìm thấy mã bác sĩ trong đường dẫn.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const profile = await fetchDoctorProfile(doctorId);

        if (!cancelled) {
          setDoctor(profile);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setDoctor(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải hồ sơ bác sĩ."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDoctor();

    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  if (loading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Đang tải hồ sơ bác sĩ</h2>
              <p>Frontend đang lấy hồ sơ và lịch làm việc từ backend.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="page">
        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Không thể mở hồ sơ bác sĩ</h2>
              <p>{error || "Dữ liệu bác sĩ hiện không khả dụng."}</p>
              <Link to="/search" className="button button--primary">
                Quay lại tìm kiếm
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const overviewItems = [
    `Chuyên khoa chính: ${doctor.specialty}`,
    `Email liên hệ: ${doctor.email}`,
    `Số điện thoại: ${doctor.phone}`,
    `Giấy phép hành nghề: ${doctor.licenseNumber}`,
  ];

  return (
    <div className="page">
      <section className="doctor-hero">
        <div className="container doctor-hero__grid">
          <div className="doctor-hero__main">
            <DoctorAvatar name={doctor.name} large />

            <div>
              <span className="eyebrow eyebrow--light">Hồ sơ bác sĩ</span>
              <h1>{doctor.name}</h1>
              <p className="lead">{doctor.specialty}</p>
              <p>{doctor.bio}</p>

              {doctor.specialties.length ? (
                <div className="tag-row">
                  {doctor.specialties.map((specialty) => (
                    <span key={specialty} className="tag tag--light">
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <aside className="hero-side-card">
            <div className="stat-pair">
              <strong>{doctor.rating.toFixed(1)}/5</strong>
              <span>{doctor.totalReviews} đánh giá</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.schedules.length}</strong>
              <span>Ngày làm việc đang có trong hệ thống</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.nextAvailable}</strong>
              <span>Lịch gần nhất</span>
            </div>
            <Link to="/search" className="button button--light button--block">
              Quay lại kết quả tìm kiếm
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
                {overviewItems.map((item) => (
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

              {doctor.schedules.length ? (
                <div className="schedule-grid">
                  {doctor.schedules.map((schedule) => (
                    <div
                      key={schedule.scheduleId}
                      className={`schedule-day schedule-day--${schedule.status}`}
                    >
                      <div className="schedule-day__header">
                        <strong>{schedule.label}</strong>
                        <span>
                          {schedule.availableCount > 0
                            ? `${schedule.hoursLabel} • còn ${schedule.availableCount}/${schedule.totalCount} slot`
                            : `${schedule.hoursLabel} • chưa còn slot trống`}
                        </span>
                      </div>

                      <div className="slot-list">
                        {schedule.slots.length ? (
                          schedule.slots.map((slot) => (
                            <span
                              key={`${schedule.scheduleId}-${slot.time}`}
                              className={
                                slot.status === "available"
                                  ? "slot slot--action"
                                  : slot.status === "booked"
                                    ? "slot slot--booked"
                                    : "slot slot--off"
                              }
                            >
                              {slot.time}
                            </span>
                          ))
                        ) : (
                          <span className="slot slot--off">Chưa mở slot</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>Chưa có lịch làm việc</h2>
                  <p>Bác sĩ này hiện chưa có lịch làm việc được trả về từ backend.</p>
                </div>
              )}
            </article>

            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Đánh giá</span>
                  <h2>Nhận xét từ bệnh nhân</h2>
                </div>
              </div>

              {doctor.reviews.length ? (
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
              ) : (
                <div className="empty-state">
                  <h2>Chưa có đánh giá</h2>
                  <p>Phần nhận xét sẽ xuất hiện khi backend có dữ liệu review.</p>
                </div>
              )}
            </article>
          </div>

          <aside className="profile-side">
            <article className="sidebar-card">
              <span className="eyebrow">Nơi công tác</span>
              <h3>{doctor.clinicName}</h3>
              <p>{doctor.clinicAddress}</p>
              <p>Số điện thoại phòng khám: {doctor.clinicPhone}</p>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Thông tin cá nhân</span>
              <p>Giới tính: {doctor.gender}</p>
              <p>Ngày sinh: {doctor.dateOfBirth}</p>
              <p>Địa chỉ liên hệ: {doctor.address}</p>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Chuyên khoa tại cơ sở</span>
              {doctor.clinicSpecialties.length ? (
                <div className="tag-row">
                  {doctor.clinicSpecialties.map((specialty) => (
                    <span key={specialty} className="tag">
                      {specialty}
                    </span>
                  ))}
                </div>
              ) : (
                <p>Phòng khám chưa cập nhật danh mục chuyên khoa.</p>
              )}
            </article>
          </aside>
        </div>
      </section>
    </div>
  );
}

export default DoctorDetailPage;
