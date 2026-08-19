/* ============================================================================
   THEORY — SIGNAL PROCESSING (Programme C wing C15)
   The Fourier wing shows that a signal and its spectrum are one object. This
   one is about what happens when you only have some of it: finitely many
   samples, taken finitely often, over a finite stretch of time. Every awkward
   thing in practical spectrum analysis is one of those three restrictions.
   ============================================================================ */
const THEORY_SIGNAL = `
<div class="toc"><a href="#s0">Three restrictions</a><a href="#s1">Sampling</a>
<a href="#s2">The fold</a><a href="#s3">Reconstruction</a><a href="#s4">The finite record</a>
<a href="#s5">Windows</a><a href="#s6">Filters</a><a href="#s7">Both at once</a></div>

<h3 id="s0">Three restrictions, and everything follows from them</h3>
<p>A computer never has a signal. It has a list of numbers, and three things separate that list from the thing it was taken from:</p>
<ul>
<li>the signal was <strong>sampled</strong> — read only at instants, so anything between them was never seen;</li>
<li>the record is <strong>finite</strong> — it started and it stopped;</li>
<li>each number has <strong>finitely many digits</strong>, which this wing leaves alone and the numerical-methods wing does not.</li>
</ul>
<p>The first restriction gives aliasing and the sampling theorem. The second gives leakage and windows. Both consequences are exact and both are consequences of the convolution theorem, which is the Fourier wing's and is not re-derived here. What is worth saying first is that neither is a defect in the arithmetic: at every stage the transform is describing precisely the signal it was given, and the surprise is always about what that signal actually is.</p>

<h3 id="s1">Sampling is a multiplication</h3>
<p>Model a sampler as multiplication by a train of spikes, one every <span class="mth">1/<i>f</i><sub>s</sub></span> seconds:</p>
<div class="eqb"><span class="mth"><i>x</i><sub>s</sub>(<i>t</i>) <span class="op">=</span> <i>x</i>(<i>t</i>) <span class="op">·</span> ∑<sub><i>n</i></sub> δ(<i>t</i> <span class="op">−</span> <i>n</i>/<i>f</i><sub>s</sub>)</span></div>
<p>Nothing is discarded in that model; the signal is simply multiplied by something. And multiplying in time is convolving in frequency, so the spectrum of the sampled signal is the original convolved with a comb — which is to say, the original <em>repeated endlessly</em>, spaced by <span class="mth"><i>f</i><sub>s</sub></span>.</p>
<p>Every fact about sampling is a fact about those copies. If they do not overlap, nothing has been lost and a filter could cut one out again. If they do, the overlapping parts have been added together and there is no operation that separates a sum into its terms.</p>

${stThm('Nyquist–Shannon sampling theorem', {
  hyp:'<span class="mth"><i>x</i></span> contains no frequency at or above <span class="mth"><i>B</i></span>, and <span class="mth"><i>f</i><sub>s</sub> > 2<i>B</i></span>',
  then:'<span class="mth"><i>x</i></span> is determined completely by its samples <span class="mth"><i>x</i>[<i>n</i>] = <i>x</i>(<i>n</i>/<i>f</i><sub>s</sub>)</span>, and is recovered by',
  eq:'<i>x</i>(<i>t</i>) <span class="op">=</span> ∑<sub><i>n</i></sub> <i>x</i>[<i>n</i>] sinc(<i>f</i><sub>s</sub><i>t</i> <span class="op">−</span> <i>n</i>)',
  proof:`<p>The spectrum of the sampled signal is <span class="mth"><i>X</i></span> repeated at every multiple of <span class="mth"><i>f</i><sub>s</sub></span>. A copy centred at <span class="mth">0</span> occupies <span class="mth">(−<i>B</i>, <i>B</i>)</span> and the next occupies <span class="mth">(<i>f</i><sub>s</sub> − <i>B</i>, <i>f</i><sub>s</sub> + <i>B</i>)</span>; these are disjoint exactly when <span class="mth"><i>f</i><sub>s</sub> − <i>B</i> > <i>B</i></span>, which is the hypothesis.</p>
