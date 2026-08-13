/* ============================================================================
   7f · THE LONG-FORM MATHEMATICS — PROBABILITY, STATISTICS, NUMERICAL METHODS
   ============================================================================ */
const THEORY_PROB = `
<div class="toc"><a href="#b0">Densities</a><a href="#b1">Expectation is a centre of mass</a>
<a href="#b2">Variance</a><a href="#b3">The central limit theorem</a>
<a href="#b4">Regression</a><a href="#b5">What statistics cannot do</a></div>

<h3 id="b0">A distribution is a density</h3>
<p>Everything in this subject is an integral of one function. For a continuous random variable the density <span class="mth"><i>f</i>(<i>x</i>)</span> is <strong>not</strong> a probability — it has units of "per <span class="mth"><i>x</i></span>", it may exceed 1, and only its integral over an interval is a probability. The cumulative function is its running integral, not a second idea:</p>
<div class="eqb"><span class="mth"><i>F</i>(<i>x</i>) <span class="op">=</span> ∫<sub>−∞</sub><sup>x</sup> <i>f</i>(<i>t</i>) d<i>t</i> , &nbsp;&nbsp; ∫<sub>−∞</sub><sup>∞</sup> <i>f</i> <span class="op">=</span> 1</span></div>
<p>For a discrete variable the sum replaces the integral and each value <em>is</em> a probability, so none may exceed 1. Keeping that distinction straight removes most of the confusion the subject generates.</p>

<h3 id="b1">Expectation is a centre of mass</h3>
<div class="eqb"><span class="mth">μ <span class="op">=</span> E[<i>X</i>] <span class="op">=</span> ∫ <i>x</i>·<i>f</i>(<i>x</i>) d<i>x</i></span></div>
<p>This is exactly the centroid integral of the multivariable wing with the density of a lamina replaced by a probability density. The mean balances the distribution for precisely the reason a centroid balances a plate — and that is why a strongly skewed distribution like the exponential has its mean well to the right of its peak.</p>

<h3 id="b2">Variance is a moment of inertia</h3>
<div class="eqb"><span class="mth">σ² <span class="op">=</span> E[(<i>X</i>−μ)²] <span class="op">=</span> E[<i>X</i>²] <span class="op">−</span> μ²</span></div>
<p>Second moment about the centre — which the rotation wing calls <span class="mth"><i>I</i></span> and obtains by integrating <span class="mth"><i>r</i>²d<i>m</i></span>. The analogy is not decorative: it explains why variances <strong>add for independent variables</strong> exactly as moments of inertia add for disjoint bodies, and that additivity is what the central limit theorem runs on.</p>
<p class="note">Sample variance divides by <span class="mth"><i>n</i>−1</span>, not <span class="mth"><i>n</i></span>. The sample mean is itself fitted from the data, so one degree of freedom has been spent, and dividing by <span class="mth"><i>n</i></span> would underestimate. This is Bessel's correction, and it is the same "a fitted parameter costs a degree of freedom" bookkeeping that appears in regression.</p>

<h3 id="b3">The central limit theorem</h3>
<p>Average <span class="mth"><i>n</i></span> independent draws from <em>any</em> distribution with finite variance. Then</p>
<div class="eqb"><span class="mth">E[X̄] <span class="op">=</span> μ , &nbsp;&nbsp; Var[X̄] <span class="op">=</span> σ²/<i>n</i> , &nbsp;&nbsp; X̄ <span class="op">→</span> normal</span></div>
<p>The variance half needs only that variances add: the sum has variance <span class="mth"><i>n</i>σ²</span>, and dividing by <span class="mth"><i>n</i></span> pulls out <span class="mth"><i>n</i>²</span>, leaving <span class="mth">σ²/<i>n</i></span>. The <em>shape</em> half is deeper and needs characteristic functions.</p>
<p>The practical consequence is the <span class="mth">√<i>n</i></span>: to halve your uncertainty you need four times the data, and for one more decimal place a hundred times. That single square root sets the cost of every poll, experiment and measurement ever made — and it is why detecting the LIGO chirp took decades of averaging.</p>
<p class="note">The conditions matter. A Cauchy distribution has no finite variance and its sample means never settle, however much data you gather. And the draws must be roughly independent; strongly correlated ones do not average away, which is why risk models built on this assumption fail precisely when correlations spike.</p>

${stThm('Variance of a sample mean — the 1/√n law', {
  hyp:'<span class="mth"><i>X</i>₁, …, <i>X</i><sub><i>n</i></sub></span> are independent, each with mean <span class="mth">μ</span> and finite variance <span class="mth">σ²</span>',
  then:'',
  eq:'E[X̄] <span class="op">=</span> μ , &nbsp;&nbsp; Var[X̄] <span class="op">=</span> σ²/<i>n</i> , &nbsp;&nbsp; SD[X̄] <span class="op">=</span> σ/√<i>n</i>',
  proof:`<p>The mean is easy: expectation is linear whether or not the variables are independent, so</p>
