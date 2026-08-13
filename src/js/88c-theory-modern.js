/* ============================================================================
   7g · THE LONG-FORM MATHEMATICS — NUCLEAR, CONDENSED MATTER, STATISTICAL
   ============================================================================ */
const THEORY_NUCLEAR = `
<div class="toc"><a href="#n0">Scale</a><a href="#n1">The liquid drop</a>
<a href="#n2">The valley of stability</a><a href="#n3">Decay</a>
<a href="#n4">Tunnelling</a><a href="#n5">Fission and fusion</a></div>

<h3 id="n0">The scale of the problem</h3>
<p>A nucleus is about <span class="mth">10<sup>−15</sup></span> m across and holds essentially all of an atom's mass in about <span class="mth">10<sup>−15</sup></span> of its volume. The energies are correspondingly larger: chemical bonds run to a few electronvolts, nuclear binding to several <em>million</em>. That single factor of a million is why a kilogram of uranium carries the energy of several thousand tonnes of coal, and it is the only reason nuclear technology is worth the trouble it causes.</p>
<p>The natural unit here is <span class="mth">ħ<i>c</i> = 197.3 MeV·fm</span>, which converts a distance to an energy directly. Almost every estimate in this wing is one line once that constant is in hand.</p>

<h3 id="n1">The liquid drop</h3>
<p>Nobody can solve the nuclear many-body problem exactly — the force is strong, short-ranged, spin-dependent and not even fundamental. What works remarkably well instead is to treat the nucleus as a drop of incompressible fluid, and correct that picture term by term:</p>
<div class="eqb"><span class="mth"><i>B</i> <span class="op">=</span> <i>a</i><sub>V</sub><i>A</i> <span class="op">−</span> <i>a</i><sub>S</sub><i>A</i><sup>2/3</sup> <span class="op">−</span> <i>a</i><sub>C</sub><span class="frac"><span class="nm"><i>Z</i>(<i>Z</i>−1)</span><span class="den"><i>A</i><sup>1/3</sup></span></span> <span class="op">−</span> <i>a</i><sub>A</sub><span class="frac"><span class="nm">(<i>N</i>−<i>Z</i>)²</span><span class="den"><i>A</i></span></span> <span class="op">±</span> <span class="frac"><span class="nm"><i>a</i><sub>P</sub></span><span class="den">√<i>A</i></span></span></span></div>
<p>Each term is a physical statement. <strong>Volume</strong>: the strong force saturates, so each nucleon binds only to its immediate neighbours and the total goes as <span class="mth"><i>A</i></span>. <strong>Surface</strong>: nucleons on the skin have fewer neighbours, and since nuclear matter has constant density, <span class="mth"><i>R</i> ∝ <i>A</i><sup>1/3</sup></span> and the area goes as <span class="mth"><i>A</i><sup>2/3</sup></span>. <strong>Coulomb</strong>: every proton repels every other, and there are <span class="mth"><i>Z</i>(<i>Z</i>−1)/2</span> pairs. <strong>Asymmetry</strong>: protons and neutrons fill separate ladders of levels, so an imbalance forces nucleons above the filled levels at a cost quadratic in <span class="mth"><i>N</i>−<i>Z</i></span>. <strong>Pairing</strong>: nucleons couple in pairs, so even–even nuclei gain and odd–odd lose.</p>
<p class="note">Fitted long before anyone could solve the underlying problem, this predicts most binding energies to better than 1%. What it cannot see are the <strong>magic numbers</strong> — 2, 8, 20, 28, 50, 82, 126 — where closed shells give extra binding. Those show up on the plot as measured points sitting above the smooth curve, and explaining them was the shell model.</p>

<h3 id="n2">The valley of stability</h3>
<p>Minimising <span class="mth"><i>B</i></span> over <span class="mth"><i>Z</i></span> at fixed <span class="mth"><i>A</i></span> — an ordinary critical-point calculation — gives</p>
<div class="eqb"><span class="mth"><i>Z</i>* <span class="op">=</span> <span class="frac"><span class="nm">4<i>a</i><sub>A</sub> <span class="op">+</span> <i>a</i><sub>C</sub><i>A</i><sup>−1/3</sup></span><span class="den">8<i>a</i><sub>A</sub>/<i>A</i> <span class="op">+</span> 2<i>a</i><sub>C</sub><i>A</i><sup>−1/3</sup></span></span></span></div>
<p>Two terms are fighting. Asymmetry wants <span class="mth"><i>N</i> = <i>Z</i></span>; Coulomb wants as few protons as possible. For light nuclei the asymmetry term dominates and stable nuclei sit on the diagonal. As <span class="mth"><i>A</i></span> grows, <span class="mth"><i>Z</i>²</span> outruns <span class="mth"><i>A</i></span> and the balance shifts: lead needs <span class="mth"><i>N</i>/<i>Z</i> ≈ 1.54</span>. Push far enough and no <span class="mth"><i>Z</i></span> is stable at all, which is where the periodic table stops.</p>

<h3 id="n3">Decay</h3>
<p>One assumption — a nucleus has no memory, so its decay probability per unit time is a constant — forces everything:</p>
<div class="eqb"><span class="mth"><span class="frac"><span class="nm">d<i>N</i></span><span class="den">d<i>t</i></span></span> <span class="op">=</span> <span class="op">−</span>λ<i>N</i> <span class="op">⇒</span> <i>N</i>(<i>t</i>) <span class="op">=</span> <i>N</i><sub>0</sub>e<sup>−λ<i>t</i></sup> , &nbsp;&nbsp; <i>T</i><sub>½</sub> <span class="op">=</span> <span class="frac"><span class="nm">ln 2</span><span class="den">λ</span></span></span></div>
<p>This is the separable first-order equation of the differential-equations wing, and it is the same equation as capacitor discharge and Newtonian cooling. Nothing about it is nuclear; "rate proportional to amount" does not care what is decaying.</p>
${stThm('Memorylessness forces exponential decay', {
  hyp:'each nucleus has a decay probability per unit time <span class="mth">λ</span> that does not depend on its age or on the other nuclei',
  then:'',
  eq:'<i>N</i>(<i>t</i>) <span class="op">=</span> <i>N</i>₀<i>e</i><sup><span class="op">−</span>λ<i>t</i></sup> , &nbsp;&nbsp; <i>T</i><sub>½</sub> <span class="op">=</span> <span class="frac"><span class="nm">ln 2</span><span class="den">λ</span></span> , &nbsp;&nbsp; ⟨<i>t</i>⟩ <span class="op">=</span> 1/λ',
  proof:`<p>In a time <span class="mth"><i>dt</i></span> each of the <span class="mth"><i>N</i></span> nuclei decays with probability <span class="mth">λ<i>dt</i></span>, so the expected number lost is <span class="mth">λ<i>N dt</i></span>:</p>
