/* ============================================================================
   THEORY — DISCRETE MATHEMATICS & COMBINATORICS  (Programme C wing C5)
   The probability wing counts outcomes and statistical mechanics counts
   microstates, and neither has anywhere to send a reader who cannot count. This
   is that page: the four counting problems, the binomial coefficients and the
   identities that are really bijections, inclusion–exclusion, and recurrences —
   ending with the one place where an exact closed form is the wrong thing to
   compute with.
   ============================================================================ */
const THEORY_DISCRETE = `
<div class="toc"><a href="#s0">Why counting is different</a><a href="#s1">The four problems</a>
<a href="#s2">Bijections</a><a href="#s3">Binomial coefficients</a><a href="#s4">Inclusion–exclusion</a>
<a href="#s5">Derangements</a><a href="#s6">Recurrences</a><a href="#s7">Exact and computable</a></div>

<h3 id="s0">Why counting is different from everything else here</h3>
<p>Every other wing in this laboratory checks a closed form against a numerical method that has an error of its own. A quadrature converges; an integrator has an order; a root finder has a tolerance. The comparison is always between two approximations, and deciding what counts as agreement takes care.</p>
<p>Counting has no such problem. If a formula claims there are twenty of something, you can build the twenty and look. The second route is not an approximation to the answer — it <strong>is</strong> the answer, obtained straight from the definition, and the formula is a shortcut. A disagreement means the formula is wrong, full stop: no tolerance to argue about, no convergence to wait for.</p>
<p>So every closed form in this wing is drawn beside an enumeration, for whatever <span class="mth">n</span> is small enough. The enumerators are bounded and <em>refuse</em> above the cap rather than truncating, because a truncated list turns a wrong count into a plausible one — the same failure mode as a loop that iterates an empty collection and reports success.</p>

<h3 id="s1">The four counting problems, which are one table</h3>
<p>Two questions decide everything: does the order matter, and may things repeat.</p>
<div class="eqb"><span class="mth">
<i>n</i><sup><i>k</i></sup> &nbsp;·&nbsp; <i>P</i>(<i>n</i>,<i>k</i>) = <i>n</i>!/(<i>n</i>−<i>k</i>)! &nbsp;·&nbsp;
<i>C</i>(<i>n</i>,<i>k</i>) = <i>n</i>!/(<i>k</i>!(<i>n</i>−<i>k</i>)!) &nbsp;·&nbsp; <i>C</i>(<i>n</i>+<i>k</i>−1,<i>k</i>)
</span></div>
<p>All four come from the multiplication principle — if a first choice has <span class="mth">a</span> ways and a second has <span class="mth">b</span> ways <em>whatever the first gave</em>, the pair has <span class="mth">ab</span> ways — and the differences are only in what has to be divided out afterwards.</p>
<p>The division deserves attention because it is where these arguments actually fail. Going from arrangements to subsets divides by <span class="mth"><i>k</i>!</span>, and that is legal <strong>only because every subset is over-counted equally</strong>: each <span class="mth"><i>k</i></span>-subset appears exactly <span class="mth"><i>k</i>!</span> times among the arrangements, the same number for every subset. The moment repeats are allowed the over-counting becomes uneven, the division stops being available, and the fourth case needs a different idea entirely.</p>

<h3 id="s2">That different idea: a bijection</h3>
<p>A multiset of <span class="mth"><i>k</i></span> things drawn from <span class="mth"><i>n</i></span> types is a row of <span class="mth"><i>k</i></span> stars divided by <span class="mth"><i>n</i>−1</span> bars: the stars before the first bar are of the first type, and so on. Every arrangement of stars and bars gives exactly one multiset and every multiset gives exactly one arrangement, so the two collections have the same size — and counting the arrangements is a problem already solved.</p>

${stDefn('Bijective proof', `<p>A proof that two finite sets have the same size, given by exhibiting a one-to-one correspondence between them rather than by computing both sizes and comparing.</p>
<p>It is the standard move of the subject, and it is stronger than an equality of formulas: a bijection explains <em>why</em> the counts agree, survives generalisation, and cannot be undone by an arithmetic slip.</p>`,
  { see:'discrete:dcCount' })}

<h3 id="s3">Binomial coefficients, and identities that are really bijections</h3>
<p>Pascal's triangle is built by one rule:</p>
<div class="eqb"><span class="mth"><i>C</i>(<i>n</i>,<i>k</i>) = <i>C</i>(<i>n</i>−1,<i>k</i>−1) + <i>C</i>(<i>n</i>−1,<i>k</i>)</span></div>
<p>whose proof is a sentence. Fix one element of the <span class="mth"><i>n</i></span>. A <span class="mth"><i>k</i></span>-subset either contains it — leaving <span class="mth"><i>k</i>−1</span> to choose from the other <span class="mth"><i>n</i>−1</span> — or it does not, leaving <span class="mth"><i>k</i></span> from <span class="mth"><i>n</i>−1</span>. Disjoint, exhaustive, so the counts add. The wing builds the triangle by that recurrence and by nothing else, which is what makes comparing it with the factorial formula a test rather than a restatement.</p>

${stThm('Four identities on a row, and what each one counts', {
  hyp:'<span class="mth"><i>n</i> ≥ 0</span>',
  then:'the entries of row <span class="mth"><i>n</i></span> satisfy',
  eq:'∑<i>C</i>(<i>n</i>,<i>k</i>) = 2<sup><i>n</i></sup>, &nbsp; ∑(−1)<sup><i>k</i></sup><i>C</i>(<i>n</i>,<i>k</i>) = 0 (<i>n</i> ≥ 1), &nbsp; ∑<i>k C</i>(<i>n</i>,<i>k</i>) = <i>n</i>2<sup><i>n</i>−1</sup>, &nbsp; ∑<i>C</i>(<i>n</i>,<i>k</i>)² = <i>C</i>(2<i>n</i>,<i>n</i>)',
  proof:`<p><strong>First:</strong> the left side sorts all subsets by size; the right builds each subset by <span class="mth"><i>n</i></span> independent in-or-out decisions. Same set, two orders of counting.</p>
