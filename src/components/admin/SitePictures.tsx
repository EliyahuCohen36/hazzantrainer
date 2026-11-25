"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { sourceText } from "@/lib/i18n/Translator";
import { getEdits, saveEdits, useSiteEdits } from "@/lib/site-edits";
import { useAuth } from "@/lib/auth";
import { EDIT_STATE } from "./AdminBar";

const LOCKED = '[lang="he"]:not(html), [data-no-translate], [data-site-editor], script, style, textarea, input, select';

function textAt(x: number, y: number): Text | null {
  const d = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const n = d.caretPositionFromPoint?.(x, y)?.offsetNode ?? d.caretRangeFromPoint?.(x, y)?.startContainer ?? null;
  return n && n.nodeType === Node.TEXT_NODE ? (n as Text) : null;
}

/** Save one picture's new place or size. */
async function update(id: string, change: { near?: string; where?: "before" | "after"; width?: number }) {
  const all = getEdits();
  await saveEdits({ ...all, pictures: (all.pictures ?? []).map((p) => (p.id === id ? { ...p, ...change } : p)) });
}

const norm = (p: string) => (p.replace(/^\/hazzantrainer/, "").replace(/\/?$/, "/") || "/");

/**
 * The owner's pictures (added in "Edit this page"): each sits just above or below the text it was added next to.
 * Shown for everyone; re-placed whenever the page changes.
 */
export function SitePictures() {
  const path = usePathname();
  const edits = useSiteEdits();
  const { profile } = useAuth();
  const admin = profile?.role === "admin";
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setEditing(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener(EDIT_STATE, on);
    return () => window.removeEventListener(EDIT_STATE, on);
  }, []);

  // The owner moves a picture by dragging it, and resizes it with the corner handle, in "Edit this page" (Nov 25).
  useEffect(() => {
    if (!admin || !editing) return;
    let drag: null | { id: string; fig: HTMLElement; img: HTMLElement; mode: "move" | "size"; x0: number; y0: number; w0: number; moved: boolean } = null;
    const down = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const fig = t.closest("[data-site-pic-wrap]") as HTMLElement | null;
      if (!fig) return;
      const img = fig.querySelector("[data-pic-box]") as HTMLElement;
      e.preventDefault();
      drag = { id: fig.dataset.sitePicWrap!, fig, img, mode: t.dataset.picHandle ? "size" : "move", x0: e.clientX, y0: e.clientY, w0: img.getBoundingClientRect().width, moved: false };
      fig.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.mode === "size") {
        const col = drag.fig.getBoundingClientRect().width || 1;
        const pct = Math.max(10, Math.min(100, Math.round(((drag.w0 + dx * (document.dir === "rtl" ? -1 : 1)) / col) * 100)));
        drag.img.style.width = `${pct}%`;
      } else {
        drag.fig.style.transform = `translate(${dx}px, ${dy}px)`;
        drag.fig.style.opacity = "0.7";
      }
    };
    const up = (e: PointerEvent) => {
      if (!drag) return;
      const d = drag;
      drag = null;
      d.fig.style.transform = "";
      d.fig.style.opacity = "";
      if (!d.moved) return;
      (window as Window & { __kriahNoClick?: number }).__kriahNoClick = Date.now() + 400;
      if (d.mode === "size") {
        update(d.id, { width: parseInt(d.img.style.width, 10) || 60 });
        return;
      }
      // Dropped: next to the words under the pointer.
      d.fig.style.visibility = "hidden";
      const node = textAt(e.clientX, e.clientY);
      d.fig.style.visibility = "";
      if (!node || node.parentElement?.closest(LOCKED)) return;
      const near = sourceText(node).trim();
      if (!/[A-Za-z]/.test(near)) return;
      const r = (node.parentElement as HTMLElement).getBoundingClientRect();
      d.fig.remove(); // drawn again in its new place
      update(d.id, { near, where: e.clientY < r.top + r.height / 2 ? "before" : "after" });
    };
    document.addEventListener("pointerdown", down, true);
    document.addEventListener("pointermove", move, true);
    document.addEventListener("pointerup", up, true);
    document.documentElement.classList.add("pics-editing");
    return () => {
      document.removeEventListener("pointerdown", down, true);
      document.removeEventListener("pointermove", move, true);
      document.removeEventListener("pointerup", up, true);
      document.documentElement.classList.remove("pics-editing");
    };
  }, [admin, editing]);
  useEffect(() => {
    const mine = (edits.pictures ?? []).filter((p) => norm(p.page) === norm(path));
    const place = () => {
      document.querySelectorAll("[data-site-pic-wrap]").forEach((n) => {
        if (!mine.some((p) => p.id === (n as HTMLElement).dataset.sitePicWrap)) n.remove();
      });
      if (!mine.length) return;
      const main = document.querySelector("main") ?? document.body;
      const nodes: Text[] = [];
      const w = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = w.nextNode())) if (/[A-Za-z]/.test(n.nodeValue ?? "")) nodes.push(n as Text);
      for (const p of mine) {
        if (document.querySelector(`[data-site-pic-wrap="${CSS.escape(p.id)}"]`)) continue;
        const t = nodes.find((x) => sourceText(x).trim() === p.near);
        const block = t?.parentElement?.closest("p, h1, h2, h3, h4, li, a, figure, section, div");
        if (!block?.parentElement) continue;
        const fig = document.createElement("figure");
        fig.dataset.sitePicWrap = p.id;
        fig.style.cssText = "margin:0.75rem auto;text-align:center;";
        const img = document.createElement("img");
        img.src = p.url;
        img.alt = p.alt ?? "";
        img.dataset.sitePic = p.id;
        img.loading = "lazy";
        img.style.cssText = "width:100%;height:auto;border-radius:1rem;display:block;";
        const box = document.createElement("span");
        box.dataset.picBox = "1";
        box.style.cssText = `position:relative;display:inline-block;width:${p.width}%;max-width:100%;`;
        box.appendChild(img);
        // The resize handle at the picture's corner (shown only while the owner edits the page).
        const h = document.createElement("span");
        h.dataset.picHandle = "1";
        h.className = "site-pic-handle";
        h.title = "Drag to make the picture bigger or smaller";
        box.appendChild(h);
        fig.appendChild(box);
        block.parentElement.insertBefore(fig, p.where === "before" ? block : block.nextSibling);
      }
    };
    place();
    let timer = 0;
    const obs = new MutationObserver((ms) => {
      if (ms.every((m) => [...m.addedNodes, ...m.removedNodes].every((x) => (x as HTMLElement).dataset?.sitePicWrap))) return;
      clearTimeout(timer);
      timer = window.setTimeout(place, 150);
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => {
      obs.disconnect();
      clearTimeout(timer);
    };
  }, [path, edits]);
  return null;
}
