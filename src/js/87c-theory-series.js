const THEORY_SERIES = `
<div class="toc"><a href="#s1">Sequences</a><a href="#s2">Series</a><a href="#s3">The tests</a>
<a href="#s4">Alternating</a><a href="#s5">Power series</a><a href="#s6">Taylor</a></div>

<h3 id="s1">Sequences</h3>
<p>A sequence converges when its terms eventually stay inside <em>every</em> band around the limit. The lab draws the bands and finds, by search, the index past which the sequence stays inside each — that index is the <span class="mth"><i>N</i></span> of the definition, and it grows without bound as the band narrows.</p>
<p>The <strong>monotone convergence theorem</strong> is the one result that hands you a limit without computing it: a bounded monotone sequence must converge. Boundedness alone never suffices — <span class="mth">(−1)<sup><i>n</i></sup></span> is as bounded as anything and converges to nothing.</p>

<h3 id="s2">A series is its partial sums</h3>
<p>Convergence is a statement about <span class="mth"><i>S</i><sub><i>n</i></sub></span> and nothing else. Only two families have closed-form partial sums — <strong>geometric</strong> <span class="mth">(1−<i>r</i><sup><i>n</i>+1</sup>)/(1−<i>r</i>)</span> and <strong>telescoping</strong>, where almost everything cancels. Everything else is decided by tests.</p>
<p class="note">The <strong>harmonic series</strong> is the standing warning: its terms go to zero and it still diverges, like <span class="mth">ln <i>n</i></span>, so slowly that the first 10⁴³ terms sum to under 100. No amount of computing settles such a question; a proof is required.</p>

${stThm('The nth-term test is one-directional', {
  hyp:'<span class="mth">Σ <i>a</i><sub><i>n</i></sub></span> converges',
  then:'<span class="mth"><i>a</i><sub><i>n</i></sub> → 0</span>',
  proof:`<p>Let <span class="mth"><i>S</i></span> be the sum, so <span class="mth"><i>S</i><sub><i>n</i></sub> → <i>S</i></span>. Then <span class="mth"><i>S</i><sub><i>n</i>−1</sub> → <i>S</i></span> as well, being the same sequence shifted. Since <span class="mth"><i>a</i><sub><i>n</i></sub> = <i>S</i><sub><i>n</i></sub> − <i>S</i><sub><i>n</i>−1</sub></span>, the difference of two sequences with the same limit tends to <span class="mth"><i>S</i> − <i>S</i> = 0</span>.</p>
