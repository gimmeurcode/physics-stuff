# Accuracy audit

A claim-by-claim pass over every wing — twenty when this file was started, forty
now. Every entry records what was wrong, what it now says, and how the correction
was checked. Verified-correct spot checks are recorded too, so a later reader
knows what has already been examined and does not redo it.

**This file is append-only and its entries are dated records.** A count inside an
older entry ("all 39 wings", "3605 passed") was true when written and is left as
written — that is the point of a record. Live figures live in `MASTER-PLAN.md`
Part 0, and `./auditdocs.ps1` checks those; it deliberately does not police the
dated entries here.

Reference data: **CODATA 2022** for physical constants, **PDG 2024** for particle
properties. Where a number is exact by SI definition (c, h, e, k_B, N_A) that is
noted rather than given a tolerance.

Status key — `FIXED` changed, `OK` checked and correct, `NOTE` correct but worth
recording.

Entries dated before 2026-08-12 refer to "the roadmap" and to items such as
"ROADMAP B1" or "A1 Tier 3". Those documents (`ROADMAP.md`, `TIER-THREE-ITEMS.md`,
`SYLLABUS.md`) were folded into **`MASTER-PLAN.md`** on 2026-08-12 and deleted;
the references are historical and are left as written. `MASTER-PLAN.md` Part 3
carries what is left of that work, renumbered as Programmes A–H.

---

## Cross-cutting: physical constants

Every constant defined in the engine modules was checked against its published
value.

| Constant | Where | Value | Status |
|---|---|---|---|
| c | `46-relativity.js` | 299792458 m/s | OK — exact by definition |
| G | `31-mech.js`, `46-relativity.js` | 6.67430e-11 | OK — CODATA 2022 |
| ħc | `45-atom.js` | 197.3269804 MeV·fm | OK — exact, follows from ħ and c |
| α | `45-atom.js` | 1/137.035999177 | OK — CODATA 2022 |
| a₀ | `45-atom.js` | 5.291772105e-11 m | OK — CODATA 2022 (…10544) |
| m_p | `45-atom.js` | 938.27208943 MeV | OK — CODATA 2022 |
| m_n | `45-atom.js` | 939.56542194 MeV | OK — CODATA 2022 |
| m_e | `45-atom.js` | 0.51099895069 MeV | OK — CODATA 2022 |
| m_π± | `45-atom.js` | 139.57039 MeV | OK — PDG 2024 |
| m_W | `45-atom.js` | 80.3692 GeV | OK — PDG 2024 world average |
| ε₀ | `37-estat.js` | 8.8541878188e-12 F/m | OK — CODATA 2022 |
| e | `37-estat.js` | 1.602176634e-19 C | OK — exact since 2019 SI |
| k_B, N_A | `35-thermo.js` | 1.380649e-23, 6.02214076e23 | OK — exact since 2019 SI |
| σ (Stefan–Boltzmann) | `35-thermo.js` | 5.670374419e-8 | OK — follows from the exact constants |
| m_µ | `46-relativity.js` | 105.6583755 MeV | OK — PDG 2024 |
| Rydberg energy | `45-atom.js` | 13.605693 eV | OK — CODATA 2022 (see NOTE below) |

### FIXED — proton charge radius was the CODATA 2018 value
`src/js/45-atom.js`

- **Was:** `R_PROTON = 0.8414` fm, commented "the small (muonic) value".
- **Now:** `R_PROTON = 0.8409` fm — CODATA 2022, which tightened the 2018
  figure 0.8414(19) to 0.8409(4).
- **Checked:** the surrounding file states its constants are CODATA 2022, so this
  one was inconsistent with its own stated basis. The theory prose in
  `85c-theory-atom.js` says "0.841 fm", which is correct at that precision and
  needed no change.
- **Also:** two places hardcoded the radius instead of using the constant —
  `68c-stages-gr-waves.js` (`0.8414e-15`) and `66b-stages-rel-thought.js`
  (`0.84e-15`). Both now read `R_PROTON * 1e-15`, so the value has a single
  source and cannot drift again. The pinning test in `tests.js` was updated.

### FIXED — KATRIN's neutrino bound was attributed to the wrong flavour
`src/js/60e-particles-sm.js`

- **Was:** the muon-neutrino tile read "Limit from KATRIN". KATRIN measures the
  effective *electron* antineutrino mass from tritium beta decay; it says
  nothing directly about ν_µ.
- **Now:** the KATRIN attribution sits on the electron-neutrino tile. The µ and τ
  tiles state their real direct limits (0.19 MeV and 18.2 MeV) and explain that
  the sub-eV figure shown comes from the oscillation splittings, not from a
  direct measurement.
- **Checked:** the `< 0.45 eV` figure itself is right for all three rows and is
  kept — oscillation fixes the mass-squared splittings below ~0.05 eV, so no
  flavour can sit far from the bound on any one of them. A comment in the source
  now records that reasoning.

---

## Waves — the small-angle approximation

### FIXED — a pendulum claim that was wrong by a factor of five
`src/js/76b-stages-waves.js`

- **Was:** "At 5° the approximation is good to one part in 10⁴."
- **Now:** "At 3° …", matching the two other places that make the same claim
  (`87f-theory-waves.js` and `72s-demos-waves.js`), which were already right.
- **Checked:** computed T/T₀ = (2/π)·K(sin(θ₀/2)) by the arithmetic–geometric
  mean. At 3° the error is 1.71×10⁻⁴; at 5° it is 4.76×10⁻⁴ — nearly five parts
  in 10⁴, not one. The 90° claim was verified at the same time: T/T₀ = 1.18034,
  i.e. 18.03 % slow, so "18 %" is right.

---

## Cross-cutting: mathematical notation

