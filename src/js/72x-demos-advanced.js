const LAPLACE_GROUPS = [{ g:'The transform', items:[
  {n:'What the transform does', ex:'F(s) = ∫₀^∞ f(t)e^(−st) dt', stage:'ltTransform', opts:{ key:0, s:2 },
   out:'The quadrature and the table entry agree to eight figures, and the shaded area under f(t)e^(−st) is the value being computed.',
   note:'Slide s and watch the exponential weighting bite: large s cares only about the earliest instants, small s lets the tail matter. The integral converges only when s outruns the growth of f, and that is the whole content of the region of convergence.'},
  {n:'Growth sets the region of convergence', ex:'e^(at) ⟶ 1/(s−a), for s > a', stage:'ltTransform', opts:{ key:3, s:2 },
   out:'The transform is 1/(s−0.7). Slide s down towards 0.7 and the quadrature diverges, exactly as the condition says it must.',
   note:'The pole of F(s) sits at the growth rate of f(t). That correspondence is the reason poles matter: the rightmost pole of a transfer function is the slowest-decaying mode of the system, and if it crosses into s > 0 the system is unstable.'},
  {n:'Draw your own function and transform it', ex:'a curve with no closed form', stage:'ltTransform', opts:{ key:5, s:1.5 },
   out:'Drag on the upper strip to sketch anything at all; F(s) is recomputed by quadrature at every s.',
   note:'A drawn curve has no formula, and the transform does not care — it is an integral. This is the honest version of the operation: the table is a convenience for functions someone has already integrated, not the definition.'},
  {n:'The shifted transform', ex:'multiplying by e^(at) shifts s', stage:'ltTransform', opts:{ key:6, s:2 },
   out:'A damped sinusoid transforms to the undamped one with s replaced by s + 0.5.',
   note:'Every shift theorem is this: multiplying in one domain translates in the other. It is the same statement the Fourier wing makes about modulation, and it is why damping moves poles left rather than changing their character.'},
  {n:'The step function and its transform', ex:'u(t−c) ⟶ e^(−cs)/s', stage:'ltTransform', opts:{ key:7, s:1.5 },
   out:'Delaying a function by c multiplies its transform by e^(−cs) — a pure exponential factor, no change of shape.',
   note:'This is what makes Laplace methods good at problems with switches in them: a source that turns on at t = 2 is written down directly rather than by patching solutions together at the boundary.'}
]}, { g:'Impulse and convolution', items:[
  {n:'The impulse response says everything', ex:'kick it once, know it forever', stage:'ltConv', opts:{ input:'step', b:0.5, c:4, t:3 },
   out:'The output at any time is the shaded overlap between the input and the reflected impulse response — the convolution integral, computed as an integral.',
   note:'A linear time-invariant system is completely characterised by h(t). Chop any input into a row of impulses, let each one ring, and add up the ringing — that sum is exactly ∫x(τ)h(t−τ)dτ. Slide t and watch the reflected copy sweep across.'},
  {n:'Draw the input yourself', ex:'any signal, convolved honestly', stage:'ltConv', opts:{ input:'draw', b:0.4, c:6, t:4 },
   out:'Sketch any input on the top strip; the output is a genuine convolution against the impulse response, with no closed form used anywhere.',
   note:'Try a sharp spike: the output is the impulse response itself, which is what "impulse response" means. Try two spikes and the responses superpose. That superposition is linearity, and it is the only property the whole method needs.'},
  {n:'Damping, and the three regimes', ex:'overdamped, critical, underdamped', stage:'ltConv', opts:{ input:'step', b:4, c:4, t:5 },
   out:'The discriminant b² − 4c decides. At b = 4, c = 4 the roots collide and the response is critically damped — the fastest return with no overshoot.',
   note:'Critical damping is why a door closer, a car suspension and a galvanometer needle are tuned where they are. Slide the damping down and the step response starts to overshoot and ring; slide it up and the system becomes sluggish. The optimum is exactly the repeated root.'},
  {n:'Resonance, and the −90° phase', ex:'|H(iω)| at the natural frequency', stage:'ltConv', opts:{ input:'sine', b:0.3, c:9, t:8 },
   out:'The gain peaks near ω₀ = 3 and the phase there is exactly −90°, whatever the damping.',
   note:'The phase is the reliable marker. The gain peak is flat and shifts with damping — as the ODE wing shows, it is not at ω₀ — but the phase crosses −90° precisely at the natural frequency. That is how a resonance is located in practice.'}
]}];

