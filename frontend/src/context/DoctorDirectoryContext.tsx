import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchAllDoctors } from "../lib/doctors";
import { DirectoryDoctor } from "../types";

type DoctorDirectoryValue = {
  doctors: DirectoryDoctor[];
  featuredDoctors: DirectoryDoctor[];
  specialties: string[];
  totalDoctors: number;
  averageRating: number | null;
  loading: boolean;
  error: string;
};

const DoctorDirectoryContext = createContext<DoctorDirectoryValue | undefined>(
  undefined
);

export function DoctorDirectoryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [doctors, setDoctors] = useState<DirectoryDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDoctors = async () => {
      try {
        const items = await fetchAllDoctors();

        if (!cancelled) {
          setDoctors(items);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setDoctors([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Không thể đồng bộ danh sách bác sĩ từ backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDoctors();

    return () => {
      cancelled = true;
    };
  }, []);

  const specialties = useMemo(
    () =>
      Array.from(
        new Set(
          doctors.flatMap((doctor) =>
            doctor.specialties.filter(
              (specialty) => specialty !== "Chưa cập nhật chuyên khoa"
            )
          )
        )
      ).sort((left, right) => left.localeCompare(right, "vi")),
    [doctors]
  );

  const featuredDoctors = useMemo(
    () => doctors.slice(0, 3),
    [doctors]
  );

  const averageRating = useMemo(() => {
    if (!doctors.length) {
      return null;
    }

    const totalRating = doctors.reduce((sum, doctor) => sum + doctor.rating, 0);
    return Math.round((totalRating / doctors.length) * 10) / 10;
  }, [doctors]);

  return (
    <DoctorDirectoryContext.Provider
      value={{
        doctors,
        featuredDoctors,
        specialties,
        totalDoctors: doctors.length,
        averageRating,
        loading,
        error,
      }}
    >
      {children}
    </DoctorDirectoryContext.Provider>
  );
}

export function useDoctorDirectory() {
  const context = useContext(DoctorDirectoryContext);

  if (!context) {
    throw new Error(
      "useDoctorDirectory must be used within DoctorDirectoryProvider"
    );
  }

  return context;
}
