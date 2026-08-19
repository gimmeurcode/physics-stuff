/* ============================================================================
   5d · THE INSPIRAL OF A BINARY THE READER SUPPLIES
   Programme A item 5, 2026-08-18. The three modules before this one hand the
   reader a static metric and measure what moves through it; this one hands
   them two masses and a separation and measures what the pair RADIATES.

   UNITS: G = c = 1 with everything in SECONDS. A mass is a time (GM☉/c³ =
   4.925×10⁻⁶ s), a length is a time (a/c), a luminosity is dimensionless
   (L·G/c⁵) and a strain always was. Two conversions in and one out — gwMs,
   gwLs, gwSm — and no factor of G or c appears anywhere in between, which is
   the only way expressions like a⁴/(m₁m₂M) stay readable and stay in range.

   THE PHYSICS, in one line each:

     Kepler       ω² = M/a³, and the wave comes out at TWICE that, because the
                  radiating multipole is the quadrupole and a quadrupole
                  repeats itself after half a turn. This module measures that
                  factor of two rather than writing it down.
     quadrupole   L = (32/5) m₁²m₂²M/a⁵ — the power crossing a distant sphere,
                  with no monopole term (mass is conserved) and no dipole term
                  (momentum is conserved).
     the balance  the orbit pays for it: E = −m₁m₂/2a, so
                  ȧ = −L/(dE/da) = −(64/5) m₁m₂M/a³.

   THE TWO ROUTES, and what makes them independent:

     ROUTE A  gwInspiralRun marches ȧ with RK4 and never hears of a chirp mass.
              It knows m₁ and m₂ SEPARATELY, through the quadrupole luminosity
              and through the orbital energy. The frequency at each sample is
              Kepler's, and the sweep rate ḟ is then MEASURED off that track by
              a five-point derivative — the same operation a detector performs
              on a waveform.
     ROUTE B  the closed-form chirp relation ḟ = (96/5)π^(8/3)Mc^(5/3)f^(11/3),
              which contains the two masses only in the combination
              Mc = (m₁m₂)^(3/5)/(m₁+m₂)^(1/5).

   Inverting route B on route A's measured (f, ḟ) returns a chirp mass, and it
   must equal the algebraic one. That is not a tautology dressed up: it is the
   statement that the leading-order inspiral depends on the two masses through
   ONE number, which is why LIGO measures a chirp mass to four figures and the
   individual masses to one, and why two very different pairs draw the same
   chirp until the moment they touch. gwEqualTwin builds that twin so the
   reader can watch the two tracks lie on top of each other.

   The identity is exact within this model — substitute a = M^(1/3)(πf)^(−2/3)
   into ḟ = (df/da)·ȧ and the masses collect into m₁m₂M^(−1/3) = Mc^(5/3) — so
   what the agreement measures is the numerics, and the numerics are where the
   two lessons of this module are:

   THE STEP IS SIZED BY THE INSPIRAL, NOT BY THE ORBIT — which is the opposite
   of item 2's lesson, for a reason worth stating. rlOrbitPlan had to bound the
   ANGULAR step because the thing being measured was an angle. Here the thing
   being measured is ȧ, whose timescale is a/|ȧ| = 4×(the time left), so the
   step is a fixed fraction of the time remaining and the grid comes out
   geometric: fifty samples per e-fold, all the way in, with no singular
   endpoint anywhere because the run stops at the ISCO. A uniform grid in t
   cannot do this at all — Hulse–Taylor has twenty decades between its
   coalescence time and its last orbit, and no fixed step spans that. And the
   ORBITAL PHASE rides on the same grid, because φ̇ = ω(a) does not oscillate:
   it is smooth on the inspiral timescale, so the cycle count is a quadrature
   and not a waveform. Bounding the step by the orbital period instead — which
   this module did for one afternoon — buys nothing and truncated GW170817's
   count by 571 cycles against its own step limit. See gwInspiralRun.

   A FIVE-POINT DERIVATIVE, NOT A THREE-POINT ONE, and the arithmetic says why.
   f ∝ τ^(−3/8), so the central-difference error is 0.544(h/τ)² relative; at
   the 1.6% steps this grid uses that is 1.4×10⁻⁴ — a hundred times the
   acceptance this item was written to meet. The five-point Lagrange form on
   the same grid is 1.6(h/τ)⁴ ≈ 10⁻⁷, and halving the step is measured to cut
   it sixteenfold rather than fourfold. Both regimes are asserted in tests.js.
   ============================================================================ */

/* ------------------------------------------------------------ units -------- */
/* A solar mass as a time: GM☉/c³. GM_SUN is used rather than G×M☉ because the
   product is measured a hundred thousand times better than either factor. */
