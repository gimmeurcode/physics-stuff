const THEORY_EM = `
<div class="toc">
  <a href="#e0">The four equations</a><a href="#e1">Gauss's law</a>
  <a href="#e2">No monopoles</a><a href="#e3">Faraday</a>
  <a href="#e4">Ampère–Maxwell</a><a href="#e5">Light</a>
  <a href="#e6">The Lorentz force</a><a href="#e7">Potentials &amp; gauge</a>
  <a href="#e8">Energy &amp; momentum</a><a href="#e9">One field, not two</a>
  <a href="#e10">Reading the sandbox</a>
</div>

<h3 id="e0">The four equations</h3>
<p>Everything electric, magnetic and optical follows from four statements about two vector fields, plus one force law. In vacuum, in SI form:</p>
<div class="eqb"><span class="mth">
∇<span class="op">·</span><i>E</i> = ρ/ε₀ &nbsp;&nbsp;·&nbsp;&nbsp;
∇<span class="op">·</span><i>B</i> = 0 &nbsp;&nbsp;·&nbsp;&nbsp;
∇<span class="op">×</span><i>E</i> = −∂<i>B</i>/∂t &nbsp;&nbsp;·&nbsp;&nbsp;
∇<span class="op">×</span><i>B</i> = μ₀<i>J</i> + μ₀ε₀ ∂<i>E</i>/∂t
</span></div>
<p>Read structurally, they say something very tidy. The two <strong>divergence</strong> equations say where field lines can begin and end: electric lines start and stop on charge, magnetic lines never start or stop at all. The two <strong>curl</strong> equations say what makes field lines circulate: a changing magnetic field curls E, and a current or a changing electric field curls B. That is the entire content — sources and circulation, for two fields.</p>
<p class="note">This wing runs with <strong>ε₀ = μ₀ = c = 1</strong>, so every constant drops out and the probe's numbers can be compared directly with the equations. Each stage measures both sides of its law by separate numerical routines — flux by summing E·n̂ over a surface, circulation by summing E·T̂ around a curve — so when they agree, the agreement is evidence about the fields being drawn rather than a restatement of how they were generated.</p>

<h3 id="e1">1 · Gauss's law — flux counts charge</h3>
<div class="eqb"><span class="mth">∇<span class="op">·</span><i>E</i> = ρ/ε₀ &nbsp;⟺&nbsp; ∮<i>E</i><span class="op">·</span>d<i>A</i> = Q<sub>enc</sub>/ε₀</span></div>
<p>The divergence theorem converts between the two forms — the same machinery as the flux box in the vector-calculus wing, which is worth revisiting: Gauss's law <em>is</em> that instrument, applied to the electric field. The remarkable feature is what the flux does <strong>not</strong> depend on: not the shape of the surface, not its size, not where inside it the charge sits, not what other charges are outside. Field lines that enter and leave contribute nothing net; only lines that terminate inside count.</p>
<p>The reason is the 1/r² falloff. Field strength dies as r² while a sphere's area grows as r², so their product is scale-invariant. That is not a coincidence but a statement about the dimensionality of space: field lines from a point source spread over a 2-sphere. In a universe with a 1/r³ force, flux would depend on the surface and Gauss's law would not exist.</p>
<p>The most instructive case is the point-charge field <span class="mth"><i>E</i> = q<i>r̂</i>/4πε₀r²</span>. Compute its divergence anywhere away from the origin and you get exactly <strong>zero</strong> — the arrows fan outward everywhere, which looks like a source everywhere, but the spreading is precisely cancelled by the weakening. All of the divergence is concentrated in a delta function at the origin. A field engine demo in this wing shows exactly that: the flux box reads nothing until it swallows the charge.</p>

<h3 id="e2">2 · No magnetic monopoles</h3>
<div class="eqb"><span class="mth">∇<span class="op">·</span><i>B</i> = 0 &nbsp;⟺&nbsp; ∮<i>B</i><span class="op">·</span>d<i>A</i> = 0</span></div>
<p>Structurally this is Gauss's law with the right-hand side deleted, and the deletion is the whole physics: <strong>there is no magnetic charge</strong>. Magnetic field lines have no ends — they close on themselves. Break a bar magnet in half and you get two complete magnets; break those and you get four. Down at the bottom, magnetism comes from circulating current and from intrinsic spin, both of which are loops, and a loop has no ends.</p>
<p>Two consequences worth carrying around. First, magnetic flux through any <em>closed</em> surface is zero, but flux through an <em>open</em> surface bounded by a loop is the meaningful quantity Φ_B that Faraday's law differentiates. Second, ∇·B = 0 lets B be written as the curl of something, B = ∇×A — the vector potential, which is what quantum mechanics actually couples to (the Aharonov–Bohm effect detects A in a region where B is exactly zero).</p>
<p>Dirac showed in 1931 that the existence of a single monopole anywhere in the universe would force electric charge to come in exact integer multiples — an elegant explanation for a fact otherwise unexplained. Grand unified theories generically predict monopoles; ninety years of searching has found none. If one is ever found, this equation gains a ρ_m term and Maxwell's set becomes perfectly symmetric.</p>

<h3 id="e3">3 · Faraday's law — changing B makes E</h3>
<div class="eqb"><span class="mth">∇<span class="op">×</span><i>E</i> = −∂<i>B</i>/∂t &nbsp;⟺&nbsp; ∮<i>E</i><span class="op">·</span>d<i>l</i> = −dΦ<sub>B</sub>/dt</span></div>
<p>Here electrostatics ends. A changing magnetic field wraps an electric field around itself: field lines that close in loops, with no charge anywhere to start or end on. Such a field has no potential — ∮E·dl ≠ 0 means "voltage between two points" stops being well-defined, which is why circuit theory needs Kirchhoff's loop rule amended in the presence of changing flux.</p>
<p>The minus sign is <strong>Lenz's law</strong>, and it is conservation of energy wearing a disguise. The induced current creates its own magnetic field opposing the change that produced it, so an approaching magnet is pushed back and a receding one is pulled after. If the sign were positive, a nudge would amplify itself and you would have a free-energy machine. Instead you have to do mechanical work — which is exactly what a generator converts into electricity, and essentially the entire world's electrical supply comes through this equation.</p>
<p>The stage in this wing sweeps a magnet through a coil and plots Φ_B(t) alongside the induced EMF. The EMF is the negative <em>slope</em> of the flux, so it peaks while the magnet approaches and passes through zero at the instant the magnet is centred — the moment of maximum flux and zero rate of change. Stop the magnet and the EMF vanishes no matter how strong the field is.</p>
<p class="note">The moving magnet's electric field in this lab is computed as <strong>E = −v×B</strong>, which is not an approximation bolted on but the exact statement for a rigidly translating field: since B(r,t) = B₀(r − vt), one line of vector calculus gives ∇×(−v×B) = −(v·∇)B = −∂B/∂t, i.e. Faraday's law identically. The unit tests verify it numerically to six digits.</p>

${stThm("Faraday's law of induction", {
  hyp:'any surface <i>S</i> bounded by a closed curve ∂<i>S</i>, with the curve\'s orientation and the surface\'s normal related by the right-hand rule',
  then:'the electromotive force round the boundary is minus the rate of change of the flux through it,',
  eq:'∮<sub>∂<i>S</i></sub> <b>E</b><span class="op">·</span><i>d</i><b>l</b> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span> ∬<sub><i>S</i></sub> <b>B</b><span class="op">·</span><i>d</i><b>A</b>',
  proof:`<p>The differential law is <span class="mth">∇×<b>E</b> = −∂<b>B</b>/∂<i>t</i></span>. Integrate both sides over the surface <span class="mth"><i>S</i></span> and apply Stokes' theorem to the left:</p>
