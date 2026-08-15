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
| about to write anything | **`SITE-RULES.md`** — the nine laws and the universality rule, which outrank this document — then Part 2 here, the mechanics that satisfy them. Both non-negotiable |
| **fixing a defect** | **`SITE-RULES.md` Part 2** — the instance reported is a sample, not the population. Its §2.6 checklist is what "done" means |
| choosing what to work on | **§4.3**, which is ordered by what makes the *next* work cheaper. Part 3 has the detail once you have picked |
| deciding *how* to sequence a change | **§4.3a** — machinery before instances, fix a pattern before replicating it, batch by gate |
| changing existing code | `AI-GUIDE.md` for the mechanics, Part 5 here for the traps |
| looking for a file | `MAP.md` (generated — run `./map.ps1`) |
| needing a count | **`./measure.ps1`** — never grep for one, never quote one from prose |
| wondering if something was checked | `AUDIT.md` (the accuracy record) |
| about to reopen a settled question | **§1.7** first — several are already decided with reasons |

**Verified 2026-08-15 — every gate in §1.6 was run, and this is the first day
that has been true.** `build` 231 modules · `smoke` OK (wings=40, stages=178,
seelinks=80) · `runtests` **4290 passed, 0 failed** · `runall` demos=593
controls=6462 **caught=0 OK** · `auditsides` falsescale=0 presetgap=0 **OK**
(both ratchets at zero since 2026-08-15) · `auditresid` **findings=0**
noscale=7 · `auditcustom` **bad=0 OK** over the 98
stages carrying typed input · `auditclaims` 249 claims **bad=0 OK** ·
`auditframe` cut=3, all three allowed by name **OK** · `auditsize`
**findings=0** · `auditviewport` 16 sizes **bad=0** · `auditpanel` **bad=0** ·
`auditzoom` **findings=0** · `auditmarks` 2303 → 20 · `auditlink`
**findings=0** · `auditperf` 0 wasted panel writes, 2 heavy stages ·
`auditderive` **flagged=0** · `audittext` + `auditscan` **OK** ·
`auditcontrast` **OK** · `auditartifact` **bad=0** · `auditdocs` **bad=0 OK**.

**Name the gates you ran; never inherit a green.** This paragraph used to read
"the build is green on every gate", which was an *inherited* claim: the working
tree carried uncommitted edits to some forty stage files from the previous
session, so the heavy gates' last green predated the code in the tree. `runall`
was then run and did pass — but that is a measurement, not an assumption, and
the list above says which measurements exist.

**The short version, 2026-08-13 (revised twice).** The build was green on every
gate then in existence. **Programme E (performance), Programme I (delivery) and
Programme F's permalink are done.** Performance: the 17 stages over 1 200 paint
calls per frame are down to 2, the 2-D mean from 569 to 131, the panel rebuild
from 2.86 MB/s of HTML to nothing (§3.5). Delivery: `main` is pushed and the
artifact is published and gated (§3.9); the website half is one hosting setting
away, which needs a human. Permalink: `#w=…&d=…&c.<id>=…`, 593 of 593 round
trips exact, gated by `./auditlink.ps1` (§3.6).

**The next work in order is Programme A's EM and atom scenario editors (6
stages, machinery exists), then syllabus gaps B1–B4, then Programme A
relativity.** Programme D closed 2026-08-15: D2's nine PRESET-GAP rows all
attributed (six fixed, three whitelisted with their mathematics, both
`auditsides` ratchets at **0**), and D3's stage-level suite is built and
gated — `./runstagetests.ps1`, 41 assertions calling stage helpers directly,
first run red for a real reason. §3.4 has both records; `AUDIT.md` same date
has the fixes. The standing rule that keeps D3 alive: every stage defect class
fixed adds its two-route test to `tests-stages.js` the same day. Note what the permalink cost and returned: it
touched no stage and fixed **six defects in code it did not own**, every one
invisible to the 22 gates that existed. §4.3a rule 8 is the generalisation.

Four documents survive alongside this one and are not duplicated here:

- **`SITE-RULES.md`** — the layer **above** this one: what must be true of the
  site (the nine laws) and what a fix owes the wings it was not found in
  (universality). Part 2 here is the mechanics that satisfy it. Where the two
  appear to conflict, `SITE-RULES.md` wins.
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

**Re-measured 2026-08-14.** The row values below are the current ones, and
`./auditdocs.ps1` now fails the build if this table, `CLAUDE.md`, `AI-GUIDE.md`,
`README.md` or `SITE-RULES.md` drifts from what the site actually reports.

| quantity | value | how it was measured |
|---|---|---|
| wings | **40** | `./measure.ps1` (and `./smoke.ps1` → `wings=40`) |
| guided experiments | **593** | `./measure.ps1`, from `WINGS[*].groups[*].items` in the booted app |
| demo groups | **118** | same. **Do not grep `src/` for this** — patterns return 89 or 105 |
| experiments driving a canvas stage | **508** | same (the other 85 drive the field pipeline) |
| canvas stages | **178** | `./smoke.ps1` → `stages=178`; `./measure.ps1` confirms `unreachablestages=none` |
| source modules | **231** | `./build.ps1` |
| harness scripts | **29** | `Get-ChildItem *.ps1` (re-measured 2026-08-15). Every one must appear in §1.6 and §4.2 — `./auditdocs.ps1` checks |
| deployable size | **5 409 933 bytes** (5.41 MB / 5.16 MiB) | `./measure.ps1`. **`build.ps1` prints a smaller figure, which is a CHARACTER count** — the Unicode maths symbols cost ~57 KB more as UTF-8 bytes. Both are far inside any upload limit. **A fresh `git clone` builds ~15.6 KB smaller**: `.gitattributes` normalises line endings to LF and 54 of the source files carried CRLF when this was measured, which is 15 627 carriage returns. The app is identical — but this is why the row says *measure*, not *quote* |
| source lines | ~77 044 (all of `src/`) | `./measure.ps1`; `./map.ps1` reports `src/js` alone |
| unit tests | **4290 passed, 0 failed** | `./runtests.ps1` (re-measured 2026-08-15) |
| `mkPlot` call sites | **250** | `./measure.ps1` |
| permalink round trips | **593 of 593 exact**, 11 demos measured stochastic | `./auditlink.ps1` |
| declared table claims | **249, bad=0** | `./auditclaims.ps1` |
| "See it in the laboratory" links | 80, all resolving | `./smoke.ps1` → `seelinks=80` |

**The stale numbers this table replaced.** Each row was true when it was
written, and every one was found by hand rather than by any gate:

| document | claimed | corrected |
|---|---|---|
| `AI-GUIDE.md` | 4175 unit tests in one paragraph, 4207 in another | 2026-08-14 |
| `README.md` | 230 modules, 4175 unit tests | 2026-08-14 |
| `CLAUDE.md`, `AI-GUIDE.md` | 584 experiments, 222 modules, 3759 unit tests | 2026-08-12 |
| the retired `ROADMAP.md` | 555 experiments, 213 modules, 2460 unit tests | 2026-08-12 |

That is why **`./auditdocs.ps1`** now exists: it re-measures the site and fails on
any document that contradicts it. **A count in prose goes stale within a session
— measure before quoting, and date the quote.** A figure on a line carrying a
`YYYY-MM-DD`, or under a dated heading, is read as a record and exempted; every
other figure is a live claim and is checked.

## The invariant that must hold on every build

```
./build.ps1     → 231 modules, no error
./smoke.ps1     → smoke OK        (parses, boots, nav agrees, no ctText shift)
./runtests.ps1  → 0 failed
./auditdocs.ps1 → bad=0 OK        (the documents still describe the site)
```

**A claim in a preset table is not covered by any of those three.** `./auditclaims.ps1`
(~30 s) is the fourth, and the only thing that recomputes what the tables assert
about themselves.

**Nothing above measures cost.** `./auditperf.ps1` (~40 s) is the fifth, and the
one guess ever made without it — that the 3D stages were the expensive ones — was
wrong by a factor of forty. Run it before optimising anything, and after adding
any stage that draws per-cell or per-sample.

**`./auditdocs.ps1` is in the invariant because documentation is part of the
deliverable, not a report about it** (`SITE-RULES.md` §1.9). It costs ~1 minute
and it is the only thing that reads a `.md` file at all: a stale count is a
false claim on the same footing as a wrong readout, and every one of the eight
found on 2026-08-14 had survived every other gate indefinitely.

If those do not pass, nothing else matters and nothing else is worth running.

---

# PART 1 · What is built

## 1.1 The shape of the thing

