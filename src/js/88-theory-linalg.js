/* ============================================================================
   7d · THE LONG-FORM MATHEMATICS — LINEAR ALGEBRA
   ============================================================================ */
const THEORY_LINALG = `
<div class="toc">
  <a href="#l0">What the subject is about</a><a href="#l1">Elimination</a>
  <a href="#l2">Rank and the three outcomes</a><a href="#l3">Matrices as maps</a>
  <a href="#l4">Inverses</a><a href="#l5">Determinants</a><a href="#l6">Block form</a>
  <a href="#l7">Where it is used</a>
</div>

<h3 id="l0">What the subject is about</h3>
<p>Linear algebra is the study of maps that respect addition and scaling: <span class="mth"><i>T</i>(<b>u</b> + <b>v</b>) = <i>T</i><b>u</b> + <i>T</i><b>v</b></span> and <span class="mth"><i>T</i>(<i>c</i><b>v</b>) = <i>c T</i><b>v</b></span>. That is an austere-looking pair of conditions, and it is worth being clear about why they are the ones that matter. Almost nothing in nature is linear. What <em>is</em> true is that almost everything is <strong>locally</strong> linear — the derivative of the multivariable wing is exactly the linear map that best approximates a function near a point — and that linear problems are the only large problems we can actually solve. So the strategy of most of applied mathematics is: linearise, solve the linear problem, and iterate. This floor is the middle step.</p>
<p>Two objects carry the whole subject. A <strong>vector</strong> is something you can add and scale. A <strong>matrix</strong> is a linear map written in coordinates, and the key to reading one is this: <em>the columns of a matrix are the images of the basis vectors</em>. Everything else — the multiplication rule, the determinant, the eigenvalue problem — follows from taking that seriously.</p>

<h3 id="l1">Elimination, and why it is allowed</h3>
<p>Gaussian elimination uses exactly three moves on the rows of an augmented matrix <span class="mth">[<i>A</i> | <b>b</b>]</span>:</p>
<ul>
  <li>swap two rows;</li>
  <li>multiply a row by a nonzero number;</li>
  <li>add a multiple of one row to another.</li>
</ul>
<p>Each is <strong>invertible</strong>, and that is the entire justification for the method. An invertible operation cannot create or destroy solutions, so the reduced system has precisely the same solution set as the original. Elimination is therefore a chain of equivalences, not a procedure that happens to give the right answer. The stage records every step so the chain can be replayed.</p>
<p>Run to completion you reach <strong>reduced row echelon form</strong>: each leading entry is a 1, it is the only nonzero entry in its column, and the leading entries move strictly right as you go down. RREF is unique — it does not depend on the order the operations were done in — which is why quantities read off it are properties of the matrix rather than of your bookkeeping.</p>
<p class="note">Numerically one does <em>not</em> use exact RREF. Real solvers use LU with partial pivoting and never form the inverse, because dividing by a small pivot amplifies error. This laboratory pivots on the largest available entry for the same reason; the eigenvalue wing's condition number quantifies exactly how bad it can get.</p>

<h3 id="l2">Rank, nullity, and the three things that can happen</h3>
<p>The <strong>rank</strong> is the number of pivots — the number of genuinely independent equations. The <strong>nullity</strong> is the number of free columns. Since every column is either a pivot column or a free one:</p>
<div class="eqb"><span class="mth">rank + nullity = number of unknowns</span></div>
${stThm('Rank–nullity theorem', {
  hyp:'<span class="mth"><i>A</i></span> is an <span class="mth"><i>m</i>×<i>n</i></span> matrix, viewed as a linear map from <span class="mth">ℝ<sup><i>n</i></sup></span> to <span class="mth">ℝ<sup><i>m</i></sup></span>',
  then:'',
  eq:'rank(<i>A</i>) <span class="op">+</span> nullity(<i>A</i>) <span class="op">=</span> <i>n</i>',
  proof:`<p>Let <span class="mth"><i>k</i> = </span> nullity, and choose a basis <span class="mth"><b>u</b>₁, …, <b>u</b><sub><i>k</i></sub></span> of the null space. Extend it to a basis of the whole domain by adding vectors <span class="mth"><b>w</b>₁, …, <b>w</b><sub><i>n</i>−<i>k</i></sub></span>; this is always possible, and it is the only structural fact the proof needs.</p>