<p>So multiplying the sampled spectrum by a rectangle of width <span class="mth"><i>f</i><sub>s</sub></span> recovers <span class="mth"><i>X</i></span> exactly. A rectangle in frequency is a sinc in time, and multiplication in frequency is convolution in time, so the recovery is a convolution of the sample train with a sinc — which is the sum stated.</p>`,
  note:'The inequality is strict, and the wing shows why with an example rather than an argument: a carrier at exactly f_s/2 is caught at the same phase every time. Land on its zero crossings and every sample is 0; land on its peaks and it reads full amplitude. At the endpoint the answer depends on the phase, which the theorem does not mention.',
  see:'signal:sigAlias', seeLabel:'A tone below Nyquist, and the samples that determine it' })}

<p>Two things about that factor of two get mislearned, and both follow from the proof above rather than from experience. It is not a safety margin — it is the width of a two-sided spectrum, which runs from <span class="mth">−<i>B</i></span> to <span class="mth"><i>B</i></span> and is therefore <span class="mth">2<i>B</i></span> wide. And <span class="mth"><i>B</i></span> is a property some signals have and most do not.</p>

<h3 id="s2">What "aliasing" actually is</h3>
<p>When the copies overlap, a frequency above <span class="mth"><i>f</i><sub>s</sub>/2</span> appears at</p>
<div class="eqb"><span class="mth"><i>f</i><sub>app</sub> <span class="op">=</span> |<i>f</i> <span class="op">−</span> <i>kf</i><sub>s</sub>|, &nbsp;&nbsp; <i>k</i> the nearest integer</span></div>
<p>which as a function of <span class="mth"><i>f</i></span> is a triangle wave: the identity up to Nyquist, then folded back and forth like a concertina. The wing draws it, because "the frequency folds" is a picture and a formula and neither is a substitute for the other.</p>
<p>The word "aliasing" understates it. After folding, a tone at <span class="mth"><i>f</i></span> and a tone at <span class="mth"><i>f</i><sub>s</sub> − <i>f</i></span> do not have similar samples; they have <em>identical</em> ones. Nothing downstream is being fooled by a resemblance — there is no information left to be right about. The result is not noisy and not visibly wrong: it is a clean tone at a frequency that was never present, which a spectrum analyser will report with confidence.</p>
<p>That is why the cure is a filter in <strong>front</strong> of the converter. It cannot recover anything; it removes what cannot be represented before it becomes indistinguishable from what can. The price is honest and worth saying out loud: what is recorded afterwards is a faithful account of a <em>different signal</em> — the band-limited one. That is the description of every digital recording ever made.</p>

<h3 id="s3">Reconstruction, and two residuals that look alike</h3>
<p>The sum in the theorem runs over <em>all</em> samples, from <span class="mth">−∞</span> to <span class="mth">∞</span>, and sinc decays only as <span class="mth">1/<i>t</i></span>. So over a finite record the reconstruction is right in the middle and increasingly wrong towards the ends, by an amount that shrinks as the record lengthens.</p>
<p>The wing prints that residual, and the reason is a lesson that generalises far beyond this subject. <strong>The same number means opposite things depending on how it responds to more data.</strong> Double the record and:</p>
<ul>
<li>a residual that <em>halves</em> is the truncated tail of an infinite sum — nothing is wrong, and more data fixes it;</li>
<li>a residual that <em>does not move</em> is the alias — nothing is missing from the sum, and no amount of data fixes it.</li>
</ul>
<p>Asserting a tolerance would distinguish neither. Measuring the response to a change in resolution distinguishes them every time, and it is how this laboratory tells a truncation error from a round-off error from a modelling error everywhere else too.</p>

<h3 id="s4">A finite record, and where leakage comes from</h3>
<p>The DFT of <span class="mth"><i>N</i></span> samples represents the signal that <em>repeats</em> those samples forever. If a tone does not complete a whole number of cycles in the record, that imagined repetition has a step in it, and a step has content at every frequency. That smear is <strong>spectral leakage</strong>.</p>
<p>Formally, truncating is multiplying by a rectangle, so the spectrum is convolved with the rectangle's transform — the Dirichlet kernel</p>
<div class="eqb"><span class="mth"><i>D</i>(δ) <span class="op">=</span> ∑<sub><i>n</i>&lt;<i>N</i></sub> e<sup>−2πiδ<i>n</i>/<i>N</i></sup> <span class="op">=</span> e<sup>−iπδ(<i>N</i>−1)/<i>N</i></sup> · sin(πδ) / sin(πδ/<i>N</i>)</span></div>
<p>with <span class="mth">δ</span> measured in bins. Its zeros sit at every non-zero integer, which is why a tone that <em>does</em> fit gives one clean line and no leakage at all: the kernel's nulls land exactly on the other bins. Move the tone half a bin and none of them do.</p>
<p>The kernel's skirts decay as <span class="mth">1/δ</span>, so its first sidelobe is only 13 dB down and a quiet tone anywhere in the spectrum is buried under a loud one. That is a property of the rectangle, not of the signal, and it is what a window is for.</p>

<h3 id="s5">Windows, and the two failures they trade between</h3>
<p>A window is a taper <span class="mth"><i>w</i>[<i>n</i>]</span> applied before transforming. All but one in this wing are cosine sums,</p>
<div class="eqb"><span class="mth"><i>w</i>[<i>n</i>] <span class="op">=</span> ∑<sub><i>k</i></sub> (<span class="op">−</span>1)<sup><i>k</i></sup> <i>a<sub>k</sub></i> cos(2π<i>kn</i>/<i>N</i>)</span></div>
<p>and writing them that way buys two exact identities and an independent route to the whole leakage pattern.</p>

${stThm('Coherent gain and noise bandwidth of a cosine-sum window', {
  hyp:'<span class="mth"><i>w</i>[<i>n</i>] = ∑<sub><i>k</i></sub>(−1)<sup><i>k</i></sup><i>a<sub>k</sub></i>cos(2π<i>kn</i>/<i>N</i>)</span> for <span class="mth"><i>n</i> = 0 … <i>N</i>−1</span>, with <span class="mth"><i>N</i> > 2<i>K</i></span>',
  then:'',
  eq:'<span class="op">⟨</span><i>w</i><span class="op">⟩</span> <span class="op">=</span> <i>a</i><sub>0</sub> , &nbsp;&nbsp;&nbsp; ENBW <span class="op">=</span> <i>N</i>∑<i>w</i>²/(∑<i>w</i>)² <span class="op">=</span> 1 <span class="op">+</span> ∑<sub><i>k</i>≥1</sub><i>a<sub>k</sub></i>² / 2<i>a</i><sub>0</sub>²',
  proof:`<p>Over <span class="mth"><i>n</i> = 0 … <i>N</i>−1</span> the sum <span class="mth">∑ cos(2π<i>kn</i>/<i>N</i>)</span> is <span class="mth"><i>N</i></span> for <span class="mth"><i>k</i> = 0</span> and <span class="mth">0</span> otherwise, being a full turn round the unit circle. Hence <span class="mth">∑<i>w</i> = <i>a</i><sub>0</sub><i>N</i></span> and the mean is <span class="mth"><i>a</i><sub>0</sub></span>.</p>
