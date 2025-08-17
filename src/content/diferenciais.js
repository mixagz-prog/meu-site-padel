// src/content/diferenciais.js
export const diferenciaisContent = {
  hero: {
    title: "Diferenciais que viram retorno",
    subtitle:
      "Cada peça foi especificada para durabilidade, segurança e jogabilidade no padrão internacional — e para reduzir custo oculto de manutenção e retrabalho. Resultado? Quadra premium hoje, e quadra premium daqui a anos.",
    bannerImage: "/assets/diferenciais/hero-banner.jpg",
    badges: ["Garantia de durabilidade", "Instalação otimizada", "Segurança certificada"],
  },

  // COMPARATIVO — Reserva Padel × Quadra Padrão
  compare: [
    {
      label: "Vidros",
      padrao:
        "Vidro 10 mm sem certificação consistente; maior risco de quebra/autoestouro e bordas/furações com acabamento irregular.",
      reserva:
        "Vidro temperado 12 mm certificado (EN 12150-1), menor taxa de autoestouro, borda/furação premium — mais segurança e vida útil.",
      padraoImg: "/assets/diferenciais/compare/vidro-10mm.jpg",
      reservaImg: "/assets/diferenciais/compare/vidro-12mm.jpg",
    },
    {
      label: "Fixação do vidro",
      padrao:
        "Tiras/chapas de ferro pintado: oxidam, marcam o vidro e podem afrouxar com o tempo.",
      reserva:
        "Presilhas e parafusos em INOX 304: não oxidam, mantêm torque e acabamento limpo junto ao vidro.",
      padraoImg: "/assets/diferenciais/compare/fixacao-ferro.jpg",
      reservaImg: "/assets/diferenciais/compare/inox-presilhas.jpg",
    },
    {
      label: "Estrutura metálica",
      padrao:
        "Aço apenas pintado. Em poucos ciclos de chuva/sol, nasce corrosão e a pintura descasca.",
      reserva:
        "Galvanização a quente + dupla pintura eletrostática (primer de zinco + acabamento): proteção real contra corrosão e UV.",
      padraoImg: "/assets/diferenciais/compare/estrutura-somente-pintura.jpg",
      reservaImg: "/assets/diferenciais/compare/estrutura-galvanizada.jpg",
    },
    {
      label: "Cercamento / Tela",
      padrao:
        "Malha ~3 mm, zincagem superficial e bordas sem tratamento — deforma e oxida mais rápido.",
      reserva:
        "Tela galvanizada 4 mm malha 50×50, pintura posterior e pontas tratadas — mais rígida, lisa e durável.",
      padraoImg: "/assets/diferenciais/compare/tela-3mm.jpg",
      reservaImg: "/assets/diferenciais/compare/tela-4mm-50x50.jpg",
    },
    {
      label: "Parafusos e ferragens",
      padrao:
        "Parafusos zincados comuns: perdem acabamento e agarram com a oxidação.",
      reserva:
        "Conjunto em INOX 304 — resistência à maresia/umidade e manutenção baixíssima.",
      padraoImg: "/assets/diferenciais/compare/parafusos-zincados.jpg",
      reservaImg: "/assets/diferenciais/compare/inox-304.jpg",
    },
    {
      label: "Iluminação",
      padrao:
        "Luminárias sem vedação robusta (IP baixo) e iluminância insuficiente (<200 lux).",
      reserva:
        "LED IP65, ~300–500 lux uniformes, facho otimizado e postes integrados: jogo noturno impecável.",
      padraoImg: "/assets/diferenciais/compare/iluminacao-ip54-150lux.jpg",
      reservaImg: "/assets/diferenciais/compare/led-ip65-300lux.jpg",
    },
    {
      label: "Piso / Grama",
      padrao:
        "Fibrilada ~10 mm, densidade baixa: enruga mais cedo e perde jogabilidade.",
      reserva:
        "Monofilamento 12 mm, ≈9.500 Dtex e densidade ≈58.800/m² — tração consistente e maior vida útil.",
      padraoImg: "/assets/diferenciais/compare/grama-10mm-fibrilada.jpg",
      reservaImg: "/assets/diferenciais/compare/grama-12mm-monofilamento.jpg",
    },
    
  ],

  // FAQ (ajustada p/ clima/umidade do Brasil)
  faq: [
    {
      q: "Por que 12 mm de vidro?",
      a: "Maior resistência a impacto e atendimento às normas (EN 12150-1). Em partidas intensas, isso significa segurança real e menor risco de quebra/autoestouro.",
    },
    {
      q: "Vale a pena investir em estrutura galvanizada e peças INOX no Brasil?",
      a: "Sim — e muito. O clima brasileiro é majoritariamente úmido, com variações de temperatura e alta umidade relativa do ar. Mesmo em áreas cobertas ou sem ‘contato direto’ com água, a condensação e névoa salina (em regiões litorâneas) aceleram a oxidação de aços apenas pintados e ferragens comuns. A galvanização a quente cria uma barreira metálica contra corrosão, e o INOX 304 não oxida como o aço carbono: o resultado é aparência preservada, parafusos que não ‘gripam’, menos manutenção, menos retrabalho e uma quadra que segue premium por anos.",
    },
    {
      q: "E a manutenção ao longo do tempo?",
      a: "Com galvanização + pintura eletrostática e ferragens em INOX 304, a rotina se resume a inspeções periódicas e limpezas simples — sem repinturas frequentes ou trocas sucessivas de parafusos.",
    },
  ],

  // CTA final
  cta: {
    title: "Quer uma quadra que segue premium daqui a 5+ anos?",
    subtitle:
      "Envie o local e o prazo desejado: retornamos com um escopo otimizado para sua realidade, do projeto à execução.",
    buttonText: "Solicitar proposta",
    buttonHref: "/contato",
    image: "/assets/diferenciais/cta-wide.jpg",
  },
};
