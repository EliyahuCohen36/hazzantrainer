import { TORAH_TEAMIM_RECORDINGS } from "./teamim-recordings";

/**
 * The free demo: these te'amim (cards, recordings and Practice) are open to
 * everyone at /demo/, so principals and parents can try the trainer before
 * a school signs up. Their recordings stay in public/; everything else needs
 * a login.
 */
export const DEMO_TEAMIM = ["sof-pasuk", "atnah", "tarha"];

export const DEMO_FILES = new Set(DEMO_TEAMIM.map((id) => TORAH_TEAMIM_RECORDINGS[id]).filter(Boolean));

/** Pages anyone can open without signing in (paths without the base path, with trailing slash). */
export const OPEN_PAGES = ["/", "/login/", "/join/", "/demo/", "/about/", "/subscribe/"];

/** Where "Bring it to your school" sends schools. Empty = the button is hidden. */
export const CONTACT_EMAIL = "";
