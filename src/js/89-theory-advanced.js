/* ============================================================================
   7e · THE LONG-FORM MATHEMATICS — TRANSFORMS, DYNAMICS, COMPLEX, FORMS
   ============================================================================ */
const THEORY_LAPLACE = `
<div class="toc"><a href="#p0">The idea</a><a href="#p1">The rules</a><a href="#p2">Delta functions</a>
<a href="#p3">Convolution</a><a href="#p4">Poles and stability</a><a href="#p5">Limits</a></div>

<h3 id="p0">The idea</h3>
<p>The Laplace transform sends a function of time to a function of a complex variable:</p>
<div class="eqb"><span class="mth"><i>F</i>(<i>s</i>) = ∫<sub>0</sub><sup>∞</sup> <i>f</i>(<i>t</i>) <i>e</i><sup>−st</sup> d<i>t</i></span></div>
<p>It exists only where the integral converges — where <span class="mth"><i>s</i></span> outruns the growth of <span class="mth"><i>f</i></span> — and that <strong>region of convergence</strong> is part of the answer, not a footnote. The transform of <span class="mth"><i>e</i><sup>at</sup></span> is <span class="mth">1/(<i>s</i>−<i>a</i>)</span> <em>for s &gt; a</em>, and the stage lets you slide <span class="mth"><i>s</i></span> down until the quadrature visibly diverges.</p>

<h3 id="p1">The rules that make it worth doing</h3>
<div class="eqb"><span class="mth">ℒ{<i>f</i>′} = <i>sF</i>(<i>s</i>) − <i>f</i>(0) , &nbsp;&nbsp; ℒ{<i>f</i>″} = <i>s</i>²<i>F</i>(<i>s</i>) − <i>sf</i>(0) − <i>f</i>′(0)</span></div>
<p>Differentiation becomes multiplication. A linear differential equation with constant coefficients therefore becomes an <em>algebraic</em> equation for <span class="mth"><i>F</i>(<i>s</i>)</span>, which you solve by ordinary algebra and then transform back. The initial conditions are carried along automatically instead of being fitted afterwards, which is exactly why the method suits problems that start from rest and are suddenly disturbed.</p>
<p>Two more rules do most of the remaining work. Multiplying by <span class="mth"><i>e</i><sup>at</sup></span> shifts <span class="mth"><i>s</i></span>; delaying by <span class="mth"><i>c</i></span> multiplies by <span class="mth"><i>e</i><sup>−cs</sup></span>. A source that switches on at <span class="mth"><i>t</i> = 2</span> is written down directly rather than by patching solutions together at the join.</p>

<h3 id="p2">Delta functions</h3>
<p>The unit impulse <span class="mth">δ(<i>t</i>)</span> is not a function. It is defined by what it does inside an integral — <span class="mth">∫ δ(<i>t</i>−<i>c</i>)<i>g</i>(<i>t</i>) d<i>t</i> = <i>g</i>(<i>c</i>)</span> — and it is properly a <em>distribution</em>. The laboratory approximates it by a narrow bump of unit area, which preserves everything the delta is for: unit integral, and the sifting property.</p>
<p class="note">One honest artefact: an impulse placed exactly at <span class="mth"><i>t</i> = 0</span> sits half outside the integration range, so convolving with it returns half of what you might expect. That is not a bug in the approximation — it is a real feature of the one-sided transform, and the reason careful treatments write <span class="mth">0<sup>−</sup></span> as the lower limit.</p>

<h3 id="p3">Convolution, and why it is the right operation</h3>
<div class="eqb"><span class="mth">(<i>x</i> ∗ <i>h</i>)(<i>t</i>) = ∫<sub>0</sub><sup>t</sup> <i>x</i>(τ) <i>h</i>(<i>t</i>−τ) dτ &nbsp;&nbsp;⟷&nbsp;&nbsp; <i>X</i>(<i>s</i>)·<i>H</i>(<i>s</i>)</span></div>
<p>A linear, time-invariant system is completely described by its <strong>impulse response</strong> <span class="mth"><i>h</i>(<i>t</i>)</span>. Chop any input into a row of impulses, let each one produce its own decaying response, and add up the ringing — the sum is that integral. Linearity is the only property used, and it is the only one needed.</p>
${stThm('Convolution theorem for the Laplace transform', {
  hyp:'<span class="mth"><i>x</i></span> and <span class="mth"><i>h</i></span> vanish for <span class="mth"><i>t</i> &lt; 0</span> and have transforms <span class="mth"><i>X</i>(<i>s</i>), <i>H</i>(<i>s</i>)</span> converging in a common half-plane',
  then:'',
  eq:'ℒ{ <i>x</i> ∗ <i>h</i> } <span class="op">=</span> <i>X</i>(<i>s</i>) <i>H</i>(<i>s</i>)',
  proof:`<p>Write out the transform of the convolution as a double integral:</p>
