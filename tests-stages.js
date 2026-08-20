/* ============================================================================
   STAGE-LEVEL TWO-ROUTE TESTS — Programme D item 3.

   runtests.ps1 extracts only modules 21–49, so nothing in the 178 stages'
   own arithmetic was unit-tested: igTriple.volume() returned 471% of a
   tetrahedron and NaN for a box, on a switch any reader could flip, and three
   gates were blind to it by construction. This suite runs INSIDE the booted
   app (runstagetests.ps1 wraps the real bundle), so it can call stage helpers
   directly with synthetic states — no DOM driving, no rendered-text regex.

   The rule for what belongs here, from MASTER-PLAN §3.4: target the helpers
   with TWO ROUTES TO THE SAME ANSWER, where a test can assert agreement
   without knowing which route is right. Every tolerance below is set from the
   route's own measured error (recorded beside it), never from a guess.

   Each defect class found in a stage gains a test here the day it is fixed —
   this file is the ratchet's memory, the way tests.js is for the engines.
   ============================================================================ */

var STG_PASS = 0, STG_FAIL = 0, STG_LOG = [];
function sok(name, cond, detail){
  if(cond){ STG_PASS++; }
  else { STG_FAIL++; STG_LOG.push('FAIL  ' + name + '  [' + String(detail) + ']'); }
}

/* ---- igTriple.volume: every preset through every route it offers ----------
   The 2026-08-15 class: the cylindrical sweep was NaN on the box (undefined
   shadow), 471% on the tetrahedron (a clip that tested one coordinate), then
   0.240% light on the box (Gauss points straddling the shadow's rim).
   Measured route errors on 2026-08-15, which set the tolerances:
     z-simple via cylindrical: worst 1.5e-9 (box)   -> tol 1e-6
     z-simple via Cartesian:   worst 1.4e-4 (cyl — a √ shadow boundary is not
                               polynomial and Gauss is honest about it) -> 5e-4
     native cyl/sph presets:   exact to quadrature  -> tol 1e-5           */
(function(){
  for(var key in IG_SOLIDS){
    var S = IG_SOLIDS[key];
    if(!Number.isFinite(S.exactVol)) continue;
    var routes = (S.cyl || S.sph) ? [[S.cyl ? 'cyl' : 'sph', 1e-5]]
                                  : [['cart', 5e-4], ['cyl', 1e-6]];
    for(var r = 0; r < routes.length; r++){
      var st = { solid:key, solKind:'z', sys:routes[r][0] };
      var V = STAGES.igTriple.volume(st);
      var rel = Math.abs(V - S.exactVol) / Math.abs(S.exactVol);
      sok('igTriple ' + key + ' via ' + routes[r][0] + ' lands on its exact volume',
          Number.isFinite(V) && rel < routes[r][1], key + ' V=' + V + ' exact=' + S.exactVol);
    }
  }
  /* the typed default (z ≤ 4−x²−y² over the disc of radius 2): three routes —
     iterated Cartesian, iterated cylindrical, and 120 000 darts with its own
     σ = 0.090. The closed form 8π is known here only to the TEST. */
  var stC = { solid:'custom', solKind:'z', sys:'cart' };
  var Sc = igSolidCur(stC);
  var exact = 8 * Math.PI;
  var Vcart = STAGES.igTriple.volume(stC);
  var Vcyl  = STAGES.igTriple.volume({ solid:'custom', solKind:'z', sys:'cyl',
                                       own_igsol:stC.own_igsol });
  sok('typed paraboloid, Cartesian route vs 8π', Math.abs(Vcart - exact) / exact < 5e-4, Vcart);
  sok('typed paraboloid, cylindrical route vs 8π', Math.abs(Vcyl - exact) / exact < 1e-4, Vcyl);
  sok('typed paraboloid, Monte Carlo within 4σ of the closed form',
      Math.abs(Sc.exactVol - exact) < 4 * Sc.mcSe, Sc.exactVol + ' ± ' + Sc.mcSe);
  sok('...and the σ it quotes is the binomial one (≈0.09 for this box)',
      Sc.mcSe > 0.05 && Sc.mcSe < 0.15, Sc.mcSe);
})();

/* ---- the in-run corrupt control -------------------------------------------
   A gate never seen to fail is not known to work, and a two-route suite has a
   specific way of dying silently: both "routes" drifting into one code path.
   This control recomputes the box's cylindrical volume with the OLD
   discontinuous clip (the exact code shape fixed on 2026-08-15) and requires
   the suite's own comparison machinery to SEE the disagreement it caused. */
(function(){
  var S = IG_SOLIDS.box;
  var Rg = S.region ? IG_REGIONS[S.region] : S;
  var rmax = 0;
  for(var i = 0; i <= 32; i++){
    var x = Rg.x0 + (Rg.x1 - Rg.x0) * i / 32;
    rmax = Math.max(rmax, Math.hypot(x, Rg.yLo(x)), Math.hypot(x, Rg.yHi(x)));
  }
  var Vold = nqTripleCyl(function(){ return 1; }, 0, 2 * Math.PI,
    function(){ return 0; }, function(){ return rmax; },
    function(r, th){ return S.zLo(r * Math.cos(th), r * Math.sin(th)); },
    function(r, th){
      var x = r * Math.cos(th), y = r * Math.sin(th);
      var out = x < Rg.x0 - 1e-9 || x > Rg.x1 + 1e-9 ||
                y < Rg.yLo(x) - 1e-9 || y > Rg.yHi(x) + 1e-9;
      return out ? S.zLo(x, y) : Math.max(S.zLo(x, y), S.zHi(x, y));
    }, 5, 8);
  sok('control: the pre-fix clip really is wrong at a size this suite must catch',
      Math.abs(Vold - S.exactVol) / S.exactVol > 1e-3, 'old-clip V=' + Vold);
})();

/* ---- odNonhom.yp: the guess must actually solve the equation --------------
   The 2026-08-15 fallthrough class: a custom forcing was answered with the
   particular solution of 2cos(ωt), a different equation, residual 2.37.
   Substituting yp back in is a second route that assumes nothing about how
   the guess was built. Central differences at h = 1e-4 put a round-off floor
   near 1e-8·scale, so the tolerance is 1e-5 relative to the largest term.  */
(function(){
  var forcings = ['const_', 'poly', 'expo', 'cosine'];
  for(var i = 0; i < forcings.length; i++){
    var st = { a:1, b:0.5, c:3, forcing:forcings[i], w:1.4 };
    var yp = STAGES.odNonhom.yp(st), g = STAGES.odNonhom.g(st);
    if(!yp){ sok('odNonhom yp exists for ' + forcings[i], false, 'null'); continue; }
    var worst = 0, scale = 0, h = 1e-4;
    for(var k = 1; k <= 40; k++){
      var t = k * 0.4;
      var y = yp(t), y1 = (yp(t + h) - yp(t - h)) / (2 * h);
      var y2 = (yp(t + h) - 2 * y + yp(t - h)) / (h * h);
      worst = Math.max(worst, Math.abs(st.a * y2 + st.b * y1 + st.c * y - g(t)));
      scale = Math.max(scale, Math.abs(st.a * y2), Math.abs(st.b * y1),
                       Math.abs(st.c * y), Math.abs(g(t)));
    }
    sok('odNonhom yp(' + forcings[i] + ') solves its own equation',
        worst < 1e-5 * scale, 'residual ' + worst + ' vs scale ' + scale);
  }
  sok('odNonhom: a custom forcing gets NO guess, never a wrong one',
      STAGES.odNonhom.yp({ a:1, b:0.5, c:3, forcing:'custom', w:1.4 }) === null, 'not null');
  sok('odNonhom: homogeneous gets none either',
      STAGES.odNonhom.yp({ a:1, b:0.5, c:3, forcing:'none', w:1.4 }) === null, 'not null');
})();

/* ---- laLSQ.fit: the orthogonality theorem, and minimality itself ----------
   The residual must be perpendicular to every column of the design matrix —
   that IS least squares — and the fit must not be improvable: nudging any
   coefficient must raise the sum of squares. The second route knows nothing
   about normal equations. (This stage printed two of these rows as perfect
   agreement off a NaN scale until 2026-08-15.)                              */
(function(){
  var st = { pts:[[0, 1.0], [0.7, 2.1], [1.5, 2.6], [2.2, 4.3], [3.1, 5.0], [4.0, 7.2]], deg:2 };
  var L = STAGES.laLSQ.fit(st);
  if(!L){ sok('laLSQ fit returns', false, 'null'); }
  else {
    for(var k = 0; k <= st.deg; k++){
      var scale = Math.sqrt(Math.max(1e-300, L.rss));
      for(var i = 0; i < st.pts.length; i++) scale = Math.max(scale, Math.pow(Math.abs(st.pts[i][0]), k));
      sok('laLSQ residual ⊥ column ' + (k + 1),
          Math.abs(L.orth[k]) < 1e-8 * Math.max(1, scale * scale), L.orth[k]);
    }
    var rssAt = function(coef){
      var s = 0;
      for(var i = 0; i < st.pts.length; i++){
        var y = 0;
        for(var kk = 0; kk <= st.deg; kk++) y += coef[kk] * Math.pow(st.pts[i][0], kk);
        s += (st.pts[i][1] - y) * (st.pts[i][1] - y);
      }
      return s;
    };
    var base = rssAt(L.x), improvable = false;
    for(var kq = 0; kq <= st.deg; kq++) for(var sgn = -1; sgn <= 1; sgn += 2){
      var c2 = L.x.slice(); c2[kq] += sgn * 1e-3;
      if(rssAt(c2) < base - 1e-12) improvable = true;
    }
    sok('laLSQ fit is a genuine minimum — no coefficient nudge improves it',
        !improvable, 'rss ' + base);
    sok('...and the rss it reports is the rss its own coefficients produce',
        Math.abs(base - L.rss) < 1e-9 * Math.max(1, L.rss), base + ' vs ' + L.rss);
  }
})();

/* ---- rlOrbit: every metric a reader can pick must orbit, and both routes
   must agree about how much it turns -----------------------------------------
   The 2026-08-15 class was a preset that plunged while the readout printed the
   NaN as perfect agreement. Rebuilt 2026-08-18 for Programme A item 2: the
   stage is now a scenario editor over RL_METRICS, so the test drives
   recompute() on every row — which is the only way the de Sitter row is
   exercised at all, its orbit living nowhere near the others'.

   Measured route errors on 2026-08-18, which set the tolerances:
     route A (rlGeoRun + rlPeriShift) vs route B (rlApsidalQuad):
       worst 2.5e-10 relative over the five presets  -> tol 3e-9
     the Newtonian control (rlKeplerApsidal) against π:
       worst 4.3e-12 absolute, and it is round-off   -> tol 1e-10           */
(function(){
  var S = STAGES.rlOrbit;
  var keys = Object.keys(RL_METRICS);
  for(var i = 0; i < keys.length; i++){
    var k = keys[i], row = RL_METRICS[k], orb = row.orb;
    var st = { key:k, srcA:row.A, srcB:row.B,
               rp: orb ? orb[0] : 20, ecc: orb ? orb[1] : 0.35, orbits:5, err:'' };
    S.recompute(st);
    var O = st.O;
    sok('rlOrbit ' + k + ': the metric compiles and the stage computes', !!O, st.err);
    if(!O) continue;
    if(!orb){
      /* the declared claim for Minkowski is that it has NO bound orbit, and a
         laboratory that cannot report "nothing happens" is not to be trusted
         when it reports that something did */
      sok('rlOrbit ' + k + ' declares no orbit, and none is found',
          !O.geo && !Number.isFinite(O.precA), O.precA);
      sok('...and it says why rather than printing a number', !!O.why, O.why);
      continue;
    }
    sok('rlOrbit ' + k + ' has the bound orbit its table declares at r₁ = ' + orb[0],
        !!O.geo && Number.isFinite(O.el.E) && Number.isFinite(O.el.L),
        O.why || (O.el && O.el.why));
    if(!O.geo) continue;
    sok('rlOrbit ' + k + ': the track reaches at least two pericentres',
        O.per.orbits >= 2, O.per.orbits);
    sok('rlOrbit ' + k + ': route A and route B agree on the advance per orbit',
        Math.abs(O.precA - O.precB) < 3e-9 * Math.abs(O.apsidalB),
        O.precA + ' vs ' + O.precB);
    sok('rlOrbit ' + k + ': the geodesic conserved E without being told to',
        O.geo.driftE < 1e-8, O.geo.driftE);
    sok('rlOrbit ' + k + ': and the track did not stop early',
        O.geo.stop === '', O.geo.stop);
    /* the semi-latus rectum the panel prints must be the one the formula uses,
       reached the other way round: p = a(1−e²) from the apsides */
    var a = 0.5 * (O.r1 + O.r2), e = (O.r2 - O.r1) / (O.r2 + O.r1);
    sok('rlOrbit ' + k + ': p = r₁(1+e) is a(1−e²), computed both ways',
        Math.abs(O.p - a * (1 - e * e)) < 1e-9 * O.p, O.p + ' vs ' + a * (1 - e * e));
    sok('rlOrbit ' + k + ': the Newtonian control still returns π',
        Math.abs(O.kepler - Math.PI) < 1e-10, O.kepler - Math.PI);
  }

  /* the weak-field acceptance test for item 2, driven through the stage rather
     than the engine: at p = 700 the measured advance is inside 1% of
     6πGM/c²a(1−e²), and the Newtonian control is zero to 1e-10 */
  (function(){
    var st = { key:'schwarzschild', srcA:'1 - 2/r', srcB:'1/(1 - 2/r)',
               rp:400, ecc:0.75, orbits:5, err:'' };
    S.recompute(st);
    var O = st.O;
    sok('rlOrbit weak field: there is an orbit at p = 700', !!O.geo, O.why);
    sok('rlOrbit weak field: the measured advance is inside 1% of 6π/p',
        Math.abs(O.precB / O.weak - 1) < 0.01, O.precB / O.weak);
    sok('rlOrbit weak field: and route A agrees with route B there too',
        Math.abs(O.precA - O.precB) < 3e-9 * Math.abs(O.apsidalB), O.precA - O.precB);
    sok('rlOrbit weak field: the Newtonian control gives zero precession',
        Math.abs(O.kepler - Math.PI) < 1e-10, O.kepler - Math.PI);
  })();

  /* the four ways a pair of apsides can fail to be an orbit. Each must be
     REFUSED and each must be named separately — "no bound orbit" alone leaves
     a reader unable to tell a control behaving correctly from a broken one. */
  (function(){
    var cases = [
      ['flat',    20,  0.35, 'no angular momentum'],
      ['desitter', 20, 0.35, 'A decreases outward'],
      ['desitter', 10, 0.15, 'escape'],
      ['schwarzschild', 5.5, 0.1, 'plunge']
    ];
    for(var i = 0; i < cases.length; i++){
      var row = RL_METRICS[cases[i][0]];
      var st = { key:cases[i][0], srcA:row.A, srcB:row.B,
                 rp:cases[i][1], ecc:cases[i][2], orbits:5, err:'' };
      S.recompute(st);
      sok('rlOrbit refuses ' + cases[i][0] + ' at r₁ = ' + cases[i][1] + ' (' + cases[i][3] + ')',
          !st.O.geo && !Number.isFinite(st.O.precA), st.O.precA);
      sok('...and explains it in its own words', !!st.O.why && st.O.why.length > 30, st.O.why);
    }
  })();

  /* the reader's own metric — the path runall never takes */
  (function(){
    var st = { key:'custom', srcA:'1 - 2/r + 0.3/r^2', srcB:'1/(1 - 2/r + 0.3/r^2)',
               rp:20, ecc:0.35, orbits:5, err:'' };
    S.recompute(st);
    sok('rlOrbit accepts a typed metric and orbits in it', !!st.O.geo, st.O.why);
    if(st.O.geo){
      sok('rlOrbit typed metric: both routes still agree',
          Math.abs(st.O.precA - st.O.precB) < 3e-9 * Math.abs(st.O.apsidalB),
          st.O.precA + ' vs ' + st.O.precB);
      /* a charge term of either sign moves the precession off Schwarzschild's,
         which is the whole reason the box is there */
      var ref = { key:'schwarzschild', srcA:'1 - 2/r', srcB:'1/(1 - 2/r)',
                  rp:20, ecc:0.35, orbits:5, err:'' };
      S.recompute(ref);
      sok('and a typed metric gives a DIFFERENT precession from Schwarzschild',
          Math.abs(st.O.precB - ref.O.precB) > 1e-3 * Math.abs(ref.O.precB),
          st.O.precB + ' vs ' + ref.O.precB);
    }
    var bad = { key:'custom', srcA:'1 - 2/(r', srcB:'1', rp:20, ecc:0.35, orbits:5, err:'' };
    S.recompute(bad);
    sok('rlOrbit survives an unbalanced bracket and says so',
        !bad.O && bad.err.length > 10, bad.err);
  })();

  /* Mercury's card is computed by a different engine on purpose — the general
     route has no precision at p = 4e7 — so it gets its own check against the
     number Le Verrier could not explain. */
  (function(){
    var st = { key:'schwarzschild', srcA:'1 - 2/r', srcB:'1/(1 - 2/r)',
               rp:20, ecc:0.35, orbits:5, err:'' };
    S.recompute(st);
    var M = st.O.merc;
    sok('rlOrbit Mercury: the u-equation lands on 6πGM/(c²a(1−e²))',
        Math.abs(M.measured - M.formula) / M.formula < 1e-4, M.measured + ' vs ' + M.formula);
    sok('rlOrbit Mercury: and that is 43 arcseconds per century',
        Math.abs(M.measured * ARCSEC * 36525 / M.P - 43) < 0.5,
        M.measured * ARCSEC * 36525 / M.P);
    sok('rlOrbit Mercury: whose semi-latus rectum is far outside the general route',
        M.pGeo > 1e7, M.pGeo);
  })();
})();

/* ---- dfHarmonic: the three cases of the mean-value card -------------------
   Harmonic on the disc: mean = centre. Singularity enclosed: mean = log R,
   wherever the centre sits. Not harmonic: mean − centre priced by Green's
   representation. Each pair computed by routes sharing nothing.            */
(function(){
  var F = DF_HARMONIC.excos.f;
  sok('dfHarmonic eˣcos y: circle mean equals centre value',
      Math.abs(dfCircleMean(F, 0.4, 0.3, 0.8, 1440) - F(0.4, 0.3)) < 1e-9, 'gap');
  var G = DF_HARMONIC.logr.f;
  sok('dfHarmonic log r with the origin enclosed: mean = log R exactly',
      Math.abs(dfCircleMean(G, 0.4, 0.3, 0.8, 1440) - Math.log(0.8)) < 1e-6,
      dfCircleMean(G, 0.4, 0.3, 0.8, 1440) + ' vs ' + Math.log(0.8));
  sok('...and moving the centre does not move the average (2-D Gauss law)',
      Math.abs(dfCircleMean(G, -0.1, 0.2, 0.8, 1440) - Math.log(0.8)) < 1e-6, 'moved centre');
  var stq = { key:'custom' };
  var D = dfHarmCur(stq);
  sok('dfHarmonic typed default x³−3xy² measures as harmonic', D.harmonic === true, D.lap);
})();

/* ---- agCur: the custom inverse takes the branch the whitelist promises ----
   The auditsides entry for agInverse asserts bisection lands on the leftmost
   root of x³−2x = −0.672, at −1.559. Pin the number so the excuse stays true. */
(function(){
  var st = { key:'custom' };
  var A = agCur(st);
  sok('agCur custom default is measured non-monotone', A.mono === false, A.mono);
  var back = A.inv(A.f(1.2));
  sok('agCur bisection returns the leftmost branch of x³−2x = −0.672',
      Math.abs(back - (-1.55918)) < 1e-3, back);
})();

/* ---- emFaraday typed field: Faraday as the Leibniz rule -------------------
   For a fixed loop the law is d/dt ∬B·dA = ∬(∂B/∂t)·dA. Route A: midpoint
   rings, slope of the flux at h = 1e-3. Route B: Gauss–Legendre radial rule,
   ∂B/∂t at h = 2e-3. No shared samples, steps or rules.                    */
(function(){
  var F = STAGES.emFaraday;
  var st = { scene:'own', R:1.0, bfn:F.bBuild('2.2*sin(1.3*t)*exp(-(x^2+y^2))').f };
  var worst = 0;
  var ts = [0.3, 1.1, 2.6];
  for(var i = 0; i < ts.length; i++){
    var a = F.typedEMF(st, ts[i], 192, 64), b = F.typedEMFInside(st, ts[i]);
    worst = Math.max(worst, Math.abs(a - b) / Math.max(1e-12, Math.abs(a), Math.abs(b)));
  }
  sok('emFaraday typed: derivative of the integral = integral of the derivative',
      worst < 1e-5, 'worst rel ' + worst);
  st.bfn = F.bBuild('1.7*exp(-(x^2+y^2))').f;
  sok('emFaraday typed: a static field induces nothing, by both routes',
      Math.abs(F.typedEMF(st, 1)) < 1e-9 && Math.abs(F.typedEMFInside(st, 1)) < 1e-9,
      F.typedEMF(st, 1) + ' / ' + F.typedEMFInside(st, 1));
  var threw = false;
  try { F.bBuild('z^2'); } catch(e){ threw = true; }
  sok('emFaraday typed: a stray z is rejected with a message, never read as time',
      threw, 'accepted');
  sok('emFaraday typed: sqrt and atan survive the t rewrite',
      Math.abs(F.bBuild('sqrt(4) + atan(0) + 0*t').f(0, 0, 5) - 2) < 1e-12, 'mangled');
})();

/* ---- atomSM typed content: anomaly cancellation in exact arithmetic -------
   The five triangle sums and the Witten doublet parity are computed over the
   reader's multiplet list in integer arithmetic, so "sums to zero" is a
   statement about numerators, never a tolerance. Route B for the
   gravitational sum expands every multiplet into components and adds
   Q = T3 + Y; it must equal route A because each multiplet's T3 cancel
   pairwise.                                                                 */
(function(){
  var F = STAGES.atomSM;
  var SM = 'Q 3 2 1/6\nuc 3b 1 -2/3\ndc 3b 1 1/3\nL 1 2 -1/2\nec 1 1 1';
  var P = F.parseSheet(SM);
  sok('atomSM typed: one SM generation parses clean', P.errs.length === 0 && P.rows.length === 5,
      JSON.stringify(P.errs));
  var an = F.sums(P.rows);
  sok('atomSM typed: all five sums vanish exactly (numerator 0, not 1e-16)',
      an.s333 === 0 && an.s331.n === 0 && an.s221.n === 0 && an.s111.n === 0 && an.sgrav.n === 0,
      [an.s333, an.s331.n + '/' + an.s331.d, an.s221.n + '/' + an.s221.d,
       an.s111.n + '/' + an.s111.d, an.sgrav.n + '/' + an.sgrav.d].join(' , '));
  sok('atomSM typed: 4 SU(2) doublets, even — the Witten check passes',
      an.doublets === 4, an.doublets);
  var lines = SM.split('\n'), allBreak = true, detail = '';
  for(var i = 0; i < 5; i++){
    var a2 = F.sums(F.parseSheet(lines.slice(0, i).concat(lines.slice(i + 1)).join('\n')).rows);
    var fails = (a2.s333 !== 0 ? 1 : 0) + (a2.s331.n !== 0 ? 1 : 0) + (a2.s221.n !== 0 ? 1 : 0) +
                (a2.s111.n !== 0 ? 1 : 0) + (a2.sgrav.n !== 0 ? 1 : 0) + (a2.doublets % 2);
    if(!fails){ allBreak = false; detail += lines[i] + ' survived removal; '; }
  }
  sok('atomSM typed: removing any one multiplet breaks at least one check', allBreak, detail);
  var q = F.chargeSum(P.rows);
  sok('atomSM typed: sum of Q over 15 components === sum of Y over multiplets, exactly',
      q.n === an.sgrav.n && q.d === an.sgrav.d, q.n + '/' + q.d);
  var cut = F.parseSheet(lines.slice(0, 4).join('\n')).rows;  // ec removed
  var a3 = F.sums(cut), q3 = F.chargeSum(cut);
  sok('atomSM typed: the two routes agree on a broken content too, both exactly -1',
      q3.n === a3.sgrav.n && q3.d === a3.sgrav.d && a3.sgrav.n === -1 && a3.sgrav.d === 1,
      q3.n + '/' + q3.d + ' vs ' + a3.sgrav.n + '/' + a3.sgrav.d);
  var E = F.parseSheet('Q 3 2 0.1667');
  sok('atomSM typed: a decimal Y is rejected with its line number, asking for a fraction',
      E.errs.length === 1 && E.errs[0].line === 1 && /fraction/.test(E.errs[0].msg),
      JSON.stringify(E.errs));
  var E2 = F.parseSheet('Q 5 2 1/6');
  sok('atomSM typed: an unknown SU(3) rep is rejected by name',
      E2.errs.length === 1 && /SU\(3\)/.test(E2.errs[0].msg), JSON.stringify(E2.errs));
})();

/* ---- emWave typed source: the speed of light as an output -----------------
   The stage path over emFDTD1D (the engine's own convergence and acceptance
   tests live in tests.js, inside the 21-49 window). Here: the build guard,
   the stage's cached compute, and the sign convention of the radiated field. */
(function(){
  var F = STAGES.emWave;
  var threw = false;
  try { F.kBuild('x + t'); } catch(e){ threw = true; }
  sok('emWave typed: a stray x is rejected - the source depends on time alone', threw, 'accepted');
  var st = { scene:'own', src:'exp(-((t-10)/3)^2)', ownR:null };
  var r = F.ownCompute(st);
  sok('emWave typed: measured c matches 1/sqrt(mu0 eps0) to 1e-4 (the acceptance test)',
      r.cRel < 1e-4, 'rel ' + r.cRel);
  sok('emWave typed: E/H at the far probe is the impedance of free space',
      r.zRel < 1e-3, 'rel ' + r.zRel);
  sok('emWave typed: the compute is cached against the source text',
      F.ownCompute(st) === r, 'recomputed');
  var mn = 0, mx = 0;
  for(var i = 0; i < r.steps; i++){ mn = Math.min(mn, r.Eb[i]); mx = Math.max(mx, r.Eb[i]); }
  sok('emWave typed: the radiated E opposes a positive sheet current',
      mn < -10 && Math.abs(mx) < Math.abs(mn) * 0.2, mn + ' / ' + mx);
})();

/* ---- emSandbox: the laws measured on an arbitrary arrangement -------------
   The engine routes (emDivAt, emPoyntingBalance) are pinned in tests.js with
   their orders measured; here the stage path — the adaptive audit sphere, the
   two prose guards, and the demo arrangement's actual values.               */
(function(){
  var F = STAGES.emSandbox;
  var st = { objs:[{ kind:'charge', q:1.5, p:{x:-1.4,y:0,z:0}, v:{x:0,y:0,z:0} },
                   { kind:'wire', I:2, p:{x:1.2,y:0.4,z:0} }],
             probeP:{ x:0.2, y:1.3, z:0 } };
  var B = F.ballOf(st);
  sok('emSandbox laws: the audit sphere keeps clear of the nearest source',
      B.Rb <= 0.751 * B.near && B.Rb >= 0.3, B.Rb + ' vs near ' + B.near);
  var dv = F && emDivAt(st.objs, B.p, B.hd, 'E');
  sok('emSandbox laws: Laplace residual under 1e-6 of its gross on the demo arrangement',
      Math.abs(dv.div) < 1e-6 * dv.gross, dv.div / dv.gross);
  var bal = emPoyntingBalance(st.objs, B.p, B.Rb);
  sok('emSandbox laws: static crossed fields circulate - net flux ~ 0, gross finite',
      Math.abs(bal.flux) < 1e-9 * bal.gross && Math.abs(bal.dUdt) < 1e-9 * bal.gross && bal.gross > 1e-3,
      bal.flux + ' / ' + bal.dUdt + ' / gross ' + bal.gross);
  var onSrc = F.lawsCard({ objs: st.objs, probeP:{ x:-1.38, y:0.04, z:0 } });
  sok('emSandbox laws: on a source the card explains the delta function instead of printing a spike',
      /delta function/.test(onSrc), 'no guard prose');
  var empty = F.lawsCard({ objs:[], probeP:{ x:0, y:0, z:0 } });
  sok('emSandbox laws: an empty scene gets prose, never NaN',
      /Nothing is placed/.test(empty) && !/NaN/.test(empty), 'bad empty card');
})();

/* Regression for the two FALSE-SCALE rows auditsides caught the day the card
   shipped: the default dipole probed on its own symmetry plane, where E is
   purely x and even, so every derivative TERM cancels identically and a gross
   built from Sum|d_i F_i| was itself round-off. The gross now comes from the
   stencil SAMPLES (what the zero cancelled out of), and an identically-zero
   field becomes prose instead of a ratio of two round-offs. */
(function(){
  var F = STAGES.emSandbox;
  var st = { objs:[{ kind:'charge', q: 1.5, p:{x:-1.6,y:0,z:0}, v:{x:0,y:0,z:0} },
                   { kind:'charge', q:-1.5, p:{x: 1.6,y:0,z:0}, v:{x:0,y:0,z:0} }],
             probeP:{ x:0, y:1.4, z:0 } };
  var B = F.ballOf(st);
  var dE = emDivAt(st.objs, B.p, B.hd, 'E');
  sok('emSandbox laws: symmetry-plane dipole - div is round-off against a REAL gross',
      dE.gross > 0.1 && Math.abs(dE.div) < 1e-9 * dE.gross,
      'div ' + dE.div + ' gross ' + dE.gross);
  var dB = emDivAt(st.objs, B.p, B.hd, 'B');
  sok('emSandbox laws: static charges have exactly zero B - the card says so as prose',
      dB.fmax === 0 && /vanishes/.test(F.lawsCard(st)), 'fmax ' + dB.fmax);
})();

/* ---- atomForces: the pair is the reader's, the crossovers are measured ----
   Engine routes (atPairLedger, atCrossClosed vs atCrossBisect) are pinned in
   tests.js; here the stage path — the accessor, a typed quark pair, and the
   scene-keyed legend. */
(function(){
  var F = STAGES.atomForces;
  var st = { pairKey:'ne', custom:{}, probe:1, showCornell:false };
  var pair = F.pairOf(st);
  sok('atomForces pair: the ne preset resolves through the accessor',
      pair.q1 === 0 && pair.h2 === false, JSON.stringify(pair));
  var sw = atDominanceSwitches(pair, 1e-3, 10);
  sok('atomForces pair: weak -> gravity at 0.2216 fm, bisection = closed form',
      sw.length === 1 && sw[0].from === 'weak' && sw[0].to === 'gravity' &&
      Math.abs(sw[0].r - sw[0].closed) < 1e-9 * sw[0].closed &&
      Math.abs(sw[0].r - 0.2216163) < 1e-6,
      JSON.stringify(sw));
  var st2 = { pairKey:'custom', custom:{ q1: 2/3, m1: 2.16, h1:true, q2: -1/3, m2: 4.7, h2:true }, probe: 1 };
  var led = atPairLedger(F.pairOf(st2), 1);
  sok('atomForces pair: a typed quark pair gets the strong force and an attractive EM',
      led.rows[0].on && led.rows[1].V < 0, JSON.stringify(led.rows.map(function(w){ return w.V; })));
  var lg = F.legend(st);
  sok('atomForces pair: the n-e legend drops the strong and EM rows it cannot draw',
      !lg.some(function(r){ return /strong|electromagnetic/.test(r[1]); }), JSON.stringify(lg));
})();

/* ---- atomSim levels lab: the reader's screening, solved -------------------
   Engine routes (atLevels: the acceptance pin, the measured second order, the
   Richardson gain, the degeneracy and its screening split) live in tests.js;
   here the stage path — the build guard, the cache, and the demo screening. */
(function(){
  var F = STAGES.atomSim;
  var threw = false;
  try { F.zBuild('y + Z'); } catch(e){ threw = true; }
  sok('atomSim levels: a literal y is rejected - the symbols are r and Z', threw, 'accepted');
  sok('atomSim levels: x is accepted as an alias of r (what the audit types)',
      Math.abs(F.zBuild('x + Z').f(2, 3) - 5) < 1e-12, F.zBuild('x + Z').f(2, 3));
  var st = { zoom: 3, Z: 1, zsrc: 'Z', lv: null };
  var lv = F.lvCompute(st);
  sok('atomSim levels: pure hydrogen through the stage path lands on -13.6057 eV to 1e-6',
      lv.s.length >= 3 && Math.abs(lv.s[0].Eev - atBohrEv(1, 1)) < 1e-6 * Math.abs(atBohrEv(1, 1)),
      lv.s.length ? lv.s[0].Eev : 'none');
  sok('atomSim levels: the compute is cached against (source, Z)',
      F.lvCompute(st) === lv, 'recomputed');
  var st2 = { zoom: 3, Z: 3, zsrc: '1 + (Z-1)*exp(-2*r)', lv: null };
  var lv2 = F.lvCompute(st2);
  sok('atomSim levels: the demo screening splits 2s below 2p',
      lv2.s.length > 1 && lv2.p.length && lv2.s[1].E < lv2.p[0].E, JSON.stringify([lv2.s.length, lv2.p.length]));
  var st3 = { zoom: 3, Z: 1, zsrc: '0*Z - 1', lv: null };
  var lv3 = F.lvCompute(st3);
  sok('atomSim levels: a repulsive screening yields prose, never a blank or NaN',
      lv3.s.length === 0 && /never binds/.test(F.lvReadout(st3)), lv3.s.length);
})();

/* ---- clImplicit: the rule against the relation, through the stage ---------
   The engine (clImplicitSlope / clImplicitSecant / clInverseAt, with their
   measured orders) is pinned in tests.js. Here the stage path: the preset
   accessor, the branch found by bisection at the reader's x, and the three
   prose cases that must never become a number.                              */
