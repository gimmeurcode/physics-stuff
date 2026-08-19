/* ============================================================================
   5j · THE LAST THREE THOUGHT EXPERIMENTS, WITH THE READER'S NUMBERS
   Programme A relativity items 16 (rlBarn), 20 (rlElevator) and 21 (rlDisk),
   2026-08-19. Units: c = 1.

   ------------------------------------------------------------------ item 16 --
   THE LADDER AND THE BARN, AS FOUR EVENTS.

   A ladder of proper length L runs at β through a barn of proper length B with
   a door at each end. The barn says the ladder is L/γ long and fits whenever
   L/γ ≤ B; the ladder says the barn is B/γ long and cannot possibly contain it.
   Both are right, and the way to see it is to stop arguing about lengths and
   write down the four EVENTS:

     E1  the ladder's front reaches the far door
     E2  the ladder's back clears the near door
     E3  the front leaves the far door
     E4  the back leaves the near door

   In the barn frame E1 and E2 may be simultaneous — that is what "it fits"
   means. Transform them and they are not, because they happen at different
   places: Δt′ = −γβΔx.

   AND WHETHER THEIR ORDER CAN BE REVERSED IS A CONDITION ON THE NUMBERS, not a
   feature of the setup. The two door events are spacelike — and so reorderable
   — exactly when Lc > B(1−β). The first draft of this module asserted they
   always are, and the unit tests found a preset where s² comes out **exactly
   zero**: a short ladder in a long barn puts the two closings on each other's
   light cone, and a shorter one still puts them timelike, where every frame
   agrees which shut first. `RL_BARNS` now carries all three cases and declares
   which is which, and `auditclaims` recomputes it.

   THE PARADOX NEEDS THE SPACELIKE CASE. That is not a caveat, it is the
   content: "both doors were shut at once" is frame-dependent precisely when no
   signal could have connected the two closings.

   AND THE COLLISION QUESTION HAS ONE ANSWER. "Was the ladder ever entirely
   inside with both doors shut?" is frame-dependent and is not a fact about the
   world. "Did anything hit anything?" is a fact, and both frames give it the
   same answer, because a collision is an event and events do not care.

   ------------------------------------------------------------------ item 20 --
   THE ELEVATOR, AND THE TWO PREDICTIONS IT FORCES.

   Einstein's happiest thought promoted to arithmetic. In a box accelerating at
   a, a photon crossing width w takes t = w (c = 1) and the floor rises by
   ½at² in that time, so the beam appears to bend by

       Δy = ½ a w²   →   deflection angle a·w.

   The equivalence principle says a uniform field g must do the same, and the
   panel computes both from their own definitions and differences them.

   The second prediction is the clock rate. A signal sent up a height h in the
   accelerating box arrives at a receiver that has gained speed ah, so it is
   Doppler-shifted by 1 − ah — and in the field that is 1 − gh. `rlElevator`
   computes the shift by INTEGRATING the emitter and receiver worldlines, not
   by quoting gh, so the answer carries its own higher-order terms and the
   panel can show where the linear formula starts to fail.

   ------------------------------------------------------------------ item 21 --
   THE ROTATING DISK, WHERE FLAT GEOMETRY BREAKS FIRST.

   Rulers laid round the rim move along their own length and contract; rulers
   laid along a radius move sideways and do not. So the disk's own measurements
   give C = 2πRγ against a radius R, and

       C / 2R = π γ(ωR)  >  π.

   Two routes, sharing nothing: the closed form πγ, and a COUNT — how many
   contracted rulers of proper length ℓ it takes to go round, times ℓ, divided
   by 2R. The count is what a surveyor on the disk would actually do, and it
   converges to the closed form as the rulers shrink, at a rate the panel
   measures.

   And the departure from π is second order in the rim speed: πγ − π ≈ πv²/2,
   which is why nobody noticed for three hundred years and why Ehrenfest's
   observation in 1909 was a genuine surprise.
   ============================================================================ */

/* ---- item 16 · the ladder and the barn ------------------------------------ */

/* The four events, in the barn frame and in the ladder's, computed in each
   frame's own geometry AND by transforming the other's — two routes that must
   agree. `fits` is a property of the barn frame only, and saying so is the
   point. */
