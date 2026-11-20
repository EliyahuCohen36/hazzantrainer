"use client";

import { useEffect } from "react";
import Link from "next/link";
import { asset } from "@/lib/base-path";

/** The chart is now a tab in the Nekudot step (owner, Nov 2026). Old links land there. */
export default function ChartMoved() {
  useEffect(() => {
    location.replace(asset("/beginner/nekudot/#chart"));
  }, []);
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/beginner/nekudot/#chart" className="text-amber-800 underline">
        Letters with Nekudot →
      </Link>
    </main>
  );
}
