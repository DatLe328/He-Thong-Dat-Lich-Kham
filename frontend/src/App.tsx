import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SearchResultsPage from "./pages/SearchResultsPage";


function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route
          path="/login"
          element={<Navigate to="/auth?tab=login" replace />}
        />
        <Route
          path="/register"
          element={<Navigate to="/auth?tab=register" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/profile" element={<ProfilePage />} />

      </Route>
    </Routes>
  );
}

export default App;
