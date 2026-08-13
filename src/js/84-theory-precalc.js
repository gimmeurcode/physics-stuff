/* ============================================================================
   7a · THE LONG-FORM MATHEMATICS — ALGEBRA, FUNCTIONS, TRIGONOMETRY
   ============================================================================ */
const THEORY_ALGEBRA = `
<div class="toc"><a href="#g0">What algebra is for</a><a href="#g1">Completing the square</a>
<a href="#g2">The discriminant</a><a href="#g3">Vieta</a><a href="#g4">Polynomials</a>
<a href="#g5">Rational functions</a><a href="#g6">Where it is used</a></div>

<h3 id="g0">What algebra is actually for</h3>
<p>Arithmetic answers a question about particular numbers. Algebra answers it about <em>all</em> numbers at once, by doing the work with letters and substituting only at the end. That is the whole economy of the subject, and it is why this floor derives the quadratic formula rather than storing it: the derivation is performed once in letters, and every quadratic that has ever existed is then a substitution away.</p>
<p>The habit worth acquiring here is asking, of every rule, <em>where does it come from</em>. Almost nothing in elementary algebra is arbitrary. The log laws are exponent laws; the Pythagorean identity is the equation of a circle; the quadratic formula is one clever way of adding zero.</p>

<h3 id="g1">Completing the square</h3>
<p>A general quadratic cannot be inverted directly — you cannot "undo" <span class="mth"><i>ax</i>² + <i>bx</i> + <i>c</i></span> because <span class="mth"><i>x</i></span> appears twice. A perfect square can be inverted, by taking a square root. So the entire method is: turn the first into the second.</p>
<div class="eqb"><span class="mth"><i>x</i>² <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i></span><span class="den"><i>a</i></span></span><i>x</i> <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i>²</span><span class="den">4<i>a</i>²</span></span> <span class="op">=</span> (<i>x</i> <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i></span><span class="den">2<i>a</i></span></span>)²</span></div>
<p>The term <span class="mth">(<i>b</i>/2<i>a</i>)²</span> is exactly what is needed, and adding it while subtracting it again changes nothing. Solving from there is mechanical, and what drops out is</p>
<div class="eqb"><span class="mth"><i>x</i> <span class="op">=</span> <span class="frac"><span class="nm"><span class="op">−</span><i>b</i> <span class="op">±</span> <span class="rad"><i>b</i>² <span class="op">−</span> 4<i>ac</i></span></span><span class="den">2<i>a</i></span></span></span></div>
<p>Completing the square is not a trick for quadratics alone. It is how the normal distribution is integrated, how a quadratic form is diagonalised in the eigenvalue wing, and how the energy of an oscillator is separated into kinetic and potential parts.</p>

${stThm('The quadratic formula', {
  hyp:'<span class="mth"><i>a</i> ≠ 0</span>',
  then:'the solutions of <span class="mth"><i>ax</i>² + <i>bx</i> + <i>c</i> = 0</span> are',
  eq:'<i>x</i> <span class="op">=</span> <span class="frac"><span class="nm"><span class="op">−</span><i>b</i> <span class="op">±</span> √(<i>b</i>² <span class="op">−</span> 4<i>ac</i>)</span><span class="den">2<i>a</i></span></span>',
  proof:`<p>Divide by <span class="mth"><i>a</i></span>, which the hypothesis permits:</p>
