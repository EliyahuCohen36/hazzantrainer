import { scoreReading, type ReadingResult, type RecordingAnalysis } from "./reading-score";
import { contourFromHz, type PitchContour } from "./contour";
import { foldOctave, pointScore } from "./pitch-math";

/**
 * Child-friendly feedback for practicing one ta'am against the Hazzan's
 * recording: stars, a short message, and what to fix (start / middle / end
 * too high or too low).
 */

export interface PracticeFeedback {
  score: number;
  stars: 0 | 1 | 2 | 3;
  headline: string;
  tips: string[];
}

const PARTS = ["The start", "The middle", "The end"];

/** The tune resampled to N evenly spaced points (tempo-free shape). */
function shape(c: PitchContour, N = 40): number[] | null {
  const v = c.relative.filter((x): x is number => x !== null);
  if (v.length < 5) return null;
  return Array.from({ length: N }, (_, k) => {
    const pos = (k / (N - 1)) * (v.length - 1);
    const i = Math.floor(pos);
    const f = pos - i;
    return v[i] + (v[Math.min(v.length - 1, i + 1)] - v[i]) * f;
  });
}

/**
 * Score for one ta'am (0–100). A single ta'am is short, so besides the
 * flexible melody match used for whole pesukim, it also compares the overall
 * shape of the tune start to end, and checks it's about the right length
 * (anything from half to twice the Hazzan's length is fine). Tested: the
 * Hazzan's own recordings score 100 for themselves and 30 on average for the
 * other te'amim; a child's voice (an octave up, faster or slower) scores 80–100.
 */
export function scoreTaamPractice(master: RecordingAnalysis, student: RecordingAnalysis) {
  const result = scoreReading(master, student, [], []);
  const a = shape(master.contour);
  const b = shape(student.contour);
  const shapeScore = a && b ? (100 * a.reduce((sum, x, k) => sum + pointScore(foldOctave(b[k] - x)), 0)) / a.length : 0;
  const ratio = student.contour.voicedSec / Math.max(0.05, master.contour.voicedSec);
  const off = Math.abs(Math.log(ratio));
  const lengthFactor = off <= Math.log(2) ? 1 : Math.max(0, 1 - (off - Math.log(2)) / Math.log(2));
  const tune = (0.5 * result.melody.score + 0.5 * shapeScore) * lengthFactor;
  const score = Math.round(0.9 * tune + 0.1 * result.clarity.score);
  return { score, result, tooLong: ratio > 2, tooShort: ratio < 0.5 };
}

/**
 * A long recording (a whole aliyah or chapter) made coarser so it can be
 * compared quickly: at most `maxFrames` frames (blocks of frames merged:
 * the middle pitch of the voiced frames, the average loudness).
 */
export function shrinkAnalysis(a: RecordingAnalysis, maxFrames = 1200): RecordingAnalysis {
  const n = a.features.hz.length;
  const k = Math.ceil(n / maxFrames);
  if (k <= 1) return a;
  const hz: (number | null)[] = [];
  const db: number[] = [];
  const mfcc: Float32Array[] = [];
  for (let i = 0; i < n; i += k) {
    const block = a.features.hz.slice(i, i + k).filter((x): x is number => x !== null);
    hz.push(block.length * 2 >= Math.min(k, n - i) ? block.sort((x, y) => x - y)[block.length >> 1] : null);
    const d = a.features.db.slice(i, i + k);
    db.push(d.reduce((x, y) => x + y, 0) / Math.max(1, d.length));
    const m = a.features.mfcc;
    if (m.length) mfcc.push(m[Math.min(i, m.length - 1)]);
  }
  const hopSec = a.features.hopSec * k;
  const features = { ...a.features, hopSec, hz, db, mfcc };
  return { features, contour: contourFromHz(hz, hopSec) };
}

export function practiceFeedback(
  master: PitchContour,
  { score, result, tooLong, tooShort }: ReturnType<typeof scoreTaamPractice>,
  taamName: string,
): PracticeFeedback {
  const stars = score >= 88 ? 3 : score >= 70 ? 2 : score >= 45 ? 1 : 0;
  const headline =
    stars === 3
      ? `Beautiful! That's the ${taamName}.`
      : stars === 2
        ? "Very good! Almost there."
        : stars === 1
          ? "Good try! Listen again and copy the tune."
          : "Let's try again. Listen first, then sing along.";

  const tips: string[] = [];
  if (tooShort) tips.push(`Sing the whole ${taamName}: yours was much shorter than the Hazzan's.`);
  if (tooLong) tips.push(`Yours was much longer than the Hazzan's. Is it the right ta'am? Listen again.`);

  // Where was the tune off? Average distance from the Hazzan's tune in each third.
  const rel = master.relative;
  const aligned = result.melody.aligned;
  const voicedIdx = rel.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0);
  if (voicedIdx.length > 6) {
    const third = Math.ceil(voicedIdx.length / 3);
    for (let p = 0; p < 3; p++) {
      const idx = voicedIdx.slice(p * third, (p + 1) * third);
      const diffs = idx
        .map((i) => (aligned[i] !== null && rel[i] !== null ? (aligned[i] as number) - (rel[i] as number) : null))
        .filter((d): d is number => d !== null);
      if (diffs.length < 3) continue;
      const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
      if (mean > 1) tips.push(`${PARTS[p]} was too high. Bring it down a little.`);
      else if (mean < -1) tips.push(`${PARTS[p]} was too low. Bring it up a little.`);
    }
  }
  for (const t of result.tips) {
    // Reading tips that make sense for a single ta'am (loudness, voice, clarity).
    if (!/pasuk|Pause|stressed syllable|stop after/i.test(t)) tips.push(t);
  }
  if (!tips.length && stars < 3) tips.push("Listen to the Hazzan once more and match each note.");
  return { score, stars, headline, tips: tips.slice(0, 3) };
}

