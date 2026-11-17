import { PHRASES } from "./dict";
import { buildNames } from "./names";

export type Lang = "en" | "he" | "ar";
export const LANGS: { id: Lang; label: string; dir: "ltr" | "rtl" }[] = [
  { id: "en", label: "English", dir: "ltr" },
  { id: "he", label: "עברית", dir: "rtl" },
  { id: "ar", label: "العربية", dir: "rtl" },
];

const NUM = "(\\d+(?:[.,:–-]\\d+)*)";
const ANY = "(.+?)";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface Pattern {
  re: RegExp;
  out: string;
}

let exact: Record<"he" | "ar", Map<string, string>> | null = null;
let patterns: Record<"he" | "ar", Pattern[]> | null = null;
let names: Map<string, string> | null = null;
let nameRe: RegExp | null = null;

function init() {
  if (exact) return;
  exact = { he: new Map(), ar: new Map() };
  patterns = { he: [], ar: [] };
  for (const [en, he, ar] of PHRASES) {
    for (const [lang, out] of [
      ["he", he],
      ["ar", ar],
    ] as const) {
      if (/\{n\}|\{\*\}/.test(en)) {
        const re = new RegExp("^" + esc(en).replace(/\\\{n\\\}/g, NUM).replace(/\\\{\\\*\\\}/g, ANY) + "$");
        patterns[lang].push({ re, out });
      } else exact[lang].set(en, out);
    }
  }
  names = buildNames();
  // "Bereshit 1:1", "Yehoshua 2", "Melakhim I 4:1–23": a name followed by numbers.
  const list = [...names.keys()].sort((a, b) => b.length - a.length).map(esc);
  nameRe = new RegExp(`^(${list.join("|")})((?:\\s+[\\d:–,.-]+)+)$`);
}

/** Names inside a phrase ("Rebia and Gerish") put in Hebrew, joined the right way. */
function replaceNames(v: string, lang: Lang): string {
  const re = new RegExp("(?<![A-Za-z'’])" + nameRe!.source.slice(1, nameRe!.source.indexOf(")(") + 1) + "(?![A-Za-z'’])", "g");
  const out = v.replace(re, (n) => names!.get(n) ?? n);
  return out.replace(/ and /g, lang === "he" ? " ו" : " و").replace(/, /g, lang === "ar" ? "، " : ", ");
}