<p><strong>Second:</strong> toggling membership of the first element is a bijection between the even-sized and odd-sized subsets, so the two families are the same size. It needs a first element to toggle, which is why <span class="mth"><i>n</i> ≥ 1</span> — and the identity fails at <span class="mth"><i>n</i> = 0</span> too.</p>
<p><strong>Third:</strong> count pairs (subset, element chosen from it). By subset that is <span class="mth">∑<i>kC</i>(<i>n</i>,<i>k</i>)</span>; by element it is <span class="mth"><i>n</i></span> choices times <span class="mth">2<sup><i>n</i>−1</sup></span> subsets of the rest.</p>
<p><strong>Fourth:</strong> choose <span class="mth"><i>n</i></span> from two groups of <span class="mth"><i>n</i></span>, split by how many came from the first. Taking <span class="mth"><i>k</i></span> from one and <span class="mth"><i>n</i>−<i>k</i></span> from the other is <span class="mth"><i>C</i>(<i>n</i>,<i>k</i>)<i>C</i>(<i>n</i>,<i>n</i>−<i>k</i>)</span>, which is <span class="mth"><i>C</i>(<i>n</i>,<i>k</i>)²</span> by symmetry.</p>`,
  note:'That the second proof and the second identity break at exactly the same place — n = 0 — is the evidence the proof is doing real work rather than decorating an algebraic accident.',
  see:'discrete:dcPascal', seeLabel:'A row sums to 2ⁿ, and the alternating sum vanishes' })}

<p>The parity picture is worth its own paragraph because it is not a resemblance. Colour a cell when its entry is odd and Sierpinski's gasket appears exactly. Kummer's theorem gives the power of a prime <span class="mth"><i>p</i></span> dividing <span class="mth"><i>C</i>(<i>n</i>,<i>k</i>)</span> as the number of carries when <span class="mth"><i>k</i></span> and <span class="mth"><i>n</i>−<i>k</i></span> are added in base <span class="mth"><i>p</i></span>. For <span class="mth"><i>p</i> = 2</span>, no carries means every one-bit of <span class="mth"><i>k</i></span> is also a one-bit of <span class="mth"><i>n</i></span> — a condition that is self-similar under doubling <span class="mth"><i>n</i></span>, which is the gasket's own recursive definition written in binary. Over rows <span class="mth">0 … 2<sup><i>m</i></sup>−1</span> the number of odd entries is exactly <span class="mth">3<sup><i>m</i></sup></span> out of <span class="mth">2<sup><i>m</i>−1</sup>(2<sup><i>m</i></sup>+1)</span>, so the fraction falls towards zero: almost every binomial coefficient is even.</p>

<h3 id="s4">Inclusion and exclusion</h3>
<p>Add the sizes of some overlapping sets and an element lying in exactly <span class="mth"><i>m</i></span> of them has been counted <span class="mth"><i>m</i></span> times. The correction is forced rather than chosen:</p>

${stThm('The principle of inclusion and exclusion', {
  hyp:'finite sets <span class="mth"><i>A</i>₁ … <i>A</i><sub><i>n</i></sub></span>',
  then:'their union has size',
  eq:'|⋃<i>A</i><sub><i>i</i></sub>| = ∑<sub>∅≠<i>S</i></sub> (−1)<sup>|<i>S</i>|+1</sup> |⋂<sub><i>i</i>∈<i>S</i></sub> <i>A</i><sub><i>i</i></sub>|',
  proof:`<p>Take an element lying in exactly <span class="mth"><i>m</i> ≥ 1</span> of the sets. It appears in <span class="mth"><i>C</i>(<i>m</i>,<i>j</i>)</span> of the <span class="mth"><i>j</i></span>-fold intersections and in none of the others, so the signed sum counts it</p>
