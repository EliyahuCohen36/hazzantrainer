"use client";

import { useRecordingUrl } from "@/lib/recordings";

/** An audio player for one of the Hazzan's recordings (public demo file or private, signed link). */
export function Recording({ src, className = "h-9 w-full max-w-sm" }: { src: string; className?: string }) {
  const url = useRecordingUrl(src);
  if (!url) {
    return <div className={`${className} animate-pulse rounded-full bg-stone-100`} aria-label="Loading recording" />;
  }
  return <audio src={url} controls preload="none" className={className} />;
}
