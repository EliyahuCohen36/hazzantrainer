import { KHAF_SOFIT_SHEVA, LETTERS, SHEVA, withNekuda } from "@/data/beginner";
import { beginnerRecording } from "@/data/beginner-recordings";
import { CHOICE_LABELS, type ShevaStage } from "@/data/sheva-stages";
import { Tile } from "./Tile";

/**
 * The chart that belongs to each Sheva / Qamats Katan / Patah Genuva / Dagesh / He lesson, shown when the
 * lesson opens (and in its Review tab), not on the step's home page (owner, Nov 20).
 */

/** Letters that never take a Sheva Na (they take a Hataf). */
export const NO_SHEVA = new Set(["alef", "he", "het", "ayin"]);

/** Every letter with a Sheva: tap to hear it as a Sheva Nach (just the letter's sound) or a Sheva Na ("be"). */
export function SoundLetters({ kind }: { kind: "nach" | "na" }) {
  const rec = (id: string) => (kind === "nach" ? `alone:${id}` : `sound:${id}:sheva-na`);
  return (
    <div dir="rtl" className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
      {LETTERS.filter((l) => !NO_SHEVA.has(l.id)).map((l) => {
        const g = withNekuda(l, SHEVA);
        return g ? (
          <Tile key={l.id} glyph={g} label={kind === "nach" ? l.sym : `${l.sym}e`} sub={l.name} color={kind === "nach" ? "sky" : "amber"} rec={rec(l.id)} />
        ) : null;
      })}
      {kind === "nach" && (
        <Tile glyph={KHAF_SOFIT_SHEVA.text} label={KHAF_SOFIT_SHEVA.sound} sub="Khaf Sofit" color="sky" rec="alone:khaf" />
      )}
    </div>
  );
}

/** Letters whose Sheva sound is recorded (for the listening questions). */
export function soundLetters(kind: "nach" | "na") {
  return LETTERS.filter((l) => !NO_SHEVA.has(l.id) && withNekuda(l, SHEVA) && beginnerRecording(kind === "nach" ? `alone:${l.id}` : `sound:${l.id}:sheva-na`));
}

const KETANOT: [string, string, string][] = [
  ["בַ", "Patah", "nach-patah"],
  ["בֶ", "Segol", "nach-segol"],
  ["בִ", "Hiriq (no Yod)", "nach-hiriq"],
  ["בׇ", "Qamats Katan", "nach-katan"],
  ["בֻ", "Qibbus", "nach-qibbus"],
];
const GEDOLOT: [string, string, string][] = [
  ["בָֽ", "Qamats", "na-qamats"],
  ["בֵ", "Tsere", "na-tsere"],
  ["בִי", "Hiriq with Yod", "na-hiriq"],
  ["בֹ / בוֹ", "Holam", "na-holam"],
  ["בוּ", "Shuruq (in the middle)", "na-shuruk"],
];

