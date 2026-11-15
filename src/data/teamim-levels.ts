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
}

export const TEAMIM_LEVELS: TeamimLevel[] = [
  {
    n: 1,
    title: "Ma'arikh Tarha",
    hebrew: "מאריך טרחא",
    about: "The tune at the end of almost every pasuk: Ma'arikh, Tarha, and Sof Pasuk.",
    teamim: ["maarikh", "tarha", "sof-pasuk"],
  },
  {
    n: 2,
    title: "Atnah",
    hebrew: "אתנח",
    about: "The middle of the pasuk, and the Shofar Holekh that comes before it.",
    teamim: ["atnah", "shofar-holekh"],
  },
  {
    n: 3,
    title: "Tebir",
    hebrew: "תביר",
    about: "Tebir, with Darga and Ma'arikh leading into it.",
    teamim: ["tebir", "darga"],
  },
  {
    n: 4,
    title: "Zakef",
    hebrew: "זקף",
    about: "Zakef Katon and Zakef Gadol, with Kadma and Shofar Mehuppakh.",
    teamim: ["zakef-katon", "kadma", "shofar-mehuppakh", "zakef-gadol"],
  },
  {
    n: 5,
    title: "Rebia and Gerish",
    hebrew: "רביע וגריש",
    about: "Rebia, Gerish, Shene Gerishin, and Azla before Gerish.",
    teamim: ["rebia", "gerish", "azla", "shene-gerishin"],
  },
  {
    n: 6,
    title: "Segolta and Zarka",
    hebrew: "סגולתא וזרקא",
    about: "Segolta and Zarka, Tere Kadmin and Yetib.",
    teamim: ["segolta", "zarka", "tere-kadmin", "yetib"],
  },
  {
    n: 7,
    title: "Pazer and Talsha",
    hebrew: "פזר ותלשא",
    about: "Less common te'amim: Pazer Gadol, Talsha, Tilsa and Tere Ta'ame.",
    teamim: ["pazer-gadol", "talsha", "tilsa", "tere-taame"],
  },
  {
    n: 8,
    title: "The rare ones",
    hebrew: "טעמים נדירים",
    about: "Shalshelet, Karne Farah, and Shofar Holekh with Pesik.",
    teamim: ["shalshelet", "karne-farah", "shofar-holekh-pesik"],
  },
];

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
