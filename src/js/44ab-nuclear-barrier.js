/* ============================================================================
   3jb · A BARRIER THE READER WRITES

   `ncGamow` above evaluates the WKB integral for one potential — the bare
   Coulomb tail — and it evaluates it in closed form, because for that one
   potential the integral happens to have one. Everything the stage then says
   about tunnelling is a statement about arccos√x, and the reader has no way to
   ask what would happen if the barrier were shaped differently.

   Give them the potential as an expression and two things must be built that the
   closed form was standing in for:

     · THE TURNING POINTS ARE FOUND, not solved for. b = 2Zαħc/E is an inversion
       of the Coulomb law and nothing else; a general V has to be scanned for the
       region where it stands above E, and the ends of that region located by
       bisection.

     · THE INTEGRAL IS DONE, by quadrature over the actual V. κ = √(2m(V−E))/ħc
       vanishes as a square root at a turning point, which trapezoids handle at
       order 1½ and no better, so each end is straightened by r = b − u² — the
       substitution that turns √(b−r) into u and leaves a smooth integrand — and
       then Gauss–Legendre gets it to machine precision. The routine reports its
       own error by running at two panel counts and differencing.

   Feeding the Coulomb tail back in must reproduce `ncGamow` exactly, and that is
   the test that makes the rest believable: one route is an antiderivative, the
   other is a sum over sample points, and they share no line of code.

   What the reader gets for it is the Geiger–Nuttall law as a MEASUREMENT. Their
   barrier is run over nine real α emitters spanning twenty-four orders of
   magnitude in half-life, log₁₀T½ is fitted against Z/√Q by least squares, and
   the slope of *their* barrier is set beside the slope of the measured data and
   beside the analytic leading-order coefficient 2πα√(2m_α)/ln10. Three numbers
   from three different places, printed together.

   Prefix: nc
   ============================================================================ */

/* ----------------------------------------------------------------------------
   THE ONE PIECE OF STRING HANDLING, AND WHY IT IS NOT OPTIONAL

   A barrier is written V(r, Z) because that is what it is called in every book
   on the subject. Neither name can be handed to the parser as typed:

     · `r` is a MACRO in the maths engine — it expands to √(x²+y²+z²) — so a
       typed `2.88*Z/r` would silently become a three-dimensional radius and the
       reader would be shown a picture of something they did not write;
     · `Z` is not a variable the engine knows at all, and would fail to parse.

   Both are rewritten to the engine's own variables before parsing, matching
   WHOLE identifiers only: a naive replace of `r` turns `sqrt` into `sqxt` and
   `rho` into `xho`, which is a parse error at best and a different function at
   worst. The lookaround pair below is the same one `pkParamAst` uses for t and a
   in the parametric-curve stages.
   ---------------------------------------------------------------------------- */
const ncBarrierSrc = s => String(s == null ? '' : s)
  .replace(/(?<![A-Za-z])r(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])Z(?![A-Za-z])/g, 'y');

/* Everything is in MeV and fm, so κ = √(2m(V−E))/ħc comes out in fm⁻¹ and the
   integral of it is the dimensionless number the exponential wants. */
function ncKappa(Vf, E){
  return r => {
    const v = Vf(r);
    const d = (Number.isFinite(v) ? v : E) - E;
    return d > 0 ? Math.sqrt(2 * NC_MHE4 * d) / NC_HBARC : 0;
  };
}
/* the bare Coulomb tail, as a function of the daughter's charge — the reference
   case, and the one whose WKB integral has a closed form to be checked against */
const ncCoulombVof = Z => (r => 2 * Z * NC_ALPHA * NC_HBARC / r);

/* ----------------------------------------------------------------------------
   THE CLASSICALLY FORBIDDEN REGION

   Walk outwards from the nuclear surface on a geometric grid — the interesting
   structure is at a few fm and the turning point can be at several hundred, so a
   linear grid spends all its resolution in the wrong place. Every interval on
   which V > E is recorded; the first one is the barrier the α meets, and the
   count of the others is reported because a potential with two humps is a
   different physical problem and the reader should be told they have written one.
   ---------------------------------------------------------------------------- */
