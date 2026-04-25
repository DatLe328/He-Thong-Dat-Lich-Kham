export async function bookAppointment(payload: {
  userId?: number;
  doctorId: number;
  scheduleId: number;
  appointmentDate: string;

  // dùng 1 field duy nhất cho backend
  mode: "self" | "proxy" | "guest";

  patientInfo?: {
    email?: string;
    firstName: string;
    lastName?: string;
    phone: string;
    gender?: string;
    address?: string;
  };
}) {
  const body: any = {
    doctorId: Number(payload.doctorId),
    scheduleId: Number(payload.scheduleId),
    appointmentDate: payload.appointmentDate,
    mode: payload.mode,
    note: payload.note?.trim() || ""
  };

  if (payload.userId) {
    body.userId = Number(payload.userId);
  }

  // =========================
  // PATIENT INFO (proxy + guest)
  // =========================
  if (payload.patientInfo) {
    const p = payload.patientInfo;

    body.patientInfo = {
      firstName: (p.firstName || "").trim(),
      lastName: (p.lastName || "").trim(),
      phone: (p.phone || "").trim(),
      email: p.email || "",
      gender: p.gender || "",
      address: p.address || "",
    };
  }

  console.log("FINAL BODY SEND TO BE:", body);

  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Lỗi đặt lịch");
  }

  return data;
}