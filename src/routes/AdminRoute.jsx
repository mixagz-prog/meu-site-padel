// src/routes/AdminRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function AdminRoute({ user, children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function check() {
      if (!user) { setIsAdmin(false); setLoading(false); return; }
      const d = await getDoc(doc(db, "admins", user.uid));
      setIsAdmin(d.exists());
      setLoading(false);
    }
    check();
  }, [user]);

  if (loading) return null; // ou um spinner bonitão
  if (!user || !isAdmin) return <Navigate to="/" replace />;
  return children;
}