(function(){
  var F = STAGES.clImplicit;
  var st = { scene:'implicit', key:'folium', src:'', isrc:'', x:1.5, a:1 };
  F.recompute(st);
  sok('clImplicit: the folium branch at x = 3/2 is found by bisection on F',
      Math.abs(st.y - 1.5) < 1e-9, st.y);
  sok('clImplicit: the rule and the curve agree there, both giving -1',
      st.A.ok && st.B.ok && Math.abs(st.A.m + 1) < 1e-12 && Math.abs(st.A.m - st.B.m) < 1e-6,
      (st.A.ok ? st.A.m : st.A.why) + ' / ' + (st.B.ok ? st.B.m : st.B.why));
  sok('clImplicit: the gap is the secant h^2 - halving the step cuts it ~4x',
      st.ord && st.ord.r1 > 3.5 && st.ord.r1 < 4.5,
      st.ord ? st.ord.r1 : 'no order');
  /* the circle's side: a vertical tangent is a FACT with a sentence */
  var stv = { scene:'implicit', key:'circle', src:'', isrc:'', x:2, a:1 };
  F.recompute(stv);
  var rv = F.readout(stv);
  sok('clImplicit: near the circle side the panel names the vertical tangent',
      /vertical/.test(rv) && !/NaN|Infinity/.test(rv), rv.slice(0, 120));
  /* the lemniscate node: BOTH partials vanish - a different failure */
  var stn = { scene:'implicit', key:'lemniscate', src:'', isrc:'', x:0, a:1, y0:0 };
  F.recompute(stn);
  var A0 = clImplicitSlope(stn.F, 0, 0);
  sok('clImplicit: the lemniscate node has no tangent, and says singular',
      !A0.ok && /singular/.test(A0.why), JSON.stringify(A0));
  /* the inverse scene, through the same stage */
  var sti = { scene:'inverse', key:'cube', src:'', isrc:'', x:1, a:1 };
  F.recompute(sti);
  sok('clImplicit inverse: 1/f′(a) and the numeric inversion agree to 1e-10',
      sti.I.ok && Math.abs(sti.I.sym - 0.25) < 1e-15 && Math.abs(sti.I.num - 0.25) < 1e-10,
      sti.I.ok ? sti.I.sym + ' / ' + sti.I.num : sti.I.why);
  var ri = F.readout(sti);
  sok('clImplicit inverse: the panel prints no NaN and both routes',
      !/NaN|Infinity|undefined/.test(ri) && /1\/f/.test(ri), ri.slice(0, 100));
  /* a typed relation flows through the accessor unchanged */
  var stc = { scene:'implicit', key:'custom', src:'x^2 + y^2 - 4', isrc:'', x:1, a:1 };
  F.recompute(stc);
  sok('clImplicit: a typed relation gets the same two routes',
      stc.A.ok && Math.abs(stc.A.m + 1 / Math.sqrt(3)) < 1e-9 &&
      Math.abs(stc.A.m - stc.B.m) < 1e-6, stc.A.ok ? stc.A.m : stc.A.why);
})();

/* ---- emDielectric: the stack the reader lists ----------------------------
   The engine (esStack*) is pinned in tests.js. Here the stage path: the sheet
   applied, the cached report, and the two prose guards.                     */
(function(){
  var F = STAGES.emDielectric;
  var st = { sheet:ED_SHEET, A:0.01, Q:3e-9, probe:0.66e-3, connected:false, L:[] };
  F.applySheet(st);
  sok('emDielectric: the default sheet gives three layers and no error',
      !st.err && st.L.length === 3, st.err || st.L.length);
  var R = F.reportOf(st);
  sok('emDielectric: the field route and the series route agree to 1e-12',
      Math.abs(R.cField - R.cSeries) < 1e-12 * R.cField, R.cField + ' vs ' + R.cSeries);
  sok('emDielectric: the effective kappa sits between the smallest and largest layer',
      R.kEff > 3.7 && R.kEff < 5.4, R.kEff);
  sok('emDielectric: the bound charges cancel exactly against a real gross',
      R.B.gross > 1e-12 && Math.abs(R.B.total) < 1e-12 * R.B.gross,
      R.B.total + ' / ' + R.B.gross);
  sok('emDielectric: the report is cached against the stack and the sliders',
      F.reportOf(st) === R, 'recomputed');
  /* a bad sheet keeps the previous stack — never blanks the picture */
  var before = st.L.length;
  st.sheet = '0.4 unobtainium';
  F.applySheet(st);
  sok('emDielectric: a bad edit keeps the previous stack and explains itself',
      st.L.length === before && /neither a number nor a material/.test(st.err), st.err);
  /* vacuum: both the total AND the gross vanish, and the panel must say so
     rather than print a ratio of two zeros */
  var sv = { sheet:'1.2 1', A:0.01, Q:3e-9, probe:0.6e-3, connected:false, L:[] };
  F.applySheet(sv);
  var RV = F.reportOf(sv);
  var rv = F.readout(sv);
  sok('emDielectric: an empty gap has no bound charge, and no NaN anywhere',
      RV.B.gross < 1e-18 && Math.abs(RV.kEff - 1) < 1e-9 && !/NaN|Infinity/.test(rv),
      RV.B.gross + ' / ' + RV.kEff);
})();

/* ---- B3: abstract linear maps and inner product spaces -------------------
   The engines are pinned in tests.js. Here the stage paths, whose second
   route is different again: laAbstract recovers coordinates by SAMPLING the
   operator's output and solving, so it never reads a coefficient list.     */
(function(){
  var F = STAGES.laAbstract;
  var st = { n:5, op:'ddx', src:'7 - 3*x + 2*x^3 + 5*x^4 - x^5' };
  F.recompute(st);
  var R = F.reportOf(st);
  sok('laAbstract: matrix route and sampled-operator route are identical',
      !st.err && R.worst === 0, st.err || R.worst);
  sok('laAbstract: d/dx on P5 has rank 5 and nullity 1 - the constants',
      R.rn.rank === 5 && R.rn.nullity === 1, JSON.stringify(R.rn));
  sok('laAbstract: and is nilpotent of index exactly 6', R.nil === 6, R.nil);
  /* the antiderivative's check route is a QUADRATURE, not symbolic algebra */
  var si = { n:4, op:'integ', src:'3 - 2*x + x^2' };
  F.recompute(si);
  var RI = F.reportOf(si);
  sok('laAbstract: the antiderivative agrees with adaptive quadrature',
      !si.err && RI.worst < 1e-9, si.err || RI.worst);
  /* REGRESSION (auditsides, day one): x. and the antiderivative RAISE the
     degree, so they leave P_n and the stage truncates. Both routes must adopt
     that same convention - fitting the raised result straight back to degree n
     interpolates the lost term across the lower ones and disagreed by 1.4.
     These two cases only bite when the input actually REACHES degree n. */
  var sm = { n:5, op:'mulx', src:'7 - 3*x + 2*x^3 + 5*x^4 - x^5' };
  F.recompute(sm);
  sok('laAbstract: x. truncates, and both routes truncate the same way',
      !sm.err && sm._r.worst < 1e-9, sm.err || sm._r.worst);
  var sq = { n:4, op:'integ', src:'1 + x + x^2 + x^3 + x^4' };
  F.recompute(sq);
  sok('laAbstract: and so does the antiderivative at full degree',
      !sq.err && sq._r.worst < 1e-8, sq.err || sq._r.worst);
  /* x d/dx is diagonal, so the monomials are eigenvectors with eigenvalue j */
  var sx = { n:5, op:'xddx', src:'x^3' };
  F.recompute(sx);
  var RX = F.reportOf(sx);
  sok('laAbstract: x d/dx is diagonal with the degrees on the diagonal',
      RX.M.every(function(r, i){ return r.every(function(v, j){ return i === j ? Math.abs(v - i) < 1e-12 : Math.abs(v) < 1e-12; }); }),
      JSON.stringify(RX.M[2]));
  /* a polynomial that does not fit the space is refused, in words */
  /* An (n+1)x(n+1) Vandermonde solve NEVER fails - it fits a degree-n curve
     through n+1 samples of anything - so the fit is verified at points it did
     not use. Without that, x^5 in a degree-2 space came back as a quadratic
     and the panel called it "its coordinates". */
  var sb = { n:2, op:'ddx', src:'x^5' };
  F.recompute(sb);
  sok('laAbstract: too high a degree is refused with a reason, not silently fitted',
      !!sb.err && /degree/.test(sb.err), sb.err || 'accepted silently');
  var sn = { n:4, op:'ddx', src:'sin(x)' };
  F.recompute(sn);
  sok('laAbstract: and a non-polynomial is refused too, with how far it misses',
      !!sn.err && /misses by/.test(sn.err), sn.err || 'accepted silently');
  var sok2 = { n:4, op:'ddx', src:'2 - x + 3*x^2' };
  F.recompute(sok2);
  sok('laAbstract: …while a genuine low-degree polynomial still passes',
      !sok2.err && sok2._r.worst === 0, sok2.err || sok2._r.worst);

  var G = STAGES.laInnerFn;
  var gs = { wk:'legendre', deg:4, fsrc:'exp(x)' };
  G.recompute(gs);
  var GR = G.reportOf(gs);
  sok('laInnerFn: Gram-Schmidt output is orthonormal to 1e-12',
      GR.off < 1e-12 && GR.G.every(function(r, i){ return Math.abs(r[i] - 1) < 1e-12; }), GR.off);
  sok('laInnerFn: and matches Rodrigues formula to 1e-9', GR.cgap < 1e-9, GR.cgap);
  sok('laInnerFn: Parseval accounts for the whole function',
      Math.abs(GR.par.sum + GR.par.errsq - GR.par.fsq) < 1e-9 * GR.par.fsq,
      (GR.par.sum + GR.par.errsq) + ' vs ' + GR.par.fsq);
  var gc = { wk:'chebyshev', deg:4, fsrc:'exp(x)' };
  G.recompute(gc);
  var GC = G.reportOf(gc);
  sok('laInnerFn: the same code under a different weight is still orthogonal',
      GC.off < 1e-10, GC.off);
  sok('laInnerFn: and its zeros are Chebyshev\'s', GC.cgap < 1e-9, GC.cgap);
  var gb = { wk:'legendre', deg:3, fsrc:'2 - x + 3*x^2' };
  G.recompute(gb);
  sok('laInnerFn: a function already in the span is reproduced exactly',
      G.reportOf(gb).P.err < 1e-12, G.reportOf(gb).P.err);
})();

/* ---- odExist / odUnique: the existence machinery, through the STAGE --------
   The engine is unit-tested in tests.js; what only this file can reach is the
   stage's own arithmetic — how it assembles the rectangle, chooses the interval
   it measures over, and floors the scale a residual is read against. Two of
   those were defects the engine tests could not have caught:

     · the sensitivity sweep ran to x0 + a even on a field whose solution stops
       existing before then, so `base` came back non-finite and every row of the
       ladder read "—". It now stops at 0.6 of the measured escape.
     · the residual of the y ≡ 0 family member was quoted against its own gross,
       which is exactly zero — the FALSE-SCALE failure, printing a perfect
       result as 5000% disagreement. The scale is floored with M.

   Tolerances are the routes' own measured errors, recorded beside each.        */
(function(){
  var X = STAGES.odExist;
  /* every preset, entered the way a demo enters it, through the stage */
  for(var key in OD_FIELDS){
    var st = {};
    X.enter(st, { scene:'picard', key:key, N:10 });
    var E = OD_FIELDS[key];
    sok('odExist ' + key + ': the rectangle is the table\'s own',
        st.box.x0 === E.x0 && st.box.a === E.a && st.box.b === E.b, key);
    sok('odExist ' + key + ': h = min(a, b/M) with M measured',
        Math.abs(st.box.h - Math.min(E.a, E.b / st.box.M)) < 1e-12,
        st.box.h + ' vs ' + Math.min(E.a, E.b / st.box.M));
    /* THE INDUCTION STEP THE PROOF TURNS ON: no iterate leaves the box. If this
       ever fails the drawn picture is outside the region where F was bounded
       and the panel's whole claim is void. */
    sok('odExist ' + key + ': no Picard iterate leaves the rectangle',
        st.stay <= E.b * (1 + 1e-9), st.stay + ' vs b=' + E.b);
    /* TWO ROUTES: the fixed-point iteration against RK4 on the same nodes —
       checked against THE THEOREM'S OWN TAIL rather than a flat tolerance.
       A flat 1e-8 was tried first and failed on `logistic`, correctly: its
       h = 1.667 is the largest interval in the table and the Picard series
       converges like h^n/n!, so ten iterates genuinely have not got there yet.
       That is the mathematics, not a defect, and lowering the tolerance to
       accommodate it would have thrown away the check everywhere else.
       Σ_(k≥N) M L^k h^(k+1)/(k+1)! is what the theorem promises is left, and it
       is 1.6e-5 for logistic and 2.4e-11 for linear — the check tightens by six
       orders where the mathematics allows it to. The added 1e-9 is the
       cumulative quadrature's own floor (measured 5.4e-12 at K = 160), which
       the Picard bound knows nothing about. */
    var tail = 0;
    for(var tn = st.pic.steps.length; tn < st.pic.steps.length + 40; tn++)
      tail += odPicardBound(st.box.M, st.lip.L, st.box.h, tn);
    sok('odExist ' + key + ': Picard is inside the theorem\'s own tail of RK4',
        st.lip.lip ? st.picGap <= tail + 1e-9 : true,
        st.picGap + ' vs tail ' + tail);
    sok('odExist ' + key + ': the scale a residual is read against never vanishes',
        st.picScale > 0 && Number.isFinite(st.picScale), st.picScale);
  }
  /* the euler scene must not measure across an interval the solution does not
     survive — blowup escapes at π/2 and a is 1.6 */
  var sb = {};
  X.enter(sb, { scene:'euler', key:'blowup', nE:8 });
  sok('odExist: the euler window stops short of the escape',
      sb.esc.escaped && sb.x1 < sb.esc.x, sb.x1 + ' vs escape at ' + sb.esc.x);
  sok('odExist: and its reference is finite everywhere it is drawn',
      Array.prototype.every.call(sb.eref.ys, isFinite), 'non-finite reference sample');
  /* the measured orders, through the stage's own plumbing (fixed base count) */
  var so = {};
  X.enter(so, { scene:'euler', key:'nonlin', nE:8 });
  sok('odExist: Euler measures first order', so.ord.euler.p1 > 0.85 && so.ord.euler.p2 < 1.05,
      so.ord.euler.p1 + ', ' + so.ord.euler.p2);
  sok('odExist: RK4 measures fourth', so.ord.rk4.p1 > 3.8 && so.ord.rk4.p2 < 4.05,
      so.ord.rk4.p1 + ', ' + so.ord.rk4.p2);
  sok('odExist: the order does not move with the steps slider',
      (function(){ var s2 = {}; X.enter(s2, { scene:'euler', key:'nonlin', nE:40 });
                   return Math.abs(s2.ord.euler.p1 - so.ord.euler.p1) < 1e-12; })(),
      'the base count must be fixed, or RK4 falls under round-off');
})();
(function(){
  var U = STAGES.odUnique;
  var su = {};
  U.enter(su, { key:'cuberoot', c:0.5 });
  sok('odUnique: the cube-root field scans as non-Lipschitz', su.lip.lip === false, su.lip.ratio);
  sok('odUnique: and three solutions through the origin are drawn', su.alts.length === 3, su.alts.length);
  /* EVERY drawn candidate is substituted back. Measured worst residual over the
     three: 1.6e-10, against a floor M = 3.93 — so 4e-11 relative, tolerance 1e-8 */
  for(var i = 0; i < su.alts.length; i++)
    sok('odUnique: family member ' + i + ' solves the equation',
        su.alts[i].resid / su.alts[i].scale < 1e-8,
        su.alts[i].resid + ' gross ' + su.alts[i].gross);
  /* THE FALSE-SCALE GUARD, asserted on the SAME number the panel prints from.
     The flat member's own gross is exactly 0, so without the M floor fmtGap
     would render a perfect residual as a 5000% disagreement in the affirmative
     colour — J9 inverted. Corrupting the floor away turns the two lines below
     red, which is the only reason to trust them. */
  sok('odUnique: the flat member really has no gross of its own',
      su.alts[2].gross === 0, su.alts[2].gross);
  sok('odUnique: so its residual is scaled by M instead, not by zero',
      su.alts[2].scale === su.M && su.M > 1, su.alts[2].scale + ' vs M=' + su.M);
  /* continuous dependence fails, and the variational number is withheld rather
     than computed from a symmetric difference that reads 0 on an even field */
  sok('odUnique: no ∂y/∂y₀ is offered where ∂F/∂y is unbounded', su.vari.ok === false, su.vari.v);
  sok('odUnique: and no Grönwall bound is printed from a constant that does not exist',
      !Number.isFinite(su.gron), su.gron);
  sok('odUnique: the amplification grows without bound',
      su.sens.rows[3].ratio / su.sens.rows[0].ratio > 1e5,
      su.sens.rows.map(function(r){ return r.ratio; }).join(' | '));
  /* THE CONTROL that gives all of the above meaning: the same stage on a
     Lipschitz field must reach the opposite verdict on every one of them */
  var sl = {};
  U.enter(sl, { key:'linear' });
  sok('odUnique control: y′ = y scans as Lipschitz', sl.lip.lip === true, sl.lip.L);
  sok('odUnique control: it offers no second solution', sl.alts.length === 0, sl.alts.length);
  sok('odUnique control: ∂y/∂y₀ is computed and is e', sl.vari.ok &&
      Math.abs(sl.vari.v - Math.E) < 1e-8, sl.vari.v);
  sok('odUnique control: and the measured ratio matches it to 1e-7',
      Math.abs(sl.sens.rows[1].ratio - sl.vari.v) < 1e-7,
      sl.sens.rows[1].ratio + ' vs ' + sl.vari.v);
  sok('odUnique control: Grönwall bounds it', sl.vari.v <= sl.gron, sl.vari.v + ' vs ' + sl.gron);
  /* a field that escapes must measure over an interval it survives */
  var sb2 = {};
  U.enter(sb2, { key:'blowup' });
  sok('odUnique: the sweep stops short of the escape on a blowing-up field',
      sb2.esc.escaped && sb2.x1 < sb2.esc.x, sb2.x1 + ' vs ' + sb2.esc.x);
  sok('odUnique: so every row of the ladder is a number',
      sb2.sens.rows.every(function(r){ return isFinite(r.sep); }),
      sb2.sens.rows.map(function(r){ return r.sep; }).join(' | '));
  /* and the escape itself, by two routes that share nothing — measured gap 8.8e-12 */
  sok('odUnique: marching in x and integrating dy/F agree on the escape',
      Math.abs(sb2.esc.x - sb2.escQ) < 1e-10, sb2.esc.x + ' vs ' + sb2.escQ);
})();


/* ---- rlMetric: a metric the reader types, and what the stage locates in it --
   Programme A relativity item 1 (2026-08-18). The stage's own recompute() is
   where the engine meets the reader: it picks the static band, the funnel's
   extent, the orbit's step size and the diagnosis for "there is no orbit".
   None of that is in 46a and none of it is reachable from runtests, and two of
   the four were wrong on the first screenshot.

   Route A is the integrated geodesic; route B is the potential's turning
   points. Both live on st.M, so agreement can be asserted here without the
   test knowing which is right. */
(function(){
  var S = STAGES.rlMetric;

  /* --- Schwarzschild: the four things this stage used to write down --- */
  var s = {};
  S.enter(s, { key:'schwarzschild', body:'sun', rr:6, p1:20, p2:40 });
  sok('rlMetric: the horizon is located at 2GM/c², not quoted',
      Math.abs(s.M.H.outer - 2) < 1e-12, s.M.H.outer);
  sok('rlMetric: and there is exactly one of it', s.M.H.count === 1, s.M.H.count);
  sok('rlMetric: the photon sphere is located at 3', Math.abs(s.M.ph - 3) < 1e-10, s.M.ph);
  sok('rlMetric: the ISCO is located at 6', Math.abs(s.M.isco.r - 6) < 1e-5, s.M.isco.r);
  sok('rlMetric: and A·B = 1 is measured, not captioned', s.M.ab.gap < 1e-14, s.M.ab.gap);
  sok('rlMetric: the funnel starts exactly at the horizon',
      Math.abs(s.M.emb.r[0] - s.M.H.outer) < 1e-12, s.M.emb.r[0]);
  sok('rlMetric: and none of its samples is imaginary or infinite',
      s.M.emb.imag === 0 && s.M.emb.bad === 0, s.M.emb.imag + '/' + s.M.emb.bad);
  /* the funnel against Flamm's closed form, which is what 46 quotes. rs = 2 in
     these units, so grFlammZ(r, 2) is the same surface by a different route. */
  (function(){
    var worst = 0;
    for(var i = 1; i < s.M.emb.r.length; i++)
      worst = Math.max(worst, Math.abs(s.M.emb.z[i] - grFlammZ(s.M.emb.r[i], 2)));
    sok('rlMetric: the drawn funnel is Flamm\'s paraboloid to 1e-8', worst < 1e-8, worst);
  })();

  /* --- the orbit: route A against route B, and the drift that measures A --- */
  sok('rlMetric: a bound orbit exists between the two apsides', !!s.M.geo, s.M.why || 'none');
  sok('rlMetric: E drifts by under 1e-8 over the run', s.M.geo.driftE < 1e-8, s.M.geo.driftE);
  sok('rlMetric: so does L', s.M.geo.driftL < 1e-8, s.M.geo.driftL);
  sok('rlMetric: and so does the norm, which is imposed nowhere either',
      s.M.geo.driftNorm < 1e-8, s.M.geo.driftNorm);
  sok('rlMetric: the potential\'s pericentre is the one that was asked for',
      Math.abs(s.M.inner - 20) < 1e-8, s.M.inner);
  sok('rlMetric: and its apocentre likewise', Math.abs(s.M.outer - 40) < 1e-8, s.M.outer);
  /* route A never goes inside route B's turn — an exact inequality, since the
     track's minimum is taken over samples and can only sit outside the true one */
  sok('rlMetric: the integrated track never crosses the predicted pericentre',
      s.M.geo.rMin >= s.M.inner - 1e-9, s.M.geo.rMin + ' vs ' + s.M.inner);
  sok('rlMetric: and reaches it within a step', s.M.geo.rMin - s.M.inner < 0.02,
      s.M.geo.rMin - s.M.inner);
  sok('rlMetric: the orbit precesses forward rather than closing',
      s.M.per.precession > 0.5 && s.M.per.precession < 1.5, s.M.per.precession);
  /* against the first-order closed form in 46. a = 30, e = 1/3, so the omitted
     higher orders are worth ~20% here — the test is the size, not the digits,
     and tests.js measures the same gap shrinking as the orbit widens. */
  (function(){
    var a = 30, e = 1 / 3, first = 6 * Math.PI / (a * (1 - e * e));
    sok('rlMetric: and by roughly 6πGM/c²a(1−e²), the rest being higher orders',
        Math.abs(s.M.per.precession - first) < 0.3 * first,
        s.M.per.precession + ' vs ' + first);
  })();

  /* --- THE STEP RULE, on the whirl orbit that exposed it. This stage sized h
     from the Newtonian radial period alone until 2026-08-18, which samples a
     pericentre whirl a handful of times; rlOrbit found it and rlOrbitPlan is
     now shared by both. The check is route A against route B — the quadrature
     apsidal angle, which has no step size in it at all — at apsides tight
     enough that the two rules differ by a factor of seven. Measured gap on the
     shared rule: 8e-12 relative, so the tolerance is 1e-8; on the old rule the
     same orbit missed by more than that. --- */
  (function(){
    var w = {};
    S.enter(w, { key:'schwarzschild', body:'sun', rr:6, p1:8, p2:32 });
    sok('rlMetric whirl: apsides 8 and 32 still admit an orbit', !!w.M.geo, w.M.why || 'none');
    if(!w.M.geo) return;
    var qB = 2 * rlApsidalQuad(w.M.A, w.M.B, 8, 32, w.M.el.E, w.M.el.L, 1, 64);
    sok('rlMetric whirl: the integrated apsidal angle lands on the quadrature',
        Math.abs(w.M.per.apsidal - qB) < 1e-8 * qB,
        w.M.per.apsidal + ' vs ' + qB);
    sok('rlMetric whirl: and the track stayed bound rather than stopping early',
        w.M.geo.stop === '', w.M.geo.stop);
    sok('rlMetric whirl: the shared plan resolves the pericentre, not just the period',
        rlOrbitPlan(8, 32, w.M.el.L, 10, 1200).h < 2 * Math.PI * Math.pow(20, 1.5) / 1200,
        rlOrbitPlan(8, 32, w.M.el.L, 10, 1200).h);
  })();

  /* --- the metric with space flattened: same A, so the same three radii --- */
  var n = {};
  S.enter(n, { key:'newton', body:'sun', rr:6, p1:20, p2:40 });
  sok('rlMetric newton: the horizon has not moved', Math.abs(n.M.H.outer - 2) < 1e-12, n.M.H.outer);
  sok('rlMetric newton: nor has the ISCO, which depends on A alone',
      Math.abs(n.M.isco.r - s.M.isco.r) < 1e-9, n.M.isco.r);
  sok('rlMetric newton: but A·B is no longer 1, and the panel measures that',
      n.M.ab.gap > 0.01, n.M.ab.gap);
  sok('rlMetric newton: and the orbit precesses less than the real metric\'s',
      n.M.per.precession > 0 && n.M.per.precession < s.M.per.precession,
      n.M.per.precession + ' vs ' + s.M.per.precession);

  /* --- two horizons, and the trap the first screenshot walked into --- */
  var d = {};
  S.enter(d, { key:'desitter', body:'hole', rr:8, p1:8, p2:12 });
  sok('rlMetric desitter: two horizons are found', d.M.H.count === 2, d.M.H.count);
  sok('rlMetric desitter: the static band lies BETWEEN them, not outside them',
      Math.abs(d.M.lo - d.M.H.inner) < 1e-9 && Math.abs(d.M.hi - d.M.H.outer) < 1e-9,
      d.M.lo + ' … ' + d.M.hi);
  sok('rlMetric desitter: so the ISCO is a number rather than NaN',
      isFinite(d.M.isco.r), d.M.isco.r);
  sok('rlMetric desitter: and there is an outermost stable orbit as well',
      isFinite(d.M.isco.rOut) && d.M.isco.rOut > d.M.isco.r,
      d.M.isco.r + ' … ' + d.M.isco.rOut);
  sok('rlMetric desitter: the photon sphere is still exactly 3',
      Math.abs(d.M.ph - 3) < 1e-8, d.M.ph);
  /* the funnel must not be drawn out to the COSMOLOGICAL horizon: at 99 units
     wide the throat is two per cent of the picture and there is nothing to see */
  sok('rlMetric desitter: the funnel is scaled to the throat, not to r = 99',
      d.M.rDisc < 40 && d.M.rDisc > d.M.H.inner, d.M.rDisc);
  sok('rlMetric desitter: and it still holds the whole orbit',
      d.M.rDisc >= d.M.geo.rMax, d.M.rDisc + ' vs ' + d.M.geo.rMax);
  sok('rlMetric desitter: E and L are conserved here too', d.M.geo.driftE < 1e-8, d.M.geo.driftE);
  /* FOUR turning points, not three. Beyond the outer apsis the potential falls
     back under E² and the region past the barrier is allowed — that is how a
     particle escapes to the cosmological horizon. Taking "the outermost two"
     therefore returned the apocentre and the escape point, and the panel
     reported a pericentre four units out from the one it had been asked for.
     Schwarzschild has exactly three, so the wrong rule was right by accident
     there and only auditsides' preset sweep could see it. */
  sok('rlMetric desitter: this orbit has four turning points', d.M.bands === 4, d.M.bands);
  sok('rlMetric desitter: and route B still names the pericentre asked for',
      Math.abs(d.M.inner - 8) < 1e-8, d.M.inner);
  sok('rlMetric desitter: and the apocentre asked for',
      Math.abs(d.M.outer - 12) < 1e-8, d.M.outer);
  sok('rlMetric schwarzschild: which has three, so the old rule passed by luck',
      s.M.bands === 3, s.M.bands);

  /* apsides straddling the maximum of A have NO bound orbit, and the stage has
     to say which of the three reasons it is rather than printing a number */
  var d2 = {};
  S.enter(d2, { key:'desitter', body:'hole', rr:8, p1:20, p2:40 });
  sok('rlMetric desitter: apsides straddling the peak of A admit no orbit', !d2.M.geo, 'orbit found');
  sok('rlMetric desitter: and the stage says A decreases outward there',
      /DECREASES outward/.test(d2.M.why || ''), d2.M.why);

  /* THE BARRIER CASE, and the reason this suite exists. V²(r₁) = V²(r₂) = E²
     holds at 14 and 20 as surely as it does for a real orbit — but V² climbs
     ABOVE E² in between, so the region is forbidden. rlApsidesEL returned a
     perfectly plausible E and L for it until 2026-08-18, the integrator was
     handed a state on the wrong side of the barrier, and the "orbit" escaped
     to r = 80 while the panel reported apsides of 14 and 20. Schwarzschild
     cannot produce it, which is why the formula looked complete. */
  var d3 = {};
  S.enter(d3, { key:'desitter', body:'hole', rr:8, p1:14, p2:20 });
  sok('rlMetric desitter: two radii bracketing a BARRIER are not an orbit',
      !d3.M.geo, d3.M.geo ? 'escaped to ' + d3.M.geo.rMax : 'correctly refused');
  sok('rlMetric desitter: and the panel says which of the two shapes it found',
      /barrier/.test(d3.M.why || ''), d3.M.why);
  /* the necessary condition really is satisfied there — otherwise this test
     would be passing for the wrong reason */
  sok('rlMetric desitter: while V² really does match at both radii',
      Math.abs(rlVsq(d3.M.A, 14, 3.2523, 1) - rlVsq(d3.M.A, 20, 3.2523, 1)) < 2e-3,
      rlVsq(d3.M.A, 14, 3.2523, 1) + ' vs ' + rlVsq(d3.M.A, 20, 3.2523, 1));

  /* --- the control: a metric where nothing happens --- */
  var f = {};
  S.enter(f, { key:'flat', body:'sun', rr:6, p1:20, p2:40 });
  sok('rlMetric flat: no horizon', f.M.H.count === 0, f.M.H.count);
  sok('rlMetric flat: no photon sphere', !isFinite(f.M.ph), f.M.ph);
  sok('rlMetric flat: no ISCO', !isFinite(f.M.isco.r), f.M.isco.r);
  sok('rlMetric flat: no bound orbit, and it says why', !f.M.geo && /sitting still/.test(f.M.why || ''), f.M.why);
  sok('rlMetric flat: A·B is exactly 1', f.M.ab.gap === 0, f.M.ab.gap);
  sok('rlMetric flat: and the plane embeds flat', f.M.emb.z[f.M.emb.z.length - 1] === 0, f.M.zMax);

  /* --- the charged hole: two horizons of the SAME kind --- */
  var q = {};
  S.enter(q, { key:'rn', body:'hole', rr:6, p1:20, p2:40 });
  sok('rlMetric rn: two horizons at 1 ± √(1−Q²)',
      q.M.H.count === 2 && Math.abs(q.M.H.inner - 0.4) < 1e-12 && Math.abs(q.M.H.outer - 1.6) < 1e-12,
      q.M.H.inner + ' , ' + q.M.H.outer);
  sok('rlMetric rn: the static band is open at the far end, unlike de Sitter',
      q.M.band.open, q.M.hi);
  sok('rlMetric rn: charge moves the ISCO inward from 6',
      q.M.isco.r < 6 && q.M.isco.r > 4, q.M.isco.r);

  /* --- what the reader types, including what they type wrong --- */
  var c = {};
  S.enter(c, { key:'custom', srcA:'1 - 2/r + 0.3/r^2', srcB:'1/(1 - 2/r + 0.3/r^2)',
               body:'sun', rr:6, p1:20, p2:40 });
  sok('rlMetric custom: a typed metric compiles and is measured like the rest',
      c.M && c.M.H.count === 2, c.M ? c.M.H.count : 'no metric');
  sok('rlMetric custom: at 1 ± √(1−0.3), computed rather than declared',
      Math.abs(c.M.H.outer - (1 + Math.sqrt(0.7))) < 1e-12, c.M.H.outer);
  sok('rlMetric custom: its orbit conserves E and L too', c.M.geo && c.M.geo.driftE < 1e-8,
      c.M.geo ? c.M.geo.driftE : 'no orbit');
  /* a broken formula must leave the previous picture standing and SAY so —
     §2.13 point 3, and the one behaviour a reader mid-keystroke depends on */
  var before = c.M;
  c.srcA = '1 - 2/(r';
  S.recompute(c);
  sok('rlMetric custom: a half-typed formula does not blank the picture',
      c.M === before, 'the metric was replaced');
  sok('rlMetric custom: and the panel says which box is wrong',
      /g<sub>tt<\/sub>/.test(c.err || ''), c.err);
  c.srcA = '1 - 2/r + 0.3/r^2';
  S.recompute(c);
  sok('rlMetric custom: and typing it correctly again clears the message',
      !c.err && c.M.H.count === 2, c.err);

  /* --- the readout and chip must survive every one of those states --- */
  ['schwarzschild', 'newton', 'rn', 'desitter', 'flat'].forEach(function(k){
    var t = {};
    S.enter(t, { key:k, body:'sun', rr:6, p1:20, p2:40 });
    var html = S.readout(t) + S.chip(t);
    sok('rlMetric ' + k + ': readout and chip carry no NaN, undefined or Infinity',
        !/NaN|undefined|Infinity/.test(html), html.slice(0, 120));
    sok('rlMetric ' + k + ': and the legend names what is drawn',
        S.legend(t).length >= 5, S.legend(t).length);
  });
})();

/* ---- rlHole: the fall, its two clocks, and the divergence of one of them ---
   Programme A item 3, 2026-08-18. The stage became a scenario editor over
   RL_METRICS, so the test drives recompute() on every row — which is the only
   way the metrics that are NOT Schwarzschild get exercised at all, and three
   of the defects below were reachable from no other preset.

   Measured route errors on 2026-08-18, which set every tolerance here:
     route A (rlInfallRun, a quadrature in r) against route B (rlGeoRun, RK4 on
     the second-order geodesic equation), compared a third of the way down:
       five presets at r₀ = 20:  worst 1.9e-12 relative      -> tol 1e-10
       r₀ swept 3 … 150:         worst 1.8e-7  relative      -> tol 1e-5
         (the step is h = τ/24000, so a fall of τ = 2039 is marched at h = 0.085
          and a fall from r₀ = 3 is short and steep — both are the integrator's
          own resolution, not a disagreement about the physics)
     the halving increment measured against the local prediction ln2·√(AB)/A′:
       worst 3.0e-8 relative over the three metrics with a simple pole -> 1e-6
     against the wing's older Schwarzschild-only engine, in SI:
       grInfall  4.2e-12,  grTidal 1.6e-10                   -> 1e-9 / 1e-8

   WHAT THIS SUITE CAUGHT WHEN IT WAS FIRST RUN, all three invisible to
   runtests, auditsides and runall: route B returned NaN on every preset because
   rlGeoRun does not record the step that trips its stop, so a run halted AT the
   comparison radius left nothing to interpolate between — and the panel printed
   the NaN without complaint; the release slider was silently clamped to 58.2
   because the static band stopped where the metric table's scan range did, so
   r₀ = 60 and r₀ = 150 produced the identical proper time; and route B's drift
   in E reached 3e8 when the comparison was made at the probe rather than at a
   radius where a fixed-step march in proper time still means anything. */
