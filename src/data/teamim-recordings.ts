/**
 * The Hazzan's recordings of the te'amim, by ta'am id (see PROSE_TEAMIM in
 * teamim-reference.ts). Files live in public/audio/teamim/torah/.
 *
 * TORAH_TEAMIM_RECORDINGS: a ta'am on its own, e.g.
 *   tarha: "/audio/teamim/torah/tarha.mp3",
 *
 * TORAH_TEAMIM_PAIRS: a connecting ta'am (mesharet) sung together with the
 * ta'am it leads into, since a mesharet sounds different before each one.
 * The pair shows on both cards: "Before X" on the first, "After Y" on the
 * second. `example` is a Torah phrase where the two come together; `at` is
 * the index of the first of the two words in `phrase`.
 *
 * Te'amim with nothing here show "Recording coming soon".
 */
import type { TaamExample } from "./torah-examples";

export const TORAH_TEAMIM_RECORDINGS: Record<string, string> = {
  zarka: "/audio/teamim/torah/zarka.mp3",
};

export interface TaamPairRecording {
  first: string;
  second: string;
  src: string;
  example?: TaamExample;
}

export const TORAH_TEAMIM_PAIRS: TaamPairRecording[] = [
  {
    first: "shofar-holekh",
    second: "segolta",
    src: "/audio/teamim/torah/shofar-holekh_segolta.mp3",
    example: { ref: "Bereshit 3:3", phrase: ["הָעֵץ֮", "אֲשֶׁ֣ר", "בְּתוֹךְ־הַגָּן֒", "אָמַ֣ר"], at: 1 },
  },
];
