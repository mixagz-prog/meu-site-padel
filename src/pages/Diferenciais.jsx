import { motion } from "framer-motion";
import SmartImage from "../components/SmartImage.jsx";
import { diferenciaisContent as content } from "../content/diferenciais.js";

// Ícones do lucide-react
import {
  ShieldCheck,
  GlassWater,
  Ruler,
  Wrench,
  Zap,
  Leaf,
  Layers,
  Cable,
} from "lucide-react";

const iconMap = {
  ShieldCheck,
  GlassWater,
  Ruler,
  Wrench,
  Zap,
  Leaf,
  Layers,
  Cable,
};

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } },
};

export default function Diferenciais() {
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
            >
              {content.hero.title}
            </motion.h1>
            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.05 }}
              className="lead mt-3"
              style={{ maxWidth: 780 }}
            >
              {content.hero.subtitle}
            </motion.p>

            {content.hero.badges?.length > 0 && (
              <div className="badges mt-4">
                {content.hero.badges.map((b) => (
                  <span key={b} className="badge">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {content.hero.bannerImage && (
            <SmartImage
              src={content.hero.bannerImage}
              alt="Diferenciais"
              ratio="16/9"
            />
          )}
        </div>

        {/* GRID DE PILARES */}
        <div className="grid grid-3 mt-8">
          {content.pillars.map((p, idx) => {
            const Icon = iconMap[p.icon] || ShieldCheck;
            return (
              <motion.article
                key={p.id}
                variants={fade}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                className="card"
                aria-labelledby={`pillar-${p.id}`}
              >
                {p.image && (
                  <SmartImage src={p.image} alt={p.title} ratio="16/9" />
                )}

                <header style={{ display: "flex", gap: 12, marginTop: 14 }}>
                  <div className="icon" aria-hidden>
                    <Icon size={22} />
                  </div>
                  <div>
                    <div
                      className="small"
                      style={{
                        color: "var(--muted)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span
                        className="badge"
                        style={{ padding: ".25rem .55rem", fontSize: 12 }}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <h3
                      id={`pillar-${p.id}`}
                      className="mt-2"
                      style={{ fontWeight: 700, fontSize: 20 }}
                    >
                      {p.title}
                    </h3>
                  </div>
                </header>

                <p className="small mt-3" style={{ lineHeight: 1.6 }}>
                  {p.text}
                </p>

                <div
                  className="mt-6"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <a href="#contato" className="btn">
                    Saiba mais
                  </a>
                  <span className="small" style={{ color: "var(--muted)" }}>
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
              </motion.article>
            );
          })}
        </div>

        {/* FAQ */}
        {content.faq?.length > 0 && (
          <section className="mt-8 card">
            <h2 className="h2">Perguntas frequentes</h2>
            <div className="mt-4">
              {content.faq.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 0",
                    borderBottom:
                      i < content.faq.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{f.q}</div>
                  <div className="small mt-2" style={{ lineHeight: 1.6 }}>
                    {f.a}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA FINAL */}
        <section
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
            <div className="small mt-2">{content.cta.subtitle}</div>
          </div>
          <a href={content.cta.buttonHref} className="btn btn-primary">
            {content.cta.buttonText}
          </a>

          {content.cta.image && (
            <div style={{ gridColumn: "1 / -1" }}>
              <SmartImage src={content.cta.image} alt="CTA" ratio="21/9" />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