const GW_MSUN_S = GM_SUN / C3;                 // 4.925490947×10⁻⁶ s
const gwMs = m => m * GW_MSUN_S;               // solar masses → seconds
const gwLs = L => L / C_SI;                    // metres → seconds
const gwSm = t => t * C_SI;                    // seconds → metres
const gwSolar = t => t / GW_MSUN_S;            // seconds → solar masses
/* geometric luminosity → watts, and the Sun's optical output for scale */
const GW_LUM_W = C3 * C2 / G_SI;               // c⁵/G = 3.628×10⁵² W
const GW_LSUN_W = 3.828e26;                    // IAU 2015 nominal solar luminosity

/* ------------------------------------------------- Kepler, and the wave ---- */
/* The ORBITAL angular frequency of a circular binary of total mass M at
   separation a. Both bodies go round the common centre at this one rate. */
const gwOmegaOf = (M, a) => Math.sqrt(M / (a * a * a));
/* The WAVE frequency: twice the orbital one, so ω/π rather than ω/2π. That
   factor of two is the quadrupole's signature and gwQuadWave measures it. */
const gwFgwOf = (M, a) => gwOmegaOf(M, a) / Math.PI;
/* and back — the separation at which a binary of total mass M radiates at f */
const gwSepOfFgw = (M, f) => Math.cbrt(M / (Math.PI * f * Math.PI * f));
/* Where the inspiral stops being an inspiral. 6M is the innermost stable
   circular orbit of a TEST particle in Schwarzschild — exact only for m₂ ≪ m₁,
   and used here at every mass ratio because the alternative is a numerical
   relativity simulation. The stage says so; the numbers past this point are
   not this model's to give. */
const gwSepIsco = M => 6 * M;
const gwFgwIsco = M => 1 / (Math.pow(6, 1.5) * Math.PI * M);

/* -------------------------------------------- the quadrupole, and its bill - */
/* The power radiated by a circular binary, in geometric units (multiply by
   c⁵/G = 3.63×10⁵² W for watts). Note what is NOT here: no monopole, because
   the total mass does not change, and no dipole, because the centre of mass
   does not accelerate. Gravity's leading channel is the third one. */
const gwLumOf = (m1, m2, a) => 32 / 5 * m1 * m1 * m2 * m2 * (m1 + m2) / Math.pow(a, 5);
/* Newtonian orbital energy of the pair — the account the radiation draws on */
const gwEorbOf = (m1, m2, a) => -m1 * m2 / (2 * a);
/* ȧ from the balance, in closed form */
const gwAdotOf = (m1, m2, a) => -64 / 5 * m1 * m2 * (m1 + m2) / (a * a * a);
/* ȧ from the balance, computed rather than remembered: the luminosity divided
   by the numerically differentiated energy. Nothing in the stages uses this —
   it exists so the unit suite can check that the closed form above IS the
   energy balance and not a formula copied out of a book. */
function gwAdotBalance(m1, m2, a){
  const dEda = rlDeriv(x => gwEorbOf(m1, m2, x), a);
  return Number.isFinite(dEda) && dEda !== 0 ? -gwLumOf(m1, m2, a) / dEda : NaN;
}

/* ---------------------------------------------------- the closed forms ----- */
/* Time to coalescence from separation a, for a circular orbit. Follows from
   ȧ ∝ a⁻³ by separating variables: a⁴ falls linearly in t. */
const gwTcoalOf = (m1, m2, a) => 5 / 256 * Math.pow(a, 4) / (m1 * m2 * (m1 + m2));
/* and the separation at time t along that fall */
function gwSepAtT(m1, m2, a0, t){
  const tc = gwTcoalOf(m1, m2, a0);
  return t >= tc ? 0 : a0 * Math.pow(1 - t / tc, 0.25);
}
/* The chirp mass. Homogeneous of degree one, so it is the same expression in
   solar masses (gwChirpMass, 46) and in seconds — this name exists to make the
   units of a call site readable, not because the arithmetic differs. */
const gwChirpMassS = (m1, m2) => Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
/* THE chirp relation — route B, and the only place a chirp mass appears */
const gwFdotOf = (Mc, f) =>
  96 / 5 * Math.pow(Math.PI, 8 / 3) * Math.pow(Mc, 5 / 3) * Math.pow(f, 11 / 3);
/* Inverted: the chirp mass a detector reads off a measured frequency and sweep
   rate. This is how every mass in the GWTC catalogues was obtained. */
function gwMcFromFdot(f, fdot){
  if(!(f > 0) || !(fdot > 0) || !Number.isFinite(f) || !Number.isFinite(fdot)) return NaN;
  return Math.pow(5 / 96 * Math.pow(Math.PI, -8 / 3) * fdot * Math.pow(f, -11 / 3), 0.6);
}
/* Time left when the wave is at f, and the frequency τ before merger */
const gwTauOfFgw = (Mc, f) =>
  5 / 256 * Math.pow(Math.PI, -8 / 3) * Math.pow(Mc, -5 / 3) * Math.pow(f, -8 / 3);
