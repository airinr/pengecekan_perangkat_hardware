import React from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo_unikom.png";
import gear_logo from "../assets/images/logo_landing.png";

export default function Landing() {
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");
  const goFeatures = (e) => {
    e.preventDefault();
    if (isLoggedIn) {
      navigate("/features");
    } else {
      navigate("/login");
    }
  };

  return (

    <div className="h-screen w-screen bg-gradient-to-b from-blue-800 via-blue-600 to-indigo-700 text-white relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Ornaments */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full backdrop-blur-sm bg-blue-900/10 border-b border-white/5 flex-none">
        <div className="w-full flex items-center justify-between px-8 py-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="UNIKOM"
              className="h-10 w-10 rounded-xl bg-white p-1 object-contain shadow-md group-hover:scale-105 transition"
            />
            <span className="text-xl font-bold tracking-tight">
              AP2SC UNIKOM
            </span>
          </div>

          {/* Tombol */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="hidden sm:inline-flex px-6 py-2.5 rounded-lg font-bold bg-white/10 hover:bg-white/20 transition border border-white/10 backdrop-blur-md"
            >
              LOGIN
            </Link>
            <Link
              to="/register"
              className="px-6 py-2.5 rounded-lg font-semibold bg-white text-blue-700 hover:bg-gray-100 transition shadow-lg"
            >
              REGISTER
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      {/* 'flex-1' atau 'flex-grow' sangat PENTING disini. */}
      {/* Ini membuat bagian tengah mengambil SEMUA sisa ruang kosong, sehingga Footer terdorong ke paling bawah. */}
      <header className="relative flex-1 flex items-center w-full px-8 overflow-hidden">
        <div className="w-full h-full flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* KOLOM KIRI (TEKS) */}
          <div className="flex-1 text-left z-10 pl-4 lg:pl-10 flex flex-col justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
              Selamat Datang <br />
              <span className="text-cyan-300">Website Managemen</span> <br/>
              Perangkat Lab
            </h1>
            <p className="mt-6 text-lg text-blue-100 max-w-xl leading-relaxed">
              {/* Deskripsi kosong sesuai kode asli */}
            </p>
          </div>

          {/* KOLOM KANAN (GAMBAR) */}
          <div className="flex-1 flex justify-center lg:justify-end items-center w-full z-10 pr-4 lg:pr-10 h-full">
            <div className="relative w-full max-w-lg aspect-square lg:max-w-xl flex items-center justify-center">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xl rounded-[3rem] border border-white/10 shadow-2xl transform rotate-3 scale-95 hover:rotate-0 hover:scale-100 transition duration-500 ease-out"></div>
                <img 
                    src={gear_logo} 
                    alt="Hardware Gear" 
                    className="relative z-10 w-4/5 h-4/5 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-pulse-slow" 
                />
            </div>
          </div>

        </div>
      </header>
      
      {/* FOOTER */}
      {/* flex-none memastikan footer tidak berubah ukurannya */}
      <footer className="absolute-bottom-0 left-0 w-full py-4 text-center text-blue-200/60 text-xs sm:text-sm flex-none bg-blue-900/10 backdrop-blur-sm">
        <p className="px-4 leading-relaxed">
            &copy; {new Date().getFullYear()} Sekretariat AP2SC UNIKOM (R.4409) Universitas Komputer Indonesia <br className="hidden sm:block"/>
            Jln. Dipatiukur No.102-116, Coblong, Lebakgede, Bandung, Jawa Barat 40132
        </p>
      </footer>
    </div>
    
  );
}

// ... Function icon lainnya biarkan saja ...

function Feature({ title, desc, icon }) {
  return (
    <div className="group rounded-2xl bg-white/10 p-6 backdrop-blur border border-white/10 shadow-lg hover:shadow-xl transition hover:bg-white/15">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white text-blue-700 flex items-center justify-center shadow-md group-hover:scale-105 transition">
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="mt-3 text-white/80">{desc}</p>
    </div>
  );
}

function Stat({ k, v }) {
  return (
    <div className="rounded-2xl bg-white/10 backdrop-blur p-4 text-center border border-white/10">
      <div className="text-2xl font-extrabold">{k}</div>
      <div className="text-sm text-white/80">{v}</div>
    </div>
  );
}

/* Simple inline icons (no external libs) */
function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="mt-0.5 h-5 w-5 flex-shrink-0 fill-current text-emerald-300"
    >
      <path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2l2.1 5.8 5.9 2.1-5.9 2.1L12 18l-2.1-6-5.9-2.1 5.9-2.1z"
      />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2l8 4v6c0 5-3.5 9.7-8 10-4.5-.3-8-5-8-10V6l8-4z"
      />
    </svg>
  );
}
function WandIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M2 22l10-10 2 2L4 24 2 22zm12-12l2-2 2 2-2 2-2-2zm3-3l2-2 2 2-2 2-2-2z"
      />
    </svg>
  );
}
function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M10 3l10 10-7 7L3 10V3h7zm-1 4a2 2 0 110 4 2 2 0 010-4z"
      />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.7 0-8 1.3-8 4v2h10v-2c0-2.7-5.3-4-8-4zm8 0c-.5 0-1 .1-1.5.1 1.8 1 3.5 2.6 3.5 3.9V19h6v-2c0-2.7-5.3-4-8-4z"
      />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="currentColor"
        d="M12 2a10 10 0 100 20 10 10 0 000-20zm7.9 9h-3.2a16.6 16.6 0 00-1.5-5 8.02 8.02 0 014.7 5zM12 4c1.3 1.6 2.3 3.8 2.7 7H9.3c.4-3.2 1.4-5.4 2.7-7zM4.9 11A8.02 8.02 0 019.6 6c-.6 1.5-1 3.2-1.2 5H4.9zm0 2h3.5c.2 1.8.6 3.5 1.2 5A8.02 8.02 0 014.9 13zM12 20c-1.3-1.6-2.3-3.8-2.7-7h5.4c-.4 3.2-1.4 5.4-2.7 7zm3.9-2c.6-1.5 1-3.2 1.2-5h3.2a8.02 8.02 0 01-4.4 5z"
      />
    </svg>
  );
}
