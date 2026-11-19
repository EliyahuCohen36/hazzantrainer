/**
 * The te'amim trainer goes in levels, easiest first, so children learn a few
 * te'amim at a time. A child sees only the levels their teacher has opened
 * (classes.unlocked_level, or a per-child override; see supabase/levels.sql).
 * Teachers, admins and families see every level.
 *
 * To change the order, move ta'am ids between levels (each id once).
 */
export interface TeamimLevel {
  n: number;
  title: string;
  hebrew: string;
  /** One line for the child: what this level is about. */
  about: string;
  teamim: string[];
  /** "stress": Mil'el and Milra (before the te'amim); "combo": two te'amim already learned, together. */
  kind?: "stress" | "combo";
}

/**
 * One ta'am per level (owner: master each one first), mafsik before the
 * mesharet that leads into it, and the pairs that come together often only
 * after both were learned. Level 1 is Mil'el and Milra.
 */
export const TEAMIM_LEVELS: TeamimLevel[] = [
  {
    "n": 1,
    "title": "Mil'el and Milra",
    "hebrew": "מלעיל ומלרע",
    "about": "Before the te'amim: where the stress (the ma'amid) goes in a word.",
    "teamim": [],
    "kind": "stress"
  },
  {
    "n": 2,
    "title": "Sof Pasuk",
    "hebrew": "סוף פסוק",
    "about": "The end of every pasuk.",
    "teamim": [
      "sof-pasuk"
    ]
  },
  {
    "n": 3,
    "title": "Tarha",
    "hebrew": "טרחא",
    "about": "Tarha, which comes just before Sof Pasuk or Atnah.",
    "teamim": [
      "tarha"
    ]
  },
  {
    "n": 4,
    "title": "Ma'arikh",
    "hebrew": "מאריך",
    "about": "Ma'arikh, which leads into Tarha, Sof Pasuk and others.",
    "teamim": [
      "maarikh"
    ]
  },
  {
    "n": 5,
    "title": "Ma'arikh Tarha and Tarha Ma'arikh",
    "hebrew": "מאריך טרחא וטרחא מאריך",
    "about": "Together: which one comes first, and how each sounds first and second.",
    "teamim": [],
    "kind": "combo"
  },
  {
    "n": 6,
    "title": "Atnah",
    "hebrew": "אתנח",
    "about": "The middle of the pasuk.",
    "teamim": [
      "atnah"
    ]
  },
  {
    "n": 7,
    "title": "Shofar Holekh",
    "hebrew": "שופר הולך",
    "about": "Shofar Holekh changes its sound with the ta'am that comes after it.",
    "teamim": [
      "shofar-holekh"
    ]
  },
  {
    "n": 8,
    "title": "Tebir",
    "hebrew": "תביר",
    "about": "Tebir.",
    "teamim": [
      "tebir"
    ]
  },
  {
    "n": 9,
    "title": "Darga",
    "hebrew": "דרגא",
    "about": "Darga, which leads into Tebir.",
    "teamim": [
      "darga"
    ]
  },
  {
    "n": 10,
    "title": "Zakef Katon",
    "hebrew": "זקף קטן",
    "about": "Zakef Katon.",
    "teamim": [
      "zakef-katon"
    ]
  },
  {
    "n": 11,
    "title": "Kadma",
    "hebrew": "קדמא",
    "about": "Kadma: at the end of the word it pauses; in the middle of the word it connects.",
    "teamim": [
      "kadma"
    ]
  },
  {
    "n": 12,
    "title": "Shofar Mehuppakh",
    "hebrew": "שופר מהופך",
    "about": "Shofar Mehuppakh.",
    "teamim": [
      "shofar-mehuppakh"
    ]
  },
  {
    "n": 13,
    "title": "Shofar Mehuppakh Kadma",
    "hebrew": "שופר מהופך קדמא",
    "about": "Together, as they so often come before Zakef.",
    "teamim": [],
    "kind": "combo"
  },
  {
    "n": 14,
    "title": "Zakef Gadol",
    "hebrew": "זקף גדול",
    "about": "Zakef Gadol.",
    "teamim": [
      "zakef-gadol"
    ]
  },
  {
    "n": 15,
    "title": "Rebia",
    "hebrew": "רביע",
    "about": "Rebia.",
    "teamim": [
      "rebia"
    ]
  },
  {
    "n": 16,
    "title": "Gerish",
    "hebrew": "גריש",
    "about": "Gerish.",
    "teamim": [
      "gerish"
    ]
  },
  {
    "n": 17,
    "title": "Shene Gerishin",
    "hebrew": "שני גרישין",
    "about": "Shene Gerishin.",
    "teamim": [
      "shene-gerishin"
    ]
  },
  {
    "n": 18,
    "title": "Segolta",
    "hebrew": "סגולתא",
    "about": "Segolta.",
    "teamim": [
      "segolta"
    ]
  },
  {
    "n": 19,
    "title": "Zarka",
    "hebrew": "זרקא",
    "about": "Zarka, which comes before Segolta.",
    "teamim": [
      "zarka"
    ]
  },
  {
    "n": 20,
    "title": "Tere Kadmin",
    "hebrew": "תרי קדמין",
    "about": "Tere Kadmin.",
    "teamim": [
      "tere-kadmin"
    ]
  },
  {
    "n": 21,
    "title": "Yetib",
    "hebrew": "יתיב",
    "about": "Yetib, written before the word.",
    "teamim": [
      "yetib"
    ]
  },
  {
    "n": 22,
    "title": "Pazer Gadol",
    "hebrew": "פזר גדול",
    "about": "Pazer Gadol.",
    "teamim": [
      "pazer-gadol"
    ]
  },
  {
    "n": 23,
    "title": "Talsha",
    "hebrew": "תלשא",
    "about": "Talsha, at the start of the word.",
    "teamim": [
      "talsha"
    ]
  },
  {
    "n": 24,
    "title": "Tilsa",
    "hebrew": "תילשא",
    "about": "Tilsa, at the end of the word.",
    "teamim": [
      "tilsa"
    ]
  },
  {
    "n": 25,
    "title": "Tere Ta'ame",
    "hebrew": "תרי טעמי",
    "about": "Tere Ta'ame.",
    "teamim": [
      "tere-taame"
    ]
  },
  {
    "n": 26,
    "title": "Shalshelet",
    "hebrew": "שלשלת",
    "about": "Shalshelet: rare.",
    "teamim": [
      "shalshelet"
    ]
  },
  {
    "n": 27,
    "title": "Karne Farah",
    "hebrew": "קרני פרה",
    "about": "Karne Farah: once in the Torah.",
    "teamim": [
      "karne-farah"
    ]
  },
  {
    "n": 28,
    "title": "Shofar Holekh with Pesik",
    "hebrew": "שופר הולך ופסיק",
    "about": "When a pesik follows Shofar Holekh.",
    "teamim": [
      "shofar-holekh-pesik"
    ]
  }
];

