"use client";

import { useEffect } from "react";
import { asset } from "@/lib/base-path";

/** Offline use for the app saved to the home screen (public/sw.js). Not on the local dev server. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register(asset("/sw.js"), { scope: asset("/") }).catch(() => {});
  }, []);
  return null;
}
