# AfriCarrt logo marks

Forty-two logo marks, vectorised from the numbered hand-drawn sketch sheet.

## Output

| File | What it is |
| --- | --- |
| `africarrt-logo-sheet.pdf` | Printable A3 sheet — page 1 is all 42 marks numbered to match the sketch sheet, page 2 is the #26 basket in four colourways plus a legibility test |
| `africarrt-logo-sheet.svg` | Page 1 as a standalone A3 vector |
| `africarrt-mark-26-variations.svg` | Page 2 as a standalone A3 vector |
| `svg/africarrt-mark-NN.svg` | One mark per file, 512&times;512, parchment ground |
| `svg/africarrt-mark-26-{a,b,c,d}.svg` | The four #26 colourways |
| `svg/transparent/` | The same marks with no background, for placing on other grounds |

Everything is real vector geometry — filled `<path>` outlines, no rasterised
artwork anywhere in the PDF.

## How the marks are drawn

Nothing is a stroked hairline. Every mark is built from *centrelines* that get
inflated into solid filled outlines with a variable width profile, so each
element is a tapering ribbon — heaviest at the base, narrowing to the tip, the
way a loaded brush or a vine behaves. `build/brush.py` does that work:

- `P(d)` samples an SVG path into a dense point run; `spiral()` and `arc()`
  generate coils directly.
- `taper() / leaf() / swell() / keyframes()` describe how wide the ribbon is
  along its length.
- `ribbon()` offsets the centreline by half that width to both sides and caps
  the ends; `smooth_closed()` fits the resulting outline back to cubic B&eacute;ziers,
  keeping flagged corners sharp so points stay points.
- `fit()` rescales each finished mark into a common box, so all 42 sit at a
  consistent optical size on the sheet.

`build/marks.py` holds the 42 mark definitions. `build/build.py` writes every
output above. `build/preview.py` renders any subset beside its source sketch
for comparison.

```
cd build && python3 build.py            # rebuild everything
cd build && python3 preview.py 26 33 37 # compare marks against the sketches
```

Requires Python with `pillow` and `numpy`, and Chromium for the PDF step.

## Palette

| Role | Hex |
| --- | --- |
| Terracotta (primary) | `#C6551F` |
| Forest green | `#3D7A4A` |
| Hibiscus pink | `#D9436B` |
| Gold | `#D9A028` |
| Ink | `#2E2013` |
| Parchment (ground) | `#FAF3E7` |

Each mark uses one or two of these; the assignment is spread across the sheet
so no single colour dominates.

## Notes on specific marks

**26 — the market basket.** The one the whole set hangs on. The rim is a single
unbroken ribbon: it climbs each side of the bowl and rolls into a scroll at the
top, and the two handle arms land on those scrolls. The arms are heaviest where
they meet the rim and taper to the peak, so the load path reads bowl &rarr; scroll
&rarr; arm &rarr; hand. `basket()` in `marks.py` is parameterised, and 33 and 37 are
built from it. Four colourways and a size test are on page 2 of the PDF.

**37.** Same construction, deliberately wider and shallower, and the handle is
thickened well past the sketch's needle so the proportions carry the bowl.

**21.** The flourish and the triangular A are one object, not two letters: the
ring doubles as the A's crossbar, the right leg runs straight through the ring
and out to a tapered point, and the roll sits inside the ring as its counter.

**5, 12, 14 — the soup bowls.** The swirl is clipped to the bowl's opening, so
it is physically inside the rim rather than floating near it. The soup surface
carries a vertical gradient and a soft shadow crescent under the far rim; the
lip is drawn last, over the soup's edge.

**8.** Kept loose on purpose — this sketch had the best line quality on the
sheet, so the crossbar stays hand-thrown, the stem keeps its weight shift into
the foot curl, and the C keeps its flicked entry and exit rather than being
regularised.

**34, 35, 36, 39, 41 — mortar and pestle.** The pestle shaft is bowed slightly
so it sits with the organic curves instead of reading as an imported straight
line, and its head keeps the pinched loop from the sketches.