/*
 * Progress. Signed-in students: saved to their account (so the teacher sees it
 * and it follows them to any device), with a copy in this browser per user so
 * shared school computers don't mix children up. The open demo: this browser only.
 */

const BASE_KEY = "kriah-teamim-progress-v1";
let currentUser: string | null = null;
const key = () => (currentUser ? `${BASE_KEY}:${currentUser}` : BASE_KEY);

interface Progress {
  /** Best practice score per recording file. */
  practice: Record<string, number>;
  /** Quiz answers per ta'am id. */
  quiz: Record<string, { right: number; total: number }>;
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(key());
    if (raw) return { practice: {}, quiz: {}, ...JSON.parse(raw) };
  } catch {
    // Storage may be unavailable (private mode); progress is just not kept.
  }
  return { practice: {}, quiz: {} };
}

/** Fired on window whenever progress changes, so screens can update. */
export const PROGRESS_EVENT = "kriah-progress";

function save(p: Progress) {
  try {
    localStorage.setItem(key(), JSON.stringify(p));
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PROGRESS_EVENT));
}

async function db() {
  if (!currentUser) return null;
  const { supabase } = await import("@/lib/supabase");
  return supabase();
}

/* Offline (the app on the home screen): saves that couldn't reach the account wait here and are
   sent when the device is back online. save_practice keeps the best score, so sending twice is safe. */
const OUTBOX = "kriah-progress-outbox";
type Pending = { fn: "save_practice" | "save_quiz"; args: Record<string, unknown>; user: string };

function queue(item: Pending) {
  try {
    const q: Pending[] = JSON.parse(localStorage.getItem(OUTBOX) ?? "[]");
    q.push(item);
    localStorage.setItem(OUTBOX, JSON.stringify(q.slice(-2000)));
  } catch {}
}

function send(fn: Pending["fn"], args: Record<string, unknown>) {
  const user = currentUser;
  if (!user) return;
  db()
    .then((c) => c?.rpc(fn, args))
    .then((r) => {
      if (r?.error && /fetch|network/i.test(r.error.message)) throw r.error;
    })
    .catch(() => queue({ fn, args, user }));
}

/** Send what was saved while offline (called on sign-in and whenever the device comes back online). */
export async function flushOutbox() {
  if (!currentUser) return;
  let q: Pending[] = [];
  try {
    q = JSON.parse(localStorage.getItem(OUTBOX) ?? "[]");
  } catch {}
  const mine = q.filter((x) => x.user === currentUser);
  if (!mine.length) return;
  const c = await db();
  if (!c) return;
  const left: Pending[] = q.filter((x) => x.user !== currentUser);
  for (const x of mine) {
    const r = await c.rpc(x.fn, x.args).then(
      (r) => r,
      () => ({ error: { message: "network" } }),
    );
    if (r.error && /fetch|network/i.test(r.error.message)) left.push(x);
  }
  localStorage.setItem(OUTBOX, JSON.stringify(left));
}

if (typeof window !== "undefined") window.addEventListener("online", () => flushOutbox().catch(() => {}));

/** After sign-in: send anything saved offline, then load this student's progress from their account
 *  (kept together with what's in this browser: the best of both). */
export async function pullProgress() {
  const { supabase } = await import("@/lib/supabase");
  const client = supabase();
  const { data: s } = await client.auth.getSession();
  currentUser = s.session?.user.id ?? null;
  if (!currentUser) return;
  await flushOutbox().catch(() => {});
  const { data, error } = await client.from("progress").select("kind, key, best, right_n, total_n").eq("user_id", currentUser);
  if (error) return; // offline: keep this browser's copy
  const local = loadProgress();
  const p: Progress = { practice: { ...local.practice }, quiz: { ...local.quiz } };
  for (const r of data ?? []) {
    if (r.kind === "practice") p.practice[r.key] = Math.max(r.best, local.practice[r.key] ?? 0);
    else if ((local.quiz[r.key]?.total ?? 0) <= r.total_n) p.quiz[r.key] = { right: r.right_n, total: r.total_n };
  }
  save(p);
}

/** After sign-out: back to the anonymous (demo) progress. */
export function forgetUser() {
  currentUser = null;
}

export function recordPractice(src: string, score: number): number {
  const p = loadProgress();
  const best = Math.max(score, p.practice[src] ?? 0);
  p.practice[src] = best;
  save(p);
  send("save_practice", { p_key: src, p_score: Math.round(score) });
  return best;
}

/** Keep a score in this browser only (e.g. a teacher's grade read from the account). */
export function setLocalPractice(key: string, score: number) {
  const p = loadProgress();
  if ((p.practice[key] ?? 0) >= score) return;
  p.practice[key] = score;
  save(p);
}

export function recordQuiz(taamId: string, right: boolean) {
  const p = loadProgress();
  const q = p.quiz[taamId] ?? { right: 0, total: 0 };
  p.quiz[taamId] = { right: q.right + (right ? 1 : 0), total: q.total + 1 };
  save(p);
  send("save_quiz", { p_key: taamId, p_right: right });
}