${stEq('E[X̄] <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>n</i></span></span> Σ E[<i>X</i><sub><i>i</i></sub>] <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>n</i></span></span> <span class="op">·</span> <i>n</i>μ <span class="op">=</span> μ')}
<p>The variance needs two facts. First, scaling: <span class="mth">Var[<i>cY</i>] = <i>c</i>²Var[<i>Y</i>]</span>, because the deviation from the mean is scaled by <span class="mth"><i>c</i></span> and then squared. Second, additivity for <em>independent</em> variables: <span class="mth">Var[ΣX<sub><i>i</i></sub>] = ΣVar[X<sub><i>i</i></sub>]</span>, because the cross terms are covariances and independence makes each of them zero.</p>
<p>Apply both, with <span class="mth"><i>c</i> = 1/<i>n</i></span>:</p>
${stEq('Var[X̄] <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>n</i>²</span></span> Var[Σ<i>X</i><sub><i>i</i></sub>] <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>n</i>²</span></span> <span class="op">·</span> <i>n</i>σ² <span class="op">=</span> <span class="frac"><span class="nm">σ²</span><span class="den"><i>n</i></span></span>')}
<p>The square root of that is the standard deviation, so the spread falls as <span class="mth">1/√<i>n</i></span> — the whole result is the mismatch between dividing by <span class="mth"><i>n</i>²</span> and summing <span class="mth"><i>n</i></span> terms.</p>
<p>Note what was <em>not</em> needed: any assumption about the shape of the distribution. The variance half of the central limit theorem holds for any finite-variance distribution at any <span class="mth"><i>n</i></span>. Only the claim that the shape becomes normal requires the limit and characteristic functions.</p>`,
  note:'This single square root sets the price of every poll and every experiment: to halve the uncertainty, quadruple the data; for one more decimal place, multiply it by a hundred. Independence is the hypothesis that fails in practice — correlated draws do not average away.',
  see:'prob:1.1', seeLabel:'The spread falls as 1/√n' })}

<h3 id="b4">Regression</h3>
<p>Minimising <span class="mth">Σ(<i>y<sub>i</sub></i> − <i>mx<sub>i</sub></i> − <i>b</i>)²</span> and setting both partial derivatives to zero gives</p>
<div class="eqb"><span class="mth"><i>m</i> <span class="op">=</span> <span class="frac"><span class="nm">Σ(<i>x<sub>i</sub></i>−x̄)(<i>y<sub>i</sub></i>−ȳ)</span><span class="den">Σ(<i>x<sub>i</sub></i>−x̄)²</span></span> , &nbsp;&nbsp; <i>b</i> <span class="op">=</span> ȳ <span class="op">−</span> <i>m</i>x̄</span></div>
<p>so the line always passes through the centroid of the data. This is the critical-point method of the partial-derivatives wing; the vector-spaces wing reaches the identical line by orthogonal projection onto the column space. Three routes, one line.</p>
<p>The total variation then splits exactly:</p>
<div class="eqb"><span class="mth">SS<sub>tot</sub> <span class="op">=</span> SS<sub>reg</sub> <span class="op">+</span> SS<sub>res</sub> , &nbsp;&nbsp; <i>r</i>² <span class="op">=</span> SS<sub>reg</sub>/SS<sub>tot</sub></span></div>
<p>and that identity is what makes <span class="mth"><i>r</i>²</span> interpretable as a fraction at all. It is <em>the share of the variance the line accounts for</em> — a ratio of variances, not a verdict.</p>

<h3 id="b5">What statistics cannot do</h3>
<ul>
  <li><strong>A fitted line is not evidence of a relationship.</strong> The software always returns one. Feed it pure noise and it produces a slope, an intercept and a centroid; only <span class="mth"><i>r</i>²</span> notices there is nothing there.</li>
  <li><strong>Correlation is not causation</strong>, and no amount of <span class="mth"><i>r</i>²</span> changes that.</li>
  <li><strong>A better fit is not a better model.</strong> Adding parameters always reduces the residual; with as many as there are data points the curve interpolates exactly and predicts nothing.</li>
  <li><strong>Extrapolation is not interpolation.</strong> Nothing in the fit constrains behaviour outside the range of the data.</li>
  <li><strong>Least squares is a choice.</strong> Squaring the errors makes one distant outlier outweigh many small ones — sometimes what you want, often not.</li>
</ul>
`;

