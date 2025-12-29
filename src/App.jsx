/* eslint-disable no-unused-vars */
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import NavbarAsisten from "./components/NavbarAsisten";
import NavbarAdmin from "./components/NavbarAdmin";
import DashboardAsisten from "./pages/assistant/Dashboard";
import Lab609 from "./pages/assistant/Lab609";
import Lab610 from "./pages/assistant/Lab610";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

// ✅ TAMBAHKAN INI
import RequireAuth from "./routes/RequireAuth";

// ASISTEN
import PerangkatLab from "./pages/assistant/template/PerangkatLab";

// LAB 609
import MerakitPc from "./pages/assistant/lab609/MerakitPc";
import BiosPartisi from "./pages/assistant/lab609/BiosPartisi";
import JaringanKomputer from "./pages/assistant/lab609/Jarkom";
import Troubleshooting from "./pages/assistant/lab609/TroubleShooting";

import Detail from "./pages/assistant/template/DetailHistory";

// LAB 610
import MerakitPc610 from "./pages/assistant/lab610/MerakitPc";
import BiosPartisi610 from "./pages/assistant/lab610/BiosPartisi";
import JaringanKomputer610 from "./pages/assistant/lab610/Jarkom";
import Troubleshooting610 from "./pages/assistant/lab610/TroubleShooting";

// FORM
import FormMerakitPc from "./pages/assistant/form/FormMerakitPc";
import FormBiosPartisi from "./pages/assistant/form/FormBiosPartisi";
import FormJarkom from "./pages/assistant/form/FormJarkom";
import FormTroubleShooting from "./pages/assistant/form/FormTroubleShooting";

// ADMIN
import DashboardAdmin from "./pages/admin/Dashboard";
import DaftarAsisten from "./pages/admin/DaftarAsisten";
import AddJadwalAsisten from "./pages/admin/AddJadwalAsisten";
import JadwalAsisten from "./pages/admin/JadwalAsisten";
import AktivitasAsisten from "./pages/admin/AktifitasAsisten";
import AdminLab609 from "./pages/admin/lab609";
import AdminLab610 from "./pages/admin/lab610";

import DaftarDosen from "./pages/admin/DaftarDosen";
import DaftarKelas from "./pages/admin/DaftarKelas";
import MasterBarang from "./pages/admin/MasterBarang";

function AppContent() {
  const { role } = useRole();
  const { pathname } = useLocation();

  // Navbar sesuai role
  const showNavbarAsisten = role === "asisten";
  const showNavbarAdmin = role === "admin";

  // Halaman yang TIDAK menampilkan navbar
  const HIDE_PREFIX = ["/login", "/register", "/forgot-password"]; // prefix match
  const HIDE_EXACT = ["/"]; // exact match: landing
  const hideNavbar =
    HIDE_EXACT.includes(pathname) ||
    HIDE_PREFIX.some((p) => pathname.startsWith(p));

  // Sidebar hanya milik Admin; topbar fixed milik admin/asisten
  const hasSidebar = !hideNavbar && showNavbarAdmin;
  const hasFixedTopbar = !hideNavbar && (showNavbarAdmin || showNavbarAsisten);

  return (
    <>
      {!hideNavbar && showNavbarAsisten && <NavbarAsisten />}
      {!hideNavbar && showNavbarAdmin && <NavbarAdmin />}

      <div className={hasSidebar}>
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ BUTUH LOGIN (admin/asisten) */}
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          {/* ✅ ASISTEN ONLY */}
          <Route
            path="/dashboard_asisten"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <DashboardAsisten />
              </RequireAuth>
            }
          />
          <Route
            path="/lab609"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <Lab609 />
              </RequireAuth>
            }
          />
          <Route
            path="/lab610"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <Lab610 />
              </RequireAuth>
            }
          />

          <Route
            path="/perangkatlab"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <PerangkatLab />
              </RequireAuth>
            }
          />

          {/* LAB 609 */}
          <Route
            path="/lab609_merakit_pc"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc />
              </RequireAuth>
            }
          />
          <Route
            path="/lab609_bios_partisi"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc />
              </RequireAuth>
            }
          />
          <Route
            path="/lab609_jarkom"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc />
              </RequireAuth>
            }
          />
          <Route
            path="/lab609_troubleshooting"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc />
              </RequireAuth>
            }
          />

          <Route
            path="/history_detail/:idHistory"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <Detail />
              </RequireAuth>
            }
          />

          {/* FORM LAB 609 */}
          <Route
            path="/form_merakit_pc"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormMerakitPc />
              </RequireAuth>
            }
          />
          <Route
            path="/form_bios_partisi"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormBiosPartisi />
              </RequireAuth>
            }
          />
          <Route
            path="/form_jarkom"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormJarkom />
              </RequireAuth>
            }
          />
          <Route
            path="/form_troubleshooting"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormTroubleShooting />
              </RequireAuth>
            }
          />

          {/* LAB 610 */}
          <Route
            path="/lab610_merakit_pc"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc610 />
              </RequireAuth>
            }
          />
          <Route
            path="/lab610_bios_partisi"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc610 />
              </RequireAuth>
            }
          />
          <Route
            path="/lab610_jarkom"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc610 />
              </RequireAuth>
            }
          />
          <Route
            path="/lab610_troubleshooting"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <MerakitPc610 />
              </RequireAuth>
            }
          />

          {/* FORM LAB 610 */}
          <Route
            path="/form_merakit_pc"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormMerakitPc />
              </RequireAuth>
            }
          />
          <Route
            path="/form_bios_partisi"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormBiosPartisi />
              </RequireAuth>
            }
          />
          <Route
            path="/form_jarkom"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormJarkom />
              </RequireAuth>
            }
          />
          <Route
            path="/form_troubleshooting"
            element={
              <RequireAuth allowRoles={["asisten"]}>
                <FormTroubleShooting />
              </RequireAuth>
            }
          />

          {/* ✅ ADMIN ONLY */}
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
            path="/admin/lab609"
            element={
              <RequireAuth allowRoles={["admin"]}>
                <AdminLab609 />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/lab610"
            element={
              <RequireAuth allowRoles={["admin"]}>
                <AdminLab610 />
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
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <RoleProvider>
        <AppContent />
      </RoleProvider>
    </Router>
  );
}

export default App;
