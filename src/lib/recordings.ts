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

export function recordingUrl(path: string): Promise<string> {
  if (isPublicRecording(path)) return Promise.resolve(asset(path));
  if (!cache.has(path)) {
    const p = supabase()
      .storage.from("recordings")
      .createSignedUrl(path.replace(/^\/audio\//, ""), HOUR)
      .then(({ data, error }) => {
        if (error || !data) throw new Error("This recording is for signed-in students.");
        return data.signedUrl;
      });
    p.catch(() => cache.delete(path));
    cache.set(path, p);
    // Links expire after an hour; ask for a fresh one a little before that.
    setTimeout(() => cache.delete(path), (HOUR - 300) * 1000);
  }
  return cache.get(path)!;
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
      .then(({ data }) => new Set((data ?? []).filter((o) => o.id).map((o) => o.name)));
    p.catch(() => folders.delete(f));
    folders.set(f, p);
  }
  return folders.get(f)!;
}

/** Which of these recordings exist (null while checking). */
export function useExistingRecordings(paths: string[]): Set<string> | null {
  const key = paths.join("|");
  const [have, setHave] = useState<Set<string> | null>(null);
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
  }, [key]);
  return have;
}
