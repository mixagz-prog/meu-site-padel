// src/components/Header.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut } from "../lib/firebase";

/* ========== LOGO (inalterado) ========== */
function Logo() {
  return (
    <NavLink
      to="/"
      className="logo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
      }}
      aria-label="Reserva Padel — Início"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="currentColor" opacity=".10" />
        <path
          d="M6.5 15.2c2.9-1.5 8.1-1.5 11 0"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M6 9.25h12"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
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
        title="Reserva Padel"
      >
        Reserva Padel
      </span>
    </NavLink>
  );
}

/* ========== helpers ========== */
const cx = (...a) => a.filter(Boolean).join(" ");

/** Mantém o estilo atual dos botões do menu */
function PillLink({ to, children, end, onClick, className }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx("pill", "pill--primary", isActive && "pill--active", className)
      }
      onClick={onClick}
    >
      {children}
    </NavLink>
  );
}

/* ========== Header ========== */
export default function Header() {
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <header className={cx("nav nav--elevated", scrolled && "nav--scrolled")}>
        <div className="container nav__row">
          {/* Logo */}
          <Logo />

          {/* Links desktop (REMOVIDO: Quadras) */}
          <nav className="nav__center hide-sm">
            <PillLink to="/diferenciais">Diferenciais</PillLink>
            <PillLink to="/materiais">Materiais</PillLink>
            <PillLink to="/agendamento">Agendamento</PillLink>
            <PillLink to="/contato">Contato</PillLink>
            {isAdmin && <PillLink to="/admin">Admin</PillLink>}
          </nav>

          {/* Ações à direita */}
          <div className="nav__right">
            {user ? (
              <>
                <PillLink to="/minhas-reservas" className="hide-sm">
                  Minhas Reservas
                </PillLink>
                <PillLink to="/minha-conta" className="hide-sm">
                  Minha Conta
                </PillLink>
                <button
                  className="pill pill--ghost"
                  onClick={async () => {
                    await signOut();
                    nav("/");
                  }}
                  title="Sair"
                >
                  Sair
                </button>
              </>
            ) : (
              <NavLink to="/login" className="pill pill--primary">
                Entrar
              </NavLink>
            )}

            {/* Burger (apenas ícone) */}
            <button
              className="pill pill--ghost show-sm"
              aria-label="Menu"
              onClick={() => setOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* linha laranja animada */}
        <div className="nav__underbar" aria-hidden="true" />
      </header>

      {/* Drawer mobile (REMOVIDO: Quadras) */}
      {open && (
        <>
          <div className="sheet-backdrop" onClick={close} />
          <aside className="sheet">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Logo />
              <button
                className="pill pill--ghost"
                aria-label="Fechar"
                onClick={close}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <PillLink to="/diferenciais" onClick={close}>
                Diferenciais
              </PillLink>
              <PillLink to="/materiais" onClick={close}>
                Materiais
              </PillLink>
              <PillLink to="/agendamento" onClick={close}>
                Agendamento
              </PillLink>
              <PillLink to="/contato" onClick={close}>
                Contato
              </PillLink>
              {isAdmin && (
                <PillLink to="/admin" onClick={close}>
                  Admin
                </PillLink>
              )}

              <div className="divider" />

              {user ? (
                <>
                  <PillLink to="/minhas-reservas" onClick={close}>
                    Minhas Reservas
                  </PillLink>
                  <PillLink to="/minha-conta" onClick={close}>
                    Minha Conta
                  </PillLink>
                  <button
                    className="pill pill--ghost"
                    onClick={async () => {
                      await signOut();
                      nav("/");
                      close();
                    }}
                  >
                    Sair
                  </button>
                </>
              ) : (
                <NavLink
                  to="/login"
                  className="pill pill--primary"
                  onClick={close}
                >
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
