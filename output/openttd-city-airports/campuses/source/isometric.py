"""Draws and writes three Hunninghall major airports (9x11, same runways and taxi pattern as the Intercontinental airport).
Run:  python make_airports.py   then in each folder:  nmlc --grf <name>.grf <name>.nml"""
import os, math, random
from PIL import Image, ImageDraw
from nml import palette as nmlpal
raw = nmlpal.raw_palette_data[0]
pal = [tuple(raw[i * 3:i * 3 + 3]) for i in range(256)]
ALLOWED = [i for i in range(1, 215) if not (198 <= i <= 205)]
_c = {}
def idx(rgb):
    if rgb not in _c: _c[rgb] = min(ALLOWED, key=lambda i: sum((pal[i][k] - rgb[k]) ** 2 for k in range(3)))
    return _c[rgb]
HMAX = 96; W, H = 64, 31 + HMAX + 1
def P(x, y, z=0): return (int(round(31 + (y - x) * 2)), int(round(HMAX + (x + y) - z)))
def sh(c, f): return tuple(max(0, min(255, int(v * f))) for v in c)
G1 = (76, 128, 58); G2 = (88, 142, 64); G3 = (66, 116, 52); PATH = (204, 188, 150); PAVE = (176, 176, 172); PAVE_D = (150, 150, 148); ASPH = (96, 98, 102)
WAT = (60, 112, 176); WAT_L = (92, 150, 206); ICE = (214, 232, 244); ICE_L = (236, 244, 250); WOODF = (198, 160, 104); WOODF_D = (176, 138, 88)
WHITE = (236, 236, 232); CONC = (186, 182, 172); RED = (196, 52, 46); BLUE = (58, 96, 178); YEL = (236, 200, 60); GLASS = (96, 160, 196); TEAL = (60, 140, 150)
SILVER = (196, 202, 210); BRICK = (156, 78, 58); DARK = (50, 54, 62); HEDGE = (40, 92, 46); SOIL = (120, 88, 60); CHALK = (240, 240, 236)
FLOWERS = [(214, 60, 70), (236, 200, 60), (220, 120, 190), (240, 240, 240), (150, 90, 200), (240, 140, 50), (90, 140, 220)]
TRUNK = (90, 62, 36); LEAF = (44, 108, 44); LEAF_L = (70, 140, 60); STEEL = (120, 124, 130)
def grass(x, y):
    h = (int(x * 2) * 73856093 ^ int(y * 2) * 19349663) % 17
    return G2 if h < 2 else G3 if h == 2 else G1
def box(x0, y0, x1, y1, z0, z1, col, se=None, sw=None): return (x0, y0, x1, y1, z0, z1, col, se or sh(col, .82), sw or sh(col, .6))
def disc(cx, cy, rx, ry, z0, z1, col, inner=None, colfn=None, se=None, sw=None, step=1.0):
    """Elliptical slab (or ring, with inner=(rx, ry)) built from thin boxes."""
    out = []; x = cx - rx
    while x < cx + rx - 1e-6:
        xm = x + step / 2; t = (xm - cx) / rx
        if abs(t) < 1:
            ho = ry * math.sqrt(1 - t * t); hi = 0
            if inner:
                ti = (xm - cx) / inner[0]
                if abs(ti) < 1: hi = inner[1] * math.sqrt(1 - ti * ti)
            segs = [(cy - ho, cy + ho)] if hi == 0 else [(cy - ho, cy - hi), (cy + hi, cy + ho)]
            for a, b in segs:
                if b - a > .2:
                    c = colfn(xm, (a + b) / 2) if colfn else col
                    out.append(box(x, a, x + step, b, z0, z1, c))
        x += step
    return out
def dome(cx, cy, r, z0, col, colfn=None, squash=1.0):
    out = []; n = int(r * squash)
    for k in range(n):
        rr = r * math.sqrt(max(0.02, 1 - (k / n) ** 2))
        out += disc(cx, cy, rr, rr, z0 + k, z0 + k + 1, sh(col, .92 + .12 * k / n), colfn=colfn)
    return out
