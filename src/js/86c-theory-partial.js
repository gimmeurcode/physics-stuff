const THEORY_PARTIAL = `
<div class="toc">
  <a href="#p1">Functions of two variables</a><a href="#p2">Limits</a><a href="#p3">Partial derivatives</a>
  <a href="#p4">Higher order &amp; Clairaut</a><a href="#p5">Tangent planes</a><a href="#p6">The chain rule</a>
  <a href="#p7">Gradients</a><a href="#p8">Extrema</a><a href="#p9">Lagrange</a><a href="#p10">The Jacobian</a>
</div>

<h3 id="p1">A surface, seen two ways</h3>
<p>A function of two variables is a surface over the plane, and a flat page can show it honestly in only two ways. A <strong>contour map</strong> draws the level curves <span class="mth"><i>f</i>(<i>x</i>,<i>y</i>) = <i>k</i></span> — exactly what an Ordnance Survey sheet does, and for the same reason: closely spaced contours mean steep ground. <strong>Traces</strong> hold one variable fixed and leave an ordinary one-variable curve.</p>
<p>The domain matters as much as the rule. <span class="mth">√(<i>x</i>²+<i>y</i>²)</span> is defined everywhere and has no tangent plane at the origin; <span class="mth">1/(<i>x</i>²+<i>y</i>²)</span> has a hole there. For three variables the same objects exist as <strong>level surfaces</strong>, which is how a potential in the E&amp;M wing is drawn.</p>

<h3 id="p2">Limits, and why lines are not enough</h3>
<p>In one variable there are two ways to approach a point. In two there are infinitely many, and</p>
<div class="eqb"><span class="mth">lim<sub>(<i>x</i>,<i>y</i>)→(<i>a</i>,<i>b</i>)</sub> <i>f</i> <span class="op">=</span> <i>L</i></span></div>
<p>requires that <em>every</em> one of them gives <span class="mth"><i>L</i></span>. A single disagreeing path is a complete proof that no limit exists; agreement on a family of paths proves nothing at all.</p>
<p>Two examples settle the matter. For <span class="mth"><i>xy</i>/(<i>x</i>²+<i>y</i>²)</span> the value along <span class="mth"><i>y</i> = <i>mx</i></span> is <span class="mth"><i>m</i>/(1+<i>m</i>²)</span>, which depends on the line — so no limit. For <span class="mth"><i>x</i>²<i>y</i>/(<i>x</i>⁴+<i>y</i>²)</span> <em>every straight line</em> gives 0, so a line test passes it — and along the parabola <span class="mth"><i>y</i> = <i>x</i>²</span> the value is <span class="mth">½</span> at every point. One curved path destroys it.</p>
<p>The decisive test is polar. Write <span class="mth"><i>f</i></span> in terms of <span class="mth"><i>r</i></span> and <span class="mth">θ</span>; if</p>
<div class="eqb"><span class="mth">|<i>f</i>(<i>r</i>, θ) <span class="op">−</span> <i>L</i>| ≤ <i>g</i>(<i>r</i>) &nbsp; with &nbsp; <i>g</i>(<i>r</i>) → 0 &nbsp; independently of θ</span></div>
<p>then the limit is <span class="mth"><i>L</i></span> — the squeeze theorem, in two variables. The lab measures exactly that: it plots <span class="mth"><i>f</i></span> around a circle of radius <span class="mth"><i>r</i></span> and reports the <em>spread</em> over θ as <span class="mth"><i>r</i></span> shrinks. If the spread collapses, the limit exists; if it refuses to, no single value can be the limit and no redefinition of <span class="mth"><i>f</i>(0,0)</span> can make the function continuous.</p>

<h3 id="p3">Partial derivatives</h3>
<p>Freeze <span class="mth"><i>y</i></span> at <span class="mth"><i>b</i></span> and you are left with a curve; its slope at <span class="mth"><i>x</i> = <i>a</i></span> is <span class="mth"><i>f</i><sub><i>x</i></sub>(<i>a</i>,<i>b</i>)</span>. That is the whole definition, and everything you know about one-variable derivatives transfers unchanged.</p>
<div class="eqb"><span class="mth"><i>f</i><sub><i>x</i></sub> <span class="op">=</span> lim<sub><i>h</i>→0</sub> <span class="frac"><span class="nm"><i>f</i>(<i>a</i>+<i>h</i>, <i>b</i>) <span class="op">−</span> <i>f</i>(<i>a</i>, <i>b</i>)</span><span class="den"><i>h</i></span></span></span></div>
<p>What is new is that there are now two of them — and, as the next sections show, that they are <em>not</em> the whole story. A function can have both partial derivatives at a point and still fail to be differentiable there, because the partials only pin down two of the infinitely many directions.</p>

<h3 id="p4">Higher-order partials and Clairaut's theorem</h3>
<p>Differentiate again and there are four second-order partials, of which the two mixed ones are equal whenever they are continuous:</p>
<div class="eqb"><span class="mth"><i>f</i><sub><i>xy</i></sub> <span class="op">=</span> <i>f</i><sub><i>yx</i></sub></span></div>
<p>This is <strong>Clairaut's theorem</strong> and it is not obvious: it says the order in which you take two different limits does not matter, and there are (contrived) functions where it fails. The lab differentiates symbolically along both routes and prints the gap as zero, with both derivations shown in full.</p>
<p>The mixed partial has a meaning worth holding on to: it measures the <strong>twist</strong> of the surface — how fast the slope in <span class="mth"><i>x</i></span> changes as you move in <span class="mth"><i>y</i></span>. It is zero exactly when the function separates as <span class="mth"><i>g</i>(<i>x</i>) + <i>h</i>(<i>y</i>)</span>, and it is the off-diagonal entry of the Hessian that decides whether a critical point is a saddle.</p>

<h3 id="p5">Tangent planes, differentials, and what differentiability means</h3>
<p>The plane matching both the height and both slopes at <span class="mth">(<i>a</i>,<i>b</i>)</span> is</p>
<div class="eqb"><span class="mth"><i>L</i>(<i>x</i>,<i>y</i>) <span class="op">=</span> <i>f</i>(<i>a</i>,<i>b</i>) <span class="op">+</span> <i>f</i><sub><i>x</i></sub>(<i>a</i>,<i>b</i>)(<i>x</i><span class="op">−</span><i>a</i>) <span class="op">+</span> <i>f</i><sub><i>y</i></sub>(<i>a</i>,<i>b</i>)(<i>y</i><span class="op">−</span><i>b</i>)</span></div>
<p>with normal <span class="mth">⟨<i>f</i><sub><i>x</i></sub>, <i>f</i><sub><i>y</i></sub>, −1⟩</span> — which is the gradient of <span class="mth"><i>z</i> − <i>f</i>(<i>x</i>,<i>y</i>)</span>, and the cleanest way to remember it.</p>
<p><strong>Differentiability</strong> is the statement that this plane is a genuine first-order approximation: the error must be <span class="mth"><i>o</i>(<i>h</i>)</span> as you move a distance <span class="mth"><i>h</i></span> in <em>any</em> direction. That is a real extra condition beyond the existence of the two partials. The lab measures it: it takes the worst error over a circle of radius <span class="mth"><i>h</i></span>, halves <span class="mth"><i>h</i></span>, and reports the ratio, which converges on 4 for a differentiable function and refuses to for a cone at its vertex.</p>
<p>The <strong>total differential</strong> <span class="mth"><i>dz</i> = <i>f</i><sub><i>x</i></sub> <i>dx</i> + <i>f</i><sub><i>y</i></sub> <i>dy</i></span> is not an infinitesimal quantity; it is the <em>linear map</em> that the tangent plane is the graph of. This is how error propagation works in every laboratory: uncertainties in the inputs contribute <span class="mth">|<i>f</i><sub><i>x</i></sub>|δ<i>x</i> + |<i>f</i><sub><i>y</i></sub>|δ<i>y</i></span> to the output, to first order.</p>

<h3 id="p6">The chain rule</h3>
<p>Move along a curve on the surface and <span class="mth"><i>f</i></span> changes at the rate</p>
<div class="eqb"><span class="mth"><span class="frac"><span class="nm"><i>df</i></span><span class="den"><i>dt</i></span></span> <span class="op">=</span> <i>f</i><sub><i>x</i></sub> <span class="frac"><span class="nm"><i>dx</i></span><span class="den"><i>dt</i></span></span> <span class="op">+</span> <i>f</i><sub><i>y</i></sub> <span class="frac"><span class="nm"><i>dy</i></span><span class="den"><i>dt</i></span></span> <span class="op">=</span> ∇<i>f</i> <span class="op">·</span> <b>r</b>′(<i>t</i>)</span></div>
<p>Each term is one route by which <span class="mth"><i>t</i></span> reaches <span class="mth"><i>f</i></span>, and the rule says to add them — that is all a tree diagram encodes: multiply along each branch, add across the branches. Written as a dot product it becomes obvious that <strong>the chain rule and the directional derivative are the same statement</strong>. The lab computes it both by the rule and by differencing the composite directly, and prints the gap as zero.</p>
<h4>Implicit differentiation</h4>
<p>When a curve is given by <span class="mth"><i>F</i>(<i>x</i>,<i>y</i>) = 0</span>, treat <span class="mth"><i>y</i></span> as a function of <span class="mth"><i>x</i></span> and differentiate both sides:</p>
<div class="eqb"><span class="mth"><i>F</i><sub><i>x</i></sub> <span class="op">+</span> <i>F</i><sub><i>y</i></sub> <span class="frac"><span class="nm"><i>dy</i></span><span class="den"><i>dx</i></span></span> <span class="op">=</span> 0 &nbsp;⟹&nbsp; <span class="frac"><span class="nm"><i>dy</i></span><span class="den"><i>dx</i></span></span> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>F</i><sub><i>x</i></sub></span><span class="den"><i>F</i><sub><i>y</i></sub></span></span></span></div>
<p>No solving for <span class="mth"><i>y</i></span> is needed, and for curves like the folium no solution exists in elementary form. The geometric content is that the tangent is <strong>perpendicular to ∇<i>F</i></strong>. The <em>implicit function theorem</em> is the fine print: <span class="mth"><i>y</i></span> really is a function of <span class="mth"><i>x</i></span> near the point provided <span class="mth"><i>F</i><sub><i>y</i></sub> ≠ 0</span> — exactly when the formula does not divide by zero.</p>

<h3 id="p7">Gradients and directional derivatives</h3>
<p>The rate of change in a unit direction is the projection of the gradient onto it:</p>
<div class="eqb"><span class="mth"><i>D</i><sub>û</sub><i>f</i> <span class="op">=</span> ∇<i>f</i> <span class="op">·</span> û <span class="op">=</span> |∇<i>f</i>| cos θ</span></div>
<p>Three facts fall out of that one dot product, and all three are visible in the lab's polar rose:</p>
<ul>
  <li>The <strong>maximum</strong> rate is <span class="mth">|∇<i>f</i>|</span>, attained along <span class="mth">∇<i>f</i></span> — the direction of steepest ascent.</li>
  <li>The <strong>minimum</strong> is <span class="mth">−|∇<i>f</i>|</span>, the other way.</li>
  <li>The rate is <strong>zero along the level curve</strong>, so <span class="mth">∇<i>f</i></span> is perpendicular to the level set through its point.</li>
</ul>
<p>That last one is why every steepest-descent algorithm ever written works, and why in three variables <span class="mth">∇<i>F</i></span> is the normal to the level surface — which is how you get a tangent plane to an implicitly defined surface without ever solving for one variable.</p>

<h3 id="p8">Critical points and the second-derivative test</h3>
<p>A critical point is where <span class="mth">∇<i>f</i> = 0</span> — both partials vanish, so the tangent plane is horizontal. Every interior extremum is one, but not every one is an extremum. The <strong>Hessian</strong> and its determinant decide:</p>
<div class="eqb"><span class="mth"><i>D</i> <span class="op">=</span> <i>f</i><sub><i>xx</i></sub><i>f</i><sub><i>yy</i></sub> <span class="op">−</span> <i>f</i><sub><i>xy</i></sub>²</span></div>
<ul>
  <li><span class="mth"><i>D</i> &gt; 0</span> and <span class="mth"><i>f</i><sub><i>xx</i></sub> &gt; 0</span>: a <strong>local minimum</strong>.</li>
  <li><span class="mth"><i>D</i> &gt; 0</span> and <span class="mth"><i>f</i><sub><i>xx</i></sub> &lt; 0</span>: a <strong>local maximum</strong>.</li>
  <li><span class="mth"><i>D</i> &lt; 0</span>: a <strong>saddle</strong>.</li>
  <li><span class="mth"><i>D</i> = 0</span>: the test says <em>nothing</em>.</li>
</ul>
<p>The reason is that <span class="mth"><i>D</i></span> is the determinant of the Hessian, hence the <em>product of its two eigenvalues</em>, and the eigenvalues are the second derivatives along the two principal directions. Opposite signs — up one way, down the other — is a saddle by definition. Agreeing signs mean the surface curves the same way in every direction, and <span class="mth"><i>f</i><sub><i>xx</i></sub></span> says which. The lab draws the eigenvectors: for a saddle they are literally the uphill and downhill axes.</p>
<p class="note">When <span class="mth"><i>D</i> = 0</span> one eigenvalue has vanished and the quadratic approximation is degenerate — the answer lives in the cubic terms. The <strong>monkey saddle</strong> <span class="mth"><i>x</i>³ − 3<i>xy</i>²</span> is the standard example: three descending valleys and three ascending ridges meet at the origin, room for two legs and a tail. It is worth meeting once, because it shows the test is a sufficient condition and not a decision procedure.</p>
<p>Two further cautions. The test is <em>local</em>: a local minimum need not be global. And on a closed bounded region the extrema may sit on the <strong>boundary</strong>, where <span class="mth">∇<i>f</i></span> need not vanish at all — which is exactly the problem Lagrange multipliers solve.</p>

${stThm('Second-derivative test in two variables', {
  hyp:'<span class="mth"><i>f</i></span> has continuous second partials near a critical point <span class="mth"><i>a</i></span>, and <span class="mth"><i>D</i> = <i>f</i><sub><i>xx</i></sub><i>f</i><sub><i>yy</i></sub> − <i>f</i><sub><i>xy</i></sub>²</span> evaluated there',
  then:'<span class="mth"><i>D</i> &gt; 0</span> and <span class="mth"><i>f</i><sub><i>xx</i></sub> &gt; 0</span> give a local minimum; <span class="mth"><i>D</i> &gt; 0</span> and <span class="mth"><i>f</i><sub><i>xx</i></sub> &lt; 0</span> a local maximum; <span class="mth"><i>D</i> &lt; 0</span> a saddle; <span class="mth"><i>D</i> = 0</span> is inconclusive',
  proof:`<p>Near a critical point the first-order terms vanish, so Taylor's theorem in two variables leaves the quadratic form as the leading behaviour:</p>
