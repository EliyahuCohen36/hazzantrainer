"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleButton, JoinForm } from "@/components/auth/forms";
import { useAuth } from "@/lib/auth";

export default function JoinPage() {
  const { session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-stone-900">Create your account</h1>
      <p className="mt-1 text-sm text-stone-600">You need a code from your teacher or school.</p>
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <GoogleButton label="Sign up with your school Google account" />
        <p className="mt-2 text-xs text-stone-500">
          If your school is set up for it, you join your school straight away; otherwise you&apos;ll be asked for your class code.
        </p>
        <div className="my-4 flex items-center gap-3 text-xs text-stone-400">
          <span className="h-px grow bg-stone-200" />
          or with a username
          <span className="h-px grow bg-stone-200" />
        </div>
        <JoinForm />
      </div>
    </main>
  );
}
