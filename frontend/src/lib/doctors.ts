import { ApiDoctor, ApiDoctorsResponse, DirectoryDoctor } from "../types";

const DOCTORS_ENDPOINT = "/api/doctors";
const DOCTORS_PER_PAGE = 100;

function splitSpecialties(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[,;/|]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapDoctor(apiDoctor: ApiDoctor): DirectoryDoctor {
  const firstName = apiDoctor.user?.firstName?.trim() ?? "";
  const lastName = apiDoctor.user?.lastName?.trim() ?? "";
  const name =
    [firstName, lastName].filter(Boolean).join(" ").trim() ||
    `Bác sĩ #${apiDoctor.doctorID}`;
  const specialties = splitSpecialties(apiDoctor.specialization);

  return {
    id: String(apiDoctor.doctorID),
    doctorId: apiDoctor.doctorID,
    name,
    firstName,
    lastName,
    specialty: apiDoctor.specialization?.trim() || "Chưa cập nhật chuyên khoa",
    specialties,
    rating: Number(apiDoctor.rating) || 0,
    bio:
      apiDoctor.bio?.trim() || "Hồ sơ chuyên môn đang được cập nhật từ hệ thống.",
    licenseNumber: apiDoctor.licenseNumber?.trim() || "Đang cập nhật",
    email: apiDoctor.user?.email?.trim() || "Đang cập nhật",
    phone: apiDoctor.user?.phone?.trim() || "Đang cập nhật",
  };
}

async function fetchDoctorsPage(page: number) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(DOCTORS_PER_PAGE),
  });

  const response = await fetch(`${DOCTORS_ENDPOINT}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách bác sĩ từ backend.");
  }

  const payload = (await response.json()) as ApiDoctorsResponse;

  if (!payload.success) {
    throw new Error("Backend trả về dữ liệu bác sĩ không hợp lệ.");
  }

  return payload;
}

export async function fetchAllDoctors() {
  const mappedDoctors = new Map<number, DirectoryDoctor>();
  let currentPage = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    const payload = await fetchDoctorsPage(currentPage);

    payload.data.forEach((doctor) => {
      mappedDoctors.set(doctor.doctorID, mapDoctor(doctor));
    });

    hasNextPage = payload.pagination?.hasNext ?? false;
    currentPage += 1;
  }

  return Array.from(mappedDoctors.values()).sort(
    (left, right) =>
      right.rating - left.rating || left.name.localeCompare(right.name, "vi")
  );
}
