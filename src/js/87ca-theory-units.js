/* ============================================================================
   THEORY — UNITS, DIMENSIONS & UNCERTAINTY  (Programme C wing C3)
   Every physics wing in this laboratory prints numbers to eight digits and
   nothing anywhere says which of those digits mean anything. This essay is the
   missing page: what a dimension is (a vector), what a unit is (a vector and a
   scale), how far counting alone can take you (Buckingham), and what survives
   arithmetic (very little, and one operation destroys it).
   ============================================================================ */
const THEORY_UNITS = `
<div class="toc"><a href="#s0">Why this comes first</a><a href="#s1">A dimension is a vector</a>
<a href="#s2">Homogeneity</a><a href="#s3">Buckingham</a><a href="#s4">What it cannot do</a>
<a href="#s5">Significant figures</a><a href="#s6">Cancellation</a><a href="#s7">Propagation</a>
<a href="#s8">When the formula fails</a></div>

<h3 id="s0">Why this sits in front of the physics</h3>
<p>Everything downstream of this wing prints numbers. A stage will tell you that the flux through a cylinder is <span class="mth">6.283185307</span> and that the residual against the divergence theorem is <span class="mth">4.1×10⁻¹⁴</span>, and both of those are honest, and neither is a measurement. This wing is about the difference.</p>
<p>Three separate questions get confused under the heading "units", and they have three different answers:</p>
<ul>
<li><strong>What kind of quantity is this?</strong> A vector of seven exponents. Two quantities with different vectors can never be added, and no change of units will ever make them addable.</li>
<li><strong>How far can I get by counting alone?</strong> Surprisingly far — as far as the size of an atom, and as far as the yield of the Trinity device — and then it stops, sharply, at a pure number.</li>
<li><strong>How much of the number do I believe?</strong> Fewer digits than are printed, and the arithmetic you do to it can destroy the ones that were real.</li>
</ul>

<h3 id="s1">A dimension is a vector, and this is not a figure of speech</h3>
<p>SI fixes seven base dimensions — mass, length, time, current, temperature, amount and luminous intensity — and every physical quantity is a product of powers of them. Write those powers as a list and you have the quantity's <strong>dimension vector</strong>.</p>
<div class="eqb"><span class="mth"><i>d</i>(<i>ab</i>) <span class="op">=</span> <i>d</i>(<i>a</i>) <span class="op">+</span> <i>d</i>(<i>b</i>), &nbsp;&nbsp; <i>d</i>(<i>a</i><sup><i>n</i></sup>) <span class="op">=</span> <i>n</i> <i>d</i>(<i>a</i>)</span></div>
<p>Those two lines are the axioms of a vector space over the rationals, with the seven base dimensions as a basis. Not "like" a vector space — one. Everything in the rest of this essay is linear algebra from the vector-spaces wing, applied to a space whose coordinates happen to be labelled kilogram and metre.</p>
<p>The rationals matter and the integers will not do. <span class="mth">√(<i>L</i>/<i>g</i>)</span> is a time, and getting there passes through <span class="mth"><i>L</i><sup>½</sup><i>T</i><sup>−1</sup></span>. Insisting on whole powers would make the pendulum inexpressible.</p>

${stDefn('Dimension vector', `<p>For a quantity <span class="mth">q</span>, the vector <span class="mth"><i>d</i>(q) ∈ ℚ⁷</span> whose entries are the powers of mass, length, time, current, temperature, amount and luminous intensity in <span class="mth">q</span>. Quantities with <span class="mth"><i>d</i> = 0</span> are <strong>dimensionless</strong>.</p>
<p>A <em>unit</em> carries one further piece of data: a positive scale factor. The kilometre and the metre have the same dimension vector and differ by a factor of 1000 — which is exactly why converting units can never change whether an equation is true.</p>`,
  { see:'units:unDim' })}

<p>The wing computes that vector twice, by routes sharing nothing but the tokenizer. The first walks the expression adding exponents. The second gives the seven base units the numerical values 2, 3, 5, 7, 11, 13 and 17 raised to assorted powers, evaluates the expression as an <em>ordinary product of numbers</em> — so the value comes out as <span class="mth">∏λ<sub>i</sub><sup>d<sub>i</sub></sup></span> — and recovers the exponents by solving a 7 × 7 linear system in the logarithms. A sign error in "dividing subtracts exponents" cannot survive being checked by actually dividing.</p>
<p>The scaling factors are chosen rather than drawn at random, and the reason generalises. The matrix of that system is made of logarithms of the chosen numbers; logarithms of distinct primes are rationally independent, so it is never singular. A random draw would occasionally be near-singular and produce a check that fails intermittently for no physical reason. Conditioning the problem by choosing the data is cheaper than solving a badly conditioned one.</p>

<h3 id="s2">Homogeneity, and the logical shape of what it buys</h3>
<p>A physical law cannot depend on whether lengths are recorded in metres or in feet. Rescale the metre and every term multiplies by some power of the change; if two terms carry different powers, their sum changes in a way no single rescaling can absorb, and the equation would hold in one system of units and fail in another. No law does that. Hence:</p>

${stThm('Dimensional homogeneity', {
  hyp:'an equation between physical quantities holds in every system of units',
  then:'every additive term in it has the same dimension vector — and in particular, the argument of any sine, exponential or logarithm is dimensionless',
  proof:`<p>Suppose two terms <span class="mth">A</span> and <span class="mth">B</span> appear in the same sum with <span class="mth"><i>d</i>(A) ≠ <i>d</i>(B)</span>. Choose a base dimension <span class="mth">i</span> where they differ and rescale that base unit by <span class="mth">λ</span>. The numerical values become <span class="mth">λ<sup>−d<sub>i</sub>(A)</sup>A</span> and <span class="mth">λ<sup>−d<sub>i</sub>(B)</sup>B</span>, so the sum is multiplied by no single factor and the equation cannot hold for all <span class="mth">λ</span> unless one of the terms vanishes identically.</p>
