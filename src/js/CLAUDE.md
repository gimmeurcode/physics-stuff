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
  fixed column.
- **…and `fmtAgreeGross(a, b, gross, unit)` when BOTH routes can vanish.**
  `fmtAgree` derives its scale as `max(|a|,|b|)`, which is right until the
  quantity itself is zero — then the derived scale *is* the round-off and a
  perfect result prints as a 100% disagreement in the affirmative colour. That
  is J9 inverted and there were ten of them. `gross` is what the zero cancelled
  (§2.1): `∮|F||dr|`, `∬|F||dS|`, `∮|f||dz|`, `∬|ρ|dA`, kT, the energy before
  the collision. **Magnitudes, not the absolute value of the dot product** — a
  swirl is tangential to every sphere, so `∬|F·n̂|` is zero too and rescues
  nothing. `vcStokesCheck`, `vcDivergenceCheck`, `igParallelAxis` and `igLamina`
  return theirs; `vcLineGross`, `vcSurfFluxAbs` and `cxContourGross` compute one.
  **`./auditsides.ps1` fails on a new one** — its FALSE-SCALE baseline is 0.
- **A quantity that is a ratio needs its denominator checked, not assumed.**
  `igLamina` divided by a mass that a sign-changing density had cancelled to
  exactly zero and printed a centroid of −1.15×10¹⁶. It now flags `massless` and
  the panels say "not defined". `fmtNum(NaN)` renders `—`, so the `NaN` grep
  cannot see this class: only a preset sweep can. `fmtNum` is wrong (below 1 its `sig` counts decimals, so a real
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
- **A tick label's precision comes from the STEP, never a constant.**
  `fmtNum(v, 3)` on an axis spanning less than ~0.01 printed four adjacent
  ticks as one string (`0.002` ×4 on the statmech density axis). `fmtTick(v,
  step)` (`10-math.js`) derives exactly the decimals the step needs and is the
  only formatter allowed on a tick; `ctGrid` and `pvDrawAxes` both use it and
  `./auditticks.ps1` fails on a duplicated label in any row or column.
  **And the step you hand it must be a ROUNDED one** — `fmtTick` gives the step
  exactly the decimals it needs, so an arbitrary step gets arbitrary precision:
  `fmtTick(v, (hi−lo)/2)` on a span of 0.002974… printed `1.004508956691` and
  three of those ran off the axis. Round with `rlTickStep(span, want)` (`68a`)
  or the wing's own equivalent **first**, then place the ticks on multiples of
  that step — which is what `auditticks` cannot see, because they are all
  different strings.
- **A centred canvas title slides out from under the readout chip by itself** —
  `plotFrame` and `ctFrame` route through `ctTitleClearChip` (60a). A caption
  you draw with raw `fillText` gets no such help: start it below or right of
  the chip's ~190×95 px zone, or `./auditticks.ps1` will flag it.
- **`ctContour` takes an optional `tear` threshold** — a cell whose corner
  values span more than it is a JUMP (a branch cut, an atan2 seam), not a
  level crossing, and the contour stops there instead of stitching a false fan
  across it (`vcConserv` passes a quarter of the plotted range).
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
- **The two ends of an integral rarely have the same singularity, and each needs
  the substitution that removes its OWN.** `r = r₀ − w²` kills the inverse square
  root at a turning point; only `u = ln(r − r_h)` resolves the simple pole at a
  horizon, and an even grid in r straddles it and reports a divergent integral as
  finite. `rlInfallQuad` (`46b`) carries four substitutions for this reason.
- **A 0·∞ node is a limit, not a thing to nudge past.** Nudging the singular
  endpoint of `rlInfallQuad` inward by a millionth of the segment cost the whole
  quadrature its order — the error fell like h, not h⁴ — and shrinking the nudge
  a thousandfold made it a **thousand times worse**, because A is still exactly 0
  at that distance and the last panel was dropped whole. Two failure modes with
  opposite cures is the signature. Evaluate the limit.
- **Group a curvature in A·B, never in A and B separately.** The textbook form of
  the radial tide needs `B′`, and a centred stencil cannot differentiate B within
  `h` of its pole: measured against −2/r³ it is out by **5×10⁵** at r_h + 10⁻⁶
  and NaN at the horizon. `Q = A·B` has no pole there — see `rlTidalRadial`.
- **`rlGeoRun` does not record the step that trips its stop.** A run halted *at*
  the radius you mean to interpolate to leaves every sample above it, and the
  interpolation returns NaN. Set `rStop` below the target on purpose.
- **A guard that returns 0 for a bad sample silently redefines the domain of
  integration.** `rlDeflect` (`46c`) integrates out to r = ∞, and
  Schwarzschild–de Sitter has no such place; the guard version reported a
  confident 0.2193 where the honest answer inside the static band is 0.2170.
  **Refuse on the endpoint, and COUNT the samples you could not evaluate** — one
  bad sample makes the whole answer NaN. Both, not either: an A that dips
  negative *between* the turning point and the observer passes every endpoint
  check there is.
- **A bisection bracket can be an existence argument, and then it is the whole
  correctness proof.** `rlTurnR` brackets from the **peak of W**, not from the
  horizon, because the turning point is the largest r with W = 1/b² — so
  "W(peak) < 1/b²" *proves* capture instead of merely failing to find one.
  Bracketed from the horizon, a ray that winds twice round the hole is reported
  captured; a 2000-point log scan misses it too, because the window is 0.0018
  wide and the cells are 0.02. `tests.js` asserts **both wrong methods are
  wrong**, which is the only thing that stops either coming back.
- **Bound the ANGULAR step, not just the radial one.** `rlOrbitPlan` (`46a`) and
  `rlRayPlan` (`46c`) exist for the same reason: dφ/dτ = L/r² is largest at
  closest approach, and a step sized to cover the radial journey resolves the
  bend only when r₀ is comparable with the far end. A fixed observer and a fixed
  step gave a null geodesic a 6.6×10⁻⁵ rad deflection **in flat space**. Scale
  the far end to the orbit too.
- **A time array that spans twenty decades has no digits left at its far end.**
  `gwInspiralRun` (`46d`) reaches Hulse–Taylor's ISCO 5.2×10¹⁶ s after the start
  in steps of 2×10⁻⁵ s, and one ulp of float64 at 5×10¹⁶ is **eight seconds** —
  the whole last stretch of the elapsed-time array is a single repeated float.
  A derivative taken against it returned a chirp mass **33% wrong on every long
  inspiral** while every compact one passed at 10⁻⁸. Carry the quantity that is
  small where you need it: the time **remaining**, summed backwards from the
  end. This is a third kind of "floating point", and neither of the two cures in
  `CLAUDE.md` applies — it is a quantity stored at the wrong origin.
- **A step bound added for a plausible reason can truncate the answer it was
  added to protect.** The same run bounded its step at a twenty-fourth of an
  orbit so the phase would be "resolved". φ̇ = ω(a) does not oscillate — the
  cycle count is a quadrature — and under that bound GW170817 hit the step cap,
  stopped short, and the panel printed a count **571 cycles low** beside the
  closed form as though the comparison were complete. Ask what a bound is
  actually for; and if a run can stop short, make it report **nothing** rather
  than a partial number (`hitEnd`).
- **`auditperf` counts PAINT CALLS, so a 22 000-point path is invisible to it.**
  One `stroke()` over an integrated track is one paint call and a real cost.
  Decimate to a couple of hundred points before drawing — a 300-pixel picture
  resolves no more — and remember the gate cannot see this class at all.
- **A rotation, offset or tag that travels with a result must be repacked with
  it.** `rlBendRay` returns `phIn`, the angle that turns a track drawn from
  φ = 0 into the parallel bundle starlight actually is; the fan rebuilt its rows
  as `{b, track, captured, defl}` and dropped it, so every ray was drawn from
  one point again and the picture read as a lamp. Same class as `rtRaceRun`
  above, and only the screenshot found either.
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
- **A two-route check tests the route it CALLS.** `rlWlMeasure` (46e) is the
  wrapper `rlMink` uses; it passed a leftover node count into
  `rlWlTauPrimed`'s **tolerance** argument, so the adaptive quadrature stopped
  at its first estimate. Every unit test called `rlWlTauPrimed` directly and
  passed at 10⁻¹²; the panel printed 1.7×10⁻⁸ and **only the screenshot saw
  it**. When a stage reaches an engine through a wrapper, the wrapper needs its
  own rows in `tests-stages.js` — not the engine's.
- **Ask whether your second route is the first one rearranged.** The moving
  observer's proper time, written back in the parameter t, is
  ∫√((dt′/dt)² − (dx′/dt)²)dt, in which the γ factors cancel *algebraically*:
  the two routes then agree to the last bit whatever the physics, and a test
  that cannot fail is not a test. `rlWlTauPrimed` inverts t′(t) by bisection so
  it never evaluates the analytic derivative at all.
- **A Minkowski pane's two scales must be equal, and only a test can see it.**
  The light cone is at 45° only if a second and a light-second are the same
  number of pixels; stretch one axis to fill the box and the picture is quietly
  drawing a different geometry, while still looking like a picture. `rlWlPane`
  (66cb) widens the **window** instead, and `tests-stages.js` asserts the two
  scales agree on four window shapes.
- **`mathNum(s)` (10-math) is the shared "a number the reader typed" parser.**
  `ctlParse` is its alias in the panel layer. An engine module parsing a typed
  scenario must call `mathNum`: `runtests` extracts only up to the state banner,
  so an engine calling `ctlParse` works in the app and is undefined under test.
- **`mathNum` requires a CONSTANT, and that is load-bearing.** The engine's own
  variables parse perfectly well, so a numeric box fed `x`, `y`, `z`, `r` or
  `rho` evaluated them at the origin and returned a confident **0**; `t` came
  back as the animation clock. It now evaluates at a second point and refuses
  anything that moves, and refuses `t` by name because no choice of x, y, z
  separates it. If you need a box that takes a *function*, use `fnHtml`/`fnWire`
  — not a number box.
- **A stated purpose can be true only in the case its one caller uses.**
  `relDriftVelocity`'s comment claimed "the frame in which E ∥ B" for
  (E×B)/max(E²,B²), which is that frame **only when E·B = 0** — and the one
  caller hid the row unless E·B vanished, while the prose beside it promised a
  parallel frame it never computed. When you make a hidden claim computable,
  check it before you display it. The general root is v/(1+v²) = |E×B|/(E²+B²).
- **Two canvas labels can print through each other and no gate sees it.**
  `auditticks` reads duplicate *ticks* and headings under the *chip*; two
  arbitrary `rlText`/`ctText` labels colliding is neither. `rlEB` drew its
  component read-out straight through its own plot title for as long as the
  stage existed. Only a screenshot finds this class.
- **A derivation rung that says "the panel computes X" is a testable claim about
  the panel.** Two were false on 2026-08-19: `relBoost`'s ladder promised "the
  panel integrates it in the boosted frame and gets the same answer" and nothing
  integrated anything, in a stage whose whole subject is that the flux survives;
  `rlEB`'s prose promised a frame in which E and B are parallel and never
  computed one. Grep the ladders for verbs before believing them.
- **An error that does not respond to resolution is an error in the
  PARAMETERISATION.** `rlGaussFlux`'s polar axis was z while the boost is along
  x, so the field's structure — a band around the motion — fell in φ, where a
  trapezoid grid cannot be refined selectively. A centred charge at β = 0.9
  stuck at 2.7×10⁻⁵ and at β = 0.99 at 6.4×10⁻², and neither moved between 20
  and 800 panels. Align the polar axis with the structure.
- **A coarse Gauss rule's error is not signed.** "A grid that misses part of a
  positive integrand can only lose flux" is a Riemann sum's argument; a Gauss
  node landing inside the peak over-weights it instead. Three panels by eight
  azimuthal points returns 13.30 where the answer is 12.566, and it looks
  exactly as converged as the right answer does.
- **Two frames agreeing is blind to a convention error made in both.** Every
  `rlWire` row compares lab against rest frame, which cannot see a sign flipped
  in the definition of "outward". Pin the sign against physics that has its own
  answer: like currents attract, antiparallel repel.
- **A light clock's arm contracts along the motion, and forgetting it is the
  whole history of the experiment.** `rlClockTick` (46i) places the mirror at
  Lx/γ, not Lx. Without that division the along-the-motion clock ticks 3.125
  against the across-the-motion clock's 2.5 at β = 0.6 — a 25% disagreement
  between two arms of one instrument, which is exactly the fringe shift
  Michelson and Morley went looking for and did not find.
- **"These two events are spacelike" is a condition on the numbers, not a
  property of the setup.** The barn's two door-closings are reorderable exactly
  when L/γ > B(1−β); a short ladder in a long barn makes them timelike, and one
  preset lands them *exactly* on the light cone. Asserting the general case was
  this module's first draft and the tests found the counterexample.
- **One quantity, one control.** `rlDopp`'s preset returned its own β while the
  slider still showed the stage default: the picture was drawn at 0.8 with the
  slider reading 0.7 and nothing to say which produced the answer. A preset may
  SEED a control; it must not become a second source of truth for it.
- **A plot's window has to hold the thing the plot is about.** `rlDyn`'s
  collision scaled to the largest single particle, and the mass shell the
  TOTAL sits on starts at E = m — entirely off the top. Screenshot only.
- **A typed box behind a MODE switch was audited by nothing.** `auditcustom`
  entered each stage once, in the state its author wrote, so every editor
  reached through `st.mode`/`tmode`/`bmode`/… — sixteen of the relativity ones —
  was rendered by no pass and exercised by no gate. It now walks every option of
  every segmented control that is not itself a "type your own" picker. The
  general lesson is the one that keeps recurring: **a gate that enters at the
  default state measures the default state**, and the defect is in the preset
  you did not select (`SITE-RULES` rule zero, point 6).
- **Both electromagnetic invariants can VANISH.** E·B = 0 for any crossed field
  and E² − c²B² = 0 for a null one, so `fmtAgree` on the lab-against-boosted
  residual derives its scale from the round-off and printed a perfect result as
  "100% — agreeing to 0 figures". `rlEB` passes `fmtAgreeGross` the magnitudes
  the cancellation came from: |E||B| for the dot, max(E², B²) for the
  difference, taken in whichever frame is larger. Same class as the ten found on
  2026-08-14; the sweep in `tests-stages.js` pins every preset against a range
  of boosts, and asserts fmtAgree is wrong on at least one of them.
- **A loop counted in the QUANTITY rather than in the work is a hang waiting for
  its input.** `rlMotFrameTwin` drew one dot per year of the stay-at-home's
  clock, and that clock reads sinh(φ)/a: a programme of a = 5 held for ten years
  of ship time puts it at 2.6×10²⁰ years, so `for(k = 1; k <= Math.floor(T); k++)`
  had 2.6×10²⁰ turns and the whole application stopped. Nothing was infinite,
  nothing was NaN, and no gate could see it — the report only ever arrives at the
  end. **`ctUnitMarks(lo, hi, most)` (61a) bounds the OUTPUT**, widening the step
  to a round number until at most `most` marks come back, and returns that step
  so the caption can say "every 10 years" instead of lying about "every year".
  A second instance of the same shape lives in `pbCdfAt` (79f) and was bounded
  the same day, exactly (the tail of both discrete distributions is below
  1e-300 forty standard deviations out) rather than by truncation.
- **`fmtAgreeGross(0, gap, gross)` always reports 100%.** It computes the gap as
  |a − b| and then hands `fmtGap` a scale of `max(|a|, |b|)` — which, with one
  route passed as literal 0, *is* the gap. Six rows in one new wing printed
  "1.32×10⁻⁸ (100% — agreeing to 0 figures)" for a residual that was fine.
  **When only the gap is in scope the formatter is `fmtGap(gap, gross)`**;
  `fmtAgreeGross` is for the case where you have both routes and both can vanish.
- **A `data-audit` that repeats what the box already shows tests nothing.**
  Typing the same text changes no state, so the readout is identical and
  `auditcustom` reports a correctly wired box as unwired — twice on 2026-08-19,
  both because the attribute had been copied from the stage's own default preset.
  The gate now reports that duplication as a finding of its own, because the
  alternative is a box no gate exercises and nobody knows it.
- **A box that does not take an expression must say what it does take.**
  `auditcustom` types `0.37*x^2 + sin(1.7*x)` into every `.fld input`; a box
  expecting a complex number correctly rejects it, and a rejected edit is
  indistinguishable from an unwired box. `fnHtml(id, label, src, vars, audit)`
  and the `audit:` field on a `pk*` slot carry what a gate should type instead —
  the same contract the textareas have had since the circuit netlist.
- **A table that serves two stages needs a label per stage.** `CN_PAIRS` supplies
  a multiplier to `cnPolar` and an ordered pair to `cnPlane`; one `short` field
  labelled the picker `× i` in both, which is right in the first and meaningless
  in the second. Screenshot only — the picker still worked.
- **`esc()` is for what the READER typed. A preset table's prose is authored
  HTML.** `<p class="help">${esc(P.why)}</p>` prints `<b>` as four characters,
  and `auditscan` calls it notation/leakage — five rows in one new wing, and two
  more in the wing before it. Escape `C.xs`, `st.of`, an error message derived
  from an input; never escape a `why`, a `note` or a `demoIntro`.
- **A pane that must have EQUAL SCALES has to ask `ctFitBox` first.** `mkPlot`
  keeps its box on the canvas, so a square chosen from the box you *wanted* comes
  back as a rectangle on a short window — and a complex plane with unequal scales
  draws a shear where the subject is a rotation. `ctFitBox(px, py, pw, ph)` (60a)
  is the clamp `mkPlot` applies, extracted so both callers share one copy;
  `cnPlotFor` (62k) and `csRectPane` (65f) both use it, and `tests-stages.js`
  asserts equal scales on a box deliberately taller than the canvas.
- **Do not stretch a (u,v) rectangle to fill its box.** The cell a reader drags
  in `csGrid` is h×h in those coordinates — genuinely a square — and a stretched
  pane draws it as a bar, so "watch one cell" captions a picture of something
  else. The two axes measure different quantities, which is the reason the
  scales must be shown rather than assumed.
- **`nqDoubleRect` used to throw on an unsupported Gauss order.** `nqGauss`
  guarded with `NQ_GL[k] || NQ_GL[5]`; `nqDoubleRect` wrote `NQ_GL[k || 5]`,
  which is a fallback for a *missing* k and not for an unsupported one — so a
  caller asking for order 6 got `undefined` and a TypeError three frames later
  naming neither the caller nor the order. **`nqGL(k)` is now the only way to
  read that table**, and `tests.js` drives the whole family at six bad orders.
- **A Newton inverse has as many answers as the map has branches.** `csAreaGrid`
  inverts a coordinate map at every cell of a grid to ask which points came from
  the rectangle. Polar has two branches — (r, θ) and (−r, θ+π) name the same
  point — and Newton converged to the negative-r one over two fifths of the
  disc, which was then correctly judged outside and the area came out at 58% of
  π. The cure is **continuation** (start each cell from the last preimage that
  worked, since neighbouring points have neighbouring preimages) plus a spread
  of fallback starts, accepting the point if any of them lands inside. A map
  that is periodic in a variable needs its preimage wrapped as well, and
  `csPeriodic` measures that rather than assuming it.
- **A preset table's entries have a DOMAIN OF VALIDITY, and a control can leave
  it.** Every signal in `DSP_SIGNALS` is a formula written for a two-second
  record. `sigAlias` had the sample COUNT as a slider, so the record was N/f_s —
  anywhere from two thirds of a second to eighty-five — and the chirp named
  "sweeping 1 → 14 Hz" reached 70 Hz while the folding map's axis ran to 110.
  Nothing raised, nothing was NaN, and every gate was green. The cure was to
  remove the control, not to widen the table: the record is now `DSP_DUR` and
  `tests-stages.js` asserts it at six rates. **Name a preset by the property that
  belongs to the FORMULA, not by the one that belongs to the record** — the chirp
  is "rising 6.5 Hz every second", which is true whatever you show of it.
- **A quantity computed over a span the reader cannot see must say which span.**
  `sigAlias` filters twice the record it draws, because `dspReconOrder` asks the
  same question of a record twice as long — so `dspGuard`'s own "fraction kept"
  describes a stretch of signal nobody is looking at. On a chirp the two answers
  are 40% and 84%. `dspKept(G, n)` takes the span; the whole-array form is the
  one that was wrong.
- **A peak, a centroid or a ratio computed from a record with no energy in it is
  not a measurement.** An AM carrier sampled at exactly twice its own frequency
  lands on the same phase every time, and with these sidebands every sample is
  **exactly** zero; `dspPeakFreq` then fitted a parabola to three logarithms of
  10⁻³⁰⁰ and returned a confident 11.95 Hz. It returns `null` and the panel says
  "every sample of this record is zero". Same family as `igLamina`'s massless
  centroid — and `fmtNum(NaN)` renders `—`, so the NaN grep cannot see either.
- **A derivative does not exist where the function is not differentiable, and
  printing a number there is worse than printing nothing.** The group delay is
  −d(arg H)/dω; at a zero of H on the unit circle arg H jumps by π, and
  differencing across that gave the difference filter **−24 999.5 samples** at
  DC — finite, plausible, and a phase discontinuity wearing the units of a
  delay. Both `dspGroupDelay` and `dspGroupDelayNum` return `null` there, and
  the guard must test the CENTRE frequency: a guard comparing the two
  neighbours to each other passes happily, because at a zero they are small and
  equal.
- **A property that follows from a numerator does not follow from H.** Symmetric
  taps force linear phase because reversing the list leaves it unchanged — an
  argument about `b` that survives only when there is no `a` dividing it. A
  two-pole resonator with one feed-forward tap has a trivially palindromic
  numerator, and the panel read "linear phase, delay 0 samples" for it. The fix
  is a named `dspLinearPhase(b, a)` rather than `dspSymResid(b) < 1e-12` at the
  call site, so a second call site cannot get it wrong. **Only the screenshot
  could have found this.**
- **A closed form drawn beside a measurement must be the SAME quantity.** The
  window stage draws its spectrum twice — an FFT of the windowed samples and a
  sum of Dirichlet kernels — and a real cosine is half a positive-frequency
  exponential and half a negative one, so X[k] = ½[W(k−f₀) + W(k+f₀)]. Dropping
  the second term agreed **perfectly** while the tone sat on a bin, because the
  image's kernel has an exact zero at every bin, and disagreed by 21 dB the
  moment it moved off one. Two routes that agree at the default and nowhere else
  is the signature; `tests-stages.js` sweeps the offset for exactly that reason.
- **A declared ZERO needs a residual check, not a relative one** — including
  inside a gate. `auditclaims`' `num()` divides by the declared value, so three
  filters declaring an exact zero gain read as infinitely wrong on the block's
  first run. `resid()` is the form. Same defect as `fmtAgree` on two vanishing
  routes, one layer up.
- **`ftPanes` runs its lower plot to within ten pixels of the canvas floor.**
  `plotFrame` then clamps that plot's x-label to fourteen pixels up and
  `stageNote` writes at eight, so on a short canvas they print through each
  other. `dspPanes` (64d) reserves the band instead; the Fourier wing gets away
  with it only because its lower axis labels are short.
