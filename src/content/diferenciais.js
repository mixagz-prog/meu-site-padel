export const diferenciaisContent = {
  hero: {
    title: "Diferenciais que você sente em quadra",
    subtitle:
      "Do aço galvanizado aos detalhes de fixação, cada escolha foi feita para entregar performance, durabilidade e baixa manutenção.",
    bannerImage: "/images/diferenciais/hero.jpg", // opcional
    badges: ["Durabilidade", "Desempenho", "Pós-venda"],
  },

  pillars: [
    {
      id: "vidro",
      title: "Vidros temperados 12 mm",
      text:
        "Transparência e segurança com cantos lapidados e fixação antivibração, reduzindo ruído e vibração.",
      badge: "Estrutural",
      image: "/images/diferenciais/vidros.jpg", // opcional
      icon: "GlassWater", // ícone (ver legenda abaixo)
    },
    {
      id: "estrutura",
      title: "Estrutura galvanizada a fogo",
      text:
        "Proteção anticorrosiva total (dentro e fora), ideal para ambientes externos e maresia.",
      badge: "Durabilidade",
      image: "/images/diferenciais/estrutura.jpg",
      icon: "ShieldCheck",
    },
    {
      id: "pintura",
      title: "Pintura eletrostática (powder coating)",
      text:
        "Acabamento premium com alta aderência e resistência a riscos e intemperismo.",
      badge: "Acabamento",
      image: "/images/diferenciais/pintura.jpg",
      icon: "Layers",
    },
    {
      id: "grama",
      title: "Grama 12–15 mm + sílica",
      text:
        "Velocidade controlada, drenagem eficiente e menor abrasão, com conforto articular.",
      badge: "Desempenho",
      image: "/images/diferenciais/grama.jpg",
      icon: "Leaf",
    },
    {
      id: "iluminacao",
      title: "Iluminação LED profissional",
      text:
        "Uniformidade 200–300 lx, ofuscamento reduzido e alta eficiência energética.",
      badge: "LED",
      image: "/images/diferenciais/led.jpg",
      icon: "Zap",
    },
    {
      id: "fixacoes",
      title: "Parafusos e ferragens inox",
      text:
        "Conexões anticorrosivas com manutenção simplificada e menor oxidação.",
      badge: "Detalhes",
      image: "/images/diferenciais/fixacoes.jpg",
      icon: "Cable",
    },
    {
      id: "nivelamento",
      title: "Base, nivelamento e drenagem",
      text:
        "Contra-flecha e escoamento corretos para quadra seca e quique previsível.",
      badge: "Obra",
      image: "/images/diferenciais/base.jpg",
      icon: "Ruler",
    },
    {
      id: "pos",
      title: "Garantia e pós-venda",
      text:
        "Check-ups programados, estoque de reposição e SLA claro para manter a quadra sempre jogável.",
      badge: "Suporte",
      image: "/images/diferenciais/pos.jpg",
      icon: "Wrench",
    },
  ],

  faq: [
    {
      q: "Por que vidro 12 mm?",
      a: "Combina transparência e segurança; reduz vibração e ruído, melhorando a experiência de jogo e do público.",
    },
    {
      q: "Qual grama escolher?",
      a: "Para uso polivalente, a fibrilada 12–15 mm com sílica controla velocidade e reduz abrasão. Para alta performance, avalie fibras texturizadas.",
    },
    {
      q: "LED vale a pena?",
      a: "Sim. Traz economia, melhor uniformidade e pode ser dimerizado. Um bom projeto evita ofuscamento nas paredes de vidro.",
    },
  ],

  cta: {
    title: "Quer ver uma especificação completa?",
    subtitle: "Enviamos um memorial descritivo com materiais, prazos e garantias.",
    buttonText: "Solicitar agora",
    buttonHref: "/contato",
    image: "/images/diferenciais/cta.jpg", // opcional
  },

  /**
   * Legenda de ícones (lucide-react):
   * GlassWater, ShieldCheck, Layers, Leaf, Zap, Cable, Ruler, Wrench
   */
};
