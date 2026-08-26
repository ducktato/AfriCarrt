"""The 42 AfriCarrt logo marks, drawn as tapering brush ribbons.

Each mark is authored inside a 0..100 square (y down) and returns a list of
SVG element strings. `uid` namespaces any gradient ids.
"""

import math
from brush import (
    TERRA, GREEN, PINK, GOLD, INK, PARCH,
    P, spiral, arc, mirror, rev, join, resample,
    taper, leaf, swell, keyframes, const,
    stroke_path, region_path, clip, fit,
)

S = stroke_path
R = region_path

MARKS = {}


def mark(n):
    def deco(fn):
        MARKS[n] = fn
        return fn
    return deco


# --------------------------------------------------------------- primitives
def drop_center(apex=(51.0, 9.0), half=22.0, bottom=87.0, shoulder=0.62):
    """Centerline of a teardrop: sharp apex on top, round bulb below.

    Runs clockwise from the apex so a `leaf` width profile is thinnest at the
    point and fattest around the bottom of the bulb.
    """
    ax, ay = apex
    cy = bottom - half            # centre of the bulb
    k = half * 0.552
    return P(
        "M%g,%g "
        "C%g,%g %g,%g %g,%g "
        "C%g,%g %g,%g %g,%g "
        "C%g,%g %g,%g %g,%g "
        "C%g,%g %g,%g %g,%g" % (
            ax, ay,
            ax + half * 0.30, ay + (cy - ay) * shoulder * 0.55,
            ax + half * 0.95, cy - half * 0.72, ax + half, cy,
            ax + half, cy + k, ax + k, cy + half, ax, cy + half,
            ax - k, cy + half, ax - half, cy + k, ax - half, cy,
            ax - half * 0.95, cy - half * 0.72,
            ax - half * 0.30, ay + (cy - ay) * shoulder * 0.55, ax, ay,
        )
    )


def blade(d, wmax, color, bias=0.42, power=0.6, **kw):
    """A pointed-at-both-ends leaf blade along a centerline."""
    return S(P(d), leaf(wmax, power=power, bias=bias), color, **kw)


def soup_bowl(uid, rim_cy, rim_rx, rim_ry, wall, base_color, swirl_color,
              swirl_r0, swirl_r1, swirl_a0, swirl_a1, wall_w=8.0, cyl=False,
              soup_color=None):
    """A bowl whose swirl is clipped inside the rim so it reads as depth."""
    rim = spiral(50, rim_cy, 1, 1, 0, 360)
    rim = [(50 + rim_rx * (x - 50), rim_cy + rim_ry * (y - rim_cy)) for x, y in rim]
    out = ['<defs>'
           '<linearGradient id="%s-soup" x1="0" y1="0" x2="0" y2="1">'
           '<stop offset="0" stop-color="%s" stop-opacity="0.62"/>'
           '<stop offset="0.55" stop-color="%s" stop-opacity="0.26"/>'
           '<stop offset="1" stop-color="%s" stop-opacity="0.10"/>'
           '</linearGradient>'
           '<linearGradient id="%s-wall" x1="0" y1="0" x2="1" y2="0">'
           '<stop offset="0" stop-color="%s"/>'
           '<stop offset="0.5" stop-color="%s"/>'
           '<stop offset="1" stop-color="%s"/>'
           '</linearGradient>'
           '</defs>' % (uid, soup_color or base_color, soup_color or base_color,
                        soup_color or base_color,
                        uid, base_color, base_color, base_color)]
    out.append(R(rim, "url(#%s-soup)" % uid))
    inner = []
    # shadow crescent under the far rim
    shadow = [(50 + rim_rx * math.cos(math.radians(a)),
               rim_cy + rim_ry * math.sin(math.radians(a)))
              for a in range(186, 355, 3)]
    inner.append(S(shadow, keyframes((0, 2.0), (0.5, rim_ry * 0.85), (1, 2.0)),
                   INK, opacity=0.13))
    swirl = spiral(50, rim_cy - rim_ry * 0.06, swirl_r0, swirl_r1,
                   swirl_a0, swirl_a1, 200)
    swirl = [(x, rim_cy + (y - rim_cy) * (rim_ry / rim_rx) ** 0.55) for x, y in swirl]
    inner.append(S(swirl, keyframes((0, wall * 1.10), (0.55, wall * 0.82), (1, wall * 0.22)),
                   swirl_color))
    out += clip(uid + "-c", rim, inner)
    # bowl body
    lx, rx_ = 50 - rim_rx, 50 + rim_rx
    if cyl:
        depth = rim_ry * 3.35
        body = P("M%g,%g C%g,%g %g,%g %g,%g C%g,%g %g,%g %g,%g" % (
            lx, rim_cy, lx - rim_rx * 0.02, rim_cy + depth * 0.80,
            lx + rim_rx * 0.17, rim_cy + depth, 50, rim_cy + depth,
            rx_ - rim_rx * 0.17, rim_cy + depth,
            rx_ + rim_rx * 0.02, rim_cy + depth * 0.80, rx_, rim_cy))
    else:
        depth = rim_rx * 1.30
        body = P("M%g,%g C%g,%g %g,%g %g,%g C%g,%g %g,%g %g,%g" % (
            lx, rim_cy, lx, rim_cy + depth * 0.66, lx + rim_rx * 0.44, rim_cy + depth,
            50, rim_cy + depth,
            rx_ - rim_rx * 0.44, rim_cy + depth, rx_, rim_cy + depth * 0.66,
            rx_, rim_cy))
    out.append(S(body, keyframes((0, wall_w * 0.55), (0.5, wall_w), (1, wall_w * 0.55)),
                 base_color))
    # rim lip, drawn last so it sits over the soup edge
    lip = spiral(50, rim_cy, 1, 1, -10, 372, 240)
    lip = [(50 + rim_rx * (x - 50), rim_cy + rim_ry * (y - rim_cy)) for x, y in lip]
    out.append(S(lip, const(wall_w * 0.68), base_color))
    return out


