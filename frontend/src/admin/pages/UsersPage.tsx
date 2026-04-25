import { useEffect, useMemo, useState } from "react";

type User = {
  userID: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "PATIENT",
  });

  // ================= FETCH =================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const json = await res.json();
      setData(json?.data || []);
    } finally {
      setLoading(false);
    }
  };

  // ================= FILTER + SORT =================
  const filteredData = useMemo(() => {
    let result = [...data].sort((a, b) => a.userID - b.userID);

    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (search.trim()) {
      const k = search.toLowerCase();

      result = result.filter((u) =>
        (
          `${u.firstName || ""} ${u.lastName || ""} ${u.email} ${u.role} ${u.userID}`
        )
          .toLowerCase()
          .includes(k)
      );
    }

    return result;
  }, [data, search, roleFilter]);

  // ================= FORMAT ROLE =================
  const formatRole = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Quản trị viên";
      case "DOCTOR":
        return "Bác sĩ";
      default:
        return "Người dùng";
    }
  };

  // ================= VALIDATE =================
  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email || (!editingId && !form.password)) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin");
      return false;
    }
    setError("");
    return true;
  };

  // ================= SUBMIT =================
  const handleSubmit = async () => {
    if (!validate()) return;

    const url = editingId ? `/api/users/${editingId}` : "/api/users";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.message || "❌ Lỗi");
      return;
    }

    closeForm();
    fetchUsers();
  };

  // ================= EDIT =================
  const handleEdit = async (id: number) => {
    const res = await fetch(`/api/users/${id}`);
    const json = await res.json();
    const u = json.data;

    setForm({
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email || "",
      password: "",
      role: u.role || "PATIENT",
    });

    setEditingId(id);
    setShowForm(true);
    setError("");
  };

  // ================= DELETE =================
  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/users/${deleteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("❌ Xóa thất bại");
      return;
    }

    setData((prev) => prev.filter((u) => u.userID !== deleteId));
    setDeleteId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "PATIENT",
    });
  };

  // ================= UI =================
  return (
    <div>
      <h2>👤 Quản lý người dùng</h2>

      <div className="card table-wrapper">

        {/* TOOLBAR */}
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="🔎 Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="ADMIN">Quản trị viên</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="PATIENT">Người dùng</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            ➕ Thêm người dùng
          </button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p>⏳ Đang tải...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((u) => (
                <tr key={u.userID}>
                  <td>{u.userID}</td>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{formatRole(u.role)}</td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(u.userID)}>
                      Sửa
                    </button>
                    <button className="btn btn-danger" onClick={() => setDeleteId(u.userID)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FORM */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card fancy-modal">
            <h3>{editingId ? "Sửa người dùng" : "Thêm người dùng"}</h3>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="form-grid">
              <input
                placeholder="Họ"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />

              <input
                placeholder="Tên"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              {!editingId && (
                <input
                  type="password"
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              )}

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="PATIENT">Người dùng</option>
                <option value="DOCTOR">Bác sĩ</option>
                <option value="ADMIN">Quản trị viên</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSubmit}>
                💾 Lưu
              </button>
              <button className="btn btn-outline" onClick={closeForm}>
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Xóa người dùng?</h3>

            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>
                Xóa
              </button>
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}