${stEq('<i>x</i>² <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i></span><span class="den"><i>a</i></span></span><i>x</i> <span class="op">+</span> <span class="frac"><span class="nm"><i>c</i></span><span class="den"><i>a</i></span></span> <span class="op">=</span> 0')}
<p>The obstacle is that <span class="mth"><i>x</i></span> occurs twice, so no single inverse operation reaches it. A perfect square has that defect removed — it can be undone by a square root — so add and subtract exactly the term that makes one:</p>
${stEq('(<i>x</i> <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i></span><span class="den">2<i>a</i></span></span>)² <span class="op">−</span> <span class="frac"><span class="nm"><i>b</i>²</span><span class="den">4<i>a</i>²</span></span> <span class="op">+</span> <span class="frac"><span class="nm"><i>c</i></span><span class="den"><i>a</i></span></span> <span class="op">=</span> 0')}
<p>Expanding the bracket recovers <span class="mth"><i>x</i>² + (<i>b</i>/<i>a</i>)<i>x</i> + <i>b</i>²/4<i>a</i>²</span>, so the identity is exact rather than an approximation. Move the constants across:</p>
${stEq('(<i>x</i> <span class="op">+</span> <span class="frac"><span class="nm"><i>b</i></span><span class="den">2<i>a</i></span></span>)² <span class="op">=</span> <span class="frac"><span class="nm"><i>b</i>² <span class="op">−</span> 4<i>ac</i></span><span class="den">4<i>a</i>²</span></span>')}
<p>Now <span class="mth"><i>x</i></span> occurs once, and a square root inverts it — introducing <span class="mth">±</span>, because both signs square to the same thing. Subtracting <span class="mth"><i>b</i>/2<i>a</i></span> gives the formula.</p>
<p>The formula is therefore not something to memorise separately: it is completing the square carried out on letters instead of numbers, once and for all.</p>`,
  note:'Every step is reversible, so the formula finds all the roots and no spurious ones. The ± is the only place a choice enters.',
  see:'algebra:0.2', seeLabel:'And out falls the quadratic formula' })}

<h3 id="g2">The discriminant, and what "no solution" means</h3>
<p><span class="mth"><i>b</i>² <span class="op">−</span> 4<i>ac</i></span> decides everything: positive gives two real roots, zero one repeated root, negative none — on the real line. The last case is worth being careful about. The roots do not cease to exist; they leave the real line as a complex conjugate pair. Watch the parabola rise off the axis and note that the vertex, the axis of symmetry, and the sum and product of the roots all remain perfectly well defined throughout. Nothing discontinuous happens to the algebra, only to what is visible.</p>
<p class="note">This is the first place a student meets the idea that the reals are <em>incomplete</em>. Insisting that every polynomial has its full complement of roots is what forces the complex numbers into existence, and the fundamental theorem of algebra is the reward: over <span class="mth">ℂ</span>, a degree-<span class="mth"><i>n</i></span> polynomial has exactly <span class="mth"><i>n</i></span> roots, always.</p>

<h3 id="g3">Vieta's relations</h3>
<div class="eqb"><span class="mth"><i>r</i><sub>1</sub> <span class="op">+</span> <i>r</i><sub>2</sub> <span class="op">=</span> <span class="op">−</span><i>b</i>/<i>a</i> , &nbsp;&nbsp; <i>r</i><sub>1</sub><i>r</i><sub>2</sub> <span class="op">=</span> <i>c</i>/<i>a</i></span></div>
<p>This is what "factoring by inspection" actually is: find two numbers with the right sum and product. It survives the complex case, because a conjugate pair has a real sum and a real product — which is the first hint that complex roots complete the picture rather than breaking it. In the linear-algebra wing the same relations reappear as the trace and determinant of a matrix, for the same reason: both are coefficients of a characteristic polynomial.</p>

${stThm("Vieta's relations", {
  hyp:'<span class="mth"><i>r</i>₁, <i>r</i>₂</span> are the roots of <span class="mth"><i>ax</i>² + <i>bx</i> + <i>c</i></span>, with <span class="mth"><i>a</i> ≠ 0</span>',
  then:'',
  eq:'<i>r</i>₁ <span class="op">+</span> <i>r</i>₂ <span class="op">=</span> <span class="op">−</span><i>b</i>/<i>a</i> , &nbsp;&nbsp; <i>r</i>₁<i>r</i>₂ <span class="op">=</span> <i>c</i>/<i>a</i>',
  proof:`<p>Having roots <span class="mth"><i>r</i>₁, <i>r</i>₂</span> means the polynomial factors as <span class="mth"><i>a</i>(<i>x</i> − <i>r</i>₁)(<i>x</i> − <i>r</i>₂)</span>. Expand:</p>