The site is meant to show real mathematical notation everywhere. Auditing this
by grepping the source does not work — `Math.sqrt(` and variables named `theta`
swamp the signal. Instead every demo in every wing was **rendered headlessly**
and the resulting `textContent` scanned for ASCII stand-ins. That found 157
distinct problems; 148 are now fixed and the 9 remaining are false positives
(`Sgr A*` is a real object; `sign(sin(tau*f*t))` is an expression the user types
into the circuit's arbitrary-source field, where ASCII is correct).

### FIXED — every number in scientific notation was malformed
`src/js/10-math.js`, `fmtNum`

- **Was:** `v.toExponential(2).replace('e','×10^')` produced `2.5×10^-6` — an
  ASCII caret. Worse, the trailing `s.replace('-','−')` replaces only the *first*
  hyphen, so a negative mantissa consumed the fix and the exponent's minus stayed
  an ASCII hyphen: `−1.44×10^-6` while a positive value gave `9.34×10^−17`.
- **Now:** the mantissa and exponent are split before formatting, and the
  exponent is rendered with real superscript digits: `−1.44×10⁻⁶`. Both minus
  signs are U+2212.
- **Why it matters:** this function formats essentially every number the site
  displays, in both HTML panels and canvas text, so the defect was site-wide.
  Unicode superscripts were chosen over `<sup>` precisely because the output has
  to survive `ctx.fillText`.

### FIXED — angle brackets were being eaten as HTML tags
`src/js/60d-stages-quantum-spin.js`

The Bloch-sphere readout labelled a row `<Sz> = (hbar/2)cos(theta)` and the
legend read `<S> - the spin expectation vector`. Both strings become `innerHTML`,
so the browser parsed `<Sz>` and `<S>` as unknown tags and **displayed nothing**.
Now `⟨S<sub>z</sub>⟩` and `⟨S⟩`. The whole stage was ASCII (`hbar`, `theta`,
`phi`, `|up>`, `+/-`, `deg`, `cos^2`) and is now typeset: `ħ`, `θ`, `φ`, `|↑⟩`,
`±`, `°`, `cos²`. The neighbouring Pauli-exclusion stage had the same problem
(`|Psi(x1,x2)|^2`) and was converted to `|Ψ(x₁,x₂)|²`.

### FIXED — LaTeX braces printed literally
Four display strings used TeX syntax that nothing renders: `e^{−|x|}` and
`e^{hν/kT}` in the vector-calculus essay, `(m₁m₂)^{3/5}` in the LIGO readout, and
`|a_{N+1}|` in the alternating-series bound. All now use `<sup>`/`<sub>`.

### FIXED — a regression this audit introduced, and how it was caught
`src/js/10-math.js`, `supify`

Applying `supify()` to whole HTML strings broke the implicit-differentiation
stage. Segmented controls carry the expression itself in the attribute
`data-v="x^2+y^2-4"`, and the caret rule rewrote that attribute into
`data-v="x<sup>2</sup>+y<sup>2</sup>-4"`. Clicking an option then fed that string
to the expression parser, which threw `unexpected "<" at position 2`, and the
stage's readout came up empty.

`supify()` now converts only the text *between* tags:

```js
String(s).replace(/<[^>]*>|[^<]+/g, m => m.charAt(0) === '<' ? m : conv(m));
```

**This was found by `runall.ps1`, not by inspection** — `jsErrors=9` and
`caught=2 [calc partial 1.3 … readout empty]`. It is the reason the full audit is
worth its fifteen minutes: a display-layer change reached a parsed string, which
is exactly the failure mode the "expression strings are not display strings" rule
exists to prevent. The unit suite could not have caught it, because the fault was
in the DOM layer the engine tests deliberately exclude.

### How this is prevented from recurring
Rather than editing ~200 literals by hand, caret exponents are now converted at
**render time** by `supify()` in `10-math.js`, applied where stage controls,
readouts, chips, legends, demo commentary and theory prose become HTML. This
keeps the source strings readable and, critically, leaves the *parsed* expression
strings (`f:`, `P:`, `Q:`, `R:`, `src:`) untouched — those must stay ASCII
because the expression parser reads them. Canvas text takes Unicode directly,
since markup cannot reach `fillText`.

---

## Relativity

### FIXED — a stale claim about the lab's own scope
`src/js/60f-stages-rel-boost.js`

- **Was:** "In this lab GR appears only as the Newtonian 1/r potential it reduces
  to — a full geodesic visualizer is the honest boundary of what a Coulomb-style
  field engine can draw."
- **Now:** the paragraph says this *stage* shows only the special-relativistic
  half, and points at the general-relativity demos in the same wing.
- **Why:** the statement was true when written but is no longer. The wing now
  contains the Schwarzschild metric, orbits integrated from the geodesic
  equation (Mercury's precession), gravitational lensing and the LIGO chirp —
  `68a`, `68b`, `68c`. The same paragraph's notation was ASCII
  (`sqrt(1 + 2 Phi/c^2)`, `arcsec`) and is now `√(1 + 2Φ/c²)`, `″`.

Numeric claims in this wing were checked and are correct: 43″/century for
Mercury, 1.75″ at the solar limb, and GPS at +45.7 − 7.2 = +38.5 μs/day.

---

## Spot checks that passed

Recorded so they are not re-done:

- **Gibbs overshoot** — (2/π)·Si(π) = 1.178979744, i.e. 8.95 % of a jump of 2. ✓
- **Ice flotation** — 917/1000 = 91.7 % submerged. ✓
- **Binding energy** — ⁶²Ni at 8.7945 MeV/nucleon just above ⁵⁶Fe at 8.7903, a
  gap of 4.2 keV, with a correct explanation of why iron still dominates stellar
  ash (free energy at fixed proton fraction, not B/A). ✓
- **Semi-empirical mass formula** — the Wapstra coefficients 15.75, 17.8, 0.711,
  23.7, 11.18. ✓
- **β-decay Q-value** — 939.56542194 − 938.27208943 − 0.51099895069 = 0.78233
  MeV, matching the quoted 0.782. ✓
- **Yukawa ranges** — ħc/m<sub>π</sub> = 1.414 fm, ħc/m<sub>W</sub> = 0.00246 fm. ✓
- **Muon g−2 and the proton-radius puzzle** — the atom essay's account of both is
  current (lattice QCD having closed the g−2 gap; muonic hydrogen vindicated). ✓
- **Diamond's critical angle** — arcsin(1/2.42) = 24.4°, quoted as "only 24°". ✓
- **CMB dipole** — T₀ = 2.72548 K and 369.82 km/s, both current Planck values. ✓
- **Speed of sound** — 331.3·√(1 + T/273.15) m/s. ✓
- **Home page wing count** — was "thirteen floors … six … seven", written when the
  lab had thirteen wings. Corrected to twenty (nine calculus, eleven physics and
  analysis). The README's "930 unit tests" and "all seven wings" were stale in the
  same way and now read 1663 and twenty.

### NOTE — two values of g coexist  *(RESOLVED in pass 8)*
`31-mech.js` defines `DY_G = 9.80665` (standard gravity, exact by definition) and
the mechanics, waves and relativity wings use it. The curves wing
(`63b-stages-curves-space.js`) uses a literal `9.81` instead. Both are defensible
and the curves wing is internally consistent — its demo states that
√(a_T² + a_N²) "reads exactly 9.81", which it does. Left alone rather than
churned, but a future edit should prefer `DY_G` for a new wing.

### NOTE — hydrogen level energies use the infinite-mass Rydberg  *(RESOLVED in pass 8)*
`src/js/45-atom.js`, `hydrogenEn`

`hydrogenEn(n) = −13.605693/n²` eV is the Rydberg energy, i.e. the infinite-
nuclear-mass limit. Real hydrogen's ground state is −13.5984 eV once the
electron–proton reduced mass is used (a 0.054 % shift). The value is labelled
"Rydberg" in the source and the difference is invisible at the precision the atom
wing displays, so it is left as is — but it is the one place in the wing where
the printed number is a defined constant rather than a measured property of
hydrogen.


## Pass 6 — probability, numerical methods, and the modern-physics wings

### FIXED — moments were integrated over the plot window, not the support
`src/js/43-probstat.js`, `pbMoments`

The exponential distribution is drawn on [0, 6] because that is where the
interesting structure is, but its support runs to infinity. Integrating only what
was drawn lost e^(−6) = 0.00248 of the probability, so the stage reported a total
of 0.9975 and a mean of 0.985 for a distribution whose mean is exactly 1. The
unit tests caught it by comparing the integrated moments against the closed
forms.

The fix separates the two ranges: a distribution may now supply `ilo`/`ihi` as
functions of its parameters, defaulting to the plot's `lo`/`hi`. The exponential
integrates to 45/λ and the normal to μ ± 12σ. **The tolerance was not loosened** —
all three moments now agree to better than 2×10⁻³, limited only by Simpson's rule
on 4000 panels.

### FIXED — a band truncated by the scan limit was reported as a real band
`src/js/44b-solidstate.js`, `slBands`

`slBands` scans upward looking for intervals where the Kronig–Penney condition is
satisfiable. A band still open when the scan reached `Emax` was closed off at
`Emax` and returned like any other, so its upper edge was the scan limit rather
than a band edge and its width was meaningless. The readout printed that width as
a measured quantity, and a test asserting that higher bands are wider than lower
ones failed on it.

Truncated bands now carry `cut:true`. The readout prints "→ beyond the plotted
range" instead of a fabricated width, and callers comparing widths filter them
out. The physical claim — that bands broaden with energy, towards the
free-electron limit — is now tested only against bands with both edges genuinely
located.

### VERIFIED — the liquid-drop model against AME2020
`src/js/44a-nuclear.js`

The five-term semi-empirical mass formula is scored against fourteen measured
binding energies rather than against itself. Every nuclide above A = 20 is
reproduced to better than 0.15 MeV per nucleon. The closed-form valley of
stability (obtained by setting dB/dZ = 0) is checked against an exhaustive search
over Z at every even A from 20 to 250 and agrees to within one proton throughout.
The peak of the curve is **found by scanning**, not quoted: it lands in the
iron–nickel region within 0.25 MeV/nucleon of the measured 8.79.

The Coulomb term uses Z(Z−1), not Z², so a lone proton correctly feels no
repulsion — asserted by test.

### VERIFIED — Gamow's α-decay barrier
`src/js/44a-nuclear.js`, `ncGamow`

The WKB integral is evaluated in closed form, in MeV and fm, so the exponent
comes out dimensionless as it must. For ²³⁸U the barrier is more than three times
the α energy and the transmission probability is below 10⁻³⁰. Raising the α
energy from 4 to 9 MeV changes the half-life by more than fifteen orders of
magnitude — the Geiger–Nuttall law, measured from the engine rather than
asserted. Above the barrier the Gamow factor is exactly zero.

### VERIFIED — Fermi energies against measured metals
`src/js/44b-solidstate.js`

The free-electron Fermi energy is computed from the measured electron density for
eight metals and compared with the measured Fermi energy. The worst disagreement
is under 3%. The Fermi function is asserted to equal exactly ½ at E_F at every
temperature, and to be antisymmetric about it.

The p–n junction is checked structurally rather than by inspection: np = nᵢ²
survives every doping level to 10⁻⁸, charge neutrality closes, the depletion
layer splits symmetrically for symmetric doping and reaches more than ten times
further into the lightly doped side when doping is asymmetric, and x_n + x_p
sums to W exactly.

### VERIFIED — the T³ law, measured by halving
`src/js/44b-solidstate.js`, `slDebyeC`

The Debye integral is evaluated numerically at every call. Rather than asserting
the low-temperature limit, the test halves the temperature and measures the
ratio: C(θ/20)/C(θ/40) = 8.00 ± 0.02, which is the T³ law observed rather than
quoted. The asymptotic closed form is then checked against the full integral at
θ/40 and agrees to 1%. Every material reaches 3R within 2% when hot.

### VERIFIED — Onsager's critical temperature, and the 1D non-transition
`src/js/44c-statmech.js`

`SM_TC_2D` is asserted to satisfy sinh(2/T_c) = 1 to 10⁻¹², rather than being
stored as a decimal. The 2D Metropolis simulation is run for real in the test
suite: a 24×24 lattice at T = 1.2 orders (|m| > 0.85) and at T = 4.5 does not
(|m| < 0.3), with Onsager's T_c = 2.269 between them.

The one-dimensional chain is solved exactly by transfer matrix and asserted to
have **no** transition — its energy per spin is −J·tanh(J/kT) to 10⁻¹² at every
temperature, and its magnetisation is exactly zero at zero field. Having the
exact answer in the case where the transition is *absent* is what makes the
two-dimensional result credible rather than a numerical artefact.

### VERIFIED — the partition function, both ways
`src/js/44c-statmech.js`

For every level set and every temperature the mean energy is computed twice —
once by summing E·P over the populations, once by numerically differentiating
ln Z with respect to β — and the two are required to agree to one part in 10⁴.
F = U − TS is required to close to 10⁻⁸. Populations sum to 1 and none is
negative. The Maxwell–Boltzmann speed moments are likewise integrated and checked
against their closed forms for seven real gases at three temperatures, and
½m⟨v²⟩ is asserted to return exactly (3/2)kT.

### NOTE — the α half-life estimate is order-of-magnitude only  *(RESOLVED in pass 8 — the assault frequency is now computed and the model is scored against nine measured emitters; it remains an order-of-magnitude estimate, and now says so with numbers)*
`src/js/44a-nuclear.js`, `STAGES.ncBarrier`

The half-life printed in the readout multiplies the tunnelling probability by an
assumed 10²¹ assault frequency. That is a standard estimate, and the panel says
so in as many words, but it ignores the angular momentum carried off and the
deformation of the parent nucleus. What the calculation gets right — and gets
right dramatically — is the *slope*: how violently the lifetime responds to
energy. The readout is worded so that the estimate is never presented as a
prediction of a specific half-life.

## Pass 7 — derivation ladders on every stage

All **163 stages** now define `derive(st)`. Previously 25 did. The remaining 138
were written wing by wing, following the house convention: the equation line
stays in **letters**, live numbers appear only in the substitution line, and
`drvSay` rungs carry the "why this step is allowed" reasoning that is normally
left out.

Group numbering was already applied at render time in `80a-ui-core.js`
(`<span class="gnum">${gi+1}</span>`), so every wing's demo list — not only the
precalculus ones — presents its groups as an explicitly numbered prerequisite
ladder. No source reordering was needed.

### FIXED — the Ising quench test was genuinely flaky
`tests.js`

The test asserted that most random quenches below Tc reach the ordered phase,
measured by |m| > 0.85 in three of five trials. It passed on one run and failed
at 2/5 on another. The cause is real physics, not a bug: a random quench below
Tc often freezes into a **striped metastable state** — two domains wrapping the
periodic boundary — whose net magnetisation is near zero and which survives far
longer than 400 sweeps of local Metropolis dynamics.

Magnetisation is therefore the wrong probe of a quench. The test now measures
**energy**, which does equilibrate: a striped state is still locally ordered and
sits close to the ground-state energy, differing only by the cost of two domain
walls. The assertions are now that a cold quench reaches e < −1.6 (ground state
−2), a hot one stays above −1.0, and cooling lowers the energy by at least 0.5.
The deterministic ordered-phase-stability test was kept alongside, and a comment
in the test records why |m| was abandoned. Verified stable across repeated runs.

### FIXED — CL_RATES had no statement of the relation being differentiated
`src/js/28-calc1.js`

The related-rates derivation needs to display the geometric constraint it
differentiates, and the table carried only a prose `note`. A `rel` field was
added to each of the four scenes. The first attempt wrote `\u00b2` escapes
inside single-quoted JS strings, where they are **literal text**, not escapes —
so the readout would have shown `\u00b2` on screen, violating the house rule
that mathematics renders as real notation. Replaced with actual Unicode
characters and re-checked; the only remaining `\u` sequence in `src/` is a
genuine JS escape inside a `new RegExp(...)` string in `81-ui-nav.js`.

### FIXED — laRREF has no `inconsistent` field
`src/js/78a-stages-linsys.js`

The elimination ladder tested `R.inconsistent`, which `laRREF` never returns —
it yields `{R, steps, pivots, rank, swaps}`. The property read as `undefined`,
so an inconsistent system fell through to the else branch and was reported as
having a unique solution or free variables. Consistency is decided by `laSolve`,
which detects a pivot in the augmented column; the ladder now calls it and
branches on `kind`.

### VERIFIED — the smoke test earns its place
`smoke.ps1`

While writing the atom-wing ladders, `${dfrac('ħ', dv('m')_W dv('c'))}` was
committed — invalid JavaScript. `build.ps1` succeeded, because it only
concatenates. `runtests.ps1` would have reported all 2237 passing, because it
extracts only modules 10–49 and cannot see stage files. The whole application
was dead. `smoke.ps1` reported `WINGS is not defined - the script did not
finish` in ten seconds. This is the second time in two sessions that this exact
class of error has occurred, and the first time it was caught cheaply.

## Pass 8 — the three documented limitations, closed against measurement

All three `NOTE` entries above were deviations from reality that had been
disclosed rather than fixed. Each is now fixed, and each is pinned by tests
that check the fix is an *improvement*, not merely a change.

### FIXED — hydrogen levels are now for real hydrogen
`src/js/45-atom.js`

`hydrogenEn` used the Rydberg energy 13.605693 eV, which is the
**infinite-nuclear-mass** limit: it assumes the proton is nailed down. A real
proton is only 1836 times heavier than the electron, so both orbit their common
centre of mass and the electron mass must be replaced by the reduced mass.

    AT_RYD_H = AT_RYD_INF / (1 + m_e/m_p) = 13.598287 eV

The measured ionisation energy of hydrogen is **13.598434599702 eV**. The
reduced-mass correction moves the prediction from 7.4×10⁻³ eV away from
measurement to 1.5×10⁻⁴ eV away — an improvement of about fifty times, which is
asserted by test rather than claimed. The residual is relativistic and QED
structure (fine structure and the Lamb shift), which no Bohr-level formula can
produce, so `AT_H_MEASURED` is kept and the stage **prints the residual** rather
than hiding it. The old test pinned the idealisation and correctly failed; it
now pins real hydrogen, the size of the improvement, and that the residual is
neither zero nor larger than 2×10⁻⁴ eV.

### FIXED — one value of g, everywhere
`src/js/31-mech.js`, `src/js/63b-stages-curves-space.js`, `src/js/72i-demos-curves.js`

The curves wing hardcoded 9.81 in nine places while every other wing used
`DY_G`. All nine now use `DY_G`, and the demo caption that promised a readout of
"exactly 9.81" now says 9.80665. The constant's comment records what it actually
is: standard gravity is **exact by definition** (CGPM 1901), not a measurement,
and real local g varies from about 9.764 to 9.834 m/s² — a 0.7% spread, far
wider than anything this laboratory quotes. Tested.

### FIXED — the α half-life estimate no longer assumes its own key number
`src/js/44a-nuclear.js`, `src/js/79h-stages-nuclear.js`

The readout multiplied the tunnelling probability by an assumed assault
frequency of "about 10²¹ per second" — a number taken from a textbook rather
than computed. `ncAssaultFreq` now derives it from the well the stage already
draws: inside, the α has kinetic energy Q + 32 MeV, which gives it a speed
(relativistically, since v/c ≈ 0.13), and it crosses the nucleus and returns in
2R/v. That comes out near 2×10²¹ per second — so the textbook figure is
recovered rather than borrowed.

More importantly, `NC_ALPHA_EMITTERS` adds **nine real α emitters** (Q from
AME2020, half-lives from NUBASE2020) spanning ²³²Th at 4.08 MeV / 1.4×10¹⁰ yr
down to ²¹²Po at 8.95 MeV / 294 ns — a factor of 2.2 in energy against **24
orders of magnitude** in half-life. The readout scores the model against every
one of them in dex, and the tests assert:

- every prediction is within 3 orders of magnitude, mean under 2;
- the predicted half-life falls **monotonically** as Q rises — which is the
  Geiger–Nuttall law itself, and the thing the model genuinely gets right;
- and that the mean error is **greater than 0.2 dex**, so the panel can never
  quietly start claiming better-than-order-of-magnitude accuracy.

The one remaining free parameter is the well depth. The residual is real and
comes from assuming a spherical parent, zero angular momentum carried off, and
a WKB barrier — all of which the panel now says explicitly.

## Pass 8 — housekeeping

- **Dead code removed** in `60b-stages-quantum.js`: `st.yFrom` was assigned and
  immediately reassigned with an algebraically identical expression carrying a
  `* 1 + 0` and a stale comment.
- **Seven files split** back under the ~600-line guidance, at stage boundaries,
  using the letter-suffix convention so load order is unchanged: `60ba`, `60ca`,
  `60ia`, `66ba`, `66ca`, `73ba`, `79ja`. Verified afterwards that all 163
  stages survive, none is duplicated, and all still define `derive`.
- **Eleven missing legends added** — every one was in the nuclear, solid-state
  or statistical-mechanics wings, and every one drew with between two and six
  distinct theme colours, so none of them was a legitimate omission. All 163
  stages now define `derive`, `readout`, `chip` and `legend`.

## Pass 9 — the readability audit, and what it found

The previous passes proved the site *computes* correctly and *runs* without
throwing. This pass asked a different question: is what reaches the reader
actually readable? Two new instruments were built, because neither `runall.ps1`
(which greps only for `NaN`/`undefined`) nor `runtests.ps1` (which never sees the
DOM) can answer it.

- **`audittext.ps1`** drives all 443 demos in all 39 wings and every theory
  essay, and harvests the `textContent` and `innerHTML` of every panel a student
  reads — readout, chip, legend, derivation, commentary, controls, prose.
- **`auditscan.ps1`** scans that harvest for ASCII stand-ins, leaked markup,
  empty panels, and canvas text carrying markup it cannot render.
- **`auditcontrast.ps1`** parses the token blocks out of `styles.css` and checks
  every foreground against every background it can land on, in both themes.

First run: **72 HIGH notation defects, 126 empty panels, 1 live ReferenceError.**
After this pass: **0, 0, 0.**

### FIXED — `supify()` could not see any exponent that spanned a tag
`src/js/10-math.js`

The derivation ladders build equations by concatenating tag helpers, so a script
very often spans tags:

    ${dop('e')}^(${dop('i')}${dv('k')}${dv('a')})
      ->  e^(<span class="op">i</span><i>k</i><i>a</i>)

`supify()` converted each text run in isolation, and the run holding `^(` has no
closing paren in it. Nothing matched, so a literal `^(` reached the reader on
**about fifty derivation steps** across twenty files — every exponential in every
ladder, `e^(−st)`, `e^(−λt)`, `∫₀^∞`, `A^(2/3)`.

Three further shapes had never been handled at all: an exponent that is itself
markup (`T^<i>N</i>`), a non-ASCII exponent (`∫₀^∞`, `F^μν`), and **`_`
subscripts, which were never converted in any context** — `∂_μ`, `Σ_(n=0)`,
`E_g`, `V_T` all printed their underscores.

`supify()` is now a walker: it marks which characters sit inside a tag once, then
matches groups *across* tags by counting only the parentheses that live in text.
The tag-skipping that protects `data-v="x^2+y^2-4"` from the expression parser is
preserved and is now **pinned by test** — 17 new assertions in `tests.js` cover
every shape, the attribute protection, an unclosed group, and idempotence.

### FIXED — a live ReferenceError in the nuclear wing, and the harness gap that hid it
`src/js/79h-stages-nuclear.js`, `runall.ps1`

`STAGES.ncBarrier.readout` referenced `G2`, which is not defined anywhere; the
value intended was `H2.G.G`. The readout threw on every one of the stage's three
demos, taking the derivation, chip and legend down with it — the four "empty
panels" were one bug, not four.

It had survived because **`runall.ps1`'s two wing lists never included `nuclear`,
`solid` or `statmech`**. Those three wings were added in the fifth pass and the
`runall.ps1` step of the add-a-wing checklist was missed, so the full audit had
never once visited them. Both lists now include all 39 wings.

### FIXED — the whole design system failed WCAG AA on its smallest type
`src/styles.css`

`--faint` measured **3.17:1 in dark and 2.69:1 in light**, against the 4.5:1 AA
threshold — and it is what renders `.help` (the explanatory paragraphs under
every control), `.kv .k` (every key label in every readout), and `.demo-b .ex`
(every demo's formula), at 10–11.5 px.

`--c-warn` was worse and for a structural reason: it was declared **once in
`:root` and never overridden per theme**, so light mode inherited the dark yellow
at **1.83:1**, which is close to invisible. `--mid` in light was 1.69:1.

Every token now meets its target in both themes, verified by arithmetic rather
than by eye. The type floor was raised to 12 px (10 px → 12, 10.5 → 12, 11 → 12,
11.5 → 12.5), including the hardcoded canvas fonts in `plotFrame`, `stageNote`
and `ctText`. `auditcontrast.ps1` re-derives the check from the stylesheet, so it
cannot drift, and it models token inheritance — the exact hole `--c-warn` fell
through.

### FIXED — the guided-experiment rail escaped its formulas instead of typesetting them
`src/js/80a-ui-core.js`

The demo list rendered `esc(it.n)` and `esc(it.ex)`. `ex` is a *display* string,
like `out` and `note` two functions below, which are supified. The result was
that **16 demo formulas showed a raw caret** in the rail — `(1 + x)^(1/x) → e` —
and **7 written with `<sub>` showed the tags themselves**.

Both now go through `supify()`. A bare `<` used as less-than is safe: HTML only
opens a tag when a letter follows it, which is why `E < V₀` and `|x| < 1` already
rendered correctly through `out`. That was verified against the harvest rather
than assumed.

### FIXED — slider value labels bypassed the typesetter entirely
`src/js/60a-stage-core.js`

`wireSlider` wrote its value label with `textContent`, which is assigned *after*
`buildStagePanel()` has supified the panel. A formatter emitting `'10^' + …` put a
literal caret on screen, and `<sup>` would have been drawn as text. The two
solid-state doping sliders did exactly this. The label now typesets itself.

### FIXED — `{−}` printed its braces on 68 derivation rungs
`src/js/58-derive.js`

`{−}` was a source convention meaning "a tight operator, without the spacing
`dop()` adds". Nothing ever converted it, so `√(l(l{+}1))ħ` and `h(t{−}τ)` showed
the braces. Only a lone operator character is unwrapped, so real braces —
`ℱ{f * g}`, set-builder notation — survive untouched.

### FIXED — canvas text carried carets it cannot render
`src/js/10-math.js`, `60a-stage-core.js`, `61a-ct-toolkit.js`

`ctx.fillText` draws markup literally, and eight display strings are shared
between an HTML control and a canvas title (`CL_LIMITS[k].name` is both). The
canvas half showed `f(x) = (1+x)^(1/x)`. `uniSup()` now converts caret exponents
to Unicode superscripts at the canvas primitives, and **deliberately gives up**
when a character has no superscript form rather than emitting a half-converted
exponent; `auditscan.ps1` reports those for rewording. Verified by screenshot
that the substitutions render rather than tofu.

### NOTE — an empty legend is not always a defect
`ckLab` returns `[]` from `legend()` for all 51 circuit demos, and that is
correct: the pane instruments paint their own key onto the canvas with
`ckLegendRow`. The scanner reports empty legends separately from empty
readouts/derivations rather than failing the build on them. Checked before
"fixing".

## Pass 9 — the formal layer

The essays state theorems in flowing prose and, before this pass, **proved
none**: the word "proof" occurred four times across all 39 wings and there was no
definition/theorem markup anywhere. `83-statements.js` adds numbered
Definition / Theorem / Lemma / Corollary cards with hypotheses separated from the
conclusion, a proof in a fold, and a link to the experiment that demonstrates
them. Numbering is applied at render time, for the same reason demo groups are.

Coverage is measured by `auditscan.ps1` from the **rendered** essay, so it counts
what a reader can reach rather than what the source claims. As of this pass:

**70 statements across all 39 wings — 64 carrying a full proof, 64 linked to the
experiment that demonstrates them. No wing is without a formal layer.**

Of the six statements with no proof block, five are definitions, which have
nothing to prove. The sixth is **Hartman–Grobman**, whose real proof is a
contraction-mapping argument on a function space; it carries a `because:` block
stating exactly what is being taken on trust and why, rather than a sketch that
would not survive scrutiny. That is the house rule for the boundary: an absent
proof must always be a stated boundary, never a silent gap.

The proofs are the ones a course at each level actually proves — MVT from Rolle,
FTC Part 2 from Part 1 via the vanishing-derivative corollary, Stokes' from
Green's, the second-derivative test from the spectral theorem, Snell from Fermat,
Carnot from the entropy inequality, Robertson from Cauchy–Schwarz, Bloch from the
commuting translation operator. Several record the trap as well as the result:
the chain-rule proof shows why the tempting "multiply and divide" argument is
wrong, and L'Hôpital's records that the rule is not merely unhelpful on a
non-indeterminate form but silently false.

### NOTE — `smoke.ps1` caught two more parse errors this pass
Once from `dv('m')_W` (invalid JS) and once from a PowerShell backtick-f being
consumed as a form-feed escape, which silently wrote a control character into
the middle of a source line. Both would have passed `build.ps1` and
`runtests.ps1` and left the application completely dead.
---

## Pass 10 — the string theory wing

A new wing raises a problem the other thirty-nine do not: much of its subject is
unsettled, and a wing that presented conjecture in the same voice as theorem
would be worse than no wing at all. So the accuracy standard was tightened
rather than relaxed. Every quantitative claim is computed from a definition, and
every claim that two things are equal is made only after computing both sides
independently and printing the difference — including in the essay, where each
statement card is labelled as a theorem, a checked conjecture, a disputed
construction, or a hope.

### VERIFIED — the string tension, by two routes with no data in common
`wsReggeFit` fits J = alpha-prime M-squared + alpha-nought by ordinary least
squares to six PDG 2024 states of the rho / a family, reporting r-squared, the
residuals and the standard error of the slope. It gives 0.91501 GeV^-2, which is
inside the 0.85-0.95 literature range. Converting through sigma = 1/2*pi*alpha'
gives 881.5 MeV/fm. The atom wing's `SIGMA_STRING`, fitted independently to
heavy-quarkonium level spacings, is 900 MeV/fm. The two agree to 2.1%, and a
unit test asserts the agreement is better than 5% so that a future edit to
either number cannot silently break it. This is the only place in the wing where
string mathematics touches measured data directly, and it is why the wing opens
with it rather than with quantum gravity.

### VERIFIED — zeta(-1) three ways, and the critical dimension twice
"1 + 2 + 3 + ... = -1/12" is the point at which a sceptical reader is entitled to
stop, so it is never asserted. An exponential cutoff gives the closed form
1/(4 sinh-squared(eps/2)); subtracting its 1/eps-squared divergence leaves a
remainder that agrees with -1/12 to exactly the next term in the expansion,
eps-squared/240 — which is what the unit test pins, rather than a bare
tolerance. Separately, zeta(2) is summed by Euler-Maclaurin and the functional
equation carries it to zeta(-1); the two routes share no step and agree to
twelve figures. The critical dimension is then SOLVED for on two further
independent routes — the polarisation count of a massless vector, and the
vanishing of the total conformal anomaly — which return the same integer for
both the bosonic string and the superstring. Tests assert that D = 25 is not a
solution, so the prediction is pinned as having no slack in it.

### VERIFIED — the regularisation, against a laboratory measurement
The Casimir pressure uses the identical procedure, and the 240 in its
denominator is 12 x 20 where the 12 is the 12 of zeta(-1). The engine reproduces
1.30013 mPa at one micron, obeys an exact inverse fourth power, and the pressure
is checked against a numerical derivative of the energy per unit area. Lamoreaux
(1997, 5%), Mohideen and Roy (1998, ~1%) and Decca and collaborators (better than
0.2%) have measured it. The stage says explicitly that this validates the
regularisation and not string theory.

### VERIFIED — every "these two are equal" claim in the wing
- **T-duality.** The mass is computed at R and at alpha-prime/R with n and w
  exchanged; the difference is under 1e-12 for every quantum-number set tested.
- **Modular invariance.** eta(-1/tau) and sqrt(-i tau) eta(tau) are each built
  from the infinite product independently; they agree to 1e-12 across the upper
  half plane, and SL(2,Z) reduction is asserted to land inside the fundamental
  domain with Im tau never below sqrt(3)/2.
- **Strominger-Vafa.** A Cardy count at c = 6 Q1 Q5 and a horizon area divided by
  4G are computed from the same three integers by different formulas and agree as
  FUNCTIONS of all three, not at one point.
- **Ryu-Takayanagi.** The bulk geodesic is integrated by `nqAdaptive` at 1e-13
  and also evaluated in closed form; the result divided by 4G3 is compared with
  the boundary CFT formula (c/3)ln(l/eps), and the residual is asserted to fall
  like eps-squared — a cutoff artefact, not an error. A discrepancy that sat
  still would fail the test.
- **The Fermat surface.** The drawn Calabi-Yau slice is checked to satisfy its
  own equation z1^5 + z2^5 = 1 to 1e-9 in both real and imaginary parts, so the
  picture is the object and not an impression of it.

### VERIFIED — asymptotic formulas shown converging, not assumed
The bare Cardy exponent 2*pi*sqrt(cN/6) has a ratio to the exact log-count of
only 0.84 at level 400, which quoted alone would look like a failure. The full
saddle-point evaluation, prefactor included, agrees to better than 0.2% there,
and the tests assert both that it is within 0.2% AND that the leading term alone
is still below 0.9 — so a future "simplification" that dropped the prefactor
would fail. The partition machinery underneath is pinned against the known
values p(100) = 190569292 and p(200) = 3972999029388.

### NOTE — the Planck constants are computed, then checked against CODATA
`WS_LPL_M`, `WS_MPL_KG` and `WS_TPL_S` are derived from hbar, c and G rather than
quoted, and the tests compare them with the published CODATA 2022 values. `WS_C`
and `WS_G` duplicate `C_SI` and `G_SI` because 46-relativity.js loads later and a
top-level const cannot reach forward; tests assert the copies are identical, so
they cannot drift.

### NOTE — what the wing does NOT claim
The essay's closing section sorts every result into established mathematics,
supported conjecture, disputed construction, and not established, and puts "that
string theory describes our universe" firmly in the last category. The extra
dimension stages place every predicted size against the actual Eot-Wash and HUST
torsion-balance limits and the LHC monojet and resonance searches, and report
that nothing has been found. The Strominger-Vafa stage states plainly that no
microscopic count is known for a Schwarzschild black hole. The KKLT stage solves
for the uplift by bisection so that the tuning is visible as a search, and shows
the vacuum disappearing entirely at three times the tuned value.

### FIXED — four defects found by static scan before runall saw them
1. `wsFitLine` omitted `rms` on its degenerate n < 2 branch, so a caller reading
   `f.fit.rms` off an empty fit would have printed the literal word `undefined`.
2. `Math.sin(Math.PI * z)` in the log-gamma reflection returned ~1e-12 instead of
   0 at z = -5001, which made the Regge limit — the one place large negative
   arguments occur — return NaN. Now computed from the fractional part.
3. Four canvas labels carried `_` subscripts and one carried a `^` exponent.
   `plotFrame` passes only its x label and title through `uniSup`, and `uniSup`
   handles carets but never underscores, so all five would have been drawn
   literally. Replaced with Unicode or reworded.
4. The level slider on the spectrum stage stepped by 1, which made the
   superstring's massless state at N = 1/2 unreachable. The step now follows the
   chosen theory, and switching theory snaps N onto the right ladder.

---

## 2026-08-09 — the reader-supplied-data audit

### FIXED — the divergence theorem was wrong on the cylinder
`STAGES.vcDiverg` builds a cylinder from three surface integrals and compares
their sum with the volume integral of the divergence. Its curved side was
parametrised `r(u,v) = (a cos v, a sin v, u)` with u the height, for which

    r_u x r_v = (0,0,1) x (-a sin v, a cos v, 0) = (-a cos v, -a sin v, 0)

points radially **inward** — the opposite of the comment sitting above it. The
side flux therefore entered the sum with the wrong sign.

Measured before the fix, with F = (x,y,z) on r <= 1, 0 <= z <= 1.4:

| quantity | before | after | closed form |
|---|---|---|---|
| flux, side + two caps | −4.39823 | 13.19469 | 3*pi*a^2*h = 13.194689 |
| volume integral of div F | 13.19469 | 13.19469 | — |
| difference | 17.59 | 3.76e-10 | — |

The arithmetic of the failure: the correct side flux is 2*pi*a^2*h = 8.7965 and
each cap contributes pi*a^2*h/2 = 2.1991, so flipping the side gives
−8.7965 + 4.3982 = −4.3982, exactly what was printed.

**Why it survived every previous audit.** `runall.ps1` greps readouts for NaN,
undefined and Infinity; a finite wrong number passes. And of the six preset
fields, four have side flux zero by symmetry — for F = (x^2,y^2,z^2) the side
integrand is (x^3+y^3)/a, odd in both x and y around the full circle — so the
sign had nothing to act on. Only `radial` and `inverse` could expose it, and
nothing was comparing their two sides against a closed form. Both now do.

Fixed by making the geometry match the comment: u is the angle and v the height,
giving r_u x r_v = (a cos u, a sin u, 0), outward. Verified against all six
presets and against a typed field F = (x^3,y^3,z^3), whose volume integral
6*pi*(h/4 + h^3/6) = 15.21787 the panel now reproduces to 4.5e-10.

### CHECKED — the 2*pi gap on the inverse-square field is correct
With F = r-hat/r^2 the cylinder still reports flux 6.283185 against a volume
integral of 1.76e-15. That is not a defect: div F = 0 wherever it is defined, and
the whole source is the origin, which sits at the centre of the cylinder's bottom
face. A point source on the boundary has half its solid angle inside, so the
flux is 2*pi = 6.2831853 and not 4*pi. The panel used to print the bare
difference with no comment, which read as a bug; it now states which of the two
kinds of difference it is showing and why the hypothesis, not the theorem, is
what failed.

### FIXED — every expression box lost the caret while being typed into
`fnWire` calls `buildStagePanel()` once a formula parses, which replaces
`#stageBody` wholesale — including the input being typed into. Measured: after
one accepted keystroke `document.activeElement` was BODY and the original input
was no longer in the document. It now restores focus and the caret offset, so a
formula can be typed straight through. This affected the partial-derivatives
wing, the only wing that had custom functions before this audit.

### FIXED — the conservative-fields stage was doing nine million quadratures a second
Work was counted, not timed: `performance.now()` is useless under Chrome's
`--virtual-time-budget`, which does not advance during synchronous script. The
engine entry points were wrapped with counters instead and every stage driven
for ten frames.

`STAGES.vcConserv` draws the recovered potential as contours. Recovering f at a
point means integrating F along a path to get there, so one *evaluation* is an
adaptive quadrature — and a range scan plus sixteen contour traces asked for
about 152 700 of them, **per frame**, for a picture that only changes when the
field does.

| stage | engine calls / 10 frames, before | after |
|---|---|---|
| vcConserv | 1 527 120 | 24 |
| vcGreen | 1 600 | 4 |
| vcLineInt | 650 | 5 |
| vcStokes | 217 | 21 |
| vcDiverg | 199 | 19 |
| vcSurface | 196 | 15 |

Three changes:
1. `vcPotGrid` samples the potential onto a grid once and interpolates, keyed on
   the field source and the window, so it is rebuilt only when one of those
   changes. The grid is split by the window's aspect ratio — it is 3.5:1, and a
   square grid would have let x set the whole error.
2. `vcField3` is memoised on its three source strings. It costs three parses,
   nine symbolic differentiations and twelve compiles, and the stages call it
   from both `frame()` and `readout()` several times a second on source that
   never changed.
3. `vcPlaneFns` added and memoised the same way, replacing three hand-rolled
   `compile(parse(...))` blocks that ran per frame.

**The error this trades for the speed, measured** — all six preset fields, 289
samples each taken off the grid nodes at a golden-ratio offset so none can land
on one, against a real line integral:

| field | worst absolute error | as a share of the plotted range |
|---|---|---|
| rot, shear | 1.8e-14 | exactly linear, interpolation is exact |
| radial | 1.6e-3 | 0.004% |
| grad | 1.4e-2 | 0.004% |
| vortex | 2.5e-2 | 0.42% |
| source | 2.7e-2 | 0.63% |

The two worst are the two with a singularity at the origin, where the potential
is logarithmic and no fixed grid does better within a cell. This affects only
the drawn contours, displaced by the error over |grad f|, which is large exactly
where the error is — so the displacement is sub-pixel. Every number the panel
*reports* still comes from `vcPotential` at full precision.

### CHANGED — every numeric control accepts a typed value
`ctlSlider` now emits a number box beside the track and `wireSlider` commits it
through the same path the slider uses. A typed value is **not** bounded by the
slider's min/max: the thumb pins at the end and the stage uses what was asked
for. `ctlParse` accepts anything the expression engine does, so `pi/4`, `2^10`,
`1/3` and `sqrt(2)` are all legal ways to say a number.

Three kinds of ceiling remain, and each states its reason in the panel:
- `RL_BETA_LIM` on all seventeen speed controls in the relativity wing. Driving
  them past c used to throw out of `relCheckBeta` and take the stage down; all
  thirteen affected stages were caught by driving every control past its top end.
- The rotating-disk pair constrain each other, since a point at radius r moves
  at beta*(r/R); its limit is a function of the other control's value.
- Counts (step 1 from a positive start) round to integers, refuse to go below
  the author's minimum — 0.785 rounded to a 1-panel mesh — and cap at ten times
  the top of the slider, because the work grows with them.

Driving all 178 stages, typing past the top of every control, then an expression,
then deliberate gibberish, reports no throw, no blanked control and no non-finite
value in any readout or chip.

## 2026-08-09 (continued) — the second batch of wings

### FIXED — the derivative ladder reported f'(a) = 0 for every function but x^2
`clBundle` returns `{f, d1, d2, d3}`. `STAGES.clDeriv`'s ladder read `st.F.d`,
which does not exist, and the guard `st.F.d ? st.F.d(a) : 0` turned that
`undefined` into a confident **0**. So on sin x, e^x, ln x, 1/x and |x| the rung
"what the limit is here" printed f'(a) = 0, and the error column measured the
secant slope against zero. Now reads `d1`. This is the same failure mode
AI-GUIDE already warns about for `laRREF.inconsistent`: a field that does not
exist is falsy, and falsy is a plausible-looking answer.

### FIXED — typed formulas in a stage's own variables were silently discarded
`fnWire` validates by parsing the raw text. A parametric curve is written in
`t` and a live parameter `a`, neither of which is a variable the expression
engine binds the way the stage needs — `t` is the animation clock and `a` is
unknown — so `a*cos(t)` failed validation, `set` was never called, and the
previous formula stayed in force. The box accepted the keystrokes and the
picture ignored them.

Slots may now carry their own `build`. `pkParamBuild` rewrites t to x and a to y
before parsing and *throws* on bad input so the message still reaches the reader.
Measured after the fix, against closed forms:

| typed curve | quantity | computed | exact |
|---|---|---|---|
| x = cos t, y = sin t | r, r', r'' at t = 0.7 | agree to 9 digits | — |
| " | curvature | 1 | 1 |
| " | arc length | 6.283185307 | 2*pi |
| x = a cos t, y = a sin t, a = 2 | curvature | 0.5 | 0.5 |
| " a = 2 | arc length | 12.5663706 | 4*pi |
| " a = 3 | arc length | 18.8495559 | 6*pi |
| x = t - sin t, y = 1 - cos t | arch length | 8 | 8a with a = 1 |

### CHANGED — auditcustom now checks that typing *does* something
The first version only proved the custom path did not crash. It passed on the
curve stage whose boxes were rendered but never wired, because an ignored
formula throws nothing. It now records the readout and chip before typing and
compares afterwards, and reports "typing changed nothing" when they match. The
probe formulas carry deliberately odd constants (0.37, 1.7) so that "nothing
changed" cannot mean "the formula typed happened to be the default" — which it
did mean on the first run, twice.

### Coverage after this batch
25 stages offer "type your own" (16 before it), 37 expression boxes driven, and
every one of the 178 stages accepts typed values on all of its numeric controls.
The retrofit now comes in three shapes, all documented in AI-GUIDE section 3b:
`pkSeg`/`pkBoxes` for a table-backed picker, `pkSrcSeg`/`pkSrcBox` for a picker
whose value is the expression itself, and `pkParam*`/`pkCurve2` for expressions
written in a parameter rather than in x.

## 2026-08-09 (third batch) — sequences, series, curves, forcings, harmonics

New module `59b-pk-entries.js`: one accessor per remaining preset table, each
returning an object shaped like an entry of the table it shadows. Coverage went
from 25 stages offering "type your own" to **35**, 53 expression boxes.

### FIXED — the parameter substitution missed implicit multiplication
Expressions written in a parameter are rewritten before parsing (t to x, a to y,
n to x) because the engine binds `t` to the animation clock and knows nothing
called `a` or `n`. The rewrite used `\bt\b`, and **a digit is a word character**,
so `2n` and `2t` were left alone — `(2n+3)/(5n-1)`, which is exactly how anyone
writes a sequence, silently failed to parse and fell back to the previous
formula. The boundary is now "not a letter", `(?<![A-Za-z])n(?![A-Za-z])`, which
still leaves the n of `ln`, `sin`, `tan` and `min`, and the a of `atan` and
`abs`, untouched. Verified on all of those.

### FIXED — (-1)^n was reported as converging to 1
The limit test sampled n = 20 000, 40 000 and 80 000 and asked whether the values
were closing in. **All three are even**, so (-1)^n reads as a constant 1 at every
one of them and an oscillation was mistaken for a limit. It now requires forty
*consecutive* terms far out to agree with one another, judged against the range
the sequence covers rather than against 1 — an absolute tolerance called
sin(n)/n divergent, since it wobbles by 2.5e-5 out at n = 400 000 while
converging perfectly well to 0.

The limit offered is `2a(800000) - a(400000)`, Richardson's cancellation of the
1/n error term, rather than a single far term. Measured:

| typed sequence | reported | true |
|---|---|---|
| (2n+3)/(5n-1) | 0.4 | 0.4 |
| 1/n | 0 | 0 |
| n/(n+1) | 1 | 1 |
| (1 + 1/n)^n | 2.71828183 | e = 2.718281828 |
| ln(n)/n | 1.73e-6 | 0 |
| sin(n)/n | -3.5e-7 | 0 |
| (-1)^n, cos(pi n), n | no limit quoted | correct |

Reporting a(N) itself would have said 2.5e-6 for 1/n; the extrapolation gives 0.

### Measured, not declared — the rest of the new entries
- **Series**: no sum is quoted for a typed series. A hundred thousand terms are
  summed and the movement between the ten-thousandth and hundred-thousandth
  partial sum is printed as the honest bound on how far the total may still be.
  Checked: 1/(n^2+n) gives 0.99999 against an exact 1, (0.5)^n gives 1, and the
  harmonic series is correctly reported as not settling.
- **Harmonic functions**: the Laplacian is formed symbolically and evaluated
  across the window. x^3-3xy^2 gives max|lap| = 0 (harmonic); x^2+y^2 gives
  exactly 4 (not harmonic), which is its true Laplacian.
- **Invertibility**: monotonicity is sampled rather than asserted. x^3-2x is
  correctly reported as not one-to-one; x^3+x is, and its numeric inverse
  satisfies f(inv(10)) = 10.
- **Curves**: x = cos 2t, y = sin 2t over [0, 2pi] gives length 12.5663706 = 4pi.

### FIXED — two pickers were converted in the wire but not in the controls
srConverge and odNonhom had their wiring updated while their segmented controls
still built the old preset-only list, so no custom chip appeared and the probe
was silently reading a preset. Found by testing the *values*, not the wiring.

## 2026-08-09 (fourth batch) — the Fourier synthesis stage

### FIXED — every numerically-analysed signal lost half its DC offset
`ftNumCoef` scaled the k = 0 coefficient by 1/N and every other by 2/N, so it
returned a0 = mean. But the classical convention writes the series with a0/2 as
its constant term, and both `ftNumPartial` and the readout duly divide by two —
so the constant term came out at half the true mean, and every reconstruction
sat that far below the signal.

It went unseen because **all four waveforms the wing shipped with have mean
zero**: square, sawtooth and triangle are odd, and the sketch pad starts from a
square wave. The only term the error touches was zero in every case anyone had
looked at. A typed f(t) = t found it on the first try.

Measured before and after, on the *drawn* path as well as the typed one:

| signal | quantity | before | after | exact |
|---|---|---|---|---|
| f(t) = t | mean a0/2 | 0.25 | 0.5 | 0.5 |
| f(t) = t | partial sum at t = 0.3, K = 200 | 0.0507 | 0.300659 | 0.3 |
| 2 + sin 2*pi*t | partial sum at t = 0.25 | — | 3 | 3 |
| a drawn constant 1.5 | mean a0/2 | 0.75 | 1.5 | 1.5 |

`ftNumCoef` now scales every k by 2/N. Ten unit tests were added pinning the
convention — the numeric Fourier path had **none**, which is why a factor of two
lived in it: the mean of a constant, the mean of a ramp, the ramp's b1 = -1/pi
and b2 = -1/2pi, a pure sine reproducing itself, and a shifted sine
reconstructing both its peak and its trough. 2450 tests became 2460.

### ADDED — a typed signal for the synthesis stage
`ftSynth` already had a signal with no closed form: the curve you draw, whose
coefficients come from quadrature. A typed f(t) is the same object arriving by a
different route, so it goes down the same path — `ftNum(st)` is true for both and
`ftSignal(st)` returns whichever is loaded. Both wrap into one period, because a
Fourier series represents the periodic *extension*: type `exp(-3*t)` and the
disagreement between f(0) = 1 and f(1) = 0.05 produces a genuine jump, and Gibbs
overshoot appears at it however many harmonics are kept.

Verified: sin(2*pi*t) gives b1 = 1 with every other coefficient below 5e-17.

---

## 2026-08-09 — the roadmap pass

### FIXED — Taylor coefficients ignored the centre (`29-series.js`)

`srTaylor(key, N, x, c)` raised **(x − c)** to its powers but multiplied them by
`T.coef(k)`, which every preset computed about the origin. The two together are
not the Taylor polynomial of anything: for e^x about c = 1 the degree-0
"polynomial" came out as **1** instead of **e**, and the Lagrange bound was
violated by a factor of thirty thousand.

Invisible because *every* guided experiment sets c = 0 and every unit test called
`srTaylor` with the centre omitted — but the stage puts a **centre c slider** in
front of the reader, so the wrong curve was one drag away. This is precisely the
shape ROADMAP B1 describes: a preset whose value happens to be zero hides an
error in the term it multiplies.

- `coef` now takes the centre and returns f⁽ᵏ⁾(c)/k!, in closed form for all
  seven entries.
- `atan` gained a closed form about a general centre,
  a_n = (−1)ⁿ⁻¹ sin(nφ)/(n rⁿ) with r = √(1+c²), φ = atan2(1, c), derived from
  the partial fractions of 1/(1+x²). The factorials cancel analytically, which
  matters: the recurrence route computes (n−1)!/n! as a ratio of two numbers
  that overflow past n ≈ 170, and this series is summed to 20 001 terms to show
  how slowly the Leibniz formula converges.
- Each entry gained `rad(c)` — the distance from c to the nearest complex
  singularity — and the stage now shades the interval of convergence at that
  radius instead of a hard-coded width of 1. Sliding the centre of 1/(1−x)
  towards 1 now visibly shrinks the band to nothing.
- Checked by five new tests: a polynomial about c ≠ 0 reproduces f near c for
  exp, sin and ln; the degree-0 polynomial about c equals f(c); the Lagrange
  bound holds about a shifted centre.

### NEW — level-set tracing (`24-multivar.js`)

`mvLevelCurve(G, box)` returns an arc-length parametrisation of g(x, y) = 0 by
predictor–corrector: march along ∇g rotated a quarter turn, Newton-correct back
onto the curve after each step. Written so the Lagrange stage can walk a
constraint the reader typed, which arrives with no parametrisation.

Two things it gets right and a naive version does not. The closing hop of a
closed loop is included, without which a lap of the unit circle came out 0.2%
short; and `param` snaps its interpolated point back onto the curve, without
which the walk rides the chords — inside a circle by h²/8 — so "g there" printed
a small non-zero and the constrained maximum came out low in the fifth digit.

Ten tests: the unit circle closes with length 2π to 2e-3, every traced point
satisfies |g| < 1e-11, equal steps in t are equal arc lengths, an open arc is
walked in both directions from its seed, a constraint that is never zero returns
null, and Lagrange on a traced parametrisation reproduces √2 for x + y on the
unit circle to 1e-5.

### FIXED — `auditcustom.ps1` tested only the first picker on a stage

The harness took `querySelector('[data-v="custom"]')` — the *first* custom
option — so a stage carrying two of them had the second silently untested. Adding
a region picker to the general-regions stage displaced its integrand picker from
coverage, which is how this surfaced. It now walks every `.seg` offering the
option, by id (ids survive the panel rebuild that selecting an option triggers),
and types only into boxes a given picker newly revealed.

It also now cycles four structurally different formulas instead of typing one
everywhere: identical text in paired slots degenerates — an inner and an outer
radius that are the same function bound an **empty** region, and x(t) = y(t)
collapses a curve to the line y = x — and the first run after the change reported
a wired density box as unwired for exactly that innocent reason.

Coverage went from 36 stages / 36 pickers to 42 stages / 44 pickers.
### NEW — bound states of an arbitrary potential (`40-quantum.js`)

`qmBoundStates(V, x0, x1, count)` solves ψ″ = 2(V − E)ψ by Numerov integration
and locates the eigenvalues by **bisecting on the node count** rather than on the
value of ψ at the far wall. The node count is a non-decreasing step function of E
that steps up by exactly one at each eigenvalue, so the search has no exponential
growth to fight, no near-cancellation, and cannot skip a state whose ψ at the
wall happens to be small.

Two things it gets right that a first attempt does not. Under a barrier the
solution grows like e^(+κx) and overflows before reaching the far wall, so the
recurrence rescales everything computed so far when it gets large — legitimate
because the equation is linear, and it leaves the node count untouched. And the
node count reported for a converged state is **recounted afterwards**, ignoring
the region where |ψ| has fallen below a millionth of its peak: at exactly Eₙ the
solution reaches the wall as it crosses zero, so the crossing lands just inside
or just outside the last grid point at random, and the count taken during the
search reads n−1 or n unpredictably. Both were caught by the tests.

Checked against the two spectra known in closed form, with the solver told
nothing about either: the flat box reproduces n²π²/2L² to a relative 1e-6 for
n = 1…4, and V = x²/2 gives Eₙ = n + ½ to 2e-6 for n = 0…4 with the level
spacing equal to 1 to 5e-6. The equal spacing is the stronger check — it is what
makes the oscillator the oscillator, and no single level would catch a systematic
shift.

`qmWell` now offers a typed V(x) on this path, and reports what the solver
scores on V = 0 — where the answer is known — as the measure of what its numbers
are worth.

### FIXED — `auditcustom.ps1` matched the option label exactly

Five stages label their custom option "type your own signal", "type your own
V(x)", "test one of your own" and so on; an exact match on "type your own" saw
none of them. It now matches `/your own/i`. It also now exercises stages whose
expression box is **permanently on the panel rather than behind a picker** — the
least-squares stage takes a typed list of data points that way, which is the
keyboard route into a stage that is otherwise pointer-only, and it had no
coverage at all.

That immediately reported the least-squares box as unwired, and it was half
right: the box correctly rejected the formula the harness typed, but its
validator never threw, so `fnWire` showed the reader no message and silently
kept the previous points. The validator now throws with a specific message, and
the harness reads the field's own label to offer it a point list instead of a
formula.

Coverage: 44 stages / 46 pickers → **52 / 54**.
### NEW — the transform of a signal nobody has solved (`49-fourier.js`)

`ftHatNum(x, f, T, N)` evaluates X(f) = ∫x(t)e^(−2πift)dt over a finite window
by the trapezoid rule, which looks like an odd choice for an oscillatory
integrand until you notice what it is doing: Euler–Maclaurin's error terms are
all *endpoint derivatives*, and a signal that has decayed by ±T has none, so the
rule stops being second-order and becomes spectrally accurate. Checked against
all three closed-form pairs in the engine — Gaussian to 1e-9, Lorentzian to
3e-6, rectangle to 2e-4 — plus an odd signal transforming to something purely
imaginary, and Parseval agreeing to 1e-9 between energies computed independently
in the two domains.

The exponential's tolerance is looser for a reason worth recording. e^(−a\|t\|)
has a **corner at t = 0**, and a kink in the middle of the interval is not
something endpoint analysis can rescue: the rule falls back to plain second
order. Rather than loosening a number silently, the order is **measured** — halve
h and the error falls by 4.0 — while the smooth case beats 1e-12 at a sixteenth
of the sample count. The contrast is the lesson.

`ftTruncation` measures the signal's value at the window edge against its peak.
That ratio decides whether what is plotted is the transform or the rectangle's
own sinc tails, and `ftPairs` now prints it and says which case the reader is
in — the roadmap's requirement that the panels "say when leakage rather than
mathematics is what is being shown".

### Tier 2 accessors — what each one measures rather than quotes

- **`ftPairs`** plots \|X(f)\| rather than X(f) for a typed signal, because a
  signal that is not even has a phase and drawing only the real part would be a
  quietly wrong picture. Δt·Δf is measured from the computed curves and checked
  against the 1/4π floor; Parseval's gap is printed as the honest error bar.
- **`pbDist`** normalises a typed shape by quadrature and computes μ and σ² as
  ∫x·f and ∫(x−μ)²·f at 1e-11 — not formulas for a family the function may not
  belong to. It reports three failure modes instead of hiding them: a shape that
  cannot be normalised, one that goes negative (a function, not a density), and
  one whose second moment is still growing with the window, which is what a
  Cauchy tail looks like from the inside.
- **`cxMap` / `cxContourInt`** take u(x, y) and v(x, y) as two real boxes.
  Both partials are taken symbolically and the Cauchy–Riemann residual is
  measured across the window, so whether a reader's map is holomorphic is
  something they discover. Residues and contour integrals are left empty for a
  non-holomorphic f rather than computed, because those quantities do not exist
  for it.

---

# 2026-08-10 · Reader-supplied conditions, the last twelve Tier-2 stages

Roadmap A1 Tier 2 is complete. Each of these needed real numerics rather than a
picker retrofit, and each is checked against a case with a known answer.

## Quantum: scattering off a barrier the reader types — `qmScatter`, `qmGamow`

`qmBarrier` solves the rectangle exactly and nothing else. A typed V(x) is
scattered off by a **transfer matrix**: the structure is sliced into 4000 slabs,
each of which has an exact propagator, and the sweep runs backwards from a pure
outgoing wave at the far side. Backwards is not a detail — forwards launches a
growing exponential that swamps the decaying part within a few decay lengths.

Checked against the closed form on four rectangles (E/V0 from 0.36 to 1.7):
`T` and `R` agree to **1e-6** when the walls fall on grid points, and `T + R = 1`
to **1e-9**. Nothing in the transfer matrix imposes flux conservation, so that
sum is a measurement rather than an identity — it is printed in the panel as the
error bar on T. On a smooth barrier the **order was measured by halving**: the
error falls by 4.0 each time the grid doubles, i.e. second order, which is what
midpoint sampling of V should give.

The WKB estimate is computed by quadrature over the reader's own barrier and
printed beside the exact answer. For a thick rectangle the ratio has a closed-form
limit — WKB drops the wall-matching prefactor, so exact/WKB → 16(E/V₀)(1−E/V₀) —
and the test asserts the ratio **converges to 1/2.56** as the barrier thickens
rather than picking a tolerance. A thin barrier is nowhere near it, which is the
approximation being caught out.

## Quantum: a wave packet of any shape — `qmFreeShape`

The Gaussian is the one profile with a closed form. Any other shape is evolved
**spectrally** on the wing's own `ftFFT`: transform once, rotate each plane wave
by e^(−ik²t/2), transform back. Exact for all time and the norm cannot drift,
because a phase cannot change a modulus.

Handed the Gaussian it reproduces `qmPacketPsi` to **1e-11** in |ψ|² on the grid,
at t = 0, 1, 3 and 6, and the measured Δx matches σ₀√(1+(t/2σ₀²)²) to 1e-6.
Interpolation between samples was separately measured and is second order.
Δp is constant to **1e-14** — recomputed at each t, so it is a check rather than
a cached number — and Ehrenfest's ⟨x⟩ = x̄₀ + ⟨k⟩t holds to 1e-6, comparing a
quantity measured in x against one measured in k.

**A first design used a hand-rolled k-grid and was wrong.** Its spacing did not
divide the window, so the inverse transform aliased the packet into a copy of
itself half a window away and the round-trip norm came back as **1.94**. The FFT
removes the choice: dk = 2π/L and k_max = π/dx are the only pair for which the
sampled forward and inverse transforms are exact inverses. What that costs is
now stated rather than hidden — the world is periodic (`wrap` measures how much
probability has reached the edges) and momenta above π/dx cannot be held
(`alias` measures how much spectrum is piled against that ceiling).

## Fourier: aliasing measured rather than computed — `ftAliasEnergy`, `ftSincRecon`

`ftAlias` answers "where does this tone land?" by arithmetic, which only works
for one tone. For a typed signal the same question is settled by measurement:
transform at **sixteen times** the rate under test and add up the energy above
that rate's Nyquist frequency. Checked against tones where the answer is known
(0 and 1 exactly), against an equal-power pair either side (0.5), and against an
unequal pair to confirm it is an **energy** fraction — 0.25 amplitude gives
1/17 of the power, and it does.

The reconstruction drawn is Whittaker–Shannon from the samples alone, and the
same formula produces both answers: below Nyquist it lands on the original,
above it, on the alias. Exactness needs an infinite record, so what the tests
assert is a **rate** rather than a tolerance — sinc decays as 1/t, so doubling
the record halves the truncation error, and it is measured doing exactly that
(ratios 1.99, 1.99, 2.00). A first version carried a |d| > 60 cutoff for speed
that capped the achievable accuracy at 4e-3 and made the convergence test
meaningless; it saves nothing at the sizes used and was removed.

## Circuits: a netlist, and the layout that makes it safe — `ckParseNetlist`

The bench is geometric and recovers connectivity from where things touch, so a
netlist has to be **placed** before it can be solved. Node rails on multiples of
8, one part per row, bodies at x ≡ 3 (mod 8) so neither a body nor its pins can
land on a rail. A lead then crosses whatever rails lie between it and its node,
and crossing is not connection — exactly as on paper.

**A real bug, caught by the unit suite and invisible to any parser test.** Pin 0
belongs to the first node named, and when that node lay to the *right* the lead
had to double back — running straight over the part's other pin, which is a
connection. Every part whose nodes happened to be written right-to-left was
shorted. The fix is to rotate the part so each lead leaves its own pin outward.
A ten-resistor chain is now in the suite: every lead crosses several rails it
does not belong to, and 10 V across 10 kΩ must read **exactly 1 mA** — it read
1.111 mA while the bug was present, one resistor having vanished.

A second sign bug: the text emitter swapped the nodes of a rotated part, which
inverted every source that had been rotated. Caught by round-tripping a
hand-built board through the text form and comparing a current, not a picture.

## Optics: a lens the reader designs — `opSysMatrix`, `opTraceRay`, `opSpherical`

Two independent calculations on one prescription. The **paraxial** one multiplies
ray-transfer matrices; its focal length matches the thick-lensmaker closed form to
**1e-9** and differs from the thin one by 0.67 mm on a 4 mm singlet, which is the
thickness being accounted for. A flat plate returns exactly zero power, and a
plano-convex in the thin limit returns 100.00000 mm.

The **real** one traces finite rays through the spheres with Snell's law and no
approximation. As the ray height shrinks it must converge on the paraxial answer,
and the rate is the content: spherical aberration is quadratic in aperture, so
halving the height quarters the miss — measured at 4.0, 4.0. A paraxial ray lands
on the paraxial focus to 1e-6.

The payoff is measured, not asserted: a biconvex singlet at ±12 mm has **−4.07 mm**
of longitudinal spherical aberration; a cemented doublet of the same focal length
has **−0.049 mm**, eighty times better. Both numbers are traced.

One trap worth recording. The surface normal is a *line*, and φ and φ + π describe
it equally well — but only one gives the right angle of incidence, and the wrong
branch silently reflects the ray back up the axis instead of refracting it. The
branch is now chosen by requiring the ray to travel broadly along the normal,
which handles convex and concave surfaces without a sign test on R.

---

# 2026-08-10 · The depth pass (roadmap A2)

## The derivation ladders, measured — `auditderive.ps1`

AI-GUIDE says a ladder that only restates the algebra is not worth having, and
until now nothing checked whether that rule was kept across 178 stages. The new
script drives every stage, calls its `derive(st)`, and counts numbered steps,
`drvSay` rungs, prose length, and how much of each rung's prose is already in its
own heading.

**It found a live bug on its first run.** `ckLab`'s ladder referenced a bare `Δ`
identifier and threw `Δ is not defined` every time a reader opened "Where this
comes from" on the circuit bench. Neither `runtests` nor `runall` exercises
`derive()`, so it had been invisible.

Before: 710 rungs, 33 308 words, 28 ladders below threshold.
After: **782 rungs, 39 348 words, flagged = 0**, median 4 rungs and 203 words.

**The thresholds were wrong twice and that is worth recording.** The first run
flagged all 178 ladders, because the word counter dropped every word under four
letters and a 260-word explanation read as "120". The second run flagged eleven
ladders for having a rung under 30 words — and reading those eleven settled it:
"an antisymmetric 4×4 array has six independent entries, and electromagnetism has
exactly six field components" is twenty-six words and is the best sentence on that
stage. Brevity is not the defect the guide warns about. The threshold now sits
where a rung is too short to contain a claim at all, and the restatement test
(ECHO) is what measures the actual rule.

Known limit: the script sees only the ladder a stage builds in its **default**
state. `igFTC` has two parts differing by ninety words and only one was ever
measured, which is how its thin half went unnoticed. Recorded in the script.

## The prose-gap inventory — `auditprose.ps1`

The roadmap asked for an inventory and an inventory is what this is: it scans the
`audittext` harvest for phrases where an essay declines to justify something, and
for named results the prose leans on with no statement card behind them.

- **HANDWAVE — 0.** No essay anywhere says "it can be shown", "beyond the scope",
  "without proof", "left to the reader" or any of the other seventeen phrases.
- **BARE — 2**, both legitimate English rather than mathematical hand-waving
  ("fluctuations are percent-level and clearly visible"; "stated as plainly as its
  content"). Read individually, not dismissed by count.
- **ELSEWHERE — 10.** A named result invoked in one wing whose card lives in
  another. Cross-references, not gaps.
- **NAKED — 27.** A named result with no card anywhere in the site.

Cards written for the six most load-bearing: **Tellegen's theorem** (with the
proof that uses only the graph, no constitutive laws), **Poynting's theorem**,
**Faraday's law** (with the moving-circuit caveat the differential form hides),
**Fubini's theorem** (with the counterexample that shows why absolute
integrability is the hypothesis), **Cramer's rule** (with the O(n⁴) reason nobody
computes with it), and the **Born rule** (stated as the postulate it is).

---

# 2026-08-10 · Two rendering bugs, reported from screenshots

**`pcMotion` painted every frame on top of the last.** Its `mode` was a function
returning `'2d'` only for the Kepler scene, so the flat *projectile* scene was
declared 3d — and in 3d mode the core does not clear the canvas, because clearing
is `em3dBegin`'s job and a 3d stage is expected to call it. `frameProj` draws in
2d and never calls it, so arrows accumulated into a solid fan and the previous
scene's caption sat under the new one. Now only the genuinely 3d scene is listed,
so adding another flat scene cannot reintroduce it. A second, smaller fault in the
same picture: at the apex a_T vanishes and a_N *is* gravity, so the two arrows
coincide exactly and their labels overlapped into nonsense. That coincidence is
the point of the stage, so it is now said rather than nudged apart.

**`laSystem` drew its matrix under the readout chip.** The chip floats over the
canvas's top-left ~180×90 px — the trap documented in `src/js/CLAUDE.md` — and at
y0 = 70 it covered the heading and the first column of every matrix. Moved below
it. A sweep for the same pattern found one more, `smIsing`, whose lattice caption
was also underneath; both fixed, with the height budget adjusted so the bottom
margin is unchanged.

---

# 2026-08-10 · A1 Tier 3 begins — a body the reader assembles (`rtInertia`)

The rule for this tier is that a property a preset *declares* must be **measured**
for a reader's own scenario. `RT_BODIES` already meets a version of it: every
shape carries its closed form and an integration, and the panel prints the gap.
An assembled body has no closed form to print a gap against, so the standard is
met by finding the theorem the presets are allowed to assume and testing that
instead.

`rtBodyProps` computes I about any axis **twice**:

- **direct** — `rtPieceI` integrates ((x−a)² + (y−b)²) dm over each piece's own
  extent with the axis wherever it is. Rods by adaptive quadrature, rings by a
  θ-integral, discs by `nqDoublePolar`, plates by `nqDoubleRect`. This is the
  definition of I and contains no theorem.
- **theorem** — each piece's own closed form, shifted to the body's centre of
  mass by I_cm + md², summed, then shifted out to the axis by the same rule.
  This integrates nothing.

Nothing links them, so their agreement is the parallel-axis theorem verified on
an arbitrary body. On the four-piece default it agrees to **0 relative**.

Checked in 25 new tests: every piece's quadrature recovers the closed form the
preset table quotes (disc MR²/2, ring MR², rod ML²/12, plate Ma²/6, and a rod
about its **end** giving ML²/3 by moving the axis in the integral rather than by
a shift); the two routes agree at four different axes including one far outside
the body; the centre of mass is the weighted average; I is strictly minimised at
the centre of mass, checked rather than asserted; and I = Mk² defines the radius
of gyration. The parser is checked to reject an unknown piece, a missing size, a
negative mass, a zero radius and non-numeric coordinates.

**One trap, and it cost a crash.** `nqDoublePolar` hands its integrand
**Cartesian** offsets and has already folded in the r of r dr dθ — the lambda
takes (u, v), not (r, θ). And its order argument indexes `NQ_GL`, which stops at
5; asking for 6 returns undefined and throws on the first node. Both were in the
first draft of `rtPieceI`.

---

# 2026-08-10 (later) · A class of silently invisible labels, and three more bugs

## `ctText` called with its arguments reversed — 24 labels drawing nothing

`ctText(ctx, x, y, text, colour, font)` takes its coordinates first. Twenty-four
calls across `79h-stages-nuclear.js`, `79i-stages-solidstate.js`,
`79j-stages-statmech.js` and `79ja-stages-statmech-gases.js` passed the **text**
first. The string then lands in the x slot, the canvas is handed a non-numeric
coordinate, and the label simply never appears — no exception, no `NaN`, nothing
for `runall` or `auditscan` to grep for. The three speed markers on `smSpeed`
("most probable", "average", "rms"), the band labels on `slBand`, "classically
forbidden" on `ncBarrier`, the N = Z line on `ncBind` and eighteen others had
been invisible.

Two further faults travelled with them. The sixth argument is a **font string**,
not a size — every one of these passed `11` or `12`, which sets `ctx.font` to an
invalid value that the browser ignores, so even had they rendered they would have
inherited whatever font was last set. And all of them were in the same four files,
which is what a batch written to a misremembered signature looks like.

`smoke.ps1` now greps the source for the pattern on every build. A static check is
the only thing that can catch this: there is no runtime symptom to observe.

## `.readout-chip` is a flex column, and eleven chips tore apart in it

Every element child of a flex container becomes its own row. Eleven chips in the
same four files returned bare text with a `<br>` in it, so the moment `supify()`
turned `v_rms` into `v<sub>rms</sub>` the chip rendered as three stacked lines
reading "v", "rms", "= 517 m/s". Fixed at source by wrapping each line in a
`<div>`, and `updateStageChip` now wraps an unwrapped chip defensively so the
next one written cannot reintroduce it.

## A legend describing a different picture

`pcMotion` has three scenes and returned one fixed legend, so the Kepler picture
— wedges, a radius vector and an orbit — was captioned "a_T, the speeding-up
part / a_N, the turning part". `updateStageLegend` now passes `ST` to
`legend(st)`, which every existing legend ignores, and the stage keys its key on
the scene showing.

---

# 2026-08-10 · A1 Tier 3, second editor — a reaction the reader writes (`ncBind`)

The roadmap's own example for this tier: *"A preset reaction declares its
Q-value; a typed one has to have it summed from masses."*

`ncParseReaction` reads `U235 + n -> Ba141 + Kr92 + 3n`, and `ncReactionQ` sums
Q from masses that are themselves **built** rather than stored:
M = Z·m_H + (A−Z)·m_n − B, with B measured (AME2020) where the nuclide is in
`NC_NUCLIDES` and predicted by the liquid-drop model otherwise. Which of the two
was used is returned per nuclide and reported, because a Q assembled from model
masses is worth far less than one assembled from measured ones.

Two things are then checked that a printed reaction never has to justify:
**whether it balances** in Z and A, and **where each mass came from**. Drop the
three neutrons from the fission line and the panel reports A short by exactly 3
and says the Q means nothing until it is fixed.

Verified in 31 tests. The three atomic masses come back at their accepted values
to 3e-3 MeV. D–T fusion — every nuclide measured — gives **17.59 MeV**, and the
same reaction written five different ways (`d + t`, `H2 + H3`, `2H + 3H`,
`alpha`, `He-4`) gives the identical number. Fission balances and lands between
150 and 250 MeV with its modelled masses flagged. Alpha decay comes out
exothermic, as it must for it to happen at all.

**One real ambiguity in the format, resolved rather than special-cased.** A
leading integer is a count in `3n` and a mass number in `4He`. The rule: strip it
as a multiplier only if what remains is still a complete species on its own. `n`
is, so `3n` is three neutrons; `He` is not, so `4He` is helium-4. `3He4` is three
helium-4 and `3He` is helium-3 — both the conventional readings, from one rule.

`³H` and `³He` were added to `NC_NUCLIDES` (AME2020 B/A of 2.82727 and 2.57268)
so the commonest fusion reactions are assembled from measured binding energies
rather than from a five-parameter fit that has no business being applied to three
nucleons.

---

# 2026-08-10 · A1 Tier 3, third editor — a landscape the reader shapes (`dyEnergy`)

`dyTrackRun` was already written to take h(x) as a *function* and never ask where
it came from, so a typed landscape needed nothing but an expression box. That is
worth recording as the cheapest editor in the tier and the reason why: an
integrator that accepts a function rather than a shape name is open by
construction.

The measured claim is the one the presets get for free. The ledger card used to
say *"can it exceed the start? no — that would need energy it does not have"*,
which is an assertion about three curves whose author knew the answer. It now
computes **how far above the release height the object actually gets** and prints
the number, so on a landscape nobody chose the statement is a measurement.

**The drift is reported rather than hidden, and it is not small.** `dyTrackRun`
takes fixed steps and reads the slope by finite difference, so a corrugated track
costs accuracy: on `0.3·sin(3x)` the energy total drifts by about 0.37 J in 16 J,
a little over 2%. The panel has always printed that row; the demo prose now says
what it means instead of implying the conservation is exact. A first draft of that
prose claimed the overshoot was "millimetres of integrator drift, never physics",
which the screenshot did not support — corrected before it shipped.

---

# 2026-08-10 · A1 Tier 3, fourth editor — a lattice the reader designs (`slBand`)

Kronig–Penney has a closed form because a delta well is the one cell whose
matching conditions can be written down, and that makes its lesson easy to
mistake for a fact about delta wells. It is not: **periodicity alone opens the
gaps**, whatever is inside the cell, and only a cell nobody chose can show it.

`slCellM` propagates ψ across one period using the same slab propagator as
`qmScatter` and returns the 2×2 matrix. Bloch's theorem gives the band condition
as cos(ka) = ½ Tr M, so `slBandsV` scans for |½ Tr M| ≤ 1. **det M = 1 is the
Wronskian and nothing in the product imposes it**, so it comes back free as an
error bar on every band edge — 6.5e-13 on the default cell, and it is printed.

Checked against the closed form from the other direction. A rectangle of fixed
*area* becomes a delta as it narrows, so the discriminant must approach
`slKronigPenney` — and the test asserts the **rate**, not a tolerance: narrowing
the barrier by four reduces the error by four, first order in the width, at four
separate energies. An empty cell reproduces cos(√E) exactly and opens no gaps at
all. A smooth cell, which has no closed form anywhere, still opens gaps, and a
deeper one narrows the lowest band.

**Two mistakes worth recording.** The delta strength: a delta V = g·δ(x) makes ψ′
jump by g·ψ, so ½Tr(D·F) = cos q + (g/2)·sin q/q and Kronig–Penney's P means
g = **+2P** — a barrier, not a well. A first run used −2P and the errors did not
shrink as the rectangle narrowed, which is exactly what approaching the wrong
limit looks like. And `slBandsV`'s cell resolution had to become a parameter:
a spike thinner than one slab is simply not seen by midpoint sampling, and the
band edges then come out wrong with no other symptom.

`TH.bg2` does not exist — the palette read by `readTheme()` is bg, line, line2,
text, dim, faint, accent, mid and the five signal colours. Using it threw inside
`frame`, which `runapp` catches but `smoke` does not.

---

# 2026-08-10 · A1 Tier 3, fifth editor — a pipe the reader shapes (`flFlow`)

A two-section Venturi has two sections because two is the fewest that shows the
effect, and it lets both laws be checked at a pair of points somebody chose. Give
the pipe a profile A(x) and there are no chosen points left.

Continuity fixes the speed outright, v(x) = Q/A(x). The pressure is computed
**twice by routes that share nothing**:

- **Bernoulli** — P + ½ρv² + ρgh evaluated as a constant at each x.
- **Euler** — dP/dx = −ρv·dv/dx − ρg·dh/dx integrated forward from the inlet by
  RK4, never touching the constant.

Bernoulli is precisely the first integral of Euler, so the two must agree, and
nothing in the code arranges it. The gap is printed as the theorem being verified
on the reader's own pipe. Sharpen the throat and the gap grows — the integrator
meeting a derivative it cannot resolve — and the panel says that is arithmetic
rather than physics.

Checked in tests: the two routes agree to 1e-6 relative on a shaped pipe; A·v is
constant along it; the narrowest section really is both the fastest and the
lowest-pressure point; a uniform pipe has constant pressure at every one of 200
sample points; and a pipe that only rises loses exactly ρgh with no area change.

**The failure a preset never meets.** Squeeze the throat hard enough and the
computed pressure falls below the vapour pressure of water, at which point it
boils — cavitation, which erodes propellers and pump impellers. `flPipeRun`
returns `cavitates` and the panel reports it rather than drawing a pressure no
liquid could hold. A gentle throat is checked not to trigger it.

`-((x-1.5)/0.4) ** 2` is a **syntax error** in JavaScript — a unary minus may not
sit directly before `**`. It took the whole unit suite down with a HARD ERROR
rather than a failing assertion, which is worth knowing as a symptom.

---

# 2026-08-10 · A1 Tier 3, sixth editor — an aperture the reader cuts (`opWave`)

The single slit's sinc², the double slit's fringes under that envelope and the
grating's sharp orders are usually met as three separate results. They are one:
**the far-field amplitude is the Fourier transform of the aperture**, and each
closed form exists only because somebody did that integral for one shape.

`opDiffract` evaluates ∫A(x)e^(−ikx sinθ)dx directly for any A, and knows nothing
about which shape it has been handed — so handing it the shapes that *do* have
closed forms is the test:

- a rectangle of width a reproduces `opSingleSlit`'s sinc² to 5e-3 at four
  separate positions, and **vanishes** at every m·λ/a minimum;
- two slits give a bright fringe at each order of λL/d and a dark one halfway;
- with d = 5w the **fifth order is missing**, because the interference maximum
  lands exactly on the envelope's first zero — the classic check that the two
  effects multiply rather than being drawn one on top of the other;
- a wider slit diffracts *less*, which is the uncertainty relation in the form
  optics met it first.

**A "failure" that was the physics being right.** A first draft asserted that
every interference order should be brighter than half the central peak. Order 3
came back at 0.4378 — and 0.4378 is precisely sinc²(3π/6.25), the single-slit
envelope at that angle. A fringe is not as bright as the centre; it is as bright
as the envelope allows, and that product *is* the two-slit pattern. The test now
compares each order against `opSingleSlit` at its own angle, which checks the
multiplication rather than a threshold.

The panel measures the first minimum of the reader's pattern and prints beside it
what λL/a would predict from the same total open width. For one rectangle they
agree; for anything else they do not, and the disagreement is a formula being
used outside the shape it was derived for.

---

# 2026-08-10 - A1 Tier 3, editors seven to eleven

Five more scenario editors, closing three wings: fluids, thermodynamics and
waves. Each computes one quantity by two routes with nothing in common and
prints the gap, per the rule for this tier.

## 7. A body the reader shapes (flStatic)

A textbook cube gets away with differencing two faces because a cube's sides are
vertical and cancel in pairs. Give the body a radius r(z) and nothing cancels, so
the buoyant force is assembled from the definition:

    F_z = -integral P n_z dA = pi * integral P s' dz + pi s(0)P(0) - pi s(H)P(H)

with s = r^2. **No volume appears in that expression.** It is compared against
rho g V_sub, which contains no pressure. The two agree to 2e-10 N on the default
bowl. Integrating by parts turns one into the other, and that IS Archimedes'
principle - the ladder does it symbolically while the panel does it numerically.

Measured, not asserted:
- the two routes, gap printed;
- **the atmosphere makes no difference**: the same integral run again with
  101 kPa added at every point of the surface moves the force by < 1e-4 N,
  because a uniform pressure exerts no net force on a closed surface;
- the waterline is found by BISECTING THE SURFACE INTEGRAL against the weight,
  never by the density ratio - so V_sub/V coming out equal to rho_obj/rho_fluid
  is a result. The fraction of the HEIGHT is a different number for anything
  that is not a prism: a cone at half the density of water sits 0.7937 of its
  height under, which is exactly 0.5^(1/3);
- stability: GM = KB + I_waterplane/V_sub - KG. **A homogeneous sphere puts its
  metacentre exactly at its centre of mass at every density**, so GM = 0 and it
  is neutral - which is right, since a sphere presents the same shape whichever
  way it is turned, and nothing in the code knows that. Pinned at four densities.
- convergence measured by halving the difference step: second order, 4.0x per
  halving on r = z^1.5, which is the first profile whose third derivative does
  not vanish and so the first that does not make the central difference exact by
  accident.

**Quadrature choice, and why it is not laziness.** flBodyForce runs inside a
bisection, so its cost has to be bounded; and an absolute tolerance meaningful
for an integrand of order 1e4 drives adaptive Simpson to its depth limit on
every call. The first version did exactly that and the unit suite went from 5
seconds to over five minutes. It now uses fixed-panel Gauss-Legendre, which is
also a *different rule* from the adaptive one the volume route uses - the two
answers should not share an error.

## 8-9. A cycle the reader writes down, and a path they draw (tmEngine, tmGas)

The energy-ledger engine assumes what it explains: hand it Q_h and Q_c and it
returns W and eta, but there is no cycle in it. `tmParseCycle` takes a sheet -
`gas`, `moles`, `start V T`, then one process per line - and `tmRunCycle`
integrates it in sub-steps, applying the first law at each one rather than once
at the end.

The net work comes out **four ways that share no code**: summed as P dV over the
sub-steps, added from the four closed forms, taken as the shoelace area of the
loop on the P-V plane, and taken again as the area on the **T-S** plane, where a
Carnot cycle is a rectangle. The last is a net *heat* and equals the work only
because the loop closes.

Measured, not asserted:
- **entropy is a state function**: the loop integral of dQ/T for the gas is
  accumulated over the sub-steps and comes out zero. Nothing sets it to zero.
- **Clausius**: the loop integral of dQ/T at the *reservoirs* is <= 0, with
  equality iff every step is reversible. Append `from 900` to a step and the
  work does not change by a joule while 4.49 J/K of entropy appears.
- **The Carnot pin.** A cycle of two isotherms and two adiabats - with the
  volumes fixed by the adiabats, V2/V1 = V3/V0 = (Th/Tc)^(1/(gamma-1)) - reaches
  eta = 1 - Tc/Th exactly, and equals the bound its own reservoirs allow.

**The default separates two things readers run together.** The Stirling cycle is
*perfectly reversible* and still reaches only 24.02% against a bound of 50%. It
creates no entropy whatever and falls short anyway, because its constant-volume
leg takes heat in across a range of temperatures while the bound assumes every
joule arrives at the top of it. Efficiency shortfall and entropy generation are
different faults. The Carnot bound is therefore computed from the **reservoir**
temperatures actually used - the hottest source and coldest sink - not from the
gas's excursion, with adiabatic steps excluded by a tolerance because their
sub-step dQ is O(h^2) rather than exactly zero and its sign wanders.

`tmGas` takes a typed P(V). Whether it is one of the four named processes is
**measured** from the spread of T and of PV^gamma along it, never declared: type
`124.717*(20/x)^(5/3)` and the panel discovers PV^gamma is constant and that Q
comes out at 1e-13 J. Four routes between the same two end states then give
visibly different W, heats differing by exactly as much, and identical dU - and
the panel says plainly that for an ideal gas U = nC_vT *by definition*, so the
last of those is arithmetic and not evidence. Units are kPa and litres because
kPa.L = J exactly and PV/(nR) in those units is already kelvin: no conversion
factor appears anywhere, so nothing can hide in one.

## 10-11. A force law and a pluck (wvSHM, wvWave)

`wvSHM`'s third option was a demo promising "fit U'' and predict the period" over
a stage that behaved identically to the spring preset. It now does what it said.

**Simple harmonic motion is called simple because its period does not depend on
its amplitude.** That is a property of the force being exactly proportional to
displacement, not of oscillating, and it stays invisible until you type a force
for which it fails. The period is obtained twice: an energy integral
T = 2 integral dx/sqrt(2(E-U)/m) with no clock in it, and an RK4 integration
timing the returns of v to zero with no energy in it. Beside them sits
2 pi sqrt(m/k), which is a *prediction*. Then the amplitude is swept and T is
plotted against it: flat is isochrony.

Pinned against three closed forms and one existing engine:
- linear F gives 2 pi sqrt(m/k) at every amplitude, and isoSpread < 1e-8;
- the quartic oscillator gives 4 sqrt(2m/c) B / A with B = 1.3110287771460599,
  half the lemniscate constant. **A first draft used 1.3112339 from memory and
  the test failed by 1.6e-4 - the code was right and the constant was not**;
- **a typed pendulum, -9.80665*sin(x), reproduces `wvPendulumExact`'s
  elliptic-integral period to 1e-7 at four amplitudes** - two entirely separate
  routes to the same number, one of which has been in the suite for months.

**Two real bugs the tests caught.** The far turning point was located by
bisecting the whole search window; a pendulum's potential is *periodic*, so U - E
changes sign many times over any generous range and bisection converged to an
arbitrary one of them - at theta = 1.5 rad it returned a turning point two wells
away and a period twice too long. It now scans outward from the equilibrium and
brackets the first crossing. Separately, a release point beyond a barrier was
integrated as though it oscillated; it is now detected and reported.

**Measuring an order when the prefactor is erratic.** The period error is
(omega^2/3)tau^3 where tau is how far the last step overshoots the crossing, and
tau depends on where the step grid happens to land. One step size samples one
arbitrary phase, and comparing two of them measures luck: the first attempt
reported a ratio of 0.905 for a third-order method. Sweeping the steps-per-period
across exactly one unit walks tau through its whole range in even increments, and
the worst of that sweep is the prefactor - which is the thing that has an order.
It then comes out at 8x per halving, as the Newton step implies.

`wvWave` takes a typed initial shape. The coefficients are
b_n = (2/L) integral y(x,0) sin(n pi x/L) dx by quadrature, and the motion is
computed by the modal sum **and** by d'Alembert's half [F(x-vt) + F(x+vt)] with F
the odd 2L-periodic extension - which uses no coefficients, no series and no
frequencies. Their agreement is Fourier's theorem tested rather than quoted, and
it degrades measurably when modes are dropped. Parseval's shortfall is printed
beside it, and can only ever be a shortfall.

A pure third harmonic returns b3 = its amplitude and every other coefficient
below 1e-10. The string returns *exactly* to its starting shape after 2L/v, and
is its own mirror image halfway - both checked to 1e-12 - because every mode
frequency is a whole multiple of the first.

**Two convergence rates, and they are not the same.** A plucked corner needs only
2 modes for 99% of the *energy*, because the coefficients fall as 1/n^2 and their
squares as 1/n^4; but the *shape* is still 3.7% out with 12 modes, and all of the
residue sits at the kink. The panel had said "a corner needs every harmonic there
is" next to a readout announcing that two sufficed. Both statements were true of
different quantities and the prose now says which.

## A latent bug in ctGrid, found by walking into it

`ctGrid` derived one step from the **x** span and applied it to both axes. On an
aspect-true `ctBox` the two spans are equal by construction and it is harmless;
on an `mkPlot` whose axes carry different units it is not. A pressure axis
spanning 200 kPa gridded at the x axis's step of 0.5 asks for four hundred
thousand lines and as many formatted labels **per animation frame**. The stage
does not fail - it simply stops returning, and headless Chrome never exits
because virtual time cannot advance. Each axis now gets its own step. `flFlow`
had been paying this cost since it was written.

## Does it still render when the window is not the size it was written on?

Every script in the suite ran at one window size — 1680x1000 — so every layout
bug that needs a different aspect ratio to show itself was invisible to all of
them. Two new sweeps close that: `auditsize.ps1` drives all 178 stages through
eight canvas shapes (ultrawide 1900x320, laptop, small window, tall-and-narrow
620x820), and `auditviewport.ps1` launches Chrome at thirteen real window sizes
from 3840x2160 down to 768x1024 and checks the page around the canvas.

The first run found **161 findings across 27 stages**. What they had in common is
that none of them could fail loudly: a label drawn outside the canvas is drawn,
discarded and reported by nothing.

**The root causes were four shared helpers, not twenty-seven stages.**

- `mkPlot` took its box on trust. The house pattern is
  `mkPlot(80, 55, W - 170, H - 145, ...)` and there are 207 of them; below
  H = 145 that height goes **negative**, `Y()` inverts, and the stage draws
  itself upside down above the top edge. It now clamps into the canvas, so a
  cramped window gives a small plot rather than a broken one.
- `ctText`, `rlText`, `ctArrow`'s label and `R.label` all drew wherever they were
  told. They now pull the label back inside, sharing one `ctFitText`.
- `plotTicksX` drew ticks for values outside the axis — a grid line hard against
  the frame and a number printed past the edge. Those are now skipped.
- `plotFrame` and `ctFrame` put their captions outside the box they label, so a
  plot that fits perfectly could still put its own title off the canvas.

**Two genuine bugs, found by the same sweep.**

`ncBind` had the documented `ctText` argument-order trap — `ctText(ctx, N.s, x,
y, ...)`, text first — so the mass number went into the x slot and the labels on
the measured-nuclide dots had never once been drawn. The sixth argument was `12`
rather than a font string, the other half of the same trap. `smoke.ps1` greps for
this and did not match this form.

`laMatOps` sized its three boxes as `W/3 - 40` when three boxes, two 50px gaps
and a 60px margin need `(W - 160)/3`. The third box hung off the right edge by
exactly enough to lose its label, at every window size ever used.

**And one in the fix.** The first version of the clamp read the font size with
`parseFloat(ctx.font)`. Half the fonts here are written `'600 11px Inter'`, and
parseFloat returns the **weight**: 600. The clamp computed a baseline offset of
480 pixels and pushed labels off the bottom of the canvas — turning the fix into
a worse instance of the bug it was written to catch, on 19 stages at once. The
size is now taken with a regex. The audit reports the coordinate a stage *asked*
for, before the clamp, precisely so a clamp cannot hide what made it fire.

## The page, not the canvas

`auditviewport.ps1` found the whole document pinned at **1229px wide** between
900 and 1179 pixels of viewport — header, dock and all scrolling sideways.

The cause is a CSS grid default worth knowing: **`1fr` means `minmax(auto, 1fr)`,
and that `auto` minimum is min-content.** A grid track cannot shrink below the
widest thing inside it however much it is told to flex. The dock's control panels
have a min-content width around 1200px, and it propagated up through the stage
column into `.app` and then into the document. `minmax(0, 1fr)` on both axes
fixes it. The nowrap topbar contributed the same way and now lets the wing nav
shrink and scroll instead.

The sweep also caught `R.W` holding **1527 while the canvas element was 1229** —
a 24% horizontal squash of every picture in the laboratory, with nothing
reporting a problem. `R.resize()` is driven by a ResizeObserver and by explicit
calls, several deferred through `requestAnimationFrame`, and any of those can be
missed. `stageFrame` now reconciles R against the element before drawing.

Both sweeps end at **0 findings**: 178 stages x 8 canvas shapes, and 13 viewports.

## The guard that was watching for the wrong thing

`smoke.ps1` has greped for the `ctText` argument-order trap since twenty-four
labels went missing to it. It matched a **string literal in the x slot** — and
the binding-energy stage had `ctText(ctx, N.s, P.X(...), ...)`, a bare
identifier, which is syntactically indistinguishable from a coordinate. The
check passed on every build while the labels it exists to protect were not being
drawn.

The reliable discriminator is not the x slot. It is the **fourth argument**: in a
correct call it is the text, and in a shifted one it holds a plot coordinate or a
colour, neither of which any piece of text ever looks like. The check now splits
the argument list properly (respecting nesting and quotes), covers `rlText` as
well, and applies four rules — a colour or a `P.X(…)` in the text slot, a string
in a coordinate slot, and a bare number where the font string belongs.

It was verified by reintroducing the exact line that slipped through, in both the
numeric-font and the correct-font-string forms. Both are now caught. A guard that
has never been shown to fail is not a guard.

`smoke.ps1` also now asserts that all 178 stages define all eight of `enter`,
`controls`, `wire`, `frame`, `readout`, `chip`, `legend` and `derive`.

## Other things looked for, and not found

Worth recording because a clean result is also a result, and because these are
the checks worth repeating:

- **Duplicate top-level declarations.** One script scope, 216 modules, and the
  guide's first rule is that name collisions are silent. 1901 top-level
  `function`/`const`/`let`/`class` names, **zero duplicated** across all files.
- `parseFloat` on a font string anywhere else: none.
- Unary minus before `**` (a hard syntax error): none — the eight apparent hits
  are all binary subtraction inside parentheses.
- `TH.bg2`, which does not exist: none.
- Gauss–Legendre orders `NQ_GL` does not carry: none.
- **Bare `1fr` grid tracks: eight more found and fixed**, in the dock body, the
  stage panel at two breakpoints, the checkbox grid and the home cards. Each one
  is a track that cannot shrink below its content, which is the same latent
  overflow as the one that pinned the document at 1229px. `repeat(auto-fit,
  minmax(255px,1fr))` became `minmax(min(255px,100%),1fr)` for the same reason.

---

# Tier 3, the nuclear wing: a chain and a barrier the reader writes

Two scenario editors, both built to the rule that the reader's own scenario must
be the thing that tests what the presets are allowed to assume.

## `ncDecay` — a decay chain, typed  (`44aa-nuclear-chains.js`)

The stage's own chains come from the two-member Bateman formula written out by
hand, so "the daughter peaks where the activities balance", "an old chain has
equal activities everywhere" and "the populations sum to N₀" are all true by
construction of that formula. A typed chain has all of them computed.

**Checked, and what against.**

- **Bateman for m = 3 reproduces `ncChain`** to 1e-13 at five times and both
  half-life orderings. `ncChain` was here first and is independently tested, so
  this pins the general partial-fraction expansion against a closed form that
  owes it nothing.
- **The closed form against a stepped integration.** The exponential integrator
  advances each member by the exact solution of its own linear equation over the
  step. Measured order **2.00** by halving h at three step counts. The stable
  sink is integrated rather than bookkept, so ΣN is *not* identically 1 — the
  excess is the method's own truncation error and it falls as h² (measured:
  2.00, 2.00), reaching 1e-12 by 8000 steps. Recording that it is not exact is
  the point; a conservation law satisfied by construction tests nothing.
