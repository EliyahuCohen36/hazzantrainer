"use client";

import { useEffect, useState } from "react";
import { asset } from "./base-path";
import { supabase, supabaseConfigured } from "./supabase";
import { DEMO_FILES } from "@/data/demo";

/**
 * The Hazzan's recordings. The few used by the open demo stay in public/ (anyone
 * can hear them). All the others are in the private "recordings" bucket in
 * Supabase and are handed out only to signed-in users whose licence is current,
 * as links that expire after an hour.
 *
 * Paths in the data files look like "/audio/teamim/torah/tarha.mp3"; in the
 * bucket the same file is "teamim/torah/tarha.mp3".
 */
const cache = new Map<string, Promise<string>>();
const HOUR = 60 * 60;

export function isPublicRecording(path: string) {
  return DEMO_FILES.has(path) || !supabaseConfigured;
}

/** The nusach the reader picked (header). Yerushalmi uses the Syrian recordings
 *  except where a Yerushalmi one was uploaded (nusach/yerushalmi/<same path>). */
export function currentNusach(): string {
  try {
    return localStorage.getItem("kriah-nusach") || "syrian";
  } catch {
    return "syrian";
  }
}

async function bucketPathFor(path: string): Promise<string> {
  const p = path.replace(/^\/audio\//, "");
  const n = currentNusach();
  if (n === "syrian") return p;
  const alt = `nusach/${n}/${p}`;
  const dir = alt.slice(0, alt.lastIndexOf("/"));
  const names = await listRecordings(dir).catch(() => new Set<string>());
  return names.has(alt.slice(alt.lastIndexOf("/") + 1)) ? alt : p;
}

/* Offline: the last link and folder listing are kept in this browser, and the service worker
   (public/sw.js) plays recordings heard before from its cache, whatever the link's token. */
const remember = (k: string, v: unknown) => {
  try {
    localStorage.setItem(`kriah-off:${k}`, JSON.stringify(v));
  } catch {}
};
const recall = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(`kriah-off:${k}`);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
};

export function recordingUrl(path: string): Promise<string> {
  if (isPublicRecording(path)) return Promise.resolve(asset(path));
  const key = `${currentNusach()}:${path}`;
  if (!cache.has(key)) {
    const p = bucketPathFor(path)
      .then((bp) => supabase().storage.from("recordings").createSignedUrl(bp, HOUR))
      .then(({ data, error }) => {
        if (error || !data) {
          const old = recall<string>(`url:${key}`);
          if (old && typeof navigator !== "undefined" && !navigator.onLine) return old;
          throw new Error("This recording is for signed-in students.");
        }
        remember(`url:${key}`, data.signedUrl);
        return data.signedUrl;
      })
      .catch((e) => {
        const old = recall<string>(`url:${key}`);
        if (old && !navigator.onLine) return old;
        throw e;
      });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
    // Links expire after an hour; ask for a fresh one a little before that.
    setTimeout(() => cache.delete(key), (HOUR - 300) * 1000);
  }
  return cache.get(key)!;
}

/** The playable URL of a recording, or null while it's being fetched / if not allowed. */
export function useRecordingUrl(path: string | undefined | null): string | null {
  const [url, setUrl] = useState<string | null>(() => (path && isPublicRecording(path) ? asset(path) : null));
  useEffect(() => {
    let live = true;
    if (!path) {
      setUrl(null);
      return;
    }
    recordingUrl(path).then(
      (u) => live && setUrl(u),
      () => live && setUrl(null),
    );
    return () => {
      live = false;
    };
  }, [path]);
  return url;
}

/* Folders of the bucket that pages look into (Tanakh readings, te'amim of other tunes). */
const folders = new Map<string, Promise<Set<string>>>();

/** Names of the files in a bucket folder ("/audio/reading/bereshit/noah"), cached for the visit. */
export function listRecordings(folder: string, fresh = false): Promise<Set<string>> {
  const f = folder.replace(/^\/audio\//, "").replace(/\/$/, "");
  if (!supabaseConfigured) return Promise.resolve(new Set());
  if (fresh || !folders.has(f)) {
    const p = supabase()
      .storage.from("recordings")
      .list(f, { limit: 1000 })
      .then(({ data, error }) => {
        if (error || !data) return new Set(recall<string[]>(`dir:${f}`) ?? []);
        const names = data.filter((o) => o.id).map((o) => o.name);
        remember(`dir:${f}`, names);
        return new Set(names);
      })
      .catch(() => new Set(recall<string[]>(`dir:${f}`) ?? []));
    p.catch(() => folders.delete(f));
    folders.set(f, p);
  }
  return folders.get(f)!;
}

export const RECORDINGS_CHANGED = "kriah-recordings-changed";

/** After the admin uploads or deletes a recording: forget what was cached so every page looks again. */
export function recordingsChanged(path: string) {
  const f = path.replace(/^\/audio\//, "");
  folders.delete(f.slice(0, f.lastIndexOf("/")));
  for (const k of [...cache.keys()]) if (k.endsWith(`:${path}`) || k.endsWith(`:/audio/${f}`)) cache.delete(k);
  window.dispatchEvent(new Event(RECORDINGS_CHANGED));
}

/** Which of these recordings exist (null while checking). */
export function useExistingRecordings(paths: string[]): Set<string> | null {
  const key = paths.join("|");
  const [have, setHave] = useState<Set<string> | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const on = () => setBump((b) => b + 1);
    window.addEventListener(RECORDINGS_CHANGED, on);
    return () => window.removeEventListener(RECORDINGS_CHANGED, on);
  }, []);
  useEffect(() => {
    let live = true;
    const dirs = [...new Set(paths.map((p) => p.slice(0, p.lastIndexOf("/"))))];
    Promise.all(dirs.map((d) => listRecordings(d).then((names) => [...names].map((n) => `${d}/${n}`)))).then(
      (lists) => live && setHave(new Set(lists.flat().filter((p) => paths.includes(p)))),
      () => live && setHave(new Set()),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, bump]);
  return have;
}

/** Every recording in one bucket folder ("/audio/siddur/shaharit"), as full paths (null while checking). */
export function useFolder(folder: string): Set<string> | null {
  const [have, setHave] = useState<Set<string> | null>(null);
  const [bump, setBump] = useState(0);
  useEffect(() => {
    const on = () => setBump((b) => b + 1);
    window.addEventListener(RECORDINGS_CHANGED, on);
    return () => window.removeEventListener(RECORDINGS_CHANGED, on);
  }, []);
  useEffect(() => {
    let live = true;
    const d = folder.replace(/\/$/, "");
    listRecordings(d).then(
      (names) => live && setHave(new Set([...names].map((n) => `${d}/${n}`))),
      () => live && setHave(new Set()),
    );
    return () => {
      live = false;
    };
  }, [folder, bump]);
  return have;
}
