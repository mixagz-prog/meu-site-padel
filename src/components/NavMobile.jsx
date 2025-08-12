// src/components/NavMobile.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signOut as appSignOut } from "../lib/firebase";

export default function NavMobile({ open, onClose }) {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <>
      <div className="sheet-backdrop" style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }} onClick={onClose} />
      <aside className="sheet" style={{ transform: open ? "translateX(0)" : "translateX(105%)" }} aria-hidden={!open}>
        <div className="h2" style={{ marginBottom: 10 }}>Menu</div>

        <nav style={{ display: "grid", gap: 8 }}>
          <button className="btn" onClick={() => go("/")}>Início</button>
          <button className="btn" onClick={() => go("/agendamento")}>Agendamento</button>
          <button className="btn" onClick={() => go("/hoje")}>Hoje</button>
          <button className="btn" onClick={() => go("/materiais")}>Materiais</button>
          <button className="btn" onClick={() => go("/diferenciais")}>Diferenciais</button>
          <button className="btn" onClick={() => go("/contato")}>Contato</button>

          {user && (
            <>
              <hr className="divider" />
              <button className="btn" onClick={() => go("/minha-conta")}>Minha conta</button>
              <button className="btn" onClick={() => go("/minhas-reservas")}>Minhas reservas</button>
            </>
          )}

          {isAdmin && <button className="btn" onClick={() => go("/admin")}>Admin</button>}
        </nav>

        <hr className="divider" />

        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
          {user ? (
            <button className="btn" onClick={async () => { await appSignOut(); onClose(); navigate("/"); }}>
              Sair
            </button>
          ) : (
            <button className="btn" onClick={() => go("/login")}>Entrar</button>
          )}
        </div>
      </aside>
    </>
  );
}
