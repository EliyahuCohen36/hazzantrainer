"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Up to 3 bookmarks for Tanakh and 3 for Tefillah, kept in this browser. */
export type BookmarkKind = "tanakh" | "tefillah";
export interface Bookmark {
  href: string;
  label: string;
  he?: string;
  at: number;
}
const KEY = "kriah-bookmarks";
const EVENT = "kriah-bookmarks-changed";
export const MAX_BOOKMARKS = 3;

function read(): Record<BookmarkKind, Bookmark[]> {
  try {
    const j = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { tanakh: j.tanakh ?? [], tefillah: j.tefillah ?? [] };
  } catch {
    return { tanakh: [], tefillah: [] };
  }
}
function write(b: Record<BookmarkKind, Bookmark[]>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    // storage blocked
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useBookmarks() {
  const [b, setB] = useState<Record<BookmarkKind, Bookmark[]>>({ tanakh: [], tefillah: [] });
  useEffect(() => {
    const on = () => setB(read());
    on();
    window.addEventListener(EVENT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return b;
}

export function removeBookmark(kind: BookmarkKind, href: string) {
  const b = read();
  b[kind] = b[kind].filter((x) => x.href !== href);
  write(b);
}

/** 🔖 beside a section: tap to keep it (the oldest of 3 makes room), tap again to remove. */
export function BookmarkButton({ kind, href, label, he }: { kind: BookmarkKind; href: string; label: string; he?: string }) {
  const all = useBookmarks();
  const on = all[kind].some((x) => x.href === href);
  const [note, setNote] = useState("");
  const toggle = () => {
    const b = read();
    if (on) {
      b[kind] = b[kind].filter((x) => x.href !== href);
      setNote("");
    } else {
      const list = [...b[kind], { href, label, he, at: Date.now() }].sort((x, y) => y.at - x.at);
      if (list.length > MAX_BOOKMARKS) setNote(`Bookmarked (your oldest, ${list[MAX_BOOKMARKS].label}, made room)`);
      else setNote("Bookmarked: find it on the home page");
      b[kind] = list.slice(0, MAX_BOOKMARKS);
      setTimeout(() => setNote(""), 4000);
    }
    write(b);
  };
  return (
    <span className="inline-flex items-center gap-2" dir="ltr">
      <button
        type="button"
        onClick={toggle}
        title={on ? "Remove bookmark" : "Bookmark this"}
        aria-pressed={on}
        className={`rounded-full px-2 py-0.5 text-sm ring-1 ${on ? "bg-amber-100 text-amber-900 ring-amber-400" : "text-stone-500 ring-stone-200 hover:bg-amber-50"}`}
      >
        🔖 {on ? "Bookmarked" : "Bookmark"}
      </button>
      {note && <span className="font-sans text-xs text-stone-500">{note}</span>}
    </span>
  );
}

/** The home page box: the reader's bookmarks, one tap away. */
export function MyBookmarks() {
  const b = useBookmarks();
  if (!b.tanakh.length && !b.tefillah.length)
    return (
      <p className="mb-6 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-2 text-sm text-stone-600">
        🔖 Tap &ldquo;Bookmark&rdquo; beside any part of the Tanakh or the Siddur to keep it here (up to 3 of each).
      </p>
    );
  const col = (kind: BookmarkKind, title: string, he: string) => (
    <div className="min-w-0 flex-1">
      <h3 className="flex items-baseline justify-between text-sm font-semibold text-stone-700">
        {title}
        <span dir="rtl" lang="he" className="font-hebrew text-stone-500">
          {he}
        </span>
      </h3>
      {b[kind].length ? (
        <ul className="mt-1.5 space-y-1.5">
          {b[kind].map((x) => (
            <li key={x.href} className="flex items-center gap-2">
              <Link href={x.href} className="min-w-0 flex-1 truncate rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-stone-900 ring-1 ring-amber-200 hover:bg-amber-100">
                🔖 {x.label}
                {x.he && (
                  <span dir="rtl" lang="he" className="ms-2 font-hebrew text-amber-800">
                    {x.he}
                  </span>
                )}
              </Link>
              <button type="button" onClick={() => removeBookmark(kind, x.href)} className="text-xs text-stone-400 hover:text-rose-600" aria-label="Remove bookmark">
                ✕
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1.5 text-xs text-stone-400">No bookmarks yet.</p>
      )}
    </div>
  );
  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">My bookmarks</h2>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row">
        {col("tanakh", "Tanakh", "תנ״ך")}
        {col("tefillah", "Tefillah", "תפילה")}
      </div>
    </section>
  );
}
