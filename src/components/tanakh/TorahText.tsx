"use client";

import { Fragment, useState } from "react";
import { useZoom, ZoomControl, zoomWidth } from "@/components/reader/Zoom";
import Link from "next/link";
import type { TorahToken, TorahVerse } from "@/data/torah";
import { renderHebrew, type DisplayOptions } from "@/lib/hebrew/marks";
import { WithMaamid } from "@/components/reader/Maamid";

const heb = (t: string, o: DisplayOptions) => <WithMaamid text={renderHebrew(t, o)} source={t} />;
import { emetTeamim, taamOfWord } from "@/lib/hebrew/taam-of-word";
import type { TaamReference } from "@/data/teamim-reference";
import { DisplayModeToggle, type ReaderSettings } from "@/components/reader/DisplayModeToggle";
import { ScrollPages } from "./ScrollPages";
import { Recording } from "@/components/audio/Recording";
import { SpeedControl } from "@/components/audio/SpeedControl";
import { TaamPractice } from "./TaamPractice";
import { useExistingRecordings } from "@/lib/recordings";
import { AdminDrop } from "@/components/admin/AdminDrop";
import type { ScrollColumn } from "@/lib/torah/scroll-pages";

export interface AliyahSection {
  id: string;
  en: string;
  he: string;
  range: string;
  verses: TorahVerse[];
  /** "c:v" where the Maftir starts inside this aliyah, if it does. */
  maftirFrom?: string;
  /** The Hazzan's recording of this section (shown when it's been uploaded). */
  recording?: string;
  maftirRecording?: string;
}

interface Props {
  sections: AliyahSection[];
  /** "c:v" → practice lesson path, for pesukim that have a trainer. */
  practice: Record<string, string>;
  /** The parasha's columns in the Sefer Torah, shown in Torah Scroll Mode. */
  scrollColumns?: ScrollColumn[];
  /** Parasha pages: the aliyot to jump to, for Shabbat and for weekdays. */
  nav?: { shabbat: NavItem[]; weekday?: NavItem[] };
  /** The weekday reading as text sections (Kohen, Levi, Yisrael). */
  weekdaySections?: AliyahSection[];
  /** The haftarah, shown after the aliyot. */
  haftarah?: AliyahSection;
  /** false = no Scroll Mode (Nevi'im and most of Ketuvim). */
  allowScroll?: boolean;
  scrollLabel?: string;
}

/** Draw {large} and [small] letters, then strip marks per the settings. */
function Letters({ text, opts }: { text: string; opts: { showNikkud: boolean; showTeamim: boolean } }) {
  const parts = text.split(/(\{[^}]*\}|\[[^\]]*\]|<[^>]*>)/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("{") ? (
          <span key={i} className="text-[1.45em] leading-none">
            {heb(p.slice(1, -1), opts)}
          </span>
        ) : p.startsWith("<") ? (
          <span key={i} className="relative -top-[0.45em] text-[0.7em]" title="A raised (hanging) letter">
            {heb(p.slice(1, -1), opts)}
          </span>
        ) : p.startsWith("[") ? (
          <span key={i} className="text-[0.65em]">
            {heb(p.slice(1, -1), opts)}
          </span>
        ) : (
          <Fragment key={i}>{heb(p, opts)}</Fragment>
        ),
      )}
    </>
  );
}

/** A Shofar Holekh word before a pesik: highlight the letter with the Shofar Holekh, where the Pesik sound goes. */
function PesikLetter({ text, opts }: { text: string; opts: { showNikkud: boolean; showTeamim: boolean } }) {
  const chars = [...text];
  const mark = chars.indexOf("\u05A3");
  if (mark < 0) return <>{heb(text, opts)}</>;
  let start = mark;
  while (start > 0 && !(chars[start] >= "\u05D0" && chars[start] <= "\u05EA")) start--;
  let end = mark + 1;
  while (end < chars.length && !(chars[end] >= "\u05D0" && chars[end] <= "\u05EA")) end++;
  return (
    <>
      {heb(chars.slice(0, start).join(""), opts)}
      <span className="rounded bg-amber-200/80" title="The Pesik sound goes on this letter">
        {heb(chars.slice(start, end).join(""), opts)}
      </span>
      {heb(chars.slice(end).join(""), opts)}
    </>
  );
}