${stEq('ℒ{<i>x</i> ∗ <i>h</i>} <span class="op">=</span> ∫₀<sup>∞</sup> <i>e</i><sup><span class="op">−</span><i>st</i></sup> [ ∫₀<sup><i>t</i></sup> <i>x</i>(τ)<i>h</i>(<i>t</i><span class="op">−</span>τ) <i>d</i>τ ] <i>dt</i>')}
<p>The inner limit depends on <span class="mth"><i>t</i></span>, so the region is the wedge <span class="mth">0 ≤ τ ≤ <i>t</i> &lt; ∞</span>. Fubini's theorem — legitimate because absolute convergence holds in the common half-plane — lets the order be exchanged, and the wedge described the other way is <span class="mth">τ ≤ <i>t</i> &lt; ∞</span> for each fixed <span class="mth">τ ≥ 0</span>:</p>
${stEq('<span class="op">=</span> ∫₀<sup>∞</sup> <i>x</i>(τ) [ ∫<sub>τ</sub><sup>∞</sup> <i>e</i><sup><span class="op">−</span><i>st</i></sup> <i>h</i>(<i>t</i><span class="op">−</span>τ) <i>dt</i> ] <i>d</i>τ')}
<p>Now substitute <span class="mth"><i>u</i> = <i>t</i> − τ</span> in the inner integral, so <span class="mth"><i>dt</i> = <i>du</i></span> and the limits become <span class="mth">0</span> to <span class="mth">∞</span>. The key step is that the exponential <strong>factorises</strong>:</p>
${stEq('<i>e</i><sup><span class="op">−</span><i>st</i></sup> <span class="op">=</span> <i>e</i><sup><span class="op">−</span><i>s</i>(<i>u</i>+τ)</sup> <span class="op">=</span> <i>e</i><sup><span class="op">−</span><i>s</i>τ</sup> <i>e</i><sup><span class="op">−</span><i>su</i></sup>')}
<p>which is the entire reason the theorem is true and the reason the kernel had to be an exponential. The <span class="mth">τ</span> factor pulls out of the inner integral and the double integral separates:</p>
${stEq('<span class="op">=</span> [ ∫₀<sup>∞</sup> <i>x</i>(τ) <i>e</i><sup><span class="op">−</span><i>s</i>τ</sup> <i>d</i>τ ] [ ∫₀<sup>∞</sup> <i>h</i>(<i>u</i>) <i>e</i><sup><span class="op">−</span><i>su</i></sup> <i>du</i> ] <span class="op">=</span> <i>X</i>(<i>s</i>) <i>H</i>(<i>s</i>)')}
<p>So a sliding overlap in time becomes an ordinary product in <span class="mth"><i>s</i></span>. Every filter, control loop, echo and optical blur is that statement.</p>`,
  note:'The Fourier wing proves the same theorem for a different kernel, and for the same reason: e^(−iw(t)) factorises across a sum in exactly this way. The property being exploited is that the exponential turns addition into multiplication.',
  see:'laplace:1.0', seeLabel:'The impulse response says everything' })}

<p>The transform turns this sliding overlap into an ordinary product. Every filter, control loop, echo and optical blur is that statement, and it is the same convolution theorem the Fourier wing proves for a different transform.</p>

<h3 id="p4">Poles, stability, and the −90° marker</h3>
<p>For <span class="mth"><i>ay</i>″ + <i>by</i>′ + <i>cy</i> = <i>x</i></span> the transfer function is <span class="mth"><i>H</i>(<i>s</i>) = 1/(<i>as</i>²+<i>bs</i>+<i>c</i>)</span>, and its poles are the roots of the characteristic polynomial — the same roots the ODE wing finds. Their real parts are decay rates and their imaginary parts are ringing frequencies, so <strong>the system is stable exactly when every pole lies in the left half-plane</strong>. The rightmost pole is the slowest mode and decides the settling time.</p>
<p>Evaluating <span class="mth"><i>H</i></span> on the imaginary axis gives the frequency response. The gain peak is flat and moves with damping — it is <em>not</em> at <span class="mth">ω<sub>0</sub></span>, as the differential-equations wing shows — but the phase crosses <span class="mth">−90°</span> precisely at <span class="mth">ω<sub>0</sub></span> whatever the damping. That is how resonances are located in practice.</p>

<h3 id="p5">What is honestly shown</h3>
<p>Every transform here is a numerical quadrature over a finite range, so it is accurate where the integrand decays and unreliable where it does not. Inverse transforms are not computed by contour integration; the impulse responses are the known closed forms for a second-order system, and the outputs are genuine convolutions against them. Where a table entry is quoted, the stage computes the integral independently and prints the difference.</p>
`;

const THEORY_SYSTEMS = `
<div class="toc"><a href="#y0">The substitution</a><a href="#y1">Three cases</a><a href="#y2">The classification</a>
<a href="#y3">Scalar equations are systems</a><a href="#y4">Where it is used</a></div>

<h3 id="y0">The substitution that solves everything</h3>
<p>For <span class="mth"><b>x</b>′ = <i>A</i><b>x</b></span>, try <span class="mth"><b>x</b> = <i>e</i><sup>λt</sup><b>v</b></span>. Then <span class="mth"><b>x</b>′ = λ<i>e</i><sup>λt</sup><b>v</b></span> and <span class="mth"><i>A</i><b>x</b> = <i>e</i><sup>λt</sup><i>A</i><b>v</b></span>, so the guess works precisely when</p>
<div class="eqb"><span class="mth"><i>A</i><b>v</b> = λ<b>v</b></span></div>
<p>That is the entire connection between differential equations and linear algebra. A system of ODEs <em>is</em> an eigenvalue problem, and the eigenvalues determine the behaviour completely.</p>

${stThm('Eigenvectors give straight-line solutions', {
  hyp:'<span class="mth"><b>x</b>′ = <i>A</i><b>x</b></span> with <span class="mth"><i>A</i></span> constant, and <span class="mth"><i>A</i><b>v</b> = λ<b>v</b></span> with <span class="mth"><b>v</b> ≠ <b>0</b></span>',
  then:'<span class="mth"><b>x</b>(<i>t</i>) = <i>e</i><sup>λ<i>t</i></sup><b>v</b></span> is a solution, and it stays on the line through <span class="mth"><b>v</b></span> for all time',
  proof:`<p>Substitute the candidate. Since <span class="mth"><b>v</b></span> is a constant vector, differentiating touches only the scalar factor:</p>
