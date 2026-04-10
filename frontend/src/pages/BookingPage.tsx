import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import DoctorAvatar from "../components/DoctorAvatar";
import { useAuth } from "../context/AuthContext";
import { useClinic } from "../context/ClinicContext";
import { doctors } from "../data/doctors";
import { getRecommendedDoctors } from "../utils/clinic";

function BookingPage() {
  const { user } = useAuth();
  const { appointments, scheduleOverrides, createAppointment, getDoctorSchedule } =
    useClinic();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const selectedDoctorId = searchParams.get("doctorId") ?? doctors[0].id;
  const selectedDoctor =
    doctors.find((doctor) => doctor.id === selectedDoctorId) ?? doctors[0];
  const schedule = getDoctorSchedule(selectedDoctor.id);
  const availableDays = schedule.filter((day) => day.availableCount > 0);

  const [patientName, setPatientName] = useState(user?.name ?? "");
  const [patientPhone, setPatientPhone] = useState(user?.phone ?? "");
  const [patientEmail, setPatientEmail] = useState(user?.email ?? "");
  const [symptomDescription, setSymptomDescription] = useState("");
  const [note, setNote] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setPatientName(user?.name ?? "");
    setPatientPhone(user?.phone ?? "");
    setPatientEmail(user?.email ?? "");
  }, [user]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    const selectedDayKey = nextParams.get("day");
    const safeDayKey =
      selectedDayKey && availableDays.some((day) => day.key === selectedDayKey)
        ? selectedDayKey
        : availableDays[0]?.key;

    const availableHours =
      availableDays
        .find((day) => day.key === safeDayKey)
        ?.slots.filter((slot) => slot.status === "available")
        .map((slot) => slot.hour) ?? [];
    const selectedHour = nextParams.get("hour");
    const safeHour =
      selectedHour && availableHours.includes(selectedHour)
        ? selectedHour
        : availableHours[0];

    if (safeDayKey && selectedDayKey !== safeDayKey) {
      nextParams.set("day", safeDayKey);
    }

    if (safeHour && selectedHour !== safeHour) {
      nextParams.set("hour", safeHour);
    }

    const currentSerialized = searchParams.toString();
    const nextSerialized = nextParams.toString();

    if (nextSerialized !== currentSerialized) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [availableDays, searchParams, setSearchParams]);

  const selectedDayKey = searchParams.get("day") ?? availableDays[0]?.key ?? "";
  const selectedDay = schedule.find((day) => day.key === selectedDayKey);
  const selectedHour =
    searchParams.get("hour") ??
    selectedDay?.slots.find((slot) => slot.status === "available")?.hour ??
    "";

  const alternatives = symptomDescription.trim()
    ? getRecommendedDoctors(
        doctors,
        appointments,
        scheduleOverrides,
        symptomDescription,
        "Tất cả chuyên khoa"
      ).recommendations
        .filter((item) => item.doctor.id !== selectedDoctor.id)
        .slice(0, 2)
    : [];

  const handleDoctorChange = (doctorId: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("doctorId", doctorId);
    nextParams.delete("day");
    nextParams.delete("hour");
    setSearchParams(nextParams, { replace: true });
  };

  const handleAppointmentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      if (!user) {
        throw new Error("Bạn cần đăng nhập để xác nhận lịch hẹn.");
      }

      if (!selectedDayKey || !selectedHour) {
        throw new Error("Vui lòng chọn ngày và khung giờ còn trống.");
      }

      const appointment = await createAppointment({
        patientId: user.id,
        patientName,
        patientPhone,
        patientEmail,
        doctorId: selectedDoctor.id,
        dayKey: selectedDayKey,
        hour: selectedHour,
        reason: symptomDescription,
        note,
      });

      navigate(`/appointments?tab=my&focus=${appointment.appointmentId}`, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể xác nhận lịch hẹn."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    const redirect = `/appointments/book?doctorId=${selectedDoctor.id}`;
    const authParams = new URLSearchParams({
      tab: "login",
      redirect,
    });

    return (
      <div className="page">
        <section className="page-banner">
          <div className="container">
            <span className="eyebrow">Đặt lịch khám</span>
            <h1>Đăng nhập để xác nhận lịch hẹn</h1>
            <p>
              Bạn cần đăng nhập trước khi đặt lịch để lưu thông tin khám, nhận xác
              nhận và theo dõi các cuộc hẹn sau này.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="empty-state">
              <h2>Phiên đặt lịch đang chờ đăng nhập</h2>
              <p>
                Sau khi đăng nhập, bạn sẽ quay lại trang đặt lịch để tiếp tục chọn
                bác sĩ và khung giờ phù hợp.
              </p>
              <div className="page-actions">
                <Link to={`/auth?${authParams.toString()}`} className="button button--primary">
                  Đăng nhập để tiếp tục
                </Link>
                <Link to={`/doctors/${selectedDoctor.id}`} className="button button--ghost">
                  Xem lại hồ sơ bác sĩ
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page">
      <section className="page-banner">
        <div className="container">
          <span className="eyebrow">Đặt lịch khám</span>
          <h1>Xác nhận lịch hẹn với bác sĩ phù hợp</h1>
          <p>
            Chọn bác sĩ, khung giờ còn trống và mô tả triệu chứng để hệ thống hỗ trợ
            phân loại trước khi đến khám.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container booking-layout">
          <article className="content-card">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="eyebrow">Thông tin lịch hẹn</span>
                <h2>Điền thông tin đặt khám</h2>
              </div>
            </div>

            <form className="booking-form" onSubmit={handleAppointmentSubmit}>
              <label className="field">
                <span>Chọn bác sĩ</span>
                <select
                  value={selectedDoctor.id}
                  onChange={(event) => handleDoctorChange(event.target.value)}
                >
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialty}
                    </option>
                  ))}
                </select>
              </label>

              <div className="form-grid">
                <label className="field">
                  <span>Ngày khám</span>
                  <select
                    value={selectedDayKey}
                    onChange={(event) => {
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set("day", event.target.value);
                      nextParams.delete("hour");
                      setSearchParams(nextParams, { replace: true });
                    }}
                  >
                    {availableDays.map((day) => (
                      <option key={day.key} value={day.key}>
                        {day.label} • {day.availableCount} giờ trống
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Khung giờ</span>
                  <select
                    value={selectedHour}
                    onChange={(event) => {
                      const nextParams = new URLSearchParams(searchParams);
                      nextParams.set("hour", event.target.value);
                      setSearchParams(nextParams, { replace: true });
                    }}
                  >
                    {selectedDay?.slots
                      .filter((slot) => slot.status === "available")
                      .map((slot) => (
                        <option key={slot.hour} value={slot.hour}>
                          {slot.hour}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <div className="form-grid">
                <label className="field">
                  <span>Họ và tên</span>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(event) => setPatientName(event.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Số điện thoại</span>
                  <input
                    type="tel"
                    value={patientPhone}
                    onChange={(event) => setPatientPhone(event.target.value)}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Email nhận xác nhận</span>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(event) => setPatientEmail(event.target.value)}
                  required
                />
              </label>

              <label className="field">
                <span>Lý do khám</span>
                <textarea
                  value={symptomDescription}
                  onChange={(event) => setSymptomDescription(event.target.value)}
                  rows={5}
                  placeholder="Mô tả ngắn gọn triệu chứng, thời gian xuất hiện và tình trạng hiện tại..."
                  required
                />
              </label>

              <label className="field">
                <span>Ghi chú thêm</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Ví dụ: có kết quả xét nghiệm gần đây, muốn khám buổi sáng..."
                />
              </label>

              {errorMessage ? <div className="error-message">{errorMessage}</div> : null}

              <button
                type="submit"
                className="button button--primary button--block"
                disabled={submitting || availableDays.length === 0}
              >
                {submitting ? "Đang xác nhận lịch hẹn..." : "Xác nhận đặt lịch"}
              </button>
            </form>
          </article>

          <aside className="profile-side">
            <article className="sidebar-card booking-summary-card">
              <div className="doctor-card__header">
                <DoctorAvatar name={selectedDoctor.name} large />
                <div className="doctor-card__meta">
                  <span className="eyebrow">{selectedDoctor.specialty}</span>
                  <h3>{selectedDoctor.name}</h3>
                  <p>{selectedDoctor.title}</p>
                </div>
              </div>

              <dl className="info-list">
                <div>
                  <dt>Cơ sở khám</dt>
                  <dd>{selectedDoctor.clinic}</dd>
                </div>
                <div>
                  <dt>Địa chỉ phòng khám</dt>
                  <dd>{selectedDoctor.location}</dd>
                </div>
                <div>
                  <dt>Số điện thoại</dt>
                  <dd>{selectedDoctor.clinicPhone}</dd>
                </div>
                <div>
                  <dt>Khung giờ đang chọn</dt>
                  <dd>
                    {selectedDay ? `${selectedDay.label} - ${selectedHour}` : "Chưa chọn"}
                  </dd>
                </div>
              </dl>

              <Link to={`/doctors/${selectedDoctor.id}`} className="text-link">
                Xem lại hồ sơ bác sĩ
              </Link>
            </article>

            {symptomDescription.trim() ? (
              <article className="sidebar-card">
                <span className="eyebrow">Phân loại triệu chứng</span>
                <h3>
                  {
                    getRecommendedDoctors(
                      doctors,
                      appointments,
                      scheduleOverrides,
                      symptomDescription,
                      "Tất cả chuyên khoa"
                    ).classification.groupLabel
                  }
                </h3>
                <p>
                  {
                    getRecommendedDoctors(
                      doctors,
                      appointments,
                      scheduleOverrides,
                      symptomDescription,
                      "Tất cả chuyên khoa"
                    ).classification.carePath
                  }
                </p>
              </article>
            ) : null}

            {alternatives.length > 0 ? (
              <article className="sidebar-card">
                <span className="eyebrow">Gợi ý thêm</span>
                <h3>Bác sĩ khác phù hợp với mô tả hiện tại</h3>
                <div className="mini-list">
                  {alternatives.map((item) => (
                    <div key={item.doctor.id} className="mini-list__item">
                      <div>
                        <strong>{item.doctor.name}</strong>
                        <p>
                          {item.doctor.specialty} • {item.doctor.clinic}
                        </p>
                      </div>
                      <Link
                        to={`/appointments/book?doctorId=${item.doctor.id}`}
                        className="text-link"
                      >
                        Chọn bác sĩ
                      </Link>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </aside>
        </div>
      </section>
    </div>
  );
}

export default BookingPage;
