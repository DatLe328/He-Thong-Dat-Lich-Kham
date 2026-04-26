import {
  ApiDoctorAppointmentsResponse,
  DoctorAppointment,
} from "../types";

const DOCTORS_ENDPOINT = "/api/doctors";

function formatDateParts(appointmentDate: string) {
  const date = new Date(appointmentDate);

  return {
    appointmentDateLabel: new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date),
    appointmentTimeLabel: new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function formatStatusLabel(status: DoctorAppointment["status"]) {
  switch (status) {
    case "PENDING":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "COMPLETED":
      return "Hoàn tất";
    case "CANCELLED":
      return "Đã huỷ";
    default:
      return status;
  }
}

function buildContactName(appointment: ApiDoctorAppointmentsResponse["data"][number]) {
  const proxyName = [appointment.proxyLastName, appointment.proxyFirstName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (proxyName) {
    return proxyName;
  }

  if (appointment.patientId) {
    return `Bệnh nhân #${appointment.patientId}`;
  }

  return "Khách đặt lịch";
}

function buildContactLabel(appointment: ApiDoctorAppointmentsResponse["data"][number]) {
  if (appointment.proxyPhone) {
    return `Đặt hộ • ${appointment.proxyPhone}`;
  }

  if (appointment.patientId) {
    return `Tài khoản bệnh nhân #${appointment.patientId}`;
  }

  return "Khách chưa đăng nhập";
}

function mapAppointment(appointment: ApiDoctorAppointmentsResponse["data"][number]) {
  const parts = formatDateParts(appointment.appointmentDate);
  const appointmentDate = new Date(appointment.appointmentDate);

  return {
    ...appointment,
    ...parts,
    statusLabel: formatStatusLabel(appointment.status),
    contactName: buildContactName(appointment),
    contactLabel: buildContactLabel(appointment),
    isUpcoming: appointmentDate.getTime() >= Date.now(),
  } satisfies DoctorAppointment;
}

async function fetchJson<T>(url: string, fallbackMessage: string, init?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;

  if (!response.ok) {
    const errorPayload = payload as { message?: string } | null;
    throw new Error(errorPayload?.message || fallbackMessage);
  }

  return payload as T;
}

export async function fetchDoctorAppointments(
  doctorId: string | number,
  options: { status?: string; upcomingOnly?: boolean } = {}
) {
  const url = new URL(`${DOCTORS_ENDPOINT}/${doctorId}/appointments`, window.location.origin);

  if (options.status && options.status !== "ALL") {
    url.searchParams.set("status", options.status);
  }

  if (options.upcomingOnly) {
    url.searchParams.set("upcoming", "true");
  }

  const payload = await fetchJson<ApiDoctorAppointmentsResponse>(
    url.toString(),
    "Không thể tải danh sách lịch hẹn của bác sĩ."
  );

  if (!payload.success) {
    throw new Error("Backend trả về danh sách lịch hẹn không hợp lệ.");
  }

  return {
    ...payload,
    data: payload.data.map(mapAppointment),
  };
}

export async function rescheduleDoctorAppointment(
  doctorId: string | number,
  appointmentId: number,
  appointmentDate: string,
  scheduleId?: number | null
) {
  const payload = await fetchJson<{ success: boolean; data: ApiDoctorAppointmentsResponse["data"][number] }>(
    `${DOCTORS_ENDPOINT}/${doctorId}/appointments/${appointmentId}/reschedule`,
    "Không thể dời lịch hẹn.",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        appointmentDate,
        scheduleId: scheduleId ?? undefined,
      }),
    }
  );

  return {
    ...payload,
    data: mapAppointment(payload.data),
  };
}

export async function cancelDoctorAppointment(
  doctorId: string | number,
  appointmentId: number,
  reason?: string
) {
  const payload = await fetchJson<{ success: boolean; data: ApiDoctorAppointmentsResponse["data"][number] }>(
    `${DOCTORS_ENDPOINT}/${doctorId}/appointments/${appointmentId}/cancel`,
    "Không thể huỷ lịch hẹn.",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );

  return {
    ...payload,
    data: mapAppointment(payload.data),
  };
}

export async function updateDoctorAppointmentStatus(
  doctorId: string | number,
  appointmentId: number,
  status: "COMPLETED" | "NO_SHOW"
) {
  const payload = await fetchJson<{ success: boolean; data: ApiDoctorAppointmentsResponse["data"][number] }>(
    `${DOCTORS_ENDPOINT}/${doctorId}/appointments/${appointmentId}/update-status`,
    "Không thể cập nhật trạng thái lịch hẹn.",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }
  );

  return {
    ...payload,
    data: mapAppointment(payload.data),
  };
}