import { useEffect, useState } from "react";
import { patientTestimonials } from "../data/site";

function getVisibleCount(width: number) {
  if (width < 760) {
    return 1;
  }

  if (width < 1140) {
    return 2;
  }

  return 3;
}

function TestimonialsSection() {
  const [visibleCount, setVisibleCount] = useState(3);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getVisibleCount(window.innerWidth));
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);

    return () => {
      window.removeEventListener("resize", updateVisibleCount);
    };
  }, []);

  const visibleTestimonials = Array.from(
    { length: Math.min(visibleCount, patientTestimonials.length) },
    (_, offset) =>
      patientTestimonials[(currentIndex + offset) % patientTestimonials.length]
  );

  const handlePrevious = () => {
    setCurrentIndex((value) =>
      value === 0 ? patientTestimonials.length - 1 : value - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((value) => (value + 1) % patientTestimonials.length);
  };

  return (
    <section className="section">
      <div className="container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cảm nhận khách hàng</span>
            <h2>Bệnh nhân nói gì về trải nghiệm tại phòng khám</h2>
          </div>

          <div className="testimonial-controls">
            <button
              type="button"
              className="carousel-button"
              onClick={handlePrevious}
              aria-label="Xem cảm nhận trước"
            >
              ←
            </button>
            <button
              type="button"
              className="carousel-button"
              onClick={handleNext}
              aria-label="Xem cảm nhận tiếp theo"
            >
              →
            </button>
          </div>
        </div>

        <div className="testimonial-grid">
          {visibleTestimonials.map((item) => (
            <article key={`${item.id}-${currentIndex}`} className="testimonial-card">
              <div
                className="testimonial-card__quote"
                style={{ color: item.accentColor }}
              >
                “
              </div>

              <p>{item.quote}</p>

              <div className="testimonial-card__footer">
                <span
                  className="testimonial-card__avatar"
                  style={{
                    background: `linear-gradient(135deg, ${item.accentColor}, #0f172a)`,
                  }}
                >
                  {item.name.slice(0, 1)}
                </span>
                <div>
                  <strong>{item.name}</strong>
                  <small>{item.role}</small>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="testimonial-dots" aria-label="Danh sách cảm nhận">
          {patientTestimonials.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`testimonial-dot ${index === currentIndex ? "is-active" : ""}`}
              aria-label={`Hiển thị cảm nhận ${index + 1}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;

