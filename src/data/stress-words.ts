/**
 * Mil'el and Milra (te'amim Level 1). Each word has a ma'amid (meteg, drawn as
 * a line) under the letter that takes the stress. Mil'el = the stress is
 * before the last syllable; Milra = on the last syllable.
 * Pairs: the same letters with a different meaning by where the stress goes.
 */
export interface StressWord {
  w: string;
  type: "milel" | "milra";
  /** English meaning, for the pairs. */
  means?: string;
  pair?: string;
}

const M = "ֽ";
// "*" marks the stressed letter (after its vowel): turned into a ma'amid.
const w = (s: string) => s.replace("*", M);

export const STRESS_WORDS: StressWord[] = [
  ...[
    "לַ*יְלָה", "מֶ*לֶךְ", "אֶ*רֶץ", "בַּ*יִת", "נַ*עַר", "אֹ*הֶל", "יֶ*לֶד", "בֹּ*קֶר", "עֶ*רֶב",
    "מַ*יִם", "לֶ*חֶם", "דֶּ*רֶךְ", "כֶּ*סֶף", "מִצְרַ*יִם", "שָׁמַ*יִם", "הָ*יְתָה", "קֶ*דֶם",
  ].map((s) => ({ w: w(s), type: "milel" as const })),
  ...[
    "דָּבָ*ר", "אָדָ*ם", "שָׁל*וֹם", "אֱלֹהִ*ים", "מָק*וֹם", "יִשְׂרָאֵ*ל", "בָּרָ*א", "אָמַ*ר",
    "נָתַ*ן", "זָהָ*ב", "כֹּהֵ*ן", "שָׁנָ*ה", "עוֹלָ*ם",
  ].map((s) => ({ w: w(s), type: "milra" as const })),
  { w: w("בָּ*אָה"), type: "milel", means: "she came", pair: "ba-a" },
  { w: w("בָּאָ*ה"), type: "milra", means: "she is coming", pair: "ba-a" },
  { w: w("קָ*מָה"), type: "milel", means: "she got up", pair: "qama" },
  { w: w("קָמָ*ה"), type: "milra", means: "she is getting up", pair: "qama" },
  { w: w("שָׁ*בוּ"), type: "milel", means: "they came back", pair: "shavu" },
  { w: w("שָׁב*וּ"), type: "milra", means: "they took captive", pair: "shavu" },
];

export const STRESS_KEY = "teamim-stress";
