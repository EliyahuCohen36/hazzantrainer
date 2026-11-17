/**
 * Targum Onkelos ("vocalized according to the Yemenite Taj"), from Hebrew
 * Wikisource (CC BY-SA 4.0), via Sefaria's export. Server only (large).
 * Built by scripts/onkelos/build.py. Keys are "chapter:verse".
 */
import bereshit from "./bereshit.json";
import shemot from "./shemot.json";
import vayikra from "./vayikra.json";
import bamidbar from "./bamidbar.json";
import devarim from "./devarim.json";

export const ONKELOS: Record<string, Record<string, string>> = { bereshit, shemot, vayikra, bamidbar, devarim };
