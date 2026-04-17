export async function bookAppointment(payload: {
  mode: "self" | "proxy";
  userId: number;
  doctorId: number;
  scheduleId: number;
  appointmentDate: string;
  patient?: {
    name: string;
    phone?: string;
    gender?: string;
    address?: string;
  };
}) {
  const body: any = {
    mode: payload.mode,
    userId: payload.userId, // ✅ LUÔN PHẢI CÓ
    doctorId: payload.doctorId,
    scheduleId: payload.scheduleId,
    appointmentDate: payload.appointmentDate,
  };

  if (payload.mode === "proxy") {
    body.patient = payload.patient; // backend đọc "patient"
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