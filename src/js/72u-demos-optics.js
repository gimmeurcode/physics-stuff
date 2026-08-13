const OPTICS_GROUPS = [
{ g:'Geometric optics', items:[
  {n:'Refraction, and where Snell comes from', ex:"Fermat's least time, minimised numerically", stage:'opGeom',
   opts:{ mode:'refract' },
   out:'The routine scans every possible crossing point, keeps the one with the shortest travel time, and the winning geometry satisfies n₁sinθ₁ = n₂sinθ₂ to four decimals. Snell was never used in that calculation.',
   note:'Total internal reflection is what happens when the refracted ray would have to bend past 90°. Diamond\'s critical angle is only 24°, so almost everything that gets in bounces until it leaves through a facet — which is the entire optical basis of a cut gemstone, and of an optical fibre.'},
  {n:'Lenses and mirrors', ex:'one equation, and a sign convention', stage:'opGeom',
   opts:{ mode:'lens', setup:'converging' },
   out:'The three principal rays are drawn and meet where 1/f = 1/d_o + 1/d_i predicts. Drag the object through the focal point and the image flips from real and inverted to virtual and upright, passing through infinity.',
   note:'Beyond 2f is a camera, between f and 2f is a projector, inside f is a magnifying glass — the same equation with the object in a different place. Real lenses add spherical and chromatic aberration, and correcting those is most of what lens design actually is.'},
  {n:'Cut your own aperture, and get its pattern from the integral', ex:'the far field is the Fourier transform of the opening', stage:'opWave',
   opts:{ mode:'own' },
   out:'A slit and two smaller ones beside it, written as a transmission function. The pattern below is obtained by integrating ∫A(x)e^(−ikx sinθ)dx over whatever you write — no formula for a slit, a pair or a grating appears anywhere in it. Replace the aperture with <b>exp(-(x/30)^2)</b> and watch every side lobe vanish.',
   note:'The single slit\'s sinc², the double slit\'s fringes under that envelope, and the grating\'s sharp orders are usually met as three separate results. They are one: <b>the far-field amplitude is the Fourier transform of the aperture</b>, and each closed form exists only because somebody did that integral for one particular shape. Doing it numerically turns those formulas from results into <i>predictions</i> — the panel measures the first minimum of your pattern and prints beside it what λL/a would say for the same total open width, and for anything other than one rectangle the two disagree. Reading the shapes through the transform makes the relationships obvious rather than coincidental: two slits are one slit convolved with a pair of points, so their transform is the single-slit envelope <i>multiplied</i> by a cosine — the convolution theorem from the Fourier wing, read backwards. N slits give a sum that cancels everywhere except at the orders, which is why a grating is sharp. And a Gaussian opening has a Gaussian transform, which has no side lobes at all — that is what apodised masks on telescopes are for, and why they are worth the lost light.'},
  {n:'Design a lens, and meet its first defect', ex:'radius · thickness · index, one surface a line', stage:'opGeom',
   opts:{ mode:'system', apr:12, sobj:300 },
   out:'A biconvex singlet, written as two lines of a prescription. Nine rays are traced through the actual spheres with Snell\'s law, and they do not meet at a point: the ones through the edge cross the axis about 4 mm short of the ones through the centre. That gap is measured, and the paraxial matrix — the thin-lens formula with the thickness restored — has no idea it exists.',
   note:'Everything else in this wing treats a lens as one number. A real lens is a <b>prescription</b>: a radius, a thickness and a glass index for each surface, in the format lens data has been published in for a century. Two calculations then run on it and the interest is entirely in their disagreement. The <b>paraxial</b> one multiplies ray-transfer matrices — refraction and travel are each 2×2 acting on a ray\'s height and angle — and hands back the focal length, the back focus and the <b>principal planes</b>, which is where the focal length is actually measured from and which the thin-lens formula pretends do not exist. The <b>real</b> one puts finite rays through the spheres with no approximation at all. Their gap is <b>spherical aberration</b>: quadratic in aperture, so halving the aperture quarters it, and completely invisible to any formula on the previous panels. Now replace the two lines with the three of a cemented doublet — <b>61.47 6 1.5168</b>, <b>−44.64 2.5 1.6727</b>, <b>−129.94 0 1</b> — and watch the aberration fall by a factor of eighty at the same focal length. That is why a camera lens has six pieces of glass in it, and it is a thing you can now try rather than be told.'}
]},
{ g:'Physical optics', items:[
  {n:'The double slit, and its missing orders', ex:'interference inside a diffraction envelope', stage:'opWave',
   opts:{ mode:'double' },
   out:'The pattern is the two-slit term multiplied by the single-slit envelope, and the screen is painted in the light\'s own colour. Set d/a to a whole number and watch that interference order vanish completely.',
   note:'A maximum sits at d sinθ = mλ and an envelope zero at a sinθ = pλ; when they coincide the order is simply absent — the two slits reinforce at an angle where each individually sends no light. This is the classical version of the experiment the quantum wing runs one particle at a time.'},
  {n:'Single slits, gratings and the diffraction limit', ex:'confining a wave spreads it', stage:'opWave',
   opts:{ mode:'grating' },
   out:'N slits sharpen each maximum by a factor of N without moving any of them, giving resolving power R = Nm. The panel checks whether the grating can split the sodium doublet at 0.597 nm.',
   note:'Narrowing a slit makes the pattern <i>wider</i>, always, and by an amount inversely proportional to the confinement. That is not an optical quirk — it is the Fourier uncertainty relation of the Fourier wing and Δx·Δp ≥ ħ/2 of the quantum wing, written for light.'},
  {n:'Polarisation, and the three-filter puzzle', ex:'adding a filter lets more light through', stage:'opWave',
   opts:{ mode:'polar' },
   out:'Two crossed polarisers pass nothing. Insert a third at 45° between them and I₀/8 gets through — because two cos²45° steps beat one cos²90° step.',
   note:'The middle filter is not unblocking anything; it is <b>changing what is there</b>, projecting the polarisation onto a new axis and discarding the rest. That is the classical shadow of a deeply quantum fact, and the Stern–Gerlach chain in the quantum wing is the identical experiment with spin.'}
]}];

