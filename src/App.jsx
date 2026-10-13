import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { RoleProvider } from "@/contexts/RoleContext";
import AppLayout from "@/components/layout/AppLayout";
import RequireAuth from "@/routes/RequireAuth";
import {
  labShortFromCode,
  laporanPath,
  praktikumSlugFromCode,
} from "@/features/praktikum/constants";

import DashboardAsisten from "@/pages/assistant/Dashboard";
import LabDetail from "@/pages/assistant/LabDetail";
import PraktikumHistory from "@/pages/assistant/PraktikumHistory";
import PraktikumForm from "@/pages/assistant/PraktikumForm";
import HistoryDetail from "@/pages/assistant/HistoryDetail";
import PerangkatLab from "@/pages/assistant/PerangkatLab";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Profile from "@/pages/Profile";

import DashboardAdmin from "@/pages/admin/Dashboard";
import DaftarAsisten from "@/pages/admin/DaftarAsisten";
import AddJadwalAsisten from "@/pages/admin/AddJadwalAsisten";
import JadwalAsisten from "@/pages/admin/JadwalAsisten";
import AktivitasAsisten from "@/pages/admin/AktifitasAsisten";
import AdminLabDetail from "@/pages/admin/AdminLabDetail";
import DaftarDosen from "@/pages/admin/DaftarDosen";
import DaftarKelas from "@/pages/admin/DaftarKelas";
import MasterBarang from "@/pages/admin/MasterBarang";

// ---- Legacy redirect: /perangkatlab?lab=609|610 -> /perangkat/:labId ----
function LegacyPerangkatRedirect() {
  const [sp] = useSearchParams();
  const lab = sp.get("lab");
  return <Navigate to={lab === "610" ? "/perangkat/610" : "/perangkat/609"} replace />;
}

// ---- Legacy redirect: /form_*?lab=LAB..&kode=PRTK.. -> /laporan/:labId/:slug ----
function LegacyFormRedirect({ defaultSlug }) {
  const [sp] = useSearchParams();
  const labShort = labShortFromCode(sp.get("lab")) || "609";
  const slug = praktikumSlugFromCode(sp.get("kode")) || defaultSlug;
  return <Navigate to={laporanPath(labShort, slug)} replace />;
}

// ---- Legacy redirect: /history_detail/:id -> /histori/:id ----
function LegacyHistoryRedirect() {
  const { idHistory } = useParams();
  return <Navigate to={`/histori/${encodeURIComponent(idHistory ?? "")}`} replace />;
}

function App() {
  return (
    <Router>
      <RoleProvider>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Publik */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />

            {/* Asisten */}
            <Route
              path="/dashboard_asisten"
              element={
                <RequireAuth allowRoles={["asisten"]}>
                  <DashboardAsisten />
                </RequireAuth>
              }
            />
            <Route
              path="/lab/:labId"
              element={
                <RequireAuth allowRoles={["asisten"]}>
                  <LabDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/lab/:labId/:slug"
              element={
                <RequireAuth allowRoles={["asisten", "admin"]}>
                  <PraktikumHistory />
                </RequireAuth>
              }
            />
            <Route
              path="/laporan/:labId/:slug"
              element={
                <RequireAuth allowRoles={["asisten", "admin"]}>
                  <PraktikumForm />
                </RequireAuth>
              }
            />
            <Route
              path="/histori/:idHistory"
              element={
                <RequireAuth allowRoles={["asisten", "admin"]}>
                  <HistoryDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/perangkat/:labId"
              element={
                <RequireAuth allowRoles={["asisten"]}>
                  <PerangkatLab />
                </RequireAuth>
              }
            />

            {/* Admin */}
            <Route
              path="/dashboard_admin"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <DashboardAdmin />
                </RequireAuth>
              }
            />
            <Route
              path="/jadwal_asisten"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <JadwalAsisten />
                </RequireAuth>
              }
            />
            <Route
              path="/jadwal_asisten/add"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <AddJadwalAsisten />
                </RequireAuth>
              }
            />
            <Route
              path="/daftar_asisten"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <DaftarAsisten />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/lab/:labId"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <AdminLabDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/daftar_asisten/:nim/aktivitas"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <AktivitasAsisten />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/dosen"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <DaftarDosen />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/kelas"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <DaftarKelas />
                </RequireAuth>
              }
            />
            <Route
              path="/admin/barang"
              element={
                <RequireAuth allowRoles={["admin"]}>
                  <MasterBarang />
                </RequireAuth>
              }
            />

            {/* Legacy redirects -> route bersih */}
            <Route path="/lab609" element={<Navigate to="/lab/609" replace />} />
            <Route path="/lab610" element={<Navigate to="/lab/610" replace />} />
            <Route path="/lab609_merakit_pc" element={<Navigate to="/lab/609/merakit-pc" replace />} />
            <Route path="/lab609_bios_partisi" element={<Navigate to="/lab/609/bios-partisi" replace />} />
            <Route path="/lab609_jarkom" element={<Navigate to="/lab/609/jarkom" replace />} />
            <Route path="/lab609_troubleshooting" element={<Navigate to="/lab/609/troubleshooting" replace />} />
            <Route path="/lab610_merakit_pc" element={<Navigate to="/lab/610/merakit-pc" replace />} />
            <Route path="/lab610_bios_partisi" element={<Navigate to="/lab/610/bios-partisi" replace />} />
            <Route path="/lab610_jarkom" element={<Navigate to="/lab/610/jarkom" replace />} />
            <Route path="/lab610_troubleshooting" element={<Navigate to="/lab/610/troubleshooting" replace />} />
            <Route path="/form_merakit_pc" element={<LegacyFormRedirect defaultSlug="merakit-pc" />} />
            <Route path="/form_bios_partisi" element={<LegacyFormRedirect defaultSlug="bios-partisi" />} />
            <Route path="/form_jarkom" element={<LegacyFormRedirect defaultSlug="jarkom" />} />
            <Route path="/form_troubleshooting" element={<LegacyFormRedirect defaultSlug="troubleshooting" />} />
            <Route path="/perangkatlab" element={<LegacyPerangkatRedirect />} />
            <Route path="/history_detail/:idHistory" element={<LegacyHistoryRedirect />} />
            <Route path="/admin/lab609" element={<Navigate to="/admin/lab/609" replace />} />
            <Route path="/admin/lab610" element={<Navigate to="/admin/lab/610" replace />} />
          </Route>
        </Routes>
      </RoleProvider>
    </Router>
  );
}

export default App;
