/* ============================================================================
   3lc · A DISPERSION RELATION, AND A LATTICE, THE READER WRITES

   ── The speeds stage ───────────────────────────────────────────────────────
   `smMaxwell` is derived from a Boltzmann factor in ½mv² times the 4πv² of
   velocity space, and every number the preset prints — the three speeds, their
   fixed ratio, equipartition, the heat capacity 3k/2 — is a consequence of
   TWO choices nobody is asked about: that the energy is quadratic in the
   momentum, and that space has three dimensions. So the reader writes the
   dispersion relation ε(p) and picks the dimension, and then:

     · the speed is v = dε/dp — the group velocity, computed, not p/m;
     · ⟨p·dε/dp⟩ is integrated and compared with d·kT. That identity is the
       equipartition theorem in the only form that survives a general ε, and
       it is exact by an integration by parts, so the residual is quadrature
       error and nothing else;
     · the heat capacity is measured as d⟨ε⟩/dT, and separately predicted as
       d/n·k from the power n FITTED to ε(p) over the thermally occupied
       range. Agreement is the generalised equipartition law; a large fit
       residual says the dispersion was not a power law, which is exactly what
       a relativistic gas does as it crosses over from 3k/2 to 3k;
     · a pure power law also has closed-form moments through Γ, and those are
       printed beside the quadrature. For p²/2m in three dimensions they are
       `smVmp`, `smVavg` and `smVrms` — the engine that was here first.

   ── The Ising stage ────────────────────────────────────────────────────────
   The preset simulates the ISOTROPIC square lattice and compares it with
   Onsager's 2.269. The anisotropic lattice is also exactly solved:

       sinh(2J_x/kT_c) · sinh(2J_y/kT_c) = 1

   which contains the one-dimensional chain as the limit J_y → 0, where the
   left-hand side can never reach 1 and there is no transition at any positive
   temperature. So the reader writes J_x, J_y, h and the lattice size, and the
   simulation LOCATES T_c — from the peak of the specific heat measured as an
   energy fluctuation, and again from the peak of the susceptibility — while
   the exact criterion is solved separately by bisection. Neither knows about
   the other, and the panel prints the gap.

   The sweeps take a seeded generator, so the same sheet gives the same numbers
   twice and a difference between two runs means something.

   Prefix: sm
   ============================================================================ */

/* ---- a dispersion relation, typed ---------------------------------------- */
/* p rides on x and m on y; c is spliced in as the exact defined metre-second
   constant, so `sqrt(p^2*c^2 + m^2*c^4)` is a thing a reader can type. The
   lookarounds keep the p of `exp`, the m of nothing and the c of `cos`,
   `cosh` and `acos` untouched. */
const SM_C_LIGHT = 299792458;
const smDispAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])p(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])m(?![A-Za-z])/g, 'y')
  .replace(/(?<![A-Za-z])c(?![A-Za-z])/g, '(' + SM_C_LIGHT + ')'));
function smDispFn(src, fallback){
  try { const g = compile(smDispAst(src)); return (p, m) => g(p, m, 0); }
  catch(e){ return fallback || (() => 0); }
}
const smDispBuild = s => { const g = compile(smDispAst(s)); return { f:(p, m) => g(p, m, 0) }; };

/* Where to stop integrating, found rather than guessed. The weight falls as
   e^(−Δε/kT), so the cut-off is the momentum at which ε has risen by `mult`
   times kT — bracketed by doubling from the classical scale √(2mkT) and then
   bisected. A dispersion that flattens out never gets there, and saying so is
   better than integrating a divergent distribution. */
function smDispCut(eps, m, kT, mult){
  const e0 = eps(0, m);
  if(!Number.isFinite(e0)) return null;
  let p = Math.sqrt(2 * m * kT);
  if(!(p > 0)) p = 1e-30;
  for(let k = 0; k < 220; k++){
    const v = eps(p, m);
    if(Number.isFinite(v) && v - e0 > mult * kT) break;
    p *= 1.6;
    if(!(p < 1e120)) return null;
  }
  const v = eps(p, m);
  if(!(Number.isFinite(v) && v - e0 > mult * kT)) return null;
  const r = nqBisect(x => eps(x, m) - e0 - mult * kT, 0, p, 1e-15 * p, 300);
  return r === null ? p : r;
}

/* ----------------------------------------------------------------------------
   THE KINETIC REPORT

   Everything is a ratio of two integrals over the same weight, so the whole
   calculation is done in the scaled variable u = p/p_max and the common factor
   p_max^(d−1) cancels — which matters, because a momentum is 10⁻²⁴ and its
   fifth power is not a number to be multiplying distributions by.
   ---------------------------------------------------------------------------- */
