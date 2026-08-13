/* ============================================================================
   3lb · A LEVEL SCHEME, AND A MULTIPLICITY, THE READER WRITES

   Two editors share this file because they are one argument at two removes.
   `smBoltz` takes a list of energy levels and claims that a single sum holds
   every thermodynamic property the system has; `smCount` takes a multiplicity
   and claims that the slope of its logarithm is a temperature and that the
   curvature of it is a fluctuation. Both are theorems the preset tables are
   allowed to assume. Here they are checked, by computing the same quantity
   along routes that share no code and printing the gap.

   What is measured rather than asserted:

     · ⟨E⟩ by Σ EᵢPᵢ, and again by −∂lnZ/∂β
     · C by the energy fluctuation ⟨E²⟩−⟨E⟩², and again by dU/dT
     · S by Gibbs' −kΣ pᵢ ln pᵢ, and again by (U−F)/T, which sees only Z
     · the heat-capacity peak located by golden section AND by bisecting
       dC/dT — and, for a two-level scheme, against the root of
       x·tanh((x − ln r)/2) = 2, which is where 0.417 ΔE/k comes from
     · that the peak temperature is exactly proportional to the level spacing,
       SWEPT over a hundredfold rather than sampled twice
     · S(T→∞) against k ln Σgᵢ, and S(T→0) against k ln g₀ — the third law
     · the equilibrium split by maximising S_A+S_B, and again by bisecting
       T_A = T_B, so "equilibrium is equal temperature" becomes a result
     · the width of that peak from the curvature −1/S″ and from the
       distribution summed outright — the Gaussian approximation, tested
     · the 1/√N law as a FITTED exponent across four system sizes, so an
       entropy that is not extensive reports the exponent it actually has

   Prefix: sm
   ============================================================================ */

/* Golden-section maximisation. Every peak in this file is LOCATED rather than
   read off a formula, and this is what locates them: it needs no derivative,
   so it cannot be fooled by a level scheme whose C(T) is a sum of hundreds of
   exponentials. Its companion is always a root-find on the derivative, and the
   two answers are printed together. */
function smGoldenMax(f, a, b, it){
  const R = (Math.sqrt(5) - 1) / 2;
  let x1 = b - R * (b - a), x2 = a + R * (b - a);
  let f1 = f(x1), f2 = f(x2);
  for(let k = 0; k < (it || 90); k++){
    if(f1 < f2){ a = x1; x1 = x2; f1 = f2; x2 = a + R * (b - a); f2 = f(x2); }
    else       { b = x2; x2 = x1; f2 = f1; x1 = b - R * (b - a); f1 = f(x1); }
  }
  const x = (a + b) / 2;
  return { x, f:f(x), a, b };
}

/* Least squares on (x, y) pairs. Used for the two fitted exponents — the
   1/√N law and the power in a dispersion — because an exponent that is
   asserted teaches nothing and an exponent that is fitted comes with a
   residual saying whether it was a power law at all. */
function smFitLine(xs, ys){
  const n = xs.length;
  if(n < 2) return { m:NaN, b:NaN, resid:NaN };
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for(let i = 0; i < n; i++){ sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; sxy += xs[i] * ys[i]; }
  const den = n * sxx - sx * sx;
  const m = den === 0 ? NaN : (n * sxy - sx * sy) / den;
  const b = (sy - m * sx) / n;
  let r = 0;
  for(let i = 0; i < n; i++) r += Math.pow(ys[i] - (m * xs[i] + b), 2);
  return { m, b, resid:Math.sqrt(r / n) };
}

/* Log-gamma, by Lanczos. `smLogBinom` counts up to k in a loop, which is exact
   for a whole number of quanta and quietly WRONG for anything else — it
   truncates. Everything below treats the energy of a block as a continuous
   variable so that it can be differentiated and maximised, so the Einstein
   solid needs a multiplicity that is smooth between the integers, and this is
   it. At whole numbers the two agree to twelve digits, which the suite checks. */