<p><em>Claim: the images <span class="mth"><i>A</i><b>w</b>₁, …, <i>A</i><b>w</b><sub><i>n</i>−<i>k</i></sub></span> are a basis of the column space.</em></p>
<p><strong>They span.</strong> Any element of the column space is <span class="mth"><i>A</i><b>x</b></span>. Expand <span class="mth"><b>x</b></span> in the full basis; the <span class="mth"><b>u</b></span> parts are killed by <span class="mth"><i>A</i></span>, leaving a combination of the <span class="mth"><i>A</i><b>w</b><sub><i>j</i></sub></span>.</p>
<p><strong>They are independent.</strong> Suppose <span class="mth">Σ <i>c</i><sub><i>j</i></sub> <i>A</i><b>w</b><sub><i>j</i></sub> = <b>0</b></span>. By linearity <span class="mth"><i>A</i>(Σ <i>c</i><sub><i>j</i></sub><b>w</b><sub><i>j</i></sub>) = <b>0</b></span>, so <span class="mth">Σ <i>c</i><sub><i>j</i></sub><b>w</b><sub><i>j</i></sub></span> lies in the null space and is therefore some combination <span class="mth">Σ <i>d</i><sub><i>i</i></sub><b>u</b><sub><i>i</i></sub></span>. That makes <span class="mth">Σ <i>c</i><sub><i>j</i></sub><b>w</b><sub><i>j</i></sub> − Σ <i>d</i><sub><i>i</i></sub><b>u</b><sub><i>i</i></sub> = <b>0</b></span> — a dependency among vectors we chose to be a basis, so every coefficient vanishes. In particular all <span class="mth"><i>c</i><sub><i>j</i></sub> = 0</span>.</p>
<p>So the column space has dimension <span class="mth"><i>n</i> − <i>k</i></span>, which is the rank, and <span class="mth">rank + <i>k</i> = <i>n</i></span>.</p>
<p>In elimination language this is the observation that every column of the reduced form is either a pivot column or a free one, and never both — but the argument above never mentions elimination, so it holds for linear maps with no matrix in sight.</p>`,
  note:'Note what the theorem counts: the number of UNKNOWNS n, the width of A, not the number of equations. That is why a system with more equations than unknowns can still have a free variable.',
  see:'linsys:0.2', seeLabel:'Infinitely many solutions, and how to describe them' })}

<p>This is the rank–nullity theorem, and stated that way it is bookkeeping rather than magic. It decides the three possible outcomes for <span class="mth"><i>A</i><b>x</b> = <b>b</b></span>:</p>
<ul>
  <li><strong>No solution</strong> — a pivot appears in the augmented column, giving a row that reads 0 = 1. Equivalently <span class="mth"><b>b</b></span> lies outside the column space of <span class="mth"><i>A</i></span>.</li>
  <li><strong>Exactly one</strong> — rank equals the number of unknowns, so no variable is free.</li>
  <li><strong>Infinitely many</strong> — some variable is free, and the answer is <em>one particular solution plus the entire null space</em>. Adding a null vector changes nothing, because <span class="mth"><i>A</i>(<b>x</b> + <b>n</b>) = <i>A</i><b>x</b> + <b>0</b></span>.</li>
</ul>

<h3 id="l3">Matrices as maps, and why multiplication looks like that</h3>
<p>Ask where <span class="mth"><i>AB</i></span> sends <span class="mth"><b>e</b><sub>1</sub></span>. Send <span class="mth"><b>e</b><sub>1</sub></span> through <span class="mth"><i>B</i></span> — that is the first column of <span class="mth"><i>B</i></span> — and then through <span class="mth"><i>A</i></span>. Doing that for each basis vector produces exactly the row-times-column rule. So <strong>matrix multiplication is composition of maps</strong>, and its awkward definition is forced rather than chosen.</p>
<p>Composition explains the properties immediately. It is associative because composing functions is. It is <em>not</em> commutative because rotating then stretching is genuinely not the same as stretching then rotating — the stage prints <span class="mth">|<i>AB</i> − <i>BA</i>|</span>, which is almost never zero. And <span class="mth">det(<i>AB</i>) = det<i>A</i> · det<i>B</i></span> because areas scale by one factor and then the other.</p>

<h3 id="l4">Inverses</h3>
<p>The inverse undoes the map, and it exists exactly when nothing has been lost. Every one of the following says the same thing about an <span class="mth"><i>n</i>×<i>n</i></span> matrix, and it is worth collecting them because problems arrive dressed in whichever one is convenient:</p>
<ul>
  <li><span class="mth"><i>A</i></span> is invertible;</li>
  <li>rank <span class="mth">=</span> <span class="mth"><i>n</i></span> — a pivot in every column;</li>
  <li>the columns are independent, and they span;</li>
  <li>the null space is only the zero vector;</li>
  <li><span class="mth">det <i>A</i> ≠ 0</span>;</li>
  <li>zero is not an eigenvalue;</li>
  <li>every singular value is nonzero.</li>
</ul>
<p>Geometrically, failure means the map has flattened space onto something lower-dimensional. Information is destroyed, not hidden, and no map can restore it. The stage shows this as the image of a disc collapsing to a segment.</p>
<p class="note">Computing an inverse to solve a system is almost always the wrong move: it costs about three times as much as elimination and is less accurate. <span class="mth"><i>A</i><sup>−1</sup><b>b</b></span> is notation for "solve", not an instruction.</p>

<h3 id="l5">The determinant</h3>
<p>The determinant is the factor by which a linear map multiplies area (in the plane), volume (in space), and the corresponding measure in higher dimensions. Its sign records orientation: negative means the image has been turned over, and no rotation will put it back. Once that is the definition, the properties usually presented as axioms become observations:</p>
<ul>
  <li>swapping two columns flips the sign — the figure is reflected;</li>
  <li>scaling a column by <span class="mth"><i>k</i></span> scales the determinant by <span class="mth"><i>k</i></span>;</li>
  <li>adding a multiple of one column to another changes nothing — that is a shear, which slides a shape without altering its area;</li>
  <li>the determinant is zero exactly when the image has collapsed.</li>
</ul>
<p>The third of these is what makes elimination determinant-preserving, so the determinant is simply the product of the pivots, with a sign from the row swaps. That is an <span class="mth"><i>O</i>(<i>n</i>³)</span> computation. Cofactor expansion, by contrast, costs <span class="mth"><i>O</i>(<i>n</i>!)</span> — for a 20×20 matrix that is the difference between microseconds and longer than the age of the universe, which is why cofactors are a definition and never an algorithm.</p>
<p><strong>Cramer's rule</strong> writes each unknown as a ratio of determinants. It is genuinely useful in theory — it shows the solution depends smoothly on the entries — and it is genuinely useless in practice for the same complexity reason. The stage computes it alongside elimination so the agreement can be seen and the cost compared.</p>

${stThm("Cramer's rule", {
  hyp:'<i>A</i><b>x</b> = <b>b</b> with <i>A</i> square and det <i>A</i> ≠ 0',
  then:'each unknown is a ratio of determinants, where <i>A</i><sub><i>i</i></sub> is <i>A</i> with its <i>i</i>th column replaced by <b>b</b>,',
  eq:'<i>x</i><sub><i>i</i></sub> <span class="op">=</span> <span class="frac"><span class="nm">det <i>A</i><sub><i>i</i></sub></span><span class="den">det <i>A</i></span></span>',
  proof:`<p>Let <span class="mth"><i>X</i><sub><i>i</i></sub></span> be the identity matrix with its <span class="mth"><i>i</i></span>th column replaced by <b>x</b>. Multiplying it by <span class="mth"><i>A</i></span> replaces that column by <span class="mth"><i>A</i></span><b>x</b> = <b>b</b> and leaves every other column of <span class="mth"><i>A</i></span> untouched, so</p>
