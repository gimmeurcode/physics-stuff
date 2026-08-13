const THEORY_QM = `
<div class="toc">
  <a href="#q0">The postulates</a><a href="#q1">The Schrödinger equation</a>
  <a href="#q2">Wave packets &amp; dispersion</a><a href="#q3">Uncertainty, proved</a>
  <a href="#q4">Eigenstates &amp; quantisation</a><a href="#q5">The double slit</a>
  <a href="#q6">Measurement &amp; collapse</a><a href="#q7">Tunnelling</a>
  <a href="#q8">Spin &amp; Stern–Gerlach</a><a href="#q9">Identical particles &amp; Pauli</a>
  <a href="#q10">Where quantisation came from</a>
</div>

<h3 id="q0">The postulates</h3>
<p>Quantum mechanics is a small axiom set with enormous reach. In the form used throughout this wing (one particle, one dimension, ħ = m = 1 unless stated):</p>
<ul>
  <li><strong>State.</strong> Everything knowable about the system is a complex-valued wavefunction ψ(x, t) with ∫|ψ|²dx = 1. ψ itself is not observable; it is the amplitude whose squared magnitude is a probability density (Born rule).</li>
  <li><strong>Observables.</strong> Measurable quantities are linear operators: position x̂ multiplies by x; momentum is p̂ = −iħ ∂/∂x; energy is the Hamiltonian Ĥ = p̂²/2m + V(x̂). The possible results of measuring an observable are exactly its eigenvalues.</li>
  <li><strong>Dynamics.</strong> Between measurements, ψ evolves deterministically and reversibly by the Schrödinger equation.</li>
  <li><strong>Measurement.</strong> Measuring observable Â on state ψ returns eigenvalue a with probability |⟨φₐ|ψ⟩|², and leaves the system in the corresponding eigenstate φₐ. This is the only place probability and irreversibility enter.</li>
</ul>
<p class="note">The whole interpretive weight of the subject sits in that last postulate — the collapse stage in this wing lets you operate both rules side by side and feel how different they are.</p>

${stDefn('The Born rule', `<p>For a normalised state ψ and an observable Â with eigenstates φ<sub>a</sub>, measuring Â returns the eigenvalue <span class="mth">a</span> with probability</p>
${stEq('<i>P</i>(a) <span class="op">=</span> |⟨φ<sub>a</sub>|ψ⟩|²')}
<p>and in the position basis this is the statement that <span class="mth">|ψ(x)|²<i>dx</i></span> is the probability of finding the particle in <span class="mth">[x, x+<i>dx</i>]</span>.</p>
<p>It is a <em>postulate</em>, and it is worth being blunt about that, because it is the one place the theory stops being deducible. The Schrödinger equation is linear, deterministic and reversible; the Born rule is quadratic, probabilistic and irreversible. No amount of unitary evolution produces it, and every attempt to derive it — Gleason's theorem, decision-theoretic arguments, envariance — turns out to assume something equivalent somewhere. What <em>can</em> be said is why the square: it is the unique choice that makes probabilities add correctly under a change of basis while amplitudes add linearly, which is the same reason intensity goes as amplitude squared in the waves wing.</p>`,
  { note:'The square is also what makes interference possible. |α + β|² is not |α|² + |β|², and the cross term is the entire two-slit pattern — probabilities do not interfere, amplitudes do. Every quantum effect in this wing is that one algebraic fact.',
    see:'quantum:2.1' })}

<h3 id="q1">The Schrödinger equation</h3>
<div class="eqb"><span class="mth">iħ ∂ψ/∂t = Ĥψ = −(ħ²/2m) ∂²ψ/∂x² + V(x)ψ</span></div>
<p>Read it as bookkeeping for energy. The time derivative extracts E from the phase e<sup>−iEt/ħ</sup>; the Laplacian term is kinetic energy — <strong>curvature of ψ is kinetic energy</strong>, the single most useful slogan in the subject; V(x)ψ is potential energy. Sharply bent wavefunction ⇒ high momentum content ⇒ high kinetic energy. The field-engine demos in this wing exploit exactly this: the probe divides ∇²ψ by ψ and reads the energy eigenvalue off any eigenstate, at any point.</p>
<p>For time-independent V, separating ψ = φ(x)e<sup>−iEt/ħ</sup> gives the stationary equation Ĥφ = Eφ — an eigenvalue problem. Everything in this wing is one of its exact solutions: the free Gaussian packet (superposition of plane waves), the box eigenstates, the barrier scattering state, the hydrogen orbitals.</p>