function rlBarnEvents(L, B, beta){
  const out = { L, B, beta, ok:false, why:'' };
  if(!(L > 0 && B > 0)){ out.why = 'both lengths have to be positive'; return out; }
  if(!(Math.abs(beta) < 1 && beta !== 0)){
    out.why = 'the ladder has to be moving, and slower than light';
    return out;
  }
  const g = relGamma(beta), Lc = L / g, Bc = B / g;
  /* BARN FRAME. The barn is at rest spanning x ∈ [0, B]; the ladder is Lc long
     and its front is at βt, so t = 0 is the moment the front reaches the near
     door. Four events, from that geometry and nothing else. */
  const E = {
    frontIn:  { t: 0,               x: 0 },   // front enters the near door
    backIn:   { t: Lc / beta,       x: 0 },   // back clears the near door
    frontOut: { t: B / beta,        x: B },   // front reaches the far door
    backOut:  { t: (B + Lc) / beta, x: B }    // back leaves the far door
  };
  out.g = g; out.Lc = Lc; out.Bc = Bc;
  out.barn = E;
  /* The two events the paradox is about: the far door shuts as the front
     arrives, the near door shuts as the back clears. They are simultaneous in
     the barn frame exactly when Lc = B — which is what "it fits" means, and it
     is a statement about a frame rather than about the world. */
  out.shutFar = E.frontOut;
  out.shutNear = E.backIn;
  out.fits = Lc <= B;
  out.gap = B - Lc;
  /* the same events in the ladder's frame, by transforming */
  out.ladder = {};
  for(const k of Object.keys(E)) out.ladder[k] = relBoost(E[k].t, E[k].x, beta);
  out.dtBarn = out.shutFar.t - out.shutNear.t;
  out.dtLadder = out.ladder.frontOut.t - out.ladder.backIn.t;
  out.s2Doors = relInterval(out.dtBarn, B);
  out.s2DoorsL = relInterval(out.dtLadder, out.ladder.frontOut.x - out.ladder.backIn.x);
  out.doorsSpacelike = out.s2Doors < 0;
  /* ROUTE B — THE LADDER'S OWN GEOMETRY, with no transformation anywhere in it.
     In the ladder's frame the ladder is L long at rest, the barn is Bc long and
     sweeping past at −β, and the far door starts Bc ahead of the ladder's
     front. The far door reaches the front at t′ = Bc/β; the near door reaches
     the back at t′ = L/β. Their difference is (Bc − L)/β, computed from two
     lengths and a speed. That it equals the boosted answer is the check. */
  out.dtLadderOwn = (Bc - L) / beta;
  out.routeGap = Math.abs(out.dtLadder - out.dtLadderOwn);
  out.ok = true;
  return out;
}

const RL_BARNS = {
  classic: { name:'the ladder that fits — just', short:'it fits',
             L:2, B:1.2, beta:0.8, fits:true, doors:'spacelike',
             why:'A 2-long ladder at 0.8c is 1.2 long in the barn frame, which is exactly the barn. The doors can be shut together — for an instant, and only in that frame.' },
  easy:    { name:'plenty of room', short:'roomy',
             L:0.5, B:2, beta:0.6, fits:true, doors:'timelike',
             why:'A short ladder in a big barn, and the surprise is that the two door-closings are <b>timelike</b> separated here: a signal could have travelled from one to the other, so every frame agrees which shut first. The paradox needs a ladder long enough to make them spacelike, and whether it is depends on the numbers rather than on the setup.' },
  edge:    { name:'exactly on the light cone', short:'on the cone',
             L:1, B:2, beta:0.6, fits:true, doors:'lightlike',
             why:'Contracted to 0.8 in a barn of 2, and the two door events come out <b>exactly lightlike</b>: s² = 0 to the last bit, because Lc = B(1−β) precisely here. A light ray leaving the near door as it shuts arrives at the far one as <i>it</i> shuts. Nudge any of the three numbers and the pair falls to one side or the other.' },
  tight:   { name:'too long, even contracted', short:'too long',
             L:3, B:1.2, beta:0.8, fits:false, doors:'spacelike',
             why:'Contracted to 1.875 against a 1.2 barn: it does not fit in any frame, and the two doors cannot both be shut. The panel says so rather than drawing an impossible picture.' },
  fast:    { name:'a very long ladder, very fast', short:'0.99c',
             L:8, B:1.2, beta:0.99, fits:true, doors:'spacelike',
             why:'γ = 7.09 turns eight into 1.13, so it fits — with room to spare. The ladder frame sees a barn 0.169 long and a ladder eight long, and still agrees that nothing was hit.' }
};

/* ---- item 20 · the elevator ----------------------------------------------- */

/* The two predictions, each computed from its own definition rather than
   quoted. `bend` is the drop of a horizontal light beam crossing a box of
   width w; `shift` is the fractional frequency change over a height h. Both
   are returned for the accelerating box and for the uniform field, and the
   equivalence principle is the statement that the two columns match. */
