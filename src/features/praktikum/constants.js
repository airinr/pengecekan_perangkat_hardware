// Canonical mapping lab & praktikum. Satu-satunya sumber kebenaran
// untuk slug URL bersih, kode backend, dan label tampilan.

export const LABS = {
  609: { code: "LAB00001", short: "609", name: "Lab 609" },
  610: { code: "LAB00002", short: "610", name: "Lab 610" },
};

export const LAB_CODE_TO_SHORT = {
  LAB00001: "609",
  LAB00002: "610",
};

export function labCodeFromShort(short) {
  return LABS[String(short)]?.code ?? "";
}

export function labShortFromCode(code) {
  const norm = String(code || "").trim().toUpperCase();
  return LAB_CODE_TO_SHORT[norm] ?? "";
}

export function labNameFromCode(code) {
  const short = labShortFromCode(code);
  return LABS[short]?.name ?? String(code || "");
}

export const PRAKTIKUMS = {
  "merakit-pc": { code: "PRTK00001", name: "Merakit Komputer" },
  "bios-partisi": { code: "PRTK00002", name: "BIOS & Partisi" },
  jarkom: { code: "PRTK00003", name: "Jaringan Komputer" },
  troubleshooting: { code: "PRTK00004", name: "Troubleshooting" },
};

export const PRAKTIKUM_CODE_TO_SLUG = Object.fromEntries(
  Object.entries(PRAKTIKUMS).map(([slug, v]) => [v.code, slug]),
);

export function praktikumCodeFromSlug(slug) {
  return PRAKTIKUMS[String(slug || "").toLowerCase()]?.code ?? "";
}

export function praktikumSlugFromCode(code) {
  const norm = String(code || "").trim().toUpperCase();
  return PRAKTIKUM_CODE_TO_SLUG[norm] ?? "";
}

export function praktikumNameFromCode(code) {
  const slug = praktikumSlugFromCode(code);
  return PRAKTIKUMS[slug]?.name ?? String(code || "");
}

// Item bawaan tiap form laporan (gabungan 4 form lama).
export const FORM_ITEMS_BY_CODE = {
  PRTK00001: [
    "Motherboard",
    "Fan",
    "Processor",
    "Ram",
    "Power supply",
    "Kabel SATA",
    "Harddisk",
    "Puzzle Mat",
  ],
  PRTK00002: ["Flashdisk", "Komputer"],
  PRTK00003: ["Crimping Tools", "LAN Tester", "Pengupas Kabel", "Gunting"],
  PRTK00004: ["Flashdisk", "Komputer"],
};

// Route builder bersih (tanpa query string).
export const labPath = (labShort) => `/lab/${labShort}`;
export const praktikumPath = (labShort, slug) => `/lab/${labShort}/${slug}`;
export const laporanPath = (labShort, slug) => `/laporan/${labShort}/${slug}`;
export const historiPath = (idHistory) =>
  `/histori/${encodeURIComponent(idHistory)}`;
export const perangkatPath = (labShort) => `/perangkat/${labShort}`;

// Redirect legacy -> bersih (dipakai di App.jsx).
export const LEGACY_PRAKTIKUM_REDIRECTS = [
  { from: "/lab609_merakit_pc", to: "/lab/609/merakit-pc" },
  { from: "/lab609_bios_partisi", to: "/lab/609/bios-partisi" },
  { from: "/lab609_jarkom", to: "/lab/609/jarkom" },
  { from: "/lab609_troubleshooting", to: "/lab/609/troubleshooting" },
  { from: "/lab610_merakit_pc", to: "/lab/610/merakit-pc" },
  { from: "/lab610_bios_partisi", to: "/lab/610/bios-partisi" },
  { from: "/lab610_jarkom", to: "/lab/610/jarkom" },
  { from: "/lab610_troubleshooting", to: "/lab/610/troubleshooting" },
  { from: "/lab609", to: "/lab/609" },
  { from: "/lab610", to: "/lab/610" },
];

export const LEGACY_FORM_REDIRECTS = [
  { from: "/form_merakit_pc", to: "/laporan/609/merakit-pc" },
  { from: "/form_bios_partisi", to: "/laporan/609/bios-partisi" },
  { from: "/form_jarkom", to: "/laporan/609/jarkom" },
  { from: "/form_troubleshooting", to: "/laporan/609/troubleshooting" },
];

export const HISTORY_COLUMNS = [
  { key: "no", header: "#" },
  { key: "tgl", header: "Hari/Tanggal" },
  { key: "kelas", header: "Kelas" },
  { key: "waktu", header: "Waktu" },
  { key: "dosen", header: "Dosen" },
  { key: "asisten", header: "Nama/Asisten" },
  { key: "ttd", header: "TTD" },
  { key: "tindak_lanjut", header: "Tindak Lanjut" },
  { key: "status", header: "Status" },
  { key: "aksi", header: "Aksi" },
];

export const STATUS_COMPLETE = "Lengkap";
export const STATUS_INCOMPLETE = "Tidak Lengkap";
