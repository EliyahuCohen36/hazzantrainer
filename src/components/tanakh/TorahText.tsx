"use client";

import { Fragment, useState, useEffect } from "react";
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
import { TaamSubmit } from "./TaamSubmit";
import { useExistingRecordings } from "@/lib/recordings";
import { AdminDrop } from "@/components/admin/AdminDrop";
import { BookmarkButton } from "@/lib/bookmarks";
import { useLang } from "@/lib/i18n/Translator";
import { usePathname } from "next/navigation";
import type { ScrollColumn } from "@/lib/torah/scroll-pages";

export interface AliyahSection {
  /** The book these pesukim are from, when not the page's book (the haftarah). */
  book?: string;
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
  /** The book (for the translation under each pasuk). */
  book?: string;
  /** The page's name, for bookmarks ("Noah", "Yehoshua 3"). */
  title?: string;
  /** false = no Scroll Mode (Nevi'im and most of Ketuvim). */
  allowScroll?: boolean;
  scrollLabel?: string;
}

/** Hebrew only, or the reader's language under each pasuk (remembered per browser). */
function useTanakhTranslation(lang: string, books: string[], on: boolean) {
  const [data, setData] = useState<Record<string, Record<string, string>>>({});
  const tl = lang === "en" || lang === "ar" ? lang : null;
  const key = books.join(",");
  useEffect(() => {
    if (!tl || !on) return;
    let live = true;
    books.forEach((b) =>
      import(`@/data/tanakh-tr/${tl}/${b}.json`)
        .then((m) => live && setData((d) => ({ ...d, [`${tl}:${b}`]: (m.default ?? m) as Record<string, string> })))
        .catch(() => {}),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tl, key, on]);
  return (book: string | undefined, v: TorahVerse): string | undefined => {
    if (!tl || !on || !book) return undefined;
    const d = data[`${tl}:${book}`];
    if (!d) return undefined;
    const s = (v as TorahVerse & { s?: number }).s;
    return d[`${v.c}:${v.v}`] ?? d[`${s ?? 0}:${v.c}:${v.v}`];
  };
}

function useShowTr(): [boolean, (v: boolean) => void] {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem("kriah-tanakh-translation") === "1");
    } catch {}
  }, []);
  return [
    show,
    (v) => {
      setShow(v);
      try {
        localStorage.setItem("kriah-tanakh-translation", v ? "1" : "0");
      } catch {}
    },
  ];
}

