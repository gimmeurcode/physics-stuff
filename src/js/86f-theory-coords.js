/* ============================================================================
   THEORY — COORDINATE SYSTEMS AND JACOBIANS (Programme C wing C4)
   The wing that connects two things the site already had and never joined: the
   polar and spherical integrals of the integration wing, and the Jacobian
   matrix of the partial-derivatives wing.
   ============================================================================ */
const THEORY_COORDS = `
<div class="toc"><a href="#j0">A coordinate system is a map</a><a href="#j1">The Jacobian</a>
<a href="#j2">Change of variables</a><a href="#j3">The hypothesis</a>
<a href="#j4">The metric</a><a href="#j5">Three dimensions</a><a href="#j6">Choosing</a></div>

<h3 id="j0">A coordinate system is a map, and that is the whole idea</h3>
<p>"Polar coordinates" sounds like a way of labelling points. It is more useful to read it as a <em>map</em>: a rule <span class="mth"><i>T</i></span> taking a point <span class="mth">(<i>r</i>, θ)</span> of an ordinary rectangle to a point <span class="mth">(<i>x</i>, <i>y</i>)</span> of the plane, by <span class="mth"><i>x</i> = <i>r</i> cos θ</span>, <span class="mth"><i>y</i> = <i>r</i> sin θ</span>.</p>
<p>Once it is a map, everything the rest of the calculus knows about maps applies to it. It has a derivative. Its derivative is a matrix. That matrix has a determinant. And the <span class="mth"><i>r</i></span> in <span class="mth"><i>r</i> d<i>r</i> dθ</span>, which is otherwise a rule to memorise, is that determinant — nothing more and nothing else.</p>
<p>The grid lines help. The straight lines <span class="mth"><i>r</i> = const</span> and <span class="mth">θ = const</span> in the rectangle become circles and rays in the plane. That is why the picture of a "polar grid" looks the way it does: it is the image of an ordinary square grid under this map.</p>

${stDefn('A coordinate map and its Jacobian', `
<p>A <em>coordinate map</em> on a region <span class="mth"><i>R</i></span> of the <span class="mth">(<i>u</i>, <i>v</i>)</span> plane is a differentiable <span class="mth"><i>T</i>(<i>u</i>, <i>v</i>) = (<i>x</i>(<i>u</i>,<i>v</i>), <i>y</i>(<i>u</i>,<i>v</i>))</span>. Its <em>Jacobian matrix</em> and <em>Jacobian determinant</em> are</p>
${stEq('<i>DT</i> <span class="op">=</span> [ <i>x<sub>u</sub></i> &nbsp; <i>x<sub>v</sub></i> ; &nbsp; <i>y<sub>u</sub></i> &nbsp; <i>y<sub>v</sub></i> ] , &nbsp;&nbsp; <i>J</i> <span class="op">=</span> det <i>DT</i> <span class="op">=</span> <i>x<sub>u</sub>y<sub>v</sub></i> <span class="op">−</span> <i>x<sub>v</sub>y<sub>u</sub></i>')}`,
  { note:'For polar coordinates the matrix is [cos θ, −r sin θ ; sin θ, r cos θ] and its determinant is r(cos²θ + sin²θ) = r. The stage measures that four separate ways.',
    see:'coords:0.0', seeLabel:'Polar coordinates, as a map' })}

<h3 id="j1">Why the determinant is the area factor</h3>
<p>This is the one step worth doing slowly, because everything else is bookkeeping around it.</p>
<p>Take a small square of side <span class="mth"><i>h</i></span> at <span class="mth">(<i>u</i>, <i>v</i>)</span>. Because <span class="mth"><i>T</i></span> is differentiable, on that square it is well approximated by its derivative — the linear map <span class="mth"><i>DT</i></span> — plus a constant. A linear map takes the square to a parallelogram spanned by <span class="mth"><i>h</i>·<i>T<sub>u</sub></i></span> and <span class="mth"><i>h</i>·<i>T<sub>v</sub></i></span>, and the area of the parallelogram spanned by two vectors <em>is</em> the absolute determinant of the matrix with those columns. That fact comes from the linear-algebra wing and is not re-proved here.</p>
<p>So the image of the square has area <span class="mth">|<i>J</i>|<i>h</i>²</span>, up to an error that shrinks faster than <span class="mth"><i>h</i>²</span>. That is the whole content: <strong>the Jacobian is the local area factor</strong>, and it varies from point to point because the derivative does.</p>
<p>The stage measures this by taking the four corners of a small cell, mapping them, and computing the area of the quadrilateral they span. That number divided by <span class="mth"><i>h</i>²</span> approaches <span class="mth">|<i>J</i>|</span> — and it approaches it at <em>first order</em>, because a quadrilateral through four points on a curved boundary misses the curvature. The stage reports the order rather than the value, which is a stronger check: it tests the relationship rather than a coincidence at one <span class="mth"><i>h</i></span>.</p>

<h3 id="j2">The change-of-variables theorem</h3>

${stThm('Change of variables', {
  hyp:'<span class="mth"><i>T</i></span> is continuously differentiable and <strong>one-to-one</strong> on the interior of <span class="mth"><i>R</i></span>, with <span class="mth"><i>J</i> ≠ 0</span> there, and <span class="mth"><i>S</i> = <i>T</i>(<i>R</i>)</span>',
  then:'',
  eq:'∬<sub><i>S</i></sub> <i>f</i>(<i>x</i>,<i>y</i>) d<i>A</i> <span class="op">=</span> ∬<sub><i>R</i></sub> <i>f</i>(<i>T</i>(<i>u</i>,<i>v</i>)) |<i>J</i>| d<i>u</i> d<i>v</i>',
  proof:`<p>Partition <span class="mth"><i>R</i></span> into small squares of side <span class="mth"><i>h</i></span>. On each, <span class="mth"><i>T</i></span> is close to its derivative, so the image of that square is close to a parallelogram of area <span class="mth">|<i>J</i>|<i>h</i>²</span> — with an error that is <span class="mth"><i>o</i>(<i>h</i>²)</span> uniformly, by continuity of the derivative on a compact region.</p>