```
src/head.html      <- <meta>, title
src/styles.css     <- the whole design system
src/shell.html     <- the DOM skeleton (header, canvas, dock, rail, palette)
src/js/*.js        <- 231 modules, concatenated in ORDINAL filename order
        |
        v  ./build.ps1
vector-calculus.html   (5 409 933 bytes on 2026-08-14, the deployable artifact)
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

**29 scripts** (`Get-ChildItem *.ps1` — **that command is the authority, not this
number**; the table below listed 23 until 2026-08-14, when `auditmarks` and
`auditresid` turned out to have been missing from it since they were written, and
the "nine" the line claimed before that was wrong for far longer;
`runstagetests` joined 2026-08-15). What matters
is **what each one can see that the others cannot** — every one of them exists
because something shipped through a blind spot. `./auditdocs.ps1` now fails if a
script exists that this table does not describe.

| script | time | must print | sees what nothing else does |
|---|---|---|---|
| `build.ps1` | ~1 s | `231 modules` | — |
| `auditperf.ps1` | ~40 s | *(a ranking)* | **where a frame goes** — paint calls, path ops, 3D primitives sorted, and **the bytes a refresh rewrites when nothing has changed**, for all 178 stages. Nothing else measures cost at all, and *both* guesses made without it were wrong: that 3D was the expensive part, and that unbatched strokes were. Its panel column used to report the panel's **size**, which could not see its own fix — it reports **writes** now |
| `measure.ps1` | ~15 s | *(the Part 0 table)* | the headline counts, **from the booted app** — wings, groups, experiments, stage-driven vs field, and any stage no demo reaches. Static greps over `src/` for the group count return 89 or 105 depending on the pattern; the app says 118. Also the artifact's real **byte** size, which `build.ps1` does not print |
| `smoke.ps1` | ~10 s | `smoke OK` | whether the bundle **parses and boots at all**; nav/home/`NAV_GROUP_OF` agreement; every stage carries all nine methods; all 80 see-links resolve; `ctText` argument shifts; **markup inside canvas text**, which the canvas draws as its own tags and nothing else can see |
| `runtests.ps1` | ~30 s | `0 failed` | engine arithmetic (modules 21–49 only) |
| `runstagetests.ps1` | ~30 s | `===STAGETESTS=== N passed, 0 failed` / `runstagetests OK` | **the stages' own arithmetic, called directly** — the corpus in `tests-stages.js` runs inside the booted bundle and asserts two-route agreements on stage helpers with synthetic states (`igTriple.volume` by three routes, `odNonhom.yp` substituted back into its equation, `laLSQ.fit`'s orthogonality *and* unimprovability, `rlOrbit.setup`'s bound orbits, the dfHarmonic mean-value cases, `agCur`'s branch). Built 2026-08-15 as Programme D item 3; tolerances come from each route's measured error, it carries the pre-fix box clip as an in-run corrupt control, and **its first run failed for a real reason** — the ISCO preset's second perihelion lay outside a 4π integration span and the readout called a bound zoom–whirl orbit a plunge. The corpus grows by standing rule: every stage defect class fixed adds its test here the same day |
| `runall.ps1` | ~18 min | `caught=0 OK` | every demo × every control actually runs; greps prose for `undefined`/`NaN`/`Infinity` |
| `auditcustom.ps1` | ~1 min | `bad=0 OK` | the **"type your own" path**, which `runall` never selects. Drives textareas from their `data-audit` attribute |
| `auditartifact.ps1` | ~1 min | `bad=0` | whether the app survives being **published as a Claude artifact** — nested inside the host's own document, in all three viewer-theme states including the *system* one that stamps no `data-theme` at all. Reads the theme back two ways, the CSS token **and** the array the canvas paints with, because a toggle that moved one and not the other would repaint every picture for the wrong theme |
| `auditlink.ps1` | ~2 min | `findings=0` / `auditlink OK` | whether a **permalink reproduces the view it was copied from** — all 593 demos, perturbed, copied, navigated away from and followed back, plus one **cold load** through `plInit()` inside `boot()`. Two routes, and the first alone is worthless: the controls, *and* the text the visible panels print **from** those controls. Neutering `plNotify` so a restore fills every box and tells no stage anything leaves 586 of 593 passing the control comparison and fails 505 on the text. Also fails on a **duplicate element id** under `#dock`, because a permalink's keys *are* element ids. It **measures** which demos are stochastic rather than keeping a list of them (11 are) |
| `auditpanel.ps1` | ~20 s | `bad=0` / `auditpanel OK` | whether a stage still has its readout, ladder and chip **after being left and reopened**. `uiSetHtml` skips a write matching what it last wrote, so the panels are stateful and anything clearing them behind its back makes the next identical refresh a silent no-op. On the build that introduced it **145 of 178 stages came back blank and `runall` still said `caught=0`** — it visits each demo once and never returns to one |
| `auditderive.ps1` | ~40 s | `flagged=0 OK` | every stage's `derive()`, which **nothing else calls**; and whether rungs carry reasoning or restate algebra |
| `auditclaims.ps1` | ~30 s | `bad=0 OK` | whether the **preset tables tell the truth** — 249 declared claims across 14 tables recomputed by an independent route. Reaches `EIG_PRESETS` (78b) and `NM_FUNCS` (79g), which are outside the window `runtests` extracts |
| `auditresid.ps1` | ~1 min | `findings=0` / `auditresid OK` | whether a **residual is printed as though it were a measurement**. A row promising a difference must carry the scale it is read against, and two ways of failing that both shipped: `fmtNum`'s dead zone at [1e-4, 5×10⁻ˢⁱᵍ) printed `dyForce`'s genuine 7.8% gap as "difference 0 J" in the affirmative colour, and a circuit at steady state printed 29.7 fA of pure round-off as a finding. It reads **rendered panel text**, not source, so a new way of getting it wrong is caught too. **Widened 2026-08-14 after its own blind spots were measured**, and each one was hiding real defects: it read only `readout` and `chip`, so the **derive ladder** (~717 000 rendered characters) and the legend were invisible; it tested "is the scale printed?" against the *whole* panel text, and `SCALED` contains `of\s`, so **any panel containing the word "of" exempted itself**; its round-off pattern matched only the typeset `×10⁻ⁿ` form, so every residual printed through **`toExponential`** was invisible; and with `st.own` false at entry it never rendered the **55 stages' reader-supplied surfaces** at all — where 13 of the defects were. Now also reports an **advisory `noscale=`** count that does not fail the build, because no regex separates a two-route residual from a physical difference (`SITE-RULES` Part 4) |
| `auditsides.ps1` | ~2 min | `auditsides OK` *(a ratchet)* | whether the two routes a theorem stage computes **actually agree, on every preset the reader can select**. `auditresid` asks whether a difference is printed *with its scale*; this one reads the number. It drives the real segmented controls over the whole preset product — **791 combinations across 78 demos, 5676 panel renders, 134 distinct two-route claims**, none of which anything had ever read — and classifies each claim by the verdict `fmtGap` renders. **FALSE-SCALE**: the routes agree to round-off and the panel reports ~100%, because `fmtAgree` derives its scale as `max(|a|,|b|)` and both routes vanished (`dyMoment` at e = 1 printed `1.78×10⁻¹⁵ (100% — agreeing to 0 figures)` under prose promising they "match exactly"; `smBoltz` managed it at **1.81×10⁻¹⁷⁰**). **Found 10, fixed 10 the same day** by `fmtAgreeGross` and a gross per vanishing integral, so **its baseline is 0 and one new instance fails the build**. **PRESET-GAP**: the same claim is exact on one preset and poor on another — the cylinder-normal detector, and it needs no hand-chosen tolerance because the stage's own best preset sets the standard. The **ratchet on `$BASE_PRESET` reached 0 on 2026-08-15** — the whole backlog attributed, so a new row of either class fails the build; eleven honest exceptions are whitelisted **with their reasons** and nothing else is. **weak** rows are advisory: a 14-slice Riemann sum is *supposed* to disagree |
| `auditmarks.ps1` | ~1 min | *(old → new scores)* | whether the **key points drawn on a plot are real**. `pvFeatures` marked a break wherever a step beat 12× the curve's *median* step — which asks whether this part is steeper than the rest, not whether the curve is broken — so any curve with a long flat tail grew a picket fence of false poles. **2303 → 20 markers** across the stages, with controls proving `tan` and `1/x` keep their real poles: the first attempt scored 2303 → 10 and **silently dropped tan's pole**, which is the whole argument for having a control |
| `auditdocs.ps1` | ~1 min | `bad=0 OK` | whether **these documents still describe the site**. It re-measures wings, experiments, groups, stages, modules, tests, see-links, scripts and artifact size, then reads every live `.md` and fails on a contradiction; checks that every `*.ps1` on disk is described in §1.6 and §4.2 and listed in `AI-GUIDE.md`; and that every file path a document names exists. **An undated number is a live claim; a number on a line carrying a `YYYY-MM-DD`, or under a dated heading, is a record and is exempt** — that is the only escape hatch, and it is honest because it says when the figure was true. **`-Fix` rewrites the stale counts** (exactly the digits it verified, printing each substitution — then read the diff). **`-SkipTests` makes the run partial and it says so**, because a `bad=0` from a run that did not look is worse than no gate. Nothing else reads a `.md` at all, and eight false counts had survived every other gate indefinitely |
| `auditzoom.ps1` | ~1 min | `findings=0` | pan/zoom on all 178 stages, **and mkPlot's identity-at-rest** |
| `auditframe.ps1` | ~1 min | `auditframe OK` | how much of each curve falls outside its window, classified `LINE`/`POLE`/`MINOR`/`CUT`. **A gate since 2026-08-15** — §3.10 asked for it, and the work was never the exit code but attributing the four stages that were cut. Two were real and are fixed; three are allowed **by name, with the mathematics that makes each one honest**, and it warns when an allowlist entry stops cutting so a stale name cannot wave a new defect through |
| `auditsize.ps1` | ~2 min | `findings=0` | eight canvas shapes — layouts that only break at another aspect ratio |
| `auditviewport.ps1` | ~3 min | `bad=0` | sixteen real window sizes, and the page *around* the canvas |
| `audittext.ps1` | ~4 min | harvest written | what every panel **says** — drives all 593 experiments, harvests `textContent` |
| `auditscan.ps1` | ~20 s | 0 HIGH | ASCII stand-ins, leaked markup, empty panels, `NaN` in the harvest |
| `auditprose.ps1` | ~1 s | *(an inventory)* | essays that decline to justify a result; named theorems with no statement card |
| `auditcontrast.ps1` | ~1 s | — | WCAG contrast and the 12 px type floor |
| `auditticks.ps1` | ~1 min | `auditticks OK` | what the axis furniture and headings **actually paint** — it wraps `fillText` on the canvas prototype over every stage's live frame. Two checks nothing else can make: **duplicate tick labels** (fmtNum's decimals clamp collapsed any axis with span ≲ 0.01 into `0.002, 0.002, 0.002 …` — the statmech density axis, found only by a screenshot on 2026-08-15; `fmtTick` derives precision from the step and both owners use it), and **headings under the readout chip** (the chip floats over the canvas top-left; `ctTitleClearChip` slides plotFrame/ctFrame titles clear, and 5 stages' fixed captions were moved). Carries **three controls in every run**: the real `ctGrid` on a small-span window must be clean, the old `fmtNum(v,3)` labelling replayed on it must be flagged, and a heading drawn at the chip's centre must be flagged — a gate never seen to fail is not known to work |
| `runapp.ps1` | ~20 s | — | one demo, screenshotted, for a human to look at. Uses `cprof-app`; **it used to share `cprof` with `runall` and that collision is now fixed** — every script has its own profile |
| `map.ps1` | ~2 s | *(a count)* | regenerates `MAP.md`, the index of every module, stage and wing. Run it after adding or renaming a file, **or after adding a top-level function** — the index lists what each module defines |
| `clean.ps1` | ~2 s | — | deletes everything the above regenerate |

**One blind spot is known and unfixed:**

1. ~~`runtests.ps1` extracts only modules 21–49, so none of the 178 stages' own
   arithmetic is unit-tested.~~ **Covered 2026-08-15 by `./runstagetests.ps1`**
   (Programme D item 3): the suite in `tests-stages.js` calls stage helpers
   directly inside the booted bundle. The *corpus* is seeded, not exhaustive —
   it grows by the standing rule that every stage defect class fixed adds its
   test the same day — so `runall` still proves the rest merely runs.
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

**These are the mechanics. The laws they serve are in `SITE-RULES.md`**, which
outranks this part — read it first if you are settling a question rather than
looking up a call. In particular, its Part 2 (**a defect is found in one place
and fixed in every place it exists**) governs every rule below: each one here was
written after a class of defect was found at one instance, and §2.6 there is the
checklist that says when a fix is finished.

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

**Name collisions are silent.** All 231 modules share one script scope. Prefix
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
2. **A both-sides audit.** **BUILT 2026-08-14 — `./auditsides.ps1`. The sweep is
   done; 24 of its findings are not fixed, and they are listed below.**

   It drives the real segmented controls over the whole preset product —
   **791 combinations across 78 demos, 5676 renders, 134 distinct two-route
   claims** — and reads the verdict `fmtGap` renders on each. Nothing had ever
   read one: `auditresid` (the neighbouring gate) asks whether a difference
   carries its *scale*, and a row can pass that while reporting a 30%
   disagreement, because nothing looked at the number.

   **Two things the build of it settled, and neither was the plan above.**

   *First, `vcDivergenceCheck` and `igChangeCheck` were the wrong primitives to
   build on.* They are engine functions; the defect is in what the **panel
   prints**, and a gate reading engine returns would not have seen `dyMoment` at
   all. Reading rendered text instead means a stage that computes its two sides
   inline — most of them — is covered without being retrofitted.

   *Second, the sweep the neighbouring gate claims to do does not happen.*
   `auditresid` carries a loop commented "every scene / preset the stage offers,
   not just the one it opens on", drawing its pool from `S.scenes`. **No stage
   has ever defined `scenes`**, so the pool is empty on all 178 and the loop body
   has never once executed; the key names it then tries (`scene`, `mode`,
   `preset`, `key`, `which`, `view`) are not the names stages use either
   (`vcStokes` holds its presets in `st.cap` and `st.fld`). The comment is right
   about why it matters and the code does nothing. **A loop that iterates an
   empty collection is indistinguishable from a loop that works**, which is the
   general lesson: assert the sweep visited something.

   **The findings, 2026-08-14 — 10 FALSE-SCALE, 14 PRESET-GAP, 16 advisory.**

   **FALSE-SCALE is one class with one cause, and it is J9 inverted.** There a
   real gap printed as `0`; here a *zero* gap prints as 100%. `fmtAgree(a, b)`
   derives its scale as `max(|a|,|b|)`, which is right until both routes
   legitimately vanish — then the derived scale **is** the round-off, and a
   perfect result reads as total disagreement in the alarming colour. Ten sites:
   `dyMoment` (e = 1, gap 1.78×10⁻¹⁵ J against a 9.5 J cancellation),
   `cxContourInt` (`invsq` — an analytic integrand, so both routes are zero),
   `igMass`, `vcGreen` (×2), `vcStokes`, `vcDiverg`, `smBoltz` (×2, at
   **1.81×10⁻¹⁷⁰**).

   **FIXED 2026-08-15, all ten — `fmtAgreeGross(a, b, gross, unit)`.** The
   honest scale is the quantity the cancellation came from, which §2.1 already
   demands be printed beside a vanishing integral ("∮|B·n̂|dA next to ∮B·dA").
   New: `vcLineGross`, `vcSurfFluxAbs`, `cxContourGross`, a `gross` field on
   `vcStokesCheck`/`vcDivergenceCheck`/`igParallelAxis`, `Mabs` on `igLamina`;
   `dyMoment`'s was already in scope (`C.K0`) and `smBoltz`'s is kT.
   **`falsescale` 10 → 0**, and the baseline is now 0, so one new instance fails
   the build — proved by putting `dyMoment`'s back and watching it fail.

   **Two things about the fix were wrong on the first attempt, and the tests
   caught both.**

   *The gross must set a FLOOR, not rescale the verdict.* `fmtAgreeGross` first
   took `max(|a|,|b|,|gross|)` as the scale — which reports a genuine **50%**
   disagreement as **5%** whenever the gross is ten times larger, burying
   exactly the defect this family exists to surface. It now returns the ordinary
   `fmtAgree` verdict above the floor and "they agree to every digit" below it.

   *And the gross is `|F||dr|`, not `|F·dr|`.* Integrating the absolute value of
   the **dot product** gives zero for a field pointwise perpendicular to its
   element — a vortex round a circle, an inverse-square field along one, a swirl
   across a sphere — so the gross was itself zero and rescued nothing. That took
   the count to 4 rather than to 0. The direction is part of what cancelled, so
   the scale is the magnitude of the vector times the length of the element.

   **Three further defects fell out of the same sweep**, none of them the
   residual it started from:

   - **`igMass` printed a centroid of ȳ = −11 538 634 339 406 766.** The `edge`
     density is ρ = y, which over a region symmetric about the x-axis integrates
     to **exactly zero** — so the panel divided by a mass of −1.8×10⁻¹⁶. It now
     measures `M` against `Mabs = ∬|ρ|dA`, flags the plate `massless`, and says
     "not defined — the net mass is zero" in the readout, the chip, the canvas
     note and the parallel-axis card, which has no content without a centroid.
   - **`cxContourInt` opened on a contour running through two poles.** The
     default is a circle of radius 1 about the origin, and `1/(z−1)(z+1)` has
     its poles at precisely ±1. The midpoint rule samples just *inside* the
     circle, so nothing overflowed and nothing was `NaN`: it sampled |f| ~ 10⁶
     twice and printed a number, beside a residue sum of 0. New
     `cxPoleClearance` measures the approach **in units of the quadrature step**
     — the error near a simple pole goes like (h/d)² — and both readout and chip
     now say the integral is not defined there.
   - **`wsRegge` printed its percentage twice**, inside a bracket nothing
     closed: `18.5 MeV/fm ( (2.06% — agreeing to 1 figure)2.06%)`. A hand-built
     percentage predating `fmtAgree` had been left behind, its opening bracket
     still living inside the unit argument.

   **The whitelist is four entries, where this section predicted one.** All four
   are the same theorem failing the same way, and each is the *point* of its
   preset: Green's and the divergence theorem require the field on the **whole**
   region, and a vortex, a source and an inverse-square field are each undefined
   at the origin that region encloses. Boundary integral 2π or 4π, area integral
   0. That gap is where the residue theorem and Gauss's law come from.

   **And a defect in the harness itself, found because it kept eating runs.**
   Under `$ErrorActionPreference = 'Stop'`, PowerShell 5.1 turns every stderr
   line from a **native** command into a terminating `NativeCommandError` — and
   Chrome writes to stderr whenever it likes, none of it a failure: USB device
   enumeration, "Created TensorFlow Lite XNNPACK delegate for CPU", GCM
   registration, a default web-app install that did not happen. All four
   appeared on this machine in one session. **19 of the 20 Chrome-driving
   scripts had this shape**, and it killed an eighteen-minute `runall` *after*
   the sweep finished and *before* the DOM was written, so the result was thrown
   away. All 20 are now guarded. The failure is loud rather than silent, which
   is the only reason it had not corrupted a result — but it is why a green run
   should never be assumed from a script that did not print its own verdict.

   **PRESET-GAP needs attribution before it can be a gate, and that is the
   expensive half.** The signature — exact on one preset, poor on another — is
   equally the mark of a real defect *and* of a demo deliberately showing where
   a theorem's hypothesis fails. `cxMap`'s conjugate preset **must** break
   Cauchy–Riemann; `vcConserv`'s rotational field **must** fail to have a
   potential; `igDoubleRect`'s Riemann sum is exact for `f = 1` and nothing else
   **on purpose**. Those are the lesson. Whitelisting fourteen rows unattributed
   would be worse than measuring none of them, so none were whitelisted.

   **Hence a ratchet, not a threshold.** `$BASE_FALSE`/`$BASE_PRESET` hold the
   counts measured that day and the gate fails on any *increase*, so a new
   defect of either class is caught the moment it lands while the backlog stays
   visible. **Lower them as rows are cleared.**

   **CLOSED 2026-08-15 — the remaining nine rows attributed, ratchet 9 → 0.**
   Six were fixed, three whitelisted with their mathematics; the full record,
   with the before/after numbers for each, is `AUDIT.md`'s "D2 closed" entry of
   the same date. The headline finds: the ISCO orbit preset was seeding L from
   the Newtonian vis-viva and *plunging*, and the NaN printed as "they agree to
   every digit" — a **class defect in every difference formatter** (`!(rel >
   floor)` is true for NaN), whose fix immediately exposed `laLSQ` printing two
   orthogonality rows as perfect agreement off a NaN scale since the stage was
   written; the box solid's cylindrical route was 0.24% off because Gauss
   points straddled the shadow's rim (fixed by breaking the quadrature at the
   rim and at the corner directions — box now 1.5×10⁻⁹); and the beats demo's
   "steady state" was measured with 2.9% of transient left. Both ratchets are
   0; the gate was corrupted once (whitelist key) and watched to fail.

   **Four rows had been attributed earlier the same day, ratchet 13 → 9.** All four are the
   preset *designed* to fail the claim, whitelisted with their mathematics:
   `cxMap` conj (f = z̄, Wirtinger derivative 1, so the row reads exactly 2 —
   Cauchy–Riemann failing is the preset's purpose), `vcConserv` rot (the path
   difference IS non-conservativity), and `igDoubleRect`'s two "error at m/2m"
   rows (a lower Riemann sum is exact only for f = 1, and watching the error
   halve is the demo). The cxMap key put real Unicode into the whitelist, so
   **`auditsides.ps1` now carries a UTF-8 BOM** — §1.6's rule, bitten a third
   time, caught before it shipped this time. The nine rows that remained were
   attributed later the same day by exactly that method — halve the step, watch
   the order — and the ratchet is 0 (the CLOSED note above).

   **Its negative control found a defect in the gate itself, which is the
   argument for having one.** Corrupting `vcGreen`'s planimeter by 5% changed
   nothing the gate reported: its readout carries **three** rows labelled
   "difference" — circulation, flux, planimeter — and keying on the label alone
   merged all three into one claim whose min was already 0 from the row beside
   it. Keying on the label's ordinal within the surface separated them, the
   corruption was caught, and **the separation immediately exposed two further
   real FALSE-SCALE sites** the merge had been hiding (8 → 10).

   **`dyEnergy` — RESOLVED 2026-08-15, and the recorded hypothesis was wrong.**
   It was guessed here to be friction or a transient. Measured: μ is already
   **0**, and on entry the drop is **−1.4×10⁻⁶ m** — the body is a rounding
   error *above* where it started, so `√(2g·drop)` takes its `max(0, …)` branch
   and is exactly zero against a real 0.0132 m/s. Two numbers, one of them zero
   by clamping. **`fmtAgreeGross` was tried and is the wrong tool** — it floors a
   gap that is *round-off*, and this one is not — so the row now says "not yet —
   it has not dropped" until there is a drop to compare against, which is §2.1's
   own instruction. The residue that remains once it is moving decays
   32% → 8.9% → 2.4% → 0.51% and settles near **0.3%**: the fixed-step
   integrator's truncation error, now named in the prose beside it.

   **Attributed and fixed the same day:** `igTriple` (see item 3 below — 471%
   wrong on the tetrahedron, NaN on the box, both reachable by a reader), and
   **`odNonhom`**, whose `yp()` tested four forcings and then **fell through to
   the cosine branch for everything else** — so a reader's own g(t) was answered
   with the particular solution of 2cos(ωt), a different equation, plotted and
   labelled y_p. The residual of 2.37 was the honest measurement of a wrong
   function. It returns null now, and the panel says undetermined coefficients
   does not apply and points at variation of parameters in the next card, which
   needs no guess and is already computed there. **A wrong number became the
   reason the next method exists.** `presetgap` 14 → 13, baseline tightened.

   **Three of the four chased so far were fallthrough or scope bugs, not
   numerics** — a clip that tested one coordinate, a branch that read the wrong
   bounds, a switch with no default. The gate found them by *rendering* what the
   reader sees on a preset combination nothing else visits; none would have been
   caught by making the arithmetic more accurate.
3. ~~**Stage-level unit tests.**~~ **HARNESS BUILT 2026-08-15 —
   `./runstagetests.ps1` + `tests-stages.js`, 41 assertions, `0 failed`, and
   its first run failed for a real reason** (the ISCO preset's zoom–whirl
   orbit was being called a plunge — a third case the readout now names). The
   corpus is seeded on the two-route helpers this programme's own defects came
   from and grows by standing rule: every stage defect class fixed adds its
   test the same day. `runtests.ps1` extracts only 21–49, so none of the
   178 stages' arithmetic was tested. The numeric Fourier path had zero tests,
   which is exactly why a factor of two lived in it.

   **The case for this is now concrete rather than theoretical.** On 2026-08-15
   `igTriple.volume()` — stage arithmetic in `67c`, outside the window — was
   found returning **0.952 for a tetrahedron of volume 1/6 (471% wrong)** and
   **NaN for the box**, on a coordinate system any reader can select. Three
   existing gates were blind to it by construction: `runtests` cannot see module
   67; `auditclaims` recomputes `IG_SOLIDS.exactVol` but by the *Cartesian*
   route, which was always correct; and `runall`'s NaN grep looks for the word,
   while `fmtNum(NaN)` renders an em dash. It took driving the preset product
   and reading the rendered number.
   **The lesson for how D3 is built:** the value is not in testing stage helpers
   in isolation — it is in testing the ones with **two routes to the same
   answer**, where a test can assert they agree without knowing which is right.
   `igTriple` had two and nothing compared them.

**This programme is worth doing before Programme C**, because 22 new wings
written without it will reproduce the same fourteen defects at scale.

## 3.5 Programme E — speed — **DONE 2026-08-13**

**Executed and measured 2026-08-13. `AUDIT.md` has the full entry.** The figures
below are a dated before/after record, not live counts.

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
| ~~**No permalink**~~ | **DONE 2026-08-13.** `82a-permalink.js`: `#w=<wing>&d=<group.item>&c.<id>=<value>`, restored by driving the real controls so no stage needed changing. The URL carries only the **difference** from what the demo opened with, so a link is short and says what its author meant; the restore target is those defaults with the overrides merged on top, because a control sitting at its default can still need setting (moving `igFx` stops the sweep the link wanted running). The address bar follows wing and demo; **Copy link** captures the controls. **Not encoded, deliberately:** the View panel's pan/zoom (no stable plot identity), `ddAng` (the device that moves û, not a description of it), the theme (the viewer's). Gate: `./auditlink.ps1`, 593/593 exact, both negative controls seen to fail |
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

