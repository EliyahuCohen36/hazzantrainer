"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { currentNusach, recordingsChanged } from "@/lib/recordings";

/**
 * For the admin only: drop a recording (or tap to choose one) right where it
 * belongs. It's saved to the private bucket at `path` ("/audio/…"), replacing
 * any recording there, and every player on the page picks it up.
 */
export function AdminDrop({
  path,
  label = "Drop a recording here",
  compact = false,
  exists = false,
}: {
  path: string;
  label?: string;
  compact?: boolean;
  /** A recording is already there: also offer to remove it (e.g. uploaded by mistake). */
  exists?: boolean;
}) {
  const { profile } = useAuth();
  const [over, setOver] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  if (profile?.role !== "admin") return null;
  // With Yerushalmi picked in the header, the recording is saved as the Yerushalmi one.
  const nusach = typeof window === "undefined" ? "syrian" : currentNusach();
  const target = nusach === "syrian" ? path : `/audio/nusach/${nusach}/${path.replace(/^\/audio\//, "")}`;

  const upload = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !/\.(mp3|m4a|wav|aac|ogg|webm)$/i.test(f.name)) {
      setMsg("✗ That isn't an audio file");
      return;
    }
    setMsg("Saving…");
    const { error } = await supabase()
      .storage.from("recordings")
      // Replaces any recording already there (upsert); a short cache time so the new one is heard at once.
      .upload(target.replace(/^\/audio\//, ""), f, { upsert: true, contentType: f.type || "audio/mpeg", cacheControl: "60" });
    setMsg(error ? `✗ ${error.message}` : "✓ Saved");
    if (!error) {
      recordingsChanged(target);
      recordingsChanged(path);
    }
  };

  const remove = async () => {
    if (!window.confirm("Remove this recording? (You can drop a new one any time.)")) return;
    setMsg("Removing…");
    const { error } = await supabase().storage.from("recordings").remove([target.replace(/^\/audio\//, "")]);
    setMsg(error ? `✗ ${error.message}` : "✓ Removed");
    if (!error) {
      recordingsChanged(target);
      recordingsChanged(path);
    }
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" data-no-translate>
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        void upload(e.dataTransfer.files[0]);
      }}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed font-sans text-xs ${
        compact ? "px-2 py-0.5" : "px-3 py-1.5"
      } ${over ? "border-amber-600 bg-amber-100 text-amber-900" : "border-stone-300 bg-white/70 text-stone-500 hover:border-amber-400"}`}
      title={`Admin: upload to ${target.replace(/^\/audio\//, "")}`}
      dir="ltr"
      data-no-translate
    >
      ⬆ {msg ?? label}
      {nusach !== "syrian" && !msg && <b className="text-amber-800">({nusach})</b>}
      <input
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
    {exists && (
      <button type="button" onClick={remove} className="rounded-lg border border-red-200 px-2 py-0.5 font-sans text-xs text-red-700 hover:bg-red-50">
        🗑 Remove
      </button>
    )}
    </span>
  );
}
