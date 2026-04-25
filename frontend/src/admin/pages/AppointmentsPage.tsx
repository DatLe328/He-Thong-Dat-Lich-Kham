import { useEffect, useState } from "react";

type Appointment = {
  appointmentId: number;
  appointmentDate: string;
  createdAt?: string; // 👈 THÊM CÁI NÀY
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

  patient?: {
    patientID: number;
    name: string;
    phone?: string;
  };

  doctor?: {
    doctorID: number;
    name: string;
    specialization?: string;
  };
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const [ngay, setNgay] = useState("");
  const [trangThai, setTrangThai] = useState("");

  // LOAD DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/appointments");
        const data = await res.json();

        setAppointments(data?.data || []);
      } catch (err) {
        console.error("Load appointments error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // =========================
  // SORT + FILTER
  // =========================
  const filtered = [...appointments]   // 👈 copy để sort không mutate state
    .sort((a, b) => {
      return (
        new Date(b.createdAt || b.appointmentDate).getTime() -
        new Date(a.createdAt || a.appointmentDate).getTime()
      );
    })
    .filter((a) => {
      const matchDate = ngay
        ? a.appointmentDate?.slice(0, 10) === ngay
        : true;

      const matchStatus = trangThai ? a.status === trangThai : true;

      return matchDate && matchStatus;
    });

  // APPROVE
  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/appointments/${id}/approve`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === id ? { ...a, status: "CONFIRMED" } : a
        )
      );
    } catch (err: any) {
      alert(err.message || "Lỗi duyệt lịch");
    }
  };

  // CANCEL
  const handleCancel = async (id: number) => {
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Admin cancel" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === id ? { ...a, status: "CANCELLED" } : a
        )
      );
    } catch (err: any) {
      alert(err.message || "Lỗi hủy lịch");
    }
  };

  return (
    <div>
      <h2>Quản lý lịch hẹn</h2>

      {/* FILTER */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input
            type="date"
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
          />

          <select
            value={trangThai}
            onChange={(e) => setTrangThai(e.target.value)}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="COMPLETED">Hoàn thành</option>
          </select>

          <button
            className="btn"
            onClick={() => {
              setNgay("");
              setTrangThai("");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card table-wrapper">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Bệnh nhân</th>
                <th>Bác sĩ</th>
                <th>Ngày giờ</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => (
                <tr key={a.appointmentId}>
                  <td>{a.appointmentId}</td>

                  <td>{a.patient?.name || "Chưa có"}</td>
                  <td>{a.doctor?.name || "Chưa có"}</td>

                  <td>
                    {a.appointmentDate?.replace("T", " ").slice(0, 16)}
                  </td>

                  <td>
                    <span
                      className={
                        a.status === "CONFIRMED"
                          ? "status status-ok"
                          : a.status === "CANCELLED"
                          ? "status status-cancel"
                          : "status status-wait"
                      }
                    >
                      {a.status}
                    </span>
                  </td>

                  <td>
                    <div className="action-buttons">
                      {a.status === "PENDING" && (
                        <button
                          className="btn"
                          onClick={() => handleApprove(a.appointmentId)}
                        >
                          Duyệt
                        </button>
                      )}

                      {a.status !== "CANCELLED" && (
                          <button
                            className="btn btn-danger"
                            onClick={() => handleCancel(a.appointmentId)}
                          >
                            Hủy
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length === 0 && (
          <p style={{ marginTop: 10 }}>Không có dữ liệu</p>
        )}
      </div>
    </div>
  );
}