${stEq('<b>x</b>′ <span class="op">=</span> λ<i>e</i><sup>λ<i>t</i></sup><b>v</b>')}
<p>and applying <span class="mth"><i>A</i></span> touches only the vector:</p>
${stEq('<i>A</i><b>x</b> <span class="op">=</span> <i>e</i><sup>λ<i>t</i></sup>(<i>A</i><b>v</b>) <span class="op">=</span> <i>e</i><sup>λ<i>t</i></sup>(λ<b>v</b>) <span class="op">=</span> λ<i>e</i><sup>λ<i>t</i></sup><b>v</b>')}
<p>The two agree, so the candidate solves the system. The eigenvalue equation is exactly the condition that made them agree — which is the sense in which the substitution <em>discovers</em> eigenvalues rather than assuming them.</p>
<p>The trajectory is <span class="mth"><b>v</b></span> scaled by a positive number, so it never leaves the line through the origin along <span class="mth"><b>v</b></span>. It runs outward if <span class="mth">λ &gt; 0</span> and inward if <span class="mth">λ &lt; 0</span>, and never reaches the origin in finite time.</p>
<p>When there are <span class="mth"><i>n</i></span> independent eigenvectors these solutions span everything, because the system is linear and any initial condition can be expanded in that basis. When there are not — the defective case — an eigenvector is missing and something must replace it; what replaces it carries an extra factor of <span class="mth"><i>t</i></span>, which is the same stray <span class="mth"><i>t</i></span> as in the repeated-root case of a scalar equation.</p>`,
  note:'A complex pair gives no real straight line at all: no direction is preserved, so every trajectory rotates. That is why a centre and a spiral look nothing like a node — the geometry is dictated by whether the eigenvalues are real.',
  see:'systems:0.1', seeLabel:'A saddle, and its two straight-line solutions' })}

<h3 id="y1">The three cases, and why they are the only three</h3>
<ul>
  <li><strong>Distinct real eigenvalues</strong> — two independent straight-line solutions, and everything else is a combination. Same sign gives a <em>node</em>; opposite signs a <em>saddle</em>.</li>
  <li><strong>A complex pair</strong> <span class="mth"><i>a</i> ± <i>bi</i></span> — no direction survives, so every trajectory rotates. The real part sets growth or decay, the imaginary part the angular rate: a <em>spiral</em>, or a <em>centre</em> when <span class="mth"><i>a</i> = 0</span>.</li>
  <li><strong>A repeated eigenvalue with one eigenvector</strong> — defective. The solution needs an extra factor of <span class="mth"><i>t</i></span>: <span class="mth"><i>e</i><sup>λt</sup>(<i>I</i> + <i>t</i>(<i>A</i>−λ<i>I</i>))<b>x</b><sub>0</sub></span>.</li>
</ul>
<p>The stray <span class="mth"><i>t</i></span> in the third case is the same stray <span class="mth"><i>t</i></span> as in the repeated-root case of a scalar second-order equation, and now the reason is visible: a missing independent direction has to be replaced by something, and what replaces it grows one power faster.</p>

<h3 id="y2">The trace–determinant plane</h3>
<p>Since <span class="mth">λ<sub>1</sub>+λ<sub>2</sub> = tr</span> and <span class="mth">λ<sub>1</sub>λ<sub>2</sub> = det</span>, the whole classification fits on one chart. Below the horizontal axis lies every saddle; above the parabola <span class="mth">det = tr²/4</span> lie the spirals; between them the nodes; and the sign of the trace decides stability throughout. Every possible qualitative behaviour of a planar linear system is one of five regions — a remarkably small answer to a general question.</p>

<h3 id="y3">A scalar equation is already a system</h3>
<p>Setting <span class="mth"><i>v</i> = <i>y</i>′</span> turns <span class="mth"><i>y</i>″ + <i>by</i>′ + <i>cy</i> = 0</span> into <span class="mth"><b>x</b>′ = <i>A</i><b>x</b></span> with <span class="mth"><i>A</i> = [[0,1],[−<i>c</i>,−<i>b</i>]]</span>, whose characteristic polynomial is the one you would have written anyway. Overdamped, critically damped and underdamped are node, defective node and spiral. The two subjects were never separate.</p>

<h3 id="y4">Where this shows up</h3>
<p>Coupled oscillators, chemical kinetics, compartment models in pharmacology, and every linearisation of a nonlinear system — which is what the phase-plane wing does at each critical point. The stability criterion "all eigenvalues in the left half-plane" is the same one the Laplace wing states about poles, because they are the same numbers.</p>
`;

const THEORY_PHASE = `
<div class="toc"><a href="#q0">Giving up on formulas</a><a href="#q1">Critical points</a><a href="#q2">Linearisation and its limits</a>
<a href="#q3">Limit cycles</a><a href="#q4">Bifurcation</a><a href="#q5">Honest limits</a></div>

<h3 id="q0">Giving up on formulas, and gaining everything else</h3>
<p>Almost no nonlinear differential equation has a closed-form solution. The qualitative theory's insight is that you rarely wanted one: what you want to know is whether the system settles, oscillates or runs away, and which initial conditions lead where. All of that is visible in the <strong>phase plane</strong> — the plane of states, with time eliminated — without solving anything.</p>

<h3 id="q1">Critical points</h3>
<p>Equilibria are where <span class="mth"><i>F</i> = <i>G</i> = 0</span>. The laboratory finds them with Newton's method from a grid of starting guesses, merges duplicates, and prints the residual so you can confirm both derivatives really vanish rather than trusting the search. Near each one, expand:</p>
<div class="eqb"><span class="mth"><b>x</b>′ ≈ <i>J</i>(<b>x</b> − <b>x</b>*) , &nbsp;&nbsp; <i>J</i> = Jacobian at the point</span></div>
<p>and classify by the eigenvalues of <span class="mth"><i>J</i></span> exactly as in the linear wing. The <strong>nullclines</strong> — the curves <span class="mth"><i>F</i> = 0</span> and <span class="mth"><i>G</i> = 0</span> — organise the picture: motion is purely vertical on one and purely horizontal on the other, and critical points are where two of different kinds cross.</p>

<h3 id="q2">What linearisation does and does not license</h3>
${stThm('Hartman–Grobman', {
  hyp:'<span class="mth"><b>x</b>* </span> is an equilibrium of a <span class="mth"><i>C</i>¹</span> system, and <strong>no</strong> eigenvalue of the Jacobian <span class="mth"><i>J</i>(<b>x</b>*)</span> has zero real part (the point is <em>hyperbolic</em>)',
  then:'near <span class="mth"><b>x</b>*</span> the flow is topologically conjugate to the flow of its linearisation <span class="mth"><b>y</b>′ = <i>J</i><b>y</b></span> — there is a continuous, continuously invertible change of coordinates carrying one to the other',
  because:`A full proof constructs the conjugacy by a contraction-mapping argument on a space of continuous functions, splitting the flow along the stable and unstable subspaces and showing the correction converges. That machinery — Banach's fixed-point theorem on function spaces — belongs to a course in dynamical systems rather than to this wing, and the honest thing is to say so rather than to sketch something that would not survive scrutiny.
    <br><br>What can be said here is why the hypothesis is exactly the right one, and that is worth more than a hand-waved proof: the theorem must exclude eigenvalues on the imaginary axis, because at such a point the linear terms decide nothing and the neglected higher-order ones take over. The lab's Lotka–Volterra centre is the standing demonstration.`,
  note:'The conjugacy is only topological — it preserves the qualitative picture (which way trajectories go, what is stable) but bends and stretches, so it does not preserve angles, speeds, or the exact shape of a spiral.',
  see:'phase:0.0', seeLabel:'The damped pendulum, globally' })}

