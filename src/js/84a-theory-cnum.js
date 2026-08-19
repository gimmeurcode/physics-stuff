/* ============================================================================
   THEORY — COMPLEX NUMBERS, ELEMENTARY (Programme C wing C2)
   The prose floor under the third-year complex wing. It stops where domain
   colouring and Cauchy–Riemann begin; everything here is arithmetic, geometry
   and one series.
   ============================================================================ */
const THEORY_CNUM = `
<div class="toc"><a href="#c0">What i is</a><a href="#c1">The plane</a>
<a href="#c2">Multiplication is a rotation</a><a href="#c3">Conjugates and division</a>
<a href="#c4">Euler</a><a href="#c5">Roots</a><a href="#c6">Every polynomial factors</a>
<a href="#c7">Phasors</a></div>

<h3 id="c0">i is a quarter turn, not a square root</h3>
<p>The usual introduction says <span class="mth"><i>i</i> = <span class="rad">−1</span></span>, which makes it sound like a patch applied to a broken equation and leaves a reader with nothing to picture. The honest account runs the other way. Ask instead: <em>is there an operation on the plane which, done twice, reverses direction?</em> Rotation by a quarter turn is one, and it is the obvious one. Call it <span class="mth"><i>i</i></span>. Then <span class="mth"><i>i</i>² = −1</span> is not a definition to swallow but the observation that two quarter turns face you backwards.</p>
<p>Everything the rest of this laboratory does with complex numbers uses the rotation and never the square root. A wavefunction's phase, an alternating current's lead or lag, a Fourier coefficient — each is an angle, and the reason complex numbers turn up in all three is that they are the arithmetic of angles.</p>
<p>The construction is also legitimate in the strictest sense: a complex number can be <em>defined</em> as a pair <span class="mth">(<i>a</i>, <i>b</i>)</span> of real numbers with the multiplication rule below, and then nothing has been assumed into existence at all. The symbol <span class="mth"><i>i</i></span> is shorthand for <span class="mth">(0, 1)</span>.</p>

${stDefn('The complex numbers', `
<p>ℂ is the set of pairs <span class="mth">(<i>a</i>, <i>b</i>)</span> of real numbers with</p>
${stEq('(<i>a</i>, <i>b</i>) <span class="op">+</span> (<i>c</i>, <i>d</i>) <span class="op">=</span> (<i>a</i><span class="op">+</span><i>c</i>, <i>b</i><span class="op">+</span><i>d</i>)<br>(<i>a</i>, <i>b</i>) <span class="op">·</span> (<i>c</i>, <i>d</i>) <span class="op">=</span> (<i>ac</i> <span class="op">−</span> <i>bd</i>, <i>ad</i> <span class="op">+</span> <i>bc</i>)')}
<p>Writing <span class="mth"><i>a</i> + <i>bi</i></span> for <span class="mth">(<i>a</i>, <i>b</i>)</span>, the multiplication rule is what you get by expanding brackets and using <span class="mth"><i>i</i>² = −1</span>.</p>`,
  { note:'No square root of a negative number is postulated anywhere. The pairs and the rule come first; <span class="mth"><i>i</i>² = −1</span> is a consequence of the rule.',
    see:'cnum:0.1', seeLabel:'Multiplying by i, drawn' })}

<h3 id="c1">The plane, and the one operation that is not new</h3>
<p>Addition of complex numbers is addition of coordinates, so as far as addition is concerned a complex number is a vector in the plane and nothing has been gained. The parallelogram is the same parallelogram. It is worth being clear about this, because it isolates what <em>is</em> new: ℝ² has no useful multiplication, and ℂ does.</p>
<p>Two pieces of vocabulary. The <em>modulus</em> <span class="mth">|<i>z</i>|</span> is the distance from the origin, <span class="mth"><span class="rad"><i>a</i>²+<i>b</i>²</span></span>. The <em>argument</em> <span class="mth">arg <i>z</i></span> is the angle from the positive real axis — and it is only defined up to a whole number of turns, which looks like a nuisance and turns out to be the entire content of the section on roots below.</p>

<h3 id="c2">Multiplication multiplies lengths and adds angles</h3>
<p>Write both numbers in modulus–argument form and multiply:</p>
<div class="eqb"><span class="mth"><i>r</i>₁(cos θ₁ <span class="op">+</span> <i>i</i> sin θ₁) <span class="op">·</span> <i>r</i>₂(cos θ₂ <span class="op">+</span> <i>i</i> sin θ₂) <span class="op">=</span> <i>r</i>₁<i>r</i>₂[cos(θ₁<span class="op">+</span>θ₂) <span class="op">+</span> <i>i</i> sin(θ₁<span class="op">+</span>θ₂)]</span></div>
<p>The step from left to right is exactly the two angle-addition formulas from the trigonometry wing, used once each. So the rotation-matrix argument that produced those formulas and this rule are the same argument, and a complex number is a rotation-and-scaling of the plane written as a single number.</p>

${stThm('Moduli multiply, arguments add', {
  hyp:'<span class="mth"><i>z</i>₁, <i>z</i>₂ ∈ ℂ</span>',
  then:'',
  eq:'|<i>z</i>₁<i>z</i>₂| <span class="op">=</span> |<i>z</i>₁||<i>z</i>₂| , &nbsp;&nbsp; arg(<i>z</i>₁<i>z</i>₂) <span class="op">=</span> arg <i>z</i>₁ <span class="op">+</span> arg <i>z</i>₂ &nbsp; (mod 2π)',
  proof:`<p>Expand the product of the two modulus–argument forms. The real part is <span class="mth"><i>r</i>₁<i>r</i>₂(cos θ₁ cos θ₂ − sin θ₁ sin θ₂)</span> and the imaginary part is <span class="mth"><i>r</i>₁<i>r</i>₂(sin θ₁ cos θ₂ + cos θ₁ sin θ₂)</span>. By the addition formulas those brackets are <span class="mth">cos(θ₁+θ₂)</span> and <span class="mth">sin(θ₁+θ₂)</span>, giving the stated form.</p>
