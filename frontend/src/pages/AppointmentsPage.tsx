import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { Appointment, AppointmentStatus } from "../types";
import { getAppointmentPresentation, sortAppointmentsByDate } from "../utils/clinic";

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Đã hoàn tất",
  cancelled: "Đã hủy",
};

function formatAppointmentDate(dateValue: string, hour: string) {
  const date = new Date(dateValue);

  return `${new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)} • ${hour}`;
}

function AppointmentsPage() {
  const { user } = useAuth();
  const { appointments, updateAppointmentStatus } = useClinic();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("all");

  const activeTab = searchParams.get("tab") === "manage" ? "manage" : "my";
  const myAppointments = user
    ? sortAppointmentsByDate(
        appointments.filter((appointment) => appointment.patientId === user.id)
      )
    : [];
  const managedAppointments = sortAppointmentsByDate(appointments);

  const filteredManagedAppointments = managedAppointments.filter((appointment) => {
    return statusFilter === "all" || appointment.status === statusFilter;
  });

  const renderAppointmentCard = (
    appointment: Appointment,
    mode: "my" | "manage"
  ) => {
    const appointmentView = getAppointmentPresentation(appointment);

    return (
      <article key={appointment.appointmentId} className="appointment-card">
        <div className="appointment-card__header">
          <div>
            <span className={`status-badge status-badge--${appointmentView.status}`}>
              {appointmentStatusLabels[appointmentView.status]}
            </span>
            <h3>{appointmentView.doctorName}</h3>
            <p>
              {appointmentView.specialty} • {appointmentView.clinicName}
            </p>
          </div>
          <strong>
            {formatAppointmentDate(appointmentView.appointmentDate, appointmentView.hour)}
          </strong>
        </div>

        <div className="appointment-card__meta">
          <div>
            <dt>Người khám</dt>
            <dd>{appointmentView.patientName}</dd>
          </div>
          <div>
            <dt>Liên hệ</dt>
            <dd>{appointmentView.patientPhone}</dd>
          </div>
          <div>
            <dt>Nhóm sàng lọc</dt>
            <dd>{appointmentView.symptomGroupLabel}</dd>
          </div>
          <div>
            <dt>Cơ sở khám</dt>
            <dd>{appointmentView.clinicAddress}</dd>
          </div>
        </div>

        <p className="appointment-card__description">{appointmentView.reason}</p>

        {appointmentView.cancelReason ? (
          <div className="inline-note">
            <strong>Lý do hủy:</strong> {appointmentView.cancelReason}
          </div>
        ) : null}

        <div className="appointment-card__actions">
          <Link to={`/doctors/${appointmentView.doctorId}`} className="text-link">
            Xem hồ sơ bác sĩ
          </Link>

          {mode === "my" && appointmentView.status !== "cancelled" ? (
            <button
              type="button"
              className="button button--ghost"
              onClick={() =>
                updateAppointmentStatus(
                  appointmentView.appointmentId,
                  "cancelled",
                  "Bệnh nhân chủ động hủy lịch qua cổng trực tuyến."
                )
              }
            >
              Hủy lịch
            </button>
          ) : null}

          {mode === "manage" && appointmentView.status === "pending" ? (
            <div className="inline-actions">
              <button
                type="button"
                className="button button--dark"
                onClick={() =>
                  updateAppointmentStatus(appointmentView.appointmentId, "confirmed")
                }
              >
                Xác nhận
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={() =>
                  updateAppointmentStatus(
                    appointmentView.appointmentId,
                    "cancelled",
                    "Phòng khám điều chỉnh lịch và đề nghị bệnh nhân chọn khung giờ khác."
                  )
                }
              >
                Từ chối
              </button>
            </div>
          ) : null}

          {mode === "manage" && appointmentView.status === "confirmed" ? (
            <button
              type="button"
              className="button button--primary"
              onClick={() =>
                updateAppointmentStatus(appointmentView.appointmentId, "completed")
              }
            >
              Đánh dấu hoàn tất
            </button>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <div className="page">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow">Quản lý cuộc hẹn</span>
          <h1>Theo dõi và xử lý lịch hẹn khám</h1>
          <p>
            Xem lịch hẹn của bạn, trạng thái xác nhận và quản lý toàn bộ cuộc hẹn
            đang phát sinh tại phòng khám.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="dashboard-tabs">
            <button
              type="button"
              className={`dashboard-tab ${activeTab === "my" ? "is-active" : ""}`}
              onClick={() => setSearchParams({ tab: "my" }, { replace: true })}
            >
              Lịch hẹn của tôi
            </button>
            <button
              type="button"
              className={`dashboard-tab ${activeTab === "manage" ? "is-active" : ""}`}
              onClick={() => setSearchParams({ tab: "manage" }, { replace: true })}
            >
              Quản lý cuộc hẹn
            </button>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <strong>{appointments.filter((item) => item.status === "pending").length}</strong>
              <span>Lịch chờ xác nhận</span>
            </article>
            <article className="stat-card">
              <strong>{appointments.filter((item) => item.status === "confirmed").length}</strong>
              <span>Lịch đã xác nhận</span>
            </article>
            <article className="stat-card">
              <strong>{appointments.filter((item) => item.status === "completed").length}</strong>
              <span>Lịch đã hoàn tất</span>
            </article>
          </div>

          {activeTab === "my" ? (
            user ? (
              myAppointments.length > 0 ? (
                <div className="appointment-list">
                  {myAppointments.map((appointment) =>
                    renderAppointmentCard(appointment, "my")
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <h2>Bạn chưa có lịch hẹn nào</h2>
                  <p>
                    Chọn bác sĩ phù hợp và đặt lịch để theo dõi tất cả cuộc hẹn tại
                    đây.
                  </p>
                  <Link to="/appointments/book" className="button button--primary">
                    Đặt lịch ngay
                  </Link>
                </div>
              )
            ) : (
              <div className="empty-state">
                <h2>Đăng nhập để xem lịch hẹn của bạn</h2>
                <p>Thông tin lịch hẹn cá nhân sẽ được lưu và đồng bộ sau khi đăng nhập.</p>
                <Link to="/auth?tab=login" className="button button--primary">
                  Đăng nhập
                </Link>
              </div>
            )
          ) : (
            <>
              <div className="toolbar-inline">
                <label className="field">
                  <span>Trạng thái</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="pending">Chờ xác nhận</option>
                    <option value="confirmed">Đã xác nhận</option>
                    <option value="completed">Đã hoàn tất</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </label>
              </div>

              <div className="appointment-list">
                {filteredManagedAppointments.map((appointment) =>
                  renderAppointmentCard(appointment, "manage")
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default AppointmentsPage;
