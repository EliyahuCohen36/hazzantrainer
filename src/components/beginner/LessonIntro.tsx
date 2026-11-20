"use client";

import { useState } from "react";

/**
 * Lessons open with their introduction and the chart that belongs to them (owner, Nov 2026).
 * Once the questions start the chart is gone; this small "Review" tab brings it back if the child forgets.
 */
export function ReviewTab({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setOpen((r) => !r)}
          aria-expanded={open}
          className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-900 hover:bg-sky-100"
        >
          📖 {open ? "Hide the review" : "Review"}
        </button>
      </div>
      {open && <div className="mt-2 rounded-2xl border border-sky-200 bg-sky-50/50 p-3">{children}</div>}
    </div>
  );
}

/** "What to do" box shown before the questions start. */
export function WhatToDo({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left text-stone-800">
      <p className="font-semibold text-emerald-900">What to do</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