function smKinetic(eps, m, T, d, panels){
  if(!(m > 0) || !(T > 0) || !(d >= 1))
    return { ok:false, why:'the mass, the temperature and the dimension must all be positive' };
  const kT = SM_KB * T;
  const e0 = eps(0, m);
  if(!Number.isFinite(e0))
    return { ok:false, why:'ε(p) is not a finite number at p = 0' };
  const pMax = smDispCut(eps, m, kT, 60);
  if(pMax === null || !(pMax > 0))
    return { ok:false, why:'ε(p) never rises by 60 kT, so the Boltzmann weight never falls and the ' +
      'distribution cannot be normalised — the energy has to grow with the momentum' };
  /* increasing, and by enough to have a group velocity worth the name */
  const tol = 1e-11 * 60 * kT;
  let prev = e0;
  for(let i = 1; i <= 400; i++){
    const v = eps(pMax * i / 400, m);
    if(!Number.isFinite(v))
      return { ok:false, why:'ε(p) is not a finite number everywhere below the cut-off' };
    if(v < prev - tol)
      return { ok:false, why:'ε(p) falls somewhere below the cut-off. A dispersion that decreases has ' +
        'states of negative group velocity, and no speed distribution can be built from it' };
    prev = v;
  }
  const de = p => eps(p, m) - e0;
  const hv = pMax * 1e-6;
  /* the group velocity, v = dε/dp, one-sided at the origin */
  const vel = p => {
    const a = Math.max(0, p - hv), b = p + hv;
    return (eps(b, m) - eps(a, m)) / (b - a);
  };
  /* ε″, on a step a thousand times coarser. A second difference divides by h²,
     so the same step that is right for a first derivative loses eight digits
     here — and this one only has to locate a maximum, where truncation is
     harmless and noise is not. */
  const h2 = pMax * 1e-3;
  const acc = p => (p >= h2
    ? (eps(p + h2, m) - 2 * eps(p, m) + eps(p - h2, m))
    : (eps(p + 2 * h2, m) - 2 * eps(p + h2, m) + eps(p, m))) / (h2 * h2);
  const wt = u => Math.pow(u, d - 1) * Math.exp(-de(u * pMax) / kT);
  const np = Math.max(80, panels || 320);
  const I = f => nqGauss(u => f(u) * wt(u), 0, 1, 5, np);
  const Z = I(() => 1);
  if(!(Z > 0)) return { ok:false, why:'the distribution integrates to zero — nothing is populated' };
  const avg = f => I(f) / Z;
  const eAvg = avg(u => de(u * pMax));
  const vAvg = avg(u => vel(u * pMax));
  const v2 = avg(u => { const v = vel(u * pMax); return v * v; });
  /* the equipartition integral: ⟨p·dε/dp⟩, which an integration by parts makes
     exactly d·kT for ANY ε that grows — the theorem, in the only form that
     survives leaving ½mv² behind */
  const virial = avg(u => u * pMax * vel(u * pMax));
  /* the most probable SPEED, which is not the speed at the most probable
     momentum: changing variable to v carries a Jacobian dp/dv = 1/ε″(p), and
     dropping it is the commonest way to get this wrong */
  let bu = 0, bv = -Infinity, convex = true;
  for(let i = 1; i <= 400; i++){
    const u = i / 400, a = acc(u * pMax);
    if(!(a > 0)){ convex = false; continue; }
    const g = Math.log(Math.max(1e-300, wt(u))) - Math.log(a);
    if(g > bv){ bv = g; bu = u; }
  }
  let vMode = NaN;
  if(convex && bu > 0){
    const gOf = u => Math.log(Math.max(1e-300, wt(u))) - Math.log(Math.max(1e-300, acc(u * pMax)));
    const G = smGoldenMax(gOf, Math.max(1e-6, bu - 1 / 400), Math.min(1, bu + 1 / 400), 70);
    vMode = vel(G.x * pMax);
  }
  /* the heat capacity, measured: recompute the whole quadrature either side */
  const eOf = t => {
    const R = smKineticEnergy(eps, m, t, d, np);
    return R === null ? NaN : R;
  };
  const dT = T * 2e-3;
  const C = (eOf(T + dT) - eOf(T - dT)) / (2 * dT);
  /* the power in ε(p), FITTED over the thermally occupied decade */
  const pTh = smDispCut(eps, m, kT, 1) || pMax * 0.2;
  const xs = [], ys = [];
  for(let i = 0; i <= 24; i++){
    const p = pTh * Math.pow(4, -1 + 2 * i / 24);
    const y = de(p);
    if(p > 0 && y > 0){ xs.push(Math.log(p)); ys.push(Math.log(y)); }
  }
  const fit = smFitLine(xs, ys);
  /* and what a pure power law of that exponent predicts, through Γ */
  const nP = fit.m, aP = Math.exp(fit.b);
  const mom = k => (Number.isFinite(nP) && nP > 0 && aP > 0)
    ? Math.pow(kT / aP, k / nP) * pbGamma((d + k) / nP) / pbGamma(d / nP) : NaN;
  const vPower = Number.isFinite(nP) ? aP * nP * mom(nP - 1) : NaN;
  return { ok:true, T, kT, d, m, pMax, e0,
           Z, eAvg, vAvg, vRms:Math.sqrt(Math.max(0, v2)), vMode, vMax:vel(pMax),
           virial, dkT:d * kT,
           equip:virial / (d * kT),
           C, Cok:C / SM_KB,
           n:nP, a:aP, fitResid:fit.resid,
           CokPred:Number.isFinite(nP) && nP !== 0 ? d / nP : NaN,
           vPower, ePower:Number.isFinite(nP) ? d / nP * kT : NaN,
           /* what the classical gas in three dimensions would have said */
           vmpClassic:smVmp(m, T), vavgClassic:smVavg(m, T), vrmsClassic:smVrms(m, T),
           convex, pTh };
}
/* the mean energy alone, for the temperature derivative — a separate cut-off
   and a separate quadrature at each temperature, so nothing is shared with the
   value being differentiated */
