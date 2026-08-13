const THEORY_CIRCUIT = `
<div class="toc">
  <a href="#c0">What a circuit is</a><a href="#c1">The three passives</a>
  <a href="#c2">Kirchhoff's laws</a><a href="#c3">Nodal analysis</a>
  <a href="#c4">Transient analysis</a><a href="#c5">Phasors &amp; impedance</a>
  <a href="#c6">Resonance</a><a href="#c7">Power</a>
  <a href="#c8">Mutual inductance</a><a href="#c9">Nonlinear devices</a>
  <a href="#c10">Op amps</a><a href="#c10b">The op-amp catalogue</a>
  <a href="#c10c">Thévenin &amp; the two probes</a>
  <a href="#c11">The field underneath</a>
  <a href="#c12">What this simulator does</a>
</div>

<h3 id="c0">What a circuit is — and what it leaves out</h3>
<p>A circuit diagram is an approximation to Maxwell's equations, and a spectacularly good one. It applies whenever the assembly is small compared with the wavelength of everything happening in it — the <strong>lumped-element</strong> approximation. Under that assumption three simplifications become exact enough to build a whole discipline on: no charge accumulates anywhere except at capacitor plates, no magnetic flux links anything except inductors, and the propagation delay along a wire is negligible.</p>
<p>What survives is a graph. Components are edges, junctions are nodes, and the entire electromagnetic content is compressed into two numbers per edge — a voltage across it and a current through it — related by a <em>constitutive law</em>. The field itself disappears from the description. The last group of experiments in this wing puts it back, by solving for it explicitly.</p>
<p class="note">The approximation fails when the assembly is comparable with a wavelength: at that point you need transmission-line theory or the full field equations. A 60 Hz wavelength is 5000 km, so a house is safely lumped; a 5 GHz wavelength is 6 cm, so a phone's circuit board is emphatically not.</p>

<h3 id="c1">The three passives</h3>
<p>Every linear passive component is one of three relations between the voltage across it and the current through it:</p>
<div class="eqb"><span class="mth">
<i>v</i> = <i>R i</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>i</i> = <i>C</i> d<i>v</i>/d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>v</i> = <i>L</i> d<i>i</i>/d<i>t</i>
</span></div>
<p>The resistor is the only one of the three that is <strong>dissipative</strong>: it converts electrical energy into heat at a rate <span class="mth"><i>p</i> = <i>vi</i> = <i>i</i>²<i>R</i> = <i>v</i>²/<i>R</i></span>, and that energy does not come back. The other two are <strong>reservoirs</strong>, storing energy in a field and returning all of it:</p>
<div class="eqb"><span class="mth">
<i>U</i><sub>C</sub> = ½<i>Cv</i>² &nbsp;(electric field) &nbsp;&nbsp;·&nbsp;&nbsp;
<i>U</i><sub>L</sub> = ½<i>Li</i>² &nbsp;(magnetic field)
</span></div>
<p>Capacitor and inductor are exact <strong>duals</strong>: interchange <i>v</i> ↔ <i>i</i> and <i>C</i> ↔ <i>L</i> and each equation becomes the other. Every result about one therefore has a mirror result about the other, which is why the RC and RL experiments in this wing produce reflected curves from the same mathematics.</p>
<p>Two consequences follow immediately from the derivatives. A capacitor's voltage <strong>cannot change instantaneously</strong> — that would demand infinite current — and an inductor's current cannot either. Those are the initial conditions any transient analysis needs, and they are why a switched circuit has a transient at all rather than jumping straight to its new steady state.</p>

<h3 id="c2">Kirchhoff's two laws</h3>
<div class="eqb"><span class="mth">
∑ <i>i</i> = 0 at every node &nbsp;&nbsp;·&nbsp;&nbsp;
∑ <i>v</i> = 0 around every loop
</span></div>
<p><strong>KCL</strong> is charge conservation applied to a node too small to store any: current in equals current out. It is <span class="mth">∇<span class="op">·</span><i>J</i> = −∂ρ/∂<i>t</i></span> with the right-hand side set to zero.</p>
<p><strong>KVL</strong> is the statement that electric potential is single-valued, so a round trip returns to where it started. It is <span class="mth">∮<i>E</i><span class="op">·</span>d<i>l</i> = 0</span>, which is Faraday's law with no changing flux through the loop — and that qualification matters. Where flux <em>is</em> changing, KVL as usually stated is false, and the induced EMF <span class="mth">−dΦ<sub>B</sub>/d<i>t</i></span> has to be entered as a component. That component is exactly what an inductor is.</p>
${stThm("Kirchhoff's laws are Maxwell's equations in the lumped limit", {
  hyp:'a circuit small enough that propagation delay is negligible, with no charge accumulating at nodes and no changing magnetic flux threading any loop except inside components declared as inductors',
  then:'',
  eq:'Σ <i>i</i> <span class="op">=</span> 0 at every node &nbsp;&nbsp;·&nbsp;&nbsp; Σ <i>v</i> <span class="op">=</span> 0 around every loop',
  proof:`<p><em>KCL.</em> Charge conservation is <span class="mth">∇·<b>J</b> = −∂ρ/∂<i>t</i></span>. Integrate over a small volume enclosing one node and apply the divergence theorem:</p>
