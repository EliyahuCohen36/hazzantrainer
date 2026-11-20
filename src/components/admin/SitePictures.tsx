"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sourceText } from "@/lib/i18n/Translator";
import { useSiteEdits } from "@/lib/site-edits";

const norm = (p: string) => (p.replace(/^\/hazzantrainer/, "").replace(/\/?$/, "/") || "/");

/**
 * The owner's pictures (added in "Edit this page"): each sits just above or below the text it was added next to.
 * Shown for everyone; re-placed whenever the page changes.
 */
export function SitePictures() {
  const path = usePathname();
  const edits = useSiteEdits();
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
        img.style.cssText = `width:${p.width}%;max-width:100%;height:auto;border-radius:1rem;display:inline-block;`;
        fig.appendChild(img);
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