const gwFgwOfTau = (Mc, tau) =>
  tau > 0 ? Math.pow(5 / (256 * tau), 3 / 8) / (Math.PI * Math.pow(Mc, 5 / 8)) : Infinity;
/* Wave cycles between two frequencies: ∫f dt = ∫(f/ḟ)df. The orbit turns half
   as many times, which is the same factor of two again. */
const gwCyclesOf = (Mc, f1, f2) =>
  1 / 32 * Math.pow(Math.PI, -8 / 3) * Math.pow(Mc, -5 / 3) *
  (Math.pow(f1, -5 / 3) - Math.pow(f2, -5 / 3));
/* Strain amplitude at distance D (seconds), face-on and optimally oriented */
const gwStrainOf = (Mc, f, D) => 4 * Math.pow(Mc, 5 / 3) * Math.pow(Math.PI * f, 2 / 3) / D;
/* The equal-mass binary with the SAME chirp mass: m = 2^(1/5)Mc each. Its
   inspiral is identical to the reader's until the ISCO, because the chirp is
   blind to everything but Mc — which is why LIGO quotes a chirp mass tightly
   and a mass ratio loosely. */
function gwEqualTwin(m1, m2){
  const m = Math.pow(2, 0.2) * gwChirpMassS(m1, m2);
  return { m1:m, m2:m, M:2 * m };
}

/* ============================ ROUTE A · the integrated inspiral =========== */

/* One RK4 step of the pair (a, φ) under ȧ = F(a), φ̇ = W(a). The phase rides
   along rather than being integrated separately so the two share a step. */
function gwStepRK4(F, W, a, ph, h){
  const k1 = F(a),               p1 = W(a);
  const k2 = F(a + h / 2 * k1),  p2 = W(a + h / 2 * k1);
  const k3 = F(a + h / 2 * k2),  p3 = W(a + h / 2 * k2);
  const k4 = F(a + h * k3),      p4 = W(a + h * k3);
  return { a: a + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4),
           ph: ph + h / 6 * (p1 + 2 * p2 + 2 * p3 + p4) };
}

/* What the run can and cannot resolve, decided BEFORE integrating rather than
   discovered halfway through. Two timescales are in play and they can be twenty
   decades apart:

     the inspiral   a/|ȧ| = 4τ, and the step is a fixed fraction of it
     the orbit      2π/ω, which the PHASE needs resolved and ȧ does not

   Asking for both when they are far apart is not a step-size problem, it is a
   request for 10¹¹ orbits of phase. This says so instead. */
function gwInspiralPlan(m1, m2, a0, aEnd, frac){
  const M = m1 + m2, fr = frac > 0 ? frac : 0.004;
  if(!(m1 > 0) || !(m2 > 0) || !(a0 > 0) || !Number.isFinite(a0))
    return { ok:false, why:'two positive masses and a positive separation are needed.' };
  if(!(a0 > aEnd))
    return { ok:false, why:'that separation is already inside the innermost stable circular ' +
                           'orbit at 6GM/c², where no inspiral model applies.' };
  /* geometric grid: each step multiplies the remaining time by (1 − 4·frac) */
  const tc0 = gwTcoalOf(m1, m2, a0), tcE = gwTcoalOf(m1, m2, aEnd);
  const steps = Math.ceil(Math.log(tc0 / tcE) / -Math.log(1 - 4 * fr)) + 4;
  const orbits = gwCyclesOf(gwChirpMassS(m1, m2), gwFgwOf(M, a0), gwFgwOf(M, aEnd)) / 2;
  return { ok:true, frac:fr, steps, orbits, tc0, tcE };
}

/* THE INSPIRAL, marched. Returns the track and nothing that was assumed: t, a,
   Kepler's frequency at each sample, and the accumulated orbital phase. The
   masses enter separately and no chirp mass appears anywhere.

   THE PHASE IS A QUADRATURE, NOT A WAVEFORM — and the first version of this
   module got that wrong in a way that cost a real answer. It bounded the step
   at a twenty-fourth of an ORBIT, on the reasoning that a phase needs its
   oscillation resolved; then, since a binary pulsar has 10¹¹ orbits left, it
   refused to integrate the phase at all and said so. Both halves were wrong.
   φ̇ = ω(a) does not oscillate: it is a smooth function of the inspiral
   timescale, so ∫ω dt is an ordinary quadrature and the geometric grid already
   resolves it to 10⁻⁹. The orbit-period bound bought nothing and cost
   everything — GW170817 needed 47 000 steps under it, hit the 40 000 cap, and
   the panel printed a cycle count 571 SHORT while claiming to compare it with
   ∫f dt. That is the shape to remember: a guard added for a plausible reason,
   silently truncating the answer it was meant to protect. Found by
   ./auditsides.ps1 on a preset the default is not. The count is now integrated
   for every binary and is a genuine second route to gwCyclesOf. */
