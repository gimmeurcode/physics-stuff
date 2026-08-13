const THEORY_OPTICS = `
<div class="toc"><a href="#o1">Fermat</a><a href="#o2">Refraction</a><a href="#o3">Lenses &amp; mirrors</a>
<a href="#o4">Interference</a><a href="#o5">Diffraction</a><a href="#o6">Polarisation</a></div>

<h3 id="o1">Fermat's principle</h3>
<p>Light takes the path of <strong>stationary optical length</strong>. Reflection and refraction both fall out of it in one line each, which is why they are not independent laws. The lab demonstrates this by scanning every possible crossing point at a boundary, keeping the least-time path, and then checking that Snell's law holds there — with Snell never used in the calculation.</p>
<p>The principle is not teleological. Its modern reading is Huygens' — every point of a wavefront is a new source — and its deepest one is Feynman's: light takes <em>every</em> path, and all but the stationary ones cancel by interference.</p>

<h3 id="o2">Refraction and total internal reflection</h3>
<div class="eqb"><span class="mth"><i>n</i>₁ sin θ₁ = <i>n</i>₂ sin θ₂ , &nbsp;&nbsp; <i>n</i> = <i>c</i>/<i>v</i></span></div>
<p>Light bends towards the normal entering a denser medium. If it would have to bend past 90° it cannot leave at all — <strong>total internal reflection</strong>, beyond the critical angle <span class="mth">arcsin(<i>n</i>₂/<i>n</i>₁)</span>. Diamond's is only 24°, so almost everything that enters bounces until it leaves through a facet; that is the entire optical basis of a cut gemstone, and of an optical fibre.</p>
${stThm("Snell's law, from Fermat's principle", {
  hyp:'light travels from a point in a medium of index <span class="mth"><i>n</i>₁</span> to a point in one of index <span class="mth"><i>n</i>₂</span>, crossing a plane boundary, and takes the path of stationary travel time',
  then:'',
  eq:'<i>n</i>₁ sin θ₁ <span class="op">=</span> <i>n</i>₂ sin θ₂',
  proof:`<p>Put the boundary on the <span class="mth"><i>x</i></span>-axis, the source at height <span class="mth"><i>a</i></span> above it and the destination at depth <span class="mth"><i>b</i></span> below, separated horizontally by <span class="mth"><i>d</i></span>. Let the ray cross at <span class="mth">(<i>x</i>, 0)</span>; the single unknown is <span class="mth"><i>x</i></span>.</p>
<p>Speed in a medium is <span class="mth"><i>c</i>/<i>n</i></span>, so the travel time is</p>
${stEq('<i>T</i>(<i>x</i>) <span class="op">=</span> <span class="frac"><span class="nm"><i>n</i>₁√(<i>a</i>² <span class="op">+</span> <i>x</i>²)</span><span class="den"><i>c</i></span></span> <span class="op">+</span> <span class="frac"><span class="nm"><i>n</i>₂√(<i>b</i>² <span class="op">+</span> (<i>d</i><span class="op">−</span><i>x</i>)²)</span><span class="den"><i>c</i></span></span>')}
<p>Fermat's principle says the actual path makes <span class="mth"><i>T</i></span> stationary, so set <span class="mth"><i>dT</i>/<i>dx</i> = 0</span>:</p>
${stEq('<span class="frac"><span class="nm"><i>n</i>₁<i>x</i></span><span class="den">√(<i>a</i>² <span class="op">+</span> <i>x</i>²)</span></span> <span class="op">−</span> <span class="frac"><span class="nm"><i>n</i>₂(<i>d</i><span class="op">−</span><i>x</i>)</span><span class="den">√(<i>b</i>² <span class="op">+</span> (<i>d</i><span class="op">−</span><i>x</i>)²)</span></span> <span class="op">=</span> 0')}
<p>Now read the geometry off the two fractions. In the first, <span class="mth"><i>x</i></span> is the side opposite the angle from the normal and <span class="mth">√(<i>a</i>²+<i>x</i>²)</span> is the hypotenuse — so the fraction <em>is</em> <span class="mth">sin θ₁</span>. The second is <span class="mth">sin θ₂</span> by the same reading. The condition is therefore <span class="mth"><i>n</i>₁ sin θ₁ = <i>n</i>₂ sin θ₂</span>.</p>
<p>A second derivative check shows the stationary point is a minimum here, so this is genuinely the least-time path — though Fermat's principle only ever demands stationarity, and for a concave mirror the true path can be a maximum.</p>`,
  note:'Reflection comes out of the same calculation with n₁ = n₂, giving θ₁ = θ₂. So reflection and refraction are not two laws but one principle read twice — which is what makes total internal reflection unsurprising: past the critical angle no real θ₂ satisfies the equation at all.',
  see:'optics:0.0', seeLabel:'Refraction, and where Snell comes from' })}

