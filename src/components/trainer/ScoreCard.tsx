"use client";

import type { ReactNode } from "react";
import type { ComparisonResult } from "@/lib/audio/compare";
import type { ReadingResult, WordReport } from "@/lib/audio/reading-score";
import { splitAtStress } from "@/lib/hebrew/syllables";
import { SCORING } from "@/lib/audio/scoring-config";

/** Pauses are reminders only unless they have a weight in the score. */
const PAUSES_SCORED = SCORING.weights.pauses > 0;

interface Props {
  /** Melody comparison (always present). */
  result: ComparisonResult;
  /** Full reading score, when the recording could be analysed. */
  reading: ReadingResult | null;
  audioUrl: string | null;
}

function verdict(score: number, notesMisplaced: boolean): { text: string; tone: string } {
  if (score >= 90 && notesMisplaced) return { text: "Very good. Just put every note on its syllable.", tone: "text-emerald-700" };
  if (score >= 90) return { text: "Excellent! Ready for the bimah.", tone: "text-emerald-700" };
  if (score >= 75) return { text: "Very good. A few things to polish.", tone: "text-emerald-700" };
  if (score >= 55) return { text: "Getting there. Listen again at 0.75× and follow the tips below.", tone: "text-amber-600" };
  return { text: "Keep practicing. Try one word at a time with the master.", tone: "text-rose-600" };
}

const tone = (s: number) => (s >= 80 ? "bg-emerald-600" : s >= 55 ? "bg-amber-500" : "bg-rose-500");
const textTone = (s: number) => (s >= 80 ? "text-emerald-700" : s >= 55 ? "text-amber-600" : "text-rose-600");

function Bar({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div title={hint}>
      <div className="flex justify-between text-xs text-stone-600">
        <span>{label}</span>
        <span className="tabular-nums font-medium">{value === null ? "n/a" : value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-stone-200">
        {value !== null && <div className={`h-2 rounded-full ${tone(value)}`} style={{ width: `${Math.max(2, value)}%` }} />}
      </div>
    </div>
  );
}

function StressedWord({ text }: { text: string }) {
  const parts = splitAtStress(text);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.before}
      <span className="rounded bg-amber-200/80">{parts.stressed}</span>
      {parts.after}
    </>
  );
}

