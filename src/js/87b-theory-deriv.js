const THEORY_DERIV = `
<div class="toc"><a href="#e1">The definition</a><a href="#e2">The rules</a><a href="#e3">Chain &amp; implicit</a>
<a href="#e4">Linearisation</a><a href="#e5">Curve analysis</a><a href="#e6">Optimisation</a>
<a href="#e7">Related rates</a><a href="#e8">Newton &amp; L'Hôpital</a></div>

<h3 id="e1">The derivative is a limit of secants</h3>
<div class="eqb"><span class="mth"><i>f</i>′(<i>a</i>) = lim<sub><i>h</i>→0</sub> <span class="frac"><span class="nm"><i>f</i>(<i>a</i>+<i>h</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>h</i></span></span></span></div>
<p>The quotient is the slope of a secant; the limit is the slope of the tangent, when it exists. The lab plots the forward, backward and symmetric quotients converging together — the symmetric one has error <span class="mth"><i>O</i>(<i>h</i>²)</span> rather than <span class="mth"><i>O</i>(<i>h</i>)</span>, and is exact for a parabola at every h.</p>
<p><strong>Differentiability implies continuity, and not conversely.</strong> <span class="mth">|<i>x</i>|</span> at 0 is the standard witness: continuous, with one-sided derivatives −1 and +1, and no derivative at all. Weierstrass then produced a function continuous <em>everywhere</em> and differentiable <em>nowhere</em>, which ended the assumption that continuity was nearly enough.</p>

${stDefn('The derivative', `
<p><span class="mth"><i>f</i></span> is <strong>differentiable at <i>a</i></strong> when the limit</p>
${stEq('<i>f</i>′(<i>a</i>) <span class="op">=</span> lim<sub><i>h</i>→0</sub> <span class="frac"><span class="nm"><i>f</i>(<i>a</i>+<i>h</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>h</i></span></span>')}
<p>exists and is finite. The quotient is the slope of the secant through <span class="mth">(<i>a</i>, <i>f</i>(<i>a</i>))</span> and <span class="mth">(<i>a</i>+<i>h</i>, <i>f</i>(<i>a</i>+<i>h</i>))</span>; the limit, when it exists, is the slope of the tangent.</p>`,
{ note:'"Finite" is part of the definition, not a technicality. The cube root at 0 has a vertical tangent — the quotient runs away — and is not differentiable there, which is why the lab reports "vertical tangent — no slope" rather than a number.',
  see:'deriv:0.0', seeLabel:'Watch the secants collapse onto the tangent' })}

${stThm('Differentiable ⟹ continuous', {
  hyp:'<span class="mth"><i>f</i></span> is differentiable at <span class="mth"><i>a</i></span>',
  then:'<span class="mth"><i>f</i></span> is continuous at <span class="mth"><i>a</i></span>',
  proof:`<p>We must show <span class="mth"><i>f</i>(<i>a</i>+<i>h</i>) → <i>f</i>(<i>a</i>)</span> as <span class="mth"><i>h</i> → 0</span>. For <span class="mth"><i>h</i> ≠ 0</span> write the increment so that the difference quotient appears:</p>
