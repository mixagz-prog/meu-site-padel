// src/components/ThemeToggle.jsx
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      className={`btn ${className || ""}`}
      title={theme === "dark" ? "Mudar para claro" : "Mudar para escuro"}
      onClick={toggle}
      aria-label="Alternar tema"
    >
      {theme === "dark" ? "🌙 Escuro" : "☀️ Claro"}
    </button>
  );
}
