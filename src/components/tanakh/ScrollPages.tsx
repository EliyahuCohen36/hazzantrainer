"use client";

import { Fragment, useEffect, useState } from "react";
import type { ScrollColumn, ScrollLine, ScrollPiece } from "@/lib/torah/scroll-pages";
import { WithMaamid } from "@/components/reader/Maamid";

const letterCount = (pieces: ScrollPiece[]) => pieces.reduce((n, p) => n + p.s.replace(/[{}[\]]/g, "").length, 0);
/** Lines with many letters are drawn a little smaller so every line fits, as a sofer stretches or squeezes. */
const FIT = 40;
/** Both sides use the same line height, so a line of the scroll sits level with the same line with vowels. */
const LINE = "6.3cqw";

function Big({ text }: { text: string }) {
  const parts = text.split(/(\{[^}]*\}|\[[^\]]*\])/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("{") ? (
          <span key={i} className="text-[1.5em] leading-none">
            {p.slice(1, -1)}
          </span>
        ) : p.startsWith("[") ? (
          <span key={i} className="text-[0.6em]">
            {p.slice(1, -1)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

function Piece({ p, vowels }: { p: ScrollPiece; vowels: boolean }) {
  const cls = p.in ? "" : "opacity-35";
  if (!vowels) return <span className={cls}><Big text={p.s} /></span>;
  return (
    <span className={cls}>
      <WithMaamid text={p.v.replace(/[{}[\]]/g, "")} />
    </span>
  );
}

function Line({ line, vowels }: { line: ScrollLine; vowels: boolean }) {
  const segs = line.segs.filter((s) => s.length);
  const n = letterCount(segs.flat());
  const style = n > FIT ? { fontSize: `${(100 * FIT) / n}%` } : undefined;
  const words = (s: ScrollPiece[]) => {
    if (!vowels) return s.map((p, i) => <Piece key={i} p={p} vowels={false} />);
    // With vowels, words joined by a maqaf stay together (in the scroll they're written apart).
    const groups: ScrollPiece[][] = [];
    for (const p of s) {
      const last = groups[groups.length - 1];
      if (last && last[last.length - 1].v.endsWith("\u05BE")) last.push(p);
      else groups.push([p]);
    }
    return groups.map((g, i) => (
      <span key={i}>
        {g.map((p, j) => (
          <Piece key={j} p={p} vowels />
        ))}
      </span>
    ));
  };

  let body: React.ReactNode;
  if (!segs.length) body = <span>&nbsp;</span>;
  else if (segs.length === 1 && !line.open && !line.song)
    // A full line: words spread from edge to edge.
    body = <div className="flex justify-between">{words(segs[0])}</div>;
  else if (segs.length === 1)
    // A petuha: the text, then the line stays open.
    body = <div className="flex gap-[0.32em]">{words(segs[0])}</div>;
  else
    // A setuma gap inside the line, or the parts of a song line.
    body = (
      <div className="flex justify-between gap-[2.2em]">
        {segs.map((s, i) => (
          <div key={i} className={`flex gap-[0.32em] ${line.song ? "" : "grow justify-between"}`}>
            {words(s)}
          </div>
        ))}
      </div>
    );
  return (
    <div className="relative whitespace-nowrap" style={style}>
      {line.mark && (
        <span
          className="absolute -top-[0.62em] left-0 rounded bg-amber-100 px-1 font-sans font-semibold leading-tight text-amber-900"
          dir="ltr"
          style={{ fontSize: "0.6rem" }}
        >
          {line.mark} ↓
        </span>
      )}
      {body}
    </div>
  );
}

function Column({ col, vowels }: { col: ScrollColumn; vowels: boolean }) {
  return (
    <div className="[container-type:inline-size]">
      <div
        dir="rtl"
        lang="he"
        className={
          vowels
            ? "hebrew-text rounded-lg border border-stone-200 bg-white px-[5%] py-4 font-hebrew text-[3.3cqw] text-stone-900"
            : "rounded-lg bg-[#f6eedd] px-[5%] py-4 font-scroll text-[3.6cqw] text-stone-900 shadow-[inset_0_0_40px_rgba(120,90,40,0.15)]"
        }
        style={{ lineHeight: LINE }}
      >
        {col.lines.map((l, i) => (
          <Line key={i} line={l} vowels={vowels} />
        ))}
      </div>
    </div>
  );
}

/**
 * The parasha as it stands in a Sefer Torah: whole columns of the standard
 * 245-column, 42-line scroll, line for line. Like a tikkun, the same column can
 * be shown with vowels and te'amim beside it. Words outside the parasha are pale.
 */
export function ScrollPages({ columns }: { columns: ScrollColumn[] }) {
  // Side by side on wide screens; on a phone, the scroll alone (the vowels can be turned on).
  const [tikkun, setTikkun] = useState(true);
  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) setTikkun(false);
  }, []);
  if (!columns.length) return null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm">
        <p className="text-stone-600">
          Columns {columns[0].n}–{columns[columns.length - 1].n} of 245, line for line as in the Sefer Torah (42 lines a
          column).
        </p>
        <label className="flex cursor-pointer items-center gap-2 font-medium text-stone-800">
          <input type="checkbox" checked={tikkun} onChange={(e) => setTikkun(e.target.checked)} className="size-4 accent-amber-700" />
          Vowels beside (tikkun)
        </label>
      </div>
      {columns.map((c) => (
        <section key={c.n} aria-label={`Column ${c.n}`}>
          <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">Column {c.n}</div>
          <div className={tikkun ? "grid gap-3 md:grid-cols-2" : "mx-auto max-w-xl"}>
            {tikkun && (
              <div className="md:order-2">
                <Column col={c} vowels />
              </div>
            )}
            <div className="md:order-1">
              <Column col={c} vowels={false} />
            </div>
          </div>
        </section>
      ))}
      <p className="text-xs text-stone-400">
        Column and line layout of the standard 245-column Sefer Torah from tikkun.io (MIT licence), set with our text and
        the Sephardic scroll spellings.
      </p>
    </div>
  );
}
