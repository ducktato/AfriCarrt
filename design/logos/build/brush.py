"""Tapering-ribbon vector engine for the AfriCarrt logo marks.

Every mark is built from *centerlines* (SVG path data or generated point
lists) that are inflated into solid, filled outlines with a variable width
profile -- a calligraphic brush stroke, not a hairline outline.
"""

import math
import re

# ---------------------------------------------------------------- palette
TERRA = "#C6551F"   # terracotta, primary
GREEN = "#3D7A4A"   # forest green
PINK = "#D9436B"    # hibiscus
GOLD = "#D9A028"    # gold
INK = "#2E2013"     # ink
PARCH = "#FAF3E7"   # parchment


# ------------------------------------------------------------ path parsing
_TOKEN = re.compile(r"[MLCQZmlcqz]|-?\d*\.?\d+(?:[eE]-?\d+)?")


def _segments(d):
    """Parse a restricted SVG path (M L C Q Z, absolute or relative)."""
    toks = _TOKEN.findall(d)
    i = 0
    cmd = None
    cur = (0.0, 0.0)
    start = (0.0, 0.0)
    segs = []

    def num():
        nonlocal i
        v = float(toks[i])
        i += 1
        return v

    def pt(rel):
        x = num()
        y = num()
        return (x + cur[0], y + cur[1]) if rel else (x, y)

    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd in "Zz":
                if cur != start:
                    segs.append(("L", cur, start))
                cur = start
                continue
        rel = cmd.islower()
        c = cmd.upper()
        if c == "M":
            cur = pt(rel)
            start = cur
            cmd = "l" if rel else "L"
        elif c == "L":
            p = pt(rel)
            segs.append(("L", cur, p))
            cur = p
        elif c == "C":
            a = pt(rel)
            b = pt(rel)
            p = pt(rel)
            segs.append(("C", cur, a, b, p))
            cur = p
        elif c == "Q":
            a = pt(rel)
            p = pt(rel)
            segs.append(("Q", cur, a, p))
            cur = p
        else:
            raise ValueError("unsupported command %r" % cmd)
    return segs


def _cubic(p0, p1, p2, p3, t):
    u = 1 - t
    return (
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    )


def _quad(p0, p1, p2, t):
    u = 1 - t
    return (
        u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
        u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    )


def P(d, density=3.0):
    """Sample an SVG path string into a dense point list."""
    out = []
    for seg in _segments(d):
        kind = seg[0]
        if kind == "L":
            p0, p1 = seg[1], seg[2]
            n = max(2, int(_dist(p0, p1) * density))
            pts = [_lerp(p0, p1, k / n) for k in range(n + 1)]
        elif kind == "C":
            p0, p1, p2, p3 = seg[1:]
            approx = _dist(p0, p1) + _dist(p1, p2) + _dist(p2, p3)
            n = max(8, int(approx * density))
            pts = [_cubic(p0, p1, p2, p3, k / n) for k in range(n + 1)]
        else:
            p0, p1, p2 = seg[1:]
            approx = _dist(p0, p1) + _dist(p1, p2)
            n = max(8, int(approx * density))
            pts = [_quad(p0, p1, p2, k / n) for k in range(n + 1)]
        if out and _dist(out[-1], pts[0]) < 1e-9:
            pts = pts[1:]
        out.extend(pts)
    return out


# ------------------------------------------------------------ point helpers
def _dist(a, b):
    return math.hypot(b[0] - a[0], b[1] - a[1])


def _lerp(a, b, t):
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


def spiral(cx, cy, r0, r1, a0, a1, n=160):
    """Logarithmic spiral: angles in degrees, y-down so +angle reads clockwise."""
    pts = []
    r0 = max(r0, 1e-4)
    r1 = max(r1, 1e-4)
    for k in range(n + 1):
        t = k / n
        a = math.radians(a0 + (a1 - a0) * t)
        r = r0 * (r1 / r0) ** t
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def arc(cx, cy, r, a0, a1, n=120):
    return spiral(cx, cy, r, r, a0, a1, n)


def mirror(pts, axis=50.0):
    return [(2 * axis - x, y) for x, y in pts]


def rev(pts):
    return list(reversed(pts))


def join(*chunks):
    """Concatenate point runs, dropping duplicated seam points."""
    out = []
    for c in chunks:
        c = list(c)
        if out and _dist(out[-1], c[0]) < 1e-6:
            c = c[1:]
        out.extend(c)
    return out


