/* ============================================================================
   1m · OSCILLATIONS, WAVES AND SOUND
   AP Physics 1 (simple harmonic motion) and AP Physics 2 (waves, sound,
   physical optics groundwork).

   Simple harmonic motion is not a kind of wiggle — it is what *every* restoring
   force looks like close enough to equilibrium, because every smooth potential
   is a parabola near its minimum. The lab makes that claim testable: it fits a
   parabola to a chosen potential and compares the resulting period with the
   period the full nonlinear equation actually has.
   ============================================================================ */

/* --------------------------------------------------- simple harmonic motion ---- */
const wvOmegaSpring = (k, m) => Math.sqrt(k / m);
const wvOmegaPendulum = (L, g) => Math.sqrt((g === undefined ? DY_G : g) / L);
const wvOmegaPhysical = (m, g, d, I) => Math.sqrt(m * (g === undefined ? DY_G : g) * d / I);
const wvPeriod = w => 2 * Math.PI / w;
/* x(t) = A cos(ωt + φ), with the constants fitted to the initial conditions */
function wvSHM(A, w, phi){
  return { A, w, phi, T:2 * Math.PI / w, f:w / (2 * Math.PI),
    x:t => A * Math.cos(w * t + phi),
    v:t => -A * w * Math.sin(w * t + phi),
    a:t => -A * w * w * Math.cos(w * t + phi),
    vmax:A * w, amax:A * w * w };
}
function wvFromInitial(x0, v0, w){
  const A = Math.hypot(x0, v0 / w);
  const phi = Math.atan2(-v0 / w, x0);
  return wvSHM(A, w, phi);
}
/* the energy trade: K + U is constant and each is a shifted cosine of 2ωt */
function wvEnergy(k, A, x){
  const U = 0.5 * k * x * x, E = 0.5 * k * A * A;
  return { U, K:E - U, E, frac:U / E };
}
/* the large-angle pendulum: the exact period from the elliptic integral, so the
   small-angle approximation can be shown failing */
function wvPendulumExact(L, th0, g){
  const G = g === undefined ? DY_G : g;
  const T0 = 2 * Math.PI * Math.sqrt(L / G);
  const k = Math.sin(th0 / 2);
  /* T = T₀·(2/π)K(k), with the complete elliptic integral of the first kind */
  const K = nqAdaptive(t => 1 / Math.sqrt(1 - k * k * Math.sin(t) * Math.sin(t)), 0, Math.PI / 2, 1e-12);
  const T = T0 * 2 * K / Math.PI;
  /* the standard series, for comparison */
  const series = T0 * (1 + k * k / 4 + 9 * Math.pow(k, 4) / 64);
  return { T0, T, series, err:(T - T0) / T0 };
}
/* any potential is harmonic near its minimum: fit the curvature and predict */
function wvSmallOscillation(U, x0, m){
  const kEff = nqD2(U, x0);
  return { kEff, w:Math.sqrt(Math.max(0, kEff / m)), T:2 * Math.PI / Math.sqrt(Math.max(1e-12, kEff / m)) };
}

/* ----------------------------------------------------------------------------
   A RESTORING FORCE THE READER TYPES

   Simple harmonic motion is called *simple* because its period does not depend
   on its amplitude. That is not a property of oscillation; it is a property of
   the force being exactly proportional to displacement, and it stays invisible
   until you type a force for which it fails.

   So the period is obtained by TWO routes that share nothing:

     DYNAMICAL   x″ = F(x)/m integrated by RK4 from rest, with the period read
                 off the times at which v returns to zero. No energy in it.
     ENERGETIC   T = 2∫dx/√(2(E−U)/m) between the turning points, with U built
                 by integrating −F and the turning points located by
                 root-finding. No time-stepping in it.

   and a third number which is a *prediction* rather than a measurement: the
   harmonic period 2π√(m/k) with k = −F′ at the equilibrium. For a linear force
   all three agree at every amplitude — that is isochrony, measured. For
   anything else the first two agree with each other and leave the third behind
   by an amount that grows with amplitude and which the panel plots.

   The energy integral has an integrable singularity at each turning point,
   where E − U vanishes linearly. Substituting x = c + R sin θ cancels it
   exactly: dx contributes a factor cos θ, the denominator a factor √(1 ∓ sin θ),
   and cos θ = √((1−sin θ)(1+sin θ)). The integrand is then finite at both ends
   and an ordinary quadrature rule will do.
   ---------------------------------------------------------------------------- */
