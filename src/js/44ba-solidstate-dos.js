/* ============================================================================
   3ka · A DENSITY OF STATES THE READER WRITES

   `slFermiEnergy` returns (ħ²/2m)(3π²n)^(2/3), and that closed form exists for
   exactly one density of states: the free-electron √E. Every statement the Fermi
   stage then makes — where the level sits, that μ barely moves with temperature,
   that the heat capacity is linear in T and suppressed by kT/E_F — is a property
   of √E dressed up as a property of metals. None of it is tested, because there
   is nothing else in the stage for it to be tested against.

   Give the reader g(E) and all four have to be computed:

     · E_F is FOUND, by solving ∫₀^E_F g dE = n. There is no formula to invert.
     · μ(T) is FOUND too, by solving ∫ g f(E,μ,T) dE = n — conservation of
       electrons, which is a different equation from the one above and has a
       different answer. The shift between them is what the Sommerfeld expansion
       predicts as −(π²/12)(kT)²/E_F, and here it is measured instead.
     · U(T) = ∫ E g f dE, and C = dU/dT by differencing it.
     · C again, from the Sommerfeld result (π²/3)k²T g(E_F), which integrates
       nothing and knows only the value of g at one point.

   The last two are the pair that makes the stage worth having. They agree to
   parts in 10⁴ for a smooth DOS at ordinary temperatures — the expansion, tested
   rather than quoted — and they come apart, visibly and by a factor, as soon as
   the reader puts structure within a few kT of E_F, which is precisely the
   situation the expansion assumes away and precisely what a real transition
   metal does.

   UNITS. Everything is in eV, kelvin, and 10²⁸ per cubic metre, so that a reader
   types 0.6812*sqrt(E) rather than 6.812e27*sqrt(E). `SL_DOS_C` below is that
   0.6812 computed from CODATA rather than typed, and feeding it back in has to
   reproduce `slFermiEnergy` — which is the test that anchors the whole file.

   Prefix: sl
   ============================================================================ */

/* the free-electron density of states, states per eV per m³ in units of 10²⁸:
   g(E) = (1/2π²)(2m/ħ²)^(3/2)·√E, with the e^(3/2) that carries E from joules
   into electronvolts. Computed, never quoted. */
const SL_DOS_C = Math.pow(2 * SL_ME / (SL_HBAR * SL_HBAR), 1.5) *
                 Math.pow(SL_E, 1.5) / (2 * Math.PI * Math.PI) / 1e28;
const slDOSFree = E => (E > 0 ? SL_DOS_C * Math.sqrt(E) : 0);

/* `E` is what a density of states is written in. It is not a variable the maths
   engine knows, so it is rewritten before parsing — whole identifiers only, and
   never a digit's exponent, so that `exp`, `sqrt` and `1e-3` all survive. */
const slDOSSrc = s => String(s == null ? '' : s)
  .replace(/(?<![A-Za-z0-9.])E(?![A-Za-z0-9])/g, 'x');

/* ----------------------------------------------------------------------------
   THE TABLE

   Every integral below is over the same g on the same interval, and the ones
   that matter are solved for repeatedly inside a root-find. Sampling g once on a
   fixed grid and carrying two cumulative integrals with it turns the outer loops
   into arithmetic: the number below a given energy, and the energy below it, are
   then a table lookup plus a single Gauss panel over the last partial cell.

   Simpson on each cell rather than trapezoid, because the cell midpoints cost
   one extra evaluation each and buy two orders of accuracy — and because √E has
   unbounded curvature at the bottom of the band, where a trapezoid is at its
   worst.

   A density of states may not be negative. That is not a numerical nicety: a
   negative g makes the filling condition non-monotone, so E_F stops being unique
   and a bisection would return whichever root it happened to bracket. Negative
   samples are clamped to zero AND counted, so the caller can say so.
   ---------------------------------------------------------------------------- */