${stEq('<i>a</i>(<i>x</i> <span class="op">−</span> <i>r</i>₁)(<i>x</i> <span class="op">−</span> <i>r</i>₂) <span class="op">=</span> <i>ax</i>² <span class="op">−</span> <i>a</i>(<i>r</i>₁ <span class="op">+</span> <i>r</i>₂)<i>x</i> <span class="op">+</span> <i>a r</i>₁<i>r</i>₂')}
<p>Two polynomials are equal exactly when their coefficients match term by term. Comparing the <span class="mth"><i>x</i></span> coefficients gives <span class="mth">−<i>a</i>(<i>r</i>₁+<i>r</i>₂) = <i>b</i></span>, and the constants give <span class="mth"><i>a r</i>₁<i>r</i>₂ = <i>c</i></span>. Dividing each by <span class="mth"><i>a</i></span> is the claim.</p>
<p>Notice the argument never solved for the roots, which is why it survives the complex case untouched: a conjugate pair <span class="mth">α ± <i>i</i>β</span> has sum <span class="mth">2α</span> and product <span class="mth">α² + β²</span>, both real, exactly as the relations require.</p>`,
  note:'"Factoring by inspection" is precisely this: find two numbers with the right sum and product. In the eigenvalue wing the same relations return as the trace and determinant, because both are coefficients of a characteristic polynomial.',
  see:'algebra:0.4', seeLabel:'Vieta: the roots from the coefficients alone' })}

<h3 id="g4">Polynomials: roots and factors are one idea</h3>
<p>Divide <span class="mth"><i>p</i></span> by <span class="mth">(<i>x</i> <span class="op">−</span> <i>r</i>)</span>. The remainder is a constant, and putting <span class="mth"><i>x</i> = <i>r</i></span> shows that constant <em>is</em> <span class="mth"><i>p</i>(<i>r</i>)</span>. So:</p>

${stThm('Factor theorem', {
  hyp:'<span class="mth"><i>p</i></span> is a polynomial and <span class="mth"><i>r</i></span> a number',
  then:'<span class="mth">(<i>x</i> − <i>r</i>)</span> divides <span class="mth"><i>p</i></span> <strong>if and only if</strong> <span class="mth"><i>p</i>(<i>r</i>) = 0</span>',
  proof:`<p>Divide <span class="mth"><i>p</i></span> by <span class="mth">(<i>x</i> − <i>r</i>)</span>. Polynomial division always terminates with a remainder of lower degree than the divisor, and the divisor has degree 1, so the remainder is a <em>constant</em> <span class="mth"><i>R</i></span>:</p>
${stEq('<i>p</i>(<i>x</i>) <span class="op">=</span> (<i>x</i> <span class="op">−</span> <i>r</i>) <i>q</i>(<i>x</i>) <span class="op">+</span> <i>R</i>')}
<p>This is an identity in <span class="mth"><i>x</i></span>, so it holds at every value — in particular at <span class="mth"><i>x</i> = <i>r</i></span>, where the first term is annihilated:</p>
${stEq('<i>p</i>(<i>r</i>) <span class="op">=</span> 0 <span class="op">·</span> <i>q</i>(<i>r</i>) <span class="op">+</span> <i>R</i> <span class="op">=</span> <i>R</i>')}
<p>So the remainder <em>is</em> <span class="mth"><i>p</i>(<i>r</i>)</span> — that is the remainder theorem. The factor theorem follows immediately: <span class="mth">(<i>x</i> − <i>r</i>)</span> divides <span class="mth"><i>p</i></span> exactly when <span class="mth"><i>R</i> = 0</span>, which is exactly when <span class="mth"><i>p</i>(<i>r</i>) = 0</span>.</p>
<p>Both directions came out of one substitution, which is why "root" and "factor" should be read as two words for the same fact rather than two facts.</p>`,
  note:'Evaluating p(r) by Horner’s scheme is the same arithmetic as dividing by (x − r), so the lab gets the quotient for free while testing a candidate root.',
  see:'algebra:1.0', seeLabel:'A root and a factor are the same thing' })}
<ul>
  <li><strong>Remainder theorem</strong> — the remainder on dividing by <span class="mth">(<i>x</i>−<i>r</i>)</span> is <span class="mth"><i>p</i>(<i>r</i>)</span>.</li>
  <li><strong>Factor theorem</strong> — the special case <span class="mth"><i>p</i>(<i>r</i>) = 0</span>: <span class="mth">(<i>x</i>−<i>r</i>)</span> divides <span class="mth"><i>p</i></span> exactly when <span class="mth"><i>r</i></span> is a root.</li>
</ul>
<p>Synthetic division and evaluating at <span class="mth"><i>r</i></span> are therefore the same arithmetic written two ways, which is what Horner's scheme exploits. Peeling one root at a time drops the degree by one and the process repeats.</p>
<p>The <strong>rational-root theorem</strong> deserves an honest description: it does not find roots. It converts an infinite search into a finite list of candidates <span class="mth"><i>p</i>/<i>q</i></span>, and each still has to be tested. When none works — which is the usual case for a polynomial not written by a textbook author — the roots are irrational, and the right tool is Newton's method from the derivatives wing.</p>
<p><strong>Multiplicity</strong> is visible on the graph: odd multiplicity crosses the axis, even multiplicity touches and turns back. The reason belongs to calculus — at a repeated root both <span class="mth"><i>p</i></span> and <span class="mth"><i>p</i>′</span> vanish — and it is the first place algebra hands a question over.</p>

<h3 id="g5">Rational functions and asymptotes</h3>
<p>For <span class="mth"><i>p</i>/<i>q</i></span>, end behaviour is decided by comparing degrees: lower over higher tends to zero; equal degrees tend to the ratio of leading coefficients; numerator one degree higher gives a slant asymptote found by dividing. A zero of the denominator is a <strong>vertical asymptote</strong> unless the numerator vanishes there too, in which case it is a <strong>hole</strong> — a removable discontinuity, and precisely the situation the limits wing opens with.</p>

<h3 id="g6">Where this floor is used above it</h3>
<ul>
  <li><strong>Limits</strong> — cancelling a common factor to evaluate <span class="mth">0/0</span> is the factor theorem in action.</li>
  <li><strong>Integration</strong> — partial fractions is factoring the denominator and then undoing Vieta.</li>
  <li><strong>Differential equations</strong> — the characteristic equation is a polynomial, and its repeated-root case behaves exactly like a repeated root here.</li>
  <li><strong>Linear algebra</strong> — eigenvalues are roots of the characteristic polynomial, with trace and determinant as Vieta's relations.</li>
</ul>
`;