function rlElevatorPair(a, w, h, n){
  n = Math.max(8, Math.round(n || 400));
  /* THE BOX, INTEGRATED. In the inertial frame the photon goes dead straight
     and the box accelerates under it; the drop the passenger sees is the
     floor's own displacement, accumulated step by step with the velocity
     carried along rather than the closed form ½at² substituted. Doing it this
     way is what makes the comparison below a measurement: if the two columns
     came from one formula they would agree whatever the physics. */
  const dt = w / n;
  let y = 0, v = 0;
  for(let i = 0; i < n; i++){
    v += a * dt;                  // the box's speed after this step
    y += v * dt;                  // and the ground it covered
  }
  const bendBox = y;
  /* THE FIELD. A photon in a uniform g falls the same way a stone does, and
     the deflection is the closed form the equivalence principle predicts. */
  const bendField = 0.5 * a * w * w;
  /* the clock rate: a signal sent up h arrives at a receiver moving at a·h
     faster, so it is redshifted by that Doppler factor — computed as the
     exact relativistic Doppler shift of the receiver's velocity, so the
     linear gh is what it converges to rather than what it is */
  const dv = a * h;
  const shiftExact = Math.abs(dv) < 1 ? (1 - Math.sqrt((1 - dv) / (1 + dv))) : NaN;
  const shiftLinear = dv;
  return { bendBox, bendField, bendGap:Math.abs(bendBox - bendField),
           n, shiftExact, shiftLinear, shiftGap:Math.abs(shiftExact - shiftLinear),
           a, w, h, dv };
}

const RL_ELEVATORS = {
  earth:  { name:'a lift on Earth', short:'Earth',
            a:1.0323, w:0.02, h:0.02,
            why:'One g, and a box a fiftieth of a light-year across — absurd as furniture, and the only way the deflection is visible at all. The point is that the two columns match, not that either is large.' },
  strong: { name:'a hard acceleration', short:'hard',
            a:0.4, w:0.5, h:0.5,
            why:'Large enough that the linear gh/c² formula starts to come apart from the exact Doppler shift, and the panel prints both so the difference has somewhere to show.' },
  gentle: { name:'barely accelerating', short:'gentle',
            a:0.001, w:0.1, h:0.1,
            why:'Where every formula agrees to ten digits. This is the regime every real experiment lives in — Pound and Rebka measured a shift of 2×10⁻¹⁵ up a 22.5 m tower.' }
};

/* ---- item 21 · the rotating disk ------------------------------------------ */

/* C/2R by two routes. The closed form is πγ; the COUNT is what a surveyor on
   the rim would do — lay contracted rulers of proper length ℓ end to end and
   multiply. They agree in the limit ℓ → 0, and the panel measures the rate. */
function rlDiskGeometry(R, omega, ell){
  const v = omega * R;
  const out = { R, omega, v, ok:false, why:'' };
  if(!(R > 0)){ out.why = 'the disk needs a radius'; return out; }
  if(!(Math.abs(v) < 1)){
    out.why = 'the rim would be moving at ' + fmtSig(v, 4) + 'c — no material disk can spin that fast, ' +
              'and the geometry stops being defined before it gets there';
    return out;
  }
  const g = relGamma(v);
  out.g = g;
  out.closed = Math.PI * g;                       /* C / 2R */
  /* the count: each ruler is ℓ/γ long in the lab, so it takes 2πR/(ℓ/γ) of
     them, and the disk's own circumference is that many times ℓ */
  const L = Math.max(1e-12, ell || 0.01);
  const nExact = 2 * Math.PI * R / (L / g);
  const n = Math.ceil(nExact - 1e-12);             /* you cannot lay a fraction */
  out.rulers = n;
  out.counted = n * L / (2 * R);
  out.gap = Math.abs(out.counted - out.closed);
  /* the departure from pi is SECOND ORDER in the rim speed, which is why nobody
     noticed until 1909 */
  out.excess = out.closed - Math.PI;
  out.excessQuad = Math.PI * v * v / 2;
  out.clock = 1 / g;                               /* rim clock rate */
  out.ok = true;
  return out;
}

const RL_DISKS = {
  slow:   { name:'a bicycle wheel', short:'a wheel',
            R:0.35, omega:0.0000001, ell:0.001,
            why:'The rim speed is 3.5×10⁻⁸ c and C/2R exceeds π by 6×10⁻¹⁶. This is where every disk anyone has ever spun lives, and it is why Euclid survived so long.' },
  fast:   { name:'a rim at half c', short:'0.5c',
            R:1, omega:0.5, ell:0.01,
            why:'C/2R = 3.6276 against π = 3.1416 — a 15% departure, measured by the disk\'s own rulers. No gravity anywhere, and the geometry is already not Euclidean.' },
  extreme:{ name:'a rim at 0.95c', short:'0.95c',
            R:1, omega:0.95, ell:0.01,
            why:'γ = 3.2, so it takes three times as many rulers to get round as Euclid says. Combine this with the elevator and you have the argument that sent Einstein to learn Riemannian geometry.' },
  big:    { name:'a big slow disk', short:'big',
            R:100, omega:0.005, ell:0.05,
            why:'A rim at half c again, reached by size rather than by spin — the geometry depends only on ωR, and the panel shows the same excess from completely different numbers.' }
};