/* U on a grid by running Simpson, then cubic Hermite between grid points using
   the EXACT slope U′ = −F. Hermite with true derivatives is fourth order, so a
   few thousand cells put the interpolation error far below anything the two
   period routes are compared at — and building it once turns the energy
   integral from a million force evaluations into a few thousand. */
function wvBuildU(Fof, eq, lo, hi, N){
  const M = Math.max(64, N || 3000), h = (hi - lo) / M;
  const us = new Float64Array(M + 1);
  const F = new Float64Array(M + 1);
  for(let i = 0; i <= M; i++) F[i] = Fof(lo + i * h);
  us[0] = 0;
  for(let i = 1; i <= M; i++){
    const a = lo + (i - 1) * h;
    us[i] = us[i - 1] - h / 6 * (F[i - 1] + 4 * Fof(a + h / 2) + F[i]);
  }
  const raw = x => {
    let j = Math.floor((x - lo) / h);
    if(j < 0) j = 0;
    if(j > M - 1) j = M - 1;
    const t = (x - (lo + j * h)) / h, t2 = t * t, t3 = t2 * t;
    const m0 = -F[j] * h, m1 = -F[j + 1] * h;
    return (2 * t3 - 3 * t2 + 1) * us[j] + (t3 - 2 * t2 + t) * m0 +
           (-2 * t3 + 3 * t2) * us[j + 1] + (t3 - t2) * m1;
  };
  const shift = raw(eq);
  return x => raw(x) - shift;
}
/* the equilibrium is FOUND, not assumed: every zero of F in the window is
   located, and the stable one nearest the origin is taken */
function wvEquilibrium(Fof, lo, hi){
  const rs = nqRoots(Fof, lo, hi, 900, 1e-13);
  let best = null;
  for(const r of rs){
    if(nqD1(Fof, r) >= 0) continue;                 /* unstable — F pushes away */
    if(best === null || Math.abs(r) < Math.abs(best)) best = r;
  }
  return best;
}
/* The turning point is the FIRST place U climbs back to E going outwards from
   the equilibrium — which has to be found by scanning, not by bisecting the
   whole window. A pendulum's potential is periodic, so U − E changes sign many
   times over any generous search range, and bisection there converges to an
   arbitrary one of them: at θ₀ = 1.5 rad it returned a turning point two wells
   away and a period twice too long. Scanning outward and bracketing the first
   crossing is the only thing that means what it says. */
