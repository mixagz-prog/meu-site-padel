// src/pages/Login.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "../context/ToastContext.jsx";
import { auth } from "../lib/firebase";
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  signInWithPhoneNumber,
} from "firebase/auth";

// Helpers utilitários do projeto (conforme memória do projeto)
import {
  upsertUserProfile,
  resolveGoogleRedirectResult,
  resolveAppleRedirectResult,
  setupInvisibleRecaptcha,
} from "../lib/firebase";

// =====================
// Helper: voltar para a página anterior
// =====================
function getFromRoute(location) {
  // 1) state.from fornecido pela rota de origem
  const viaState = location?.state?.from;
  if (viaState) return viaState;
  // 2) fallback salvo (ex.: vindo do Agendamento.jsx)
  try {
    const raw = sessionStorage.getItem("auth.from");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function redirectBack(navigate, location, fallback = "/") {
  const from = getFromRoute(location);
  // limpa o storage p/ não poluir próximos logins
  try { sessionStorage.removeItem("auth.from"); } catch {}
  if (!from) {
    navigate(fallback, { replace: true });
    return;
  }
  const path = `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`;
  navigate(path, { replace: true, state: from.state ?? null });
}

// =====================
// Componente principal
// =====================
export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // UI: "signin" | "signup"
  const [mode, setMode] = useState("signin");

  // Email/Senha
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busyEmail, setBusyEmail] = useState(false);

  // Telefone/OTP
  const [phone, setPhone] = useState(""); // no formato +55DDDNNNNNNNN
  const [otp, setOtp] = useState("");
  const [smsSent, setSmsSent] = useState(false);
  const [busyPhone, setBusyPhone] = useState(false);
  const confirmationRef = useRef(null);
  const recaptchaRef = useRef(null);

  // Social
  const [busySocial, setBusySocial] = useState(false);

  // =====================
  // Inicialização do modo (hash/state)
  // =====================
  useEffect(() => {
    // 1) state.mode
    const stMode = location?.state?.mode;
    if (stMode === "signin" || stMode === "signup") setMode(stMode);

    // 2) hash: #mode=signin|signup
    const h = window.location.hash || "";
    const m = (h.match(/mode=(signin|signup)/)?.[1]) || null;
    if (m) setMode(m);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =====================
  // Recaptcha invisível para telefone
  // =====================
  useEffect(() => {
    if (!recaptchaRef.current) {
      // Cria/garante um container phantom de recaptcha invisível
      const el = document.createElement("div");
      el.id = "recaptcha-invisible-container";
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.bottom = "-9999px";
      document.body.appendChild(el);
      recaptchaRef.current = el;
    }
    return () => {
      // opcional: manter recaptcha para reuso
    };
  }, []);

  // =====================
  // Pós-login (comum)
  // =====================
  async function onAuthSuccess(user, extra = {}) {
    try {
      // Garante um displayName básico se não houver (ex.: email)
      if (!user.displayName && user.email) {
        try { await updateProfile(user, { displayName: user.email.split("@")[0] }); } catch {}
      }
      // Upsert do perfil no Firestore/Realtime (conforme helper do projeto)
      await upsertUserProfile(user, extra);
    } catch (e) {
      console.warn("Falha ao salvar/atualizar perfil:", e);
    } finally {
      // Redireciona de volta
      redirectBack(nav, location, "/");
    }
  }

  // =====================
  // Google
  // =====================
  async function onGoogle() {
    try {
      setBusySocial(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(auth, provider);
      await onAuthSuccess(cred.user, { provider: "google" });
    } catch (e) {
      console.error(e);
      // Tenta resolver redirects pendentes (caso exista)
      try {
        const res = await resolveGoogleRedirectResult();
        if (res?.user) return onAuthSuccess(res.user, { provider: "google" });
      } catch {}
      toast.error("Não foi possível entrar com Google.");
    } finally {
      setBusySocial(false);
    }
  }

  // =====================
  // Apple (se configurado)
  // =====================
  async function onApple() {
    try {
      setBusySocial(true);
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      const cred = await signInWithPopup(auth, provider);
      await onAuthSuccess(cred.user, { provider: "apple" });
    } catch (e) {
      console.warn("Apple sign-in indisponível/erro:", e);
      // tenta resolver redirects pendentes
      try {
        const res = await resolveAppleRedirectResult();
        if (res?.user) return onAuthSuccess(res.user, { provider: "apple" });
      } catch {}
      toast.info("Login com Apple não disponível no momento.");
    } finally {
      setBusySocial(false);
    }
  }

  // =====================
  // Email/Senha
  // =====================
  async function onEmailSignin(e) {
    e?.preventDefault?.();
    if (!email || !pwd) {
      toast.info("Preencha e-mail e senha.");
      return;
    }
    try {
      setBusyEmail(true);
      const cred = await signInWithEmailAndPassword(auth, email, pwd);
      // opcional: exigir verificação de e-mail antes de prosseguir
      // if (!cred.user.emailVerified) { ... }
      await onAuthSuccess(cred.user, { provider: "password" });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível entrar. Verifique seus dados.");
    } finally {
      setBusyEmail(false);
    }
  }

  async function onEmailSignup(e) {
    e?.preventDefault?.();
    if (!email || !pwd) {
      toast.info("Preencha e-mail e senha.");
      return;
    }
    try {
      setBusyEmail(true);
      const cred = await createUserWithEmailAndPassword(auth, email, pwd);
      try { await sendEmailVerification(cred.user); } catch {}
      toast.success("Conta criada! Verifique seu e-mail (se necessário).");
      await onAuthSuccess(cred.user, { provider: "password" });
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível criar sua conta.");
    } finally {
      setBusyEmail(false);
    }
  }

  // =====================
  // Telefone / OTP
  // =====================
  async function onPhoneSendSms() {
    if (!phone || !/^\+\d{10,15}$/.test(phone)) {
      toast.info("Informe um telefone válido com código do país (ex.: +55DDDNNNNNNNN).");
      return;
    }
    try {
      setBusyPhone(true);
      const verifier = await setupInvisibleRecaptcha(auth, "recaptcha-invisible-container");
      const confirmation = await signInWithPhoneNumber(auth, phone, verifier);
      confirmationRef.current = confirmation;
      setSmsSent(true);
      toast.success("SMS enviado. Digite o código recebido.");
    } catch (e) {
      console.error(e);
      toast.error("Falha ao enviar SMS. Tente novamente.");
    } finally {
      setBusyPhone(false);
    }
  }

  async function onPhoneConfirmOtp() {
    if (!otp || !confirmationRef.current) {
      toast.info("Digite o código recebido por SMS.");
      return;
    }
    try {
      setBusyPhone(true);
      const cred = await confirmationRef.current.confirm(otp);
      await onAuthSuccess(cred.user, { provider: "phone" });
    } catch (e) {
      console.error(e);
      toast.error("Código inválido. Tente novamente.");
    } finally {
      setBusyPhone(false);
    }
  }

  // =====================
  // UI
  // =====================
  const isSignin = mode === "signin";

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 560, margin: "0 auto" }}>
        <motion.h1 className="h1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {isSignin ? "Entrar" : "Criar conta"}
        </motion.h1>

        {/* Alternador de modo */}
        <div className="card mt-2" style={{ display: "flex", gap: 8, padding: 8 }}>
          <button
            className={`btn ${isSignin ? "btn-primary" : ""}`}
            onClick={() => setMode("signin")}
          >
            Já tenho conta
          </button>
          <button
            className={`btn ${!isSignin ? "btn-primary" : ""}`}
            onClick={() => setMode("signup")}
          >
            Sou novo aqui
          </button>
        </div>

        {/* Social */}
        <div className="card mt-2">
          <div className="h2">Acesso rápido</div>
          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <button className="btn btn-primary" disabled={busySocial} onClick={onGoogle} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.0 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19-8.5 19-19c0-1.3-.1-2.2-.4-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.3 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 16.5 4 9.9 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.2l-6.1-5c-2 1.4-4.6 2.3-7.3 2.3-5.3 0-9.8-3.4-11.4-8.1l-6.5 5.0C9.5 39.4 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.0 2.6-2.9 4.7-5.3 6.2l.0.0 6.1 5C38.5 36.5 41 31 41 25c0-1.3-.1-2.2-.4-4.5z"/></svg>
              Entrar com Google
            </button>
            <button className="btn" disabled={busySocial} onClick={onApple} style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.365 1.43c.267 1.95-1.007 3.87-2.83 4.31-.323-1.89 1.106-3.86 2.83-4.31zM20.64 17.25c-.57 1.3-.85 1.86-1.59 3-.98 1.5-2.36 3.37-4.08 3.38-1.53.02-1.93-.99-3.6-.99-1.66 0-2.1.96-3.62 1-1.74 .03-3.07-1.62-4.05-3.1-2.77-4.17-3.06-9.06-1.36-11.64 1.22-1.88 3.16-3.07 5.34-3.1 1.67-.03 3.25 1.11 3.6 1.11.35 0 2.5-1.37 4.22-1.17.72 .03 2.75 .29 4.05 2.2-3.56 2.03-2.98 7.33 .09 8.31z"/></svg>
              Entrar com Apple
            </button>
          </div>
        </div>

        {/* Email/Senha */}
        <div className="card mt-2">
          <div className="h2">{isSignin ? "Entrar com e-mail" : "Criar conta com e-mail"}</div>
          <form
            onSubmit={isSignin ? onEmailSignin : onEmailSignup}
            style={{ display: "grid", gap: 10, marginTop: 12 }}
          >
            <label className="field">
              <span className="label">E-mail</span>
              <input
                type="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span className="label">Senha</span>
              <input
                type="password"
                placeholder="••••••••"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete={isSignin ? "current-password" : "new-password"}
              />
            </label>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {isSignin ? (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={async () => {
                      if (!email) return toast.info("Informe seu e-mail para recuperar a senha.");
                      try {
                        // você pode ter um helper de reset em lib/firebase
                        // await sendPasswordResetEmail(auth, email);
                        toast.info("Se o e-mail existir, enviaremos instruções de recuperação.");
                      } catch (e) {
                        console.error(e);
                        toast.error("Não foi possível iniciar a recuperação.");
                      }
                    }}
                  >
                    Esqueci minha senha
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={busyEmail}>
                    Entrar
                  </button>
                </>
              ) : (
                <button type="submit" className="btn btn-primary" disabled={busyEmail}>
                  Criar conta
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Telefone / OTP */}
        <div className="card mt-2">
          <div className="h2">Entrar com telefone (SMS)</div>
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            <label className="field">
              <span className="label">Telefone (com DDI)</span>
              <input
                type="tel"
                placeholder="+55DDDNNNNNNNN"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </label>

            {!smsSent ? (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="btn btn-primary" onClick={onPhoneSendSms} disabled={busyPhone}>
                  Enviar SMS
                </button>
              </div>
            ) : (
              <>
                <label className="field">
                  <span className="label">Código SMS</span>
                  <input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    inputMode="numeric"
                    pattern="\d*"
                  />
                </label>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button className="btn" onClick={() => { setSmsSent(false); setOtp(""); }}>
                    Cancelar
                  </button>
                  <button className="btn btn-primary" onClick={onPhoneConfirmOtp} disabled={busyPhone}>
                    Confirmar código
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Rodapé/voltar */}
        <div className="card mt-2" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small" style={{ color: "var(--muted)" }}>
            Ao continuar, você concorda com nossos termos e política.
          </span>
          <button className="btn" onClick={() => redirectBack(nav, location, "/")}>
            Voltar
          </button>
        </div>
      </div>
      {/* container invisível do recaptcha */}
      <div id="recaptcha-invisible-container" />
    </div>
  );
}
