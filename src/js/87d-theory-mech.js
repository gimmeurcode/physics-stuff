const THEORY_MECH = `
<div class="toc"><a href="#m1">Kinematics</a><a href="#m2">Projectiles</a><a href="#m3">Newton's laws</a>
<a href="#m4">Friction &amp; circular motion</a><a href="#m5">Energy</a><a href="#m6">Momentum</a><a href="#m7">Gravitation</a></div>

<h3 id="m1">Kinematics is calculus</h3>
<p>Position, velocity and acceleration are related by differentiation one way and integration the other. The <em>slope</em> of x(t) is v; the <em>area</em> under v(t) is the displacement. The four constant-acceleration equations are <span class="mth"><i>a</i> = const</span> integrated twice with one variable eliminated each time — consequences, not axioms, and they stop applying the moment the acceleration varies.</p>
<p class="note">At a turning point the object is <strong>momentarily at rest and still accelerating at full strength</strong>. A ball at the top of its flight is the standard case, and "at rest, so no force" is the standard mistake. Velocity and acceleration are independent: either can be zero while the other is not.</p>

<h3 id="m2">Projectiles</h3>
<p>Horizontal and vertical motion are <strong>independent</strong>, because gravity acts only downwards. That is Galileo's insight and it is the entire content of the subject. The range <span class="mth"><i>v</i>₀²sin2θ/<i>g</i></span> peaks at 45° and is symmetric about it, so complementary angles carry the same distance.</p>
<p>With quadratic drag the trajectory is no longer a parabola, is no longer symmetric, descends far more steeply than it rose, and has an optimum launch angle well below 45°. There is no closed form; the lab integrates it by RK4.</p>

<h3 id="m3">Newton's three laws</h3>
<ul>
  <li><strong>First:</strong> a body continues at constant velocity unless acted on. This is really the <em>definition</em> of an inertial frame, and the reason "centrifugal force" is not a force.</li>
  <li><strong>Second:</strong> <span class="mth"><b>F</b><sub>net</sub> = <i>m</i><b>a</b></span>, more properly <span class="mth"><b>F</b> = <i>d</i><b>p</b>/<i>dt</i></span>. It is a <em>vector</em> equation and holds separately in each direction.</li>
  <li><strong>Third:</strong> forces come in equal and opposite pairs <em>on different bodies</em>. That last clause is why they never cancel in a free-body diagram — and it is exactly what makes momentum conserved.</li>
</ul>
<p>A free-body diagram is the statement that <span class="mth">Σ<i>F</i> = <i>ma</i></span> holds in each direction. Choosing axes along the acceleration turns two hard equations into one easy one and one trivial one; that choice is the technique.</p>

<h3 id="m4">Friction and circular motion</h3>
<p>Static friction is <strong>whatever it needs to be</strong>, up to <span class="mth">μ<sub>s</sub><i>N</i></span>; only once it slips does it become <span class="mth">μ<sub>k</sub><i>N</i></span>. On an incline the mass cancels entirely: a block slides when <span class="mth">tan θ &gt; μ</span>, whatever it weighs, which is why the angle of repose measures μ directly.</p>
<p>Uniform circular motion has constant <em>speed</em> and changing velocity, so it accelerates — towards the centre, at <span class="mth"><i>v</i>²/<i>r</i></span>. Centripetal force is not a new force but a <em>requirement</em> that some real force must meet. At the top of a loop gravity alone suffices once <span class="mth"><i>v</i> ≥ √(<i>gr</i>)</span>.</p>

<h3 id="m5">Work and energy</h3>
<div class="eqb"><span class="mth"><i>W</i> = ∫<b>F</b><span class="op">·</span><i>d</i><b>r</b> , &nbsp;&nbsp; <i>W</i><sub>net</sub> = Δ<i>K</i></span></div>
<p>A force perpendicular to the motion does <strong>no work</strong> — the normal force never enters the energy ledger however large it gets, and neither does the magnetic force on a moving charge. Deciding which forces do work is the whole of energy problem-solving.</p>
<p>For a <strong>conservative</strong> force the work is path-independent and a potential energy exists. Then <span class="mth"><i>K</i> + <i>U</i></span> is constant, and the speed depends only on the height dropped and not at all on the route — which the lab checks against <span class="mth">√(2<i>g</i>Δ<i>h</i>)</span> along an arbitrary track. Add friction and the shortfall is exactly the energy removed.</p>

${stThm('Work–energy theorem', {
  hyp:'a particle of constant mass <span class="mth"><i>m</i></span> moves under a net force <span class="mth"><b>F</b></span> along a path from <span class="mth"><i>A</i></span> to <span class="mth"><i>B</i></span>',
  then:'',
  eq:'<i>W</i><sub>net</sub> <span class="op">=</span> ∫<sub><i>A</i></sub><sup><i>B</i></sup> <b>F</b><span class="op">·</span><i>d</i><b>r</b> <span class="op">=</span> ½<i>mv</i><sub><i>B</i></sub>² <span class="op">−</span> ½<i>mv</i><sub><i>A</i></sub>²',
  proof:`<p>Use Newton's second law and convert the path integral into a time integral by <span class="mth"><i>d</i><b>r</b> = <b>v</b> <i>dt</i></span>:</p>
