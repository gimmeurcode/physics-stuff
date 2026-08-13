/* ============================================================================
   7c · THE LONG-FORM MATHEMATICS AND PHYSICS — the AP wings
   ============================================================================ */

const THEORY_LIMITS = `
<div class="toc"><a href="#l1">What a limit is</a><a href="#l2">One-sided limits</a><a href="#l3">ε and δ</a>
<a href="#l4">Squeeze</a><a href="#l5">Continuity</a><a href="#l6">The three theorems</a></div>

<h3 id="l1">What a limit is, and what it is not</h3>
<p><span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>(<i>x</i>) = <i>L</i></span> says that <span class="mth"><i>f</i></span> can be made as close to <span class="mth"><i>L</i></span> as you like by taking <span class="mth"><i>x</i></span> close enough to <span class="mth"><i>a</i></span> — <em>without ever letting x equal a</em>. That exclusion is the whole point. The value <span class="mth"><i>f</i>(<i>a</i>)</span> may be anything, or nothing at all, and the limit does not consult it.</p>
<p>This is why <span class="mth">(<i>x</i>²−1)/(<i>x</i>−1)</span> has limit 2 at <span class="mth"><i>x</i> = 1</span> despite being <span class="mth">0/0</span> there: the factor cancels everywhere except at the single excluded point. Every derivative in the subject is a limit of exactly that shape.</p>

<h3 id="l2">One-sided limits, and the four ways to fail</h3>
<p>Approaching from below and from above are separate questions, and the two-sided limit exists precisely when both exist and agree. That gives a complete taxonomy of failure:</p>
<ul>
  <li><strong>Jump</strong> — both one-sided limits exist and differ. <span class="mth">|<i>x</i>|/<i>x</i></span> at 0.</li>
  <li><strong>Infinite</strong> — the function is unbounded near the point. <span class="mth">1/<i>x</i>²</span> at 0. Writing "the limit is ∞" is shorthand for a describable non-existence, and marks a <strong>vertical asymptote</strong>.</li>
  <li><strong>Essential</strong> — the values never settle. <span class="mth">sin(1/<i>x</i>)</span> takes every value in [−1,1] infinitely often in any neighbourhood of 0, however small, so zooming in never simplifies the picture.</li>
  <li><strong>Removable</strong> — the limit exists but <span class="mth"><i>f</i></span> is missing or wrong there. The only repairable case.</li>
</ul>
<p class="note">A graph that "looks like it settles" proves nothing — the oscillating case is the standing warning. This is why the definition is quantified rather than visual.</p>

<h3 id="l3">The ε–δ definition</h3>
<div class="eqb"><span class="mth">∀ε &gt; 0 &nbsp; ∃δ &gt; 0 : &nbsp; 0 &lt; |<i>x</i> − <i>a</i>| &lt; δ &nbsp;⟹&nbsp; |<i>f</i>(<i>x</i>) − <i>L</i>| &lt; ε</span></div>
${stDefn('Limit of a function at a point', `
<p>Let <span class="mth"><i>f</i></span> be defined on some open interval containing <span class="mth"><i>a</i></span>, except possibly at <span class="mth"><i>a</i></span> itself. We say <span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>(<i>x</i>) = <i>L</i></span> when:</p>
${stEq('∀ε &gt; 0 &nbsp; ∃δ &gt; 0 &nbsp; such that &nbsp; 0 &lt; |<i>x</i> − <i>a</i>| &lt; δ &nbsp;⟹&nbsp; |<i>f</i>(<i>x</i>) − <i>L</i>| &lt; ε')}
<p>The clause <span class="mth">0 &lt; |<i>x</i> − <i>a</i>|</span> is what excludes <span class="mth"><i>x</i> = <i>a</i></span>. Remove it and the definition would demand <span class="mth"><i>f</i>(<i>a</i>) = <i>L</i></span>, which is continuity — a strictly stronger condition, and one that would make the derivative impossible to define.</p>`,
{ note:'The order of the quantifiers is the entire content. "∃δ ∀ε" would say one δ works for every ε at once, which forces f to be constant near a.',
  see:'limits:0.2', seeLabel:'Play the ε–δ game — you name ε, the lab finds δ' })}

${stDefn('Continuity at a point', `
<p><span class="mth"><i>f</i></span> is <strong>continuous at <i>a</i></strong> when all three hold:</p>
<ol><li><span class="mth"><i>f</i>(<i>a</i>)</span> is defined;</li>
<li><span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>(<i>x</i>)</span> exists;</li>
<li>the two are equal.</li></ol>
<p>Each can fail on its own, which is exactly the three-way failure the lab lets you step through.</p>`,
{ see:'limits:0.6', seeLabel:'Continuity, and its three failure modes' })}
<p>The quantifier order carries everything: δ may depend on ε, and must. The lab plays this as a game — you name ε, and it finds the largest working δ by <strong>bisection</strong>, actually testing whether every x within δ lands within ε. For a linear function halving ε halves δ; for a steeper one δ shrinks faster, and that rate is the derivative.</p>
<p>Weierstrass wrote this down in the 1860s — two centuries after the calculus it makes rigorous. Newton and Leibniz got the right answers with infinitesimals nobody could define, and Berkeley's jibe about "the ghosts of departed quantities" stood unanswered for a very long time.</p>

<h3 id="l4">The squeeze theorem</h3>
<p>If <span class="mth"><i>g</i> ≤ <i>f</i> ≤ <i>h</i></span> near <span class="mth"><i>a</i></span> and <span class="mth"><i>g</i></span> and <span class="mth"><i>h</i></span> share a limit, then <span class="mth"><i>f</i></span> has it too. It is the only technique that handles a function too badly behaved to approach directly: <span class="mth"><i>x</i>² sin(1/<i>x</i>)</span> oscillates infinitely often near 0 and is still forced to 0, because <span class="mth">|<i>f</i>| ≤ <i>x</i>²</span>.</p>

${stThm('Squeeze theorem', {
  hyp:'<span class="mth"><i>g</i>(<i>x</i>) ≤ <i>f</i>(<i>x</i>) ≤ <i>h</i>(<i>x</i>)</span> for all <span class="mth"><i>x</i></span> in some punctured interval about <span class="mth"><i>a</i></span>, and <span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>g</i> = lim<sub><i>x</i>→<i>a</i></sub> <i>h</i> = <i>L</i></span>',
  then:'<span class="mth">lim<sub><i>x</i>→<i>a</i></sub> <i>f</i>(<i>x</i>) = <i>L</i></span>',
  proof:`<p>Fix <span class="mth">ε &gt; 0</span>. Because <span class="mth"><i>g</i> → <i>L</i></span> there is <span class="mth">δ₁ &gt; 0</span> with</p>
