import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

const HERO_IMG = "/assets/courts/indoor-outdoor-hero.jpg"; // altere se precisar

const Section = ({ title, children }) => (
  <section style={{ padding: "48px 0", borderTop: "1px solid #232323" }}>
    <div className="container">
      <h2 className="h2" style={{ marginBottom: 14 }}>{title}</h2>
      <div className="prose" style={{ color: "#d1d5db" }}>{children}</div>
    </div>
  </section>
);

export default function Home() {
  return (
    <div style={{ background: "#0a0a0a", color: "#fff" }}>
      <div
        style={{
          position: "relative",
          borderBottom: "1px solid #1f2937",
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        {/* IMAGEM DE FUNDO */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "contrast(1.05) saturate(1.05)",
            opacity: 0.38,
          }}
        />

        {/* GLOW LARANJA + CAMADA DE LEGIBILIDADE */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(900px 500px at 0% 20%, rgba(255,122,0,.36), transparent 55%)",
            pointerEvents: "none",
            mixBlendMode: "screen",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.35) 40%, rgba(0,0,0,.6)), radial-gradient(800px 400px at 50% 0%, rgba(0,0,0,.25), transparent 70%)",
          }}
        />

        {/* CONTEÚDO */}
        <div
          className="container"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            padding: "24px 0",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            style={{ textAlign: "center", maxWidth: 980 }}
          >
            <div
              style={{
                display: "inline-flex",
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.14)",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.03))",
                color: "#ffb06b",
                fontWeight: 800,
                letterSpacing: ".2px",
                marginBottom: 10,
              }}
            >
              Quadras de padel premium · Projeto à execução
            </div>

            {/* TÍTULO EM DUAS LINHAS */}
            <h1
              className="h1"
              style={{ fontSize: "clamp(30px, 5vw, 52px)", marginBottom: 10, lineHeight: 1.08 }}
            >
              <span
                style={{
                  display: "block",
                  fontWeight: 1000,
                  letterSpacing: 0.4,
                  /* >>> AQUI: degradê mais laranja <<< */
                  backgroundImage:
                    "linear-gradient(90deg,#FFC08A 0%,#FFA24A 22%,#FF8A1E 44%,#FF7A00 66%,#F76700 82%,#E85400 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0 2px 8px rgba(255,122,0,.28))",
                }}
              >
                RESERVA PADEL
              </span>
              <span style={{ display: "block", fontWeight: 900 }}>
                Excelência em quadras premium
              </span>
            </h1>

            <p
              className="lead"
              style={{
                maxWidth: 880,
                margin: "0 auto",
                color: "#d1d5db",
                marginBottom: 16,
              }}
            >
              Piso nivelado, estrutura galvanizada com pintura eletrostática{" "}
              <b>dupla</b>, vidro <b>12&nbsp;mm certificado</b> e acessórios{" "}
              <b>inox&nbsp;304</b>. Padrão internacional de segurança,
              durabilidade e jogabilidade para elevar seu clube.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <NavLink to="/contato" className="btn btn-primary">
                Solicitar orçamento
              </NavLink>
              <NavLink to="/materiais" className="btn btn-primary">
                Ver materiais
              </NavLink>
              <NavLink to="/agendamento" className="btn btn-primary">
                Agendar horário
              </NavLink>
            </div>
          </motion.div>
        </div>

        {/* Altura da hero */}
        <div style={{ paddingTop: "36vw" }} />
      </div>

      <Section title="Por que nossas quadras?">
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <b>Estrutura premium:</b> aço galvanizado a quente + pintura
            eletrostática dupla, com reforços laterais.
          </li>
          <li>
            <b>Vidros 12&nbsp;mm certificados:</b> padrão de segurança e
            resposta de jogo.
          </li>
          <li>
            <b>Certificações:</b> fabricação conforme SGC e normas de referência.
          </li>
          <li>
            <b>Acessórios inox 304:</b> durabilidade extra em áreas
            externas/litorâneas.
          </li>
        </ul>
      </Section>

      <Section title="Entrega completa, do projeto à execução">
        <ul style={{ lineHeight: 1.7 }}>
          <li>Projeto estrutural e layout.</li>
          <li>Terraplenagem, base e nivelamento do piso.</li>
          <li>Montagem e pintura da estrutura metálica.</li>
          <li>Instalação dos vidros 12&nbsp;mm e telas galvanizadas.</li>
          <li>Aplicação da grama e marcações.</li>
          <li>Iluminação e acessórios profissionais.</li>
        </ul>
      </Section>
    </div>
  );
}
