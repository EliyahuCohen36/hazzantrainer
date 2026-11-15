"use client";

import { useEffect, useRef } from "react";
import { useRecordingUrl } from "@/lib/recordings";
import { applySpeed, useSpeed } from "@/lib/audio/speed";

/** An audio player for one of the Hazzan's recordings, at the chosen speed (pitch unchanged). */
export function Recording({ src, className = "h-9 w-full max-w-sm" }: { src: string; className?: string }) {
  const url = useRecordingUrl(src);
  const speed = useSpeed();
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => applySpeed(ref.current, speed), [speed, url]);
  if (!url) {
    return <div className={`${className} animate-pulse rounded-full bg-stone-100`} aria-label="Loading recording" />;
  }
  return (
    <audio
      ref={ref}
      src={url}
      controls
      preload="none"
      className={className}
      onLoadedMetadata={(e) => applySpeed(e.currentTarget, speed)}
      onPlay={(e) => applySpeed(e.currentTarget, speed)}
    />
  );
}
