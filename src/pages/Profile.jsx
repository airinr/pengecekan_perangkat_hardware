/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";

const API_BASE = import.meta.env.VITE_API_URL || "";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

// --- Helpers untuk ambil token ---
function getToken() {
  const raw =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("Authorization");
  if (!raw) return null;
  let s = raw;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "string") s = parsed;
  } catch (_) {}
  s = String(s)
    .replace(/^"+|"+$/g, "")
    .trim();
  // HILANGKAN prefix "Bearer " jika sudah ada agar tidak double
  if (s.toLowerCase().startsWith("bearer ")) s = s.slice(7).trim();
  return s || null;
}

// Map idRole backend -> role internal
function mapRole(r) {
  const code = String(r || "")
    .trim()
    .toUpperCase();
  if (code === "ADM" || code === "ADMIN") return "admin";
  if (code === "AST" || code === "ASISTEN" || code === "ASSISTANT")
    return "asisten";
  return "asisten"; // fallback aman
}

export default function Profile() {
  const navigate = useNavigate();
  const { role, setRole } = useRole();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false); // <-- dikembalikan

  const onLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("Authorization");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    sessionStorage.clear();
    setRole(null);
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = getToken();
        if (!token) {
          onLogout();
          return;
        }
        const res = await fetch(`${API_BASE}/auth/infoProfile`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`, // <-- sekarang pasti single "Bearer "
            ...NGROK_HEADERS,
          },
          // jika backend pakai cookie juga, aktifkan:
          // credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            // token invalid/expired/role tak cocok → logout aman
            onLogout();
            return;
          }
          const txt = await res.text().catch(() => "");
          throw new Error(txt || `Gagal memuat profil (${res.status})`);
        }

        const json = await res.json();
        const d = json?.data || {};

        const mappedUser = {
          nim: d?.nim ?? "-",
          name: d?.nama ?? d?.name ?? d?.username ?? "User",
          email: d?.email ?? "-",
          role: mapRole(d?.idRole ?? d?.role),
          idRole: d?.idRole ?? null,
        };

        if (!alive) return;
        setUser(mappedUser);
        localStorage.setItem("user", JSON.stringify(mappedUser));
        localStorage.setItem("role", mappedUser.role);
        setRole(mappedUser.role);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Gagal memuat profil.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = user?.name || "User";
  const email = user?.email || "-";
  const nim = user?.nim || "-";
  const currentRole = user?.role || role || "-";
  const initial = String(displayName).charAt(0).toUpperCase();

  return (
    <div className="w-screen min-h-screen bg-black text-slate-100 lg:ml-52">
      <div className="fixed inset-0 -z-10 bg-black" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-r from-blue-600/30 via-indigo-600/20 to-cyan-500/10" />

      <section className="w-screen px-4 sm:px-6 lg:px-8 py-6">
        <div className="w-full rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 md:p-8 shadow-xl">
          {loading && (
            <div className="mb-4 text-sm text-slate-300">Memuat profil…</div>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 md:h-20 md:w-20 grid place-items-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-2xl font-bold">
                  {initial}
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-slate-900 grid place-items-center text-[10px] font-bold">
                  ✓
                </span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                  {displayName}
                </h1>
                <p className="text-sm text-slate-300">{email}</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-inset ring-blue-500/30">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5Z" />
              </svg>
              {currentRole}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 p-4 bg-slate-900/80">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Nama
              </div>
              <div className="mt-1 text-sm">{displayName}</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-slate-900/80">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                NIM
              </div>
              <div className="mt-1 text-sm">{nim}</div>
            </div>
            <div className="rounded-xl border border-white/10 p-4 bg-slate-900/80">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Email
              </div>
              <div className="mt-1 text-sm break-all">{email}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {/* <button
              type="button"
              onClick={() => navigate("/profile/edit")}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-slate-900"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
              </svg>
              Edit Profile
            </button> */}
            <button
              type="button"
              onClick={() => setShowConfirm(true)} // <-- sudah aman
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18" />
                <path d="M8 6v14a2 2 0 002 2h4a2 2 0 002-2V6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6l1-3h4l1 3" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </section>

      <div className="w-screen px-4 sm:px-6 lg:px-8 pb-10">
        <p className="mt-6 text-center text-white/60 text-xs">AP2SC UNIKOM</p>
      </div>

      {/* Modal konfirmasi logout */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-600/20 text-red-400 grid place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 8v4" />
                  <path d="M12 16h.01" />
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold">Konfirmasi Logout</h3>
                <p className="mt-1 text-sm text-slate-300">
                  Kamu yakin ingin keluar dari akun ini?
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium ring-1 ring-white/10 hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl px-4 py-2 text-sm font-semibold bg-red-600 hover:bg-red-700 text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
