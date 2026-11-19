"use client";

import { useEffect, useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";

/**
 * The owner's own changes to the site's wording, colours and home-page tabs (owner's request, Nov 2026),
 * made in "Edit this page" (SiteEditor.tsx) and kept in Supabase (supabase/site.sql: site_settings,
 * key "edits"). Everyone reads them; only the admin can save. Text from the Tanakh and the Siddur is
 * never changed (anything inside lang="he" or data-no-translate is left alone).
 */
export interface TextEdit {
  /** New English wording (empty = keep the original). */
  en?: string;
  he?: string;
  ar?: string;
  color?: string;
  bg?: string;
  bold?: boolean;
  /** Colour the whole card/box around the text instead of just the text. */
  box?: boolean;
}

export interface TabItem {
  title: string;
  href: string;
  text?: string;
}

export interface HomeTab {
  id: string;
  title: string;
  he?: string;
  color: string;
  /** Built-in tabs (beginner, tanakh, tefillah) show their own content; added tabs show their links. */
  builtin?: boolean;
  hidden?: boolean;
  items?: TabItem[];
}

export interface SiteEdits {
  /** Keyed by the original English text. */
  text: Record<string, TextEdit>;
  tabs?: HomeTab[];
}

const CACHE = "kriah-site-edits";
export const EDITS_EVENT = "kriah-site-edits";
let current: SiteEdits = { text: {} };
let loaded = false;

try {
  const c = typeof localStorage !== "undefined" ? localStorage.getItem(CACHE) : null;
  if (c) current = { text: {}, ...JSON.parse(c) };
} catch {}

export const getEdits = () => current;
export const textEdit = (en: string): TextEdit | undefined => current.text[en];
export const hasTextEdits = () => Object.keys(current.text).length > 0;

function set(e: SiteEdits) {
  current = e;
  try {
    localStorage.setItem(CACHE, JSON.stringify(e));
  } catch {}
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EDITS_EVENT));
}

/** Load the latest edits once per visit (the cached copy shows meanwhile). */
export function loadEdits() {
  if (loaded || !supabaseConfigured) return;
  loaded = true;
  supabase()
    .from("site_settings")
    .select("value")
    .eq("key", "edits")
    .maybeSingle()
    .then(({ data }) => {
      if (data?.value) set({ ...(data.value as SiteEdits), text: (data.value as SiteEdits).text ?? {} });
    });
}

/** Save (admin only; the database refuses anyone else). */
export async function saveEdits(e: SiteEdits): Promise<string | null> {
  const { error } = await supabase().from("site_settings").upsert({ key: "edits", value: e, updated_at: new Date().toISOString() });
  if (error) return error.message.includes("site_settings") ? "Ask Claude to run supabase/site.sql first." : error.message;
  set(e);
  return null;
}

export function useSiteEdits(): SiteEdits {
  const [e, setE] = useState<SiteEdits>({ text: {} });
  useEffect(() => {
    loadEdits();
    const on = () => setE(getEdits());
    on();
    window.addEventListener(EDITS_EVENT, on);
    return () => window.removeEventListener(EDITS_EVENT, on);
  }, []);
  return e;
}