def draw_thing(d, x, y, kind):
    bx, by = P(x, y)
    if kind == 'tree':
        d.line([(bx, by), (bx, by - 6)], fill=TRUNK); d.ellipse([bx - 5, by - 16, bx + 5, by - 4], fill=LEAF); d.ellipse([bx - 4, by - 15, bx + 1, by - 9], fill=LEAF_L)
    elif kind == 'pine':
        d.line([(bx, by), (bx, by - 3)], fill=TRUNK)
        for k in range(3): d.polygon([(bx, by - 18 + k * 4), (bx - 2 - k * 1.5, by - 10 + k * 4), (bx + 2 + k * 1.5, by - 10 + k * 4)], fill=(30, 88, 56))
    elif kind == 'cone':
        d.polygon([(bx, by - 11), (bx - 3, by), (bx + 3, by)], fill=HEDGE); d.line([(bx - 1, by - 7), (bx - 2, by - 1)], fill=sh(HEDGE, 1.4))
    elif kind == 'bench':
        d.line([(bx - 3, by - 1), (bx + 3, by + 2)], fill=(128, 88, 52)); d.line([(bx - 3, by - 3), (bx + 3, by)], fill=(96, 64, 38))
    elif kind == 'lamp':
        d.line([(bx, by), (bx, by - 14)], fill=STEEL); d.rectangle([bx - 1, by - 16, bx + 1, by - 14], fill=(250, 240, 180))
    elif kind == 'mast':
        d.line([(bx, by), (bx, by - 34)], fill=STEEL); d.line([(bx + 1, by), (bx + 1, by - 34)], fill=sh(STEEL, .7)); d.rectangle([bx - 4, by - 39, bx + 5, by - 34], fill=(250, 244, 200), outline=STEEL)
    elif kind == 'score':
        d.rectangle([bx - 12, by - 22, bx + 12, by - 12], fill=(20, 22, 26))
        for i in range(-10, 11, 3): d.point((bx + i, by - 18 + (i % 2)), fill=YEL); d.point((bx + i, by - 15), fill=(240, 120, 40))
    elif kind.startswith('skater'):
        c = [RED, BLUE, YEL, (230, 120, 190), (50, 160, 90)][int(kind[6])]
        d.line([(bx, by - 1), (bx, by - 3)], fill=DARK); d.line([(bx, by - 4), (bx, by - 6)], fill=c); d.point((bx, by - 7), fill=(236, 196, 160)); d.point((bx + 1, by - 5), fill=c)
    elif kind.startswith('car'):
        col = [RED, WHITE, BLUE, YEL][int(kind[3])]
        q = lambda pts, c: d.polygon([P(*p) for p in pts], fill=c)
        x0, y0, x1, y1 = x, y, x + 2.4, y + 4.2
        q([(x1, y0, 0), (x1, y1, 0), (x1, y1, 2), (x1, y0, 2)], sh(col, .62)); q([(x0, y1, 0), (x1, y1, 0), (x1, y1, 2), (x0, y1, 2)], sh(col, .8)); q([(x0, y0, 2), (x1, y0, 2), (x1, y1, 2), (x0, y1, 2)], col)
        q([(x0 + .3, y0 + .9, 3.4), (x1 - .3, y0 + .9, 3.4), (x1 - .3, y1 - .9, 3.4), (x0 + .3, y1 - .9, 3.4)], (120, 170, 210))
    elif kind == 'post': d.line([(bx, by), (bx, by - 5)], fill=WHITE)
    elif kind == 'rock': d.polygon([(bx - 5, by + 1), (bx - 2, by - 5), (bx + 3, by - 3), (bx + 5, by + 2)], fill=(130, 128, 122)); d.line([(bx - 2, by - 5), (bx, by + 1)], fill=(160, 158, 150))
    elif kind == 'seal': d.ellipse([bx - 2, by - 2, bx + 2, by], fill=(70, 70, 76)); d.point((bx + 2, by - 3), fill=(70, 70, 76))
    elif kind == 'flag': d.line([(bx, by), (bx, by - 18)], fill=STEEL); d.polygon([(bx + 1, by - 18), (bx + 8, by - 16), (bx + 1, by - 13)], fill=TEAL)
    elif kind == 'dish':
        d.line([(bx, by), (bx, by - 5)], fill=STEEL); d.pieslice([bx - 5, by - 12, bx + 5, by - 2], 200, 20, fill=WHITE); d.line([(bx, by - 7), (bx + 3, by - 11)], fill=STEEL)
    elif kind == 'scope': d.line([(bx - 2, by), (bx, by - 4)], fill=STEEL); d.line([(bx + 2, by), (bx, by - 4)], fill=STEEL); d.line([(bx - 3, by - 3), (bx + 3, by - 7)], fill=WHITE)
    elif kind == 'urn': d.rectangle([bx - 1, by - 4, bx + 1, by], fill=CONC); d.ellipse([bx - 2, by - 7, bx + 2, by - 4], fill=FLOWERS[0])
    elif kind == 'rose':
        d.arc([bx - 4, by - 9, bx + 4, by + 3], 180, 360, fill=HEDGE)
        for ox, oy in ((-3, -5), (0, -8), (3, -5)): d.point((bx + ox, by + oy), fill=FLOWERS[2])
    elif kind == 'jet': d.line([(bx, by), (bx, by - 7)], fill=WAT_L); d.point((bx - 1, by - 5), fill=ICE_L); d.point((bx + 1, by - 4), fill=ICE_L)