<div class="eqb"><span class="mth"><i>C</i>(<i>m</i>,1) − <i>C</i>(<i>m</i>,2) + <i>C</i>(<i>m</i>,3) − … = 1 − ∑<sub><i>j</i>≥0</sub>(−1)<sup><i>j</i></sup><i>C</i>(<i>m</i>,<i>j</i>) = 1 − 0 = 1</span></div>
<p>times, by the alternating-row identity above. An element in none of the sets is counted zero times. So every element of the union contributes exactly 1.</p>`,
  note:'The alternation is not a rule to memorise. It is the unique pattern of corrections that turns m into 1 for every m at once, and the row identity from Pascal is what makes it so.',
  see:'discrete:dcIncl', seeLabel:'Divisible by 2, 3 or 5 — seven terms, one answer' })}

<p>Two consequences repay the effort. Read over the prime divisors of <span class="mth"><i>N</i></span> and expand, and the alternating sum <em>is</em> Euler's product <span class="mth"><i>N</i>∏(1−1/<i>p</i>)</span> multiplied out, sign for sign — the totient formula and the principle are one piece of bookkeeping. And with no overlaps every correction vanishes and the principle collapses to plain addition, which is what makes it a generalisation rather than a different rule.</p>

<h3 id="s5">Derangements, and a probability that forgets its own size</h3>
<p>Let <span class="mth"><i>A</i><sub><i>i</i></sub></span> be the permutations fixing element <span class="mth"><i>i</i></span>. A derangement is in none of them, so</p>
<div class="eqb"><span class="mth">!<i>n</i> = ∑<sub><i>k</i></sub> (−1)<sup><i>k</i></sup><i>C</i>(<i>n</i>,<i>k</i>)(<i>n</i>−<i>k</i>)! = <i>n</i>! ∑<sub><i>k</i></sub> (−1)<sup><i>k</i></sup>/<i>k</i>!</span></div>
<p>The second form is <span class="mth"><i>n</i>!</span> times the Taylor series of <span class="mth">e<sup>−1</sup></span> cut off after <span class="mth"><i>n</i></span> terms, and it converges so fast that by <span class="mth"><i>n</i> = 7</span> every digit float64 carries has settled. So the probability that a shuffle returns nothing to its own place is <span class="mth">0.3679</span> whether you shuffle five cards or five thousand — the near-independence of <span class="mth"><i>n</i></span> is the genuinely surprising part, and it is a direct consequence of how fast the alternating series converges.</p>
<p>The wing computes this four ways: by the alternating sum, by the recurrence <span class="mth">!<i>n</i> = (<i>n</i>−1)(!(<i>n</i>−1) + !(<i>n</i>−2))</span>, by rounding <span class="mth"><i>n</i>!/e</span>, and — below nine elements — by listing every permutation and checking each for a fixed point. Four arguments with nothing in common agreeing to the digit is more evidence than any one of them could carry.</p>

<h3 id="s6">Recurrences, and the three ways to evaluate one</h3>
<p>Substituting <span class="mth"><i>a</i>(<i>n</i>) = <i>r</i><sup><i>n</i></sup></span> into a linear recurrence turns it into a polynomial in <span class="mth"><i>r</i></span>, and every solution is a combination of the powers of that polynomial's roots. The roots therefore belong to the <em>recurrence</em>; the initial values only decide the coefficients in front of them. Fibonacci and Lucas share the golden ratio for exactly this reason, and it is the discrete image of what the linear-ODE wing does with <span class="mth">e<sup>λ<i>t</i></sup></span>.</p>
<p>That gives three routes to <span class="mth"><i>a</i>(<i>n</i>)</span>, and they are not variations on one calculation:</p>
<ul>
<li><strong>Iterate.</strong> <span class="mth"><i>n</i></span> additions of integers; exact wherever the answer fits below <span class="mth">2⁵³</span>.</li>
<li><strong>Raise the companion matrix</strong> by repeated squaring. About <span class="mth">log₂<i>n</i></span> multiplications, visiting <span class="mth"><i>n</i></span> through its binary expansion, so the intermediate numbers are entirely different — and still exact, because every entry stays an integer.</li>
<li><strong>Evaluate the closed form.</strong> Powers of irrational roots, in floating point.</li>
</ul>

<h3 id="s7">Exact is not the same as computable, and this is the cleanest example</h3>
<p>Binet's formula is exact mathematics. Evaluated in float64 it is also, past <span class="mth"><i>n</i> ≈ 71</span>, wrong — and the way it is wrong is worth more than the formula.</p>
<p>Plot both errors against <span class="mth"><i>n</i></span>. The <strong>relative</strong> error sits flat at <span class="mth">10⁻¹⁶</span> across the whole range: the closed form is losing no significant figures at all, at any <span class="mth"><i>n</i></span>. The <strong>absolute</strong> error grows in step with the answer, passes a half near <span class="mth"><i>n</i> = 71</span>, and reaches 24 by <span class="mth"><i>n</i> = 78</span> — while the true value there is still an exactly representable float64 integer.</p>
<p>The two errors give <em>opposite verdicts about the same number</em>, and which one matters is decided entirely by what was wanted. For an approximation, Binet is perfect everywhere. For an integer, it is useless past seventy, because by then the answer has more than sixteen digits and the ones it has dropped are the units. No amount of extra precision changes that verdict — only a different algorithm does, which is precisely the distinction between an ill-conditioned problem and an unstable method that the units and numerical-methods wings both draw.</p>
<p>The same lesson appears one page earlier in a different costume. <span class="mth"><i>C</i>(52,26)</span> is an integer that float64 holds exactly, and computing it as <span class="mth">52!/(26!)²</span> returns <span class="mth">495 918 532 948 103.94</span> — because <span class="mth">52!</span> is <span class="mth">8×10⁶⁷</span> and gets rounded long before the division. The multiplicative form keeps every partial product an integer and stays right. Rearranging so the arithmetic never leaves the range where it is exact is one instruction, and it covers both.</p>
`;
