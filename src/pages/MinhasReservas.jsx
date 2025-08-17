// src/pages/MinhasReservas.jsx
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { db } from "../lib/firebase";
import {
  collectionGroup,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { buildICS, downloadICS, googleCalendarUrl } from "../utils/calendar";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

function toDateKey(d){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function parseFromPath(fullPath){
  const parts = fullPath.split("/");
  const i = parts.indexOf("events");
  const dateKey = parts[i+1];
  const slotKey = parts[i+3];
  return { dateKey, slotKey };
}
function makeDateFrom(dateKey, slotKey){
  const [h,m] = slotKey.split(":").map(Number);
  const [Y,Mo,D] = dateKey.split("-").map(Number);
  return new Date(Y, Mo-1, D, h, m, 0, 0);
}
function endByRule(start){
  const h = start.getHours() + start.getMinutes()/60;
  const ms = h < 18 ? 60*60*1000 : 90*60*1000;
  return new Date(start.getTime() + ms);
}
function fmtDateTime(d){
  return d.toLocaleString("pt-BR", { weekday:"short", day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" });
}
function dayBadge(d) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  const diff = Math.round((target - now) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return target.toLocaleDateString("pt-BR", { weekday:"short" });
}

export default function MinhasReservas(){
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "7" | "30"

  const [myReservations, setMyReservations] = useState([]);
  const [myEventSeats, setMyEventSeats] = useState([]);
  const [myWaitlists, setMyWaitlists] = useState([]);

  useEffect(()=>{
    if(!user) { setLoading(false); return; }
    setLoading(true);

    // Reservas individuais (apenas caminhos sob /reservations/**/slots/**)
    const qRes = query(collectionGroup(db, "slots"), where("uid","==",user.uid));
    const unsubRes = onSnapshot(qRes, (snap)=>{
      const rows = [];
      snap.forEach(d=>{
        // filtra para pegar só /reservations/.../slots/...
        if (!d.ref.path.includes("/reservations/")) return;
        const data = d.data();
        const startAt = data.startAt?.toDate?.() || new Date(data.startAt);
        rows.push({
          id: d.id,
          path: d.ref.path,
          dateKey: toDateKey(startAt),
          slotKey: `${String(startAt.getHours()).padStart(2,"0")}:${String(startAt.getMinutes()).padStart(2,"0")}`,
          startAt,
          endAt: endByRule(startAt),
          title: `Reserva de Quadra — ${d.id}`,
          name: data.name || data.uid,
          type: "reserva",
        });
      });
      setMyReservations(rows);
    }, (err)=>{ console.error("reservations onSnapshot:", err); });

    // Eventos (assentos onde eu estou taken=true)
    const qSeats = query(collectionGroup(db, "seats"), where("uid","==",user.uid), where("taken","==",true));
    const unsubSeats = onSnapshot(qSeats, (snap)=>{
      const rows = [];
      snap.forEach(d=>{
        const { dateKey, slotKey } = parseFromPath(d.ref.path);
        const startAt = makeDateFrom(dateKey, slotKey);
        rows.push({
          id: d.id,
          path: d.ref.path,
          dateKey, slotKey,
          startAt,
          endAt: endByRule(startAt),
          title: `Evento — ${slotKey} (${dateKey})`,
          type: "evento",
        });
      });
      setMyEventSeats(rows);
    }, (err)=>{ console.error("seats onSnapshot:", err); });

    // Fila (docs com campo uid == meu uid)
    const qWait = query(collectionGroup(db, "waitlist"), where("uid", "==", user.uid));
    const unsubWait = onSnapshot(qWait,(snap)=>{
      const rows=[];
      snap.forEach(d=>{
        const { dateKey, slotKey } = parseFromPath(d.ref.path);
        const startAt = makeDateFrom(dateKey, slotKey);
        rows.push({
          id: d.id,
          path: d.ref.path,
          dateKey, slotKey,
          startAt,
          endAt: endByRule(startAt),
          title: `Fila — ${slotKey} (${dateKey})`,
          type: "fila",
        });
      });
      setMyWaitlists(rows);
    }, (err)=>{ console.error("waitlist onSnapshot:", err); });

    return ()=>{ unsubRes(); unsubSeats(); unsubWait(); };
  },[user]);

  const now = new Date();
  const upcomingReservations = useMemo(
    ()=> myReservations.filter(r=> r.startAt.getTime() >= now.getTime()-5*60*1000).sort((a,b)=> a.startAt-b.startAt),
    [myReservations]
  );
  const upcomingEvents = useMemo(
    ()=> myEventSeats.filter(r=> r.startAt.getTime() >= now.getTime()-5*60*1000).sort((a,b)=> a.startAt-b.startAt),
    [myEventSeats]
  );
  const upcomingWait = useMemo(
    ()=> myWaitlists.filter(r=> r.startAt.getTime() >= now.getTime()-5*60*1000).sort((a,b)=> a.startAt-b.startAt),
    [myWaitlists]
  );

  useEffect(()=>{ if(user) setLoading(false); },[user,myReservations,myEventSeats,myWaitlists]);

  // filtros (7/30 dias)
  function inRange(d){
    if (filter === "all") return true;
    const days = filter === "7" ? 7 : 30;
    const max = new Date(); max.setDate(max.getDate()+days);
    return d.getTime() <= max.getTime();
  }
  const filteredReservations = upcomingReservations.filter(x => inRange(x.startAt));
  const filteredEvents = upcomingEvents.filter(x => inRange(x.startAt));
  const filteredWait = upcomingWait.filter(x => inRange(x.startAt));

  async function shareItem(item){
    const text = `${item.title}\n${fmtDateTime(item.startAt)} - ${fmtDateTime(item.endAt)}\n${window.location.origin}/agendamento`;
    const url = window.location.origin + "/agendamento";
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text, url }); return; } catch {}
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const opened = window.open(wa, "_blank", "noopener,noreferrer");
    if (!opened) {
      await navigator.clipboard.writeText(text).catch(()=>{});
      alert("Detalhes copiados para a área de transferência.");
    }
  }

  function addToCalendar(item){
    const blob = buildICS({
      title: item.title,
      description: item.type === "reserva" ? "Reserva confirmada." : item.type === "evento" ? "Evento confirmado." : "Fila de espera.",
      start: item.startAt,
      end: item.endAt,
      location: "Quadra de Padel",
      url: window.location.origin + "/agendamento",
    });
    downloadICS(`${item.type}-${item.dateKey}-${item.slotKey}.ics`, blob);
    const gUrl = googleCalendarUrl({
      title: item.title,
      details: item.type === "reserva" ? "Reserva confirmada." : item.type === "evento" ? "Evento confirmado." : "Fila de espera.",
      location: "Quadra de Padel",
      start: item.startAt,
      end: item.endAt
    });
    window.open(gUrl, "_blank", "noopener,noreferrer");
  }

  async function leaveWaitlist(item){
    // item.path já é o caminho completo do doc em /events/{dateKey}/slots/{slotKey}/waitlist/{uid}
    await deleteDoc(doc(db, item.path));
  }

  if (!user) {
    return (
      <div className="section">
        <div className="container">
          <div className="card">
            <div className="h2">Você precisa entrar</div>
            <div className="small" style={{ color:"var(--muted)" }}>Faça login para ver suas reservas.</div>
            <a className="btn btn-primary" href="/login">Ir para o login</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Minhas reservas</motion.h1>

        {/* Filtros */}
        <div className="card mt-3">
          <div className="chips">
            {[
              {key:"all", label:"Tudo"},
              {key:"7", label:"Próx. 7 dias"},
              {key:"30", label:"Próx. 30 dias"},
            ].map(opt=>(
              <button
                key={opt.key}
                className={`chip ${filter === opt.key ? "active" : ""}`}
                onClick={()=> setFilter(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* RESERVAS */}
        <section className="card mt-4">
          <div className="h2">Reservas futuras</div>
          <div className="mt-3" style={{ display:"grid", gap:10 }}>
            {filteredReservations.length === 0 && (
              <div className="small" style={{ color:"var(--muted)" }}>Você não possui reservas futuras.</div>
            )}
            {filteredReservations.map(item=>(
              <div key={item.path} className="glass" style={{ padding:12, display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{item.dateKey} — {item.slotKey}</div>
                  <div className="mt-1" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span className="badge badge-reserva">Reserva</span>
                    <span className="badge">{dayBadge(item.startAt)}</span>
                  </div>
                  <div className="small mt-1" style={{ color:"var(--muted)" }}>Em nome de: <strong>{item.name}</strong></div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn" onClick={()=> shareItem(item)}>Compartilhar</button>
                  <button className="btn" onClick={()=> addToCalendar(item)}>Adicionar à agenda</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EVENTOS */}
        <section className="card mt-4">
          <div className="h2">Eventos em que estou inscrito</div>
          <div className="mt-3" style={{ display:"grid", gap:10 }}>
            {filteredEvents.length === 0 && (
              <div className="small" style={{ color:"var(--muted)" }}>Você não está inscrito em eventos futuros.</div>
            )}
            {filteredEvents.map(item=>(
              <div key={item.path} className="glass" style={{ padding:12, display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{item.dateKey} — {item.slotKey}</div>
                  <div className="mt-1" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span className="badge badge-evento">Evento</span>
                    <span className="badge">{dayBadge(item.startAt)}</span>
                  </div>
                  <div className="small mt-1" style={{ color:"var(--muted)" }}>Evento</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn" onClick={()=> shareItem(item)}>Compartilhar</button>
                  <button className="btn" onClick={()=> addToCalendar(item)}>Adicionar à agenda</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FILAS */}
        <section className="card mt-4">
          <div className="h2">Minhas filas de espera</div>
          <div className="mt-3" style={{ display:"grid", gap:10 }}>
            {filteredWait.length === 0 && (
              <div className="small" style={{ color:"var(--muted)" }}>Você não está em nenhuma fila de espera.</div>
            )}
            {filteredWait.map(item=>(
              <div key={item.path} className="glass" style={{ padding:12, display:"grid", gridTemplateColumns:"1fr auto", alignItems:"center", gap:12 }}>
                <div>
                  <div style={{ fontWeight:700 }}>{item.dateKey} — {item.slotKey}</div>
                  <div className="mt-1" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span className="badge badge-fila">Fila</span>
                    <span className="badge">{dayBadge(item.startAt)}</span>
                  </div>
                  <div className="small mt-1" style={{ color:"var(--muted)" }}>Fila de espera</div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn" onClick={()=> shareItem(item)}>Compartilhar</button>
                  <button className="btn" onClick={()=> addToCalendar(item)}>Adicionar à agenda</button>
                  <button className="btn" onClick={()=> leaveWaitlist(item)}>Sair da fila</button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
