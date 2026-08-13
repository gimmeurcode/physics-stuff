const THEORY_INTEGRAL = `
<div class="toc">
  <a href="#i1">The definite integral</a><a href="#i2">Numerical rules</a><a href="#i3">The Fundamental Theorem</a>
  <a href="#i4">Applications</a><a href="#i5">Double integrals</a><a href="#i6">General regions</a>
  <a href="#i7">Polar</a><a href="#i8">Triple integrals</a><a href="#i9">Cylindrical &amp; spherical</a>
  <a href="#i10">Mass &amp; moments</a><a href="#i11">Change of variables</a>
</div>

<h3 id="i1">What a definite integral is</h3>
<p>Cut <span class="mth">[<i>a</i>,<i>b</i>]</span> into <span class="mth"><i>n</i></span> panels, choose a sample point in each, and add up the rectangles:</p>
<div class="eqb"><span class="mth">∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i>(<i>x</i>) <i>dx</i> <span class="op">=</span> lim<sub><i>n</i>→∞</sub> Σ<sub><i>i</i></sub> <i>f</i>(<i>x</i>*<sub><i>i</i></sub>) Δ<i>x</i></span></div>
<p>That limit is the <strong>definition</strong>. It is not "the antiderivative evaluated at the ends" — that is a theorem which arrives later and is not even available for every integrable function. The integral is a <em>signed</em> total: where <span class="mth"><i>f</i></span> is negative the rectangles hang below the axis and subtract.</p>
<p>Riemann's condition for the limit to exist is that the upper and lower sums can be brought arbitrarily close. Every continuous function on a closed bounded interval passes, and so do plenty that are not continuous.</p>

<h3 id="i2">The rules, and how fast they converge</h3>
<p>Different choices of sample point give the familiar rules, and their accuracy differs sharply:</p>
<ul>
  <li><strong>Left and right endpoints:</strong> error <span class="mth">∼ <i>h</i></span>. First order. They bracket the answer from opposite sides for a monotone integrand.</li>
  <li><strong>Midpoint:</strong> error <span class="mth">≤ (<i>b</i>−<i>a</i>)<i>h</i>²<i>K</i>₂/24</span>. Second order.</li>
  <li><strong>Trapezoid:</strong> error <span class="mth">≤ (<i>b</i>−<i>a</i>)<i>h</i>²<i>K</i>₂/12</span>. Also second order — and exactly <em>twice</em> the midpoint bound, because the midpoint rule's over- and under-shoots on the two halves of each panel partly cancel. The cruder-looking rule wins.</li>
  <li><strong>Simpson:</strong> error <span class="mth">≤ (<i>b</i>−<i>a</i>)<i>h</i>⁴<i>K</i>₄/180</span>. Fourth order. It fits a parabola to each pair of panels and is exact for cubics as well — the cubic error term cancels by symmetry.</li>
</ul>
<p>The lab does not quote these rates; it <em>measures</em> them, by computing the error at <span class="mth"><i>n</i></span> and at <span class="mth">2<i>n</i></span> and reporting <span class="mth">log₂</span> of the ratio. On a smooth integrand the numbers land on 1, 2 and 4. On <span class="mth">√<i>x</i></span>, whose derivative blows up at an endpoint, Simpson's fourth order honestly collapses — the bounds depend on derivatives that are not bounded there, so the theorem does not apply. Every <span class="mth"><i>K</i></span> in the bounds above is sampled from the actual integrand rather than guessed.</p>

<h3 id="i3">The Fundamental Theorem</h3>
<p>Define the accumulation function <span class="mth"><i>A</i>(<i>x</i>) = ∫<sub><i>a</i></sub><sup><i>x</i></sup> <i>f</i>(<i>t</i>) <i>dt</i></span>. Then:</p>
<div class="eqb"><span class="mth"><b>Part 1:</b> &nbsp; <i>A</i>′(<i>x</i>) <span class="op">=</span> <i>f</i>(<i>x</i>) &nbsp;&nbsp;&nbsp;&nbsp; <b>Part 2:</b> &nbsp; ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i> <span class="op">=</span> <i>F</i>(<i>b</i>) <span class="op">−</span> <i>F</i>(<i>a</i>)</span></div>
<p>Part 1 is visible: pushing <span class="mth"><i>x</i></span> a little further right adds a sliver of area of width <span class="mth"><i>dx</i></span> and height <span class="mth"><i>f</i>(<i>x</i>)</span>, so the accumulated total grows at the rate <span class="mth"><i>f</i>(<i>x</i>)</span>. Integration and differentiation undo each other — which is not obvious, and is the single most important theorem in the subject.</p>
<p>Part 2 turns it into an algorithm, for <em>any</em> antiderivative <span class="mth"><i>F</i></span>. Two antiderivatives of the same function differ by a constant, and the constant cancels in the difference — which is why the "+C" that so annoys students in the indefinite integral is irrelevant in the definite one.</p>
<p class="note"><span class="mth"><i>e</i><sup>−<i>x</i>²</sup></span> has no elementary antiderivative — Liouville proved it, it is not a failure of ingenuity. Part 1 still guarantees an antiderivative <em>exists</em>: it is the accumulation function itself, and it is called erf. The integral is perfectly well defined and perfectly computable. This is the clearest demonstration that the limit-of-sums definition is the real one and the antiderivative is a shortcut.</p>
<p>The <strong>Mean Value Theorem for integrals</strong> says a continuous <span class="mth"><i>f</i></span> attains its own average somewhere inside the interval — geometrically, the rectangle of that height has the same area as the region. It is what licenses every "there exists a ξ" step in the error analysis above.</p>

${stDefn('The definite integral', `
<p>Partition <span class="mth">[<i>a</i>,<i>b</i>]</span> as <span class="mth"><i>a</i> = <i>x</i>₀ &lt; <i>x</i>₁ &lt; … &lt; <i>x</i><sub><i>n</i></sub> = <i>b</i></span>, choose a sample <span class="mth"><i>x</i>*<sub><i>i</i></sub> ∈ [<i>x</i><sub><i>i</i>−1</sub>, <i>x</i><sub><i>i</i></sub>]</span>, and form the Riemann sum <span class="mth">Σ <i>f</i>(<i>x</i>*<sub><i>i</i></sub>) Δ<i>x</i><sub><i>i</i></sub></span>. Then <span class="mth"><i>f</i></span> is <strong>integrable</strong> with integral <span class="mth"><i>I</i></span> when</p>
${stEq('∀ε &gt; 0 &nbsp; ∃δ &gt; 0 : &nbsp; mesh &lt; δ &nbsp;⟹&nbsp; |Σ <i>f</i>(<i>x</i>*<sub><i>i</i></sub>) Δ<i>x</i><sub><i>i</i></sub> <span class="op">−</span> <i>I</i>| &lt; ε')}
<p>for <em>every</em> choice of sample points. This is the definition; "the antiderivative at the ends" is a theorem that arrives later and is not available for every integrable function.</p>`,
{ note:'The integral is signed. Where f is negative the rectangles hang below the axis and subtract, which is why area between curves needs the crossings located first.',
  see:'integral:0.0', seeLabel:'The integral as a limit of sums' })}

${stThm('Fundamental Theorem of Calculus, Part 1', {
  hyp:'<span class="mth"><i>f</i></span> is continuous on <span class="mth">[<i>a</i>,<i>b</i>]</span>, and <span class="mth"><i>A</i>(<i>x</i>) = ∫<sub><i>a</i></sub><sup><i>x</i></sup> <i>f</i>(<i>t</i>) <i>dt</i></span>',
  then:'<span class="mth"><i>A</i></span> is differentiable on <span class="mth">(<i>a</i>,<i>b</i>)</span> and <span class="mth"><i>A</i>′(<i>x</i>) = <i>f</i>(<i>x</i>)</span>',
  proof:`<p>Form the difference quotient. By additivity of the integral over adjacent intervals,</p>
