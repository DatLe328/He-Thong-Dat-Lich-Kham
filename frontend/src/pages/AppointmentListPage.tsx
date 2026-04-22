import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function AppointmentListPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [payingId, setPayingId] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  // 🔥 NEW: cancel modal
  const [cancelingItem, setCancelingItem] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // ======================
  // FETCH
  // ======================
  const fetchAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      let url = "";
      const userId = Number(user?.id);

      if (user && userId) {
        url = `/api/appointments?userId=${userId}`;
      } else {
        if (!phone.trim()) {
          setError("Vui lòng nhập số điện thoại");
          setLoading(false);
          return;
        }
        url = `/api/appointments?phone=${phone}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Lỗi tải dữ liệu");
        setAppointments([]);
        return;
      }

      setAppointments(data.data || []);
    } catch {
      setError("Không thể tải dữ liệu từ server");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAppointments();
  }, [user?.id]);

  // ======================
  // CANCEL FLOW (UPDATED)
  // ======================
  const cancelAppointment = (item: any) => {
    if (item.status === "CONFIRMED") {
      // 🔥 show popup instead of confirm()
      setCancelingItem(item);
      setShowCancelModal(true);
      return;
    }

    if (!confirm("Bạn chắc chắn muốn huỷ lịch?")) return;
    doCancel(item.appointmentId);
  };

  const doCancel = async (id: number) => {
    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "USER_CANCEL" }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.appointmentId === id ? { ...a, status: "CANCELLED" } : a
      )
    );

    setShowCancelModal(false);
    setCancelingItem(null);
  };

  // ======================
  // PAYMENT
  // ======================
  const handlePayment = (id: number) => {
    setPayingId(id);
    setShowPayModal(true);
  };

  const confirmPayment = async () => {
    if (!payingId) return;

    try {
      const res = await fetch("/api/momo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: payingId,
          amount: 50000,
          payType: "DEPOSIT",
        }),
      });

      const data = await res.json();

      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        alert("Không tạo được thanh toán");
      }
    } catch {
      alert("Lỗi thanh toán");
    }
  };

  // ======================
  // STATUS
  // ======================
  const renderStatus = (status: string) => {
    switch (status) {
      case "CANCELLED":
        return <span style={{ color: "#dc2626", fontWeight: 600 }}>❌ Đã huỷ</span>;

      case "COMPLETED":
        return <span style={{ color: "#16a34a", fontWeight: 600 }}>✅ Đã khám</span>;

      case "CONFIRMED":
        return <span style={{ color: "#2563eb", fontWeight: 600 }}>💰 Đã đặt cọc</span>;

      default:
        return <span style={{ color: "#f59e0b", fontWeight: 600 }}>⏳ Chờ xử lý</span>;
    }
  };

  return (
    <div className="page">
      <section className="section">
        <div className="container">

          {!user && (
            <div className="content-card">
              <h2>Tra cứu lịch hẹn</h2>

              <div className="form-row">
                <input
                  className="input"
                  placeholder="Nhập số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />

                <button className="button button--primary" onClick={fetchAppointments}>
                  Tra cứu
                </button>
              </div>
            </div>
          )}

          {error && <p style={{ color: "red" }}>{error}</p>}
          {loading && <p>Đang tải...</p>}

          {!loading && appointments.length > 0 && (
            <div className="profile-main">

              {appointments.map((a, index) => (
                <div key={a.appointmentId} className="content-card">

                  <h4>#{index + 1}</h4>

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3>{a.doctorName}</h3>
                    {renderStatus(a.status)}
                  </div>

                  <p>{a.clinicName}</p>

                  <p>
                    📅 {new Date(a.appointmentDate).toLocaleString("vi-VN")}
                  </p>

                  <p>📝 {a.reason}</p>

                  <p style={{ fontWeight: 600, color: "#f59e0b" }}>
                    💰 Đặt cọc: 50.000đ
                  </p>

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>

                    {a.status === "PENDING" && (
                      <button
                        className="button button--primary"
                        onClick={() => handlePayment(a.appointmentId)}
                      >
                        Đặt cọc
                      </button>
                    )}

                    {a.status !== "CANCELLED" && (
                      <button
                        className="button button--outline"
                        onClick={() => cancelAppointment(a)}
                      >
                        Huỷ lịch
                      </button>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* ======================
          PAYMENT MODAL
      ====================== */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in">

            <div className="modal-header">
              <h3>Thanh toán MoMo</h3>
              <button onClick={() => setShowPayModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p>Phí đặt cọc: <b>50.000đ</b></p>
            </div>

            <div className="modal-actions">
              <button className="button button--outline" onClick={() => setShowPayModal(false)}>
                Huỷ
              </button>

              <button className="button button--primary" onClick={confirmPayment}>
                Thanh toán
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================
          CANCEL MODAL (NEW)
      ====================== */}
      {showCancelModal && cancelingItem && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in">

            <div className="modal-header">
              <h3>Huỷ lịch đã đặt cọc</h3>
              <button onClick={() => setShowCancelModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <p style={{ color: "#dc2626", fontWeight: 600 }}>
                ⚠️ Bạn đã đặt cọc 50.000đ
              </p>
              <p>
                Nếu huỷ lịch, bạn sẽ <b>MẤT TIỀN CỌC</b>.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="button button--outline"
                onClick={() => setShowCancelModal(false)}
              >
                Không huỷ
              </button>

              <button
                className="button button--primary"
                onClick={() => doCancel(cancelingItem.appointmentId)}
              >
                Xác nhận huỷ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AppointmentListPage;