<p>For the second clause, expand the function in a power series: <span class="mth">e<sup>x</sup> = 1 + x + x²/2 + …</span> is a sum of terms with dimension vectors <span class="mth">0, <i>d</i>(x), 2<i>d</i>(x), …</span>, and these are all equal only when <span class="mth"><i>d</i>(x) = 0</span>.</p>`,
  note:'This is why log(t) with t in seconds is meaningless and log(t/t₀) is not — a rule that looks pedantic until the first time it catches a missing scale.',
  see:'units:unHomog', seeLabel:'F = ma, as the control' })}

<p>The theorem is a <strong>necessary</strong> condition and emphatically not a sufficient one, and the distinction is the whole logic of the method. Every dimensionless factor is invisible to it: a ½, a 2π, a factor of 137, a drag coefficient. <span class="mth">E = mc²</span> and <span class="mth">E = ½mv²</span> have identical dimension vectors, so no amount of dimensional checking separates relativity from a rolling ball — and neither separates either from <span class="mth">E = 4πmc²</span>.</p>
<p>What it does, unfailingly and in seconds, is throw out the impossible. A dropped exponent, a reciprocal written the wrong way up, a term that was never a term. It requires no understanding of the derivation that produced the line, which is precisely what makes it worth applying to every line you write.</p>

<h3 id="s3">Buckingham's theorem — the counting, done properly</h3>
<p>Suppose a physical relationship involves <span class="mth"><i>n</i></span> quantities. Build the <strong>dimension matrix</strong> <span class="mth">D</span> with one column per quantity and one row per base dimension. Then the product <span class="mth">∏ x<sub>j</sub><sup>a<sub>j</sub></sup></span> is dimensionless exactly when <span class="mth">D<b>a</b> = 0</span> — so the dimensionless combinations are the <em>null space of D</em>, and the question "how many independent ones are there" is rank–nullity.</p>

${stThm('Buckingham Π theorem', {
  hyp:'a physical relationship among <span class="mth"><i>n</i></span> quantities whose dimension matrix <span class="mth">D</span> has rank <span class="mth"><i>r</i></span>',
  then:'the relationship can be written as a relation among exactly <span class="mth"><i>n</i> − <i>r</i></span> independent dimensionless groups',
  eq:'<i>f</i>(x₁, …, x<sub><i>n</i></sub>) <span class="op">=</span> 0 &nbsp; ⟺ &nbsp; <i>F</i>(Π₁, …, Π<sub><i>n</i>−<i>r</i></sub>) <span class="op">=</span> 0',
  proof:`<p>A product of powers is dimensionless precisely when its exponent vector lies in <span class="mth">ker D</span>, and <span class="mth">dim ker D = n − r</span> by rank–nullity. Choose any basis <span class="mth">a<sup>(1)</sup>, …, a<sup>(n−r)</sup></span> of that kernel and let <span class="mth">Π<sub>k</sub> = ∏ x<sub>j</sub><sup>a<sup>(k)</sup><sub>j</sub></sup></span>.</p>