${stEq('∬<sub><i>S</i></sub> (∇<span class="op">×</span><b>E</b>)<span class="op">·</span><i>d</i><b>A</b> <span class="op">=</span> ∮<sub>∂<i>S</i></sub> <b>E</b><span class="op">·</span><i>d</i><b>l</b>, &nbsp;&nbsp; ∬<sub><i>S</i></sub> <span class="op">−</span><span class="frac"><span class="nm">∂<b>B</b></span><span class="den">∂<i>t</i></span></span><span class="op">·</span><i>d</i><b>A</b> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span> ∬<sub><i>S</i></sub> <b>B</b><span class="op">·</span><i>d</i><b>A</b>')}
<p>Moving the time derivative outside the integral on the right is legitimate for a surface that is not itself moving. That restriction is not a technicality: when the circuit moves or deforms, the total EMF picks up a second contribution <span class="mth">∮(<b>v</b>×<b>B</b>)·<i>d</i><b>l</b></span> — the motional EMF — and the two together are what the flux rule describes. The wire in a generator and the changing field in a transformer are those two terms, and the fact that one formula covers both was Faraday's discovery rather than a consequence of the differential law.</p>`,
  note:'The minus sign is Lenz\'s law and it is forced, not chosen. Reverse it and an induced current would reinforce the change that made it, a nudge would grow without bound, and energy would appear from nothing. Lenz\'s law is conservation of energy expressed as a sign convention.',
  see:'em:emFaraday', seeLabel:'Faraday — a moving magnet makes E' })}

