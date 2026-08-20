/* ============================================================================
   THEORY — STATISTICAL INFERENCE  (Programme C wing C14)

   The probability wing is about distributions that are given. This page is
   about the inverse problem, and its whole difficulty is that the answer is
   never a number but always a distribution over numbers — which is why almost
   every result here is misquoted in the same way, as a statement about the
   parameter when it is a statement about the procedure.
   ============================================================================ */
const THEORY_INFER = `
<div class="toc"><a href="#s0">The inverse problem</a><a href="#s1">Estimators</a>
<a href="#s2">Likelihood</a><a href="#s3">Information</a><a href="#s4">Intervals</a>
<a href="#s5">Testing</a><a href="#s6">Many tests</a><a href="#s7">Posteriors</a>
<a href="#s8">What to actually do</a></div>

<h3 id="s0">The inverse problem, and the object that answers it</h3>
<p>Probability runs forwards: given a distribution, what do samples from it look like. Inference runs backwards: given the samples, what can be said about the distribution. The second is not the first rearranged — it is a different subject, and its central difficulty appears immediately.</p>
<p>Compute <span class="mth"><i>x̄</i></span> from a sample and you have a number. Ask how wrong it is and there is nothing in the sample to answer with, because the same recipe applied to the sample you would have collected on a different day gives a different number. The quantity that answers the question is therefore not a property of your data at all; it is a property of the <strong>collection of values the recipe would produce over all the samples that could have arisen</strong>.</p>

${stDefn('Sampling distribution', `<p>For an estimator <span class="mth"><i>θ̂</i></span> — any function of the data — the <strong>sampling distribution</strong> is the distribution of <span class="mth"><i>θ̂</i>(<i>X</i>₁, …, <i>X</i>ₙ)</span> induced by the distribution of the data.</p>
<p>Its centre relative to <span class="mth"><i>θ</i></span> is the <strong>bias</strong>; its spread is the <strong>standard error</strong>. Neither is computable from one sample without further assumptions, and every claim in this wing is a claim about this object.</p>`,
  { see:'infer:snEst', seeLabel:'See it built, twelve thousand experiments at a time' })}

<p>That definition is the reason the first stage of this wing draws a histogram of one number per repetition of an entire experiment, rather than a histogram of data. Everything else follows from having that picture available.</p>

<h3 id="s1">Estimators: bias, variance, and the criterion that is usually wrong</h3>
<p>An estimator is <strong>unbiased</strong> when its sampling distribution is centred on the truth. This is the property introductory courses optimise, and it is worth seeing early how weak it is.</p>

${stThm('Bessel’s correction is exact, not approximate', {
  hyp:`<span class="mth"><i>X</i>₁, …, <i>X</i>ₙ</span> independent with variance <span class="mth">σ²</span>, and <span class="mth"><i>x̄</i></span> the sample mean`,
  then:`the sum of squared deviations about <span class="mth"><i>x̄</i></span> falls short by exactly one observation’s worth`,
  eq:`E[Σ(<i>x</i>ᵢ − <i>x̄</i>)²] = (<i>n</i> − 1)σ²`,
  proof:`<p>Write <span class="mth"><i>x</i>ᵢ − <i>x̄</i> = (<i>x</i>ᵢ − μ) − (<i>x̄</i> − μ)</span> and expand:</p>
<div class="st-eq mth">Σ(<i>x</i>ᵢ − <i>x̄</i>)² = Σ(<i>x</i>ᵢ − μ)² − <i>n</i>(<i>x̄</i> − μ)²</div>
<p>The cross term vanishes because <span class="mth">Σ(<i>x</i>ᵢ − μ) = <i>n</i>(<i>x̄</i> − μ)</span>. Taking expectations, the first term is <span class="mth"><i>n</i>σ²</span> and the second is <span class="mth"><i>n</i> · σ²/<i>n</i> = σ²</span>, leaving <span class="mth">(<i>n</i> − 1)σ²</span>.</p>
<p>The subtracted term is the whole content: <span class="mth"><i>x̄</i></span> sits closer to its own data than <span class="mth">μ</span> does, by exactly the variance of <span class="mth"><i>x̄</i></span> itself.</p>`,
  note:`So dividing by <span class="mth"><i>n</i> − 1</span> restores an exactly known shortfall. Dividing by <span class="mth"><i>n</i></span> gives a bias of exactly <span class="mth">−σ²/<i>n</i></span> — always downwards, vanishing only in the limit.`,
  see:'infer:snEst'
})}

${stThm('…and the unbiased one is not therefore the better one', {
  hyp:`the mean squared error is taken as the measure of wrongness`,
  then:`it decomposes into two terms, and nothing requires the first to be the one set to zero`,
  eq:`MSE(<i>θ̂</i>) = E[(<i>θ̂</i> − <i>θ</i>)²] = bias² + Var(<i>θ̂</i>)`,
  proof:`<p>Add and subtract <span class="mth">E[<i>θ̂</i>]</span> inside the square:</p>