### What was measured 2026-08-13, so nobody re-derives it

**These are dated records of one measurement, not live figures** — the artifact
has grown since (Part 0 has the current byte count). The *ratios* are what this
table is for, and they hold.

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
11.4 MB** — the source tree, the harness scripts, the docs and the deployable
`vector-calculus.html` — and excludes every Chrome profile, `apptest-*.html`,
`dom-*.txt`, `shot-*.png` and `audit-*.csv`. Without it the first commit carries
~1.5 GB of harness output. The ignore list was cross-checked line by line
against the delete list in `clean.ps1`, which found six files a from-memory
version had missed (`dom.txt`, `smokedom.txt`, `probedom.txt`,
`audittext-dom.txt`, `audittext-dump.json`, `audittext-findings.csv`).

**`vector-calculus.html` is committed on purpose.** It is generated, and the
rule against editing it by hand stands — but it is also the artifact a static
host serves, so it belongs in the repository.

**PUSHED 2026-08-13.** `main` is live at
`https://github.com/gimmeurcode/physics-stuff` — 265 files, verified on the
remote rather than trusted from an exit code: no `cprof*`, `apptest-*`, `dom-*`,
`shot-*` or `audit-*.csv` reached it, and `vector-calculus.html` is there.
Identity is repo-local (`gimmeurcode <micahwilliam1@gmail.com>`); no global Git
config was touched.