function ncBarrierRegions(Vf, E, R, rMax, n){
  const N = Math.max(200, Math.round(n || 4000));
  const lo = Math.max(1e-3, R), hi = Math.max(lo * 1.0001, rMax);
  const g = Math.pow(hi / lo, 1 / N);
  const above = r => { const v = Vf(r); return Number.isFinite(v) ? v > E : false; };
  const f = r => { const v = Vf(r); return Number.isFinite(v) ? v - E : -1e9; };
  const out = [];
  let r0 = lo, in0 = above(lo), start = in0 ? lo : null, wall = in0;
  for(let i = 1; i <= N; i++){
    const r1 = lo * Math.pow(g, i), in1 = above(r1);
    if(in1 && !in0) start = nqBisect(f, r0, r1, 1e-12 * r1, 200) || r1;   // rises through E
    if(!in1 && in0){
      const end = nqBisect(f, r0, r1, 1e-12 * r1, 200) || r0;
      out.push({ a:start, b:end, wall:wall && out.length === 0 && start === lo });
      start = null;
    }
    r0 = r1; in0 = in1;
  }
  return { regions:out, openEnded:in0, rMax:hi, wallHigh:wall };
}

/* ----------------------------------------------------------------------------
   THE WKB INTEGRAL OVER AN ARBITRARY BARRIER

   Returns G = ∫κ dr over the first forbidden region, its own quadrature error
   (measured by halving the panel width, never asserted), and log₁₀ of the
   transmission — in the log domain, because a real α barrier gives e^(−2G) with
   G near 40 and an exotic typed one can put it past 400, where the exponential
   underflows to zero and every ratio downstream becomes 0/0.
   ---------------------------------------------------------------------------- */
function ncBarrierG(Vf, E, R, rMax, panels){
  /* How far out to look before giving up. A real α barrier closes by 80 fm, but
     a typed one is only limited by what the reader wrote — 900/r against a 1 MeV
     α closes at 900 fm — and stopping short reports "this never comes back down"
     about a barrier that plainly does. The scan is GEOMETRIC, so widening the
     window costs nothing in resolution: the same 4000 points cover more decades
     at the same points-per-decade. Widening can never move a turning point that
     was already found, only find ones that were outside the old window. */
  const lim = rMax || Math.max(2000, 150 * R);
  const S = ncBarrierRegions(Vf, E, R, lim);
  const base = { R, regions:S.regions.length, extra:Math.max(0, S.regions.length - 1) };
  if(S.openEnded && !S.regions.length)
    return { ...base, ok:false, G:0, log10T:0,
             note:'this barrier never falls back to E — it stands above ' + fmtNum(E, 3) +
                  ' MeV all the way out to ' + fmtNum(lim, 0) + ' fm, so there is no outer turning point and nothing escapes' };
  if(!S.regions.length)
    return { ...base, ok:true, G:0, log10T:0, a:R, b:R,
             note:'nothing here stands above ' + fmtNum(E, 3) + ' MeV — the α is over the barrier already, and no tunnelling is needed' };
  const { a, b } = S.regions[0];
  const kap = ncKappa(Vf, E);
  const mid = 0.5 * (a + b);
  /* is the inner end a genuine turning point, or the wall of the well? A turning
     point has κ → 0 like √(r−a) and needs straightening; the wall does not. */
  const va = Vf(a);
  const turn = !(Number.isFinite(va) && va - E > 1e-9 * Math.max(1, E));
  const quad = p => {
    const IR = nqGauss(u => 2 * u * kap(b - u * u), 0, Math.sqrt(Math.max(0, b - mid)), 5, p);
    const IL = turn
      ? nqGauss(u => 2 * u * kap(a + u * u), 0, Math.sqrt(Math.max(0, mid - a)), 5, p)
      : nqGauss(kap, a, mid, 5, p);
    return IL + IR;
  };
  const P = Math.max(20, Math.round(panels || 200));
  const G1 = quad(P), G = quad(2 * P);
  const err = Math.abs(G - G1);
  return { ...base, ok:true, a, b, G, err,
           /* log₁₀ of e^(−2G), which is what survives when the number itself does not */
           log10T:-2 * G / Math.LN10, T:Math.exp(-2 * G), width:b - a, turn };
}

