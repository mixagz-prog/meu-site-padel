import { useState } from "react";

export default function SmartImage({ src, alt, ratio = "16/9", style }) {
  const [error, setError] = useState(false);
  const padding = `${(1 / (Number(ratio.split("/")[0]) / Number(ratio.split("/")[1]))) * 100}%`;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: "20px",
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "#ffffff10",
        ...style,
      }}
    >
      <div style={{ paddingTop: padding }} />
      {src && !error ? (
        <img
          src={src}
          alt={alt || "Imagem"}
          onError={() => setError(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "var(--muted)",
          }}
        >
          <span className="small">Imagem não disponível</span>
        </div>
      )}
    </div>
  );
}
