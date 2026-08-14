# Calculus, Fields & the Atom — an interactive mathematics and physics laboratory

One self-contained web app, forty wings covering AP Calculus AB and BC, linear algebra, differential equations, complex analysis, AP
Physics 1 and 2, AP Physics C (Mechanics and E&M), and the whole of multivariable
calculus and vector calculus beyond them. Every
control panel sits in a resizable dock beneath the canvas; drag the border
between them (or focus it and use the arrow keys) to trade picture for panel.

## Single-variable calculus — AP Calculus AB & BC

- **lim Limits & Continuity** — every limit *measured*, by marching in geometrically
  from both sides and reporting what the values settle on. The ε–δ definition is
  played as a game: you name ε and the lab finds the largest working δ by
  **bisection**, actually testing whether every x within δ lands within ε. All four
  failure modes (removable, jump, infinite, essential), continuity's three
  conditions checked separately, the squeeze theorem, and the Intermediate,
  Extreme and Mean Value theorems with every witness located numerically.
- **d/dx Derivatives & Applications** — the secant pivoting onto the tangent, with
  forward, backward and symmetric quotients drawn converging on the symbolic
  answer. |x| at 0 shows differentiability failing while continuity holds.
  Curves analysed by root-finding on their own symbolic derivatives (an inflection
  requires f″ to **change sign**, so the search rejects x⁴ at the origin);
  optimisation that takes the endpoints seriously; related rates computed
  analytically *and* by finite difference on the constraint; Newton's method
  converging quadratically — and, on one deliberately chosen cubic, falling into a
  two-cycle and never converging; and L'Hôpital's rule shown returning a **wrong
  answer** on a non-indeterminate form, with the hypothesis checked first.
- **Σ Sequences & Series** — partial sums drawn converging or not, with every test
  run on the actual terms including the many cases where the honest verdict is
  "inconclusive". The alternating error bound printed beside the error that
  occurred; Taylor polynomials with a Lagrange remainder computed from a **sampled**
  maximum of the (n+1)th derivative; radii of convergence measured by the root test.
  The integral test integrates to a finite cut-off and pushes it out three more
  orders of magnitude — mapping infinity onto a finite endpoint instead lets a
  logarithmic divergence hide inside the quadrature's truncation, and Σ1/n comes
  back "convergent" (a real bug here, caught by a test asserting the naive route
  is wrong).
- **ÿ Differential Equations** — slope fields, Euler against Heun against RK4 with
  each observed order measured by halving h, separable equations, exponential and
  logistic growth; then second order: characteristic roots colliding as damping
  crosses critical, the stray *t* in the repeated-root case, the Wronskian against
  Abel's formula, resonance peaking **below** ω₀, beats, and power series generated
  by running their own recurrence — with termination turning out to be quantisation.

## Multivariable calculus
- **⟶ Vectors & the Geometry of Space** — the two products, built rather than
  quoted: drag two arrows and watch the dot product cast its shadow (with the
  leftover orthogonal to 15 digits) and the cross product sweep its area. Both
  definitions of `a·b` are computed independently and differenced; Lagrange's
  identity is checked at every setting. Then lines in space with point–line and
  skew-line distances derived from projections, planes and their normals with the
  signed half-space test, the six quadric surfaces **drawn from their own
  horizontal traces**, and cylindrical/spherical coordinates whose volume elements
  are obtained by differentiating the coordinate map numerically and taking the
  determinant — no formula consulted.
- **γ Curves & Motion** — cycloids and astroids whose cusps are *located* by
  root-finding on |r′|² rather than drawn in; polar roses, cardioids and
  lemniscates with the swept area ½∫r²dθ accumulating live; the conic sections as
  one focus–directrix definition with one number turned, with the constant ratio
  printed as you move along the curve and the ellipse's perimeter checked against
  Ramanujan. Then space curves: the **Frenet frame** built vector by vector with
  its three orthonormality checks printed as zeros, curvature and torsion against
  their closed forms, the osculating circle, and acceleration split into
  `a_T = d|v|/dt` and `a_N = κ|v|²` with the residual `a_T² + a_N² − |a|²` shown to
  be zero. Kepler's second law is obeyed rather than drawn — the position comes
  from solving `M = E − e sin E`, and the two wedge areas are measured.
