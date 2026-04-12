export type AuthProvider = "credentials" | "google";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  role?: string;
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

export type DirectoryDoctor = {
  id: string;
  doctorId: number;
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