${stEq('<i>A</i> <i>X</i><sub><i>i</i></sub> <span class="op">=</span> <i>A</i><sub><i>i</i></sub>')}
<p>Take determinants and use the fact that they multiply: <span class="mth">det <i>A</i> · det <i>X</i><sub><i>i</i></sub> = det <i>A</i><sub><i>i</i></sub></span>. But <span class="mth"><i>X</i><sub><i>i</i></sub></span> is an identity matrix with one column swapped in, and expanding along that column gives <span class="mth">det <i>X</i><sub><i>i</i></sub> = <i>x</i><sub><i>i</i></sub></span> at once. Divide by det <i>A</i>, which is non-zero by hypothesis, and the rule follows.</p>
<p>Notice the proof uses only that determinants multiply. No elimination, no induction on <i>n</i>, no cofactor bookkeeping — which is why the rule holds over any commutative ring, and why it is the right tool for proving that a solution depends polynomially on the entries.</p>`,
  note:'And yet nobody computes with it. Each determinant costs O(n³) by elimination, and there are n + 1 of them, so the rule is O(n⁴) against elimination\'s single O(n³) — and it is numerically worse besides, because the determinant of an ill-conditioned matrix is a poor thing to divide by. A formula can be the correct answer to "what is x?" and the wrong answer to "how do I find x?", and this is the standard example.',
  see:'linsys:laDet', seeLabel:'The determinant is an area factor' })}

<h3 id="l6">Block form</h3>
<p>A block matrix is a matrix whose entries are themselves matrices, and multiplication works block by block whenever the shapes match. This is not a curiosity; it is how anyone proves anything about large matrices without drowning in indices. The augmented matrix <span class="mth">[<i>A</i> | <b>b</b>]</span> is a block statement. So is a rotation acting on two coordinates while leaving a third alone, and so is every "divide and conquer" algorithm in numerical linear algebra.</p>

<h3 id="l7">Where this floor is used elsewhere in the laboratory</h3>
<ul>
  <li><strong>The circuit wing</strong> solves a linear system at every timestep — modified nodal analysis is elimination on a matrix built from the netlist, and its rank tells you whether the circuit is properly grounded.</li>
  <li><strong>The partial-derivatives wing</strong>'s Hessian and Jacobian are matrices, and their determinants classify critical points and rescale integrals.</li>
  <li><strong>The relativity wing</strong>'s Lorentz boost is a matrix, and the field tensor transforms by conjugation <span class="mth">Λ<i>F</i>Λᵀ</span>.</li>
  <li><strong>The quantum wing</strong>'s operators are matrices in disguise; a measurement outcome is an eigenvalue, which is why the next wing matters so much.</li>
</ul>
`;

