// src/components/Navbar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { signOut as appSignOut } from "../lib/firebase";
import NavMobile from "./NavMobile";
import { CalendarDays, Layers, ShieldCheck, Mail } from "lucide-react";

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current) return; if (!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  return (
    <header className="nav">
      <div className="nav-inner container">
        {/* ESQUERDA */}
        <div className="nav-left">
          <button className="hamb show-sm" aria-label="Abrir menu" onClick={() => setMobileOpen(true)}>
            <span/><span/><span/>
          </button>

          <NavLink to="/" className="brand-pill">
            <span className="brand-dot" aria-hidden />
            Reserva Padel
          </NavLink>
        </div>

        {/* CENTRO – links como “pílulas” */}
        <nav className="nav-pills hide-sm" aria-label="Principal">
          <NavPill to="/diferenciais" icon={<ShieldCheck size={16} />}>Diferenciais</NavPill>
          <NavPill to="/materiais"    icon={<Layers size={16} />}>Materiais</NavPill>
          <NavPill to="/agendamento"  icon={<CalendarDays size={16} />}>Agendamento</NavPill>
          <NavPill to="/contato"      icon={<Mail size={16} />}>Contato</NavPill>
          {isAdmin && <NavPill to="/admin">Admin</NavPill>}
        </nav>

        {/* DIREITA – sessão/entrar */}
        <div className="nav-right">
          {user ? (
            <div ref={ref} className="user-menu hide-sm">
              <button className="btn user-trigger" onClick={() => setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open}>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="avatar" />
                ) : (
                  <span className="initial">{(user.displayName || user.email || "U").slice(0,1)}</span>
                )}
                <span className="user-name">{user.displayName || user.email || "Você"}</span>
                {isAdmin && <span className="chip-admin">admin</span>}
              </button>

              {open && (
                <div role="menu" className="menu">
                  <MenuItem onClick={() => { setOpen(false); navigate("/minha-conta"); }}>Minha conta</MenuItem>
                  <MenuItem onClick={() => { setOpen(false); navigate("/minhas-reservas"); }}>Minhas reservas</MenuItem>
                  <hr className="divider" />
                  <MenuItem onClick={async () => { setOpen(false); await appSignOut(); navigate("/"); }}>Sair</MenuItem>
                </div>
              )}
            </div>
          ) : (
            <NavLink className="nav-cta hide-sm" to="/login">Entrar</NavLink>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      <NavMobile open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}

function NavPill({ to, icon, children }) {
  return (
    <NavLink to={to} className={({isActive}) => `nav-pill ${isActive ? "active" : ""}`}>
      {icon}{children}
    </NavLink>
  );
}

function MenuItem({ children, onClick }) {
  return <button role="menuitem" onClick={onClick} className="menu-item">{children}</button>;
}
