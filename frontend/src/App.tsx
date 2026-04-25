import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";

import AuthPage from "./pages/AuthPage";
import DoctorAppointmentsPage from "./pages/DoctorAppointmentsPage";
import DoctorDetailPage from "./pages/DoctorDetailPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SearchResultsPage from "./pages/SearchResultsPage";
import AppointmentList from "./pages/AppointmentListPage";
import AdminRoutes from "./admin/routes/AdminRoutes";

function App() {
  return (
    <Routes>


      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
        <Route
          path="/doctors/:doctorId/appointments"
          element={<DoctorAppointmentsPage />}
        />

        <Route path="/search" element={<SearchResultsPage />} />

        <Route
          path="/login"
          element={<Navigate to="/auth?tab=login" replace />}
        />
        <Route
          path="/register"
          element={<Navigate to="/auth?tab=register" replace />}
        />

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/appointments" element={<AppointmentList />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>




    </Routes>
  );
}

export default App;