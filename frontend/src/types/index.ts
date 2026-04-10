export type AuthProvider = "credentials" | "google";
export type UserRole = "patient" | "doctor" | "admin";

export type ScheduleStatus = "available" | "limited" | "off";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

export type SlotStatus = "available" | "booked" | "blocked" | "off";

export type ScheduleOverrideKind = "add" | "block";
export type NotificationChannel = "app" | "email" | "sms" | "zalo";

export type ScheduleDay = {
  key: string;
  label: string;
  hours: string[];
  note?: string;
  status: ScheduleStatus;
};

export type UserEntity = {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  gender: string;
  dateOfBirth: string;
  address: string;
  createdAt: string;
  updatedAt: string;
};

export type PatientEntity = {
  userId: string;
  insuranceId: string;
  bloodType: string;
};

export type ClinicEntity = {
  clinicId: string;
  name: string;
  address: string;
  phone: string;
  specialties: string[];
};

export type ScheduleEntity = {
  scheduleId: string;
  doctorId: string;
  workDate: string;
  dayKey: string;
  label: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  slotDuration: number;
  note?: string;
};

export type ReviewEntity = {
  reviewId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type NotificationEntity = {
  notificationId: string;
  appointmentId: string;
  userId: string;
  message: string;
  channel: NotificationChannel;
  createdAt: string;
};

export type DoctorEntity = {
  userId: string;
  title: string;
  specialization: string;
  clinicId: string;
  licenseNumber: string;
  bio: string;
  rating: number;
  experienceYears: number;
  accentColor: string;
  specialties: string[];
  aboutBullets: string[];
  education: string[];
  certificates: string[];
  languages: string[];
  symptomFocus: string[];
  services: string[];
};

export type DoctorReview = {
  id: string;
  patientName: string;
  createdAt: string;
  rating: number;
  comment: string;
};

export type Doctor = {
  id: string;
  userId: string;
  name: string;
  firstName: string;
  lastName: string;
  title: string;
  specialty: string;
  specialties: string[];
  clinicId: string;
  clinic: string;
  clinicPhone: string;
  location: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  nextAvailable: string;
  accentColor: string;
  bio: string;
  licenseNumber: string;
  gender: string;
  dateOfBirth: string;
  address: string;
  aboutBullets: string[];
  education: string[];
  certificates: string[];
  languages: string[];
  symptomFocus: string[];
  services: string[];
  workingSchedule: ScheduleDay[];
  reviews: DoctorReview[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  provider: AuthProvider;
  avatar?: string;
};

export type StoredAuthUser = AuthUser & {
  password?: string;
};

export type RegisterInput = {
  email: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type ScheduleOverride = {
  id: string;
  doctorId: string;
  dayKey: string;
  hour: string;
  kind: ScheduleOverrideKind;
};

export type ResolvedScheduleSlot = {
  hour: string;
  status: SlotStatus;
  source: "default" | "custom";
  appointmentId?: string;
  patientName?: string;
};

export type ResolvedScheduleDay = {
  key: string;
  label: string;
  status: ScheduleStatus;
  note?: string;
  slots: ResolvedScheduleSlot[];
  availableCount: number;
  bookedCount: number;
  blockedCount: number;
};

export type Appointment = {
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  scheduleId: string;
  clinicId: string;
  dayKey: string;
  dayLabel: string;
  hour: string;
  appointmentDate: string;
  reason: string;
  symptomGroup: string;
  symptomGroupLabel: string;
  note?: string;
  status: AppointmentStatus;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateAppointmentInput = {
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  doctorId: string;
  dayKey: string;
  hour: string;
  reason: string;
  note?: string;
};

export type SymptomUrgency = "low" | "medium" | "high";

export type SymptomProfile = {
  id: string;
  label: string;
  specialty: string;
  keywords: string[];
  note: string;
  carePath: string;
  urgency: SymptomUrgency;
};

export type SymptomClassification = {
  groupId: string;
  groupLabel: string;
  suggestedSpecialty: string;
  matchedKeywords: string[];
  confidence: number;
  note: string;
  carePath: string;
  urgency: SymptomUrgency;
};

export type DoctorRecommendation = {
  doctor: Doctor;
  score: number;
  reasons: string[];
  availableSlots: number;
  nextAvailableLabel?: string;
};

export type AppointmentPresentation = {
  appointmentId: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  appointmentDate: string;
  dayLabel: string;
  hour: string;
  reason: string;
  symptomGroupLabel: string;
  note?: string;
  status: AppointmentStatus;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  doctorId: string;
};
