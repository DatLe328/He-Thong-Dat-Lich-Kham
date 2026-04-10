import {
  ClinicEntity,
  Doctor,
  DoctorEntity,
  DoctorReview,
  PatientEntity,
  ReviewEntity,
  ScheduleDay,
  ScheduleEntity,
  UserEntity,
} from "../types";

type SchedulePattern = ScheduleDay & {
  slotDuration?: number;
};

const defaultCreatedAt = "2026-01-02T08:00:00.000Z";
const defaultUpdatedAt = "2026-04-07T08:00:00.000Z";

function createUser(
  userId: string,
  firstName: string,
  lastName: string,
  phone: string,
  email: string,
  role: UserEntity["role"],
  gender: string,
  dateOfBirth: string,
  address: string
): UserEntity {
  return {
    userId,
    firstName,
    lastName,
    phone,
    email,
    role,
    gender,
    dateOfBirth,
    address,
    createdAt: defaultCreatedAt,
    updatedAt: defaultUpdatedAt,
  };
}

function createPatientProfile(userId: string, insuranceId: string, bloodType: string): PatientEntity {
  return {
    userId,
    insuranceId,
    bloodType,
  };
}

function addMinutes(time: string, minutesToAdd: number) {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const nextHours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const nextMinutes = (total % 60).toString().padStart(2, "0");

  return `${nextHours}:${nextMinutes}`;
}

function compareTimes(first: string, second: string) {
  const [firstHour, firstMinute] = first.split(":").map(Number);
  const [secondHour, secondMinute] = second.split(":").map(Number);

  return firstHour * 60 + firstMinute - (secondHour * 60 + secondMinute);
}

function getFullName(user: UserEntity) {
  return `${user.firstName} ${user.lastName}`.trim();
}

const clinics: ClinicEntity[] = [
  {
    clinicId: "clinic-medigo-central",
    name: "Phòng khám Medigo Central",
    address: "12 Nguyễn Bỉnh Khiêm, Quận 1, TP. Hồ Chí Minh",
    phone: "028 3822 6868",
    specialties: ["Tim mạch", "Nội tổng quát"],
  },
  {
    clinicId: "clinic-skinlab",
    name: "Phòng khám SkinLab",
    address: "185 Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh",
    phone: "028 3930 1212",
    specialties: ["Da liễu", "Thẩm mỹ da"],
  },
  {
    clinicId: "clinic-airway-care",
    name: "Phòng khám Airway Care",
    address: "42 Xô Viết Nghệ Tĩnh, Quận Bình Thạnh, TP. Hồ Chí Minh",
    phone: "028 3512 8989",
    specialties: ["Tai mũi họng", "Nội tổng quát"],
  },
  {
    clinicId: "clinic-kidcare",
    name: "Phòng khám KidCare",
    address: "77 Nguyễn Thị Thập, Quận 7, TP. Hồ Chí Minh",
    phone: "028 3775 0909",
    specialties: ["Nhi khoa", "Dinh dưỡng trẻ em"],
  },
  {
    clinicId: "clinic-bloom-care",
    name: "Phòng khám Bloom Care",
    address: "58 Thành Thái, Quận 10, TP. Hồ Chí Minh",
    phone: "028 3865 3232",
    specialties: ["Sản phụ khoa", "Tư vấn tiền hôn nhân"],
  },
  {
    clinicId: "clinic-prime-health",
    name: "Phòng khám Prime Health",
    address: "26 Võ Văn Ngân, Thủ Đức, TP. Hồ Chí Minh",
    phone: "028 3722 6161",
    specialties: ["Nội tổng quát", "Nội tiết"],
  },
];