def wobble_ring(cx, cy, r, a0, a1, amp=0.035, n=260, phase=0.7):
    pts = []
    for k in range(n + 1):
        t = k / n
        a = math.radians(a0 + (a1 - a0) * t)
        rr = r * (1 + amp * math.sin(3 * a + phase) + amp * 0.55 * math.cos(5 * a - 1.1))
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    return pts


# ==================================================================== 1 - 12
@mark(1)
def m1(uid):
    """Round fruit, three-lobed calyx."""
    out = []
    out.append(S(wobble_ring(50, 56, 33.0, -66, 292),
                 keyframes((0, 2.0), (0.1, 8.4), (0.88, 8.0), (1, 2.4)), TERRA))
    out.append(blade("M50,34 C44,31 37,28 30,23", 8.4, GREEN, bias=0.5))
    out.append(blade("M50,34 C57,30 65,27 73,26", 8.0, GREEN, bias=0.5))
    out.append(blade("M50,34 C52,42 52,49 49,56", 7.6, GREEN, bias=0.48))
    out.append(S(P("M50,33 C45,35 42,38 41,42"), taper(3.4, 0.5, 0.9), GREEN))
    return out


@mark(2)
def m2(uid):
    """Droplet holding a slack open coil."""
    out = [S(drop_center((52, 6), 26, 94), leaf(8.0, power=0.55, bias=0.52), TERRA)]
    lead = P("M52,14 C48,24 43,30 38,34 C32,39 34,46 39,44 C43,42 43,37 40,34 "
             "C37,37 34,41 32,46")
    coil = spiral(47, 65, 22.0, 14.5, 242, -95, 240)
    out.append(S(join(lead, coil),
                 keyframes((0, 0.9), (0.2, 3.0), (0.45, 6.2), (0.9, 5.0), (1, 1.6)), GREEN))
    return out


@mark(3)
def m3(uid):
    """Droplet with a tight inward roll."""
    out = [S(drop_center((58, 5), 26, 94, shoulder=0.72), leaf(8.4, power=0.55, bias=0.53), TERRA)]
    lead = P("M56,13 C50,25 44,32 39,37 C34,42 37,47 41,45 C44,43 44,39 42,36 "
             "C39,39 36,43 34,47")
    coil = spiral(48, 64, 22.0, 4.2, 235, 585, 230)
    out.append(S(join(lead, coil),
                 keyframes((0, 0.9), (0.2, 3.2), (0.42, 6.6), (0.8, 4.0), (1, 1.1)), GOLD))
    return out


@mark(4)
def m4(uid):
    """Droplet cradling a rolling wave."""
    out = [S(drop_center((62, 5), 26, 94, shoulder=0.74), leaf(8.2, power=0.55, bias=0.52), TERRA)]
    wave = P(
        "M36,47 C29,54 27,68 35,75 C44,82 54,76 54,66 C54,57 60,52 67,56 "
        "C74,60 75,72 68,80"
    )
    out.append(S(wave, keyframes((0, 1.5), (0.28, 6.0), (0.68, 6.2), (1, 1.6)), PINK))
    return out


@mark(5)
def m5(uid):
    """Soup settling into a deep bowl."""
    return soup_bowl(uid, rim_cy=30, rim_rx=32, rim_ry=7.5, wall=9.5,
                     base_color=TERRA, swirl_color=GOLD,
                     swirl_r0=26.0, swirl_r1=4.5, swirl_a0=178, swirl_a1=520,
                     wall_w=9.0)


@mark(6)
def m6(uid):
    """Twin flames, each rolling a hook into its own belly."""
    out = []
    big = P("M54,1 C60,18 74,33 80,52 C86,71 79,99 61,100 C45,101 32,94 33,79 "
            "C34,66 41,61 45,53 C48,36 52,17 54,1")
    out.append(S(big, leaf(7.6, power=0.5, bias=0.52), TERRA))
    hook = P("M39,89 C44,74 53,62 61,64 C67,66 67,73 65,78")
    out.append(S(hook, keyframes((0, 1.6), (0.4, 6.2), (0.78, 4.4), (1, 1.0)), TERRA))
    small_edge = P("M45,55 C41,46 37,37 33,30")
    out.append(S(small_edge, taper(3.6, 0.9, 0.9), GOLD))
    small = P("M33,30 C28,41 14,52 9,66 C4,81 6,95 16,98 C25,101 31,94 29,87 "
              "C27,82 21,84 21,89")
    out.append(S(small, keyframes((0, 0.9), (0.34, 5.4), (0.66, 5.6), (0.9, 2.6), (1, 0.9)), GOLD))
    return out


