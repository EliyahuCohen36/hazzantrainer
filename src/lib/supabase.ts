import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Accounts, schools and the private recordings live in Supabase (free plan).
 * The URL and anon key are public by design (they're in every visitor's browser);
 * what each user may see is enforced by the security rules in supabase/schema.sql.
 * Set in .github/workflows/pages.yml (and .env.local for local work).
 */
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(URL && KEY);

let client: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!client) {
    if (!supabaseConfigured) throw new Error("Accounts aren't set up yet (Supabase URL and key missing).");
    client = createClient(URL, KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  }
  return client;
}

/**
 * Students sign in with a username, not an email (children under 13 shouldn't
 * have to give one). Supabase needs an email, so a username becomes a private
 * address that is never written to.
 */
export const STUDENT_DOMAIN = "students.kriah.invalid";

export function loginEmail(userOrEmail: string): string {
  const v = userOrEmail.trim().toLowerCase();
  return v.includes("@") ? v : `${v}@${STUDENT_DOMAIN}`;
}

export function validUsername(u: string): boolean {
  return /^[a-z0-9][a-z0-9._-]{2,29}$/.test(u.trim().toLowerCase());
}
