/* ============================================================================
   THEORY — NUMERICAL LINEAR ALGEBRA  (Programme C wing C16, syllabus gap B6)

   The three linear-algebra wings below this one solve systems and stop. This
   page is about the sentence they never get to say: the computed answer is not
   the answer, and the size of the difference is governed by two entirely
   separate things — the algorithm's stability and the problem's conditioning —
   which must be told apart before either can be discussed.
   ============================================================================ */
const THEORY_NUMLIN = `
<div class="toc"><a href="#s0">Two different failures</a><a href="#s1">LU and pivoting</a>
<a href="#s2">Backward error</a><a href="#s3">Conditioning</a><a href="#s4">Orthogonality</a>
<a href="#s5">Iteration</a><a href="#s6">Krylov</a><a href="#s7">What to actually do</a></div>

<h3 id="s0">Two different failures, and why they must not be confused</h3>
<p>Solve <span class="mth"><i>A</i><b>x</b> = <b>b</b></span> on paper and there is one question: is the arithmetic right. Solve it in sixteen digits and there are two, and they have nothing to do with each other.</p>
<p>The first is about the <strong>algorithm</strong>. Gaussian elimination without pivoting is perfectly correct — in exact arithmetic it returns the exact answer for every invertible matrix — and on a 2×2 matrix with a leading entry of <span class="mth">10⁻¹⁷</span> it returns an answer with no correct digits at all, silently, with a residual you would be pleased with. Nothing about that matrix is hard: its condition number is 3. The failure is entirely the method's, and the cure is a better method.</p>
<p>The second is about the <strong>problem</strong>. A Hilbert matrix of size 12 has a condition number near <span class="mth">10¹⁶</span>, and solving with it destroys the answer no matter what algorithm is used, because rounding the matrix's own entries into floating point already changes the solution completely. There is no better method. The cure, if there is one, is a different question.</p>
<p>Every experiment in this wing is built to keep those two apart, because conflating them produces both of the standard mistakes: blaming the library for an ill-conditioned problem, and trusting a small residual on a problem where a small residual means nothing.</p>

<h3 id="s1">Elimination is a factorisation, and pivoting is not what people think</h3>
<p>Subtracting <span class="mth"><i>m</i></span> times one row from another is left-multiplication by an elementary matrix. Doing the whole elimination therefore multiplies <span class="mth"><i>A</i></span> on the left by a product of them; inverting that product — free, for unit lower triangular matrices, because you flip the signs of the multipliers — writes</p>
<div class="eqb"><span class="mth"><i>PA</i> = <i>LU</i></span></div>
<p>with <span class="mth"><i>P</i></span> the row swaps, <span class="mth"><i>L</i></span> unit lower triangular holding the multipliers, and <span class="mth"><i>U</i></span> what elimination left behind. No new arithmetic has been done; the arithmetic that was going to be thrown away has been written down. That is worth more than the answer: a second right-hand side then costs <span class="mth"><i>n</i>²</span> instead of <span class="mth"><i>n</i>³</span>, and the determinant is the product of the pivots.</p>
<p>Why pivot at all? Not primarily because a pivot might be zero — that case is easy and obvious. Because a <em>small</em> pivot makes a large multiplier, a large multiplier multiplies the rounding errors of the row being subtracted, and those magnified errors then swamp the entries they are added to. The information in the smaller entries is destroyed rather than approximated, and no later step recovers it.</p>
<p>Partial pivoting — always eliminate with the largest available entry in the column — bounds every multiplier by 1. That is necessary and it is not sufficient, and the distinction is sharp enough to have a name.</p>

${stDefn('Growth factor', `<p>For an elimination producing intermediate matrices <span class="mth"><i>A</i>⁽ᵏ⁾</span>,</p>
<div class="st-eq mth">ρ = max<sub>k,i,j</sub> |<i>a</i><sup>(k)</sup><sub>ij</sub>| &nbsp;/&nbsp; max<sub>i,j</sub> |<i>a</i><sub>ij</sub>|</div>
<p>the largest entry appearing <em>anywhere during the computation</em>, divided by the largest entry of the original matrix. It is ρ, and not the multipliers, that appears in the backward error bound.</p>`,
  { see:'numlin:0.3', seeLabel:'See a matrix where every multiplier is 1 and ρ = 2ⁿ⁻¹' })}

${stThm('Partial pivoting bounds the multipliers but not the growth', {
  hyp:'<span class="mth"><i>A</i></span> is the <span class="mth"><i>n</i>×<i>n</i></span> matrix with 1 on the diagonal, −1 below it, and 1 in the last column',
  then:'partial pivoting performs no row swaps, every multiplier equals 1, and',
  eq:'ρ = 2<sup><i>n</i>−1</sup>',
  proof:`<p>In the first column the largest entry in magnitude is the diagonal 1 — every other entry is −1 — so no swap occurs and every multiplier is exactly 1. Eliminating adds row 1 to each row below it: the −1s in column 1 become 0, the diagonal 1s are untouched, and the last column's entries become 1 + 1 = 2.</p>
