import { Outlet, useLocation } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import NavbarAsisten from "@/components/NavbarAsisten";
import NavbarAdmin from "@/components/NavbarAdmin";
import FloatingPwaInstall from "@/components/common/FloatingPwaInstall";

const HIDE_PREFIX = ["/login", "/register", "/forgot-password"];
const HIDE_EXACT = ["/"];

export default function AppLayout() {
  const { role } = useRole();
  const { pathname } = useLocation();

  const showNavbarAsisten = role === "asisten";
  const showNavbarAdmin = role === "admin";
  const hideNavbar =
    HIDE_EXACT.includes(pathname) ||
    HIDE_PREFIX.some((p) => pathname.startsWith(p));

  return (
    <>
      {!hideNavbar && showNavbarAsisten && <NavbarAsisten />}
      {!hideNavbar && showNavbarAdmin && <NavbarAdmin />}
      <div className="w-full">
        <Outlet />
      </div>
      <FloatingPwaInstall />
    </>
  );
}