(function(){
  var S = STAGES.rlHole;
  var keys = Object.keys(RL_METRICS);

  /* --- every preset a reader can pick --- */
  for(var i = 0; i < keys.length; i++){
    var k = keys[i], row = RL_METRICS[k];
    var st = {};
    S.enter(st, { key:k, body:'hole', r0:20, dec:2 });
    var F = st.F;
    sok('rlHole ' + k + ': the metric compiles and the stage computes', !!F, st.err);
    if(!F) continue;

    /* the horizon count is the table's claim, recomputed as sign changes of A */
    sok('rlHole ' + k + ': finds the horizons its table declares',
        F.H.count === row.rh.length, F.H.count + ' found, ' + row.rh.length + ' declared');

    if(!row.rh.length){
      /* Minkowski: no horizon, and nothing falls. A laboratory that cannot
         report "nothing happens" cannot be trusted when it reports that
         something did. */
      sok('rlHole ' + k + ': has no horizon and nothing falls', !F.hasH && !F.falls, F.falls);
      sok('...and it says why, rather than printing a zero',
          /does not fall inward/.test(F.stop), F.stop);
      continue;
    }

    sok('rlHole ' + k + ': a particle released at r₀ = 20 falls', F.falls, F.stop);
    if(!F.falls) continue;
    sok('rlHole ' + k + ': the proper time to the horizon is finite and positive',
        Number.isFinite(F.tauH) && F.tauH > 0, F.tauH);

    /* THE TWO ROUTES. One integrates dτ/dr and dt/dr from the first integral;
       the other marches the geodesic equation and is told neither E nor the
       first integral. They share no arithmetic. */
    sok('rlHole ' + k + ': route B reaches the comparison radius at all',
        Number.isFinite(F.tauB), 'tauB=' + F.tauB + ' rCmp=' + F.rCmp);
    sok('rlHole ' + k + ': the two routes agree on the proper time to 1e-10',
        Math.abs(F.tauB - F.tauA) < Math.abs(F.tauA) * 1e-10,
        F.tauA + ' vs ' + F.tauB);
    sok('rlHole ' + k + ': and on the coordinate time to 1e-10',
        Math.abs(F.tB - F.tA) < Math.abs(F.tA) * 1e-10, F.tA + ' vs ' + F.tB);
    sok('rlHole ' + k + ': route B conserved E without being told to',
        F.geo.driftE < 1e-9, F.geo.driftE);
    /* the coordinate clock always runs ahead of the proper one, everywhere
       outside a horizon — that is what gravitational time dilation IS, and it
       holds whatever the metric */
    sok('rlHole ' + k + ': the coordinate clock leads the proper clock',
        F.tA > F.tauA, F.tA + ' vs ' + F.tauA);

    /* THE DIVERGENCE: a local prediction with no integral in it, against a
       measurement made of nothing but integrals. */
    sok('rlHole ' + k + ': the horizon has a rate to predict', !!F.rate, F.rate);
    sok('rlHole ' + k + ': twenty halvings all integrate', F.halv && F.halv.steps === 20,
        F.halv && F.halv.steps);
    if(row.vac){
      /* every vacuum metric has A·B = 1, hence a simple pole, hence a genuinely
         divergent coordinate time */
      sok('rlHole ' + k + ' is a vacuum metric, so A·B tends to 1 at the horizon',
          Math.abs(F.rate.P - 1) < 1e-8, F.rate.P);
      sok('rlHole ' + k + ': the pole is simple and the coordinate time diverges',
          F.rate.simple === true, F.rate.pRatio);
      sok('rlHole ' + k + ': the increments never shrink',
          Math.abs(F.halv.settled - 1) < 1e-5, F.halv.settled);
      sok('rlHole ' + k + ': and the measured increment matches ln2·√(AB)/A′ to 1e-6',
          Math.abs(F.halv.dt[19] - F.rate.perHalving) < F.rate.perHalving * 1e-6,
          F.halv.dt[19] + ' vs ' + F.rate.perHalving);
      /* the surface gravity is the same number read another way */
      sok('rlHole ' + k + ': and the rate is 1/2κ, with κ read off A′ and A·B',
          Math.abs(F.rate.perHalving - Math.LN2 / (2 * F.rate.kappa)) < F.rate.perHalving * 1e-9,
          F.rate.kappa);
      sok('rlHole ' + k + ': the tide at the horizon is a finite stretch',
          Number.isFinite(F.tideH) && F.tideH < 0, F.tideH);
    }

    /* the panels have to survive it */
    var html = S.readout(st) + S.chip(st);
    sok('rlHole ' + k + ': readout and chip carry no NaN, undefined or Infinity',
        !/NaN|undefined|Infinity/.test(html), html.slice(0, 140));
    sok('rlHole ' + k + ': and the legend names what is drawn', S.legend(st).length >= 6,
        S.legend(st).length);
  }

  /* --- THE ONE THAT IS NOT A VACUUM SOLUTION. Keep A and flatten B: every
         clock rate, the horizon, the photon sphere and the ISCO are exactly
         where Schwarzschild puts them, and the coordinate time to the horizon
         becomes FINITE. This is the demo the wing gained for it, so it is
         pinned here rather than left to a screenshot. --- */
  (function(){
    var sw = {}, nw = {};
    S.enter(sw, { key:'schwarzschild', body:'hole', r0:20, dec:2 });
    S.enter(nw, { key:'newton', body:'hole', r0:20, dec:2 });
    sok('rlHole: flattening B leaves the horizon exactly where it was',
        Math.abs(nw.F.rh - sw.F.rh) < 1e-9, nw.F.rh + ' vs ' + sw.F.rh);
    sok('...and the photon sphere and the ISCO with it',
        Math.abs(nw.F.ph - sw.F.ph) < 1e-6 && Math.abs(nw.F.isco - sw.F.isco) < 1e-4,
        nw.F.ph + ',' + nw.F.isco + ' vs ' + sw.F.ph + ',' + sw.F.isco);
    sok('...but A·B no longer tends to a nonzero limit there',
        nw.F.rate.P < 1e-5 && Math.abs(nw.F.rate.pRatio - 10) < 0.01, nw.F.rate.P);
    sok('...so the pole is not simple', nw.F.rate.simple === false);
    sok('...the increments fall by 1/√2 each halving instead of staying level',
        Math.abs(nw.F.halv.settled - 1 / Math.SQRT2) < 1e-4, nw.F.halv.settled);
    /* nineteen steps at 1/√2 each is 2^(−9.5) = 1.380e−3, and the measurement
       lands on 1.371e−3. Asserting that RATIO rather than "smaller than a
       thousandth" is both stronger and the right shape: it says the increments
       fall geometrically at the rate an integrable inverse square root implies,
       which is the claim, and the first version of this line failed only
       because 1.371e−3 is a hair above 1e−3. */
    sok('...which means the coordinate time to the horizon converges, at 2^(−19/2)',
        Math.abs(nw.F.halv.dt[19] / nw.F.halv.dt[0] / Math.pow(2, -9.5) - 1) < 0.02,
        nw.F.halv.dt[0] + ' ... ' + nw.F.halv.dt[19]);
    /* Schwarzschild's first increment is measured at a gap of 0.01·r_h, where
       the next term of the expansion about the horizon is still worth about 1%
       — so 2% is the tolerance the measurement supports, and the tight check on
       this quantity is the one against the local prediction above, at 1e-6. */
    sok('...while Schwarzschild adds the SAME amount at the twentieth halving as the first',
        Math.abs(sw.F.halv.dt[19] / sw.F.halv.dt[0] - 1) < 0.02,
        sw.F.halv.dt[0] + ' ... ' + sw.F.halv.dt[19]);
    sok('...and the proper time is barely touched by any of it',
        Math.abs(nw.F.tauH / sw.F.tauH - 1) < 0.12, nw.F.tauH + ' vs ' + sw.F.tauH);
    /* and the tide gives that metric away: A·B → 0 makes the curvature diverge,
       so its "horizon" is a naked singularity rather than a smooth surface */
    sok('...but its tide at r_h is unbounded, so it is not a horizon at all',
        !Number.isFinite(nw.F.tideH) && Number.isFinite(sw.F.tideH), nw.F.tideH);
    sok('...and the readout says so rather than printing a dash',
        /unbounded/.test(S.readout(nw)), S.readout(nw).slice(0, 80));
  })();

  /* --- the release radius, swept. The clamp bug lived here: two radii 90 apart
         gave the identical proper time because the static band stopped where
         the table's scan range did. --- */
  (function(){
    var rs = [3, 5, 10, 20, 60, 150], prev = 0;
    for(var i = 0; i < rs.length; i++){
      var st = {};
      S.enter(st, { key:'schwarzschild', body:'hole', r0:rs[i], dec:2 });
      var F = st.F;
      sok('rlHole falls from r₀ = ' + rs[i], F.falls && Number.isFinite(F.tauH), F.stop);
      sok('rlHole r₀ = ' + rs[i] + ': the release radius is not silently moved',
          Math.abs(F.r0 - rs[i]) < 1e-9, F.r0 + ' vs ' + rs[i]);
      sok('rlHole r₀ = ' + rs[i] + ': a longer drop takes longer', F.tauH > prev,
          F.tauH + ' after ' + prev);
      sok('rlHole r₀ = ' + rs[i] + ': both routes still agree to 1e-5',
          Math.abs(F.tauB - F.tauA) < Math.abs(F.tauA) * 1e-5, F.tauA + ' vs ' + F.tauB);
      prev = F.tauH;
    }
  })();

  /* --- the probe, driven all the way down. Each decade must cost the SAME
         amount of coordinate time, which is the divergence stated as a number
         the panel can be held to. --- */
  (function(){
    var st4 = {}, st8 = {}, st12 = {};
    S.enter(st4, { key:'schwarzschild', body:'hole', r0:20, dec:4 });
    S.enter(st8, { key:'schwarzschild', body:'hole', r0:20, dec:8 });
    S.enter(st12, { key:'schwarzschild', body:'hole', r0:20, dec:12 });
    /* THE TOLERANCE HERE IS 5e-4, AND THE REASON IS THE POINT. This route gets
       the per-decade cost by SUBTRACTING two long integrals that share most of
       their path, and the difference then inherits both of their quadrature
       errors while the shared part cancels out of the answer. Measured
       2026-08-18: 4.6052481 and 4.6051279 against 2·ln10 = 4.6051702, so about
       1e-4 — and the two differ mainly because the log segment's step size
       depends on how many decades it spans, so the coarser run carries the
       larger error into a difference that has no room for it.

       rlInfallHalvings exists precisely to avoid that, integrating each
       increment over its own narrow interval instead, and it hits the same
       prediction to 2e-8 — four orders better, asserted above. That contrast is
       why the panel quotes the halvings and not this subtraction. */
    var per4to8 = (st8.F.tP - st4.F.tP) / 4, per8to12 = (st12.F.tP - st8.F.tP) / 4;
    sok('rlHole: each decade closer costs the same coordinate time',
        Math.abs(per4to8 - per8to12) < 5e-4, per4to8 + ' vs ' + per8to12);
    sok('...and that cost is 2·ln10, the rate predicted from A′ alone',
        Math.abs(per8to12 - 2 * Math.log(10)) < 5e-4, per8to12);
    sok('...while the dedicated halving integrals hit the same rate 4 orders better',
        Math.abs(st12.F.halv.dt[19] - 2 * Math.LN2) < 2 * Math.LN2 * 1e-6,
        st12.F.halv.dt[19] + ' vs ' + 2 * Math.LN2);
    /* while the proper time to the same radii has essentially stopped moving */
    sok('...while the proper time has converged to five figures by then',
        Math.abs(st12.F.tauP - st4.F.tauP) < 1e-3, st4.F.tauP + ' -> ' + st12.F.tauP);
    sok('...and the probe never leaves the static side of the horizon',
        st12.F.rProbe > st12.F.rh, st12.F.rProbe + ' vs ' + st12.F.rh);
  })();

  /* --- Schwarzschild–de Sitter beyond the maximum of A. Released at rest out
         there, the cosmological term carries the particle OUT. Schwarzschild
         cannot produce this case, so only a preset sweep finds it. --- */
  (function(){
    [8, 15, 21].forEach(function(r){
      var st = {};
      S.enter(st, { key:'desitter', body:'hole', r0:r, dec:2 });
      sok('rlHole de Sitter falls inward from r₀ = ' + r, st.F.falls, st.F.stop);
    });
    [25, 40].forEach(function(r){
      var st = {};
      S.enter(st, { key:'desitter', body:'hole', r0:r, dec:2 });
      sok('rlHole de Sitter refuses to fall from r₀ = ' + r + ', beyond the maximum of A',
          !st.F.falls && /does not fall inward/.test(st.F.stop), st.F.stop);
      sok('...and the readout says so instead of printing a time',
          !/NaN|undefined|Infinity/.test(S.readout(st) + S.chip(st)), 'unclean');
    });
    /* the turnover is where A′ changes sign, and it is between those two sets */
    var A = rlFnR(RL_METRICS.desitter.A);
    sok('rlHole: and the turnover is a sign change of A′ between 21 and 25',
        rlDeriv(A, 21) > 0 && rlDeriv(A, 25) < 0, rlDeriv(A, 21) + ' , ' + rlDeriv(A, 25));
  })();

  /* --- the reader's own metric, and a broken box --- */
  (function(){
    var st = {};
    S.enter(st, { key:'custom', srcA:'1 - 2/r + 0.3/r^2', srcB:'1/(1 - 2/r + 0.3/r^2)',
                  body:'hole', r0:20, dec:2 });
    sok('rlHole accepts a typed metric and falls in it', st.F.falls, st.F.stop);
    sok('rlHole typed metric: its horizon is located, not assumed',
        Math.abs(st.F.rh - (1 + Math.sqrt(1 - 0.3))) < 1e-8, st.F.rh);
    sok('rlHole typed metric: both routes still agree to 1e-5',
        Math.abs(st.F.tauB - st.F.tauA) < Math.abs(st.F.tauA) * 1e-5,
        st.F.tauA + ' vs ' + st.F.tauB);
    sok('rlHole typed metric: it is a vacuum form, so the pole is simple',
        st.F.rate.simple === true, st.F.rate.pRatio);
    var before = st.F.tauH;
    st.srcA = '1 - 2/(r'; st.cacheKey = '';
    S.recompute(st);
    sok('rlHole survives an unbalanced bracket and says so', !!st.err, st.err);
    sok('...and keeps the previous metric rather than blanking the picture',
        st.F.tauH === before, st.F.tauH + ' vs ' + before);
  })();

  /* --- the SI bridge: the same fall in seconds, against the wing's older
         Schwarzschild-only engine, which knows nothing about A and B. Every
         body, because the conversion is where a factor of c gets dropped. --- */
  (function(){
    Object.keys(GR_BODIES).forEach(function(b){
      var st = {};
      S.enter(st, { key:'schwarzschild', body:b, r0:40, dec:2 });
      var U = S.si(st), GM = GR_BODIES[b].GM, rs = grRs(GM);
      var oldTau = grInfall(GM, 20 * rs, rs).tau, newTau = st.F.tauH * U.sec;
      sok('rlHole as ' + b + ': the fall in seconds matches grInfall to 1e-9',
          Math.abs(newTau - oldTau) < oldTau * 1e-9, newTau + ' vs ' + oldTau);
      var oldTide = grTidal(GM, rs, 2), newTide = Math.abs(st.F.tideH) * U.tide * 2;
      sok('rlHole as ' + b + ': the tide across 2 m matches grTidal to 1e-8',
          Math.abs(newTide - oldTide) < oldTide * 1e-8, newTide + ' vs ' + oldTide);
    });
  })();

  /* --- THE CORRUPT CONTROL. A gate never seen to fail is not known to work, so
         the comparison above is run once more against a route B started from
         the WRONG release radius. If that still passes at 1e-10, the assertion
         is not comparing anything. --- */
  (function(){
    var st = {};
    S.enter(st, { key:'schwarzschild', body:'hole', r0:20, dec:2 });
    var F = st.F;
    var g = rlGeoRun(F.A, F.B, rlGeoInit(F.A, F.B, F.r0 * 1.01, rlInfallE(F.A, F.r0 * 1.01), 0, 1, -1),
                     F.tauH / 24000, 60000, { rStop: F.rEnd + (F.r0 - F.rEnd) * 0.20, rEsc: F.r0 * 4 });
    var i = 1; while(i < g.n && g.r[i] > F.rCmp) i++;
    var f = (g.r[i - 1] - F.rCmp) / (g.r[i - 1] - g.r[i]);
    var bad = g.tau[i - 1] + f * (g.tau[i] - g.tau[i - 1]);
    sok('rlHole control: a route B dropped from 1% higher does NOT agree to 1e-10',
        Math.abs(bad - F.tauA) > Math.abs(F.tauA) * 1e-10, bad + ' vs ' + F.tauA);
  })();
})();

/* ---- rlLens: light through every metric the picker offers ------------------
   Programme A item 4, 2026-08-18. The stage's own helpers, driven directly,
   over every option in the segmented control — five presets, a typed A and B,
   and a typed mass profile — because auditsides reads what the panels RENDER
   and this asks whether the numbers behind them agree.

   Route A is rlBendRay marching the geodesic equation; route B is rlDeflect's
   quadrature. They are compared at the SAME radius: for an asymptotically flat
   metric the panel's headline deflection is the one to infinity, and route A
   cannot start there, so F.Bat is the quadrature stopped where route A starts.
   Comparing F.B2.defl with F.A2.defl instead would be comparing two different
   quantities that happen to be close — 0.4526 against 0.4409 on Schwarzschild
   at b = 12, a 2.6% "disagreement" that is entirely the finite observer.

   Measured route errors on 2026-08-18, which set the tolerances below:
     two routes, asymptotically flat presets:   4.6e-12 .. 1.5e-11  -> 1e-9
     two routes, Schwarzschild-de Sitter:       3.4e-8  (rObs finite, so route
                 A's fixed step covers a much longer path)          -> 1e-6
     b_c located vs 3 sqrt 3:                   9e-16               -> 1e-12
     gamma in the weak field vs 1:              3.9e-6              -> 1e-4
     radians per decade vs ln10/lambda:         1.7e-5 .. 6.6e-5    -> 2e-4  */
(function(){
  var S = STAGES.rlLens;
  function mkst(o){ var st = {}; S.enter(st, o || {}); return st; }
  var KEYS = Object.keys(RL_METRICS).concat(['custom', 'mass']);

  /* --- every option produces a world, and the panels never print a hole --- */
  KEYS.forEach(function(k){
    var st = mkst({ key:k, b:12 });
    sok('rlLens ' + k + ': recompute produced a state', !!st.F, st.err);
    if(!st.F) return;
    var h = S.readout(st) + S.chip(st);
    sok('rlLens ' + k + ': no NaN, undefined or Infinity reaches the panels',
        !/NaN|undefined|Infinity/.test(h), (h.match(/NaN|undefined|Infinity/) || [''])[0]);
  });

  /* --- THE TWO ROUTES, over every option and across the slider ------------ */
  KEYS.forEach(function(k){
    var st = mkst({ key:k, b:12 }), F = st.F;
    if(!F) return;
    var tol = F.far ? 1e-9 : 1e-6;
    [F.bSlideLo, 0.5 * (F.bSlideLo + F.bSlideHi), F.bSlideHi].forEach(function(bb){
      st.b = bb; S.recompute(st); F = st.F;
      if(!Number.isFinite(F.A2.defl) || !Number.isFinite(F.Bat)) return;   // captured, and named
      var gap = Math.abs(F.A2.defl - F.Bat);
      /* the gross is pi: a deflection is a small difference of two swept
         angles, and in flat space both routes vanish together, so a relative
         test alone divides by round-off. This mirrors what the panel prints —
         fmtAgreeGross(a, b, pi) passes below 1e-9 of the gross — and the first
         version bracketed it as tol*max(...) instead of max(tol*..., ...),
         which made the floor 3e-18 and failed Minkowski on its own round-off. */
      sok('rlLens ' + k + ' at b = ' + fmtSig(bb, 5) + ': the two routes agree',
          gap < Math.max(tol * Math.abs(F.Bat), 1e-9 * Math.PI),
          'quad ' + F.Bat + ' geo ' + F.A2.defl + ' gap ' + gap);
      sok('rlLens ' + k + ' at b = ' + fmtSig(bb, 5) + ': E drifts less than 1e-6 along route A',
          !(F.A2.driftE > 1e-6), F.A2.driftE);
    });
  });

  /* --- b_c AND lambda, located by the stage, against closed forms --------- */
  (function(){
    var st = mkst({ key:'schwarzschild', b:12 });
    sok('rlLens locates b_c = 3 sqrt 3 on Schwarzschild',
        Math.abs(st.F.crit.b - 3 * Math.sqrt(3)) < 1e-12 * 3 * Math.sqrt(3), st.F.crit.b);
    sok('  and lambda = 1 there', Math.abs(st.F.crit.lam - 1) < 1e-9, st.F.crit.lam);
    var sn = mkst({ key:'newton', b:12 });
    sok('flattening B leaves b_c untouched — it depends on A alone',
        Math.abs(sn.F.crit.b - st.F.crit.b) < 1e-14 * st.F.crit.b, sn.F.crit.b);
    sok('  but lambda becomes sqrt 3 — the winding rate carries sqrt(A B)',
        Math.abs(sn.F.crit.lam - Math.sqrt(3)) < 1e-9, sn.F.crit.lam);
  })();

  /* --- THE FACTOR OF TWO, measured where it is defined -------------------- */
  (function(){
    var st = mkst({ key:'schwarzschild', b:12 });
    sok('rlLens measures gamma = 1 in the weak field on Schwarzschild',
        Math.abs(st.F.gamFar - 1) < 1e-4, st.F.gamFar);
    sok('  and the ratio at b = 12 is NOT 1 — the strong field is not the limit',
        Math.abs(st.F.gam - 1) > 0.01, st.F.gam);
    var sn = mkst({ key:'newton', b:12 });
    sok('the only-time-curved metric measures gamma = 0 exactly',
        sn.F.gamFar === 0 || Math.abs(sn.F.gamFar) < 1e-12, sn.F.gamFar);
    sok('  so it bends light by exactly half',
        Math.abs(sn.F.B2.defl / st.F.B2.defl - 0.5) < 0.05,
        sn.F.B2.defl + ' vs ' + st.F.B2.defl);
    /* de Sitter has no asymptotic region, so gamma is REFUSED rather than
       reported as the 4.31 the finite-observer ratio comes to */
    var sd = mkst({ key:'desitter', b:12 });
    sok('Schwarzschild-de Sitter is not asymptotically flat and says so', !sd.F.far);
    sok('  so no gamma is computed for it', !Number.isFinite(sd.F.gamFar));
    sok('  and the panel does not print the word gamma as a number',
        !/γ, the PPN[\s\S]{0,80}[0-9]/.test(S.readout(sd)));
  })();

  /* --- THE WINDING RATE: local prediction against global measurement ------ */
  KEYS.forEach(function(k){
    var st = mkst({ key:k, b:12 }), F = st.F;
    if(!F || !F.wind) return;
    sok('rlLens ' + k + ': the measured radians per decade land on ln10/lambda',
        Number.isFinite(F.wind.last) && Math.abs(F.wind.last - F.wind.pred) < 2e-4 * F.wind.pred,
        'measured ' + F.wind.last + ' predicted ' + F.wind.pred);
    sok('rlLens ' + k + ': the increments never shrink, so the deflection has no limit',
        F.wind.inc.every(function(v){ return v > 0.9 * F.wind.pred; }), F.wind.inc.join(', '));
  });

  /* --- THE CONICAL HALO, against a closed form the stage does not own ----- */
  (function(){
    var st = mkst({ key:'mass', srcM:'r/12', b:12 }), F = st.F;
    var closed = rlConeDefl(1 / 12);
    [F.bSlideLo, 20, F.bSlideHi].forEach(function(bb){
      st.b = bb; S.recompute(st);
      sok('a halo M = r/12 bends b = ' + fmtSig(bb, 4) + ' by pi(1/sqrt(1-2k) - 1)',
          Math.abs(st.F.B2.defl - closed) < 1e-10 * closed, st.F.B2.defl + ' vs ' + closed);
    });
    sok('  and the measured far-field slope is 0 — no dependence on b at all',
        Math.abs(F.slopeFar) < 1e-6, F.slopeFar);
    sok('  while Schwarzschild measures -1',
        Math.abs(mkst({ key:'schwarzschild', b:12 }).F.slopeFar + 1) < 1e-3);
    sok('  and the halo bends light with g_rr alone, so no gamma exists', F.timeless);
  })();

  /* --- BIRKHOFF, through the stage's own accessor ------------------------- */
  (function(){
    var U = mkst({ key:'mass', srcM:'min(1, (r/8)^3)', b:20 });
    var P = mkst({ key:'mass', srcM:'1', b:20 });
    sok('outside a uniform sphere the deflection is that of a point mass, exactly',
        Math.abs(U.F.B2.defl - P.F.B2.defl) < 1e-13 * P.F.B2.defl,
        U.F.B2.defl + ' vs ' + P.F.B2.defl);
    U.b = 6; S.recompute(U); P.b = 6; S.recompute(P);
    sok('  and a ray passing INSIDE it is not', Math.abs(U.F.B2.defl - P.F.B2.defl) > 0.05 * P.F.B2.defl,
        U.F.B2.defl + ' vs ' + P.F.B2.defl);
  })();

  /* --- MINKOWSKI, the control that must report that nothing happens ------- */
  (function(){
    var st = mkst({ key:'flat', b:12 });
    sok('flat space turns the ray at exactly b', Math.abs(st.F.B2.r0 - 12) < 1e-12, st.F.B2.r0);
    sok('  and bends it by nothing', Math.abs(st.F.B2.defl) < 1e-11, st.F.B2.defl);
    sok('  and has no photon sphere', !st.F.crit.has);
    sok('  and the chip says nothing bends rather than claiming space did it',
        /nothing bends/.test(S.chip(st)), S.chip(st));
  })();

  /* --- A BAD FORMULA LEAVES THE PREVIOUS WORLD STANDING ------------------- */
  (function(){
    var st = mkst({ key:'custom', b:12 });
    var before = st.F.B2.defl;
    st.srcA = '1 +'; st.mKey = ''; S.recompute(st);
    sok('a malformed A leaves the previous metric on screen', st.F.B2.defl === before, st.F.B2.defl);
    sok('  and says what went wrong', /not a formula/.test(st.err), st.err);
    var sm = mkst({ key:'mass', b:12 });
    var beforeM = sm.F.B2.defl;
    sm.srcM = 'wibble('; sm.mKey = ''; S.recompute(sm);
    sok('a malformed M(r) does the same', sm.F.B2.defl === beforeM && /not a formula/.test(sm.err), sm.err);
  })();

  /* --- THE CORRUPT CONTROL. A gate never seen to fail is not known to work,
         so the two-route comparison above is run once more against a route A
         launched with the WRONG impact parameter. If that still passes, the
         assertion is not comparing anything. --- */
  (function(){
    var st = mkst({ key:'schwarzschild', b:12 }), F = st.F;
    var bad = rlBendRay(F.A, F.B, 12.001, F.rA, F.rA / 3000, 24000, { rStop: F.rIn * 1.0005 });
    sok('rlLens control: a route A launched at b = 12.001 does NOT agree to 1e-9',
        Math.abs(bad.defl - F.Bat) > 1e-9 * Math.abs(F.Bat), bad.defl + ' vs ' + F.Bat);
  })();
})();
/* ---- rlWave: every binary the picker offers, and the mass read back out ----
   Programme A item 5, 2026-08-18. The stage's own arithmetic is the cache in
   recompute(): route A's track, the five-point derivative on it, the recovered
   chirp mass, the least-squares slope, and the quadrupole waveform. None of
   that is visible to runtests (module 68c is far past the 21–49 window) and
   auditsides only reads what the panels print.

   Tolerances below are the route's own measured error at frac = 0.004:
     recovered chirp mass, worst over the track   6.5e-8  -> 1e-6
     waveform amplitude against the closed form   1e-8    -> 1e-6
     slope of log ḟ against log f                 3e-8    -> 1e-5      */
(function(){
  var S = STAGES.rlWave;
  function mkst(o){ var st = {}; S.enter(st, o || {}); st.t = 0; return st; }
  var KEYS = Object.keys(GW_BINARIES);

  /* --- every preset produces a binary, and the panels never print a hole -- */
  KEYS.forEach(function(k){
    var st = mkst({ key:k });
    sok('rlWave ' + k + ': recompute produced a state', !!st.O && st.O.ok, st.O && st.O.why);
    if(!st.O || !st.O.ok) return;
    var h = S.readout(st) + S.chip(st);
    sok('rlWave ' + k + ': no NaN, undefined or Infinity reaches the panels',
        !/NaN|undefined|Infinity/.test(h), (h.match(/NaN|undefined|Infinity/) || [''])[0]);
    /* THE ACCEPTANCE TEST, driven through the stage rather than the engine:
       the chirp mass measured off route A's track against the algebraic one */
    sok('rlWave ' + k + ': the chirp mass read off the track matches the masses',
        st.O.fd.ok && st.O.fd.worst < 1e-6, st.O.fd.worst);
    sok('rlWave ' + k + ': and the sweep rate agrees with the closed form now',
        Math.abs(st.O.fdotMeas - st.O.fdotB) < 1e-6 * st.O.fdotB,
        st.O.fdotMeas + ' vs ' + st.O.fdotB);
    sok('rlWave ' + k + ': the measured log–log slope is 11/3',
        Math.abs(st.O.slope - 11 / 3) < 1e-5, st.O.slope);
    /* the waveform, built from the two bodies' quadrupole moment */
    sok('rlWave ' + k + ': the strain measured off the quadrupole matches 4Mc^(5/3)(πf)^(2/3)/D',
        Math.abs(st.O.wave.ampP - st.O.hClosed) < 1e-6 * st.O.hClosed,
        st.O.wave.ampP + ' vs ' + st.O.hClosed);
    sok('rlWave ' + k + ': the wave frequency counted off it is twice the orbital one',
        Math.abs(st.O.wave.fMeas - st.O.fgw) < 1e-6 * st.O.fgw,
        st.O.wave.fMeas + ' vs ' + st.O.fgw);
  });

  /* --- the presets' own numbers, against what the stage derives ----------- */
  (function(){
    var st = mkst({ key:'gw150914' });
    sok('rlWave gw150914 opens at 35 Hz', Math.abs(st.O.fgw - 35) < 1e-9, st.O.fgw);
    sok('  with 0.1833 s to merger', Math.abs(st.O.tc - 0.183308) < 1e-4, st.O.tc);
    var p = mkst({ key:'psr1913' });
    sok('rlWave psr1913 opens at its measured orbital period',
        Math.abs(gwPeriodOf(p.O.M, p.O.a) - 0.322997448918 * 86400) < 1e-6,
        gwPeriodOf(p.O.M, p.O.a));
    sok('  and its circular merger time is about 1.6 Gyr',
        p.O.tc / (1e9 * 365.25 * 86400) > 1.4 && p.O.tc / (1e9 * 365.25 * 86400) < 1.9,
        p.O.tc / (1e9 * 365.25 * 86400));
    /* THE CYCLE COUNT IS A QUADRATURE, so every preset gets one — including a
       binary pulsar with 3×10¹¹ orbits left, which the first version of this
       stage refused. It is a second route to ∫f dt and it has to agree. */
    sok('  the phase is integrated even for a binary pulsar', p.O.run.phase);
    sok('  and its 6×10¹² cycles match ∫f dt in closed form',
        Math.abs(p.O.run.cycles - p.O.cyclesB) < 1e-6 * p.O.cyclesB,
        p.O.run.cycles + ' vs ' + p.O.cyclesB);
    var g = mkst({ key:'gw150914' });
    sok('  GW150914 agrees too', Math.abs(g.O.run.cycles - g.O.cyclesB) < 1e-6 * g.O.cyclesB,
        g.O.run.cycles + ' vs ' + g.O.cyclesB);
    /* GW170817 is the preset ./auditsides.ps1 caught: under the old
       orbit-period step bound its integrated count hit the step limit and came
       out 571 cycles short of ∫f dt while the panel printed the comparison as
       if it were complete. */
    var b = mkst({ key:'gw170817' });
    sok('  and so does GW170817, which the step bound used to truncate',
        Math.abs(b.O.run.cycles - b.O.cyclesB) < 1e-6 * b.O.cyclesB,
        b.O.run.cycles + ' vs ' + b.O.cyclesB);
  })();

  /* --- THE DEGENERACY, through the stage's own twin ----------------------- */
  (function(){
    var st = mkst({ key:'custom', m1:60, m2:15, aKm:1400, dMpc:100 });
    var tw = st.O.twin;
    sok('rlWave: the twin the stage draws has the same chirp mass',
        Math.abs(gwChirpMassS(tw.m1, tw.m2) - st.O.Mc) < 1e-13 * st.O.Mc,
        gwSolar(gwChirpMassS(tw.m1, tw.m2)) + ' vs ' + gwSolar(st.O.Mc));
    sok('  a different total mass', Math.abs(tw.M - st.O.M) > 0.1 * st.O.M,
        gwSolar(tw.M) + ' vs ' + gwSolar(st.O.M));
    sok('  and therefore a different ISCO frequency, which is the whole difference',
        Math.abs(gwFgwIsco(tw.M) / st.O.fIsco - 1) > 0.1, gwFgwIsco(tw.M) + ' vs ' + st.O.fIsco);
  })();

  /* --- THE INCLINATION PATTERN, at the ends of its own slider ------------- */
  (function(){
    [0, 30, 60, 90].forEach(function(deg){
      var st = mkst({ key:'gw150914', inc:deg });
      var want = st.O.hClosed * gwPatternP(deg * Math.PI / 180);
      sok('rlWave at ' + deg + '°: h₊ follows (1+cos²ι)/2',
          Math.abs(st.O.wave.ampP - want) < 1e-6 * st.O.hClosed, st.O.wave.ampP + ' vs ' + want);
      var wantC = st.O.hClosed * gwPatternC(deg * Math.PI / 180);
      sok('rlWave at ' + deg + '°: h× follows cos ι',
          Math.abs(st.O.wave.ampC - wantC) < 1e-6 * st.O.hClosed, st.O.wave.ampC + ' vs ' + wantC);
    });
    var e = mkst({ key:'gw150914', inc:90 });
    sok('rlWave edge-on: the cross polarisation is gone but for cos(π/2)',
        e.O.wave.ampC < 1e-15 * e.O.wave.ampP, e.O.wave.ampC / e.O.wave.ampP);
  })();

  /* --- THE ENDS OF THE SEPARATION SLIDER, which is where the defects are --
         The slider runs from 10^1.5 km to 10^9 km and a typed value may leave
         it. Inside the ISCO there is no inspiral, and the stage has to say so
         rather than integrate one. --- */
  (function(){
    var tight = mkst({ key:'custom', m1:35.6, m2:30.6, aKm:100, dMpc:440 });
    sok('rlWave inside the ISCO: no inspiral is claimed', !tight.O.ok);
    sok('  and the panel says what is wrong instead of printing a hole',
        /innermost stable/.test(tight.O.why) && !/NaN|undefined|Infinity/.test(S.readout(tight)),
        tight.O.why);
    sok('  and the chip does not pretend either', /inside the ISCO/.test(S.chip(tight)), S.chip(tight));
    var wide = mkst({ key:'custom', m1:35.6, m2:30.6, aKm:1e9, dMpc:440 });
    sok('rlWave at the far end of the slider: still a binary',
        wide.O.ok && wide.O.fd.ok && wide.O.fd.worst < 1e-6, wide.O.fd.worst);
    sok('  and the panels stay clean over 27 decades of inspiral',
        !/NaN|undefined|Infinity/.test(S.readout(wide) + S.chip(wide)));
    /* a mass typed past the slider's top — the reader may, and the physics
       does not stop at 100 M☉ */
    var big = mkst({ key:'custom', m1:1e6, m2:1e6, aKm:1e8, dMpc:1000 });
    sok('rlWave with two million-solar-mass holes: the chirp mass still comes back',
        big.O.ok && big.O.fd.worst < 1e-6, big.O.fd.worst);
  })();

  /* --- THE PICKER AND THE SLIDERS CANNOT DISAGREE -------------------------
         The numbers are held once, on the state, and the preset only loads
         them — so a preset selected and a preset typed must produce the same
         binary to the last bit. --- */
  (function(){
    var a = mkst({ key:'gw170817' });
    var b = mkst({ key:'custom', m1:a.m1, m2:a.m2, aKm:Math.pow(10, a.la), dMpc:Math.pow(10, a.ld) });
    sok('rlWave: a preset and the same numbers typed give the same frequency',
        Math.abs(a.O.fgw - b.O.fgw) < 1e-12 * a.O.fgw, a.O.fgw + ' vs ' + b.O.fgw);
    sok('  and the same strain', Math.abs(a.O.wave.ampP - b.O.wave.ampP) < 1e-12 * a.O.wave.ampP);
    sok('  but a different name in the readout', /GW170817/.test(S.readout(a)) &&
        /your own binary/.test(S.readout(b)));
  })();

  /* --- THE CORRUPT CONTROL. A two-route check that has never been seen to
         fail is not known to compare anything: the recovered chirp mass is
         recomputed here from a track integrated with the WRONG coefficient in
         ȧ (63/5 instead of 64/5, a 1.6% error), and it must NOT agree. --- */
  (function(){
    var st = mkst({ key:'gw150914' });
    var m1 = st.O.m1, m2 = st.O.m2, M = st.O.M, aEnd = st.O.aI;
    var ts = [0], as = [st.O.a], a = st.O.a, t = 0, n = 0;
    var F = function(x){ return -63 / 5 * m1 * m2 * M / (x * x * x); };
    while(a > aEnd && n < 40000){
      var h = 0.004 * a / Math.abs(F(a));
      var k1 = F(a), k2 = F(a + h / 2 * k1), k3 = F(a + h / 2 * k2), k4 = F(a + h * k3);
      a += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); t += h; n++;
      if(a <= aEnd) break;
      ts.push(t); as.push(a);
    }
    var fs = new Float64Array(as.length);
    for(var i = 0; i < as.length; i++) fs[i] = gwFgwOf(M, as[i]);
    var bad = gwMcFromFdot(fs[3], gwLagrangeD1(Float64Array.from(ts), fs, 3, 2));
    sok('rlWave control: a track integrated with 63/5 does NOT return the chirp mass',
        Math.abs(bad - st.O.Mc) > 1e-3 * st.O.Mc, gwSolar(bad) + ' vs ' + gwSolar(st.O.Mc));
  })();
})();

