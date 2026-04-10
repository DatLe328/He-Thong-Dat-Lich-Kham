import { Link } from "react-router-dom";
import CareNavigatorSection from "../components/CareNavigatorSection";
import DoctorCard from "../components/DoctorCard";
import MedicalNewsSection from "../components/MedicalNewsSection";
import TestimonialsSection from "../components/TestimonialsSection";
import { doctors, specialties, symptomGuides } from "../data/doctors";
import { siteInfo } from "../data/site";

function HomePage() {
  const featuredDoctors = doctors.slice(0, 3);

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <span className="eyebrow eyebrow--light">{siteInfo.tagline}</span>
            <h1>Tìm đúng bác sĩ, xem lịch khám rõ ràng và chủ động chăm sóc sức khỏe.</h1>
            <p>
              Kết nối nhanh với bác sĩ theo chuyên khoa, tra cứu hồ sơ chuyên môn,
              kinh nghiệm làm việc và lựa chọn thời gian khám phù hợp cho bạn và gia đình.
            </p>
            <div className="hero__actions">
              <Link to="/doctors" className="button button--light">
                Tìm bác sĩ ngay
              </Link>
              <Link to="/auth?tab=login" className="button button--ghost-light">
                Đăng nhập / Đăng ký
              </Link>
            </div>

            <div className="quick-specialties">
              {specialties
                .filter((item) => item !== "Tất cả chuyên khoa")
                .slice(0, 5)
                .map((item) => (
                  <Link
                    key={item}
                    to={`/doctors?specialty=${encodeURIComponent(item)}`}
                    className="quick-specialties__pill"
                  >
                    {item}
                  </Link>
                ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-card">
              <div className="panel-card__label">Nổi bật tại phòng khám</div>
              <div className="metric-grid">
                <div>
                  <strong>{doctors.length}</strong>
                  <span>Bác sĩ chuyên khoa</span>
                </div>
                <div>
                  <strong>{specialties.length - 1}</strong>
                  <span>Chuyên khoa</span>
                </div>
                <div>
                  <strong>4.8</strong>
                  <span>Điểm hài lòng trung bình</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Hỗ trợ chăm sóc khách hàng</span>
                </div>
              </div>
            </div>

            <div className="panel-card panel-card--soft">
              <div className="panel-card__label">Dịch vụ được quan tâm</div>
              <ul className="check-list">
                <li>Khám chuyên khoa theo lịch làm việc rõ ràng</li>
                <li>Tư vấn định hướng chuyên khoa phù hợp</li>
                <li>Hỗ trợ khách hàng qua hotline và Zalo</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Trải nghiệm dành cho người bệnh</span>
              <h2>Những tiện ích nổi bật</h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Đăng nhập thuận tiện</h3>
              <p>
                Đăng nhập bằng email, tên đăng nhập, số điện thoại hoặc tiếp tục
                nhanh với tài khoản Google.
              </p>
            </article>
            <article className="feature-card">
              <h3>Tìm bác sĩ theo chuyên khoa</h3>
              <p>
                Lọc theo chuyên khoa, tìm theo tên bác sĩ hoặc cơ sở khám để đưa
                ra lựa chọn phù hợp ngay trên một màn hình.
              </p>
            </article>
            <article className="feature-card">
              <h3>Xem hồ sơ chi tiết</h3>
              <p>
                Tra cứu kinh nghiệm, dịch vụ, đánh giá bệnh nhân và lịch làm việc
                từng ngày của bác sĩ.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bác sĩ nổi bật</span>
              <h2>Được nhiều bệnh nhân quan tâm</h2>
            </div>
            <Link to="/doctors" className="text-link">
              Xem tất cả
            </Link>
          </div>

          <div className="doctor-grid">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSection />

      <MedicalNewsSection />

      <CareNavigatorSection />

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Định hướng chuyên khoa</span>
              <h2>Gợi ý nhanh theo triệu chứng</h2>
            </div>
          </div>

          <div className="guide-grid">
            {symptomGuides.map((guide) => (
              <Link
                key={guide.symptom}
                to={`/doctors?specialty=${encodeURIComponent(guide.specialty)}`}
                className="guide-card"
              >
                <strong>{guide.specialty}</strong>
                <p>{guide.symptom}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
