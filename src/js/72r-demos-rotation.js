/* The AP framework splits rotation into two units: the dynamics (what produces
   angular acceleration) and the conserved quantities. ROT_GROUPS is the first,
   ROTEN_GROUPS the second, and they are separate wings. */
const ROT_GROUPS = [
{ g:'Torque and rotational dynamics', items:[
  {n:'Moment of inertia', ex:'mass, weighted by the square of its distance', stage:'rtInertia',
   opts:{ key:'disc' },
   out:'I is obtained by integrating r²dm over the body and printed beside the textbook formula — so the table entry is a result here. The parallel-axis theorem is checked the same way.',
   note:'The r² is everything. Mass near the axis is nearly free and mass at the rim costs the most it possibly can, which is why a hoop has the largest I of any shape and a solid sphere among the smallest. Expressed as multiples of MR², the whole table is one dimensionless number per shape.'},
  {n:'Build your own body, and test the theorem on it', ex:'disc · rod · point · ring — I computed twice', stage:'rtInertia',
   opts:{ own:true },
   out:'A body assembled from four pieces, with no closed form anywhere for its moment of inertia. The panel computes I twice by routes that share nothing — integrating r²dm over each piece with the axis wherever you put it, and adding the pieces\' own formulas and shifting them with the parallel-axis theorem — and prints the difference. Drag the axis and watch I dip to its minimum exactly at the centre of mass.',
   note:'Every preset on this stage is a shape somebody solved, and each carries its answer twice so the panel can print the gap rather than assert the formula. A body you assemble has no formula at all, so the same standard has to be met differently. The <b>direct</b> route is the definition — <b>I = ∫r²dm</b> — evaluated by quadrature over each piece with the axis in whatever position you have chosen, and it does not know the parallel-axis theorem exists. The <b>theorem</b> route never integrates anything: it takes each piece\'s own closed form, shifts it to the body\'s centre of mass by <b>I_cm + md²</b>, sums, and shifts the total out to your axis by the same rule. Nothing whatever links the two calculations, so their agreement <i>is</i> the parallel-axis theorem verified on a body nobody chose — which is the difference between being told a theorem and watching it hold. The minimum at the centre of mass is the same statement read again: Md² is never negative, so no axis anywhere can beat the one through the centre of mass, and that is why a thrown hammer tumbles about its centre of mass and about nothing else.'},
  {n:'Torque: only the perpendicular part turns anything', ex:'τ = rF sin θ', stage:'rtTorque',
   opts:{ body:'disc', ang:Math.PI / 2 },
   out:'The force is drawn split into its radial and tangential parts, and only the tangential one contributes. Slide the angle to zero and the torque vanishes however hard you push.',
   note:'Click anywhere on the body to move where the force acts. Doubling the lever arm doubles the torque for the same force, which is the entire principle of a spanner, a door handle and a crowbar — and the reason the hinge side of a door is the hard place to push.'},
  {n:'τ = Iα is Newton\'s second law for rotation', ex:'mass replaced by a distribution of mass', stage:'rtTorque',
   opts:{ body:'hoop', ang:Math.PI / 2, F:6 },
   out:'The same force on the same total mass produces different angular acceleration for different shapes — a hoop is far harder to spin up than a disk of equal weight.',
   note:'Switch between the shapes with the force held fixed. Every linear quantity has a rotational twin and the panel prints the table: m ↔ I, F ↔ τ, a ↔ α, p ↔ L, ½mv² ↔ ½Iω². The last row of the readout checks ω² = 2αθ against the integrated motion rather than quoting it.'},
  {n:'Write your own torque programme τ(t)', ex:'RK4 against ∫τ dt — two answers for one ω', stage:'rtTorque',
   opts:{ own:true, tsrc:'2.5*sin(1.6*t)', T1:6 },
   out:'ω is found twice: RK4 steps I dω/dt = τ(t) forward, and adaptive quadrature evaluates ∫τdt in one go and divides by I. The ring drawn at the right-hand edge of the lower plot is the second answer; the dot sitting inside it is the first. θ is done the same way, and the order of the stepper is measured by halving the step — it comes out at 4.00.',
   note:'<b>ω = ω₀ + αt is not the second law.</b> It is the second law integrated once, under the assumption that α does not change — and the moment you type a torque that varies, that assumption is gone while <b>τ = Iα</b> is untouched. Which of the two you were actually relying on becomes visible immediately. The second route to the angle is worth looking at twice: θ(T) is a double integral, ∫₀ᵀ∫₀ˢτ(u)du ds, and swapping the order of integration collapses it to a <i>single</i> quadrature with a (T − u) weight — the Cauchy formula for a repeated integral. It shares no code with the stepper and no algebra with the first route, so its agreement is worth something. Then try <b>sin(t)</b> over a whole number of periods: the net angular impulse is zero, so ω returns to exactly where it began while θ does not, which is as clean a statement of the difference between a conserved quantity and an accumulated one as mechanics offers.'}
]}];

