import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import { auth, db } from "../firebase";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

/* Helpers CPF + Telefone */
const digits = (s="") => s.replace(/\D+/g,"");
const isAllSameDigit = (d) => /^(\d)\1{10}$/.test(d);
function validateCPF(raw) {
  const d = digits(raw);
  if (d.length !== 11) return false;
  if (isAllSameDigit(d)) return false;
  let sum = 0; for (let i=0;i<9;i++) sum += parseInt(d[i])*(10-i);
  let rest = (sum*10)%11; if (rest===10) rest=0; if (rest!==parseInt(d[9])) return false;
  sum = 0; for (let i=0;i<10;i++) sum += parseInt(d[i])*(11-i);
  rest = (sum*10)%11; if (rest===10) rest=0; if (rest!==parseInt(d[10])) return false;
  return true;
}
const maskCPF = (s="") => {
  const d = digits(s).slice(0,11);
  const p1=d.slice(0,3), p2=d.slice(3,6), p3=d.slice(6,9), p4=d.slice(9,11);
  return [p1, p2&&("."+p2), p3&&("."+p3), p4&&("-"+p4)].filter(Boolean).join("");
};
const cpfToTechEmail = (cpf, domain="cpf.seusite") => `${digits(cpf)}@${domain}`;
const stripNonDigits = (s="") => s.replace(/\D+/g,"");
function formatPhoneBR(raw) {
  let d = stripNonDigits(raw);
  if (!d.startsWith("55")) d = "55" + d.replace(/^55/,"");
  const country = "+55", rest = d.slice(2);
  const ddd = rest.slice(0,2), num = rest.slice(2);
  if (!ddd) return country;
  if (num.length<=4) return `${country} ${ddd} ${num}`;
  if (num.length<=8) return `${country} ${ddd} ${num.slice(0,4)}-${num.slice(4)}`;
  return `${country} ${ddd} ${num[0]}${num.slice(1,5)}-${num.slice(5,9)}`;
}
function toE164BR(masked) {
  const d = stripNonDigits(masked);
  if (!d.startsWith("55")) return null;
  const nat = d.slice(2);
  if (nat.length<10 || nat.length>11) return null;
  return `+${d}`;
}

function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return <div className="toast">{message}</div>;
}

