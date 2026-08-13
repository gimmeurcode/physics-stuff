# MASTER PLAN

**The state of the laboratory, the rules it is built to, and everything left to do.**

Written 2026-08-12. This document replaces `ROADMAP.md`, `TIER-THREE-ITEMS.md`
and `SYLLABUS.md`, which have been deleted; everything in them that was still
live is here, with their counts corrected against a measurement rather than
carried forward.

---

## How to use this document

| you are | read |
|---|---|
| **starting a session cold** | **§4.1 (three commands), then §4.3 (what to work on) and §4.3a (the order that avoids rework)**. Do not read Part 3 end to end — go to the one programme §4.3 sends you to |
| about to write anything | Part 2 — **the rules**. Non-negotiable |
| choosing what to work on | **§4.3**, which is ordered by what makes the *next* work cheaper. Part 3 has the detail once you have picked |
| deciding *how* to sequence a change | **§4.3a** — machinery before instances, fix a pattern before replicating it, batch by gate |
| changing existing code | `AI-GUIDE.md` for the mechanics, Part 5 here for the traps |
| looking for a file | `MAP.md` (generated — run `./map.ps1`) |
| needing a count | **`./measure.ps1`** — never grep for one, never quote one from prose |
| wondering if something was checked | `AUDIT.md` (the accuracy record) |
| about to reopen a settled question | **§1.7** first — several are already decided with reasons |

**The short version, 2026-08-13 (revised).** The build is green on every gate.
**Programme E — performance — is done** (§3.5): the 17 stages over 1 200 paint
calls per frame are down to 2, the 2-D mean from 569 to 131, and the panel
rebuild from 2.86 MB/s of HTML to nothing. The next work in order is now
**delivery (§3.9), then the permalink, then verification items D2–D3, then new
subject matter.** Delivery leads because it is small and it unblocks showing
anyone anything, and it is now **mostly prepared**: Git is installed, this is a
working tree, and `.gitignore` is verified against a real dry run (§3.9). What
is left there is a commit identity and the push.

Three documents survive alongside this one and are not duplicated here:

- **`AI-GUIDE.md`** — *how* to change things: the recipes, the toolkit APIs, the
  layout system. Orientation for editing.
- **`AUDIT.md`** — the accuracy record. What was wrong, what it says now, how the
  correction was checked. Append to it; never start a new file.
- **`MAP.md`** — generated index of every module, stage and wing. Use it instead
  of grepping blind.

`CLAUDE.md` and `src/js/CLAUDE.md` carry the short form of the rules for agents
that read nothing else. If you change a rule here, change it there too.

---

# PART 0 · The state, measured

Everything below was measured on **2026-08-12** against the current build, not
copied from an earlier document. The commands that produced each number are
given so the next session can re-measure rather than trust.

| quantity | value | how it was measured |
|---|---|---|
| wings | **40** | `./measure.ps1` (and `./smoke.ps1` → `wings=40`) |
| guided experiments | **593** | `./measure.ps1`, from `WINGS[*].groups[*].items` in the booted app |
| demo groups | **118** | same. **Do not grep `src/` for this** — patterns return 89 or 105 |
| experiments driving a canvas stage | **508** | same (the other 85 drive the field pipeline) |
| canvas stages | **178** | `./smoke.ps1` → `stages=178`; `./measure.ps1` confirms `unreachablestages=none` |
| source modules | **230** | `./build.ps1` |
| deployable size | **5 351 740 bytes** (5.35 MB / 5.1 MiB) | `./measure.ps1`. **`build.ps1` prints ~5 294 000, which is a CHARACTER count** — the Unicode maths symbols cost ~57 KB more as UTF-8 bytes. Both are far inside any upload limit. **A fresh `git clone` builds ~15.6 KB smaller**: `.gitattributes` normalises line endings to LF and 54 of the source files carried CRLF when this was measured, which is 15 627 carriage returns. The app is identical — but this is why the row says *measure*, not *quote* |
| source lines | ~75 930 (all of `src/`) | `./measure.ps1`; `./map.ps1` reports `src/js` alone |
| unit tests | **4175 passed, 0 failed** | `./runtests.ps1` |
| declared table claims | **249, bad=0** | `./auditclaims.ps1` |
| "See it in the laboratory" links | 80, all resolving | `./smoke.ps1` → `seelinks=80` |

**The stale numbers you may find elsewhere.** `CLAUDE.md` and `AI-GUIDE.md` said
584 experiments, 222 modules and 3759 tests; the retired `ROADMAP.md` said 555 /
213 / 2460 and `TIER-THREE-ITEMS.md` said 214 / 2938. All were true when
written. The figures in the table above are the current ones. **A count in prose
goes stale within a session — measure before quoting.**

## The invariant that must hold on every build

```
./build.ps1     → 230 modules, no error
./smoke.ps1     → smoke OK        (parses, boots, nav agrees, no ctText shift)
./runtests.ps1  → 0 failed
```

**A claim in a preset table is not covered by any of those three.** `./auditclaims.ps1`
(~30 s) is the fourth, and the only thing that recomputes what the tables assert
about themselves.

**Nothing above measures cost.** `./auditperf.ps1` (~40 s) is the fifth, and the
one guess ever made without it — that the 3D stages were the expensive ones — was
wrong by a factor of forty. Run it before optimising anything, and after adding
any stage that draws per-cell or per-sample.

If those three do not pass, nothing else matters and nothing else is worth
running.

---

# PART 1 · What is built

## 1.1 The shape of the thing

```
src/head.html      <- <meta>, title
src/styles.css     <- the whole design system
src/shell.html     <- the DOM skeleton (header, canvas, dock, rail, palette)
src/js/*.js        <- 230 modules, concatenated in ORDINAL filename order
        |
        v  ./build.ps1
vector-calculus.html   (5 339 257 bytes, the deployable artifact)
```

No build step beyond concatenation. No dependencies, no network, no framework.
Everything on screen is computed live from the actual mathematics.

**Never edit `vector-calculus.html`.** It is overwritten on every build. The same
goes for `MAP.md` — run `./map.ps1`.

## 1.2 The forty wings

The wing order **is the curriculum** — a wing sits where its prerequisites are
already behind it. That order is written in three separate places (the topbar
`.navgroup` menus in `src/shell.html`, the home cards, and `NAV_GROUP_OF` in
`81-ui-nav.js`) and `smoke.ps1` now checks all three agree on **membership and
order**. They had drifted before that check existed: the home page was showing
31 cards, nine wings had none, and one had two.

Grouped as the seven menus present them:

1. **Precalculus** — algebra, functions, trigonometry
2. **Single-variable calculus** — limits, derivatives, integrals, series, ODEs
3. **Multivariable & vector calculus** — vectors/geometry, curves, partial
   derivatives, multiple integrals, vector calculus, differential forms,
   potential theory
4. **Linear algebra** — systems/matrices/determinants, vector spaces &
   orthogonality, eigenvalues/diagonalisation/SVD
5. **Advanced methods** — Laplace transforms, linear systems of ODEs, nonlinear
   dynamics & the phase plane, complex functions & contour integrals, Fourier,
   probability & statistics, numerical methods
6. **Classical physics** — mechanics, rotation, energy & momentum of rotating
   systems, waves, fluids, thermodynamics, electromagnetism, circuits, optics
7. **Modern physics** — relativity, quantum, the atom, nuclear, condensed matter
   & semiconductors, statistical mechanics, string theory & holography

`MAP.md` has the authoritative per-wing table: id, glyph, title, and which files
hold its demos, stages and prose.

## 1.3 The engine layer (modules 21–49)

Pure, DOM-free, unit-tested. This boundary is **load-bearing**: `runtests.ps1`
extracts everything between the `"use strict";` anchor and the `APPLICATION
STATE` banner at the top of `50a-state.js` and runs the suite against it.
Anything a test needs must live below 50 and must not touch the DOM.

What exists: an expression parser with symbolic differentiation; adaptive
quadrature (1-D, double rectangular, double polar, triple spherical, Gauss–
Legendre); ODE integrators with **measured** order; linear algebra to the SVD; a
nodal circuit solver; Lorentz boosts and Schwarzschild geodesics; exact
hydrogenic wavefunctions; Numerov bound-state solving; transfer-matrix
scattering; a power-of-two FFT; the semi-empirical mass formula with a
least-squares fit; Bloch bands from an arbitrary unit cell; a cell decomposition
for typed charge and current densities; paraxial and real ray tracing; Ising
Monte Carlo; and the parsers behind every reader-supplied scenario.

**Reference data is CODATA 2022 and PDG 2024**, pinned by `tests.js`. Where a
value is exact by SI definition (c, h, e, k_B, N_A) that is recorded rather than
given a tolerance.

## 1.4 What every stage carries

All 178 stages define the full set, and `smoke.ps1` fails the build if any is
missing:

```js
STAGES.<id> = { title, enter, controls, wire, frame, readout, chip, legend, derive }
```

Optional: `drag:true` (routes pointer down/move/up into `pick(st,sx,sy,phase)`),
`mode:'3d'` (depth-sorted renderer; **the core does not clear the canvas** —
that is `em3dBegin`'s job), `dockLegend:true`.

- **`derive(st)`** returns `{title, steps, note}` and renders into "Where this
  comes from". All 178 have one. Measured 2026-08-13 by `./auditderive.ps1`:
  **865 numbered steps, 790 reasoning rungs, 39 761 words**, median 4 rungs and
  212 words per ladder.
- **The formal layer** (`83-statements.js`) gives the essays definitions,
  theorems, lemmas and corollaries with proofs and links to the experiment that
  shows them. Measured 2026-08-13 by `./auditscan.ps1`: **86 statements, 75 with
  proofs, 80 linked to an experiment**, **0 wings without one**.
- **The plot viewport** (`59c-plot-view.js`) gives every `mkPlot` box pan, zoom
  and clip — **250 call sites** in `src/`, of which `./auditzoom.ps1` sees **161
  live plots across 103 stages** in the default state (the rest are behind a mode
  switch). **Identity at rest is the invariant**: with no reader
  interaction `mkPlot` returns exactly the four numbers it was handed, which is
  what made it safe to add under 178 stages that know nothing about it.

## 1.5 Reader-supplied input

Every numeric control is already typeable — `ctlSlider` emits a `.sldnum` box,
and a typed value is **not** bounded by the slider's min/max (the thumb pins, the
stage uses what was asked for). `ctlParse` accepts anything the expression engine
does, so `pi/4` and `sqrt(2)` are valid entries.

Beyond that, stages accept a reader's own *function, field, matrix, region,
sequence or scenario*. The work was planned in three tiers:

| tier | what it needed | status |
|---|---|---|
| **1** — the quantity is a function the wing already keeps in a table | the `pk*` picker retrofit, ~an afternoon each | **done**, ~20 stages |
| **2** — needs numerical machinery that did not exist | a real piece of work each | **done, all twelve** |
| **3** — physics stages needing a *scenario* rather than a function | one engine + one editor each | **33 of 75 done** (see 3.1) |

Four of the Tier 1 stages **needed nothing** and should not be reopened:
`agQuad`, `agLog`, `agCircle`, `agTriangle` have no author's function at all —
the quantity *is* the sliders. Two more were deliberately not given one:
`igPolar` and `igCylSph` are *derivations* of the area and volume elements, with
no author's function to replace; the "r(θ) region" slot went instead to
`igRegion` and `igMass`, where regions are actually integrated over.

## 1.6 The verification harness

**21 scripts** (`Get-ChildItem *.ps1` — the table below lists them all; the
"nine" this line used to claim was wrong for a long time). What matters is
**what each one can see that the others cannot** — every one of them exists
because something shipped through a blind spot.