${stEq('<i>f</i>(<i>a</i>+<i>h</i>) <span class="op">−</span> <i>f</i>(<i>a</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i>(<i>a</i>+<i>h</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>h</i></span></span> <span class="op">·</span> <i>h</i>')}
<p>As <span class="mth"><i>h</i> → 0</span> the first factor tends to <span class="mth"><i>f</i>′(<i>a</i>)</span> by hypothesis, and the second tends to 0. A product of two convergent factors converges to the product of the limits, so the right-hand side tends to <span class="mth"><i>f</i>′(<i>a</i>) · 0 = 0</span>. Hence <span class="mth"><i>f</i>(<i>a</i>+<i>h</i>) → <i>f</i>(<i>a</i>)</span>, which is continuity at <span class="mth"><i>a</i></span>.</p>
<p>Finiteness of <span class="mth"><i>f</i>′(<i>a</i>)</span> is exactly what makes that product zero. Where the tangent is vertical the first factor blows up while the second vanishes, and nothing forces the limit either way.</p>`,
  note:'The converse fails badly, not marginally: |x| fails at one point, and the Weierstrass function is continuous everywhere and differentiable nowhere.' })}

<h3 id="e2">The rules, and where they come from</h3>
<p>Each follows from the definition by algebra on the difference quotient.</p>
<ul>
  <li><strong>Power:</strong> <span class="mth">(<i>x</i><sup><i>n</i></sup>)′ = <i>nx</i><sup><i>n</i>−1</sup></span> — the binomial theorem, with every term past the first carrying a surviving h.</li>
  <li><strong>Product:</strong> <span class="mth">(<i>uv</i>)′ = <i>u</i>′<i>v</i> + <i>uv</i>′</span> — add and subtract <span class="mth"><i>u</i>(<i>x</i>+<i>h</i>)<i>v</i>(<i>x</i>)</span>. It is <em>not</em> <span class="mth"><i>u</i>′<i>v</i>′</span>, and the rectangle picture shows why: growing both sides adds two strips, not one.</li>
  <li><strong>Quotient:</strong> the product rule applied to <span class="mth"><i>u</i>·(1/<i>v</i>)</span>.</li>
  <li><strong>Exponential:</strong> <span class="mth"><i>e</i></span> is <em>defined</em> as the base for which the derivative of <span class="mth"><i>b</i><sup><i>x</i></sup></span> is itself.</li>
  <li><strong>Trigonometric:</strong> all of them rest on <span class="mth">sin <i>h</i>/<i>h</i> → 1</span>, which is the squeeze theorem.</li>
</ul>
${stThm('Product rule', {
  hyp:'<span class="mth"><i>u</i></span> and <span class="mth"><i>v</i></span> are differentiable at <span class="mth"><i>x</i></span>',
  then:'so is <span class="mth"><i>uv</i></span>, and',
  eq:'(<i>uv</i>)′(<i>x</i>) <span class="op">=</span> <i>u</i>′(<i>x</i>)<i>v</i>(<i>x</i>) <span class="op">+</span> <i>u</i>(<i>x</i>)<i>v</i>′(<i>x</i>)',
  proof:`<p>Start from the definition and add and subtract the single term <span class="mth"><i>u</i>(<i>x</i>+<i>h</i>)<i>v</i>(<i>x</i>)</span> — the one move the whole proof turns on:</p>
${stEq('<span class="frac"><span class="nm"><i>u</i>(<i>x</i>+<i>h</i>)<i>v</i>(<i>x</i>+<i>h</i>) − <i>u</i>(<i>x</i>)<i>v</i>(<i>x</i>)</span><span class="den"><i>h</i></span></span>')}
<p>becomes, after inserting <span class="mth">− <i>u</i>(<i>x</i>+<i>h</i>)<i>v</i>(<i>x</i>) + <i>u</i>(<i>x</i>+<i>h</i>)<i>v</i>(<i>x</i>)</span> in the numerator and grouping,</p>
${stEq('<i>u</i>(<i>x</i>+<i>h</i>) <span class="op">·</span> <span class="frac"><span class="nm"><i>v</i>(<i>x</i>+<i>h</i>) − <i>v</i>(<i>x</i>)</span><span class="den"><i>h</i></span></span> <span class="op">+</span> <i>v</i>(<i>x</i>) <span class="op">·</span> <span class="frac"><span class="nm"><i>u</i>(<i>x</i>+<i>h</i>) − <i>u</i>(<i>x</i>)</span><span class="den"><i>h</i></span></span>')}
<p>Now let <span class="mth"><i>h</i> → 0</span>. The two quotients tend to <span class="mth"><i>v</i>′(<i>x</i>)</span> and <span class="mth"><i>u</i>′(<i>x</i>)</span> by hypothesis. The stray factor <span class="mth"><i>u</i>(<i>x</i>+<i>h</i>)</span> tends to <span class="mth"><i>u</i>(<i>x</i>)</span> — <em>because <i>u</i> is continuous at <i>x</i></em>, which we know only because it is differentiable there. That is where the previous theorem is spent.</p>
<p>Collecting the limits gives <span class="mth"><i>u</i>(<i>x</i>)<i>v</i>′(<i>x</i>) + <i>v</i>(<i>x</i>)<i>u</i>′(<i>x</i>)</span>.</p>`,
  note:'The rectangle picture is the same algebra: growing a u-by-v rectangle on both sides adds two strips, u·Δv and v·Δu, plus a corner Δu·Δv that is second order and dies in the limit. That vanishing corner is why the answer is not u′v′.' })}

${stThm('Chain rule', {
  hyp:'<span class="mth"><i>g</i></span> is differentiable at <span class="mth"><i>x</i></span> and <span class="mth"><i>f</i></span> is differentiable at <span class="mth"><i>g</i>(<i>x</i>)</span>',
  then:'<span class="mth"><i>f</i>∘<i>g</i></span> is differentiable at <span class="mth"><i>x</i></span>, and',
  eq:'(<i>f</i>∘<i>g</i>)′(<i>x</i>) <span class="op">=</span> <i>f</i>′(<i>g</i>(<i>x</i>)) <span class="op">·</span> <i>g</i>′(<i>x</i>)',
  proof:`<p>The tempting proof multiplies and divides by <span class="mth"><i>g</i>(<i>x</i>+<i>h</i>) − <i>g</i>(<i>x</i>)</span>, and it is <strong>wrong</strong>: that quantity can be zero for arbitrarily small <span class="mth"><i>h</i></span>, as it is for <span class="mth"><i>g</i>(<i>x</i>) = <i>x</i>² sin(1/<i>x</i>)</span> near 0. Dividing by it is then illegal infinitely often.</p>
