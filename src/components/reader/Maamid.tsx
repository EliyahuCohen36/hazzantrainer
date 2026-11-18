import { Fragment } from "react";
import { analyzeWord } from "@/lib/hebrew/vowel-hints";

const HINT_MARKS = /[ְׇֽ]/;

/**
 * Hebrew text with reading hints drawn clearly (see src/lib/hebrew/vowel-hints.ts
 * and the .maamid / .vowel-* rules in globals.css):
 *  - ma'amid (meteg / silluq): a clear line under the letter that takes the sound
 *  - qamats katan: an extra big, bold qamats
 *  - sheva na: an extra big, bold sheva (a sheva nach stays as it is)
 * The font's own mark is removed and a clear one is drawn by CSS instead.
 */
export function WithMaamid({ text, source }: { text: string; source?: string }) {
  if (text.includes(YETIB)) return <YetibFirst text={text} source={source} />;
  return <Hints text={text} source={source} />;
}

const YETIB = "\u059A";

/**
 * Yetib is drawn BEFORE the word (at its far right), never under or after a
 * letter, so it can't be mistaken for Shofar Mehuppakh (owner's request).
 */
function YetibFirst({ text, source }: { text: string; source?: string }) {
  const SPLIT = /(\s+|־)/;
  const parts = text.split(SPLIT);
  const srcParts = source?.split(SPLIT);
  const aligned = !!srcParts && srcParts.length === parts.length;
  return (
    <>
      {parts.map((part, i) => {
        const src = aligned ? srcParts![i] : undefined;
        if (!part.includes(YETIB)) return <Hints key={i} text={part} source={src} />;
        return (
          <span key={i} className="whitespace-nowrap">
            <span className="yetib-before" title="Yetib: sung before the word">
              {"\u00A0" + YETIB}
            </span>
            <Hints text={part.replaceAll(YETIB, "")} source={src} />
          </span>
        );
      })}
    </>
  );
}

// Te'amim written twice on one word (Talsha ֠, Tilsa ֩, Zarqa ֮, Teri Kadma ֙): the sign at the
// word's edge only shows which ta'am it is; the other one is on the letter that takes the sound.
const DOUBLED = ["\u05A0", "\u05A9", "\u05AE", "\u0599"];
const PREPOSITIVE = "\u05A0";
function doubledOf(word: string) {
  return DOUBLED.find((m) => word.split(m).length > 2);
}

function Hints({ text, source }: { text: string; source?: string }) {
  if (!HINT_MARKS.test(text) && !DOUBLED.some((m) => text.split(m).length > 2)) return <>{text}</>;
  // Words are split at spaces and maqafs (each part of a maqaf pair is its own word for the rules).
  const SPLIT = /(\s+|־)/;
  const parts = text.split(SPLIT);
  // The rules read the full text (with te'amim, which show the stress) even when the te'amim are hidden.
  const srcParts = source?.split(SPLIT);
  const aligned = !!srcParts && srcParts.length === parts.length;
  return (
    <>
      {parts.map((part, pi) => {
        const twice = part ? doubledOf(part) : undefined;
        if (!part || /^\s+$|^־$/.test(part) || (!HINT_MARKS.test(part) && !twice)) return <Fragment key={pi}>{part}</Fragment>;
        const shown = analyzeWord(part);
        const full = aligned ? analyzeWord(srcParts![pi]) : null;
        const lead = shown.lead;
        const clusters =
          full && full.clusters.length === shown.clusters.length
            ? shown.clusters.map((c, i) => ({ ...c, shevaNa: full.clusters[i].shevaNa && c.text.includes("ְ") }))
            : shown.clusters;
        // The letter that takes the sound of a doubled ta'am.
        let soundAt = -1;
        if (twice) {
          const at = clusters.map((c, i) => (c.text.includes(twice) ? i : -1)).filter((i) => i >= 0);
          soundAt = twice === PREPOSITIVE ? at[at.length - 1] : at[0];
        }
        return (
          <Fragment key={pi}>
            {lead}
            {clusters.map((c, ci) => {
              const sound = ci === soundAt;
              if (!c.meteg && !c.qamatsKatan && !c.shevaNa && !sound) return <Fragment key={ci}>{c.text}</Fragment>;
              let t = c.text;
              const cls: string[] = [];
              const title: string[] = [];
              if (sound) {
                cls.push("taam-sound");
                title.push("The ta'am's sound goes on this letter");
              }
              if (c.meteg) {
                t = t.replace("ֽ", "");
                cls.push("maamid");
                title.push("Ma'amid: the sound goes on this letter");
              }
              // A ta'am under this letter too (or a ma'amid): draw the vowel beside it.
              if ((c.qamatsKatan || c.shevaNa) && (c.meteg || /[\u0591\u0596\u059B\u05A2-\u05A7\u05AA]/.test(c.text)))
                cls.push("vowel-shift");
              if (c.qamatsKatan) {
                t = t.replace("ׇ", "");
                cls.push("vowel-qamats-katan");
                title.push("Qamats katan: say \"o\"");
              } else if (c.shevaNa) {
                t = t.replace("ְ", "");
                cls.push("vowel-sheva-na");
                title.push("Sheva na: say a short \"e\"");
              }
              return (
                <span key={ci} className={cls.join(" ")} title={title.join(" · ")}>
                  {t}
                </span>
              );
            })}
          </Fragment>
        );
      })}
    </>
  );
}
