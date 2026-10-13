import { Navigate, useParams } from "react-router-dom";
import AdminLab609 from "./AdminLab609";
import AdminLab610 from "./AdminLab610";

// Wrapper param bersih: /admin/lab/:labId -> komponen yang sesuai.
export default function AdminLabDetail() {
  const { labId } = useParams();
  if (labId === "609") return <AdminLab609 />;
  if (labId === "610") return <AdminLab610 />;
  return <Navigate to="/dashboard_admin" replace />;
}