<p><strong>The converse is false.</strong> The harmonic series is the standard counterexample, and here is the proof — Oresme's, from about 1350. Group the terms in blocks of doubling length:</p>
${stEq('1 <span class="op">+</span> ½ <span class="op">+</span> (⅓<span class="op">+</span>¼) <span class="op">+</span> (⅕<span class="op">+</span>⅙<span class="op">+</span>⅐<span class="op">+</span>⅛) <span class="op">+</span> …')}
<p>Each bracket has <span class="mth">2<sup><i>k</i></sup></span> terms, every one at least <span class="mth">1/2<sup><i>k</i>+1</sup></span>, so each bracket sums to at least <span class="mth">2<sup><i>k</i></sup> · 1/2<sup><i>k</i>+1</sup> = ½</span>. There are infinitely many brackets, so the partial sums exceed any bound: after <span class="mth">2<sup><i>m</i></sup></span> terms the sum is at least <span class="mth">1 + <i>m</i>/2</span>.</p>
<p>That is also why no computation could ever have settled it. To reach a partial sum of 100 the bound needs <span class="mth"><i>m</i> ≈ 198</span>, i.e. about <span class="mth">2<sup>198</sup></span> terms.</p>`,
  note:'So the test can only ever prove divergence. "The terms go to zero" is evidence of nothing.',
  see:'series:0.1', seeLabel:'The tests, and what each one cannot decide' })}

<h3 id="s3">The tests, and what each cannot decide</h3>
<ul>
  <li><strong>nth-term:</strong> if the terms do not tend to zero, the series diverges. That is <em>all</em> it says — the converse is the commonest error in the subject.</li>
  <li><strong>Geometric / p-series:</strong> converges for <span class="mth">|<i>r</i>| &lt; 1</span> and for <span class="mth"><i>p</i> &gt; 1</span>.</li>
  <li><strong>Integral:</strong> for positive decreasing terms, the series and <span class="mth">∫<i>f</i></span> share a fate. This is the only test that separates <span class="mth">1/<i>n</i></span> from <span class="mth">1/<i>n</i>²</span>.</li>
  <li><strong>Comparison and limit comparison:</strong> measure against a known series.</li>
  <li><strong>Ratio and root:</strong> decisive when <span class="mth"><i>L</i> ≠ 1</span>, and both return exactly 1 for <em>every</em> p-series — which have opposite answers, so neither can possibly settle one.</li>
</ul>
<p class="note">The lab's integral test integrates to a finite cut-off and pushes the cut-off out three more orders of magnitude; if the answer moves, it diverges. Substituting infinity onto a finite endpoint instead lets a logarithmic divergence hide inside the quadrature's own truncation error, and <span class="mth">Σ1/<i>n</i></span> comes back "convergent". That was a real bug here, caught by a test asserting the naive route is wrong.</p>

<h3 id="s4">Alternating series</h3>
<p>If the terms decrease in size to zero, an alternating series converges, and <strong>the error after N terms is at most the first term omitted</strong>. The partial sums bracket the answer, over- and under-shooting alternately, and consecutive ones differ by exactly the next term.</p>

${stThm('Alternating series test, with its error bound', {
  hyp:'<span class="mth"><i>a</i><sub><i>n</i></sub> &gt; 0</span>, <span class="mth"><i>a</i><sub><i>n</i>+1</sub> ≤ <i>a</i><sub><i>n</i></sub></span> for all <span class="mth"><i>n</i></span>, and <span class="mth"><i>a</i><sub><i>n</i></sub> → 0</span>',
  then:'<span class="mth">Σ (−1)<sup><i>n</i></sup><i>a</i><sub><i>n</i></sub></span> converges to some <span class="mth"><i>S</i></span>, and the truncation error obeys',
  eq:'|<i>S</i> <span class="op">−</span> <i>S</i><sub><i>N</i></sub>| &nbsp;≤&nbsp; <i>a</i><sub><i>N</i>+1</sub>',
  proof:`<p>Look at the even partial sums. Grouping in pairs,</p>