${stEq('0 &lt; |<i>x</i> − <i>a</i>| &lt; δ₁ &nbsp;⟹&nbsp; <i>L</i> − ε &lt; <i>g</i>(<i>x</i>) &lt; <i>L</i> + ε')}
<p>and because <span class="mth"><i>h</i> → <i>L</i></span> there is <span class="mth">δ₂ &gt; 0</span> with the same bracket around <span class="mth"><i>h</i>(<i>x</i>)</span>. Let <span class="mth">δ₃</span> be a radius on which the sandwich <span class="mth"><i>g</i> ≤ <i>f</i> ≤ <i>h</i></span> holds, and put <span class="mth">δ = min(δ₁, δ₂, δ₃)</span>, which is positive because it is the minimum of finitely many positive numbers.</p>
<p>Now suppose <span class="mth">0 &lt; |<i>x</i> − <i>a</i>| &lt; δ</span>. All three conditions apply at once, so</p>
${stEq('<i>L</i> − ε &lt; <i>g</i>(<i>x</i>) ≤ <i>f</i>(<i>x</i>) ≤ <i>h</i>(<i>x</i>) &lt; <i>L</i> + ε')}
<p>Reading the two ends gives <span class="mth">|<i>f</i>(<i>x</i>) − <i>L</i>| &lt; ε</span>. Since <span class="mth">ε</span> was arbitrary, <span class="mth"><i>f</i> → <i>L</i></span>.</p>
<p>Notice what was never needed: any assumption that <span class="mth"><i>f</i></span> is continuous, monotone, or even that it settles down at all. The bound does all the work, which is why the theorem reaches functions no other method can.</p>`,
  note:'The hypothesis is one-sided in a way worth naming: g and h must share the limit. Two bounds converging to different values say nothing at all.',
  see:'limits:0.1', seeLabel:'Watch x²·sin(1/x) get forced to zero' })}
<p>It also proves <span class="mth">sin <i>x</i>/<i>x</i> → 1</span>, by trapping the arc between its chord and its tangent — which is why the derivative of sine is cosine, and hence why the whole of trigonometric calculus works.</p>

<h3 id="l5">Continuity</h3>
<p>Three conditions: <span class="mth"><i>f</i>(<i>a</i>)</span> exists, the limit exists, and they agree. Continuity is the hypothesis of nearly every theorem that follows, so knowing exactly what it excludes matters more than it looks.</p>
<p>Polynomials are continuous everywhere; rational functions everywhere their denominator is nonzero; compositions of continuous functions are continuous. That closure is what makes "just substitute" legitimate — it is a <em>theorem about continuous functions</em>, not the definition of a limit.</p>

<h3 id="l6">The three value theorems</h3>
<h4>Intermediate Value</h4>
<p>A continuous <span class="mth"><i>f</i></span> on <span class="mth">[<i>a</i>,<i>b</i>]</span> takes every value between <span class="mth"><i>f</i>(<i>a</i>)</span> and <span class="mth"><i>f</i>(<i>b</i>)</span>. It is an <em>existence</em> statement and not a counting one — the lab shows the crossing count jumping between one and three while the theorem never notices. Bisection is its constructive proof, and every root-finder rests on it.</p>

${stThm('Intermediate Value Theorem', {
  hyp:'<span class="mth"><i>f</i></span> is continuous on the closed interval <span class="mth">[<i>a</i>,<i>b</i>]</span>, and <span class="mth"><i>N</i></span> lies between <span class="mth"><i>f</i>(<i>a</i>)</span> and <span class="mth"><i>f</i>(<i>b</i>)</span>',
  then:'there exists <span class="mth"><i>c</i> ∈ [<i>a</i>,<i>b</i>]</span> with <span class="mth"><i>f</i>(<i>c</i>) = <i>N</i></span>',
  proof:`<p>Take <span class="mth"><i>f</i>(<i>a</i>) &lt; <i>N</i> &lt; <i>f</i>(<i>b</i>)</span>; the other case is the same argument applied to <span class="mth">−<i>f</i></span>. This is the bisection the lab runs, stated as a proof.</p>
