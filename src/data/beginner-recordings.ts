/**
 * The Hazzan's recordings for Beginner Keriah, in the private "recordings"
 * bucket (upload from /admin/ → Recordings). Keys:
 *   letter:<letterId>             the letter's name, e.g. letter:bet  → "Bet"
 *   sound:<letterId>:<nekudaId>   the letter read with a nekuda, e.g. sound:bet:qamats → "ba"
 *   nekuda:<nekudaId>             the nekuda's name, e.g. nekuda:qamats → "Qamats"
 * Tiles without a recording show without a play button.
 */
export const BEGINNER_RECORDINGS: Record<string, string> = {};

export const beginnerRecording = (key: string): string | undefined => BEGINNER_RECORDINGS[key];