${stEq('<span class="frac"><span class="nm"><i>dN</i></span><span class="den"><i>dt</i></span></span> <span class="op">=</span> <span class="op">−</span>λ<i>N</i>')}
<p>Separate and integrate — this is the separable first-order equation of the ODE wing, and nothing about it is nuclear:</p>
${stEq('∫ <span class="frac"><span class="nm"><i>dN</i></span><span class="den"><i>N</i></span></span> <span class="op">=</span> <span class="op">−</span>λ∫ <i>dt</i> &nbsp;⟹&nbsp; ln <i>N</i> <span class="op">=</span> <span class="op">−</span>λ<i>t</i> <span class="op">+</span> const')}
<p>Exponentiating and fixing the constant by <span class="mth"><i>N</i>(0) = <i>N</i>₀</span> gives the law. Setting <span class="mth"><i>N</i> = <i>N</i>₀/2</span> gives <span class="mth"><i>e</i><sup>−λ<i>T</i><sub>½</sub></sup> = ½</span>, so <span class="mth"><i>T</i><sub>½</sub> = ln 2/λ</span>.</p>
<p>For the mean lifetime, the probability density of decaying at time <span class="mth"><i>t</i></span> is <span class="mth">λ<i>e</i><sup>−λ<i>t</i></sup></span>, so</p>
${stEq('⟨<i>t</i>⟩ <span class="op">=</span> ∫₀<sup>∞</sup> <i>t</i> λ<i>e</i><sup><span class="op">−</span>λ<i>t</i></sup> <i>dt</i> <span class="op">=</span> 1/λ')}
<p>by one integration by parts. So the mean lifetime is <em>longer</em> than the half-life by a factor <span class="mth">1/ln 2 ≈ 1.443</span>: half are gone by <span class="mth"><i>T</i><sub>½</sub></span>, but the survivors carry a long tail that the average must account for.</p>
<p>The single hypothesis doing all the work is memorylessness. An "old" nucleus is statistically identical to a fresh one, which is why the exponential — the one function whose rate of change is proportional to itself — is the only possible answer.</p>`,
  note:'This is the same equation as capacitor discharge and Newtonian cooling. "Rate proportional to amount" does not care what is decaying, which is why radiocarbon dating and an RC circuit share their mathematics exactly.',
  see:'nuclear:1.0', seeLabel:'The exponential law, derived from one assumption' })}

<p>The mean lifetime <span class="mth">1/λ</span> is <em>longer</em> than the half-life by <span class="mth">1/ln2 ≈ 1.443</span>: half are gone by <span class="mth"><i>T</i><sub>½</sub></span>, but the survivors carry a long tail and the average must account for them.</p>
<p>Add a daughter and the equation acquires a source term, giving the <strong>Bateman solution</strong>. The daughter's population peaks where production stops beating its own decay — set the derivative to zero and solve. When the daughter is much shorter-lived it tracks its parent almost exactly, which is <em>secular equilibrium</em>, and it is why radon accumulates wherever uranium sits in the ground.</p>

<h3 id="n4">Tunnelling, and twenty-four orders of magnitude</h3>
<p>An α particle inside a heavy nucleus faces a Coulomb barrier several times taller than its own energy. Classically it never leaves. Quantum mechanically the wavefunction leaks, with a probability governed by the WKB integral through the forbidden region:</p>
<div class="eqb"><span class="mth"><i>T</i> <span class="op">≈</span> e<sup>−2<i>G</i></sup> , &nbsp;&nbsp; <i>G</i> <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den">ħ</span></span>∫<sub>R</sub><sup>b</sup> √(2<i>m</i>(<i>V</i>−<i>E</i>)) d<i>r</i></span></div>
<p>The integral has a closed form, and <span class="mth"><i>G</i></span> depends on energy roughly as <span class="mth">1/√<i>E</i></span>. Because it sits <em>inside an exponent</em>, changing the α energy from 4 to 9 MeV — a factor of about two — changes the half-life by more than twenty powers of ten. That is the <strong>Geiger–Nuttall law</strong>, and it is why α emitters are either effectively stable or effectively instantaneous with very little in between.</p>
<p class="note">Gamow's 1928 calculation was the first application of quantum mechanics to the nucleus. It explained a twenty-year-old empirical correlation with no adjustable parameters, and it remains one of the most economical explanations in physics.</p>

<h3 id="n5">Fission and fusion</h3>
<p>Both release energy for the same reason: they move nuclei <em>towards</em> the peak of the binding curve near iron. Fusion climbs the steep left slope and releases far more per nucleon; fission slides down the gentle right slope and releases more per <em>event</em>, because it moves so many nucleons at once.</p>
<ul>
  <li><strong>Fission</strong> of <span class="mth"><sup>235</sup>U</span> releases about 200 MeV per event — roughly 0.9 MeV per nucleon, from a curve that rises by that much between <span class="mth"><i>A</i></span> = 235 and <span class="mth"><i>A</i></span> ≈ 118.</li>
  <li><strong>Fusion</strong> of deuterium and tritium releases 17.6 MeV from five nucleons — about 3.5 MeV each, nearly four times better.</li>
</ul>
<p>Fusion is harder for exactly the reason α decay is slow: the Coulomb barrier. Two deuterons must approach to within a few femtometres against their mutual repulsion, which needs temperatures of order <span class="mth">10<sup>8</sup></span> K — and even then it works only because tunnelling lets particles through a barrier they cannot climb. The Sun runs at a core temperature well below the classical requirement, and shines because of the same exponential that makes α decay possible.</p>
<p>Why does the curve peak at iron rather than somewhere else? Because the surface term (which favours large <span class="mth"><i>A</i></span>) and the Coulomb term (which punishes it) cross there. A star fuses its way up the curve and stops at iron because there is nowhere left to go — fusing past the peak would <em>cost</em> energy. That is why iron cores collapse, and why every element heavier than iron was made in a supernova or a neutron-star merger rather than in ordinary stellar burning.</p>
`;

