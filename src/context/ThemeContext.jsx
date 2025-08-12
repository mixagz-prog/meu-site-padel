// src/context/ThemeContext.jsx
import { createContext, useContext, useEffect } from "react";

const ThemeCtx = createContext({ theme: "dark", setTheme: () => {}, toggle: () => {} });

export function ThemeProvider({ children }) {
  useEffect(() => {
    // força dark e ignora preferências do sistema
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);
  return <ThemeCtx.Provider value={{ theme: "dark", setTheme: () => {}, toggle: () => {} }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}
