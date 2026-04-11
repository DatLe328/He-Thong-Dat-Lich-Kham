type DoctorAvatarProps = {
  name: string;
  large?: boolean;
};

function getInitials(name: string) {
  const words = name
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return words.slice(0, 2).map((item) => item[0]?.toUpperCase()).join("") || "BS";
}

function DoctorAvatar({ name, large = false }: DoctorAvatarProps) {
  return (
    <div className={`doctor-avatar ${large ? "doctor-avatar--large" : ""}`}>
      <span>{getInitials(name)}</span>
    </div>
  );
}

export default DoctorAvatar;
