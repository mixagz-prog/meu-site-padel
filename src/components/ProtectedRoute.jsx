// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return null; // pode trocar por um skeleton/spinner

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
