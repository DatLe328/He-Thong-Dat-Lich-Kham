export async function bookAppointment(payload: {
  userId: number;
  doctorId: number;
  scheduleId: number;
  appointmentDate: string;
  isProxy?: boolean;
  patientInfo?: {
    email: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    gender?: string;
    address?: string;
  };
}) {
  const body: any = {
    userId: payload.userId,
    doctorId: payload.doctorId,
    scheduleId: payload.scheduleId,
    appointmentDate: payload.appointmentDate,

    // ✅ FIX QUAN TRỌNG: backend cần mode
    mode: payload.isProxy ? "proxy" : "self",
  };

  // =========================
  // PROXY BOOKING
  // =========================
  if (payload.isProxy && payload.patientInfo) {
    const p = payload.patientInfo;

    body.patientInfo = {
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName || "",
      phone: p.phone || "",
      gender: p.gender || "",
      address: p.address || "",

      // ✅ backend DAO có thể dùng name fallback
      name: `${p.firstName} ${p.lastName || ""}`.trim(),
    };
  }

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