- **∂ Partial Derivatives** — every derivative on this floor is **symbolic**,
  differentiated by the same engine as the vector wing. Contour maps and traces;
  limits that pass on every straight line and fail along a parabola, with the
  decisive **polar spread** measured as the radius shrinks; partial derivatives as
  the slopes of drawn tangent lines; Clairaut's theorem checked along two different
  chains of algebra; tangent planes whose worst error over a circle of radius h is
  measured falling as h² (and refusing to, for a cone at its vertex); the chain
  rule checked against a direct difference of the composite; implicit
  differentiation; **critical points found by Newton from a grid** and classified
  by the Hessian's discriminant, with its eigenvectors drawn; Lagrange multipliers
  solved by root-finding on ∇f × ∇g, with λ read live; and the Jacobian, whose
  determinant is compared against the measured area of a mapped cell.
- **∫ Integration** — nothing recited. Riemann sums with all five rules and their
  **measured** order of convergence (log₂ of the error ratio: 1, 2 and 4, dropping
  honestly to ~1.5 on √x), textbook error bounds with a sampled K; the Fundamental
  Theorem with the accumulated area differenced back into the integrand, and
  `e^(−x²)` as the case where Part 2 is simply unavailable; areas, volumes by discs
  and shells, arc length, work and averages. Then up a dimension twice: double
  Riemann sums as drawn columns, Fubini with both orders computed independently,
  Type I/II regions with a **Monte Carlo cross-check that never sees the limit
  functions**, polar wedges with `r dr dθ` derived from exact cell areas, the
  Gaussian integral by going up a dimension, triple integrals over solids peeled
  one variable at a time, cylindrical and spherical elements with the `sin φ`
  effect measured at the pole, mass/centroids/moments of inertia with the
  perpendicular- and parallel-axis theorems verified, and the change of variables
  with the error that omitting |J| would cause printed in full.
- **∇ Vector Calculus — the Integral Theorems** — every theorem computes *both*
  sides with quadrature that knows nothing about it, and prints the difference.
  Scalar and vector line integrals accumulating in real time; conservative fields
  tested along three genuinely different routes, with the potential recovered by
  two staircases and the **punctured plane** showing zero curl and 2π circulation
  at once; Green's theorem in circulation and flux form plus the planimeter;
  parametrised surfaces, dS = |r_u × r_v| and flux with orientation; **Stokes'
  theorem with four caps whose areas differ by a factor of two and whose fluxes
  agree to 10⁻⁶**; and the divergence theorem on a sphere and a cylinder, including
  the inverse-square field whose divergence is zero and whose flux is 4π anyway.
  The last groups are the field engine itself — type any expression and watch its
  gradient, divergence and curl differentiated **symbolically**, with a physics
  builder (charges, masses, wires, dipoles, antenna arrays) and Newton's-law test
  particles.
- **ÿ Differential Equations** — every closed form is drawn on top of an RK4
  integration of the same equation, and the largest gap is printed. The
  characteristic roots colliding on the real axis as damping crosses critical; the
  stray `t` in the repeated-root case; the Wronskian checked against Abel's
  formula; undetermined coefficients with the residual from substituting y_p back
  in; variation of parameters as an independent second route; the resonance peak
  that is **not** at ω₀, with the steady-state amplitude measured from a long
  integration; beats; the RLC circuit printed as the same equation in another
  vocabulary; and power series generated by running their own recurrence, with the
  radius of convergence measured by the root test — and termination turning out to
  be quantisation.

## Classical physics — AP Physics 1, 2 & C

- **⇉ Mechanics** — three kinematic graphs that are one motion, with the
  displacement computed both from the closed form and by integrating the area under
  v(t). Projectiles in vacuum and with quadratic drag (RK4, no closed form).
  Free-body diagrams whose arrows are drawn to scale so their vector sum really is
  the reported net force. An energy ledger that stays flat while friction eats into
  it. Collisions where Δp reads zero at **every** elasticity and the loss matches
  ½μ(Δu)²(1−e²). Orbits integrated from F = GMm/r² alone with a symplectic stepper —
  the ellipse is a *result*, and angular momentum holds to a part in 10⁹.