/* Half-life from a typed barrier, end to end and entirely in the log domain.
   The assault frequency is the one already in the wing — it is computed from the
   well, not quoted — so the only thing that changes when the reader edits the
   potential is the barrier integral, which is the point. */
function ncBarrierHalfLife(Vf, E, R, A, wellDepth, rMax){
  const B = ncBarrierG(Vf, E, R, rMax);
  const F = ncAssaultFreq(E, A, wellDepth);
  const log10 = Math.log10(Math.LN2 / F.f) - B.log10T;      // −log10T = +2G/ln10
  return { B, F, log10Half:B.ok ? log10 : Infinity,
           half:B.ok ? Math.pow(10, log10) : Infinity, ok:B.ok, note:B.note };
}

/* ----------------------------------------------------------------------------
   GEIGER–NUTTALL, FITTED

   The law is log₁₀T½ = c·Z/√Q + d, and c is not a fitted mystery: to leading
   order in R/b the barrier integral is G ≈ πZα√(2m/E), so

       c = 2πα√(2m_α) / ln10

   exactly, with no adjustable anything. `ncGNLead` computes that; `ncGNFit`
   fits the same line to whatever half-lives it is handed. Doing both means the
   reader's barrier is scored three ways at once — against the analytic slope,
   against the slope the measurements actually have, and on the size of its own
   residuals — and a barrier that gets the slope right while missing the
   intercept is a different kind of wrong from one that gets neither.
   ---------------------------------------------------------------------------- */
const ncGNLead = () => 2 * Math.PI * NC_ALPHA * Math.sqrt(2 * NC_MHE4) / Math.LN10;

function ncGNFit(xs, ys){
  const X = [], Y = [];
  for(let i = 0; i < xs.length; i++)
    if(Number.isFinite(xs[i]) && Number.isFinite(ys[i])){ X.push(xs[i]); Y.push(ys[i]); }
  if(X.length < 2) return { ok:false, n:X.length };
  const F = pbRegress(X, Y);
  const resid = X.map((x, i) => Y[i] - F.predict(x));
  const rms = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / resid.length);
  return { ok:true, n:X.length, slope:F.slope, inter:F.inter, r2:F.r2, rms,
           worst:resid.reduce((a, r) => Math.max(a, Math.abs(r)), 0), resid };
}

/* Run a typed barrier over every measured emitter. `Vof(Z)` must return the
   potential outside the nuclear surface for a daughter of charge Z, so that the
   same expression is re-evaluated at nine different charges rather than nine
   copies of one curve. */
function ncBarrierScore(Vof, wellDepth){
  const rows = [], dropped = [];
  for(const e of NC_ALPHA_EMITTERS){
    const R = ncRadius(e.dA) + ncRadius(4);
    const H = ncBarrierHalfLife(Vof(e.dZ), e.Q, R, e.dA, wellDepth);
    const x = e.dZ / Math.sqrt(e.Q);
    const yM = Math.log10(e.half);
    if(!H.ok || !Number.isFinite(H.log10Half)){ dropped.push({ e, why:H.note }); continue; }
    rows.push({ e, x, G:H.B.G, b:H.B.b, pred:H.log10Half, meas:yM, dex:H.log10Half - yM });
  }
  const fitP = ncGNFit(rows.map(r => r.x), rows.map(r => r.pred));
  const fitM = ncGNFit(rows.map(r => r.x), rows.map(r => r.meas));
  /* A barrier can be typed that no emitter gets through at all — a rising wall
     with no outer turning point drops all nine rows — so nothing below may
     assume there is a row to be worst. Returning null rather than a placeholder
     forces the caller to say "none of them" instead of printing a NaN. */
  const mean = rows.length ? rows.reduce((a, r) => a + Math.abs(r.dex), 0) / rows.length : NaN;
  const worst = rows.length
    ? rows.reduce((a, r) => (Math.abs(r.dex) > Math.abs(a.dex) ? r : a), rows[0]) : null;
  return { rows, dropped, fitPred:fitP, fitMeas:fitM, lead:ncGNLead(),
           meanDex:mean, worst,
           slopeRatio:(fitP.ok && fitM.ok && fitM.slope !== 0) ? fitP.slope / fitM.slope : NaN };
}