const THEORY_FUNCTIONS = `
<div class="toc"><a href="#u0">What a function is</a><a href="#u1">Transformations</a>
<a href="#u2">Inverses</a><a href="#u3">Exponentials</a><a href="#u4">Logarithms</a>
<a href="#u5">Why e</a></div>

<h3 id="u0">What a function is</h3>
<p>A function assigns to each input exactly one output. The "exactly one" is the entire content — it is what the vertical line test checks, and it is why an inverse needs the horizontal line test. Everything else on this floor follows from taking that seriously.</p>

<h3 id="u1">Transformations, and the inside/outside asymmetry</h3>
<div class="eqb"><span class="mth"><i>y</i> <span class="op">=</span> <i>A</i>·<i>f</i>(<i>k</i>(<i>x</i> <span class="op">−</span> <i>h</i>)) <span class="op">+</span> <i>v</i></span></div>
<p>Four parameters, and no fifth thing can happen to a graph. The two <em>outside</em> the function scale and shift the output, and behave as expected. The two <em>inside</em> behave backwards: <span class="mth"><i>x</i> <span class="op">−</span> <i>h</i></span> moves the graph <em>right</em>, and a larger <span class="mth"><i>k</i></span> <em>squeezes</em>.</p>
<p>The reason is worth stating rather than memorising. The new graph shows, at position <span class="mth"><i>x</i></span>, whatever the old one showed at <span class="mth"><i>k</i>(<i>x</i>−<i>h</i>)</span>. To <em>see</em> a given feature you must solve for the input that produces it, and solving reverses both operations. The same reversal reappears as the phase of a wave, the shift theorems of the Fourier and Laplace wings, and the substitution rule for integrals.</p>
<p><strong>Symmetry</strong> is the special case worth naming: <span class="mth"><i>f</i>(<span class="op">−</span><i>x</i>) = <i>f</i>(<i>x</i>)</span> is even (a mirror in the <span class="mth"><i>y</i></span>-axis), <span class="mth"><i>f</i>(<span class="op">−</span><i>x</i>) = <span class="op">−</span><i>f</i>(<i>x</i>)</span> is odd (a half-turn about the origin). This is not decorative — an odd function integrates to zero over a symmetric interval, and an odd function's Fourier series contains only sines.</p>

<h3 id="u2">Inverses</h3>
<p>Since <span class="mth">(<i>a</i>, <i>b</i>)</span> lies on <span class="mth"><i>f</i></span> exactly when <span class="mth">(<i>b</i>, <i>a</i>)</span> lies on <span class="mth"><i>f</i><sup>−1</sup></span>, and swapping coordinates is reflection in <span class="mth"><i>y</i> = <i>x</i></span>, the graph of an inverse is the same curve read along the other axis. Nothing needs plotting twice.</p>
<p>An inverse exists exactly when <span class="mth"><i>f</i></span> is one-to-one. Reflecting a curve that fails the horizontal line test produces one that fails the <em>vertical</em> line test — two outputs over one input, which is not a function. This is why <span class="mth">arcsin</span> is defined only on <span class="mth">[<span class="op">−</span>π/2, π/2]</span> and <span class="mth">√<i>x</i></span> is taken non-negative: the restriction is the price of invertibility, not a convention someone chose.</p>

${stDefn('One-to-one (injective)', `
<p><span class="mth"><i>f</i></span> is <strong>one-to-one</strong> on a set <span class="mth"><i>D</i></span> when distinct inputs give distinct outputs:</p>
${stEq('<i>x</i>₁ ≠ <i>x</i>₂ &nbsp;⟹&nbsp; <i>f</i>(<i>x</i>₁) ≠ <i>f</i>(<i>x</i>₂) &nbsp;&nbsp;&nbsp; for all <i>x</i>₁, <i>x</i>₂ ∈ <i>D</i>')}
<p>Equivalently, and usually easier to check: <span class="mth"><i>f</i>(<i>x</i>₁) = <i>f</i>(<i>x</i>₂)</span> forces <span class="mth"><i>x</i>₁ = <i>x</i>₂</span>. Graphically this is the horizontal line test.</p>`,
{ see:'functions:1.1', seeLabel:'When there is no inverse' })}

${stThm('An inverse exists exactly when the function is one-to-one', {
  hyp:'<span class="mth"><i>f</i></span> has domain <span class="mth"><i>D</i></span> and range <span class="mth"><i>R</i></span>',
  then:'there is a function <span class="mth"><i>f</i><sup>−1</sup>: <i>R</i> → <i>D</i></span> with <span class="mth"><i>f</i><sup>−1</sup>(<i>f</i>(<i>x</i>)) = <i>x</i></span> throughout <strong>if and only if</strong> <span class="mth"><i>f</i></span> is one-to-one on <span class="mth"><i>D</i></span>',
  proof:`<p><em>One-to-one ⟹ an inverse exists.</em> Given <span class="mth"><i>y</i> ∈ <i>R</i></span> there is at least one <span class="mth"><i>x</i></span> with <span class="mth"><i>f</i>(<i>x</i>) = <i>y</i></span>, because <span class="mth"><i>R</i></span> is the range. There is at most one, because two of them would violate one-to-oneness. Exactly one — so the rule "send <span class="mth"><i>y</i></span> to that <span class="mth"><i>x</i></span>" assigns each input exactly one output, which is what being a function requires.</p>