function gwInspiralRun(m1, m2, a0, opt){
  const o = opt || {}, M = m1 + m2;
  const aEnd = o.aEnd !== undefined ? o.aEnd : gwSepIsco(M);
  const plan = gwInspiralPlan(m1, m2, a0, aEnd, o.frac);
  if(!plan.ok) return { ok:false, why:plan.why, n:0 };
  const frac = plan.frac, maxSteps = o.maxSteps || 40000;
  const F = a => gwAdotOf(m1, m2, a);
  const W = a => gwOmegaOf(M, a);

  const ts = [0], as = [a0], phs = [0], hs = [];
  let a = a0, t = 0, ph = 0, n = 0, hit = true;
  while(a > aEnd){
    if(n >= maxSteps){ hit = false; break; }
    let h = frac * a / Math.abs(F(a));
    let s = gwStepRK4(F, W, a, ph, h);
    /* Land the last sample ON the endpoint rather than past it — a track that
       overshoots reports a frequency this model does not have, and the ISCO is
       exactly where it stops being true. The step is bisected through the
       integrator itself, so the endpoint is found by the same arithmetic that
       produced every other sample and no closed form is borrowed. */
    if(s.a <= aEnd){
      let lo = 0, hi = h;
      for(let k = 0; k < 60; k++){
        const mid = (lo + hi) / 2;
        if(gwStepRK4(F, W, a, ph, mid).a > aEnd) lo = mid; else hi = mid;
      }
      h = hi; s = gwStepRK4(F, W, a, ph, h);
    }
    t += h; a = s.a; ph = s.ph; n++;
    ts.push(t); as.push(a); phs.push(ph); hs.push(h);
  }
  const fs = new Float64Array(n + 1);
  for(let i = 0; i <= n; i++) fs[i] = gwFgwOf(M, as[i]);
  /* THE TIME REMAINING, SUMMED BACKWARDS — and the elapsed time is not a
     substitute for it, which cost this module its first green run.

     Hulse–Taylor takes 5.2×10¹⁶ s to reach its ISCO and its last steps are
     2×10⁻⁵ s long. One ulp of float64 at 5×10¹⁶ is EIGHT SECONDS, so the whole
     last stretch of the elapsed-time array is a single repeated float, and a
     derivative taken against it is meaningless: the recovered chirp mass came
     out 33% wrong on every long inspiral while the compact ones passed at
     10⁻⁸. Nothing about the integration was wrong — the arithmetic that
     REPORTS it was. Accumulating h backwards from the end instead keeps every
     step at its own scale, because the sum near the end is small and each
     added term is comparable with it. Found by ./runstagetests.ps1 driving the
     presets the default is not; tests.js pins both regimes. */
  const tau = new Float64Array(n + 1);
  for(let i = n - 1; i >= 0; i--) tau[i] = tau[i + 1] + hs[i];
  /* A truncated run reports NO cycle count. The track it did produce is still
     a track, but a phase that stopped early is a wrong number rather than a
     short one, and printing it beside ∫f dt is what this guard exists to stop
     ever happening again. */
  return { ok:n > 2, n, m1, m2, M, a0, aEnd, frac,
           t:Float64Array.from(ts), tau, a:Float64Array.from(as), f:fs,
           ph:Float64Array.from(phs),
           phase:hit, hitEnd:hit,
           phaseWhy: hit ? '' : 'the run reached its step limit at ' + n +
             ' steps and stopped short of the innermost stable orbit, so there is no ' +
             'complete phase to count.',
           tEnd:t, orbits:plan.orbits,
           cycles:hit ? ph / Math.PI : NaN };   // GW cycles = 2× orbital
}

/* The derivative of a sampled function on a NON-UNIFORM grid, by
   differentiating the Lagrange interpolant through the 2·half+1 nearest
   samples. A geometric grid is not uniform, so the textbook central difference
   is not available, and a formula written for equal spacing would be silently
   first order on it. The stencil slides at the ends rather than degrading. */
function gwLagrangeD1(xs, ys, i, half){
  const n = xs.length - 1, m = half || 2;
  if(n < 2 * m) return NaN;
  let lo = Math.max(0, Math.min(i - m, n - 2 * m));
  const hi = Math.min(n, lo + 2 * m);
  lo = Math.max(0, hi - 2 * m);
  const x = xs[i];
  let d = 0;
  for(let j = lo; j <= hi; j++){
    if(j === i){
      let s = 0;
      for(let k = lo; k <= hi; k++) if(k !== i) s += 1 / (x - xs[k]);
      d += ys[j] * s;
    } else {
      let num = 1, den = 1;
      for(let k = lo; k <= hi; k++){
        if(k !== j) den *= (xs[j] - xs[k]);
        if(k !== j && k !== i) num *= (x - xs[k]);
      }
      d += ys[j] * num / den;
    }
  }
  return d;
}