def resample(pts, n):
    """Uniform arc-length resampling."""
    clean = [pts[0]]
    for p in pts[1:]:
        if _dist(clean[-1], p) > 1e-9:
            clean.append(p)
    if len(clean) < 2:
        return clean * 2
    cum = [0.0]
    for i in range(1, len(clean)):
        cum.append(cum[-1] + _dist(clean[i - 1], clean[i]))
    total = cum[-1]
    out = []
    j = 0
    for k in range(n + 1):
        target = total * k / n
        while j < len(cum) - 2 and cum[j + 1] < target:
            j += 1
        span = cum[j + 1] - cum[j]
        t = 0.0 if span < 1e-12 else (target - cum[j]) / span
        out.append(_lerp(clean[j], clean[j + 1], t))
    return out


def length(pts):
    return sum(_dist(pts[i - 1], pts[i]) for i in range(1, len(pts)))


# ---------------------------------------------------------- width profiles
def taper(w0, w1, power=1.0):
    """Thick at the base, narrowing toward the tip."""
    def f(t):
        return w0 + (w1 - w0) * (t ** power)
    return f


def leaf(wmax, power=0.62, bias=0.5):
    """Zero at both ends, fattest near `bias` -- a blade or petal."""
    def f(t):
        t = min(max(t, 0.0), 1.0)
        s = (t / bias) if t < bias else ((1 - t) / (1 - bias))
        return wmax * (max(s, 0.0) ** power)
    return f


def swell(w0, wmid, w1, bias=0.5):
    def f(t):
        if t < bias:
            u = t / bias
            return w0 + (wmid - w0) * (u * u * (3 - 2 * u))
        u = (t - bias) / (1 - bias)
        return wmid + (w1 - wmid) * (u * u * (3 - 2 * u))
    return f


def keyframes(*stops):
    """(t, width) stops, smoothly interpolated."""
    stops = sorted(stops)

    def f(t):
        if t <= stops[0][0]:
            return stops[0][1]
        if t >= stops[-1][0]:
            return stops[-1][1]
        for i in range(1, len(stops)):
            if t <= stops[i][0]:
                t0, w0 = stops[i - 1]
                t1, w1 = stops[i]
                u = (t - t0) / (t1 - t0)
                return w0 + (w1 - w0) * (u * u * (3 - 2 * u))
        return stops[-1][1]
    return f


def const(w):
    return lambda t: w


# ------------------------------------------------------------- ribbon build
def _normals(pts):
    n = len(pts)
    out = []
    for i in range(n):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, n - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        m = math.hypot(dx, dy)
        if m < 1e-12:
            out.append(out[-1] if out else (0.0, 1.0))
        else:
            out.append((-dy / m, dx / m))
    return out


def _cap(center, a, b, steps=10):
    """Semicircular cap from point a to point b around `center`."""
    r = _dist(center, a)
    a0 = math.atan2(a[1] - center[1], a[0] - center[0])
    a1 = math.atan2(b[1] - center[1], b[0] - center[0])
    # take the short way that bulges outward: pick sweep of pi
    cross = (a[0] - center[0]) * (b[1] - center[1]) - (a[1] - center[1]) * (b[0] - center[0])
    delta = a1 - a0
    while delta <= -math.pi:
        delta += 2 * math.pi
    while delta > math.pi:
        delta -= 2 * math.pi
    if abs(abs(delta) - math.pi) > 1e-6:
        delta = math.pi if cross >= 0 else -math.pi
    return [
        (center[0] + r * math.cos(a0 + delta * k / steps),
         center[1] + r * math.sin(a0 + delta * k / steps))
        for k in range(1, steps)
    ]


def ribbon(pts, width, samples=None, cap_start="round", cap_end="round"):
    """Inflate a centerline into a closed outline with a variable width."""
    if callable(width):
        wf = width
    else:
        wf = const(width)
    L = length(pts)
    if samples is None:
        samples = int(min(max(L * 0.85, 22), 72))
    pts = resample(pts, samples)
    nrm = _normals(pts)
    n = len(pts)
    left, right = [], []
    for i, (p, v) in enumerate(zip(pts, nrm)):
        t = i / (n - 1)
        h = max(wf(t), 0.0) / 2.0
        left.append((p[0] + v[0] * h, p[1] + v[1] * h))
        right.append((p[0] - v[0] * h, p[1] - v[1] * h))

    outline = []
    sharp = set()
    outline.extend(left)
    # end cap
    if wf(1.0) > 0.25 and cap_end == "round":
        outline.extend(_cap(pts[-1], left[-1], right[-1]))
    else:
        sharp.add(len(outline) - 1)
        if cap_end == "flat":
            sharp.add(len(outline))
    outline.extend(reversed(right))
    if wf(0.0) > 0.25 and cap_start == "round":
        outline.extend(_cap(pts[0], right[0], left[0]))
    else:
        sharp.add(len(outline) - 1)
        if cap_start == "flat":
            sharp.add(0)
    return outline, sharp