${stEq('<i>f</i>(<i>a</i> <span class="op">+</span> <i>h</i>) <span class="op">−</span> <i>f</i>(<i>a</i>) <span class="op">=</span> ½ <i>h</i><sup>⊤</sup><i>H</i><i>h</i> <span class="op">+</span> <i>o</i>(|<i>h</i>|²)')}
<p>with <span class="mth"><i>H</i></span> the Hessian. Clairaut's theorem makes <span class="mth"><i>H</i></span> symmetric, so by the spectral theorem it has real eigenvalues <span class="mth">λ₁, λ₂</span> and an orthonormal eigenbasis. Writing <span class="mth"><i>h</i></span> in that basis as <span class="mth">(<i>c</i>₁, <i>c</i>₂)</span>,</p>
${stEq('<i>h</i><sup>⊤</sup><i>H</i><i>h</i> <span class="op">=</span> λ₁<i>c</i>₁² <span class="op">+</span> λ₂<i>c</i>₂²')}
<p>Now everything is visible. <span class="mth"><i>D</i> = det <i>H</i> = λ₁λ₂</span> and <span class="mth"><i>f</i><sub><i>xx</i></sub></span> has the sign of the eigenvalues when they agree.</p>
<ol>
<li><span class="mth"><i>D</i> &gt; 0</span>: the eigenvalues share a sign. If both are positive the form is positive for every <span class="mth"><i>h</i> ≠ 0</span>, and being bounded below by <span class="mth">min(λ₁,λ₂)|<i>h</i>|²</span> it dominates the <span class="mth"><i>o</i>(|<i>h</i>|²)</span> remainder for small <span class="mth"><i>h</i></span> — so <span class="mth"><i>f</i></span> genuinely increases in every direction. Both negative is the same argument on <span class="mth">−<i>f</i></span>.</li>
<li><span class="mth"><i>D</i> &lt; 0</span>: the eigenvalues have opposite signs. Moving along the first eigenvector increases <span class="mth"><i>f</i></span>, along the second decreases it. Neither a maximum nor a minimum — a saddle.</li>
<li><span class="mth"><i>D</i> = 0</span>: an eigenvalue is zero, the quadratic form vanishes along that direction, and the discarded <span class="mth"><i>o</i>(|<i>h</i>|²)</span> is now the whole story. No conclusion is available.</li>
</ol>
<p>So the test is not a rule to memorise: it is the spectral theorem applied to the Hessian, and the eigenvectors the lab draws at a saddle really are the uphill and downhill axes.</p>`,
  note:'The monkey saddle x³ − 3xy² is the standard D = 0 case: three valleys and three ridges meet at the origin, and the answer lives in the cubic terms the quadratic approximation threw away.',
  see:'partial:2.2', seeLabel:'When the test says nothing' })}

${stThm("Clairaut's theorem — mixed partials commute", {
  hyp:'<span class="mth"><i>f</i><sub><i>xy</i></sub></span> and <span class="mth"><i>f</i><sub><i>yx</i></sub></span> exist and are <strong>continuous</strong> on a disc about <span class="mth">(<i>a</i>,<i>b</i>)</span>',
  then:'<span class="mth"><i>f</i><sub><i>xy</i></sub>(<i>a</i>,<i>b</i>) = <i>f</i><sub><i>yx</i></sub>(<i>a</i>,<i>b</i>)</span>',
  proof:`<p>Consider the second difference over a small square of side <span class="mth"><i>h</i></span> — the one quantity that treats the two variables symmetrically:</p>
