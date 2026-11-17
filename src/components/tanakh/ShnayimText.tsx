"use client";

import { useZoom, ZoomControl, zoomWidth } from "@/components/reader/Zoom";
import { WithMaamid } from "@/components/reader/Maamid";

export interface ShnayimVerse {
  ref: string;
  /** The pasuk with nikkud and te'amim (as read). */
  mikra: string;
  targum: string;
}
export interface ShnayimSection {
  id: string;
  en: string;
  he: string;
  verses: ShnayimVerse[];
}

/** Each pasuk twice (Mikra), then its Targum, aliyah by aliyah. */
export function ShnayimText({ sections }: { sections: ShnayimSection[] }) {
  const [zoom, setZoom] = useZoom();
  return (
    <div className="space-y-4" style={zoomWidth(zoom)}>
      <div className="sticky top-0 z-10 sm:top-[5rem] flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
        <nav aria-label="Aliyot" className="flex flex-wrap gap-1.5 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full bg-white px-3 py-1 text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-amber-50">
              {s.en}
            </a>
          ))}
        </nav>
        <ZoomControl zoom={zoom} onChange={setZoom} />
      </div>
      {sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-36 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between border-b border-stone-100 pb-2">
            <h2 className="font-semibold text-stone-900">{s.en}</h2>
            <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
              {s.he}
            </span>
          </div>
          <ol className="space-y-4" dir="rtl">
            {s.verses.map((v) => (
              <li key={v.ref} lang="he" className="border-b border-stone-50 pb-3 last:border-0" style={{ fontSize: `${zoom}em` }}>
                <div className="mb-0.5 font-sans text-[0.7rem] text-stone-400" dir="ltr">
                  {v.ref}
                </div>
                {[1, 2].map((n) => (
                  <p key={n} className="hebrew-text font-hebrew text-[1.45rem] leading-[2.1] text-stone-900">
                    <span className="me-2 inline-block rounded bg-amber-100 px-1.5 align-middle font-sans text-[0.55rem] font-semibold text-amber-900">
                      {n === 1 ? "מקרא" : "מקרא ב׳"}
                    </span>
                    <WithMaamid text={v.mikra} />
                  </p>
                ))}
                <p className="hebrew-text font-hebrew text-[1.3rem] leading-[2] text-sky-900">
                  <span className="me-2 inline-block rounded bg-sky-100 px-1.5 align-middle font-sans text-[0.55rem] font-semibold text-sky-900">
                    תרגום
                  </span>
                  {v.targum}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
