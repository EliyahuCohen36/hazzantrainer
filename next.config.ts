import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `npm run build` writes a plain static website to the `out/` folder.
  // Upload that folder to any static host (Netlify, Cloudflare Pages,
  // GitHub Pages…) to open the trainer from any browser or phone.
  output: "export",
  // Each page becomes folder/index.html, which every static host serves.
  trailingSlash: true,
  // On GitHub Pages the site lives in a folder (/hazzantrainer).
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
};

export default nextConfig;
