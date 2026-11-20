/**
 * A colour and a small picture for each of the 10 Beginner Keriah steps (owner's request, Nov 2026).
 * Pictures are drawn here (SVG), so they look the same everywhere and need no image files.
 */
const ALL_COLORS = [
  { card: "border-rose-200 bg-rose-50 hover:border-rose-400", label: "text-rose-700", he: "text-rose-800", main: "#e11d48", soft: "#ffe4e6" },
  { card: "border-orange-200 bg-orange-50 hover:border-orange-400", label: "text-orange-700", he: "text-orange-800", main: "#ea580c", soft: "#ffedd5" },
  { card: "border-amber-200 bg-amber-50 hover:border-amber-400", label: "text-amber-700", he: "text-amber-800", main: "#d97706", soft: "#fef3c7" },
  { card: "border-lime-200 bg-lime-50 hover:border-lime-400", label: "text-lime-700", he: "text-lime-800", main: "#65a30d", soft: "#ecfccb" },
  { card: "border-emerald-200 bg-emerald-50 hover:border-emerald-400", label: "text-emerald-700", he: "text-emerald-800", main: "#059669", soft: "#d1fae5" },
  { card: "border-teal-200 bg-teal-50 hover:border-teal-400", label: "text-teal-700", he: "text-teal-800", main: "#0d9488", soft: "#ccfbf1" },
  { card: "border-sky-200 bg-sky-50 hover:border-sky-400", label: "text-sky-700", he: "text-sky-800", main: "#0284c7", soft: "#e0f2fe" },
  { card: "border-indigo-200 bg-indigo-50 hover:border-indigo-400", label: "text-indigo-700", he: "text-indigo-800", main: "#4f46e5", soft: "#e0e7ff" },
  { card: "border-violet-200 bg-violet-50 hover:border-violet-400", label: "text-violet-700", he: "text-violet-800", main: "#7c3aed", soft: "#ede9fe" },
  { card: "border-fuchsia-200 bg-fuchsia-50 hover:border-fuchsia-400", label: "text-fuchsia-700", he: "text-fuchsia-800", main: "#c026d3", soft: "#fae8ff" },
];

/** The steps' pictures in order (the old step 4 "Letters with Nekudot" is now a tab in the Nekudot step). */
const ORDER = [0, 1, 2, 4, 5, 6, 7, 8, 9];
export const STEP_COLORS = ORDER.map((k) => ALL_COLORS[k]);

const HEB = { fontFamily: "var(--font-hebrew), 'Noto Serif Hebrew', serif" } as const;
const LAT = { fontFamily: "ui-sans-serif, system-ui, sans-serif", fontWeight: 700 } as const;

