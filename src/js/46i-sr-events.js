/* ============================================================================
   5i · A LIGHT CLOCK THE READER SHAPES, AND AN EVENT PAIR THEY PLACE
   Programme A relativity items 14 (rlClock), 15 (rlTrain) and 17 (rlChase),
   2026-08-19. Units: c = 1.

   ------------------------------------------------------------------ item 14 --
   A LIGHT CLOCK IS A PATH LENGTH, NOT A FORMULA.

   The textbook light clock has its mirror straight up, because that is the case
   Pythagoras does in one line. Put the mirror anywhere — at any angle, at any
   distance — and the same clock still runs slow by exactly γ, and *that* is the
   statement worth measuring. Here the reader places the mirror at (Lx, Ly) and
   the tick is computed from the light's actual path:

     REST FRAME   the light goes out to the mirror and back: a path of length
                  2|L|, so the tick is 2|L| and nothing else enters.
     LAB FRAME    the mirror is moving, so the light must chase a target that
                  runs away and then meet an emitter that has moved on. Solving
                  |light path| = c·t on each leg gives two DIFFERENT times —
                  the out leg and the back leg are not equal, and for a mirror
                  along the motion they differ enormously — whose SUM is γ times
                  the rest tick, always.

   THE UNEQUAL LEGS ARE THE POINT AND THE TRAP. A clock with its arm across the
   motion has equal legs, which is why every textbook draws that one; a clock
   with its arm along the motion has legs in the ratio (1+β)/(1−β), and the
   average is what Michelson and Morley were measuring when they found nothing.
   `rlClockTick` returns both legs separately so the panel can show that the
   halves differ and the total does not.

   ------------------------------------------------------------------ item 15 --
   AN EVENT PAIR, AND WHEN ITS ORDER CAN BE REVERSED.

   Two events (t₁,x₁) and (t₂,x₂) with Δt > 0. Under a boost,
   Δt′ = γ(Δt − βΔx), so the order reverses exactly when β > Δt/Δx — which is
   possible **only if |Δx| > |Δt|**, i.e. only if the pair is SPACELIKE. That is
   causality: the order of events that can influence one another is the same for
   everybody, and the order of events that cannot is not.

   `rlEventCross` returns the β at which the order flips, or the reason there is
   none. The reason matters more than the number: a timelike pair has no such β
   **because tanh is bounded**, not because the formula happens to give
   something over 1, and a lightlike pair needs β = 1 exactly.

   ------------------------------------------------------------------ item 17 --
   AND THE CLOSING RATE, WHICH IS NOT A VELOCITY.

   A pursuer at β chasing a signal at β_s: in the lab the gap closes at
   β_s − β, which for light is 1 − β and can be made as small as you like. In
   the pursuer's own frame the signal recedes at (β_s − β)/(1 − β_s β), which
   for light is exactly 1 for every β. Both numbers are correct and they are
   answers to different questions — the first is a rate of change of a
   coordinate difference and is not anybody's velocity, which is why it may
   exceed c (two signals approaching head-on close at 2 in the lab) without
   anything moving faster than light.
   ============================================================================ */

/* ---- item 14 · a light clock of any shape --------------------------------- */

/* One tick, in both frames, from the light's PATH rather than from a formula.

   In the lab the mirror at rest position L moves at β. The out leg solves
   |L + β t_out x̂ − 0| = t_out, i.e. a quadratic in t_out; the back leg solves
   the same going the other way. Both roots are taken positive, and the identity
   the panel checks is t_out + t_back = γ · 2|L| — for ANY L, not just L ⊥ β. */
