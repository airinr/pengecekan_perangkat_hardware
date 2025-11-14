import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";

export default function NavbarAsisten({
  logoSrc = "/assets/images/logo_unikom.ico",
  appName = "Asisten AP2SC",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setRole } = useRole();

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

  // 🔵 Paksa warna biru untuk link (termasuk visited)
  const navLinkBase =
    "flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-blue-100 visited:text-blue-100 hover:text-white hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 transition";
  const navLinkActive =
    "bg-blue-500/25 text-white shadow-inner shadow-blue-300/10";

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

  // Dropdown reusable
  const Dropdown = ({ title, icon, items, sectionId }) => {
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
          className={`${navLinkBase} w-full justify-between bg-blue-800 hover:bg-blue-700 ${
            isSectionActive ? navLinkActive : ""
          }`}
          aria-expanded={open}
          aria-controls={`${sectionId}-menu`}
        >
          <span className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </span>
          <Chevron open={open} />
        </button>

        {/* Wrapper paksa warna anak: a & svg tetap biru */}
        <div
          id={`${sectionId}-menu`}
          className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
            open ? "max-h-40" : "max-h-0"
          } [&_a]:text-blue-100 [&_a:visited]:text-blue-100 [&_svg]:text-blue-200`}
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
      {/* Dashboard (opsional) */}
      <NavLink
        to="/dashboard_asisten"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
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

      {/* Perangkat (Dropdown) */}
      <Dropdown
        sectionId="perangkat"
        title="Perangkat"
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
          { label: "Lab 609", to: "/perangkatlab?lab=609" },
          { label: "Lab 610", to: "/perangkatlab?lab=610" },
        ]}
      />

      {/* Laporan (Dropdown) */}
      <Dropdown
        sectionId="laporan"
        title="Laporan"
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M6.25 3A2.25 2.25 0 004 5.25v13.5A2.25 2.25 0 006.25 21h8.5A2.25 2.25 0 0017 18.75V9.5l-5.5-6.5H6.25ZM7 7.75A.75.75 0 017.75 7h3.5a.75.75 0 010 1.5h-3.5A.75.75 0 017 7.75Zm0 4a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5A.75.75 0 017 11.75Zm0 4a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75Z" />
          </svg>
        }
        items={[
          { label: "Lab 609", to: "/lab609" },
          { label: "Lab 610", to: "/lab610" },
        ]}
      />

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
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
      <nav className="fixed top-0 left-0 z-50 w-full md:hidden backdrop-blur bg-blue-700/90 shadow-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-12 items-center justify-between">
            <Link to="/dashboard_asisten" className="flex items-center gap-3">
              <img
                src={logoSrc}
                alt="Logo"
                className="h-6 w-6 rounded-md object-contain ring-1 ring-blue-200/30"
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
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
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
            isOpen ? "max-h-[420px]" : "max-h-0"
          }`}
          aria-hidden={!isOpen}
        >
          <div className="bg-blue-800/95 px-3 pb-3 pt-2 sm:px-4 shadow-inner">
            <MenuItems />
          </div>
        </div>
      </nav>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col bg-gradient-to-b from-blue-800 to-blue-700 text-white shadow-2xl">
        <div className="flex h-12 items-center gap-3 border-b border-blue-400/20 px-5">
          <Link to="/dashboard_asisten" className="flex items-center gap-3">
            <img
              src={logoSrc}
              alt="Logo"
              className="h-7 w-7 rounded-lg object-contain ring-1 ring-blue-200/30"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <span className="text-white text-base font-extrabold tracking-tight">
              {appName}
            </span>
          </Link>
        </div>

        {/* 🔵 Container menu mewariskan biru */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 text-blue-100">
          <MenuItems />
        </nav>

        {/* Logout button */}
        <div className="border-t border-blue-400/20 px-3 py-2">
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              localStorage.removeItem("user");
              setRole(null);
              navigate("/login");
            }}
            className={`${navLinkBase} w-full justify-start bg-blue-800 hover:bg-blue-700`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9z" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        <div className="border-t border-blue-400/20 px-4 py-3 text-xs text-blue-200">
          © {new Date().getFullYear()} AP2SC. All rights reserved.
        </div>
      </aside>

      {/* spacer agar konten tidak ketutup sidebar */}
      <div className="md:pl-56" />
    </>
  );
}
