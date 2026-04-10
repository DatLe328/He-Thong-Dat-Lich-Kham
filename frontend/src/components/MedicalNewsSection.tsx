import { medicalNews } from "../data/site";

function MedicalNewsSection() {
  return (
    <section className="section section--muted">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tin tức y tế</span>
            <h2>Cập nhật kiến thức sức khỏe mỗi ngày</h2>
          </div>
        </div>

        <div className="news-grid">
          {medicalNews.map((item) => (
            <article key={item.id} className="news-card">
              <div className={`news-card__cover news-card__cover--${item.tone}`}>
                <span className="news-card__badge">{item.category}</span>
                <strong>{item.title}</strong>
              </div>

              <div className="news-card__content">
                <div className="news-card__meta">
                  <span>{item.date}</span>
                  <span>{item.readTime}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MedicalNewsSection;
