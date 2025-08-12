// src/pages/Aguarde.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { auth } from "../firebase";
import {
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";

const UI = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(1200px 600px at 50% -20%, rgba(249,115,22,.08), transparent 60%), #0a0a0a",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    padding: "32px 16px",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial",
  },
  card: {
    width: "100%",
    maxWidth: 680,
    background: "#111",
    border: "1px solid #242424",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 12px 40px rgba(0,0,0,.45)",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: 0.2 },
  subtitle: { margin: "6px 0 16px", color: "#cfcfcf", fontSize: 14 },
  row: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 12 },
  btn: (variant = "primary") => ({
    background: variant === "ghost" ? "transparent" : "#f97316",
    color: variant === "ghost" ? "#f97316" : "#fff",
    border: variant === "ghost" ? "1px solid #f97316" : "none",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 15,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  }),
  hint: { color: "#bdbdbd", fontSize: 13 },
  badge: (ok) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    border: `1px solid ${ok ? "rgba(34,197,94,.5)" : "rgba(239,68,68,.5)"}`,
    background: ok ? "rgba(34,197,94,.12)" : "rgba(239,68,68,.12)",
    color: ok ? "#86efac" : "#fca5a5",
  }),
  dot: (ok) => ({ width: 8, height: 8, borderRadius: "50%", background: ok ? "#22c55e" : "#ef4444" }),
  list: { margin: "10px 0 0 18px", color: "#cfcfcf", fontSize: 14, lineHeight: 1.6 },
};

export default function Aguarde() {
  const navigate = useNavigate();
  const location = useLocation();
  // props opcionais: { mode: 'email' | 'sms', to: '/agendamento' }
  const { mode = "email", to = "/agendamento" } = location.state || {};

  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  // observa auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      setVerified(!!u?.emailVerified);
      // se já estiver verificado, manda embora
      if (u?.emailVerified) {
        navigate(to, { replace: true });
      }
    });
    return () => unsub();
  }, [navigate, to]);

  // botão "Já verifiquei — Atualizar status"
  const refreshClaims = async () => {
    if (!auth.currentUser) return;
    try {
      setLoading(true);
      await auth.currentUser.reload();
      await auth.currentUser.getIdToken(true);
      const ok = !!auth.currentUser.emailVerified;
      setVerified(ok);
      if (ok) {
        navigate(to, { replace: true });
      }
    } catch {
      // silencia — usuário pode tentar de novo
    } finally {
      setLoading(false);
    }
  };

  const resendEmail = async () => {
    if (!auth.currentUser) return alert("Faça login novamente.");
    try {
      setLoading(true);
      await sendEmailVerification(auth.currentUser);
      setResent(true);
    } catch (e) {
      alert("Não foi possível reenviar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const instructions = useMemo(() => {
    if (mode === "sms") {
      return {
        title: "Aguardando confirmação por SMS",
        steps: [
          "Abra o app Mensagens e localize o código recebido.",
          "Volte para a tela anterior, escolha 'Verificar por SMS' e informe o código.",
          "Se não recebeu, reenvie o SMS pela tela de verificação.",
        ],
      };
    }
    return {
      title: "Aguardando confirmação de e-mail",
      steps: [
        "Abra seu e-mail e procure a mensagem de verificação.",
        "Clique no link 'Confirmar meu e-mail' dentro da mensagem.",
        "Volte aqui e clique em 'Já verifiquei — Atualizar status'.",
      ],
    };
  }, [mode]);

  return (
    <>
      <PageHeader title="Aguarde" />

      <div style={UI.page}>
        <div style={UI.card}>
          <h1 style={UI.title}>{instructions.title}</h1>
          <p style={UI.subtitle}>
            Assim que confirmarmos sua identidade, liberamos o acesso automaticamente.
          </p>

          {user && (
            <div style={{ ...UI.row, marginTop: 8 }}>
              <span>Usuário: <strong>{user.displayName || user.email}</strong></span>
              <span style={UI.badge(verified)}>
                <span style={UI.dot(verified)} />
                {verified ? "E-mail verificado" : "E-mail não verificado"}
              </span>
            </div>
          )}

          <ol style={UI.list}>
            {instructions.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>

          {mode === "email" && (
            <div style={UI.actions}>
              <button disabled={loading} onClick={refreshClaims} style={UI.btn()}>
                Já verifiquei — Atualizar status
              </button>
              <button disabled={loading} onClick={resendEmail} style={UI.btn("ghost")}>
                Reenviar e-mail de verificação
              </button>
              {resent && <span style={UI.hint}>Reenviado! Verifique sua caixa de entrada e o spam.</span>}
              <a
                href="https://mail.google.com/"
                target="_blank"
                rel="noreferrer"
                style={UI.btn("ghost")}
              >
                Abrir meu e-mail
              </a>
            </div>
          )}

          {mode === "sms" && (
            <div style={UI.actions}>
              <Link to="/cadastro" state={{ verifyTab: "sms" }} style={UI.btn()}>
                Inserir código SMS
              </Link>
              <button disabled={loading} onClick={refreshClaims} style={UI.btn("ghost")}>
                Verificar novamente
              </button>
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            <Link to="/agendamento" style={UI.btn("ghost")}>Voltar ao agendamento</Link>
          </div>

          <style>{`
            a, button { transition: transform .12s ease, box-shadow .12s ease, filter .12s ease; }
            a:hover, button:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 6px 18px rgba(249,115,22,.18); }
          `}</style>
        </div>
      </div>
    </>
  );
}
