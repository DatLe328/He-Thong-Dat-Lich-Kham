import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { getDoctorById, getScheduleRecord } from "../data/doctors";
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  ResolvedScheduleDay,
  ScheduleOverride,
} from "../types";
import {
  classifySymptoms,
  getAppointmentDateLabel,
  getNextAppointmentDate,
  getResolvedSchedule,
} from "../utils/clinic";

type ClinicContextValue = {
  appointments: Appointment[];
  scheduleOverrides: ScheduleOverride[];
  getDoctorSchedule: (doctorId: string) => ResolvedScheduleDay[];
  createAppointment: (input: CreateAppointmentInput) => Promise<Appointment>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
    cancelReason?: string
  ) => void;
  addCustomSlot: (doctorId: string, dayKey: string, hour: string) => void;
  blockSlot: (doctorId: string, dayKey: string, hour: string) => void;
  unblockSlot: (doctorId: string, dayKey: string, hour: string) => void;
  removeCustomSlot: (doctorId: string, dayKey: string, hour: string) => void;
};

const APPOINTMENTS_STORAGE_KEY = "front-clinic-appointments";
const SCHEDULE_STORAGE_KEY = "front-clinic-schedule-overrides";

const ClinicContext = createContext<ClinicContextValue | undefined>(undefined);

