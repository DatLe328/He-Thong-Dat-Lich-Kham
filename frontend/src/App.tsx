import { Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* redirect nhanh */}
      <Route path="/login" element={<Navigate to="/auth?tab=login" replace />} />
      <Route path="/register" element={<Navigate to="/auth?tab=register" replace />} />

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

export default App;