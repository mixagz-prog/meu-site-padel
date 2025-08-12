// src/components/ModalCpf.jsx
import { motion } from "framer-motion";

export default function ModalCpf({
  open,
  value,
  maskedValue,
  onChange,
  status = "idle", // idle | checking | ok | invalid | used | error
  loading = false,
  onConfirm,
  onSkip,
  onClose,
}) {
  if (!open) return null;

  const hints = {
    checking: "Verificando…",
    ok: "CPF disponível.",
    invalid: "CPF inválido.",
    used: "Este CPF já está em uso.",
    error: "Não foi possível validar agora.",
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <motion.div
        className="modal-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 140, damping: 18 }}
      >
        <div className="h2" style={{ marginBottom: 8 }}>Vincular CPF (opcional)</div>
        <div className="small" style={{ color: "var(--muted)", marginBottom: 12 }}>
          Vincule seu CPF para agilizar reservas e controle de presença.
          Você pode pular agora e fazer depois em <strong>Minha conta</strong>.
        </div>

        <label className="small">CPF</label>
        <input
          placeholder="000.000.000-00"
          value={maskedValue}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
        {status !== "idle" && (
          <div className="small" style={{
            color:
              status === "ok" ? "var(--success)" :
              status === "invalid" || status === "used" || status === "error" ? "var(--danger)" :
              "var(--muted)"
          }}>
            {hints[status] || ""}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button className="btn" onClick={onSkip} disabled={loading}>Agora não</button>
          <button className="btn" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={onConfirm} disabled={loading}>
            {loading ? "Salvando…" : "Salvar CPF e continuar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
