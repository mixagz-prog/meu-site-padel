import { motion } from "framer-motion";
import SmartImage from "../components/SmartImage.jsx";
import { diferenciaisContent as content } from "../content/diferenciais.js";
import { CheckCircle, XCircle } from "lucide-react";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

/* ======= Células com texto + (opcional) mini-imagem ======= */
function SideCell({ type, text, img }) {
  const Icon = type === "reserva" ? CheckCircle : XCircle;
  const accent =
    type === "reserva"
      ? { borderColor: "rgba(255,122,0,.45)", boxShadow: "0 0 0 0 rgba(0,0,0,0)" }
      : {};

  return (
    <div className="glass" style={{ padding: 12, display: "grid", gap: 8, ...accent }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={18} color={type === "reserva" ? "#ffb06b" : undefined} />
        <div className="small" style={{ lineHeight: 1.55 }}>{text}</div>
      </div>

      {/* espaço para imagem (se vier no conteúdo) */}
      {img ? (
        <SmartImage src={img} alt="" ratio="16/9" />
      ) : (
        <div
          aria-hidden
          className="glass"
          style={{
            height: 110,
            borderStyle: "dashed",
            display: "grid",
            placeItems: "center",
            color: "var(--muted)",
            background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
          }}
        >
          <span className="small">Imagem opcional</span>
        </div>
      )}
    </div>
  );
}

/* ======= Tabela de comparativo ======= */
function CompareTable({ rows }) {
  return (
    <section className="card mt-8" aria-labelledby="compare-title">
      <header style={{ display: "grid", gap: 8 }}>
        <h2 id="compare-title" className="h2">Reserva Padel × Quadra padrão</h2>
        <p className="small" style={{ color: "var(--muted)", maxWidth: 880 }}>
          Menos manutenção, mais segurança e jogabilidade constante — o padrão técnico impacta o
          <b> custo total de propriedade (TCO)</b> nos próximos anos.
        </p>
      </header>

      <div
        className="mt-4"
        role="table"
        aria-label="Comparativo técnico"
        style={{
          display: "grid",
          gridTemplateColumns: "1.05fr .95fr .95fr",
          gap: 12,
        }}
      >
        <div className="small" style={{ fontWeight: 800, color: "var(--muted)" }}>Critério</div>
        <div className="small" style={{ fontWeight: 800 }}>Quadra padrão</div>
        <div className="small" style={{ fontWeight: 800, color: "var(--brand-300)" }}>Reserva Padel</div>

        {rows.map((r, i) => (
          <motion.div
            key={i}
            variants={fade}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            style={{ display: "contents" }}
          >
            <div className="small" style={{ color: "var(--muted)", paddingTop: 6 }}>{r.label}</div>
            <SideCell type="padrao" text={r.padrao} img={r.padraoImg} />
            <SideCell type="reserva" text={r.reserva} img={r.reservaImg} />
          </motion.div>
        ))}
      </div>

      <div className="mt-6" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span className="badge">Vidro 12 mm (EN 12150-1)</span>
        <span className="badge">Galvanização a quente + dupla pintura</span>
        <span className="badge">Fixações INOX 304</span>
        <span className="badge">≈300 Lux LED IP65</span>
        <span className="badge">Grama 12 mm · 9500 Dtex</span>
        <span className="badge">Peças CNC</span>
      </div>
    </section>
  );
}

export default function Diferenciais() {
  return (
    <div className="section">
      <div className="container">
        {/* HERO (mantido) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr .9fr", gap: 24, alignItems: "center" }}>
          <div>
            <motion.h1 variants={fade} initial="hidden" animate="show" className="h1">
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
                  <span key={b} className="badge">{b}</span>
                ))}
              </div>
            )}
          </div>
          {content.hero.bannerImage && (
            <SmartImage src={content.hero.bannerImage} alt="Diferenciais" ratio="16/9" />
          )}
        </div>

        {/* COMPARATIVO (novo foco da página) */}
        <CompareTable rows={content.compare} />

        {/* FAQ (atualizada) */}
        {content.faq?.length > 0 && (
          <section className="mt-8 card">
            <h2 className="h2">Perguntas frequentes</h2>
            <div className="mt-4">
              {content.faq.map((f, i) => (
                <div
                  key={i}
                  style={{ padding: "14px 0", borderBottom: i < content.faq.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div style={{ fontWeight: 700 }}>{f.q}</div>
                  <div className="small mt-2" style={{ lineHeight: 1.6 }}>{f.a}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA final (mantido) */}
        <section
          className="glass mt-8"
          style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}
        >
          <div>
            <div className="h2">{content.cta.title}</div>
            <div className="small mt-2">{content.cta.subtitle}</div>
          </div>
          <a href={content.cta.buttonHref} className="btn btn-primary">{content.cta.buttonText}</a>
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