<div class="st-eq mth">E[((<i>θ̂</i> − E[<i>θ̂</i>]) + (E[<i>θ̂</i>] − <i>θ</i>))²]</div>
<p>The cross term is <span class="mth">2(E[<i>θ̂</i>] − <i>θ</i>)·E[<i>θ̂</i> − E[<i>θ̂</i>]] = 0</span>, since the second factor is zero by construction. What remains is the variance plus the squared bias. ∎ is immediate, and the content is entirely in what it licenses: two non-negative terms, and minimising the sum is not the same as zeroing either.</p>`,
  note:`On a normal sample at <span class="mth"><i>n</i> = 5</span>, the estimator dividing by <span class="mth"><i>n</i></span> is biased and has the <em>smaller</em> mean squared error of the two. The wing measures both.`,
  see:'infer:snEst'
})}

<p>Two smaller facts finish the point. Unbiasedness is not preserved by transformation: <span class="mth"><i>s</i>²</span> is unbiased for <span class="mth">σ²</span> and <span class="mth"><i>s</i> = √<i>s</i>²</span> is not unbiased for <span class="mth">σ</span>, because <span class="mth">√</span> is strictly concave and Jensen’s inequality is therefore strict. And unbiasedness says nothing about efficiency: on a uniform family, <span class="mth">2<i>x̄</i></span> and <span class="mth">(<i>n</i>+1)/<i>n</i> × max</span> are both unbiased for <span class="mth">θ</span>, and the second has variance smaller by a factor <span class="mth">(<i>n</i>+2)/3</span>, which grows without bound.</p>

<h3 id="s2">Likelihood: the same formula, asked a different question</h3>
<p>A density <span class="mth"><i>f</i>(<i>x</i> | θ)</span> answers "given the parameter, how probable is this data". Hold the data fixed and let <span class="mth">θ</span> vary and the same expression answers "how well does each parameter account for what was seen". That is the <strong>likelihood</strong>. It is not a probability distribution over <span class="mth">θ</span>: it does not integrate to one and it is not trying to.</p>
<p>Work is done in logarithms for two reasons. A product of a few hundred densities underflows to exactly zero in floating point — so the logarithm is what makes it computable at all — and, more importantly, independent observations then <em>add</em> their log-likelihoods. That additivity is where every <span class="mth">√<i>n</i></span> in statistics comes from.</p>

${stDefn('Maximum likelihood estimate', `<div class="st-eq mth"><i>θ̂</i> = argmax<sub>θ</sub> ℓ(θ), &nbsp; ℓ(θ) = Σᵢ log <i>f</i>(<i>x</i>ᵢ | θ)</div>
<p>The parameter under which the observed data are least surprising. Where <span class="mth">ℓ</span> is differentiable and the maximum is interior, it solves <span class="mth">ℓ′(θ) = 0</span> — but that is a convenience of the smooth case, not the definition, and a family whose support depends on <span class="mth">θ</span> has its maximum at a discontinuity where no derivative vanishes.</p>`,
  { see:'infer:snLike', seeLabel:'See the curve, and its peak found without any formula' })}

<p>Maximum likelihood is <em>asymptotically</em> unbiased, and the adverb carries weight. For an exponential rate the estimate is <span class="mth">1/<i>x̄</i></span>, and although <span class="mth"><i>x̄</i></span> is unbiased for <span class="mth">1/λ</span>, its reciprocal is not unbiased for <span class="mth">λ</span>: the expectation is <span class="mth"><i>n</i>λ/(<i>n</i>−1)</span>, high by <span class="mth">λ/(<i>n</i>−1)</span>. Averaging and inverting do not commute.</p>

<h3 id="s3">Information, and the bound that makes it matter</h3>
<p>A flat likelihood means many parameter values explain the data about equally well; a sharply curved one means they do not. So the curvature at the peak must be the precision of the estimate — and it is, which is why a single sample can report its own standard error without the experiment ever being repeated.</p>
<p>Two quantities are easily run together here and they are not the same. The <strong>Fisher information</strong> is the expected curvature <em>at the true</em> <span class="mth">θ</span>. The <strong>observed information</strong> is the curvature at the estimate, <span class="mth">−ℓ″(<i>θ̂</i>)</span> — the only one computable from data, since <span class="mth">θ</span> is unknown. They agree in the limit and differ by <span class="mth">O(1/<i>n</i>)</span> at finite <span class="mth"><i>n</i></span>: for an exponential rate <span class="mth">ℓ″ = −<i>n</i>/λ²</span>, so the average at <span class="mth">λ̂</span> is <span class="mth">(<i>n</i>+1)/λ²</span> against a Fisher information of <span class="mth"><i>n</i>/λ²</span>. For a normal mean <span class="mth">ℓ″</span> is a constant and the two coincide exactly — which is why a wing that checks only the normal family sees no difference at all.</p>

${stDefn('Fisher information', `<div class="st-eq mth"><i>I</i>(θ) = E[(∂ℓ/∂θ)²]</div>
<p>The variance of the <strong>score</strong> <span class="mth">∂ℓ/∂θ</span>, whose mean is zero under the regularity conditions below. It is additive over independent observations, so a sample of <span class="mth"><i>n</i></span> carries <span class="mth"><i>n</i>·<i>I</i>(θ)</span>.</p>`,
  { see:'infer:snLike', seeLabel:'See it computed three ways that share nothing' })}

${stThm('The information identity', {
  hyp:`the support of <span class="mth"><i>f</i></span> does not depend on <span class="mth">θ</span>, and differentiation may be exchanged with integration`,
  then:`the variance of the score equals minus the expected curvature`,
  eq:`E[(∂ℓ/∂θ)²] = −E[∂²ℓ/∂θ²]`,
  proof:`<p>Differentiate <span class="mth">∫<i>f</i>(<i>x</i>|θ) d<i>x</i> = 1</span> with respect to <span class="mth">θ</span>. Exchanging the order,</p>