| script | time | must print | sees what nothing else does |
|---|---|---|---|
| `build.ps1` | ~1 s | `230 modules` | — |
| `auditperf.ps1` | ~40 s | *(a ranking)* | **where a frame goes** — paint calls, path ops, 3D primitives sorted, and **the bytes a refresh rewrites when nothing has changed**, for all 178 stages. Nothing else measures cost at all, and *both* guesses made without it were wrong: that 3D was the expensive part, and that unbatched strokes were. Its panel column used to report the panel's **size**, which could not see its own fix — it reports **writes** now |
| `measure.ps1` | ~15 s | *(the Part 0 table)* | the headline counts, **from the booted app** — wings, groups, experiments, stage-driven vs field, and any stage no demo reaches. Static greps over `src/` for the group count return 89 or 105 depending on the pattern; the app says 118. Also the artifact's real **byte** size, which `build.ps1` does not print |
| `smoke.ps1` | ~10 s | `smoke OK` | whether the bundle **parses and boots at all**; nav/home/`NAV_GROUP_OF` agreement; every stage carries all nine methods; all 80 see-links resolve; `ctText` argument shifts; **markup inside canvas text**, which the canvas draws as its own tags and nothing else can see |
| `runtests.ps1` | ~30 s | `0 failed` | engine arithmetic (modules 21–49 only) |
| `runall.ps1` | ~18 min | `caught=0 OK` | every demo × every control actually runs; greps prose for `undefined`/`NaN`/`Infinity` |
| `auditcustom.ps1` | ~1 min | `bad=0 OK` | the **"type your own" path**, which `runall` never selects. Drives textareas from their `data-audit` attribute |
| `auditpanel.ps1` | ~20 s | `bad=0` / `auditpanel OK` | whether a stage still has its readout, ladder and chip **after being left and reopened**. `uiSetHtml` skips a write matching what it last wrote, so the panels are stateful and anything clearing them behind its back makes the next identical refresh a silent no-op. On the build that introduced it **145 of 178 stages came back blank and `runall` still said `caught=0`** — it visits each demo once and never returns to one |
| `auditderive.ps1` | ~40 s | `flagged=0 OK` | every stage's `derive()`, which **nothing else calls**; and whether rungs carry reasoning or restate algebra |
| `auditclaims.ps1` | ~30 s | `bad=0 OK` | whether the **preset tables tell the truth** — 249 declared claims across 14 tables recomputed by an independent route. Reaches `EIG_PRESETS` (78b) and `NM_FUNCS` (79g), which are outside the window `runtests` extracts |
| `auditzoom.ps1` | ~1 min | `findings=0` | pan/zoom on all 178 stages, **and mkPlot's identity-at-rest** |
| `auditframe.ps1` | ~1 min | *(a report)* | how much of each curve falls outside its window, classified `LINE`/`POLE`/`MINOR`/`CUT` |
| `auditsize.ps1` | ~2 min | `findings=0` | eight canvas shapes — layouts that only break at another aspect ratio |
| `auditviewport.ps1` | ~3 min | `bad=0` | sixteen real window sizes, and the page *around* the canvas |
| `audittext.ps1` | ~4 min | harvest written | what every panel **says** — drives all 593 experiments, harvests `textContent` |
| `auditscan.ps1` | ~20 s | 0 HIGH | ASCII stand-ins, leaked markup, empty panels, `NaN` in the harvest |
| `auditprose.ps1` | ~1 s | *(an inventory)* | essays that decline to justify a result; named theorems with no statement card |
| `auditcontrast.ps1` | ~1 s | — | WCAG contrast and the 12 px type floor |
| `runapp.ps1` | ~20 s | — | one demo, screenshotted, for a human to look at. Uses `cprof-app`; **it used to share `cprof` with `runall` and that collision is now fixed** — every script has its own profile |
| `map.ps1` | ~2 s | *(a count)* | regenerates `MAP.md`, the index of every module, stage and wing. Run it after adding or renaming a file, **or after adding a top-level function** — the index lists what each module defines |
| `clean.ps1` | ~2 s | — | deletes everything the above regenerate |

**Two blind spots are known and unfixed**, and are the reason Programme D exists:

1. `runtests.ps1` extracts only modules 21–49, so **none of the 178 stages' own
   arithmetic is unit-tested**. `runall` proves they run without proving they are
   right.
2. `auditderive.ps1` sees only the ladder a stage builds in its **default**
   state, so a `derive()` with more than one return needs reading by hand.

**Both audit scripts that carry Unicode in their patterns must be saved with a
UTF-8 BOM.** PowerShell 5.1 reads a BOM-less `.ps1` as ANSI and the patterns
become mojibake that fails to parse. This has bitten twice.

## 1.7 Decisions already taken — do not reopen these

- **Ship to both a static website and a Claude artifact** (decided 2026-08-13).
  Not a native app: `.exe` is Windows-only, any native route is two builds and
  two code-signing regimes at ~$200–500/yr, and Tauri would put half the users on
  Safari's engine, which nothing here tests. See §3.9.
- **Performance leads the queue** (decided 2026-08-13), ahead of new subject
  matter. `./auditperf.ps1` found one stage issuing 14 400 rasterising calls per
  frame, and the artifact target has the least CPU headroom to absorb it. The
  ordering rule is in §4.3a: **fix a bad pattern before replicating it.**
- **Build all Tier 3 scenario editors** (decided 2026-08-09), across all the
  physics wings, not only where the scenario is arguably the lesson.
- **Build all 22 missing wings** in Part 3.3 (decided 2026-08-12), in the
  **cheapest-first order** set out there (revised 2026-08-13) — not curricular
  order, which front-loaded the two most expensive wings.
- **One coherent unit per session, ending green** (reaffirmed 2026-08-13): one
  wing, or one engine plus its stages. Not smaller — a cold session re-derives
  context, so a half-finished edit is the most expensive state to stop in.
- **The formal layer is complete in scope** — all 40 wings carry statements;
  what is left is depth (Part 3.8), not architecture.
- **The single-file, no-dependency artifact is the design**, not a limitation.
  Do not introduce a bundler, a framework, or a network request.
- **`igPolar`, `igCylSph`, `agQuad`, `agLog`, `agCircle`, `agTriangle`** need no
  typed function (1.5 above).
- **String theory's fifteen editors are worth a decision before starting** —
  several have no measurement a slider does not already provide. Part 3.1 names
  which four carry real measurements.

---

# PART 2 · The rules

**These are not style preferences. Every one of them exists because its
violation shipped a defect.** They apply to anything new and to anything being
changed.

## 2.1 The prime rule — measure, never assert

> **A claim that two quantities are equal is made only after computing both
> independently and printing the difference. The difference is the evidence.**

Everything else in this section is a consequence.

- **"Exact"** means a closed form or adaptive quadrature at 1e-13. Never a
  quoted value.
- **Convergence orders are measured** by halving h, never asserted.
- **A property a preset declares must be measured for a reader's own scenario.**
  A preset lattice declares its packing fraction; a typed one must have it
  computed. A preset field declares `conservative`; a typed one must have the
  largest Q_x − P_y reported.
- **Print what the zero cancelled.** Any law of the form "this integral
  vanishes" needs its gross beside it, or the panel cannot distinguish a physical
  cancellation from a routine that computed nothing. `∮|B·n̂|dA` next to
  `∮B·dA`; `Σ|dB|` next to `|ΣdB|`.
- **A ratio of two small numbers is not a measurement.** It needs a floor tied to
  the physics, and the panel must say which case it is in rather than print a
  number.
- **Never print only the agreeing number.** Print the gap and say what it means.
- **Look for the identity that is exact for a reason** and print it to eight
  figures. `⟨p·dε/dp⟩ = d·kT` holds for any growing ε by one integration by
  parts — so what is left is quadrature error, and a bug cannot hide in it.
- **Look for the invariance, not the value.** Sweep the parameter that should not
  matter and print the spread: the clutch torque out of a coupling loss (128×,
  spread < 1e-12), the eccentricity out of an apsidal angle (which is Bertrand's
  theorem, and invisible from a single orbit).
- **Physics is current.** CODATA 2022, PDG 2024, no Bohr orbits, decoherence
  framing rather than collapse mysticism.
- **Never mix a measured input with a modelled one inside a subtraction.** It is
  not a compromise between them, it is the difference between them — several MeV
  of model error landing whole on a 1 MeV answer. Carry provenance per quantity
  and refuse to state a verdict resting on a mixed comparison. **No automated
  gate can see this**: the number is finite and the arithmetic is right.
- **When the data contradicts the prose, check the physics before the code.** Two
  walks along an isobaric chain stopping in different places looked like a bug;
  the pairing term splits the chain and the bug was in the sentence.

## 2.2 Writing a wing

A wing is a **subject**, not a folder. It earns its place by being something a
reader could take a course in.

**Where it goes.** Insert it at its *curricular* position — where its
prerequisites are already behind it — not at the end. This costs nothing extra
and `smoke.ps1` enforces that the three lists agree on order.

**Seven places to touch** (`AI-GUIDE.md` §3 has the current detail):

1. `src/js/72*-demos-<wing>.js` — a new `*_GROUPS` array
2. `src/js/72zz-wings-registry.js` — the `WINGS` entry (must sort last of the 72s)
3. `src/shell.html` — a menu item in the right `.navgroup`, **and** a home card
4. `src/js/81-ui-nav.js` — `NAV_GROUP_OF`
5. `src/js/82-ui-wings.js` — `WING_SECTIONS` and `THEORY_BY_WING`
6. the theory file (`85*`/`86*`/`87*`/`88*`/`89*`), one wing per file
7. `runall.ps1` (**both** wing lists) and `README.md`

Then `./map.ps1`, then `./smoke.ps1`.

**A wing is complete when it has:** 8–20 guided experiments in 2–4 groups; a
canvas stage for anything with a picture; a prose essay; at least one statement
card with a proof; a derivation ladder on every stage; and reader-supplied input
wherever there is an author's function to replace.

## 2.3 Writing a demo (a guided experiment)

An entry in the wing's `*_GROUPS` array:

```js
{n:'Display name', ex:'the one-line display formula', stage:'stageId',
 opts:{ own:true },
 out:'What the reader should see happen. Concrete, with a number in it.',
 note:'Why the mathematics produces it. Say what is measured, and against what.'}
```

- **`n`** — what it *does*, phrased as the discovery. "Type your own force law,
  and find out what 'simple' means" beats "Custom SHM".
- **`ex`** — the **display** copy of the formula. Typeset Unicode.
- **`out`** — the outcome, with a real number in it. Not "the two agree" but
  "they agree to a part in 10⁹, and the waterline lands at 40% of the volume
  and 57% of the height".
- **`note`** — the reasoning. This is where a textbook would leave things to a
  lecturer. Say what was measured against what, and name the misreading it
  prevents.
- `out` and `note` are HTML through `supify()`, so `e^(-x^2)` typesets. **No
  ASCII stand-ins** — `auditscan` flags `->` as HIGH. Use `→ ≤ × −`.

**Insert new demos at the END of a group** wherever possible. The formal layer's
"See it in the laboratory" buttons target a *position* (`wing:g.i`), so an
insertion mid-group silently repoints every link below it — and a wrong-but-valid
index looks exactly like a right one. Three links pointed at nothing and two at
the wrong stage before `smoke.ps1` started resolving all 80 on every build.
**Prefer `see:'wing:stageId'` for new links**, which survives renumbering.

`-Demo 'g.i'` in `runapp.ps1` is **zero-based**: group index, then item index.

## 2.4 Writing a stage (the visualization)

The six-part contract, plus `legend` and `derive`. Rules that have each cost real
time:

- **`enter(o)`** seeds `ST` from the demo's `opts`. Every field the other five
  read must be initialised here, including the custom-input fields.
- **`controls()`** returns HTML; **`wire()`** attaches the listeners. **These are
  separate steps and forgetting the second produces no error at all** — the field
  accepts keystrokes and the picture keeps the default. `auditcustom.ps1`
  compares the readout across an edit precisely to catch it.
- **`frame(st, dt, ctx, W, H)`** draws. It runs every animation frame; anything
  expensive must be cached against **every input that matters**.
- **`readout(st)`** is called ~4×/second. Same caching rule.
- **`chip(st)`** — the floating badge over the canvas's top-left ~180×90 px.
  **Its lines must be `<div>`s**: `.readout-chip` is a flex column, so a bare
  `<sub>` becomes its own row and `v_rms = 517 m/s` renders as three stacked
  lines. Eleven chips had that shape.
- **`legend(st)` receives the state.** A stage whose scenes draw different things
  must key its legend on the one showing — a fixed key naming a_T and a_N over a
  picture with no such arrows is a caption for a different diagram.
- **Bad input never blanks the picture.** A parse failure keeps the previous
  scenario, shows the complaint inline with its line number, and says so.
- **Parsers never throw.** They collect `{line, msg}` and report every complaint.

**Where new code goes** (`src/js/CLAUDE.md` has the full table): engines
`21`–`49`, interaction toolkit `59`, stages `60`–`79`, UI `80`–`82`, prose
`85`–`89`, boot `90`. To insert between two files, add a letter — `60a-`, `60b-`
all sort between `60-` and `61-`. **Keep the letter even for a lone file** so the
next insertion has room. Aim for **under ~600 lines / ~50 KB per file**.

