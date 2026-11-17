import type { Metadata } from "next";
import { AboutContent } from "@/components/about/AboutContent";

export const metadata: Metadata = { title: "About · Kriah Trainer" };

/** How the project started, what makes it different, and thanks. Open to everyone, in English, Hebrew and Arabic. */
export default function AboutPage() {
  return <AboutContent />;
}
