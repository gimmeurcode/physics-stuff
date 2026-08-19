/* ============================================================================
   5k · A COLLISION THE READER WRITES, AND A SOURCE THEY POINT
   Programme A relativity items 18 (rlDopp) and 19 (rlDyn), 2026-08-19, closing
   the relativity block. Units: c = 1, energies and momenta in the same units
   as mass.

   ------------------------------------------------------------------ item 19 --
   A COLLISION IS A SUM OF FOUR-VECTORS, AND THAT IS ALL IT IS.

   The reader lists particles — a mass and a velocity each, in or out — and the
   panel adds their four-momenta. Three things are then measurable rather than
   assumed:

     · ENERGY AND MOMENTUM ARE CONSERVED, or the reaction the reader wrote is
       not a reaction. The residual is printed against the gross ΣE, because a
       momentum sum can legitimately vanish (a head-on collision in the centre
       of momentum) and a residual scaled against zero says nothing.
     · THE INVARIANT MASS √(E² − p²) OF THE WHOLE SYSTEM is the same before and
       after, and the same in every frame — checked by boosting the entire list
       and recomputing. It is NOT the sum of the individual masses, and the
       difference is exactly the kinetic energy that went into binding or heat.
     · AN INELASTIC COLLISION RAISES THE REST MASS. Two lumps of clay meeting
       head-on at β make one lump of mass 2γm, not 2m; the kinetic energy did
       not vanish, it became mass. That is E = mc² as an arithmetic identity
       rather than a slogan, and the panel measures the increase.

   THE THING THAT IS NOT CONSERVED IS THE SUM OF THE MASSES. Writing Σm on
   both sides and comparing is the commonest way to get this wrong, so the
   panel prints Σm beside the invariant mass and shows them diverging.

   ------------------------------------------------------------------ item 18 --
   A SOURCE THE READER POINTS, AND THE ONE SHIFT WITH NO CLASSICAL COUNTERPART.

   The Doppler factor is δ = 1/[γ(1 − β cos θ)] where θ is the angle in the
   OBSERVER's frame. Three regimes, and the third is the interesting one:

     θ = 0     approaching: δ = √((1+β)/(1−β)), the classical shift amplified.
     θ = π     receding: δ = √((1−β)/(1+β)).
     θ = π/2   TRANSVERSE: the classical shift is exactly zero — there is no
               line-of-sight motion at all — and δ = 1/γ remains. A pure
               redshift, entirely time dilation, with nothing in Newtonian
               physics to produce it. Ives and Stilwell measured it in 1938.

   And the sky rearranges: aberration maps the emission angle θ′ to the arrival
   angle θ, squeezing an isotropic emitter's light into a forward cone of
   half-angle ≈ 1/γ, and brightening it there by δ⁴. Two of those four powers
   are the photon rate and the energy per photon; the other two are the solid
   angle contracting. `rlBeamPower` returns them separately, because "δ to the
   fourth" is four different physical facts multiplied together and it is worth
   seeing which is which.
   ============================================================================ */

/* ---- item 19 · a collision the reader writes ------------------------------ */

/* One particle per line: `m β [name]`, or `m β θ [name]` to send it off-axis by
   θ degrees in the x–y plane. A leading `-` on the mass is not a negative mass —
   there is no such thing here — so it is refused by name. */
function rlCollideParse(text, def){
  const rows = [], errs = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if(!line) return;
    const t = line.split(/[\s,]+/).filter(s => s.length);
    if(t.length < 2){ errs.push({ line:i + 1, msg:'a mass and a speed, then an optional angle and name' }); return; }
    const m = mathNum(t[0]), b = mathNum(t[1]);
    if(!Number.isFinite(m)){ errs.push({ line:i + 1, msg:'"' + t[0] + '" is not a mass' }); return; }
    if(!(m >= 0)){ errs.push({ line:i + 1, msg:'a mass cannot be negative — there is no such particle' }); return; }
    if(!Number.isFinite(b)){ errs.push({ line:i + 1, msg:'"' + t[1] + '" is not a speed' }); return; }
    if(!(Math.abs(b) < 1) && m > 0){
      errs.push({ line:i + 1, msg:'β = ' + fmtSig(b, 4) + ' — only a massless particle travels at c' });
      return;
    }
    if(m === 0 && Math.abs(b) !== 1){
      errs.push({ line:i + 1, msg:'a massless particle travels at exactly c — write its β as 1 or −1' });
      return;
    }
    let th = 0, name = '';
    if(t.length > 2 && Number.isFinite(mathNum(t[2]))){ th = mathNum(t[2]); name = t.slice(3).join(' '); }
    else name = t.slice(2).join(' ');
    rows.push({ m, beta:b, theta:th * Math.PI / 180, name:name || ('particle ' + (rows.length + 1)) });
  });
  if(rows.length > 8) errs.push({ line:0, msg:'eight particles is the most this will take' });
  return { parts: rows.length && rows.length <= 8 ? rows : (def || []), errs };
}