<p>The repair is to package the error instead. Differentiability of <span class="mth"><i>f</i></span> at <span class="mth"><i>b</i> = <i>g</i>(<i>x</i>)</span> says exactly that</p>
${stEq('<i>f</i>(<i>b</i>+<i>k</i>) <span class="op">−</span> <i>f</i>(<i>b</i>) <span class="op">=</span> [ <i>f</i>′(<i>b</i>) <span class="op">+</span> ε(<i>k</i>) ] <i>k</i>')}
<p>where <span class="mth">ε(<i>k</i>) → 0</span> as <span class="mth"><i>k</i> → 0</span>, and we <em>define</em> <span class="mth">ε(0) = 0</span> so the identity holds at <span class="mth"><i>k</i> = 0</span> too — both sides are then 0. This is the step that removes the division.</p>
<p>Put <span class="mth"><i>k</i> = <i>k</i>(<i>h</i>) = <i>g</i>(<i>x</i>+<i>h</i>) − <i>g</i>(<i>x</i>)</span>. Then</p>
${stEq('<span class="frac"><span class="nm"><i>f</i>(<i>g</i>(<i>x</i>+<i>h</i>)) − <i>f</i>(<i>g</i>(<i>x</i>))</span><span class="den"><i>h</i></span></span> <span class="op">=</span> [ <i>f</i>′(<i>b</i>) <span class="op">+</span> ε(<i>k</i>(<i>h</i>)) ] <span class="op">·</span> <span class="frac"><span class="nm"><i>k</i>(<i>h</i>)</span><span class="den"><i>h</i></span></span>')}
<p>valid for every <span class="mth"><i>h</i> ≠ 0</span>, including those where <span class="mth"><i>k</i>(<i>h</i>) = 0</span>. As <span class="mth"><i>h</i> → 0</span>: <span class="mth"><i>k</i>(<i>h</i>) → 0</span> since <span class="mth"><i>g</i></span> is continuous, so <span class="mth">ε(<i>k</i>(<i>h</i>)) → 0</span>; and <span class="mth"><i>k</i>(<i>h</i>)/<i>h</i> → <i>g</i>′(<i>x</i>)</span>. The product tends to <span class="mth"><i>f</i>′(<i>g</i>(<i>x</i>))<i>g</i>′(<i>x</i>)</span>.</p>`,
  note:'Rates multiply. If y changes three times as fast as u, and u twice as fast as x, then y changes six times as fast as x — every "differentiate the outside, then the inside" instruction is this.' })}

<p>Every derivative shown anywhere in this lab is produced by a <strong>symbolic differentiator</strong> applying these rules to the parse tree, then evaluated — never by a finite difference standing in for one.</p>

<h3 id="e3">The chain rule and implicit differentiation</h3>
<div class="eqb"><span class="mth">(<i>f</i>∘<i>g</i>)′(<i>x</i>) = <i>f</i>′(<i>g</i>(<i>x</i>))·<i>g</i>′(<i>x</i>)</span></div>
<p>Rates multiply: if y changes three times as fast as u and u twice as fast as x, then y changes six times as fast as x. Every "differentiate the outside, then the inside" instruction is this.</p>
<p>For a curve given implicitly by <span class="mth"><i>F</i>(<i>x</i>,<i>y</i>) = 0</span>, differentiate both sides and solve: <span class="mth"><i>dy</i>/<i>dx</i> = −<i>F</i><sub><i>x</i></sub>/<i>F</i><sub><i>y</i></sub></span>. No solving for y is needed, and for the folium <span class="mth"><i>x</i>³+<i>y</i>³ = 3<i>axy</i></span> no elementary solution exists. The implicit function theorem is the fine print: y is a function of x near the point exactly when <span class="mth"><i>F</i><sub><i>y</i></sub> ≠ 0</span> — precisely when the formula does not divide by zero.</p>

<h3 id="e4">Linearisation and differentials</h3>
<p><span class="mth"><i>L</i>(<i>x</i>) = <i>f</i>(<i>a</i>) + <i>f</i>′(<i>a</i>)(<i>x</i>−<i>a</i>)</span>, with error <span class="mth"><i>O</i>(<i>h</i>²)</span> — halve the step and the error quarters, which the lab measures. This is the first Taylor polynomial, and it is what every engineering approximation of the form "for small x" is doing.</p>

<h3 id="e5">Reading a curve from its derivatives</h3>
<p><span class="mth"><i>f</i>′ &gt; 0</span> means increasing (by the MVT). <span class="mth"><i>f</i>″ &gt; 0</span> means concave up. A <strong>critical point</strong> has <span class="mth"><i>f</i>′ = 0</span> or undefined; the second-derivative test classifies it when <span class="mth"><i>f</i>″ ≠ 0</span> and says nothing when it vanishes.</p>
<p class="note">An <strong>inflection</strong> requires <span class="mth"><i>f</i>″</span> to <em>change sign</em>, not merely to vanish. <span class="mth"><i>x</i>⁴</span> has <span class="mth"><i>f</i>″ = 12<i>x</i>²</span>, zero at the origin and never negative — no inflection. The lab's search rejects it for exactly that reason, which a "set the second derivative to zero" recipe would not.</p>

${stThm("Fermat's theorem — interior extrema are critical", {
  hyp:'<span class="mth"><i>f</i></span> has a local maximum or minimum at an <strong>interior</strong> point <span class="mth"><i>c</i></span> of its domain, and <span class="mth"><i>f</i>′(<i>c</i>)</span> exists',
  then:'<span class="mth"><i>f</i>′(<i>c</i>) = 0</span>',
  proof:`<p>Suppose <span class="mth"><i>c</i></span> is a local maximum, so <span class="mth"><i>f</i>(<i>c</i>+<i>h</i>) ≤ <i>f</i>(<i>c</i>)</span> for all small <span class="mth">|<i>h</i>|</span>. The numerator <span class="mth"><i>f</i>(<i>c</i>+<i>h</i>) − <i>f</i>(<i>c</i>)</span> is therefore ≤ 0 whichever side we approach from; only the sign of the denominator changes.</p>
