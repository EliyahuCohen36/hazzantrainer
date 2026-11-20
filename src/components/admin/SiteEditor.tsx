"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { sourceText } from "@/lib/i18n/Translator";
import { getEdits, saveEdits, type SitePicture, type TextEdit } from "@/lib/site-edits";
import { supabase } from "@/lib/supabase";
import { EDIT_STATE, EDIT_TOGGLE } from "./AdminBar";

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
  const [pic, setPic] = useState<SitePicture | null>(null);

  useEffect(() => {
    const t = () => setOn((x) => !x);
    window.addEventListener(EDIT_TOGGLE, t);
    return () => window.removeEventListener(EDIT_TOGGLE, t);
  }, []);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(EDIT_STATE, { detail: on }));
    if (!on) {
      setPicked(null);
      setPic(null);
      setMsg("");
    }
  }, [on]);

  useEffect(() => {
    if (!on) return;
    document.documentElement.classList.add("site-editing");
    const click = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || target.closest("[data-site-editor]")) return;
      e.preventDefault();
      e.stopPropagation();
      const img = target.closest("img[data-site-pic]") as HTMLImageElement | null;
      if (img) {
        const p = (getEdits().pictures ?? []).find((x) => x.id === img.dataset.sitePic);
        if (p) {
          setPicked(null);
          setPic({ ...p });
          setMsg("");
        }
        return;
      }
      setPic(null);
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

  /** Add a picture just before or after the text that was tapped (uploaded to the public "site-images" bucket). */
  async function addPicture(file: File, where: "before" | "after") {
    if (!picked) return;
    setBusy(true);
    setMsg("Uploading the picture…");
    const name = `${Date.now()}-${file.name.replace(/[^a-z0-9.]+/gi, "_")}`;
    const db = supabase();
    const up = await db.storage.from("site-images").upload(name, file, { contentType: file.type });
    if (up.error) {
      setBusy(false);
      return setMsg(/bucket/i.test(up.error.message) ? "Ask Claude to run supabase/site.sql again first (it adds the pictures folder)." : up.error.message);
    }
    const url = db.storage.from("site-images").getPublicUrl(name).data.publicUrl;
    const all = getEdits();
    const p: SitePicture = { id: name, page: path, near: picked.en, where, url, width: 60 };
    const err = await saveEdits({ ...all, pictures: [...(all.pictures ?? []), p] });
    setBusy(false);
    setMsg(err ?? "Picture added. Tap it to change its size or remove it.");
    if (!err) setPicked(null);
  }
  async function savePic(remove = false) {
    if (!pic) return;
    const all = getEdits();
    const list = (all.pictures ?? []).filter((x) => x.id !== pic.id);
    const err = await saveEdits({ ...all, pictures: remove ? list : [...list, pic] });
    if (remove && !err) supabase().storage.from("site-images").remove([pic.id]).catch(() => {});
    setMsg(err ?? (remove ? "Picture removed." : "Saved."));
    if (!err) setPic(null);
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
          <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-2 text-xs text-stone-600">
            <span>🖼 Add a picture:</span>
            {(["before", "after"] as const).map((w) => (
              <label key={w} className="cursor-pointer rounded-full px-2 py-1 text-violet-900 ring-1 ring-violet-300">
                {w === "before" ? "above this" : "below this"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) addPicture(f, w);
                  }}
                />
              </label>
            ))}
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
      {on && pic && (
        <div className="w-[22rem] max-w-[calc(100vw-2rem)] space-y-2 rounded-2xl border border-violet-300 bg-white p-4 shadow-xl">
          <p className="font-semibold text-violet-900">Picture</p>
          <label className="block text-xs text-stone-600">
            Size: {pic.width}%
            <input type="range" min={10} max={100} step={5} value={pic.width} onChange={(e) => setPic({ ...pic, width: Number(e.target.value) })} className="w-full" />
          </label>
          <label className="block text-xs text-stone-600">
            Description (for people who can&apos;t see it)
            <input value={pic.alt ?? ""} onChange={(e) => setPic({ ...pic, alt: e.target.value })} className="w-full rounded border border-stone-300 px-2 py-1" />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => savePic()} className="rounded-full bg-violet-700 px-4 py-1.5 font-semibold text-white">
              Save
            </button>
            <button type="button" onClick={() => savePic(true)} className="rounded-full px-3 py-1.5 text-red-700 ring-1 ring-red-300">
              Remove picture
            </button>
            <button type="button" onClick={() => setPic(null)} className="px-2 py-1.5 text-stone-500">
              Close
            </button>
          </div>
        </div>
      )}
      {on && msg && <div className="rounded-xl bg-violet-50 px-3 py-2 text-violet-900 shadow">{msg}</div>}
      {on && !picked && !pic && !msg && (
        <div className="rounded-xl bg-violet-50 px-3 py-2 text-violet-900 shadow">Tap any words on the page to change them or add a picture next to them.</div>
      )}
    </div>
  );
}
