# SITE RULES

**What must be true of this laboratory, and what any change to it owes the rest
of it.**

Written 2026-08-14. This is the constitutional layer. It says what the site *is*;
`MASTER-PLAN.md` Part 2 says how to satisfy it in code, `AI-GUIDE.md` says which
files to open, `AUDIT.md` records what has actually been checked. When a
mechanical rule and a rule here appear to conflict, **this document wins and the
mechanical rule is wrong** — see §5.1.

Nothing here is a style preference. Every rule exists because its violation
shipped, and the example is given so the rule cannot be argued away as caution.

| you want | read |
|---|---|
| what the site promises a reader | **Part 1** — the nine laws |
| what a fix owes the wings it was not found in | **Part 2** — universality. The rule most often broken |
| whether a rule is machine-checked | **Part 3** — the gate table |
| the rules no gate can see | **Part 4**. Short, and the most expensive list here |
| how to change a rule | **Part 5** |
| *how* to implement any of it | `MASTER-PLAN.md` Part 2, `AI-GUIDE.md` |

**Counts go stale within a session.** Nothing in this document quotes one.
`./measure.ps1` and `./smoke.ps1` report them; historical figures below (e.g.
"145 of 178 stages", 2026-08-13) are records of a past measurement and are not
current totals. **Carry the date on the line.** That is not decoration:
`./auditdocs.ps1 -Fix` exempts a figure sharing a line with a `YYYY-MM-DD` and
otherwise rewrites it to today's measurement — which on 2026-08-16 silently
turned this very sentence's example into "145 of 179", a past event restated as
a falsehood. Read the diff after every `-Fix`, and date any number that is a
record.

---

# PART 1 · The nine laws

## 1.1 Everything on screen is computed, live, from the mathematics

No outcome is a quoted answer, a stored table of results, a fitted curve standing
in for a solution, or a drawing of what the answer looks like. The quadric
surfaces are drawn from their own horizontal traces; the volume element in
spherical coordinates comes from differentiating the coordinate map and taking
the determinant; Kepler's second law is obeyed because `M = E − e sin E` is
solved, not because two equal wedges were drawn.

**A picture that would look the same if the mathematics were wrong is not
allowed.** If the only evidence for a claim is that the artist drew it that way,
the demo is not finished.

*Consequence.* A constant that is genuinely reference data (CODATA 2022, PDG
2024) is not a violation of this — it is input, and §2.6 governs it. A *result*
that is reference data is.

## 1.2 Every outcome follows known law, and the current statement of it

Physics and mathematics as presently understood, not as historically taught. No
Bohr orbits, no wavefunction-collapse mysticism where decoherence is the honest
framing, no superseded constants. Where a result is model-dependent, the model is
named. Where two conventions exist (the circuit solver's absorbed-power sign, the
`r` vs `ρ` clash between cylindrical and spherical), one is chosen, documented,
and applied everywhere — a convention that varies by wing is a defect under §2.

**A law is not satisfied by a number that merely looks right.** It is satisfied
by the invariant it implies being computed and printed: Lagrange's identity at
every setting, the Frenet frame's three orthonormality checks printed as zeros,
`a_T² + a_N² − |a|²` shown to vanish, Tellegen's sum closing.

*What no gate sees.* Whether the law invoked is the right law for the regime.
Part 4.

## 1.3 Nothing is asserted that could be measured

> A claim that two quantities are equal is made only after computing **both**
> independently and printing the difference. The difference is the evidence.

This is `MASTER-PLAN` §2.1 and it is the hinge of the whole site. The
consequences that matter most often:

- **"Exact"** means a closed form or adaptive quadrature at 1e-13. Never a quoted
  value.
- **Convergence orders are measured** by halving h. Never asserted, and swept
  rather than sampled when the prefactor is erratic.
- **A property a preset declares must be recomputed for the reader's own case.**
  A preset field declaring `conservative` proves nothing about a typed one;
  `vcScan` reports the largest Q_x − P_y it found instead of asserting.
  `./auditclaims.ps1` recomputes the declared claims by a route that shares
  nothing with the declaration.