<div class="st-eq mth">∫ ∂<i>f</i>/∂θ d<i>x</i> = ∫ (∂ log <i>f</i>/∂θ) <i>f</i> d<i>x</i> = E[score] = 0</div>
<p>Differentiate a second time:</p>
<div class="st-eq mth">∫ (∂² log <i>f</i>/∂θ²) <i>f</i> + (∂ log <i>f</i>/∂θ)² <i>f</i> d<i>x</i> = 0</div>
<p>which rearranges to the statement. Both steps moved a derivative through an integral sign, and both need the limits of that integral to be free of <span class="mth">θ</span>.</p>`,
  note:`<strong>The hypothesis is not decoration.</strong> On the uniform family <span class="mth">[0, θ]</span> the limits move with the parameter, the exchange is invalid, and the wing measures the two sides disagreeing.`,
  see:'infer:snLike'
})}

${stThm('Cramér–Rao: a floor under every unbiased estimator', {
  hyp:`<span class="mth"><i>θ̂</i></span> unbiased, and the same regularity conditions`,
  then:`its variance cannot be smaller than the reciprocal of the information`,
  eq:`Var(<i>θ̂</i>) ≥ 1 / <i>n</i><i>I</i>(θ)`,
  proof:`<p>Unbiasedness says <span class="mth">E[<i>θ̂</i>] = θ</span>. Differentiating under the integral sign,</p>
