import { useEffect, useState } from "react";
import "../../styles/admin.css";

export default function StatisticsPage() {
  const [overview, setOverview] = useState<any>({});
  const [status, setStatus] = useState<any[]>([]);
  const [daily, setDaily] = useState<any[]>([]);
  const [topDoctors, setTopDoctors] = useState<any[]>([]);
  const [topClinics, setTopClinics] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= SAFE FETCH =================
  const safeFetch = async (url: string) => {
    try {
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();

      if (!res.ok || data?.success === false) return null;
      return data.data;
    } catch {
      return null;
    }
  };

  // ================= LOAD =================
  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const [ov, st, dy, doc, cli] = await Promise.all([
        safeFetch("/api/statistics/overview"),
        safeFetch("/api/statistics/appointments/status"),
        safeFetch("/api/statistics/appointments/daily"),
        safeFetch("/api/statistics/doctors/top?limit=5"),
        safeFetch("/api/statistics/clinics/top?limit=5"),
      ]);

      setOverview(ov || {});
      setStatus(st || []);
      setDaily(dy || []);
      setTopDoctors(doc || []);
      setTopClinics(cli || []);
    } catch {
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="content">
      <h2>🏥 Hospital Admin Dashboard</h2>

      {error && <div className="error">❌ {error}</div>}
      {loading && <p>⏳ Đang tải dữ liệu...</p>}

      {/* ================= KPI ================= */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <h4>Tổng lịch hẹn</h4>
          <p>{overview.totalAppointments ?? 0}</p>
        </div>

        <div className="stat-card success">
          <h4>Hôm nay</h4>
          <p>{overview.todayAppointments ?? 0}</p>
        </div>

        <div className="stat-card warning">
          <h4>Sắp tới</h4>
          <p>{overview.upcomingAppointments ?? 0}</p>
        </div>

        <div className="stat-card info">
          <h4>Bác sĩ</h4>
          <p>{overview.totalDoctors ?? 0}</p>
        </div>

        <div className="stat-card info">
          <h4>Phòng khám</h4>
          <p>{overview.totalClinics ?? 0}</p>
        </div>

        <div className="stat-card danger">
          <h4>Bệnh nhân</h4>
          <p>{overview.totalPatients ?? 0}</p>
        </div>
      </div>

      {/* ================= PATIENT TYPE ================= */}
      <div className="card">
        <h3>📊 Phân loại bệnh nhân</h3>

        <div className="stats-row">
          <div className="mini-box">
            <p>Đăng ký (có tài khoản)</p>
            <h2>{overview.registeredAppointments ?? 0}</h2>
          </div>

          <div className="mini-box">
            <p>Vãng lai (không tài khoản)</p>
            <h2>{overview.guestAppointments ?? 0}</h2>
          </div>

          <div className="mini-box">
            <p>Bệnh nhân có lịch hẹn</p>
            <h2>{overview.uniquePatients ?? 0}</h2>
          </div>
        </div>
      </div>

      {/* ================= STATUS ================= */}
      <div className="card">
        <h3>📈 Trạng thái lịch hẹn</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Trạng thái</th>
              <th>Số lượng</th>
            </tr>
          </thead>
        <tbody>
              {status && Object.keys(status).length > 0 ? (
                Object.entries(status).map(([key, value], i) => {

                  let cssClass = "status-wait";

                  if (key === "CONFIRMED" || key === "COMPLETED") {
                    cssClass = "status-ok";
                  } else if (key === "PENDING") {
                    cssClass = "status-wait";
                  } else if (key === "CANCELLED") {
                    cssClass = "status-cancel";
                  }

                  return (
                    <tr key={i}>
                      <td>
                        <span className={`status ${cssClass}`}>
                          {key}
                        </span>
                      </td>
                      <td><b>{value as number}</b></td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={2}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
        </table>
      </div>


      <div className="card">
        <h3>📅 Lịch theo ngày</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Số lượng</th>
            </tr>
          </thead>
          <tbody>
           {daily.length > 0 ? (
              [...daily]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((d, i) => (
                  <tr key={i}>
                    <td>{d.date}</td>
                    <td>{d.total ?? d.count}</td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={2}>Không có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= TOP DOCTORS ================= */}
      <div className="card">
        <h3>👨‍⚕️ Top bác sĩ</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Bác sĩ</th>
              <th>Lịch hẹn</th>
            </tr>
          </thead>
          <tbody>
            {topDoctors.length > 0 ? (
              topDoctors.map((d, i) => (
                <tr key={i}>
                  <td>{d.doctorName}</td>
                  <td>{d.totalAppointments}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>Không có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ================= TOP CLINICS ================= */}
      <div className="card">
        <h3>🏥 Top phòng khám</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Phòng khám</th>
              <th>Lịch hẹn</th>
            </tr>
          </thead>
          <tbody>
            {topClinics.length > 0 ? (
              topClinics.map((c, i) => (
                <tr key={i}>
                  <td>{c.clinicName}</td>
                  <td>{c.totalAppointments}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2}>Không có dữ liệu</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}