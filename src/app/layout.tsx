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

export const metadata: Metadata = {
  title: "Kriah Trainer · Syrian Torah Reading",
  description: "Practise Torah reading with te'amim according to Syrian tradition.",
  applicationName: "Kriah Trainer",
  appleWebApp: { capable: true, title: "Kriah", statusBarStyle: "default" },
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
    <html lang="en" className={stam.variable}>
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
