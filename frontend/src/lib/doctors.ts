import {
  ApiDoctor,
  ApiDoctorDetailResponse,
  ApiDoctorReviewsResponse,
  ApiDoctorSchedule,
  ApiDoctorSchedulesResponse,
  ApiDoctorsResponse,
  DirectoryDoctor,
  DoctorProfile,
  DoctorReview,
  DoctorScheduleDay,
  DoctorScheduleSlot,
} from "../types";

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

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
}

function formatDateTime(date: string, time: string) {
  const value = new Date(`${date}T${time}:00`);

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function mapSchedules(schedules: ApiDoctorSchedule[]): DoctorScheduleDay[] {
  return [...schedules]
    .sort((left, right) => {
      const leftKey = `${left.workDate}T${left.startTime}`;
      const rightKey = `${right.workDate}T${right.startTime}`;
      return leftKey.localeCompare(rightKey);
    })
    .map((schedule) => {
      const slots: DoctorScheduleSlot[] = schedule.slots?.length
        ? schedule.slots.map((slot) => ({
            time: slot.time,
            status: schedule.isAvailable
              ? slot.available
                ? "available"
                : "booked"
              : "off",
          }))
        : [];

      const availableCount = slots.filter(
        (slot) => slot.status === "available"
      ).length;
      const totalCount = slots.length;

      let status: DoctorScheduleDay["status"] = "off";

      if (!schedule.isAvailable) {
        status = "off";
      } else if (availableCount > 0) {
        status = "available";
      } else if (totalCount > 0) {
        status = "limited";
      }

      return {
        scheduleId: schedule.scheduleId,
        workDate: schedule.workDate,
        label: formatDateLabel(schedule.workDate),
        hoursLabel: `${schedule.startTime} - ${schedule.endTime}`,
        status,
        availableCount,
        totalCount,
        slots,
      };
    });
}

function mapReviews(payload: ApiDoctorReviewsResponse): DoctorReview[] {
  return payload.data.map((review) => ({
    id: String(review.reviewId),
    patientName: `Bệnh nhân #${review.patientId}`,
    rating: review.rating,
    comment: review.comment?.trim() || "Chưa có nhận xét chi tiết.",
    createdAt: new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(review.createdAt)),
  }));
}

async function fetchJson<T>(url: string, fallbackMessage: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(fallbackMessage);
  }

  return (await response.json()) as T;
}

async function fetchDoctorsPage(page: number) {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(DOCTORS_PER_PAGE),
  });

  const payload = await fetchJson<ApiDoctorsResponse>(
    `${DOCTORS_ENDPOINT}?${params.toString()}`,
    "Không thể tải danh sách bác sĩ từ backend."
  );

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

export async function fetchDoctorProfile(doctorId: string | number) {
  const id = String(doctorId);
  const [detailPayload, schedulesPayload, reviewsPayload] = await Promise.all([
    fetchJson<ApiDoctorDetailResponse>(
      `${DOCTORS_ENDPOINT}/${id}?include_clinic=true`,
      "Không thể tải hồ sơ bác sĩ từ backend."
    ),
    fetchJson<ApiDoctorSchedulesResponse>(
      `${DOCTORS_ENDPOINT}/${id}/schedules?slots=true`,
      "Không thể tải lịch làm việc của bác sĩ."
    ),
    fetchJson<ApiDoctorReviewsResponse>(
      `${DOCTORS_ENDPOINT}/${id}/reviews`,
      "Không thể tải đánh giá của bác sĩ."
    ),
  ]);

  if (!detailPayload.success) {
    throw new Error("Backend trả về hồ sơ bác sĩ không hợp lệ.");
  }

  if (!schedulesPayload.success) {
    throw new Error("Backend trả về lịch làm việc không hợp lệ.");
  }

  if (!reviewsPayload.success) {
    throw new Error("Backend trả về đánh giá không hợp lệ.");
  }

  const doctor = mapDoctor(detailPayload.data);
  const schedules = mapSchedules(schedulesPayload.data);
  const reviews = mapReviews(reviewsPayload);
  const nextAvailableSchedule = schedules.find(
    (schedule) => schedule.availableCount > 0
  );
  const nextAvailableSlot = nextAvailableSchedule?.slots.find(
    (slot) => slot.status === "available"
  );

  return {
    ...doctor,
    gender: detailPayload.data.user?.gender?.trim() || "Đang cập nhật",
    dateOfBirth: detailPayload.data.user?.dateOfBirth || "Đang cập nhật",
    address: detailPayload.data.user?.address?.trim() || "Đang cập nhật",
    clinicName: detailPayload.data.clinic?.name?.trim() || "Đang cập nhật",
    clinicAddress:
      detailPayload.data.clinic?.address?.trim() || "Đang cập nhật",
    clinicPhone: detailPayload.data.clinic?.phone?.trim() || "Đang cập nhật",
    clinicSpecialties: detailPayload.data.clinic?.specialties ?? [],
    nextAvailable:
      nextAvailableSchedule && nextAvailableSlot
        ? formatDateTime(nextAvailableSchedule.workDate, nextAvailableSlot.time)
        : "Chưa mở lịch",
    totalReviews: reviewsPayload.total ?? reviews.length,
    schedules,
    reviews,
  } satisfies DoctorProfile;
}