<p>Reading the modulus off that form gives <span class="mth"><i>r</i>₁<i>r</i>₂</span> and reading the argument gives <span class="mth">θ₁+θ₂</span>. The "mod 2π" is not a weakening: <span class="mth">arg</span> was never a function to ℝ in the first place, only to ℝ modulo <span class="mth">2π</span>, and the equation is exact in that group.</p>`,
  note:'The stage computes the product both ways — from the four real products, and by multiplying moduli and adding arguments — and prints the difference, which sits at round-off for every pair.',
  see:'cnum:0.2', seeLabel:'Stretch and turn, both halves measured' })}

<h3 id="c3">The conjugate, and why division works</h3>
<p>The <em>conjugate</em> <span class="mth"><span style="text-decoration:overline"><i>z</i></span> = <i>a</i> − <i>bi</i></span> is the reflection in the real axis. Its one indispensable property is</p>
<div class="eqb"><span class="mth"><i>z</i><span style="text-decoration:overline"><i>z</i></span> <span class="op">=</span> <i>a</i>² <span class="op">+</span> <i>b</i>² <span class="op">=</span> |<i>z</i>|² , &nbsp;&nbsp; which is real and non-negative</span></div>
<p>That single fact is what makes ℂ a field: to divide by <span class="mth"><i>w</i></span>, multiply top and bottom by <span class="mth"><span style="text-decoration:overline"><i>w</i></span></span> and the bottom becomes the real number <span class="mth">|<i>w</i>|²</span>, which you already know how to divide by. Every non-zero complex number has an inverse, and the construction is a one-liner rather than an existence theorem.</p>
<p>Conjugation also respects the arithmetic — <span class="mth"><span style="text-decoration:overline"><i>z</i>+<i>w</i></span> = <span style="text-decoration:overline"><i>z</i></span>+<span style="text-decoration:overline"><i>w</i></span></span> and the same for products — which is the fact the conjugate-root theorem below is built on.</p>

<h3 id="c4">Euler's formula is a rearrangement, not a discovery</h3>
<p>What could <span class="mth"><i>e</i><sup>iθ</sup></span> mean? Not repeated multiplication: "multiply <span class="mth"><i>e</i></span> by itself <span class="mth"><i>i</i></span> times" is not a sentence. The exponential of a complex number has exactly one sensible definition, its power series, which converges for every complex argument. Put <span class="mth"><i>z</i> = <i>i</i>θ</span> into it and use the fact that the powers of <span class="mth"><i>i</i></span> cycle <span class="mth">1, <i>i</i>, −1, −<i>i</i></span>. The terms sort themselves into a real family and an imaginary one, and each is a series you have already met.</p>

${stThm('Euler’s formula', {
  hyp:'<span class="mth">θ ∈ ℝ</span>',
  then:'',
  eq:'<i>e</i><sup>iθ</sup> <span class="op">=</span> cos θ <span class="op">+</span> <i>i</i> sin θ',
  proof:`<p>Take the exponential series as the definition, which for a complex argument is the only one available:</p>
