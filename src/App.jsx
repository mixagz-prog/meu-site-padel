// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Páginas
import Home from "./pages/Home.jsx";
import Quadras from "./pages/Quadras.jsx";
import Agendamento from "./pages/Agendamento.jsx";
import Sobre from "./pages/Sobre.jsx";
import Contato from "./pages/Contato.jsx";
import Hoje from "./pages/Hoje.jsx";
import Materiais from "./pages/Materiais.jsx";
import Diferenciais from "./pages/Diferenciais.jsx";
import Login from "./pages/Login.jsx";
import MinhasReservas from "./pages/MinhasReservas.jsx";
import MinhaConta from "./pages/MinhaConta.jsx";
import Admin from "./pages/Admin.jsx";
import Verificar from "./pages/Verificar.jsx";
import Aguarde from "./pages/Aguarde.jsx";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* públicas */}
        <Route path="/quadras" element={<Quadras />} />
        <Route path="/diferenciais" element={<Diferenciais />} />
        <Route path="/materiais" element={<Materiais />} />
        <Route path="/agendamento" element={<Agendamento />} />
        <Route path="/hoje" element={<Hoje />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/contato" element={<Contato />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verificar" element={<Verificar />} />
        <Route path="/aguarde" element={<Aguarde />} />

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
            <ProtectedRoute requireAdmin>
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