<p>The remaining <span class="mth">(<i>n</i>−1)×(<i>n</i>−1)</span> block has exactly the same shape, with its last column doubled. By induction the last column reads 1, 2, 4, …, and the final entry is <span class="mth">2ⁿ⁻¹</span>. Since <span class="mth">max|<i>a</i><sub>ij</sub>| = 1</span>, that is ρ.</p>
<p>Nothing about the argument depends on rounding, so the growth is a fact about the exact elimination, and precision does not touch it.</p>`,
  note:'This is why partial pivoting is a bet rather than a guarantee. The bound ρ ≤ 2ⁿ⁻¹ is attained, so the guarantee is worthless in the worst case — and matrices from real problems essentially never approach it, which is why every library pivots this way regardless. Complete pivoting has a far better bound and costs a search over the whole remaining submatrix, and almost nobody pays for it.',
  see:'numlin:0.3'
})}

<h3 id="s2">Backward error: what a stable algorithm actually promises</h3>
<p>The useful way to describe a computation in floating point is not "the answer is nearly right" but "the answer is exactly right for a nearby question".</p>

${stDefn('Backward stability', `<p>An algorithm for <span class="mth"><i>A</i><b>x</b> = <b>b</b></span> is <strong>backward stable</strong> if the computed <span class="mth"><b>x̂</b></span> satisfies</p>
<div class="st-eq mth">(<i>A</i> + <i>E</i>)<b>x̂</b> = <b>b</b>, &nbsp;&nbsp; ‖<i>E</i>‖ ≲ <i>c</i>(<i>n</i>) ρ ε ‖<i>A</i>‖</div>
<p>for a modest function <span class="mth"><i>c</i></span> — that is, it returns the exact solution of a problem whose data differs from yours by about a rounding error.</p>
<p>Note what is <em>not</em> claimed: nothing at all about how close <span class="mth"><b>x̂</b></span> is to <span class="mth"><b>x</b></span>. That step requires the condition number, and is the subject of the next section.</p>`,
  { see:'numlin:2.3', seeLabel:'See a stable solve with no correct digits' })}

<p>Gaussian elimination with partial pivoting is backward stable in practice — the qualifier is exactly the growth factor above. Householder QR is backward stable unconditionally. And the immediate consequence is the one result in this wing that changes how people work:</p>
<p><strong>A small residual is not evidence of a good answer.</strong> A backward-stable solver drives <span class="mth">‖<b>b</b> − <i>A</i><b>x̂</b>‖</span> to round-off on every matrix there is, including the ones where the answer is meaningless. Checking the residual checks that the algorithm did its job. Whether the answer is right is a different question with a different governing quantity.</p>

<h3 id="s3">Conditioning: how far the answer is allowed to move</h3>
<p>Perturb the data and subtract. From <span class="mth"><i>A</i>(<b>x</b> + δ<b>x</b>) = <b>b</b> + δ<b>b</b></span> we get <span class="mth">δ<b>x</b> = <i>A</i>⁻¹δ<b>b</b></span> exactly — the error satisfies the same equation. Bounding by norms, and using <span class="mth">‖<b>b</b>‖ ≤ ‖<i>A</i>‖‖<b>x</b>‖</span>:</p>

${stThm('The perturbation bound, and that it is sharp', {
  hyp:'<span class="mth"><i>A</i></span> is invertible and <span class="mth"><b>b</b> ≠ 0</span>',
  then:'with <span class="mth">κ(<i>A</i>) = ‖<i>A</i>‖‖<i>A</i>⁻¹‖</span>,',
  eq:'‖δ<b>x</b>‖ / ‖<b>x</b>‖ &nbsp;≤&nbsp; κ(<i>A</i>) · ‖δ<b>b</b>‖ / ‖<b>b</b>‖',
  proof:`<p><strong>The bound.</strong> <span class="mth">δ<b>x</b> = <i>A</i>⁻¹δ<b>b</b></span> gives <span class="mth">‖δ<b>x</b>‖ ≤ ‖<i>A</i>⁻¹‖‖δ<b>b</b>‖</span>. And <span class="mth"><b>b</b> = <i>A</i><b>x</b></span> gives <span class="mth">‖<b>b</b>‖ ≤ ‖<i>A</i>‖‖<b>x</b>‖</span>, so <span class="mth">1/‖<b>x</b>‖ ≤ ‖<i>A</i>‖/‖<b>b</b>‖</span>. Multiply the two.</p>