/* What a detector does with a waveform: measure the frequency at successive
   times, difference it, and invert the chirp relation for a mass. Route A's
   track goes in; a chirp mass comes out at every sample, and nothing in the
   chain has been told what the answer should be.

   The first and last two samples use a one-sided stencil, so the worst case
   over the INTERIOR is the number that means something and it is what the
   acceptance test reads. */
function gwTrackFdot(run){
  if(!run || !run.ok || run.n < 6) return { ok:false, worst:NaN };
  /* differentiated against the time REMAINING, not the time elapsed — see the
     note in gwInspiralRun. df/dt = −df/dτ, and the sign is the only cost. */
  const n = run.n, fd = new Float64Array(n + 1), mc = new Float64Array(n + 1);
  for(let i = 0; i <= n; i++){
    fd[i] = -gwLagrangeD1(run.tau, run.f, i, 2);
    mc[i] = gwMcFromFdot(run.f[i], fd[i]);
  }
  const truth = gwChirpMassS(run.m1, run.m2);
  let worst = 0, at = -1, sum = 0, cnt = 0;
  for(let i = 2; i <= n - 2; i++){
    if(!Number.isFinite(mc[i])) continue;
    const rel = Math.abs(mc[i] - truth) / truth;
    if(rel > worst){ worst = rel; at = i; }
    sum += mc[i]; cnt++;
  }
  return { ok:cnt > 0, fdot:fd, mc, truth, worst, at, mean:cnt ? sum / cnt : NaN, n };
}

/* ================= THE WAVE ITSELF, from the mass quadrupole ============== */

/* h_ij^TT = (2/D)·Ï_ij^TT, and this builds Ï by DIFFERENTIATING the quadrupole
   moment of the two orbiting bodies twice, numerically. Everything the panel
   says about the wave — its amplitude, its polarisation, and the fact that it
   arrives at twice the orbital frequency — is then measured off that rather
   than read from a formula.

   Three details that matter:

   · The trace is not removed. h₊ is ½(h_θθ − h_φφ) and h_× is h_θφ; the trace
     term is proportional to δ_ij, so it cancels out of the first and is absent
     from the second. Subtracting it would change nothing and hide that.
   · The grid wraps. One orbital period holds exactly two wave periods, so a
     periodic five-point stencil is available and the derivative is fourth
     order everywhere, joins included.
   · The amplitude is the RMS, not the maximum. max|h| over n samples is low by
     (π/n)²/2 — 3×10⁻⁵ at n = 400, thirty times the acceptance — whereas
     √(2·mean h²) is exact for a sinusoid sampled over whole periods and is
     limited only by the derivative itself. */
function gwQuadWave(m1, m2, a, D, incl, n){
  const M = m1 + m2, N = n || 400;
  const w = gwOmegaOf(M, a), T = 2 * Math.PI / w, dt = T / N;
  const r1 = m2 / M * a, r2 = m1 / M * a;      // each body's distance from the CoM
  const Ixx = new Float64Array(N), Iyy = new Float64Array(N), Ixy = new Float64Array(N);
  for(let k = 0; k < N; k++){
    const th = w * k * dt, c = Math.cos(th), s = Math.sin(th);
    const x1 = r1 * c, y1 = r1 * s, x2 = -r2 * c, y2 = -r2 * s;
    Ixx[k] = m1 * x1 * x1 + m2 * x2 * x2;
    Iyy[k] = m1 * y1 * y1 + m2 * y2 * y2;
    Ixy[k] = m1 * x1 * y1 + m2 * x2 * y2;
  }
  /* periodic five-point second derivative: (−f₂+16f₁−30f₀+16f₋₁−f₋₂)/12h² */
  const d2 = (A, k) => {
    const p = j => A[((k + j) % N + N) % N];
    return (-p(2) + 16 * p(1) - 30 * p(0) + 16 * p(-1) - p(-2)) / (12 * dt * dt);
  };
  const ci = Math.cos(incl);
  const hp = new Float64Array(N), hc = new Float64Array(N), ts = new Float64Array(N);
  let sp = 0, sc = 0;
  for(let k = 0; k < N; k++){
    const axx = d2(Ixx, k), ayy = d2(Iyy, k), axy = d2(Ixy, k);
    /* the wave leaves along n̂ = (sin ι, 0, cos ι); the polarisation basis is
       e_θ = (cos ι, 0, −sin ι) and e_φ = (0, 1, 0). The orbit is planar, so
       every component carrying a z index vanishes and the contraction is
       short: h₊ = (Ï_θθ − Ï_φφ)/D and h_× = 2Ï_θφ/D. */
    hp[k] = (ci * ci * axx - ayy) / D;
    hc[k] = 2 * ci * axy / D;
    ts[k] = k * dt;
    sp += hp[k] * hp[k]; sc += hc[k] * hc[k];
  }
  /* the frequency, counted rather than assumed: zero crossings of h₊ over one
     orbital period, located by linear interpolation */
  let cross = 0, first = NaN, last = NaN;
  for(let k = 0; k < N; k++){
    const b = hp[k], c2 = hp[(k + 1) % N];
    if(b === 0 || (b < 0) !== (c2 < 0)){
      const tz = (k + b / (b - c2)) * dt;
      if(!Number.isFinite(first)) first = tz;
      last = tz; cross++;
    }
  }
  return { t:ts, hp, hc, n:N, T, omega:w,
           ampP:Math.sqrt(2 * sp / N), ampC:Math.sqrt(2 * sc / N),
           crossings:cross,
           /* half a wave period between successive crossings, so this is the
              WAVE frequency and it is compared with 2×the orbital one */
           fMeas:cross > 1 ? (cross - 1) / (2 * (last - first)) : NaN };
}
/* The inclination pattern in closed form, for the measured amplitudes to be
   checked against: face-on gives two equal polarisations in quadrature
   (circular), edge-on gives h₊ alone at half the amplitude and no h× at all.
   Nothing a binary does produces h× by itself — that is a rotation of h₊, not
   a source. */
