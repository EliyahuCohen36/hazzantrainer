"use client";

import { useEffect, useState } from "react";
import {
  EMET_TEAMIM,
  PROSE_TEAMIM,
  SECTION_TITLES,
  TANAKH,
  type TaamReference,
  type TanakhBook,
  type TanakhSection,
} from "@/data/teamim-reference";

const SECTIONS: TanakhSection[] = ["torah", "neviim", "ketuvim"];
const LEVELS: Record<number, string> = {
  1: "Strongest pause",
  2: "Major pause",
  3: "Medium pause",
  4: "Light pause",
};

function bookFromHash(): TanakhBook {
  if (typeof window === "undefined") return TANAKH[0];
  const id = window.location.hash.replace("#", "");
  return TANAKH.find((b) => b.id === id) ?? TANAKH[0];
}

function TaamRow({ t }: { t: TaamReference }) {
  return (
    <tr className="border-b border-stone-100 last:border-0">
      <td className="w-20 py-2 pe-3 text-center">
        <span dir="rtl" lang="he" className="hebrew-text font-hebrew text-4xl leading-[1.9] text-amber-800">
          {t.sample}
        </span>
      </td>
      <td className="py-2 pe-3">
        <div className="font-semibold text-stone-900">{t.syrian}</div>
        <div className="text-xs text-stone-500">Ashkenazi: {t.ashkenazi}</div>
      </td>
      <td dir="rtl" lang="he" className="py-2 pe-3 font-hebrew text-lg text-stone-700">
        {t.hebrew}
      </td>
      <td className="hidden py-2 text-sm text-stone-500 sm:table-cell">{t.note}</td>
    </tr>
  );
}

function TaamTable({ title, subtitle, rows, grouped }: { title: string; subtitle: string; rows: TaamReference[]; grouped?: boolean }) {
  const groups = grouped
    ? [1, 2, 3, 4].map((lvl) => ({ lvl, items: rows.filter((r) => r.level === lvl) })).filter((g) => g.items.length)
    : [{ lvl: 0, items: rows }];
  return (
    <div>
      <h3 className="text-base font-semibold text-stone-900">
        {title} <span className="text-sm font-normal text-stone-500">{subtitle}</span>
      </h3>
      <table className="mt-2 w-full text-left">
        <tbody>
          {groups.map(({ lvl, items }) => [
            grouped ? (
              <tr key={`h${lvl}`}>
                <td colSpan={4} className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
                  {LEVELS[lvl]}
                </td>
              </tr>
            ) : null,
            ...items.map((t) => <TaamRow key={t.syrian + t.sample} t={t} />),
          ])}
        </tbody>
      </table>
    </div>
  );
}

export function TeamimBrowser() {
  const [book, setBook] = useState<TanakhBook>(TANAKH[0]);

  // Each book has its own link (#tehillim, #ester…).
  useEffect(() => {
    const sync = () => setBook(bookFromHash());
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const list = book.system === "emet" ? EMET_TEAMIM : PROSE_TEAMIM;
  const mafsikim = list.filter((t) => t.role === "mafsik");
  const mesharetim = list.filter((t) => t.role === "mesharet");

  return (
    <div className="space-y-5">
      <nav aria-label="Books of Tanakh" className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {SECTIONS.map((s) => (
          <div key={s}>
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{SECTION_TITLES[s].en}</span>
              <span dir="rtl" lang="he" className="font-hebrew text-sm text-stone-400">{SECTION_TITLES[s].he}</span>
            </div>
            <div className="flex flex-wrap gap-1.5" dir="rtl">
              {TANAKH.filter((b) => b.section === s).map((b) => (
                <a
                  key={b.id}
                  href={`#${b.id}`}
                  aria-current={b.id === book.id ? "page" : undefined}
                  className={`rounded-lg px-3 py-1.5 font-hebrew text-base transition-colors ${
                    b.id === book.id ? "bg-amber-700 text-white" : "bg-stone-100 text-stone-700 hover:bg-amber-100"
                  }`}
                >
                  {b.he}
                </a>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-semibold text-stone-900">{book.en}</h2>
          <span dir="rtl" lang="he" className="font-hebrew text-3xl text-stone-700">{book.he}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">{book.melody}</span>
          <span className={`rounded-full px-3 py-1 ${book.system === "emet" ? "bg-indigo-100 text-indigo-900" : "bg-stone-100 text-stone-700"}`}>
            {book.system === "emet" ? "Ta'amei Emet: its own set of te'amim" : "Te'amim of the 21 books"}
          </span>
        </div>
        {book.note && <p className="mt-2 text-sm text-stone-600">{book.note}</p>}
        {book.system === "emet" ? (
          <p className="mt-2 text-sm text-stone-500">
            Tehillim, Mishle and Iyov (אמ״ת) use a different set of te&apos;amim from the rest of Tanakh.
          </p>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            All of Tanakh except Tehillim, Mishle and Iyov uses these te&apos;amim. What changes from book to book is the melody.
          </p>
        )}

        <div className="mt-5 space-y-6">
          <TaamTable title="Mafsikim" subtitle="(pausing te'amim)" rows={mafsikim} grouped />
          <TaamTable title="Mesharetim" subtitle="(connecting te'amim)" rows={mesharetim} />
        </div>
        {book.system === "emet" && (
          <p className="mt-4 text-xs text-stone-500">
            The Syrian source names the mafsikim of these books; the mesharet names here are the usual textbook names.
          </p>
        )}
      </section>
    </div>
  );
}