const SYSTEMS_GROUPS = [{ g:'First-order linear systems', items:[
  {n:'Why eigenvalues solve the system', ex:'try x = e^(λt)v and see what it needs', stage:'sySystem', opts:{ A:[[-0.4, 1], [-2, -0.4]] },
   out:'A stable spiral. The eigenvalues are a complex pair, so no direction survives and every trajectory rotates inwards.',
   note:'The derivation is one line. Substituting x = e^(λt)v into x′ = Ax gives λv = Av, so the guess works exactly when v is an eigenvector. Everything else about linear systems follows from that single substitution.'},
  {n:'A saddle, and its two straight-line solutions', ex:'real eigenvalues of opposite sign', stage:'sySystem', opts:{ A:[[1, 2], [3, 2]] },
   out:'Two dashed eigendirections: start exactly on one and the trajectory never leaves it. Everything else is swept out along the unstable direction.',
   note:'Click just off an eigendirection and watch how long the trajectory hugs it before peeling away. The stable direction is a knife edge — mathematically a genuine solution, physically unobservable, because any perturbation grows.'},
  {n:'Nodes: both eigenvalues the same sign', ex:'everything in, or everything out', stage:'sySystem', opts:{ A:[[-1, 0.4], [0.3, -2]] },
   out:'Both eigenvalues negative, so every trajectory decays to the origin — tangent to the slower eigendirection.',
   note:'The tangency is worth noticing: as t grows the faster mode dies first, so the approach is dominated by the slower one. That is why almost every trajectory arrives along the same direction, and it is the same domination that makes the power method work in the eigenvalue wing.'},
  {n:'A centre: closed orbits', ex:'purely imaginary eigenvalues', stage:'sySystem', opts:{ A:[[0, 1], [-2, 0]] },
   out:'The trace is zero, the eigenvalues are ±i√2, and every trajectory is a closed ellipse.',
   note:'A centre is structurally fragile: change any entry slightly and it becomes a slow spiral one way or the other. Undamped oscillators are always this case, which is why an idealised pendulum swings forever and a real one does not.'},
  {n:'The defective case, and the stray t', ex:'e^(λt)(I + t(A − λI))', stage:'sySystem', opts:{ A:[[-1, 1], [0, -1]] },
   out:'A repeated eigenvalue with only one eigenvector. The solution needs an extra factor of t, and the trajectories approach along the single available direction.',
   note:'This is the same stray t that appears in the repeated-root case of a second-order equation, and now the reason is visible: a missing independent direction has to be replaced by something, and what replaces it grows one power faster.'},
  {n:'The trace–determinant plane', ex:'the whole classification on one chart', stage:'sySystem', opts:{ A:[[0.35, 1.4], [-1.6, 0.35]] },
   out:'The point (trace, det) is plotted on the classification chart: above the parabola means spirals, below the axis means saddles, and the sign of the trace decides stability.',
   note:'Edit the matrix and watch the marker move across the regions. Every possible qualitative behaviour of a planar linear system is one of the five areas on that chart, which is a remarkably small answer for such a general question.'}
]}];