- **The two routes must not share their error.** Two quadratures of the same
  family agreeing tells you they are the same routine, not that the answer is
  right. Refine each side separately before believing either.
- **A two-route check is only a check where BOTH routes are valid, and the panel
  must say where that is.** `rlHole` compared a quadrature against an RK4 march
  of the geodesic equation *at the reader's probe* — which the reader can drive
  to within 10⁻¹² of a horizon, where the integrator carries dt/dτ = E/A in its
  state vector and its drift in E reaches 3×10⁸ (2026-08-18). Its *proper* time
  is still good there; only its coordinate time has gone. Neither route was
  wrong and the comparison was meaningless, which is the worst of the three
  outcomes because it looks like a disagreement about the physics. Choose the
  radius, name it in the panel, and say why — and note that a route failing is
  often the phenomenon rather than a defect in it.
- **And the two routes must be compared AT THE SAME PLACE, which is not always
  where the headline number lives.** `rlLens` reports the deflection all the way
  to infinity; a fixed-step integrator cannot start there, so the quadrature is
  re-run at the integrator's own observer and *that* pair is differenced
  (2026-08-18). Differencing the two headline numbers instead reads as a 2.6%
  disagreement which is entirely the finite observer — a residual between two
  different quantities, printed in the place a residual between one quantity's
  two routes belongs.
- **A guard that returns zero for a sample it cannot evaluate has changed the
  question.** The integral is then over a different domain, and the panel says
  nothing about it. `rlDeflect` reported 0.2193 for a ray whose honest answer,
  measured where both ends are real, is 0.2170 (2026-08-18). Refuse on the
  endpoints, **and** count the samples you could not take: a metric can go
  non-static strictly between two perfectly good endpoints, and no endpoint check
  will ever see that.
- **Print what the zero cancelled.** `∮|B·n̂|dA` beside `∮B·dA`, `Σ|dB|` beside
  `|ΣdB|` — otherwise the panel cannot distinguish a physical cancellation from a
  routine that computed nothing.

## 1.4 Every number carries the scale it must be read against

A bare residual is not a measurement. `1e-4 J` is a triumph beside 1 J and a
catastrophe beside 1e-3 J, so a row promising a difference must print a relative
figure, an "agreeing to N figures" verdict, or a statement that the two agree to
the resolution the routes have. `fmtGap`/`fmtSig` (`10-math.js`) and
`ckGap`/`ckEngF` (`48a`) do this; a bare `fmtNum` cannot.

Two ways this goes wrong, both of which shipped:

- **A real disagreement printed as zero.** `fmtNum` counts significant figures
  above 1 and *decimal places* below it, with a dead zone at [1e-4, 5×10⁻ˢⁱᵍ).
  `dyForce` printed a genuine 1.4988e-4 J gap — 7.8% of the number beside it — as
  "difference 0 J", and its chip said "they differ by 0" in the affirmative
  colour.
- **Round-off printed as a measurement.** "difference 2.13×10⁻¹⁴ J" measures the
  last bits of a double. A circuit at steady state read 29.7 fA, 148 fW and
  29.7 pV the same way.

**A ratio of two small numbers is not a measurement.** It needs a floor tied to
the physics, and below that floor the panel says which case it is in rather than
printing a number.

*Gate:* `./auditresid.ps1`, which reads rendered panel text on every stage, so a
new way of getting it wrong is caught too.

## 1.5 The reader's own case is held to the same standard as the author's

Every numeric control is typeable and a typed value is not bounded by the
slider's range. Beyond that, wherever there is an author's function, field,
matrix, region, sequence or scenario, the reader can supply their own — and the
site must then *measure* for that case everything it declared for the preset
(§1.3).

> The rule for a scenario editor: find the property or theorem the presets are
> allowed to assume, and make the reader's own scenario the thing that tests it.