<p>The right-hand side is the limit of <span class="mth">∑ <i>f</i>(<i>T</i>(<i>u<sub>k</sub></i>,<i>v<sub>k</sub></i>))|<i>J<sub>k</sub></i>|<i>h</i>²</span>, which is a Riemann sum for it. The left-hand side is the limit of <span class="mth">∑ <i>f</i>(<i>T</i>(<i>u<sub>k</sub></i>,<i>v<sub>k</sub></i>))·area(image of the <em>k</em>-th square)</span>, a Riemann sum for the integral over <span class="mth"><i>S</i></span> — <em>provided the images tile <span class="mth"><i>S</i></span> without overlapping</em>, which is exactly where one-to-one is used and the only place it is used.</p>
<p>The two sums differ by <span class="mth">∑ <i>o</i>(<i>h</i>²)</span> over <span class="mth">O(<i>h</i><sup>−2</sup>)</span> squares, which tends to zero. Hence the two integrals are equal.</p>`,
  note:'The proof is one linear-algebra fact and one limit. Notice where the hypothesis entered: without it the images overlap, the second sum counts some of S more than once, and the equality fails by exactly the covering number.',
  see:'coords:1.0', seeLabel:'The area of a disc, three ways' })}

<h3 id="j3">The hypothesis is the theorem</h3>
<p>It is tempting to read "one-to-one" as a technicality. The stage exists to show that it is the whole statement.</p>
<p>Consider <span class="mth"><i>x</i> = <i>u</i>²</span>, <span class="mth"><i>y</i> = <i>v</i></span> on <span class="mth"><i>u</i> ∈ [−1,1]</span>, <span class="mth"><i>v</i> ∈ [0,1]</span>. Its Jacobian is <span class="mth">2<i>u</i></span>, and <span class="mth">∬|2<i>u</i>| d<i>u</i> d<i>v</i> = 2</span>. But the image is the unit square, of area 1. The theorem's conclusion is false, by a factor of exactly 2 — the number of times the map covers its image.</p>
<p>Three routes to "the area of the image" then give three different numbers, and the useful thing is that each is right about something:</p>
<ul>
<li><span class="mth">∬|<i>J</i>|</span> measures the area the map <strong>paints</strong>, overlaps counted twice: 2.</li>
<li><span class="mth">∮<i>x</i> d<i>y</i></span> round the image of the boundary measures what that boundary <strong>encloses</strong>, with orientation — and this boundary doubles back over itself, so the two halves cancel: 0.</li>
<li>Inverting the map over a grid measures the ground actually <strong>covered</strong>: 1.</li>
</ul>
<p>Only the first two were ever claimed to be equal, and only under a hypothesis that has failed. The stage measures the covering number as the ratio of the first to the third, so it can report the failure even on a map you typed yourself.</p>
<p><strong>But not every failure matters.</strong> Polar coordinates on a disc are not one-to-one either: the entire edge <span class="mth"><i>r</i> = 0</span> maps to the single point at the origin, and <span class="mth">θ = 0</span> and <span class="mth">θ = 2π</span> name the same ray. Both failures happen on a set of <em>zero area</em>, and an integral cannot see a set of zero area — so the theorem survives, and this is the standard licence under which polar coordinates are used at all. The fold is different in kind: it fails on a set of full measure. The distinction is not one of degree.</p>

<h3 id="j4">The metric, the scale factors, and where r dr dθ really comes from</h3>
<p>There is a second route to the Jacobian that never forms a determinant. Define the <em>first fundamental form</em>:</p>
<div class="eqb"><span class="mth"><i>E</i> <span class="op">=</span> |<i>T<sub>u</sub></i>|² , &nbsp;&nbsp; <i>F</i> <span class="op">=</span> <i>T<sub>u</sub></i> <span class="op">·</span> <i>T<sub>v</sub></i> , &nbsp;&nbsp; <i>G</i> <span class="op">=</span> |<i>T<sub>v</sub></i>|²</span></div>
<p>Then <span class="mth">|<i>J</i>| = <span class="rad"><i>EG</i> − <i>F</i>²</span></span>, which is Lagrange's identity applied to the two columns — a different fact from the determinant formula, arriving at the same number. The stage computes both and prints the difference.</p>
<p>These three numbers say more than the Jacobian alone. <span class="mth"><span class="rad"><i>E</i></span></span> and <span class="mth"><span class="rad"><i>G</i></span></span> are the <em>scale factors</em>: how much length one unit of each coordinate buys at that point. And <span class="mth"><i>F</i></span> is the dot product of the two coordinate directions, so <span class="mth"><i>F</i> = 0</span> says they meet at right angles — the system is <em>orthogonal</em>.</p>
<p>For an orthogonal system the formula collapses to <span class="mth">|<i>J</i>| = <span class="rad"><i>E</i></span>·<span class="rad"><i>G</i></span></span>: the area factor is just the product of the scale factors. For polar coordinates <span class="mth"><i>h<sub>r</sub></i> = 1</span> and <span class="mth"><i>h</i><sub>θ</sub> = <i>r</i></span> — moving one unit in <span class="mth"><i>r</i></span> moves one unit of length, but one radian of θ moves you a distance <span class="mth"><i>r</i></span>, because you are travelling round a circle of that radius. Their product is <span class="mth"><i>r</i></span>. That is where <span class="mth"><i>r</i> d<i>r</i> dθ</span> comes from, with no determinant written down at any point.</p>
<p>Area and angle are separate properties, and the wing separates them with two presets. A <em>shear</em> has <span class="mth"><i>J</i> = 1</span> and <span class="mth"><i>F</i> ≠ 0</span>: it preserves area and destroys angles. A <em>rotation</em> has <span class="mth"><i>J</i> = 1</span> and <span class="mth"><i>F</i> = 0</span>: it preserves both, which is what makes it rigid. And a <em>holomorphic</em> map has <span class="mth"><i>F</i> = 0</span> with <span class="mth"><i>J</i> = |<i>f</i>′|²</span>: it preserves angles and scales area, which is the geometric content of the Cauchy–Riemann equations.</p>

${stThm('The Jacobian from the metric', {
  hyp:'<span class="mth"><i>T</i></span> is differentiable at a point',
  then:'',
  eq:'|<i>J</i>| <span class="op">=</span> <span class="rad"><i>EG</i> <span class="op">−</span> <i>F</i>²</span> , &nbsp;&nbsp; and if <i>F</i> <span class="op">=</span> 0, &nbsp; |<i>J</i>| <span class="op">=</span> <i>h<sub>u</sub>h<sub>v</sub></i>',
  proof:`<p>Write the two column vectors as <span class="mth"><b>a</b> = <i>T<sub>u</sub></i></span> and <span class="mth"><b>b</b> = <i>T<sub>v</sub></i></span>. In the plane, the determinant of the matrix with those columns is the signed area of the parallelogram they span, which is <span class="mth">|<b>a</b>||<b>b</b>| sin γ</span> with <span class="mth">γ</span> the angle between them.</p>