const gwPatternP = incl => (1 + Math.cos(incl) * Math.cos(incl)) / 2;
const gwPatternC = incl => Math.cos(incl);

/* ================= ECCENTRIC ORBITS · Peters (1964) ======================= */

/* The enhancement of the radiated power by eccentricity. At e = 0.617 —
   Hulse–Taylor — it is 11.86, and without it the predicted period decay is out
   by an order of magnitude. This is the closed form; gwAvgPower is the
   quadrature that has to reproduce it. */
const gwPetersF = e => (1 + 73 / 24 * e * e + 37 / 96 * Math.pow(e, 4)) / Math.pow(1 - e * e, 3.5);
/* the same for angular momentum, which is what drives the circularisation */
const gwPetersG = e => (1 + 7 / 8 * e * e) / Math.pow(1 - e * e, 2);

/* The INSTANTANEOUS power (Peters & Mathews 1963) at true anomaly φ on a
   Keplerian ellipse of semi-major axis a and eccentricity e:

       P = (8/15)(m₁²m₂²/r⁴)(12v² − 11ṙ²)

   A circular orbit has ṙ = 0 and v² = M/a, which collapses it to the (32/5)
   above — the check the unit suite makes first. */
function gwPowerPM(m1, m2, a, e, phi){
  const M = m1 + m2, p = a * (1 - e * e);
  const r = p / (1 + e * Math.cos(phi));
  const h = Math.sqrt(M * p);                       // specific angular momentum
  const v2 = M * (2 / r - 1 / a);
  const rdot = M / h * e * Math.sin(phi);
  return 8 / 15 * m1 * m1 * m2 * m2 / Math.pow(r, 4) * (12 * v2 - 11 * rdot * rdot);
}
/* The orbit average, by quadrature over one period with dt = (r²/h)dφ — and no
   Peters factor anywhere in it. The trapezoid is used deliberately: the
   integrand is smooth and PERIODIC, and on that class the trapezoid converges
   geometrically rather than at h². The rate is measured in tests.js by
   doubling n, because "spectral" is a claim like any other. */
function gwAvgPower(m1, m2, a, e, n){
  const M = m1 + m2, N = n || 2048, p = a * (1 - e * e);
  const h = Math.sqrt(M * p), T = 2 * Math.PI * Math.sqrt(a * a * a / M);
  let s = 0;
  for(let k = 0; k < N; k++){
    const phi = 2 * Math.PI * k / N;
    const r = p / (1 + e * Math.cos(phi));
    s += gwPowerPM(m1, m2, a, e, phi) * r * r / h;
  }
  const avg = s * (2 * Math.PI / N) / T;
  return { avg, enh: avg / gwLumOf(m1, m2, a), circ: gwLumOf(m1, m2, a) };
}

/* Peters' coupled evolution — the orbit shrinks AND rounds:
     ȧ = −(64/5)(m₁m₂M/a³)·F(e)
     ė = −(304/15)e(m₁m₂M/a⁴)(1 + 121/304 e²)/(1−e²)^(5/2)
   Same graded step as the circular run, for the same reason. */
