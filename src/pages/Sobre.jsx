// src/pages/Sobre.jsx
import { motion } from "framer-motion";

export default function Sobre() {
  return (
    <div className="section">
      <div className="container">

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          style={{ padding: 22, display: "grid", gap: 10 }}
        >
          <div className="h1">Sobre nós</div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Somos especialistas em quadras de padel premium. Fazemos o serviço completo: do projeto à execução — base alinhada e nivelada, estrutura em aço galvanizado a quente, pintura eletrostática dupla em cores personalizadas, gradil premium, <strong>vidro 12 mm</strong> certificado e ferragens em <strong>inox 304</strong>.
          </div>
        </motion.div>

        <div className="card mt-3">
          <div className="h2">Nosso padrão construtivo</div>
          <div className="grid grid-3 mt-2">
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Projeto executivo</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Levantamento, layout, cortes e memorial. Planejamento que evita retrabalho e reduz custos.
              </div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Estrutura premium</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Aço galvanizado a quente, reforços laterais, corte/furação CNC e <em>powder coat</em> duplo para acabamento.
              </div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Vidro e gradil</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Temperado 12 mm (padrões internacionais), gradil 4 mm 50×50 galvanizado e com pintura eletrostática dupla.
              </div>
            </div>
          </div>
        </div>

        <div className="card mt-3">
          <div className="h2">Grama sintética 12 mm</div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Monofilamento reforçado, 9.500 Dtex, 58.800 fios/m², backing PP+PP+SBR (3 camadas) — base em sarja dupla, menor risco de rasgos, longa durabilidade e cores estáveis.
          </div>
        </div>

        <div className="card mt-3">
          <div className="h2">Como trabalhamos</div>
          <div className="grid grid-4 mt-2">
            <div className="glass" style={{ padding: 14 }}>
              <div className="badge">1</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Briefing</div>
              <div className="small" style={{ color: "var(--muted)" }}>Visita técnica e plano de obra.</div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div className="badge">2</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Projeto</div>
              <div className="small" style={{ color: "var(--muted)" }}>Documentação e cronograma.</div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div className="badge">3</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Construção</div>
              <div className="small" style={{ color: "var(--muted)" }}>Base, estrutura, vidros, grama e iluminação.</div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div className="badge">4</div>
              <div style={{ fontWeight: 800, marginTop: 6 }}>Entrega</div>
              <div className="small" style={{ color: "var(--muted)" }}>Checklist, treinamento e manutenção.</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
