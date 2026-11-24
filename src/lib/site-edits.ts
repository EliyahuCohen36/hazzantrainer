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

/** The owner's fix to a Beginner Keriah question word, keyed by "<kind>|<original word>". */
export interface WordEdit {
  w?: string;
  r?: string;
  x?: string;
  y?: string;
  hide?: boolean;
}

/** A picture the owner added next to some text (SiteEditor "Add a picture"). */
export interface SitePicture {
  id: string;
  /** Page path ("/about/"), the English text it sits next to, and where. */
  page: string;
  near: string;
  where: "before" | "after";
  url: string;
  /** Width in % of the column (10–100). */
  width: number;
  alt?: string;
}

/** The owner's changes to the Songs and maqam tunes chart (/siddur/tunes/), keyed by link. */
export interface TunesEdits {
  hidden?: string[];
  labels?: Record<string, string>;
  /** Links the owner added: label, link and the part (slug) it is listed under, or "pizmonim". */
  extra?: { label: string; href: string; part: string }[];
}

/** A word example for a ta'am (recorded by the Hazzan): teamim-words/<tune>/<taamId>-<id>.mp3. */
export interface TaamWord {
  id: string;
  word: string;
  /** Where it's from ("Bereshit 1:2"). */
  ref?: string;
  /** One of the 15 ready-made words that the owner took off the list. */
  hidden?: boolean;
}

export interface SiteEdits {
  /** Keyed by the original English text. */
  text: Record<string, TextEdit>;
  tabs?: HomeTab[];
  words?: Record<string, WordEdit>;
  pictures?: SitePicture[];
  tunes?: TunesEdits;
  taamWords?: Record<string, Record<string, TaamWord[]>>;
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