@mark(7)
def m7(uid):
    """Droplet with a doubled inner curl, heavy at the foot."""
    out = [S(drop_center((56, 5), 25, 94, shoulder=0.68), leaf(7.6, power=0.55, bias=0.56), TERRA)]
    eye = P("M55,13 C49,25 43,32 38,37 C33,42 36,47 40,45 C43,43 43,39 41,36")
    out.append(S(eye, keyframes((0, 0.9), (0.5, 3.0), (1, 1.4)), PINK))
    curl = P("M42,40 C34,45 29,54 31,64 C33,75 43,81 53,78 C62,75 66,66 62,58")
    out.append(S(curl, keyframes((0, 1.8), (0.42, 6.6), (0.85, 5.0), (1, 1.6)), PINK))
    return out


@mark(8)
def m8(uid):
    """The most alive line on the sheet: a swung A locked into a C."""
    out = []
    stem = P("M42,4 C36,23 27,45 20,60 C15,70 12,78 15,83 C18,88 26,87 29,81 "
             "C31,76 28,72 24,73")
    out.append(S(stem, keyframes((0, 0.7), (0.26, 6.4), (0.58, 7.6), (0.84, 3.4), (1, 1.0)), INK))
    leg = P("M42,4 C47,17 51,29 54,38 C56,45 57,51 55,57")
    out.append(S(leg, keyframes((0, 0.7), (0.3, 5.2), (0.7, 4.6), (1, 1.2)), INK))
    bar = P("M26,49 C32,45 41,41 48,39")
    out.append(S(bar, keyframes((0, 1.2), (0.45, 4.0), (1, 1.2)), INK))
    c_arc = P("M92,25 C85,17 73,15 65,22 C56,30 54,44 58,57 C62,70 73,79 85,77 "
              "C93,75 97,69 95,62 C93,56 87,54 83,58")
    out.append(S(c_arc, keyframes((0, 1.1), (0.14, 5.6), (0.48, 9.4), (0.8, 4.6), (1, 1.1)), TERRA))
    return out


@mark(9)
def m9(uid):
    """Sprout: two curled tendrils over a swept stem."""
    out = []
    right = P("M52,56 C52,36 59,18 73,15 C85,12 94,22 91,34 C88,44 78,48 72,42 "
              "C67,37 70,30 76,31")
    out.append(S(right, keyframes((0, 6.4), (0.34, 5.4), (0.7, 3.2), (1, 0.9)), GREEN))
    left = P("M51,54 C47,42 40,32 30,31 C21,30 15,38 19,46 C22,53 31,55 35,50 "
             "C38,46 37,41 32,40")
    out.append(S(left, keyframes((0, 4.8), (0.4, 4.0), (0.76, 2.4), (1, 0.8)), GREEN))
    out.append(S(P("M52,44 C53,56 58,67 67,75 C74,81 81,84 89,85"),
                 keyframes((0, 5.6), (0.4, 4.4), (1, 1.0)), TERRA))
    out.append(S(P("M51,42 C49,54 47,64 45,74"),
                 keyframes((0, 5.2), (0.5, 3.6), (1, 1.2)), TERRA))
    return out


@mark(10)
def m10(uid):
    """Sprout with one broad rolled leaf."""
    out = []
    roll = P("M51,56 C51,32 59,14 75,12 C89,10 97,23 92,36 C87,47 73,50 67,41 "
             "C62,34 68,26 75,28")
    out.append(S(roll, keyframes((0, 6.6), (0.3, 5.6), (0.68, 3.4), (1, 1.0)), TERRA))
    small = P("M50,53 C45,41 38,33 29,33 C21,33 16,41 21,48 C25,54 33,54 36,49")
    out.append(S(small, keyframes((0, 4.6), (0.45, 3.6), (1, 0.9)), GREEN))
    out.append(S(P("M51,38 C50,54 49,70 50,86"),
                 keyframes((0, 3.0), (0.4, 6.8), (1, 4.2)), TERRA))
    return out


@mark(11)
def m11(uid):
    """Sprout with an open hooked leaf."""
    out = []
    hook = P("M53,52 C53,30 60,14 74,13 C86,12 93,22 90,32 C87,42 77,47 70,42 "
             "C65,38 66,31 72,31")
    out.append(S(hook, keyframes((0, 5.8), (0.32, 5.0), (0.7, 3.0), (1, 0.9)), GOLD))
    left = P("M52,50 C47,40 40,32 31,32 C23,32 18,40 23,47 C27,53 35,53 38,48")
    out.append(S(left, keyframes((0, 4.4), (0.45, 3.4), (1, 0.9)), GREEN))
    out.append(S(P("M53,33 C53,50 55,66 58,86"),
                 keyframes((0, 2.6), (0.45, 6.2), (1, 3.4)), GOLD))
    return out


@mark(12)
def m12(uid):
    """Wide bowl seen over the rim, soup turning inside it."""
    return soup_bowl(uid, rim_cy=34, rim_rx=46, rim_ry=15.0, wall=12.0,
                     base_color=TERRA, swirl_color=GOLD,
                     swirl_r0=36.0, swirl_r1=6.0, swirl_a0=176, swirl_a1=520,
                     wall_w=10.5, cyl=True)


# =================================================================== 13 - 23
@mark(13)
def m13(uid):
    """Droplet with a coil that runs out into a long leaf tail."""
    out = [S(drop_center((60, 5), 25, 84, shoulder=0.74), leaf(7.8, power=0.55, bias=0.52), GREEN)]
    lead = P("M58,12 C51,26 42,37 35,45")
    coil = spiral(45, 57, 16.5, 4.6, 213, 500, 210)
    out.append(S(join(lead, coil), keyframes((0, 1.0), (0.28, 5.4), (0.72, 4.2), (1, 1.1)), GOLD))
    tail = P("M28,60 C25,73 33,85 48,89 C63,93 78,88 90,78")
    out.append(S(tail, keyframes((0, 1.6), (0.4, 6.2), (0.82, 3.6), (1, 0.7)), GOLD))
    return out