const SM_LANCZOS = [676.5203681218851, -1259.1392167224028, 771.32342877765313,
                    -176.61502916214059, 12.507343278686905, -0.13857109526572012,
                    9.9843695780195716e-6, 1.5056327351493116e-7];
function smLogGamma(z){
  if(z < 0.5)   // reflection, so the function is defined either side of the origin
    return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - smLogGamma(1 - z);
  const x = z - 1;
  let a = 0.99999999999980993;
  for(let i = 0; i < SM_LANCZOS.length; i++) a += SM_LANCZOS[i] / (x + i + 1);
  const t = x + SM_LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/* the Einstein solid's exact multiplicity, continued off the integers */
const smEinsteinS = (q, N) =>
  smLogGamma(q + N) - smLogGamma(q + 1) - smLogGamma(N);

/* ----------------------------------------------------------------------------
   THE LEVEL SHEET

   One level per line — an energy in eV and an optional degeneracy — with two
   generators for the schemes nobody would type by hand:

     0.05  3          a level at 0.05 eV, threefold degenerate
     ladder 0.03 40   an evenly spaced ladder: 40 levels, spacing 0.03 eV
     rotor 0.002 30   a rigid rotor: E = B·J(J+1), g = 2J+1, up to J = 30

   Never throws; every complaint carries its line number. A sheet with a single
   distinct energy is rejected, because a system with nothing to absorb energy
   into has no temperature dependence at all and every measurement below would
   be a trivially satisfied zero.
   ---------------------------------------------------------------------------- */
const SM_LEVEL_CAP = 900;

function smParseLevels(text){
  const levels = [], errs = [];
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  const num = s => { const v = Number(s); return Number.isFinite(v) ? v : NaN; };
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,]+/).filter(s => s.length);
    const head = tk[0].toLowerCase();
    if(head === 'ladder' || head === 'rotor'){
      if(tk.length < 3){
        errs.push({ line:i + 1, msg:'<b>' + esc(head) + '</b> needs two numbers after it — ' +
          (head === 'ladder' ? 'a spacing in eV and how many levels' : 'a rotational constant B in eV and the highest J') });
        continue;
      }
      const a = num(tk[1]), n = num(tk[2]), g = tk.length > 3 ? num(tk[3]) : 1;
      if(!(a > 0) || a > 1000){
        errs.push({ line:i + 1, msg:'"' + esc(tk[1]) + '" must be a positive energy below 1000 eV' });
        continue;
      }
      if(!(n >= 2) || n > 400 || Math.abs(n - Math.round(n)) > 1e-9){
        errs.push({ line:i + 1, msg:'"' + esc(tk[2]) + '" must be a whole number from 2 to 400' });
        continue;
      }
      if(!(g >= 1) || g > 1e6){
        errs.push({ line:i + 1, msg:'the degeneracy "' + esc(String(tk[3])) + '" must be at least 1' });
        continue;
      }
      if(head === 'ladder')
        for(let k = 0; k < n; k++) levels.push({ E:a * k, g });
      else
        for(let J = 0; J <= n; J++) levels.push({ E:a * J * (J + 1), g:g * (2 * J + 1) });
      continue;
    }
    const E = num(tk[0]);
    if(!Number.isFinite(E)){
      errs.push({ line:i + 1, msg:'"' + esc(tk[0].slice(0, 20)) + '" is neither a number nor one of ' +
        '<b>ladder</b> or <b>rotor</b>' });
      continue;
    }
    if(Math.abs(E) > 1e4){
      errs.push({ line:i + 1, msg:'an energy of ' + fmtNum(E, 4) + ' eV is outside ±10 000 eV' });
      continue;
    }
    const g = tk.length > 1 ? num(tk[1]) : 1;
    if(!(g >= 1) || g > 1e6 || Math.abs(g - Math.round(g)) > 1e-9){
      errs.push({ line:i + 1, msg:'the degeneracy "' + esc(String(tk[1])) + '" must be a whole number of at least 1' });
      continue;
    }
    levels.push({ E, g:Math.round(g) });
  }
  if(levels.length > SM_LEVEL_CAP)
    errs.push({ line:0, msg:'that is ' + levels.length + ' levels — keep it under ' + SM_LEVEL_CAP });
  if(!levels.length && !errs.length)
    errs.push({ line:0, msg:'nothing here — write one level per line, an energy in eV and an optional degeneracy' });
  if(levels.length && errs.length === 0){
    const lo = Math.min(...levels.map(l => l.E)), hi = Math.max(...levels.map(l => l.E));
    if(hi - lo < 1e-12)
      errs.push({ line:0, msg:'every level has the same energy, so there is nothing for temperature to do — ' +
        'add a level at a different energy' });
  }
  return { ok:errs.length === 0, levels, errs };
}