- **↻ Rotation** — every moment of inertia obtained by integrating r²dm over the
  body and printed beside the table value; the parallel-axis theorem verified the
  same way; a race down a ramp decided by shape alone, with mass and radius
  cancelling exactly; a skater who speeds up because L is conserved while K is not,
  with the energy difference identified as the work their arms did; and a gyroscope
  precessing at τ/L.
- **≈ Oscillations & Waves** — SHM as the *universal* small-amplitude limit: the lab
  fits U″ to an arbitrary potential well and predicts its period. The pendulum's
  exact period from a complete elliptic integral, running 18% slow at 90°. Standing
  waves quantised by their boundary conditions (and why a clarinet is not a flute),
  beats, and a Doppler shift whose asymmetry between moving source and moving
  observer betrays the medium.
- **≋ Fluids & Thermal Physics** — Archimedes **derived** by differencing pressure
  over a submerged cube rather than quoted; Bernoulli with both totals computed
  independently and compared; the Reynolds number printed so you know when to stop
  trusting it. Then the gas laws with the work taken as the area under the actual
  P–V path by quadrature and the first law *checked* rather than used; the
  Maxwell–Boltzmann distribution integrated to recover its own three averages; and
  an entropy ledger that is exactly zero for a reversible cycle and strictly
  positive otherwise.
- **◇ Optics** — Snell's law **produced** rather than assumed: the lab scans every
  crossing point for the least-time path and then checks that n₁sinθ₁ = n₂sinθ₂
  holds there. Total internal reflection, ray diagrams that meet where the lens
  equation predicts, the double slit with its **missing orders** where an
  interference maximum lands on an envelope zero, gratings sharpening by a factor
  of N, and the three-polariser puzzle where inserting a filter lets more light
  through.

## Fields & modern physics- **⚡ Electromagnetism** — a sandbox where you place charges, moving charges, bar
  magnets, moving magnets, current wires and pickup loops, drag them around, and
  press Run to watch them interact under F = q(E + v×B) and τ = m×B; plus one stage
  per Maxwell equation — Gauss's law, no monopoles, Faraday (with Φ_B and the induced
  EMF plotted live), the Ampère–Maxwell displacement current at a charging capacitor,
  and the electromagnetic wave the four equations predict. Every stage can be viewed
  as the flat z = 0 plane or in **full 3D** (drag to orbit, scroll to zoom), where field
  lines are traced through the volume and the Gaussian surfaces are real spheres. Each
  stage measures *both* sides of its law by independent numerical routines, so the
  agreement is evidence.
- **⧖ Relativity — Special & General** — Einstein's thought experiments, each drawn
  in *both* frames at once so the disagreement is on screen rather than described:
  chasing a light beam (which fails, and the readout shows why it must — E² − c²B²
  is invariant and zero for light); the train and the embankment, where simultaneity
  dies first; the light clock, with the right triangle closing to machine precision;
  the ladder and the barn, whose paradox is two spacelike-separated door-closings;
  the falling lift; and Ehrenfest's rotating disk, where flat geometry breaks with no
  gravity anywhere in sight. Then a draggable **Minkowski diagram** with calibration
  hyperbolae, velocity addition against rapidity, the twin paradox with its simultaneity
  jump *and* a light-signal ledger that balances exactly, and a 1 g rocket with its
  Rindler horizon. Mechanics: **E² = (pc)² + (mc²)²** drawn as the mass shell, plus
  cosmic-ray muon survival with and without dilation (a factor of 10⁹). Electromagnetism:
  the six-component field transformation with both invariants swept flat against β, the
  pancaked field of a moving charge, the **field tensor** boosted by literal matrix
  conjugation **F′ = ΛFΛᵀ** and checked against the component formulas, and the
  current-carrying wire — neutral in the lab, charged in the test charge's frame,
  with the magnetic and electrostatic answers agreeing to the last bit. Curved
  spacetime: the Schwarzschild metric on Flamm's paraboloid, **Mercury's 43″ per century
  integrated from the geodesic** (not quoted), starlight bending **1.75″** at the solar
  limb from the integrated null geodesic, a fall through a horizon with proper and
  coordinate time side by side, and LIGO's chirp computed from the post-Newtonian
  frequency evolution. GPS, Pound–Rebka, Shapiro and the tidal-force scaling all come
  out of the same constants.
