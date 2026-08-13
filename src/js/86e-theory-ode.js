const THEORY_ODE = `
<div class="toc">
  <a href="#d1">What a linear equation is</a><a href="#d2">The characteristic equation</a>
  <a href="#d3">The three cases</a><a href="#d4">Independence &amp; the Wronskian</a>
  <a href="#d5">Nonhomogeneous equations</a><a href="#d6">Variation of parameters</a>
  <a href="#d7">The driven oscillator</a><a href="#d8">Series solutions</a>
</div>

<h3 id="d1">Second-order linear equations</h3>
<div class="eqb"><span class="mth"><i>a</i> <i>y</i>″ <span class="op">+</span> <i>b</i> <i>y</i>′ <span class="op">+</span> <i>c</i> <i>y</i> <span class="op">=</span> <i>g</i>(<i>t</i>)</span></div>
<p><strong>Linear</strong> means <span class="mth"><i>y</i></span> and its derivatives appear only to the first power and never multiplied together. That single restriction buys the whole theory: the solutions of the homogeneous equation (<span class="mth"><i>g</i> = 0</span>) form a <em>vector space</em>, and for second order it is exactly two-dimensional. Find two independent solutions and you have found them all.</p>
<p>It also gives the <strong>superposition principle</strong>, which is why this equation is everywhere in physics: a spring-mass-damper, a series RLC circuit, a pendulum for small angles, and — in the quantum wing — the time-independent Schrödinger equation are all this one object.</p>

<h3 id="d2">The characteristic equation</h3>
<p>Try <span class="mth"><i>y</i> = <i>e</i><sup><i>rt</i></sup></span>. Every term picks up a factor of <span class="mth"><i>e</i><sup><i>rt</i></sup></span>, which never vanishes, so it divides out and leaves</p>
<div class="eqb"><span class="mth"><i>ar</i>² <span class="op">+</span> <i>br</i> <span class="op">+</span> <i>c</i> <span class="op">=</span> 0</span></div>
<p>A differential equation has become a quadratic, and its discriminant <span class="mth"><i>b</i>² − 4<i>ac</i></span> decides everything that follows. That is the entire method for constant coefficients.</p>

<h3 id="d3">The three cases</h3>
<ul>
  <li><strong>Two real roots</strong> (<span class="mth"><i>b</i>² &gt; 4<i>ac</i></span>): <span class="mth"><i>y</i> = <i>C</i>₁<i>e</i><sup><i>r</i>₁<i>t</i></sup> + <i>C</i>₂<i>e</i><sup><i>r</i>₂<i>t</i></sup></span>. Two decaying exponentials and no oscillation at all — <strong>overdamped</strong>. The system creeps back to rest without overshooting.</li>
  <li><strong>A repeated root</strong> (<span class="mth"><i>b</i>² = 4<i>ac</i></span>): <span class="mth"><i>y</i> = (<i>C</i>₁ + <i>C</i>₂<i>t</i>)<i>e</i><sup><i>rt</i></sup></span>. The exponential supplies only one solution and a second copy would be linearly dependent, so the stray <span class="mth"><i>t</i></span> is <em>forced</em> on us by the need to meet two initial conditions. <strong>Critically damped</strong>.</li>
  <li><strong>A complex pair</strong> (<span class="mth"><i>b</i>² &lt; 4<i>ac</i></span>): <span class="mth"><i>r</i> = α ± <i>i</i>ω</span>, and Euler's formula turns <span class="mth"><i>e</i><sup>(α±<i>i</i>ω)<i>t</i></sup></span> into <span class="mth"><i>e</i><sup>α<i>t</i></sup>(cos ω<i>t</i> ± <i>i</i> sin ω<i>t</i>)</span>. Taking real and imaginary parts gives two real solutions. The real part α is the decay rate; the imaginary part ω is the frequency it rings at. <strong>Underdamped</strong>.</li>
</ul>
<p>Slide the damping through <span class="mth"><i>b</i> = 2√(<i>ac</i>)</span> in the lab and watch the two roots collide on the real axis and split apart. That collision is the boundary between ringing and not ringing, and it is where a car suspension, a galvanometer needle and a door closer are tuned to sit. Critical damping is the fastest return to equilibrium without overshoot, and it is a knife edge.</p>
<p>The physical shorthand is worth learning: <span class="mth">ω₀ = √(<i>c</i>/<i>a</i>)</span> is the natural frequency, <span class="mth">ζ = <i>b</i>/(2√(<i>ac</i>))</span> the damping ratio, <span class="mth"><i>Q</i> = √(<i>ac</i>)/<i>b</i></span> the quality factor, and the ringing frequency is <span class="mth">ω<sub><i>d</i></sub> = ω₀√(1−ζ²)</span>.</p>

<h3 id="d4">Independence, and the Wronskian</h3>
<p>Two initial conditions impose a 2×2 linear system on <span class="mth"><i>C</i>₁, <i>C</i>₂</span>, which is solvable exactly when the determinant</p>
<div class="eqb"><span class="mth"><i>W</i>(<i>t</i>) <span class="op">=</span> <i>y</i>₁<i>y</i>₂′ <span class="op">−</span> <i>y</i>₂<i>y</i>₁′</span></div>
<p>is nonzero. That is the precise meaning of "the two solutions are independent". <strong>Abel's formula</strong> says the Wronskian obeys its own first-order equation whatever the solutions are:</p>
<div class="eqb"><span class="mth"><i>W</i>(<i>t</i>) <span class="op">=</span> <i>W</i>(0) <i>e</i><sup>−<i>bt</i>/<i>a</i></sup></span></div>
${stThm("Abel's formula — the Wronskian is never zero, or always", {
  hyp:'<span class="mth"><i>y</i>₁, <i>y</i>₂</span> both solve <span class="mth"><i>ay</i>″ + <i>by</i>′ + <i>cy</i> = 0</span> with <span class="mth"><i>a</i> ≠ 0</span> constant',
  then:'',
  eq:'<i>W</i>(<i>t</i>) <span class="op">=</span> <i>W</i>(0) <i>e</i><sup><span class="op">−</span><i>bt</i>/<i>a</i></sup>',
  proof:`<p>Differentiate <span class="mth"><i>W</i> = <i>y</i>₁<i>y</i>₂′ − <i>y</i>₂<i>y</i>₁′</span>. The product rule gives four terms, and the two involving <span class="mth"><i>y</i>₁′<i>y</i>₂′</span> cancel:</p>
