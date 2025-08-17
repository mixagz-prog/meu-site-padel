// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubAdmin = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);

      if (unsubAdmin) { unsubAdmin(); unsubAdmin = null; }

      if (u) {
        // escuta admins/{uid} (só quando logado, evitando permission-denied)
        unsubAdmin = onSnapshot(
          doc(db, "admins", u.uid),
          (snap) => setIsAdmin(snap.exists()),
          () => setIsAdmin(false)
        );
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return () => {
      if (unsubAdmin) unsubAdmin();
      unsubAuth();
    };
  }, []);

  return (
    <Ctx.Provider value={{ user, isAdmin, loading }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
