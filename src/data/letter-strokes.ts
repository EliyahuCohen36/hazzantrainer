/**
 * How to write each print letter, stroke by stroke, for the drawing exercises in
 * Beginner Keriah. Coordinates are in a 100 × 100 box (x to the right, y down);
 * the letter sits between y = 18 and y = 85, final letters go down to y = 100.
 * Each stroke is drawn in the order given, from its first point to its last.
 * A one-point stroke is a dot (dagesh, the dot of Shin / Sin).
 */
export type Stroke = [number, number][];

export const LETTER_STROKES: Record<string, Stroke[]> = {
  alef: [
    [[26, 18], [74, 85]],
    [[74, 18], [72, 40], [57, 57]],
    [[44, 40], [30, 60], [27, 85]],
  ],
  bet: [[[24, 18], [72, 18], [72, 80]], [[84, 80], [18, 80]], [[46, 50]]],
  vet: [[[24, 18], [72, 18], [72, 80]], [[84, 80], [18, 80]]],
  gimel: [[[46, 18], [60, 20], [62, 85]], [[62, 60], [40, 85]]],
  dalet: [[[16, 18], [84, 18]], [[70, 18], [70, 85]]],
  he: [[[20, 18], [78, 18], [78, 85]], [[30, 42], [30, 85]]],
  vav: [[[40, 18], [55, 20], [55, 85]]],
  zayin: [[[32, 18], [72, 18]], [[52, 18], [52, 85]]],
  het: [[[24, 18], [78, 18], [78, 85]], [[26, 18], [26, 85]]],
  tet: [[[46, 42], [26, 22], [24, 70], [34, 84], [66, 84], [76, 70], [76, 18]]],
  yod: [[[40, 18], [58, 20], [55, 46]]],
  kaf: [[[24, 18], [64, 18], [76, 30], [76, 70], [64, 82], [24, 82]], [[50, 50]]],
  khaf: [[[24, 18], [64, 18], [76, 30], [76, 70], [64, 82], [24, 82]]],
  "khaf-sofit": [[[20, 18], [74, 18], [74, 100]]],
  lamed: [[[30, 2], [30, 36], [72, 36], [72, 58], [50, 85]]],
  mem: [[[20, 26], [28, 18], [28, 85]], [[40, 30], [54, 18], [78, 18], [78, 85], [28, 85]]],
  "mem-sofit": [[[22, 18], [78, 18], [78, 85], [22, 85], [22, 18]]],
  nun: [[[40, 18], [55, 20], [55, 85], [30, 85]]],
  "nun-sofit": [[[42, 18], [55, 20], [55, 100]]],
  samekh: [[[22, 18], [78, 18], [78, 62], [62, 84], [38, 84], [22, 62], [22, 18]]],
  ayin: [[[76, 18], [68, 62], [26, 85]], [[30, 18], [52, 72]]],
  pe: [[[24, 18], [76, 18], [76, 85], [24, 85]], [[24, 18], [24, 42], [42, 42]], [[56, 62]]],
  fe: [[[24, 18], [76, 18], [76, 85], [24, 85]], [[24, 18], [24, 42], [42, 42]]],
  "fe-sofit": [[[20, 18], [74, 18], [74, 100]], [[20, 18], [20, 42], [40, 42]]],
  tsadi: [[[26, 18], [68, 76]], [[76, 18], [72, 40], [56, 54]], [[82, 85], [20, 85]]],
  "tsadi-sofit": [[[28, 18], [52, 56], [52, 100]], [[76, 18], [72, 40], [52, 56]]],
  qof: [[[22, 18], [78, 18], [78, 85]], [[30, 42], [30, 100]]],
  resh: [[[20, 18], [66, 18], [76, 28], [76, 85]]],
  shin: [[[78, 18], [76, 85], [24, 85], [22, 18]], [[50, 30], [48, 85]], [[82, 6]]],
  sin: [[[78, 18], [76, 85], [24, 85], [22, 18]], [[50, 30], [48, 85]], [[18, 6]]],
  tav: [[[20, 18], [76, 18], [76, 85]], [[32, 18], [32, 80], [20, 85]]],
};

/** Points every ~2 units along the strokes (dots stay one point). */
export function samplePath(strokes: Stroke[], step = 2): [number, number][] {
  const out: [number, number][] = [];
  for (const s of strokes) {
    if (s.length === 1) {
      out.push(s[0]);
      continue;
    }
    for (let i = 0; i < s.length - 1; i++) {
      const [x1, y1] = s[i];
      const [x2, y2] = s[i + 1];
      const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
      for (let k = 0; k <= n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
    }
  }
  return out;
}

/**
 * How well a drawing follows the letter: coverage = how much of the letter was drawn over,
 * accuracy = how much of the drawing stays on the letter. Both 0–1.
 */
export function checkDrawing(strokes: Stroke[], ink: [number, number][][], tol = 6, fit = false) {
  const guide = samplePath(strokes);
  let pts = ink.flatMap((s) => samplePath([s], 2));
  // Drawn freely (no letter underneath): move and size the drawing onto the letter's box first.
  if (fit && pts.length) {
    const box = (list: [number, number][]) => {
      const xs = list.map((p) => p[0]);
      const ys = list.map((p) => p[1]);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    const [gx1, gy1, gx2, gy2] = box(guide);
    const [ix1, iy1, ix2, iy2] = box(pts);
    // One size for both directions (so a thin letter can't be stretched into a wide one), centred.
    const k = Math.max(gx2 - gx1, gy2 - gy1) / Math.max(1, ix2 - ix1, iy2 - iy1);
    const [gcx, gcy, icx, icy] = [(gx1 + gx2) / 2, (gy1 + gy2) / 2, (ix1 + ix2) / 2, (iy1 + iy2) / 2];
    pts = pts.map(([x, y]) => [gcx + (x - icx) * k, gcy + (y - icy) * k]);
  }
  if (pts.length < 5) return { coverage: 0, accuracy: 0 };
  const near = (a: [number, number], list: [number, number][]) => list.some((b) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= tol);
  const coverage = guide.filter((g) => near(g, pts)).length / guide.length;
  const accuracy = pts.filter((p) => near(p, guide)).length / pts.length;
  // Every stroke must be there (a missing tongue, foot or dot is a different letter).
  const each = Math.min(
    ...strokes.map((st) => {
      const g = samplePath([st]);
      return g.filter((q) => near(q, pts)).length / g.length;
    }),
  );
  return { coverage: Math.min(coverage, each + 0.15), accuracy };
}

export const DRAW_PASS = { coverage: 0.85, accuracy: 0.85 };
