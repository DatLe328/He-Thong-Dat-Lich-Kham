import { Link } from "react-router-dom";
import { DirectoryDoctor } from "../types";
import DoctorAvatar from "./DoctorAvatar";

type DoctorCardProps = {
  doctor: DirectoryDoctor;
  actionTo?: string;
  actionLabel?: string;
};

function DoctorCard({
  doctor,
  actionTo,
  actionLabel = "Xem trong danh sách",
}: DoctorCardProps) {
  return (
    <article className="doctor-card">
      <div className="doctor-card__header">
        <DoctorAvatar name={doctor.name} />
        <div className="doctor-card__meta">
          <span className="eyebrow">{doctor.specialty}</span>
          <h3>{doctor.name}</h3>
          <p>Bác sĩ chuyên khoa</p>
        </div>
      </div>

      <div className="doctor-card__stats">
        <span>{doctor.rating.toFixed(1)}/5 đánh giá</span>
        <span>Mã bác sĩ #{doctor.doctorId}</span>
      </div>

      <p className="doctor-card__summary">{doctor.bio}</p>

      {doctor.specialties.length ? (
        <div className="tag-row">
          {doctor.specialties.map((specialty) => (
            <span key={specialty} className="tag">
              {specialty}
            </span>
          ))}
        </div>
      ) : null}

      <dl className="info-list">
        <div>
          <dt>Email</dt>
          <dd>{doctor.email}</dd>
        </div>
        <div>
          <dt>Số điện thoại</dt>
          <dd>{doctor.phone}</dd>
        </div>
        <div>
          <dt>Giấy phép hành nghề</dt>
          <dd>{doctor.licenseNumber}</dd>
        </div>
      </dl>

      <Link
        to={actionTo ?? "/auth?tab=login"}
        className="button button--primary button--block button--still"
      >
        {actionLabel}
      </Link>
    </article>
  );
}

export default DoctorCard;
