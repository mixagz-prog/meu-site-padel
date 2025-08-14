// src/pages/Quadras.jsx
import { motion } from "framer-motion";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

/* Guardar origem para retorno pós-login */
function saveFrom(location){
  const from = { pathname: location.pathname, search: location.search, hash: location.hash, state: location.state ?? null };
  try { sessionStorage.setItem("auth.from", JSON.stringify(from)); } catch {}
  return from;
}

/** ====== CARD ÚNICO ====== */
const UNIFIED_COURT = {
  id: "nossa-quadra-inout",
  name: "Nossa Quadra Indoor/Outdoor",
  subtitle:
    "Estrutura galvanizada a quente com dupla pintura eletrostática, vidro temperado 12 mm certificado e fixações em inox 304.",
  priceStart: "a partir de R$ 159.000",
  leadTime: "Instalação em 30–60 dias",
  hero: "/assets/courts/indoor-outdoor-hero.jpg",
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

export default function Quadras() {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();

  function onRequestQuote(product) {
    if (!user) {
      saveFrom(location);
      toast.info("Entre na sua conta para solicitar um orçamento.");
      nav("/login", {
        state: {
          mode: "signin",
          from: {
            pathname: "/contato",
            state: { subject: `Orçamento: ${product?.name || "Quadra"}`, productId: product?.id },
          },
        },
      });
      return;
    }
    nav("/contato", { state: { subject: `Orçamento: ${product?.name || "Quadra"}`, productId: product?.id } });
  }

  return (
    <div className="section">
      <div className="container">

        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="card"
          style={{ padding: 24, display: "grid", gap: 10 }}
        >
          <div className="h1">Quadras de Padel</div>
          <div className="small" style={{ color: "var(--muted)" }}>
            Construção premium para alta performance e durabilidade. Personalize cores, sinalização e iluminação.
          </div>
        </motion.div>

        {/* ===== HERO ÚNICO — título centralizado e borda igual aos outros ===== */}
        <motion.article
          initial={{ opacity: 0, y: 14, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.05 }}
          className="card mt-3"
          style={{
            overflow: "hidden",
            padding: 0,
            borderRadius: 16,
            /* borda “branca” igual aos outros cards */
            border: "1px solid var(--border)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.45)", // sem glow laranja
          }}
        >
          <div style={{ position: "relative" }}>
            <img
              src={UNIFIED_COURT.hero}
              alt={UNIFIED_COURT.name}
              style={{
                width: "100%",
                height: 380,
                objectFit: "cover",
                display: "block",
                filter: "saturate(1.05) contrast(1.02)",
              }}
            />
            {/* overlay escuro */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,.08) 0%, rgba(0,0,0,.35) 40%, rgba(11,18,32,.82) 100%)",
              }}
            />

            {/* Título centralizado verticalmente (banner) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                padding: 16,
              }}
            >
              <div>
                <div
                  className="h2"
                  style={{
                    textShadow:
                      "0 10px 28px rgba(0,0,0,.65), 0 2px 6px rgba(0,0,0,.45)",
                  }}
                >
                  {UNIFIED_COURT.name}
                </div>
                <div className="small" style={{ color: "var(--muted)", maxWidth: 920 }}>
                  {UNIFIED_COURT.subtitle}
                </div>
              </div>
            </div>
          </div>

          {/* corpo */}
          <div style={{ padding: 16, display: "grid", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span className="badge" style={{ fontWeight: 800 }}>{UNIFIED_COURT.priceStart}</span>
              <span className="badge">{UNIFIED_COURT.leadTime}</span>
              <span className="badge">Projeto executivo e montagem inclusos</span>
            </div>

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

            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Especificações essenciais</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                {UNIFIED_COURT.specs.join(" • ")}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
              <div className="small" style={{ color: "var(--muted)" }}>
                Precisa de múltiplas quadras ou cobertura? Personalizamos para clubes e condomínios.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => onRequestQuote(UNIFIED_COURT)}>
                  Quero um orçamento
                </button>
                <NavLink to="/materiais" className="btn">
                  Ver materiais
                </NavLink>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Diferenciais técnicos */}
        <div className="card mt-3">
          <div className="h2">Diferenciais técnicos</div>
          <div className="grid grid-3 mt-2">
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Vidro 12 mm certificado</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Temperado 12 mm (EN 12150-1). Segurança, baixa taxa de autoquebra e transparência superior.
              </div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Galvanização + dupla pintura</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Anti-corrosão real + acabamento premium. Cores personalizadas e brilho estável ao longo dos anos.
              </div>
            </div>
            <div className="glass" style={{ padding: 14 }}>
              <div style={{ fontWeight: 800 }}>Fixações em inox 304</div>
              <div className="small" style={{ color: "var(--muted)" }}>
                Parafusos e acessórios inox resistem à oxidação e mantêm a rigidez do conjunto.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
