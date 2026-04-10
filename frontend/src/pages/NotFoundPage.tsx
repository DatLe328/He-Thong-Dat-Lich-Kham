import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="page">
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h1>404</h1>
            <p>Trang bạn tìm hiện không tồn tại hoặc đã được thay đổi địa chỉ.</p>
            <Link to="/" className="button button--primary">
              Về trang chủ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default NotFoundPage;
