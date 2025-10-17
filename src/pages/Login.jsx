/* eslint-disable no-empty */
/* eslint-disable no-undef */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import logo from "../assets/images/logo_unikom.ico";

export default function Login() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // === MAP role backend -> role internal (konsisten di app) ===
  // eslint-disable-next-line no-unused-vars
  function mapRole(raw) {
    const code = String(raw || "")
      .trim()
      .toUpperCase();
    if (code === "ADM" || code === "ADMIN") return "admin";
    if (code === "AST" || code === "ASISTEN" || code === "ASSISTANT")
      return "asisten";
    return "asisten"; // fallback aman
  }

  // Redirect berdasarkan role internal
  const goToDashboardByRole = (role) => {
    if (role === "admin") navigate("/dashboard_admin", { replace: true });
    else if (role === "asisten")
      navigate("/dashboard_asisten", { replace: true });
    else navigate("/", { replace: true });
  };

  // Helper aman untuk baca JSON (kalau server balas HTML/teks, errornya jelas)
  async function parseJsonSafe(res) {
    const ct = res.headers.get("content-type") || "";
    const text = await res.text(); // ambil mentah
    if (ct.includes("application/json")) {
      try {
        return JSON.parse(text);
      } catch {}
    }
    throw new Error(
      `Unexpected response (${res.status} ${res.statusText}). ${text.slice(
        0,
        200
      )}`
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "";
      const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

      // 1) LOGIN
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ nim, password }),
      });

      if (!res.ok) {
        const msgRaw = await res.text().catch(() => "");
        let msg = "Login gagal";
        try {
          const j = JSON.parse(msgRaw);
          msg = j?.message || msg;
        } catch {
          if (msgRaw) msg = `${msg}: ${msgRaw.slice(0, 200)}`;
        }
        throw new Error(msg);
      }

      const data = await parseJsonSafe(res);

      // Ambil token & user (sesuaikan nama field dgn backend)
      const token =
        data?.token || data?.accessToken || data?.data?.token || data?.jwt;
      const userObj = data?.user || data?.data?.user || {};

      if (token) localStorage.setItem("token", token);
      if (userObj && Object.keys(userObj).length) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // 2) GET ROLE
      const roleRes = await fetch(`${API_BASE}/role/getRole`, {
        method: "GET",
        headers: {
          Accept: "text/plain, application/json;q=0.9",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!roleRes.ok) {
        const msgRaw = await roleRes.text().catch(() => "");
        let msg = "Gagal mengambil role";
        try {
          const j = JSON.parse(msgRaw);
          msg = j?.message || msg;
        } catch {
          if (msgRaw) msg = `${msg}: ${msgRaw.slice(0, 200)}`;
        }
        throw new Error(msg);
      }

      // ==== PARSE ROLE FLEXIBEL (text/plain atau JSON) ====
      const ct = roleRes.headers.get("content-type") || "";
      const bodyText = await roleRes.text();
      let rawRole = "";

      if (ct.includes("application/json")) {
        try {
          const parsed = JSON.parse(bodyText);
          if (typeof parsed === "string") {
            rawRole = parsed;
          } else {
            rawRole =
              parsed?.role ||
              parsed?.data?.role ||
              parsed?.user?.role ||
              parsed?.roleCode ||
              (Array.isArray(parsed?.roles) ? parsed.roles[0] : "") ||
              parsed?.level ||
              parsed?.userType ||
              "";
          }
        } catch {
          rawRole = bodyText;
        }
      } else {
        rawRole = bodyText;
      }

      rawRole = String(rawRole)
        .trim()
        .replace(/^"+|"+$/g, "");

      if (!rawRole)
        throw new Error("Server tidak mengembalikan role yang valid.");

      function mapRoleLocal(r) {
        const code = String(r || "")
          .trim()
          .toUpperCase();
        if (code === "ADM" || code === "ADMIN") return "admin";
        if (code === "AST" || code === "ASISTEN" || code === "ASSISTANT")
          return "asisten";
        return "asisten";
      }

      const userRole = mapRoleLocal(rawRole);

      localStorage.setItem("role", userRole);
      setRole(userRole);
      goToDashboardByRole(userRole);
    } catch (err) {
      setError(err?.message || "Terjadi kesalahan.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-700 grid place-items-center px-4 sm:px-6 p-10 overflow-y-auto">
      <main className="w-full max-w-md max-h-[90svh]">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-5 sm:p-8">
          <div className="rounded-2xl p-5 sm:p-8 mx-5">
            <img src={logo} alt="Logo" className="mx-auto h-12 w-12" />
            <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-blue-700 text-center">
              Login
            </h2>
            <p className="text-xs text-black text-center">
              Silahkan gunakan akun yang sudah terdaftar.
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
                Nim
              </label>
              <input
                id="nim"
                type="text"
                value={nim}
                onChange={(e) => setNim(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 shadow-sm"
                placeholder="xxxxxxx"
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
                  autoComplete="current-password"
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
              {/* Bagian "Remember me" dan "Forgot password" telah dihapus */}
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              )}
              {loading ? "Login..." : "Login"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Register
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
    </div>
  );
}