${stEq('∯ <b>J</b><span class="op">·</span>n̂ <i>dS</i> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>d</i><i>Q</i><sub>enc</sub></span><span class="den"><i>dt</i></span></span>')}
<p>The surface integral is the total current leaving through the wires — a finite sum, because current flows only in the wires. A node is idealised as storing no charge, so the right-hand side is zero and the sum of currents vanishes. Where charge <em>does</em> accumulate, the term is not zero, and that is precisely what a capacitor is.</p>
<p><em>KVL.</em> Faraday's law is <span class="mth">∮<b>E</b>·<i>d</i><b>l</b> = −<i>d</i>Φ<sub>B</sub>/<i>dt</i></span>. With no changing flux through the loop the right-hand side is zero, so the line integral of <span class="mth"><b>E</b></span> round any closed path vanishes — which is exactly the statement that potential is single-valued and a round trip returns to where it started.</p>
<p>The two idealisations are visible as the two discarded right-hand sides, and each names the component that restores it: a stored <span class="mth"><i>Q</i></span> is a capacitor, a threaded <span class="mth">Φ<sub>B</sub></span> is an inductor. Kirchhoff's laws are not approximations to be apologised for — they are Maxwell's equations with the storage terms moved out of the wires and into named parts.</p>`,
  note:'The limit fails when the circuit is comparable to a wavelength: at 1 GHz that is centimetres, which is why high-frequency design abandons lumped elements for transmission lines. This simulator writes KCL at every node and never writes KVL at all — using node potentials makes every loop sum zero by construction — then recomputes Σi independently from each part’s constitutive law as a check.',
  see:'circuit:0.3', seeLabel:"Kirchhoff's laws in a two-loop network" })}

<p class="note">This simulator writes KCL at every node and never writes KVL at all — working with node <em>potentials</em> makes every loop sum identically zero by construction. The readout panel nevertheless recomputes ∑i at every node from each component's own constitutive law, as an independent check that the solve is right.</p>

<h3 id="c3">Modified nodal analysis</h3>
<p>Take the node potentials <span class="mth"><i>v</i><sub>1</sub> … <i>v</i><sub>N</sub></span> relative to a ground node as the unknowns, and write KCL at each. For a resistor between nodes <i>a</i> and <i>b</i> the current leaving <i>a</i> is <span class="mth">(<i>v</i><sub>a</sub> − <i>v</i><sub>b</sub>)/<i>R</i></span>, so each resistor contributes a symmetric pattern of conductances,</p>
<div class="eqb"><span class="mth"><b>G</b><i>v</i> = <i>i</i><sub>src</sub></span></div>
<p>and a purely resistive circuit is one matrix solve. The trouble comes from components whose current cannot be written in terms of node voltages at all. An ideal voltage source <em>fixes</em> a voltage difference and lets its current be whatever the rest of the circuit demands; an inductor's current is a state variable in its own right. The <strong>modified</strong> in modified nodal analysis is the fix: promote those currents to unknowns of their own and add one branch equation for each.</p>
<div class="eqb"><span class="mth">
[ <b>G</b> &nbsp;<b>B</b> ; <b>C</b> &nbsp;<b>D</b> ] [ <i>v</i> ; <i>j</i> ] = [ <i>i</i><sub>src</sub> ; <i>e</i><sub>src</sub> ]
</span></div>
<p>The upper block is the conductance matrix, the lower block holds the branch constraints, and the off-diagonal blocks say how those branch currents enter the node equations. Voltage sources, inductors, transformer windings, ideal op-amp outputs and current-controlled sources all live in the lower block. The result is a single linear system, solved here by dense LU with partial pivoting — a circuit with a hundred unknowns is a small matrix.</p>
<p>When the matrix is <strong>singular</strong> the circuit is genuinely ill-posed, not merely awkward: a node connected to nothing has no equation, two ideal voltage sources in parallel disagree, and an ideal inductor across an ideal voltage source demands a current ramp that never converges. The simulator reports these rather than returning a number.</p>

<h3 id="c4">Transient analysis — turning calculus into algebra</h3>
<p>With capacitors and inductors present the system is no longer algebraic but a set of differential-algebraic equations. The standard route is to discretise time and replace each reactive component with a <strong>companion model</strong> — a conductance in parallel with a current source that remembers the previous step. Applying the trapezoidal rule to <span class="mth"><i>i</i> = <i>C</i> d<i>v</i>/d<i>t</i></span> over a step <i>h</i>:</p>
<div class="eqb"><span class="mth">
<i>i</i><sub>n+1</sub> = (2<i>C</i>/<i>h</i>)(<i>v</i><sub>n+1</sub> − <i>v</i><sub>n</sub>) − <i>i</i><sub>n</sub>
</span></div>
<p>which is Ohm's law with conductance <span class="mth"><i>G</i><sub>eq</sub> = 2<i>C</i>/<i>h</i></span> in parallel with a source carrying the history. The inductor gets the dual treatment. Every timestep is then an ordinary resistive solve, and the whole apparatus of nodal analysis applies unchanged.</p>
<p>The choice of rule matters. <strong>Backward Euler</strong> is unconditionally stable but numerically damps — an LC tank would slowly die even with no resistance in it, which would be a lie about the physics. The <strong>trapezoidal rule</strong> is second-order accurate and maps the imaginary axis exactly onto the unit circle, so a lossless oscillator neither grows nor decays. This simulator uses trapezoidal throughout, falling back to one backward-Euler step immediately after a discontinuity, where trapezoidal is prone to ring. The unit suite verifies the consequence directly: an LC tank left running for five full cycles conserves its energy to better than one part in a hundred.</p>

<h3 id="c5">Phasors and impedance</h3>
<p>In sinusoidal steady state at a single frequency, every voltage and current is <span class="mth"><i>A</i>cos(ω<i>t</i> + φ)</span> — two numbers. Encode them as one complex number, <span class="mth"><i>V̂</i> = <i>Ae</i><sup>jφ</sup></span>, with <span class="mth"><i>v</i>(<i>t</i>) = Re{<i>V̂e</i><sup>jω<i>t</i></sup>}</span>. Then <span class="mth">d/d<i>t</i> → jω</span>, and every differential relation collapses into an algebraic one:</p>
<div class="eqb"><span class="mth">
<i>Z</i><sub>R</sub> = <i>R</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>Z</i><sub>C</sub> = 1/(jω<i>C</i>) = −j/(ω<i>C</i>) &nbsp;&nbsp;·&nbsp;&nbsp;
<i>Z</i><sub>L</sub> = jω<i>L</i>
</span></div>
<p>Impedance <span class="mth"><i>Z</i> = <i>R</i> + j<i>X</i></span> generalises resistance: the real part dissipates, the imaginary part (the <strong>reactance</strong>) stores and returns. Series and parallel combinations work exactly as for resistors, and the whole of DC circuit theory transfers over with complex arithmetic keeping track of phase. The sign of <i>X</i> says which quantity leads: an inductor's current lags its voltage by 90°, a capacitor's leads by 90°, mnemonically <em>ELI the ICE man</em>.</p>
<p>The Bode instrument in this wing performs exactly this calculation — it replaces one source with a 1 V∠0° test signal, zeroes the others, and solves the complex matrix at each frequency, plotting <span class="mth">20 log<sub>10</sub>|<i>H</i>(jω)|</span> in decibels against <span class="mth">arg <i>H</i>(jω)</span> in degrees. Where nonlinear parts are present it first finds the DC operating point and linearises about it, which is what "small-signal" means.</p>

<h3 id="c6">Resonance</h3>
<p>A series RLC loop obeys, by KVL and the three constitutive laws,</p>
<div class="eqb"><span class="mth">
<i>L</i> d²<i>q</i>/d<i>t</i>² + <i>R</i> d<i>q</i>/d<i>t</i> + <i>q</i>/<i>C</i> = <i>v</i>(<i>t</i>)
</span></div>
<p>the damped driven harmonic oscillator, with <i>L</i> as mass, <i>R</i> as friction and 1/<i>C</i> as stiffness. Its parameters are</p>
<div class="eqb"><span class="mth">
ω<sub>0</sub> = 1/√(<i>LC</i>) &nbsp;&nbsp;·&nbsp;&nbsp;
ζ = (<i>R</i>/2)√(<i>C</i>/<i>L</i>) &nbsp;&nbsp;·&nbsp;&nbsp;
<i>Q</i> = 1/2ζ = ω<sub>0</sub><i>L</i>/<i>R</i> &nbsp;&nbsp;·&nbsp;&nbsp;
ω<sub>d</sub> = ω<sub>0</sub>√(1 − ζ²)
</span></div>
<p>with the three familiar regimes — underdamped and ringing for ζ &lt; 1, critically damped for ζ = 1, overdamped for ζ &gt; 1. In the frequency domain the same numbers describe a resonance peak of width <span class="mth">Δω = ω<sub>0</sub>/<i>Q</i></span>. That is not a coincidence: a sharp filter and a long ringer are the same physical fact seen through a Fourier transform.</p>
<p>At <span class="mth">ω = ω<sub>0</sub></span> the reactances cancel exactly, <span class="mth">ω<i>L</i> = 1/ω<i>C</i></span>, and a series circuit's impedance collapses to the bare resistance <i>R</i>. A parallel tank does the dual thing: its admittance is minimised, so its impedance is maximised, and there <span class="mth"><i>Q</i> = <i>R</i>√(<i>C</i>/<i>L</i>)</span> — larger resistance now means <em>higher</em> Q.</p>

<h3 id="c7">Power, real and reactive</h3>
<p>Instantaneous power is always <span class="mth"><i>p</i> = <i>vi</i></span>. For <span class="mth"><i>v</i> = <i>V</i>cos ω<i>t</i></span> and <span class="mth"><i>i</i> = <i>I</i>cos(ω<i>t</i> − φ)</span>:</p>
<div class="eqb"><span class="mth">
<i>p</i>(<i>t</i>) = ½<i>VI</i>[cos φ + cos(2ω<i>t</i> − φ)]
</span></div>
<p>The first term is constant — the <strong>real power</strong> <span class="mth"><i>P</i> = <i>V</i><sub>rms</sub><i>I</i><sub>rms</sub> cos φ</span>, genuinely converted to heat or work. The second oscillates at twice the supply frequency and averages to nothing: energy borrowed by the reactive components each quarter cycle and handed straight back. Its amplitude is the <strong>reactive power</strong> <i>Q</i>, and the vector sum <span class="mth"><i>S</i> = <i>P</i> + j<i>Q</i></span> is the apparent power. The ratio <span class="mth">cos φ</span> is the <strong>power factor</strong>.</p>
<p>RMS is defined so that this bookkeeping works: <span class="mth"><i>V</i><sub>rms</sub> = √(⟨<i>v</i>²⟩)</span> is the DC voltage that would dissipate the same power, which for a sinusoid of amplitude <i>V</i><sub>0</sub> is <span class="mth"><i>V</i><sub>0</sub>/√2</span>.</p>
<p><strong>Tellegen's theorem</strong> guarantees that <span class="mth">∑<sub>branches</sub> <i>v</i><sub>b</sub><i>i</i><sub>b</sub> = 0</span> for <em>any</em> network whose voltages satisfy KVL and whose currents satisfy KCL — remarkably, without any reference to what the components are. The power panel checks this residual live; it is zero to machine precision whenever the solve has converged.</p>

${stThm("Tellegen's theorem", {
  hyp:'any network of <i>b</i> branches on a fixed graph, with branch voltages <b>v</b> obeying KVL and branch currents <b>i</b> obeying KCL on that graph',
  then:'the branch powers sum to zero,',
  eq:'∑<sub><i>b</i></sub> <i>v</i><sub><i>b</i></sub> <i>i</i><sub><i>b</i></sub> <span class="op">=</span> 0',
  proof:`<p>KVL says every branch voltage is a difference of two node potentials: if branch <span class="mth"><i>b</i></span> runs from node <span class="mth"><i>m</i></span> to node <span class="mth"><i>n</i></span> then <span class="mth"><i>v</i><sub><i>b</i></sub> = e<sub><i>m</i></sub> − e<sub><i>n</i></sub></span>. Substitute and regroup the sum by node rather than by branch:</p>