<p><strong>Sharpness, in the 2-norm.</strong> Write <span class="mth"><i>A</i> = <i>U</i>Σ<i>V</i>ᵀ</span>. Choose <span class="mth"><b>b</b> = <b>u</b>₁</span>, so <span class="mth"><b>x</b> = <b>v</b>₁/σ₁</span> and <span class="mth">‖<b>x</b>‖ = 1/σ₁</span> — as short as any solution of a unit-length right-hand side can be. Choose <span class="mth">δ<b>b</b> = ε<b>u</b><sub>n</sub></span>, so <span class="mth">δ<b>x</b> = ε<b>v</b><sub>n</sub>/σ<sub>n</sub></span> — as long as any perturbation of that size can produce. Then</p>
<div class="st-eq mth">(‖δ<b>x</b>‖/‖<b>x</b>‖) ÷ (‖δ<b>b</b>‖/‖<b>b</b>‖) = (ε/σ<sub>n</sub>)·σ₁ ÷ ε = σ₁/σ<sub>n</sub> = κ₂(<i>A</i>)</div>
<p>so the inequality is an equality for that pair, and the bound cannot be improved.</p>`,
  note:'The proof of sharpness is not decoration. A bound nobody can attain describes nothing; this one is attained by a pair you can construct, and the "amplification" experiment drives exactly that pair and lands on the diagonal.',
  see:'numlin:2.2'
})}

<p>In the 2-norm, <span class="mth">κ₂ = σ₁/σ<sub>n</sub></span> — the ratio of the longest semi-axis of the ellipse <span class="mth"><i>A</i></span> makes from the unit circle to the shortest. That is what the condition number <em>is</em>, before any inequality: the eccentricity of that ellipse. A matrix can have a healthy determinant and a dreadful κ — stretch one axis by a thousand and squash the other by a thousand and the area is unchanged — which is why the determinant is useless as a measure of near-singularity and κ is not.</p>
<p>Putting the two sections together gives the shape of every error analysis in the subject:</p>
<div class="eqb"><span class="mth">relative error &nbsp;≲&nbsp; κ(<i>A</i>) × (backward error) &nbsp;≈&nbsp; κ(<i>A</i>) ρ ε</span></div>
<p>Two independent factors. The algorithm owns ρ; the problem owns κ; and ε is the only one a faster machine changes.</p>

<h3 id="s4">Orthogonality, and three ways to lose it</h3>
<p>Orthogonal matrices are the safest objects in the subject because they preserve the 2-norm exactly: <span class="mth">‖<i>Q</i><b>v</b>‖ = ‖<b>v</b>‖</span>, so <span class="mth">κ₂(<i>Q</i>) = 1</span> and multiplying by one neither amplifies an existing error nor introduces a new one. That is why <span class="mth"><i>A</i> = <i>QR</i></span> is the preferred factorisation whenever it can be afforded, and why least squares should be solved through it rather than through the normal equations <span class="mth"><i>A</i>ᵀ<i>A</i><b>x</b> = <i>A</i>ᵀ<b>b</b></span>: forming <span class="mth"><i>A</i>ᵀ<i>A</i></span> squares the condition number and throws away half the digits before the solve has begun.</p>
<p>But <span class="mth"><i>Q</i></span> has to be computed, and how it is computed decides whether it is orthogonal at all.</p>

${stThm('Three constructions of Q, three different stabilities', {
  hyp:'<span class="mth"><i>A</i></span> has full column rank and condition number κ, and the arithmetic has unit round-off ε',
  then:'the computed <span class="mth"><i>Q̂</i></span> satisfies, with modest constants,',
  eq:'‖<i>Q̂</i>ᵀ<i>Q̂</i> − <i>I</i>‖ ≲ ε κ² (classical Gram–Schmidt), &nbsp; ≲ ε κ (modified), &nbsp; ≲ ε (Householder)',
  proof:`<p><strong>Where the difference between the two Gram–Schmidts lives.</strong> Both compute <span class="mth"><b>q</b><sub>j</sub></span> by subtracting projections. Classical takes every coefficient against the <em>original</em> column: <span class="mth"><i>r</i><sub>ij</sub> = <b>q</b><sub>i</sub>·<b>a</b><sub>j</sub></span>. Modified takes each against what is <em>left</em> of it after the previous subtractions. In exact arithmetic these agree — once <span class="mth"><b>q</b>₁</span> has been removed the remainder is orthogonal to <span class="mth"><b>q</b>₁</span>, so projecting the remainder or the original onto <span class="mth"><b>q</b>₂</span> gives the same number.</p>