const THEORY_VECSPACE = `
<div class="toc">
  <a href="#v0">Spaces and subspaces</a><a href="#v1">Independence and basis</a>
  <a href="#v2">The four subspaces</a><a href="#v3">Orthogonality</a>
  <a href="#v4">Gram–Schmidt</a><a href="#v5">Least squares</a><a href="#v6">Honest limits</a>
</div>

<h3 id="v0">Spaces and subspaces</h3>
<p>A <strong>vector space</strong> is a set closed under addition and scaling. The definition is deliberately thin, because the payoff is generality: <span class="mth">ℝⁿ</span> is one, but so is the set of polynomials of degree at most 3, the set of solutions of a linear differential equation, and the set of continuous functions on an interval. Every theorem proved here applies to all of them, which is why the differential-equations wing can speak of a two-dimensional solution space and mean it literally.</p>
<p>A <strong>subspace</strong> is a subset that is itself a space — it must contain the zero vector and be closed under both operations. In the plane the subspaces are exactly: the origin, any line through the origin, and the whole plane. A line that misses the origin is not a subspace, which is why the solution set of an inconsistent system is not one either.</p>

<h3 id="v1">Independence, basis, dimension</h3>
<p>Vectors are <strong>independent</strong> when the only combination equal to zero is the trivial one. The importance is not the definition but its consequence: with an independent set, the coefficients describing a vector are <em>unique</em>. That uniqueness is what makes coordinates meaningful, and it fails the moment the set is dependent.</p>
<p>A <strong>basis</strong> is an independent spanning set, and its size is the <strong>dimension</strong>. The theorem that makes this well posed is that every basis of a given space has the same size — so dimension is a property of the space, not of the description you happened to pick. It follows that in an <span class="mth"><i>n</i></span>-dimensional space any <span class="mth"><i>n</i>+1</span> vectors are dependent, which the span stage demonstrates by finding the dependency explicitly.</p>

<h3 id="v2">The four subspaces</h3>
<p>Every <span class="mth"><i>m</i>×<i>n</i></span> matrix carries four subspaces, and their relationships are the structural core of the subject:</p>
<ul>
  <li>the <strong>column space</strong> — everything <span class="mth"><i>A</i><b>x</b></span> can reach; dimension = rank;</li>
  <li>the <strong>null space</strong> — everything sent to zero; dimension = nullity;</li>
  <li>the <strong>row space</strong> — dimension = rank, the same rank;</li>
  <li>the <strong>left null space</strong> — the null space of <span class="mth"><i>A</i>ᵀ</span>.</li>
</ul>
<p>Row rank equals column rank, which is not obvious and is worth pausing on: the number of independent rows and the number of independent columns of any matrix are the same number. The null space is orthogonal to the row space, and the left null space is orthogonal to the column space — so the domain and the codomain each split cleanly into two perpendicular pieces.</p>

<h3 id="v3">Orthogonality</h3>
<p>Two vectors are orthogonal when <span class="mth"><b>u</b>·<b>v</b> = 0</span>. An <strong>orthonormal</strong> basis — mutually perpendicular unit vectors — makes everything easy, because the coefficient of a vector along <span class="mth"><b>q</b></span> is just <span class="mth"><b>v</b>·<b>q</b></span>, with no system to solve. A matrix with orthonormal columns satisfies <span class="mth"><i>Q</i>ᵀ<i>Q</i> = <i>I</i></span>, preserves all lengths and angles, and has <span class="mth"><i>Q</i><sup>−1</sup> = <i>Q</i>ᵀ</span> — the cheapest inverse in mathematics.</p>
<p>The <strong>projection</strong> of <span class="mth"><b>b</b></span> onto a subspace is the point of that subspace closest to <span class="mth"><b>b</b></span>, and the two descriptions — closest, and residual perpendicular — are the same condition. If the residual had any component along the subspace, sliding that way would get you closer, so it cannot be the minimum. This single equivalence is the engine of the rest of the floor.</p>

<h3 id="v4">Gram–Schmidt</h3>
<p>Given any independent set, build an orthonormal one by the only obvious move: take the next vector, subtract off the part already accounted for, and normalise what is left.</p>
<div class="eqb"><span class="mth"><b>w</b><sub>k</sub> = <b>v</b><sub>k</sub> − Σ<sub>j&lt;k</sub> (<b>v</b><sub>k</sub>·<b>q</b><sub>j</sub>) <b>q</b><sub>j</sub> , &nbsp;&nbsp; <b>q</b><sub>k</sub> = <b>w</b><sub>k</sub> / |<b>w</b><sub>k</sub>|</span></div>
<p>The residual is orthogonal to everything built so far by construction — that is what subtracting the projection <em>means</em>, not a lucky outcome. If the residual is zero the vector was already in the span, and the process has detected dependence as a side effect.</p>
<p class="note">In floating point the classical algorithm loses orthogonality badly on nearly dependent input, because subtracting two nearly equal vectors destroys precision. This laboratory reorthogonalises each vector twice, and the stage prints <span class="mth">|<i>Q</i>ᵀ<i>Q</i> − <i>I</i>|</span> so the decay is visible rather than assumed away. Production code uses Householder reflections instead, which are unconditionally stable.</p>

<h3 id="v5">Least squares</h3>
<p>When there are more equations than unknowns, <span class="mth"><i>A</i><b>x</b> = <b>b</b></span> usually has no solution: the column space is a low-dimensional slice of a big space, and <span class="mth"><b>b</b></span> almost certainly misses it. The honest response is to find the reachable point closest to <span class="mth"><b>b</b></span> — its orthogonal projection onto the column space. Requiring the residual to be perpendicular to every column gives</p>
<div class="eqb"><span class="mth"><i>A</i>ᵀ(<b>b</b> − <i>A</i><b>x̂</b>) = <b>0</b> &nbsp;&nbsp;⇒&nbsp;&nbsp; <i>A</i>ᵀ<i>A</i> <b>x̂</b> = <i>A</i>ᵀ<b>b</b></span></div>
<p>the <strong>normal equations</strong>. The least-squares stage checks the orthogonality directly rather than quoting this formula, because the orthogonality <em>is</em> the theorem and the formula is only it written in coordinates.</p>

${stThm('Projection theorem — closest and perpendicular are the same condition', {
  hyp:'<span class="mth"><i>W</i></span> is a subspace, <span class="mth"><b>b</b></span> a vector, and <span class="mth"><b>p</b> ∈ <i>W</i></span>',
  then:'<span class="mth"><b>p</b></span> is the point of <span class="mth"><i>W</i></span> closest to <span class="mth"><b>b</b></span> <strong>if and only if</strong> the residual <span class="mth"><b>b</b> − <b>p</b></span> is orthogonal to every vector in <span class="mth"><i>W</i></span>',
  proof:`<p><em>Perpendicular ⟹ closest.</em> Suppose <span class="mth"><b>b</b> − <b>p</b> ⊥ <i>W</i></span>, and let <span class="mth"><b>w</b> ∈ <i>W</i></span> be any other candidate. Split the error through <span class="mth"><b>p</b></span>:</p>
