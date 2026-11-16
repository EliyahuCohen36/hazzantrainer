import { TORAH_TEAMIM_RECORDINGS } from "./teamim-recordings";
import beginnerDemo from "./beginner-demo.json";
import type { PracticeWord } from "./beginner-words";

/**
 * The free demo: these te'amim (cards, recordings and Practice) are open to
 * everyone at /demo/, so principals and parents can try the trainer before
 * a school signs up. Their recordings stay in public/; everything else needs
 * a login.
 */
export const DEMO_TEAMIM = ["sof-pasuk", "atnah", "tarha"];

/**
 * Beginner Keriah demo: a few "a" words (Qamats/Patah) for word practice. Only the
 * syllable clips these words need are in public/audio/beginner/ (14 short clips).
 */
export const BEGINNER_DEMO_WORDS = beginnerDemo as PracticeWord[];
const BEGINNER_DEMO_FILES = [
  ...new Set(
    BEGINNER_DEMO_WORDS.flatMap((w) =>
      w.s.map((s) => {
        const [id, sound] = s.split(":");
        return `/audio/beginner/${sound ? `${id}-${sound}` : `${id}-alone`}.mp3`;
      }),
    ),
  ),
];

export const DEMO_FILES = new Set([
  ...DEMO_TEAMIM.map((id) => TORAH_TEAMIM_RECORDINGS[id]).filter(Boolean),
  ...BEGINNER_DEMO_FILES,
]);

/** Pages anyone can open without signing in (paths without the base path, with trailing slash). */
export const OPEN_PAGES = ["/", "/login/", "/join/", "/demo/", "/about/", "/subscribe/"];

/** Where "Bring it to your school" sends schools. Empty = the button is hidden. */
export const CONTACT_EMAIL = "";
