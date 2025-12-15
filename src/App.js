import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { Dashboard } from "./pages/Dashboard";

function AppWrapper() {
  const navigate = useNavigate();

  // 🔥 Fonction appelée quand le login est bon
  const handleAuthSuccess = (token, user) => {
    // Stocker si nécessaire
    localStorage.setItem("userToken", token);
    localStorage.setItem("userData", JSON.stringify(user));

    // Redirection vers classroom
    navigate("/Dashboard");
  };

  return (
    <Routes>
      {/* 1️⃣ Première page : HomePage */}
      <Route path="/" element={<HomePage onSuccess={handleAuthSuccess} />} />

      {/* 2️⃣ Page classroom */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}
