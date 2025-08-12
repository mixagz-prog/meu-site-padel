// src/pages/MinhaConta.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import {
  auth,
  db,
  ensureEmailVerification,
  signOut as appSignOut,
  findCpfByUid,
  setCpfMapping,
} from "../lib/firebase";
import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { isValidCpf, maskCpf, normalizeCpf } from "../utils/cpf";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
};

export default function MinhaConta() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [blockedUntil, setBlockedUntil] = useState(null);

  // CPF
  const [cpfInput, setCpfInput] = useState("");
  const [cpfSaved, setCpfSaved] = useState(null);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "adminBlocks", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setBlockedUntil(null);
        return;
      }
      const v = snap.data().blockedUntil;
      const dt = v?.toDate?.() || (v ? new Date(v) : null);
      setBlockedUntil(dt);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    setDisplayName(user?.displayName || "");
  }, [user?.displayName]);

  // carregar CPF salvo
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      const current = await findCpfByUid(user.uid);
      if (!mounted) return;
      setCpfSaved(current);
      setCpfInput(current ? maskCpf(current) : "");
    })();
    return () => { mounted = false; };
  }, [user]);

  const providers = useMemo(
    () => (user?.providerData || []).map((p) => p.providerId),
    [user?.providerData]
  );

  if (!user) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <div className="h2">Você precisa entrar</div>
            <p className="small" style={{ color: "var(--muted)" }}>
              Esta página é acessível somente para usuários logados.
            </p>
            <a className="btn btn-primary" href="/login">Ir para o login</a>
          </div>
        </div>
      </div>
    );
  }

  async function saveProfile() {
    const name = (displayName || "").trim();
    if (!name) {
      toast.info("Informe um nome.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name });
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Não foi possível salvar agora.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCpf() {
    const clean = normalizeCpf(cpfInput);
    if (!clean) return toast.info("Informe um CPF.");
    if (!isValidCpf(clean)) return toast.info("CPF inválido.");
    const res = await setCpfMapping(user.uid, clean);
    if (res.ok) { setCpfSaved(res.cpf); setCpfInput(maskCpf(res.cpf)); toast.success("CPF cadastrado!"); }
    else if (res.reason === "used") toast.error("Este CPF já está vinculado a outra conta.");
    else toast.error("Não foi possível salvar agora.");
  }

  const createdAt = user?.metadata?.creationTime ? new Date(user.metadata.creationTime) : null;
  const lastLoginAt = user?.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Minha conta</motion.h1>

        <div className="card mt-3" style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }}
              />
            ) : (
              <div className="badge" style={{ width: 64, height: 64, borderRadius: 12, fontSize: 22, justifyContent: "center" }}>
                {(user.displayName || user.email || "U").slice(0, 1)}
              </div>
            )}

            <div style={{ minWidth: 200 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>
                {user.displayName || "Sem nome"}
                {isAdmin && <span className="badge" style={{ marginLeft: 8 }}>🔑 admin</span>}
              </div>
              <div className="small" style={{ color: "var(--muted)" }}>UID: {user.uid}</div>
            </div>
          </div>

          {/* E-mail */}
          <div className="glass" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>E-mail e verificação</div>
            <div className="small" style={{ color: "var(--muted)" }}>
              {user.email ? (
                <>
                  {user.email}{" "}
                  {user.emailVerified ? (
                    <span className="badge" style={{ marginLeft: 6 }}>✔ verificado</span>
                  ) : (
                    <span className="badge badge-evento" style={{ marginLeft: 6 }}>não verificado</span>
                  )}
                </>
              ) : ("Sem e-mail vinculado")}
            </div>
            {!user.emailVerified && user.email && (
              <div>
                <button
                  className="btn"
                  onClick={async () => { await ensureEmailVerification(); toast.info("Se necessário, enviamos um e-mail de verificação."); }}
                >
                  Reenviar verificação
                </button>
              </div>
            )}
          </div>

          {/* Telefone */}
          <div className="glass" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Telefone</div>
            <div className="small" style={{ color: "var(--muted)" }}>
              {user.phoneNumber || "Nenhum telefone vinculado"}
            </div>
          </div>

          {/* Nome */}
          <div className="glass" style={{ padding: 12, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>Nome de exibição</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
              <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                {saving ? "Salvando…" : "Salvar"}
              </button>
            </div>
          </div>

          {/* CPF (opcional) */}
          <div className="glass" style={{ padding: 12, display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 700 }}>CPF (opcional)</div>
            <div className="small" style={{ color: "var(--muted)" }}>
              Vincule seu CPF para agilizar o check-in e evitar duplicidades.
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <input
                placeholder="000.000.000-00"
                value={maskCpf(cpfInput)}
                onChange={(e)=> setCpfInput(e.target.value)}
                disabled={!!cpfSaved}  /* se quiser travar após vincular */
              />
              {!cpfSaved ? (
                <button className="btn btn-primary" onClick={saveCpf}>Salvar CPF</button>
              ) : (
                <span className="badge">CPF vinculado</span>
              )}
            </div>
          </div>

          {/* Sessão */}
          <div className="glass" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Sessão</div>
            <div className="small" style={{ color: "var(--muted)" }}>
              Provedores: {(providers.length ? providers.join(", ") : "—")}
            </div>
            <div className="small" style={{ color: "var(--muted)" }}>
              Criado em: {createdAt ? createdAt.toLocaleString("pt-BR") : "—"}
            </div>
            <div className="small" style={{ color: "var(--muted)" }}>
              Último acesso: {lastLoginAt ? lastLoginAt.toLocaleString("pt-BR") : "—"}
            </div>
          </div>

          {/* Bloqueio */}
          {blockedUntil && blockedUntil.getTime() > Date.now() && (
            <div className="glass" style={{ padding: 12 }}>
              <div className="small" style={{ color: "var(--muted)" }}>
                <strong>Status:</strong> bloqueado para reservas até {blockedUntil.toLocaleString("pt-BR")}
              </div>
            </div>
          )}

          {/* Ações */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href="/minhas-reservas">Minhas reservas</a>
            <button className="btn" onClick={async () => { await appSignOut(); }}>Sair</button>
          </div>
        </div>
      </div>
    </div>
  );
}