const PHASE_GROUPS = [{ g:'Nonlinear systems you cannot solve', items:[
  {n:'The damped pendulum, globally', ex:'centres, saddles, and what separates them', stage:'phPortrait', opts:{ key:'pendulum' },
   out:'Newton finds the critical points: stable spirals at the hanging positions, saddles at the inverted ones. Click near a saddle to see the trajectories that divide swinging from spinning.',
   note:'There is no closed-form solution to θ″ + sin θ = 0 with damping, and none is needed. The critical points and their linearisations determine the entire picture, and the stable manifolds of the saddles are the separatrices — the exact boundary between a pendulum that swings back and one that goes over the top.'},
  {n:'A limit cycle: Van der Pol', ex:'a periodic orbit that attracts', stage:'phPortrait', opts:{ key:'vdp' },
   out:'The origin is an unstable spiral, yet nothing escapes to infinity — every trajectory, inside or outside, winds onto the same closed loop.',
   note:'No linear system can do this. A linear centre has a whole family of closed orbits and no preference among them; a limit cycle is one isolated orbit that pulls its neighbours in. Heartbeats, laser oscillations and the original triode circuit Van der Pol was studying are all this behaviour.'},
  {n:'Predator and prey', ex:'Lotka–Volterra cycles', stage:'phPortrait', opts:{ key:'lotka' },
   out:'The coexistence point is a centre, so the populations cycle forever, with the predator peak lagging the prey peak by a quarter period.',
   note:'The lag is the observable prediction, and it does show up in real data. But the centre is structurally fragile — add any realistic term and it becomes a spiral, in or out. The model is a starting point for thinking, not a description of an ecosystem.'},
  {n:'Competing species: who wins', ex:'two stable nodes and a saddle between them', stage:'phPortrait', opts:{ key:'saddleN' },
   out:'Each species alone is stable; together, whichever starts ahead drives the other out. The saddle\'s stable manifold is the dividing line between the two fates.',
   note:'This is bistability, and the separatrix is the whole story: the outcome depends on the initial condition, not on the parameters. Click on either side of the dividing curve and watch the trajectories go to opposite corners.'},
  {n:'A Hopf bifurcation', ex:'a limit cycle is born', stage:'phPortrait', opts:{ key:'hopf' },
   out:'The spiral at the origin has become unstable and a small attracting cycle has appeared around it.',
   note:'Bifurcation theory studies exactly these qualitative changes. As a parameter passes a critical value the eigenvalues cross the imaginary axis, the fixed point changes stability, and an oscillation appears where there was none. It is how a steady flow starts to shed vortices and how a laser starts to lase.'},
  {n:'Type your own system', ex:'any x′ = F(x,y), y′ = G(x,y)', stage:'phPortrait', opts:{ key:'custom' },
   out:'Type any two expressions. The critical points are located by Newton, classified by the eigenvalues of the numerical Jacobian, and the nullclines are drawn.',
   note:'The residual printed beside each critical point confirms both derivatives really do vanish there, so these are genuine equilibria rather than artefacts of the search. Try adding a small cubic term to a centre and watch it decide which way to spiral.'}
]}];

const COMPLEX_GROUPS = [{ g:'Complex functions', items:[
  {n:'Domain colouring: seeing a complex function', ex:'hue is the argument, bands are the modulus', stage:'cxMap', opts:{ key:'sq' },
   out:'z² wraps the plane twice around itself: go once around the origin in the domain and the colours cycle twice.',
   note:'The graph of a complex function would need four dimensions, so it is coloured instead. The number of colour cycles around a point is the order of a zero or pole there, which makes the fundamental theorem of algebra visible: a degree-n polynomial has exactly n colour cycles at infinity.'},
  {n:'Euler, and why e^z is the natural exponential', ex:'e^(x+iy) = e^x(cos y + i sin y)', stage:'cxMap', opts:{ key:'exp' },
   out:'Horizontal lines map to rays and vertical lines to circles — the exponential turns the plane into polar coordinates.',
   note:'Euler\'s formula is not a definition to swallow. It is forced: the only way to extend the exponential while keeping e^(a+b) = e^a·e^b is the one that makes the imaginary axis into rotation. That is why every oscillation in this laboratory is secretly a complex exponential, and why the phasors of the circuit wing work at all.'},
  {n:'Cauchy–Riemann, and a function that fails it', ex:'z̄ is smooth but not analytic', stage:'cxMap', opts:{ key:'conj' },
   out:'The residual is 2 everywhere — not small, not shrinking. Conjugation is perfectly smooth as a map of two real variables and has no complex derivative anywhere.',
   note:'Differentiability in z demands the same limit from every direction of approach, which is a far stronger condition than real differentiability in two variables. Everything remarkable about complex analysis is paid for by that strictness: analytic functions are automatically infinitely differentiable and are pinned down everywhere by their values on any small disc.'},
  {n:'Poles, and what they look like', ex:'1/(z²+1)', stage:'cxMap', opts:{ key:'twop' },
   out:'Two poles at ±i, each a point where every hue converges and the brightness runs away.',
   note:'Zeros and poles look the same in the colour pattern and differ in the brightness gradient — dark towards a zero, bright towards a pole. The residues at these two poles are ∓i/2, which the next group measures directly.'}
]}, { g:'Contour integrals', items:[
  {n:'∮ dz/z = 2πi', ex:'the one integral everything rests on', stage:'cxContourInt', opts:{ key:'inv', r:1 },
   out:'The quadrature along the contour gives 2πi to five figures, and the residue prediction agrees.',
   note:'This is the same 2π the vector wing finds when it integrates the punctured-plane field around the origin — and it is the same fact. The winding number is the bookkeeping that makes both work, and moving the contour without crossing the pole changes nothing.'},
  {n:'Cauchy: an analytic function integrates to zero', ex:'no poles inside, no contribution', stage:'cxContourInt', opts:{ key:'exp', r:1 },
   out:'Every closed contour gives zero, wherever it is and whatever shape it has.',
   note:'Move the contour, change its radius, draw a lopsided loop by hand — the answer stays zero. An analytic function has no memory of the path, which is the exact complex analogue of a conservative field having path-independent work.'},
  {n:'Draw your own contour', ex:'the answer depends only on what you enclosed', stage:'cxContourInt', opts:{ key:'pole2', r:0.6 },
   out:'Sketch any closed loop. The integral is computed along exactly the curve you drew, and matches 2πi times the residues whose winding number is nonzero.',
   note:'Draw a loop enclosing one pole, then both, then neither. Draw a figure that wraps one pole twice and watch the winding number read 2 and the integral double. The shape is irrelevant; only the topology counts.'},
  {n:'Residues, measured rather than quoted', ex:'shrink a circle and divide by 2πi', stage:'cxContourInt', opts:{ key:'twop', r:0.35 },
   out:'A small circle about z = i gives an integral of 2πi·(−i/2) = π, so the residue reads −0.5i — the value the table gives.',
   note:'The residue is defined by this limit, not by the algebraic shortcut. Computing it as an integral first makes the shortcut look like what it is: a convenient way of evaluating a limit you could always have taken directly.'},
  {n:'A double pole has residue zero', ex:'1/z² integrates to nothing', stage:'cxContourInt', opts:{ key:'invsq', r:1 },
   out:'The contour integral is zero even though the function blows up inside.',
   note:'Blowing up is not enough to make an integral nonzero. Only the 1/z term of the Laurent series survives integration — every other power integrates to zero around a closed loop — which is exactly why the residue is defined as that one coefficient.'}
]}];