const doctorUsers: UserEntity[] = [
  createUser(
    "tran-minh-an",
    "Trần Minh",
    "An",
    "0903123456",
    "tranminhan@medigoclinic.vn",
    "doctor",
    "Nam",
    "1982-06-14",
    "Quận 1, TP. Hồ Chí Minh"
  ),
  createUser(
    "le-thao-nguyen",
    "Lê Thảo",
    "Nguyên",
    "0908456123",
    "lethaonguyen@medigoclinic.vn",
    "doctor",
    "Nữ",
    "1987-11-02",
    "Quận 3, TP. Hồ Chí Minh"
  ),
  createUser(
    "pham-hoang-vu",
    "Phạm Hoàng",
    "Vũ",
    "0907765123",
    "phamhoangvu@medigoclinic.vn",
    "doctor",
    "Nam",
    "1985-01-25",
    "Quận Bình Thạnh, TP. Hồ Chí Minh"
  ),
  createUser(
    "nguyen-thu-ha",
    "Nguyễn Thu",
    "Hà",
    "0903888777",
    "nguyenthuha@medigoclinic.vn",
    "doctor",
    "Nữ",
    "1986-09-19",
    "Quận 7, TP. Hồ Chí Minh"
  ),
  createUser(
    "vo-khanh-linh",
    "Võ Khánh",
    "Linh",
    "0909555777",
    "vokhanhlinh@medigoclinic.vn",
    "doctor",
    "Nữ",
    "1989-04-10",
    "Quận 10, TP. Hồ Chí Minh"
  ),
  createUser(
    "do-gia-hung",
    "Đỗ Gia",
    "Hưng",
    "0908222666",
    "dogiahung@medigoclinic.vn",
    "doctor",
    "Nam",
    "1981-12-08",
    "Thủ Đức, TP. Hồ Chí Minh"
  ),
];

