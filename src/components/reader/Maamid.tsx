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
export function WithMaamid({ text }: { text: string }) {
  if (!HINT_MARKS.test(text)) return <>{text}</>;
  // Words are split at spaces and maqafs (each part of a maqaf pair is its own word for the rules).
  const parts = text.split(/(\s+|־)/);
  return (
    <>
      {parts.map((part, pi) => {
        if (!part || /^\s+$|^־$/.test(part) || !HINT_MARKS.test(part)) return <Fragment key={pi}>{part}</Fragment>;
        const { lead, clusters } = analyzeWord(part);
        return (
          <Fragment key={pi}>
            {lead}
            {clusters.map((c, ci) => {
              if (!c.meteg && !c.qamatsKatan && !c.shevaNa) return <Fragment key={ci}>{c.text}</Fragment>;
              let t = c.text;
              const cls: string[] = [];
              const title: string[] = [];
              if (c.meteg) {
                t = t.replace("ֽ", "");
                cls.push("maamid");
                title.push("Ma'amid: the sound goes on this letter");
              }
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
