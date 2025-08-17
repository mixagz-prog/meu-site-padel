// src/components/Header.jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../lib/firebase";

/* ===== LOGO — mantido exatamente como você enviou ===== */
function Logo() {
  return (
    <NavLink
      to="/"
      className="logo"
      style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}
      aria-label="Reserva Padel — Início"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="currentColor" opacity=".10" />
        <path d="M6.5 15.2c2.9-1.5 8.1-1.5 11 0" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M6 9.25h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <span
        className="wordmark-epic"
        style={{
          fontWeight: 900,
          letterSpacing: 0.4,
          fontSize: 18,
          lineHeight: 1,
          display: "inline-block",
          backgroundImage:
            "linear-gradient(90deg,#FFE082 0%,#FFC107 22%,#FF8F00 48%,#FF6F00 72%,#FF3D00 100%)",
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 2px 8px rgba(255, 140, 0, .25))",
          transform: "translateY(1px)",
          whiteSpace: "nowrap",
        }}
      >
        Reserva Padel
      </span>
    </NavLink>
  );
}

/* util */
const cx = (...a) => a.filter(Boolean).join(" ");

function PillLink({ to, end, children, onClick, className }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cx("navX-pill", isActive && "active", className)}
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
}

export default function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [drawer, setDrawer] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // fecha dropdown ao clicar fora
  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, []);

  return (
    <>
      <header className="navX">
        <div className="container navX-inner">
          {/* esquerda */}
          <div className="navX-left">
            <button
              className="navX-burger show-sm"
              aria-label="Abrir menu"
              onClick={() => setDrawer(true)}
            >
              <span /><span /><span />
            </button>
            <Logo />
          </div>

          {/* centro (desktop) */}
          <nav className="navX-center hide-sm" aria-label="Navegação principal">
            <PillLink to="/diferenciais">Diferenciais</PillLink>
            <PillLink to="/materiais">Materiais</PillLink>
            <PillLink to="/agendamento">Agendamento</PillLink>
            <PillLink to="/contato">Contato</PillLink>
            {isAdmin && <PillLink to="/admin">Admin</PillLink>}
          </nav>

          {/* direita */}
          <div className="navX-right">
            {user ? (
              <div className="navX-userWrap" ref={menuRef}>
                <button
                  type="button"
                  className="navX-userBtn"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title={user.displayName || user.email || "Conta"}
                >
                  {user.photoURL ? (
                    <img className="navX-avatar" src={user.photoURL} alt="" />
                  ) : (
                    <span className="navX-avatar navX-avatar--fallback">
                      {(user.displayName || user.email || "U").slice(0, 1)}
                    </span>
                  )}
                  <span className="navX-username">{user.displayName || user.email || "Você"}</span>
                  {isAdmin && <span className="navX-chip navX-chip--admin">admin</span>}
                </button>

                {menuOpen && (
                  <div className="navX-menu" role="menu">
                    <button className="navX-menuItem" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/minhas-reservas"); }}>
                      Minhas reservas
                    </button>
                    <button className="navX-menuItem" role="menuitem" onClick={() => { setMenuOpen(false); navigate("/minha-conta"); }}>
                      Minha conta
                    </button>
                    <div className="navX-sep" />
                    <button
                      className="navX-menuItem navX-menuItem--danger"
                      role="menuitem"
                      onClick={async () => { setMenuOpen(false); await signOut(); navigate("/"); }}
                    >
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink to="/login" className="navX-cta">Entrar</NavLink>
            )}
          </div>
        </div>
        <div className="navX-glow" aria-hidden="true" />
      </header>

      {/* Drawer mobile */}
      {drawer && (
        <>
          <div className="sheet-backdrop" onClick={() => setDrawer(false)} />
          <aside className="sheet" aria-label="Menu">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Logo />
              <button className="navX-pill" onClick={() => setDrawer(false)} aria-label="Fechar menu">
                Fechar
              </button>
            </div>
            <nav style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <PillLink to="/diferenciais" onClick={() => setDrawer(false)}>Diferenciais</PillLink>
              <PillLink to="/materiais" onClick={() => setDrawer(false)}>Materiais</PillLink>
              <PillLink to="/agendamento" onClick={() => setDrawer(false)}>Agendamento</PillLink>
              <PillLink to="/contato" onClick={() => setDrawer(false)}>Contato</PillLink>
              {isAdmin && <PillLink to="/admin" onClick={() => setDrawer(false)}>Admin</PillLink>}

              <div className="divider" />

              {user ? (
                <>
                  <PillLink to="/minhas-reservas" onClick={() => setDrawer(false)}>Minhas reservas</PillLink>
                  <PillLink to="/minha-conta" onClick={() => setDrawer(false)}>Minha conta</PillLink>
                  <button
                    type="button"
                    className="navX-pill"
                    onClick={async () => { await signOut(); navigate("/"); setDrawer(false); }}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <NavLink to="/login" className="navX-cta" onClick={() => setDrawer(false)}>
                  Entrar
                </NavLink>
              )}
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
