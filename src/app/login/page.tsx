"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { FeatureColumns } from "@/components/auth/Landing";
import { useAuth } from "@/lib/auth";
import { INDIVIDUAL_PERIOD, INDIVIDUAL_PRICE } from "@/data/pricing";

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);
  return (
    <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-[minmax(0,24rem)_1fr]">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
        <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <LoginForm />
        </div>
      </div>
      <section>
        <p dir="rtl" lang="he" className="font-hebrew text-lg text-amber-800">
          קְרִיאָה וְטַעֲמֵי הַמִּקְרָא · מִנְהַג אֲרַם צוֹבָא
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-stone-900">New here? Learn to read Hebrew and the Torah in the Syrian tradition</h2>
        <p className="mt-2 text-stone-600">
          One {INDIVIDUAL_PRICE}/{INDIVIDUAL_PERIOD} subscription opens everything, all in the Hazzan&apos;s own voice:
        </p>
        <FeatureColumns compact />
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/subscribe/" className="rounded-xl bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800">
            Start for {INDIVIDUAL_PRICE}/{INDIVIDUAL_PERIOD}
          </Link>
          <Link href="/demo/" className="rounded-xl border border-stone-300 bg-white px-5 py-3 font-semibold text-stone-800 hover:bg-stone-50">
            Try the free demo
          </Link>
        </div>
      </section>
    </main>
  );
}