${stEq('<i>A</i>(<i>x</i>+<i>h</i>) <span class="op">−</span> <i>A</i>(<i>x</i>) <span class="op">=</span> ∫<sub><i>x</i></sub><sup><i>x</i>+<i>h</i></sup> <i>f</i>(<i>t</i>) <i>dt</i>')}
<p>so the whole question is the average of <span class="mth"><i>f</i></span> over a shrinking interval.</p>
<p>Since <span class="mth"><i>f</i></span> is continuous on the closed interval between <span class="mth"><i>x</i></span> and <span class="mth"><i>x</i>+<i>h</i></span>, the Extreme Value Theorem gives it a minimum <span class="mth"><i>m</i><sub><i>h</i></sub></span> and maximum <span class="mth"><i>M</i><sub><i>h</i></sub></span> there. The integral of a function trapped between two constants is trapped between their integrals, so for <span class="mth"><i>h</i> &gt; 0</span></p>
${stEq('<i>m</i><sub><i>h</i></sub> <i>h</i> &nbsp;≤&nbsp; ∫<sub><i>x</i></sub><sup><i>x</i>+<i>h</i></sup> <i>f</i> &nbsp;≤&nbsp; <i>M</i><sub><i>h</i></sub> <i>h</i> &nbsp;&nbsp;⟹&nbsp;&nbsp; <i>m</i><sub><i>h</i></sub> ≤ <span class="frac"><span class="nm"><i>A</i>(<i>x</i>+<i>h</i>) − <i>A</i>(<i>x</i>)</span><span class="den"><i>h</i></span></span> ≤ <i>M</i><sub><i>h</i></sub>')}
<p>As <span class="mth"><i>h</i> → 0</span> the interval collapses to the single point <span class="mth"><i>x</i></span>, and continuity forces both <span class="mth"><i>m</i><sub><i>h</i></sub></span> and <span class="mth"><i>M</i><sub><i>h</i></sub></span> to <span class="mth"><i>f</i>(<i>x</i>)</span>. The squeeze theorem then delivers the quotient to <span class="mth"><i>f</i>(<i>x</i>)</span>. Dividing by a negative <span class="mth"><i>h</i></span> reverses both inequalities and gives the same conclusion from the left.</p>
<p>So every continuous function <em>has</em> an antiderivative, whether or not anyone can write it in elementary terms.</p>`,
  note:'Continuity is what makes m_h and M_h collapse together. For an integrable but discontinuous f, A is still continuous but need not be differentiable at the jumps.',
  see:'integral:0.2', seeLabel:'The Fundamental Theorem, both parts' })}

${stThm('Fundamental Theorem of Calculus, Part 2', {
  hyp:'<span class="mth"><i>f</i></span> is continuous on <span class="mth">[<i>a</i>,<i>b</i>]</span> and <span class="mth"><i>F</i></span> is <em>any</em> antiderivative of <span class="mth"><i>f</i></span>',
  then:'',
  eq:'∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i>(<i>x</i>) <i>dx</i> <span class="op">=</span> <i>F</i>(<i>b</i>) <span class="op">−</span> <i>F</i>(<i>a</i>)',
  proof:`<p>Let <span class="mth"><i>A</i>(<i>x</i>) = ∫<sub><i>a</i></sub><sup><i>x</i></sup> <i>f</i></span>. By Part 1, <span class="mth"><i>A</i>′ = <i>f</i></span>. By hypothesis <span class="mth"><i>F</i>′ = <i>f</i></span> as well, so <span class="mth">(<i>F</i> − <i>A</i>)′ = 0</span> on the interval.</p>
