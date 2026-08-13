/* Demo ladders for the three precalculus wings. Each wing is ordered as a
   progression: what you already know, then the construction, then the result,
   then where it is used later in the laboratory. */

const ALGEBRA_GROUPS = [
{ g:'Quadratics — from completing the square to the formula', items:[
  {n:'A parabola is a shifted, scaled x²', ex:'y = a(x − h)² + k', stage:'agQuad',
   opts:{ a:1, b:-2, c:-3, view:'square' },
   out:'The faint curve is plain y = ax². The solid one is the same parabola after a shift by (h, k) — nothing else has happened to it.',
   note:'Start here. Every quadratic in existence is one parabola moved around, and once that is believed, solving one is just undoing the move. Drag the vertex directly on the picture and watch b and c follow: they are not independent knobs, they are the shift in disguise.'},
  {n:'Completing the square, one step at a time', ex:'add and subtract (b/2a)²', stage:'agQuad',
   opts:{ a:1, b:-2, c:-3, view:'square' },
   out:'The derivation panel carries your own a, b and c down every line, from the equation you set to the roots it produces.',
   note:'Read the ladder in the panel below the controls. The only trick in the whole derivation is adding zero in a useful disguise — and the reason that is worth doing is that a perfect square can be undone by a square root, while a general quadratic cannot.'},
  {n:'And out falls the quadratic formula', ex:'x = (−b ± √(b² − 4ac))/2a', stage:'agQuad',
   opts:{ a:1, b:1, c:-6 },
   out:'The formula is not stored in this program. It is produced by the same completing-the-square argument every time you move a slider, and the roots it gives are marked on the axis.',
   note:'The point of a formula is that the algebra is done <i>once</i>, symbolically, and then holds for every case forever. That is why the derivation carries letters and only the substitution line carries your numbers.'},
  {n:'The discriminant decides everything', ex:'b² − 4ac, and the three cases', stage:'agQuad',
   opts:{ a:1, b:0, c:1 },
   out:'With b² − 4ac negative the parabola misses the axis entirely and there are no real roots — but the vertex, the axis of symmetry and Vieta\'s sum and product are all still perfectly well defined.',
   note:'Slide c down through zero and watch two roots appear, separate, and move apart. Nothing discontinuous happens to the parabola: the roots were always there as a complex pair, and they simply arrived on the real line. The complex wing takes that seriously.'},
  {n:'Vieta: the roots from the coefficients alone', ex:'sum = −b/a, product = c/a', stage:'agQuad',
   opts:{ a:1, b:-5, c:6 },
   out:'The sum and product of the roots are read straight off the coefficients and then checked against the roots actually found.',
   note:'This is how a quadratic is factored by inspection: find two numbers with the right sum and product. It also survives the complex case, because a conjugate pair has a real sum and a real product — which is the first sign that complex roots are a completion rather than a defect.'}
]},
{ g:'Polynomials and factoring', items:[
  {n:'A root and a factor are the same thing', ex:'p(r) = 0 ⟺ (x − r) divides p', stage:'agPoly',
   opts:{ co:[-6, 11, -6, 1] },
   out:'The remainder on dividing by (x − r) is exactly p(r), so the two operations are one arithmetic written twice.',
   note:'The derivation is three lines and almost a tautology once you write down the division. What makes it useful is the loop: peel off one root, drop the degree by one, repeat. That is how factoring is actually done, and it is why the cubic here comes apart into (x−1)(x−2)(x−3).'},
  {n:'The rational-root theorem narrows the search', ex:'candidates p/q, and which ones work', stage:'agPoly',
   opts:{ co:[4, -8, 5, -1] },
   out:'Every candidate p/q is plotted as a small grey mark; the ones that are genuinely roots are drawn large.',
   note:'The theorem answers a smaller question than people expect. It does not find roots — it turns an infinite search into a finite one, and then you still have to test each candidate. When none works, that is real information: the roots are irrational and no hand factoring will reach them.'},
  {n:'When nothing rational works', ex:'irrational roots exist and are ordinary', stage:'agPoly',
   opts:{ co:[1, 1, 1, 1] },
   out:'The candidate list is checked and comes up empty, yet the curve plainly crosses the axis — the root is simply irrational.',
   note:'This is worth meeting early, because the habit of hunting for nice factors is hard to break. Most polynomials have no nice roots at all; the ones in textbooks are chosen. The derivative wing\'s Newton\'s method is what you use instead, and it does not care whether the answer is rational.'},
  {n:'Repeated roots, and what the graph does there', ex:'a double root touches without crossing', stage:'agPoly',
   opts:{ co:[0, 0, -1, 1] },
   out:'At a repeated root the curve meets the axis and turns back rather than passing through.',
   note:'Multiplicity is visible: an odd multiplicity crosses, an even one bounces. The reason belongs to the derivative wing — at a double root both p and p′ vanish — which is the first place algebra hands a question over to calculus.'}
]}];