<p><em>An inverse exists ⟹ one-to-one.</em> Suppose <span class="mth"><i>f</i>(<i>x</i>₁) = <i>f</i>(<i>x</i>₂)</span>. Apply <span class="mth"><i>f</i><sup>−1</sup></span> to both sides; since it is a function it gives the same answer for the same input, so <span class="mth"><i>x</i>₁ = <i>f</i><sup>−1</sup>(<i>f</i>(<i>x</i>₁)) = <i>f</i><sup>−1</sup>(<i>f</i>(<i>x</i>₂)) = <i>x</i>₂</span>.</p>
<p>Both directions turn on the same clause of the definition of a function — "exactly one output" — used once for <span class="mth"><i>f</i></span> and once for <span class="mth"><i>f</i><sup>−1</sup></span>. That is why reflecting a curve that fails the horizontal line test produces one that fails the vertical line test: it is the same failure, seen along the other axis.</p>`,
  note:'Restricting the domain is therefore not a convention but a repair: arcsin exists because sine was cut down to [−π/2, π/2] first.',
  see:'functions:1.2', seeLabel:'Restricting the domain to rescue it' })}

<h3 id="u3">Exponentials</h3>
<p><span class="mth"><i>b</i><sup>x</sup></span> multiplies by a fixed factor for each unit step, which is what "exponential growth" means and why it eventually outruns every polynomial. It is always positive, so it has a horizontal asymptote it never reaches — and reflecting that gives the logarithm its vertical asymptote and its domain <span class="mth"><i>x</i> &gt; 0</span>.</p>

<h3 id="u4">Logarithms are exponent laws in a mirror</h3>
<p>Set <span class="mth"><i>m</i> = log<sub>b</sub> <i>x</i></span>, <span class="mth"><i>n</i> = log<sub>b</sub> <i>y</i></span>, so <span class="mth"><i>b</i><sup>m</sup> = <i>x</i></span> and <span class="mth"><i>b</i><sup>n</sup> = <i>y</i></span>. Then <span class="mth"><i>xy</i> = <i>b</i><sup>m+n</sup></span>, and taking logs gives</p>
<div class="eqb"><span class="mth">log<sub>b</sub>(<i>xy</i>) <span class="op">=</span> log<sub>b</sub> <i>x</i> <span class="op">+</span> log<sub>b</sub> <i>y</i></span></div>
<p>There are three log laws because there are three exponent laws, and each derivation is the same three lines. Turning multiplication into addition is the whole reason logarithms were invented — slide rules, decibels, pH, stellar magnitudes and the log-log plot on which a power law becomes a straight line whose slope is the exponent.</p>

<h3 id="u5">Why e, specifically</h3>
<p>Change of base shows every logarithm is the natural one times a constant, so all log graphs are vertical stretches of one curve. Calculus therefore picks the base that makes the constant 1. That base is <span class="mth"><i>e</i> = 2.718281828…</span>, defined by the limit <span class="mth">(1 + <i>x</i>)<sup>1/x</sup></span> as <span class="mth"><i>x</i> → 0</span> — a genuinely indeterminate <span class="mth">1<sup>∞</sup></span> form, since the base approaches 1 while the exponent runs away, and the race between them is what <span class="mth"><i>e</i></span> measures.</p>
<p>The payoff is <span class="mth">d(<i>e</i><sup>x</sup>)/d<i>x</i> = <i>e</i><sup>x</sup></span> and <span class="mth">d(ln <i>x</i>)/d<i>x</i> = 1/<i>x</i></span>, with no leftover constants. Everything that grows or decays in proportion to itself — populations, radioactivity, capacitor charge, cooling — is an exponential for that reason, and the differential-equations wing shows why in one line.</p>
`;