${stEq('<b>b</b> <span class="op">−</span> <b>w</b> <span class="op">=</span> (<b>b</b> <span class="op">−</span> <b>p</b>) <span class="op">+</span> (<b>p</b> <span class="op">−</span> <b>w</b>)')}
<p>The second bracket lies in <span class="mth"><i>W</i></span>, so it is orthogonal to the first. Pythagoras — which is exactly what orthogonality buys — gives</p>
${stEq('|<b>b</b> <span class="op">−</span> <b>w</b>|² <span class="op">=</span> |<b>b</b> <span class="op">−</span> <b>p</b>|² <span class="op">+</span> |<b>p</b> <span class="op">−</span> <b>w</b>|² &nbsp;≥&nbsp; |<b>b</b> <span class="op">−</span> <b>p</b>|²')}
<p>with equality only when <span class="mth"><b>w</b> = <b>p</b></span>. So <span class="mth"><b>p</b></span> is the unique minimiser.</p>
<p><em>Closest ⟹ perpendicular.</em> Suppose the residual had a nonzero component along some unit <span class="mth"><b>u</b> ∈ <i>W</i></span>, say <span class="mth">(<b>b</b> − <b>p</b>)·<b>u</b> = <i>c</i> ≠ 0</span>. Step that way: <span class="mth"><b>p</b>′ = <b>p</b> + <i>c</i><b>u</b></span>, still in <span class="mth"><i>W</i></span>. Then</p>
${stEq('|<b>b</b> <span class="op">−</span> <b>p</b>′|² <span class="op">=</span> |<b>b</b> <span class="op">−</span> <b>p</b>|² <span class="op">−</span> 2<i>c</i>[(<b>b</b><span class="op">−</span><b>p</b>)<span class="op">·</span><b>u</b>] <span class="op">+</span> <i>c</i>² <span class="op">=</span> |<b>b</b> <span class="op">−</span> <b>p</b>|² <span class="op">−</span> <i>c</i>²')}
<p>strictly smaller, so <span class="mth"><b>p</b></span> was not the closest point. Contradiction.</p>
<p>Applying the perpendicularity condition to the columns of <span class="mth"><i>A</i></span> — requiring <span class="mth"><i>A</i>ᵀ(<b>b</b> − <i>A</i><b>x̂</b>) = <b>0</b></span> — is the whole derivation of the normal equations. The formula is the theorem written in coordinates, which is why the lab checks the orthogonality instead of quoting the formula.</p>`,
  note:'Everything downstream is this one equivalence: least squares, regression, Fourier coefficients (projection onto sines and cosines), and conditional expectation in probability.',
  see:'vecspace:1.2', seeLabel:'Projection is the closest point' })}
<p>Two warnings the stage lets you provoke. Least squares minimises the sum of <em>squared</em> errors, so a single distant outlier outweighs many small errors — place one and watch the line swing. And adding parameters always reduces the residual, so a falling error is not evidence of a better model; with as many coefficients as data points the curve interpolates exactly and predicts nothing.</p>
<p class="note">Forming <span class="mth"><i>A</i>ᵀ<i>A</i></span> squares the condition number, so the normal equations are the textbook route and not the numerical one. Serious software solves least squares by QR or by the SVD.</p>

<h3 id="v6">What is honestly shown</h3>
<p>The stages here work in two dimensions because that is what can be drawn, and the vectors are real. Every statement made — independence, projection, the normal equations, rank–nullity — holds verbatim in <span class="mth">ℝⁿ</span> and, with an inner product, in spaces of functions. The Fourier wing is precisely that generalisation: sines and cosines are an orthonormal basis, and a Fourier coefficient is an inner product, computed exactly as <span class="mth"><b>v</b>·<b>q</b></span> is here.</p>
`;