function smKineticEnergy(eps, m, T, d, panels){
  const kT = SM_KB * T, e0 = eps(0, m);
  const pMax = smDispCut(eps, m, kT, 60);
  if(pMax === null || !(pMax > 0)) return null;
  const wt = u => Math.pow(u, d - 1) * Math.exp(-(eps(u * pMax, m) - e0) / kT);
  const Z = nqGauss(wt, 0, 1, 5, panels || 320);
  if(!(Z > 0)) return null;
  return nqGauss(u => (eps(u * pMax, m) - e0) * wt(u), 0, 1, 5, panels || 320) / Z;
}

/* The distribution itself, for drawing. Normally over SPEED: g(v) ∝ w(p)/ε″(p)
   at the p giving that speed, Jacobian included. A dispersion with no curvature
   — ε = pc, where every particle moves at exactly c — has no speed
   distribution at all, and the honest thing is to draw the momentum
   distribution and say which one is on the axis. */
function smSpeedCurve(eps, m, T, d, n){
  const R = smKinetic(eps, m, T, d, 160);
  if(!R.ok) return { ok:false, why:R.why };
  const N = Math.max(40, n || 220);
  const kT = SM_KB * T, e0 = eps(0, m);
  const hv = R.pMax * 1e-6, h2 = R.pMax * 1e-3;
  const vel = p => {
    const a = Math.max(0, p - hv), b = p + hv;
    return (eps(b, m) - eps(a, m)) / (b - a);
  };
  const acc = p => (p >= h2
    ? (eps(p + h2, m) - 2 * eps(p, m) + eps(p - h2, m))
    : (eps(p + 2 * h2, m) - 2 * eps(p + h2, m) + eps(p, m))) / (h2 * h2);
  const pts = [];
  let top = 0;
  for(let i = 1; i <= N; i++){
    const u = i / N, p = u * R.pMax;
    const w = Math.pow(u, d - 1) * Math.exp(-(eps(p, m) - e0) / kT);
    const a = acc(p);
    const g = R.convex && a > 0 ? w / a : w;
    pts.push({ x:R.convex ? vel(p) : p, g });
    if(g > top) top = g;
  }
  for(const q of pts) q.g = top > 0 ? q.g / top : 0;
  return { ok:true, mode:R.convex ? 'v' : 'p', pts, R,
           xmax:pts.length ? pts[pts.length - 1].x : 1 };
}

/* ---- the anisotropic Ising lattice --------------------------------------- */
/* A seeded generator, so a sheet gives the same numbers twice. Without it the
   panel's own readout drifts between two evaluations of an unchanged scenario,
   and there is no way to tell a real difference from Monte Carlo noise. */
