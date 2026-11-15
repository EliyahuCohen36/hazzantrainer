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
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  loading: true,
  session: null,
  profile: null,
  access: false,
  refresh: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [access, setAccess] = useState(false);

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
    const [{ data: p }, { data: ok }] = await Promise.all([
      db.from("profiles").select("id, role, school_id, display_name, username").eq("id", s.user.id).maybeSingle(),
      db.rpc("has_access"),
    ]);
    setProfile((p as Profile) ?? null);
    setAccess(ok === true);
    setLoading(false);
    if (ok === true) pullProgress().catch(() => {});
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) {
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
    <AuthContext.Provider value={{ loading, session, profile, access, refresh, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