/* the distinct energies of a sheet, with their total degeneracies */
function smLevelGroups(levels){
  const map = new Map();
  for(const l of levels){
    const k = l.E.toPrecision(12);
    const e = map.get(k);
    if(e) e.g += (l.g || 1); else map.set(k, { E:l.E, g:l.g || 1 });
  }
  return [...map.values()].sort((a, b) => a.E - b.E);
}

/* ----------------------------------------------------------------------------
   THE HEAT-CAPACITY PEAK, LOCATED TWICE

   Route 1 maximises C(T) by golden section on ln T, after a coarse scan wide
   enough to bracket the global peak — a level scheme with two very different
   gaps has two peaks, and the refinement must not walk into the smaller one.
   Route 2 bisects dC/dT = 0 across the same bracket. Different equation,
   different method, and the difference between the two answers is the honest
   error bar on the number the panel prints.
   ---------------------------------------------------------------------------- */
function smPeakC(levels, tLo, tHi, n){
  const N = Math.max(24, n || 260);
  const l0 = Math.log(Math.max(1e-9, tLo)), l1 = Math.log(Math.max(tLo * 1.001, tHi));
  /* maximised in logarithms: C spans thirty orders of magnitude across the
     window, and a golden section on the raw value spends its whole budget in
     the flat tail */
  const at = u => Math.log(Math.max(1e-300, smPartition(levels, Math.exp(u)).C));
  let bi = 0, bv = -Infinity;
  for(let i = 0; i <= N; i++){
    const u = l0 + (l1 - l0) * i / N, c = at(u);
    if(c > bv){ bv = c; bi = i; }
  }
  const lo = l0 + (l1 - l0) * Math.max(0, bi - 1) / N;
  const hi = l0 + (l1 - l0) * Math.min(N, bi + 1) / N;
  const G = smGoldenMax(at, lo, hi, 90);
  /* the same peak as a root of the derivative, by bisection */
  const h = (hi - lo) * 1e-3;
  const dC = u => (at(u + h) - at(u - h)) / (2 * h);
  const r = nqBisect(dC, lo, hi, 1e-13, 200);
  const T1 = Math.exp(G.x), T2 = r === null ? NaN : Math.exp(r);
  return { T:T1, C:smPartition(levels, T1).C, Troot:T2,
           edge:bi === 0 || bi === N,
           rel:Number.isFinite(T2) ? Math.abs(T1 - T2) / T1 : NaN };
}

/* The two-level closed form, which is where the famous 0.4168·ΔE/k comes from.
   Maximising C = k x²·u/(1+u)² with u = e^x/r gives x·tanh((x − ln r)/2) = 2,
   and that transcendental root is found by bisection rather than quoted. r is
   the ratio of the upper degeneracy to the lower, so an unequal pair moves the
   peak — which is why the constant is not universal. */
function smSchottkyX(r){
  const R = Math.max(1e-9, r);
  const f = x => x * Math.tanh((x - Math.log(R)) / 2) - 2;
  const x = nqBisect(f, 1e-9, 400, 1e-14, 400);
  return x === null ? NaN : x;
}

/* ----------------------------------------------------------------------------
   THE REPORT

   Everything the panel prints, computed once. `smPartition` supplies route 1
   for U and C; `smUFromZ` is route 2 for U; dU/dT by a five-point stencil is
   route 2 for C; and the two entropies are genuinely independent — the Gibbs
   sum sees only the populations and never Z, and (U−F)/T sees only Z.
   ---------------------------------------------------------------------------- */
