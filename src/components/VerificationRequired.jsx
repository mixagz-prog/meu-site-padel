import { useEffect, useMemo, useState } from "react";
import { auth } from "../firebase";
import {
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth";

const UI = {
  page: {
    minHeight: "60vh",
    display: "grid",
    placeItems: "center",
    padding: "24px 16px",
    background:
      "radial-gradient(1200px 600px at 50% -20%, rgba(249,115,22,.08), transparent 60%)",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#111",
    color: "#fff",
    border: "1px solid #242424",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,.45)",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial",
  },
  title: { margin: 0, fontSize: 24, fontWeight: 900 },
  subtitle: { marginTop: 6, color: "#cfcfcf", fontSize: 14 },
  grid: { display: "grid", gap: 14, marginTop: 16 },
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

// helpers telefone BR
const strip = (s="") => s.replace(/\D+/g, "");
const formatPhoneBR = (raw) => {
  let d = strip(raw);
  if (!d.startsWith("55")) d = "55" + d.replace(/^55/, "");
  const pref = "+55"; const rest = d.slice(2);
  const ddd = rest.slice(0,2); const num = rest.slice(2);
  if (!ddd) return pref;
  if (num.length <= 4) return `${pref} ${ddd} ${num}`;
  if (num.length <= 8) return `${pref} ${ddd} ${num.slice(0,4)}-${num.slice(4)}`;
  return `${pref} ${ddd} ${num[0]}${num.slice(1,5)}-${num.slice(5,9)}`;
};
const toE164 = (masked) => {
  const digits = strip(masked);
  if (!digits.startsWith("55")) return null;
  const nat = digits.slice(2);
  if (nat.length < 10 || nat.length > 11) return null;
  return `+${digits}`;
};

export default function VerificationRequired() { // <-- DEFAULT EXPORT AQUI
  const user = auth.currentUser;
  const [sending, setSending] = useState(false);

  // SMS
  const [phoneMask, setPhoneMask] = useState("+55");
  const phoneE164 = useMemo(() => toE164(phoneMask), [phoneMask]);
  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
  }, []);

  const handleEmailVerify = async () => {
    if (!user) return;
    try {
      setSending(true);
      await sendEmailVerification(user);
      alert("Enviamos um e-mail de verificação. Abra o link e depois recarregue a página.");
    } catch (e) {
      alert("Falha ao enviar verificação por e-mail: " + (e?.message || ""));
    } finally {
      setSending(false);
    }
  };

  const requestSms = async () => {
    if (!phoneE164) return alert("Telefone inválido. Ex.: +55 11 9XXXX-XXXX");
    try {
      setSending(true);
      const result = await signInWithPhoneNumber(auth, phoneE164, window.recaptchaVerifier);
      window.confirmationResult = result; // <-- salva para confirmar depois
      setSmsSent(true);
      alert("Código SMS enviado.");
    } catch (err) {
      window.recaptchaVerifier?.clear?.();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      alert("Falha ao enviar SMS. " + (err?.message || ""));
    } finally {
      setSending(false);
    }
  };

  const confirmSms = async () => {
    const last = window.confirmationResult || null;
    if (!last?.verificationId) {
      alert("Sessão do SMS expirou. Reenvie o código.");
      return;
    }
    if (!smsCode) return;
    try {
      setSending(true);
      const cred = PhoneAuthProvider.credential(last.verificationId, smsCode);
      await linkWithCredential(auth.currentUser, cred);
      alert("Telefone verificado e vinculado! Agora você já pode reservar.");
      window.location.reload();
    } catch (err) {
      alert("Código inválido: " + (err?.message || ""));
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={UI.page}>
      <div style={UI.card}>
        <h2 style={UI.title}>Verificação necessária</h2>
        <p style={UI.subtitle}>
          Confirme sua conta por <b>e-mail</b> <i>ou</i> por <b>SMS</b>. Assim que confirmar, a reserva é liberada.
        </p>

        <div style={UI.grid}>
          <h3 style={{ margin: 0 }}>Opção 1 — Verificação por e-mail</h3>
          <div style={UI.row}>
            <button onClick={handleEmailVerify} style={UI.btn()} disabled={sending}>
              Enviar verificação por e-mail
            </button>
            <span style={UI.hint}>Link será enviado para <b>{user?.email || "(seu e-mail)"}</b>.</span>
          </div>
        </div>

        <div style={UI.grid}>
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

          {!smsSent ? (
            <button onClick={requestSms} style={UI.btn()} disabled={sending || !phoneE164}>
              Enviar código por SMS
            </button>
          ) : (
            <>
              <label style={UI.label}>Código recebido</label>
              <input
                style={UI.input}
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value.replace(/\D+/g, ""))}
              />
              <div style={UI.row}>
                <button onClick={confirmSms} style={UI.btn()} disabled={sending || !smsCode}>
                  Confirmar e vincular telefone
                </button>
                <button onClick={() => { setSmsSent(false); setSmsCode(""); }} style={UI.btn(true)} disabled={sending}>
                  Trocar número
                </button>
              </div>
            </>
          )}
        </div>

        <div id="recaptcha-container"></div>

        <style>{`
          button { transition: transform .12s ease, box-shadow .12s ease, filter .12s ease; }
          button:hover { transform: translateY(-1px); filter: brightness(1.05); box-shadow: 0 6px 18px rgba(249,115,22,.18); }
        `}</style>
      </div>
    </div>
  );
}
