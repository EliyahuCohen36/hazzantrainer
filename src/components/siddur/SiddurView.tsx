"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { MAQAMOT, siddurRecording, tuneSpot, type SiddurPart } from "@/data/siddur";
import { Recording } from "@/components/audio/Recording";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { useZoom, ZoomControl, zoomWidth } from "@/components/reader/Zoom";
import { recordingUrl, recordingsChanged, useExistingRecordings } from "@/lib/recordings";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { LONG_SLOTS, LongRecordingsAdmin, SegmentPlayer, longJson, longPath, useSegments, type Segment, type SpokenPara } from "./LongRecordings";

interface Tok {
  w: string;
  b: boolean;
  small: boolean;
  br?: boolean;
  /** Index among the words that are said (not instructions), for highlighting. */
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

const jsonOf = (mp3: string) => mp3.replace(/\.mp3$/, ".json");

/** The times each word starts, if the admin has timed this recording. */
function useTimings(src: string | null, exists: boolean): number[] | null {
  const [t, setT] = useState<number[] | null>(null);
  useEffect(() => {
    let live = true;
    setT(null);
    if (!src || !exists) return;
    recordingUrl(jsonOf(src))
      .then((u) => fetch(u))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => live && Array.isArray(j?.w) && setT(j.w))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [src, exists]);
  return t;
}

/** Admin: play the recording and tap at the start of every word; saves the times for highlighting. */
function TimeWords({ src, count, onDone }: { src: string; count: number; onDone: () => void }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [times, setTimes] = useState<number[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    recordingUrl(src).then(setUrl, () => setMsg("Couldn't load the recording"));
  }, [src]);
  const tap = () => {
    const a = ref.current;
    if (!a) return;
    if (a.paused) void a.play();
    setTimes((t) => (t.length < count ? [...t, Math.max(0, a.currentTime - 0.05)] : t));
  };
  const save = async () => {
    setMsg("Saving…");
    const blob = new Blob([JSON.stringify({ w: times })], { type: "application/json" });
    const { error } = await supabase()
      .storage.from("recordings")
      .upload(jsonOf(src).replace(/^\/audio\//, ""), blob, { upsert: true, contentType: "application/json" });
    setMsg(error ? `✗ ${error.message}` : "✓ Saved");
    if (!error) {
      recordingsChanged(jsonOf(src));
      onDone();
    }
  };
  return (
    <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 font-sans text-sm" dir="ltr" data-no-translate>
      <p className="text-stone-700">
        Press <b>Tap</b> (or the space bar) at the start of each word as the recording plays. Word {Math.min(times.length + 1, count)} of {count}.
      </p>
      {url && <audio ref={ref} src={url} controls className="mt-2 h-8 w-full" />}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          autoFocus
          onClick={tap}
          onKeyDown={(e) => {
            if (e.key === " ") {
              e.preventDefault();
              tap();
            }
          }}
          className="rounded-lg bg-amber-700 px-6 py-2 font-semibold text-white"
        >
          Tap
        </button>
        <button type="button" onClick={() => setTimes((t) => t.slice(0, -1))} className="rounded-lg border px-3 py-2">
          Undo
        </button>
        <button
          type="button"
          onClick={() => {
            setTimes([]);
            if (ref.current) ref.current.currentTime = 0;
          }}
          className="rounded-lg border px-3 py-2"
        >
          Start over
        </button>
        <button type="button" disabled={times.length === 0} onClick={() => void save()} className="rounded-lg border border-emerald-600 px-3 py-2 font-semibold text-emerald-800">
          Save times
        </button>
        {msg && <span className="self-center text-stone-600">{msg}</span>}
      </div>
    </div>
  );
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
}: {
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
  const spot = useMemo(() => tuneSpot(part, html, sectionHe), [part, html, sectionHe]);
  const [maqam, setMaqam] = useState("");
  const src = siddurRecording(part, s, p, maqam || undefined);
  const exists = !!have?.has(src);
  const timings = useTimings(exists ? src : null, !!have?.has(jsonOf(src)));
  const [now, setNow] = useState(-1);
  const [timing, setTiming] = useState(false);
  const recordedMaqamot = spot ? MAQAMOT.filter((m) => have?.has(siddurRecording(part, s, p, m.id))) : [];
  // Highlight the word being said.
  const cur = timings && now >= 0 ? timings.findLastIndex((t) => t <= now) : -1;

  if (!spoken) {
    // Instructions only.
    return (
      <p className="font-hebrew text-[0.8em] leading-relaxed text-stone-500">
        {toks.map((t, k) => (t.br ? <br key={k} /> : <Fragment key={k}>{t.w} </Fragment>))}
      </p>
    );
  }
  return (
    <div id={`p-${s + 1}-${p + 1}`} className="scroll-mt-40 border-b border-stone-50 py-2 last:border-0">
      <p className="hebrew-text font-hebrew leading-[2] text-stone-900">
        {toks.map((t, k) =>
          t.br ? (
            <br key={k} />
          ) : (
            <Fragment key={k}>
              <span
                className={`${t.b ? "font-bold" : ""} ${t.small ? "text-[0.7em] text-stone-500" : ""} ${
                  cur >= 0 && t.i === cur ? "rounded bg-amber-200" : ""
                }`}
              >
                {t.w}
              </span>{" "}
            </Fragment>
          ),
        )}
      </p>
      {(exists || spot || admin || segment) && (
        <div className="mt-1 flex flex-wrap items-center gap-2" dir="ltr">
          {spot && (
            <label className="flex items-center gap-1 text-xs text-stone-600">
              <span>Tune:</span>
              <select value={maqam} onChange={(e) => setMaqam(e.target.value)} className="rounded border border-stone-300 bg-white px-1.5 py-1 text-xs">
                <option value="">Regular</option>
                {(admin ? MAQAMOT : recordedMaqamot).map((m) => (
                  <option key={m.id} value={m.id}>
                    Maqam {m.en} ({m.he}){admin && !have?.has(siddurRecording(part, s, p, m.id)) ? " · not recorded" : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!exists && !maqam && segment && <SegmentPlayer seg={segment} />}
          {exists && (
            <Recording
              key={src}
              src={src}
              className="h-8 w-full max-w-xs"
              onTime={timings ? (t, playing) => setNow(playing || t >= 0 ? t : -1) : undefined}
            />
          )}
          {admin && (
            <>
              <AdminDrop path={src} compact label={exists ? "Replace recording" : maqam ? `Drop the ${maqam} tune here` : "Drop a recording here"} />
              {exists && (
                <button type="button" onClick={() => setTiming((x) => !x)} className="rounded border border-stone-300 px-2 py-0.5 text-xs text-stone-600">
                  ⏱ {timings ? "Re-time words" : "Time the words"}
                </button>
              )}
            </>
          )}
        </div>
      )}
      {timing && <TimeWords src={src} count={spoken} onDone={() => setTiming(false)} />}
    </div>
  );
}

/** One part of the Siddur, section by section, with the Hazzan's recordings beside each paragraph. */
export function SiddurView({ part }: { part: SiddurPart }) {
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const [zoom, setZoom] = useZoom();
  const paths = useMemo(() => {
    const out: string[] = [];
    part.sections.forEach((sec, s) =>
      sec.paras.forEach((_, p) => {
        const base = siddurRecording(part.slug, s, p);
        out.push(base, jsonOf(base));
        for (const m of MAQAMOT) {
          const t = siddurRecording(part.slug, s, p, m.id);
          out.push(t, jsonOf(t));
        }
      }),
    );
    for (let n = 1; n <= LONG_SLOTS; n++) out.push(longPath(part.slug, n), longJson(part.slug, n));
    return out;
  }, [part]);
  const have = useExistingRecordings(paths);
  const segments = useSegments(part.slug, have);
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
        <SpeedControl compact />
      </div>
      {admin && <LongRecordingsAdmin part={part.slug} have={have} paras={spoken} />}
      {part.sections.map((sec, s) => (
        <section key={s} id={`s-${s + 1}`} className="scroll-mt-40 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 dir="rtl" lang="he" className="mb-2 border-b border-stone-100 pb-2 font-hebrew text-2xl font-semibold text-amber-800">
            {sec.he}
          </h2>
          <div dir="rtl" lang="he" style={{ fontSize: `${1.35 * zoom}rem` }}>
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
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