<p>In floating point the computed <span class="mth"><b>q</b>₁</span> is only orthogonal to within ε. When <span class="mth"><b>a</b><sub>j</sub></span> lies nearly in the span of the earlier columns — which is exactly what large κ means — the subtraction cancels almost all its digits, and what survives is dominated by that ε. The classical form takes all its later coefficients against the uncontaminated original and therefore never sees the contamination; the modified form takes each against the current remainder, so each subtraction removes the error the previous one introduced. One extra correction, one factor of κ.</p>
<p><strong>Why Householder is different in kind.</strong> A reflector <span class="mth"><i>H</i> = <i>I</i> − 2<b>v</b><b>v</b>ᵀ/<b>v</b>ᵀ<b>v</b></span> is orthogonal because of its <em>form</em>: whatever <span class="mth"><b>v</b></span> is, and however inaccurately it was computed, the matrix built from it is orthogonal to within ε. <span class="mth"><i>Q</i></span> is a product of <span class="mth"><i>n</i></span> such reflectors, so its departure from orthogonality accumulates like <span class="mth"><i>n</i>ε</span> and has no dependence on the data at all.</p>`,
  note:'These are upper bounds, and the wing measures the exponents rather than quoting them. The classical bound comes out tight — a slope of about 2 against log κ. The modified one does not: the measured slope is below 1 on the family tested, which means εκ is a ceiling that family does not reach. An upper bound being attained is a fact about the example; only the bound itself is a fact about the method.',
  see:'numlin:1.1'
})}

<p>The practical reading. Use Householder when you want <span class="mth"><i>Q</i></span> and cannot vouch for the conditioning, which is nearly always; it costs about twice the flops and buys unconditional orthogonality. Use modified Gram–Schmidt when the columns arrive one at a time and cannot all be held — that is what Arnoldi and GMRES need, and it is the reason the modified form survives. Use classical Gram–Schmidt in proofs.</p>

<h3 id="s5">Iterating instead of eliminating</h3>
<p>Elimination costs <span class="mth"><i>n</i>³/3</span> and destroys sparsity: the factors of a sparse matrix are usually dense, so a million-unknown grid problem that fits comfortably in memory as a matrix does not fit as its LU factors. The alternative is to split <span class="mth"><i>A</i> = <i>M</i> − <i>N</i></span> with <span class="mth"><i>M</i></span> easy to invert, and iterate:</p>
<div class="eqb"><span class="mth"><i>M</i><b>x</b><sub>k+1</sub> = <i>N</i><b>x</b><sub>k</sub> + <b>b</b>, &nbsp;&nbsp; <b>e</b><sub>k+1</sub> = <i>G</i><b>e</b><sub>k</sub>, &nbsp;&nbsp; <i>G</i> = <i>M</i>⁻¹<i>N</i></span></div>
<p>Subtracting the fixed point removes <span class="mth"><b>b</b></span> entirely, so convergence is a question about powers of one matrix. Jacobi takes <span class="mth"><i>M</i> = <i>D</i></span>, Gauss–Seidel <span class="mth"><i>M</i> = <i>D</i> + <i>L</i></span>, and SOR <span class="mth"><i>M</i> = <i>D</i>/ω + <i>L</i></span>.</p>

${stThm('Convergence is governed by the spectral radius, not the norm', {
  hyp:'<span class="mth"><i>G</i></span> is any square matrix',
  then:'<span class="mth"><i>G</i>ᵏ → 0</span> for every starting vector if and only if',
  eq:'ρ(<i>G</i>) = max |λ<sub>i</sub>(<i>G</i>)| &lt; 1, &nbsp;&nbsp; and then ‖<b>e</b><sub>k</sub>‖ ∼ ρ(<i>G</i>)<sup>k</sup>',
  proof:`<p><strong>If ρ ≥ 1:</strong> take <span class="mth"><b>e</b>₀</span> an eigenvector for the largest eigenvalue; then <span class="mth"><b>e</b><sub>k</sub> = λᵏ<b>e</b>₀</span> does not tend to zero.</p>