@mark(14)
def m14(uid):
    """Wide flat pot, soup turning in the mouth of it."""
    return soup_bowl(uid, rim_cy=34, rim_rx=46, rim_ry=13.5, wall=12.0,
                     base_color=INK, swirl_color=GOLD,
                     swirl_r0=36.0, swirl_r1=6.0, swirl_a0=172, swirl_a1=515,
                     wall_w=10.0, cyl=True, soup_color=TERRA)


@mark(15)
def m15(uid):
    """Droplet carrying two stacked rolls."""
    out = [S(drop_center((56, 4), 25, 92, shoulder=0.7), leaf(7.6, power=0.55, bias=0.53), TERRA)]
    upper = join(P("M55,11 C50,21 45,28 41,33"), spiral(37, 40, 9.5, 3.0, 208, 480, 170))
    out.append(S(upper, keyframes((0, 0.9), (0.34, 4.4), (0.75, 3.4), (1, 1.0)), PINK))
    lower = join(P("M30,48 C28,55 30,62 34,66"), spiral(48, 70, 18.5, 4.4, 200, 520, 210))
    out.append(S(lower, keyframes((0, 1.6), (0.3, 5.8), (0.75, 4.4), (1, 1.1)), PINK))
    return out


@mark(16)
def m16(uid):
    """Fiddlehead over two opening cotyledons."""
    out = []
    head = join(P("M50,64 C51,48 54,32 62,24"), spiral(52, 27, 22.0, 4.5, -18, 292, 220))
    out.append(S(head, keyframes((0, 5.4), (0.3, 5.0), (0.72, 3.2), (1, 0.9)), GREEN))
    right = P("M51,66 C58,58 68,54 76,57 C83,60 83,69 76,70 C70,71 67,66 70,62")
    out.append(S(right, keyframes((0, 3.6), (0.4, 3.2), (0.78, 2.2), (1, 0.7)), GOLD))
    left = P("M49,66 C42,58 32,54 24,57 C17,60 17,69 24,70 C30,71 33,66 30,62")
    out.append(S(left, keyframes((0, 3.6), (0.4, 3.2), (0.78, 2.2), (1, 0.7)), GOLD))
    out.append(S(P("M50,58 C50,68 50,78 50,88"), taper(5.0, 1.0, 1.3), GREEN))
    return out


@mark(17)
def m17(uid):
    """Tall droplet with a fold rolled into its left flank."""
    out = []
    body = P("M55,2 C61,22 72,44 73,62 C74,80 65,96 50,97 C35,98 25,89 24,77 "
             "C23,68 27,62 33,59 C39,56 38,50 32,51 C29,52 27,54 27,57 "
             "C29,41 45,18 55,2")
    out.append(S(body, leaf(8.8, power=0.46, bias=0.55), TERRA))
    out.append(blade("M34,62 C38,69 40,76 39,83", 5.4, GOLD, bias=0.4))
    return out


@mark(18)
def m18(uid):
    """Peaked droplet whose shoulders tuck into two folded wings."""
    out = []
    body = P("M50,3 C56,20 66,34 74,44 C82,55 85,68 79,79 C72,91 58,96 50,96 "
             "C42,96 28,91 21,79 C15,68 18,55 26,44 C34,34 44,20 50,3")
    out.append(S(body, leaf(7.4, power=0.5, bias=0.5), TERRA))
    out.append(S(P("M74,44 C81,39 89,42 89,50"), taper(4.0, 2.4, 0.9), GREEN))
    out.append(blade("M89,49 C86,58 80,66 73,73", 7.0, GREEN, bias=0.4))
    out.append(S(P("M26,44 C19,39 11,42 11,50"), taper(4.0, 2.4, 0.9), GREEN))
    out.append(blade("M11,49 C14,58 20,66 27,73", 7.0, GREEN, bias=0.4))
    return out


@mark(19)
def m19(uid):
    """Leaning peak over a full bowl, with two flared leaf tips."""
    out = []
    body = P("M43,3 C50,20 62,34 70,44 C80,56 82,72 72,84 C62,95 44,97 32,89 "
             "C20,81 16,64 23,50 C29,38 37,20 43,3")
    out.append(S(body, leaf(7.2, power=0.5, bias=0.5), GOLD))
    out.append(S(P("M70,44 C79,40 89,43 91,50"), taper(4.0, 2.2, 0.9), TERRA))
    out.append(blade("M91,50 C87,57 81,62 74,65", 6.4, TERRA, bias=0.4))
    out.append(S(P("M25,47 C18,44 10,48 10,55"), taper(3.6, 2.0, 0.9), TERRA))
    out.append(blade("M10,54 C13,62 18,69 25,75", 6.4, TERRA, bias=0.4))
    return out


