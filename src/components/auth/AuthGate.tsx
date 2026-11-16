"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabaseConfigured } from "@/lib/supabase";
import { OPEN_PAGES } from "@/data/demo";
import { INDIVIDUAL_PRICE, YEARLY_PRICE } from "@/data/pricing";
import { LoginForm, RedeemForm } from "./forms";
import { Landing } from "./Landing";
import { LanguageSwitcher } from "@/lib/i18n/Translator";
import { NusachPicker } from "@/components/NusachPicker";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-stone-900">{title}</h1>
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">{children}</div>
    </main>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-md px-2 py-1 font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900">
      {children}
    </Link>
  );
}

/** Top of every page: home, about, and the account links. */
function SiteHeader() {
  const { session, profile, signOut } = useAuth();
  const name = profile?.display_name || profile?.username || session?.user.email;
  return (
    <header className="z-30 sm:sticky sm:top-0 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-sm">
        <Link href="/" className="me-2 flex items-center gap-2 rounded-md py-1 pe-2" aria-label="Kriah Trainer home">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-700 font-hebrew text-lg text-white">ק</span>
          <span className="font-semibold text-stone-900">Kriah Trainer</span>
        </Link>
        <NavLink href="/">Home</NavLink>
        <NavLink href="/about/">About</NavLink>
        {!session && <NavLink href="/demo/">Try the demo</NavLink>}
        <div className="ms-auto flex flex-wrap items-center gap-x-2">
          {profile?.role === "admin" && <NavLink href="/admin/">Admin</NavLink>}
          {(profile?.role === "teacher" || profile?.role === "admin") && <NavLink href="/teacher/">My classes</NavLink>}
          {session ? (
            <>
              <span className="hidden px-1 text-stone-500 sm:inline">{name}</span>
              <button type="button" onClick={() => signOut()} className="rounded-md px-2 py-1 text-stone-600 hover:bg-stone-100">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login/" className="rounded-lg bg-amber-700 px-3 py-1.5 font-semibold text-white hover:bg-amber-800">
              Sign in
            </Link>
          )}
          <NusachPicker />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
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
  if (!supabaseConfigured)
    return (
      <>
        <SiteHeader />
        {children}
      </>
    );

  const open = OPEN_PAGES.includes(normalized) && normalized !== "/";
  let body: React.ReactNode;

  if (open) body = children;
  else if (loading) body = <p className="py-24 text-center text-stone-400">Loading…</p>;
  else if (!session) body = normalized === "/" ? <Landing /> : <Card title="Please sign in">{<LoginForm />}</Card>;
  else if (access) body = children;
  else if (!profile || profile.role === "none")
    body = (
      <Card title="One more step">
        <RedeemForm intro="Learning through a school? Enter the class code from your teacher (or the teacher code from your school)." />
        <div className="mt-5 border-t border-stone-100 pt-4 text-center">
          <p className="text-sm text-stone-600">On your own?</p>
          <Link
            href="/subscribe/"
            className="mt-2 block rounded-lg border border-amber-600 px-4 py-2.5 font-semibold text-amber-800 hover:bg-amber-50"
          >
            Subscribe: {INDIVIDUAL_PRICE} a month or {YEARLY_PRICE} a year
          </Link>
        </div>
      </Card>
    );
  else
    body = (
      profile.role === "family" ? (
        <Card title="Your subscription has ended">
          <p className="text-stone-600">Your progress is saved. Subscribe again to keep learning.</p>
          <Link href="/subscribe/" className="mt-4 block rounded-lg bg-amber-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-amber-800">
            Subscribe: {INDIVIDUAL_PRICE} a month or {YEARLY_PRICE} a year
          </Link>
        </Card>
      ) : (
        <Card title="Your school's licence has ended">
          <p className="text-stone-600">
            Your account is fine, but your school&apos;s Kriah Trainer licence isn&apos;t active right now. Please tell
            your teacher. Your progress is saved and will be here when it&apos;s renewed.
          </p>
        </Card>
      )
    );

  return (
    <>
      <SiteHeader />
      {body}
    </>
  );
}