${stThm('Why a linear system can never have a limit cycle', {
  hyp:'<span class="mth"><b>x</b>′ = <i>A</i><b>x</b></span> is linear with constant coefficients',
  then:'it has no isolated closed orbit; closed orbits, if any, come in a continuous family',
  proof:`<p>Suppose <span class="mth"><b>x</b>(<i>t</i>)</span> is a closed orbit of period <span class="mth"><i>T</i></span>, so <span class="mth"><b>x</b>(<i>T</i>) = <b>x</b>(0)</span>.</p>
<p>Linearity means that for any scalar <span class="mth"><i>c</i></span>, the curve <span class="mth"><i>c</i><b>x</b>(<i>t</i>)</span> is also a solution: differentiating gives <span class="mth"><i>c</i><b>x</b>′ = <i>cA</i><b>x</b> = <i>A</i>(<i>c</i><b>x</b>)</span>. And it is closed with the same period, since <span class="mth"><i>c</i><b>x</b>(<i>T</i>) = <i>c</i><b>x</b>(0)</span>.</p>
<p>So a single closed orbit immediately generates a whole one-parameter family of them, one for every <span class="mth"><i>c</i> ≠ 0</span>, nested around the origin and filling a region. No member of that family is isolated — every neighbourhood of one contains others.</p>
<p>A limit cycle is by definition <em>isolated</em>: nearby trajectories spiral onto it rather than being closed themselves. That is incompatible with the family above, so no linear system has one.</p>
<p>The scaling argument is exactly what fails once the system is nonlinear, because <span class="mth"><i>c</i><b>x</b></span> is then no longer a solution. That is why the amplitude of Van der Pol's cycle is set by the equation itself rather than by the initial condition — the system has a preferred size, which a linear one cannot.</p>`,
  note:'This is why limit cycles are a genuinely nonlinear phenomenon, and why heartbeats, laser output and clock oscillators cannot be modelled linearly: a linear model would let their amplitude be anything at all.',
  see:'phase:0.1', seeLabel:'A limit cycle: Van der Pol' })}

<p><strong>Hartman–Grobman</strong>: if no eigenvalue lies on the imaginary axis, the nonlinear picture near the point is a continuous deformation of the linear one. The point is <em>hyperbolic</em> and the linearisation can be trusted.</p>
<p class="note">The excluded case matters. A <strong>centre</strong> predicted by the linearisation may really be a slow spiral, because the neglected higher-order terms decide which way. That is why the pendulum's undamped centres survive — the system is conservative, so it has an exact energy that closes the orbits — while Lotka–Volterra's centre is structurally fragile and any realistic extra term destroys it.</p>
<p>A saddle's <strong>stable manifold</strong> is a <em>separatrix</em>: the exact boundary between qualitatively different fates. In the damped pendulum it separates swinging from going over the top; in the competing-species model it decides which species survives. Drawing trajectories backwards in time is how you find it, which is why the stage integrates both ways.</p>

<h3 id="q3">Limit cycles</h3>
<p>A <strong>limit cycle</strong> is an isolated closed orbit that attracts (or repels) its neighbours. No linear system has one: a linear centre has a whole continuum of closed orbits with no preference among them. Van der Pol's equation has an unstable spiral at the origin and yet nothing escapes — everything winds onto one particular loop, whose amplitude is set by the equation rather than by the initial condition. Heartbeats, laser output and the triode oscillator Van der Pol was studying all behave this way.</p>
<p>In two dimensions the <strong>Poincaré–Bendixson theorem</strong> is a strong constraint: a trajectory trapped in a bounded region with no critical point must approach a closed orbit. Planar systems therefore cannot be chaotic. Three dimensions removes the constraint, and that is exactly where the Lorenz system lives.</p>

<h3 id="q4">Bifurcation</h3>
<p>As a parameter varies the eigenvalues move, and when they cross the imaginary axis the qualitative picture changes. In a <strong>Hopf bifurcation</strong> a stable spiral loses stability and a small limit cycle is born around it — the birth of an oscillation where there was none. It is how a smooth flow starts shedding vortices and how a laser starts to lase.</p>

<h3 id="q5">What is honestly shown</h3>
<p>The Jacobian is computed by central differences, so classifications very near a degenerate case are as uncertain as that estimate. Critical points outside the drawn window are not found. Trajectories are RK4 with a fixed step and are stopped if they run away, so a solution that blows up in finite time is drawn only up to where the integrator was still trustworthy — not because the mathematics stopped, but because the arithmetic did.</p>
`;

const THEORY_COMPLEX = `
<div class="toc"><a href="#c0">Why complex</a><a href="#c1">Analyticity</a><a href="#c2">Contour integrals</a>
<a href="#c3">Residues</a><a href="#c4">Harmonic connections</a></div>

<h3 id="c0">Why bother going complex</h3>
<p>Two reasons, and they are independent. First, oscillation: <span class="mth"><i>e</i><sup>iωt</sup></span> is what a sinusoid <em>is</em>, and every phasor in the circuit wing, every wavefunction in the quantum wing and every mode in the Fourier wing is a complex exponential. Euler's formula is not a definition to swallow but a consequence — the only extension of the exponential preserving <span class="mth"><i>e</i><sup>a+b</sup> = <i>e</i><sup>a</sup><i>e</i><sup>b</sup></span> makes the imaginary axis into rotation.</p>
<p>Second, and more surprising: integration gets <em>easier</em>. Real integrals that resist every substitution fall out of a contour integral and a count of poles.</p>