<p>Approaching from the right, <span class="mth"><i>h</i> &gt; 0</span>, the quotient is ≤ 0, so its limit satisfies <span class="mth"><i>f</i>′(<i>c</i>) ≤ 0</span>. Approaching from the left, <span class="mth"><i>h</i> &lt; 0</span>, the quotient is ≥ 0, so <span class="mth"><i>f</i>′(<i>c</i>) ≥ 0</span>. The derivative exists, so the two one-sided limits are the same number, and a number that is both ≤ 0 and ≥ 0 is 0.</p>
<p>A local minimum is the same argument on <span class="mth">−<i>f</i></span>. Both hypotheses were used: <em>interior</em>, so that both sides are available, and <em>differentiable</em>, so that the two one-sided limits must agree.</p>`,
  note:'The converse is false — f′(0) = 0 for x³, which has no extremum there. This is why critical points are called candidates rather than answers, and why endpoints must be tested separately: at an endpoint one side is missing and the argument collapses.',
  see:'deriv:0.1', seeLabel:'Read a curve from its derivatives' })}

<h3 id="e6">Optimisation</h3>
<p>Three steps, always: express the quantity in one variable using the constraint; find the critical points on the <strong>feasible interval</strong>; compare values, <em>including the endpoints</em>. The endpoints are not a formality — in the box problem they are where the volume is zero, and in many real problems they are the answer.</p>

<h3 id="e7">Related rates</h3>
<p>Differentiate a geometric constraint with respect to <span class="mth"><i>t</i></span> and every changing length contributes its own rate. The lab draws each scenario live and computes the answer both analytically and by finite difference on the constraint.</p>
<p class="note">Watch the sliding ladder as it flattens: the top's speed runs to infinity. That is the honest mathematics of a rigid rod whose foot is driven at constant speed — and a clear signal that the model has stopped describing any real ladder. Knowing when a model breaks is part of using it.</p>

<h3 id="e8">Newton's method and L'Hôpital's rule</h3>
<div class="eqb"><span class="mth"><i>x</i><sub><i>n</i>+1</sub> = <i>x</i><sub><i>n</i></sub> − <span class="frac"><span class="nm"><i>f</i>(<i>x</i><sub><i>n</i></sub>)</span><span class="den"><i>f</i>′(<i>x</i><sub><i>n</i></sub>)</span></span></span></div>
<p>Follow the tangent to the axis and repeat. Convergence is <strong>quadratic</strong> — the error ratio <span class="mth"><i>e</i><sub><i>n</i>+1</sub>/<i>e</i><sub><i>n</i></sub>²</span> settles on a constant, so correct digits roughly double each step. It is also fragile: the lab includes a cubic where the iteration falls into a two-cycle and never converges, with no warning at all. Every serious implementation carries a bisection fallback.</p>
<p><strong>L'Hôpital</strong> replaces <span class="mth">lim <i>f</i>/<i>g</i></span> by <span class="mth">lim <i>f</i>′/<i>g</i>′</span> — but only for <span class="mth">0/0</span> and <span class="mth">∞/∞</span>. Applied to <span class="mth">(<i>x</i>+1)/(<i>x</i>+2)</span> at 0 it gives 1, and the answer is ½. The rule is not merely unhelpful on a non-indeterminate form; it is <strong>wrong</strong>, and silently so. The lab checks the form before applying it, and evaluates every case numerically as well.</p>

${stThm("L'Hôpital's rule", {
  hyp:'<span class="mth"><i>f</i>, <i>g</i></span> are differentiable near <span class="mth"><i>a</i></span> with <span class="mth"><i>g</i>′ ≠ 0</span> there; <strong>both</strong> <span class="mth"><i>f</i>(<i>x</i>) → 0</span> and <span class="mth"><i>g</i>(<i>x</i>) → 0</span> (or both → ±∞); and <span class="mth">lim <i>f</i>′/<i>g</i>′</span> exists',
  then:'<span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>/<i>g</i> = lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>′/<i>g</i>′</span>',
  proof:`<p>Take the <span class="mth">0/0</span> case with a one-sided approach <span class="mth"><i>x</i> ↓ <i>a</i></span>. Extend both functions to <span class="mth"><i>a</i></span> by setting <span class="mth"><i>f</i>(<i>a</i>) = <i>g</i>(<i>a</i>) = 0</span>, which makes them continuous there precisely because the limits are 0.</p>