<p>A function with vanishing derivative on an interval is constant — that corollary of the Mean Value Theorem is the entire bridge between Part 1 and Part 2. So <span class="mth"><i>F</i>(<i>x</i>) = <i>A</i>(<i>x</i>) + <i>C</i></span> for some constant <span class="mth"><i>C</i></span>.</p>
<p>Evaluate at both ends and subtract. The constant cancels, and <span class="mth"><i>A</i>(<i>a</i>) = 0</span>:</p>
${stEq('<i>F</i>(<i>b</i>) <span class="op">−</span> <i>F</i>(<i>a</i>) <span class="op">=</span> [<i>A</i>(<i>b</i>) <span class="op">+</span> <i>C</i>] <span class="op">−</span> [<i>A</i>(<i>a</i>) <span class="op">+</span> <i>C</i>] <span class="op">=</span> <i>A</i>(<i>b</i>) <span class="op">=</span> ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i>')}
<p>That cancellation is why "<em>any</em> antiderivative" is enough, and why the "+C" that matters so much in the indefinite integral is irrelevant in the definite one.</p>`,
  note:'This is a computational shortcut, not the meaning of the integral. e^(−x²) is integrable everywhere and has no elementary antiderivative — Liouville proved that, so it is not a failure of ingenuity.',
  see:'integral:0.3', seeLabel:'An integral with no antiderivative' })}

${stThm('Mean Value Theorem for integrals', {
  hyp:'<span class="mth"><i>f</i></span> is continuous on <span class="mth">[<i>a</i>,<i>b</i>]</span>',
  then:'there is <span class="mth"><i>c</i> ∈ [<i>a</i>,<i>b</i>]</span> at which <span class="mth"><i>f</i></span> equals its own average:',
  eq:'<i>f</i>(<i>c</i>) <span class="op">=</span> <span class="frac"><span class="nm">1</span><span class="den"><i>b</i> − <i>a</i></span></span> ∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i>(<i>x</i>) <i>dx</i>',
  proof:`<p>Write <span class="mth">μ</span> for the average on the right. By the Extreme Value Theorem <span class="mth"><i>f</i></span> attains a minimum <span class="mth"><i>m</i></span> and a maximum <span class="mth"><i>M</i></span> on <span class="mth">[<i>a</i>,<i>b</i>]</span>. Integrating the inequality <span class="mth"><i>m</i> ≤ <i>f</i> ≤ <i>M</i></span> and dividing by <span class="mth"><i>b</i> − <i>a</i> &gt; 0</span> gives <span class="mth"><i>m</i> ≤ μ ≤ <i>M</i></span>.</p>
