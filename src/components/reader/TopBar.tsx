"use client";

import { useState, type ReactNode } from "react";

/**
 * The bar at the top of Tanakh and Siddur pages (sections, settings…), hidden to leave room for the text.
 * A small arrow button at the top of the screen brings it back; "▲" hides it again.
 */
export function TopBar({
  label,
  extra,
  barClass,
  top = "sm:top-[3.4rem]",
  open: openProp,
  onOpenChange,
  children,
}: {
  label: string;
  extra?: ReactNode;
  barClass: string;
  top?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}) {
  const [own, setOwn] = useState(false);
  const open = openProp ?? own;
  const set = (v: boolean) => (onOpenChange ? onOpenChange(v) : setOwn(v));
  return (
    <>
      {!open && (
        <div className={`pointer-events-none sticky top-0 z-10 flex justify-center ${top}`}>
          <button
            type="button"
            onClick={() => set(true)}
            aria-label={label}
            title={label}
            className="pointer-events-auto flex items-center gap-1.5 rounded-b-xl rounded-t-md border border-amber-300 bg-white/95 px-3 py-1 text-xs font-semibold text-amber-900 shadow-sm backdrop-blur hover:bg-amber-50"
          >
            <span aria-hidden className="text-sm leading-none">▼</span>
            <span>{label}</span>
            {extra}
          </button>
        </div>
      )}
      <div
        onClick={(e) => {
          // Picking a section / aliyah link closes the bar again.
          if ((e.target as HTMLElement).closest("a[href*='#']")) set(false);
        }}
        className={open ? `sticky top-0 z-10 ${top} ${barClass}` : "hidden"}>
        <button
          type="button"
          onClick={() => set(false)}
          aria-label="Hide"
          title="Hide"
          className="absolute -bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-stone-200 bg-white px-3 text-xs leading-5 text-stone-500 shadow-sm hover:bg-stone-50"
        >
          ▲
        </button>
        {children}
      </div>
    </>
  );
}
