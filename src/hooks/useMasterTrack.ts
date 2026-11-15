"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MasterRecording, SegmentTiming, TextSegment } from "@/types/curriculum";
import { analyzeRecording, type PitchContour } from "@/lib/audio/contour";
import type { AudioFeatures } from "@/lib/audio/features";
import { recordingUrl } from "@/lib/recordings";

export type MasterStatus = "loading" | "analyzing" | "ready" | "missing" | "error";

export interface MasterTrack {
  status: MasterStatus;
  /** Playable URL (public path or blob: URL). */
  src: string | null;
  label: string;
  timings: SegmentTiming[];
  contour: PitchContour | null;
  /** Frame features for pauses, clarity and note placement. */
  features: AudioFeatures | null;
  progress: number;
  error?: string;
}

/**
 * Loads the master recording, then analyses its pitch contour in the browser.
 * Source: the Hazzan's recording for the lesson.
 */
export function useMasterTrack(recording: MasterRecording | undefined, segments: TextSegment[]) {
  const [track, setTrack] = useState<MasterTrack>({
    status: recording ? "loading" : "missing",
    src: null,
    label: recording?.reader ?? "No recording",
    timings: [],
    contour: null,
    features: null,
    progress: 0,
  });

  // Each load gets an id, so a slow earlier load can't overwrite a newer one.
  const requestId = useRef(0);
  const objectUrl = useRef<string | null>(null);

  const setObjectUrl = (url: string | null) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = url;
  };

  const analyze = useCallback(
    async (data: ArrayBuffer, src: string, label: string, timings: SegmentTiming[]) => {
      const id = ++requestId.current;
      setTrack({ status: "analyzing", src, label, timings, contour: null, features: null, progress: 0 });
      try {
        const { contour, features } = await analyzeRecording(data, (p) => {
          if (id === requestId.current) setTrack((t) => ({ ...t, progress: p }));
        });
        if (id !== requestId.current) return;
        if (contour.voicedSec < 0.3) throw new Error("No singing detected in this recording.");
        setTrack({ status: "ready", src, label, timings, contour, features, progress: 1 });
      } catch (e) {
        if (id !== requestId.current) return;
        setTrack((t) => ({ ...t, status: "error", error: e instanceof Error ? e.message : "Could not decode audio." }));
      }
    },
    [],
  );

  const loadDefault = useCallback(async () => {
    if (!recording) return;
    const id = ++requestId.current;
    setTrack((t) => ({ ...t, status: "loading", error: undefined }));
    try {
      const src = await recordingUrl(recording.src);
      const res = await fetch(src);
      if (id !== requestId.current) return;
      if (!res.ok) {
        setTrack((t) => ({ ...t, status: "missing", src: null, contour: null }));
        return;
      }
      setObjectUrl(null);
      await analyze(await res.arrayBuffer(), src, recording.reader, recording.segmentTimings ?? []);
    } catch {
      if (id === requestId.current) setTrack((t) => ({ ...t, status: "missing", src: null }));
    }
  }, [recording, analyze]);

  useEffect(() => {
    void loadDefault();
  }, [loadDefault]);

  useEffect(() => () => setObjectUrl(null), []);

  return { track, reloadDefault: loadDefault };
}
