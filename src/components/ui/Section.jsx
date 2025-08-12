export default function Section({ title, subtitle, children }) {
  return (
    <section style={{ padding: "24px 0" }}>
      {title && <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>{title}</h2>}
      {subtitle && <p style={{ color: "var(--color-muted)", marginTop: 0 }}>{subtitle}</p>}
      {children}
    </section>
  );
}