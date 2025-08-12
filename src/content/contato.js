export const contatoContent = {
  hero: {
    title: "Fale com nossa equipe",
    subtitle:
      "Orçamentos, prazos, memorial descritivo e dúvidas técnicas. Respondemos rápido e com transparência.",
    bannerImage: "/images/contato/hero.jpg", // opcional
  },
  form: {
    title: "Solicitar orçamento",
    subtitle:
      "Preencha os dados e retornaremos com um estudo de viabilidade completo.",
    fields: {
      nome: { label: "Nome completo", placeholder: "Seu nome" },
      email: { label: "E-mail", placeholder: "voce@exemplo.com" },
      telefone: { label: "Telefone/WhatsApp", placeholder: "(xx) xxxxx-xxxx" },
      cidade: { label: "Cidade / Estado", placeholder: "Cidade - UF" },
      tipoProjeto: {
        label: "Tipo de projeto",
        placeholder: "Ex.: Quadra única, complexo esportivo...",
      },
      mensagem: {
        label: "Mensagem",
        placeholder:
          "Conte um pouco do projeto (prazos, local, nº de quadras, coberturas...)",
      },
    },
    buttonText: "Enviar",
    privacyNote:
      "Usamos seus dados apenas para contato comercial. Nada de spam.",
  },
  sidebar: {
    title: "Canais diretos",
    items: [
      { label: "WhatsApp", href: "https://wa.me/5599999999999" },
      { label: "E-mail", href: "mailto:comercial@seudominio.com.br" },
      { label: "Instagram", href: "https://instagram.com/seuperfil" },
    ],
    image: "/images/contato/sidebar.jpg", // opcional
  },
};