**Name collisions are silent.** All 230 modules share one script scope. Prefix
every engine function with its wing (`nq ga pc mv ig vc od ct ck rl qm dy tm la
sk lp mx fn lt sy ph cx df ag pb nm nc sl sm pv em es at ws fl op rt wv`) and
**grep case-sensitively before choosing a name**.

## 2.5 Drawing rules

- **The canvas is not the shape you wrote the stage on.** Layout from `W` and
  `H` via `ctBounds()`/`ctFitText()`, never from a constant that assumes either.
  `./auditsize.ps1` sweeps eight shapes and will find it.
- **`ctText(ctx, x, y, text, colour, font)` — coordinates FIRST.** Text first
  draws *nothing at all*, silently: the string lands in the x slot and the canvas
  takes a non-numeric coordinate. Twenty-four labels were invisible this way. The
  sixth argument is a font **string** (`'11px ' + FONT_UI`), never a number.
  `smoke.ps1` greps for both.
- **`parseFloat(ctx.font)` returns the WEIGHT**, not the size — these strings are
  `'600 11px Inter'`. Use `/(\d+(?:\.\d+)?)px/`. This turned a label clamp into a
  480-pixel offset across 19 stages.
- **`mode:'3d'` means the core does NOT clear the canvas.** A 2d frame under a 3d
  declaration paints on top of every previous frame.
- **`ctBox` scales by the smaller span.** Pick a scale satisfying both spans,
  then let the half-size follow.
- **A midpoint tick lands on rounding noise.** `(lo+hi)/2` on a symmetric range
  is 1e-11, not 0, and `fmtNum` writes nine characters for it. Snap anything
  below a millionth of the span.
- **Never normalise arrows to their own maximum** — it draws round-off as a
  field. Scale a decoration against something physical and fade it when the
  quantity is absent.
- **A per-cell or per-sample draw belongs in a bitmap, not in `frame()`.**
  A grid of `fillRect` calls is one rasterising call *per cell, per frame*, plus
  a CSS colour-string parse each: `cxPaint` drew 120×120 and so issued **14 400
  of each, sixty times a second**. Build the pixels into an `ImageData`,
  `putImageData` it to an offscreen canvas sized in **cells**, and `drawImage`
  that into the box — scaling the blit covers a resize for free, and
  `imageSmoothingEnabled = false` keeps the flat cells. Five loops of this shape
  were converted on 2026-08-13 (§3.5); **copy one of them rather than writing a
  sixth by hand.** Cache the pixels on top of that only if the inputs have a
  stable identity — see the `ctHeat`-vs-`cxPaint` note in §3.5.
  **`./auditperf.ps1` will tell you which side of this you are on** — under ~400
  paint calls per frame is comfortable, over ~1 200 is not.
- **Batch strokes that share a style** — but know what it costs first. Consecutive
  segments in one colour should be one path and one `stroke()`. **This is a much
  smaller win than it looks**, and reading a large path-op count as a large cost
  is how §3.5 got its second item wrong: `ctContour`'s 25 450 path ops are
  already inside 16 paths. **Attribute the calls before optimising them.**
- **Do not batch a depth-sorted translucent mesh.** Subpaths of one path fill by
  the **nonzero** rule, so opposite-wound quads cancel; normalising the winding
  fills in gaps that are real geometry. `wsCY` was batched and reverted for
  exactly this, and both versions passed every gate (§3.5).
- **Anything deriving a loop count from a data span must cap it.** Zooming out
  multiplies the span; `ctGrid` once asked for four hundred thousand lines *per
  frame*, which does not error — the stage simply stops returning, and headless
  Chrome never exits because virtual time cannot advance while the renderer is
  busy. **If a page hangs with no error, look for a loop whose step came from
  somewhere else.**
- **`pvClip` applies to `mkPlot` boxes only.** A `ctBox` is an aspect-true
  diagram whose arrows are *meant* to reach past the frame.
- **Every resize must call `R.resize()`** — the renderer keeps its own pixel
  buffer and CSS alone will not tell it.
- **The responsive block must stay last in `styles.css`.** Media queries add no
  specificity, so a later rule beats one inside an earlier `@media`.
- **A CSS `1fr` track is `minmax(auto, 1fr)`** and cannot shrink below
  min-content. Write `minmax(0,1fr)` unless you mean otherwise.

## 2.6 The derivation ladder

Every stage defines `derive(st)` returning `{title, steps, note}`. Two rung
types:

- **`drvStep(label, eq, sub)`** — a numbered rung. The `eq` stays in **letters**;
  live numbers go only in `sub`. Build equations with `dv`/`dop`/`dfrac`
  (`58-derive.js`), never raw ASCII.
- **`drvSay(label, prose)`** — an unnumbered rung carrying the *reasoning*: why
  the step is legal, where the idea comes from, what the usual misreading is.

> **A ladder that only restates the algebra is not worth adding.** The `drvSay`
> rungs are the point — they carry what a textbook leaves to a lecturer.
> `auditderive.ps1` measures this and flags rungs whose prose merely repeats
> their own heading.

**A template hole inside a template hole is a parse error the unit suite cannot
see.** `${dfrac('ħ', dv('m')_W dv('c'))}` killed the whole app while
`runtests.ps1` still reported passing. **Run `./smoke.ps1` after every build.**

**Check the fields you read off `st` and off engine returns actually exist.**
`laRREF` has no `inconsistent`; reading it gave `undefined`, which is falsy,
which silently reported inconsistent systems as solvable.

## 2.7 The formal layer

```js
${stDefn('Continuity at a point', `<p>…</p>`, { see:'limits:0.6' })}

${stThm('Mean Value Theorem', {
  hyp:'…continuous on [a,b], differentiable on (a,b)',
  then:'there is c ∈ (a,b) with',
  eq:'…',                       // stEq() for a display line inside a card
  proof:`<p>…</p>`,             // omit ONLY with `because:` saying why
  note:'the hypothesis people drop',
  see:'limits:0.7' })}          // the demo that shows it
```

`stLemma` and `stCor` are the same call with a different kind.

- **Numbering is applied at render time** by `stNumber()` in `openTheory()`,
  never written into the source — several essays are assembled from more than one
  constant, so a hand-written number restarts the count halfway through. (Same
  reason demo groups are numbered in `80a-ui-core.js` rather than in the tables.)
- **A card is a template hole containing a function call containing more template
  literals** — three deep, legal, and exactly the shape that has taken the app
  down. **`./smoke.ps1` after every card.**
- `see:` resolves at *click* time, so a renumbered demo reports "that experiment
  has moved" rather than silently doing nothing.
- Every wing must have at least one statement, and every statement should carry
  either a proof or a `because:` saying why not.

## 2.8 Prose essays

One wing per file in `85*`–`89*`, routed by `THEORY_BY_WING` in `82-ui-wings.js`.

- **Justify, never hand-wave.** `auditprose.ps1` inventories phrases that decline
  to justify a result. It last found **zero** across the whole site; keep it
  there.
- A named theorem the prose leans on should have a **statement card** behind it.
- Cross-wing references are legitimate and the tool labels them as such.
- Essays explain; cards state exactly and prove. Do not merge the two jobs.

## 2.9 Reader-supplied input

> **The rule for a scenario editor: find the property or theorem the presets are
> allowed to assume, and make the reader's own scenario the thing that tests it.**

Not "let the reader type a number" — every numeric control has been typeable
since the `ctlSlider` retrofit, and adding another box is not this work.

**The five mechanisms** (`59-interact.js`; `AI-GUIDE.md` §3b has the APIs):

| prefix | what it gives you |
|---|---|
| `sk` | **sketch pad** — drag a curve, get an interpolated `f(x)` |
| `lp` | **region tool** — drag a closed loop, get a contour and its interior |
| `mx` | **matrix editor** — typed entries, live |
| `fn` | **expression box** — typed formula, compiled |
| `pk` | **"or type your own"** on any preset picker |

**The three shapes an editor takes.** Copy the nearest one; do not invent a
fourth.

- **Shape A — one expression, engine already takes a function.** The cheapest: if
  the engine accepts `f` rather than a preset name, the whole editor is one box.
  Add the `custom` option to the segmented control, emit `fnHtml` when it is
  chosen, and wire it. Clamp the compiled value so a bad one cannot poison an
  integrator. Example: `dyEnergy`.
- **Shape B — a mode switch with its own picture and readout.** `controls()`,
  `frame()`, `readout()` and `chip()` each dispatch on the first line. Cache
  anything expensive against every input that matters. Examples: `slBand`,
  `flFlow`, `opWave`.
- **Shape C — a multi-line sheet (a `<textarea>`).** When the scenario is a
  *list*: pieces of a body, a netlist, a reaction, a cycle, a prescription.
  Examples: `rtInertia`, `ckLab`, `ncBind`, `tmEngine`.
  **`data-audit` is mandatory** on the textarea, holding something valid for its
  own format — `auditcustom.ps1` drives textareas from that attribute, and no
  generic expression could be valid for a bespoke one. Without it the whole path
  is unaudited.

**The `pk*` accessor is the whole trick.** Return an object shaped exactly like
one of the wing's own table entries, and every `TABLE[st.key]` becomes `cur(st)`
with no other change.

**Traps, all of which have bitten:**

- **Do not `replace_all` `TABLE[st.key]` after writing the accessor** — it
  rewrites the lookup *inside* the accessor and you get infinite recursion.
  Replace first, then add the accessor.
- **Grep for `st.key ===` before adding a synthetic key.** Branches asking which
  preset is loaded must be told what a custom one counts as, or they fall through
  to the wrong arm.
- **Anything indexing the option table by the current key needs a guard** —
  there is no `custom` entry in the table. Hence `mvName(st)`/`mvShort(st)`.
- **`auditcustom` must be able to find the new option.** It matches a `data-v` of
  literally `custom` or a label containing *"your own"*. A label reading "a path
  you type" was invisible to it and that path went unaudited.
- **An engine taking caller-supplied objects must carry their tags through its
  return.** `rtRaceRun` rebuilt each row and dropped the `own`/`short` fields the
  stage had put there; the stage then reported a perfectly good body as unable to
  roll. Only `auditcustom` could see it.
- **Echo a typed expression with `pkPretty(src)`**, never raw — `f:`/`src:` are
  ASCII for the parser, and printing one raw puts `sqrt(z - z^2)` in a readout.
  Never feed `pkPretty` output back to `parse()`, and never put it in a
  `<textarea>` (that must stay editable ASCII).
- **A slot using `pkParamAst`/`pkParamFn`/`pkCurve2` must carry
  `build: pkParamBuild`**, or `fnWire` validates the raw text, rejects
  `a*cos(t)` as an unknown identifier, and silently keeps the previous formula.
- **Look for the second, non-local way the input can be illegal.** `∇·J = 0` at
  every interior point is not "this current closes" — a wire crossing the box
  satisfies it everywhere and is still a segment. Only the *gross* wall flux
  separates them.

## 2.10 Displaying mathematics

**What is shown must be typeset, not spelled out in ASCII.**

| write | not |
|---|---|
| `x²`, `10⁻⁶` | `x^2`, `10^-6` |
| `√ ∫ Σ ∂ ∇` | `sqrt int sum d del` |
| `θ φ ω ψ Ψ α β γ ħ` | `theta phi omega psi Psi alpha beta gamma hbar` |
| `± ≤ ≥ ≠ → × ·` | `+/- <= >= != -> x *` |
| `−` (U+2212) | `-` (hyphen) in front of a number |
| `\|↑⟩`, `⟨S⟩` | `\|up>`, `<S>` — angle brackets are eaten as HTML |

**Three contexts, three rules:**

1. **HTML** — `kv()` labels, `<p class="help">`, readouts, theory prose, legends,
   `ctSeg`/`rlSeg` labels. `<sub>`/`<sup>` are fine; caret exponents are
   converted automatically by `supify()` at render time.
2. **Canvas** — `stageNote`, `ctText`, `R.label`, `ctx.fillText`. **No markup**;
   it is drawn literally. Use Unicode. Unicode has no subscript `y`, `b` or `c`,
   so reword (`∂f/∂y`, "heat in = work out + heat dumped").
3. **Parsed expressions** — `f:`, `P:`, `Q:`, `R:`, `src:` go to the parser and
   **must stay ASCII**. The neighbouring `ex:` is the display copy. **Never "fix"
   the parsed one.**

**`supify()` must never touch text inside a tag.** A segmented control carries
its expression in the attribute itself, so rewriting attributes turned
`data-v="x^2+y^2-4"` into `data-v="x<sup>2</sup>+…"` and fed that to the parser.
If you extend it, keep the tag-skipping split.

