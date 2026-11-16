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
  const re = new RegExp(nameRe!.source.slice(1, nameRe!.source.indexOf(")(") + 1), "g");
  const out = v.replace(re, (n) => names!.get(n) ?? n);
  return out.replace(/ and /g, lang === "he" ? " ו" : " و").replace(/, /g, lang === "ar" ? "، " : ", ");
}

/** Translates one piece of text (trimmed), or returns null if there's no translation. */
export function translateText(text: string, lang: Lang): string | null {
  if (lang === "en") return null;
  init();
  const hit = exact![lang].get(text) ?? names!.get(text);
  if (hit) return hit;
  for (const p of patterns![lang]) {
    const m = text.match(p.re);
    if (!m) continue;
    let i = 1;
    return p.out.replace(/\{n\}|\{\*\}/g, () => {
      const v = m[i++] ?? "";
      return translateText(v, lang) ?? names!.get(v) ?? replaceNames(v, lang);
    });
  }
  const nm = text.match(nameRe!);
  if (nm) return names!.get(nm[1])! + nm[2];
  // "Alef, no sound by itself, play" style labels: translate each part.
  if (text.includes(", ")) {
    const parts = text.split(", ");
    const tr = parts.map((p) => translateText(p, lang));
    const play = lang === "he" ? "השמעה" : "تشغيل";
    if (tr.some((x) => x !== null)) return parts.map((p, k) => tr[k] ?? (p === "play" ? play : p)).join(lang === "ar" ? "، " : ", ");
  }
  return null;
}