**The website half of this programme is now one setting away**: point any static
host at the repository and confirm it serves **compressed**. Cloudflare Pages,
GitHub Pages and Netlify all do by default, which takes the 5.35 MB file to
~1.35 MB over the wire (measured above). Nothing in the app needs to change.

**What is left in Programme I is the artifact target** — the second build and
the two open risks below, neither of which should be guessed at.

### The artifact — **DONE 2026-08-13. Both risks measured, and NO second build target is needed.**

The live artifact is
`https://claude.ai/code/artifact/289811c9-07a8-4419-87cc-b4b55e04a538`, carrying
this build — verified by fetching it back and finding `uiSetHtml`, `ctHeatBuf`,
`cxPaintBitmap`, `startLoop` and `CT_HEAT_BUFS` in the served bytes, none of
which were in the copy it replaced.

**`./auditartifact.ps1` (~1 min, `bad=0`) is the gate.** It wraps the file
exactly as the publisher does and drives it in **all three viewer-theme states**,
because the third is the dangerous one: an explicit choice stamps `data-theme`,
but the default *system* setting stamps **nothing**. Measured, per state — boots
(40 wings, 178 stages, 41 nav buttons, 0 JS errors), `.app` fills the viewport
exactly (1662×848 in 1662×848), no horizontal document scroll, canvas intact,
and the theme button flips the attribute, the CSS **and** the canvas.