**Bad input never blanks the picture.** A parse failure keeps the previous
scenario, reports every complaint with its line number, and says so. Parsers
collect `{line, msg}`; they do not throw.

**A limit that moves the reader's number must say why it moved.** `{lo, hi, why}`
on `wireSlider`, and only for a limit that is physics rather than widget. A
silent clamp teaches nothing.

*Gate:* `./auditcustom.ps1` — the only thing that ever selects "type your own".
`runall` drives every control a stage already shows and never chooses that
option, so the whole reader-supplied path is invisible to it.

## 1.6 Failure, ambiguity and non-convergence are shown, not smoothed over

The honest verdict is often "inconclusive", and the site says so: series tests
that return no verdict on the actual terms, L'Hôpital's rule returning a **wrong**
answer on a non-indeterminate form with the hypothesis checked first, Newton's
method falling into a two-cycle on a deliberately chosen cubic and never
converging.

**Never let `undefined`, `NaN` or `Infinity` reach a reader.** Not as a
placeholder, not "temporarily". Write "not defined there", "vertical tangent — no
slope". `runall` greps for all three, prose included.

**Never mix a measured input with a modelled one inside a subtraction.** It is not
a compromise between them, it is the difference between them — several MeV of
model error landing whole on a 1 MeV answer. Carry provenance per quantity and
refuse a verdict resting on a mixed comparison.

## 1.7 Mathematics is displayed as mathematics

`x²` not `x^2`, `√` not `sqrt`, `θ` not `theta`, `−` (U+2212) not a hyphen,
`|↑⟩` not `|up>`. Three contexts, three rules, and confusing them is the
commonest single defect in this repo:

| context | rule |
|---|---|
| **HTML** — `kv()`, `<p class="help">`, readouts, legends, prose | `<sub>`/`<sup>` fine; carets converted by `supify()` at render |
| **Canvas** — `stageNote`, `ctText`, `R.label`, `fillText` | **no markup**, it is drawn literally. Unicode or reword |
| **Parsed** — `f:`, `P:`, `Q:`, `R:`, `src:` | **must stay ASCII**. The neighbouring `ex:` is the display copy. Never "fix" the parsed one |

Echo a typed expression with `pkPretty(src)`, never raw. Check this on **rendered
output**, never on source — grepping `src/` for `sqrt` drowns in `Math.sqrt(`.

*Gates:* `./audittext.ps1` harvests, `./auditscan.ps1` scans; `smoke.ps1` catches
markup inside canvas text.

## 1.8 The page tells the truth about its own state

A panel that shows stale content is lying as much as a wrong number. The three
stateful panels — `#stageReadout`, `#deriveBody`, `#chip` — are written through
`uiSetHtml`, which skips a write matching what it last wrote; a direct
`.innerHTML =` leaves the cache marker describing a DOM that is gone. `stageExit`
doing exactly that blanked **145 of 178 stages** on re-entry (2026-08-13) while
`runall` still reported `caught=0`.

A control's value must be readable **back**: an element id is a key space, a
duplicate id is a defect, and a display formatter must never fill a box the
reader types into (`fmtEdit`, not `fmtNum` — `parseFloat('−0.7')` is `NaN`).

*Gates:* `./auditpanel.ps1` (leave every stage and return), `./auditlink.ps1`
(can the whole view be written back).

## 1.9 The documentation is part of the site, and moves with it

A document that describes the program inaccurately is a false claim, and §1.3
does not exempt it for being prose. Swept by hand on 2026-08-14, every live
document was wrong about the program:

| document | said | was |
|---|---|---|
| `AI-GUIDE.md` | 4175 unit tests in one paragraph, 4207 in another (2026-08-14) | 4240 |
| `README.md` | 230 modules, 4175 unit tests (2026-08-14) | 231, 4240 |
| `MASTER-PLAN.md` | 23 harness scripts (2026-08-14) | 25, and its §1.6 table described 23 of them |
| `MASTER-PLAN.md` | "all 21 scripts have distinct profiles" (2026-08-14) | every script does |
| all of them | nothing at all about `auditresid.ps1` (2026-08-14) | a gate written to enforce §1.4 |