**Check your work on rendered output, never on source.** Grepping `src/` for
`sqrt` drowns in `Math.sqrt(` and `theta` drowns in variable names. That is what
`audittext.ps1` + `auditscan.ps1` are for.

## 2.11 Numbers in a readout

- **Never let `undefined`, `NaN` or `Infinity` reach a readout string.** `runall`
  greps for them, prose included. Write "not defined there" or "vertical tangent
  — no slope".
- **`fmtNum(v, sig)` counts significant figures above 1 and DECIMAL PLACES below
  it.** `fmtNum(0.0032, 2)` is the string `0`. That reached a canvas heading, a
  chip and a readout row and **no automated gate could see it** — a finite number
  formatted into a false one. Only a screenshot caught it. Anything that might
  come out below 1 needs its place count raised by its leading zeros.
- `fmtNum()` emits real superscripts and U+2212 minus signs in both HTML and
  canvas. **Do not wrap its output in markup.**
- **`fmtNum` in a cache key is a rounding, and roundings collide.** Key a cache
  on what the calculation actually depends on.
- A clamp that moves a number silently teaches nothing — pass `{lo, hi, why}` to
  `wireSlider` for a limit that is **physics, not widget**, and the `why` shows in
  the panel's status line.

## 2.12 Performance rules

- **Cache against every input that matters.** `frame` runs every animation frame
  and `readout` ~4×/second.
- **A Monte Carlo scan must be annealed.** `smIsing` restarting from a hot
  lattice at every temperature located T_c 14% low; carrying the configuration
  from one temperature to the next put it within 1.6%. One line, no extra work.
- **Measure a convergence rate on the routine you mean.** A gap plateauing
  against the grid may be a *different* quadrature's floor. Refine each side
  separately before believing either.
- **When a prefactor is erratic, sweep it rather than sampling it.** Measuring
  order by halving `h` reported 0.905 for a third-order method because the error
  depends on where the step grid lands.
- **An adaptive window is sometimes the whole point.** A fixed integration window
  reports "no apsides" for precisely the eccentric orbits the theorem is about.

## 2.13 Definition of done — per item

1. **Engine function** in 21–49, with a doc comment saying *why this route* and
   what the returned diagnostic means.
2. **Unit tests**: a known closed form; the two-route agreement; several
   parameter values; a **measured** convergence rate where anything is
   discretised; and every parse failure rejected.
3. **Stage**: `enter`/`controls`/`wire`/`frame`/`readout`/`chip`/`legend`, all
   branching on the custom case; bad input leaves the previous picture alone.
4. **A `derive()` rung** explaining what is now being *tested* rather than
   assumed.
5. **A demo entry** with `out` and `note`.
6. **Green**: `smoke` OK, `runtests` 0 failed, `auditcustom` bad=0, `auditderive`
   flagged=0, `runall` caught=0, `auditscan` 0 HIGH.
7. **One screenshot, looked at.** Not "generated" — looked at. Two defects in
   this repo were visible only this way.
8. **An `AUDIT.md` entry**: what was checked, against what, and anything that bit.

---

# PART 3 · What is left

Seven programmes. A, B and C add subject matter; D–G raise the floor under all
of it. **A and C are large enough to be programmes rather than tasks** and should
be taken wing by wing with the build green at each step.

## 3.0 The count, and a correction

The retired `TIER-THREE-ITEMS.md` said *"75 stages, 34 done, 41 remaining"*. That
subtraction was wrong by one: the 34 includes `opWave`, which is in the optics
wing and **not one of the twelve wings the 75 counts**. Counting the twelve wings
stage by stage:

| wing | stages | done | left |
|---|---|---|---|
| relativity | 21 | 0 | **21** |
| string theory | 15 | 0 | **15** |
| electromagnetism | 6 | 3 | **3** |
| the atom | 5 | 2 | **3** |
| mechanics | 6 | 6 | 0 — closed |
| rotation | 5 | 5 | 0 — closed |
| solid state | 4 | 4 | 0 — closed |
| statistical mechanics | 4 | 4 | 0 — closed |
| nuclear | 3 | 3 | 0 — closed |
| thermodynamics | 2 | 2 | 0 — closed |
| waves | 2 | 2 | 0 — closed |
| fluids | 2 | 2 | 0 — closed |
| **total** | **75** | **33** | **42** |

Plus `opWave` outside the twelve, so **34 scenario editors exist and 42 remain**.

## 3.1 Programme A — the 42 remaining scenario editors

Each row: what the reader supplies, what gets **measured rather than asserted**,
and the acceptance test. `[reuse]` names machinery that already exists.

### Electromagnetism — 3 left (do these first: the machinery exists)

| stage | file | reader supplies | measured | acceptance test |
|---|---|---|---|---|
| `emFaraday` | `60i` | a typed B(t) and loop | EMF by ∮E·dl **and** by −dΦ/dt | agree to 1e-6; sign follows Lenz |
| `emWave` | `60ia` | a source current | c recovered from the propagation | matches 1/√(μ₀ε₀) to 1e-4 |
| `emSandbox` | `60h` | a charge/current arrangement | the Laplace residual, and the Poynting energy balance | residual < 1e-6; ∮S·dA matches dU/dt |

`emFaraday` is the highest value-per-unit-work item in the entire programme:
`47a-em-typed.js` already has the cell machinery, `emCellCircB` already
integrates a circulation round a loop, and the `emjBoxes`/`emjGrid`/`emjSlice`
editor in `60ib` was **built to be reused for exactly this**. What is new is only
the time derivative.

### The atom — 3 left

| stage | file | reader supplies | measured | acceptance test |
|---|---|---|---|---|
| `atomSM` | `60e` | a typed particle content | anomaly-cancellation sums per generation | the SM content sums to zero; removing one fermion does not |
| `atomForces` | `60c` | separation and a particle pair | the four strengths evaluated and ranked at *that* r | the ranking flips at the known crossover distances |
| `atomSim` | `60c` | Z and a screening function | the level spacing produced | hydrogenic screening reproduces −13.6Z²/n² to 1e-6 |

`atomSM` needs **no engine at all** — it is arithmetic over a table. Do it second.

### Relativity — 21 left, the largest block

**Build the metric engine first.** `rlGeodesic` in `46-relativity.js`: items 1–5
are five views of it, so **one engine opens a quarter of the wing**. Plan the
five together.

| # | stage | file | reader supplies | measured | acceptance test |
|---|---|---|---|---|---|
| 1 | `rlMetric` | `68a` | g_tt(r), g_rr(r) as two boxes | E and L conserved along the integrated geodesic; the horizon located where g_tt changes sign | Schwarzschild gives r_s = 2GM/c² to 1e-9; E, L drift < 1e-8 over 10 orbits |
| 2 | `rlOrbit` | `68a` | the same metric + orbital elements | perihelion advance **measured** from the track | Schwarzschild gives 6πGM/c²a(1−e²) to 1%; Newtonian gives 0 to 1e-6 |
| 3 | `rlHole` | `68b` | a typed metric | proper time to the horizon (finite) vs coordinate time (divergent), integrated separately | ∫dτ finite and matches the closed form; ∫dt → ∞ as r → r_s |
| 4 | `rlLens` | `68b` | a typed mass profile M(r) | deflection by quadrature | a point mass gives 4GM/c²b to 1e-6 — exactly twice the Newtonian value |
| 5 | `rlWave` | `68c` | binary masses + separation | the chirp df/dt integrated from the quadrupole formula | matches the closed-form chirp-mass relation to 1e-6 |
| 6 | `relBoost` | `60f` | a typed charge configuration | ∮E·dA computed in **both** frames | equal to q/ε₀ in both, to quadrature tolerance |
| 7 | `rlEB` | `66e` | typed E and B | the invariants E²−c²B² and E·B, before and after | unchanged to 1e-12 at several β |
| 8 | `rlTensor` | `66e` | a typed F^μν | antisymmetry, and the invariants rebuilt from components | F^μν = −F^νμ exactly; invariants match #7 |
| 9 | `rlWire` | `66e` | typed drift speed and density | the force computed in both frames independently | equal after transforming, to 1e-10 |
| 10 | `rlMink` | `66c` | a typed worldline x(t) | the interval s² along it, before and after a boost | invariant to 1e-12; a timelike line stays timelike |
| 11 | `rlVel` | `66c` | a typed chain of boosts | rapidities adding linearly, speeds not | Σφ linear to 1e-12; tanh(Σφ) matches the composed β |
| 12 | `rlTwin` | `66ca` | an acceleration profile a(τ) | proper time along the actual worldline | ∫dτ < ∫dt always; symmetric turnaround matches the closed form |
| 13 | `rlRocket` | `66ca` | a thrust programme | ∫dτ and ∫dt separately, and the distance | constant-g reproduces (c²/a)(cosh(aτ/c)−1) to 1e-8 |
| 14 | `rlClock` | `66b` | clock geometry | the tick period in both frames, from path length | ratio = γ to 1e-12 |
| 15 | `rlTrain` | `66b` | an event pair | the sign of Δt reversing under a boost | the crossover β matches the closed form to 1e-10 |
| 16 | `rlBarn` | `66ba` | object and opening lengths | which end passes first, from transformed event times | the frames disagree on order, agree on every invariant |
| 17 | `rlChase` | `66b` | a pursuit speed | the closing rate in both frames | light closes at c in both, to 1e-12 |
| 18 | `rlDopp` | `66d` | source motion | frequency and angle from the transformed four-vector | the transverse case gives 1/γ exactly |
| 19 | `rlDyn` | `66d` | a typed collision | E and p conserved; invariant mass before and after | both to 1e-10; invariant mass rises in an inelastic case |
| 20 | `rlElevator` | `66ba` | acceleration and field | the two trajectories, point by point | identical to 1e-9 over the whole path |
| 21 | `rlDisk` | `66ba` | radius and ω | circumference/diameter from the contracted rim | departs from π; → π as ω → 0, **measured** |

Relativity quantities are frequently **catastrophic cancellations and must be
computed in closed form** — the existing tests assert the naive route is *wrong*.

### String theory — 15 left, and a decision to take first

These stages are already unusually computed. **For several, a typed scenario adds
nothing a slider does not already give**, and the rule in §2.9 is the test to
apply. `wsRegge`, `wsCasimir`, `wsFlux` and `wsSwamp` are the four with a real
measurement in them; **build those four, then decide about the rest.**

| # | stage | file | reader supplies | measured | acceptance test |
|---|---|---|---|---|---|
| 23 | `wsRegge` | `79k` | **a typed meson list (mass, spin)** | α′ from a least-squares fit to *your* data, with residuals | the built-in list reproduces the published slope; a shuffled list gives the same fit |
| 26 | `wsCasimir` | `79l` | plate separation, geometry | the force by mode sum **and** closed form | agree to 1e-6; the sum converges at the measured rate |
| 30 | `wsFlux` | `79n` | flux integers | the moduli potential minimised numerically | a minimum exists for some flux sets and not others — reported, not assumed |
| 31 | `wsSwamp` | `79n` | **a typed potential V(φ)** | \|∇V\|/V and ∇²V/V evaluated on *your* V | a known de Sitter V violates the bound; a steep exponential does not |
| 22 | `wsModes` | `79k` | boundary conditions / tension | the spectrum generated; level spacing against α′ | open vs closed give the known degeneracies `[reuse wsDegeneracyCheck]` |
| 24 | `wsVen` | `79k` | Mandelstam s, t | the poles located numerically | poles at the expected α(s) = integer |
| 25 | `wsCrit` | `79l` | a regularisation scheme | −1/12 by two summation methods, differenced | zeta and Abel agree to 1e-9; D = 26 falls out |
| 27 | `wsCircle` | `79l` | a compactification radius | invariance under R → α′/R, term by term | the spectrum sets are identical, not merely close |
| 28 | `wsTorus` | `79m` | a modular parameter τ | modular invariance under S and T, re-evaluated | the partition function unchanged to 1e-9 |
| 29 | `wsCY` | `79n` | Hodge numbers h11, h21 | generation count and Euler characteristic computed | χ = 2(h11−h21); generations = \|χ\|/2 |
| 32 | `wsADD` | `79m` | n and R | the Newton-law deviation, against torsion-balance bounds | the excluded region is computed, not drawn |
| 33 | `wsRS` | `79m` | a warp factor | the hierarchy from the warp integral | e^(−kπr) reproduces the 10¹⁶ ratio |
| 34 | `wsHolo` | `79o` | a boundary region | the RT geodesic length minimised numerically | matches the closed-form entanglement entropy for an interval |
| 35 | `wsEntropy` | `79o` | charges | microstate count vs A/4, computed separately | agree for the extremal case |
| 36 | `wsWeb` | `79o` | a duality chain | invariants preserved along it | unchanged after a full loop of the web |