@mark(20)
def m20(uid):
    """Basket with a looping shoot and a trailing leaf."""
    out = []
    bowl = P("M5,44 C-1,62 6,83 25,92 C42,100 64,97 74,84 C81,74 82,59 79,46")
    out.append(S(bowl, keyframes((0, 5.2), (0.14, 7.4), (0.86, 7.4), (1, 5.2)), TERRA))
    # rim hooks turning down into the basket
    out.append(S(P("M5,44 C10,50 17,55 19,64"), taper(5.2, 1.0, 1.0), TERRA))
    out.append(S(P("M79,46 C74,52 67,57 66,66"), taper(5.2, 1.0, 1.0), TERRA))
    shoot = P("M30,82 C23,86 26,93 34,90 C45,86 51,72 51,58 C51,45 45,32 43,22 "
              "C41,12 50,8 54,17 C57,25 54,35 51,42")
    out.append(S(shoot, keyframes((0, 0.9), (0.16, 4.4), (0.5, 4.8), (0.86, 3.0), (1, 1.0)), GREEN))
    tail = P("M51,42 C62,47 74,52 82,60 C87,65 89,71 87,78")
    out.append(S(tail, keyframes((0, 3.2), (0.5, 4.6), (0.86, 3.0), (1, 0.9)), GREEN))
    return out


@mark(21)
def m21(uid):
    """One mark, not two letters: the A and the roll share a body."""
    out = []
    ring = spiral(41, 66, 28.0, 28.0, -156, 216, 250)
    out.append(S(ring, const(7.3), TERRA))
    out.append(S(P("M45,2 C39,17 28,36 19,50"), taper(1.0, 7.0, 0.85), TERRA))
    out.append(S(P("M45,2 C51,18 61,38 73,60 C81,75 89,88 96,98"),
                 keyframes((0, 1.2), (0.42, 6.4), (0.84, 7.0), (1, 2.4)), TERRA))
    roll = spiral(45, 68, 21.5, 4.0, -76, 262, 230)
    out.append(S(roll, keyframes((0, 3.0), (0.2, 9.6), (0.72, 10.2), (1, 4.8)), GOLD))
    return out


@mark(22)
def m22(uid):
    """Droplet with an inner hook and a leaf running out to the left."""
    out = [S(drop_center((56, 4), 25, 90, shoulder=0.72), leaf(7.6, power=0.55, bias=0.53), GREEN)]
    hook = join(P("M55,11 C50,22 45,30 41,36"), spiral(48, 49, 13.5, 4.6, 196, 470, 190))
    out.append(S(hook, keyframes((0, 1.0), (0.32, 5.0), (0.76, 3.8), (1, 1.1)), TERRA))
    tail = P("M60,60 C54,70 42,78 30,80 C22,81 15,79 10,74")
    out.append(S(tail, keyframes((0, 1.6), (0.38, 6.0), (0.82, 3.4), (1, 0.7)), TERRA))
    return out


@mark(23)
def m23(uid):
    """Crown: a peak between two rolls, carried on a full bowl."""
    out = []
    bowl = P("M8,44 C2,62 10,82 28,92 C43,100 57,100 72,92 C90,82 98,62 92,44")
    out.append(S(bowl, keyframes((0, 3.0), (0.1, 9.4), (0.9, 9.4), (1, 3.0)), TERRA))
    peak_r = join(P("M50,2 C55,16 60,27 65,35"), spiral(75, 42, 12.5, 3.2, 205, 545, 200))
    out.append(S(peak_r, keyframes((0, 1.0), (0.3, 6.0), (0.74, 4.6), (1, 1.2)), TERRA))
    peak_l = join(P("M50,2 C45,16 40,27 35,35"), spiral(25, 42, 12.5, 3.2, -25, -365, 200))
    out.append(S(peak_l, keyframes((0, 1.0), (0.3, 6.0), (0.74, 4.6), (1, 1.2)), TERRA))
    return out


# =================================================================== 24 - 33
@mark(24)
def m24(uid):
    """Bud on a stem, opening into two ground curls."""
    out = []
    head = join(P("M46,68 C46,58 48,50 51,45"), spiral(52, 28, 18.0, 5.5, 100, 432, 220))
    out.append(S(head, keyframes((0, 5.6), (0.3, 5.2), (0.74, 3.2), (1, 0.9)), GREEN))
    out.append(S(P("M44,62 C46,70 54,79 63,79 C71,79 74,70 67,67 C62,65 59,70 62,74"),
                 keyframes((0, 4.6), (0.4, 4.0), (0.8, 2.4), (1, 0.7)), GOLD))
    out.append(S(P("M44,62 C42,70 34,79 25,79 C17,79 14,70 21,67 C26,65 29,70 26,74"),
                 keyframes((0, 4.6), (0.4, 4.0), (0.8, 2.4), (1, 0.7)), GOLD))
    return out


@mark(25)
def m25(uid):
    """Tendril crossing itself: a head, a knot and a runner."""
    out = []
    head = spiral(54, 26, 23.0, 7.0, 128, 452, 230)
    out.append(S(head, keyframes((0, 5.8), (0.32, 5.2), (0.76, 3.0), (1, 0.9)), GREEN))
    body = join(P("M38,43 C48,53 60,58 68,63"), spiral(72, 74, 12.5, 12.5, -62, 268, 180))
    out.append(S(body, keyframes((0, 4.4), (0.45, 5.0), (0.9, 3.6), (1, 1.4)), GREEN))
    out.append(S(P("M66,84 C58,91 47,96 36,97"),
                 keyframes((0, 4.0), (0.5, 4.2), (1, 0.8)), TERRA))
    out.append(S(P("M41,40 C34,54 31,70 33,84"),
                 keyframes((0, 4.0), (0.45, 4.4), (1, 1.0)), TERRA))
    return out


