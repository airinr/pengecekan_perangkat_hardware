/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* eslint-disable no-undef */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import logo from "../assets/images/logo_unikom.ico";

/** ====
terjemahkan ====== Popup Komponen (TANPA detail teknis) ========== */
function ErrorPopup({ open, title, message, onClose }) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => closeBtnRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      aria-describedby="popup-desc"
      onClick={onClose}
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-red-100 text-red-600 grid place-items-center">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v5M12 16h.01" />
            </svg>
          </div>
          <h3
            id="popup-title"
            className="text-base font-semibold text-gray-800"
          >
            {title || "Terjadi Kesalahan"}
          </h3>
        </div>

        <div className="px-5 pt-4 pb-2">
          <p id="popup-desc" className="text-sm text-gray-700">
            {message || "Maaf, ada kendala saat memproses permintaan Anda."}
          </p>
        </div>

        <div className="px-5 pb-4 pt-2 flex justify-end gap-2">
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

/** ========== Util: map role backend -> FE ========== */
function mapRole(raw) {
  const code = String(raw || "")
    .trim()
    .toUpperCase();
  if (code === "ADM" || code === "ADMIN") return "admin";
  if (code === "AST" || code === "ASISTEN" || code === "ASSISTANT")
    return "asisten";
  return "asisten"; // fallback aman
}

/** ========== Util: parse JSON aman ========== */
async function parseJsonSafe(res) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
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