function Pic({ i }: { i: number }) {
  const { main, soft } = ALL_COLORS[i];
  switch (i) {
    case 0: // The Alef-Bet: three letter blocks
      return (
        <>
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${6 + k * 30} ${k === 1 ? 24 : 30})`}>
              <rect width="26" height="26" rx="5" fill={k === 1 ? main : soft} stroke={main} strokeWidth="2" />
              <text x="13" y="20" textAnchor="middle" fontSize="18" fill={k === 1 ? "#fff" : main} style={HEB}>
                {["ג", "ב", "א"][k]}
              </text>
            </g>
          ))}
          <path d="M14 18 l4 -6 l4 6" fill="none" stroke={main} strokeWidth="2" strokeLinecap="round" />
          <circle cx="78" cy="14" r="5" fill={main} opacity=".35" />
        </>
      );
    case 1: // Final letters: a word with its last letter highlighted
      return (
        <>
          <rect x="4" y="28" width="88" height="34" rx="8" fill={soft} />
          <text x="66" y="54" textAnchor="middle" fontSize="24" fill="#57534e" style={HEB}>
            שָׁלוֹ
          </text>
          <rect x="10" y="30" width="26" height="30" rx="6" fill={main} />
          <text x="23" y="54" textAnchor="middle" fontSize="24" fill="#fff" style={HEB}>
            ם
          </text>
          <path d="M23 24 v-12 M17 18 l6 -6 l6 6" fill="none" stroke={main} strokeWidth="2.5" strokeLinecap="round" />
        </>
      );
    case 2: // The Nekudot: a letter with coloured dots under it
      return (
        <>
          <text x="48" y="44" textAnchor="middle" fontSize="40" fill="#44403c" style={HEB}>
            ב
          </text>
          {[
            [30, 58, "#e11d48"],
            [42, 64, "#d97706"],
            [54, 58, "#059669"],
            [66, 64, "#0284c7"],
          ].map(([x, y, c], k) => (
            <circle key={k} cx={x as number} cy={y as number} r="4.5" fill={c as string} />
          ))}
          <rect x="72" y="8" width="8" height="30" rx="2" fill={main} transform="rotate(30 76 23)" />
          <path d="M84 38 l-6 7 l2 -9 z" fill="#44403c" />
        </>
      );
    case 3: // Letters with Nekudot: a chart
      return (
        <>
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <rect key={`${r}${c}`} x={10 + c * 26} y={8 + r * 22} width="22" height="18" rx="4" fill={(r + c) % 2 ? soft : main} opacity={(r + c) % 2 ? 1 : 0.85} />
            )),
          )}
          <text x="73" y="22" textAnchor="middle" fontSize="13" fill="#fff" style={HEB}>
            בָּ
          </text>
          <text x="47" y="44" textAnchor="middle" fontSize="13" fill="#fff" style={HEB}>
            בֵּ
          </text>
          <text x="21" y="66" textAnchor="middle" fontSize="13" fill="#fff" style={HEB}>
            בִּ
          </text>
        </>
      );
    case 4: // Practice words: an open book and a star
      return (
        <>
          <path d="M8 30 q20 -8 40 0 v34 q-20 -8 -40 0 z" fill={soft} stroke={main} strokeWidth="2" />
          <path d="M88 30 q-20 -8 -40 0 v34 q20 -8 40 0 z" fill={soft} stroke={main} strokeWidth="2" />
          <path d="M16 40 h24 M16 48 h20 M56 40 h24 M60 48 h20" stroke={main} strokeWidth="2" strokeLinecap="round" opacity=".6" />
          <path d="M70 4 l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 z" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
        </>
      );
    case 5: // The Sheva: two big dots, "na" and "nach"
      return (
        <>
          <circle cx="48" cy="22" r="9" fill={main} />
          <circle cx="48" cy="48" r="9" fill={main} />
          <rect x="62" y="6" width="30" height="18" rx="9" fill={soft} stroke={main} strokeWidth="1.5" />
          <text x="77" y="19" textAnchor="middle" fontSize="11" fill={main} style={LAT}>
            na
          </text>
          <rect x="2" y="44" width="36" height="18" rx="9" fill={soft} stroke={main} strokeWidth="1.5" />
          <text x="20" y="57" textAnchor="middle" fontSize="11" fill={main} style={LAT}>
            nach
          </text>
        </>
      );
    case 6: // Qamats Katan: a qamats that says "o"
      return (
        <>
          <text x="38" y="44" textAnchor="middle" fontSize="40" fill="#44403c" style={HEB}>
            כ
          </text>
          <path d="M28 54 h20 M38 54 v8" stroke={main} strokeWidth="4" strokeLinecap="round" />
          <path d="M58 10 h28 a6 6 0 0 1 6 6 v16 a6 6 0 0 1 -6 6 h-18 l-8 8 v-8 a6 6 0 0 1 -2 -4 v-18 a6 6 0 0 1 0 0 z" fill={soft} stroke={main} strokeWidth="2" />
          <text x="76" y="31" textAnchor="middle" fontSize="18" fill={main} style={LAT}>
            o
          </text>
        </>
      );
    case 7: // Patah Genuva: the patah slips in before its letter
      return (
        <>
          <text x="30" y="46" textAnchor="middle" fontSize="40" fill="#44403c" style={HEB}>
            ח
          </text>
          <rect x="20" y="54" width="20" height="4" rx="2" fill={main} opacity=".3" />
          <rect x="58" y="54" width="20" height="4" rx="2" fill={main} />
          <path d="M44 56 q6 -10 12 0" fill="none" stroke={main} strokeWidth="2" strokeDasharray="3 3" />
          <path d="M64 26 l14 0 M72 20 l6 6 l-6 6" fill="none" stroke={main} strokeWidth="2.5" strokeLinecap="round" />
          <text x="72" y="44" textAnchor="middle" fontSize="12" fill={main} style={LAT}>
            a…
          </text>
        </>
      );
    case 8: // Dagesh: a dot inside the letter, under a magnifying glass
      return (
        <>
          <text x="40" y="50" textAnchor="middle" fontSize="44" fill="#44403c" style={HEB}>
            ב
          </text>
          <circle cx="42" cy="36" r="4" fill={main} />
          <circle cx="44" cy="36" r="17" fill="none" stroke={main} strokeWidth="3" />
          <path d="M57 49 l16 16" stroke={main} strokeWidth="6" strokeLinecap="round" />
          <circle cx="44" cy="36" r="17" fill={soft} opacity=".35" />
        </>
      );
    default: // The four kinds of He
      return (
        <>
          <text x="48" y="50" textAnchor="middle" fontSize="40" fill="#44403c" style={HEB}>
            ה
          </text>
          {[
            [14, 16],
            [82, 16],
            [14, 56],
            [82, 56],
          ].map(([x, y], k) => (
            <g key={k}>
              <circle cx={x} cy={y} r="10" fill={k % 2 ? soft : main} stroke={main} strokeWidth="1.5" />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="11" fill={k % 2 ? main : "#fff"} style={k < 2 ? LAT : HEB}>
                {["?", "→", "הַ", "הּ"][k]}
              </text>
            </g>
          ))}
        </>
      );
  }
}

export function StepPicture({ i, className = "size-20" }: { i: number; className?: string }) {
  return (
    <svg viewBox="0 0 96 72" className={className} aria-hidden data-no-translate role="presentation">
      <Pic i={ORDER[i % ORDER.length]} />
    </svg>
  );
}