const THEORY_SOLID = `
<div class="toc"><a href="#s0">The question</a><a href="#s1">The Fermi sea</a>
<a href="#s2">Bands</a><a href="#s3">Semiconductors</a><a href="#s4">The junction</a>
<a href="#s5">Phonons</a></div>

<h3 id="s0">The question this subject answers</h3>
<p>Copper conducts electricity <span class="mth">10<sup>23</sup></span> times better than diamond. Both are crystals of one element, both hold their atoms together with the same electromagnetic force, and both obey the same Schrödinger equation. Explaining that ratio — not approximately, but by orders of magnitude — is what condensed-matter physics was built to do, and the answer turns out to require only two ideas: <strong>Fermi statistics</strong> and <strong>periodicity</strong>.</p>

<h3 id="s1">The Fermi sea</h3>
<p>Electrons are fermions, so no two occupy the same state. Fill a box with <span class="mth"><i>N</i></span> of them at absolute zero and they stack up to a level fixed by counting the available states:</p>
<div class="eqb"><span class="mth"><i>E</i><sub>F</sub> <span class="op">=</span> <span class="frac"><span class="nm">ħ²</span><span class="den">2<i>m</i></span></span>(3π²<i>n</i>)<sup>2/3</sup></span></div>
<p>For copper this is 7.0 eV — corresponding to a temperature of 82 000 K and a speed of 1.6 million m/s. Those electrons are moving that fast <em>at absolute zero</em>. Nothing is heating them; they move because the exclusion principle forbids them all from sitting still in the same state.</p>
<p>The consequence that mattered historically is the heat capacity. Classical equipartition gives every electron <span class="mth">(3/2)<i>kT</i></span>, predicting about 12 J/mol·K on top of the lattice contribution. Metals show under 1% of that. The resolution is that an electron 1 eV below the surface <em>cannot</em> absorb a small amount of heat, because every state it could move into is occupied. Only those within <span class="mth"><i>kT</i></span> of <span class="mth"><i>E</i><sub>F</sub></span> can respond:</p>
<div class="eqb"><span class="mth"><i>C</i><sub>el</sub> <span class="op">≈</span> <span class="frac"><span class="nm">π²</span><span class="den">2</span></span><i>R</i><span class="frac"><span class="nm"><i>T</i></span><span class="den"><i>T</i><sub>F</sub></span></span></span></div>
<p>At room temperature that ratio is under a percent, and the hundred-fold discrepancy dissolves. Drude got conduction roughly right in 1900 and this catastrophically wrong; Sommerfeld's 1927 fix was one ratio, <span class="mth"><i>kT</i>/<i>E</i><sub>F</sub></span>.</p>
<p class="note">That a model ignoring <em>every</em> interaction between electrons works this well is genuinely surprising, and the explanation — Landau's Fermi-liquid theory — is that interactions dress electrons into quasiparticles rather than destroying the picture.</p>

<h3 id="s2">Bands, from periodicity alone</h3>
<p>A free electron has <span class="mth"><i>E</i> = ħ²<i>k</i>²/2<i>m</i></span>: a smooth parabola with every energy available. Now make the potential repeat. Bloch's theorem says translating by one lattice spacing can only multiply the wavefunction by a phase — same physical state, so modulus one. Matching the wavefunction and its slope across one cell gives a condition of the form</p>
<div class="eqb"><span class="mth"><i>P</i><span class="frac"><span class="nm">sin α<i>a</i></span><span class="den">α<i>a</i></span></span> <span class="op">+</span> cos α<i>a</i> <span class="op">=</span> cos <i>ka</i></span></div>
${stThm("Bloch's theorem", {
  hyp:'the potential is periodic, <span class="mth"><i>V</i>(<i>x</i>+<i>a</i>) = <i>V</i>(<i>x</i>)</span>, and <span class="mth">ψ</span> is an energy eigenstate',
  then:'translation by one lattice spacing multiplies <span class="mth">ψ</span> by a phase:',
  eq:'ψ(<i>x</i>+<i>a</i>) <span class="op">=</span> <i>e</i><sup><i>ika</i></sup> ψ(<i>x</i>) &nbsp;&nbsp; for some real <i>k</i>',
  proof:`<p>Let <span class="mth"><i>T</i></span> be the operator that translates by <span class="mth"><i>a</i></span>. Because the potential repeats, the Hamiltonian is unchanged by that shift, so <span class="mth"><i>T</i></span> and <span class="mth"><i>H</i></span> <strong>commute</strong>. Commuting operators can be simultaneously diagonalised, so an energy eigenstate may be chosen to be an eigenstate of <span class="mth"><i>T</i></span> as well:</p>