def basket(bowl_color, handle_color, scroll=(30.0, 36.0), eye=3.0, coil=15.0,
           bowl_w=11.5, arm_base=9.5, arm_tip=1.6, peak=(50.0, 2.0),
           bottom=94.0, waist=-3.0):
    """#26 family -- a market basket that could actually be picked up.

    The rim is one unbroken ribbon: it climbs each side and rolls into a
    scroll at the top, and the two handle arms land on those scrolls. The
    arms are heaviest where they meet the rim and taper to the peak, so the
    load path reads bowl -> scroll -> arm -> hand.
    """
    cx, cy = scroll
    sc = spiral(cx, cy, eye, coil, 500, 180, 220)
    wall = P("M%g,%g C%g,%g %g,%g %g,%g" % (
        cx - coil, cy,
        cx - coil - 6 + waist, cy + (bottom - cy) * 0.46,
        cx - coil + 8, bottom - 2, 50, bottom))
    body = join(sc, wall, rev(mirror(wall)), rev(mirror(sc)))
    out = [S(body, keyframes((0, eye * 0.5), (0.10, bowl_w * 0.5),
                             (0.26, bowl_w), (0.5, bowl_w * 1.04),
                             (0.74, bowl_w), (0.90, bowl_w * 0.5),
                             (1, eye * 0.5)), bowl_color)]
    # where each arm lands: the top of its scroll
    t = (500 - 270) / 320.0
    fr = eye * (coil / eye) ** t
    fx, fy = cx, cy - fr * 0.72
    px, py = peak
    sx = px + 1.1          # arms cross at the peak so the point closes solid
    arm = "M%g,%g C%g,%g %g,%g %g,%g" % (
        sx, py, sx - (sx - fx) * 0.20, py + (fy - py) * 0.42,
        fx + (sx - fx) * 0.40, fy - (fy - py) * 0.18, fx, fy)
    out.append(S(P(arm), taper(arm_tip, arm_base, 0.7), handle_color))
    out.append(S(mirror(P(arm)), taper(arm_tip, arm_base, 0.7), handle_color))
    return out


@mark(26)
def m26(uid):
    """Market basket: the rim scrolls up and the handle lands on the scroll."""
    return basket(TERRA, GREEN)


@mark(27)
def m27(uid):
    """Open loop over a hooked stem, with one folded leaf."""
    out = []
    main = P("M52,48 C68,48 80,36 79,22 C78,9 65,1 52,3 C38,5 28,18 30,32 "
             "C32,46 46,52 54,62 C62,72 60,86 50,91 C40,96 30,90 31,81 "
             "C32,73 41,71 44,77")
    out.append(S(main, keyframes((0, 5.6), (0.18, 6.6), (0.58, 6.2), (0.88, 3.2), (1, 0.9)), PINK))
    out.append(blade("M48,49 C58,47 68,41 74,32", 8.2, GOLD, bias=0.44))
    return out


@mark(28)
def m28(uid):
    """Heavy roll unwinding into a low sweep."""
    out = []
    head = spiral(44, 30, 28.0, 6.5, 96, 452, 250)
    out.append(S(head, keyframes((0, 8.2), (0.3, 7.8), (0.7, 5.4), (1, 1.4)), INK))
    sweep = join(P("M44,56 C48,66 54,72 62,75"), spiral(76, 79, 13.0, 4.5, 190, 470, 180))
    out.append(S(sweep, keyframes((0, 6.0), (0.4, 5.4), (0.82, 3.2), (1, 0.9)), TERRA))
    out.append(blade("M43,58 C40,72 38,84 37,97", 7.2, INK, bias=0.34))
    return out


@mark(29)
def m29(uid):
    """Long pod: one stroke folding from crown to root."""
    out = []
    main = P("M40,3 C56,4 66,17 63,32 C60,47 47,58 41,70 C35,82 38,92 29,95 "
             "C20,98 14,89 21,84 C27,80 33,86 30,92")
    out.append(S(main, keyframes((0, 1.2), (0.16, 5.6), (0.55, 6.4), (0.86, 3.4), (1, 0.9)), GREEN))
    out.append(blade("M62,36 C67,48 67,61 62,72", 8.0, GOLD, bias=0.42))
    return out


@mark(30)
def m30(uid):
    """Leaning crown on a full bowl."""
    out = []
    bowl = P("M14,44 C6,62 14,84 34,93 C50,100 68,98 82,87 C95,77 99,60 93,46")
    out.append(S(bowl, keyframes((0, 2.6), (0.1, 9.0), (0.9, 9.0), (1, 2.6)), TERRA))
    arm_r = join(P("M56,2 C61,15 68,26 74,34"), spiral(82, 42, 12.0, 3.6, 200, 520, 200))
    out.append(S(arm_r, keyframes((0, 1.0), (0.3, 6.0), (0.74, 4.4), (1, 1.1)), PINK))
    arm_l = join(P("M56,2 C50,15 41,26 33,34"), spiral(25, 42, 12.0, 3.6, -20, -340, 200))
    out.append(S(arm_l, keyframes((0, 1.0), (0.3, 6.0), (0.74, 4.4), (1, 1.1)), PINK))
    return out