<p>For the second, expand the square. Each term is a product of two cosines, which is half the sum of a cosine at the difference frequency and one at the sum frequency. Both have integer frequency and both sum to zero unless that frequency is zero — which happens only for the diagonal terms <span class="mth"><i>k</i> = <i>l</i></span>, and there the difference term is a constant <span class="mth">½</span> (for <span class="mth"><i>k</i> ≥ 1</span>) or <span class="mth">1</span> (for <span class="mth"><i>k</i> = 0</span>). So <span class="mth">∑<i>w</i>² = <i>N</i>(<i>a</i><sub>0</sub>² + ½∑<sub><i>k</i>≥1</sub><i>a<sub>k</sub></i>²)</span>, and dividing gives the stated form.</p>
<p>The hypothesis <span class="mth"><i>N</i> > 2<i>K</i></span> is what keeps the sum frequencies below <span class="mth"><i>N</i></span> so that none of them aliases to zero and contributes where it should not.</p>`,
  note:'Hann gives exactly 3/2 and a rectangle exactly 1. The flat-top window gives 3.77, which is the price of its name. The stage computes the left-hand side by adding up N numbers and the right-hand side from four coefficients, and prints the difference — a window with a mistyped coefficient passes every visual check and fails this.',
  see:'signal:sigWindow', seeLabel:'Coherent gain and noise bandwidth, summed and derived' })}

<p>The same expansion gives the window's transform without ever forming the window: a cosine sum is a sum of shifted rectangles in frequency, so</p>
<div class="eqb"><span class="mth"><i>W</i>(δ) <span class="op">=</span> ∑<sub><i>k</i></sub> (<span class="op">−</span>1)<sup><i>k</i></sup> (<i>a<sub>k</sub></i>/2)[<i>D</i>(δ<span class="op">−</span><i>k</i>) <span class="op">+</span> <i>D</i>(δ<span class="op">+</span><i>k</i>)]</span></div>
<p>and that curve is drawn on the stage underneath an FFT of the actual samples. They agree to about a part in <span class="mth">10<sup>14</sup></span> over ninety decibels of range, and they share no arithmetic.</p>

<h4>Two failures, and the picker separates them</h4>
<p>Beginners meet windows as a menu with no principle behind it. There is a principle, and it is that windows fail in two different ways which need opposite cures.</p>
<ul>
<li><strong>Resolution.</strong> Two tones close together merge into one lump if the main lobe is wider than their separation. Sidelobes are irrelevant. The only cure is a longer record, because a bin is <span class="mth"><i>f</i><sub>s</sub>/<i>N</i></span> and <span class="mth"><i>N</i></span> appears nowhere else.</li>
<li><strong>Dynamic range.</strong> A quiet tone far from a loud one is buried under the loud one's skirts. A longer record does not help at all. The only cure is a window whose transform decays faster.</li>
</ul>
<p>And there is a third quantity, which is neither: <strong>scalloping loss</strong>, the amplitude error a tone suffers for sitting between two bins. A rectangle under-reads by 3.92 dB; the flat-top window by 0.01 dB, at the cost of a main lobe five bins wide. If you are measuring how <em>loud</em> something is, that is the best window in the picker; if you are measuring <em>where</em> it is, it is the worst.</p>
<p>Every window trades one of these against another, and no window wins on all three. The reason is not empirical. A window's transform decays fast exactly when the window is smooth, and a smooth window that reaches zero at both ends must spend more of its length getting there. Width and decay are the same property seen twice.</p>

<h3 id="s6">Filters: two lists of numbers</h3>
<p>A filter is a recursion with constant coefficients:</p>
<div class="eqb"><span class="mth"><i>a</i><sub>0</sub><i>y</i>[<i>n</i>] <span class="op">=</span> ∑<sub><i>k</i></sub><i>b<sub>k</sub>x</i>[<i>n</i>−<i>k</i>] <span class="op">−</span> ∑<sub><i>k</i>≥1</sub><i>a<sub>k</sub>y</i>[<i>n</i>−<i>k</i>]</span></div>
<p>With no feedback it is an <strong>FIR</strong>: the response to a single 1 is the list <span class="mth"><i>b</i></span> and then nothing, forever. With feedback it is an <strong>IIR</strong>: the response decays geometrically and never reaches zero, which is what "infinite impulse response" names.</p>

${stThm('A linear time-invariant filter cannot change a frequency', {
  hyp:'the recursion above, driven by <span class="mth"><i>x</i>[<i>n</i>] = e<sup>2πi<i>fn</i></sup></span>, in steady state',
  then:'the output is <span class="mth"><i>H</i>(<i>f</i>)·e<sup>2πi<i>fn</i></sup></span> with',
  eq:'<i>H</i>(<i>f</i>) <span class="op">=</span> ∑<i>b<sub>k</sub></i>e<sup>−2πi<i>kf</i></sup> <span class="op">/</span> ∑<i>a<sub>k</sub></i>e<sup>−2πi<i>kf</i></sup>',
  proof:`<p>Try <span class="mth"><i>y</i>[<i>n</i>] = <i>H</i>e<sup>2πi<i>fn</i></sup></span>. Delaying an exponential by <span class="mth"><i>k</i></span> multiplies it by <span class="mth">e<sup>−2πi<i>kf</i></sup></span>, so every term in the recursion is that same exponential times a constant. Dividing through by it leaves</p>