<p>Now <span class="mth"><i>E</i> = |<b>a</b>|²</span>, <span class="mth"><i>G</i> = |<b>b</b>|²</span> and <span class="mth"><i>F</i> = |<b>a</b>||<b>b</b>| cos γ</span>. Hence</p>
${stEq('<i>EG</i> <span class="op">−</span> <i>F</i>² <span class="op">=</span> |<b>a</b>|²|<b>b</b>|²(1 <span class="op">−</span> cos²γ) <span class="op">=</span> (|<b>a</b>||<b>b</b>| sin γ)² <span class="op">=</span> <i>J</i>²')}
<p>Taking the positive square root gives <span class="mth">|<i>J</i>|</span>. If <span class="mth"><i>F</i> = 0</span> then <span class="mth">cos γ = 0</span> and the expression reduces to <span class="mth"><span class="rad"><i>E</i></span><span class="rad"><i>G</i></span> = <i>h<sub>u</sub>h<sub>v</sub></i></span>.</p>
<p>This is Lagrange's identity, and it is worth noticing that it never mentions coordinates: it is a statement about two vectors. That is what makes it an independent route rather than the determinant formula rearranged.</p>`,
  note:'The same identity in three dimensions is |J| = √det(gᵢⱼ), which is how a volume element is defined on a curved space — the general-relativity wing uses exactly this.',
  see:'coords:0.1', seeLabel:'The Jacobian, measured four ways' })}