const THEORY_TRIG = `
<div class="toc"><a href="#t0">The circle is the definition</a><a href="#t1">Pythagoras</a>
<a href="#t2">The addition formula</a><a href="#t3">Everything else</a>
<a href="#t4">Triangles</a><a href="#t5">Waves</a></div>

<h3 id="t0">The unit circle is the definition; the triangle is a special case</h3>
<p>Take the point at angle <span class="mth">θ</span> on the unit circle. Its coordinates <em>are</em> <span class="mth">(cos θ, sin θ)</span>. Drop a perpendicular and you recover the right triangle with its ratios, but the circle came first — and that ordering matters, because a triangle cannot have an angle beyond 90°, or a negative one, or one exceeding a full turn, and the circle handles all three without comment.</p>
<p>The signs in each quadrant then need no mnemonic: they are just the signs of the coordinates.</p>

<h3 id="t1">sin² + cos² = 1 is the circle's equation</h3>
<p>The unit circle is <span class="mth"><i>x</i>² + <i>y</i>² = 1</span>. Substituting the coordinates gives the identity immediately — it is Pythagoras applied to the radius, not a separate fact. Dividing through by <span class="mth">cos²θ</span> gives <span class="mth">1 + tan²θ = sec²θ</span>; dividing by <span class="mth">sin²θ</span> gives <span class="mth">cot²θ + 1 = csc²θ</span>. Three "Pythagorean identities", one identity and two divisions.</p>
<p><span class="mth">tan θ = sin θ/cos θ</span> is the length cut on the line <span class="mth"><i>x</i> = 1</span> — which is what "tangent" literally means. As the radius turns towards vertical that line is met further and further out, and at 90° the two are parallel and never meet. The asymptote is geometry before it is algebra.</p>

<h3 id="t2">The addition formula, from composing rotations</h3>
<p>Rotating by <span class="mth"><i>a</i></span> sends <span class="mth">(1,0) ↦ (cos <i>a</i>, sin <i>a</i>)</span> and <span class="mth">(0,1) ↦ (−sin <i>a</i>, cos <i>a</i>)</span>. Those are the columns of the rotation matrix. Since turning by <span class="mth"><i>a</i></span> and then by <span class="mth"><i>b</i></span> is turning by <span class="mth"><i>a</i>+<i>b</i></span>, multiplying the two matrices and reading off the entries gives</p>
<div class="eqb"><span class="mth">cos(<i>a</i>+<i>b</i>) <span class="op">=</span> cos <i>a</i> cos <i>b</i> <span class="op">−</span> sin <i>a</i> sin <i>b</i><br>
sin(<i>a</i>+<i>b</i>) <span class="op">=</span> sin <i>a</i> cos <i>b</i> <span class="op">+</span> cos <i>a</i> sin <i>b</i></span></div>
<p>Trigonometry and linear algebra meet here, and the complex wing later compresses the same content into <span class="mth"><i>e</i><sup>i(a+b)</sup> = <i>e</i><sup>ia</sup><i>e</i><sup>ib</sup></span> — the rotation matrix written as a single number.</p>

${stThm('Angle addition formulas', {
  hyp:'<span class="mth"><i>a</i>, <i>b</i></span> are any angles',
  then:'',
  eq:'cos(<i>a</i>+<i>b</i>) <span class="op">=</span> cos <i>a</i> cos <i>b</i> <span class="op">−</span> sin <i>a</i> sin <i>b</i><br>sin(<i>a</i>+<i>b</i>) <span class="op">=</span> sin <i>a</i> cos <i>b</i> <span class="op">+</span> cos <i>a</i> sin <i>b</i>',
  proof:`<p>A rotation is determined by where it sends the two basis vectors. Rotating by <span class="mth"><i>a</i></span> sends <span class="mth">(1,0) ↦ (cos <i>a</i>, sin <i>a</i>)</span> and <span class="mth">(0,1) ↦ (−sin <i>a</i>, cos <i>a</i>)</span> — the second is the first turned a further quarter turn. Those images are the columns of</p>