function Word({
  token,
  pesikAfter,
  settings,
  emet,
}: {
  token: TorahToken;
  pesikAfter: boolean;
  settings: ReaderSettings;
  /** Ta'amei Emet books: the ta'am worked out for the whole pasuk (null = none). */
  emet?: TaamReference | null;
}) {
  const scroll = settings.scrollMode;
  const opts = scroll ? { showNikkud: false, showTeamim: false } : { showNikkud: settings.showNikkud, showTeamim: settings.showTeamim };
  // In the scroll, the ketiv is written; when reading aloud, the qere is said.
  const isKq = typeof token !== "string";
  const text = isKq ? (scroll ? token.k : token.q) : token;
  // Written but not read (ketiv without qere): only in the scroll; read but not written: only aloud.
  if (isKq && !text && !(!scroll && token.k)) return null;
  const taam =
    !scroll && settings.showTaamNames
      ? emet !== undefined
        ? (emet ?? undefined)
        : taamOfWord(isKq ? token.q : token, pesikAfter)
      : undefined;
  const pesikWord = taam?.id === "shofar-holekh-pesik" && !/[{}[\]]/.test(text);
  const body = (
    <>
      {pesikWord ? <PesikLetter text={text} opts={opts} /> : <Letters text={text} opts={opts} />}
      {isKq && !scroll && token.k && (
        <span
          className="mx-0.5 align-middle font-sans text-[0.4em] text-stone-400"
          title={token.q ? "Ketiv: as written" : "Written, but not read aloud"}
        >
          ({token.k})
        </span>
      )}
    </>
  );
  if (!taam) return <span>{body}</span>;
  return (
    <span className="inline-flex flex-col items-center align-top">
      <span>{body}</span>
      <span
        className={`-mt-2 font-sans text-[0.32em] leading-tight ${taam.id === "shofar-holekh-pesik" ? "font-semibold text-amber-700" : "text-stone-500"}`}
        dir="ltr"
      >
        {taam.syrian}
      </span>
    </span>
  );
}

function Verse({ verse, settings, practiceHref }: { verse: TorahVerse; settings: ReaderSettings; practiceHref?: string }) {
  const scroll = settings.scrollMode;
  // Tehillim, Mishlei and Iyov: the Emet ta'am of each word needs the whole pasuk.
  let emet: (TaamReference | undefined)[] | undefined;
  if (verse.e && !scroll && settings.showTaamNames) {
    const idx: number[] = [];
    const words: string[] = [];
    const pes: boolean[] = [];
    verse.t.forEach((tok, i) => {
      if (typeof tok === "string" && (tok === "|" || tok === "_" || tok.startsWith("¶") || tok === "׆")) return;
      idx.push(i);
      words.push(typeof tok === "string" ? tok : tok.q);
      pes.push(verse.t[i + 1] === "|");
    });
    const names = emetTeamim(words, pes);
    emet = [];
    idx.forEach((i, n) => (emet![i] = names[n]));
  }
  return (
    <>
      {!scroll && (
        <sup className="mx-1 select-none font-sans text-[0.38em] text-stone-400" dir="ltr">
          {verse.v === 1 ? `${verse.c}:${verse.v}` : verse.v}
        </sup>
      )}
      {practiceHref && !scroll && (
        <Link
          href={practiceHref}
          className="mx-1 inline-block rounded bg-amber-700 px-1.5 py-0.5 align-middle font-sans text-[0.32em] font-medium text-white hover:bg-amber-800"
          dir="ltr"
        >
          Practice
        </Link>
      )}
      {verse.t.map((tok, i) => {
        // The pesik is a reading mark: not written in a Sefer Torah.
        if (tok === "|") return scroll ? null : <span key={i} className="text-stone-400"> ׀ </span>;
        if (tok === "_") return <span key={i} className="inline-block w-[2em]" />;
        if (tok === "׆") return <span key={i}> ׆ </span>;
        if (tok === "¶p") return <span key={i} className="block h-2" />;
        if (tok === "¶s") return <span key={i} className="inline-block w-[3em]" />;
        return (
          <Fragment key={i}>
            <Word
              token={tok}
              pesikAfter={verse.t[i + 1] === "|"}
              settings={settings}
              emet={emet ? (emet[i] ?? null) : undefined}
            />{" "}
          </Fragment>
        );
      })}
      {verse.br === "p" && <span className="block h-3" aria-hidden />}
      {verse.br === "s" && <span className="inline-block w-[3em]" aria-hidden />}
    </>
  );
}

