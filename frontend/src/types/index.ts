export type AuthProvider = "credentials" | "google";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  provider: AuthProvider;
  avatar?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
};

export type RegisterInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ApiAuthUser = {
  id?: string;
  userID?: number;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string | null;
  role?: string;
  provider?: AuthProvider;
  avatar?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
};

export type ApiAuthResponse = {
  message: string;
  user: ApiAuthUser;
};

export type ApiDoctorUser = {
  userID: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  googleID: string | null;
  role: string;
  gender: string | null;
  dateOfBirth: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiDoctor = {
  doctorID: number;
  userID: number;
  clinicID: number | null;
  specialization: string | null;
  licenseNumber: string | null;
  bio: string | null;
  rating: number;
  user?: ApiDoctorUser | null;
};

export type ApiClinic = {
  clinicID: number;
  name: string;
  address: string | null;
  phone: string | null;
  specialties: string[];
};

export type ApiDoctorDetail = ApiDoctor & {
  clinic?: ApiClinic | null;
};

export type ApiDoctorsPagination = {
  total: number;
  pages: number;
  page: number;
  perPage: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ApiDoctorsResponse = {
  success: boolean;
  data: ApiDoctor[];
  pagination?: ApiDoctorsPagination;
};

export type ApiDoctorDetailResponse = {
  success: boolean;
  data: ApiDoctorDetail;
};

export type ApiScheduleSlot = {
  time: string;
  available: boolean;
};

export type ApiDoctorSchedule = {
  scheduleId: number;
  doctorID: number;
  clinicID: number | null;
  workDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration: number;
  slots?: ApiScheduleSlot[];
};

export type ApiDoctorSchedulesResponse = {
  success: boolean;
  data: ApiDoctorSchedule[];
  total: number;
};

export type ApiDoctorReview = {
  reviewId: number;
  patientId: number;
  patient?: {
    patientID: number;
    fullName: string;
  } | null;
  doctorId: number | null;
  appointmentId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type ApiDoctorReviewsResponse = {
  success: boolean;
  data: ApiDoctorReview[];
  total: number;
  avgRating: number;
};

export type ApiAppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type ApiDoctorAppointment = {
  appointmentId: number;
  patientId: number | null;
  doctorId: number | null;
  scheduleId: number | null;
  clinicId: number | null;
  appointmentDate: string;
  reason: string | null;
  status: ApiAppointmentStatus;
  cancelReason: string | null;
  proxyFirstName: string | null;
  proxyLastName: string | null;
  proxyPhone: string | null;
  proxyEmail: string | null;
  proxyGender: string | null;
  proxyAddress: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ApiDoctorAppointmentsResponse = {
  success: boolean;
  data: ApiDoctorAppointment[];
  total: number;
};

export type DoctorAppointment = ApiDoctorAppointment & {
  appointmentDateLabel: string;
  appointmentTimeLabel: string;
  statusLabel: string;
  contactName: string;
  contactLabel: string;
  isUpcoming: boolean;
};

export type DirectoryDoctor = {
  id: string;
  doctorId: number;
  clinicId: number | null;
  name: string;
  firstName: string;
  lastName: string;
  specialty: string;
  specialties: string[];
  rating: number;
  bio: string;
  licenseNumber: string;
  email: string;
  phone: string;
};

export type DoctorScheduleSlot = {
  time: string;
  status: "available" | "booked" | "off";
};

export type DoctorScheduleDay = {
  scheduleId: number;
  workDate: string;
  label: string;
  hoursLabel: string;
  status: "available" | "limited" | "off";
  availableCount: number;
  totalCount: number;
  slots: DoctorScheduleSlot[];
};

export type DoctorReview = {
  id: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type DoctorProfile = DirectoryDoctor & {
  gender: string;
  dateOfBirth: string;
  address: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  clinicSpecialties: string[];
  nextAvailable: string;
  totalReviews: number;
  schedules: DoctorScheduleDay[];
  reviews: DoctorReview[];
};
