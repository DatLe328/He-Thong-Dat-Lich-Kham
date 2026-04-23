import { NavLink, Outlet } from "react-router-dom";
import "../../styles/admin.css";

export default function AdminLayout() {
  return (
    <div className="admin-container">
      <aside className="sidebar">
        <h2>🏥 Quản trị</h2>

        <NavLink to="/admin" className="link">
          Trang tổng quan
        </NavLink>

        <NavLink to="/admin/users" className="link">
          Người dùng
        </NavLink>

        <NavLink to="/admin/doctors" className="link">
          Bác sĩ
        </NavLink>

        <NavLink to="/admin/appointments" className="link">
          Lịch hẹn
        </NavLink>
      </aside>

      <div className="main">
        <div className="header">Trang quản trị hệ thống</div>

        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}