${stEq('∫ <b>F</b><span class="op">·</span><i>d</i><b>r</b> <span class="op">=</span> ∫ <i>m</i> <span class="frac"><span class="nm"><i>d</i><b>v</b></span><span class="den"><i>dt</i></span></span> <span class="op">·</span> <b>v</b> <i>dt</i>')}
<p>Now notice that the integrand is a total derivative. By the product rule for the dot product,</p>
${stEq('<span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span>(<b>v</b><span class="op">·</span><b>v</b>) <span class="op">=</span> 2 <b>v</b><span class="op">·</span><span class="frac"><span class="nm"><i>d</i><b>v</b></span><span class="den"><i>dt</i></span></span> &nbsp;&nbsp;⟹&nbsp;&nbsp; <i>m</i> <span class="frac"><span class="nm"><i>d</i><b>v</b></span><span class="den"><i>dt</i></span></span><span class="op">·</span><b>v</b> <span class="op">=</span> <span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span>(½<i>m</i>|<b>v</b>|²)')}
<p>So the integral is of a derivative, and the Fundamental Theorem of Calculus evaluates it at the two ends:</p>
${stEq('∫<sub><i>t<sub>A</sub></i></sub><sup><i>t<sub>B</sub></i></sup> <span class="frac"><span class="nm"><i>d</i></span><span class="den"><i>dt</i></span></span>(½<i>m</i>|<b>v</b>|²) <i>dt</i> <span class="op">=</span> ½<i>mv</i><sub><i>B</i></sub>² <span class="op">−</span> ½<i>mv</i><sub><i>A</i></sub>²')}
<p>Two things fall out of the algebra rather than from physical intuition. The dot product means a force <strong>perpendicular to the motion does no work</strong> — so the normal force never enters the ledger however large it becomes, and neither does the magnetic force on a moving charge. And nothing was assumed about the force being conservative: the theorem holds for friction too, which is why the shortfall on a rough track is exactly the energy friction removed.</p>`,
  note:'Conservativeness is a separate and stronger property: it says the work is path-independent, which is what lets a potential energy be defined at all. Then K + U is constant. Without it there is still a work–energy theorem, just no U.',
  see:'mechanics:0.3', seeLabel:'The energy ledger' })}

<h3 id="m6">Momentum and collisions</h3>
<p>Momentum is conserved in every collision, at every elasticity, because the two impulses are equal and opposite and there is no external force. Kinetic energy is conserved only when <span class="mth"><i>e</i> = 1</span>; the loss is <span class="mth">½μ(Δ<i>u</i>)²(1−<i>e</i>²)</span> with μ the reduced mass.</p>
<p class="note">The <strong>centre of mass</strong> moves through a collision unchanged, because no internal force can move it. In that frame the total momentum is zero, so an elastic collision is simply a reflection — which makes every collision problem easier and costs one addition to transform back.</p>

<h3 id="m7">Gravitation</h3>
<div class="eqb"><span class="mth"><i>F</i> = <span class="frac"><span class="nm"><i>GMm</i></span><span class="den"><i>r</i>²</span></span> , &nbsp;&nbsp; <i>U</i> = −<span class="frac"><span class="nm"><i>GMm</i></span><span class="den"><i>r</i></span></span></span></div>
<p>The lab integrates orbits from this force alone with a symplectic stepper, so the ellipse is a <em>result</em>. Angular momentum holds to a part in 10⁹ because the force is central — and that constancy <em>is</em> Kepler's second law, since the areal velocity is <span class="mth"><i>L</i>/2</span>.</p>
<p>A circular orbit has <span class="mth"><i>E</i> = <i>U</i>/2</span> (the virial theorem), so escape speed is exactly <span class="mth">√2</span> times orbital speed at any radius. It also has a counter-intuitive consequence: firing forwards raises the orbit and <em>slows you down</em>, because the potential energy gained exceeds the kinetic energy added.</p>
<p class="note">Astronauts float not because gravity has gone away — at 400 km it is still 89% of its surface value — but because they and their spacecraft are in free fall together. Weightlessness is the absence of a <em>normal force</em>, not of gravity.</p>
`;

