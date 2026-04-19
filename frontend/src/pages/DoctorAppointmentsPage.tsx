import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DoctorAvatar from "../components/DoctorAvatar";
import { fetchDoctorProfile } from "../lib/doctors";
import {
  cancelDoctorAppointment,
  fetchDoctorAppointments,
  rescheduleDoctorAppointment,
} from "../lib/doctorAppointments";
import { DoctorAppointment, DoctorProfile } from "../types";

type AppointmentFilter = "ALL" | DoctorAppointment["status"];

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function toBackendDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatSummaryDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusClass(status: DoctorAppointment["status"]) {
  return `status-badge status-badge--${status.toLowerCase()}`;
}

function DoctorAppointmentsPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<AppointmentFilter>("ALL");
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [rescheduleTarget, setRescheduleTarget] = useState<DoctorAppointment | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [rescheduleError, setRescheduleError] = useState("");
  const [cancelTarget, setCancelTarget] = useState<DoctorAppointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (rescheduleTarget) {
      setRescheduleDateTime(toDateTimeLocalValue(rescheduleTarget.appointmentDate));
      setRescheduleError("");
    }
  }, [rescheduleTarget]);

  useEffect(() => {
    if (cancelTarget) {
      setCancelReason(cancelTarget.cancelReason ?? "");
      setCancelError("");
    }
  }, [cancelTarget]);

  useEffect(() => {
    let cancelled = false;

    const loadAppointments = async () => {
      if (!doctorId) {
        setError("Không tìm thấy mã bác sĩ trong đường dẫn.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [profile, appointmentPayload] = await Promise.all([
          fetchDoctorProfile(doctorId),
          fetchDoctorAppointments(doctorId, {
            status: filter,
            upcomingOnly,
          }),
        ]);

        if (!cancelled) {
          setDoctor(profile);
          setAppointments(appointmentPayload.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDoctor(null);
          setAppointments([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể tải dữ liệu lịch hẹn của bác sĩ."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      cancelled = true;
    };
  }, [doctorId, filter, upcomingOnly]);

  const summary = useMemo(() => {
    const base = {
      total: appointments.length,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      upcoming: 0,
    };

    return appointments.reduce((accumulator, appointment) => {
      if (appointment.status === "PENDING") accumulator.pending += 1;
      if (appointment.status === "CONFIRMED") accumulator.confirmed += 1;
      if (appointment.status === "COMPLETED") accumulator.completed += 1;
      if (appointment.status === "CANCELLED") accumulator.cancelled += 1;
      if (appointment.isUpcoming) accumulator.upcoming += 1;
      return accumulator;
    }, base);
  }, [appointments]);

  const refreshList = async () => {
    if (!doctorId) return;

    const payload = await fetchDoctorAppointments(doctorId, {
      status: filter,
      upcomingOnly,
    });

    setAppointments(payload.data);
  };

  const handleRescheduleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!doctorId || !rescheduleTarget) {
      return;
    }

    if (!rescheduleDateTime) {
      setRescheduleError("Vui lòng chọn ngày giờ mới.");
      return;
    }

    try {
      setSavingId(rescheduleTarget.appointmentId);
      setRescheduleError("");

      await rescheduleDoctorAppointment(
        doctorId,
        rescheduleTarget.appointmentId,
        toBackendDateTime(rescheduleDateTime),
        rescheduleTarget.scheduleId
      );

      await refreshList();
      setRescheduleTarget(null);
    } catch (saveError) {
      setRescheduleError(
        saveError instanceof Error ? saveError.message : "Không thể dời lịch hẹn."
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleCancelSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!doctorId || !cancelTarget) {
      return;
    }

    try {
      setSavingId(cancelTarget.appointmentId);
      setCancelError("");

      await cancelDoctorAppointment(doctorId, cancelTarget.appointmentId, cancelReason.trim() || undefined);

      await refreshList();
      setCancelTarget(null);
    } catch (saveError) {
      setCancelError(
        saveError instanceof Error ? saveError.message : "Không thể huỷ lịch hẹn."
      );
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <section className="section">
          <div className="container empty-state">
            <h2>Đang tải lịch hẹn</h2>
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
            <h2>Không thể mở trang quản lý lịch hẹn</h2>
            <p>{error}</p>
            <button type="button" className="button button--primary" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="doctor-hero">
        <div className="container doctor-hero__grid">
          <div className="doctor-hero__main">
            <DoctorAvatar name={doctor.name} large />
            <div>
              <span className="eyebrow eyebrow--light">Quản lý lịch hẹn</span>
              <h1>{doctor.name}</h1>
              <p className="lead">Theo dõi, dời lịch và huỷ các cuộc hẹn của bác sĩ.</p>
              <p>{doctor.specialty}</p>
            </div>
          </div>

          <aside className="hero-side-card">
            <div className="stat-pair">
              <strong>{summary.total}</strong>
              <span>Lịch hẹn đang hiển thị</span>
            </div>
            <div className="stat-pair">
              <strong>{summary.upcoming}</strong>
              <span>Lịch sắp tới</span>
            </div>
            <div className="stat-pair">
              <strong>{summary.pending}</strong>
              <span>Chờ xác nhận</span>
            </div>
            <Link to={`/doctors/${doctor.doctorId}`} className="button button--light button--block">
              Về hồ sơ bác sĩ
            </Link>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container appointment-management">
          <div className="management-header">
            <div>
              <span className="eyebrow">Bộ lọc</span>
              <h2>Chọn chế độ hiển thị lịch hẹn</h2>
            </div>
            <button type="button" className="button button--ghost" onClick={() => refreshList()}>
              Làm mới
            </button>
          </div>

          <div className="dashboard-tabs" aria-label="Bộ lọc lịch hẹn">
            {(["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`dashboard-tab ${filter === item ? "is-active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item === "ALL"
                  ? "Tất cả"
                  : item === "PENDING"
                    ? "Chờ xác nhận"
                    : item === "CONFIRMED"
                      ? "Đã xác nhận"
                      : item === "COMPLETED"
                        ? "Hoàn tất"
                        : "Đã huỷ"}
              </button>
            ))}
          </div>

          <label className="checkbox appointment-management__toggle">
            <input
              type="checkbox"
              checked={upcomingOnly}
              onChange={(event) => setUpcomingOnly(event.target.checked)}
            />
            <span>Chỉ hiển thị lịch hẹn sắp tới</span>
          </label>

          <div className="stats-grid">
            <article className="stat-card">
              <strong>{summary.total}</strong>
              <span>Tổng lịch hẹn</span>
            </article>
            <article className="stat-card">
              <strong>{summary.confirmed}</strong>
              <span>Đã xác nhận</span>
            </article>
            <article className="stat-card">
              <strong>{summary.completed}</strong>
              <span>Hoàn tất</span>
            </article>
          </div>

          {appointments.length ? (
            <div className="appointment-list">
              {appointments.map((appointment) => (
                <article key={appointment.appointmentId} className="appointment-card">
                  <div className="appointment-card__header">
                    <div>
                      <span className={getStatusClass(appointment.status)}>{appointment.statusLabel}</span>
                      <h3>{appointment.contactName}</h3>
                      <p>{appointment.contactLabel}</p>
                    </div>

                    <div className="appointment-card__header-meta">
                      <strong>{appointment.appointmentTimeLabel}</strong>
                      <span>{appointment.appointmentDateLabel}</span>
                    </div>
                  </div>

                  <p className="appointment-card__description">
                    {appointment.reason || "Chưa có ghi chú từ lịch hẹn."}
                  </p>

                  <dl className="appointment-card__meta">
                    <div>
                      <dt>Mã lịch hẹn</dt>
                      <dd>#{appointment.appointmentId}</dd>
                    </div>
                    <div>
                      <dt>Lịch khám</dt>
                      <dd>{appointment.scheduleId ? `#${appointment.scheduleId}` : "Chưa có"}</dd>
                    </div>
                    <div>
                      <dt>Phòng khám</dt>
                      <dd>{appointment.clinicId ? `#${appointment.clinicId}` : "Chưa có"}</dd>
                    </div>
                    <div>
                      <dt>Cập nhật</dt>
                      <dd>{formatSummaryDate(appointment.updatedAt || appointment.createdAt)}</dd>
                    </div>
                  </dl>

                  {appointment.cancelReason ? (
                    <div className="inline-note">
                      <strong>Lý do huỷ:</strong> {appointment.cancelReason}
                    </div>
                  ) : null}

                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button--primary button--compact"
                      disabled={savingId === appointment.appointmentId || appointment.status === "CANCELLED"}
                      onClick={() => setRescheduleTarget(appointment)}
                    >
                      Dời lịch
                    </button>
                    <button
                      type="button"
                      className="button button--ghost button--compact"
                      disabled={savingId === appointment.appointmentId || appointment.status === "CANCELLED"}
                      onClick={() => setCancelTarget(appointment)}
                    >
                      Huỷ lịch
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Chưa có lịch hẹn phù hợp</h2>
              <p>Thử đổi bộ lọc hoặc bỏ giới hạn lịch hẹn sắp tới để xem thêm dữ liệu.</p>
            </div>
          )}
        </div>
      </section>

      {rescheduleTarget ? (
        <div className="doctor-appointment-modal-overlay" role="presentation" onClick={() => setRescheduleTarget(null)}>
          <div className="doctor-appointment-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="doctor-appointment-modal-card__header">
              <div>
                <span className="eyebrow">Dời lịch</span>
                <h2>{rescheduleTarget.contactName}</h2>
              </div>
              <button type="button" className="button button--ghost button--compact" onClick={() => setRescheduleTarget(null)}>
                Đóng
              </button>
            </div>

            <form className="auth-form" onSubmit={handleRescheduleSubmit}>
              <label className="field">
                <span>Ngày giờ mới</span>
                <input
                  type="datetime-local"
                  value={rescheduleDateTime}
                  onChange={(event) => setRescheduleDateTime(event.target.value)}
                  required
                />
              </label>

              {rescheduleError ? <div className="error-message">{rescheduleError}</div> : null}

              <div className="inline-actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingId === rescheduleTarget.appointmentId}
                >
                  {savingId === rescheduleTarget.appointmentId ? "Đang lưu..." : "Cập nhật lịch"}
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setRescheduleTarget(null)}
                >
                  Huỷ
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {cancelTarget ? (
        <div className="doctor-appointment-modal-overlay" role="presentation" onClick={() => setCancelTarget(null)}>
          <div className="doctor-appointment-modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="doctor-appointment-modal-card__header">
              <div>
                <span className="eyebrow">Huỷ lịch</span>
                <h2>{cancelTarget.contactName}</h2>
              </div>
              <button type="button" className="button button--ghost button--compact" onClick={() => setCancelTarget(null)}>
                Đóng
              </button>
            </div>

            <form className="auth-form" onSubmit={handleCancelSubmit}>
              <label className="field">
                <span>Lý do huỷ</span>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Nhập lý do huỷ lịch nếu cần"
                />
              </label>

              {cancelError ? <div className="error-message">{cancelError}</div> : null}

              <div className="inline-actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={savingId === cancelTarget.appointmentId}
                >
                  {savingId === cancelTarget.appointmentId ? "Đang lưu..." : "Xác nhận huỷ"}
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => setCancelTarget(null)}
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default DoctorAppointmentsPage;