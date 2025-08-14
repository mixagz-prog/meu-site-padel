// src/pages/Materiais.jsx
import { motion } from "framer-motion";
import SmartImage from "../components/SmartImage.jsx";
import { materialsContent as content } from "../content/materials.js";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

export default function Materiais() {
  return (
    <div className="section">
      <div className="container">

        {/* HERO */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr .9fr",
            gap: 24,
            alignItems: "center",
          }}
        >
          <div>
            <motion.h1
              variants={fade}
              initial="hidden"
              animate="show"
              className="h1"
              id="materiais-hero-title"
            >
              {content.hero.title}
            </motion.h1>

            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.05 }}
              className="lead mt-3"
              style={{ maxWidth: 780, color: "var(--muted)" }}
              aria-describedby="materiais-hero-title"
            >
              {content.hero.subtitle}
            </motion.p>

            <div className="badges mt-4" aria-label="Destaques dos materiais">
              <span className="badge">Especificações auditáveis</span>
              <span className="badge">Durabilidade</span>
              <span className="badge">Pós-venda</span>
            </div>
          </div>

          {content.hero.bannerImage && (
            <SmartImage
              src={content.hero.bannerImage}
              alt="Materiais premium do sistema de quadras"
              ratio="16/9"
            />
          )}
        </div>

        {/* SEÇÕES */}
        <div className="grid grid-2 mt-8">
          {content.sections.map((s, index) => (
            <motion.section
              key={s.id}
              variants={fade}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              className="card"
              aria-labelledby={`section-${s.id}-title`}
            >
              {s.image && (
                <SmartImage
                  src={s.image}
                  alt={s.title}
                  ratio="16/9"
                />
              )}

              <header className="mt-4">
                <h2 className="h2" id={`section-${s.id}-title`}>
                  {s.title}
                </h2>
                <p className="small mt-2" style={{ lineHeight: 1.6, color: "var(--muted)" }}>
                  {s.description}
                </p>
              </header>

              <hr className="hr mt-4" />

              {/* Tabela de especificações acessível */}
              <div
                className="mt-4"
                role="table"
                aria-label={`Especificações de ${s.title}`}
              >
                {s.specs.map((row, idx) => (
                  <div
                    key={idx}
                    role="row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "180px 1fr",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div role="cell" className="small" style={{ color: "var(--muted)" }}>
                      {row.label}
                    </div>
                    <div role="cell">{row.value}</div>
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>

        {/* CTA final */}
        <div
          className="glass mt-8"
          style={{
            padding: 24,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
          }}
        >
          <div>
            <div className="h2">{content.cta.title}</div>
            <div className="small mt-2" style={{ color: "var(--muted)" }}>
              {content.cta.subtitle}
            </div>
          </div>

          <a href={content.cta.buttonHref} className="btn btn-primary">
            {content.cta.buttonText}
          </a>

          {content.cta.image && (
            <div style={{ gridColumn: "1 / -1" }}>
              <SmartImage src={content.cta.image} alt="Chamada para orçamento" ratio="21/9" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
