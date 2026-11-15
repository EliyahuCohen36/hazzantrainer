import type { Metadata, Viewport } from "next";
// Self-hosted fonts via Fontsource: work offline (good for a PWA) and need no network at build time.
import "@fontsource/noto-serif-hebrew/400.css";
import "@fontsource/noto-serif-hebrew/600.css";
import "@fontsource/frank-ruhl-libre/500.css";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth/AuthGate";

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
  // The UI chrome is English (LTR). Every Hebrew block sets dir="rtl" lang="he"
  // itself. For a Hebrew interface, set lang="he" dir="rtl" here; the layout
  // uses logical properties (ms-/me-/ps-/border-s) so it mirrors correctly.
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