function smLevelReport(levels, T){
  const R = smPartition(levels, T);
  const kT = SM_KBEV * T;
  const Ub = smUFromZ(levels, T);
  const Uof = t => smPartition(levels, t).U;
  const h = Math.max(1e-9, T * 2e-3);
  const CdU = (Uof(T - 2 * h) - 8 * Uof(T - h) + 8 * Uof(T + h) - Uof(T + 2 * h)) / (12 * h);
  let Sg = 0;
  for(const p of R.p) if(p > 1e-300) Sg -= p * Math.log(p);
  Sg *= SM_KBEV;

  const G = smLevelGroups(levels);
  const Emin = G[0].E, Emax = G[G.length - 1].E;
  const span = Math.max(1e-12, Emax - Emin);
  const sumG = levels.reduce((a, l) => a + (l.g || 1), 0);
  const g0 = G[0].g;
  let minGap = Infinity;
  for(let i = 1; i < G.length; i++) minGap = Math.min(minGap, G[i].E - G[i - 1].E);
  if(!Number.isFinite(minGap)) minGap = span;
  /* the two limits, evaluated where they are meant to hold: kT far above the
     whole span, and kT far below the smallest gap in it */
  const Thi = 3000 * span / SM_KBEV, Tlo = minGap / (900 * SM_KBEV);
  const Shi = smPartition(levels, Thi), Slo = smPartition(levels, Tlo);
  const Sinf = SM_KBEV * Math.log(sumG), S0 = SM_KBEV * Math.log(g0);
  /* the peak, located twice, over a window that must contain it: the smallest
     gap sets the low end and the whole span the high end */
  const peak = smPeakC(levels, minGap / (60 * SM_KBEV), 60 * span / SM_KBEV);
  /* and, when the sheet is a genuine two-level scheme, against the closed form */
  let closed = NaN, xStar = NaN, ratio = NaN;
  if(G.length === 2){
    xStar = smSchottkyX(G[1].g / G[0].g);
    closed = (G[1].E - G[0].E) / (SM_KBEV * xStar);
    ratio = SM_KBEV * peak.T / (G[1].E - G[0].E);
  }
  return {
    ok:true, T, kT, Z:R.Z, p:R.p, levels:levels.length, groups:G.length,
    U:R.U, Ubeta:Ub, dU:Math.abs(R.U - Ub),
    C:R.C, CdT:CdU, dC:Math.abs(R.C - CdU),
    S:R.S, Sgibbs:Sg, dS:Math.abs(R.S - Sg), F:R.F,
    Emin, Emax, span, minGap, sumG, g0,
    Thi, Tlo, Sinf, S0, ShiMeas:Shi.S, SloMeas:Slo.S,
    hiRatio:Sinf > 0 ? Shi.S / Sinf : NaN,
    loGap:Math.abs(Slo.S - S0),
    peak, closed, xStar, ratio,
    /* the heat capacity in units of k, which counts the degrees of freedom the
       scheme has actually unfrozen at this temperature */
    Cok:R.C / SM_KBEV
  };
}

/* The invariance the presets get for free: nothing in a level scheme has a
   scale except its gaps, so multiplying every energy by λ must move the peak
   to exactly λT*. Sampling that twice proves nothing; sweeping it over a
   hundredfold and printing the spread is the measurement. */
function smLevelScaleSweep(levels, factors){
  const rows = [];
  for(const lam of (factors || [0.1, 0.3, 1, 3, 10])){
    const L = levels.map(l => ({ E:l.E * lam, g:l.g }));
    const G = smLevelGroups(L);
    const span = Math.max(1e-12, G[G.length - 1].E - G[0].E);
    let mg = Infinity;
    for(let i = 1; i < G.length; i++) mg = Math.min(mg, G[i].E - G[i - 1].E);
    if(!Number.isFinite(mg)) mg = span;
    const P = smPeakC(L, mg / (60 * SM_KBEV), 60 * span / SM_KBEV);
    rows.push({ lam, T:P.T, ratio:P.T / lam });
  }
  const rs = rows.map(r => r.ratio);
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  return { rows, mean,
           spread:mean === 0 ? NaN : (Math.max(...rs) - Math.min(...rs)) / Math.abs(mean) };
}

