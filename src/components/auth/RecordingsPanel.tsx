"use client";

import { useCallback, useEffect, useState } from "react";
import { allRecordings } from "@/data/all-recordings";
import { DEMO_FILES } from "@/data/demo";
import { asset } from "@/lib/base-path";
import { supabase } from "@/lib/supabase";

const bucketPath = (p: string) => p.replace(/^\/audio\//, "");

/**
 * Admin: the Hazzan's recordings in the private bucket. Shows which are missing,
 * copies them in from the site, or uploads a file from this computer.
 */
export function RecordingsPanel() {
  const [have, setHave] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const wanted = allRecordings().filter((p) => !DEMO_FILES.has(p));

  const load = useCallback(async () => {
    const db = supabase().storage.from("recordings");
    const folders = [...new Set(wanted.map((p) => bucketPath(p).split("/").slice(0, -1).join("/")))];
    const found = new Set<string>();
    for (const f of folders) {
      const { data } = await db.list(f, { limit: 1000 });
      for (const o of data ?? []) found.add(`${f}/${o.name}`);
    }
    setHave(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const missing = wanted.filter((p) => !have.has(bucketPath(p)));

  const put = async (path: string, body: Blob) => {
    const type = path.endsWith(".wav") ? "audio/wav" : "audio/mpeg";
    const { error } = await supabase().storage.from("recordings").upload(bucketPath(path), body, { upsert: true, contentType: type });
    setLog((l) => [...l, error ? `✗ ${path}: ${error.message}` : `✓ ${path}`]);
  };

  const copyFromSite = async () => {
    setBusy("copy");
    for (const p of missing) {
      const r = await fetch(asset(p));
      if (!r.ok) {
        setLog((l) => [...l, `✗ ${p}: not on the site — upload it below`]);
        continue;
      }
      await put(p, await r.blob());
    }
    setBusy(null);
    load();
  };

  /** Upload several files at once, matched to the recordings by file name. */
  const uploadMany = async (files: FileList) => {
    setBusy("many");
    for (const f of Array.from(files)) {
      const p = wanted.find((w) => w.split("/").pop() === f.name);
      if (!p) setLog((l) => [...l, `✗ ${f.name}: no recording by that name`]);
      else await put(p, f);
    }
    setBusy(null);
    load();
  };

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Recordings (private)</h2>
      <p className="mt-1 text-sm text-stone-600">
        {wanted.length - missing.length} of {wanted.length} recordings are in private storage. Only signed-in users with an
        active licence can play them. (The {DEMO_FILES.size} demo recordings stay public.)
      </p>
      {missing.length > 0 && (
        <>
          <label className="mt-3 me-3 inline-block cursor-pointer rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100">
            {busy === "many" ? "Uploading…" : "Upload several files"}
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && uploadMany(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={copyFromSite}
            disabled={busy !== null}
            className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
          >
            {busy === "copy" ? "Copying…" : `Copy ${missing.length} missing recordings from the site`}
          </button>
          <ul className="mt-3 space-y-1 text-sm">
            {missing.map((p) => (
              <li key={p} className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-stone-700">{bucketPath(p)}</span>
                <label className="cursor-pointer text-xs font-medium text-amber-800 underline">
                  upload file
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      setBusy(p);
                      await put(p, f);
                      setBusy(null);
                      load();
                    }}
                  />
                </label>
              </li>
            ))}
          </ul>
        </>
      )}
      {log.length > 0 && (
        <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-stone-50 p-2 text-xs text-stone-600">{log.join("\n")}</pre>
      )}
    </section>
  );
}
