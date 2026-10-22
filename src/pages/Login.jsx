/* eslint-disable no-empty */
import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "../contexts/RoleContext";
import logo from "../assets/images/ap2sc.jpg";
import { showErrorAlert, Toast } from "@/lib/swal";

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

  // Field refs untuk deteksi langsung DOM value (mengatasi bug browser autofill)
  const nimInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine ?? true);

  // Validasi required & format field (touched)
  const [touched, setTouched] = useState({
    nim: false,
    password: false,
  });

  // Validasi real-time
  const isNim8Digit = /^\d{8}$/.test(nim);
  const nimError = touched.nim && nim.trim() === "" ? "NIM wajib diisi." : "";
  const nimFormatError =
    touched.nim && nim.trim() !== "" && !isNim8Digit
      ? "NIM harus berupa 8 digit angka."
      : "";
  const pwdError =
    touched.password && password.trim() === "" ? "Password wajib diisi." : "";

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

  // ✅ Mapping pesan backend -> pesan Indonesia yang lebih rapi
  const mapErrorMessage = (msg) => {
    const raw = String(msg || "").trim();
    const m = raw.toLowerCase();

    if (m.includes("user not found")) return "Pengguna Tidak Ditemukan";
    if (m.includes("invalid credentials")) return "NIM atau password salah";
    if (m.includes("password")) return "Password salah";

    return raw;
  };

  // ✅ SINKRONISASI AUTOFILL:
  // Browser autofill sering mengisi DOM input tanpa memicu SyntheticEvent React.
  // Fungsi ini membaca langsung DOM input dan menyelaraskannya ke React state.
  const syncAutofillValues = () => {
    if (nimInputRef.current) {
      const domNim = (nimInputRef.current.value || "").trim();
      if (domNim) {
        const cleanDigits = domNim.replace(/\D/g, "").slice(0, 8);
        setNim((prev) => (prev !== cleanDigits ? cleanDigits : prev));
      }
    }
    if (passwordInputRef.current) {
      const domPwd = passwordInputRef.current.value || "";
      if (domPwd) {
        setPassword((prev) => (prev !== domPwd ? domPwd : prev));
      }
    }
  };

  // Handler onAnimationStart yang terpanggil saat pseudo-class :-webkit-autofill aktif
  const handleAutoFillAnimation = (e) => {
    if (e.animationName === "onAutoFillStart") {
      syncAutofillValues();
    }
  };

  // Event listener untuk online/offline & autofill synchronization
  useEffect(() => {
    syncAutofillValues();
    const timers = [100, 300, 600, 1200].map((ms) =>
      setTimeout(syncAutofillValues, ms)
    );

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡️ SOLUSI UTAMA BUG AUTOFILL:
    // Baca nilai live dari DOM element (ref / target elements) sebelum validasi
    const form = e.currentTarget;
    const rawNim = (
      nimInputRef.current?.value ||
      form.elements?.nim?.value ||
      form.elements?.username?.value ||
      nim ||
      ""
    ).trim();

    const rawPassword = (
      passwordInputRef.current?.value ||
      form.elements?.password?.value ||
      password ||
      ""
    );

    const cleanNim = rawNim.replace(/\D/g, "").slice(0, 8);

    // Pastikan state React ikut ter-update
    if (cleanNim !== nim) setNim(cleanNim);
    if (rawPassword !== password) setPassword(rawPassword);

    // Validasi field
    const nimEmpty = cleanNim.length === 0;
    const pwdEmpty = rawPassword.trim() === "";

    if (nimEmpty || pwdEmpty) {
      setTouched({ nim: true, password: true });
      return;
    }

    // NIM harus tepat 8 digit angka
    if (!/^\d{8}$/.test(cleanNim)) {
      setTouched((t) => ({ ...t, nim: true }));
      return;
    }

    if (!API_BASE) {
      showErrorAlert(
        "Konfigurasi API Belum Diatur",
        "Set VITE_API_URL di environment (misal .env) agar login ke server bisa berjalan."
      );
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
        body: JSON.stringify({ nim: cleanNim, password: rawPassword }),
        signal: controller.signal,
      }).catch((err) => {
        throw err.name === "AbortError"
          ? new Error("Permintaan timeout (15 detik). Silakan coba lagi.")
          : err;
      });

      const loginRaw = await loginRes
        .clone()
        .text()
        .catch(() => "");

      // Jika login gagal, tampilkan pesan error dari server
      if (!loginRes.ok) {
        const backendMsg = pickBackendMessage(loginRaw);
        showErrorAlert(
          "Login Gagal",
          mapErrorMessage(backendMsg) ||
            "Login gagal. Periksa NIM dan password Anda."
        );
        return;
      }

      // Parse JSON login data
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
        showErrorAlert(
          "Login Gagal",
          "Token tidak ditemukan pada respons server."
        );
        return;
      }

      localStorage.setItem("token", token);
      if (userObj && Object.keys(userObj).length) {
        localStorage.setItem("user", JSON.stringify(userObj));
      }

      // 2) AMBIL ROLE PENGGUNA
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

      if (!roleRes.ok) {
        const backendMsg = pickBackendMessage(roleBody);
        showErrorAlert(
          "Gagal Mengambil Role",
          mapErrorMessage(backendMsg) || "Gagal mengambil role dari server."
        );
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
        showErrorAlert(
          "Gagal Mengambil Role",
          "Server tidak mengembalikan role yang valid."
        );
        return;
      }

      const userRole = mapRole(rawRole);
      localStorage.setItem("role", userRole);
      setRole(userRole);
      Toast.fire({ icon: "success", title: "Login Berhasil" });
      goToDashboardByRole(userRole);
    } catch (err) {
      showErrorAlert(
        "Login Gagal",
        err?.message || "Terjadi kesalahan saat login. Coba lagi."
      );
      console.error("Login Error:", err);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden">
      {/* Background Ambience: UNIKOM Deep Blue Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 opacity-90 pointer-events-none" />
      <div className="absolute top-0 -left-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="relative z-20 bg-amber-500 text-slate-950 text-xs sm:text-sm font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010 5.656m-7.072-7.072a9 9 0 000 12.728m3.536-3.536a4 4 0 000 5.656M12 12v.01" />
          </svg>
          Perangkat sedang offline. Beberapa fitur login membutuhkan koneksi internet.
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <main className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 p-6 sm:p-8 transition-all">
            {/* Header: Logo & Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm mb-3">
                <img
                  src={logo}
                  alt="Logo AP2SC"
                  className="h-14 w-14 object-cover rounded-xl"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                AP2SC Hardware
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sistem Pengecekan Perangkat Laboratorium
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Field NIM */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="nim"
                    className="block text-xs sm:text-sm font-semibold text-slate-700"
                  >
                    NIM (Nomor Induk Mahasiswa)
                  </label>
                  <span
                    className={`text-[11px] font-medium transition ${
                      nim.length === 8
                        ? "text-emerald-600 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    {nim.length}/8 digit
                  </span>
                </div>

                <div className="relative">
                  {/* Left Icon: User / ID Card */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>

                  <input
                    ref={nimInputRef}
                    id="nim"
                    name="username"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    value={nim}
                    onAnimationStart={handleAutoFillAnimation}
                    onInput={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setNim(onlyDigits);
                      if (!touched.nim) setTouched((t) => ({ ...t, nim: true }));
                    }}
                    onChange={(e) => {
                      const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 8);
                      setNim(onlyDigits);
                      if (!touched.nim) setTouched((t) => ({ ...t, nim: true }));
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, nim: true }))}
                    maxLength={8}
                    required
                    aria-invalid={Boolean(nimError || nimFormatError)}
                    aria-describedby={
                      nimError || nimFormatError ? "nim-error" : undefined
                    }
                    className={`w-full rounded-xl border bg-slate-50/50 text-slate-900 text-sm pl-11 pr-10 py-3 transition focus:bg-white focus:outline-none focus:ring-2 ${
                      nimError || nimFormatError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                    placeholder="Contoh: 10121001"
                  />

                  {/* Tombol Clear cepat saat input terisi */}
                  {nim && !loading && (
                    <button
                      type="button"
                      onClick={() => {
                        setNim("");
                        if (nimInputRef.current) nimInputRef.current.value = "";
                        setTouched((t) => ({ ...t, nim: false }));
                      }}
                      tabIndex={-1}
                      aria-label="Bersihkan NIM"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Pesan Error NIM */}
                {(nimError || nimFormatError) && (
                  <p
                    id="nim-error"
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {nimError || nimFormatError}
                  </p>
                )}
              </div>

              {/* Field Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  {/* Left Icon: Lock */}
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>

                  <input
                    ref={passwordInputRef}
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onAnimationStart={handleAutoFillAnimation}
                    onInput={(e) => {
                      setPassword(e.target.value);
                      if (!touched.password)
                        setTouched((t) => ({ ...t, password: true }));
                    }}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!touched.password)
                        setTouched((t) => ({ ...t, password: true }));
                    }}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    required
                    aria-invalid={Boolean(pwdError)}
                    aria-describedby={pwdError ? "password-error" : undefined}
                    className={`w-full rounded-xl border bg-slate-50/50 text-slate-900 text-sm pl-11 pr-12 py-3 transition focus:bg-white focus:outline-none focus:ring-2 ${
                      pwdError
                        ? "border-red-400 focus:border-red-500 focus:ring-red-200"
                        : "border-slate-300 focus:border-blue-600 focus:ring-blue-100"
                    }`}
                    placeholder="Masukkan password akun"
                  />

                  {/* Toggle Show/Hide Password */}
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? "Sembunyikan password" : "Lihat password"}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
                  >
                    {showPwd ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Pesan Error Password */}
                {pwdError && (
                  <p
                    id="password-error"
                    className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {pwdError}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition active:scale-[0.99] focus:outline-none focus:ring-4 focus:ring-blue-500/25 cursor-pointer text-sm sm:text-base"
                >
                  {loading && (
                    <svg
                      className="h-5 w-5 animate-spin text-white"
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
                  {loading ? "Memproses Login..." : "Masuk ke Sistem"}
                </button>
              </div>
            </form>

            {/* Links Section */}
            <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-3">
              <p className="text-xs sm:text-sm text-slate-600">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-bold text-blue-600 hover:text-blue-700 transition underline underline-offset-4"
                >
                  Registrasi Asisten
                </Link>
              </p>

              <div>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>

          {/* Footer Subtext */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Laboratorium Hardware Komputer &bull; AP2SC UNIKOM
            </p>
          </div>
        </main>
      </div>

      {/* Bottom Spacer for Mobile Safe Area */}
      <div className="h-4 pointer-events-none" />
    </div>
  );
}