<div class="st-eq mth">1 = ∂/∂θ ∫ <i>θ̂</i> <i>f</i> d<i>x</i> = ∫ <i>θ̂</i> (∂ log <i>f</i>/∂θ) <i>f</i> d<i>x</i> = Cov(<i>θ̂</i>, score)</div>
<p>using E[score] = 0 to subtract <span class="mth">θ·0</span>. Cauchy–Schwarz then gives</p>
<div class="st-eq mth">1 = Cov(<i>θ̂</i>, score)² / 1 ≤ Var(<i>θ̂</i>) · Var(score)</div>
<p>and <span class="mth">Var(score) = <i>n</i><i>I</i>(θ)</span>. ∎</p>`,
  note:`Every step differentiated under an integral. On a family whose support depends on <span class="mth">θ</span> the argument does not run and the conclusion is unavailable — the wing exhibits an estimator whose variance is <em>below</em> the bound, which is not a contradiction but a hypothesis being absent.`,
  see:'infer:snLike'
})}

<p>This is where <span class="mth">1/√<i>n</i></span> comes from. The bound falls like <span class="mth">1/<i>n</i></span> in variance, so the standard error of anything achieving it falls like <span class="mth">1/√<i>n</i></span> — and where the bound does not apply, neither does the rate: the adjusted maximum on a uniform family has variance <span class="mth">θ²/<i>n</i>(<i>n</i>+2)</span> and an error falling like <span class="mth">1/<i>n</i></span>.</p>

<h3 id="s4">Confidence: a statement about the procedure</h3>
<p>The parameter is a fixed number. It has no distribution, and once the data are in hand an interval either contains it or does not. So a sentence of the form "<span class="mth">μ</span> lies in [a, b] with probability 0.95" is not available in this framework. What is available is a statement about the recipe.</p>

${stDefn('Confidence interval', `<p>Functions <span class="mth"><i>L</i></span>, <span class="mth"><i>U</i></span> of the data form a <strong>level-γ confidence interval</strong> when</p>
<div class="st-eq mth">P<sub>θ</sub>( <i>L</i>(<i>X</i>) ≤ θ ≤ <i>U</i>(<i>X</i>) ) = γ &nbsp; for every θ</div>
<p>The probability is over the <em>data</em>. The random objects are <span class="mth"><i>L</i></span> and <span class="mth"><i>U</i></span>; <span class="mth">θ</span> is not one of them.</p>`,
  { see:'infer:snCI', seeLabel:'See forty-two intervals and one motionless parameter' })}

${stThm('Substituting s for σ costs more than it appears to', {
  hyp:`normal data, and the interval <span class="mth"><i>x̄</i> ± <i>z</i><sub>γ</sub><i>s</i>/√<i>n</i></span> built with the NORMAL quantile`,
  then:`its true coverage is below <span class="mth">γ</span> at every finite <span class="mth"><i>n</i></span>, by a computable amount`,
  eq:`coverage = P(|<i>T</i><sub>n−1</sub>| < <i>z</i><sub>γ</sub>) = 2F<sub>n−1</sub>(<i>z</i><sub>γ</sub>) − 1`,
  proof:`<p>The interval covers exactly when <span class="mth">|<i>x̄</i> − μ| < <i>z</i><sub>γ</sub> <i>s</i>/√<i>n</i></span>, that is when</p>
<div class="st-eq mth">|(<i>x̄</i> − μ)/(<i>s</i>/√<i>n</i>)| < <i>z</i><sub>γ</sub></div>
<p>The quantity on the left is by definition a <span class="mth"><i>t</i></span> statistic on <span class="mth"><i>n</i> − 1</span> degrees of freedom. So the coverage is the probability that a <span class="mth"><i>t</i></span> falls inside a <em>normal</em> quantile — and since <span class="mth"><i>t</i></span> has heavier tails than the normal, that probability is strictly less than <span class="mth">γ</span>. ∎</p>`,
  note:`At <span class="mth"><i>n</i> = 5</span> and <span class="mth">γ = 0.95</span> this is <strong>87.84%</strong>; at <span class="mth"><i>n</i> = 10</span> it is 91.84%. The cure is the <span class="mth"><i>t</i></span> quantile, which makes the coverage exact at every <span class="mth"><i>n</i></span> rather than asymptotically.`,
  see:'infer:snCI'
})}

<p>For a proportion the sample space is finite, which changes the character of the question entirely: coverage is a sum of at most <span class="mth"><i>n</i>+1</span> binomial terms and can be computed exactly rather than simulated. Doing so reveals that coverage is a <strong>step function of p</strong> — it jumps when an interval’s endpoint crosses <span class="mth"><i>p</i></span> — so no interval for a proportion has exactly its stated coverage at every <span class="mth"><i>p</i></span>. The choice is between falling short sometimes and exceeding always. The textbook Wald interval falls short catastrophically: at <span class="mth"><i>n</i> = 20</span> its worst coverage over <span class="mth"><i>p</i></span> is <strong>2%</strong>, and at <span class="mth"><i>k</i> = 0</span> it has zero width.</p>

<h3 id="s5">Testing, and the conditional that runs the wrong way</h3>
<p>A test assumes the null hypothesis, derives the distribution of a statistic <em>in that assumed world</em>, and asks where the observed value falls in it. Every misreading of a p-value comes from losing track of the direction of that conditional.</p>

${stDefn('p-value', `<div class="st-eq mth"><i>p</i> = P( |<i>T</i>| ≥ |<i>t</i><sub>obs</sub>| &nbsp;|&nbsp; H₀ true )</div>
<p>The probability, <strong>in a world where the null holds</strong>, of a statistic at least as extreme as the one seen. It is not P(H₀ | data), not the size of the effect, and not the probability of replication.</p>`,
  { see:'infer:snTest', seeLabel:'See the assumed world built and run' })}

${stThm('Under the null, p-values are uniform', {
  hyp:`<span class="mth">H₀</span> true and the test statistic continuous`,
  then:`<span class="mth"><i>p</i> ~ Uniform(0, 1)</span>, so the rejection rate is <span class="mth">α</span> at every <span class="mth">α</span> at once`,
  proof:`<p>Let <span class="mth"><i>F</i></span> be the CDF of the statistic under <span class="mth">H₀</span>, and take the one-sided case for clarity, <span class="mth"><i>p</i> = 1 − <i>F</i>(<i>T</i>)</span>. For <span class="mth"><i>u</i> ∈ (0,1)</span>,</p>
