// src/pages/Contato.jsx
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import * as fb from "../lib/firebase";
const { db } = fb;

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

/* Guardar origem para retorno pós-login */
function saveFrom(location) {
  const from = { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state ?? null };
  try { sessionStorage.setItem("auth.from", JSON.stringify(from)); } catch {}
}

export default function Contato() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();

  const preset = location.state || {};
  const [subject, setSubject] = useState(preset.subject || "");
  const [productId, setProductId] = useState(preset.productId || "");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName || user.email?.split("@")[0] || "");
  }, [user]);

  const disabled = useMemo(() => {
    return !subject?.trim() || !message?.trim() || !user || busy;
  }, [subject, message, user, busy]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) {
      toast.info("Entre na sua conta para enviar a mensagem.");
      saveFrom(location);
      nav("/login", { state: { mode: "signin", from: { pathname: "/contato", state: { subject, productId } } } });
      return;
    }
    if (!subject?.trim() || !message?.trim()) {
      toast.info("Preencha pelo menos Assunto e Mensagem.");
      return;
    }

    try {
      setBusy(true);
      await addDoc(collection(db, "contactMessages"), {
        uid: user.uid,
        subject: subject.trim(),
        productId: productId || null,
        name: name?.trim() || null,
        email: user.email || null,
        phone: phone?.trim() || null,
        message: message.trim(),
        status: "new",
        createdAt: serverTimestamp(),
      });
      toast.success("Mensagem enviada! Entraremos em contato.");
      setMessage("");
      // opcional: redirecionar para home
      // nav("/", { replace: true });
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível enviar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  function forceLogin() {
    saveFrom(location);
    nav("/login", { state: { mode: "signin", from: { pathname: "/contato", state: { subject, productId } } } });
  }

  return (
    <div className="section">
      <div className="container">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{ padding: 20, display: "grid", gap: 16 }}
        >
          <div className="h1">Solicitar orçamento / Contato</div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Preencha os dados abaixo. Responderemos rapidamente com uma proposta.
          </div>

          {!user && (
            <div className="glass" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="small" style={{ color: "var(--muted)" }}>Você precisa estar logado para enviar mensagens.</div>
              <button className="btn" onClick={forceLogin}>Entrar</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid" style={{ gap: 12 }}>
            <div className="grid grid-2" style={{ gap: 12 }}>
              <div>
                <label className="small">Assunto*</label>
                <input
                  className="input"
                  placeholder="Ex.: Orçamento: Quadra Indoor Pro"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="small">Produto (opcional)</label>
                <input
                  className="input"
                  placeholder="Ex.: indoor-pro / outdoor-premium / club-kit"
                  value={productId}
                  onChange={e => setProductId(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-2" style={{ gap: 12 }}>
              <div>
                <label className="small">Seu nome</label>
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="small">Telefone (opcional)</label>
                <input
                  className="input"
                  placeholder="(DDD) 9 9999-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="small">Mensagem*</label>
              <textarea
                className="input"
                style={{ minHeight: 120 }}
                placeholder="Conte um pouco do seu projeto: local, indoor/outdoor, prazos e quantas quadras."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn" onClick={() => nav(-1)}>Voltar</button>
              <button type="submit" className="btn btn-primary" disabled={disabled}>
                {busy ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