- **⚙ Circuits** — a working circuit simulator: a schematic editor where you place
  resistors, capacitors, inductors, transformers, mutual couplings, diodes, switches
  (manual, timed and voltage-controlled), op amps and all four dependent sources, wire
  them pin to pin and run them in time. Two draggable probes turn it into a bench meter:
  put them anywhere on any circuit and it reports the potential difference, the Thévenin
  equivalent looking back into those terminals, the current a short between them would
  carry, and the power a matched load could draw. Solved by **modified nodal analysis** in real SI
  units, with trapezoidal companion models for the reactive parts and Newton–Raphson for
  the nonlinear ones. Seven instruments share one bench — oscilloscope, Bode plotter, DC
  sweep, spectrum with THD, power budget and rotating phasor diagram — and thirteen source
  waveforms plus **any function of t you type**. Kirchhoff's current law and Tellegen's
  power theorem are recomputed from each part's own constitutive law every frame, so the
  residuals shown (femtoamps, femtowatts) are evidence rather than assertion. A field
  overlay solves **∇²V = 0** on the real conductor geometry and draws **E = −∇V**, putting
  back the field that circuit diagrams hide — fringing at capacitor plates included —
  and a **Biot–Savart** overlay draws the magnetic field the currents actually make,
  checked against µ₀I/2πd and the square-loop closed form. Instruments include a
  combined **time + frequency** view, so a filter's effect on a waveform and on its
  spectrum are visible at once.
- **∿ Fourier Analysis** — why the transform works, not just how. A winding machine
  that wraps a signal round a circle and marks its centre of mass, so orthogonality
  is something you watch rather than take on faith; Fourier series with Gibbs
  measured (it converges to 1.1790 and refuses to shrink); transform pairs and the
  uncertainty product measured off the curves; sampling, aliasing, leakage and
  windows; the FFT timed against the definition it replaces, in the browser, with
  both results compared; the inverse transform and lossy compression; and the
  convolution theorem computed by two independent routes that agree to 10⁻¹⁶.
- **ψ Quantum Mechanics** — exact closed-form solutions animated live: a dispersing
  free wave packet, Heisenberg's Δx·Δp = ħ/2 as a dual position/momentum plot, the
  particle in a box with beats, the double slit built one particle at a time with a
  which-path coherence knob, measurement collapse (evolve → measure → collapse →
  re-spread), tunnelling with exact T and R, spin on the Bloch sphere, Stern–Gerlach
  chains, the Pauli exchange hole, and hydrogen orbitals whose eigenvalues the probe
  verifies (∇²ψ/ψ) at any point.
- **⚛ The Atom & the Four Forces** — the atom across its scales (electron cloud
  sampled from the true |ψ₁ₛ|², nucleus with pion exchange, quarks trading gluons
  with colour bookkeeping), animated force carriers (virtual photons, gluons, the
  W⁻ in triggered β decay, hypothetical gravitons drawn dashed), all four potentials
  on one chart with real constants (ħc = 197.327 MeV·fm, α = 1/137.036, real masses),
  the Standard Model tile map, the β spectrum with its 0.782 MeV budget, and the curve
  of binding energy. (The boosted-Coulomb stage that used to live here has moved to the
  relativity wing, where the rest of its argument now is.)
