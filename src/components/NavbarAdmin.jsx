import React, { useEffect, useState, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export default function NavbarAdmin({
  logoSrc = "/assets/images/logo_unikom.ico",
  appName = "Admin AP2SC",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsOpen((v) => !v), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);
  const { pathname } = useLocation();

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
    "flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition";
  const navLinkActive = "bg-white/15 text-white shadow-inner shadow-white/10";

  const MenuItems = () => (
    <>
      <NavLink
        to="/dashboard_admin"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* ikon dashboard */}
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

      <NavLink
        to="/daftar_asisten"
        className={({ isActive }) =>
          `${navLinkBase} ${isActive ? navLinkActive : ""}`
        }
      >
        {/* ikon users */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M16 11c1.657 0 3-1.79 3-4s-1.343-4-3-4-3 1.79-3 4 1.343 4 3 4zM8 11c1.657 0 3-1.79 3-4S9.657 3 8 3 5 4.79 5 7s1.343 4 3 4zm0 2c-2.761 0-5 2.239-5 5v2h10v-2c0-2.761-2.239-5-5-5zm8 0c-.686 0-1.337.116-1.938.328 1.175.923 1.938 2.34 1.938 3.922v2h6v-2c0-2.761-2.239-5-6-5z" />
        </svg>
        <span>Daftar Asisten</span>
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
              className="inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
            isOpen ? "max-h-[320px]" : "max-h-0"
          }`}
          aria-hidden={!isOpen}
        >
          <div className="bg-blue-700/95 px-3 pb-3 pt-2 sm:px-4 shadow-inner">
            <MenuItems />
          </div>
        </div>
      </nav>

      {/* Desktop sidebar (LEBAR DIPERKECIL) */}
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

        <div className="border-t border-white/10 px-4 py-3 text-xs text-white/70">
          © {new Date().getFullYear()} AP2SC. All rights reserved.
        </div>
      </aside>
    </>
  );
}