${stEq('<i>e</i><sup><i>z</i></sup> <span class="op">=</span> 1 <span class="op">+</span> <i>z</i> <span class="op">+</span> <i>z</i>²/2! <span class="op">+</span> <i>z</i>³/3! <span class="op">+</span> …')}
<p>It converges absolutely for every <span class="mth"><i>z</i> ∈ ℂ</span>, so its terms may be reordered freely — which is what the next step does and what makes it legitimate.</p>
<p>Substitute <span class="mth"><i>z</i> = <i>i</i>θ</span>. Since <span class="mth"><i>i</i>⁰ = 1</span>, <span class="mth"><i>i</i>¹ = <i>i</i></span>, <span class="mth"><i>i</i>² = −1</span>, <span class="mth"><i>i</i>³ = −<i>i</i></span> and then the cycle repeats, the even-numbered terms are real with alternating signs and the odd-numbered ones are <span class="mth"><i>i</i></span> times a real number with alternating signs. Collecting them:</p>
${stEq('(1 <span class="op">−</span> θ²/2! <span class="op">+</span> θ⁴/4! <span class="op">−</span> …) <span class="op">+</span> <i>i</i>(θ <span class="op">−</span> θ³/3! <span class="op">+</span> θ⁵/5! <span class="op">−</span> …)')}
<p>Those two series are the Taylor series of <span class="mth">cos θ</span> and <span class="mth">sin θ</span>, established in the series wing. Hence the identity.</p>
<p>Two consequences fall out immediately. Setting <span class="mth">θ = π</span> gives <span class="mth"><i>e</i><sup>iπ</sup> + 1 = 0</span>. And <span class="mth">|<i>e</i><sup>iθ</sup>|² = cos²θ + sin²θ = 1</span>, so the whole imaginary axis is wrapped onto the unit circle — an infinite line onto a curve of length 2π, which is exactly why the argument is many-valued.</p>`,
  note:'The stage sums the series term by term and never calls an exponential function. It could not: the library exponential of a complex number is <em>implemented</em> as e^x(cos y + i sin y), so checking against it would compare the formula with itself.',
  see:'cnum:1.1', seeLabel:'Euler’s formula, summed rather than quoted' })}

<p>With Euler's formula the multiplication rule becomes a single line — <span class="mth"><i>r</i>₁<i>e</i><sup>iθ₁</sup> · <i>r</i>₂<i>e</i><sup>iθ₂</sup> = <i>r</i>₁<i>r</i>₂<i>e</i><sup>i(θ₁+θ₂)</sup></span> — and de Moivre's theorem is the case where the two numbers are equal, repeated: <span class="mth">(<i>re</i><sup>iθ</sup>)<sup><i>n</i></sup> = <i>r</i><sup><i>n</i></sup><i>e</i><sup>i<i>n</i>θ</sup></span>.</p>

<h3 id="c5">Every non-zero number has exactly n n-th roots</h3>
<p>Here the many-valuedness of the argument stops being a nuisance and does the work. To take an <span class="mth"><i>n</i></span>-th root, take the <span class="mth"><i>n</i></span>-th root of the modulus and divide the argument by <span class="mth"><i>n</i></span>. But the argument was only ever defined up to <span class="mth">2π<i>k</i></span>, and dividing that ambiguity by <span class="mth"><i>n</i></span> leaves <span class="mth">2π<i>k</i>/<i>n</i></span> — which takes <span class="mth"><i>n</i></span> genuinely different values before it starts repeating.</p>

${stThm('The n-th roots of a complex number', {
  hyp:'<span class="mth"><i>z</i> ≠ 0</span> and <span class="mth"><i>n</i> ≥ 1</span> a whole number',
  then:'<span class="mth"><i>z</i></span> has exactly <span class="mth"><i>n</i></span> distinct <span class="mth"><i>n</i></span>-th roots, all of modulus <span class="mth">|<i>z</i>|<sup>1/<i>n</i></sup></span>, at equal angles',
  eq:'<i>w</i><sub><i>k</i></sub> <span class="op">=</span> |<i>z</i>|<sup>1/<i>n</i></sup> <i>e</i><sup>i(θ <span class="op">+</span> 2π<i>k</i>)/<i>n</i></sup> , &nbsp;&nbsp; <i>k</i> <span class="op">=</span> 0, 1, …, <i>n</i><span class="op">−</span>1',
  proof:`<p>Write <span class="mth"><i>z</i> = <i>re</i><sup>iθ</sup></span> with <span class="mth"><i>r</i> &gt; 0</span>. Each <span class="mth"><i>w</i><sub><i>k</i></sub></span> above satisfies <span class="mth"><i>w</i><sub><i>k</i></sub><sup><i>n</i></sup> = <i>re</i><sup>i(θ+2π<i>k</i>)</sup> = <i>re</i><sup>iθ</sup> = <i>z</i></span>, because <span class="mth"><i>e</i><sup>2πi<i>k</i></sup> = 1</span> for whole <span class="mth"><i>k</i></span>. So all <span class="mth"><i>n</i></span> are roots.</p>