- **α′ String Theory** — the one wing where much of the subject is unsettled, so it is
  built to let you argue rather than to reassure, and every claim is labelled as a
  theorem, a checked conjecture, a disputed construction or a hope. It starts with the
  measurement the field grew out of: spin against mass squared for six PDG 2024 mesons,
  least-squares fitted with r² and residuals shown, giving a string tension that is then
  checked against the atom wing's Cornell-potential value — two fits with no data in
  common, agreeing to 2%. Then the graviton that appears in the closed-string spectrum
  whether anyone wanted it or not; the critical dimension **solved for twice**, by
  polarisation counting and by the conformal anomaly, with ζ(−1) obtained from an
  exponential cutoff and from the functional equation independently and compared; and the
  Casimir pressure, which is that same regularisation measured in a laboratory to better
  than a percent. After that the hard part: Kaluza–Klein and winding towers with T-duality
  verified numerically on your own quantum numbers, large extra dimensions placed against
  what the Eöt-Wash and HUST torsion balances and the LHC have actually excluded, a warped
  Randall–Sundrum dimension whose predicted gravitons the LHC has already pushed past, a
  real slice of the Fermat quintic drawn from its parametrisation, the KKLT potential with
  its minimum located by bisection and its uplift *solved for* so the tuning is visible,
  and the swampland conjectures run against the measured bound on the tensor-to-scalar
  ratio. It ends with the two results the field is judged on, both computed twice: a black
  hole's microstates counted in a two-dimensional CFT and its horizon area measured in
  five-dimensional supergravity, and a Ryu–Takayanagi entanglement entropy obtained by
  integrating a bulk geodesic and by a boundary CFT formula — with the difference printed
  in both cases.

Published copy: https://claude.ai/code/artifact/289811c9-07a8-4419-87cc-b4b55e04a538

## Layout

- `src/` — the source modules. There are 231 of them, one concern each, and
  `build.ps1` concatenates them in ordinal filename order into a single script
  scope. **The generated `MAP.md` is the authoritative index**: it lists every
  module with its size, what it defines, which of the 178 canvas stages it holds,
  and which file carries each wing's demos, stages and prose. Regenerate it with
  `./map.ps1` after adding or renaming anything. `AI-GUIDE.md` explains how to
  make changes; `CLAUDE.md` carries the rules that must not be broken.

  The numeric prefix is the load order, and the ranges are meaningful:

  | range | what lives there |
  |---|---|
  | `10`–`20` | expression parser, symbolic differentiation, formatting, renderer |
  | `21`–`49` | pure engines — linear algebra, transforms, dynamics, complex, forms, numerics, vector algebra, curves, multivariable, integration, ODEs, vector calculus, single-variable calculus, series, mechanics, rotation, waves, fluids, thermo, optics, electrostatics, quantum, atom, relativity, EM, circuits, Fourier. No DOM; unit-tested. |
  | `50` | application state and the field-layer drawing pipeline |
  | `59` | the interaction toolkit — sketch pad, region tool, matrix editor, expression box |
| `60`–`79` | the canvas stages, grouped by topic |
  | `80`–`82` | UI panels, navigation and wing plumbing |
  | `85`–`89` | the long-form essays, one wing per file |
  | `90` | boot and the main loop |

  The `21`–`49` boundary is load-bearing: `runtests.ps1` extracts everything
  between the `"use strict";` anchor and the `APPLICATION STATE` banner at the top
  of `50a-state.js` and runs the unit suite against it, so an engine must sit
  below 50 and must not touch the DOM.
- `build.ps1` — concatenates `src/` into the single deployable `vector-calculus.html`
  (no internet, no libraries, no build dependencies beyond PowerShell).
- `js/49-fourier.js` — Fourier engine (naive DFT and radix-2 FFT sharing one
  inverse flag, series coefficients, analytic transform pairs, the winding
  integral, windows, convolution, aliasing and spread) — pure, unit-tested.
