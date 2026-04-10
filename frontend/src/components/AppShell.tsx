import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { specialties } from "../data/doctors";
import { siteInfo } from "../data/site";
import FloatingContacts from "./FloatingContacts";

function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <NavLink to="/" className="brand">
            <span className="brand__mark">MC</span>
            <span>
              <strong>{siteInfo.name}</strong>
              <small>{siteInfo.tagline}</small>
            </span>
          </NavLink>

          <nav className="main-nav">
            <NavLink to="/" className="nav-link">
              Trang chủ
            </NavLink>
            <NavLink to="/doctors" className="nav-link">
              Bác sĩ
            </NavLink>
            <NavLink to="/appointments/book" className="nav-link">
              Đặt lịch
            </NavLink>
            <NavLink to="/appointments" className="nav-link">
              Cuộc hẹn
            </NavLink>
            <NavLink to="/schedule-management" className="nav-link">
              Lịch làm việc
            </NavLink>
          </nav>

          <div className="header-actions">
            {user ? (
              <>
                <div className="user-chip">
                  <span className="user-chip__avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      user.name.slice(0, 1).toUpperCase()
                    )}
                  </span>
                  <div>
                    <strong>{user.name}</strong>
                    <small>
                      {user.provider === "google"
                        ? "Đăng nhập bằng Google"
                        : "Tài khoản thành viên"}
                    </small>
                  </div>
                </div>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={logout}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <NavLink to="/auth?tab=login" className="button button--dark">
                Đăng nhập
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="page-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer__inner">
            <div className="site-footer__brand">
              <strong>{siteInfo.name}</strong>
              <p>
                Hệ thống hỗ trợ tra cứu bác sĩ, xem lịch làm việc và kết nối tư
                vấn nhanh với phòng khám.
              </p>

              <div className="site-footer__contact-card">
                <span className="eyebrow">Hotline hỗ trợ</span>
                <strong>{siteInfo.phoneDisplay}</strong>
                <p>{siteInfo.hours}</p>
              </div>
            </div>

            <div className="site-footer__grid">
              <div className="site-footer__column">
                <h4>Liên hệ</h4>
                <a href={`tel:${siteInfo.phoneRaw}`}>Hotline: {siteInfo.phoneDisplay}</a>
                <a href={`mailto:${siteInfo.email}`}>{siteInfo.email}</a>
                <a href={siteInfo.zaloUrl} target="_blank" rel="noreferrer">
                  Zalo chăm sóc khách hàng
                </a>
              </div>

              <div className="site-footer__column">
                <h4>Địa chỉ</h4>
                <p>{siteInfo.address}</p>
                <p>{siteInfo.hours}</p>
              </div>

              <div className="site-footer__column">
                <h4>Chuyên khoa nổi bật</h4>
                {specialties
                  .filter((item) => item !== "Tất cả chuyên khoa")
                  .slice(0, 4)
                  .map((item) => (
                    <NavLink
                      key={item}
                      to={`/doctors?specialty=${encodeURIComponent(item)}`}
                    >
                      {item}
                    </NavLink>
                  ))}
              </div>

              <div className="site-footer__column">
                <h4>Hỗ trợ nhanh</h4>
                <NavLink to="/doctors">Tra cứu bác sĩ</NavLink>
                <NavLink to="/appointments/book">Đặt lịch khám</NavLink>
                <NavLink to="/appointments">Theo dõi cuộc hẹn</NavLink>
                <NavLink to="/auth?tab=login">Đăng nhập thành viên</NavLink>
                <a href={siteInfo.zaloUrl} target="_blank" rel="noreferrer">
                  Gửi câu hỏi qua Zalo
                </a>
              </div>
            </div>
          </div>

          <div className="site-footer__bottom">
            <p>{siteInfo.name} © 2026. Đồng hành cùng bạn trong hành trình chăm sóc sức khỏe.</p>
            <p>Phòng khám đa chuyên khoa | Tư vấn trực tuyến | Hỗ trợ nhanh qua hotline</p>
          </div>
        </div>
      </footer>

      <FloatingContacts />
    </div>
  );
}

export default AppShell;