export interface NavItem {
  /** Element id to jump to ("aliyah-3", "maftir", "haftarah"). */
  id: string;
  label: string;
  /** First and last pasuk ("c:v"); none for the haftarah. */
  from?: string;
  to?: string;
}

const posOf = (cv: string) => {
  const [c, v] = cv.split(":").map(Number);
  return c * 1000 + v;
};

/** The text of a parasha, aliyah by aliyah, with the reader switches. */
export function TorahText({
  sections: shabbatSections,
  practice,
  scrollColumns,
  allowScroll = true,
  scrollLabel,
  nav,
  weekdaySections,
  haftarah,
}: Props) {
  const [division, setDivision] = useState<"shabbat" | "weekday">("shabbat");
  const [focus, setFocus] = useState<string | null>(null);
  const items = (division === "weekday" ? nav?.weekday : nav?.shabbat) ?? [];
  const focusItem = items.find((x) => x.id === focus);
  const sections =
    division === "weekday" && weekdaySections ? weekdaySections : haftarah ? [...shabbatSections, haftarah] : shabbatSections;
  const marks: [number, string][] = items.filter((x) => x.from).map((x) => [posOf(x.from!), x.label]);
  const scrollFocus: [number, number] | null = focusItem?.from && focusItem.to ? [posOf(focusItem.from), posOf(focusItem.to)] : null;
  const pick = (id: string | null) => {
    setFocus(id);
    const it = items.find((x) => x.id === id);
    if (id)
      setTimeout(() => {
        const el =
          (scroll && it?.from && document.querySelector(`[data-pos="${posOf(it.from)}"]`)) || document.getElementById(id);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
  };
  const [settings, setSettings] = useState<ReaderSettings>({
    scrollMode: false,
    showNikkud: true,
    showTeamim: true,
    showTaamNames: false,
  });
  const scroll = settings.scrollMode;
  const [zoom, setZoom] = useZoom();
  const wanted = [...shabbatSections, ...(weekdaySections ?? []), ...(haftarah ? [haftarah] : [])].flatMap((x) => [x.recording, x.maftirRecording]).filter((p): p is string => !!p);
  const have = useExistingRecordings(wanted);

  return (
    <div className="space-y-4" style={scroll && scrollColumns?.length ? undefined : zoomWidth(zoom)}>
      <div className="sticky top-0 z-10 -mx-1 sm:top-[3.4rem] rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DisplayModeToggle value={settings} onChange={setSettings} noScroll={!allowScroll} scrollLabel={scrollLabel} />
          <ZoomControl zoom={zoom} onChange={setZoom} />
        </div>
        {nav && (
          <div className="mt-3 border-t border-stone-100 pt-3">
            {nav.weekday && (
              <div className="mb-2 inline-flex rounded-lg border border-stone-300 p-0.5 text-xs" role="group" aria-label="Which aliyot">
                {(
                  [
                    ["shabbat", "Shabbat aliyot"],
                    ["weekday", "Weekday aliyot (Monday, Thursday, Shabbat Minha)"],
                  ] as const
                ).map(([d, l]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDivision(d);
                      setFocus(null);
                    }}
                    className={`rounded-md px-2.5 py-1 font-medium ${division === d ? "bg-amber-700 text-white" : "text-stone-700"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            <nav aria-label="Aliyot" className="flex flex-wrap gap-1.5 text-sm">
              <button
                type="button"
                onClick={() => pick(null)}
                className={`rounded-full px-3 py-1 shadow-sm ring-1 ${focus === null ? "bg-amber-700 text-white ring-amber-700" : "bg-white text-stone-700 ring-stone-200 hover:bg-amber-50"}`}
              >
                All
              </button>
              {items.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => pick(a.id)}
                  className={`rounded-full px-3 py-1 shadow-sm ring-1 ${focus === a.id ? "bg-amber-700 text-white ring-amber-700" : "bg-white text-stone-700 ring-stone-200 hover:bg-amber-50"}`}
                >
                  {a.label}
                </button>
              ))}
            </nav>
          </div>
        )}
        {settings.showTaamNames && !scroll && !sections.some((x) => x.verses.some((v) => v.e)) && (
          <p className="mt-2 text-xs text-stone-500">
            <span className="font-semibold text-amber-700">Shofar Holekh with Pesik:</span> when a pesik (׀) follows a word
            with Shofar Holekh, that word is sung with the Pesik sound, on the letter that has the Shofar Holekh under
            it (highlighted).
          </p>
        )}
      </div>

      {scroll && scrollColumns?.length && focus !== "haftarah" ? (
        <ScrollPages columns={scrollColumns} zoom={zoom} marks={marks} focus={scrollFocus} />
      ) : null}

      {/* In scroll mode the haftarah (not in the Sefer Torah) is shown as text when it's picked. */}
      {(scroll && scrollColumns?.length ? (focus === "haftarah" && haftarah ? [haftarah] : []) : sections).map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 sm:scroll-mt-36 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-2">
            <h3 className="text-base font-semibold text-stone-900">
              {s.en} <span className="ms-2 text-sm font-normal tabular-nums text-stone-500">{s.range}</span>
            </h3>
            <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
              {s.he}
            </span>
          </div>
          {have && (
            <SectionAudio
              items={[
                { src: s.recording, label: s.en },
                { src: s.maftirRecording, label: "Maftir" },
              ].filter((x): x is { src: string; label: string } => !!x.src && have.has(x.src))}
            />
          )}
          {s.recording && (
            <div className="mb-2 flex flex-wrap gap-2">
              <AdminDrop path={s.recording} compact label={`${s.en}: drop the Hazzan's reading here`} />
              {s.maftirRecording && <AdminDrop path={s.maftirRecording} compact label="Maftir: drop the reading here" />}
            </div>
          )}
          <div
            dir="rtl"
            lang="he"
            className={`hebrew-text text-right sm:text-justify ${
              scroll
                ? "rounded-xl bg-[#f6eedd] px-4 py-5 font-scroll text-[1.9rem] leading-[1.9] text-stone-900 sm:text-[2.1rem]"
                : `font-hebrew text-[1.55rem] text-stone-900 sm:text-[1.9rem] ${settings.showTaamNames ? "leading-[2.6]" : "leading-[2.1]"}`
            }`}
            style={zoom !== 1 ? { fontSize: `calc(${zoom} * ${scroll ? "clamp(1.9rem, 4vw, 2.1rem)" : "clamp(1.55rem, 4vw, 1.9rem)"})` } : undefined}
          >
            {s.verses.map((v) => {
              const key = `${v.c}:${v.v}`;
              return (
                <Fragment key={key}>
                  {s.maftirFrom === key && (
                    <span
                      id="maftir"
                      className="mx-1 inline-block scroll-mt-40 rounded bg-amber-100 px-2 align-middle font-sans text-[0.4em] font-semibold text-amber-900"
                      dir="ltr"
                    >
                      Maftir ↓
                    </span>
                  )}
                  <Verse verse={v} settings={settings} practiceHref={practice[key]} />
                </Fragment>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The Hazzan reading this section: listen (at any speed), then read it yourself and get a score. */
function SectionAudio({ items }: { items: { src: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-3 space-y-2 rounded-xl bg-amber-50/70 p-3">
      {items.map((it) => (
        <div key={it.src} className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-stone-800">🔊 {it.label}: the Hazzan</span>
          <Recording src={it.src} className="h-9 w-full max-w-md" />
          <TaamPractice src={it.src} label={it.label} long buttonLabel={`Read ${it.label} yourself`} />
        </div>
      ))}
      <SpeedControl />
    </div>
  );
}