<p>Because <span class="mth">D</span> has rank <span class="mth">r</span>, some <span class="mth">r</span> of the quantities have independent dimension vectors; use them to rescale the base units so that all <span class="mth">r</span> become 1. In those units every remaining quantity equals one of the <span class="mth">Π</span>, and the original relation — which must hold in every system of units, by the homogeneity theorem — becomes a relation among the <span class="mth">Π</span> alone.</p>`,
  note:'The groups are not unique: any product of powers of one basis is another basis. What IS unique is how many there are. A textbook printing a different-looking pair from this wing is not disagreeing with it.',
  see:'units:unPi', seeLabel:'The pendulum: the mass cannot matter' })}

<p>Two consequences are worth extracting, because they are where the theorem earns its keep.</p>
<p><strong>A variable can be ruled out by counting.</strong> A pendulum's period can depend on the length, gravity and the bob's mass; the mass is the only quantity in that list carrying a kilogram, so no dimensionless group can contain it, so the period does not depend on it. That is a genuine physical prediction, obtained without solving anything and without an experiment. Galileo needed one.</p>
<p><strong>The rank, not the number of dimensions present.</strong> It is tempting to count the base dimensions that appear and subtract that. That is right only when the rows are independent. If every quantity in the list happens to carry mass and length in the same fixed ratio, two rows are proportional, the rank is one less, and there is one <em>more</em> group than the shortcut predicts. The matrix knows; the shortcut is guessing.</p>

<h4>Two cases where the counting gets the whole answer</h4>
<p>A transverse wave on a string can depend on the tension and the mass per unit length. Three quantities, rank 2, one group: <span class="mth"><i>v</i>²μ/F</span>. The physics supplies no numerical factor at all, so <span class="mth"><i>v</i> = √(F/μ)</span> exactly — dimensional analysis has produced the entire law. This is luck rather than method; nothing in the argument said the constant would not be 7.</p>
<p>The second case is more startling. An atom is made of an electron mass <span class="mth"><i>m</i><sub>e</sub></span>, a Coulomb strength <span class="mth"><i>ke</i>²</span> and Planck's constant <span class="mth">ħ</span>. Four quantities including the size itself, rank 3, one group: <span class="mth"><i>a m</i><sub>e</sub><i>ke</i>²/ħ²</span>. Setting it to 1 gives</p>
<div class="eqb"><span class="mth"><i>a</i>₀ <span class="op">=</span> ħ²/<i>m</i><sub>e</sub><i>ke</i>² <span class="op">=</span> 5.29177×10⁻¹¹ m</span></div>
<p>which is the measured size of a hydrogen atom, to every digit CODATA publishes. No wavefunction is solved and no orbit is postulated. It also says <em>why</em> the atom is that size: <span class="mth">ħ²</span> sits in the numerator, so the size is a quantum effect, and <span class="mth">ħ → 0</span> collapses the atom to a point. That is the classical catastrophe stated arithmetically, and it took one rank and one null vector.</p>

<h4>Trinity</h4>
<p>An intense explosion in air involves the fireball radius, the energy released, the density of the air and the time. Four quantities, rank 3, one group: <span class="mth">R⁵ρ/E<i>t</i>²</span>. So the radius must grow as <span class="mth"><i>t</i><sup>2/5</sup></span>, whatever the details of the flow.</p>
<p>G. I. Taylor read radii off Mack's published photographs of the Trinity test, plotted <span class="mth">log R</span> against <span class="mth">log <i>t</i></span>, measured the slope — it is 0.4 — and read the energy off the intercept. The yield was classified at the time; he published it. The wing reproduces the plot with his numbers.</p>
<p>Read the two results separately, because they came from different places. The <strong>slope</strong> is dimensional analysis alone, and the data confirm it. The <strong>energy</strong> needs one more number that the counting cannot give: Sedov's similarity constant <span class="mth">ξ₀ = 1.033</span> for <span class="mth">γ = 1.4</span>, which comes from solving the flow equations. Counting got the shape; a differential equation got the size. That division is the honest summary of the whole method.</p>

<h3 id="s4">Where the method stops, and how it fails</h3>
<p>With one group the physics reads <span class="mth">Π₁ = constant</span> and the constant needs an experiment or a solved equation. With two it reads <span class="mth">Π₁ = f(Π₂)</span> and a whole function needs measuring. Dimensional analysis has <em>reduced</em> the unknown; it has never removed it.</p>
<p>That reduction is worth more in engineering than in physics. Drag on a sphere involves five quantities, so a law would be a surface in four dimensions and measuring it is a career. In two groups it is a curve in one variable — <span class="mth">C<sub>d</sub></span> against the Reynolds number — and measuring it is an afternoon. No information was created; the collapse is a change of coordinates. But one of the two can be plotted, and only one of them lets a model at 1:50 scale predict the full-size object, which is what makes wind tunnels and towing tanks possible at all.</p>
<p>The method's failure mode is a missing variable and it is silent. Leave out something the physics needs and you get one group too few, and a confident answer that is wrong. Nothing in the arithmetic can know what you did not type. This is the same shape as every other silent failure in this laboratory — a loop over an empty collection, a preset whose zero hides the term it multiplies — and the defence is the same: check the answer against something that did not come from the same list.</p>

<h3 id="s5">Significant figures — a statement about ratio</h3>
<p>Rounding to <span class="mth">k</span> figures promises the value to within half a unit in the last place, which is to say to within roughly <span class="mth">5×10⁻ᵏ</span> of <em>itself</em>:</p>
<div class="eqb"><span class="mth">|<i>x</i> <span class="op">−</span> round<sub><i>k</i></sub>(<i>x</i>)| <span class="op">≤</span> ½ <span class="op">×</span> 10<sup><i>e</i>−<i>k</i>+1</sup>, &nbsp;&nbsp; <i>e</i> <span class="op">=</span> ⌊log₁₀|<i>x</i>|⌋</span></div>
<p>A figure is a digit of ratio, not of size — three figures means the same fractional ignorance on a proton radius as on a galaxy. That portability is what makes the notion worth having.</p>
<p>It is also what makes <span class="mth">1200</span> ambiguous: nothing in the numeral says whether the zeros were measured. Scientific notation exists to answer that, and <span class="mth">1.20×10³</span> is the only unambiguous way to write three figures.</p>
<p>The reporting rule is one sentence: <strong>the first uncertain digit is the last one worth writing.</strong> Writing more is a claim about digits nobody measured; writing fewer discards something that was measured. Both are errors and only the first is common.</p>
<p>This laboratory violates that rule constantly and deliberately, which is worth explaining rather than hiding. When a panel prints a residual to ten digits it is not reporting a measurement — it is showing that two independent routes to the same quantity agree down to the last bit float64 carries. A residual is diagnostic and wants every digit. A physical result is a claim and stops where the uncertainty starts.</p>

<h3 id="s6">The one operation that destroys precision</h3>
<p>Multiplication and division combine <em>relative</em> errors and are therefore blind to scale:</p>
<div class="eqb"><span class="mth">δ(<i>ab</i>)/<i>ab</i> <span class="op">≈</span> δ<i>a</i>/<i>a</i> <span class="op">+</span> δ<i>b</i>/<i>b</i></span></div>
<p>Addition and subtraction combine <em>absolute</em> ones, and are therefore blind to nothing else:</p>
<div class="eqb"><span class="mth">δ(<i>a</i> <span class="op">±</span> <i>b</i>) <span class="op">≈</span> δ<i>a</i> <span class="op">+</span> δ<i>b</i></span></div>
<p>For a sum that is harmless. For a difference of near-equals it is a catastrophe, because the relative error is that absolute error divided by an answer that has become small:</p>
<div class="eqb"><span class="mth">δ(<i>a</i>−<i>b</i>)/|<i>a</i>−<i>b</i>| <span class="op">=</span> [ (|<i>a</i>|+|<i>b</i>|) / |<i>a</i>−<i>b</i>| ] <span class="op">×</span> (relative error in)</span></div>
<p>That amplification factor is the <strong>condition number of the problem</strong>. It belongs to the question, not to the algorithm: no method computing <span class="mth"><i>a</i> − <i>b</i></span> from rounded inputs can do better, because the information is no longer present in the inputs. The numerical-methods wing draws exactly this distinction — an unstable algorithm can be replaced, an ill-conditioned problem cannot.</p>
<p>The cure is never more precision. It is to rearrange so the subtraction does not happen: <span class="mth">√(x+1) − √x</span> becomes <span class="mth">1/(√(x+1) + √x)</span>; the bad root of a quadratic becomes <span class="mth">c/(a r₁)</span>; a difference of two integrals becomes one integral of a difference. In each case the cancellation is done symbolically, where it is exact, instead of numerically, where it is not.</p>

<h3 id="s7">Propagation of uncertainty, and the one truncation it rests on</h3>
<p>Expand <span class="mth"><i>f</i></span> about the nominal point and keep the linear term:</p>
<div class="eqb"><span class="mth"><i>f</i>(<b>x</b> <span class="op">+</span> δ) <span class="op">=</span> <i>f</i>(<b>x</b>) <span class="op">+</span> ∑<sub><i>i</i></sub> (∂<i>f</i>/∂<i>x</i><sub><i>i</i></sub>) δ<sub><i>i</i></sub> <span class="op">+</span> O(δ²)</span></div>
<p>Taking the variance of what is left, and assuming the inputs are independent so the covariances vanish:</p>

${stThm('First-order propagation of uncertainty', {
  hyp:'<span class="mth"><i>f</i></span> differentiable at <span class="mth"><b>x</b></span>, the <span class="mth">δ<sub><i>i</i></sub></span> independent with standard deviations <span class="mth">σ<sub><i>i</i></sub></span>, and <span class="mth"><i>f</i></span> effectively linear over a few <span class="mth">σ</span>',
  then:'the standard deviation of <span class="mth"><i>f</i></span> is',
  eq:'σ<sub><i>f</i></sub> <span class="op">=</span> √( ∑<sub><i>i</i></sub> (∂<i>f</i>/∂<i>x</i><sub><i>i</i></sub> · σ<sub><i>i</i></sub>)² )',
  proof:`<p>Write <span class="mth">c<sub>i</sub> = ∂f/∂x<sub>i</sub></span>. For the linearised function, <span class="mth">f − f(<b>x</b>) = ∑c<sub>i</sub>δ<sub>i</sub></span>, and</p>
