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
  "pazer-gadol": "/audio/teamim/torah/pazer-gadol.mp3",
  "shofar-mehuppakh": "/audio/teamim/torah/shofar-mehuppakh.mp3",
  rebia: "/audio/teamim/torah/rebia.mp3",
  talsha: "/audio/teamim/torah/talsha.mp3",
  tilsa: "/audio/teamim/torah/tilsa.mp3",
  "shofar-holekh-pesik": "/audio/teamim/torah/shofar-holekh-pesik.mp3",
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
  {
    first: "shofar-holekh",
    second: "atnah",
    src: "/audio/teamim/torah/shofar-holekh_atnah.mp3",
    example: { ref: "Bereshit 1:1", phrase: ["בְּרֵאשִׁ֖ית", "בָּרָ֣א", "אֱלֹהִ֑ים", "אֵ֥ת"], at: 1 },
  },
  {
    first: "shofar-holekh",
    second: "zakef-katon",
    src: "/audio/teamim/torah/shofar-holekh_zakef-katon.mp3",
    example: { ref: "Bereshit 1:4", phrase: ["כִּי־ט֑וֹב", "וַיַּבְדֵּ֣ל", "אֱלֹהִ֔ים", "בֵּ֥ין"], at: 1 },
  },
  {
    first: "azla",
    second: "gerish",
    src: "/audio/teamim/torah/azla_gerish.mp3",
    example: { ref: "Bereshit 1:9", phrase: ["אֱלֹהִ֗ים", "יִקָּו֨וּ", "הַמַּ֜יִם", "מִתַּ֤חַת"], at: 1 },
  },
];
