import { apiGet } from "@/lib/apiClient";
import { computeStatus } from "./helpers";

export async function fetchPraktikumHistory(kodePraktikum, labCode, signal) {
  const payload = await apiGet(
    `/praktikum/getPraktikumHistory/${encodeURIComponent(kodePraktikum)}?lab=${encodeURIComponent(labCode)}`,
    { signal },
  );
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchDetailHistory(idHistory) {
  const payload = await apiGet(
    `/praktikum/getDetailHistory/${encodeURIComponent(idHistory)}`,
  );
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function fetchHistoryStatus(idHistory) {
  try {
    const details = await fetchDetailHistory(idHistory);
    return computeStatus(details);
  } catch {
    return "Tidak Lengkap";
  }
}
