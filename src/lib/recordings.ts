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