${stEq('<i>R</i>(<i>a</i>) <span class="op">=</span> [ cos <i>a</i> &nbsp; <span class="op">−</span>sin <i>a</i> ; &nbsp; sin <i>a</i> &nbsp; cos <i>a</i> ]')}
<p>Rotating by <span class="mth"><i>a</i></span> and then by <span class="mth"><i>b</i></span> turns the plane by <span class="mth"><i>a</i>+<i>b</i></span>. That is a geometric fact about rotations, and it is the only thing being assumed. In matrices it reads <span class="mth"><i>R</i>(<i>b</i>)<i>R</i>(<i>a</i>) = <i>R</i>(<i>a</i>+<i>b</i>)</span>.</p>
<p>Multiply the left-hand side. Its first column is <span class="mth"><i>R</i>(<i>b</i>)</span> applied to <span class="mth">(cos <i>a</i>, sin <i>a</i>)</span>:</p>
${stEq('( cos <i>b</i> cos <i>a</i> <span class="op">−</span> sin <i>b</i> sin <i>a</i> , &nbsp; sin <i>b</i> cos <i>a</i> <span class="op">+</span> cos <i>b</i> sin <i>a</i> )')}
<p>The right-hand side's first column is <span class="mth">(cos(<i>a</i>+<i>b</i>), sin(<i>a</i>+<i>b</i>))</span>. Equating the two entries gives both formulas at once.</p>
<p>No triangle was drawn and no case analysis was needed, so the result holds for obtuse, negative and reflex angles without amendment — which the classical triangle proof cannot claim.</p>`,
  note:'Setting b = a gives the double-angle formulas; combining those with sin² + cos² = 1 gives power reduction; halving gives the half-angle formulas. A dozen identities from one rotation argument.',
  see:'trig:1.0', seeLabel:'The addition formula, from composing rotations' })}

<h3 id="t3">Only two identities are independent</h3>
<p>Set <span class="mth"><i>b</i> = <i>a</i></span> and the addition formulas become the double-angle formulas. Combine <span class="mth">cos 2<i>a</i> = cos²<i>a</i> − sin²<i>a</i></span> with <span class="mth">sin² + cos² = 1</span> and solve for either square: those are the power-reduction formulas. Halve the angle in them and you have the half-angle formulas. A dozen identities, one rotation argument and two substitutions — which is a far smaller thing to carry than a table.</p>
<p>The power-reduction formula in particular does real work elsewhere: it is how <span class="mth">∫cos²<i>x</i> d<i>x</i></span> is evaluated, why the average power of an AC signal is half the peak, and why light intensity oscillates at twice the frequency of its field.</p>

<h3 id="t4">Triangles</h3>
<p>Drop a perpendicular from one vertex. Pythagoras on the two right triangles it creates gives</p>
<div class="eqb"><span class="mth"><i>a</i>² <span class="op">=</span> <i>b</i>² <span class="op">+</span> <i>c</i>² <span class="op">−</span> 2<i>bc</i> cos <i>A</i></span></div>
<p>the <strong>law of cosines</strong> — Pythagoras plus a correction that vanishes precisely when <span class="mth"><i>A</i> = 90°</span>. The same perpendicular has length <span class="mth"><i>b</i> sin <i>A</i></span> and also <span class="mth"><i>a</i> sin <i>B</i></span>, which gives the <strong>law of sines</strong> in one further line. The common ratio is the diameter of the circumscribed circle, so the law of sines is really a statement about that circle.</p>

${stThm('Law of cosines', {
  hyp:'a triangle with sides <span class="mth"><i>a</i>, <i>b</i>, <i>c</i></span> and <span class="mth"><i>A</i></span> the angle opposite <span class="mth"><i>a</i></span>',
  then:'',
  eq:'<i>a</i>² <span class="op">=</span> <i>b</i>² <span class="op">+</span> <i>c</i>² <span class="op">−</span> 2<i>bc</i> cos <i>A</i>',
  proof:`<p>Vectors make this one line and avoid the case analysis a perpendicular-dropping proof needs for obtuse triangles. Place the vertex <span class="mth"><i>A</i></span> at the origin and let <span class="mth"><b>b</b></span> and <span class="mth"><b>c</b></span> be the two sides leaving it, so the third side is <span class="mth"><b>a</b> = <b>b</b> − <b>c</b></span>.</p>
