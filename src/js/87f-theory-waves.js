const THEORY_WAVES = `
<div class="toc"><a href="#w1">SHM</a><a href="#w2">Energy</a><a href="#w3">Pendulums</a><a href="#w4">Waves</a>
<a href="#w5">Standing waves</a><a href="#w6">Sound</a><a href="#w7">Doppler</a></div>

<h3 id="w1">Simple harmonic motion</h3>
<p><span class="mth"><i>F</i> = −<i>kx</i></span> gives <span class="mth"><i>x</i>″ = −ω²<i>x</i></span> with <span class="mth">ω = √(<i>k</i>/<i>m</i>)</span>, whose solution is a sinusoid. The defining property is that <span class="mth"><i>a</i>/<i>x</i></span> is the constant <span class="mth">−ω²</span> at every instant — SHM stated as an equation rather than as a shape.</p>
<p>The period is <strong>independent of the amplitude</strong>. That is what made pendulum clocks possible, and it is special to a linear restoring force. Velocity leads displacement by a quarter cycle; acceleration is exactly antiphase with it.</p>
<p class="note">SHM is not one phenomenon among many — it is the <em>universal small-amplitude limit</em>, because every smooth potential is a parabola near its minimum. The effective spring constant is simply <span class="mth"><i>U</i>″(<i>x</i>₀)</span>, which the lab fits and uses to predict the period of an arbitrary well.</p>

${stThm('Every smooth potential is harmonic near a stable minimum', {
  hyp:'<span class="mth"><i>U</i></span> is twice continuously differentiable with a local minimum at <span class="mth"><i>x</i>₀</span> and <span class="mth"><i>U</i>″(<i>x</i>₀) &gt; 0</span>',
  then:'small oscillations about <span class="mth"><i>x</i>₀</span> are simple harmonic with',
  eq:'ω <span class="op">=</span> √( <i>U</i>″(<i>x</i>₀) / <i>m</i> )',
  proof:`<p>Expand <span class="mth"><i>U</i></span> in a Taylor series about <span class="mth"><i>x</i>₀</span>, writing <span class="mth">η = <i>x</i> − <i>x</i>₀</span> for the displacement:</p>
