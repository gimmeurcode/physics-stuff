/* ============================================================================
   7b · THE LONG-FORM MATHEMATICS — the calculus wings
   One essay per wing. Each is written to be read straight through: the
   definitions come before the formulas, the formulas are derived rather than
   quoted, and every claim that the lab checks numerically says so.
   ============================================================================ */

const THEORY_VECTORS = `
<div class="toc">
  <a href="#v1">What a vector is</a><a href="#v2">The dot product</a><a href="#v3">Projections</a>
  <a href="#v4">The cross product</a><a href="#v5">Triple products</a><a href="#v6">Lines</a>
  <a href="#v7">Planes</a><a href="#v8">Quadric surfaces</a><a href="#v9">Coordinates</a>
</div>

<h3 id="v1">What a vector is, and what it is not</h3>
<p>A vector is a <strong>displacement</strong>: a magnitude together with a direction, with no location attached. Two arrows drawn in different places are the same vector if they are the same length and point the same way. Everything else in this wing follows from taking that seriously.</p>
<p>Addition is defined tip-to-tail because displacements compose that way — walk <span class="mth"><b>a</b></span>, then walk <span class="mth"><b>b</b></span>, and you have walked <span class="mth"><b>a</b> + <b>b</b></span>. It commutes because the parallelogram has two sides and both routes reach the same corner. Scalar multiplication stretches without turning, except that a negative scalar reverses. In components,</p>
<div class="eqb"><span class="mth"><b>a</b> <span class="op">+</span> <b>b</b> <span class="op">=</span> ⟨<i>a</i>₁<span class="op">+</span><i>b</i>₁, <i>a</i>₂<span class="op">+</span><i>b</i>₂, <i>a</i>₃<span class="op">+</span><i>b</i>₃⟩ , &nbsp;&nbsp; |<b>a</b>| <span class="op">=</span> √<span class="rad"><i>a</i>₁² <span class="op">+</span> <i>a</i>₂² <span class="op">+</span> <i>a</i>₃²</span></span></div>
<p>The length formula is Pythagoras applied twice — once in the <span class="mth"><i>xy</i></span>-plane and once more up to the tip. The lab draws that box explicitly in the <em>Vectors in space</em> stage, because it is the only geometric content in the formula.</p>
<p>Subtraction deserves a moment. <span class="mth"><b>a</b> <span class="op">−</span> <b>b</b></span> is the arrow <em>from</em> the tip of <span class="mth"><b>b</b></span> <em>to</em> the tip of <span class="mth"><b>a</b></span>: what you must add to <span class="mth"><b>b</b></span> to get <span class="mth"><b>a</b></span>. Relative position and relative velocity always come out in that order, and getting the order wrong is the commonest sign error in mechanics.</p>
<p class="note">The <strong>triangle inequality</strong> <span class="mth">|<b>a</b> <span class="op">+</span> <b>b</b>| ≤ |<b>a</b>| <span class="op">+</span> |<b>b</b>|</span> is not decoration: it is the one property a length must have to deserve the name, and it is what makes "distance" a metric. Equality holds exactly when the two arrows point the same way. The lab prints both sides so you can close the gap by hand.</p>
<h4>Direction cosines</h4>
<p>The components of the unit vector <span class="mth">â</span> are the cosines of the angles <span class="mth"><b>a</b></span> makes with the three axes, so</p>
<div class="eqb"><span class="mth">cos²α <span class="op">+</span> cos²β <span class="op">+</span> cos²γ <span class="op">=</span> 1</span></div>
<p>which is the three-dimensional Pythagoras again, and the reason a direction in space costs two numbers rather than three.</p>

<h3 id="v2">The dot product — one number from two vectors</h3>
<p>There are exactly two useful products of vectors, and they are distinguished by what they destroy. The dot product throws away everything except how much the two vectors agree:</p>
<div class="eqb"><span class="mth"><b>a</b> <span class="op">·</span> <b>b</b> <span class="op">=</span> <i>a</i>₁<i>b</i>₁ <span class="op">+</span> <i>a</i>₂<i>b</i>₂ <span class="op">+</span> <i>a</i>₃<i>b</i>₃ <span class="op">=</span> |<b>a</b>||<b>b</b>| cos θ</span></div>
<p>Those two expressions are not two definitions — the second is a <em>theorem</em>, proved by the law of cosines applied to the triangle with sides <span class="mth"><b>a</b>, <b>b</b>, <b>a</b>−<b>b</b></span>. Expand <span class="mth">|<b>a</b>−<b>b</b>|² = |<b>a</b>|² + |<b>b</b>|² − 2|<b>a</b>||<b>b</b>|cos θ</span> in components and the cross terms are exactly the coordinate sum. The lab computes both at every drag and prints their difference, which is zero.</p>
<p>The consequences are immediate and worth having by heart:</p>
<ul>
  <li><strong>Sign is angle.</strong> Positive means acute, negative means obtuse, and <strong>zero means perpendicular</strong> — the cheapest orthogonality test there is.</li>
  <li><strong>Length is a dot product with itself:</strong> <span class="mth"><b>a</b><span class="op">·</span><b>a</b> = |<b>a</b>|²</span>.</li>
  <li>It is commutative, distributes over addition, and pulls scalars out. Those three facts are what make it an <em>inner product</em>, and every inner-product space in mathematics — function spaces, Hilbert spaces, the state space of the quantum wing — inherits the geometry that follows.</li>
</ul>

${stThm('Cauchy–Schwarz inequality', {
  hyp:'<span class="mth"><b>a</b>, <b>b</b></span> are vectors in any real inner-product space',
  then:'',
  eq:'|<b>a</b> <span class="op">·</span> <b>b</b>| &nbsp;≤&nbsp; |<b>a</b>| |<b>b</b>|',
  proof:`<p>If <span class="mth"><b>b</b> = <b>0</b></span> both sides are 0. Otherwise consider, for real <span class="mth"><i>t</i></span>, the squared length</p>