<h3 id="j5">Three dimensions: r and ρ²sin φ</h3>
<p>Nothing changes except the count. A map from three variables to three has a 3×3 derivative, its determinant is the local <em>volume</em> factor, and the two standard systems give</p>
<div class="eqb"><span class="mth">cylindrical: &nbsp; d<i>V</i> <span class="op">=</span> <i>r</i> d<i>r</i> dθ d<i>z</i> &nbsp;&nbsp;&nbsp; spherical: &nbsp; d<i>V</i> <span class="op">=</span> ρ² sin φ dρ dφ dθ</span></div>
<p>Both are orthogonal, so both are products of scale factors and neither needs a determinant. For spherical coordinates they are <span class="mth">1</span>, <span class="mth">ρ</span> and <span class="mth">ρ sin φ</span>: one unit of <span class="mth">ρ</span> is one unit of length; one radian of <span class="mth">φ</span> carries you a distance <span class="mth">ρ</span>; one radian of <span class="mth">θ</span> carries you only <span class="mth">ρ sin φ</span>, because at colatitude <span class="mth">φ</span> you are going round a circle of that radius rather than a great one. Multiply and the element appears.</p>
<p>Both elements vanish somewhere, and both zeros are the coordinates announcing their own degeneracy rather than defects. On the axis <span class="mth">sin φ = 0</span> and every value of <span class="mth">θ</span> names the same point; at the origin <span class="mth">ρ² = 0</span> for the same kind of reason. As in the plane, these are sets of zero volume, which no integral can see.</p>
<p>The <span class="mth">ρ²</span> is not bookkeeping. It is why a thin shell at radius <span class="mth">ρ</span> has area <span class="mth">4πρ²</span> and therefore holds more material the further out it sits — which is why the outer part of a star holds most of its mass, and why a hollow sphere is nearly as stiff as a solid one at a fraction of the weight.</p>

<h3 id="j6">Choosing a system is not a matter of taste</h3>
<p>The wing ends with a measurement rather than an opinion. A ball integrated in spherical coordinates has three constant limits and comes out exact to round-off. The same ball in Cartesian coordinates is bounded by two nested square roots whose derivatives are infinite at the edge, and Gauss quadrature on a fixed grid cannot repair that — the error is thousands of times larger at the same cost.</p>
<p>The rule that generalises: <strong>choose the system in which the boundary of your region is a constant coordinate.</strong> A ball wants spherical, a cylinder wants cylindrical, a spherical cap wants cylindrical rather than spherical, and a region between two paraboloids wants parabolic coordinates that no textbook lists. The Jacobian is the price you pay for the convenience, and it is always payable — the theorem guarantees that, provided the map is one-to-one.</p>
<p>Two directions lead out of this wing. The metric coefficients <span class="mth"><i>E</i>, <i>F</i>, <i>G</i></span> are the first fundamental form of a surface, which is where differential geometry begins; and the same quantities on a curved spacetime give <span class="mth"><span class="rad">−<i>g</i></span> d⁴<i>x</i></span>, which is the volume element every integral in general relativity is written against.</p>
`;