<p>Set <span class="mth"><i>a</i>₀ = <i>a</i></span>, <span class="mth"><i>b</i>₀ = <i>b</i></span>. Given <span class="mth">[<i>a</i><sub><i>n</i></sub>, <i>b</i><sub><i>n</i></sub>]</span> with <span class="mth"><i>f</i>(<i>a</i><sub><i>n</i></sub>) ≤ <i>N</i> ≤ <i>f</i>(<i>b</i><sub><i>n</i></sub>)</span>, let <span class="mth"><i>m</i></span> be its midpoint and keep whichever half preserves that bracket. The nested intervals halve in length, so their lengths tend to 0.</p>
<p>The left endpoints increase and are bounded above by <span class="mth"><i>b</i></span>, so by monotone convergence they converge; call the limit <span class="mth"><i>c</i></span>. The right endpoints converge to the same <span class="mth"><i>c</i></span>, because the gap goes to zero.</p>
<p>Continuity at <span class="mth"><i>c</i></span> gives <span class="mth"><i>f</i>(<i>a</i><sub><i>n</i></sub>) → <i>f</i>(<i>c</i>)</span> and <span class="mth"><i>f</i>(<i>b</i><sub><i>n</i></sub>) → <i>f</i>(<i>c</i>)</span>. Passing to the limit in <span class="mth"><i>f</i>(<i>a</i><sub><i>n</i></sub>) ≤ <i>N</i> ≤ <i>f</i>(<i>b</i><sub><i>n</i></sub>)</span> gives <span class="mth"><i>f</i>(<i>c</i>) ≤ <i>N</i> ≤ <i>f</i>(<i>c</i>)</span>, so <span class="mth"><i>f</i>(<i>c</i>) = <i>N</i></span>.</p>
<p>The completeness of the reals entered exactly once, at "the bounded monotone sequence converges". Over the rationals the theorem is false: <span class="mth"><i>x</i>² − 2</span> changes sign on <span class="mth">[1,2]</span> and never vanishes.</p>`,
  note:'It gives existence, never a count and never a location. The lab shows the number of crossings changing while the theorem says nothing about it.',
  see:'limits:0.7', seeLabel:'IVT, EVT and the MVT, each with its witness located' })}

<h4>Extreme Value</h4>
<p>A continuous <span class="mth"><i>f</i></span> on a <strong>closed bounded</strong> interval attains a maximum and a minimum. Both hypotheses are load-bearing: on <span class="mth">(0,1)</span> the function <span class="mth"><i>x</i></span> has neither. The extremes can sit at an endpoint, which is why the candidates method lists critical points <em>and</em> endpoints.</p>

${stThm('Extreme Value Theorem', {
  hyp:'<span class="mth"><i>f</i></span> is continuous on the <strong>closed, bounded</strong> interval <span class="mth">[<i>a</i>,<i>b</i>]</span>',
  then:'<span class="mth"><i>f</i></span> attains a maximum and a minimum: there are <span class="mth"><i>p</i>, <i>q</i> ∈ [<i>a</i>,<i>b</i>]</span> with <span class="mth"><i>f</i>(<i>p</i>) ≤ <i>f</i>(<i>x</i>) ≤ <i>f</i>(<i>q</i>)</span> for all <span class="mth"><i>x</i></span>',
  proof:`<p><em>Bounded first.</em> Suppose not. Then for each <span class="mth"><i>n</i></span> there is <span class="mth"><i>x</i><sub><i>n</i></sub> ∈ [<i>a</i>,<i>b</i>]</span> with <span class="mth">|<i>f</i>(<i>x</i><sub><i>n</i></sub>)| &gt; <i>n</i></span>. The sequence lives in a closed bounded interval, so by Bolzano–Weierstrass some subsequence converges, to <span class="mth"><i>x</i>* ∈ [<i>a</i>,<i>b</i>]</span> — and it is the closedness that keeps the limit inside. Continuity forces <span class="mth"><i>f</i>(<i>x</i><sub><i>n</i><sub>k</sub></sub>) → <i>f</i>(<i>x</i>*)</span>, a finite number, contradicting <span class="mth">|<i>f</i>| &gt; <i>n</i><sub>k</sub> → ∞</span>.</p>