${stEq('<i>a</i><sub>0</sub><i>H</i> <span class="op">=</span> ∑<i>b<sub>k</sub></i>e<sup>−2πi<i>kf</i></sup> <span class="op">−</span> ∑<sub><i>k</i>≥1</sub><i>a<sub>k</sub></i>e<sup>−2πi<i>kf</i></sup><i>H</i>')}
<p>which is one linear equation in <span class="mth"><i>H</i></span> and rearranges to the statement. That the trial solution works is the theorem; that it is the <em>only</em> steady state requires the transient to decay, which is the stability condition below.</p>`,
  note:'This is why the whole subject is algebra. The stage computes H both ways — from the coefficients, and by actually running the recursion on a complex exponential and dividing the output by the input — and the two curves lie on top of one another to a part in 10¹⁵.',
  see:'signal:sigFilter', seeLabel:'The response, from the coefficients and by running the filter' })}

<h4>Phase, delay and why symmetry matters</h4>
<p>The <strong>group delay</strong> is <span class="mth">τ(<i>f</i>) = −d(arg <i>H</i>)/2πd<i>f</i></span>, in samples. A filter with constant group delay moves a waveform without changing its shape; one whose delay varies smears a sharp edge into a ringing one, because its components come out at different times.</p>
<p>Symmetric taps force constant delay. Reverse the list and it is the same list, so <span class="mth"><i>H</i></span> is a real function times <span class="mth">e<sup>−iω(<i>M</i>−1)/2</sup></span> and the phase can only be a straight line; its slope is <span class="mth">(<i>M</i>−1)/2</span> samples. This is the one thing an FIR can do that no IIR can, and it is why every designed filter in this wing has palindromic taps.</p>
<p>There is a third route to the same number at <span class="mth"><i>f</i> = 0</span>, and it is exact. Expanding <span class="mth"><i>H</i>(<i>f</i>) = ∑<i>h</i>[<i>n</i>]e<sup>−2πi<i>fn</i></sup></span> for small <span class="mth"><i>f</i></span> gives a phase of <span class="mth">−2π<i>f</i>·∑<i>nh</i>[<i>n</i>]/∑<i>h</i>[<i>n</i>]</span> — so the delay at DC <em>is</em> a first moment, the quantity a physicist would call a centre of mass. It needs <span class="mth">∑<i>h</i> ≠ 0</span>, so a high-pass has no such number, and the panel says "not defined" rather than dividing by zero.</p>
<p>It can also be <strong>negative</strong>, and the resonator in the picker makes it so. That is not a violation of causality. What a narrowband filter advances is the <em>envelope</em> of a signal it has already been hearing for a long time; nothing that has not started yet is affected, and the impulse response is still zero before <span class="mth"><i>n</i> = 0</span>.</p>
<p>And the group delay does not exist at a zero of <span class="mth"><i>H</i></span> on the unit circle, where <span class="mth">arg <i>H</i></span> jumps by <span class="mth">π</span>. Differencing the phase across such a jump returns a large finite number wearing the units of a delay, and the earliest version of this wing's code printed −24 999.5 samples for the difference filter at DC. A quantity defined as a derivative does not exist where the function is not differentiable, and both routes now refuse there.</p>

${stThm('Stability', {
  hyp:'every root of <span class="mth"><i>A</i>(<i>z</i>) = ∑<i>a<sub>k</sub>z</i><sup>−<i>k</i></sup></span> lies strictly inside the unit circle',
  then:'the transient decays and every bounded input produces a bounded output',
  proof:`<p>Partial fractions write the impulse response as a sum of terms <span class="mth"><i>c<sub>j</sub>p<sub>j</sub></i><sup><i>n</i></sup></span>, one per pole (with polynomial factors for repeated ones). Such a term is absolutely summable exactly when <span class="mth">|<i>p<sub>j</sub></i>| &lt; 1</span>, and a filter is bounded-input bounded-output stable exactly when <span class="mth">∑|<i>h</i>[<i>n</i>]| &lt; ∞</span>.</p>
