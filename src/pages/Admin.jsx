// src/pages/Admin.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext.jsx";
import { db, storage } from "../lib/firebase";
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

const fade = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };

/* ========= util de horário ========= */
function startOfDay(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }
function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }
function makeDateAt(d, f){ const h=Math.floor(f); const m=Math.round((f-h)*60); const x=new Date(d); x.setHours(h,m,0,0); return x; }
function genSlots(){ const out=[]; for(let t=8;t<18;t+=1) out.push({start:t, end:t+1}); for(let t=18;t<=22.5-1.5+0.0001;t+=1.5) out.push({start:t, end:t+1.5}); return out; }
function formatHM(f){ const h=Math.floor(f); const m=Math.round((f-h)*60); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`; }
function formatRange(date, s){ const a=makeDateAt(date, s.start); const b=makeDateAt(date, s.end); const pad=n=>String(n).padStart(2,"0"); return `${pad(a.getHours())}:${pad(a.getMinutes())} – ${pad(b.getHours())}:${pad(b.getMinutes())}`; }
function keyToFloat(slotKey){ const [hh,mm]=slotKey.split(":").map(n=>parseInt(n,10)||0); return hh + mm/60; }
function short(uid){ return uid ? `${uid.slice(0,4)}…${uid.slice(-4)}` : "—"; }

export default function Admin(){
  const { user, isAdmin } = useAuth();
  const toast = useToast();

  if (!user) {
    return (
      <div className="section"><div className="container">
        <div className="card"><div className="h2">Área restrita</div>
          <div className="small" style={{ color:"var(--muted)" }}>Faça login com uma conta de administrador.</div>
        </div>
      </div></div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="section"><div className="container">
        <div className="card"><div className="h2">Acesso negado</div>
          <div className="small" style={{ color:"var(--muted)" }}>Esta página é exclusiva para administradores.</div>
        </div>
      </div></div>
    );
  }

  /* ======= estado ======= */
  const today = useMemo(()=> startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const dateKey = toDateKey(selectedDate);
  const slots = useMemo(genSlots, []);
  const [selectedSlotKey, setSelectedSlotKey] = useState(formatHM(slots[0].start));

  const [reservations, setReservations] = useState({});
  const [events, setEvents] = useState({});
  const [seatsBySlot, setSeatsBySlot] = useState({});
  const [waitlistBySlot, setWaitlistBySlot] = useState({});

  // form do evento
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState(8);
  const [rules, setRules] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [locked, setLocked] = useState(false);
  const fileInputRef = useRef(null);

  // métricas
  const [totalUsers, setTotalUsers] = useState(null);
  const [reservasPorJogador, setReservasPorJogador] = useState([]);

  // cache de nomes: uid -> displayName
  const [nameCache, setNameCache] = useState({});

  /* ======= subscriptions do dia ======= */
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
    const unsubsSeats=[]; const unsubsWait=[];
    Object.keys(events).forEach(slotKey=>{
      const colSeats = collection(db,"events",dateKey,"slots",slotKey,"seats");
      const unsubS = onSnapshot(query(colSeats, orderBy("index","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
        setSeatsBySlot(prev=> ({...prev, [slotKey]: arr}));
      });
      unsubsSeats.push(unsubS);

      const colWait = collection(db,"events",dateKey,"slots",slotKey,"waitlist");
      const unsubW = onSnapshot(query(colWait, orderBy("createdAt","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push({ id:d.id, ...d.data() }));
        setWaitlistBySlot(prev=> ({...prev, [slotKey]: arr}));
      });
      unsubsWait.push(unsubW);
    });
    return ()=> { unsubsSeats.forEach(u=>u()); unsubsWait.forEach(u=>u()); };
  },[events, dateKey]);

  /* ======= carregar evento no form quando slot muda ======= */
  useEffect(()=>{
    const evt = events[selectedSlotKey];
    if (evt) {
      setTitle(evt.title || "");
      setCapacity(evt.capacity || 8);
      setRules(evt.rules || "");
      setImageUrl(evt.imageUrl || "");
      setLocked(!!evt.locked);
    } else {
      setTitle("");
      setCapacity(8);
      setRules("");
      setImageUrl("");
      setLocked(false);
    }
  },[events, selectedSlotKey]);

  /* ======= contadores ======= */
  useEffect(()=>{
    (async ()=>{
      try {
        const usersAgg = await getCountFromServer(collection(db,"users"));
        setTotalUsers(usersAgg.data().count ?? 0);
      } catch {
        setTotalUsers(null);
      }
    })();
  },[]);

  useEffect(()=>{
    (async ()=>{
      try {
        const startFrom = new Date(); startFrom.setDate(startFrom.getDate()-30);
        const qSlots = query(
          collectionGroup(db,"slots"),
          where("startAt", ">=", startFrom),
          orderBy("startAt","desc"),
          limit(5000)
        );
        const snap = await getDocs(qSlots);
        const map = new Map();
        snap.forEach(d=>{
          const { uid } = d.data();
          if (!uid) return;
          map.set(uid, (map.get(uid)||0) + 1);
        });
        const arr = [...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20);
        setReservasPorJogador(arr);
      } catch {
        setReservasPorJogador([]);
      }
    })();
  },[dateKey]);

  /* ======= nomes (uid -> displayName) ======= */
  function getName(uid){
    if (!uid) return "—";
    return nameCache[uid] || short(uid);
  }
  useEffect(()=>{
    // colete UIDs de seats, waitlist e reservations do dia
    const want = new Set();
    Object.values(seatsBySlot).forEach(arr => arr.forEach(s => { if (s.uid) want.add(s.uid); }));
    Object.values(waitlistBySlot).forEach(arr => arr.forEach(w => want.add(w.id)));
    Object.values(reservations).forEach(r => { if (r.uid) want.add(r.uid); });

    const missing = [...want].filter(uid => !nameCache[uid]);
    if (missing.length === 0) return;

    let cancelled = false;
    (async ()=>{
      const updates = {};
      await Promise.all(missing.map(async (uid)=>{
        try{
          const snap = await getDoc(doc(db,"users",uid));
          updates[uid] = snap.exists() ? (snap.data().name || snap.data().displayName || snap.data().email || short(uid)) : short(uid);
        }catch{
          updates[uid] = short(uid);
        }
      }));
      if (!cancelled) setNameCache(prev => ({ ...prev, ...updates }));
    })();

    return ()=>{ cancelled = true; };
  },[seatsBySlot, waitlistBySlot, reservations, nameCache]);

  /* ======= helpers ======= */
  const eventRef = (slotKey=selectedSlotKey)=> doc(db,"events",dateKey,"slots",slotKey);
  const seatsCol = (slotKey=selectedSlotKey)=> collection(db,"events",dateKey,"slots",slotKey,"seats");
  const waitCol  = (slotKey=selectedSlotKey)=> collection(db,"events",dateKey,"slots",slotKey,"waitlist");
  const reservRef = (slotKey=selectedSlotKey)=> doc(db,"reservations",dateKey,"slots",slotKey);

  function currentSeats(slotKey=selectedSlotKey){ return seatsBySlot[slotKey] || []; }
  function takenCount(slotKey=selectedSlotKey){ return currentSeats(slotKey).filter(s=>s.taken).length; }

  /* ======= actions: criar / salvar ======= */
  async function createOrSaveEvent(){
    const slotKey = selectedSlotKey;
    if (reservations[slotKey]) { toast.info("Há uma reserva nesse horário."); return; }

    const evtData = {
      title: (title||"Evento").trim(),
      capacity: Number(capacity) || 1,
      rules: (rules||"").trim(),
      imageUrl: imageUrl || "",
      locked: !!locked,
      slotStartAt: makeDateAt(selectedDate, keyToFloat(slotKey)),
      createdBy: user.uid,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    try{
      const ref = eventRef(slotKey);
      const exists = !!events[slotKey];
      await setDoc(ref, evtData, { merge: exists });

      // seats -> criar/ajustar pela capacidade
      const seats = currentSeats(slotKey);
      const cap = Number(evtData.capacity);
      const batch = writeBatch(db);
      if (!seats.length) {
        for (let i=1;i<=cap;i++) {
          const sref = doc(seatsCol(slotKey));
          batch.set(sref, { index:i, taken:false, uid:null });
        }
      } else {
        const currentCap = seats.length;
        const taken = seats.filter(s=>s.taken).length;
        if (cap < taken) { toast.error(`Capacidade menor que ocupados (${taken}). Libere assentos antes.`); return; }
        if (cap > currentCap) {
          for (let i=currentCap+1; i<=cap; i++){
            const sref = doc(seatsCol(slotKey));
            batch.set(sref, { index:i, taken:false, uid:null });
          }
        } else if (cap < currentCap) {
          // remover assentos livres do final
          const sorted = [...seats].sort((a,b)=>b.index-a.index);
          let toRemove = currentCap - cap;
          for (const s of sorted) {
            if (toRemove<=0) break;
            if (!s.taken) { batch.delete(doc(db,"events",dateKey,"slots",slotKey,"seats", s.id)); toRemove--; }
          }
          if (toRemove>0) { toast.error("Não foi possível reduzir: assentos livres insuficientes."); return; }
        }
      }
      await batch.commit();
      toast.success("Evento salvo!");
    }catch(e){
      console.error(e);
      toast.error("Falha ao salvar evento.");
    }
  }

  async function toggleLock(){
    const slotKey = selectedSlotKey;
    try{
      await updateDoc(eventRef(slotKey), { locked: !locked, updatedAt: serverTimestamp() });
      setLocked(v=>!v);
      toast.info(!locked ? "Lista trancada." : "Lista destrancada.");
    }catch{ toast.error("Não foi possível alterar trava."); }
  }

  async function deleteEvent(){
    const slotKey = selectedSlotKey;
    if (!events[slotKey]) return;
    const ok = window.confirm("Remover evento e todos os assentos/fila?");
    if (!ok) return;
    try{
      const seats = await getDocs(seatsCol(slotKey));
      const wait  = await getDocs(waitCol(slotKey));
      const batch = writeBatch(db);
      seats.forEach(d=> batch.delete(d.ref));
      wait.forEach(d=> batch.delete(d.ref));
      batch.delete(eventRef(slotKey));
      await batch.commit();

      // tenta apagar imagem (se URL do Storage)
      const url = imageUrl || events[slotKey]?.imageUrl;
      if (url) { try { await deleteObject(storageRef(storage, url)); } catch {} }
      toast.success("Evento removido.");
    }catch{ toast.error("Falha ao remover."); }
  }

  /* ======= seats / waitlist / reservas ======= */
  async function joinSelf(){
    const slotKey = selectedSlotKey;
    const seats = currentSeats(slotKey);
    const free = seats.find(s=>!s.taken);
    if (!free) { toast.info("Sem vagas. Use a fila."); return; }
    try{
      await runTransaction(db, async (tx)=>{
        const sref = doc(db,"events",dateKey,"slots",slotKey,"seats", free.id);
        const ssnap = await tx.get(sref);
        const eref = eventRef(slotKey);
        const esnap = await tx.get(eref);
        if (!esnap.exists()) throw new Error("Evento não existe.");
        if (esnap.data().locked) throw new Error("Lista trancada.");
        if (!ssnap.exists()) throw new Error("Assento não existe.");
        if (ssnap.data().taken) throw new Error("Assento ocupado.");
        tx.update(sref, { taken:true, uid:user.uid });
      });
      toast.success("Você entrou na lista.");
    }catch(e){ toast.error(e.message || "Falha ao entrar."); }
  }

  async function freeSeat(seatId){
    const slotKey = selectedSlotKey;
    const seat = (seatsBySlot[slotKey] || []).find(s => s.id === seatId);
    const who = seat?.uid ? ` (${getName(seat.uid)})` : "";
    const ok = window.confirm(`Liberar o assento #${seat?.index ?? "?"}${who}?`);
    if (!ok) return;

    try{
      await updateDoc(doc(db,"events",dateKey,"slots",slotKey,"seats", seatId), { taken:false, uid:null });
      toast.info("Assento liberado.");
    }catch(e){
      console.error(e);
      toast.error("Falha ao liberar assento. Confirme se as Firestore Rules foram atualizadas para permitir update por admin.");
    }
  }

  async function removeFromWaitlist(uid){
    const slotKey = selectedSlotKey;
    try{
      await deleteDoc(doc(db,"events",dateKey,"slots",slotKey,"waitlist", uid));
      toast.info("Removido da fila.");
    }catch{ toast.error("Não foi possível remover da fila."); }
  }

  async function promoteFirstInQueue(){
    const slotKey = selectedSlotKey;
    const wl = waitlistBySlot[slotKey] || [];
    const seats = currentSeats(slotKey);
    const free = seats.find(s=>!s.taken);
    if (!free) { toast.info("Não há assentos livres."); return; }
    if (!wl.length) { toast.info("Fila vazia."); return; }
    const first = wl[0];
    try{
      await runTransaction(db, async (tx)=>{
        const eref = eventRef(slotKey);
        const esnap = await tx.get(eref);
        if (!esnap.exists()) throw new Error("Evento não existe.");
        if (esnap.data().locked) throw new Error("Lista trancada.");

        const sref = doc(db,"events",dateKey,"slots",slotKey,"seats", free.id);
        const ssnap = await tx.get(sref);
        if (!ssnap.exists()) throw new Error("Assento não existe.");
        if (ssnap.data().taken) throw new Error("Assento ocupado.");

        const wref = doc(db,"events",dateKey,"slots",slotKey,"waitlist", first.id);
        const wsnap = await tx.get(wref);
        if (!wsnap.exists()) throw new Error("Entrada da fila não existe.");

        tx.update(sref, { taken:true, uid:first.id });
        tx.delete(wref);
      });
      toast.success(`Promovido: ${getName(first.id)}`);
    }catch(e){ toast.error(e.message || "Falha ao promover."); }
  }

  async function freeReservation(slotKey){
    const res = reservations[slotKey];
    if (!res) return;
    const ok = window.confirm(`Liberar o horário ${slotKey} reservado por ${getName(res.uid)}?`);
    if (!ok) return;
    try{
      await deleteDoc(reservRef(slotKey));
      toast.info("Horário liberado.");
    }catch{ toast.error("Não foi possível liberar o horário."); }
  }

  /* ======= UI ======= */
  const headerSlot = selectedSlotKey;
  const headerTime = (() => {
    const f = keyToFloat(headerSlot);
    const s = {start:f, end: f < 18 ? f+1 : f+1.5};
    return formatRange(selectedDate, s);
  })();

  return (
    <div className="section">
      <div className="container">
        <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">Painel do Administrador</motion.h1>

        {/* RESUMO */}
        <div className="grid grid-3 mt-3">
          <div className="glass" style={{ padding: 16 }}>
            <div className="small" style={{ color:"var(--muted)" }}>Usuários</div>
            <div className="h2" style={{ fontSize: 28 }}>{totalUsers ?? "—"}</div>
          </div>
          <div className="glass" style={{ padding: 16 }}>
            <div className="small" style={{ color:"var(--muted)" }}>Eventos do dia</div>
            <div className="h2" style={{ fontSize: 28 }}>{Object.keys(events).length || "0"}</div>
          </div>
          <div className="glass" style={{ padding: 16 }}>
            <div className="small" style={{ color:"var(--muted)" }}>Reservas do dia</div>
            <div className="h2" style={{ fontSize: 28 }}>{Object.keys(reservations).length || "0"}</div>
          </div>
        </div>

        {/* CONTEXTO: data/slot escolhido */}
        <div className="card mt-3" style={{ display:"grid", gap:12 }}>
          <div className="h2" style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span>Editar evento</span>
            <span className="badge">{dateKey}</span>
            <span className="badge badge-evento">{headerTime}</span>
            {events[selectedSlotKey] ? <span className="badge">Evento existente</span> : <span className="badge" style={{ background:"#ffffff12" }}>Sem evento</span>}
            {reservations[selectedSlotKey] && <span className="badge" style={{ background:"#ffffff12" }}>Horário reservado</span>}
          </div>

          <div className="card" style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
            <label className="small">Dia
              <input
                type="date"
                value={dateKey}
                min={toDateKey(today)}
                onChange={(e)=>{
                  const [Y,Mo,D]=e.target.value.split("-").map(Number);
                  const d=new Date(Y,Mo-1,D,0,0,0,0);
                  setSelectedDate(d);
                }}
                style={{ marginLeft:8 }}
              />
            </label>

            <label className="small">Horário
              <select
                value={selectedSlotKey}
                onChange={(e)=> setSelectedSlotKey(e.target.value)}
                style={{ marginLeft:8 }}
              >
                {slots.map(s=>{
                  const k=formatHM(s.start);
                  return <option key={k} value={k}>{formatRange(selectedDate, s)}</option>;
                })}
              </select>
            </label>

            {reservations[selectedSlotKey] && !events[selectedSlotKey] && (
              <button className="btn" onClick={()=> freeReservation(selectedSlotKey)}>Liberar horário reservado</button>
            )}
          </div>

          {/* FORM DO EVENTO */}
          <div className="grid" style={{ gridTemplateColumns:"1fr 1fr" }}>
            <div className="glass" style={{ padding:12, display:"grid", gap:10 }}>
              <label className="small">Título</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Treino nível A" />

              <label className="small">Capacidade</label>
              <input type="number" min={1} value={capacity} onChange={e=>setCapacity(e.target.value)} />

              <label className="small">Regras / Observações</label>
              <textarea rows={5} value={rules} onChange={e=>setRules(e.target.value)} placeholder="Ex.: Chegar 10min antes, obrigatório protetor, etc." />
            </div>

            <div className="glass" style={{ padding:12, display:"grid", gap:10 }}>
              <div className="small">Imagem do evento</div>
              {imageUrl ? (
                <img src={imageUrl} alt="Evento" style={{ width:"100%", height:180, objectFit:"cover", borderRadius:10, border:"1px solid var(--border)" }} />
              ) : (
                <div style={{
                  height:180, borderRadius:10, border:"1px solid var(--border)",
                  background:"linear-gradient(135deg, rgba(255,122,0,.12), rgba(255,122,0,.06))",
                  display:"grid", placeItems:"center", color:"var(--muted)"
                }}>
                  Sem imagem
                </div>
              )}
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleUploadFile} />
                {imageUrl && <button className="btn" onClick={clearImage}>Remover imagem</button>}
              </div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"center" }}>
            <button className="btn btn-primary" onClick={createOrSaveEvent}>
              {events[selectedSlotKey] ? "Salvar alterações" : "Criar evento"}
            </button>
            {events[selectedSlotKey] && (
              <>
                <button className="btn" onClick={toggleLock}>{locked ? "Destrancar lista" : "Trancar lista"}</button>
                <button className="btn" onClick={joinSelf}>Entrar como jogador</button>
                <button className="btn" onClick={deleteEvent}>Excluir evento</button>
                <span className="badge">Ocupados: {takenCount(selectedSlotKey)} / {currentSeats(selectedSlotKey).length || capacity}</span>
                {locked && <span className="badge badge-evento">Lista trancada</span>}
              </>
            )}
          </div>
        </div>

        {/* SEATS + WAITLIST DO SLOT SELECIONADO */}
        {events[selectedSlotKey] ? (
          <div className="grid grid-3 mt-3">
            <div className="glass" style={{ padding:12 }}>
              <div className="h2" style={{ fontSize:18 }}>Assentos</div>
              <div className="mt-2" style={{ display:"grid", gap:6 }}>
                {(currentSeats(selectedSlotKey)).map(s=>(
                  <div key={s.id} className="glass" style={{ padding:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>#{s.index} &nbsp; {s.taken ? <strong>{getName(s.uid)}</strong> : <span className="small" style={{ color:"var(--muted)" }}>livre</span>}</div>
                    <div style={{ display:"flex", gap:8 }}>
                      {s.taken ? (
                        <button className="btn" onClick={()=>freeSeat(s.id)}>Liberar</button>
                      ) : (
                        <button className="btn" onClick={joinSelf}>Entrar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass" style={{ padding:12 }}>
              <div className="h2" style={{ fontSize:18 }}>Fila de espera</div>
              <div className="small" style={{ color:"var(--muted)" }}>
                { (waitlistBySlot[selectedSlotKey]?.length || 0) } na fila
              </div>
              <div className="mt-2" style={{ display:"grid", gap:6 }}>
                {(waitlistBySlot[selectedSlotKey]||[]).map(w=>(
                  <div key={w.id} className="glass" style={{ padding:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>{getName(w.id)}</div>
                    <button className="btn" onClick={()=> removeFromWaitlist(w.id)}>Remover</button>
                  </div>
                ))}
              </div>
              <div className="mt-2" style={{ display:"flex", gap:8 }}>
                <button className="btn" onClick={promoteFirstInQueue}>Promover primeiro</button>
              </div>
            </div>

            <div className="glass" style={{ padding:12 }}>
              <div className="h2" style={{ fontSize:18 }}>Resumo do horário</div>
              <div className="small" style={{ color:"var(--muted)" }}>Data: {dateKey}</div>
              <div className="small" style={{ color:"var(--muted)" }}>Horário: {headerTime}</div>
              <div className="small" style={{ color:"var(--muted)" }}>Título: {title || "—"}</div>
              <div className="small" style={{ color:"var(--muted)" }}>Capacidade: {capacity}</div>
              <div className="small" style={{ color:"var(--muted)" }}>Regras: {rules ? rules.slice(0,160) : "—"}</div>
              <div className="small" style={{ color:"var(--muted)" }}>Imagem: {imageUrl ? "sim" : "não"}</div>
            </div>
          </div>
        ) : (
          <div className="card mt-3">
            <div className="small" style={{ color:"var(--muted)" }}>
              Não há evento neste horário. Preencha o formulário acima para criar um.
            </div>
          </div>
        )}

        {/* LISTA DO DIA */}
        <div className="card mt-4" style={{ display:"grid", gap:10 }}>
          <div className="h2">Agenda do dia — {dateKey}</div>

          {slots.map((s)=>{
            const k = formatHM(s.start);
            const evt = events[k]; const res = reservations[k];
            return (
              <div key={k} className="glass" style={{
                padding:10, display:"grid", gridTemplateColumns:"1fr auto auto", gap:8, alignItems:"center",
                outline: k===selectedSlotKey ? "2px solid var(--brand)" : "1px solid var(--border)", borderRadius:12
              }}>
                <div>
                  <div style={{ fontWeight:800 }}>{formatRange(selectedDate, s)}</div>
                  <div className="small" style={{ color:"var(--muted)" }}>
                    {evt ? `Evento — ${takenCount(k)}/${(seatsBySlot[k]||[]).length || (evt.capacity||0)} ${evt.locked ? "(trancado)" : ""}` :
                     res ? `Reservado por ${getName(res.uid)}` :
                     "Livre"}
                  </div>
                </div>
                <button className="btn" onClick={()=> setSelectedSlotKey(k)}>Editar</button>
                {!evt && res && (
                  <button className="btn" onClick={()=> freeReservation(k)}>Liberar horário</button>
                )}
                {!evt && !res && (
                  <button className="btn btn-primary" onClick={()=>{
                    setSelectedSlotKey(k);
                    setTitle("Evento");
                    setRules("");
                    setCapacity(8);
                    setImageUrl("");
                  }}>Criar evento</button>
                )}
              </div>
            );
          })}
        </div>

        {/* RANKING (últimos 30 dias) */}
        <div className="card mt-4">
          <div className="h2">Reservas por jogador (30 dias)</div>
          {reservasPorJogador.length === 0 ? (
            <div className="small" style={{ color:"var(--muted)" }}>Sem dados recentes.</div>
          ) : (
            <div className="mt-2" style={{ display:"grid", gap:6 }}>
              {reservasPorJogador.map(([uid, count], i)=>(
                <div key={uid} className="glass" style={{ padding:8, display:"flex", justifyContent:"space-between" }}>
                  <div>#{i+1} &nbsp; {getName(uid)}</div>
                  <div className="badge">{count} reservas</div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
  
  /* ======= upload de imagem ======= */
  async function handleUploadFile(e){
    const file = e.target.files?.[0];
    if (!file) return;
    const slotKey = selectedSlotKey;
    try{
      const safeName = `${Date.now()}-${file.name.replace(/[^\w.\-]/g,"_")}`;
      const path = `events/${dateKey}/${slotKey}/${safeName}`;
      const sref = storageRef(storage, path);
      await uploadBytes(sref, file);
      const url = await getDownloadURL(sref);
      await updateDoc(eventRef(slotKey), { imageUrl: url, updatedAt: serverTimestamp() });
      setImageUrl(url);
      toast.success("Imagem atualizada.");
    }catch(e){
      console.error(e);
      toast.error("Falha ao enviar imagem.");
    }finally{
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function clearImage(){
    const slotKey = selectedSlotKey;
    if (!imageUrl) return;
    const ok = window.confirm("Remover imagem do evento?");
    if (!ok) return;
    try{
      await updateDoc(eventRef(slotKey), { imageUrl:"", updatedAt: serverTimestamp() });
      try { await deleteObject(storageRef(storage, imageUrl)); } catch {/* ok se não apagar */}
      setImageUrl("");
      toast.info("Imagem removida.");
    }catch{ toast.error("Falha ao remover imagem."); }
  }
}