<p><em>Attained second.</em> Let <span class="mth"><i>M</i> = sup <i>f</i></span>, finite by the above. Choose <span class="mth"><i>x</i><sub><i>n</i></sub></span> with <span class="mth"><i>f</i>(<i>x</i><sub><i>n</i></sub>) &gt; <i>M</i> − 1/<i>n</i></span>. Extract a convergent subsequence <span class="mth"><i>x</i><sub><i>n</i><sub>k</sub></sub> → <i>q</i> ∈ [<i>a</i>,<i>b</i>]</span>. Then <span class="mth"><i>f</i>(<i>q</i>) = lim <i>f</i>(<i>x</i><sub><i>n</i><sub>k</sub></sub>) = <i>M</i></span>, so the supremum is a maximum. The minimum follows by applying this to <span class="mth">−<i>f</i></span>.</p>
<p>Both hypotheses were used and neither can be dropped. On <span class="mth">(0,1]</span> the function <span class="mth">1/<i>x</i></span> is continuous and unbounded — the interval is not closed. On <span class="mth">[0,∞)</span> the function <span class="mth"><i>x</i></span> is continuous and unbounded — not bounded.</p>`,
  see:'limits:0.7', seeLabel:'Drag the interval and watch the extremes move to the endpoints' })}

<h4>Mean Value</h4>
<div class="eqb"><span class="mth"><i>f</i>′(<i>c</i>) = <span class="frac"><span class="nm"><i>f</i>(<i>b</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>b</i> − <i>a</i></span></span> &nbsp; for some <i>c</i> in (<i>a</i>,<i>b</i>)</span></div>
<p>Some tangent is parallel to the chord. <strong>Rolle's theorem</strong> is the case <span class="mth"><i>f</i>(<i>a</i>) = <i>f</i>(<i>b</i>)</span>.</p>

${stLemma("Rolle's theorem", {
  hyp:'<span class="mth"><i>f</i></span> continuous on <span class="mth">[<i>a</i>,<i>b</i>]</span>, differentiable on <span class="mth">(<i>a</i>,<i>b</i>)</span>, and <span class="mth"><i>f</i>(<i>a</i>) = <i>f</i>(<i>b</i>)</span>',
  then:'there is <span class="mth"><i>c</i> ∈ (<i>a</i>,<i>b</i>)</span> with <span class="mth"><i>f</i>′(<i>c</i>) = 0</span>',
  proof:`<p>By the Extreme Value Theorem <span class="mth"><i>f</i></span> attains a maximum and a minimum on <span class="mth">[<i>a</i>,<i>b</i>]</span>.</p>