@mark(31)
def m31(uid):
    """Basket with a ribbon handle and a vine laid across the rim."""
    out = []
    bowl = P("M26,40 C18,56 22,76 38,86 C52,94 70,92 78,80 C84,71 85,58 82,46")
    out.append(S(bowl, keyframes((0, 2.4), (0.12, 8.0), (0.88, 8.0), (1, 2.4)), TERRA))
    out.append(S(P("M82,46 C78,52 72,56 70,64"), taper(5.0, 1.2, 1.0), TERRA))
    loop = P("M50,72 C54,56 56,36 51,20 C48,10 57,6 60,15 C63,25 58,45 52,58 "
             "C49,66 45,72 40,75")
    out.append(S(loop, keyframes((0, 1.0), (0.22, 3.6), (0.62, 3.8), (0.9, 2.2), (1, 0.7)), GREEN))
    vine = P("M20,44 C11,45 9,55 17,57 C27,59 38,55 46,59")
    out.append(S(vine, keyframes((0, 0.8), (0.24, 3.2), (0.72, 3.6), (1, 1.0)), GREEN))
    return out


@mark(32)
def m32(uid):
    """Market canopy over a cut valance."""
    out = []
    out.append(S(P("M49,4 C36,18 22,34 8,49"), taper(1.6, 6.4, 0.8), GOLD))
    out.append(S(P("M49,4 C62,17 77,33 91,47"), taper(1.6, 6.4, 0.8), GOLD))
    out.append(S(P("M9,50 C24,62 40,66 50,66 C60,66 76,60 90,48"),
                 keyframes((0, 3.0), (0.5, 6.0), (1, 3.0)), GOLD))
    for x, ytop, w in ((20, 55, 20), (50, 64, 21), (80, 53, 20)):
        out.append(S(P("M%g,%g C%g,%g %g,%g %g,%g" % (
            x, ytop - 2, x, ytop + 8, x + 1, ytop + 18, x + 1, ytop + 30)),
            taper(w, 0.6, 0.9), TERRA, cap_start="flat"))
    return out


@mark(33)
def m33(uid):
    """Crown basket: a tall peak carried by two heavy scrolls."""
    return basket(PINK, GOLD, scroll=(31.0, 39.0), eye=3.4, coil=13.0,
                  bowl_w=11.5, arm_base=9.5, arm_tip=1.5, peak=(50.0, 2.0),
                  bottom=97.0, waist=0.0)


# =================================================================== 34 - 42
def pestle(d_arm, d_head, d_tip, color, w=6.0):
    """Long grinding stick: a looped head, a bowed shaft, a knobbed foot."""
    return [S(P(d_arm), keyframes((0, 1.2), (0.35, w), (0.8, w * 0.92), (1, w * 0.55)), color),
            S(P(d_head), keyframes((0, w * 0.5), (0.5, w * 0.62), (1, 0.9)), color),
            S(P(d_tip), keyframes((0, w * 0.6), (0.5, w * 0.7), (1, 1.0)), color)]


@mark(34)
def m34(uid):
    """Mortar and pestle: the stick bows so it belongs with the curves."""
    out = []
    bowl = P("M42,52 C36,60 34,72 39,82 C45,94 60,100 73,97 C88,93 97,80 95,66 "
             "C94,60 91,55 87,52")
    out.append(S(bowl, keyframes((0, 2.2), (0.12, 8.6), (0.88, 8.6), (1, 2.6)), INK))
    out.append(S(P("M86,51 C90,53 94,55 96,58"), taper(6.0, 1.4, 0.9), INK))
    shaft = P("M2,98 C10,86 16,75 24,63 C33,50 44,38 51,29")
    out.append(S(shaft, keyframes((0, 0.9), (0.4, 5.6), (0.85, 5.4), (1, 3.6)), TERRA))
    head = P("M51,29 C54,20 52,4 47,5 C43,6 44,18 49,28")
    out.append(S(head, keyframes((0, 3.4), (0.5, 3.8), (1, 3.2)), TERRA))
    tip = P("M49,28 C55,41 63,56 70,68 C73,74 79,77 82,73 C85,69 82,64 78,66 "
            "C75,68 75,73 78,76")
    out.append(S(tip, keyframes((0, 3.4), (0.35, 5.6), (0.8, 4.0), (1, 1.2)), TERRA))
    return out


@mark(35)
def m35(uid):
    """Mortar and pestle, arms open, a second curve resting in the bowl."""
    out = []
    bowl = P("M31,44 C24,58 26,76 40,86 C52,94 68,92 76,80 C81,72 82,58 79,46")
    out.append(S(bowl, keyframes((0, 2.4), (0.12, 8.4), (0.88, 8.4), (1, 2.4)), TERRA))
    out.append(S(P("M79,46 C75,52 70,56 69,64"), taper(4.8, 1.2, 1.0), TERRA))
    out.append(blade("M36,50 C42,64 52,74 64,78", 7.4, TERRA, bias=0.45))
    out.append(S(P("M55,30 C58,19 55,4 50,5 C46,6 47,20 52,30"),
                 keyframes((0, 3.4), (0.5, 3.8), (1, 3.0)), GREEN))
    out.append(S(P("M52,30 C42,45 25,65 6,84"),
                 keyframes((0, 3.0), (0.4, 4.6), (0.86, 3.6), (1, 0.8)), GREEN))
    out.append(S(P("M55,30 C60,42 66,54 71,66"),
                 keyframes((0, 3.0), (0.5, 4.4), (1, 1.6)), GREEN))
    return out


