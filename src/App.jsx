import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { RoleProvider, useRole } from "./contexts/RoleContext";
import NavbarAsisten from "./components/NavbarAsisten";
import NavbarAdmin from "./components/NavbarAdmin";
import DashboardAsisten from "./pages/assistant/Dashboard";
import Lab609 from "./pages/assistant/Lab609";
import Lab610 from "./pages/assistant/Lab610";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/register";
import Profile from "./pages/Profile";

// ASISTEN
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
import AktivitasAsisten from "./pages/admin/AktifitasAsisten";
import AdminLab609 from "./pages/admin/lab609";
import AdminLab610 from "./pages/admin/lab610";

function AppContent() {
  const { role } = useRole();

  // Navbar sesuai role
  const showNavbarAsisten = role === "asisten";
  const showNavbarAdmin = role === "admin";

  const withTopbarAndSidebar = showNavbarAsisten || showNavbarAdmin;

  return (
    <>
      {showNavbarAsisten && <NavbarAsisten />}
      {showNavbarAdmin && <NavbarAdmin />}

      <div className={withTopbarAndSidebar}>
        <Routes>
          {/* Publik */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />

          {/* Asisten */}
          <Route path="/dashboard_asisten" element={<DashboardAsisten />} />
          <Route path="/lab609" element={<Lab609 />} />
          <Route path="/lab610" element={<Lab610 />} />

          {/* LAB 609 */}
          <Route path="/lab609_merakit_pc" element={<MerakitPc />} />
          <Route path="/lab609_bios_partisi" element={<BiosPartisi />} />
          <Route path="/lab609_jarkom" element={<JaringanKomputer />} />
          <Route path="/lab609_troubleshooting" element={<Troubleshooting />} />

          <Route path="/history_detail/:idHistory" element={<Detail />} />

          {/* FORM LAB 609 */}
          <Route path="/form_merakit_pc" element={<FormMerakitPc />} />
          <Route path="/form_bios_partisi" element={<FormBiosPartisi />} />
          <Route path="/form_jarkom" element={<FormJarkom />} />
          <Route
            path="/form_troubleshooting"
            element={<FormTroubleShooting />}
          />

          {/* LAB 610 */}
          <Route path="/lab610_merakit_pc" element={<MerakitPc610 />} />
          <Route path="/lab610_bios_partisi" element={<BiosPartisi610 />} />
          <Route path="/lab610_jarkom" element={<JaringanKomputer610 />} />
          <Route
            path="/lab610_troubleshooting"
            element={<Troubleshooting610 />}
          />

          {/* FORM LAB 610 */}
          <Route path="/form_merakit_pc" element={<FormMerakitPc />} />
          <Route path="/form_bios_partisi" element={<FormBiosPartisi />} />
          <Route path="/form_jarkom" element={<FormJarkom />} />
          <Route
            path="/form_troubleshooting"
            element={<FormTroubleShooting />}
          />

          {/* Admin */}
          <Route path="/dashboard_admin" element={<DashboardAdmin />} />
          <Route path="/daftar_asisten" element={<DaftarAsisten />} />
          <Route path="/admin/lab609" element={<AdminLab609 />} />
          <Route path="/admin/lab610" element={<AdminLab610 />} />
          <Route
            path="/daftar_asisten/:nim/aktivitas"
            element={<AktivitasAsisten />}
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