<div class="eqb"><span class="mth">Var(∑c<sub>i</sub>δ<sub>i</sub>) <span class="op">=</span> ∑c<sub>i</sub>²Var(δ<sub>i</sub>) <span class="op">+</span> 2∑<sub>i&lt;j</sub>c<sub>i</sub>c<sub>j</sub>Cov(δ<sub>i</sub>, δ<sub>j</sub>)</span></div>
<p>Independence kills the second sum, leaving <span class="mth">∑c<sub>i</sub>²σ<sub>i</sub>²</span>.</p>`,
  note:'Two hypotheses get dropped in practice and they fail differently. Independence failing brings the covariance terms back — which is exactly what a systematic error is, and why it does not average away. Linearity failing is the subject of the next section.',
  see:'units:unProp', seeLabel:'g from a pendulum, and which instrument to improve' })}

<p>Errors adding in quadrature rather than linearly is a claim about independence, and it is what makes averaging work: ten equally bad readings give a mean <span class="mth">√10</span> times better rather than no better at all. The wing derives that <span class="mth">√n</span> rather than quoting it, and in that one case the propagation is exact — the mean is linear, so there is no second-order term to drop.</p>
<p>The other thing the formula produces is more practically useful than the error bar. Each term's <em>share of the variance</em> says which measurement to improve. In the pendulum the period enters squared, so it owns four times its naive share and about 80% of the total; halving the uncertainty in the length shrinks the error bar by 7.8%, and halving it in the period shrinks it by 37%. A power law multiplies a relative error by its exponent, and where to spend the next hour follows from the exponents rather than from which instrument feels cruder.</p>

<h3 id="s8">Where the formula stops being true, and how to find out</h3>
<p>The formula's only approximation is the truncation. Where <span class="mth"><i>f</i></span> curves appreciably over a few <span class="mth">σ</span>, the dropped quadratic term is not small and the symmetric <span class="mth">±</span> is not describing the distribution that exists. The wing checks this by <strong>sampling</strong>: draw the inputs from their own distributions, push them through <span class="mth"><i>f</i></span>, and look at what comes out.</p>
<p>Two things then appear that the linear route cannot see. The distribution can be <em>skewed</em> — <span class="mth">e<sup>−λt</sup></span> with a large <span class="mth">σ<sub>λ</sub></span> has a hard floor at zero and a long tail upward, and no symmetric error bar describes that. And the mean can be <em>biased</em>: <span class="mth">E[<i>f</i>(x)] ≠ <i>f</i>(E[x])</span> for a curved <span class="mth"><i>f</i></span>, so the answer is not even centred where the calculation put it.</p>
<p>The comparison between the two routes is only meaningful with one further number. A Monte Carlo standard deviation is itself uncertain, by about <span class="mth">σ/√(2N)</span>, so "the routes differ by 1%" says nothing on its own: at ten thousand draws that is noise and at ten million it is a defect. The wing reports the gap in units of that sampling error. This is the same discipline as printing a residual with its scale — a difference means nothing until you know what to compare it against — and it gives the same diagnostic test used throughout this laboratory: <strong>change the resolution and see what moves.</strong> Sampling noise falls as <span class="mth">1/√N</span>; a broken linearisation does not move at all.</p>
<p>One case is worse than approximate and is worth meeting deliberately. If a denominator can reach zero within its own error bar, the ratio has Cauchy-like tails and possesses neither a finite mean nor a finite variance. The Monte Carlo standard deviation is then not converging slowly — it is not converging, because there is nothing for it to converge to. From inside a computer that looks like a number that keeps wandering while the sampling error printed beside it keeps shrinking, and it is the sharpest available warning against reading a standard deviation without first asking whether the thing it estimates exists.</p>
`;
