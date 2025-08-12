import React from "react";
import PageHeader from "../components/ui/PageHeader";

export default function Quadra(){
  return (
    <>
      <PageHeader
        title="Projeto de Quadras Premium"
        subtitle="Venda de quadras completas com engenharia, montagem e assistência — padrão internacional."
      />

      <section className="grid grid-2">
        <div className="card pad-lg">
          <h3 style={{marginTop:0}}>Estrutura Profissional</h3>
          <p className="ph-sub">
            Módulos em aço galvanizado com pintura eletrostática, para alta durabilidade e alinhamento perfeito das telas.
          </p>
          <p className="ph-sub">
            Painéis de vidro temperado 10/12&nbsp;mm com lapidação e fixação anti-vibração para visibilidade e segurança.
          </p>
        </div>
        <div className="card pad-lg">
          <h3 style={{marginTop:0}}>Iluminação & Conforto</h3>
          <p className="ph-sub">
            Projeto luminotécnico em LED (alto CRI) com uniformidade, evitando ofuscamento e sombras duras.
          </p>
          <p className="ph-sub">
            Grama sintética homologada com preenchimento calibrado para quique consistente e menor fadiga.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="card pad-lg">
          <h3 style={{marginTop:0}}>Entrega Chave-na-Mão</h3>
          <p className="ph-sub">
            Acompanhamos fundação, drenagem, elétrica e montagem. Fornecemos ART, manuais e plano de manutenção.
          </p>
        </div>
      </section>
    </>
  );
}
