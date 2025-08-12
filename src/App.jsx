// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Páginas
import Home from "./pages/Home.jsx";
import Agendamento from "./pages/Agendamento.jsx";
import Hoje from "./pages/Hoje.jsx";
import Materiais from "./pages/Materiais.jsx";
import Diferenciais from "./pages/Diferenciais.jsx";
import Contato from "./pages/Contato.jsx";
import Login from "./pages/Login.jsx";
import MinhasReservas from "./pages/MinhasReservas.jsx";
import MinhaConta from "./pages/MinhaConta.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* públicas */}
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/hoje" element={<Hoje />} />
        <Route path="/materiais" element={<Materiais />} />
        <Route path="/diferenciais" element={<Diferenciais />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/login" element={<Login />} />

        {/* protegidas */}
        <Route
          path="/minhas-reservas"
          element={
            <ProtectedRoute>
              <MinhasReservas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/minha-conta"
          element={
            <ProtectedRoute>
              <MinhaConta />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
