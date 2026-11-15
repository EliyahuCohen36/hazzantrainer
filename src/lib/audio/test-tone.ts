import type { SegmentTiming, TextSegment } from "@/types/curriculum";

/**
 * Synthetic test melody, so the whole pipeline can be tried before a real
 * recording exists. It is NOT a real ta'am melody, just a few notes per word.
 */

// Semitone offsets per word (cycled if the lesson has more words).
const PATTERNS: number[][] = [
  [0, 2, 0],
  [-2, 0],
  [0, 3, 2, 0],
  [-1],
  [0, 2, 0],
  [-1],
  [-3, -5],
];

const NOTE_SEC = 0.38;
const GAP_SEC = 0.12;
const BASE_HZ = 196; // G3, roughly an adult male reading voice

export interface TestTone {
  url: string;
  data: ArrayBuffer;
  timings: SegmentTiming[];
}

export async function createTestTone(segments: TextSegment[]): Promise<TestTone> {
  const rate = 22050;
  const notes: Array<{ start: number; semis: number }> = [];
  const timings: SegmentTiming[] = [];
  let t = 0.3;
  segments.forEach((seg, i) => {
    const start = t;
    for (const semis of PATTERNS[i % PATTERNS.length]) {
      notes.push({ start: t, semis });
      t += NOTE_SEC;
    }
    timings.push({ segmentId: seg.id, start, end: t });
    t += GAP_SEC;
  });
  const duration = t + 0.4;

  const ctx = new OfflineAudioContext(1, Math.ceil(duration * rate), rate);
  for (const n of notes) {
    const osc = ctx.createOscillator();
    osc.type = "triangle"; // a little harmonic content, closer to a voice than a sine
    osc.frequency.value = BASE_HZ * Math.pow(2, n.semis / 12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, n.start);
    gain.gain.linearRampToValueAtTime(0.35, n.start + 0.03);
    gain.gain.setValueAtTime(0.35, n.start + NOTE_SEC - 0.06);
    gain.gain.linearRampToValueAtTime(0, n.start + NOTE_SEC);
    osc.connect(gain).connect(ctx.destination);
    osc.start(n.start);
    osc.stop(n.start + NOTE_SEC + 0.01);
  }
  const buffer = await ctx.startRendering();
  const data = encodeWav(buffer);
  const url = URL.createObjectURL(new Blob([data], { type: "audio/wav" }));
  return { url, data, timings };
}

/** Minimal 16-bit PCM mono WAV encoder. */
function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const samples = buffer.getChannelData(0);
  const out = new ArrayBuffer(44 + samples.length * 2);
  const v = new DataView(out);
  const str = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, buffer.sampleRate, true);
  v.setUint32(28, buffer.sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return out;
}