const THEORY_EIGEN = `
<div class="toc">
  <a href="#e0">The question</a><a href="#e1">The characteristic equation</a>
  <a href="#e2">Diagonalisation</a><a href="#e3">When it fails</a>
  <a href="#e4">Symmetric matrices</a><a href="#e5">Definiteness</a>
  <a href="#e6">The SVD</a><a href="#e7">Where it all shows up</a>
</div>

<h3 id="e0">The question</h3>
<p>A matrix turns almost every vector. Are there directions it does not turn?</p>
<div class="eqb"><span class="mth"><i>A</i><b>v</b> = λ<b>v</b> , &nbsp;&nbsp; <b>v</b> ≠ <b>0</b></span></div>
<p>Such a <span class="mth"><b>v</b></span> is an <strong>eigenvector</strong> and the stretch factor <span class="mth">λ</span> is its <strong>eigenvalue</strong>. The stage makes the search physical: drag a vector until <span class="mth"><b>v</b> × <i>A</i><b>v</b></span> reads zero, which happens exactly when the two are parallel. The reason to care is that in the eigen-directions a complicated map is only a stretch — and if you can find enough of them, the map becomes trivial in the right coordinates.</p>

<h3 id="e1">The characteristic equation</h3>
<p>Rearranging, <span class="mth">(<i>A</i> − λ<i>I</i>)<b>v</b> = <b>0</b></span> with <span class="mth"><b>v</b> ≠ <b>0</b></span>, so <span class="mth"><i>A</i> − λ<i>I</i></span> has a nontrivial null space, so it is singular, so</p>
<div class="eqb"><span class="mth">det(<i>A</i> − λ<i>I</i>) = 0</span></div>
<p>The equation is forced, not invented, and the stage plots the polynomial so the eigenvalues are visibly its roots. Two consequences are free and are printed: the sum of the eigenvalues is the <strong>trace</strong>, and their product is the <strong>determinant</strong>. Both are checkable against the matrix you typed.</p>
<p>Over the complex numbers an <span class="mth"><i>n</i>×<i>n</i></span> matrix always has <span class="mth"><i>n</i></span> eigenvalues with multiplicity. Over the reals it may have none: a rotation turns every direction, so nothing survives, and the discriminant goes negative. The complex pair that appears is not bookkeeping — its modulus is the scale factor and its argument is the rotation angle, which is exactly why complex eigenvalues produce spirals in a phase plane.</p>

<h3 id="e2">Diagonalisation</h3>
<p>Put independent eigenvectors in the columns of <span class="mth"><i>P</i></span>. Then</p>
<div class="eqb"><span class="mth"><i>A</i> = <i>P D P</i><sup>−1</sup> , &nbsp;&nbsp; <i>D</i> = diag(λ<sub>1</sub>, …, λ<sub>n</sub>)</span></div>
<p>Read right to left this is a change of language: <span class="mth"><i>P</i><sup>−1</sup></span> rewrites a vector in eigen-coordinates, <span class="mth"><i>D</i></span> stretches along the axes, <span class="mth"><i>P</i></span> translates back. Nothing about the map changes; only the description does.</p>
<p>The payoff is powers: <span class="mth"><i>A</i><sup>n</sup> = <i>P D</i><sup>n</sup><i>P</i><sup>−1</sup></span>, and <span class="mth"><i>D</i><sup>n</sup></span> is just the eigenvalues raised to the power. The stage computes <span class="mth"><i>A</i><sup>n</sup></span> both ways and prints the difference. Raise the power and every orbit collapses onto the eigendirection with the largest <span class="mth">|λ|</span> — which is why the power method works, why a Markov chain forgets its starting state, and why <span class="mth">|λ| &lt; 1</span> is the stability condition for any linear iteration.</p>

<h3 id="e3">When diagonalisation fails</h3>
<p>A repeated eigenvalue is not itself a problem — the identity has one and is already diagonal. The problem is a shortage of independent eigenvectors. The shear <span class="mth">[[1,1],[0,1]]</span> has λ = 1 twice but only one eigendirection; <span class="mth"><i>P</i></span> is singular and no such factorisation exists. Such a matrix is <strong>defective</strong>, and the repair is Jordan form.</p>
<p>Its powers still exist and involve a factor of <span class="mth"><i>n</i>λ<sup><i>n</i>−1</sup></span>. That stray <span class="mth"><i>n</i></span> is the same stray <span class="mth"><i>t</i></span> that appears in the repeated-root case of a second-order differential equation, for exactly the same reason: a missing independent direction has to be replaced by something, and what replaces it grows one power faster.</p>

<h3 id="e4">Symmetric matrices — the spectral theorem</h3>
<p>If <span class="mth"><i>A</i> = <i>A</i>ᵀ</span> then the eigenvalues are all real, eigenvectors for different eigenvalues are automatically orthogonal, and there is always a full orthonormal set. So</p>
<div class="eqb"><span class="mth"><i>A</i> = <i>Q</i> Λ <i>Q</i>ᵀ , &nbsp;&nbsp; <i>Q</i>ᵀ<i>Q</i> = <i>I</i></span></div>
<p>No defective symmetric matrix exists. This is the best-behaved situation in the subject, and it is not a rare one: covariance matrices, Hessians, moments of inertia, quadratic forms and the Hamiltonians of quantum mechanics are all symmetric (or their complex analogue, Hermitian), which is why physical observables have real values.</p>

${stThm('Symmetric matrices have real eigenvalues', {
  hyp:'<span class="mth"><i>A</i></span> is a real symmetric matrix, <span class="mth"><i>A</i> = <i>A</i>ᵀ</span>',
  then:'every eigenvalue of <span class="mth"><i>A</i></span> is real',
  proof:`<p>Work in the complex vector space, where the characteristic polynomial certainly has roots. Let <span class="mth"><i>A</i><b>v</b> = λ<b>v</b></span> with <span class="mth"><b>v</b> ≠ <b>0</b></span>, possibly complex. Write <span class="mth"><b>v</b>*</span> for the conjugate transpose.</p>