${stEq('<i>S</i><sub>2<i>m</i>+2</sub> <span class="op">−</span> <i>S</i><sub>2<i>m</i></sub> <span class="op">=</span> <i>a</i><sub>2<i>m</i>+2</sub> <span class="op">−</span> <i>a</i><sub>2<i>m</i>+1</sub> &nbsp;≤&nbsp; 0')}
<p>by monotonicity, so <span class="mth">(<i>S</i><sub>2<i>m</i></sub>)</span> is decreasing. The same computation on the odd ones shows <span class="mth">(<i>S</i><sub>2<i>m</i>+1</sub>)</span> is increasing. And every odd sum lies below every even one, since <span class="mth"><i>S</i><sub>2<i>m</i></sub> − <i>S</i><sub>2<i>m</i>+1</sub> = <i>a</i><sub>2<i>m</i>+1</sub> ≥ 0</span>.</p>
<p>So the evens decrease and are bounded below (by any odd sum), and the odds increase and are bounded above. By monotone convergence both converge. Their difference is <span class="mth"><i>a</i><sub>2<i>m</i>+1</sub> → 0</span>, so the two limits coincide; call it <span class="mth"><i>S</i></span>. The whole sequence of partial sums therefore converges to <span class="mth"><i>S</i></span>.</p>
<p>The bound now falls out of the nesting. <span class="mth"><i>S</i></span> lies between any two consecutive partial sums, because one is an odd sum and the other even. Hence</p>
${stEq('|<i>S</i> <span class="op">−</span> <i>S</i><sub><i>N</i></sub>| &nbsp;≤&nbsp; |<i>S</i><sub><i>N</i>+1</sub> <span class="op">−</span> <i>S</i><sub><i>N</i></sub>| &nbsp;=&nbsp; <i>a</i><sub><i>N</i>+1</sub>')}
<p>which is the first term omitted — no constants, no asymptotics. It is the sharpest and cheapest error bound in elementary analysis.</p>`,
  note:'Monotonicity is a genuine hypothesis, not a convenience. Terms that tend to zero without decreasing can produce a divergent alternating series.',
  see:'series:0.2', seeLabel:'Watch the partial sums bracket the answer' })}
<p><strong>Absolute</strong> convergence (the absolute values converge too) is robust: rearrange it however you like and the sum does not move. <strong>Conditional</strong> convergence is not — Riemann proved such a series can be rearranged to converge to <em>any</em> number you name, or to diverge. That is why "absolutely convergent" appears as a hypothesis so often.</p>

<h3 id="s5">Power series</h3>
<p>A power series converges on a disc of radius <span class="mth"><i>R</i></span> centred at <span class="mth"><i>c</i></span>, and diverges outside it; the endpoints must be tested separately and can go either way. Inside, it may be differentiated and integrated term by term — which is not true of series in general and is what makes power series so useful.</p>
<p class="note"><span class="mth"><i>R</i></span> reaches to the nearest singularity <strong>in the complex plane</strong>, not merely on the real line. <span class="mth">1/(1+<i>x</i>²)</span> is perfectly smooth for every real x and still has radius 1, because of poles at <span class="mth">±<i>i</i></span>. That surprise is the best single argument for complex analysis there is.</p>

<h3 id="s6">Taylor polynomials and the remainder</h3>
<div class="eqb"><span class="mth"><i>T</i><sub><i>n</i></sub>(<i>x</i>) = Σ<sub><i>k</i>=0</sub><sup><i>n</i></sup> <span class="frac"><span class="nm"><i>f</i><sup>(<i>k</i>)</sup>(<i>c</i>)</span><span class="den"><i>k</i>!</span></span> (<i>x</i>−<i>c</i>)<sup><i>k</i></sup></span></div>
<p>The coefficient <em>must</em> be <span class="mth"><i>f</i><sup>(<i>k</i>)</sup>(<i>c</i>)/<i>k</i>!</span>, because differentiating k times and setting <span class="mth"><i>x</i> = <i>c</i></span> leaves exactly <span class="mth"><i>k</i>!</span> times it. Everything else follows from that requirement.</p>
<p>The <strong>Lagrange remainder</strong> bounds the error by <span class="mth"><i>M</i>|<i>x</i>−<i>c</i>|<sup><i>n</i>+1</sup>/(<i>n</i>+1)!</span> with <span class="mth"><i>M</i></span> the maximum of <span class="mth">|<i>f</i><sup>(<i>n</i>+1)</sup>|</span> on the interval — sampled here rather than guessed, and printed beside the error that actually occurred.</p>

${stThm('Taylor with Lagrange remainder', {
  hyp:'<span class="mth"><i>f</i></span> has <span class="mth"><i>n</i>+1</span> continuous derivatives on an interval containing <span class="mth"><i>c</i></span> and <span class="mth"><i>x</i></span>',
  then:'<span class="mth"><i>f</i>(<i>x</i>) = <i>T</i><sub><i>n</i></sub>(<i>x</i>) + <i>R</i><sub><i>n</i></sub>(<i>x</i>)</span> where, for some <span class="mth">ξ</span> strictly between <span class="mth"><i>c</i></span> and <span class="mth"><i>x</i></span>,',
  eq: '<i>R</i><sub><i>n</i></sub>(<i>x</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i><sup>(<i>n</i>+1)</sup>(ξ)</span><span class="den">(<i>n</i>+1)!</span></span> (<i>x</i> <span class="op">−</span> <i>c</i>)<sup><i>n</i>+1</sup>',
  proof:`<p>Fix <span class="mth"><i>x</i> ≠ <i>c</i></span>. Choose the number <span class="mth"><i>K</i></span> that makes the claim true by <em>definition</em>:</p>