### Reusable machinery — check here before writing an engine

| what | where | use for |
|---|---|---|
| `pkCompile(src)` | `59-interact.js` | compile a typed f(x), cached, guarded |
| `pkPretty(src)` | `59-interact.js` | **echo a typed expression to the reader** |
| `pkParamFn(src)` | `59-interact.js` | an expression in `t` (rewrites t→x before parsing) |
| `pkOwn / pkFn / pkSeg / pkSrcSeg` | `59-interact.js` | picker + storage for "type your own" |
| `fnHtml / fnWire` | `59-interact.js` | the one-line expression box |
| `mvLevelCurve(G, box)` | `24-multivar.js` | trace an implicit curve g(x,y)=0 |
| `nqAdaptive / nqDoubleRect / nqDoublePolar / nqTripleSph` | `21-numerics.js` | quadrature |
| `ftFFT(re, im, inverse)` | `49-fourier.js` | power-of-two FFT, both directions |
| `qmScatter` slab propagator | `40-quantum.js` | any 1-D ψ″ = −wψ transfer matrix |
| `slCellM / slBandsV` | `44b-solidstate.js` | bands from any periodic cell |
| `rtBodyProps / rtParseBody` | `32-rotate.js` | an assembled body: M, CoM, I both ways |
| `emCellGrid / emCellGridV` | `47a-em-typed.js` | sample a typed ρ or J onto cells |
| `emCellsE / emCellsB / emCellsBGross` | `47a-em-typed.js` | the field of those cells, **and** the sum of the contributions' magnitudes |
| `emCellDivParts / emJBoxLeak / emAmpereSweep` | `47a-em-typed.js` | a divergence as three terms and their sum; whether a typed current closes; a circulation swept over radius |
| `emjGrid / emjSlice / emjBoxes` | `60ib-em-typed-fields.js` | the three-box J editor — **reuse for any typed vector source** |
| `ncSemfWith / ncSemfBasis / ncSemfFit` | `44ab-nuclear-semf.js` | the mass formula with the caller's coefficients, its five basis functions, the least-squares optimum |
| `ncSemfPeak / ncValleyZWith` | `44ab-nuclear-semf.js` | the most bound nucleus (with an `edge` flag), Z*(A) in closed form |
| `ncBetaQ / ncIsobar / ncParseNuclides` | `44ab-nuclear-semf.js` | Q by two arithmetics with provenance; an isobaric chain; a reader's nuclide list |
| `ncReactionQ / ncNuclideMass` | `44a-nuclear.js` | Q from masses, balance checking |
| `flPipeRun` | `34-fluids.js` | Bernoulli vs Euler along a profile |
| `opDiffract / opDiffractScan` | `36-optics.js` | far field of any aperture |
| `opSysMatrix / opTraceRay` | `36-optics.js` | paraxial + real ray through surfaces |
| `ckParseNetlist / ckLayoutNetlist` | `48k-circuit-netlist.js` | text → placed circuit |
| `laEigen / laSolve / laSVD` | `38-linalg.js` | eigenproblems, linear systems |
| `odEuler / odHeun / odRK4First / odStepOrder` | `26-odes.js` | trajectories, and **measuring** a method's order |
| `syLinear` + phase-plane helpers | `39-odeadv.js` | systems of ODEs, critical points |

### Where each wing's files are

| wing | stages | engine | demos | theory |
|---|---|---|---|---|
| relativity | `60f`, `66b`, `66ba`, `66c`, `66ca`, `66d`, `66e`, `68a`, `68b`, `68c` | `46-relativity.js` | `72g-demos-relativity.js` | `85g-theory-relativity.js` |
| string | `79k`–`79o` | `44d-string.js` | `72xc-demos-string.js` | `88d-theory-string.js` |
| EM | `60h`, `60i`, `60ia`, `60ib` | `47-em.js`, `47a-em-typed.js`, `37-estat.js` | `72d-demos-em.js` | `85d-theory-em.js` |
| atom | `60c`, `60ca`, `60cb`, `60cc`, `60e` | `45-atom.js`, `44ab-nuclear-semf.js` | `72c-demos-atom.js` | `85c-theory-atom.js` |

## 3.2 Programme B — the six syllabus gaps

From the diff of seven source curricula (AP Physics 1, AP Physics 2, AP Calculus
AB/BC, the Wikipedia vector-calculus topic list, a standard linear-algebra
syllabus, an 18.03-style ODE syllabus) against the build. Four of these six
appear in **no** list anyone wrote from knowledge of the subject — they were
found only by diffing.

| # | gap | size | where it goes |
|---|---|---|---|
| 1 | **Implicit differentiation and inverse-function derivatives** | 1–2 stages | `deriv` wing. **Do this first** — a named AP Calculus AB unit, the technique behind related rates and the tangent to a conic, and `mvLevelCurve` already exists and is unit-tested |
| 2 | **Dielectrics, bound charge and capacitance** | 1 stage | `em` wing. The only AP Physics 2 item not done live |
| 3 | **Abstract linear maps and inner product spaces** | 2 stages | `vecspace` wing. Polynomials and functions as vectors, a derivative as a matrix — what makes the leap to Fourier series and quantum states feel inevitable. `laProject` is already written for it |
| 4 | **Existence and uniqueness for ODEs** | 1 stage, or a statement card | `ode` wing |
| 5 | **PDEs — heat, wave, Laplace, separation of variables** | **a wing** | see C6 below — the largest single gap in the site |
| 6 | **Numerical linear algebra — LU, QR, conditioning** | **a wing** | see C16 below. The linear-algebra wings solve systems without ever asking whether the answer can be trusted, and a condition number is exactly what this laboratory is built to measure rather than assert |

Items 1–4 are small and sit inside wings that already exist. **They are the
cheapest real subject matter available and should be taken before Programme C.**

## 3.3 Programme C — the 22 missing wings

**Approved 2026-08-12: build all of them.** Ordered below by how much of the
existing site depends on them. Each is a full wing by the standard in §2.2 —
8–20 experiments, stages, essay, statement cards, derivation ladders and reader
input — and each must be **inserted at its curricular position** in all three
nav lists, not appended.

### Prerequisite — material a reader needs before existing wings fully make sense

| # | wing | why it is a prerequisite |
|---|---|---|
| C1 | **Proof, logic and sets** — quantifiers, induction, contradiction, contrapositive | The site has a formal layer of definitions, theorems and proofs across all 40 wings and **nothing that teaches a reader how to read one**. The highest-leverage gap in this list |
| C2 | **Complex numbers, elementary** — arithmetic, the plane, polar form, Euler's identity, roots of unity | The existing `complex` wing is *Complex Functions and Contour Integrals*, a third-year subject. Quantum, AC circuits, Fourier and relativity all assume the elementary material |
| C3 | **Units, dimensions and uncertainty** — dimensional analysis, significant figures, propagation of error | Every physics wing prints numbers to eight digits; nothing explains which of those digits mean anything |
| C4 | **Coordinate systems and transformations** — polar, cylindrical, spherical, Jacobians as a change of measure | Currently distributed across integration and partial derivatives, never taught directly |
| C5 | **Discrete mathematics and combinatorics** — counting, binomials, recurrence | Statistical mechanics counts microstates and probability counts outcomes; both assume this |

### Expanding what exists

| # | wing | why |
|---|---|---|
| C6 | **Partial differential equations** | **The largest single gap.** The Fourier wing exists historically *because* Fourier was solving the heat equation, and that equation appears nowhere. Connects Fourier, ODEs, potential theory and quantum mechanics, all already present |
| C7 | **Lagrangian and Hamiltonian mechanics, and Noether's theorem** | The bridge from Newtonian mechanics to quantum, field theory and GR. Without it the leap from `dyForce` to `qmWell` is unexplained |
| C8 | **Calculus of variations** — Euler–Lagrange, brachistochrone, geodesics | Prerequisite for C7; `dfIso` already gestures at it |
| C9 | **Tensors and index notation** | The relativity wing already *displays* the EM field tensor and Schwarzschild components; nothing teaches the notation they are written in |
| C10 | **Differential geometry of surfaces** — fundamental forms, Gauss curvature, Theorema Egregium | Sits exactly between the curves wing and general relativity |
| C11 | **Group theory and symmetry** — cyclic and permutation groups, representations, SU(2), SU(3) | `atomSM` lists particles by gauge charges with nowhere to learn what those are |
| C12 | **Special functions** — gamma, Legendre, Hermite, Bessel, spherical harmonics | The hydrogen atom, the quantum oscillator and the circular drum all use them |
| C13 | **Analysis** — rigorous limits, uniform convergence, interchanging limits with integrals | The Gibbs discussion in the Fourier wing is about exactly this and cannot say so |
| C14 | **Statistical inference** — estimators, likelihood, confidence intervals, hypothesis testing, Bayes | The probability wing stops at distributions |
| C15 | **Signal processing** — sampling, Nyquist, aliasing, windows, filters | A natural continuation of Fourier and directly useful |
| C16 | **Numerical linear algebra** — LU, QR, conditioning, iterative solvers | Also syllabus gap B6 |
| C17 | **Cosmology** — FRW, expansion history, the CMB, dark energy | The companion to relativity and string |
| C18 | **Quantum field theory, a primer** — second quantisation, propagators, Feynman diagrams | The gap between the quantum wing and the string wing |
| C19 | **Chaos and fractals** — sensitive dependence, Lyapunov exponents, bifurcation | Extends nonlinear dynamics, which already draws phase portraits |
| C20 | **Information and entropy** — Shannon entropy, coding, Landauer, Maxwell's demon | Ties statistical mechanics to computation |
| C21 | **Continuum mechanics and elasticity** — stress and strain tensors, waves in solids | Uses C9, extends fluids |
| C22 | **Electrodynamics of materials** — polarisation, magnetisation, dispersion, waveguides | Extends EM toward what an engineer needs. Absorbs syllabus gap B2 |

### Build order — **revised 2026-08-13 to cheapest-first**

The previous order was curricular: PDEs, then Lagrangian, then proof and logic.
That front-loads the two most expensive wings in the list and delivers nothing
for several sessions. **Ordered by effort-per-wing instead**, the deciding
question is *how much of the engine already exists* — because a wing whose
machinery is written is stages and prose, and a wing whose machinery is not is a
research project first.

**Tier 1 — the engine already exists. A wing here is stages, prose and cards.**

| | wing | what it reuses |
|---|---|---|
| 1 | **C2 Complex numbers, elementary** | `41-complex.js` is already written for the third-year wing; this is a gentler front end onto the same engine |
| 2 | **C4 Coordinate systems & Jacobians** | `nqDoublePolar`, `nqTripleSph`, `nqTripleCyl`, and **`igChangeCheck` is already written and unadopted** (§6.3) |
| 3 | **C15 Signal processing** | `ftFFT` exists and is tested. Sampling, Nyquist, aliasing, windows and filters are all front ends onto it |
| 4 | **C3 Units, dimensions & uncertainty** | almost no engine — dimensional analysis and error propagation. Every physics wing already prints the numbers it would explain |
| 5 | **C5 Discrete maths & combinatorics** | small; `43-probstat.js` already counts outcomes |
| 6 | **C1 Proof, logic and sets** | essentially no engine. The **highest-value** wing in the list — the formal layer across all 40 wings assumes a reader who can read a proof, and nothing teaches it |

**Tier 2 — extends an existing engine by a named function or two.**

| | wing | what it adds |
|---|---|---|
| 7 | **C16 Numerical linear algebra** | LU, QR and a condition number beside `laSolve`/`laSVD`. Also syllabus gap B6 |
| 8 | **C14 Statistical inference** | estimators, likelihood, CIs, tests onto `43-probstat.js` |
| 9 | **C19 Chaos and fractals** | Lyapunov exponents and a bifurcation sweep onto `39-odeadv.js`, which already draws phase portraits |
| 10 | **C20 Information and entropy** | Shannon entropy, coding, Landauer — small, and ties `44c-statmech.js` to computation |
| 11 | **C13 Analysis** | mostly prose and limit visualisers; the Gibbs discussion already needs it |
| 12 | **C9 Tensors and index notation** | largely notation and display. **Do this before C10, C17 and C21**, which use it |