The last row is the one that matters. §1.6 is how a session decides which gate to
run, so **a gate missing from it is a gate nobody runs** — the check exists, and
the defect it was built to catch ships anyway. Every one of these passed every
gate in the repository, indefinitely, because **nothing read a `.md` file.**

**The rule.** A change that moves a count, adds or renames a script or a module,
changes a rule, or adds a capability is **not finished until the documents say
so**. Not "documented later" — later is the state all eight of those defects
were in.

**What "moves with it" means in practice:**

| you changed | the document that must move with it |
|---|---|
| a wing, demo, group, stage, module, test | `MASTER-PLAN.md` Part 0 — the measured table |
| a `.ps1` script, added or renamed | `MASTER-PLAN.md` §1.6 (**what it sees that nothing else can**) and §4.2 (**when to run it**), and `AI-GUIDE.md` §2 |
| a rule, a convention, a trap | this file if it is a law, `MASTER-PLAN` Part 2 if it is mechanics, and the short form in `CLAUDE.md` / `src/js/CLAUDE.md` |
| what was measured, and what it cost | `AUDIT.md`, appended, dated, never rewritten |
| a file added or renamed under `src/` | `MAP.md` — regenerate with `./map.ps1` |
| anything a reader sees or runs | `README.md` |

**An undated figure is a live claim. A dated one is a record.** Write
"4240 tests (2026-08-14)" and it is exempt for ever, because it says when it was
true; write "4240 tests" and it must still be true today. That is the whole
escape hatch, and it is honest — use it for before/after tables and for anything
you are recording rather than asserting. `AUDIT.md` is dated records throughout
and is not policed.

**Prefer naming the command over quoting its output.** "`Get-ChildItem *.ps1` is
the authority" cannot go stale; a quoted script count can — and did, twice in one
afternoon, the second time because adding `auditdocs.ps1` itself moved the number
the documents had just been corrected to.

*Gate:* **`./auditdocs.ps1` (`bad=0 OK`)** — it re-measures the site, reads every
live document, and fails on a contradiction; it also fails when a script on disk
is undocumented, or a document names a file that does not exist. It is in the
`MASTER-PLAN` §4.1 invariant, so a session cannot end green with the documents
lying. **It is the only thing in this repository that reads a `.md` file.**

**`-Fix` rewrites the stale counts for you**, exactly the digits it verified and
nothing else, printing every substitution. Use it — a rule that costs five hand
edits per changed number is a rule that gets skipped, which is how all of the
above happened. **Then read the diff**: a corrected number inside a sentence that
no longer means anything is still a defect, and no machine can see that (Part 4).

**A partial run says so.** `-SkipTests` leaves the unit count unmeasured, so
claims about it are skipped; the report names what it could not check and prints
`partial`. This was found by corrupting three counts and watching only two be
reported — **`bad=0` from a run that did not look is worse than no gate at all.**

---

# PART 2 · Universality — a fix is a fix everywhere

**The rule this part exists for:**

> **A defect is found in one place and fixed in every place it exists.** The
> instance that was reported is a sample, not the population. A change that
> repairs the reported case and leaves its siblings is not a fix — it is a fix
> plus a new inconsistency, and the siblings are now harder to find because the
> obvious symptom is gone.

The evidence that this is the normal case, not the exception. Every one of these
was reported, or noticed, as a *single* broken thing:

| found as | actually was |
|---|---|
| a label not appearing | `ctText` args reversed in **24 labels** across three wings |
| one chip rendering as stacked lines | `.readout-chip` is a flex column — **11 chips** |
| a label offset on one stage | `parseFloat(ctx.font)` returns the **weight** — **19 stages** |
| one panel blank after navigation | the `uiSetHtml` marker — **145 of 178 stages** (2026-08-13) |
| a negative component reading 0 | `fmtNum` in an editable box — **3 panels**, every û and n̂ |
| one slider driving the wrong thing | duplicate element id `ciR` — **2 sliders, 1 dock** |
| one proton-radius constant stale | the value hardcoded in **2 further files** |
| one stage slow | a per-cell `fillRect` pattern — **5 loops** |
| a layout breaking at one width | **161 findings** on the first `auditsize`/`auditviewport` run |