export default function Login() {
  const navigate = useNavigate();
  const { setRole } = useRole();

  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW: validasi required field (touched)
  const [touched, setTouched] = useState({
    nim: false,
    password: false,
  });

  const nimError = touched.nim && nim.trim() === "" ? "NIM harus diisi." : "";
  const pwdError =
    touched.password && password.trim() === "" ? "Password harus diisi." : "";

  // ✅ NEW: Validasi NIM 8 digit angka
  const isNim8Digit = /^\d{8}$/.test(nim);
  const nimFormatError =
    touched.nim && nim.trim() !== "" && !isNim8Digit
      ? "NIM harus terdiri dari 8 digit angka."
      : "";

  // ✅ popup hanya title + message
  const [popup, setPopup] = useState({
    open: false,
    title: "",
    message: "",
  });

  // === KONFIG API ===
  const API_BASE = import.meta.env.VITE_API_URL || "";
  const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" };

  const goToDashboardByRole = (role) => {
    if (role === "admin") navigate("/dashboard_admin", { replace: true });
    else if (role === "asisten")
      navigate("/dashboard_asisten", { replace: true });
    else navigate("/", { replace: true });
  };

  // ✅ Ambil pesan backend (JSON {message} atau text biasa)
  const pickBackendMessage = (rawText) => {
    const t = String(rawText || "").trim();
    if (!t) return "";
    try {
      const j = JSON.parse(t);
      if (typeof j === "string") return j;
      return (
        j?.message ||
        j?.error ||
        j?.msg ||
        j?.data?.message ||
        j?.data?.error ||
        ""
      );
    } catch {
      return t;
    }
  };

  // ✅ NEW: Mapping pesan backend -> pesan Indonesia yang lebih rapi
  const mapErrorMessage = (msg) => {
    const raw = String(msg || "").trim();
    const m = raw.toLowerCase();

    if (m.includes("user not found")) return "Pengguna Tidak Ditemukan";

    // optional tambahan (boleh hapus kalau tidak perlu)
    if (m.includes("invalid credentials")) return "NIM atau password salah";
    if (m.includes("password")) return "Password salah";

    return raw;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ required field check
    const nimEmpty = nim.trim() === "";
    const pwdEmpty = password.trim() === "";
    if (nimEmpty || pwdEmpty) {
      setTouched({ nim: true, password: true });
      return;
    }

    // ✅ NEW: NIM harus 8 digit angka
    if (!/^\d{8}$/.test(nim)) {
      setTouched((t) => ({ ...t, nim: true }));
      return;
    }

    if (!API_BASE) {
      setPopup({
        open: true,
        title: "Konfigurasi API Belum Diatur",
        message:
          "Set VITE_API_URL di environment (misal .env) agar login ke server bisa berjalan.",
      });
      return;
    }

    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      // 1) LOGIN
      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...NGROK_HEADERS,
        },
        body: JSON.stringify({ nim, password }),
        signal: controller.signal,
      }).catch((e) => {
        throw e.name === "AbortError"
          ? new Error("Permintaan timeout. Coba lagi.")
          : e;
      });

      const loginRaw = await loginRes
        .clone()
        .text()
        .catch(() => "");

      // ✅ kalau gagal, tampilkan pesan backend yang sudah dimapping
      if (!loginRes.ok) {
        const backendMsg = pickBackendMessage(loginRaw);
        setPopup({
          open: true,
          title: "Login Gagal",
          message:
            mapErrorMessage(backendMsg) ||
            "Login gagal. Periksa NIM dan password.",
        });
        return;
      }

      // parse json login
      let loginData = {};
      try {
        loginData = JSON.parse(loginRaw);
      } catch {
        loginData = await parseJsonSafe(loginRes);
      }

      const token =
        loginData?.token ||
        loginData?.accessToken ||
        loginData?.data?.token ||
        loginData?.jwt;
      const userObj =
        loginData?.user || loginData?.data?.user || loginData?.profile || {};

      if (!token) {
        setPopup({
          open: true,
          title: "Login Gagal",
          message: "Token tidak ditemukan pada respons login.",
        });
        return;
      }

      localStorage.setItem("token", token);
      if (userObj && Object.keys(userObj).length) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // 2) AMBIL ROLE
      const roleRes = await fetch(`${API_BASE}/role/getRole`, {
        method: "GET",
        headers: {
          Accept: "text/plain, application/json;q=0.9",
          Authorization: `Bearer ${token}`,
          ...NGROK_HEADERS,
        },
        signal: controller.signal,
      });

      const roleBody = await roleRes
        .clone()
        .text()
        .catch(() => "");

      // ✅ kalau gagal ambil role, tampilkan pesan backend yang sudah dimapping
      if (!roleRes.ok) {
        const backendMsg = pickBackendMessage(roleBody);
        setPopup({
          open: true,
          title: "Gagal Mengambil Role",
          message:
            mapErrorMessage(backendMsg) || "Gagal mengambil role dari server.",
        });
        return;
      }

      const ct = roleRes.headers.get("content-type") || "";
      let rawRole = "";

      if (ct.includes("application/json")) {
        try {
          const parsed = JSON.parse(roleBody);
          rawRole =
            typeof parsed === "string"
              ? parsed
              : parsed?.role ||
                parsed?.data?.role ||
                parsed?.user?.role ||
                parsed?.roleCode ||
                (Array.isArray(parsed?.roles) ? parsed.roles[0] : "") ||
                parsed?.level ||
                parsed?.userType ||
                "";
        } catch {
          rawRole = roleBody;
        }
      } else {
        rawRole = roleBody;
      }

      rawRole = String(rawRole)
        .trim()
        .replace(/^"+|"+$/g, "");

      if (!rawRole) {
        setPopup({
          open: true,
          title: "Gagal Mengambil Role",
          message: "Server tidak mengembalikan role yang valid.",
        });
        return;
      }

      const userRole = mapRole(rawRole);
      localStorage.setItem("role", userRole);
      setRole(userRole);
      goToDashboardByRole(userRole);
    } catch (err) {
      setPopup({
        open: true,
        title: "Login Gagal",
        message: err?.message || "Terjadi kesalahan saat login. Coba lagi.",
      });
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-0 bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-700 grid place-items-center px-4 sm:px-6 p-10 overflow-y-auto">
      {/* POPUP ERROR */}
      <ErrorPopup
        open={popup.open}
        title={popup.title}
        message={popup.message}
        onClose={() => setPopup((p) => ({ ...p, open: false }))}
      />

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
                inputMode="numeric"
                pattern="[0-9]*"
                value={nim}
                onChange={(e) => {
                  // ✅ hanya angka + max 8 digit
                  const onlyDigits = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 8);
                  setNim(onlyDigits);
                  if (!touched.nim) setTouched((t) => ({ ...t, nim: true }));
                }}
                onBlur={() => setTouched((t) => ({ ...t, nim: true }))}
                maxLength={8}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 shadow-sm"
                placeholder="Masukkan NIM (8 digit)"
              />
              {(nimError || nimFormatError) && (
                <p className="mt-1 text-xs text-red-600">
                  {nimError || nimFormatError}
                </p>
              )}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!touched.password)
                      setTouched((t) => ({ ...t, password: true }));
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  required
                  className="block w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 pr-10 shadow-sm"
                  placeholder="Masukkan password"
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
              {pwdError && (
                <p className="mt-1 text-xs text-red-600">{pwdError}</p>
              )}
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