/* ---- rlDecay: the eccentric orbit, and the one comparison against nature ---
   Programme A item 5, 2026-08-18. The stage's own arithmetic is the pair of
   routes to the orbit-averaged power and the pair of routes to the period
   decay, plus Peters' coupled decay integrated against his closed-form a(e).
   Tolerances are the routes' own measured errors:
     ⟨P⟩ quadrature vs closed form   1e-12 at every e reachable -> 1e-9
     Ṗ two routes                    the same quadrature        -> 1e-9
     (a, e) track vs closed form     1e-9                       -> 1e-7      */
(function(){
  var S = STAGES.rlDecay;
  function mkst(o){ var st = {}; S.enter(st, o || {}); st.t = 0; return st; }
  var KEYS = ['psr1913', 'j0737', 'hmcnc', 'sunearth'];

  KEYS.forEach(function(k){
    var st = mkst({ key:k });
    sok('rlDecay ' + k + ': recompute produced a state', !!st.O && st.O.ok, st.O && st.O.why);
    if(!st.O || !st.O.ok) return;
    var h = S.readout(st) + S.chip(st);
    sok('rlDecay ' + k + ': no NaN, undefined or Infinity reaches the panels',
        !/NaN|undefined|Infinity/.test(h), (h.match(/NaN|undefined|Infinity/) || [''])[0]);
    sok('rlDecay ' + k + ': the orbit integral and Peters\' F(e) agree',
        Math.abs(st.O.avg.enh - st.O.enhB) < 1e-9 * st.O.enhB,
        st.O.avg.enh + ' vs ' + st.O.enhB);
    sok('rlDecay ' + k + ': and so do the two routes to Ṗ',
        Math.abs(st.O.pdotA - st.O.pdotB) < 1e-9 * Math.abs(st.O.pdotB),
        st.O.pdotA + ' vs ' + st.O.pdotB);
  });

  /* --- THE MEASUREMENT. Two systems have a published decay, and the panel's
         prediction has to land on it. This is the only assertion in the suite
         whose right-hand side came from a telescope. --- */
  (function(){
    var ht = mkst({ key:'psr1913' });
    sok('rlDecay: Hulse–Taylor\'s predicted decay is −2.402e-12 s/s',
        Math.abs(ht.O.pdotB * 1e12 + 2.4021) < 0.002, ht.O.pdotB);
    sok('  and the observed −2.398e-12 is within 0.2% of it',
        Math.abs(ht.O.obs / ht.O.pdotB - 1) < 0.002, ht.O.obs / ht.O.pdotB);
    sok('  its eccentricity multiplies the power by 11.857',
        Math.abs(ht.O.avg.enh - 11.8568) < 1e-3, ht.O.avg.enh);
    /* WITHOUT the eccentricity the same panel would be out by that factor —
       the row that shows F(e) is load-bearing rather than decorative */
    var round = mkst({ key:'custom', m1:1.438, m2:1.390, pd:0.322997448918, ecc:0 });
    sok('  and a circular calculation of the same orbit is 11.86 times too small',
        Math.abs(round.O.pdotB * ht.O.enhB / ht.O.pdotB - 1) < 1e-9,
        round.O.pdotB + ' vs ' + ht.O.pdotB);
    var dp = mkst({ key:'j0737' });
    sok('rlDecay: the double pulsar\'s predicted decay is −1.2478e-12 s/s',
        Math.abs(dp.O.pdotB * 1e12 + 1.24781) < 2e-4, dp.O.pdotB);
    sok('  and the observed value is within 0.01% of it',
        Math.abs(dp.O.obs / dp.O.pdotB - 1) < 1e-4, dp.O.obs / dp.O.pdotB);
    sok('  with F(e) only 1.05, so the enhancement is not carrying this one',
        Math.abs(dp.O.enhB - 1.0515) < 1e-3, dp.O.enhB);
  })();

  /* --- THE ENDS OF THE ECCENTRICITY SLIDER, which is where a formula with
         (1−e²)^(−7/2) in it will fail first --- */
  (function(){
    [0, 0.3, 0.617134, 0.9, 0.95].forEach(function(e){
      var st = mkst({ key:'custom', m1:1.4, m2:1.4, pd:0.1, ecc:e });
      sok('rlDecay at e = ' + e + ': the two routes to ⟨P⟩ still agree',
          Math.abs(st.O.avg.enh - st.O.enhB) < 1e-9 * st.O.enhB,
          st.O.avg.enh + ' vs ' + st.O.enhB);
      sok('rlDecay at e = ' + e + ': the panels stay clean',
          !/NaN|undefined|Infinity/.test(S.readout(st) + S.chip(st)));
    });
    var c = mkst({ key:'custom', m1:1.4, m2:1.4, pd:0.1, ecc:0 });
    sok('rlDecay: a circular orbit gets F = 1 exactly from the quadrature',
        Math.abs(c.O.avg.enh - 1) < 1e-12, c.O.avg.enh);
    sok('  and the readout says there is nothing to circularise rather than a number',
        /nothing to compare/.test(S.readout(c)), 'no such row');
    var hot = mkst({ key:'custom', m1:1.4, m2:1.4, pd:0.1, ecc:0.9 });
    sok('rlDecay at e = 0.9: the power at pericentre is 4.7e7 times that at apocentre',
        Math.abs(hot.O.pPeri / hot.O.pApo / 4.7046e7 - 1) < 1e-3, hot.O.pPeri / hot.O.pApo);
    sok('  and eccentricity brings the merger forward by more than a hundredfold',
        hot.O.tMergeCirc / hot.O.run.tMerge > 100, hot.O.tMergeCirc / hot.O.run.tMerge);
  })();

  /* --- THE DECAY ITSELF: integrated against Peters' closed-form trajectory -- */
  (function(){
    var st = mkst({ key:'psr1913' });
    sok('rlDecay: the integrated (a, e) track lies on Peters\' closed form',
        st.O.aeGap < 1e-7, st.O.aeGap);
    sok('  Hulse–Taylor merges in about 300 million years',
        st.O.run.tMerge / (1e6 * 365.25 * 86400) > 250 &&
        st.O.run.tMerge / (1e6 * 365.25 * 86400) < 350,
        st.O.run.tMerge / (1e6 * 365.25 * 86400));
    sok('  and it is round by the time it reaches 10 Hz',
        st.O.eAtBand < 1e-4, st.O.eAtBand);
    sok('  which the circular estimate gets wrong by an order of magnitude',
        st.O.tMergeCirc / st.O.run.tMerge > 4, st.O.tMergeCirc / st.O.run.tMerge);
  })();

  /* --- THE ENDS OF THE PERIOD SLIDER ------------------------------------- */
  (function(){
    /* 10⁻⁸ days = 0.86 ms, which for two 1.4 M☉ stars is inside 6GM/c². The
       slider's own floor of 10⁻⁵ days is NOT inside it — 0.86 s is a 1900 km
       orbit and perfectly legal — so this branch is reachable only by typing,
       which is exactly the path §2.9 says a reader has and the sliders do not. */
    var tight = mkst({ key:'custom', m1:1.4, m2:1.4, pd:1e-8, ecc:0 });
    sok('rlDecay inside the ISCO: no orbit is claimed', !tight.O.ok);
    sok('  and the panel says why', /innermost stable/.test(tight.O.why) &&
        !/NaN|undefined|Infinity/.test(S.readout(tight)), tight.O.why);
    var wide = mkst({ key:'custom', m1:1, m2:1, pd:1000, ecc:0.4 });
    sok('rlDecay at a thousand-day period: still a decaying orbit',
        wide.O.ok && Math.abs(wide.O.avg.enh - wide.O.enhB) < 1e-9 * wide.O.enhB, wide.O.avg.enh);
  })();

  /* --- THE CORRUPT CONTROL. The quadrature and the closed form must be
         comparing something: run the same orbit average with the WRONG
         Peters–Mathews velocity coefficient (12v² − 10ṙ² instead of 11) and
         require the agreement to break. --- */
  (function(){
    var st = mkst({ key:'psr1913' });
    var m1 = st.O.m1, m2 = st.O.m2, M = st.O.M, a = st.O.a, e = st.O.e;
    var p = a * (1 - e * e), h = Math.sqrt(M * p);
    var T = 2 * Math.PI * Math.sqrt(a * a * a / M), N = 4096, s = 0;
    for(var k = 0; k < N; k++){
      var phi = 2 * Math.PI * k / N;
      var r = p / (1 + e * Math.cos(phi));
      var v2 = M * (2 / r - 1 / a), rd = M / h * e * Math.sin(phi);
      s += 8 / 15 * m1 * m1 * m2 * m2 / Math.pow(r, 4) * (12 * v2 - 10 * rd * rd) * r * r / h;
    }
    var badEnh = s * (2 * Math.PI / N) / T / gwLumOf(m1, m2, a);
    sok('rlDecay control: 12v² − 10ṙ² does NOT reproduce Peters\' F(e)',
        Math.abs(badEnh - st.O.enhB) > 1e-3 * st.O.enhB, badEnh + ' vs ' + st.O.enhB);
  })();
})();

/* ---- rlMink's worldline mode, and rlVel's chain (Programme A items 10, 11) --
   The engine suite in tests.js drives 46e directly. These rows drive the
   WRAPPERS the panels call, which is the distinction that matters here: the
   engine was right and `rlWlMeasure` passed a node count into the adaptive
   routine's tolerance slot, so the panel printed 1.7e-8 where the engine gives
   1e-12 and every engine test still passed. Only a screenshot saw it. A
   two-route check tests the route it CALLS. */