**Tier 3 — needs machinery that does not exist. Budget several sessions each.**

| | wing | why it is expensive |
|---|---|---|
| 13 | **C12 Special functions** | gamma, Legendre, Hermite, Bessel, spherical harmonics — but hydrogen and the oscillator already lean on some |
| 14 | **C8 Calculus of variations** | Euler–Lagrange and a brachistochrone solver. **Prerequisite for C7** |
| 15 | **C6 Partial differential equations** | **the keystone, and genuinely large**: heat, wave and Laplace solvers plus separation of variables. Connects Fourier, ODEs, potential theory and quantum, all present. `skDeriv`/`skIntegral`/`skControls` are kept unadopted for exactly this — "draw the starting temperature" |
| 16 | **C7 Lagrangian & Hamiltonian mechanics** | the bridge to quantum, field theory and GR. Needs C8 |
| 17 | **C10 Differential geometry of surfaces** | fundamental forms, Gauss curvature. Needs C9 |
| 18 | **C22 Electrodynamics of materials** | absorbs syllabus gap B2 (dielectrics) |
| 19 | **C11 Group theory and symmetry** | representations, SU(2), SU(3) |
| 20 | **C17 Cosmology** | FRW integration. Needs C9 |
| 21 | **C21 Continuum mechanics** | stress and strain tensors. Needs C9 |
| 22 | **C18 Quantum field theory, a primer** | the hardest thing in this document. Do it last |

**The keystone argument for C6 is still true** — it is the single largest gap and
it ties four existing wings together. It has simply been moved behind six wings
that cost a fraction as much, so the site grows while C6 is being built rather
than waiting on it. **If you would rather have the keystone early, C6 at position
7 is the defensible compromise**; do not put it first.

## 3.4 Programme D — the verification infrastructure that keeps not existing

Fourteen defects were found in a single day, and **every one was invisible to
every check that existed**. They share one shape:

> **A preset whose value happens to be zero hides an error in the term it
> multiplies.**

The cylinder's side flux vanishes by symmetry for four of six preset fields, so
an inward-pointing normal went unnoticed for as long as the stage existed. All
four Fourier waveforms have mean zero, so a factor of two in the a₀ convention
went unnoticed. Both surfaced the moment a reader's own function went through
them.

Three pieces of infrastructure would have caught most of the fourteen:

1. ~~**A declared-property audit.**~~ **DONE 2026-08-12 — `./auditclaims.ps1`,
   `bad=0` over 249 claims in 14 tables.** It found three real defects: a
   `VC_SURFACES.cone.exactArea` that was the area of the whole cone while the
   patch is parametrised from `u₀ = 0.001` (a 4.4e-6 gap the stage printed to the
   reader as "difference", where it read as quadrature error — the quadrature had
   converged to 5.3e-14); a `torus` missing `closed:true` while its own boundary
   prose said "none — it is closed", which left the one branch reading that flag
   silently dead; and a root-test radius of ~17 printed for eˣ beside the word
   "infinite" with nothing to say what the gap meant.

   **Two things to carry forward from it.** *First*, the tolerance must come from
   the second route's own measured error, never from a guess — five of the
   thirteen first-run findings were the audit being wrong, every one of them a
   fixed tolerance sitting where a measured convergence belonged. *Second*, **run
   the negative control**: fourteen claims corrupted in memory caught 13, and the
   one that escaped exposed a real weakness (a limit wrong in the fourth decimal
   passes any absolute threshold — what separates it is the *rate* at which the
   error shrinks, which now gets measured). A gate that has never been seen to
   fail is not known to work.
2. **A both-sides audit.** Every theorem stage computes two sides and prints
   their difference; assert that difference is small for every preset
   combination, and the cylinder bug fails the build. **`vcDivergenceCheck` and
   `igChangeCheck` are already written and are exactly these primitives** —
   they are the two "unused" functions kept for this reason. Whitelist the one
   honest exception (an inverse-square field on a region containing its
   singularity) **with its reason**.
3. **Stage-level unit tests.** `runtests.ps1` extracts only 21–49, so none of the
   178 stages' arithmetic is tested. The numeric Fourier path had zero tests,
   which is exactly why a factor of two lived in it.

**This programme is worth doing before Programme C**, because 22 new wings
written without it will reproduce the same fourteen defects at scale.

## 3.5 Programme E — speed — **DONE 2026-08-13**

**Executed and measured. `AUDIT.md` has the full entry.**

| | before | after |
|---|---|---|
| stages over 1 200 paint calls/frame | 17 | **2** |
| mean 2-D paint calls/frame | 569 | **131** |
| worst stage | `cxMap` 14 427 | `wsCY` 4 072 (deliberate, below) |
| HTML rewritten when nothing changed | 2 862 160 bytes/s, 178 of 178 stages | **0**, 0 of 178 |
| animation while the tab is hidden | full rate | stopped |

Five per-cell `fillRect` loops became one `ImageData` + one `drawImage`
(`cxPaint`, `ctHeat`, `rtInertia`, `smIsing`, `vcGreen`); `uiSetHtml` (`80a`)
writes a panel only when the string differs; `startLoop` (`90`) stops the loop on
`visibilitychange`.

**One row of the table below was wrong, and the correction is the lesson.** It
named "unbatched strokes on the multivariable and forms stages" on the evidence
of `mvSurface`'s 25 450 path ops. `ctContour` was **already** batched — one path
and one `stroke` per level — and those path ops are `moveTo`/`lineTo` *inside*
16 paths, which is the cheap part. The real cost was **`ctHeat`**, which nothing
had named: **ten of the seventeen heavy stages spent 2 700–4 900 of their paint
calls in that one helper.** Fixing the helper fixed ten stages.

> **Path ops and paint calls are not the same currency, and the ranking by one is
> not the ranking by the other. A large number is not a cost until something
> attributes it to a caller.**

**Two things not to redo:**

- **`ctHeat` is recomputed every frame and deliberately not cached.** Its `f` is
  almost always a closure the caller rebuilds each frame, so there is no stable
  identity to key on, and a stale heat map looks exactly like a correct one.
  `cxPaint` *is* cached because `CX_FUNCS` entries are singletons.
- **`wsCY` was batched, looked at, and reverted.** Its 2 025 depth-sorted
  translucent quads went to ~320 calls and the picture was wrong: subpaths of one
  path fill by the **nonzero** rule, and normalising the winding to stop the
  cancellation filled in the gaps between the surface's lobes — a folded
  Calabi–Yau slice became a flat disc. Both versions passed every gate; only the
  screenshots separated them. **Batching a depth-sorted translucent mesh is not a
  safe transformation.** If it must get cheaper, spend the effort on NU/NV or on
  caching when `spin` is off.

What was there before, kept for the record — the worst offender had already been
fixed (`vcConserv`, 1 527 120 engine calls per 10 frames down to 24):

| item | evidence | outcome |
|---|---|---|
| ~~The readout and the whole derivation ladder are rebuilt by `innerHTML` every 0.4 s, forever~~ | `60a-stage-core.js` → `refreshStageReadout()` → `refreshDerive()`. For a static stage nothing had changed and the work was entirely wasted | **DONE** — `uiSetHtml` (`80a`) writes only when the string differs. **It also makes the panels stateful, which cost two bugs and now has two gates** — see the `auditpanel.ps1` row in §1.6 |
| ~~Nothing pauses when the tab is hidden~~ | zero occurrences of `visibilitychange` in `src/` | **DONE** — `startLoop()` (`90`) stops the loop and restarts it on return |
| ~~3D primitive counts on the heaviest stages~~ | **MEASURED 2026-08-13 by `./auditperf.ps1`, and the guess was wrong.** The 17 `mode:'3d'` stages average **345 paint calls and 224 sorted primitives** per frame — they are not the problem. **The worst stages are all 2D** | nothing to do; the effort went to the two rows below |
| **`cxPaint` redraws a domain colouring cell-by-cell, every frame** | `79c-stages-complex.js:8` loops a 120×120 grid issuing **14 400 `fillRect` calls, 14 400 `fillStyle` string parses and 14 400 complex-function evaluations per frame**. Measured: `cxMap` **14 427** paint calls/frame, `cxContourInt` **10 024**. Nothing in it changes unless `f` or the viewport does — this is a straight violation of §2.4's "anything expensive must be cached against every input that matters" | render once to an offscreen canvas keyed on (f, window, size) and `drawImage` it, or build a `Uint8ClampedArray` and `putImageData`. **14 400 calls → 1.** The single highest-value optimisation in the codebase |
| ~~Unbatched strokes on the multivariable and forms stages~~ | `mvSurface` issues **25 450 path ops/frame**, `dfHarmonic` 10 895, `mvChain` 10 936, `mvField` 10 576 | **THIS ROW WAS WRONG.** Those path ops are already inside 16 batched `ctContour` paths. The cost was `ctHeat` — 3 600–4 900 *paint* calls on each of the same stages. See the attribution table above |

**2 stages exceed 1 200 rasterising calls per frame** (`wsCY` 4 072 by decision,
`vcDiverg` 1 351), down from 17. The full ranking is in `audit-perf.csv`;
`./auditperf.ps1` regenerates it in ~40 s.

**First paint of a 5.35 MB single file** is the one cost not addressed, and
deliberately: **do not** fix it by splitting the bundle — the self-contained
artifact is the design (§1.7). Over the wire it is ~1.35 MB compressed (§3.9),
so this is a parse cost, not a transfer cost. If it ever matters, defer stage
modules behind the first paint.

**You cannot profile wall-clock time in this harness.** `--virtual-time-budget`
runs Chrome on a virtual clock, so `performance.now()` does not advance inside a
synchronous loop and every stage times as exactly `0.00 ms`. `auditperf` counts
*work* instead — paint calls, path ops, primitives sorted, and the bytes a
refresh rewrites when nothing changed — which is deterministic, identical on
every machine, and for this renderer is what the cost actually is.

## 3.6 Programme F — usability and access

| item | note |
|---|---|
| **No permalink** | verified: zero uses of `location.hash` in `src/`. Encoding wing, demo and control state into the URL hash would make the site usable for teaching — "open this link and look at what happens at β = 0.99". **The single biggest usability win available** |
| **No export** | neither the computed numbers (CSV) nor the figure (PNG/SVG) can be taken out |
| **Drag-only interactions are keyboard-inaccessible** | the sketch pad, the region tool and every `pick()` handler need a keyboard path |
| **Canvas content is invisible to a screen reader** | each stage could emit a short description of what is currently drawn into an `aria-live` region; `readout` is already close to this. `ckPinName` exists for the circuit half of it |
| **The command palette indexes demos but not the formal layer** | definitions and theorems are unreachable by search |
| **No print path** for the theory essays | |

## 3.7 Programme G — pedagogy

| item | note |
|---|---|
| **Units are inconsistent** | some readouts carry them, some do not. A dimensional-consistency pass would also catch real errors — and C3 is the wing that teaches why |
| **A worked-example mode** | the same derivation ladder with the reader's own numbers substituted at every rung and the arithmetic shown. Most of the machinery exists in `drvStep`'s `sub` argument |
| **Self-check questions** per stage | one question whose answer the stage can verify, turning a demonstration into an exercise |
| **A glossary**, cross-linked from the essays | |

## 3.8 Programme H — the statement-card backlog

**Re-measured 2026-08-13: 19 remain**, not the 21 this section used to say. The
enumerated list is back in `audit-prose.csv` (regenerate any time with
`./audittext.ps1` then `./auditprose.ps1`, ~4 min). The nineteen, by wing:

| wing | named result with no card |
|---|---|
| algebra, curves | Pythagorean identity |
| em | Lenz's law |
| fluids, thermo | Pascal's principle |
| integral | numerical rule |
| mechanics | Newton's law |
| nuclear | Geiger–Nuttall law |
| ode | Fuchs' theorem |
| optics | Malus's law, Rayleigh criterion |
| phase | Bendixson's theorem |
| quantum | Gleason's theorem |
| relativity | Penrose–Hawking theorem, Pythagorean theorem |
| string | Atiyah–Singer theorem |
| vector | Wien's law, Fourier's law |
| waves | Hooke's law |

**Read the tool's other two columns before acting on this one.** `ELSEWHERE` (14)
are cross-wing references to a card that *does* exist elsewhere and are
legitimate by §2.8 — do not "fix" them. `BARE` counts phrases that decline to
justify a result and **must stay at 0**; it read 2 on 2026-08-13 and both were
false positives of a word-level match (`clearly visible` beside a computed
percentage, `as plainly as its content`), reworded so the signal stays clean.
A word-sense the tool cannot tell apart is worth a reword, not a weaker pattern.