/* The bottom of a band is where a density of states is least polite. The
   free-electron √E has an unbounded derivative there, and Simpson over the first
   cell is wrong by 0.0286·h^(3/2) — on a 3000-cell table that is 4.7e-6, which
   was the entire error budget of everything downstream: E_F came out 1e-5 off
   and the Sommerfeld heat capacity then missed `slElectronicC` by 2e-7.

   More cells does not fix it: the error goes as h^(3/2), so ten times the work
   buys thirty times the accuracy. Grading the cell geometrically into the edge
   does not really fix it either — it was tried, and it only moved the constant
   from 0.0286 to 1.8e-4, because the OUTERMOST graded cells still straddle the
   singularity and they dominate the sum.

   What fixes it is the substitution E = edge ± u², whose Jacobian 2u cancels the
   √ exactly and leaves a smooth integrand for Gauss–Legendre — the same trick,
   for the same reason, as the turning points in `ncBarrierG`. It costs nothing
   when g is smooth at the edge, so it is used unconditionally.

   It is applied to a REGION, not to one cell. Applying it to the first cell
   alone left 2e-7, because the next twenty cells still straddle a function with
   unbounded curvature and Simpson on THEM was then the largest term. `SL_DOS_EDGE`
   cells at each end are integrated from the edge by substitution instead, which
   is what finally brings a √E band to 1e-11.

   Oriented: the value is ∫ from `edge` to `far`, so it changes sign with them. */
const SL_DOS_EDGE = 24;                    // cells at each end done by substitution
function slDOSEdgeInt(f, edge, far, panels){
  const d = far - edge;
  if(d === 0) return 0;
  const sgn = d > 0 ? 1 : -1;
  return sgn * nqGauss(u => 2 * u * f(edge + sgn * u * u), 0, Math.sqrt(Math.abs(d)), 5, panels || 24);
}
function slDOSTable(gRaw, Elo, Ehi, M){
  M = Math.max(200, Math.round(M || 3000));
  const h = (Ehi - Elo) / M;
  let bad = 0, neg = 0;
  const g = x => {
    const v = gRaw(x);
    if(!Number.isFinite(v)){ bad++; return 0; }
    if(v < 0){ neg++; return 0; }
    return v;
  };
  const E = new Float64Array(M + 1), G = new Float64Array(M + 1);
  const cumN = new Float64Array(M + 1), cumU = new Float64Array(M + 1);
  for(let i = 0; i <= M; i++){ E[i] = Elo + i * h; G[i] = g(E[i]); }
  let peak = 0;
  for(let i = 0; i <= M; i++) if(G[i] > peak) peak = G[i];
  const gU = u => u * g(u);
  const K = Math.min(SL_DOS_EDGE, Math.floor(M / 4));
  /* the bottom edge region, each boundary integrated from Elo by substitution */
  for(let i = 1; i <= K; i++){
    cumN[i] = slDOSEdgeInt(g,  Elo, E[i], 40);
    cumU[i] = slDOSEdgeInt(gU, Elo, E[i], 40);
  }
  /* the smooth interior, by composite Simpson on each cell */
  for(let i = K; i < M - K; i++){
    const a = E[i], b = E[i + 1], m = 0.5 * (a + b), gm = g(m);
    cumN[i + 1] = cumN[i] + h / 6 * (G[i] + 4 * gm + G[i + 1]);
    cumU[i + 1] = cumU[i] + h / 6 * (a * G[i] + 4 * m * gm + b * G[i + 1]);
  }
  /* and the top edge region, integrated INWARDS from Ehi for the same reason —
     a one-dimensional band's van Hove singularity lives at exactly that end */
  const tailN = new Float64Array(K + 1), tailU = new Float64Array(K + 1);
  for(let j = 0; j <= K; j++){
    tailN[j] = -slDOSEdgeInt(g,  Ehi, E[M - j], 40);      // ∫ from E[M−j] to Ehi
    tailU[j] = -slDOSEdgeInt(gU, Ehi, E[M - j], 40);
  }
  const total = cumN[M - K] + tailN[K], totalU = cumU[M - K] + tailU[K];
  for(let j = 0; j < K; j++){
    cumN[M - j] = total  - tailN[j];
    cumU[M - j] = totalU - tailU[j];
  }
  return { Elo, Ehi, M, h, K, E, G, cumN, cumU, g, gU, peak,
           total, totalU, bad, neg };
}
/* the number of states below X (or the energy they carry, with wantU) */
function slDOSCum(TB, X, wantU){
  if(!(X > TB.Elo)) return 0;
  if(X >= TB.Ehi) return wantU ? TB.totalU : TB.total;
  const i = Math.min(TB.M - 1, Math.max(0, Math.floor((X - TB.Elo) / TB.h)));
  const f = wantU ? TB.gU : TB.g;
  /* Inside either edge region the partial integral is taken from the edge by the
     same substitution — a single Gauss panel over a cell that straddles a band
     edge would put the whole edge error back into the last term, which is where
     a Fermi level low in the band would then land. */
  if(i < TB.K) return slDOSEdgeInt(f, TB.Elo, X, 40);
  if(i >= TB.M - TB.K)
    return (wantU ? TB.totalU : TB.total) + slDOSEdgeInt(f, TB.Ehi, X, 40);
  return (wantU ? TB.cumU[i] : TB.cumN[i]) + nqGauss(f, TB.E[i], X, 5, 1);
}