<h3 id="c1">Analyticity is a severe demand</h3>
<p>A function is analytic at <span class="mth"><i>z</i></span> when the limit defining <span class="mth"><i>f</i>′(<i>z</i>)</span> exists <em>and is the same from every direction of approach</em>. Writing <span class="mth"><i>f</i> = <i>u</i> + <i>iv</i></span>, that forces the <strong>Cauchy–Riemann equations</strong>:</p>
<div class="eqb"><span class="mth"><i>u<sub>x</sub></i> = <i>v<sub>y</sub></i> , &nbsp;&nbsp; <i>u<sub>y</sub></i> = −<i>v<sub>x</sub></i></span></div>
<p>The stage measures both residuals at a draggable probe. For <span class="mth">z̄</span> they are large and stay large — conjugation is perfectly smooth as a map of two real variables and has no complex derivative anywhere. Real differentiability in two variables is simply a different, weaker condition.</p>
${stThm('Cauchy–Riemann equations are necessary for analyticity', {
  hyp:'<span class="mth"><i>f</i> = <i>u</i> + <i>iv</i></span> is complex-differentiable at <span class="mth"><i>z</i>₀ = <i>x</i>₀ + <i>iy</i>₀</span>',
  then:'',
  eq:'<i>u<sub>x</sub></i> <span class="op">=</span> <i>v<sub>y</sub></i> , &nbsp;&nbsp; <i>u<sub>y</sub></i> <span class="op">=</span> <span class="op">−</span><i>v<sub>x</sub></i> &nbsp;&nbsp; at <i>z</i>₀',
  proof:`<p>Complex differentiability says the limit</p>
${stEq('<i>f</i>′(<i>z</i>₀) <span class="op">=</span> lim<sub><i>h</i>→0</sub> <span class="frac"><span class="nm"><i>f</i>(<i>z</i>₀+<i>h</i>) <span class="op">−</span> <i>f</i>(<i>z</i>₀)</span><span class="den"><i>h</i></span></span>')}
<p>exists <strong>with the same value however <span class="mth"><i>h</i> → 0</span></strong>. In the complex plane <span class="mth"><i>h</i></span> may approach from any direction, and that is a far stronger demand than in one real variable, where there are only two. Take two of those directions.</p>
<p><em>Along the real axis</em>, put <span class="mth"><i>h</i> = <i>t</i></span> real. Then the increment is in <span class="mth"><i>x</i></span> alone:</p>
${stEq('<i>f</i>′(<i>z</i>₀) <span class="op">=</span> lim<sub><i>t</i>→0</sub> <span class="frac"><span class="nm">Δ<i>u</i> <span class="op">+</span> <i>i</i>Δ<i>v</i></span><span class="den"><i>t</i></span></span> <span class="op">=</span> <i>u<sub>x</sub></i> <span class="op">+</span> <i>i v<sub>x</sub></i>')}
<p><em>Along the imaginary axis</em>, put <span class="mth"><i>h</i> = <i>it</i></span>. Now the increment is in <span class="mth"><i>y</i></span>, and dividing by <span class="mth"><i>i</i></span> multiplies by <span class="mth">−<i>i</i></span>:</p>
${stEq('<i>f</i>′(<i>z</i>₀) <span class="op">=</span> lim<sub><i>t</i>→0</sub> <span class="frac"><span class="nm">Δ<i>u</i> <span class="op">+</span> <i>i</i>Δ<i>v</i></span><span class="den"><i>it</i></span></span> <span class="op">=</span> <span class="op">−</span><i>i</i>(<i>u<sub>y</sub></i> <span class="op">+</span> <i>i v<sub>y</sub></i>) <span class="op">=</span> <i>v<sub>y</sub></i> <span class="op">−</span> <i>i u<sub>y</sub></i>')}
<p>The two must be the same complex number, so their real parts agree and their imaginary parts agree separately:</p>
${stEq('<i>u<sub>x</sub></i> <span class="op">=</span> <i>v<sub>y</sub></i> &nbsp;&nbsp;&nbsp; and &nbsp;&nbsp;&nbsp; <i>v<sub>x</sub></i> <span class="op">=</span> <span class="op">−</span><i>u<sub>y</sub></i>')}
<p>Only two of infinitely many directions were used, and they already pin down two equations. That is the sense in which analyticity is severe — and why conjugation <span class="mth">z̄</span>, which is perfectly smooth as a map of two real variables, has a complex derivative nowhere: it gives <span class="mth"><i>u<sub>x</sub></i> = 1</span> and <span class="mth"><i>v<sub>y</sub></i> = −1</span>, which can never agree.</p>`,
  note:'The converse needs more: the Cauchy–Riemann equations plus continuity of the partials imply analyticity. The equations alone, at a single point, do not.',
  see:'complex:0.2', seeLabel:'Cauchy–Riemann, and a function that fails it' })}

<p>Everything remarkable is paid for by that severity. An analytic function is automatically infinitely differentiable, equals its own Taylor series, and is determined <em>everywhere</em> by its values on any small disc. Nothing in real analysis is remotely so rigid.</p>

<h3 id="c2">Contour integrals</h3>
<p><strong>Cauchy's theorem</strong>: if <span class="mth"><i>f</i></span> is analytic inside and on a closed contour, <span class="mth">∮<i>f</i> d<i>z</i> = 0</span>. Deform the contour freely — as long as it does not cross a singularity the value cannot change. That is the exact complex analogue of a conservative field having path-independent work, and it is the same fact: the Cauchy–Riemann equations say a certain pair of real fields is curl-free.</p>
<p>The one integral everything rests on is</p>
<div class="eqb"><span class="mth">∮ d<i>z</i>/<i>z</i> = 2π<i>i</i></span></div>
<p>which is the same <span class="mth">2π</span> the vector wing finds when it integrates the punctured-plane field around the origin. It is not an analogy; it is the same computation. The <strong>winding number</strong> — how many times the contour encircles the point — is the bookkeeping that makes both work, and the stage computes it for hand-drawn loops.</p>

