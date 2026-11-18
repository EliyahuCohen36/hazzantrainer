"use client";

import { useAuth } from "@/lib/auth";

/** Shows its children only if the student's teacher has opened this section (everyone else: always). */
export function IfOpen({ section, children }: { section: string; children: React.ReactNode }) {
  const { profile, sections } = useAuth();
  if (profile?.role === "student" && sections && !sections.includes(section)) return null;
  return <>{children}</>;
}