const FORMS_GROUPS = [{ g:'One derivative, three faces', items:[
  {n:'d on a 0-form is the gradient', ex:'df = (f_x, f_y, f_z)', stage:'dfExterior', opts:{ deg:0 },
   out:'The arrows are df, and they are perpendicular to the level curves of f — as a gradient must be.',
   note:'Type any function. The exterior derivative of a 0-form is the object that eats a direction and returns the rate of change in it, which in coordinates is the gradient. The perpendicularity is not an extra fact; it is what "no change along a level set" means.'},
  {n:'d on a 1-form is the curl', ex:'and d∘d = 0 makes curl(grad) = 0', stage:'dfExterior', opts:{ deg:1 },
   out:'Both identities are measured at the probe and both read zero, for whatever expressions you type.',
   note:'curl(grad f) = 0 and div(curl F) = 0 are usually proved separately by grinding through mixed partials. They are the same statement — d∘d = 0 — applied to forms of different degree, and the equality of mixed partials is exactly why it holds.'},
  {n:'Why the cross product only exists in three dimensions', ex:'a 2-form has n(n−1)/2 components', stage:'dfExterior', opts:{ deg:1 },
   out:'In n dimensions a 2-form has n(n−1)/2 components: 1 in the plane, 3 in space, 6 in four dimensions. Only when n = 3 does that equal n.',
   note:'A curl is really a 2-form. It can be disguised as a vector only when the count happens to match, which is once — in three dimensions. The cross product exists for exactly the same reason, and in four dimensions neither is available.'},
  {n:'Stokes\' theorem, once', ex:'∫_∂Ω ω = ∫_Ω dω', stage:'dfExterior', opts:{ deg:1 },
   out:'The fundamental theorem of calculus, Green\'s theorem, Stokes\' theorem and the divergence theorem are one statement at four different degrees.',
   note:'The boundary operator ∂ and the exterior derivative d are adjoint, and ∂∘∂ = 0 mirrors d∘d = 0 — a boundary has no boundary, which is why the theorems compose. Every integral theorem in the vector wing is a special case of this one line.'}
]}, { g:'Optimisation over shapes', items:[
  {n:'The isoperimetric inequality', ex:'4πA ≤ L², with equality only for a circle', stage:'dfIso',
   opts:{ preset:'circle' },
   out:'The circle reaches Q = 4πA/L² = 1 exactly. Every other closed curve falls short, and the dashed circle of equal perimeter shows by how much.',
   note:'Press <b>draw your own</b> and try to beat it. Any bulge you add gains area but costs more boundary than it is worth, and Q falls. The area is computed by the shoelace formula — which is Green\'s theorem applied to a polygon — so this readout is the planimeter of the vector-calculus wing, reused on a curve you drew.'},
  {n:'Why a square loses', ex:'corners are expensive', stage:'dfIso',
   opts:{ preset:'square' },
   out:'A square manages Q = π/4 ≈ 0.785: it spends 21% more perimeter than it needs for the area it encloses.',
   note:'Compare the ellipse and the star. The further a curve is from constant curvature, the worse it does — and the circle is the only closed curve whose curvature never varies. That is the geometric content of the theorem, and the reason soap bubbles are round.'},
  {n:'The proof is a Fourier argument', ex:'equality when every harmonic above the first vanishes', stage:'dfIso',
   opts:{ preset:'star' },
   out:'The star\'s five-fold ripple is a single high harmonic on the boundary, and it costs exactly the amount Q falls short by.',
   note:'Expand the boundary curve as a Fourier series and the inequality drops out of Parseval\'s theorem, with equality precisely when every coefficient above the first is zero — which is a circle. An ancient geometry problem turns out to be a statement about the energy in the harmonics of the boundary, which is why the Fourier wing and this one keep meeting.'}
]}];

