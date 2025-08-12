// src/pages/Login.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext";
import {
  auth,
  db,
  googleProvider,
  appleProvider,
  ensureUserDoc,                 // alias para upsertUserProfile
  resolveGoogleRedirectResult,
  resolveAppleRedirectResult,
  setupInvisibleRecaptcha,
  setCpfMapping,                 // CPF opcional (exclusivo)
} from "../lib/firebase";
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  // signInWithRedirect, // se quiser usar redirect no iOS
  updateProfile,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { isValidCpf, maskCpf, normalizeCpf } from "../utils/cpf";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

export default function Login() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();

  // abas
  const [tab, setTab] = useState("email"); // 'email' | 'phone'
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'
  const from = useMemo(() => loc.state?.from?.pathname || "/agendamento", [loc.state]);

  // email form
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [cpfStatus, setCpfStatus] = useState(null); // null | 'checking' | 'ok' | 'used' | 'invalid'

  // phone form
  const [phone, setPhone] = useState(""); // +55DDDNUMERO
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState("enter"); // 'enter' | 'code'
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  // redirect se já logado
  useEffect(() => {
    if (!user) return;
    nav(from, { replace: true });
  }, [user, nav, from]);

  // trata possíveis resultados de redirect (se usar signInWithRedirect)
  useEffect(() => {
    (async () => {
      try {
        const res = (await resolveGoogleRedirectResult()) || (await resolveAppleRedirectResult());
        if (res?.user) {
          await ensureUserDoc(res.user);
          toast.success("Bem-vindo!");
          nav(from, { replace: true });
        }
      } catch {/* noop */}
    })();
  }, [from, nav, toast]);

  // checagem de CPF quando digitado (feedback no cadastro)
  useEffect(() => {
    let active = true;
    (async () => {
      const n = normalizeCpf(cpf);
      if (!n) { setCpfStatus(null); return; }
      if (!isValidCpf(n)) { setCpfStatus("invalid"); return; }
      setCpfStatus("checking");
      try {
        const snap = await getDoc(doc(db, "cpfs", n));
        if (!active) return;
        setCpfStatus(snap.exists() ? "used" : "ok");
      } catch {
        if (active) setCpfStatus(null);
      }
    })();
    return () => { active = false; };
  }, [cpf]);

  // ---------- Social ----------
  async function signInGoogle() {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user);
      toast.success("Bem-vindo!");
      nav(from, { replace: true });
    } catch (e) {
      handleAuthErr(e, "Não foi possível entrar com Google.");
    }
  }

  async function signInApple() {
    try {
      // Para Safari/iOS, se quiser usar redirect:
      // await signInWithRedirect(auth, appleProvider);
      const res = await signInWithPopup(auth, appleProvider);
      await ensureUserDoc(res.user);
      toast.success("Bem-vindo!");
      nav(from, { replace: true });
    } catch (e) {
      handleAuthErr(e, "Não foi possível entrar com Apple.");
    }
  }

  // ---------- Email ----------
  async function onEmailSignIn(e) {
    e.preventDefault();
    if (!email || !pass) return toast.info("Preencha e-mail e senha.");
    try {
      const { user: u } = await signInWithEmailAndPassword(auth, email, pass);
      await ensureUserDoc(u);
      toast.success("Bem-vindo!");
      nav(from, { replace: true });
    } catch (e) {
      handleAuthErr(e, "Não foi possível entrar com e-mail/senha.");
    }
  }

  async function onEmailSignUp(e) {
    e.preventDefault();
    if (!email || !pass || !name.trim()) return toast.info("Preencha nome, e-mail e senha.");
    if (cpf && !isValidCpf(cpf)) return toast.info("CPF inválido.");
    if (cpfStatus === "used") return toast.info("Este CPF já está em uso.");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      await ensureUserDoc(cred.user, { name: name.trim() });

      // CPF opcional (exclusivo via Rules)
      if (cpf) {
        const res = await setCpfMapping(cred.user.uid, cpf);
        if (!res.ok && res.reason === "used") {
          toast.error("Este CPF já está vinculado a outra conta.");
        }
      }

      await sendEmailVerification(cred.user);
      toast.success("Conta criada! Verifique seu e-mail para confirmar.");
    } catch (e) {
      handleAuthErr(e, "Não foi possível criar sua conta.");
    }
  }

  async function forgotPassword() {
    if (!email) return toast.info("Informe seu e-mail para recuperar.");
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Enviamos um link de recuperação para seu e-mail.");
    } catch (e) {
      handleAuthErr(e, "Não foi possível enviar o e-mail de recuperação.");
    }
  }

  // ---------- Telefone ----------
  useEffect(() => {
    if (tab !== "phone") return;
    const verifier = setupInvisibleRecaptcha("recaptcha-container");
    recaptchaRef.current = verifier;
  }, [tab]);

  async function phoneSendCode(e) {
    e.preventDefault();
    if (!/^\+\d{10,15}$/.test(phone)) return toast.info("Informe o telefone no formato internacional. Ex.: +55DDDNUMERO");
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      confirmationRef.current = confirmation;
      setPhase("code");
      toast.success("Código SMS enviado.");
    } catch (e) {
      handleAuthErr(e, "Não foi possível enviar o SMS.");
    }
  }

  async function phoneConfirmCode(e) {
    e.preventDefault();
    if (!otp) return;
    try {
      const res = await confirmationRef.current.confirm(otp);
      await ensureUserDoc(res.user);
      toast.success("Telefone verificado e login realizado!");
      nav(from, { replace: true });
    } catch (e) {
      handleAuthErr(e, "Código inválido ou expirado.");
    }
  }

  function handleAuthErr(e, fallback) {
    const map = {
      "auth/email-already-in-use": "Este e-mail já está em uso.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/weak-password": "Senha fraca. Use 6+ caracteres.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/user-not-found": "Usuário não encontrado.",
      "auth/popup-closed-by-user": "Janela fechada antes de concluir.",
      "auth/cancelled-popup-request": "Janela de login já aberta.",
      "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
      "auth/credential-already-in-use": "Este telefone já está vinculado a outra conta.",
      "auth/account-exists-with-different-credential": "Esse e-mail já existe com outro provedor.",
    };
    console.error(e);
    toast.error(map[e.code] || fallback);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Entrar</motion.h1>

        {/* CARD PRINCIPAL */}
        <div className="card mt-3" style={{ display:"grid", gap:16 }}>
          {/* SOCIAL GRANDE */}
          <div className="social-grid">
            <button type="button" className="btn-social btn-google" onClick={signInGoogle} aria-label="Entrar com Google">
              <GoogleIcon /> <span>Entrar com Google</span>
            </button>
            <button type="button" className="btn-social btn-apple" onClick={signInApple} aria-label="Entrar com Apple">
              <AppleIcon /> <span>Entrar com Apple</span>
            </button>
          </div>

          <div className="or-divider"><span>ou</span></div>

          {/* ABA: EMAIL / TELEFONE */}
          <div className="glass" style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <TabBtn active={tab === "email"} onClick={() => setTab("email")}>
                <MailIcon /> E-mail
              </TabBtn>
              <TabBtn active={tab === "phone"} onClick={() => setTab("phone")}>
                <PhoneIcon /> Telefone (SMS)
              </TabBtn>
            </div>

            {/* EMAIL */}
            {tab === "email" && (
              <>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <TabPill active={mode === "signin"} onClick={() => setMode("signin")}>Entrar</TabPill>
                  <TabPill active={mode === "signup"} onClick={() => setMode("signup")}>Criar conta</TabPill>
                </div>

                {mode === "signin" ? (
                  <form onSubmit={onEmailSignIn} className="grid" style={{ gap: 10 }}>
                    <label className="small">E-mail</label>
                    <input type="email" placeholder="voce@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                    <label className="small">Senha</label>
                    <input type="password" placeholder="••••••••" value={pass} onChange={(e)=>setPass(e.target.value)} />
                    <div style={{ display:"flex", gap:10, alignItems:"center", justifyContent:"space-between", flexWrap:"wrap" }}>
                      <button type="button" className="btn" onClick={forgotPassword}>Esqueci a senha</button>
                      <button type="submit" className="btn btn-primary">
                        <MailIcon /> Entrar
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={onEmailSignUp} className="grid" style={{ gap: 10 }}>
                    <label className="small">Nome</label>
                    <input placeholder="Seu nome" value={name} onChange={(e)=>setName(e.target.value)} />
                    <label className="small">E-mail</label>
                    <input type="email" placeholder="voce@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} />
                    <label className="small">Senha</label>
                    <input type="password" placeholder="mín. 6 caracteres" value={pass} onChange={(e)=>setPass(e.target.value)} />
                    <label className="small">CPF (opcional, exclusivo)</label>
                    <input
                      placeholder="000.000.000-00"
                      value={maskCpf(cpf)}
                      onChange={(e)=>setCpf(e.target.value)}
                    />
                    {cpf && (
                      <div className="small" style={{ color: cpfStatus === "ok" ? "var(--success)" :
                                                        cpfStatus === "used" ? "var(--danger)" :
                                                        cpfStatus === "invalid" ? "var(--danger)" : "var(--muted)" }}>
                        {cpfStatus === "checking" && "Verificando…"}
                        {cpfStatus === "ok" && "CPF disponível."}
                        {cpfStatus === "used" && "Este CPF já está em uso."}
                        {cpfStatus === "invalid" && "CPF inválido."}
                      </div>
                    )}
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                      <button type="submit" className="btn btn-primary">
                        <MailPlusIcon /> Criar conta
                      </button>
                    </div>
                    <div className="small" style={{ color:"var(--muted)" }}>
                      Enviaremos um e-mail de verificação. Você poderá vincular telefone/Google/Apple depois em “Minha conta”.
                    </div>
                  </form>
                )}
              </>
            )}

            {/* PHONE */}
            {tab === "phone" && (
              <>
                {phase === "enter" ? (
                  <form onSubmit={phoneSendCode} className="grid" style={{ gap: 10 }}>
                    <label className="small">Telefone (formato internacional)</label>
                    <input
                      placeholder="+55DDDNUMERO"
                      value={phone}
                      onChange={(e)=>setPhone(e.target.value)}
                    />
                    <div id="recaptcha-container" />
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="submit" className="btn btn-primary">
                        <PhoneIcon /> Receber código
                      </button>
                    </div>
                    <div className="small" style={{ color:"var(--muted)" }}>
                      Enviaremos um SMS com código (OTP). Esse telefone ficará vinculado à sua conta.
                    </div>
                  </form>
                ) : (
                  <form onSubmit={phoneConfirmCode} className="grid" style={{ gap: 10 }}>
                    <label className="small">Código recebido por SMS</label>
                    <input placeholder="123456" value={otp} onChange={(e)=>setOtp(e.target.value)} />
                    <div style={{ display:"flex", gap:10, justifyContent:"space-between", flexWrap:"wrap" }}>
                      <button type="button" className="btn" onClick={()=>setPhase("enter")}>Trocar telefone</button>
                      <button type="submit" className="btn btn-primary">
                        <CheckIcon /> Confirmar
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="small" style={{ color:"var(--muted)" }}>
            • E-mail e telefone são **unicados** pelo Firebase Auth.<br/>
            • O **CPF** é exclusivo pela coleção <code>cpfs/</code> (opcional).<br/>
            • Depois de entrar, você pode vincular provedores em <strong>Minha conta</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ====== UI helpers ====== */
function TabBtn({ active, onClick, children }) {
  return (
    <button
      className="btn"
      onClick={onClick}
      style={{
        background: active ? "linear-gradient(135deg, var(--brand), var(--brand-300))" : "#ffffff10",
        color: active ? "#111" : "var(--text)",
        borderColor: active ? "transparent" : "var(--border)",
      }}
    >
      {children}
    </button>
  );
}
function TabPill({ active, onClick, children }) {
  return (
    <button
      className="btn"
      onClick={onClick}
      style={{
        background: active ? "#ffffff18" : "#ffffff0c",
        borderColor: active ? "var(--brand)" : "var(--border)",
      }}
    >
      {children}
    </button>
  );
}

/* ====== Ícones inline ====== */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.1 29.4 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 5 29.1 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.8 18.8 13 24 13c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 5 29.1 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.3 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.8 26.9 37 24 37c-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C9.3 40.6 16 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-4.9 7-11.3 7-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C9.3 40.6 16 45 24 45c11.7 0 21-9.3 21-21 0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16.365 1.43c0 1.14-.463 2.245-1.195 3.045-.74.81-1.95 1.43-3.16 1.34-.13-1.1.46-2.265 1.19-3.065.78-.86 2.1-1.49 3.165-1.32zM21.5 17.03c-.58 1.3-.87 1.89-1.64 3.05-1.06 1.63-2.55 3.66-4.4 3.68-1.64.02-2.07-1.09-4.32-1.08-2.25.01-2.72 1.1-4.36 1.08-1.85-.02-3.26-1.85-4.32-3.48C.66 18.93-.69 14.6 1.37 11.6c1.03-1.53 2.87-2.5 4.86-2.53 1.91-.03 3.71 1.27 4.32 1.27.6 0 2.97-1.57 5.01-1.34.85.03 3.22.34 4.74 2.56-3.98 2.18-3.34 7.05 0 9.47z"/>
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/>
    </svg>
  );
}
function MailPlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7v-2H4V9l8 5 8-5v2h2V6a2 2 0 0 0-2-2Zm0 2-8 5L4 6h16Z"/>
      <path fill="currentColor" d="M19 15v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2Z"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 1 20 4.5v15A2.5 2.5 0 0 1 17.5 22ZM6.5 4A.5.5 0 0 0 6 4.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-11ZM12 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"/>
    </svg>
  );
}
