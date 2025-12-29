/* eslint-disable no-empty */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function NavbarAdmin({
  logoSrc = "/assets/images/logo_unikom.ico",
  appName = "Admin AP2SC",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // === LOGOUT state & handler ===
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const token = localStorage.getItem("token");
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

      // (Opsional) hit endpoint backend logout jika tersedia
      if (API_BASE && token) {
        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              ...NGROK_HEADERS,
            },
          });
        } catch {
          // Abaikan error network; tetap lanjut bersihkan sisi client
        }
      }
    } finally {
      // Bersihkan jejak auth di client (tanpa hard reload)
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();

        // Bersihkan cache PWA/Service Worker jika ada (opsional)
        if ("caches" in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch {
            // aman diabaikan
          }
        }

        // Beri tahu tab lain untuk logout juga
        try {
          const bc = new BroadcastChannel("auth");
          bc.postMessage({ type: "LOGOUT" });
          bc.close();
        } catch {
          // aman diabaikan
        }

        // Navigasi ke halaman login & cegah back
        navigate("/login", { replace: true });

        // ❌ JANGAN hard reload agar layout publik bisa muncul
        // window.location.reload();
      } catch {
        // Fallback jika sesuatu gagal
        window.location.href = "/login";
      } finally {
        setLoggingOut(false);
      }
    }
  }, [loggingOut, navigate]);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMenu]);

  const navLinkBase =
    "flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-white/90 hover:text-white hover:bg-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition";
  const navLinkActive =
    "bg-blue-600/30 text-white shadow-inner shadow-white/10";

  const Chevron = ({ open }) => (
    <svg
      className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.17l3.71-2.94a.75.75 0 011.04 1.08l-4.24 3.36a.75.75 0 01-.94 0L5.21 8.31a.75.75 0 01.02-1.1z"
        clipRule="evenodd"
      />
    </svg>
  );

  const Dropdown = ({ title, icon, items, sectionPrefix, bgColor }) => {
    const isSectionActive = useMemo(
      () => items.some((it) => pathname.startsWith(it.to)),
      [items, pathname]
    );
    const [open, setOpen] = useState(isSectionActive);
    useEffect(() => setOpen(isSectionActive), [isSectionActive]);

    const toggle = () => setOpen((v) => !v);

    return (
      <div className="relative">
        <button
          type="button"
          onClick={toggle}
          className={`${navLinkBase} w-full justify-between ${bgColor || ""} ${
            isSectionActive ? navLinkActive : ""
          }`}
          aria-expanded={open}
          aria-controls={`${sectionPrefix}-menu`}
        >
          <span className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </span>
          <Chevron open={open} />
        </button>

        <div
          id={`${sectionPrefix}-menu`}
          className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
            open ? "max-h-40" : "max-h-0"
          }`}
          aria-hidden={!open}
        >
          <div className="mt-1 flex flex-col gap-1">
            {items.map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                className={({ isActive }) =>
                  `pl-6 ${navLinkBase} ${isActive ? navLinkActive : ""}`
                }
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <circle cx="10" cy="10" r="3" />
                </svg>
                <span>{it.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MenuItems = () => (
    <>
      <NavLink
        to="/dashboard_admin"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* Dashboard */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 1-1.06 1.06l-.9-.9V19.5a2.25 2.25 0 0 1-2.25 2.25h-2.25a.75.75 0 0 1-.75-.75v-3.75a.75.75 0 0 0-.75-.75h-2.25a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H6.75A2.25 2.25 0 0 1 4.5 19.5v-6.81l-.9.9a.75.75 0 0 1-1.06-1.06l8.69-8.69Z" />
        </svg>
        <span>Dashboard</span>
      </NavLink>

      {/* Perangkat */}
      <Dropdown
        sectionPrefix="laboratorium"
        title="Laboratorium"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M4 6.75A2.75 2.75 0 016.75 4h10.5A2.75 2.75 0 0120 6.75v6.5A2.75 2.75 0 0117.25 16H6.75A2.75 2.75 0 014 13.25v-6.5ZM5.5 18.25A.75.75 0 016.25 17.5h11.5a.75.75 0 010 1.5H6.25a.75.75 0 01-.75-.75Z" />
          </svg>
        }
        items={[
          { label: "Lab 609", to: "/admin/lab609" },
          { label: "Lab 610", to: "/admin/lab610" },
        ]}
        bgColor="bg-blue-600 hover:bg-blue-700"
      />

      {/* Asisten */}
      <Dropdown
        sectionPrefix="asisten"
        title="Asisten"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 11c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.761 0-5 2.239-5 5v2h10v-2c0-2.761-2.239-5-5-5zm8 0c-.686 0-1.337.116-1.938.328 1.175.923 1.938 2.34 1.938 3.922v2h6v-2c0-2.761-2.239-5-6-5z" />
          </svg>
        }
        items={[
          // { label: "Jadwal Asisten", to: "/jadwal_asisten" },
          { label: "Daftar Asisten", to: "/daftar_asisten" },
        ]}
        bgColor="bg-blue-600 hover:bg-blue-700"
      />

      {/* Dosen */}
      <NavLink
        to="/admin/dosen"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* ikon toga */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M12 2.25a.75.75 0 0 1 .36.09l8 4a.75.75 0 0 1 0 1.32l-8 4a.75.75 0 0 1-.72 0l-8-4a.75.75 0 0 1 0-1.32l8-4a.75.75 0 0 1 .36-.09Z" />
          <path d="M5.25 10.5v3.379a3 3 0 0 0 1.318 2.493l4.5 3a3 3 0 0 0 3.864-.45l.068-.068a3 3 0 0 0 .75-1.992V10.5l-4.5 2.25a2.25 2.25 0 0 1-2.016 0L5.25 10.5Z" />
        </svg>
        <span>Data Dosen</span>
      </NavLink>

      {/* ✅ KELAS – item baru */}
      <NavLink
        to="/admin/kelas"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* ikon kelas (papan tulis) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M3.75 5.25A2.25 2.25 0 016 3h12a2.25 2.25 0 012.25 2.25V15A2.25 2.25 0 0118 17.25H6A2.25 2.25 0 013.75 15V5.25ZM6 18.75a.75.75 0 000 1.5h12a.75.75 0 000-1.5H6Z" />
        </svg>
        <span>Data Kelas</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* ikon user */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0v.75a.75.75 0 0 1-.75.75h-13.5a.75.75 0 0 1-.75-.75v-.75Z"
            clipRule="evenodd"
          />
        </svg>
        <span>Profile</span>
      </NavLink>
    </>
  );

  return (
    <>
      {/* Mobile topbar */}
      <nav className="fixed top-0 left-0 z-50 w-full md:hidden backdrop-blur supports-[backdrop-filter]:bg-blue-600/80 bg-blue-600/95 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <Link to="/admin" className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="Logo"
                className="h-6 w-6 rounded-md object-contain ring-1 ring-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="text-white text-base font-bold drop-shadow-sm">
                {appName}
              </span>
            </Link>
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-blue-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Toggle menu"
              aria-expanded={isOpen}
              aria-controls="mobile-menu"
            >
              {isOpen ? (
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={`md:hidden transition-[max-height] duration-300 ease-out overflow-hidden ${
            isOpen ? "max-h-[500px]" : "max-h-0"
          }`}
          aria-hidden={!isOpen}
        >
          <div className="bg-blue-700/95 px-3 pb-3 pt-2 sm:px-4 shadow-inner">
            <MenuItems />
          </div>
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col bg-gradient-to-b from-blue-700 to-blue-600 text-white shadow-2xl">
        <div className="flex h-12 items-center gap-3 border-b border-white/10 px-5">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="Logo"
              className="h-7 w-7 rounded-lg object-contain ring-1 ring-white/20"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-white text-base font-extrabold tracking-tight truncate">
              {appName}
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <MenuItems />
        </nav>

        <div className="border-t border-white/10 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-busy={loggingOut ? "true" : "false"}
            className={`flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition ${
              loggingOut
                ? "bg-blue-500 cursor-not-allowed opacity-70"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M16.5 3.75a1.5 1.5 0 0 1 1.5 1.5v11.25a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5V5.25a1.5 1.5 0 0 1 1.5-1.5h6ZM15 8.25a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v2.25c0 .414.336.75.75.75h3a.75.75 0 0 0 .75-.75V8.25Z"
                clipRule="evenodd"
              />
              <path d="M3 19.5a1.5 1.5 0 0 0 1.5 1.5h1.5a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 6 12H4.5A1.5 1.5 0 0 0 3 13.5v-6Z" />
              <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1.5A1.5 1.5 0 0 1 7.5 7.5v6A1.5 1.5 0 0 1 6 15H4.5A1.5 1.5 0 0 1 3 13.5v-6Z" />
            </svg>
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>

        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/70">
          © {new Date().getFullYear()} AP2SC. All rights reserved.
        </div>
      </aside>
    </>
  );
}
