import React from "react";

export default function PageHeader({ title, subtitle }){
  return (
    <div className="ph">
      <h1 className="ph-title">{title}</h1>
      {subtitle && <p className="ph-sub">{subtitle}</p>}
    </div>
  );
}