function wvTurnPoint(U, E, from, dir, span, n){
  const N = n || 5000, h = dir * span / N;
  let prev = U(from) - E;
  for(let i = 1; i <= N; i++){
    const x = from + i * h, cur = U(x) - E;
    if(!Number.isFinite(cur)) return null;
    if(prev < 0 && cur >= 0) return nqBisect(t => U(t) - E, from + (i - 1) * h, x, 1e-14, 200);
    prev = cur;
  }
  return null;
}
/* the period from energy alone: no clock anywhere in it */
function wvPeriodEnergy(U, m, xm, xp, panels){
  const c = (xp + xm) / 2, Rr = (xp - xm) / 2, E = U(xp);
  const g = th => {
    const d = 2 * (E - U(c + Rr * Math.sin(th))) / m;
    return d > 1e-300 ? Rr * Math.cos(th) / Math.sqrt(d) : 0;
  };
  return 2 * nqGauss(g, -Math.PI / 2, Math.PI / 2, 8, panels || 240);
}
/* the period from the motion alone: no energy anywhere in it */
function wvPeriodMotion(Fof, m, xStart, h, maxSteps, bound){
  const acc = xx => Fof(xx) / m;
  let x = xStart, v = 0, t = 0;
  const zeros = [];
  const lim = maxSteps || 400000;
  for(let i = 0; i < lim && zeros.length < 2; i++){
    const v0 = v;
    const k1x = v, k1v = acc(x);
    const k2x = v + h * k1v / 2, k2v = acc(x + h * k1x / 2);
    const k3x = v + h * k2v / 2, k3v = acc(x + h * k2x / 2);
    const k4x = v + h * k3v, k4v = acc(x + h * k3x);
    x += h * (k1x + 2 * k2x + 2 * k3x + k4x) / 6;
    v += h * (k1v + 2 * k2v + 2 * k3v + k4v) / 6;
    t += h;
    if(!Number.isFinite(x) || !Number.isFinite(v) || (bound && Math.abs(x - xStart) > bound))
      return { T:NaN, ok:false, escaped:true };
    if(i > 0 && v0 !== 0 && v * v0 < 0){
      /* near a turning point the acceleration is nearly constant, so one
         Newton step off the post-step state locates the crossing. That step is
         what limits the order here, and the unit suite measures it by halving h
         rather than taking the integrator's fourth order on trust. */
      const a = acc(x);
      zeros.push(a !== 0 ? t - v / a : t - h * v / (v - v0));
    }
  }
  return zeros.length >= 2 ? { T:zeros[1], half:zeros[0], ok:true, escaped:false }
                           : { T:NaN, ok:false, escaped:false };
}
/* everything the stage needs, from a force law and an amplitude */
function wvOwnWell(Fof, m, A, opt){
  const o = opt || {};
  const S = Math.max(4 * Math.abs(A), 1) * 2.5;
  const eq = wvEquilibrium(Fof, -S, S);
  if(eq === null) return { ok:false, why:'no stable equilibrium — F(x) never crosses zero downwards in this window' };
  const k = -nqD1(Fof, eq);
  if(!(k > 0)) return { ok:false, why:'the equilibrium is not stable — F′ is not negative there' };
  const Tharm = 2 * Math.PI * Math.sqrt(m / k);
  const U = wvBuildU(Fof, eq, eq - S, eq + S, o.grid || 4000);
  const xp = eq + Math.abs(A);
  if(!(Fof(xp) < 0)) return { ok:false, why:'the force does not pull back at that amplitude — the motion is unbounded', eq, k, Tharm };
  const E = U(xp);
  /* the release point must itself be the first turning point on its side, or
     the reader has put the mass beyond a barrier and it leaves that way */
  for(let i = 1; i < 200; i++){
    const x = eq + (xp - eq) * i / 200;
    if(U(x) >= E) return { ok:false, why:'there is a barrier between the equilibrium and the release point — the mass escapes outwards', eq, k, Tharm };
  }
  /* the far turning point is where U first climbs back to E, and for an
     asymmetric force it is NOT the mirror image of the near one */
  const xm = wvTurnPoint(U, E, eq, -1, S * 0.999);
  if(xm === null) return { ok:false, why:'the potential never rises back to that energy on the other side — the motion escapes', eq, k, Tharm };
  const Tenergy = wvPeriodEnergy(U, m, xm, xp, o.panels);
  const Tm = wvPeriodMotion(Fof, m, xp, (o.h !== undefined ? o.h : Tenergy / 6000), o.maxSteps, S * 4);
  /* the amplitude sweep, which is the whole point: does T move? */
  const sweep = [];
  const NA = o.sweepN || 34;
  for(let i = 1; i <= NA; i++){
    const a = Math.abs(A) * 1.35 * i / NA;
    const p = eq + a;
    if(!(Fof(p) < 0)) break;
    const e2 = U(p);
    const q = wvTurnPoint(U, e2, eq, -1, S * 0.999);
    if(q === null) break;
    sweep.push({ A:a, T:wvPeriodEnergy(U, m, q, p, 120) });
  }
  return { ok:true, eq, k, Tharm, U, E, xp, xm, m, A:Math.abs(A),
    Tenergy, Tmotion:Tm.T, motionOK:Tm.ok, escaped:!!Tm.escaped,
    gap:Tm.ok ? Math.abs(Tenergy - Tm.T) : NaN,
    /* how far the harmonic PREDICTION is from the measured period */
    harmGap:Math.abs(Tenergy - Tharm), harmRel:Math.abs(Tenergy - Tharm) / Tenergy,
    /* an asymmetric well swings further one way than the other */
    asym:Math.abs((xp - eq) - (eq - xm)),
    sweep,
    /* the spread of T over the swept amplitudes: zero is isochrony, measured */
    isoSpread:sweep.length > 1
      ? (Math.max.apply(null, sweep.map(s => s.T)) - Math.min.apply(null, sweep.map(s => s.T))) /
        Math.max(1e-30, sweep[0].T)
      : 0 };
}

/* -------------------------------------------------------------- travelling ---- */
/* y(x,t) = A sin(kx − ωt + φ): k is how much phase per metre, ω per second, and
   the wave speed is the ratio at which their contributions cancel */
