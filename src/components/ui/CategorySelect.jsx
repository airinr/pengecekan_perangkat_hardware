import { useNavigate } from "react-router-dom";
import { PRAKTIKUMS, praktikumPath } from "@/features/praktikum/constants";

export default function CategorySelect({ labShort, label }) {
  const navigate = useNavigate();

  const handleChange = (slug) => {
    if (!slug) return;
    navigate(praktikumPath(labShort, slug));
  };

  return (
    <div className="py-6 lg:ml-56 lg:pl-5">
      <label
        htmlFor="topik"
        className="mb-2 block text-sm font-medium text-slate-200"
      >
        {label ?? "Pilih kategori untuk melakukan laporan"}
      </label>
      <select
        id="topik"
        defaultValue=""
        onChange={(e) => handleChange(e.target.value)}
        className="mb-6 block w-full appearance-none rounded-lg border border-white/15 bg-slate-900/60 px-3 py-2 pr-9 text-sm text-slate-100"
      >
        <option value="" disabled>
          Pilih kategori
        </option>
        {Object.entries(PRAKTIKUMS).map(([slug, v]) => (
          <option key={slug} value={slug}>
            {v.name}
          </option>
        ))}
      </select>
    </div>
  );
}