<p>If both are attained only at the endpoints, then since <span class="mth"><i>f</i>(<i>a</i>) = <i>f</i>(<i>b</i>)</span> the maximum equals the minimum, so <span class="mth"><i>f</i></span> is constant and <span class="mth"><i>f</i>′ = 0</span> everywhere inside.</p>
<p>Otherwise an extremum is attained at some interior <span class="mth"><i>c</i></span>. Say it is a maximum. For small <span class="mth"><i>h</i> &gt; 0</span> the quotient <span class="mth">(<i>f</i>(<i>c</i>+<i>h</i>) − <i>f</i>(<i>c</i>))/<i>h</i> ≤ 0</span>, since the numerator cannot be positive; letting <span class="mth"><i>h</i> ↓ 0</span> gives <span class="mth"><i>f</i>′(<i>c</i>) ≤ 0</span>. For small <span class="mth"><i>h</i> &lt; 0</span> the same numerator is still ≤ 0 while the denominator is negative, so the quotient is ≥ 0 and <span class="mth"><i>f</i>′(<i>c</i>) ≥ 0</span>. Differentiability means these one-sided limits agree, so <span class="mth"><i>f</i>′(<i>c</i>) = 0</span>.</p>` })}

${stThm('Mean Value Theorem', {
  hyp:'<span class="mth"><i>f</i></span> continuous on <span class="mth">[<i>a</i>,<i>b</i>]</span> and differentiable on <span class="mth">(<i>a</i>,<i>b</i>)</span>',
  then:'there is <span class="mth"><i>c</i> ∈ (<i>a</i>,<i>b</i>)</span> with',
  eq:'<i>f</i>′(<i>c</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i>(<i>b</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>b</i> − <i>a</i></span></span>',
  proof:`<p>Subtract the chord. Define</p>
