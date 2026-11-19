"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SECTION_TITLES, TANAKH, type TanakhSection } from "@/data/teamim-reference";
import { BEGINNER_STEPS } from "@/data/beginner";
import { STEP_COLORS, StepPicture } from "@/components/beginner/StepPictures";
import { getEdits, saveEdits, useSiteEdits, type HomeTab, type TabItem } from "@/lib/site-edits";

/** The three parts of the site, each its own tab (owner's request). The admin can add more and reorder them. */
export const DEFAULT_TABS: HomeTab[] = [
  { id: "beginner", title: "Beginner Keriah", he: "קְרִיאָה לְמַתְחִילִים", color: "#e11d48", builtin: true },
  { id: "tanakh", title: "Tanach", he: "תנ״ך", color: "#d97706", builtin: true },
  { id: "tefillah", title: "Tefillah / Songs", he: "תְּפִלָּה וְשִׁירִים", color: "#0284c7", builtin: true },
];
const SECTION_OF: Record<string, string> = { beginner: "beginner", tanakh: "tanakh", tefillah: "siddur" };

const SECTIONS: Array<{ id: TanakhSection; blurb: string }> = [
  { id: "torah", blurb: "Names of the te'amim with recordings and examples, and practice by pasuk." },
  { id: "neviim", blurb: "Books of the Nevi'im and the Haftarah melody." },
  { id: "ketuvim", blurb: "Tehillim, the Megillot and the other books of Ketuvim." },
];

/** The tabs in the owner's order: saved ones first, then any built-in tab not in the saved list. */
function mergeTabs(saved?: HomeTab[]): HomeTab[] {
  if (!saved?.length) return DEFAULT_TABS;
  const out = saved.map((t) => (t.builtin ? { ...DEFAULT_TABS.find((d) => d.id === t.id)!, ...t } : t)).filter((t) => t.title);
  for (const d of DEFAULT_TABS) if (!out.some((t) => t.id === d.id)) out.push(d);
  return out;
}

