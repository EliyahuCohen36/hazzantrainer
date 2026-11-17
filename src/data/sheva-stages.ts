/**
 * The Sheva and Qamats Katan steps of Beginner Keriah, in the owner's order:
 * Sheva Nach after each short vowel (תנועות קטנות), then all of them together;
 * Sheva Na after each long vowel (תנועות גדולות), then together; then the more
 * specific rules; then the Qamats Katan. Each step is its own Beginner level
 * (the teacher opens it), and a child must pass the step before it.
 * Words: src/data/sheva-words.json (scripts/sheva-words/build.py).
 */
export interface ShevaStage {
  id: string;
  /** Beginner level that opens it. */
  level: number;
  title: string;
  he: string;
  /** The rule, shown before the questions. */
  rule: string;
  /** Word groups the questions come from. */
  from: string[];
  part: "nach" | "na" | "more" | "katan";
}

const S: Omit<ShevaStage, "level">[] = [
  { id: "nach-patah", part: "nach", title: "Sheva Nach after a Patah", he: "שווא נח אחרי פתח", from: ["nach-patah"], rule: "After a Patah (a short vowel), the Sheva is Nach: silent. It closes the syllable: נַשְׁ-קֶה = nash-qe." },
  { id: "nach-segol", part: "nach", title: "Sheva Nach after a Segol", he: "שווא נח אחרי סגול", from: ["nach-segol"], rule: "After a Segol, the Sheva is Nach: נֶחְ-מָד = neḥ-mad." },
  { id: "nach-hiriq", part: "nach", title: "Sheva Nach after a Hiriq (no Yod)", he: "שווא נח אחרי חירק חסר", from: ["nach-hiriq"], rule: "After a Hiriq without a Yod (Hiriq Haser), the Sheva is Nach: לִשְׁ-חֹט = lish-ḥoṭ." },
  { id: "nach-katan", part: "nach", title: "Sheva Nach after a Qamats Katan", he: "שווא נח אחרי קמץ קטן", from: ["nach-katan"], rule: "After a Qamats Katan (the short \"o\"), the Sheva is Nach: חׇרְ-מָה = ḥor-ma." },
  { id: "nach-qibbus", part: "nach", title: "Sheva Nach after a Qibbus", he: "שווא נח אחרי קובוץ", from: ["nach-qibbus"], rule: "After a Qibbus, the Sheva is Nach: לֻקְ-חָה = luq-ḥa." },
  { id: "nach-all", part: "nach", title: "Sheva Nach: all the short vowels", he: "שווא נח: תנועות קטנות", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus"], rule: "The short vowels (תנועות קטנות) are Patah, Segol, Hiriq Haser, Qamats Katan and Qibbus. After any of them, the Sheva is Nach." },
  { id: "na-qamats", part: "na", title: "Sheva Na after a Qamats", he: "שווא נע אחרי קמץ", from: ["na-qamats"], rule: "After a Qamats (a long vowel, with a ma'amid under it), the Sheva is Na: say a short \"e\": גָּֽ-בְ-רוּ = ga-ve-ru." },
  { id: "na-tsere", part: "na", title: "Sheva Na after a Tsere", he: "שווא נע אחרי צירי", from: ["na-tsere"], rule: "After a Tsere, the Sheva is Na: יֵ-שְׁ-בוּ = ye-she-vu." },
  { id: "na-hiriq", part: "na", title: "Sheva Na after a Hiriq Male", he: "שווא נע אחרי חירק מלא", from: ["na-hiriq"], rule: "After a Hiriq with a Yod (Hiriq Male), the Sheva is Na: תִּי-רְ-אוּ = ti-re-u." },
  { id: "na-holam", part: "na", title: "Sheva Na after a Holam", he: "שווא נע אחרי חולם", from: ["na-holam"], rule: "After a Holam (with or without a Vav), the Sheva is Na: דֹּ-בְ-רֹת = do-ve-rot." },
  { id: "na-shuruk", part: "na", title: "Sheva Na after a Shuruq in the middle", he: "שווא נע אחרי שורוק באמצע", from: ["na-shuruk"], rule: "After a Shuruq (וּ) in the middle of a word, the Sheva is Na: יוּ-מְ-תוּ = yu-me-tu." },
  { id: "na-all", part: "na", title: "Sheva Na: all the long vowels", he: "שווא נע: תנועות גדולות", from: ["na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk"], rule: "The long vowels (תנועות גדולות) are Qamats, Tsere, Hiriq Male, Holam (with or without Vav) and Shuruq in the middle of a word. After any of them, the Sheva is Na." },
  { id: "na-nach", part: "na", title: "Na or Nach? Short and long vowels", he: "נע או נח?", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus", "na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk"], rule: "Look at the vowel before the Sheva: a short vowel = Nach (silent), a long vowel = Na (\"e\")." },
  { id: "nach-u", part: "more", title: "Sheva Nach after וּ at the start", he: "שווא נח אחרי וּ בתחילת מילה", from: ["nach-u"], rule: "When a word starts with וּ (Shuruq), the Sheva after it is Nach: וּשְׁ-פָ-טוּם = ush-fa-ṭum." },
  { id: "end", part: "more", title: "Shevas at the end of a word", he: "שווא בסוף מילה", from: ["end"], rule: "A Sheva on the last letter is Nach, and so are two Shevas at the end of a word: אָבִיךְ = a-vikh." },
  { id: "na-start", part: "more", title: "Sheva Na at the start of a word", he: "שווא נע בתחילת מילה", from: ["na-start"], rule: "A Sheva on the first letter of a word is always Na: בְּ-תוֹ-רָ-תִי = be-to-ra-ti." },
  { id: "two-middle", part: "more", title: "Two Shevas in the middle", he: "שני שוואים באמצע", from: ["two-middle"], rule: "Two Shevas one after the other in the middle of a word: the first is Nach, the second is Na: יִשְׁ-מְ-עוּ = yish-me-u." },
  { id: "sheva-all", part: "more", title: "All the Sheva rules together", he: "כל דיני השווא", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus", "na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk", "nach-u", "end", "na-start", "two-middle"], rule: "Everything you've learned about the Sheva, mixed together." },
  { id: "katan-rule", part: "katan", title: "Qamats Katan: no ma'amid before a Sheva", he: "קמץ קטן", from: ["katan-sheva"], rule: "A Qamats right before a Sheva, with NO ma'amid under it, is a Qamats Katan: say \"o\". The Sheva after it is Nach: עָרְ-לָה = or-la, אָרְ-כָּהּ = or-kah, רָחְ-בָּהּ = roḥ-bah." },
  { id: "katan-both", part: "katan", title: "Same letters, two ways", he: "קמץ גדול או קטן", from: ["katan-both"], rule: "Some words can be read both ways. With a ma'amid under the Qamats it's a regular \"a\" (and the Sheva is Na): שָֽׁמְרָה = sha-me-ra. Without one it's \"o\": שָׁמְרָה = shom-ra. The same with אָכְלָה and לָמְדָה." },
  { id: "katan-gadol", part: "katan", title: "Qamats Gadol or Qamats Katan?", he: "קמץ גדול וקמץ קטן", from: ["katan-sheva", "gadol-sheva"], rule: "Look under the Qamats: a ma'amid = Qamats Gadol, \"a\". No ma'amid before a Sheva = Qamats Katan, \"o\"." },
  { id: "katan-maqaf", part: "katan", title: "Qamats Katan before a Maqaf", he: "קמץ קטן לפני מקף", from: ["katan-maqaf"], rule: "A word joined to the next one with a Maqaf (the little dash ־) has no stress of its own, so its Qamats is usually a Qamats Katan: כָּל־ = kol." },
];

export const SHEVA_FIRST_LEVEL = 12;
export const SHEVA_STAGES: ShevaStage[] = S.map((s, i) => ({ ...s, level: SHEVA_FIRST_LEVEL + i }));
export const SHEVA_QUESTIONS = 50;
export const SHEVA_PASS = 40;
export const shevaStageKey = (id: string) => `beginner-sheva:${id}`;
export const PART_TITLES: Record<ShevaStage["part"], string> = {
  nach: "Sheva Nach after the short vowels",
  na: "Sheva Na after the long vowels",
  more: "More Sheva rules",
  katan: "Qamats Katan",
};
