const THEORY_ROT = `
<div class="toc"><a href="#r1">Rotational kinematics</a><a href="#r2">Moment of inertia</a><a href="#r3">Torque</a>
<a href="#r4">Rolling</a><a href="#r5">Angular momentum</a><a href="#r6">Statics</a></div>

<h3 id="r1">Every equation, once more with feeling</h3>
<p>Rotational kinematics is linear kinematics with each symbol replaced: <span class="mth"><i>x</i>→θ</span>, <span class="mth"><i>v</i>→ω</span>, <span class="mth"><i>a</i>→α</span>, <span class="mth"><i>m</i>→<i>I</i></span>, <span class="mth"><i>F</i>→τ</span>, <span class="mth"><i>p</i>→<i>L</i></span>. Every equation carries over unchanged, and the bridge to linear motion is <span class="mth"><i>v</i> = ω<i>r</i></span>, <span class="mth"><i>a</i><sub>t</sub> = α<i>r</i></span>, <span class="mth"><i>a</i><sub>c</sub> = ω²<i>r</i></span>.</p>

<h3 id="r2">Moment of inertia</h3>
<div class="eqb"><span class="mth"><i>I</i> = ∫<i>r</i>² <i>dm</i></span></div>
<p>Mass weighted by the <strong>square</strong> of its distance from the axis, and that squaring is everything. Mass near the axis is nearly free; mass at the rim costs the most it possibly can. A hoop has the largest I of any shape of its size, and a solid sphere among the smallest. The lab integrates this over each body and prints the answer beside the table value.</p>
<p>The <strong>parallel-axis theorem</strong> <span class="mth"><i>I</i> = <i>I</i><sub>cm</sub> + <i>Md</i>²</span> says moving the axis always increases I, by an amount independent of shape. So the smallest possible I is always about the centre of mass — which is why a thrown object spins about its centre of mass and nothing else.</p>

<h3 id="r3">Torque</h3>
<p><span class="mth"><b>τ</b> = <b>r</b> <span class="op">×</span> <b>F</b></span>: only the perpendicular component turns anything. <span class="mth">τ = <i>I</i>α</span> is Newton's second law for rotation, and it holds about the centre of mass even when that point is accelerating — a fact that saves a great deal of work.</p>

<h3 id="r4">Rolling without slipping</h3>
<p>The constraint <span class="mth"><i>v</i> = ω<i>R</i></span> means the contact point is <strong>instantaneously at rest</strong>. Static friction therefore acts and does <strong>no work</strong> — it supplies the torque that spins the object up while removing no energy at all, which is why rolling is efficient and sliding is not.</p>
<div class="eqb"><span class="mth"><i>a</i> = <span class="frac"><span class="nm"><i>g</i> sin θ</span><span class="den">1 + <i>c</i></span></span> , &nbsp;&nbsp; <i>c</i> = <span class="frac"><span class="nm"><i>I</i></span><span class="den"><i>MR</i>²</span></span></span></div>
<p>Mass cancels. Radius cancels. Only the shape survives, so a marble beats a can beats a hoop, every time, regardless of size or weight. The fraction of the energy that is rotational is <span class="mth"><i>c</i>/(1+<i>c</i>)</span> — two sevenths for a sphere, half for a hoop.</p>

${stThm('A rolling body descends at an acceleration set by shape alone', {
  hyp:'a rigid body of mass <span class="mth"><i>M</i></span>, radius <span class="mth"><i>R</i></span> and moment of inertia <span class="mth"><i>I</i> = <i>cMR</i>²</span> rolls without slipping down an incline of angle <span class="mth">θ</span>',
  then:'',
  eq:'<i>a</i> <span class="op">=</span> <span class="frac"><span class="nm"><i>g</i> sin θ</span><span class="den">1 <span class="op">+</span> <i>c</i></span></span>',
  proof:`<p>Energy is the shortest route, and it is legitimate because <strong>static friction does no work</strong>: rolling without slipping means the contact point is instantaneously at rest, and a force applied at a point that is not moving transfers no energy.</p>
<p>So all the lost potential energy appears as kinetic energy, split between translation and rotation. After descending a height <span class="mth"><i>h</i></span>:</p>
${stEq('<i>Mgh</i> <span class="op">=</span> ½<i>Mv</i>² <span class="op">+</span> ½<i>I</i>ω²')}
<p>The rolling constraint gives <span class="mth">ω = <i>v</i>/<i>R</i></span>. Substituting that and <span class="mth"><i>I</i> = <i>cMR</i>²</span>, the rotational term becomes <span class="mth">½<i>cMR</i>²(<i>v</i>/<i>R</i>)² = ½<i>cMv</i>²</span> — and both <span class="mth"><i>M</i></span> and <span class="mth"><i>R</i></span> disappear:</p>
${stEq('<i>gh</i> <span class="op">=</span> ½<i>v</i>²(1 <span class="op">+</span> <i>c</i>)')}
<p>On an incline, <span class="mth"><i>h</i> = <i>s</i> sin θ</span> after travelling a distance <span class="mth"><i>s</i></span>, so <span class="mth"><i>v</i>² = 2<i>gs</i> sin θ/(1+<i>c</i>)</span>. That is <span class="mth"><i>v</i>² = 2<i>as</i></span> with constant <span class="mth"><i>a</i> = <i>g</i> sin θ/(1+<i>c</i>)</span>, which confirms the motion is uniformly accelerated and identifies the acceleration.</p>
<p>Mass cancelled because every energy term carried one factor of <span class="mth"><i>M</i></span>; radius cancelled because the constraint ties <span class="mth">ω</span> to <span class="mth"><i>v</i></span> through exactly the <span class="mth"><i>R</i></span> that <span class="mth"><i>I</i></span> supplies. Only the dimensionless shape factor <span class="mth"><i>c</i></span> survives.</p>`,
  note:'So a marble (c = 2/5) beats a can (½) beats a hoop (1), whatever their sizes or weights — a race whose outcome is decided before anything is weighed. Let it slip and the argument fails: kinetic friction does work, and the energy accounting above no longer closes.',
  see:'rotenergy:0.1', seeLabel:'The race down the ramp' })}

<h3 id="r5">Angular momentum</h3>
<p><span class="mth"><i>L</i> = <i>I</i>ω</span> is conserved when no external torque acts. Since <span class="mth"><i>K</i> = <i>L</i>²/2<i>I</i></span>, halving I <em>doubles</em> the kinetic energy — and every joule of it is work done by whatever pulled the mass inwards. A neutron star is the extreme case: a collapse from 100 000 km to 10 km raises the spin by 10⁸, turning a monthly rotation into a millisecond pulsar.</p>
<p class="note">A <strong>gyroscope</strong> shows the third face of L. Gravity's torque is <em>perpendicular</em> to L, so it cannot change L's length — only its direction. The axis therefore precesses at <span class="mth">Ω = τ/<i>L</i></span> instead of falling. Stop the spin and L is zero, the argument collapses, and the thing simply falls over — which is the honest test of the explanation.</p>

<h3 id="r6">Statics</h3>
<p>Equilibrium needs <span class="mth">Σ<b>F</b> = 0</span> <em>and</em> <span class="mth">Σ<b>τ</b> = 0</span>, and the second condition holds about <em>any</em> point once the first does — so choosing the pivot at an unknown force eliminates it from the equation. That choice is the whole technique.</p>
`;