const ALIYAH_LABELS: Record<string, [string, string]> = {
  Kohen: ["כהן", "كوهين"],
  Levi: ["לוי", "ليڤي"],
  Yisrael: ["ישראל", "يسرائيل"],
  Shelishi: ["שלישי", "شليشي"],
  "Revi'i": ["רביעי", "ربيعي"],
  Hamishi: ["חמישי", "حميشي"],
  Shishi: ["שישי", "شيشي"],
  "Shevi'i": ["שביעי", "شبيعي"],
  Maftir: ["מפטיר", "مفطير"],
};

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
      {!scroll && <span id={`v-${verse.c}-${verse.v}`} className="pasuk-anchor" />}
      {!scroll && (
        <sup className="mx-1 select-none font-sans text-[0.38em] text-stone-400" dir="ltr">
          {verse.v === 1 ? `${verse.c}:${verse.v}` : verse.v}
        </sup>
      )}
      {/* No "Practice" (singing) button by the pasuk any more (owner, Nov 24). */}
      {verse.t.map((tok, i) => {
        // The pesik is a reading mark: not written in a Sefer Torah.
        if (tok === "|") return scroll ? null : <span key={i} className="font-bold text-stone-900"> ׀ </span>;
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
  title,
  book,
}: Props) {
  const pathname = usePathname();
  const [division, setDivision] = useState<"shabbat" | "weekday">("shabbat");
  const [focus, setFocus] = useState<string | null>(null);
  const items = (division === "weekday" ? nav?.weekday : nav?.shabbat) ?? [];
  const focusItem = items.find((x) => x.id === focus);
  const sections =
    division === "weekday" && weekdaySections ? weekdaySections : haftarah ? [...shabbatSections, haftarah] : shabbatSections;
  const { lang } = useLang();
  // Scroll mode: the vowelled text beside the scroll, like a tikkun (off on phones at first), or one side at a
  // time where a tap on the page switches sides (owner, Nov 24).
  const [scrollView, setScrollView] = useState<"beside" | "tap" | "off">("beside");
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setScrollView("tap");
  }, []);
  const tikkun = scrollView === "beside";
  const tap = scrollView === "tap";
  const [vowelSide, setVowelSide] = useState(false);
  const [showTr, setShowTr] = useShowTr();
  const trBooks = Array.from(new Set([book, haftarah?.book].filter((b): b is string => !!b)));
  const trOf = useTanakhTranslation(lang, trBooks, showTr);
  const trLang = lang === "en" || lang === "ar" ? lang : null;
  // The aliyah names written in the scroll, in the reader's language.
  const marks: [number, string][] = items
    .filter((x) => x.from)
    .map((x) => [posOf(x.from!), lang === "en" ? x.label : (ALIYAH_LABELS[x.label]?.[lang === "he" ? 0 : 1] ?? x.label)]);
  // Weekday reading with "All": only the weekday reading stands out, the rest of the parasha is faded.
  const weekdayAll =
    division === "weekday" && !focusItem && items.length && items[0].from && items[items.length - 1].to
      ? ([posOf(items[0].from!), posOf(items[items.length - 1].to!)] as [number, number])
      : null;
  const scrollFocus: [number, number] | null =
    focusItem?.from && focusItem.to ? [posOf(focusItem.from), posOf(focusItem.to)] : weekdayAll;
  const pick = (id: string | null) => {
    setBarOpen(false); // fold the bar away so the text has the room
    setFocus(id);
    const it = items.find((x) => x.id === id);
    if (id)
      setTimeout(() => {
        const el =
          (scroll && it?.from && document.querySelector(`[data-pos="${posOf(it.from)}"]`)) || document.getElementById(id);
        if (!el) return;
        // To the START of the aliyah (owner, Nov 21), just under the bars that stay at the top of the screen.
        const below = [...document.querySelectorAll<HTMLElement>("[class*='sticky']")].reduce((m, b) => {
          const cs = getComputedStyle(b);
          if (cs.position !== "sticky") return m;
          const h = b.getBoundingClientRect().height;
          return h < window.innerHeight / 2 ? Math.max(m, (parseFloat(cs.top) || 0) + h) : m;
        }, 0);
        const target = el.getBoundingClientRect().top + window.scrollY - below - (scroll ? 70 : 12);
        window.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
      }, 80);
  };
  const [settings, setSettingsState] = useState<ReaderSettings>({
    scrollMode: false,
    showNikkud: true,
    showTeamim: true,
    showTaamNames: false,
  });
  // Remembered per browser (owner, Nov 25): Torah Scroll Mode stays on when going to another parasha.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("torah-reader-settings") ?? "null") as Partial<ReaderSettings> | null;
      if (saved) setSettingsState((s0) => ({ ...s0, ...saved, scrollMode: !!saved.scrollMode && allowScroll }));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const setSettings = (s1: ReaderSettings) => {
    setSettingsState(s1);
    try {
      localStorage.setItem("torah-reader-settings", JSON.stringify(s1));
    } catch {}
  };
  const scroll = settings.scrollMode;
  // The bar with the aliyot and the display switches folds away into a small button (owner, Nov 25).
  const [barOpen, setBarOpen] = useState(false);
  // "Find a pasuk" links (#v-<perek>-<pasuk>): go to that pasuk once the page is drawn, and mark it for a moment.
  useEffect(() => {
    const go = () => {
      const m = /^#v-(\d+)-(\d+)$/.exec(location.hash);
      if (!m) return;
      const jump = () => {
        const el = (settings.scrollMode && document.querySelector(`[data-pos="${Number(m[1]) * 1000 + Number(m[2])}"]`)) || document.getElementById(`v-${m[1]}-${m[2]}`);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: Math.max(0, top) });
        el.classList.add("pasuk-flash");
        setTimeout(() => el.classList.remove("pasuk-flash"), 3500);
      };
      setTimeout(jump, 150);
      setTimeout(jump, 900);
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, [settings.scrollMode]);
  const [zoom, setZoom] = useZoom();
  const wanted = [...shabbatSections, ...(weekdaySections ?? []), ...(haftarah ? [haftarah] : [])].flatMap((x) => [x.recording, x.maftirRecording]).filter((p): p is string => !!p);
  const have = useExistingRecordings(wanted);

  return (
    <div className="space-y-4" style={scroll && scrollColumns?.length ? undefined : zoomWidth(zoom)}>
      {!barOpen && (
        <div className="sticky top-0 z-10 flex justify-end sm:top-[3.4rem]">
          <button
            type="button"
            onClick={() => setBarOpen(true)}
            className="rounded-full border border-amber-300 bg-white/95 px-4 py-1.5 text-sm font-semibold text-amber-900 shadow-sm backdrop-blur hover:bg-amber-50"
          >
            {allowScroll ? "☰ Aliyot, scroll mode & settings" : "☰ Aliyot & settings"}
            {focusItem ? <span className="ms-1 font-normal text-stone-600">· {focusItem.label}</span> : null}
          </button>
        </div>
      )}
      <div className={barOpen ? "sticky top-0 z-10 -mx-1 sm:top-[3.4rem] rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur" : "hidden"}>
        <div className="mb-2 flex justify-end">
          <button type="button" onClick={() => setBarOpen(false)} className="rounded-full px-3 py-0.5 text-sm text-stone-500 ring-1 ring-stone-200 hover:bg-stone-50">
            ▲ Hide
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DisplayModeToggle value={settings} onChange={setSettings} noScroll={!allowScroll} scrollLabel={scrollLabel} />
          {scroll && (
            <div className="flex overflow-hidden rounded-full text-sm ring-1 ring-amber-300" role="group" aria-label="Nekudot and te'amim">
              {(
                [
                  ["beside", "Vowels beside (tikkun)"],
                  ["tap", "Tap to switch"],
                  ["off", "Scroll only"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={scrollView === id}
                  onClick={() => setScrollView(id)}
                  className={`px-3 py-1 ${scrollView === id ? "bg-amber-700 text-white" : "bg-white text-amber-900"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          <ZoomControl zoom={zoom} onChange={setZoom} />
          {trLang && !scroll && book && (
            <div className="flex overflow-hidden rounded-full text-sm ring-1 ring-amber-300" role="group" aria-label="Translation">
              <button type="button" onClick={() => setShowTr(false)} className={`px-3 py-1 ${!showTr ? "bg-amber-700 text-white" : "bg-white text-amber-900"}`}>
                Hebrew only
              </button>
              <button type="button" onClick={() => setShowTr(true)} className={`px-3 py-1 ${showTr ? "bg-amber-700 text-white" : "bg-white text-amber-900"}`}>
                {trLang === "ar" ? "Arabic + Hebrew" : "English + Hebrew"}
              </button>
            </div>
          )}
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

      {scroll && have && (
        <ScrollAudioPanel
          items={sections.flatMap((x) =>
            [
              { src: x.recording, label: x.en, he: x.he },
              { src: x.maftirRecording, label: "Maftir", he: "מפטיר" },
            ].filter((y): y is { src: string; label: string; he: string } => !!y.src && have.has(y.src)),
          )}
        />
      )}

      {scroll && scrollColumns?.length && focus !== "haftarah" ? (
        <ScrollPages columns={scrollColumns} zoom={zoom} marks={marks} focus={scrollFocus} tikkun={tikkun} flip={tap} />
      ) : null}

      {/* In scroll mode the haftarah (not in the Sefer Torah) is shown as text when it's picked. */}
      {(scroll && scrollColumns?.length ? (focus === "haftarah" && haftarah ? [haftarah] : []) : sections).map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 sm:scroll-mt-36 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-2">
            <h3 className="flex flex-wrap items-baseline gap-2 text-base font-semibold text-stone-900">
              {s.en} <span className="text-sm font-normal tabular-nums text-stone-500">{s.range}</span>
              {title && <BookmarkButton kind="tanakh" href={`${pathname}#${s.id}`} label={`${title} · ${s.en}`} he={s.he} />}
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
              <AdminDrop
                path={s.recording}
                compact
                exists={!!have?.has(s.recording)}
                label={have?.has(s.recording) ? `${s.en}: drop a new reading to replace it` : `${s.en}: drop the Hazzan's reading here`}
              />
              {s.maftirRecording && (
                <AdminDrop
                  path={s.maftirRecording}
                  compact
                  exists={!!have?.has(s.maftirRecording)}
                  label={have?.has(s.maftirRecording) ? "Maftir: drop a new reading to replace it" : "Maftir: drop the reading here"}
                />
              )}
            </div>
          )}
          <div className={scroll && tikkun ? "grid gap-3 md:grid-cols-2" : ""}>
          {scroll && tikkun && (
            <div
              dir="rtl"
              lang="he"
              className="hebrew-text rounded-xl bg-white px-4 py-5 text-right font-hebrew leading-[2.1] text-stone-900 ring-1 ring-stone-200 sm:text-justify md:order-2"
              style={{ fontSize: `calc(${zoom} * clamp(1.3rem, 3vw, 1.6rem))` }}
            >
              {s.verses.map((v) => (
                <Verse key={`${v.c}:${v.v}`} verse={v} settings={{ ...settings, scrollMode: false, showTaamNames: false }} />
              ))}
            </div>
          )}
          <div
            dir="rtl"
            lang="he"
            onClick={scroll && tap ? () => setVowelSide((x) => !x) : undefined}
            title={scroll && tap ? (vowelSide ? "Tap to see the scroll" : "Tap to see the nekudot and te'amim") : undefined}
            className={`hebrew-text text-right sm:text-justify md:order-1 ${scroll && tap ? "cursor-pointer select-none" : ""} ${
              scroll && !(tap && vowelSide)
                ? "rounded-xl bg-[#f6eedd] px-4 py-5 font-scroll text-[1.9rem] leading-[1.9] text-stone-900 sm:text-[2.1rem]"
                : `font-hebrew text-[1.55rem] text-stone-900 sm:text-[1.9rem] ${settings.showTaamNames ? "leading-[2.6]" : "leading-[2.1]"}`
            }`}
            style={
              zoom !== 1
                ? { fontSize: `calc(${zoom} * ${scroll && !(tap && vowelSide) ? "clamp(1.9rem, 4vw, 2.1rem)" : "clamp(1.55rem, 4vw, 1.9rem)"})` }
                : undefined
            }
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
                  {(() => {
                    const tr = !scroll ? trOf(s.book ?? book, v) : undefined;
                    if (scroll && tap && vowelSide) return <Verse verse={v} settings={{ ...settings, scrollMode: false, showTaamNames: false }} />;
                    if (!tr) return <Verse verse={v} settings={settings} practiceHref={practice[key]} />;
                    return (
                      <span className="mb-3 block">
                        <span className="block">
                          <Verse verse={v} settings={settings} practiceHref={practice[key]} />
                        </span>
                        <span
                          lang={trLang ?? undefined}
                          dir={trLang === "ar" ? "rtl" : "ltr"}
                          data-no-translate
                          className={`block font-sans text-[0.5em] leading-relaxed text-stone-600 ${trLang === "ar" ? "text-right" : "text-left"}`}
                        >
                          {tr}
                        </span>
                      </span>
                    );
                  })()}
                </Fragment>
              );
            })}
          </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * In Torah Scroll Mode the aliyot are not shown one by one, so the Hazzan's readings sit in a panel at the side
 * of the screen (owner, Nov 24): listen to an aliyah while looking at the tikkun.
 */
function ScrollAudioPanel({ items }: { items: { src: string; label: string; he: string }[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;
  return (
    <div className="fixed right-0 top-1/3 z-30 flex items-start" dir="ltr">
      {open && (
        <div className="max-h-[60vh] w-72 max-w-[85vw] overflow-y-auto rounded-l-2xl border border-r-0 border-amber-200 bg-white/95 p-3 shadow-xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-stone-900">🔊 The Hazzan reads</span>
            <button type="button" onClick={() => setOpen(false)} className="px-1 text-stone-500" aria-label="Close">
              ✕
            </button>
          </div>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.src}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-stone-800">{it.label}</span>
                  <span dir="rtl" lang="he" className="font-hebrew text-amber-800">
                    {it.he}
                  </span>
                </div>
                <Recording src={it.src} className="h-8 w-full" />
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <SpeedControl compact />
          </div>
        </div>
      )}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-l-xl bg-amber-700 px-2 py-3 text-sm font-semibold text-white shadow-lg [writing-mode:vertical-rl]"
        >
          🔊 Hear the Hazzan
        </button>
      )}
    </div>
  );
}

/** The Hazzan reading this section: listen (at any speed). School students can record it for their teacher to grade. */
function SectionAudio({ items }: { items: { src: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-3 space-y-2 rounded-xl bg-amber-50/70 p-3">
      {items.map((it) => (
        <div key={it.src} className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-stone-800">🔊 {it.label}: the Hazzan</span>
          <Recording src={it.src} className="h-9 w-full max-w-md" />
          <TaamSubmit src={it.src} label={it.label} tune="reading" studentsOnly compact />
        </div>
      ))}
      <SpeedControl />
    </div>
  );
}
