# src/js — module conventions

Every file here is concatenated into **one script scope** by `build.ps1`, in
ordinal filename order. There are no imports, no modules and no closures around
the top level: a `const` here is a global.

## Numbering — the prefix is the load order

| range | what lives there |
|---|---|
| `10`–`20` | maths core: parser, symbolic differentiation, formatting, renderer |
| `21`–`49` | **pure engines**, unit-tested, no DOM (numerics, vectors, curves, ODEs, linear algebra, mechanics, thermo, optics, circuits, relativity, quantum, atom, probability, nuclear, solid state, statistical mechanics) |
| `50` | application state (`S`) and the field-layer drawing pipeline |
| `59` | the interaction toolkit — sketch pad, region tool, matrix editor, expression box, and the `pk*` "type your own" helpers |
| `59b` | one **entry accessor** per preset table: returns an object shaped like a table entry, so `TABLE[st.key]` becomes `cur(st)` and nothing downstream changes |
| `60`–`79` | **stages** — the canvas experiments, one topic per file |
| `80`–`82` | UI panels, navigation, wing plumbing |
| `85`–`89` | long-form theory prose, one wing per file |
| `90` | boot and the main loop |

The demo-group files are `72a`–`72y`; the registry that consumes them is
`72zz-wings-registry.js` and **must sort last of the 72s**, which is why it is
named that way. A new wing's demo file goes anywhere before it.

**The 21–49 boundary is load-bearing.** `runtests.ps1` extracts everything
between the `"use strict";` anchor and the `APPLICATION STATE` banner (top of
`50a-state.js`) and runs the unit suite against it. Anything an engine test needs
must therefore live below 50 and must not touch the DOM.

To insert a file between two existing ones, add a letter: `60a-`, `60b-`, … all
sort between `60-` and `61-`. Keep the letter suffix even for a lone file, so the
next insertion has room.

## Size

Aim for **under ~600 lines / ~50 KB per file** — one concern each. The point is
that changing one demo should mean opening one small file. If a file is growing
past that, split it at a top-level boundary and give the pieces the next letters.

## Adding things

- **A stage** — `STAGES.<id> = { title, enter, controls, wire, frame, readout,
  chip, legend }`. `drag:true` routes pointer down/move/up into `pick(st, sx, sy,
  phase)`. `mode:'3d'` uses the depth-sorted renderer and must call `R.flush()`
  itself. `dockLegend:true` moves the key into the dock when the canvas is full.
- **A demo** — an entry in the wing's `*_GROUPS` array in `72*-demos-*.js`. A
  `stage:` key bypasses the field pipeline via `applyStageDemo`.
- **A wing** — see the checklist in `../../AI-GUIDE.md`; it touches seven places.

## Every stage carries the full set

All 178 stages define `derive`, `readout`, `chip` **and** `legend`. If you add a
stage, add all four — the audit script that found eleven missing legends is a
one-liner and it will find yours.

## Traps

- **Name collisions are silent.** Prefix everything and grep case-sensitively.
  **Element ids collide the same way** — one document, `getElementById` is
  first-wins. The complex wing's contour radius and the circulation loop's
  radius were both `ciR`, both in the dock, so which slider a `wireSlider` call
  reached depended on document order. `./auditlink.ps1` fails on a duplicate id.
- **A display formatter must never fill a box the reader types into.** `fmtNum`
  emits U+2212 and real superscripts, and `parseFloat('−0.7')` is `NaN`. Three
  panels filled editable inputs with `fmtNum`/`fmtNear` and read them back with
  `parseFloat`: every negative component of û and n̂ became `0` through a `|| 0`,
  silently, the moment a neighbouring box was edited. **Use `fmtEdit(v, sig)`
  (`10-math.js`) for anything typed into**, `fmtNum` only for what is read.
- **A difference gets a difference formatter.** `fmtAgree(a, b, unit)` when both
  routes are in scope — it *derives* the scale, so it cannot be given the wrong
  one — `fmtGap(gap, scale, unit)` when only the gap is, and
  `fmtAgreeTight`/`fmtGapTight` on a canvas, where the long form will not fit a
  fixed column. `fmtNum` is wrong (below 1 its `sig` counts decimals, so a real
  gap prints `0`), `toExponential` is wrong (ASCII `8.10e-11`, and no scale) and
  `toFixed` is wrong (`0.00000` for a perfect fit). `./auditresid.ps1` reads
  readout, chip, **derive**, legend and the **`*Own`** panels — the last two were
  invisible to it until 2026-08-14 and were hiding thirteen defects — but it
  cannot read canvas text, so `ctText`/`wsNum`/`rlText` are on you.
- **A control's value must be restorable.** `82a-permalink.js` puts the reader's
  whole view in the URL by driving the real controls, so a new control needs an
  id, and a group read together by one handler (û as `du`/`dv`/`dw`) must
  tolerate being assigned before any of it is notified. `./auditlink.ps1`
  measures it over all 593 demos.