<h3 id="e4">4 · Ampère–Maxwell — and the term that made light</h3>
<div class="eqb"><span class="mth">∇<span class="op">×</span><i>B</i> = μ₀<i>J</i> + μ₀ε₀ ∂<i>E</i>/∂t &nbsp;⟺&nbsp; ∮<i>B</i><span class="op">·</span>d<i>l</i> = μ₀(I<sub>enc</sub> + ε₀ dΦ<sub>E</sub>/dt)</span></div>
<p>Ampère's original law — circulation of B equals enclosed current — works beautifully for a straight wire: B falls as 1/s while the path length grows as 2πs, so the product counts current and nothing else, whatever loop you choose.</p>
<p>Then Maxwell noticed it contradicts itself. A loop bounds infinitely many surfaces. Take a wire charging a capacitor: a flat surface across the wire is pierced by current I; a surface bulged to pass between the capacitor plates is pierced by <strong>no current at all</strong>. Same loop, same B field, two different answers. Ampère's law as stated is not even well-posed.</p>
<p>Maxwell's repair was to observe that although no charge crosses the gap, the electric field between the plates is <em>growing</em> — and ε₀ dΦ_E/dt through the gap equals the conduction current exactly. Adding that "displacement current" term makes the law surface-independent, and (equivalently) makes charge conservation ∂ρ/∂t + ∇·J = 0 an automatic consequence of the equations rather than an extra assumption. The capacitor stage in this wing shows both surfaces on one loop with both numbers alongside.</p>

<h3 id="e5">5 · Light, deduced from the four</h3>
<p>In empty space (ρ = 0, J = 0), take the curl of Faraday's law and substitute Ampère–Maxwell:</p>
<div class="eqb"><span class="mth">∇<span class="op">×</span>(∇<span class="op">×</span><i>E</i>) = −∂(∇<span class="op">×</span><i>B</i>)/∂t = −μ₀ε₀ ∂²<i>E</i>/∂t²</span></div>
<p>and with ∇×(∇×E) = ∇(∇·E) − ∇²E = −∇²E (since ∇·E = 0 with no charge):</p>
<div class="eqb"><span class="mth">∇²<i>E</i> = μ₀ε₀ ∂²<i>E</i>/∂t², &nbsp;&nbsp; speed = 1/√(μ₀ε₀) = c</span></div>
<p>This is a wave equation, and its speed is fixed by two constants that had been measured with capacitors and coils — no optics involved. Maxwell evaluated 1/√(μ₀ε₀) in 1862, obtained 3.1×10⁸ m/s, compared it with Fizeau's measured speed of light, and concluded that light "is an electromagnetic disturbance propagated through the field according to electromagnetic laws." Hertz generated and detected the waves twenty-five years later; radio followed within a decade.</p>

