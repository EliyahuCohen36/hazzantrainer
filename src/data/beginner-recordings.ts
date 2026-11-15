/**
 * The Hazzan's recordings for Beginner Keriah, in the private "recordings"
 * bucket (upload from /admin/ → Recordings).
 *
 * He records one file per letter: the letter's name, then the letter with each
 * sound, with a short pause between them, e.g. for Bet: "Bet – ba – be – bi – bo –
 * bu – b(e)". The file is cut at the pauses into:
 *   letter:<letterId>                  the name  ("Bet")
 *   sound:<letterId>:<qamats|sere|hireq|holem|qibbus|sheva>
 * Nekudot that sound the same in the Syrian reading share one recording (below),
 * so each letter needs only 5 or 6 sounds.
 *   nekuda:<nekudaId>                  the nekuda's name ("Qamats")
 */
export const BEGINNER_RECORDINGS: Record<string, string> = {};

/** Same sound, same recording (Syrian/Sephardic pronunciation). */
const SAME_SOUND: Record<string, string> = {
  patah: "qamats",
  segol: "sere",
  "hireq-male": "hireq",
  "holem-male": "holem",
  shureq: "qibbus",
  "hataf-patah": "qamats",
  "hataf-segol": "sere",
  "hataf-qamats": "holem",
};

export function beginnerRecording(key: string): string | undefined {
  if (BEGINNER_RECORDINGS[key]) return BEGINNER_RECORDINGS[key];
  const m = key.match(/^sound:([^:]+):(.+)$/);
  if (m && SAME_SOUND[m[2]]) return BEGINNER_RECORDINGS[`sound:${m[1]}:${SAME_SOUND[m[2]]}`];
  return undefined;
}