${stEq('<i>T</i>ψ(<i>x</i>) <span class="op">=</span> ψ(<i>x</i>+<i>a</i>) <span class="op">=</span> <i>c</i> ψ(<i>x</i>)')}
<p>It remains to show <span class="mth">|<i>c</i>| = 1</span>. A shifted wavefunction describes the same physical situation, so the probability density must be unchanged: <span class="mth">|ψ(<i>x</i>+<i>a</i>)|² = |ψ(<i>x</i>)|²</span>. Hence <span class="mth">|<i>c</i>|² = 1</span>.</p>
<p>More carefully, if <span class="mth">|<i>c</i>| &gt; 1</span> then iterating the translation makes <span class="mth">|ψ|</span> grow without bound to the right; if <span class="mth">|<i>c</i>| &lt; 1</span> it grows without bound to the left. Neither is an acceptable state in an infinite crystal, so <span class="mth">|<i>c</i>| = 1</span> exactly.</p>
<p>A complex number of modulus one is a phase, so <span class="mth"><i>c</i> = <i>e</i><sup><i>ika</i></sup></span> for some real <span class="mth"><i>k</i></span>. That is the theorem, and it is the entire content: <em>periodicity permits a phase and nothing more</em>.</p>
<p>The consequence is the band structure. Matching <span class="mth">ψ</span> and its slope across one cell turns the phase condition into <span class="mth"><i>P</i>(sin α<i>a</i>)/α<i>a</i> + cos α<i>a</i> = cos <i>ka</i></span>. The right-hand side is a cosine of a real number and cannot leave <span class="mth">[−1, 1]</span>; the left depends only on energy and wanders freely. Wherever it strays outside that corridor there is no real <span class="mth"><i>k</i></span>, hence no propagating wave — and that is a gap.</p>`,
  note:'No chemistry, no electron–electron interaction, and no detail about the atoms entered the argument. Repetition alone opens gaps, which is why the lab can close them simply by turning the periodicity off.',
  see:'solid:1.0', seeLabel:'Periodicity alone opens a gap' })}

<p>The right-hand side is a cosine of a real number and is trapped in <span class="mth">[−1, 1]</span>. The left-hand side depends only on energy and wanders wherever it likes. <strong>Wherever it leaves the corridor, no propagating wave exists</strong> — and that is a band gap. No chemistry, no interactions, no detail about the atoms: repetition alone opens gaps.</p>
<p>Fill the bands with the electrons the atoms brought:</p>
<ul>
  <li><strong>Partly filled band</strong> — empty states sit immediately above the occupied ones, so an arbitrarily small field produces current. A metal.</li>
  <li><strong>Exactly filled band, small gap</strong> — a semiconductor. Thermal energy promotes a workable number of carriers.</li>
  <li><strong>Exactly filled band, large gap</strong> — an insulator. Nothing gets across.</li>
</ul>
<p>Diamond and silicon share a crystal structure and four valence electrons and differ only in the size of the gap: 5.5 eV against 1.12 eV. That is the difference between a gemstone and a transistor.</p>

<h3 id="s3">Semiconductors</h3>
<p>The intrinsic carrier concentration is exponentially sensitive to the gap:</p>
<div class="eqb"><span class="mth"><i>n</i><sub>i</sub> <span class="op">=</span> √(<i>N</i><sub>c</sub><i>N</i><sub>v</sub>) e<sup>−<i>E</i><sub>g</sub>/2<i>kT</i></sup></span></div>
<p>The factor of two matters: carriers are created in <em>pairs</em>, and the Fermi level sits midway, so the cost per carrier is half the gap. Without it a 1.1 eV gap at room temperature would look hopeless.</p>
<p>Doping changes everything. Add one impurity per ten million and the conductivity rises by orders of magnitude. But the product is fixed:</p>
<div class="eqb"><span class="mth"><i>np</i> <span class="op">=</span> <i>n</i><sub>i</sub>²</span></div>
<p>This is the <strong>law of mass action</strong>, and it holds however you dope — adding electrons suppresses holes by exactly the compensating factor. Combined with charge neutrality it fixes both carrier densities exactly. The textbook shortcut <span class="mth"><i>n</i> ≈ <i>N</i><sub>d</sub></span> follows when doping swamps <span class="mth"><i>n</i><sub>i</sub></span>, and fails at high temperature or in narrow-gap materials — the stage solves the quadratic exactly so you can find where.</p>

<h3 id="s4">The junction</h3>
<p>Join n-type to p-type. Electrons diffuse across simply because there are more of them on one side, stranding positive donor ions behind. The exposed charge builds a field opposing further diffusion, and equilibrium is where drift exactly cancels diffusion:</p>
<div class="eqb"><span class="mth"><i>V</i><sub>bi</sub> <span class="op">=</span> <span class="frac"><span class="nm"><i>kT</i></span><span class="den">e</span></span> ln <span class="frac"><span class="nm"><i>N</i><sub>d</sub><i>N</i><sub>a</sub></span><span class="den"><i>n</i><sub>i</sub>²</span></span></span></div>
<p>Solving Poisson's equation across the stripped region — the same equation as the electrostatics wing, in one dimension — gives the depletion width and a parabolic band bending on each side. The layer reaches <em>further into the lightly doped side</em>, because it must expose the same total charge with fewer ions per unit volume, and that is what sets a diode's breakdown voltage.</p>
<p>Bias it and the barrier moves, giving current exponential in one direction and flat in the other:</p>
<div class="eqb"><span class="mth"><i>I</i> <span class="op">=</span> <i>I</i><sub>s</sub>(e<sup>e<i>V</i>/<i>kT</i></sup> <span class="op">−</span> 1)</span></div>
<p class="note">You cannot measure <span class="mth"><i>V</i><sub>bi</sub></span> with a voltmeter. The contacts develop their own offsets that cancel it exactly — as they must, since otherwise a junction in a loop would drive a perpetual current and violate the second law.</p>

<h3 id="s5">Phonons, and why cold solids stop absorbing heat</h3>
<p>Dulong and Petit found in 1819 that every solid has a molar heat capacity near <span class="mth">3<i>R</i></span>. It is material-independent, which made it look fundamental — and below about <span class="mth">θ<sub>D</sub>/3</span> it fails completely, with every solid falling to zero as <span class="mth"><i>T</i>³</span>.</p>
<p>Classical equipartition cannot produce that, because it contains no energy scale to compare <span class="mth"><i>kT</i></span> against. Einstein's fix (1907) was to quantise: a mode with <span class="mth">ħω > <i>kT</i></span> cannot accept a fraction of a quantum, so it accepts nothing and is <em>frozen out</em>. This was the first application of quantisation to anything other than light, and it gets the qualitative behaviour right — but predicts an exponential fall where measurement shows a power law.</p>
<p>Debye's correction is that a crystal supports sound waves of every wavelength from the sample size down to the atomic spacing. However cold it gets, some low-frequency modes still satisfy <span class="mth">ħω < <i>kT</i></span>. Counting them, with a cut-off chosen to give exactly <span class="mth">3<i>N</i></span> modes:</p>
<div class="eqb"><span class="mth"><i>C</i> <span class="op">=</span> 9<i>R</i>(<i>T</i>/θ<sub>D</sub>)³∫<sub>0</sub><sup>θ<sub>D</sub>/T</sup> <span class="frac"><span class="nm"><i>x</i>⁴e<sup>x</sup></span><span class="den">(e<sup>x</sup>−1)²</span></span> d<i>x</i> <span class="op">→</span> <span class="frac"><span class="nm">12π⁴</span><span class="den">5</span></span><i>R</i>(<i>T</i>/θ<sub>D</sub>)³</span></div>
<p>The Debye temperature is a real physical scale — roughly where the stiffest mode has <span class="mth">ħω = <i>kT</i></span>. Lead is soft and heavy (<span class="mth">θ<sub>D</sub></span> = 105 K) and reaches its classical value while still cold; diamond is stiff and light (2230 K) and at room temperature is still deep in the quantum regime with a heat capacity far below <span class="mth">3<i>R</i></span>. Same equation, two materials that behave nothing alike.</p>
<p class="note">This is the same Bose–Einstein counting that gives Planck's blackbody law — phonons in a solid rather than photons in a cavity. The <span class="mth"><i>T</i>³</span> here and the <span class="mth"><i>T</i>⁴</span> of Stefan–Boltzmann differ only because a crystal has a shortest possible wavelength and empty space does not.</p>
`;