<h3 id="c3">Residues</h3>
<p>Near an isolated singularity, <span class="mth"><i>f</i></span> has a Laurent series with negative powers. Every term integrates to zero around a closed loop <em>except</em> <span class="mth"><i>a</i><sub>−1</sub>/<i>z</i></span>, so</p>
<div class="eqb"><span class="mth">∮ <i>f</i> d<i>z</i> = 2π<i>i</i> Σ (residues enclosed, each weighted by its winding number)</span></div>
${stThm('Only the 1/z term survives a closed contour', {
  hyp:'<span class="mth"><i>f</i></span> has Laurent series <span class="mth">Σ <i>a<sub>n</sub></i>(<i>z</i>−<i>z</i>₀)<sup><i>n</i></sup></span> on an annulus about <span class="mth"><i>z</i>₀</span>, and <span class="mth"><i>C</i></span> is a circle of radius <span class="mth"><i>r</i></span> inside it, traversed once anticlockwise',
  then:'',
  eq:'∮<sub><i>C</i></sub> <i>f</i> <i>dz</i> <span class="op">=</span> 2π<i>i</i> <i>a</i><sub><span class="op">−</span>1</sub>',
  proof:`<p>Integrate term by term, which uniform convergence on the circle permits. Everything reduces to computing <span class="mth">∮ (<i>z</i>−<i>z</i>₀)<sup><i>n</i></sup> <i>dz</i></span> for each integer <span class="mth"><i>n</i></span>.</p>
<p>Parametrise <span class="mth"><i>z</i> = <i>z</i>₀ + <i>re</i><sup><i>i</i>θ</sup></span>, <span class="mth">θ</span> from 0 to <span class="mth">2π</span>, so <span class="mth"><i>dz</i> = <i>ire</i><sup><i>i</i>θ</sup> <i>d</i>θ</span>:</p>
${stEq('∮ (<i>z</i><span class="op">−</span><i>z</i>₀)<sup><i>n</i></sup> <i>dz</i> <span class="op">=</span> <i>i r</i><sup><i>n</i>+1</sup> ∫₀<sup>2π</sup> <i>e</i><sup><i>i</i>(<i>n</i>+1)θ</sup> <i>d</i>θ')}
<p>Now split on whether the exponent vanishes. If <span class="mth"><i>n</i> ≠ −1</span>, the integrand is a nonconstant complex exponential, whose antiderivative is <span class="mth"><i>e</i><sup><i>i</i>(<i>n</i>+1)θ</sup>/<i>i</i>(<i>n</i>+1)</span> — and being <span class="mth">2π</span>-periodic it returns to its starting value, so the integral is <strong>zero</strong>.</p>
<p>If <span class="mth"><i>n</i> = −1</span> the exponent is zero, the integrand is the constant 1, and</p>
${stEq('<i>i r</i>⁰ ∫₀<sup>2π</sup> 1 <i>d</i>θ <span class="op">=</span> 2π<i>i</i>')}
<p>So every term integrates to zero except the one with <span class="mth"><i>n</i> = −1</span>, whose coefficient is <span class="mth"><i>a</i><sub>−1</sub></span>. Note the radius cancelled — the answer does not depend on <span class="mth"><i>r</i></span>, which is why the contour may be deformed freely.</p>
<p>This makes the residue's definition transparent: <span class="mth"><i>a</i><sub>−1</sub></span> is singled out not because it is the largest or the most singular term, but because <span class="mth">−1</span> is the one exponent for which the antiderivative fails to be periodic. A double pole contributes nothing at all — <span class="mth">1/<i>z</i>²</span> blows up perfectly well and still integrates to zero. Blowing up is not the criterion.</p>`,
  note:'The lab computes residues by shrinking a circle and dividing by 2πi — the definition — rather than by the algebraic shortcut, so the shortcut can be seen to be one.',
  see:'complex:1.4', seeLabel:'A double pole has residue zero' })}

<p>That is why a double pole contributes nothing: <span class="mth">1/<i>z</i>²</span> blows up perfectly well and still integrates to zero. Blowing up is not the criterion; having a <span class="mth">1/<i>z</i></span> term is. The stage computes residues by shrinking a circle and dividing by <span class="mth">2π<i>i</i></span> — the definition — rather than by the algebraic shortcut, so the shortcut looks like what it is.</p>

<h3 id="c4">The link to potential theory</h3>
<p>If <span class="mth"><i>f</i> = <i>u</i> + <i>iv</i></span> is analytic then <span class="mth">∇²<i>u</i> = ∇²<i>v</i> = 0</span> in two lines from Cauchy–Riemann. So the real and imaginary parts of every analytic function are <strong>harmonic</strong>, which is why the potential-theory wing offers <span class="mth"><i>x</i>²−<i>y</i>²</span>, <span class="mth"><i>xy</i></span>, <span class="mth"><i>e</i><sup>x</sup>cos <i>y</i></span> and <span class="mth">log <i>r</i></span> — they are <span class="mth">Re</span> and <span class="mth">Im</span> of <span class="mth"><i>z</i>²</span>, <span class="mth"><i>e</i><sup>z</sup></span> and <span class="mth">log <i>z</i></span>. It is also why conformal mapping solves potential problems: an analytic change of variable preserves harmonicity.</p>
<p class="note">Shown here: domain colouring, the Cauchy–Riemann residual, contour integrals by quadrature, winding numbers and residues by limit. Not shown: branch cuts beyond the principal branch, Laurent series explicitly, or analytic continuation.</p>
`;

const THEORY_FORMS = `
<div class="toc"><a href="#f0">One operator</a><a href="#f1">d∘d = 0</a><a href="#f2">Why three dimensions</a>
<a href="#f3">One theorem</a></div>

<h3 id="f0">One operator, three familiar faces</h3>
<p>Gradient, curl and divergence look like three unrelated inventions. They are one operator — the <strong>exterior derivative</strong> <span class="mth">d</span> — applied to objects of different degree:</p>
<ul>
  <li><span class="mth">d</span> of a <strong>0-form</strong> (a function) is the <strong>gradient</strong>;</li>
  <li><span class="mth">d</span> of a <strong>1-form</strong> <span class="mth"><i>P</i>d<i>x</i>+<i>Q</i>d<i>y</i>+<i>R</i>d<i>z</i></span> is the <strong>curl</strong>;</li>
  <li><span class="mth">d</span> of a <strong>2-form</strong> is the <strong>divergence</strong>;</li>
  <li><span class="mth">d</span> of a 3-form is zero — there is nothing of degree four in three dimensions.</li>