export default function Cadastro() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("cpf"); // "cpf" | "email"
  const [nome, setNome] = useState("");

  // CPF
  const [cpf, setCpf] = useState("");
  const cpfValid = validateCPF(cpf);

  // e-mail
  const [email, setEmail] = useState("");

  // senha
  const [senha, setSenha] = useState("");
  const [senha2, setSenha2] = useState("");

  // telefone p/ SMS
  const [phone, setPhone] = useState("+55");
  const phoneE164 = useMemo(() => toE164BR(phone), [phone]);

  // etapa pós-criação
  const [accountCreated, setAccountCreated] = useState(false);
  const [verifyTab, setVerifyTab] = useState("email"); // "email" | "sms"

  const [smsSent, setSmsSent] = useState(false);
  const [smsCode, setSmsCode] = useState("");
  const [verificationId, setVerificationId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => onAuthStateChanged(auth, () => {}), []);

  // recaptcha invisível (SMS)
  useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
  }, []);

  const createProfile = async (uid, extra = {}) => {
    await setDoc(
      doc(db, "users", uid),
      { nome: nome.trim(), cpf: cpfValid ? digits(cpf) : null, phone: phone?.trim() || null, createdAt: serverTimestamp(), ...extra },
      { merge: true }
    );
  };

  const canSubmitCPF =
    nome.trim().length >= 2 && cpfValid && senha && senha2 && senha === senha2;

  const canSubmitEmail =
    nome.trim().length >= 2 && /\S+@\S+\.\S+/.test(email) && senha && senha2 && senha === senha2;

  const handleCreateByCPF = async (e) => {
    e.preventDefault();
    if (!canSubmitCPF) return;
    try {
      setLoading(true);
      const techEmail = cpfToTechEmail(cpf);
      const cred = await createUserWithEmailAndPassword(auth, techEmail, senha);
      if (nome) await updateProfile(cred.user, { displayName: nome.trim() });
      await createProfile(cred.user.uid);
      setToast("Conta criada! Valide sua conta abaixo.");
      setAccountCreated(true);
    } catch (err) {
      alert("Não foi possível cadastrar por CPF. " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  const handleCreateByEmail = async (e) => {
    e.preventDefault();
    if (!canSubmitEmail) return;
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), senha);
      if (nome) await updateProfile(cred.user, { displayName: nome.trim() });
      await createProfile(cred.user.uid);
      setToast("Conta criada! Valide sua conta abaixo.");
      setAccountCreated(true);
    } catch (err) {
      alert("Não foi possível cadastrar. " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  const sendEmailVerify = async () => {
    try {
      if (!auth.currentUser) return alert("Faça login novamente.");
      setLoading(true);
      await sendEmailVerification(auth.currentUser);
      setToast("E-mail de verificação enviado. Verifique sua caixa de entrada.");
    } catch (e) {
      alert("Não foi possível enviar verificação por e-mail. " + (e?.message || ""));
    } finally { setLoading(false); }
  };

  const requestSms = async () => {
    if (!phoneE164) return alert("Telefone inválido. Ex.: +55 11 9XXXX-XXXX");
    try {
      setLoading(true);
      const confirmation = await signInWithPhoneNumber(auth, phoneE164, window.recaptchaVerifier);
      setVerificationId(confirmation.verificationId);
      setSmsSent(true);
      setToast("Código SMS enviado.");
    } catch (err) {
      window.recaptchaVerifier?.clear?.();
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      alert("Falha ao enviar SMS. " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  const confirmSmsAndLink = async () => {
    if (!verificationId || !smsCode) return;
    try {
      setLoading(true);
      const credential = PhoneAuthProvider.credential(verificationId, smsCode);
      if (!auth.currentUser) return alert("Faça login novamente.");
      await linkWithCredential(auth.currentUser, credential);
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        { phone: phoneE164, phoneVerifiedAt: serverTimestamp() },
        { merge: true }
      );
      setToast("Telefone verificado e vinculado à conta!");
      navigate("/agendamento", { replace: true });
    } catch (err) {
      alert("Não foi possível confirmar o código. " + (err?.message || ""));
    } finally { setLoading(false); }
  };

  if (!accountCreated) {
    return (
      <>
        <PageHeader title="Criar conta" subtitle="Cadastre-se para reservar e acompanhar seus horários." />

        <div className="card pad-lg" style={{maxWidth:720, margin:"0 auto"}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
            <button onClick={() => setTab("cpf")} className={`btn ${tab==="cpf" ? "btn-primary" : "btn-ghost"}`}>Cadastrar com CPF</button>
            <button onClick={() => setTab("email")} className={`btn ${tab==="email" ? "btn-primary" : "btn-ghost"}`}>Cadastrar com e-mail</button>
          </div>

          {/* CPF */}
          {tab === "cpf" && (
            <form onSubmit={handleCreateByCPF} className="grid" style={{gap:10}}>
              <div className="grid grid-2" style={{gap:10}}>
                <input className="input" type="text" placeholder="Nome completo" value={nome} onChange={(e)=>setNome(e.target.value)} required />
                <input className="input" type="text" placeholder="000.000.000-00" value={maskCPF(cpf)} onChange={(e)=>setCpf(e.target.value)} required />
              </div>
              {!cpf || cpfValid ? null : <div style={{ color:"#f87171", fontSize:13, fontWeight:800 }}>CPF inválido</div>}

              <div className="grid grid-2" style={{gap:10}}>
                <input className="input" type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e)=>setSenha(e.target.value)} required />
                <input className="input" type="password" placeholder="Confirmar senha" value={senha2} onChange={(e)=>setSenha2(e.target.value)} required />
              </div>

              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <button type="submit" className="btn btn-primary" disabled={!canSubmitCPF || loading}>Criar conta</button>
                <Link to="/login" className="btn btn-ghost">Já tenho conta</Link>
              </div>
              <span className="ph-sub">Ao criar conta com CPF, seu e-mail técnico será <code>xxxxxxxxxxx@cpf.seusite</code> (interno).</span>
            </form>
          )}

          {/* E-mail */}
          {tab === "email" && (
            <form onSubmit={handleCreateByEmail} className="grid" style={{gap:10}}>
              <div className="grid grid-2" style={{gap:10}}>
                <input className="input" type="text" placeholder="Nome completo" value={nome} onChange={(e)=>setNome(e.target.value)} required />
                <input className="input" type="email" placeholder="seuemail@dominio.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
              </div>
              <div className="grid grid-2" style={{gap:10}}>
                <input className="input" type="password" placeholder="Senha (mín. 6)" value={senha} onChange={(e)=>setSenha(e.target.value)} required />
                <input className="input" type="password" placeholder="Confirmar senha" value={senha2} onChange={(e)=>setSenha2(e.target.value)} required />
              </div>
              {senha && senha2 && senha !== senha2 && <div style={{ color:"#f87171", fontSize:13, fontWeight:800 }}>As senhas não coincidem</div>}

              <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                <button type="submit" className="btn btn-primary" disabled={!canSubmitEmail || loading}>Criar conta</button>
                <Link to="/login" className="btn btn-ghost">Já tenho conta</Link>
              </div>
            </form>
          )}

          <div className="section" />
          <div style={{display:"flex", gap:10, alignItems:"center", flexWrap:"wrap"}}>
            <button
              onClick={async () => {
                try {
                  const provider = new GoogleAuthProvider();
                  await signInWithPopup(auth, provider);
                  setToast("Conta criada com Google!");
                  navigate("/agendamento", { replace: true });
                } catch (e) {
                  alert("Não foi possível continuar com Google. " + (e?.message || ""));
                }
              }}
              className="btn btn-primary"
            >
              Continuar com Google
            </button>
            <span className="ph-sub">ou escolha uma das opções acima</span>
          </div>

          {toast && <Toast message={`✅ ${toast}`} onClose={() => setToast(null)} />}
        </div>

        <div id="recaptcha-container" />
      </>
    );
  }

  // ===== Validação (e-mail OU sms) =====
  return (
    <>
      <PageHeader title="Validar conta" subtitle="Escolha como quer confirmar sua conta para ativá-la." />

      <div className="card pad-lg" style={{maxWidth:720, margin:"0 auto"}}>
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:12}}>
          <button onClick={() => setVerifyTab("email")} className={`btn ${verifyTab==="email"?"btn-primary":"btn-ghost"}`}>Verificar por E-mail</button>
          <button onClick={() => setVerifyTab("sms")} className={`btn ${verifyTab==="sms"?"btn-primary":"btn-ghost"}`}>Verificar por SMS</button>
        </div>

        {verifyTab === "email" && (
          <div className="grid" style={{gap:10}}>
            <p className="ph-sub">Enviaremos um e-mail com um link de verificação. Depois de clicar no link, você já pode usar o sistema.</p>
            <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
              <button onClick={sendEmailVerify} className="btn btn-primary" disabled={loading}>Enviar verificação por e-mail</button>
              <button onClick={() => navigate("/agendamento", { replace: true })} className="btn btn-ghost">Já verifiquei — Continuar</button>
            </div>
          </div>
        )}

        {verifyTab === "sms" && (
          <div className="grid" style={{gap:10}}>
            <label className="ph-sub" style={{fontWeight:800}}>Telefone para SMS</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              placeholder="+55 11 9XXXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(formatPhoneBR(e.target.value))}
            />

            {!smsSent ? (
              <button onClick={requestSms} className="btn btn-primary" disabled={loading || !phoneE164}>
                Enviar código por SMS
              </button>
            ) : (
              <>
                <label className="ph-sub" style={{fontWeight:800}}>Código recebido por SMS</label>
                <input
                  className="input"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D+/g, ""))}
                />
                <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                  <button onClick={confirmSmsAndLink} className="btn btn-primary" disabled={loading || !smsCode}>
                    Confirmar código e vincular
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setSmsSent(false); setSmsCode(""); setVerificationId(null); }}>
                    Trocar número
                  </button>
                </div>
              </>
            )}

            <span className="ph-sub">Ao confirmar, seu telefone ficará vinculado à conta (poderá usar login por SMS).</span>
          </div>
        )}

        <div className="section" />
        <Link to="/login" className="btn btn-ghost">Voltar ao login</Link>

        {toast && <Toast message={`✅ ${toast}`} onClose={() => setToast(null)} />}
      </div>

      <div id="recaptcha-container" />
    </>
  );
}