/* ----------------------------------------------------------------------------
   E_F AT ABSOLUTE ZERO — FOUND, NOT INVERTED

   ∫₀^E_F g dE = n, bisected. The cumulative is non-decreasing because g is
   clamped non-negative, so the root is unique and bisection cannot be fooled.
   Two ways for it not to exist, and both are reported rather than clamped: a
   band with fewer states than there are electrons, and a g that is zero
   everywhere.
   ---------------------------------------------------------------------------- */
function slDOSFermi(TB, n){
  if(!(TB.total > 0))
    return { ok:false, why:'this g(E) integrates to zero over the band — there are no states to fill' };
  if(n >= TB.total)
    return { ok:false, total:TB.total,
             why:'the band holds ' + fmtNum(TB.total, 4) + ' × 10²⁸ states per m³ and you have asked it to hold ' +
                  fmtNum(n, 4) + ' — every state is full, and there is no Fermi level inside the band' };
  const F = X => slDOSCum(TB, X, false) - n;
  const EF = nqBisect(F, TB.Elo, TB.Ehi, 1e-13 * (TB.Ehi - TB.Elo), 300);
  if(EF === null) return { ok:false, why:'no filling level could be bracketed in this band' };
  return { ok:true, EF, gEF:TB.g(EF), resid:F(EF),
           /* how sharply the level is defined: a DOS that is nearly zero at E_F
              means a small change in n moves it a long way, which is the
              difference between a metal and a semimetal */
           dEFdn:TB.g(EF) > 0 ? 1 / TB.g(EF) : Infinity };
}

/* ----------------------------------------------------------------------------
   μ(T) — FOUND TOO, BY CONSERVING ELECTRONS

   ∫ g f dE = n, by Newton. The derivative is ∫ g f(1−f)/kT dE, which is the
   thermal window itself and costs nothing extra to evaluate.

   The integral is split at μ ± 46kT. Below that window f differs from 1 by
   e^(−46), about 10⁻²⁰, so the contribution is the cumulative already tabulated;
   above it f is that small outright. Integrating the whole band at every Newton
   step would spend all its samples where the integrand is a constant, and would
   still not resolve the edge at low temperature — the split does both jobs at
   once, and is why 10 K is as cheap as 3000 K here.
   ---------------------------------------------------------------------------- */
function slDOSMu(TB, n, T, EF){
  if(!(T > 0)) return { mu:EF, ok:true, iters:0, resid:0 };
  const kT = SL_KBEV * T;
  const W = Math.min(TB.Ehi - TB.Elo + 4 * kT, 46 * kT);
  const win = mu => ({ a:Math.max(TB.Elo, mu - W), b:Math.min(TB.Ehi, mu + W) });
  const num = mu => {
    const { a, b } = win(mu);
    if(!(b > a)) return mu > TB.Ehi ? TB.total : 0;
    return slDOSCum(TB, a, false) + nqGauss(u => TB.g(u) * slFD(u, mu, T), a, b, 5, 90);
  };
  const der = mu => {
    const { a, b } = win(mu);
    if(!(b > a)) return 0;
    return nqGauss(u => { const f = slFD(u, mu, T); return TB.g(u) * f * (1 - f) / kT; }, a, b, 5, 90);
  };
  let mu = EF, it = 0;
  for(; it < 60; it++){
    const r = num(mu) - n, d = der(mu);
    if(!(Math.abs(d) > 1e-300)) break;
    /* the step is clamped: where g is flat and thin the Newton step is enormous
       and would throw μ out of the band on the first iteration */
    const raw = r / d;
    const step = Math.max(-0.5 - 3 * kT, Math.min(0.5 + 3 * kT, raw));
    mu -= step;
    if(Math.abs(step) < 1e-13 * Math.max(1, Math.abs(mu))) { it++; break; }
  }
  const resid = num(mu) - n;
  return { mu, iters:it, resid, ok:Math.abs(resid) < 1e-9 * Math.max(1e-12, n),
           shift:mu - EF };
}
/* U(T) = ∫ E g f dE, split the same way */
function slDOSEnergy(TB, mu, T){
  if(!(T > 0)) return slDOSCum(TB, mu, true);
  const kT = SL_KBEV * T;
  const W = Math.min(TB.Ehi - TB.Elo + 4 * kT, 46 * kT);
  const a = Math.max(TB.Elo, mu - W), b = Math.min(TB.Ehi, mu + W);
  if(!(b > a)) return mu > TB.Ehi ? TB.totalU : 0;
  return slDOSCum(TB, a, true) + nqGauss(u => u * TB.g(u) * slFD(u, mu, T), a, b, 5, 90);
}

