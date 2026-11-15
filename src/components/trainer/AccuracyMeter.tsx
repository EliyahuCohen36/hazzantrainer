"use client";

interface Props {
  /** 0–100, or null while there isn't enough signal yet. */
  value: number | null;
  label: string;
}

/** Horizontal live accuracy bar. */
export function AccuracyMeter({ value, label }: Props) {
  const v = value ?? 0;
  const color = value === null ? "bg-stone-300" : v >= 80 ? "bg-emerald-500" : v >= 55 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-stone-500">
        <span>{label}</span>
        <span className="tabular-nums">{value === null ? "—" : `${Math.round(v)}%`}</span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-stone-100"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value === null ? undefined : Math.round(v)}
        aria-label={label}
      >
        <div className={`h-full rounded-full transition-[width] duration-150 ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
