const THEORY_FOURIER = `
<div class="toc">
  <a href="#f0">The claim</a><a href="#f1">Orthogonality</a>
  <a href="#f2">The series</a><a href="#f3">Gibbs</a>
  <a href="#f4">The transform</a><a href="#f5">Pairs &amp; duality</a>
  <a href="#f6">Uncertainty</a><a href="#f7">Discrete vs continuous</a>
  <a href="#f8">Sampling &amp; aliasing</a><a href="#f9">Leakage &amp; windows</a>
  <a href="#f10">The FFT</a><a href="#f11">Convolution</a>
  <a href="#f12">Where it connects</a>
</div>

<h3 id="f0">The claim</h3>
<p>Fourier's assertion, made in 1807 and disbelieved by most of the mathematicians who read it, is that an arbitrary function can be written as a sum of sines and cosines. Not approximated by — <em>equal to</em>. Lagrange thought it was wrong. It took a century to state the precise conditions under which it is right, and the effort of doing so produced measure theory, the modern definition of a function, and a good deal of functional analysis along the way.</p>
<div class="eqb"><span class="mth">
periodic &nbsp; <i>x</i>(<i>t</i>) = <i>a</i><sub>0</sub> + Σ [<i>a<sub>k</sub></i> cos(2π<i>kt</i>/<i>T</i>) + <i>b<sub>k</sub></i> sin(2π<i>kt</i>/<i>T</i>)]
</span></div>
<div class="eqb"><span class="mth">
general &nbsp; <i>X</i>(<i>f</i>) = ∫ <i>x</i>(<i>t</i>) <i>e</i><sup>−2π<i>ift</i></sup> d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>x</i>(<i>t</i>) = ∫ <i>X</i>(<i>f</i>) <i>e</i><sup>+2π<i>ift</i></sup> d<i>f</i>
</span></div>
<p>The two directions differ only in the sign of the exponent. That symmetry is not cosmetic — it is why the same routine, with one flag flipped, serves for both, and why every theorem about the transform has a dual obtained by swapping the domains.</p>

<h3 id="f1">Why it works: orthogonality</h3>
<p>The mechanism is a single integral. Over a whole number of periods,</p>
<div class="eqb"><span class="mth">
∫<sub>0</sub><sup>1</sup> sin(2π<i>mt</i>) sin(2π<i>nt</i>) d<i>t</i> = 0 &nbsp; unless <i>m</i> = <i>n</i>
</span></div>
<p>Sines at different whole frequencies are <strong>orthogonal</strong>: multiply two of them together and the product spends as much time positive as negative, so it averages to nothing. Only a sine multiplied by <em>itself</em> gives a product that is positive throughout and averages to something.</p>
<p>So to find how much of frequency k a mystery function contains, multiply by sin(2πkt) and average. Every other component annihilates itself and the k-th survives. That is exactly what taking a dot product with a basis vector does in ordinary geometry, and it is the right way to think about it: functions form a vector space, the sines are an orthogonal basis for it, and the Fourier coefficients are the components of a function along those axes. The transform is a change of basis, nothing more exotic.</p>
${stThm('Orthogonality of the harmonics', {
  hyp:'<span class="mth"><i>m</i>, <i>n</i></span> are positive integers',
  then:'',
  eq:'∫₀<sup>1</sup> sin(2π<i>mt</i>) sin(2π<i>nt</i>) <i>dt</i> <span class="op">=</span> ½ if <i>m</i> <span class="op">=</span> <i>n</i>, &nbsp; 0 otherwise',
  proof:`<p>Use the product-to-sum identity, itself a consequence of the angle-addition formulas:</p>
