// src/pages/Home.jsx
import { motion } from "framer-motion";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/* Util: salvar rota de origem para retorno pós-login */
function saveFrom(location) {
  const from = {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    state: location.state ?? null,
  };
  try { sessionStorage.setItem("auth.from", JSON.stringify(from)); } catch {}
  return from;
}

/* Componente de seção reutilizável */
const Section = ({ title, children }) => (
  <section style={{ padding: "48px 0", borderTop: "1px solid #232323" }}>
    <div className="container">
      <h2 className="h2" style={{ marginBottom: 14 }}>{title}</h2>
      <div className="prose" style={{ color: "#d1d5db" }}>{children}</div>
    </div>
  </section>
);

/* "Produto" unificado para CTA de orçamento */
const UNIFIED_COURT = {
  id: "nossa-quadra-inout",
  name: "Nossa Quadra Indoor/Outdoor",
  subtitle:
    "Estrutura galvanizada a quente com dupla pintura eletrostática, vidro temperado 12 mm certificado e fixações em inox 304.",
  priceStart: "a partir de R$ 159.000",
  leadTime: "Instalação em 30–60 dias",
  hero: "/assets/courts/indoor-outdoor-hero.jpg", // coloque a imagem em public/assets/courts/
  highlights: [
    "Vidro 12 mm (EN 12150-1)",
    "Tratamento anticorrosão total",
    "Estrutura com reforços laterais",
    "LED IP65 anti-ofuscamento",
    "Grama 12 mm alta densidade",
    "Cores e branding personalizados",
  ],
  specs: [
    "Aço galvanizado a quente",
    "Dupla pintura eletrostática",
    "Fixações e acessórios em inox 304",
    "Gradil 4 mm 50×50",
    "Iluminação ~300–500 lux",
  ],
};

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();

  function onRequestQuote(product) {
    if (!user) {
      // guarda de onde veio e já prepara redirecionamento ao contato com assunto
      saveFrom(location);
      toast.info("Entre na sua conta para solicitar um orçamento.");
      nav("/login", {
        state: {
          mode: "signin",
          from: {
            pathname: "/contato",
            state: {
              subject: `Orçamento: ${product?.name || "Quadra"}`,
              productId: product?.id,
            },
          },
        },
      });
      return;
    }
    nav("/contato", {
      state: {
        subject: `Orçamento: ${product?.name || "Quadra"}`,
        productId: product?.id,
      },
    });
  }

  return (
    <div style={{ background: "#0a0a0a", color: "#fff" }}>
      {/* ===================== HERO UNIFICADO (Home + Quadras) ===================== */}
      <motion.article
        initial={{ opacity: 0, y: 14, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="card"
        style={{
          marginTop: 0,
          borderRadius: 16,
          overflow: "hidden",
          padding: 0,
          border: "1px solid var(--border)",
          boxShadow: "0 12px 28px rgba(0,0,0,0.45)",
          isolation: "isolate",
        }}
      >
        <div style={{ position: "relative" }}>
          {/* Imagem de fundo */}
          <img
            src={UNIFIED_COURT.hero}
            alt={UNIFIED_COURT.name}
            style={{
              width: "100%",
              height: 460,
              objectFit: "cover",
              display: "block",
              filter: "saturate(1.05) contrast(1.02)",
            }}
          />

          {/* Overlays: vinheta + leve gradiente para contraste do texto */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.35) 45%, rgba(11,18,32,.82) 100%)",
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(900px 500px at 8% 18%, rgba(255,122,0,.22), transparent 55%)",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />

          {/* Conteúdo centralizado (banner) */}
          <div
            className="container"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              textAlign: "center",
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: 0.05 }}
              style={{ maxWidth: 980 }}
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

              <h1 className="h1" style={{ fontSize: "clamp(30px, 5vw, 48px)", marginBottom: 10 }}>
                Reserva Padel — excelência em quadras premium
              </h1>

              <p
                className="lead"
                style={{
                  maxWidth: 900,
                  margin: "0 auto",
                  color: "#d1d5db",
                }}
              >
                {UNIFIED_COURT.subtitle}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Corpo do hero: badges, highlights, specs e CTAs finais */}
        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          {/* Badges de preço/prazo */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            <span className="badge" style={{ fontWeight: 800 }}>{UNIFIED_COURT.priceStart}</span>
            <span className="badge">{UNIFIED_COURT.leadTime}</span>
            <span className="badge">Projeto executivo e montagem inclusos</span>
          </div>

          {/* Highlights em 3 colunas */}
          <div className="grid grid-3 mt-1">
            {UNIFIED_COURT.highlights.map((h, i) => (
              <div key={`h-${i}`} className="glass" style={{ padding: 14 }}>
                <div style={{ fontWeight: 800 }}>{h}</div>
                <div className="small" style={{ color: "var(--muted)" }}>
                  {h.includes("Vidro 12") && " Temperado 12 mm conforme EN 12150-1, segurança e estabilidade."}
                  {h.includes("anticorrosão") && " Galvanização + pintura dupla protegem em regiões litorâneas."}
                  {h.includes("LED") && " Iluminação uniforme com mínimo ofuscamento para jogos noturnos."}
                  {h.includes("reforços") && " Conjunto rígido para menos vibração e maior conforto."}
                  {h.includes("Grama") && " Tapete de alto desempenho com ótimo quique e tração."}
                  {h.includes("branding") && " Paleta e identidade do seu clube aplicadas na estrutura."}
                </div>
              </div>
            ))}
          </div>

          {/* Specs essenciais */}
          <div className="glass" style={{ padding: 14 }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Especificações essenciais</div>
            <div className="small" style={{ color: "var(--muted)" }}>
              {UNIFIED_COURT.specs.join(" • ")}
            </div>
          </div>

          {/* CTAs finais — somente 2 como você pediu */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => onRequestQuote(UNIFIED_COURT)}>
              Solicitar orçamento
            </button>
            <NavLink to="/materiais" className="btn">
              Ver materiais
            </NavLink>
          </div>
        </div>
      </motion.article>

      {/* ===================== Seções adicionais (conteúdo institucional) ===================== */}
      <Section title="Por que nossas quadras?">
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            <b>Estrutura premium:</b> aço galvanizado a quente + pintura eletrostática dupla, com reforços laterais para máxima rigidez.
          </li>
          <li>
            <b>Vidros 12&nbsp;mm certificados:</b> padrão de segurança, resistência e melhor resposta de jogo.
          </li>
          <li>
            <b>Certificações internacionais:</b> fabricação conforme SGC e normas de referência.
          </li>
          <li>
            <b>Acessórios inox 304:</b> parafusos e ferragens em inox garantem mais durabilidade nas áreas externas.
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
