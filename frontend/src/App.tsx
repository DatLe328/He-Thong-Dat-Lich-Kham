import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import BookingPage from "./pages/BookingPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import DoctorsPage from "./pages/DoctorsPage";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import ScheduleManagementPage from "./pages/ScheduleManagementPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/doctors" element={<DoctorsPage />} />
        <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
        <Route path="/appointments/book" element={<BookingPage />} />
        <Route path="/appointments" element={<AppointmentsPage />} />
        <Route path="/schedule-management" element={<ScheduleManagementPage />} />
        <Route path="/login" element={<Navigate to="/auth?tab=login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/auth?tab=register" replace />}
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