const doctorProfiles: DoctorEntity[] = [
  {
    userId: "tran-minh-an",
    title: "TS.BS",
    specialization: "Tim mạch",
    clinicId: "clinic-medigo-central",
    licenseNumber: "GP-BS-TM-0218",
    bio: "Theo dõi các vấn đề liên quan đến tăng huyết áp, rối loạn nhịp tim và tư vấn phòng ngừa bệnh tim mạch cho người trẻ và trung niên.",
    rating: 4.9,
    experienceYears: 14,
    accentColor: "#0f766e",
    specialties: ["Tim mạch", "Nội tổng quát"],
    aboutBullets: [
      "Thăm khám, đọc kết quả xét nghiệm và đánh giá nguy cơ tim mạch theo từng nhóm tuổi.",
      "Tư vấn kế hoạch theo dõi dài hạn cho bệnh nhân huyết áp, mỡ máu và tiền đái tháo đường.",
      "Làm việc theo mô hình tiếp nhận nhanh, ưu tiên ca sáng cho bệnh nhân cần tái khám.",
    ],
    education: [
      "Tiến sĩ Y khoa - Đại học Y Dược TP. Hồ Chí Minh",
      "Chuyên khoa I Nội tim mạch",
      "Chứng chỉ Siêu âm tim nâng cao",
    ],
    certificates: [
      "Hội Tim mạch Việt Nam",
      "Chứng chỉ Quản lý bệnh mạn tính",
    ],
    languages: ["Tiếng Việt", "Tiếng Anh"],
    symptomFocus: ["Đau ngực", "Khó thở", "Tim đập nhanh", "Tăng huyết áp", "Chóng mặt"],
    services: [
      "Khám tim mạch tổng quát",
      "Tư vấn kết quả điện tim",
      "Theo dõi huyết áp tại nhà",
    ],
  },
  {
    userId: "le-thao-nguyen",
    title: "BSCKI",
    specialization: "Da liễu",
    clinicId: "clinic-skinlab",
    licenseNumber: "GP-BS-DL-0315",
    bio: "Chuyên khám mụn, viêm da, dị ứng da và chăm sóc da cho học sinh, sinh viên và nhân viên văn phòng.",
    rating: 4.8,
    experienceYears: 10,
    accentColor: "#ea580c",
    specialties: ["Da liễu", "Thẩm mỹ da"],
    aboutBullets: [
      "Tập trung phác đồ điều trị mụn và viêm da theo mức độ và tiền sử bệnh.",
      "Theo dõi tiến trình tái khám hàng tháng cho bệnh nhân điều trị lâu dài.",
      "Tư vấn kết hợp thói quen sinh hoạt và dược mỹ phẩm phù hợp.",
    ],
    education: [
      "Bác sĩ Chuyên khoa I Da liễu",
      "Chứng chỉ Laser và sàng lọc tổn thương da",
    ],
    certificates: [
      "Hội Da liễu TP. Hồ Chí Minh",
      "Đào tạo chăm sóc da nhạy cảm",
    ],
    languages: ["Tiếng Việt", "Tiếng Anh"],
    symptomFocus: ["Mụn viêm", "Dị ứng da", "Nổi mề đay", "Nấm da", "Thâm mụn"],
    services: [
      "Khám da liễu tổng quát",
      "Tư vấn phác đồ trị mụn",
      "Theo dõi da nhạy cảm",
    ],
  },
  {
    userId: "pham-hoang-vu",
    title: "ThS.BS",
    specialization: "Tai mũi họng",
    clinicId: "clinic-airway-care",
    licenseNumber: "GP-BS-TMH-0142",
    bio: "Hỗ trợ bệnh nhân viêm xoang, đau họng kéo dài, viêm amidan và các vấn đề hô hấp trên theo mùa.",
    rating: 4.7,
    experienceYears: 11,
    accentColor: "#1d4ed8",
    specialties: ["Tai mũi họng", "Nội tổng quát"],
    aboutBullets: [
      "Phân loại tình trạng viêm cấp và mạn tính để định hướng điều trị hợp lý.",
      "Theo dõi nhóm bệnh nhân trẻ em và người hay tái phát viêm mũi dị ứng.",
      "Có lịch khám buổi chiều phù hợp với người đi làm.",
    ],
    education: [
      "Thạc sĩ Y học lâm sàng",
      "Đào tạo Nội soi Tai Mũi Họng cơ bản",
    ],
    certificates: [
      "Hội Tai Mũi Họng Việt Nam",
      "Chứng chỉ hướng dẫn chăm sóc đường thở",
    ],
    languages: ["Tiếng Việt"],
    symptomFocus: ["Đau họng", "Nghẹt mũi", "Viêm xoang", "Ho kéo dài", "Ù tai"],
    services: [
      "Khám Tai Mũi Họng tổng quát",
      "Tư vấn điều trị viêm xoang",
      "Theo dõi sau đợt nhiễm trùng",
    ],
  },
  {
    userId: "nguyen-thu-ha",
    title: "BS",
    specialization: "Nhi khoa",
    clinicId: "clinic-kidcare",
    licenseNumber: "GP-BS-NK-0247",
    bio: "Đồng hành cùng phụ huynh trong các vấn đề sốt, ho, biếng ăn, chậm tăng cân và theo dõi sức khỏe định kỳ cho trẻ.",
    rating: 4.9,
    experienceYears: 12,
    accentColor: "#c026d3",
    specialties: ["Nhi khoa", "Dinh dưỡng trẻ em"],
    aboutBullets: [
      "Tư vấn theo từng độ tuổi và nhắc lịch tái khám cho trẻ có bệnh nền.",
      "Có kinh nghiệm tiếp nhận trẻ nhỏ lần đầu đi khám trong môi trường thân thiện.",
      "Kết hợp tư vấn dinh dưỡng và hoạt động sinh hoạt phù hợp cho gia đình.",
    ],
    education: [
      "Bác sĩ Đa khoa - Đại học Y khoa Phạm Ngọc Thạch",
      "Đào tạo Nhi khoa cơ bản",
      "Chứng chỉ Dinh dưỡng trẻ em",
    ],
    certificates: [
      "Hội Nhi khoa Việt Nam",
      "Chứng chỉ Tư vấn chăm sóc trẻ sơ sinh",
    ],
    languages: ["Tiếng Việt", "Tiếng Anh"],
    symptomFocus: ["Trẻ sốt", "Trẻ biếng ăn", "Ho ở trẻ", "Rối loạn tiêu hóa", "Chậm tăng cân"],
    services: [
      "Khám nhi tổng quát",
      "Tư vấn dinh dưỡng trẻ em",
      "Theo dõi phát triển theo tháng",
    ],
  },
  {
    userId: "vo-khanh-linh",
    title: "BSCKI",
    specialization: "Sản phụ khoa",
    clinicId: "clinic-bloom-care",
    licenseNumber: "GP-BS-SPK-0119",
    bio: "Khám và tư vấn các vấn đề sức khỏe phụ nữ, rong kinh, đau bụng kinh, viêm phụ khoa và theo dõi tiền thai sớm.",
    rating: 4.8,
    experienceYears: 9,
    accentColor: "#db2777",
    specialties: ["Sản phụ khoa", "Tư vấn tiền hôn nhân"],
    aboutBullets: [
      "Khuyến khích tư vấn sớm để chọn đúng chuyên khoa và hướng theo dõi phù hợp.",
      "Có kinh nghiệm tiếp nhận bệnh nhân lần đầu đi khám phụ khoa, cần sự riêng tư và nhẹ nhàng.",
      "Lịch tối muộn trong tuần phù hợp với người đi làm.",
    ],
    education: [
      "Chuyên khoa I Sản phụ khoa",
      "Đào tạo Siêu âm sản phụ khoa",
    ],
    certificates: [
      "Hội Sản phụ khoa TP. Hồ Chí Minh",
      "Tư vấn sức khỏe sinh sản",
    ],
    languages: ["Tiếng Việt", "Tiếng Anh"],
    symptomFocus: ["Đau bụng kinh", "Rối loạn kinh nguyệt", "Viêm phụ khoa", "Theo dõi thai sớm", "Khám tiền hôn nhân"],
    services: [
      "Khám phụ khoa tổng quát",
      "Tư vấn sức khỏe sinh sản",
      "Theo dõi thai kỳ sớm",
    ],
  },
  {
    userId: "do-gia-hung",
    title: "ThS.BS",
    specialization: "Nội tổng quát",
    clinicId: "clinic-prime-health",
    licenseNumber: "GP-BS-NTQ-0188",
    bio: "Phù hợp cho người cần khám tổng quát ban đầu, đánh giá triệu chứng chưa rõ chuyên khoa hoặc cần tư vấn định hướng khám tiếp theo.",
    rating: 4.6,
    experienceYears: 13,
    accentColor: "#7c3aed",
    specialties: ["Nội tổng quát", "Nội tiết"],
    aboutBullets: [
      "Tập trung khám sàng lọc và định hướng chuyên khoa ban đầu.",
      "Thích hợp cho người có triệu chứng mệt mỏi, sốt, ho, đau đầu hoặc rối loạn tiêu hóa nhẹ.",
      "Có kinh nghiệm đọc kết quả xét nghiệm và tư vấn bước theo dõi tiếp theo.",
    ],
    education: [
      "Thạc sĩ Nội khoa",
      "Đào tạo Quản lý bệnh nội tiết cơ bản",
    ],
    certificates: [
      "Hội Nội khoa Việt Nam",
      "Chứng chỉ Quản lý đái tháo đường",
    ],
    languages: ["Tiếng Việt"],
    symptomFocus: ["Mệt mỏi", "Sốt", "Đau đầu", "Rối loạn tiêu hóa", "Cần sàng lọc tổng quát"],
    services: [
      "Khám tổng quát ban đầu",
      "Tư vấn định hướng chuyên khoa",
      "Đánh giá kết quả xét nghiệm",
    ],
  },
];

