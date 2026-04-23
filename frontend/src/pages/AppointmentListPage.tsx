import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

function AppointmentListPage() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [payingId, setPayingId] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);

  const [cancelId, setCancelId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchDoctor, setSearchDoctor] = useState("");

  const [timeLeftMap, setTimeLeftMap] = useState<Record<number, number>>({});

  // ======================
  // FETCH LOGIC
  // ======================
  const fetchAppointments = async () => {
    const identifier = user?.id ? `userId=${user.id}` : phone.length >= 10 ? `phone=${phone}` : "";

    if (!identifier) {
      if (!user?.id) setAppointments([]);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/appointments?${identifier}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Không tìm thấy dữ liệu");
        setAppointments([]);
        return;
      }

      setAppointments(data.data || []);
    } catch {
      setError("Lỗi kết nối server");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchAppointments();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id && phone.length >= 10) {
      const delayDebounceFn = setTimeout(() => {
        fetchAppointments();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [phone, user?.id]);

  // ======================
  // FILTER
  // ======================
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    list.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (searchDoctor.trim()) {
      list = list.filter((a) => a.doctorName?.toLowerCase().includes(searchDoctor.toLowerCase()));
    }
    return list;
  }, [appointments, statusFilter, searchDoctor]);

  // ======================
  // COUNTDOWN
  // ======================
  useEffect(() => {
    const interval = setInterval(() => {
      const map: Record<number, number> = {};
      appointments.forEach((a) => {
        if (a.status !== "PENDING" || !a.expiresAt) return;
        const diff = Math.floor((new Date(a.expiresAt).getTime() - Date.now()) / 1000);
        map[a.appointmentId] = diff;
      });
      setTimeLeftMap(map);
    }, 1000);
    return () => clearInterval(interval);
  }, [appointments]);

  const formatTime = (s?: number) => {
    if (s === undefined) return "--:--";
    if (s <= 0) return "00:00";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ======================
  // ACTIONS (PAY/CANCEL)
  // ======================
  const confirmPayment = async () => {
    if (!payingId) return;
    try {
      const res = await fetch("/api/momo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: payingId, amount: 50000 }),
      });
      const data = await res.json();
      if (data.payUrl) window.location.href = data.payUrl;
      else alert("Lỗi tạo thanh toán");
    } catch { alert("Lỗi hệ thống"); }
  };

  const confirmCancel = async () => {
    if (!cancelId) return;
    try {
      const res = await fetch(`/api/appointments/${cancelId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Người dùng tự huỷ" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err: any) { alert(err.message); }
  };

  const renderStatus = (a: any, timeLeft?: number) => {
    if (a.status === "CANCELLED") return <span style={{ color: "red" }}>❌ Đã huỷ</span>;
    if (a.status === "CONFIRMED") return <span style={{ color: "green" }}>💰 Đã cọc</span>;
    if (a.status === "COMPLETED") return <span style={{ color: "blue" }}>✅ Đã khám</span>;
    if (a.status === "PENDING") {
      if (timeLeft !== undefined && timeLeft <= 0) return <span style={{ color: "red" }}>⛔ Hết hạn</span>;
      return <span style={{ color: "orange" }}>⏳ Chờ thanh toán</span>;
    }
    return null;
  };

  return (
    <div className="page">
      <section className="section">
        <div className="container">

          {/* Ô NHẬP SỐ ĐIỆN THOẠI (Chỉ hiện khi chưa đăng nhập) */}
          {!user?.id && (
            <div className="content-card" style={{ textAlign: 'center', border: '1px solid #007bff' }}>
              <h2 style={{ marginBottom: 15 }}>Tra cứu lịch hẹn</h2>
              <input
                className="input"
                type="tel"
                placeholder="Nhập số điện thoại của bạn..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ maxWidth: 400, margin: '0 auto', fontSize: '1.1rem', textAlign: 'center' }}
              />
              <p style={{ marginTop: 10, color: '#666' }}>* Hệ thống sẽ tự động tìm kiếm khi bạn nhập đủ số.</p>
            </div>
          )}

          {/* FILTER BỔ TRỢ (Chỉ hiện khi đã có danh sách lịch hẹn) */}
          {appointments.length > 0 && (
            <div className="content-card">
              <div className="form-row" style={{ gap: 10 }}>

                <select
                  className="input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ thanh toán</option>
                  <option value="CONFIRMED">Đã cọc</option>
                  <option value="CANCELLED">Đã huỷ</option>
                </select>
              </div>
            </div>
          )}

          {loading && <p style={{ textAlign: 'center' }}>Đang tìm kiếm...</p>}
          {error && <p style={{ color: "red", textAlign: 'center' }}>{error}</p>}

          {/* LIST */}
          <div className="profile-main">
            {filteredAppointments.map((a) => {
              const timeLeft = timeLeftMap[a.appointmentId];
              const isExpired = a.status === "PENDING" && timeLeft !== undefined && timeLeft <= 0;

              return (
                <div key={a.appointmentId} className="content-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3>{a.doctorName}</h3>
                    {renderStatus(a, timeLeft)}
                  </div>
                  <p>{a.clinicName}</p>
                  <p>📅 {new Date(a.appointmentDate).toLocaleString("vi-VN")}</p>
                  <p>💰 Cọc: 50.000đ</p>
                  <p>🕒 Đặt lúc: {new Date(a.createdAt).toLocaleString("vi-VN")}</p>
                  <p>
                  ⏳ Hết hạn: {a.expiresAt ? new Date(a.expiresAt).toLocaleString("vi-VN") : "Chưa có"}
                  </p>

                  {a.status === "PENDING" && timeLeft !== undefined && (
                    <p style={{ color: isExpired ? "red" : "orange" }}>
                      {isExpired ? "⛔ Hết hạn" : `⏳ Còn ${formatTime(timeLeft)}`}
                    </p>
                  )}

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    {a.status === "PENDING" && !isExpired && (
                      <button className="button button--primary" onClick={() => { setPayingId(a.appointmentId); setShowPayModal(true); }}>
                        Đặt cọc
                      </button>
                    )}
                    {a.status !== "CANCELLED" && (
                      <button className="button button--outline" onClick={() => { setCancelId(a.appointmentId); setShowCancelModal(true); }}>
                        Huỷ lịch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* MODALS (Giữ nguyên UI cũ) */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header"><h3>Thanh toán MoMo</h3><button onClick={() => setShowPayModal(false)}>✕</button></div>
            <div className="modal-body"><p>Phí cọc: <b>50.000đ</b></p></div>
            <div className="modal-actions">
              <button className="button button--outline" onClick={() => setShowPayModal(false)}>Huỷ</button>
              <button className="button button--primary" onClick={confirmPayment}>Thanh toán</button>
            </div>
          </div>
        </div>
      )}

      {showCancelModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header"><h3>Huỷ lịch hẹn</h3><button onClick={() => setShowCancelModal(false)}>✕</button></div>
            <div className="modal-body">
              <p>Bạn có chắc muốn huỷ lịch này?</p>
              <textarea className="input" placeholder="Lý do huỷ..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="button button--outline" onClick={() => setShowCancelModal(false)}>Không</button>
              <button className="button button--primary" onClick={confirmCancel}>Xác nhận huỷ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentListPage;