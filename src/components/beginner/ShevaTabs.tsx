"use client";

import { useEffect, useState } from "react";
import { ShevaTrainer } from "./ShevaTrainer";

/** The vowels before a Sheva, in two groups, always in view (owner's request). */
function VowelGroups({ which }: { which: "ketanot" | "gedolot" }) {
  const KETANOT = [
    ["בַ", "Patah"],
    ["בֶ", "Segol"],
    ["בִ", "Hiriq (no Yod)"],
    ["בׇ", "Qamats Katan"],
    ["בֻ", "Qibbus"],
  ];
  const GEDOLOT = [
    ["בָֽ", "Qamats"],
    ["בֵ", "Tsere"],
    ["בִי", "Hiriq with Yod"],
    ["בֹ / בוֹ", "Holam"],
    ["בוּ", "Shuruq (in the middle)"],
  ];
  const list = which === "ketanot" ? KETANOT : GEDOLOT;
  return (
    <div className={`rounded-2xl border-2 p-4 ${which === "ketanot" ? "border-sky-300 bg-sky-50" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-900">
          {which === "ketanot" ? "Short vowels: the Sheva after them is Nach" : "Long vowels: the Sheva after them is Na"}
        </h2>
        <span dir="rtl" lang="he" className="font-hebrew text-xl font-semibold text-stone-800">
          {which === "ketanot" ? "תְּנוּעוֹת קְטַנּוֹת" : "תְּנוּעוֹת גְּדוֹלוֹת"}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {list.map(([h, n]) => (
          <li key={n} className="rounded-xl bg-white px-2 py-2 text-center shadow-sm">
            <span dir="rtl" lang="he" className="hebrew-text block font-hebrew text-3xl leading-[1.7] text-stone-900">
              {h}
            </span>
            <span className="text-sm text-stone-700">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Same sound, different nekuda: Patah / Qamats and Segol / Tsere (kept simple). */
function SameSound() {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-stone-800">
      <h2 className="font-semibold">Same sound, different Sheva!</h2>
      <p className="mt-1 text-sm">
        Patah and Qamats both say &ldquo;a&rdquo;, and Segol and Tsere both say &ldquo;e&rdquo;. The sound doesn&apos;t
        tell you the Sheva: the nekuda does. A Qamats before a Sheva has a ma&apos;amid next to it, and its Sheva is Na
        (one more syllable).
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          ["נַשְׁקֶה", "nash-qe", "Patah → Nach"],
          ["גָּֽבְרוּ", "ga-ve-ru", "Qamats → Na"],
          ["נֶחְמָד", "neḥ-mad", "Segol → Nach"],
          ["יֵשְׁבוּ", "ye-she-vu", "Tsere → Na"],
        ].map(([h, r, t]) => (
          <div key={h} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
            <span dir="rtl" lang="he" className="hebrew-text font-hebrew text-3xl leading-[1.8]">
              {h}
            </span>
            <span className="text-right text-sm">
              <b dir="ltr">{r}</b>
              <span className="block text-stone-600">{t}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Step 6: the Sheva, in two tabs: Sheva Nach rules and Sheva Na rules. */
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
        {tab === "nach" ? (
          <>
            <VowelGroups which="ketanot" />
            <ShevaTrainer parts={["nach"]} />
          </>
        ) : (
          <>
            <VowelGroups which="gedolot" />
            <SameSound />
            <ShevaTrainer parts={["na", "mixed"]} />
          </>
        )}
      </div>
    </div>
  );
}