function rlClockTick(Lx, Ly, beta){
  const L2 = Lx * Lx + Ly * Ly, L = Math.sqrt(L2);
  const out = { L, rest: 2 * L, ok:false, why:'' };
  if(!(L > 0)){ out.why = 'the mirror has to be somewhere other than the emitter'; return out; }
  if(!(Math.abs(beta) < 1)){ out.why = 'the clock must move slower than light'; return out; }
  const g = relGamma(beta);
  /* THE ARM CONTRACTS ALONG THE MOTION, and forgetting it is the whole history
     of this experiment. (Lx, Ly) is the mirror's offset in the CLOCK's frame;
     in the lab the longitudinal part is Lx/γ and the transverse part is
     untouched. Written without that division the along-the-motion clock ticks
     3.125 against the across-the-motion clock's 2.5 at β = 0.6 — a 25%
     discrepancy between two arms of one instrument, which is exactly the
     fringe shift Michelson and Morley went looking for and did not find. The
     unit tests caught it on their first run. */
  const lx = Lx / g, ly = Ly;
  const D2 = lx * lx + ly * ly;
  /* out leg: (lx + β t)² + ly² = t²  ⇒  (1 − β²)t² − 2βlx t − D² = 0 */
  const a = 1 - beta * beta, b = -2 * beta * lx, c = -D2;
  const disc = b * b - 4 * a * c;
  if(!(disc >= 0)){ out.why = 'the light cannot reach the mirror'; return out; }
  const tOut = (-b + Math.sqrt(disc)) / (2 * a);
  /* back leg: the light starts from where the mirror was at t_out and meets an
     emitter that has moved on — the same quadratic with the offset reversed */
  const b2 = 2 * beta * lx, disc2 = b2 * b2 - 4 * a * c;
  const tBack = (-b2 + Math.sqrt(disc2)) / (2 * a);
  out.ok = true;
  out.lx = lx; out.ly = ly;
  out.tOut = tOut; out.tBack = tBack; out.lab = tOut + tBack;
  out.gamma = g; out.expect = g * 2 * L;
  out.ratio = out.lab / out.rest;
  out.legRatio = tBack > 0 ? tOut / tBack : Infinity;
  /* where things are, for the picture and for the check that each leg really is
     a null path — the light must travel exactly c·t on both */
  out.mirrorAt = v3(lx + beta * tOut, ly, 0);
  out.emitterAt = v3(beta * out.lab, 0, 0);
  out.pathOut = Math.hypot(lx + beta * tOut, ly);
  out.pathBack = Math.hypot(lx + beta * tOut - beta * out.lab, ly);
  out.nullOut = Math.abs(out.pathOut - tOut);
  out.nullBack = Math.abs(out.pathBack - tBack);
  return out;
}

/* ---- item 15 · an event pair ---------------------------------------------- */

/* The boost at which the order of two events reverses — or the reason there is
   none. Δt′ = γ(Δt − βΔx) vanishes at β = Δt/Δx, and |β| < 1 requires
   |Δx| > |Δt|, which is exactly "spacelike". */
function rlEventCross(dt, dx){
  const s2 = dt * dt - dx * dx;
  const out = { dt, dx, s2, kind:relIntervalKind(s2), beta:null, why:'' };
  if(Math.abs(dx) < 1e-15){
    out.why = 'the two events are at the same place, so no boost along x can ' +
              'change which came first — Δt′ = γΔt has the sign of Δt';
    return out;
  }
  const b = dt / dx;
  if(Math.abs(b) < 1){ out.beta = b; return out; }
  if(Math.abs(b) === 1){
    out.why = 'these two events are joined by a light ray, so the order flips ' +
              'only at exactly c — which is to say it does not flip';
    return out;
  }
  out.why = 'this pair is timelike: reversing it needs β = ' + fmtSig(b, 4) +
            ', and tanh is bounded by 1. One event can influence the other, and ' +
            'every observer agrees which came first';
  return out;
}

/* the pair, transformed, so the panel can print both frames */
function rlEventPair(t1, x1, t2, x2, beta){
  const A = relBoost(t1, x1, beta), B = relBoost(t2, x2, beta);
  const dt = t2 - t1, dx = x2 - x1;
  const dtp = B.t - A.t, dxp = B.x - A.x;
  return { A, B, dt, dx, dtp, dxp,
           s2: relInterval(dt, dx), s2p: relInterval(dtp, dxp),
           flipped: dt * dtp < 0 };
}

/* ---- item 17 · closing rates ---------------------------------------------- */

/* Two numbers that are both right and answer different questions. `lab` is the
   rate at which a coordinate gap shrinks and is not anybody's velocity — it may
   exceed 1 without anything moving faster than light. `own` is what the pursuer
   measures, and for a light signal it is exactly 1 for every β. */
function rlCloseRate(bChase, bSignal){
  relCheckBeta(bChase);
  const lab = bSignal - bChase;
  const own = (bSignal - bChase) / (1 - bSignal * bChase);
  return { lab, own, chase:bChase, signal:bSignal,
           exceedsLab: Math.abs(lab) > 1, exceedsOwn: Math.abs(own) > 1 };
}