const FUNCTIONS_GROUPS = [
{ g:'What you may do to a graph', items:[
  {n:'The four transformations', ex:'y = A f(k(x − h)) + v', stage:'agTransform',
   opts:{ key:'sq' },
   out:'One point of f is tracked through the transformation by a dashed line, so the map is visible rather than a general wobble.',
   note:'Everything you will ever do to a graph is in this one form. Drag the four sliders until each is second nature — and note which two behave as you expect and which two do not.'},
  {n:'Why inside and outside behave oppositely', ex:'x − h moves right; larger k squeezes', stage:'agTransform',
   opts:{ key:'sin' },
   out:'To see the old input u you must now stand at x = h + u/k, which is the shift and the squeeze read backwards.',
   note:'This catches everyone, and the derivation says exactly why: the transformation acts on the <i>input</i>, so reading the graph means solving for the input, which reverses both operations. Meeting that here makes the phase shift of a wave and the substitution rule of integration much less mysterious.'},
  {n:'Even and odd, seen as symmetry', ex:'f(−x) = f(x) or −f(x)', stage:'agTransform',
   opts:{ key:'cube', A:1, k:1 },
   out:'x³ is odd — a half-turn about the origin leaves it unchanged. x² is even, a mirror in the y-axis.',
   note:'Symmetry is not decoration: it halves the work. An odd function integrates to zero over a symmetric interval, an even one doubles; a Fourier series of an odd function has only sines. The Fourier wing leans on this constantly.'}
]},
{ g:'Inverses — when a function can be undone', items:[
  {n:'The inverse is a reflection in y = x', ex:'(a, b) ↦ (b, a)', stage:'agInverse',
   opts:{ key:'cube' },
   out:'A point of f and the matching point of f⁻¹ are joined by a dashed line perpendicular to the mirror, and the round trip f⁻¹(f(x)) returns to x.',
   note:'Swapping the coordinates <i>is</i> reflecting in the diagonal, so the inverse is not a new curve to plot but the same curve read along the other axis. That one observation explains every graph of an inverse you will ever draw.'},
  {n:'When there is no inverse', ex:'x² fails the horizontal line test', stage:'agInverse',
   opts:{ key:'sq' },
   out:'The curve rises and falls, so some height is reached twice; reflecting it gives something with two outputs above one input, which is not a function.',
   note:'The panel walks the curve and counts direction changes rather than asking you to eyeball it. A function that both rises and falls must repeat a value in between — that is the intermediate value theorem doing work in a place you would not expect it.'},
  {n:'Restricting the domain to rescue it', ex:'why arcsin stops at ±π/2', stage:'agInverse',
   opts:{ key:'sq', restrict:true },
   out:'Tick the restriction and the reflection becomes a legal function.',
   note:'arcsin is not the inverse of sine — sine has no inverse. It is the inverse of sine restricted to [−π/2, π/2], and √x is the inverse of x² restricted to x ≥ 0. The restriction is the price of invertibility, not an arbitrary convention.'}
]},
{ g:'Exponentials and logarithms', items:[
  {n:'A logarithm is an inverse, nothing more', ex:'y = bˣ reflected in y = x', stage:'agLog',
   opts:{ b:2, view:'graph' },
   out:'The exponential never reaches zero, so its mirror never reaches left of the origin — the domain restriction is inherited, not imposed.',
   note:'Every property of the logarithm is a property of the exponential seen in a mirror. The horizontal asymptote becomes a vertical one; the fact that bˣ is always positive becomes the fact that log takes only positive inputs.'},
  {n:'The product law, derived from the exponent law', ex:'log(xy) = log x + log y', stage:'agLog',
   opts:{ b:2, view:'laws' },
   out:'The bar over xy is exactly as tall as the bars over x and y stacked, and the derivation turns bᵐbⁿ = bᵐ⁺ⁿ into the log law in four lines.',
   note:'There are three log laws because there are three exponent laws, and each is the same statement read backwards. Turning multiplication into addition is the entire reason logarithms were invented — slide rules, decibels, pH and stellar magnitudes are all this one property.'},
  {n:'Change of base, and why e is special', ex:'log_b x = ln x / ln b', stage:'agLog',
   opts:{ b:4, view:'graph' },
   out:'Every logarithm is the natural one scaled by a constant, so all log graphs are vertical stretches of a single curve.',
   note:'Which base you use changes nothing but a scale factor — so calculus picks the base that makes the scale factor 1. That is the definition of e, and it is why d(ln x)/dx = 1/x with no stray constant attached. The derivative wing takes it from there.'}
]}];