<p>They are distinct: their arguments differ by multiples of <span class="mth">2π/<i>n</i></span>, and for <span class="mth">0 ≤ <i>k</i> &lt; <i>n</i></span> those multiples are less than a full turn apart, so no two coincide.</p>
<p>There are no others. If <span class="mth"><i>w</i><sup><i>n</i></sup> = <i>z</i></span> then taking moduli gives <span class="mth">|<i>w</i>|<sup><i>n</i></sup> = <i>r</i></span>, and since both are positive reals <span class="mth">|<i>w</i>| = <i>r</i><sup>1/<i>n</i></sup></span> is forced. Taking arguments gives <span class="mth"><i>n</i> arg <i>w</i> ≡ θ</span> (mod <span class="mth">2π</span>), so <span class="mth">arg <i>w</i> = (θ + 2π<i>k</i>)/<i>n</i></span> for some whole <span class="mth"><i>k</i></span>, and <span class="mth"><i>k</i></span> and <span class="mth"><i>k</i>+<i>n</i></span> give the same angle. Hence <span class="mth"><i>w</i></span> is one of the <span class="mth"><i>n</i></span> listed.</p>
<p>Finally, <span class="mth"><i>k</i> ↦ <i>w</i><sub><i>k</i></sub></span> steps the angle by <span class="mth">2π/<i>n</i></span> each time at fixed modulus, so the roots are the vertices of a regular <span class="mth"><i>n</i></span>-gon inscribed in the circle of radius <span class="mth">|<i>z</i>|<sup>1/<i>n</i></sup></span>.</p>`,
  note:'For n > 1 the roots sum to zero — the centroid of a regular polygon centred on the origin. The same fact reappears below as Vieta’s formula for zⁿ − a, whose zⁿ⁻¹ coefficient is 0.',
  see:'cnum:1.3', seeLabel:'The n-th roots as a regular polygon' })}

<h3 id="c6">Every polynomial factors completely — and only over ℂ</h3>
<p>This is the theorem that justifies the whole construction. Over ℝ the number of roots of a polynomial depends on the polynomial: <span class="mth"><i>x</i>²−1</span> has two, <span class="mth"><i>x</i>²</span> has one, <span class="mth"><i>x</i>²+1</span> has none. Over ℂ a polynomial of degree <span class="mth"><i>n</i></span> has exactly <span class="mth"><i>n</i></span> roots, counted with multiplicity, always. The case analysis disappears.</p>

${stThm('The fundamental theorem of algebra', {
  hyp:'<span class="mth"><i>p</i></span> is a polynomial of degree <span class="mth"><i>n</i> ≥ 1</span> with complex coefficients',
  then:'<span class="mth"><i>p</i></span> has a root in ℂ; hence, by induction, it factors as <span class="mth"><i>c</i>(<i>z</i>−<i>r</i>₁)…(<i>z</i>−<i>r<sub>n</sub></i>)</span>',
  eq:'',
  because:'The theorem is about ℂ but every proof of it is analytic rather than algebraic — the shortest uses Liouville’s theorem from the complex-analysis wing, and the most elementary is a compactness argument (the minimum of |p| is attained, and cannot be non-zero). Neither belongs on this floor. What <em>does</em> belong here is checking it: the stage finds the roots numerically, verifies each satisfies the equation, and then multiplies the factors back out and compares with the coefficients — a route that never evaluates the polynomial.',
  see:'cnum:2.0', seeLabel:'The theorem, checked on z³ − 1' })}

<p>Two consequences are worth stating separately. First, Vieta's formulas: multiplying out <span class="mth"><i>c</i>(<i>z</i>−<i>r</i>₁)…(<i>z</i>−<i>r<sub>n</sub></i>)</span> and comparing coefficients gives <span class="mth">∑<i>r<sub>k</sub></i> = −<i>c</i>₁/<i>c</i>₀</span> and <span class="mth">∏<i>r<sub>k</sub></i> = (−1)<sup><i>n</i></sup><i>c<sub>n</sub></i>/<i>c</i>₀</span> — the sum and product of the roots readable straight off the polynomial without finding any of them.</p>

${stThm('Non-real roots of a real polynomial come in conjugate pairs', {
  hyp:'every coefficient of <span class="mth"><i>p</i></span> is real, and <span class="mth"><i>p</i>(<i>z</i>) = 0</span>',
  then:'<span class="mth"><i>p</i>(<span style="text-decoration:overline"><i>z</i></span>) = 0</span> as well',
  eq:'',
  proof:`<p>Conjugation commutes with sums and products, so for any polynomial <span class="mth"><i>p</i>(<i>z</i>) = ∑<i>c<sub>k</sub>z</i><sup><i>k</i></sup></span>,</p>
