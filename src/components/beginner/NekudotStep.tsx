"use client";

import { useEffect, useState } from "react";

/** Step 3 tabs: the practice levels first (seen straight away), and the whole chart (owner, Nov 20). */
export function NekudotStep({ levels, chart }: { levels: React.ReactNode; chart: React.ReactNode }) {
  const [tab, setTab] = useState<"levels" | "chart">("levels");
  useEffect(() => {
    if (location.hash === "#chart") setTab("chart");
  }, []);
  return (
    <div>
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
        {(
          [
            ["levels", "⭐ Practice levels"],
            ["chart", "📋 Letters with Nekudot"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              history.replaceState(null, "", id === "chart" ? "#chart" : location.pathname);
            }}
            className={`rounded-xl px-4 py-2.5 text-base font-semibold sm:text-lg ${tab === id ? "bg-white text-amber-900 shadow" : "text-stone-600"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "levels" ? levels : chart}
    </div>
  );
}