${stEq('<i>W</i>′ <span class="op">=</span> <i>y</i>₁<i>y</i>₂″ <span class="op">−</span> <i>y</i>₂<i>y</i>₁″')}
<p>That cancellation is the whole trick — it leaves only second derivatives, which the differential equation can replace. From <span class="mth"><i>ay</i>″ = −<i>by</i>′ − <i>cy</i></span>, applied to each solution:</p>
${stEq('<i>W</i>′ <span class="op">=</span> <i>y</i>₁ <span class="frac"><span class="nm"><span class="op">−</span><i>by</i>₂′ <span class="op">−</span> <i>cy</i>₂</span><span class="den"><i>a</i></span></span> <span class="op">−</span> <i>y</i>₂ <span class="frac"><span class="nm"><span class="op">−</span><i>by</i>₁′ <span class="op">−</span> <i>cy</i>₁</span><span class="den"><i>a</i></span></span>')}
<p>The <span class="mth"><i>c</i></span> terms cancel too, leaving <span class="mth"><i>W</i>′ = −(<i>b</i>/<i>a</i>)(<i>y</i>₁<i>y</i>₂′ − <i>y</i>₂<i>y</i>₁′) = −(<i>b</i>/<i>a</i>)<i>W</i></span>.</p>
<p>So the Wronskian satisfies a first-order linear equation of its own, whose solution is the stated exponential.</p>
<p>The consequence is the useful part: an exponential is <strong>never zero</strong>. So <span class="mth"><i>W</i>(<i>t</i>)</span> is either nonzero for every <span class="mth"><i>t</i></span> (when <span class="mth"><i>W</i>(0) ≠ 0</span>) or identically zero. There is no middle case — which is why testing independence at a single convenient point settles it everywhere.</p>`,
  note:'Note that the theorem knows nothing about which solutions were chosen: W obeys the same equation whatever y₁ and y₂ are. The lab computes both sides independently and prints the difference.',
  see:'ode:0.0', seeLabel:'The characteristic equation, and its three cases' })}

<p>so it is either never zero or identically zero — there is no middle case, which is why testing independence at a single point is enough. The lab computes both sides and prints the difference.</p>

<h3 id="d5">Nonhomogeneous equations</h3>
<p>The general solution is</p>
<div class="eqb"><span class="mth"><i>y</i> <span class="op">=</span> <i>y</i><sub><i>c</i></sub> <span class="op">+</span> <i>y</i><sub><i>p</i></sub></span></div>
<p>— <em>any</em> one particular solution, plus the whole family of homogeneous solutions. The reason is linearity: the difference of two solutions of the forced equation solves the unforced one. The two halves can be found by completely different methods and simply added.</p>
<p>Because the homogeneous part decays whenever there is damping, <strong><span class="mth"><i>y</i><sub><i>c</i></sub></span> is the transient and <span class="mth"><i>y</i><sub><i>p</i></sub></span> is the steady state</strong>. The initial conditions live entirely in the transient; they have no effect at all on where the system ends up. That is what makes steady-state analysis possible, and it is why a circuit's frequency response is a property of the circuit rather than of how it was switched on.</p>
<h4>Undetermined coefficients</h4>
<p>For forcings whose derivatives stay in a finite family — polynomials, exponentials, sines and cosines, and products of those — guess a function of the same shape with unknown coefficients and substitute. A polynomial forcing needs a polynomial of the same degree with <em>every</em> lower power included, because differentiating generates them. A cosine needs <em>both</em> a cosine and a sine, because differentiating twice mixes them, and the phase lag between forcing and response is exactly the statement that the sine coefficient is nonzero.</p>
<p class="note">The rule that catches everyone: if the guess is already a solution of the homogeneous equation it contributes nothing, and must be multiplied by <span class="mth"><i>t</i></span> (or <span class="mth"><i>t</i>²</span> for a repeated root). That is <strong>resonance</strong> in algebraic form — and the reason an undamped system driven at its natural frequency grows without bound.</p>

<h3 id="d6">Variation of parameters</h3>
<p>The general method, needing no table of guesses. Replace the constants in <span class="mth"><i>y</i> = <i>C</i>₁<i>y</i>₁ + <i>C</i>₂<i>y</i>₂</span> by functions and impose one convenient extra condition; the algebra collapses to</p>
<div class="eqb"><span class="mth"><i>y</i><sub><i>p</i></sub> <span class="op">=</span> <span class="op">−</span><i>y</i>₁ ∫ <span class="frac"><span class="nm"><i>y</i>₂ <i>g</i></span><span class="den"><i>a W</i></span></span> <i>dt</i> <span class="op">+</span> <i>y</i>₂ ∫ <span class="frac"><span class="nm"><i>y</i>₁ <i>g</i></span><span class="den"><i>a W</i></span></span> <i>dt</i></span></div>
<p>It works for <em>any</em> continuous <span class="mth"><i>g</i></span>, at the cost of two integrals that may not be elementary. With the lower limit at zero it produces exactly the solution with <span class="mth"><i>y</i>(0) = <i>y</i>′(0) = 0</span>, which is how the lab can compare it directly against a numerical run from rest.</p>

<h3 id="d7">The driven oscillator and resonance</h3>
<p>For <span class="mth"><i>m x</i>″ + γ<i>x</i>′ + <i>kx</i> = <i>F</i>₀cos ω<i>t</i></span> the steady state is <span class="mth"><i>x</i> = (<i>F</i>₀/|<i>Z</i>|)cos(ω<i>t</i> − δ)</span> with</p>
<div class="eqb"><span class="mth">|<i>Z</i>| <span class="op">=</span> √<span class="rad">(<i>k</i> <span class="op">−</span> <i>m</i>ω²)² <span class="op">+</span> (γω)²</span> , &nbsp;&nbsp; tan δ <span class="op">=</span> <span class="frac"><span class="nm">γω</span><span class="den"><i>k</i> <span class="op">−</span> <i>m</i>ω²</span></span></span></div>
<p>Two things fight in that expression. The stiffness term <span class="mth"><i>k</i> − <i>m</i>ω²</span> passes through zero at <span class="mth">ω₀</span>, and only the damping is left to stop the amplitude running away — which is why the peak height goes as <span class="mth">1/γ</span>. The peak is <em>not</em> at <span class="mth">ω₀</span> unless <span class="mth">γ = 0</span>; it sits at <span class="mth">√(ω₀² − γ²/2<i>m</i>²)</span>, and for heavy enough damping there is no peak at all.</p>
<p>The phase runs from 0 at low frequency, through <strong>exactly 90° at ω₀</strong>, to 180° above it: drive a mass fast enough and it moves in the opposite direction to the force pushing it. The Tacoma Narrows bridge, a wine glass shattered by a singer, an MRI scanner and every radio tuner ever built are this one curve.</p>
<p><strong>Beats</strong> are what happens when a lightly damped system is driven <em>near</em> resonance: the response is the sum of two nearby frequencies, and the trigonometric identity turns that into a fast oscillation inside a slow envelope <span class="mth">|sin(Δω<i>t</i>/2)|</span>. Nothing in the system is beating; the beat is interference between two frequencies that are both present.</p>
<p class="note"><strong>One equation, two vocabularies.</strong> <span class="mth"><i>L q</i>″ + <i>R q</i>′ + <i>q</i>/<i>C</i> = <i>E</i>₀cos ω<i>t</i></span> is the same equation: inductance is inertia, resistance is friction, and the reciprocal of capacitance is stiffness. The circuits wing solves it with a nodal solver and draws its Bode plot; this wing solves it as a differential equation. Neither is more fundamental — they are one object seen twice.</p>

<h3 id="d8">Series solutions</h3>
<p>When the coefficients are not constant, substitute <span class="mth"><i>y</i> = Σ<i>a</i><sub><i>n</i></sub><i>x</i><sup><i>n</i></sup></span>, differentiate term by term, and collect powers of <span class="mth"><i>x</i></span>. Every coefficient of <span class="mth"><i>x</i><sup><i>n</i></sup></span> must vanish separately, which gives a <strong>recurrence</strong> linking <span class="mth"><i>a</i><sub><i>n</i>+2</sub></span> back to earlier coefficients. Two of them — <span class="mth"><i>a</i>₀</span> and <span class="mth"><i>a</i>₁</span> — are never determined, and those are exactly the two arbitrary constants a second-order equation must have.</p>
<p>Because the recurrences here link <span class="mth"><i>a</i><sub><i>n</i></sub></span> to <span class="mth"><i>a</i><sub><i>n</i>+2</sub></span> or <span class="mth"><i>a</i><sub><i>n</i>+3</sub></span>, whole families of coefficients are identically zero — which is why the two independent solutions separate into even and odd (or into three families, for Airy's equation).</p>
<p><strong>Radius of convergence.</strong> A power-series solution converges at least as far as the nearest point where the equation itself misbehaves — where the coefficient of <span class="mth"><i>y</i>″</span> vanishes. Legendre's equation has singular points at <span class="mth"><i>x</i> = ±1</span>, so its radius is 1 and no amount of cleverness extends it. That is Fuchs' theorem, and it lets you predict the radius <em>before</em> computing a single coefficient. The lab measures the radius from the coefficients it actually generated, by the root test.</p>
<p class="note"><strong>Termination is quantisation.</strong> For Hermite's equation with integer λ the recurrence hits zero and the series <em>stops</em> — a polynomial. For non-integer λ it never terminates and the solution blows up like <span class="mth"><i>e</i><sup><i>x</i>²</sup></span>, destroying normalisability. The harmonic-oscillator energy levels in the quantum wing are exactly the λ values that make the series stop: an energy spectrum arriving as a condition for a power series to converge, rather than as a postulate. Legendre's equation does the same thing for the integer angular-momentum numbers behind every hydrogen orbital in the atom wing.</p>
`;