- `tests.js` — 4249 unit tests: parser, symbolic differentiation, the operators,
  physics writers, RK4 mechanics, quantum eigen-relations, the Schrödinger equation
  checked numerically against the plotted packet, barrier unitarity/continuity,
  SEMF landmarks, field-tensor invariants, and all four Maxwell equations verified
  numerically (flux = enclosed charge, zero magnetic flux, ∮E·dl = −dΦ_B/dt for a
  moving magnet, and ∮B·dl = dΦ_E/dt for the displacement current). The sandbox's
  dynamics are checked too: the Boris pusher conserves |v| under a pure magnetic
  field to machine precision and keeps cyclotron orbits closed, the relativistic
  push approaches c without reaching it, the dipole rotor conserves |m| while
  seeking alignment, and every source type is verified to produce field lines
  tangent to its own field in both views.
  The circuit engine is held against closed forms throughout: the RC and RL
  exponentials, an LC tank whose energy must not drift over five cycles, the
  −3.01 dB and −45° of an RC corner, series resonance where the reactance
  vanishes and Z = R to eleven digits, transformer turns ratios and mutual
  coupling, op-amp gains, rail saturation and the gain–bandwidth product, the
  Shockley equation checked against an independent bisection, every waveform
  including compiled expressions, FFT amplitude recovery and a square wave's
  48% THD, and the Laplace solution between parallel plates. Netlist extraction
  is tested too — T junctions connect, crossing wires do not. Thévenin equivalents
  from the two-probe solver are checked against the textbook divider formulas at
  DC and against R ∥ Z_C at 1 kHz, and a group of diode circuits spanning several
  supply voltages is checked against an independent bisection of the Shockley
  equation — the case that catches a solver declaring convergence while its
  junction limiter is still clamping. The magnetic overlay is checked against
  µ₀I/2πd and against the square-loop field √2µ₀I/πa.
  The Fourier engine is checked just as hard: the FFT against the literal DFT,
  both round trips against the identity, Parseval, the series coefficients
  against their closed forms, Gibbs converging to (2/π)Si(π) = 1.1790 while its
  *width* collapses, the winding integral against the corresponding DFT bin,
  the analytic pairs against numerical integration, aliasing arithmetic, window
  gains, and the convolution theorem against a direct circular convolution.
  The relativity engine is checked against the literature rather than against its
  own earlier output. Boosts preserve the interval and compose by adding rapidities;
  the field transformation, the tensor conjugation **ΛFΛᵀ** and the six component
  formulas are cross-checked against one another, and both invariants survive every
  boost; Gauss's law still returns 4πq for a charge at 0.9c; the current-carrying
  wire's magnetic and electrostatic forces agree to 10⁻¹²; and the published numbers
  all fall out — Mercury at **43.0″/century** (from the closed form *and* from an
  integrated geodesic, which must agree), light deflection at **1.751″** (likewise,
  and exactly twice the Newtonian value), Pound–Rebka at **2.46×10⁻¹⁵**, GPS at
  **+38.5 μs/day**, Shapiro at **233 μs**, the photon capture radius at 2.598 rs,
  cosmic-ray muons surviving 15 km nine orders of magnitude more often than Newton
  allows, 1 g trips to Proxima and Andromeda at 3.5 and 29 years aboard, and
  GW150914's chirp mass at **28.6 M☉**. Two cancellation traps are covered
  explicitly: the wire's charge imbalance is 16 decades below its operands, so the
  naive subtraction is asserted to be *wrong* and the closed form right, and the
  coordinate time of a horizon crossing is asserted to diverge logarithmically at
  exactly 2M·ln(100) per two decades rather than to a finite value.
  A final group pins every published
  constant (CODATA 2022, PDG 2024) so a stale value cannot creep back in.
- `map.ps1` — regenerates `MAP.md`, the index of modules, stages and wings.
- `auditperf.ps1` — where a frame actually goes. For all 178 stages it counts
  rasterising calls, path operations, 3D primitives sorted and the bytes of HTML
  the panel regenerates four times a second. Nothing else measures cost, and the
  one guess made without it — that the 3D stages were the expensive ones — was
  wrong by a factor of forty: they average 345 paint calls per frame, while the
  complex-mapping stage issues 14 427. It counts work rather than milliseconds
  because Chrome's virtual clock makes wall-time profiling impossible in a
  headless harness, and because a call count is the same number on every machine.
- `measure.ps1` — the headline counts, measured rather than quoted: wings,
  demo groups, guided experiments, how many drive a canvas stage, modules,
  `mkPlot` sites, and the artifact's real size in bytes. The counts that need the
  app running are read out of the booted page, because static greps over `src/`
  for the group count return 89 or 105 depending on the pattern and the answer is
  118. It also reports any canvas stage that no demo reaches (currently none).