<p><strong>If ρ &lt; 1:</strong> for any <span class="mth">δ &gt; 0</span> there is a norm in which <span class="mth">‖<i>G</i>‖ ≤ ρ + δ</span> (take the Jordan form and scale the superdiagonal), so choosing <span class="mth">δ &lt; 1 − ρ</span> makes <span class="mth"><i>G</i></span> a contraction in that norm, and all norms on a finite-dimensional space are equivalent.</p>
<p>The rate follows from Gelfand's formula <span class="mth">‖<i>G</i>ᵐ‖<sup>1/m</sup> → ρ(<i>G</i>)</span>, which also gives a way to <em>compute</em> ρ with no eigenvector: square <span class="mth"><i>G</i></span> ten times and read the norm.</p>`,
  note:'The radius and the norm genuinely differ. ‖G‖ > 1 with ρ(G) < 1 is a convergent iteration whose error GROWS for a while first, and that transient is visible on the plots as a curve that climbs before it falls.',
  see:'numlin:3.0'
})}

<p>For one important family the three rates are related in closed form, and the family has to be named before the formulas are, because dropping the hypothesis is how this result gets misused.</p>

${stDefn('Consistently ordered', `<p>A matrix <span class="mth"><i>A</i> = <i>D</i> + <i>L</i> + <i>U</i></span> is <strong>consistently ordered</strong> if the eigenvalues of</p>
<div class="st-eq mth"><i>D</i><sup>−1</sup>(α<i>L</i> + α<sup>−1</sup><i>U</i>)</div>
<p>are independent of <span class="mth">α ≠ 0</span>.</p>
<p>The condition is combinatorial rather than analytic: it holds whenever the unknowns can be coloured so that every equation couples a variable only to variables of the adjacent colour — a red–black ordering of a grid, and in particular the tridiagonal second-difference operator, which is the model case and the preset this wing measures on.</p>`,
  { see:'numlin:3.1', seeLabel:'See ρ(GS) = ρ(Jacobi)² measured on one' })}

${stThm('Young: the relation between the three rates, and the optimal ω', {
  hyp:'<span class="mth"><i>A</i></span> is consistently ordered with nonzero diagonal, and the Jacobi iteration matrix has real spectrum with radius <span class="mth">μ &lt; 1</span>',
  then:'the Gauss–Seidel and SOR radii are determined by <span class="mth">μ</span> alone:',
  eq:'ρ(GS) = μ², &nbsp;&nbsp; ω<sub>opt</sub> = 2 / (1 + √(1 − μ²)), &nbsp;&nbsp; ρ(SOR at ω<sub>opt</sub>) = ω<sub>opt</sub> − 1',
  proof:`<p><strong>The functional equation.</strong> For a consistently ordered <span class="mth"><i>A</i></span>, an eigenvalue <span class="mth">λ</span> of the SOR matrix and an eigenvalue <span class="mth">μ</span> of the Jacobi matrix are linked by</p>
<div class="st-eq mth">(λ + ω − 1)² = λ ω² μ²</div>
<p>which is exactly where consistent ordering is used: the α-independence lets the <span class="mth"><i>L</i></span> and <span class="mth"><i>U</i></span> parts be rescaled against each other without moving the spectrum, and that rescaling is what turns the SOR determinant into a function of <span class="mth">ωμ</span>.</p>
<p><strong>ρ(GS) = μ².</strong> Put <span class="mth">ω = 1</span>: the relation becomes <span class="mth">λ² = λμ²</span>, so <span class="mth">λ = μ²</span> or <span class="mth">λ = 0</span>. One Gauss–Seidel sweep does what two Jacobi sweeps do.</p>
<p><strong>The optimum.</strong> Solving the quadratic for <span class="mth">λ</span> gives two real roots while the discriminant <span class="mth">ω²μ² − 4(ω − 1)</span> is positive, and a complex conjugate pair with <span class="mth">|λ| = ω − 1</span> once it is negative. On the real branch the larger root decreases with <span class="mth">ω</span>; on the complex branch <span class="mth">|λ| = ω − 1</span> increases. The minimum is therefore exactly where the discriminant vanishes, which is <span class="mth">ω<sub>opt</sub> = 2/(1 + √(1 − μ²))</span>, and there <span class="mth">ρ = ω<sub>opt</sub> − 1</span>.</p>
<p>The shape of that argument is the practical warning: the curve is smooth and gently falling to the left of the optimum and is the <em>straight line</em> <span class="mth">ω − 1</span> to the right of it, reaching 1 at <span class="mth">ω = 2</span>.</p>`,
  note:'Both hypotheses matter and the wing measures what happens without them. Two 3×3 presets are not consistently ordered, and on one of them Jacobi converges in three sweeps while Gauss–Seidel diverges — the exact opposite of ρ(GS) = μ². The panel withholds ω_opt on every preset the theorem does not cover, and prints the two radii side by side without comparing them, rather than quoting an identity that does not apply.',
  see:'numlin:3.4'
})}

