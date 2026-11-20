"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { asset } from "@/lib/base-path";

export const EDIT_TOGGLE = "kriah-site-edit-toggle";
export const EDIT_STATE = "kriah-site-edit-state";

/** The pages people see before they sign in. "/?visitor" shows the admin the visitors' welcome page. */
const VISITOR_PAGES: [string, string][] = [
  ["/?visitor", "Welcome page"],
  ["/about/", "About"],
  ["/schools/", "For schools"],
  ["/subscribe/", "Plans"],
  ["/demo/", "Demo"],
  ["/login/", "Sign in"],
  ["/join/", "Join"],
];

/**
 * A bar at the very top for the admin only (owner, Nov 20): edit any page, and open the pages visitors see
 * before signing in so they can be edited too.
 */
export function AdminBar() {
  const { profile } = useAuth();
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    const on = (e: Event) => setEditing(!!(e as CustomEvent<boolean>).detail);
    window.addEventListener(EDIT_STATE, on);
    return () => window.removeEventListener(EDIT_STATE, on);
  }, []);
  if (profile?.role !== "admin") return null;
  return (
    <div data-site-editor data-no-translate dir="ltr" className="sticky top-0 z-40 border-b border-violet-200 bg-violet-50 text-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(EDIT_TOGGLE))}
          className={`rounded-full px-3 py-1 font-semibold ${editing ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-300"}`}
        >
          {editing ? "✓ Done editing" : "✏️ Edit this page"}
        </button>
        <span className="text-violet-900">Pages visitors see:</span>
        {VISITOR_PAGES.map(([href, label]) =>
          href.startsWith("/?") ? (
            // A full page load, so the welcome page shows instead of the signed-in home page.
            <a key={href} href={asset(href)} className="text-violet-800 underline-offset-2 hover:underline">
              {label}
            </a>
          ) : (
            <Link key={href} href={href} className="text-violet-800 underline-offset-2 hover:underline">
              {label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}
