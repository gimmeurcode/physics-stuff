# Working in this repository

An interactive mathematics and physics laboratory: 48 wings, 820 guided experiments,
built from `src/` into one self-contained `vector-calculus.html`.

**Read `SITE-RULES.md` first.** It is the constitutional layer — the nine laws
the site obeys, and the rule that a defect found in one wing is fixed in every
wing it exists in. It outranks every other document here: a mechanical rule that
cannot be reconciled with it is a bug in the mechanical rule.

**Then `MASTER-PLAN.md`.** It is the single source of truth for what is
built, what is left, the mechanics that satisfy the rules, and the
session-by-session instructions. It replaced `ROADMAP.md`, `TIER-THREE-ITEMS.md`
and `SYLLABUS.md`, which are gone.

**Then `AI-GUIDE.md` before making changes.** It has the recipes ("to add a demo,
edit these two files"), the conventions, and the traps that have cost real
debugging time. `MAP.md` is the generated index of every module, stage and wing —
use it to find things instead of grepping blind.

**Counts go stale within a session — measure, do not quote.** `./smoke.ps1`
reports wings and stages; `./build.ps1` reports modules; `./runtests.ps1` reports
tests; `./measure.ps1` reports the rest.

**And the documents are part of the deliverable.** A change that moves a count,
adds a script, or alters a rule is not finished until the `.md` files say so —
`SITE-RULES.md` §1.9 is the rule and **`./auditdocs.ps1` (`bad=0 OK`) is the
gate**. It re-measures the site and fails on any document that contradicts it, so
"I will update the docs later" now shows up as a red build. A figure on a line
carrying a `YYYY-MM-DD` is read as a dated record and exempted; an undated one is
a live claim and must be true.

## Rule zero — fix the class, never the instance

`SITE-RULES.md` says a defect found in one wing is fixed in every wing it exists
in. In practice that is stronger than it sounds, and it is the rule most often
broken by accident:

1. **The screenshot is a symptom; find the root cause and count its instances
   before writing any fix.** J9 arrived as "two stages print round-off". Grepping
   the *cause* found 110 rows across the site making the same claim, and a gate
   that rendered every panel found **55 of them defective in 44 stages across 20
   wings**. A fix to the two screenshotted stages would have left 53.
2. **Prefer a fix that makes the defect unrepresentable over one that repairs
   each site.** `fmtGap(gap, scale)` still lets a caller pass the wrong scale at
   sixty sites; `fmtAgree(a, b)` takes the two numbers and *derives* the scale,
   so it cannot be got wrong. Reach for the second shape.
3. **Then build the gate that measures the EFFECT, and watch it fail.** Grep the
   cause in `smoke.ps1` if you like, but the gate must read what the site
   actually renders, or the next way of getting it wrong is invisible. Corrupt
   one site back and run it: a gate never seen to fail is not known to work.
   `auditresid.ps1` was written this way and found a chip surface its first
   version could not see at all.
3a. **A check can also pass by never being evaluated, and that looks identical
   to passing.** On 2026-08-19 three assertions in a new wing's stage-test block
   were vacuous; the headline one read `kSD === null || kSD/kCG > 2`, and `kSD`
   was `null` at every input the stage can produce, so the comparison had never
   once run. **Any condition with a "no result" branch needs proof that the
   branch is not the only one taken** — the same discipline as corrupting the
   claim, applied to the test's own control flow rather than to its subject.
   The two replacements for it were then wrong in turn, each visible only at a
   second preset: `MASTER-PLAN` §3.3a has the sequence, and the general shape is
   §1.7's — a quantity that is defined is not thereby the quantity you want.
4. **Attribute before you fix, and let the measurement overrule you.** The same
   sweep found `qmShoot` normalising a fourth-order Numerov solution with a
   second-order trapezoid — visually identical to J9. It is not: a bound state
   vanishes at both walls with all its derivatives, so by Euler–Maclaurin the
   trapezoid is superconvergent there and the two rules agree to 2e-16. The test
   asserting the "obvious" h² was written, run, and **failed**. Record that
   where the next reader will look, so the resemblance is not "fixed" again.
5. **Say which instances you did not fix, and why.** Scaling the work down is
   the reader's call, not yours.
5a. **A preset table's entries have a domain of validity, and a control can walk
   out of it — silently, with every gate green.** On 2026-08-19 every signal in
   the new `DSP_SIGNALS` was a formula written for a two-second record, and the
   sampling stage had the sample COUNT as a slider, so the record was N/f_s:
   anywhere from two thirds of a second to eighty-five. A chirp named "sweeping
   1 → 14 Hz" reached 70, and the folding map's axis ran to 110. Nothing raised,
   nothing was NaN, `runall`, `auditsides` and `auditclaims` were all green, and
   **only the screenshot showed it**. Two rules come out of it. Remove the
   control rather than widening the table — the record is now a constant and
   `runstagetests` asserts it at six rates. And **name a preset by the property
   that belongs to the formula, not the one that belongs to the record**: the
   chirp is "rising 6.5 Hz every second", which is true whatever you show of it.
6. **A condition that is necessary is not therefore sufficient — and the
   default preset is exactly where you will not find out.** On 2026-08-18
   `rlApsidesEL` solved V²(r₁) = V²(r₂) = E² and called the result an orbit. It
   is an orbit when those radii bracket a well and a *barrier* when they do not,
   the region between being forbidden; Schwarzschild **cannot** produce the
   second case, so the formula looked finished for as long as only Schwarzschild
   was tried. Adding a cosmological term produced it immediately and the "bound
   orbit" escaped to forty times its apocentre. The same run's other defect had
   the same shape: "take the outermost two turning points" is right on the three
   roots Schwarzschild has and wrong on the four that metric has. **Both were
   found by `./auditsides.ps1` and `./runstagetests.ps1` driving the presets the
   default is not** — which is what those two gates are for, and neither
   `runtests` nor `runall` could have seen either.
7. **And that fix was itself insufficient, the same day — because a fix has
   blind spots of its own.** The barrier guard scans the *interior* of the two
   apsides, so it cannot see either of the two failures that remained, both of
   which are statements about the **slope at an apsis**: an apocentre at the top
   of the outer barrier (V² falls again just *outside*, so it is an unstable
   circular orbit and the particle goes over it) and a pericentre with no wall
   under it (V² falls just *inside*, so the orbit plunges). de Sitter apsides 10
   and 13.53 satisfied L² > 0, V²(r₁) = V²(r₂) = E², **and** a genuine well
   between them — and the track escaped. Two lessons, the second more general
   than the first. **(a) When you fix a necessary-not-sufficient condition, ask
   what the fix itself does not look at** — a scan of an interval is blind to
   its endpoints by construction. **(b) "Only the exotic preset does this" was
   wrong**: the plunge half is *Schwarzschild*, for any pericentre inside the
   unstable circular orbit of that L, and `rlMetric`'s own slider reached it at
   r₁ = 5.5. Believing a defect belongs to the strange preset is what let it
   look finished the first time. Found by driving the two routes against each
   other over a sweep of apsides — the four cases where the integrator
   disagreed with the quadrature were the four defective ones.

**Two different errors get called "floating point", and they need opposite
fixes.** *Round-off* is ε·κ·‖x‖ and shrinks only with precision — a relative
floor is the answer, never a bigger `sig`. *Truncation* is a discretisation
error, has an **order**, and shrinks with h; more precision does nothing for it.
J9's headline 7.8% was truncation — float64 noise on that same sum was 3e-15,
eleven orders smaller. Measure which one you have by **halving h**: truncation
falls by 2^p, round-off does not move.

**And a third gets called that too, with a third cure: a quantity stored at the
wrong origin.** An inspiral track reaching its end 5.2×10¹⁶ s after the start in
steps of 2×10⁻⁵ s has one ulp of **eight seconds** there, so the last stretch of
its elapsed-time array is a single repeated float and every derivative taken
against it is meaningless — 33% wrong, on 2026-08-18, while the short runs beside
it passed at 10⁻⁸. Neither a relative floor nor a smaller h touches this. **Carry
the quantity that is small where you need it** — the time *remaining*, summed
backwards from the end. Its signature is a defect that appears only on the
presets with the widest dynamic range, which is why only a preset sweep finds it.

## The three rules that matter most

1. **Never edit `vector-calculus.html`.** It is generated. Edit `src/` and run
   `./build.ps1`. The same goes for `MAP.md` — run `./map.ps1`.
2. **Module load order is the filename order.** `build.ps1` concatenates
   `src/js/*.js` by *ordinal* filename sort into one script scope. A file named
   `60b-` loads after `60a-` and before `61-`. All 308 modules share one global
   namespace, so **name collisions are silent** — prefix new engine functions
   (`nq`, `ga`, `pc`, `mv`, `ig`, `vc`, `od`, `ct`, `ck`, `rl`, `qm`, `dy`, `tm`, `la`,`sk`, `lp`, `mx`, `fn`, `lt`, `sy`, `ph`, `cx`, `df`, `ag`, `pb`, `nm`, `nc`, `sl`,`sm`, `pv`, `gw`, `sn`)
   and grep case-sensitively before choosing a name. **The same applies to
   element ids** — one document, `getElementById` is first-wins, and two panels
   both using `ciR` meant a `wireSlider` call reached whichever came first.
3. **Verify before claiming done.** Run `./smoke.ps1` first — it takes ten
   seconds and tells you whether the bundle parses and boots at all. One script
   scope means a single stray character takes the whole app down, and the unit
   suite only sees the engine section (10-49) and would not notice. Then
   `./runtests.ps1` must print `0 failed`
   (6948 unit tests), and `./runstagetests.ps1` must print `0 failed` — it calls
   stage helpers **directly** inside the booted bundle, which is the only way the
   stages' own arithmetic (modules ≥ 50, invisible to `runtests`) is tested; a
   stage defect class fixed adds its two-route test to `tests-stages.js` the
   same day. For anything touching demos or the UI, `./runall.ps1` must end
   `caught=0 OK` — it takes ~18 minutes, so run it in the background — and
   `./auditcustom.ps1` must end `bad=0 OK`, because `runall` never selects the
   "type your own" option and so never exercises that path at all.

   **The three panels are stateful — `#stageReadout`, `#deriveBody`, `#chip`.**
   `uiSetHtml` (`80a`) skips a write whose HTML matches what it last wrote, and
   keeps that marker on the element, so **every write to those three must go
   through it**. A direct `.innerHTML =` leaves the marker describing a DOM that
   is gone and the next identical refresh is skipped — the panel silently keeps
   stale content, or none. On 2026-08-13 `stageExit` doing this blanked **145 of 178 stages**
   on re-entry while `runall` still reported `caught=0`. `smoke.ps1` greps for
   the cause; **`./auditpanel.ps1` (`bad=0`) measures the effect** — run it for
   anything touching a panel write.

   **For anything touching a control — its id, its wiring, or what writes its
   box — also `./auditlink.ps1` (`findings=0`).** A permalink encodes the
   reader's whole view as `#w=…&d=…&c.<id>=…`, so **element ids are a key space**
   and a duplicate id is a defect (`ciR` belonged to two sliders in one dock).
   It is the only gate that asks whether a control's value can be written
   **back**, and that question alone found six defects: `fmtNum` writes U+2212
   and real superscripts, so **a display formatter in an editable box cannot be
   read back** — `parseFloat('−0.7')` is `NaN`, and `|| 0` turned it into a
   silently wrong unit vector. **Use `fmtEdit` for anything the reader types
   into**, `fmtNum` only for what they read.
   Its two routes matter: comparing the *controls* passed on a build where the
   restore filled every box and told no stage anything, so it also compares the
   text the visible panels **print from** those controls.

   **For anything touching a preset table, or any property one declares, also
   `./auditclaims.ps1` (`bad=0 OK`).** The tables assert things about themselves —
   `conservative`, `exactArea`, `exactVol`, `closed`, `limit`, `mono`, `sum`,
   `root`, `Fi` — and until it existed nothing recomputed a single one of them.
   It checks 249 claims across 14 tables by routes that share nothing with the
   declaration, and it reaches `EIG_PRESETS` (78b) and `NM_FUNCS` (79g), which sit
   outside the 21–49 window `runtests` extracts and so can never be unit-tested.
   **Set its tolerances from the second route's own measured error, never from a
   guess**, and when you add a check, corrupt the claim once to watch it fail —
   a gate that has never been seen to fail is not known to work.

   **For anything touching `mkPlot`, `plotCurve` or the viewport, also
   `./auditzoom.ps1` (`findings=0`) and `./auditframe.ps1`.** `auditzoom` proves
   the pan/zoom layer works on all 226 stages *and* that with no interaction
   `mkPlot` still returns exactly the window it was handed — the invariant that
   keeps the viewport invisible to stages that know nothing about it.
   `auditframe` measures how much of each curve falls outside its own window and
   **fails on a `CUT`**: a tangent line leaving the frame is correct, a parabola
   losing both arms is not, and it distinguishes them. Three stages are allowed
   by name, each with the mathematics that makes its cut the point of the
   picture; add a fourth only with a reason that survives being read aloud.
   **The failure mode it exists for is a window fitted to SOME of the curves a
   stage draws** — `odSpring` fitted its resonance window to the reader's
   damping while plotting three, and the lightest damping has the tallest peak,
   so the one curve worth seeing was the one clipped. Fit over the same list you
   draw from, and make it literally the same list.

   **For anything touching a tick label, an axis, or a heading drawn on the
   canvas, also `./auditticks.ps1` (`auditticks OK`).** It wraps `fillText` and
   reads the strings the canvas actually paints — the one surface no other gate
   can see. Two checks: **duplicate tick labels** in one row or column
   (`fmtNum`'s decimals clamp collapsed any axis with span ≲ 0.01 into
   `0.002, 0.002, 0.002 …`; **`fmtTick(v, step)` is the only tick formatter** —
   its precision comes from the step, and both axis owners use it), and
   **headings under the readout chip** (`plotFrame`/`ctFrame` titles slide
   clear via `ctTitleClearChip`; a raw `fillText` caption must start below or
   right of the chip zone). It carries corrupt controls in every run.

   **For anything inside a `frame()`, also `./auditperf.ps1`.** It counts the
   work a frame does, because nothing else measures cost at all. **A per-cell or
   per-sample draw belongs in a bitmap, not in `frame()`** — build an
   `ImageData`, `putImageData` it to an offscreen canvas sized in *cells*, and
   `drawImage` that into the box. Five loops of this shape were converted on
   2026-08-13 (`ctHeat`, `cxPaint`, `rtInertia`, `smIsing`, `vcGreen`); **copy
   one rather than writing a sixth by hand.** Under ~400 paint calls per frame
   is comfortable; over ~1 200 is not. The site ships to a Claude artifact,
   which shares one main thread with the host app and has the least headroom of
   any target, so this is not theoretical.

   **Attribute before you optimise.** A large path-op count is not a large cost:
   `ctContour`'s 25 450 path ops are already inside 16 batched paths, and reading
   them as the problem sent MASTER-PLAN §3.5 after the wrong item. Measure which
   helper spends the calls. And **do not batch a depth-sorted translucent mesh** —
   subpaths of one path fill by the nonzero rule, so opposite-wound quads cancel
   and "fixing" the winding fills in gaps that are real geometry (`wsCY`).

   **For anything that draws, also `./auditsize.ps1` (`findings=0`) and
   `./auditviewport.ps1` (`bad=0`).** Every other script runs at one window size,
   so a layout that only breaks at a different aspect ratio is invisible to all
   of them — and a label drawn off the canvas is drawn, discarded and reported by
   nothing. `auditsize` sweeps eight canvas shapes across all 226 stages;
   `auditviewport` launches Chrome at sixteen real window sizes and checks the
   page around the canvas. They found 161 findings on their first run.

## Displaying mathematics

Mathematics must render as real notation, never ASCII. `x²` not `x^2`, `√` not
`sqrt`, `±` not `+/-`, `θ` not `theta`, `ħ` not `hbar`, `−` (U+2212) not a hyphen.

- **HTML panels** (`kv()` labels, `<p class="help">`, readouts, theory prose) may
  use `<sub>`/`<sup>`. Caret exponents are converted automatically by `supify()`
  at render time, so `e^(-x^2)` in a source string typesets correctly.
- **Canvas text** (`stageNote`, `ctText`, `R.label`, `ctx.fillText`) gets no
  markup — `<sub>` would be drawn literally. Use Unicode, or reword. Unicode has
  no subscript for `y`, `b` or `c`, so prefer `∂f/∂y` or plain words there.
- **Expression strings are not display strings.** `f:`, `P:`, `Q:`, `R:` and
  `src:` are parsed by the maths engine and must stay ASCII (`x^2 + y^2`). The
  `ex:` field beside them is the display copy. Never "fix" the parsed one.

## Accuracy

Physical constants are CODATA 2022 and particle data PDG 2024, and unit tests pin
them. A claim that two quantities are equal is only made after computing **both**
independently and printing the difference. "Exact" means a closed form or
adaptive quadrature at 1e-13, never a quoted value. Convergence orders are
measured by halving h, not asserted. See `AUDIT.md` for what has been checked.

Never let the literal word `undefined`, `NaN` or `Infinity` reach a readout —
`runall.ps1` greps for them and fails the build. Write "not defined there" or
"vertical tangent — no slope" instead.

**A residual is not a measurement, and it is meaningless without its scale.**
1e-4 J is a triumph beside 1 J and a catastrophe beside 1e-3 J. Print a
difference with `fmtAgree(a, b, unit)` — it derives the scale from the two
routes — or `fmtGap(gap, scale, unit)` where only the gap is in scope,
`fmtAgreeTight`/`fmtGapTight` on a **canvas** (same verdict, no prose, fits a
fixed column), and `ckGap`/`ckEngF` inside a circuit. **Never `fmtNum`**: its
exponent term is clamped at zero, so below 1 its `sig` counts *decimals*, not
figures, and a real gap anywhere in `[1e-4, 5×10⁻ˢⁱᵍ)` prints as `"0"` — which
is how a 100% disagreement once read as success in the affirmative colour.
`fmtSig` is the significant-figure formatter for anything whose whole meaning is
its size. **Never `toExponential`** (ASCII `8.10e-11` where §1.7 wants
`8.10×10⁻¹¹`, and no scale) and **never `toFixed`** on a residual — it rendered
a perfect fit as `0.00000`. Those are the same defect in three spellings.
**When both routes can legitimately vanish, `fmtAgree` cannot get it right and
`fmtAgreeGross(a, b, gross, unit)` is the form.** Its derived scale is
`max(|a|,|b|)`, which becomes the round-off itself once the quantity is zero —
so a perfect result printed as a 100% disagreement. `gross` is what the zero
cancelled: `∮|F||dr|`, `∬|F||dS|`, `∮|f||dz|`, `∬|ρ|dA`, kT. **Magnitudes, not
`|F·n̂|`** — a swirl is tangential to every sphere, so that form is zero too.
**`./auditsides.ps1` drives every preset a reader can select and fails on a new
one**; it is also the only gate that asks whether the two routes *agree* rather
than whether the difference is *formatted* properly.

**`./auditresid.ps1` (`findings=0`) fails on a difference printed as bare `0` or
as unscaled round-off, across five rendered surfaces — readout, chip, derive
ladder, legend, and the `*Own` reader-supplied panels.** It cannot read a
canvas, and its `noscale=` count is advisory: no regex separates a two-route
residual from a physical difference, so read that list by hand.

