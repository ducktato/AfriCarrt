"""Emit the 42 marks as standalone SVGs, a printable sheet and a PDF."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brush import PARCH, INK, TERRA, GREEN, GOLD, PINK, fit
import marks as M
from marks import basket

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SVG_DIR = os.path.join(ROOT, "svg")
CHROME = "/opt/pw-browsers/chromium"
HDR = '<svg xmlns="http://www.w3.org/2000/svg" '

VARIANTS = {
    "26-a": ("Terracotta bowl, forest handle", lambda: basket(TERRA, GREEN)),
    "26-b": ("Single-colour terracotta", lambda: basket(TERRA, TERRA)),
    "26-c": ("Ink bowl, gold handle", lambda: basket(INK, GOLD)),
    "26-d": ("Forest bowl, hibiscus handle", lambda: basket(GREEN, PINK)),
}


def body(els, box=(9.0, 9.0, 82.0, 82.0)):
    return "".join(fit(els, box))


def standalone(els, size=512, bg=PARCH):
    return (HDR + 'width="%d" height="%d" viewBox="0 0 100 100">'
            '<rect width="100" height="100" fill="%s"/>%s</svg>'
            % (size, size, bg, body(els)))


def write_marks():
    os.makedirs(SVG_DIR, exist_ok=True)
    for n in sorted(M.MARKS):
        p = os.path.join(SVG_DIR, "africarrt-mark-%02d.svg" % n)
        open(p, "w").write(standalone(M.MARKS[n]("m%d" % n)))
    for key, (_, fn) in VARIANTS.items():
        p = os.path.join(SVG_DIR, "africarrt-mark-%s.svg" % key)
        open(p, "w").write(standalone(fn()))
    tdir = os.path.join(SVG_DIR, "transparent")
    os.makedirs(tdir, exist_ok=True)
    for n in sorted(M.MARKS):
        open(os.path.join(tdir, "africarrt-mark-%02d.svg" % n), "w").write(
            HDR + 'width="512" height="512" viewBox="0 0 100 100">%s</svg>'
            % body(M.MARKS[n]("t%d" % n)))
    for key, (_, fn) in VARIANTS.items():
        open(os.path.join(tdir, "africarrt-mark-%s.svg" % key), "w").write(
            HDR + 'width="512" height="512" viewBox="0 0 100 100">%s</svg>' % body(fn()))
    return len(M.MARKS) + len(VARIANTS)


# ------------------------------------------------------------------- sheets
W, H = 297.0, 420.0            # A3 portrait, millimetres
MARGIN = 15.0


def _text(x, y, t, size, fill=INK, anchor="middle", weight="400", ls="0",
          family="Georgia, 'Times New Roman', serif", opacity=None):
    op = ' opacity="%s"' % opacity if opacity else ""
    return ('<text x="%.2f" y="%.2f" font-family="%s" font-size="%.2f" '
            'font-weight="%s" letter-spacing="%s" fill="%s" text-anchor="%s"%s>%s</text>'
            % (x, y, family, size, weight, ls, fill, anchor, op, t))


def sheet_page1():
    cols, rows = 6, 7
    top = 46.0
    foot = 14.0
    gw = (W - 2 * MARGIN) / cols
    gh = (H - top - foot) / rows
    cell = min(gw, gh - 8.5)
    parts = ['<rect width="%g" height="%g" fill="%s"/>' % (W, H, PARCH)]
    parts.append(_text(W / 2, 24, "AfriCarrt", 15, INK, weight="600", ls="1.4"))
    parts.append(_text(W / 2, 32.5, "Forty-two logo marks &#183; vectorised from the sketch sheet",
                       6.2, INK, opacity="0.62"))
    parts.append('<line x1="%g" y1="37" x2="%g" y2="37" stroke="%s" stroke-width="0.35" '
                 'opacity="0.35"/>' % (MARGIN, W - MARGIN, TERRA))
    for i, n in enumerate(sorted(M.MARKS)):
        c, r = i % cols, i // cols
        x = MARGIN + c * gw + (gw - cell) / 2
        y = top + r * gh
        parts.append('<g transform="translate(%.3f,%.3f) scale(%.5f)">%s</g>'
                     % (x, y, cell / 100.0, body(M.MARKS[n]("s%d" % n))))
        parts.append(_text(x + cell / 2, y + cell + 5.6, str(n), 5.4, INK, opacity="0.55"))
    parts.append(_text(W / 2, H - 7,
                       "Terracotta #C6551F &#183; Forest #3D7A4A &#183; Hibiscus #D9436B "
                       "&#183; Gold #D9A028 &#183; Ink #2E2013 &#183; Parchment #FAF3E7",
                       4.6, INK, opacity="0.5"))
    return "".join(parts)


def sheet_page2():
    parts = ['<rect width="%g" height="%g" fill="%s"/>' % (W, H, PARCH)]
    parts.append(_text(W / 2, 24, "Mark 26 &#183; the market basket", 13, INK,
                       weight="600", ls="1.0"))
    parts.append(_text(W / 2, 32.5,
                       "The rim is one ribbon: it climbs, scrolls, and the handle lands on the scroll.",
                       6.0, INK, opacity="0.62"))
    parts.append('<line x1="%g" y1="37" x2="%g" y2="37" stroke="%s" stroke-width="0.35" '
                 'opacity="0.35"/>' % (MARGIN, W - MARGIN, TERRA))
    keys = list(VARIANTS)
    cell = 112.0
    for i, k in enumerate(keys):
        c, r = i % 2, i // 2
        x = MARGIN + 14 + c * (cell + 16)
        y = 52 + r * (cell + 26)
        parts.append('<g transform="translate(%.3f,%.3f) scale(%.5f)">%s</g>'
                     % (x, y, cell / 100.0, body(VARIANTS[k][1]())))
        parts.append(_text(x + cell / 2, y + cell + 8, VARIANTS[k][0], 5.6, INK, opacity="0.62"))
    parts.append('<line x1="%g" y1="%g" x2="%g" y2="%g" stroke="%s" stroke-width="0.3" '
                 'opacity="0.3"/>' % (MARGIN, H - 62, W - MARGIN, H - 62, TERRA))
    parts.append(_text(W / 2, H - 53, "Legibility at size", 7.0, INK, weight="600"))
    base = MARGIN + 26
    for i, mm in enumerate((30.0, 18.0, 11.0, 7.0)):
        x = base + i * 52
        y = H - 44
        parts.append('<g transform="translate(%.3f,%.3f) scale(%.5f)">%s</g>'
                     % (x, y, mm / 100.0, body(basket(TERRA, GREEN))))
        parts.append(_text(x + mm / 2, H - 6.0, "%g mm" % mm, 4.6, INK, opacity="0.55"))
    return "".join(parts)


def write_sheet():
    p1, p2 = sheet_page1(), sheet_page2()
    svg = (HDR + 'width="%gmm" height="%gmm" viewBox="0 0 %g %g">%s</svg>' % (W, H, W, H, p1))
    open(os.path.join(ROOT, "africarrt-logo-sheet.svg"), "w").write(svg)
    svg2 = (HDR + 'width="%gmm" height="%gmm" viewBox="0 0 %g %g">%s</svg>' % (W, H, W, H, p2))
    open(os.path.join(ROOT, "africarrt-mark-26-variations.svg"), "w").write(svg2)

    html = ("<!doctype html><meta charset='utf-8'><style>"
            "@page{size:%gmm %gmm;margin:0}"
            "html,body{margin:0;padding:0;background:%s}"
            ".pg{width:%gmm;height:%gmm;overflow:hidden;page-break-after:always}"
            ".pg:last-child{page-break-after:auto}"
            "svg{display:block;width:%gmm;height:%gmm}"
            "</style>" % (W, H, PARCH, W, H, W, H))
    for page in (p1, p2):
        html += ("<div class='pg'>" + HDR +
                 'viewBox="0 0 %g %g">%s</svg></div>' % (W, H, page))
    hp = os.path.join(os.path.dirname(__file__), "sheet.html")
    open(hp, "w").write(html)
    pdf = os.path.join(ROOT, "africarrt-logo-sheet.pdf")
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    "--no-pdf-header-footer", "--print-to-pdf=" + pdf, hp],
                   capture_output=True)
    return pdf


if __name__ == "__main__":
    n = write_marks()
    pdf = write_sheet()
    print("marks written:", n)
    print("pdf:", pdf, os.path.getsize(pdf) if os.path.exists(pdf) else "MISSING")
