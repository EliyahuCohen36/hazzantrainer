"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPitchDetector } from "@/lib/audio/pitch-detector";
import { hzToMidi } from "@/lib/audio/pitch-math";

export interface LiveFrame {
  /** Seconds since recording started. */
  t: number;
  hz: number | null;
  midi: number | null;
}

export interface RecordingResult {
  frames: LiveFrame[];
  /** Average seconds between frames. */
  hopSec: number;
  duration: number;
  /** blob: URL of the student's own audio, for listening back. */
  audioUrl: string | null;
  /** The recorded audio itself, analysed after recording for the full score. */
  audioBlob: Blob | null;
}

export type RecorderStatus = "idle" | "requesting" | "recording" | "error";

const FFT_SIZE = 2048; // ~43 ms window at 48 kHz

/**
 * Microphone capture + live pitch detection with the Web Audio API.
 *
 * Signal path: getUserMedia → MediaStreamSource → AnalyserNode (not routed
 * to the speakers, so there is no feedback). Each animation frame we read the
 * latest 2048 samples and run YIN on them. A MediaRecorder runs alongside it
 * so the student can play back their attempt.
 *
 * Upgrade path: move detection into an AudioWorklet for sample-accurate
 * frames that are not tied to the screen refresh rate.
 */
export function usePitchRecorder() {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const framesRef = useRef<LiveFrame[]>([]);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
  }, []);

  const start = useCallback(
    async (onFrame?: (f: LiveFrame) => void) => {
      setError(null);
      setStatus("requesting");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Microphone access needs a secure page (https:// or localhost).");
        }
        // Turn off voice-call processing: it distorts pitch and squashes quiet notes.
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
        });
        streamRef.current = stream;

        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        await ctx.resume();
        ctxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        source.connect(analyser);

        // Keep the raw audio for playback.
        chunksRef.current = [];
        if (typeof MediaRecorder !== "undefined") {
          const rec = new MediaRecorder(stream);
          rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
          rec.start();
          mediaRecRef.current = rec;
        }

        const detect = createPitchDetector({ sampleRate: ctx.sampleRate });
        const buf = new Float32Array(FFT_SIZE);
        const t0 = ctx.currentTime;
        framesRef.current = [];

        const tick = () => {
          analyser.getFloatTimeDomainData(buf);
          const hz = detect(buf);
          const frame: LiveFrame = { t: ctx.currentTime - t0, hz, midi: hz === null ? null : hzToMidi(hz) };
          framesRef.current.push(frame);
          onFrame?.(frame);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        setStatus("recording");
      } catch (e) {
        cleanup();
        setStatus("error");
        const msg =
          e instanceof DOMException && e.name === "NotAllowedError"
            ? "Microphone permission was denied. Allow it in the browser's address bar and try again."
            : e instanceof Error
              ? e.message
              : "Could not start the microphone.";
        setError(msg);
      }
    },
    [cleanup],
  );

  const stop = useCallback(async (): Promise<RecordingResult> => {
    const frames = framesRef.current;
    const rec = mediaRecRef.current;
    mediaRecRef.current = null;

    const audioBlob = await new Promise<Blob | null>((resolve) => {
      if (!rec || rec.state === "inactive") return resolve(null);
      rec.onstop = () => resolve(new Blob(chunksRef.current, { type: rec.mimeType }));
      rec.stop();
    });
    cleanup();
    setStatus("idle");

    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = audioBlob ? URL.createObjectURL(audioBlob) : null;

    const duration = frames.length ? frames[frames.length - 1].t : 0;
    return {
      frames,
      hopSec: frames.length > 1 ? duration / (frames.length - 1) : 1 / 60,
      duration,
      audioUrl: audioUrlRef.current,
      audioBlob,
    };
  }, [cleanup]);

  useEffect(
    () => () => {
      cleanup();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [cleanup],
  );

  return { status, error, start, stop, framesRef };
}