- **Stiffness.** The real thoron tail spans **1.28 × 10¹¹** in decay rate. At
  4000 steps h is 7 × 10⁷ times the fastest member's lifetime — where an explicit
  method is unstable outright — and the error is 2.2e-7, falling by 16× per
  quartering of h and reaching 8.6e-10 at 64000 steps. The fast member sits at
  its quasi-steady value λ_prev N_prev/λ to 1e-6, which is what "solved exactly
  across the step" bought.
- **φ₂ and φ₁−φ₂ across the branch at z = ½.** Checked against an independent
  40-term series, not against each other at nearby z: φ₂′ ≈ −0.13 there, so
  comparing φ₂(½−ε) with φ₂(½+ε) measures 0.13·2ε of the *function* and says
  nothing about the branch. That mistake cost two test runs. Also recorded: below
  the branch the closed form is the inaccurate route, by a factor of 30 at
  z = 0.02, which is why the series exists.
- **A daughter's maximum, located twice** — by maximising Nₖ and by solving
  λₖ₋₁Nₖ₋₁ = λₖNₖ. Agreement 1e-7 or better on a five-member chain, and pinned
  against `ncChainPeak` to 1e-7 at four half-life ratios. It cannot do better
  than about 1e-8: a maximum is flat, so its position is limited to the square
  root of machine precision however good the arithmetic.