@mark(36)
def m36(uid):
    """Mortar and pestle with the stick swung out and footed."""
    out = []
    bowl = P("M44,48 C36,58 34,74 42,84 C51,95 68,96 79,87 C88,79 90,64 85,52")
    out.append(S(bowl, keyframes((0, 2.4), (0.12, 8.2), (0.88, 8.2), (1, 2.4)), GREEN))
    out.append(S(P("M85,52 C88,56 92,58 96,58"), taper(4.6, 1.0, 0.9), GREEN))
    out.append(S(spiral(64, 66, 8.5, 8.5, -90, 272, 140), const(5.0), GREEN))
    out.append(S(P("M34,30 C37,18 34,3 29,4 C25,5 26,19 31,29"),
                 keyframes((0, 3.4), (0.5, 3.8), (1, 3.0)), GOLD))
    out.append(S(P("M31,29 C27,46 22,66 20,84 C19,90 15,93 12,91 C9,89 10,84 14,84 "
                   "C17,84 19,88 18,92"),
                 keyframes((0, 3.2), (0.35, 5.4), (0.8, 3.6), (1, 1.1)), GOLD))
    out.append(S(P("M34,30 C42,42 52,54 60,62"),
                 keyframes((0, 3.2), (0.5, 5.2), (1, 2.0)), GOLD))
    return out


@mark(37)
def m37(uid):
    """Wide shallow basket -- handle thickened so it could really carry it."""
    return basket(TERRA, GOLD, scroll=(33.0, 30.0), eye=3.0, coil=16.5,
                  bowl_w=13.5, arm_base=14.0, arm_tip=4.0, peak=(50.0, 4.0),
                  bottom=72.0, waist=-18.0)


def _fan(spec, color, base=(34.0, 92.0)):
    out = []
    for (x, y, cx, cy, w) in spec:
        out.append(blade("M%g,%g C%g,%g %g,%g %g,%g" % (
            base[0], base[1], base[0] + (cx - base[0]) * 0.45,
            base[1] + (cy - base[1]) * 0.45, cx, cy, x, y), w, color, bias=0.34))
    return out


@mark(38)
def m38(uid):
    """Grass fan: five blades from one root."""
    return _fan([
        (2, 42, 14, 72, 6.6),
        (26, 8, 26, 48, 7.2),
        (58, 6, 42, 42, 7.6),
        (90, 22, 60, 50, 7.2),
        (99, 58, 70, 74, 6.8),
    ], GREEN, base=(26, 94))


@mark(39)
def m39(uid):
    """Mortar with the pestle raked out to the right."""
    out = []
    bowl = P("M12,44 C4,58 6,76 20,86 C32,95 48,93 56,82 C61,74 62,58 59,46")
    out.append(S(bowl, keyframes((0, 2.4), (0.12, 8.4), (0.88, 8.4), (1, 2.4)), GOLD))
    out.append(S(P("M59,46 C56,52 51,56 50,64"), taper(4.8, 1.2, 1.0), GOLD))
    out.append(blade("M17,50 C22,64 32,74 45,78", 7.2, GOLD, bias=0.45))
    out.append(S(P("M56,30 C59,18 56,3 51,4 C47,5 48,19 53,29"),
                 keyframes((0, 3.4), (0.5, 3.8), (1, 3.0)), TERRA))
    out.append(S(P("M53,29 C42,44 30,60 22,72"),
                 keyframes((0, 3.2), (0.5, 5.0), (1, 2.0)), TERRA))
    out.append(S(P("M56,30 C66,48 80,70 94,92"),
                 keyframes((0, 3.2), (0.4, 5.6), (0.86, 4.4), (1, 0.9)), TERRA))
    return out


@mark(40)
def m40(uid):
    """Wider grass fan, seven blades."""
    return _fan([
        (2, 56, 14, 80, 6.4),
        (14, 24, 20, 58, 6.8),
        (34, 6, 30, 46, 7.2),
        (56, 6, 42, 44, 7.2),
        (78, 18, 54, 48, 6.8),
        (94, 40, 62, 62, 6.4),
        (98, 62, 66, 78, 6.0),
    ], GREEN, base=(36, 92))


@mark(41)
def m41(uid):
    """Compact mortar: the stick leans out, the grain sits in the belly."""
    out = []
    bowl = P("M32,32 C18,36 10,50 14,64 C18,80 34,90 50,86 C64,82 72,68 69,54")
    out.append(S(bowl, keyframes((0, 2.6), (0.12, 8.6), (0.88, 8.6), (1, 2.6)), INK))
    out.append(S(spiral(38, 66, 8.0, 8.0, -100, 262, 140), const(5.0), PINK))
    out.append(S(P("M62,32 C65,20 62,5 57,6 C53,7 54,21 59,31"),
                 keyframes((0, 3.4), (0.5, 3.8), (1, 3.0)), PINK))
    out.append(S(P("M59,31 C52,42 44,52 38,58"),
                 keyframes((0, 3.2), (0.5, 4.8), (1, 1.8)), PINK))
    out.append(S(P("M62,32 C72,50 84,72 96,94"),
                 keyframes((0, 3.2), (0.4, 5.4), (0.86, 4.2), (1, 0.9)), PINK))
    return out


@mark(42)
def m42(uid):
    """Empty basket, rim rolled inward at both ends."""
    out = []
    sc = spiral(20, 20, 3.0, 10.0, 500, 180, 180)
    wall = P("M10,20 C2,40 4,68 22,84 C34,94 50,96 50,96")
    body = join(sc, wall, rev(mirror(wall)), rev(mirror(sc)))
    out.append(S(body, keyframes((0, 1.4), (0.1, 5.0), (0.27, 10.4), (0.5, 12.0),
                                 (0.73, 10.4), (0.9, 5.0), (1, 1.4)), TERRA))
    return out
