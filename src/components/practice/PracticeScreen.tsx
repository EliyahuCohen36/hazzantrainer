"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LessonContext } from "@/types/curriculum";
import { useMasterTrack } from "@/hooks/useMasterTrack";
import { DisplayModeToggle, type ReaderSettings } from "@/components/reader/DisplayModeToggle";
import { HebrewReader } from "@/components/reader/HebrewReader";
import { MasterAudioPlayer } from "@/components/audio/MasterAudioPlayer";
import { useSpeed } from "@/lib/audio/speed";
import { VoiceTrainer } from "@/components/trainer/VoiceTrainer";

interface Props {
  context: LessonContext;
}

/**
 * Phase 1 student practice screen: reading pane, master player, voice trainer.
 * All state is local to this screen. Phase 2 adds persistence (attempt
 * history, teacher dashboards) without changing the child components.
 */
export function PracticeScreen({ context }: Props) {
  const { subject, course, unit, lesson } = context;
  const recording = lesson.recordings[0];

  const [settings, setSettings] = useState<ReaderSettings>({
    scrollMode: false,
    showNikkud: true,
    showTeamim: true,
    showTaamNames: true,
  });
  const rate = useSpeed();
  const [wordScores, setWordScores] = useState<Record<string, number> | null>(null);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { track } = useMasterTrack(recording, lesson.segments);

  // Highlight the word that is sounding. Uses rAF while playing because
  // the "timeupdate" event only fires ~4×/second.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || track.timings.length === 0) {
      setActiveSegment(null);
      return;
    }
    let raf = 0;
    const update = () => {
      const t = a.currentTime;
      const seg = track.timings.find((s) => t >= s.start && t < s.end);
      setActiveSegment(a.paused && t === 0 ? null : (seg?.segmentId ?? null));
      if (!a.paused) raf = requestAnimationFrame(update);
    };
    const onPlay = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    const onStop = () => {
      cancelAnimationFrame(raf);
      setActiveSegment(null);
    };
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onStop);
    a.addEventListener("ended", onStop);
    return () => {
      cancelAnimationFrame(raf);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onStop);
      a.removeEventListener("ended", onStop);
    };
  }, [track.timings, track.src]);

  // Clicking a word plays from that word.
  const seekToSegment = useCallback(
    (segmentId: string) => {
      const a = audioRef.current;
      const timing = track.timings.find((t) => t.segmentId === segmentId);
      if (!a || !timing) return;
      a.currentTime = timing.start;
      void a.play();
    },
    [track.timings],
  );

  // A new master invalidates old scores.
  useEffect(() => setWordScores(null), [track.src]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      <header className="mb-6">
        <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:underline">
            Keriah Trainer
          </Link>
          <span className="mx-1.5">/</span>
          {subject.kind === "torah" ? (
            <Link href="/tanakh/torah/" className="hover:underline">
              Torah
            </Link>
          ) : (
            subject.title.en
          )}
          <span className="mx-1.5">/</span>
          {course.title.en}
          <span className="mx-1.5">/</span>
          {unit.title.en}
        </nav>
        <div className="mt-1 flex items-baseline justify-between gap-4">
          <h1 className="text-2xl font-semibold text-stone-900">{lesson.title.en}</h1>
          <span dir="rtl" lang="he" className="font-hebrew text-xl text-stone-600">
            {lesson.title.he}
          </span>
        </div>
      </header>

      <main className="space-y-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <DisplayModeToggle value={settings} onChange={setSettings} />
          <div className="mt-5">
            <HebrewReader
              segments={lesson.segments}
              settings={settings}
              activeSegmentId={activeSegment}
              segmentScores={wordScores ?? undefined}
              onSegmentClick={track.timings.length ? seekToSegment : undefined}
            />
          </div>
        </section>

        <MasterAudioPlayer
          track={track}
          audioRef={audioRef}
          rate={rate}
        />

        <VoiceTrainer
          track={track}
          audioRef={audioRef}
          playbackRate={rate}
          segments={lesson.segments}
          onResult={setWordScores}
        />
      </main>
    </div>
  );
}