- **Equilibrium as a product with a limit, not a rule.** Aₖ/A₁ → ∏λᵢ/(λᵢ−λ₁),
  measured at 25 mean lives of the slowest daughter. A head 3 × 10⁷ times
  longer-lived gives every ratio within 1e-4 of 1 (secular); a head only ten
  times longer-lived settles at exactly 10/9, measured to 1e-4 — transient, of
  which secular is the limit. A chain whose head outlives nothing is reported as
  having no equilibrium at all rather than clamped.
- **Cancellation, measured.** log₁₀(largest term ÷ sum) is under 2 digits for
  well-separated half-lives and over 6 for two within 10⁻⁷ of each other.
- **Eleven parse failures rejected**, each with its line number, including the
  two that are physics rather than syntax: nothing may follow a stable member,
  and two members may not have exactly equal half-lives (Bateman's partial
  fractions are 0/0 there).

## `ncBarrier` — a barrier, typed  (`44ab-nuclear-barrier.js`)

`ncGamow` evaluates the WKB integral as an antiderivative, which exists for the
bare Coulomb tail and nothing else. Both things it was standing in for are built:
the turning points are located by bisection on a geometric scan, and the integral
is done by quadrature over the actual V.

**Checked, and what against.**

- **The anchor.** The general machinery run on `ncCoulombVof` reproduces
  `ncGamow` at nine (Z, E) combinations: worst relative error in G **< 1e-10**,
  and the located outer turning point matches b = 2Zαħc/E to 1e-9 relative. One
  route is a sum over sample points, the other an antiderivative in arccos√x, and
  they share no line of code.
- **Why the substitution is not optional.** A bare endpoint √ defeats
  Gauss–Legendre: measured order **1.50** by halving, error 1e-5 at 200 panels.
  The same integral under r = b − u² comes out below 1e-13. Both measured here,
  so the claim in the ladder is a result rather than a citation.
- **The self-reported quadrature error is honest** — smaller than 1e-6 G, and not
  under-reporting the true error against the closed form by more than 10⁴.
- **End to end in the log domain.** A 900/r barrier against a 1 MeV α gives
  log₁₀T½ ≈ +446 while e^(−2G) has already underflowed to exactly zero. That case
  is why nothing is carried as T.
- **Geiger–Nuttall, fitted rather than quoted.** Nine measured emitters, 24
  orders of magnitude in half-life. The Coulomb barrier through the general
  machinery reproduces `ncGamowHalfLife` emitter by emitter to 1e-9 dex; the
  fitted slope is **1.5113** against the measured **1.506** and the analytic
  leading order **1.7193**. The fitted slope sits *below* the leading order by
  12%, which is the −√(x(1−x)) term — the finite nuclear radius — that the
  expansion drops. Asserting agreement to 12% would have hidden a real physical
  correction; the test now pins the sign and the size.
- **The well depth moves the intercept and not the slope** — to a part in a
  thousand, not exactly. It enters the attempt rate, which depends on E + V₀ and
  so varies slightly across the nine Q values, tilting the line by 3.8e-4
  relative. The panel and the ladder now say "less than a part in a thousand"
  because that is what was measured; both originally said "not at all".
- **Cases with no answer, reported as such**: a wall that never returns below E
  (no outer turning point, all nine emitters dropped, `worst` returned as `null`
  and the mean as NaN so the readout must say "none of them"); a potential
  everywhere below E (no tunnelling, transmission exactly 1); a double-humped
  barrier (detected, counted, and only the first hump integrated, with the reader
  told they have written a different physical problem).

**One engine default changed.** `ncBarrierG`'s search window was
`max(400, 30R)` fm, which covers every real α emitter and reports "this never
comes back down" about a typed 900/r barrier that plainly does. It is now
`max(2000, 150R)`. The scan is geometric, so a wider window costs no resolution,
and widening can only find turning points that were outside the old window — it
can never move one that was already found.

**Verification.** `smoke` OK · `runtests` **3357 passed, 0 failed** (+184) ·
`auditcustom` **bad=0** (77 stages, 107 boxes) · `auditderive` **flagged=0** ·
`auditscan` **0 HIGH** · `auditsize` **findings=0** · `auditviewport` **bad=0** ·
`runall` **caught=0 OK**, 569 demos.

**Two things that bit, worth recording.**

- The barrier view's left plot is centred under the readout chip, which floats
  over the top-left ~180×90 px, and its title was clipped. The own view now
  starts 30 px lower than the preset one. No script sees a clipped title; only
  looking at the screenshot does.
- `runapp.ps1`'s screenshot pass hung indefinitely twice, on two different
  stages, and killing Chrome and retrying fixed one of them. The screenshot run
  uses `--run-all-compositor-stages-before-draw` on the shared `cprof` profile;
  taking the same shot with a fresh `--user-data-dir` and without that flag
  completed in seconds. It is a harness flake, not a slow stage — the DOM pass
  reported `no-errors` and 38 fps both times.

---

# Integrals: every region type typeable, and integrands in any coordinates

Two omissions in the integral wings, both the same shape: the reader could
*choose* a description but not *write* one.

## What was missing

- **The typed region was polar only.** Every preset carries a Type I
  description, a Type II description and sometimes a polar one, and `igRegion`
  makes a great deal of the difference between them — but a region the reader
  wrote could only ever be r(θ), which is the one case where the distinction
  does not arise. The comment in `59b` justified this on the grounds that "a
  reader who supplies one description has no reason to know the other", which is
  wrong twice: one description is enough to integrate over, and supplying both
  is exactly what makes Fubini testable.
- **The typed integrand was Cartesian only.** A stage whose entire argument is
  that polar coordinates turn a square root into a constant would not let the
  reader write the integrand in polar coordinates.
- **The typed solid was z-simple only.** That description can only reach a solid
  whose shadow is a Type I region. The ice-cream cone has none, which is why the
  preset carried a hand-written spherical block the reader could read and not
  edit.

## Coordinates: one rewrite, no modes  (`igCoordSrc`, `25a-integrate-typed.js`)

Names are rewritten to Cartesian before parsing:

| written | means |
|---|---|
| `r` | √(x²+y²), the cylindrical/polar radius |
| `rho` | √(x²+y²+z²), the spherical radius |
| `theta` | atan2(y, x) |
| `phi` | atan2(√(x²+y²), z) |

**A trap, recorded because it is permanent.** The maths engine's own macros are
the OPPOSITE WAY ROUND — `r` expands to √(x²+y²+z²) and `rho` to √(x²+y²) —
while Stewart, Thomas and Anton all use r for the cylindrical radius and ρ for
the spherical one. Inside the integral wings the textbook convention wins and
the rewrite overrides the macros; elsewhere the field engine's meaning stands.
`IG_COORD_HELP` says so under every box, and the readout echoes back which
system was detected. Tested both ways round: `cf('r')(3,4,12)` is 5 while
`compile(parse('r'))(3,4,12)` is 13.

Because everything becomes Cartesian, **the coordinate systems are not modes**:
`x^2+y^2`, `r^2` and `rho^2*sin(phi)^2` are three spellings of one function and
may be mixed in one expression. Nothing downstream needs to know which was used
— checked by integrating both spellings over the same disc and differencing
(1e-12), and by integrating `rho^3` over the unit ball written spherically.

## Regions: four kinds, and Fubini measured

`igTypeIRegion`, `igTypeIIRegion` and `igPolarRegion` all return the shape the
preset table uses, so `igRegionIntegral` and every consuming stage needed no
change. A fourth kind, **both**, takes all four limits and differences the two
iterated integrals.

**That difference is the point, and its size is not the test.** Fubini says the
two orders agree; the arithmetic says they *nearly* agree. `igFubiniConverge`
refines at 8, 16, 32 and 64 panels: a gap that falls is quadrature, a gap that
sits still is a region described wrongly. On y between x² and 2x the Type II
route carries x = √y, whose derivative is unbounded at the origin, and the gap
starts at 9.6 × 10⁻⁵ rather than at machine precision — measured, and reported
as such rather than hidden.

**The same conditioning is the wing's own argument, as a number.** ∫∫(x²+y²)
over the quarter disc: the polar route gives 2π to 1e-13, and both Cartesian
routes carry the √(4−x²) rim and land 2.7 × 10⁻⁴ away. "In Cartesian coordinates
one limit is a square root; in polar both are constants" turns out to be about
accuracy and not only about tidiness. Same story for the cylinder: cylindrical
gives 9π/2 to 1e-8, Cartesian is 6.8 × 10⁻⁴ out.

## Solids: cylindrical and spherical, typed

`igCylSolid` and `igSphSolid` produce the `cyl`/`sph` blocks `igTriple` already
consumed for its presets. Volumes pinned against closed forms: cylinder 2π,
sphere 32π/3, ice-cream cone (2π/3)ρ³(1−cos φ₀), ∭ρ²dV = 4πρ⁵/5.

## Three bugs found, each by a different check

- **The `both` region integrated over the wrong interval.** `x0 x1 y0 y1` are
  the OUTER LIMITS of the iterated integral, not a bounding box, and taking the
  union of the two padded boxes reported an area of 1.4596 for a region whose
  area is 4/3. Padding is now the stage's job, and the invariant is pinned by
  test: the limits come back exactly as given. Found by reading the screenshot.
- **`igInRegion` assumed every non-polar region has a Type I description** —
  true of every preset, false of the first typed Type II region, where
  `Rg.yLo(x)` on a null threw. **Fourteen errors in `runall`, and nothing else
  in the suite saw it**: `runtests` does not reach the stage layer, and
  `auditcustom` never clicks the kind picker because it carries no `custom`
  value and no "your own" label. Now tested directly on all three kinds.
- **The spherical bounding box was ±ρ_max on every axis.** An ice-cream cone
  lives in z ∈ [0,2] with |x|,|y| ≤ √2, so the box was four times too big: the
  drawn cross-sections were mostly empty and the Monte Carlo estimate threw most
  of its darts at nothing. Measuring the box off the boundary surface, and
  replacing the `seed * 1103515245 & 0x7fffffff` LCG (whose product exceeds 2⁵³
  and loses its low bits) with `igRandStream`, moved the estimate from 4.6913 to
  **4.9047 against the exact 4.907473** — a seventy-fold improvement.

## One pre-existing flake fixed

`slit sampler symmetric about 0` drew 3000 samples from an unseeded
`Math.random` and compared the mean against a fixed 0.2 — about three standard
errors, so roughly one run in a few hundred failed. It failed one here at
−0.2123. The tolerance is now computed from the sample's own spread (four
standard errors over 6000 draws), which is both a 1-in-16000 flake and the
right test, since it scales with whatever the sampler does.

**Verification.** `smoke` OK · `runtests` **3605 passed, 0 failed** (+79 for the
new engine) · `auditcustom` **bad=0** (79 stages, 109 boxes) · `auditderive`
**flagged=0** · `auditscan` **AUDIT OK** · `auditsize` **findings=0** ·
`auditviewport` **bad=0** · `runall` re-run after the `igInRegion` fix.

---

# Tier 3, the solid-state wing: a DOS, a spectrum and a material the reader writes

Three scenario editors, closing the wing. Each takes something the presets are
allowed to assume and makes the reader's own scenario the thing that tests it.

## `slFermi` — a density of states, typed  (`44ba-solidstate-dos.js`)

`slFermiEnergy` returns (ħ²/2m)(3π²n)^(2/3), and that closed form exists for
exactly one density of states. Everything the stage said about metals was a
property of √E wearing a physics hat.

- **The anchor.** Feeding the free-electron √E back through the general
  machinery reproduces `slFermiEnergy` for all eight metals, worst **< 1e-6**,
  and the Sommerfeld heat capacity reproduces `slElectronicC` to **< 1e-9** —
  neither of which was used to build any of it.
- **μ(T) is a different equation from E_F and has a different answer.** Solved
  by Newton on ∫g f dE = n; the shift matches the published
  −(π²/12)(kT)²/E_F to **2%** at 50, 150 and 300 K, and *leaves* it as the
  square of kT/E_F — measured at 8000, 16000 and 32000 K (0.0142 → 0.0569 →
  0.228, a clean factor of 4 per doubling).
- **The Sommerfeld expansion, tested rather than invoked.** C by dU/dT with μ
  re-solved at each step, against C = (π²/3)k²T g(E_F) which looks at g in one
  point. They agree to **< 1e-3** for a smooth band and disagree by **more than
  15%** once a Gaussian is put within a few kT of E_F — which is what a
  transition metal has and what the expansion assumes away.

**What bit.** The √E band edge. Simpson on the first cell is wrong by
0.0286·h^(3/2) — 4.7e-6 on a 3000-cell table, which was the entire error budget
downstream. More cells does not help (the error goes as h^(3/2)); grading the
cell geometrically into the edge only moved the constant to 1.8e-4, because the
outermost graded cells still straddle the singularity. The substitution
E = edge ± u², whose Jacobian cancels the √ exactly — the same trick as
`ncBarrierG`'s turning points — fixes it, and it has to be applied to a REGION
(`SL_DOS_EDGE` = 24 cells) rather than to one cell. Final accuracy **1e-11**.

## `slHeat` — a phonon spectrum, typed  (`44bb-solidstate-phonon.js`)

The T³ law is a fact about ω², not about solids. The exponent is now **fitted**:
log₁₀C against log₁₀T over a decade, least squares.

- **Three anchors.** A typed `w^2` reproduces `slDebyeC` to **< 1e-7**; a narrow
  spike reproduces `slEinsteinC` to **< 2e-4**, and narrowing the spike improves
  it (so the residual *is* the width, established rather than assumed); and at
  low T both reach the closed form (12π⁴/5)R(T/θ)³.
- **The exponent is the dimension.** w⁰ → 1, w¹ → 2, w² → 3.00, w³ → 4, each to
  ± 0.05.
- **The slope alone would be worthless, and the panel says so.** An Einstein
  spike yields a fitted slope like anything else; the worst residual and the
  *bend* — local slope at the top of the range minus at the bottom — are what
  distinguish a power law from an exponential. Debye: residual < 0.01 decades,
  bend −2e-15. Einstein: bend < −0.5, flagged "not a power law".
- **Dulong–Petit is NOT a test** — C → 3R follows from the normalisation. The
  *rate* is: C ≈ 3R[1 − ⟨w²⟩/12T²], with the second moment computed from the
  spectrum and separately read off the measured C(T), agreeing to **< 2%**.

**Something assumed and found false.** `slDebyeC` was expected to have drifted
from the closed form at T = θ/240 — 800 Simpson points over a range of 240 in x
is three per unit. It has not: the deviation is **exactly zero**. Euler–Maclaurin
— the integrand x⁴eˣ/(eˣ−1)² and every derivative vanish at both ends, so every
boundary correction vanishes and the composite rule converges faster than any
power of h. Recorded because the opposite was asserted in a test before it was
checked.

## `slSemi` — a material, typed  (`44bc-solidstate-semi.js`)

`slNi` and `slCarriers` are correct in a limit the stage never named. Three
assumptions, all now computed both ways.

- **N_c and N_v are computed** from the effective masses by 2(2πm*kT/h²)^(3/2)
  rather than tabulated. Every material in `SL_SEMI` round-trips exactly, and
  silicon's implied conduction DOS mass comes out at **1.08 m_e**, the published
  value. N_c ∝ T^(3/2) checked to 1e-12.
- **The Fermi level is bisected out of charge neutrality**, not assumed to make
  n ≈ N_d. Carriers from F_(1/2)(η) by quadrature, pinned against its
  alternating series to 1e-11 and against the Boltzmann limit e^η with its first
  correction −e^(2η)/2^(3/2) to 1e-4.
- **np = nᵢ² is a cancellation, so it inherits the Boltzmann limit.** Holds to
  1e-3 for lightly doped silicon; a light conduction mass with 5 × 10¹⁸ donors
  puts E_F inside the band and np falls **below half** nᵢ², with the Boltzmann
  formula over-counting the electrons by more than 3×.
- **Complete ionisation is not assumed.** 25 K silicon: under half the donors
  ionised. A deeper donor freezes out sooner, measured across 10, 45 and 200 meV.
- **V_bi from two solved Fermi levels** against kT·ln(N_dN_a/nᵢ²): under 1% for
  ordinary doping, and at degenerate doping both exceed the band gap (an Esaki
  diode, correctly) while disagreeing by more than 3% — with the solved value the
  **larger**, which is the direction that follows from F_(1/2)(η) < e^η. That
  sign was asserted backwards first and the test caught it.

**A modelling limit made visible rather than hidden.** A discrete two-level
donor de-ionises once E_F rises past E_d, so the model reports that a heavily
doped crystal has almost no carriers — which is the model failing, not the
physics. Writing `Ed 0` declares the level merged with the band, which is what
happens above the Mott density, and the panel says which regime it is in.

**Verification.** `smoke` OK · `runtests` **3605 passed, 0 failed** ·
`auditcustom` **bad=0** (80 stages, 110 boxes) · `auditderive` **flagged=0** ·
`auditscan` **AUDIT OK** · `auditsize` **findings=0** · `auditviewport`
**bad=0** · `runall` **caught=0 OK**, 575 demos.

**Wings now closed by Tier 3: fluids, thermodynamics, waves, nuclear, solid
state.**

---

# Tier 3, the rotation and mechanics batch (2026-08-12)

Nine stages, two engine modules — `32a-rotate-typed.js` and `31a-mech-typed.js`
— and the two wings closed. What follows is what was checked, against what, and
what bit.

## Rolling, solved rather than quoted  (`rtRoll`, `rtRollSolve`/`rtRollTrack`)

The presets quote **a = g sinθ/(1+c)**. A body assembled from pieces has no c to
look up, so the panel does the elimination instead: `Ma + f = Mg sinθ` and
`(I/R)a − Rf = 0` are two equations in the two unknowns, handed to `laSolve`.

- **Nothing in the solve contains a shape factor**, and it reproduces the closed
  form to 1e-12 for a disc, gives `a = g sinθ` and `f = 0` for I = 0, and its
  minimum coefficient agrees with the pre-existing `rtRolling` to 1e-12 — a pin
  against an engine that was already trusted.
- **v and ω are stepped as separate variables** from the solved friction, so
  `v = ωR` is never imposed. The largest slip over a 5.4 m run is **5e-14 m/s**,
  and the energy ledger ½Mv² + ½Iω² + Mgh stays flat to 1e-9 of the energy
  released — which is "static friction does no work", measured rather than
  asserted.
- **Mass and radius cancel:** a disc eleven times heavier and twice as wide ties
  with the original to 1e-9 s over the same ramp, and both times are physical
  (2.18 s, not two ways of being wrong).
- **The finishing order** out of five independent integrations matches the order
  obtained by sorting on c alone, with the heaviest and widest entrant tying and
  the lightest arriving last.

**What bit.** `rtRaceRun` rebuilt each row from the entry it was handed and
silently dropped the caller's `own` and `short` labels. The stage looked for its
entrant by `own`, found nothing, and reported a perfectly good body as *unable to
roll*. `runtests` cannot see stages and `runall` never selects the custom option:
**`auditcustom` was the only thing that caught it**, which is precisely the blind
spot it exists to close. The engine now carries those fields through and a test
asserts it does.

## A torque programme  (`rtTorque`, `rtSpinRun`/`rtSpinOrder`)

- **ω twice:** RK4 on I dω/dt = τ(t), against ω₀ + (1/I)∫τdt by adaptive
  quadrature. On τ = 3.1 sin(1.7t) the two agree to < 1e-9 and both match the
  closed form 1 − cos(ΩT) to 1e-9.
- **θ twice:** RK4, against the **Cauchy repeated-integral form** — swapping the
  order of ∫₀ᵀ∫₀ˢτ(u)du ds gives one quadrature with a (T − u) weight. Agrees to
  < 1e-8, sharing no code and no algebra with the stepper.
- **The order is measured**, not quoted: halving the step gives **4.0** on the
  oscillating torque. A constant torque returns NaN and the panel prints "no
  order to measure — RK4 is exact on this torque" rather than a number.
- A torque that reverses over a whole number of periods returns ω to within
  1e-9 of its start while θ has moved by more than 0.1 rad.

## A moment of inertia that varies  (`rtAngular`, `rtRedistribute`)

Two before-and-after numbers cannot fail to conserve anything — given I₁, ω₁ and
I₂ there is exactly one ω₂. So the conservation statement is **differentiated**
into `dω/dt = −(İ/I)ω` and handed to RK4, with İ from the symbolic
differentiator rather than finite differences.

- **L = I(t)ω(t) is an output.** Its drift over the run is < 1e-10, and the
  algebraic route ω = L₀/I(t), which the stepper never saw, agrees everywhere to
  < 1e-9. I₀e^(−kt) reproduces ω₀e^(kt) to 1e-9.
- **The work** ∫−½İω²dt matches ΔK to 1e-7 of ΔK, in both directions: pulling in
  raises the energy and does positive work, spreading out lowers it and does
  negative work.
- The order measures **4.0**, and the central-difference fallback reaches the
  same ω(T) as the exact derivative to 1e-6 — checked, because a reader typing a
  formula must not get different physics from a test supplying a derivative.

## Two bodies coupled  (`rtEnergy`, `rtCoupleRun`/`rtCoupleSweep`)

The textbook solves this in one line and hides the interesting claim, which is
that **the energy lost does not depend on how hard the clutch grips**.

- The coupling is integrated: equal and opposite friction torques until the
  speeds meet, the locking instant located by inverse interpolation inside the
  crossing step (matching its closed form to 1e-12).
- **The heat** ∫τ|ω₁−ω₂|dt matches **½·(I₁I₂/(I₁+I₂))·(Δω)²** to 1e-9 — the
  rotational twin of ½μ(Δu)², out of which τ has cancelled.
- **Swept, not sampled:** over τ from 0.4 to 81 N·m the heat's relative spread is
  **< 1e-12** while the slipping time varies by **more than 190×**. Two samples
  would have proved nothing about an invariance.
- With one body at rest the fraction lost is I₂/(I₁+I₂) to 1e-12, and coupling
  two bodies already at the same speed loses exactly nothing.

**A defect fixed on the way.** `rtSkater` never returned `L1`/`L2`, and two
readouts printed them by name. `fmtNum(undefined)` is not finite and not NaN, so
it returned **−∞** — which `runall`'s grep for `NaN|undefined|Infinity` does not
match, and which had been on screen unnoticed. Both fields now exist, are formed
separately from each state, and are unit-tested for finiteness.

## A force law  (`dyForce`, `dyForceRun`)

- **The work–energy theorem**, with ∫F·dx accumulated as a line integral *along
  the trajectory* (weighted by each step's dx, so a path that doubles back
  subtracts on the way home) against ½m(v²−v₀²) from the two endpoints. On a
  spring run over four periods — 8.8 m travelled to end up 1.5 m away — they
  agree to 1e-6 of the scale.
- **Path-independence, which is what "conservative" means.** F₀(x) = F(x,0,0) is
  integrated along that wandering path and again by a single quadrature straight
  from x₀ to x₁. They agree. Adding `−0.3v` leaves that agreement intact and
  breaks the *total*, by exactly the dissipated work: the mechanical energy falls
  and ∫(F−F₀)·dx matches the fall to 1e-5 of it.
- Whether the law depends on v or t is decided by **evaluating the function** at
  a spread of positions with v and t moved, not by inspecting the text, so
  `−4x + 0·v` is correctly called conservative.
- The stepper's order measures **3.87** on the damped oscillator.

## An acceleration programme  (`dyKinem`, `dyKinemRun`)

- v and x each computed twice (RK4 against quadrature, and against the Cauchy
  form), agreeing to 1e-9 and 1e-8.
- **Both SUVAT candidates are scored.** For a(t) = t over 3 s the formula with
  a(0) is wrong by exactly **T³/6** and the average-acceleration repair by
  **T³/12**, both confirmed against those closed forms to 1e-8. The second is the
  one worth having: ½at² is not linear in a, so the mean acceleration is not
  enough — *when* it arrived matters.
- x = x₀ + v̄T survives everything, to 1e-8, because it defines v̄.

## A drag law, and the angle that wins  (`dyProj`, `dyProjRun`/`dyProjBest`)

- With no drag the integrated range reproduces **v₀²sin2θ/g** to 1e-6, the flight
  time to 1e-6 and the impact speed to 1e-5 — the landing point located by
  solving the quadratic the final step followed, not by reading the grid.
- **The optimum is located, not looked up:** ternary search over forty integrated
  ranges returns **45.00°** with no drag. With k v² it drops below 44.5°, falls
  further as k rises, and a *linear* law gives its own different optimum.
- Quadratic drag reproduces the pre-existing `dyProjectileDrag` range to 0.5% —
  another pin against a trusted engine.
- **Terminal speed by bisection** on D(v) − mg, so it is right for whatever law
  was written rather than only for √(mg/k).

## A collision with a real interaction  (`dyMoment`, `dyPairCollide`)

Every other setting takes **e** as an input, which assumes the answer. A
potential has no e in it.

- **A conservative interaction comes out perfectly elastic**: e = 1 to 1e-6, with
  the final speeds matching `dyCollide(…,1)` to 1e-5 and the energy conserved
  throughout. Nothing told the integrator to arrange that.
- **Stiffness does not matter.** A potential a hundred times stiffer and three
  times steeper still gives e = 1 to 1e-5 and the same final speed to 1e-4.
- With a dashpot, e drops, the impulse algebra *at the measured e* reproduces
  both final speeds to 1e-8, and the loss matches ½μ(Δu)²(1−e²) to 1e-8.
- Equal masses with one at rest exchange velocities exactly, to 1e-4.

**Stated honestly rather than claimed.** The forces are built equal and opposite,
so momentum conservation here is a property of the *stepper*, not a discovery.
The panel and the demo note both say so.

## Bertrand's theorem, measured  (`dyGrav`, `dyOrbitTyped`/`dyApsidal`/`dyBertrand`)

The apsidal angle is located from the integrated track by watching ṙ change sign
and interpolating inside the step, and compared with **π/√(3+n)** where n is
measured from the reader's force by logarithmic differentiation (−2 and +1
recovered to 1e-6).

- **Inverse square:** all four eccentricities give π to within 3e-3, spread
  < 3e-3, reported as closing. **Hooke:** all four give π/2 on the same terms.
- **Exponent 2.1:** the near-circular angle is **π/√0.9 = 3.3115 rad** to 4e-3,
  the precession is 0.17 rad per orbit, and — the point — the four eccentricities
  **no longer agree with each other**. That parting is the theorem; the
  precession alone is not, since a whole family of exponents precesses by a
  rational fraction and still closes.
- Angular momentum drifts by < 1e-9 of L₀ and the symplectic stepper holds the
  energy to 1e-6 of E₀.

**What bit here.** An orbit launched at 1.32× circular speed takes about seven
times as long to come round as the circular one it was launched from, so a fixed
integration window reports "no apsides found" for exactly the eccentric rows the
theorem is about. `dyBertrand` now extends its window until four apsides have
been seen. And the sweep's plot had to be re-scaled: spanning π/2 to π buries a
0.02 rad disagreement, so the window is drawn around the measured values together
with the nearest closing mark, floored so a law that closes perfectly still shows
its four dots stacked on the line.

## Two drawing defects, both invisible to every other script

- **`ctBox` scales by the smaller of its two spans.** Handing it a half-size
  derived from a projectile's range, on a panel that is no longer full width,
  filled the height with empty sky. The scale is now chosen to satisfy both spans
  and the half-size follows from it.
- **A midpoint tick lands on rounding noise.** `(lo+hi)/2` on a symmetric torque
  is 3e-11 rather than 0, and `fmtNum` writes nine characters for it, which
  collide with the rotated y-axis title. Anything below a millionth of the span
  is snapped to zero. `plotTicksY` was added to `60a-stage-core.js` at the same
  time — only `plotTicksX` existed, and four new plots wanted labelled y-axes.

## An unrelated defect the readability sweep turned up

`auditscan` flagged two HIGH findings in the **integral** wing, neither from this
batch, and one of them was real rather than a false positive.

The Type I/II region help offers an example to be **copied into the box**:
`sqrt(max(0, 4 - x^2))`. Help prose is rendered through `supify()`, so the caret
became a superscript and what a reader saw was `sqrt(max(0, 4 - x²))` — which is
neither correct notation nor something the parser will accept if typed. The
examples now read `x*x` and `y*y`, which survive `supify()` and parse.

The second, and the `sqrt(` in the first, are the category the scanner's own
header already exempts: text naming the ASCII identifiers a box expects
(`written phi and t` on the spherical slots). Those are now in the `$exempt`
list beside the circuit's typed-source example, rather than the rules being
loosened.

## Verification

`smoke` OK · `runtests` **3759 passed, 0 failed** · `auditcustom` **bad=0**
(89 stages, 91 pickers, 120 boxes) · `auditderive` **flagged=0** ·
`auditsize` **findings=0** (8 canvas shapes × 178 stages) · `auditviewport`
**bad=0** (16 window sizes) · `auditscan` **AUDIT OK** · `runall`
**caught=0 OK** — 584 demos, 4765 controls, jsErrors=0, calcNaN=0.

Four of the nine were looked at as screenshots as well as counted: the typed
torque programme (the quadrature answer drawn as a ring with the RK4 dot inside
it), the coupling ledger (the two heat bars identical at 5.442 J), the typed
I(t) (the algebraic L₀/I curve lying underneath the stepped one, L drift
8.9 × 10⁻¹³), and the Bertrand sweep (four apsidal angles, none of them on the
π line and none of them on each other).

**Wings now closed by Tier 3: fluids, thermodynamics, waves, nuclear, solid
state, rotation, mechanics.** 25 of 75.

---

# Tier 3, the statistical-mechanics batch and Gauss's law (2026-08-12)

Five stages and three engine modules — `44ca-statmech-typed.js`,
`44cb-statmech-kinetic.js` and `47a-em-typed.js`. The statistical-mechanics wing
is closed; `emGauss` is the first of the six in electromagnetism, and the engine
under it already carries #38 and #39.

## A level scheme  (`smBoltz`, `smLevelReport`/`smPeakC`/`smSchottkyX`)

Three quantities, each computed twice by routes with nothing in common: ⟨E⟩ by
Σ EᵢPᵢ against −∂lnZ/∂β; C by the energy fluctuation against dU/dT on a
five-point stencil; and S by Gibbs' −kΣ p ln p against (U−F)/T, which never sees
a population at all. On a two-level sheet at four temperatures the three gaps
run at 1e-13, 1e-9 and 1e-11 of their own values respectively — numerical
differentiation error, and nothing else.

The heat-capacity peak is located by golden section on ln T and again by
bisecting dC/dT across the same bracket, and for a two-level scheme both are
checked against the root of x·tanh((x − ln r)/2) = 2, solved by bisection rather
than quoted. Equal degeneracies give the textbook kT* = 0.41718 ΔE; an upper
level three times as degenerate moves it, and the closed form moves with it. A
third distinct energy destroys the closed form, and the panel says so instead of
printing a number that no longer means anything.

**The invariance is swept, not sampled.** Nothing in Σ g e^(−E/kT) can tell an
energy from a temperature separately, so multiplying every level by λ must move
the peak to exactly λT*. Across λ from 0.1 to 10 the ratio kT*/ΔE spreads by
under 1e-5, on both a two-level sheet and a forty-rung ladder.

Both ends of the third law are computed rather than asserted: S(T→∞) reaches
k ln Σg to 2e-5 relative, and S(T→0) reaches k ln g₀ exactly — at kT below a
nine-hundredth of the smallest gap the exponentials underflow to zero and the
partition function *is* g₀.

`smLogOmega` counts up to k in a loop, which is exact at whole quanta and
quietly **wrong** for anything else: it truncates. Continuing the Einstein solid
off the integers needed a log-gamma, so `smLogGamma` (Lanczos) went in beside it
and the suite pins the two together at whole numbers to 1e-9.

## A multiplicity  (`smCount`, `smSplitReport`/`smSplitScaleFit`)

The reader writes lnΩ(q, N) for each block. The equilibrium split is then found
by maximising S_A + S_B and, separately, by bisecting ∂S_A/∂q = ∂S_B/∂q — one
maximises a function, the other solves an equation between two derivatives, and
nothing in the code makes them agree. They land within 1e-6 of q of each other
on three block pairings, which is what makes "equilibrium is equal temperature"
a result rather than a slogan.

The width is also computed twice: from the curvature √(−1/S″), which is the
Gaussian approximation everybody draws, and from the distribution summed
outright. The ratio is printed and the bell is drawn over the distribution it
approximates — it is within 5% and it is not 1.

**The 1/√N law is fitted, not asserted**, across four system sizes: −0.4952 with
a residual of 1e-3, which is √2 narrower per doubling to 2%. And the reason the
exponent is −½ is extensivity, so that is measured too — `1.5*N*ln(q/N)` passes
at 1e-12 and `1.5*N*ln(q)` fails by 27%, which is the Gibbs paradox in one
number, one keystroke away.

Pinned against the engine that was here first: the exact Einstein multiplicity
fed through `smSplitReport` reproduces `smContact`'s mean and standard deviation
to 2%, on two block pairings.

## A dispersion relation  (`smSpeed`, `smKinetic`/`smSpeedCurve`)

