import { Navigate, Outlet } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";

const ProtectedRoute = ({ allowRoles }) => {
  const { role } = useRole();

  // Anggap login jika role ada (admin/asisten)
  const isAuthed = role === "admin" || role === "asisten";

  // Belum login -> lempar ke login
  if (!isAuthed) return <Navigate to="/login" replace />;

  // Kalau allowRoles diset, cek role boleh atau tidak
  if (allowRoles && !allowRoles.includes(role)) {
    // kamu bisa ganti ke halaman "403" kalau punya
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