- `runtests.ps1` — runs the unit suite headlessly (requires Google Chrome).
- `auditpanel.ps1` — leaves every stage and comes back to it, then asks whether
  the readout, the derivation ladder and the chip are still there. The three
  panels are written through `uiSetHtml`, which skips a write whose HTML matches
  what it last wrote — worth ~2.8 MB of DOM churn a second, and it makes those
  panels stateful. Anything that clears one behind that cache's back leaves it
  believing the old content is still on screen, so the next identical refresh is
  skipped and the panel stays blank. When that shipped, **145 of the 178 stages
  came back empty and `runall.ps1` still reported `caught=0`** — it visits each
  demo once and never returns to one, so the second visit, the only thing that
  can show this, never happened.
- `runall.ps1` — the exhaustive harness: every demo in all forty wings (field and
  stage), every physics preset, a full control audit, and functional physics checks.
  The circuit wing gets its own pass: every instrument, every placement tool, the
  editor paths (place, wire, rotate, drag, delete, clear) and the field overlay.
  Every circuit demo is additionally asserted to solve, to obey KCL, to produce
  finite values and not to be silently dead — a wire one grid unit out would
  short a component rather than raise an error, so the netlist is checked rather
  than trusted. The relativity wing gets its own pass too, for the same reason —
  its controls all live inside the stage panel: every slider is driven to both
  ends and back, every segmented control and checkbox is exercised, the draggable
  Minkowski diagram receives a full pointer gesture, and each readout is scanned
  for `NaN`, `undefined` and `Infinity`, which is how a blown-up boost or a
  diverging geodesic would announce itself.
- `auditclaims.ps1` — asks whether the preset tables tell the truth. Every table
  in the laboratory makes claims about its own entries — this surface has area
  4π, this field is conservative, this sequence tends to 1, this is the
  antiderivative of that, this matrix is singular — and they were the one layer
  of the site nothing recomputed. It checks 249 such claims across 14 tables by
  routes that share nothing with the declaration: closed forms against
  quadrature, symbolic curls against numerical circulations, coefficient rules
  against the derivative rules beside them, declared solutions against the slope
  fields they claim to solve. Where the second route is itself approximate its
  error is *measured* — two panel counts, or a Richardson extrapolation — and the
  tolerance derived from that rather than guessed. It found a surface area that
  belonged to a different surface, a closed surface that was never flagged as
  one, and a radius of convergence printed as a finite number beside the word
  "infinite".
- `auditzoom.ps1` — drives the plot viewport on every stage: zoom, pan, a typed
  window and reset, on all 178. It also asserts the property the viewport is
  built on — that with no reader interaction `mkPlot` returns exactly the window
  it was handed — which is what lets a pan/zoom layer sit under stages that know
  nothing about it. Nothing else in the suite touches the viewport at all.
- `auditframe.ps1` — measures how much of each curve falls outside the window it
  is drawn in, which was previously unmeasurable: a curve leaving its frame is
  silent. It classifies rather than accuses, because not every overflow is a
  defect — a tangent line is *supposed* to leave the picture, and a Taylor
  polynomial diverging outside its radius of convergence is the experiment.
- `runapp.ps1` — loads the app headlessly and screenshots it,
  e.g. `./runapp.ps1 -Theme dark -Wing em -Demo '1.0' -Dim 3d -Tag gauss`
  (add `-ShowHome` for the landing page). Headless Chrome fires almost no animation
  frames and clears the canvas on resize, so the harness repaints stages on a timer;
  if a capture still comes back blank, read the canvas back with `toDataURL()`
  rather than trusting `--screenshot`.
- `smoke.ps1` — ten seconds, run after every build. Asks whether the bundle
  parses and boots at all, whether the three lists of wings agree on membership
  and order, whether every stage carries all nine of its methods, whether all 80
  "See it in the laboratory" links resolve, and whether any markup has been
  written into canvas text, which the canvas draws as its own tags.
