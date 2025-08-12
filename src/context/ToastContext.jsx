// src/context/ToastContext.jsx
import { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]); // {id,type,title?,message,ttl}
  const idRef = useRef(0);

  const api = useMemo(() => {
    const push = (payload) => {
      const id = ++idRef.current;
      const t = { id, ttl: payload.ttl ?? 3500, ...payload };
      setToasts((arr) => [...arr, t]);
      return id;
    };
    const close = (id) => setToasts((arr) => arr.filter((t) => t.id !== id));

    return {
      show: (message, type = "info") => push({ message, type }),
      success: (m) => push({ message: m, type: "success" }),
      error: (m) => push({ message: m, type: "error", ttl: 4500 }),
      warning: (m) => push({ message: m, type: "warning" }),
      info: (m) => push({ message: m, type: "info" }),
      close,
    };
  }, []);

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== t.id)), t.ttl)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  return (
    <ToastCtx.Provider value={api}>
      {children}
      {createPortal(
        <div className="toaster">
          {toasts.map((t) => (
            <div key={t.id} className={`toast toast-${t.type}`} onClick={() => api.close(t.id)}>
              {t.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}
