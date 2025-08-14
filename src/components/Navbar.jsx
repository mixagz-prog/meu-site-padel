// src/components/Navbar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../lib/firebase";

export default function Navbar() {
  const { user } = useAuth();
  const nav = useNavigate();

  return (
    <header className="nav">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <NavLink to="/" className="brand" style={{ fontSize: 18 }}>
          Reserva <span style={{ color: "var(--brand-300)" }}>Padel</span>
        </NavLink>
      </div>

      <nav
        className="hide-sm"
        aria-label="Navegação principal"
        style={{ display: "flex", gap: 14, alignItems: "center" }}
      >
        <NavLink to="/quadras">Quadras</NavLink>
        <NavLink to="/diferenciais">Diferenciais</NavLink>
        <NavLink to="/materiais">Materiais</NavLink>
        <NavLink to="/agendamento">Agendamento</NavLink>
        <NavLink to="/contato">Contato</NavLink>
        {user && <NavLink to="/minhas-reservas">Minhas Reservas</NavLink>}
        {user && <NavLink to="/minha-conta">Minha Conta</NavLink>}
        {user && <NavLink to="/admin">Admin</NavLink>}

        {!user ? (
          <button
            className="btn-nav btn-nav-primary"
            onClick={() => nav("/login")}
            aria-label="Entrar"
          >
            Entrar
          </button>
        ) : (
          <button
            className="btn-nav"
            onClick={async () => {
              try { await signOut(); } catch {}
              nav("/", { replace: true });
            }}
          >
            Sair
          </button>
        )}
      </nav>
    </header>
  );
}
