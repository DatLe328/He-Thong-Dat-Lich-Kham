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

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState<{
    scheduleId: number;
    time: string;
    workDate: string;
  } | null>(null);

  const [booking, setBooking] = useState(false);

  const [showProxyModal, setShowProxyModal] = useState(false);

  const [proxyForm, setProxyForm] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      address: "",
    });
  const mapGender = (g: string) => {
      if (g === "male") return "Nam";
      if (g === "female") return "Nữ";
      return "";
    };

  useEffect(() => {
    let cancelled = false;

    const loadDoctor = async () => {
      if (!doctorId) {
        setError("Không tìm thấy mã bác sĩ trong đường dẫn.");
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
          setError(err instanceof Error ? err.message : "Không thể tải hồ sơ bác sĩ.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDoctor();
    return () => {
      cancelled = true;
    };
  }, [doctorId]);

  const handleBook = async (mode: "self" | "relative") => {
  if (!doctor || !selected) return;

  const userId = user?.id;
  if (!userId) {
    alert("Bạn chưa đăng nhập");
    return;
  }

  try {
    setBooking(true);

    const payload: any = {
      userId: Number(userId),
      doctorId: doctor.doctorId,
      scheduleId: selected.scheduleId,
      appointmentDate: `${selected.workDate}T${selected.time}:00`,
    };

    // =========================
    // SELF BOOKING
    // =========================
    if (mode === "self") {
      await bookAppointment(payload);
      alert("Đặt lịch thành công!");
      setSelected(null);
      return;
    }

    // =========================
    // PROXY VALIDATION (CHẶN TRIỆT ĐỂ)
    // =========================
    const {
      firstName,
      lastName,
      email,
      phone,
      gender,
      address,
    } = proxyForm;

    const requiredMissing =
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !gender || gender.trim() === "" ||
      !address?.trim();

    if (requiredMissing) {
      alert("Vui lòng nhập đầy đủ thông tin người được đặt hộ");
      return;
    }

    // validate email basic
    if (!email.includes("@")) {
      alert("Email không hợp lệ");
      return;
    }

    // validate phone basic
    if (phone.length < 9) {
      alert("Số điện thoại không hợp lệ");
      return;
    }

    payload.isProxy = true;
    payload.patientInfo = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender: mapGender(gender),
      address: address.trim(),
    };

    await bookAppointment(payload);

    alert("Đặt lịch thành công!");
    setSelected(null);
    setShowProxyModal(false);
    setProxyForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "",
      address: "",
    });

  } catch (e) {
    alert(e instanceof Error ? e.message : "Lỗi đặt lịch");
  } finally {
    setBooking(false);
  }
};



  if (loading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container empty-state">
            <h2>Đang tải hồ sơ bác sĩ</h2>
            <p>Vui lòng chờ trong giây lát...</p>
          </div>
        </section>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="page">
        <section className="section">
          <div className="container empty-state">
            <h2>Không thể mở hồ sơ bác sĩ</h2>
            <p>{error}</p>
            <Link to="/search" className="button button--primary">
              Quay lại tìm kiếm
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const overviewItems = [
    `Chuyên khoa chính: ${doctor.specialty}`,
    `Email liên hệ: ${doctor.email}`,
    `Số điện thoại: ${doctor.phone}`,
    `Giấy phép hành nghề: ${doctor.licenseNumber}`,
  ];

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
              {doctor.specialties?.length > 0 && (
                <div className="tag-row">
                  {doctor.specialties.map((s) => (
                    <span key={s} className="tag tag--light">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="hero-side-card">
            <div className="stat-pair">
              <strong>{doctor.rating.toFixed(1)}/5</strong>
              <span>{doctor.totalReviews} đánh giá</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.schedules.length}</strong>
              <span>Ngày làm việc</span>
            </div>
            <div className="stat-pair">
              <strong>{doctor.nextAvailable}</strong>
              <span>Lịch gần nhất</span>
            </div>
            <Link to="/search" className="button button--light button--block">
              Quay lại tìm kiếm
            </Link>
          </aside>
        </div>
      </section>

      {/* BODY SECTION */}
      <section className="section">
        <div className="container profile-layout">
          <div className="profile-main">

            {/* OVERVIEW CARD (From File 2) */}
            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Tổng quan</span>
                  <h2>Thông tin hồ sơ bác sĩ</h2>
                </div>
              </div>
              <div className="bullet-list">
                {overviewItems.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </article>

            {/* SCHEDULE CARD */}
            <article className="content-card">
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Lịch làm việc</span>
                  <h2>Khung giờ đang mở</h2>
                </div>
              </div>

              {doctor.schedules.length ? (
                <div className="schedule-grid">
                  {doctor.schedules.map((schedule) => (
                    <div key={schedule.scheduleId} className={`schedule-day schedule-day--${schedule.status}`}>
                      <div className="schedule-day__header">
                        <strong>{schedule.label}</strong>
                        <span>{schedule.hoursLabel} • {schedule.availableCount} slot trống</span>
                      </div>

                      <div className="slot-list">
                        {schedule.slots.map((slot) => {
                          const isSelected =
                            selected?.scheduleId === schedule.scheduleId &&
                            selected?.time === slot.time;

                          return (
                            <span
                              key={slot.time}
                              onClick={() => {
                                if (slot.status !== "available") return;
                                setSelected({
                                  scheduleId: schedule.scheduleId,
                                  time: slot.time,
                                  workDate: schedule.workDate,
                                });
                              }}
                              className={
                                slot.status === "available"
                                  ? isSelected ? "slot slot--selected" : "slot slot--action"
                                  : slot.status === "booked" ? "slot slot--booked" : "slot slot--off"
                              }
                            >
                              {slot.time}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>Bác sĩ hiện chưa có lịch làm việc.</p>
                </div>
              )}
            </article>

            {/* ACTIONS - ĐẶT LỊCH (Nâng cấp UI) */}
            {selected && (
              <div className="booking-actions-bar animate-fade-in">
                <div className="booking-info">
                  <p>Đang chọn: <strong>{selected.time}</strong> ngày <strong>{selected.workDate}</strong></p>
                </div>
                <div className="button-group">
                  <button
                    className="button button--primary"
                    disabled={booking}
                    onClick={() => handleBook("self")}
                  >
                    {booking ? "Đang xử lý..." : "Đặt lịch cho tôi"}
                  </button>
                  <button
                    className="button button--outline"
                    disabled={booking}
                    onClick={() => setShowProxyModal(true)}
                  >
                    Đặt hộ người thân
                  </button>
                </div>
              </div>
            )}

            {/* REVIEWS CARD */}
            <article className="content-card" style={{ marginTop: 20 }}>
              <div className="section-heading section-heading--compact">
                <div>
                  <span className="eyebrow">Đánh giá</span>
                  <h2>Nhận xét từ bệnh nhân</h2>
                </div>
              </div>
              {doctor.reviews?.length ? (
                <div className="review-list">
                  {doctor.reviews.map((r, i) => (
                    <div key={i} className="review-item">
                      <div className="review-item__header">
                        <strong>{r.patientName || r.userName}</strong>
                        <span>⭐ {r.rating}/5</span>
                      </div>
                      <p>{r.comment}</p>
                      <small>{r.createdAt}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>Chưa có đánh giá nào</p>
                </div>
              )}
            </article>
          </div>

          {/* SIDEBAR (From File 2 style) */}
          <aside className="profile-side">
            <article className="sidebar-card">
              <span className="eyebrow">Nơi công tác</span>
              <h3>{doctor.clinicName}</h3>
              <p>{doctor.clinicAddress}</p>
              <p><strong>SĐT:</strong> {doctor.clinicPhone}</p>
            </article>

            <article className="sidebar-card">
              <span className="eyebrow">Thông tin cá nhân</span>
              <p><strong>Giới tính:</strong> {doctor.gender}</p>
              <p><strong>Ngày sinh:</strong> {doctor.dateOfBirth}</p>
              <p><strong>Địa chỉ:</strong> {doctor.address}</p>
            </article>

            {doctor.clinicSpecialties?.length > 0 && (
              <article className="sidebar-card">
                <span className="eyebrow">Chuyên khoa tại cơ sở</span>
                <div className="tag-row">
                  {doctor.clinicSpecialties.map((spec) => (
                    <span key={spec} className="tag">{spec}</span>
                  ))}
                </div>
              </article>
            )}
          </aside>
        </div>
      </section>
      {showProxyModal && (
  <div className="modal-overlay">
    <div className="modal-card animate-fade-in">

      <div className="modal-header">
        <h3>Đặt lịch cho người thân</h3>
        <button onClick={() => setShowProxyModal(false)}>✕</button>
      </div>

      <div className="modal-body">

                <input
          className="input"
          placeholder="Họ"
          value={proxyForm.lastName}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, lastName: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Tên"
          value={proxyForm.firstName}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, firstName: e.target.value })
          }
        />
        <input
          className="input"
          placeholder="Email *"
          value={proxyForm.email}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, email: e.target.value })
          }
        />

        <input
          className="input"
          placeholder="Số điện thoại"
          value={proxyForm.phone}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, phone: e.target.value })
          }
        />

        <select
          className="input"
          value={proxyForm.gender}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, gender: e.target.value })
          }
        >
          <option value="">Chọn giới tính</option>
          <option value="male">Nam</option>
          <option value="female">Nữ</option>
        </select>

        <input
          className="input"
          placeholder="Địa chỉ"
          value={proxyForm.address}
          onChange={(e) =>
            setProxyForm({ ...proxyForm, address: e.target.value })
          }
        />

      </div>

      <div className="modal-actions">
        <button
          className="button button--outline"
          onClick={() => setShowProxyModal(false)}
        >
          Hủy
        </button>

        <button
          className="button button--primary"
          onClick={() => handleBook("relative")}
          disabled={booking}
        >
          {booking ? "Đang xử lý..." : "Xác nhận đặt"}
        </button>
      </div>

    </div>
  </div>
)}
    </div>

  );
}

export default DoctorDetailPage;