## 2.1 Find the whole class before fixing any of it

Fixing first and searching afterwards does not happen. The search is part of the
diagnosis, and it has a defined shape:

1. **Name the class in one sentence** that does not mention the wing it was found
   in. "A canvas label whose coordinates come after its text", not "the nuclear
   wing's labels".
2. **Grep for the class, case-sensitively**, across all of `src/` — never within
   the wing. Prefixes make this reliable; that is what they are for.
3. **Ask what the class looks like when it is written a different way.** The grep
   finds the spelling you thought of. `auditresid` exists because
   "a bare `fmtNum` on a residual" has many spellings, so it reads *rendered
   text* instead of source.
4. **Count the instances and write the count down.** A fix whose commit does not
   say how many places it touched has not established that it touched them all.

## 2.2 Fix it in the shared layer, or make one

If the class has a shared layer, the fix goes there and every call site gets it
at once. The partial-derivatives wing gained reader-supplied functions across all
nine of its stages by changing `mvPick` alone. The plot viewport reached ~250
call sites by living in `mkPlot`.

**If the class has no shared layer, that absence is the defect** — and creating
the helper is the fix, not a refactor to be deferred. Five hand-written per-cell
draw loops were the same bug five times because no one wrote the blit helper
after the first.

**But a shared fix must be invisible to what it did not intend to change.** The
viewport was safe to add under stages that know nothing about it *only* because
`mkPlot` returns exactly the four numbers it was handed when nobody has
interacted — and `./auditzoom.ps1` asserts that identity on every stage. A shared
fix without an identity property is a site-wide change to everything, and must be
gated as one.

## 2.3 Parity — a capability owed to one wing is owed to all

The wings are one curriculum, not forty independent products. Where a wing meets
the precondition, it gets the feature:

- Every stage carries `title, enter, controls, wire, frame, readout, chip,
  legend, derive` — `smoke.ps1` fails the build if any is missing.
- Every wing has a prose essay and at least one statement card with a proof, or a
  `because:` saying why not.
- Every stage with an author's function has a "type your own", **except** the
  cases decided otherwise in `MASTER-PLAN` §1.5 and §1.7 — `igPolar`, `igCylSph`,
  `agQuad`, `agLog`, `agCircle`, `agTriangle`. Those are settled; do not reopen
  them, and do not extend the exemption by analogy.
- A new convention (chips as `<div>`s, `fmtEdit` in editable boxes,
  `data-audit` on textareas) applies retroactively to every existing instance,
  not only to new ones.

**Deliberate exceptions are written down here or in `MASTER-PLAN` §1.7.** An
undocumented exception is indistinguishable from an oversight, and the next
session will "fix" it.

## 2.4 One source for every constant, convention and claim

A value that appears twice will drift. `R_PROTON` was corrected in `45-atom.js`
and stayed stale in two stage files that had hardcoded it; both now read the
constant. The same applies to a wing's preset table (`TABLE[st.key]` becomes
`cur(st)` so there is one accessor), to numbering (applied at render time by
`stNumber()`, never written into source), and to the wing order, which is three
lists that `smoke.ps1` now checks agree on membership *and* order — they had
drifted to 31 home cards, nine wings with none, and one with two.

## 2.5 Every class fix ends with a gate, or with a written admission

**The fix is not done when the instances are repaired. It is done when the next
instance cannot ship silently.** One of:

- a check added to an existing gate (`smoke.ps1` greps for `ctText` shifts and
  for markup in canvas text because of exactly this rule);
- a new gate, if the class is one no existing script can see — and a new gate
  must be **proved able to fail** before its output is believed. `auditlink`'s
  first version reported 119 differences that were its own fault, and the version
  after that passed on a build where the restore told no stage anything. Corrupt
  the thing once and watch the gate go red;
