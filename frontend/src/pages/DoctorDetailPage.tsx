import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DoctorAvatar from "../components/DoctorAvatar";
import { fetchDoctorProfile } from "../lib/doctors";
import { bookAppointment } from "../lib/appointments";
import { DoctorProfile } from "../types";
import { useAuth } from "../context/AuthContext";

function DoctorDetailPage() {
  const { doctorId } = useParams();
  const { user } = useAuth();
  const canManageAppointments = user?.role === "DOCTOR" || user?.role === "ADMIN";

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pendingAppointmentId, setPendingAppointmentId] = useState<number | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selected, setSelected] = useState<{
    scheduleId: number;
    time: string;
    workDate: string;
  } | null>(null);

  const [booking, setBooking] = useState(false);
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false); // Modal dành cho khách chưa login

  const [proxyForm, setProxyForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    phone: "",
    gender: "",
    address: "",
    note: "",

  });
  const [note, setNote] = useState("");

  const handleClosePayment = () => {
    setShowPayModal(false);
    setPendingAppointmentId(null);
  };

  useEffect(() => {
    let cancelled = false;
    const loadDoctor = async () => {
      if (!doctorId) {
        setError("Không tìm thấy mã bác sĩ.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const profile = await fetchDoctorProfile(doctorId);
        if (!cancelled) {
          setDoctor(profile);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setDoctor(null);
          setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadDoctor();
    return () => { cancelled = true; };
  }, [doctorId]);

  // LOGIC ĐẶT LỊCH CHUNG
  const handleBook = async (mode: "self" | "proxy" | "guest") => {
    if (!doctor || !selected) return;
    try {
      setBooking(true);

      const payload: any = {
        doctorId: Number(doctor.doctorId),
        scheduleId: Number(selected.scheduleId),
        appointmentDate: `${selected.workDate}T${selected.time}:00`,
        mode: mode,
        clinicId: doctor.clinicId,
        note: (note || proxyForm.note || "").trim()
      };

      if (user?.id) {
          payload.userId = user?.id ? Number(user.id) : undefined;
        }

      // Nếu là đặt hộ hoặc khách vãng lai -> Lấy thông tin từ form
      if (mode === "guest" || mode === "proxy") {
        const { firstName, lastName, phone, gender, address } = proxyForm;

        if (!firstName.trim() || !lastName.trim() || !phone.trim() || !gender || !address.trim() || !proxyForm.dateOfBirth)  {
          alert("⚠️ Vui lòng nhập đầy đủ thông tin bắt buộc (*)");
          setBooking(false);
          return;
        }

        payload.patientInfo = {
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          dateOfBirth: proxyForm.dateOfBirth,
          phone: phone.trim(),
          email: proxyForm.email?.trim() || "",
          gender: gender === "male" ? "Nam" : gender === "female" ? "Nữ" : "",
          address: address.trim(),
        };
      }

      const res = await bookAppointment(payload);
      const appointmentId = res?.data?.appointmentId || res?.appointmentId;

      if (!appointmentId) return alert("Lỗi: Không nhận được ID lịch hẹn.");

      setPendingAppointmentId(appointmentId);
      setShowPayModal(true);


      setSelected(null);
      setShowGuestForm(false);
      setShowProxyModal(false);
      setProxyForm({ firstName: "", lastName: "", email: "", phone: "", gender: "", address: "",dateOfBirth: "", note: "" });
      setNote("");

    } catch (e: any) {
      alert(e.response?.data?.message || e.message || "Lỗi đặt lịch");
    } finally {
      setBooking(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingAppointmentId) return;
    try {
      setBooking(true);
      const res = await fetch("/api/momo/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: Number(pendingAppointmentId),
          amount: 50000,
          extraData: ""
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Lỗi server");
      }

      const data = await res.json();
      if (data?.success && data?.payUrl) {
        window.location.href = data.payUrl;
      } else {
        alert(data.message || "Không thể khởi tạo thanh toán.");
        setShowPayModal(false);
      }
    } catch (err: any) {
      alert(err.message || "Lỗi kết nối thanh toán.");
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="page"><div className="container empty-state"><h2>Đang tải...</h2></div></div>;
  if (error || !doctor) return <div className="page"><div className="container empty-state"><h2>{error}</h2><Link to="/search">Quay lại</Link></div></div>;

  return (
    <div className="page">
      {/* HERO SECTION */}
      <section className="doctor-hero">
        <div className="container doctor-hero__grid">
          <div className="doctor-hero__main">
            <DoctorAvatar name={doctor.name} large />
            <div>
              <span className="eyebrow eyebrow--light">Hồ sơ bác sĩ</span>
              <h1>{doctor.name}</h1>
              <p className="lead">{doctor.specialty}</p>
              <p>{doctor.bio}</p>
            </div>
          </div>
          <aside className="hero-side-card">
            <div className="stat-pair"><strong>{doctor.rating.toFixed(1)}/5</strong><span>{doctor.totalReviews} đánh giá</span></div>
            <div className="stat-pair"><strong>{doctor.schedules.length}</strong><span>Ngày làm việc</span></div>
            {canManageAppointments && <Link to={`/doctors/${doctor.doctorId}/appointments`} className="button button--ghost button--block">Quản lý</Link>}
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container profile-layout">
          <div className="profile-main">
            {/* 1. TỔNG QUAN */}
            <article className="content-card">
              <div className="section-heading section-heading--compact"><div><span className="eyebrow">Tổng quan</span><h2>Thông tin hồ sơ</h2></div></div>
              <div className="bullet-list">
                <p>Chuyên khoa: {doctor.specialty}</p>
                <p>Email: {doctor.email}</p>
                <p>SĐT: {doctor.phone}</p>
              </div>
            </article>

            {/* 2. LỊCH LÀM VIỆC */}
            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div><span className="eyebrow">Lịch làm việc</span><h2>Khung giờ mở</h2></div>
              </div>
              <div className="schedule-wrapper">
                {doctor.schedules.map((schedule) => (
                  <div key={schedule.scheduleId} className="schedule-card">
                    <div className="schedule-header">
                      <span className="schedule-date">{schedule.label}</span>
                      <span className="schedule-sub">{schedule.slots.filter(s => s.status === "available").length} slot trống</span>
                    </div>
                    <div className="slot-grid">
                      {schedule.slots.map((slot) => {
                        const isSelected = selected?.scheduleId === schedule.scheduleId && selected?.time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            disabled={slot.status !== "available"}
                            onClick={() => setSelected({ scheduleId: schedule.scheduleId, time: slot.time, workDate: schedule.workDate })}
                            className={`slot-btn ${slot.status === "available" ? "available" : "booked"} ${isSelected ? "selected" : ""}`}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* 3. BOOKING BAR */}
            {selected && (
              <div className="booking-actions-bar animate-fade-in" style={{ marginBottom: 24 }}>
                <div className="booking-info">
                <p>Đang chọn: <strong>{selected.time}</strong> ngày <strong>{selected.workDate}</strong></p>
                 <textarea
                    className="input"
                    placeholder="Ghi chú (triệu chứng, yêu cầu...)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    style={{ marginTop: 10, minWidth: 300}}
                  />
                </div>
                <div className="button-group">
                  <button
                    className="button button--primary"
                    onClick={() => !user ? setShowGuestForm(true) : handleBook("self")}
                  >
                    Đặt lịch ngay
                  </button>
                  {user && <button className="button button--outline" onClick={() => setShowProxyModal(true)}>Đặt hộ</button>}
                </div>
              </div>
            )}

            {/* 4. NHẬN XÉT */}
            <article className="content-card">
              <div className="section-heading section-heading--compact"><div><span className="eyebrow">Đánh giá</span><h2>Nhận xét bệnh nhân</h2></div></div>
              {doctor.reviews?.length ? (
                <div className="review-list">
                  {doctor.reviews.map((r, i) => (
                    <div key={i} className="review-item">
                      <div className="review-item__header"><strong>{r.patientName}</strong><span>⭐ {r.rating}/5</span></div>
                      <p>{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="empty-state">Chưa có đánh giá.</p>}
            </article>
          </div>

          <aside className="profile-side">
            <article className="sidebar-card"><h3>{doctor.clinicName}</h3><p>{doctor.clinicAddress}</p></article>
            <article className="sidebar-card"><p><strong>Giới tính:</strong> {doctor.gender}</p><p><strong>Địa chỉ:</strong> {doctor.address}</p></article>
          </aside>
        </div>
      </section>

      {/* MODAL ĐẶT HỘ (PROXY) */}
      {showProxyModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in">
            <div className="modal-header"><h3>Đặt hộ người thân</h3><button onClick={() => setShowProxyModal(false)}>✕</button></div>
            <div className="modal-body">
              <input className="input" placeholder="Họ" value={proxyForm.lastName} onChange={(e) => setProxyForm({ ...proxyForm, lastName: e.target.value })} />
              <input className="input" placeholder="Tên *" value={proxyForm.firstName} onChange={(e) => setProxyForm({ ...proxyForm, firstName: e.target.value })} />
              <input
                          className="input"
                          type="date"
                          placeholder="Ngày sinh *"
                          value={proxyForm.dateOfBirth}
                          onChange={(e) =>
                            setProxyForm({ ...proxyForm, dateOfBirth: e.target.value })
                          }
                        />
              <input className="input" placeholder="Số điện thoại *" value={proxyForm.phone} onChange={(e) => setProxyForm({ ...proxyForm, phone: e.target.value })} />
              <input className="input" placeholder="Email" value={proxyForm.email} onChange={(e) => setProxyForm({ ...proxyForm, email: e.target.value })} />
              <select className="input" value={proxyForm.gender} onChange={(e) => setProxyForm({ ...proxyForm, gender: e.target.value })}>
                <option value="">Giới tính</option><option value="male">Nam</option><option value="female">Nữ</option>
              </select>
              <input className="input" placeholder="Địa chỉ *" value={proxyForm.address} onChange={(e) => setProxyForm({ ...proxyForm, address: e.target.value })} />
              <textarea
                  className="input"
                  placeholder="Ghi chú (triệu chứng, yêu cầu...)"
                  value={proxyForm.note}
                  onChange={(e) => setProxyForm({ ...proxyForm, note: e.target.value })}
                />
            </div>
            <div className="modal-actions">
              <button className="button button--outline" onClick={() => setShowProxyModal(false)}>Huỷ</button>
              <button className="button button--primary" onClick={() => handleBook("proxy")}>Xác nhận đặt hộ</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHÁCH VÃNG LAI (GUEST) */}
      {showGuestForm && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in">
            <div className="modal-header"><h3>Thông tin đặt lịch</h3><button onClick={() => setShowGuestForm(false)}>✕</button></div>
            <div className="modal-body">
              <p className="mb-4 text-sm text-gray-600">Vui lòng cung cấp thông tin để bác sĩ liên hệ.</p>
              <input className="input" placeholder="Họ *" value={proxyForm.lastName} onChange={(e) => setProxyForm({ ...proxyForm, lastName: e.target.value })} />
              <input className="input" placeholder="Tên *" value={proxyForm.firstName} onChange={(e) => setProxyForm({ ...proxyForm, firstName: e.target.value })} />
                                      <input
                          className="input"
                          type="date"
                          placeholder="Ngày sinh *"
                          value={proxyForm.dateOfBirth}
                          onChange={(e) =>
                            setProxyForm({ ...proxyForm, dateOfBirth: e.target.value })
                          }
                        />
              <input className="input" placeholder="Số điện thoại *" value={proxyForm.phone} onChange={(e) => setProxyForm({ ...proxyForm, phone: e.target.value })} />
              <input className="input" placeholder="Email" value={proxyForm.email} onChange={(e) => setProxyForm({ ...proxyForm, email: e.target.value })} />
              <select className="input" value={proxyForm.gender} onChange={(e) => setProxyForm({ ...proxyForm, gender: e.target.value })}>
                <option value="">Giới tính</option><option value="male">Nam</option><option value="female">Nữ</option>
              </select>
              <input className="input" placeholder="Địa chỉ *" value={proxyForm.address} onChange={(e) => setProxyForm({ ...proxyForm, address: e.target.value })} />
              <textarea
                  className="input"
                  placeholder="Ghi chú (triệu chứng, yêu cầu...)"
                  value={proxyForm.note}
                  onChange={(e) => setProxyForm({ ...proxyForm, note: e.target.value })}
                />
            </div>
            <div className="modal-actions">
              <button className="button button--outline" onClick={() => setShowGuestForm(false)}>Huỷ</button>
              <button className="button button--primary" onClick={() => handleBook("guest")}>Tiếp tục</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN (MOMO) */}
      {showPayModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-fade-in">
            <div className="modal-header"><h3>Thanh toán cọc</h3><button onClick={handleClosePayment}>✕</button></div>
            <div className="modal-body"><p>Phí cọc: <strong>50.000đ</strong>. Vui lòng thanh toán trong <strong>5 phút</strong>.</p></div>
            <div className="modal-actions" style={{ display: "flex", gap: 10 }}>
              <button className="button button--outline" onClick={handleClosePayment}>Để sau</button>
              <button className="button button--primary" onClick={handleConfirmPayment}>Thanh toán MoMo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDetailPage;