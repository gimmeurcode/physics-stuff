const THEORY_FLUIDS = `
<div class="toc"><a href="#f1">Pressure</a><a href="#f2">Buoyancy</a><a href="#f3">Flow</a><a href="#f4">Bernoulli</a>
<a href="#f5">Kinetic theory</a><a href="#f6">The first law</a><a href="#f7">Engines &amp; entropy</a></div>

<h3 id="f1">Pressure</h3>
<p>A fluid at rest cannot support shear — that is the <em>definition</em> of a fluid, not a fact about one — so it responds with pressure, which acts equally in every direction at a point. Pressure grows with depth because the fluid above has weight: <span class="mth"><i>P</i> = <i>P</i>₀ + ρ<i>gh</i></span>.</p>
<p>In water an extra atmosphere costs about 10 m of depth, which is why a barometer of water would need to be ten metres tall and one of mercury only 760 mm. <strong>Pascal's principle</strong> — pressure applied to an enclosed fluid is transmitted undiminished — gives the hydraulic lift its force multiplication, at the exact cost of a proportionally longer stroke. The work is unchanged.</p>

<h3 id="f2">Buoyancy</h3>
<p>The pressure on the bottom of a submerged object exceeds that on its top by <span class="mth">ρ<i>g</i></span> times its height; multiplying by the area gives an upward force equal to <strong>the weight of the fluid displaced</strong>. Archimedes' principle is not an extra law — it is what <span class="mth"><i>P</i> = ρ<i>gh</i></span> does to a closed surface, and the lab derives it that way.</p>
${stThm("Archimedes' principle", {
  hyp:'a body is submerged in a fluid of uniform density <span class="mth">ρ</span> in a uniform gravitational field <span class="mth"><i>g</i></span>',
  then:'the net pressure force on it is upward and equal to the weight of the fluid displaced:',
  eq:'<i>F</i><sub>buoy</sub> <span class="op">=</span> ρ<i>gV</i><sub>displaced</sub>',
  proof:`<p>The fluid does not know what is inside the surface — pressure at a point depends only on depth. So replace the body, in imagination, by an identically shaped parcel of the fluid itself. The pressure distribution over the boundary is <em>unchanged</em>, and therefore so is the net force.</p>
<p>That imaginary parcel is in equilibrium, because the surrounding fluid is at rest. Its weight <span class="mth">ρ<i>gV</i></span> acts downward, so the net pressure force on its surface must be <span class="mth">ρ<i>gV</i></span> upward. Since that force is the same for the real body, the principle follows.</p>
<p>The same result by direct integration, which is what the lab does: with <span class="mth"><i>P</i> = <i>P</i>₀ + ρ<i>gh</i></span> the net upward force is the closed-surface integral of <span class="mth">−<i>P</i> n̂</span>, and the divergence theorem turns it into a volume integral of <span class="mth">−∇<i>P</i> = ρ<i>g</i> ẑ</span>:</p>
${stEq('<i>F</i> <span class="op">=</span> <span class="op">−</span>∯ <i>P</i> n̂ <i>dS</i> <span class="op">=</span> <span class="op">−</span>∭ ∇<i>P</i> <i>dV</i> <span class="op">=</span> ρ<i>g</i> <i>V</i> ẑ')}
<p>So Archimedes' principle is not an extra law: it is what a depth-linear pressure field does to any closed surface, and the constant <span class="mth"><i>P</i>₀</span> drops out because a uniform pressure over a closed surface has zero resultant.</p>`,
  note:'Floating follows at once: equilibrium needs the displaced weight to equal the body’s weight, so the submerged fraction is exactly the density ratio — independent of shape and size. Ice at 917 kg/m³ floats with 91.7% below the surface.',
  see:'fluids:0.0', seeLabel:'Pressure and buoyancy' })}

<p>An object floats when its density is less than the fluid's, and the fraction submerged is exactly the density ratio — nothing else enters, not the shape and not the size. Ice at 917 kg/m³ floats with 91.7% below the surface.</p>

<h3 id="f3">Continuity</h3>
<p><span class="mth"><i>A</i>₁<i>v</i>₁ = <i>A</i>₂<i>v</i>₂</span> for an incompressible fluid: whatever goes in must come out, so narrowing the pipe speeds the flow. That is conservation of volume and nothing more.</p>

<h3 id="f4">Bernoulli</h3>
<div class="eqb"><span class="mth"><i>P</i> + ½ρ<i>v</i>² + ρ<i>gh</i> = const along a streamline</span></div>
<p>This is the work–energy theorem per unit volume. Since the narrow section is faster, its dynamic term is larger, so its <strong>pressure must be lower</strong> — the result everyone finds backwards. It is why a shower curtain is drawn inwards, how a carburettor works, and part (but only part) of why a wing lifts.</p>
<p class="note">The hypotheses are steady, incompressible, <strong>inviscid</strong> flow along a streamline. Past a Reynolds number of a few thousand the flow turns turbulent, streamlines stop being well defined, and the equation stops being a useful statement — the qualitative pressure–speed trade survives, the arithmetic does not. <strong>Torricelli's</strong> result, that fluid leaves a hole at exactly the speed it would reach by falling, is Bernoulli between two points at atmospheric pressure.</p>

<h3 id="f5">Kinetic theory</h3>
<p>Temperature is not a form of energy and not a speed; it is the parameter that decides which way energy flows, and for an ideal gas <span class="mth">⟨½<i>mv</i>²⟩ = (3/2)<i>kT</i></span>. The <strong>Maxwell–Boltzmann</strong> distribution of speeds is wide and skewed, so the most probable, mean and rms speeds all differ.</p>
<p>Speed goes as <span class="mth">1/√<i>M</i></span>, so helium moves nearly three times faster than nitrogen at the same temperature. The tail above escape velocity is exponentially sensitive to that — which is why Earth kept its nitrogen for four billion years and lost essentially all its primordial helium.</p>
<p><strong>Equipartition</strong> gives <span class="mth">½<i>kT</i></span> per quadratic degree of freedom, hence <span class="mth"><i>C</i><sub>v</sub> = <i>fR</i>/2</span>, <span class="mth"><i>C</i><sub>p</sub> = <i>C</i><sub>v</sub> + <i>R</i></span>, and <span class="mth">γ = (<i>f</i>+2)/<i>f</i></span>.</p>

<h3 id="f6">The first law</h3>
<div class="eqb"><span class="mth">Δ<i>U</i> = <i>Q</i> − <i>W</i></span></div>
<p>Energy conservation with heat included. The work is the <strong>area under the P–V path</strong> — the lab obtains it by quadrature on the actual curve and then checks it against the formula. ΔU depends only on the temperature change, since an ideal gas's internal energy is a function of T alone.</p>
<ul>
  <li><strong>Isothermal:</strong> ΔU = 0, so every joule of heat leaves as work.</li>
  <li><strong>Adiabatic:</strong> Q = 0, <span class="mth"><i>PV</i><sup>γ</sup> = const</span>, and the work comes out of internal energy — why a pump gets hot and a diesel needs no spark plug.</li>
  <li><strong>Isochoric:</strong> W = 0, so all the heat is internal energy. This defines <span class="mth"><i>C</i><sub>v</sub></span>.</li>
  <li><strong>Isobaric:</strong> <span class="mth"><i>W</i> = <i>P</i>Δ<i>V</i></span>, and the leakage into work is exactly why <span class="mth"><i>C</i><sub>p</sub> − <i>C</i><sub>v</sub> = <i>R</i></span>.</li>
</ul>

