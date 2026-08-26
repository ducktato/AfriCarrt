"""Render marks to a comparison contact sheet next to the source sketches."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from brush import PARCH, fit
import marks as M

SCRATCH = "/tmp/claude-0/-home-user-AfriCarrt/f60a7932-b1c0-589b-aec0-824e0efca0ff/scratchpad"
CHROME = "/opt/pw-browsers/chromium"


def mark_svg(n, size=300, bg=PARCH):
    els = fit(M.MARKS[n]("m%d" % n))
    return ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" '
            'viewBox="0 0 100 100"><rect width="100" height="100" fill="%s"/>'
            '%s</svg>' % (size, size, bg, "".join(els)))


def render(nums, out_png, cols=6, cell=300):
    rows = (len(nums) + cols - 1) // cols
    parts = []
    for i, n in enumerate(nums):
        els = fit(M.MARKS[n]("m%d" % n))
        x = (i % cols) * cell
        y = (i // cols) * (cell + 34)
        parts.append('<g transform="translate(%d,%d) scale(%f)">'
                     '<rect width="100" height="100" fill="%s"/>%s</g>'
                     % (x, y, cell / 100.0, PARCH, "".join(els)))
        parts.append('<text x="%d" y="%d" font-family="monospace" font-size="20" '
                     'fill="#900" text-anchor="middle">#%d</text>'
                     % (x + cell // 2, y + cell + 24, n))
    W, H = cols * cell, rows * (cell + 34)
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d">'
           '<rect width="100%%" height="100%%" fill="#ffffff"/>%s</svg>'
           % (W, H, "".join(parts)))
    tmp = os.path.join(SCRATCH, "prev.html")
    open(tmp, "w").write(
        "<!doctype html><meta charset='utf-8'><style>html,body{margin:0;padding:0}"
        "svg{display:block}</style>" + svg)
    subprocess.run([CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                    "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--screenshot=" + out_png, "--window-size=%d,%d" % (W, H + 100), tmp],
                   capture_output=True)
    from PIL import Image
    im = Image.open(out_png)
    if im.height > H:
        im.crop((0, 0, W, H)).save(out_png)
    return out_png


def compare(nums, out_png, cols=6, cell=300):
    """Sketch on the left of each pair, cleaned vector on the right."""
    from PIL import Image
    render(nums, os.path.join(SCRATCH, "_v.png"), cols=cols, cell=cell)
    vec = Image.open(os.path.join(SCRATCH, "_v.png")).convert("RGB")
    rows = (len(nums) + cols - 1) // cols
    pw, ph = cell, cell + 34
    out = Image.new("RGB", (cols * cell * 2, rows * ph), "white")
    for i, n in enumerate(nums):
        cx, cy = (i % cols), (i // cols)
        sk = Image.open(os.path.join(SCRATCH, "cells/%02d.png" % n)).convert("RGB")
        s = min(cell / sk.width, cell / sk.height)
        sk = sk.resize((max(1, int(sk.width * s)), max(1, int(sk.height * s))), Image.LANCZOS)
        pane = Image.new("RGB", (cell, ph), "white")
        pane.paste(sk, ((cell - sk.width) // 2, (ph - sk.height) // 2))
        out.paste(pane, (cx * cell * 2, cy * ph))
        out.paste(vec.crop((cx * cell, cy * ph, cx * cell + cell, cy * ph + ph)),
                  (cx * cell * 2 + cell, cy * ph))
    out.save(out_png)
    return out_png


if __name__ == "__main__":
    nums = [int(a) for a in sys.argv[1:]] or sorted(M.MARKS)
    print(compare(nums, os.path.join(SCRATCH, "cmp.png"), cols=min(4, len(nums))))
