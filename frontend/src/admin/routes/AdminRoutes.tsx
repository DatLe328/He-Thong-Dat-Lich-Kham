import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import StatisticsPage from "../pages/StatisticsPage";
import UsersPage from "../pages/UsersPage";
import DoctorsPage from "../pages/DoctorsPage";
import AppointmentsPage from "../pages/AppointmentsPage";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<UsersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="doctors" element={<DoctorsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
      </Route>
    </Routes>
  );
}