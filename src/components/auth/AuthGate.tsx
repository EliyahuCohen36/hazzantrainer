"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";
import { OPEN_PAGES } from "@/data/demo";
import { LoginForm, RedeemForm } from "./forms";
import { Landing } from "./Landing";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">{children}</div>
    </main>
  );
}

function AccountBar() {
  const { session, profile, signOut } = useAuth();
  if (!session) {
    return (
      <div className="flex justify-end gap-3 px-4 py-2 text-sm">
        <Link href="/demo/" className="text-stone-600 hover:underline">
          Try the demo
        </Link>
        <Link href="/login/" className="font-medium text-amber-800 hover:underline">
          Sign in
        </Link>
      </div>
    );
  }
  const name = profile?.display_name || profile?.username || session.user.email;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 border-b border-stone-200 bg-white/70 px-4 py-2 text-sm">
      {profile?.role === "admin" && (
        <Link href="/admin/" className="font-medium text-amber-800 hover:underline">
          Admin
        </Link>
      )}
      {(profile?.role === "teacher" || profile?.role === "admin") && (
        <Link href="/teacher/" className="font-medium text-amber-800 hover:underline">
          My classes
        </Link>
      )}
      <span className="text-stone-500">{name}</span>
      <button type="button" onClick={() => signOut()} className="text-stone-600 hover:underline">
        Sign out
      </button>
    </div>
  );
}

/**
 * The site is for paying schools: every page needs a signed-in account whose
 * school licence is current, except the home page (which shows a welcome page
 * to visitors), the demo, and the sign-in / join pages.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const normalized = path.endsWith("/") ? path : `${path}/`;
  const { loading, session, profile, access } = useAuth();

  // Before accounts are connected, the site works as before.
  if (!supabaseConfigured) return <>{children}</>;

  const open = OPEN_PAGES.includes(normalized) && normalized !== "/";
  let body: React.ReactNode;

  if (open) body = children;
  else if (loading) body = <p className="py-24 text-center text-stone-400">Loading…</p>;
  else if (!session) body = normalized === "/" ? <Landing /> : <Card title="Please sign in">{<LoginForm />}</Card>;
  else if (access) body = children;
  else if (!profile || profile.role === "none")
    body = (
      <Card title="One more step">
        <RedeemForm intro="Enter the class code from your teacher (or the teacher code from your school) to finish setting up your account." />
      </Card>
    );
  else
    body = (
      <Card title="Your school's licence has ended">
        <p className="text-stone-600">
          Your account is fine, but your school&apos;s Kriah Trainer licence isn&apos;t active right now. Please tell
          your teacher. Your progress is saved and will be here when it&apos;s renewed.
        </p>
      </Card>
    );

  return (
    <>
      <AccountBar />
      {body}
    </>
  );
}
