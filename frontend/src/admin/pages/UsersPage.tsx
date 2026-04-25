import { useEffect, useMemo, useState } from "react";
import "../../styles/admin.css";

type User = {
  userID: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  gender?: string;
  address?: string;
  dateOfBirth?: string;
};

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== NEW CONFIRM MODAL =====
  const [confirmUpdate, setConfirmUpdate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "PATIENT",
    phone: "",
    gender: "Nam",
    address: "",
    dateOfBirth: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const json = await res.json();
      setData(json?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = [...data];

    if (roleFilter !== "ALL") {
      result = result.filter((u) => u.role === roleFilter);
    }

    if (search) {
      const k = search.toLowerCase();
      result = result.filter((u) =>
        `${u.firstName} ${u.lastName} ${u.email} ${u.phone}`
          .toLowerCase()
          .includes(k)
      );
    }

    return result;
  }, [data, search, roleFilter]);

  const validate = () => {
    if (!form.firstName || !form.lastName || !form.email) {
      setError("❌ Nhập đầy đủ họ tên và email");
      return false;
    }

    if (!editingId && !form.password) {
      setError("❌ Nhập mật khẩu");
      return false;
    }

    setError("");
    return true;
  };

  // =========================
  // STEP 1: CLICK SAVE -> CONFIRM
  // =========================
  const handleSubmitClick = () => {
    if (!validate()) return;
    setConfirmUpdate(true);
  };

  // =========================
  // STEP 2: CONFIRM UPDATE
  // =========================
  const handleSubmit = async () => {
    const body: any = {
      ...form,
      role: "PATIENT",
      email: form.email.trim().toLowerCase(),
      phone: form.phone || null,
      address: form.address || null,
      dateOfBirth: form.dateOfBirth || null,
    };

    if (editingId && !form.password) delete body.password;

    const res = await fetch(
      editingId ? `/api/users/${editingId}` : "/api/users",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      setError(json.message || "❌ Có lỗi xảy ra");
      return;
    }

    setConfirmUpdate(false);
    closeForm();
    fetchUsers();
  };

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
      phone: u.phone || "",
      gender: u.gender || "Nam",
      address: u.address || "",
      dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split("T")[0] : "",
    });

    setEditingId(id);
    setShowForm(true);
    setError("");
  };

  // =========================
  // DELETE CONFIRM FLOW
  // =========================
  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setConfirmDelete(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    await fetch(`/api/users/${deleteId}`, { method: "DELETE" });

    setData((prev) => prev.filter((u) => u.userID !== deleteId));
    setDeleteId(null);
    setConfirmDelete(false);
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
      phone: "",
      gender: "MALE",
      address: "",
      dateOfBirth: "",
    });
  };

  return (
    <div className="content">
      <h2>👤 Quản lý người dùng</h2>

      <div className="card table-wrapper">
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
            <option value="ADMIN">Admin</option>
            <option value="DOCTOR">Bác sĩ</option>
            <option value="PATIENT">Người dùng</option>
          </select>

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ➕ Thêm
          </button>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>SĐT</th>
                <th>Vai trò</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((u) => (
                <tr key={u.userID}>
                  <td>{u.userID}</td>
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.email}</td>
                  <td>{u.phone}</td>
                  <td>
                    <span className={`role-badge role-${u.role.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(u.userID)}>
                      Sửa
                    </button>
                    {u.role !== "ADMIN" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteClick(u.userID)}
                          >
                            Xóa
                          </button>
                        )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= FORM ================= */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card fancy-modal">
            <h3>{editingId ? "✏️ Sửa người dùng" : "➕ Thêm người dùng"}</h3>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="form-grid">
              <div>
                <label>Họ</label>
                <input value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>

              <div>
                <label>Tên</label>
                <input value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>

              <div className="full">
                <label>Email</label>
                <input value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              {!editingId && (
                <div>
                  <label>Mật khẩu</label>
                  <input type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}

              <div>
                <label>SĐT</label>
                <input value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>

              <div>
                <label>Ngày sinh</label>
                <input type="date" value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </div>

              <div>
                <label>Giới tính</label>
                <select value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div className="full">
                <label>Địa chỉ</label>
                <input value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>


            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSubmitClick}>
                💾 Lưu
              </button>
              <button className="btn btn-outline" onClick={closeForm}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM UPDATE ================= */}
      {confirmUpdate && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Xác nhận cập nhật?</h3>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSubmit}>
                Đồng ý
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmUpdate(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DELETE ================= */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Xác nhận xóa?</h3>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>
                Xóa
              </button>
              <button className="btn btn-outline" onClick={() => setConfirmDelete(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}