/* ---- the tables ----------------------------------------------------------- */

/* Mirror positions, in units of the clock's own arm. `legs` declares whether
   the two halves of the tick are equal, which is true only for a mirror
   exactly across the motion — and is the whole reason the textbook draws that
   one. */
const RL_CLOCKS = {
  across:  { name:'the textbook clock — mirror straight across', short:'across',
             Lx:0, Ly:1, legs:'equal',
             why:'The case Pythagoras does in one line, and the only one whose two halves take the same time. Every other orientation gives the same γ by a messier route, which is the point.' },
  along:   { name:'mirror straight ahead', short:'along',
             Lx:1, Ly:0, legs:'unequal',
             why:'The light chases a mirror running away, then meets an emitter running towards it. The two legs are in the ratio (1+β)/(1−β) — at β = 0.6 that is 4 — and their sum is still exactly γ times the rest tick. This is the arm Michelson and Morley expected to disagree with the other one.' },
  behind:  { name:'mirror straight behind', short:'behind',
             Lx:-1, Ly:0, legs:'unequal',
             why:'The same as ahead with the legs swapped: the short leg first. The tick is identical, which is what it means for the clock not to care which way it is pointing.' },
  diag:    { name:'mirror at 45°', short:'diagonal',
             Lx:0.7071067811865476, Ly:0.7071067811865476, legs:'unequal',
             why:'Neither along nor across. The legs differ, the geometry has no symmetry to lean on, and the answer is γ to the last digit — which is what "no experiment can detect uniform motion" actually means.' },
  steep:   { name:'a long arm at a shallow angle', short:'shallow',
             Lx:1.8, Ly:0.3, legs:'unequal',
             why:'Mostly along the motion, so the legs are lopsided, and the arm is nearly twice as long. Neither changes the ratio: the tick scales with the arm and the ratio does not.' }
};

/* Event pairs. `kind` and `flips` are claims recomputed by auditclaims from the
   coordinates alone. */
const RL_EVENTS = {
  lightning: { name:'lightning at both ends of the train', short:'the train',
               t1:0, x1:-1, t2:0, x2:1, kind:'spacelike', flips:true,
               why:'Simultaneous in the embankment frame and 2 apart, so ANY boost reorders them — the crossover is at β = 0. This is the pair the whole subject starts from.' },
  causal:    { name:'a signal sent and received', short:'causal',
               t1:0, x1:0, t2:2, x2:1, kind:'timelike', flips:false,
               why:'Something slower than light could carry the influence, so every frame agrees which came first. Reversing it would need β = 2, and tanh is bounded.' },
  lightray:  { name:'the two ends of a light ray', short:'a light ray',
               t1:0, x1:0, t2:1, x2:1, kind:'lightlike', flips:false,
               why:'The marginal case: the order flips only at exactly c, which is to say never. The light cone is the boundary between the two behaviours, and it is a boundary nothing crosses.' },
  near:      { name:'nearly simultaneous, far apart', short:'nearly',
               t1:0, x1:0, t2:0.2, x2:3, kind:'spacelike', flips:true,
               why:'A tenth of the separation in time, so a boost of only β = 0.0667 reverses them. Nothing is wrong with that: no signal could have connected them, so nothing that could be affected is being reordered.' },
  close:     { name:'spacelike by one per cent', short:'almost light',
               t1:0, x1:0, t2:0.99, x2:1, kind:'spacelike', flips:true,
               why:'|Δx| beats |Δt| by one per cent, so the pair is spacelike and the order <i>can</i> be reversed — but only by an observer at <b>0.99c</b>. Nudge Δt above Δx and the crossover leaves the interval entirely: it does not creep past 1, it stops existing, because the condition for a crossover to exist is the condition for the pair to be spacelike. The two are the same statement.' },
  ordered:   { name:'the same pair, tipped over the cone', short:'just timelike',
               t1:0, x1:0, t2:1.01, x2:1, kind:'timelike', flips:false,
               why:'The previous pair with Δt nudged from 0.99 to 1.01. Nothing else changed, and now no boost whatever reorders it — that is how sharp the light cone is as a boundary, and it is why causality survives having simultaneity taken away from it.' }
};
