# Haňťa's hair, past the top of his box: a fill shaped to the inked hair instead of a flat slab, and strands
# that carry on from the traced tips. Josh's marker strands only cross the box's top line by about half a unit,
# so the traced line already held nearly all of them: the extra height is drawn here, continuing his strands,
# and hanta-trace.txt stays as it was.
#   python hanta-hair.py   (from the folder holding hanta-trace.txt; prints the fill and the strands)
import math, re
import cv2, numpy as np

scale, pad = 40, 3
U = lambda v: int(round((v + pad) * scale))


def raster(d, shape):
    """The trace filled back into pixels, at the rectified boxes' scale."""
    out, polys = np.zeros(shape, np.uint8), []
    for sub in re.findall(r'M[^M]*', d):
        toks = re.findall(r'[MLCZ]|-?\d+\.?\d*', sub)
        pts, i, cur = [], 0, None
        while i < len(toks):
            if toks[i] in 'ML':
                cur = np.array([float(toks[i + 1]), float(toks[i + 2])]); pts.append(cur); i += 3
            elif toks[i] == 'C':
                c = [np.array([float(toks[i + j]), float(toks[i + j + 1])]) for j in (1, 3, 5)]
                for s in np.linspace(0, 1, 24)[1:]:
                    pts.append((1 - s) ** 3 * cur + 3 * (1 - s) ** 2 * s * c[0] + 3 * (1 - s) * s * s * c[1] + s ** 3 * c[2])
                cur = c[2]; i += 7
            else:
                i += 1
        polys.append(np.array([[(x + pad) * scale * 16, (y + pad) * scale * 16] for x, y in pts], np.int32))
    cv2.fillPoly(out, polys, 1, shift=4)
    return out


def num(v):
    s = f'{v:.1f}'.removesuffix('.0')
    if s == '-0': return '0'
    if s.startswith('0.'): return s[1:]
    if s.startswith('-0.'): return '-' + s[2:]
    return s


# The fill: the inked hair's mass with its holes filled, pulled in so it never shows past the ink, above the
# old fill's hairline. It still covers the skin's flat top wherever the ink doesn't.
ink = raster(open('hanta-trace.txt').read().strip(), (U(50), U(43)))
disk = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * int(r * scale) + 1,) * 2)
mass = cv2.morphologyEx(ink, cv2.MORPH_CLOSE, disk(.45))
cv2.floodFill(mass, None, (0, 0), 2)
mass = cv2.erode((mass != 2).astype(np.uint8), disk(.3))
hairline = [(32.2, 6.4), (28, 8.6), (25.4, 8.6), (21.5, 6.6), (19, 5.8), (15.5, 8.2), (11, 8.6), (8, 9.2), (6, 7)]
region = np.zeros_like(mass)
cv2.fillPoly(region, [np.array([[U(x), U(y)] for x, y in [(36, 6.4)] + hairline + [(4.5, 7.6), (3, 4), (3, -2.9), (37, -2.9), (37, 6.4)]], np.int32)], 1)
under = np.zeros_like(mass); under[U(4.2):, U(10.2):U(27.2)] = 1
fill = mass & region | region & under
c = max(cv2.findContours(fill, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)[0], key=cv2.contourArea)
pts = [(x / scale - pad, y / scale - pad) for x, y in cv2.approxPolyDP(c, .22 * scale, True)[:, 0]]
fill_d = 'M' + ' '.join(f'{num(x)} {num(y)}' for x, y in pts) + 'Z'
# The simplified outline cuts a corner of the hairline: put the old fill's points back, so nothing below moves.
fill_d = re.sub(r'6 7 8 9\.2 .*? 28 8\.6 ', '6 7 8 9.2 11 8.6 15.5 8.2 19 5.8 21.5 6.6 25.4 8.6 28 8.6 ', fill_d)
print('fill', fill_d.replace(' -', '-'))

# The strands: each grows from a traced tip in the direction that strand runs there, read off the trace, for a
# length in units, and bends at its end (+ is clockwise). Drawn at the marker's width, 1 unit.
tips = [
    ((6.9, .75), (-1.1, -.7), 1.3, -.25),
    ((5.6, 2.1), (-.9, -.45), 1.0, .2),
    ((9.5, -.4), (-.8, -1.0), 1.5, -.2),
    ((11.9, -.4), (-.5, -1.45), 1.0, .3),
    ((14.6, -.3), (-.7, -1.33), 2.3, .45),
    ((17.1, -.3), (.35, -1.46), .9, -.2),
    ((18.9, -.1), (1.0, -.6), 1.0, -.3),
    ((21.4, -.2), (.6, -1.3), 1.8, .35),
    ((23.3, .5), (-.35, -1.0), 1.0, -.2),
    ((25.2, -.8), (2.0, -1.8), 1.5, .3),  # the one tip the old keep box did cut
    ((26.5, -.1), (.7, -.47), 1.2, .25),
    ((33.3, 2.0), (1.0, .05), .8, -.4),
]
d = []
for (x, y), (dx, dy), L, bend in tips:
    n = math.hypot(dx, dy); dx, dy = dx / n, dy / n
    s, c, e = (x - .5 * dx, y - .5 * dy), (x + .45 * L * dx, y + .45 * L * dy), (x + L * dx - bend * dy, y + L * dy + bend * dx)
    d.append(f'M{num(s[0])} {num(s[1])}Q{num(c[0])} {num(c[1])} {num(e[0])} {num(e[1])}')
print('strands', ''.join(d).replace(' -', '-'))