The best item in the batch. `smMaxwell` assumes two things nobody is asked
about — that the energy is quadratic in the momentum, and that space has three
dimensions — and every number the preset prints follows from them. With ε(p)
typed, the speed becomes the group velocity dε/dp, computed rather than assumed.

**⟨p·dε/dp⟩ = d·kT is exact by one integration by parts**, for any ε that grows,
in any dimension. So the printed ratio is not a physical result that might come
out near 1: it is 1, and the residual measures the quadrature. It holds to 1e-6
for four dispersions across d = 1, 2, 3 and 5, which is a stronger check than a
dozen approximate agreements because a bug cannot hide in it.

The heat capacity is measured as d⟨ε⟩/dT and predicted separately as d/n from
the power n **fitted** to ε(p) over the thermally occupied decade. Pure powers
agree to 3e-3 (p² gives 1.5, p·c gives 3, p⁴ gives 0.75). A relativistic gas
refuses a single exponent, its fit residual says so, and its heat capacity is
measured crossing from 3k/2 at 10⁵ K to 3k at 3×10¹² K — with no particle
exceeding c and the mean speed above 0.9c at the top.

The anchor: ε = p²/2m in three dimensions reproduces `smVavg` and `smVrms` to
1e-6 and `smVmp` to 1e-4, the last of which needs the Jacobian dp/dv = 1/ε″(p).
Dropping that Jacobian is the commonest way to get the most probable *speed*
wrong, and it is why the mode is found by maximising w(p)/ε″(p) rather than w(p).

A dispersion with no curvature — ε = pc, where every particle moves at exactly c
— has no speed distribution at all, and the panel draws the momentum
distribution instead and says which is on the axis, rather than dividing by zero.

## An anisotropic lattice  (`smIsing`, `smIsingScan`/`smIsingTcExact`)

Onsager solved the anisotropic square lattice, not merely the square one, so
sinh(2Jx/kTc)·sinh(2Jy/kTc) = 1 gives a **different exact number at every
coupling ratio** — far stronger than hitting one famous value, which could be
luck. It is solved by bisection in logarithms (`smLnSinh`, because sinh(2J/T) at
small T overflows and the criterion would come back Infinity − Infinity), and
checked by substituting the answer back: the product prints as 1 to nine
figures. With Jy = 0 no root exists at any positive temperature, which is
Ising's own 1925 result appearing as a limit rather than as a separate model.

The simulation is told none of it. It measures the specific heat as an energy
fluctuation and the susceptibility as a magnetisation fluctuation at fifteen
temperatures and locates both peaks by parabolic interpolation.

**What bit: the scan has to be annealed.** Restarting from a hot lattice at
every temperature located Tc 14% low. Near a transition the relaxation time
diverges — this stage has a demo about exactly that — so a fresh random lattice
has not equilibrated in any affordable number of sweeps and the fluctuation
comes out noisy *and* biased. Cooling gradually and carrying the configuration
from one temperature to the next put the same measurement within 1.6% of exact
at L = 22, and within 8% at L = 16 in the suite. The fix was one line.

## Gauss's law where nothing can be counted  (`emGauss`, `47a-em-typed.js`)

The wing's own stage draws a surface around point charges and works out the
enclosed charge by *looking at the list*. What the flux integral then checks is
the quadrature — the physics was true before the integral started. Two things
follow that a count can never do, and both are now done.

**A surface that cuts through the source.** The field is Coulomb's law
integrated over a typed ρ and the enclosed charge is a second volume integral of
the same ρ in different coordinates, sharing no node with the first. They agree
to 0.1% on enclosing surfaces and to about 1% on surfaces inside the charge.

**The differential form.** ∇·E is a five-point difference of the integrated
field, compared with ρ at that very point, to 6% on a blob wide enough for a
derivative to have room.

**What bit, twice.** The first engine integrated in spherical coordinates *about
the point being evaluated*, where the r² of d³r cancels the 1/r² of the kernel
exactly. That is beautiful inside the charge and hopeless outside it: a distant
blob subtends a solid angle the direction grid cannot resolve, and the flux came
out 59% high at R = 2.5 with the error growing with radius. The tests caught it
before any of it reached a stage. Sampling ρ onto cells and giving each the
field of a **uniformly charged ball of equal volume** is accurate at both ends —
exact Coulomb far away, bounded and finite inside — and for a smooth density
dying inside the box the sampling is a trapezoidal rule on a decaying function,
so its error falls exponentially rather than as a power.

The second bite was the derivative: a second-order difference on a two-cell step
read 40% low at the centre of a blob, because the step has to exceed a cell and
stay well inside the scale ρ varies on, and a narrow blob leaves no window at
all. `emCellDiv` now Richardson-extrapolates two steps, and the test uses a blob
wide enough for the question to be fair.

**And the sweep.** Four radii: the flux spreads by under 5e-3 while the mean |E|
on the surface falls by 5.2×. That exact cancellation is the inverse square, and
one surface could never show it.

## The two magnetic laws, on a typed current  (`emGaussB`, `emAmpere`, `60ib`)

The preset panels for these two cannot fail their own tests. ∮B·dA = 0 is run on
a point dipole, whose field is a closed form with ∇·B = 0 written into it; ∮B·dl
is run on a wire carrying B = I/2πs, put there by hand, so integrating it round a
circle returns I because 2πs cancels 1/2πs. Both are arithmetic. With J typed as
three expressions neither is.

**∮B·dA = 0, measured against what it cancelled.** A net flux of 10⁻¹⁶ is what a
routine that computed nothing would also print, so every panel and every test
reports it beside the **gross** flux ∮|B·n̂|dA. On a ring the net is 1.5×10⁻¹⁶
against a gross of 0.91; on a surface put *through* the current, 2.4×10⁻¹⁷
against 0.12; on one centred off every symmetry — which is the one that matters,
because a mesh sharing the field's axis can return zero for reasons that belong
to the mesh — 4.4×10⁻³ against 0.90. ∇·B is reported the same way, as its three
∂Bᵢ/∂xᵢ separately: they are 0.2–0.5 apiece and sum to 10⁻². The residue is the
stencil, and it is identified as such by *measuring its distance dependence* —
7.7% two cells from the current, 0.46% five cells away.

**Two ways a typed current fails to be steady, and both are needed.** ∇·J ≠ 0
catches charge piling up (a radial flow: 3.9 against |J| ≤ 1.6). It cannot catch
a current that runs in one wall of the box and out of the other, which is
divergence-free at every interior point and still not a circuit. `emJBoxLeak`
integrates J over the walls; the *net* vanishes for both a ring and a wire — it
is ∫∇·J dV by the divergence theorem — and only the **gross** separates them. A
Gaussian wire leaks 1.1310 against a closed form of 2 × 2π × 0.09 = 1.1310,
which is its own current, twice, once at each end.

**"No magnetic field at all", as a measurement.** The radial current's B is not
small, it is cancelled: Σ|dB| over the lattice is 0.33 and |ΣdB| is 1/196 of it.
Without that ratio the stage drew a full set of arrows scaled to their own
maximum — a picture of amplified round-off — and the panel now says the number
instead. `emCellsBGross` exists for this, and the ratio separates the cases
cleanly: 0.85 for a ring, 0.82 for a solenoid, 0.65 for a wire, 5×10⁻³ for the
radial flow.

**Ampère, swept.** Four loop radii on a ring: the circulation agrees with the
current through the disc to 0.18–1.4%, and once the whole current is threaded it
spreads by 3.1×10⁻³ while the mean |B| on the path falls by 1.7×. Then the same
sweep on the radial current at a slice above its centre: 0.21 of current threads
the disc at every radius and the circulation is 10⁻³ of it. That is not an error
of a few percent — it is the law contradicting itself, and it is the reason the
displacement term exists.

**What bit.** Three things, all found by looking rather than by a test.

*`fmtNum`'s `sig` counts significant figures above 1 and decimal places below
it.* A flux of 0.0032 asked for to two figures came back as the string `0`, and
that reached the canvas heading, the chip and a readout row. It is not a
rounding of the answer, it is a different answer. `emjE` now raises the place
count by the number of leading zeros. Only the screenshot could have caught this:
every automated gate reads it as a perfectly finite number.

*A ratio of two numbers that are both meant to be small is not a measurement.*
On any symmetry — the middle of a ring, the axis of a solenoid — each ∂Bᵢ/∂xᵢ is
separately zero, so `gross` collapses to the same 10⁻¹⁶ as `div` and the ratio is
1.00, which reads as a total failure of a cancellation that was never asked for.
The threshold has to be relative to the field: |B|/h is the largest derivative
the grid can carry, and a thousandth of it separates the two cases.

*The convergence rate was being read off the wrong routine.* |∮B·dl − I| against
the grid plateaus at 8×10⁻⁴ — not because the field integral stops improving but
because `emJThread`'s disc quadrature does. Successive differences of ∮B·dl alone
give a measured order of 2.3 in cells per side, and refining the disc instead
moves I by more than the grid moves the circulation, which is how the plateau was
identified rather than guessed.

## Five coefficients, and a nuclide (`atomBinding`, `atomBeta`, `44ab`)

Two stages in the atom wing whose headline numbers were constants somebody else
had already fitted.

**The mass formula, scored.** `ncSemf` carried the Wapstra set as five
constants, so the curve of binding energy agreed with the measured nuclides
because the fitting had been done in the 1960s. Handed the coefficients, the
agreement becomes an RMS residual against AME2020 — 0.0576 MeV per nucleon for
the standard set — and B is linear in all five, so the *best possible* set is a
5×5 solve. It scores 0.0161, three and a half times better.

That optimum arrives carrying a warning, and the warning is measured rather than
asserted: its pairing coefficient is 51 MeV where the real one is 11, because
the table holds almost no odd–odd nuclei. Moving each coefficient by a tenth and
watching the residual ranks them — aV ×103, aS ×31, aC ×20, aA ×5.1, aP ×1.9 —
and the last of those is the number that says the fit has not earned its fifth
coefficient. **The diagnostic that was tried first was wrong**: the spread of
each column in the design matrix reports aV as completely undetermined, because
its column is identically 1. Perturbation asks the question that was meant.

**And the iron peak moves.** It is not an input: it is where the surface term
stops beating the Coulomb one. Halving aC moves it from A = 58 to 118, doubling
aC to 32, and deleting the surface term removes the maximum altogether — B/A
then falls monotonically, so the lightest nucleus is the most bound and there is
no fission at all. `ncSemfPeak` reports `edge` for exactly that case, because a
maximum sitting on the end of a scan is a report about the window. Best of all:
the least-squares set predicts the peak at **A = 62**, which is ⁶²Ni — the
measured champion — where the standard set says 58.

**β decay, and a constant that turns out not to be independent.** Q for a typed
nuclide is computed twice. Subtracting two atomic masses near 200 GeV to get one
MeV spends about four significant figures; substituting
M = Z·m_H + (A−Z)·m_n − B cancels every large term symbolically and leaves
Q(β⁻) = (m_n − m_H) + ΔB, which never forms a large number. They agree to 10⁻¹².
Setting both binding energies to zero collapses the second to m_n − m_H =
0.78235 MeV — which *is* the free neutron's Q, the constant the neighbouring
stage is handed. Tritium, the one β pair with a measured binding energy at both
ends, gives 18.58 keV against the published 18.59.

**What bit here, and it is the most instructive failure of the session.** The
first version reported ⁵⁶Fe as an electron capturer. The Q came out at +0.184
MeV from a comparison with ⁵⁶Fe's *measured* binding energy on one side and
⁵⁶Mn's *modelled* one on the other — and the liquid drop is wrong by several MeV
in places while these Q values are of order one. A mixed-source Q is not a
compromise between a measurement and a model; it is the difference between them,
and it settles nothing whatever its sign. Every channel now carries its
provenance, a verdict is only stated as a decay when both ends agree on where
they came from, and the isobaric chain runs entirely on the model so that no
comparison along it is mixed. Nothing automated could have caught this: the
number was finite, the arithmetic was right, and the answer was false.

**The second thing that bit was better physics than the code it broke.** The
chain is walked from both ends and the prose said the two walks must agree,
"because decays until it cannot and sits at the bottom are the same statement".
At A = 32 they stop at 14 and 16. They are supposed to: the pairing term splits
the chain into an odd–odd upper branch and an even–even lower one, so a nucleus
can be below both neighbours without being lowest — every single β step from it
goes up. The only way down is two at once, which is double β decay. The same
thing appears at A = 100 and A = 208, and it is why the closed-form Z* had to be
tested against *the nearest stable nuclide* rather than against the minimum: at
A = 208 the model's floor is Z = 84 and dB/dZ = 0 gives 82.43, which is not an
error of 1.6 protons but the pairing term the derivative could not see.

## The "See it in the laboratory" links, and why three of them went nowhere

Every formal statement may carry a link into the experiment that demonstrates
it, written as a position in a demo list — `em:1.4`. **A position is not a
name.** Inserting a demo into the middle of a group renumbers every link below
it, and a wrong-but-valid index is indistinguishable from a right one: the
button loads an experiment, just not the one the statement is about. Nothing was
checking, because there was nothing to check against.

Resolving all 80 of them found the damage. **Three pointed at demos that do not
exist** — Cramer's rule, Fubini's theorem and Tellegen's theorem, all of which
displayed "that experiment has moved" when clicked. **Two more pointed at the
wrong experiment**: both electromagnetism links said `em:1.4`, so Faraday's law
opened Ampère–Maxwell and the wave theorem opened Faraday. Those two had been
wrong since a "write your own charge density" demo was added above them in an
earlier release, and this session's two new EM demos moved them again.

Fixed three ways, in increasing order of durability:

1. The three dead links now point at demos that exist, and the two EM ones at
   the right experiments.
2. `see` now accepts a **stage id** as well as an index — `em:emWave` finds the
   wave experiment wherever it has moved to. Used wherever a stage identifies a
   demo uniquely; the circuit and integral wings run dozens of demos off one
   stage each, so those stay positional.
3. **`smoke.ps1` resolves every link on every build.** It already checked that
   each demo names a stage that exists; this is the same check in the other
   direction, and it costs nothing because the page is already loaded. Verified
   by breaking a link deliberately and watching it fail:
   `SEE-LINK-BROKEN integral:9.9/no-such-demo`.

A check that has never failed is not evidence that it works.

## Three fixes to this session's own work

**A constant recomputed sixty times a second.** `atomBinding`'s own mode drew
the standard coefficients' curve underneath the reader's, and called
`ncSemfPeak` to get it — a search over Z at each of 260 mass numbers, about
33,000 evaluations of the mass formula, inside `frame`. The stage ran at 28–41
fps where every other one runs at 60. Memoised; it is back to 60.

**A curve drawn outside its own axes.** The peak scan runs to A = 260 and the
axis stops at 250, so ten mass numbers of curve were painted over the right-hand
frame and its tick labels.

**A garbled sentence** in the `emGaussB` readout, which claimed a charge density
"would change the answer" without saying to what.

**A picture that hid its own subject.** The isobaric-chain parabola scaled its
vertical axis to the tallest nuclide on it. The arms of that parabola climb
8a_A/A per proton squared — 50 MeV within three protons at A = 32 — while the
feature the panel exists to show, the 2a_P/√A gap between the odd–odd branch and
the even–even one, is 4 MeV. Both stable nuclides and the odd–odd nucleus
between them drew as a single flat line at 4% of the canvas. The lever turned
out to be the *width* of the window rather than its height: a span of about
A^(1/4) keeps the arms at roughly eight times the gap whatever the mass number.
The window is also centred on the smooth vertex now rather than on the mass
minimum — the two differ by up to a proton, which is the pairing term again, and
centring on the minimum gave one arm three nuclides and the other one.

**Two segmented controls that never highlighted anything.** The coefficient and
nuclide pickers were rendered with a current value of `'none'`, so choosing a
preset changed the panel and left every chip unlit, which reads as a control
that did not work. They now match on the coefficients and on the text
respectively, so retyping the standard numbers by hand lights the standard chip.

**An audit that reported on a build it had never seen.** `auditscan` reads a
harvest written by `audittext`, and was perfectly happy to read one from a
previous session — which is worse than no check, because it returns a clean bill
of health for text that no longer exists. Three sessions of work were scanned
against a stale dump before the counts stopped moving and gave it away. It now
compares the two timestamps and refuses, and the refusal was verified by running
it against a deliberately stale harvest.

## Verification

`smoke` OK — 40 wings, 178 stages, **80 see-links all resolving** · `runtests`
**4160 passed, 0 failed** · `auditcustom` **bad=0** (98 stages, 100 pickers,
134 boxes) · `auditderive` **flagged=0** · `auditsize` **findings=0** (8 canvas
shapes × 178 stages) · `auditviewport` **bad=0** (16 window sizes) · `auditscan`
**AUDIT OK, 0 HIGH** · `runall` **caught=0 OK** — 593 demos, 4790 controls,
jsErrors=0, calcNaN=0.

All five were looked at as screenshots as well as counted: the level scheme (the
ladder, the located peak with the closed form sitting on it, and the entropy
climbing from ln g₀ = 0 to ln Σg = 1.386), the multiplicity (an Einstein solid
against an ideal gas, peaking at q_A = 66.3 where the fair share would be 102.9,
with the fitted slope −0.4952 beneath it), the dispersion (a relativistic
electron gas at 6 × 10⁹ K, C = 2.755 k, the classical Maxwell curve running off
the top of an axis that stops at c), the lattice (the specific-heat peak at
1.5162 against an exact 1.4923), and the density (the Gaussian surface dragged
into the middle of the blob, Φ = 1.3717 against Q_enc = 1.3729).

**One harness note.** `smIsing`'s first own-mode frame triggers a scan of a few
million spin flips, and `runapp`'s screenshot pass caught the canvas mid-work
and wrote a blank picture — the failure mode its own header warns about. A probe
page that paints once, deterministically, showed the stage drawing correctly.
A blank stage screenshot is worth a second look before it is worth a fix.

The two magnetic stages were looked at as well as counted: the ring, with its two
current crossings drawn as ⊙ and ⊗, the dipole field between them, and Φ = 0.0032
against a gross of 0.9586; and the radial current at slice z = 0.35, a disc full
of ⊙ glyphs carrying 0.2132 of current through a loop whose circulation is
0.00021, with the field arrows faded to a third and the canvas saying why.

The two atom stages were looked at as well: the mass formula, with the residual
sticks standing between the model curve and the measured nuclides and the peak
line at A = 58; and the isobaric chain at A = 32, which draws as the textbook
double parabola — the even–even branch below, the odd–odd branch above it, ³²Si
and ³²S both marked as having no open channel, and every arrow a decay whose Q
came out positive. The first attempt at that picture was drawn at A = 3, where
the chain has two members and the parabola is a line segment.

**Wings now closed by Tier 3: fluids, thermodynamics, waves, nuclear, solid
state, rotation, mechanics, statistical mechanics.** 34 of 75 — EM has one stage
left of six, the atom three of five.


---

## The plot viewport, and what "shown properly" was measured to mean

Every flat picture is laid out by `mkPlot`, and there are 253 calls to it. A
pan/zoom viewport, clipping, and an information overlay were added there rather
than at the call sites, because 253 edits is 253 chances to get one wrong.

**The identity property was the design constraint, and it is asserted rather
than assumed.** With no reader interaction `mkPlot` must return exactly the four
numbers it was handed, or every picture in the laboratory shifts by a fraction
of a pixel and nothing reports it. `auditzoom.ps1` wraps `mkPlot`, compares the
window returned against the window requested on all 178 stages, and reports
`IDENTITY` on any disagreement. It reports none. That is what makes the
viewport safe to sit under stages that know nothing about it.

The same script drives zoom, pan, a typed window and reset on every stage that
draws a plot: **178 stages, 103 of them drawing 161 plots, 0 findings.** Reset
returns to the base window bit for bit. Two stages animate their own window --
`emFaraday` scrolls its time axis, `clLimit` marches in on the limit point --
and are detected as such rather than being reported as failures; the view is
stored relative to the base window precisely so that a reader's zoom rides
along with an animating window instead of being torn off it.

**Clipping.** `plotCurve` used to clamp stray samples into a band one full span
outside the box, which drew the curve across the axis labels, the readout chip
and whatever plot was next to it, and invented a plateau where a pole should
be. It now clips to the box. Nothing else in the suite could see the
difference: the pixels were drawn either way.

**How much of each curve was actually outside its window** was unmeasured
before `auditframe.ps1`. It samples what every `plotCurve` call was asked to
draw and reports the fraction outside, classified rather than accused:

| | before | after |
|---|---|---|
| CUT (window too small) | 18 | 4 |
| LINE (a tangent, correctly clipped) | -- | 8 |
| POLE (no window contains it) | 3 | 3 |
| MINOR (<5% outside) | 1 | 1 |

The first run conflated tangent lines with cut-off curves; second differences
now separate them, which is why `LINE` appears only in the second column. Eight
of the original eighteen were tangents and asymptotes doing exactly what they
should.

Six stages were re-framed with `mkPlotFit`, which derives the y-window from the
functions and quantises it to a round step so it does not twitch every frame:
`agQuad` and `agTransform` (a parabola keeping its vertex and losing both arms
as soon as a slider steepened it), `agPoly`, `laEigen` (a characteristic
polynomial leaving the frame between its own roots -- the only thing on that
plot worth seeing), `nmRoot` (a root finder whose crossing was off-frame), and
`wsSwamp` (a potential in arbitrary units under a fixed ceiling).

**Four remain, and are deliberate.** `srTaylor` at 56% and `odSeries` at 5% draw
truncated series diverging outside their radius of convergence, which is the
experiment; fitting the window would rescale to the divergence and flatten the
function it is being compared against. `atomForces` at 41% puts four potentials
that diverge at r to 0 on one chart. `wsADD` at 6% is a log-log exclusion plot
whose axes carry measured bounds. Clipping now shows all four honestly, where
before the strays were drawn outside the box.

**A latent hang was closed on the way.** Zooming out multiplies the data span,
and eleven `ctGrid` call sites pass an explicit step chosen for the window the
stage opens with. At the zoom-out floor that asks for over a thousand lines per
axis per frame -- the pathology AI-GUIDE section 7 records, where the frame
simply stops returning and headless Chrome never exits. `ctGrid` now doubles an
explicit step until it fits, which keeps a unit grid a unit grid (2, 4, 8 units)
rather than abandoning it.

**Navigation.** The top bar, the home page and `NAV_GROUP_OF` were three
separate lists of the same forty wings and had drifted: the home page listed
thirty-one cards, nine wings had no card at all, and Differential Equations had
two. Each list was valid on its own, which is why nothing reported it.
`smoke.ps1` now checks all three agree on membership and on order, because the
order is the curriculum. Ordering fixes: complex analysis moved ahead of Fourier
and quantum, which are both written in it; statistical mechanics ahead of
condensed matter, whose own introduction opens with Fermi statistics.


---

# 2026-08-12 · Consolidation, and what the dead-code pass found

`NOTE` — no mathematics changed. Recorded because two of the removals were
accuracy defects rather than tidiness, and because the count everything else was
resting on was wrong.

**The Tier 3 count was wrong by one, in the direction that flatters.** The
retired `TIER-THREE-ITEMS.md` reported "75 stages, 34 done, 41 remaining". The 34
includes `opWave`, which is in the optics wing and **not one of the twelve wings
the 75 counts**. Counted wing by wing the true figures are **33 done of 75, 42
remaining** (relativity 21, string 15, EM 3, atom 3), plus `opWave` outside.
Checked by summing the per-wing stage counts twice, from opposite ends: the
closed wings hold 28, EM and the atom contribute 5 more, and 33 + 42 = 75 closes.
This is the second time this number has been wrong by arithmetic on an estimate
rather than a count.

**Two deleted functions were quoted-value defects, not dead weight.**
`ncFissionEnergy` computed the ²³⁵U fission release from B/A literals typed into
the source (7.5910, 8.3261, 8.5471) and `ncFusionEnergy` did the same for D–T
from hardcoded masses. Neither had a caller, so neither was wrong on screen — but
both stood as a released energy that nothing could check, which is what the house
rule forbids. `ncReactionQ`/`ncNuclideMass` supersede them and get D–T's
17.59 MeV from measured masses **with provenance**. Removed rather than fixed.

**Two more carried comments that were false**, which is worse than no comment:
`flDrainTime`'s said "which needs the ODE rather than the formula" and then
returned the formula; `mvCompile3`'s named the Jacobian and triple-integral
stages as its callers, and neither called it.

**`stAudit` looked dead and is not.** It has no caller in `src/` or `tests.js`,
because `auditscan.ps1` injects a probe that calls it to count the formal layer
from the rendered essay. A dead-code scan over `src/` alone would have deleted
the thing that measures statement coverage. **Any such scan must include the
`.ps1` harnesses**, which inject probes into the built page.

**Fifteen further uncalled functions were kept deliberately**, each with a named
adopter recorded in `MASTER-PLAN.md` §6.3. Two of them — `vcDivergenceCheck` and
`igChangeCheck` — are already-written implementations of the "both-sides audit"
that Programme D proposes building.

**Verified after the removals:** `./build.ps1` 230 modules, `./smoke.ps1` OK
(wings=40, stages=178, seelinks=80), `./runtests.ps1` **4160 passed, 0 failed**.

**Measured, not quoted, on 2026-08-12:** 40 wings, 118 demo groups, **593 guided
experiments** (508 of them driving a canvas stage), 178 stages all reachable,
230 modules, 5.28 MB artifact, 4160 tests. Every document in the repository had
been carrying 584 / 222 / 3759, which were true when written. Counts in prose go
stale within a session.
---

## 2026-08-12 (later) — Programme D, item 1: the declared-property audit

**What was checked.** Every preset table in the laboratory carries *claims* about
its own entries — this surface has area 4π, this field is conservative, this
sequence tends to 1, this is the antiderivative of that, this matrix is singular.
Those claims were the one layer of the site the house accuracy rule had never
been pointed at: they were written by an author who knew the answer, and nothing
recomputed a single one. `./auditclaims.ps1` now recomputes **249 claims across
14 tables** by routes that share nothing with the declaration, and prints the
difference for every one.

Tables covered: `IG_1D`, `IG_SOLIDS`, `IG_REGIONS`, `VC_PATHS`, `VC_FIELDS`,
`VC_SURFACES`, `SR_SEQ`, `SR_SERIES`, `SR_TAYLOR`, `OD_FIELDS`, `AG_FUNCS`,
`DF_HARMONIC`, `NM_FUNCS`, `EIG_PRESETS`. The last two live at `79g` and `78b`,
**outside the 21–49 window `runtests.ps1` extracts**, and so had never been
reachable by a unit test at all.

**Against what.** Declared closed forms against quadrature over the table's own
limits; symbolic curls against numerical circulations; antiderivatives against
the integrals they are supposed to produce and against their own derivatives;
`coef(k,c)` against `deriv(k,c)/k!`; declared radii against the root test on the
coefficients; ODE closed forms against the slope field they claim to solve;
`inside()` against Green's planimeter; `closed` against the parametrisation.

### Three real defects, found by the audit

**1. `VC_SURFACES.cone.exactArea` was the area of a different surface.** It
declared `π√2` — the whole cone. The patch is parametrised from `u₀ = 0.001`, to
keep the apex (where `r_u × r_v` vanishes and n̂ is undefined) out of the domain,
so its true area is short by `√2π u₀²`. The gap is 4.44e-6 and the stage printed
it to the reader in a row labelled **"difference"**, where it read as quadrature
error. It was not: the quadrature had converged to a self-gap of **5.3e-14**.
Measuring the quadrature's own convergence *before* comparing it to anything is
what left the gap nowhere to hide.

**The unit test was accommodating it.** `close('the cone pi sqrt 2', …, 1e-5)`
used an ABSOLUTE tolerance about 2.3× the error, so it passed. Now pinned against
the entry's own constant at 1e-9, with a second assertion that the shortfall is
exactly `√2π u₀²`.

**2. `VC_SURFACES.torus` was missing `closed:true`.** Its `boundary` field read
"none — it is closed" and its note leans on Stokes' theorem forcing zero flux
through it, but the flag itself was absent. One branch reads it —
`69b-stages-vc-green.js:351` — so the divergence-theorem row silently never fired
for the torus. **The flag could not simply be added**: that branch read
`st.surf === 'sphere' ? … : NaN`, so correcting the table would have put a
literal `NaN` on screen. The row is now keyed on having a volume integral rather
than on the flag, which is what it always meant.

**3. A measured radius of ~17 was printed for eˣ beside the word "infinite".**
`74-series-stages.js` showed `srRadius(...)` at k = 60 next to a row reading
"radius of convergence about c: infinite", with nothing to say what the gap
meant — which §2.1 forbids. The root test at finite k can only ever return a
finite number, so the honest reading is not the number but its *trend*: an
infinite radius keeps climbing with k (5.7 at k = 30, 16.9 at k = 60) where a
finite one has settled (1/(1−x) sits on 1 at both). The row now measures at two
orders and says so.

### The audit was wrong five times before it was right

Recorded because the corrections are the method, not incidental. Of the thirteen
first-run findings, **five were defects in the audit** and each was fixed by
measuring an error instead of asserting a bound:

- **`IG_REGIONS.parab` Type I vs Type II, 4.3e-5.** Fubini holds; `x = √y` has an
  endpoint singularity and Gauss–Legendre converges slowly there. Each route is
  now run at two panel counts and the tolerance comes from their own measured
  self-gap.
- **`DF_HARMONIC.logr` reported ∇² = 1.2e-4.** ln r is harmonic; that was the
  five-point Laplacian's O(h²) truncation near the pole. Now Richardson-
  extrapolated, which recovers ~3e-7, with the truncation removed printed beside it.
- **`SR_TAYLOR` radii for eˣ, sin, cos.** Same misreading as defect 3 above, made
  by the audit itself — it demanded the estimate exceed 1e3. Now it demands the
  estimate *climb*.
- **`SR_SEQ.fact` monotonicity.** 2ⁿ/n! opens a₁ = a₂ = 2 **exactly**, so it is
  not strictly decreasing and "eventually decreasing" is the right label. The
  classifier had counted a flat step as neither, and had also been scanning into
  the underflowed tail where every term is 0.
- **`AG_FUNCS.recip` monotonicity.** 1/x falls on each branch but is not monotone
  (x = −1 gives −1, x = 1 gives 1). The sweep had reset its comparison at the
  pole and so had never looked across it.

### The negative control — the part that makes the pass mean something

A gate that passes everything may be checking nothing. Fourteen claims were
corrupted **in memory, leaving `src/` untouched**, and the audit re-run:
**13 of 14 caught, across 12 of the 14 tables.** Several were caught twice by
independent routes — a falsified `VC_FIELDS.shear.conservative` failed both the
curl/circulation test and the two-route potential test, which is the design
working.

**The one that escaped is the useful result.** `SR_SEQ.ratio.limit` moved from 1
to 1.0001 passed, because the check asked "is |a(N) − L| small at one large N",
and 1.1e-4 is small. What separates a right limit from one wrong in the fourth
decimal is not the size of the error but its **rate**: against the true limit it
keeps shrinking, against a wrong one it plateaus on the offset. The check now
measures the shrink over a fourfold N and requires it — correct limits shrink to
~0.28 of themselves, the corrupted one only to 0.79. Re-corrupted twice more and
both were caught.

**A ratio of two small numbers is not a measurement, and neither is a single
small number.** This is the same rule the plan states in §2.1, arriving from a
new direction.

### What bit

- **`runapp.ps1` and `runall.ps1` share one Chrome profile directory (`cprof`).**
  The concurrency trap in §4.2 is not hypothetical between *those two* scripts
  specifically — a screenshot taken while the sweep runs would silently dump
  empty. The screenshot was taken after the sweep finished.
- `String.Replace(a, b, count)` does not exist in .NET Framework 4.x, so the
  first negative-control run silently produced an unmutated copy and reported a
  clean pass. **A negative control that reports success is itself a result that
  needs checking.**

**Verified:** `./build.ps1` 230 modules; `./smoke.ps1` OK (wings=40, stages=178,
seelinks=80); `./runtests.ps1` **4175 passed, 0 failed** (+15: the corrected cone
assertion, and the `closed` flag and boundary prose recomputed for all seven
surfaces); `./auditderive.ps1` flagged=0; `./auditclaims.ps1` **249 claims,
bad=0**; `./runall.ps1` caught=0.

---

## 2026-08-13 — a full readiness pass over documentation, code and every gate

**What was checked.** Every script in the harness, run against **one build**, plus
a sweep of all four documents and the source tree for anything left open. The
question being answered was narrow and specific: is every number this project
states about itself true, and is every flag any tool has raised either fixed or
justified?

### Every gate, one build

```
build       230 modules                       auditclaims    249 claims, bad=0
smoke       wings=40 stages=178 seelinks=80   auditderive    flagged=0
runtests    4175 passed, 0 failed             auditcustom    stages=98 pickers=100 boxes=134 bad=0
runall      593 demos, 6462 controls,         auditzoom      178 stages, 161 plots, findings=0
            jsErrors=0 calcNaN=0, caught=0    auditsize      8 shapes x 178 stages, findings=0
auditscan   0 HIGH, AUDIT OK                  auditviewport  16 window sizes, bad=0
auditprose  BARE=0                            auditcontrast  WCAG pass, nothing under 12 px
```

### Two things that were flagged and are now fixed

**`auditprose` BARE was 2; §2.8 says it must be 0.** Both were **false positives
of a word-level match, not hand-waves**, and both are recorded here so nobody
later thinks two unjustified assertions were shipped:

- `88c-theory-modern.js` — "the fluctuations are percent-level and *clearly*
  visible". The word sense is optical, not rhetorical, and the sentence gives the
  1/√N scaling either side of it. Reworded to "wide enough to see".
- `88d-theory-string.js` — "its boundary should be stated as *plainly* as its
  content", a comparison about how to state something. Reworded to "as explicitly
  as".

A word sense the tool cannot distinguish is worth a reword; **weakening the
pattern would have been the wrong fix**, because the pattern is what catches the
real thing. `79j-stages-statmech.js` was reworded in the same pass for the same
phrasing, though it is a stage ladder and was never in the essay scan.

**`auditframe` reported four `CUT` stages.** It is a report, not a gate, and its
job is to distinguish a curve that is *supposed* to leave the frame from one that
is not. All four are correct by design, and each was checked rather than assumed:

