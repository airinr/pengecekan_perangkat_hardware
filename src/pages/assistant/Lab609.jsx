/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import React from "react";
import { useNavigate } from "react-router-dom";

// === KONSTAN KODE ===
const LAB_CODE = "LAB00001"; // halaman ini khusus Lab 609
const PRAKTIKUM_CODE = {
  "/lab609_merakit_pc": "PRTK00001",
  "/lab609_bios_partisi": "PRTK00002",
  "/lab609_jarkom": "PRTK00003",
  "/lab609_troubleshooting": "PRTK00004",
};

const MENU_ITEMS = [
  {
    path: "/lab609_merakit_pc",
    title: "Praktikum Merakit Komputer",
    desc: "Lab 609",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden
      >
        <path d="M4 6.75A2.75 2.75 0 016.75 4h10.5A2.75 2.75 0 0120 6.75v6.5A2.75 2.75 0 0117.25 16H6.75A2.75 2.75 0 014 13.25v-6.5ZM5.5 18.25a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H6.25a.75.75 0 01-.75-.75Z" />
      </svg>
    ),
  },
  {
    path: "/lab609_bios_partisi",
    title: "Praktikum BIOS & Partisi",
    desc: "Lab 609",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden
      >
        <path d="M3 5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25v13.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75V5.25Zm3 2.25h12v9H6v-9Z" />
      </svg>
    ),
  },
  {
    path: "/lab609_jarkom",
    title: "Praktikum Jaringan Komputer",
    desc: "Lab 609",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden
      >
        <path d="M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm12 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM8 6h8M8 18h8M4 9v6M20 9v6" />
      </svg>
    ),
  },
  {
    path: "/lab609_troubleshooting",
    title: "Praktikum Troubleshooting",
    desc: "Lab 609",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="currentColor"
        aria-hidden
      >
        <path d="M11 2a1 1 0 0 1 2 0v2.07a8.001 8.001 0 0 1 6.93 6.93H22a1 1 0 1 1 0 2h-2.07a8.001 8.001 0 0 1-6.93 6.93V22a1 1 0 1 1-2 0v-2.07A8.001 8.001 0 0 1 4.07 13H2a1 1 0 1 1 0-2h2.07A8.001 8.001 0 0 1 11 4.07V2Z" />
      </svg>
    ),
  },
];

export default function Lab609() {
  const navigate = useNavigate();

  // builder path dengan query lab & kode
  const goNext = (basePath) => {
    if (!basePath) return;
    const kode = PRAKTIKUM_CODE[basePath] || "";
    const url = `${basePath}?lab=${encodeURIComponent(LAB_CODE)}${
      kode ? `&kode=${encodeURIComponent(kode)}` : ""
    }`;
    navigate(url);
  };

  return (
    <div className="mx-auto px-4 py-8 lg:ml-56">
      {/* Wrapper pembatas lebar konten */}
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Perangkat Laboratorium 609</h1>
        <p className="text-sm text-slate-300 mb-6">
          Kode Lab: <span className="font-semibold">Lab 609</span>. Pilih salah
          satu kategori di bawah untuk melanjutkan pengisian laporan.
        </p>

        {/* Grid tombol-kotak: 3 atas, 1 bawah */}
        <div
          role="group"
          aria-label="Pilih kategori laporan"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4"
        >
          {MENU_ITEMS.map((item, i) => {
            const isLast = i === MENU_ITEMS.length - 1;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => goNext(item.path)}
                className={`group relative w-full rounded-xl border border-white/10 bg-slate-900/60 p-4 text-left text-white shadow-md transition
                            hover:bg-slate-800/70 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 h-full
                            ${isLast ? "lg:col-span-3 max-w-3xl mx-auto" : ""}`}
                aria-label={`Buka ${item.title}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-blue-300 group-hover:text-blue-200">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold">{item.title}</h3>
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 opacity-70 transition group-hover:translate-x-0.5"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M13.5 4.5a1 1 0 011.7-.7l6 6a1 1 0 010 1.4l-6 6a1 1 0 01-1.4-1.4L18.59 12l-5.29-5.3a1 1 0 01-.3-.7zM3 12a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                      </svg>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{item.desc}</p>
                    <div className="mt-3 inline-flex items-center rounded-md bg-blue-600/20 px-2 py-1 text-[11px] font-medium text-blue-200 ring-1 ring-inset ring-blue-400/30">
                      Klik untuk melakukan pelaporan
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