## 3.9 Programme I — delivery

**Decided 2026-08-13: ship to BOTH a static website and a Claude artifact.**
That pairing is what makes Programme E urgent, because the two targets have very
different amounts of CPU headroom for identical code.

### What was measured, so nobody re-derives it

| | |
|---|---|
| raw artifact | 5 339 257 bytes (5.34 MB) |
| **gzip −9** | **1 625 582 bytes — 3.3× smaller** |
| brotli (est.) | ~1 349 000 bytes (1.35 MB) |
| composition | **98% is JavaScript** (5 242 208 of 5 339 257 bytes) |
| `file://` APIs | **none** — no `fetch`, `XHR`, `localStorage`, Workers, IndexedDB or ES modules |
| unwrapped boot | **verified** — the shipped file boots and renders from `file://` directly |

That last row closed a real gap: every one of the harness scripts tests a
*wrapped* copy (`apptest-*.html`), so the file as actually shipped had never been
loaded by anything. It was checked by stripping every `<script>` block from the
dump and confirming 139 787 bytes of **rendered** DOM containing real demo names
and 77 rail buttons, with no external references.

**Over the wire this is a ~1.35 MB page, not a 5.34 MB one** — below the median
web page. The "5 MB single file" worry in §3.5 is mostly a first-paint parse
cost, not a transfer cost, and the instruction there stands: **do not fix it by
splitting the bundle.**

### The website — nearly free

Static hosting on Cloudflare/GitHub/Netlify handles this on a free tier. The
**only** thing to get right is that the host serves it **compressed**; all three
do by default. Nothing in the app needs to change.

**The repository is `https://github.com/gimmeurcode/physics-stuff.git`.**

**Prepared 2026-08-13.** Git 2.55.0 is installed (`C:\Program Files\Git\cmd`),
this directory is now a working tree, and `.gitignore` is written and **verified
against a real `git add --dry-run`**, not by inspection: it admits **264 files,
11.4 MB** — the source tree, the 21 harness scripts, the docs and the deployable
`vector-calculus.html` — and excludes every Chrome profile, `apptest-*.html`,
`dom-*.txt`, `shot-*.png` and `audit-*.csv`. Without it the first commit carries
~1.5 GB of harness output. The ignore list was cross-checked line by line
against the delete list in `clean.ps1`, which found six files a from-memory
version had missed (`dom.txt`, `smokedom.txt`, `probedom.txt`,
`audittext-dom.txt`, `audittext-dump.json`, `audittext-findings.csv`).

**`vector-calculus.html` is committed on purpose.** It is generated, and the
rule against editing it by hand stands — but it is also the artifact a static
host serves, so it belongs in the repository.

**Still to do, and both need the owner:** a commit identity (`user.name` /
`user.email` decide how the history is attributed) and the push itself, which
publishes. Nothing else is in the way.

### The artifact — two open risks, both testable

Publishing to claude.ai needs a second build target, because the tool wraps the
file it is given in its own `<!doctype html>…<body>` skeleton.

**Nesting itself is a non-issue and was over-stated once already**: every harness
script has always sandwiched the whole document inside another one's `<body>`,
and browsers hoist the redundant tags and merge attributes. `smoke` and `runall`
have been proving that on every run. The real risks are narrower:

1. **`data-theme` ownership.** The whole palette hangs off
   `:root[data-theme="light"|"dark"]` (`styles.css:39,49`), the toggle writes
   `document.documentElement.dataset.theme` (`82-ui-wings.js:297`), and a
   MutationObserver on that attribute re-themes the canvas (`90-boot.js:240`).
   The artifact host **also** stamps that attribute for the viewer's theme. Both
   use the same attribute and the same two values, so it may simply work — but
   the failure mode is "the theme button does not stick", and nothing tests it.
2. **`html,body{height:100%}` and `height:100dvh`** (`styles.css:64,87`) — a
   full-screen *application* layout placed inside a host container.

**Do not guess at either. Build the variant and run `./smoke.ps1` and
`./auditviewport.ps1` against it**, exactly as for the standalone file. A second
output that no gate tests is precisely the shape of thing this repo keeps finding
defects in.

### What was ruled out, and why — do not reopen without a reason

- **Electron** — ships Chromium, so the verification would transfer, but it is
  150–250 MB per platform against 5.34 MB, needs two builds, and needs code
  signing to be openable at all (macOS Gatekeeper blocks unsigned apps outright).
  **~$200–500/yr** in certificates, and it contradicts §1.7.
- **Tauri** — 5–15 MB binaries, but on macOS it swaps in **WKWebView, Safari's
  engine**. All the harness scripts test Chrome only, so the entire drawing layer
  would be unverified on the engine half the users run. Same signing costs.
- **A single `.exe` for both platforms does not exist.** `.exe` is Windows-only;
  macOS needs a `.app`. Any native route is two builds and two signing regimes.

---

# PART 4 · The session guide

## 4.1 Opening a session

```powershell
./build.ps1        # ~1 s   — always build before believing anything
./smoke.ps1        # ~10 s  — does it parse and boot?
./runtests.ps1     # ~30 s  — must say "0 failed"
```

If those three are green you have a working baseline and can start. **If they are
not, fix that first** — everything else you do will be built on sand, and a
syntax error in a stage file is invisible to `runtests`.

Then read: this document Part 3 for what to pick, `MAP.md` to find the files,
`AUDIT.md` if you are touching something whose accuracy was previously checked.

## 4.2 The working loop

```powershell
./build.ps1        # after EVERY edit
./smoke.ps1        # after EVERY build — 10 seconds, catches the fatal class
./runtests.ps1     # after any engine change
```

Then, matched to what you touched:

| you changed | also run |
|---|---|
| an engine (21–49) | `./runtests.ps1` |
| a stage, a demo, the UI | `./runall.ps1` (~18 min, **background it**) |
| a picker, an accessor, a `pk*` helper, any typed input | `./auditcustom.ps1` |
| **`uiSetHtml`, `stageExit`, or anything writing a panel** | `./auditpanel.ps1` |
| a `derive()` ladder | `./auditderive.ps1` |
| **a preset table — or anything it declares** | `./auditclaims.ps1` |
| **anything in a `frame()`, or any new stage that draws** | `./auditperf.ps1` |
| `mkPlot`, `plotCurve`, the viewport | `./auditzoom.ps1` **and** `./auditframe.ps1` |
| anything that draws | `./auditsize.ps1` **and** `./auditviewport.ps1` |
| any visible text | `./audittext.ps1` then `./auditscan.ps1` |
| an essay | `./auditprose.ps1` (after `audittext`) |
| added or renamed a file | `./map.ps1` |

Two things that waste time if you do not know them:

- **Concurrent Chrome runs need separate `--user-data-dir`.** Two harnesses
  sharing one profile **silently produce an empty dump**, not an error.
  `runapp.ps1` and `runall.ps1` both used `cprof`, so the natural move of
  grabbing a screenshot while the 18-minute sweep ran in the background was
  exactly the collision, and it failed quietly. **Fixed 2026-08-13** — `runapp`
  uses `cprof-app` and all 21 scripts now have distinct profiles, so they can be
  run concurrently. Keep it that way when adding a script.
- **Do not pipe native executables through `2>&1` in PowerShell 5.1.** It wraps
  stderr in ErrorRecords and reports failure on a successful run. Chrome writes
  harmless noise to stderr on every launch.

`runall.ps1` takes ~18 minutes — a foreground call hits the 10-minute shell
limit. **Run it in the background** and do other work while it goes.

## 4.3 Choosing what to work on

**Revised 2026-08-13.** The old order put verification first and performance
last. It was written before anything measured a frame. `./auditperf.ps1` now has,
and one stage issues **14 400 rasterising calls per frame** — so the order below
is sequenced by *what makes the next piece of work cheaper*, not by subject.

1. **Anything red.** A failing gate outranks all new work.
2. ~~**Programme E — performance**~~ — **DONE 2026-08-13** (§3.5). 17 heavy
   stages down to 2; the 2-D mean from 569 to 131 paint calls per frame; the
   panel rebuild from 2.86 MB/s to nothing. The pattern is fixed before the 22
   wings of Programme C could copy it, which was the point of putting it first.
3. **Programme I — delivery** (§3.9) — **now the head of the queue.** Small, and
   it unblocks showing anyone anything. Do the artifact build target and its two
   open risks here. The repository is at
   `https://github.com/gimmeurcode/physics-stuff.git`; Git is installed, the
   working tree and `.gitignore` are ready and verified, and what is left is a
   commit identity and the push itself (§3.9).
4. **Programme F — the permalink.** Still worth doing early, and now more so:
   with the site hosted, "open this link and look at what happens at β = 0.99" is
   how every later piece of work gets demonstrated and reported.
5. **Programme D items 2 and 3** — the both-sides audit and stage-level tests.
   Item 1 is done. This still multiplies everything after it, and it must land
   **before Programme C**, or 22 new wings reproduce the same class of defect at
   scale.
6. **Programme A, EM and atom** (6 stages) — the machinery already exists, so
   these are the cheapest scenario editors left.
7. **Programme B items 1–4** — small, inside wings that already exist, and found
   only by diffing real syllabi.
8. **Programme A, relativity** — build `rlGeodesic` first and plan items 1–5
   together; one engine opens a quarter of the wing.
9. **Programme C**, in the **cheapest-first order in §3.3**, not curricular order.
10. **Programmes G and H** as they become annoying.
11. **Programme A, string theory** — after taking the decision in §3.1.

## 4.3a The order that minimises rework

The request behind this section: *sequence the work so the least of it has to be
done twice.* Seven rules, each of which has already cost this repo a session.

1. **Machinery before instances.** Write the shared helper, then the call sites.
   The `pk*` accessor retrofit worked because the accessor came first; the
   opposite order means editing the same 40 files twice.
2. **Fix a bad pattern before replicating it.** `cxPaint` is the live example. So
   is any convention a new wing will copy — the chip-as-`<div>`s rule was found
   after eleven chips had the wrong shape.
3. **Batch by gate, not by feature.** `runall` costs 18 minutes whatever you
   changed. Doing three stages then running it once beats three separate
   sessions. Group work that shares an audit.
4. **Start the long gate first, then keep working.** `runall` and `audittext`
   both take minutes and both run in the background on their own Chrome profile.
   Launch them, then read or edit while they go. Only `runapp.ps1` collides
   (§4.2).
5. **Do not run gates that cannot see your change.** A prose edit in an essay
   cannot fail `runtests`; a table constant cannot fail `auditzoom`. The table in
   §4.2 is the map. Running everything every time is the commonest way to turn a
   20-minute session into two hours.
6. **Read `MAP.md` and `measure.ps1`; do not grep blind or count by hand.**
   Counting demo groups by grepping `src/` returns 89 or 105 depending on the
   pattern, and the answer is 118.
7. **One coherent unit per session, ending green.** One wing, or one engine plus
   its stages. A session that ends red costs the next session more than it
   gained — and a cold session re-derives context, so leaving a half-finished
   edit is the most expensive possible state to stop in.

**Write down what you measured, not what you built.** `AUDIT.md` is what stops
the next session re-deriving a number that already exists.

## 4.4 Closing a session

1. **Build green**: `smoke` OK, `runtests` 0 failed, plus whichever audits match
   what you touched.
2. **`./map.ps1`** if any file was added or renamed.
3. **One screenshot, looked at.** `./runapp.ps1 -Wing <w> -Demo 'g.i' -Tag x`.
   Two of this repo's defects were visible only this way — a `fmtNum` that
   printed `0` for `0.0032`, and a stage painting every frame on top of the last.
4. **Append to `AUDIT.md`**: what was checked, against what, and anything that
   bit. Not what you built — what you *verified*.
5. **Update this document's Part 3** — strike what is done, correct any count you
   measured. A plan that disagrees with the build is worse than no plan.
6. **`./clean.ps1`** if the harness ran a lot.

## 4.5 Recipes by work type

**Adding a scenario editor** (Programme A): §2.9 for the shape, §2.13 for done.
Find the theorem the presets assume; write the engine that computes it twice by
routes sharing nothing; return the gap; then the editor, the ladder rung, the
demo, the tests.

**Adding a wing** (Programme C): §2.2. Seven places, then `map.ps1`, then
`smoke.ps1`. Insert at the curricular position. Budget: a wing is several
sessions — engine, then stages, then essay and cards, then reader input.