function gwEccRun(m1, m2, a0, e0, opt){
  const o = opt || {}, M = m1 + m2;
  const aEnd = o.aEnd !== undefined ? o.aEnd : gwSepIsco(M);
  const frac = o.frac || 0.004, maxSteps = o.maxSteps || 40000;
  if(!(a0 > aEnd) || !(m1 > 0) || !(m2 > 0) || !(e0 >= 0) || e0 >= 1)
    return { ok:false, n:0 };
  const A = (a, e) => -64 / 5 * m1 * m2 * M / (a * a * a) * gwPetersF(e);
  const E = (a, e) => e <= 0 ? 0 :
    -304 / 15 * e * m1 * m2 * M / Math.pow(a, 4) *
    (1 + 121 / 304 * e * e) / Math.pow(1 - e * e, 2.5);
  const ts = [0], as = [a0], es = [e0];
  let a = a0, e = e0, t = 0, n = 0;
  while(a > aEnd && n < maxSteps){
    const h = frac * a / Math.abs(A(a, e));
    const k1a = A(a, e),                             k1e = E(a, e);
    const k2a = A(a + h / 2 * k1a, e + h / 2 * k1e), k2e = E(a + h / 2 * k1a, e + h / 2 * k1e);
    const k3a = A(a + h / 2 * k2a, e + h / 2 * k2e), k3e = E(a + h / 2 * k2a, e + h / 2 * k2e);
    const k4a = A(a + h * k3a, e + h * k3e),         k4e = E(a + h * k3a, e + h * k3e);
    a += h / 6 * (k1a + 2 * k2a + 2 * k3a + k4a);
    e = Math.max(0, e + h / 6 * (k1e + 2 * k2e + 2 * k3e + k4e));
    t += h; n++;
    ts.push(t); as.push(a); es.push(e);
  }
  return { ok:n > 2, n, t:Float64Array.from(ts), a:Float64Array.from(as),
           e:Float64Array.from(es), tMerge:t, m1, m2, M, a0, e0, aEnd,
           hitEnd:n < maxSteps };
}
/* Peters' closed-form trajectory in the (a, e) plane — the SHAPE of the decay,
   with time eliminated. Route B for gwEccRun, sharing nothing with it: no
   integration, no step, no time. */
function gwPetersAE(a0, e0, e){
  if(!(e0 > 0) || !(e > 0)) return NaN;
  const g = x => Math.pow(x, 12 / 19) / (1 - x * x) * Math.pow(1 + 121 / 304 * x * x, 870 / 2299);
  return a0 * g(e) / g(e0);
}

/* Kepler's third law, both ways round */
const gwSepOfPeriod = (M, P) => Math.cbrt(M * P * P / (4 * Math.PI * Math.PI));
const gwPeriodOf = (M, a) => 2 * Math.PI * Math.sqrt(a * a * a / M);

/* The orbital period's decay — what a pulsar timing campaign measures.
   P² = 4π²a³/M gives Ṗ/P = (3/2)ȧ/a, and with Peters' ȧ:

       Ṗ = −(96/5)(2π)^(8/3)P^(−5/3)Mc^(5/3)F(e)

   which is the textbook −(192π/5)(2πMc/P)^(5/3)F(e) with the 2π collected.
   THE SECOND ROUTE (gwPdotAvg) reaches the same number through the numerical
   orbit average instead: ⟨P_rad⟩ by quadrature, dE/da by a five-point
   derivative, and Kepler's third law. There is no F(e) anywhere in it. */
const gwPdotOf = (m1, m2, P, e) =>
  -96 / 5 * Math.pow(2 * Math.PI, 8 / 3) * Math.pow(P, -5 / 3) *
  Math.pow(gwChirpMassS(m1, m2), 5 / 3) * gwPetersF(e);
function gwPdotAvg(m1, m2, P, e, n){
  const a = gwSepOfPeriod(m1 + m2, P);
  const L = gwAvgPower(m1, m2, a, e, n || 4096).avg;
  const dEda = rlDeriv(x => gwEorbOf(m1, m2, x), a);
  if(!Number.isFinite(dEda) || dEda === 0) return NaN;
  return 1.5 * P * (-L / dEda) / a;
}

/* ============================ the binaries ================================ */
/* Real systems, each carrying the quantity that was actually MEASURED as its
   primary datum — a pulsar's orbital period, a detection's band-entry
   frequency — with everything else derived from it. The declared numbers are
   claims, and ./auditclaims.ps1 recomputes every one of them by a route that
   shares nothing with the declaration. */