<p>Two corollaries the stage uses. An FIR has no poles at all, so it is stable whatever its taps are. And the settling time is set by the largest pole radius: <span class="mth"><i>r<sup>n</sup></i> &lt; 10<sup>−14</sup></span> needs <span class="mth"><i>n</i> ≈ 35/(1−<i>r</i>)</span>, which diverges as <span class="mth"><i>r</i> → 1</span>. A filter on the edge of instability has no settling time, and the stage's count climbs into the thousands as you drag a pole outwards.</p>`,
  note:'Stability is therefore a question about where the roots of a polynomial are — which the complex-numbers wing already answers, by Aberth iteration. The stage draws them on the unit circle using that root finder unmodified.',
  see:'signal:sigFilter', seeLabel:'Type your own coefficients, and find the poles' })}

<h4>Designing one: the windowed sinc</h4>
<p>The ideal low-pass has impulse response <span class="mth">2<i>f</i><sub>c</sub> sinc(2<i>f</i><sub>c</sub><i>n</i>)</span>, which is infinite and not causal. Truncate it and you get Gibbs ripple at the cut — for exactly the reason the Fourier wing measured, since truncating is multiplying by a rectangle. Multiply by a window instead and the ripple collapses: the same trade as before, seen from the other side.</p>
<p>Notice what a designed filter does <em>not</em> claim. A filter with finitely many taps is a trigonometric polynomial, and one of those has finitely many zeros — put them where you like, and between them the gain is small but not nothing. "The stopband is under −55 dB" is a statement a design can keep. "The gain at Nyquist is zero" is not, and the tables in this wing declare the first kind.</p>

