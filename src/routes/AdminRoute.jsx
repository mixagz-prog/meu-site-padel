import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Aceita admin via:
 *  - custom claims: claims.admin === true
 *  - Firestore: users/<uid>.isAdmin === true  OU  users/<uid>.role === "admin"
 *  - admins/<uid> (doc existe ou enabled:true)
 * Espera todo o carregamento antes de decidir.
 */
export default function AdminRoute({ children }) {
  const { user, loading, loadingProfile, loadingAdminDoc, isAdmin } = useAuth();

  if (loading || loadingProfile || loadingAdminDoc) {
    // evite flicker/redirecionar antes de carregar
    return null;
  }

  return user && isAdmin ? children : <Navigate to="/" replace />;
}
