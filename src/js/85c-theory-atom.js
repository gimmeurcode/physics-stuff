const THEORY_ATOM = `
<div class="toc">
  <a href="#a0">The plan of the atom</a><a href="#a1">Forces = exchanged particles</a>
  <a href="#a2">Yukawa: mass sets range</a><a href="#a3">Electromagnetism</a>
  <a href="#a4">The strong force</a><a href="#a5">The weak force</a>
  <a href="#a6">Gravity</a><a href="#a7">The hierarchy</a>
  <a href="#a8">Nuclei: the four-force ledger</a><a href="#a95">Known limits</a><a href="#a9">Where the forces come from</a>
</div>

<h3 id="a0">The plan of the atom</h3>
<p>An atom is three nested regimes, each governed by a different balance of the four interactions, spanning five orders of magnitude that the atom stage lets you fly through:</p>
<ul>
  <li><strong>10⁵ fm — the electron cloud.</strong> Electromagnetism binds a standing electron wave to the nucleus; the uncertainty principle sets its size. Solve Schrödinger for V = −e²/4πε₀r and the ground state is ψ₁ₛ ∝ e^(−r/a₀) with a₀ = ħ²/m e² k = 0.529 Å and E₁ = −13.6 eV. The cloud in the stage is a Monte-Carlo sample of exactly this density; probe P(r) = 4πr²|ψ|² and its maximum lands on a₀.</li>
  <li><strong>5 fm — the nucleus.</strong> 99.97% of the mass in 10⁻¹⁵ of the volume. The residual strong force (pion exchange) fights Coulomb repulsion; the weak force referees the n/p ratio by β decay.</li>
  <li><strong>1 fm — inside each nucleon.</strong> Three quarks bound by gluons in a confining field; nearly all the nucleon's mass is this field's energy, via E = mc².</li>
</ul>

<h3 id="a1">Forces = exchanged particles</h3>
<p>In quantum field theory a force is not action at a distance; it is the exchange of a field quantum. Two charges do not "pull" — they trade virtual photons, and momentum bookkeeping over many exchanges is what we coarse-grain into F = qE. Virtual particles may violate energy conservation by ΔE for a time Δt ≲ ħ/ΔE (the energy-time uncertainty relation), which is why they are unobservable in flight and why heavier carriers make shorter-ranged forces. The distinction from <strong>real</strong> particles is sharp: a real photon is on-shell (E = pc), flies free, and is detectable — it is light; a virtual photon is off-shell, lives only between two vertices of an interaction, and manifests solely as the force it transmits. The atom stage draws the difference: translucent flickering lines for virtual carriers, solid escaping tracks for the real β-decay products. Each interaction has its carrier, its charge, and its victims:</p>
<ul>
  <li><strong>Photon (γ)</strong> — electromagnetic; couples to electric charge; massless, so infinite range; does not carry charge itself.</li>
  <li><strong>Eight gluons (g)</strong> — strong; couple to colour; massless but <em>coloured themselves</em>, which changes everything (see §a4).</li>
  <li><strong>W±, Z⁰</strong> — weak; couple to every fermion; 80–91 GeV, hence a 10⁻³ fm range and famous feebleness at low energy.</li>
  <li><strong>Graviton</strong> — gravity's would-be quantum: massless, spin-2, and <em>entirely hypothetical</em> — gravity has never been observed to be quantised. The stage draws it dashed for that reason.</li>
</ul>

<h3 id="a2">Yukawa: mass sets range</h3>
<p>Yukawa's 1935 insight is the skeleton key to this whole wing. A static field of a carrier with mass m obeys (∇² − m²c²/ħ²)V = source, whose point solution is</p>
<div class="eqb"><span class="mth">V(r) = −g² e<sup>−r/R</sup>/r, &nbsp; R = ħ/mc</span></div>
${stThm('Yukawa: the mass of the carrier sets the range of the force', {
  hyp:'a static field whose carrier has mass <span class="mth"><i>m</i></span>, obeying <span class="mth">(∇² − <i>m</i>²<i>c</i>²/ħ²)<i>V</i> = 0</span> away from a point source',
  then:'the potential falls exponentially with a range <span class="mth"><i>R</i> = ħ/<i>mc</i></span>:',
  eq:'<i>V</i>(<i>r</i>) <span class="op">∝</span> <span class="frac"><span class="nm"><i>e</i><sup><span class="op">−</span><i>r</i>/<i>R</i></sup></span><span class="den"><i>r</i></span></span>',
  proof:`<p>Write <span class="mth">μ = <i>mc</i>/ħ</span>, so the equation is <span class="mth">∇²<i>V</i> = μ²<i>V</i></span>. The source is a point, so the solution is spherically symmetric and the Laplacian reduces to its radial part. The useful form is</p>
