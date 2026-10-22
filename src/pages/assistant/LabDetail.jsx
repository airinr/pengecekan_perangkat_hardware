import { Navigate, useNavigate, useParams } from "react-router-dom";
import { LABS, labCodeFromShort } from "@/features/praktikum/constants";
import { PRAKTIKUMS, praktikumPath } from "@/features/praktikum/constants";

export default function LabDetail() {
  const { labId } = useParams();
  const navigate = useNavigate();

  const lab = LABS[String(labId)];
  if (!lab) return <Navigate to="/dashboard_asisten" replace />;
  const labCode = labCodeFromShort(labId);

  const go = (slug) => navigate(praktikumPath(labId, slug));

  const items = Object.entries(PRAKTIKUMS).map(([slug, v]) => ({
    slug,
    title: `Praktikum ${v.name}`,
    desc: lab.name,
  }));

  return (
    <div className="mx-auto px-4 py-6 sm:py-8 lg:ml-56 pt-16 sm:pt-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">
          Perangkat Laboratorium {lab.short}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mb-6">
          Kode Lab: <span className="font-semibold">{lab.name}</span> (
          {labCode}). Pilih salah satu kategori di bawah untuk melanjutkan
          pengisian laporan.
        </p>
        <div
          role="group"
          aria-label="Pilih kategori laporan"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-fr"
        >
          {items.map((item) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => go(item.slug)}
              className="group relative w-full rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left text-white shadow-md transition hover:bg-slate-800/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 h-full"
              aria-label={`Buka ${item.title}`}
            >
              <div className="flex items-start gap-3">
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
          ))}
        </div>
      </div>
    </div>
  );
}
