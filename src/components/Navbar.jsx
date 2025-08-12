// src/components/Navbar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut as appSignOut } from "../lib/firebase";
import NavMobile from "./NavMobile";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid var(--border)",
  background: isActive ? "linear-gradient(135deg, var(--brand), var(--brand-300))" : "#ffffff10",
  color: isActive ? "#111" : "var(--text)",
  textDecoration: "none",
});

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false); // dropdown desktop
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <header className="nav">
      <div className="nav-left" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {/* Hamburger (mobile) */}
        <button className="btn show-sm" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
          ☰
        </button>

        <NavLink to="/" className="brand" style={{ textDecoration: "none", fontWeight: 900, fontSize: 18 }}>
          Meu Site Padel
        </NavLink>

        {/* Links desktop */}
        <div className="hide-sm" style={{ display: "flex", gap: 10 }}>
          <NavLink to="/agendamento" style={linkStyle}>Agendamento</NavLink>
          <NavLink to="/hoje" style={linkStyle}>Hoje</NavLink>
          <NavLink to="/materiais" style={linkStyle}>Materiais</NavLink>
          <NavLink to="/diferenciais" style={linkStyle}>Diferenciais</NavLink>
          <NavLink to="/contato" style={linkStyle}>Contato</NavLink>
          {isAdmin && <NavLink to="/admin" style={linkStyle}>Admin</NavLink>}
        </div>
      </div>

      <div className="nav-right" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {user ? (
          <div ref={ref} className="hide-sm" style={{ position: "relative" }}>
            <button className="btn" onClick={() => setOpen(v => !v)} aria-haspopup="menu" aria-expanded={open}>
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  style={{ width: 28, height: 28, borderRadius: 999, objectFit: "cover", marginRight: 8, border: "1px solid var(--border)" }}
                />
              ) : (
                <span className="badge" style={{ marginRight: 8 }}>{(user.displayName || user.email || "U").slice(0, 1)}</span>
              )}
              {user.displayName || user.email || "Você"}
              {isAdmin && <span className="badge" style={{ marginLeft: 6 }}>🔑 admin</span>}
            </button>

            {open && (
              <div
                role="menu"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  minWidth: 220,
                  background: "rgba(17,17,19,.98)",
                  border: "1px solid var(--border)",
                  borderRadius: 14,
                  boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                  padding: 8,
                  zIndex: 60,
                }}
              >
                <MenuItem onClick={() => { setOpen(false); navigate("/minha-conta"); }}>Minha conta</MenuItem>
                <MenuItem onClick={() => { setOpen(false); navigate("/minhas-reservas"); }}>Minhas reservas</MenuItem>
                <hr className="divider" />
                <MenuItem onClick={async () => { setOpen(false); await appSignOut(); navigate("/"); }}>Sair</MenuItem>
              </div>
            )}
          </div>
        ) : (
          <NavLink className="btn hide-sm" to="/login">Entrar</NavLink>
        )}
      </div>

      {/* Drawer mobile */}
      <NavMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function MenuItem({ children, onClick }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="btn"
      style={{ width: "100%", justifyContent: "flex-start", background: "#ffffff10", borderColor: "var(--border)", margin: 2 }}
    >
      {children}
    </button>
  );
}
