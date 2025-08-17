import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext";
import {
  auth,
  googleProvider,
  appleProvider,
  ensureUserDoc,
  resolveGoogleRedirectResult,
  resolveAppleRedirectResult,
  setupInvisibleRecaptcha,
  setCpfMapping,
} from "../lib/firebase";
import {
  signInWithPhoneNumber,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  reload,
} from "firebase/auth";
import { isValidCpf, maskCpf, normalizeCpf } from "../utils/cpf";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120,damping:18}} };

// Safari iOS tende a bloquear popups do Google/Apple
const isIosSafari = () => {
  const ua = navigator.userAgent || "";
  return /iP(ad|hone|od)/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|OPiOS/i.test(ua);
};

export default function Login() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();

  const from = useMemo(() => {
    const f = loc.state?.from;
    return (typeof f === "string" ? f : f?.pathname) || "/agendamento";
  }, [loc.state]);

  // abas
  const [tab, setTab] = useState("email"); // 'email' | 'phone'
  const [mode, setMode] = useState("signin"); // 'signin' | 'signup'

  // email
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");

  // cpf
  const [cpf, setCpf] = useState("");
  const [cpfHint, setCpfHint] = useState("");

  // phone
  const [phone, setPhone] = useState(""); // +55DDDNUMERO
  const [otp, setOtp] = useState("");
  const [phase, setPhase] = useState("enter");
  const recaptchaRef = useRef(null);
  const confirmationRef = useRef(null);

  // verificação email
  const [mustVerify, setMustVerify] = useState(false);
  const [sendingVerify, setSendingVerify] = useState(false);

  // se já logado: navega se verificado; senão mostra banner
  useEffect(() => {
    if (!user) return;
    const isVerified = user.emailVerified || !!user.phoneNumber || user.providerData.some(p => p.providerId !== "password");
    if (isVerified) {
      nav(from, { replace: true });
    } else {
      setMustVerify(true);
    }
  }, [user, nav, from]);

  // resultado de redirect (Google/Apple)
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

  // feedback do CPF
  useEffect(() => {
    const n = normalizeCpf(cpf);
    if (!cpf) { setCpfHint(""); return; }
    if (!n || !isValidCpf(n)) { setCpfHint("CPF inválido."); return; }
    setCpfHint("Será vinculado após criar a conta.");
  }, [cpf]);

  /* ---------- Social (popup -> fallback redirect) ---------- */
  async function signInGoogle() {
    try {
      if (isIosSafari()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      const res = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(res.user);
      toast.success("Bem-vindo!");
      nav(from, { replace: true });
    } catch (e) {
      if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/popup-closed-by-user", "auth/operation-not-supported-in-this-environment"].includes(e.code)) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      handleAuthErr(e, "Não foi possível entrar com Google.");
    }
  }

  async function signInApple() {
    try {
      if (isIosSafari()) {
        await signInWithRedirect(auth, appleProvider);
        return;
      }
      const res = await signInWithPopup(auth, appleProvider);
      await ensureUserDoc(res.user);
      toast.success("Bem-vindo!");
      nav(from, { replace: true });
    } catch (e) {
      if (["auth/popup-blocked", "auth/cancelled-popup-request", "auth/popup-closed-by-user", "auth/operation-not-supported-in-this-environment"].includes(e.code)) {
        await signInWithRedirect(auth, appleProvider);
        return;
      }
      handleAuthErr(e, "Não foi possível entrar com Apple.");
    }
  }

  /* ---------- Email ---------- */
  async function onEmailSignIn(e) {
    e.preventDefault();
    if (!email || !pass) return toast.info("Preencha e-mail e senha.");
    try {
      const { user: u } = await signInWithEmailAndPassword(auth, email, pass);
      await ensureUserDoc(u);
      if (u.emailVerified) {
        toast.success("Bem-vindo!");
        nav(from, { replace: true });
      } else {
        setMustVerify(true);
        toast.info("Confirme seu e-mail para continuar.");
      }
    } catch (e) {
      handleAuthErr(e, "Não foi possível entrar com e-mail/senha.");
    }
  }

  async function onEmailSignUp(e) {
    e.preventDefault();
    if (!email || !pass || !name.trim()) return toast.info("Preencha nome, e-mail e senha.");
    const n = normalizeCpf(cpf);
    if (cpf && (!n || !isValidCpf(n))) return toast.info("CPF inválido.");

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name.trim() });
      await ensureUserDoc(cred.user, { name: name.trim() });

      if (n) {
        const res = await setCpfMapping(cred.user.uid, n);
        if (!res.ok && res.reason === "used") toast.error("Este CPF já está vinculado a outra conta.");
      }

      setMustVerify(true);
      setSendingVerify(true);
      await sendEmailVerification(cred.user);
      setSendingVerify(false);
      toast.success("Conta criada! Enviamos o e-mail de verificação.");
    } catch (e) {
      setSendingVerify(false);
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

  /* ---------- Telefone ---------- */
  useEffect(() => {
    if (tab !== "phone") return;
    const verifier = setupInvisibleRecaptcha("recaptcha-container");
    recaptchaRef.current = verifier;
  }, [tab]);

  async function phoneSendCode(e) {
    e.preventDefault();
    if (!/^\+\d{10,15}$/.test(phone)) return toast.info("Use +55DDDNUMERO");
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

  /* ---------- Verificação de e-mail ---------- */
  async function resendVerification() {
    try {
      if (!auth.currentUser) return;
      setSendingVerify(true);
      await sendEmailVerification(auth.currentUser);
      setSendingVerify(false);
      toast.success("E-mail reenviado. Confira sua caixa de entrada.");
    } catch (e) {
      setSendingVerify(false);
      handleAuthErr(e, "Não foi possível reenviar o e-mail.");
    }
  }

  async function iVerifiedNow() {
    try {
      if (!auth.currentUser) return;
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        toast.success("E-mail verificado. Vamos prosseguir!");
        nav(from, { replace: true });
      } else {
        toast.info("Ainda não detectamos a verificação. Tente novamente em alguns segundos.");
      }
    } catch (e) {
      handleAuthErr(e, "Falha ao atualizar status de verificação.");
    }
  }

  function handleAuthErr(e, fallback) {
    const map = {
      "auth/email-already-in-use": "Este e-mail já está em uso.",
      "auth/invalid-email": "E-mail inválido.",
      "auth/weak-password": "Senha fraca. Use 6+ caracteres.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/user-not-found": "Usuário não encontrado.",
      "auth/popup-blocked": "Popup bloqueado pelo navegador.",
      "auth/popup-closed-by-user": "Janela fechada antes de concluir.",
      "auth/cancelled-popup-request": "Janela de login já aberta.",
      "auth/too-many-requests": "Muitas tentativas. Tente mais tarde.",
      "auth/credential-already-in-use": "Credencial já vinculada a outra conta.",
      "auth/account-exists-with-different-credential": "Esse e-mail já existe com outro provedor.",
      "auth/operation-not-allowed": "Provedor desabilitado no projeto.",
      "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "API key inválida. Confira as credenciais do app Web nas configurações do Firebase.",
    };
    console.error(e);
    toast.error(map[e.code] || fallback);
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 780 }}>
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Entrar</motion.h1>

        {/* Banner de verificação pós-cadastro/pós-login por e-mail */}
        {mustVerify && (
          <div className="card mt-2" style={{ display:"grid", gap:10, borderColor:"rgba(255,122,0,.35)" }}>
            <div className="h2">Confirme seu e-mail</div>
            <div className="small" style={{ color:"var(--muted)" }}>
              Enviamos um link de verificação. Assim que confirmar, clique em <b>“Já verifiquei”</b> e te levaremos de volta para <b>{from}</b>.
            </div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              <button className="btn" onClick={resendVerification} disabled={sendingVerify}>
                {sendingVerify ? "Enviando…" : "Reenviar e-mail"}
              </button>
              <button className="btn btn-primary" onClick={iVerifiedNow}>Já verifiquei</button>
            </div>
          </div>
        )}

        {/* Card principal */}
        <div className="card mt-3" style={{ display:"grid", gap:16 }}>
          {/* Social */}
          <div className="social-grid">
            <SocialButton brand="google" onClick={signInGoogle} label="Entrar com Google" />
            <SocialButton brand="apple"  onClick={signInApple}  label="Entrar com Apple" />
          </div>

          <div className="or-divider"><span>ou</span></div>

          {/* E-mail / Telefone */}
          <div className="glass" style={{ padding: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <TabBtn active={tab === "email"} onClick={() => setTab("email")}><MailIcon /> E-mail</TabBtn>
              <TabBtn active={tab === "phone"} onClick={() => setTab("phone")}><PhoneIcon /> Telefone (SMS)</TabBtn>
            </div>

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
                      <button type="submit" className="btn btn-primary"><MailIcon /> Entrar</button>
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
                    <input placeholder="000.000.000-00" value={maskCpf(cpf)} onChange={(e)=>setCpf(e.target.value)} />
                    {cpf && <div className="small" style={{ color: cpfHint === "CPF inválido." ? "var(--danger)" : "var(--muted)" }}>{cpfHint}</div>}
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                      <button type="submit" className="btn btn-primary"><MailPlusIcon /> Criar conta</button>
                    </div>
                    <div className="small" style={{ color:"var(--muted)" }}>
                      Enviaremos um e-mail de verificação. Depois você pode vincular telefone/Google/Apple em “Minha conta”.
                    </div>
                  </form>
                )}
              </>
            )}

            {tab === "phone" && (
              <>
                {phase === "enter" ? (
                  <form onSubmit={phoneSendCode} className="grid" style={{ gap: 10 }}>
                    <label className="small">Telefone (formato internacional)</label>
                    <input placeholder="+55DDDNUMERO" value={phone} onChange={(e)=>setPhone(e.target.value)} />
                    <div id="recaptcha-container" />
                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                      <button type="submit" className="btn btn-primary"><PhoneIcon /> Receber código</button>
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
                      <button type="submit" className="btn btn-primary"><CheckIcon /> Confirmar</button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="small" style={{ color:"var(--muted)" }}>
            • Provedores unificados pelo Firebase Auth. CPF é exclusivo em <code>cpfs/</code> na criação.<br/>
            • Após entrar, gerencie seus provedores em <b>Minha conta</b>.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== Social Button (premium) ===== */
function SocialButton({ brand, onClick, label }) {
  const isGoogle = brand === "google";
  const style = isGoogle
    ? { background:"#fff", color:"#111", border:"1px solid #e6e6e6", padding:"14px 18px", borderRadius:12, fontWeight:900, letterSpacing:".2px", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:10, transition:"transform .12s, box-shadow .12s" }
    : { background:"#111", color:"#fff", border:"1px solid #2a2a2a", padding:"14px 18px", borderRadius:12, fontWeight:900, letterSpacing:".2px", display:"inline-flex", alignItems:"center", justifyContent:"center", gap:10, transition:"transform .12s, box-shadow .12s" };

  return (
    <button type="button" onClick={onClick} aria-label={label} style={style} className="btn-social"
      onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
      {isGoogle ? <GoogleIcon/> : <AppleIcon/>}
      <span>{label}</span>
    </button>
  );
}

/* ===== UI helpers ===== */
function TabBtn({ active, onClick, children }) {
  return (
    <button className="btn" onClick={onClick}
      style={{ background: active ? "linear-gradient(135deg, var(--brand), var(--brand-300))" : "#ffffff10",
               color: active ? "#111" : "var(--text)", borderColor: active ? "transparent" : "var(--border)" }}>
      {children}
    </button>
  );
}
function TabPill({ active, onClick, children }) {
  return (
    <button className="btn" onClick={onClick}
      style={{ background: active ? "#ffffff18" : "#ffffff0c", borderColor: active ? "var(--brand)" : "var(--border)" }}>
      {children}
    </button>
  );
}

/* ===== Ícones ===== */
function GoogleIcon(){return(<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.1 29.4 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 5 29.1 3 24 3 12.3 3 3 12.3 3 24s9.3 21 21 21 21-9.3 21-21c0-1.3-.1-2.7-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.4 16.8 18.8 13 24 13c3 0 5.7 1.1 7.7 3l5.7-5.7C33.7 5 29.1 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.3 0 10.1-2 13.7-5.2l-6.3-5.3C29.5 35.8 26.9 37 24 37c-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C9.3 40.6 16 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.7-4.9 7-11.3 7-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C9.3 40.6 16 45 24 45c11.7 0 21-9.3 21-21 0-1.3-.1-2.7-.4-3.9z"/></svg>)}
function AppleIcon(){return(<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.365 1.43c0 1.14-.463 2.245-1.195 3.045-.74.81-1.95 1.43-3.16 1.34-.13-1.1.46-2.265 1.19-3.065.78-.86 2.1-1.49 3.165-1.32zM21.5 17.03c-.58 1.3-.87 1.89-1.64 3.05-1.06 1.63-2.55 3.66-4.4 3.68-1.64.02-2.07-1.09-4.32-1.08-2.25.01-2.72 1.1-4.36 1.08-1.85-.02-3.26-1.85-4.32-3.48C.66 18.93-.69 14.6 1.37 11.6c1.03-1.53 2.87-2.5 4.86-2.53 1.91-.03 3.71 1.27 4.32 1.27.6 0 2.97-1.57 5.01-1.34.85.03 3.22.34 4.74 2.56-3.98 2.18-3.34 7.05 0 9.47z"/></svg>)}
function MailIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4-8 5L4 8V6l8 5 8-5v2Z"/></svg>)}
function MailPlusIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20 4H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h7v-2H4V9l8 5 8-5v2h2V6a2 2 0 0 0-2-2Zm0 2-8 5L4 6h16Z"/><path fill="currentColor" d="M19 15v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2Z"/></svg>)}
function PhoneIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.5 22h-11A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2h11A2.5 2.5 0 0 0 20 4.5v15A2.5 2.5 0 0 0 17.5 22ZM6.5 4A.5.5 0 0 0 6 4.5v13a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-11ZM12 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/></svg>)}
function CheckIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"/></svg>)}
