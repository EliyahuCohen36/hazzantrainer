import { PROSE_TEAMIM, type TaamReference } from "@/data/teamim-reference";
import { TORAH_EXAMPLES, type TaamExample } from "@/data/torah-examples";
import { TORAH_TEAMIM_RECORDINGS } from "@/data/teamim-recordings";
import { asset } from "@/lib/base-path";

const LEVELS: Record<number, string> = {
  1: "Strongest pause",
  2: "Major pause",
  3: "Medium pause",
  4: "Light pause",
};

function Example({ ex, sofPasuk }: { ex: TaamExample; sofPasuk: boolean }) {
  return (
    <div className="rounded-lg bg-stone-50 px-3 py-2">
      <p dir="rtl" lang="he" className="hebrew-text font-hebrew text-xl leading-[2.1] text-stone-500">
        {ex.phrase.map((w, i) => (
          <span key={i}>
            {i > 0 && " "}
            <span className={i === ex.at ? "rounded bg-amber-200/80 px-1 text-stone-900" : ""}>{w}</span>
          </span>
        ))}
        {sofPasuk && "׃"}
      </p>
      <p className="text-xs text-stone-400">{ex.ref}</p>
    </div>
  );
}

function TaamCard({ t }: { t: TaamReference }) {
  const id = t.id ?? "";
  const examples = TORAH_EXAMPLES[id] ?? [];
  const audio = TORAH_TEAMIM_RECORDINGS[id];
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
          <audio src={asset(audio)} controls preload="none" className="h-9 w-full max-w-sm" />
        ) : (
          <p className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">
            <span aria-hidden>♪</span> Recording coming soon
          </p>
        )}
        {t.note && <p className="text-sm text-stone-600">{t.note}</p>}
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
export function TorahTeamim() {
  const mafsikim = PROSE_TEAMIM.filter((t) => t.role === "mafsik");
  const mesharetim = PROSE_TEAMIM.filter((t) => t.role === "mesharet");
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
      {[1, 2, 3, 4].map((lvl) => (
        <div key={lvl}>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-400">{LEVELS[lvl]}</div>
          <ul>
            {mafsikim
              .filter((t) => t.level === lvl)
              .map((t) => (
                <TaamCard key={t.id} t={t} />
              ))}
          </ul>
        </div>
      ))}

      <h3 className="mt-6 text-base font-semibold text-stone-900">
        Mesharetim <span className="text-sm font-normal text-stone-500">(connecting te&apos;amim)</span>
      </h3>
      <ul>
        {mesharetim.map((t) => (
          <TaamCard key={t.id} t={t} />
        ))}
      </ul>
      <p className="mt-4 text-xs text-stone-400">
        Names follow the Sephardic Pizmonim Project (pizmonim.org). Examples are from the Westminster Leningrad Codex.
      </p>
    </section>
  );
}
