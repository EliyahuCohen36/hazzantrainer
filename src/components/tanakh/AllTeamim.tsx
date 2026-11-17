"use client";

import { PROSE_TEAMIM, EMET_TEAMIM } from "@/data/teamim-reference";
import { tuneRecording } from "@/data/tanakh-recordings";
import { Recording } from "@/components/audio/Recording";
import { WithMaamid } from "@/components/reader/Maamid";
import { useExistingRecordings } from "@/lib/recordings";
import { AdminDrop } from "@/components/admin/AdminDrop";

/**
 * Every ta'am at a glance, with the Hazzan's one review recording of all of
 * them for this tune (teamim/<tune>/all.mp3, uploaded at /admin/).
 */
export function AllTeamim({ tune = "torah", emet = false, links = true }: { tune?: string; emet?: boolean; links?: boolean }) {
  const list = (emet ? EMET_TEAMIM : PROSE_TEAMIM).filter((t) => t.id);
  const review = tuneRecording(tune, "all");
  const have = useExistingRecordings([review]);
  return (
    <section className="mb-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-900">All the te&apos;amim</h2>
        <span dir="rtl" lang="he" className="font-hebrew text-lg text-stone-600">
          כל הטעמים
        </span>
      </div>
      {have?.has(review) && (
        <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3">
          <span className="text-sm font-medium text-stone-800">🔊 Review: the Hazzan sings them all</span>
          <Recording src={review} className="h-9 w-full max-w-md" />
        </div>
      )}
      <div className="mt-2">
        <AdminDrop path={review} compact label="Drop the review recording of all the te'amim here" />
      </div>
      <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-1.5" dir="rtl">
        {list.map((t) => {
          const body = (
            <>
              <span lang="he" className="hebrew-text w-9 text-center font-hebrew text-2xl leading-[1.9] text-amber-800">
                <WithMaamid text={t.sample} />
              </span>
              <span className="min-w-0 text-start">
                <span lang="he" className="block truncate font-hebrew text-sm text-stone-900">
                  {t.hebrew}
                </span>
                <span dir="ltr" className="block truncate text-[0.7rem] text-stone-500">
                  {t.syrian}
                </span>
              </span>
            </>
          );
          return (
            <li key={t.id}>
              {links ? (
                <a href={`#${t.id}`} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 ring-1 ring-stone-200 hover:bg-amber-50">
                  {body}
                </a>
              ) : (
                <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 ring-1 ring-stone-200">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