const THEORY_STATMECH = `
<div class="toc"><a href="#t0">The one assumption</a><a href="#t1">Entropy</a>
<a href="#t2">Temperature</a><a href="#t3">The Boltzmann factor</a>
<a href="#t4">The partition function</a><a href="#t5">Speeds</a>
<a href="#t6">Phase transitions</a></div>

<h3 id="t0">The one assumption</h3>
<p>An isolated system in equilibrium is equally likely to be found in any of its accessible microstates. That is the whole of it. No forces, no dynamics, no arrow of time is assumed — everything below is a consequence of counting arrangements, and the remarkable thing is how much follows.</p>

<h3 id="t1">Entropy is a logarithm of a count</h3>
<p>For <span class="mth"><i>N</i></span> oscillators sharing <span class="mth"><i>q</i></span> quanta the number of arrangements is a binomial coefficient. These numbers are astronomically large — <span class="mth">ln Ω</span> for a real solid runs to <span class="mth">10<sup>23</sup></span> — so take the logarithm:</p>
<div class="eqb"><span class="mth"><i>S</i> <span class="op">=</span> <i>k</i> ln Ω</span></div>
<p>This does two things. It brings the numbers into a writable range, and it turns the <em>product</em> <span class="mth">Ω<sub>A</sub>Ω<sub>B</sub></span> into a <em>sum</em>, so entropy is additive the way energy is. Boltzmann's constant exists only to convert into the temperature units chosen before anyone knew what temperature was.</p>

<h3 id="t2">Temperature is a slope</h3>
<p>Put two systems in thermal contact and let them share energy. The most likely split maximises the total entropy, which means</p>
<div class="eqb"><span class="mth"><span class="frac"><span class="nm">∂<i>S</i><sub>A</sub></span><span class="den">∂<i>U</i><sub>A</sub></span></span> <span class="op">=</span> <span class="frac"><span class="nm">∂<i>S</i><sub>B</sub></span><span class="den">∂<i>U</i><sub>B</sub></span></span> <span class="op">≡</span> <span class="frac"><span class="nm">1</span><span class="den"><i>T</i></span></span></span></div>
<p>That shared slope is the only thing two systems in equilibrium have in common, so it deserves a name — and it is temperature. This is not a convention chosen for convenience: it is the identification of the quantity that is equal when nothing further happens.</p>
<p>The distribution over splits is <strong>sharply peaked</strong>, with a relative width falling as <span class="mth">1/√<i>N</i></span>. With a hundred oscillators the fluctuations are percent-level and wide enough to see; at <span class="mth">10<sup>23</sup></span> they fall to about <span class="mth">10<sup>−11.5</sup></span>, far below anything measurable. <em>The second law is a counting argument.</em> Nothing forbids heat flowing the wrong way — the arrangements in which it does are simply outnumbered by a factor with <span class="mth">10<sup>22</sup></span> digits.</p>

<h3 id="t3">The Boltzmann factor is forced, not assumed</h3>
<p>A system in contact with a reservoir is <em>not</em> equally likely to be in each of its states — the counting assumption applies to system-plus-reservoir. So the probability of a system state of energy <span class="mth"><i>E</i></span> is proportional to the reservoir arrangements left over, <span class="mth">Ω<sub>res</sub>(<i>U</i>−<i>E</i>)</span>. Take a logarithm and expand to first order, since <span class="mth"><i>E</i> ≪ <i>U</i></span>:</p>
<div class="eqb"><span class="mth">ln Ω<sub>res</sub>(<i>U</i>−<i>E</i>) <span class="op">≈</span> ln Ω<sub>res</sub>(<i>U</i>) <span class="op">−</span> <i>E</i><span class="frac"><span class="nm">∂ ln Ω</span><span class="den">∂<i>U</i></span></span> <span class="op">=</span> ln Ω<sub>res</sub>(<i>U</i>) <span class="op">−</span> <span class="frac"><span class="nm"><i>E</i></span><span class="den"><i>kT</i></span></span></span></div>
<p>Exponentiate and the Boltzmann factor appears. It is worth being clear about what happened: a logarithm expanded to first order and then exponentiated <em>can only</em> give an exponential, and its rate is the derivative that defines temperature. Nothing was chosen.</p>

${stThm('The Boltzmann factor is forced, not postulated', {
  hyp:'a small system in thermal contact with a reservoir at temperature <span class="mth"><i>T</i></span>, the pair isolated, and every microstate of the whole equally likely',
  then:'the probability of the system occupying a state of energy <span class="mth"><i>E</i></span> is',
  eq:'<i>P</i>(<i>E</i>) <span class="op">∝</span> <i>e</i><sup><span class="op">−</span><i>E</i>/<i>kT</i></sup>',
  proof:`<p>The only assumption is that all microstates of the <em>combined</em> system are equally likely. So the probability that the small system sits in one particular state of energy <span class="mth"><i>E</i></span> is proportional to the number of ways the reservoir can hold the rest of the energy:</p>
