"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Hebrew numerals for a perek or pasuk number (1–200): א, ב … יא, טו, טז … קנ. */
export function hebNum(n: number): string {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר"];
  let s = hundreds[Math.floor(n / 100)] ?? "";
  const r = n % 100;
  if (r === 15) return s + "טו";
  if (r === 16) return s + "טז";
  s += tens[Math.floor(r / 10)] + ones[r % 10];
  return s;
}

export interface FinderChapter {
  /** The page for this chapter (Nevi'im/Ketuvim) or null (Torah: the parasha decides). */
  href: string | null;
  c: number;
  verses: number;
  /** For combined books: which book this chapter is in ("Hoshea", "Shemuel Bet"). */
  part?: string;
}

/**
 * Find a perek and pasuk (owner, Nov 25): on top of every book of Tanakh. For the Torah the parasha that holds
 * the pasuk is opened; the page then goes straight to the pasuk (#v-<perek>-<pasuk>).
 */
export function PasukFinder({
  chapters,
  parashot,
  base,
}: {
  chapters: FinderChapter[];
  /** Torah: each parasha's first and last pasuk. */
  parashot?: { id: string; from: [number, number]; to: [number, number] }[];
  /** Torah: /tanakh/torah/<book>/ */
  base?: string;
}) {
  const router = useRouter();
  const [k, setK] = useState(0);
  const [v, setV] = useState(1);
  const ch = chapters[k];
  const parts = [...new Set(chapters.map((c) => c.part).filter(Boolean))];
  const go = () => {
    if (!ch) return;
    const pasuk = Math.min(Math.max(1, v), ch.verses);
    let href = ch.href;
    if (!href && parashot && base) {
      const at = ch.c * 1000 + pasuk;
      const p = parashot.find((x) => at >= x.from[0] * 1000 + x.from[1] && at <= x.to[0] * 1000 + x.to[1]);
      if (p) href = `${base}${p.id}/`;
    }
    if (href) router.push(`${href}#v-${ch.c}-${pasuk}`);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3"
    >
      <span className="w-full text-sm font-semibold text-stone-800 sm:w-auto sm:self-center">🔎 Find a pasuk</span>
      <label className="flex flex-col text-xs text-stone-600">
        Perek
        <select
          value={k}
          onChange={(e) => {
            setK(Number(e.target.value));
            setV(1);
          }}
          className="mt-0.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-base text-stone-900"
        >
          {parts.length
            ? parts.map((pt) => (
                <optgroup key={pt} label={pt}>
                  {chapters.map((c, i) =>
                    c.part === pt ? (
                      <option key={i} value={i}>
                        {c.c} ({hebNum(c.c)})
                      </option>
                    ) : null,
                  )}
                </optgroup>
              ))
            : chapters.map((c, i) => (
                <option key={i} value={i}>
                  {c.c} ({hebNum(c.c)})
                </option>
              ))}
        </select>
      </label>
      <label className="flex flex-col text-xs text-stone-600">
        Pasuk
        <select
          value={v}
          onChange={(e) => setV(Number(e.target.value))}
          className="mt-0.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-base text-stone-900"
        >
          {Array.from({ length: ch?.verses ?? 0 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} ({hebNum(n)})
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white hover:bg-amber-800">
        Go →
      </button>
    </form>
  );
}
