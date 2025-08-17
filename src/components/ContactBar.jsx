// src/components/ContactBar.jsx
import { useLocation } from "react-router-dom";

function WappIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="#25D366" d="M19.11 17.26c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.68.15s-.78.97-.96 1.17-.36.22-.66.07a10.6 10.6 0 0 1-3.12-1.92 11.72 11.72 0 0 1-2.16-2.69c-.23-.4 0-.62.1-.77.1-.15.22-.37.34-.55.1-.18.15-.3.23-.5.07-.2.04-.37-.02-.52-.06-.15-.68-1.64-.93-2.25-.24-.58-.48-.5-.66-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1-1.04 2.44s1.06 2.83 1.2 3.03c.15.2 2.1 3.2 5.08 4.49 2.99 1.28 2.99.86 3.53.81.54-.04 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.43-.07-.12-.25-.2-.55-.35z"/>
      <path fill="#E9F8F0" d="M26.76 5.24A13 13 0 0 0 4.3 21.74L3 29l7.42-1.94A12.96 12.96 0 0 0 29 16c0-3.46-1.35-6.72-3.76-8.99zM10.6 25.63l-.46.13-4.36 1.14 1.16-4.25.13-.48-.31-.44a11 11 0 1 1 9 4.41 10.86 10.86 0 0 1-5.16-1.51l-.4-.22z"/>
    </svg>
  );
}
function InstaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m-5 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2.2A2.8 2.8 0 1 0 12 17.8 2.8 2.8 0 0 0 12 9.2m5.4-.9a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z"/>
    </svg>
  );
}

// limpa telefone para wa.me
function toWaNumber(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.startsWith("55") ? digits : digits; // deixe como está; só removemos não-dígitos
}

export default function ContactBar({
  phone = "5549988115526",     // <-- TROQUE pelo seu
  instagram = "reserva.padel",  // <-- TROQUE pelo seu @
  message = "Olá! Vim pelo site da Reserva Padel 👋",
  hideOn = ["/admin"],         // rotas onde esconder
  position = "right",          // "right" | "left"
}) {
  const { pathname } = useLocation();
  if (hideOn.some(p => pathname.startsWith(p))) return null;

  const wa = `https://wa.me/${toWaNumber(phone)}?text=${encodeURIComponent(message)}`;
  const ig = `https://instagram.com/${instagram}`;

  const side = position === "left" ? { left: 14 } : { right: 14 };

  return (
    <div
      aria-label="Canais de contato"
      style={{
        position: "fixed",
        bottom: `calc(14px + env(safe-area-inset-bottom, 0))`,
        ...side,
        zIndex: 60,
        display: "grid",
        gap: 10,
      }}
    >
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "linear-gradient(135deg,#ffffff, #f7f7f7)",
          color: "#0e4429",
          boxShadow: "0 6px 18px rgba(0,0,0,.12)",
          fontWeight: 800,
          letterSpacing: ".2px",
        }}
      >
        <WappIcon />
        <span>WhatsApp</span>
      </a>

      <a
        href={ig}
        target="_blank"
        rel="noopener noreferrer"
        className="btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          borderRadius: 16,
          border: "1px solid var(--border)",
          background: "#111",
          color: "#fff",
          boxShadow: "0 6px 18px rgba(0,0,0,.16)",
          fontWeight: 800,
          letterSpacing: ".2px",
        }}
      >
        <InstaIcon />
        <span>Instagram</span>
      </a>
    </div>
  );
}
