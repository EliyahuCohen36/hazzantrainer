import type { Metadata, Viewport } from "next";
// Self-hosted fonts via Fontsource: work offline (good for a PWA) and need no network at build time.
import "@fontsource/noto-serif-hebrew/400.css";
import "@fontsource/noto-serif-hebrew/600.css";
import "@fontsource/frank-ruhl-libre/500.css";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth/AuthGate";
import { LanguageProvider } from "@/lib/i18n/Translator";

// Torah Scroll Mode: Sephardic scroll letters with tagin (crowns), like a real Sefer Torah.
const stam = localFont({
  src: "../fonts/stam-sefarad/StamSefaradCLM.ttf",
  variable: "--font-stam",
  display: "swap",
});

// The Siddur: Taamey David CLM (Culmus, GPL + font exception), a clear font made for
// nikkud and te'amim, so the Siddur has its own look.
const siddurFont = localFont({
  src: [
    { path: "../fonts/taamey-david/TaameyDavidCLM-Medium.ttf", weight: "400" },
    { path: "../fonts/taamey-david/TaameyDavidCLM-Bold.ttf", weight: "700" },
  ],
  variable: "--font-taamey",
  display: "swap",
});

// Hebrew script (handwriting) letters for Beginner Keriah: Gveret Levin (SIL Open Font License).
const scriptFont = localFont({
  src: "../fonts/gveret-levin/gveret-levin-hebrew-400-normal.woff2",
  variable: "--font-gveret",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keriah Trainer · Syrian Torah Reading",
  description: "Practice Torah reading with te'amim according to Syrian tradition.",
  applicationName: "Keriah Trainer",
  appleWebApp: { capable: true, title: "Keriah", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#b45309",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // The UI is written in English (LTR). Every Hebrew block sets dir="rtl" lang="he"
  // itself. The language buttons (Hebrew, Arabic) switch <html> to RTL and
  // translate the text (src/lib/i18n/); the layout uses logical properties.
  return (
    <html lang="en" className={`${stam.variable} ${siddurFont.variable} ${scriptFont.variable}`}>
      <body className="min-h-dvh antialiased">
        <LanguageProvider>
          <AuthProvider>
            <AuthGate>{children}</AuthGate>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