${stEq('<i>p</i>(<i>t</i>) <span class="op">=</span> |<b>a</b> <span class="op">−</span> <i>t</i><b>b</b>|² <span class="op">=</span> |<b>a</b>|² <span class="op">−</span> 2<i>t</i>(<b>a</b><span class="op">·</span><b>b</b>) <span class="op">+</span> <i>t</i>²|<b>b</b>|²')}
<p>A squared length is never negative, so this quadratic in <span class="mth"><i>t</i></span> satisfies <span class="mth"><i>p</i>(<i>t</i>) ≥ 0</span> for <em>every</em> real <span class="mth"><i>t</i></span>. A quadratic with positive leading coefficient that never dips below the axis has at most one real root, so its discriminant is not positive:</p>
${stEq('4(<b>a</b><span class="op">·</span><b>b</b>)² <span class="op">−</span> 4|<b>a</b>|²|<b>b</b>|² &nbsp;≤&nbsp; 0')}
<p>Dividing by 4 and taking square roots gives the inequality.</p>
<p>Equality forces the discriminant to zero, so <span class="mth"><i>p</i></span> has a real root <span class="mth"><i>t</i>₀</span> — meaning <span class="mth">|<b>a</b> − <i>t</i>₀<b>b</b>| = 0</span>, i.e. <span class="mth"><b>a</b> = <i>t</i>₀<b>b</b></span>. So equality holds exactly when the vectors are parallel.</p>
<p>Nothing here used three dimensions, or coordinates at all — only that the inner product is bilinear, symmetric, and that <span class="mth">|<b>v</b>|² ≥ 0</span>. That is why the same inequality holds for functions, random variables and quantum states.</p>`,
  note:'This is what makes the angle definition legal: cos θ = (a·b)/(|a||b|) is only meaningful because Cauchy–Schwarz keeps that ratio inside [−1, 1].',
  see:'vectors:0.2', seeLabel:'The dot product is a projection' })}

${stCor('Triangle inequality', {
  hyp:'<span class="mth"><b>a</b>, <b>b</b></span> are vectors',
  then:'',
  eq:'|<b>a</b> <span class="op">+</span> <b>b</b>| &nbsp;≤&nbsp; |<b>a</b>| <span class="op">+</span> |<b>b</b>|',
  proof:`<p>Square the left side and expand using bilinearity:</p>