<div class="st-eq mth">P(<i>p</i> ≤ <i>u</i>) = P(1 − <i>F</i>(<i>T</i>) ≤ <i>u</i>) = P(<i>T</i> ≥ <i>F</i>⁻¹(1 − <i>u</i>)) = <i>u</i></div>
<p>the last step because <span class="mth"><i>F</i>(<i>T</i>)</span> is itself uniform for continuous <span class="mth"><i>F</i></span> — the probability integral transform. ∎</p>`,
  note:`This is the calibration statement worth checking. Matching <span class="mth">α</span> at one threshold is weak; uniformity says the rate is right at all of them. Discreteness breaks it — which is exactly why exact tests on small samples are conservative rather than exact in coverage.`,
  see:'infer:snTest'
})}

<p><strong>Power</strong> is the other error rate: the chance of rejecting when the null is false. It is a function of how false, so there is no such thing as the power of a test — only its power against a stated effect. It depends on <span class="mth">δ</span>, <span class="mth"><i>n</i></span> and <span class="mth">σ</span> only through <span class="mth">δ√<i>n</i>/σ</span>, from which the design rule follows: halving the effect you wish to detect costs four times the data. A power curve begins at <span class="mth">α</span>, not at zero, because a test with no signal present still fires at its own false-alarm rate.</p>

<h3 id="s6">Many tests, and why the count of questions is part of the method</h3>

${stThm('The family-wise error rate', {
  hyp:`<span class="mth"><i>m</i></span> independent tests, every null true, each at level <span class="mth">α</span>`,
  then:`the chance of at least one rejection is far above <span class="mth">α</span>`,
  eq:`P(at least one) = 1 − (1 − α)<sup><i>m</i></sup>`,
  proof:`<p>Each test independently fails to reject with probability <span class="mth">1 − α</span>, so all <span class="mth"><i>m</i></span> fail to reject with probability <span class="mth">(1 − α)<sup><i>m</i></sup></span>, and the complement is the statement. ∎</p>
<p>At <span class="mth">α = 0.05</span>, <span class="mth"><i>m</i> = 20</span> this is <strong>0.6415</strong>.</p>`,
  note:`No individual test misbehaves — each fires at exactly <span class="mth">α</span>. What changed is the procedure: asking twenty questions and reporting the most striking answer is not the same experiment as asking one.`,
  see:'infer:snTest'
})}

${stThm('Holm dominates Bonferroni', {
  hyp:`p-values <span class="mth"><i>p</i><sub>(1)</sub> ≤ … ≤ <i>p</i><sub>(m)</sub></span> sorted`,
  then:`rejecting while <span class="mth"><i>p</i><sub>(j)</sub> < α/(<i>m</i>−<i>j</i>)</span> controls the family-wise rate at <span class="mth">α</span>, and rejects everything Bonferroni does`,
  proof:`<p><em>Control.</em> Let <span class="mth"><i>H</i></span> be a true null that is rejected, and let <span class="mth"><i>j</i></span> be the first step at which some true null is rejected. At that step, every hypothesis rejected earlier was false, so at least <span class="mth"><i>m</i>₀</span> of the remaining <span class="mth"><i>m</i> − <i>j</i></span> are true where <span class="mth"><i>m</i>₀</span> is the number of true nulls; hence the threshold <span class="mth">α/(<i>m</i>−<i>j</i>) ≤ α/<i>m</i>₀</span>. The probability that any of the <span class="mth"><i>m</i>₀</span> true nulls has a p-value below <span class="mth">α/<i>m</i>₀</span> is at most <span class="mth">α</span> by Boole’s inequality. ∎</p>