| risk as written | what was measured |
|---|---|
| `data-theme` ownership — "the failure mode is the theme button does not stick" | **Not a problem.** Host and app use the same attribute and the same two values, so they compose. The palette is defined on bare `:root` with `[data-theme]` as *overrides*, so the no-attribute "system" state has a complete palette rather than none |
| `html,body{height:100%}` + `height:100dvh` in a host container | **Not a problem.** `.app` matched the viewport to the pixel in every state |

**The reason to keep the gate** is the second route in it: the theme is read back
both as the CSS custom property `--bg` **and** as `TH.bg`, the array the canvas
renderer actually paints with. A toggle that moved the CSS but not the canvas
would leave every picture painted for the wrong theme, and nothing else looks at
that. Disabling the `MutationObserver` in `90-boot.js` makes it fail in all three
states; it passes on the clean tree.

**One caveat that is not a defect:** a shared artifact serves a **pinned**
version, so viewers holding the link keep seeing whatever was pinned until the
pin is moved from the page's share menu. Publishing updates the artifact; it does
not move the pin.

The original text of this section is kept below, because its instruction —
*do not guess, build the variant and test it* — is what produced the answer.

Publishing to claude.ai wraps the file it is given in its own
`<!doctype html>…<body>` skeleton.

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


## 3.10 Programme J — the visual defect sweep (opened 2026-08-13)

**Where this came from.** Forty screenshots of the running site, taken by the
reader. **Every one carried a defect, and every gate was green at the time** —
which is the fact to hold on to: the harness proves the laboratory *runs* and
*says* the right things, and had almost nothing that looks at what it *draws*.
Twenty root causes, most of them shared across many stages, so the count of
affected stages is far larger than the forty pictures.

**Read the root causes, not the screenshots.** Nine of the forty are one CSS
rule; eleven are one missing clip.

| # | defect | seen in | root cause | gate that should have caught it |
|---|---|---|---|---|
| **J1** | **Curves and markers are drawn outside their own plot box** — phase-plane trajectories sweep across the whole canvas and over the neighbouring inset; the trace–determinant marker lands outside the chart; `laMatrix`'s AB parallelogram runs off the top; the nuclear term-curves and the decay chain leave the frame; the Regge fit line and the modular-τ ray reach the canvas corner | 11 shots: `sySystem`×5, `laMatrix`, `ncBind`, `ncChain`, `wsRegge`, `wsTorus` | `pvClip` applies to `mkPlot` boxes, but these paths are drawn without it | **`auditframe.ps1` measures exactly this and is a REPORT, not a gate.** Make it fail |
| **J2** | **Spurious "key points"** — a picket fence of yellow dashed pole markers over a steep but perfectly continuous stretch, and extremum circles all over a flat one | 4 shots: `odDamped`, `ltTransform`, `ltConv`, `ncChain` | `pvFeatures` (`59c`): a break is declared when a step exceeds `12 ×` the **median** step, which any steep-but-finite region clears; turning points need only `0.75 ×` the median | none — nothing inspects overlay marks |
| **J3** | **Axis tick labels drawn twice once the view has been zoomed or panned**, so every negative tick reads `=40` instead of `−40` | 3 shots: `slBand`×2, `ncBind` | `pvDrawAxes` draws its own ticks when `moved`, on top of the stage's | none |
| **J4** | **Axis titles collide with tick labels**, and one axis carries two unit scales that overlap; `ckLab`'s axis says `(s)` while its ticks are in ms; `wsRegge` draws two x-label sets at the same height, merging into `6 = 500` | 5 shots | no reservation of the gutter a rotated axis title needs | `auditsize`/`auditviewport` check layout but not label collision |
| **J5** | **Every `<textarea>` is white in the dark theme** — the Shape-C scenario editors, which are the whole reader-input story | 6 shots: `rtInertia`, `rtRace`, `rtCouple`, `tmEngine`, `opLens`, `ncChain` | `styles.css` styles `input` and never `textarea` | `auditcontrast` reads CSS tokens, not the elements actually used |
| **J6** | **The readout chip covers the canvas heading underneath it** | 3 shots: `rlTensor`, `ncChain`, `wsTorus` | the rule in `src/js/CLAUDE.md` ("centre it, or start below it") is not enforced | none |
| **J7** | **A legend describing a different picture** — the cycloid caption says "dark red dots" over blue ones; "slicing a cone" keeps the focus–directrix legend and draws none of it, labelling the cutting plane "the conic"; `slBand` writes "green = allowed bands" in orange | 3 shots | `legend(st)` not keyed on the scene, exactly the trap already recorded in §2.4 | none |
| **J8** | **The canvas title and the chip print the same `t` from different instants** — 7.76 against 6.9 on the very stage whose rail text promises "the picture and the numbers cannot drift apart" | 2 shots: `pcCurve` | the title is drawn every frame, the chip four times a second | none |
| **J9** | **Round-off printed as a measurement** — `difference 0 J` where the two routes differ by 1.5e-4 and **7.8% relatively**; a circuit at its steady state printing `29.7 fA`, `148 fW`, `29.7 pV` | 3 shots: `dyForce`×2, `ckLab` | **not the formatter — a second-order quadrature under a fourth-order stepper** (see below), then `fmtNum` hiding the result, then no floor tied to the physics | §2.1 already forbids both; nothing measures it |
| **J10** | **A curve joined across a pole** — the Veneziano amplitude's poles drawn as rectangles, the polyline running from +∞ to −∞ along the clamp | 1 shot: `wsVen` | `plotCurve` does not break the path at a sign-flipping discontinuity | J1's gate would see it as "outside the window" |
| **J11** | **The EM sandbox can only place objects at z = 0** — its own caption admits it: "click to place a pos on the z = 0 plane" | 1 shot + code | `em3dPickPlane` (`60j`) intersects the ray with z = 0 only; `pick3d` calls `place(st, w.x, w.y)` with two coordinates | none |
| **J12** | **The convolution middle panel is empty** and `t = 29.8` sits outside the plotted window | 1 shot: `ltConv` | the typed value is not bounded by the plot | none |
| **J13** | **The energy-ledger ball is not on its track** — the track occupies a fifth of the plot and the ball floats to the left of where it starts | 1 shot: `dyEnergy` | track drawn over its own x-domain, ball placed in plot coordinates | none |
| **J14** | **The tangent plane is drawn several times larger than the ±1 window its title claims** | 1 shot: `mvTangent` | plane extent not tied to the window | none |
| **J15** | **`igChange`'s Ellipse preset contradicts its own prose** — the text promises the unit disc mapping to an ellipse; the picture draws a square mapping to a rectangle | 1 shot | the region is the (u,v) rectangle for every preset | `auditclaims` checks table claims, not prose-to-picture |
| **J16** | **The inertia bitmap is too coarse** — the disc's edge is visibly stair-stepped | 2 shots: `rtInertia` | cell count fixed while the blit scales to the canvas | `auditperf` measures cost, not resolution |
| **J17** | **The race labels sit on top of the ramp**, and two of the six read "Solid" | 1 shot: `rtRace` | fixed label positions; `n` not distinguishing cylinder from sphere | none |
| **J18** | **The p–n junction's diode turns on at negative bias**, and the axis excludes the +0.7 V it should turn on at | 1 shot: `slDiode` | sign or axis range — to be measured, not guessed | none |
| **J19** | **A dense fan of false contours at the branch cut** of the recovered potential | 1 shot: `vcConserv` | the contour tracer crosses the atan2 discontinuity | none |
| **J20** | **The dock's content is clipped horizontally** at some widths | 1 shot: `sySystem` | overflow in the dock's grid | `auditviewport` checks the document, not the dock's inner scroll |

