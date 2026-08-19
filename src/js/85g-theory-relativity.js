const THEORY_REL = `
<div class="toc">
  <a href="#r0">Two postulates</a><a href="#r1">Simultaneity</a>
  <a href="#r2">The transformation</a><a href="#r3">The interval</a>
  <a href="#r4">Rapidity</a><a href="#r5">Dilation &amp; contraction</a>
  <a href="#r6">Velocities</a><a href="#r7">Four-vectors</a>
  <a href="#r8">E = mc²</a><a href="#r9">Doppler &amp; aberration</a>
  <a href="#r10">Fields under boosts</a><a href="#r11">The tensor</a>
  <a href="#r12">Where magnetism comes from</a>
  <a href="#r13">Equivalence</a><a href="#r14">Curvature</a>
  <a href="#r15">The field equations</a><a href="#r16">Schwarzschild</a>
  <a href="#r17">The classical tests</a><a href="#r18">Horizons</a>
  <a href="#r19">Waves</a><a href="#r20">What is still open</a>
</div>

<h3 id="r0">Two postulates, and what they cost</h3>
<p>Special relativity has two assumptions and no adjustable parameters.</p>
<ul>
  <li><strong>The principle of relativity.</strong> The laws of physics take the same form in every inertial frame. This is Galileo's, not Einstein's, and nobody objected to it.</li>
  <li><strong>The invariance of c.</strong> The speed of light in vacuum is one of those laws, so every inertial observer measures the same value for it — regardless of how the source is moving, or the observer.</li>
</ul>
<p>The second postulate is not an experimental curiosity bolted onto the first; it is what the first one <em>implies</em> once you accept Maxwell's equations as laws. Maxwell's equations contain c explicitly, as √(1/ε₀μ₀), built out of two constants you can measure with a capacitor and a coil on a bench. If the equations hold in every inertial frame, so does that number.</p>
<p>The price is paid by an assumption so deeply buried nobody had thought to state it: that two events either <em>are</em> simultaneous or <em>are not</em>, independently of who is asking. That assumption is what has to go.</p>
<div class="note">Einstein's 1905 paper is titled <em>On the electrodynamics of moving bodies</em> and its first paragraph is about a magnet and a coil, not about clocks. He was not trying to fix mechanics; he was trying to remove an asymmetry from electromagnetism, and mechanics was collateral damage.</div>

<h3 id="r1">Simultaneity is not a property of events</h3>
<p>To say two distant events happened "at the same time" you need a procedure. The only one available uses light, and the only light available goes at c for everybody. Run the train-and-embankment argument: strike both ends of a moving train with lightning such that the embankment observer, standing at the midpoint, receives both flashes together. The train observer, moving towards one flash and away from the other, meets the forward one first — and since light travels at c for them too, and they sat exactly halfway between the strike points <em>in their own frame</em>, they must conclude the forward strike happened earlier.</p>
<div class="eqb"><span class="mth">
Δ<i>t</i>′ = −γ<i>v</i>Δ<i>x</i>/<i>c</i>² &nbsp;&nbsp; for events simultaneous in the unprimed frame
</span></div>
<p>Neither observer is mistaken and no experiment distinguishes them. Simultaneity is a relation between an event pair <em>and a frame</em>. Everything else in special relativity is a consequence, including the two effects usually taught first.</p>

<h3 id="r2">The Lorentz transformation</h3>
<p>Demand linearity (so that free particles move in straight lines in every frame), isotropy, that the transformations form a group, and that x = ct maps to x′ = ct′. Those requirements alone fix the answer up to the value of one constant, and experiment fixes that constant to be c:</p>
<div class="eqb"><span class="mth">
<i>ct</i>′ = γ(<i>ct</i> − β<i>x</i>) &nbsp;&nbsp; <i>x</i>′ = γ(<i>x</i> − β<i>ct</i>) &nbsp;&nbsp; <i>y</i>′ = <i>y</i> &nbsp;&nbsp; <i>z</i>′ = <i>z</i>
</span></div>
<div class="eqb"><span class="mth">
β = <i>v</i>/<i>c</i> &nbsp;&nbsp;·&nbsp;&nbsp; γ = 1/<span class="rad">1 − β²</span><sup>−½</sup> = 1/√(1 − β²)
</span></div>
<p>Notice that <em>y</em> and <em>z</em> are untouched. Transverse lengths are unaffected by a boost — a fact used without comment in the light-clock argument, and one that has to be true, or two observers passing each other could disagree about which of two rings fits through the other, which is a paradox with a physical outcome.</p>
<p>Set c → ∞ and the transformation degenerates to <em>t</em>′ = <em>t</em>, <em>x</em>′ = <em>x</em> − <em>vt</em>: Galileo. Newtonian mechanics is not wrong; it is the leading term of an expansion in β², and at walking pace the first correction is one part in 10¹⁷.</p>

<h3 id="r3">The interval: what everybody agrees on</h3>
<p>Different frames disagree about <em>t</em> and about <em>x</em>. They agree, exactly, about one combination:</p>
<div class="eqb"><span class="mth">
<i>s</i>² = (<i>c</i>Δ<i>t</i>)² − Δ<i>x</i>² − Δ<i>y</i>² − Δ<i>z</i>²
</span></div>
<p>This is the Pythagorean theorem of spacetime, with one sign flipped — and that flip is the entire difference between space and time. The sign of s² classifies event pairs into three kinds, and the classification is absolute:</p>
<ul>
  <li><strong>Timelike</strong> (s² &gt; 0). Reachable by something slower than light. Some frame has them at the same place, and √s²/c is the wristwatch time of the observer who goes from one to the other. Their time order is the same for everyone.</li>
  <li><strong>Spacelike</strong> (s² &lt; 0). No signal connects them. Some frame has them simultaneous, some has A first, some has B first — and causality is safe precisely because nothing that could influence anything is ever reordered.</li>
  <li><strong>Lightlike</strong> (s² = 0). Connected by light alone. The interval is zero in every frame, which is why the light cone is the one feature of a spacetime diagram that a boost cannot move.</li>
</ul>
<p>The light cone, not the axes, is the real structure of spacetime. Boosts are precisely the linear maps that preserve it.</p>

${stThm('The spacetime interval is invariant under a Lorentz boost', {
  hyp:'two frames related by a boost of speed <span class="mth"><i>v</i></span> along <span class="mth"><i>x</i></span>, with <span class="mth">β = <i>v</i>/<i>c</i></span> and <span class="mth">γ = 1/√(1−β²)</span>',
  then:'',
  eq:'(<i>c</i>Δ<i>t</i>′)² <span class="op">−</span> Δ<i>x</i>′² <span class="op">=</span> (<i>c</i>Δ<i>t</i>)² <span class="op">−</span> Δ<i>x</i>²',
  proof:`<p>The Lorentz transformation is</p>
