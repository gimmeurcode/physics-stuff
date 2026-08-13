# Working in this repository

An interactive mathematics and physics laboratory: 40 wings, 593 guided experiments,
built from `src/` into one self-contained `vector-calculus.html`.

**Read `MASTER-PLAN.md` first.** It is the single source of truth for what is
built, what is left, the rules anything new must be written to, and the
session-by-session instructions. It replaced `ROADMAP.md`, `TIER-THREE-ITEMS.md`
and `SYLLABUS.md`, which are gone.

**Then `AI-GUIDE.md` before making changes.** It has the recipes ("to add a demo,
edit these two files"), the conventions, and the traps that have cost real
debugging time. `MAP.md` is the generated index of every module, stage and wing —
use it to find things instead of grepping blind.

**Counts go stale within a session — measure, do not quote.** `./smoke.ps1`
reports wings and stages; `./build.ps1` reports modules; `./runtests.ps1` reports
tests.

## The three rules that matter most

1. **Never edit `vector-calculus.html`.** It is generated. Edit `src/` and run
   `./build.ps1`. The same goes for `MAP.md` — run `./map.ps1`.
2. **Module load order is the filename order.** `build.ps1` concatenates
   `src/js/*.js` by *ordinal* filename sort into one script scope. A file named
   `60b-` loads after `60a-` and before `61-`. All 230 modules share one global
   namespace, so **name collisions are silent** — prefix new engine functions
   (`nq`, `ga`, `pc`, `mv`, `ig`, `vc`, `od`, `ct`, `ck`, `rl`, `qm`, `dy`, `tm`, `la`,`sk`, `lp`, `mx`, `fn`, `lt`, `sy`, `ph`, `cx`, `df`, `ag`, `pb`, `nm`, `nc`, `sl`,`sm`, `pv`)
   and grep case-sensitively before choosing a name.
3. **Verify before claiming done.** Run `./smoke.ps1` first — it takes ten
   seconds and tells you whether the bundle parses and boots at all. One script
   scope means a single stray character takes the whole app down, and the unit
   suite only sees the engine section (10-49) and would not notice. Then
   `./runtests.ps1` must print `0 failed`
   (4175 tests). For anything touching demos or the UI, `./runall.ps1` must end
   `caught=0 OK` — it takes ~18 minutes, so run it in the background — and
   `./auditcustom.ps1` must end `bad=0 OK`, because `runall` never selects the
   "type your own" option and so never exercises that path at all.

   **The three panels are stateful — `#stageReadout`, `#deriveBody`, `#chip`.**
   `uiSetHtml` (`80a`) skips a write whose HTML matches what it last wrote, and
   keeps that marker on the element, so **every write to those three must go
   through it**. A direct `.innerHTML =` leaves the marker describing a DOM that
   is gone and the next identical refresh is skipped — the panel silently keeps
   stale content, or none. `stageExit` doing this blanked **145 of 178 stages**
   on re-entry while `runall` still reported `caught=0`. `smoke.ps1` greps for
   the cause; **`./auditpanel.ps1` (`bad=0`) measures the effect** — run it for
   anything touching a panel write.

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
   the pan/zoom layer works on all 178 stages *and* that with no interaction
   `mkPlot` still returns exactly the window it was handed — the invariant that
   keeps the viewport invisible to stages that know nothing about it.
   `auditframe` measures how much of each curve falls outside its own window,
   and is a report rather than a pass/fail: a tangent line leaving the frame is
   correct, a parabola losing both arms is not, and it distinguishes them.

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
   nothing. `auditsize` sweeps eight canvas shapes across all 178 stages;
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

