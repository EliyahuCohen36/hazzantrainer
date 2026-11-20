import layout from "@/data/scroll-layout.json";
import { TORAH_TEXT, type TorahToken } from "@/data/torah";

/**
 * Torah pages laid out like a real Sefer Torah: the standard 245 columns
 * (amudim) of 42 lines, with every line starting and ending where it does in
 * the scroll, the setumot (gaps) and petuhot (lines left open), and the songs.
 *
 * Line breaks come from tikkun.io (MIT, github.com/akivajgordon/tikkun.io),
 * mapped word by word onto our own text (MAM, with the Sephardic spellings),
 * by the script in scripts/scroll-layout/. Each segment in scroll-layout.json
 * is [book, verseIndex, tokenIndex, pieceIndex, pieceCount]; a "piece" is a
 * word, with maqaf-joined words split (a line can break after a maqaf).
 */

export const BOOK_ORDER = ["bereshit", "shemot", "vayikra", "bamidbar", "devarim"];

type Seg = [number, number, number, number, number] | null;
interface RawLine {
  s: Seg[];
  p?: 1;
  song?: 1;
}

export interface ScrollPiece {
  /** With nikkud and te'amim (the qere for ketiv/qere words). */
  v: string;
  /** As written in the scroll (the ketiv), letters only, {X} large / [X] small. */
  s: string;
  /** In the parasha being shown. */
  in: boolean;
  /** Its pasuk, as chapter × 1000 + verse. */
  pos: number;
  /** The first word of its pasuk (where an aliyah mark goes). */
  first?: 1;
}
export interface ScrollLine {
  segs: ScrollPiece[][];
  /** A petuha: the line is left open after its text. */
  open?: boolean;
  song?: boolean;
  /** Aliyah that starts on this line ("Levi", "Shelishi", …). */
  mark?: string;
}
export interface ScrollColumn {
  /** Column number in the scroll, 1–245. */
  n: number;
  lines: ScrollLine[];
}

const MAQAF = "־";
const LETTERS = /[א-ת]/;
const MARKS = /[֑-ׇ]/g;

function split(w: string): string[] {
  const parts = w.split(MAQAF).filter((p) => LETTERS.test(p));
  return parts.map((p, i) => (i < parts.length - 1 ? p + MAQAF : p));
}

/** Pieces of one token: vowel text and scroll text side by side. */
function piecesOf(t: TorahToken): { v: string; s: string }[] {
  const k = typeof t === "string" ? t : t.k;
  const q = typeof t === "string" ? t : t.q;
  const kp = split(k);
  const qp = split(q);
  const scroll = (x: string) => x.replace(MARKS, "").replace(MAQAF, "");
  return kp.map((p, i) => ({
    s: scroll(p),
    // If the qere splits differently from the ketiv, show it all on the first piece.
    v: qp.length === kp.length ? qp[i] : i === 0 ? qp.join(" ") : "",
  }));
}

/** Index of the first real word of a pasuk. */
function firstWord(toks: TorahToken[]): number {
  const i = toks.findIndex((t) => !(typeof t === "string" && ["|", "_", "¶p", "¶s"].includes(t)));
  return i < 0 ? 0 : i;
}

/**
 * The scroll columns that hold the verses from..to of a book ("c:v"), complete
 * from their first line to their last, as in a tikkun. `marks` labels lines
 * where an aliyah starts ("c:v" → name).
 */
export function scrollColumnsFor(book: string, from: string, to: string, marks: Record<string, string> = {}): ScrollColumn[] {
  const bi = BOOK_ORDER.indexOf(book);
  const verses = TORAH_TEXT[book] ?? [];
  const num = (cv: string) => {
    const [c, v] = cv.split(":").map(Number);
    return c * 1000 + v;
  };
  const a = num(from);
  const b = num(to);
  const cols = layout as RawLine[][];

  // Which columns touch the range?
  const touches = (line: RawLine) =>
    line.s.some((seg) => {
      if (!seg || seg[0] !== bi) return false;
      const v = verses[seg[1]];
      return v && v.c * 1000 + v.v >= a && v.c * 1000 + v.v <= b;
    });
  const wanted: number[] = [];
  cols.forEach((c, i) => c.some(touches) && wanted.push(i));

  const out: ScrollColumn[] = [];
  for (const ci of wanted) {
    const lines: ScrollLine[] = cols[ci].map((line) => {
      let mark: string | undefined;
      let inSong = false;
      const segs = line.s.map((seg) => {
        if (!seg) return [];
        const [sb, vi, ti, pi, n] = seg;
        const res: ScrollPiece[] = [];
        let v = vi,
          t = ti,
          p = pi;
        while (res.length < n) {
          const verse = (TORAH_TEXT[BOOK_ORDER[sb]] ?? [])[v];
          if (!verse) break;
          const tok = verse.t[t];
          if (tok === undefined) {
            v++;
            t = 0;
            p = 0;
            continue;
          }
          const ps = typeof tok === "string" && ["|", "_", "¶p", "¶s"].includes(tok) ? [] : piecesOf(tok);
          if (p >= ps.length) {
            t++;
            p = 0;
            continue;
          }
          const key = `${verse.c}:${verse.v}`;
          if (t === 0 && p === 0 && marks[key] && sb === bi) mark = marks[key];
          const pos = verse.c * 1000 + verse.v;
          // Shirat HaYam (Shemot 15:1–19) and Haazinu (Devarim 32:1–43) are laid out as songs.
          if ((sb === 1 && pos >= 15001 && pos <= 15019) || (sb === 4 && pos >= 32001 && pos <= 32043)) inSong = true;
          const piece: ScrollPiece = { ...ps[p], in: sb === bi && pos >= a && pos <= b, pos: sb === bi ? pos : -1 };
          if (t === firstWord(verse.t) && p === 0) piece.first = 1;
          // A pesik after the word shows in the vowelled column (the scroll itself has none).
          if (p === ps.length - 1 && verse.t[t + 1] === "|") piece.v = `${piece.v} ׀`;
          res.push(piece);
          p++;
        }
        return res;
      });
      const song = line.song === 1 || (inSong && segs.filter((x) => x.length).length > 1);
      return { segs, open: line.p === 1 || undefined, song: song || undefined, mark };
    });
    out.push({ n: ci + 1, lines });
  }
  return out;
}