- **an entry in Part 4 of this document** saying plainly that no automated check
  is possible and what a human must do instead.

Set a new gate's tolerances from a second route's own **measured** error, never
from a guess.

**And "proved able to fail" has a second half: proved able to RUN.** Corrupting
the subject catches a gate that cannot see; it does not catch a gate that is
never evaluated. On 2026-08-19 three assertions in a new stage suite passed
because the quantity they compared was `null` at every input the stage can
produce — the condition read `x === null || <the real check>`, and the real
check had never once been reached. Nothing was corrupted, because there was
nothing there to corrupt. **A check with a "no result" branch needs evidence
that the branch is not the only one taken**, and the cheapest evidence is to
print what it measured beside its verdict. Two of that gate's replacements were
then wrong in turn, each visible only at a second input; the record is
`MASTER-PLAN.md` §3.3a.

## 2.6 Scope-of-fix checklist

Before calling any fix done:

- [ ] The class is stated in one sentence that names no wing.
- [ ] `src/` grepped case-sensitively for the class, and for at least one other
      spelling of it.
- [ ] Instance count recorded — in the commit message and, if it is an accuracy
      matter, in `AUDIT.md`.
- [ ] Fixed in the shared layer, or the shared layer created.
- [ ] Every wing meeting the precondition checked, not only the reported one.
- [ ] Deliberate exceptions written down, with the reason.
- [ ] The value has one source; no copy left behind.
- [ ] A gate catches the next instance, or Part 4 says why none can.
- [ ] Gates that can see this change are green (`MASTER-PLAN` §4.2 maps them);
      gates that cannot see it were not run (§4.3a rule 5).
- [ ] **The documents moved with it** (§1.9) — `./auditdocs.ps1` says `bad=0 OK`,
      and the instance count is in `AUDIT.md` if it is an accuracy matter.
- [ ] One screenshot, **looked at** — not merely generated.

---

# PART 3 · How each law is checked

Every rule names what catches its violation. **"—" means nothing does**, and
those rows are Part 4.

| law | caught by | what that gate still cannot see |
|---|---|---|
| 1.1 computed live | — | whether a picture is drawn rather than derived |
| 1.2 known law, current | `runtests` (constants pinned), `auditclaims` | whether the law invoked suits the regime |
| 1.3 measure, never assert | `auditclaims`, `runtests` | a two-route pair that shares its error |
| 1.4 numbers carry scale | `auditresid`, `auditscan` | a scale that is right but meaningless; **whether a row promising a "difference" means a residual or a physical answer** — Part 4.7 |
| 1.5 reader's own case | `auditcustom`, `auditlink` | whether the typed case tests the theorem |
| 1.6 failure shown | `runall` (NaN/undefined/Infinity), `auditprose` | a hedge that is technically true |
| 1.7 real notation | `audittext` + `auditscan`, `smoke` | a correct symbol used for the wrong thing |
| 1.8 truthful state | `auditpanel`, `auditlink`, `auditmarks` | — |
| 1.9 documents move with the site | **`auditdocs`** | whether a rule's *prose* still means what it says — only its numbers, names and paths are checked |
| 2.1–2.4 universality | **partly** `smoke` (nav order, stage methods) | **whether a fix reached its siblings** — Part 4 |
| 2.5 gate or admission | `auditdocs` (a new script must be documented) | whether the gate can actually fail |

**Do not quote the number of gates.** `Get-ChildItem *.ps1` is the answer;
`MASTER-PLAN` §1.6's table describes what each one sees that no other can, and
that table is currently two scripts behind the directory (`auditmarks.ps1`,
`auditresid.ps1`).

**Run only the gates that can see your change** (`MASTER-PLAN` §4.3a rule 5).
Running everything every time is the commonest way to turn a 20-minute session
into two hours.

---

# PART 4 · The rules no machine can hold