${stEq('sin <i>A</i> sin <i>B</i> <span class="op">=</span> ½[ cos(<i>A</i><span class="op">−</span><i>B</i>) <span class="op">−</span> cos(<i>A</i><span class="op">+</span><i>B</i>) ]')}
<p>With <span class="mth"><i>A</i> = 2π<i>mt</i></span> and <span class="mth"><i>B</i> = 2π<i>nt</i></span> the integral becomes</p>
${stEq('½∫₀<sup>1</sup> cos(2π(<i>m</i><span class="op">−</span><i>n</i>)<i>t</i>) <i>dt</i> <span class="op">−</span> ½∫₀<sup>1</sup> cos(2π(<i>m</i><span class="op">+</span><i>n</i>)<i>t</i>) <i>dt</i>')}
<p>A cosine of a nonzero integer multiple of <span class="mth">2π<i>t</i></span> integrates to zero over one full period — it completes a whole number of cycles and the positive and negative halves cancel exactly. Since <span class="mth"><i>m</i>+<i>n</i> ≠ 0</span>, the second integral is always zero.</p>
<p>The first depends on whether <span class="mth"><i>m</i> = <i>n</i></span>. If <span class="mth"><i>m</i> ≠ <i>n</i></span> the frequency is a nonzero integer and it vanishes too, giving 0. If <span class="mth"><i>m</i> = <i>n</i></span> the integrand degenerates to <span class="mth">cos 0 = 1</span>, and <span class="mth">½∫₀¹ 1 <i>dt</i> = ½</span>.</p>
<p>Everything rests on one fact — a whole number of cycles averages to nothing — which is also why the harmonics must be at integer multiples of the fundamental. Fractional frequencies do not complete a whole number of cycles on the interval and are not orthogonal.</p>`,
  note:'This makes function space a geometry: the sines are an orthogonal basis, a Fourier coefficient is a dot product with a basis vector, and the transform is a change of basis rather than anything more exotic. The winding stage shows the cancellation happening rather than asserting it.',
  see:'fourier:1.0', seeLabel:'The winding machine' })}

<p class="note">The winding stage in this wing shows the cancellation happening rather than asserting it. Wrapping the signal round a circle at f turns per second is multiplication by e^(−2πift); the centre of mass of the wound shape is the integral. At the wrong frequency the humps land on opposite sides and cancel; at the right one they pile up together.</p>

<h3 id="f2">The series, and what the coefficients tell you</h3>
<div class="eqb"><span class="mth">
<i>b<sub>k</sub></i> = 2∫<sub>0</sub><sup>1</sup> <i>x</i>(<i>t</i>) sin(2π<i>kt</i>) d<i>t</i> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>a<sub>k</sub></i> = 2∫<sub>0</sub><sup>1</sup> <i>x</i>(<i>t</i>) cos(2π<i>kt</i>) d<i>t</i>
</span></div>
<p>Symmetry does a great deal of work before any integration. An <strong>odd</strong> function needs sines only; an <strong>even</strong> function needs cosines only; a function with half-wave symmetry has no even harmonics at all. The square, sawtooth and triangle in this wing are all odd, which is why every a<sub>k</sub> is zero and the recipe is a list of sine amplitudes.</p>
<p>How fast the coefficients decay is a statement about smoothness:</p>
<ul>
  <li><strong>1/k</strong> — the function has a jump (square, sawtooth).</li>
  <li><strong>1/k²</strong> — continuous, but with a kink in its slope (triangle).</li>
  <li><strong>faster than any power</strong> — infinitely differentiable (a Gaussian).</li>
</ul>
<p>The rule generalises: each additional derivative that exists and stays bounded buys another factor of 1/k. This is why smooth signals compress well and sharp ones do not.</p>

<h3 id="f3">Gibbs: convergence that is not uniform</h3>
<p>Near a jump, the partial sums overshoot — and adding terms does not reduce the overshoot. It converges to</p>
<div class="eqb"><span class="mth">(2/π)·Si(π) = 1.178979744… &nbsp; i.e. 8.95% of the jump</span></div>
<p>The resolution of the apparent paradox is that the series converges <em>pointwise</em> but not <em>uniformly</em>. At any fixed point away from the discontinuity the partial sums do converge to the right value. But the location of the worst overshoot moves toward the jump as terms are added, so it is never evaluated at the same place twice, and the supremum of the error never falls. The overshoot does not shrink; it narrows.</p>
<p>This is not a defect of the method to be engineered away. It is what representing a discontinuity with continuous functions costs, and it reappears wherever a sharp cutoff is imposed in one domain: ringing round the edges in JPEG images, pre-echo in audio codecs, and the ripples on either side of an ideal filter's impulse response.</p>

<h3 id="f4">From series to transform</h3>
<p>A Fourier series describes a periodic function with a discrete set of coefficients at multiples of 1/T. Let the period T grow without bound: the spacing 1/T between harmonics shrinks, the discrete comb becomes a continuum, and the sum becomes an integral. That limit is the Fourier transform, and it handles functions that never repeat.</p>
<p>The complex form is worth adopting early, because it halves the bookkeeping. Euler's relation <span class="mth"><i>e</i><sup>i θ</sup> = cos θ + i sin θ</span> lets one complex exponential carry both the sine and the cosine, and a single complex coefficient carry both an amplitude and a phase. A real signal then has a spectrum with <strong>conjugate symmetry</strong>, X(−f) = X(f)*, so the negative frequencies contain nothing new — which is why one-sided amplitude spectra double every bin except DC, and why "negative frequency" is bookkeeping rather than physics.</p>

<h3 id="f5">Pairs worth memorising</h3>
<div class="eqb"><span class="mth">
<i>e</i><sup>−<i>at</i>²</sup> ⟷ √(π/<i>a</i>)·<i>e</i><sup>−π²<i>f</i>²/<i>a</i></sup> &nbsp;&nbsp;·&nbsp;&nbsp;
rect(<i>t</i>/<i>T</i>) ⟷ <i>T</i>·sinc(<i>fT</i>) &nbsp;&nbsp;·&nbsp;&nbsp;
<i>e</i><sup>−<i>a</i>|<i>t</i>|</sup> ⟷ 2<i>a</i>/(<i>a</i>²+4π²<i>f</i>²)
</span></div>
<p>A Gaussian transforms to a Gaussian — it is the fixed point of the transform. A rectangle transforms to a sinc, whose tails fall only as 1/f and never quite vanish: perfect compactness in one domain buys endless spread in the other. A two-sided exponential gives a Lorentzian, which is the shape of a spectral line and, not coincidentally, of a resonance curve in the circuits wing.</p>
<p>Each pair also carries its dual, obtained by swapping the domains: since a rectangle in time gives a sinc in frequency, a sinc in time gives a rectangle in frequency — an ideal brick-wall filter, which is precisely why an ideal filter has an impulse response that rings forever and cannot be built.</p>

<h3 id="f6">Uncertainty</h3>
<div class="eqb"><span class="mth">Δ<i>t</i> · Δ<i>f</i> ≥ 1/4π</span></div>
<p>No signal can be arbitrarily concentrated in both domains at once, and the bound is achieved only by a Gaussian. This is a theorem about Fourier transforms — it holds for sound, for radio, for water waves, for anything with a transform at all. A brief note has no definite pitch; a short radar pulse needs a wide band; a fast scope needs a fast front end.</p>
<p class="note">Multiply through by ħ and identify momentum with spatial frequency, <strong>p = ħk</strong>, and the same inequality reads <strong>Δx·Δp ≥ ħ/2</strong>. The quantum uncertainty principle is this mathematical fact plus one physical identification. It is not a statement about clumsy measurement, and the quantum wing's spreading wave packet is this theorem in different units.</p>

<h3 id="f7">Discrete and continuous</h3>
<div class="eqb"><span class="mth">
<i>X</i>[<i>k</i>] = Σ<sub><i>n</i>=0</sub><sup><i>N</i>−1</sup> <i>x</i>[<i>n</i>] <i>e</i><sup>−2π<i>ikn</i>/<i>N</i></sup> &nbsp;&nbsp;·&nbsp;&nbsp;
<i>x</i>[<i>n</i>] = (1/<i>N</i>) Σ<sub><i>k</i></sub> <i>X</i>[<i>k</i>] <i>e</i><sup>+2π<i>ikn</i>/<i>N</i></sup>
</span></div>
<p>The DFT takes N numbers to N numbers. It is a genuine change of basis on a finite-dimensional space, exactly invertible, with no convergence questions to worry about. What it is <em>not</em> is the continuous transform; it is the continuous transform of a signal that has been sampled and truncated, and each of those two operations leaves a mark.</p>

<h3 id="f8">Sampling and aliasing</h3>
<p>Sampling in time makes the spectrum <strong>periodic</strong> with period f<sub>s</sub>. Any component above f<sub>s</sub>/2 — the <strong>Nyquist frequency</strong> — is indistinguishable from one below it, because both produce identical samples. This is not a resolution that can be recovered by processing afterwards; the information is genuinely absent.</p>
<div class="eqb"><span class="mth">Nyquist–Shannon: if <i>X</i>(<i>f</i>) = 0 for |<i>f</i>| ≥ <i>f<sub>s</sub></i>/2, the samples determine <i>x</i>(<i>t</i>) exactly</span></div>
<p>The positive statement is remarkable and easy to overlook: under that condition the samples lose <em>nothing</em>, and the continuous signal can be reconstructed perfectly by interpolating with sincs. That is why digital audio works at all. The engineering consequence is that every converter needs an analogue anti-aliasing filter ahead of it, removing what it cannot represent before the damage becomes permanent.</p>

<h3 id="f9">Leakage and windows</h3>
<p>Truncating in time <strong>smears</strong> the spectrum. The DFT implicitly assumes your N samples repeat forever; if the signal does not complete a whole number of cycles within the window, that assumed repetition contains a discontinuity at the join — and a discontinuity has energy at every frequency. A pure tone that does not land exactly on a bin therefore appears as a peak with long skirts.</p>
<p>A <strong>window</strong> tapers the samples to zero at both ends so there is no jump to speak of. The trade is fixed and unavoidable: a wider main lobe in exchange for far lower sidelobes. Rectangular has the narrowest main lobe and the worst sidelobes; Hann is the usual compromise; Blackman suppresses sidelobes further at the cost of resolution. Windowing is multiplication in time, hence convolution in frequency — the spectrum you see is the true one convolved with the window's own transform.</p>

<h3 id="f10">The FFT</h3>
<p>Evaluated literally the DFT costs N² complex multiplications. The fast Fourier transform reduces that to about ½N log₂N by one observation: split the sum into even-numbered and odd-numbered samples and each half is itself a transform of length N/2, since</p>
<div class="eqb"><span class="mth"><i>e</i><sup>−2π<i>ik</i>(2<i>m</i>)/<i>N</i></sup> = <i>e</i><sup>−2π<i>ikm</i>/(<i>N</i>/2)</sup></span></div>
<p>Better still, bins <strong>k</strong> and <strong>k + N/2</strong> reuse exactly the same two sub-transforms and differ only in the sign of the twiddle factor e<sup>−2πik/N</sup>. So the work comes in pairs — the <strong>butterflies</strong> — with N/2 of them at each of log₂N levels. Nothing is approximated and nothing is discarded; the algorithm simply stops recomputing what it already has.</p>
<p>The saving is not a constant factor but a growing one: 200× at N = 1024, and 100 000× at N = 2²⁰. Cooley and Tukey published it in 1965; Gauss had it in 1805 and left it unpublished in his notebooks. The stage in this wing runs both algorithms against each other and times them, which is the honest way to make the point.</p>

<h3 id="f11">Convolution</h3>
<div class="eqb"><span class="mth">
<i>x</i> ∗ <i>h</i> ⟷ <i>X</i> · <i>H</i> &nbsp;&nbsp;and&nbsp;&nbsp; <i>x</i> · <i>h</i> ⟷ <i>X</i> ∗ <i>H</i>
</span></div>
<p>Convolution in one domain is multiplication in the other. Since every linear time-invariant system convolves its input with its impulse response, this single fact turns filtering — an N² integral — into a pointwise multiplication sandwiched between two transforms. Fast convolution is how long filters are applied to audio, how large images are blurred, and how very large integers are multiplied.</p>
<p>The dual direction matters just as much. Multiplying two signals in time convolves their spectra: that is what modulating a radio carrier does, what a window does to a spectral line, and what sampling itself does (multiplication by an impulse train, hence convolution with an impulse train, hence the periodic spectrum that causes aliasing). Three apparently separate phenomena, one theorem.</p>

<h3 id="f12">Where this wing connects to the others</h3>
<ul>
  <li><strong>Circuits.</strong> A transfer function <em>is</em> the Fourier transform of an impulse response. The Bode plot in the circuits wing and the spectra here are the same object; the "time + frequency" instrument there shows both at once for exactly this reason. Impedance itself is a Fourier idea — it exists because e<sup>iωt</sup> is an eigenfunction of differentiation, so d/dt becomes multiplication by jω.</li>
  <li><strong>Quantum mechanics.</strong> Position and momentum representations of a wavefunction are Fourier transforms of one another. The uncertainty principle is the bandwidth theorem above, and a wave packet spreads because its components travel at different phase velocities — dispersion, which is a statement about the phase of a transform.</li>
  <li><strong>Electromagnetism.</strong> Decomposing a field into plane waves e<sup>i(k·r−ωt)</sup> is a spatial Fourier transform, and it is what makes Maxwell's equations tractable: each spatial frequency propagates independently.</li>
  <li><strong>Vector calculus.</strong> Under the transform, ∇ becomes multiplication by ik. Differential equations turn into algebraic ones — which is the same trick, and the same reason, as impedance.</li>
</ul>
`;