<p>Evaluate the scalar <span class="mth"><b>v</b>*<i>A</i><b>v</b></span> in two ways. Using <span class="mth"><i>A</i><b>v</b> = λ<b>v</b></span>:</p>
${stEq('<b>v</b>*<i>A</i><b>v</b> <span class="op">=</span> <b>v</b>*(λ<b>v</b>) <span class="op">=</span> λ (<b>v</b>*<b>v</b>)')}
<p>Now take the conjugate transpose of the whole scalar. Since <span class="mth"><i>A</i></span> is real and symmetric, <span class="mth"><i>A</i>* = <i>A</i></span>, so <span class="mth">(<b>v</b>*<i>A</i><b>v</b>)* = <b>v</b>*<i>A</i><b>v</b></span> — the scalar equals its own conjugate. But that same conjugate is <span class="mth">λ̄(<b>v</b>*<b>v</b>)</span>.</p>
<p>Therefore <span class="mth">λ(<b>v</b>*<b>v</b>) = λ̄(<b>v</b>*<b>v</b>)</span>. And <span class="mth"><b>v</b>*<b>v</b> = Σ|<i>v</i><sub><i>i</i></sub>|² &gt; 0</span> because <span class="mth"><b>v</b> ≠ <b>0</b></span>, so it may be cancelled: <span class="mth">λ = λ̄</span>, which says <span class="mth">λ</span> is real.</p>
<p>The positivity of <span class="mth"><b>v</b>*<b>v</b></span> is doing real work — it is the only step that rules out dividing by zero, and it is why the argument needs the conjugate rather than the plain transpose.</p>`,
  note:'This is why quantum observables are Hermitian: a measurement must return a real number, and Hermiticity is exactly the condition that guarantees it.',
  see:'eigen:0.0', seeLabel:'The directions a matrix does not turn' })}

${stThm('Eigenvectors of a symmetric matrix are orthogonal', {
  hyp:'<span class="mth"><i>A</i> = <i>A</i>ᵀ</span>, with <span class="mth"><i>A</i><b>u</b> = λ<b>u</b></span> and <span class="mth"><i>A</i><b>v</b> = μ<b>v</b></span> and <span class="mth">λ ≠ μ</span>',
  then:'<span class="mth"><b>u</b> <span class="op">·</span> <b>v</b> = 0</span>',
  proof:`<p>Compute the scalar <span class="mth"><b>u</b>ᵀ<i>A</i><b>v</b></span> twice, moving <span class="mth"><i>A</i></span> onto whichever side is convenient — which symmetry permits, since <span class="mth"><b>u</b>ᵀ<i>A</i> = (<i>A</i>ᵀ<b>u</b>)ᵀ = (<i>A</i><b>u</b>)ᵀ</span>.</p>
