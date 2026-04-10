import { getClinicById, getDoctorById } from "../data/doctors";
import { symptomProfiles } from "../data/triage";
import {
  Appointment,
  AppointmentPresentation,
  Doctor,
  DoctorRecommendation,
  ResolvedScheduleDay,
  ResolvedScheduleSlot,
  ScheduleOverride,
  SymptomClassification,
} from "../types";

const dayIndexes: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function uniqueTimes(hours: string[]) {
  return [...new Set(hours)].sort((first, second) => {
    const [firstHour, firstMinute] = first.split(":").map(Number);
    const [secondHour, secondMinute] = second.split(":").map(Number);

    return firstHour * 60 + firstMinute - (secondHour * 60 + secondMinute);
  });
}

function createDateFromDayAndHour(dayKey: string, hour: string, from = new Date()) {
  const current = new Date(from);
  const targetDate = new Date(current);
  const targetDayIndex = dayIndexes[dayKey] ?? current.getDay();
  const dayOffset = (targetDayIndex - current.getDay() + 7) % 7;
  targetDate.setDate(current.getDate() + dayOffset);

  const [hourValue, minuteValue] = hour.split(":").map(Number);
  targetDate.setHours(hourValue, minuteValue, 0, 0);

  if (targetDate <= current) {
    targetDate.setDate(targetDate.getDate() + 7);
  }

  return targetDate;
}

