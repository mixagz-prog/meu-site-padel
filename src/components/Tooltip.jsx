// src/components/Tooltip.jsx
import { useState, useRef, useEffect } from "react";

export default function Tooltip({ label, children, side = "top" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  const pos = {
    top: { bottom: "100%", left: "50%", transform: "translate(-50%,-8px)" },
    bottom: { top: "100%", left: "50%", transform: "translate(-50%,8px)" },
    left: { right: "100%", top: "50%", transform: "translate(-8px,-50%)" },
    right: { left: "100%", top: "50%", transform: "translate(8px,-50%)" },
  }[side];

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && label && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            maxWidth: 280,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "rgba(17, 24, 39, .98)",
            color: "var(--text)",
            fontSize: 12,
            lineHeight: 1.4,
            boxShadow: "0 8px 24px rgba(0,0,0,.35)",
            ...pos,
            whiteSpace: "pre-wrap",
          }}
        >
          {label}
        </div>
      )}
    </span>
  );
}
