"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SECTION_TITLES, TANAKH, PROSE_TEAMIM, EMET_TEAMIM, type TanakhSection } from "@/data/teamim-reference";
import { PARASHOT } from "@/data/parashot";
import { ALIYAH_NAMES } from "@/data/aliyah-names";
import { bookParts } from "@/data/tanakh-chapters";
import { aliyahRecording, chapterRecording, TUNE_SETS, tuneRecording } from "@/data/tanakh-recordings";
import { listRecordings } from "@/lib/recordings";
import { supabase } from "@/lib/supabase";
import { Recording } from "@/components/audio/Recording";

const bucketPath = (p: string) => p.replace(/^\/audio\//, "");
const select =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-amber-500";

interface Slot {
  label: string;
  path: string;
}

/** One recording: play it, upload or replace it, delete it. */
function SlotRow({ slot, has, onChange }: { slot: Slot; has: boolean; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const upload = async (f: File) => {
    setBusy(true);
    setMsg(null);
    const { error } = await supabase()
      .storage.from("recordings")
      .upload(bucketPath(slot.path), f, { upsert: true, contentType: f.type || "audio/mpeg" });
    setBusy(false);
    setMsg(error ? `✗ ${error.message}` : "✓ Saved");
    onChange();
  };
  const remove = async () => {
    if (!confirm(`Delete the recording "${slot.label}"? This can't be undone.`)) return;
    setBusy(true);
    const { error } = await supabase().storage.from("recordings").remove([bucketPath(slot.path)]);
    setBusy(false);
    setMsg(error ? `✗ ${error.message}` : "Deleted");
    onChange();
  };
  return (
    <li className="flex flex-wrap items-center gap-3 border-b border-stone-100 py-2 last:border-0">
      <span className={`w-48 text-sm font-medium ${has ? "text-stone-900" : "text-stone-400"}`}>
        {has ? "✓ " : "○ "}
        {slot.label}
      </span>
      {has && <Recording key={slot.path + msg} src={slot.path} className="h-8 w-full max-w-xs" />}
      <label className="cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100">
        {busy ? "Saving…" : has ? "Replace" : "Upload"}
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
      </label>
      {has && (
        <button type="button" onClick={() => void remove()} className="text-xs text-rose-700 hover:underline" disabled={busy}>
          Delete
        </button>
      )}
      {msg && <span className="text-xs text-stone-500">{msg}</span>}
    </li>
  );
}

/**
 * Admin: the Hazzan's recordings for every part of Tanakh. Readings (one per
 * aliyah in the Torah, one per chapter in Nevi'im and Ketuvim) appear on the
 * text pages with a "Read it yourself" score; te'amim of each tune appear on
 * the te'amim page.
 */
export function TanakhRecordingsPanel() {
  const [kind, setKind] = useState<"reading" | "teamim">("reading");
  const [section, setSection] = useState<TanakhSection>("torah");
  const books = TANAKH.filter((b) => b.section === section);
  const [book, setBook] = useState(books[0].id);
  const [unit, setUnit] = useState<string>("");
  const [tune, setTune] = useState(TUNE_SETS[0].id);
  const [have, setHave] = useState<Set<string>>(new Set());

  useEffect(() => {
    const first = TANAKH.find((b) => b.section === section)!.id;
    setBook(first);
  }, [section]);

  // Units: parashiyot for the Torah, parts (or the whole book) otherwise.
  const units = useMemo(() => {
    if (section === "torah") return PARASHOT.filter((p) => p.book === book).map((p) => ({ id: p.id, en: p.en }));
    return bookParts(book).map((p, i) => ({ id: String(i), en: p.en ?? "All chapters" }));
  }, [section, book]);
  useEffect(() => setUnit(units[0]?.id ?? ""), [units]);

  const slots: Slot[] = useMemo(() => {
    if (kind === "teamim") {
      const t = TUNE_SETS.find((x) => x.id === tune)!;
      return (t.system === "emet" ? EMET_TEAMIM : PROSE_TEAMIM)
        .filter((x) => x.id)
        .map((x) => ({ label: x.syrian, path: tuneRecording(tune, x.id!) }));
    }
    if (section === "torah") {
      const p = PARASHOT.find((x) => x.id === unit);
      if (!p) return [];
      return p.aliyot.map((a) => ({
        label: `${a.n === "M" ? "Maftir" : ALIYAH_NAMES[String(a.n)].en} (${a.from}–${a.to})`,
        path: aliyahRecording(book, p.id, a.n),
      }));
    }
    const part = bookParts(book)[Number(unit)];
    return (part?.chapters ?? []).map((c) => ({ label: `Chapter ${c.c}`, path: chapterRecording(book, c.slug) }));
  }, [kind, tune, section, book, unit]);

  const load = useCallback(async () => {
    const dirs = [...new Set(slots.map((s) => s.path.slice(0, s.path.lastIndexOf("/"))))];
    const found = new Set<string>();
    for (const d of dirs) for (const n of await listRecordings(d, true)) found.add(`${d}/${n}`);
    setHave(found);
  }, [slots]);
  useEffect(() => {
    void load();
  }, [load]);

  const count = slots.filter((s) => have.has(s.path)).length;
  const tuneSet = TUNE_SETS.find((x) => x.id === tune)!;

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Tanakh recordings</h2>
      <p className="mt-1 text-sm text-stone-600">
        Upload the Hazzan&apos;s reading of each aliyah (Torah) or chapter (Nevi&apos;im and Ketuvim), and the te&apos;amim
        of each tune. They appear on the site as soon as they&apos;re saved: students hear them and can read the section
        themselves for a score. Replace or delete any time. MP3 is best.
      </p>

      <div className="mt-3 inline-flex rounded-lg border border-stone-300 p-0.5 text-sm">
        {(
          [
            ["reading", "Readings"],
            ["teamim", "Te'amim of each tune"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md px-3 py-1.5 font-medium ${kind === k ? "bg-amber-700 text-white" : "text-stone-700"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {kind === "reading" ? (
          <>
            <select className={select} value={section} onChange={(e) => setSection(e.target.value as TanakhSection)}>
              {(["torah", "neviim", "ketuvim"] as const).map((s) => (
                <option key={s} value={s}>
                  {SECTION_TITLES[s].en}
                </option>
              ))}
            </select>
            <select className={select} value={book} onChange={(e) => setBook(e.target.value)}>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.en}
                </option>
              ))}
            </select>
            {units.length > 1 && (
              <select className={select} value={unit} onChange={(e) => setUnit(e.target.value)}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.en}
                  </option>
                ))}
              </select>
            )}
          </>
        ) : (
          <select className={select} value={tune} onChange={(e) => setTune(e.target.value)}>
            {TUNE_SETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.en}
              </option>
            ))}
          </select>
        )}
      </div>
      {kind === "teamim" && (
        <p className="mt-2 text-xs text-stone-500">
          {tuneSet.system === "emet" ? "Ta'amei Emet. " : ""}
          {tune === "torah"
            ? "The Torah tune's te'amim are the ones in the te'amim trainer (also listed above under Recordings)."
            : "Each ta'am sung alone, in this book's tune."}
        </p>
      )}

      <p className="mt-3 text-sm text-stone-600">
        {count} of {slots.length} recorded
      </p>
      <ul className="mt-1">
        {slots.map((s) => (
          <SlotRow key={s.path} slot={s} has={have.has(s.path)} onChange={() => void load()} />
        ))}
      </ul>
    </section>
  );
}
