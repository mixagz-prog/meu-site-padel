// src/pages/Hoje.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { resolveUserNames } from "../utils/userNames";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function makeDateAt(d, f){ const h=Math.floor(f); const m=Math.round((f-h)*60); const x=new Date(d); x.setHours(h,m,0,0); return x; }
function formatHM(f){ const h=Math.floor(f); const m=Math.round((f-h)*60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function genSlots(){
  const out=[];
  for(let t=8;t<18;t+=1) out.push({start:t, end:t+1});
  for(let t=18;t<=22.5-1.5+0.0001;t+=1.5) out.push({start:t, end:t+1.5});
  return out;
}
function formatRange(date, s){
  const a=makeDateAt(date, s.start), b=makeDateAt(date, s.end);
  const pad=n=>String(n).padStart(2,"0");
  return `${pad(a.getHours())}:${pad(a.getMinutes())} – ${pad(b.getHours())}:${pad(b.getMinutes())}`;
}

export default function Hoje(){
  const { user } = useAuth();

  // Hoje (fixo)
  const today = useMemo(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; },[]);
  const dateKey = toDateKey(today);
  const slots = useMemo(genSlots, []);
  const now = new Date();

  // Mostra apenas horários futuros de hoje
  const visibleSlots = useMemo(()=>{
    return slots.filter(s => makeDateAt(today, s.start) > now);
  }, [slots, today, now]);

  // Firestore data
  const [reservations, setReservations] = useState({});
  const [events, setEvents] = useState({});
  const [seatsBySlot, setSeatsBySlot] = useState({});
  const [participantNames, setParticipantNames] = useState({}); // uid -> nome

  // Subscriptions (apenas se logado por causa das Rules)
  useEffect(()=>{
    if (!user) { setReservations({}); return; }
    const unsub = onSnapshot(query(collection(db,"reservations",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setReservations(map);
    });
    return ()=>unsub();
  },[dateKey,user]);

  useEffect(()=>{
    if (!user) { setEvents({}); return; }
    const unsub = onSnapshot(query(collection(db,"events",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setEvents(map);
    });
    return ()=>unsub();
  },[dateKey,user]);

  useEffect(()=>{
    if (!user) { setSeatsBySlot({}); return; }
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
  },[events, dateKey, user]);

  // Nomes dos participantes
  useEffect(()=>{
    if (!user) { setParticipantNames({}); return; }
    const uids = new Set();
    Object.values(seatsBySlot).forEach(seats => (seats||[]).forEach(s=> s.uid && uids.add(s.uid)));
    if (!uids.size) { setParticipantNames({}); return; }
    resolveUserNames([...uids]).then(setParticipantNames);
  },[seatsBySlot, user]);

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
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Hoje — {dateKey}</motion.h1>

        {!user && (
          <div className="card mt-3">
            <div className="lead">Faça login para ver a agenda completa de hoje.</div>
            <div className="mt-2 small" style={{ color:"var(--muted)" }}>
              Por configuração de segurança, a listagem de reservas e eventos só aparece para usuários autenticados.
            </div>
            <div className="mt-3" style={{ display:"flex", gap:10 }}>
              <a className="btn btn-primary" href="/login">Entrar</a>
              <a className="btn" href="/materiais">Conheça nossos materiais</a>
            </div>
          </div>
        )}

        {user && (
          <div className="card mt-4" style={{ display:"grid", gap:10 }}>
            {visibleSlots.length === 0 && (
              <div className="small" style={{ color:"var(--muted)" }}>
                Não há mais horários para hoje.
              </div>
            )}

            {visibleSlots.map((s)=>{
              const slotKey = formatHM(s.start);
              const reserved = reservations[slotKey] || null;
              const evt = events[slotKey] || null;
              const { capacity, takenCount, names } = seatInfoFor(slotKey);

              return (
                <div key={slotKey} className="glass" style={{ padding:12, display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12 }}>
                  <div>
                    <div style={{ fontWeight:800 }}>{formatRange(today, s)}</div>

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
                              <img
                                src={evt.imageUrl}
                                alt={evt.title || "Imagem do evento"}
                                style={{ width:96, height:64, objectFit:"cover", borderRadius:8, border:"1px solid var(--border)" }}
                              />
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

                  {/* Página "Hoje" é somente leitura */}
                  <div className="small" style={{ color:"var(--muted)" }}>
                    {reserved ? "Reserva confirmada" : (evt ? "Evento" : "Livre")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