/* ----------------------------------------------------------------------------
   A MULTIPLICITY THE READER WRITES

   The counting stage's whole content is that S = k lnΩ has a slope which is a
   temperature and a curvature which is a fluctuation. Both are properties of
   the FORM of lnΩ, and the preset only ever shows one form. So the reader
   writes lnΩ(q, N) — q the energy in quanta, N the size of the block — and
   the two claims are then computed from whatever was typed.

   q rides on x and N on y, the same trick `pkParamFn` plays with t. The
   lookarounds keep the q of `sqrt` and the N of nothing in particular safe.
   ---------------------------------------------------------------------------- */
const smCountAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])q(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])N(?![A-Za-z])/g, 'y'));
function smCountFn(src, fallback){
  try { const g = compile(smCountAst(src)); return (q, N) => g(q, N, 0); }
  catch(e){ return fallback || (() => 0); }
}
/* the validator a slot hands to fnWire: it must throw, so the reader sees why */
const smCountBuild = s => { const g = compile(smCountAst(s)); return { f:(q, N) => g(q, N, 0) }; };

/* Temperature and heat capacity from a typed entropy, by the definitions and
   nothing else. Energy is measured in quanta and k is 1, so β = ∂S/∂q is a
   pure number: T = 1/β, and C = dU/dT = −β²/β′. An ideal gas written as
   1.5·N·ln(q) returns C = 1.5N — equipartition, measured off an entropy rather
   than assumed. */
function smEntropyThermo(s, q, N){
  const h = Math.max(1e-9, q * 1e-4);
  const sp = (s(q + h, N) - s(q - h, N)) / (2 * h);
  const spp = (s(q + h, N) - 2 * s(q, N) + s(q - h, N)) / (h * h);
  return { beta:sp, T:1 / sp, dbeta:spp,
           C:spp === 0 ? NaN : -sp * sp / spp,
           S:s(q, N) };
}

/* Extensivity, tested rather than assumed. Entropy is additive because lnΩ is,
   and the 1/√N law needs S(λq, λN) = λ·S(q, N). A reader who writes an
   entropy that fails this gets fluctuations that do not fall as 1/√N, and the
   fitted exponent below reports what they do instead. */
function smExtensivity(s, q, N, lam){
  const L = lam || 4;
  const a = s(L * q, L * N), b = L * s(q, N);
  return { scaled:a, times:b, gap:Math.abs(a - b),
           rel:b === 0 ? NaN : Math.abs(a - b) / Math.abs(b) };
}

/* ----------------------------------------------------------------------------
   THE SPLIT, BY TWO ROUTES, AND ITS WIDTH BY TWO MORE

   Route 1 · maximise S_A(q_A) + S_B(q − q_A). This is the second law and
     knows nothing about temperature.
   Route 2 · bisect ∂S_A/∂q_A − ∂S_B/∂q_B = 0. This is "the temperatures are
     equal" and knows nothing about maximising anything.
   They must land on the same q_A, and the gap between them is what makes
   "equilibrium is where the temperatures match" a result rather than a slogan.

   Then the width, also twice:
   Route A · σ² = −1/S″ at the peak — the Gaussian approximation everybody
     draws, which is a second-order Taylor expansion of the exponent.
   Route B · the distribution exp(S(q_A)) summed outright on a fine grid.
   Their ratio is how good that approximation actually is, and it is not 1.
   ---------------------------------------------------------------------------- */