const TRIG_GROUPS = [
{ g:'The unit circle is the definition', items:[
  {n:'cos and sin are coordinates, not ratios', ex:'the point at angle θ on the unit circle', stage:'agCircle',
   opts:{ th:Math.PI / 6 },
   out:'The two legs of the right triangle are drawn as the coordinates they are, and cos²θ + sin²θ is computed and printed as 1 to nine figures.',
   note:'Defining them on the circle rather than in a triangle is what lets θ exceed 90°, go negative and run past 2π — none of which a triangle can do. Drag the point right round and watch the signs take care of themselves quadrant by quadrant.'},
  {n:'Pythagoras in disguise', ex:'sin² + cos² = 1 is the circle equation', stage:'agCircle',
   opts:{ th:2.3 },
   out:'The identity is the equation x² + y² = 1 with the coordinates renamed, and the derivation says so in three lines.',
   note:'Divide it by cos² and you get 1 + tan² = sec²; divide by sin² and you get cot² + 1 = csc². The three Pythagorean identities are one identity and two divisions, which is a much smaller thing to remember.'},
  {n:'Unrolling the circle into a wave', ex:'the sine wave is a shadow', stage:'agCircle',
   opts:{ th:0, run:true },
   out:'Tracing the vertical coordinate against θ draws the sine curve — the wave and the circle are one object seen two ways.',
   note:'This is the single most useful picture in the subject. Every oscillation in this laboratory — a spring, an AC current, a light wave, a wavefunction — is a point going round a circle, watched edge-on. Uniform circular motion projected onto a line <i>is</i> simple harmonic motion.'},
  {n:'Why tan has asymptotes', ex:'the tangent segment runs off to infinity', stage:'agCircle',
   opts:{ th:1.45, show:{ tan:true, wave:true, exact:true } },
   out:'The tangent is the segment cut on the line x = 1. As the radius turns towards vertical, that line is met further and further away.',
   note:'At exactly 90° the radius is parallel to the line and never meets it at all. The asymptote is a geometric fact before it is an algebraic one, and the name "tangent" is literal — it is measured along a line tangent to the circle.'}
]},
{ g:'Identities, and which ones are independent', items:[
  {n:'The addition formula, from composing rotations', ex:'sin(a+b) = sin a cos b + cos a sin b', stage:'agIdent',
   opts:{ a:0.7, b:0.4 },
   out:'Turning by a and then by b more is turning by a + b; writing that in coordinates gives both addition formulas at once.',
   note:'The derivation goes through the rotation matrix, which is the linear-algebra wing arriving early. Every identity in the list is checked at your two angles with both sides computed independently, and the largest disagreement stays at zero however you drag.'},
  {n:'Double and half angle, for free', ex:'set b = a and rearrange', stage:'agIdent',
   opts:{ a:0.9, b:0.9 },
   out:'With b = a the addition formulas become the double-angle ones immediately; combining those with sin² + cos² = 1 gives the power-reduction and half-angle formulas.',
   note:'Only two identities on this floor are independent: Pythagoras, and the addition formula. Everything else is one of them with a substitution. Memorising seven formulas is the hard way to remember two.'},
  {n:'Why the power-reduction formula matters later', ex:'cos²a = (1 + cos 2a)/2', stage:'agIdent',
   opts:{ a:1.2, b:0.6 },
   out:'A squared trigonometric function is rewritten as a plain one at double the frequency.',
   note:'This is how ∫cos²x dx is done, how the average power of an AC signal is computed, and why the intensity of light oscillates at twice the frequency of its field. A rearranged identity is doing real work in three different wings.'}
]},
{ g:'Triangles, waves, and the road to phasors', items:[
  {n:'The law of cosines contains Pythagoras', ex:'a² = b² + c² − 2bc cos A', stage:'agTriangle',
   opts:{ mode:'triangle' },
   out:'Set A to 90° and the correction term vanishes. The extra term measures exactly how far from right-angled the triangle is.',
   note:'The derivation drops one perpendicular and applies Pythagoras to what is left — that is the whole proof. The same perpendicular gives the law of sines in one further line, and the panel prints all three of its ratios so they can be seen to be one number.'},
  {n:'The general sinusoid', ex:'A sin(ωx + φ) + k, and nothing else', stage:'agTriangle',
   opts:{ mode:'wave' },
   out:'Four numbers — amplitude, angular frequency, phase and offset — and the period is forced to be 2π/ω because the argument must advance by 2π.',
   note:'Every wave anywhere in this laboratory is these four numbers. The phase shift appears with the opposite sign to φ for the same inside/outside reason as in the transformations stage, which is worth noticing rather than memorising.'},
  {n:'Two waves of one frequency are one wave', ex:'a cos x + b sin x = R cos(x − φ)', stage:'agTriangle',
   opts:{ mode:'harm' },
   out:'The combined curve lies exactly on the single shifted cosine, checked at four hundred points across the period.',
   note:'This is the algebraic seed of the phasor. Two numbers go in — how much cosine, how much sine — and one amplitude and one phase come out, which is precisely what the circuits wing exploits to replace a differential equation with a complex number. It works only at a single frequency; two different frequencies give beats instead.'}
]}];
