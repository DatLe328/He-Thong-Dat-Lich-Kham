import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import GoogleAuthSection from "../components/GoogleAuthSection";
import { useAuth } from "../context/AuthContext";
import { useDoctorDirectory } from "../context/DoctorDirectoryContext";

type AuthTab = "login" | "register";

function getTab(value: string | null): AuthTab {
  return value === "register" ? "register" : "login";
}

function AuthPage() {
  const { user, login, register, loginWithGoogle } = useAuth();
  const { specialties, totalDoctors } = useDoctorDirectory();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = getTab(searchParams.get("tab"));
  const redirectTo = searchParams.get("redirect") || "/";
  const siteInfo = {
    name: "Hệ thống đặt lịch khám",
  };

  const [identifier, setIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberLogin, setRememberLogin] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const switchTab = (nextTab: AuthTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
    setLoginError("");
    setRegisterError("");
  };

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await login({ identifier, password: loginPassword });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setLoginError(
        error instanceof Error
          ? error.message
          : "Không thể đăng nhập vào hệ thống."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterError("");
    setRegisterLoading(true);

    try {
      await register({
        email,
        username,
        phone,
        password: registerPassword,
        confirmPassword,
      });
      navigate("/", { replace: true });
    } catch (error) {
      setRegisterError(
        error instanceof Error
          ? error.message
          : "Không thể tạo tài khoản vào lúc này."
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleGoogleLogin = async (credential: string) => {
    setLoginError("");
    await loginWithGoogle(credential);
    navigate(redirectTo, { replace: true });
  };

  const handleGoogleRegister = async (credential: string) => {
    setRegisterError("");
    await loginWithGoogle(credential);
    navigate("/", { replace: true });
  };

  return (
    <div className="page auth-page">
      <section className="section">
        <div className="container auth-grid">
          <div className="auth-panel auth-showcase">
            <span className="eyebrow eyebrow--light">
              Đăng nhập an toàn, tra cứu thuận tiện
            </span>
            <h1>Chăm sóc sức khỏe dễ dàng hơn cùng {siteInfo.name}.</h1>
            <p>
              Đăng nhập để tìm bác sĩ theo chuyên khoa, xem lịch khám và nhận hỗ
              trợ nhanh từ đội ngũ chăm sóc khách hàng của phòng khám.
            </p>

            <div className="auth-showcase__stats">
              <div className="auth-showcase__stat">
                <strong>{totalDoctors}</strong>
                <span>Bác sĩ chuyên khoa</span>
              </div>
              <div className="auth-showcase__stat">
                <strong>{specialties.length}</strong>
                <span>Chuyên khoa nổi bật</span>
              </div>
              <div className="auth-showcase__stat">
                <strong>Toàn bộ</strong>
                <span>Dữ liệu bác sĩ từ backend</span>
              </div>
            </div>
          </div>

          <div className="auth-card auth-card--tabs">
            {user ? (
              <div className="success-card">
                <h2>Xin chào, {user.name}</h2>
                <p>
                  Tài khoản của bạn đã sẵn sàng. Bạn có thể tiếp tục xem bác sĩ,
                  lịch làm việc và lựa chọn khung giờ phù hợp.
                </p>
                <div className="success-card__actions">
                  <Link to="/" className="button button--primary">
                    Về trang chủ
                  </Link>
                  <Link to="/" className="button button--ghost">
                    Tiếp tục
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="auth-tabs" role="tablist" aria-label="Xác thực tài khoản">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "login"}
                    className={`auth-tab ${activeTab === "login" ? "is-active" : ""}`}
                    onClick={() => switchTab("login")}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === "register"}
                    className={`auth-tab ${activeTab === "register" ? "is-active" : ""}`}
                    onClick={() => switchTab("register")}
                  >
                    Đăng ký
                  </button>
                </div>

                {activeTab === "login" ? (
                  <div className="auth-tabpanel">
                    <div className="auth-card__header">
                      <h2>Đăng nhập tài khoản</h2>
                      <p>Nhập email, tên đăng nhập hoặc số điện thoại để tiếp tục.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleLoginSubmit}>
                      <label className="field">
                        <span>Email, tên đăng nhập hoặc số điện thoại</span>
                        <input
                          type="text"
                          value={identifier}
                          onChange={(event) => setIdentifier(event.target.value)}
                          placeholder="Nhập thông tin đăng nhập"
                          required
                        />
                      </label>

                      <label className="field">
                        <span>Mật khẩu</span>
                        <input
                          type="password"
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                          placeholder="Nhập mật khẩu"
                          required
                        />
                      </label>

                      <div className="auth-options">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={rememberLogin}
                            onChange={(event) => setRememberLogin(event.target.checked)}
                          />
                          <span>Ghi nhớ đăng nhập</span>
                        </label>
                        <Link to="/" className="text-link">
                          Về trang chủ
                        </Link>
                      </div>

                      {loginError ? <div className="error-message">{loginError}</div> : null}

                      <button
                        type="submit"
                        className="button button--primary button--block"
                        disabled={loginLoading}
                      >
                        {loginLoading
                          ? "Đang xác thực..."
                          : rememberLogin
                            ? "Đăng nhập"
                            : "Tiếp tục"}
                      </button>
                    </form>

                    <div className="divider">
                      <span>hoặc</span>
                    </div>

                    <GoogleAuthSection
                      mode="login"
                      onSuccess={handleGoogleLogin}
                      onError={setLoginError}
                    />

                    <p className="auth-switch">
                      Chưa có tài khoản?{" "}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => switchTab("register")}
                      >
                        Đăng ký ngay
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="auth-tabpanel">
                    <div className="auth-card__header">
                      <h2>Tạo tài khoản mới</h2>
                      <p>Điền đầy đủ thông tin để bắt đầu sử dụng dịch vụ của phòng khám.</p>
                    </div>

                    <form className="auth-form" onSubmit={handleRegisterSubmit}>
                      <div className="form-grid">
                        <label className="field">
                          <span>Email</span>
                          <input
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Nhập địa chỉ email"
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Tên đăng nhập</span>
                          <input
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Tạo tên đăng nhập"
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Số điện thoại</span>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            placeholder="Nhập số điện thoại"
                            required
                          />
                        </label>

                        <label className="field">
                          <span>Mật khẩu</span>
                          <input
                            type="password"
                            value={registerPassword}
                            onChange={(event) => setRegisterPassword(event.target.value)}
                            placeholder="Tối thiểu 6 ký tự"
                            required
                          />
                        </label>

                        <label className="field field--full">
                          <span>Xác nhận mật khẩu</span>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            required
                          />
                        </label>
                      </div>

                      {registerError ? (
                        <div className="error-message">{registerError}</div>
                      ) : null}

                      <button
                        type="submit"
                        className="button button--primary button--block"
                        disabled={registerLoading}
                      >
                        {registerLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
                      </button>
                    </form>

                    <div className="divider">
                      <span>hoặc</span>
                    </div>

                    <GoogleAuthSection
                      mode="register"
                      onSuccess={handleGoogleRegister}
                      onError={setRegisterError}
                    />

                    <p className="auth-switch">
                      Đã có tài khoản?{" "}
                      <button
                        type="button"
                        className="text-button"
                        onClick={() => switchTab("login")}
                      >
                        Đăng nhập
                      </button>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AuthPage;