function Mark({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 ${ok ? "text-emerald-700" : "text-rose-600"}`}>
      <span aria-hidden>{ok ? "✓" : "✗"}</span>
      {children}
    </span>
  );
}

function PauseCell({ w }: { w: WordReport }) {
  const p = w.pause;
  if (!p) return <span className="text-stone-300">–</span>;
  const sec = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
  if (!PAUSES_SCORED && !p.ok) {
    return (
      <span className="inline-flex items-center gap-1 text-amber-700">
        <span aria-hidden>↺</span>
        {p.kind === "stop" ? "Remember to pause" : "Keep going here"}
      </span>
    );
  }
  if (p.kind === "stop") {
    return (
      <Mark ok={p.ok}>
        {p.ok ? "Paused" : "Pause"} {sec(p.actualMs)}
        <span className="text-stone-400">/ {sec(p.requiredMs)}</span>
      </Mark>
    );
  }
  return <Mark ok={p.ok}>{p.ok ? "Connected" : `Stopped ${sec(p.actualMs)}`}</Mark>;
}

function PlacementCell({ w }: { w: WordReport }) {
  const p = w.placement;
  if (!p) return <span className="text-stone-300">–</span>;
  if (p.ok) return <Mark ok>On the syllable</Mark>;
  return <Mark ok={false}>{p.shiftSyllables < 0 ? "Too early" : "Too late"}</Mark>;
}

export function ScoreCard({ result, reading, audioUrl }: Props) {
  const score = reading?.overall ?? result.score;
  const v = verdict(score, !!reading?.words.some((w) => w.placement && !w.placement.ok));

  return (
    <div className="space-y-5 rounded-xl bg-stone-50 p-5">
      <div className="flex flex-wrap items-center gap-6">
        <div className="text-center">
          <div className={`text-5xl font-bold tabular-nums ${v.tone}`}>{score}</div>
          <div className="text-xs uppercase tracking-wide text-stone-500">{reading ? "Score" : "Accuracy"}</div>
        </div>
        <div className="min-w-56 flex-1 space-y-1 text-sm">
          <p className={`font-medium ${v.tone}`}>{v.text}</p>
          <p className="text-stone-600">
            Average distance from the melody: <span className="tabular-nums">{Math.round(result.meanErrorSemitones * 100)} cents</span>
            <span className="text-stone-400"> (100 cents = 1 semitone)</span>
          </p>
          <p className="text-stone-600">
            Pasuk covered: <span className="tabular-nums">{Math.round(result.coverage * 100)}%</span>
          </p>
        </div>
        {audioUrl && (
          <div className="w-full sm:w-auto">
            <div className="mb-1 text-xs text-stone-500">Your recording</div>
            <audio src={audioUrl} controls className="h-9 w-full sm:w-64" />
          </div>
        )}
      </div>

      {reading && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Bar label="Melody" value={reading.subscores.melody} hint="The right notes for each ta'am" />
            <Bar label="Note on the right syllable" value={reading.subscores.placement} hint="Each ta'am's melody sung on its stressed syllable" />
            <Bar label="Clarity" value={reading.subscores.clarity} hint="Clear, steady, audible voice and words" />
            {PAUSES_SCORED && (
              <Bar label="Pauses" value={reading.subscores.pauses} hint="Stopping after each mafsik, flowing on after each mesharet" />
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
            <span>Clarity:</span>
            <span>Full voice <b className={textTone(reading.clarity.voicing)}>{reading.clarity.voicing}</b></span>
            <span>Steady notes <b className={textTone(reading.clarity.steadiness)}>{reading.clarity.steadiness}</b></span>
            <span>Loud enough <b className={textTone(reading.clarity.loudness)}>{reading.clarity.loudness}</b></span>
            <span>Clear words <b className={textTone(reading.clarity.articulation)}>{reading.clarity.articulation}</b></span>
          </div>

          {reading.tips.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">What to work on</div>
              <ul className="list-disc space-y-1 ps-5 text-sm text-amber-900">
                {reading.tips.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 pe-6 font-medium">Word</th>
                  <th className="py-2 pe-3 font-medium">Ta&apos;am</th>
                  <th className="py-2 pe-3 font-medium">Melody</th>
                  <th className="py-2 pe-3 font-medium">Note placement</th>
                  <th className="py-2 font-medium">Pause{!PAUSES_SCORED && <span className="ms-1 normal-case tracking-normal text-stone-400">(not scored)</span>}</th>
                </tr>
              </thead>
              <tbody>
                {reading.words.map((w) => (
                  <tr key={w.segmentId} className="border-b border-stone-100 last:border-0">
                    <td className="whitespace-nowrap py-2 pe-6">
                      <span dir="rtl" lang="he" className="font-hebrew text-xl">
                        <StressedWord text={w.text} />
                      </span>
                    </td>
                    <td className="py-2 pe-3 text-stone-600">
                      {w.taam?.syrian ?? "–"}
                      {w.taam && <span className="ms-1 text-xs text-stone-400">{w.taam.role === "disjunctive" ? "mafsik" : "mesharet"}</span>}
                    </td>
                    <td className={`py-2 pe-3 tabular-nums ${w.melody === undefined ? "text-stone-300" : textTone(w.melody)}`}>{w.melody ?? "–"}</td>
                    <td className="py-2 pe-3">
                      <PlacementCell w={w} />
                    </td>
                    <td className="py-2">
                      <PauseCell w={w} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-stone-500">The highlighted letter is where the ta&apos;am&apos;s melody belongs.</p>
          </div>
        </>
      )}
    </div>
  );
}