${stEq('<i>f</i>(<i>x</i>) <span class="op">=</span> <i>T</i><sub><i>n</i></sub>(<i>x</i>) <span class="op">+</span> <i>K</i>(<i>x</i> <span class="op">−</span> <i>c</i>)<sup><i>n</i>+1</sup>')}
<p>Such a <span class="mth"><i>K</i></span> exists and is unique, since <span class="mth">(<i>x</i>−<i>c</i>)<sup><i>n</i>+1</sup> ≠ 0</span>. All that remains is to identify it, and the whole content of the theorem is that <span class="mth"><i>K</i> = <i>f</i><sup>(<i>n</i>+1)</sup>(ξ)/(<i>n</i>+1)!</span> for some <span class="mth">ξ</span>.</p>
<p>Define, for <span class="mth"><i>t</i></span> ranging over the interval,</p>
${stEq('<i>g</i>(<i>t</i>) <span class="op">=</span> <i>f</i>(<i>x</i>) <span class="op">−</span> <i>T</i><sub><i>n</i></sub>(<i>t</i>; <i>x</i>) <span class="op">−</span> <i>K</i>(<i>x</i> <span class="op">−</span> <i>t</i>)<sup><i>n</i>+1</sup>')}
<p>where <span class="mth"><i>T</i><sub><i>n</i></sub>(<i>t</i>; <i>x</i>) = Σ<sub><i>k</i>=0</sub><sup><i>n</i></sup> <i>f</i><sup>(<i>k</i>)</sup>(<i>t</i>)(<i>x</i>−<i>t</i>)<sup><i>k</i></sup>/<i>k</i>!</span> — the Taylor polynomial expanded about the moving point <span class="mth"><i>t</i></span>.</p>
<p>Then <span class="mth"><i>g</i>(<i>x</i>) = 0</span> (every term with a factor <span class="mth">(<i>x</i>−<i>t</i>)</span> dies and <span class="mth"><i>f</i>(<i>x</i>) − <i>f</i>(<i>x</i>) = 0</span>), and <span class="mth"><i>g</i>(<i>c</i>) = 0</span> by the choice of <span class="mth"><i>K</i></span>. <strong>Rolle's theorem</strong> therefore gives <span class="mth">ξ</span> between them with <span class="mth"><i>g</i>′(ξ) = 0</span>.</p>
<p>Differentiating <span class="mth"><i>T</i><sub><i>n</i></sub>(<i>t</i>; <i>x</i>)</span> in <span class="mth"><i>t</i></span>, the sum telescopes — each term's derivative cancels the next term's — leaving only</p>
${stEq('<span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span> <i>T</i><sub><i>n</i></sub>(<i>t</i>; <i>x</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i><sup>(<i>n</i>+1)</sup>(<i>t</i>)</span><span class="den"><i>n</i>!</span></span> (<i>x</i> <span class="op">−</span> <i>t</i>)<sup><i>n</i></sup>')}
<p>and the last term of <span class="mth"><i>g</i></span> contributes <span class="mth">+(<i>n</i>+1)<i>K</i>(<i>x</i>−<i>t</i>)<sup><i>n</i></sup></span>. Setting <span class="mth"><i>g</i>′(ξ) = 0</span> and cancelling the common <span class="mth">(<i>x</i>−ξ)<sup><i>n</i></sup> ≠ 0</span> gives <span class="mth"><i>K</i> = <i>f</i><sup>(<i>n</i>+1)</sup>(ξ)/(<i>n</i>+1)!</span>.</p>
<p>Setting <span class="mth"><i>n</i> = 0</span> recovers the Mean Value Theorem exactly, which is the honest way to see what this theorem is: the MVT applied <span class="mth"><i>n</i>+1</span> times.</p>`,
  note:'ξ is only known to exist — it is not located. That is why the lab samples the maximum of |f⁽ⁿ⁺¹⁾| over the interval to get a usable bound, and prints it beside the error that actually occurred.',
  see:'series:0.3', seeLabel:'Taylor polynomials, with the bound and the true error' })}
<p>The six Maclaurin series worth knowing — <span class="mth"><i>e</i><sup><i>x</i></sup></span>, sin, cos, <span class="mth">1/(1−<i>x</i>)</span>, <span class="mth">ln(1+<i>x</i>)</span>, arctan — are all obtainable from the geometric series and the exponential by differentiating, integrating and substituting, which is far less work than computing derivatives.</p>
<p class="note">Series termination <em>is</em> quantisation. Hermite's equation has a polynomial solution only for integer λ; otherwise the series never stops and the solution blows up like <span class="mth"><i>e</i><sup><i>x</i>²</sup></span>. The harmonic-oscillator energy levels in the quantum wing are exactly those integer values — an energy spectrum arriving as a condition for a power series to converge.</p>
`;