function formatCalendarDate(date: Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function createFallbackClassification(preferredSpecialty?: string): SymptomClassification {
  const suggestedSpecialty =
    preferredSpecialty && preferredSpecialty !== "Tất cả chuyên khoa"
      ? preferredSpecialty
      : "Nội tổng quát";

  return {
    groupId: "tong-quat",
    groupLabel: "Sàng lọc triệu chứng chung",
    suggestedSpecialty,
    matchedKeywords: [],
    confidence: 0.42,
    note:
      "Mô tả hiện tại chưa đủ rõ để xác định chuyên khoa chính xác, nên ưu tiên bác sĩ sàng lọc ban đầu.",
    carePath:
      "Bạn có thể đặt lịch với bác sĩ nội tổng quát hoặc bổ sung thêm triệu chứng cụ thể để nhận gợi ý sát hơn.",
    urgency: "low",
  };
}

export function classifySymptoms(
  symptomText: string,
  preferredSpecialty?: string
): SymptomClassification {
  const normalizedText = normalizeText(symptomText);

  if (!normalizedText) {
    return createFallbackClassification(preferredSpecialty);
  }

  const matches = symptomProfiles
    .map((profile) => {
      const matchedKeywords = profile.keywords.filter((keyword) =>
        normalizedText.includes(normalizeText(keyword))
      );

      const specialtyBoost =
        preferredSpecialty && preferredSpecialty === profile.specialty ? 1 : 0;

      return {
        profile,
        matchedKeywords,
        score: matchedKeywords.length + specialtyBoost,
      };
    })
    .sort((first, second) => second.score - first.score);

  const bestMatch = matches[0];

  if (!bestMatch || bestMatch.score === 0) {
    return createFallbackClassification(preferredSpecialty);
  }

  return {
    groupId: bestMatch.profile.id,
    groupLabel: bestMatch.profile.label,
    suggestedSpecialty: bestMatch.profile.specialty,
    matchedKeywords: bestMatch.matchedKeywords,
    confidence: Math.min(0.95, 0.5 + bestMatch.score * 0.12),
    note: bestMatch.profile.note,
    carePath: bestMatch.profile.carePath,
    urgency: bestMatch.profile.urgency,
  };
}

export function getResolvedSchedule(
  doctor: Doctor,
  appointments: Appointment[],
  overrides: ScheduleOverride[]
): ResolvedScheduleDay[] {
  const doctorAppointments = appointments.filter(
    (appointment) =>
      appointment.doctorId === doctor.id &&
      (appointment.status === "pending" || appointment.status === "confirmed")
  );

  const doctorOverrides = overrides.filter((override) => override.doctorId === doctor.id);

  return doctor.workingSchedule.map((day) => {
    const baseHours = day.status === "off" ? [] : day.hours;
    const addedHours = doctorOverrides
      .filter((override) => override.dayKey === day.key && override.kind === "add")
      .map((override) => override.hour);
    const blockedHours = new Set(
      doctorOverrides
        .filter((override) => override.dayKey === day.key && override.kind === "block")
        .map((override) => override.hour)
    );

    const allHours = uniqueTimes([...baseHours, ...addedHours]);

    const slots: ResolvedScheduleSlot[] =
      allHours.length > 0
        ? allHours.map((hour) => {
            const matchedAppointment = doctorAppointments.find(
              (appointment) =>
                appointment.dayKey === day.key && appointment.hour === hour
            );

            const isBlocked = blockedHours.has(hour);

            return {
              hour,
              source: baseHours.includes(hour) ? "default" : "custom",
              status: matchedAppointment
                ? "booked"
                : isBlocked
                  ? "blocked"
                  : "available",
              appointmentId: matchedAppointment?.appointmentId,
              patientName: matchedAppointment?.patientName,
            };
          })
        : [
            {
              hour: "Không có khung giờ",
              source: "default",
              status: "off",
            },
          ];

    const availableCount = slots.filter((slot) => slot.status === "available").length;
    const bookedCount = slots.filter((slot) => slot.status === "booked").length;
    const blockedCount = slots.filter((slot) => slot.status === "blocked").length;

    return {
      key: day.key,
      label: day.label,
      note: day.note,
      slots,
      availableCount,
      bookedCount,
      blockedCount,
      status:
        availableCount > 1
          ? "available"
          : availableCount === 1 || bookedCount > 0
            ? "limited"
            : "off",
    };
  });
}

function getDoctorNextOpenLabel(schedule: ResolvedScheduleDay[]) {
  const day = schedule.find((item) => item.availableCount > 0);
  const slot = day?.slots.find((item) => item.status === "available");

  if (!day || !slot) {
    return undefined;
  }

  return `${day.label} - ${slot.hour}`;
}

export function getRecommendedDoctors(
  doctorList: Doctor[],
  appointments: Appointment[],
  overrides: ScheduleOverride[],
  symptomText: string,
  preferredSpecialty = "Tất cả chuyên khoa"
): {
  classification: SymptomClassification;
  recommendations: DoctorRecommendation[];
} {
  const classification = classifySymptoms(symptomText, preferredSpecialty);
  const normalizedText = normalizeText(symptomText);

  const recommendations = doctorList
    .filter((doctor) => {
      if (preferredSpecialty === "Tất cả chuyên khoa") {
        return true;
      }

      return doctor.specialty === preferredSpecialty;
    })
    .map((doctor) => {
      const schedule = getResolvedSchedule(doctor, appointments, overrides);
      const availableSlots = schedule.reduce(
        (total, day) => total + day.availableCount,
        0
      );
      const symptomOverlap = doctor.symptomFocus.filter((item) =>
        normalizedText.includes(normalizeText(item))
      );
      const specialtyMatched =
        doctor.specialty === classification.suggestedSpecialty ? 1 : 0;
      const preferenceMatched =
        preferredSpecialty !== "Tất cả chuyên khoa" &&
        doctor.specialty === preferredSpecialty
          ? 1
          : 0;

      const score =
        doctor.rating * 12 +
        doctor.reviewCount / 18 +
        availableSlots * 4 +
        symptomOverlap.length * 10 +
        specialtyMatched * 28 +
        preferenceMatched * 18;

      const reasons = [
        specialtyMatched
          ? `Phù hợp chuyên khoa ${classification.suggestedSpecialty}`
          : `Hỗ trợ nhóm ${doctor.specialty.toLowerCase()}`,
        availableSlots > 0
          ? `Còn ${availableSlots} khung giờ trống`
          : "Lịch đang kín, cần ưu tiên thời gian khác",
        `${doctor.rating}/5 từ ${doctor.reviewCount} đánh giá`,
      ];

      if (symptomOverlap.length > 0) {
        reasons.splice(1, 0, `Khớp triệu chứng: ${symptomOverlap.slice(0, 2).join(", ")}`);
      }

      return {
        doctor,
        score,
        reasons,
        availableSlots,
        nextAvailableLabel: getDoctorNextOpenLabel(schedule),
      };
    })
    .sort((first, second) => second.score - first.score);

  return {
    classification,
    recommendations,
  };
}

export function getClinicSuggestions(recommendations: DoctorRecommendation[]) {
  return [...new Map(recommendations.map((item) => [item.doctor.clinic, item])).values()].slice(
    0,
    3
  );
}

export function getNextAppointmentDate(dayKey: string, hour: string) {
  return createDateFromDayAndHour(dayKey, hour);
}

export function getAppointmentDateLabel(dayKey: string, hour: string) {
  return formatCalendarDate(createDateFromDayAndHour(dayKey, hour));
}

export function sortAppointmentsByDate(appointments: Appointment[]) {
  return [...appointments].sort((first, second) => {
    return (
      new Date(first.appointmentDate).getTime() -
      new Date(second.appointmentDate).getTime()
    );
  });
}

export function getAppointmentPresentation(
  appointment: Appointment
): AppointmentPresentation {
  const doctor = getDoctorById(appointment.doctorId);
  const clinic = getClinicById(appointment.clinicId || (doctor?.clinicId ?? ""));

  return {
    appointmentId: appointment.appointmentId,
    doctorName: doctor?.name ?? "Bác sĩ chưa xác định",
    specialty: doctor?.specialty ?? "Chưa phân loại",
    clinicName: clinic?.name ?? doctor?.clinic ?? "Chưa cập nhật cơ sở",
    clinicAddress: clinic?.address ?? doctor?.location ?? "Chưa cập nhật địa chỉ",
    clinicPhone: clinic?.phone ?? doctor?.clinicPhone ?? "Chưa cập nhật số điện thoại",
    patientName: appointment.patientName,
    patientPhone: appointment.patientPhone,
    patientEmail: appointment.patientEmail,
    appointmentDate: appointment.appointmentDate,
    dayLabel: appointment.dayLabel,
    hour: appointment.hour,
    reason: appointment.reason,
    symptomGroupLabel: appointment.symptomGroupLabel,
    note: appointment.note,
    status: appointment.status,
    cancelReason: appointment.cancelReason,
    createdAt: appointment.createdAt,
    updatedAt: appointment.updatedAt,
    doctorId: appointment.doctorId,
  };
}
