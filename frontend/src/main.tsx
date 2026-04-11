import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DoctorDirectoryProvider } from "./context/DoctorDirectoryContext";

import "./styles/global.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const application = (
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DoctorDirectoryProvider>
          <App />
        </DoctorDirectoryProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      {application}
    </GoogleOAuthProvider>
  ) : (
    application
  )
);
