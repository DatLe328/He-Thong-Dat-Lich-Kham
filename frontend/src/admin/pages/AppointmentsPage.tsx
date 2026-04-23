import { useState } from "react";

const danhSachLichHen = [
  {
    id: 1,
    benhNhan: "Nguyễn Văn C",
    bacSi: "Nguyễn Văn A",
    ngay: "2026-04-25",
    gio: "09:00",
    trangThai: "Đã xác nhận",
  },
  {
    id: 2,
    benhNhan: "Trần Thị D",
    bacSi: "Trần Thị B",
    ngay: "2026-04-26",
    gio: "14:00",
    trangThai: "Chờ xác nhận",
  },
  {
    id: 3,
    benhNhan: "Lê Văn E",
    bacSi: "Nguyễn Văn A",
    ngay: "2026-04-25",
    gio: "10:00",
    trangThai: "Chờ xác nhận",
  },
];

export default function AppointmentsPage() {
  const [ngay, setNgay] = useState("");
  const [trangThai, setTrangThai] = useState("");

  const dataFiltered = danhSachLichHen.filter((item) => {
    const matchNgay = ngay ? item.ngay === ngay : true;
    const matchTrangThai = trangThai ? item.trangThai === trangThai : true;
    return matchNgay && matchTrangThai;
  });

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
            <option value="">Tất cả trạng thái</option>
            <option value="Đã xác nhận">Đã xác nhận</option>
            <option value="Chờ xác nhận">Chờ xác nhận</option>
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
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Bệnh nhân</th>
              <th>Bác sĩ</th>
              <th>Ngày</th>
              <th>Giờ</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {dataFiltered.map((lh) => (
              <tr key={lh.id}>
                <td>{lh.id}</td>
                <td>{lh.benhNhan}</td>
                <td>{lh.bacSi}</td>
                <td>{lh.ngay}</td>
                <td>{lh.gio}</td>
                <td>
                  <span
                    className={
                      lh.trangThai === "Đã xác nhận"
                        ? "status status-ok"
                        : "status status-wait"
                    }
                  >
                    {lh.trangThai}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn">Duyệt</button>
                    <button className="btn btn-danger">Hủy</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {dataFiltered.length === 0 && (
          <p style={{ marginTop: 10 }}>Không có dữ liệu</p>
        )}
      </div>
    </div>
  );
}