"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { loginEmail, supabase, validUsername } from "@/lib/supabase";
import { BASE_PATH } from "@/lib/base-path";

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
const button =
  "w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-amber-800 disabled:opacity-60";

function friendly(msg: string): string {
  if (/invalid login/i.test(msg)) return "That username/email or password is wrong.";
  if (/already registered|already exists|duplicate/i.test(msg)) return "That username or email is already taken. Try another, or sign in.";
  if (/password/i.test(msg) && /6|short|weak/i.test(msg)) return "The password needs at least 6 characters.";
  return msg;
}

/**
 * Sign in with a Google account (school or personal). Google must be switched on in Supabase
 * (Authentication → Sign In / Providers → Google). `back` is the page to return to.
 */
export function GoogleButton({ back = "/", label = "Continue with Google" }: { back?: string; label?: string }) {
  const [error, setError] = useState<string | null>(null);
  const go = async () => {
    setError(null);
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}${BASE_PATH}${back}` },
    });
    if (error) setError(/provider is not enabled|Unsupported provider/i.test(error.message) ? "Google sign-in isn't switched on yet." : error.message);
  };
  return (
    <div>
      <button
        type="button"
        onClick={go}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-stone-300 bg-white px-4 py-2.5 font-semibold text-stone-800 shadow-sm hover:bg-stone-50"
      >
        <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {label}
      </button>
      {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
    </div>
  );
}

function Or() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
      <span className="h-px grow bg-stone-200" />
      or
      <span className="h-px grow bg-stone-200" />
    </div>
  );
}

export function LoginForm() {
  const { refresh } = useAuth();
  const [who, setWho] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().auth.signInWithPassword({ email: loginEmail(who), password });
    setBusy(false);
    if (error) setError(friendly(error.message));
    else await refresh();
  };

  return (
    <>
    <GoogleButton label="Sign in with Google" />
    <Or />
    <form onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Username or email</span>
        <input className={input} value={who} onChange={(e) => setWho(e.target.value)} autoComplete="username" required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Password</span>
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <button className={button} disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="text-center text-sm text-stone-600">
        New? Your teacher gives you a class code.{" "}
        <Link href="/join/" className="font-medium text-amber-800 underline">
          Create your account
        </Link>
      </p>
    </form>
    </>
  );
}

/** Enter a class code (students) or teacher code (teachers) for an account that has none yet. */
export function RedeemForm({ intro }: { intro?: string }) {
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase().rpc("redeem_code", { p_code: code });
    setBusy(false);
    if (error) setError(error.message);
    else await refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {intro && <p className="text-sm text-stone-600">{intro}</p>}
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Class code or teacher code</span>
        <input
          className={`${input} font-mono uppercase tracking-widest`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <button className={button} disabled={busy}>
        {busy ? "Checking…" : "Join"}
      </button>
    </form>
  );
}

/**
 * Create an account with a code. Students: name, username, password, class code
 * (no email). Teachers: name, email, password, teacher code.
 */
export function JoinForm() {
  const { refresh } = useAuth();
  const [kind, setKind] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [who, setWho] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const username = who.trim().toLowerCase();
    if (kind === "student" && !validUsername(username)) {
      setError("Usernames are 3–30 letters or numbers (dots, dashes and underscores are fine), with no spaces.");
      return;
    }
    if (password.length < 6) {
      setError("The password needs at least 6 characters.");
      return;
    }
    setBusy(true);
    const db = supabase();
    const { data, error } = await db.auth.signUp({
      email: kind === "student" ? loginEmail(username) : who.trim(),
      password,
      options: { data: { display_name: name.trim(), username: kind === "student" ? username : "" } },
    });
    if (error) {
      setBusy(false);
      setError(friendly(error.message));
      return;
    }
    if (!data.session) {
      setBusy(false);
      setError("Account made, but email confirmation is switched on in Supabase. Ask the site owner to switch it off.");
      return;
    }
    if (code.trim()) {
      const { error: codeError } = await db.rpc("redeem_code", { p_code: code });
      if (codeError) setError(`Your account was made, but the code didn't work: ${codeError.message}`);
    }
    setBusy(false);
    await refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 text-sm">
        {(["student", "teacher"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md py-1.5 font-medium ${kind === k ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
          >
            {k === "student" ? "I'm a student" : "I'm a teacher"}
          </button>
        ))}
      </div>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">{kind === "student" ? "First name and last initial" : "Your name"}</span>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">{kind === "student" ? "Choose a username" : "Email"}</span>
        <input
          className={input}
          type={kind === "student" ? "text" : "email"}
          value={who}
          onChange={(e) => setWho(e.target.value)}
          autoComplete={kind === "student" ? "username" : "email"}
          required
        />
        {kind === "student" && <span className="text-xs text-stone-500">No email needed. Write it down with your password.</span>}
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Choose a password</span>
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">{kind === "student" ? "Class code (from your teacher)" : "Teacher code (from your school)"}</span>
        <input
          className={`${input} font-mono uppercase tracking-widest`}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required={kind === "student"}
        />
        {kind === "teacher" && <span className="text-xs text-stone-500">No code yet? Leave it empty; you can enter it later.</span>}
      </label>
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <button className={button} disabled={busy}>
        {busy ? "Creating…" : "Create account"}
      </button>
      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login/" className="font-medium text-amber-800 underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