def render_tile(scene, tx, ty):
    N, ground, boxes, things = scene
    im = Image.new('RGB', (W, H), (0, 0, 255)); px = im.load()
    for r in range(31):
        hw = 2 * min(r, 30 - r) + 2
        for sx in range(32 - hw, 32 + hw):
            a, b = (sx - 31.5) / 2.0, r + .5
            px[sx, HMAX + r] = ground(tx * 16 + (b - a) / 2.0, ty * 16 + (b + a) / 2.0)
    d = ImageDraw.Draw(im); X0, Y0 = tx * 16, ty * 16; items = []
    for (x0, y0, x1, y1, z0, z1, top, se, sw) in boxes:
        a0, b0, a1, b1 = max(x0, X0), max(y0, Y0), min(x1, X0 + 16), min(y1, Y0 + 16)
        if a1 - a0 > 1e-6 and b1 - b0 > 1e-6: items.append(((a0 + a1 + b0 + b1) / 2, z0, 'b', (a0 - X0, b0 - Y0, a1 - X0, b1 - Y0, z0, z1, top, se, sw)))
    for x, y, k in things:
        if int(x // 16) == tx and int(y // 16) == ty: items.append((x + y + .01, 999, 't', (x - X0, y - Y0, k)))
    for _, _, t, it in sorted(items, key=lambda i: (i[0], i[1])):
        if t == 't': draw_thing(d, *it); continue
        x0, y0, x1, y1, z0, z1, top, se, sw = it
        d.polygon([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], fill=sw)
        d.polygon([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], fill=se)
        d.polygon([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], fill=top)
    return im
flat = []
for c in pal: flat += list(c)
def sheet_for(tiles):                       # tiles: list of images -> one row-wrapped sheet, returns (sheet, positions)
    cols = min(len(tiles), 8); rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new('P', (8 + cols * (W + 8), 8 + rows * (H + 8)), 0); sheet.putpalette(flat); pos = []
    for n, im in enumerate(tiles):
        ox, oy = 8 + (n % cols) * (W + 8), 8 + (n // cols) * (H + 8); pos.append((ox, oy)); px = im.load()
        for y in range(H):
            for x in range(W):
                if px[x, y] != (0, 0, 255): sheet.putpixel((ox + x, oy + y), idx(px[x, y]))
    return sheet, pos
def compose(tiles, N):
    pv = Image.new('RGBA', (N * 64 + 8, N * 32 + HMAX + 10), (96, 120, 84, 255))
    for ty in range(N):
        for tx in range(N):
            im = tiles[(tx, ty)].convert('RGBA'); q = im.load()
            for y in range(H):
                for x in range(W):
                    if q[x, y][:3] == (0, 0, 255): q[x, y] = (0, 0, 0, 0)
            pv.alpha_composite(im, (4 + (N - 1) * 32 + (ty - tx) * 32, 4 + (tx + ty) * 16))
    return pv.convert('RGB')