const THEORY_NUMER = `
<div class="toc"><a href="#m0">The subject</a><a href="#m1">Root finding</a>
<a href="#m2">Order of convergence</a><a href="#m3">Floating point</a>
<a href="#m4">Conditioning</a></div>

<h3 id="m0">What numerical analysis is about</h3>
<p>Mathematics says a limit is exact. Arithmetic says there is a floor and a budget. Numerical analysis lives in the gap: given finite precision and finite time, how close can you get, how fast, and how would you know?</p>
<p>Two errors compete in almost every method. <strong>Truncation error</strong> comes from replacing an infinite process with a finite one and falls as the step shrinks. <strong>Rounding error</strong> comes from finite precision and usually <em>grows</em> as the step shrinks. The best answer sits where they cross, and knowing where that is <em>is</em> the subject.</p>

<h3 id="m1">Root finding, and the price of speed</h3>
<ul>
  <li><strong>Bisection</strong> — needs only continuity and a sign change. Halves the bracket every step: linear, one binary digit per step, and it <em>cannot</em> fail.</li>
  <li><strong>Newton</strong> — uses the tangent. Error squares each step, so correct digits double. But it needs a derivative, and the promise is local.</li>
  <li><strong>Secant</strong> — Newton with the derivative replaced by a difference of the last two iterates. Order <span class="mth">≈1.618</span>, the golden ratio, and one function evaluation per step instead of two.</li>
</ul>
<p>Newton's rate comes straight from Taylor. Expanding about the current iterate and using <span class="mth"><i>f</i>(<i>x</i>*) = 0</span>:</p>
<div class="eqb"><span class="mth"><i>e</i><sub>n+1</sub> <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i>″(ξ)</span><span class="den">2<i>f</i>′</span></span> <i>e</i><sub>n</sub>²</span></div>
<p>The method solves the expansion with the quadratic term dropped, so the error left over is exactly what that term was worth. The same formula contains the warning: if <span class="mth"><i>f</i>′</span> is small near the root the constant is huge, and if you start far away the expansion is worthless. The stage shows Newton diverging on <span class="mth">arctan <i>x</i></span> for that reason. Serious solvers bracket first and switch to Newton only when close.</p>

${stThm("Newton's method converges quadratically", {
  hyp:'<span class="mth"><i>f</i></span> is twice continuously differentiable, <span class="mth"><i>f</i>(<i>x</i>*) = 0</span>, <span class="mth"><i>f</i>′(<i>x</i>*) ≠ 0</span>, and <span class="mth"><i>x</i><sub><i>n</i></sub></span> is close enough to <span class="mth"><i>x</i>*</span>',
  then:'the errors <span class="mth"><i>e</i><sub><i>n</i></sub> = <i>x</i><sub><i>n</i></sub> − <i>x</i>*</span> satisfy',
  eq:'<i>e</i><sub><i>n</i>+1</sub> <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i>″(ξ)</span><span class="den">2<i>f</i>′(<i>x</i><sub><i>n</i></sub>)</span></span> <i>e</i><sub><i>n</i></sub>²',
  proof:`<p>Expand <span class="mth"><i>f</i></span> about <span class="mth"><i>x</i><sub><i>n</i></sub></span> with a Lagrange remainder, evaluated at the root:</p>