<h3 id="q2">Wave packets &amp; dispersion</h3>
<p>A free particle with definite momentum is the plane wave e<sup>i(kx−ωt)</sup> with ω = k²/2 — but that has |ψ|² constant everywhere: perfectly known momentum, perfectly unknown position. A particle that is somewhere is a <strong>packet</strong>:</p>
<div class="eqb"><span class="mth">ψ(x,t) = ∫ φ(k) e<sup>i(kx − k²t/2)</sup> dk / √(2π)</span></div>
<p>Because ω(k) = k²/2 is not linear, different k travel at different phase speeds — dispersion. For a Gaussian φ(k) the integral closes exactly (the packet stage plots this closed form):</p>
<div class="eqb"><span class="mth">Δx(t) = σ₀ √(1 + (t/2σ₀²)²), &nbsp; Δp = 1/2σ₀ = constant, &nbsp; ⟨x⟩ = x₀ + k₀t</span></div>
<p>Two facts to take away: the group velocity is k₀ = p/m (Ehrenfest: quantum averages obey Newton), and a tighter initial packet spreads <em>faster</em>, because tightness in x demands breadth in k. Note also what does not happen: |ψ|² spreads, but the norm stays exactly 1 — probability is conserved by a continuity equation with current j = ħ Im(ψ*∂ψ/∂x)/m, the quantity the packet stage reports as local momentum.</p>

<h3 id="q3">Uncertainty, proved</h3>
<p>For any state and any pair of observables, the Robertson inequality follows from the Cauchy–Schwarz inequality in about four lines:</p>
<div class="eqb"><span class="mth">ΔA·ΔB ≥ ½|⟨[Â, B̂]⟩|, &nbsp; and with [x̂, p̂] = iħ: &nbsp; Δx·Δp ≥ ħ/2</span></div>
${stThm('Robertson uncertainty relation', {
  hyp:'<span class="mth">Â, B̂</span> are Hermitian operators and <span class="mth">|ψ⟩</span> a normalised state',
  then:'',
  eq:'Δ<i>A</i> <span class="op">·</span> Δ<i>B</i> &nbsp;≥&nbsp; ½ |⟨[Â, B̂]⟩|',
  proof:`<p>Define the centred operators <span class="mth">Â′ = Â − ⟨Â⟩</span> and <span class="mth">B̂′ = B̂ − ⟨B̂⟩</span>, so that <span class="mth">(Δ<i>A</i>)² = ⟨ψ|Â′²|ψ⟩ = ‖Â′ψ‖²</span> and likewise for <span class="mth"><i>B</i></span>. The uncertainties are norms, which is what lets Cauchy–Schwarz in.</p>
<p>Apply Cauchy–Schwarz to the two vectors <span class="mth">Â′ψ</span> and <span class="mth">B̂′ψ</span>:</p>
${stEq('Δ<i>A</i> <span class="op">·</span> Δ<i>B</i> <span class="op">=</span> ‖Â′ψ‖ ‖B̂′ψ‖ &nbsp;≥&nbsp; |⟨Â′ψ | B̂′ψ⟩| <span class="op">=</span> |⟨Â′B̂′⟩|')}
<p>Now split that complex number into real and imaginary parts by writing the product as a sum of a commutator and an anticommutator:</p>
${stEq('Â′B̂′ <span class="op">=</span> ½[Â′, B̂′] <span class="op">+</span> ½{Â′, B̂′}')}
<p>Because <span class="mth">Â′, B̂′</span> are Hermitian, the anticommutator is Hermitian (real expectation) and the commutator is anti-Hermitian (purely imaginary expectation). So the two halves are exactly the real and imaginary parts of <span class="mth">⟨Â′B̂′⟩</span>, and</p>
${stEq('|⟨Â′B̂′⟩|² <span class="op">=</span> ¼|⟨{Â′, B̂′}⟩|² <span class="op">+</span> ¼|⟨[Â′, B̂′]⟩|² &nbsp;≥&nbsp; ¼|⟨[Â, B̂]⟩|²')}
<p>discarding the non-negative anticommutator term, and using that the constants shifted out in <span class="mth">Â′</span> commute with everything, so <span class="mth">[Â′, B̂′] = [Â, B̂]</span>. Taking square roots gives the theorem.</p>
<p>With <span class="mth">[x̂, p̂] = <i>i</i>ħ</span> the right-hand side is <span class="mth">ħ/2</span>, giving Heisenberg's relation.</p>
<p>Nothing in this argument mentions measurement, disturbance or an observer. It is a statement about the state itself — the same fact Fourier analysis states as "a function and its transform cannot both be narrow".</p>`,
  note:'Equality needs both discarded steps to be tight: the anticommutator term must vanish and Cauchy–Schwarz must saturate, which happens only when B̂′ψ ∝ Â′ψ. For position and momentum that forces a Gaussian — which is why the Heisenberg stage shows Δx·Δp pinned at exactly ħ/2 for every σ.',
  see:'quantum:0.1', seeLabel:'Squeeze x, pay in p — Heisenberg live' })}

