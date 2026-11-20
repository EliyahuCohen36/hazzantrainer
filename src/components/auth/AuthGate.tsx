"use client";

import { asset } from "@/lib/base-path";
import { SiteEditor } from "@/components/admin/SiteEditor";
import { SitePictures } from "@/components/admin/SitePictures";
import { AdminBar } from "@/components/admin/AdminBar";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { supabase, supabaseConfigured } from "@/lib/supabase";
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

/** Each tab in the header has its own colour (owner's request). */
const TONES = {
  amber: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  sky: "bg-sky-100 text-sky-900 hover:bg-sky-200",
  emerald: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200",
  rose: "bg-rose-100 text-rose-900 hover:bg-rose-200",
  violet: "bg-violet-100 text-violet-900 hover:bg-violet-200",
  teal: "bg-teal-100 text-teal-900 hover:bg-teal-200",
} as const;

function NavLink({ href, children, tone = "amber" }: { href: string; children: React.ReactNode; tone?: keyof typeof TONES }) {
  return (
    <Link href={href} className={`rounded-full px-3 py-1 font-medium transition-colors ${TONES[tone]}`}>
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
        <Link href="/" className="me-2 flex items-center gap-2 rounded-md py-1 pe-2" aria-label="Keriah Trainer home">
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-700 font-hebrew text-lg text-white">ק</span>
          <span className="font-semibold text-stone-900">Keriah Trainer</span>
        </Link>
        <NavLink href="/" tone="amber">Home</NavLink>
        <NavLink href="/about/" tone="sky">About</NavLink>
        {!session && <NavLink href="/schools/" tone="emerald">For schools</NavLink>}
        {!session && <NavLink href="/demo/" tone="rose">Try the demo</NavLink>}
        <div className="ms-auto flex flex-wrap items-center gap-x-2">
          {profile?.role === "admin" && <NavLink href="/admin/" tone="violet">Admin</NavLink>}
          {(profile?.role === "teacher" || profile?.role === "admin") && <NavLink href="/teacher/" tone="teal">My classes</NavLink>}
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
      <p className="border-t border-amber-200 bg-amber-50 px-4 py-1 text-center text-xs font-semibold text-amber-900">
        Please do not use this app on Shabbat and Yamim Tovim.
      </p>
    </header>
  );
}

/** The parts of the site a teacher can open or close for a class (classes.sections). */
export const CLASS_SECTIONS = [
  { id: "beginner", en: "Beginner Keriah" },
  { id: "teamim", en: "Te'amim trainers" },
  { id: "tanakh", en: "Torah and Tanakh reading" },
  { id: "shnayim", en: "Shnayim Mikra" },
  { id: "siddur", en: "Siddur" },
] as const;

function sectionOf(path: string): string | null {
  if (path.startsWith("/beginner/")) return "beginner";
  if (path.startsWith("/tanakh/torah/shnayim-mikra/")) return "shnayim";
  if (path.startsWith("/tanakh/torah/teamim/") || path.startsWith("/teamim/")) return "teamim";
  if (path.startsWith("/tanakh/") || path.startsWith("/practice/")) return "tanakh";
  if (path.startsWith("/siddur/")) return "siddur";
  return null;
}

/**
 * The site is for paying schools: every page needs a signed-in account whose
 * school licence is current, except the home page (which shows a welcome page
 * to visitors), the demo, and the sign-in / join pages.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const path = usePathname() ?? "/";
  const normalized = path.endsWith("/") ? path : `${path}/`;
  const { loading, session, profile, access, refresh, sections } = useAuth();
  // Signed in with a school Google account: join the school by its email domain (supabase/accounts.sql).
  const claimed = useRef(false);
  useEffect(() => {
    if (!session || claimed.current || profile?.role !== "none") return;
    claimed.current = true;
    supabase()
      .rpc("claim_school_domain")
      .then(({ data }) => {
        if (data === "student") void refresh();
      });
  }, [session, profile, refresh]);

  // Before accounts are connected, the site works as before.
  if (!supabaseConfigured)
    return (
      <>
        <SiteHeader />
        {children}
      </>
    );

  const open = OPEN_PAGES.includes(normalized) && normalized !== "/";
  const visitorView = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("visitor");
  let body: React.ReactNode;

  if (open) body = children;
  else if (loading) body = <p className="py-24 text-center text-stone-400">Loading…</p>;
  else if (!session) body = normalized === "/" ? <Landing /> : <Card title="Please sign in">{<LoginForm />}</Card>;
  // The admin can look at (and edit) the welcome page visitors see: /?visitor (AdminBar).
  else if (normalized === "/" && visitorView && profile?.role === "admin")
    body = (
      <>
        <p data-site-editor className="bg-violet-100 px-4 py-2 text-center text-sm text-violet-900">
          You are looking at the welcome page visitors see. Use ✏️ Edit this page to change it.{" "}
          <a href={asset("/")} className="font-semibold underline">
            Back to my home page
          </a>
        </p>
        <Landing />
      </>
    );
  else if (access && profile?.role === "student" && sections && sectionOf(normalized) && !sections.includes(sectionOf(normalized)!))
    body = (
      <Card title="Not open yet">
        <p className="text-stone-600">Your teacher hasn&apos;t opened this part of Keriah Trainer for your class yet.</p>
        <Link href="/" className="mt-4 block rounded-lg bg-amber-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-amber-800">
          Back to the home page
        </Link>
      </Card>
    );
  else if (access) body = children;
  else if (!profile || profile.role === "none")
    body = (
      <Card title="One more step">
        <RedeemForm intro="Learning through a school? Enter the class code from your teacher (teachers: the school code)." />
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
            Your account is fine, but your school&apos;s Keriah Trainer licence isn&apos;t active right now. Please tell
            your teacher. Your progress is saved and will be here when it&apos;s renewed.
          </p>
        </Card>
      )
    );

  return (
    <>
      <AdminBar />
      <SiteHeader />
      {body}
      <SiteEditor />
      <SitePictures />
    </>
  );
}