${stEq('<i>P</i>(<i>E</i>) <span class="op">∝</span> Ω<sub>res</sub>(<i>U</i> <span class="op">−</span> <i>E</i>)')}
<p>That count is astronomically large and varies violently, so work with its logarithm — which is the entropy, and which is well behaved. Expand to first order in <span class="mth"><i>E</i></span>, legitimate because the reservoir is huge and <span class="mth"><i>E</i> ≪ <i>U</i></span>:</p>
${stEq('ln Ω<sub>res</sub>(<i>U</i><span class="op">−</span><i>E</i>) <span class="op">≈</span> ln Ω<sub>res</sub>(<i>U</i>) <span class="op">−</span> <i>E</i> <span class="frac"><span class="nm">∂ ln Ω<sub>res</sub></span><span class="den">∂<i>U</i></span></span>')}
<p>The derivative appearing here is exactly what defines temperature: <span class="mth">∂(<i>k</i> ln Ω)/∂<i>U</i> = ∂<i>S</i>/∂<i>U</i> = 1/<i>T</i></span>. So the bracket is <span class="mth"><i>E</i>/<i>kT</i></span>. Exponentiating,</p>
${stEq('<i>P</i>(<i>E</i>) <span class="op">∝</span> Ω<sub>res</sub>(<i>U</i>) <i>e</i><sup><span class="op">−</span><i>E</i>/<i>kT</i></sup> <span class="op">∝</span> <i>e</i><sup><span class="op">−</span><i>E</i>/<i>kT</i></sup>')}
<p>since the leading factor is a constant absorbed into normalisation.</p>
<p>Nothing was chosen. A logarithm expanded to first order and then exponentiated <em>can only</em> produce an exponential, and the rate in that exponential can only be the derivative that defines temperature. The Boltzmann factor is the shape of the answer, not a modelling assumption.</p>`,
  note:'The first-order truncation is where "reservoir" is spent: the expansion needs the second derivative to be negligible, which is the statement that the reservoir’s temperature does not change when the small system takes energy from it.',
  see:'statmech:1.0', seeLabel:'Where the exponential comes from' })}

<h3 id="t4">One function contains everything</h3>
<div class="eqb"><span class="mth"><i>Z</i> <span class="op">=</span> Σ <i>g</i><sub>i</sub>e<sup>−<i>E</i><sub>i</sub>/<i>kT</i></sup></span></div>
<p><span class="mth"><i>Z</i></span> counts the states that are <em>effectively available</em>: at high temperature it approaches the total number, at low temperature the ground-state degeneracy. Every thermodynamic quantity is a derivative of its logarithm:</p>
<div class="eqb"><span class="mth"><i>U</i> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm">∂ ln <i>Z</i></span><span class="den">∂β</span></span> , &nbsp;&nbsp; <i>F</i> <span class="op">=</span> <span class="op">−</span><i>kT</i> ln <i>Z</i> , &nbsp;&nbsp; <i>S</i> <span class="op">=</span> <span class="frac"><span class="nm"><i>U</i>−<i>F</i></span><span class="den"><i>T</i></span></span> , &nbsp;&nbsp; <i>p</i> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm">∂<i>F</i></span><span class="den">∂<i>V</i></span></span></span></div>
<p>Statistical mechanics is often described as the art of computing one sum, and this is why: once you have <span class="mth"><i>Z</i></span>, the rest is calculus.</p>
<p>The energy fluctuation gives the heat capacity for free:</p>
<div class="eqb"><span class="mth">⟨<i>E</i>²⟩ <span class="op">−</span> ⟨<i>E</i>⟩² <span class="op">=</span> <i>kT</i>²<i>C</i></span></div>
<p>A system that absorbs heat readily is one whose energy fluctuates a lot, and they are the <em>same number</em>. That pattern — a response function equal to a fluctuation — is the <strong>fluctuation–dissipation theorem</strong>, and it recurs throughout physics: conductivity and current noise, susceptibility and magnetisation fluctuations, viscosity and Brownian motion.</p>
<p class="note">A two-level system has a <em>maximum</em> heat capacity, the <strong>Schottky anomaly</strong>. Once both levels are equally populated there is nowhere left for energy to go. Almost nothing else in thermodynamics behaves this way, and it is a direct fingerprint of a system with a finite number of states.</p>

<h3 id="t5">Speeds in a gas</h3>
<p>The Boltzmann factor gives the distribution over velocity <em>vectors</em>, which peaks at zero. But we want speeds, and collecting all vectors of the same magnitude brings in the surface area of a sphere:</p>
<div class="eqb"><span class="mth"><i>f</i>(<i>v</i>) <span class="op">=</span> 4π<i>v</i>²(<span class="frac"><span class="nm"><i>m</i></span><span class="den">2π<i>kT</i></span></span>)<sup>3/2</sup>e<sup>−<i>mv</i>²/2<i>kT</i></sup></span></div>
<p>There is one way to stand still and an ever-growing shell of ways to move fast. That competition between a rising <span class="mth"><i>v</i>²</span> and a falling exponential is the entire shape of the curve, and it is why nothing is at rest.</p>
<p>Three speeds follow, always in the ratio <span class="mth">1 : 1.128 : 1.225</span> for every gas at every temperature — mode, mean and rms of a right-skewed distribution never coincide. The <strong>tail</strong> is out of all proportion to its size: reaction rates depend on the fraction above an activation energy, and because that fraction is exponential in <span class="mth"><i>E</i>/<i>kT</i></span>, a 10 K rise near room temperature can double a rate while barely moving the average speed.</p>

<h3 id="t6">Phase transitions</h3>
<p>Free energy <span class="mth"><i>F</i> = <i>U</i> − <i>TS</i></span> arbitrates between order (low energy) and disorder (high entropy), and the <span class="mth"><i>T</i></span> in front of the entropy decides the winner. A phase transition is the temperature at which the winner changes.</p>
<p>The Ising model — spins on a lattice, each preferring to agree with its neighbours — shows why dimension matters. In <strong>one dimension</strong> a domain wall costs a fixed energy <span class="mth">2<i>J</i></span> but can sit in any of <span class="mth"><i>N</i></span> places, gaining <span class="mth"><i>kT</i> ln <i>N</i></span> of entropy. For any <span class="mth"><i>T</i> > 0</span>, a long enough chain always finds <span class="mth">ln <i>N</i></span> large enough to pay for the wall: order is destroyed at every finite temperature, and the transfer-matrix solution confirms it exactly.</p>
<p>In <strong>two dimensions</strong> a domain wall's cost scales with its length, and so does its entropy. Neither automatically wins, so the ratio of coefficients decides — and that ratio depends on temperature. Onsager solved it exactly in 1944:</p>
<div class="eqb"><span class="mth">sinh(2<i>J</i>/<i>kT</i><sub>c</sub>) <span class="op">=</span> 1 <span class="op">⇒</span> <i>T</i><sub>c</sub> <span class="op">=</span> <span class="frac"><span class="nm">2<i>J</i></span><span class="den"><i>k</i> ln(1+√2)</span></span> <span class="op">=</span> 2.2692 <i>J</i>/<i>k</i></span></div>
<p>Near the transition the correlation length diverges: fluctuations appear on every length scale at once, the microscopic details stop mattering, and the order parameter vanishes as a power law with <strong>universal</strong> exponents. A magnet, a binary alloy ordering, and a liquid–gas critical point share critical exponents despite having nothing physically in common. Explaining that universality is what the renormalisation group did, and it is one of the genuine triumphs of twentieth-century physics.</p>
<p class="note">The Ising model is not primarily about magnets. The same two-state variables with the same neighbour coupling describe binary alloys, lattice gases, and neural networks — it is the simplest system in which purely local interactions produce global order, which is why it turns up everywhere.</p>
`;