const ROTEN_GROUPS = [
{ g:'Rotational kinetic energy', items:[
  {n:'Rolling: the energy splits by shape alone', ex:'mgh = ½mv²(1 + c)', stage:'rtEnergy',
   opts:{ mode:'roll', body:1 },
   out:'The potential energy released is accounted for exactly by the two kinetic pieces, computed independently from the speed and the spin and then added.',
   note:'The fraction going into rotation is c/(1+c) and depends on nothing but the shape. Change the mass or the radius and the arrival speed does not move at all — which is why every solid disk ties with every other, and all of them lose to a frictionless sliding block that puts nothing into spin.'},
  {n:'The race down the ramp', ex:'shape decides; mass and radius cancel', stage:'rtRoll',
   opts:{ ang:20 },
   out:'a = g sinθ/(1+c) with c = I/MR². Doubling the mass changes nothing and doubling the radius changes nothing — only the shape survives, so a marble beats a can beats a hoop every time.',
   note:'Static friction supplies the torque that spins the object up and yet does <b>no work</b>, because the contact point is instantaneously at rest. That is what makes rolling efficient. The panel also reports the minimum μ the constraint demands — below it the object slips and the whole analysis has to be redone.'},
  {n:'A hoop and a sphere, side by side', ex:'the extremes of c', stage:'rtEnergy',
   opts:{ mode:'roll', body:3 },
   out:'A hoop puts half its energy into rotation (c = 1); a solid sphere puts only two sevenths (c = 2/5), and arrives noticeably faster.',
   note:'This is a race decided before it starts, by a single dimensionless number. It is also why flywheels are built as rims and why a rolling ball is a poor flywheel: the same property that makes a hoop store energy well makes it accelerate badly.'},
  {n:'Build a body and race it', ex:'c measured from the assembly, then the ramp', stage:'rtRoll',
   opts:{ own:true },
   out:'A wheel with a heavy rim, assembled from a disc and a ring, entered against the five standard shapes. Its shape factor c is computed from the pieces rather than looked up, its acceleration is obtained by eliminating the friction between Newton\'s law and τ = Iα as a 2×2 linear system, and the finishing order that comes out of six separate integrations is compared with the order predicted by sorting on c alone.',
   note:'Everything on the standard tab ends in a formula the presets are entitled to quote. A body you assemble has no entry in any table, so the panel does the derivation instead. <b>Ma + f = Mg sin θ</b> and <b>(I/R)a − Rf = 0</b> are two equations in the two unknowns a and f; solving them contains no shape factor anywhere, and the answer is printed beside <b>g sin θ/(1+c)</b> so the two can be compared. Then comes the part that could actually fail: <b>v and ω are stepped as separate variables</b> from that solved friction, so <b>v = ωR is never imposed on the motion</b>. The slip printed in the readout is the rolling constraint surviving, not being enforced, and the flat energy ledger beside it is the claim that static friction does no work — measured, on a body nobody chose. Move the rolling radius and watch c move with it: a heavy rim on a small hub is a quite different animal from the same mass spread across a wide disc, and the race notices.'}
]},
{ g:'Angular momentum', items:[
  {n:'The skater: L conserved, K not', ex:'pull the arms in and watch both bars', stage:'rtEnergy',
   opts:{ mode:'skate', I2frac:0.35 },
   out:'The angular-momentum bars match before and after to machine precision. The kinetic-energy bars do not — K = L²/2I rises as I falls, and the difference is the work the arms did.',
   note:'Conserving one quantity does not imply conserving another, and this is the cleanest demonstration of it in mechanics. The energy is not appearing from nowhere: pulling mass inwards against its tendency to keep going straight takes real muscular work, and that work is exactly the gap between the two orange bars.'},
  {n:'Angular momentum, three ways', ex:'the skater, the collision and the gyroscope', stage:'rtAngular',
   opts:{ scene:'skater' },
   out:'L = Iω is conserved to the last digit while K = L²/2I is not: halving I doubles the energy, and every joule of it is work the skater\'s arms did pulling inwards.',
   note:'A neutron star is the extreme case — a collapse from 100 000 km to 10 km raises the spin by 10⁸, turning a monthly rotation into a millisecond pulsar. The gyroscope shows the third face of L: a torque perpendicular to it turns it rather than shortening it, so the axis precesses at τ/L instead of falling.'},
  {n:'Why a spinning top does not fall over', ex:'precession at τ/L', stage:'rtAngular',
   opts:{ scene:'gyro' },
   out:'Gravity supplies a torque perpendicular to L, so it changes the direction of L rather than its magnitude, and the axis sweeps round at Ω = τ/L instead of toppling.',
   note:'This is the most counter-intuitive consequence of L being a vector. Spin it faster and the precession slows down, because the same torque now turns a longer vector through a smaller angle. It is also how a bicycle stays up, and why the Earth\'s axis traces a circle once every 26 000 years.'},
  {n:'Write your own shape change I(t)', ex:'dω/dt = −(İ/I)ω, integrated', stage:'rtAngular',
   opts:{ scene:'custom' },
   out:'A smooth pull-in from 5 to 1.5 kg·m². The panel never sets ω = L/I: it differentiates Iω = const into dω/dt = −(İ/I)ω and hands that to RK4, so L = I(t)ω(t) is an output whose drift is printed. The dashed line lying underneath the solid one is the algebraic answer L₀/I(t), which the stepper never saw.',
   note:'The other three scenes give a before and an after, and <b>two numbers can always be made to conserve something</b> — given I₁, ω₁ and I₂ there is exactly one ω₂ that works, so the scene cannot be caught being wrong. Writing I(t) turns the same statement into a differential equation that has to be integrated, at which point conservation becomes something the answer either has or does not. The energy is handled the same way: differentiating K = L²/2I gives a power of <b>−½İω²</b>, the work whatever hauls the mass inwards has to do, and integrating that along the track must reproduce what the two endpoints report. Then push it — type <b>3 + 2·cos(t)</b> and run for 2π seconds. L never moved, ω comes home to its opening value, and the net work over the cycle is zero, because everything pulled in was let back out. Nothing about that had to be true of a quantity that is not conserved, which is precisely why it is worth watching.'},
  {n:'Couple two bodies you built, and find the heat', ex:'the grip sets how long, never how much', stage:'rtEnergy',
   opts:{ mode:'custom' },
   out:'Two assemblies brought into contact through a clutch. The coupling is integrated rather than solved: a friction torque acts on each body until the speeds meet, the total L is measured along the way, and the heat is accumulated as ∫τ|ω₁−ω₂|dt. Sweeping the clutch torque over a factor of 128 changes the slipping time by that same factor and the energy lost by nothing at all.',
   note:'The textbook does this in one line — L is conserved, so ω_f = ΣIω/ΣI and the missing energy is whatever is left over. True, and it hides the interesting claim. Integrating the coupling puts that claim where it can be tested: the heat is a genuine quadrature over the sliding surface, friction torque times the speed it slides at, and it is compared with <b>½·(I₁I₂/(I₁+I₂))·(Δω)²</b> — a closed form in which the clutch torque <b>does not appear at all</b>. That is the rotational twin of ½μ(Δu)² for a perfectly inelastic linear collision, reduced mass and all. Two samples would prove nothing about an invariance, so the panel sweeps the grip over two orders of magnitude and prints the spread. And the conservation itself is not imposed anywhere: the stepper is given equal and opposite torques on the two bodies, and I₁ω₁ + I₂ω₂ holding still is Newton\'s third law showing up as a conserved total.'}
]}];
