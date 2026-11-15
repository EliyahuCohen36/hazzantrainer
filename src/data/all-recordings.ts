import { TORAH_TEAMIM_PAIRS, TORAH_TEAMIM_RECORDINGS } from "./teamim-recordings";
import { sampleCurriculum } from "./sample-curriculum";
import { BEGINNER_RECORDING_PATHS } from "./beginner-recordings";

/** Every recording the site uses (site paths like "/audio/teamim/torah/tarha.mp3"). */
export function allRecordings(): string[] {
  const out = new Set<string>([
    ...Object.values(TORAH_TEAMIM_RECORDINGS),
    ...TORAH_TEAMIM_PAIRS.map((p) => p.src),
    ...BEGINNER_RECORDING_PATHS,
  ]);
  JSON.stringify(sampleCurriculum, (k, v) => {
    if (k === "src" && typeof v === "string" && v.startsWith("/audio/")) out.add(v);
    return v;
  });
  return [...out].sort();
}