${stEq('Δ(<i>h</i>) <span class="op">=</span> <i>f</i>(<i>a</i>+<i>h</i>, <i>b</i>+<i>h</i>) <span class="op">−</span> <i>f</i>(<i>a</i>+<i>h</i>, <i>b</i>) <span class="op">−</span> <i>f</i>(<i>a</i>, <i>b</i>+<i>h</i>) <span class="op">+</span> <i>f</i>(<i>a</i>, <i>b</i>)')}
<p>Group it as <span class="mth">[φ(<i>a</i>+<i>h</i>) − φ(<i>a</i>)]</span> where <span class="mth">φ(<i>x</i>) = <i>f</i>(<i>x</i>, <i>b</i>+<i>h</i>) − <i>f</i>(<i>x</i>, <i>b</i>)</span>. Two applications of the Mean Value Theorem — first in <span class="mth"><i>x</i></span>, then in <span class="mth"><i>y</i></span> — give points <span class="mth">ξ, η</span> inside the square with <span class="mth">Δ(<i>h</i>) = <i>h</i>² <i>f</i><sub><i>yx</i></sub>(ξ, η)</span>.</p>
<p>Group the <em>same</em> <span class="mth">Δ(<i>h</i>)</span> the other way, as <span class="mth">[ψ(<i>b</i>+<i>h</i>) − ψ(<i>b</i>)]</span> with <span class="mth">ψ(<i>y</i>) = <i>f</i>(<i>a</i>+<i>h</i>, <i>y</i>) − <i>f</i>(<i>a</i>, <i>y</i>)</span>. The same two steps in the other order give <span class="mth">Δ(<i>h</i>) = <i>h</i>² <i>f</i><sub><i>xy</i></sub>(ξ′, η′)</span> for some other interior point.</p>
<p>Divide both by <span class="mth"><i>h</i>²</span> and let <span class="mth"><i>h</i> → 0</span>. Both interior points are squeezed to <span class="mth">(<i>a</i>,<i>b</i>)</span>, and <em>continuity</em> of the mixed partials forces both expressions to their values there. Since they are the same number <span class="mth">Δ(<i>h</i>)/<i>h</i>²</span> at every <span class="mth"><i>h</i></span>, the limits agree.</p>
<p>Continuity is precisely what is being spent, and without it the theorem is false. The standard counterexample <span class="mth"><i>xy</i>(<i>x</i>²−<i>y</i>²)/(<i>x</i>²+<i>y</i>²)</span> has both mixed partials at the origin, and they differ: −1 and +1.</p>`,
  note:'Everything downstream leans on this: the symmetry of the Hessian, curl(grad f) = 0, the equality of mixed partials in Maxwell relations, and the closedness of exact forms.',
  see:'partial:0.3', seeLabel:"Higher-order partials and Clairaut's theorem" })}

<h3 id="p9">Lagrange multipliers</h3>
<p>To extremise <span class="mth"><i>f</i></span> subject to <span class="mth"><i>g</i> = 0</span>, walk along the constraint. At an extreme the constraint curve must be <strong>tangent</strong> to a level curve of <span class="mth"><i>f</i></span> — because if it crossed one, you could step either way and change <span class="mth"><i>f</i></span>, so you were not at an extreme. Tangency of the curves means their normals are parallel, and the normals are the gradients:</p>
<div class="eqb"><span class="mth">∇<i>f</i> <span class="op">=</span> λ ∇<i>g</i> , &nbsp;&nbsp; <i>g</i> <span class="op">=</span> 0</span></div>
<p>That is the whole method, and the geometry is the argument. The lab finds the solutions by root-finding on <span class="mth">∇<i>f</i> <span class="op">×</span> ∇<i>g</i></span> along the constraint, which vanishes precisely where the two gradients line up — and then compares values, because the method locates <em>stationary</em> points and does not classify them.</p>
<p class="note">λ is not a nuisance variable. Relax the constraint from <span class="mth"><i>g</i> = 0</span> to <span class="mth"><i>g</i> = ε</span> and the optimal value shifts by <span class="mth">−λε</span> to first order: it is the <strong>marginal value</strong> of another unit of the scarce resource. In economics it is the shadow price; in mechanics it is the constraint force — the tension in the string that keeps the bead on the wire; in thermodynamics the multipliers of the maximum-entropy problem come out as temperature and chemical potential. It is one of the quantities in mathematics that keeps turning up wearing different clothes.</p>

<h3 id="p10">The Jacobian</h3>
<p>For a map <span class="mth"><i>T</i>(<i>u</i>,<i>v</i>) = (<i>x</i>(<i>u</i>,<i>v</i>), <i>y</i>(<i>u</i>,<i>v</i>))</span> the Jacobian matrix collects the four partial derivatives, and it <em>is</em> the derivative of the map: near any point the transformation is, to first order, the linear map that matrix describes.</p>
<div class="eqb"><span class="mth"><span class="frac"><span class="nm">∂(<i>x</i>,<i>y</i>)</span><span class="den">∂(<i>u</i>,<i>v</i>)</span></span> <span class="op">=</span> <i>x</i><sub><i>u</i></sub><i>y</i><sub><i>v</i></sub> <span class="op">−</span> <i>x</i><sub><i>v</i></sub><i>y</i><sub><i>u</i></sub></span></div>
<p>The two columns are the tangents to the two grid lines, so the determinant is the area of the parallelogram they span — a cross product in disguise, and the same object that appears as <span class="mth">|<b>r</b><sub><i>u</i></sub> <span class="op">×</span> <b>r</b><sub><i>v</i></sub>|</span> in a surface integral. Its <strong>absolute value is the local area scale</strong>, and its <strong>sign</strong> records whether the map turns the plane over.</p>
<p>The lab draws a small square, maps its corners, measures the image with the shoelace formula, and reports the ratio. Shrink the cell and the ratio converges on <span class="mth">|<i>J</i>|</span> — and that convergence <em>is</em> the definition of the derivative, not an illustration of it. For the polar map the determinant is exactly <span class="mth"><i>r</i></span>, which is why the polar area element is <span class="mth"><i>r</i> <i>dr</i> <i>dθ</i></span>.</p>
<p>Two more facts. The chain rule in matrix form is <span class="mth"><i>J</i>(<i>g</i>∘<i>f</i>) = <i>J</i>(<i>g</i>)·<i>J</i>(<i>f</i>)</span> — the Jacobian of a composite is the product of the Jacobians, which is where the one-variable chain rule came from all along. And because determinants multiply, <span class="mth">∂(<i>u</i>,<i>v</i>)/∂(<i>x</i>,<i>y</i>) = 1/(∂(<i>x</i>,<i>y</i>)/∂(<i>u</i>,<i>v</i>))</span>, which often saves inverting the map.</p>
`;

