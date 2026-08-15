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

/* ---- rlOrbit.setup: every preset must actually orbit ----------------------
   The ISCO preset spent its whole life plunging (Newtonian L seed) while the
   readout printed the NaN as perfect agreement. setup() now carries the
   turning-point L; each preset's integrated orbit must reach a second
   perihelion, and in the weak field it must land on the first-order formula
   (measured 2026-08-15: gap 3.8e-13 rad on 5.0e-7 — tolerance 1e-4 rel).   */
(function(){
  var systems = ['mercury', 'strong', 'isco'];
  for(var i = 0; i < systems.length; i++){
    var st = { sys:systems[i], e:0.2 };
    var S = STAGES.rlOrbit.setup(st);
    sok('rlOrbit ' + systems[i] + ' has a bound orbit at e = 0.2 (L exists)',
        Number.isFinite(S.L), S.L);
    if(!Number.isFinite(S.L)) continue;
    var res = grOrbitIntegrate(S.GM, S.L, 1 / (S.a * (1 + S.e)), 0, 2 * Math.PI / 4000, 32000, true);
    var adv = grPeriapsisAngle(res) - 2 * Math.PI;
    sok('rlOrbit ' + systems[i] + ' reaches a second perihelion inside 16π',
        Number.isFinite(adv) && adv > 0, adv);
    if(systems[i] === 'mercury' && Number.isFinite(adv)){
      var f = grPrecessionPerOrbit(S.GM, S.a, S.e);
      sok('rlOrbit mercury: integrated precession lands on 6πGM/(c²a(1−e²))',
          Math.abs(adv - f) / f < 1e-4, adv + ' vs ' + f);
    }
  }
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

/* ---- report ---------------------------------------------------------------- */
(function(){
  var t = document.createElement('div');
  t.id = 'STAGEREPORT';
  t.textContent = STG_LOG.join('\n') +
    '\n===STAGETESTS=== ' + STG_PASS + ' passed, ' + STG_FAIL + ' failed';
  document.body.appendChild(t);
})();
