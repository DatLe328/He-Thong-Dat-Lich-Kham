import { Link } from "react-router-dom";
import { Doctor } from "../types";
import DoctorAvatar from "./DoctorAvatar";

function DoctorCard({ doctor }: { doctor: Doctor }) {
  return (
    <article className="doctor-card">
      <div className="doctor-card__header">
        <DoctorAvatar name={doctor.name} />
        <div className="doctor-card__meta">
          <span className="eyebrow">{doctor.specialty}</span>
          <h3>{doctor.name}</h3>
          <p>{doctor.title}</p>
        </div>
      </div>

      <div className="doctor-card__stats">
        <span>{doctor.rating}/5 đánh giá</span>
        <span>{doctor.experienceYears} năm kinh nghiệm</span>
      </div>

      <p className="doctor-card__summary">{doctor.bio}</p>

      <div className="tag-row">
        {doctor.specialties.map((item) => (
          <span key={item} className="tag">
            {item}
          </span>
        ))}
      </div>

      <dl className="info-list">
        <div>
          <dt>Cơ sở</dt>
          <dd>{doctor.clinic}</dd>
        </div>
        <div>
          <dt>Giấy phép hành nghề</dt>
          <dd>{doctor.licenseNumber}</dd>
        </div>
        <div>
          <dt>Lịch gần nhất</dt>
          <dd>{doctor.nextAvailable}</dd>
        </div>
      </dl>

      <Link
        to={`/doctors/${doctor.id}`}
        className="button button--primary button--block button--still"
      >
        Xem hồ sơ và lịch làm việc
      </Link>
    </article>
  );
}

export default DoctorCard;
