// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  requireVerified = false,
  requireAdmin = false,
}) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="center" style={{ padding: 40 }}>Carregando…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireVerified) {
    const emailVerified = !!user.emailVerified;
    const phoneVerified = !!user.phoneNumber;
    if (!emailVerified && !phoneVerified) {
      return (
        <Navigate
          to="/login"
          replace
          state={{ from: location, needVerification: true }}
        />
      );
    }
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
