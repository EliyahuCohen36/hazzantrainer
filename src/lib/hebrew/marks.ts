/**
 * Showing and hiding Hebrew diacritics.
 *
 * Text is always stored fully pointed. We remove marks at render time so a
 * single source string serves both learning mode and Torah Scroll mode.
 *
 * Unicode ranges (Hebrew block U+0590–U+05FF):
 *   Te'amim (cantillation): U+0591–U+05AF
 *   Meteg / Silluk:         U+05BD  — same code point for both. We group it
 *                                     with te'amim because at the end of a pasuk
 *                                     it *is* the Silluk accent.
 *   Paseq:                  U+05C0  (accent-related vertical stroke)
 *   Sof Pasuk:              U+05C3  (׃)
 *   Maqaf:                  U+05BE  (־) part of the accent system; a Sefer
 *                                     Torah writes the words separately, so it
 *                                     becomes a space when te'amim are hidden.
 *   Nikkud (vowels/dots):   U+05B0–U+05BC, U+05BF, U+05C1–U+05C2,
 *                           U+05C4–U+05C5, U+05C7
 */

const TEAMIM_RE = /[\u0591-\u05AF\u05C0\u05C3]/g;
/** Meteg / silluq (the ma'amid): kept while either nikkud or te'amim are shown. */
const METEG_RE = /\u05BD/g;
const MAQAF_RE = /־/g;
const NIKKUD_RE = /[ְ-ׇּֿׁׂׅׄ]/g;

export interface DisplayOptions {
  showNikkud: boolean;
  showTeamim: boolean;
}

/** Return `text` with the requested marks removed. */
export function renderHebrew(text: string, opts: DisplayOptions): string {
  let out = text;
  if (!opts.showTeamim) {
    out = out.replace(TEAMIM_RE, "").replace(MAQAF_RE, " ");
  }
  if (!opts.showTeamim && !opts.showNikkud) {
    out = out.replace(METEG_RE, "");
  }
  if (!opts.showNikkud) {
    out = out.replace(NIKKUD_RE, "");
  }
  return out;
}

/** Consonants only: handy for search, matching and analytics keys. */
export function consonantsOnly(text: string): string {
  return renderHebrew(text, { showNikkud: false, showTeamim: false }).trim();
}