<h3 id="s7">Time and frequency at once</h3>
<p>One transform of a whole record says which frequencies are present and nothing about when. For a signal whose content changes — a chirp, a word, a burst — that is nearly useless. Cutting the record into overlapping windowed pieces and transforming each gives the <strong>short-time transform</strong>, and a picture in both domains at once.</p>
<p>Here the window is doing two jobs, and it is important that they are the same job. It is still the taper that controls leakage, and it is now also the thing that decides <em>when</em>: each column reports the content of one window-length of signal. So</p>
<div class="eqb"><span class="mth">Δ<i>t</i> <span class="op">=</span> <i>N</i>/<i>f</i><sub>s</sub> , &nbsp;&nbsp;&nbsp; Δ<i>f</i> <span class="op">=</span> ENBW <span class="op">·</span> <i>f</i><sub>s</sub>/<i>N</i> , &nbsp;&nbsp;&nbsp; Δ<i>t</i> <span class="op">·</span> Δ<i>f</i> <span class="op">=</span> ENBW</span></div>
<p>and the product does not contain <span class="mth"><i>N</i></span>. Whatever window length you choose, the resolution cell has the same area; every choice is a choice of its <em>shape</em>. That is the uncertainty relation in the only form a computer ever sees — cruder than <span class="mth">σ<sub>t</sub>σ<sub>f</sub> ≥ 1/4π</span> and much more useful, and the same fact as <span class="mth">Δ<i>x</i>Δ<i>p</i> ≥ ħ/2</span> with <span class="mth">ħ</span> replaced by a window you chose.</p>
<p>Two things are commonly misread here and the stage settles both. <strong>Overlap buys nothing in resolution</strong> — it cannot, since the window length has not changed; what it buys is that no event falls in the gap between columns. And <strong>the ridge lands at the centre of its window</strong>: a window sees a sweep cross it and reports the average, so comparing the measured ridge against the instantaneous frequency at the window's <em>start</em> produces a residual of half a sweep and looks like a broken estimator rather than a misaligned comparison.</p>

${stThm('The short-time resolution product is the window\'s noise bandwidth', {
  hyp:'a short-time transform with window <span class="mth"><i>w</i></span> of length <span class="mth"><i>N</i></span> at sample rate <span class="mth"><i>f</i><sub>s</sub></span>',
  then:'',
  eq:'Δ<i>t</i> <span class="op">·</span> Δ<i>f</i> <span class="op">=</span> ENBW(<i>w</i>), &nbsp; independent of <i>N</i> and of <i>f</i><sub>s</sub>',
  proof:`<p>A column spans <span class="mth"><i>N</i></span> samples, so <span class="mth">Δ<i>t</i> = <i>N</i>/<i>f</i><sub>s</sub></span>. The bins of an <span class="mth"><i>N</i></span>-point transform are <span class="mth"><i>f</i><sub>s</sub>/<i>N</i></span> apart, and the window spreads one tone over ENBW of them by the definition of equivalent noise bandwidth, so <span class="mth">Δ<i>f</i> = ENBW·<i>f</i><sub>s</sub>/<i>N</i></span>. Multiplying, both <span class="mth"><i>N</i></span> and <span class="mth"><i>f</i><sub>s</sub></span> cancel.</p>`,
  note:'The stage sweeps N and prints the spread of the product, which is zero to the last bit — an invariance is a stronger statement than any single value, and this laboratory prefers them for that reason.',
  see:'signal:sigSpectro', seeLabel:'Short window or long: the box changes shape and keeps its area' })}

<p>Where this leads: the same construction with a family of windows scaled to their own frequency, rather than one window for all of them, is the wavelet transform — and the reason to want it is visible on the spectrogram here, where a low-frequency hum and a sharp click want completely different window lengths and only one is available. The Dirichlet kernel that has now appeared three times — as the transform of a rectangle, as the rectangular window's leakage, and as the moving average's frequency response — is one function doing one job, and noticing that is worth more than any of the three separately.</p>
`;