### Decisions taken 2026-08-13 — do not reopen

- **J11, how a reader sets the height: BOTH halves** (answer (a)). A "place at
  z = …" control that moves the placement plane, **drawn** so it is visible
  where the next object will land, **and** a `z` box in the selected-object
  panel so an object already placed can be lifted. Not one or the other.
- **J1, clipping: yes, clip the function lines to the box** — and the curve must
  be **re-generated for the window actually on screen**, so zooming in shows
  more detail and zooming out shows more of the function, both at honest
  accuracy. Half of that was already true and nobody had noticed: `plotCurve`
  samples over `P.x0…P.x1`, which is the window *after* pan and zoom, so the
  arithmetic already follows the viewport. What did not follow was the sample
  COUNT, fixed at 240 however wide the box — a point every five pixels on a
  large plot, which is why a zoomed-in curve looked polygonal. It now follows
  the box's pixel width (one sample per ~1.5 px, 240–1200), which the canvas
  bounds, so §2.5's "cap anything deriving a loop count from a data span" is
  respected: the span can grow without limit under zoom, the box cannot.
  **Measured: 2-D mean paint calls 131 → 130** — the extra samples are `lineTo`s
  inside paths that were already batched, which §3.5 records as the cheap part.

### The generalisation rule, applied retrospectively — added 2026-08-14

**Every J item is a class, not a screenshot.** J9 was recorded as "3 shots" and
turned out to be **55 defective rows in 44 stages across 20 wings**. That was not
bad luck; it is what the table's "seen in" column always means, and the count
there is the count of *pictures the reader happened to take*, never the count of
instances. Before fixing any remaining item:

1. Grep the **cause**, count the population, and write the number down.
2. Prefer the shape that makes the defect **unrepresentable** — `fmtAgree(a, b)`
   derives its scale, `fmtGap(gap, scale)` still lets a caller pass the wrong one.
3. Build the gate that renders what the site actually shows, **corrupt one site
   back, and watch it fail**.
4. Let the measurement overrule the diagnosis — see the `qmShoot` note under J9.

Checked retrospectively against the items already closed, and they hold up: J5
was one CSS rule for all six stages; J2 replaced the break rule itself
(`pvBreakReal`, 2303 → 20 markers over all 178 stages, with named controls);
J1's clipping went into `ctPath`/`ctFill`/`ctDot`/`ctArrow`, 465 call sites
inheriting one omission, not into the eleven stages photographed; J3 gave the
ticks one owner. Each already fixed the class. **J9 is the first one where the
recorded diagnosis was itself wrong**, which is the argument for measuring before
fixing rather than after.

### The order to fix them in

**By §4.3a rule 1 — machinery before instances.** J1, J2, J3, J5 and J9 are one
change each covering thirty-odd of the forty pictures. Do those first, each with
the gate that would have caught it, then the single-stage items.

1. **J5** — one CSS rule, six stages. Trivial and highly visible.
2. ~~**J1** — clip every `mkPlot` path. **Turn `auditframe.ps1` into a gate**~~ —
   **DONE 2026-08-15.** See the progress table. The lesson worth carrying: the
   gate was the cheap half. Deciding which of the four cuts were *defects* took
   a per-stage measurement of every curve's y-range against its window, and the
   answer was two and two — a ratio that no amount of reading the source would
   have given, because the honest cases and the broken ones look identical from
   the call site.
3. **J2** — a break must be a *discontinuity*, not a steep step. Compare against
   the step the neighbouring samples predict, not the median of all of them, and
   require the jump to survive a refinement. Measure the false-positive count
   across all 178 stages before and after.
4. **J3** — one owner for the ticks.
5. **J9** — **DONE**, and it was not the bug it looked like. See the entry in the
   progress table.
6. ~~Then J4, J6, J7, J8, J10 … J20, each with a check~~ — **all DONE
   2026-08-15** (see the progress table). **Programme J is closed.** Two of the
   fifteen (J13, J14) turned out to have been fixed already by earlier class
   work, which the caution below predicted: measure, because the screenshot
   count is never the instance count — in either direction.

### Progress

