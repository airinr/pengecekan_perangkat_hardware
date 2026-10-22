import React, { useState, useEffect } from "react";
import ap2scLogo from "@/assets/images/ap2sc.jpg";

export default function FloatingPwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah berjalan sebagai PWA standalone
    const standaloneCheck =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (standaloneCheck) {
      setIsStandalone(true);
      return;
    }

    // 2. Deteksi perangkat iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(ua) &&
      !window.MSStream &&
      !standaloneCheck;
    setIsIos(isIosDevice);

    // 3. Tangkap event beforeinstallprompt (Chromium / Android / Desktop)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Cek status dismiss dari sessionStorage jika ada
    if (sessionStorage.getItem("pwa_floating_dismissed") === "true") {
      setIsMinimized(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Jika sudah terpasang, tidak perlu menampilkan widget
  if (isStandalone) return null;

  // Jika tidak ada prompt di Chromium dan bukan iOS, jangan tampilkan jika tidak didukung
  const canInstall = Boolean(deferredPrompt) || isIos;
  if (!canInstall) return null;

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setIsMinimized(true);
    sessionStorage.setItem("pwa_floating_dismissed", "true");
  };

  // Tampilan minimized (floating action button kecil)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={() => {
            setIsMinimized(false);
            sessionStorage.removeItem("pwa_floating_dismissed");
          }}
          title="Pasang Aplikasi AP2SC"
          aria-label="Pasang Aplikasi AP2SC"
          className="group relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white shadow-xl border border-slate-200/90 hover:scale-105 active:scale-95 transition p-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <img
            src={ap2scLogo}
            alt="AP2SC"
            className="w-full h-full object-cover rounded-xl"
          />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-600 text-white text-[9px] font-bold items-center justify-center">
              ↓
            </span>
          </span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Floating Card */}
      <aside
        aria-label="Promosi Instalasi Aplikasi"
        className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-40 bg-white/95 backdrop-blur-md text-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300"
      >
        <div className="flex items-center gap-3">
          {/* Logo AP2SC */}
          <div className="w-11 h-11 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
            <img
              src={ap2scLogo}
              alt="AP2SC Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Info Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                AP2SC Hardware
              </h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 shrink-0">
                PWA
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
              Pasang ke layar utama untuk akses cepat
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Tutup saran instalasi"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus:outline-none"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Petunjuk Instalasi Khusus iOS Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <img
                  src={ap2scLogo}
                  alt="AP2SC"
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <h3 className="text-sm font-bold text-slate-900">
                  Pasang di iPhone / iPad
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-xs text-slate-600">
              <p className="font-medium text-slate-700">
                Ikuti 2 langkah mudah ini di Safari:
              </p>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <div>
                  Ketuk tombol <strong>Bagikan</strong> (ikon kotak dengan panah ke atas) di bilah bawah peramban.
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <div>
                  Gulir ke bawah dan pilih{" "}
                  <strong className="text-blue-700">
                    &quot;Tambah ke Layar Utama&quot; (Add to Home Screen)
                  </strong>
                  .
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2 px-4 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