<h3 id="f7">Engines, and the second law</h3>
<p>An engine takes <span class="mth"><i>Q</i><sub>h</sub></span>, does work, and <em>must</em> reject <span class="mth"><i>Q</i><sub>c</sub></span>. Carnot's bound <span class="mth">η ≤ 1 − <i>T</i><sub>c</sub>/<i>T</i><sub>h</sub></span> depends only on the two temperatures — not the working substance, not the design — and reaching it requires every step to be reversible, hence infinitely slow, hence zero power.</p>
<p>The reason is entropy. A reversible cycle has <span class="mth">Σ<i>Q</i>/<i>T</i> = 0</span> exactly; any real one has <span class="mth">Σ<i>Q</i>/<i>T</i> &gt; 0</span>, and that surplus is entropy created from nothing.</p>

${stThm("Carnot's theorem — no engine beats the reversible one", {
  hyp:'an engine operates in a cycle between reservoirs at <span class="mth"><i>T</i><sub>h</sub> &gt; <i>T</i><sub>c</sub></span>',
  then:'',
  eq:'η <span class="op">=</span> <i>W</i>/<i>Q</i><sub>h</sub> &nbsp;≤&nbsp; 1 <span class="op">−</span> <i>T</i><sub>c</sub>/<i>T</i><sub>h</sub>',
  proof:`<p>Because the engine returns to its starting state each cycle, both its internal energy and its <em>entropy</em> come back to where they began. Energy conservation gives <span class="mth"><i>W</i> = <i>Q</i><sub>h</sub> − <i>Q</i><sub>c</sub></span>; the entropy statement is the one that does the work here.</p>
<p>The engine's own entropy change over a cycle is zero, so the total entropy change of the universe is what the reservoirs suffer:</p>
${stEq('Δ<i>S</i><sub>total</sub> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>Q</i><sub>h</sub></span><span class="den"><i>T</i><sub>h</sub></span></span> <span class="op">+</span> <span class="frac"><span class="nm"><i>Q</i><sub>c</sub></span><span class="den"><i>T</i><sub>c</sub></span></span>')}
<p>The second law requires <span class="mth">Δ<i>S</i><sub>total</sub> ≥ 0</span>, with equality only for a reversible cycle. Rearranging that inequality:</p>
${stEq('<span class="frac"><span class="nm"><i>Q</i><sub>c</sub></span><span class="den"><i>Q</i><sub>h</sub></span></span> &nbsp;≥&nbsp; <span class="frac"><span class="nm"><i>T</i><sub>c</sub></span><span class="den"><i>T</i><sub>h</sub></span></span>')}
<p>Now substitute into the efficiency:</p>
${stEq('η <span class="op">=</span> <span class="frac"><span class="nm"><i>Q</i><sub>h</sub> <span class="op">−</span> <i>Q</i><sub>c</sub></span><span class="den"><i>Q</i><sub>h</sub></span></span> <span class="op">=</span> 1 <span class="op">−</span> <span class="frac"><span class="nm"><i>Q</i><sub>c</sub></span><span class="den"><i>Q</i><sub>h</sub></span></span> &nbsp;≤&nbsp; 1 <span class="op">−</span> <span class="frac"><span class="nm"><i>T</i><sub>c</sub></span><span class="den"><i>T</i><sub>h</sub></span></span>')}
<p>Nothing in the argument mentioned the working substance, the pressures, or the mechanism — only that the cycle closes and that entropy cannot decrease. That is why the bound is universal, and why the search for a better working fluid was doomed before it began.</p>`,
  note:'Equality demands every step be reversible, which means infinitely slow, which means zero power. A real engine buys power by giving up efficiency; the bound describes a limit no design approaches, not a target.',
  see:'thermo:0.2', seeLabel:'Heat engines and the second law' })}
<p class="note">A <strong>free expansion</strong> exchanges no heat and does no work, and the entropy still rises by <span class="mth"><i>nR</i> ln 2</span>. Irreversibility is not about energy. Boltzmann's <span class="mth"><i>S</i> = <i>k</i> ln <i>W</i></span> explains it: the even split has astronomically more microstates, so a gas fills its container for the same reason a shuffled deck is not sorted. Entropy is the only quantity in physics with a preferred direction in time.</p>
`;