<p>Take the dot product of that with itself and expand by bilinearity:</p>
${stEq('|<b>a</b>|² <span class="op">=</span> (<b>b</b> <span class="op">−</span> <b>c</b>)<span class="op">·</span>(<b>b</b> <span class="op">−</span> <b>c</b>) <span class="op">=</span> |<b>b</b>|² <span class="op">+</span> |<b>c</b>|² <span class="op">−</span> 2(<b>b</b><span class="op">·</span><b>c</b>)')}
<p>The angle between <span class="mth"><b>b</b></span> and <span class="mth"><b>c</b></span> is <span class="mth"><i>A</i></span>, so <span class="mth"><b>b</b>·<b>c</b> = |<b>b</b>||<b>c</b>| cos <i>A</i> = <i>bc</i> cos <i>A</i></span>. Substituting gives the law.</p>
<p>When <span class="mth"><i>A</i> = 90°</span> the dot product vanishes and the correction term disappears — so Pythagoras is not a separate theorem but the case of this one in which the two sides are orthogonal.</p>`,
  note:'The proof never assumed the triangle was acute, because the dot product carries the sign of the angle by itself: cos A goes negative past 90° and the correction changes sign to match.',
  see:'trig:2.0', seeLabel:'The law of cosines contains Pythagoras' })}

<h3 id="t5">Waves, and the road to phasors</h3>
<p>Unrolling the circle against the angle draws the sine curve: the wave is the circle's shadow. That is why uniform circular motion projected onto a line <em>is</em> simple harmonic motion, and why every oscillation in this laboratory is a circle seen edge-on.</p>
<p>Every sinusoid is <span class="mth"><i>A</i> sin(ω<i>x</i> + φ) + <i>k</i></span>, with period <span class="mth">2π/ω</span> forced by the requirement that the argument advance by <span class="mth">2π</span> per cycle. And adding a sine and a cosine of the <em>same</em> frequency always gives a single shifted sinusoid:</p>
<div class="eqb"><span class="mth"><i>a</i> cos <i>x</i> <span class="op">+</span> <i>b</i> sin <i>x</i> <span class="op">=</span> <i>R</i> cos(<i>x</i> <span class="op">−</span> φ) , &nbsp;&nbsp; <i>R</i> <span class="op">=</span> <span class="rad"><i>a</i>²+<i>b</i>²</span> , &nbsp; tan φ <span class="op">=</span> <i>b</i>/<i>a</i></span></div>
<p>Two numbers in, one amplitude and one phase out. That is exactly what a phasor is, and it is why the circuits wing can replace a differential equation with a complex number. The restriction matters: it works only at a single frequency. Two different frequencies give beats instead, which is the waves wing.</p>
`;
