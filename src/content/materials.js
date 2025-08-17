import heroMateriais from "../assets/materiais/hero-materiais.jpg";
import vidro12 from "../assets/materiais/vidro-12mm.jpg";
import grama12 from "../assets/materiais/grama-12mm.jpg";
import ledIp65 from "../assets/materiais/led-ip65.jpg";
import estruturaGalv from "../assets/materiais/estrutura-galvanizada.jpg";
import gradil4x50 from "../assets/materiais/gradil-4mm-50x50.jpg";
import inox304 from "../assets/materiais/fixacoes-inox-304.jpg";
import pinturaEletro from "../assets/materiais/pintura-eletrostatica.jpg";

export const materialsContent = {
  hero: {
    title: "Materiais premium — especificações que fazem diferença",
    subtitle:
      "Selecionamos cada componente para alta durabilidade e performance real em ambiente externo: vidro 12 mm certificado, estrutura galvanizada a quente com dupla pintura eletrostática, gradil 4 mm 50×50, fixações INOX 304, iluminação LED IP65 e gramado 12 mm de alta densidade.",
    bannerImage: heroMateriais,
  },
  sections: [
    { id:"vidro-12", title:"Vidro temperado 12 mm certificado",
      description:"Vidros 12 mm conforme EN 12150-1 com acabamento de borda e furação premium para resistência mecânica e segurança de uso.",
      image:vidro12, specs:[
        { label:"Norma", value:"EN 12150-1" },
        { label:"Espessura", value:"12 mm" },
        { label:"Acabamento", value:"Borda polida, furação usinada" },
        { label:"Fixação", value:"Links/chapas INOX 304" },
        { label:"Transparência", value:"Alta, baixa distorção" },
      ]},
    { id:"grama-12", title:"Grama sintética 12 mm — alta densidade",
      description:"Tapete monofilamento para jogabilidade consistente e ótima tração. Backing reforçado e densidade elevada para maior vida útil.",
      image:grama12, specs:[
        { label:"Altura", value:"12 mm" },
        { label:"Densidade", value:"≈ 58.800 fios/m²" },
        { label:"Dtex", value:"≈ 9.500" },
        { label:"Backing", value:"3 camadas (PP + PP + SBR)" },
        { label:"Proteção UV", value:"Sim" },
      ]},
    { id:"led-ip65", title:"Iluminação LED IP65 — ~300–500 lux",
      description:"Conjunto de luminárias com proteção IP65, distribuição uniforme e baixo ofuscamento.",
      image:ledIp65, specs:[
        { label:"Potência", value:"≈ 8 × 200 W (por quadra)" },
        { label:"Proteção", value:"IP65" },
        { label:"Iluminância", value:"≈ 300–500 lux" },
        { label:"Temperatura de cor", value:"5000–5700 K" },
        { label:"Instalação", value:"Postes integrados" },
      ]},
    { id:"estrutura", title:"Estrutura galvanizada a quente + pintura dupla",
      description:"Perfis robustos galvanizados a quente e duas demãos de pintura eletrostática para resistência real à corrosão.",
      image:estruturaGalv, specs:[
        { label:"Perfis", value:"80×80×3 mm ou 100×100×3 mm" },
        { label:"Tratamento", value:"Galvanização a quente" },
        { label:"Pintura", value:"Dupla eletrostática" },
        { label:"Durabilidade", value:"Alta (inclusive litoral)" },
      ]},
    { id:"gradil", title:"Gradil 4 mm — malha 50×50",
      description:"Tela galvanizada com malha precisa e acabamento posterior de pintura para superfície lisa.",
      image:gradil4x50, specs:[
        { label:"Arame", value:"4 mm" },
        { label:"Malha", value:"50 × 50 mm" },
        { label:"Tratamento", value:"Galvanizado + pintura" },
        { label:"Acabamento", value:"Quinas protegidas" },
      ]},
    { id:"inox-304", title:"Fixações e acessórios — INOX 304",
      description:"Parafusos, porcas, arruelas e links de vidro em inox 304 garantem resistência à corrosão.",
      image:inox304, specs:[
        { label:"Material", value:"Aço inoxidável 304" },
        { label:"Aplicação", value:"Fixações gerais / links de vidro" },
        { label:"Vantagem", value:"Resiste à oxidação e maresia" },
        { label:"Manutenção", value:"Baixa" },
      ]},
    { id:"pintura", title:"Pintura eletrostática — dupla camada",
      description:"Acabamento estável de cor e brilho com excelente adesão.",
      image:pinturaEletro, specs:[
        { label:"Camadas", value:"2 demãos" },
        { label:"Espessura típica", value:"≈ 80–120 μm" },
        { label:"Resistência", value:"Alta abrasão/intempéries" },
        { label:"Personalização", value:"Cores/branding" },
      ]},
  ],
  cta: {
    title: "Pronto para elevar o padrão do seu clube?",
    subtitle: "Projetos executivos, materiais premium e montagem especializada para uma quadra durável e de alto desempenho.",
    buttonText: "Solicitar orçamento",
    buttonHref: "/contato",
    image: null,
  },
};
