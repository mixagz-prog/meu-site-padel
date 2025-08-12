// src/components/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import LoadingSplash from "./LoadingSplash";
import injectDateInputStyles from "../styles/dateInputGlobalStyles";
import { db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

// injeta estilos globais de <input type="date"> uma vez
injectDateInputStyles();

// ====== CONFIG DE HORÁRIOS ======
const precoHora = 90;
const precoHoraEMeia = 140;

function gerarSlotsHora() {
  const slots = [];
  for (let h = 8; h <= 17; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    slots.push({ hora: label, duracaoMin: 60, preco: precoHora, periodo: "diurno" });
  }
  return slots;
}
function gerarSlotsHoraEMeia() {
  return [
    { hora: "18:00", duracaoMin: 90, preco: precoHoraEMeia, periodo: "noturno" },
    { hora: "19:30", duracaoMin: 90, preco: precoHoraEMeia, periodo: "noturno" },
    { hora: "21:00", duracaoMin: 90, preco: precoHoraEMeia, periodo: "noturno" }, // NOVO
  ];
}

// ====== UI (uma ÚNICA const estilos) ======
const estilos = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0b0b0b",
    color: "#fff",
    padding: "2rem",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial",
  },
  container: { maxWidth: 1200, margin: "0 auto" },
  title: { margin: 0, marginBottom: "1rem", fontWeight: 900, letterSpacing: 0.2 },
  card: {
    background: "#111",
    border: "1px solid #222",
    borderRadius: "14px",
    padding: "1rem",
    marginTop: "1rem",
    boxShadow: "0 1px 12px rgba(0,0,0,.25)",
  },
  label: { display: "block", marginBottom: "0.5rem", fontWeight: 700 },
  input: {
    background: "#0f0f0f",
    border: "1px solid #f97316",
    color: "#fff",
    padding: "0.5rem 0.7rem",
    borderRadius: "12px",
    fontSize: "15px",
    outline: "none",
    accentColor: "#f97316",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "0.5rem",
    marginTop: "0.5rem",
  },
  slotRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    background: "#0f0f0f",
    border: "1px solid #262626",
    borderRadius: "12px",
    padding: "0.6rem 0.8rem",
  },
  tag: {
    padding: "0.15rem 0.5rem",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    fontWeight: 700,
  },
  price: {
    padding: "0.15rem 0.5rem",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.15)",
    fontWeight: 700,
  },
  btn: (warn) => ({
    backgroundColor: warn ? "#e11d48" : "#f97316",
    color: "#fff",
    border: "none",
    padding: "0.45rem 0.7rem",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  }),
  group: { display: "flex", gap: "0.5rem", alignItems: "center" },

  // Skeletons
  shimmerWrap: { position: "relative", overflow: "hidden", borderRadius: 12 },
  shimmer: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.08) 50%, rgba(255,255,255,0) 100%)",
    transform: "translateX(-100%)",
    animation: "shimmer 1.4s infinite",
  },
  skeletonRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    background: "#1a120d",
    border: "1px solid #2b201a",
    borderRadius: "12px",
    padding: "0.8rem",
    minHeight: 56,
  },
  skeletonLeft: { width: "50%", height: 16, background: "#3a2b22", borderRadius: 8 },
  skeletonRight: { width: 72, height: 28, background: "#3a2b22", borderRadius: 8 },
};

// Componente local de Skeleton
function SkeletonGrid({ count = 8 }) {
  return (
    <div style={estilos.grid}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ ...estilos.skeletonRow, ...estilos.shimmerWrap }}>
          <div style={estilos.skeletonLeft} />
          <div style={estilos.skeletonRight} />
          <div style={estilos.shimmer} />
        </div>
      ))}
    </div>
  );
}

// Toast simples
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return <div className="toast">{message}</div>;
}

