import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function ProfilePage() {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState<{
    open: boolean;
    type: "success" | "error";
    message: string;
  }>({
    open: false,
    type: "success",
    message: "",
  });

  const [avatar, setAvatar] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    if (!user) return;

    const nameParts = (user.name || "").split(" ");

    setForm({
      firstName: nameParts.slice(0, -1).join(" "),
      lastName: nameParts.slice(-1)[0] || "",
      email: user.email || "",
      phone: user.phone || "",
      address: (user as any).address || "",
    });

    setAvatar(user.avatar || null);
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  const handleSave = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address: form.address,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setModal({
          open: true,
          type: "error",
          message: json?.error || "Cập nhật thất bại",
        });
        return;
      }

      setModal({
        open: true,
        type: "success",
        message: "Cập nhật thành công",
      });

      setIsEditing(false);
    } catch (err) {
      setModal({
        open: true,
        type: "error",
        message: "Lỗi server",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="section">
        <div
          className="container"
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div className="auth-card" style={{ width: "100%", maxWidth: 500 }}>

            {/* HEADER */}
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
                    setAvatar(URL.createObjectURL(file));
                  }
                }}
              />
            </div>

            {/* FORM */}
            <div className="auth-form">

              <label className="field">
                <span>Họ</span>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="field">
                <span>Tên</span>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </label>

              <label className="field">
                <span>Email</span>
                <input name="email" value={form.email} disabled />
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

              <label className="field">
                <span>Địa chỉ</span>
                <input
                  name="address"
                  value={form.address}
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
                      disabled={loading}
                      onClick={handleSave}
                    >
                      {loading ? "Đang lưu..." : "Lưu"}
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

      {/* ================= MODAL ================= */}
      {modal.open && (
        <div
          onClick={() => setModal({ ...modal, open: false })}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 10,
              width: 300,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                color: modal.type === "success" ? "green" : "red",
              }}
            >
              {modal.type === "success" ? "Thành công" : "Thất bại"}
            </h3>

            <p>{modal.message}</p>

            <button
              className="button button--primary"
              onClick={() => setModal({ ...modal, open: false })}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}