# --------------------------------------------------- outline -> smooth path
def smooth_closed(pts, sharp=(), tension=0.42, prec=2):
    """Closed Catmull-Rom -> cubic Bezier, preserving flagged corners."""
    # drop consecutive duplicates (keeping corner flags aligned)
    keep, kept_sharp = [], set()
    for i, p in enumerate(pts):
        if keep and _dist(keep[-1], p) < 1e-7:
            if i in sharp:
                kept_sharp.add(len(keep) - 1)
            continue
        if i in sharp:
            kept_sharp.add(len(keep))
        keep.append(p)
    pts = keep
    sharp = kept_sharp
    n = len(pts)
    if n < 3:
        return ""

    def tangent(i):
        if i in sharp:
            return None
        a, b = pts[(i - 1) % n], pts[(i + 1) % n]
        return ((b[0] - a[0]) * tension, (b[1] - a[1]) * tension)

    tans = [tangent(i) for i in range(n)]
    f = "%%.%df" % prec

    def fmt(p):
        return (f % p[0]) + "," + (f % p[1])

    d = ["M" + fmt(pts[0])]
    for i in range(n):
        p0, p1 = pts[i], pts[(i + 1) % n]
        t0, t1 = tans[i], tans[(i + 1) % n]
        c1 = (p0[0] + t0[0] / 3 * 2, p0[1] + t0[1] / 3 * 2) if t0 else \
             (p0[0] + (p1[0] - p0[0]) / 3, p0[1] + (p1[1] - p0[1]) / 3)
        c2 = (p1[0] - t1[0] / 3 * 2, p1[1] - t1[1] / 3 * 2) if t1 else \
             (p1[0] - (p1[0] - p0[0]) / 3, p1[1] - (p1[1] - p0[1]) / 3)
        d.append("C" + fmt(c1) + " " + fmt(c2) + " " + fmt(p1))
    d.append("Z")
    return "".join(d)


def stroke_path(pts, width, color, samples=None, cap_start="round",
                cap_end="round", opacity=None, prec=2):
    outline, sharp = ribbon(pts, width, samples, cap_start, cap_end)
    d = smooth_closed(outline, sharp, prec=prec)
    op = ' opacity="%s"' % opacity if opacity is not None else ""
    return '<path d="%s" fill="%s"%s/>' % (d, color, op)


def region_path(pts, color, opacity=None, prec=2):
    """A plain filled closed region (used for bowl interiors / shading)."""
    f = "%%.%df" % prec
    d = smooth_closed(list(pts), set(), prec=prec)
    op = ' opacity="%s"' % opacity if opacity is not None else ""
    return '<path d="%s" fill="%s"%s/>' % (d, color, op)


# ------------------------------------------------------------- auto framing
_COORD = re.compile(r"(-?\d*\.?\d+),(-?\d*\.?\d+)")


def _bbox_of(elements):
    xs, ys = [], []
    for el in elements:
        if "<defs" in el or "clipPath" in el:
            continue
        for m in re.finditer(r'\sd="([^"]+)"', el):
            for a, b in _COORD.findall(m.group(1)):
                xs.append(float(a))
                ys.append(float(b))
    if not xs:
        return None
    return min(xs), min(ys), max(xs), max(ys)


def fit(elements, box=(9.0, 9.0, 82.0, 82.0)):
    """Uniformly scale + centre a mark's geometry into `box` (x, y, w, h)."""
    bb = _bbox_of(elements)
    if not bb:
        return elements
    x0, y0, x1, y1 = bb
    w, h = max(x1 - x0, 1e-6), max(y1 - y0, 1e-6)
    bx, by, bw, bh = box
    s = min(bw / w, bh / h)
    tx = bx + (bw - w * s) / 2 - x0 * s
    ty = by + (bh - h * s) / 2 - y0 * s
    defs = [e for e in elements if e.lstrip().startswith("<defs")]
    body = [e for e in elements if not e.lstrip().startswith("<defs")]
    return defs + ['<g transform="translate(%.3f,%.3f) scale(%.5f)">' % (tx, ty, s)] \
        + body + ["</g>"]


def clip(uid, region_pts, elements, prec=2):
    """Wrap elements in a clip path built from a closed point run."""
    d = smooth_closed(list(region_pts), set(), prec=prec)
    return ['<clipPath id="%s"><path d="%s"/></clipPath>' % (uid, d),
            '<g clip-path="url(#%s)">' % uid] + list(elements) + ["</g>"]