Short, and the most expensive list in this repository. Each of these has shipped
past a green build.

1. **Whether a fix reached every sibling.** No gate compares wings for parity of
   treatment. The reported instance goes green and the class stays broken. Part
   2.6 is the only defence, and it is manual.
2. **Whether the physics invoked is the right physics.** A finite number produced
   by correct arithmetic from the wrong law passes everything. Mixing a measured
   and a modelled quantity inside a subtraction is the specific case that has
   bitten; the number is finite and the arithmetic is right.
3. **Whether a picture is derived or drawn.** A hand-placed cusp and a
   root-found one render identically.
4. **`fmtNum` below 1.** `fmtNum(0.0032, 2)` is the string `0`. It reached a
   canvas heading, a chip and a readout row; only a screenshot caught it.
   `auditresid` now covers the residual case, not every case.
5. **Whether a `drvSay` rung reasons or restates.** `auditderive` flags prose
   that repeats its own heading, and sees only the ladder built in a stage's
   **default** state — a `derive()` with more than one return needs reading.
6. **When the data contradicts the prose, which one is wrong.** Two walks along an
   isobaric chain stopping in different places looked like a bug; the pairing term
   splits the chain and the bug was in the sentence. **Check the physics before
   the code.**
7. **Whether a row promising a "difference" is a residual or an answer.**
   `rlTwin`'s "difference = 4 yr" between two twins is the result the stage
   exists to produce; `cxContourInt`'s "difference = 2.30×10⁻⁶" between two
   routes to one integral is a residual and needs its scale under §1.4. **They
   are the same shape, and no regex separates them** — the label, the units and
   the magnitude are all compatible with either reading. `auditresid` therefore
   fails only on the two decidable cases (a difference rendered as bare `0`, and
   one quoted at 1e-10 or below with no scale) and prints the rest as an
   **advisory `noscale=` list for a human to read**. Seven rows are on that list
   today and all seven are physical answers, checked by hand on 2026-08-14.
   A gate that failed on all of them would be switched off within a session,
   which is the failure mode §1.6's "cry wolf" note already warns about.

**The standing obligation:** anything on this list that becomes machine-checkable
should be, and the entry moved to Part 3. That is what Programme D is for.

---

# PART 5 · Precedence, and changing a rule

## 5.1 Precedence

1. **This document** — what must be true of the site.
2. **`MASTER-PLAN.md` Part 2** — the mechanics that satisfy it, and Part 3, what
   is left to build.
3. **`AI-GUIDE.md`** — recipes and traps.
4. **`CLAUDE.md`, `src/js/CLAUDE.md`** — the short form for agents reading
   nothing else.

A mechanical rule that cannot be reconciled with a law here is a bug in the
mechanical rule. **Say so in `AUDIT.md` and fix the lower document** rather than
working around it locally — a local workaround is a new class under Part 2.

`AUDIT.md` is the record of what was measured and is never superseded, only
appended to.

## 5.2 Changing a rule

A rule here changes only with a reason of the same kind that put it there:
evidence, not preference.

- **State what the rule cost** — the case where it was wrong, measured.
- **Change it in every document that carries it.** `CLAUDE.md` and
  `src/js/CLAUDE.md` carry the short form; `MASTER-PLAN` §1.7 carries the settled
  decisions. A rule changed in one place is Part 2.4 all over again.
- **Decisions in `MASTER-PLAN` §1.7 are closed.** Reopening one needs new
  evidence, not a fresh opinion; several were settled with reasons that are still
  written down.
- **Date the change** and record it in `AUDIT.md`.

## 5.3 Definition of done, for anything

`MASTER-PLAN` §2.13 has the per-item list (engine → tests → stage → derive rung →
demo entry → green gates → screenshot → `AUDIT.md`). This document adds two lines
to it:

> **and the same defect class is repaired everywhere else it exists, with a gate
> that catches the next one** (Part 2);
>
> **and every document that describes what changed has been changed with it**
> (§1.9) — `./auditdocs.ps1` green.
