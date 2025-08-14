// src/pages/Agendamento.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import ModalCpf from "../components/ModalCpf.jsx";

import * as fb from "../lib/firebase";
const { db, auth, setCpfMapping } = fb;

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

import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import { isValidCpf, maskCpf, normalizeCpf } from "../utils/cpf";

/* ====== Helpers de data/horários ====== */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function makeDateAt(d, f){ const h=Math.floor(f); const m=Math.round((f-h)*60); const x=new Date(d); x.setHours(h,m,0,0); return x; }
function formatHM(f){ const h=Math.floor(f); const m=Math.round((f-h)*60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function keyToFloat(slotKey){ const [hh,mm]=slotKey.split(":").map(n=>parseInt(n,10)||0); return hh + mm/60; }
function fmtRange(date, s){ const a=makeDateAt(date, s.start); const b=makeDateAt(date, s.end); const pad=n=>String(n).padStart(2,"0"); return `${pad(a.getHours())}:${pad(a.getMinutes())} – ${pad(b.getHours())}:${pad(b.getMinutes())}`; }
function genSlots(){ const out=[]; for(let t=8;t<18;t+=1) out.push({ key: formatHM(t), start:t, end:t+1 }); for(let t=18;t<=22.5-1.5+0.0001;t+=1.5) out.push({ key: formatHM(t), start:t, end:t+1.5 }); return out; }
const ALL_SLOTS = genSlots();

/* ====== Helpers de rota ====== */
function saveFrom(location){
  const from = { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state ?? null };
  try { sessionStorage.setItem("auth.from", JSON.stringify(from)); } catch {}
  return from;
}

/* ====== Fallback nomes ====== */
async function fallbackResolveUserNames(uids){
  const out={};
  await Promise.all((uids||[]).map(async (uid)=>{
    try{
      const snap = await getDoc(doc(db,"users",uid));
      if (snap.exists()) {
        const d=snap.data();
        out[uid]=d?.name||d?.displayName||d?.email||"Usuário";
      }
    }catch{}
  }));
  return out;
}

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

  const weekdays = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"]; // chaves únicas
  return (
    <div className="calendar" aria-label="Calendário de agendamento">
      <div className="calendar-header">
        <button className="btn" disabled={!canPrev} onClick={()=>setView(new Date(year, month-1, 1))}>◀</button>
        <div className="calendar-title">{view.toLocaleString("pt-BR", { month:"long", year:"numeric" })}</div>
        <button className="btn" onClick={()=>setView(new Date(year, month+1, 1))}>▶</button>
      </div>
      <div className="calendar-week">
        {weekdays.map((d,i) => <div key={i} className="calendar-weekday">{d[0]}</div>)}
      </div>
      <div className="calendar-grid">
        {cells.map((d,i)=>{
          if (!d) return <div key={"e"+i} className="calendar-cell calendar-empty" aria-hidden="true"/>;
          const disabled = d < min;
          const selected = value && toDateKey(d) === toDateKey(value);
          return (
            <button key={d.toISOString()} className={`calendar-cell ${selected?"selected":""}`} disabled={disabled} onClick={()=> onChange(startOfDay(d))}>
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
  const nav = useNavigate();
  const location = useLocation();

  /* ====== Estado ====== */
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const dateKey = toDateKey(selectedDate);
  const [reservations, setReservations] = useState({});
  const [events, setEvents] = useState({});
  const [seatsBySlot, setSeatsBySlot] = useState({});
  const [waitlistBySlot, setWaitlistBySlot] = useState({});
  const [profile, setProfile] = useState(null);
  const [namesByUid, setNamesByUid] = useState({});

  /* ====== Perfil (CPF) ====== */
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

  /* ====== Streams (somente se logado, para não quebrar rules) ====== */
  useEffect(()=>{
    if (!user) { setReservations({}); return; }
    const unsub = onSnapshot(query(collection(db,"reservations",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setReservations(map);
    }, (err)=>{ console.warn("reservations snapshot:", err?.code || err); });
    return ()=>unsub();
  },[dateKey, user]);

  useEffect(()=>{
    if (!user) { setEvents({}); return; }
    const unsub = onSnapshot(query(collection(db,"events",dateKey,"slots")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data()); setEvents(map);
    }, (err)=>{ console.warn("events snapshot:", err?.code || err); });
    return ()=>unsub();
  },[dateKey, user]);

  useEffect(()=>{
    if (!user) { setSeatsBySlot({}); setWaitlistBySlot({}); return; }
    const unsubsSeats=[]; const unsubsWait=[];
    Object.keys(events).forEach(slotKey=>{
      const sCol = collection(db,"events",dateKey,"slots",slotKey,"seats");
      const wCol = collection(db,"events",dateKey,"slots",slotKey,"waitlist");

      const us = onSnapshot(query(sCol, orderBy("index","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
        setSeatsBySlot(prev=>({...prev, [slotKey]:arr}));
      }, (err)=>console.warn("seats", slotKey, err?.code || err));
      const uw = onSnapshot(query(wCol, orderBy("createdAt","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
        setWaitlistBySlot(prev=>({...prev, [slotKey]:arr}));
      }, (err)=>console.warn("waitlist", slotKey, err?.code || err));

      unsubsSeats.push(us); unsubsWait.push(uw);
    });
    return ()=>{ unsubsSeats.forEach(u=>u()); unsubsWait.forEach(u=>u()); };
  },[events, dateKey, user]);

  /* ====== Resolver nomes (UID->nome) ====== */
  useEffect(()=>{
    const allUids = new Set();
    Object.values(seatsBySlot).forEach(seats => seats?.forEach(s => { if (s?.uid) allUids.add(s.uid); }));
    Object.values(reservations).forEach(r => { if (r?.uid) allUids.add(r.uid); });
    const unknown = [...allUids].filter(uid => !namesByUid[uid]);
    if (unknown.length === 0) return;

    let cancel=false;
    (async()=>{
      const resolver = typeof fb.resolveUserNames === "function"
        ? fb.resolveUserNames
        : fallbackResolveUserNames;
      try{
        const map = await resolver(unknown);
        if (!cancel && map) setNamesByUid(prev => ({...prev, ...map}));
      }catch{}
    })();
    return ()=>{ cancel=true; };
  },[seatsBySlot, reservations, namesByUid]);

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

  /* ====== Autenticação (modal) ====== */
  const [authOpen, setAuthOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("Para reservar ou participar, faça login ou crie sua conta.");
  const [authBusy, setAuthBusy] = useState(false);
  const handledLoginOnceRef = useRef(false); // evita loop

  function openAuthPrompt() {
    handledLoginOnceRef.current = false; // reseta guard
    setAuthMessage("Para reservar ou participar, faça login ou crie sua conta.");
    saveFrom(location); // guarda origem
    setAuthOpen(true);
  }

  function goLogin(mode /* 'signin' | 'signup' */) {
    saveFrom(location);
    nav("/login", { state: { mode } });
    setTimeout(() => { window.location.hash = `#mode=${mode === "signup" ? "signup" : "signin"}`; }, 0);
  }

  function afterLoginSuccess() {
    if (handledLoginOnceRef.current) return;
    handledLoginOnceRef.current = true;
    setAuthOpen(false); // fecha modal
    setTimeout(() => {
      const ctx = pendingReserveRef.current;
      if (ctx?.fn && ctx?.slotKey) openCpfThenProceed(ctx.slotKey, ctx.fn);
    }, 120);
  }

  async function quickGoogle() {
    try {
      setAuthBusy(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
      afterLoginSuccess();
    } catch (e) {
      console.error(e);
      // toast opcional aqui
      goLogin("signin");
    } finally {
      setAuthBusy(false);
    }
  }

  async function quickApple() {
    try {
      setAuthBusy(true);
      const provider = new OAuthProvider("apple.com");
      provider.addScope("email");
      provider.addScope("name");
      await signInWithPopup(auth, provider);
      afterLoginSuccess();
    } catch (e) {
      console.warn("Apple quick sign-in falhou/indisponível.", e);
      goLogin("signin");
    } finally {
      setAuthBusy(false);
    }
  }

  // Se user aparecer por redirect externo, finalize uma única vez
  useEffect(() => {
    if (authOpen && user) afterLoginSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authOpen]);

  /* ====== Wrapper: auth + CPF ====== */
  function openCpfThenProceed(slotKey, fn) {
    if (!user) {
      pendingReserveRef.current = { slotKey, fn };
      openAuthPrompt();
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
    if (!user) { openCpfThenProceed(slotKey, reserveSlot); return; }
    const now = new Date();
    const start = makeDateAt(selectedDate, keyToFloat(slotKey));
    if (start.getTime() - now.getTime() < 20*60*1000) { return; }
    if (reservations[slotKey]) { return; }

    try {
      const ref = doc(db,"reservations",dateKey,"slots",slotKey);
      await setDoc(ref, { uid: user.uid, name: user.displayName || user.email || "Usuário", startAt: start, createdAt: serverTimestamp() }, { merge: false });
    } catch (e) {
      console.error(e);
    }
  }

  async function joinEvent(slotKey){
    if (!user) { openCpfThenProceed(slotKey, joinEvent); return; }
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
      } else {
        const wref = doc(db,"events",dateKey,"slots",slotKey,"waitlist", user.uid);
        await setDoc(wref, { createdAt: serverTimestamp() }, { merge:false });
      }
    }catch(e){
      console.error(e);
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
          <CalendarInline value={selectedDate} onChange={setSelectedDate} minDate={startOfDay(new Date())}/>
        </div>

        {/* Eventos do dia */}
        <div className="card mt-3">
          <div className="h2">Eventos do dia</div>
          {eventCards.length === 0 ? (
            <div className="small" style={{ color:"var(--muted)" }}>Sem eventos nesta data.</div>
          ) : (
            <div className="grid grid-3 mt-2">
              {eventCards.map(evt=>{
                const slotKey = evt.slotKey;
                const seats = (seatsBySlot[slotKey] || []).slice().sort((a,b)=> (a.index??999)-(b.index??999));
                const taken = seats.filter(s=>s.taken).length;
                const cap = seats.length || evt.capacity || 0;
                const locked = !!evt.locked;
                const isInSeats = seats.some(s=> s.uid === user?.uid);
                const isInWait = (waitlistBySlot[slotKey] || []).some(w=> w.id === user?.uid);
                const startAt = evt._start;

                const participantNames = seats.filter(s=>s.taken && s.uid).map(s=> (namesByUid[s.uid] || "Usuário"));

                return (
                  <div key={slotKey} className="glass" style={{ padding:12, display:"grid", gap:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ fontWeight:800 }}>{evt.title || "Evento"}</div>
                      <span className="badge">{slotKey}</span>
                    </div>

                    {evt.imageUrl ? (
                      <img src={evt.imageUrl} alt={evt.title || "Imagem do evento"} style={{ width:"100%", height:140, objectFit:"cover", borderRadius:10, border:"1px solid var(--border)" }} />
                    ) : (
                      <div style={{ height:140, borderRadius:10, border:"1px solid var(--border)", background:"linear-gradient(135deg, rgba(255,122,0,.12), rgba(255,122,0,.06))", display:"grid", placeItems:"center", color:"var(--muted)" }}>
                        Sem imagem
                      </div>
                    )}

                    <div className="small" style={{ color:"var(--muted)" }}>{evt.rules ? evt.rules : "—"}</div>

                    <div className="small" style={{ display:"grid", gap:6 }}>
                      <div><strong>Horário:</strong> {startAt?.toLocaleTimeString?.("pt-BR",{hour:"2-digit",minute:"2-digit"}) || slotKey}</div>
                      <div><strong>Capacidade:</strong> {cap} {locked && <span className="badge badge-evento" style={{ marginLeft:6 }}>Trancado</span>}</div>
                      {evt.createdBy && <div><strong>Criado por:</strong> {namesByUid[evt.createdBy] || "Admin"}</div>}
                      {evt._start && <div className="small" style={{ color:"var(--muted)" }}><em>{evt._start.toLocaleDateString("pt-BR", { weekday:"long", day:"2-digit", month:"long" })}</em></div>}
                    </div>

                    <div>
                      <div className="small" style={{ color:"var(--muted)", marginBottom:6 }}><strong>Participantes:</strong></div>
                      {participantNames.length === 0 ? (
                        <div className="small" style={{ color:"var(--muted)" }}>Nenhum participante confirmado ainda.</div>
                      ) : (
                        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                          {participantNames.map((nm, i)=>(<span key={i} className="badge">{nm}</span>))}
                        </div>
                      )}
                    </div>

                    <div style={{ display:"flex", gap:10, justifyContent:"space-between", alignItems:"center", flexWrap:"wrap" }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                        <span className="badge">Vagas: {taken}/{cap}</span>
                        {isInSeats && <span className="badge" style={{ background:"linear-gradient(135deg, #1dd1a1, #10ac84)", color:"#111" }}>Você está dentro</span>}
                        {isInWait && <span className="badge" style={{ background:"#ffffff12" }}>Na fila</span>}
                      </div>
                      <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                        {isInSeats ? (
                          <button className="btn" disabled title="Para sair, fale com a administração.">Inscrito</button>
                        ) : locked ? (
                          <button className="btn" disabled>Lista trancada</button>
                        ) : (
                          <button className="btn btn-primary" onClick={()=> openCpfThenProceed(slotKey, joinEvent)}>
                            {taken < cap ? "Participar" : (isInWait ? "Na fila" : "Entrar na fila")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Horários disponíveis (sem eventos) */}
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
                    <div style={{ fontWeight:800 }}>{fmtRange(selectedDate, s)}</div>
                    <div className="small" style={{ color:"var(--muted)" }}>
                      {res ? `Reservado por ${namesByUid[res.uid] || res.name || "usuário"}` : "Disponível"}
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      {res ? (
                        <button className="btn" disabled title={mine ? "Reserva sua" : "Já reservado"}>
                          {mine ? "Reservado (você)" : "Indisponível"}
                        </button>
                      ) : (
                        <button className="btn btn-primary" onClick={()=> openCpfThenProceed(k, reserveSlot)}>Reservar</button>
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

        {/* Modal de Autenticação */}
        {authOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <motion.div className="modal-card" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 140, damping: 18 }}>
              <div className="h2" style={{ marginBottom: 8 }}>Entre para continuar</div>
              <div className="small" style={{ color: "var(--muted)", marginBottom: 12 }}>{authMessage}</div>

              <div style={{ display:"grid", gap:8, marginBottom: 12 }}>
                <button className="btn btn-primary" disabled={authBusy} onClick={quickGoogle} style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                  {/* Google ícone */}
                  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.0 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19-8.5 19-19c0-1.3-.1-2.2-.4-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16.3 18.9 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C33.4 6.1 28.9 4 24 4 16.5 4 9.9 8.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.3-5.2l-6.1-5c-2 1.4-4.6 2.3-7.3 2.3-5.3 0-9.8-3.4-11.4-8.1l-6.5 5.0C9.5 39.4 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.0 2.6-2.9 4.7-5.3 6.2l.0.0 6.1 5C38.5 36.5 41 31 41 25c0-1.3-.1-2.2-.4-4.5z"/></svg>
                  Entrar com Google
                </button>
                <button className="btn" disabled={authBusy} onClick={quickApple} style={{ display:"flex", alignItems:"center", gap:8, justifyContent:"center" }}>
                  {/* Apple ícone */}
                  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.365 1.43c.267 1.95-1.007 3.87-2.83 4.31-.323-1.89 1.106-3.86 2.83-4.31zM20.64 17.25c-.57 1.3-.85 1.86-1.59 3-.98 1.5-2.36 3.37-4.08 3.38-1.53.02-1.93-.99-3.6-.99-1.66 0-2.1.96-3.62 1-1.74 .03-3.07-1.62-4.05-3.1-2.77-4.17-3.06-9.06-1.36-11.64 1.22-1.88 3.16-3.07 5.34-3.1 1.67-.03 3.25 1.11 3.6 1.11.35 0 2.5-1.37 4.22-1.17.72 .03 2.75 .29 4.05 2.2-3.56 2.03-2.98 7.33 .09 8.31z"/></svg>
                  Entrar com Apple
                </button>
              </div>

              <div style={{ display:"flex", gap:10, justifyContent:"flex-end", flexWrap:"wrap" }}>
                <button className="btn" onClick={()=> setAuthOpen(false)}>Cancelar</button>
                <button className="btn" onClick={()=> goLogin("signup")}>Criar conta</button>
                <button className="btn btn-primary" onClick={()=> goLogin("signin")}>Entrar</button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
