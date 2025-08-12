// src/pages/QuadraHoje.jsx
import { useEffect, useMemo, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { resolveUserNames } from "../utils/userNames";

function toDateKey(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,"0"); const day=String(d.getDate()).padStart(2,"0"); return `${y}-${m}-${day}`; }

export default function QuadraHoje(){
  const [date] = useState(()=>{ const d=new Date(); d.setHours(0,0,0,0); return d; });
  const dateKey = toDateKey(date);
  const [events,setEvents]=useState({});
  const [reservations,setReservations]=useState({});
  const [seatsBySlot,setSeatsBySlot]=useState({});
  const [nameMap,setNameMap]=useState({});

  useEffect(()=>{
    const unsubEv = onSnapshot(query(collection(db,"events",dateKey,"slots"), orderBy("__name__")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data());
      setEvents(map);
    });
    const unsubRes = onSnapshot(query(collection(db,"reservations",dateKey,"slots"), orderBy("__name__")), snap=>{
      const map={}; snap.forEach(d=> map[d.id]=d.data());
      setReservations(map);
    });
    return ()=>{ unsubEv(); unsubRes(); };
  },[dateKey]);

  useEffect(()=>{
    const unsubs=[];
    Object.keys(events).forEach(slotKey=>{
      const col = collection(db,"events",dateKey,"slots",slotKey,"seats");
      const unsub = onSnapshot(query(col, orderBy("index","asc")), snap=>{
        const arr=[]; snap.forEach(d=> arr.push(d.data()));
        setSeatsBySlot(prev=> ({...prev, [slotKey]: arr}));
      });
      unsubs.push(unsub);
    });
    return ()=> unsubs.forEach(u=>u());
  },[events,dateKey]);

  useEffect(()=>{
    const uids = new Set();
    Object.values(seatsBySlot).forEach(seats=> (seats||[]).forEach(s=> s.uid && uids.add(s.uid)));
    if(uids.size===0) { setNameMap({}); return; }
    resolveUserNames([...uids]).then(setNameMap);
  },[seatsBySlot]);

  const slots = useMemo(()=> {
    const arr=[];
    for(let t=8;t<18;t+=1) arr.push({key:`${String(t).padStart(2,"0")}:00`, range:`${String(t).padStart(2,"0")}:00–${String(t+1).padStart(2,"0")}:00`});
    for(let t=18;t<=22;t+=1) arr.push({key:`${String(t).padStart(2,"0")}:00`, range:`${String(t).padStart(2,"0")}:00–${String(t+1).padStart(2,"0")}:30`}); // ilustrativo
    return arr;
  },[]);

  return (
    <div className="section">
      <div className="container">
        <h1 className="h1">Quadra — {dateKey}</h1>

        <div className="card mt-4" style={{ display:"grid", gap:10 }}>
          {slots.map(s=>{
            const res = reservations[s.key];
            const evt = events[s.key];
            const seats = seatsBySlot[s.key] || [];
            const taken = seats.filter(x=> x.taken && x.uid);
            return (
              <div key={s.key} className="glass" style={{ padding:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontWeight:800 }}>{s.range}</div>
                  <div className="small" style={{ color:"var(--muted)" }}>
                    {res ? "Reservado" : evt ? `${taken.length}/${seats.length} inscritos` : "Disponível"}
                  </div>
                </div>

                {evt && taken.length>0 && (
                  <div className="mt-2" style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {taken.map((t,i)=> <span key={i} className="badge">{nameMap[t.uid] || t.uid}</span>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="small mt-4" style={{ color:"var(--muted)" }}>
          Página pública (somente leitura). Para reservar ou se inscrever em eventos, faça login em <strong>/agendamento</strong>.
        </div>
      </div>
    </div>
  );
}
