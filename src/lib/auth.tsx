"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabase";
import { forgetUser, pullProgress } from "./audio/taam-practice";

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
    const [{ data: p }, { data: ok }, { data: lvl }, { data: blvl }, { data: lopen }] = await Promise.all([
      db.from("profiles").select("id, role, school_id, display_name, username").eq("id", s.user.id).maybeSingle(),
      db.rpc("has_access"),
      db.rpc("my_level"),
      db.rpc("my_beginner_level"),
      db.rpc("my_letters_open"),
    ]);
    // Class settings (supabase/accounts.sql); missing before that file is run.
    const { data: cs } = await db.rpc("my_class_settings");
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

  const refresh = useCallback(async () => {
    const { data } = await supabase().auth.getSession();
    await load(data.session);
  }, [load]);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ loading, session, profile, access, level, beginnerLevel, lettersOpen, scriptOpen, sections, selfPaced: profile?.role === "family", refresh, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
