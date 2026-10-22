import React from "react";
import { Link } from "react-router-dom";
import logo from "/ap2sc.jpg";
import gear_logo from "../assets/images/logo_landing.png";

export default function Landing() {
  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-blue-900 via-blue-700 to-indigo-900 text-white relative overflow-x-hidden flex flex-col font-sans">
      {/* Background Ambient Ornaments */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-blue-400/15 blur-3xl" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-blue-950/40 border-b border-white/10 flex-none">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 group">
            <img
              src={logo}
              alt="UNIKOM"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl  p-1 object-contain shadow-md group-hover:scale-105 transition"
            />
            <div>
              <span className="text-base sm:text-xl font-bold tracking-tight block">
                AP2SC UNIKOM
              </span>
              <span className="text-[10px] sm:text-xs text-blue-200/80 -mt-0.5 block">
                Hardware Management
              </span>
            </div>
          </div>

          {/* Tombol Auth di Navbar (Jelas & Terlihat di Mobile dan Desktop) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/15 hover:bg-white/25 active:scale-95 transition border border-white/20 backdrop-blur-md text-white shadow-sm"
            >
              LOGIN
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-blue-700 hover:bg-slate-100 active:scale-95 transition shadow-md"
            >
              REGISTER
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative flex-1 flex items-center w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* KOLOM KIRI (TEKS & CTA) */}
          <div className="flex-1 text-center lg:text-left z-10 flex flex-col justify-center">
            {/* Tag Badge */}
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 border border-cyan-400/30 px-3 py-1 text-xs font-semibold text-cyan-200">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Laboratorium Hardware 609 & 610
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Selamat Datang di <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-white">
                Website Manajemen
              </span>{" "}
              <br />
              Perangkat Lab
            </h1>

            <p className="mt-4 sm:mt-6 text-sm sm:text-base lg:text-lg text-blue-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Sistem pengecekan fisik dan pelaporan hardware komputer pasca-praktikum.
              Dirancang cepat dan mudah diakses langsung melalui smartphone asisten di laboratorium.
            </p>

            {/* CTA ACTION BUTTONS (Super Jelas di Mobile) */}
            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 w-full max-w-md mx-auto lg:mx-0">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm sm:text-base bg-white text-blue-800 hover:bg-slate-100 shadow-xl hover:shadow-2xl active:scale-95 transition"
              >
                <span>Masuk ke Sistem (Login)</span>
                <svg
                  className="w-5 h-5 text-blue-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold text-sm sm:text-base bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-md active:scale-95 transition"
              >
                <span>Daftar Akun Baru</span>
              </Link>
            </div>

            {/* Quick Feature Badges */}
            {/* <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-3 gap-2 text-center lg:text-left">
              <div>
                <div className="text-lg sm:text-2xl font-bold text-white">4 Kategori</div>
                <div className="text-[11px] sm:text-xs text-blue-200/80">Praktikum Hardware</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-cyan-300">Mobile-First</div>
                <div className="text-[11px] sm:text-xs text-blue-200/80">Form Sentuh Cepat</div>
              </div>
              <div>
                <div className="text-lg sm:text-2xl font-bold text-emerald-300">Realtime</div>
                <div className="text-[11px] sm:text-xs text-blue-200/80">Sinkron Data Lab</div>
              </div>
            </div> */}
          </div>

          {/* KOLOM KANAN (GAMBAR AMBIENT) */}
          <div className="flex-1 flex justify-center items-center w-full z-10 max-w-sm sm:max-w-md lg:max-w-lg">
            <div className="relative w-full aspect-square flex items-center justify-center">
              <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-[2.5rem] sm:rounded-[3rem] border border-white/15 shadow-2xl transform rotate-2 hover:rotate-0 transition duration-500 ease-out" />
              <img
                src={gear_logo}
                alt="Hardware Gear"
                className="relative z-10 w-3/4 h-3/4 object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* FOOTER */}
      <footer className="w-full py-4 text-center text-blue-200/60 text-xs sm:text-sm flex-none bg-blue-950/50 backdrop-blur-md border-t border-white/5">
        <p className="px-4 leading-relaxed">
          &copy; {new Date().getFullYear()} Sekretariat AP2SC UNIKOM (R.4409) Universitas Komputer Indonesia <br className="hidden sm:block" />
          Jln. Dipatiukur No.102-116, Coblong, Lebakgede, Bandung, Jawa Barat 40132
        </p>
      </footer>
    </div>
  );
}
