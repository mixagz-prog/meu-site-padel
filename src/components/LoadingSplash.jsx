// src/components/LoadingSplash.jsx
import React from "react";

const wrap = {
  minHeight: "calc(100vh - 64px)",
  display: "grid",
  placeItems: "center",
  background:
    "radial-gradient(1000px 500px at 50% -20%, rgba(249,115,22,.08), transparent 60%), #0a0a0a",
  color: "#fff",
  padding: "32px 16px",
  fontFamily:
    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial",
};

const ring = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  border: "5px solid rgba(249,115,22,.25)",
  borderTopColor: "#f97316",
  animation: "spin 1s linear infinite",
};

export default function LoadingSplash({ text = "Carregando..." }) {
  return (
    <div style={wrap}>
      <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
        <div style={ring} />
        <div style={{ fontWeight: 800 }}>{text}</div>
      </div>
      {/* animação */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
