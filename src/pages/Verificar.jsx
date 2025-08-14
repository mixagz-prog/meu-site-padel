import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader"; // <- import certo
import { auth } from "../lib/firebase";              // <- caminho certo

import {
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
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
    fontSize: 15,
    outline: "none",
    width: "100%",
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

/* ===== helpers telefone BR ===== */
const strip = (s = "") => s.replace(/\D+/g, "");
const formatPhoneBR = (raw) => {
  let d = strip(raw);
  if (!d.startsWith("55")) d = "55" + d.replace(/^55/, "");
  const pref = "+55";
  const rest = d.slice(2);
  const ddd = rest.slice(0, 2);
  const num = rest.slice(2);
  if (!ddd) return pref;
  if (num.length <= 4) return `${pref} ${ddd} ${num}`;
  if (num.length <= 8) return `${pref} ${ddd} ${num.slice(0, 4)}-${num.slice(4)}`;
  return `${pref} ${ddd} ${num[0]}${num.slice(1, 5)}-${num.slice(5, 9)}`;
};
const toE164 = (masked) => {
  const digits = strip(masked);
  if (!digits.startsWith("55")) return null;
  const nat = digits.slice(2);
  if (nat.length < 10 || nat.length > 11) return null;
  return `+${digits}`;
};

export default function Verificar() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && location.state.from) || "/agendamento";

  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);

  // SMS state
  const [phoneMask, setPhoneMask] = useState("+55");
  const phoneE164 = useMemo(() => toE164(phoneMask), [phoneMask]);

  // Garante user; se não existir, manda logar
  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true, state: { mode: "signin", from } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recaptcha invisível (uma única instância + cleanup)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      } catch (e) {
        // Evita crash em HMR
        console.warn("Recaptcha init falhou (pode ser HMR):", e);
      }
    }
    return () => {
      try {
        window.recaptchaVerifier?.clear?.();
      } catch {}
      window.recaptchaVerifier = null;
    };
  }, []);

  const chooseEmail = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await sendEmailVerification(user);
      navigate("/aguarde", { replace: true, state: { method: "email", from } });
    } catch (e) {
      alert("Falha ao enviar verificação por e-mail: " + (e?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const chooseSMS = async () => {
    if (!phoneE164) return alert("Telefone inválido. Ex.: +55 11 9XXXX-XXXX");
    try {
      setLoading(true);
      // Garante que a instância exista
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      const result = await signInWithPhoneNumber(auth, phoneE164, window.recaptchaVerifier);
      window.confirmationResult = result; // usado em /aguarde
      navigate("/aguarde", { replace: true, state: { method: "sms", from, phoneE164 } });
    } catch (err) {
      try {
        window.recaptchaVerifier?.clear?.();
      } catch {}
      window.recaptchaVerifier = null;
      alert("Falha ao enviar SMS. " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Verificar" />

      <div style={UI.page}>
        <div style={UI.card}>
          <h1 style={UI.title}>Escolha como validar sua conta</h1>
          <p style={UI.subtitle}>
            Confirme por <b>E-mail</b> ou <b>SMS</b>. Assim que verificar, você poderá reservar.
          </p>

          <div style={UI.group}>
            <h3 style={{ margin: 0 }}>Opção 1 — Verificação por e-mail</h3>
            <div style={UI.row}>
              <button onClick={chooseEmail} style={UI.btn()} disabled={loading || !user?.email}>
                Enviar verificação por e-mail
              </button>
              <span style={UI.hint}>
                Link será enviado para <b>{user?.email || "—"}</b>.
              </span>
            </div>
          </div>

          <div style={UI.group}>
            <h3 style={{ margin: 0 }}>Opção 2 — Verificação por SMS</h3>
            <label style={UI.label}>Telefone</label>
            <input
              style={UI.input}
              type="tel"
              inputMode="tel"
              placeholder="+55 11 9XXXX-XXXX"
              value={phoneMask}
              onChange={(e) => setPhoneMask(formatPhoneBR(e.target.value))}
            />
            <button onClick={chooseSMS} style={UI.btn()} disabled={loading || !phoneE164}>
              Enviar código por SMS
            </button>
            <span style={UI.hint}>Você digitará o código na próxima tela.</span>
          </div>

          <div style={{ marginTop: 16 }}>
            <Link to="/" style={UI.btn(true)}>
              Voltar
            </Link>
          </div>

          <div id="recaptcha-container"></div>

          <style>{`
            button { transition:.12s; }
            button:hover { transform: translateY(-1px); filter:brightness(1.05); box-shadow:0 6px 18px rgba(249,115,22,.18); }
          `}</style>
        </div>
      </div>
    </>
  );
}