${stEq('<i>c</i>Δ<i>t</i>′ <span class="op">=</span> γ(<i>c</i>Δ<i>t</i> <span class="op">−</span> βΔ<i>x</i>) , &nbsp;&nbsp; Δ<i>x</i>′ <span class="op">=</span> γ(Δ<i>x</i> <span class="op">−</span> β<i>c</i>Δ<i>t</i>)')}
<p>Square each and subtract. Writing <span class="mth"><i>T</i> = <i>c</i>Δ<i>t</i></span> and <span class="mth"><i>X</i> = Δ<i>x</i></span> to keep it readable:</p>
${stEq('<i>T</i>′² <span class="op">−</span> <i>X</i>′² <span class="op">=</span> γ²[(<i>T</i> <span class="op">−</span> β<i>X</i>)² <span class="op">−</span> (<i>X</i> <span class="op">−</span> β<i>T</i>)²]')}
<p>Expand the bracket. The cross terms are <span class="mth">−2β<i>TX</i></span> and <span class="mth">+2β<i>TX</i></span>, which <strong>cancel</strong> — that cancellation is the whole theorem:</p>
${stEq('<span class="op">=</span> γ²[<i>T</i>² <span class="op">+</span> β²<i>X</i>² <span class="op">−</span> <i>X</i>² <span class="op">−</span> β²<i>T</i>²] <span class="op">=</span> γ²(1 <span class="op">−</span> β²)(<i>T</i>² <span class="op">−</span> <i>X</i>²)')}
<p>and by definition <span class="mth">γ²(1 − β²) = 1</span>. So <span class="mth"><i>T</i>′² − <i>X</i>′² = <i>T</i>² − <i>X</i>²</span>. The transverse coordinates are untouched by the boost, so the full four-dimensional interval is invariant too.</p>
<p>Notice that <span class="mth">γ</span> was not chosen to make this work by hand — it is forced. The factor <span class="mth">γ²(1−β²)</span> must equal 1 for the interval to survive, and that single requirement <em>is</em> the definition of <span class="mth">γ</span>. Invariance of the interval and the form of the Lorentz transformation are the same statement.</p>`,
  note:'Setting s² = 0 shows the light cone is preserved exactly, which is the geometric content of the second postulate: a boost is precisely a linear map that leaves the cone alone. In Euclidean space the analogous invariant is x² + y²; here one sign is flipped, and that flip is the entire difference between space and time.',
  see:'relativity:1.0', seeLabel:'The Minkowski diagram — a boost is a rotation' })}

<h3 id="r4">A boost is a rotation</h3>
<p>An ordinary rotation preserves x² + y² and is parameterised by an angle. A boost preserves (ct)² − x² and is parameterised by a <strong>rapidity</strong>:</p>
<div class="eqb"><span class="mth">
φ = artanh β &nbsp;&nbsp;·&nbsp;&nbsp; γ = cosh φ &nbsp;&nbsp;·&nbsp;&nbsp; βγ = sinh φ
</span></div>
<div class="eqb"><span class="mth">
<i>ct</i>′ = <i>ct</i> cosh φ − <i>x</i> sinh φ &nbsp;&nbsp;·&nbsp;&nbsp; <i>x</i>′ = <i>x</i> cosh φ − <i>ct</i> sinh φ
</span></div>
<p>Written this way a boost is a hyperbolic rotation in the (ct, x) plane, and the awkward facts become obvious ones. <strong>Rapidities add</strong> under composition, exactly as angles do. Speeds do not, and the velocity-addition rule is nothing but the addition formula for tanh. Reaching c means reaching infinite rapidity, so no finite sequence of finite boosts gets there — which is a far better answer to "why can nothing reach c?" than "because γ blows up".</p>

<h3 id="r5">Dilation and contraction, stated carefully</h3>
<div class="eqb"><span class="mth">
Δ<i>t</i> = γ Δτ &nbsp;&nbsp;&nbsp; <i>L</i> = <i>L</i><sub>0</sub>/γ
</span></div>
<p>Both statements have hidden qualifiers, and most confusion comes from dropping them.</p>
<p><strong>Time dilation</strong> compares the <em>proper time</em> τ along a worldline — what one clock reads between two events on it — with the coordinate time between those events in a frame where the clock moves. Proper time is a property of a path, not of a frame, and that is why it is not symmetric in the twin problem.</p>
<p><strong>Length contraction</strong> is a statement about a <em>measurement procedure</em>: the length of a moving object means the distance between where its two ends are <em>at one moment of your time</em>. Since frames disagree about "one moment", they disagree about the length, reciprocally and without contradiction. The ladder-and-barn stage exists to make that concrete: the two door-closings are spacelike separated, so "both doors were shut with the ladder inside" is not a fact about the world.</p>
<div class="note">Contraction is not a Lorentz-FitzGerald squashing caused by motion through an ether. Nothing is stressed and nothing recoils. The object is unchanged; the slice you took through it is different.</div>

<h3 id="r6">Velocities</h3>
<div class="eqb"><span class="mth">
<i>w</i> = (<i>u</i> + <i>v</i>) / (1 + <i>uv</i>/<i>c</i>²)
</span></div>
<p>Feed it two subluminal speeds and it returns a subluminal one, always. Feed it c and it returns c, from any frame. The transverse components transform too, even though transverse <em>lengths</em> do not, because the time being divided by is not the same time:</p>
<div class="eqb"><span class="mth">
<i>u</i><sub>⊥</sub>′ = <i>u</i><sub>⊥</sub> / [γ(1 − β<i>u<sub>x</sub></i>/<i>c</i>)]
</span></div>
<p>That last formula is the origin of aberration, and therefore of the headlight effect: an isotropically emitting source in motion beams its light into a forward cone of half-angle roughly 1/γ.</p>

<h3 id="r7">Four-vectors</h3>
<p>The efficient way to do all of this is to stop transforming components and start using objects that transform as a block. A four-vector is any set of four numbers obeying <em>a</em>′<sup>μ</sup> = Λ<sup>μ</sup><sub>ν</sub> <em>a</em><sup>ν</sup>, and the inner product a·b = a⁰b⁰ − <b>a</b>·<b>b</b> is then automatically frame-independent.</p>
<div class="eqb"><span class="mth">
<i>x</i><sup>μ</sup> = (<i>ct</i>, <b>r</b>) &nbsp;·&nbsp; <i>u</i><sup>μ</sup> = γ(<i>c</i>, <b>v</b>) &nbsp;·&nbsp; <i>p</i><sup>μ</sup> = <i>mu</i><sup>μ</sup> = (<i>E</i>/<i>c</i>, <b>p</b>) &nbsp;·&nbsp; <i>J</i><sup>ν</sup> = (<i>c</i>ρ, <b>J</b>) &nbsp;·&nbsp; <i>A</i><sup>ν</sup> = (φ/<i>c</i>, <b>A</b>)
</span></div>
<p>Two immediate payoffs. <em>u</em>·<em>u</em> = c² always — four-velocity has fixed length, so acceleration is always "turning" in spacetime, never speeding up. And ∂<sub>ν</sub>J<sup>ν</sup> = 0 is charge conservation written in one symbol, manifestly the same in every frame.</p>

<h3 id="r8">E = mc², and what it does not say</h3>
<p>Since p<sup>μ</sup> is a four-vector, p·p is invariant. Evaluating it in the rest frame gives (mc)², so:</p>
<div class="eqb"><span class="mth">
<i>E</i>² = (<i>pc</i>)² + (<i>mc</i>²)² &nbsp;&nbsp;·&nbsp;&nbsp; <i>E</i> = γ<i>mc</i>² &nbsp;&nbsp;·&nbsp;&nbsp; <b>p</b> = γ<i>m</i><b>v</b>
</span></div>
<p>Mass is the <em>length</em> of the four-momentum vector. It does not increase with speed — E and <b>p</b> do, and they slide along a fixed hyperbola while their invariant combination does not move at all. The idea of "relativistic mass" is best abandoned: inertia is γ³m along the direction of motion and γm across it, so no single number deserves the name.</p>
<p>Expanding for small β gives E ≈ mc² + ½mv² + (3/8)mv⁴/c² + …, which shows what the famous equation actually claims. The kinetic energy is the familiar one plus corrections; the new content is the constant term, an energy a body has for existing. It is the term that makes fission and fusion arithmetic work, that makes a proton 100 times heavier than the quarks inside it (the rest is gluon field energy), and that makes the invariant mass of two back-to-back photons nonzero although each photon has none.</p>
<div class="note">A closed box of hot gas weighs more than the same box cold. A charged capacitor weighs more than a discharged one. Mass is not a count of constituents; it is a measure of the total energy in the frame where the momentum vanishes.</div>

<h3 id="r9">Doppler and aberration</h3>
<div class="eqb"><span class="mth">
ν<sub>obs</sub> / ν<sub>0</sub> = 1 / [γ(1 − β cos θ)] &nbsp;&nbsp;·&nbsp;&nbsp; cos θ = (cos θ′ + β)/(1 + β cos θ′)
</span></div>
<p>Head-on this is the k-factor √((1+β)/(1−β)); dead astern, its reciprocal. The interesting case is θ = 90°, where the classical shift vanishes and a residual redshift of exactly 1/γ remains. This <strong>transverse Doppler effect</strong> has no classical counterpart whatsoever — it is time dilation observed directly, and Ives and Stilwell measured it on a hydrogen-ion beam in 1938.</p>
<p>The largest Doppler shift ever measured is our own. The cosmic microwave background is isotropic to a part in 10⁵ except for a dipole of 3.36 mK, which is not a feature of the early universe but the Local Group's 370 km/s drift, seen through these two formulas.</p>

<h3 id="r10">Fields under boosts</h3>
<p>Now the part Einstein actually cared about. E and B do not transform independently; a boost mixes them:</p>
<div class="eqb"><span class="mth">
<b>E</b>′<sub>∥</sub> = <b>E</b><sub>∥</sub> &nbsp;&nbsp; <b>E</b>′<sub>⊥</sub> = γ(<b>E</b> + <b>v</b>×<b>B</b>)<sub>⊥</sub>
</span></div>
<div class="eqb"><span class="mth">
<b>B</b>′<sub>∥</sub> = <b>B</b><sub>∥</sub> &nbsp;&nbsp; <b>B</b>′<sub>⊥</sub> = γ(<b>B</b> − <b>v</b>×<b>E</b>/<i>c</i>²)<sub>⊥</sub>
</span></div>
<p>A purely electric field, boosted, acquires a magnetic part out of nothing. So "is there a magnetic field here?" has no frame-independent answer. Two combinations do:</p>
<div class="eqb"><span class="mth">
<b>E</b>·<b>B</b> &nbsp;&nbsp;and&nbsp;&nbsp; <i>E</i>² − <i>c</i>²<i>B</i>²
</span></div>
<p>and they classify the field absolutely. If E·B = 0 and E² &gt; c²B², a frame exists in which B vanishes entirely — the magnetism was never a separate substance. If E·B = 0 and c²B² &gt; E², a frame exists with no electric field. If both invariants vanish, it is a light wave, and no frame can make it anything else. If E·B ≠ 0, neither field can be removed by any observer.</p>

<h3 id="r11">One tensor, two equations</h3>
<p>The six components are the entries of an antisymmetric rank-2 tensor:</p>
<div class="eqb"><span class="mth">
<i>F</i><sup>μν</sup> = ∂<sup>μ</sup><i>A</i><sup>ν</sup> − ∂<sup>ν</sup><i>A</i><sup>μ</sup> &nbsp;&nbsp;·&nbsp;&nbsp; <i>F</i><sup>0<i>i</i></sup> = −<i>E<sub>i</sub></i>/<i>c</i>, &nbsp; <i>F</i><sup><i>ij</i></sup> = −ε<sup><i>ijk</i></sup><i>B<sub>k</sub></i>
</span></div>
<p>Antisymmetry is why there are six and not sixteen — a rank-2 antisymmetric tensor in four dimensions has exactly 4·3/2 = 6 independent components — and it is the deepest available answer to why there are two fields with three components each. A boost is then plain matrix conjugation, F′ = ΛFΛᵀ, and Maxwell's four equations collapse to two:</p>
<div class="eqb"><span class="mth">
∂<sub>μ</sub><i>F</i><sup>μν</sup> = μ<sub>0</sub><i>J</i><sup>ν</sup> &nbsp;&nbsp;·&nbsp;&nbsp; ∂<sub>[λ</sub><i>F</i><sub>μν]</sub> = 0
</span></div>
<p>The first is Gauss and Ampère–Maxwell together; the second is "no monopoles" and Faraday together, and it is an identity given the potential. The Lorentz force is dp<sup>μ</sup>/dτ = qF<sup>μν</sup>u<sub>ν</sub>. The two invariants of the previous section are F<sub>μν</sub>F<sup>μν</sup> = 2(B² − E²/c²) and F<sub>μν</sub>F̃<sup>μν</sup> ∝ E·B.</p>
<div class="note">This is why Maxwell's equations needed no repair in 1905 while Newton's mechanics did. They were already Lorentz covariant — Lorentz had found the transformation a decade earlier as a curiosity of electrodynamics. What Einstein contributed was the recognition that it was a statement about space and time rather than about the ether.</div>

<h3 id="r12">Where magnetism comes from</h3>
<p>Take a current-carrying wire: a fixed positive lattice of density λ₀ and an equal density of electrons drifting at v<sub>d</sub>. Net charge zero, so a charge q moving parallel to it at v feels a purely magnetic force qvB with B = μ₀I/2πd.</p>
<p>Now ride with q. There is no magnetic force — q is at rest. But the lattice now moves and contracts, while the electrons' speed changes by velocity addition and their contraction changes with it. Using the exact identity γ(v<sub>d</sub>′) = γ(v)γ(v<sub>d</sub>)(1 − vv<sub>d</sub>/c²), the densities no longer cancel:</p>
<div class="eqb"><span class="mth">
λ′ = λ<sub>0</sub> γ<sub><i>v</i></sub> <i>v v<sub>d</sub></i>/<i>c</i>²
</span></div>
<p>The wire is charged, there is an electric field λ′/2πε₀d, and the force is purely electrostatic — equal to the magnetic answer times γ<sub>v</sub>, which is exactly what agreement looks like, since transverse force transforms as F′<sub>⊥</sub> = γF<sub>⊥</sub> for a particle at rest in the primed frame.</p>
<p>Two things deserve emphasis. First, this is not an analogy; it is a derivation, and the two calculations agree to the last available bit. Second, look at the numbers. Electrons drift through household wiring at about 10⁻⁴ m/s, so v·v<sub>d</sub>/c² is of order 10⁻¹⁷ — the charge imbalance carrying the entire magnetic force is a part in a hundred million billion of either lattice. It is measurable only because the number of charges is correspondingly vast. Every permanent magnet is a relativistic effect at a hundred-millionth of the speed of light.</p>

<h3 id="r13">The equivalence principle</h3>
<p>In 1907 Einstein noticed that a man in free fall does not feel his own weight, and called it the happiest thought of his life. Stated properly: <strong>no local experiment can distinguish a uniformly accelerated frame from a frame at rest in a uniform gravitational field.</strong></p>
<p>The word <em>local</em> is doing real work. Over a large enough region, gravity is distinguishable — two plumb lines a mile apart are not parallel, and a falling cloud of dust is stretched vertically and squeezed horizontally. Those <strong>tidal</strong> effects are the parts of gravity that no choice of frame removes, and they are the physical content of curvature.</p>
<p>Two predictions follow immediately, with no field equations required:</p>
<ul>
  <li><strong>Light bends.</strong> In an accelerating box the floor rises to meet a horizontal beam, so the beam curves relative to the box. By the principle, it must curve in gravity too.</li>
  <li><strong>Clocks run slow low down.</strong> In an accelerating box the receiver recedes from the light while it is in flight, so it sees a redshift gh/c². By the principle, so does a receiver held at height h in a field.</li>
</ul>
<div class="eqb"><span class="mth">
Δν/ν = <i>gh</i>/<i>c</i>² &nbsp;&nbsp;·&nbsp;&nbsp; more generally &nbsp; dτ/d<i>t</i> = √(1 + 2Φ/<i>c</i>²)
</span></div>
<p>Pound and Rebka measured the redshift up a 22.5 m tower at Harvard in 1959: 2.46×10⁻¹⁵, confirmed to 1%. It is now routine — optical clocks resolve a height difference of a few centimetres.</p>
<div class="note">Gravitational time dilation, not spatial curvature, is responsible for essentially all of everyday gravity. A thrown ball follows the path that maximises its own proper time, and since clocks run faster higher up, it pays to go up — but going too fast costs proper time by special-relativistic dilation. The parabola is the optimum trade. The rubber-sheet picture, which shows only space, explains none of this.</div>

<h3 id="r14">Why curvature, and what it means</h3>
<p>The rotating disk forces the issue. Rulers laid round the rim of a spinning disk are moving along their own length and contract; radial ones do not. So the disk measures C = 2πRγ against radius R, and C/2πR &gt; 1. There is no gravity anywhere in that setup — and the geometry is already non-Euclidean. Combine it with equivalence and the conclusion is unavoidable: gravity is geometry.</p>
<p>The machinery is Riemannian. The metric g<sub>μν</sub> defines lengths and times; the connection Γ<sup>λ</sup><sub>μν</sub> defines what "straight" means; the Riemann tensor R<sup>ρ</sup><sub>σμν</sub> measures how much a vector rotates when carried round a small loop, and it is nonzero exactly when no coordinate change can remove the field over an extended region.</p>
<div class="eqb"><span class="mth">
d²<i>x</i><sup>μ</sup>/dτ² + Γ<sup>μ</sup><sub>αβ</sub> (d<i>x</i><sup>α</sup>/dτ)(d<i>x</i><sup>β</sup>/dτ) = 0
</span></div>
<p>That is the geodesic equation: the statement that a freely falling body moves as straight as the geometry allows. There is no force term. Gravity has stopped being a force, and the thing that <em>is</em> a force is the ground pushing up on your feet — which is why an accelerometer reads zero in free fall and 1 g on a table.</p>

<h3 id="r15">The field equations</h3>
<div class="eqb"><span class="mth">
<i>G</i><sub>μν</sub> + Λ<i>g</i><sub>μν</sub> = (8π<i>G</i>/<i>c</i>⁴) <i>T</i><sub>μν</sub>
</span></div>
<p>Matter and energy on the right; the shape of spacetime on the left. G<sub>μν</sub> = R<sub>μν</sub> − ½Rg<sub>μν</sub> is chosen so that its divergence vanishes identically, which forces conservation of energy and momentum rather than assuming it. The coefficient 8πG/c⁴ is fixed by requiring that the weak-field limit reproduce Newton.</p>
<p>These are ten coupled nonlinear partial differential equations, and the nonlinearity is physical: gravitational field energy itself gravitates, unlike electromagnetic field energy, which carries no charge. That is why there is no superposition principle here, and why exact solutions are rare and precious.</p>
<p>Λ, the cosmological constant, was introduced to allow a static universe, dropped when Hubble found expansion, and reinstated in 1998 when supernova surveys found the expansion accelerating. It now accounts for about 69% of the energy budget and nobody knows what it is.</p>

<h3 id="r16">Schwarzschild's solution</h3>
<p>Karl Schwarzschild solved the equations for a spherical mass within weeks of the 1915 paper, while serving on the Russian front; he died of an illness contracted there a few months later.</p>
<div class="eqb"><span class="mth">
d<i>s</i>² = −(1 − <i>r<sub>s</sub></i>/<i>r</i>)<i>c</i>²d<i>t</i>² + d<i>r</i>²/(1 − <i>r<sub>s</sub></i>/<i>r</i>) + <i>r</i>²dΩ² &nbsp;&nbsp;·&nbsp;&nbsp; <i>r<sub>s</sub></i> = 2<i>GM</i>/<i>c</i>²
</span></div>
<p>Two factors, and they are reciprocals: time runs slow by √(1 − r<sub>s</sub>/r) and radial distance is stretched by the same factor. Note that r is <em>defined</em> by the circumference of a ring, r = C/2π, and is not the result of any radial measurement — the proper radial distance between two r values exceeds their difference, which is what curvature means operationally. Landmarks:</p>
<ul>
  <li><strong>r<sub>s</sub> = 2GM/c²</strong> — the horizon. 2.95 km for the Sun, 8.9 mm for the Earth.</li>
  <li><strong>1.5 r<sub>s</sub></strong> — the photon sphere, where light can orbit (unstably).</li>
  <li><strong>3 r<sub>s</sub></strong> — the innermost stable circular orbit, the inner edge of an accretion disc. Newtonian gravity has no such thing.</li>
  <li><strong>b = 3√3 GM/c²</strong> — the critical impact parameter. Aim a photon inside it and it never comes out; this circle is the black shadow the Event Horizon Telescope imaged.</li>
</ul>

<h3 id="r17">The classical tests</h3>
<p><strong>Perihelion precession.</strong> The orbit equation in u = 1/r gains one term:</p>
<div class="eqb"><span class="mth">
d²<i>u</i>/dφ² + <i>u</i> = <i>GM</i>/<i>L</i>² + (3<i>GM</i>/<i>c</i>²)<i>u</i>²
</span></div>
<p>Without it the orbit is a closed conic. With it the ellipse turns by 6πGM/c²a(1−e²) per orbit — 43″ per century for Mercury, a discrepancy Le Verrier had found in 1859 and tried to explain with a planet called Vulcan. Einstein computed it in November 1915 and wrote that it gave him palpitations; it is the only classical test that was a retrodiction, with no free parameters left to adjust.</p>
<p><strong>Light deflection.</strong> Δθ = 4GM/c²b, exactly twice the answer you get by treating light as a fast Newtonian corpuscle. Half comes from the time part of the metric and half from the space part, so the factor of two <em>is</em> the test of spatial curvature. Eddington and Dyson photographed the 1919 eclipse from Príncipe and Sobral; the coefficient is now known to about one part in 10⁵ from radio interferometry. The modern way of stating the ratio is the parametrised-post-Newtonian <b>γ</b>, defined so that the deflection is (1+γ)·2GM/c²b: general relativity says γ = 1, a theory that curves only time says γ = 0, and Cassini's radio tracking gives γ − 1 = (2.1 ± 2.3)×10⁻⁵. The lensing panel measures γ from the reader's own metric by running one quadrature twice.</p>
<p><strong>And the expansion fails close in, in a specific way.</strong> A ray aimed just outside the critical impact parameter loops the photon sphere before escaping, and the deflection diverges <em>logarithmically</em>: Δθ ≈ −(1/λ)ln(b/b<sub>c</sub> − 1), with λ the Lyapunov exponent of the unstable circular photon orbit — 1 exactly for Schwarzschild, in units of c³/GM. Each extra loop is fainter by e<sup>−2πλ</sup>, about one part in 535, which is why a black hole image carries a nested series of ever-dimmer <b>photon rings</b> inside the main one and why only the first has been resolved.</p>
<p><strong>Gravitational redshift.</strong> Pound–Rebka, above, and every atomic clock since.</p>
<p><strong>Shapiro delay.</strong> Radar bounced off Venus at superior conjunction returns a few hundred microseconds late. Nothing travels slower than c; the path through the deeper metric is longer than it looks. Cassini pinned this to ~10⁻⁵, making it the tightest of the four.</p>
<p><strong>GPS.</strong> Not a test so much as an engineering consequence: satellite clocks gain 45.7 μs/day from the weaker potential and lose 7.2 μs/day from their speed, for a net +38.5 μs/day. Uncorrected, positions drift by about 11 km per day. The oscillators are deliberately detuned before launch.</p>

<h3 id="r18">Horizons</h3>
<p>Fall in from rest and your own clock reaches the horizon in a finite, short time, with nothing local marking the crossing. The Schwarzschild coordinate time diverges logarithmically — which is why distant observers describe you as freezing and fading, a statement about the last photons struggling out rather than about you. The coordinate singularity at r = r<sub>s</sub> is an artefact of the chart; Eddington–Finkelstein and Kruskal coordinates cross it smoothly. The singularity at r = 0 is not an artefact, and is generally taken as the theory announcing its own limits.</p>
<p>Two counterintuitive scalings. Mean density inside the horizon falls as 1/M², so a few-billion-solar-mass hole is less dense than water. And tidal force at the horizon falls as c⁶/G²M², so <em>bigger holes are gentler</em>: at 10 M<sub>☉</sub> you are torn apart thousands of kilometres out, while at Sgr A* you would cross in good health with roughly a minute of proper time remaining.</p>
<p>Horizons are not exclusive to black holes. An observer accelerating forever has one too, at proper distance c²/a behind them, and an accelerating detector registers a thermal bath at T = ħa/2πck<sub>B</sub> (the Unruh effect) where an inertial one finds vacuum. Combined with Hawking's result that a black hole radiates at T = ħc³/8πGMk<sub>B</sub> and carries entropy proportional to its horizon <em>area</em>, this is the strongest hint anywhere that gravity, thermodynamics and information are aspects of one subject nobody has finished writing.</p>

<h3 id="r19">Gravitational waves</h3>
<p>Linearise about flat space, g<sub>μν</sub> = η<sub>μν</sub> + h<sub>μν</sub>, and the field equations become a wave equation with solutions travelling at c. There is no monopole radiation (mass is conserved) and no dipole radiation (momentum is conserved), so the leading term is the quadrupole — which is why gravity radiates so feebly that only catastrophes are detectable.</p>
<div class="eqb"><span class="mth">
δ<i>x</i> = ½(<i>h</i><sub>+</sub><i>x</i> + <i>h</i><sub>×</sub><i>y</i>) &nbsp;&nbsp;·&nbsp;&nbsp; δ<i>y</i> = ½(<i>h</i><sub>×</sub><i>x</i> − <i>h</i><sub>+</sub><i>y</i>)
</span></div>
<p>Two polarisations, at 45° to each other rather than 90°, because the wave is spin-2. A ring of free masses becomes an ellipse, then the other ellipse. Strain h is dimensionless and at Earth is of order 10⁻²¹, which for LIGO's 4 km arms is a length change ten thousand times smaller than a proton.</p>
<p>What a detector measures is not a mass but a <em>sweep</em>. Balance the quadrupole luminosity against the orbital energy and the separation shrinks as <b>ȧ = −(64/5)G³m₁m₂M/c⁵a³</b>; Kepler turns that into a rising frequency, and the rate at which it rises depends on the two masses through one combination only — the <b>chirp mass</b> <b>M<sub>c</sub> = (m₁m₂)<sup>3/5</sup>/(m₁+m₂)<sup>1/5</sup></b>, with <b>ḟ = (96/5)π<sup>8/3</sup>(GM<sub>c</sub>/c³)<sup>5/3</sup>f<sup>11/3</sup></b>. Measure f and ḟ and the chirp mass falls out with no distance, no orientation and no model of the source needed; the amplitude then gives the distance, which is why these events are called <em>standard sirens</em> and why GW170817 yielded an independent measurement of the Hubble constant. The individual masses are far harder: two very different pairs with the same chirp mass produce the same waveform until the last few cycles, when the total mass finally shows itself in where the inspiral ends.</p>
<p>The first evidence arrived four decades earlier and from a quieter direction. A binary pulsar is a clock in an orbit, so its orbital period is measurable to fifteen figures — and if the system radiates, that period must shorten. Hulse and Taylor found PSR B1913+16 in 1974; its period decays by 76 μs per year, its orbit shrinks by about three and a half metres a year, and the quadrupole formula predicts that to two parts in a thousand. The eccentricity is doing most of the work: <b>e = 0.617</b> multiplies the radiated power by <b>(1 + 73e²/24 + 37e⁴/96)/(1−e²)<sup>7/2</sup> = 11.86</b>, because a body at pericentre is both closest and fastest and almost the whole emission happens there. The double pulsar J0737−3039, where both neutron stars are visible and the mass ratio is therefore measured rather than fitted, has since pushed the same test to <b>four parts in a hundred thousand</b>.</p>
<p>GW150914, on 14 September 2015: two black holes of about 36 and 31 M<sub>☉</sub> merging into 63, radiating three solar masses of energy as pure spacetime strain in about 20 milliseconds at a peak power near 3.6×10⁴⁹ W — more than the light of every star in the observable universe, and none of it visible. GW170817, a neutron-star merger seen in gravitational waves and 1.7 s later in gamma rays, fixed their speed to c within one part in 10¹⁵, eliminated a swathe of modified-gravity theories overnight, and showed that such mergers produce a good deal of the universe's heavy elements.</p>

<h3 id="r20">What is still open</h3>
<ul>
  <li><strong>Quantum gravity.</strong> General relativity is a classical field theory and its perturbative quantisation is non-renormalisable. Every approach — strings, loops, asymptotic safety — is incomplete, and there is no experiment in reach that distinguishes them.</li>
  <li><strong>Singularities.</strong> The Penrose–Hawking theorems say that under reasonable conditions they are unavoidable, which most people read as the theory failing rather than the universe containing infinities.</li>
  <li><strong>The information paradox.</strong> Hawking radiation appears thermal, so a black hole that evaporates seems to destroy information — which quantum mechanics forbids. Recent work on entanglement islands suggests a resolution, and it is not settled.</li>
  <li><strong>Λ.</strong> The observed vacuum energy is some 120 orders of magnitude below the naive quantum field theory estimate. This is the worst quantitative prediction in the history of physics and nobody has fixed it.</li>
  <li><strong>Dark matter.</strong> Galaxy rotation curves, lensing and the CMB all demand mass we cannot see. Modifying gravity instead is possible but strained, and GW170817 closed off many of the ways of doing it.</li>
</ul>
<p>None of that is a reason to distrust what is on these pages. General relativity has passed every test put to it for a century, including several — frame dragging, the double pulsar's orbital decay, the shadow of M87* — that its author never imagined would be measurable. It is simply not the last word, and it says so itself.</p>
`;