- **An engine that takes caller-supplied objects must carry their tags through
  its return.** `rtRaceRun` rebuilt each result row from the entry it was given
  and dropped the `own`/`short` fields the stage had put there; the stage then
  looked for its own entrant by `own`, found nothing, and reported a good body as
  unable to roll. Nothing but `auditcustom` could see it.
- `nqAdaptive` runs on a fixed 16-panel pre-subdivision because adaptive Simpson
  silently returns 0 on periodic integrands whose zeros land on its sample
  points (an astroid's speed, a cardioid's r²). Do not "simplify" that away.
- Several relativity quantities are catastrophic cancellations and must be
  computed in closed form — the tests assert the naive route is *wrong*.
- **A per-cell draw goes in a bitmap, not in `frame()`.** `ctHeat` builds an
  `ImageData`, blits it to an offscreen canvas sized in *cells*, and
  `drawImage`s that into the box with `imageSmoothingEnabled = false`. Five
  loops of this shape were converted on 2026-08-13 — copy one (`ctHeat` in
  `61a`, or `cxPaint` in `79c` if the input has a stable identity to cache on)
  rather than writing a sixth grid of `fillRect`. The blit is also why cells
  tile exactly: overlapping them double-composites at translucent alpha and
  paints a visible grid over the data.
- **`ctHeat` deliberately does NOT cache its pixels.** Its `f` is almost always
  a closure the caller rebuilds every frame, so there is no honest identity to
  key on, and a stale heat map looks exactly like a correct one.
- **Canvas text is drawn literally — no markup.** `ctFrame`/`ctText`/`stageNote`
  end in `fillText`, so a `<sub>` is painted as six characters. Two stages
  shipped this way. `smoke.ps1` now greps for it.
- **Do not batch a depth-sorted translucent mesh** (`wsCY`). Subpaths of one
  path fill by the nonzero rule, so opposite-wound quads cancel — and
  normalising the winding fills in gaps that are real geometry.
- 3D stages should call `ctCamFit(halfSize)` rather than guessing `cam.dist`.
- The readout chip floats over the canvas's top-left ~180×90 px. A stage drawing
  a heading there must centre it, or start below it — `laSystem` and `smIsing`
  both drew their captions underneath it.
- **A chip's lines must be `<div>`s.** `.readout-chip` is a flex column, so every
  element child becomes its own row: a chip returning bare text with `<br>` tears
  apart as soon as `supify()` turns `v_rms` into `v<sub>rms</sub>`, and renders as
  three stacked lines reading "v", "rms", "= 517 m/s". Eleven chips had that
  shape. `updateStageChip` now wraps an unwrapped chip defensively, but write
  `<div class="k">label</div><div>value</div>` and the guard never fires.
- **`legend(st)` receives the state.** A stage whose scenes draw different things
  must key its legend on the one showing — a fixed key naming a_T and a_N over a
  picture with no such arrows is a caption for a different diagram.
- **`ctText(ctx, x, y, text, colour, font)` — coordinates first.** Passing the
  text first draws *nothing*: the string goes into the x slot, the canvas gets a
  non-numeric coordinate, and the label silently never appears. No error, no
  `NaN`, nothing `runall` or `auditscan` can see. Twenty-four labels across the
  nuclear, solid-state and statistical-mechanics stages were invisible this way.
  `smoke.ps1` now greps for it on every build. The sixth argument is a **font
  string**, not a size: `'11px ' + FONT_UI`, never `11`.
- Test an improper integral by pushing a finite cut-off outwards, never by
  substituting infinity onto a finite endpoint — the latter buries a log
  divergence in truncation error and reports Σ1/n as convergent.
- **The canvas is not always the shape you wrote the stage on.** `mkPlot` and
  `ctText` now clamp into it, and `ctBounds()` / `ctFitText()` in `60a` are how a
  drawing helper finds out how big it is. Do not reintroduce the pattern they
  fix: layout from `W` and `H`, never from a constant that assumes either.
  `./auditsize.ps1` sweeps eight canvas shapes and will find it.
- **`parseFloat(ctx.font)` returns the WEIGHT**, not the size — these font
  strings are `'600 11px Inter'`. Use `/(\d+(?:\.\d+)?)px/`. This turned a label
  clamp into a 480-pixel offset that pushed 19 stages' labels off the canvas.
- **A CSS `1fr` grid track is `minmax(auto, 1fr)`**, and that `auto` minimum is
  min-content — so the track cannot shrink below the widest thing inside it. The
  dock's panels propagated a 1229px floor up into `.app` and then into the
  document, and the whole page scrolled sideways below 1180px. Write
  `minmax(0,1fr)` unless you mean otherwise.