function createSeedAppointments(): Appointment[] {
  return [
    {
      appointmentId: "appt-001",
      patientId: "default-user",
      patientName: "Khách Hàng Medigo",
      patientPhone: "0909686868",
      patientEmail: "khachhang@medigoclinic.vn",
      doctorId: "tran-minh-an",
      scheduleId: "sch-tran-minh-an-tue-1",
      clinicId: "clinic-medigo-central",
      dayKey: "tue",
      dayLabel: "Thứ 3",
      hour: "09:00",
      appointmentDate: getNextAppointmentDate("tue", "09:00").toISOString(),
      reason: "Tim đập nhanh và chóng mặt nhẹ khi làm việc căng thẳng.",
      symptomGroup: "tim-mach",
      symptomGroupLabel: "Nhóm triệu chứng tim mạch",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      appointmentId: "appt-002",
      patientId: "patient-002",
      patientName: "Nguyễn Phương Linh",
      patientPhone: "0911222333",
      patientEmail: "linh.nguyen@example.com",
      doctorId: "le-thao-nguyen",
      scheduleId: "sch-le-thao-nguyen-fri-1",
      clinicId: "clinic-skinlab",
      dayKey: "fri",
      dayLabel: "Thứ 6",
      hour: "14:00",
      appointmentDate: getNextAppointmentDate("fri", "14:00").toISOString(),
      reason: "Da nổi mẩn đỏ và ngứa sau khi đổi mỹ phẩm.",
      symptomGroup: "da-lieu",
      symptomGroupLabel: "Nhóm triệu chứng da liễu",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      appointmentId: "appt-003",
      patientId: "patient-003",
      patientName: "Trần Minh Khang",
      patientPhone: "0901234567",
      patientEmail: "khang.tran@example.com",
      doctorId: "nguyen-thu-ha",
      scheduleId: "sch-nguyen-thu-ha-thu-1",
      clinicId: "clinic-kidcare",
      dayKey: "thu",
      dayLabel: "Thứ 5",
      hour: "10:00",
      appointmentDate: getNextAppointmentDate("thu", "10:00").toISOString(),
      reason: "Bé sốt nhẹ và biếng ăn từ tối hôm qua.",
      symptomGroup: "nhi-khoa",
      symptomGroupLabel: "Nhóm triệu chứng nhi khoa",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function normalizeStoredAppointment(
  record: Record<string, unknown>
): Appointment | null {
  const doctorId = String(record.doctorId ?? "");

  if (!doctorId) {
    return null;
  }

  const doctor = getDoctorById(doctorId);
  const dayKey = String(record.dayKey ?? "");
  const hour = String(record.hour ?? "");
  const scheduleRecord =
    typeof record.scheduleId === "string" && record.scheduleId.length > 0
      ? { scheduleId: record.scheduleId }
      : getScheduleRecord(doctorId, dayKey, hour);

  return {
    appointmentId: String(record.appointmentId ?? record.id ?? `appt-${crypto.randomUUID()}`),
    patientId: String(record.patientId ?? ""),
    patientName: String(record.patientName ?? "Bệnh nhân"),
    patientPhone: String(record.patientPhone ?? ""),
    patientEmail: String(record.patientEmail ?? ""),
    doctorId,
    scheduleId: String(scheduleRecord?.scheduleId ?? ""),
    clinicId: String(record.clinicId ?? doctor?.clinicId ?? ""),
    dayKey,
    dayLabel: String(record.dayLabel ?? ""),
    hour,
    appointmentDate: String(record.appointmentDate ?? new Date().toISOString()),
    reason: String(record.reason ?? record.symptomDescription ?? ""),
    symptomGroup: String(record.symptomGroup ?? "tong-quat"),
    symptomGroupLabel: String(record.symptomGroupLabel ?? "Sàng lọc triệu chứng chung"),
    note: typeof record.note === "string" ? record.note : undefined,
    status: (record.status as AppointmentStatus) ?? "pending",
    cancelReason:
      typeof record.cancelReason === "string" ? record.cancelReason : undefined,
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    updatedAt: String(record.updatedAt ?? record.createdAt ?? new Date().toISOString()),
  };
}

function readAppointmentsFromStorage() {
  const savedAppointments = localStorage.getItem(APPOINTMENTS_STORAGE_KEY);

  if (!savedAppointments) {
    const seedAppointments = createSeedAppointments();
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(seedAppointments));
    return seedAppointments;
  }

  try {
    const parsedAppointments = JSON.parse(savedAppointments) as Record<string, unknown>[];

    const normalizedAppointments = parsedAppointments
      .map((record) => normalizeStoredAppointment(record))
      .filter((record): record is Appointment => record !== null);

    return normalizedAppointments;
  } catch {
    const seedAppointments = createSeedAppointments();
    localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(seedAppointments));
    return seedAppointments;
  }
}

function readScheduleOverrides() {
  const savedOverrides = localStorage.getItem(SCHEDULE_STORAGE_KEY);

  if (!savedOverrides) {
    return [] as ScheduleOverride[];
  }

  try {
    return JSON.parse(savedOverrides) as ScheduleOverride[];
  } catch {
    localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    return [] as ScheduleOverride[];
  }
}

function removeBlockOverride(
  overrides: ScheduleOverride[],
  doctorId: string,
  dayKey: string,
  hour: string
) {
  return overrides.filter(
    (override) =>
      !(
        override.doctorId === doctorId &&
        override.dayKey === dayKey &&
        override.hour === hour &&
        override.kind === "block"
      )
  );
}

function removeAddOverride(
  overrides: ScheduleOverride[],
  doctorId: string,
  dayKey: string,
  hour: string
) {
  return overrides.filter(
    (override) =>
      !(
        override.doctorId === doctorId &&
        override.dayKey === dayKey &&
        override.hour === hour &&
        override.kind === "add"
      )
  );
}

export function ClinicProvider({ children }: { children: ReactNode }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [scheduleOverrides, setScheduleOverrides] = useState<ScheduleOverride[]>([]);

  useEffect(() => {
    setAppointments(readAppointmentsFromStorage());
    setScheduleOverrides(readScheduleOverrides());
  }, []);

  useEffect(() => {
    if (appointments.length > 0) {
      localStorage.setItem(APPOINTMENTS_STORAGE_KEY, JSON.stringify(appointments));
    }
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(scheduleOverrides));
  }, [scheduleOverrides]);

  const getDoctorSchedule = (doctorId: string) => {
    const doctor = getDoctorById(doctorId);

    return doctor ? getResolvedSchedule(doctor, appointments, scheduleOverrides) : [];
  };

  const createAppointment = async (input: CreateAppointmentInput) => {
    const doctor = getDoctorById(input.doctorId);

    if (!doctor) {
      throw new Error("Không tìm thấy bác sĩ để đặt lịch.");
    }

    const schedule = getResolvedSchedule(doctor, appointments, scheduleOverrides);
    const matchedDay = schedule.find((day) => day.key === input.dayKey);
    const matchedSlot = matchedDay?.slots.find((slot) => slot.hour === input.hour);

    if (!matchedDay || !matchedSlot || matchedSlot.status !== "available") {
      throw new Error("Khung giờ bạn chọn không còn trống. Vui lòng chọn giờ khác.");
    }

    const classification = classifySymptoms(input.reason, doctor.specialty);
    const scheduleRecord = getScheduleRecord(input.doctorId, input.dayKey, input.hour);
    const appointment: Appointment = {
      appointmentId: `appt-${crypto.randomUUID()}`,
      patientId: input.patientId,
      patientName: input.patientName.trim(),
      patientPhone: input.patientPhone.trim(),
      patientEmail: input.patientEmail.trim().toLowerCase(),
      doctorId: doctor.id,
      scheduleId: scheduleRecord?.scheduleId ?? "",
      clinicId: doctor.clinicId,
      dayKey: input.dayKey,
      dayLabel: matchedDay.label,
      hour: input.hour,
      appointmentDate: getNextAppointmentDate(input.dayKey, input.hour).toISOString(),
      reason: input.reason.trim(),
      symptomGroup: classification.groupId,
      symptomGroupLabel: classification.groupLabel,
      note: input.note?.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAppointments((currentAppointments) => [...currentAppointments, appointment]);

    return appointment;
  };

  const updateAppointmentStatus = (
    appointmentId: string,
    status: AppointmentStatus,
    cancelReason?: string
  ) => {
    setAppointments((currentAppointments) =>
      currentAppointments.map((appointment) =>
        appointment.appointmentId === appointmentId
          ? {
              ...appointment,
              status,
              cancelReason:
                status === "cancelled"
                  ? cancelReason ?? appointment.cancelReason ?? "Bệnh nhân yêu cầu hủy lịch."
                  : undefined,
              updatedAt: new Date().toISOString(),
            }
          : appointment
      )
    );
  };

  const addCustomSlot = (doctorId: string, dayKey: string, hour: string) => {
    setScheduleOverrides((currentOverrides) => {
      const withoutBlock = removeBlockOverride(currentOverrides, doctorId, dayKey, hour);
      const existed = withoutBlock.some(
        (override) =>
          override.doctorId === doctorId &&
          override.dayKey === dayKey &&
          override.hour === hour &&
          override.kind === "add"
      );

      if (existed) {
        return withoutBlock;
      }

      return [
        ...withoutBlock,
        {
          id: `slot-${crypto.randomUUID()}`,
          doctorId,
          dayKey,
          hour,
          kind: "add",
        },
      ];
    });
  };

  const blockSlot = (doctorId: string, dayKey: string, hour: string) => {
    setScheduleOverrides((currentOverrides) => {
      const withoutExistingBlock = removeBlockOverride(
        currentOverrides,
        doctorId,
        dayKey,
        hour
      );

      return [
        ...withoutExistingBlock,
        {
          id: `block-${crypto.randomUUID()}`,
          doctorId,
          dayKey,
          hour,
          kind: "block",
        },
      ];
    });
  };

  const unblockSlot = (doctorId: string, dayKey: string, hour: string) => {
    setScheduleOverrides((currentOverrides) =>
      removeBlockOverride(currentOverrides, doctorId, dayKey, hour)
    );
  };

  const removeCustomSlot = (doctorId: string, dayKey: string, hour: string) => {
    setScheduleOverrides((currentOverrides) =>
      removeAddOverride(currentOverrides, doctorId, dayKey, hour)
    );
  };

  return (
    <ClinicContext.Provider
      value={{
        appointments,
        scheduleOverrides,
        getDoctorSchedule,
        createAppointment,
        updateAppointmentStatus,
        addCustomSlot,
        blockSlot,
        unblockSlot,
        removeCustomSlot,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);

  if (!context) {
    throw new Error("useClinic must be used within ClinicProvider");
  }

  return context;
}