${stThm('Maxwell’s equations in vacuum force a wave travelling at 1/√(μ₀ε₀)', {
  hyp:'a source-free region: <span class="mth">ρ = 0</span> and <span class="mth"><b>J</b> = <b>0</b></span>, with the four Maxwell equations holding',
  then:'each Cartesian component of <span class="mth"><b>E</b></span> and <span class="mth"><b>B</b></span> satisfies the wave equation, with speed',
  eq:'<i>c</i> <span class="op">=</span> 1/√(μ₀ε₀)',
  proof:`<p>Take the curl of Faraday's law <span class="mth">∇×<b>E</b> = −∂<b>B</b>/∂<i>t</i></span>. Curl and the time derivative commute, since they act on different variables:</p>
${stEq('∇<span class="op">×</span>(∇<span class="op">×</span><b>E</b>) <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm">∂</span><span class="den">∂<i>t</i></span></span>(∇<span class="op">×</span><b>B</b>)')}
<p>Ampère–Maxwell with <span class="mth"><b>J</b> = <b>0</b></span> gives <span class="mth">∇×<b>B</b> = μ₀ε₀ ∂<b>E</b>/∂<i>t</i></span>, so the right-hand side becomes <span class="mth">−μ₀ε₀ ∂²<b>E</b>/∂<i>t</i>²</span>.</p>
<p>For the left, use the vector identity <span class="mth">∇×(∇×<b>E</b>) = ∇(∇·<b>E</b>) − ∇²<b>E</b></span>. Gauss's law with <span class="mth">ρ = 0</span> makes <span class="mth">∇·<b>E</b> = 0</span>, killing the first term — this is where "source-free" is spent. So</p>
${stEq('∇²<b>E</b> <span class="op">=</span> μ₀ε₀ <span class="frac"><span class="nm">∂²<b>E</b></span><span class="den">∂<i>t</i>²</span></span>')}
<p>Comparing with the standard wave equation <span class="mth">∇²<i>u</i> = (1/<i>v</i>²) ∂²<i>u</i>/∂<i>t</i>²</span> identifies <span class="mth"><i>v</i> = 1/√(μ₀ε₀)</span>. Starting from Ampère–Maxwell instead and using <span class="mth">∇·<b>B</b> = 0</span> gives the identical equation for <span class="mth"><b>B</b></span>.</p>
<p>All four equations were used, and the displacement current <span class="mth">μ₀ε₀ ∂<b>E</b>/∂<i>t</i></span> — Maxwell's own addition — is the term without which the substitution produces nothing. Remove it and there is no wave.</p>`,
  note:'The speed emerged with no reference to a medium or an observer, which is why it must be the same in every frame. Nineteenth-century physics tried to escape that with the aether; Einstein took it at face value, and special relativity is the consequence.',
  see:'em:emWave', seeLabel:'Light, deduced' })}
<p>The solutions have a rigid structure that the wave stage lets you verify from any viewing angle: <strong>E ⊥ B ⊥ direction of travel</strong> (transverse), the two fields in phase, |E| = c|B|, and the Poynting vector S = E×B/μ₀ pointing along the propagation direction. Radio, microwave, infrared, visible, ultraviolet, X-ray and gamma are one solution at different wavelengths; the visible band is a single octave of an infinite spectrum.</p>
<p>One further consequence deserves emphasis. The speed came out of the field equations without reference to any medium or observer — so it must be the same in every frame. Nineteenth-century physics tried to escape that by inventing the aether; Einstein instead took it at face value, and special relativity is the result. The E-becomes-B stage in the atom wing shows the flip side: what one observer calls a pure electric field, another calls electric plus magnetic, and only the combination is frame-independent.</p>

