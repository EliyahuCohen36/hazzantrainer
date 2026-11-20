"use client";

import { useEffect, useState } from "react";
import { ShevaTrainer } from "./ShevaTrainer";

/** Step 5: the Sheva, in two tabs: Sheva Nach and Sheva Na. Only the levels here; each level opens with its own chart. */
export function ShevaTabs() {
  const [tab, setTab] = useState<"nach" | "na">("nach");
  useEffect(() => {
    if (location.hash.startsWith("#na")) setTab(location.hash.startsWith("#nach") ? "nach" : "na");
  }, []);
  return (
    <div>
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1.5">
        {(
          [
            ["nach", "Sheva Nach", "שְׁוָא נָח"],
            ["na", "Sheva Na", "שְׁוָא נָע"],
          ] as const
        ).map(([id, en, he]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2.5 text-lg font-semibold ${tab === id ? "bg-white text-amber-900 shadow" : "text-stone-600"}`}
          >
            {en}{" "}
            <span dir="rtl" lang="he" className="font-hebrew">
              {he}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {tab === "nach" ? <ShevaTrainer key="nach" parts={["nach"]} /> : <ShevaTrainer key="na" parts={["na", "mixed"]} />}
      </div>
    </div>
  );
}
