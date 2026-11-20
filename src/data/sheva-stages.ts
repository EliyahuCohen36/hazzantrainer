/**
 * Beginner Keriah reading-rule steps, in the owner's order (Nov 2026):
 *  Step 5  The Sheva, two tabs: Sheva Nach (first the sounds, then after the short vowels, תנועות קטנות)
 *          and Sheva Na (first the sounds, then after the long vowels, תנועות גדולות), then mixed steps.
 *  Step 6  Qamats Katan.   Step 7  Patah Genuva.   Step 8  Dagesh Kal and Dagesh Hazaq.
 *  Step 9  The four kinds of He.
 * Each stage is its own Beginner level (the teacher opens it; self-paced accounts open it by
 * passing the one before), and a child must pass the stage before it.
 * Words: src/data/sheva-words.json (scripts/sheva-words/build.py).
 */
export type StagePart = "nach" | "na" | "mixed" | "katan" | "genuva" | "dagesh" | "he";

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
  part: StagePart;
  /** "choice": pick what the highlighted letter is (from `choices`); otherwise pick the right reading. */
  ask?: "choice";
  choices?: string[];
  /** Which wrong readings to offer (default the other way of the Sheva / Qamats: "x"). */
  wrong?: ("x" | "y")[];
  /** "nach" / "na": a listening level: hear the Hazzan say a letter with a Sheva, tap that letter (15 questions). */
  sounds?: "nach" | "na";
}

/** What the choice buttons say. */
export const CHOICE_LABELS: Record<string, { en: string; he: string }> = {
  kal: { en: "Dagesh Kal (soft)", he: "דָּגֵשׁ קַל" },
  hazaq: { en: "Dagesh Hazaq (strong)", he: "דָּגֵשׁ חָזָק" },
  yediah: { en: "He HaYedi'ah: \"the\"", he: "ה״א הַיְדִיעָה" },
  sheelah: { en: "He HaShe'elah: a question", he: "ה״א הַשְּׁאֵלָה" },
  megamah: { en: "He HaMegamah: towards", he: "ה״א הַמְּגַמָּה" },
  mappiq: { en: "Mappiq He: belongs to her", he: "ה״א מַפִּיק" },
};

