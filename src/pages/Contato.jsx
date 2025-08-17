// src/pages/Contato.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

export default function Contato(){
  const { user } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", subject: "", message: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(()=>{
    if (!user) return;
    setForm(f=>({
      ...f,
      name: user.displayName || f.name,
      email: user.email || f.email,
      phone: user.phoneNumber || f.phone,
    }));
  },[user]);

  function onChange(e){
    const { name, value } = e.target;
    setForm(f=> ({...f, [name]: value}));
  }

  function validate(){
    if (!form.name.trim()) return "Informe seu nome.";
    if (!form.email.trim() && !form.phone.trim()) return "Informe e-mail ou telefone.";
    if (!form.subject.trim()) return "Informe o assunto.";
    if (!form.message.trim()) return "Escreva sua mensagem.";
    return null;
  }

  async function onSubmit(e){
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    // rate limit simples (cliente)
    const last = Number(localStorage.getItem("contact:last") || 0);
    if (Date.now() - last < 60_000) {
      toast.info("Aguarde um minuto antes de enviar outra mensagem.");
      return;
    }

    setSending(true);
    try{
      await addDoc(collection(db,"contactMessages"), {
        ...form,
        uid: user?.uid || null,
        createdAt: serverTimestamp(), // server time
        read: false,
      });
      localStorage.setItem("contact:last", String(Date.now()));
      toast.success("Mensagem enviada. Em breve entraremos em contato!");
      setForm({ name:"", email:"", phone:"", subject:"", message:"" });
    }catch(e){
      toast.error("Não foi possível enviar agora.");
    }finally{
      setSending(false);
    }
  }

  // Endereço mostrado e usado no mapa:
  const address = "Estrada Linha pedreira — São Miguel do Oeste - SC";
  const mapEmbedSrc = `https://www.google.com/maps?q=${encodeURIComponent(address)}&hl=pt-BR&z=15&output=embed`;
  const mapViewLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  // Ações rápidas (links diretos)
  const whatsappPhone = "5549988115526"; // <-- ajuste se necessário
  const whatsappMessage = "Olá! Vim pelo site da Reserva Padel 👋";
  const waUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const instagramHandle = "reserva.padel"; // <-- ajuste se necessário
  const igUrl = `https://instagram.com/${instagramHandle}`;

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Fale com a gente</motion.h1>
        <p className="lead mt-2">Tire dúvidas, solicite informações ou deixe seu feedback.</p>

        {/* AÇÕES RÁPIDAS (sempre visíveis) */}
        <div className="card mt-2" style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
          <a
            href={waUrl}
            target="_blank" rel="noopener noreferrer"
            className="btn"
            style={{
              display:"inline-flex", alignItems:"center", gap:10, padding:"12px 14px",
              borderRadius:16, border:"1px solid var(--border)",
              background:"linear-gradient(135deg,#ffffff,#f7f7f7)",
              color:"#0e4429", fontWeight:800, letterSpacing:".2px"
            }}
          >
            {/* ícone WhatsApp */}
            <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
              <path fill="#25D366" d="M19.11 17.26c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.68.15s-.78.97-.96 1.17-.36.22-.66.07a10.6 10.6 0 0 1-3.12-1.92 11.72 11.72 0 0 1-2.16-2.69c-.23-.4 0-.62.1-.77.1-.15.22-.37.34-.55.1-.18.15-.3.23-.5.07-.2.04-.37-.02-.52-.06-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1-1.04 2.44s1.06 2.83 1.2 3.03c.15.2 2.1 3.2 5.08 4.49 2.99 1.28 2.99.86 3.53.81.54-.04 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.43-.07-.12-.25-.2-.55-.35z"/>
              <path fill="#E9F8F0" d="M26.76 5.24A13 13 0 0 0 4.3 21.74L3 29l7.42-1.94A12.96 12.96 0 0 0 29 16c0-3.46-1.35-6.72-3.76-8.99zM10.6 25.63l-.46.13-4.36 1.14 1.16-4.25.13-.48-.31-.44a11 11 0 1 1 9 4.41 10.86 10.86 0 0 1-5.16-1.51l-.4-.22z"/>
            </svg>
            <span>WhatsApp</span>
          </a>

          <a
            href={igUrl}
            target="_blank" rel="noopener noreferrer"
            className="btn"
            style={{
              display:"inline-flex", alignItems:"center", gap:10, padding:"12px 14px",
              borderRadius:16, border:"1px solid var(--border)",
              background:"#111", color:"#fff", fontWeight:800, letterSpacing:".2px"
            }}
          >
            {/* ícone Instagram */}
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m-5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2.2A2.8 2.8 0 1 0 12 17.8 2.8 2.8 0 0 0 12 9.2m5.4-.9a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"/>
            </svg>
            <span>Instagram</span>
          </a>
        </div>

        <div className="mt-6" style={{ display:"grid", gridTemplateColumns:"1.1fr .9fr", gap:24 }}>
          {/* Formulário */}
          <form className="card" onSubmit={onSubmit} style={{ display:"grid", gap:12 }}>
            <label className="small">Nome
              <input name="name" value={form.name} onChange={onChange}
                placeholder="Seu nome completo"
                style={{ width:"100%", borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"10px 12px" }}
              />
            </label>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <label className="small">E-mail
                <input name="email" type="email" value={form.email} onChange={onChange}
                  placeholder="voce@email.com"
                  style={{ width:"100%", borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"10px 12px" }}
                />
              </label>
              <label className="small">Telefone
                <input name="phone" value={form.phone} onChange={onChange}
                  placeholder="(xx) xxxxx-xxxx"
                  style={{ width:"100%", borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"10px 12px" }}
                />
              </label>
            </div>

            <label className="small">Assunto
              <input name="subject" value={form.subject} onChange={onChange}
                placeholder="Sobre o que é?"
                style={{ width:"100%", borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"10px 12px" }}
              />
            </label>

            <label className="small">Mensagem
              <textarea name="message" rows={6} value={form.message} onChange={onChange}
                placeholder="Escreva sua mensagem..."
                style={{ width:"100%", borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"10px 12px" }}
              />
            </label>

            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button className="btn" type="button" onClick={()=> setForm({ name:"", email:"", phone:"", subject:"", message:"" })}>
                Limpar
              </button>
              <button className="btn btn-primary" type="submit" disabled={sending}>
                {sending ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>

          {/* Informações / Mapa */}
          <div className="card" style={{ display:"grid", gap:12 }}>
            <div className="h2">Informações</div>
            <div>
              <div><strong>Endereço:</strong> {address}</div>
              <div className="mt-1"><strong>WhatsApp:</strong> (49) 98811-5526</div>
              <div className="mt-1"><strong>E-mail:</strong> reserva.padel@gmail.com</div>
              <div className="mt-1"><strong>Horário:</strong> 08:00 às 21:00</div>
            </div>

            <div className="mt-2" style={{ borderRadius:12, overflow:"hidden", border:"1px solid var(--border)" }}>
              <iframe
                title="Reserva Padel - Localização"
                src={mapEmbedSrc}
                width="100%"
                height="260"
                style={{ border:0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <a className="btn" href={mapViewLink} target="_blank" rel="noopener noreferrer">
              Abrir no Google Maps
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
