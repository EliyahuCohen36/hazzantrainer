"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  INDIVIDUAL_FEATURES,
  INDIVIDUAL_PERIOD,
  INDIVIDUAL_PRICE,
  STRIPE_PAYMENT_LINK,
  STRIPE_PORTAL_LINK,
} from "@/data/pricing";

const input =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

function CreateAccount() {
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError("The password needs at least 6 characters.");
    setBusy(true);
    const { error } = await supabase().auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    setBusy(false);
    if (error) setError(/already/i.test(error.message) ? "There's already an account with that email. Sign in instead." : error.message);
    else await refresh();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-sm font-semibold text-stone-900">1. Create your account</p>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Your name</span>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Email</span>
        <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
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
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      <button
        className="w-full rounded-lg bg-amber-700 px-4 py-2.5 font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
        disabled={busy}
      >
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

function Pay() {
  const { session, refresh } = useAuth();
  const [waiting, setWaiting] = useState(false);

  // Back from Stripe: wait for the payment to be confirmed, then let them in.
  useEffect(() => {
    if (!new URLSearchParams(location.search).has("paid")) return;
    setWaiting(true);
    const t = setInterval(() => void refresh(), 3000);
    return () => clearInterval(t);
  }, [refresh]);

  if (!STRIPE_PAYMENT_LINK) {
    return (
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Card payments open soon.</p>
        <p className="mt-1">Your account is ready. You&apos;ll be able to subscribe here very soon.</p>
      </div>
    );
  }
  const url = new URL(STRIPE_PAYMENT_LINK);
  if (session) {
    url.searchParams.set("client_reference_id", session.user.id);
    if (session.user.email) url.searchParams.set("prefilled_email", session.user.email);
  }
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-stone-900">2. Subscribe</p>
      {waiting ? (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
          Thank you! Confirming your payment… the trainer opens as soon as it&apos;s done.
        </p>
      ) : (
        <a
          href={url.toString()}
          className="block rounded-xl bg-amber-700 px-5 py-3 text-center text-base font-semibold text-white hover:bg-amber-800"
        >
          Pay {INDIVIDUAL_PRICE} a {INDIVIDUAL_PERIOD} by card
        </a>
      )}
      <p className="text-xs text-stone-500">Secure payment by Stripe. Cancel any time.</p>
    </div>
  );
}

/** The $10/month individual plan: create an account, then pay by card. */
export default function SubscribePage() {
  const { session, access, profile } = useAuth();
  return (
    <main className="mx-auto grid max-w-4xl gap-8 px-4 py-10 md:grid-cols-2">
      <div>
        <h1 className="text-3xl font-semibold text-stone-900">Individual plan</h1>
        <p className="mt-2">
          <span className="text-4xl font-semibold text-stone-900">{INDIVIDUAL_PRICE}</span>
          <span className="text-stone-500"> / {INDIVIDUAL_PERIOD}</span>
        </p>
        <ul className="mt-5 space-y-2 text-stone-700">
          {INDIVIDUAL_FEATURES.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-amber-700">✓</span>
              {f}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-stone-500">
          Learning through your school? You don&apos;t need to pay: create your account with the code from your teacher on
          the{" "}
          <Link href="/join/" className="font-medium text-amber-800 underline">
            join page
          </Link>
          .
        </p>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        {access ? (
          <div className="space-y-3">
            <p className="font-semibold text-stone-900">You&apos;re all set ✓</p>
            <Link href="/" className="block rounded-xl bg-amber-700 px-5 py-3 text-center font-semibold text-white hover:bg-amber-800">
              Open the trainer
            </Link>
            {profile?.role === "family" && STRIPE_PORTAL_LINK && (
              <a href={STRIPE_PORTAL_LINK} className="block text-center text-sm text-stone-600 underline">
                Manage or cancel your subscription
              </a>
            )}
          </div>
        ) : session ? (
          <Pay />
        ) : (
          <CreateAccount />
        )}
      </div>
    </main>
  );
}