function BeginnerTab() {
  return (
    <>
      <Link
        href="/beginner/"
        className="flex items-center gap-4 rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 via-amber-50 to-sky-50 p-5 shadow-sm transition-colors hover:border-rose-400"
      >
        <span dir="rtl" lang="he" className="font-hebrew text-4xl text-rose-800">
          אבּג
        </span>
        <span className="flex-1">
          <span className="block text-lg font-semibold text-stone-900">Beginner Keriah</span>
          <span className="mt-1 block text-sm text-stone-600">
            For first-time readers: the alef-bet with the final letters, then every letter with every nekuda.
          </span>
        </span>
      </Link>
      <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {BEGINNER_STEPS.map((s, i) => (
          <li key={s.href}>
            <Link href={s.href} className={`flex h-full flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition-colors ${STEP_COLORS[i].card}`}>
              <StepPicture i={i} className="h-12 w-16" />
              <span className={`text-[0.7rem] font-semibold uppercase ${STEP_COLORS[i].label}`}>Step {i + 1}</span>
              <span className="text-sm font-medium leading-tight text-stone-900">{s.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

function TanakhTab() {
  return (
    <>
      <div className="space-y-3">
        {SECTIONS.map(({ id, blurb }) => (
          <Link
            key={id}
            href={`/tanakh/${id}/`}
            className="block rounded-2xl border border-amber-200 bg-white p-5 shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-lg font-semibold text-stone-900">{SECTION_TITLES[id].en}</span>
              <span dir="rtl" lang="he" className="font-hebrew text-2xl text-amber-800">
                {SECTION_TITLES[id].he}
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-600">{blurb}</p>
            <p dir="rtl" lang="he" className="mt-2 font-hebrew text-sm leading-relaxed text-stone-500">
              {TANAKH.filter((b) => b.section === id)
                .map((b) => b.he)
                .join(" · ")}
            </p>
          </Link>
        ))}
      </div>
      <Link href="/teamim/" className="mt-3 inline-block text-sm text-amber-800 hover:underline">
        Te&apos;amim of every book of Tanakh →
      </Link>
    </>
  );
}

function TefillahTab() {
  return (
    <div className="space-y-3">
      <Link
        href="/siddur/"
        className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-amber-50 p-5 shadow-sm transition-colors hover:border-sky-400"
      >
        <span className="text-4xl" aria-hidden>
          📖
        </span>
        <span className="flex-1">
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-lg font-semibold text-stone-900">Siddur</span>
            <span dir="rtl" lang="he" className="font-hebrew text-xl text-sky-800">
              סידור עדות המזרח
            </span>
          </span>
          <span className="mt-1 block text-sm text-stone-600">
            The whole Siddur, with the Hazzan&apos;s recordings beside each part, and tunes in the maqamot.
          </span>
        </span>
      </Link>
      <Link
        href="/siddur/shaharit-shabbat/"
        className="flex items-center gap-4 rounded-2xl border border-sky-200 bg-white p-5 shadow-sm transition-colors hover:border-sky-400 hover:bg-sky-50"
      >
        <span className="text-4xl" aria-hidden>
          🎵
        </span>
        <span className="flex-1">
          <span className="block text-lg font-semibold text-stone-900">Songs and maqam tunes</span>
          <span className="mt-1 block text-sm text-stone-600">The Shabbat and Yom Tov tunes in each maqam, sung by the Hazzan.</span>
        </span>
      </Link>
    </div>
  );
}

function CustomTab({ tab }: { tab: HomeTab }) {
  if (!tab.items?.length) return <p className="text-stone-500">Nothing here yet.</p>;
  return (
    <div className="space-y-3">
      {tab.items.map((it, k) => (
        <Link
          key={k}
          href={it.href || "/"}
          className="block rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors hover:brightness-95"
          style={{ borderColor: `${tab.color}55` }}
        >
          <span className="block text-lg font-semibold text-stone-900">{it.title}</span>
          {it.text && <span className="mt-1 block text-sm text-stone-600">{it.text}</span>}
        </Link>
      ))}
    </div>
  );
}

/** Admin: add, rename, colour, hide and reorder the home-page tabs. */
function TabManager({ tabs, onDone }: { tabs: HomeTab[]; onDone: () => void }) {
  const [list, setList] = useState<HomeTab[]>(tabs);
  const [msg, setMsg] = useState("");
  const upd = (k: number, t: Partial<HomeTab>) => setList((l) => l.map((x, i) => (i === k ? { ...x, ...t } : x)));
  const move = (k: number, d: number) =>
    setList((l) => {
      const n = [...l];
      const j = k + d;
      if (j < 0 || j >= n.length) return l;
      [n[k], n[j]] = [n[j], n[k]];
      return n;
    });
  const updItem = (k: number, j: number, it: Partial<TabItem>) =>
    upd(k, { items: (list[k].items ?? []).map((x, i) => (i === j ? { ...x, ...it } : x)) });
  async function save() {
    const err = await saveEdits({ ...getEdits(), tabs: list });
    setMsg(err ?? "Saved. Everyone sees the new tabs now.");
    if (!err) onDone();
  }
  return (
    <div data-no-translate className="mb-5 space-y-3 rounded-2xl border border-violet-300 bg-violet-50 p-4 text-sm" dir="ltr">
      <p className="font-semibold text-violet-900">Arrange the tabs</p>
      {list.map((t, k) => (
        <div key={t.id} className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => move(k, -1)} className="rounded px-2 ring-1 ring-stone-300" aria-label="Move left">
              ↑
            </button>
            <button type="button" onClick={() => move(k, 1)} className="rounded px-2 ring-1 ring-stone-300" aria-label="Move right">
              ↓
            </button>
            <input value={t.title} onChange={(e) => upd(k, { title: e.target.value })} className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1" placeholder="Tab name" />
            <input value={t.he ?? ""} onChange={(e) => upd(k, { he: e.target.value })} dir="rtl" className="w-32 rounded border border-stone-300 px-2 py-1" placeholder="Hebrew" />
            <input type="color" value={t.color} onChange={(e) => upd(k, { color: e.target.value })} aria-label="Colour" />
            {t.builtin ? (
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={!!t.hidden} onChange={(e) => upd(k, { hidden: e.target.checked })} /> Hide
              </label>
            ) : (
              <button type="button" onClick={() => setList((l) => l.filter((_, i) => i !== k))} className="text-xs text-red-700 underline">
                Delete
              </button>
            )}
          </div>
          {!t.builtin && (
            <div className="mt-2 space-y-1.5 border-t border-stone-100 pt-2">
              {(t.items ?? []).map((it, j) => (
                <div key={j} className="flex flex-wrap gap-1.5">
                  <input value={it.title} onChange={(e) => updItem(k, j, { title: e.target.value })} placeholder="Card title" className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1" />
                  <input value={it.href} onChange={(e) => updItem(k, j, { href: e.target.value })} placeholder="Link, e.g. /siddur/" className="w-36 rounded border border-stone-300 px-2 py-1" />
                  <input value={it.text ?? ""} onChange={(e) => updItem(k, j, { text: e.target.value })} placeholder="A line about it" className="min-w-0 flex-1 rounded border border-stone-300 px-2 py-1" />
                  <button type="button" onClick={() => upd(k, { items: (t.items ?? []).filter((_, i) => i !== j) })} className="text-xs text-red-700">
                    ✕
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => upd(k, { items: [...(t.items ?? []), { title: "", href: "/" }] })} className="text-xs text-violet-800 underline">
                + Add a card to this tab
              </button>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setList((l) => [...l, { id: `tab-${Date.now()}`, title: "New tab", color: "#7c3aed", items: [] }])}
          className="rounded-full px-3 py-1.5 text-violet-900 ring-1 ring-violet-300"
        >
          + Add a tab
        </button>
        <button type="button" onClick={save} className="rounded-full bg-violet-700 px-4 py-1.5 font-semibold text-white">
          Save tabs
        </button>
        <button type="button" onClick={onDone} className="px-2 py-1.5 text-stone-500">
          Cancel
        </button>
      </div>
      {msg && <p className="text-violet-900">{msg}</p>}
    </div>
  );
}

export function HomeTabs() {
  const edits = useSiteEdits();
  const { profile, sections } = useAuth();
  const admin = profile?.role === "admin";
  const allowed = (t: HomeTab) =>
    !t.hidden && !(t.builtin && profile?.role === "student" && sections && !sections.includes(SECTION_OF[t.id]));
  const all = mergeTabs(edits.tabs);
  const tabs = all.filter(allowed);
  const [cur, setCur] = useState<string>("beginner");
  const [arranging, setArranging] = useState(false);
  useEffect(() => {
    const h = location.hash.slice(1);
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("home-tab");
    } catch {}
    if (h) setCur(h);
    else if (saved) setCur(saved);
  }, []);
  const pick = (id: string) => {
    setCur(id);
    try {
      localStorage.setItem("home-tab", id);
    } catch {}
  };
  const tab = tabs.find((t) => t.id === cur) ?? tabs[0];
  if (!tab) return null;
  return (
    <section className="mt-6">
      {admin && !arranging && (
        <button type="button" onClick={() => setArranging(true)} className="mb-3 text-sm text-violet-800 underline">
          ⚙️ Arrange the tabs (add, rename, colour, order)
        </button>
      )}
      {admin && arranging && <TabManager tabs={all} onDone={() => setArranging(false)} />}
      <div role="tablist" aria-label="Parts of the site" className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const on = t.id === tab.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => pick(t.id)}
              className="flex flex-col items-start rounded-t-2xl border-2 border-b-0 px-4 py-2 text-left font-semibold transition-colors"
              style={{
                borderColor: t.color,
                backgroundColor: on ? t.color : `${t.color}1a`,
                color: on ? "#fff" : t.color,
              }}
            >
              <span>{t.title}</span>
              {t.he && (
                <span dir="rtl" lang="he" className="font-hebrew text-sm font-normal opacity-90">
                  {t.he}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" className="rounded-b-2xl rounded-tr-2xl border-2 bg-white p-4 sm:p-5" style={{ borderColor: tab.color }}>
        {tab.id === "beginner" && tab.builtin ? (
          <BeginnerTab />
        ) : tab.id === "tanakh" && tab.builtin ? (
          <TanakhTab />
        ) : tab.id === "tefillah" && tab.builtin ? (
          <TefillahTab />
        ) : (
          <CustomTab tab={tab} />
        )}
      </div>
    </section>
  );
}
