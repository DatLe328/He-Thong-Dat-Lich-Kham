import { useEffect, useState, useMemo } from "react";

type Doctor = {
  doctorID: number;
  specialization: string;
  rating: number;
  licenseNumber?: string;
  clinicID?: number;
  bio?: string;
  user?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: string;
    dateOfBirth?: string;
    address?: string;
  };
};

export default function DoctorsPage() {
  const [data, setData] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    specialization: "",
    licenseNumber: "",
    clinicID: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/doctors");
      const json = await res.json();
      setData(json?.data || []);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FILTER REALTIME (KHÔNG ĐỔ UI)
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const k = search.toLowerCase();

    return data.filter((d) => {
      return (
        `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(k) ||
        d.specialization?.toLowerCase().includes(k) ||
        d.licenseNumber?.toLowerCase().includes(k)
      );
    });
  }, [data, search]);

  const validate = () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      (!editingId && !form.password) ||
      !form.specialization
    ) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const url = editingId
      ? `/api/doctors/${editingId}`
      : "/api/doctors";

    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        email: form.email.trim().toLowerCase(),
        clinicID: form.clinicID ? Number(form.clinicID) : null,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.message || "❌ Lỗi hệ thống");
      return;
    }

    closeForm();
    fetchDoctors();
  };

  const handleEdit = async (id: number) => {
    const res = await fetch(`/api/doctors/${id}`);
    const json = await res.json();
    const d = json.data;

    setForm({
      firstName: d.user?.firstName || "",
      lastName: d.user?.lastName || "",
      email: d.user?.email || "",
      password: "",
      specialization: d.specialization || "",
      licenseNumber: d.licenseNumber || "",
      clinicID: d.clinicID ? String(d.clinicID) : "",
      phone: d.user?.phone || "",
      gender: d.user?.gender || "",
      dateOfBirth: d.user?.dateOfBirth || "",
      address: d.user?.address || "",
      bio: d.bio || "",
    });

    setEditingId(id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const res = await fetch(`/api/doctors/${deleteId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setError("❌ Xóa thất bại");
      return;
    }

    setData((prev) => prev.filter((d) => d.doctorID !== deleteId));
    setDeleteId(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setError("");
  };

  return (
    <div>
      <h2>👨‍⚕️ Quản lý bác sĩ</h2>

      <div className="card table-wrapper">

        {/* FILTER (KHÔNG ĐỤNG UI CŨ) */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
      <input
        placeholder="🔎 Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "220px",
          padding: "6px 10px",
          fontSize: "13px",
          borderRadius: "6px",
          border: "1px solid #ccc",
        }}
      />
      </div>
         <div>
      <button
        className="btn btn-primary"
        onClick={() => setShowForm(true)}
      >
        ➕ Thêm bác sĩ
      </button>
    </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Họ tên</th>
                <th>Chuyên khoa</th>
                <th>Đánh giá</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((bs) => (
                <tr key={bs.doctorID}>
                  <td>{bs.doctorID}</td>
                  <td>
                    {bs.user
                      ? `${bs.user.firstName} ${bs.user.lastName}`
                      : "Không có dữ liệu"}
                  </td>
                  <td>{bs.specialization}</td>
                  <td>⭐ {bs.rating}</td>

                  <td>
                    <button className="btn" onClick={() => handleEdit(bs.doctorID)}>
                      Sửa
                    </button>
                    <button className="btn btn-danger" onClick={() => setDeleteId(bs.doctorID)}>
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FORM GIỮ NGUYÊN UI CŨ */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card fancy-modal">
            <h3>{editingId ? "✏️ Sửa bác sĩ" : "➕ Thêm bác sĩ"}</h3>

            {error && <div style={{ color: "red" }}>{error}</div>}

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

              <div>
                <label>Email</label>
                <input value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>

              {!editingId && (
                <div>
                  <label>Password</label>
                  <input type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}

              <div>
                <label>Chuyên khoa</label>
                <input value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
              </div>

              <div>
                <label>License Number</label>
                <input value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
              </div>

              <div>
                <label>Clinic ID</label>
                <input value={form.clinicID}
                  onChange={(e) => setForm({ ...form, clinicID: e.target.value })} />
              </div>

              <div>
                <label>Giới tính</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">-- Chọn --</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>

              <div>
                <label>Địa chỉ</label>
                <input value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>

              <div>
                <label>Giới thiệu</label>
                <textarea value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
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

      {/* DELETE GIỮ NGUYÊN */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Xóa bác sĩ</h3>
            <p>Bạn có chắc muốn xóa?</p>

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