const GW_BINARIES = {
  gw150914: {
    nm:'GW150914', sub:'the first one — two black holes, 1.3 billion ly away',
    m1:35.6, m2:30.6, fgw:35, e:0, dMpc:440, mf:63.1,
    sepKm:899.038, tc:0.183308, fIsco:66.4226,
    note:'The first direct detection, 14 September 2015, and the loudest event for years afterwards. It entered LIGO\'s band near 35 Hz and merged a fifth of a second later. Two black holes of 36 and 31 solar masses left one of 63: three solar masses went out as pure spacetime strain, briefly outshining every star in the observable universe combined.'
  },
  gw170817: {
    nm:'GW170817', sub:'two neutron stars, and a gamma-ray burst 1.7 s later',
    m1:1.46, m2:1.27, fgw:24, e:0, dMpc:40, mf:null,
    sepKm:399.4392, tc:101.7612, fIsco:1610.687,
    note:'A neutron-star merger in NGC 4993, seen in gravitational waves and then, 1.7 seconds later, in gamma rays — which pinned the speed of gravitational waves to c within one part in 10¹⁵ and eliminated a swathe of modified-gravity theories overnight. Its optical counterpart showed freshly made heavy elements: mergers like this are where a good deal of the universe\'s gold comes from. Being light, it stayed in band for about a minute rather than a fifth of a second.'
  },
  psr1913: {
    nm:'PSR B1913+16', sub:'Hulse–Taylor — the first evidence, and a Nobel prize',
    m1:1.438, m2:1.390, pbDays:0.322997448918, e:0.6171340, dMpc:5.25e-3,
    sepKm:1949032, pdot:-2.40210e-12, pdotObs:-2.398e-12, obsRatio:0.9983, obsErr:0.0016,
    note:'Discovered by Hulse and Taylor in 1974 and timed ever since. Its orbit shrinks by about three and a half metres a year, exactly as the quadrupole formula says it must, and that agreement was the first evidence that gravitational waves exist and carry energy away — forty years before one was caught directly. Nobel prize, 1993. The eccentricity does most of the work: 0.617 multiplies the radiated power by 11.86.'
  },
  j0737: {
    nm:'PSR J0737−3039', sub:'the double pulsar — the sharpest test there is',
    m1:1.338185, m2:1.248868, pbDays:0.1022515592973, e:0.087777023, dMpc:0.735e-3,
    sepKm:878836.7, pdot:-1.24781e-12, pdotObs:-1.247920e-12, obsRatio:0.999963, obsErr:0.000063,
    note:'The only known system in which BOTH neutron stars are seen as pulsars, which makes the mass ratio a measurement rather than a fit. Sixteen years of timing put the observed decay within 0.004% of the quadrupole prediction — general relativity\'s most precise confirmation in a strong field, and the reason this system has replaced Hulse–Taylor as the headline test.'
  },
  hmcnc: {
    nm:'HM Cancri', sub:'two white dwarfs, 321 seconds apart',
    m1:0.55, m2:0.27, pbSec:321.529, e:0, dMpc:5e-3,
    sepKm:65806.48, pdotObs:-3.63e-11,
    note:'The shortest-period binary known: two white dwarfs going round each other five times an hour, at a separation a fifth of the Earth–Moon distance. Its period is measurably shortening, and it is one of the verification binaries LISA will see the moment it is switched on — a source whose waveform is known in advance from optical astronomy. Note which way the inference runs here: the masses are hard to measure and the decay is not, so the observed Ṗ is the datum and the chirp mass comes out of it — 0.319 M☉, against the 0.331 the quoted masses give.'
  },
  sunearth: {
    nm:'The Sun and the Earth', sub:'the control — nothing measurable happens',
    m1:1, m2:3.0034e-6, pbDays:365.256, e:0.0167, dMpc:1e-9,
    sepKm:149597775, lumW:196.6179,
    note:'The same formulas applied to the system everybody knows. The Earth radiates about two hundred watts of gravitational waves — three light bulbs, from a planet — and the orbit shrinks by roughly a proton\'s width every three hundred years. The merger time is 10¹³ times the age of the universe. This entry is here because a laboratory that cannot report "nothing measurable happens" cannot be trusted when it reports that something did.'
  }
};

/* The separation of a preset, derived from whichever quantity it actually
   measured. A pulsar's period is known to fifteen figures and its separation to
   four, so the period is the datum and the separation follows — never the
   other way round. */
function gwBinarySep(B){
  const M = gwMs(B.m1) + gwMs(B.m2);
  if(B.pbDays !== undefined) return gwSepOfPeriod(M, B.pbDays * 86400);
  if(B.pbSec  !== undefined) return gwSepOfPeriod(M, B.pbSec);
  if(B.fgw    !== undefined) return gwSepOfFgw(M, B.fgw);
  return gwLs(B.sepKm * 1000);
}
/* and its orbital period, from the same datum */
function gwBinaryPeriod(B){
  if(B.pbDays !== undefined) return B.pbDays * 86400;
  if(B.pbSec  !== undefined) return B.pbSec;
  return gwPeriodOf(gwMs(B.m1) + gwMs(B.m2), gwBinarySep(B));
}
