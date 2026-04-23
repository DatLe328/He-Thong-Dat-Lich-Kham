export default function Dashboard() {
  return (
    <div>
      <h2>Trang tổng quan</h2>

      <div className="dashboard-grid">
        <div className="card metric">
          <strong>120</strong>
          <span>Người dùng</span>
        </div>

        <div className="card metric">
          <strong>25</strong>
          <span>Bác sĩ</span>
        </div>

        <div className="card metric">
          <strong>300</strong>
          <span>Lịch hẹn</span>
        </div>

        <div className="card metric">
          <strong>4.8</strong>
          <span>Đánh giá trung bình</span>
        </div>
      </div>
    </div>
  );
}