/* the four-momentum of one particle. A massless one carries E = |p| and its
   speed is not a free parameter, so it is handled by its own branch rather
   than by letting γ run away. */
function rlFourMomentum(p){
  if(p.m === 0){
    const E = p.E === undefined ? 1 : p.E;      /* a photon needs an energy, not a γ */
    return { E, px:E * Math.cos(p.theta) * Math.sign(p.beta || 1),
             py:E * Math.sin(p.theta) * Math.sign(p.beta || 1), pz:0, m:0 };
  }
  const g = relGamma(p.beta), E = g * p.m, pm = g * p.m * p.beta;
  return { E, px:pm * Math.cos(p.theta), py:pm * Math.sin(p.theta), pz:0, m:p.m };
}
const rlSumP = list => list.reduce((s, p) => {
  const q = rlFourMomentum(p);
  return { E:s.E + q.E, px:s.px + q.px, py:s.py + q.py, pz:s.pz + q.pz };
}, { E:0, px:0, py:0, pz:0 });

/* boost a four-momentum along x — the whole system, so the invariant can be
   checked in a frame nobody chose */
function rlBoostP(q, beta){
  const g = relGamma(beta);
  return { E:g * (q.E - beta * q.px), px:g * (q.px - beta * q.E), py:q.py, pz:q.pz };
}
const rlMassOf = q => Math.sqrt(Math.max(0, q.E * q.E - (q.px * q.px + q.py * q.py + q.pz * q.pz)));

/* Everything the panel prints. `before` and `after` are two lists; if `after`
   is empty the panel reports the incoming system only, which is what a reader
   building one up will see first. */
function rlCollideMeasure(before, after){
  const out = { ok:false, why:'' };
  if(!before.length){ out.why = 'nothing is coming in'; return out; }
  const A = rlSumP(before), B = after.length ? rlSumP(after) : null;
  out.ok = true;
  out.pin = A; out.pout = B;
  out.mIn = rlMassOf(A);
  out.sumMIn = before.reduce((s, p) => s + p.m, 0);
  out.grossE = before.reduce((s, p) => s + rlFourMomentum(p).E, 0);
  /* the invariant mass in a frame nobody chose — the check that it IS one */
  out.mInBoost = rlMassOf(rlBoostP(A, 0.63));
  out.boostGap = Math.abs(out.mInBoost - out.mIn);
  if(B){
    out.mOut = rlMassOf(B);
    out.sumMOut = after.reduce((s, p) => s + p.m, 0);
    out.dE = Math.abs(B.E - A.E);
    out.dp = Math.hypot(B.px - A.px, B.py - A.py, B.pz - A.pz);
    out.grossP = before.concat(after).reduce((s, p) => {
      const q = rlFourMomentum(p); return s + Math.hypot(q.px, q.py, q.pz);
    }, 0);
    out.conserves = out.dE < 1e-9 * out.grossE && out.dp < 1e-9 * Math.max(1e-30, out.grossP);
    out.massGap = Math.abs(out.mOut - out.mIn);
    /* the rest mass the collision CREATED, which is the kinetic energy that
       stopped being kinetic */
    out.made = out.sumMOut - out.sumMIn;
  }
  /* the centre-of-momentum frame, and the energy available there */
  out.betaCM = A.E > 0 ? A.px / A.E : 0;
  return out;
}

