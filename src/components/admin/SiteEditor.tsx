"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { sourceText } from "@/lib/i18n/Translator";
import { getEdits, saveEdits, type TextEdit } from "@/lib/site-edits";

/** Text that must never be changed: the Tanakh, the Siddur, Hebrew names (lang="he"), the editor itself. */
const LOCKED = '[lang="he"]:not(html), [data-no-translate], [data-site-editor], script, style, textarea, input, select';

interface Picked {
  en: string;
  tag: string;
  edit: TextEdit;
}

function textNodeAt(x: number, y: number): Text | null {
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const n = d.caretPositionFromPoint?.(x, y)?.offsetNode ?? d.caretRangeFromPoint?.(x, y)?.startContainer ?? null;
  return n && n.nodeType === Node.TEXT_NODE ? (n as Text) : null;
}

/**
 * The owner's page editor (admin only): "✏️ Edit this page", then tap any text that isn't from the
 * Tanakh or the Siddur to change its words (English, Hebrew, Arabic) or colours. Saved for everyone.
 * "Copy a note for Claude" copies a short description to paste into a chat, for changes too big to do here.
 */
export function SiteEditor() {
  const { profile } = useAuth();
  const path = usePathname();
  const [on, setOn] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const admin = profile?.role === "admin";

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("site-editing");
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest("[data-site-editor]")) return;
      e.preventDefault();
      e.stopPropagation();
      if (target.closest(LOCKED)) {
        setMsg("That's text from the Tanakh or Siddur (or Hebrew), so it can't be changed here.");
        return;
      }
      let node = textNodeAt(e.clientX, e.clientY);
      if (!node || !target.contains(node)) {
        // Clicked on padding: the first English text inside the thing that was clicked.
        const w = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        let n: Node | null;
        node = null;
        while ((n = w.nextNode())) if (/[A-Za-z]/.test(n.nodeValue ?? "") && !n.parentElement?.closest(LOCKED)) { node = n as Text; break; }
      }
      if (!node || node.parentElement?.closest(LOCKED)) return setMsg("Tap right on the words you want to change.");
      const en = sourceText(node).trim();
      if (!/[A-Za-z]/.test(en)) return setMsg("Tap right on the words you want to change.");
      setMsg("");
      setPicked({ en, tag: node.parentElement?.tagName.toLowerCase() ?? "", edit: { ...(getEdits().text[en] ?? {}) } });
    };
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("click", click, true);
      document.documentElement.classList.remove("site-editing");
    };
  }, [on]);

  if (!admin) return null;

  async function save(remove = false) {
    if (!picked) return;
    setBusy(true);
    const all = getEdits();
    const text = { ...all.text };
    const e = picked.edit;
    const empty = !e.en?.trim() && !e.he?.trim() && !e.ar?.trim() && !e.color && !e.bg && !e.bold;
    if (remove || empty) delete text[picked.en];
    else text[picked.en] = e;
    const err = await saveEdits({ ...all, text });
    setBusy(false);
    if (err) return setMsg(err);
    setMsg(remove ? "Changed back to the original." : "Saved. Everyone sees it now.");
    setPicked(null);
  }

  function note() {
    if (!picked) return;
    const e = picked.edit;
    const lines = [
      `Keriah Trainer change, page ${path}:`,
      `The text "${picked.en}"`,
      e.en ? `→ should say: "${e.en}"` : "→ change: (write what you want here)",
      e.color || e.bg ? `Colours: ${[e.color && `text ${e.color}`, e.bg && `background ${e.bg}`].filter(Boolean).join(", ")}` : "",
    ].filter(Boolean);
    navigator.clipboard?.writeText(lines.join("\n")).then(() => setMsg("Copied! Paste it into a chat with Claude."));
  }

  const set = (k: keyof TextEdit, v: string | boolean | undefined) =>
    setPicked((p) => (p ? { ...p, edit: { ...p.edit, [k]: v === "" ? undefined : v } } : p));

  return (
    <div data-site-editor data-no-translate className="fixed bottom-4 end-4 z-50 flex max-w-[22rem] flex-col items-end gap-2 text-sm" dir="ltr">
      {on && picked && (
        <div className="w-[22rem] max-w-[calc(100vw-2rem)] space-y-2 rounded-2xl border border-violet-300 bg-white p-4 shadow-xl">
          <div className="text-xs text-stone-500">Original text</div>
          <div className="max-h-20 overflow-auto rounded bg-stone-50 p-2 text-stone-800">{picked.en}</div>
          <label className="block">
            <span className="text-xs text-stone-600">New English words (leave empty to keep)</span>
            <textarea rows={2} value={picked.edit.en ?? ""} onChange={(e) => set("en", e.target.value)} className="w-full rounded border border-stone-300 p-1.5" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-600">Hebrew (optional)</span>
            <textarea rows={1} dir="rtl" value={picked.edit.he ?? ""} onChange={(e) => set("he", e.target.value)} className="w-full rounded border border-stone-300 p-1.5" />
          </label>
          <label className="block">
            <span className="text-xs text-stone-600">Arabic (optional)</span>
            <textarea rows={1} dir="rtl" value={picked.edit.ar ?? ""} onChange={(e) => set("ar", e.target.value)} className="w-full rounded border border-stone-300 p-1.5" />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-1">
              <span className="text-xs text-stone-600">Text colour</span>
              <input type="color" value={picked.edit.color ?? "#1c1917"} onChange={(e) => set("color", e.target.value)} />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-xs text-stone-600">Background</span>
              <input type="color" value={picked.edit.bg ?? "#ffffff"} onChange={(e) => set("bg", e.target.value)} />
            </label>
            <label className="flex items-center gap-1 text-xs text-stone-600">
              <input type="checkbox" checked={!!picked.edit.bold} onChange={(e) => set("bold", e.target.checked || undefined)} /> Bold
            </label>
            <label className="flex items-center gap-1 text-xs text-stone-600">
              <input type="checkbox" checked={!!picked.edit.box} onChange={(e) => set("box", e.target.checked || undefined)} /> Colour the whole card
            </label>
            {(picked.edit.color || picked.edit.bg) && (
              <button type="button" onClick={() => setPicked((p) => (p ? { ...p, edit: { ...p.edit, color: undefined, bg: undefined } } : p))} className="text-xs text-stone-500 underline">
                No colours
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" disabled={busy} onClick={() => save()} className="rounded-full bg-violet-700 px-4 py-1.5 font-semibold text-white">
              Save
            </button>
            {getEdits().text[picked.en] && (
              <button type="button" disabled={busy} onClick={() => save(true)} className="rounded-full px-3 py-1.5 text-violet-900 ring-1 ring-violet-300">
                Back to original
              </button>
            )}
            <button type="button" onClick={note} className="rounded-full px-3 py-1.5 text-stone-700 ring-1 ring-stone-300">
              📋 Copy a note for Claude
            </button>
            <button type="button" onClick={() => setPicked(null)} className="px-2 py-1.5 text-stone-500">
              Close
            </button>
          </div>
        </div>
      )}
      {on && msg && <div className="rounded-xl bg-violet-50 px-3 py-2 text-violet-900 shadow">{msg}</div>}
      {on && !picked && !msg && (
        <div className="rounded-xl bg-violet-50 px-3 py-2 text-violet-900 shadow">Tap any words on the page to change them.</div>
      )}
      <button
        type="button"
        onClick={() => {
          setOn((x) => !x);
          setPicked(null);
          setMsg("");
        }}
        className={`rounded-full px-4 py-2 font-semibold shadow-lg ${on ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-300"}`}
      >
        {on ? "✓ Done editing" : "✏️ Edit this page"}
      </button>
    </div>
  );
}