function smRng(seed){
  let s = (seed >>> 0) || 12345;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function smIsingInitR(L, hot, rnd){
  const s = new Int8Array(L * L);
  for(let i = 0; i < s.length; i++) s[i] = hot ? (rnd() < 0.5 ? -1 : 1) : 1;
  return s;
}
/* Metropolis with the two directions coupled differently. Only nine
   neighbour sums are possible, so the Boltzmann factors are tabulated once per
   sweep rather than exponentiated L² times. */
function smIsingSweepA(s, L, T, Jx, Jy, h, rnd){
  const b = 1 / Math.max(1e-9, T);
  const tab = new Float64Array(18);
  for(let a = 0; a < 2; a++) for(let ix = 0; ix < 3; ix++) for(let iy = 0; iy < 3; iy++){
    const si = a ? 1 : -1, nx = (ix - 1) * 2, ny = (iy - 1) * 2;
    const dE = 2 * si * (Jx * nx + Jy * ny + h);
    tab[(a * 3 + ix) * 3 + iy] = dE <= 0 ? 1 : Math.exp(-b * dE);
  }
  const N = L * L;
  for(let t = 0; t < N; t++){
    const i = (rnd() * L) | 0, j = (rnd() * L) | 0, k = i * L + j;
    const nx = s[i * L + (j + 1) % L] + s[i * L + (j - 1 + L) % L];
    const ny = s[((i + 1) % L) * L + j] + s[((i - 1 + L) % L) * L + j];
    const p = tab[(((s[k] > 0 ? 1 : 0) * 3) + (nx / 2 + 1)) * 3 + (ny / 2 + 1)];
    if(p >= 1 || rnd() < p) s[k] = -s[k];
  }
  return s;
}
function smIsingObsA(s, L, Jx, Jy, h){
  let M = 0, E = 0;
  for(let i = 0; i < L; i++) for(let j = 0; j < L; j++){
    const k = i * L + j;
    M += s[k];
    E -= Jx * s[k] * s[i * L + (j + 1) % L] + Jy * s[k] * s[((i + 1) % L) * L + j] + h * s[k];
  }
  const N = L * L;
  return { m:M / N, absm:Math.abs(M) / N, e:E / N };
}

/* ln sinh, without the overflow. sinh(2J/T) at T → 0 is 10^300 and the
   criterion below would come back Infinity − Infinity; written in logarithms
   it stays a number all the way down. */
const smLnSinh = x => (x > 20 ? x - Math.LN2 + Math.log1p(-Math.exp(-2 * x))
                              : Math.log(Math.sinh(Math.max(1e-300, x))));
/* Onsager's criterion for the anisotropic square lattice, solved rather than
   quoted: sinh(2Jx/T)·sinh(2Jy/T) = 1. Isotropic, it returns 2/ln(1+√2).
   With Jy = 0 the product is identically zero and there is no root at any
   positive temperature — which IS the one-dimensional result, and the function
   returns 0 to say so. */
function smIsingTcExact(Jx, Jy){
  if(!(Jx > 0) || !(Jy > 0)) return 0;
  const F = T => smLnSinh(2 * Jx / T) + smLnSinh(2 * Jy / T);
  const lo = (Jx + Jy) * 1e-4, hi = (Jx + Jy) * 200;
  const r = nqBisect(F, lo, hi, 1e-14 * (Jx + Jy), 300);
  return r === null ? 0 : r;
}

/* the vertex of the parabola through three equally spaced samples — how a peak
   is located from a scan that has no reason to have sampled its top */
function smParabolicPeak(xs, ys, i){
  if(i <= 0 || i >= xs.length - 1) return xs[i];
  const y0 = ys[i - 1], y1 = ys[i], y2 = ys[i + 1];
  const den = y0 - 2 * y1 + y2;
  if(!(Math.abs(den) > 1e-300)) return xs[i];
  const dx = (xs[i + 1] - xs[i - 1]) / 2;
  const off = 0.5 * (y0 - y2) / den;
  return xs[i] + Math.max(-1, Math.min(1, off)) * dx;
}

/* ----------------------------------------------------------------------------
   THE SCAN

   At each temperature: equilibrate, then average over sweeps. The specific
   heat comes from the energy fluctuation and the susceptibility from the
   magnetisation fluctuation — both are the fluctuation–response identity, so
   neither is a derivative of anything and neither knows where the transition
   is. Their peaks are then located by parabolic interpolation.

   A finite lattice rounds the transition and shifts its apparent position
   upwards by O(1/L); that is a real, well-understood effect and the panel
   reports the gap rather than hiding it.
   ---------------------------------------------------------------------------- */
function smIsingScan(Jx, Jy, h, L, tLo, tHi, nT, eq, meas, seed){
  const rows = [];
  const N = L * L;
  const rnd = smRng(seed || 20260812);
  /* Annealed DOWNWARD, carrying the configuration from one temperature to the
     next. Restarting hot at every temperature is the obvious thing and it is
     the wrong thing: near the transition the relaxation time diverges — that
     is critical slowing down, and this stage has a demo about it — so a fresh
     random lattice has not equilibrated in any affordable number of sweeps and
     the fluctuation comes out both noisy and biased. Cooling gradually starts
     each temperature from a configuration that was already in equilibrium a
     small step away. */
  const s = smIsingInitR(L, true, rnd);
  for(let i = nT - 1; i >= 0; i--){
    const T = tLo + (tHi - tLo) * (nT === 1 ? 0 : i / (nT - 1));
    for(let k = 0; k < eq; k++) smIsingSweepA(s, L, T, Jx, Jy, h, rnd);
    let e = 0, e2 = 0, am = 0, m2 = 0;
    for(let k = 0; k < meas; k++){
      smIsingSweepA(s, L, T, Jx, Jy, h, rnd);
      const O = smIsingObsA(s, L, Jx, Jy, h);
      e += O.e; e2 += O.e * O.e; am += O.absm; m2 += O.m * O.m;
    }
    e /= meas; e2 /= meas; am /= meas; m2 /= meas;
    rows.push({ T, e, absm:am,
                c:N * Math.max(0, e2 - e * e) / (T * T),
                chi:N * Math.max(0, m2 - am * am) / T });
  }
  rows.reverse();                       // cooled downward, reported upward
  const pick = key => {
    let bi = 0;
    for(let i = 1; i < rows.length; i++) if(rows[i][key] > rows[bi][key]) bi = i;
    return { i:bi, T:smParabolicPeak(rows.map(r => r.T), rows.map(r => r[key]), bi),
             edge:bi === 0 || bi === rows.length - 1 };
  };
  const pc = pick('c'), px = pick('chi');
  const exact = smIsingTcExact(Jx, Jy);
  return { rows, L, Jx, Jy, h, exact,
           TcC:pc.T, TcChi:px.T, edgeC:pc.edge, edgeChi:px.edge,
           relC:exact > 0 ? Math.abs(pc.T - exact) / exact : NaN,
           relChi:exact > 0 ? Math.abs(px.T - exact) / exact : NaN };
}

/* ---- the lattice sheet --------------------------------------------------- */
const SM_ISING_KEYS = {
  jx:   { k:'Jx',   lo:0,   hi:10,     d:1,   what:'the coupling along the rows' },
  jy:   { k:'Jy',   lo:0,   hi:10,     d:1,   what:'the coupling along the columns' },
  h:    { k:'h',    lo:-2,  hi:2,      d:0,   what:'the external field' },
  l:    { k:'L',    lo:8,   hi:64,     d:24,  what:'the side of the lattice' },
  seed: { k:'seed', lo:1,   hi:1e9,    d:7,   what:'the random seed' }
};
function smParseIsing(text){
  const out = {}, errs = [], seen = {};
  for(const k in SM_ISING_KEYS) out[k] = SM_ISING_KEYS[k].d;
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,=:]+/).filter(s => s.length);
    if(tk.length < 2){
      errs.push({ line:i + 1, msg:'"' + esc(bare.slice(0, 24)) + '" needs a name and then a number' });
      continue;
    }
    const key = tk[0].toLowerCase(), spec = SM_ISING_KEYS[key];
    if(!spec){
      errs.push({ line:i + 1, msg:'"' + esc(tk[0]) + '" is not one of <b>' +
        Object.keys(SM_ISING_KEYS).map(s => SM_ISING_KEYS[s].k).join(' ') + '</b>' });
      continue;
    }
    const v = Number(tk[1]);
    if(!Number.isFinite(v)){
      errs.push({ line:i + 1, msg:'"' + esc(tk[1]) + '" is not a number' });
      continue;
    }
    if(v < spec.lo || v > spec.hi){
      errs.push({ line:i + 1, msg:'<b>' + spec.k + '</b> is ' + spec.what + ', and ' + fmtNum(v, 4) +
        ' is outside ' + spec.lo + ' to ' + spec.hi });
      continue;
    }
    if(seen[key]) errs.push({ line:i + 1, msg:'<b>' + spec.k + '</b> was already given on line ' + seen[key] });
    seen[key] = i + 1;
    out[key] = v;
  }
  out.l = Math.round(out.l);
  out.seed = Math.round(out.seed);
  if(!Object.keys(seen).length && !errs.length)
    errs.push({ line:0, msg:'nothing here — write one property per line, a name then a number' });
  if(out.jx <= 0 && out.jy <= 0 && !errs.length)
    errs.push({ line:0, msg:'both couplings are zero, so the spins do not interact at all — ' +
      'make at least one of <b>Jx</b> and <b>Jy</b> positive' });
  return { ok:errs.length === 0, M:out, errs, given:seen };
}