${stEq('∇²<i>V</i> <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>r</i></span></span> <span class="frac"><span class="nm"><i>d</i>²</span><span class="den"><i>dr</i>²</span></span>(<i>rV</i>)')}
<p>which suggests the substitution <span class="mth"><i>u</i>(<i>r</i>) = <i>rV</i>(<i>r</i>)</span>. The equation becomes</p>
${stEq('<span class="frac"><span class="nm"><i>d</i>²<i>u</i></span><span class="den"><i>dr</i>²</span></span> <span class="op">=</span> μ²<i>u</i>')}
<p>an ordinary constant-coefficient equation whose solutions are <span class="mth"><i>e</i><sup>±μ<i>r</i></sup></span>. The growing one is discarded, because a force from a localised source must die away at infinity. So <span class="mth"><i>u</i> ∝ <i>e</i><sup>−μ<i>r</i></sup></span> and</p>
${stEq('<i>V</i>(<i>r</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>u</i></span><span class="den"><i>r</i></span></span> <span class="op">∝</span> <span class="frac"><span class="nm"><i>e</i><sup><span class="op">−</span>μ<i>r</i></sup></span><span class="den"><i>r</i></span></span> , &nbsp;&nbsp; <i>R</i> <span class="op">=</span> 1/μ <span class="op">=</span> ħ/<i>mc</i>')}
<p>Setting <span class="mth"><i>m</i> = 0</span> removes the exponential entirely and returns the Coulomb <span class="mth">1/<i>r</i></span> — so electromagnetism's infinite range is not a separate fact but the massless case of this one.</p>
<p>The range <span class="mth">ħ/<i>mc</i></span> is the reduced Compton wavelength, and dimensional analysis alone would have produced it; what the calculation adds is the <em>form</em> of the fall-off and the certainty that nothing else appears.</p>`,
  note:'Yukawa ran the argument backwards in 1935: nuclear forces die at about 1.4 fm, so ħ/Rc ≈ 140 MeV predicts a carrier of that mass. The pion was found in 1947 at 139.57 MeV. The four-forces chart plots these functions with the measured masses.',
  see:'atom:3.0', seeLabel:'Yukawa vs Coulomb: mass gives a force a range' })}

<p>Massless carrier: R → ∞ and the Coulomb 1/r returns. Massive carrier: the force is exponentially confiscated beyond R. Yukawa ran it backwards — nuclear forces die at ~1.4 fm, so a carrier of ħ/Rc ≈ 140 MeV must exist. The pion was found in 1947 at 139.6 MeV. The four-forces chart plots exactly these functions with the real masses; the probe's "carrier ranges" row is ħ/mc evaluated for π and W.</p>

<h3 id="a3">Electromagnetism, the template</h3>
<p>QED is the theory the others are modelled on: coupling strength α = e²/4πε₀ħc = 1/137.036, massless photon, infinite range, and precision tested to twelve digits (the electron's magnetic moment). In this laboratory it appears at every scale: as the symbolic 1/r² fields of the vector wing's physics builder, as the −1/r potential whose Laplacian the quantum wing's probe verifies against hydrogen eigenvalues, as the virtual photons animated in the atom stage, and as the Z²-growing Coulomb term that ultimately ends the periodic table in the binding-energy stage. One subtlety with consequences: photons are uncharged, so light passes through light — EM field lines spread and dilute. Gluons are not so polite.</p>

<h3 id="a4">The strong force: colour and confinement</h3>
<p>Quarks carry a three-valued charge — colour (r, g, b) — and QCD's gluons couple to it. But gluons carry colour-anticolour themselves, so <strong>gluons attract gluons</strong>: instead of spreading like Coulomb field lines, the chromoelectric field between two quarks collapses into a narrow flux tube. Its energy grows linearly with length, giving the Cornell potential the quark-scale probe reads:</p>
<div class="eqb"><span class="mth">V(r) = −(4/3)αₛ ħc/r + σr, &nbsp; σ ≈ 0.9 GeV/fm</span></div>
<p>Consequences, each visible in the nucleon stage:</p>
<ul>
  <li><strong>Confinement.</strong> Separating quarks costs σ per metre of string, without limit; at ~1 fm it is cheaper to materialise a fresh quark–antiquark pair from the stored energy. Lone quarks are therefore never seen — jets of hadrons are.</li>
  <li><strong>Colour bookkeeping.</strong> Each gluon exchange swaps the colours of the two quarks involved (watch the animation), but the baryon remains colour-neutral (r+g+b = white) at every instant. Only colour-neutral objects exist in isolation.</li>
  <li><strong>Mass from field energy.</strong> The u and d quark masses total ≈ 9 MeV, yet the proton weighs 938 MeV: ~99% of the mass of ordinary matter is confined gluon-field and quark kinetic energy. Your weight is mostly QCD.</li>
  <li><strong>Asymptotic freedom.</strong> αₛ shrinks at short distance (quarks rattle around nearly free deep inside the nucleon) and grows at long distance. That running is why perturbation theory works at colliders and fails at 1 fm.</li>
  <li><strong>The residual force.</strong> Nucleons are colour-neutral, so the force between them is a leftover — colour van der Waals — transmitted most efficiently by the lightest colour-neutral messenger, the pion. That is the Yukawa well of §a2, and it is to QCD what chemical bonding is to QED.</li>
</ul>

<h3 id="a5">The weak force: the identity changer</h3>
<p>The weak interaction is the only force that changes quark flavour, the only one that violates parity (it couples exclusively to left-handed fermions), and the only one whose carriers are heavy. Its low-energy feebleness is <em>entirely</em> the W mass: the coupling itself is comparable to electromagnetism, but every low-energy weak process must borrow an 80 GeV boson for 10⁻²⁵ s, suppressing rates by (E/M<sub>W</sub> c²)⁴. Fermi's constant packages this as G<sub>F</sub> ∝ g²/M<sub>W</sub>².</p>
<p>β decay, run in the stage with real numbers: inside a neutron, d → u + W⁻, then W⁻ → e⁻ + ν̄ₑ. The budget is Q = m<sub>n</sub> − m<sub>p</sub> − m<sub>e</sub> = 0.782 MeV, split randomly between electron and antineutrino — the continuous spectrum p·E·(Q−K)² your simulated decays fill in, and the anomaly that forced Pauli to invent the neutrino in 1930 rather than abandon energy conservation. The same vertex, reoriented: β⁺ decay, electron capture, neutrino scattering, and the p + p → d + e⁺ + ν step that ignites the sun — the weak force is slow (10-minute neutron, 10⁹-year solar protons), and that slowness is why stars burn for billions of years instead of exploding like bombs.</p>
<p class="note">Electroweak unification: above ~100 GeV, EM and weak are one force with one coupling; the Higgs field's condensation broke the symmetry and handed the W and Z their masses while leaving the photon massless. The W/Z masses used by this lab (80.4, 91.2 GeV) were predicted by that theory before CERN measured them in 1983.</p>

<h3 id="a6">Gravity: absurdly weak, ultimately in charge</h3>
<p>Between two protons, gravity is weaker than electromagnetism by α_G = Gm_p²/ħc ≈ 5.9×10⁻³⁹ — the ratio the atom stage's probe prints. Drawn ×10³⁴ on the four-forces chart it still hugs zero. Yet gravity assembles galaxies, because it has two properties no other force shares: infinite range <em>and</em> no negative charge — nothing screens it, so it only ever accumulates. Add 10⁵⁷ protons and electromagnetism cancels to nothing while gravity compounds into a star. General relativity describes it as spacetime curvature, not particle exchange; a quantum version (the graviton) is expected on symmetry grounds but has never been observed, which is why this laboratory renders it dashed and labelled a conjecture — the honest current state of physics' hardest open problem.</p>

<h3 id="a7">The hierarchy, quantified</h3>
<p>Dimensionless couplings at nuclear scales, roughly: strong αₛ ~ 1; electromagnetic α = 1/137; weak (effective, at MeV energies) ~10⁻⁶; gravity ~10⁻³⁹. Ranges: strong ~1.4 fm (residual; confinement inside); weak ~2.5×10⁻³ fm; EM and gravity infinite. Every structure in nature is an armistice among these numbers: nuclei exist because strong &gt; EM inside 2 fm; atoms are 10⁵× bigger than nuclei because α is small and the electron light; stars shine slowly because the weak step is glacial; the cosmos is gravity's because everything else cancels itself out.</p>

<h3 id="a8">Nuclei: the four-force ledger, integrated</h3>
<p>The semi-empirical mass formula the binding stage plots is the forces writing their invoice per nucleus:</p>
<div class="eqb"><span class="mth">B = a_V A − a_S A^⅔ − a_C Z(Z−1)/A^⅓ − a_A (A−2Z)²/A ± δ(A,Z)</span></div>
<ul>
  <li><strong>Volume, +15.75·A:</strong> the strong force saturates (each nucleon binds only neighbours — the Yukawa range again), so binding is linear in A, not A².</li>
  <li><strong>Surface, −17.8·A^⅔:</strong> boundary nucleons are short-changed — nuclear surface tension.</li>
  <li><strong>Coulomb, −0.711·Z(Z−1)/A^⅓:</strong> EM's infinite range taxing every proton pair; the term that ends the periodic table.</li>
  <li><strong>Asymmetry, −23.7·(A−2Z)²/A:</strong> pure Pauli — protons and neutrons fill separate ladders, so lopsided ratios pay rent in kinetic energy.</li>
  <li><strong>Pairing δ:</strong> like nucleons bind in spin pairs, a quantum bonus for even numbers.</li>
</ul>
<p>The resulting B/A curve peaks at ~8.8 MeV near ⁵⁶Fe. Fusion pays on the left slope (the sun), fission on the right (reactors); iron pays nobody, which is why stellar cores that reach iron collapse — supernovae are the receipt.</p>

<h3 id="a95">Where this picture is known to run out</h3>
<p>Everything above is the current, tested account, and it is worth being equally precise about its edges — a laboratory that only shows the settled parts is misleading about how physics actually stands:</p>
<ul>
  <li><strong>Neutrino mass.</strong> The Standard Model as originally written has massless neutrinos. Oscillation experiments (Super-Kamiokande 1998, SNO 2001) proved they change flavour and therefore have mass; direct kinematic limits from KATRIN now sit below 0.45 eV. Whether that mass is Dirac or Majorana is unknown, and the absolute scale and ordering are still open.</li>
  <li><strong>Dark matter and dark energy.</strong> About 27% of the universe's energy budget behaves gravitationally like matter that emits no light and fits no Standard Model particle; a further ~68% acts as a cosmological constant. Neither has a laboratory detection.</li>
  <li><strong>Matter–antimatter asymmetry.</strong> The CP violation present in the quark sector is orders of magnitude too small to explain why anything survived annihilation after the Big Bang.</li>
  <li><strong>Quantum gravity.</strong> General relativity and quantum field theory are each superbly tested and mutually incompatible at high energy. The graviton in this wing is drawn dashed for exactly that reason.</li>
  <li><strong>The hierarchy and flavour puzzles.</strong> Nothing explains why there are three generations, why their masses span twelve orders of magnitude, or why gravity is 10³⁶ times weaker than electromagnetism.</li>
</ul>
<p class="note">Two recent corrections worth carrying: the <strong>proton radius puzzle</strong> is resolved — muonic hydrogen's smaller value (0.841 fm) was right, and electron-scattering measurements were revised to agree, which is why this lab uses it. And the long-standing <strong>muon g−2</strong> discrepancy has largely evaporated as lattice QCD calculations of the hadronic contribution matured and the Theory Initiative's prediction moved into agreement with the Fermilab measurement; it is no longer safe to quote it as evidence of new physics.</p>
<h3 id="a9">Where the forces come from</h3>
<p>The deepest known answer: each force is the price of a <strong>local symmetry</strong>. Demand that physics be unchanged by position-dependent phase rotations of the electron field — ψ → e^(iθ(x))ψ — and the derivative no longer commutes with the symmetry unless you introduce a compensating field with exactly the photon's properties. Gauge symmetry U(1) <em>generates</em> electromagnetism. The same demand for rotations in colour space, SU(3), generates the eight gluons; for weak isospin, SU(2), the W and Z. The Standard Model is the statement that nature's rulebook is SU(3)×SU(2)×U(1), plus the Higgs field whose condensate hides the SU(2) part at low energy. Gravity fits the same pattern one level up — it is the gauge field of local spacetime symmetry — but resists quantisation; reconciling it with the other three is the outstanding problem the dashed graviton rings stand for.</p>
<p class="note">Everything numerical in this wing — ħc = 197.327 MeV·fm, α = 1/137.036, m_π = 139.57 MeV, m_W = 80.4 GeV, σ ≈ 0.9 GeV/fm, the SEMF coefficients — is the real measured value, and the unit tests check the stages against them.</p>
`;