const wvK = lam => 2 * Math.PI / lam;
const wvSpeed = (f, lam) => f * lam;
const wvSpeedString = (T, mu) => Math.sqrt(T / mu);
const wvSpeedSound = tempC => 331.3 * Math.sqrt(1 + tempC / 273.15);
function wvTravel(A, lam, f, dir, phi){
  const k = wvK(lam), w = 2 * Math.PI * f;
  return { k, w, v:w / k, T:1 / f, lam, f, A,
    y:(x, t) => A * Math.sin(k * x - (dir === undefined ? 1 : dir) * w * t + (phi || 0)) };
}
/* two identical waves travelling opposite ways make a standing wave whose
   amplitude is a fixed function of x — nodes never move */
function wvStanding(A, lam, f){
  const k = wvK(lam), w = 2 * Math.PI * f;
  return { k, w, lam, f,
    y:(x, t) => 2 * A * Math.sin(k * x) * Math.cos(w * t),
    envelope:x => Math.abs(2 * A * Math.sin(k * x)),
    nodeAt:n => n * lam / 2, antinodeAt:n => (2 * n + 1) * lam / 4 };
}
/* the boundary conditions that quantise the modes of a string or a pipe */
const WV_MODES = {
  string: { name:'String fixed at both ends', lam:(L, n) => 2 * L / n, all:true,
    note:'A node at each end forces a whole number of half-wavelengths: <b>λₙ = 2L/n</b>, so <b>fₙ = n·v/2L</b>. Every harmonic is present, and the ear hears their pattern as the instrument\'s timbre.' },
  openPipe: { name:'Pipe open at both ends', lam:(L, n) => 2 * L / n, all:true,
    note:'Antinodes at both ends this time, but the same spacing — so an open pipe has the same harmonic series as a string. A flute is this.' },
  closedPipe: { name:'Pipe closed at one end', lam:(L, n) => 4 * L / (2 * n - 1), all:false,
    note:'A node at the closed end and an antinode at the open one fits an <i>odd</i> number of quarter-wavelengths: only odd harmonics survive, and the fundamental is an octave lower than an open pipe of the same length. A clarinet is this, and it is why a clarinet sounds hollow next to a flute.' }
};
function wvMode(kind, L, n, v){
  const M = WV_MODES[kind];
  const lam = M.lam(L, n);
  return { n, lam, f:v / lam, harmonic:M.all ? n : 2 * n - 1 };
}

/* ----------------------------------------------------------------------------
   A STRING THE READER PLUCKS INTO ANY SHAPE

   A preset mode is a mode because it was written down as one. Give the string
   an arbitrary initial shape and the question becomes which modes it contains,
   which is Fourier's theorem doing work rather than being quoted:

       bₙ = (2/L) ∫₀ᴸ y(x,0) sin(nπx/L) dx

   The subsequent motion is then obtained TWO ways that share nothing:

     MODAL       y = Σ bₙ sin(nπx/L) cos(nπvt/L) — every mode standing still
                 and breathing at its own frequency. Needs the coefficients.
     D'ALEMBERT  y = ½[F(x−vt) + F(x+vt)], where F is the odd 2L-periodic
                 extension of the initial shape. Needs no coefficients at all,
                 no series, and no frequencies — just the shape, reflected.

   These are the same function. Nothing in the code makes them so, and the gap
   between them is Fourier's theorem verified on a shape nobody chose. It falls
   as modes are added, at a rate the panel measures by doubling N rather than
   asserting — and for a plucked (kinked) string it falls slowly, because a
   corner needs every harmonic there is.

   Parseval is the same statement about energy: (L/2)Σbₙ² must equal ∫y² dx,
   and the shortfall after N modes is how much of the shape is still missing.
   ---------------------------------------------------------------------------- */
function wvStringModes(y0, L, N){
  const M = Math.max(1, N || 24), b = new Float64Array(M + 1);
  for(let n = 1; n <= M; n++){
    const k = n * Math.PI / L;
    b[n] = 2 / L * nqGauss(x => y0(x) * Math.sin(k * x), 0, L, 8, 240);
  }
  return b;
}
/* the odd 2L-periodic extension: the reflections a fixed end imposes, which is
   the whole content of the boundary condition and the only thing d'Alembert
   needs to know about the string */
