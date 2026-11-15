import { PROSE_TEAMIM, type TaamReference } from "@/data/teamim-reference";
import { TORAH_EXAMPLES, type TaamExample } from "@/data/torah-examples";
import { TORAH_TEAMIM_PAIRS, TORAH_TEAMIM_RECORDINGS, type TaamPairRecording } from "@/data/teamim-recordings";
import { Recording } from "@/components/audio/Recording";
import { WithMaamid } from "@/components/reader/Maamid";
import { TaamPractice } from "./TaamPractice";

const LEVELS: Record<number, string> = {
  1: "Strongest pause",
  2: "Major pause",
  3: "Medium pause",
  4: "Light pause",
};

const NAME_OF = new Map(PROSE_TEAMIM.map((t) => [t.id, t]));

function Example({ ex, sofPasuk, span = 1 }: { ex: TaamExample; sofPasuk: boolean; span?: number }) {
  return (
    <div className="rounded-lg bg-stone-50 px-3 py-2">
      <p dir="rtl" lang="he" className="hebrew-text font-hebrew text-xl leading-[2.1] text-stone-500">
        {ex.phrase.map((w, i) => (
          <span key={i}>
            {i > 0 && " "}
            <span className={i >= ex.at && i < ex.at + span ? "rounded bg-amber-200/80 px-1 text-stone-900" : ""}>
              <WithMaamid text={w} />
            </span>
          </span>
        ))}
        {sofPasuk && "׃"}
      </p>
      <p className="text-xs text-stone-400">{ex.ref}</p>
    </div>
  );
}

/** A mesharet sung with the ta'am after it, shown on both of their cards. */
function Pair({ pair, side }: { pair: TaamPairRecording; side: "first" | "second" }) {
  const other = NAME_OF.get(side === "first" ? pair.second : pair.first);
  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
      <div className="mb-1.5 text-sm font-medium text-stone-800">
        {side === "first" ? "Before" : "After"} {other?.syrian}
        <span dir="rtl" lang="he" className="ml-2 font-hebrew text-stone-500">
          {other?.hebrew}
        </span>
      </div>
      <Recording src={pair.src} />
      <div className="mt-2">
        <TaamPractice
          src={pair.src}
          label={`${NAME_OF.get(pair.first)?.syrian} ${NAME_OF.get(pair.second)?.syrian}`}
        />
      </div>
      {pair.example && (
        <div className="mt-2">
          <Example ex={pair.example} sofPasuk={false} span={2} />
        </div>
      )}
    </div>
  );
}

export function TaamCard({ t, demo = false, open }: { t: TaamReference; demo?: boolean; open?: Set<string> }) {
  const id = t.id ?? "";
  const examples = TORAH_EXAMPLES[id] ?? [];
  const audio = TORAH_TEAMIM_RECORDINGS[id];
  // The demo only has the solo recordings; pairs need a login.
  // With levels, a pair shows once both of its te'amim are open.
  const ok = (p: { first: string; second: string }) => !open || (open.has(p.first) && open.has(p.second));
  const before = demo ? [] : TORAH_TEAMIM_PAIRS.filter((p) => p.first === id && ok(p));
  const after = demo ? [] : TORAH_TEAMIM_PAIRS.filter((p) => p.second === id && ok(p));
  const mesharet = t.role === "mesharet";
  return (
    <li id={id} className="grid gap-4 border-b border-stone-100 py-4 last:border-0 sm:grid-cols-[13rem_1fr]">
      <div className="flex items-start gap-3">
        <span dir="rtl" lang="he" className="hebrew-text w-14 shrink-0 text-center font-hebrew text-4xl leading-[1.9] text-amber-800">
          {t.sample}
        </span>
        <div>
          <div className="font-semibold text-stone-900">{t.syrian}</div>
          <div dir="rtl" lang="he" className="text-left font-hebrew text-stone-600">
            {t.hebrew}
          </div>
          <div className="text-xs text-stone-400">Ashkenazi: {t.ashkenazi}</div>
        </div>
      </div>
      <div className="space-y-2">
        {audio ? (
          <div className="space-y-2">
            <Recording src={audio} />
            <TaamPractice src={audio} label={t.syrian} />
          </div>
        ) : !(mesharet && before.length) ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
            <span aria-hidden>♪</span> {mesharet ? "Recordings coming soon" : "Recording coming soon"}
          </p>
        ) : null}
        {mesharet && before.length > 0 && (
          <p className="text-xs text-stone-500">
            {t.syrian} connects to the ta&apos;am after it, so it sounds different before each one:
          </p>
        )}
        {(before.length > 0 || after.length > 0) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {before.map((p) => (
              <Pair key={p.src} pair={p} side="first" />
            ))}
            {after.map((p) => (
              <Pair key={p.src} pair={p} side="second" />
            ))}
          </div>
        )}
        {t.note && <p className="text-sm text-stone-600">{t.note}</p>}
        {t.tip && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            <span className="font-semibold">Remember: </span>
            {t.tip}
            {t.seeAlso && NAME_OF.get(t.seeAlso) && (
              <a href={`#${t.seeAlso}`} className="ms-1 whitespace-nowrap font-medium text-amber-800 underline">
                Hear {NAME_OF.get(t.seeAlso)?.syrian} →
              </a>
            )}
          </p>
        )}
        {examples.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {examples.map((ex) => (
              <Example key={ex.ref} ex={ex} sofPasuk={id === "sof-pasuk"} />
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

/** "Names of the Te'amim" for the Torah: each ta'am with its recording and examples. */
export function TorahTeamim({ only }: { only?: string[] } = {}) {
  const demo = Boolean(only);
  const shown = only ? PROSE_TEAMIM.filter((t) => only.includes(t.id ?? "")) : PROSE_TEAMIM;
  const mafsikim = shown.filter((t) => t.role === "mafsik");
  const mesharetim = shown.filter((t) => t.role === "mesharet");
  return (
    <section id="teamim" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold text-stone-900">Names of the Te&apos;amim</h2>
        <span dir="rtl" lang="he" className="font-hebrew text-xl text-stone-600">
          שמות הטעמים
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-600">
        Each ta&apos;am of the Torah with its Syrian name, how it sounds in the Torah melody (Maqam Sigah), and examples from
        the Torah. The highlighted word carries the ta&apos;am.
      </p>

      <h3 className="mt-6 text-base font-semibold text-stone-900">
        Mafsikim <span className="text-sm font-normal text-stone-500">(pausing te&apos;amim)</span>
      </h3>
      {[1, 2, 3, 4].filter((lvl) => mafsikim.some((t) => t.level === lvl)).map((lvl) => (
        <div key={lvl}>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">{LEVELS[lvl]}</div>
          <ul>
            {mafsikim
              .filter((t) => t.level === lvl)
              .map((t) => (
                <TaamCard key={t.id} t={t} demo={demo} />
              ))}
          </ul>
        </div>
      ))}

      {mesharetim.length > 0 && (
      <>
      <h3 className="mt-6 text-base font-semibold text-stone-900">
        Mesharetim <span className="text-sm font-normal text-stone-500">(connecting te&apos;amim)</span>
      </h3>
      <ul>
        {mesharetim.map((t) => (
          <TaamCard key={t.id} t={t} demo={demo} />
        ))}
      </ul>
      </>
      )}
      <p className="mt-4 text-xs text-stone-400">
        Names follow the Sephardic Pizmonim Project (pizmonim.org). Examples are from the Westminster Leningrad Codex.
      </p>
    </section>
  );
}