| stage | outside | why it is correct |
|---|---|---|
| `srTaylor` | 56%, 15 curves | Taylor polynomials diverging past the radius of convergence **is** the experiment |
| `atomForces` | 41%, 3 curves | four potentials on a symlog axis spanning 10⁻³–10 fm: the 1/r Coulomb curve leaves the top at small r and the Yukawa well leaves the bottom, both cleanly clipped. **Screenshotted and looked at** |
| `wsADD` | 6% | Newton-law deviation against torsion-balance bounds |
| `odSeries` | 5% | series solution diverging outside its radius, as `srTaylor` |

The `atomForces` panel prints the weak potential at 1 fm as −1.318×10⁻¹⁷⁷ MeV,
which is right: the W-mass Yukawa range is ℏ/M_W c = 2.46×10⁻³ fm, so
e^(−1/0.00246) ≈ 10⁻¹⁷⁶·⁶. That is the demonstration, not an overflow.

### Documented numbers that were wrong, now measured

The house rule is "measure, do not quote", and the documents had drifted from it
again. Corrected in `MASTER-PLAN.md`, `README.md` and `AI-GUIDE.md`:

| stated | measured | where |
|---|---|---|
| 5.28 MB artifact | **5 339 257 bytes** (5.34 MB / 5.09 MiB) | `build.ps1` prints a **character** count; the Unicode maths symbols cost ~57 KB more as UTF-8. The documented "size" was never the file's size |
| 4160 unit tests | **4175** | README, AI-GUIDE |
| 222 modules | **230** | README |
| 782 rungs, ~39 350 words | **865 steps, 790 rungs, 39 761 words** | MASTER-PLAN §1.4 |
| 80+ statements, 71 proofs, 74 linked | **86, 75, 80** | MASTER-PLAN §1.4 |
| 253 `mkPlot` calls | **250** sites; 161 live plots on 103 stages | MASTER-PLAN §1.4, AI-GUIDE |
| thirteen window sizes | **sixteen** | MASTER-PLAN §1.6 |
| 21 statement cards remaining | **19**, and the list is now written into the plan rather than living only in a deleted CSV | MASTER-PLAN §3.8 |

**The core counts were right**: 40 wings, 118 groups, 593 experiments, 508
stage-driven, 85 field-pipeline, 178 stages, ~74 148 source lines — all confirmed
from the booted app.

### `measure.ps1`, and why a grep was not good enough

Part 0's wing/group/experiment counts were described as "counted from
`WINGS[*].groups[*].items` in the booted app" — something a person did by hand
once. Trying to re-derive the group count by grepping `src/` returned **89 with
one pattern and 105 with another**, because group objects are formatted several
ways; the booted app says **118**. That is the whole argument for reading these
out of the running page, and `measure.ps1` now does it in ~15 seconds. It also
reports the artifact's real byte size, and **any canvas stage no demo reaches**
— currently `unreachablestages=none`, which had been asserted in prose and never
tested.

### What was searched for and not found

- **No `TODO`, `FIXME`, `XXX` or `HACK` anywhere in `src/`.** Every hit for
  "placeholder" or "broken" is deliberate prose — M-theory being "a placeholder
  for something known to exist and not known how to state", and two stages that
  say a curve leaving the axis is *broken rather than clamped*, which is a design
  decision recorded on purpose.
- **No open items in `AUDIT.md`.** It is a record of resolved checks.
- `navbuttons=41` against 40 wings is **not** an off-by-one: it counts the home
  button, which `smoke.ps1` excludes from both the membership and the order
  comparison. Checked rather than assumed.

**Two blind spots remain open and are unchanged** (MASTER-PLAN §1.6): stage-level
arithmetic is still not unit-tested, and `auditderive` still sees only a stage's
default state. Both are Programme D items 2 and 3, and both are recorded as open
rather than quietly closed.

---

## 2026-08-13 (later) — the plan re-sequenced, and a frame measured for the first time

**Four decisions taken this session**, recorded in §1.7 so they are not reopened:
ship to **both a static website and a Claude artifact**; **performance leads the
queue**; Programme C runs **cheapest-first**, not curricular; **one coherent unit
per session, ending green**.

### `auditperf.ps1` — nothing had ever measured cost

Programme E was a list of suspicions with one measurement behind it. The plan
said of the 3D stages: *"measure before optimising; probably fine"*. Measuring
inverted the guess.

| | paint calls per frame |
|---|---|
| all 17 `mode:'3d'` stages | **345 mean**, 224 primitives sorted, max 906 |
| `cxMap` (2D) | **14 427** |
| `cxContourInt` (2D) | **10 024** |
| `rtInertia` (2D) | 6 399 |
| 17 stages at or above 1 200 | |

**The cause is one function.** `cxPaint` (`79c-stages-complex.js:8`) draws domain
colouring cell by cell over a 120×120 grid: 14 400 `fillRect` calls, 14 400
`fillStyle` string parses and 14 400 complex-function evaluations **every frame**,
for a picture that changes only when `f` or the viewport changes. That is a
straight violation of §2.4 — *anything expensive must be cached against every
input that matters* — and it is now also its own rule in §2.5, because the whole
point of finding it before Programme C is that 22 new wings must not copy it.

The panel rebuild was quantified at the same time: **6 313 bytes of HTML
regenerated per stage every 0.4 s** (`ckLab` 11 671), whether or not anything
changed.

**Why the reader feels this on the artifact specifically.** Same code, same
engine — but an artifact is an iframe sharing one main thread with the claude.ai
app. A stage spending 14 400 draw calls has no headroom, so contention shows
immediately. Headroom ranks local file > standalone tab > artifact, and that
ordering only matters *because* the app is expensive. Fixing the cost is the
better answer than choosing a delivery mode to work around it.

### What bit, twice, in building the profiler

- **Wall-clock profiling is impossible under `--virtual-time-budget`.** Chrome
  runs a virtual clock; `performance.now()` does not advance inside a synchronous
  loop, and the first run timed **all 178 stages at exactly `0.00 ms`**. A clean
  zero across the board is the signature. The fix was not a workaround but a
  better measure: count *work* — paint calls, path ops, primitives, bytes — which
  is deterministic and identical on every machine.
- **A counter leaked across stages.** `lastPrims` was captured in a wrapped
  `R.flush` but never reset, so 2D stages that never touch the 3D renderer at all
  reported 792 primitives inherited from whichever stage ran before them. Reset
  per stage. **A number that looks implausible for a thing that cannot produce it
  is a probe bug, not a finding.**

### Delivery, measured rather than argued (§3.9)

| | |
|---|---|
| raw | 5 339 257 bytes |
| gzip −9 | **1 625 582 (3.3×)** |
| brotli (est.) | ~1 349 000 |
| composition | 98% JavaScript |
| `file://`-hostile APIs | **none** — no `fetch`, `XHR`, `localStorage`, Workers, IndexedDB, modules |

**The shipped file was verified booting unwrapped from `file://` for the first
time.** Every harness script tests a *wrapped* copy (`apptest-*.html`), so the
artifact as actually distributed had never been loaded by anything. Checked by
stripping every `<script>` block from the dump and confirming 139 787 bytes of
**rendered** DOM carrying real demo names and 77 rail buttons, with no external
references.

**One earlier claim of mine was wrong and is corrected in the plan**: I said
nesting the full document inside an artifact's `<body>` was a structural problem.
It is not — every harness script has always done exactly that, and browsers hoist
the redundant tags. The real artifact risks are narrower and are recorded in §3.9:
`data-theme` is owned by both the app and the host, and `100dvh` is a full-screen
layout in a host container. **Both are testable and neither should be guessed at.**

**Verified after all of it:** `./build.ps1` 230 modules; `./smoke.ps1` OK;
`./runtests.ps1` 4175 passed / 0 failed; `./auditclaims.ps1` 249 claims bad=0;
`./runall.ps1` caught=0; `./auditperf.ps1` 178 stages, 0 JS errors.


## 2026-08-13 (later still) — Programme E executed, and three defects the speed work walked into

Programme E was taken from §4.3. The measured outcome first, because it is the
only part worth quoting:

| | before | after |
|---|---|---|
| stages over 1 200 paint calls/frame | **17** | **2** |
| mean 2-D paint calls/frame | **569** | **131** |
| worst stage | `cxMap` **14 427** | `wsCY` 4 072 (left alone, deliberately — see below) |
| HTML rewritten when nothing changed | **2 862 160 bytes/s**, 178 of 178 stages | **0 bytes/s**, 0 of 178 |
| animation while the tab is hidden | full rate | stopped |

`./auditperf.ps1` regenerates all of it in ~40 s.

### The guess that was wrong, and the measurement that replaced it

§3.5 named "unbatched strokes on the multivariable and forms stages" as the
second item, on the evidence of `mvSurface` issuing 25 450 path ops per frame.
**That reading was wrong and the plan has been corrected.** A probe that wrapped
each toolkit helper and measured the paint/path delta *across* the call attributed
the cost precisely:

```
mvSurface   total paint=3642 path=25450   ctHeat paint=3600 | ctContour n=16 paint=16 path=25404
mvLimit     total paint=4931 path=3023    ctHeat paint=4900 | ctContour n=7  paint=7  path=2136
dfHarmonic  total paint=3888 path=10895   ctHeat paint=3844 | ctContour n=17 paint=17 path=10688
```

`ctContour` was **already** batched — one `beginPath`, one `stroke` per level, so
16 levels cost 16 rasterising calls and the 25 450 path ops are `moveTo`/`lineTo`
*inside* those 16 paths, which is the cheap part. The expensive part was
`ctHeat`, which nothing had named: **ten of the seventeen heavy stages spent
2 700–4 900 of their paint calls in that one helper.** Fixing the helper fixed
ten stages; batching the strokes the plan named would have bought almost nothing.

**The lesson is the repo's own rule, applied to itself: a large number is not a
cost until something attributes it.** Path ops and paint calls are not the same
currency and the ranking by one is not the ranking by the other.

### What was changed

All five are the same edit: a per-cell or per-sample loop of `fillRect` became
one `ImageData` and one `drawImage`.

| where | was | now |
|---|---|---|
| `cxPaint` (`79c`) | 14 400 `fillRect` + 14 400 colour-string parses + 14 400 complex evaluations per frame | one blit, **cached** on (f, window, N) — f's identity is stable, so this one is honestly cacheable |
| `ctHeat` (`61a`) | N² `fillRect` per frame, 15 call sites | one blit, recomputed each frame |
| `rtInertia` (`76a`) | up to 8 100 `fillRect` | one blit |
| `smIsing` (`79ja`) | L² `fillRect` | one blit |
| `vcGreen` (`69b`) | ~2 200 `fillRect` | one blit |
| `uiSetHtml` (`80a`) | `innerHTML` written 2.5×/s per panel regardless | written only when the string differs |
| `startLoop` (`90`) | rAF ran forever | stops on `visibilitychange`, restarts on return |

**`ctHeat` is recomputed every frame and NOT cached, on purpose.** Its `f` is
almost always a closure the caller builds fresh (`const f = (x,y) => F.f(x,y)`),
so there is no stable identity to key on, and a heat map showing a stale field
would look exactly like a correct one. What was removed is the canvas round
trip, not the mathematics. `cxPaint` is cached *because* `CX_FUNCS` entries are
singletons and `cxOwnCur` returns the same object for the same typed source — the
cache is keyed on a thing that is actually an identity.

A side effect worth noting: `rtInertia` had been sizing its cells `P.pw/N` — the
box's width over N — while the grid spans `2R`, not the box's four units. Every
cell was drawn oversized and they overlapped, fattening the body at alpha 0.9,
most visibly on the thin rod. The blit tiles them exactly.

### Three defects found, none of which any gate could see

**1. Every domain-coloured picture in the complex wing was monochrome.**
`hsl2rgb(h, s, l)` takes the hue in **degrees** — its `h/30` is the standard
formula's sector index, and its only other caller passes `(210 + m*137.5) % 360`.
`cxPaint` had always passed the fraction in `[0, 1)`, so the hue never left the
first hundredth of a degree and `z²`, `1/z`, `sin z` and the rest all rendered in
red. Meanwhile the canvas caption said "hue is the argument", the help text said
"the hue at each point is the argument of f(z)", and the demo's stated outcome
said "go once around the origin and the colours cycle twice". The colours cycled
zero times.

Nothing could see it: the numbers were finite, the readout was right, the
Cauchy–Riemann residuals were right, and the modulus bands made the picture look
like a domain colouring. `runall` greps prose for `NaN`; `auditscan` harvests the
HTML panels; neither reads pixels. **Only the screenshot showed it**, and only
because the speed work happened to put a screenshot in front of it.
After the fix the hue wheel cycles **twice** around the origin for `z²` — which
is the demo's claim, now visible.

*The check that would have caught it*: reading canvas pixels back and asserting
the hue varies with the argument. That is Programme D item 3 (stage-level tests)
and is recorded there.

**2 and 3. Canvas text drawing its own markup.** `vcGreen` drew
`∬ (Q<sub>x</sub> − P<sub>y</sub>) dA` across the top of Green's theorem, and the
Carnot stage drew `Q<sub>c</sub> can never be zero` — the literal characters, tags
and all. The canvas has no markup (§2.10); both are now written with `∂Q/∂x` and
in words, because Unicode has no subscript `y` or `c`.

*This one now has a gate.* `smoke.ps1` greps the source for a markup tag inside
`ctFrame`/`ctText`/`rlText`/`stageNote`/`fillText`/`em3dCaption`/`wsTitle`/`wsSub`.
It runs on every build and costs nothing.

### The two negative controls, and why both were worth the minutes

**The panel-write column.** Disabling the skip in `uiSetHtml` made
`auditperf` report **178 of 178 stages and 2 862 160 bytes/s** — which matches the
figure §3.5 had from before the change, so the column is measuring the thing it
claims. With the skip on it reports 0 of 178.

That column had to be rewritten to be worth anything. It used to report the
**size of the panel after a refresh**, which is not the cost — it is the cost
only if the refresh writes. **It could not have seen its own fix**, and would
have gone on reporting 2.8 MB/s indefinitely after the writes had stopped.

**The canvas-markup gate — which failed its control the first time.** Restoring
the `<sub>` into `vcGreen` and re-running `smoke` gave `smoke OK`. The check was
reading one line at a time; `ctFrame(` sits on one line and the tag on the
continuation, so **the gate missed the exact defect it had just been written
for, in the exact file it was written for.** It now reads the whole call with a
quote-aware, depth-aware scan, and the control fails as it should:

```
smoke FAILED: canvas text is drawn literally — these paint their own tags:
  69b-stages-vc-green.js:119  ctFrame draws <sub> literally
```

An earlier draft of the same check also failed the build on **correct** code:
PowerShell's `-match` is case-insensitive and the pattern allowed whitespace
after `<`, so `st.E < B.Vmax` in the tunnelling stage read as an opening `<b>`.
It is `-cmatch` now and requires the closing `>`. **A gate that has never been
seen to fail is not known to work — and one that has never been seen to pass on
correct code is not known to be safe.**

### wsCY: an optimisation that was measured, looked at, and thrown away

`wsCY` draws 2 025 depth-sorted translucent quads with one `fill` and one
`stroke` each — 4 072 calls a frame, and it spins by default so there is nothing
to cache. It was batched by depth slab and patch colour, which took it to roughly
320 calls, and **the picture was wrong**.

The subpaths of one path are filled by the **nonzero** rule, so two quads wound
in opposite directions cancel where they overlap. Normalising the winding to stop
that cancellation is worse still: **the gaps between this surface's lobes are
those opposite-wound back-facing quads**, and filling them in turned a folded
Calabi–Yau slice into a flat coloured disc.

Both variants passed `build`, `smoke`, `runtests` and every audit in the repo.
The two screenshots side by side are the only thing that separated them. The
per-quad loop is restored, the stage is left at 4 072, and the reasoning is in a
comment at the call site so it is not attempted again. **Batching a depth-sorted
translucent mesh is not a safe transformation.**

### What is left heavy, measured

`wsCY` 4 072 (above, deliberate) and `vcDiverg` 1 351 (3D, just over the line).
Everything else in the laboratory is under 1 200 and the 2-D mean is 131.

### Verified after all of it

`./build.ps1` 230 modules · `./smoke.ps1` OK · `./runtests.ps1` 4175 passed /
0 failed · `./runall.ps1` demos=593 controls=6462 jsErrors=0 calcNaN=0 caught=0 ·
`./auditcustom.ps1` stages=98 pickers=100 boxes=134 bad=0 · `./auditderive.ps1`
ladders=178 flagged=0 · `./auditsize.ps1` 8 shapes findings=0 ·
`./auditviewport.ps1` 16 viewports bad=0 · `./auditperf.ps1` 178 stages,
0 JS errors, 2 heavy, 0 wasted panel bytes.

Five screenshots looked at, not merely generated: `rtInertia`, `cxMap` (before
and after the hue fix), `smIsing`, `wsCY` (batched vs restored), `vcGreen`.
**Three of this session's defects were visible only in those.**

### The same day, later — auditing the speed work itself, and finding it had broken navigation

Programme E was reported green and it was not. Re-reading the diff rather than
the gate output turned up **two bugs of my own making, both from the panel-write
cache**, and one false claim in the report.

**The cache made the panels stateful and two writers did not know.** `uiSetHtml`
skips a write whose HTML equals what it last wrote, and keeps that marker on the
element. That is only sound if **every** write goes through it. Two did not:

| writer | what it did | what the reader saw |
|---|---|---|
| `stageExit()` (`60a`) | `stageReadout.innerHTML = ''` | leave a stage and come back to it in the same state → the identical string matched the stale marker → the write was skipped → **a blank readout** |
| `updateChip()` (`80i`) | `$('chip').innerHTML = …` — the field pipeline owns the chip when no stage is active | return to a stage in the same state → skipped → **the field's chip left sitting over the stage's picture** |

**How bad the first one was: 145 of 178 stages came back blank.** Measured, by
entering every stage, exiting, re-entering and comparing:

```
#stages=178 blank=145 differs=148 errs=0     <- with the direct innerHTML write
#stages=178 blank=0   differs=3   errs=0     <- through uiSetHtml
```

The three that still differ are `pbCLT`, `pbRegress` and `smIsing`, which reseed
their randomness on entry. That is correct behaviour, not a finding.

**`runall.ps1` reported `caught=0 OK` on the broken build.** It visits each demo
once and never returns to one, so the second visit — the only thing that can
show this — never happens. `smoke` checks that every stage *carries* its nine
methods, not that calling them twice works. Nothing raises, no number changes,
no text goes `NaN`. **The whole class was invisible to the entire harness.**

*Two gates now, because the cause and the effect want different checks.*
`smoke.ps1` greps for the **cause** — a direct `.innerHTML =` on any of the three
cached elements — and **`auditpanel.ps1` (new, ~20 s) measures the effect**, so a
future caching mistake made some other way is still caught.

**The smoke gate failed its own negative control first, again.** Restoring both
writes caught the `stageExit` one and missed the chip one: the pattern required a
character after the `=`, and `$('chip').innerHTML =` puts its value on the next
line — which is exactly how the real code was written. `=(?!=)` now, which keeps
`==`/`===` out without demanding anything follow on the same line. **That is the
second time in one session that a line-oriented check missed the multi-line form
of the very defect it was written for.** When a check greps source, assume the
construct spans lines until the control proves otherwise.

**One hazard removed while in there.** `ctHeatBuf` kept a single buffer and
reallocated whenever `N` changed. No stage draws two differently-sized heat maps
in one frame today, so nothing was paying for it — but the next one would have
allocated two canvases per frame and traded the cost rather than removing it. It
is a small pool keyed on `N` now; there are only a handful of distinct `N` in the
laboratory.

### A false claim in my own report, corrected

The Programme E summary said `MAP.md` had been updated. **It had not — `map.ps1`
was named in the narration and never run.** It has been run; `MAP.md` now carries
`uiSetHtml`, `ctHeatBuf`, `cxPaintBitmap`, `startLoop` and the rest. Part 0's
byte count was also stale by the same session's own edits and is re-measured:
**5 351 740 bytes**, 75 929 source lines.

`AI-GUIDE.md` and `README.md` were checked for statements the speed work made
false and carry none — README's 230 modules and 4175 tests are both current.

### auditframe: four `CUT` stages, already adjudicated — do not reopen

`srTaylor` 56%, `atomForces` 41%, `wsADD` 6%, `odSeries` 5%. All four were
reviewed on 2026-08-13 (above, "auditframe reported four CUT stages") and judged
deliberate: a Taylor polynomial diverging past its radius of convergence **is**
the experiment. Re-run here only to confirm the count is unchanged at `cut=4`.

### Verified after the corrections

`./build.ps1` 230 modules · `./smoke.ps1` OK · `./runtests.ps1` 4175 / 0 failed ·
`./auditpanel.ps1` bad=0 · `./auditclaims.ps1` 249 claims bad=0 ·
`./auditzoom.ps1` 161 plots findings=0 · `./auditframe.ps1` cut=4 unchanged ·
`./runall.ps1` demos=593 caught=0 · `./map.ps1` · `./measure.ps1`.

### Loose ends closed, and one tool that should have existed already

**The plan told the next session to do something no tool could do.** §3.5 now
says "attribute before you optimise" — the lesson of getting the stroke-batching
item wrong — but the probe that does the attributing lived in a scratch
directory and died with the session that wrote it. It is now
**`./auditperf.ps1 -Where`**, which wraps each shared drawing helper and charges
the paint/path delta across the call to it:

```
phPortrait   total paint=913 path=3703
    ctArrow n=441 paint=881 path=2201
    ctGrid  n=1   paint=22  path=45
    ctContour n=2 paint=2   path=1454
wsCY         total paint=4072 path=8134
    (nothing attributable -- the stage draws with its own calls)
```

That last line is the useful one: it distinguishes "a shared helper is
expensive" from "this stage draws by hand", which want opposite fixes. The plain
`./auditperf.ps1` is unchanged.

**A trailing `\r` made the fallback invisible.** The report is split on `` `n ``,
so every row's last field keeps a carriage return — a **non-empty** string. The
`if ($r.where)` test was therefore true for stages with no attribution and
printed a blank line instead of saying so. `.Trim()` on the field. Small, but it
is the third time this session that a line-oriented assumption has quietly
changed what a check reports.

**The `runapp`/`runall` profile collision is fixed rather than documented.** Two
Chrome instances sharing a `--user-data-dir` produce an EMPTY dump, not an
error, and these two shared `cprof` — so grabbing a screenshot during the
18-minute sweep, which is exactly what backgrounding it invites, failed
silently. `runapp` uses `cprof-app` now. Verified by parsing every `.ps1` for its
profile: **15 scripts launch Chrome, 15 distinct profiles, 0 shared.** A hazard
that can be removed is better than a hazard that is written down.

**`MASTER-PLAN` §1.6 said "Nine scripts" above a table listing 20.** There are
21. The table was also missing `map.ps1` entirely. Both fixed, and the count is
now given with the command that produces it.

**An orphaned table row** — "First paint of a 5.34 MB single file" — had been
stranded below a paragraph, outside the table it belonged to, so it rendered as
a stray line of pipes. Rewritten as prose, with the §1.7 instruction not to fix
it by splitting the bundle.

### Delivery, prepared (§3.9)

Git 2.55.0 installed; the directory is a working tree; `.gitignore` written and
**verified against a real `git add --dry-run` rather than by reading it** —
264 files, 11.4 MB, with every Chrome profile, `apptest-*.html`, `dom-*.txt`,
`shot-*.png` and `audit-*.csv` excluded. Cross-checking the ignore list against
the delete list in `clean.ps1` found **six files a from-memory version missed**:
`dom.txt`, `smokedom.txt`, `probedom.txt`, `audittext-dom.txt`,
`audittext-dump.json`, `audittext-findings.csv`. `vector-calculus.html` is
tracked deliberately — it is generated, and it is also the artifact a host
serves.

What is deliberately not done: the commit identity and the push. Both are the
owner's to decide — one stamps the history, the other publishes it.

### Verified after all of it

`./build.ps1` 230 modules, 5 294 494 chars · `./smoke.ps1` OK (now three static
checks: `ctText` shifts, canvas markup, panel ownership) · `./runtests.ps1`
4175 / 0 failed · `./auditpanel.ps1` bad=0 · `./auditperf.ps1` 2 heavy, 2-D mean
131, 0 wasted panel bytes, and `-Where` exercised · `./runall.ps1` demos=593
caught=0 · `./auditcustom.ps1` bad=0 · `./auditderive.ps1` flagged=0 ·
`./auditclaims.ps1` 249 bad=0 · `./auditzoom.ps1` findings=0 · `./auditsize.ps1`
findings=0 · `./auditviewport.ps1` bad=0 · `./auditframe.ps1` cut=4, unchanged
and previously adjudicated.

### Programme I, the repository half — done, and what the line endings cost

`main` is live at `https://github.com/gimmeurcode/physics-stuff`, two commits,
265 files. **Verified on the remote, not from an exit code**: `git ls-tree -r
origin/main` was searched for `cprof*`, `apptest-*`, `dom-*`, `shot-*` and
`audit-*.csv` and found none, and `vector-calculus.html` is present. Identity is
repo-local; no global Git config was touched.

**The tree had mixed line endings and nobody knew.** Staging printed "LF will be
replaced by CRLF" for one set of files and, after `.gitattributes` was added,
"CRLF will be replaced by LF" for a *different* set — which is what exposed it.
Measured rather than assumed: **54 of the 234 files under `src/` are CRLF and
180 are LF**, totalling **15 627 carriage returns**.

That matters here for a reason it would not in most repositories: `build.ps1`
concatenates the source into the deployable artifact, so **every line ending is
a byte in the shipped file**. Normalising to LF means a fresh clone builds an
artifact ~15.6 KB smaller than the one measured on this machine. The app is
identical — a CR is whitespace between statements — but the number in Part 0 is
a measurement of one working tree, not a constant, and it now says so.

**I wrote that comment wrong the first time.** `.gitattributes` initially
claimed the pinning *preserved* the recorded byte count. It does the opposite,
and the second commit says so with the count measured. Left uncorrected it would
have been a confident, checkable, false statement sitting in the file whose
whole job is to explain the convention.

**Why LF and not the Windows default.** `core.autocrlf=true` would rewrite the
whole tree on checkout and show all 234 source files as modified immediately
after cloning. LF is what the majority of the tree already uses and what every
non-Windows checkout gets regardless. PowerShell 5.1 reads LF-only `.ps1` files
without complaint; the convention it *does* care about is the UTF-8 BOM on
scripts carrying Unicode patterns (§1.6), and `text` handling never touches a
BOM.

**`.gitignore` was verified by running it, not by reading it** — `git add
--dry-run` before the first commit, admitting 264 files and 11.4 MB. Checking it
line by line against the delete list in `clean.ps1` first found six files a
from-memory version had missed (`dom.txt`, `smokedom.txt`, `probedom.txt`,
`audittext-dom.txt`, `audittext-dump.json`, `audittext-findings.csv`). Without
the ignore list the first commit would have carried ~1.5 GB of Chrome profiles.

`vector-calculus.html` is tracked deliberately: it is generated, the rule
against hand-editing it stands, and it is also the file a static host serves.

### Programme I, the artifact half — and the second build target that turned out not to be needed

§3.9 assumed publishing to claude.ai "needs a second build target". **It does
not.** The standalone `vector-calculus.html` is publishable as it stands, and
that is now measured rather than assumed — which was the section's own
instruction: *do not guess at either risk, build the variant and test it.*

**`./auditartifact.ps1` is the gate.** It wraps the file exactly as the
publisher does and drives it in **all three viewer-theme states**. The third is
the one that mattered: an explicit viewer choice stamps `data-theme`, but the
default *system* setting stamps **nothing at all**. A palette defined only
inside `[data-theme]` blocks would have had no values whatever in that state —
an unstyled page. It survives because the tokens are on bare `:root` with
`[data-theme]` as overrides, which is the correct structure and was already
right.

Measured, per state: boots (40 wings, 178 stages, 41 nav buttons, 0 JS errors),
`.app` fills the viewport **to the pixel** (1662×848 in 1662×848), no horizontal
document scroll, canvas intact at 1268×415, and the theme button flips the
attribute, the CSS and the canvas.

| risk as written in §3.9 | verdict |
|---|---|
| `data-theme` ownership — "the failure mode is the theme button does not stick" | not a problem: host and app use the same attribute and the same two values, so they compose |
| `html,body{height:100%}` + `height:100dvh` inside a host container | not a problem: `.app` matched the viewport exactly in all three states |

**What makes the gate worth keeping is its second route.** The theme is read
back both as the CSS custom property `--bg` and as `TH.bg`, the array the canvas
renderer actually paints with (`readTheme()` re-reads the tokens on the
`MutationObserver`). A toggle that moved the CSS but not the canvas would leave
every picture in the laboratory painted for the wrong theme while the page
around it looked perfect, and nothing else in the harness looks at that. Control:
disabling the observer in `90-boot.js` fails all three states; the clean tree
passes.

**The check was wrong before it was right, in the now-familiar way.** The first
version read `TH.bg` on the line after `btn.click()` and reported all three
states broken. `MutationObserver` callbacks are delivered as **microtasks after
the current script finishes**, so it was reading the value from before the
click, every time. The reads are asynchronous now. That is the fourth
synchronous-assumption bug in this stretch of work, and the pattern is worth
stating plainly: **when a probe reports that everything is broken, suspect the
probe.**

### Publishing

The live artifact is
`https://claude.ai/code/artifact/289811c9-07a8-4419-87cc-b4b55e04a538`.

The publish was refused first with a freshness check — this session had not seen
the version on the server. **Resolved by comparing, not by forcing blindly**: the
served copy was fetched and searched for this session's markers, and contained
**none** of `uiSetHtml`, `ctHeatBuf`, `cxPaintBitmap`, `startLoop` or
`CT_HEAT_BUFS`. Strictly older, same repository, so nothing was lost by
overwriting. After publishing, the artifact was fetched **again** and all five
markers are present in the served bytes — 5 368 742 of them.

**A shared artifact serves a PINNED version.** Viewers holding the link keep
seeing whatever was pinned until the pin is moved from the page's share menu.
Publishing updates the artifact; it does not move the pin. That is not a defect
and nothing in the repo can change it, but anyone reporting "the link still shows
the old build" is seeing this and not a failed publish.

---

# 2026-08-13 (later still) · The permalink, and the six defects it found on the way

**Programme F's first item.** The laboratory had zero uses of `location.hash`:
593 experiments at one address, every control back to its default on reload. The
work was one new module (`82a-permalink.js`), one gate (`./auditlink.ps1`), and
six defects in code that had nothing to do with either — which is the part worth
recording.

## What the permalink is, as measured

`#w=<wing>&d=<group.item>&c.<id>=<value>` — the wing, the demo, and every control
moved away from what the demo opened with. The diff baseline is captured the
instant a demo finishes loading, so a link to one changed slider is short and
says *"β = 0.9651 on this experiment"* rather than listing forty values that
happened to be on screen.

| measured | value |
|---|---|
| round trips exact (copy → navigate away → follow the link → compare) | **593 of 593** |
| controls driven during the sweep | 7 969 |
| demos measured **stochastic**, so state text cannot be compared | **11** (`prob` samples and fits, `statmech` Ising lattices) |
| cold load: controls restored through `plInit()` inside `boot()` | 55 of 55 |
| cold load: characters of visible panel text identical to copy time | **4 378** |

The address bar tracks the wing and the demo only. Controls are written to the
URL by **Copy link**, not as they move: a stage refreshes four times a second,
several browsers throttle history writes, and a URL that rewrites itself under
the reader is not something anyone can copy with confidence.

## The gate needed two routes, and the first one alone was worthless

`plRead()` reads the controls — and the controls are exactly what a restore
writes. **Negative control: neutering `plNotify` so the restore filled every box
and told no stage anything left 586 of 593 round trips still "passing".** The
boxes were right and the laboratory was untouched.

The second route is the dock's **text**: an `<input>`'s contents live in a
property, not a text node, so what is left is the formatted reading beside every
slider, the readout, the chip and the derivation ladder — every one printed by
the stage *from its own state*. With that route the same corruption fails **505
of 593**, and the cold-load pass fails too. A second negative control — the
encoder dropping its `c.` parameters — reports `NOTHING-ENCODED` on every demo.

**Two things the second route had to be taught, both by being wrong first.**
`applyWingSections()` hides a wing's unused panels with `style.display` and does
**not** empty them, so `#dock.textContent` still carried the directional
derivative and the gradient-descent walker left behind by whatever *field* demo
ran last, under 178 stage demos that never touch either: 119 differences no link
could restore and no reader could see. And rather than keep a hand-written list
of which experiments are random, the audit **measures** it — enter the demo
twice with no link involved and see whether it says the same thing. Eleven do
not, and they are counted rather than excused.

## The six defects, none of them in the permalink

Every one was found by asking a question none of the other 22 scripts asks:
*can this control's value be written back?*