${stEq('|<b>a</b> <span class="op">+</span> <b>b</b>|² <span class="op">=</span> |<b>a</b>|² <span class="op">+</span> 2(<b>a</b><span class="op">·</span><b>b</b>) <span class="op">+</span> |<b>b</b>|²')}
<p>By Cauchy–Schwarz, <span class="mth"><b>a</b>·<b>b</b> ≤ |<b>a</b>·<b>b</b>| ≤ |<b>a</b>||<b>b</b>|</span>. Substituting the largest the middle term can be,</p>
${stEq('|<b>a</b> <span class="op">+</span> <b>b</b>|² &nbsp;≤&nbsp; |<b>a</b>|² <span class="op">+</span> 2|<b>a</b>||<b>b</b>| <span class="op">+</span> |<b>b</b>|² <span class="op">=</span> ( |<b>a</b>| <span class="op">+</span> |<b>b</b>| )²')}
<p>Both sides are non-negative, so taking square roots preserves the inequality.</p>
<p>Equality needs <span class="mth"><b>a</b>·<b>b</b> = |<b>a</b>||<b>b</b>|</span> — parallel <em>and</em> pointing the same way, not merely collinear.</p>`,
  note:'This is the one property a length must have to deserve the name; it is what makes distance a metric, and everything from convergence to the completeness of function spaces rests on it.',
  see:'vectors:0.0', seeLabel:'Vector arithmetic, with both sides printed' })}

<h3 id="v3">Projection is the whole point</h3>
<p>Ask: how much of <span class="mth"><b>a</b></span> points along <span class="mth"><b>b</b></span>? Drop a perpendicular from the tip of <span class="mth"><b>a</b></span> onto the line through <span class="mth"><b>b</b></span>. The signed length of the shadow is the <strong>scalar projection</strong>, and the shadow drawn as a vector is the <strong>vector projection</strong>:</p>
<div class="eqb"><span class="mth">comp<sub><b>b</b></sub><b>a</b> <span class="op">=</span> <span class="frac"><span class="nm"><b>a</b><span class="op">·</span><b>b</b></span><span class="den">|<b>b</b>|</span></span> , &nbsp;&nbsp; proj<sub><b>b</b></sub><b>a</b> <span class="op">=</span> <span class="frac"><span class="nm"><b>a</b><span class="op">·</span><b>b</b></span><span class="den"><b>b</b><span class="op">·</span><b>b</b></span></span> <b>b</b></span></div>
<p>What is left over, <span class="mth"><b>a</b> <span class="op">−</span> proj<sub><b>b</b></sub><b>a</b></span>, is orthogonal to <span class="mth"><b>b</b></span> — not by luck but by construction, and the lab prints the dot product as zero to confirm it. Splitting a vector into a piece along a direction and a piece across it is the single most reused move in the subject: it is Gram–Schmidt, it is least squares, it is the Fourier coefficient, and it is the decomposition of acceleration into <span class="mth">a<sub>T</sub></span> and <span class="mth">a<sub>N</sub></span> in the curves wing.</p>
<h4>Work</h4>
<p>A constant force <span class="mth"><b>F</b></span> moving an object through a displacement <span class="mth"><b>d</b></span> does work <span class="mth"><b>F</b><span class="op">·</span><b>d</b></span>, and only the component along the motion counts. That is why a force perpendicular to the velocity can never change a kinetic energy: the normal force on a sliding block, the tension in a pendulum string, the magnetic force <span class="mth"><i>q</i><b>v</b><span class="op">×</span><b>B</b></span> on a moving charge. A satellite in a circular orbit needs no engine for exactly this reason, and the circuits and E&amp;M wings lean on it constantly.</p>

<h3 id="v4">The cross product — a vector from two vectors</h3>
<p>The cross product keeps what the dot product threw away. <span class="mth"><b>a</b><span class="op">×</span><b>b</b></span> is defined to be perpendicular to both, with length equal to the area of the parallelogram they span, oriented by the right-hand rule:</p>
<div class="eqb"><span class="mth">|<b>a</b> <span class="op">×</span> <b>b</b>| <span class="op">=</span> |<b>a</b>||<b>b</b>| sin θ</span></div>
<p>and in components it is the formal determinant with <span class="mth">î, ĵ, k̂</span> in the top row. That mnemonic works because expanding along the first row produces exactly the pattern of cross terms the geometric definition demands.</p>
<p>Note the complementarity: the dot product vanishes for <strong>perpendicular</strong> vectors, the cross product for <strong>parallel</strong> ones, and between them they capture the entire angle. <strong>Lagrange's identity</strong> makes that precise —</p>
<div class="eqb"><span class="mth">|<b>a</b><span class="op">×</span><b>b</b>|² <span class="op">+</span> (<b>a</b><span class="op">·</span><b>b</b>)² <span class="op">=</span> |<b>a</b>|²|<b>b</b>|²</span></div>
<p>which is <span class="mth">sin²θ + cos²θ = 1</span> with the lengths restored. The lab checks it at every setting.</p>
<p class="note">The right-hand rule is not a convention that could have gone the other way without consequence. It is the choice that makes <span class="mth">î <span class="op">×</span> ĵ <span class="op">=</span> k̂</span>, and every sign in electromagnetism — the direction of <span class="mth"><b>B</b></span> around a wire, the sign of the Lorentz force, the orientation in Stokes' theorem — is downstream of it. The cross product is also <em>anticommutative</em>: <span class="mth"><b>a</b><span class="op">×</span><b>b</b> = −<b>b</b><span class="op">×</span><b>a</b></span>, and it is <em>not</em> associative, which is why it does not make the vectors into a ring.</p>
<h4>Torque</h4>
<p><span class="mth"><b>τ</b> = <b>r</b> <span class="op">×</span> <b>F</b></span>: only the part of the force perpendicular to the lever arm turns anything, and the magnitude <span class="mth">|<b>r</b>||<b>F</b>|sin θ</span> can be read either as a long arm with a small perpendicular force or a short arm with a large one. Push along the spanner and nothing happens, which the lab lets you verify by turning <span class="mth"><b>F</b></span> until the torque reaches zero.</p>

<h3 id="v5">Triple products and the determinant</h3>
<p>The <strong>scalar triple product</strong> <span class="mth"><b>a</b><span class="op">·</span>(<b>b</b><span class="op">×</span><b>c</b>)</span> is the signed volume of the parallelepiped the three vectors span, and it equals the determinant of the matrix whose rows they are. Cycling the three leaves it alone; swapping any two flips its sign. That antisymmetry <em>is</em> the determinant, and it is why a Jacobian determinant carries orientation information in the integration wing.</p>
<div class="eqb"><span class="mth"><b>a</b><span class="op">·</span>(<b>b</b><span class="op">×</span><b>c</b>) <span class="op">=</span> 0 &nbsp;⟺&nbsp; the three vectors are coplanar</span></div>
<p>This is the sharpest test for coplanarity there is, and the lab makes it visible: slide one component until the drawn box collapses flat and watch the number reach zero.</p>

<h3 id="v6">Lines in space</h3>
<p>A line is a point and a direction, and nothing else:</p>
<div class="eqb"><span class="mth"><b>r</b>(<i>t</i>) <span class="op">=</span> <b>p</b> <span class="op">+</span> <i>t</i> <b>d</b></span></div>
<p>Eliminating <span class="mth"><i>t</i></span> gives the symmetric equations <span class="mth">(<i>x</i>−<i>p</i>₁)/<i>d</i>₁ = (<i>y</i>−<i>p</i>₂)/<i>d</i>₂ = (<i>z</i>−<i>p</i>₃)/<i>d</i>₃</span>, which fail the moment a component of <span class="mth"><b>d</b></span> is zero. The parametric form never fails, which is why it is the honest one.</p>
<p><strong>Distance from a point.</strong> Take <span class="mth"><b>w</b> = <b>q</b> − <b>p</b></span>, project it onto <span class="mth"><b>d</b></span>, and measure what the projection threw away:</p>
<div class="eqb"><span class="mth"><i>dist</i> <span class="op">=</span> <span class="frac"><span class="nm">|<b>w</b> <span class="op">×</span> <b>d</b>|</span><span class="den">|<b>d</b>|</span></span></span></div>
<p>Both routes are computed in the lab and agree, and the foot of the perpendicular really does meet the line at a right angle — derived, not assumed.</p>
<p><strong>Two lines.</strong> In the plane two non-parallel lines must cross. In space they almost never do. They are <em>parallel</em> if their directions are proportional; otherwise they either <em>intersect</em> — which requires <span class="mth">(<b>p</b>₂−<b>p</b>₁)<span class="op">·</span>(<b>d</b>₁<span class="op">×</span><b>d</b>₂) = 0</span>, one equation among four free parameters — or they are <strong>skew</strong>, which is the generic case and has no two-dimensional analogue. The distance between skew lines is the gap projected onto their common perpendicular <span class="mth"><b>d</b>₁<span class="op">×</span><b>d</b>₂</span>.</p>

<h3 id="v7">Planes</h3>
<p>A plane is a point and a <strong>normal</strong>. Every displacement inside it must be perpendicular to <span class="mth"><b>n</b></span>, which is the whole definition:</p>
<div class="eqb"><span class="mth"><b>n</b> <span class="op">·</span> (<b>r</b> <span class="op">−</span> <b>p</b>) <span class="op">=</span> 0 &nbsp;&nbsp;⟹&nbsp;&nbsp; <i>ax</i> <span class="op">+</span> <i>by</i> <span class="op">+</span> <i>cz</i> <span class="op">=</span> <i>d</i></span></div>
<p>The coefficients of <span class="mth"><i>x</i>, <i>y</i>, <i>z</i></span> <em>are</em> the components of <span class="mth"><b>n</b></span>. That is the single most useful thing to know about the equation of a plane, and it makes the distance formula obvious: project the offset onto <span class="mth">n̂</span>.</p>
<div class="eqb"><span class="mth"><i>signed dist</i> <span class="op">=</span> <span class="frac"><span class="nm"><b>n</b><span class="op">·</span><b>q</b> <span class="op">−</span> <i>d</i></span><span class="den">|<b>n</b>|</span></span></span></div>
<p>The <em>sign</em> is the useful part: a plane cuts space into two half-spaces, and <span class="mth"><b>n</b><span class="op">·</span><b>r</b> − <i>d</i></span> is positive on one and negative on the other. Every clipping test in every renderer — including the one drawing these scenes — is that one expression.</p>
<p>Substituting a line into a plane leaves one linear equation in <span class="mth"><i>t</i></span>, with one root, none, or infinitely many according to whether <span class="mth"><b>n</b><span class="op">·</span><b>d</b></span> is nonzero, zero-with-the-point-off-the-plane, or zero-with-it-on. That trichotomy is all of linear algebra in miniature.</p>

<h3 id="v8">The quadric surfaces</h3>
<p>A second-degree equation in three variables can, after rotation and translation, only produce a short list of shapes, and the classification is entirely a matter of which squared terms are present and what signs they carry.</p>
<ul>
  <li><strong>Ellipsoid</strong> <span class="mth"><i>x</i>²/<i>a</i>² + <i>y</i>²/<i>b</i>² + <i>z</i>²/<i>c</i>² = 1</span> — every trace an ellipse, bounded in every direction. The only bounded quadric.</li>
  <li><strong>Hyperboloid of one sheet</strong> (one minus sign) — horizontal traces are ellipses that never vanish. It is <em>doubly ruled</em>: two whole families of straight lines lie in it, which is why cooling towers are built from straight rods.</li>
  <li><strong>Hyperboloid of two sheets</strong> (two minus signs) — horizontal traces are empty in a band, which is exactly the gap between the sheets. In the relativity wing this is the mass shell.</li>
  <li><strong>Elliptic cone</strong> (right-hand side zero) — the degenerate case between the two hyperboloids, and the asymptotic surface both approach. Slicing it with a plane is where the conic sections got their name.</li>
  <li><strong>Elliptic paraboloid</strong> <span class="mth"><i>z</i> = <i>x</i>²/<i>a</i>² + <i>y</i>²/<i>b</i>²</span> — the shape of every satellite dish, because parallel rays all meet at the focus.</li>
  <li><strong>Hyperbolic paraboloid</strong> <span class="mth"><i>z</i> = <i>y</i>²/<i>b</i>² − <i>x</i>²/<i>a</i>²</span> — the saddle. Its origin is a critical point that is a minimum along one axis and a maximum along the other, and it is the standard example in the partial-derivatives wing.</li>
  <li><strong>Cylinders</strong> — a variable that does not appear at all is a variable you are free in, so the trace is dragged along that whole axis. "Cylinder" in this subject does not mean circular.</li>
</ul>
<p>The method is always the same: <strong>set one variable to a constant and see what curve is left</strong>. The lab draws each surface from its own horizontal traces, so the picture is built by the method rather than illustrating it.</p>

<h3 id="v9">Cylindrical and spherical coordinates</h3>
<p>Cylindrical coordinates are polar coordinates in the plane with <span class="mth"><i>z</i></span> carried along untouched. Spherical coordinates measure <span class="mth">φ</span> down from the <span class="mth">+<i>z</i></span> axis and <span class="mth">θ</span> round from <span class="mth">+<i>x</i></span> — the convention that makes the volume element come out as <span class="mth">ρ² sin φ</span>.</p>
<div class="eqb"><span class="mth"><i>x</i> <span class="op">=</span> ρ sin φ cos θ , &nbsp; <i>y</i> <span class="op">=</span> ρ sin φ sin θ , &nbsp; <i>z</i> <span class="op">=</span> ρ cos φ</span></div>
<p>In each system the three coordinate surfaces meet at right angles — a sphere, a cone and a half-plane for the spherical case — and that orthogonality is what makes the systems useful rather than merely possible.</p>
<div class="eqb"><span class="mth"><i>dV</i> <span class="op">=</span> <i>r</i> <i>dr</i> <i>dθ</i> <i>dz</i> &nbsp;&nbsp;&nbsp; <i>dV</i> <span class="op">=</span> ρ² sin φ <i>dρ</i> <i>dφ</i> <i>dθ</i></span></div>
<p>These are not formulas to memorise; they are Jacobian determinants, and the lab computes them by differentiating the coordinate map numerically and taking the determinant of the 3×3 matrix that comes out. Notice that the spherical element vanishes on the axis, because the <span class="mth">θ</span> direction has nowhere to go there — the same degeneracy that makes a world map stretch Greenland.</p>
<p class="note">A coordinate system earns its keep when the <em>boundary of your region becomes a constant</em>. The integration wing's hardest Cartesian regions — the disc, the annulus, the ice-cream cone — are all plain rectangles in one of these two systems, and the volume element is what you pay for that.</p>
`;

