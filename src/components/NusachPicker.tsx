"use client";

import { useEffect, useState } from "react";
import { NUSACHIM } from "@/data/nusachim";

const KEY = "kriah-nusach";

/** Which nusach to learn (Syrian now; the others are on the way). Remembered per browser. */
export function NusachPicker() {
  const [nusach, setNusach] = useState("syrian");
  useEffect(() => {
    try {
      const n = localStorage.getItem(KEY);
      if (n && NUSACHIM.some((x) => x.id === n && x.ready)) setNusach(n);
    } catch {
      // ignore
    }
  }, []);
  return (
    <label className="flex items-center gap-1 text-stone-600" title="Nusach">
      <span className="sr-only">Nusach</span>
      <select
        value={nusach}
        onChange={(e) => {
          setNusach(e.target.value);
          try {
            localStorage.setItem(KEY, e.target.value);
          } catch {
            // ignore
          }
          // Recordings are picked per nusach: reload so every player uses the new one.
          location.reload();
        }}
        className="max-w-[9.5rem] rounded-md border border-stone-200 bg-white px-1.5 py-1 text-xs text-stone-700"
        aria-label="Nusach"
      >
        {NUSACHIM.map((n) => (
          <option key={n.id} value={n.id} disabled={!n.ready}>
            {n.en}
            {n.ready ? "" : " (coming soon)"}
          </option>
        ))}
      </select>
    </label>
  );
}