(function(){
  var wl = function(key, beta, own){
    var st = { wkey:key, beta:beta, _wl:null };
    if(own){ st.own_rlwl = own; }
    return rlMinkWlMeasure(st);
  };

  /* every preset, through the panel's own call, at boosts either side of zero */
  var worst = 0, where = '';
  Object.keys(RL_WORLDLINES).forEach(function(key){
    [0, 0.4, -0.75, 0.95].forEach(function(b){
      var M = wl(key, b);
      sok('rlMink worldline ' + key + ' at beta=' + b + ' measures a proper time',
          M.ok && isFinite(M.tauLab) && M.tauLab > 0, M.why || M.tauLab);
      if(!M.ok) return;
      var rel = Math.abs(M.tauLab - M.tauP) / M.tauLab;
      if(rel > worst){ worst = rel; where = key + '@' + b; }
      sok('  ' + key + '@' + b + ': and no route beats the straight one',
          M.deficit > -1e-12 * M.straight, M.deficit);
      sok('  ' + key + '@' + b + ': the polygon is frame-independent',
          Math.abs(M.polyP - M.polyLab) < 1e-12 * M.polyLab, M.polyP - M.polyLab);
      sok('  ' + key + '@' + b + ': and it overshoots the curve',
          M.polyLab >= M.tauLab - 1e-12, M.polyLab - M.tauLab);
    });
  });
  /* the acceptance is 46e's measured floor, 4.8e-9, and the panel must reach it */
  sok('the panel call agrees between the frames on every preset and boost',
      worst < 5e-9, 'worst ' + worst.toExponential(3) + ' at ' + where);

  /* a worldline the reader typed, through the same path */
  var own = wl('custom', 0.5, { x:'0.35*t + 0.3*sin(2*t)', t0:0, t1:4 });
  sok('a typed worldline is measured the same way', own.ok, own.why);
  sok('  and its two routes agree', Math.abs(own.tauLab - own.tauP) < 5e-9 * own.tauLab,
      own.tauLab - own.tauP);
  var bad = wl('custom', 0.5, { x:'1.4*t', t0:0, t1:4 });
  sok('a typed worldline faster than light is refused', !bad.ok);
  sok('  and the panel is told why', /speed of light/.test(bad.why || ''), bad.why);

  /* THE LIGHT CONE MUST COME OUT AT 45°, which is a statement about the pane's
     two scales and nothing else. A Minkowski diagram drawn with unequal scales
     is drawing a different geometry from the one it is discussing, and no other
     gate can see it: the picture still looks like a picture. */
  [[0, 0.6, 0, 4], [-3, 3, 0, 1], [0, 0.001, 0, 4], [-1, 1, -1, 1]].forEach(function(w){
    var P = rlWlPane(20, 30, 400, 300, w[0], w[1], w[2], w[3]);
    var dx = Math.abs(P.X(1) - P.X(0)), dt = Math.abs(P.Y(1) - P.Y(0));
    sok('rlWlPane keeps both scales equal on [' + w.join(',') + ']',
        Math.abs(dx - dt) < 1e-9 * Math.max(dx, dt), dx + ' vs ' + dt);
    sok('  and stays inside the box it was given',
        P.px >= 19.9 && P.py >= 29.9 && P.px + P.pw <= 420.1 && P.py + P.ph <= 330.1,
        [P.px, P.py, P.pw, P.ph].join(','));
  });

  /* ---- rlVel's chain, through the panel's cache ---------------------------- */
  Object.keys(RL_CHAINS).forEach(function(key){
    var st = { u:0.75, v:0.75, ckey:key, chain:RL_CHAINS[key].text, cerr:'', _ch:null };
    var C = rlVelChain(st), M = C.M;
    sok('rlVel chain ' + key + ' parses', !!M && M.n > 0, st.cerr);
    if(!M) return;
    sok('  ' + key + ': no parse error', st.cerr === '', st.cerr);
    sok('  ' + key + ': the declared rapidity is what the routes total',
        Math.abs(M.phi - RL_CHAINS[key].phi) <= 1e-12 * Math.max(1, Math.abs(M.phi)),
        M.phi + ' vs ' + RL_CHAINS[key].phi);
    if(!M.saturated){
      sok('  ' + key + ': velocity folding and rapidity agree', M.gapAB <= 4e-16, M.gapAB);
      sok('  ' + key + ': and the matrix product agrees', M.gapBC <= 4e-16, M.gapBC);
    }
    sok('  ' + key + ': the shuffled chain gives the same answer', M.gapShuffle <= 4e-16, M.gapShuffle);
    sok('  ' + key + ': the product is still a Lorentz transformation',
        M.worstEta <= 1e-12 * M.etaScale, M.worstEta + ' / ' + M.etaScale);
    /* the panels must not print undefined, NaN or Infinity for any of them */
    var txt = rlVelChainCard(st) + STAGES.rlVel.chip(st) + rlVelChainVerdict(st) + rlVelChainSat(st);
    sok('  ' + key + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
  });

  /* a chain the reader typed, including the lines that must be refused */
  (function(){
    var st = { u:0.5, v:0.5, ckey:'custom', chain:'0.6\n0.3 x3\n-0.4', cerr:'', _ch:null };
    var M = rlVelChain(st).M;
    sok('a typed chain of five boosts composes', M && M.n === 5, M && M.n);
    sok('  with no error', st.cerr === '', st.cerr);
    var st2 = { u:0.5, v:0.5, ckey:'custom', chain:'0.6\n1.4\nbananas', cerr:'', _ch:null };
    rlVelChain(st2);
    sok('a superluminal line is reported to the reader',
        /nothing carrying mass reaches c/.test(st2.cerr), st2.cerr);
    sok('  naming the line it was on', /line 2/.test(st2.cerr), st2.cerr);
    sok('  and so is a line that is not a number', /bananas/.test(st2.cerr), st2.cerr);
    sok('  while the legal line still composes', rlVelChain(st2).M.n === 1, rlVelChain(st2).M.n);
    var st3 = { u:0.5, v:0.5, ckey:'custom', chain:'# only a comment', cerr:'', _ch:null };
    sok('a chain with nothing in it does not throw', rlVelChain(st3).M === null);
    sok('  and the card says so rather than printing a number',
        /Nothing to compose|no boosts/i.test(rlVelChainCard(st3)), rlVelChainCard(st3).slice(0, 120));
  })();
})();
/* ---- rlEB's typed field and rlTensor's typed tensor (items 7 and 8) --------
   Same distinction as the rows above: tests.js drives 46f directly, and these
   drive the accessors and the panel helpers the stages actually call. */
(function(){
  /* every preset through the accessor, plus a typed one */
  Object.keys(RL_FIELDS).forEach(function(k){
    var st = { fkey:k, beta:0.4 };
    var C = rlEbCur(st);
    sok('rlEB ' + k + ' returns a field', C && C.E && C.B, C);
    var ch = relFieldCharacter(C.E, C.B);
    sok('  ' + k + ': the declared character is what the invariants say',
        ch.indexOf(RL_FIELDS[k].character) === 0, ch);
    /* the two routes, through the boost the stage actually applies */
    var R = rlFieldBoostTwo(C.E, C.B, v3(st.beta, 0, 0));
    sok('  ' + k + ': component formulas and the tensor agree',
        R.worst < 1e-14 * Math.max(1e-12, R.gross), R.worst);
    /* and the frame the classification promises */
    var D = rlFieldDrift(C.E, C.B);
    if(RL_FIELDS[k].removes === 'magnetic')
      sok('  ' + k + ': the drift frame really removes B', D.ok && D.bLeft < 1e-11 * D.gross, D.bLeft);
    else if(RL_FIELDS[k].removes === 'electric')
      sok('  ' + k + ': the drift frame really removes E', D.ok && D.eLeft < 1e-11 * D.gross, D.eLeft);
    else if(RL_FIELDS[k].character === 'null')
      sok('  ' + k + ': a null field has no such frame, and says so', !D.ok && /null field/.test(D.why), D.why);
    else
      sok('  ' + k + ': neither goes, but the frame makes them parallel',
          D.ok && D.parallel < 1e-12, D.parallel);
    /* no panel may print undefined, NaN or Infinity for any of them */
    var txt = rlEbDriftCard(st) + STAGES.rlEB.chip(st) + rlEbControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
  });
  (function(){
    var st = { fkey:'custom', beta:0.5, own_rleb:{ Ex:0.2, Ey:0.9, Ez:-0.3, Bx:0.4, By:-0.1, Bz:0.7 } };
    var C = rlEbCur(st);
    sok('a typed field comes through the accessor', Math.abs(C.E.y - 0.9) < 1e-15 && Math.abs(C.B.z - 0.7) < 1e-15);
    var R = rlFieldBoostTwo(C.E, C.B, v3(0.5, 0, 0));
    sok('  and its two routes agree', R.worst < 1e-14 * R.gross, R.worst);
    sok('  and its panels are clean',
        !/undefined|NaN|Infinity/.test(rlEbDriftCard(st) + STAGES.rlEB.chip(st)));
    /* a field of exactly zero must not divide by itself anywhere */
    var z = { fkey:'custom', beta:0.5, own_rleb:{ Ex:0, Ey:0, Ez:0, Bx:0, By:0, Bz:0 } };
    sok('a field of nothing does not throw', !/undefined|NaN|Infinity/.test(rlEbDriftCard(z)),
        rlEbDriftCard(z).slice(0, 200));
  })();


  /* Both invariants can VANISH — a light wave has E·B = 0 and E² − c²B² = 0,
     and a crossed field has the first — so fmtAgree's derived scale is the
     round-off itself there, and the residuals row printed a perfect result as
     "100% — agreeing to 0 figures" until 2026-08-19. It now carries the gross
     the cancellation came from: |E||B| for the dot, max(E², B²) for the
     difference. Swept over every preset AND a range of boosts, because the
     preset that produces the round-off is not the default one; and the second
     row asserts fmtAgree is WRONG somewhere in the same sweep, so a gate that
     has never been seen to fail is not what this is. */
  (function(){
    var BETAS = [0, 0.1, 0.4, 0.6, 0.9, 0.98, 0.999], bad = [], naive = 0;
    Object.keys(RL_FIELDS).forEach(function(k){
      BETAS.forEach(function(b){
        var st = { fkey:k, beta:b };
        var row = (STAGES.rlEB.readout(st).split('residuals')[1] || '').slice(0, 500);
        (row.match(/agreeing to (\d+) figure/g) || []).forEach(function(s){
          if(+s.replace(/\D/g, '') < 8) bad.push(k + ' @ beta ' + b + ': ' + s);
        });
        var f = STAGES.rlEB.fields(st);
        var F = relTransformEB(f.E, f.B, v3(b, 0, 0));
        var I0 = relFieldInvariants(f.E, f.B), I1 = relFieldInvariants(F.E, F.B);
        if(/agreeing to 0 figure/.test(fmtAgree(I1.dot, I0.dot)) ||
           /agreeing to 0 figure/.test(fmtAgree(I1.diff, I0.diff))) naive++;
      });
    });
    sok('no boost of any field reports its two invariants as disagreeing',
        bad.length === 0, bad.slice(0, 4));
    sok('  and fmtAgree alone would have called at least one of them a total disagreement',
        naive > 0, naive + ' of ' + (Object.keys(RL_FIELDS).length * BETAS.length));
  })();
  /* ---- the tensor stage --------------------------------------------------- */
  Object.keys(RL_TENSORS).forEach(function(k){
    var st = { tkey:k, tsheet:RL_TENSORS[k].text, beta:0.5 };
    var C = rlTnCur(st);
    sok('rlTensor ' + k + ' parses to four rows', C.F && C.F.length === 4, C.errs);
    var K = rlTensorCheck(C.F);
    sok('  ' + k + ': the declared antisymmetry is what is measured',
        RL_TENSORS[k].anti === (K.anti < 1e-15 * K.scale), K.anti + ' / ' + K.scale);
    /* THE TWO DEFINITIONS AGREE ONLY FOR AN ANTISYMMETRIC ARRAY, and that is
       the point rather than a caveat: E.B = -F.Ftilde/4 is an identity about
       field tensors, so on the broken preset the two come out 1 and -1 and the
       disagreement is a SECOND symptom of the same failure. Asserting the
       agreement unconditionally was this suite's first version, and it failed
       on exactly the preset built to fail. */
    if(RL_TENSORS[k].anti){
      sok('  ' + k + ': E.B agrees between the vectors and the dual contraction',
          Math.abs(K.dot - K.fromTensorDot) < 1e-13 * Math.max(1e-12, K.scale * K.scale),
          K.dot + ' vs ' + K.fromTensorDot);
      sok('  ' + k + ': and so does E^2 - B^2',
          Math.abs(K.diff - K.fromTensorDiff) < 1e-13 * Math.max(1e-12, K.scale * K.scale),
          K.diff + ' vs ' + K.fromTensorDiff);
    } else {
      sok('  ' + k + ': the two definitions of E.B DISAGREE, as they must',
          Math.abs(K.dot - K.fromTensorDot) > 1e-6 * K.scale * K.scale,
          K.dot + ' vs ' + K.fromTensorDot);
    }
    var txt = rlTnCard(st) + STAGES.rlTensor.chip(st) + STAGES.rlTensor.readout(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    /* a sheet that does not parse must leave the previous tensor on the picture
       rather than blanking it -- the stage keeps drawing, and says why */
    var st = { tkey:'custom', tsheet:'0 0 0\nnonsense', beta:0.5 };
    var C = rlTnCur(st);
    sok('a broken sheet still yields a drawable tensor', C.F && C.F.length === 4, C.F);
    sok('  and reports the errors', C.errs.length > 0, C.errs.length);
    sok('  and the control panel shows them', /row \d/.test(rlTnControls(st)), rlTnControls(st).slice(0, 200));
    /* the stage's own accessor must never hand frame() something it cannot draw */
    var cur = STAGES.rlTensor.cur(st);
    sok('  and cur() is always four rows of four',
        cur.F.length === 4 && cur.F.every(function(r){ return r.length === 4; }));
  })();
})();
/* ---- relBoost's charge sheet and rlWire's species sheet (items 6 and 9) ----
   Driving the accessors and panel helpers the stages call, not the engine
   functions directly — the distinction that caught rlWlMeasure. */
(function(){
  Object.keys(RL_CHARGES).forEach(function(k){
    var st = { qkey:k, mode:'gauss', _gz:null };
    var C = rlQCur(st);
    sok('relBoost ' + k + ' parses', C.charges.length > 0 && C.errs.length === 0, C.errs);
    var M = rlGaussMeasured(st);
    sok('  ' + k + ': the flux integrates', M.ok, M.why);
    if(!M.ok) return;
    sok('  ' + k + ': the enclosed charge is what the table declares',
        Math.abs(M.enclosed - RL_CHARGES[k].enc) < 1e-12, M.enclosed);
    if(Math.abs(M.enclosed) > 1e-12)
      sok('  ' + k + ': and the flux is 4*pi*q',
          Math.abs(M.lab - M.expect) < 1e-8 * Math.abs(M.expect), M.lab + ' vs ' + M.expect);
    else
      sok('  ' + k + ': and the flux vanishes against its gross',
          Math.abs(M.lab) < 1e-8 * M.gross, M.lab + ' / ' + M.gross);
    if(M.rest !== undefined)
      sok('  ' + k + ': the rest-frame ellipsoid agrees with the lab sphere',
          Math.abs(M.rest - M.lab) < 1e-8 * Math.max(1, Math.abs(M.expect), M.gross),
          M.rest + ' vs ' + M.lab);
    var txt = rlGaussReadout(st) + rlGaussChip(st) + rlGaussControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    /* a typed configuration, and the sphere the reader moves */
    var st = { qkey:'custom', qsheet:'2 0 0 0 0.7\n-1 0.5 0.5 0 0.7', qcx:0, qR:3, _gz:null };
    var M = rlGaussMeasured(st);
    sok('a typed configuration integrates', M.ok, M.why);
    sok('  with both charges inside', Math.abs(M.enclosed - 1) < 1e-12, M.enclosed);
    sok('  and the flux is 4*pi', Math.abs(M.lab - 4 * Math.PI) < 1e-8 * 4 * Math.PI, M.lab);
    /* shrink the sphere until only one is inside, and the answer must follow */
    st.qR = 0.4; st._gz = null;
    var M2 = rlGaussMeasured(st);
    sok('shrinking the sphere leaves one charge inside', Math.abs(M2.enclosed - 2) < 1e-12, M2.enclosed);
    sok('  and the flux follows it', Math.abs(M2.lab - 8 * Math.PI) < 1e-7 * 8 * Math.PI, M2.lab);
    /* a broken sheet keeps the previous configuration rather than blanking */
    var bad = { qkey:'custom', qsheet:'nonsense here', qcx:0, qR:2, _gz:null };
    sok('a broken sheet still yields something drawable', rlQCur(bad).charges.length > 0);
    sok('  and reports the error', rlQCur(bad).errs.length > 0);
  })();

  /* ---- the wire ----------------------------------------------------------- */
  Object.keys(RL_WIRES).forEach(function(k){
    var st = { mode:'sheet', wkeyw:k, wsheet:RL_WIRES[k].text, wvt:RL_WIRES[k].vt };
    var C = rlWCur(st);
    sok('rlWire ' + k + ' parses', C.species.length > 0 && C.errs.length === 0, C.errs);
    var F = rlWireForce(C.species, C.vt, 1, 1);
    sok('  ' + k + ': declared neutrality is what is measured',
        F.neutral === RL_WIRES[k].neutral, F.lam);
    sok('  ' + k + ': the two frames agree about the force',
        Math.abs(F.lab - F.viaExact) <= 1e-12 * Math.max(1e-300, Math.abs(F.lab)) ||
        Math.abs(F.lab - F.viaExact) < 1e-300, F.lab + ' vs ' + F.viaExact);
    var txt = rlWireSheetReadout(st) + rlWireSheetChip(st) + rlWireSheetControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    /* THE DIGIT LOSS IS THE LESSON, so it is asserted in both directions. */
    var slow = { mode:'sheet', wkeyw:'realistic', wsheet:RL_WIRES.real.text, wvt:1e-8 };
    var Fs = rlWireForce(rlWCur(slow).species, 1e-8, 1, 1);
    sok('a realistic drift destroys the species-by-species sum', Fs.prime.digits > 8, Fs.prime.digits);
    sok('  and the closed form survives it',
        Math.abs(Fs.viaExact - Fs.lab) < 1e-12 * Math.abs(Fs.lab), Fs.viaExact + ' vs ' + Fs.lab);
    var fast = { mode:'sheet', wkeyw:'neutral', wsheet:RL_WIRES.neutral.text, wvt:0.4 };
    var Ff = rlWireForce(rlWCur(fast).species, 0.4, 1, 1);
    sok('a cartoon drift does not', Ff.prime.digits < 2, Ff.prime.digits);
    sok('  so both routes agree there', Math.abs(Ff.viaNaive - Ff.lab) < 1e-10 * Math.abs(Ff.lab));
    /* a charged wire: an electric force in the lab too, and still agreeing */
    var chg = { mode:'sheet', wkeyw:'charged', wsheet:RL_WIRES.charged.text, wvt:0.4 };
    var Fc = rlWireForce(rlWCur(chg).species, 0.4, 1, 1);
    sok('a charged wire has a lab electric field', Math.abs(Fc.E) > 0.1, Fc.E);
    sok('  and the frames still agree', Math.abs(Fc.lab - Fc.viaExact) < 1e-12 * Math.abs(Fc.lab));
  })();
})();
/* ---- rlTwin's and rlRocket's programme modes (items 12 and 13) -------------
   The two stages share one engine and one set of panels, and each carries its
   own control-id prefix because there is one document. These rows drive the
   accessor and the panel helpers, not the engine. */
(function(){
  ['twm', 'rom'].forEach(function(pre){
    Object.keys(RL_MOTIONS).forEach(function(k){
      var st = {}; st[pre + 'key'] = k;
      var C = rlMotCur(st, pre);
      sok('motion ' + pre + '/' + k + ' comes through the accessor', !!C.src, C);
      var M = rlMotMeasured(st, pre);
      sok('  ' + pre + '/' + k + ': the programme runs', M.ok, M.why);
      if(!M.ok) return;
      sok('  ' + pre + '/' + k + ': the ship never ages more than home',
          M.t >= M.tau - 1e-9, M.t + ' vs ' + M.tau);
      sok('  ' + pre + '/' + k + ': and never reaches c', M.betaMax < 1, M.betaMax);
      sok('  ' + pre + '/' + k + ': the chord sum agrees with the proper time',
          M.agree < 1e-4 * M.tau, M.agree);
      sok('  ' + pre + '/' + k + ': and comes out ABOVE it, as the geometry requires',
          M.chords >= M.tau - 1e-12, M.chords - M.tau);
      var txt = rlMotReadout(st, pre) + rlMotChip(st, pre) + rlMotControls(st, pre);
      sok('  ' + pre + '/' + k + ': and no panel prints undefined, NaN or Infinity',
          !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
    });
  });
  /* a typed programme, through the same path */
  (function(){
    /* tau1 = 4pi is one FULL period of cos(t/2), so the area under the engine
       is exactly zero and the ship ends at rest. At tau1 = 8 it does not — the
       period is 4pi = 12.57, and asserting "two periods" there was wrong by
       inspection: phi(8) = 2.0646 sin(4) = -1.56 and the ship ends at -0.92c,
       going backwards. The integrator was right and the expectation was not. */
    var st = { twmkey:'custom', own_twm:{ a:'1.0323*cos(t/2)', tau1:4 * Math.PI } };
    var M = rlMotMeasured(st, 'twm');
    sok('a typed a(tau) runs', M.ok, M.why);
    sok('  and its two proper times agree', M.agree < 1e-4 * M.tau, M.agree);
    /* an oscillating engine that returns the ship to rest */
    sok('  a cosine engine over one full period ends at rest', Math.abs(M.beta) < 1e-6, M.beta);
    sok('  and back where it started in rapidity', Math.abs(M.phi) < 1e-6, M.phi);
    /* the panel must refuse a runaway rather than draw one */
    var bad = { twmkey:'custom', own_twm:{ a:'1/(2-t)', tau1:5 } };
    var B = rlMotMeasured(bad, 'twm');
    sok('a rapidity that runs away is refused by the panel too', !B.ok);
    sok('  and the readout says so rather than printing numbers',
        /runs away/.test(rlMotReadout(bad, 'twm')), rlMotReadout(bad, 'twm').slice(0, 200));
    sok('  and the chip says so too', /refused/.test(rlMotChip(bad, 'twm')));
  })();
  /* THE TWO PREFIXES MUST NOT SHARE STATE — one document, two stages. */
  (function(){
    var st = { twmkey:'oneg', romkey:'coast' };
    var A = rlMotMeasured(st, 'twm'), B = rlMotMeasured(st, 'rom');
    sok('the two stages keep separate programmes on one state object',
        Math.abs(A.t - B.t) > 1, A.t + ' vs ' + B.t);
    sok('  and separate caches', st._mot_twm !== st._mot_rom);
  })();
})();
/* ---- the three thought-experiment editors (items 14, 15, 17) -------------- */
(function(){
  /* item 14 — a light clock of any shape, through the accessor */
  Object.keys(RL_CLOCKS).forEach(function(k){
    var st = { ckey:k, beta:0.6, clmode:'place' };
    var C = rlClkCur(st);
    var T = rlClockTick(C.Lx, C.Ly, st.beta);
    sok('rlClock ' + k + ' ticks', T.ok, T.why);
    if(!T.ok) return;
    sok('  ' + k + ': the tick is gamma times the rest tick',
        Math.abs(T.lab - T.expect) < 1e-13 * T.expect, T.lab + ' vs ' + T.expect);
    sok('  ' + k + ': the declared leg equality is what is measured',
        (RL_CLOCKS[k].legs === 'equal') === (Math.abs(T.legRatio - 1) < 1e-9), T.legRatio);
    var txt = rlClkReadout(st) + rlClkChip(st) + rlClkControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    var st = { ckey:'custom', beta:0.8, clmode:'place', own_rlclk:{ Lx:-1.3, Ly:0.45 } };
    var C = rlClkCur(st), T = rlClockTick(C.Lx, C.Ly, st.beta);
    sok('a typed mirror position ticks', T.ok, T.why);
    sok('  and still at exactly gamma', Math.abs(T.lab - T.expect) < 1e-13 * T.expect, T.lab);
    sok('  with unequal legs', Math.abs(T.legRatio - 1) > 0.1, T.legRatio);
    sok('  and the panel is clean', !/undefined|NaN|Infinity/.test(rlClkReadout(st)));
  })();

  /* item 15 — an event pair */
  Object.keys(RL_EVENTS).forEach(function(k){
    var st = { ekey:k, beta:0.6, trmode:'pair' };
    var C = rlEvCur(st);
    var X = rlEventCross(C.t2 - C.t1, C.x2 - C.x1);
    sok('rlTrain ' + k + ': the declared kind is what the interval says',
        X.kind === RL_EVENTS[k].kind, X.kind + ' vs ' + RL_EVENTS[k].kind);
    sok('  ' + k + ': the declared flip is whether a crossover exists',
        (X.beta !== null) === RL_EVENTS[k].flips, String(X.beta));
    var E = rlEventPair(C.t1, C.x1, C.t2, C.x2, st.beta);
    sok('  ' + k + ': and s^2 survives the boost',
        Math.abs(E.s2p - E.s2) < 1e-12 * Math.max(1, Math.abs(E.s2)), E.s2p - E.s2);
    var txt = rlEvReadout(st) + rlEvChip(st) + rlEvControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    var st = { ekey:'custom', beta:0.5, trmode:'pair',
               own_rlev:{ t1:0, x1:0, t2:0.3, x2:5 } };
    var C = rlEvCur(st);
    var X = rlEventCross(C.t2 - C.t1, C.x2 - C.x1);
    sok('a typed pair is classified', X.kind === 'spacelike', X.kind);
    sok('  and its crossover is Dt/Dx', Math.abs(X.beta - 0.06) < 1e-12, X.beta);
    sok('  and the panel is clean', !/undefined|NaN|Infinity/.test(rlEvReadout(st)));
  })();

  /* item 17 — the closing rate */
  (function(){
    var st = { beta:0.9, chmode:'rate' };
    var own = pkOwn(st, 'rlch', [], RL_CH_BOUNDS);
    sok('the signal defaults to light', +own.bs === 1, own.bs);
    var R = rlCloseRate(st.beta, 1);
    sok('light recedes at exactly c', Math.abs(R.own - 1) < 1e-14, R.own);
    sok('  while the coordinate gap closes at 1-beta', Math.abs(R.lab - 0.1) < 1e-14, R.lab);
    var txt = rlChReadout(st) + rlChChip(st) + rlChControls(st);
    sok('  and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
    /* a slower signal, typed */
    var st2 = { beta:0.5, chmode:'rate', own_rlch:{ bs:0.8 } };
    var R2 = rlCloseRate(0.5, 0.8);
    sok('a slower signal gives two different numbers',
        Math.abs(R2.own - R2.lab) > 0.1, R2.own + ' vs ' + R2.lab);
    sok('  and the panel takes the typed speed',
        rlChReadout(st2).indexOf('0.8') >= 0, rlChReadout(st2).slice(0, 120));
  })();
})();
/* ---- the last three thought-experiment editors (items 16, 20, 21) --------- */
(function(){
  Object.keys(RL_BARNS).forEach(function(k){
    var st = { bkey:k, bmode:'events' };
    var C = rlBarnCur(st);
    var E = rlBarnEvents(C.L, C.B, C.beta);
    sok('rlBarn ' + k + ' resolves', E.ok, E.why);
    if(!E.ok) return;
    sok('  ' + k + ': the declared fit is what the contraction gives', E.fits === C.fits, E.Lc);
    var kind = E.s2Doors < -1e-12 ? 'spacelike' : E.s2Doors > 1e-12 ? 'timelike' : 'lightlike';
    sok('  ' + k + ': the declared door separation is what the interval says',
        kind === C.doors, kind + ' vs ' + C.doors);
    sok('  ' + k + ': and the two routes to the ladder frame agree',
        E.routeGap < 1e-12 * Math.max(1, Math.abs(E.dtLadder)), E.routeGap);
    var txt = rlBarnReadout(st) + rlBarnChip(st) + rlBarnControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    var st = { bkey:'custom', bmode:'events', own_rlbarn:{ L:3, B:1, bt:0.95 } };
    var C = rlBarnCur(st), E = rlBarnEvents(C.L, C.B, C.beta);
    sok('a typed ladder and barn resolves', E.ok, E.why);
    sok('  and its two routes agree', E.routeGap < 1e-12 * Math.max(1, Math.abs(E.dtLadder)), E.routeGap);
    sok('  and the panel is clean', !/undefined|NaN|Infinity/.test(rlBarnReadout(st)));
    var stop = { bkey:'custom', bmode:'events', own_rlbarn:{ L:2, B:1, bt:0 } };
    sok('a stationary ladder is refused by the panel',
        /has to be moving/.test(rlBarnReadout(stop)), rlBarnReadout(stop).slice(0, 160));
  })();

  Object.keys(RL_ELEVATORS).forEach(function(k){
    var st = { gkey:k, emode:'measure' };
    var C = rlElevCur(st);
    var E = rlElevatorPair(C.a, C.w, C.h, 4000);
    sok('rlElevator ' + k + ': the box and the field agree about the bend',
        E.bendGap < 1e-3 * Math.max(1e-30, E.bendField), E.bendBox + ' vs ' + E.bendField);
    var txt = rlElevReadout(st) + rlElevChip(st) + rlElevControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });

  Object.keys(RL_DISKS).forEach(function(k){
    var st = { dkey:k, dmode:'survey' };
    var C = rlDiskCur(st);
    var D = rlDiskGeometry(C.R, C.omega, C.ell);
    sok('rlDisk ' + k + ' has a geometry', D.ok, D.why);
    if(!D.ok) return;
    sok('  ' + k + ': C/2R is pi gamma',
        Math.abs(D.closed - Math.PI * relGamma(C.omega * C.R)) < 1e-14, D.closed);
    sok('  ' + k + ': and the ruler count converges on it',
        rlDiskGeometry(C.R, C.omega, C.ell / 100).gap < 1e-3 * D.closed,
        rlDiskGeometry(C.R, C.omega, C.ell / 100).gap);
    var txt = rlDiskReadout(st) + rlDiskChip(st) + rlDiskControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    var st = { dkey:'custom', dmode:'survey', own_rldisk:{ R:2, om:0.6, ell:0.02 } };
    sok('a typed disk works', rlDiskCur(st).R === 2 && !/undefined|NaN/.test(rlDiskReadout(st)));
    var bad = { dkey:'custom', dmode:'survey', own_rldisk:{ R:2, om:0.9, ell:0.02 } };
    sok('a rim past c is refused by the panel',
        /no material disk/.test(rlDiskReadout(bad)), rlDiskReadout(bad).slice(0, 160));
  })();
})();
/* ---- the last two editors: a collision and a source (items 19 and 18) ----- */
(function(){
  Object.keys(RL_COLLIDES).forEach(function(k){
    var st = { xkey:k, dymode:'collide', _col:null };
    var M = rlDynMeasured(st);
    sok('rlDyn ' + k + ' adds up', M.ok, M.why);
    if(!M.ok) return;
    sok('  ' + k + ': no parse errors', M.errs.length === 0, M.errs);
    sok('  ' + k + ': the invariant mass is boost-invariant',
        M.boostGap < 1e-11 * Math.max(1e-9, M.mIn), M.boostGap);
    if(M.outList.length)
      sok('  ' + k + ': the declared conservation is what is measured',
          M.conserves === M.C.conserves, 'dE ' + M.dE + ', dp ' + M.dp);
    var txt = rlDynReadout(st) + rlDynChip(st) + rlDynControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    var st = { xkey:'custom', dymode:'collide', _col:null,
               xin:'1 0.8 a\n2 -0.3 b', xout:'' };
    var M = rlDynMeasured(st);
    sok('a typed reaction adds up', M.ok, M.why);
    sok('  and its invariant mass is boost-invariant', M.boostGap < 1e-11 * M.mIn, M.boostGap);
    sok('  and the panel says nothing is on the other side',
        /Nothing written on the other side/.test(rlDynReadout(st)));
    var bad = { xkey:'custom', dymode:'collide', _col:null, xin:'-1 0.5', xout:'' };
    sok('a negative mass reaches the panel as an error',
        /no such particle/.test(rlDynControls(bad)), rlDynControls(bad).slice(0, 200));
  })();

  Object.keys(RL_SOURCES).forEach(function(k){
    var st = { skey:k, smode:'shift', beta:RL_SOURCES[k].beta };
    var C = rlSrcCur(st);
    sok('rlDopp ' + k + ': beta comes from the slider, not the table', C.beta === st.beta, C.beta);
    var R = rlBeamPower(Math.min(0.999, C.beta), C.theta * Math.PI / 180);
    sok('  ' + k + ': the transverse shift is 1/gamma',
        Math.abs(R.transverse - 1 / relGamma(Math.min(0.999, C.beta))) < 1e-14, R.transverse);
    var txt = rlSrcReadout(st) + rlSrcChip(st) + rlSrcControls(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  });
  (function(){
    /* the unshifted angle is forward of 90 degrees, and the panel prints it */
    var st = { skey:'custom', smode:'shift', beta:0.8, own_rlsrc:{ th:60 } };
    var N = rlDopplerNull(0.8);
    sok('at 0.8c the unshifted angle is 60 degrees',
        Math.abs(N.theta * 180 / Math.PI - 60) < 1e-9, N.theta * 180 / Math.PI);
    sok('  and the readout says so', /60/.test(rlSrcReadout(st)));
    /* a source at rest: everything is 1 and nothing divides by zero */
    var rest = { skey:'custom', smode:'shift', beta:0, own_rlsrc:{ th:90 } };
    sok('a source at rest shifts nothing',
        !/undefined|NaN|Infinity/.test(rlSrcReadout(rest)), rlSrcReadout(rest).slice(0, 200));
  })();
})();
/* ---- ctUnitMarks: a loop counted in the WORK, not in the quantity ----------
   Found 2026-08-19 by the widened auditcustom, as a hang rather than a wrong
   number: rlMotFrameTwin drew one dot per year of the stay-at-home's clock,
   and that clock reads sinh(φ)/a. A programme of a = 5 held for ten years of
   ship time puts it at 2.6e20 years, so the loop had 2.6e20 turns and the
   application stopped responding. Nothing was infinite and nothing was NaN. */
(function(){
  sok('ctUnitMarks returns at most what it was asked for, however wild the range',
      ctUnitMarks(0, 2.6e20, 36).vals.length <= 36, ctUnitMarks(0, 2.6e20, 36).vals.length);
  sok('  and it is still whole units when they fit',
      ctUnitMarks(0, 8, 36).vals.join(',') === '0,1,2,3,4,5,6,7,8'   /* the origin counts: it is year 0 on both clocks */, ctUnitMarks(0, 8, 36).vals);
  sok('  with step 1 in that case', ctUnitMarks(0, 8, 36).step === 1);
  sok('  and a round step when they do not',
      ctUnitMarks(0, 5000, 36).step === 500, ctUnitMarks(0, 5000, 36).step);
  sok('  every value it returns is inside the range',
      ctUnitMarks(3, 97, 20).vals.every(function(v){ return v >= 3 && v <= 97; }),
      ctUnitMarks(3, 97, 20).vals);
  sok('  a degenerate range returns nothing rather than looping',
      ctUnitMarks(5, 5, 30).vals.length === 0 && ctUnitMarks(0, NaN, 30).vals.length === 0);
  sok('  and an infinite one does too', ctUnitMarks(0, Infinity, 30).vals.length === 0);
  /* THE PRE-FIX FORM MUST BE WRONG, or this test is not measuring anything:
     the loop it replaced was `for(k = 1; k <= Math.floor(T); k++)`. */
  (function(){
    var M = rlMotionMeasure(function(){ return 5; }, 10, 2400);
    sok('a five-unit acceleration for ten years is a legal motion, not an error',
        M.ok, M.why);
    sok('  and the stay-at-home clock really does reach astronomical years',
        M.t > 1e15, M.t);
    sok('  so one dot per year would have been more turns than a frame can take',
        Math.floor(M.t) > 1e15, Math.floor(M.t));
    sok('  while ctUnitMarks caps it at 36', ctUnitMarks(0, M.t, 36).vals.length <= 36,
        ctUnitMarks(0, M.t, 36).vals.length);
    /* and the panel that draws it still says something true */
    var st = { tmode:'prog', twmkey:'custom', _mot_twm:null,
               own_twm:{ a:'5', tau1:10 } };
    var txt = rlMotReadout(st, 'twm') + rlMotChip(st, 'twm');
    sok('  and the panel prints no undefined, NaN or Infinity for it',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
  })();
})();

/* ---- the complex-numbers wing's own helpers (Programme C, C2) ---------------
   tests.js drives 41a directly. These drive the accessors and panel helpers the
   six stages actually call — the distinction that mattered on 2026-08-19, when
   rlWlMeasure passed a node count into a tolerance slot and every engine test
   still passed. */
(function(){
  var dist = function(a, b){ return cxAbs(cxSub(a, b)); };

  /* THE PLANE'S TWO SCALES MUST BE EQUAL. The wing's whole subject is that
     multiplication is a rotation, and a rotation only looks like one if a unit
     up is the same number of pixels as a unit across. Stretching to fill the
     box would draw a shear and still look like a picture — no other gate can
     see this, which is why it is asserted on four window shapes. */
  /* the last shape is deliberately TALLER than the harness canvas: mkPlot
     keeps its box on the canvas, and a square chosen before that clamp comes
     back as a rectangle. cnPlotFor asks ctFitBox first for exactly that reason. */
  [[400, 300], [300, 400], [900, 200], [220, 220], [300, 4000]].forEach(function(wh){
    var P = cnPlotFor(20, 30, wh[0], wh[1], 2.5);
    var dx = Math.abs(P.X(1) - P.X(0)), dy = Math.abs(P.Y(1) - P.Y(0));
    sok('cnPlotFor keeps both scales equal in a ' + wh.join('x') + ' box',
        Math.abs(dx - dy) < 1e-9 * Math.max(dx, dy), dx + ' vs ' + dy);
    sok('  and stays inside the box it was given',
        P.px >= 19.9 && P.py >= 29.9 && P.px + P.pw <= 20 + wh[0] + 0.1 &&
        P.py + P.ph <= 30 + wh[1] + 0.1, [P.px, P.py, P.pw, P.ph].join(','));
  });

  /* ---- cnPlane: the pair accessor, and both panels ------------------------ */
  Object.keys(CN_PAIRS).forEach(function(k){
    var st = { pkey:k, show:{ sum:true, prod:true, conj:true } };
    var N = STAGES.cnPlane.nums(st);
    sok('cnPlane ' + k + ' returns a readable pair', N.ok, N.why);
    if(!N.ok) return;
    var M = cnMulPolar(N.a, N.b);
    sok('  ' + k + ': the panel’s own product agrees with the polar form',
        M.gap <= 1e-12 * Math.max(1e-300, M.gross), M.gap);
    var txt = STAGES.cnPlane.readout(st) + STAGES.cnPlane.chip(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
  });
  (function(){
    var st = { pkey:'custom', show:{ sum:true, prod:true, conj:false },
               own_cnPl:{ a:'1.25 - 0.75i', b:'-0.4 + 1.6i' } };
    var N = STAGES.cnPlane.nums(st);
    sok('a typed pair comes through the accessor',
        N.ok && Math.abs(N.a.im + 0.75) < 1e-15 && Math.abs(N.b.re + 0.4) < 1e-15, N.why);
    /* an UNREADABLE entry must leave the picture on the last good pair rather
       than blanking it or producing NaN */
    var bad = { pkey:'custom', show:{}, own_cnPl:{ a:'3 + 2j', b:'1' } };
    var B = STAGES.cnPlane.nums(bad);
    sok('  and an unreadable one is refused, not accepted as NaN',
        !B.ok && Number.isFinite(B.a.re) && Number.isFinite(B.a.im), B.why);
    /* controls() reads the global ST rather than its argument, as every stage's
       does, so the reason is checked where it is produced instead */
    sok('  with a reason a reader can act on', /cannot read/.test(B.why), B.why);
  })();

  /* ---- cnPolar: the walk, and what decides its fate ----------------------- */
  Object.keys(CN_PAIRS).forEach(function(k){
    var st = { mkey:k, n:7, start:'1' };
    var T = STAGES.cnPolar.track(st);
    sok('cnPolar ' + k + ' walks the right number of steps', T.pts.length === 8, T.pts.length);
    /* the n-th point must be the multiplier to the n-th, by BOTH routes */
    var P = cnPowerTwo(T.M.z, 7);
    sok('  ' + k + ': the last point is w^7 by repeated multiplication',
        dist(T.pts[7], P.repeated) <= 1e-12 * Math.max(1e-300, P.gross), dist(T.pts[7], P.repeated));
    sok('  ' + k + ': and de Moivre agrees with it',
        P.gap <= 1e-11 * Math.max(1e-300, P.gross), P.gap);
    var txt = STAGES.cnPolar.readout(st) + STAGES.cnPolar.chip(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
  });
  (function(){
    /* the three verdicts the chip can give, each forced */
    var inside  = STAGES.cnPolar.chip({ mkey:'custom', n:5, start:'1', own_cnPo:{ multiplier:'0.5' } });
    var outside = STAGES.cnPolar.chip({ mkey:'custom', n:5, start:'1', own_cnPo:{ multiplier:'1.5' } });
    var onit    = STAGES.cnPolar.chip({ mkey:'custom', n:5, start:'1', own_cnPo:{ multiplier:'i' } });
    sok('a modulus below 1 is reported as spiralling in', /spiralling in/.test(inside), inside);
    sok('  above 1, as spiralling out', /spiralling out/.test(outside), outside);
    sok('  and exactly 1, as staying on the circle', /on the circle/.test(onit), onit);
  })();

  /* ---- cnRoots ------------------------------------------------------------ */
  ['1', '-1', 'i', '16', '-8 + 6i'].forEach(function(src){
    [2, 3, 5, 8].forEach(function(n){
      var st = { of:src, n:n, show:{ ngon:true, checkArrow:true } };
      var T = STAGES.cnRoots.target(st);
      sok('cnRoots reads "' + src + '"', T.ok, T.why);
      if(!T.ok) return;
      var roots = cxRoots(T.z, n);
      sok('  ' + src + ' has exactly ' + n + ' n-th roots', roots.length === n, roots.length);
      var worst = 0;
      for(var i = 0; i < roots.length; i++)
        worst = Math.max(worst, dist(cnPowerTwo(roots[i], n).repeated, T.z));
      sok('  and every one returns the number when raised back',
          worst <= 1e-12 * Math.max(1e-300, cxAbs(T.z)), worst);
      /* for n > 1 they sum to zero, and the residual needs the gross */
      var sum = roots.reduce(function(s, z){ return cxAdd(s, z); }, cx(0, 0));
      var gross = roots.reduce(function(s, z){ return s + cxAbs(z); }, 0);
      if(n > 1)
        sok('  and they sum to zero, against the sum of their sizes',
            cxAbs(sum) <= 1e-12 * gross, cxAbs(sum) + ' / ' + gross);
      var txt = STAGES.cnRoots.readout(st) + STAGES.cnRoots.chip(st);
      sok('  and no panel prints undefined, NaN or Infinity',
          !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
    });
  });

  /* ---- cnPoly ------------------------------------------------------------- */
  Object.keys(CN_POLYS).forEach(function(k){
    var st = { pkey:k, sheet:CN_POLYS[k].coeffs, show:{ circle:true, resid:true } };
    var G = STAGES.cnPoly.coeffs(st);
    sok('cnPoly ' + k + ': the stage reads its own coefficients', G.ok, G.why);
    if(!G.ok) return;
    var M = cnPolyMeasure(G.c);
    sok('  ' + k + ': and finds ' + CN_POLYS[k].degree + ' roots',
        M.ok && M.roots.length === CN_POLYS[k].degree, M.roots.length);
    var txt = STAGES.cnPoly.readout(st) + STAGES.cnPoly.chip(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
    /* a residual must never reach a panel as a bare 0 (SITE-RULES 2.1) */
    sok('  ' + k + ': no residual row is printed without its scale',
        !/\|p\|\s*=\s*0\b/.test(txt), txt.slice(0, 200));
  });
  (function(){
    /* the typed path, including the two ways it can be wrong */
    var st = { pkey:'custom', sheet:'1 0 -1 0 0 6', show:{} };
    var G = STAGES.cnPoly.coeffs(st);
    sok('a typed coefficient list is read', G.ok, G.why);
    var M = cnPolyMeasure(G.c);
    sok('  and its five roots are found', M.ok && M.roots.length === 5, M.roots.length);
    sok('  with Vieta agreeing', M.vieta.gap <= 1e-9 * M.vieta.gross, M.vieta.gap);
    var lead = { pkey:'custom', sheet:'0 1 2', show:{} };
    sok('a leading zero is refused, and the panel says so',
        !STAGES.cnPoly.coeffs(lead).ok && /leading coefficient/.test(STAGES.cnPoly.readout(lead)),
        STAGES.cnPoly.readout(lead).slice(0, 160));
    var junk = { pkey:'custom', sheet:'1 two 3', show:{} };
    sok('and so is a coefficient that is not a number',
        !STAGES.cnPoly.coeffs(junk).ok, JSON.stringify(STAGES.cnPoly.coeffs(junk)));
    sok('  without printing NaN at the reader',
        !/undefined|NaN|Infinity/.test(STAGES.cnPoly.readout(junk) + STAGES.cnPoly.chip(junk)),
        STAGES.cnPoly.readout(junk).slice(0, 160));
  })();

  /* ---- cnPhasor ----------------------------------------------------------- */
  Object.keys(CN_PHASORS).forEach(function(k){
    var st = { fkey:k, t:0, run:false };
    var P = STAGES.cnPhasor.parts(st);
    sok('cnPhasor ' + k + ' returns its waves', P.list.length > 0, P.list.length);
    var S = cnPhasorSum(P.list);
    sok('  ' + k + ': the arrows and the fitted wave agree', S.gap <= 1e-12 * S.gross, S.gap);
    var txt = STAGES.cnPhasor.readout(st) + STAGES.cnPhasor.chip(st);
    sok('  ' + k + ': and no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 160));
  });
  (function(){
    /* the cancelling case is the one that needs a gross: both routes vanish */
    var st = { fkey:'cancel', t:0, run:false };
    var r = STAGES.cnPhasor.readout(st);
    sok('an exactly cancelling sum is not reported as a 100% disagreement',
        !/agreeing to 0 figure/.test(r), r.slice(0, 300));
    /* a typed set, including one wave switched off by a zero amplitude */
    var own = { fkey:'custom', t:0, run:false,
                own_cnPh:{ a1:2, p1:0, a2:0, p2:90, a3:1.5, p3:210 } };
    var P = STAGES.cnPhasor.parts(own);
    sok('a zero amplitude drops that wave rather than drawing nothing',
        P.list.length === 2, P.list.length);
    var all0 = { fkey:'custom', t:0, run:false,
                 own_cnPh:{ a1:0, p1:0, a2:0, p2:0, a3:0, p3:0 } };
    sok('and three zeros leave something to draw rather than dividing by nothing',
        !/undefined|NaN|Infinity/.test(STAGES.cnPhasor.readout(all0)),
        STAGES.cnPhasor.readout(all0).slice(0, 160));
  })();
})();


/* ---- the coordinate wing's own helpers (Programme C, C4) --------------------
   tests.js drives 25a and 25b directly. These drive the accessor and the panel
   helpers the three stages actually call, which is the distinction that cost a
   day on 2026-08-19: a wrapper can pass the wrong argument into an engine every
   one of whose own tests passes. */
(function(){
  /* THE (u,v) PANE MUST HAVE EQUAL SCALES. The cell the reader drags is h×h in
     those coordinates; a pane stretched to fill its box draws that square as a
     bar, and the caption "watch one cell" then describes a different picture.
     No other gate can see this — the picture still looks like a picture. */
  [[400, 300], [300, 400], [900, 180], [240, 240], [260, 4000]].forEach(function(wh){
    /* the REAL canvas context: plotFrame reaches through ctx.canvas for the
       box it must stay inside, so a hand-made stub is not a context */
    var cvx = (document.querySelector('canvas') || {}).getContext
      ? document.querySelector('canvas').getContext('2d') : null;
    var P = csRectPane(cvx, 10, 20, wh[0], wh[1], 0, 1, 0, 2 * Math.PI, 't');
    var dx = Math.abs(P.X(1) - P.X(0)), dy = Math.abs(P.Y(1) - P.Y(0));
    sok('csRectPane keeps both scales equal in a ' + wh.join('x') + ' box',
        Math.abs(dx - dy) < 1e-9 * Math.max(dx, dy), dx + ' vs ' + dy);
    sok('  and stays inside the box it was given',
        P.px >= 9.9 && P.py >= 19.9 && P.px + P.pw <= 10 + wh[0] + 0.1 &&
        P.py + P.ph <= 20 + wh[1] + 0.1, [P.px, P.py, P.pw, P.ph].join(','));
  });

  /* ---- the accessor, on every preset and on a typed map ------------------- */
  Object.keys(CS_MAPS).forEach(function(k){
    var st = { mkey:k, uu:0.4, vv:0.9, cell:0.14, show:{}, _cs:null };
    var C = csCur(st);
    sok('csCur ' + k + ' returns the preset', C.xs === CS_MAPS[k].xs && !C.own, C.xs);
    var M = csMeasured(st, 80);
    sok('  ' + k + ': and the cached measurement matches the engine', M.ok, M.why);
    /* the cache must be keyed on everything that changes the answer */
    var again = csMeasured(st, 80);
    sok('  ' + k + ': the cache returns the same object', again === M);
    st.mkey = 'custom';
    st.own_csM = { xs:'u', ys:'v', u0:0, u1:1, v0:0, v1:1 };
    var C2 = csCur(st);
    sok('  ' + k + ': switching to a typed map changes what the accessor returns',
        C2.own && C2.xs === 'u', C2.xs);
    var M2 = csMeasured(st, 60);
    sok('  ' + k + ': and the cache notices', M2 !== M && M2.ok, M2.why);
    /* the identity map has area 1 and covers once, whatever preset preceded it */
    sok('  ' + k + ': the identity map measures an area of 1',
        Math.abs(M2.pull - 1) < 1e-9, M2.pull);
  });

  /* ---- every panel, on every preset and on the typed path ----------------- */
  ['csGrid', 'csArea'].forEach(function(id){
    Object.keys(CS_MAPS).forEach(function(k){
      var st = { mkey:k, uu:0.4, vv:0.9, cell:0.14,
                 show:{ grid:true, frame:true, boundary:true }, _cs:null };
      var txt = STAGES[id].readout(st) + STAGES[id].chip(st);
      sok(id + ' ' + k + ': no panel prints undefined, NaN or Infinity',
          !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
    });
    /* a map that does not build must produce a reason, not a blank or a throw */
    var bad = { mkey:'custom', uu:0.4, vv:0.4, cell:0.1, show:{}, _cs:null,
                own_csM:{ xs:'u*cos(', ys:'v', u0:0, u1:1, v0:0, v1:1 } };
    var t2 = STAGES[id].readout(bad) + STAGES[id].chip(bad);
    sok(id + ': an unreadable map is reported rather than blanking the panel',
        t2.length > 40 && !/undefined|NaN|Infinity/.test(t2), t2.slice(0, 200));
  });
  Object.keys(CS_SOLIDS).forEach(function(k){
    var st = { skey:k, cellR:0.7, cellP:1.1, show:{ cell:true }, _sm:null };
    var txt = STAGES.csSolid.readout(st) + STAGES.csSolid.chip(st);
    sok('csSolid ' + k + ': no panel prints undefined, NaN or Infinity',
        !/undefined|NaN|Infinity/.test(txt), txt.slice(0, 200));
    /* the panel must name every route it actually ran, and no others */
    var M = STAGES.csSolid.meas(st);
    M.routes.forEach(function(r){
      sok('  ' + k + ': the readout names the ' + r.name + ' route',
          txt.indexOf(r.name) >= 0, r.name);
    });
  });

  /* ---- the two cases the wing exists to contrast ------------------------- */
  (function(){
    var one = csMeasured({ mkey:'polar', _cs:null }, 90);
    var fold = csMeasured({ mkey:'fold', _cs:null }, 90);
    sok('the disc covers its image once', Math.abs(one.cover - 1) < 0.06, one.cover);
    sok('and the fold covers it twice', Math.abs(fold.cover - 2) < 0.08, fold.cover);
    /* the readout must SAY so, in each case, rather than only computing it */
    var rOne = STAGES.csArea.readout({ mkey:'polar', show:{}, _cs:null });
    var rFold = STAGES.csArea.readout({ mkey:'fold', show:{}, _cs:null });
    sok('  and the panel says the hypothesis holds for the disc',
        /hypothesis holds/.test(rOne), rOne.slice(0, 300));
    sok('  and that it fails for the fold',
        /folds/.test(rFold), rFold.slice(0, 300));
    /* Green must return zero on the fold, and the panel must not call that an error */
    sok('  Green returns zero on the fold', Math.abs(fold.green) < 1e-6 * fold.pull, fold.green);
  })();

  /* ---- a solid the panel must decline to integrate one way ---------------- */
  (function(){
    var ice = csSolidMeasure('ice');
    sok('the ice-cream cone has no Cartesian route offered',
        ice.routes.every(function(r){ return r.name !== 'Cartesian'; }),
        ice.routes.map(function(r){ return r.name; }).join(','));
    sok('  but it does have two others', ice.routes.length >= 2, ice.routes.length);
    sok('  and they agree', ice.spread <= 1e-4 * ice.gross, ice.spread);
  })();
})();


/* ---- the signal-processing wing (C15) -------------------------------------
   Four defect classes found while building it, three of them in the STAGE
   rather than in the engine, and every one invisible to `runtests`. */
(function(){

  /* 1 · dspWinCalc's route-2 normalisation.
     The window stage draws its spectrum twice — an FFT of the windowed samples,
     and a closed-form sum of Dirichlet kernels — and the two live in DIFFERENT
     scalings that the STAGE has to reconcile: the FFT route reads a cosine of
     amplitude 1 as |W(δ)|/(N·cg), because each half of the cosine carries W/2
     and the one-sided amplitude doubles it back. The first version divided by
     N·cg/2 and put the closed form exactly 6 dB above the measurement. That is
     the `rlWlMeasure` lesson again: the engine's two routes agreed at 10⁻¹⁵ in
     tests.js while the picture showed two curves. This tests what the stage
     computes, not what the engine does. */
  (function(){
    ['rect', 'hann', 'blackman', 'flattop'].forEach(function(w){
      [0, 0.25, 0.5].forEach(function(off){
        var st = { wkey:w, N:256, off:off, two:false, sep:3, a2:0.02, db:-110 };
        var A = dspWinCalc(st);
        /* compare the two curves the stage will draw, at the bins where the FFT
           route actually has samples: curveV is in dB at bin i/16 */
        var worst = 0, at = -1;
        for(var k = 0; k <= A.half; k++){
          var got = dspDb(A.amp[k], 1), want = A.curveV[k * 16];
          /* only where there is something to compare — below −200 dB both are
             round-off and the difference of two logarithms of noise is noise */
          if(!Number.isFinite(got) || got < -200 || !Number.isFinite(want)) continue;
          if(Math.abs(got - want) > worst){ worst = Math.abs(got - want); at = k; }
        }
        sok('sigWindow ' + w + ' off ' + off + ': the drawn FFT curve and the drawn closed form agree',
            worst < 0.02, 'worst ' + worst + ' dB at bin ' + at);
      });
    });
    /* and the check can fail: half the normalisation is 6.02 dB out */
    var st2 = { wkey:'hann', N:256, off:0.5, two:false, sep:3, a2:0.02, db:-110 };
    var B = dspWinCalc(st2);
    sok('  and 6 dB of it would be visible to that test',
        Math.abs(dspDb(B.amp[32], 1) - (B.curveV[32 * 16] - 6.0206)) > 5,
        'the corrupt control');
  })();

  /* 2 · dspAliasCalc: the record is a FIXED two seconds, whatever the rate.
     It was N/f_s with N a slider, which meant every signal in the table was
     being asked about over a stretch of time it was not written for — the chirp
     declared "1 → 14 Hz" and reached 70. */
  (function(){
    [8, 16, 24, 32, 64, 96].forEach(function(fs){
      var st = { skey:'tone', fs:fs, guard:false, show:{ recon:true }, _al:null };
      var A = dspAliasCalc(st);
      sok('sigAlias at fs = ' + fs + ' records exactly ' + DSP_DUR + ' s',
          Math.abs(A.dur - DSP_DUR) < 1e-12 && A.N === Math.round(DSP_DUR * fs),
          'dur ' + A.dur + ', N ' + A.N);
    });
    /* the two routes to the alias, through the stage's own accessor */
    [[ 'tone', 32 ], [ 'hi', 32 ], [ 'two', 16 ], [ 'square', 24 ]].forEach(function(p){
      var st = { skey:p[0], fs:p[1], guard:false, show:{}, _al:null };
      var A = dspAliasCalc(st);
      var best = 1e300;
      A.C.comps.forEach(function(c){ best = Math.min(best, Math.abs(A.peak - ftAlias(c.f, p[1]))); });
      sok('sigAlias ' + p[0] + ' at fs = ' + p[1] + ': the measured peak is a declared component, folded',
          A.peak !== null && best < 0.02, 'peak ' + A.peak + ', nearest fold off by ' + best);
    });
    /* a record with no energy in it reports no peak rather than a number: the
       AM carrier at exactly Nyquist samples to identically zero, and the
       parabola then fits three logarithms of 10⁻³⁰⁰ */
    var stAM = { skey:'am', fs:24, guard:false, show:{}, _al:null };
    sok('sigAlias reports no peak for a record that is identically zero',
        dspAliasCalc(stAM).peak === null, dspAliasCalc(stAM).peak);
  })();

  /* 3 · the guard's kept fraction is quoted OVER THE RECORD SHOWN.
     The stage filters twice the record it displays, because dspReconOrder asks
     the same question of a record twice as long — so the whole-span figure
     describes a stretch of signal nobody is looking at. On a chirp the two
     answers are 40% and 84%. */
  (function(){
    var fs = 24, N = Math.round(DSP_DUR * fs);
    var G = dspGuard(DSP_SIGNALS.chirp.x, fs, 2 * N);
    var half = dspKept(G, N), whole = dspKept(G, 2 * N);
    sok('the guard keeps more of a chirp over two seconds than over four',
        half > whole + 0.2, 'over N: ' + half + ', over 2N: ' + whole);
    var st = { skey:'chirp', fs:fs, guard:true, show:{}, _al:null };
    var A = dspAliasCalc(st);
    sok('  and the stage quotes the figure for the record it draws',
        Math.abs(A.kept - half) < 1e-12, A.kept + ' against ' + half);
    /* the guard must actually reduce what folds, and be measured on what is
       being sampled rather than on what was thrown away */
    sok('  the guard cuts the energy above Nyquist by at least ten times',
        A.alias.frac > 10 * A.aliasAfter.frac,
        'before ' + A.alias.frac + ', after ' + A.aliasAfter.frac);
  })();

  /* 4 · linear phase is a statement about H, not about b.
     A two-pole resonator has a single feed-forward tap, which is trivially a
     palindrome — and the panel read "yes, the phase is linear and the delay is
     0 samples" for it. Only the screenshot could see that; this is the test
     that stops it coming back. */
  (function(){
    DSP_FILTER_KEYS.forEach(function(k){
      var P = DSP_FILTERS[k], f = P.make();
      sok('sigFilter ' + k + ': the linear-phase verdict matches what the table declares',
          dspLinearPhase(f.b, f.a) === (P.linear === true),
          'computed ' + dspLinearPhase(f.b, f.a) + ', declared ' + P.linear);
      /* and where it says yes, the group delay really is flat */
      if(dspLinearPhase(f.b, f.a)){
        var want = (f.b.length - 1) / 2, worst = 0, n = 0, peak = 0;
        for(var i = 0; i <= 100; i++) peak = Math.max(peak, dspResp(f.b, f.a, 0.5 * i / 100).mag);
        for(var j = 0; j <= 100; j++){
          var fr = 0.5 * j / 100, g = dspGroupDelay(f.b, f.a, fr);
          if(g === null || dspResp(f.b, f.a, fr).mag < 1e-3 * peak) continue;
          worst = Math.max(worst, Math.abs(g - want)); n++;
        }
        sok('  and its group delay is (M−1)/2 at all ' + n + ' frequencies where H is not tiny',
            n > 40 && worst < 1e-9, 'worst ' + worst);
      }
    });
    /* the resonator is the counterexample, and it must be one */
    var R = DSP_FILTERS.reso.make();
    sok('  the resonator is NOT linear phase despite a palindromic numerator',
        dspSymResid(R.b) < 1e-15 && !dspLinearPhase(R.b, R.a),
        'symmetry residual ' + dspSymResid(R.b));
  })();

  /* 5 · the stage's tick helper returns a ROUNDED step.
     fmtTick gives a step exactly the decimals it needs, so an arbitrary step
     gets arbitrary precision — half a record length of 7.529411764705882 s
     asks for twelve of them. */
  (function(){
    [[0, 2], [0, 7.529411764705882], [-1.37, 1.37], [0, 0.5], [0, 127]].forEach(function(r){
      var T = dspTicks(r[0], r[1], 5);
      var seen = {}, dup = 0, long = 0;
      T.vals.forEach(function(v){
        var s = T.fmt(v);
        if(seen[s]) dup++;
        seen[s] = 1;
        if(s.replace('−', '').length > 8) long++;
      });
      sok('dspTicks on [' + r[0] + ', ' + r[1] + ']: no duplicate and no runaway labels',
          T.vals.length >= 2 && dup === 0 && long === 0,
          T.vals.map(T.fmt).join(' '));
    });
  })();

  /* 6 · dspPanes leaves the bottom band clear.
     ftPanes runs its lower plot to within ten pixels of the canvas floor, so
     plotFrame clamps that plot's x-label to fourteen pixels up and stageNote
     writes at eight — six pixels apart, and they print through each other. */
  (function(){
    [[1268, 415], [900, 300], [640, 240], [1600, 900], [500, 700]].forEach(function(d){
      var P = dspPanes(d[0], d[1], 0.5);
      var bottom = P.bot.y + P.bot.h;
      sok('dspPanes on ' + d[0] + 'x' + d[1] + ' leaves room for the x-label and the note',
          d[1] - bottom >= 40 && P.top.h > 20 && P.bot.h > 20,
          'plot ends at ' + bottom + ' of ' + d[1]);
    });
  })();
})();


/* ============================================================================
   UNITS, DIMENSIONS & UNCERTAINTY  (wing C3, stages 74a–74c)

   Everything the wing prints is a two-route claim, so almost everything here
   compares two routes. The exceptions are the three cases where the second
   route is a piece of physics the wing did not compute at all: Trinity's
   declassified yield, the CODATA Bohr radius, and the log-normal's closed-form
   standard deviation.
   ============================================================================ */
(function(){

  /* 1 · Trinity — the slope is a prediction of the theorem, the data are
     Taylor's. Neither knows about the other, which is what makes the agreement
     worth printing. The tolerance is the fit's own scatter, measured: r² is
     0.997 over 19 points, so a slope standard error of about 0.005 follows, and
     0.02 is four of those. */
  (function(){
    var T = unTrinity();
    sok('unTrinity fits the window it says it fits', T.nFit === 19, T.nFit);
    sok('the measured slope agrees with the predicted 2/5',
        Math.abs(T.F.slope - 0.4) < 0.02, T.F.slope);
    sok('  and the fit is a straight line rather than a fitted curve',
        T.F.r2 > 0.99, T.F.r2);
    /* the yield is 14% low and that is attributed in the panel rather than
       tuned away; what the test pins is that it is the right ORDER and that
       nothing has silently changed it */
    sok('the yield lands within 25% of the declassified 21 kt',
        Math.abs(T.ktF - 21) / 21 < 0.25, T.ktF);
    sok('  and forcing the slope to exactly 2/5 changes it by under 5%',
        Math.abs(T.kt - T.ktF) / T.ktF < 0.05, T.kt + ' against ' + T.ktF);
    /* the excluded points are excluded because the similarity solution does not
       apply there, and the test asserts they really do leave the line -- if they
       did not, the window would be arbitrary */
    var res = Math.abs(T.ys[0] - T.F.predict(T.xs[0]));
    sok('  the first point genuinely departs from the line',
        res > 0.05, 'log residual ' + res);
  })();

  /* 2 · the Bohr radius — dimensional analysis against CODATA. The group is
     a·mₑ·ke²/ħ², which is 1 exactly when a is the Bohr radius; the residual is
     the rounding CODATA publishes in the four constants, about 1e-9. */
  (function(){
    var V = unPiSecond('bohr');
    sok('the Bohr group is 1 to CODATA rounding', Math.abs(V.v - 1) < 1e-8, V.v);
    var G = unPiGroups(UN_PI.bohr.vars);
    sok('  and the atom has exactly one dimensionless group', G.nPi === 1, G.nPi);
    sok('  which is dimensionless to the last bit', G.worst < 1e-12, G.worst);
  })();

  /* 3 · every preset in every table, checked by the route that did not build
     it. The count of groups against rank–nullity; the groups against their own
     recomputed dimensions; the homogeneity flags against the dimension vectors,
     including the two that are FALSE on purpose. */
  (function(){
    Object.keys(UN_PI).forEach(function(k){
      var E = UN_PI[k], G = unPiGroups(E.vars, E.order);
      sok('UN_PI.' + k + ': rank + nullity = n', G.rank + G.nPi === G.n,
          G.rank + '+' + G.nPi + ' vs ' + G.n);
      sok('UN_PI.' + k + ': every group is dimensionless', G.worst < 1e-11, G.worst);
      if(E.nPi !== null && E.nPi !== undefined)
        sok('UN_PI.' + k + ': declared group count', G.nPi === E.nPi, G.nPi + ' vs ' + E.nPi);
    });
    Object.keys(UN_EQNS).forEach(function(k){
      var E = UN_EQNS[k], A = unRead(E.lhs), B = unRead(E.rhs);
      sok('UN_EQNS.' + k + ': both sides parse', A.ok && B.ok,
          (A.ok ? '' : A.why) + ' ' + (B.ok ? '' : B.why));
      if(!A.ok || !B.ok) return;
      sok('UN_EQNS.' + k + ': homogeneity as declared',
          unDimSame(A.d, B.d) === !!E.homog,
          unFmtDim(A.d) + ' vs ' + unFmtDim(B.d));
    });
    Object.keys(UN_EXPRS).forEach(function(k){
      var C = unDimCheck(UN_EXPRS[k].src);
      sok('UN_EXPRS.' + k + ': the two dimension routes agree',
          C.ok && C.gap < 1e-11, C.ok ? C.gap : C.why);
    });
  })();

  /* 4 · unSig's two routes. The bars are the EXACT worst case over the rounding
     box; the outline is the first-order formula. For + and − those are the same
     calculation and must agree to the last bit, because the operations are
     linear and there is no second order to miss. For × and ÷ they part company
     at order δa·δb, which is what the last assertion measures. */
  (function(){
    var S = STAGES.unSig;
    Object.keys(UN_SIGP).forEach(function(k){
      var st = { skey:k, k:UN_SIGP[k].k };
      S.enter(st, { skey:k, k:UN_SIGP[k].k });
      var C = S.cur(st);
      /* The tolerance here is not a guess and it is not 1e-12: the box is found
         by differencing two numbers of size |v|, so its own absolute error is
         about eps*|v| however small the box itself is. On the `spread` preset
         v is 6e23 and the box is 5e18, so the representation error alone is
         1.6e7 — a relative 3e-12, which a fixed 1e-12 called a defect. That is
         precisely the cancellation this stage is ABOUT, appearing in the stage's
         own arithmetic, and the honest tolerance is the one it implies. */
      /* and the size that sets it is the size of the numbers being DIFFERENCED,
         not the size of the answer — which is the same sentence the stage's own
         readout prints about a − b. Keying the floor on |v| passed the four
         presets where nothing cancels and failed the four where something does,
         which is as clear a demonstration as the stage itself gives. */
      var fl = function(o){
        return 8 * Number.EPSILON * Math.max(Math.abs(C.ra), Math.abs(C.rb), Math.abs(o.v));
      };
      sok('unSig.' + k + ': + is linear, so box and formula agree to float64',
          Math.abs(C.ops[0].box - C.ops[0].lin) <= fl(C.ops[0]) + 1e-15 * C.ops[0].lin,
          C.ops[0].box + ' vs ' + C.ops[0].lin + ', float64 floor ' + fl(C.ops[0]));
      sok('unSig.' + k + ': − is linear too',
          Math.abs(C.ops[1].box - C.ops[1].lin) <= fl(C.ops[1]) + 1e-15 * C.ops[1].lin,
          C.ops[1].box + ' vs ' + C.ops[1].lin + ', float64 floor ' + fl(C.ops[1]));
      /* the product's box is LARGER than the first-order estimate by exactly the
         cross term, and never smaller — the second order is one-signed here,
         above the same float64 floor and for the same reason */
      sok('unSig.' + k + ': × box is never below the first-order estimate',
          C.ops[2].box >= C.ops[2].lin - fl(C.ops[2]),
          C.ops[2].box + ' vs ' + C.ops[2].lin + ', float64 floor ' + fl(C.ops[2]));
      sok('unSig.' + k + ': the rounded values really carry k figures',
          Math.abs(C.ra - unSigRound(C.a, C.k)) === 0 &&
          Math.abs(C.rb - unSigRound(C.b, C.k)) === 0, C.ra + ' ' + C.rb);
    });
    /* the amplification factor IS the whole lesson, so pin it on the preset it
       exists for: the difference must be at least a hundred thousand times
       worse, relatively, than either input */
    var st = {}; S.enter(st, { skey:'cancel', k:8 });
    var C = S.cur(st);
    sok('unSig.cancel: subtracting amplifies the relative error by over 1e5',
        C.cond > 1e5 && C.ops[1].rel / C.inRel > 1e5,
        'cond ' + C.cond + ', ratio ' + (C.ops[1].rel / C.inRel));
    /* and the control: on two numbers of wildly different sizes the difference
       is the larger number and the amplification is exactly 1 */
    var st2 = {}; S.enter(st2, { skey:'spread', k:5 });
    var C2 = S.cur(st2);
    sok('unSig.spread: no amplification when nothing cancels',
        Math.abs(C2.cond - 1) < 1e-9, C2.cond);
  })();

  /* 5 · unProp's two routes, over every preset. The claim is NOT that the two
     agree — on two of the presets they emphatically must not — but that the
     stage's own verdict about whether they agree is right, measured against the
     Monte Carlo's own sampling error. */
  (function(){
    var S = STAGES.unProp;
    /* the linear presets: the routes must agree inside a few sampling errors */
    ['pend', 'sphere', 'power', 'avg'].forEach(function(k){
      var st = {}; S.enter(st, { mkey:k });
      var N = S.cur(st);
      sok('unProp.' + k + ': the routes agree within the sampling error',
          N.C.sigmas < 5, N.C.sigmas + ' sigmas, lin ' + N.C.lin.sd + ' mc ' + N.C.mc.sd);
      var s = N.C.lin.share.reduce(function(p, q){ return p + q; }, 0);
      sok('unProp.' + k + ': the variance shares sum to one', Math.abs(s - 1) < 1e-9, s);
    });
    /* the mean of ten readings is exactly sigma/root-ten, which is the one
       preset where the first-order formula is not an approximation at all */
    (function(){
      var st = {}; S.enter(st, { mkey:'avg' });
      var N = S.cur(st);
      sok('unProp.avg: the linear route IS sigma/sqrt(10)',
          Math.abs(N.C.lin.sd - 0.3 / Math.sqrt(10)) < 1e-9, N.C.lin.sd);
    })();
    /* the nonlinear presets: the routes must DISAGREE, and by far more than the
       sampling error, or the stage's whole point has quietly stopped working */
    ['decay', 'ratio'].forEach(function(k){
      var st = {}; S.enter(st, { mkey:k });
      var N = S.cur(st);
      sok('unProp.' + k + ': the linearisation visibly fails, as it should',
          N.C.sigmas > 10 && N.C.relGap > 0.1,
          N.C.sigmas + ' sigmas, gap ' + N.C.relGap);
    });
    /* and the sweep that separates a real disagreement from the sample: raising
       the ± multiplier must leave a LINEAR preset's routes together and drive a
       curved one's apart. This is the "change the resolution and watch" test. */
    (function(){
      var st = {}; S.enter(st, { mkey:'avg' });
      var worst = 0;
      [1, 2, 4, 6].forEach(function(b){
        st.blow = b;
        worst = Math.max(worst, S.cur(st).C.sigmas);
      });
      sok('unProp.avg: a linear f stays exact however large the errors get',
          worst < 5, worst + ' sigmas at the worst multiplier');
      var st2 = {}; S.enter(st2, { mkey:'decay' });
      var prev = 0, rising = true;
      [1, 3, 6].forEach(function(b){
        st2.blow = b;
        var g = S.cur(st2).C.relGap;
        if(g < prev - 1e-9) rising = false;
        prev = g;
      });
      sok('unProp.decay: and a curved one gets worse as the errors grow',
          rising && prev > 0.5, prev);
    })();
    /* the pendulum's measurement against standard gravity — a number the wing
       does not compute — and its error bar has to cover it */
    (function(){
      var st = {}; S.enter(st, { mkey:'pend' });
      var N = S.cur(st);
      sok('unProp.pend: the measured g sits inside its own error bar of 9.80665',
          Math.abs(N.C.lin.f0 - 9.80665) < 2 * N.C.lin.sd,
          N.C.lin.f0 + ' ± ' + N.C.lin.sd);
      sok('  and the period owns the larger share, because it enters squared',
          N.C.lin.share[1] > N.C.lin.share[0], N.C.lin.share.join(','));
    })();
  })();

  /* 6 · the reader's own boxes must not blank the picture. A parse failure
     keeps the previous scenario and reports the complaint; nothing may throw. */
  (function(){
    ['', '   ', 'kg^', 'm-1', 'bogus', 'kg/(m', '((m)', 'm^(1/', '1/0'].forEach(function(s){
      var P;
      try { P = unRead(s); }
      catch(e){ sok('unRead never throws on "' + s + '"', false, String(e)); return; }
      sok('unRead never throws on "' + s + '"', true);
      sok('  and returns a usable dimension vector for "' + s + '"',
          Array.isArray(P.d) && P.d.length === UN_NB && P.d.every(isFinite), JSON.stringify(P.d));
      if(!P.ok) sok('  with a complaint for "' + s + '"', typeof P.why === 'string' && P.why.length > 0, P.why);
    });
  })();

  /* 7 · exponents must render as real notation. uniSup lifts what follows a
     CARET, so passing it a bare "2" silently returns "2" — which printed the
     whole wing as T2 g / L. SITE-RULES §1.7: never ASCII where notation exists. */
  (function(){
    sok('unSup writes a real superscript for 2', unSup(2) === '²', unSup(2));
    sok('  and for a negative exponent', unSup(-2) === '⁻²', unSup(-2));
    /* a half is written as the fraction it is — there is no superscript full
       stop in Unicode, so a decimal exponent cannot be typeset and must not be
       attempted */
    sok('  and for a half', unSup(0.5) === '¹ᐟ²', unSup(0.5));
    sok('  and for three halves', unSup(1.5) === '³ᐟ²', unSup(1.5));
    sok('  and for a negative half', unSup(-0.5) === '⁻¹ᐟ²', unSup(-0.5));
    sok('unFmtDim carries them through', unFmtDim([1,1,-2,0,0,0,0]) === 'M L T⁻²',
        unFmtDim([1,1,-2,0,0,0,0]));
    sok('  and so does unFmtSI', unFmtSI([1,2,-3,-1,0,0,0]) === 'kg·m²·s⁻³·A⁻¹',
        unFmtSI([1,2,-3,-1,0,0,0]));
    var G = unPiGroups(UN_PI.pend.vars);
    sok('  and so does a Pi group', unPiText(G.groups[0], UN_PI.pend.vars) === 'T² g / L',
        unPiText(G.groups[0], UN_PI.pend.vars));
    var noAscii = /\^/;
    Object.keys(UN_EXPRS).forEach(function(k){
      var d = unRead(UN_EXPRS[k].src).d;
      sok('UN_EXPRS.' + k + ' prints no caret', !noAscii.test(unFmtDim(d)), unFmtDim(d));
    });
  })();
})();

/* ============================================================================
   DISCRETE MATHS & COMBINATORICS  (wing C5, stages 79ea–79ec)

   Three of these tests exist because a probe found a real defect the day the
   wing was written, and each is written so it would fail again:

     · dcPascal drew its gasket from T[n][k] % 2, which is meaningless past row
       53 — 665 odd cells where the answer is 3^6 = 729;
     · dcRec compared a count of binary strings against F(n) when the count is
       F(n+2), and reported that the recurrence did not describe the problem;
     · dcCount's enumerator has to REFUSE above its cap rather than truncate.
   ============================================================================ */
(function(){

  /* 1 · every preset of dcCount: the formula against the objects it counts */
  (function(){
    var S = STAGES.dcCount;
    Object.keys(DC_KINDS).forEach(function(kind){
      [[4, 2], [5, 3], [6, 3], [7, 2]].forEach(function(p){
        var st = {}; S.enter(st, { kind:kind, n:p[0], k:p[1] });
        var N = S.cur(st);
        if(N.C.overflow){
          sok('dcCount.' + kind + '(' + p[0] + ',' + p[1] + '): refuses rather than truncating',
              N.C.enumerated === null, N.C.enumerated);
          return;
        }
        sok('dcCount.' + kind + '(' + p[0] + ',' + p[1] + '): formula matches the enumeration',
            N.C.agree, N.C.closed + ' vs ' + N.C.enumerated);
        sok('  and every object has k entries drawn from n',
            N.C.list.every(function(o){
              return o.length === N.k && o.every(function(e){ return e >= 0 && e < N.n; });
            }), 'k=' + N.k + ' n=' + N.n);
      });
    });
    /* k = 0 on every kind: exactly ONE object, the empty choice — which is
       0! = 1 stated as a count. The list is not empty there, it holds one empty
       array, and the drawing path read obj[0] of it and threw. runall found it;
       this is the assertion that stops it coming back. */
    Object.keys(DC_KINDS).forEach(function(kind){
      var st = {}; S.enter(st, { kind:kind, n:6, k:0 });
      var N = S.cur(st);
      sok('dcCount.' + kind + '(6,0): exactly one object, the empty choice',
          N.C.enumerated === 1 && N.C.closed === 1 && N.C.list.length === 1,
          N.C.closed + ' / ' + N.C.enumerated);
      sok('  and that object really is empty',
          N.C.list[0].length === 0, JSON.stringify(N.C.list[0]));
    });
    /* the four kinds are ordered by how much they count, at every n and k > 1 */
    for(var n = 3; n <= 8; n++) for(var k = 2; k <= Math.min(4, n); k++){
      var P = DC_KINDS.perm.f(n, k), PR = DC_KINDS.permRep.f(n, k);
      var C = DC_KINDS.comb.f(n, k), CR = DC_KINDS.combRep.f(n, k);
      sok('dcCount ordering at n=' + n + ' k=' + k + ': C <= P <= nk, and C <= CR',
          C <= P && P <= PR && C <= CR, [C, P, PR, CR].join(','));
      sok('  and P = C times k!', Math.abs(P - C * dcFact(k)) < 1e-6, P + ' vs ' + C * dcFact(k));
    }
  })();

  /* 2 · dcPascal — the recurrence against the formula, and the parity rule
     that does not read the entry at all. The naive test is run too, as the
     negative control: if it agreed everywhere there would be nothing to fix. */
  (function(){
    var S = STAGES.dcPascal;
    [4, 10, 16].forEach(function(rows){
      var st = {}; S.enter(st, { view:'rows', rows:rows });
      var N = S.cur(st);
      sok('dcPascal at ' + rows + ' rows: recurrence equals the formula exactly',
          N.worst === 0, N.worst + ' at ' + N.worstAt);
      sok('  row sums to 2^n', N.F.sumGap === 0, N.F.sum + ' vs ' + N.F.sumExact);
      sok('  alternating sum vanishes', N.F.altGap === 0, N.F.alt);
      sok('  weighted sum is n2^(n-1)', N.F.weightedGap === 0, N.F.weighted);
      sok('  sum of squares is C(2n, n)', N.F.squaresGap === 0, N.F.squares);
    });
    /* the parity view runs to 63 rows, where the ENTRIES are no longer exact */
    var st = {}; S.enter(st, { view:'parity', rows:63 });
    var N = S.cur(st);
    sok('dcPascal parity: the bitwise count over the first 64 rows is 3^6',
        dcOddCount(63) === 729, dcOddCount(63));
    var naive = N.T.reduce(function(s, r){
      return s + r.filter(function(v){ return Math.abs(v % 2) === 1; }).length; }, 0);
    sok('  and reading the entry mod 2 gets it WRONG there, which is why it is not used',
        naive !== 729, naive);
    sok('  the entries at that depth are indeed past 2^53', !N.exact, N.T[63][31]);
    /* and the two agree wherever the entries are still exact */
    var st2 = {}; S.enter(st2, { view:'parity', rows:31 });
    var N2 = S.cur(st2), bad = 0;
    for(var n = 0; n <= 31; n++) for(var k = 0; k <= n; k++)
      if((Math.abs(N2.T[n][k] % 2) === 1) !== dcOddEntry(n, k)) bad++;
    sok('  while the entries are exact the two rules agree', bad === 0, bad);
    sok('  and the count there is 3^5', dcOddCount(31) === 243, dcOddCount(31));
    /* the binomial view, including the preset where both routes vanish */
    var st3 = {}; S.enter(st3, { view:'binom', rows:8, a:1, b:-1 });
    var N3 = S.cur(st3);
    sok('dcPascal binom: (1-1)^n vanishes on both routes',
        N3.B.sum === 0 && N3.B.direct === 0, N3.B.sum + ' ' + N3.B.direct);
    sok('  and the gross is 2^n, so the verdict is agreement not a 100% error',
        N3.B.gross === 256 && /agree to every digit/.test(
          fmtAgreeGross(N3.B.sum, N3.B.direct, N3.B.gross)),
        fmtAgreeGross(N3.B.sum, N3.B.direct, N3.B.gross));
  })();

  /* 3 · dcIncl over every preset, plus the disjoint control */
  (function(){
    var S = STAGES.dcIncl;
    Object.keys(DC_INCL).forEach(function(k){
      var st = {}; S.enter(st, { ikey:k, derange:6 });
      var N = S.cur(st);
      sok('dcIncl.' + k + ': the alternating sum matches the direct count',
          N.I.gap === 0, N.I.formula + ' vs ' + N.I.direct);
      sok('dcIncl.' + k + ': 2^m - 1 terms', N.I.terms.length === 7, N.I.terms.length);
      sok('dcIncl.' + k + ': the gross is at least the answer',
          N.I.gross >= N.I.formula, N.I.gross + ' vs ' + N.I.formula);
    });
    /* the control has NO corrections, and that is the point of shipping it */
    var st = {}; S.enter(st, { ikey:'disjoint', derange:6 });
    var N = S.cur(st);
    sok('dcIncl.disjoint: every multi-set term is exactly zero',
        N.I.terms.filter(function(t){ return t.bits > 1; })
                 .every(function(t){ return t.inter === 0; }), 'ok');
    sok('  so the gross equals the answer and nothing cancelled',
        N.I.gross === N.I.formula, N.I.gross);
    /* and a preset where corrections DO fire, so the control means something */
    var st2 = {}; S.enter(st2, { ikey:'div', derange:6 });
    var N2 = S.cur(st2);
    sok('dcIncl.div: corrections really do fire',
        N2.I.terms.some(function(t){ return t.bits > 1 && t.inter > 0; }) &&
        N2.I.gross > N2.I.formula, N2.I.gross + ' vs ' + N2.I.formula);
    /* derangements, over the whole slider */
    for(var n = 1; n <= 9; n++){
      var s3 = {}; S.enter(s3, { ikey:'div', derange:n });
      var N3 = S.cur(s3);
      sok('dcIncl derangements n=' + n + ': the routes agree',
          N3.D.gapIE === 0, N3.D.ie + ' vs ' + N3.D.rec);
      if(N3.De !== null)
        sok('  and a brute-force count of the permutations agrees too',
            N3.De === N3.D.rec, N3.De + ' vs ' + N3.D.rec);
    }
  })();

  /* 4 · dcRec — three routes, the shift, and where the closed form fails */
  (function(){
    var S = STAGES.dcRec;
    Object.keys(DC_RECS).forEach(function(k){
      var E = DC_RECS[k];
      [E.c.length, 10, Math.floor(E.nmax / 2), E.nmax].forEach(function(n){
        var st = {}; S.enter(st, { rkey:k, n:n });
        var N = S.cur(st);
        /* the matrix must be exact wherever the ANSWER is */
        if(N.exact)
          sok('dcRec.' + k + '(' + N.n + '): the matrix route is exact',
              N.matGap === 0, N.mat + ' vs ' + N.it);
        else
          sok('dcRec.' + k + '(' + N.n + '): past 2^53 the panel says so',
              N.exact === false, N.it);
        /* the counting route, where the preset has one, must agree at the
           SHIFTED index — comparing at n reported 144 against 55 */
        if(N.cnt !== null)
          sok('dcRec.' + k + '(' + N.n + '): the enumeration matches the recurrence at n + ' +
              (E.shift || 0), N.cnt === N.cntAgainst, N.cnt + ' vs ' + N.cntAgainst);
      });
    });
    /* Binet: relative error flat, absolute error growing, and the crossing */
    var st = {}; S.enter(st, { rkey:'fib', n:78 });
    var N = S.cur(st);
    sok('dcRec.fib(78): the closed form has lost no significant figures',
        N.cfRel < 1e-14, N.cfRel);
    sok('  but its absolute error is above a half', N.cfGap >= 0.5, N.cfGap);
    sok('  while iteration and the matrix are still exactly right',
        N.matGap === 0 && N.exact, N.it);
    var crossed = null;
    for(var n = 60; n <= 78 && crossed === null; n++){
      var s2 = {}; S.enter(s2, { rkey:'fib', n:n });
      if(S.cur(s2).cfGap >= 0.5) crossed = n;
    }
    sok('  and the crossing is at n = 71', crossed === 71, crossed);
    /* the ratio of consecutive terms goes to the larger root */
    ['fib', 'lucas', 'pell'].forEach(function(k){
      var s3 = {}; S.enter(s3, { rkey:k, n:40 });
      var N3 = S.cur(s3);
      sok('dcRec.' + k + ': the term ratio reaches the larger characteristic root',
          Math.abs(N3.ratio - N3.R.r1) < 1e-10, N3.ratio + ' vs ' + N3.R.r1);
    });
    /* the third-order preset declines a two-term closed form rather than
       returning the answer to a different question */
    var s4 = {}; S.enter(s4, { rkey:'trib', n:30 });
    sok('dcRec.trib: no two-term closed form is offered', S.cur(s4).cf === null);
  })();

  /* 5 · dcBirth — the exact product, the half-way point, and the simulation
     compared against its OWN sampling error rather than a guessed tolerance */
  (function(){
    var S = STAGES.dcBirth;
    Object.keys(DC_BIRTH).forEach(function(k){
      var st = {}; S.enter(st, { bkey:k, k:Math.min(23, DC_BIRTH[k].N) });
      var N = S.cur(st);
      sok('dcBirth.' + k + ': the probability is a probability',
          N.P.pSome >= 0 && N.P.pSome <= 1, N.P.pSome);
      sok('dcBirth.' + k + ': the half-way point really is the crossing',
          dcBirthday(N.half, N.B.N).pSome >= 0.5 &&
          (N.half <= 1 || dcBirthday(N.half - 1, N.B.N).pSome < 0.5),
          N.half);
      /* the ABSOLUTE claim, because the crossing is an integer. The relative
         form failed on three of four presets: the dropped term is linear in k,
         so it costs order 1 whatever N is — 0.5 of a person at 365, 0.9 at 12. */
      sok('dcBirth.' + k + ': the closed-form estimate lands within one of the crossing',
          Math.abs(N.sqrtN - N.half) < 1, N.sqrtN + ' vs ' + N.half);
      sok('  and the familiar 1.177 sqrt(N) is the one that is out by order 1',
          Math.abs(N.scaleN - N.half) >= Math.abs(N.sqrtN - N.half) - 1e-12,
          N.scaleN + ' vs ' + N.sqrtN);
      if(N.S)
        sok('dcBirth.' + k + ': the simulation agrees within its own sampling error',
            N.S.se === 0 || Math.abs(N.S.p - N.P.pSome) < 4 * N.S.se,
            N.S.p + ' vs ' + N.P.pSome + ' se ' + N.S.se);
    });
    var st = {}; S.enter(st, { bkey:'days', k:23 });
    sok('dcBirth: twenty-three is the crossing for a year', S.cur(st).half === 23, S.cur(st).half);
    /* the domain too large to sample declines rather than running something
       slower and noisier than the thing it would check */
    var st2 = {}; S.enter(st2, { bkey:'coins', k:77000 });
    sok('dcBirth: a 32-bit space declines the simulation', S.cur(st2).canSim === false);
  })();

  /* 6 · nothing in this wing may print undefined, NaN or Infinity */
  (function(){
    ['dcCount', 'dcBirth', 'dcPascal', 'dcIncl', 'dcRec'].forEach(function(id){
      var S = STAGES[id];
      var st = {}; S.enter(st, {});
      var txt = '';
      try { txt = S.readout(st) + S.chip(st); }
      catch(e){ sok(id + ' renders without throwing', false, String(e)); return; }
      sok(id + ' renders without throwing', true);
      sok('  and prints no undefined/NaN/Infinity',
          !/undefined|NaN|Infinity/.test(txt), (txt.match(/undefined|NaN|Infinity/) || [''])[0]);
      var d;
      try { d = S.derive(st); } catch(e){ sok(id + ' builds its ladder', false, String(e)); return; }
      sok(id + ' builds its ladder', d && d.steps && d.steps.length > 4, d && d.steps && d.steps.length);
      sok(id + ' has a legend', S.legend(st).length > 0);
    });
  })();
})();
/* ============================================================================
   PROOF, LOGIC & SETS  (Programme C wing C1) — the eight stages

   The engines are unit-tested in tests.js. What this block adds is what only
   the stage layer can get wrong: a stage reading its own preset table with the
   wrong key, a `cur()` that answers a different question from the one the
   picker asked, and — the class §3.4 exists for — a claim that survives on the
   DEFAULT preset and fails on one the reader can select. Every sweep below
   drives presets the default is not.
   ============================================================================ */
(function(){
  /* 1 · pfTable — every law, both routes, and the declared flag recomputed */
  (function(){
    var S = STAGES.pfTable, bad = 0, n = 0;
    Object.keys(PF_LAWS).forEach(function(k){
      var st = {}; S.enter(st, { lawKey:k });
      var N = S.cur(st);
      n++;
      if(!N.E.ok){ bad++; STG_LOG.push('   pfTable ' + k + ' does not parse'); return; }
      if(!N.claimOK){ bad++; STG_LOG.push('   pfTable ' + k + ': declared ' + N.declared + ', rows say ' + N.E.equal); }
      if(!N.E.agree){ bad++; STG_LOG.push('   pfTable ' + k + ': table and clause form disagree'); }
    });
    sok('pfTable: all ' + n + ' laws, both routes, claim recomputed through the stage', bad === 0, bad);
    /* the reader's own formulas go through the same cur(), and a formula that
       does not parse must leave the panel standing rather than blanking it */
    var stc = {}; S.enter(stc, { lawKey:'custom' });
    stc.own_pfTb = { a:'p -> (q -> p)', b:'T' };
    sok('pfTable: a typed tautology is recognised as one', S.cur(stc).E.equal === true);
    stc.own_pfTb = { a:'p &', b:'q' };
    var broken = S.cur(stc);
    sok('pfTable: a half-typed formula reports instead of throwing',
        broken.E.ok === false && typeof broken.E.why === 'string' &&
        /undefined|NaN/.test(S.readout(stc)) === false, broken.E.why);
  })();

  /* 2 · pfQuant — every relation, every domain size, every statement */
  (function(){
    var S = STAGES.pfQuant, bad = 0, cases = 0;
    Object.keys(PF_RELS).forEach(function(rk){
      for(var m = 2; m <= 10; m++)
        Object.keys(PF_QUANTS).forEach(function(qk){
          var st = {}; S.enter(st, { rel:rk, n:m, qkey:qk });
          var N = S.cur(st);
          cases++;
          if(!N.Q.agree){ bad++; if(bad < 4) STG_LOG.push('   pfQuant ' + rk + ' n=' + m + ' ' + qk + ': routes disagree'); }
          /* ∃y∀x ⇒ ∀x∃y is a theorem, and the stage must never print the pair
             the other way round */
          if(N.all.EAx.val && !N.all.AEy.val){ bad++; STG_LOG.push('   pfQuant ' + rk + ' n=' + m + ': ∃∀ true while ∀∃ false'); }
        });
    });
    sok('pfQuant: ' + cases + ' statements through the stage — three routes, and ∃∀ ⇒ ∀∃ holds', bad === 0, bad);
    var st = {}; S.enter(st, { rel:'custom', n:6, qkey:'AEy' });
    st.own_pfQr = { rel:'y - x' };
    sok('pfQuant: a typed relation reproduces x < y',
        S.cur(st).Q.val === false && S.cur(st).Q.A.outer === 6, JSON.stringify(S.cur(st).Q.A));
  })();

  /* 3 · pfInduct — the certificate may never contradict the checks */
  (function(){
    var S = STAGES.pfInduct, bad = 0;
    Object.keys(PF_CLAIMS).forEach(function(k){
      for(var top = PF_CLAIMS[k].from + 1; top <= 24; top += 7){
        var st = {}; S.enter(st, { claim:k, top:top });
        var N = S.cur(st);
        if(N.I.certified && !N.I.allHold){ bad++; STG_LOG.push('   pfInduct ' + k + ': certified but fails at ' + N.I.firstFail); }
        if(!N.I.baseOK && N.I.certified){ bad++; STG_LOG.push('   pfInduct ' + k + ': certified without a base case'); }
      }
    });
    sok('pfInduct: no claim is ever certified and false', bad === 0, bad);
    var st = {}; S.enter(st, { claim:'offByOne', top:12 });
    sok('pfInduct: the sound-step-failed-base claim reports exactly that',
        S.cur(st).I.stepAllOK && !S.cur(st).I.baseOK && !S.cur(st).I.certified);
  })();

  /* 4 · pfDescent — the two searches, over every target and a sweep of Q.
     The default preset is √2, where a convergents-only route happens to be
     right; π at small Q is where it is not, so the sweep matters. */
  (function(){
    var S = STAGES.pfDescent, bad = 0, cases = 0, claims = 0;
    Object.keys(PF_TARGETS).forEach(function(k){
      [10, 40, 130, 400, 900].forEach(function(Q){
        var st = {}; S.enter(st, { target:k, Q:Q });
        var N = S.cur(st);
        cases++;
        if(!N.best.errAgree){ bad++; if(bad < 4) STG_LOG.push('   pfDescent ' + k + ' Q=' + Q + ': ' +
          N.best.A.p + '/' + N.best.A.q + ' vs ' + N.best.B.p + '/' + N.best.B.q); }
        /* claimOK is null where the declared limit is out of the search's
           reach — e's limit is zero and no feasible q shows it — and a null
           must not be read as a pass or as a failure */
        if(Q >= 400 && N.claimOK === false){ claims++; STG_LOG.push('   pfDescent ' + k + ': declared limit ' +
          PF_TARGETS[k].liminf + ', measured ' + N.measured); }
      });
    });
    sok('pfDescent: ' + cases + ' searches through the stage — brute force and continued fractions agree',
        bad === 0, bad);
    sok('pfDescent:   and every declared limit is recomputed from the search', claims === 0, claims);
    /* the three states must all actually occur, or "not checkable" would be
       quietly covering everything and the check would pass by vacuum */
    var states = {};
    Object.keys(PF_TARGETS).forEach(function(k){
      var stt = {}; S.enter(stt, { target:k, Q:900 });
      states[S.cur(stt).reach] = (states[S.cur(stt).reach] || 0) + 1;
    });
    sok('pfDescent:   a floor, a zero reached and a zero out of reach all occur',
        states.floor > 0 && states.zeroReached > 0 && states.zeroOutOfReach > 0,
        JSON.stringify(states));
    /* the negative control: corrupt a declared floor and watch it caught */
    var wasLim = PF_TARGETS.root2.liminf;
    PF_TARGETS.root2.liminf = 0.5;
    var stx = {}; S.enter(stx, { target:'root2', Q:900 });
    var caught = S.cur(stx).claimOK === false;
    PF_TARGETS.root2.liminf = wasLim;
    sok('pfDescent:   and a corrupted floor is caught by the recomputation', caught);
    var st = {}; S.enter(st, { target:'threeHalves', Q:60 });
    sok('pfDescent: a rational target is found exactly, an irrational one is not',
        S.cur(st).curve.exact !== null &&
        (function(){ var s2 = {}; S.enter(s2, { target:'root2', Q:900 }); return s2 && S.cur(s2).curve.exact === null; })());
  })();

  /* 5 · pfEuclid — every list shape, and the misstatement */
  (function(){
    var S = STAGES.pfEuclid, bad = 0;
    ['firstk', 'mullin', 'odds'].forEach(function(w){
      for(var k = 1; k <= 7; k++){
        var st = {}; S.enter(st, { which:w, k:k });
        var N = S.cur(st);
        if(!N.S.noneDivides || !N.S.agree){ bad++; STG_LOG.push('   pfEuclid ' + w + ' k=' + k + ' failed its own check'); }
        if(N.S.ok && N.S.newPrimes.length === 0){ bad++; STG_LOG.push('   pfEuclid ' + w + ' k=' + k + ' produced no new prime'); }
      }
    });
    sok('pfEuclid: twenty-one lists, and every one produces a prime it did not contain', bad === 0, bad);
    var st = {}; S.enter(st, { which:'firstk', k:6 });
    sok('pfEuclid: the sixth primorial plus one is 30031 = 59 × 509',
        S.cur(st).S.N === 30031 && S.cur(st).S.isPrime === false);
  })();

  /* 6 · pfSets — every identity on every triple, both routes */
  (function(){
    var S = STAGES.pfSets, bad = 0, cases = 0;
    Object.keys(PF_SET_LAWS).forEach(function(lk){
      Object.keys(PF_TRIOS).forEach(function(tk){
        [8, 16, 23].forEach(function(n){
          var st = {}; S.enter(st, { trio:tk, law:lk, n:n });
          var N = S.cur(st);
          cases++;
          if(!N.S.agree){ bad++; STG_LOG.push('   pfSets ' + lk + '/' + tk + ' n=' + n + ': mask and membership disagree'); }
          if(!N.IE.agree){ bad++; STG_LOG.push('   pfSets ' + tk + ' n=' + n + ': inclusion–exclusion disagrees with the count'); }
          if(!N.PS.agree){ bad++; STG_LOG.push('   pfSets ' + tk + ': power set count disagrees with the enumeration'); }
        });
      });
    });
    sok('pfSets: ' + cases + ' identity checks through the stage, on four triples and three universes',
        bad === 0, bad);
    /* the declared truth of each law, recomputed on the triple where the sets
       are large enough to separate them */
    var wrong = 0;
    Object.keys(PF_SET_LAWS).forEach(function(lk){
      var st = {}; S.enter(st, { trio:'classic', law:lk, n:20 });
      if(S.cur(st).S.claimOK !== true) wrong++;
    });
    sok('pfSets:   and every declared holds/fails flag is confirmed', wrong === 0, wrong);
  })();

  /* 7 · pfMap — the two counting formulas against enumeration, over a sweep */
  (function(){
    var S = STAGES.pfMap, bad = 0, cases = 0;
    Object.keys(PF_MAPS).forEach(function(mk){
      for(var m = 1; m <= 7; m++)
        for(var n = 1; n <= 5; n++){
          var st = {}; S.enter(st, { map:mk, m:m, n:n });
          var N = S.cur(st);
          cases++;
          if(!N.inj.agree || !N.surj.agree){ bad++; STG_LOG.push('   pfMap ' + mk + ' ' + m + '→' + n + ': a count disagrees with its enumeration'); }
          /* pigeonhole is a theorem, not a preference */
          if(m > n && N.M.injective){ bad++; STG_LOG.push('   pfMap ' + mk + ' ' + m + '→' + n + ': injective with m > n'); }
          if(N.M.bijective && m !== n){ bad++; STG_LOG.push('   pfMap ' + mk + ': bijective between sets of different size'); }
        }
    });
    sok('pfMap: ' + cases + ' maps through the stage — counts, enumerations and pigeonhole', bad === 0, bad);
  })();

  /* 8 · pfCount — both constructions, and a legend that keys on the mode */
  (function(){
    var S = STAGES.pfCount, bad = 0;
    for(var N = 4; N <= 14; N++){
      var st = {}; S.enter(st, { mode:'pair', N:N });
      if(!S.cur(st).P.bijection){ bad++; STG_LOG.push('   pfCount: pairing failed at N=' + N); }
      Object.keys(PF_LISTS).forEach(function(lk){
        var sd = {}; S.enter(sd, { mode:'diag', list:lk, N:N });
        var D = S.cur(sd).D;
        if(!D.allDiffer){ bad++; STG_LOG.push('   pfCount: the diagonal matched a row, ' + lk + ' N=' + N); }
        if(D.list.base === 10 && D.diag.some(function(d){ return d === 0 || d === 9; })){
          bad++; STG_LOG.push('   pfCount: a constructed digit was 0 or 9, ' + lk);
        }
      });
    }
    sok('pfCount: both constructions over eleven sizes and three lists', bad === 0, bad);
    var sp = {}, sd = {};
    S.enter(sp, { mode:'pair', N:8 }); S.enter(sd, { mode:'diag', N:8 });
    sok('pfCount: the legend keys on the mode rather than captioning the other picture',
        JSON.stringify(S.legend(sp)) !== JSON.stringify(S.legend(sd)));
  })();

  /* 9 · nothing in this wing may print undefined, NaN or Infinity */
  (function(){
    ['pfTable', 'pfQuant', 'pfInduct', 'pfDescent', 'pfEuclid', 'pfSets', 'pfMap', 'pfCount'].forEach(function(id){
      var S = STAGES[id];
      var st = {}; S.enter(st, {});
      var txt = '';
      try { txt = S.readout(st) + S.chip(st); }
      catch(e){ sok(id + ' renders without throwing', false, String(e)); return; }
      sok(id + ' renders without throwing', true);
      sok('  and prints no undefined/NaN/Infinity',
          !/undefined|NaN|Infinity/.test(txt), (txt.match(/undefined|NaN|Infinity/) || [''])[0]);
      var d;
      try { d = S.derive(st); } catch(e){ sok(id + ' builds its ladder', false, String(e)); return; }
      sok(id + ' builds its ladder', d && d.steps && d.steps.length > 4, d && d.steps && d.steps.length);
      sok(id + ' has a legend', S.legend(st).length > 0);
    });
  })();
})();


/* ============================================================================
   NUMERICAL LINEAR ALGEBRA — the five stages' own arithmetic  (wing C16)

   These call cur() directly on synthetic states, which is the only way to reach
   what the stages compute: the modules are numbered 78d and 78e, far outside
   the 21–49 window runtests extracts, and runall proves a stage RUNS rather
   than that it is right.

   The rule this block is written to: drive the presets the default is not.
   Every preset in all four tables is driven, and the two 3×3 matrices whose
   whole purpose is to break the diagonal-dominance rule of thumb are driven in
   both directions.
   ============================================================================ */
(function(){

  /* ---- nlFact: the factorisation, and both ways a solve goes wrong --------- */
  (function(){
    var S = STAGES.nlFact, bad = 0, worstResid = 0;
    Object.keys(NL_LU).forEach(function(key){
      [true, false].forEach(function(piv){
        var st = {}; S.enter(st, { key:key, pivot:piv });
        var N = S.cur(st);
        /* x by substitution against x by row reduction — two routes sharing
           only the matrix. Asserted only with PIVOTING ON, and the reason is
           the point of the stage rather than a convenience: laSolve pivots
           whatever this checkbox says, so with pivoting off the two routes are
           genuinely computing different things and the tiny-pivot preset makes
           them differ by 1. The first version of this test asserted agreement
           unconditionally and failed on exactly the preset that exists to break
           it — the assertion was wrong, not the stage. */
        if(piv && N.rref.x && N.x){
          var scale = Math.max.apply(null, N.x.map(Math.abs)) || 1;
          if(!(N.gapX / scale < 1e-8)){
            bad++;
            STG_LOG.push('   nlFact ' + key + ' pivot=true' +
                         ': substitution and RREF disagree by ' + N.gapX);
          }
        }
        /* where the unpivoted routes DO disagree, the stage must be reporting a
           large error too — a disagreement with a small reported error would
           mean the panel was hiding it */
        if(!piv && N.rref.x && N.x && Number.isFinite(N.gapX) && N.gapX > 1e-6 && !(N.err > 1e-6)){
          bad++;
          STG_LOG.push('   nlFact ' + key + ' pivot=false: routes differ by ' + N.gapX +
                       ' while the panel reports an error of only ' + N.err);
        }
        /* the determinant from the pivots against laDet, where the pivots exist */
        var ds = Math.max(Math.abs(N.det), Math.abs(N.detR));
        if(!N.broke && ds > 0 && Math.abs(N.det - N.detR) / ds > 1e-8){
          bad++;
          STG_LOG.push('   nlFact ' + key + ' pivot=' + piv + ': det routes disagree, ' +
                       N.det + ' vs ' + N.detR);
        }
        /* The backward-error identity: relErr ≤ κ · (backward error). The
           backward error is floored at ε whatever the computed residual comes
           out as — the `dep` preset returns a residual of EXACTLY zero, and
           reading the bound as κ·0 made it vacuously violated by any error at
           all. A zero residual does not mean a zero error, which is the
           stage's own headline. The factor of 4 is for the norm mismatch: both
           quantities are 2-norms and the theorem is stated in the ∞-norm. */
        if(Number.isFinite(N.RE.relErr) &&
           N.RE.relErr > 4 * N.kappa * Math.max(N.RE.relResid, 2.22e-16) + 1e-14){
          bad++;
          STG_LOG.push('   nlFact ' + key + ' pivot=' + piv + ': error exceeds κ·max(residual, ε), ' +
                       N.RE.relErr + ' vs ' + N.kappa * Math.max(N.RE.relResid, 2.22e-16));
        }
        if(piv) worstResid = Math.max(worstResid, N.R.gap / (N.R.scale || 1));
      });
    });
    sok('nlFact: every preset, pivoting on and off — two routes to x, two to det, and the κ bound',
        bad === 0, bad);
    sok('nlFact: with pivoting on, PA = LU holds to round-off on all six presets',
        worstResid < 1e-13, worstResid);

    /* the point of the tiny-pivot preset, asserted rather than described:
       the SAME matrix is solved exactly with pivoting and destroyed without,
       and its condition number is small, so κ cannot be the explanation */
    var son = {}, soff = {};
    S.enter(son, { key:'tiny', pivot:true });
    S.enter(soff, { key:'tiny', pivot:false });
    var A = S.cur(son), B = S.cur(soff);
    sok('nlFact: the tiny-pivot matrix is solved exactly with pivoting', A.err < 1e-12, A.err);
    sok('nlFact: and destroyed without it', B.err > 0.1, B.err);
    sok('nlFact: while κ stays small, so the failure is the algorithm and not the problem',
        A.kappa < 10 && Math.abs(A.kappa - B.kappa) < 1e-9, A.kappa);
    sok('nlFact: and the growth factor is what changed', B.Foff.growth / A.Fon.growth > 1e10,
        A.Fon.growth + ' -> ' + B.Foff.growth);

    /* Wilkinson: no swaps, every multiplier 1, growth exactly 2ⁿ⁻¹. The
       stage's preset declares growth 64, and this recomputes it. */
    var sw = {}; S.enter(sw, { key:'growth', pivot:true });
    var W = S.cur(sw);
    sok('nlFact: Wilkinson — partial pivoting makes no swaps', W.F.swaps === 0, W.F.swaps);
    sok('nlFact: every multiplier is 1', Math.abs(W.F.maxMult - 1) < 1e-14, W.F.maxMult);
    sok('nlFact: and the growth factor is 2ⁿ⁻¹ regardless',
        Math.abs(W.F.growth - Math.pow(2, W.n - 1)) < 1e-9, W.F.growth);

    /* the Hilbert preset is the mirror image: growth 1, error large */
    var sh = {}; S.enter(sh, { key:'hilb', pivot:true });
    var Hs = S.cur(sh);
    sok('nlFact: on Hilbert the algorithm is faultless — growth under 2', Hs.F.growth < 2, Hs.F.growth);
    /* measured 3.49e-13 against 9.96e-17, a factor of 3500 — the first version
       of this asserted "six orders" from an estimate rather than a measurement */
    sok('nlFact: and the error is still three orders above the residual',
        Hs.RE.relErr > 1e3 * Hs.RE.relResid, Hs.RE.relErr + ' vs ' + Hs.RE.relResid);
    /* and the withheld case: no factorisation without a swap, and the panel
       reports that rather than an infinity */
    var sb = {}; S.enter(sb, { key:'swap', pivot:false });
    var Bk = S.cur(sb);
    sok('nlFact: with pivoting off, the zero-pivot preset reports no factorisation at all',
        Bk.broke === true && Bk.x === null);
    sok('nlFact: and nothing derived from it is printed as a number',
        !/∞|Infinity/.test(S.readout(sb) + S.chip(sb)),
        (S.readout(sb).match(/∞|Infinity/) || [''])[0]);
    var sb2 = {}; S.enter(sb2, { key:'swap', pivot:true });
    sok('nlFact: and with pivoting on the same matrix factors normally',
        S.cur(sb2).broke === false && S.cur(sb2).err < 1e-12, S.cur(sb2).err);
  })();

  /* ---- nlQR: the three constructions, and the exponents ------------------- */
  (function(){
    var S = STAGES.nlQR, bad = 0;
    [4, 8, 12].forEach(function(n){
      [3, 5, 7].forEach(function(lk){
        var st = {}; S.enter(st, { n:n, lk:lk });
        var N = S.cur(st);
        /* the construction is checked before anything is concluded from it */
        if(Math.abs(N.kapMeas / N.kapNow - 1) > 1e-6){
          bad++;
          STG_LOG.push('   nlQR n=' + n + ' lk=' + lk + ': matrix has κ=' + N.kapMeas +
                       ' but was asked for ' + N.kapNow);
        }
        /* all three factor A correctly — the property that does NOT separate
           them, and the one a careless check would stop at */
        ['hh', 'mgs', 'cgs'].forEach(function(k){
          if(!(N.now[k].back < 1e-13)){
            bad++;
            STG_LOG.push('   nlQR ' + k + ' n=' + n + ' lk=' + lk + ': ‖A − QR‖ = ' + N.now[k].back);
          }
        });
        /* and the ordering that does separate them, at every κ above the floor */
        if(lk >= 5 && !(N.now.cgs.orth > N.now.mgs.orth && N.now.mgs.orth > N.now.hh.orth)){
          bad++;
          STG_LOG.push('   nlQR n=' + n + ' lk=' + lk + ': the three orthogonality errors are not ordered — ' +
                       N.now.cgs.orth + ' ' + N.now.mgs.orth + ' ' + N.now.hh.orth);
        }
      });
    });
    sok('nlQR: nine (n, κ) settings — κ as constructed, all three reconstructing A, and the ordering',
        bad === 0, bad);

    /* the measured exponents, which are the stage's headline claim. Ranges
       rather than points, and they come from a sweep of n = 5…12 recorded in
       tests.js: classical 1.67–2.09, modified 0.76–0.98, Householder ~0. */
    var st8 = {}; S.enter(st8, { n:8, lk:5 });
    var N8 = S.cur(st8);
    sok('nlQR: the classical Gram–Schmidt slope lands on 2', Math.abs(N8.slope.cgs - 2) < 0.35, N8.slope.cgs);
    sok('nlQR: the modified slope grows but stays under κ',
        N8.slope.mgs > 0.55 && N8.slope.mgs < 1.15, N8.slope.mgs);
    sok('nlQR: and Householder has no κ dependence', Math.abs(N8.slope.hh) < 0.15, N8.slope.hh);
    /* the fit must not be dragged by the ε floor: the first version of this
       measurement started at κ = 10² and read 1.63 instead of 2 */
    sok('nlQR: the sweep starts above the machine-ε floor', NL_QR_KAPPAS[0] >= 1e3, NL_QR_KAPPAS[0]);
  })();

  /* ---- nlCond: all three views ------------------------------------------- */
  (function(){
    var S = STAGES.nlCond, bad = 0;
    /* geometry: κ is the axis ratio, and |det| is the product of the σ */
    Object.keys(NL_COND_2).forEach(function(k){
      var st = {}; S.enter(st, { view:'ellipse', ckey:k });
      var N = S.cur(st);
      var prod = N.S.sigma[0] * N.S.sigma[1];
      if(Math.abs(Math.abs(N.det) - prod) / prod > 1e-10){
        bad++; STG_LOG.push('   nlCond ' + k + ': |det| ' + N.det + ' vs σ₁σ₂ ' + prod);
      }
      /* the bound is attained by construction, so this is an equality test */
      if(Math.abs(N.K.amp / N.kappa - 1) > 1e-4){
        bad++; STG_LOG.push('   nlCond ' + k + ': amplification ' + N.K.amp + ' does not attain κ ' + N.kappa);
      }
    });
    sok('nlCond ellipse: |det| = σ₁σ₂ and the perturbation bound is attained, on all four matrices',
        bad === 0, bad);
    /* the preset NAMES are claims about κ, and this is where they are checked */
    var stT = {}; S.enter(stT, { view:'ellipse', ckey:'thin' });
    sok('nlCond: the "κ = 19" preset has κ = 19', Math.abs(S.cur(stT).kappa - 19) < 0.05, S.cur(stT).kappa);
    var stN = {}; S.enter(stN, { view:'ellipse', ckey:'nearly' });
    var kn = S.cur(stN).kappa;
    sok('nlCond: the "nearly singular" preset really is — κ above 10³', kn > 1e3, kn);
    var stR = {}; S.enter(stR, { view:'ellipse', ckey:'round' });
    sok('nlCond: and the "well conditioned" one is not — κ under 3', S.cur(stR).kappa < 3, S.cur(stR).kappa);

    /* amplification: the worst direction attains κ, ordinary ones stay under */
    var stA = {}; S.enter(stA, { view:'amplify', an:6 });
    var NA = S.cur(stA), badA = 0;
    NA.rows.forEach(function(r){
      if(r.meas < 1e12 && Math.abs(r.amp / r.meas - 1) > 1e-3) badA++;
      r.others.forEach(function(o){ if(o > r.meas * (1 + 1e-6)) badA++; });
    });
    sok('nlCond amplify: the worst direction attains κ at every decade and nothing exceeds it',
        badA === 0, badA);

    /* residual against error: the residual must NOT grow with n and the error
       must, which is the entire content of the view */
    var stH = {}; S.enter(stH, { view:'resid', hn:12 });
    var NH = S.cur(stH);
    var first = NH.rows[0], last = NH.rows[NH.rows.length - 1];
    sok('nlCond resid: the residual stays at round-off across every size',
        NH.rows.every(function(r){ return r.resid < 1e-13; }),
        Math.max.apply(null, NH.rows.map(function(r){ return r.resid; })));
    sok('nlCond resid: the error grows by more than eight orders over the sweep',
        last.err / Math.max(first.err, 1e-18) > 1e8, first.err + ' -> ' + last.err);
    sok('nlCond resid: and never breaches the κ·ε ceiling',
        NH.rows.every(function(r){ return r.err <= r.kap * 2.22e-16 * 4 + 1e-14; }),
        NH.rows.filter(function(r){ return r.err > r.kap * 2.22e-16 * 4 + 1e-14; }).length);
    sok('nlCond resid: κ grows by roughly a factor of 15 per row',
        (function(){
          var ok2 = true;
          for(var i = 1; i < NH.rows.length; i++){
            var g = NH.rows[i].kap / NH.rows[i - 1].kap;
            if(!(g > 5 && g < 60)) ok2 = false;
          }
          return ok2;
        })());
  })();

  /* ---- nlIter: the rate, twice, on every preset --------------------------- */
  (function(){
    var S = STAGES.nlIter, bad = 0;
    Object.keys(NL_ITER).forEach(function(key){
      var st = {}; S.enter(st, { key:key, n:12, w:1.5, sweeps:300 });
      var N = S.cur(st);
      ['jacobi', 'gs', 'sor'].forEach(function(k){
        /* ρ(G) below 1 and the run converging must be the SAME answer. This is
           the two-route check the whole stage exists for: one route squares a
           matrix, the other sweeps equations, and neither knows the other. */
        var says = N.rho[k] < 1;
        var does = !N.runs[k].diverged;
        if(says !== does){
          bad++;
          STG_LOG.push('   nlIter ' + key + '/' + k + ': ρ = ' + N.rho[k] +
                       ' but the run ' + (does ? 'converged' : 'diverged'));
        }
        /* and where a rate could be fitted, the two must agree numerically */
        if(says && Number.isFinite(N.fit[k].rate) && Math.abs(N.fit[k].rate / N.rho[k] - 1) > 0.08){
          bad++;
          STG_LOG.push('   nlIter ' + key + '/' + k + ': fitted ' + N.fit[k].rate +
                       ' against ρ ' + N.rho[k]);
        }
      });
    });
    sok('nlIter: on every preset, ρ(G) and the run agree about convergence and about the rate',
        bad === 0, bad);

    /* Young's closed forms, on the one preset entitled to them */
    var sp = {}; S.enter(sp, { key:'poisson', n:16, w:1.5, sweeps:200 });
    var P = S.cur(sp);
    sok('nlIter: on the Poisson matrix ρ(Jacobi) = cos(π/(n+1))',
        Math.abs(P.rho.jacobi - Math.cos(Math.PI / (P.n + 1))) < 1e-8, P.rho.jacobi);
    sok('nlIter: ρ(Gauss–Seidel) is its square',
        Math.abs(P.rho.gs - P.rho.jacobi * P.rho.jacobi) < 1e-8, P.rho.gs);
    sok('nlIter: the golden-section minimum of ρ(ω) lands on Young\'s ω_opt',
        Math.abs(P.best.w - P.wOpt) < 5e-3, P.best.w + ' vs ' + P.wOpt);
    sok('nlIter: and the radius there is ω_opt − 1',
        Math.abs(P.best.rho - P.rhoOpt) < 5e-4, P.best.rho + ' vs ' + P.rhoOpt);
    sok('nlIter: the Poisson matrix is flagged as the one Young applies to', P.ordered === true);

    /* the two counterexamples, which are the reason the wing carries them */
    var sj = {}; S.enter(sj, { key:'jacOnly', w:1.5, sweeps:60 });
    var J = S.cur(sj);
    sok('nlIter: jacOnly — Jacobi\'s iteration matrix is nilpotent', J.rho.jacobi < 1e-6, J.rho.jacobi);
    sok('nlIter: jacOnly — and Gauss–Seidel diverges on it',
        J.rho.gs > 1 && J.runs.gs.diverged === true, J.rho.gs);
    var sg = {}; S.enter(sg, { key:'gsOnly', w:1.5, sweeps:60 });
    var G = S.cur(sg);
    sok('nlIter: gsOnly — exactly the other way round',
        G.rho.jacobi > 1 && G.rho.gs < 1 && G.runs.jacobi.diverged === true &&
        G.runs.gs.diverged === false,
        'jacobi ' + G.rho.jacobi + ' gs ' + G.rho.gs);
    sok('nlIter: neither counterexample is diagonally dominant, so no claim is made for them',
        J.dominant === false && G.dominant === false);
    var sd = {}; S.enter(sd, { key:'strict', w:1.5, sweeps:60 });
    var D = S.cur(sd);
    sok('nlIter: the dominant preset is dominant, and both methods converge on it',
        D.dominant === true && D.rho.jacobi < 1 && D.rho.gs < 1,
        D.rho.jacobi + ' ' + D.rho.gs);
    sok('nlIter: Young\'s closed form is withheld on every preset it does not apply to',
        !J.ordered && !G.ordered && !D.ordered && !Number.isFinite(J.wOpt));

    /* ω = 1 must reproduce Gauss–Seidel exactly — a check that the SOR split is
       the split it claims to be rather than something that merely resembles it */
    var s1 = {}; S.enter(s1, { key:'poisson', n:10, w:1, sweeps:80 });
    var O = S.cur(s1);
    sok('nlIter: SOR at ω = 1 is Gauss–Seidel to round-off',
        Math.abs(O.rho.sor - O.rho.gs) < 1e-9, O.rho.sor + ' vs ' + O.rho.gs);
  })();

  /* ---- nlKrylov ----------------------------------------------------------- */
  (function(){
    var S = STAGES.nlKrylov, bad = 0;
    [8, 16, 30].forEach(function(n){
      var st = {}; S.enter(st, { n:n, steps:120 });
      var N = S.cur(st);
      /* the closed-form κ against the SVD — the stage prints both */
      if(Math.abs(N.kap / N.kapMeas - 1) > 1e-9){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': κ ' + N.kap + ' vs measured ' + N.kapMeas);
      }
      /* no step outside its own bound */
      if(N.over > 1e-9){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': CG exceeded its bound by ' + N.over);
      }
      /* Monotone in the A-norm, ABOVE round-off. The stage's own check stops at
         1e-13 for a measured reason: after finite termination the iterates
         differ by noise about the exact answer, so the first version of this
         reported a rise at step n+1 at every size — the gate hitting its own
         floor rather than a defect. */
      if(!N.mono){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': A-norm error rose at step ' + N.roseAt);
      }
      /* finite termination */
      if(!(N.atN.err < 1e-9)){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': error at step n is ' + N.atN.err);
      }
      /* The advantage, measured the only way it is defined on this matrix.
         "Steps to 10⁻⁶" is null for steepest descent at every size the stage
         will run — its own bound needs 470 steps at n = 12 — so comparing step
         counts compared nothing, and the first version of this test passed
         vacuously on a `null`. Compare instead how many CG steps reach the
         error steepest descent finishes at. */
      if(!(N.matchSD !== null && N.matchSD * 2 < N.steps)){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': CG matched SD only at step ' + N.matchSD +
                            ' of ' + N.steps);
      }
      /* steepest descent inside its own, different bound */
      if(!N.SD.hist.every(function(p){ return p.err <= nlSDBound(N.kap, p.k) * (1 + 1e-9); })){
        bad++; STG_LOG.push('   nlKrylov n=' + n + ': steepest descent left its bound');
      }
    });
    sok('nlKrylov: three sizes — κ two ways, both bounds respected, monotone, and finite termination',
        bad === 0, bad);
    /* the advantage must GROW with n, since it is √κ against κ and κ ~ n².
       Measured as the factor by which CG needs fewer steps to reach the error
       steepest descent finishes the same run at. */
    var s1 = {}, s2 = {};
    S.enter(s1, { n:10, steps:120 }); S.enter(s2, { n:36, steps:120 });
    var a = S.cur(s1), b = S.cur(s2);
    /* Measured as the ratio of steps-per-decade, not as "how far each one got":
       the first version of this divided by steepest descent's finishing error
       and read 12× at n = 10 against 4.6× at n = 36 — SHRINKING — because the
       larger problem simply left steepest descent less far along. That is a
       measurement of the run length, not of the methods, and the assertion was
       right to fail on it. */
    sok('nlKrylov: the CG advantage over steepest descent widens as n grows',
        b.advantage > 2 * a.advantage,
        a.advantage + '× at n=10, ' + b.advantage + '× at n=36');
    sok('nlKrylov: and steepest descent needs steps proportional to κ',
        Math.abs((b.decSD / a.decSD) / (b.kap / a.kap) - 1) < 0.25,
        'decades ratio ' + (b.decSD / a.decSD) + ' against κ ratio ' + (b.kap / a.kap));
    /* and CG must beat its own bound, on this spectrum, by a wide margin —
       superlinear convergence, which the ladder now states rather than the
       bound being presented as a prediction */
    sok('nlKrylov: CG beats its Chebyshev bound at step n by more than a hundredfold',
        nlCGBound(b.kap, b.n) / Math.max(b.atN.err, 1e-300) > 100,
        nlCGBound(b.kap, b.n) + ' vs ' + b.atN.err);
  })();

  /* ---- nothing in this wing may print undefined, NaN or Infinity ---------- */
  (function(){
    ['nlFact', 'nlQR', 'nlCond', 'nlIter', 'nlKrylov'].forEach(function(id){
      var S = STAGES[id];
      var st = {}; S.enter(st, {});
      var txt = '';
      try { txt = S.readout(st) + S.chip(st); }
      catch(e){ sok(id + ' renders without throwing', false, String(e)); return; }
      sok(id + ' renders without throwing', true);
      sok('  and prints no undefined/NaN/Infinity',
          !/undefined|NaN|Infinity/.test(txt), (txt.match(/undefined|NaN|Infinity/) || [''])[0]);
      var d;
      try { d = S.derive(st); } catch(e){ sok(id + ' builds its ladder', false, String(e)); return; }
      sok(id + ' builds its ladder', d && d.steps && d.steps.length > 4, d && d.steps && d.steps.length);
      sok(id + ' has a legend', S.legend(st).length > 0);
    });
  })();
})();
/* ============================================================================
   STATISTICAL INFERENCE (wing C14) — snEst, snLike, snCI, snTest, snBayes

   Everything simulated here is compared against a closed form ON THE SCALE OF
   THE SIMULATION'S OWN STANDARD ERROR, at 4 se — a 6e-5 event — with every
   seed fixed, so none of these flicker.

   Two disciplines from MASTER-PLAN §3.3a are applied throughout, because both
   defects they describe were available in this wing:

   (a) A CONDITION WITH A "NO RESULT" BRANCH MAY NEVER HAVE RUN. The uniform
       family's blocks below assert that the thing expected to fail actually
       was evaluated, and the counters are asserted non-zero.
   (b) THE DEFAULT PRESET IS WHERE A DEFECT HIDES. Every stage is driven
       through every view and every preset its controls can reach, not through
       the state its author left it in.
   ========================================================================== */
(function(){
  /* ---- every stage, every view, every preset: renders and says nothing
     meaningless. This is the sweep that catches a view whose readout was
     written for a different branch's `cur` shape. ---------------------------- */
  (function(){
    var cases = [];
    Object.keys(SN_FAMS).forEach(function(f){
      ['dist', 'rate'].forEach(function(v){
        cases.push(['snEst', { fam:f, est:'mean', view:v, n:6, trials:1500 }]);
      });
      /* and every estimator that applies to that family */
      Object.keys(SN_ESTS).forEach(function(e){
        if(SN_ESTS[e].only && SN_ESTS[e].only !== f) return;
        cases.push(['snEst', { fam:f, est:e, n:7, trials:1200 }]);
      });
      ['curve', 'info', 'asym'].forEach(function(v){
        cases.push(['snLike', { fam:f, view:v, n:12, trials:600 }]);
      });
    });
    Object.keys(SN_MEAN_CIS).forEach(function(k){
      cases.push(['snCI', { mode:'mean', kind:k, n:4, trials:1200 }]);
      cases.push(['snCI', { mode:'mean', kind:k, n:40, trials:1200 }]);
    });
    Object.keys(SN_PROP_CIS).forEach(function(m){
      cases.push(['snCI', { mode:'prop', method:m, n:12, p:0.1 }]);
      cases.push(['snCI', { mode:'prop', method:m, n:12, p:0.9 }]);
    });
    ['null', 'power', 'multi'].forEach(function(v){
      cases.push(['snTest', { view:v, n:5, trials:800, m:6 }]);
    });
    Object.keys(SN_PAIRS).forEach(function(p){
      cases.push(['snTest', { view:'perm', pair:p }]);
      cases.push(['snTest', { view:'perm', pair:p, shift:2.5 }]);
    });
    Object.keys(SN_PRIORS).forEach(function(p){
      cases.push(['snBayes', { view:'post', prior:p, k:3, n:9 }]);
      /* the two ends of the range, where a likelihood is one-sided and a
         Wald-style interval collapses — the presets a default never visits */
      cases.push(['snBayes', { view:'post', prior:p, k:0, n:9 }]);
      cases.push(['snBayes', { view:'post', prior:p, k:9, n:9 }]);
    });
    cases.push(['snBayes', { view:'wash', prior:'sceptic', priorB:'keen', prop:0.5 }]);
    cases.push(['snBayes', { view:'wash', prior:'flat', priorB:'jeff', prop:0.4 }]);
    cases.push(['snBayes', { view:'diag', prev:0.001 }]);
    cases.push(['snBayes', { view:'diag', prev:0.4 }]);

    var bad = 0, ran = 0;
    cases.forEach(function(c){
      var S = STAGES[c[0]], st = {};
      S.enter(st, c[1]);
      var txt;
      try { txt = S.readout(st) + S.chip(st); }
      catch(e){ bad++; sok(c[0] + ' renders at ' + JSON.stringify(c[1]), false, String(e)); return; }
      ran++;
      if(/undefined|NaN|Infinity/.test(txt)){
        bad++;
        sok(c[0] + ' prints no undefined/NaN/Infinity at ' + JSON.stringify(c[1]), false,
            (txt.match(/.{0,60}(undefined|NaN|Infinity).{0,40}/) || [''])[0]);
      }
      var d;
      try { d = S.derive(st); }
      catch(e){ bad++; sok(c[0] + ' builds its ladder at ' + JSON.stringify(c[1]), false, String(e)); return; }
      if(!(d && d.steps && d.steps.length > 4)){
        bad++; sok(c[0] + ' ladder has substance at ' + JSON.stringify(c[1]), false,
                   d && d.steps && d.steps.length);
      }
      if(!(S.legend(st).length > 0)){ bad++; sok(c[0] + ' has a legend at ' + JSON.stringify(c[1]), false); }
    });
    /* the sweep must actually have swept — a `cases` list that silently came
       out empty would pass every assertion above without running one */
    sok('infer: the preset sweep ran on every case', ran === cases.length && cases.length > 60,
        ran + ' of ' + cases.length);
    sok('infer: no stage/view/preset combination misbehaves', bad === 0, bad + ' findings');
  })();

  /* ---- snEst: the simulated sampling distribution against its closed form,
     for every pair that declares one -------------------------------------- */
  (function(){
    var checked = 0, off = 0;
    Object.keys(SN_FAMS).forEach(function(f){
      Object.keys(SN_ESTS).forEach(function(e){
        var E = SN_ESTS[e];
        if(E.only && E.only !== f) return;
        if(E.approx) return;                  /* the median's form is asymptotic */
        var st = {};
        STAGES.snEst.enter(st, { fam:f, est:e, n:11, trials:12000, seed:20260819 });
        var N = STAGES.snEst.cur(st);
        if(!N.D.truth) return;
        checked++;
        var okMean = Math.abs(N.D.stats.mean - N.D.truth.mean) < 4 * N.D.biasSE;
        var okVar = Math.abs(N.D.vari - N.D.truth.vari) < 4 * N.D.varSE;
        if(!okMean || !okVar){
          off++;
          sok('snEst ' + f + '/' + e + ' matches its closed form', false,
              'mean ' + N.D.stats.mean + ' vs ' + N.D.truth.mean +
              '  var ' + N.D.vari + ' vs ' + N.D.truth.vari);
        }
      });
    });
    /* §3.3a(a): the loop must have found pairs to check. A `truth` that
       returned null everywhere would make the block above vacuously perfect. */
    sok('snEst: the closed-form comparison ran on a real set of pairs', checked >= 8, checked);
    sok('snEst: every pair with a closed form agrees with it within 4 se', off === 0, off);
  })();

  /* ---- snEst: the RATE, which is −1 everywhere except where the bound fails */
  (function(){
    var st = {};
    STAGES.snEst.enter(st, { fam:'normal', est:'mean', n:9, trials:2000, view:'rate' });
    var reg = STAGES.snEst.cur(st).slope;
    sok('snEst: a regular family gives a 1/n mean squared error', Math.abs(reg + 1) < 0.2, reg);
    var st2 = {};
    STAGES.snEst.enter(st2, { fam:'unif', est:'maxAdj', n:9, trials:2000, view:'rate' });
    var edge = STAGES.snEst.cur(st2).slope;
    sok('snEst: the adjusted maximum on a uniform gives 1/n² instead',
        Math.abs(edge + 2) < 0.25, edge);
    /* and the two must genuinely differ — asserting each separately would pass
       if some caching bug returned the same sweep for both */
    sok('snEst: and the two rates are different by about a whole power of n',
        reg - edge > 0.6, 'regular ' + reg + '  edge ' + edge);
    /* 2x̄ is unbiased on the same family and does NOT get the fast rate — the
       comparison that shows the rate belongs to the estimator, not the family */
    var st3 = {};
    STAGES.snEst.enter(st3, { fam:'unif', est:'twice', n:9, trials:2000, view:'rate' });
    var slow = STAGES.snEst.cur(st3).slope;
    sok('snEst: but 2x̄ on the SAME family is back to 1/n — the rate is the ' +
        'estimator’s, not the family’s', Math.abs(slow + 1) < 0.2, slow);
  })();

  /* ---- snLike: the grid maximum finds the MLE on every family ------------- */
  (function(){
    var checked = 0;
    Object.keys(SN_FAMS).forEach(function(f){
      var st = {};
      STAGES.snLike.enter(st, { fam:f, n:30, seed:4242, trials:400 });
      var N = STAGES.snLike.cur(st);
      checked++;
      /* the grid resolves to one step, so that is the tolerance — measured
         from the grid rather than guessed */
      sok('snLike ' + f + ': the grid peak finds the closed-form MLE',
          Math.abs(N.C.gridMax - N.mle) <= 1.5 * N.C.step ||
          /* the uniform's MLE is the sample maximum, which may sit outside the
             drawn window; then the grid peak is the window edge nearest it and
             the honest check is that it is not beyond the MLE */
          (f === 'unif' && N.C.gridMax >= N.mle - 1.5 * N.C.step),
          'grid ' + N.C.gridMax + ' closed ' + N.mle + ' step ' + N.C.step);
    });
    sok('snLike: every family was driven', checked === Object.keys(SN_FAMS).length, checked);
  })();

  /* ---- snLike: the information identity holds where its hypothesis does,
     and FAILS where it does not — both asserted, and both counted ---------- */
  (function(){
    var agree = 0, disagree = 0;
    Object.keys(SN_FAMS).forEach(function(f){
      var st = {};
      STAGES.snLike.enter(st, { fam:f, n:25, seed:777, trials:3000, view:'info' });
      var F = STAGES.snLike.cur(st).Fi;
      var okScore = Math.abs(F.scoreVar - F.closed) < 4 * F.scoreVarSE;
      if(SN_FAMS[f].regular){
        if(okScore) agree++;
        else sok('snLike ' + f + ': Var[score] equals n·I(θ)', false,
                 F.scoreVar + ' vs ' + F.closed + ' se ' + F.scoreVarSE);
      } else {
        /* the identity must be seen to BREAK. A silent pass here would mean
           the wing is claiming a failure the arithmetic does not produce. */
        if(!okScore) disagree++;
        else sok('snLike ' + f + ': the identity is supposed to FAIL on this family', false,
                 'it agreed: ' + F.scoreVar + ' vs ' + F.closed);
      }
    });
    sok('snLike: the identity holds on all four regular families', agree === 4, agree);
    sok('snLike: and demonstrably fails on the one that breaks its hypothesis',
        disagree === 1, disagree);
    /* the bound is beaten there, which is the claim the readout makes */
    var su = {};
    STAGES.snLike.enter(su, { fam:'unif', n:20, th:2, trials:1500 });
    var Fu = STAGES.snLike.cur(su).Fi;
    sok('snLike: and the MLE-based estimator beats the Cramér–Rao bound there',
        SN_ESTS.maxAdj.truth(20, { th:2 }, 'unif').vari < Fu.crb,
        SN_ESTS.maxAdj.truth(20, { th:2 }, 'unif').vari + ' vs ' + Fu.crb);
    sok('snLike: while a regular family sits ON its bound, not under it',
        (function(){
          var sn = {};
          STAGES.snLike.enter(sn, { fam:'normal', n:20, th:0.5, sd:1, trials:3000 });
          var Fn = STAGES.snLike.cur(sn).Fi;
          var v = Fn.mleStats.vari;
          return v > Fn.crb * 0.9 && v < Fn.crb * 1.15;
        })());
  })();

  /* ---- snCI: coverage against closed forms, at several n ----------------- */
  (function(){
    [3, 5, 12, 30].forEach(function(n){
      var st = {};
      STAGES.snCI.enter(st, { mode:'mean', n:n, level:0.95, trials:12000, seed:9001 });
      var N = STAGES.snCI.cur(st);
      sok('snCI n=' + n + ': the σ-known interval covers at exactly the stated level',
          Math.abs(N.runs.zKnown.cover - 0.95) < 4 * N.runs.zKnown.se, N.runs.zKnown.cover);
      sok('snCI n=' + n + ': the t interval does too',
          Math.abs(N.runs.t.cover - 0.95) < 4 * N.runs.t.se, N.runs.t.cover);
      /* the two-route check: the plug-in interval's coverage has a closed form */
      sok('snCI n=' + n + ': the plug-in interval matches 2F_t(z) − 1',
          Math.abs(N.runs.zPlugin.cover - N.pluginExact) < 4 * N.runs.zPlugin.se,
          'sim ' + N.runs.zPlugin.cover + ' exact ' + N.pluginExact);
      /* and it must actually be SHORT at small n — otherwise the row above is
         satisfied by an interval that has nothing wrong with it */
      if(n <= 5)
        sok('snCI n=' + n + ': and it really is short of the claim',
            N.pluginExact < 0.93, N.pluginExact);
      else if(n >= 30)
        sok('snCI n=' + n + ': while at this n the shortfall has nearly closed',
            N.pluginExact > 0.94, N.pluginExact);
    });
  })();

  /* ---- snCI: exact proportion coverage against a simulation of it -------- */
  (function(){
    var seen = 0;
    Object.keys(SN_PROP_CIS).forEach(function(m){
      [0.08, 0.3, 0.62].forEach(function(p){
        var st = {};
        STAGES.snCI.enter(st, { mode:'prop', method:m, n:18, p:p, level:0.95,
                                trials:20000, seed:6060 });
        var N = STAGES.snCI.cur(st);
        seen++;
        sok('snCI ' + m + ' at p=' + p + ': the exact sum and the simulation agree',
            Math.abs(N.exact - N.sim.cover) < 4 * Math.max(N.sim.se, 1e-4),
            'exact ' + N.exact + ' sim ' + N.sim.cover);
      });
    });
    sok('snCI: the proportion sweep covered every method at every p', seen === 12, seen);
    /* the guarantee that names the method, and the failure that names the other */
    var sc = {};
    STAGES.snCI.enter(sc, { mode:'prop', method:'clopper', n:18, p:0.3, level:0.95 });
    var NC = STAGES.snCI.cur(sc);
    sok('snCI: Clopper–Pearson never falls below the level anywhere in p',
        NC.mins.clopper >= 0.95 - 1e-12, NC.mins.clopper);
    sok('snCI: Wald does, and badly', NC.mins.wald < 0.5, NC.mins.wald);
    sok('snCI: Wilson dips too, but an order of magnitude less far',
        NC.mins.wilson > 0.75 && NC.mins.wilson < 0.95,
        NC.mins.wilson);
  })();

  /* ---- snTest: every rate on the stage, against its closed form ---------- */
  (function(){
    [0.01, 0.05, 0.1].forEach(function(a){
      var st = {};
      STAGES.snTest.enter(st, { view:'null', n:7, alpha:a, trials:12000, seed:4242 });
      var N = STAGES.snTest.cur(st);
      sok('snTest α=' + a + ': the false-alarm rate is α',
          Math.abs(N.R.rate - a) < 4 * N.R.rateSE, N.R.rate);
      sok('snTest α=' + a + ': and the p-values are uniform, so it is right at every α',
          N.R.ks < N.R.ksCrit, 'ks ' + N.R.ks + ' crit ' + N.R.ksCrit);
    });
    /* power: closed form against simulation, at three effect sizes */
    [0, 0.6, 1.6].forEach(function(d){
      var st = {};
      STAGES.snTest.enter(st, { view:'power', n:14, delta:d, sigma:2, alpha:0.05,
                                trials:12000, seed:313 });
      var N = STAGES.snTest.cur(st);
      sok('snTest power at δ=' + d + ': closed form and run agree',
          Math.abs(N.here - N.hereSim.power) < 4 * Math.max(N.hereSim.se, 1e-4),
          'closed ' + N.here + ' sim ' + N.hereSim.power);
    });
    var sz = {};
    STAGES.snTest.enter(sz, { view:'power', n:14, delta:0, sigma:2, alpha:0.05 });
    sok('snTest: power at zero effect is exactly α — the curve starts at α',
        Math.abs(STAGES.snTest.cur(sz).here - 0.05) < 1e-9);
    /* multiplicity: the closed form, and the two corrections holding */
    var sm = {};
    STAGES.snTest.enter(sm, { view:'multi', n:6, m:15, alpha:0.05, trials:3000, seed:5511 });
    var M = STAGES.snTest.cur(sm).at;
    sok('snTest: the family-wise rate matches 1 − (1−α)^m',
        Math.abs(M.none.fwer - M.closed) < 4 * M.none.se,
        'sim ' + M.none.fwer + ' closed ' + M.closed);
    sok('snTest: Bonferroni holds it at or below α', M.bonf.fwer < 0.05 + 4 * M.bonf.se, M.bonf.fwer);
    sok('snTest: Holm holds it too and rejects at least as often',
        M.holm.fwer < 0.05 + 4 * M.holm.se && M.holm.perRun >= M.bonf.perRun,
        M.holm.fwer + ' / ' + M.holm.perRun + ' vs ' + M.bonf.perRun);
    /* permutation: exact enumeration against sampling, on every preset */
    var enumerated = 0;
    Object.keys(SN_PAIRS).forEach(function(p){
      var st = {};
      STAGES.snTest.enter(st, { view:'perm', pair:p });
      var N = STAGES.snTest.cur(st);
      if(!N.ex.ok) return;
      enumerated++;
      sok('snTest perm/' + p + ': sampled agrees with the full enumeration',
          Math.abs(N.ex.p - N.sm.p) < 4 * Math.max(N.sm.se, 1 / 20000),
          'exact ' + N.ex.p + ' sampled ' + N.sm.p);
      sok('snTest perm/' + p + ': the exact p is a whole multiple of 1/total',
          Math.abs(N.ex.p * N.ex.total - Math.round(N.ex.p * N.ex.total)) < 1e-9, N.ex.p);
      sok('snTest perm/' + p + ': and its null distribution was actually built',
          N.dist && N.dist.length === N.ex.total, N.dist && N.dist.length);
    });
    sok('snTest: every permutation preset was small enough to enumerate',
        enumerated === Object.keys(SN_PAIRS).length, enumerated);
    /* the preset that exists because the two tests disagree — asserted, so the
       demo prose cannot quietly stop being true */
    var so = {};
    STAGES.snTest.enter(so, { view:'perm', pair:'outlier' });
    var O = STAGES.snTest.cur(so);
    sok('snTest: on the outlier preset the permutation test is significant and t is not',
        O.ex.p < 0.05 && O.tt.p > 0.1, 'perm ' + O.ex.p + ' t ' + O.tt.p);
    var sc2 = {};
    STAGES.snTest.enter(sc2, { view:'perm', pair:'clear' });
    var C = STAGES.snTest.cur(sc2);
    sok('snTest: while on the clear preset they agree — which is what makes the ' +
        'disagreement above worth showing', C.ex.p < 0.05 && C.tt.p < 0.05,
        'perm ' + C.ex.p + ' t ' + C.tt.p);
  })();

  /* ---- snBayes: the posterior by two routes, on every prior and at the ends
     of the data range where a likelihood is one-sided --------------------- */
  (function(){
    var checked = 0;
    Object.keys(SN_PRIORS).forEach(function(pr){
      [[0, 8], [3, 8], [8, 8], [14, 25]].forEach(function(d){
        var st = {};
        STAGES.snBayes.enter(st, { view:'post', prior:pr, k:d[0], n:d[1], level:0.95 });
        var N = STAGES.snBayes.cur(st);
        checked++;
        /* the grid is 2000 midpoint cells; its own error on a smooth posterior
           is ~1e-7, which sets the tolerance rather than a guess */
        sok('snBayes ' + pr + ' ' + d[0] + '/' + d[1] + ': grid and conjugate means agree',
            Math.abs(N.G.mean - N.B.mean) < 1e-5,
            'grid ' + N.G.mean + ' closed ' + N.B.mean);
        sok('snBayes ' + pr + ' ' + d[0] + '/' + d[1] + ': and their variances',
            Math.abs(N.G.vari - N.B.vari) < 1e-7, N.G.vari + ' vs ' + N.B.vari);
        /* the credible interval, two routes, to within a grid cell */
        sok('snBayes ' + pr + ' ' + d[0] + '/' + d[1] + ': credible interval by two routes',
            Math.abs(N.Ig[0] - N.Ib[0]) < 3 / N.G.N && Math.abs(N.Ig[1] - N.Ib[1]) < 3 / N.G.N,
            N.Ig + ' vs ' + N.Ib);
        /* the blend identity is exact, so it gets an exact tolerance */
        sok('snBayes ' + pr + ' ' + d[0] + '/' + d[1] + ': the weighted average IS the mean',
            Math.abs(N.Bl.blend - N.Bl.exact) < 1e-12, N.Bl.blend + ' vs ' + N.Bl.exact);
      });
    });
    sok('snBayes: the posterior sweep covered every prior at every count', checked === 16, checked);
  })();

  /* ---- snBayes: the two wash-out rates, which are the view's whole subject */
  (function(){
    var st = {};
    STAGES.snBayes.enter(st, { view:'wash', prior:'sceptic', priorB:'keen', prop:0.5 });
    var N = STAGES.snBayes.cur(st);
    sok('snBayes wash: the posterior MEANS converge like 1/n',
        Math.abs(N.meanRate + 1) < 0.06, N.meanRate);
    sok('snBayes wash: the DISTRIBUTIONS converge only like 1/√n',
        Math.abs(N.tvRate + 0.5) < 0.06, N.tvRate);
    sok('snBayes wash: so the two rates genuinely differ',
        N.meanRate < N.tvRate - 0.35, N.meanRate + ' vs ' + N.tvRate);
    sok('snBayes wash: every point sits at exactly the proportion requested',
        N.W.every(function(q){ return q.exact; }),
        N.W.filter(function(q){ return !q.exact; }).map(function(q){ return q.x; }).join(','));
    /* a proportion with a different denominator must snap to a different step */
    var s5 = {};
    STAGES.snBayes.enter(s5, { view:'wash', prior:'flat', priorB:'keen', prop:0.4 });
    var N5 = STAGES.snBayes.cur(s5);
    sok('snBayes wash: at p = 2/5 the sweep steps by 5 and stays exact',
        N5.W[0].x === 5 && N5.W.every(function(q){ return q.exact; }), N5.W[0].x);
  })();

  /* ---- snBayes: the diagnostic, by rule and by counting ------------------ */
  (function(){
    [[0.001, 0.99, 0.95], [0.01, 0.95, 0.99], [0.3, 0.8, 0.8]].forEach(function(c){
      var st = {};
      STAGES.snBayes.enter(st, { view:'diag', prev:c[0], sens:c[1], spec:c[2] });
      var N = STAGES.snBayes.cur(st);
      sok('snBayes diag ' + c.join('/') + ': Bayes and the counted cohort agree',
          Math.abs(N.D.post - N.D.counted) < 1e-5,
          'bayes ' + N.D.post + ' counted ' + N.D.counted);
      sok('snBayes diag ' + c.join('/') + ': the cohort adds up to the population',
          N.D.tp + N.D.fp + N.D.fn + N.D.tn === N.D.pop,
          N.D.tp + N.D.fp + N.D.fn + N.D.tn);
    });
    /* the headline: a positive on an excellent test, on a rare condition */
    var sr = {};
    STAGES.snBayes.enter(sr, { view:'diag', prev:0.001, sens:0.99, spec:0.95 });
    var R = STAGES.snBayes.cur(sr);
    sok('snBayes diag: a 99%-sensitive test returns a positive that is wrong 98% of the time',
        R.D.post < 0.03, R.D.post);
    sok('snBayes diag: and the break-even prevalence is a few percent',
        R.breakEven > 0.02 && R.breakEven < 0.1, R.breakEven);
    /* …and at high prevalence the same test is trustworthy — the pair is what
       shows the answer belongs to the disease rather than to the test */
    var sh = {};
    STAGES.snBayes.enter(sh, { view:'diag', prev:0.4, sens:0.99, spec:0.95 });
    sok('snBayes diag: while at 40% prevalence the same test is over 90% reliable',
        STAGES.snBayes.cur(sh).D.post > 0.9, STAGES.snBayes.cur(sh).D.post);
  })();

  /* ---- EVERY CACHE KEY COVERS EVERY FIELD ITS enter() SETS ---------------
     snTest shipped with `own` and `sheet` missing from its key, because they
     were added to enter() after the key was written. The result is a control
     that accepts input and changes nothing — which looks exactly like a
     control that was never wired, and is what ./auditcustom.ps1 reported it
     as. The defect is not specific to that stage; it is available to any of
     the five the moment a field is added, so it is gated for all of them.

     The check perturbs one field at a time and asserts the cache MISSES. */
  (function(){
    var stages = ['snEst', 'snLike', 'snCI', 'snTest', 'snBayes'];
    var missed = 0, probed = 0;
    stages.forEach(function(id){
      var S = STAGES[id];
      var base = {}; S.enter(base, {});
      Object.keys(base).forEach(function(f){
        if(f.charAt(0) === '_') return;
        var v = base[f];
        var alt;
        if(typeof v === 'number') alt = v + (Number.isInteger(v) ? 1 : 0.25);
        else if(typeof v === 'boolean') alt = !v;
        else if(typeof v === 'string' && f === 'sheet') alt = String(v) + '\n1 2 3';
        else return;                 /* enum strings are covered by the preset sweep */
        var st = {}; S.enter(st, {});
        S.cur(st);
        var k1 = st._snc && st._snc.key;
        st[f] = alt;
        S.cur(st);
        var k2 = st._snc && st._snc.key;
        probed++;
        if(k1 === k2){
          missed++;
          sok(id + ': its cache key covers the field “' + f + '”', false,
              'changing ' + f + ' from ' + v + ' to ' + alt + ' left the key identical');
        }
      });
    });
    /* §3.3a(a): a probe that examined no fields would pass silently */
    sok('infer: the cache-key probe examined a real set of fields', probed >= 30, probed);
    sok('infer: no stage caches on a key that ignores one of its own inputs',
        missed === 0, missed);
  })();

  /* ---- PROSE THAT NAMES A COMPUTED PARAMETER MUST READ IT, NOT RESTATE IT --
     The grid under the posterior stopped being a fixed 2000 cells when the
     count began following √n, and seven sentences across the stage panel, the
     derivation ladder and the demo list went on saying "2000 cells" and "700
     cells" for as long as they were literals. Nothing could see it: the
     arithmetic was right, so runstagetests, auditsides and auditclaims were all
     green, and the only defect was that the page described a different program
     from the one it was running.

     A literal cannot be distinguished from a correct number by reading one
     render — it is only wrong RELATIVE to a second one. So the gate renders
     each panel at two sizes and asserts the figure both MATCHES the engine and
     MOVES. A restated constant fails the second half however right it looks.

     Corrupted once before being trusted: pinning the derive note back to a
     literal 2000 failed the "moves" assertion at n = 5000, and pinning it to
     the wrong engine call failed the "matches" one. */
  (function(){
    var savedST = ST;
    /* the count the engine will use, asked without running the quadrature */
    var wantSmall = snGridN(25, 2000), wantBig = snGridN(5000, 2000);
    sok('snBayes: the two probe sizes really do want different grids',
        wantSmall !== wantBig, wantSmall + ' vs ' + wantBig);

    /* every integer of three digits or more that the rendered text contains */
    var ints = function(s){
      return (String(s).replace(/<[^>]*>/g, ' ').match(/\d[\d,]{2,}/g) || [])
        .map(function(t){ return parseInt(t.replace(/,/g, ''), 10); });
    };
    var renderBayes = function(n){
      var st = {}; STAGES.snBayes.enter(st, { view:'post', prior:'jeff', k:14, n:n });
      var d = STAGES.snBayes.derive(st);
      var txt = d.note + ' ' + d.steps.map(function(s){
        return [s.lbl, s.eq, s.sub, s.prose].filter(Boolean).join(' ');
      }).join(' ');
      ST = st;
      try { txt += ' ' + STAGES.snBayes.controls(); } catch(e){ txt += ' controls-threw:' + e; }
      return { txt:txt, cells:STAGES.snBayes.cur(st).G.cells };
    };
    var A = renderBayes(25), B = renderBayes(5000);
    ST = savedST;

    sok('snBayes: the engine grid follows √n rather than sitting at a constant',
        A.cells === wantSmall && B.cells === wantBig, A.cells + ' / ' + B.cells);
    sok('snBayes: the panels PRINT the cell count they actually used (n = 25)',
        ints(A.txt).indexOf(A.cells) >= 0, A.cells + ' not among ' + ints(A.txt).join(','));
    sok('snBayes: the panels PRINT the cell count they actually used (n = 5000)',
        ints(B.txt).indexOf(B.cells) >= 0, B.cells + ' not among ' + ints(B.txt).join(','));
    /* the half that a stale literal fails: the figure has to MOVE */
    sok('snBayes: and no panel still carries the count as a fixed literal',
        ints(B.txt).indexOf(A.cells) < 0,
        'the n = 25 count ' + A.cells + ' still appears at n = 5000');
    sok('snBayes: nothing claims midpoint alone RESOLVES the endpoint singularity',
        !/midpoint never (looks at|evaluates)[^.]*\.(?![^.]*sin)/i.test(A.txt) &&
        !/never (looks at|evaluates) them\./i.test(A.txt), '');

    /* the same class on the likelihood stage: a grid whose size is a literal in
       one sentence and an argument in the code, plus a peak whose refinement
       the prose omitted entirely while the readout reported it */
    var sl = {}; STAGES.snLike.enter(sl, { fam:'uniform', view:'curve', n:40 });
    ST = sl;
    var lc = '';
    try { lc = STAGES.snLike.controls(); } catch(e){ lc = 'controls-threw:' + e; }
    ST = savedST;
    var C = STAGES.snLike.cur(sl).C;
    sok('snLike: the help text prints the grid it actually walked',
        ints(lc).indexOf(C.pts.length - 1) >= 0, (C.pts.length - 1) + ' / ' + ints(lc).join(','));
    sok('snLike: and says which refinement located the peak, not just the grid',
        C.how === 'raw' || /parabola|bisect/i.test(lc), C.how);
  })();

  /* ---- the wing's own verdict formatter, as the stages call it ----------- */
  (function(){
    /* the property that makes it the right formatter here: it must be able to
       call a SMALL gap a disagreement and a LARGER one agreement */
    var small = snAgreeMC(1.0, 1.0004, 1e-5);
    var large = snAgreeMC(1.0, 1.06, 0.5);
    sok('infer: snAgreeMC calls a 4e-4 gap at 40σ a disagreement',
        /larger than sampling/.test(small), small);
    sok('infer: and a 0.06 gap at 0.12σ agreement — the opposite of their sizes',
        /inside the noise/.test(large), large);
    /* No stage may print a DIFFERENCE through a formatter that cannot scale it
       — the J9 signature, a residual rendered as a bare "0".

       The first version of this check looked for `<span class="v">0</span>`
       anywhere in the readout and flagged snEst, correctly finding a bare zero
       and wrongly calling it a defect: the row was "what it is aiming at", and
       the normal family's default μ IS 0. A parameter that happens to be zero
       is not an unscaled residual. So the check reads the LABEL and applies
       only to rows that claim to be a comparison. */
    var stges = ['snEst', 'snLike', 'snCI', 'snTest', 'snBayes'];
    var bad = 0, rowsSeen = 0, diffRows = 0;
    var isDiff = /compared|difference|shortfall|bias|gap|against|the two/i;
    stges.forEach(function(id){
      var st = {}; STAGES[id].enter(st, {});
      var txt = STAGES[id].readout(st);
      var re = /<span class="k">([\s\S]*?)<\/span><span class="v">([\s\S]*?)<\/span>/g, m;
      while((m = re.exec(txt))){
        rowsSeen++;
        if(!isDiff.test(m[1])) continue;
        diffRows++;
        /* a difference row must carry a scale: a verdict phrase, a percentage,
           or an explicit "×" of the simulation's own error */
        if(/^\s*(0|−?0(\.0+)?)\s*$/.test(m[2])){
          bad++;
          sok(id + ' — “' + m[1] + '” prints an unscaled zero', false, m[2]);
        }
      }
    });
    /* §3.3a(a) again: a regex that matched no rows would pass this silently */
    sok('infer: the readout scan actually parsed rows', rowsSeen > 40, rowsSeen);
    sok('infer: and found difference rows to check', diffRows >= 5, diffRows);
    sok('infer: no stage prints a bare unscaled zero as a difference', bad === 0, bad);
  })();
})();

/* ---- report ---------------------------------------------------------------- */
(function(){
  var t = document.createElement('div');
  t.id = 'STAGEREPORT';
  t.textContent = STG_LOG.join('\n') +
    '\n===STAGETESTS=== ' + STG_PASS + ' passed, ' + STG_FAIL + ' failed';
  document.body.appendChild(t);
})();

