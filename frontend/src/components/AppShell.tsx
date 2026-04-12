import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDoctorDirectory } from "../context/DoctorDirectoryContext";
import logoWeb from "../assets/logo-web.png";

function getNavLinkClass(isActive: boolean) {
  return isActive ? "nav-link active" : "nav-link";
}

function AppShell() {
  const { user, logout } = useAuth();
  const { specialties } = useDoctorDirectory();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <NavLink to="/" end className="brand">
            <span className="brand__mark">
              <img src={logoWeb} alt="Logo hệ thống đặt lịch khám" className="brand__logo" />
            </span>
            <span>
              <strong>Hệ thống đặt lịch khám </strong>
              <small>Kết nối người bệnh với bác sĩ </small>
            </span>
          </NavLink>

          <nav className="main-nav" aria-label="Điều hướng chính">
            <NavLink to="/" end className={({ isActive }) => getNavLinkClass(isActive)}>
              Trang chủ
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) => getNavLinkClass(isActive)}
            >
              Bác sĩ
            </NavLink>
          </nav>

          <div className="header-actions">
            {user ? (
              <>

                <div
                  className="user-chip"
                  onClick={() => navigate("/profile")}
                  style={{ cursor: "pointer" }}
                >
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
              <strong>Đặt lịch khám trực tuyến</strong>
              <p>
                Tra cứu bác sĩ theo chuyên khoa và đặt lịch khám nhanh chóng, tiện lợi mọi lúc.
              </p>
            </div>

            <div className="site-footer__grid">
              <div className="site-footer__column">
                <h4>Liên kết nhanh</h4>
                <NavLink to="/">Trang chủ</NavLink>
                <NavLink to="/auth?tab=login">Đăng nhập</NavLink>
                <NavLink to="/auth?tab=register">Đăng ký</NavLink>
              </div>

              <div className="site-footer__column">
                <h4>Chuyên khoa nổi bật</h4>
                {specialties.length ? (
                  specialties.slice(0, 4).map((specialty) => (
                    <p key={specialty}>{specialty}</p>
                  ))
                ) : (
                  <p>Danh mục chuyên khoa đang được cập nhật.</p>
                )}
              </div>
            </div>
          </div>

          <div className="site-footer__bottom">
            <p>Hotline: 1900 999 999 | Email: nhom1@gmail.com</p>
            <p>© 2026 Hệ thống đặt lịch khám. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppShell;
