import { Link } from "react-router-dom";
import DoctorCard from "../components/DoctorCard";
import { useDoctorDirectory } from "../context/DoctorDirectoryContext";
import { useAuth } from "../context/AuthContext";

function HomePage() {
  const { user } = useAuth();
  const {
    averageRating,
    error,
    featuredDoctors,
    loading,
    specialties,
    totalDoctors,
  } = useDoctorDirectory();

  return (
    <div className="page">
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__content">
            <span className="eyebrow eyebrow--light">
              Dịch vụ y tế trực tuyến
            </span>
            <h1>Đặt lịch khám với bác sĩ uy tín, nhanh chóng và dễ dàng</h1>
            <p>
              Tra cứu chuyên khoa, xem thông tin bác sĩ và đặt lịch khám trực tuyến mọi lúc.
            </p>

            <div className="hero__actions">
                {user && (
              <div className="button button--light">
                Xin chào {user.name}
              </div>
                )}
              <Link to="/search" className="button button--light">
                Tìm kiếm bác sĩ
              </Link>



            </div>


            <div className="quick-specialties">
              {specialties.slice(0, 5).map((specialty) => (
                <span key={specialty} className="quick-specialties__pill">
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-card">
              <div className="panel-card__label">Thống kê hệ thống</div>
              <div className="metric-grid">
                <div>
                  <strong>{totalDoctors}</strong>
                  <span>Bác sĩ</span>
                </div>
                <div>
                  <strong>{specialties.length}</strong>
                  <span>Chuyên khoa</span>
                </div>
                <div>
                  <strong>{averageRating ? averageRating.toFixed(1) : "--"}</strong>
                  <span>Điểm đánh giá trung bình</span>
                </div>
                <div>
                  <strong>24/7</strong>
                  <span>Đặt lịch trực tuyến</span>
                </div>
              </div>
            </div>

            <div className="panel-card panel-card--soft">
              <div className="panel-card__label">Tính năng nổi bật</div>
              <ul className="check-list">
                <li>Đặt lịch khám nhanh chóng</li>
                <li>Xem thông tin bác sĩ chi tiết</li>
                <li>Lựa chọn chuyên khoa phù hợp</li>
                <li>Hỗ trợ trực tuyến 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Vì sao chọn chúng tôi</span>
              <h2>Bạn nhận được gì từ chúng tôi</h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <h3>Tìm bác sĩ nhanh chóng</h3>
              <p>Dễ dàng tìm kiếm bác sĩ theo chuyên khoa và nhu cầu.</p>
            </article>
            <article className="feature-card">
              <h3>Thông tin minh bạch</h3>
              <p>Hồ sơ bác sĩ rõ ràng, đầy đủ kinh nghiệm và đánh giá.</p>
            </article>
            <article className="feature-card">
              <h3>Đặt lịch linh hoạt</h3>
              <p>Chọn thời gian khám phù hợp, hỗ trợ đặt lịch 24/7.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section section--muted">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Bác sĩ nổi bật</span>
              <h2>Bác sĩ được đánh giá cao</h2>
            </div>
            <Link to="/search" className="text-link">
              Xem kết quả tìm kiếm
            </Link>
          </div>

          {loading ? (
            <div className="empty-state">
              <h2>Đang tải danh sách bác sĩ</h2>
              <p>Frontend đang chờ dữ liệu thật từ backend để dựng các thẻ nổi bật.</p>
            </div>
          ) : error ? (
            <div className="empty-state">
              <h2>Không thể tải dữ liệu bác sĩ</h2>
              <p>{error}</p>
            </div>
          ) : featuredDoctors.length ? (
            <div className="doctor-grid">
              {featuredDoctors.map((doctor) => (
                <DoctorCard
                  key={doctor.id}
                  doctor={doctor}
                  actionTo={`/doctors/${doctor.doctorId}`}
                  actionLabel="Xem hồ sơ và lịch làm việc"
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Chưa có bác sĩ nào để hiển thị</h2>
              <p>Danh sách nổi bật sẽ xuất hiện ngay khi backend trả về dữ liệu.</p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Chuyên khoa</span>
              <h2>Chọn chuyên khoa phù hợp với bạn</h2>
            </div>
          </div>

          <div className="guide-grid">
            {specialties.slice(0, 8).map((specialty) => (
              <article key={specialty} className="guide-card">
                <strong>{specialty}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