function smSplitReport(sA, sB, NA, NB, q, grid){
  const S = qa => sA(qa, NA) + sB(q - qa, NB);
  const lo = q * 1e-3, hi = q * (1 - 1e-3);
  if(!(q > 0) || !(NA > 0) || !(NB > 0))
    return { ok:false, why:'the block sizes and the number of quanta must all be positive' };
  const G = smGoldenMax(S, lo, hi, 120);
  if(!Number.isFinite(G.f))
    return { ok:false, why:'your entropy is not a finite number across the range of splits' };
  if(G.x < q * 0.005 || G.x > q * 0.995)
    return { ok:false, why:'the total entropy has no interior maximum — it rises all the way to one ' +
      'end, so the two blocks never stop exchanging energy and there is no equilibrium to find' };
  /* route 2 — equal temperatures */
  const h = Math.max(1e-9, q * 1e-5);
  const bA = qa => (sA(qa + h, NA) - sA(qa - h, NA)) / (2 * h);
  const bB = qb => (sB(qb + h, NB) - sB(qb - h, NB)) / (2 * h);
  const F = qa => bA(qa) - bB(q - qa);
  const root = nqBisect(F, lo, hi, 1e-12 * q, 300);
  /* route A — the curvature at the peak */
  const hc = Math.max(1e-9, q * 1e-3);
  const s2 = (S(G.x + hc) - 2 * S(G.x) + S(G.x - hc)) / (hc * hc);
  const sdCurv = s2 < 0 ? Math.sqrt(-1 / s2) : NaN;
  /* route B — the distribution, summed */
  const n = Math.max(200, grid || 3000);
  let wmax = -Infinity;
  const xs = [], ls = [];
  for(let i = 0; i <= n; i++){
    const qa = q * 1e-4 + (q * (1 - 2e-4)) * i / n;
    const v = S(qa);
    xs.push(qa); ls.push(v);
    if(Number.isFinite(v) && v > wmax) wmax = v;
  }
  let W = 0, m1 = 0, m2 = 0;
  for(let i = 0; i <= n; i++){
    const w = Number.isFinite(ls[i]) ? Math.exp(ls[i] - wmax) : 0;
    W += w; m1 += w * xs[i]; m2 += w * xs[i] * xs[i];
  }
  const mean = W > 0 ? m1 / W : NaN;
  const varr = W > 0 ? Math.max(0, m2 / W - mean * mean) : NaN;
  const sd = Math.sqrt(varr);
  const TA = smEntropyThermo(sA, G.x, NA), TB = smEntropyThermo(sB, q - G.x, NB);
  return { ok:true, q, NA, NB,
           qMax:G.x, qRoot:root === null ? NaN : root,
           gap:root === null ? NaN : Math.abs(G.x - root),
           rel:root === null ? NaN : Math.abs(G.x - root) / q,
           Smax:G.f, mean, sd, sdCurv,
           widthRatio:Number.isFinite(sdCurv) && sd > 0 ? sdCurv / sd : NaN,
           relWidth:mean > 0 ? sd / mean : NaN,
           TA:TA.T, TB:TB.T, CA:TA.C, CB:TB.C,
           tempGap:Math.abs(TA.T - TB.T),
           tempRel:TA.T !== 0 ? Math.abs(TA.T - TB.T) / Math.abs(TA.T) : NaN,
           fair:q * NA / (NA + NB) };
}

/* The 1/√N law, FITTED. Scale both blocks and the quanta together, measure the
   relative width at each size, and fit its logarithm against the logarithm of
   the scale. An extensive entropy gives −0.5 and a residual near zero. One
   that is not gives whatever it gives, which is the point of letting the
   reader write it. */
function smSplitScaleFit(sA, sB, NA, NB, q, factors){
  const rows = [];
  for(const lam of (factors || [1, 2, 4, 8])){
    const R = smSplitReport(sA, sB, NA * lam, NB * lam, q * lam, 2000);
    if(R.ok && R.relWidth > 0) rows.push({ lam, relWidth:R.relWidth, sd:R.sd, mean:R.mean });
  }
  if(rows.length < 2) return { ok:false, rows, why:'not enough sizes solved to fit an exponent' };
  const fit = smFitLine(rows.map(r => Math.log(r.lam)), rows.map(r => Math.log(r.relWidth)));
  return { ok:true, rows, slope:fit.m, resid:fit.resid,
           /* the ratio of widths per doubling, which is √2 for the usual law */
           perDouble:Math.pow(2, -fit.m) };
}
