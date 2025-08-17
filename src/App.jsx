import { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Header from "./components/Header.jsx";

const Home = lazy(() => import("./pages/Home.jsx"));
const Diferenciais = lazy(() => import("./pages/Diferenciais.jsx"));
const Materiais = lazy(() => import("./pages/Materiais.jsx"));

/** Ajuste estes imports/lazy se você tiver estas páginas */
const Agendamento = lazy(() => import("./pages/Agendamento.jsx"));
const Contato = lazy(() => import("./pages/Contato.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const MinhaConta = lazy(() => import("./pages/MinhaConta.jsx"));
const MinhasReservas = lazy(() => import("./pages/MinhasReservas.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function Layout() {
  return (
    <>
      <Header />
      <main style={{ minHeight: "60vh" }}>
        <Outlet />
      </main>
    </>
  );
}

function Fallback() {
  return <div className="container" style={{ padding: 24 }}>Carregando…</div>;
}

function NotFound() {
  return (
    <div className="container" style={{ padding: 24 }}>
      <h1 className="h2">Página não encontrada</h1>
      <p className="small" style={{ color: "var(--muted)" }}>O link pode ter sido movido.</p>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Fallback />}>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/diferenciais" element={<Diferenciais />} />
          <Route path="/materiais" element={<Materiais />} />
          <Route path="/agendamento" element={<Agendamento />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/login" element={<Login />} />
          <Route path="/minha-conta" element={<MinhaConta />} />
          <Route path="/minhas-reservas" element={<MinhasReservas />} />
          <Route path="/admin" element={<Admin />} />
          {/* redireciona legado */}
          <Route path="/quadras" element={<Navigate to="/" replace />} />
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
