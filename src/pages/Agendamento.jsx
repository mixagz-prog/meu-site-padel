import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext";
import ModalCpf from "../components/ModalCpf.jsx";

import { db } from "../lib/firebase";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { isValidCpf, maskCpf, normalizeCpf } from "../utils/cpf";

/* ====== Helpers de data/horários ====== */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function makeDateAt(d, f){ const h=Math.floor(f); const m=Math.round((f-h)*60); const x=new Date(d); x.setHours(h,m,0,0); return x; }
function formatHM(f){ const h=Math.floor(f); const m=Math.round((f-h)*60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function keyToFloat(slotKey){ const [hh,mm]=slotKey.split(":").map(n=>parseInt(n,10)||0); return hh + mm/60; }
function formatRange(date, s){ const a=makeDateAt(date, s.start); const b=makeDateAt(date, s.end); const pad=n=>String(n).padStart(2,"0"); return `${pad(a.getHours())}:${pad(a.getMinutes())} – ${pad(b.getHours())}:${pad(b.getMinutes())}`; }

function genSlots(){
  const out=[];
  for(let t=8;t<18;t+=1) out.push({ key: formatHM(t), start:t, end:t+1 });
  for(let t=18;t<=22.5-1.5+0.0001;t+=1.5) out.push({ key: formatHM(t), start:t, end:t+1.5 });
  return out;
}
const ALL_SLOTS = genSlots();

/* ====== Calendário inline ====== */
function CalendarInline({ value, onChange, minDate }) {
  const [view, setView] = useState(startOfDay(value || new Date()));
  useEffect(()=>{ if(value) setView(startOfDay(value)); },[value]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const startWeekDay = (first.getDay()+6)%7; // segunda=0
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const cells = [];
  for(let i=0;i<startWeekDay;i++) cells.push(null);
  for(let d=1; d<=daysInMonth; d++) cells.push(new Date(year, month, d));

  const min = startOfDay(minDate || new Date());
  const canPrev = new Date(year, month, 1) > new Date(min.getFullYear(), min.getMonth(), 1);

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="btn" disabled={!canPrev} onClick={()=>setView(new Date(year, month-1, 1))}>◀</button>
        <div className="calendar-title">
          {view.toLocaleString("pt-BR", { month:"long", year:"numeric" })}
        </div>
        <button className="btn" onClick={()=>setView(new Date(year, month+1, 1))}>▶</button>
      </div>

      <div className="calendar-week">
        {["S","T","Q","Q","S","S","D"].map((d,i)=>(
          <div key={`${d}-${i}`} className="calendar-weekday">{d}</div>
        ))}
      </div>

      <div className="calendar-grid">
        {cells.map((d,i)=>{
          if (!d) return <div key={`empty-${i}`} className="calendar-cell calendar-empty"/>;
          const disabled = d < min;
          const selected = value && toDateKey(d) === toDateKey(value);
          return (
            <button
              key={toDateKey(d)}
              className={`calendar-cell ${selected ? "selected" : ""}`}
              disabled={disabled}
              onClick={()=> onChange(startOfDay(d))}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Agendamento(){
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  /* ====== Estado principal ====== */
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const dateKey = toDateKey(selectedDate);
  const [reservations, setReservations] = useState({}); // slotKey -> reserva
  const [events, setEvents] = useState({});             // slotKey -> evento
  const [seatsBySlot, setSeatsBySlot] = useState({});   // slotKey -> seats[]
  const [waitlistBySlot, setWaitlistBySlot] = useState({}); // slotKey -> [uids]
  const [profile, setProfile] = useState(null);

  /* ====== Carregar perfil p/ checar CPF (somente logado) ====== */
  useEffect(()=>{
    let off=false;
    (async()=>{
      if(!user){ setProfile(null); return; }
      try{
        const snap = await getDoc(doc(db,"users",user.uid));
        if(!off) setProfile(snap.exists()? snap.data(): null);
      }catch{ if(!off) setProfile(null); }
    })();
    return ()=>{ off=true; };
  },[user]);

  /* ====== Streams — só quando logado (evita permission-denied) ====== */
  useEffect(()=>{
    if (!user) { setReservations({}); return; }
    const unsub = onSnapshot(query(collection(db,"reservations",dateKey,"slots")),
      snap => { const map={}; snap.forEach(d=> map[d.id]=d.data()); setReservations(map); },
      err  => { console.warn("reservations snapshot error:", err.code); }
    );
    return ()=>unsub();
  },[user, dateKey]);

  useEffect(()=>{
    if (!user) { setEvents({}); return; }
    const unsub = onSnapshot(query(collection(db,"events",dateKey,"slots")),
      snap => { const map={}; snap.forEach(d=> map[d.id]=d.data()); setEvents(map); },
      err  => { console.warn("events snapshot error:", err.code); }
    );
    return ()=>unsub();
  },[user, dateKey]);

  useEffect(()=>{
    if (!user) { setSeatsBySlot({}); setWaitlistBySlot({}); return; }
    const unsubs=[];
    Object.keys(events).forEach(slotKey=>{
      const sCol = collection(db,"events",dateKey,"slots",slotKey,"seats");
      const wCol = collection(db,"events",dateKey,"slots",slotKey,"waitlist");

      unsubs.push(onSnapshot(query(sCol, orderBy("index","asc")),
        snap => {
          const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
          setSeatsBySlot(prev=>({...prev, [slotKey]:arr}));
        },
        err => console.warn("seats snapshot error:", err.code)
      ));

      unsubs.push(onSnapshot(query(wCol, orderBy("createdAt","asc")),
        snap => {
          const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
          setWaitlistBySlot(prev=>({...prev, [slotKey]:arr}));
        },
        err => console.warn("waitlist snapshot error:", err.code)
      ));
    });
    return ()=>{ unsubs.forEach(u=>u()); };
  },[user, events, dateKey]);

  /* ====== CPF modal ====== */
  const [cpfOpen, setCpfOpen] = useState(false);
  const [cpfValue, setCpfValue] = useState("");
  const [cpfStatus, setCpfStatus] = useState("idle");
  const [cpfSaving, setCpfSaving] = useState(false);
  const pendingReserveRef = useRef(null);

  const DISMISS_DAYS = 7;
  function shouldPromptCpf(p) {
    if (!user) return false;
    if (p?.cpf) return false;
    const key = "cpfPrompt.dismissUntil";
    const v = localStorage.getItem(key);
    if (!v) return true;
    return new Date(v) < new Date();
  }
  function dismissCpfForDays(days = DISMISS_DAYS) {
    const key = "cpfPrompt.dismissUntil";
    const d = new Date(); d.setDate(d.getDate() + days);
    localStorage.setItem(key, d.toISOString());
  }
  useEffect(() => {
    if (!cpfOpen) return;
    const n = normalizeCpf(cpfValue);
    if (!n) { setCpfStatus("idle"); return; }
    if (!isValidCpf(n)) { setCpfStatus("invalid"); return; }
    setCpfStatus("ok");
  }, [cpfValue, cpfOpen]);

  async function confirmCpfAndProceed() {
    try {
      const clean = normalizeCpf(cpfValue);
      if (!isValidCpf(clean)) { setCpfStatus("invalid"); return; }
      setCpfSaving(true);

      // mapeamento via cloud function utilitária (rules: create se não existir)
      const { setCpfMapping } = await import("../lib/firebase"); // lazy p/ não carregar cedo
      const res = await setCpfMapping(user.uid, clean);
      if (!res?.ok) {
        setCpfStatus(res?.reason === "used" ? "used" : "error");
        setCpfSaving(false);
        return;
      }
      setCpfSaving(false);
      setCpfOpen(false);
      const ctx = pendingReserveRef.current;
      if (ctx?.fn && ctx?.slotKey) await ctx.fn(ctx.slotKey);
    } catch {
      setCpfSaving(false);
      setCpfStatus("error");
    }
  }
  function skipCpfAndProceed() {
    dismissCpfForDays();
    setCpfOpen(false);
    const ctx = pendingReserveRef.current;
    if (ctx?.fn && ctx?.slotKey) ctx.fn(ctx.slotKey);
  }

  /* ====== Gate: se não logado, manda pro login e volta depois ====== */
  function openCpfThenProceed(slotKey, fn) {
    if (!user) {
      toast.info("Faça login para continuar.");
      navigate("/login", { replace: true, state: { from: location.pathname || "/agendamento" } });
      return;
    }
    if (shouldPromptCpf(profile)) {
      pendingReserveRef.current = { slotKey, fn };
      setCpfValue(""); setCpfStatus("idle"); setCpfOpen(true);
      return;
    }
    fn(slotKey);
  }

  /* ====== Ações ====== */
  async function reserveSlot(slotKey){
    if (!user) { toast.info("Faça login para reservar."); return; }
    const now = new Date();
    const start = makeDateAt(selectedDate, keyToFloat(slotKey));
    if (start.getTime() - now.getTime() < 20*60*1000) {
      toast.info("Só é possível reservar com 20 minutos de antecedência.");
      return;
    }
    // Firestore rules já barram se o slot existir; aqui só tentamos criar
    try {
      const ref = doc(db,"reservations",toDateKey(selectedDate),"slots",slotKey);
      await setDoc(ref, {
        uid: user.uid,
        name: user.displayName || user.email || "Usuário",
        startAt: start,
        createdAt: serverTimestamp(),
      }, { merge: false });
      toast.success("Reserva confirmada!");
    } catch (e) {
      console.error(e);
      // inclui casos: email não verificado (rules), etc.
      toast.error("Não foi possível reservar. Verifique sua verificação de e-mail/telefone.");
    }
  }

  async function joinEvent(slotKey){
    if (!user) { toast.info("Faça login para participar."); return; }
    const evt = events[slotKey]; if (!evt) return;
    const seats = seatsBySlot[slotKey] || [];
    const free = seats.find(s=>!s.taken);
    try{
      if (free) {
        await runTransaction(db, async (tx)=>{
          const sref = doc(db,"events",dateKey,"slots",slotKey,"seats", free.id);
          const ssnap = await tx.get(sref);
          const eref = doc(db,"events",dateKey,"slots",slotKey);
          const esnap = await tx.get(eref);
          if (!esnap.exists()) throw new Error("Evento não existe.");
          if (esnap.data().locked) throw new Error("Lista trancada.");
          if (!ssnap.exists()) throw new Error("Assento não existe.");
          if (ssnap.data().taken) throw new Error("Assento ocupado.");
          tx.update(sref, { taken:true, uid:user.uid });
        });
        toast.success("Você entrou no evento!");
      } else {
        const wref = doc(db,"events",dateKey,"slots",slotKey,"waitlist", user.uid);
        await setDoc(wref, { createdAt: serverTimestamp() }, { merge:false });
        toast.info("Evento lotado. Você entrou na fila de espera.");
      }
    }catch(e){
      console.error(e);
      toast.error(e.message || "Não foi possível participar.");
    }
  }

  /* ====== Derivados ====== */
  const now = new Date();
  const eventCards = useMemo(()=>{
    const arr = Object.entries(events).map(([slotKey, evt])=>{
      const ts = evt.slotStartAt?.toDate ? evt.slotStartAt.toDate() : (evt.slotStartAt || makeDateAt(selectedDate, keyToFloat(slotKey)));
      return { slotKey, ...evt, _start: ts };
    });
    return arr
      .filter(e => e._start.getTime() >= now.getTime())
      .sort((a,b)=> a._start - b._start);
  },[events, selectedDate, now]);

  const eventSlotKeys = useMemo(()=> new Set(Object.keys(events)), [events]);

  const availableSlots = useMemo(()=>{
    return ALL_SLOTS.filter(s=>{
      if (eventSlotKeys.has(s.key)) return false;
      const start = makeDateAt(selectedDate, s.start);
      if (start.getTime() < now.getTime() + 20*60*1000) return false;
      return true;
    });
  },[selectedDate, eventSlotKeys, now]);

  function isMine(k){ return reservations[k]?.uid === user?.uid; }

  /* ====== UI ====== */
  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>Agendamento</motion.h1>

        {/* Calendário */}
        <div className="card mt-2">
          <CalendarInline
            value={selectedDate}
            onChange={setSelectedDate}
            minDate={startOfDay(new Date())}
          />
        </div>

        {/* Eventos do dia */}
        <div className="card mt-3">
          <div className="h2">Eventos do dia</div>
          {eventCards.length === 0 ? (
            <div className="small" style={{ color:"var(--muted)" }}>
              Sem eventos nesta data.
            </div>
          ) : (
            <div className="grid grid-3 mt-2">
              {eventCards.map(evt=>{
                const slotKey = evt.slotKey;
                const seats = seatsBySlot[slotKey] || [];
                const taken = seats.filter(s=>s.taken).length;
                const cap = seats.length || evt.capacity || 0;
                const locked = !!evt.locked;
                const isInSeats = seats.some(s=> s.uid === user?.uid);
                const isInWait = (waitlistBySlot[slotKey] || []).some(w=> w.id === user?.uid);

                return (
                  <div key={slotKey} className="glass" style={{ padding:12, display:"grid", gap:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontWeight:800 }}>{evt.title || "Evento"}</div>
                      <span className="badge">{slotKey}</span>
                    </div>
                    {evt.imageUrl ? (
                      <img src={evt.imageUrl} alt={evt.title} style={{ width:"100%", height:140, objectFit:"cover", borderRadius:10, border:"1px solid var(--border)" }} />
                    ) : (
                      <div style={{ height:140, borderRadius:10, border:"1px solid var(--border)", background:"linear-gradient(135deg, rgba(255,122,0,.12), rgba(255,122,0,.06))", display:"grid", placeItems:"center", color:"var(--muted)" }}>
                        Sem imagem
                      </div>
                    )}
                    <div className="small" style={{ color:"var(--muted)" }}>
                      {evt.rules ? evt.rules : "—"}
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                      <span className="badge">Vagas: {taken}/{cap}</span>
                      {locked && <span className="badge badge-evento">Trancado</span>}
                      {isInSeats && <span className="badge" style={{ background:"linear-gradient(135deg, #1dd1a1, #10ac84)", color:"#111" }}>Você está dentro</span>}
                      {isInWait && <span className="badge" style={{ background:"#ffffff12" }}>Na fila</span>}
                    </div>

                    <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                      {isInSeats ? (
                        <button className="btn" disabled title="Para sair, fale com a administração.">Inscrito</button>
                      ) : locked ? (
                        <button className="btn" disabled>Lista trancada</button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={()=> openCpfThenProceed(slotKey, joinEvent)}
                        >
                          {taken < cap ? "Participar" : (isInWait ? "Na fila" : "Entrar na fila")}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Horários disponíveis */}
        <div className="card mt-3">
          <div className="h2">Horários disponíveis</div>
          <div className="small" style={{ color:"var(--muted)" }}>08–18 (1h) • 18–22:30 (1h30) — antecedência mínima 20 minutos.</div>

          <div className="grid grid-3 mt-2">
            {availableSlots.length === 0 ? (
              <div className="small" style={{ color:"var(--muted)" }}>Sem horários disponíveis para esta data.</div>
            ) : (
              availableSlots.map(s=>{
                const k = s.key;
                const res = reservations[k];
                const mine = isMine(k);
                return (
                  <div key={k} className="glass" style={{ padding:12, display:"grid", gap:8 }}>
                    <div style={{ fontWeight:800 }}>{formatRange(selectedDate, s)}</div>
                    <div className="small" style={{ color:"var(--muted)" }}>
                      {res ? `Reservado por ${res.name || "usuário"}` : "Disponível"}
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      {res ? (
                        <button className="btn" disabled title={mine ? "Reserva sua" : "Já reservado"}>
                          {mine ? "Reservado (você)" : "Indisponível"}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={()=> openCpfThenProceed(k, reserveSlot)}
                        >
                          Reservar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal CPF */}
        <ModalCpf
          open={cpfOpen}
          value={cpfValue}
          maskedValue={maskCpf(cpfValue)}
          onChange={setCpfValue}
          status={cpfStatus}
          loading={cpfSaving}
          onConfirm={confirmCpfAndProceed}
          onSkip={skipCpfAndProceed}
          onClose={()=> setCpfOpen(false)}
        />
      </div>
    </div>
  );
}
