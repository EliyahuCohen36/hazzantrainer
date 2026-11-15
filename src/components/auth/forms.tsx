"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { loginEmail, supabase, validUsername } from "@/lib/supabase";

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