<p><em>Domination.</em> The first comparison is against <span class="mth">α/<i>m</i></span>, identical to Bonferroni’s. Every subsequent threshold <span class="mth">α/(<i>m</i>−<i>j</i>)</span> is larger. So any hypothesis Bonferroni rejects is rejected here too.</p>`,
  note:`Same guarantee, strictly more rejections, three lines of code. There is no data set on which Bonferroni is preferable, which makes its status as the default worth questioning.`,
  see:'infer:snTest'
})}

<p>A different tool avoids distributional assumptions altogether. If the group labels carry no information, every way of dealing them was equally likely, so the exact null distribution is the list of all <span class="mth">C(<i>N</i>, <i>n</i>₁)</span> relabellings and the p-value is a count divided by a count. Its floor is instructive: the smallest p-value obtainable is <span class="mth">2/C(<i>N</i>, <i>n</i>₁)</span>, so at four against four nothing below 0.0286 is reachable whatever the data show — a hard statement about how much evidence eight numbers can contain, which a formula-based test conceals by extrapolating into a tail the data cannot resolve.</p>

<h3 id="s7">Posteriors: the question everyone was actually asking</h3>
<p>Nothing above is a probability about the parameter, and readers persistently read all of it as one. Obtaining an actual probability about <span class="mth">θ</span> requires saying what was believed beforehand. There is no way around that, and the theorem is what turns it into arithmetic.</p>

${stDefn('Posterior distribution', `<div class="st-eq mth"><i>f</i>(θ | data) = <i>f</i>(data | θ) <i>f</i>(θ) / ∫ <i>f</i>(data | θ′) <i>f</i>(θ′) dθ′</div>
<p>Prior times likelihood, divided by its own integral. The denominator is the only hard part: in one dimension it is a quadrature, and in many it is the problem that all of computational Bayesian statistics exists to solve.</p>`,
  { see:'infer:snBayes', seeLabel:'See it reached twice — by quadrature and in closed form' })}

${stThm('A Beta prior is worth a + b observations', {
  hyp:`prior <span class="mth">Beta(<i>a</i>, <i>b</i>)</span> and <span class="mth"><i>k</i></span> successes in <span class="mth"><i>n</i></span> Bernoulli trials`,
  then:`the posterior is <span class="mth">Beta(<i>a</i>+<i>k</i>, <i>b</i>+<i>n</i>−<i>k</i>)</span>, and its mean is a weighted average with the prior counted as data`,
  eq:`E[<i>p</i> | data] = <sup><i>a</i>+<i>b</i></sup>⁄<sub><i>a</i>+<i>b</i>+<i>n</i></sub> · <sup><i>a</i></sup>⁄<sub><i>a</i>+<i>b</i></sub> &nbsp;+&nbsp; <sup><i>n</i></sup>⁄<sub><i>a</i>+<i>b</i>+<i>n</i></sub> · <sup><i>k</i></sup>⁄<sub><i>n</i></sub>`,
  proof:`<p>The prior is proportional to <span class="mth"><i>p</i><sup><i>a</i>−1</sup>(1−<i>p</i>)<sup><i>b</i>−1</sup></span> and the likelihood to <span class="mth"><i>p</i><sup><i>k</i></sup>(1−<i>p</i>)<sup><i>n</i>−<i>k</i></sup></span>. Their product is proportional to <span class="mth"><i>p</i><sup><i>a</i>+<i>k</i>−1</sup>(1−<i>p</i>)<sup><i>b</i>+<i>n</i>−<i>k</i>−1</sup></span>, which is the kernel of <span class="mth">Beta(<i>a</i>+<i>k</i>, <i>b</i>+<i>n</i>−<i>k</i>)</span>; the normalising constant is then forced. Its mean is <span class="mth">(<i>a</i>+<i>k</i>)/(<i>a</i>+<i>b</i>+<i>n</i>)</span>, and splitting the numerator gives the weighted form. ∎</p>`,
  note:`So "how much is the prior worth" has a literal answer in observations. With a flat prior this gives Laplace’s rule of succession, <span class="mth">(<i>k</i>+1)/(<i>n</i>+2)</span>.`,
  see:'infer:snBayes'
})}

<p>The obvious objection — that the prior is chosen rather than measured — has a measurable answer, and the wing measures it. Two priors meeting the same evidence converge, but at <strong>two different rates</strong>, and this is the least expected result on the page. The gap between their posterior <em>means</em> falls like <span class="mth">1/<i>n</i></span>, as the weights above predict. The total-variation distance between the posterior <em>distributions</em> falls only like <span class="mth">1/√<i>n</i></span> — because both posteriors are narrowing at that rate as well, so a shrinking gap is being measured with a shrinking ruler. Two reasonable people stop disagreeing about the value of a parameter long before they stop disagreeing about how confident to be in it.</p>
<p>One caveat stands. A prior assigning probability exactly zero to a region multiplies the likelihood by zero there at every step, and no evidence ever lifts it. That is Cromwell’s rule, and it is the form of the objection that genuinely bites.</p>

${stThm('Why a positive result on an excellent test usually means little', {
  hyp:`sensitivity <span class="mth"><i>s</i></span>, specificity <span class="mth"><i>c</i></span>, prevalence <span class="mth">π</span>`,
  then:`the probability of the condition given a positive is governed by the prevalence, not by the test`,
  eq:`P(ill | +) = <i>s</i>π / [ <i>s</i>π + (1−<i>c</i>)(1−π) ]`,
  proof:`<p>Direct from the definition of conditional probability, with the denominator split over the two ways a positive arises. On a cohort of <span class="mth"><i>N</i></span>: <span class="mth"><i>N</i>π<i>s</i></span> true positives and <span class="mth"><i>N</i>(1−π)(1−<i>c</i>)</span> false ones, and the ratio of the first to their sum is the statement. ∎</p>
