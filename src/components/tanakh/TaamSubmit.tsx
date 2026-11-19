"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { loadProgress, recordPractice, setLocalPractice, PROGRESS_EVENT } from "@/lib/audio/taam-practice";

/**
 * Te'amim are learned with a teacher (owner, Nov 2026): no automatic singing score.
 * A school student records the ta'am for their teacher, who gives a grade from 1 to 10
 * (supabase/submissions.sql). 7 or more passes. Everyone else marks a ta'am as learned.
 */
export const PASS_GRADE = 7;
const SUBS_EVENT = "kriah-submissions";

export const gradedKey = (src: string) => `graded:${src}`;
export const learnedKey = (src: string) => `learned:${src}`;

/** Best scores from progress (graded:<src> = teacher's grade × 10, learned:<src> = 100). */
export function useLearned() {
  const [p, setP] = useState<Record<string, number>>({});
  useEffect(() => {
    const read = () => setP(loadProgress().practice);
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    return () => window.removeEventListener(PROGRESS_EVENT, read);
  }, []);
  return p;
}

/** Has this recording's ta'am been learned? Students: a grade of 7+. Others: marked as learned. */
export function isLearned(p: Record<string, number>, src: string, student: boolean) {
  if ((p[gradedKey(src)] ?? 0) >= PASS_GRADE * 10) return true;
  return !student && (p[learnedKey(src)] ?? 0) >= 100;
}

interface Sub {
  id: string;
  src: string;
  grade: number | null;
  created_at: string;
}

/** The signed-in student's recordings (all tunes), newest first. */
function useMySubs(enabled: boolean) {
  const [subs, setSubs] = useState<Sub[] | null>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    const load = () =>
      supabase()
        .from("taam_submissions")
        .select("id, src, grade, created_at")
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!live) return;
          if (error) setMissing(true);
          setSubs((data as Sub[]) ?? []);
          // A grade that came in since: keep it in this browser's progress too (levels read it there).
          const p = loadProgress().practice;
          for (const x of (data as Sub[]) ?? [])
            if (x.grade && (p[gradedKey(x.src)] ?? 0) < x.grade * 10) setLocalPractice(gradedKey(x.src), x.grade * 10);
        });
    load();
    window.addEventListener(SUBS_EVENT, load);
    return () => {
      live = false;
      window.removeEventListener(SUBS_EVENT, load);
    };
  }, [enabled]);
  return { subs, missing };
}

export function TaamSubmit({
  src,
  label,
  tune = "torah",
  level,
  needed,
}: {
  /** The Hazzan's recording the child sings after. */
  src: string;
  label: string;
  tune?: string;
  /** Te'amim level (Torah trainer) and how many recordings of it must pass. */
  level?: number;
  needed?: number;
}) {
  const { profile } = useAuth();
  const role = profile?.role;
  const student = role === "student";
  const learned = useLearned();
  const { subs, missing } = useMySubs(student);
  const [state, setState] = useState<"idle" | "recording" | "review" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  if (role === "teacher" || role === "admin") return null;

  // Not a school student: no recording; they mark the ta'am as learned themselves.
  if (!student) {
    const done = isLearned(learned, src, false);
    return done ? (
      <p className="text-sm font-medium text-emerald-700">✓ Learned</p>
    ) : (
      <button
        type="button"
        onClick={() => recordPractice(learnedKey(src), 100)}
        className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
      >
        ✓ I&apos;ve learned it
      </button>
    );
  }

  const mine = (subs ?? []).filter((s) => s.src === src);
  const best = mine.reduce((m, s) => Math.max(m, s.grade ?? 0), 0);
  const waiting = mine.some((s) => s.grade === null);
  const last = mine.find((s) => s.grade !== null);

  async function start() {
    setMsg("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("error");
      setMsg("The microphone isn't available. Allow the microphone for this site and try again.");
      return;
    }
    const chunks: Blob[] = [];
    const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((t) => MediaRecorder.isTypeSupported?.(t));
    const r = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    r.onstop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      const b = new Blob(chunks, { type: r.mimeType || "audio/webm" });
      setBlob(b);
      setUrl(URL.createObjectURL(b));
      setState("review");
    };
    rec.current = r;
    r.start();
    setState("recording");
  }

  async function send() {
    if (!blob || !profile) return;
    setState("sending");
    const ext = blob.type.includes("mp4") ? "m4a" : "webm";
    const name = src.replace(/^\/audio\//, "").replace(/\.mp3$/, "").replace(/[^a-z0-9_-]+/gi, "_");
    const path = `${profile.id}/${tune}/${name}-${Date.now()}.${ext}`;
    const c = supabase();
    const up = await c.storage.from("submissions").upload(path, blob, { contentType: blob.type });
    const ins = up.error
      ? up
      : await c.from("taam_submissions").insert({ tune, src, label, level: level ?? null, needed: needed ?? null, path });
    if (ins.error) {
      setState("error");
      setMsg("It didn't send. Try again in a minute, or tell your teacher.");
      return;
    }
    setState("sent");
    setBlob(null);
    window.dispatchEvent(new Event(SUBS_EVENT));
  }

  if (missing)
    return <p className="text-xs text-stone-500">Recording for your teacher opens soon.</p>;

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm">
      {best >= PASS_GRADE ? (
        <p className="font-medium text-emerald-700">
          ✓ Passed! Your teacher gave you {best}/10.
        </p>
      ) : last ? (
        <p className="text-stone-700">
          Your teacher gave you {last.grade}/10. You need {PASS_GRADE} to pass. Listen again and try once more.
        </p>
      ) : null}
      {waiting && state !== "sent" && <p className="text-stone-700">⏳ Your teacher hasn&apos;t listened yet.</p>}
      {state === "sent" && <p className="font-medium text-sky-900">Sent! Your teacher will listen and give you a grade.</p>}

      {best < PASS_GRADE && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {state === "recording" ? (
            <button
              type="button"
              onClick={() => rec.current?.stop()}
              className="rounded-full bg-red-600 px-4 py-1.5 font-medium text-white"
            >
              ■ Stop
            </button>
          ) : state === "review" && url ? (
            <>
              <audio src={url} controls className="h-9 max-w-[16rem]" />
              <button type="button" onClick={send} className="rounded-full bg-sky-700 px-4 py-1.5 font-medium text-white">
                Send to my teacher
              </button>
              <button type="button" onClick={start} className="rounded-full px-3 py-1.5 text-sky-900 ring-1 ring-sky-300">
                Record again
              </button>
            </>
          ) : state === "sending" ? (
            <span className="text-stone-600">Sending…</span>
          ) : (
            <button type="button" onClick={start} className="rounded-full bg-sky-700 px-4 py-1.5 font-medium text-white">
              🎙 Record {label} for my teacher
            </button>
          )}
          {state === "recording" && <span className="animate-pulse text-red-700">● Recording… sing the ta&apos;am</span>}
        </div>
      )}
      {msg && <p className="mt-1 text-red-700">{msg}</p>}
    </div>
  );
}