/* ----------------------------------------------------------------------------
   THE HEAT CAPACITY, TWICE

   ROUTE 1 — C = dU/dT, differenced. It re-solves μ at each of the two shifted
     temperatures, so it carries the fact that the chemical potential moves; it
     knows no expansion and makes no assumption about the shape of g. Second
     order in the step, and the step is halved once so the order can be MEASURED
     rather than claimed.

   ROUTE 2 — C = (π²/3)k²T g(E_F), the Sommerfeld result. It integrates nothing
     and looks at g in exactly one place.

   The two agree only if g is smooth on the scale of kT around E_F, which is the
   assumption behind every "electronic heat capacity is linear in T" in every
   textbook. Their ratio is what the stage prints, and putting a peak within a
   few kT of E_F drives it away from one immediately.
   ---------------------------------------------------------------------------- */
function slDOSHeat(TB, n, T, EF, hRel){
  const rel = hRel || 0.02;
  const Uat = t => {
    const m = slDOSMu(TB, n, t, EF);
    return slDOSEnergy(TB, m.mu, t);
  };
  const dU = h => (Uat(T + h) - Uat(T - h)) / (2 * h);
  const h1 = Math.max(1e-9, rel * T), h2 = h1 / 2;
  const C1 = dU(h1), C = dU(h2);
  const gEF = TB.g(EF);
  const Csom = Math.PI * Math.PI / 3 * SL_KBEV * SL_KBEV * T * gEF;
  return { C, Csom, gEF, coarse:C1, h:h2,
           /* Richardson: a second-order difference should have quartered its
              error when the step was halved, and the two estimates differ by
              a third of the remaining error */
           diffErr:Math.abs(C - C1) / 3,
           gap:Math.abs(C - Csom),
           rel:Csom !== 0 ? Math.abs(C - Csom) / Math.abs(Csom) : Infinity,
           ratio:Csom !== 0 ? C / Csom : NaN };
}
/* J per kelvin per mole of electrons, which is what a measurement reports:
   C_V is per m³ in units of 10²⁸ eV, and a mole of electrons occupies N_A/n of
   those cubic metres. */
const slDOSMolar = (C, n) => C * SL_E * SL_NA / n;

/* ----------------------------------------------------------------------------
   THE ANCHOR

   Feed the free-electron DOS back in and every route above must reproduce the
   engine that was here first: E_F must be `slFermiEnergy`, and the molar heat
   capacity must be `slElectronicC`. Neither of those was used to build any of
   this, and the agreement is what makes the arbitrary-g answers believable.

   The Sommerfeld shift of μ is returned alongside for the same reason — it is a
   published expansion, μ = E_F[1 − (π²/12)(kT/E_F)²], and the μ solved for above
   has to land on it at low temperature and leave it at high.
   ---------------------------------------------------------------------------- */
/* `n` is in 10²⁸ m⁻³ like everything else here; `slFermiEnergy` and
   `slElectronicC` are SI and want it per cubic metre. Getting that conversion
   wrong is silent — it produces a band four electronvolts wide that cannot hold
   the electrons it was given — so it is done in exactly this one place. */
function slDOSFreeCheck(n, T, Etop){
  const nSI = n * 1e28;
  const top = Etop || Math.max(4, 2.2 * slFermiEnergy(nSI));
  const TB = slDOSTable(slDOSFree, 0, top, 4000);
  const F = slDOSFermi(TB, n);
  if(!F.ok) return { ok:false, why:F.why };
  const closed = slFermiEnergy(nSI);
  const M = slDOSMu(TB, n, T, F.EF);
  const somShift = -Math.PI * Math.PI / 12 * Math.pow(SL_KBEV * T, 2) / F.EF;
  const HC = slDOSHeat(TB, n, T, F.EF);
  return { ok:true, TB, EF:F.EF, closed, dEF:Math.abs(F.EF - closed) / closed,
           mu:M.mu, shift:M.shift, somShift, dShift:Math.abs(M.shift - somShift),
           molar:slDOSMolar(HC.C, n), molarSom:slDOSMolar(HC.Csom, n),
           closedMolar:slElectronicC(T, nSI), heat:HC };
}