<p>At <span class="mth"><i>s</i> = 0.99</span>, <span class="mth"><i>c</i> = 0.95</span>, <span class="mth">π = 0.001</span>: 990 true positives against 49 950 false ones, so <strong>1.94%</strong>.</p>`,
  note:`<strong>Now read it as a statement about testing.</strong> "No effect" is the null, a positive is a significant result, <span class="mth">1−<i>c</i></span> is <span class="mth">α</span> and <span class="mth"><i>s</i></span> is the power. Where most tested hypotheses are false, most significant findings are false — with no misconduct and no statistical error anywhere.`,
  see:'infer:snBayes'
})}

<h3 id="s8">What to actually do</h3>
<ul>
<li><strong>Report an estimate with an interval, never a p-value alone.</strong> With enough data a difference of no consequence produces an arbitrarily small p; the interval says how large the effect is and how well it is pinned down, which is what the reader needs.</li>
<li><strong>Use the t quantile, not the normal one</strong>, whenever σ is estimated. It is exact rather than a correction, and it costs nothing.</li>
<li><strong>Never use the Wald interval for a proportion.</strong> Wilson is the same amount of arithmetic and does not have a 2% worst case. Agresti–Coull is the version to remember if only one formula will fit in your head.</li>
<li><strong>Do the power calculation before the experiment.</strong> A non-significant result from an underpowered study is not evidence of absence; it is an absence of evidence, and the power is the number distinguishing the two.</li>
<li><strong>State how many hypotheses were examined.</strong> If more than one, correct — and use Holm, which dominates Bonferroni at no cost.</li>
<li><strong>When the assumptions are doubtful, permute.</strong> The exact null distribution needs no distributional assumption at all, and at modern sample sizes the sampled version is cheap.</li>
<li><strong>Know which conditional probability you have.</strong> A p-value is P(data | H₀). If you want P(H₀ | data) you need a prior, and the diagnostic-test calculation is what happens when the difference is ignored.</li>
</ul>
`;
