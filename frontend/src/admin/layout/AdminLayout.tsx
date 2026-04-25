import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../../styles/admin.css";

type User = {
  userID: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ================= CHECK ADMIN =================
  useEffect(() => {
    fetch("/api/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) {
          navigate("/login");
          return;
        }

        if (data.user.role !== "ADMIN") {
          navigate("/");
          return;
        }

        setUser(data.user);
      })
      .catch(() => {
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    navigate("/login");
  };

  if (loading) return <p>Đang tải...</p>;

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>🏥 Admin</h2>

        <p style={{ fontSize: 12, opacity: 0.7 }}>
          👤 {user?.email}
        </p>

        <NavLink to="/admin/users" className="link">
          👤 Người dùng
        </NavLink>

        <NavLink to="/admin/doctors" className="link">
          👨‍⚕️ Bác sĩ
        </NavLink>

        <NavLink to="/admin/appointments" className="link">
          📅 Lịch hẹn
        </NavLink>

        <NavLink to="/admin/statistics" className="link">
          📊 Thống kê
        </NavLink>


      </aside>

      {/* MAIN */}
      <div className="main">
        <div className="header">
          Trang quản trị hệ thống
        </div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}