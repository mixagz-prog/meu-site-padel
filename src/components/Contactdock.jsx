// src/components/ContactDock.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const WHATS_PHONE = "55XXXXXXXXXXX"; // <-- troque para o seu (ex: 5547999999999)
const IG_HANDLE   = "reservapadel";  // <-- troque para o seu @

export default function ContactDock({
  phone = WHATS_PHONE,
  instagram = IG_HANDLE,
  message = "Olá! Vim pelo site da Reserva Padel 👋",
  hideOn = [], // ex: ['/admin'] se quiser ocultar em rotas específicas
}) {
  const [open, setOpen] = useState(false);

  // constrói URLs bonitas
  const { waUrl, igUrl } = useMemo(() => {
    const clean = String(phone || "").replace(/\D/g, "");
    const wa = clean
      ? `https://wa.me/${clean}?text=${encodeURIComponent(message)}`
      : null;
    const ig = instagram ? `https://instagram.com/${instagram}` : null;
    return { waUrl: wa, igUrl: ig };
  }, [phone, instagram, message]);

  // opcional: esconder em rotas específicas
  const shouldHide = useMemo(() => {
    if (!hideOn.length) return false;
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    return hideOn.some((p) => path.startsWith(p));
  }, [hideOn]);

  if (shouldHide) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 9999,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        pointerEvents: "none", // o container não captura cliques, só os botões
      }}
      aria-live="polite"
    >
      <div style={{ display: "grid", gap: 10, justifyItems: "end" }}>
        {/* actions */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="dock-actions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              style={{
                display: "grid",
                gap: 8,
                pointerEvents: "auto", // habilita clique nos itens
              }}
            >
              {/* WhatsApp */}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dock-btn"
                  aria-label="Falar no WhatsApp"
                  title="Falar no WhatsApp"
                  style={btnStyle({
                    bg: "linear-gradient(135deg, #23d366, #18b956)",
                    border: "1px solid rgba(0,0,0,.15)",
                  })}
                >
                  <WhatsappIcon />
                  <span className="dock-label">WhatsApp</span>
                </a>
              )}

              {/* Instagram */}
              {igUrl && (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dock-btn"
                  aria-label="Abrir Instagram"
                  title="Abrir Instagram"
                  style={btnStyle({
                    bg: "linear-gradient(135deg, #FFDC80, #F77737, #C13584, #5851DB)",
                    border: "1px solid rgba(0,0,0,.15)",
                  })}
                >
                  <InstagramIcon />
                  <span className="dock-label">Instagram</span>
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB principal */}
        <button
          type="button"
          aria-label={open ? "Fechar contatos" : "Abrir contatos"}
          onClick={() => setOpen((v) => !v)}
          style={fabStyle}
        >
          <motion.div
            initial={false}
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{ display: "grid", placeItems: "center" }}
          >
            <ChatIcon />
          </motion.div>
        </button>
      </div>

      {/* estilos menores responsivos (texto some em telas muito estreitas) */}
      <style>
        {`
          @media (max-width: 420px) {
            .dock-label { display: none; }
          }
          .dock-btn:focus-visible {
            outline: 2px solid var(--brand, #ffb300);
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
}

/* ===== Styles Helpers ===== */
const fabStyle = {
  pointerEvents: "auto",
  width: 56,
  height: 56,
  borderRadius: 16,
  border: "1px solid var(--border, rgba(255,255,255,.15))",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.14), rgba(255,255,255,.06))",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  color: "var(--text, #fff)",
  display: "grid",
  placeItems: "center",
  boxShadow:
    "0 8px 28px rgba(0,0,0,.32), 0 2px 8px rgba(0,0,0,.24), inset 0 1px 0 rgba(255,255,255,.08)",
  cursor: "pointer",
};

function btnStyle({ bg, border }) {
  return {
    pointerEvents: "auto",
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    color: "#111",
    background: bg,
    border,
    boxShadow:
      "0 10px 24px rgba(0,0,0,.25), 0 1px 0 rgba(255,255,255,.2) inset",
    fontWeight: 800,
    letterSpacing: 0.2,
    textDecoration: "none",
  };
}

/* ====== Ícones (SVG inline) ====== */
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
        opacity=".9"
      />
    </svg>
  );
}
function WhatsappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.52 3.48A11.94 11.94 0 0 0 12.06 0C5.46 0 .09 5.37.09 12c0 2.11.55 4.1 1.51 5.84L0 24l6.29-1.64A11.88 11.88 0 0 0 12.06 24C18.66 24 24 18.63 24 12s-5.34-12-11.94-12Zm0 0"
        opacity=".2"
      />
      <path
        fill="#fff"
        d="M12.06 2.4c5.35 0 9.69 4.34 9.69 9.69s-4.34 9.69-9.69 9.69c-1.69 0-3.27-.43-4.65-1.2l-.33-.18-3.72.97.99-3.63-.19-.33a9.63 9.63 0 0 1-1.4-4.32c0-5.35 4.34-9.69 9.69-9.69Z"
      />
      <path
        fill="#1fa855"
        d="M8.4 6.96c-.21-.47-.43-.48-.63-.49l-.54-.01c-.2 0-.52.07-.79.38s-1.04 1-1.04 2.44 1.07 2.83 1.22 3.03c.15.2 2.08 3.19 5.09 4.34 2.51.99 3.02.8 3.56.75.54-.05 1.76-.72 2-1.43.25-.71.25-1.31.18-1.43-.07-.12-.27-.19-.56-.34-.29-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.95-.95 1.14-.17.19-.35.22-.64.07-.29-.14-1.22-.45-2.33-1.44-.86-.76-1.45-1.7-1.62-1.99-.17-.3-.02-.45.13-.6.13-.13.29-.35.43-.53.14-.18.18-.3.27-.5.09-.19.04-.36-.02-.51-.06-.15-.58-1.43-.81-1.95Z"
      />
    </svg>
  );
}
function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.3 2.4.5.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.5.4 1.2.5 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.9-.5 2.4-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.5.2-1.2.4-2.4.5-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.3-2.4-.5a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.5-.4-1.2-.5-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.9.5-2.4.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.5-.2 1.2-.4 2.4-.5C8.4 2.2 8.8 2.2 12 2.2Z"
      />
      <path
        fill="#fff"
        d="M12 5.9a6.1 6.1 0 1 0 0 12.2 6.1 6.1 0 0 0 0-12.2Zm0 10.1a4 4 0 1 1 0-8.1 4 4 0 0 1 0 8.1Zm6.5-10.5a1.4 1.4 0 1 1-2.9 0 1.4 1.4 0 0 1 2.9 0Z"
      />
    </svg>
  );
}
