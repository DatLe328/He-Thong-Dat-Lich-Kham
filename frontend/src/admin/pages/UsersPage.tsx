import { useState } from "react";

const danhSachNguoiDung = [
  { id: 1, email: "admin@gmail.com", role: "admin" },
  { id: 2, email: "user@gmail.com", role: "user" },
];

export default function UsersPage() {
  const [data] = useState(danhSachNguoiDung);

  return (
    <div>
      <h2>Quản lý người dùng</h2>

      <div className="card table-wrapper">
        <div style={{ marginBottom: 12 }}>
          <button className="btn">+ Thêm người dùng</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {data.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn">Sửa</button>
                    <button className="btn btn-danger">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}