${stEq('0 <span class="op">=</span> <i>f</i>(<i>x</i>*) <span class="op">=</span> <i>f</i>(<i>x</i><sub><i>n</i></sub>) <span class="op">+</span> <i>f</i>′(<i>x</i><sub><i>n</i></sub>)(<i>x</i>* <span class="op">−</span> <i>x</i><sub><i>n</i></sub>) <span class="op">+</span> ½<i>f</i>″(ξ)(<i>x</i>* <span class="op">−</span> <i>x</i><sub><i>n</i></sub>)²')}
<p>for some <span class="mth">ξ</span> between them. Writing <span class="mth"><i>e</i><sub><i>n</i></sub> = <i>x</i><sub><i>n</i></sub> − <i>x</i>*</span>, so that <span class="mth"><i>x</i>* − <i>x</i><sub><i>n</i></sub> = −<i>e</i><sub><i>n</i></sub></span>:</p>
${stEq('0 <span class="op">=</span> <i>f</i>(<i>x</i><sub><i>n</i></sub>) <span class="op">−</span> <i>f</i>′(<i>x</i><sub><i>n</i></sub>) <i>e</i><sub><i>n</i></sub> <span class="op">+</span> ½<i>f</i>″(ξ) <i>e</i><sub><i>n</i></sub>²')}
<p>Divide by <span class="mth"><i>f</i>′(<i>x</i><sub><i>n</i></sub>)</span>, which is nonzero near the root by continuity, and rearrange:</p>
${stEq('<i>e</i><sub><i>n</i></sub> <span class="op">−</span> <span class="frac"><span class="nm"><i>f</i>(<i>x</i><sub><i>n</i></sub>)</span><span class="den"><i>f</i>′(<i>x</i><sub><i>n</i></sub>)</span></span> <span class="op">=</span> <span class="frac"><span class="nm"><i>f</i>″(ξ)</span><span class="den">2<i>f</i>′(<i>x</i><sub><i>n</i></sub>)</span></span> <i>e</i><sub><i>n</i></sub>²')}
<p>The left-hand side is exactly <span class="mth"><i>x</i><sub><i>n</i></sub> − <i>f</i>/<i>f</i>′ − <i>x</i>*</span>, which is <span class="mth"><i>x</i><sub><i>n</i>+1</sub> − <i>x</i>* = <i>e</i><sub><i>n</i>+1</sub></span>. That is the claim.</p>
<p>So the error is squared each step and correct digits roughly double. The derivation also states the price: the constant carries <span class="mth"><i>f</i>′</span> in the denominator, so a flat root makes it enormous, and the Taylor expansion is only trustworthy nearby — which is why the guarantee is local and why the lab can show the iteration running away.</p>`,
  note:'Both hypotheses bite. At a repeated root f′(x*) = 0 and convergence drops to linear. Far from the root the expansion is worthless, and the lab includes a cubic on which Newton falls into a two-cycle and never converges, with no warning at all.',
  see:'numer:0.1', seeLabel:'Newton: the error squares' })}

<h3 id="m2">Order, measured rather than quoted</h3>
<p>If the error behaves like <span class="mth"><i>Ch</i><sup>k</sup></span>, halving <span class="mth"><i>h</i></span> divides it by <span class="mth">2<sup>k</sup></span>, so</p>
<div class="eqb"><span class="mth"><i>k</i> <span class="op">=</span> log<sub>2</sub> <span class="frac"><span class="nm"><i>E</i>(<i>h</i>)</span><span class="den"><i>E</i>(<i>h</i>/2)</span></span></span></div>
<p>Left endpoints give 1, trapezoid and midpoint 2, Simpson 4. Measuring rather than quoting is better twice over: it confirms the theory, and it reveals when the theory does not apply. On <span class="mth">√<i>x</i></span> at the origin the derivatives are unbounded and Simpson quietly drops to about 1.5 — a fact no table would tell you.</p>
<p>Simpson deserves a note. It fits a parabola through each pair of panels, so you would expect order 3; the symmetry of the fit makes the cubic term cancel for free, giving 4. Getting a whole order for nothing is why it is the default rule almost everywhere.</p>

<h3 id="m3">Floating point</h3>
<p>Doubles carry about 16 significant digits, so <span class="mth">ε ≈ 2.2×10<sup>−16</sup></span>. Two consequences dominate practice.</p>
<p><strong>Catastrophic cancellation.</strong> Subtracting nearly equal numbers keeps their errors and throws away their agreement. The classic victim is a difference quotient: the truncation error falls as <span class="mth"><i>h</i>²</span> but the rounding error grows as <span class="mth">ε/<i>h</i></span>, so the total is minimised near <span class="mth"><i>h</i> ≈ ε<sup>1/3</sup> ≈ 10<sup>−5</sup></span>, and past that point <em>a smaller step makes the answer worse</em>. No choice of <span class="mth"><i>h</i></span> gets more than about ten good digits.</p>
<p>That is why this laboratory differentiates symbolically wherever it can, and why the relativity wing computes several quantities in closed form with unit tests that assert the naive subtraction is measurably wrong.</p>

<h3 id="m4">Conditioning</h3>
<p>A problem is <strong>ill-conditioned</strong> when its answer is hypersensitive to its input, and that is a property of the problem, not of your algorithm. The eigenvalue wing measures it as the condition number <span class="mth">σ<sub>1</sub>/σ<sub>n</sub></span> from the SVD: a matrix can have determinant 1 and still be hopelessly ill-conditioned, which is why numerical analysts look at singular values rather than determinants.</p>
<p>No algorithm, however careful, recovers digits that the problem itself has destroyed. The most a <em>stable</em> algorithm promises is that it returns the exact answer to a nearby problem — and whether that is good enough is a question about the conditioning, not about the code.</p>
`;