<p>On an <span class="mth"><i>n</i>×<i>n</i></span> grid problem the optimum turns an <span class="mth"><i>O</i>(<i>n</i>²)</span> sweep count into an <span class="mth"><i>O</i>(<i>n</i>)</span> one for no extra work per sweep — the best return on a single parameter anywhere in this subject.</p>
<p>One further hypothesis is worth stating because it is the one most often remembered as a rule and misused as a theorem. <strong>Strict diagonal dominance is sufficient</strong> for both Jacobi and Gauss–Seidel to converge, and it is <em>not necessary</em>. Its failing tells you nothing at all — the wing carries two 3×3 matrices, neither dominant, on one of which Jacobi finishes in three sweeps while Gauss–Seidel diverges, and on the other exactly the reverse. Which of them converges is a property of the spectrum, and has to be computed rather than guessed.</p>

<h3 id="s6">Krylov methods, and why √κ is the number that matters</h3>
<p>For symmetric positive definite <span class="mth"><i>A</i></span>, solving is minimising: <span class="mth">φ(<b>x</b>) = ½<b>x</b>ᵀ<i>A</i><b>x</b> − <b>b</b>ᵀ<b>x</b></span> has gradient <span class="mth"><i>A</i><b>x</b> − <b>b</b></span>, so its unique minimum is the solution. Steepest descent rolls downhill along the residual, minimising along that line — which makes each new residual perpendicular to the last direction, so every step partly undoes the one before it, and the path zig-zags across a long thin valley. The step count goes like κ.</p>
<p>Conjugate gradients costs the same per step — one matrix–vector product — and minimises over the whole space of everything it has seen.</p>

${stThm('The conjugate gradient bound', {
  hyp:'<span class="mth"><i>A</i></span> is symmetric positive definite with condition number κ, and <span class="mth">‖·‖<sub><i>A</i></sub></span> is the energy norm <span class="mth">√(<b>e</b>ᵀ<i>A</i><b>e</b>)</span>',
  then:'the conjugate gradient iterate after <span class="mth"><i>k</i></span> steps satisfies',
  eq:'‖<b>e</b><sub>k</sub>‖<sub><i>A</i></sub> ≤ 2 ( (√κ − 1) / (√κ + 1) )<sup><i>k</i></sup> ‖<b>e</b>₀‖<sub><i>A</i></sub>',
  proof:`<p>After <span class="mth"><i>k</i></span> steps the iterate lies in <span class="mth"><b>x</b>₀ + 𝒦<sub>k</sub></span>, the Krylov space spanned by <span class="mth"><b>r</b>₀, <i>A</i><b>r</b>₀, …, <i>A</i><sup>k−1</sup><b>r</b>₀</span>, and CG minimises <span class="mth">φ</span> — equivalently the <span class="mth"><i>A</i></span>-norm of the error — over the whole of it. So <span class="mth"><b>e</b><sub>k</sub> = <i>p</i>(<i>A</i>)<b>e</b>₀</span> where <span class="mth"><i>p</i></span> ranges over polynomials of degree <span class="mth"><i>k</i></span> with <span class="mth"><i>p</i>(0) = 1</span>, and CG achieves the best of them.</p>
<p>Expanding <span class="mth"><b>e</b>₀</span> in eigenvectors, <span class="mth">‖<i>p</i>(<i>A</i>)<b>e</b>₀‖<sub><i>A</i></sub> ≤ max<sub>λ∈[λ<sub>min</sub>,λ<sub>max</sub>]</sub> |<i>p</i>(λ)| · ‖<b>e</b>₀‖<sub><i>A</i></sub></span>. So any admissible polynomial gives a bound, and the shifted, scaled Chebyshev polynomial is the one that is smallest on that interval.</p>
<p>Chebyshev polynomials are bounded by 1 on <span class="mth">[−1, 1]</span> and grow like <span class="mth">(<i>z</i> + √(<i>z</i>²−1))<sup>k</sup></span> outside it. Mapping <span class="mth">[λ<sub>min</sub>, λ<sub>max</sub>]</span> to <span class="mth">[−1, 1]</span> puts 0 at <span class="mth">(κ+1)/(κ−1)</span>, and evaluating that growth there gives the factor stated. The square root comes from the <span class="mth">√(<i>z</i>²−1)</span>, which is why it is √κ and not κ.</p>`,
  note:'Both this and the steepest-descent bound ((κ−1)/(κ+1))ᵏ are upper bounds and neither is tight. What matters is the exponent: one square root separates a method that needs O(√κ) steps from one that needs O(κ), and on a grid problem where κ grows like n² that is the difference between n steps and n².',
  see:'numlin:4.1'
})}

