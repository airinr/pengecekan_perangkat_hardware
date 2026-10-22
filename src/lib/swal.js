import Swal from "sweetalert2";

// Base styling matching project theme (Slate 900 / dark mode)
const swalCustomTheme = {
  background: "#0f172a", // slate-900
  color: "#f8fafc", // slate-50
  backdrop: "rgba(0, 0, 0, 0.75)",
  customClass: {
    popup: "rounded-2xl border border-white/10 shadow-2xl",
    title: "text-lg sm:text-xl font-bold text-white",
    htmlContainer: "text-xs sm:text-sm text-slate-300 leading-relaxed",
    confirmButton:
      "rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition",
    cancelButton:
      "rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 active:scale-95 transition",
  },
};

/**
 * Toast Notification (Pojok Kanan Atas)
 */
export const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: "#0f172a",
  color: "#f8fafc",
  customClass: {
    popup: "rounded-xl border border-white/10 shadow-xl",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

/**
 * Modal Alert Sukses
 */
export const showSuccessAlert = (title = "Berhasil!", text = "") => {
  return Swal.fire({
    ...swalCustomTheme,
    icon: "success",
    title,
    text,
    confirmButtonColor: "#2563eb", // blue-600
    confirmButtonText: "Selesai",
  });
};

/**
 * Modal Alert Kesalahan / Validasi
 */
export const showErrorAlert = (title = "Terjadi Kesalahan", text = "") => {
  return Swal.fire({
    ...swalCustomTheme,
    icon: "error",
    title,
    text,
    confirmButtonColor: "#e11d48", // rose-600
    confirmButtonText: "Saya Mengerti",
  });
};

/**
 * Modal Alert Peringatan
 */
export const showWarningAlert = (title = "Peringatan", text = "") => {
  return Swal.fire({
    ...swalCustomTheme,
    icon: "warning",
    title,
    text,
    confirmButtonColor: "#d97706", // amber-600
    confirmButtonText: "Mengerti",
  });
};

/**
 * Modal Konfirmasi Interaktif (Pengganti window.confirm)
 */
export const showConfirmDialog = async ({
  title = "Apakah Anda Yakin?",
  text = "Tindakan ini tidak dapat dibatalkan.",
  confirmButtonText = "Ya, Lanjutkan",
  cancelButtonText = "Batal",
  icon = "warning",
} = {}) => {
  const result = await Swal.fire({
    ...swalCustomTheme,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: "#e11d48", // rose-600
    cancelButtonColor: "#334155", // slate-700
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

export default Swal;