</ul>
<p>A <span class="mth"><i>k</i></span>-form is the thing you integrate over a <span class="mth"><i>k</i></span>-dimensional object: a 1-form along a curve, a 2-form over a surface, a 3-form over a volume. That is why line, surface and volume integrals take the integrands they do, and why the orientation matters in each.</p>

<h3 id="f1">d∘d = 0</h3>
<p>Applying <span class="mth">d</span> twice always gives zero, because mixed partials commute. At degree 0 that statement reads <span class="mth">curl(grad <i>f</i>) = 0</span>; at degree 1 it reads <span class="mth">div(curl <b>F</b>) = 0</span>. Two identities usually proved separately by grinding through components are one line, and the stage measures both for whatever expressions you type.</p>
${stThm('d∘d = 0', {
  hyp:'<span class="mth">ω</span> is a differential form with continuous second partial derivatives',
  then:'',
  eq:'<i>d</i>(<i>d</i>ω) <span class="op">=</span> 0',
  proof:`<p>Take a 0-form <span class="mth"><i>f</i></span>; the general case is the same computation with more indices. Its exterior derivative is</p>
${stEq('<i>df</i> <span class="op">=</span> <i>f<sub>x</sub></i> <i>dx</i> <span class="op">+</span> <i>f<sub>y</sub></i> <i>dy</i> <span class="op">+</span> <i>f<sub>z</sub></i> <i>dz</i>')}
<p>Applying <span class="mth"><i>d</i></span> again differentiates each coefficient and wedges on the new differential. Collect the <span class="mth"><i>dx</i>∧<i>dy</i></span> terms:</p>
${stEq('<i>f<sub>xy</sub></i> <i>dy</i>∧<i>dx</i> <span class="op">+</span> <i>f<sub>yx</sub></i> <i>dx</i>∧<i>dy</i> <span class="op">=</span> (<i>f<sub>yx</sub></i> <span class="op">−</span> <i>f<sub>xy</sub></i>) <i>dx</i>∧<i>dy</i>')}
<p>using antisymmetry of the wedge, <span class="mth"><i>dy</i>∧<i>dx</i> = −<i>dx</i>∧<i>dy</i></span>. Two independent facts now collide, and both are needed:</p>
<ol>
<li>the wedge is <strong>antisymmetric</strong>, so swapping the differentials flips the sign;</li>
<li>mixed partials are <strong>symmetric</strong> — Clairaut's theorem, which is where the continuity hypothesis is spent — so <span class="mth"><i>f<sub>xy</sub></i> = <i>f<sub>yx</sub></i></span>.</li>
</ol>
<p>A quantity that is both symmetric and antisymmetric in the same pair of indices is zero. Every pair cancels the same way, so <span class="mth"><i>d</i>(<i>df</i>) = 0</span>.</p>
<p>Read at degree 0 this says <span class="mth">curl(grad <i>f</i>) = 0</span>; at degree 1 it says <span class="mth">div(curl <b>F</b>) = 0</span>. Two identities normally proved separately by grinding through components are one line, and they were never really two.</p>`,
  note:'The hypothesis is not decorative. Drop continuity of the second partials and Clairaut fails, and with it this identity — which is why the vector-calculus identities always carry a smoothness assumption.',
  see:'forms:0.1', seeLabel:'d on a 1-form is the curl' })}

<p>The converse is where topology enters. A form with <span class="mth">dω = 0</span> is <strong>closed</strong>; one that is <span class="mth">dη</span> for some <span class="mth">η</span> is <strong>exact</strong>. Exact always implies closed — that is <span class="mth">d∘d = 0</span> — but closed implies exact only when the region has no holes. The punctured-plane field in the vector calculus wing is the standard counterexample: curl-free everywhere it is defined, yet not a gradient, because the domain has a hole. Measuring that failure is what de Rham cohomology does.</p>

<h3 id="f2">Why the cross product exists only in three dimensions</h3>
<p>A 2-form in <span class="mth"><i>n</i></span> dimensions has <span class="mth"><i>n</i>(<i>n</i>−1)/2</span> components: 1 in the plane, <strong>3 in space</strong>, 6 in four dimensions. A curl is really a 2-form, and it can be disguised as a vector only when that count happens to equal <span class="mth"><i>n</i></span> — which happens once, at <span class="mth"><i>n</i> = 3</span>. The <strong>Hodge star</strong> is the map performing that disguise.</p>
<p>The cross product exists for the same reason and in the same dimension. "Curl is a vector" is therefore a three-dimensional accident rather than a general truth, and in four dimensions — spacetime — neither is available, which is why electromagnetism is written there with the field <em>tensor</em> that the relativity wing uses.</p>

<h3 id="f3">One theorem instead of four</h3>
<div class="eqb"><span class="mth">∫<sub>∂Ω</sub> ω = ∫<sub>Ω</sub> dω</span></div>
<p>The fundamental theorem of calculus, Green's theorem, Stokes' theorem and the divergence theorem are this single statement at four different degrees. The boundary operator <span class="mth">∂</span> and the exterior derivative <span class="mth">d</span> are adjoint, and <span class="mth">∂∘∂ = 0</span> — <em>a boundary has no boundary</em> — mirrors <span class="mth">d∘d = 0</span> exactly. That correspondence is the reason the theorems compose the way they do, and the reason Stokes' theorem gives the same answer for every cap on a given rim, which the vector calculus wing demonstrates with four different caps.</p>
`;

const THEORY_POTENTIAL = `
<div class="toc"><a href="#h0">Harmonic functions</a><a href="#h1">The mean value property</a>
<a href="#h2">Green's identities</a><a href="#h3">Helmholtz</a><a href="#h4">Honest limits</a></div>