/** Extra teaching for some levels (shown at the top of the level). */
export const LEVEL_LESSONS: Record<number, string[]> = {
  5: [
    "Ma'arikh and Tarha often come one after the other, and the order matters.",
    "Ma'arikh Tarha: first the Ma'arikh (connecting), then the Tarha (pausing). The Ma'arikh leads up into the Tarha.",
    "Tarha Ma'arikh: the Tarha comes first and pauses, then a Ma'arikh starts the next part, leading into Sof Pasuk or Atnah. Listen to how each one sounds when it comes first and when it comes second.",
  ],
  7: [
    "Shofar Holekh is a connecting ta'am: it leads into the ta'am after it, so its tune changes with what comes next.",
    "Listen to it before Atnah, before Segolta and before Zakef Katon (each pair opens once you've learned the second ta'am).",
  ],
  11: [
    "Kadma written at the END of the word (after the last letter) is a pausing ta'am (mafsik). Its sound stops the phrase a little.",
    "The same-looking sign written in the MIDDLE of the word, on the letter that takes the stress, is a connecting ta'am (mehabber): it runs straight on into the next word.",
    "Don't confuse the two! Look where the sign sits: at the END of the word it is a pausing ta'am; in the MIDDLE of the word it is a connecting ta'am.",
  ],
  13: [
    "Shofar Mehuppakh and Kadma very often come one after the other, leading into Zakef Katon. Now that you know each one, sing them together.",
  ],
};

/** Recordings for the "together" levels: [label, path]. */
export const COMBO_RECORDINGS: Record<number, [string, string][]> = {
  5: [
    ["Ma'arikh Tarha", "/audio/teamim/torah/maarikh_tarha.mp3"],
    ["Tarha Ma'arikh", "/audio/teamim/torah/tarha_maarikh.mp3"],
  ],
  13: [["Shofar Mehuppakh Kadma", "/audio/teamim/torah/shofar-mehuppakh_kadma.mp3"]],
};

export const MAX_LEVEL = TEAMIM_LEVELS.length;

const LEVEL_OF = new Map(TEAMIM_LEVELS.flatMap((l) => l.teamim.map((id) => [id, l.n] as const)));

/** The level a ta'am is taught in. */
export function levelOf(taamId: string): number {
  return LEVEL_OF.get(taamId) ?? MAX_LEVEL;
}

/** Ta'am ids open to someone who has reached `level`. */
export function openTeamim(level: number): Set<string> {
  return new Set(TEAMIM_LEVELS.filter((l) => l.n <= level).flatMap((l) => l.teamim));
}