// ====== COMPONENTE ======
export default function AdminPanel({ user }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const [data, setData] = useState("");
  const [ocupacoes, setOcupacoes] = useState({});
  const [bloqueios, setBloqueios] = useState({});
  const [loadingDay, setLoadingDay] = useState(false);
  const [toast, setToast] = useState(null);

  const slotsHora = useMemo(gerarSlotsHora, []);
  const slotsHoraEMeia = useMemo(gerarSlotsHoraEMeia, []);
  const allSlots = [...slotsHora, ...slotsHoraEMeia];

  // Checa admin
  useEffect(() => {
    (async () => {
      if (!user) {
        setIsAdmin(false);
        setLoadingAdmin(false);
        return;
      }
      try {
        setLoadingAdmin(true);
        const adminDoc = await getDoc(doc(db, "admins", user.uid));
        setIsAdmin(adminDoc.exists());
      } finally {
        setLoadingAdmin(false);
      }
    })();
  }, [user]);

  // Reservas do dia
  useEffect(() => {
    if (!data) { setOcupacoes({}); return; }
    setLoadingDay(true);
    const ref = collection(db, "bookings", data, "slots");
    const unsub = onSnapshot(ref, (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setOcupacoes(map);
      setLoadingDay(false);
    });
    return () => unsub();
  }, [data]);

  // Bloqueios do dia
  useEffect(() => {
    if (!data) { setBloqueios({}); return; }
    setLoadingDay(true);
    const ref = collection(db, "blocks", data, "slots");
    const unsub = onSnapshot(ref, (snap) => {
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setBloqueios(map);
      setLoadingDay(false);
    });
    return () => unsub();
  }, [data]);

  const statusSlot = (hora) => {
    if (bloqueios[hora]) return { type: "bloqueado", by: bloqueios[hora]?.reason || "Bloqueado" };
    if (ocupacoes[hora]) return { type: "ocupado", by: ocupacoes[hora]?.nome || "Reservado" };
    return { type: "livre" };
  };

  const cancelarReserva = async (hora) => {
    if (!isAdmin) return alert("Acesso negado.");
    if (!confirm(`Cancelar a reserva das ${hora}?`)) return;
    await deleteDoc(doc(db, "bookings", data, "slots", hora));
    setToast(`Reserva das ${hora} cancelada.`);
  };

  const bloquearSlot = async (hora) => {
    if (!isAdmin) return alert("Acesso negado.");
    if (!confirm(`Bloquear o horário ${hora}? (ninguém poderá reservar)`)) return;
    const blockRef = doc(db, "blocks", data, "slots", hora);
    try {
      await runTransaction(db, async (tx) => {
        const already = await tx.get(blockRef);
        if (already.exists()) throw new Error("Já está bloqueado.");
        tx.set(blockRef, { reason: "admin", createdAt: serverTimestamp() });
      });
      setToast(`Horário ${hora} bloqueado.`);
    } catch (e) {
      alert(e.message || "Não foi possível bloquear.");
    }
  };

  const desbloquearSlot = async (hora) => {
    if (!isAdmin) return alert("Acesso negado.");
    if (!confirm(`Desbloquear o horário ${hora}?`)) return;
    await deleteDoc(doc(db, "blocks", data, "slots", hora));
    setToast(`Horário ${hora} desbloqueado.`);
  };

  const exportCSV = () => {
    if (!data) return;
    const rows = [["data", "hora", "nome", "uid", "duracaoMin", "preco", "status"]];
    allSlots.forEach((s) => {
      const hora = s.hora;
      const occ = ocupacoes[hora];
      const blk = bloqueios[hora];
      if (blk) rows.push([data, hora, "", "", "", "", "bloqueado"]);
      else if (occ) rows.push([data, hora, occ.nome || "", occ.uid || "", occ.duracaoMin || "", occ.preco || "", "ocupado"]);
      else rows.push([data, hora, "", "", "", "", "livre"]);
    });

    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reservas_${data}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ====== ESTADOS ======
  if (!user) return <LoadingSplash text="Carregando sessão..." />;
  if (loadingAdmin) return <LoadingSplash text="Verificando permissões de administrador..." />;

  if (!isAdmin) {
    return (
      <div style={estilos.page}>
        <div style={estilos.container}>
          <h2 style={estilos.title}>Admin</h2>
          <div style={estilos.card}>
            Seu usuário não é admin. Peça para adicioná-lo em <code>admins/{user.uid}</code>.
          </div>
        </div>
      </div>
    );
  }

  // ====== UI PRINCIPAL ======
  return (
    <div style={estilos.page}>
      <div style={estilos.container}>
        <h2 style={estilos.title}>Painel Admin</h2>

        <div style={estilos.card}>
          <label style={estilos.label}>Selecione a data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={estilos.input}
          />
          <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem" }}>
            <button onClick={exportCSV} style={estilos.btn(false)} className="btn-primary" disabled={!data}>
              Exportar CSV do dia
            </button>
          </div>
        </div>

        {/* Skeletons enquanto carrega o dia */}
        {data && loadingDay && (
          <>
            <div style={estilos.card}>
              <h3 style={{ marginTop: 0 }}>Horários (1h) — 08:00 a 18:00</h3>
              <SkeletonGrid count={10} />
            </div>
            <div style={estilos.card}>
              <h3 style={{ marginTop: 0 }}>Horários (1h30) — 18:00 a 22:30</h3>
              <SkeletonGrid count={3} />
            </div>
          </>
        )}

        {/* Conteúdo real */}
        {data && !loadingDay && (
          <>
            <div style={estilos.card}>
              <h3 style={{ marginTop: 0 }}>Horários (1h) — 08:00 a 18:00</h3>
              <div style={estilos.grid}>
                {gerarSlotsHora().map((slot) => {
                  const st = statusSlot(slot.hora);
                  return (
                    <div key={`adm_${slot.hora}`} style={estilos.slotRow}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{slot.hora}</div>
                        <div style={{ fontSize: "0.9rem", color: "#bbb" }}>
                          {st.type === "ocupado" && `Ocupado por ${st.by}`}
                          {st.type === "bloqueado" && `Bloqueado (${st.by})`}
                          {st.type === "livre" && "Livre"}
                        </div>
                      </div>
                      <div style={estilos.group}>
                        <span style={estilos.price}>R$ {slot.preco}</span>
                        {st.type === "ocupado" && (
                          <button onClick={() => cancelarReserva(slot.hora)} style={estilos.btn(true)} className="btn-primary">
                            Cancelar
                          </button>
                        )}
                        {st.type === "bloqueado" ? (
                          <button onClick={() => desbloquearSlot(slot.hora)} style={estilos.btn(false)} className="btn-primary">
                            Desbloquear
                          </button>
                        ) : (
                          <button onClick={() => bloquearSlot(slot.hora)} style={estilos.btn(false)} className="btn-primary">
                            Bloquear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={estilos.card}>
              <h3 style={{ marginTop: 0 }}>Horários (1h30) — 18:00 a 22:30</h3>
              <div style={estilos.grid}>
                {gerarSlotsHoraEMeia().map((slot) => {
                  const st = statusSlot(slot.hora);
                  return (
                    <div key={`adm_${slot.hora}`} style={estilos.slotRow}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{slot.hora}</div>
                        <div style={{ fontSize: "0.9rem", color: "#bbb" }}>
                          {st.type === "ocupado" && `Ocupado por ${st.by}`}
                          {st.type === "bloqueado" && `Bloqueado (${st.by})`}
                          {st.type === "livre" && "Livre"}
                        </div>
                      </div>
                      <div style={estilos.group}>
                        <span style={estilos.price}>R$ {slot.preco}</span>
                        {st.type === "ocupado" && (
                          <button onClick={() => cancelarReserva(slot.hora)} style={estilos.btn(true)} className="btn-primary">
                            Cancelar
                          </button>
                        )}
                        {st.type === "bloqueado" ? (
                          <button onClick={() => desbloquearSlot(slot.hora)} style={estilos.btn(false)} className="btn-primary">
                            Desbloquear
                          </button>
                        ) : (
                          <button onClick={() => bloquearSlot(slot.hora)} style={estilos.btn(false)} className="btn-primary">
                            Bloquear
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {toast && <Toast message={`✅ ${toast}`} onClose={() => setToast(null)} />}

        {/* Keyframes shimmer + hover/anim + toast */}
        <style>{`
          @keyframes shimmer { 
            0% { transform: translateX(-100%); } 
            100% { transform: translateX(100%); } 
          }
          .btn-primary {
            transition: transform .12s ease, box-shadow .12s ease, filter .12s ease;
          }
          .btn-primary:hover {
            transform: translateY(-1px);
            filter: brightness(1.05);
            box-shadow: 0 6px 18px rgba(249,115,22,.18);
          }
          .toast {
            position: fixed;
            right: 16px;
            bottom: 16px;
            background: #0f0f0f;
            color: #fff;
            border: 1px solid #f97316;
            border-radius: 12px;
            padding: 12px 14px;
            font-weight: 800;
            box-shadow: 0 12px 32px rgba(0,0,0,.45);
            animation: toastIn .16s ease-out, toastOut .2s ease-in 3.8s forwards;
            z-index: 1000;
          }
          @keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes toastOut { to { opacity: 0; transform: translateY(10px); } }
        `}</style>
      </div>
    </div>
  );
}
