"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { LANGS, translateText, type Lang } from "./translate";

const KEY = "kriah-lang";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });
export const useLang = () => useContext(LangContext);

/* The page is written in English; in Hebrew or Arabic each text on the page is
   swapped for its translation (dict.ts), and swapped back for English. React
   may rewrite a text later: a MutationObserver translates it again. */

const original = new WeakMap<Node, string>(); // text node → its English
const shown = new WeakMap<Node, string>(); // text node → what we put there
const ATTRS = ["placeholder", "title", "aria-label"] as const;
const attrOriginal = new WeakMap<Element, Record<string, string>>();

function skip(el: Element | null): boolean {
  // Hebrew text (the Torah, names in Hebrew), code, and anything marked not to translate.
  return !!el?.closest('[lang="he"]:not(html), script, style, textarea, input, [data-no-translate]');
}

function doText(node: Text, lang: Lang) {
  if (skip(node.parentElement)) return;
  const cur = node.nodeValue ?? "";
  if (shown.get(node) !== cur) original.set(node, cur); // new English text from React
  const en = original.get(node) ?? cur;
  const t = en.trim();
  if (!t || !/[A-Za-z]/.test(t)) return;
  const tr = lang === "en" ? null : translateText(t, lang);
  const next = tr === null ? en : en.replace(t, tr);
  if (next !== cur) {
    shown.set(node, next);
    node.nodeValue = next;
  } else shown.set(node, cur);
}

function doAttrs(el: Element, lang: Lang) {
  if (skip(el)) return;
  let orig = attrOriginal.get(el);
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v === null) continue;
    orig ??= {};
    const prev = orig[`${a}:shown`];
    if (prev !== v) orig[a] = v;
    const en = orig[a];
    const tr = lang === "en" ? null : translateText(en.trim(), lang);
    const next = tr ?? en;
    orig[`${a}:shown`] = next;
    if (next !== v) el.setAttribute(a, next);
  }
  if (orig) attrOriginal.set(el, orig);
}

function walk(root: Node, lang: Lang) {
  if (root.nodeType === Node.TEXT_NODE) return doText(root as Text, lang);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  doAttrs(el, lang);
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null;
  while ((n = w.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) doText(n as Text, lang);
    else doAttrs(n as Element, lang);
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Lang | null;
      if (saved && LANGS.some((l) => l.id === saved)) setLangState(saved);
    } catch {
      // storage blocked
    }
  }, []);

  useEffect(() => {
    const info = LANGS.find((l) => l.id === lang)!;
    document.documentElement.lang = lang;
    document.documentElement.dir = info.dir;
    walk(document.body, lang);
    if (lang === "en") return;
    let pending = new Set<Node>();
    let raf = 0;
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === "characterData") pending.add(m.target);
        else if (m.type === "attributes") pending.add(m.target);
        else m.addedNodes.forEach((n) => pending.add(n));
      }
      if (!raf)
        raf = requestAnimationFrame(() => {
          raf = 0;
          const todo = pending;
          pending = new Set();
          todo.forEach((n) => n.isConnected && walk(n, lang));
        });
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: [...ATTRS] });
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // ignore
    }
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

/* Small flags (drawn here so they look the same on every computer). */
function FlagUS() {
  return (
    <svg viewBox="0 0 19 10" className="h-3.5 w-[1.4rem] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" aria-hidden>
      {Array.from({ length: 13 }, (_, i) => (
        <rect key={i} y={(i * 10) / 13} width="19" height={10 / 13} fill={i % 2 ? "#fff" : "#b22234"} />
      ))}
      <rect width="7.6" height={(10 * 7) / 13} fill="#3c3b6e" />
    </svg>
  );
}
function FlagIL() {
  return (
    <svg viewBox="0 0 22 16" className="h-3.5 w-[1.4rem] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" aria-hidden>
      <rect width="22" height="16" fill="#fff" />
      <rect y="1.5" width="22" height="2.4" fill="#0038b8" />
      <rect y="12.1" width="22" height="2.4" fill="#0038b8" />
      <g fill="none" stroke="#0038b8" strokeWidth="0.75">
        <path d="M11 4.6 L13.9 9.6 L8.1 9.6 Z" />
        <path d="M11 11.4 L8.1 6.4 L13.9 6.4 Z" />
      </g>
    </svg>
  );
}
function FlagSY() {
  const star = (cx: number) => {
    const pts = Array.from({ length: 10 }, (_, i) => {
      const r = i % 2 ? 0.75 : 1.8;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      return `${(cx + r * Math.cos(a)).toFixed(2)},${(8 + r * Math.sin(a)).toFixed(2)}`;
    }).join(" ");
    return <polygon key={cx} points={pts} fill="#ce1126" />;
  };
  return (
    <svg viewBox="0 0 24 16" className="h-3.5 w-[1.4rem] rounded-[2px] shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" aria-hidden>
      <rect width="24" height="5.34" fill="#007a3d" />
      <rect y="5.33" width="24" height="5.34" fill="#fff" />
      <rect y="10.66" width="24" height="5.34" fill="#000" />
      {[7, 12, 17].map(star)}
    </svg>
  );
}

const FLAGS: Record<Lang, () => React.ReactElement> = { en: FlagUS, he: FlagIL, ar: FlagSY };

/** The language buttons at the top right: 🇺🇸 English, 🇮🇱 Hebrew, 🇸🇾 Arabic. */
export function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-stone-200 p-0.5" role="group" aria-label="Language" data-no-translate>
      {LANGS.map((l) => {
        const Flag = FLAGS[l.id];
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            title={l.label}
            aria-label={l.label}
            aria-pressed={lang === l.id}
            className={`flex h-7 items-center justify-center rounded-md px-1.5 ${lang === l.id ? "bg-amber-100 ring-1 ring-amber-400" : "hover:bg-stone-100"}`}
          >
            <Flag />
          </button>
        );
      })}
    </div>
  );
}