| item | state |
|---|---|
| **J5** textareas | **DONE.** One rule in `styles.css`; six stages; screenshot looked at |
| **J2** key points | **DONE.** `pvBreakReal` in `59c`; gated by the new **`./auditmarks.ps1`**, which scores the old and new rules in one run: **2303 → 20** markers across 178 stages, with named controls proving `exp(−400x²)` and `exp(−30x)` lose their false fences (64 → 0, 28 → 0) while `tan` and `1/x` keep their real poles. The first attempt scored 2303 → 10 and **silently dropped tan's pole**; only the control caught it, which is the whole argument for having one |
| **J1** sample density | **DONE** (the resampling half — see the decision above) |
| **J1** the gate | **DONE 2026-08-15.** `auditframe` fails on a `CUT` now, which is what §3.10 asked for. The exit code was five minutes; the fortnight-old part was attributing the four stages it flagged, and the split was **two real, three honest**. Real: **`odSpring` fitted its y-window to the response curve at the reader's damping while drawing three curves — and the LIGHTEST damping has the tallest peak**, so the most instructive curve of the three was the one clipped (max 5.71 against a window ending at 2.24), and its feature caption then floated at the top of the canvas with no marker under it. The fit and the draw now share one list, so they cannot disagree. **`wsADD`** pinned a slider-dependent curve to a hard-coded top of 12 and overflowed it at the defaults. Honest, allowed by name with reasons: `srTaylor` (Taylor polynomials diverging from a window fitted to the function — the divergence *is* the lesson), `atomForces` (a symlog window sized to hold its own ±1000 MeV ticks, against a Yukawa well that genuinely reaches −70 GeV), `odSeries` (truncated power series outside the radius of convergence, with the R = 1 lines drawn beside them). Negative control: `wsADD`'s window put back, gate failed |
| **J1** clipping | **DONE, and it was four lines in one file.** `plotCurve` always clipped; **everything else went through `ctPath`, `ctFill`, `ctDot` and `ctArrow`, none of which did** — 310 + 155 call sites inheriting one omission. They clip now. The new **`ctClip`** (61a) is what `pvClip` could not be: `pvClip` skips a `ctBox` because §2.5 frees an aspect-true diagram to point an ARROW past its frame, and that exemption is right for arrows and wrong for curves — the phase plane is a ctBox, and its trajectories were crossing the trace–determinant chart beside it. Curves, fills and markers now clip to any framed box; only `ctArrow` keeps the plot-only rule. Verified by screenshot |
| **J3** doubled ticks | **DONE.** `ctGrid` labelled at `+4px` with 3 figures and `pvDrawAxes` at `+3px` with 4, **both at once** on a moved view — two minus signs a pixel apart, which is the `=40`. `ctGrid` now yields the whole grid to `pvDrawAxes` once the view has moved, because pv's ticks follow the window and a stage's are a fixed list chosen for the author's window |
| **compute** | **DONE** (asked for separately). `refreshAll` was evaluating the field, its divergence, curl and Jacobian at the probe and rebuilding five panels of HTML **into elements with `display:none`** on every one of the 178 stages, because `applyWingSections` hides the field panels but nothing stopped them being recomputed. It now returns early while a stage is active. Safe because the hiding is all-or-nothing, and the route back always runs `applyField` after `stageExit` |
| **J9** round-off as measurement | **DONE, and the hypothesis recorded here was wrong in both halves.** It said `gapWork` reached the formatter as an exact zero because `fmtNum(1.499e-4, 3)` returns `0.00015`. Measured on the bundle: `gapWork` is **1.4988e-4, not zero**, and `fmtNum(1.499e-4, 3)` returns **`"0"`**. `fmtNum`'s exponent term is clamped at zero, so below 1 its `sig` counts DECIMALS, not FIGURES — swept, the dead zone is exactly **[1e-4, 5×10⁻ˢⁱᵍ)**, bounded below only because the scientific branch takes over at 1e-4. **But the formatter was the outermost of three layers.** The real defect: `dyForceRun` (31a) integrated ∫F·dx by **trapezoid in dx, second order, under an RK4 trajectory that is fourth**. Halving h showed it converging at exactly h² (ratio 3.999, 4.000, 4.000), so the panel was measuring its own truncation error, not the work–energy theorem. It shows up as 7.8% because the answer is exponentially small — the default law is a damped oscillator run eight damping times, whose net work is the 1.9e-3 J residue of a **13.47 J** sum, a **cancellation factor of 7 × 10³**. Across the laws the help text itself suggests, `-4x - 1.2v` disagreed by **100%** while the chip said "they differ by 0" in `--c-pos`, the affirmative colour. **The fix is ∫F·dx = ∫F·v dt by composite Simpson** — the same line integral (v is signed, so doubling back still subtracts; it is not ∫F dt, the impulse), at the order the stepper has. Not invented here: **`rtSpinRun` (32a) is this routine's rotational twin and has always done it**, and `dyForceRun` already forced `n` even with no Simpson to use it. Pinned against the closed form of m x″ + c x′ + k x = 0: measured order **2.00 → 4.00**, relative gap **7.8e-2 → 2.5e-6**, same cost. New `nqCumSimpson` (21) gives the running integral the ledger plot draws from, and its last entry **is** the composite Simpson total, so panel and picture cannot drift (measured: `Us[n] + wCons = 0` exactly). Also found: `gapEnergy` was never a third check — W_non = W_tot − W_cons by linearity, so it is \|gapPath ∓ gapWork\|, and it equalled `gapWork` to ten figures. New `fmtSig`/`fmtGap` (10) print residuals as figures with the relative gap and a figures-agreed verdict; `ckEngF`/`ckGap` (48a) floor circuit quantities against scales `ckMeasure` now returns, because ε·κ(A)·‖x‖ for a 1 Ω–1 MΩ circuit is ~1e-13 A on a milliamp solution — that *is* the 29.7 fA — and Johnson noise in a 1 kΩ resistor at 300 K is 4 pA/√Hz, a hundred times larger. **20 tests added; the J9 test was corrupted back to the trapezoid once and watched to fail, reporting order 1.9995.** The old tests passed the broken code because their tolerances were absolute against a fixed 4.32 J scale — the new one is relative to the answer, which is what makes it bite |
| **J4** axis-title collision | **DONE 2026-08-15.** Measured first: **60 plots on 41 stages** drew the rotated y-title through their own tick numbers at the fixed `P.px − 34`. `plotFrame` now computes the labels ctGrid will draw — same step, same `fmtTick` — measures them, and places the title clear of that gutter. The ckLab sub-defect (axis titled `(s)` over ticks that print their own `ms` via `ckEng`) fixed by removing the second unit from the title, scope and spectrum both; the wsRegge double x-label row was already gone (removed in an earlier session — verified by `auditticks`, which finds no duplicate row there) |
| **J6** headings under the chip | **DONE 2026-08-15.** The class fix is `ctTitleClearChip` (60a): both title owners — `plotFrame` and `ctFrame` — read the live chip rect and slide a title sideways out from under it, so no stage has to know the chip exists. Population measured by the new gate: **5 stages** had fixed captions in the chip zone (agIdent, ftFast, ftConv, rlWire, slSemi) — the three photographed ones were already clean. `./auditticks.ps1` now fails on any ≥11px text anchored inside the visible chip, with a drawn-at-chip-centre control |
| **J7** legends for a different picture | **DONE 2026-08-15.** Three instances, three honest fixes: the cycloid caption said "dark red dots" over dots drawn in `TH.neg`, which is **blue** in both themes — reworded (canvas note and pk note both); `pcConic`'s cone view wore the focus–directrix legend over a picture with no directrix and called the cutting plane "the conic" — the legend now keys on `st.view === 'cone'`; slBand wrote "green = allowed bands" in `TH.pos`, which is orange — reworded |
| **J8** two instants of one clock | **DONE 2026-08-15.** The chip refreshed on a 0.4 s timer while canvas titles print the live `st.t` every frame. Adaptive cadence now: `updateStageChip` returns whether the write changed anything; the 0.4 s tick arms per-frame refresh and the first unchanged build disarms it — so an animating chip tracks the frame exactly and a heavy-but-static chip is never rebuilt at frame rate |
| **J10** a curve joined across a pole | **DONE 2026-08-15.** In `plotCurve`: adjacent samples pinned to **opposite** clamp bands are the two sides of a sign-flipping pole and the path breaks between them. A steep but finite curve never trips it — its samples are inside the window and never clamped |
| **J11** placement at z = 0 only | **DONE 2026-08-15**, both halves as decided: `em3dPickPlane` takes the plane height, a `placement plane z` slider appears in the 3D sandbox (id `emPZ`, permalink-restorable like any control), the plane is **drawn** where the next object lands, the caption prints the real z, and the selected-object panel's z slider was already there. The probe keeps its own plane |
| **J12** typed t off the picture | **DONE 2026-08-15.** `cvT` now carries a `lim` with its reason — the three panels plot 0..10 s, and a typed 29.8 put the probe line off all of them while the fully-decayed middle panel read as blank. The slider's typed path already had the limits-with-why mechanism; this stage just never used it |
| **J13** ball off its track | **was already fixed** — the J9 session rebuilt this stage's machinery, and ball, track and fill all draw from one `hOf` in one box. Verified by reading and by screenshot |
| **J14** plane bigger than its window | **was already fixed** — the stage works in local coordinates that zoom with `h` ("work in local coordinates so the picture zooms with h"), surface and plane share the ±1.5h extent, the rings sit at h. Verified by reading |
| **J15** the ellipse that was a rectangle | **DONE 2026-08-15.** The `ellip` preset mapped the **square** by `(3u, 2v)`, so the picture showed a square becoming a rectangle while the note narrated the disc and the ellipse. It is now polar composed with the stretch — `(3u cos v, 2u sin v)` over the (u, v) rectangle, \|J\| = 6u — so the domain is still the rectangle the machinery integrates over and the image is the actual ellipse. The area test moved to the same route and pins 6π; a new test pins the u = 1 edge to x²/9 + y²/4 = 1 exactly |
| **J16** stair-stepped bitmap | **DONE 2026-08-15.** The cell count follows the blit target — one cell per ~2 screen pixels, bounded 90–240 — instead of a fixed 90, so the disc's edge resolves on any canvas while §2.5's loop-bound rule holds |
| **J17** two entrants named "Solid" | **DONE 2026-08-15.** `short` was derived as `name.split(' ')[0]`, so *Solid sphere* and *Solid disc* both raced as "Solid". The shorts now live in `RT_RACE` itself (sphere, disc, shell, hoop, block) — one source, §2.4. The label stagger was already in |
| **J18** the diode's turn-on | **DONE 2026-08-15, measured before fixed.** Not a sign error: the old plot drew I/Iₛ on a 0–20 scale with Iₛ = 10⁻⁹, so the visible knee sat at V_T·ln 20 ≈ **0.08 V** and no axis range could ever show a 0.6–0.7 V turn-on, because the "turn-on voltage" is a property of the current scale you judge "on" at. The plot is now milliamps with a real small-signal Iₛ = 10⁻¹² A — 1 mA at V_T·ln 10⁹ ≈ 0.54 V at 300 K, inside the window, temperature dependence intact. The unit tests already used 10⁻¹²; the stage was the outlier |
| **J19** the contour fan at the cut | **DONE 2026-08-15.** The vortex potential recovered by line integral is genuinely multivalued and its branch cut is real mathematics; the defect was the tracer stitching contours **across** the 2π jump — bilinear interpolation invents a crossing in nearly every cut cell, which is the fan. `ctContour` takes an optional `tear`: a cell whose corner spread exceeds it is a jump, not a crossing, and the contour honestly stops at the cut. `vcConserv` passes a quarter of the plotted range |
| **J20** the dock clips its content | **DONE 2026-08-15.** The dock's wrap layout needs `overflow-x:hidden`, so anything wider than a panel was silently gone. Panel bodies (`.dock > .sec > .body`) now scroll horizontally inside themselves — the same rule the site applies to every other wide container |