const S: Omit<ShevaStage, "level">[] = [
  { id: "nach-sounds", part: "nach", sounds: "nach", title: "The sound of a Sheva Nach", he: "הַקּוֹל שֶׁל שְׁוָא נָח", from: [], rule: "A Sheva Nach is silent: the letter says only its own sound, with no vowel after it. בְ says just \"b\", מְ says just \"m\". Tap each letter to hear it." },
  { id: "nach-patah", part: "nach", title: "Sheva Nach after a Patah", he: "שווא נח אחרי פתח", from: ["nach-patah"], rule: "After a Patah (a short vowel), the Sheva is Nach: silent. It closes the syllable: נַשְׁ-קֶה = nash-qe." },
  { id: "nach-segol", part: "nach", title: "Sheva Nach after a Segol", he: "שווא נח אחרי סגול", from: ["nach-segol"], rule: "After a Segol, the Sheva is Nach: נֶחְ-מָד = neḥ-mad." },
  { id: "nach-hiriq", part: "nach", title: "Sheva Nach after a Hiriq (no Yod)", he: "שווא נח אחרי חירק חסר", from: ["nach-hiriq"], rule: "After a Hiriq without a Yod (Hiriq Haser), the Sheva is Nach: לִשְׁ-חֹט = lish-ḥoṭ." },
  { id: "nach-katan", part: "nach", title: "Sheva Nach after a Qamats Katan", he: "שווא נח אחרי קמץ קטן", from: ["nach-katan"], rule: "After a Qamats Katan (the short \"o\"), the Sheva is Nach: חׇרְ-מָה = ḥor-ma." },
  { id: "nach-qibbus", part: "nach", title: "Sheva Nach after a Qibbus", he: "שווא נח אחרי קובוץ", from: ["nach-qibbus"], rule: "After a Qibbus, the Sheva is Nach: לֻקְ-חָה = luq-ḥa." },
  { id: "nach-all", part: "nach", title: "Sheva Nach: all the short vowels", he: "שווא נח: תנועות קטנות", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus"], rule: "The short vowels (תנועות קטנות) are Patah, Segol, Hiriq Haser, Qamats Katan and Qibbus. After any of them, the Sheva is Nach." },
  { id: "nach-u", part: "nach", title: "Sheva Nach after וּ at the start", he: "שווא נח אחרי וּ בתחילת מילה", from: ["nach-u"], rule: "When a word starts with וּ (Shuruq), the Sheva after it is Nach: וּשְׁ-פָ-טוּם = ush-fa-ṭum." },
  { id: "end", part: "nach", title: "Shevas at the end of a word", he: "שווא בסוף מילה", from: ["end"], rule: "A Sheva on the last letter is Nach, and so are two Shevas at the end of a word: אָבִיךְ = a-vikh." },
  { id: "na-sounds", part: "na", sounds: "na", title: "The sound of a Sheva Na", he: "הַקּוֹל שֶׁל שְׁוָא נָע", from: [], rule: "A Sheva Na says a short \"e\", the same sound as a Tsere or a Segol: בְ says \"be\", מְ says \"me\". A Sheva Na is never under א ה ח ע (they take a Hataf instead). Tap each letter to hear it." },
  { id: "na-qamats", part: "na", title: "Sheva Na after a Qamats", he: "שווא נע אחרי קמץ", from: ["na-qamats"], rule: "After a Qamats (a long vowel, with a ma'amid under it), the Sheva is Na: say a short \"e\": גָּֽ-בְ-רוּ = ga-ve-ru." },
  { id: "na-tsere", part: "na", title: "Sheva Na after a Tsere", he: "שווא נע אחרי צירי", from: ["na-tsere"], rule: "After a Tsere, the Sheva is Na: יֵ-שְׁ-בוּ = ye-she-vu." },
  { id: "na-hiriq", part: "na", title: "Sheva Na after a Hiriq Male", he: "שווא נע אחרי חירק מלא", from: ["na-hiriq"], rule: "After a Hiriq with a Yod (Hiriq Male), the Sheva is Na: תִּי-רְ-אוּ = ti-re-u." },
  { id: "na-holam", part: "na", title: "Sheva Na after a Holam", he: "שווא נע אחרי חולם", from: ["na-holam"], rule: "After a Holam (with or without a Vav), the Sheva is Na: דֹּ-בְ-רֹת = do-ve-rot." },
  { id: "na-shuruk", part: "na", title: "Sheva Na after a Shuruq in the middle", he: "שווא נע אחרי שורוק באמצע", from: ["na-shuruk"], rule: "After a Shuruq (וּ) in the middle of a word, the Sheva is Na: יוּ-מְ-תוּ = yu-me-tu." },
  { id: "na-all", part: "na", title: "Sheva Na: all the long vowels", he: "שווא נע: תנועות גדולות", from: ["na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk"], rule: "The long vowels (תנועות גדולות) are Qamats, Tsere, Hiriq Male, Holam (with or without Vav) and Shuruq in the middle of a word. After any of them, the Sheva is Na." },
  { id: "na-start", part: "na", title: "Sheva Na at the start of a word", he: "שווא נע בתחילת מילה", from: ["na-start"], rule: "A Sheva on the first letter of a word is always Na: בְּ-תוֹ-רָ-תִי = be-to-ra-ti." },
  { id: "na-dagesh", part: "na", title: "Sheva Na on a letter with a Dagesh", he: "שווא נע באות דגושה", from: ["na-dagesh"], rule: "When a letter has a Sheva AND a Dagesh, the Sheva is always Na: הַנְּ-עָ-רִים = ha-ne-a-rim. (Only a Sheva on the last letter, or two Shevas at the end of a word, stay Nach.)" },
  { id: "two-middle", part: "na", title: "Two Shevas in the middle", he: "שני שוואים באמצע", from: ["two-middle"], rule: "Two Shevas one after the other in the middle of a word: the first is Nach, the second is Na: יִשְׁ-מְ-עוּ = yish-me-u." },
  { id: "na-double", part: "na", title: "Sheva Na on the first of two of the same letter", he: "שווא נע באות כפולה", from: ["na-double"], rule: "When the same letter comes twice in a row and the first one has a Sheva, that Sheva is always Na: וּלְלָבָן = u-le-la-van, וּכְכׇל = u-khe-khol. כ and ך count as the same letter, and so does every final letter (ם with מ, ן with נ, ף with פ, ץ with צ)." },
  { id: "patah-qamats", part: "mixed", title: "Patah or Qamats before the Sheva?", he: "פתח או קמץ לפני השווא?", from: ["nach-patah", "na-qamats"], rule: "Patah and Qamats both say \"a\", but they are not the same! After a Patah (a short vowel) the Sheva is Nach: נַשְׁ-קֶה. After a Qamats (a long vowel; it has a ma'amid next to it) the Sheva is Na and there is one more syllable: גָּֽ-בְ-רוּ. Look at the nekuda itself, not only the sound." },
  { id: "segol-tsere", part: "mixed", title: "Segol or Tsere before the Sheva?", he: "סגול או צירי לפני השווא?", from: ["nach-segol", "na-tsere"], rule: "Segol and Tsere both say \"e\", but after a Segol (short) the Sheva is Nach: נֶחְ-מָד, and after a Tsere (long) it is Na: יֵ-שְׁ-בוּ. Same sound, different nekuda: look at the nekuda." },
  { id: "na-nach", part: "mixed", title: "Na or Nach? Short and long vowels", he: "נע או נח?", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus", "na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk"], rule: "Look at the vowel before the Sheva: a short vowel = Nach (silent), a long vowel = Na (\"e\")." },
  { id: "sheva-all", part: "mixed", title: "All the Sheva rules together", he: "כל דיני השווא", from: ["nach-patah", "nach-segol", "nach-hiriq", "nach-katan", "nach-qibbus", "na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk", "nach-u", "end", "na-start", "na-dagesh", "two-middle", "na-double"], rule: "Everything you've learned about the Sheva, mixed together." },
  { id: "katan-rule", part: "katan", title: "Qamats Katan: no ma'amid before a Sheva", he: "קמץ קטן", from: ["katan-sheva"], rule: "A Qamats right before a Sheva, with NO ma'amid under it, is a Qamats Katan: say \"o\". The Sheva after it is Nach: עָרְ-לָה = or-la, אָרְ-כָּהּ = or-kah, רָחְ-בָּהּ = roḥ-bah." },
  { id: "katan-both", part: "katan", title: "Same letters, two ways", he: "קמץ גדול או קטן", from: ["katan-both"], rule: "Some words can be read both ways. With a ma'amid under the Qamats it's a regular \"a\" (and the Sheva is Na): שָֽׁמְרָה = sha-me-ra. Without one it's \"o\": שָׁמְרָה = shom-ra. The same with אָכְלָה and לָמְדָה." },
  { id: "katan-gadol", part: "katan", title: "Qamats Gadol or Qamats Katan?", he: "קמץ גדול וקמץ קטן", from: ["katan-sheva", "gadol-sheva"], rule: "Look under the Qamats: a ma'amid = Qamats Gadol, \"a\". No ma'amid before a Sheva = Qamats Katan, \"o\"." },
  { id: "katan-maqaf", part: "katan", title: "Qamats Katan before a Maqaf", he: "קמץ קטן לפני מקף", from: ["katan-maqaf"], rule: "A word joined to the next one with a Maqaf (the little dash ־) has no stress of its own, so its Qamats is usually a Qamats Katan: כָּל־ = kol." },
  { id: "genuva-read", part: "genuva", title: "What is a Patah Genuva?", he: "פתח גנובה", from: ["genuva-w", "genuva-y"], wrong: ["y"], rule: "When a word ends in ח, ע, or הּ (He with a Mappiq) and that last letter has a Patah, the Patah is said BEFORE the letter: רוּחַ is ru-waḥ, not ru-ḥa. This is called a Patah Genuva (a \"stolen\" Patah)." },
  { id: "genuva-w", part: "genuva", title: "Patah Genuva after \"o\" or \"u\": a \"w\" sound", he: "פתח גנובה אחרי o / u", from: ["genuva-w"], wrong: ["x", "y"], rule: "If the sound before the Patah Genuva letter is \"o\" or \"u\" (Holam, Qamats Katan, Qibbus or Shuruq), a little \"w\" sound comes before the \"a\": נֹחַ = no-waḥ, תַּפּוּחַ = ta-pu-waḥ." },
  { id: "genuva-y", part: "genuva", title: "Patah Genuva after \"e\" or \"i\": a \"y\" sound", he: "פתח גנובה אחרי e / i", from: ["genuva-y"], wrong: ["x", "y"], rule: "If the sound before the Patah Genuva letter is \"e\" or \"i\" (Tsere, Segol or Hiriq), a little \"y\" sound (like a י) comes before the \"a\": רֵיחַ = re-yaḥ, שִׂיחַ = si-yaḥ." },
  { id: "genuva-all", part: "genuva", title: "Patah Genuva: \"w\" or \"y\"?", he: "פתח גנובה: w או y?", from: ["genuva-w", "genuva-y"], wrong: ["x", "y"], rule: "Look at the sound before the last letter: \"o\" or \"u\" → \"w\" (no-waḥ); \"e\" or \"i\" → \"y\" (re-yaḥ)." },
  { id: "dagesh-which", part: "dagesh", title: "Dagesh Kal or Dagesh Hazaq?", he: "דגש קל או דגש חזק?", from: ["dagesh-kal", "dagesh-hazaq"], ask: "choice", choices: ["kal", "hazaq"], rule: "A Dagesh in בּ גּ דּ כּ פּ תּ at the BEGINNING of a word is a Dagesh Kal: a soft dot that only makes the letter hard (בּ = b, not v). A Dagesh in a letter that comes right after a short vowel (Patah, Segol, Hiriq, Qibbus, Qamats Katan) is a Dagesh Hazaq: a strong dot, and the letter is said twice: הַשָּׁ = hash-sha, אִמּוֹ = im-mo. A Dagesh Hazaq can be in almost any letter (never א ה ח ע ר), and also in בּ גּ דּ כּ פּ תּ in the middle of a word: הַבַּיִת = hab-ba-yit." },
  { id: "dagesh-read", part: "dagesh", title: "Read the Dagesh Hazaq", he: "קריאת דגש חזק", from: ["dagesh-hazaq"], rule: "A Dagesh Hazaq makes the letter strong: say it twice, once at the end of the syllable before and once at the start of the next: נִצָּב = nits-tsav, תַּמֵּר = tam-mer, הַבַּיִת = hab-ba-yit. It can be in almost any letter, not only בּ גּ דּ כּ פּ תּ." },
  { id: "he-start", part: "he", title: "He HaYedi'ah or He HaShe'elah?", he: "ה״א הידיעה או ה״א השאלה?", from: ["he-yediah", "he-sheelah"], ask: "choice", choices: ["yediah", "sheelah"], rule: "At the start of a word: He HaYedi'ah means \"the\". It usually has a Patah and a Dagesh in the next letter (הַיֶּלֶד = the boy), or a Qamats before א, ע, ר (הָאִישׁ = the man). He HaShe'elah turns the sentence into a yes/no question and has a Hataf Patah: הֲשָׁלוֹם לְךָ? = Is it well with you?" },
  { id: "he-end", part: "he", title: "He HaMegamah or Mappiq He?", he: "ה״א המגמה או ה״א מפיק?", from: ["he-megamah", "he-mappiq"], ask: "choice", choices: ["megamah", "mappiq"], rule: "At the end of a word: He HaMegamah means \"towards\" a place. It has no dot and the word is said with the stress before it: מִצְרַיְמָה = to Egypt, בֵּיתָה = home. Mappiq He has a dot (Dagesh) inside the ה and means \"her\": אַרְצָהּ = her land, לָהּ = to her. Say the h!" },
  { id: "he-all", part: "he", title: "All four kinds of He", he: "ארבעת סוגי ה״א", from: ["he-yediah", "he-sheelah", "he-megamah", "he-mappiq"], ask: "choice", choices: ["yediah", "sheelah", "megamah", "mappiq"], rule: "He HaYedi'ah (the), He HaShe'elah (a question), He HaMegamah (towards) and Mappiq He (hers): look where the ה is and what nekudot it has." },
];

export const SHEVA_FIRST_LEVEL = 12;
export const SHEVA_STAGES: ShevaStage[] = S.map((s, i) => ({ ...s, level: SHEVA_FIRST_LEVEL + i }));
/** Listening levels: 15 questions (owner), 12 right. Other levels: src/lib/question-settings.ts. */
export const SOUND_QUESTIONS = 15;
export const SOUND_PASS = 12;
export const shevaStageKey = (id: string) => `beginner-sheva:${id}`;
export const PART_TITLES: Record<StagePart, string> = {
  nach: "Sheva Nach rules",
  na: "Sheva Na rules",
  mixed: "Na or Nach? Mixed",
  katan: "Qamats Katan",
  genuva: "Patah Genuva",
  dagesh: "Dagesh Kal and Dagesh Hazaq",
  he: "The four kinds of He",
};
