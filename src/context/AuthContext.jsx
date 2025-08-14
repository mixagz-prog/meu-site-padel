// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, upsertUserProfile, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";

/** Helpers de retorno pós-login */
function getFromRoute(location) {
  const viaState = location?.state?.from;
  if (viaState) return viaState;
  try {
    const raw = sessionStorage.getItem("auth.from");
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}
function redirectBack(navigate, location, fallback = "/") {
  const from = getFromRoute(location);
  try { sessionStorage.removeItem("auth.from"); } catch {}
  if (!from) { navigate(fallback, { replace: true }); return; }
  const path = `${from.pathname || "/"}${from.search || ""}${from.hash || ""}`;
  navigate(path, { replace: true, state: from.state ?? null });
}

const AuthContext = createContext({
  user: null,
  loading: true,
  isAdmin: false,
  showLoginSuccess: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);

  const nav = useNavigate();
  const location = useLocation();

  // Evita redirect duplo e detecta transição real de login
  const redirectedRef = useRef(false);
  const prevUserRef = useRef(null);
  const bootRef = useRef(true); // true somente na 1ª notificação do Firebase

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      const prev = prevUserRef.current;

      setUser(u);
      setLoading(false);

      if (u) {
        try { await upsertUserProfile(u); } catch (e) { console.warn("upsertUserProfile:", e); }
        try {
          const adminSnap = await getDoc(doc(db, "admins", u.uid));
          setIsAdmin(adminSnap.exists());
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }

      // Mostra modal de sucesso APENAS em transição real (após bootstrap)
      if (!bootRef.current && !prev && u) {
        setShowLoginSuccess(true);
        setTimeout(() => setShowLoginSuccess(false), 1200);
      }

      // Se estamos em /login e acabou de logar, retornar uma única vez
      if (u && location.pathname === "/login" && !redirectedRef.current) {
        redirectedRef.current = true;
        redirectBack(nav, location, "/");
        setTimeout(() => { redirectedRef.current = false; }, 500);
      }

      bootRef.current = false;
      prevUserRef.current = u;
    });
    return () => unsub();
  }, [nav, location]);

  const value = useMemo(() => ({ user, loading, isAdmin, showLoginSuccess }), [user, loading, isAdmin, showLoginSuccess]);

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Modal simples e independente de CSS do app */}
      {showLoginSuccess && (
        <div
          role="dialog"
          aria-live="polite"
          aria-label="Login efetuado com sucesso"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.4)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999
          }}
        >
          <div
            style={{
              background: "linear-gradient(180deg, rgba(20,20,20,.95), rgba(12,12,12,.95))",
              border: "1px solid rgba(255,255,255,.08)",
              boxShadow: "0 10px 40px rgba(0,0,0,.5)",
              borderRadius: 16,
              padding: 20,
              minWidth: 280,
              textAlign: "center",
              color: "#E5E7EB",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Login efetuado com sucesso</div>
            <div style={{ fontSize: 13, opacity: .8 }}>Você será redirecionado para a página anterior.</div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
