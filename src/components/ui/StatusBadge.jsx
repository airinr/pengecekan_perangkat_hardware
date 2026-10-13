import { STATUS_COMPLETE } from "@/features/praktikum/constants";

export default function StatusBadge({ value }) {
  const cls =
    value === STATUS_COMPLETE
      ? "bg-green-500/15 text-green-300 ring-green-500/30"
      : "bg-rose-500/15 text-rose-300 ring-rose-500/30";
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {value}
    </span>
  );
}