<p>So <span class="mth">μ</span> is a value between two values that <span class="mth"><i>f</i></span> actually attains. The Intermediate Value Theorem, applied on the closed interval between the points where the minimum and maximum occur, produces <span class="mth"><i>c</i></span> with <span class="mth"><i>f</i>(<i>c</i>) = μ</span>.</p>
<p>Geometrically: the rectangle of height <span class="mth"><i>f</i>(<i>c</i>)</span> on the same base has exactly the area under the curve.</p>`,
  note:'This is what licenses every "there exists a ξ" in the quadrature error bounds above — and it fails without continuity: a step function need never attain its own average.' })}

<h3 id="i4">What integrals accumulate</h3>
<p>Every application is the same move: cut the thing you want into slices small enough that each is approximately something whose size you already know, add them up, take the limit. The formula that comes out is never worth memorising; the <em>slice</em> is.</p>
<ul>
  <li><strong>Area between curves:</strong> <span class="mth">∫ (top − bottom) <i>dx</i></span>, with the crossings found first — a root-finding problem hiding inside an integration problem. Below a crossing the integrand changes sign and the integral silently returns the <em>difference</em> of the two areas.</li>
  <li><strong>Volume by discs:</strong> slice perpendicular to the axis, each slice a disc of area <span class="mth">π<i>f</i>²</span>.</li>
  <li><strong>Volume by shells:</strong> slice <em>parallel</em> to the axis, each slice a cylindrical shell of area <span class="mth">2π<i>x f</i></span>. Same solid, different bookkeeping — and one of the two integrals is usually far easier.</li>
  <li><strong>Arc length:</strong> <span class="mth">∫ √(1 + (<i>f</i>′)²) <i>dx</i></span>, Pythagoras on an infinitesimal step.</li>
  <li><strong>Work:</strong> <span class="mth">∫ <i>F</i>(<i>x</i>) <i>dx</i></span> — force times distance when the force refuses to hold still. A linear spring gives <span class="mth"><i>W</i> = ½<i>kx</i>²</span>, derived rather than remembered.</li>
  <li><strong>Average value:</strong> <span class="mth">(1/(<i>b</i>−<i>a</i>))∫<i>f</i></span>, the height of the rectangle with the same area.</li>
</ul>

<h3 id="i5">Double integrals over a rectangle</h3>
<p>The same idea with one more index. Cut the rectangle into <span class="mth"><i>m</i> × <i>n</i></span> cells, sample <span class="mth"><i>f</i></span> once in each, and add:</p>
<div class="eqb"><span class="mth">∬<sub><i>R</i></sub> <i>f</i> <i>dA</i> <span class="op">=</span> lim Σ<sub><i>i</i>,<i>j</i></sub> <i>f</i>(<i>x</i>*, <i>y</i>*) Δ<i>A</i></span></div>
<p>It is a signed volume: where <span class="mth"><i>f</i></span> is negative the columns hang below the base. Set <span class="mth"><i>f</i> = 1</span> and it returns the <em>area</em> of the region, which is the trick that turns every area problem into an integral problem.</p>
<p><strong>Fubini's theorem</strong> says the double integral equals either iterated integral:</p>
<div class="eqb"><span class="mth">∬<sub><i>R</i></sub> <i>f</i> <i>dA</i> <span class="op">=</span> ∫<sub><i>a</i></sub><sup><i>b</i></sup>∫<sub><i>c</i></sub><sup><i>d</i></sup> <i>f</i> <i>dy dx</i> <span class="op">=</span> ∫<sub><i>c</i></sub><sup><i>d</i></sup>∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i> <i>dx dy</i></span></div>
<p>The lab computes both orders with independent nested quadrature and prints the difference. Over a rectangle with a continuous integrand this is not delicate — but it fails for integrands that are not absolutely integrable, which is why the hypothesis is always stated. For a <strong>separable</strong> integrand <span class="mth"><i>f</i> = <i>g</i>(<i>x</i>)<i>h</i>(<i>y</i>)</span> the whole thing factors into a product of two single integrals, which is worth spotting.</p>

${stThm("Fubini's theorem", {
  hyp:'<i>f</i> integrable over the rectangle <i>R</i> = [a,b] × [c,d] — for which continuity on <i>R</i> is more than enough, and absolute integrability, ∬|<i>f</i>| &lt; ∞, is the general condition',
  then:'the double integral may be computed as an iterated integral in either order, and the two agree,',
  eq:'∬<sub><i>R</i></sub> <i>f</i> <i>dA</i> <span class="op">=</span> ∫<sub><i>a</i></sub><sup><i>b</i></sup>∫<sub><i>c</i></sub><sup><i>d</i></sup> <i>f</i> <i>dy dx</i> <span class="op">=</span> ∫<sub><i>c</i></sub><sup><i>d</i></sup>∫<sub><i>a</i></sub><sup><i>b</i></sup> <i>f</i> <i>dx dy</i>',
  because:'A full proof belongs to measure theory rather than to this wing — it is where the Lebesgue integral earns its keep. What can be said honestly here is why the hypothesis is not decoration, and that is done below.',
  note:'Absolute integrability is exactly what fails in the standard counterexample. On the unit square, (x²−y²)/(x²+y²)² integrates to π/4 one way round and −π/4 the other. Nothing is wrong with either calculation: the positive and negative parts each have infinite integral, so the total is an ∞ − ∞ whose value depends on the order of cancellation — the same disease as a conditionally convergent series, one dimension up. This is the reason the hypothesis is always stated and never merely assumed.',
  see:'integral:1.4', seeLabel:'Both descriptions at once, and Fubini tested' })}

<h3 id="i6">General regions</h3>
<p>A <strong>Type I</strong> region lets <span class="mth"><i>x</i></span> run over an interval and, for each <span class="mth"><i>x</i></span>, lets <span class="mth"><i>y</i></span> run between two functions of <span class="mth"><i>x</i></span>. The inner integral sweeps a <em>vertical strip</em>; the outer one slides it across. A <strong>Type II</strong> region reverses the roles and the strips become horizontal.</p>
<div class="eqb"><span class="mth">∬<sub><i>D</i></sub> <i>f</i> <i>dA</i> <span class="op">=</span> ∫<sub><i>a</i></sub><sup><i>b</i></sup> ∫<sub><i>g</i>₁(<i>x</i>)</sub><sup><i>g</i>₂(<i>x</i>)</sup> <i>f</i>(<i>x</i>,<i>y</i>) <i>dy dx</i></span></div>
<p>The one rule that is never negotiable: <strong>inner limits may depend on the outer variable; outer limits must be constants.</strong> Some regions are only one type, some are both, and some need cutting into pieces — and swapping the order is often the difference between an integral you can do and one you cannot.</p>
<p class="note">The lab runs an independent Monte Carlo estimate of the area alongside the iterated integral. The Monte Carlo asks only "is this point inside?" and never sees the limit functions at all, so its agreement is a real check that the limits describe the region you think they do — which is the single most common place to go wrong.</p>

<h3 id="i7">Polar double integrals</h3>
<p>A polar "rectangle" — <span class="mth">Δ<i>r</i></span> by <span class="mth">Δθ</span> — is not a rectangle. Its outer arc is longer than its inner one, and its exact area is</p>
<div class="eqb"><span class="mth">½(<i>r</i>₁² <span class="op">−</span> <i>r</i>₀²)Δθ <span class="op">=</span> <span style="font-style:italic">r̄</span> Δ<i>r</i> Δθ</span></div>
<p>with <span class="mth"><span style="font-style:italic">r̄</span></span> the <em>mean</em> radius — exactly, with no approximation. In the limit that is <span class="mth"><i>r</i> <i>dr</i> <i>dθ</i></span>. The extra <span class="mth"><i>r</i></span> is not a fudge factor: it is the plain fact that the grid spreads out as you move away from the pole, and the lab measures it by comparing cells at different radii and by checking that all the cell areas total <span class="mth">π<i>R</i>²</span>.</p>
<div class="eqb"><span class="mth">∬<sub><i>D</i></sub> <i>f</i> <i>dA</i> <span class="op">=</span> ∫<sub>α</sub><sup>β</sup> ∫<sub><i>r</i>₁(θ)</sub><sup><i>r</i>₂(θ)</sup> <i>f</i>(<i>r</i> cos θ, <i>r</i> sin θ) <i>r</i> <i>dr</i> <i>dθ</i></span></div>
<h4>The Gaussian integral</h4>
<p>The most famous integral in mathematics has no elementary antiderivative in one dimension and becomes trivial in two. Square it and read the product as a double integral:</p>
<div class="eqb"><span class="mth"><i>I</i>² <span class="op">=</span> (∫<i>e</i><sup>−<i>x</i>²</sup><i>dx</i>)(∫<i>e</i><sup>−<i>y</i>²</sup><i>dy</i>) <span class="op">=</span> ∬ <i>e</i><sup>−(<i>x</i>²+<i>y</i>²)</sup> <i>dA</i> <span class="op">=</span> ∫₀<sup>2π</sup>∫₀<sup>∞</sup> <i>e</i><sup>−<i>r</i>²</sup> <i>r</i> <i>dr dθ</i> <span class="op">=</span> π</span></div>
<p>so <span class="mth"><i>I</i> = √π</span>. The <span class="mth"><i>r</i></span> that the area element supplied is <em>exactly</em> what the substitution <span class="mth"><i>u</i> = <i>r</i>²</span> needs — without it there is no elementary antiderivative in polar coordinates either. Every normalisation constant in statistics, every Gaussian wave packet in the quantum wing, and every path integral in field theory rests on this one evaluation.</p>

<h3 id="i8">Triple integrals</h3>
<p>Peel the solid one variable at a time. The innermost variable runs between two <strong>surfaces</strong>; the middle one between two <strong>curves</strong> in the shadow the solid casts on a coordinate plane; the outer one between two <strong>numbers</strong>. Get that hierarchy right and the rest is bookkeeping.</p>
<div class="eqb"><span class="mth">∭<sub><i>E</i></sub> <i>f</i> <i>dV</i> <span class="op">=</span> ∫<sub><i>a</i></sub><sup><i>b</i></sup> ∫<sub><i>g</i>₁(<i>x</i>)</sub><sup><i>g</i>₂(<i>x</i>)</sup> ∫<sub><i>h</i>₁(<i>x</i>,<i>y</i>)</sub><sup><i>h</i>₂(<i>x</i>,<i>y</i>)</sup> <i>f</i> <i>dz dy dx</i></span></div>
<p>Setting <span class="mth"><i>f</i> = 1</span> gives the volume, and the inner two integrals compute the area of one cross-section for each value of the outer variable — which is why "volume by cross-sections" from single-variable calculus and the triple integral are the same calculation. The triple integral simply refuses to assume you already know the area of a slice.</p>

<h3 id="i9">Cylindrical and spherical coordinates</h3>
<div class="eqb"><span class="mth"><i>dV</i> <span class="op">=</span> <i>r</i> <i>dz</i> <i>dr</i> <i>dθ</i> &nbsp;&nbsp;&nbsp;&nbsp; <i>dV</i> <span class="op">=</span> ρ² sin φ <i>dρ</i> <i>dφ</i> <i>dθ</i></span></div>
<p>The cylindrical element is the polar element extruded — nothing new happens vertically, which is exactly why the system suits anything with an axis. The spherical element has two factors, both visible in the lab's drawn cells: the <span class="mth">ρ²</span> is polar growth one dimension up (a shell twice as far out has four times the area), and the <span class="mth">sin φ</span> is the shrinking of the θ-circles towards the poles. At <span class="mth">φ = 0</span> a full turn in θ moves you nowhere at all, so cells there have no volume.</p>
<p>Forgetting the <span class="mth">sin φ</span> over-counts the poles enormously, and it is the commonest error in spherical integration. The lab prints the ratio of an equatorial cell to a polar one with identical <span class="mth">Δρ, Δφ, Δθ</span> so the size of the effect is unmissable.</p>
<p>The payoff is that awkward boundaries become constants. A ball, a cone, a cylinder, an ice-cream cone — each has six constant limits in the right system, where in Cartesian coordinates it would need square-root limits and a case analysis.</p>

<h3 id="i10">Mass, centres of mass and moments of inertia</h3>
<p>With a density <span class="mth">ρ(<i>x</i>,<i>y</i>)</span> on a lamina:</p>
<div class="eqb"><span class="mth"><i>m</i> <span class="op">=</span> ∬ρ <i>dA</i> , &nbsp; <i>M</i><sub><i>y</i></sub> <span class="op">=</span> ∬<i>x</i>ρ <i>dA</i> , &nbsp; <i>M</i><sub><i>x</i></sub> <span class="op">=</span> ∬<i>y</i>ρ <i>dA</i> , &nbsp; (<span style="font-style:italic">x̄</span>, <span style="font-style:italic">ȳ</span>) <span class="op">=</span> (<i>M</i><sub><i>y</i></sub>/<i>m</i>, <i>M</i><sub><i>x</i></sub>/<i>m</i>)</span></div>
<p>The centre of mass is where the plate balances on a pin, and it need not lie inside the region at all — the annulus is the standard counterexample.</p>
<p><strong>Moments of inertia</strong> weight by the <em>square</em> of a distance, and that squaring changes their character completely: a moment of inertia can never cancel, and mass far from the axis counts disproportionately.</p>
<div class="eqb"><span class="mth"><i>I</i><sub><i>x</i></sub> <span class="op">=</span> ∬<i>y</i>²ρ <i>dA</i> , &nbsp; <i>I</i><sub><i>y</i></sub> <span class="op">=</span> ∬<i>x</i>²ρ <i>dA</i> , &nbsp; <i>I</i>₀ <span class="op">=</span> <i>I</i><sub><i>x</i></sub> <span class="op">+</span> <i>I</i><sub><i>y</i></sub></span></div>
<p>The last identity — the <strong>perpendicular-axis theorem</strong> — is nothing but <span class="mth"><i>r</i>² = <i>x</i>² + <i>y</i>²</span> integrated, and holds for any flat plate. The <strong>parallel-axis theorem</strong> <span class="mth"><i>I</i> = <i>I</i><sub>cm</sub> + <i>md</i>²</span> says the moment of inertia is smallest about an axis through the centre of mass and grows quadratically as you move away. The lab computes both sides of each independently.</p>
<p>The <strong>radius of gyration</strong> <span class="mth">√(<i>I</i>/<i>m</i>)</span> is the distance at which a point mass <span class="mth"><i>m</i></span> would have the same moment of inertia — a way of quoting an inertia as a length.</p>

<h3 id="i11">Change of variables</h3>
<p>The general theorem, of which polar and spherical coordinates are special cases:</p>
<div class="eqb"><span class="mth">∬<sub><i>S</i></sub> <i>f</i>(<i>x</i>,<i>y</i>) <i>dA</i> <span class="op">=</span> ∬<sub><i>R</i></sub> <i>f</i>(<i>T</i>(<i>u</i>,<i>v</i>)) <span style="font-size:1.1em">|</span><span class="frac"><span class="nm">∂(<i>x</i>,<i>y</i>)</span><span class="den">∂(<i>u</i>,<i>v</i>)</span></span><span style="font-size:1.1em">|</span> <i>du dv</i></span></div>
<p>In words: to integrate over an awkward region, find a map that turns a nice one into it, pull the integrand back through the map, and pay for the distortion with the absolute value of the Jacobian determinant. For a <strong>linear</strong> map the factor is a single number and every region's area scales identically; for a nonlinear map it varies from point to point, which is precisely why it sits <em>inside</em> the integral.</p>
<p>The absolute value is there because areas are unsigned. The sign of the determinant records whether the map turns the plane over, and in the one-variable substitution rule that same sign is handled invisibly by swapping the limits of integration — which is why nobody ever writes <span class="mth">|<i>du</i>/<i>dx</i>|</span> there.</p>
<p class="note">Two worked cases in the lab are worth the time. The map <span class="mth">(<i>u</i>,<i>v</i>) ↦ (3<i>u</i>, 2<i>v</i>)</span> takes the unit disc to the ellipse <span class="mth"><i>x</i>²/9 + <i>y</i>²/4 = 1</span> with constant Jacobian 6, giving <span class="mth">6π</span> — the fastest honest derivation of <span class="mth">π<i>ab</i></span> there is. And the complex square <span class="mth">(<i>u</i>,<i>v</i>) ↦ (<i>u</i>²−<i>v</i>², 2<i>uv</i>)</span> has Jacobian <span class="mth">4(<i>u</i>²+<i>v</i>²) = |2<i>z</i>|²</span> and turns straight grids into two families of confocal parabolas crossing at right angles — conformality, visible.</p>
`;

