import type { CurriculumData } from "@/types/curriculum";

/**
 * Sample catalog for Phase 1.
 *
 * The Haftarah, Tefillah and Mishnah subjects are here (with no lessons yet)
 * to show that new subjects slot in without changing the model.
 *
 * Bereishit 1:1 is split into words, each with its ta'am:
 *   בְּרֵאשִׁ֖ית (tipcha) בָּרָ֣א (munach) אֱלֹהִ֑ים (etnachta)
 *   אֵ֥ת (mercha) הַשָּׁמַ֖יִם (tipcha) וְאֵ֥ת (mercha) הָאָֽרֶץ׃ (silluk)
 */
export const sampleCurriculum: CurriculumData = {
  subjects: [
    { id: "torah", kind: "torah", title: { he: "קריאת התורה", en: "Torah Reading" }, order: 1 },
    { id: "haftarah", kind: "haftarah", title: { he: "הפטרה", en: "Haftarah" }, order: 2 },
    { id: "tefillah", kind: "tefillah", title: { he: "תפילה", en: "Tefillah" }, order: 3 },
    { id: "mishnah", kind: "mishnah", title: { he: "משנה", en: "Mishnah" }, order: 4 },
  ],
  courses: [
    { id: "bereishit", subjectId: "torah", title: { he: "בראשית", en: "Bereshit" }, order: 1 },
  ],
  units: [
    { id: "parashat-bereishit", courseId: "bereishit", title: { he: "פרשת בראשית", en: "Parashat Bereshit" }, order: 1 },
  ],
  lessons: [
    {
      id: "bereishit-1-1",
      unitId: "parashat-bereishit",
      kind: "pasuk",
      title: { he: "בראשית א:א", en: "Bereshit 1:1" },
      citation: { ref: "Genesis 1:1", label: { he: "בראשית א׳ א׳", en: "Genesis 1:1" } },
      order: 1,
      segments: [
        { id: "w1", text: "בְּרֵאשִׁ֖ית", taam: "tipcha" },
        { id: "w2", text: "בָּרָ֣א", taam: "munach" },
        { id: "w3", text: "אֱלֹהִ֑ים", taam: "etnachta" },
        { id: "w4", text: "אֵ֥ת", taam: "mercha" },
        { id: "w5", text: "הַשָּׁמַ֖יִם", taam: "tipcha" },
        { id: "w6", text: "וְאֵ֥ת", taam: "mercha" },
        { id: "w7", text: "הָאָֽרֶץ׃", taam: "silluk" },
      ],
      recordings: [
        {
          id: "bereishit-1-1-master",
          // Master recording of Bereishit 1:1 (sent Nov 2026).
          src: "/audio/torah/bereishit/1-1.wav",
          reader: "Master Hazzan",
          tradition: "syrian",
          // Word timings (seconds), measured from this recording.
          // stressStart/stressEnd = the stressed syllable that carries the ta'am,
          // used to check the student sings the note on the right syllable.
          // There's a real pause only after אֱלֹהִ֑ים (4.10 → 4.36).
          segmentTimings: [
            { segmentId: "w1", start: 0.2, end: 2.42, stressStart: 0.76, stressEnd: 2.42 }, // בְּרֵא|שִׁית
            { segmentId: "w2", start: 2.42, end: 3.05, stressStart: 2.8, stressEnd: 3.05 }, // בָּ|רָא
            { segmentId: "w3", start: 3.05, end: 4.1, stressStart: 3.58, stressEnd: 4.1 }, // אֱלֹ|הִים
            { segmentId: "w4", start: 4.36, end: 4.62, stressStart: 4.36, stressEnd: 4.62 }, // אֵת
            { segmentId: "w5", start: 4.62, end: 6.58, stressStart: 5.16, stressEnd: 6.27 }, // הַשָּׁ|מַ|יִם
            { segmentId: "w6", start: 6.58, end: 7.1, stressStart: 6.64, stressEnd: 7.1 }, // וְ|אֵת
            { segmentId: "w7", start: 7.1, end: 9.5, stressStart: 7.48, stressEnd: 8.38 }, // הָ|אָ|רֶץ
          ],
        },
      ],
    },
  ],
};
