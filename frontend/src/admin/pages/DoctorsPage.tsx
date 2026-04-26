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
    gender: "Nam",
    dateOfBirth: "",
    address: "",
    bio: "",
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/doctors");
      const json = await res.json();
      setData(json?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const k = search.toLowerCase();

    return data.filter((d) =>
      `${d.user?.firstName} ${d.user?.lastName}`.toLowerCase().includes(k) ||
      d.specialization?.toLowerCase().includes(k) ||
      d.licenseNumber?.toLowerCase().includes(k)
    );
  }, [data, search]);

  const validate = () => {
    if (
      !form.firstName ||
      !form.lastName ||
      !form.email ||
      (!editingId && !form.password) ||
      !form.specialization
    ) {
      setError("⚠️ Vui lòng nhập đầy đủ thông tin");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const res = await fetch(
      editingId ? `/api/doctors/${editingId}` : "/api/doctors",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email.trim().toLowerCase(),
          phone: form.phone || null,
          clinicID: form.clinicID ? Number(form.clinicID) : null,
          dateOfBirth: form.dateOfBirth || null,
        }),
      }
    );

    const json = await res.json();

    if (!res.ok) {
      // ✅ CHỈ HIỆN 1 LỖI
      if (json.message === "EMAIL_EXISTS") {
        setError("❌ Email đã tồn tại");
      } else if (json.message === "LICENSE_EXISTS") {
        setError("❌ License đã tồn tại");
      } else if (json.message?.toLowerCase().includes("phone")) {
        setError("❌ Số điện thoại đã tồn tại");
      } else {
        setError("❌ Có lỗi xảy ra");
      }
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
      dateOfBirth: d.user?.dateOfBirth
        ? d.user.dateOfBirth.split("T")[0]
        : "",
      address: d.user?.address || "",
      bio: d.bio || "",
    });

    setEditingId(id);
    setShowForm(true);
    setError("");
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    await fetch(`/api/doctors/${deleteId}`, { method: "DELETE" });
    setData((prev) => prev.filter((d) => d.doctorID !== deleteId));
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
      specialization: "",
      licenseNumber: "",
      clinicID: "",
      phone: "",
      gender: "",
      dateOfBirth: "",
      address: "",
      bio: "",
    });
  };

  return (
    <div className="content">
      <h2>👨‍⚕️ Quản lý bác sĩ</h2>

      <div className="card table-wrapper">
        <div className="toolbar">
          <input
            className="search-input"
            placeholder="🔎 Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
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
              {filteredData.map((d) => (
                <tr key={d.doctorID}>
                  <td>{d.doctorID}</td>
                  <td>{d.user?.firstName} {d.user?.lastName}</td>
                  <td>{d.specialization}</td>
                  <td>⭐ {d.rating}</td>
                  <td>
                    <button className="btn" onClick={() => handleEdit(d.doctorID)}>Sửa</button>
                    <button className="btn btn-danger" onClick={() => setDeleteId(d.doctorID)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-card fancy-modal">
            <h3>{editingId ? "✏️ Sửa bác sĩ" : "➕ Thêm bác sĩ"}</h3>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <div className="form-grid">
              <div>
                <label>Họ</label>
                <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}/>
              </div>

              <div>
                <label>Tên</label>
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}/>
              </div>


                          {
              editingId ? (

                <div className="full">
                  <label>Email</label>
                  <input
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              ) : (

                <div>
                  <label>Email</label>
                  <input
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              )
            }



              {!editingId && (
                <div>
                  <label>Mật khẩu</label>
                  <input type="password" value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}/>
                </div>
              )}

              <div>
                <label>SĐT</label>
                <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/>
              </div>

              <div >
                <label>Ngày sinh</label>
                <input type="date"
                  value={form.dateOfBirth}
                  onChange={e => setForm({...form, dateOfBirth: e.target.value})}/>
              </div>

              <div>
                <label>Chuyên khoa</label>
                <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})}/>
              </div>

              <div>
                <label>License</label>
                <input value={form.licenseNumber} onChange={e => setForm({...form, licenseNumber: e.target.value})}/>
              </div>

              <div>
                <label>Clinic ID</label>
                <input value={form.clinicID} onChange={e => setForm({...form, clinicID: e.target.value})}/>
              </div>

              <div>
                <label>Giới tính</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>


              <div className="full">
                <label>Địa chỉ</label>
                <input value={form.address} onChange={e => setForm({...form, address: e.target.value})}/>
              </div>


              <div className="full">
                <label>Bio</label>
                <textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})}/>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleSubmit}>💾 Lưu</button>
              <button className="btn btn-outline" onClick={closeForm}>❌ Hủy</button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Xóa bác sĩ?</h3>
            <div className="modal-actions">
              <button className="btn btn-danger" onClick={handleDelete}>Xóa</button>
              <button className="btn btn-outline" onClick={() => setDeleteId(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}