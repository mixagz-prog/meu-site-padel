// src/pages/Agendamento.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Tooltip from "../components/Tooltip.jsx";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { db } from "../lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { resolveUserNames } from "../utils/userNames";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

// -----------------------------
// util de tempo/slots
// -----------------------------
function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function makeDateAt(d, f){ const h=Math.floor(f); const m=Math.round((f-h)*60); const x=new Date(d); x.setHours(h,m,0,0); return x; }
function has20MinLead(now, start){ return start.getTime() - now.getTime() >= 20*60*1000; }
function genSlots(){
  const out=[];
  for(let t=8;t<18;t+=1) out.push({start:t, end:t+1});
  for(let t=18;t<=22.5-1.5+0.0001;t+=1.5) out.push({start:t, end:t+1.5});
  return out;
}
function formatHM(f){ const h=Math.floor(f); const m=Math.round((f-h)*60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function formatRange(date, s){ const a=makeDateAt(date, s.start); const b=makeDateAt(date, s.end); const pad=n=>String(n).padStart(2,"0"); return `${pad(a.getHours())}:${pad(a.getMinutes())} – ${pad(b.getHours())}:${pad(b.getMinutes())}`; }

// -----------------------------
// página
// -----------------------------
export default function Agendamento(){
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const today = useMemo(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const [selectedDate, setSelectedDate] = useState(today);
  const dateKey = toDateKey(selectedDate);

  const slots = useMemo(genSlots, []);
  const now = new Date();

  // Somente mostrar horários futuros do dia atual.
  const visibleSlots = useMemo(()=>{
    return slots.filter(s=>{
      const start = makeDateAt(selectedDate, s.start);
      // se a data é hoje, oculta passados; se futuro, mostra todos
      if (toDateKey(selectedDate) === toDateKey(now)) {
        return start > now;
      }
      return true;
    });
  }, [slots, selectedDate, now]);

  // Firestore data
  const [reservations, setReservations] = useState({});
  const [events, setEvents] = useState({});
  const [seatsBySlot, setSeatsBySlot] = useState({});
  const [participantNames, setParticipantNames] = useState({}); // uid → nome
  const [blockedUntil, setBlockedUntil] = useState(null);

  // Admin quick-create
  const [adminEvent, setAdminEvent] = useState({ capacity: 8 });

  // snapshots
  useEffect(()=>{
    const unsub = onSnapshot(query(collection(db,"reservations",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setReservations(map);
    });
    return ()=>unsub();
  },[dateKey]);

  useEffect(()=>{
    const unsub = onSnapshot(query(collection(db,"events",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setEvents(map);
    });
    return ()=>unsub();
  },[dateKey]);

  useEffect(()=>{
    // subscribe seats for each event slot
    const unsubs=[];
    Object.keys(events).forEach(slotKey=>{
      const col = collection(db,"events",dateKey,"slots",slotKey,"seats");
      const unsub = onSnapshot(query(col, orderBy("index","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
        setSeatsBySlot(prev=> ({...prev, [slotKey]: arr}));
      });
      unsubs.push(unsub);
    });
    return ()=> unsubs.forEach(u=>u());
  },[events, dateKey]);

  // nomes dos participantes (uids -> name)
  useEffect(()=>{
    const uids = new Set();
    Object.values(seatsBySlot).forEach(seats => (seats||[]).forEach(s=> s.uid && uids.add(s.uid)));
    if (!uids.size) { setParticipantNames({}); return; }
    resolveUserNames([...uids]).then(setParticipantNames);
  },[seatsBySlot]);

  // bloqueios (adminBlocks)
  useEffect(()=>{
    if(!user) { setBlockedUntil(null); return; }
    const ref = doc(db,"adminBlocks", user.uid);
    const unsub = onSnapshot(ref, snap=>{
      if (!snap.exists()) { setBlockedUntil(null); return; }
      const val = snap.data().blockedUntil;
      const dt = val?.toDate?.() || (val ? new Date(val) : null);
      setBlockedUntil(dt);
    });
    return ()=>unsub();
  },[user]);

  const isBlocked = () => blockedUntil && blockedUntil.getTime() > Date.now();

  // verificação mínima: email verificado OU telefone
  const canReserve = !!(user && (user.emailVerified || user.phoneNumber));

  // actions
  async function openReserve(day, s){
    if (!user) { navigate("/login", { replace:false, state:{ from: "/agendamento" } }); return; }

    const slotKey = formatHM(s.start);
    const startAt = makeDateAt(day, s.start);
    const endAt = makeDateAt(day, s.end);

    if (!has20MinLead(new Date(), startAt)) { toast.info("Só é possível reservar com 20 minutos de antecedência."); return; }
    if (events[slotKey]) { toast.info("Há um evento neste horário."); return; }
    if (isBlocked()) { toast.error("Sua conta está temporariamente bloqueada para reservas."); return; }
    if (!isAdmin && !canReserve) { toast.info("Confirme seu e-mail ou use login por telefone para reservar."); return; }

    const ok = window.confirm(`Confirmar reserva de ${formatRange(day, s)}?`);
    if (!ok) return;

    try{
      await setDoc(doc(db,"reservations", toDateKey(day), "slots", slotKey), {
        uid: user.uid,
        name: user.displayName || user.email || user.phoneNumber || "Usuário",
        startAt,
        endAt,
        createdAt: serverTimestamp(),
      }, { merge:false });
      toast.success("Reserva confirmada!");
    }catch(e){
      toast.error("Não foi possível reservar. Talvez alguém tenha reservado antes.");
    }
  }

  async function joinEventSeat(slotKey, startAt, endAt){
    if (!user) { navigate("/login", { replace:false, state:{ from: "/agendamento" } }); return; }
    if (!has20MinLead(new Date(), startAt)) { toast.info("Faltam menos de 20 minutos para o horário."); return; }
    if (isBlocked()) { toast.error("Sua conta está temporariamente bloqueada."); return; }

    // Admin pode entrar mesmo sem verificação; usuário comum precisa ser verificado (coerente com experiência de reserva)
    if (!isAdmin && !canReserve) { toast.info("Confirme seu e-mail ou entre com telefone para participar."); return; }

    const evtRef = doc(db,"events", dateKey, "slots", slotKey);
    const seats = seatsBySlot[slotKey] || [];
    const free = seats.find(s=> !s.taken);
    if (!free) {
      // sem assento → se não estiver já na fila, adiciona
      try{
        await setDoc(doc(db,"events",dateKey,"slots",slotKey,"waitlist", user.uid), {
          uid: user.uid,
          createdAt: serverTimestamp(),
        }, { merge:false });
        toast.success("Você entrou na fila.");
      }catch{
        toast.info("Você já está na fila.");
      }
      return;
    }

    // ocupar assento livre com transação para evitar corrida
    try{
      await runTransaction(db, async (tx)=>{
        const seatRef = doc(db,"events",dateKey,"slots",slotKey,"seats", free.id);
        const seatSnap = await tx.get(seatRef);
        const evtSnap = await tx.get(evtRef);
        if (!evtSnap.exists()) throw new Error("Evento não encontrado.");
        if (evtSnap.data().locked) throw new Error("Lista trancada pelo administrador.");
        if (!seatSnap.exists) throw new Error("Assento não encontrado.");
        if (seatSnap.data().taken) throw new Error("Assento acabou de ser ocupado.");

        tx.update(seatRef, { taken:true, uid: user.uid });
      });
      toast.success("Inscrição confirmada!");
    }catch(e){
      toast.error(e.message || "Não foi possível entrar. Tente novamente.");
    }
  }

  async function joinWaitlist(slotKey){
    if (!user) { navigate("/login", { replace:false, state:{ from: "/agendamento" } }); return; }
    if (isBlocked()) { toast.error("Sua conta está temporariamente bloqueada."); return; }
    try{
      await setDoc(doc(db,"events",dateKey,"slots",slotKey,"waitlist", user.uid), {
        uid: user.uid,
        createdAt: serverTimestamp(),
      }, { merge:false });
      toast.success("Você entrou na fila.");
    }catch{
      toast.info("Você já está na fila.");
    }
  }

  // Admin quick create (sem imagem, nome simples)
  async function adminCreateEvent(s){
    if (!isAdmin) return;
    const slotKey = formatHM(s.start);
    if (events[slotKey] || reservations[slotKey]) { toast.info("Horário ocupado."); return; }

    const title = prompt("Nome do evento:", "Partida / Treino");
    if (title == null) return;

    const cap = Number(adminEvent.capacity) || 8;
    const evtRef = doc(db,"events", dateKey, "slots", slotKey);

    try{
      await setDoc(evtRef, {
        title: (title||"Evento").trim(),
        capacity: cap,
        rules: "",
        imageUrl: "",
        locked: false,
        slotStartAt: makeDateAt(selectedDate, s.start),
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      // cria assentos
      const batch = writeBatch(db);
      for(let i=1;i<=cap;i++){
        const seatRef = doc(collection(db,"events",dateKey,"slots",slotKey,"seats"));
        batch.set(seatRef, { index:i, taken:false, uid:null });
      }
      await batch.commit();
      toast.success("Evento criado.");
    }catch{
      toast.error("Falha ao criar evento.");
    }
  }

  // helpers calculados por slot
  function seatInfoFor(slotKey){
    const list = seatsBySlot[slotKey] || [];
    const capacity = list.length;
    const takenCount = list.filter(s=> s.taken && s.uid).length;
    const names = list.filter(s=> s.taken && s.uid).map(s=> participantNames[s.uid] || s.uid);
    return { capacity, takenCount, names };
  }

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Agendamento</motion.h1>

        {/* seleção de data */}
        <div className="card mt-3" style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
          <label className="small">Escolha o dia
            <input
              type="date"
              value={dateKey}
              min={toDateKey(today)}
              onChange={(e)=>{
                const [Y,Mo,D]=e.target.value.split("-").map(Number);
                const d=new Date(Y,Mo-1,D,0,0,0,0);
                setSelectedDate(d);
              }}
              style={{ marginLeft:8, borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"8px 10px" }}
            />
          </label>
          <div className="small" style={{ color:"var(--muted)" }}>Horários: 08–18 (1h), 18–22:30 (1h30). Antecedência mínima: 20 min.</div>
        </div>

        {/* lista de slots */}
        <div className="card mt-4" style={{ display:"grid", gap:10 }}>
          {visibleSlots.length === 0 && (
            <div className="small" style={{ color:"var(--muted)" }}>
              {toDateKey(selectedDate)===toDateKey(now) ? "Não há mais horários para hoje." : "Nenhum horário disponível nesta data."}
            </div>
          )}

          {visibleSlots.map((s)=>{
            const slotKey = formatHM(s.start);
            const reserved = reservations[slotKey] || null;
            const evt = events[slotKey] || null;

            const startAt = makeDateAt(selectedDate, s.start);
            const endAt = makeDateAt(selectedDate, s.end);
            const timeOk = has20MinLead(new Date(), startAt);

            const { capacity, takenCount, names } = seatInfoFor(slotKey);
            const userInSeat = !!(seatsBySlot[slotKey]?.some(seat=> seat.uid === user?.uid));
            const waitlistPossible = !!evt && takenCount >= capacity;

            // Reservar individual desabilitado quando:
            // - já reservado
            // - existe evento no slot
            // - sem antecedência
            // - usuário não logado / bloqueado / não verificado (exceto admin)
            const reserveDisabled =
              !!reserved || !!evt || !timeOk ||
              !user || isBlocked() || (!isAdmin && !canReserve);

            return (
              <div key={slotKey} className="glass" style={{ padding:12, display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12 }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ fontWeight:800 }}>{formatRange(selectedDate, s)}</div>

                    {/* Tooltip com regras do evento */}
                    {evt?.rules && (
                      <Tooltip label={evt.rules}>
                        <button type="button" className="badge" title="Regras/observações" style={{ cursor:"help" }}>ℹ️</button>
                      </Tooltip>
                    )}
                  </div>

                  {reserved ? (
                    <div className="small mt-2" style={{ color:"var(--muted)" }}>
                      Reservado por: <strong>{reserved.name}</strong>
                    </div>
                  ) : evt ? (
                    <>
                      <div className="small mt-2" style={{ color:"var(--muted)" }}>
                        Evento — {takenCount}/{capacity} inscritos {evt.locked ? "(trancado)" : ""}
                      </div>

                      {(evt.title || evt.imageUrl) && (
                        <div className="mt-2" style={{ display:"grid", gridTemplateColumns: evt.imageUrl ? "auto 1fr" : "1fr", gap:10, alignItems:"center" }}>
                          {evt.imageUrl && (
                            <img src={evt.imageUrl} alt={evt.title || "Imagem do evento"}
                                 style={{ width:96, height:64, objectFit:"cover", borderRadius:8, border:"1px solid var(--border)" }}/>
                          )}
                          {evt.title && <div style={{ fontWeight:800 }}>{evt.title}</div>}
                        </div>
                      )}

                      {names.length > 0 && (
                        <div className="mt-2" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {names.slice(0,8).map((n, i)=>(<span key={i} className="badge">{n}</span>))}
                          {names.length > 8 && <span className="badge">+{names.length-8}</span>}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="small mt-2" style={{ color:"var(--muted)" }}>Disponível</div>
                  )}
                </div>

                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  {/* Reservar individual */}
                  <button
                    className="btn btn-primary"
                    disabled={reserveDisabled}
                    onClick={()=> openReserve(selectedDate, s)}
                    aria-disabled={reserveDisabled}
                    title={reserveDisabled ? (
                      !user ? "Faça login para reservar"
                      : evt ? "Horário reservado para evento"
                      : !timeOk ? "Faltam menos de 20 minutos"
                      : isBlocked() ? "Conta bloqueada"
                      : (!isAdmin && !canReserve) ? "Verifique o e-mail ou entre com telefone"
                      : "Indisponível"
                    ) : "Confirmar reserva"}
                    style={reserveDisabled ? { opacity:.6, cursor:"not-allowed" } : undefined}
                  >
                    {reserved ? "Reservado" : "Reservar"}
                  </button>

                  {/* Evento: entrar na lista / fila — admin também pode */}
                  {evt && !reserved && (
                    <button
                      className="btn"
                      disabled={
                        evt.locked
                        || !timeOk
                        || userInSeat
                        || isBlocked()
                        || (!user)
                        || (!isAdmin && !canReserve)
                      }
                      onClick={()=> joinEventSeat(slotKey, startAt, endAt)}
                      title={
                        !user ? "Faça login para participar"
                        : evt.locked ? "Lista trancada"
                        : !timeOk ? "Faltam menos de 20 minutos"
                        : userInSeat ? "Você já está na lista"
                        : (!isAdmin && !canReserve) ? "Verifique o e-mail ou entre com telefone"
                        : undefined
                      }
                    >
                      {evt.locked ? "Lista trancada"
                        : userInSeat ? "Inscrito"
                        : (takenCount>=capacity ? "Entrar na fila" : "Entrar na lista")}
                    </button>
                  )}

                  {/* Fila explícita quando lotado */}
                  {evt && takenCount>=capacity && !userInSeat && (
                    <button className="btn" onClick={()=> joinWaitlist(slotKey)} disabled={!user || isBlocked()}>
                      Entrar na fila
                    </button>
                  )}

                  {/* Admin: criar evento rápido */}
                  {isAdmin && !reserved && !evt && (
                    <>
                      <input
                        type="number" min={1}
                        value={adminEvent.capacity}
                        onChange={e=> setAdminEvent({ capacity: e.target.value })}
                        style={{ width:80, borderRadius:12, border:"1px solid var(--border)", background:"#ffffff0f", color:"var(--text)", padding:"8px 10px" }}
                        title="Capacidade do evento"
                      />
                      <button className="btn" onClick={()=> adminCreateEvent(s)}>Criar evento</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
