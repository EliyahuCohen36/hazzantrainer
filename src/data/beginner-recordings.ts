/**
 * The Hazzan's recordings for Beginner Keriah, in the private "recordings"
 * bucket under beginner/ (upload from /admin/ → Recordings).
 *
 * He records one file per letter: the letter's name, its sound alone, then the
 * letter with each nekuda sound, with a short pause between them, e.g. for Bet:
 * "Bet – b – ba – be – bi – bo – bu". (Alef and He have no sound alone, so
 * just the name.) The file is cut at the pauses into files named:
 *   letter-<letterId>.mp3              the name  ("Bet")        key letter:<letterId>
 *   <letterId>-alone.mp3               the sound alone ("b"); the plain letter's
 *                                      tile plays the name, then this
 *   <letterId>-<qamats|sere|hireq|holem|qibbus>.mp3       key sound:<letterId>:<nekudaId>
 *   nekuda-<nekudaId>.mp3              the nekuda's name        key nekuda:<nekudaId>
 * Nekudot that sound the same in the Syrian reading share one recording (below),
 * so each letter needs only 5 or 6 sounds.
 */

/** The files that have been recorded and uploaded (names without .mp3). */
export const BEGINNER_RECORDED: string[] = [
  "letter-alef",
  "alef-qamats",
  "alef-sere",
  "alef-hireq",
  "alef-holem",
  "alef-qibbus",
];

const RECORDED = new Set(BEGINNER_RECORDED);
const path = (name: string) => `/audio/beginner/${name}.mp3`;

/** Every beginner recording's site path (for the admin's Recordings panel). */
export const BEGINNER_RECORDING_PATHS = BEGINNER_RECORDED.map(path);

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

function fileFor(key: string): string | undefined {
  const [kind, a, b] = key.split(":");
  if (kind === "letter") return `letter-${a}`;
  if (kind === "nekuda") return `nekuda-${a}`;
  if (kind === "sound") return `${a}-${SAME_SOUND[b] ?? b}`;
  return undefined;
}

/** The site path of the recording for a tile, or undefined if not recorded yet. */
export function beginnerRecording(key: string): string | undefined {
  const f = fileFor(key);
  return f && RECORDED.has(f) ? path(f) : undefined;
}

/**
 * What a tile plays, in order: for a plain letter its name and then its sound
 * alone (if recorded); otherwise the one recording.
 */
export function beginnerPlaylist(key: string): string[] {
  const first = beginnerRecording(key);
  if (!first) return [];
  const [kind, id] = key.split(":");
  const alone = kind === "letter" && RECORDED.has(`${id}-alone`) ? [path(`${id}-alone`)] : [];
  return [first, ...alone];
}