const RL_COLLIDES = {
  clay:    { name:'two lumps of clay, head on', short:'inelastic',
             before:'1 0.6 left\n1 -0.6 right', after:'2.5 0 the lump',
             conserves:true,
             why:'Each lump has mass 1 and γ = 1.25, so the pair carries 2.5 of energy and no momentum. They stop dead — and the single lump left behind has mass <b>2.5</b>, not 2. The kinetic energy did not go anywhere: it <i>is</i> the extra mass.' },
  elastic: { name:'a glancing elastic collision', short:'elastic',
             before:'1 0.8 0 incoming\n1 0 0 target',
             after:'1 0.6 30 out A\n1 0.6 -30 out B',
             conserves:false,
             why:'Deliberately <b>not</b> conserved — the outgoing pair was written by hand and does not balance. The panel says so and prints by how much, which is the point: a reaction is not a reaction because you wrote an arrow.' },
  pair:    { name:'two photons making a pair', short:'photons',
             before:'0 1 0 gamma\n0 -1 0 gamma', after:'',
             conserves:true,
             why:'Two massless particles head-on, each of energy 1. Their total four-momentum has zero momentum and energy 2, so the <b>invariant mass of the pair is 2</b> — massless particles making a massive system, which is where most of a proton\'s mass comes from.' },
  beam:    { name:'a fixed-target beam', short:'fixed target',
             before:'1 0.99 beam\n1 0 target', after:'',
             conserves:true,
             why:'γ = 7.09, so the beam carries 7.09 of energy — and the invariant mass of the pair is only 4.02, which is all a fixed-target machine can turn into new particles. Collide the two head-on instead and it would be 14.2. That factor is why colliders exist.' }
};

/* ---- item 18 · a source the reader points --------------------------------- */

/* The Doppler factor, the aberration, and the four powers of δ separated out,
   because "brightened by δ⁴" is four different facts multiplied together. */
function rlBeamPower(beta, theta){
  relCheckBeta(beta);
  const d = relDoppler(beta, theta);
  return {
    delta:d,
    /* the four powers, named */
    energyPerPhoton:d,          /* each photon is blueshifted            */
    arrivalRate:d,              /* and they arrive more often            */
    solidAngle:d * d,           /* and the cone they occupy shrinks by δ² */
    total:Math.pow(d, 4),
    /* where an emission angle lands, and the half-angle of the beam */
    cosArrival:relAberration(Math.cos(theta), beta),
    beamHalfAngle:relBeamingAngle(beta),
    beamFraction:relBeamFraction(beta),
    /* the three named regimes */
    approaching:relDoppler(beta, 0),
    receding:relDoppler(beta, Math.PI),
    transverse:relTransverseDoppler(beta)
  };
}

/* the angle at which the shift vanishes — δ = 1, neither red nor blue. It is
   NOT 90°, and that is the whole content of the transverse effect: the
   classical null is at 90° and the relativistic one is pushed forward to
   cos θ = (1 − 1/γ)/β, because time dilation has to be cancelled by a real
   approach before the net shift can be zero. */
function rlDopplerNull(beta){
  if(Math.abs(beta) < 1e-15) return { theta:Math.PI / 2, cos:0, ok:true };
  const c = (1 - 1 / relGamma(beta)) / beta;
  if(!(Math.abs(c) <= 1)) return { ok:false, why:'no angle gives an unshifted signal at this speed' };
  return { ok:true, cos:c, theta:Math.acos(c) };
}

const RL_SOURCES = {
  slow:    { name:'a slow source', short:'slow',
             beta:0.1, theta:90,
             why:'β = 0.1, and the transverse shift is 1/γ = 0.995 — half a per cent, entirely time dilation, with no classical counterpart at all. Ives and Stilwell measured exactly this on a hydrogen ion beam in 1938.' },
  fast:    { name:'a relativistic jet', short:'a jet',
             beta:0.95, theta:10,
             why:'Pointed nearly at us at 0.95c: δ = 6.1, so the light is blueshifted six-fold and brightened by δ⁴ ≈ 1 400. The jet pointing the other way is dimmed by the same factor, which is why relativistic jets so often look one-sided.' },
  transverse:{ name:'exactly side-on', short:'side-on',
             beta:0.8, theta:90,
             why:'No line-of-sight motion whatever, and still a redshift: δ = 1/γ = 0.6. Nothing in Newtonian physics produces this, and it is the cleanest direct measurement of time dilation there is.' },
  cmb:     { name:'the Local Group through the CMB', short:'the CMB',
             beta:0.00123, theta:0,
             why:'Our own 370 km/s drift, which shows up as a 3.36 mK dipole in the microwave background — one part in a thousand hotter ahead than behind. It is the largest Doppler shift anyone has measured, and it is us.' }
};
