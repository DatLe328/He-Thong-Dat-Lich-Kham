import { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || "Demo User",
    email: user?.email || "demo@gmail.com",
    phone: user?.phone || "0123456789",
  });

  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setForm({
      name: user?.name || "Demo User",
      email: user?.email || "demo@gmail.com",
      phone: user?.phone || "0123456789",
    });
    setAvatar(user?.avatar || null);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (isLoading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container empty-state">
            <h2>Đang tải hồ sơ</h2>
            <p>Vui lòng chờ trong giây lát...</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="section">
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            className="auth-card"
            style={{ width: "100%", maxWidth: 500 }}
          >
            <div className="auth-card__header">
              <h2>Thông tin cá nhân</h2>
              <p>Cập nhật hồ sơ của bạn</p>
            </div>

            {/* AVATAR */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div
                style={{
                  position: "relative",
                  width: 120,
                  height: 120,
                  margin: "auto",
                  cursor: isEditing ? "pointer" : "default",
                }}
                onClick={() => isEditing && fileInputRef.current?.click()}
              >
                <img
                  src={avatar || "https://via.placeholder.com/120"}
                  alt="avatar"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid #eee",
                  }}
                />

                {isEditing && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.4)",
                      color: "#fff",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                    }}
                  >
                    Đổi ảnh
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const preview = URL.createObjectURL(file);
                    setAvatar(preview);
                  }
                }}
              />

              <p style={{ marginTop: 10, fontWeight: 500 }}>
                {form.name}
              </p>
            </div>

            {/* FORM */}
            <div className="auth-form">
              <label className="field">
                <span>Họ và tên</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="field">
                <span>Số điện thoại</span>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              {/* BUTTON */}
              <div style={{ marginTop: 16 }}>
                {isEditing ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      className="button button--primary"
                      onClick={() => setIsEditing(false)}
                    >
                      Lưu
                    </button>
                    <button
                      className="button button--ghost"
                      onClick={() => setIsEditing(false)}
                    >
                      Huỷ
                    </button>
                  </div>
                ) : (
                  <button
                    className="button button--primary button--block"
                    onClick={() => setIsEditing(true)}
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