**The lesson for Part 4.** Every one of these was invisible to twenty-three
gates. The harness measures *behaviour* and *text*; it barely measures *pixels*.
`auditframe` gates as of 2026-08-15 and `auditsize` reads the coordinate of
every label before it is clamped, but neither looks at what is actually *inside*
the canvas. **A screenshot audit that diffs rendered canvases against approved
images is still the missing gate**, and it is the one piece of infrastructure
that would have caught the majority of this list. That belongs in Programme D.

**And a caution the J1 work earned.** Three of the twenty root causes have now
been chased to the end, and the population was **55** for J9, **465 call sites**
for J1's clipping, and **1** for the off-window caption. The instinct after the
first two is to assume every screenshot stands for dozens; measure it anyway.
The fix for a population of one is still worth making unrepresentable — the
marker and its label can no longer disagree about what is on screen — but
calling it a class fix when it repaired one instance would be a false record.

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
./auditdocs.ps1    # before ENDING a session — did the documents keep up?
```

Then, matched to what you touched:

| you changed | also run |
|---|---|
| an engine (21–49) | `./runtests.ps1` |
| **a stage's own arithmetic** — a helper on a `STAGES.*` object, or any stage code with two routes to one answer | `./runstagetests.ps1` — the only gate that calls stage helpers **directly** with synthetic states; `runtests` cannot see modules ≥ 50 and `auditsides` only reads what the panels render |
| **anything that changes a count** — a wing, a demo, a stage, a module, a test, a script | `./auditdocs.ps1`, and fix the documents it names. **This is not optional and not a tidy-up afterwards** — see §4.4 |
| **anything printing a difference, a residual or a gap** — in a readout, a chip, a **derive rung**, a legend, or a **`*Own` reader-supplied panel**, all five of which it reads | `./auditresid.ps1` |
| **a preset table, a theorem stage, or either route into a two-route comparison** | `./auditsides.ps1` — `auditresid` checks a difference is printed with its scale; this one checks the two routes actually **agree**, over the whole preset product |
| **a plot's window, or anything drawn into one** | `./auditframe.ps1` — does a curve leave the box it was framed in? **Fitting the window to some of the curves and not all of them is the failure mode**, and it is invisible from the call site |
| **`pvFeatures`, `pvDrawFeatures`, or any marker drawn on a curve** | `./auditmarks.ps1` |
| a stage, a demo, the UI | `./runall.ps1` (~18 min, **background it**) |
| a picker, an accessor, a `pk*` helper, any typed input | `./auditcustom.ps1` |
| **a control, a control's id, or anything a control writes** | `./auditlink.ps1` — a permalink is the reader's whole view, so it is the one gate that asks whether every control's value can be written **back** |
| **`uiSetHtml`, `stageExit`, or anything writing a panel** | `./auditpanel.ps1` |
| **anything before republishing the Claude artifact** | `./auditartifact.ps1` |
| a `derive()` ladder | `./auditderive.ps1` |
| **a preset table — or anything it declares** | `./auditclaims.ps1` |
| **anything in a `frame()`, or any new stage that draws** | `./auditperf.ps1` |
| `mkPlot`, `plotCurve`, the viewport | `./auditzoom.ps1` **and** `./auditframe.ps1` |
| anything that draws | `./auditsize.ps1` **and** `./auditviewport.ps1` |
| any visible text | `./audittext.ps1` then `./auditscan.ps1` |
| an essay | `./auditprose.ps1` (after `audittext`) |
| a colour, a type size, a contrast pair | `./auditcontrast.ps1` |
| **a tick label, an axis, `fmtTick`, `ctGrid`, `pvDrawAxes` — or any heading/caption drawn on the canvas** | `./auditticks.ps1` — the only gate that reads the strings the canvas actually paints; fails on duplicate tick labels in one row or column and on a heading under the readout chip |
| added or renamed a file | `./map.ps1`, then `./auditdocs.ps1` |
| needing a headline count for any of the above | `./measure.ps1` — never a grep, never a figure quoted from prose |
| finished, and the scratch files are in the way | `./clean.ps1` (`-WhatIf` lists what it would delete first) |

Two things that waste time if you do not know them:

- **Concurrent Chrome runs need separate `--user-data-dir`.** Two harnesses
  sharing one profile **silently produce an empty dump**, not an error.
  `runapp.ps1` and `runall.ps1` both used `cprof`, so the natural move of
  grabbing a screenshot while the 18-minute sweep ran in the background was
  exactly the collision, and it failed quietly. **Fixed 2026-08-13** — `runapp`
  uses `cprof-app` and every script now has a distinct profile, so they can be
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
4. ~~**Programme F — the permalink.**~~ — **DONE 2026-08-13** (§3.6).
   `#w=…&d=…&c.<id>=…`, 593 of 593 round trips exact, gated by
   `./auditlink.ps1`. "Open this link and look at what happens at β = 0.99" now
   works, which is how every later piece of work gets demonstrated and reported.
   It also found six defects in code that had nothing to do with it — see
   `AUDIT.md`; the lesson is in §4.3a rule 8.
5. ~~**Programme D items 2 and 3**~~ — **DONE 2026-08-15.** D2: all rows
   attributed, both ratchets at 0. D3: `./runstagetests.ps1` +
   `tests-stages.js` built and gated (§3.4 item 3). What survives of D is a
   standing rule, not a queue item: **a stage defect class fixed adds its
   two-route test to `tests-stages.js` the same day**, and a new wing's stage
   helpers with two routes get tests as they are written.
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
8. **A feature that reads the whole app is a defect detector — budget for it.**
   The permalink touched no stage and fixed six defects in code it did not own,
   because asking *"can this control's value be written back?"* is a question no
   other gate asks. Every one was invisible to all 22 scripts that existed on 2026-08-13.
   Expect the same of the export path and the keyboard path in §3.6: the work is
   not the feature, it is what the feature finds. **And when a new gate reports
   dozens of failures, prove the gate can fail before believing what it says** —
   the first version of `auditlink` reported 119 differences that were its own
   fault, and the version after that passed on a build where the restore told no
   stage anything.

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
| 3 | ~~**F — the permalink**~~ | **DONE 2026-08-13, one session** — and the estimate was right only for the feature. Two thirds of the session went on the six defects the gate found in code the permalink does not own. The rest of usability (export, keyboard, screen reader, print) is ~1–2 more, and should be budgeted the same way |
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

- **Silent name collisions.** One script scope, 231 modules. Prefix and grep
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
- **`@( @('a','b') )` is NOT a one-element list of pairs — it flattens to
  `@('a','b')`.** A loop over it then binds `$p` to the *string* `'a'`, so
  `$p[0]` and `$p[1]` are its first two **characters**. A search-and-replace
  written that way ran `Replace('s','r')` over `AI-GUIDE.md` and turned every
  `s` in the file into an `r` — 12 occurrences of `src/` became `rrc/` — with no
  error and a cheerful summary. It was caught by *reading the file back* and
  restored with `git checkout --`. **Wrap the outer list with a comma
  (`,@('a','b')`) or use a hashtable, and re-read any file a script rewrote.**
  This is the same lesson as the negative-control rule: a script reporting
  success is not evidence that it did the right thing.
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
afterwards, on 2026-08-13: **230 modules, smoke OK, 4160 passed / 0 failed.**

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


