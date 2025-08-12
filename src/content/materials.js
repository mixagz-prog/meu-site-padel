export const materialsContent = {
  hero: {
    title: "Materiais Premium",
    subtitle:
      "Especificações selecionadas para alta durabilidade, desempenho e manutenção simples. Atualize estes textos livremente.",
    bannerImage: "/images/hero-materiais.jpg", // coloque a imagem em public/images/
  },
  sections: [
    {
      id: "vidros",
      title: "Vidros temperados 12 mm",
      description:
        "Alta transparência e segurança. Bordas lapidadas e fixação antivibração para reduzir ruído e vibração.",
      image: "/images/materiais/vidros.jpg",
      specs: [
        { label: "Espessura", value: "12 mm" },
        { label: "Tratamento", value: "Têmpera (NBR 14698)" },
        { label: "Acabamento", value: "Bordas lapidadas, cantos arredondados" },
        { label: "Fixação", value: "Chapas/aranhas com bucha antivibração" },
        { label: "Manutenção", value: "Limpeza neutra; inspeção semestral" },
      ],
    },
    {
      id: "estrutura",
      title: "Estrutura galvanizada a fogo",
      description:
        "Proteção anticorrosiva total — dentro e fora dos perfis — ideal para ambientes externos e maresia.",
      image: "/images/materiais/estrutura.jpg",
      specs: [
        { label: "Processo", value: "Galvanização a quente (NBR 6323)" },
        { label: "Camada de zinco", value: ">= 70 μm (média)" },
        { label: "Perfis", value: "Tubulares/laminados conforme projeto" },
        { label: "Solda", value: "Profissionais qualificados; inspeção VT" },
        { label: "Pintura opcional", value: "Powder coating sobre galvanização" },
      ],
    },
    {
      id: "pintura",
      title: "Pintura eletrostática (powder coating)",
      description:
        "Acabamento premium com alta aderência e resistência a intemperismo. Paleta sob demanda.",
      image: "/images/materiais/pintura.jpg",
      specs: [
        { label: "Sistema", value: "Poliéster TGIC-free" },
        { label: "Cura", value: "180–200 °C / 10–20 min" },
        { label: "Aderência", value: ">= 4B (ASTM D3359)" },
        { label: "Espessura", value: "70–100 μm" },
        { label: "Manutenção", value: "Lavar com pH neutro; evitar abrasivos" },
      ],
    },
    {
      id: "grama",
      title: "Grama sintética 12–15 mm + sílica",
      description:
        "Velocidade de bola controlada, drenagem eficiente e menor abrasão. Conforto articular e quique previsível.",
      image: "/images/materiais/grama.jpg",
      specs: [
        { label: "Tipo de fibra", value: "Fibrilada (PP/PE)" },
        { label: "Altura de fio", value: "12–15 mm" },
        { label: "Base", value: "Latex/PU com perfurações" },
        { label: "Infill", value: "Areia sílica lavada e seca" },
        { label: "Certificação", value: "ITF/FIP quando aplicável" },
      ],
    },
    {
      id: "led",
      title: "Iluminação LED profissional",
      description:
        "Uniformidade e conforto visual. Projeto para 200–300 lx com ofuscamento reduzido.",
      image: "/images/materiais/led.jpg",
      specs: [
        { label: "Fluxo luminoso", value: "Conforme projeto (lúmens)" },
        { label: "Temperatura de cor", value: "4000–5000 K" },
        { label: "IRC (CRI)", value: ">= 80" },
        { label: "UGR", value: "Baixo ofuscamento (projeto)" },
        { label: "Dimerização", value: "Opcional (1–10V ou DALI)" },
      ],
    },
  ],
  cta: {
    title: "Receba o memorial descritivo completo",
    subtitle: "Enviamos PDF com todas as especificações e opções de upgrade.",
    buttonText: "Solicitar agora",
    buttonHref: "/contato",
    image: "/images/materiais/cta.jpg",
  },
};
