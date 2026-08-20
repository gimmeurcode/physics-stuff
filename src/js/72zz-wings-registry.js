const WINGS = {
  /* The precalculus floors come first because everything above assumes them,
     and the demo lists inside each wing are ordered the same way: what you
     already know, then the construction, then the result, then where it is
     used later. */
  proof: {
    glyph:'⇒', title:'Proof, Logic & Sets', sub:'quantifiers, induction, and how to read a theorem',
    demoIntro:'This laboratory carries definitions, theorems and proofs in every one of its wings, and until now nothing in it taught a reader how to read one. That is what this wing is for, and it is the first thing on the shelf because everything above assumes it. The connectives are settled by exhaustion — with 2ⁿ assignments there is no room for opinion — and every verdict is reached twice, once by walking the rows and once by a clause form that never evaluates a formula at any assignment at all. Then quantifiers, where ∀x∃y and ∃y∀x come apart on a grid you can look at, and negation flips both. Then the three shapes an argument comes in: induction, where one claim has a flawless step and a failed base and is false everywhere, and another is confirmed for forty consecutive values and false at the forty-first; and contradiction, where a search for a rational √2 is shown doing exactly what it can do and no more — one preset is a ratio of integers that no feasible search can distinguish from an irrational — before the descent settles it in a line. Then sets as bitmasks, where an identity is two integers being equal and the second route is the written proof run as a loop; maps, injections and pigeonholes; and finally the two constructions of Cantor’s, both run rather than described.',
    groups: PROOF_GROUPS
  },
  algebra: {
    glyph:'x²', title:'Algebra', sub:'quadratics, polynomials, factoring',
    demoIntro:'The floor everything above stands on, and the one place where a formula is genuinely derived rather than met. The quadratic formula is not stored anywhere in this program: completing the square produces it from your own a, b and c every time you move a slider, and the panel below the controls carries the letters down every line with your numbers substituted beneath. Then polynomials, where a root and a factor turn out to be the same thing said twice.',
    groups: ALGEBRA_GROUPS
  },
  functions: {
    glyph:'ƒ', title:'Functions', sub:'transformations, inverses, logarithms',
    demoIntro:'What a function is, what you may do to one, and which ones can be undone. Every transformation of every graph lives in the single form A·f(k(x − h)) + v — and the two operations inside the function behave backwards, for a reason the derivation makes plain rather than asking you to remember it. Then inverses as reflections in y = x, and logarithms as nothing more exotic than exponentials seen in that mirror.',
    groups: FUNCTIONS_GROUPS
  },
  trig: {
    glyph:'sin', title:'Trigonometry', sub:'the unit circle, identities, waves',
    demoIntro:'Sine and cosine are the coordinates of a point going round a circle; the right triangle is what you get by dropping a perpendicular from it. Taking the circle as the definition is what lets angles exceed 90°, go negative and keep going — and it turns sin² + cos² = 1 into Pythagoras rather than a fourth thing to memorise. Unroll the circle and the sine wave appears, which is why every oscillation later in this laboratory is a circle seen edge-on.',
    groups: TRIG_GROUPS
  },
  cnum: {
    glyph:'i', title:'Complex Numbers', sub:'the plane, the turn, and Euler',
    demoIntro:'The wing that had been missing under all the others that use it. i is introduced here as a <b>rotation by a quarter turn</b> rather than as a square root of −1 — which is what it does everywhere it is later used, and which makes i² = −1 the observation that two quarter turns face you backwards. Then multiplication as stretch-and-turn, with both halves measured rather than asserted; Euler’s formula summed term by term from the only definition an exponential of a complex number can have; the n-th roots as a regular polygon; the fundamental theorem of algebra, with the roots found and then checked by a route that never evaluates the polynomial; and phasors, where adding two waves stops being a trigonometric identity and becomes a triangle.',
    groups: CNUM_GROUPS
  },
  discrete: {
    glyph:'C', title:'Discrete Mathematics & Combinatorics', sub:'counting, and checking it by counting',
    demoIntro:'The one branch of mathematics where the second route is not an approximation to the answer but <i>is</i> the answer: every closed form here is drawn beside an actual list of the objects it claims to count, built one at a time, so a reader who doubts that C(6,3) = 20 can count twenty rows. Four counting problems that are one two-by-two table; Pascal\'s triangle built by the recurrence alone and then checked against the factorial formula, with four row identities measured rather than asserted and Sierpinski\'s gasket appearing exactly rather than approximately; inclusion–exclusion, whose alternating signs turn out to be forced by one of those identities, and which is Euler\'s totient formula in disguise; and linear recurrences by three routes — iteration, the companion matrix, and the closed form — ending with the place where an <i>exact</i> closed form is the wrong thing to compute with, and the relative and absolute errors give opposite verdicts about the same number.',
    groups: DISCRETE_GROUPS
  },
  prob: {
    glyph:'P', title:'Probability & Statistics', sub:'densities, the CLT, regression',
    demoIntro:'A distribution is a density, and every summary of it is an integral of that density — so the mean is a centre of mass and the variance is a moment of inertia, computed here rather than quoted. The central limit theorem is run rather than asserted: draw samples, average them, histogram the averages, and watch any starting shape become a bell whose width falls as σ/√n. Then regression, where a line is always returned and only r² notices whether there was anything there to find.',
    groups: PROB_GROUPS
  },
  infer: {
    glyph:'ℒ', title:'Statistical Inference', sub:'estimators, likelihood, intervals & Bayes',
    demoIntro:'The probability wing below this one stops where the interesting question starts. It draws samples from distributions that are given; this wing is given the samples and asked about the distribution — which is a different subject, and the one every experiment in every other wing of this laboratory is quietly relying on. Its organising idea is that <b>an estimator is a random quantity</b>: everything a first course calls the error is a property of the distribution of values the estimator would have taken on the samples that did not happen, and the first stage builds that distribution explicitly rather than assuming its shape. From there the results stop being rules to memorise. Bessel\'s n−1 is an exact restoration of an exactly known shortfall — and the corrected estimator is not obviously the one to want, because at small n the biased one has the smaller mean squared error. Unbiasedness does not survive a square root. Likelihood arrives as a density asked a different question, and the curvature of its peak turns out to be the standard error every statistical package prints from a single sample. Then the two statements that are misquoted more than anything else in mathematics: a confidence interval is a promise about a procedure, counted here over thousands of repetitions, and the interval that substitutes s for σ delivers 87.8% where it claims 95% — a figure this wing derives in closed form rather than observes. For a proportion the sample space is finite, so coverage is an exact finite sum rather than a simulation, and the interval every course prints has a worst case of 2%. Testing is run in a world where the null is true by construction, so every rejection counted is a false alarm; twenty such tests produce a finding two times in three. And finally the other question — a probability about the parameter itself, which needs a prior and is the thing readers believed they were getting all along. Nothing here calls the browser\'s random number generator: every sample is seeded, so every number is the same on every repaint, and a claim is checked twice rather than reported once.',
    groups: INFER_GROUPS
  },
  numer: {
    glyph:'≈', title:'Numerical Methods', sub:'convergence, stability, floating point',
    demoIntro:'Most of this laboratory computes rather than quotes, so this wing turns the machinery around and studies it. Root finders are compared by the shape of their error — bisection halves it, Newton squares it, the secant method sits at the golden ratio between them — and Newton is shown running away when started too far out, because quadratic convergence is a local promise rather than a guarantee. Then the measured order of a quadrature rule, and the floor floating point puts under every numerical derivative.',
    groups: NUMER_GROUPS
  },
  numlin: {
    glyph:'κ', title:'Numerical Linear Algebra', sub:'LU, QR, conditioning & iteration',
    demoIntro:'The linear-algebra floors below solve systems the way a course does — reduce, read off, believe the answer. This wing asks what that answer is worth once the arithmetic is done in sixteen digits instead of in ℚ, and the whole subject turns on separating two things a first course runs together. An algorithm can be <b>correct</b>, meaning it returns the answer in exact arithmetic, and still be <b>unstable</b>; a problem can be <b>ill-conditioned</b>, in which case no algorithm helps at all. Both failures are here side by side and told apart by measurement: a matrix with κ = 3 on which unpivoted elimination loses every digit, and a Hilbert matrix on which a flawless factorisation still returns an answer with nothing left in it. Then the same distinction in the orthogonal world — three ways of building Q, all of which reconstruct A to round-off and whose orthogonality spans twelve orders of magnitude, with the exponents fitted from the data rather than quoted. Then the perturbation bound, driven along the direction that attains it. And finally the iterative half, where every convergence rate is obtained twice: once from the spectrum of a matrix the run never builds, and once from a run that never looks at a spectrum.',
    groups: NUMLIN_GROUPS
  },
  nuclear: {
    glyph:'☢', title:'Nuclear Physics', sub:'binding, decay & the barrier',
    demoIntro:'One curve carries this whole wing: binding energy per nucleon against mass number, built here term by term from the liquid-drop model and scored against fourteen measured nuclides. Fusion climbs its left slope and fission its right, and both release energy because both move towards the peak near iron — which is also why stars stop there. Then decay, derived from the single assumption that a nucleus has no memory, and the Coulomb barrier whose exponential turns a factor of two in energy into twenty-four orders of magnitude in half-life.',
    groups: NUCLEAR_GROUPS
  },
  solid: {
    glyph:'◈', title:'Condensed Matter & Semiconductors', sub:'Fermi seas, bands & the junction',
    demoIntro:'Copper conducts 10²³ times better than diamond, and explaining that ratio needs only two ideas. The first is Fermi statistics: electrons stack up to several electronvolts at absolute zero, and only those within kT of the surface can do anything — which resolves a hundred-fold failure in the classical heat capacity. The second is periodicity, which opens band gaps all by itself, with no chemistry involved. Together they give metals, semiconductors and insulators, then doping, the p–n junction, and the phonons that make cold solids stop absorbing heat.',
    groups: SOLID_GROUPS
  },
  statmech: {
    glyph:'∑', title:'Statistical Mechanics', sub:'where thermodynamics comes from',
    demoIntro:'One assumption — every accessible microstate is equally likely — and everything else is counting. Entropy is the logarithm of that count, temperature is the slope where two entropy curves match, and the second law is the observation that the peak is sharp and gets sharper as 1/√N. The Boltzmann factor is then forced rather than assumed, by a Taylor expansion that can only produce an exponential. The wing ends with a phase transition found by simulation and checked against Onsager\'s exact answer.',
    groups: STATMECH_GROUPS
  },
  linsys: {
    glyph:'⊞', title:'Systems, Matrices & Determinants', sub:'elimination, inverses, area',
    demoIntro:'Every matrix on this floor is typed by you, so the elimination transcript, the rank, the solution set and the picture always describe the matrix actually on screen. Row reduction is stepped through one legal move at a time — swap, scale, subtract — and each is reversible, which is the whole reason the solution set survives it. Then matrices as maps, and the determinant as the factor by which area is multiplied rather than a formula to memorise.',
    groups: LINSYS_GROUPS
  },
  vecspace: {
    glyph:'⊕', title:'Vector Spaces & Orthogonality', sub:'span, basis, projection, least squares',
    demoIntro:'Span and independence are drawn rather than defined: drag one vector onto another and watch the reachable region collapse from a plane to a line. Gram–Schmidt runs one vector at a time, subtracting the shadow and measuring the dot products that prove what is left is perpendicular. Then least squares, with data points you place yourself — and the residual shown to be orthogonal to the column space, which is what makes the fit best.',
    groups: VECSPACE_GROUPS
  },
  eigen: {
    glyph:'λ', title:'Eigenvalues, Diagonalisation & the SVD', sub:'the directions a map preserves',
    demoIntro:'A matrix takes the unit circle to an ellipse. Eigenvectors are the directions that come back parallel to themselves — drag an arrow until v × Av reads zero and you have found one by hand. The characteristic polynomial is plotted so the eigenvalues are visibly its roots. Then diagonalisation with the factorisation rebuilt and compared, the spectral theorem for symmetric matrices, and the SVD, which unlike the eigendecomposition always exists.',
    groups: EIGEN_GROUPS
  },
  rotenergy: {
    glyph:'⟳', title:'Energy & Momentum of Rotating Systems', sub:'½Iω², L = Iω, and what is conserved',
    demoIntro:'The AP framework separates the dynamics of rotation from its conserved quantities, and they really are different lessons. A rolling body divides its energy between translation and spin in a ratio set by shape alone — mass and radius cancel exactly. Then angular momentum: the skater whose L is conserved while K is not, with the difference shown to be the work her arms did, and the gyroscope that turns instead of falling because a perpendicular torque rotates a vector rather than shortening it.',
    groups: ROTEN_GROUPS
  },
  laplace: {
    glyph:'ℒ', title:'Laplace, Delta & Convolution', sub:'differentiation becomes algebra',
    demoIntro:'The transform is computed by quadrature from whatever function you supply — chosen from the table, typed, or drawn on the strip with the pointer — so the standard pairs can be checked against it rather than trusted. Then the impulse response, which characterises a linear system completely, and convolution as the sliding overlap that produces the output. The theorem ℒ{x ∗ h} = X(s)·H(s) is the reason any of it is worth doing.',
    groups: LAPLACE_GROUPS
  },
  systems: {
    glyph:'⇄', title:'Linear Systems of ODEs', sub:'x′ = A x, solved by eigenvalues',
    demoIntro:'Substitute x = e^(λt)v into x′ = Ax and the requirement is Av = λv — so a system of differential equations is an eigenvalue problem, and the eigenvalues decide everything. Click anywhere to launch a trajectory, edit the matrix and watch the portrait reorganise, and follow the marker across the trace–determinant plane where the whole classification lives on one chart.',
    groups: SYSTEMS_GROUPS
  },
  phase: {
    glyph:'∮', title:'Nonlinear Dynamics & the Phase Plane', sub:'what to do when you cannot solve it',
    demoIntro:'None of these systems has a closed-form solution and none needs one. Critical points are located by Newton\'s method, the Jacobian is taken numerically, and its eigenvalues classify each point as node, saddle, spiral or centre. Click to launch trajectories forwards and backwards in time; type your own pair of equations and the whole analysis follows. Limit cycles, separatrices and bifurcations are things no linear system can do.',
    groups: PHASE_GROUPS
  },
  complex: {
    glyph:'ℂ', title:'Complex Functions & Contour Integrals', sub:'where integration gets easier',
    demoIntro:'A complex function cannot be graphed, so it is domain-coloured: hue is the argument and brightness bands are the modulus, which makes zeros, poles and their orders visible at a glance. The Cauchy–Riemann residual is measured at a draggable probe, so a function that fails analyticity fails visibly. Then contour integrals — drag or draw any closed loop and watch the answer depend only on which poles you enclosed.',
    groups: COMPLEX_GROUPS
  },
  forms: {
    glyph:'∧', title:'Differential Forms', sub:'one derivative wearing three hats',
    demoIntro:'Gradient, curl and divergence are not three operators but one — the exterior derivative — acting on objects of different degree. Once that is seen, d∘d = 0 contains both curl(grad) = 0 and div(curl) = 0, and the fundamental theorem of calculus, Green\'s theorem, Stokes\' theorem and the divergence theorem become a single line: ∫∂Ω ω = ∫Ω dω. The stage measures both vanishing identities for whatever expressions you type.',
    groups: FORMS_GROUPS
  },
  potential: {
    glyph:'φ', title:'Potential Theory', sub:'harmonic functions & the Helmholtz split',
    demoIntro:'A harmonic function equals its own average over every circle — drag the circle and watch the two numbers stay locked. That single property forbids interior maxima, which is the maximum principle and the reason a steady temperature is hottest on its boundary. Then the Helmholtz decomposition, solved for rather than quoted: two Poisson equations relaxed on a grid, differentiated back, and checked.',
    groups: POTENTIAL_GROUPS
  },
  thermo: {
    glyph:'🌡', title:'Thermodynamics', sub:'gas laws, engines & entropy',
    demoIntro:'The work is the area under the actual P–V path obtained by quadrature, not a formula recited; the first law is checked rather than used; the Maxwell–Boltzmann distribution is integrated to recover its own averages; and the entropy ledger explains exactly why no real engine reaches the Carnot bound. AP Physics 2 lists thermodynamics as its own unit, and it is one here.',
    groups: THERMO_GROUPS
  },
  limits: {
    glyph:'lim', title:'Limits & Continuity', sub:'the definition everything rests on',
    demoIntro:'The limit is the one idea the whole of calculus is built on, and it is worth meeting properly rather than as a formality. Every limit here is <i>measured</i> — the routine marches in geometrically from both sides and reports what the values settle on — and the ε–δ definition is played as an actual game, with δ found by bisection. Then the three value theorems, each with its witness located numerically rather than asserted.',
    groups: LIMIT_GROUPS
  },
  deriv: {
    glyph:'d/dx', title:'Derivatives & Applications', sub:'rates, tangents, optimisation',
    demoIntro:'The derivative as the limit of secants, watched converging; then everything it is good for. Curves analysed by root-finding on their own symbolic derivatives, optimisation with the endpoints taken seriously, related rates as the chain rule with a clock in it, Newton\'s method converging quadratically — and failing — and L\'Hôpital\'s rule with its hypothesis checked before it is applied.',
    groups: DERIV_GROUPS
  },
  series: {
    glyph:'Σ', title:'Sequences & Series', sub:'convergence, and Taylor',
    demoIntro:'A series is the sequence of its partial sums, and convergence is a statement about those and nothing else. Every test here is run on the actual terms, including the cases where it returns "inconclusive" — which is most of them, most of the time. Then alternating series with their error bound measured against the error that occurred, and Taylor polynomials with the Lagrange remainder computed from a sampled maximum rather than a guess.',
    groups: SERIES_GROUPS
  },
  units: {
    glyph:'±', title:'Units, Dimensions & Uncertainty', sub:'what the printed digits mean',
    demoIntro:'Every other physics wing here prints numbers to eight digits, and nothing in any of them says which of those digits mean anything. This is the missing page in front of them. A dimension turns out to be a <i>vector</i> — seven rational exponents, added when quantities multiply — and the wing computes that vector twice by routes sharing nothing but the tokenizer, so a sign error in "dividing subtracts exponents" cannot survive being checked by actually dividing. Then homogeneity, the cheapest necessary condition in physics, run against two equations that are wrong on purpose. Then Buckingham\'s theorem, which is rank–nullity applied to a matrix of exponents: it gets the size of a hydrogen atom right to every digit CODATA publishes with no quantum mechanics at all, and it reads the yield of the Trinity device off published photographs. And finally what survives arithmetic — relative error carried through multiplication, destroyed by a single subtraction, and a first-order error bar checked against a Monte Carlo that says, in units of its own sampling error, exactly when the formula everybody is taught has stopped being true.',
    groups: UNITS_GROUPS
  },
  mechanics: {
    glyph:'⇉', title:'Mechanics', sub:'kinematics, forces, energy, momentum, gravity',
    demoIntro:'The kinematic equations are not the model — they are a = const integrated twice, and where the acceleration is not constant the same integrator carries on and the closed forms simply stop applying. Every conserved quantity here is <i>measured</i> along the integrated trajectory: momentum through a collision at any elasticity, energy down a track with friction, and angular momentum around an orbit computed from the inverse-square force alone.',
    groups: MECH_GROUPS
  },
  rotation: {
    glyph:'↻', title:'Rotation', sub:'torque, inertia, angular momentum',
    demoIntro:'Every rotational quantity is its linear counterpart with the mass replaced by a <i>distribution</i> of mass. Each moment of inertia here is obtained by integrating r²dm over the body and printed beside the table value; the race down the ramp is decided by shape alone, with mass and radius cancelling exactly; and the skater speeds up because L is conserved while K is not.',
    groups: ROT_GROUPS
  },
  waves: {
    glyph:'≈', title:'Oscillations & Waves', sub:'SHM, standing waves, sound',
    demoIntro:'Simple harmonic motion is not one phenomenon among many — it is what <i>every</i> restoring force looks like close enough to equilibrium, because every smooth potential is a parabola near its minimum. This wing makes that claim testable, then follows it into travelling and standing waves, the boundary conditions that quantise them, beats, and the Doppler shift with its asymmetry between source and observer.',
    groups: WAVE_GROUPS
  },
  fluids: {
    glyph:'≋', title:'Fluids & Thermal Physics', sub:'pressure, flow, heat & entropy',
    demoIntro:'Two ideas carry fluids: pressure is what a fluid does instead of shear, and it grows with depth because the fluid above has weight. Archimedes is <i>derived</i> here by integrating that pressure over a surface. Then thermodynamics, where the work is the area under the actual P–V path obtained by quadrature, the first law is checked rather than used, and the entropy ledger explains exactly why no engine reaches the Carnot bound.',
    groups: FLUID_GROUPS
  },
  optics: {
    glyph:'◇', title:'Optics', sub:'rays, lenses, interference & diffraction',
    demoIntro:'Geometric optics is the short-wavelength limit in which light may be treated as rays, and every law in it follows from Fermat\'s principle — which this wing demonstrates by scanning for the least-time path and then checking that Snell\'s law holds there. Physical optics is what happens when the wavelength stops being negligible, and the boundary between the two pictures is visible in the same double slit.',
    groups: OPTICS_GROUPS
  },
  vectors: {
    glyph:'⟶', title:'Vectors & the Geometry of Space', sub:'products, lines, planes & quadrics',
    demoIntro:'Start with the two products, because everything else is built from them: the dot product measures how much of one vector points along another, the cross product measures the area they span and hands back a perpendicular. Then lines, planes, the quadric surfaces, and the two coordinate systems the integration wing depends on. Every distance on this floor is derived from a projection rather than quoted.',
    groups: GEOM_GROUPS
  },
  curves: {
    glyph:'γ', title:'Curves & Motion', sub:'parametric, polar, conics & the moving frame',
    demoIntro:'A curve here is always a function t ↦ point, never a set of drawn segments: tangents come from r′(t), curvature from r′ × r″, and length from the integral, so the picture and the numbers cannot drift apart. Start in the plane with parametric and polar curves and the conics, then move into space for the Frenet frame and the two components of acceleration.',
    groups: CURVE_GROUPS
  },
  partial: {
    glyph:'∂', title:'Partial Derivatives', sub:'surfaces, gradients, extrema & the Jacobian',
    demoIntro:'Every derivative on this floor is symbolic — differentiated from the expression by the same engine that drives the vector wing\'s derivation panel — so what a panel prints is the derivative and not a finite difference that happens to be close to one. Work down from surfaces and limits, through partials and the tangent plane, to critical points, Lagrange multipliers and the Jacobian.',
    groups: [...PARTIAL_GROUPS, ...MV_FIELD_GROUPS]
  },
  coords: {
    glyph:'∂(x,y)', title:'Coordinate Systems & Jacobians', sub:'polar, cylindrical, spherical · the change of measure',
    demoIntro:'Polar coordinates appear in the integration wing and the Jacobian matrix appears in the wing before this one, and nothing connects them. This wing does: a coordinate system is a <b>map</b>, a map has a derivative, the derivative is a matrix, and the r in r dr dθ is that matrix’s determinant. The Jacobian is measured four ways — by differentiating, by the area of a small cell you drag about, by √(EG − F²) from the metric, and against a closed form — and the change-of-variables theorem by three routes that share nothing. Those three agree exactly when the map is one-to-one, and a map that folds makes them disagree in three different, correct ways. Then three dimensions, where the same argument produces ρ²sin φ and the choice of system stops being a matter of taste.',
    groups: COORDS_GROUPS
  },
  integral: {
    glyph:'∫', title:'Integration', sub:'from Riemann sums to triple integrals',
    demoIntro:'Nothing here is a formula recited. Every sum is summed, every "exact" value comes from adaptive quadrature or a closed-form antiderivative, and every claimed rate of convergence is measured by halving h and looking. Start with what a single integral <i>is</i>, then go up a dimension twice — rectangles, general regions, polar, solids, cylindrical and spherical — and finish with the change of variables that ties all of it together.',
    groups: INTEGRAL_GROUPS
  },
  vector: {
    glyph:'∇', title:'Vector Calculus — the Integral Theorems', sub:'line integrals, Green, Stokes & divergence',
    demoIntro:'Each theorem on this floor equates two integrals of different dimension, and every stage computes <i>both</i> sides with quadrature that knows nothing about the theorem, then prints the difference. That difference is the evidence; the equation is only the claim. The last group of demos is the field engine itself — type any expression and watch its divergence and curl differentiated symbolically.',
    groups: [...VCALC_STAGE_GROUPS, ...VC_FIELD_GROUPS]
  },
  ode: {
    glyph:'ÿ', title:'Differential Equations', sub:'second-order linear, resonance & series',
    demoIntro:'Every closed form on this floor is drawn on top of an RK4 integration of the same equation. Where the two curves are indistinguishable the algebra is right; where they part company something is wrong — and the panel prints the largest gap. Start with the characteristic equation and its three cases, then forcing, resonance, and the power series that produced most of the named functions of mathematical physics.',
    groups: ODE_GROUPS
  },
  em: {
    glyph:'⚡', title:"Electromagnetism — Maxwell's Equations", sub:'fields, sources & light',
    demoIntro:"Start in the sandbox: place charges, set them moving, drop in bar magnets and pickup loops, and watch the fields and forces they produce. Then take Maxwell's four equations one at a time — each stage measures both sides of its law numerically, so the agreement is evidence rather than assertion.",
    groups: EM_GROUPS
  },
  relativity: {
    glyph:'⧖', title:'Relativity — Special & General', sub:'space, time, gravity & the fields between',
    demoIntro:'Start where Einstein started: the thought experiments, each drawn in <i>both</i> frames at once so the disagreement is visible. Then the geometry those experiments force, what it does to energy and momentum, and the electromagnetic puzzle that set the whole thing off — a wire that is neutral in one frame and charged in another, computed both ways to the last digit. The last two groups leave flat spacetime for curved: the metric, Mercury\'s 43 arcseconds, starlight bending at the solar limb, a fall through a horizon, and the waves.',
    groups: REL_GROUPS
  },
  circuit: {
    glyph:'⚙', title:'Circuits — Analysis & Simulation', sub:'DC, AC & everything in between',
    demoIntro:'A working circuit simulator: modified nodal analysis in real volts, amps, ohms, farads and henries, integrated in time. Start in the sandbox — place parts, wire them, press Run — then work down through the passives, resonance, phasors, diodes and op amps. Every stage measures Kirchhoff\'s current law and Tellegen\'s power theorem against its own solution, and the last group puts the electric field back into the picture that circuit theory usually hides.',
    groups: CIRCUIT_GROUPS
  },
  fourier: {
    glyph:'∿', title:'Fourier Analysis', sub:'time, frequency & the transform between them',
    demoIntro:'Every stage here shows one object twice — as a shape in time and as a recipe in frequency — because the claim of the subject is that those are two descriptions of the same thing. Start by building a square wave out of sines, then watch the winding picture that shows <i>why</i> the transform can pick a single frequency out of a mixture. After that: duality and the uncertainty principle, what changes when you only have samples, and the algorithm that made all of it practical.',
    groups: FOURIER_GROUPS
  },
  signal: {
    glyph:'Ш', title:'Signal Processing', sub:'sampling, aliasing, windows & filters',
    demoIntro:'The Fourier wing ends where this one begins. A computer never has a signal — it has a list of numbers read at instants, over a record that started and stopped — and everything awkward about practical spectrum analysis follows from those two restrictions and nothing else. Sampling first, where the folding map is drawn rather than described and a residual that halves when the record doubles is told apart from one that does not move. Then windows, where seven tapers trade a wider main lobe against lower sidelobes and every number is computed twice, once by summing the taps and once from a closed form in the coefficients. Then filters, whose response is measured by <i>running</i> them as well as by evaluating B(z)/A(z), and whose stability is the complex wing\'s root finder answering a question it already knew how to answer. And finally both domains at once, where the resolution cell changes shape and keeps its area however you set the window.',
    groups: SIGNAL_GROUPS
  },
  quantum: {
    glyph:'ψ', title:'Quantum Mechanics', sub:'wavefunctions, measurement & spin',
    demoIntro:'Stage experiments first — exact wavefunctions animated live, with the probe reading ψ, probabilities and phases anywhere. Then the field-engine demos, where the probe becomes an eigenvalue meter you can verify by hand.',
    groups: [...QUANTUM_STAGE_GROUPS, QM_FIELD_GROUP]
  },
  string: {
    glyph:'α′', title:'String Theory', sub:'the tower, the extra dimensions & holography',
    demoIntro:'The one wing where a good deal of the subject is not settled, so it is built to let you argue rather than to reassure. Start where the field started — a straight line through real PDG meson masses, whose slope is a string tension that this wing then checks against the atom wing\'s Cornell potential and finds agreeing to two percent. Then the graviton that appears in the closed-string spectrum whether or not anyone wanted it, the critical dimension solved for twice by routes with nothing in common, and the regularisation behind it validated by a Casimir force measured in a laboratory. After that the hard part: twenty-two dimensions to hide, checked against what torsion balances and the LHC have actually excluded; a landscape of 10²⁷²⁰⁰⁰ vacua; and the swampland conjectures set against the measured bound on the tensor-to-scalar ratio. The last group carries the results the field is genuinely judged on — a black hole\'s microstates counted, and an entanglement entropy computed twice, once in curved five-dimensional geometry and once in a flat quantum field theory, with the difference printed.',
    groups: STRING_GROUPS
  },
  atom: {
    glyph:'⚛', title:'The Atom & the Four Forces', sub:'from the electron cloud to the quarks',
    demoIntro:'Start inside the atom and zoom down through its scales, force by force — strong, electromagnetic, weak, gravity — with every potential computed from the real constants (ħc = 197.3 MeV·fm, α = 1/137, real particle masses).',
    groups: ATOM_GROUPS
  }
};
let WING = 'vector';