<p>No measurement, no disturbance, no observer: the bound is a theorem about the state itself, inherited from Fourier analysis — a function and its transform cannot both be narrow. The Gaussian is the unique minimiser (it saturates Cauchy–Schwarz), which is why the Heisenberg stage shows Δx·Δp pinned at exactly ħ/2 for every σ. Physical consequences within this lab: the stability and size of atoms (squeeze the electron cloud and kinetic energy rises as 1/σ² while Coulomb only pays as 1/σ), the re-spreading after each collapse in the measurement stage, and zero-point energy — a confined particle can never sit still because Δx finite forces Δp &gt; 0.</p>

<h3 id="q4">Eigenstates &amp; quantisation</h3>
<p>Confine a wave and its spectrum turns discrete — no extra postulate needed. In the box of width L, φ must vanish at both walls, so kₙL = nπ and</p>
<div class="eqb"><span class="mth">φₙ(x) = √(2/L) sin(nπx/L), &nbsp; Eₙ = n²π²ħ²/2mL²</span></div>
<p>Three morals. <strong>Nodes cost energy</strong>: each extra node bends ψ harder, and curvature is kinetic energy. <strong>Stationary states are static</strong>: |φₙe<sup>−iEₙt</sup>|² is time-independent, so a lone eigenstate does nothing observable — atoms in energy eigenstates do not radiate, resolving the classical collapse paradox. <strong>Dynamics is interference between levels</strong>: a superposition of E₁ and E₂ beats at ω = (E₂−E₁)/ħ. The sloshing dipole in the box stage is, quantitatively, an atom mid-transition; ΔE = ħω is the emitted photon, and that single relation is the entire connection between spectroscopy and structure.</p>

<h3 id="q5">The double slit</h3>
<p>Amplitudes add; probabilities do not. With both paths open and indistinguishable:</p>
<div class="eqb"><span class="mth">I(y) = |ψ₁ + ψ₂|² = |ψ₁|² + |ψ₂|² + 2Re(ψ₁*ψ₂)</span></div>
<p>The cross term oscillates as cos(kΔr), Δr the path difference the probe reads out — constructive where Δr = nλ, destructive at half-integers. The slit stage computes Δr with no small-angle approximation, so the probe numbers are exact geometry.</p>
<p>Now attach a which-path marker: the state becomes ψ₁|left⟩ + ψ₂|right⟩, entangled with the detector. If the marker states are orthogonal (fully distinguishable), the cross term vanishes when the marker is traced out — the pattern collapses to |ψ₁|²+|ψ₂|², two humps, no fringes. Partial distinguishability γ = |⟨left|right⟩| survives as fringe <em>contrast</em>: the γ slider is that inner product. This is decoherence in miniature: an environment that learns the path — even one stray photon — is a which-path detector nobody reads, and interference dies just the same.</p>

<h3 id="q6">Measurement &amp; collapse</h3>
<p>The measurement postulate, operationally (the collapse stage runs precisely this loop): evolve ψ by Schrödinger; measure position with resolution σ_d; draw the outcome x_m from the density |ψ(x)|²; replace ψ by a packet of width σ_d centred at x_m (carrying the local phase gradient as its momentum); repeat.</p>
<ul>
  <li><strong>Born randomness is irreducible</strong> — identical states give different outcomes, and only the statistics are predicted. Every dot in the double-slit wall and every collapse tick in the measurement stage is one draw.</li>
  <li><strong>Collapse costs momentum.</strong> A sharper result (smaller σ_d) leaves a broader Δp = ħ/2σ_d, so the packet re-spreads faster. Uncertainty polices the measurement chain itself.</li>
  <li><strong>The Zeno effect</strong>: measure faster than the packet can spread and it barely moves — evolution frozen by interrogation. Auto-measure demonstrates it.</li>
  <li><strong>What "observation" means</strong>: any interaction that correlates the system with something else — apparatus, air molecule, photon — whether or not anyone looks. Consciousness is not an ingredient; distinguishability is.</li>
</ul>