${stCor('Finite termination, and why nobody relies on it', {
  hyp:'exact arithmetic',
  then:'conjugate gradients reaches the solution in at most <span class="mth"><i>n</i></span> steps',
  proof:`<p>The Krylov spaces are nested and each step either grows the space by a dimension or the residual is already zero. After <span class="mth"><i>n</i></span> steps the space is all of <span class="mth">ℝⁿ</span>, and the minimiser of <span class="mth">φ</span> over <span class="mth">ℝⁿ</span> is the solution.</p>`,
  note:'True and irrelevant in practice. n steps of CG cost more than an LU factorisation, and in floating point the orthogonality the argument rests on decays, so termination is not exact either. What makes CG the workhorse of large-scale computing is the other property: a good answer long before step n, in a count set by √κ rather than by n, with a few vectors of storage and no need for the matrix itself — only the ability to multiply by it.',
  see:'numlin:4.2'
})}

<p>Everything else follows from that last sentence. If the step count depends on κ, the way to make a large problem tractable is to change κ — solve <span class="mth"><i>M</i>⁻¹<i>A</i><b>x</b> = <i>M</i>⁻¹<b>b</b></span> with <span class="mth"><i>M</i></span> cheap and resembling <span class="mth"><i>A</i></span>. That is <strong>preconditioning</strong>, and it is why the literature on large sparse systems is overwhelmingly about preconditioners and hardly at all about the iteration, which has not changed since 1952.</p>

<h3 id="s7">What to actually do</h3>
<p>Six rules, each of which is one of the experiments in this wing.</p>
<p><strong>Never invert a matrix to solve a system.</strong> <span class="mth"><i>A</i>⁻¹<b>b</b></span> costs three times what a factorisation-and-solve costs, and is less accurate. If you need to apply the same inverse many times, keep the factors.</p>
<p><strong>Never form <span class="mth"><i>A</i>ᵀ<i>A</i></span> if you can avoid it.</strong> The normal equations square the condition number; QR does not. The same applies to reaching singular values through the eigenvalues of <span class="mth"><i>A</i>ᵀ<i>A</i></span> — a route that loses the smallest σ entirely once κ passes about <span class="mth">10⁸</span>, which this wing measures directly against a one-sided Jacobi SVD that never forms a normal equation.</p>
<p><strong>Check the residual to test the algorithm; check κ to decide whether to believe the answer.</strong> They are different questions and only one of them is answered by the number people usually print.</p>
<p><strong>Scale before you solve.</strong> Rows and columns differing by many orders of magnitude create a large κ that reflects the units rather than the problem, and equilibrating them is free.</p>
<p><strong>Change the basis rather than the precision.</strong> Fitting a polynomial in powers of <span class="mth"><i>x</i></span> produces a Hilbert-like matrix and is hopeless past degree ten; fitting in Chebyshev form is well conditioned to any degree you like. It is the same approximation problem — the difficulty was in the coordinates.</p>
<p><strong>For large sparse systems, iterate and precondition.</strong> Elimination fills in, iteration does not, and the whole engineering effort goes into the preconditioner.</p>
`;
