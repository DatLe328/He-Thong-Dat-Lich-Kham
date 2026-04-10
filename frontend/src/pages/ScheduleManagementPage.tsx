import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useClinic } from "../context/ClinicContext";
import { doctors } from "../data/doctors";

function ScheduleManagementPage() {
  const {
    appointments,
    addCustomSlot,
    blockSlot,
    getDoctorSchedule,
    removeCustomSlot,
    unblockSlot,
  } = useClinic();
  const [searchParams, setSearchParams] = useSearchParams();
  const [slotDrafts, setSlotDrafts] = useState<Record<string, string>>({});

  const selectedDoctorId = searchParams.get("doctorId") ?? doctors[0].id;
  const selectedDoctor =
    doctors.find((doctor) => doctor.id === selectedDoctorId) ?? doctors[0];
  const schedule = getDoctorSchedule(selectedDoctor.id);
  const doctorAppointments = appointments.filter(
    (appointment) => appointment.doctorId === selectedDoctor.id
  );

  return (
    <div className="page">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow">Quản lý lịch làm việc</span>
          <h1>Cập nhật thời gian trống của bác sĩ</h1>
          <p>
            Điều chỉnh giờ làm việc, thêm khung giờ mới và theo dõi các slot đã có
            bệnh nhân đặt lịch.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="management-header">
            <label className="field">
              <span>Chọn bác sĩ</span>
              <select
                value={selectedDoctor.id}
                onChange={(event) =>
                  setSearchParams({ doctorId: event.target.value }, { replace: true })
                }
              >
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialty}
                  </option>
                ))}
              </select>
            </label>

            <div className="stats-grid">
              <article className="stat-card">
                <strong>
                  {schedule.reduce((total, day) => total + day.availableCount, 0)}
                </strong>
                <span>Khung giờ còn trống</span>
              </article>
              <article className="stat-card">
                <strong>{doctorAppointments.length}</strong>
                <span>Lịch hẹn đã tạo</span>
              </article>
              <article className="stat-card">
                <strong>{selectedDoctor.specialty}</strong>
                <span>Chuyên khoa đang quản lý</span>
              </article>
            </div>
          </div>

          <div className="schedule-admin-grid">
            {schedule.map((day) => (
              <article key={day.key} className="schedule-admin-card">
                <div className="schedule-admin-card__header">
                  <div>
                    <strong>{day.label}</strong>
                    <p>
                      {day.availableCount} trống • {day.bookedCount} đã đặt •{" "}
                      {day.blockedCount} đang đóng
                    </p>
                  </div>
                  <span className={`status-badge status-badge--${day.status}`}>
                    {day.status === "available"
                      ? "Đang mở lịch"
                      : day.status === "limited"
                        ? "Gần kín"
                        : "Tạm đóng"}
                  </span>
                </div>

                <div className="manage-slot-list">
                  {day.slots.map((slot) => (
                    <div
                      key={`${day.key}-${slot.hour}`}
                      className={`manage-slot manage-slot--${slot.status}`}
                    >
                      <div>
                        <strong>{slot.hour}</strong>
                        <p>
                          {slot.status === "booked"
                            ? `Đã có lịch: ${slot.patientName ?? "Bệnh nhân"}`
                            : slot.status === "blocked"
                              ? "Khung giờ đang tạm khóa"
                              : slot.source === "custom"
                                ? "Khung giờ thêm thủ công"
                                : "Lịch chuẩn đang mở"}
                        </p>
                      </div>

                      <div className="inline-actions">
                        {slot.status === "available" && slot.source === "default" ? (
                          <button
                            type="button"
                            className="button button--ghost"
                            onClick={() => blockSlot(selectedDoctor.id, day.key, slot.hour)}
                          >
                            Tạm đóng
                          </button>
                        ) : null}

                        {slot.status === "available" && slot.source === "custom" ? (
                          <button
                            type="button"
                            className="button button--ghost"
                            onClick={() =>
                              removeCustomSlot(selectedDoctor.id, day.key, slot.hour)
                            }
                          >
                            Xóa slot
                          </button>
                        ) : null}

                        {slot.status === "blocked" ? (
                          <button
                            type="button"
                            className="button button--dark"
                            onClick={() => unblockSlot(selectedDoctor.id, day.key, slot.hour)}
                          >
                            Mở lại
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="schedule-admin-card__footer">
                  <label className="field">
                    <span>Thêm giờ trống mới</span>
                    <input
                      type="time"
                      value={slotDrafts[day.key] ?? ""}
                      onChange={(event) =>
                        setSlotDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [day.key]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => {
                      const draftHour = slotDrafts[day.key];

                      if (!draftHour) {
                        return;
                      }

                      addCustomSlot(selectedDoctor.id, day.key, draftHour);
                      setSlotDrafts((currentDrafts) => ({
                        ...currentDrafts,
                        [day.key]: "",
                      }));
                    }}
                  >
                    Thêm khung giờ
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ScheduleManagementPage;
