"""Make the shin and sin dots of Taamey David CLM clear (Keriah Trainer).

The font's dots are small and sit right on the tips of the letter's arms, so at reading size they
melt into the letter; and the dot glyphs are drawn at the letter's left edge, relying on a ccmp
ligature to move them, so a renderer that skips the ligature shows a shin dot where the sin dot goes.
Here: each dot is drawn bigger and higher, at its own place over the shin (right arm / left arm)
inside the dot glyph itself, and the precomposed shin glyphs use the dot glyph unshifted.
Usage: python3 fix_shin_dots.py <in.ttf> <out.ttf>
"""
import sys
from fontTools.ttLib import TTFont

SCALE, RAISE = 1.3, 110
# Where the font's own precomposed glyphs put each dot (component offset in shinshindot / shinsindot).
PLACE = {"shindot": (1089, -8), "sindot": (306, -2)}

tt = TTFont(sys.argv[1])
glyf, hmtx = tt["glyf"], tt["hmtx"]
for name, (dx, dy) in PLACE.items():
    g = glyf[name]
    coords, ends, flags = g.getCoordinates(glyf)
    xs = [x for x, _ in coords]; ys = [y for _, y in coords]
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    g.coordinates = type(coords)([
        (round(dx + cx + (x - cx) * SCALE), round(dy + cy + RAISE + (y - cy) * SCALE)) for x, y in coords
    ])
    g.recalcBounds(glyf)
    hmtx[name] = (hmtx[name][0], g.xMin)
for name in tt.getGlyphOrder():
    g = glyf[name]
    if g.isComposite():
        for c in g.components:
            if c.glyphName in PLACE:
                c.x, c.y = 0, 0
        g.recalcBounds(glyf)
tt.save(sys.argv[2])
print("ok")
