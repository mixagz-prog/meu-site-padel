import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { auth } from "../lib/firebase";
import {
  sendEmailVerification,
  onAuthStateChanged,
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
    maxWidth: 720,
    background: "#111",
    border: "1px solid #242424",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 12px 40px rgba(0,0,0,.45)",
  },
  title: { margin: 0, fontSize: 26, fontWeight: 900 },
  subtitle: { marginTop: 6, color: "#cfcfcf", fontSize: 14 },
  group: { display: "grid", gap: 12, marginTop: 16 },
  label: { fontSize: 13, fontWeight: 800 },
  input: {
    background: "#0f0f0f",
    border: "1px solid #f97316",
    color: "#fff",
    padding: "12px 14px",
    borderRadius: 12,
    fontSize: 16,
    outline: "none",
    width: "100%",
    letterSpacing: 6,
    textAlign: "center",
  },
  btn: (ghost) => ({
    background: ghost ? "transparent" : "#f97316",
    color: ghost ? "#f97316" : "#fff",
    border: ghost ? "1px solid #f97316" : "none",
    padding: "12px 14px",
    borderRadius: 12,
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 15,
  }),
  row: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  hint: { color: "#bdbdbd", fontSize: 13 },
};

const onlyDigits = (s = "") => s.replace(/\D+/g, "");

export default function Aguarde() {
  const navigate = useNavigate();
  const location = useLocation();

  const method = location.state?.method; // "email" | "sms"
  const from = location.state?.from || "/agendamento";
  const phoneE164 = location.state?.phoneE164 || null;

  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const cleanCode = useMemo(() => onlyDigits(code).slice(0, 6), [code]);

  const [info, setInfo] = useState("");
  const mountedRef = useRef(true);

  // acompanha user (caso o fluxo de SMS troque sessão, etc.)
  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => setUser(u));
    return () => off();
  }, []);

  // Poll de verificação por e-mail
  useEffect(() => {
    if (method !== "email") return;
    let timer;
    const tick = async () => {
      try {
        if (!auth.currentUser) return;
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          setInfo("E-mail verificado. Redirecionando…");
          navigate(from, { replace: true });
        }
      } catch (e) {
        // silencia erros intermitentes de rede
      }
    };
    // primeira checagem rápida + poll
    tick();
    timer = setInterval(tick, 3000);
    return () => clearInterval(timer);
  }, [method, navigate, from]);

  // Reenvio de e-mail (opcional)
  const resendEmail = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await sendEmailVerification(user);
      setInfo("E-mail reenviado. Verifique sua caixa de entrada/spam.");
    } catch (e) {
      alert("Falha ao reenviar e-mail: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // Confirmar SMS
  const confirmSms = async () => {
    if (cleanCode.length !== 6) {
      return alert("Digite o código de 6 dígitos.");
    }
    if (!window.confirmationResult) {
      return alert("Sessão do SMS não encontrada. Volte e tente novamente.");
    }
    try {
      setLoading(true);
      const cred = await window.confirmationResult.confirm(cleanCode);
      // cred.user agora está verificado via telefone
      setInfo("Telefone verificado. Redirecionando…");
      navigate(from, { replace: true });
    } catch (e) {
      alert("Código inválido ou expirado. " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // Guarda de rota: se não tiver method, manda de volta
  useEffect(() => {
    if (!method) {
      navigate("/verificar", { replace: true, state: { from } });
    }
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, [method, navigate, from]);

  return (
    <>
      <PageHeader title="Aguarde" />

      <div style={UI.page}>
        <div style={UI.card}>
          <h1 style={UI.title}>Concluir verificação</h1>
          <p style={UI.subtitle}>
            Método escolhido: <b>{method === "sms" ? "SMS" : "E-mail"}</b>
          </p>

          {method === "email" && (
            <>
              <div style={UI.group}>
                <p style={UI.hint}>
                  Enviamos um link para <b>{user?.email || "seu e-mail"}</b>. Clique no link e volte
                  aqui — detectaremos automaticamente.
                </p>
                <div style={UI.row}>
                  <button style={UI.btn()} onClick={resendEmail} disabled={loading}>
                    Reenviar e-mail
                  </button>
                  <button
                    style={UI.btn(true)}
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await auth.currentUser?.reload();
                        if (auth.currentUser?.emailVerified) {
                          navigate(from, { replace: true });
                        } else {
                          alert("Ainda não verificado. Confira sua caixa de entrada/spam.");
                        }
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Já verifiquei
                  </button>
                </div>
              </div>
            </>
          )}

          {method === "sms" && (
            <>
              <div style={UI.group}>
                <p style={UI.hint}>
                  Enviamos o código para <b>{phoneE164 || "seu telefone"}</b>.
                </p>
                {!window.confirmationResult && (
                  <div className="small" style={{ color: "#ffb4a2" }}>
                    Sessão do SMS não encontrada (talvez a página tenha sido recarregada).
                    <br />
                    <Link to="/verificar" state={{ from }} style={{ color: "#f97316" }}>
                      Voltar e reenviar código
                    </Link>
                  </div>
                )}

                <label style={UI.label}>Código de 6 dígitos</label>
                <input
                  style={UI.input}
                  placeholder="••••••"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={cleanCode}
                  onChange={(e) => setCode(e.target.value)}
                />
                <div style={UI.row}>
                  <button style={UI.btn()} onClick={confirmSms} disabled={loading || cleanCode.length !== 6}>
                    Confirmar código
                  </button>
                  <Link to="/verificar" state={{ from }} style={UI.btn(true)}>
                    Voltar
                  </Link>
                </div>
              </div>
            </>
          )}

          {info && (
            <p style={{ ...UI.hint, marginTop: 12 }}>
              {info}
            </p>
          )}

          <style>{`
            button { transition:.12s; }
            button:hover { transform: translateY(-1px); filter:brightness(1.05); box-shadow:0 6px 18px rgba(249,115,22,.18); }
          `}</style>
        </div>
      </div>
    </>
  );
}