// ── Sounds written in Latin letters ("ba", "bar-ne-a", "kh'") → Hebrew / Arabic letters ──
const CONS: [string, string, string][] = [
  // [latin, hebrew, arabic]
  ["sh", "שׁ", "ش"], ["kh", "כ", "خ"], ["ts", "צ", "تس"], ["ḥ", "ח", "ح"], ["ṭ", "ט", "ط"],
  ["b", "בּ", "ب"], ["v", "ב", "ڤ"], ["g", "ג", "گ"], ["d", "ד", "د"], ["h", "ה", "ه"], ["z", "ז", "ز"],
  ["y", "י", "ي"], ["k", "כּ", "ك"], ["l", "ל", "ل"], ["m", "מ", "م"], ["n", "נ", "ن"], ["s", "ס", "س"],
  ["q", "ק", "ق"], ["r", "ר", "ر"], ["t", "ת", "ت"], ["p", "פּ", "پ"], ["f", "פ", "ف"], ["w", "ו", "و"],
];
const VOW: Record<string, [string, string]> = { a: ["ַ", "َ"], e: ["ֶ", "ِ"], i: ["ִי", "ِي"], o: ["ֹ", "ُو"], u: ["וּ", "ُ"] };
const SYL = /^(?:sh|kh|ts|[bvgdhzḥṭyklmnsqrtpfw])?(?:[aeiou]|')(?:sh|kh|ts|[bvgdhzḥṭyklmnsqrtpfw])?$/;
const FINAL: Record<string, string> = { כ: "ך", מ: "ם", נ: "ן", פ: "ף", צ: "ץ" };

const ENGLISH = new Set("no so go be me we he to do up us at in on of it is an as or by my oh ok if".split(" "));

function transliterate(text: string, lang: "he" | "ar"): string | null {
  if (ENGLISH.has(text)) return null;
  const bare = CONS.find(([la]) => la === text);
  if (bare) return bare[lang === "he" ? 1 : 2];
  const parts = text.split("-");
  if (!parts.every((p) => SYL.test(p)) || (parts.length === 1 && text.length > 4)) return null;
  const L = lang === "he" ? 1 : 2;
  const out = parts.map((syl, si) => {
    let r = "";
    let rest = syl;
    const take = () => {
      const c = CONS.find(([la]) => rest.startsWith(la));
      if (!c) return null;
      rest = rest.slice(c[0].length);
      return c[L];
    };
    const onset = /^[aeiou']/.test(rest) ? (lang === "he" ? "א" : "ا") : take();
    r += onset ?? "";
    const v = rest[0];
    rest = rest.slice(1);
    if (v === "'") r += lang === "he" ? "ְ" : "ْ";
    else r += VOW[v]?.[L - 1] ?? "";
    if (rest) {
      let coda = take() ?? "";
      if (lang === "he" && si === parts.length - 1) coda = coda.replace(/^[כמנפצ]/, (c) => FINAL[c]);
      r += coda + (lang === "ar" ? "ْ" : "");
    }
    return r;
  });
  return out.join("-");
}

/** Translates one piece of text (trimmed), or returns null if there's no translation. */
export function translateText(text: string, lang: Lang, noSplit = false): string | null {
  if (lang === "en") return null;
  init();
  const hit = exact![lang].get(text) ?? names!.get(text);
  if (hit) return hit;
  for (const p of patterns![lang]) {
    const m = text.match(p.re);
    if (!m) continue;
    // "Tebir." — only a name followed by a full stop.
    if (p.out === "{*}." && !names!.has(m[1])) continue;
    let i = 1;
    let bad = false;
    const out = p.out.replace(/\{n\}|\{\*\}/g, () => {
      const v = m[i++] ?? "";
      const r = translateText(v, lang) ?? names!.get(v) ?? replaceNames(v, lang);
      // Words left in English: this pattern doesn't fit (don't half-translate a sentence).
      if (/[A-Za-z]{2,}/.test(r.replace(/\d+/g, ""))) bad = true;
      return r;
    });
    if (bad) continue;
    return out;
  }
  const sound = transliterate(text, lang);
  if (sound) return sound;
  const nm = text.match(nameRe!);
  if (nm) return names!.get(nm[1])! + nm[2];
  // "Alef, no sound by itself, play" style labels: translate each part.
  if (!noSplit && text.includes(", ")) {
    // Split at ", " but not inside brackets: "Tet, ṭ (deep t, like Arabic ط), play".
    const parts: string[] = [];
    let depth = 0;
    let cur = "";
    for (let k = 0; k < text.length; k++) {
      const ch = text[k];
      if (ch === "(") depth++;
      if (ch === ")") depth--;
      if (!depth && ch === "," && text[k + 1] === " ") {
        parts.push(cur);
        cur = "";
        k++;
      } else cur += ch;
    }
    parts.push(cur);
    if (parts.length < 2) return null; // the commas were all inside brackets
    const play = lang === "he" ? "השמעה" : "تشغيل";
    const out: string[] = [];
    for (let k = 0; k < parts.length; k++) {
      if (parts[k] === "play") {
        out.push(play);
        continue;
      }
      let t = translateText(parts[k], lang);
      // "deep, from the throat": a phrase with a comma of its own.
      if (t === null && k + 1 < parts.length) {
        const two = translateText(`${parts[k]}, ${parts[k + 1]}`, lang, true);
        if (two !== null) {
          out.push(two);
          k++;
          continue;
        }
      }
      if (t === null && !/[A-Za-z]{2,}/.test(parts[k])) t = parts[k];
      if (t === null) return null; // don't half-translate
      out.push(t);
    }
    return out.join(lang === "ar" ? "، " : ", ");
  }
  return null;
}