<p>Apply the <strong>Cauchy mean value theorem</strong> on <span class="mth">[<i>a</i>, <i>x</i>]</span>: there is <span class="mth">ξ ∈ (<i>a</i>, <i>x</i>)</span> with</p>
${stEq('[ <i>f</i>(<i>x</i>) <span class="op">−</span> <i>f</i>(<i>a</i>) ] <i>g</i>′(ξ) <span class="op">=</span> [ <i>g</i>(<i>x</i>) <span class="op">−</span> <i>g</i>(<i>a</i>) ] <i>f</i>′(ξ)')}
<p>With <span class="mth"><i>f</i>(<i>a</i>) = <i>g</i>(<i>a</i>) = 0</span> and <span class="mth"><i>g</i>′ ≠ 0</span> this rearranges to <span class="mth"><i>f</i>(<i>x</i>)/<i>g</i>(<i>x</i>) = <i>f</i>′(ξ)/<i>g</i>′(ξ)</span>.</p>
<p>As <span class="mth"><i>x</i> ↓ <i>a</i></span> the point <span class="mth">ξ</span> is squeezed to <span class="mth"><i>a</i></span>, so <span class="mth"><i>f</i>′(ξ)/<i>g</i>′(ξ)</span> tends to the assumed limit <span class="mth"><i>L</i></span>, and therefore so does <span class="mth"><i>f</i>/<i>g</i></span>.</p>
<p>Every hypothesis is load-bearing. Drop the indeterminate form and the rearrangement above is invalid, which is the <span class="mth">(<i>x</i>+1)/(<i>x</i>+2)</span> failure. Drop "<span class="mth">lim <i>f</i>′/<i>g</i>′</span> exists" and the conclusion says nothing — <span class="mth">(<i>x</i> + sin <i>x</i>)/<i>x</i></span> at ∞ has limit 1 while the quotient of derivatives oscillates forever.</p>`,
  note:'The rule is one-directional. If f′/g′ has no limit, that is not evidence that f/g has none.',
  see:'deriv:0.5', seeLabel:"L'Hôpital's rule, and when it lies" })}
`;

