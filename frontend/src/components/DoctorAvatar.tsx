import femaleDoctorImage from "../assets/female.jpg";
import maleDoctorImage from "../assets/male.jpg";

type DoctorAvatarProps = {
  name: string;
  large?: boolean;
};

const femaleDoctorNames = [
  "Lê Thảo Nguyên",
  "Nguyễn Thu Hà",
  "Võ Khánh Linh"
];

function getDoctorImage(name: string) {
  return femaleDoctorNames.some((doctorName) => name.includes(doctorName))
    ? femaleDoctorImage
    : maleDoctorImage;
}

function DoctorAvatar({ name, large = false }: DoctorAvatarProps) {
  return (
    <div className={`doctor-avatar ${large ? "doctor-avatar--large" : ""}`}>
      <img
        src={getDoctorImage(name)}
        alt={`Ảnh bác sĩ ${name}`}
        className="doctor-avatar__image"
        loading="lazy"
      />
    </div>
  );
}

export default DoctorAvatar;