${stEq('<i>g</i>(<i>x</i>) <span class="op">=</span> <i>f</i>(<i>x</i>) <span class="op">−</span> [ <i>f</i>(<i>a</i>) <span class="op">+</span> <span class="frac"><span class="nm"><i>f</i>(<i>b</i>) − <i>f</i>(<i>a</i>)</span><span class="den"><i>b</i> − <i>a</i></span></span>(<i>x</i> <span class="op">−</span> <i>a</i>) ]')}
<p>The bracket is the straight line through the two endpoints of the graph. <span class="mth"><i>g</i></span> inherits continuity on <span class="mth">[<i>a</i>,<i>b</i>]</span> and differentiability on <span class="mth">(<i>a</i>,<i>b</i>)</span>, because a linear function has both everywhere.</p>
<p>Evaluate: <span class="mth"><i>g</i>(<i>a</i>) = <i>f</i>(<i>a</i>) − <i>f</i>(<i>a</i>) = 0</span>, and <span class="mth"><i>g</i>(<i>b</i>) = <i>f</i>(<i>b</i>) − [<i>f</i>(<i>a</i>) + (<i>f</i>(<i>b</i>) − <i>f</i>(<i>a</i>))] = 0</span>. So <span class="mth"><i>g</i>(<i>a</i>) = <i>g</i>(<i>b</i>)</span> and Rolle applies: there is <span class="mth"><i>c</i> ∈ (<i>a</i>,<i>b</i>)</span> with <span class="mth"><i>g</i>′(<i>c</i>) = 0</span>.</p>
<p>Differentiating, <span class="mth"><i>g</i>′(<i>x</i>) = <i>f</i>′(<i>x</i>) − (<i>f</i>(<i>b</i>) − <i>f</i>(<i>a</i>))/(<i>b</i> − <i>a</i>)</span>, and setting this to zero at <span class="mth"><i>c</i></span> is the claim.</p>
<p>The trick is worth keeping: to use Rolle on a function whose endpoints differ, subtract something with the same endpoints. The Cauchy MVT and the Taylor remainder are both this move applied again.</p>`,
  note:'Differentiability is required only on the OPEN interval — which is what lets the theorem apply to √x on [0,1], where the derivative blows up at 0.',
  see:'limits:0.7', seeLabel:'Choose |x| and drag the interval across zero to watch it fail' })}

${stCor('A vanishing derivative means constant', {
  hyp:'<span class="mth"><i>f</i>′(<i>x</i>) = 0</span> for every <span class="mth"><i>x</i></span> in an interval <span class="mth"><i>I</i></span>',
  then:'<span class="mth"><i>f</i></span> is constant on <span class="mth"><i>I</i></span>',
  proof:`<p>Take any <span class="mth"><i>x</i>₁ &lt; <i>x</i>₂</span> in <span class="mth"><i>I</i></span>. The MVT applies on <span class="mth">[<i>x</i>₁, <i>x</i>₂]</span>, giving <span class="mth"><i>c</i></span> between them with</p>
${stEq('<i>f</i>(<i>x</i>₂) <span class="op">−</span> <i>f</i>(<i>x</i>₁) <span class="op">=</span> <i>f</i>′(<i>c</i>)(<i>x</i>₂ <span class="op">−</span> <i>x</i>₁) <span class="op">=</span> 0')}
<p>So <span class="mth"><i>f</i>(<i>x</i>₁) = <i>f</i>(<i>x</i>₂)</span> for every pair, which is what constant means.</p>
<p><em>Interval</em> is a hypothesis, not decoration. On the domain <span class="mth"><i>x</i> ≠ 0</span> the function <span class="mth"><i>x</i>/|<i>x</i>|</span> has zero derivative throughout and takes two values. Without connectedness the argument has no <span class="mth">[<i>x</i>₁, <i>x</i>₂]</span> to work on.</p>`,
  note:'This is why "+C" appears in every antiderivative: two functions with the same derivative differ by a constant on each interval of their common domain.' })}
<p class="note">The MVT is the load-bearing beam of the whole subject. "f′ &gt; 0 implies increasing" is the MVT. "Equal derivatives means differing by a constant" is the MVT. The Taylor error bound is the MVT applied n+1 times. It is the only bridge from what a derivative says <em>at a point</em> to what a function does <em>over an interval</em> — and without it there is no such bridge. Choose |x| in the lab and drag the interval across zero to watch it fail the instant differentiability does.</p>
`;

