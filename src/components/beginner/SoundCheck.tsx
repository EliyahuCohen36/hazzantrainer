"use client";

import { useState } from "react";
import { recordingUrl } from "@/lib/recordings";
import { playUrls, unlockAudio } from "@/lib/audio/player";
import { canRecord, recordWord } from "@/lib/audio/word-check";

/** Two tests: play one of the Hazzan's recordings, and record + play back the microphone. */
export function SoundCheck() {
  const [sound, setSound] = useState("");
  const [mic, setMic] = useState("");
  const [back, setBack] = useState<string | null>(null);

  const testSound = async () => {
    unlockAudio();
    setSound("Playing…");
    try {
      const url = await recordingUrl("/audio/beginner/alef-qamats.mp3");
      await playUrls([url]).done;
      setSound("Did you hear the Hazzan say “a”? If not, check the volume and that the phone isn't on silent.");
    } catch (e) {
      setSound(`Couldn't play: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const testMic = async () => {
    unlockAudio();
    setBack(null);
    if (!canRecord()) return setMic("This browser can't use the microphone. Try Safari or Chrome.");
    setMic("Getting the microphone ready…");
    try {
      const { done } = recordWord(
        4000,
        () => setMic("I hear you! Keep talking…"),
        () => setMic("Listening… say something."),
      );
      const rec = await done;
      if (!rec) return setMic("I didn't hear anything. Check that the microphone is allowed for this site, then try again a little louder.");
      // Play it back as a WAV.
      const { samples, rate } = rec;
      const buf = new DataView(new ArrayBuffer(44 + samples.length * 2));
      const w = (o: number, s: string) => [...s].forEach((c, i) => buf.setUint8(o + i, c.charCodeAt(0)));
      w(0, "RIFF");
      buf.setUint32(4, 36 + samples.length * 2, true);
      w(8, "WAVEfmt ");
      buf.setUint32(16, 16, true);
      buf.setUint16(20, 1, true);
      buf.setUint16(22, 1, true);
      buf.setUint32(24, rate, true);
      buf.setUint32(28, rate * 2, true);
      buf.setUint16(32, 2, true);
      buf.setUint16(34, 16, true);
      w(36, "data");
      buf.setUint32(40, samples.length * 2, true);
      samples.forEach((v, i) => buf.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
      setBack(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
      setMic(`The microphone works (${(samples.length / rate).toFixed(1)} seconds recorded).`);
    } catch (e) {
      const name = e instanceof Error ? e.name : "";
      setMic(
        name === "NotAllowedError"
          ? "The microphone isn't allowed. In Safari: Safari menu → Settings for this website → Microphone → Allow. On iPhone: Settings → Safari → Microphone → Allow."
          : `Microphone problem: ${e instanceof Error ? `${e.name} ${e.message}` : String(e)}`,
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">1. Can you hear the Hazzan?</h2>
        <button type="button" onClick={testSound} className="mt-3 rounded-xl bg-amber-700 px-5 py-2.5 font-semibold text-white hover:bg-amber-800">
          🔊 Play a sound
        </button>
        {sound && <p className="mt-2 text-sm text-stone-700">{sound}</p>}
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-stone-900">2. Can the trainer hear you?</h2>
        <button type="button" onClick={testMic} className="mt-3 rounded-xl bg-rose-600 px-5 py-2.5 font-semibold text-white hover:bg-rose-700">
          🎤 Test the microphone
        </button>
        {mic && <p className="mt-2 text-sm text-stone-700">{mic}</p>}
        {back && (
          <button
            type="button"
            onClick={() => {
              unlockAudio();
              void playUrls([back]).done;
            }}
            className="mt-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            ▶ Hear what was recorded
          </button>
        )}
      </div>
    </div>
  );
}