1. **`fmtNum` in an editable box** (`80c`, `80e`). û as `du`/`dv`/`dw` and n̂ as
   `cnx`/`cny`/`cnz` are three boxes holding one unit vector, filled with the
   **display** formatter — which emits U+2212 — and read back with `parseFloat`.
   `parseFloat('−0.7')` is `NaN`, which fell through `|| 0`, so **editing any one
   box silently zeroed every negative component** and the vector swung to a
   direction nobody asked for. Nothing raised; nothing printed `NaN`. Fixed with
   `fmtEdit` (`10-math.js`, ASCII, 32 new unit tests pinning **both** directions
   — that `fmtEdit`'s output survives `parseFloat` *and* the expression engine,
   and that `fmtNum`'s does not, so nobody tidies one into the other).
2. **The probe boxes, same shape** (`80c`). `pbxn` was filled by `fmtNear` and
   read by `parseFloat`; a negative coordinate could not be edited around, and
   the guard swallowed it, so nothing happened at all. Also two formatters for
   one number — `.toFixed(2)` on a slider drag, the other on a rebuild — so the
   same probe position read `-0.90` or `-0.9` depending on how it got there.
3. **`Dû` never refreshed when û moved** (`80c`). `refreshDirPanel()` is what
   runs for the angle slider, the three boxes and all five snap buttons, and it
   updated neither the chip nor the panel's own tag; both were refreshed only by
   `refreshProbe()`. For a **static** field nothing ever corrected them —
   `frame()` calls `updateChip()` only for an animated one — so swinging û
   redrew the arrow while the number beside it belonged to a direction no longer
   on screen. This is a readout contradicting its own picture, and it had been
   there as long as the panel.
4. **A duplicate element id** (`79c` vs `80e`). The complex wing's contour radius
   and the circulation loop's radius were both `ciR`, both in the dock.
   `getElementById` is first-wins, so which slider a `wireSlider` call reached
   depended on nothing but document order. Renamed `cxR`. `auditlink` now fails
   on any duplicate id under `#dock`, because a permalink's keys *are* element
   ids and a duplicate makes a key ambiguous.
5. **The matrix editors were unshareable** (`59-interact.js`). `mxHtml` gives the
   table an id and identifies cells by `data-i`/`data-j`, so the cells carry no
   id and nothing keyed on ids could see them — the reader's own matrix, which is
   the point of three linear-algebra wings, was the one thing a link could not
   carry. Now keyed `<table>.<i>.<j>`.
6. **A preset picker that showed no selection** (`78a`). `ctSeg('lsP', '', …)`
   never marked a choice, and that control decides how many cells the editor
   has — two lines in two unknowns against three planes in three. A link can
   restore a cell it can find; it cannot conjure a fourth column. Six more
   pickers share the pattern (`apP`, `syP`, `egP`, `dgP`, `svP`, `qfP`); the
   round trip **proves** they are unaffected, because every preset behind them is
   the same shape, and they were left alone.

## Three things about restoring that were wrong before they were right

- **A coupled group must be assigned before any of it is notified.** û and n̂ are
  each three boxes read together by one handler that re-normalises, so setting
  them one at a time — event and all — walks the vector somewhere neither the
  link nor the reader asked for.
- **…but a value must still be re-asserted immediately before its own event**,
  because an earlier notify in the same pass can wipe it: moving the probe runs
  `refreshDirPanel()`, which rewrites all three û boxes from the û it finds. The
  two requirements conflict at four significant figures and stop conflicting at
  eight, which is why those boxes now carry eight. **The controls compared equal
  while the directional derivative printed beside them moved by 17%** — visible
  only to the second route.
- **The target is the demo's defaults with the link's overrides on top, not the
  overrides alone.** Restoring one control can knock another off its default on
  purpose — `igFx`, `mvLgt` and `ftWF` each stop the sweep their stage animates —
  and a control sitting at its default is therefore absent from the diff and
  still needs setting. Twenty-five experiments came back with the sweep switched
  off by the very control the link had restored.

## Deliberately not encoded, with reasons

- **The View panel** (`#pvPanel`) — pan and zoom describe whichever plot the
  reader last touched, and `PV_FOCUS` is null until a pointer has touched one, so
  there is no stable identity for a link to name.
- **`ddAng`** — the angle slider is the *device* that moves û, not a description
  of it: `refreshDirPanel()` resets it to 0 whenever û is set directly, so
  encoding both means each undoing the other for as many passes as they are
  given. û pins the direction exactly and nothing is lost.
- **The theme** — the viewer's preference, and the artifact host sets it.

## Verification

`build` 231 modules · `smoke OK` · `runtests` **4207 passed, 0 failed** ·
`runall` demos=593 controls=6462 **caught=0 OK** · `auditlink` **findings=0**
(593/593, both negative controls confirmed failing) · `auditcustom` bad=0 ·
`auditpanel` bad=0 · `auditderive` flagged=0 · `auditartifact` bad=0 ·
`auditsize` findings=0 · `auditviewport` bad=0 (the new header button survives
all sixteen) · `auditscan` 0 HIGH · `auditcontrast` OK · `auditperf` unchanged —
2 heavy stages, 2-D mean 131, **0 bytes of unchanged panel rewritten**.

**Screenshots, looked at.** A cold load of
`#w=relativity&d=0.0&c.rlChB=0.96515` opens the right wing and the right
experiment with β = 0.9651, γ = 3.82121 and the Doppler factor 7.50925 all
agreeing. Pressing **Copy link** under `file://` shows the fallback: the browser
refuses the clipboard there, and the panel says so and offers the link selected
rather than claiming success. The URL in that box was checked by reading it back
rather than by looking at it — the input scrolls, and the hash was off-screen to
the right in the image.

## 2026-08-14 — J9, and a hypothesis that was wrong in both halves

Programme J item 9 read "round-off printed as a measurement", and the plan
recorded a diagnosis to act on: that `gapWork` was reaching the formatter as an
exact zero, because `fmtNum(1.499e-4, 3)` returns `0.00015`. **Both halves were
false**, and measuring them first is the only reason the real defect was found.

Measured on the bundle: `gapWork` is **1.4988e-4, not zero**, and
`fmtNum(1.499e-4, 3)` returns **`"0"`**.

### The formatter, characterised rather than guessed at

`fmtNum`'s exponent term is clamped at zero, so for |v| < 1 its `sig` stops
counting FIGURES and starts counting DECIMALS. Swept over 80 000 samples, the
dead zone is exactly **[1e-4, 5x10^-sig)** — bounded below only because the
scientific branch takes over at 1e-4, which is why `sig` >= 4 is safe by luck
rather than by design. `sig` 3 loses [1e-4, 4.99e-4]; `sig` 2 loses
[1e-4, 4.99e-3]. Both call sites in `dyForce` were inside it.

### But the formatter was the outermost of three layers

`dyForceRun` (31a) integrated the line integral by **trapezoid in dx — second
order — under an RK4 trajectory that is fourth**. Halving h measured it: ratios
3.992, 3.998, 3.999, 4.000, 4.000, i.e. exactly h^2. The panel was not measuring
the work-energy theorem at all; it was measuring its own truncation error.

It surfaces as 7.8% because the answer is exponentially small. The stage's
default law is a damped oscillator run twelve seconds — eight damping times — so
the net work is the **1.9e-3 J residue of a 13.47 J sum**, a cancellation factor
of **7.0e3**. A quadrature with 1e-5 relative error on the terms therefore lands
7.8% off the answer.

Across the laws the stage's own help text suggests: `-4x - 1.2v` disagreed by
**100%** while the chip printed "they differ by 0" in `--c-pos`, the affirmative
colour; `-4x` printed `1.20x10^-9` as a measurement; `-1/(x*x)` printed "593"
with no units.

### The fix, and why it is not a matter of taste

A line integral along a parameterised path **is** an integral in t:
INT F.dx = INT F(x(t),v(t),t).v(t) dt, with v signed, so a run that doubles back
still subtracts as it comes home. That is not INT F dt, the impulse — the
distinction the old comment was defending, and it survives. Composite Simpson
then matches the stepper's order, which is the condition for the difference to
measure the physics rather than the arithmetic.

Not invented here: **`rtSpinRun` (32a) is this routine's rotational twin and has
always integrated INT tau.omega dt this way**, with the comment "even, for
Simpson" on its own n. `dyForceRun` forced n even at the top and then had no
Simpson to use it — the line was vestigial.

Pinned against the closed form of m x'' + c x' + k x = 0:

| n | trapezoid in dx | Simpson in t |
|---|---|---|
| 300 | 9.5677e-3 | 2.0996e-5 |
| 2400 | 1.4988e-4 (order 2.00) | 4.5642e-9 (order 4.02) |
| 9600 | 9.3680e-6 (order 2.00) | 1.7627e-11 (order 4.00) |

**Measured order 2.00 -> 4.00; relative gap 7.8e-2 -> 2.5e-6, at identical
cost.** Also measured, and deliberately NOT adopted: the trapezoid in dx is
*exact* against a trapezoidal stepper (gap 2.3e-15 at n=300, because
dx = h(v_i+v_i-1)/2 makes the discrete theorem an identity). That pairing would
make the check structurally incapable of failing, which is the opposite of the
point.

New **`nqCumSimpson`** (21) supplies the running integral the energy-ledger plot
draws from, built so its **last entry IS the composite Simpson total** (measured
agreement 0 to 1.4e-16). The panel therefore cannot quote a number the picture
disagrees with: `Us[n] + wCons = 0` exactly.

### A third check that was never a check

`gapEnergy` is not independent. W_non = W_tot - W_cons by linearity, so
gapEnergy = |(W_cons - straight) - (W_tot - dK)| = |gapPath -/+ gapWork|, and
with gapPath at 2.1e-14 it equalled `gapWork` **to ten figures**. The panel
presented it as a third measurement. It now says what it is.

### The circuit half — two floors, one of them physics

`ckEng`'s only floor was `a < 1e-18`, six electrons a second, so `29.7 fA`,
`148 fW` and `29.7 pV` printed as readings. Two independent arguments put the
real floor in the same place. **Numerically**: MNA solves by dense LU, error
~ eps.kappa(A).||x||, and a circuit spanning 1 ohm to 1 Mohm has kappa ~ 1e6 —
so a milliamp-scale solution carries ~1e-13 A of arithmetic, which is the 29.7 fA
exactly. **Physically**: Johnson-Nyquist noise in 1 kohm at 300 K is 4.07 pA/rtHz,
a hundred times larger.

`ckMeasure` now returns the scales (`iScale`, `vScale`, `pScale`, `eScale`), and
`ckEngF` floors every solved quantity against its own kind. That alone is not
enough: **a circuit that has settled to nothing has no scale left to be small
against**, which is precisely the screenshotted case. So there is a second,
absolute floor from `ckNoiseI`/`ckNoiseV` — 4k_B.T.B/R and 4k_B.T.B.R over the
Nyquist band B = 1/2h, k_B CODATA 2022, T = 300 K, pinned in the tests against
the textbook 4.07 pA / 4.07 nV for 1 kohm at 1 Hz. An ideal circuit with no
resistance dissipates nothing and so has no Johnson noise, and the floor
correctly vanishes rather than being assumed.

Residuals are handled the other way round: `ckGap` and `fmtGap` keep the number,
quote it against the scale it must be read against, and say how many figures the
two routes share — because the absolute gap alone is what let a 100%
disagreement read as success.

### The gate was watched to fail

31 tests added. The J9 test was **corrupted back to the trapezoid once and run**:
four failures, with the order test reporting **1.9995** — the second order,
measured. The pre-existing tests passed the broken code throughout, because
their tolerances were absolute against a fixed 4.32 J scale; the new one is
relative to the answer, which is what makes it bite.

### Verification

`build` 231 modules · `smoke OK` · `runtests` **4238 passed, 0 failed** ·
`runall` demos=593 controls=6462 **caught=0 OK** · `auditcustom` **bad=0 OK**
(the typed-force path is exactly this stage) · `auditpanel` **bad=0** ·
`auditclaims` 249 claims **bad=0 OK** · `auditlink` 593/593 **findings=0**.

---

## 2026-08-14 — the documents were never checked against the program

### FIXED — every live document was wrong about the site

`SITE-RULES.md` (new), `MASTER-PLAN.md`, `AI-GUIDE.md`, `CLAUDE.md`, `README.md`

Nothing in this repository read a `.md` file. Twenty-five gates measured the
program; none measured what the program *says about itself*, so a document could
contradict the code indefinitely and every gate stayed green. A hand sweep found
eight false claims, and they were not cosmetic:

| document | said | actual |
|---|---|---|
| `AI-GUIDE.md` | 4175 unit tests in one paragraph, 4207 in another | 4240 |
| `README.md` | 230 modules, 4175 unit tests, 11 of the 25 scripts documented | 231, 4240, all 26 now |
| `MASTER-PLAN.md` | 23 harness scripts; §1.6 table described 23 | 25 on disk at the time |
| `MASTER-PLAN.md` | "all 21 scripts now have distinct profiles" | every script does |
| `MASTER-PLAN.md`, Part 0 | 5 383 723-byte artifact, ~76 598 source lines | 5 409 933, 77 044 |
| `AUDIT.md` | "a pass over all twenty wings" | forty |
| all documents | **nothing at all about `auditresid.ps1`** | a gate enforcing SITE-RULES 1.4 |

**The last row is the defect that matters.** `MASTER-PLAN` §1.6 is how a session
decides which gate to run, and §4.2 is how it decides when. A gate missing from
both is a gate nobody runs — the check exists, and the defect it was written to
catch ships anyway. `auditresid.ps1` and `auditmarks.ps1` had been missing from
§1.6 since they were written; `clean.ps1`, `auditcontrast.ps1` and `measure.ps1`
were missing from §4.2.

### The gate: `auditdocs.ps1`

Re-measures the site (`smoke`, `measure`, `runtests`, a directory listing), then
reads every live document and fails on a contradiction. Four questions, none of
which any other script asks: **counts**, **script coverage** (every `*.ps1` must
be in §1.6, §4.2 and `AI-GUIDE.md`), **paths** (every file a document names must
exist), and **generated-doc freshness** (a source file newer than `MAP.md` means
`map.ps1` has not been run).

**The dated-record rule is the only exemption.** A figure on a line carrying a
`YYYY-MM-DD`, or under a dated heading, is a record of what was true then and is
skipped; every other figure is a live claim. That is the right escape hatch
because using it *requires saying when* — which is the behaviour the rule wants.
`AUDIT.md` is dated records throughout and is not scanned; `MAP.md` is generated
and is checked for freshness instead.

**Volatile quantities are warnings, not failures.** The artifact's byte size and
the source line count move on every edit to any file, so a hard check would be
red during all normal work and would train the reader to ignore the gate. They
are reported with drift and only counted bad past 5%.

### Two things the gate got wrong first, and how they were found

1. **Seven false positives from patterns that were not anchored on totals.**
   "22 wings" is Programme C's backlog, "0 wings without one" is a coverage
   result, "8–20 guided experiments" is a per-wing target, "465 call sites"
   belongs to `ctPath` rather than `mkPlot`, and "2 862 160 bytes/s" is DOM churn
   rather than the artifact. A gate that cries wolf is switched off within a
   session, so every pattern now matches *total* phrasing only. **When in doubt,
   match less**: a missed claim is a gap, a false one is a reason to stop
   trusting the gate.
2. **A false green from `-SkipTests`.** Corrupting three counts and running it
   reported two. The third was a unit-test count, and `-SkipTests` had left that
   quantity unmeasured, so the claim was skipped **silently** and the run still
   printed `bad=0 OK`. A partial run now names what it could not check and
   prints `partial`. This is the same class as J9: a routine that computed
   nothing reporting agreement.

### The gate was watched to fail

Corrupted `README.md` to "232 modules" and dropped a throwaway probe script into
the root: **5 findings** — the count, and the unknown script missing from all
three of §1.6, §4.2 and `AI-GUIDE.md`, plus the script-count claim moving 26 → 27.
(The probe's name is deliberately not written here in backticks: the gate's own
path check reads a backticked filename as a reference and flagged this very
paragraph, which is the check working.)
Restored, `bad=0 OK`. `-Fix` was then tested on three corrupted counts across two
files and rewrote exactly the digits verified, leaving the prose untouched.

### Verification

`build` 231 modules · `smoke OK` (wings=40, stages=178, seelinks=80) ·
`runtests` **4240 passed, 0 failed** · `measure` 593 experiments in 118 groups,
508 stage-driven · `runall` demos=593 controls=6462 **caught=0 OK** ·
`auditdocs` docs=6 claims=47 **bad=0 OK** ·
`auditresid` rows=2189 residualrows=91 **findings=0** ·
`auditmarks` oldbreaks=2303 newbreaks=20, all four controls as documented.

The last two were re-run to confirm the previous session's fixes are actually in
the tree: `auditmarks` reproduces §3.10's claimed 2303 → 20 and its four named
controls exactly.

### NOTE — the summary paragraph was inheriting a green

`MASTER-PLAN.md`'s header said "the build is green on every gate". It was not a
lie when written, but it was an *inherited* claim: the working tree carried
uncommitted edits to some forty stage files, so the heavy gates' last green
predated the code in the tree. It now names which gates were run on which date,
and says plainly that a green is not inheritable.

---

## 2026-08-14 — the J9 fix had reached the reported surfaces and not their siblings

### FIXED — 76 residual sites across 34 files, and the gate that could not see them

Measured, not estimated: scale-carrying formatter call sites went **`fmtAgree`
72 → 118, `fmtGap` 18 → 38**, plus 8 `fmtAgreeTight` and 2 `fmtGapTight` at the
canvas sites that had no helper to reach for. 27 stage files and 7 engines.

The previous session converted ~41 files to `fmtAgree`/`fmtGap` and left
`auditresid` reporting `findings=0`. That green was real but narrow: the gate
read two surfaces out of five, and inside the files it had already touched, the
**readout row was converted and its own chip, derive rung and canvas label were
not**. Three examples, all in one file each:

| stage | converted | left on bare `fmtNum` |
|---|---|---|
| `wsVen` (79k) | `kv('difference', fmtAgree(...))` | the `wsNum` canvas label and the `drvStep` prose beside it |
| `rtTorque` (76c) | the work–energy row, `fmtGap` | ω, θ and the chip — three rows above it |
| `rtInertia` (76a) | `kv('difference', fmtAgree(Icm, Iint))` | the parallel-axis row and the own-case chip |

### The gate's four blind spots, each measured before it was closed

Because a gate is not known to work until it has been seen to fail, each was
found by instrumenting a copy and watching the count move — not by reading it.

1. **It read `readout` and `chip` only.** The **derive ladder** is ~717 000
   rendered characters across the 178 stages and was never scanned; nor was the
   legend. Adding them took the promise-rows it inspects from **91 to 122**.
2. **`SCALED` was tested against the whole panel blob**, and `SCALED` contains
   `/of\s/` — so **any surface containing the word "of" exempted itself**. On a
   4000-character ladder that is all of them. Asking the question in a
   60-character window around the number instead immediately found `smBoltz`
   printing `8.10×10⁻¹¹` as a measurement.
3. **`TINY` matched only the typeset `×10⁻ⁿ` form**, so every residual printed
   through **`toExponential`** — ASCII `8.10e-11` — was invisible. Eighteen sites
   in the statistical-mechanics wing alone were written that way.
4. **`st.own` was false at entry, so the 55 stages that answer
   `if (st.own) return ...readoutOwn(st)` were never rendered.** This is the same
   hole `auditcustom` exists to cover for `runall`, and it is where **13 of the
   findings were**: `dyMoment`, `rtInertia`, `rtRoll`, `rtTorque`, `ncBarrier`,
   `slHeat`, `smSpeed`. SITE-RULES §1.5 holds the reader's own case to the
   author's standard; the gate did not.

Found by corrupting `79j` twice — a readout row back to `toExponential`, a
derive rung back to `fmtNum` — and watching a **green** run. With the four fixes
the same corruption is caught three times over (kv, free text, derive), which is
what makes the `findings=0` below worth quoting.

### One defect in three spellings

`fmtNum` below 1 counts decimals; **`toExponential`** carries no scale and emits
ASCII where §1.7 requires `×10⁻ⁿ`; **`toFixed`** rendered a perfect Debye fit as
`"0.00000 decades"`. All three print a number whose size is its entire meaning
in a form that destroys the size. Swept: `toFixed` on a residual existed at 2
sites, `toExponential` at 18 of the 90 total.

### The shared layer that was missing

Four canvas sites printed a difference and **all four had dropped the scale**,
because `fmtGap`'s sentence does not fit `wsNum`'s 250-pixel column — the class
had no helper, and SITE-RULES §2.2 says that absence *is* the defect.
**`fmtAgreeTight`/`fmtGapTight`** (`10-math.js`) are the same derivation and the
same floor with no prose, Unicode-only because canvas text is drawn literally.
9 unit tests pin them, including that the output is under 30 characters and
carries no markup.

Two engines now return the scale beside the residual rather than leaving each
caller to invent one (§2.4, one source): `slDOSMu`/`slDOSFill` (`44ba`) and
`slSemiSolve` (`44bc`) carry `residScale`; `ftConvBuild` (`64c`) carries
`scale`, and its verdict threshold — a bare `d.worst < 1e-9` that passed any
signal small enough — is now relative to it.

### What was deliberately NOT changed

- **Seven `noscale` rows are physical answers, not residuals**, checked by hand:
  `rlTwin` (two twins' ages, 4 yr), `rlBarn`, `rlMetric`, `clLimit`, `wsHolo`
  and two more. A regex cannot separate "difference = 4 yr" from
  "difference = 2.30×10⁻⁶", so `noscale` is reported and does **not** fail the
  build. Recorded as SITE-RULES Part 4.7.
- **`rlElevator`'s 2.46×10⁻¹⁵ is the Pound–Rebka redshift**, not round-off. The
  first version of the widened gate flagged it; scanning `.dstep` rung labels
  was dropped for exactly this reason — physics prose legitimately quotes tiny
  numbers, and a gate that cries wolf is switched off within a session.
- **`worst residual … decades` and `residual of that fit` are fit statistics**
  in log units, where the number already *is* its relative measure. They join
  `rms residual` and `residual sum` in `EXEMPT`, but were still moved off
  `toFixed` onto `fmtSig`.
- The rotational integrators were checked for the `dyForceRun` truncation class
  and are **already correct**: `rtSpinRun` and `rtRedistribute` (`32a`) both use
  Simpson matched to their stepper. No sibling to fix.

### Verification

`build` 231 modules · `smoke OK` (wings=40, stages=178, seelinks=80) ·
`runtests` **4249 passed, 0 failed** · `auditresid` rows=2683 residualrows=122
**findings=0** noscale=7 ownsurfaces=24 · `auditcustom` stages=98 pickers=100
boxes=134 **bad=0 OK** · `auditlink` 593/593 **findings=0** ·
`runall` demos=593 controls=6462 **caught=0 OK**.

Coverage moved **2189 → 2683 rendered rows** and **91 → 122 promise rows**; the
delta is the four blind spots.

## 2026-08-14 — nothing had ever read the number in a "difference" row

`auditresid` had just been widened to five surfaces and reported `findings=0`:
every residual on the site now prints with the scale it must be read against.
That is a statement about **formatting**. It says nothing about whether the two
routes agree, and the two questions turn out to be almost independent — a row
can carry a perfectly good scale and announce a 30% disagreement, and nothing
looked.

`./auditsides.ps1` reads the verdict `fmtGap` renders — "agreeing to N figures",
or "they agree to every digit either route has" — on every panel, driving the
real segmented controls over the whole preset product.

**Measured:** 78 demos, **791 preset combinations**, 5676 panel renders,
**134 distinct two-route claims**. 10 FALSE-SCALE, 14 PRESET-GAP, 16 advisory.

**FALSE-SCALE — J9 inverted, and one cause.** `fmtAgree(a, b)` derives its scale
as `max(|a|,|b|)`. That is right until both routes legitimately vanish, and then
the derived scale **is** the round-off: a perfect result reads as a 100%
disagreement, in the affirmative colour, under prose promising the two agree.

| stage | preset | printed | what it is |
|---|---|---|---|
| `dyMoment` | e = 1 (default) | `1.78×10⁻¹⁵ (100% — agreeing to 0 figures)` | an elastic collision loses no energy; both routes are zero. The 9.5 J that cancelled is the honest scale |
| `smBoltz` | `sbK=hydrogen` | gap **1.81×10⁻¹⁷⁰** | both routes underflow; 165 orders below anything physical |
| `cxContourInt` | `ciK=invsq` | `2.50×10⁻¹⁵` | an analytic integrand, so Cauchy gives zero twice |
| `igMass` | `cardio`/`edge` | `2.43×10⁻¹⁶` | |
| `vcGreen` | `grad`/`circle` | `8.88×10⁻¹⁶`, `6.39×10⁻¹⁵` | a gradient field has no circulation |
| `vcStokes` | `hemisphere`/`shear3` | `5.51×10⁻¹¹` | mesh quadrature, not machine epsilon — its floor is larger |
| `vcDiverg` | `swirl` | `1.86×10⁻¹³` | |

**Not fixed here.** The fix is `fmtAgreeGross(a, b, gross, unit)`, scaling the
gap against the quantity the cancellation came from — which §2.1 already demands
be printed beside a vanishing integral. Six of the ten need that gross
*computed*: an extra quadrature over the **absolute** integrand. Recorded in
MASTER-PLAN §3.4 as the next unit rather than half-done here.

**The negative control found a defect in the gate, and the gate then found two
more real ones.** Corrupting `vcGreen`'s planimeter by 5% changed nothing the
gate reported. Its readout carries **three** rows labelled "difference" —
circulation, flux, planimeter — and keying a claim on its label alone merged all
three, into one whose minimum was already 0 from the row beside it. Keying on the
label's **ordinal within the surface** separated them; the corruption was then
caught, and the separation immediately exposed **two further real FALSE-SCALE
sites** the merge had hidden. 8 → 10. A gate that has never been seen to fail is
not known to work, and this one was wrong in a way only the control could show.

**`auditresid`'s preset sweep has never executed.** It carries a loop commented
"every scene / preset the stage offers, not just the one it opens on", drawing
its pool from `S.scenes`. **No stage has ever defined `scenes`** — the pool is
empty on all 178, the body has never run once, and the state keys it would then
have tried (`scene`, `mode`, `preset`, `key`, `which`, `view`) are not the names
stages use anyway (`vcStokes` keeps its presets in `st.cap` and `st.fld`). The
comment is right about why it matters. **A loop over an empty collection looks
exactly like a loop that works**; assert the sweep visited something.

**Why PRESET-GAP does not fail the build.** Its signature — exact on one preset,
poor on another — is equally the mark of a real defect and of a demo
*deliberately* showing where a hypothesis fails. `cxMap`'s conjugate preset must
break Cauchy–Riemann; `vcConserv`'s rotational field must have no potential;
`igDoubleRect`'s Riemann sum is exact for `f = 1` and nothing else, on purpose.
Whitelisting fourteen rows unattributed would be worse than measuring none, so
none were. The script is a **ratchet** on the counts instead: a new defect of
either class fails the build the moment it lands.

Two smaller things, not fixed: `wsRegge` prints its percentage twice with an
unbalanced bracket, and `dyEnergy`'s frictionless case reports **5.82%** under
prose reading "with no friction the two agree".

## 2026-08-15 — the ten false alarms, fixed, and three defects hiding behind them

The entry above (2026-08-14) found ten claims where two routes agree to
round-off and the panel announces ~100% disagreement, and left them unfixed. All
ten are now fixed and the gate's FALSE-SCALE baseline is **0**.

**`fmtAgreeGross(a, b, gross, unit)`** is the fix, and the gross is the quantity
the cancellation came from — §2.1's "print what the zero cancelled".

| where | the gross now used |
|---|---|
| `dyMoment` ×2 | `C.K0`, the kinetic energy before the collision |
| `smBoltz` ×2 | kT — ⟨E⟩ is zero to 170 decimal places for hydrogen at 300 K, by both routes |
| `vcGreen` ×2 | `max(∮\|F\|\|dr\|, ∬\|curl\| dA)` and the same with div |
| `vcStokes`, `vcDiverg` ×3 | `gross` returned by `vcStokesCheck` / `vcDivergenceCheck` |
| `cxContourInt` | `cxContourGross` = ∮\|f\|\|dz\| |
| `igMass` | ∬\|(x−x₀)²ρ\| dA |

**Two things about it were wrong first, and the unit tests caught both.**

*The gross sets a FLOOR; it does not rescale.* The first version took
`max(|a|,|b|,|gross|)` as the scale, which reports a real **50%** disagreement
as **5%** whenever the gross is ten times larger — burying precisely the defect
this family exists to surface. The test asserting a real gap still bites is what
failed. Above the floor the ordinary `fmtAgree` verdict now stands untouched.

*And the gross is `|F||dr|`, not `|F·dr|`.* Integrating the absolute value of the
**dot product** returns zero for a field pointwise perpendicular to its element —
a vortex round a circle, an inverse-square field along one, a swirl across a
sphere. The gross was then zero itself and rescued nothing: the count went 10 → 4,
not 10 → 0. The direction is part of what cancelled.

**Three defects that were not residuals at all**, found because the sweep drove
presets nothing else had:

- **`igMass` printed ȳ = −11 538 634 339 406 766** as a centroid. The `edge`
  density is ρ = y, which over a region symmetric about the x-axis integrates to
  **exactly zero**, so the panel divided by M = −1.8×10⁻¹⁶. `igLamina` now
  returns `Mabs = ∬|ρ|dA` and a `massless` flag; readout, chip, canvas note and
  the parallel-axis card all say "not defined — the net mass is zero". The
  parallel-axis theorem has no content without a centroid, so it says that too
  rather than computing four more NaNs. **This was visible on the default view
  of that preset and no gate had ever looked**: `fmtNum(NaN)` renders `—`, so
  the `NaN` grep never had anything to find, and the number itself was finite.
- **`cxContourInt` opened on a contour through two poles.** Radius 1 about the
  origin; `1/(z−1)(z+1)` has poles at ±1. The midpoint rule samples the midpoint
  of each chord, which lies just *inside* the circle, so |f| reached ~10⁶ and
  the sum stayed finite — a number printed beside a residue sum of 0, differing
  by π. New `cxPoleClearance` measures the approach **in units of the quadrature
  step**, because the midpoint rule's error near a simple pole grows like
  (h/d)²; below 8 steps both readout and chip say ∮f dz is not defined.
- **`wsRegge` printed its percentage twice** inside an unclosed bracket:
  `18.5 MeV/fm ( (2.06% — agreeing to 1 figure)2.06%)`. A hand-built percentage
  predating `fmtAgree` survived the J9 conversion with its opening bracket left
  inside the unit argument.

**A harness defect that had been eating runs.** Under
`$ErrorActionPreference = 'Stop'`, PowerShell 5.1 turns every stderr line from a
**native** command into a terminating `NativeCommandError`. Chrome writes to
stderr for reasons that are not failures — USB device enumeration, "Created
TensorFlow Lite XNNPACK delegate for CPU", GCM registration, a default web-app
install that did not happen; all four appeared on this machine in one session.
**19 of the 20 Chrome-driving scripts had this shape.** It killed an
eighteen-minute `runall` *after* the sweep had finished and *before* the DOM was
written. All 20 are guarded now. The guard is a window, not a blanket: each
script sets `'Stop'` again immediately after the invocation and still checks its
own result.

Gates after all of it: `build` 231 modules · `smoke` OK · `runtests`
**4261 passed, 0 failed** (14 added: 6 on `fmtAgreeGross`, 6 on `igLamina`'s
massless case, plus the two it caught being wrong) · `auditsides` **falsescale 0,
presetgap 14, OK** · `auditresid` **findings=0** noscale=7 · `auditcustom`
**bad=0 OK** · `auditclaims` 249 claims **bad=0 OK** · `runall` demos=593
controls=6462 **caught=0 OK**.

## 2026-08-15 — the four cut curves, and which two of them were defects

`auditframe` had been a report since it was written: it measures how much of
each curve falls outside its own window and classifies `LINE` and `POLE` as
honest, leaving `CUT`. MASTER-PLAN §3.10 asked for it to become a gate. **The
exit code was five minutes of work; the fortnight-old part was attribution**,
because a deliberately-chosen window and a wrong one look identical from the
call site. Measured per curve — every curve's actual y-range against the window
it is drawn in — the four split **two and two**.

**Real, and fixed:**

- **`odSpring` fitted its window to one of the three curves it draws.** The
  resonance panel plots the response at `gam*0.35`, `gam` and `gam*2.6`, and
  fitted `mx` using `gam` alone. **Lighter damping gives a taller, narrower
  peak** — that is the physics the demo exists to show — so the tallest and most
  instructive of the three was the one clipped: it reached **5.71** against a
  window ending at **2.24**. The fit and the draw now share one list, so they
  cannot disagree about what is on screen.
- **`wsADD` pinned a slider-dependent curve to a hard-coded top of 12.** The
  enhancement is n·log₁₀(R/r) and both n and R are the reader's to set; at the
  defaults it reaches 12.76. The top now follows the curve, rounded up to a
  multiple of 3 so the tick labels stay on the round numbers they were chosen
  for, and floored at 12 so the plot does not rescale under every small change.

**Honest, and allowed by name with the mathematics that makes each one so:**
`srTaylor` (Taylor polynomials of eˣ diverging away from a window fitted to the
function — the divergence is the lesson), `atomForces` (a symlog window sized to
hold its own ±1000 MeV tick labels, against a Yukawa well that genuinely reaches
about −70 GeV at small r), `odSeries` (truncated power series outside the radius
of convergence, with the dashed R = 1 lines drawn beside them for that reason).
The gate also **warns when an allowlist entry stops cutting**, so a stale name
cannot quietly wave through a new defect.

**And the caption that led here.** `auditsize` had reported `odSpring` drawing
"max 5.71 at 2" at y = −159, off the canvas at all eight aspect ratios.
`pvDrawFeatures` (59c) clips its markers to the plot box and then **releases that
clip before drawing the captions**, so a turning point above the top of the
window had its dot correctly hidden and its caption drawn anyway — after which
`ctFitText` pulled the caption back inside the canvas, leaving it pinned to the
top edge with nothing under it. Both loops now read one filtered list. That is
the same defect J1 fixed for curves, in the one file J1's `ctPath`/`ctDot` change
could not reach, because these markers are raw `ctx.arc`.

**The population was 1.** Measured before fixing, by instrumenting `pvFeatures`
against every plot box on all 178 stages: exactly one feature anywhere on the
site falls outside its window. Recorded because the instinct after J9 and J1 is
to assume a screenshot means dozens, and here it did not — the fix is still the
right shape, because it makes the marker and its label unable to disagree, but
it repaired one instance rather than a class. `auditsize` **8 findings → 0**;
the eight were one label at eight canvas sizes, not eight defects.

Gates: `build` 231 modules · `smoke` OK · `runtests` **4261 passed, 0 failed** ·
`auditframe` cut=3 all allowed **OK** (negative control: `wsADD`'s window put
back, gate failed) · `auditsize` **findings=0** · `auditmarks` 2303 → 20,
controls unchanged · `auditzoom` findings=0 · `auditpanel` bad=0 ·
`auditlink` findings=0 · `auditviewport` bad=0 · `auditcontrast` OK ·
`auditscan` OK.

## 2026-08-15 — a triple integral that was 471% wrong, and one that was NaN

Chasing the `PRESET-GAP` rows `auditsides` had left. `igTriple` was flagged at
`igTS=tetra igTC=cyl` with a gap of 0.785 against an exact volume of 1/6. It is
a real defect and a reader can reach it: the Cartesian/cylindrical switch is
offered for **every** solid that does not declare its own `S.cyl` form.

**Two separate bugs in one branch**, found by computing every solid's volume
both ways and comparing each against its declared exact value:

| solid | exact | Cartesian | cylindrical, before | after |
|---|---|---|---|---|
| `box` | 6 | 6.0000000 | **NaN** | 5.9855967 (0.240%) |
| `tetra` | 0.1666667 | 0.1666667 | **0.9520763 (471%)** | 0.1666781 (0.0069%) |
| `cyl` | 6.2831853 | 6.2840780 | 6.2831853 | unchanged |
| `parabsolid` | 25.132741 | 25.132674 | 25.132741 | unchanged |
| `cone` | 8.3775804 | 8.3775745 | 8.3775804 | unchanged |

**The tetrahedron.** The cylindrical route sweeps a full disc and zeroes the
slab thickness outside the solid's shadow. It tested only `y` against
`yLo`/`yHi` and never `x` against the solid's own range — and for x+y+z ≤ 1 the
upper limit `yHi(x) = 1 − x` **grows** as x goes negative, so every point of the
disc with x < 0 passed the shadow test and was integrated as solid. Hence 0.95
against 1/6. The clip now tests both coordinates, and `rmax` samples the y
extent instead of assuming the x range covers the shadow.

**The box.** A solid either carries its own x/y limits or names a `region` that
holds them. The Cartesian branch resolved `S.region` through `IG_REGIONS`; the
cylindrical branch read `S.x0`/`S.yLo` directly and got `undefined`, so the
volume was **NaN**. The shadow is now resolved once, above both branches, so
they cannot disagree about what it is.

**Why nothing caught either.** `runtests` extracts modules 21–49 and this is
stage arithmetic in `67c`, which is Programme D item 3 exactly. `auditclaims`
recomputes `IG_SOLIDS.exactVol` but by the Cartesian route, which was always
right. And the NaN never printed the word: `fmtNum(NaN)` renders `—`, so
`runall`'s NaN grep had nothing to find. **It took driving the preset product
and reading the rendered number** — which is the whole argument for `auditsides`.

The 0.240% left on the box is honest: a square shadow integrated in polar
coordinates has corner cells the Gauss rule cannot resolve, and the panel prints
that difference with its scale, which is what the stage is for.

## 2026-08-15 — the frictionless track, and a fix that was the wrong tool

`dyEnergy` printed "difference 100%" under prose reading "with no friction the
two agree". Measured, μ is already **0** — the friction hypothesis recorded
yesterday was wrong. The relative gap decays **100% → 32% → 8.9% → 2.4% →
0.51%** and settles near **0.3%** as the drop grows, which is this fixed-step
integrator's own truncation error, largest where the step is a sizeable
fraction of the motion so far.

The 100% is a different thing again. On entry the drop is **−1.4×10⁻⁶ m** — the
body is a rounding error *above* where it started — so `√(2g·drop)` takes its
`max(0, …)` branch and is **exactly zero**, while the actual speed is the
0.0132 m/s it is moving at.

**`fmtAgreeGross` was tried here first and is the wrong tool.** It floors a gap
that is *round-off* against the scale the cancellation came from; 0.0132 m/s
against a 5.16 m/s track is not round-off but a real difference between a real
speed and a clamped zero. Applying it changed nothing, which is how the mistake
surfaced. The right fix is §2.1's own instruction — *the panel must say which
case it is in rather than print a number* — so the row now reads "not yet — it
has not dropped" until there is a drop to compare against, and the prose says
what the early residual is and where it settles.

Gates: `build` 231 modules · `smoke` OK · `runtests` **4261 passed, 0 failed** ·
`auditsides` falsescale=0 presetgap=14 **OK** · `auditclaims` 249 claims
**bad=0 OK** · `auditresid` **findings=0** · `auditcustom` **bad=0 OK**.

## 2026-08-15 — a particular solution that solved a different equation

The last of the `PRESET-GAP` rows worth chasing. `odNonhom` printed a residual
of **2.37** for `|a y_p″ + b y_p′ + c y_p − g|` at `odNF=custom`, beneath prose
saying the substitution "should be zero to machine precision".

`yp(st)` tested `none`, `const_`, `poly` and `expo`, and then **fell through**
to the cosine branch for everything else. So a reader's own g(t) was answered
with `odDrivenResponse(a, b, c, 2, st.w)` — the particular solution of
**2cos(ωt)**, a different equation. The panel plotted it, called it y_p, and
printed the residual of substituting it into an equation it does not solve.

**The fix is to return null, and it is what this stage's own derivation ladder
already says**: "undetermined coefficients works only for forcings whose
derivatives stay in a finite family — polynomials, exponentials, sines.
Variation of parameters works for any g, at the cost of two integrals." That
second method is computed in the very next card, is valid for an arbitrary g,
and is checked against the RK4 solution there. So the honest panel says there is
no guess to make and points at the method that needs none — which turns a wrong
number into the reason the next section of the syllabus exists.

Written as an explicit `if(st.forcing !== 'cosine') return null` rather than a
fallthrough, so a forcing added to `OD_FORCINGS` later inherits **no** y_p
instead of the wrong one. The null branch already existed for the homogeneous
case and said "none needed — the equation is homogeneous", which is true only
there; it now distinguishes the two, and the "guess" row no longer offers a
bare em dash where no guess exists.

`auditsides` presetgap **14 → 13**, and the baseline is tightened to match.

Gates: `build` 231 modules · `smoke` OK · `runtests` **4261 passed, 0 failed** ·
`auditsides` falsescale=0 presetgap=13 **OK** · `auditresid` **findings=0** ·
`auditcustom` **bad=0 OK**.


---

## 2026-08-15 - the full-site audit, and Programme J closed

A complete pass: every harness gate run (all green at commit 825dee8), then an
independent sweep over constants, formulas, rendered values and screenshots.
The gates were honest - every defect found was in territory no gate measured.

**FIXED - five stale constants in `44a-nuclear.js`.** The block's header said
CODATA 2022; the values were CODATA 2018: NC_MP 938.27208816 -> 938.27208943,
NC_MN 939.56542052 -> 939.56542194, NC_ME 0.51099895000 -> 0.51099895069,
NC_MHE4 3727.3794066 -> 3727.3794118 (2022 value confirmed against NIST CUU),
NC_MH 938.78307348 -> 938.7830747823 (= m_p + m_e - 13.598 eV with the 2022
masses; the old value reproduced the 2018 ones to 0.03 eV). NC_QN now lands on
the measured free-neutron Q of 0.782347 MeV, which the old value missed by
1.4 eV. NC_ALPHA was the 2018 alpha while the atom and string wings carried
2022 - the site had two values of one constant, against SITE-RULES 2.4. All are
now pinned as RELATIONS to the atom wing's constants (m_H to m_p + m_e - E_B,
alpha to ALPHA_EM, and k to 1/(4 pi eps0) from the CODATA 2022 eps0 in
`37-estat.js`, replacing the pre-2019 c^2 x 10^-7), so a stale refresh can no
longer hide beside its own source. R_PROTON 0.8409 -> 0.84075 fm - the comment
claimed "CODATA 2022: 0.8409(4)"; the recommended value is 0.84075(64).

**FIXED - ASCII e-notation on rendered surfaces (F1).** 79 raw `toExponential`
call sites outside the formatter core put 308 tokens like `-1.318e-177 MeV` on
124 panel surfaces across 9 wings, against rule 1.7. All converted to
`fmtSig`/`fmtNum`, which typeset the x10^n form; eight literal "1e-13"-style
strings in display prose rewritten as superscript notation; the `ncBarExp`
helper repointed. Gated twice: `smoke.ps1` greps the cause (toExponential
outside `10-math.js`) and `auditscan.ps1` reads the effect off the harvest -
both were corrupted once and watched to fail.

**FIXED - duplicate axis tick labels (F2/J3's sibling).** `fmtNum(v, 3)` below
1 counts decimals, so any axis spanning less than ~0.01 printed the statmech
density axis as 0.002, 0.002, 0.002, 0.002, 0.001... New `fmtTick(v, step)` in
`10-math.js` derives precision from the step (7 unit tests, including a
70-axis sweep that caught the first draft delegating small steps back to the
broken formatter); both axis owners (`ctGrid`, `pvDrawAxes`) use it. New gate
`./auditticks.ps1` reads the strings the canvas actually paints, with a
corrupt control in every run. Screenshot-verified.

**FIXED - Programme J items J4, J6, J7, J8, J10-J12, J15-J20** (J13/J14 were
found already fixed by earlier class work). Populations measured first: J4's
title-through-ticks was 60 plots on 41 stages. Details in MASTER-PLAN 3.10's
progress table.

**NOTE - the qmUncertainty stage asserted Delta-x times Delta-p = hbar/2 by
multiplying sigma by 1/(2 sigma).** Both spreads are now measured as second
moments of the drawn |psi|^2 and |phi|^2 and the product printed against 0.5
with its gap - the stage note had promised exactly that and the canvas had not
delivered it.

**OK - everything else swept:** the SM particle chart (PDG 2024 throughout,
including KATRIN's < 0.45 eV), SEMF coefficients, hydrogen reduced-mass
energies, silicon carrier densities, Onsager T_c, IAU nominal values, parsec,
muon PDG values, BICEP/Keck r < 0.036. The prose-audit phantom
"KinematicsProjectilesNewton's law" was the harvester welding TOC anchors -
`audittext.ps1` now inserts separators at block boundaries, and the mechanics
row correctly reclassified as a cross-reference.

Gates after the fixes: `smoke` OK, `runtests` **4272 passed, 0 failed**,
`auditticks` OK (controls: old labelling flagged 9, chip control flagged 1).


## 2026-08-15 — D2 closed: all nine PRESET-GAP rows attributed, ratchet 9 → 0

The last unit of Programme D item 2. Each of the nine rows the `auditsides`
ratchet was holding open was measured (halve the step, read the order — J9's
discipline), then either fixed or whitelisted with its mathematics. Six were
fixed, three whitelisted. The ratchet is now **0/0 on both classes**, so any
new FALSE-SCALE or PRESET-GAP instance fails the build the moment it lands.

**Fixed — each verified by an independent computation:**

- **`rlOrbit` — three defects in one card.** (1) The "just outside the ISCO"
  preset seeded L from the *Newtonian* vis-viva; at 6.5 rs that L puts the
  pericentre inside the centrifugal barrier, the star spirals in,
  `grPeriapsisAngle` finds no second perihelion, and the readout printed the
  NaN as **"they agree to every digit"** — which is how the audit read
  `best=exact at isco`. New `grLFromTurning(GM, r1, r2)` demands both apsides
  be turning points of the full u-equation (GM/L² = (u₁+u₂)/2 −
  (GM/c²)(u₁²+u₁u₂+u₂²), the vis-viva's c→∞ limit; unit tests pin the weak
  field to 10⁻⁶ and the integrated pericentre to its declared value). The
  ISCO preset now shows the strongly precessing rosette it promised, and a
  plunge — still reachable at large e — says "no bound orbit" in the panel and
  on the canvas. (2) The gap was printed with unit **'%'** while measured and
  formula are rad/orbit. (3) The strong-field rows compare an integrated
  geodesic against a first-order formula deliberately out of its depth
  (measured gap 0.128 rad/orbit at 20 rs moves by 3×10⁻¹¹ when the step
  halves — not truncation, the physics); that row is now labelled "difference
  — beyond first order" so it is its own advisory claim and the weak-field
  "difference" claim stays gated.

- **The NaN class defect behind (1), fixed in the formatter layer.**
  `fmtGap`'s affirmative branch is `!(rel > floor)`, which is TRUE when rel is
  NaN — so any route returning no number printed as perfect agreement in every
  difference formatter (`fmtGap`, `fmtAgree`, `fmtGapTight`, and
  `fmtAgreeGross`'s NaN-gross floor). All four now refuse a verdict ("not
  computable — a route returned no number"); seven unit tests pin it. **The
  class fix immediately caught a second live instance nothing was looking
  for:** `laLSQ`'s orthogonality rows read `p.x` off points stored as arrays,
  so the scale was NaN and **"residual · column 2" and "column 3" had printed
  as perfect agreement since the stage was written**. `auditresid` surfaced it
  on the next run as a new noscale row. Fixed (`p[0]`, scale ‖r‖·max|xᵏ|).

- **`ltTransform` at the step preset (gap 5.99×10⁻⁴).** Two stacked causes:
  the readout transformed the 128-point *sketch* of the preset rather than the
  preset (piecewise-linear smear of the jump ≈ e⁻⁴·0.03 — the whole measured
  gap), and Simpson is first-order across a jump anyway (the `ltDelta` comment
  had said so for months). `fn(st)` now returns the true preset f unless the
  reader is drawing, and `ltTransform` takes declared breakpoints, integrating
  each smooth piece with one-sided endpoint sampling. u(t−2) now lands on
  e⁻²ˢ/s to 9 figures; the one-piece control test asserts the old error is
  still there when the seam is ignored.

- **`odNonhom` at expo (gap 7.77×10⁻⁵).** The RK4 comparison value was
  `ys[round(12/22·8000)]` — t = 12.0015, not 12 — against variation of
  parameters at exactly 12; the gap is y′·0.0015 to the digit. 8800 steps puts
  a node exactly at 12 and the time is read off the grid; the two routes now
  agree to 2×10⁻¹² (unit test).

- **`odSpring` at the beats demo (gap 0.0489).** The "long RK4 run" was 400
  time units at every damping; at γ = 0.02 the transient's e-folding time is
  100, so the measuring window opened with 2.9% of it left — 1.728·e⁻³·⁵⁵ is
  the measured gap to 2%. The run length now comes from the decay time
  (window opens below 10⁻⁵ of the response, capped at T = 2000), the peak is
  parabolically refined once at the argmax (a first draft refined every
  ascending sample; a parabola through |y|'s kink at a zero crossing invented
  an amplitude of 3.2 — the gate caught it before it shipped), and below the
  damping where no practical run settles the panel says which case it is in
  (γ = 0: "never — the motion is the beat pattern").

- **`igTriple`, box × cylindrical (0.240%, shipped knowingly two entries
  above).** The disc sweep zeroed the slab thickness outside the shadow — an
  integrand with a cliff, and Gauss points that straddle a cliff lose their
  order entirely. Same theorem as the ltTransform fix: the radial integral now
  breaks at the shadow's rim (scan + bisection per ray, the traceSlice trick)
  and the θ integral breaks at the shadow's corner directions (the tetrahedron
  had been exact **by luck** — its corners sit at 0 and π/2, on panel seams;
  the box's corner at atan(1/2) sat mid-panel). All five z-simple presets now
  agree through the cylindrical route to 1.5×10⁻⁹ or better, measured before
  and after: box 5.9856 → 6.0000000087.

- **`dfHarmonic` at log r (gap 0.47).** The default circle (centre (0.4, 0.3),
  r = 0.8) **encloses the origin** — the singularity of the fundamental
  solution — and the mean value property's hypothesis fails at that point
  while the prose promised agreement "for every radius and every centre". The
  gap is exactly log(r/d) = log(0.8/0.5) = 0.4700036, confirmed to 8 figures
  against the circle quadrature. The card now has three honest cases, each a
  two-route comparison: harmonic on the disc (mean = centre); singularity
  enclosed (mean = **log R, wherever the centre sits** — Gauss's law in two
  dimensions, and the reader can drag the circle and watch the average ignore
  the centre); not harmonic (mean − centre priced by Green's representation,
  new `dfDiscLapAvg` = (1/2π)∬∇²f·log(R/ρ)dA, which lands the bowl's R² gap
  to 2×10⁻³ and is unit-tested). A circle through the singularity says "not
  defined there".

**Whitelisted with their mathematics (the row IS the demonstration):**

- `igApply` — "the sum of N slices" against the adaptive integral, with a
  slices slider; igDoubleRect one dimension down. The disk preset reads exact
  only because πf² is linear there and the midpoint rule is exact on linears.
- `mvTangent` — Δf against the differential at dx = dy = 0.01: the gap is the
  second-order remainder ½(f_xx+2f_xy+f_yy)·10⁻⁴ that the card above it
  measures falling as h²; the panel now names it. The saddle read exact only
  because dx = dy annihilates x²−y²'s quadratic form.
- `agInverse` — the custom default x³−2x is the canonical non-one-to-one
  cubic: f(1.2) = −0.672 is also hit at 0.359 and −1.559, bisection returns
  the leftmost branch, and |−1.559−1.2| = 2.76 is the measured gap; the
  readout prose teaches exactly this. The preset inverses cannot hide behind
  the entry: a unit test round-trips every AG_FUNCS inverse at x = 1.2.

**And the Monte-Carlo comparison now carries its own error bar.** A typed
solid's second route is 120 000 darts; `igSolidMC` returns the estimate with
σ = box·√(p(1−p)/N), the label prints "± σ", and the difference row states the
gap in units of σ (the default paraboloid's 0.136 is 1.5σ). Its label names
the estimate, so the claim separated from the presets' exact one — which is
what un-masked the box row above the same hour.

**Negative control:** one whitelist key corrupted (`igApplyXX`), gate failed
presetgap 1/0 exit 1, restored, gate green.

Gates on the final build: `build` 231 modules · `smoke` OK · `runtests`
**4290 passed, 0 failed** (18 added) · `auditsides` **falsescale 0/0,
presetgap 0/0 OK** · `auditresid` **findings=0** noscale=7 · `auditcustom`
**bad=0 OK** · `auditclaims` 249 **bad=0 OK** · `auditpanel` **bad=0** ·
`auditframe` cut=3 all allowed **OK** · `runall` demos=593 **caught=0 OK**.


## 2026-08-15 — D3 built: the stage-level two-route suite, red on its first run

Programme D item 3, the last open verification item. `runtests.ps1` extracts
modules 21–49 only, so none of the 178 stages' own arithmetic was unit-tested —
the blind spot `igTriple`'s 471% tetrahedron shipped through. New
**`./runstagetests.ps1`** wraps the real built bundle in headless Chrome and
runs **`tests-stages.js`** inside it: direct calls to stage helpers with
synthetic states, no DOM driving, no rendered-text regex. The membership rule
is MASTER-PLAN §3.4's own: helpers with **two routes to the same answer**,
tolerances set from each route's measured error, never guessed.

**The seed corpus, 41 assertions:** `igTriple.volume` — every preset through
every route it offers plus the typed paraboloid by Cartesian, cylindrical and
Monte-Carlo-within-4σ routes; `odNonhom.yp` substituted back into its own
equation for all four guessable forcings, and pinned to `null` for custom and
homogeneous (the fallthrough class); `laLSQ.fit` — residual ⊥ every design
column **and** unimprovability (nudging any coefficient must raise the rss —
a second route that knows nothing about normal equations); `rlOrbit.setup` —
every preset bound, second perihelion reached, mercury landing on the
first-order formula; the three `dfHarmonic` mean-value cases; `agCur`'s
bisection branch pinned to −1.559 so the auditsides whitelist entry stays
true. Plus an **in-run corrupt control**: the pre-fix box clip is recomputed
every run and the suite must see its 0.24% disagreement, so a run that cannot
fail is itself a failure.

**Its first run was red for a real reason, which is the whole argument for the
gate.** `rlOrbit` at the ISCO preset: the readout integrated φ ≤ 4π, but this
close to the separatrix the apsidal angle grows without bound and the second
perihelion lay outside the span — so a **bound zoom–whirl orbit** fell into
the branch written for a plunge and the panel said "the star spirals in",
which is false. The readout now integrates to 16π and names three cases
honestly: a rosette (number printed), a whirl ("more than 8 revolutions
between perihelia — the zoom–whirl regime"), and a genuine plunge (no L makes
both apsides turning points). The suite asserts all three presets reach a
second perihelion inside 16π.

With this, **Programme D is closed** — items 1 (auditclaims), 2 (auditsides,
both ratchets 0) and 3 (this) — and what survives is the standing rule: a
stage defect class fixed adds its two-route test to `tests-stages.js` the same
day, and a new wing's two-route helpers get tests as they are written.

Gates: `build` 231 modules · `smoke` OK · `runstagetests` **41 passed, 0
failed OK** (first run 40/1, the real ISCO finding above) · `runtests` **4290
passed, 0 failed** · `auditsides` falsescale 0/0 presetgap 0/0 **OK** ·
`auditresid` **findings=0** · `runall` demos=593 **caught=0 OK** · `auditdocs`
**bad=0 OK** (29 scripts, all described).


## 2026-08-15 — Programme A begins: emFaraday's typed B(t), Faraday as the Leibniz rule

The first of Programme A's queued editors (§4.3 item 6), and the one MASTER-PLAN
called the highest value-per-unit-work in the programme. `emFaraday` gains a
second scene: **type any B·n̂(x, y, t) over the loop's plane** — x, y the plane
coordinates, t rewritten onto the parser's third slot (the `pkIndexAst` trick),
with a literal z rejected by its own error message rather than silently read as
time.

**The theorem the presets were allowed to assume** (§2.9's rule): for a fixed
loop, Faraday's law *is* the Leibniz rule d/dt ∬B·dA = ∬(∂B/∂t)·dA. The panel
computes the EMF both ways — differentiate outside (192 midpoint rings, slope
at h = 10⁻³) and differentiate inside (∂B/∂t at every sample, Gauss–Legendre
radial rule, h = 2×10⁻³) — **no shared samples, steps or rules**. On the
default field they agree to **5.74×10⁻⁶ relative at every instant measured**
(t = 0.2 … 4.2): a constant relative gap is precisely the signature of spatial
quadrature truncation, and the demo's `out:` quotes that number with the
attribution. A static B makes both routes vanish together, and fmtAgree's floor
says so honestly. Lenz's sign is printed as a sentence about what is opposed.

**The gate caught the first draft.** At the display resolution of 24 rings the
routes disagreed at 3.1×10⁻⁴ — the midpoint rule's own O(h²), which the new
`runstagetests` failed on before it shipped. The comparison now runs at 192
rings; the frame's history plot keeps the cheap grid, because a picture needs
three digits and a comparison does not stop there.

Mechanics: scene seg (`efS`, label carries "your own" so `auditcustom` finds
it), `fnHtml`/`fnWire` box with a custom build guard, `pkPretty` echo, heatmap
scene via `ctHeat` (bitmap rule), history plot factored and shared with the
magnet scene, a derive rung on the Leibniz identity, demo inserted mid-group
(safe: the wing's only index-based see-link targets another group), and 4 new
stage-level tests (45 total).

Gates on the final build: `build` 231 modules · `smoke` OK · `runstagetests`
**45 passed, 0 failed** (first draft failed at 24 rings — see above) ·
`auditcustom` **bad=0 OK** (stages 98 → 99, boxes 134 → 135 — the new path is
driven) · `auditsides` falsescale 0/0 presetgap 0/0 **OK** · `auditresid`
**findings=0** · `auditlink` **OK** (two new control ids, both restorable) ·
`auditpanel` **bad=0** · `runall` demos=**594** controls=6462 **caught=0 OK** ·
`auditdocs` **bad=0 OK** (594 experiments propagated by `-Fix`, diff read).
Screenshot looked at: the heatmap scene, both EMF rows, the 5-figure agreement.


## 2026-08-15 — atomSM's typed particle content: anomaly cancellation in exact integer arithmetic

The second of Programme A's queued editors, and the one §3.1 said needs no
engine — the rep tables and the rational arithmetic live on the stage object
in `60e`, where `runstagetests` reaches them. `atomSM` gains a second scene:
**type a particle content** — one left-handed Weyl multiplet per line as
`name SU(3) SU(2) Y`, with Y required to be an exact fraction (a decimal is
rejected with its line number and the reason: the sums must stay exact).

**The property the presets were allowed to assume** (§2.9's rule): that the
Standard Model's content is quantum-mechanically consistent at all. Six checks
are computed over whatever the reader lists, all in **integer arithmetic**
(numerator/denominator with gcd reduction — no floats anywhere in the claim):
[SU(3)]³, [SU(3)]²U(1), [SU(2)]²U(1), [U(1)]³, grav²U(1), and Witten's doublet
parity. **Verified for one SM generation: every numerator is exactly 0** —
[U(1)]³ adds five fractions over denominator 216 and lands on 0/1, not 10⁻¹⁶ —
and the doublet count is 4, even. **Verified that removing any one of the five
multiplets breaks at least one check** (all five removals asserted in
`runstagetests`; deleting `ec` prints −1 on exactly the two sums a
colour-and-SU(2) singlet can reach — [U(1)]³ and grav²U(1); deleting `uc`
breaks even the pure three-gluon triangle, +1). That is §3.1's acceptance test,
measured rather than asserted.

**The two-route claim**: the gravitational sum ΣY·d₃·d₂ over multiplets equals
ΣQ = Σ(T₃+Y) over the expanded component fermions, because each multiplet's T₃
cancel pairwise — a different arithmetic path to the same reduced fraction.
Asserted equal **as exact fractions** on the SM content (0 = 0) and on a
broken content (−1 = −1). The panel prints both and says the routes agree "to
every digit — integer arithmetic, no tolerance", which is the honest verdict
where fmtAgree's floor would be a category error (there is no round-off to
floor).

One claim of my own the arithmetic overruled mid-session: the help text first
said deleting `ec` fails *three* checks; the sums say two ([SU(2)]²U(1) cannot
see an SU(2) singlet). Fixed in all three places before the build ever went
green — which is what computing the claim, rather than remembering it, is for.

Mechanics: scene seg (`asmSc`, label carries "your own"), Shape C textarea
(`asmSheet`, `data-audit` holds a *broken* generation so the audit exercises
the failure path), parser that never throws and keeps the previous content on a
bad edit, five waterfall staircases drawn per triangle with per-column exact
nets (`= 0` labels are non-numeric by design so `auditticks` cannot read them
as tick labels), `dockLegend:true` (the floating key covered the first
column's caption — seen in the session's first screenshot, fixed, re-shot),
verdict colours matched to the stylesheet's own semantics (`.err` is
`--c-pos`; green `--c-grad` affirms), two derive rungs, demo appended at the
END of its group (see-link safety), and 8 new stage-level tests (53 total).

Gates on the final build: `build` 231 modules · `smoke` OK · `runtests` **4290
passed, 0 failed** · `runstagetests` **53 passed, 0 failed** · `auditcustom`
**bad=0 OK** (stages 99 → 100, boxes 135 → 136) · `auditsides` falsescale 0/0
presetgap 0/0 **OK** (79 demos, 793 combos, 5692 renders) · `auditresid`
**findings=0** noscale=7 · `auditticks` **OK** · `auditpanel` **bad=0** ·
`auditsize` **findings=0** · `auditderive` **flagged=0** · `auditlink` **OK**
(new ids `asmSc`/`asmSheet` restorable) · `runall` demos=**595** **caught=0
OK** (run twice — once mid-session, once after the legend/colour fix) ·
screenshots looked at twice (the first found the covered caption).


## 2026-08-15 — emWave's typed source: the speed of light as an output

The third of Programme A's queued editors. `emWave` gains a second scene:
**type any sheet current K(t)** (t in nanoseconds; a stray x, y or z is
rejected with its own message), and the two curl equations are marched on a
1-D staggered grid by `emFDTD1D` (`47a-em-typed.js`, inside the unit-tested
21–49 window). **The update rule contains 1/ε₀ and 1/μ₀ separately — the
product μ₀ε₀ never appears in the dynamics** — so the propagation speed is a
property the march produces, and the panel measures it before comparing.

**Three claims, all measured on the default Gaussian pulse:**

- **c from the transit**: the front (2% threshold, linearly interpolated) is
  timed at probes 10 m apart — 33.356 ns, i.e. 299 795 488 m/s, which is
  **1.01×10⁻⁵ relative** from 1/√(μ₀ε₀) = 299 792 458 m/s. The §3.1
  acceptance was 1e-4; the measurement beat it by an order of magnitude.
- **The impedance of free space**: √(∫E²/∫H²) at the far probe = 376.7361 Ω,
  **1.5×10⁻⁵** from √(μ₀/ε₀).
- **The whole waveform**: the FDTD field at probe B against the retarded
  closed form −(μ₀c/2)·K(t − x/c), sampled fresh from the reader's K —
  rms **1.6×10⁻⁵ of peak**.

**Attribution of the residual, by J9's rule (truncation vs round-off):**
halving the Courant fraction moves the measured c by 2.9×10⁻⁵ (inside the
claim), and **halving dx cuts the closed-form mismatch by 4.00×** — measured
second order, exactly the grid's dispersion, so the residual is the scheme's
truncation and not physics. Both assertions are pinned in `tests.js` (6 new
unit tests); the stage path adds 5 more in `tests-stages.js` (the build guard,
the acceptance, the impedance, the compute cache, and the sign convention —
the radiated E opposes a positive sheet current, computed not asserted).

Timing method note, recorded because the wrong one looked fine: a centroid of
|E|² was tried first and is wrong for a switched-on step (it lands mid-record
at both probes and reports 2c); the front-threshold crossing is what shipped.

One instance of the session's own defect class: the first build broke smoke —
a duplicated `frame(st, dt, ctx, W, H){` header left by an edit, exactly the
"one stray character takes the whole app down" failure `smoke.ps1` exists for,
and it caught it in ten seconds.

Mechanics: scene seg (`ewSc`, label carries "your own"), `fnHtml` box whose
hint names t so `auditcustom` offers it a t-only formula, `mode` as a function
of state (the wave scene stays 3-D, the typed scene is 2-D plots — the
`63b`/`65b` pattern), `dockLegend:true` after the screenshot showed the
floating key covering the lower plot's axis (the same class as atomSM's
covered caption, found the same way), compiled K cached on the result so
`frame()` never re-parses, two derive rungs, demo appended at the END of its
group with every number in `out:` measured this session.

Gates on the final build: `build` 231 modules · `smoke` OK (after the catch
above) · `runtests` **4296 passed, 0 failed** · `runstagetests` **58 passed,
0 failed** · `auditcustom` **bad=0 OK** (stages 100 → 101, boxes 136 → 137) ·
`auditsides` falsescale 0/0 presetgap 0/0 **OK** (80 demos, 795 combos, 140
claims) · `auditresid` **findings=0** · `auditticks` **OK** · `auditpanel`
**bad=0** · `auditzoom` **findings=0** · `auditframe` **OK** (cut=3, the three
allowed) · `auditlink` **OK** (`ewSc`/`ewSrc` restorable) · `runall`
demos=**596** **caught=0 OK** · screenshots looked at twice (the first found
the covered axis).


## 2026-08-16 — emSandbox's laws card closes the EM wing: Laplace residual and the Poynting balance, and auditsides earns its keep

The fourth of Programme A's queued editors, and the one where the reader's
arrangement was already typed — the placement tools are the editor. What was
missing was §3.1's measurement: the properties the presets were allowed to
assume, computed for whatever the reader builds. `emDivAt`, `emBallU` and
`emPoyntingBalance` live in `47a` (unit-tested window); the card and its
adaptive audit sphere live on the stage.

**Measured, engine route (tests.js, 7 new unit tests):**

- **∇·E off the sources** (the Laplace residual, since E = −∇V): 4th-order FD,
  1.8×10⁻⁷ of gross at h = 0.02 on the dipole — acceptance was 1e-6.
- **∇·B**: 7.4×10⁻⁸ of gross on a wire + magnet arrangement.
- **Poynting balance for a uniformly moving charge** (an exact Maxwell
  solution): ∮S·dA vs −dU/dt agree to **8.2×10⁻⁴**, attributed to the angular
  quadrature — doubling the node count cuts the residual **4.06×** (measured
  O(N⁻²), J9's rule).
- **The moving magnet misses honestly**: its pair (B rigid, E = −v×B) is first
  order in v/c, so the balance residual is the model's O(β²) — halving v cuts
  it **4.46×**, asserted. The card says this in prose whenever a magnet moves.
- **Static charge + wire**: net flux 4.6×10⁻¹⁸ and dU/dt = 0 against a finite
  circulating gross ∮|S|dA — energy flowing in closed loops, printed with the
  gross that makes the verdict honest.

**auditsides caught the card's own defect the day it shipped — two FALSE-SCALE
rows, and the fix is a textbook instance of the fmtAgreeGross doctrine.** The
first gross was Σ|∂ᵢFᵢ| — the sum of the derivative *terms*. On the default
dipole the probe sits on the arrangement's symmetry plane, where E is purely
x̂ and even in x, so all three terms cancel *identically* and that gross was
itself round-off: the panel printed a 100% disagreement over a perfect
cancellation (gap 5.8×10⁻¹⁷ against a scale of 5.8×10⁻¹⁷). The gross is now
the sum of |coefficient × sample|/12h over the whole stencil — what the zero
cancelled OUT OF — and an identically vanishing field (the B of static
charges, fmax = 0) becomes prose ("nothing to differentiate") rather than a
ratio of two round-offs. Both cases are pinned as same-day regressions in
`tests-stages.js`; `auditsides` returned to falsescale 0/0. Under the honest
gross the demo arrangement's Laplace residual reads 2.4×10⁻⁹.

Mechanics: adaptive sphere `ballOf` (¾ of the way to the nearest object,
clamped — the balance is always source-free by construction, and a probe ON a
source gets the delta-function prose instead of a spike), the sphere drawn
dashed with a 10px label when Poynting display is on, `o.probe` accepted in
`enter`, demo appended at the END of its group after a mid-edit mangle briefly
put it mid-group and beheaded the compass item — smoke's see-link resolution
plus a structure diff caught it before anything shipped.

Gates on the final build: `build` 231 modules · `smoke` OK · `runtests`
**4302 passed, 0 failed** · `runstagetests` **65 passed, 0 failed** ·
`auditsides` falsescale **0/0** presetgap 0/0 **OK** (82 demos, 143 claims;
the 2 findings above fixed same-day) · `auditresid` **findings=0** ·
`auditpanel` **bad=0** · `auditticks` **OK** · `auditlink` **OK** ·
`auditcustom` **bad=0 OK** · `runall` demos=**597 caught=0 OK** · screenshot
looked at (audit sphere, label, probe clear of sources).