${stEq('<span style="text-decoration:overline"><i>p</i>(<i>z</i>)</span> <span class="op">=</span> ∑ <span style="text-decoration:overline"><i>c<sub>k</sub></i></span> <span style="text-decoration:overline"><i>z</i></span><sup><i>k</i></sup>')}
<p>If every <span class="mth"><i>c<sub>k</sub></i></span> is real then <span class="mth"><span style="text-decoration:overline"><i>c<sub>k</sub></i></span> = <i>c<sub>k</sub></i></span>, so the right-hand side is <span class="mth"><i>p</i>(<span style="text-decoration:overline"><i>z</i></span>)</span>. Therefore <span class="mth"><i>p</i>(<span style="text-decoration:overline"><i>z</i></span>) = <span style="text-decoration:overline"><i>p</i>(<i>z</i>)</span> = <span style="text-decoration:overline">0</span> = 0</span>.</p>
<p>The hypothesis is doing real work: with complex coefficients the conclusion is false, and the stage carries a preset with complex coefficients precisely so that the panel can decline to claim it.</p>`,
  note:'This is why a real polynomial of odd degree always has at least one real root: the non-real roots are used up in pairs and cannot account for an odd total.',
  see:'cnum:2.1', seeLabel:'A quadratic with no real root has two complex ones' })}

<p>One practical caveat, which the stage measures rather than hides. A root of multiplicity <span class="mth"><i>m</i></span> cannot be located to full precision by <em>any</em> method: near it <span class="mth"><i>p</i></span> behaves like <span class="mth">(<i>z</i>−<i>r</i>)<sup><i>m</i></sup></span>, so a perturbation of size <span class="mth">ε</span> in the coefficients moves the root by <span class="mth">ε<sup>1/<i>m</i></sup></span>. At <span class="mth"><i>m</i> = 2</span> in double precision that is about <span class="mth">1.5×10⁻⁸</span>. It is a property of the problem, not of the algorithm.</p>

<h3 id="c7">Phasors: why this is the language of oscillation</h3>
<p>Write a sinusoid as <span class="mth"><i>A</i>cos(ω<i>t</i>+φ) = Re[<i>Ae</i><sup>iφ</sup>·<i>e</i><sup>iω<i>t</i></sup>]</span>. The constant <span class="mth"><i>Ae</i><sup>iφ</sup></span> is the <em>phasor</em>; the <span class="mth"><i>e</i><sup>iω<i>t</i></sup></span> is common to every wave at that frequency. Adding several waves therefore factors:</p>
<div class="eqb"><span class="mth">∑<i>A<sub>k</sub></i>cos(ω<i>t</i><span class="op">+</span>φ<sub><i>k</i></sub>) <span class="op">=</span> Re[(∑<i>A<sub>k</sub>e</i><sup>iφ<sub><i>k</i></sub></sup>) <i>e</i><sup>iω<i>t</i></sup>]</span></div>
<p>The time dependence never enters the sum. A page of trigonometric identity is replaced by adding a few arrows nose to tail, and the amplitude and phase of the result are the modulus and argument of one complex number.</p>
<p>The hypothesis is that every wave has the <em>same</em> ω, and it is not a technicality: with two frequencies the common factor cannot be taken out, the sum is genuinely not a sinusoid, and what you get instead is beats. Within its hypothesis this substitution runs alternating-current analysis, optical interference, the structure factor of a crystal and the Fourier coefficient — the same triangle with different labels on the arrows.</p>
<p>Where this wing stops, the complex-analysis wing begins: functions of a complex variable, differentiability in the complex sense, and the theory of contour integration that follows from it.</p>
`;