${stEq('<i>U</i>(<i>x</i>) <span class="op">=</span> <i>U</i>(<i>x</i>₀) <span class="op">+</span> <i>U</i>′(<i>x</i>₀)η <span class="op">+</span> ½<i>U</i>″(<i>x</i>₀)η² <span class="op">+</span> <i>O</i>(η³)')}
<p>Two of these terms are disposable. The constant <span class="mth"><i>U</i>(<i>x</i>₀)</span> shifts the zero of energy and never appears in a force. The linear term <strong>vanishes</strong>, because <span class="mth"><i>x</i>₀</span> is a critical point — that is the only place the hypothesis "minimum" is spent, and it is what makes the quadratic term leading rather than a correction.</p>
<p>The force is minus the gradient:</p>
${stEq('<i>F</i> <span class="op">=</span> <span class="op">−</span><span class="frac"><span class="nm"><i>dU</i></span><span class="den"><i>dx</i></span></span> <span class="op">=</span> <span class="op">−</span><i>U</i>″(<i>x</i>₀)η <span class="op">+</span> <i>O</i>(η²)')}
<p>which is Hooke's law with <span class="mth"><i>k</i> = <i>U</i>″(<i>x</i>₀)</span>. Newton's second law then gives <span class="mth"><i>m</i>η″ = −<i>k</i>η</span>, i.e. <span class="mth">η″ = −ω²η</span> with <span class="mth">ω = √(<i>k</i>/<i>m</i>)</span>, whose solutions are sinusoids.</p>
<p>Positivity of <span class="mth"><i>U</i>″</span> is what makes <span class="mth">ω</span> real. At a <em>maximum</em> the same expansion gives <span class="mth"><i>U</i>″ &lt; 0</span>, so <span class="mth">ω</span> is imaginary and the sinusoids become growing and decaying exponentials — the mathematics of an unstable equilibrium, arriving from the same two lines.</p>`,
  note:'This is why SHM is ubiquitous rather than a special case: molecular vibrations, a pendulum, an LC circuit, a crystal lattice and a field mode are all the same parabola seen at different scales. It also states its own limit — the O(η³) term is the anharmonicity that thermal expansion and the pendulum’s amplitude-dependent period come from.',
  see:'waves:0.2', seeLabel:'Every potential well is harmonic near its bottom' })}

<h3 id="w2">Energy in an oscillator</h3>
<p><span class="mth"><i>E</i> = ½<i>kA</i>²</span>, trading between kinetic and potential at <strong>twice</strong> the frequency of the motion. Because U goes as <span class="mth"><i>x</i>²</span>, only a quarter of the energy is potential at half the amplitude: the mass spends its time near the ends and its energy near the middle.</p>

<h3 id="w3">Pendulums, and where the approximation fails</h3>
<p>A pendulum is only <em>approximately</em> harmonic — the restoring torque goes as <span class="mth">sin θ</span>, not θ. The exact period involves a complete elliptic integral, evaluated here by quadrature: at 3° the approximation is good to one part in 10⁴, at 90° it is 18% wrong. Huygens knew this in 1673 and cut cycloidal cheeks into his clocks; a genuinely isochronous pendulum swings on a cycloid, not a circle.</p>

<h3 id="w4">Travelling waves</h3>
<div class="eqb"><span class="mth"><i>y</i> = <i>A</i> sin(<i>kx</i> − ω<i>t</i>) , &nbsp;&nbsp; <i>v</i> = <i>f</i>λ = ω/<i>k</i></span></div>
<p>A wave transports energy and momentum, <strong>not matter</strong>: each piece of the medium oscillates and returns, while the pattern travels. The speed is set by the medium — <span class="mth">√(<i>T</i>/μ)</span> on a string — and the frequency by the source, so changing medium changes the wavelength and never the frequency.</p>
<p><strong>Superposition</strong> — waves simply add — is the whole of interference, and it holds because the wave equation is linear.</p>

<h3 id="w5">Standing waves</h3>
<p>Two identical waves travelling opposite ways give <span class="mth">2<i>A</i> sin(<i>kx</i>)cos(ω<i>t</i>)</span>: the x and t dependence have <strong>separated</strong>, so the shape no longer moves and the nodes stay put forever.</p>
<p>Boundaries then quantise the modes. A string fixed at both ends fits whole half-wavelengths, giving <span class="mth"><i>f</i><sub><i>n</i></sub> = <i>nv</i>/2<i>L</i></span> — every harmonic. A pipe closed at one end fits an <em>odd</em> number of quarter-wavelengths, so only odd harmonics survive and the fundamental is an octave lower than an open pipe of the same length. That is the entire difference between a clarinet and a flute.</p>
<p class="note">This is quantisation arriving from a boundary condition rather than a postulate — precisely the argument that gives the particle in a box its energy ladder in the quantum wing.</p>

<h3 id="w6">Sound and intensity</h3>
<p>Intensity falls as <span class="mth">1/<i>r</i>²</span> from a point source, and the decibel scale is logarithmic: <span class="mth">β = 10 log₁₀(<i>I</i>/<i>I</i>₀)</span> with <span class="mth"><i>I</i>₀ = 10<sup>−12</sup></span> W/m². Ten times the intensity is ten more decibels; doubling the distance costs 6 dB.</p>
<p><strong>Beats</strong>: <span class="mth">sin <i>A</i> + sin <i>B</i> = 2 sin((<i>A</i>+<i>B</i>)/2) cos((<i>A</i>−<i>B</i>)/2)</span> — a fast tone at the mean frequency inside a slow envelope. The ear does not hear sign, so the audible beat rate is <span class="mth">|<i>f</i>₁−<i>f</i>₂|</span>, twice the envelope's own frequency. A trained ear resolves 0.2 Hz, which at 440 Hz is under one cent — far finer than anyone can judge a pitch in isolation.</p>

<h3 id="w7">The Doppler effect</h3>
<div class="eqb"><span class="mth"><i>f</i>′ = <i>f</i>₀ <span class="frac"><span class="nm"><i>v</i> ± <i>v</i><sub>o</sub></span><span class="den"><i>v</i> ∓ <i>v</i><sub>s</sub></span></span></span></div>
<p>Source motion and observer motion are <strong>not</strong> symmetric: a moving source compresses the wavelength, a moving observer meets the wavefronts more often. That asymmetry is the fingerprint of a medium — and light, having none, shifts only with the <em>relative</em> velocity, as the relativity wing derives from the invariant interval.</p>
<p>Past Mach 1 the wavefronts pile into a cone of half-angle <span class="mth">arcsin(1/<i>M</i>)</span>. There is no analogue for light, because nothing overtakes it.</p>
`;