function wvOddExtend(y0, L){
  return s => {
    let u = s % (2 * L);
    if(u < 0) u += 2 * L;
    const v = u <= L ? y0(u) : -y0(2 * L - u);
    return Number.isFinite(v) ? v : 0;
  };
}
function wvStringRun(y0, L, v, N, opt){
  const o = opt || {};
  const b = wvStringModes(y0, L, N || 24);
  const M = b.length - 1;
  const F = wvOddExtend(y0, L);
  const modal = (x, t) => {
    let s = 0;
    for(let n = 1; n <= M; n++) s += b[n] * Math.sin(n * Math.PI * x / L) * Math.cos(n * Math.PI * v * t / L);
    return s;
  };
  const dal = (x, t) => 0.5 * (F(x - v * t) + F(x + v * t));
  /* the two routes compared over the whole string and a whole period */
  const NX = o.nx || 400, NT = o.nt || 9;
  let gap = 0, shape = 0;
  for(let j = 0; j < NT; j++){
    const t = (2 * L / v) * j / NT;
    for(let i = 1; i < NX; i++){
      const x = L * i / NX;
      gap = Math.max(gap, Math.abs(modal(x, t) - dal(x, t)));
      shape = Math.max(shape, Math.abs(dal(x, t)));
    }
  }
  /* Parseval: the energy in the modes against the energy in the shape */
  let sumb = 0;
  for(let n = 1; n <= M; n++) sumb += b[n] * b[n];
  const e2 = nqGauss(x => { const y = y0(x); return Number.isFinite(y) ? y * y : 0; }, 0, L, 8, 400);
  /* how many modes carry 99% of it — the answer a corner makes large */
  let acc = 0, n99 = M;
  for(let n = 1; n <= M; n++){ acc += b[n] * b[n]; if(acc >= 0.99 * (2 * e2 / L)){ n99 = n; break; } }
  const strongest = (() => { let best = 1; for(let n = 2; n <= M; n++) if(Math.abs(b[n]) > Math.abs(b[best])) best = n; return best; })();
  return { b, N:M, L, v, modal, dal, F,
    f1:v / (2 * L), gap, shapeMax:shape,
    rel:shape > 0 ? gap / shape : gap,
    parseval:(L / 2) * sumb, energy:e2,
    parsevalGap:Math.abs((L / 2) * sumb - e2),
    parsevalRel:e2 > 0 ? Math.abs((L / 2) * sumb - e2) / e2 : 0,
    n99, strongest,
    /* a string is periodic in 2L/v because every ωₙ is a whole multiple of ω₁ —
       which is why it sounds like a note and a drum does not */
    period:2 * L / v };
}

/* ----------------------------------------------------------------- sound ---- */
const wvIntensity = (P, r) => P / (4 * Math.PI * r * r);
const wvDB = I => 10 * Math.log10(I / 1e-12);
const wvFromDB = dB => 1e-12 * Math.pow(10, dB / 10);
/* beats: two nearby frequencies produce an envelope at their difference */
function wvBeats(f1, f2, A){
  return { fBeat:Math.abs(f1 - f2), fCarrier:(f1 + f2) / 2,
    y:t => A * (Math.sin(2 * Math.PI * f1 * t) + Math.sin(2 * Math.PI * f2 * t)),
    env:t => 2 * A * Math.abs(Math.cos(Math.PI * (f1 - f2) * t)) };
}
/* the Doppler effect, with source and observer motion kept separate because
   they are not symmetric — the medium picks a frame, unlike in relativity */
function wvDoppler(f0, vs, vo, v, towards){
  const V = v === undefined ? 343 : v;
  const s = towards === false ? -1 : 1;
  const f = f0 * (V + s * vo) / (V - s * vs);
  return { f, shift:f - f0, ratio:f / f0,
    mach:Math.abs(vs) / V, sonic:Math.abs(vs) >= V,
    coneAngle:Math.abs(vs) > V ? Math.asin(V / Math.abs(vs)) : NaN };
}
/* the two-source interference that underlies every diffraction pattern */
function wvTwoSource(d, lam, L, y){
  const r1 = Math.hypot(L, y - d / 2), r2 = Math.hypot(L, y + d / 2);
  const dr = r2 - r1;
  const phase = 2 * Math.PI * dr / lam;
  return { dr, phase, I:Math.pow(Math.cos(phase / 2), 2),
    order:dr / lam, constructive:Math.abs(dr / lam - Math.round(dr / lam)) < 0.02 };
}