**Adding a stage to an existing wing** (Programme B): the wing's `7*` stage file,
its `72*` demos file, and a `derive()`. If it needs an engine, that engine goes
in 21–49 with tests.

**Fixing a defect**: reproduce it first, then write the test that fails, then
fix. Record it in `AUDIT.md` including *what class of check would have caught it*
— that is how Programme D's list was assembled.

## 4.6 How large is what remains

Honest orders of magnitude, from what the completed work actually took:

Honest orders of magnitude, from what the completed work actually took. **Listed
in the order §4.3 says to do them**, so the top of this table is the next few
sessions and the bottom is next year.

| # | programme | size |
|---|---|---|
| 1 | ~~**E — performance**~~ | **DONE 2026-08-13, one session.** The estimate was right; the *contents* were not — `cxPaint` was one of five per-cell loops, the named "stroke batching" turned out to be a misattribution, and the real win was one shared helper (`ctHeat`) covering ten stages |
| 2 | **I — delivery** | **~1 session, now first, and part-done.** Git, the working tree and a verified `.gitignore` are in place; the website then needs nothing but a compressed host. The artifact still needs a build target and its two risks tested |
| 3 | **F — the permalink** | ~1 session; the rest of usability is ~1 more |
| 4 | **D2–D3 — verification** | ~2 sessions, and it pays for itself before Programme C |
| 5 | A — EM and atom editors | ~2 sessions; the machinery exists |
| 6 | B — syllabus gaps 1–4 | ~4 sessions; items 5–6 are wings, in C |
| 7 | A — relativity | ~10–15 sessions. Build `rlGeodesic` first |
| 8 | **C — 22 wings** | **the largest thing here by far.** Tier 1 is ~2–3 sessions per wing, Tier 3 is 4–6 |
| 9 | G — pedagogy · H — 19 statement cards | ~2 sessions each, plus ongoing |
| 10 | A — string theory | ~8–12 sessions, after the §3.1 decision |

**The first four rows are about five sessions total**, and they are what make
everything below them cheaper or demonstrable. **Programme C roughly doubles the
site** and is measured in months of sessions, not weeks — which is exactly why it
now sits behind the cheap work rather than in front of it.

---

# PART 5 · Traps — where the bodies are buried

Consolidated. Every one of these has cost real debugging time in this repo.

**Fatal, and invisible to the unit suite**

- **Silent name collisions.** One script scope, 230 modules. Prefix and grep
  case-sensitively first.
- **A template hole inside a template hole** is a parse error that takes the
  whole app down while `runtests` still reports passing. `./smoke.ps1` after
  every build.
- **`-x ** 2` is a JavaScript syntax error.** Unary minus may not precede `**`;
  it takes the whole suite down with a HARD ERROR, not a failing assertion.

**Draws nothing, reports nothing**

- **`ctText(ctx, x, y, text, colour, font)` — coordinates first.** 24 labels were
  invisible this way. Sixth argument is a font *string*.
- **Wiring is a separate step from rendering.** The box accepts keystrokes and
  the picture keeps the default. No error.
- **`fmtNum(0.0032, 2)` is the string `0`.** Only a screenshot catches it.
- **A chip's lines must be `<div>`s.**

**Hangs with no error**

- **`ctGrid` on an `mkPlot` whose axes carry different units.** It derives a step
  per axis now, but it used to derive one from the *x* span and apply it to both:
  on a plot with kPa up one side and litres along the other it asked for four
  hundred thousand lines **per frame**. The stage does not error — it stops
  returning, and headless Chrome never exits because virtual time cannot advance
  while the renderer is busy. **If a page hangs with no error, look for a loop
  whose step came from somewhere else.**
- **Zooming out multiplies the data span**, so anything deriving a loop count
  from it must cap. That hang is one zoom gesture away.

**Wrong answers that look right**

- **Reading a field that does not exist** gives `undefined`, which is falsy —
  `laRREF` has no `inconsistent`, and inconsistent systems were silently reported
  as solvable.
- **`nqDoublePolar` hands its integrand CARTESIAN offsets** and has already
  folded in the `r` of `r dr dθ`. Its order argument indexes `NQ_GL`, which stops
  at **5**; asking for 6 returns undefined and throws.
- **`nqAdaptive`'s 16-panel pre-subdivision** exists because adaptive Simpson
  returns 0 on periodic integrands whose zeros hit its sample points. **Leave
  it.**
- **Test an improper integral by pushing a finite cut-off outwards**, never by
  substituting infinity onto a finite endpoint — the latter buries a log
  divergence in truncation error and reports Σ1/n as convergent.
- **Relativity catastrophic cancellations** must be computed in closed form; the
  tests assert the naive route is *wrong*.
- **Circuit sign conventions**: the solver uses one convention (`p = v·i` is
  power *absorbed*, which makes Tellegen's sum close). The display layer flips
  voltage sources only. **Do not "fix" a source showing negative power in
  `ckMeasure`.** A capacitor's current must be read from `e.h.i`.
- **`ctHeat` rounds cell edges to whole pixels** rather than overlapping them;
  overlapping double-composites at translucent alpha and paints a visible grid.
- **Two coordinate systems, two failure modes.** Where a quadrature is centred is
  a physical decision, not a detail — the first `emGauss` engine was exact inside
  the charge and 59% wrong outside it.

**Harness**

- **Headless Chrome fires `requestAnimationFrame` only ~3 times.** Animated
  stages look blank in screenshots unless the harness pumps `stageFrame(dt)` by
  hand. Before hunting a logic bug, measure: read canvas pixels via
  `getImageData` and count non-background samples.
- **You cannot measure wall-clock time under `--virtual-time-budget`.** Chrome
  runs a virtual clock, so `performance.now()` does not advance inside a
  synchronous loop and every stage profiles as exactly `0.00 ms`. `auditperf.ps1`
  counts **work** instead — paint calls, path ops, primitives sorted, bytes of
  HTML regenerated — which is deterministic and identical on every machine. If a
  timing comes back as a clean zero, this is why.
- **A probe that searches its own marker finds its own source.** `--dump-dom`
  returns the injected `<script>` verbatim, so `dom.IndexOf('@@')` matches the
  string literal in the probe before it reaches the rendered element. Anchor on
  `id="REPORT">` instead. Same trap in reverse when checking whether JS ran at
  all: **strip every `<script>` block before searching the DOM**, or the inlined
  source answers for the rendered page.
- **Do not count anything by grepping `src/`.** Demo groups returned 89 with one
  pattern and 105 with another; the booted app says 118. `./measure.ps1` reads
  the numbers out of the running page. The same applies to `mkPlot` sites, stage
  counts and experiment counts.
- **`String.Replace(a, b, count)` does not exist in .NET Framework 4.x**, so it
  throws under PowerShell 5.1 — and if the failure is swallowed, the script
  silently operates on unmodified text. That turned a negative control into a
  clean pass that meant nothing. **A control that reports success needs checking
  itself.**
- **PowerShell variable names are greedy and case-insensitive.** `"$pm1"` is a
  variable named `pm1`, not `$pm` + `1`; `$T` and `$t` are the same variable.
  Both have silently eaten text here. Use `$([char]0x00B1)` or `${pm}1`.
- **Audit scripts carrying Unicode need a UTF-8 BOM.** PowerShell 5.1 reads a
  BOM-less `.ps1` as ANSI.
- **`Set-Content`/`Add-Content` default to the system ANSI codepage.** Pass
  `-Encoding utf8` when writing a file another tool will read.

---

# PART 6 · What was removed, and why

Recorded so nobody looks for it.

## 6.1 The regenerable output — 1.55 GB, deleted 2026-08-12

204 files and 14 Chrome profile directories. Every one was written by a harness
script and read only by that same script in that same run.

| what | size | regenerate with |
|---|---|---|
| `cprof-*/` (14 dirs) | 892 MB | free — Chrome recreates them |
| `dom-*.txt` (69) | 319 MB | free — rewritten next run |
| `apptest-*.html` (69) | 316 MB | free — rewritten next run |
| `audittext-dom.txt`, `audittext-dump.json` | 30 MB | `./audittext.ps1` (~4 min) |
| `shot-*.png` (53) | 14 MB | `./runapp.ps1 … -Tag x` (~20 s each) |
| `dom.txt`, `smokedom.txt`, `probedom.txt` | 11 MB | free |
| `enginetest.html` | 1.4 MB | free — `runtests.ps1` rebuilds it every run |
| `audit-*.csv`, `audittext-findings.csv` (7) | 28 KB | re-run the audit that writes each |

**`./clean.ps1` now does this**, with `-WhatIf` to list first. Run it whenever
the harness has been busy.

The one real cost: `audit-prose.csv` held the enumerated list of 21 named results
with no statement card (Programme H). Four minutes to regenerate.

## 6.2 Dead code removed from `src/js`

Nine functions and one constant, with no caller in `src/`, no reference in
`tests.js`, `shell.html` or any harness script. Build re-verified green
afterwards: **230 modules, smoke OK, 4160 passed / 0 failed.**

| removed | was | why |
|---|---|---|
| `ncFissionEnergy` | ²³⁵U fission Q from **quoted** B/A literals | superseded by `ncReactionQ`, which sums Q from masses. A released energy spelled out as a literal cannot be checked by anything — §2.1 |
| `ncFusionEnergy` | D+T Q from hardcoded masses | same; `ncBind` gets 17.59 MeV from measured masses with provenance |
| `ncPerKg` | joules per kg | helper for those two only |
| `NC_MEVJ` | joules per MeV | orphaned by `ncPerKg` |
| `mvJacobianSym` | exact 2×2 Jacobian of a symbolic pair | stages use the numeric `mvJacobian` beside it |
| `laCharPoly2` | char-poly coefficients of a 2×2 | `laCharAt` next to it evaluates det(A − λI) at any size and is the used one |
| `wvSuperpose` | summed `w.y(x,t)` over a list | four lines any caller would inline |
| `pvReset` | cleared one plot's saved view | `pvResetAll` is what the View panel wires |
| `flDrainTime` | tank drain time | its comment said "needs the ODE rather than the formula" and then returned the formula |
| `mvCompile3` | compiled f(x,y,z) with first partials | its comment named two stages as callers; neither called it |

## 6.3 Unadopted helpers deliberately KEPT

Fifteen functions have no caller today and are kept because a named piece of
remaining work adopts each. **Do not delete these as dead code** — and if you
build the work named beside one, use it rather than writing it again.

| function | file | adopter |
|---|---|---|
| `skDeriv`, `skIntegral` | `59-interact.js` | d/dx and ∫ of a **hand-drawn** curve. C6 (PDEs) — "draw the starting temperature" is the sketch pad's whole point |
| `skControls` | `59-interact.js` | the shared "preset / type / draw" control block; same adopter |
| `lpInside` | `59-interact.js` | point-in-polygon for the region tool; any stage integrating over a reader-drawn region |
| `ckPinName` | `48b-circuit-model.js` | pin labels for tooltips and screen-reader output — Programme F |
| `vcDivergenceCheck` | `27-vcalc.js` | **Programme D's both-sides audit** — already written |
| `igChangeCheck` | `25-integrate.js` | **Programme D's both-sides audit** — already written |
| `laProject` | `38-linalg.js` | projection onto col(A) — syllabus gap B3, abstract linear maps |
| `clAsymptotes` | `28-calc1.js` | curve sketching — vertical, horizontal and slant asymptotes |
| `agRational` | `19-algebra.js` | rational end behaviour — the `functions` wing |
| `opCauchy` | `36-optics.js` | dispersion n(λ) — the rainbow |
| `slTB_DOS` | `44b-solidstate.js` | 1-D tight-binding DOS with its van Hove singularities — a ready-made preset for `slFermi`'s typed DOS |
| `smOccupancy` | `44c-statmech.js` | Fermi–Dirac / Bose–Einstein / Maxwell–Boltzmann as **one formula with a sign** |
| `wsDegeneracyCheck` | `44d-string.js` | Cardy vs exact degeneracy, a genuine two-route check — string item #22 `wsModes` |
| `ckLibComparator` | `48j-circuit-lib.js` | a comparator schematic for the circuit library |

## 6.4 Documents retired

`ROADMAP.md`, `TIER-THREE-ITEMS.md` and `SYLLABUS.md` were folded into this file
and deleted. What was dropped rather than carried over: their session-by-session
progress narratives, which recorded *when* things were done rather than what is
true now. `AUDIT.md` is the surviving record of what was checked and how.