- `auditcustom.ps1` — drives the "or type your own" option on every stage, which
  `runall.ps1` never selects: it exercises the controls a stage already shows, so
  the entire reader-supplied path was invisible to it and two bugs shipped
  through the blind spot in one afternoon. Textareas are driven from a
  `data-audit` attribute, since no generic expression is valid for a netlist.
- `auditlink.ps1` — copies a permalink from every experiment, navigates away,
  follows it back, and asks whether the view returned. It is the only gate that
  asks whether a control's value can be written **back**, and that question alone
  found six defects in code it did not own — including display-formatted minus
  signs (U+2212) in editable boxes, which `parseFloat` reads as `NaN`.
- `auditresid.ps1` — reads the rendered text of every panel and asks whether any
  **residual is printed as though it were a measurement**. A difference is
  meaningless without the scale it is read against: one work-energy row printed a
  genuine 7.8% gap as "difference 0 J" in the affirmative colour, and a settled
  circuit printed 29.7 fA of pure round-off as a finding.
- `auditsides.ps1` — the other half of that question. `auditresid` checks a
  difference is printed *with* its scale; this one reads the number and asks
  whether the two routes **agree**, driving the real controls over every preset
  a reader can select — 791 combinations, 134 two-route claims, none of which
  anything had read before. It found ten places where two routes agree to
  round-off and the panel announces a 100% disagreement, because the scale it
  derived was the round-off itself.
- `auditmarks.ps1` — asks whether the key points drawn on a plot are real. The
  break test compared a step against 12× the curve's *median* step, which asks
  whether this part of the curve is steeper than the rest rather than whether it
  is broken, so any curve with a long flat tail grew a fence of false poles.
- `auditderive.ps1` — calls every stage's `derive()`, which nothing else does,
  and measures whether its rungs carry reasoning or merely restate the algebra.
- `audittext.ps1` / `auditscan.ps1` — harvest what every panel across all 593
  experiments actually *says*, then scan that harvest for ASCII stand-ins, leaked
  markup, empty panels and `NaN`. Run on rendered output, never on source:
  grepping `src/` for `sqrt` drowns in `Math.sqrt(`.
- `auditprose.ps1` — inventories the essays for phrases that decline to justify a
  result, and for named theorems leaned on with no statement card behind them.
- `auditsize.ps1` / `auditviewport.ps1` — eight canvas shapes and sixteen real
  window sizes. Every other script runs at one window size, so a layout that only
  breaks at a different aspect ratio was invisible to all of them; these two found
  161 findings on their first run.
- `auditcontrast.ps1` — WCAG contrast ratios and the 12 px type floor.
- `auditartifact.ps1` — whether the app survives publication as a Claude
  artifact: nested inside the host's document, in all three viewer-theme states
  including the *system* one that stamps no `data-theme` at all.
- `auditdocs.ps1` — whether **these documents still describe the program**. It
  re-measures the site and fails on any `.md` file that contradicts it, checks
  that every script on disk is documented, and that every file path the docs name
  exists. Documentation is part of the deliverable, so a stale count is a defect
  on the same footing as a wrong readout — see `SITE-RULES.md` §1.9.
- `clean.ps1` — deletes everything the above regenerate (`-WhatIf` to list first).

## Using it

Build then open:

    ./build.ps1

Open `vector-calculus.html` directly in any modern browser — double-clicking works.
Edit only files under `src/`; the root HTML is generated.

To run the test suites (PowerShell, with Chrome installed):

    ./runtests.ps1
    ./runall.ps1

Both print a one-line verdict; anything other than "0 failed" / "caught=0 OK"
lists the failures.

### Reading a picture closely

Every plot has a viewport. Scroll over one to zoom about the pointer, drag with
**Shift** to move it, or type an exact window into the **View** panel under the
canvas — which also carries the zoom buttons, a reset, and four toggles for what
the picture draws over itself: axes and ticks, key points (zeros and turning
points, read off the curve actually drawn rather than off a formula, so they
work for typed expressions and sketched curves alike), the formula, and the
visible range. Reset returns to the window the experiment was framed with.
