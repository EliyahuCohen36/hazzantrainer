"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { WithMaamid } from "@/components/reader/Maamid";
import { BookmarkButton } from "@/lib/bookmarks";
import { MAQAMOT, MAX_TUNES, oneRecording, sectionRecording, siddurRecording, tuneSpot, tunesHere, type SiddurPart } from "@/data/siddur";
import { Recording } from "@/components/audio/Recording";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { useZoom, ZoomControl, zoomWidth } from "@/components/reader/Zoom";
import { useFolder } from "@/lib/recordings";
import { useAuth } from "@/lib/auth";
import { useLang } from "@/lib/i18n/Translator";
import { LongRecordingsAdmin, SegmentPlayer, useSegments, type Segment, type SpokenPara } from "./LongRecordings";

interface Tok {
  w: string;
  b: boolean;
  small: boolean;
  br?: boolean;
  /** Index among the words that are said (not instructions). */
  i: number | null;
}

/** A paragraph's words, with bold / instruction (small) marks kept. */
function tokens(html: string): Tok[] {
  const out: Tok[] = [];
  let b = 0;
  let small = 0;
  let i = 0;
  for (const part of html.split(/(<[^>]+>|\s+)/)) {
    if (!part || /^\s+$/.test(part)) continue;
    if (part.startsWith("<")) {
      const tag = part.replace(/[<>/\s]/g, "").toLowerCase();
      const close = part.startsWith("</");
      if (tag === "b") b += close ? -1 : 1;
      else if (tag === "small") small += close ? -1 : 1;
      else if (tag === "br") out.push({ w: "", b: false, small: false, br: true, i: null });
      continue;
    }
    out.push({ w: part, b: b > 0, small: small > 0, i: small > 0 ? null : i++ });
  }
  return out;
}

function Paragraph({
  part,
  s,
  p,
  html,
  sectionHe,
  have,
  admin,
  segment,
  tr,
  trLang,
  trRef,
  showRec,
  sectionRec,
}: {
  /** Show the recording players (the reader's toggle). */
  showRec: boolean;
  /** The section has one recording for all of it: no player per paragraph. */
  sectionRec: boolean;
  /** The translation of this paragraph (shown beside the Hebrew), if any. */
  tr?: string;
  trLang?: "en" | "ar";
  trRef?: string;
  part: string;
  s: number;
  p: number;
  html: string;
  sectionHe: string;
  have: Set<string> | null;
  admin: boolean;
  /** Its part of a long recording, if it was marked there. */
  segment?: Segment;
}) {
  const toks = useMemo(() => tokens(html), [html]);
  const spoken = toks.filter((t) => t.i !== null).length;
  const found = useMemo(() => tuneSpot(part, html, sectionHe), [part, html, sectionHe]);
  // Maqam tunes only in the Shabbat / Yom Tov parts; elsewhere a note points there.
  const spot = found && tunesHere(part) ? found : undefined;
  const [maqam, setMaqam] = useState("");
  const { lang } = useLang();
  const maqamName = (m: { en: string; he: string }) =>
    lang === "he" ? `מקאם ${m.he}` : lang === "ar" ? `مقام ${m.he}` : `Maqam ${m.en} (${m.he})`;
  const [tune, setTune] = useState(1);
  const src = siddurRecording(part, s, p, maqam || undefined, tune);
  const tunesOf = (m: string) =>
    Array.from({ length: MAX_TUNES }, (_, k) => k + 1).filter((k) => have?.has(siddurRecording(part, s, p, m, k)));
  const exists = !!have?.has(src);
  const recordedMaqamot = spot ? MAQAMOT.filter((m) => tunesOf(m.id).length > 0) : [];
  const tunes = maqam ? tunesOf(maqam) : [];
  const nextTune = maqam ? (Array.from({ length: MAX_TUNES }, (_, k) => k + 1).find((k) => !tunes.includes(k)) ?? null) : null;

  if (!spoken) {
    // Instructions only.
    return (
      <p className="font-siddur text-[0.8em] leading-relaxed text-stone-500">
        {toks.map((t, k) => (t.br ? <br key={k} /> : <Fragment key={k}>{t.w} </Fragment>))}
      </p>
    );
  }
  return (
    <div id={`p-${s + 1}-${p + 1}`} className="scroll-mt-40 border-b border-stone-50 py-2 last:border-0">
      <div className={tr ? "space-y-1.5" : ""}>
      <p className="hebrew-text font-siddur leading-[2.1] text-stone-900">
        {toks.map((t, k) =>
          t.br ? (
            <br key={k} />
          ) : (
            <Fragment key={k}>
              <span className={`${t.b ? "font-bold" : ""} ${t.small ? "text-[0.7em] text-stone-500" : ""}`}>
                {t.small ? t.w : <WithMaamid text={t.w} />}
              </span>{" "}
            </Fragment>
          ),
        )}
      </p>
      {tr && (
        <div
          lang={trLang}
          dir={trLang === "ar" ? "rtl" : "ltr"}
          data-no-translate
          className={`rounded-lg bg-stone-50 px-3 py-2 text-[0.62em] leading-relaxed text-stone-700 ${trLang === "ar" ? "text-right" : "text-left"}`}
        >
          {tr}
          {trRef && trLang === "en" && <span className="mt-1 block text-[0.85em] text-stone-400">{trRef}</span>}
        </div>
      )}
      </div>
      {showRec && !sectionRec && (exists || found || admin || segment) && (
        <div className="mt-1 flex flex-wrap items-center gap-2" dir="ltr">
          {spot && (
            <label className="flex items-center gap-1 text-xs text-stone-600">
              <span>Tune:</span>
              <select
                value={maqam}
                onChange={(e) => {
                  setMaqam(e.target.value);
                  setTune(1);
                }}
                className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs"
              >
                <option value="">Regular</option>
                {(admin ? MAQAMOT : recordedMaqamot).map((m) => (
                  <option key={m.id} value={m.id}>
                    {maqamName(m)}
                    {admin && !tunesOf(m.id).length ? " · not recorded" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {spot && maqam && (tunes.length > 1 || admin) && (
            <span className="flex flex-wrap items-center gap-1 text-xs">
              {tunes.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setTune(k)}
                  className={`rounded-full px-2 py-0.5 ring-1 ${tune === k ? "bg-amber-700 text-white ring-amber-700" : "ring-stone-300"}`}
                >
                  Tune {k}
                </button>
              ))}
              {admin && nextTune && tune !== nextTune && (
                <button type="button" onClick={() => setTune(nextTune)} className="rounded-full px-2 py-0.5 text-amber-800 ring-1 ring-amber-400">
                  + Tune {nextTune}
                </button>
              )}
            </span>
          )}
          {found && !spot && (
            <Link href="/siddur/shaharit-shabbat/" className="text-xs text-amber-800 underline">
              🎵 The maqam tunes for this are in the Shabbat section
            </Link>
          )}
          {!exists && !maqam && segment && <SegmentPlayer seg={segment} />}
          {exists && (
            <Recording key={src} src={src} className="h-8 w-full max-w-xs" />
          )}
          {admin && (
            <AdminDrop path={src} exists={exists} compact label={exists ? "Replace recording" : maqam ? `Drop ${maqam} tune ${tune} here` : "Drop a recording here"} />
          )}
        </div>
      )}
    </div>
  );
}

/** Show or hide the recording players (remembered per browser). */
function useShowRecordings(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      if (localStorage.getItem("siddur-recordings") === "off") setShow(false);
    } catch {}
  }, []);
  const set = (v: boolean) => {
    setShow(v);
    try {
      localStorage.setItem("siddur-recordings", v ? "on" : "off");
    } catch {}
  };
  return [show, set];
}

