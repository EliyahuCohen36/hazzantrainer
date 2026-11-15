/**
 * The folder the site is served from. "" on Netlify (site at the root);
 * "/hazzantrainer" on GitHub Pages (eliyahucohen36.github.io/hazzantrainer).
 * Set at build time by NEXT_PUBLIC_BASE_PATH (see .github/workflows/pages.yml).
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a site path like "/audio/x.wav" with the base path. Next's <Link> does this by itself; raw URLs don't. */
export function asset(path: string): string {
  return path.startsWith("/") && !path.startsWith(BASE_PATH + "/") ? BASE_PATH + path : path;
}