${stEq('∑<sub><i>b</i></sub> <i>v</i><sub><i>b</i></sub><i>i</i><sub><i>b</i></sub> <span class="op">=</span> ∑<sub><i>b</i></sub> (e<sub><i>m</i></sub> <span class="op">−</span> e<sub><i>n</i></sub>)<i>i</i><sub><i>b</i></sub> <span class="op">=</span> ∑<sub>nodes <i>k</i></sub> e<sub><i>k</i></sub> ( ∑<sub>branches at <i>k</i></sub> <span class="op">±</span><i>i</i><sub><i>b</i></sub> )')}
<p>Each branch contributed <span class="mth">+<i>i</i><sub><i>b</i></sub></span> to one node's inner bracket and <span class="mth">−<i>i</i><sub><i>b</i></sub></span> to the other, so the inner bracket at node <span class="mth"><i>k</i></span> is precisely the net current leaving <span class="mth"><i>k</i></span>. KCL says that is zero at every node. Every term of the outer sum therefore vanishes, and with it the total.</p>
<p>Notice what the argument never used: no constitutive law, no linearity, no time-invariance, not even that <b>v</b> and <b>i</b> belong to the <em>same</em> circuit — only that both satisfy the two Kirchhoff laws on the same graph. It is a statement about the topology, and it is why the same conservation holds for a network of diodes and op amps as for one of resistors.</p>`,
  note:'This is what makes the residual an honest check. The solver computes node voltages, and the branch currents are then recovered from each component\'s own constitutive law — so the sum being zero is a test of the solve rather than an identity built into it. A non-zero residual means Newton has not converged, not that Tellegen has failed.',
  see:'circuit:0.4', seeLabel:"Kirchhoff's laws in a two-loop network" })}

<h3 id="c8">Mutual inductance and transformers</h3>
<p>Two coils sharing flux obey a coupled pair of relations:</p>
<div class="eqb"><span class="mth">
<i>v</i><sub>1</sub> = <i>L</i><sub>1</sub> d<i>i</i><sub>1</sub>/d<i>t</i> + <i>M</i> d<i>i</i><sub>2</sub>/d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>v</i><sub>2</sub> = <i>M</i> d<i>i</i><sub>1</sub>/d<i>t</i> + <i>L</i><sub>2</sub> d<i>i</i><sub>2</sub>/d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>M</i> = <i>k</i>√(<i>L</i><sub>1</sub><i>L</i><sub>2</sub>)
</span></div>
<p>This is precisely why inductors need a branch-current unknown in the matrix: one branch's equation mentions another branch's current, which node voltages alone cannot express. The coupling coefficient satisfies <span class="mth">|<i>k</i>| ≤ 1</span> necessarily — the stored energy <span class="mth"><i>U</i> = ½<i>L</i><sub>1</sub><i>i</i><sub>1</sub>² + ½<i>L</i><sub>2</sub><i>i</i><sub>2</sub>² + <i>Mi</i><sub>1</sub><i>i</i><sub>2</sub></span> must be non-negative for every pair of currents, and that quadratic form is positive semi-definite exactly when <span class="mth"><i>M</i>² ≤ <i>L</i><sub>1</sub><i>L</i><sub>2</sub></span>.</p>
<p>Since inductance scales as the square of the turns, <span class="mth">√(<i>L</i><sub>2</sub>/<i>L</i><sub>1</sub>) = <i>N</i><sub>2</sub>/<i>N</i><sub>1</sub></span>. In the tight-coupling limit the pair reduces to the ideal transformer, <span class="mth"><i>v</i><sub>1</sub>/<i>v</i><sub>2</sub> = <i>N</i><sub>1</sub>/<i>N</i><sub>2</sub></span> and <span class="mth"><i>i</i><sub>2</sub>/<i>i</i><sub>1</sub> = −<i>N</i><sub>1</sub>/<i>N</i><sub>2</sub></span>, so <span class="mth"><i>v</i><sub>1</sub><i>i</i><sub>1</sub> + <i>v</i><sub>2</sub><i>i</i><sub>2</sub> = 0</span>: a transformer conserves power exactly. It is a lever for electricity, and it is the reason alternating current won the current wars — transformation of voltage is trivial for AC and was, at the time, essentially impossible for DC.</p>

<h3 id="c9">Nonlinear devices and Newton's method</h3>
<p>A junction diode is not linear at all:</p>
<div class="eqb"><span class="mth">
<i>I</i> = <i>I</i><sub>s</sub>(<i>e</i><sup><i>v</i>/<i>nV</i><sub>T</sub></sup> − 1) &nbsp;&nbsp;·&nbsp;&nbsp;
<i>V</i><sub>T</sub> = <i>kT</i>/<i>q</i> ≈ 25.85 mV at 300 K
</span></div>
<p>so the matrix equation becomes <span class="mth"><b>f</b>(<i>x</i>) = 0</span> and must be iterated. Each Newton step replaces the device with its tangent at the present guess — a conductance <span class="mth"><i>g</i><sub>d</sub> = d<i>I</i>/d<i>v</i></span> in parallel with a current source — solves the resulting linear circuit, and repeats until nothing moves. Two standard safeguards make it converge in practice: a <strong>junction limiter</strong> that caps how far the diode voltage may move in one iteration, since an unbounded exponential overflows immediately, and <strong>Gmin stepping</strong>, which solves a deliberately leaky version of the circuit first and walks the leakage away using each solution as the next starting guess.</p>
<p>Note that there is no "turn-on voltage" in the Shockley equation. The familiar 0.6 V is simply where the exponential crosses whatever current you happen to care about, and it moves by about 60 mV per decade of current — a fact the DC sweep experiment shows directly.</p>

<h3 id="c10">Operational amplifiers</h3>
<p>Idealised, an op amp is a <strong>nullor</strong>: its input terminals draw no current and are forced to the same potential, while its output supplies whatever current that requires. Those two statements plus negative feedback derive every classical configuration in a line or two. For the inverting amplifier, the − input sits at a <em>virtual earth</em>, so the input current <span class="mth"><i>v</i><sub>in</sub>/<i>R</i><sub>in</sub></span> must continue through the feedback element, giving</p>
<div class="eqb"><span class="mth">
<i>v</i><sub>out</sub> = −<i>v</i><sub>in</sub><i>R</i><sub>f</sub>/<i>R</i><sub>in</sub> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>v</i><sub>out</sub> = −(1/<i>RC</i>)∫<i>v</i><sub>in</sub> d<i>t</i> &nbsp;(feedback capacitor)
</span></div>
<p>The gain depends only on a ratio of passive components — not on the amplifier's own gain, its temperature or its manufacturer. That insensitivity is what feedback buys, and it is the single most important idea in analogue electronics.</p>
<p>Real op amps depart from the ideal in ways this simulator models rather than assumes away. A dominant pole gives <span class="mth"><i>A</i>(jω) = <i>A</i><sub>0</sub>/(1 + jω/ω<sub>p</sub>)</span>, so closed-loop gain and bandwidth trade off at fixed product, <span class="mth"><i>A</i><sub>CL</sub> · <i>f</i><sub>BW</sub> = GBW</span>. A finite <strong>slew rate</strong> caps how fast the output can move, turning a hard-driven sine into a triangle. The output <strong>saturates</strong> at the supply rails, which is what turns an op amp into a comparator when the feedback is removed — and into a Schmitt trigger when the feedback is made positive. A finite output resistance means the rail voltage appears at a load through a divider.</p>
<p class="note">Internally the model is a transconductance stage <span class="mth"><i>I</i> = <i>I</i><sub>lim</sub>tanh(<i>g</i><sub>m</sub><i>v</i><sub>d</sub>/<i>I</i><sub>lim</sub>)</span> driving an RC pole and then a limited output buffer. The saturating tanh does double duty: its slope at the origin is the open-loop gain, and its ceiling divided by the pole capacitance <em>is</em> the slew rate. One nonlinearity, both real behaviours.</p>

<h3 id="c10b">The op-amp catalogue — all of it from two rules</h3>
<p>Every configuration in this wing follows from the same two statements: the inputs draw no current, and feedback drives them to the same potential. Everything else is bookkeeping.</p>
<div class="eqb"><span class="mth">
follower &nbsp; <i>v</i><sub>out</sub> = <i>v</i><sub>in</sub> &nbsp;&nbsp;·&nbsp;&nbsp;
inverting &nbsp; −<i>R</i><sub>f</sub>/<i>R</i><sub>in</sub> &nbsp;&nbsp;·&nbsp;&nbsp;
non-inverting &nbsp; 1 + <i>R</i><sub>f</sub>/<i>R</i><sub>g</sub>
</span></div>
<div class="eqb"><span class="mth">
summing &nbsp; <i>v</i><sub>out</sub> = −<i>R</i><sub>f</sub>(<i>v</i><sub>1</sub>/<i>R</i><sub>1</sub> + <i>v</i><sub>2</sub>/<i>R</i><sub>2</sub>) &nbsp;&nbsp;·&nbsp;&nbsp;
difference &nbsp; <i>v</i><sub>out</sub> = (<i>R</i><sub>f</sub>/<i>R</i><sub>1</sub>)(<i>v</i><sub>2</sub> − <i>v</i><sub>1</sub>)
</span></div>
<div class="eqb"><span class="mth">
integrator &nbsp; −(1/<i>RC</i>)∫<i>v</i><sub>in</sub> d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
differentiator &nbsp; −<i>RC</i> d<i>v</i><sub>in</sub>/d<i>t</i>
</span></div>
<p>The <strong>summing</strong> amplifier works because the inverting input is a <em>virtual earth</em>: each source drives its own current into a node that never moves, so the inputs cannot interact. The <strong>difference</strong> amplifier follows by superposition — kill one source and it is an inverting amplifier, kill the other and it is a divider feeding a non-inverting one — and the two halves cancel the common part only when <span class="mth"><i>R</i><sub>1</sub> = <i>R</i><sub>2</sub></span> and <span class="mth"><i>R</i><sub>3</sub> = <i>R</i><sub>f</sub></span>. That matching requirement is why <strong>common-mode rejection</strong> is a resistor-tolerance problem rather than an op-amp problem.</p>
<p>Take the feedback away and the same device is a <strong>comparator</strong>, pinned to one rail or the other. Make the feedback <em>positive</em> and it is a <strong>Schmitt trigger</strong>, with two thresholds <span class="mth">±<i>v</i><sub>sat</sub><i>R</i><sub>1</sub>/(<i>R</i><sub>1</sub>+<i>R</i><sub>f</sub>)</span> and therefore immunity to noise smaller than the gap. Add an RC to that and there is no stable state at all: the result is a <strong>relaxation oscillator</strong> of period <span class="mth"><i>T</i> = 2<i>RC</i> ln(1 + 2<i>R</i><sub>1</sub>/<i>R</i><sub>f</sub>)</span>. Put a diode <em>inside</em> the loop and its forward drop is divided by the loop gain, giving a <strong>precision rectifier</strong> that works on millivolts.</p>

<h3 id="c10c">Thévenin, Norton, and what two probes can tell you</h3>
<p>Thévenin's theorem is the most useful statement in circuit theory: <strong>any</strong> linear network, however large, seen from two terminals, is indistinguishable from a single source behind a single impedance.</p>
<div class="eqb"><span class="mth">
<i>V</i><sub>th</sub> = open-circuit voltage &nbsp;&nbsp;·&nbsp;&nbsp;
<i>Z</i><sub>th</sub> = impedance with every independent source zeroed &nbsp;&nbsp;·&nbsp;&nbsp;
<i>I</i><sub>N</sub> = <i>V</i><sub>th</sub>/<i>Z</i><sub>th</sub>
</span></div>
<p>"Zeroing" a source means replacing a voltage source by a short and a current source by an open, because that is what a source with no output <em>is</em>. Dependent sources stay, since they are part of the network's behaviour rather than its excitation.</p>
<p>The two-probe tool computes this directly, and by the same method you would use on a bench: switch the sources off, drive a known 1 A between the two probe points, and read the voltage that appears. That voltage <em>is</em> the driving-point impedance, and it works at DC or at any frequency, on any circuit you have built. From it follow the short-circuit current and the <strong>maximum power transfer</strong> result — a load draws the most power when it matches the source, <span class="mth"><i>P</i><sub>max</sub> = <i>V</i><sub>th</sub>²/4<i>R</i><sub>th</sub></span> — which is why impedance matching matters and why a transformer, multiplying impedance by <span class="mth"><i>N</i>²</span>, is the classical way to achieve it.</p>
<p class="note">For a circuit containing diodes or op amps the equivalent is the <em>small-signal</em> one about the present operating point. That is not a limitation of the method but the definition of Thévenin equivalence for something that is not linear: the network is replaced by the linear one that matches its slope where it is currently sitting.</p>

<h3 id="c11">The field underneath</h3>
<p>Circuit theory summarises the electromagnetic field into two numbers per component, and in doing so hides it. The last group of experiments recovers it. Given the solved node potentials, every conductor on the board is a surface at a known potential, and the space between them satisfies Laplace's equation:</p>
<div class="eqb"><span class="mth">
∇²<i>V</i> = 0 &nbsp;&nbsp;·&nbsp;&nbsp; <i>E</i> = −∇<i>V</i>
</span></div>
<p>relaxed numerically by successive over-relaxation with the conductors as Dirichlet boundary conditions. What it shows is worth dwelling on. The wires are equipotentials, because a good conductor cannot sustain a field along itself — any residual field would keep accelerating charge until it was cancelled. Almost the whole potential drop appears across the resistive elements, which is exactly why those and not the wires dissipate power. Inside a uniform resistor the potential falls linearly, which is what constant resistivity means. And the field does not stop at the components: surface charge distributes itself along every wire in precisely the pattern needed to push the current where it goes — the mechanism that "current follows the wire" is shorthand for.</p>
<p>At a capacitor the solution shows the field bulging beyond the plate edges. That <strong>fringing</strong> is why a real capacitor's value slightly exceeds the parallel-plate estimate <span class="mth"><i>C</i> = ε<sub>0</sub><i>A</i>/<i>d</i></span>, and it is not put in by hand — it falls out of solving the boundary-value problem honestly.</p>

<h3 id="c12">What this simulator actually does</h3>
<ul>
  <li><strong>The netlist comes from the picture.</strong> Nodes are extracted geometrically: pins and wire ends that coincide are the same node, an end landing on the middle of a wire makes a T junction, and wires that merely cross are not connected — exactly as on paper. What you see wired is what is solved.</li>
  <li><strong>Modified nodal analysis</strong> in SI units, dense LU with partial pivoting, with extra unknowns for inductors, voltage sources, transformer windings, current-controlled sources and op-amp outputs.</li>
  <li><strong>Trapezoidal companion models</strong> for the reactive parts, with a backward-Euler step after each discontinuity, and an automatically chosen timestep that resolves the fastest RC, L/R and LC timescale present.</li>
  <li><strong>Newton–Raphson</strong> with junction limiting and Gmin stepping for diodes and for the op amp's saturating input stage.</li>
  <li><strong>Complex-phasor AC analysis</strong> linearised about the DC operating point, swept logarithmically for Bode plots and used directly for impedance and phasor diagrams.</li>
  <li><strong>Thirteen source waveforms</strong> — DC, sine, square with adjustable duty, triangle, sawtooth, step, pulse, decaying exponential, damped sine, chirp, AM, band-limited noise — plus any function of <i>t</i> you care to type, compiled by the same parser the field wings use.</li>
  <li><strong>Every number is checked.</strong> Branch currents are recomputed from each component's own constitutive law and summed at every node, so the reported KCL residual is an independent test of the solve rather than a restatement of it. Tellegen's theorem is evaluated the same way. The unit suite pins the results against closed forms: RC and RL exponentials, LC energy conservation, the −3 dB point and −45° phase of an RC corner, series resonance where the reactance vanishes and Z = R exactly, transformer turns ratios, mutual coupling, op-amp gains and the gain–bandwidth product, the Shockley equation solved independently by bisection, and the Laplace solution between parallel plates.</li>
</ul>
`;