<h3 id="q7">Tunnelling</h3>
<p>Where E &lt; V the stationary equation gives φ″ = 2m(V−E)φ/ħ² with a positive coefficient: solutions are real exponentials e<sup>±κx</sup>, κ = √(2m(V−E))/ħ, not oscillations. Inside a barrier of width a the amplitude falls by e<sup>−κa</sup>, so the transmitted probability carries e<sup>−2κa</sup> — the exact matched solution (drawn live in the tunnelling stage) gives</p>
<div class="eqb"><span class="mth">T = [1 + V₀² sinh²(κa) / 4E(V₀−E)]⁻¹ ≈ 16(E/V₀)(1−E/V₀) e<sup>−2κa</sup></span></div>
<p>That exponential is why tunnelling phenomena span absurd ranges: alpha-decay half-lives run from microseconds to 10¹⁷ years off modest nuclear differences; the sun fuses protons through a ~MeV Coulomb wall at a ~keV temperature (Gamow factor); a scanning-tunnelling microscope resolves atoms because one ångström of gap changes the current by an order of magnitude. Above the barrier, T &lt; 1 still (waves partially reflect off any potential step) except at resonances sin(k₂a) = 0 — transparency at special widths, which the stage reproduces.</p>

<h3 id="q8">Spin &amp; Stern–Gerlach</h3>
<p>Spin is angular momentum with no spatial wavefunction — a two-component state |χ⟩ = α|↑⟩ + β|↓⟩ living in ℂ². Measuring the component along any axis returns only ±ħ/2. The eigenstate of "up along the axis tilted θ from ẑ" is</p>
<div class="eqb"><span class="mth">|+θ⟩ = cos(θ/2)|↑⟩ + sin(θ/2)|↓⟩ &nbsp;⇒&nbsp; P(keep) = |⟨+θ|↑⟩|² = cos²(θ/2)</span></div>
<p>— the entire mathematics of the Stern–Gerlach stage (note θ/2: spinors turn half as fast as vectors, and need 720° to come home). The chained-filter experiment shows non-commutativity physically: certify spin-up along ẑ, measure along θ, re-measure along ẑ — and the certainty is gone, because Ŝz and Ŝθ do not commute, so no state answers both questions at once. This two-state algebra is also the qubit: gates are rotations of exactly this sphere, and the interference demo in the field group shows the phase doing computational work.</p>

<h3 id="q9">Identical particles &amp; Pauli</h3>
<p>Two electrons are not merely similar — no measurement can tell them apart, so exchanging them must leave every probability unchanged: Ψ(x₂,x₁) = ±Ψ(x₁,x₂). Nature uses both signs, and the spin-statistics theorem (a deep consequence of relativity + causality) fixes which: integer spin ⇒ symmetric (bosons), half-integer ⇒ antisymmetric (fermions).</p>
<div class="eqb"><span class="mth">Ψ∓(x₁,x₂) = [φₐ(x₁)φ_b(x₂) ∓ φₐ(x₂)φ_b(x₁)]/√2</span></div>
<p>Set x₁ = x₂ in the fermion state: Ψ = −Ψ = 0, exactly — the <strong>exchange hole</strong> the Pauli stage draws as a dead-black diagonal. Set φₐ = φ_b: the state vanishes identically — <em>no two fermions in the same quantum state</em>, the exclusion principle proper. Its consequences are most of the visible world: electrons stack two per orbital (spin pair) up the energy ladder, giving shell structure, valence, the periodic table, and chemistry; degenerate electron pressure — pure Pauli, no repulsion needed — holds up white dwarfs, and its neutron analogue holds up neutron stars; the rigidity of ordinary matter is exchange, not electrostatics. Flip one sign and you get the boson world instead: stimulated emission (every photon in a laser mode invites more), Bose–Einstein condensation, superfluidity.</p>

<h3 id="q10">Where quantisation came from</h3>
<p>Two of the field-engine demos are the historical crime scenes. <strong>Blackbody radiation</strong>: classical equipartition gives every mode kT, and since modes grow as ν², the energy density diverges — the ultraviolet catastrophe. Planck (1900) priced the modes at E = nhν; modes with hν ≫ kT can no longer afford even one quantum, and the spectrum folds over into u(ν,T) = ν³/(e<sup>hν/kT</sup>−1), the ridge the demo draws, with Wien's peak at hν ≈ 2.82kT. <strong>The photoelectric effect</strong>: light ejects electrons with K<sub>max</sub> = hν − φ — dependent on frequency, not intensity — Einstein's 1905 argument that the quanta are real particles of light. Add Rutherford's impossible stable atom, and the Schrödinger equation of 1926 is the answer to three independent emergencies at once — the same equation whose exact solutions animate every stage in this wing.</p>
`;

