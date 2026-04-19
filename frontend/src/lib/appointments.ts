export async function bookAppointment(payload: {
  userId?: number; // ✅ cho phép optional
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
    doctorId: payload.doctorId,
    scheduleId: payload.scheduleId,
    appointmentDate: payload.appointmentDate,
  };

  // =========================
  // USER LOGIN
  // =========================
  if (payload.userId) {
    body.userId = payload.userId;
  }

  // =========================
  // 🔥 QUAN TRỌNG: GỬI patientInfo CHO CẢ GUEST + PROXY
  // =========================
  if (payload.patientInfo) {
    const p = payload.patientInfo;

    body.patientInfo = {
      email: p.email,
      firstName: p.firstName,
      lastName: p.lastName || "",
      phone: p.phone || "",
      gender: p.gender || "",
      address: p.address || "",
    };
  }

  // =========================
  // PROXY FLAG (optional)
  // =========================
  if (payload.isProxy) {
    body.mode = "proxy";
  }

  console.log("FINAL BODY:", body); // 🔥 debug

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