<p>Because n depends on wavelength (<strong>dispersion</strong>), different colours bend differently — which is the prism, the rainbow, and the chromatic aberration every lens designer fights.</p>

<h3 id="o3">Lenses and mirrors</h3>
<div class="eqb"><span class="mth"><span class="frac"><span class="nm">1</span><span class="den"><i>f</i></span></span> = <span class="frac"><span class="nm">1</span><span class="den"><i>d</i><sub>o</sub></span></span> + <span class="frac"><span class="nm">1</span><span class="den"><i>d</i><sub>i</sub></span></span> , &nbsp;&nbsp; <i>m</i> = −<span class="frac"><span class="nm"><i>d</i><sub>i</sub></span><span class="den"><i>d</i><sub>o</sub></span></span></span></div>
<p>One equation for both, with the sign convention doing all the work: f positive converging, <span class="mth"><i>d</i><sub>i</sub></span> positive real, m positive upright. Beyond 2f is a camera; between f and 2f a projector; inside f a magnifying glass — the same equation with the object in a different place.</p>
<p>The three principal rays are not physically special — every ray from an object point reaches the image point — they are simply the three whose paths you can draw without already knowing the answer.</p>

<h3 id="o4">Interference</h3>
<p>Two slits produce maxima where the path difference is a whole number of wavelengths, <span class="mth"><i>d</i> sin θ = <i>m</i>λ</span>, giving fringes spaced <span class="mth">λ<i>L</i>/<i>d</i></span>. But each slit also diffracts, so the two-slit pattern is <em>modulated</em> by the single-slit envelope — and an interference order sitting on an envelope zero is <strong>missing entirely</strong>. The lab shows that happening whenever <span class="mth"><i>d</i>/<i>a</i></span> is a whole number.</p>
<p>Young's 1801 experiment was the argument that settled the wave–particle question for a century. The quantum wing runs the same experiment one particle at a time, where it unsettles it again.</p>
<p><strong>Thin films</strong> add a subtlety: reflection off a denser medium flips the phase by half a wave. A soap film is <em>black</em> where it is thinnest, because the two reflections cancel — which was the first real evidence that the flip happens at all.</p>

<h3 id="o5">Diffraction and the limit it sets</h3>
<p>A single slit is not a point source: every part of it radiates, and those contributions cancel when <span class="mth"><i>a</i> sin θ = <i>m</i>λ</span>. Narrowing the slit makes the pattern <strong>wider</strong> — confinement in space costs spread in angle, always.</p>
<p>A grating is the double slit with N openings. The maxima stay put and each is sharpened by a factor of N, giving resolving power <span class="mth"><i>R</i> = <i>Nm</i></span> — which is why gratings and not prisms are used for spectroscopy.</p>
<p class="note">The <strong>Rayleigh criterion</strong> <span class="mth">θ = 1.22λ/<i>D</i></span> is why telescope apertures matter and why no microscope resolves much below half a wavelength. It is not an engineering limitation: it is the Fourier uncertainty relation of the Fourier wing, and <span class="mth">Δ<i>x</i>Δ<i>p</i> ≥ ħ/2</span> of the quantum wing, written for light.</p>

<h3 id="o6">Polarisation</h3>
<p><strong>Malus's law</strong>: a polariser passes <span class="mth"><i>I</i>₀cos²θ</span>. Unpolarised light loses exactly half on the first filter, whatever its orientation.</p>
<p>The three-filter puzzle is the one worth doing. Two crossed polarisers pass nothing; insert a third at 45° <em>between</em> them and <span class="mth"><i>I</i>₀/8</span> gets through. The middle filter is not unblocking anything — it is <strong>changing what is there</strong>, projecting the polarisation onto a new axis and discarding the rest, and two cos²45° steps beat one cos²90° step.</p>
<p>That is the classical shadow of a deeply quantum fact: measurement in a rotated basis destroys the previous answer. The Stern–Gerlach chain in the quantum wing is the identical experiment with spin in place of polarisation, and the identical cos² law. At <strong>Brewster's angle</strong> the reflected light is completely polarised, which is what polarising sunglasses exploit to kill glare.</p>
`;