const POTENTIAL_GROUPS = [{ g:'Harmonic functions', items:[
  {n:'The mean value property', ex:'the centre equals the circle average', stage:'dfHarmonic', opts:{ key:'x2y2', r:0.8 },
   out:'Drag the circle anywhere and change its radius: for a harmonic function the two numbers stay locked to eight figures.',
   note:'This is not a consequence of being harmonic — it is equivalent to it. And it immediately forbids an interior maximum, because a peak would have to exceed its own average. That is the maximum principle, and it is why a steady temperature distribution is always hottest on its boundary.'},
  {n:'A function that is not harmonic', ex:'x² + y² has Laplacian 4', stage:'dfHarmonic', opts:{ key:'bowl', r:0.8 },
   out:'The circle average exceeds the centre value by exactly ∇²f·r²/4, and grows as the square of the radius.',
   note:'A positive Laplacian means the function sits below its own averages everywhere — subharmonic — and such a function does have an interior minimum. The Laplacian is precisely the local measure of how much a function differs from its surrounding average, which is why it governs diffusion.'},
  {n:'Harmonic functions come from analytic ones', ex:'log r, eˣcos y, x² − y², xy', stage:'dfHarmonic', opts:{ key:'excos', r:0.6 },
   out:'Every function offered here is the real or imaginary part of an analytic function, and every one is harmonic.',
   note:'The Cauchy–Riemann equations force ∇²u = ∇²v = 0 in two lines. So the complex wing and this one are the same subject: these are Re and Im of z², z²/2i, e^z and log z. It is also why conformal mapping solves potential problems — an analytic change of variable preserves harmonicity.'}
]}, { g:'Decomposing a field', items:[
  {n:'Every field splits in exactly two ways', ex:'F = −∇φ + ∇×A', stage:'dfHelm', opts:{ key:'mixed', view:'both' },
   out:'The two pieces are solved for by relaxing two Poisson equations, then differentiated back: the first has no curl, the second no divergence, and together they reconstruct the original.',
   note:'Nothing is quoted here. Taking the divergence of the identity gives ∇²φ = −∇·F and taking the curl gives ∇²ψ = ∇×F, so each piece is the solution of a boundary-value problem. Switch between the three views to see the field come apart and go back together.'},
  {n:'A pure source has no second piece', ex:'all divergence, no curl', stage:'dfHelm', opts:{ key:'source', view:'irrot' },
   out:'The divergence-free part is essentially empty — the whole field is a gradient.',
   note:'A field with zero curl on a simply connected region is exactly a gradient, which is the conservative-field test of the vector wing arriving from the other direction. The punctured plane is the exception that proves the topology matters.'},
  {n:'A pure vortex has no first piece', ex:'all curl, no divergence', stage:'dfHelm', opts:{ key:'vortex', view:'solen' },
   out:'The curl-free part vanishes; the field is entirely a curl.',
   note:'This is the case that names ∇·B = 0. A divergence-free field is exactly one that can be written as a curl, and that is the whole reason the magnetic vector potential A exists — Maxwell\'s equations in potential form are the Helmholtz decomposition applied to the fields.'},
  {n:'What the split costs numerically', ex:'a relaxation on a finite grid', stage:'dfHelm', opts:{ key:'dipole', view:'both' },
   out:'The residuals are small but not machine precision, and the panel says so rather than hiding it.',
   note:'φ and ψ come from a relaxation with imposed boundary values, so the decomposition is only as good as that solve. Away from the boundary it is good; near it the imposed conditions distort both pieces. Reporting the real number is more useful than tuning until it looks exact.'}
]}];
