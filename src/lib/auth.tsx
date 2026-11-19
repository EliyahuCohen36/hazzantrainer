"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { forgetUser, loadProgress, pullProgress, PROGRESS_EVENT } from "./audio/taam-practice";
import { selfPacedLevels } from "./self-paced";

export type Role = "admin" | "teacher" | "student" | "family" | "none";

export interface Profile {
  id: string;
  role: Role;
  school_id: string | null;
  display_name: string | null;
  username: string | null;
}

interface AuthState {
  /** Still checking whether someone is signed in. */
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  /** Signed in and the school's (or family's) licence is current. */
  access: boolean;
  /** Highest te'amim level this user may open (teachers/admins: all). */
  level: number;
  /** Highest Beginner Keriah level this user may open. */
  beginnerLevel: number;
  /** How many letters of the alef-bet (in order) the teacher has opened. */
  lettersOpen: number;
  /** School students: the teacher has opened the script (handwriting) letters. */
  scriptOpen: boolean;
  /** Sections the teacher lets this class use (null = everything). */
  sections: string[] | null;
  /** Personal subscribers (and free testers): each level opens when the one before is finished. */
  selfPaced: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  loading: true,
  session: null,
  profile: null,
  access: false,
  level: 1,
  beginnerLevel: 1,
  lettersOpen: 1,
  scriptOpen: false,
  sections: null,
  selfPaced: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [access, setAccess] = useState(false);
  const [level, setLevel] = useState(1);
  const [beginnerLevel, setBeginnerLevel] = useState(1);
  const [lettersOpen, setLettersOpen] = useState(1);
  const [scriptOpen, setScriptOpen] = useState(false);
  const [sections, setSections] = useState<string[] | null>(null);

  const load = useCallback(async (s: Session | null) => {
    setSession(s);
    if (!s) {
      forgetUser();
      setProfile(null);
      setAccess(false);
      setLoading(false);
      return;
    }
    const db = supabase();
    const cacheKey = `kriah-auth-cache:${s.user.id}`;
    let p: unknown, ok: unknown, lvl: unknown, blvl: unknown, lopen: unknown, cs: unknown;
    try {
      const r = await Promise.all([
        db.from("profiles").select("id, role, school_id, display_name, username").eq("id", s.user.id).maybeSingle(),
        db.rpc("has_access"),
        db.rpc("my_level"),
        db.rpc("my_beginner_level"),
        db.rpc("my_letters_open"),
      ]);
      if (r[0].error && /fetch|network/i.test(r[0].error.message)) throw r[0].error;
      [p, ok, lvl, blvl, lopen] = r.map((x) => x.data);
      // Class settings (supabase/accounts.sql); missing before that file is run.
      cs = (await db.rpc("my_class_settings")).data;
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ p, ok, lvl, blvl, lopen, cs, at: Date.now() }));
      } catch {}
    } catch (e) {
      // Offline (the app saved to the home screen): use what we knew the last time, for up to 40 days.
      let c: { p: unknown; ok: unknown; lvl: unknown; blvl: unknown; lopen: unknown; cs: unknown; at: number } | null = null;
      try {
        c = JSON.parse(localStorage.getItem(cacheKey) ?? "null");
      } catch {}
      if (!c || Date.now() - c.at > 40 * 86400000) {
        console.warn("Offline and nothing saved yet", e);
        setAccess(false);
        setLoading(false);
        return;
      }
      ({ p, ok, lvl, blvl, lopen, cs } = c);
    }
    const settings = (cs ?? {}) as { script_open?: boolean; sections?: string[] | null };
    setScriptOpen(!!settings.script_open);
    setSections(settings.sections ?? null);
    setBeginnerLevel(typeof blvl === "number" ? blvl : 1);
    setLettersOpen(typeof lopen === "number" ? lopen : 1);
    setLevel(typeof lvl === "number" ? lvl : 1);
    setProfile((p as Profile) ?? null);
    setAccess(ok === true);
    setLoading(false);
    if (ok === true) pullProgress().catch(() => {});
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
      // Local preview without accounts: everything open.
      setLevel(99);
      setBeginnerLevel(99);
      setLettersOpen(99);
      setScriptOpen(true);
      setLoading(false);
      return;
    }
    const db = supabase();
    db.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = db.auth.onAuthStateChange((event, s) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") load(s);
      else setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Personal subscribers: levels open by finishing the one before (recomputed as progress changes).
  const [paced, setPaced] = useState<ReturnType<typeof selfPacedLevels> | null>(null);
  useEffect(() => {
    if (profile?.role !== "family") {
      setPaced(null);
      return;
    }
    const read = () => setPaced(selfPacedLevels(loadProgress().practice));
    read();
    window.addEventListener(PROGRESS_EVENT, read);
    return () => window.removeEventListener(PROGRESS_EVENT, read);
  }, [profile]);

  const refresh = useCallback(async () => {
    const { data } = await supabase().auth.getSession();
    await load(data.session);
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{
        loading,
        session,
        profile,
        access,
        level: paced?.level ?? level,
        beginnerLevel: paced?.beginnerLevel ?? beginnerLevel,
        lettersOpen: paced?.lettersOpen ?? lettersOpen,
        scriptOpen,
        sections,
        selfPaced: profile?.role === "family",
        refresh,
        signOut,
      }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