/** Hebrew only, or the reader's language beside it (remembered per browser). */
function useShowTranslation(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState(true);
  useEffect(() => {
    try {
      const v = localStorage.getItem("kriah-siddur-translation");
      if (v) setShow(v === "1");
    } catch {}
  }, []);
  return [
    show,
    (v: boolean) => {
      setShow(v);
      try {
        localStorage.setItem("kriah-siddur-translation", v ? "1" : "0");
      } catch {}
    },
  ];
}

/** The translation of one part ("s-p" → text), loaded only when it's shown. */
function useTranslation(lang: "en" | "ar" | "refs" | null, part: string): Record<string, string> | null {
  const [data, setData] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    if (!lang) {
      setData(null);
      return;
    }
    let live = true;
    import(`@/data/siddur-tr/${lang}/${part}.json`)
      .then((m) => live && setData((m.default ?? m) as Record<string, string>))
      .catch(() => live && setData({}));
    return () => {
      live = false;
    };
  }, [lang, part]);
  return data;
}

/** One part of the Siddur, section by section, with the Hazzan's recordings beside each paragraph. */
export function SiddurView({ part }: { part: SiddurPart }) {
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const [zoom, setZoom] = useZoom();
  // Everything recorded for this part (one listing of its folder).
  const have = useFolder(`/audio/siddur/${part.slug}`);
  const segments = useSegments(part.slug, have);
  const { lang } = useLang();
  const trLang = lang === "en" || lang === "ar" ? lang : null;
  const [showTr, setShowTr] = useShowTranslation();
  const [showRec, setShowRec] = useShowRecordings();
  // A link to one paragraph (#p-3-2, e.g. from Songs and maqam tunes) lands right on it, and it lights up for a moment.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!/^[ps]-\d/.test(id)) return;
      const jump = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
      jump();
      const el = document.getElementById(id);
      el?.classList.add("bg-amber-100", "transition-colors");
      const t1 = setTimeout(jump, 400);
      const t2 = setTimeout(jump, 1200);
      const t3 = setTimeout(() => el?.classList.remove("bg-amber-100"), 3000);
      return () => [t1, t2, t3].forEach(clearTimeout);
    };
    const stop = go();
    window.addEventListener("hashchange", go);
    return () => {
      stop?.();
      window.removeEventListener("hashchange", go);
    };
  }, []);
  const tr = useTranslation(trLang && showTr ? trLang : null, part.slug);
  const refs = useTranslation(trLang === "en" && showTr ? "refs" : null, part.slug);
  const paraCount = part.sections.reduce((n, sec) => n + sec.paras.length, 0);
  const spoken: SpokenPara[] = useMemo(
    () =>
      part.sections.flatMap((sec, s) =>
        sec.paras.flatMap((html, p) => {
          const words = tokens(html).filter((t) => t.i !== null).map((t) => t.w);
          if (!words.length) return [];
          return [{ s, p, head: `${sec.he}: ${words.slice(0, 6).join(" ")}…`, len: words.join(" ").replace(/[\u0591-\u05C7]/g, "").length }];
        }),
      ),
    [part],
  );
  return (
    <div className="space-y-4" style={zoomWidth(zoom)}>
      <div className="sticky top-0 z-10 sm:top-[5rem] space-y-2 rounded-xl border border-stone-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Sections" className="flex flex-wrap gap-1.5" dir="rtl">
            {part.sections.map((sec, s) => (
              <a key={s} href={`#s-${s + 1}`} lang="he" className="rounded-full px-2.5 py-0.5 font-hebrew text-sm ring-1 ring-stone-200 hover:bg-amber-50">
                {sec.he}
              </a>
            ))}
          </nav>
          <ZoomControl zoom={zoom} onChange={setZoom} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRec(!showRec)}
              aria-pressed={showRec}
              className={`rounded-full px-3 py-1 text-sm ring-1 ${showRec ? "bg-amber-700 text-white ring-amber-700" : "bg-white text-amber-900 ring-amber-300"}`}
            >
              🔊 {showRec ? "Hide recordings" : "Show recordings"}
            </button>
            {showRec && <SpeedControl compact />}
          </div>
          {trLang && (
            <div className="flex overflow-hidden rounded-full text-sm ring-1 ring-amber-300" role="group" aria-label="Translation">
              <button
                type="button"
                onClick={() => setShowTr(false)}
                className={`px-3 py-1 ${!showTr ? "bg-amber-700 text-white" : "bg-white text-amber-900"}`}
              >
                Hebrew only
              </button>
              <button
                type="button"
                onClick={() => setShowTr(true)}
                className={`px-3 py-1 ${showTr ? "bg-amber-700 text-white" : "bg-white text-amber-900"}`}
              >
                {trLang === "ar" ? "Arabic + Hebrew" : "English + Hebrew"}
              </button>
            </div>
          )}
        </div>
        {trLang && showTr && tr && Object.keys(tr).length < paraCount / 3 && (
          <p className="text-xs text-stone-500">Much of this part is still being translated. The pesukim and the main prayers are done.</p>
        )}
      </div>
      {admin && <LongRecordingsAdmin part={part.slug} have={have} paras={spoken} />}
      {part.sections.map((sec, s) => (
        <section key={s} id={`s-${s + 1}`} className="scroll-mt-40 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
            <h2 dir="rtl" lang="he" className="font-hebrew text-2xl font-semibold text-amber-800">
              {sec.he}
            </h2>
            <BookmarkButton kind="tefillah" href={`/siddur/${part.slug}/#s-${s + 1}`} label={part.en} he={sec.he} />
          </div>
          {showRec && oneRecording(sec.he) && (have?.has(sectionRecording(part.slug, s)) || admin) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 p-2" dir="ltr">
              <span className="text-sm font-semibold text-amber-900">The whole of this section:</span>
              {have?.has(sectionRecording(part.slug, s)) && (
                <Recording key={sectionRecording(part.slug, s)} src={sectionRecording(part.slug, s)} className="h-9 w-full max-w-sm" />
              )}
              {admin && (
                <AdminDrop
                  path={sectionRecording(part.slug, s)}
                  compact
                  label={have?.has(sectionRecording(part.slug, s)) ? "Replace recording" : "Drop the recording of the whole section here"}
                />
              )}
            </div>
          )}
          <div dir="rtl" lang="he" style={{ fontSize: `${1.5 * zoom}rem` }}>
            {sec.paras.map((html, p) => (
              <Paragraph
                key={p}
                part={part.slug}
                s={s}
                p={p}
                html={html}
                sectionHe={sec.he}
                have={have}
                admin={admin}
                segment={segments.get(`${s}-${p}`)}
                tr={tr?.[`${s + 1}-${p + 1}`]}
                trLang={trLang ?? undefined}
                trRef={refs?.[`${s + 1}-${p + 1}`]}
                showRec={showRec}
                sectionRec={oneRecording(sec.he)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
