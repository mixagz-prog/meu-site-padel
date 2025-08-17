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
        createdAt: serverTimestamp(), // ⬅ server time
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

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Fale com a gente</motion.h1>
        <p className="lead mt-2">Tire dúvidas, solicite informações ou deixe seu feedback.</p>

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
              {<div className="mt-1"><strong>WhatsApp:</strong> (49) 98811-5526</div>}
              <div className="mt-1"><strong>E-mail:</strong> reserva.padel@gmail.com</div>
              <div className="mt-1"><strong>Horário:</strong> 08:00 às 21:00</div>
            </div>

            <div className="mt-2" style={{ borderRadius:12, overflow:"hidden", border:"1px solid var(--border)" }}>
              <iframe
                title="Reserva Padel - Localização"
                src={mapEmbedSrc}  // ✅ Embed que funciona em iframe
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
