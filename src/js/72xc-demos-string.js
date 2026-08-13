/* ============================================================================
   THE STRING WING — the guided experiments

   Ordered so that each one uses what the last established. The first group is
   the historical entry, because it is also the only place in the subject where
   the mathematics touches measured data directly; the last is where the field's
   real results are, and where the honest boundaries have to be drawn.
   ============================================================================ */
const STRING_GROUPS = [

{ g:'Where the idea came from — measured data, and a guess', items:[
  {n:'Spin against mass squared, for real mesons', ex:'J = α′M² + α₀', stage:'wsRegge',
   opts:{ family:'rho', firmOnly:true, showString:true },
   out:'Six PDG 2024 states, an ordinary least-squares fit, and r² printed beside it — the line is really there.',
   note:'This is the observation the whole subject grew out of, and it is a measurement rather than a construction. Hadrons of the same quantum numbers do not scatter randomly in the (M², J) plane; they sit on a line. Nothing in the quark model of 1968 predicted that. Look at the residuals drawn as dashed segments — they are small, and they are what makes the claim testable rather than decorative.'},

  {n:'The rotating string that produces the line', ex:'J = M²/2πT', stage:'wsRegge',
   opts:{ family:'rho', firmOnly:true, showString:true },
   out:'Both M and J are integrals of the same tension along the same string, and their ratio is 2πT with the length cancelling exactly.',
   note:'Watch the arrows along the spinning string: the ends move at c because a relativistic string has no other equilibrium, and the middle barely moves. Compute the energy and the angular momentum of that configuration and the length drops out of the ratio, leaving a pure number times the tension. That is why the line passes through the origin and why its slope means something physical.'},

  {n:'The tension, checked against a completely different measurement', ex:'σ = 1/2πα′', stage:'wsRegge',
   opts:{ family:'rho', firmOnly:true, showString:false },
   out:'The fitted slope gives 881 MeV/fm; the atom wing\'s Cornell potential, fitted to heavy-quarkonium spectra, gives 900. They agree to about 2%.',
   note:'This is the strongest empirical statement in the wing, and it is worth dwelling on. Two fits with no data in common — light-meson spins here, charmonium and bottomonium level spacings there — land within a couple of percent. The flux between a quark and an antiquark really does behave like a string with a tension, and the tension is about fourteen tonnes of force.'},

  {n:'What happens when the unconfirmed states are included', ex:'and why the PDG flags them', stage:'wsRegge',
   opts:{ family:'rho', firmOnly:false, showString:false },
   out:'The slope moves from 0.915 to 0.888 GeV⁻² and r² drops from 0.9994 to 0.9924.',
   note:'The last two states carry large errors and PDG flags saying they need confirmation. Including them is not wrong, but it changes the answer by more than the quoted standard error of the fit — which is the ordinary situation in experimental physics and is worth seeing rather than being protected from. Both numbers are reported so you can decide which you believe.'},

  {n:'Baryons lie on lines too', ex:'the nucleon trajectory', stage:'wsRegge',
   opts:{ family:'N', firmOnly:true, showString:true },
   out:'A slope near 1.0 GeV⁻², close to the meson value but not identical.',
   note:'A baryon is three quarks rather than two, so the geometry of the flux is different — and yet the trajectory is still straight with a comparable slope. That the same tension shows up in both is why the flux-tube picture is taken seriously in QCD rather than being a curiosity of the meson sector.'},

  {n:'The formula Veneziano guessed', ex:'A = B(−α(s), −α(t))', stage:'wsVen',
   opts:{ view:'poles', t:-1.4, a0:1, n:2 },
   out:'One Euler Beta function, with a pole at every non-negative integer value of α(s).',
   note:'Veneziano was looking for a function with poles in s AND in t that did not double-count, and he found one in a table of special functions. Four years later the integration variable in the Beta function was identified as the position of a vertex operator on the boundary of a worldsheet. The formula came first and the string came second, which is unusual and worth remembering.'},

  {n:'Every pole is a particle, and the residue names its spin', ex:'degree n in α(t)', stage:'wsVen',
   opts:{ view:'poles', t:-1.4, a0:1, n:4 },
   out:'The residue at level n is a polynomial of degree n, so spins 0 through n are all exchanged at that mass.',
   note:'Move the level slider and watch the residue polynomial change degree. Its zeros — at α(t) = −1, −2, … — are where individual spins decouple exactly. The requirement that the residue never go negative is a real constraint: a negative residue is a negative-norm state, and it is one of the three independent routes to D = 26.'},

  {n:'The Regge power law, measured off the amplitude', ex:'|A| ∼ s^(α(t))', stage:'wsVen',
   opts:{ view:'regge', t:-1.4, a0:1, n:2 },
   out:'The slope of ln|A| against ln s is fitted and printed against α(t), and they agree.',
   note:'Sampling is done at the tops of the resonance bumps, where the oscillating signature factor is exactly ±1, so what is left is the pure power. The exponent is not a constant — it depends on t — and that dependence is the signature of a whole trajectory being exchanged rather than a single particle. This distinction is what Regge theory was invented for.'},

  {n:'Why a string is soft at high energy', ex:'faster than any power', stage:'wsVen',
   opts:{ view:'soft', t:-1.4, a0:1, n:2 },
   out:'At fixed angle the amplitude dies like e^(−s ln s), against a field theory\'s s⁻⁴ — the vertical scale is the point.',
   note:'A point particle can be probed at arbitrarily short distance, which is where loop divergences come from. An extended object cannot: hit it hard enough and it simply stops responding. This exponential softness is why string loop amplitudes converge where graviton loops do not, and it is the technical content behind "string theory is finite".'},

  {n:'And in 2024 the formula was shown to be forced', ex:'a bootstrap uniqueness theorem', stage:'wsVen',
   opts:{ view:'poles', t:-2.6, a0:1, n:3 },
   out:'Crossing symmetry, faster-than-power-law falloff and level truncation admit exactly one solution.',
   note:'This is live research rather than history. Recent S-matrix bootstrap work derived the Veneziano amplitude as the unique solution to those three conditions, with the string spectrum emerging as an output rather than an input. Weaken the assumptions to bare high-energy vanishing and a three-parameter family opens up containing the Veneziano, Coon and hypergeometric amplitudes — so the boundary of the theorem is charted as well as its interior.'}
]},

{ g:'The tower, and the temperature it cannot pass', items:[
  {n:'A string is a violin string', ex:'normal modes, quantised', stage:'wsModes',
   opts:{ kind:'ob', N:2, scale:'hadronic', showCount:true },
   out:'The animation is the actual superposition of the excited harmonics; the ladder beside it is the exact spectrum.',
   note:'The whole mechanism is that a wave equation on a finite interval has normal modes, each mode is a quantum oscillator, and the total energy of the quanta is what a distant observer calls mass. Only the TOTAL oscillator number matters, not which modes carry it, which is why each rung of the ladder holds so many different particles at once.'},

  {n:'The bosonic tachyon, and why it is a problem', ex:'α′M² = −1', stage:'wsModes',
   opts:{ kind:'ob', N:0, scale:'hadronic', showCount:true },
   out:'The ground state has M² < 0 — the vacuum is at a maximum of the potential, not a minimum.',
   note:'A tachyon is not a fast particle; it is a sign that you have expanded around the wrong vacuum. The bosonic string has one, which is why nobody believes it is a theory of anything. Switch to the superstring and watch the ground state rise to exactly zero: the GSO projection removes the tachyon, and that is one of the reasons supersymmetry is not optional here.'},

  {n:'Nobody put gravity in', ex:'level 1 of the closed string', stage:'wsModes',
   opts:{ kind:'cb', N:1, scale:'hadronic', showCount:true },
   out:'24 × 24 = 576 states, splitting into a graviton (299), an antisymmetric B-field (276) and a dilaton (1).',
   note:'This is the single most striking fact about the subject. Quantise a closed string, ask what sits at the first massless level, and a massless spin-2 particle is there whether you want it or not. A massless spin-2 field is forced by general theorems to couple universally to energy and momentum — that is, to be a graviton obeying Einstein\'s equations at low energy. The theory does not accommodate gravity; it cannot avoid it.'},

  {n:'The superstring, with no tachyon at all', ex:'α′M² = N − ½', stage:'wsModes',
   opts:{ kind:'os', N:0.5, scale:'hadronic', showCount:true },
   out:'The lowest state sits exactly at zero: eight vector states and eight spinor states, a gauge field and its gaugino.',
   note:'The intercept is ½ rather than 1 because the worldsheet fermions contribute their own zero-point energy, and the GSO projection keeps only half-odd-integer levels. The result is that the bottom of the tower is massless rather than tachyonic — and that the boson and fermion counts match at every level, which is supersymmetry visible as arithmetic.'},

  {n:'Counting the rungs', ex:'partitions of N in 24 colours', stage:'wsModes',
   opts:{ kind:'ob', N:12, scale:'hadronic', showCount:true },
   out:'The exact count is computed by the partition recursion; the leading asymptotic term alone is a poor match, and the full saddle point is not.',
   note:'The number of states at level N is the number of ways of writing N as a sum of mode numbers, in 24 colours. The naive Cardy exponent 2π√(cN/6) alone gives a ratio well under one at these levels, which looks like failure. Evaluating the whole contour integral, prefactor included, closes the gap — and the residual falls off like 1/√N, which is what a converging asymptotic series actually looks like.'},

  {n:'A maximum temperature', ex:'the Hagedorn ceiling', stage:'wsModes',
   opts:{ kind:'ob', N:20, scale:'hadronic', showCount:true },
   out:'ρ(M) ∼ e^(β_H M) makes Σ d(M)e^(−βM) diverge below β_H, so above T_H the canonical ensemble does not exist.',
   note:'Pour energy into a string gas above this temperature and it goes into making longer strings rather than hotter ones. At the hadronic reading of α′ this lands near 170 MeV, strikingly close to the measured QCD deconfinement temperature — which is not a coincidence, because a hadron really is a flux tube and this wing has already measured its tension.'},

  {n:'The same mathematics at the Planck scale', ex:'only α′ changes', stage:'wsModes',
   opts:{ kind:'cs', N:1, scale:'planck', showCount:true },
   out:'The first massive level moves from about a GeV to 10¹⁶ GeV. Not one equation changes.',
   note:'This is both the appeal of the idea and the whole difficulty with it. The same equations that describe a measurable flux tube would, at a tension thirty-eight orders of magnitude higher, describe quantum gravity — and there is no experiment that can reach the second reading. Flip between the two scale settings and notice that nothing else on the panel moves.'}
]},

{ g:'Twenty-six, solved for', items:[
  {n:'The sum of all positive integers, honestly', ex:'Σ n e^(−εn) = 1/(4 sinh²(ε/2))', stage:'wsCrit',
   opts:{ view:'reg', kind:'bos', eps:0.35, Nmax:14 },
   out:'The bare partial sums run away; the damped sum converges; subtracting its 1/ε² divergence leaves a number that settles on −1/12.',
   note:'"1 + 2 + 3 + … = −1/12" stated without a regulator is the point at which a sceptical reader is right to close the page. Here the regulator is explicit, the divergent piece is identified as the cutoff-dependent part that a physical boundary condition removes, and what is left is watched settling. Slide ε towards zero and compare the remainder with the ε²/240 correction printed beside it.'},

  {n:'The same number, by a completely different route', ex:'the functional equation for ζ', stage:'wsCrit',
   opts:{ view:'reg', kind:'bos', eps:0.06, Nmax:20 },
   out:'ζ(2) is summed by Euler–Maclaurin, and the functional equation carries it to ζ(−1) = −0.0833333333333.',
   note:'Nothing in this calculation knows the answer in advance and it shares no step with the cutoff on the left — one route never mentions the zeta function, the other never mentions a cutoff. They agree to twelve figures. That agreement is what makes −1/12 a fact about the analytic structure of the sum rather than a convention somebody adopted.'},

  {n:'And therefore D = 26', ex:'(D − 2)/24 = 1', stage:'wsCrit',
   opts:{ view:'dim', kind:'bos', eps:0.2, Nmax:14 },
   out:'Two curves with nothing in common cross zero at the same D: the polarisation count, and the total conformal anomaly.',
   note:'Level 1 is a Lorentz vector. A massless vector in D dimensions has D−2 polarisations and a massive one has D−1, and the string supplies exactly D−2 states there — so the state must be exactly massless, which fixes the intercept and with it the dimension. The independent route demands that a worldsheet symmetry survive quantisation. There is no dial in either.'},

  {n:'Ten, for the superstring', ex:'3D/2 − 15 = 0', stage:'wsCrit',
   opts:{ view:'dim', kind:'super', eps:0.2, Nmax:14 },
   out:'The worldsheet fermions and superghosts shift the arithmetic, and the answer moves from 26 to 10.',
   note:'D bosons contribute c = D, their fermionic partners D/2, the reparametrisation ghosts −26 and the superghosts +11. Setting the total to zero gives 10, and the polarisation-counting route agrees. Six too many rather than twenty-two — still six too many, which is what the next three groups are about.'},

  {n:'The discarded infinity, put on a balance', ex:'P = −π²ħc/240d⁴', stage:'wsCasimir',
   opts:{ d:1e-6, area:1e-6 },
   out:'1.3 millipascals at one micron — the same regularisation, and this one has been measured to better than a percent.',
   note:'This experiment exists in this wing to close off one specific objection and no more. The step in the critical-dimension calculation that looks like an abuse of arithmetic is exactly the step Casimir\'s force validates: the 240 in the denominator is 12 × 20, and that 12 is the 12 of ζ(−1). Had the regularisation been arbitrary the coefficient would be wrong, and Lamoreaux, Mohideen and Decca would have said so.'},

  {n:'An atmosphere of pressure, from nothing', ex:'the 1/d⁴ law', stage:'wsCasimir',
   opts:{ d:1e-8, area:1e-6 },
   out:'At 10 nm the Casimir pressure exceeds one atmosphere.',
   note:'Halve the separation and the pressure goes up sixteenfold. This is a practical nuisance rather than an abstraction: at the gaps used in microelectromechanical switches the attraction is strong enough to snap the moving element permanently against its neighbour, a failure mode called stiction that has to be designed around.'}
]},

{ g:'Hiding the extra dimensions', items:[
  {n:'Kaluza and Klein\'s answer', ex:'m = n/R', stage:'wsCircle',
   opts:{ R:3.2, n:1, w:0, N:1, Nb:1 },
   out:'Momentum around a circle is quantised, so every particle acquires a tower of heavy copies spaced by 1/R.',
   note:'This is the 1920s answer to why we do not see the fifth dimension: make it small and the tower gets heavy and drops out of any experiment below that energy. It works, and it is still the backbone of every compactification. What it cannot do is anything a point particle could not do — which is the next experiment.'},

  {n:'The thing a string can do that a particle cannot', ex:'winding, m = wR/α′', stage:'wsCircle',
   opts:{ R:3.2, n:0, w:1, N:1, Nb:1 },
   out:'A string wound round the circle cannot unwind without breaking, so the winding number is conserved — and its energy grows with R.',
   note:'There is no analogue of this in point-particle physics. Watch the wound string on the cylinder and then watch the two towers on the plot: momentum states get lighter as the circle grows, winding states get heavier. They run in opposite directions, and that fact alone is enough to force the next result.'},

  {n:'A circle smaller than √α′ is a circle larger than √α′', ex:'R ↔ α′/R with n ↔ w', stage:'wsCircle',
   opts:{ R:0.4, n:1, w:1, N:1, Nb:0 },
   out:'The mass is computed at R and at α′/R with the two quantum numbers exchanged, and the difference is printed. It is zero.',
   note:'Not approximately the same physics — identically the same spectrum, and the duality survives interactions too. Shrinking the circle past the self-dual radius does not produce a smaller space; it produces the same space again with the labels swapped. This is where geometry stops being fundamental, and it is checked here on your own numbers rather than asserted.'},

  {n:'The self-dual radius, where the towers cross', ex:'R = √α′', stage:'wsCircle',
   opts:{ R:1, n:1, w:1, N:1, Nb:0 },
   out:'At exactly R = √α′ the momentum and winding towers coincide, extra states become massless and the gauge symmetry enhances.',
   note:'A genuinely stringy phenomenon with no field-theory counterpart: at one special radius the theory acquires more symmetry than it had on either side. It is also the point below which distance stops meaning what you think it means, which is a far stronger statement than "we have not looked at shorter distances yet".'},

  {n:'A state that does not exist', ex:'level matching', stage:'wsCircle',
   opts:{ R:1.6, n:2, w:1, N:1, Nb:0 },
   out:'N − N̄ = 1 but nw = 2, so the condition fails and the panel says so instead of printing a mass.',
   note:'Level matching is not a technicality. A closed string has no marked point, so nothing distinguishes one place on it from another, and the operator that rotates it must annihilate every physical state. Combinations that fail the condition are not heavy states — they are not states. Move the sliders until the panel reports the condition satisfied.'},

  {n:'Large extra dimensions — the version that could have been found', ex:'M_Pl² = M_&#8727;^(2+n) R^n', stage:'wsADD',
   opts:{ n:2, Mstar:1000, rProbe:1e-5 },
   out:'Two extra dimensions at a TeV need a radius of about two millimetres — which is why two groups built torsion balances to look there.',
   note:'The proposal is that gravity is not weak at all, only diluted: it leaks into extra dimensions that the Standard Model fields cannot enter, because those are stuck to a brane. That asymmetry is the whole mechanism. It makes a sharp numerical prediction reachable by tabletop experiment, which is exactly what a good speculative idea should do.'},

  {n:'One extra dimension was dead on arrival', ex:'R larger than the solar system', stage:'wsADD',
   opts:{ n:1, Mstar:1000, rProbe:1e-5 },
   out:'n = 1 requires a radius of about 3×10¹³ metres — some two hundred astronomical units.',
   note:'Planetary orbits obey Newton\'s inverse-square law to exquisite precision, so this case was excluded before anyone had to build anything. Watch the required radius collapse as n rises: each extra dimension takes a root of an enormous number, and by n = 6 the radius is smaller than a nucleus.'},

  {n:'What the torsion balances found', ex:'nothing, down to about 40 μm', stage:'wsADD',
   opts:{ n:2, Mstar:9000, rProbe:3e-5 },
   out:'The Eöt-Wash and HUST experiments verify the inverse-square law to roughly 50 μm, which already forces M<sub>&#8727;</sub> above about 9 TeV for n = 2.',
   note:'This is the confrontation with data. Two completely different kinds of experiment constrain the same parameter — a tabletop pendulum measuring millinewtons, and a 27-kilometre collider measuring missing energy — and they now agree that the TeV-scale version of the idea is gone. String theory survives it; ADD was one way of hiding the extra dimensions rather than the only one.'},

  {n:'Curvature instead of volume', ex:'the Randall–Sundrum warp', stage:'wsRS',
   opts:{ krc:11.79, k:1e18, y:0.5 },
   out:'A warp factor e^(−πkr_c) turns k·r_c ≈ 11.8 into a ratio of 10⁻¹⁶.',
   note:'Slide k·r_c and watch sixteen orders of magnitude appear out of a number near twelve. That is a genuine improvement in how the hierarchy problem feels — but nothing here explains why k·r_c takes that value, so the problem has been reshaped rather than dissolved, and stabilising the radius needs its own field and its own potential.'},

  {n:'The resonances it predicts, against what the LHC has excluded', ex:'m_n from Bessel zeros', stage:'wsRS',
   opts:{ krc:11.79, k:2e18, y:1 },
   out:'The graviton masses are fixed by zeros of J₁, so the ratio m₂/m₁ = 1.834 is a prediction with no freedom in it.',
   note:'One bump in a spectrum could be anything; two bumps in that ratio would be this model. ATLAS and CMS have looked hard and found neither — for the benchmark coupling, gravitons below roughly 4.5 TeV are excluded, which has pushed the lightest predicted resonance above the scale the model was invented to explain. Drag the curvature slider until the tower crosses the shaded band.'},

  {n:'What survived Randall–Sundrum', ex:'position is renormalisation-group time', stage:'wsRS',
   opts:{ krc:8, k:1e18, y:0.25 },
   out:'The warped metric is a slice of anti-de Sitter space, and the fifth coordinate is an energy scale.',
   note:'Whatever happens to the model as a description of our universe, the identification it popularised is now standard: moving along a warped dimension is running a coupling. The holography stage in this wing takes that idea and checks it quantitatively, computing one quantity in a curved five-dimensional geometry and the same quantity in a flat four-dimensional field theory.'}
]},

{ g:'The shape of the six directions', items:[
  {n:'A Calabi–Yau, drawn rather than illustrated', ex:'z₁⁵ + z₂⁵ = 1', stage:'wsCY',
   opts:{ i:0, n:5, alpha:0.6, spin:true },
   out:'Twenty-five patches, one for each pair of fifth roots of unity, computed and depth-sorted.',
   note:'This is the object in every picture captioned "a Calabi–Yau", and it is a genuine two-real-dimensional slice of the Fermat quintic projected down from four dimensions — not an artist\'s impression. The colour marks which patch each piece belongs to, so the gluing is visible. What it shows is two of the six real dimensions; the rest cannot be drawn at all.'},

  {n:'The topology is the particle physics', ex:'generations = |χ|/2', stage:'wsCY',
   opts:{ i:0, n:5, alpha:0.4, spin:false },
   out:'The quintic has χ = −200, and therefore one hundred chiral generations. The world has three.',
   note:'The number of generations of matter is one of the crudest facts about the Standard Model and one it does not itself explain. Here it comes out as a topological invariant of a six-dimensional shape — not a coupling or a mass, a count. That the mechanism exists at all is remarkable; that this particular manifold gives the wrong answer is the ordinary situation.'},

  {n:'A manifold that gives exactly three', ex:'the Tian–Yau manifold', stage:'wsCY',
   opts:{ i:4, n:5, alpha:0.8, spin:true },
   out:'χ = −18, and its free ℤ₃ quotient has χ = −6 — three generations.',
   note:'Manifolds with the right Euler characteristic exist, and this is the classic one. The difficulty is not that string theory cannot produce three generations; it is that it can produce almost any number, and nothing in the framework says which shape to use. That gap is the honest state of string phenomenology.'},

  {n:'Mirror symmetry', ex:'h¹¹ ↔ h²¹', stage:'wsCY',
   opts:{ i:1, n:5, alpha:0.5, spin:false },
   out:'The mirror of the quintic has χ = +200 and produces identical physics.',
   note:'Swapping the two kinds of modulus gives a different manifold with the same four-dimensional physics — a strange claim about geometry, made by physicists first. It turned out to compute answers in enumerative geometry that mathematicians could not obtain, counting rational curves on the quintic, and it is now a research field in mathematics with its own theorems.'},

  {n:'A shape that is its own mirror', ex:'χ = 0', stage:'wsCY',
   opts:{ i:5, n:5, alpha:0.9, spin:true },
   out:'h¹¹ = h²¹ = 19, so the Euler characteristic vanishes and no chiral matter appears at all.',
   note:'Self-mirror manifolds are mathematically interesting and physically empty in this respect: with χ = 0 the standard embedding produces no net chirality. It is a useful reminder that the topological count is a real constraint and not a formality — most shapes give a world with no matter in it, or far too much.'},

  {n:'The size of the catalogue', ex:'473,800,776 polytopes', stage:'wsCY',
   opts:{ i:2, n:5, alpha:0.6, spin:false },
   out:'The Kreuzer–Skarke database yields 30,108 distinct Hodge pairs; the complete-intersection list adds 7,890 configurations.',
   note:'Each of these is a different four-dimensional universe with a different particle content. The mechanism that turns geometry into physics is beautiful and the principle that selects the geometry is missing. Everything about the landscape debate follows from that one sentence, and it is worth arriving at it by counting rather than by being told.'},

  {n:'One loop is a torus', ex:'and τ describes it', stage:'wsTorus',
   opts:{ t1:0.31, t2:0.42, showEta:true },
   out:'Drag anywhere on the upper half plane and watch τ get carried into the fundamental domain by the two generators.',
   note:'There is only one one-loop diagram in string theory, and its shape is one complex number. But τ, τ+1 and −1/τ all describe the same torus, so the loop integral must run over the quotient — and the path drawn as you drag is the algorithm that finds each torus\'s unique representative.'},

  {n:'Where the ultraviolet went', ex:'Im τ ≥ √3/2', stage:'wsTorus',
   opts:{ t1:0.1, t2:0.12, showEta:true },
   out:'The fundamental domain has a floor. Small Im τ is the short-distance region, and no torus needs it.',
   note:'This is the technical content behind "string theory is finite", and it is worth stating precisely. The divergent region of a field-theory loop integral is not regulated here, not cut off, not subtracted — it is simply not part of the integration domain. Drag τ down towards the real axis and watch it get thrown back out.'},

  {n:'The identity that does the work, checked', ex:'η(−1/τ) = √(−iτ)·η(τ)', stage:'wsTorus',
   opts:{ t1:0.62, t2:0.31, showEta:true },
   out:'Both sides are evaluated from the infinite product independently and printed together. They differ by about 10⁻¹⁶.',
   note:'The same modular transformation that removes the ultraviolet here is the one that converts the level-counting product into an exponential density of states in the spectrum group. Loop finiteness and the Hagedorn temperature are two readings of a single identity, which is a good sign that the structure is not accidental.'}
]},

{ g:'The landscape, and what a landscape forbids', items:[
  {n:'The moduli problem, stated plainly', ex:'dozens of massless scalars', stage:'wsCY',
   opts:{ i:0, n:5, alpha:0.7, spin:false },
   out:'The quintic leaves 103 massless scalars including the dilaton. None has been observed.',
   note:'This is not a subtlety — it is a flat contradiction with experiment. A massless scalar coupled with gravitational strength would mediate a fifth force and let the constants of nature drift, and both are excluded by torsion-balance tests and by limits on the variation of the fine-structure constant. Something must give every modulus a mass, and how that is done is where the landscape comes from.'},

  {n:'Fixing a modulus with flux', ex:'the KKLT minimum', stage:'wsFlux',
   opts:{ W0:-1e-4, A:1, a:0.1, uplift:'ads', K:200, L:500 },
   out:'A minimum at σ ≈ 113.6, located by scanning for a sign change in dV/dσ and bisecting — and the supersymmetry condition vanishes at the same point.',
   note:'These are KKLT\'s own parameters and this reproduces their result. The independent check is worth noticing: the minimum is found by pure numerics on the potential, and then D_TW is evaluated there and comes out zero, which it must if the minimum really is the supersymmetric one. Nothing is read off a remembered figure.'},

  {n:'But the answer has the wrong sign', ex:'V_min < 0 is anti-de Sitter', stage:'wsFlux',
   opts:{ W0:-2e-4, A:1, a:0.1, uplift:'ads', K:200, L:500 },
   out:'The stabilised minimum is negative. Our universe is observed to be accelerating, with a small positive vacuum energy.',
   note:'Flux stabilisation gives a supersymmetric anti-de Sitter vacuum, and that is not where we live. Something has to lift the minimum through zero without destroying it, and the mechanism used — an anti-brane in a warped throat — is the most contested step in the whole construction.'},

  {n:'The uplift, solved for rather than supplied', ex:'V → V + D/σ³', stage:'wsFlux',
   opts:{ W0:-1e-4, A:1, a:0.1, uplift:'ds', K:200, L:500 },
   out:'D is bisected until the minimum sits at a small positive value. The tuning is visible as an actual search.',
   note:'Watch how narrow the window is. Too little uplift and the vacuum energy stays negative; the grey curve behind shows where it started. The whole construction lives in that gap, and D has to be tuned into it — which is exactly the objection the swampland programme raises against this class of construction.'},

  {n:'Push a little harder and there is no universe left', ex:'the barrier disappears', stage:'wsFlux',
   opts:{ W0:-1e-4, A:1, a:0.1, uplift:'over', K:200, L:500 },
   out:'At about three times the tuned value the minimum vanishes entirely and the potential runs away to σ → ∞.',
   note:'Decompactification is always available: the runaway direction never goes away, so even the successful vacuum is only metastable and can tunnel out of existence. The margin is a factor of three in one parameter. Whether a construction this delicate should be trusted is a live argument, and this is the picture the argument is about.'},

  {n:'Counting the vacua', ex:'N ∼ (2πL)^K/K!', stage:'wsFlux',
   opts:{ W0:-1e-4, A:1, a:0.1, uplift:'zero', K:300, L:1500 },
   out:'Discrete flux quanta over many cycles give an astronomically large number of choices; a 2015 F-theory count reached 10^272000.',
   note:'The exponent, not the number, is the content. The argument that follows is genuinely contested and worth stating fairly: supporters say that with so many vacua some will have a tiny positive vacuum energy purely by counting, and observers can only exist in those; critics reply that a framework accommodating any observation has stopped making predictions. Both objections are about what counts as an explanation, not about any step in the arithmetic.'},

  {n:'The swampland — inverting the question', ex:'what quantum gravity forbids', stage:'wsSwamp',
   opts:{ pot:'quad', phi:1.2, c:1, lam:1, dphi:1.5, N:100 },
   out:'The shaded region is every field value where the de Sitter conjecture is violated by the potential on screen.',
   note:'Rather than asking what string theory allows, ask what a consistent theory of quantum gravity forbids. The set of effective field theories that look fine on their own but cannot descend from any quantum gravity is the swampland, and on current evidence it is very much larger than the landscape. That reframing is what makes the subject constrain cosmology again.'},

  {n:'You cannot travel far in field space for free', ex:'m ∼ m₀e^(−λΔφ)', stage:'wsSwamp',
   opts:{ pot:'quad', phi:4, c:1, lam:1.2, dphi:3, N:100 },
   out:'Move more than about a Planck unit and an infinite tower of states comes down exponentially.',
   note:'This is the best-supported member of the family: it has been verified in every controlled string compactification anyone has checked, and the tower is always identifiable — Kaluza–Klein states as a dimension decompactifies, winding states as one shrinks. Every large-field inflation model has to answer it, because the effective description you started with stops being valid.'},

  {n:'Adding light fields is not free either', ex:'Λ_s = M_Pl/√N', stage:'wsSwamp',
   opts:{ pot:'plateau', phi:2, c:1, lam:1, dphi:1, N:100000 },
   out:'With a hundred thousand light species, gravity\'s own cutoff drops to about 0.003 M_Pl.',
   note:'The species scale has an independent semi-classical argument behind it: with too many light species black holes evaporate faster than the Planck-scale description permits. It is one of the few swampland statements that can be argued for without string theory at all, which is part of why the programme is taken seriously outside it.'},

  {n:'Gravity must be the weakest force', ex:'m ≤ √2 g q M_Pl', stage:'wsSwamp',
   opts:{ pot:'exp', phi:1, c:0.7, lam:1, dphi:0.5, N:10 },
   out:'The electron satisfies the bound by twenty-one orders of magnitude.',
   note:'"Gravity is the weakest force" is usually presented as a curious fact. The weak gravity conjecture says it is a requirement: if it failed, extremal charged black holes would have no decay channel and an infinite tower of stable remnants would be left behind. Every charged particle known passes, which is either a coincidence repeated a dozen times or a clue.'},

  {n:'Where the conjecture meets the data', ex:'r = 16ε < 0.036', stage:'wsSwamp',
   opts:{ pot:'plateau', phi:3, c:1, lam:1, dphi:1, N:100 },
   out:'The measured ceiling on the tensor-to-scalar ratio forces √(2ε) below about 0.067; the conjecture wants it of order 1.',
   note:'Here is the genuine tension, quantified. A potential steep enough to satisfy c ≈ 1 predicts r ≈ 2, fifty times the BICEP/Keck limit. Either the conjecture is wrong, or its constant is far smaller than "order one", or inflation is not single-field slow roll, or dark energy is quintessence rather than a cosmological constant. This is an open research question, and it is being pushed on by measurement.'},

  {n:'A pure cosmological constant, which the conjecture forbids outright', ex:'V′ = 0, V > 0', stage:'wsSwamp',
   opts:{ pot:'cc', phi:3, c:1, lam:1, dphi:1, N:100 },
   out:'A flat positive potential gives M_Pl|V′|/V = 0, violating the bound everywhere.',
   note:'The simplest description of dark energy — a constant — is exactly what the de Sitter conjecture says cannot come from string theory. If the conjecture is right, dark energy must be dynamical, and its equation of state must differ from −1 by an amount future surveys could detect. That is a falsifiable consequence of a speculative claim, which is not something this subject has produced often.'}
]},

{ g:'Black holes, holography, and the one theory', items:[
  {n:'The entropy nobody could explain', ex:'S = A/4G', stage:'wsEntropy',
   opts:{ Q1:10, Q5:20, N:60, view:'astro' },
   out:'A solar-mass black hole carries about 10⁷⁷ in units of k_B — against roughly 10⁵⁸ for the Sun as it is.',
   note:'Entropy counts states, and general relativity says a black hole has none: it is fixed by mass, charge and spin alone. This is the sharpest question in quantum gravity because it has a number attached, coefficient included. Any candidate theory has to say what is being counted and get that number.'},

  {n:'Counting them', ex:'S = 2π√(Q₁Q₅N)', stage:'wsEntropy',
   opts:{ Q1:10, Q5:20, N:60, view:'compare' },
   out:'Two columns, no shared step: a field-theory state count on the left, a horizon area divided by 4G on the right, and the same number at the bottom.',
   note:'The left column runs Cardy\'s formula on a two-dimensional conformal field theory living on a bound state of branes. The right column solves Einstein\'s equations in five dimensions and measures a horizon. They agree as functions of all three charges — move any slider — and the factor of 1/4 in the area law, unexplained since 1973, comes out right.'},

  {n:'Why supersymmetry is what makes it possible', ex:'a count valid at both couplings', stage:'wsEntropy',
   opts:{ Q1:25, Q5:25, N:100, view:'compare' },
   out:'At weak coupling the branes are a countable quantum system; at strong coupling the same object is a black hole.',
   note:'Normally the answer would change on the way between those two regimes, and the calculation would be worthless. Supersymmetry protects this particular count, so the number obtained in the easy regime is valid in the hard one. That is the whole reason the calculation can be done, and it is also why it does not extend to ordinary black holes.'},

  {n:'Cardy is asymptotic, and here it is converging', ex:'ln(exact) ÷ Cardy → 1', stage:'wsEntropy',
   opts:{ Q1:2, Q5:3, N:100, view:'cardy' },
   out:'The exact level count is expanded term by term from the generating function, so the approach can be watched rather than assumed.',
   note:'At the small levels a browser can enumerate, the ratio is still climbing towards one — which is what an asymptotic formula does. A real astrophysical black hole has charges of order 10³⁸, where the correction is far below anything measurable. Showing the convergence rather than the endpoint is the difference between evidence and assertion.'},

  {n:'Where the honest boundary is', ex:'Schwarzschild is not covered', stage:'wsEntropy',
   opts:{ Q1:10, Q5:20, N:60, view:'astro' },
   out:'Every astrophysical black hole is non-extremal and non-supersymmetric, and for those there is no microscopic count.',
   note:'The Strominger–Vafa result is a genuine achievement about a special case, and it should be described that way. A solar-mass hole has a Hawking temperature of sixty nanokelvin — far below the 2.725 K microwave background, so it is currently absorbing more than it radiates — and nobody can count its states.'},

  {n:'A geodesic, and an entanglement entropy', ex:'S = length/4G = (c/3)ln(ℓ/ε)', stage:'wsHolo',
   opts:{ L:2, eps:1e-3, G3:0.25 },
   out:'A bulk length integrated by adaptive quadrature, and a boundary formula from conformal field theory, printed together with their difference.',
   note:'This is the sharpest quantitative check in the wing. The quadrature is the same adaptive routine the integration wing uses and has no idea what it is being used for; the boundary formula is a standard CFT result derived by the replica trick and never mentions geometry. Only after both numbers exist are they compared.'},

  {n:'The residual is the cutoff, not an error', ex:'shrink ε and watch', stage:'wsHolo',
   opts:{ L:2, eps:1e-6, G3:0.25 },
   out:'At ε = 10⁻⁶ the relative difference falls to about 10⁻¹¹.',
   note:'A discrepancy that falls like ε² as the cutoff shrinks is a finite-cutoff correction; a discrepancy that sits still is a mistake. Slide the cutoff and watch which one this is. That behaviour is what separates an agreement from a coincidence, and it is why this laboratory always prints the difference rather than asserting the equation.'},

  {n:'The radial direction is an energy scale', ex:'E ∼ 1/z', stage:'wsHolo',
   opts:{ L:4.5, eps:1e-4, G3:0.4 },
   out:'A larger interval reaches deeper into the bulk — more of the boundary theory means lower energies.',
   note:'The bulk has one more dimension than the boundary and it looks as though it must contain more information. It does not: the extra direction is bookkeeping for scale, which the boundary theory already has. Watch the geodesic dive deeper as the interval grows, and read the energy ladder down the side of the plot.'},

  {n:'Heat the boundary and the entropy becomes extensive', ex:'log becomes linear', stage:'wsHolo',
   opts:{ L:3, eps:1e-4, G3:0.25, thermal:true, beta:0.7 },
   out:'At finite temperature the entanglement entropy grows linearly with the size of the region rather than logarithmically.',
   note:'Ordinary thermodynamic entropy appearing out of an entanglement calculation. On the bulk side the geodesic is hugging the horizon of a black hole, so the linear growth is literally horizon area — which is the same identification the microstate-counting stage made, arrived at from the opposite direction.'},

  {n:'Five theories, which was four too many', ex:'the duality web', stage:'wsWeb',
   opts:{ i:0, gs:0.4 },
   out:'Every edge is a duality checked in detail — spectra matched state by state, low-energy actions mapped.',
   note:'By 1985 there were five consistent superstring theories in ten dimensions, which is an embarrassment rather than a theory of everything. Click round the corners: T-duality relates them in pairs, S-duality maps strong coupling to weak, and both have been verified far past the point where coincidence is plausible.'},

  {n:'Turn up the coupling and a dimension opens', ex:'R₁₁ = g_s ℓ_s', stage:'wsWeb',
   opts:{ i:0, gs:4 },
   out:'The radius of the eleventh dimension is the string coupling. Nobody put it in.',
   note:'This is the most surprising fact in the wing. A dimensionless number that looked like a coupling constant turns out to be the size of a dimension. At weak coupling it is smaller than a string and invisible, which is why it went unnoticed for a decade; at strong coupling it is the largest scale in the problem and the fundamental objects stop being strings altogether.'},

  {n:'M-theory, and what is actually known about it', ex:'a placeholder with a name', stage:'wsWeb',
   opts:{ i:5, gs:2.5 },
   out:'Six corners of one parameter space — and no known formulation away from those corners.',
   note:'The dualities are established and checked in enormous detail; they are among the most solid results in the subject. What they imply is that one theory underlies all six limits, and that theory has never been written down: no action, no equations, no non-perturbative definition in general. The name is a placeholder for something known to exist and not known how to state.'},

  {n:'Except that it can now be simulated', ex:'the BFSS and IKKT matrix models', stage:'wsWeb',
   opts:{ i:1, gs:1.2 },
   out:'Finite matrix systems proposed as non-perturbative definitions — and a computer can run them.',
   note:'Lattice Monte Carlo on these models has reproduced predictions of the dual black-hole geometry, and a 2025 Physical Review Letters study of the polarised IKKT model probed the spacetime structure emerging from the dominant matrix configurations. Claims about non-perturbative quantum gravity are being tested by numerical experiment rather than by argument, which was unimaginable when the web was first drawn.'}
]}
];