/** The vowels before a Sheva, in two groups. `only` highlights the one this lesson is about. */
export function VowelGroups({ which, only }: { which: "ketanot" | "gedolot"; only?: string }) {
  const list = which === "ketanot" ? KETANOT : GEDOLOT;
  return (
    <div className={`rounded-2xl border-2 p-4 ${which === "ketanot" ? "border-sky-300 bg-sky-50" : "border-amber-300 bg-amber-50"}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-stone-900">
          {which === "ketanot" ? "Short vowels: the Sheva after them is Nach" : "Long vowels: the Sheva after them is Na"}
        </h3>
        <span dir="rtl" lang="he" className="font-hebrew text-xl font-semibold text-stone-800">
          {which === "ketanot" ? "תְּנוּעוֹת קְטַנּוֹת" : "תְּנוּעוֹת גְּדוֹלוֹת"}
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {list.map(([h, n, id]) => (
          <li
            key={n}
            className={`rounded-xl px-2 py-2 text-center shadow-sm ${only && only !== id ? "bg-white/60 opacity-50" : "bg-white"} ${only === id ? "ring-4 ring-amber-400" : ""}`}
          >
            <span dir="rtl" lang="he" className="hebrew-text block font-hebrew text-3xl leading-[1.7] text-stone-900">
              {h}
            </span>
            <span className="text-sm text-stone-700">{n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Same sound, different nekuda: Patah / Qamats and Segol / Tsere. */
export function SameSound() {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-stone-800">
      <h3 className="font-semibold">Same sound, different Sheva!</h3>
      <p className="mt-1 text-sm">
        Patah and Qamats both say &ldquo;a&rdquo;, and Segol and Tsere both say &ldquo;e&rdquo;. The sound doesn&apos;t tell
        you the Sheva: the nekuda does. A Qamats before a Sheva has a ma&apos;amid next to it, and its Sheva is Na.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {[
          ["נַשְׁקֶה", "nash-qe", "Patah → Nach"],
          ["גָּֽבְרוּ", "ga-ve-ru", "Qamats → Na"],
          ["נֶחְמָד", "neḥ-mad", "Segol → Nach"],
          ["יֵשְׁבוּ", "ye-she-vu", "Tsere → Na"],
        ].map(([h, r, t]) => (
          <div key={h} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
            <span dir="rtl" lang="he" className="hebrew-text font-hebrew text-3xl leading-[1.8]">
              {h}
            </span>
            <span className="text-right text-sm">
              <b dir="ltr">{r}</b>
              <span className="block text-stone-600">{t}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Box({ title, he, read, note, tone }: { title: string; he: string; read?: string; note?: string; tone: "sky" | "amber" }) {
  return (
    <div className={`rounded-2xl border-2 p-4 ${tone === "sky" ? "border-sky-300 bg-sky-50" : "border-amber-300 bg-amber-50"}`}>
      <p className="font-semibold text-stone-900">{title}</p>
      <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">
        {he}
      </p>
      {read && (
        <p className="text-sm text-stone-700" dir="ltr">
          {read}
        </p>
      )}
      {note && <p className="text-sm text-stone-700">{note}</p>}
    </div>
  );
}

const HE_CARDS: Record<string, [string, string, string]> = {
  yediah: ["He HaYedi'ah: “the”", "הַיֶּלֶד · הָאִישׁ", "the boy · the man"],
  sheelah: ["He HaShe'elah: a yes/no question", "הֲשָׁלוֹם לְךָ? · הַיָּדַעְתָּ?", "Is it well with you? · Did you know?"],
  megamah: ["He HaMegamah: towards a place", "בֵּיתָה · מִצְרַיְמָה", "home · to Egypt"],
  mappiq: ["Mappiq He: belongs to her", "אַרְצָהּ · לָהּ", "her land · to her"],
};

/** The chart for one lesson. */
export function StageChart({ stage }: { stage: ShevaStage }) {
  const id = stage.id;
  if (stage.sounds) return <SoundLetters kind={stage.sounds} />;
  switch (stage.part) {
    case "nach":
      return id.startsWith("nach-") && id !== "nach-u" && id !== "nach-sounds" ? (
        <VowelGroups which="ketanot" only={id === "nach-all" ? undefined : id} />
      ) : null;
    case "na":
      if (["na-qamats", "na-tsere", "na-hiriq", "na-holam", "na-shuruk", "na-all"].includes(id))
        return (
          <div className="space-y-3">
            <VowelGroups which="gedolot" only={id === "na-all" ? undefined : id} />
            {(id === "na-qamats" || id === "na-tsere") && <SameSound />}
          </div>
        );
      return null;
    case "mixed":
      return (
        <div className="space-y-3">
          <VowelGroups which="ketanot" />
          <VowelGroups which="gedolot" />
          {(id === "patah-qamats" || id === "segol-tsere") && <SameSound />}
        </div>
      );
    case "katan":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Box tone="amber" title="Qamats Gadol: a ma'amid next to it, says “a”" he="שָֽׁמְרָה" read="sha-me-ra" />
          <Box tone="sky" title="Qamats Katan: no ma'amid, before a Sheva, says “o”" he="שׇׁמְרָה" read="shom-ra" />
        </div>
      );
    case "genuva":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {id !== "genuva-y" && <Box tone="sky" title="After “o” or “u”: a “w” sound" he="נֹחַ · תַּפּוּחַ" read="no-waḥ · ta-pu-waḥ" />}
          {id !== "genuva-w" && <Box tone="amber" title="After “e” or “i”: a “y” sound" he="רֵיחַ · שִׂיחַ" read="re-yaḥ · si-yaḥ" />}
        </div>
      );
    case "dagesh":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {id === "dagesh-which" && <Box tone="sky" title="Dagesh Kal: at the start of the word" he="בֹּקֶר · דָּבָר · תּוֹרָה" note="Only in בּ גּ דּ כּ פּ תּ" />}
          <Box
            tone="amber"
            title="Dagesh Hazaq: after a short vowel"
            he="הַשָּׁמַיִם · נִצָּב · אִמּוֹ · הַבַּיִת"
            read="hash-sha-ma-yim · nits-tsav · im-mo · hab-ba-yit"
            note="In any letter except א ה ח ע ר, also in בּ גּ דּ כּ פּ תּ"
          />
        </div>
      );
    case "he":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(stage.choices ?? []).map((c) => {
            const [t, ex, tr] = HE_CARDS[c];
            return (
              <div key={c} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <p className="flex flex-wrap items-baseline justify-between gap-2 font-semibold text-stone-900">
                  {t}
                  <span dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
                    {CHOICE_LABELS[c].he}
                  </span>
                </p>
                <p dir="rtl" lang="he" className="hebrew-text mt-1 font-hebrew text-3xl leading-[1.8]">
                  {ex}
                </p>
                <p className="text-sm text-stone-600">{tr}</p>
              </div>
            );
          })}
        </div>
      );
  }
  return null;
}
