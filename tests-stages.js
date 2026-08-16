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

/* ---- report ---------------------------------------------------------------- */
(function(){
  var t = document.createElement('div');
  t.id = 'STAGEREPORT';
  t.textContent = STG_LOG.join('\n') +
    '\n===STAGETESTS=== ' + STG_PASS + ' passed, ' + STG_FAIL + ' failed';
  document.body.appendChild(t);
})();