const schedulePatterns: Record<string, SchedulePattern[]> = {
  "tran-minh-an": [
    { key: "mon", label: "Thứ 2", hours: ["08:00", "09:30", "14:00"], status: "available" },
    { key: "tue", label: "Thứ 3", hours: ["09:00", "10:30", "15:30"], status: "available" },
    { key: "wed", label: "Thứ 4", hours: ["08:30", "13:30"], status: "limited", note: "Chỉ nhận tái khám" },
    { key: "thu", label: "Thứ 5", hours: ["09:00", "11:00", "16:00"], status: "available" },
    { key: "fri", label: "Thứ 6", hours: ["08:00", "10:00"], status: "limited" },
    { key: "sat", label: "Thứ 7", hours: ["08:30", "09:30"], status: "limited", note: "Lịch cuối tuần" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Nghỉ" },
  ],
  "le-thao-nguyen": [
    { key: "mon", label: "Thứ 2", hours: ["14:00", "15:00", "19:00"], status: "available" },
    { key: "tue", label: "Thứ 3", hours: ["09:00", "10:00"], status: "limited" },
    { key: "wed", label: "Thứ 4", hours: ["14:30", "16:00", "18:30"], status: "available" },
    { key: "thu", label: "Thứ 5", hours: ["09:30", "11:00"], status: "limited" },
    { key: "fri", label: "Thứ 6", hours: ["14:00", "15:30", "17:00"], status: "available" },
    { key: "sat", label: "Thứ 7", hours: ["08:30", "10:00"], status: "limited" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Chỉ tư vấn trực tuyến" },
  ],
  "pham-hoang-vu": [
    { key: "mon", label: "Thứ 2", hours: ["13:30", "15:00"], status: "limited" },
    { key: "tue", label: "Thứ 3", hours: ["13:30", "16:30"], status: "available" },
    { key: "wed", label: "Thứ 4", hours: ["13:30", "15:00", "17:30"], status: "available" },
    { key: "thu", label: "Thứ 5", hours: ["13:00", "14:30"], status: "limited" },
    { key: "fri", label: "Thứ 6", hours: ["13:30", "16:00"], status: "available" },
    { key: "sat", label: "Thứ 7", hours: ["09:00"], status: "limited" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Nghỉ" },
  ],
  "nguyen-thu-ha": [
    { key: "mon", label: "Thứ 2", hours: ["08:30", "10:00", "15:00"], status: "available" },
    { key: "tue", label: "Thứ 3", hours: ["08:30", "10:00"], status: "limited" },
    { key: "wed", label: "Thứ 4", hours: ["08:30", "09:30", "14:00"], status: "available" },
    { key: "thu", label: "Thứ 5", hours: ["10:00", "15:30", "17:00"], status: "available" },
    { key: "fri", label: "Thứ 6", hours: ["08:30", "14:00"], status: "limited" },
    { key: "sat", label: "Thứ 7", hours: ["09:00", "10:30"], status: "limited", note: "Ưu tiên trẻ tái khám" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Nghỉ" },
  ],
  "vo-khanh-linh": [
    { key: "mon", label: "Thứ 2", hours: ["17:00"], status: "limited" },
    { key: "tue", label: "Thứ 3", hours: ["16:30", "18:00"], status: "available" },
    { key: "wed", label: "Thứ 4", hours: ["16:30", "18:30"], status: "available" },
    { key: "thu", label: "Thứ 5", hours: ["16:00"], status: "limited" },
    { key: "fri", label: "Thứ 6", hours: ["16:00", "17:30", "19:00"], status: "available" },
    { key: "sat", label: "Thứ 7", hours: ["08:30", "10:30"], status: "limited" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Nghỉ" },
  ],
  "do-gia-hung": [
    { key: "mon", label: "Thứ 2", hours: ["08:30", "10:00"], status: "limited" },
    { key: "tue", label: "Thứ 3", hours: ["08:30", "11:00", "15:00"], status: "available" },
    { key: "wed", label: "Thứ 4", hours: ["08:30", "10:00"], status: "limited" },
    { key: "thu", label: "Thứ 5", hours: ["08:30", "11:30", "16:00"], status: "available" },
    { key: "fri", label: "Thứ 6", hours: ["09:00", "14:00"], status: "limited" },
    { key: "sat", label: "Thứ 7", hours: ["09:30"], status: "limited" },
    { key: "sun", label: "Chủ nhật", hours: [], status: "off", note: "Nghỉ" },
  ],
};

const patientUsers: UserEntity[] = [
  createUser(
    "default-user",
    "Khách Hàng",
    "Medigo",
    "0909686868",
    "khachhang@medigoclinic.vn",
    "patient",
    "Nữ",
    "1995-08-22",
    "Quận 3, TP. Hồ Chí Minh"
  ),
  createUser("patient-002", "Nguyễn Phương", "Linh", "0911222333", "linh.nguyen@example.com", "patient", "Nữ", "1998-07-11", "Quận 4, TP. Hồ Chí Minh"),
  createUser("patient-003", "Trần Minh", "Khang", "0901234567", "khang.tran@example.com", "patient", "Nam", "1992-02-09", "Quận 7, TP. Hồ Chí Minh"),
  createUser("patient-pham-thi-linh", "Phạm Thị", "Linh", "0903111000", "phamlinh@example.com", "patient", "Nữ", "1991-06-05", "Quận 10, TP. Hồ Chí Minh"),
  createUser("patient-nguyen-quoc-bao", "Nguyễn Quốc", "Bảo", "0903777000", "quocbao@example.com", "patient", "Nam", "1988-09-12", "Quận 5, TP. Hồ Chí Minh"),
  createUser("patient-vo-anh-thu", "Võ Anh", "Thư", "0908111222", "anhthu@example.com", "patient", "Nữ", "1997-10-18", "Quận 3, TP. Hồ Chí Minh"),
  createUser("patient-tran-duc-minh", "Trần Đức", "Minh", "0909111444", "ducminh@example.com", "patient", "Nam", "1994-03-21", "Quận 1, TP. Hồ Chí Minh"),
  createUser("patient-le-kim-dung", "Lê Kim", "Dung", "0902555666", "kimdung@example.com", "patient", "Nữ", "1990-12-15", "Bình Thạnh, TP. Hồ Chí Minh"),
  createUser("patient-do-thi-mai", "Đỗ Thị", "Mai", "0906444777", "thimai@example.com", "patient", "Nữ", "1993-04-27", "Quận 7, TP. Hồ Chí Minh"),
  createUser("patient-nguyen-thi-huyen", "Nguyễn Thị", "Huyền", "0905999333", "thihuyen@example.com", "patient", "Nữ", "1996-01-04", "Quận 10, TP. Hồ Chí Minh"),
  createUser("patient-hoang-minh-tuan", "Hoàng Minh", "Tuấn", "0902111333", "minhtuan@example.com", "patient", "Nam", "1989-05-19", "Thủ Đức, TP. Hồ Chí Minh"),
];

const patientProfiles: PatientEntity[] = [
  createPatientProfile("default-user", "BHYT-MC-0001", "O+"),
  createPatientProfile("patient-002", "BHYT-MC-0002", "A+"),
  createPatientProfile("patient-003", "BHYT-MC-0003", "B+"),
  createPatientProfile("patient-pham-thi-linh", "BHYT-MC-0004", "O+"),
  createPatientProfile("patient-nguyen-quoc-bao", "BHYT-MC-0005", "AB+"),
  createPatientProfile("patient-vo-anh-thu", "BHYT-MC-0006", "A+"),
  createPatientProfile("patient-tran-duc-minh", "BHYT-MC-0007", "B+"),
  createPatientProfile("patient-le-kim-dung", "BHYT-MC-0008", "O-"),
  createPatientProfile("patient-do-thi-mai", "BHYT-MC-0009", "A-"),
  createPatientProfile("patient-nguyen-thi-huyen", "BHYT-MC-0010", "O+"),
  createPatientProfile("patient-hoang-minh-tuan", "BHYT-MC-0011", "B-"),
];

const reviewRecords: ReviewEntity[] = [
  {
    reviewId: "rv-01",
    patientId: "patient-pham-thi-linh",
    doctorId: "tran-minh-an",
    appointmentId: "appt-rv-01",
    rating: 5,
    comment: "Bác sĩ giải thích rõ, hướng dẫn theo dõi huyết áp rất dễ hiểu.",
    createdAt: "02/04/2026",
  },
  {
    reviewId: "rv-02",
    patientId: "patient-nguyen-quoc-bao",
    doctorId: "tran-minh-an",
    appointmentId: "appt-rv-02",
    rating: 5,
    comment: "Thái độ nhẹ nhàng, xem kết quả xét nghiệm kỹ và tư vấn rất cụ thể.",
    createdAt: "29/03/2026",
  },
  {
    reviewId: "rv-03",
    patientId: "patient-vo-anh-thu",
    doctorId: "le-thao-nguyen",
    appointmentId: "appt-rv-03",
    rating: 5,
    comment: "Phác đồ rõ ràng, bác sĩ đánh giá tình trạng da kỹ trước khi kê đơn.",
    createdAt: "31/03/2026",
  },
  {
    reviewId: "rv-04",
    patientId: "patient-tran-duc-minh",
    doctorId: "le-thao-nguyen",
    appointmentId: "appt-rv-04",
    rating: 4,
    comment: "Đặt lịch thuận tiện, bác sĩ trao đổi dễ hiểu và thân thiện.",
    createdAt: "27/03/2026",
  },
  {
    reviewId: "rv-05",
    patientId: "patient-le-kim-dung",
    doctorId: "pham-hoang-vu",
    appointmentId: "appt-rv-05",
    rating: 5,
    comment: "Bác sĩ tư vấn rất kỹ cho tình trạng viêm xoang kéo dài nhiều năm.",
    createdAt: "03/04/2026",
  },
  {
    reviewId: "rv-06",
    patientId: "patient-do-thi-mai",
    doctorId: "nguyen-thu-ha",
    appointmentId: "appt-rv-06",
    rating: 5,
    comment: "Bác sĩ nhẹ nhàng với bé, phụ huynh dễ trao đổi và đặt câu hỏi.",
    createdAt: "01/04/2026",
  },
  {
    reviewId: "rv-07",
    patientId: "patient-nguyen-thi-huyen",
    doctorId: "vo-khanh-linh",
    appointmentId: "appt-rv-07",
    rating: 5,
    comment: "Không gian riêng tư, bác sĩ trao đổi tinh tế và rất rõ ràng.",
    createdAt: "30/03/2026",
  },
  {
    reviewId: "rv-08",
    patientId: "patient-hoang-minh-tuan",
    doctorId: "do-gia-hung",
    appointmentId: "appt-rv-08",
    rating: 4,
    comment: "Phù hợp khi chưa biết nên đi khám chuyên khoa nào trước.",
    createdAt: "28/03/2026",
  },
];

export const users: UserEntity[] = [...doctorUsers, ...patientUsers];
export const patients = patientProfiles;
export { clinics, doctorProfiles, reviewRecords };

export const scheduleRecords: ScheduleEntity[] = doctorProfiles.flatMap((profile) =>
  schedulePatterns[profile.userId].flatMap((day) =>
    day.hours.map((hour, index) => ({
      scheduleId: `sch-${profile.userId}-${day.key}-${index + 1}`,
      doctorId: profile.userId,
      workDate: `${day.label}, tuần hiện tại`,
      dayKey: day.key,
      label: day.label,
      startTime: hour,
      endTime: addMinutes(hour, day.slotDuration ?? 30),
      isAvailable: day.status !== "off",
      slotDuration: day.slotDuration ?? 30,
      note: day.note,
    }))
  )
);

const userMap = new Map(users.map((user) => [user.userId, user]));
const clinicMap = new Map(clinics.map((clinic) => [clinic.clinicId, clinic]));

function getDoctorReviews(doctorId: string): DoctorReview[] {
  return reviewRecords
    .filter((review) => review.doctorId === doctorId)
    .map((review) => {
      const patientUser = userMap.get(review.patientId);

      return {
        id: review.reviewId,
        patientName: patientUser ? getFullName(patientUser) : "Bệnh nhân",
        createdAt: review.createdAt,
        rating: review.rating,
        comment: review.comment,
      };
    });
}

function getDoctorWorkingSchedule(doctorId: string): ScheduleDay[] {
  return schedulePatterns[doctorId].map((day) => {
    const hours = scheduleRecords
      .filter((schedule) => schedule.doctorId === doctorId && schedule.dayKey === day.key)
      .map((schedule) => schedule.startTime)
      .sort(compareTimes);

    return {
      key: day.key,
      label: day.label,
      hours,
      status: day.status,
      note: day.note,
    };
  });
}

function getNextAvailable(workingSchedule: ScheduleDay[]) {
  const nextDay = workingSchedule.find((day) => day.hours.length > 0 && day.status !== "off");

  if (!nextDay) {
    return "Chưa mở lịch";
  }

  return `${nextDay.label} - ${nextDay.hours[0]}`;
}

export const doctors: Doctor[] = doctorProfiles.map((profile) => {
  const user = userMap.get(profile.userId)!;
  const clinic = clinicMap.get(profile.clinicId)!;
  const reviews = getDoctorReviews(profile.userId);
  const workingSchedule = getDoctorWorkingSchedule(profile.userId);

  return {
    id: profile.userId,
    userId: profile.userId,
    name: `${profile.title} ${getFullName(user)}`,
    firstName: user.firstName,
    lastName: user.lastName,
    title: `${profile.title} ${profile.specialization}`,
    specialty: profile.specialization,
    specialties: profile.specialties,
    clinicId: clinic.clinicId,
    clinic: clinic.name,
    clinicPhone: clinic.phone,
    location: clinic.address,
    rating: profile.rating,
    reviewCount: reviews.length,
    experienceYears: profile.experienceYears,
    nextAvailable: getNextAvailable(workingSchedule),
    accentColor: profile.accentColor,
    bio: profile.bio,
    licenseNumber: profile.licenseNumber,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    aboutBullets: profile.aboutBullets,
    education: profile.education,
    certificates: profile.certificates,
    languages: profile.languages,
    symptomFocus: profile.symptomFocus,
    services: profile.services,
    workingSchedule,
    reviews,
  };
});

export function getDoctorById(doctorId: string) {
  return doctors.find((doctor) => doctor.id === doctorId);
}

export function getClinicById(clinicId: string) {
  return clinicMap.get(clinicId);
}

export function getPatientById(patientId: string) {
  return userMap.get(patientId);
}

export function getScheduleRecord(doctorId: string, dayKey: string, hour: string) {
  return scheduleRecords.find(
    (schedule) =>
      schedule.doctorId === doctorId &&
      schedule.dayKey === dayKey &&
      schedule.startTime === hour
  );
}

export const specialties = [
  "Tất cả chuyên khoa",
  ...new Set(doctorProfiles.map((doctor) => doctor.specialization)),
];

export const symptomGuides = [
  {
    symptom: "Đau ngực, khó thở, tim đập nhanh",
    specialty: "Tim mạch",
  },
  {
    symptom: "Mụn, ngứa da, nổi mề đay",
    specialty: "Da liễu",
  },
  {
    symptom: "Trẻ sốt, biếng ăn, ho",
    specialty: "Nhi khoa",
  },
  {
    symptom: "Nghẹt mũi, đau họng, viêm xoang",
    specialty: "Tai mũi họng",
  },
];
