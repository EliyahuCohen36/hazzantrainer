"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/forms";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (session) router.replace("/");
  }, [session, router]);
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-semibold text-stone-900">Sign in</h1>
      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
