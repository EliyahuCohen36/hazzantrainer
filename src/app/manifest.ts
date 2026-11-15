export const dynamic = "force-static";

import type { MetadataRoute } from "next";

/** PWA manifest. Phase 2: add a service worker (e.g. Serwist) for offline lessons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kriah Trainer: Syrian Torah Reading",
    short_name: "Kriah",
    description: "Practise Torah reading with te'amim according to Syrian tradition.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f5",
    theme_color: "#b45309",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