${stEq('<b>u</b>ᵀ<i>A</i><b>v</b> <span class="op">=</span> <b>u</b>ᵀ(μ<b>v</b>) <span class="op">=</span> μ (<b>u</b><span class="op">·</span><b>v</b>)')}
${stEq('<b>u</b>ᵀ<i>A</i><b>v</b> <span class="op">=</span> (<i>A</i><b>u</b>)ᵀ<b>v</b> <span class="op">=</span> (λ<b>u</b>)ᵀ<b>v</b> <span class="op">=</span> λ (<b>u</b><span class="op">·</span><b>v</b>)')}
<p>Subtracting, <span class="mth">(λ − μ)(<b>u</b>·<b>v</b>) = 0</span>. Since <span class="mth">λ ≠ μ</span> the first factor is nonzero, so <span class="mth"><b>u</b>·<b>v</b> = 0</span>.</p>
<p>That is the whole argument, and it explains the geometry the lab draws: the principal axes of a quadratic form meet at right angles not by construction but because the matrix is symmetric. For a repeated eigenvalue the eigenspace has dimension greater than one and an orthonormal basis can be chosen inside it by Gram–Schmidt, which is what completes the spectral theorem.</p>`,
  note:'Drop symmetry and it fails immediately: a shear has a repeated eigenvalue and only one eigendirection, and a rotation has no real eigenvector at all.',
  see:'eigen:2.0', seeLabel:'Quadratic forms and definiteness' })}

<h3 id="e5">Definiteness</h3>
<p>A symmetric matrix defines the quadratic form <span class="mth"><i>Q</i>(<b>x</b>) = <b>x</b>ᵀ<i>A</i><b>x</b></span>, drawn on the stage as a landscape. By the spectral theorem it is always a bowl, a dome or a saddle aligned with the eigenvectors — never anything more exotic. It is <strong>positive definite</strong> when every eigenvalue is positive, and the stage decides this two independent ways, by eigenvalue and by Sylvester's leading-minor criterion, which must agree.</p>
<p>This is the second-derivative test of the calculus wing wearing different clothes. The Hessian is symmetric; minimum, maximum and saddle are positive definite, negative definite and indefinite; and the discriminant <span class="mth"><i>D</i> = <i>f<sub>xx</sub>f<sub>yy</sub></i> − <i>f<sub>xy</sub></i>²</span> quoted in every calculus course is the determinant of that matrix.</p>

<h3 id="e6">The singular value decomposition</h3>
<p>Eigenvalues need a square matrix and may not exist over the reals. The SVD has neither limitation. <em>Every</em> matrix, of any shape, factors as</p>
<div class="eqb"><span class="mth"><i>A</i> = <i>U</i> Σ <i>V</i>ᵀ</span></div>
<p>with <span class="mth"><i>U</i></span> and <span class="mth"><i>V</i></span> orthogonal and <span class="mth">Σ</span> diagonal with non-negative entries. Geometrically: <strong>a rotation, a stretch along perpendicular axes, another rotation</strong>. Equivalently — and this is the sentence to keep — <strong>the image of the unit circle is always an ellipse</strong>. The singular values are its semi-axes, the columns of <span class="mth"><i>V</i></span> are the directions in the circle that map to them, and the columns of <span class="mth"><i>U</i></span> are the axis directions.</p>
<p>The construction is an eigenproblem in disguise: <span class="mth"><i>A</i>ᵀ<i>A</i></span> is symmetric and positive semidefinite, its eigenvectors are <span class="mth"><i>V</i></span>, and <span class="mth">σ<sub>i</sub> = √λ<sub>i</sub></span>. From the SVD you can read off the rank (the number of nonzero σ), the condition number <span class="mth">σ<sub>1</sub>/σ<sub>n</sub></span>, and the best low-rank approximation — which is what image compression, principal component analysis and latent semantic indexing all are.</p>
<p class="note">The condition number is a property of the matrix, not of your algorithm. A nearly singular matrix will lose you digits however carefully you eliminate, which is why numerical analysts look at the SVD rather than at the determinant: a matrix can have determinant 1 and still be hopelessly ill-conditioned.</p>

<h3 id="e7">Where this shows up in the rest of the laboratory</h3>
<ul>
  <li><strong>Differential equations</strong> — a linear system <span class="mth"><b>x</b>′ = <i>A</i><b>x</b></span> has solutions <span class="mth"><i>e</i><sup>λt</sup><b>v</b></span>, so the eigenvalues decide growth, decay and oscillation, and the phase portrait's node, saddle, spiral or centre is read straight off them.</li>
  <li><strong>Oscillations</strong> — normal modes are eigenvectors of the stiffness matrix, and the natural frequencies are square roots of its eigenvalues.</li>
  <li><strong>Quantum mechanics</strong> — observables are Hermitian operators, measured values are eigenvalues (hence real), and eigenstates are the states with definite values. The quantum wing's probe reading <span class="mth">∇²ψ/ψ</span> as a constant is that statement in the position representation.</li>
  <li><strong>Rotation</strong> — the principal axes of a rigid body are the eigenvectors of its inertia tensor, which is why an object spun about them does not wobble.</li>
  <li><strong>Relativity</strong> — the light-cone directions are the eigenvectors of a Lorentz boost, with eigenvalues the Doppler factors <span class="mth"><i>e</i><sup>±φ</sup></span>.</li>
</ul>
`;
