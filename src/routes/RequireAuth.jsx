import { Navigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";

export default function RequireAuth({ children, allowRoles }) {
  const { role } = useRole();

  // Anggap login jika role tersedia
  const isAuthed = role === "admin" || role === "asisten";

  // Belum login -> ke login
  if (!isAuthed) return <Navigate to="/login" replace />;

  // Kalau dibatasi role -> cek role
  if (allowRoles && !allowRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