<h3 id="e6">The Lorentz force — how fields become motion</h3>
<div class="eqb"><span class="mth"><i>F</i> = q(<i>E</i> + <i>v</i> <span class="op">×</span> <i>B</i>)</span></div>
<p>Maxwell's equations say what the fields do; this says what the fields do <em>to matter</em>, and the pair is the complete classical theory. Note the asymmetry: the electric term does work (it can change speed), while the magnetic term is always perpendicular to v and therefore does <strong>no work at all</strong> — a magnetic field can bend a trajectory but never speed it up. That is why a cyclotron needs an oscillating electric field to accelerate and a magnetic field only to steer, a fact the vector-calculus wing's charged-particle demos verify by conserving speed to eight digits.</p>
<p>For a magnetic dipole (a current loop, or an electron's spin) the corresponding statements are a torque τ = m×B, which is why a compass needle turns, and a force F = ∇(m·B), which requires a field <em>gradient</em> — a uniform field turns a magnet but does not pull it. The sandbox integrates both, so the small needles genuinely swing into alignment and magnets genuinely attract or repel by pole.</p>

<h3 id="e7">Potentials and gauge freedom</h3>
<p>Because ∇·B = 0, B can always be written B = ∇×A; and then Faraday's law says ∇×(E + ∂A/∂t) = 0, so that combination is a gradient: E = −∇φ − ∂A/∂t. The four field equations collapse into two equations for (φ, A). This is not just algebra — the potentials are what appears in the quantum Hamiltonian, and the Aharonov–Bohm effect shows electrons responding to A in a region where B is identically zero.</p>
<p>Potentials are not unique: A → A + ∇χ and φ → φ − ∂χ/∂t leave every field unchanged. That redundancy is <strong>gauge freedom</strong>, and demanding it as a local symmetry is precisely what generates electromagnetism in the Standard Model — the U(1) story in the atom wing. Electromagnetism was the first gauge theory; the strong and weak forces were built by copying its structure with larger symmetry groups.</p>

<h3 id="e8">Energy, momentum and where they flow</h3>
<div class="eqb"><span class="mth">u = ½(ε₀E² + B²/μ₀) &nbsp;·&nbsp; <i>S</i> = <i>E</i> <span class="op">×</span> <i>B</i>/μ₀ &nbsp;·&nbsp; ∂u/∂t + ∇<span class="op">·</span><i>S</i> = −<i>J</i><span class="op">·</span><i>E</i></span></div>
<p>The fields carry energy with density u and transport it with the Poynting vector S — both available at the probe in the sandbox. Poynting's theorem is a conservation law in exactly the same form as ∇·J + ∂ρ/∂t = 0: energy leaving a region equals the flux through its boundary, plus whatever work the field did on charges inside.</p>
<p>Two consequences are less obvious than they look. Fields carry <em>momentum</em> too (density S/c²), so light exerts pressure — solar sails, radiation pressure in stars, and the recoil of an antenna. And energy flows in surprising places: in a DC circuit the energy reaches the resistor through the <strong>fields around the wire</strong>, not through the electrons inside it. The Poynting arrows in the sandbox point wherever the real energy transport goes.</p>

${stThm("Poynting's theorem", {
  hyp:'Maxwell\'s equations in a region, with <b>J</b> the free current density',
  then:'the field energy density u and the flux <b>S</b> = <b>E</b> × <b>B</b>/μ₀ satisfy a continuity equation with a source,',
  eq: '<span class="frac"><span class="nm">∂<i>u</i></span><span class="den">∂<i>t</i></span></span> <span class="op">+</span> ∇<span class="op">·</span><b>S</b> <span class="op">=</span> <span class="op">−</span><b>J</b><span class="op">·</span><b>E</b>, &nbsp;&nbsp; <i>u</i> <span class="op">=</span> ½(ε₀<i>E</i>² <span class="op">+</span> <i>B</i>²/μ₀)',
  proof:`<p>Start from the identity <span class="mth">∇·(<b>E</b>×<b>B</b>) = <b>B</b>·(∇×<b>E</b>) − <b>E</b>·(∇×<b>B</b>)</span>, which is a vector-calculus fact and no physics at all. Now substitute the two curl equations — Faraday for <span class="mth">∇×<b>E</b></span> and Ampère–Maxwell for <span class="mth">∇×<b>B</b></span>:</p>
${stEq('∇<span class="op">·</span>(<b>E</b><span class="op">×</span><b>B</b>) <span class="op">=</span> <span class="op">−</span><b>B</b><span class="op">·</span><span class="frac"><span class="nm">∂<b>B</b></span><span class="den">∂<i>t</i></span></span> <span class="op">−</span> μ₀<b>E</b><span class="op">·</span><b>J</b> <span class="op">−</span> μ₀ε₀<b>E</b><span class="op">·</span><span class="frac"><span class="nm">∂<b>E</b></span><span class="den">∂<i>t</i></span></span>')}
<p>The two time-derivative terms are each half of a derivative of a square: <span class="mth"><b>B</b>·∂<b>B</b>/∂<i>t</i> = ½ ∂(<i>B</i>²)/∂<i>t</i></span>, and likewise for <b>E</b>. Divide through by μ₀ and collect them, and what appears in front of the time derivative is exactly <span class="mth">½(ε₀<i>E</i>² + <i>B</i>²/μ₀)</span>. Rearranged, that is the statement above.</p>
<p>The derivation is worth reading for what it does <em>not</em> contain. Nothing was assumed about where energy is stored or how it moves; both u and <b>S</b> emerged from an algebraic rearrangement of Maxwell's equations. That is why the theorem is a definition and a conservation law at the same time — the fields were found to have an energy budget that balances, and the terms of the budget are what we then agreed to call energy density and energy flux.</p>`,
  note:'The source term −<b>J</b>·<b>E</b> is the rate at which the field does work on charges, and its sign is the whole content: energy leaving the field is energy arriving in matter. A conductor carrying current has <b>S</b> pointing <em>into</em> its surface everywhere along its length, which is the sense in which a wire is heated from outside.',
  see:'em:2.1' })}

<h3 id="e9">One field, not two</h3>
<p>Electric and magnetic fields are not independent objects that happen to interact — they are components of a single antisymmetric tensor F<sup>μν</sup>, and a change of reference frame mixes them:</p>
<div class="eqb"><span class="mth"><i>E</i>′<sub>⊥</sub> = γ(<i>E</i> + <i>v</i><span class="op">×</span><i>B</i>)<sub>⊥</sub>, &nbsp; <i>B</i>′<sub>⊥</sub> = γ(<i>B</i> − <i>v</i><span class="op">×</span><i>E</i>/c²)<sub>⊥</sub></span></div>
<p>A charge at rest has a pure Coulomb field; run past it and you measure a magnetic field as well. Nothing changed but the observer. In this laboratory that is not narrative — the sandbox computes a moving charge's field as the exact boosted Coulomb field and derives B = v×E from it, and the relativity stage in the atom wing verifies that the invariant E² − c²B² is the same number in both frames.</p>
<p>The cleanest illustration is a current-carrying wire attracting a moving charge. In the lab frame the wire is electrically neutral and the force is purely magnetic. In the charge's frame the moving and stationary lattices are length-contracted by different factors, the wire acquires a net charge density, and the identical force is purely electrostatic. <strong>Magnetism is what electrostatics looks like from a moving frame</strong> — and it is a big effect at everyday drift velocities only because electric forces are so enormously strong that a part-per-10¹³ imbalance is enough to run a motor.</p>

<h3 id="e10">Reading the sandbox</h3>
<ul>
  <li><strong>Charges</strong> use the exact Coulomb field at rest, and the <em>Heaviside field</em> when moving — the Coulomb field compressed into the transverse plane by γ, with B = v×E. Push the velocity up and watch the field pancake.</li>
  <li><strong>Wires</strong> run perpendicular to the screen (⊙ out, ⊗ in) with B = μ₀I/2πs circling by the right-hand rule.</li>
  <li><strong>Bar magnets</strong> are exact point dipoles, B = μ₀[3(m·r̂)r̂ − m]/4πr³. Give one a velocity and an electric field appears: E = −v×B, drawn as ⊙/⊗ glyphs because it points out of the screen.</li>
  <li><strong>Pickup loops</strong> report Φ_B through them and the induced EMF = −dΦ/dt, computed by differencing the flux as the sources drift. Move a magnet near one and you have built a generator.</li>
  <li><strong>Run</strong> integrates the real dynamics: F = q(E + v×B) for charges, τ = m×B for magnets. Everything that then happens — orbits, repulsion, needles swinging into alignment — is the laws above, not scripted animation.</li>
  <li><strong>The probe</strong> reads E, B, the energy density u and the Poynting vector S at its exact location, and checks Gauss's law and ∮B·dA = 0 on a small sphere centred there, live.</li>
</ul>
`;

