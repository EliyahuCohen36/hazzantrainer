/**
 * Rough syllable count from nikkud. Each full or hataf vowel starts a
 * syllable, a shuruk (וּ) counts as a vowel, and a sheva on the first letter
 * (sheva na, as in בְּרֵאשִׁית) counts too. Good enough to size syllables for
 * note-placement scoring; set `syllables` on a segment to override it.
 */
const VOWELS = /[ֱ-ׇֻ]/; // hataf vowels, hiriq … kubutz, kamatz katan
const SHEVA = "ְ";
const DAGESH = "ּ";
const VAV = "ו";

const TAAM_MARK = /[֑-ֽ֯]/;

/**
 * Split a word around the letter that carries the ta'am (the stressed
 * syllable), so the UI can highlight where the note belongs.
 */
export function splitAtStress(text: string): { before: string; stressed: string; after: string } | null {
  const chars = [...text];
  const markAt = chars.findIndex((c) => TAAM_MARK.test(c));
  if (markAt < 0) return null;
  let start = markAt;
  while (start > 0 && !(chars[start] >= "א" && chars[start] <= "ת")) start--;
  let end = markAt + 1;
  while (end < chars.length && !(chars[end] >= "א" && chars[end] <= "ת")) end++;
  return { before: chars.slice(0, start).join(""), stressed: chars.slice(start, end).join(""), after: chars.slice(end).join("") };
}

export function countSyllables(text: string): number {
  // Group each letter with the marks that follow it.
  const letters: Array<{ ch: string; marks: string }> = [];
  for (const ch of text) {
    if (ch >= "א" && ch <= "ת") letters.push({ ch, marks: "" });
    else if (letters.length) letters[letters.length - 1].marks += ch;
  }
  let n = 0;
  letters.forEach((l, i) => {
    if (VOWELS.test(l.marks)) n++;
    else if (l.ch === VAV && l.marks.includes(DAGESH) && (i === 0 || !VOWELS.test(letters[i - 1].marks))) n++; // shuruk
    else if (i === 0 && l.marks.includes(SHEVA)) n++; // sheva na at the start of the word
  });
  return Math.max(1, n);
}
