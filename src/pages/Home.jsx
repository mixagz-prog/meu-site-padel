// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fade = { hidden:{opacity:0,y:16}, show:{opacity:1,y:0,transition:{type:"spring",stiffness:120}} };
const pop  = { hidden:{opacity:0,scale:.96}, show:{opacity:1,scale:1,transition:{type:"spring",stiffness:140}} };

export default function Home() {
  return (
    <div>

      {/* HERO */}
      <section className="section" style={{ paddingTop: 64 }}>
        <div className="container">
          <div className="card" style={{ overflow:"hidden", position:"relative", padding:0 }}>
            {/* background image / fallback */}
            <div
              style={{
                position:"absolute", inset:0,
                backgroundImage: `url(/images/home/hero.jpg)`,
                backgroundSize:"cover", backgroundPosition:"center",
                filter:"brightness(.45) saturate(1)",
              }}
              onError={(e)=>{ e.currentTarget.style.background = "radial-gradient(800px 400px at 20% 0, rgba(255,122,0,.15), transparent 60%), #0a0a0a"; }}
            />
            {/* gradient overlay laranja sutil */}
            <div style={{
              position:"absolute", inset:0,
              background:"radial-gradient(900px 500px at 120% -10%, rgba(255,122,0,.18), transparent 60%)"
            }}/>

            <div style={{ position:"relative", padding:"54px min(6vw, 48px)", display:"grid", gap:16 }}>
              <motion.h1 className="h1" variants={fade} initial="hidden" animate="show">
                Padel com padrão de excelência
              </motion.h1>
              <motion.p className="lead" variants={fade} initial="hidden" animate="show">
                Agendamento rápido, eventos com fila inteligente e materiais premium.
                Um sistema profissional, no melhor estilo preto + laranja.
              </motion.p>

              <motion.div variants={fade} initial="hidden" animate="show" style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:8 }}>
                <Link to="/agendamento" className="btn btn-primary">Agendar agora</Link>
                <Link to="/materiais" className="btn">Ver materiais</Link>
              </motion.div>

              <motion.div variants={fade} initial="hidden" animate="show" style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:14 }}>
                <span className="badge">⚡ reservas em 2 cliques</span>
                <span className="badge">🎟️ eventos com assentos e fila</span>
                <span className="badge">🛡️ regras anti-no-show</span>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* DESTAQUES */}
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container grid grid-3">
          {[
            {icon:"🕒", title:"Agendamento ágil", text:"Horários dinâmicos (08–18 em 1h, 18–22:30 em 1h30) com antecedência mínima de 20min."},
            {icon:"👥", title:"Eventos inteligentes", text:"Assentos, lista de espera, tranca de lista e promoção automática pelo admin."},
            {icon:"🧰", title:"Materiais premium", text:"Qualidade e durabilidade para quadras e acessórios de alto nível."},
          ].map((f,i)=>(
            <motion.div key={i} className="glass" variants={pop} initial="hidden" whileInView="show" viewport={{ once:true, amount:.4 }} style={{ padding:16 }}>
              <div style={{ fontSize:28 }}>{f.icon}</div>
              <div className="h2 mt-2" style={{ fontSize:20 }}>{f.title}</div>
              <div className="small mt-1" style={{ color:"var(--muted)" }}>{f.text}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MATERIAIS EM DESTAQUE */}
      <section className="section">
        <div className="container">
          <div className="h2">Materiais em destaque</div>
          <div className="grid grid-3 mt-3">
            {[
              {img:"/images/home/material-1.jpg", title:"Gramado sintético X-Pro", desc:"Tração perfeita e desgaste mínimo para partidas intensas."},
              {img:"/images/home/material-2.jpg", title:"Iluminação LED Pro", desc:"Uniforme, econômica e com índice de reprodução de cor superior."},
              {img:"/images/home/material-3.jpg", title:"Vidros temperados 12mm", desc:"Segurança e visibilidade cristalina, aprovados para alto nível."},
            ].map((m,i)=>(
              <motion.article key={i} className="card" variants={pop} initial="hidden" whileInView="show" viewport={{ once:true, amount:.35 }} style={{ overflow:"hidden" }}>
                <div style={{
                  height:180, backgroundImage:`url(${m.img})`, backgroundSize:"cover", backgroundPosition:"center",
                  borderRadius:"10px", border:"1px solid var(--border)"
                }}
                onError={(e)=>{ e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,122,0,.15), rgba(255,122,0,.05))"; }}
                />
                <div className="h2 mt-2" style={{ fontSize:18 }}>{m.title}</div>
                <div className="small mt-1" style={{ color:"var(--muted)" }}>{m.desc}</div>
                <div className="mt-2">
                  <Link to="/materiais" className="btn">Ver detalhes</Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="section">
        <div className="container card">
          <div className="grid" style={{ gridTemplateColumns:"1.2fr .8fr" }}>
            <div>
              <div className="h2">Por que jogar aqui?</div>
              <ul className="small mt-2" style={{ color:"var(--muted)", lineHeight:1.6 }}>
                <li>• Sistema de reservas com confirmação e regras anti-abuso.</li>
                <li>• Eventos com assentos, fila e tranca (somente admin altera).</li>
                <li>• Painel do admin com ranking, bloqueios e mensagens de contato.</li>
                <li>• Materiais selecionados e curadoria técnica de ponta.</li>
              </ul>
              <div className="mt-3" style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <Link to="/diferenciais" className="btn">Ver diferenciais</Link>
                <Link to="/contato" className="btn btn-primary">Solicitar orçamento</Link>
              </div>
            </div>
            <div className="hide-sm">
              <div
                style={{
                  height:220, borderRadius:12, border:"1px solid var(--border)",
                  backgroundImage:"url(/images/home/quadra.jpg)",
                  backgroundSize:"cover", backgroundPosition:"center",
                }}
                onError={(e)=>{ e.currentTarget.style.background = "linear-gradient(135deg, rgba(255,122,0,.15), rgba(255,122,0,.05))"; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="section">
        <div className="container">
          <div className="h2">O que falam de nós</div>
          <div className="grid grid-3 mt-3">
            {[
              {name:"Marcos", text:"“Reservar ficou fácil demais. Em 2 cliques eu garanto meu horário.”"},
              {name:"Giulia", text:"“Eventos com fila e promoção automática evitaram confusão. Profissional!”"},
              {name:"Rafa", text:"“Materiais de primeira, iluminação top. Experiência premium.”"},
            ].map((t,i)=>(
              <motion.blockquote key={i} className="glass" variants={pop} initial="hidden" whileInView="show" viewport={{ once:true, amount:.3 }} style={{ padding:16 }}>
                <div className="small" style={{ color:"var(--muted)" }}>{t.text}</div>
                <div className="mt-2" style={{ fontWeight:800 }}>{t.name}</div>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section" style={{ paddingBottom: 80 }}>
        <div className="container card" style={{ textAlign:"center" }}>
          <div className="h2">Pronto para jogar?</div>
          <p className="small" style={{ color:"var(--muted)", marginTop:6 }}>
            Escolha seu horário e confirme em poucos segundos.
          </p>
          <div className="mt-3" style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap" }}>
            <Link to="/agendamento" className="btn btn-primary">Agendar agora</Link>
            <Link to="/contato" className="btn">Fale conosco</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
