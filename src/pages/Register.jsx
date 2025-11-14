/* eslint-disable no-empty */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo_unikom.ico";

export default function Register() {
  const [nim, setNim] = useState("");
  const [email, setEmail] = useState("");
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // === NEW: popup sukses ===
  const [showSuccess, setShowSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nama, nim, password }),
      });

      if (!res.ok) {
        // coba ambil pesan backend → terjemahkan singkat
        let msg = "Register gagal.";
        try {
          const j = await res.json();
          if (j?.message) msg = j.message;
        } catch {}
        throw new Error(msg);
      }

      // === NEW: Tampilkan popup sukses ===
      setShowSuccess(true);

      // Optional: bersihkan form
      setNim("");
      setEmail("");
      setNama("");
      setPassword("");
    } catch (err) {
      setError(
        err?.message?.toLowerCase().includes("nim")
          ? "Register gagal: NIM tidak valid atau sudah terdaftar."
          : err?.message?.toLowerCase().includes("email")
          ? "Register gagal: Email tidak valid atau sudah terdaftar."
          : "Register gagal. Silakan periksa data Anda dan coba lagi."
      );
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-700 grid place-items-center px-4 sm:px-6 p-10 overflow-y-auto">
      <main className="w-full max-w-md max-h-[90svh]">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-8">
          <div className="rounded-2xl p-5 sm:p-8 mx-5">
            <img
              src={logo}
              alt="UNIKOM"
              className="mx-auto h-12 w-12 flex items-center justify-center"
            />
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-blue-700 flex items-center justify-center">
              Register
            </h2>
            <p className="text-xs text-black flex items-center justify-center">
              Silahkan buat akun anda
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NIM */}
            <div>
              <label
                htmlFor="nim"
                className="block text-sm font-medium text-gray-700"
              >
                NIM
              </label>
              <input
                id="nim"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 shadow-sm"
                placeholder="Contoh: 1012345678"
              />
            </div>

            {/* Nama */}
            <div>
              <label
                htmlFor="nama"
                className="block text-sm font-medium text-gray-700"
              >
                Nama
              </label>
              <input
                id="nama"
                type="text"
                autoComplete="name"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 shadow-sm"
                placeholder="Nama lengkap"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 shadow-sm"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pr-10 shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-2 my-auto grid place-items-center p-0 bg-transparent text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-0"
                  tabIndex={0}
                >
                  {showPwd ? (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6" />
                      <path d="M9.9 4.2A10.4 10.4 0 0121 12a10.6 10.6 0 01-3.2 3.7M6.5 6.5A10.5 10.5 0 003 12c1.7 3.8 5.4 6.5 9 6.5 1.2 0 2.4-.3 3.5-.8" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading && (
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              )}
              {loading ? "Register..." : "Register"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Login
              </Link>
            </p>
            <div className="mt-3">
              <Link
                to="/"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-white/80 text-[11px] sm:text-xs px-2">
          AP2SC UNIKOM
        </p>
      </main>

      {/* === NEW: POPUP SUKSES REGISTER === */}
      {showSuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-success-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 text-green-700 grid place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3
                id="register-success-title"
                className="text-lg font-semibold text-gray-900"
              >
                Registrasi Berhasil
              </h3>
            </div>

            <p className="mt-3 text-sm text-gray-700">
              Sudah register, mohon tunggu akun anda diaktifkan oleh admin.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false);
                  // Arahkan ke login
                  navigate("/login", { replace: true });
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
