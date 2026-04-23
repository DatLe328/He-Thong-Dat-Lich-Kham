import { useState } from "react";

const danhSachBacSi = [
  {
    id: 1,
    ten: "Nguyễn Văn A",
    chuyenKhoa: "Tim mạch",
    danhGia: 4.8,
  },
  {
    id: 2,
    ten: "Trần Thị B",
    chuyenKhoa: "Da liễu",
    danhGia: 4.5,
  },
];

export default function DoctorsPage() {
  const [data] = useState(danhSachBacSi);

  return (
    <div>
      <h2>Quản lý bác sĩ</h2>

      <div className="card table-wrapper">
        <div style={{ marginBottom: 12 }}>
          <button className="btn">+ Thêm bác sĩ</button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên</th>
              <th>Chuyên khoa</th>
              <th>Đánh giá</th>
              <th>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {data.map((bs) => (
              <tr key={bs.id}>
                <td>{bs.id}</td>
                <td>{bs.ten}</td>
                <td>{bs.chuyenKhoa}</td>
                <td>{bs.danhGia}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn">Sửa</button>
                    <button className="btn btn-danger">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}