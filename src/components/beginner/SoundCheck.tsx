"use client";

import { useState } from "react";
import { asset } from "@/lib/base-path";
import { recordingUrl } from "@/lib/recordings";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { audioContext } from "@/lib/audio/join-syllables";
import { recordWord } from "@/lib/audio/word-check";

type Step = { name: string; ok: boolean | null; detail: string };

const errText = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e));
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const withTimeout = <T,>(p: Promise<T>, ms: number, what: string) =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`${what} timed out`)), ms))]);

/**
 * Tests each part of sound and microphone on this device, shows the results, and
 * saves them (for signed-in users) so the owner can see what fails on which device.
 */
export function SoundCheck() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [running, setRunning] = useState(false);
  const [saved, setSaved] = useState("");

  const run = async () => {
    // Everything that needs the tap happens first, before any await.
    unlockAudio();
    const ctx = audioContext();
    const resumeP = ctx.resume();
    setRunning(true);
    setSaved("");
    const out: Step[] = [];
    const add = (s: Step) => {
      out.push(s);
      setSteps([...out]);
    };
    const demoClip = asset("/audio/beginner/alef-qamats.mp3");

    add({ name: "Browser", ok: null, detail: navigator.userAgent });
    try {
      await withTimeout(resumeP, 3000, "Starting audio");
      add({ name: "Audio engine", ok: ctx.state === "running", detail: `${ctx.state}, ${ctx.sampleRate} Hz` });
    } catch (e) {
      add({ name: "Audio engine", ok: false, detail: errText(e) });
    }

    // 1. Play a sound with the page's player.
    try {
      const t0 = performance.now();
      await withTimeout(playUrls([demoClip]).done, 5000, "Playing");
      add({ name: "Play a sound (player)", ok: performance.now() - t0 > 300, detail: `${Math.round(performance.now() - t0)} ms` });
    } catch (e) {
      add({ name: "Play a sound (player)", ok: false, detail: errText(e) });
    }

    // 2. Play a sound through the audio engine.
    try {
      const data = await (await fetch(demoClip)).arrayBuffer();
      const buf = await ctx.decodeAudioData(data);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start();
      await wait(buf.duration * 1000 + 100);
      add({ name: "Play a sound (audio engine)", ok: true, detail: `${buf.duration.toFixed(2)} s decoded` });
    } catch (e) {
      add({ name: "Play a sound (audio engine)", ok: false, detail: errText(e) });
    }

    // 3. A private recording (needs the account).
    try {
      const url = await withTimeout(recordingUrl("/audio/beginner/bet-qamats.mp3"), 5000, "Getting the recording");
      const r = await fetch(url);
      add({ name: "The Hazzan's recordings", ok: r.ok, detail: `HTTP ${r.status}` });
    } catch (e) {
      add({ name: "The Hazzan's recordings", ok: false, detail: errText(e) });
    }

    // 4. The microphone.
    if (!navigator.mediaDevices?.getUserMedia) {
      add({ name: "Microphone", ok: false, detail: "This browser has no microphone access (getUserMedia missing)" });
    } else {
      try {
        const s = await withTimeout(navigator.mediaDevices.getUserMedia({ audio: true }), 15000, "Microphone permission");
        const tr = s.getAudioTracks()[0];
        add({ name: "Microphone permission", ok: true, detail: `${tr?.label || "microphone"} ${JSON.stringify(tr?.getSettings?.() ?? {})}` });
        s.getTracks().forEach((t) => t.stop());
      } catch (e) {
        add({ name: "Microphone permission", ok: false, detail: errText(e) });
      }
      add({ name: "Say something now…", ok: null, detail: "recording for up to 4 seconds" });
      try {
        let ready = false;
        let voice = false;
        const { done } = recordWord(4000, () => (voice = true), () => (ready = true));
        const rec = await withTimeout(done, 8000, "Recording");
        let peak = 0;
        rec?.samples.forEach((v) => (peak = Math.max(peak, Math.abs(v))));
        add({
          name: "Recording",
          ok: !!rec,
          detail: rec
            ? `${(rec.samples.length / rec.rate).toFixed(1)} s at ${rec.rate} Hz, loudest ${peak.toFixed(3)}`
            : `nothing recorded (mic started: ${ready}, voice heard: ${voice})`,
        });
      } catch (e) {
        add({ name: "Recording", ok: false, detail: errText(e) });
      }
    }

    setRunning(false);
    if (supabaseConfigured) {
      try {
        const db = supabase();
        const { data } = await db.auth.getUser();
        if (data.user) {
          const { error } = await db.from("diagnostics").insert({ report: { steps: out, at: new Date().toISOString() } });
          setSaved(error ? "" : "These results were sent to the Hazzan so he can fix any problem.");
        }
      } catch {
        // not saved: fine
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <p className="text-stone-700">
          Tap the button. You&apos;ll hear the Hazzan say &ldquo;a&rdquo; twice. Then, when it says <b>Say something now</b>,
          say a word out loud.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={running}
          className="mt-3 rounded-xl bg-amber-700 px-5 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        >
          {running ? "Checking…" : "▶ Run the check"}
        </button>
      </div>
      {steps.length > 0 && (
        <ul className="space-y-2 rounded-2xl border border-stone-200 bg-white p-5 text-sm shadow-sm">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span>{s.ok === null ? "•" : s.ok ? "✅" : "❌"}</span>
              <span>
                <b>{s.name}</b> <span className="break-all text-stone-500">{s.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {saved && <p className="text-sm text-emerald-700">{saved}</p>}
      <p className="text-xs text-stone-500">
        If the microphone isn&apos;t allowed: in Safari on a Mac, Safari menu → Settings for This Website → Microphone →
        Allow. On iPhone/iPad: Settings → Apps → Safari → Microphone → Allow. In Chrome: the icon left of the address →
        Microphone → Allow.
      </p>
    </div>
  );
}
