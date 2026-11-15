"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import type { TorahToken, TorahVerse } from "@/data/torah";
import { renderHebrew, type DisplayOptions } from "@/lib/hebrew/marks";
import { WithMaamid } from "@/components/reader/Maamid";

const heb = (t: string, o: DisplayOptions) => <WithMaamid text={renderHebrew(t, o)} source={t} />;
import { taamOfWord } from "@/lib/hebrew/taam-of-word";
import { DisplayModeToggle, type ReaderSettings } from "@/components/reader/DisplayModeToggle";
import { ScrollPages } from "./ScrollPages";
import type { ScrollColumn } from "@/lib/torah/scroll-pages";

export interface AliyahSection {
  id: string;
  en: string;
  he: string;
  range: string;
  verses: TorahVerse[];
  /** "c:v" where the Maftir starts inside this aliyah, if it does. */
  maftirFrom?: string;
}

interface Props {
  sections: AliyahSection[];
  /** "c:v" → practice lesson path, for pesukim that have a trainer. */
  practice: Record<string, string>;
  /** The parasha's columns in the Sefer Torah, shown in Torah Scroll Mode. */
  scrollColumns?: ScrollColumn[];
}

/** Draw {large} and [small] letters, then strip marks per the settings. */
function Letters({ text, opts }: { text: string; opts: { showNikkud: boolean; showTeamim: boolean } }) {
  const parts = text.split(/(\{[^}]*\}|\[[^\]]*\])/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("{") ? (
          <span key={i} className="text-[1.45em] leading-none">
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
}: {
  token: TorahToken;
  pesikAfter: boolean;
  settings: ReaderSettings;
}) {
  const scroll = settings.scrollMode;
  const opts = scroll ? { showNikkud: false, showTeamim: false } : { showNikkud: settings.showNikkud, showTeamim: settings.showTeamim };
  // In the scroll, the ketiv is written; when reading aloud, the qere is said.
  const isKq = typeof token !== "string";
  const text = isKq ? (scroll ? token.k : token.q) : token;
  const taam = !scroll && settings.showTaamNames ? taamOfWord(isKq ? token.q : token, pesikAfter) : undefined;
  const pesikWord = taam?.id === "shofar-holekh-pesik" && !/[{}[\]]/.test(text);
  const body = (
    <>
      {pesikWord ? <PesikLetter text={text} opts={opts} /> : <Letters text={text} opts={opts} />}
      {isKq && !scroll && (
        <span className="mx-0.5 align-middle font-sans text-[0.4em] text-stone-400" title="Ketiv: as written in the Sefer Torah">
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
            <Word token={tok} pesikAfter={verse.t[i + 1] === "|"} settings={settings} />{" "}
          </Fragment>
        );
      })}
      {verse.br === "p" && <span className="block h-3" aria-hidden />}
      {verse.br === "s" && <span className="inline-block w-[3em]" aria-hidden />}
    </>
  );
}

/** The text of a parasha, aliyah by aliyah, with the reader switches. */
export function TorahText({ sections, practice, scrollColumns }: Props) {
  const [settings, setSettings] = useState<ReaderSettings>({
    scrollMode: false,
    showNikkud: true,
    showTeamim: true,
    showTaamNames: false,
  });
  const scroll = settings.scrollMode;

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 sm:top-[3.4rem] rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <DisplayModeToggle value={settings} onChange={setSettings} />
        {settings.showTaamNames && !scroll && (
          <p className="mt-2 text-xs text-stone-500">
            <span className="font-semibold text-amber-700">Shofar Holekh with Pesik:</span> when a pesik (׀) follows a word
            with Shofar Holekh, that word is sung with the Pesik sound, on the letter that has the Shofar Holekh under
            it (highlighted).
          </p>
        )}
      </div>

      {scroll && scrollColumns?.length ? <ScrollPages columns={scrollColumns} /> : null}

      {!(scroll && scrollColumns?.length) && sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-20 sm:scroll-mt-36 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 border-b border-stone-100 pb-2">
            <h3 className="text-base font-semibold text-stone-900">
              {s.en} <span className="ms-2 text-sm font-normal tabular-nums text-stone-500">{s.range}</span>
            </h3>
            <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
              {s.he}
            </span>
          </div>
          <div
            dir="rtl"
            lang="he"
            className={`hebrew-text text-right sm:text-justify ${
              scroll
                ? "rounded-xl bg-[#f6eedd] px-4 py-5 font-scroll text-[1.9rem] leading-[1.9] text-stone-900 sm:text-[2.1rem]"
                : `font-hebrew text-[1.55rem] text-stone-900 sm:text-[1.9rem] ${settings.showTaamNames ? "leading-[2.6]" : "leading-[2.1]"}`
            }`}
          >
            {s.verses.map((v) => {
              const key = `${v.c}:${v.v}`;
              return (
                <Fragment key={key}>
                  {s.maftirFrom === key && (
                    <span className="mx-1 inline-block rounded bg-stone-100 px-2 align-middle font-sans text-[0.4em] text-stone-600" dir="ltr">
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