<h3 id="h0">Harmonic functions</h3>
<p>A function is <strong>harmonic</strong> where <span class="mth">∇²<i>f</i> = 0</span>. These are the steady states of diffusion — the temperature of a plate once it has stopped changing — the electrostatic potentials in charge-free regions, and the velocity potentials of incompressible irrotational flow. They are also the real and imaginary parts of analytic functions, which is the tightest possible link between this wing and the complex one.</p>

<h3 id="h1">The mean value property, and what it forbids</h3>
<p>A harmonic function's value at a point equals its average over <em>any</em> circle centred there. This is not a corollary; it is equivalent to being harmonic, and the stage lets you drag the circle and change its radius while the two numbers stay locked.</p>
${stThm('Maximum principle for harmonic functions', {
  hyp:'<span class="mth"><i>u</i></span> is harmonic on a bounded connected open region <span class="mth">Ω</span> and continuous on <span class="mth">Ω̄</span>',
  then:'<span class="mth"><i>u</i></span> attains its maximum and minimum on the boundary <span class="mth">∂Ω</span>; if it attains an interior maximum then <span class="mth"><i>u</i></span> is constant',
  proof:`<p>Suppose <span class="mth"><i>u</i></span> reaches its maximum <span class="mth"><i>M</i></span> at an interior point <span class="mth"><i>p</i></span>. Take any disc about <span class="mth"><i>p</i></span> contained in <span class="mth">Ω</span>. The mean value property says</p>
${stEq('<i>u</i>(<i>p</i>) <span class="op">=</span> average of <i>u</i> over the circle <span class="op">=</span> <i>M</i>')}
<p>Every value on that circle is <span class="mth">≤ <i>M</i></span>, since <span class="mth"><i>M</i></span> is the maximum. But a set of numbers no greater than <span class="mth"><i>M</i></span> can only average to <span class="mth"><i>M</i></span> if <strong>every one of them equals <span class="mth"><i>M</i></span></strong> — any value strictly below would have to be offset by one above, and there is none. Continuity turns "on every circle" into "on the whole disc".</p>
<p>So the set where <span class="mth"><i>u</i> = <i>M</i></span> is open. It is also closed in <span class="mth">Ω</span>, being the preimage of a point under a continuous map, and it is nonempty. A connected region has no proper nonempty subset that is both open and closed, so it is all of <span class="mth">Ω</span> — that is, <span class="mth"><i>u</i></span> is constant.</p>
<p>If <span class="mth"><i>u</i></span> is not constant, no interior maximum is possible, and since <span class="mth">Ω̄</span> is compact and <span class="mth"><i>u</i></span> continuous, the maximum exists and must therefore sit on <span class="mth">∂Ω</span>. Applying all of this to <span class="mth">−<i>u</i></span>, which is also harmonic, handles the minimum.</p>
<p>The averaging step is the whole argument, and it is why the mean value property and harmonicity are equivalent rather than one implying the other.</p>`,
  note:'Uniqueness follows immediately: two solutions with the same boundary data have a harmonic difference whose boundary values are zero, so its maximum and minimum are both zero — the difference vanishes. This is why a steady temperature is always hottest on its boundary and a soap film has no interior bumps.',
  see:'potential:0.0', seeLabel:'The mean value property' })}

<p>It immediately forbids an interior maximum: a peak would have to exceed its own average. That is the <strong>maximum principle</strong>, and it is why a steady temperature distribution is always hottest on its boundary, and why a soap film has no interior bumps. It also gives uniqueness: two solutions of a boundary-value problem with the same boundary data have a harmonic difference with zero boundary values, whose maximum and minimum are both zero — so they are the same function.</p>
<p>The Laplacian measures how much a function differs from its local average. Positive means the function sits below its surroundings, which is why <span class="mth">∂<i>u</i>/∂<i>t</i> = ∇²<i>u</i></span> is the heat equation: temperature rises where it is colder than its neighbourhood.</p>

<h3 id="h2">Green's identities</h3>
<div class="eqb"><span class="mth">∮ <i>f</i> ∇<i>g</i>·<b>n̂</b> d<i>s</i> = ∬ (<i>f</i>∇²<i>g</i> + ∇<i>f</i>·∇<i>g</i>) d<i>A</i></span></div>
<p>This is nothing but the product rule combined with the divergence theorem, and subtracting it from itself with <span class="mth"><i>f</i></span> and <span class="mth"><i>g</i></span> exchanged gives the second identity. They are the tools that turn statements about a region into statements about its boundary, and they are how the uniqueness arguments above are actually written down.</p>

<h3 id="h3">The Helmholtz decomposition</h3>
<div class="eqb"><span class="mth"><b>F</b> = −∇φ + ∇×<b>A</b></span></div>
<p>Every well-behaved field splits into exactly two pieces: one carrying all the divergence and no curl, the other all the curl and no divergence. Nothing is left over. The laboratory does not quote this — it <em>solves</em> for it. Taking the divergence of both sides gives <span class="mth">∇²φ = −∇·<b>F</b></span> and taking the curl gives <span class="mth">∇²ψ = ∇×<b>F</b></span>, so each piece is the solution of a Poisson equation, relaxed on a grid. The pieces are then differentiated back and checked: the first must have no curl, the second no divergence, and the two must add to what you started with.</p>
<p>This theorem is why electromagnetism has the potentials it does. <span class="mth">∇·<b>B</b> = 0</span> everywhere forces <span class="mth"><b>B</b></span> to be entirely of the second kind, hence <span class="mth"><b>B</b> = ∇×<b>A</b></span>; in electrostatics <span class="mth">∇×<b>E</b> = 0</span> forces the first, hence <span class="mth"><b>E</b> = −∇<i>V</i></span>. Maxwell's equations in potential form are this decomposition applied to the fields.</p>

<h3 id="h4">What is honestly shown</h3>
<p class="note">The decomposition comes from a relaxation on a finite grid with imposed boundary values, so it is only as good as that solve. Away from the boundary the residuals are small; near it the imposed conditions distort both pieces, and the panel reports the real numbers rather than tuning them until they look exact. The mean-value and Green's-identity checks are quadratures, accurate to the sampling shown and no further.</p>
`;
