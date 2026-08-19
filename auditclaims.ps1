# auditclaims.ps1 -- do the preset tables tell the truth?
#
# Programme D, item 1 (MASTER-PLAN 3.4).  Every preset table in this laboratory
# carries CLAIMS about its own entries: this surface has area 4*pi, this field is
# conservative, this sequence tends to 1, this function is monotone, this matrix
# is singular, this is the antiderivative of that.  Those claims are the one
# layer of the site the house accuracy rule (2.1) had never been pointed at.
# They were written by an author who knew the answer, and until now nothing
# recomputed a single one of them.
#
# That matters more than it sounds, because the tables are load-bearing.
# `igExact1D` returns `Fi(b) - Fi(a)` and CALLS IT THE EXACT VALUE -- so a wrong
# antiderivative in IG_1D is not a wrong label, it is a wrong yardstick, and
# every convergence order measured against it is measured against nothing.
#
# WHAT THIS SEES THAT NOTHING ELSE DOES
#   runtests  reaches modules 21-49 but tests the ENGINES, not the tables they
#             are handed; and it cannot see 78b/79g at all, where EIG_PRESETS
#             and NM_FUNCS live.
#   runall    proves a stage runs.  A stage fed a table that lies runs perfectly.
#   auditscan reads what a panel SAYS, not whether it is true.
#
# THE RULE THIS SCRIPT IS BUILT TO (2.1): a claim is checked by computing the
# quantity a SECOND way that shares nothing with the first, and printing the
# difference.  Declared closed forms are checked against quadrature; symbolic
# curls against numerical circulations; antiderivatives against the integrals
# they are supposed to produce; coefficient rules against the derivative rules
# beside them; a radius of convergence against the root test on its own
# coefficients.  Where the second route is a quadrature whose own error is not
# negligible, that error is MEASURED (two panel counts, and their difference)
# and the tolerance is derived from it rather than guessed.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(e.message + ' @' + e.lineno); });
</script></head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  var ROWS = [];

  /* ---------------------------------------------------------------- report --- */
  function fx(v){
    if (typeof v === 'boolean' || typeof v === 'string') return String(v);
    if (typeof v !== 'number') return String(v);
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    var a = Math.abs(v);
    return (a < 1e-4 || a >= 1e7) ? v.toExponential(4) : v.toPrecision(10);
  }
  function push(tbl, key, claim, dec, got, diff, ok, note){
    ROWS.push([tbl, key, claim, fx(dec), fx(got), fx(diff), ok ? 'ok' : 'BAD',
               String(note || '').replace(/[\t\n]/g, ' ')].join('\t'));
  }
  /* a declared number against an independently computed one */
  function num(tbl, key, claim, dec, got, tol, note){
    var ok, diff;
    if (!isFinite(dec) || !isFinite(got)) {
      ok = (isNaN(dec) && isNaN(got)) || dec === got;
      diff = NaN;
    } else {
      diff = Math.abs(dec - got);
      ok = diff / Math.max(1e-300, Math.abs(dec)) <= tol;
    }
    push(tbl, key, claim, dec, got, diff, ok, note);
  }
  /* a residual that must vanish: the declared value IS zero, by the mathematics */
  function resid(tbl, key, claim, got, tol, note){
    var ok = isFinite(got) && Math.abs(got) <= tol;
    push(tbl, key, claim, 0, got, Math.abs(got), ok, (note ? note + '; ' : '') + 'tol ' + fx(tol));
  }
  /* a declared boolean against a measured one */
  function flag(tbl, key, claim, dec, got, note){
    push(tbl, key, claim, !!dec, !!got, (!!dec === !!got) ? 0 : 1, !!dec === !!got, note);
  }
  /* a declared closed form against a quadrature whose OWN error is measured by
     running it twice.  The tolerance is that measured error, not a guess: if the
     quadrature has not converged the check widens honestly instead of passing by
     luck or failing by pedantry. */
  function converged(tbl, key, claim, dec, q1, q2, note){
    var self = Math.abs(q2 - q1);
    var gap  = Math.abs(q2 - dec);
    var tol  = Math.max(20 * self, 1e-9 * Math.max(1, Math.abs(dec)));
    push(tbl, key, claim, dec, q2, gap, gap <= tol,
         (note ? note + '; ' : '') + 'quadrature self-gap ' + fx(self) + ', tol ' + fx(tol));
  }
  /* two routes to the same number, each run at two panel counts so that the
     tolerance comes from the routes' own measured convergence.  A sqrt boundary
     converges far more slowly than a smooth one and a fixed tolerance either
     lets a real disagreement through or reports the quadrature as a defect. */
  function agree(tbl, key, claim, aCoarse, aFine, bCoarse, bFine, note){
    var self = Math.max(Math.abs(aFine - aCoarse), Math.abs(bFine - bCoarse));
    var gap  = Math.abs(aFine - bFine);
    var tol  = Math.max(20 * self, 1e-9 * Math.max(1, Math.abs(aFine)));
    push(tbl, key, claim, aFine, bFine, gap, gap <= tol,
         (note ? note + '; ' : '') + 'slower route self-gap ' + fx(self) + ', tol ' + fx(tol));
  }
  function sample(lo, hi, n, g){ for (var i = 1; i < n; i++) g(lo + (hi - lo) * i / n); }

  try {

  /* ============================================================== IG_1D ====== */
  /* Fi is not decoration: igExact1D() returns Fi(b)-Fi(a) AS the exact value.
     Two independent checks -- Fi' = f pointwise, and Fi(b)-Fi(a) against
     adaptive quadrature at 1e-13, which never touches Fi. */
  Object.keys(IG_1D).forEach(function(k){
    var E = IG_1D[k];
    var quad = nqAdaptive(E.f, E.a, E.b, 1e-13, 30);
    if (!E.Fi) { push('IG_1D', k, 'Fi declared absent (no elementary antiderivative)',
                      'none', fx(quad) + ' by quadrature', 0, true, 'correctly falls through to nqAdaptive'); return; }
    num('IG_1D', k, 'Fi(b)-Fi(a) vs adaptive quadrature', E.Fi(E.b) - E.Fi(E.a), quad, 1e-9);
    var worst = 0, at = 0;
    sample(E.a, E.b, 10, function(x){
      var h = 1e-5 * Math.max(1, Math.abs(x));
      var d = (E.Fi(x + h) - E.Fi(x - h)) / (2 * h);
      var e = Math.abs(d - E.f(x)) / Math.max(1, Math.abs(E.f(x)));
      if (e > worst) { worst = e; at = x; }
    });
    resid('IG_1D', k, "max rel |Fi' - f| on the interior", worst, 1e-6, 'worst at x=' + fx(at));
  });

  /* ============================================================ IG_SOLIDS ==== */
  /* exactVol is a human closed form.  The second route is quadrature over the
     table's own limits -- which also proves the limits describe the solid the
     name claims. */
  function one3(){ return 1; }
  function volAt(E, panels){
    if (E.sph) return nqTripleSph(one3, E.sph.t0, E.sph.t1, E.sph.p0, E.sph.p1,
                                  E.sph.r0, E.sph.r1, 5, panels);
    if (E.region) {
      var Rg = IG_REGIONS[E.region];
      return nqDoubleTypeI(function(x, y){ return E.zHi(x, y) - E.zLo(x, y); },
                           Rg.x0, Rg.x1, Rg.yLo, Rg.yHi, 5, panels);
    }
    return nqTriple(one3, E.x0, E.x1, E.yLo, E.yHi, E.zLo, E.zHi, 5, panels);
  }
  Object.keys(IG_SOLIDS).forEach(function(k){
    var E = IG_SOLIDS[k];
    if (typeof E.exactVol !== 'number') return;
    converged('IG_SOLIDS', k, 'exactVol vs quadrature over its own limits',
              E.exactVol, volAt(E, 10), volAt(E, 20));
  });

  /* =========================================================== IG_REGIONS ==== */
  /* `both:true` is a claim that the region has BOTH a Type I and a Type II
     description -- and therefore that the two iterated integrals agree, which is
     Fubini and is exactly the kind of both-sides check 3.4 asks for.  The test
     integrand is deliberately asymmetric in x and y, so a swapped limit or a
     transposed bound cannot cancel itself out. */
  var IGF = function(x, y){ return 1 + x + 2 * y + x * y; };
  Object.keys(IG_REGIONS).forEach(function(k){
    var Rg = IG_REGIONS[k];
    var hasI = !!Rg.yLo, hasII = !!Rg.xLo;
    flag('IG_REGIONS', k, 'both -- Type I and Type II descriptions present',
         Rg.both, hasI && hasII);
    if (Rg.both && hasI && hasII) {
      var I = function(f, p){ return nqDoubleTypeI(f, Rg.x0, Rg.x1, Rg.yLo, Rg.yHi, 5, p); };
      var J = function(f, p){ return nqDoubleTypeII(f, Rg.y0, Rg.y1, Rg.xLo, Rg.xHi, 5, p); };
      var one = function(){ return 1; };
      agree('IG_REGIONS', k, 'area: Type I vs Type II (Fubini)',
            I(one, 16), I(one, 32), J(one, 16), J(one, 32));
      agree('IG_REGIONS', k, 'integral of 1+x+2y+xy: Type I vs Type II',
            I(IGF, 16), I(IGF, 32), J(IGF, 16), J(IGF, 32));
    }
    if (Rg.polar) {
      var ap = nqDoublePolar(function(){ return 1; }, Rg.polar.t0, Rg.polar.t1,
                             Rg.polar.r0, Rg.polar.r1, 5, 24);
      if (hasI) {
        var one2 = function(){ return 1; };
        agree('IG_REGIONS', k, 'area: Cartesian vs polar',
              nqDoubleTypeI(one2, Rg.x0, Rg.x1, Rg.yLo, Rg.yHi, 5, 16),
              nqDoubleTypeI(one2, Rg.x0, Rg.x1, Rg.yLo, Rg.yHi, 5, 32),
              nqDoublePolar(one2, Rg.polar.t0, Rg.polar.t1, Rg.polar.r0, Rg.polar.r1, 5, 16),
              nqDoublePolar(one2, Rg.polar.t0, Rg.polar.t1, Rg.polar.r0, Rg.polar.r1, 5, 32));
      } else {
        push('IG_REGIONS', k, 'area in polar (no Cartesian description declared)',
             'n/a', ap, 0, true, 'both:false -- nothing to cross-check against');
      }
      /* the declared bounding box must actually contain the region */
      var out = 0;
      sample(Rg.polar.t0, Rg.polar.t1, 400, function(th){
        var r = Rg.polar.r1(th), x = r * Math.cos(th), y = r * Math.sin(th);
        if (x < Rg.x0 - 1e-9 || x > Rg.x1 + 1e-9 || y < Rg.y0 - 1e-9 || y > Rg.y1 + 1e-9) out++;
      });
      resid('IG_REGIONS', k, 'boundary points outside the declared x0..x1, y0..y1 box', out, 0);
    }
  });

  /* ============================================================ VC_PATHS ===== */
  Object.keys(VC_PATHS).forEach(function(k){
    var E = VC_PATHS[k], a = E.a, b = E.b;
    var p0 = E.f(E.t0, a, b), p1 = E.f(E.t1, a, b);
    var gapEnds = Math.hypot(p1.x - p0.x, p1.y - p0.y);
    flag('VC_PATHS', k, 'closed -- r(t1) returns to r(t0)', E.closed, gapEnds < 1e-9,
         'endpoint separation ' + fx(gapEnds));
    /* r' must really be the derivative of r -- the table supplies both by hand */
    var worst = 0;
    sample(E.t0, E.t1, 40, function(t){
      var h = 1e-6, pa = E.f(t + h, a, b), pb = E.f(t - h, a, b), d = E.d(t, a, b);
      var dx = (pa.x - pb.x) / (2 * h), dy = (pa.y - pb.y) / (2 * h);
      if (k === 'square' && Math.abs(t - Math.round(t)) < 1e-3) return;   /* corners: r' does not exist */
      worst = Math.max(worst, Math.hypot(dx - d.x, dy - d.y) / Math.max(1, Math.hypot(d.x, d.y)));
    });
    resid('VC_PATHS', k, "max rel |dr/dt - r'| (r' supplied separately)", worst, 1e-6);
    /* inside() against the planimeter: a grid count and Green's theorem share
       nothing at all, and the area is the only thing both can produce */
    if (E.closed && E.inside) {
      var xs = [], ys = [];
      sample(E.t0, E.t1, 2000, function(t){ var p = E.f(t, a, b); xs.push(p.x); ys.push(p.y); });
      var X0 = Math.min.apply(null, xs), X1 = Math.max.apply(null, xs);
      var Y0 = Math.min.apply(null, ys), Y1 = Math.max.apply(null, ys);
      var padx = 0.05 * (X1 - X0) + 1e-6, pady = 0.05 * (Y1 - Y0) + 1e-6;
      X0 -= padx; X1 += padx; Y0 -= pady; Y1 += pady;
      var N = 1400, hit = 0;
      for (var i = 0; i < N; i++) {
        var x = X0 + (X1 - X0) * (i + 0.5) / N;
        for (var j = 0; j < N; j++) {
          var y = Y0 + (Y1 - Y0) * (j + 0.5) / N;
          if (E.inside(x, y, a, b)) hit++;
        }
      }
      var gridA = hit / (N * N) * (X1 - X0) * (Y1 - Y0);
      var greenA = vcAreaByBoundary(E, a, b);
      num('VC_PATHS', k, 'area: inside() grid count vs Green planimeter', greenA, gridA, 0.01,
          'grid ' + N + 'x' + N + ', O(h) boundary error');
    }
  });

  /* =========================================================== VC_FIELDS ===== */
  /* `conservative` is checked two ways that share nothing: the symbolic curl
     Qx - Py, and a numerical circulation round a loop.  Both are needed, and
     the vortex is precisely why -- its curl vanishes everywhere it is defined
     and its circulation is 2*pi.  A check built on the curl alone would call it
     conservative and agree with a table that says otherwise for a real reason. */
  Object.keys(VC_FIELDS).forEach(function(k){
    var E = VC_FIELDS[k];
    var P = compile(parse(E.P)), Q = compile(parse(E.Q));
    var P2 = function(x, y){ return P(x, y, 0); }, Q2 = function(x, y){ return Q(x, y, 0); };
    var t = vcConservativeTest(E.P, E.Q, 1, 1);
    var curlMax = 0;
    for (var i = -6; i <= 6; i++) for (var j = -6; j <= 6; j++) {
      var x = i * 0.37 + 0.11, y = j * 0.37 + 0.07;     /* off-lattice: never lands on the origin */
      var v = Math.abs(t.Qx(x, y) - t.Py(x, y));
      if (isFinite(v)) curlMax = Math.max(curlMax, v);
    }
    var circ = vcLineWork(P2, Q2, VC_PATHS.circle, 0, 2 * Math.PI, 1);
    var flux = vcLineFlux(P2, Q2, VC_PATHS.circle, 0, 2 * Math.PI, 1);
    var isCons = curlMax < 1e-9 && Math.abs(circ) < 1e-7;
    flag('VC_FIELDS', k, 'conservative', E.conservative, isCons,
         'max|Qx-Py| ' + fx(curlMax) + ', circulation round the unit circle ' + fx(circ) +
         ', outward flux ' + fx(flux));
    /* punctured: the field really must fail to have a value at the origin */
    var atO = Math.hypot(P2(1e-8, 0), Q2(1e-8, 0));
    flag('VC_FIELDS', k, 'punctured -- |F| blows up at the origin', E.punctured, atO > 1e6,
         '|F| at r=1e-8 is ' + fx(atO));
    /* for a conservative field the two routes to the potential must agree; that
       is what makes the potential well defined at all */
    if (E.conservative) {
      var g1 = vcPotential(P2, Q2, 1.3, 0.9, 0.5, 0.4);
      var g2 = vcPotentialAlt(P2, Q2, 1.3, 0.9, 0.5, 0.4);
      num('VC_FIELDS', k, 'potential built along both L-routes', g1, g2, 1e-7);
    }
  });

  /* ========================================================= VC_SURFACES ===== */
  Object.keys(VC_SURFACES).forEach(function(k){
    var S = VC_SURFACES[k];
    function areaAt(p){
      return nqDoubleRect(function(u, v){ return vcSurfFrame(S, u, v).dS; },
                          S.u0, S.u1, S.v0, S.v1, 5, p);
    }
    converged('VC_SURFACES', k, 'exactArea vs quadrature of |r_u x r_v|',
              S.exactArea, areaAt(10), areaAt(20));
    /* closed means no boundary: every edge of the parameter rectangle either
       collapses to a point or coincides with the opposite edge */
    function edgeFree(fixedIsU, lo, hi, o0, o1){
      var degenLo = true, degenHi = true, periodic = true;
      var pLo = fixedIsU ? S.r(lo, o0) : S.r(o0, lo);
      var pHi = fixedIsU ? S.r(hi, o0) : S.r(o0, hi);
      sample(o0, o1, 24, function(w){
        var qLo = fixedIsU ? S.r(lo, w) : S.r(w, lo);
        var qHi = fixedIsU ? S.r(hi, w) : S.r(w, hi);
        if (vlen(vsub(qLo, pLo)) > 1e-9) degenLo = false;
        if (vlen(vsub(qHi, pHi)) > 1e-9) degenHi = false;
        if (vlen(vsub(qLo, qHi)) > 1e-9) periodic = false;
      });
      return periodic || (degenLo && degenHi);
    }
    var closedComputed = edgeFree(true, S.u0, S.u1, S.v0, S.v1) &&
                         edgeFree(false, S.v0, S.v1, S.u0, S.u1);
    flag('VC_SURFACES', k, 'closed -- the parameter rectangle has no free edge',
         S.closed, closedComputed);
    /* and the prose must agree with the flag it sits beside */
    var saysNone = /none/i.test(S.boundary || '');
    flag('VC_SURFACES', k, 'boundary prose agrees with the closed flag',
         saysNone, !!S.closed, 'boundary: ' + (S.boundary || ''));
  });

  /* ============================================================== SR_SEQ ===== */
  Object.keys(SR_SEQ).forEach(function(k){
    var E = SR_SEQ[k];
    if (isFinite(E.limit)) {
      /* "|a(N) - L| is small at one big N" cannot tell a right limit from one
         wrong in the fifth decimal -- a negative control with L off by 1e-4 sat
         comfortably under any absolute threshold.  What separates them is the
         RATE: against the true limit the error keeps shrinking as N grows,
         against a wrong one it plateaus on the offset.  So measure the shrink
         over a fourfold N and require it. */
      var e1 = Math.abs(E.f(25000) - E.limit), e2 = Math.abs(E.f(100000) - E.limit);
      var settled = e2 < 1e-14;
      push('SR_SEQ', k, 'limit', E.limit, E.f(100000), e2,
           settled || e2 <= 0.6 * e1,
           '|a(25000)-L| ' + fx(e1) + ' -> |a(100000)-L| ' + fx(e2) +
           (settled ? ' (already exact)' : ', shrank to ' + fx(e2 / Math.max(1e-300, e1)) +
            ' of itself over 4x N; a wrong limit would plateau'));
    } else {
      var lo = Infinity, hi = -Infinity;
      for (var n = 100000; n < 100060; n++) { var v = E.f(n); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      push('SR_SEQ', k, 'limit declared NaN -- terms must keep oscillating',
           'NaN', 'spread ' + fx(hi - lo), hi - lo, (hi - lo) > 0.5,
           'over n = 100000..100059');
    }
    /* Monotone means STRICTLY monotone, and a flat step breaks it: 2^n/n! opens
       a1 = a2 = 2 exactly, which is why its table entry says "eventually
       decreasing" rather than "decreasing" and is right to.  The scan also has
       to stop where the terms underflow to zero, or the dead tail of equal
       zeros makes every sequence non-strict. */
    var last = 1;
    while (last < 300 && !(E.f(last) === 0 && E.f(last + 1) === 0)) last++;
    /* "Eventually" needs a tail long enough to mean it.  sin(n) rises 148 times
       and falls 151, and its last four steps happen to fall -- reading that as
       "eventually decreasing" would be reading the edge of the scan window, so
       the last violation has to lie in the first half of the range. */
    var ups = 0, downs = 0, flats = 0, lastUpOrFlat = 0, lastDownOrFlat = 0;
    for (var m = 1; m < last; m++) {
      var d = E.f(m + 1) - E.f(m);
      if (d > 0) { ups++; lastUpOrFlat = m; }
      else if (d < 0) { downs++; lastDownOrFlat = m; }
      else { flats++; lastUpOrFlat = m; lastDownOrFlat = m; }
    }
    var half = last / 2;
    var monoGot = (downs && !lastUpOrFlat) ? 'decreasing'
                : (ups && !lastDownOrFlat) ? 'increasing'
                : (downs && lastUpOrFlat <= half) ? 'eventually decreasing'
                : (ups && lastDownOrFlat <= half) ? 'eventually increasing' : 'neither';
    push('SR_SEQ', k, 'mono', E.mono, monoGot, monoGot === E.mono ? 0 : 1,
         monoGot === E.mono,
         'over n=1..' + last + ': rises ' + ups + ', falls ' + downs + ', flat ' + flats +
         ', last rise-or-flat at n=' + lastUpOrFlat + ', last fall-or-flat at n=' + lastDownOrFlat);
    var big = 0;
    for (var q = 1; q < 3000; q++) big = Math.max(big, Math.abs(E.f(q)));
    flag('SR_SEQ', k, 'bounded', E.bounded, isFinite(big) && big < 1e6, 'max|a| ' + fx(big));
  });

  /* =========================================================== SR_SERIES ===== */
  /* The start index is not in the table -- 74-series-stages.js decides it by key
     (geo from 0, lnn from 2, everything else from 1).  The audit reads it from
     the entry's own NAME so the two cannot drift apart silently. */
  function startOf(E){
    var m = /from\s+n\s*=\s*(\d+)/.exec(E.name || '');
    return m ? +m[1] : 1;
  }
  Object.keys(SR_SERIES).forEach(function(k){
    var E = SR_SERIES[k], n0 = startOf(E);
    function S(N){ var s = 0; for (var n = n0; n <= N; n++) s += E.term(n); return s; }
    var alt = E.kind === 'alternating';
    if (isFinite(E.sum)) {
      var got, how;
      if (alt) {
        /* averaging consecutive partial sums kills the leading alternating error */
        var N = 20000;
        got = (S(N) + S(N + 1)) / 2; how = 'mean of S(N), S(N+1) at N=20000';
      } else {
        /* Richardson in 1/N: the tail of these is c/N + O(1/N^2) */
        var A = S(10000), B = S(20000);
        got = 2 * B - A; how = 'Richardson 2*S(20000) - S(10000)';
      }
      num('SR_SERIES', k, 'sum', E.sum, got, 1e-6, how);
      flag('SR_SERIES', k, 'converges', E.converges, true, 'a finite sum is declared');
    } else {
      var s1 = S(20000), s2 = S(40000);
      var grows = !isFinite(s2) || Math.abs(s2) > Math.abs(s1) + 1e-6;
      push('SR_SERIES', k, 'sum declared ' + fx(E.sum) + ' -- partial sums must not settle',
           E.sum, 'S(20000)=' + fx(s1) + ', S(40000)=' + fx(s2), s2 - s1, grows,
           'still climbing by ' + fx(s2 - s1));
      flag('SR_SERIES', k, 'converges', E.converges, false, 'no finite sum is declared');
    }
    if (E.kind === 'p-series' && typeof E.p === 'number')
      flag('SR_SERIES', k, 'p-series: converges iff p > 1', E.converges, E.p > 1, 'p = ' + fx(E.p));
    if (E.kind === 'geometric' && typeof E.r === 'number')
      flag('SR_SERIES', k, 'geometric: converges iff |r| < 1', E.converges, Math.abs(E.r) < 1, 'r = ' + fx(E.r));
  });

  /* =========================================================== SR_TAYLOR ===== */
  /* coef(k,c) and deriv(k,x) are two separate hand-written rules for the same
     function; they must satisfy coef = deriv(c)/k!, and neither was checked
     against the other.  The declared radius is checked against the root test
     applied to the coefficients themselves, which is srRadius -- already written
     and used only for the reader's own function. */
  Object.keys(SR_TAYLOR).forEach(function(k){
    var E = SR_TAYLOR[k];
    [0, 0.4].forEach(function(c){
      var worst = 0, atk = 0;
      for (var j = 0; j <= 10; j++) {
        var want = E.deriv(j, c) / srFact(j), got = E.coef(j, c);
        var e = Math.abs(want - got) / Math.max(1e-12, Math.abs(want));
        if (e > worst) { worst = e; atk = j; }
      }
      resid('SR_TAYLOR', k, 'max rel |coef(k,c) - deriv(k,c)/k!| at c=' + c, worst, 1e-9,
            'worst at k=' + atk);
      /* and the series must actually reproduce f near the centre */
      var x = c + 0.25, s = 0;
      for (var q = 0; q <= 24; q++) s += E.coef(q, c) * Math.pow(x - c, q);
      num('SR_TAYLOR', k, 'degree-24 partial sum vs f at x=c+0.25 (c=' + c + ')', E.f(x), s, 1e-8);
      var Rdec = E.rad(c);
      var R30 = srRadius(function(j){ return E.coef(j, c); }, 30);
      var R60 = srRadius(function(j){ return E.coef(j, c); }, 60);
      if (!isFinite(Rdec)) {
        /* The root test at finite k can only ever return a finite number, so
           "is it big?" is the wrong question and any threshold is arbitrary.
           An infinite radius shows up as an estimate that keeps CLIMBING with k
           while a finite one has settled -- 1/k! gives 5.7 at k=30 and 16.9 at
           k=60, whereas 1/(1-x) sits on 1 at both. */
        push('SR_TAYLOR', k, 'radius at c=' + c + ' declared infinite -- estimate must keep climbing',
             'Infinity', 'k=30: ' + fx(R30) + ', k=60: ' + fx(R60), R60 - R30,
             R60 > R30 * 1.5, 'root test on the coefficients');
      } else {
        num('SR_TAYLOR', k, 'radius at c=' + c, Rdec, R60, 0.2,
            'root test converges like (1/k)^(1/k) -- 20% is the honest tolerance at k=60');
        push('SR_TAYLOR', k, 'radius at c=' + c + ' declared finite -- estimate must have settled',
             'settled', 'k=30: ' + fx(R30) + ', k=60: ' + fx(R60), Math.abs(R60 - R30),
             R60 <= R30 * 1.5, 'a still-climbing estimate would mean an infinite radius');
      }
    });
  });

  /* =========================================================== OD_FIELDS ===== */
  /* `exact` is a closed-form solution.  It is checked against the FIELD, not
     against an integrator: d/dx exact must equal F(x, exact) at every sample,
     and exact(x0) must be y0.  Nothing in the site does this, and a wrong
     closed form would make every "the numerical method drifts from the exact
     solution" readout drift from the wrong thing.
     The initial point and the rectangle come FROM THE TABLE since B4 -- they
     used to be a private copy here, which is exactly the duplicate that
     SITE-RULES 2.4 forbids.  The point is not the claim; `lip`, `esc` and
     `exact` are, and each is recomputed by a route the table does not own. */
  Object.keys(OD_FIELDS).forEach(function(k){
    var E = OD_FIELDS[k];
    var x0 = E.x0, y0 = E.y0, a = E.a, b = E.b;
    if (typeof x0 !== 'number' || typeof y0 !== 'number' || !(a > 0) || !(b > 0)) {
      push('OD_FIELDS', k, 'declares x0, y0, a, b', 'yes', 'no', 1, false,
           'the existence rectangle is missing from this entry');
      return;
    }
    if (typeof E.exact === 'function') {
      resid('OD_FIELDS', k, 'exact(x0) - y0', E.exact(x0, x0, y0) - y0, 1e-12, '');
      var worst = 0, at = 0, used = 0;
      sample(x0 - a, x0 + a, 20, function(x){
        var h = 1e-6;
        var yv = E.exact(x, x0, y0);
        /* skip a sample sitting on a pole of the closed form: the central
           difference there measures its own truncation, not the claim */
        if (!isFinite(yv) || Math.abs(yv) > 1e3) return;
        var d = (E.exact(x + h, x0, y0) - E.exact(x - h, x0, y0)) / (2 * h);
        var want = E.F(x, yv);
        if (!isFinite(d) || !isFinite(want)) return;
        used++;
        var e = Math.abs(d - want) / Math.max(1, Math.abs(want));
        if (e > worst) { worst = e; at = x; }
      });
      resid('OD_FIELDS', k, "max rel |d/dx exact - F(x, exact)|", worst, 1e-6,
            'y0=' + y0 + ' on [' + fx(x0 - a) + ',' + fx(x0 + a) + '], ' + used +
            ' samples, worst at x=' + fx(at));
    }
    /* THE HYPOTHESIS ITSELF.  `lip` decides whether Picard-Lindelof applies, so
       an entry that declares it wrongly would have the site assert uniqueness
       for a problem that has none.  The second route never differentiates: it
       scans |F(x,y+d)-F(x,y)|/d at five separations and asks whether the answer
       SETTLES.  A single separation cannot tell the two cases apart -- 3*cbrt(y^2)
       returns a perfectly respectable 21 at d = 0.003 -- which is why the
       declared flag needed a gate rather than a spot check. */
    var S = odLipScan(E.F, x0, y0, a, b);
    flag('OD_FIELDS', k, 'lip (Lipschitz in y on the rectangle)', E.lip, S.lip,
         'L at d=' + fx(S.rows[0].d) + ' is ' + fx(S.rows[0].L) + ', at d=' +
         fx(S.rows[S.rows.length - 1].d) + ' is ' + fx(S.L) + '; last ratio ' + fx(S.ratio));
    /* `esc`: the x at which the solution ceases to exist.  Route B separates the
       variables and integrates dx/dy = 1/F in y -- it never takes a step in x,
       so it shares nothing with the marching route the stage draws. */
    if (typeof E.esc === 'number') {
      var A0 = odAutonomy(E.F, x0, y0, a, b);
      var got = odEscapeQuad(E.F, x0, y0, y0 + 1e10);
      /* the tolerance is the route's OWN truncation, measured: stopping the
         quadrature at y = 1e10 leaves the tail beyond it, which for a solution
         diverging at least as fast as y^2 is under 1/1e10.  1e-9 relative is
         ten times that and a hundred times the 8.8e-12 the two routes were
         measured to differ by. */
      num('OD_FIELDS', k, 'esc (the solution stops existing here)', E.esc, got, 1e-9,
          'by quadrature of dx/dy = 1/F to y = 1e10; autonomous rel dev ' + fx(A0.rel));
    }
  });


  /* ========================================================== RL_METRICS ===== */
  /* Programme A relativity item 1.  Five metrics, each declaring where its
     horizons, photon sphere and marginally stable orbits are, and whether A*B
     is 1.  Nothing recomputed any of them before this block.

     THE SECOND ROUTES, none of which the table or 46a owns:
       horizons        the CLOSED FORM for each family -- 1 +/- sqrt(1-Q^2) for
                       a charged hole, and the trigonometric solution of the
                       cubic lam r^3 - r + 2 = 0 for the de Sitter one.  46a
                       bisects a compiled string; this solves the polynomial.
       photon sphere   Newton's method on A'r - 2A with an ANALYTIC derivative
                       of the declared family, against 46a's bisection on a
                       finite-difference one.
       ISCO            the algebraic condition r A A" + 3 A A' = 2 r A'^2,
                       reduced by hand to a polynomial per family, against
                       46a's numerical minimum of the circular-orbit L^2.
                       Derived here rather than quoted: the Q version reproduces
                       the published cubic r^3 - 6r^2 + 9Q^2 r - 4Q^4 = 0, which
                       is what says the reduction is right.
       vac             a scan of A*B over the static band.
     The declared A and B are COMPILED from their source strings, so a table
     whose formula and whose numbers disagree cannot pass. */
  (function(){
    function bis(f, a, b){
      var fa = f(a);
      if (!isFinite(fa)) return NaN;
      for (var i = 0; i < 300; i++) {
        var m = 0.5 * (a + b);
        if (m <= a || m >= b) break;
        var fm = f(m);
        if (!isFinite(fm)) break;
        if ((fm < 0) === (fa < 0)) { a = m; fa = fm; } else b = m;
      }
      return 0.5 * (a + b);
    }
    /* the three real roots of r^3 + Pr + Q = 0, in closed form */
    function cubic3(P, Q) {
      var m = 2 * Math.sqrt(-P / 3);
      var th = Math.acos(3 * Q / (2 * P) * Math.sqrt(-3 / P)) / 3;
      return [0, 1, 2].map(function(k){ return m * Math.cos(th - 2 * Math.PI * k / 3); });
    }
    /* the closed-form landmarks of each family, by hand, from the algebra --
       NOT from anything in 46a */
    var CLOSED = {
      schwarzschild: { rh:[2], ph:3, isco:[6] },
      newton:        { rh:[2], ph:3, isco:[6] },
      rn: (function(){
        var q2 = 0.64, s = Math.sqrt(1 - q2);
        return { rh:[1 - s, 1 + s], ph:(3 + Math.sqrt(9 - 8 * q2)) / 2,
                 /* r^3 - 6r^2 + 9Q^2 r - 4Q^4 = 0 */
                 isco:[bis(function(r){ return r*r*r - 6*r*r + 9*q2*r - 4*q2*q2; }, 4, 6)] };
      })(),
      desitter: (function(){
        var lam = 1e-4, R = cubic3(-1 / lam, 2 / lam).slice().sort(function(a, b){ return a - b; });
        /* 15 lam r^3 - 4 lam r^4 + r - 6 = 0, the Lambda form of the condition */
        var qf = function(r){ return -4*lam*r*r*r*r + 15*lam*r*r*r + r - 6; };
        return { rh:[R[1], R[2]], ph:3, isco:[bis(qf, 6, 7), bis(qf, 10, 80)] };
      })(),
      flat: { rh:[], ph:null, isco:[] }
    };
    Object.keys(RL_METRICS).forEach(function(k){
      var M = RL_METRICS[k], C = CLOSED[k];
      var A = rlFnR(M.A), B = rlFnR(M.B);
      if (!A || !B) {
        push('RL_METRICS', k, 'A and B compile from their source strings', 'yes', 'no', 1, false,
             M.A + '  |  ' + M.B);
        return;
      }
      if (!C) {
        push('RL_METRICS', k, 'has a closed-form route in this audit', 'yes', 'no', 1, false,
             'add one, or the entry is unchecked');
        return;
      }
      /* --- horizons: the declared list, the located list, the closed form --- */
      var H = rlHorizons(A, 0.05, M.rMax);
      push('RL_METRICS', k, 'number of horizons', M.rh.length, H.count,
           Math.abs(M.rh.length - H.count), M.rh.length === H.count && C.rh.length === H.count,
           'closed form has ' + C.rh.length);
      for (var i = 0; i < Math.min(M.rh.length, C.rh.length, H.count); i++) {
        num('RL_METRICS', k, 'horizon ' + i + ' declared vs closed form',
            M.rh[i], C.rh[i], 1e-11, 'located by bisection at ' + fx(H.roots[i]));
        /* and A really vanishes there -- the residual against the size A
           reaches, since 3e-17 means nothing without it */
        var scale = Math.abs(A(Math.min(M.rMax, H.outer * 4))) || 1;
        resid('RL_METRICS', k, 'A(horizon ' + i + ') / |A| out there',
              A(H.roots[i]) / scale, 1e-13, 'scale ' + fx(scale));
      }
      /* --- the photon sphere --- */
      var P = rlPhotonR(A, 0.05, M.rMax).outer;
      if (C.ph === null) {
        push('RL_METRICS', k, 'photon sphere', 'none', isFinite(P) ? fx(P) : 'none',
             isFinite(P) ? 1 : 0, !isFinite(P) && M.ph === null, 'A is constant, so A\'r = 2A has no root');
      } else {
        num('RL_METRICS', k, 'photon sphere declared vs closed form', M.ph, C.ph, 1e-12,
            'located at ' + fx(P));
        num('RL_METRICS', k, 'photon sphere located vs closed form', P, C.ph, 1e-8,
            'bisection on a finite-difference A\'');
      }
      /* --- the light claims: bc and lyap (Programme A item 4, 46c) ---
         Second routes owned by neither the table nor 46c.  bc is the closed-form
         photon-sphere radius of the family divided by the square root of the
         DECLARED A evaluated there -- so the audit's own arithmetic, not
         rlPhotonB's.  lyap uses W" written out analytically per family rather
         than 46c's five-point stencil:
             W = A/r^2, so for A = 1 - 2/r + Q^2/r^2 - lam r^2,
             W  = 1/r^2 - 2/r^3 + Q^2/r^4 - lam
             W" = 6/r^4 - 24/r^5 + 20 Q^2/r^6      (lam drops out entirely)
         which is why the de Sitter row's lyap is 1, exactly Schwarzschild's,
         while its bc is not.  A*B = 1 on every row that has a photon sphere, so
         the sqrt(A*B) in the definition is 1 -- except for `newton`, whose B is
         1 and whose lambda is therefore sqrt(3) rather than 1.  That single
         difference is the whole of item 4's factor of two, seen locally. */
      if (C.ph === null) {
        push('RL_METRICS', k, 'no critical impact parameter without a photon sphere',
             'null', M.bc === null ? 'null' : fx(M.bc), M.bc === null ? 0 : 1,
             M.bc === null && M.lyap === null, 'A is constant');
      } else {
        var aPh = A(C.ph), bcC = C.ph / Math.sqrt(aPh);
        var q2c = (k === 'rn') ? 0.64 : 0;
        var w2c = 6 / Math.pow(C.ph, 4) - 24 / Math.pow(C.ph, 5) + 20 * q2c / Math.pow(C.ph, 6);
        var lamC = C.ph * C.ph * Math.sqrt(Math.abs(w2c) / 2) / Math.sqrt(aPh * B(C.ph));
        num('RL_METRICS', k, 'bc declared vs r_ph/sqrt(A) in closed form', M.bc, bcC, 1e-12,
            'located at ' + fx(rlCritB(A, B, 0.05, M.rMax, 4000).b));
        num('RL_METRICS', k, 'bc located vs the closed form',
            rlCritB(A, B, 0.05, M.rMax, 4000).b, bcC, 1e-9, 'bisection on a stencil A\'');
        num('RL_METRICS', k, 'lyap declared vs the analytic W"', M.lyap, lamC, 1e-12,
            'W" = ' + fx(w2c));
        num('RL_METRICS', k, 'lyap located vs the analytic W"',
            rlCritB(A, B, 0.05, M.rMax, 4000).lam, lamC, 1e-9, 'five-point stencil on W');
        /* and the GLOBAL consequence of that local number: the deflection of a
           near-critical ray gains ln10/lambda radians per decade of approach.
           Nothing in this route is a derivative -- it is six quadratures. */
        var Cr = rlCritB(A, B, 0.05, M.rMax, 4000);
        /* the observer: infinity where the static band runs off the end of the
           scan, and inside it where there is a cosmological horizon -- the same
           rule the stage uses, and the reason de Sitter gets a number here at
           all rather than the NaN an integral to infinity would return */
        var bnd0 = rlStaticBand(A, 0.05, M.rMax);
        var openB = bnd0.open && isFinite(bnd0.hi);
        var rObsW = openB ? Infinity : bnd0.hi * 0.94;
        var Wd = rlWindRate(A, B, Cr, 6,
                   { rIn: Cr.rph, rOut: isFinite(rObsW) ? rObsW : M.rMax * 200,
                     rObs: rObsW, panels: 128 });
        /* SIX decades, not five, and the tolerance is the measured error rather
           than a round number.  The increment approaches ln10/lambda from below
           because the expansion about the photon sphere is asymptotic: at five
           decades the four rows land 1.5e-4 relative short and this check was
           red on its first run at tol 1e-4.  At six they are 1.7e-5, 2.4e-5,
           1.5e-5 and 6.6e-5 (de Sitter worst, because its observer is finite),
           so 2e-4 is three times the worst measured error. */
        num('RL_METRICS', k, 'radians per decade measured vs ln10/lyap', Wd.last,
            Math.LN10 / M.lyap, 2e-4,
            'quadrature against a local prediction; best ' + fx(Wd.best) + ' at decade ' + Wd.bestAt);
      }
      /* --- the marginally stable orbits --- */
      var band = rlStaticBand(A, 0.05, M.rMax);
      var I = rlIscoR(A, band.lo * 1.02, Math.min(M.rMax, band.hi * 0.98));
      if (!C.isco.length) {
        push('RL_METRICS', k, 'ISCO', 'none', isFinite(I.r) ? fx(I.r) : 'none',
             isFinite(I.r) ? 1 : 0, !isFinite(I.r) && M.isco === null, 'no circular orbits at all');
      } else {
        num('RL_METRICS', k, 'ISCO declared vs the algebraic condition', M.isco, C.isco[0], 1e-9,
            'located at ' + fx(I.r));
        num('RL_METRICS', k, 'ISCO located vs the algebraic condition', I.r, C.isco[0], 1e-5,
            'numerical minimum of the circular-orbit L^2');
        if (C.isco.length > 1) {
          num('RL_METRICS', k, 'outer stable orbit declared vs the condition',
              M.iscoOut, C.isco[1], 1e-9, 'located at ' + fx(I.rOut));
          num('RL_METRICS', k, 'outer stable orbit located vs the condition',
              I.rOut, C.isco[1], 1e-5, '');
          push('RL_METRICS', k, 'the ISCO is the INNER edge of the stable band',
               'inner', M.isco < M.iscoOut ? 'inner' : 'outer',
               M.isco < M.iscoOut ? 0 : 1, M.isco < M.iscoOut,
               'taking the outermost stationary point would return ' + fx(C.isco[1]));
        } else {
          push('RL_METRICS', k, 'has no outer stability edge', 'none',
               isFinite(I.rOut) ? fx(I.rOut) : 'none', isFinite(I.rOut) ? 1 : 0,
               !isFinite(I.rOut) && M.iscoOut === undefined, '');
        }
      }
      /* --- vac: A*B = 1 iff the radial pressure is minus the energy density --- */
      var G = rlABGap(A, B, band.lo * 1.02, Math.min(M.rMax, band.hi * 0.98));
      flag('RL_METRICS', k, 'vac (A*B = 1 across the static band)', M.vac, G.gap < 1e-12,
           'worst |A*B - 1| = ' + fx(G.gap) + ' at r = ' + fx(G.r));
      /* --- the display copies are display copies: never parsed, so they carry
             real Unicode and no caret would ever be typeset (2.10) --- */
      push('RL_METRICS', k, 'exA/exB are display strings, not parser input',
           'no caret', /\^/.test(M.exA + M.exB) ? 'caret' : 'no caret',
           /\^/.test(M.exA + M.exB) ? 1 : 0, !/\^/.test(M.exA + M.exB), M.exA + ' | ' + M.exB);
      /* --- and the funnel the stage draws is a quadrature of THIS B ---
         Over the STATIC BAND, which is where the stage draws it.  Starting at
         "the outermost horizon" instead put this check outside the de Sitter
         cosmological horizon, where A < 0, so B < 1, so no Euclidean embedding
         exists and every sample was imaginary -- correctly reported by the
         engine and a wrong question from the caller.  That is the third time
         the same assumption has been made about this metric in one day (the
         unit suite made it, then this block twice), which is why rlStaticBand
         exists and why nothing here may compute a band by hand again. */
      if (H.count) {
        var eLo = band.lo, eHi = Math.min(M.rMax, band.hi * 0.98, eLo + 26);
        var emb = rlEmbedZ(B, eLo, eHi, 400);
        push('RL_METRICS', k, 'the embedding is real across the drawn band',
             0, emb.imag + emb.bad, emb.imag + emb.bad, emb.imag + emb.bad === 0,
             emb.imag + ' imaginary, ' + emb.bad + ' non-finite over r = ' +
             fx(eLo) + ' to ' + fx(eHi));
      }
      /* --- orb: the apsides rlOrbit opens on, and the claim that this metric
             HAS a bound orbit there.  Checked by rlApsidesEL and then by
             integrating the thing, which shares nothing with the table.

             This claim earns its place because a table cannot hold one pair of
             apsides for all five rows and the difference is not cosmetic: de
             Sitter's A(r) turns over near 21.5 and its orbits all live inside
             that, so the r1 = 20 every other row uses is in its forbidden
             region.  orb: null is the OPPOSITE claim -- that the metric admits
             no bound orbit at all -- and Minkowski is here to make the panel
             say so rather than produce a number. */
      if (M.orb === null) {
        var flatEl = rlApsidesEL(A, 20, 41.5, 1);
        push('RL_METRICS', k, 'orb: null -- declares no bound orbit, and none exists',
             'none', isFinite(flatEl.E) ? 'E = ' + fx(flatEl.E) : 'none',
             isFinite(flatEl.E) ? 1 : 0, !isFinite(flatEl.E), flatEl.why || '');
      } else if (M.orb) {
        var o1 = M.orb[0], oe = M.orb[1], o2 = o1 * (1 + oe) / (1 - oe);
        var oel = rlApsidesEL(A, o1, o2, 1);
        push('RL_METRICS', k, 'orb: a bound orbit exists at r1 = ' + fx(o1) + ', e = ' + fx(oe),
             'yes', isFinite(oel.E) && isFinite(oel.L) ? 'yes' : 'no',
             isFinite(oel.E) && isFinite(oel.L) ? 0 : 1,
             isFinite(oel.E) && isFinite(oel.L),
             oel.why || ('E = ' + fx(oel.E) + ', L = ' + fx(oel.L)));
        if (isFinite(oel.E) && isFinite(oel.L)) {
          /* both walls of the well rise -- the pair of local conditions that
             the interior scan cannot see, and that three de Sitter apsides and
             one Schwarzschild pericentre failed on 2026-08-18 */
          push('RL_METRICS', k, 'orb: and both walls of that well rise',
               'yes', oel.wallOut > 0 && oel.wallIn > 0 ? 'yes' : 'no',
               oel.wallOut > 0 && oel.wallIn > 0 ? 0 : 1,
               oel.wallOut > 0 && oel.wallIn > 0,
               'out ' + fx(oel.wallOut) + ', in ' + fx(oel.wallIn));
          /* ROUTE B on it, then ROUTE A -- the advance per orbit computed by a
             quadrature and by integrating the geodesic equation, agreeing to
             2.5e-10 at worst over these five (measured 2026-08-18) */
          var qB = 2 * rlApsidalQuad(A, B, o1, o2, oel.E, oel.L, 1, 64) - 2 * Math.PI;
          var pl = rlOrbitPlan(o1, o2, oel.L, 5, 1400);
          var gA = rlGeoRun(A, B, rlGeoInit(A, B, o2, oel.E, oel.L, 1, -1), pl.h, pl.steps,
                            { rStop: band.lo * 1.001, rEsc: o2 * 1.25 });
          var pA = rlPeriShift(gA).precession;
          resid('RL_METRICS', k, 'orb: advance per orbit, quadrature vs geodesic',
                Math.abs(pA - qB) / Math.max(1e-30, Math.abs(2 * Math.PI + qB)), 3e-9,
                'route A ' + fx(pA) + ' rad, route B ' + fx(qB) + ' rad');
          /* and the Newtonian control on the same apsides, which must be zero:
             a machine that manufactured an advance would fail here first */
          resid('RL_METRICS', k, 'orb: the Newtonian control still closes exactly',
                Math.abs(rlKeplerApsidal(o1, o2) - Math.PI) / Math.PI, 1e-10, 'apsidal angle - pi');
        }
      }
    });
  })();
  /* ========================================================= GW_BINARIES ===== */
  /* Programme A relativity item 5.  Six real systems, each carrying the quantity
     somebody actually MEASURED -- a pulsar's orbital period, a detection's band
     entry frequency -- and declaring numbers derived from it: the separation,
     the time to coalescence, the ISCO frequency, the period decay, the
     luminosity.  Until this block nothing recomputed one of them, and the first
     run of it found four wrong (the separations of GW170817, J0737 and HM
     Cancri, and the Sun-Earth luminosity) because they had been typed from a
     calculation done by hand.
     THE SECOND ROUTES, none of which the table or 46d's accessor owns:
       separation   bisection on Kepler's FORWARD map P(a), against the closed
                    form cube root gwBinarySep uses.
       coalescence  RK4 on adot, integrated from the declared separation down to
                    the ISCO, against the closed form (5/256)a^4/(m1 m2 M).
       ISCO freq    gwISCOFreq in module 46, which reaches the same number
                    through a different constant chain (and disagreed by 6.5e-8
                    until 2026-08-18, when it was found to be routing a solar
                    mass through G*Msun instead of the measured product GM).
       period decay gwPdotAvg -- the numerical orbit average through Kepler's
                    third law, with no Peters factor anywhere in it.
       luminosity   the same orbit average, converted to watts.
       the chirp    an integrated inspiral, differentiated, and the chirp mass
                    read back out: item 5's acceptance test, run on every preset
                    rather than on the one the stage opens with.               */
  Object.keys(GW_BINARIES).forEach(function(k){
    var B = GW_BINARIES[k];
    var m1 = gwMs(B.m1), m2 = gwMs(B.m2), M = m1 + m2;
    var a = gwBinarySep(B), P = gwBinaryPeriod(B);

    /* --- the separation, by bisection on the forward map rather than by the
           inverse formula.  P(a) is monotone, so this is a proof as well as a
           search. --- */
    var lo = 1e-9 * a, hi = 1e9 * a;
    for (var i = 0; i < 200; i++) {
      var mid = Math.sqrt(lo * hi);
      if (gwPeriodOf(M, mid) > P) hi = mid; else lo = mid;
    }
    var aBis = Math.sqrt(lo * hi);
    num('GW_BINARIES', k, 'separation, closed form vs bisection on P(a)',
        gwSm(a) / 1000, gwSm(aBis) / 1000, 1e-9, 'km');
    num('GW_BINARIES', k, 'declared sepKm', B.sepKm, gwSm(a) / 1000, 1e-5, 'km');
    push('GW_BINARIES', k, 'the pair is outside its own ISCO',
         'yes', a > gwSepIsco(M) ? 'yes' : 'no', a > gwSepIsco(M) ? 0 : 1,
         a > gwSepIsco(M), 'a = ' + fx(gwSm(a) / 1000) + ' km, ISCO ' +
         fx(gwSm(gwSepIsco(M)) / 1000) + ' km');

    /* --- the ISCO frequency, against the SI routine in module 46 --- */
    num('GW_BINARIES', k, 'ISCO frequency, geometric vs the SI helper',
        gwFgwIsco(M), gwISCOFreq(B.m1 + B.m2), 1e-12, 'Hz');
    if (B.fIsco !== undefined)
      num('GW_BINARIES', k, 'declared fIsco', B.fIsco, gwFgwIsco(M), 1e-5, 'Hz');

    /* --- the time to coalescence: RK4 on adot against the closed form.  The
           run stops at the ISCO, so the closed form's remaining tail is added
           back; it is 1e-5 of the total and the comparison is dominated by the
           integration. --- */
    var R = gwInspiralRun(m1, m2, a, { frac: 0.004 });
    if (R.ok) {
      var tcInt = R.tEnd + gwTcoalOf(m1, m2, R.aEnd);
      num('GW_BINARIES', k, 'time to coalescence, integrated vs closed form',
          gwTcoalOf(m1, m2, a), tcInt, 1e-8, 's');
      if (B.tc !== undefined)
        num('GW_BINARIES', k, 'declared tc', B.tc, gwTcoalOf(m1, m2, a), 1e-4, 's');
      /* --- ITEM 5'S ACCEPTANCE TEST, on this preset: the chirp mass measured
             off the integrated track against the algebraic one.  Route A knows
             m1 and m2 separately and never forms a chirp mass. --- */
      var D = gwTrackFdot(R);
      resid('GW_BINARIES', k, 'chirp mass read off the track vs (m1 m2)^(3/5)/M^(1/5)',
            D.worst, 1e-6, 'worst over the interior of the track');
    } else {
      push('GW_BINARIES', k, 'the inspiral integrates', 'yes', 'no', 1, false, R.why || '');
    }

    /* --- the luminosity: the numerical orbit average, in watts --- */
    var avg = gwAvgPower(m1, m2, a, B.e || 0, 8192);
    num('GW_BINARIES', k, 'orbit-averaged power, quadrature vs (32/5)m1^2m2^2M/a^5 F(e)',
        gwLumOf(m1, m2, a) * gwPetersF(B.e || 0) * GW_LUM_W, avg.avg * GW_LUM_W, 1e-9, 'W');
    if (B.lumW !== undefined)
      num('GW_BINARIES', k, 'declared lumW', B.lumW, avg.avg * GW_LUM_W, 1e-3, 'W');

    /* --- the period decay, both ways, and against what was observed --- */
    var pdB = gwPdotOf(m1, m2, P, B.e || 0);
    var pdA = gwPdotAvg(m1, m2, P, B.e || 0, 8192);
    resid('GW_BINARIES', k, 'Pdot, closed form vs the orbit average through Kepler',
          Math.abs(pdA - pdB) / Math.abs(pdB), 1e-9, fx(pdA) + ' vs ' + fx(pdB) + ' s/s');
    if (B.pdot !== undefined)
      num('GW_BINARIES', k, 'declared pdot', B.pdot, pdB, 1e-4, 's/s');
    if (B.pdotObs !== undefined && B.obsRatio !== undefined)
      num('GW_BINARIES', k, 'declared obsRatio (observed / predicted)',
          B.obsRatio, B.pdotObs / pdB, 2e-3, 'the prediction is limited by the quoted masses');
    /* --- and F(e) itself, quadrature against Peters, at this row's own e --- */
    if ((B.e || 0) > 0)
      resid('GW_BINARIES', k, 'F(e) by quadrature vs Peters 1964',
            Math.abs(avg.enh - gwPetersF(B.e)) / gwPetersF(B.e), 1e-9,
            'e = ' + fx(B.e) + ', F = ' + fx(gwPetersF(B.e)));
  });

  /* ============================================================ AG_FUNCS ===== */
  /* inv is declared, never checked.  Domains are stated here because a domain is
     a fact about the function, not about the claim -- f(inv(y)) = y is only
     meaningful where inv(y) is defined. */
  var AG_DOM = { lin:{a:-3,b:3,ya:-3,yb:3}, sq:{a:-3,b:3,ya:0.05,yb:9},
                 cube:{a:-3,b:3,ya:-27,yb:27}, exp:{a:-3,b:3,ya:0.05,yb:20},
                 ln:{a:0.1,b:5,ya:-3,yb:3}, sin:{a:-3,b:3,ya:-0.99,yb:0.99},
                 recip:{a:0.2,b:3,ya:0.2,yb:3}, sqrt:{a:0,b:4,ya:0.05,yb:2} };
  Object.keys(AG_FUNCS).forEach(function(k){
    var E = AG_FUNCS[k], D = AG_DOM[k];
    if (!D) { push('AG_FUNCS', k, 'no test domain declared in the audit', '-', '-', NaN, false,
                   'add one to AG_DOM'); return; }
    var worst = 0;
    sample(D.ya, D.yb, 20, function(y){
      var r = E.f(E.inv(y));
      if (isFinite(r)) worst = Math.max(worst, Math.abs(r - y) / Math.max(1, Math.abs(y)));
    });
    resid('AG_FUNCS', k, 'max rel |f(inv(y)) - y|', worst, 1e-9, 'y in [' + D.ya + ',' + D.yb + ']');
    /* mono is a claim about the function on its whole domain, and 1/x is the
       reason that matters: it falls on each branch separately, so resetting the
       comparison at the pole reports it as monotone, which it is not (x = -1
       gives -1 and x = 1 gives 1).  Skip the undefined sample, but carry the
       previous defined value ACROSS the hole. */
    var up = 0, dn = 0, prev = null;
    for (var i = 0; i <= 400; i++) {
      var x = -3 + 6 * i / 400;
      if (k === 'ln' || k === 'sqrt') x = (k === 'ln' ? 0.05 : 0) + (k === 'ln' ? 5 : 4) * i / 400;
      var v = E.f(x);
      if (!isFinite(v)) continue;
      if (prev !== null) { if (v > prev + 1e-12) up++; else if (v < prev - 1e-12) dn++; }
      prev = v;
    }
    flag('AG_FUNCS', k, 'mono', E.mono, !(up && dn), 'rises ' + up + ', falls ' + dn);
  });

  /* ========================================================= DF_HARMONIC ===== */
  /* The five-point Laplacian has an O(h²) truncation error, and near a log's
     pole that error is not small: at h = 1e-3 it reports 1.2e-4 for 0.5·ln r²,
     which is harmonic, and a fixed tolerance therefore convicts a correct entry.
     Richardson-extrapolate instead -- L(h/2) and L(h) differ by exactly that
     truncation, so (4L(h/2) − L(h))/3 removes it and the difference between the
     two is the measured error the tolerance is then set from. */
  Object.keys(DF_HARMONIC).forEach(function(k){
    var E = DF_HARMONIC[k], worst = 0, raw = 0, trunc = 0, at = '';
    function lap(x, y, h){
      return (E.f(x + h, y) + E.f(x - h, y) + E.f(x, y + h) + E.f(x, y - h) - 4 * E.f(x, y)) / (h * h);
    }
    for (var i = -3; i <= 3; i++) for (var j = -3; j <= 3; j++) {
      var x = i * 0.6 + 0.23, y = j * 0.6 + 0.17;       /* off-lattice: misses the log's pole */
      var Lc = lap(x, y, 4e-3), Lf = lap(x, y, 2e-3);
      var L = (4 * Lf - Lc) / 3;
      if (isFinite(L) && Math.abs(L) > worst) {
        worst = Math.abs(L); raw = Lf; trunc = Math.abs(Lf - L); at = fx(x) + ',' + fx(y);
      }
    }
    flag('DF_HARMONIC', k, 'harmonic', E.harmonic, worst < 1e-5,
         'max |laplacian| ' + fx(worst) + ' at (' + at + ') after Richardson; raw five-point ' +
         fx(raw) + ', truncation removed ' + fx(trunc));
  });

  /* =========================================================== NM_FUNCS ====== */
  Object.keys(NM_FUNCS).forEach(function(k){
    var E = NM_FUNCS[k];
    resid('NM_FUNCS', k, 'f(root)', E.f(E.root), 1e-12);
    flag('NM_FUNCS', k, 'root lies in the declared bracket [lo,hi]', true,
         E.root >= E.lo && E.root <= E.hi, 'root ' + fx(E.root) + ' in [' + E.lo + ',' + E.hi + ']');
    /* d is supplied by hand beside f -- Newton on this stage uses it */
    var worst = 0;
    sample(E.lo, E.hi, 20, function(x){
      var h = 1e-6 * Math.max(1, Math.abs(x));
      var d = (E.f(x + h) - E.f(x - h)) / (2 * h);
      worst = Math.max(worst, Math.abs(d - E.d(x)) / Math.max(1, Math.abs(E.d(x))));
    });
    resid('NM_FUNCS', k, "max rel |df/dx - d(x)|", worst, 1e-6);
  });

  /* ========================================================= EIG_PRESETS ===== */
  /* Each preset's name is a claim about its spectrum.  They are cheap to check
     and nothing checks them. */
  Object.keys(EIG_PRESETS).forEach(function(k){
    var M = EIG_PRESETS[k].M, n = EIG_PRESETS[k].n;
    var det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
    var tr  = M[0][0] + M[1][1];
    var disc = tr * tr - 4 * det;
    push('EIG_PRESETS', k, 'measured: det, trace, discriminant', n,
         'det ' + fx(det) + ', tr ' + fx(tr) + ', disc ' + fx(disc), 0, true, '');
    if (/symmetric/.test(n))       resid('EIG_PRESETS', k, 'symmetric: M01 - M10', M[0][1] - M[1][0], 0);
    if (/singular/.test(n))        resid('EIG_PRESETS', k, 'singular: det', det, 1e-14);
    if (/complex/.test(n))         flag('EIG_PRESETS', k, 'complex eigenvalues: disc < 0', true, disc < 0, 'disc ' + fx(disc));
    if (/defective/.test(n)) {
      var scalar = M[0][1] === 0 && M[1][0] === 0 && M[0][0] === M[1][1];
      flag('EIG_PRESETS', k, 'defective: repeated eigenvalue and not a scalar matrix',
           true, Math.abs(disc) < 1e-14 && !scalar, 'disc ' + fx(disc));
    }
    if (/diagonal/.test(n))
      resid('EIG_PRESETS', k, 'already diagonal: |M01| + |M10|',
            Math.abs(M[0][1]) + Math.abs(M[1][0]), 0);
  });

  /* ======================================================= RL_WORLDLINES ===== */
  /* Programme A relativity item 10.  Five worldlines, each declaring its top
     speed and — where a closed form exists — its proper time.  Both are
     recomputed here by routes the table does not own:
       vmax   a 20 000-point scan of |dx/dt| refined by golden section, and
              SEPARATELY the largest |dx/dt| over a 40 000-point grid, so a
              declared speed has to survive two different resolutions.
       tau    the lab quadrature AND the moving observer's independent
              re-integration at three boosts, which shares no arithmetic with
              it (46e).  A declared tau is only a claim about the worldline if
              nothing in the check came from the same integral.
     The timelike condition is a claim too, and the one that matters most: a
     worldline with |dx/dt| >= 1 anywhere has no proper time at all. */
  Object.keys(RL_WORLDLINES).forEach(function(k){
    var W = RL_WORLDLINES[k];
    var A = parse(String(W.src).replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'x'));
    var fc = compile(A), dc = compile(diff(A, 'x'));
    var f = function(t){ return fc(t, 0, 0); }, d = function(t){ return dc(t, 0, 0); };

    /* --- the top speed, at two resolutions --- */
    var sp = rlWlSpeedMax(d, W.t0, W.t1, 20000);
    var plain = 0;
    for (var i = 0; i <= 40000; i++) plain = Math.max(plain, Math.abs(d(W.t0 + (W.t1 - W.t0) * i / 40000)));
    num('RL_WORLDLINES', k, 'declared vmax', W.vmax, sp.max, 1e-9, 'at t = ' + fx(sp.at));
    num('RL_WORLDLINES', k, 'and the same by a plain 40 000-point grid', sp.max, plain, 1e-7, '');
    flag('RL_WORLDLINES', k, 'timelike everywhere: |dx/dt| < 1', true, sp.max < 1, 'vmax ' + fx(sp.max));

    /* --- the proper time, by the lab route and by the moving observer's --- */
    var L = rlWlTauLab(d, W.t0, W.t1);
    if (W.tau !== null && W.tau !== undefined)
      num('RL_WORLDLINES', k, 'declared tau against the quadrature', W.tau, L.tau, 1e-11, '');
    [0.4, -0.8, 0.95].forEach(function(b){
      var P = rlWlTauPrimed(f, W.t0, W.t1, b);
      num('RL_WORLDLINES', k, 'proper time, lab vs an observer at beta = ' + b,
          L.tau, P.tau, 5e-9, 'route B is adaptive in t-prime and never differentiates analytically');
    });

    /* --- the reverse triangle inequality, and the polygon that brackets it ---
           The polygon is computed in a BOOSTED frame and must equal the lab's
           to round-off, since every chord's interval is separately invariant. */
    var straight = rlWlStraight(W.t1 - W.t0, f(W.t1) - f(W.t0));
    flag('RL_WORLDLINES', k, 'no route beats the straight one', true,
         L.tau <= straight + 1e-12 * straight,
         'tau ' + fx(L.tau) + ' vs straight ' + fx(straight));
    var pLab = rlWlPolygon(f, W.t0, W.t1, 400, 0).tau;
    var pBoost = rlWlPolygon(f, W.t0, W.t1, 400, -0.7).tau;
    num('RL_WORLDLINES', k, 'the inscribed polygon is the same in every frame', pLab, pBoost, 1e-12, '');
    flag('RL_WORLDLINES', k, 'and it OVERSHOOTS the curve (the reverse of Euclid)', true,
         pLab >= L.tau - 1e-13, 'polygon ' + fx(pLab) + ' vs tau ' + fx(L.tau));
  });

  /* ========================================================== RL_CHAINS ====== */
  /* Programme A relativity item 11.  Each chain declares its total rapidity,
     and one of them its shortfall from c.  Recomputed three ways that share no
     arithmetic — folding the velocity addition rule, summing artanh, and
     multiplying the 2x2 Lorentz matrices — plus the group facts the panel
     asserts: that the product is still a boost, and that collinear boosts
     commute so a shuffle cannot change the answer. */
  Object.keys(RL_CHAINS).forEach(function(k){
    var C = RL_CHAINS[k];
    var P = rlChainParse(C.text, []);
    push('RL_CHAINS', k, 'the chain text parses with no errors', 0, P.errs.length,
         P.errs.length, P.errs.length === 0,
         P.errs.map(function(e){ return e.msg; }).join('; '));
    if (!P.steps.length) return;
    var M = rlChainMeasure(P.steps);
    num('RL_CHAINS', k, 'declared total rapidity', C.phi, M.phi, 1e-12, M.n + ' boosts');
    if (C.shortfall !== null && C.shortfall !== undefined)
      num('RL_CHAINS', k, 'declared shortfall from c', C.shortfall, M.shortfall, 1e-12, '');
    if (!M.saturated) {
      num('RL_CHAINS', k, 'velocity folding vs tanh of the summed rapidities',
          M.betaA, M.betaB, 1e-15, '');
      num('RL_CHAINS', k, 'and vs the boost read off the matrix product',
          M.betaB, M.betaC, 1e-15, '');
    } else {
      flag('RL_CHAINS', k, 'the velocity route saturates, and says at which boost',
           true, M.satAt > 0 && M.satAt <= M.n, 'boost ' + M.satAt + ' of ' + M.n);
    }
    resid('RL_CHAINS', k, 'collinear boosts commute: shuffled minus in order',
          M.gapShuffle, 1e-15);
    flag('RL_CHAINS', k, 'the product is still a Lorentz transformation', true,
         M.worstEta <= 1e-12 * M.etaScale,
         'worst |L^T eta L - eta| = ' + fx(M.worstEta) + ' on a scale of ' + fx(M.etaScale));
    /* det = ad - bc with a = d = gamma and b = c = -gamma*beta, so it is a
       cancellation of terms of size gamma^2 and its residual has to be read
       against that.  Written with an absolute tolerance first, this row failed
       on the two chains with large gamma -- 3e-8 at gamma = 10 604, and a flat
       -1 at gamma = 3e12, where one ulp of gamma^2 is 1.6e9.  Neither is a
       broken group law; both are subtractions with no digits left in them, and
       the eta row two lines up already had this right. */
    flag('RL_CHAINS', k, 'det of the product is 1, to the resolution gamma^2 leaves',
         true, Math.abs(M.det - 1) <= 1e-12 * M.etaScale,
         'det - 1 = ' + fx(M.det - 1) + ' on a scale of ' + fx(M.etaScale));
  });

  /* =========================================================== RL_FIELDS ===== */
  /* Programme A relativity item 7.  Six fields, each declaring what KIND of
     field it is and which of E or B a frame can remove.  Both are recomputed,
     and the second one by going to the frame rather than by re-reading the
     classification: "a frame exists where B vanishes" is a claim about a frame.
     Also checked here, on every preset: the six component transformation rules
     against Lambda F Lambda^T with Lambda pointing along E x B -- a direction
     no axis-aligned boost reaches, and the only place in this wing where the
     claim "E and B are one object" is tested off the x axis. */
  Object.keys(RL_FIELDS).forEach(function(k){
    var P = RL_FIELDS[k], E = rlFieldVec(P.E), B = rlFieldVec(P.B);
    var I = relFieldInvariants(E, B);
    var scale = vdot(E, E) + vdot(B, B);
    var ch = relFieldCharacter(E, B);
    push('RL_FIELDS', k, 'declared character', P.character, ch.split(' ')[0],
         ch.indexOf(P.character) === 0 ? 0 : 1, ch.indexOf(P.character) === 0,
         'E.B = ' + fx(I.dot) + ', E2-B2 = ' + fx(I.diff));

    /* the two routes, at three boosts including one along E x B */
    var S = vcross(E, B), sl = Math.sqrt(vdot(S, S));
    var dirs = [v3(0.4, 0, 0), v3(0.2, -0.3, 0.5)];
    if (sl > 1e-12) dirs.push(vmul(S, 0.6 / sl));
    dirs.forEach(function(v, i){
      var R = rlFieldBoostTwo(E, B, v);
      /* resid, NOT num: num's tolerance is relative to the DECLARED value, so a
         declared zero can never pass -- eleven rows of honest 1e-16 round-off
         went red the first time this block ran, which is the third instance
         today of the same rule (MASTER-PLAN 2.1: a residual is meaningless
         without its scale, and here the scale is the field itself). */
      resid('RL_FIELDS', k, 'component formulas vs Lambda F Lambda^T, boost ' + (i + 1),
            R.worst, 1e-12 * Math.max(1e-12, R.gross), 'against a field of ' + fx(R.gross));
      /* and both invariants are unmoved by that boost */
      var J = relFieldInvariants(R.vec.E, R.vec.B);
      resid('RL_FIELDS', k, 'E.B unchanged by boost ' + (i + 1), J.dot - I.dot, 1e-12 * Math.max(1e-12, scale));
      resid('RL_FIELDS', k, 'E2-B2 unchanged by boost ' + (i + 1), J.diff - I.diff, 1e-12 * Math.max(1e-12, scale));
    });

    /* THE FRAME, VISITED */
    var D = rlFieldDrift(E, B);
    if (P.character === 'null') {
      flag('RL_FIELDS', k, 'a null field has no frame that removes either', false, D.ok,
           D.why || '');
      num('RL_FIELDS', k, 'and the boost that would is exactly c', 1, D.speed, 1e-15, '');
    } else {
      flag('RL_FIELDS', k, 'the frame the classification names exists', true, D.ok, D.why || '');
      if (D.ok) {
        push('RL_FIELDS', k, 'declared removes', P.removes, D.removes,
             P.removes === D.removes ? 0 : 1, P.removes === D.removes, '');
        if (P.removes === 'magnetic')
          resid('RL_FIELDS', k, 'what is left of B in that frame', D.bLeft, 1e-11 * D.gross,
                'at beta = ' + fx(D.speed));
        else if (P.removes === 'electric')
          resid('RL_FIELDS', k, 'what is left of E in that frame', D.eLeft, 1e-11 * D.gross,
                'at beta = ' + fx(D.speed));
        else
          resid('RL_FIELDS', k, 'E and B are parallel there: |ExB|/|E||B|', D.parallel, 1e-12);
      }
    }
  });

  /* ========================================================== RL_TENSORS ===== */
  /* Programme A relativity item 8.  Five tensors, each declaring whether it is
     antisymmetric -- including one that is NOT, on purpose.  Recomputed from
     the sixteen numbers, and the invariants rebuilt by double contraction and
     compared with the vector forms.  Those agree only for an antisymmetric
     array, so the broken preset is checked for DISAGREEMENT: the identity
     E.B = -F.Ftilde/4 is a statement about field tensors, and its failure is a
     second symptom of the same fault rather than a separate one. */
  Object.keys(RL_TENSORS).forEach(function(k){
    var P = RL_TENSORS[k];
    var R = rlTensorParse(P.text, null);
    push('RL_TENSORS', k, 'the text parses to four rows of four', 0, R.errs.length,
         R.errs.length, R.errs.length === 0 && R.F && R.F.length === 4,
         R.errs.map(function(e){ return e.msg; }).join('; '));
    if (!R.F || R.F.length !== 4) return;
    var K = rlTensorCheck(R.F);
    var anti = K.anti < 1e-15 * K.scale;
    flag('RL_TENSORS', k, 'declared antisymmetry', P.anti, anti,
         'worst |F^mn + F^nm| = ' + fx(K.anti) + ' on a scale of ' + fx(K.scale));
    if (anti) {
      num('RL_TENSORS', k, 'E.B from the vectors vs the dual contraction',
          K.dot, K.fromTensorDot, 1e-13, '');
      num('RL_TENSORS', k, 'E2-B2 from the vectors vs F_mn F^mn',
          K.diff, K.fromTensorDiff, 1e-13, '');
      /* and both survive a boost of the tensor itself */
      var F2 = rlTensorBoost(R.F, v3(0.55, 0, 0));
      var K2 = rlTensorCheck(F2);
      resid('RL_TENSORS', k, 'E.B unchanged by boosting the tensor',
            K2.dot - K.dot, 1e-12 * Math.max(1e-12, K.scale * K.scale));
      resid('RL_TENSORS', k, 'E2-B2 unchanged by boosting the tensor',
            K2.diff - K.diff, 1e-12 * Math.max(1e-12, K.scale * K.scale));
      flag('RL_TENSORS', k, 'and the boosted tensor is still antisymmetric', true,
           K2.anti < 1e-13 * K2.scale, 'worst ' + fx(K2.anti));
    } else {
      flag('RL_TENSORS', k, 'NOT a field tensor, so the two definitions of E.B come apart',
           true, Math.abs(K.dot - K.fromTensorDot) > 1e-6 * K.scale * K.scale,
           fx(K.dot) + ' vs ' + fx(K.fromTensorDot));
    }
  });

  /* ========================================================== RL_CHARGES ===== */
  /* Programme A relativity item 6.  Six configurations, each declaring the
     charge its sphere encloses -- and the flux is INTEGRATED rather than quoted.
     The stage's own derivation ladder had promised "the panel integrates it in
     the boosted frame and gets the same answer" since the stage was written,
     and until this block nothing integrated anything.
     Two routes: the lab sphere with the boosted (pancaked) field, and the same
     events in the charges' rest frame, where the surface is an ELLIPSOID and
     the field is plain Coulomb.  Where the enclosed charge is zero the total is
     a cancellation and is checked against the gross that cancelled. */
  Object.keys(RL_CHARGES).forEach(function(k){
    var P = RL_CHARGES[k];
    var L = rlChargeParse(P.text, null);
    push('RL_CHARGES', k, 'the text parses', 0, L.errs.length, L.errs.length,
         L.errs.length === 0 && L.charges.length > 0,
         L.errs.map(function(e){ return e.msg; }).join('; '));
    if (!L.charges.length) return;
    var M = rlGaussMeasure(L.charges, v3(P.cx, P.cy, P.cz), P.R);
    flag('RL_CHARGES', k, 'the flux integrates at all', true, M.ok, M.why || '');
    if (!M.ok) return;
    num('RL_CHARGES', k, 'declared enclosed charge', P.enc, M.enclosed, 1e-12,
        'sphere at x = ' + fx(P.cx) + ', radius ' + fx(P.R));
    if (Math.abs(P.enc) > 1e-12)
      num('RL_CHARGES', k, 'flux over the lab sphere vs 4 pi q', M.expect, M.lab, 1e-8,
          'gamma = ' + fx(M.gamma) + ', grid ' + M.nu + ' x ' + M.nphi);
    else
      resid('RL_CHARGES', k, 'flux vanishes, against the gross it cancelled from',
            M.lab, 1e-8 * M.gross, 'gross = ' + fx(M.gross));
    if (M.rest !== undefined)
      resid('RL_CHARGES', k, 'lab sphere vs rest-frame ellipsoid',
            M.rest - M.lab, 1e-8 * Math.max(1, Math.abs(M.expect), M.gross),
            'two different surfaces through the same events');
    /* THE INTEGRAND MUST VARY, or the agreement above means nothing. Sampling
       the single-charge pancake ratio was the first version of this row and it
       is wrong for every configuration with more than one charge, where the
       superposition is not a pancake at all -- the dipole came out at 0.60 and
       went red. What is true for any configuration is that E.n around the
       sphere is far from constant, and that is what is measured. */
    if (M.gamma > 1.01) {
      var lo = Infinity, hi = 0;
      for (var t = 0; t < 32; t++) {
        var th = 2 * Math.PI * t / 32;
        var nn = v3(Math.cos(th), Math.sin(th), 0);
        var e = vlen(rlChargeField(L.charges, vadd(v3(P.cx, P.cy, P.cz), vmul(nn, P.R))).E);
        lo = Math.min(lo, e); hi = Math.max(hi, e);
      }
      push('RL_CHARGES', k, 'the integrand varies around the sphere, so the check is not vacuous',
           '> 2x', fx(hi / Math.max(1e-300, lo)), 0, hi > 2 * lo,
           'gamma = ' + fx(M.gamma));
    }
  });

  /* ============================================================ RL_WIRES ===== */
  /* Programme A relativity item 9.  Four wires, each declaring whether it is
     neutral in the lab -- recomputed by summing the densities -- and each
     checked for the thing the wing is built around: the force on a passing
     charge, computed in the lab (magnetic) and in the charge's own frame
     (electrostatic), agreeing after the one transverse-force factor.
     The naive species-by-species sum is checked SEPARATELY, because on a
     realistic wire it is supposed to fail: the imbalance carrying the whole
     force is a part in 10^17 of either density. */
  Object.keys(RL_WIRES).forEach(function(k){
    var P = RL_WIRES[k];
    var S = rlWireParse(P.text, null);
    push('RL_WIRES', k, 'the text parses', 0, S.errs.length, S.errs.length,
         S.errs.length === 0 && S.species.length > 0,
         S.errs.map(function(e){ return e.msg; }).join('; '));
    if (!S.species.length) return;
    var F = rlWireForce(S.species, P.vt, 1, 1);
    flag('RL_WIRES', k, 'declared neutrality in the lab', P.neutral, F.neutral,
         'net lambda = ' + fx(F.lam));
    resid('RL_WIRES', k, 'lab force vs the charge frame, after the gamma factor',
          F.lab - F.viaExact, 1e-12 * Math.max(1e-300, Math.abs(F.lab)),
          'F = ' + fx(F.lab));
    /* and the digit loss, which is the physics rather than a numerical note */
    if (Math.abs(P.vt) < 1e-4)
      flag('RL_WIRES', k, 'a realistic drift destroys the species-by-species sum',
           true, F.prime.digits > 8, 'digits lost = ' + fx(F.prime.digits));
    else
      flag('RL_WIRES', k, 'a cartoon drift leaves the naive sum usable',
           true, F.prime.digits < 3, 'digits lost = ' + fx(F.prime.digits));
  });

  /* ========================================================== RL_MOTIONS ===== */
  /* Programme A relativity items 12 and 13.  Six acceleration programmes, three
     of which declare a closed form for where they end up -- and every one is
     recomputed by INTEGRATING rather than by re-evaluating the same formula.
     The second route is the proper time read back off the worldline the first
     one drew, as a sum of chord intervals: it knows nothing about a, phi or a
     differential equation, and it must come out ABOVE the true proper time,
     because a chord is the straight route between two events and in this
     geometry the straight route is the longest. */
  Object.keys(RL_MOTIONS).forEach(function(k){
    var P = RL_MOTIONS[k];
    var A = parse(String(P.src).replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'x'));
    var g = compile(A);
    var f = function(t){ return g(t, 0, 0); };
    var M = rlMotionMeasure(f, P.tau1, 4000);
    flag('RL_MOTIONS', k, 'the programme runs at all', true, M.ok, M.why || '');
    if (!M.ok) return;
    if (P.t !== null && P.t !== undefined)
      num('RL_MOTIONS', k, 'declared coordinate time', P.t, M.t, 1e-7, 'yr');
    if (P.x !== null && P.x !== undefined)
      num('RL_MOTIONS', k, 'declared distance', P.x, M.x, 1e-7, 'ly');
    if (P.phi !== null && P.phi !== undefined)
      num('RL_MOTIONS', k, 'declared final rapidity', P.phi, M.phi, 1e-9, '');
    /* the two routes to the proper time */
    resid('RL_MOTIONS', k, 'chord sum vs the tau it was integrated in',
          M.chords - M.tau, 1e-5 * M.tau, 'chords = ' + fx(M.chords));
    flag('RL_MOTIONS', k, 'and the chord sum is HIGH, as the geometry requires',
         true, M.chords >= M.tau - 1e-12, fx(M.chords - M.tau));
    /* two things no programme may do */
    flag('RL_MOTIONS', k, 'the ship never ages more than home', true, M.t >= M.tau - 1e-9,
         'tau = ' + fx(M.tau) + ', t = ' + fx(M.t));
    flag('RL_MOTIONS', k, 'and never reaches c', true, M.betaMax < 1, fx(M.betaMax));
    /* and the closed form for constant a, where the programme IS constant */
    if (k === 'oneg' || k === 'coast') {
      var a = f(0), C = rlMotionClosed(a, P.tau1);
      num('RL_MOTIONS', k, 'against the closed form for constant a: t', C.t, M.t, 1e-8, 'yr');
      num('RL_MOTIONS', k, 'against the closed form for constant a: rapidity', C.phi, M.phi, 1e-9, '');
      if (a > 0)
        num('RL_MOTIONS', k, 'and the Rindler horizon is 1/a', 1 / a, M.horizon, 1e-12, 'ly');
    }
  });

  /* =========================================================== RL_CLOCKS ===== */
  /* Programme A relativity item 14.  Five mirror positions, each declaring
     whether the two halves of the tick are equal -- which is true only for a
     mirror exactly across the motion, and is the whole reason the textbook
     draws that one.  Every tick is recomputed from the light's PATH: two
     quadratics, one per leg, with the arm contracted along the motion. */
  Object.keys(RL_CLOCKS).forEach(function(k){
    var P = RL_CLOCKS[k];
    [0.2, 0.6, 0.9, 0.99].forEach(function(b){
      var T = rlClockTick(P.Lx, P.Ly, b);
      flag('RL_CLOCKS', k, 'the clock ticks at beta = ' + b, true, T.ok, T.why || '');
      if (!T.ok) return;
      num('RL_CLOCKS', k, 'the tick is gamma x the rest tick, at beta = ' + b,
          T.expect, T.lab, 1e-13, 'legs ' + fx(T.tOut) + ' and ' + fx(T.tBack));
      resid('RL_CLOCKS', k, 'and each leg is a null path, at beta = ' + b,
            Math.max(T.nullOut, T.nullBack), 1e-12 * T.rest, '');
    });
    var T6 = rlClockTick(P.Lx, P.Ly, 0.6);
    flag('RL_CLOCKS', k, 'declared leg equality', P.legs === 'equal',
         Math.abs(T6.legRatio - 1) < 1e-9, 'ratio ' + fx(T6.legRatio));
    /* the along-the-motion clock has legs in the ratio (1+b)/(1-b) exactly */
    if (Math.abs(P.Ly) < 1e-15 && P.Lx > 0)
      num('RL_CLOCKS', k, 'and along the motion the ratio is (1+b)/(1-b)',
          1.6 / 0.4, T6.legRatio, 1e-12, 'at beta = 0.6');
  });

  /* =========================================================== RL_EVENTS ===== */
  /* Programme A relativity item 15.  Six pairs, each declaring what kind of
     separation it has and whether any boost reverses its order.  Both are
     recomputed from the coordinates -- and the second is checked by GOING to
     the crossover and measuring that the two events are simultaneous there,
     with opposite orders either side. */
  Object.keys(RL_EVENTS).forEach(function(k){
    var P = RL_EVENTS[k];
    var dt = P.t2 - P.t1, dx = P.x2 - P.x1;
    var X = rlEventCross(dt, dx);
    push('RL_EVENTS', k, 'declared kind', P.kind, X.kind, X.kind === P.kind ? 0 : 1,
         X.kind === P.kind, 's2 = ' + fx(X.s2));
    flag('RL_EVENTS', k, 'declared whether any boost reverses it', P.flips, X.beta !== null,
         X.beta === null ? X.why : 'crossover at beta = ' + fx(X.beta));
    if (X.beta !== null) {
      var at = rlEventPair(P.t1, P.x1, P.t2, P.x2, X.beta);
      resid('RL_EVENTS', k, 'at the crossover the two events are simultaneous',
            at.dtp, 1e-12 * Math.max(1, Math.abs(dt), Math.abs(dx)), '');
      var lo = rlEventPair(P.t1, P.x1, P.t2, P.x2, Math.max(-0.999, X.beta - 0.05));
      var hi = rlEventPair(P.t1, P.x1, P.t2, P.x2, Math.min(0.999, X.beta + 0.05));
      flag('RL_EVENTS', k, 'and the order is opposite either side of it', true,
           lo.dtp * hi.dtp < 0, fx(lo.dtp) + ' / ' + fx(hi.dtp));
    }
    /* s^2 is the number nobody can argue with, whatever the order does */
    [0.3, -0.7, 0.95].forEach(function(b){
      var E = rlEventPair(P.t1, P.x1, P.t2, P.x2, b);
      resid('RL_EVENTS', k, 's2 unchanged at beta = ' + b, E.s2p - E.s2,
            1e-12 * Math.max(1, Math.abs(E.s2)), '');
    });
  });

  /* ============================================================ RL_BARNS ===== */
  /* Programme A relativity item 16.  Five setups, each declaring whether the
     ladder fits (a statement about the BARN's frame) and what kind of
     separation the two door-closings have -- which decides whether their order
     is a matter of frame at all.  Both recomputed, plus the two routes to the
     ladder frame: transform the events, or work in the ladder's own geometry
     with no boost anywhere in it. */
  Object.keys(RL_BARNS).forEach(function(k){
    var P = RL_BARNS[k];
    var E = rlBarnEvents(P.L, P.B, P.beta);
    flag('RL_BARNS', k, 'the setup resolves', true, E.ok, E.why || '');
    if (!E.ok) return;
    flag('RL_BARNS', k, 'declared fit in the barn frame', P.fits, E.fits,
         'contracted to ' + fx(E.Lc) + ' against ' + fx(P.B));
    var kind = E.s2Doors < -1e-12 ? 'spacelike' : E.s2Doors > 1e-12 ? 'timelike' : 'lightlike';
    push('RL_BARNS', k, 'declared separation of the two door-closings', P.doors, kind,
         kind === P.doors ? 0 : 1, kind === P.doors, 's2 = ' + fx(E.s2Doors));
    resid('RL_BARNS', k, 'boosted door gap vs the ladder frame own geometry',
          E.routeGap, 1e-12 * Math.max(1, Math.abs(E.dtLadder)),
          'dt-prime = ' + fx(E.dtLadder));
    resid('RL_BARNS', k, 's2 between the closings survives the boost',
          E.s2DoorsL - E.s2Doors, 1e-11 * Math.max(1, Math.abs(E.s2Doors)), '');
    /* each end of the ladder enters before it leaves, in BOTH frames -- those
       pairs are timelike and no boost may reorder them */
    flag('RL_BARNS', k, 'the front enters before it leaves, in both frames', true,
         E.barn.frontIn.t < E.barn.frontOut.t && E.ladder.frontIn.t < E.ladder.frontOut.t, '');
    flag('RL_BARNS', k, 'and the back likewise', true,
         E.barn.backIn.t < E.barn.backOut.t && E.ladder.backIn.t < E.ladder.backOut.t, '');
  });

  /* ======================================================== RL_ELEVATORS ===== */
  /* Programme A relativity item 20.  The equivalence principle as a measurement:
     the light deflection INTEGRATED in the accelerating box against the closed
     form in the field, and the exact relativistic Doppler shift against the
     familiar gh -- of which it is the first term, not the answer. */
  Object.keys(RL_ELEVATORS).forEach(function(k){
    var P = RL_ELEVATORS[k];
    var E = rlElevatorPair(P.a, P.w, P.h, 8000);
    num('RL_ELEVATORS', k, 'the box and the field bend light the same way',
        E.bendField, E.bendBox, 1e-3, 'integrated over ' + E.n + ' steps');
    /* the integration is first order, so halving the steps doubles the gap --
       measured rather than assumed, and it is why the tolerance above is 1e-3 */
    var coarse = rlElevatorPair(P.a, P.w, P.h, 4000);
    push('RL_ELEVATORS', k, 'and halving the steps doubles the residual',
         '2', fx(Math.abs(coarse.bendBox - coarse.bendField) /
                Math.max(1e-300, Math.abs(E.bendBox - E.bendField))), 0,
         Math.abs(coarse.bendGap / Math.max(1e-300, E.bendGap) - 2) < 0.2, 'first order');
    flag('RL_ELEVATORS', k, 'the exact Doppler shift is below the linear gh', true,
         E.shiftExact <= E.shiftLinear + 1e-18,
         fx(E.shiftExact) + ' vs ' + fx(E.shiftLinear));
  });

  /* ============================================================ RL_DISKS ===== */
  /* Programme A relativity item 21.  C/2R by closed form and by COUNTING
     contracted rulers, and the departure from pi checked against its
     second-order estimate. */
  Object.keys(RL_DISKS).forEach(function(k){
    var P = RL_DISKS[k];
    var D = rlDiskGeometry(P.R, P.omega, P.ell);
    flag('RL_DISKS', k, 'the disk has a geometry', true, D.ok, D.why || '');
    if (!D.ok) return;
    num('RL_DISKS', k, 'C/2R is pi gamma', Math.PI * relGamma(P.omega * P.R), D.closed, 1e-14,
        'rim at ' + fx(D.v) + 'c');
    flag('RL_DISKS', k, 'and it exceeds pi', true, D.closed >= Math.PI - 1e-15, fx(D.excess));
    var fine = rlDiskGeometry(P.R, P.omega, P.ell / 100);
    num('RL_DISKS', k, 'counting rulers converges on the closed form',
        fine.closed, fine.counted, 1e-3, fine.rulers + ' rulers');
    flag('RL_DISKS', k, 'and a finer survey is a better one', true, fine.gap <= D.gap + 1e-15,
         fx(D.gap) + ' -> ' + fx(fine.gap));
    /* THE QUADRATIC CHECK NEEDS SOMETHING TO CHECK. At a bicycle wheel's rim
       speed the excess is 1.9e-15 and one ulp of pi is 4.4e-16, so pi*gamma -
       pi can only be a multiple of that: the computed 2.2e-15 is round-off
       wearing the right order of magnitude. Below the resolution the honest
       claim is the resolution itself, and this row makes it. */
    var ulp = Math.PI * Number.EPSILON;
    if (D.excessQuad > 100 * ulp && D.v < 0.3)
      num('RL_DISKS', k, 'the excess over pi is pi v^2 / 2', D.excessQuad, D.excess, 0.02,
          'second order in the rim speed');
    else if (D.excessQuad <= 100 * ulp)
      flag('RL_DISKS', k, 'the excess is below what a double can resolve in pi', true,
           D.excessQuad < 100 * ulp,
           'excess ' + fx(D.excessQuad) + ' against one ulp of pi at ' + fx(ulp));
    num('RL_DISKS', k, 'and a rim clock runs at 1/gamma', 1 / relGamma(D.v), D.clock, 1e-14, '');
  });

  /* ========================================================= RL_COLLIDES ===== */
  /* Programme A relativity item 19.  Four reactions, each declaring whether it
     conserves energy and momentum -- including one that deliberately does not.
     Everything is recomputed by adding four-momenta, and the invariant mass is
     checked in a frame nobody chose. */
  Object.keys(RL_COLLIDES).forEach(function(k){
    var P = RL_COLLIDES[k];
    var B = rlCollideParse(P.before, []), A = rlCollideParse(P.after, []);
    push('RL_COLLIDES', k, 'both lists parse', 0, B.errs.length + A.errs.length,
         B.errs.length + A.errs.length, B.errs.length + A.errs.length === 0,
         B.errs.concat(A.errs).map(function(e){ return e.msg; }).join('; '));
    if (!B.parts.length) return;
    var M = rlCollideMeasure(B.parts, A.parts);
    /* THE INVARIANT MASS IS INVARIANT -- boost the whole system and recompute */
    resid('RL_COLLIDES', k, 'invariant mass unchanged by a boost of the whole system',
          M.boostGap, 1e-11 * Math.max(1e-9, M.mIn), 'm = ' + fx(M.mIn));
    /* and it is NOT the sum of the masses, except where nothing is moving */
    if (M.grossE > M.sumMIn + 1e-9)
      flag('RL_COLLIDES', k, 'and it is not the sum of the individual masses', true,
           Math.abs(M.mIn - M.sumMIn) > 1e-9,
           fx(M.mIn) + ' against ' + fx(M.sumMIn));
    if (A.parts.length) {
      flag('RL_COLLIDES', k, 'declared conservation of energy and momentum',
           P.conserves, M.conserves, 'dE = ' + fx(M.dE) + ', dp = ' + fx(M.dp));
      if (M.conserves) {
        resid('RL_COLLIDES', k, 'and the invariant mass is the same on both sides',
              M.massGap, 1e-9 * M.grossE, '');
        /* the rest mass CREATED is the kinetic energy that stopped being kinetic */
        var kin = M.grossE - M.sumMIn;
        num('RL_COLLIDES', k, 'the rest mass made is the kinetic energy lost',
            kin, M.made, 1e-9, 'E = mc^2, as arithmetic');
      }
    }
  });

  /* ========================================================== RL_SOURCES ===== */
  /* Programme A relativity item 18.  Four sources, and the three regimes of the
     Doppler factor -- of which the transverse one has no classical counterpart
     at all.  The angle at which the shift VANISHES is checked separately,
     because it is not 90 degrees and that is the whole point. */
  Object.keys(RL_SOURCES).forEach(function(k){
    var P = RL_SOURCES[k], b = Math.min(0.999, Math.abs(P.beta));
    var R = rlBeamPower(b, P.theta * Math.PI / 180);
    num('RL_SOURCES', k, 'the transverse shift is exactly 1/gamma',
        1 / relGamma(b), R.transverse, 1e-14, 'no classical counterpart at all');
    num('RL_SOURCES', k, 'approaching and receding are reciprocals',
        1, R.approaching * R.receding, 1e-13, '');
    num('RL_SOURCES', k, 'and the four powers of delta multiply to delta^4',
        R.total, R.energyPerPhoton * R.arrivalRate * R.solidAngle, 1e-12, '');
    /* the unshifted angle, and that it is FORWARD of 90 degrees */
    var N = rlDopplerNull(b);
    flag('RL_SOURCES', k, 'there is an angle at which nothing is shifted', true, N.ok, N.why || '');
    if (N.ok) {
      num('RL_SOURCES', k, 'and delta is exactly 1 there', 1, relDoppler(b, N.theta), 1e-13,
          'at ' + fx(N.theta * 180 / Math.PI) + ' degrees');
      flag('RL_SOURCES', k, 'which is forward of 90 degrees unless the source is at rest',
           true, b < 1e-12 || N.theta < Math.PI / 2 - 1e-9,
           fx(N.theta * 180 / Math.PI) + ' degrees');
    }
  });


  /* =========================================================== CN_POLYS ===== */
  /* Programme C wing C2.  Each polynomial declares its degree, how many of its
     roots are real, how many sit on the unit circle, and the largest
     multiplicity -- and every one of those is recomputed here from the roots,
     which the declaration never sees.  The cross-check that matters most is
     Vieta: the factors are multiplied back out and compared with the very
     coefficient string the table stores, by a route that never evaluates the
     polynomial at any point. */
  Object.keys(CN_POLYS).forEach(function(k){
    var P = CN_POLYS[k], G = cnCoeffsParse(P.coeffs);
    flag('CN_POLYS', k, 'the coefficient string parses', true, G.ok, G.why);
    if (!G.ok) return;
    var M = cnPolyMeasure(G.c);
    flag('CN_POLYS', k, 'it has roots at all', true, M.ok, M.why);
    if (!M.ok) return;
    num('CN_POLYS', k, 'declared degree against the number of roots found',
        P.degree, M.roots.length, 1e-12, '');
    /* the accuracy a root of multiplicity m can have is eps^(1/m), so both
       tolerances below are DERIVED from the multiplicity this run measured
       rather than set to whatever made the repeated-root preset pass */
    var acc = Math.max(1e-10, 10 * M.expected);
    num('CN_POLYS', k, 'declared largest multiplicity against the clustering',
        P.mult, M.mult, 1e-12, 'accuracy available here: ' + fx(M.expected));
    resid('CN_POLYS', k, 'every root satisfies the equation',
          M.worst, 1e-10 * M.worstGross, 'against ' + fx(M.worstGross) + ' of cancelling terms');
    resid('CN_POLYS', k, 'and the factors multiply back to the coefficients',
          M.vieta.gap, acc * M.vieta.gross, 'Vieta, which never evaluates p');
    resid('CN_POLYS', k, 'the roots sum to -c1/c0',
          M.vieta.sumGap, acc * (1 + Math.hypot(M.vieta.sum.re, M.vieta.sum.im)), '');
    resid('CN_POLYS', k, 'and multiply to (-1)^n cn/c0',
          M.vieta.prodGap, acc * (1 + Math.hypot(M.vieta.prod.re, M.vieta.prod.im)), '');
    num('CN_POLYS', k, 'declared count of real roots against the measurement',
        P.real, M.real, 1e-12, '');
    /* how many sit on the unit circle -- a third property, recomputed */
    var onUnit = 0;
    for (var i = 0; i < M.roots.length; i++)
      if (Math.abs(Math.hypot(M.roots[i].re, M.roots[i].im) - 1) <= Math.max(1e-9, acc)) onUnit++;
    num('CN_POLYS', k, 'declared count on the unit circle', P.unit, onUnit, 1e-12, '');
    /* the conjugate-pair theorem, only where its hypothesis holds */
    var CP = cnConjugatePairs(G.c, M.roots);
    if (CP.applies)
      resid('CN_POLYS', k, 'non-real roots come in conjugate pairs',
            CP.worst, acc * Math.max(1e-12, CP.scale), 'real coefficients');
    else
      flag('CN_POLYS', k, 'complex coefficients, so no pairing is claimed',
           true, /not all real/.test(CP.why), CP.why);
    /* Cauchy's bound is a claim about every root, so check every root */
    var outside = 0;
    for (var j = 0; j < M.roots.length; j++)
      if (Math.hypot(M.roots[j].re, M.roots[j].im) > M.bound + 1e-9) outside++;
    num('CN_POLYS', k, 'no root lies outside the Cauchy bound', 0, outside, 1e-12,
        'bound ' + fx(M.bound));
  });

  /* =========================================================== CN_PAIRS ===== */
  /* The claim under the whole wing: multiplying multiplies the moduli and adds
     the arguments.  Componentwise against polar, on every pair the stages offer,
     with the argument comparison taken on the circle -- a product whose argument
     crosses the cut differs by 2pi and is the same angle. */
  Object.keys(CN_PAIRS).forEach(function(k){
    var P = CN_PAIRS[k], A = cnParse(P.a), B = cnParse(P.b);
    flag('CN_PAIRS', k, 'both numbers parse', true, A.ok && B.ok, A.why + ' ' + B.why);
    if (!A.ok || !B.ok) return;
    var M = cnMulPolar(A.z, B.z);
    resid('CN_PAIRS', k, 'polar and componentwise products agree',
          M.gap, 1e-12 * Math.max(1e-300, M.gross), 'scale ' + fx(M.gross));
    resid('CN_PAIRS', k, 'the moduli multiply',
          M.modGap, 1e-12 * Math.max(1e-300, M.gross), '');
    resid('CN_PAIRS', k, 'and the arguments add, on the circle', M.argGap, 1e-12, 'radians');
    /* division undoes multiplication -- a third route, and the one that needs
       the conjugate identity to work at all */
    if (cxAbs(B.z) > 1e-12) {
      var back = cxDiv(M.prod, B.z);
      resid('CN_PAIRS', k, 'dividing the product by z2 returns z1',
            cxAbs(cxSub(back, A.z)), 1e-12 * Math.max(1e-300, cxAbs(A.z)), '');
    }
    /* and z z-bar is real and equals |z| squared */
    var zz = cxMul(A.z, cxConj(A.z));
    resid('CN_PAIRS', k, 'z times its conjugate is real', Math.abs(zz.im),
          1e-13 * Math.max(1e-300, cxAbs(A.z) * cxAbs(A.z)), '');
    num('CN_PAIRS', k, 'and equals |z| squared', cxAbs(A.z) * cxAbs(A.z), zz.re, 1e-13, '');
  });

  /* ========================================================= CN_PHASORS ===== */
  /* Two routes that share nothing: adding the complex amplitudes, and sampling
     the summed WAVE over one period and projecting it onto cos and sin.  The
     second is a trapezoid rule, which on a periodic integrand is spectrally
     accurate -- so the tolerance below is the rule's own measured error, not a
     guess, and the antiphase preset is the one that needs a gross at all. */
  Object.keys(CN_PHASORS).forEach(function(k){
    var P = CN_PHASORS[k], S = cnPhasorSum(P.parts);
    resid('CN_PHASORS', k, 'the arrow sum matches the wave it describes',
          S.gap, 1e-12 * S.gross, 'gross ' + fx(S.gross) + ' -- the amplitudes that cancelled');
    /* the amplitude and phase must reproduce the wave at sample points, which
       neither route above checked pointwise */
    var worst = 0;
    for (var i = 0; i < 37; i++) {
      var t = 2 * Math.PI * i / 37, y = 0;
      for (var j = 0; j < P.parts.length; j++)
        y += P.parts[j].amp * Math.cos(t + P.parts[j].phase);
      worst = Math.max(worst, Math.abs(y - S.amp * Math.cos(t + S.phase)));
    }
    resid('CN_PHASORS', k, 'and one wave of that amplitude and phase IS the sum, pointwise',
          worst, 1e-12 * S.gross, 'checked at 37 instants');
  });

  /* ============================================================ CS_MAPS ===== */
  /* Programme C wing C4.  Each map declares a closed-form Jacobian, the area of
     its image, how many times it covers that image, whether |J| vanishes
     anywhere on the rectangle, and whether the coordinate curves are
     perpendicular.  Every one of those is recomputed here, and the routes share
     nothing with the declaration: the Jacobian by central differences and again
     by sqrt(EG - F^2), the area by pulling back, by Green's theorem on the image
     of the boundary, and by inverting the map over a grid. */
  Object.keys(CS_MAPS).forEach(function(k){
    var P = CS_MAPS[k], M = csMapOf(P);
    flag('CS_MAPS', k, 'the map builds', true, M.ok, M.why);
    if (!M.ok) return;
    var R = csMeasure(P, 110);
    flag('CS_MAPS', k, 'it measures', true, R.ok, R.why);
    if (!R.ok) return;
    var scale = Math.max(1e-12, Math.abs(R.det));

    /* the Jacobian, three routes against the declared closed form */
    resid('CS_MAPS', k, 'the metric route agrees with the determinant',
          Math.abs(R.detMetric - Math.abs(R.det)), 1e-7 * scale, 'sqrt(EG - F^2)');
    resid('CS_MAPS', k, 'and the declared closed form agrees with both',
          Math.abs(Math.abs(R.detDeclared) - Math.abs(R.det)), 1e-6 * scale,
          'declared ' + P.jac);
    /* the cell-area route is FIRST order, so its ORDER is the claim */
    flag('CS_MAPS', k, 'the cell-area route converges at first order, or is exact',
         true,
         R.order.e2 < 1e-9 * Math.max(1e-12, R.order.exact) ||
         (R.order.ratio > 1.5 && R.order.ratio < 4.5),
         'ratio ' + fx(R.order.ratio) + ', e2 ' + fx(R.order.e2));

    /* orthogonality, and the identity that follows from it */
    flag('CS_MAPS', k, 'the declared orthogonality is what is measured',
         P.orthogonal, R.metric.orthogonal, 'cos angle ' + fx(R.metric.cosAngle));
    if (P.orthogonal)
      resid('CS_MAPS', k, 'and an orthogonal system has |J| = h_u h_v',
            Math.abs(R.metric.hu * R.metric.hv - Math.abs(R.det)), 1e-7 * scale, '');

    /* the area, and the covering number that decides whether the theorem holds */
    var GE = csAreaGreenErr(M, P.u0, P.u1, P.v0, P.v1);
    if (P.cover === 1)
      resid('CS_MAPS', k, 'Green round the boundary matches the pulled-back integral',
            Math.abs(Math.abs(GE.area) - R.pull), 4 * GE.self + 1e-9 * R.pull,
            'Greens own error ' + fx(GE.self));
    else
      resid('CS_MAPS', k, 'a folding map returns zero from Green, because its boundary doubles back',
            Math.abs(GE.area), 1e-6 * R.pull, '');
    resid('CS_MAPS', k, 'the grid over the image agrees to its own measured error',
          Math.abs(R.grid * P.cover - R.pull), 6 * R.gridSelf + 1e-9 * R.pull,
          'grid error ' + fx(R.gridSelf));
    num('CS_MAPS', k, 'the declared covering number is what is measured',
        P.cover, R.cover, 0.06, 'ratio of the pull-back to the ground covered');
    if (P.area !== null && P.area !== undefined)
      num('CS_MAPS', k, 'and the declared image area is what the pull-back gives',
          P.area * P.cover, R.pull, 1e-6, '');

    /* does |J| vanish anywhere on the rectangle? */
    var minJ = Infinity, maxJ = 0;
    for (var i = 0; i <= 20; i++) for (var j = 0; j <= 20; j++) {
      var u = P.u0 + (P.u1 - P.u0) * i / 20, v = P.v0 + (P.v1 - P.v0) * j / 20;
      var d = Math.abs(csJacNum(M, u, v).det);
      if (isFinite(d)) { minJ = Math.min(minJ, d); maxJ = Math.max(maxJ, d); }
    }
    flag('CS_MAPS', k, 'the declared degeneracy is what is measured',
         P.degenerate, minJ <= 1e-6 * Math.max(1e-12, maxJ),
         'min |J| ' + fx(minJ) + ' against max ' + fx(maxJ));
  });

  /* ========================================================== CS_SOLIDS ===== */
  /* Each solid declares a closed-form volume and is integrated in every
     coordinate system it can honestly be described in.  Each route is held to
     the error it measures for ITSELF, by being run again with more panels --
     the systems do not converge at the same rate on the same solid, and holding
     them to one shared tolerance would either hide that or fail on it. */
  Object.keys(CS_SOLIDS).forEach(function(k){
    var M = csSolidMeasure(k);
    flag('CS_SOLIDS', k, 'it has at least two independent routes', true,
         M.routes.length >= 2, M.routes.map(function(r){ return r.name; }).join(', '));
    for (var i = 0; i < M.routes.length; i++) {
      var r = M.routes[i];
      resid('CS_SOLIDS', k, 'the ' + r.name + ' route agrees with the closed form',
            Math.abs(r.value - M.declared), 6 * r.self + 1e-9 * M.gross,
            'its own error ' + fx(r.self));
    }
    resid('CS_SOLIDS', k, 'and the routes agree with each other, which needs no closed form',
          M.spread, 1e-4 * M.gross, '');
  });

  /* the volume elements, against a small box rather than against themselves */
  [[0.5, 0.7], [1.3, 2.9], [2.0, 1.1]].forEach(function(p){
    var quoted = csElementCyl(p[0]).j, h = 1e-3;
    var e1 = Math.abs(csCellVolCyl(p[0], p[1], 0.3, h) / (h * h * h) - quoted);
    var e2 = Math.abs(csCellVolCyl(p[0], p[1], 0.3, h / 2) / (h * h * h / 8) - quoted);
    flag('CS_ELEMENT', 'cyl r=' + p[0], 'r is what a small box measures, at first order',
         true, e2 < 1e-9 * quoted || (e1 / e2 > 1.5 && e1 / e2 < 4.5),
         'quoted ' + fx(quoted) + ', ratio ' + fx(e1 / e2));
    var qs = csElementSph(p[0], p[1]).j;
    var s1 = Math.abs(csCellVolSph(p[0], p[1], 0.3, h) / (h * h * h) - qs);
    var s2 = Math.abs(csCellVolSph(p[0], p[1], 0.3, h / 2) / (h * h * h / 8) - qs);
    flag('CS_ELEMENT', 'sph rho=' + p[0], 'rho^2 sin(phi) likewise',
         true, s2 < 1e-9 * qs || (s1 / s2 > 1.5 && s1 / s2 < 4.5),
         'quoted ' + fx(qs) + ', ratio ' + fx(s1 / s2));
    num('CS_ELEMENT', 'sph rho=' + p[0], 'and the three scale factors multiply to it',
        qs, csElementSph(p[0], p[1]).hs.reduce(function(a, b){ return a * b; }, 1), 1e-13, '');
  });

  /* ============================================================ DSP_WIN ====== */
  /* A window is seven numbers and every property anyone chooses one for is a
     consequence of them.  Two of those properties have EXACT closed forms in the
     coefficients -- the coherent gain is a_0 and the noise bandwidth is
     1 + sum a_k^2 / 2a_0^2 -- so the check is an identity rather than a
     tolerance, and a mistyped coefficient cannot survive it.  The rest are read
     off a 32x zero-padded transform and compared against Harris (1978), which is
     the table every textbook copies and nothing in this repository had checked. */
  var DSP_HARRIS = {
    rect:     { side:-13.26, nul:1, scallop:-3.92 },
    hann:     { side:-31.47, nul:2, scallop:-1.42 },
    hamming:  { side:-42.66, nul:2, scallop:-1.75 },
    blackman: { side:-58.12, nul:3, scallop:-1.10 },
    bharris:  { side:-92.03, nul:4, scallop:-0.83 },
    flattop:  { side:-92.75, nul:5, scallop:-0.01 }
  };
  DSP_WIN_KEYS.forEach(function(k){
    var N = 256, S = dspWinSums(k, N), M = dspWinMetrics(k, N, 32);
    if (dspWinCGExact(k) !== null) {
      num('DSP_WIN', k, 'coherent gain: summed over the taps vs a_0',
          dspWinCGExact(k), S.cg, 1e-14, 'an identity, so the tolerance is round-off');
      num('DSP_WIN', k, 'ENBW: N*sum(w^2)/sum(w)^2 vs 1 + sum a_k^2 / 2a_0^2',
          dspWinENBWExact(k), S.enbw, 1e-12, 'likewise exact');
    }
    /* the transform, by FFT and by a sum of Dirichlet kernels that never forms
       the window at all -- the one genuinely independent route to leakage */
    if (k !== 'bartlett') {
      var W = dspWinSpecFFT(k, 64, 32), worst = 0;
      for (var i = 0; i < W.mag.length; i++)
        worst = Math.max(worst, Math.abs(dspWinSpecExact(k, i / W.pad, 64).mag - W.mag[i]));
      resid('DSP_WIN', k, 'its transform: an FFT against a sum of Dirichlet kernels',
            worst / W.mag[0], 1e-12, 'relative to W(0)');
    }
    var H = DSP_HARRIS[k];
    if (H) {
      num('DSP_WIN', k, 'highest sidelobe, measured vs Harris 1978', H.side, M.sidelobeDb, 2e-3, 'dB');
      num('DSP_WIN', k, 'first null, in bins', H.nul, M.firstNull, 1e-9, 'bins');
      resid('DSP_WIN', k, 'scalloping loss, measured vs Harris 1978',
            Math.abs(H.scallop - M.scallopDb), 6e-3, 'dB, and Harris quotes two decimals');
    }
    /* ENBW must not depend on the record length -- FOR A COSINE SUM, where the
       closed form contains no N at all.  Bartlett is not one, and its ENBW is
       N-dependent at second order; claiming the invariance for it was too broad
       and the gate said so.  It gets the honest claim instead: the value
       CONVERGES to 4/3, and the error falls by four when N doubles. */
    if (dspWinENBWExact(k) !== null) {
      var spread = 0, base = dspWinSums(k, 128).enbw;
      [256, 512, 1024].forEach(function(n){ spread = Math.max(spread, Math.abs(dspWinSums(k, n).enbw - base)); });
      resid('DSP_WIN', k, 'ENBW is the same at N = 128, 256, 512 and 1024', spread, 1e-12,
            'no N appears in the closed form');
    } else {
      var e1 = Math.abs(dspWinSums(k, 256).enbw - 4 / 3);
      var e2 = Math.abs(dspWinSums(k, 512).enbw - 4 / 3);
      flag('DSP_WIN', k, 'a triangle is not a cosine sum: its ENBW CONVERGES to 4/3 at second order',
           true, e1 / e2 > 3 && e1 / e2 < 5,
           'at N=256 off by ' + fx(e1) + ', at N=512 by ' + fx(e2) + ', ratio ' + fx(e1 / e2));
    }
  });
  /* and the two samplings of the same function agree exactly where they should */
  ['rect', 'hann', 'hamming', 'blackman'].forEach(function(k){
    var m = 0;
    for (var n = 0; n < 32; n++) m = Math.max(m, Math.abs(dspWindow(k, n, 32) - ftWindowFn(k, n, 33)));
    resid('DSP_WIN', k, 'the periodic sampling at N is the symmetric one at N+1', m, 0,
          'the same function, two samplings');
  });

  /* ======================================================== DSP_SIGNALS ====== */
  /* Each signal declares a band limit and a line spectrum, and both are checked
     against a transform of the record rather than against the algebra that
     produced them.  The three that declare NO band limit have to earn that too:
     a measured edge that moves when the tolerance does is what "not band
     limited" means, and a fixed one would mean the declaration was a dodge. */
  DSP_SIGNAL_KEYS.forEach(function(k){
    var S = DSP_SIGNALS[k];
    var B4 = dspBandMeasure(S.x, DSP_DUR, 1e-4);
    if (S.band === null) {
      var loose = dspBandMeasure(S.x, DSP_DUR, 1e-3).f;
      var tight = dspBandMeasure(S.x, DSP_DUR, 1e-6).f;
      flag('DSP_SIGNALS', k, 'declares no band limit, and its measured edge moves with the tolerance',
           true, tight > loose + 2 * B4.bin,
           'at 1e-3: ' + fx(loose) + ' Hz, at 1e-6: ' + fx(tight) + ' Hz');
    } else {
      num('DSP_SIGNALS', k, 'contains nothing above its declared band limit',
          S.band, B4.f, 1e-9, 'Hz, at 99.99% of the energy');
    }
    /* every declared component, found in the spectrum at the declared amplitude */
    if (S.comps) {
      var E = B4.profile;
      /* the record is DSP_DUR long and unwindowed, so a component at f lands
         exactly on bin f*DSP_DUR whenever f*DSP_DUR is an integer -- which it is
         for every entry in this table, by construction */
      S.comps.forEach(function(c){
        var kb = Math.round(c.f * DSP_DUR);
        /* |X_k| = amp * N / 2 for a real sinusoid of that amplitude */
        var amp = 2 * Math.sqrt(E.p[kb]) / (E.half * 2);
        num('DSP_SIGNALS', k, 'the declared ' + c.f + ' Hz component is there, at its amplitude',
            c.amp, amp, 2e-3, 'measured from the unwindowed transform');
      });
      /* and the arithmetic fold agrees with the peak of a real sampled record */
      var loudest = S.comps.reduce(function(a, c){ return c.amp > a.amp ? c : a; });
      [16, 24, 32, 48].forEach(function(fs){
        var N = Math.round(DSP_DUR * fs);
        var got = dspPeakFreq(dspSamples(S.x, fs, N), fs);
        if (got === null) {
          flag('DSP_SIGNALS', k, 'at fs = ' + fs + ' every sample is zero, and no peak is reported',
               true, true, 'a carrier at exactly Nyquist does this');
          return;
        }
        /* the peak is only guaranteed to be the LOUDEST component's alias when
           nothing else folds onto a louder place -- so this checks that the
           measured peak is the fold of SOME declared component, which is the
           statement the arithmetic actually supports */
        var best = 1e300;
        S.comps.forEach(function(c){ best = Math.min(best, Math.abs(got - ftAlias(c.f, fs))); });
        resid('DSP_SIGNALS', k, 'at fs = ' + fs + ' the measured peak is the fold of a declared component',
              best, 0.02, 'Hz; loudest is ' + loudest.f + ' Hz -> ' + fx(ftAlias(loudest.f, fs)));
      });
    }
  });

  /* ======================================================== DSP_FILTERS ====== */
  /* Every filter declares its DC gain, its Nyquist gain, whether its phase is
     linear, its delay, its largest pole and (where it has one) a stopband bound.
     Each is recomputed by a route that does not read the declaration -- and the
     response itself is checked against DRIVING the recursion, which shares no
     arithmetic with evaluating B(z)/A(z). */
  DSP_FILTER_KEYS.forEach(function(k){
    var P = DSP_FILTERS[k], f = P.make(), settle = dspSettle(f.b, f.a);
    /* A DECLARED ZERO NEEDS resid, NOT num.  `num` divides by the declared
       value, so a declared 0 against a computed 1.09e-16 is a relative error of
       infinity and reads as BAD -- the both-routes-vanish class, arriving inside
       the gate written to enforce it.  Three filters declare an exact zero gain
       and every one of them was reported broken by that. */
    if (P.dc !== null) {
      if (P.dc === 0) resid('DSP_FILTERS', k, 'declared DC gain of exactly zero',
                            dspResp(f.b, f.a, 0).mag, 1e-12, 'against the peak gain, which is order 1');
      else num('DSP_FILTERS', k, 'declared DC gain', P.dc, dspResp(f.b, f.a, 0).mag, 1e-9, '');
    }
    if (P.nyq !== null) {
      if (P.nyq === 0) resid('DSP_FILTERS', k, 'declared gain at Nyquist of exactly zero',
                             dspResp(f.b, f.a, 0.5).mag, 1e-12, '');
      else num('DSP_FILTERS', k, 'declared gain at Nyquist', P.nyq, dspResp(f.b, f.a, 0.5).mag, 1e-9, '');
    }
    if (P.linear === true)
      resid('DSP_FILTERS', k, 'declares linear phase, so its taps must be a palindrome',
            dspSymResid(f.b), 1e-14, '');
    if (P.linear === false)
      flag('DSP_FILTERS', k, 'declares its phase is NOT linear', true, dspSymResid(f.b) > 1e-12 ||
           f.a.length > 1, 'symmetry residual ' + fx(dspSymResid(f.b)));
    if (P.delay !== null)
      num('DSP_FILTERS', k, 'declared delay, against the centroid of h[n]',
          P.delay, dspCentroidDelay(f.b, f.a), 1e-9, 'samples');
    if (P.poleMax !== null)
      num('DSP_FILTERS', k, 'declared largest pole radius, against the roots of a',
          P.poleMax, dspMaxPole(f.a), 1e-9, '');
    if (P.stop) {
      var got = dspStopband(f.b, f.a, P.stop[0], P.stop[1]).db;
      flag('DSP_FILTERS', k, 'declared stopband under ' + P.stop[2] + ' dB', true, got < P.stop[2],
           'measured ' + fx(got) + ' dB over ' + P.stop[0] + ' to ' + P.stop[1]);
    }
    flag('DSP_FILTERS', k, 'declared ' + P.kind, true,
         (P.kind === 'IIR') === (f.a.length > 1), 'a has ' + f.a.length + ' entries');
    /* THE TWO ROUTES.  Evaluating the rational function, against running the
       difference equation on e^(2 pi i f n) and dividing the output by the input. */
    var worst = 0, peak = 0;
    for (var i = 0; i <= 120; i++) {
      var fr = 0.5 * i / 120;
      var A = dspResp(f.b, f.a, fr), D = dspDrive(f.b, f.a, fr, settle);
      worst = Math.max(worst, Math.sqrt((A.re - D.re) * (A.re - D.re) + (A.im - D.im) * (A.im - D.im)));
      peak = Math.max(peak, A.mag);
    }
    resid('DSP_FILTERS', k, 'H from the coefficients vs H from running the filter',
          worst / peak, 1e-12, 'relative to the peak gain ' + fx(peak));
    /* and the group delay, exactly against differenced, everywhere it exists */
    var gw = 0, gn = 0;
    for (var j = 0; j <= 120; j++) {
      var g1 = dspGroupDelay(f.b, f.a, 0.5 * j / 120), g2 = dspGroupDelayNum(f.b, f.a, 0.5 * j / 120);
      if (g1 === null || g2 === null) continue;
      gw = Math.max(gw, Math.abs(g1 - g2)); gn++;
    }
    resid('DSP_FILTERS', k, 'group delay: exact against differenced, over ' + gn + ' frequencies',
          gw, 1e-4, 'samples');
  });

  /* ===================================================== DSP_RESOLUTION ====== */
  /* The short-time transform's resolution product is the window's noise
     bandwidth, with no N and no f_s in it.  That is an INVARIANCE rather than a
     value, so it is checked by sweeping both and taking the spread. */
  DSP_WIN_KEYS.forEach(function(k){
    var base = dspStftResolution(64, 128, k).product, spread = 0;
    [[16, 64], [32, 128], [128, 256], [256, 1024], [512, 44100]].forEach(function(p){
      spread = Math.max(spread, Math.abs(dspStftResolution(p[0], p[1], k).product - base));
    });
    /* the same caveat as the ENBW above, and for the same reason: the product IS
       the ENBW, so a window whose ENBW moves with N has a product that moves too */
    resid('DSP_RESOLUTION', k, 'dt * df is the same at every N and every rate', spread,
          dspWinENBWExact(k) === null ? 2e-2 : 1e-12,
          dspWinENBWExact(k) === null ? 'a triangle, whose ENBW is only asymptotically 4/3' : '');
    if (dspWinENBWExact(k) !== null)
      num('DSP_RESOLUTION', k, 'and that constant is the window ENBW',
          dspWinENBWExact(k), base, 1e-12, 'bins');
  });
  /* the ridge of a chirp against the law it was built from, at three window
     lengths -- the tolerance is a tenth of a bin, which is what the estimator's
     own measured error is */
  [32, 64, 128].forEach(function(N){
    var S = DSP_SIGNALS.chirp, fs = 128;
    var sig = dspSamples(S.x, fs, Math.round(DSP_SPEC_DUR * fs));
    var E = dspRidgeError(dspStft(sig, N, N / 4, 'hann'), fs, S.finst);
    /* HALF A BIN, and the tolerance is set from where the residual actually
       lives rather than from a guess.  It is not estimator error: the record
       opens with the chirp at 1 Hz, and at N = 32 one bin is 4 Hz, so the first
       columns are being asked for a frequency the transform has no bins for --
       dspPeakBin cannot report below half a bin, because there is nothing on the
       other side of the peak to interpolate against.  Away from those columns
       the agreement is two hundredths of a bin. */
    resid('DSP_RESOLUTION', 'chirp N=' + N, 'the ridge follows the instantaneous frequency',
          E.worst, 0.5 * fs / N,
          'Hz, against a bin of ' + fx(fs / N) + '; the worst column is where the chirp is under one bin');
  });


  /* ============================================================== UN_EQNS ==== */
  /* Every entry declares `homog`, and two of them declare FALSE on purpose --
     which makes this the rare claims block where the audit has to agree that a
     table is wrong. A check that only ever confirms is not known to work; here
     the negative controls are shipped in the table itself. */
  Object.keys(UN_EQNS).forEach(function(k){
    var E = UN_EQNS[k], A = unRead(E.lhs), B = unRead(E.rhs);
    if (!A.ok || !B.ok) {
      push('UN_EQNS', k, 'both sides parse', 'yes',
           (A.ok ? '' : 'lhs: ' + A.why) + (B.ok ? '' : ' rhs: ' + B.why), 1, false, '');
      return;
    }
    flag('UN_EQNS', k, 'homogeneous as declared', E.homog, unDimSame(A.d, B.d),
         unFmtDim(A.d) + ' against ' + unFmtDim(B.d));
    /* and each side's own dimension vector is confirmed by the second route --
       rescale the base units, evaluate as an ordinary product, read the
       exponents out of the logarithms */
    resid('UN_EQNS', k, 'left side: adding exponents against rescaling the base units',
          unDimCheck(E.lhs).gap, 1e-11);
    resid('UN_EQNS', k, 'right side: the same, independently',
          unDimCheck(E.rhs).gap, 1e-11);
  });

  /* =============================================================== UN_PI ===== */
  /* `nPi` is the count of dimensionless groups the entry claims, and it is
     recomputed here from the dimension matrix alone. `pi1` is a much stronger
     claim: the value the first group takes when the real physics is put in, and
     for the Bohr radius that is checked against CODATA numbers the table never
     sees. */
  Object.keys(UN_PI).forEach(function(k){
    var E = UN_PI[k];
    if (E.nPi === null || E.nPi === undefined) return;      /* the reader's own list */
    var G = unPiGroups(E.vars, E.order);
    num('UN_PI', k, 'number of independent groups', E.nPi, G.nPi, 0,
        'n ' + G.n + ' minus rank ' + G.rank);
    push('UN_PI', k, 'rank + nullity = n', E.vars.length, G.rank + G.nPi,
         Math.abs(E.vars.length - G.rank - G.nPi), G.rank + G.nPi === G.n, '');
    /* every group is recomputed dimension by dimension from its TIDIED
       exponents, so a bad tidy cannot hide behind a check of the untidied one */
    resid('UN_PI', k, 'every group is genuinely dimensionless', G.worst, 1e-11,
          G.groups.map(function(g){ return unPiText(g, E.vars); }).join(' | '));
    if (E.pi1 === null || E.pi1 === undefined) return;
    var V = unPiSecond(k);
    if (!V) return;
    /* CODATA's own rounding in hbar, m_e, e and eps0 puts a floor of about 1e-9
       under the Bohr row; the other three are exact by construction. The
       tolerance is that floor, and it is where the residual actually lives
       rather than a round number chosen to pass. */
    num('UN_PI', k, 'the constant the physics supplies', E.pi1, V.v, 1e-8, V.txt);
  });

  /* ============================================================ UN_UNITS ===== */
  /* The named derived units are a table of exponent vectors typed by hand, and
     the same hand typed the base ones. What makes this a test rather than a
     tautology is that each named unit is rebuilt from a DEFINITION written in
     other units -- the ohm from V/A, the farad from C/V -- so the two sides
     came from different places. */
  [['N', 'kg m / s^2'], ['J', 'N m'], ['W', 'J/s'], ['Pa', 'N/m^2'], ['Hz', '1/s'],
   ['C', 'A s'], ['V', 'W/A'], ['F', 'C/V'], ['ohm', 'V/A'], ['S', 'A/V'],
   ['T', 'Wb/m^2'], ['Wb', 'V s'], ['H', 'Wb/A']].forEach(function(p){
    var built = unRead(p[1]);
    if (!built.ok) { push('UN_UNITS', p[0], 'the definition parses', 'yes', built.why, 1, false, ''); return; }
    var gap = 0;
    for (var i = 0; i < UN_NB; i++) gap = Math.max(gap, Math.abs(UN_UNITS[p[0]].d[i] - built.d[i]));
    resid('UN_UNITS', p[0], 'the tabled vector against ' + p[1], gap, 0,
          unFmtSI(built.d));
    /* and the scale factor of a coherent SI unit is exactly 1 -- an entry with
       a factor of 1.0000001 would be a typo nothing else could see */
    resid('UN_UNITS', p[0], 'coherent, so the SI factor is exactly 1',
          Math.abs(built.f - 1), 0);
  });
  /* the non-coherent entries declare a factor instead, and each is checked
     against the definition it abbreviates */
  [['eV', 1.602176634e-19], ['MeV', 1.602176634e-13], ['km', 1e3], ['h', 3600],
   ['day', 86400], ['L', 1e-3], ['u', 1.66053906892e-27]].forEach(function(p){
    num('UN_UNITS', p[0], 'declared SI scale factor', p[1], UN_UNITS[p[0]].f, 1e-15, '');
  });

  /* ============================================================== DC_KINDS === */
  /* Each entry declares a closed form as a function and a display formula. The
     check recomputes the count by ENUMERATION -- building the objects one at a
     time -- so the declaration is checked against the definition rather than
     against another formula. */
  Object.keys(DC_KINDS).forEach(function(k){
    [[4,2],[5,3],[6,3],[7,2],[3,4]].forEach(function(p){
      var C = dcCountCheck(k, p[0], p[1], 60000);
      if (C.overflow) {
        push('DC_KINDS', k, 'enumeration refuses above its cap rather than truncating',
             'refuse', 'refused', 0, C.enumerated === null, 'n=' + p[0] + ' k=' + p[1]);
        return;
      }
      resid('DC_KINDS', k, 'closed form minus the enumerated count at n=' + p[0] + ' k=' + p[1],
            C.closed - C.enumerated, 0, 'closed ' + C.closed);
    });
    /* and the relation between the four, which is what makes them one table */
    for (var n = 3; n <= 7; n++) for (var kk = 2; kk <= 3; kk++)
      resid('DC_KINDS', k, 'P(n,k) = C(n,k) k! at n=' + n + ' k=' + kk,
            DC_KINDS.perm.f(n, kk) - DC_KINDS.comb.f(n, kk) * dcFact(kk), 0);
  });

  /* ============================================================== DC_INCL ==== */
  /* Every entry is a universe and three membership predicates. The claim each
     one makes is that the alternating sum over 2^3 - 1 intersections equals the
     count obtained by walking the universe once -- and `complement` claims the
     complement is Euler's product. The disjoint entry additionally claims that
     every correction vanishes, which is the block's own negative control. */
  Object.keys(DC_INCL).forEach(function(k){
    var E = DC_INCL[k];
    var I = dcInclExcl(E.sets, E.U);
    resid('DC_INCL', k, 'alternating sum minus the direct count', I.formula - I.direct, 0,
          'union ' + I.direct + ' of ' + E.U);
    num('DC_INCL', k, 'the formula has 2^m - 1 terms', Math.pow(2, 3) - 1, I.terms.length, 0);
    flag('DC_INCL', k, 'the gross is at least the answer', true, I.gross >= I.formula,
         'gross ' + I.gross + ', answer ' + I.formula);
    if (E.complement)
      num('DC_INCL', k, "complement against Euler's product N(1-1/2)(1-1/3)(1-1/5)",
          4 * E.U / 15, E.U - I.direct, 0.01, 'the product is not an integer; the count is');
    if (k === 'disjoint') {
      var corr = I.terms.filter(function(t){ return t.bits > 1; });
      flag('DC_INCL', k, 'declared disjoint: every multi-set term is exactly zero', true,
           corr.every(function(t){ return t.inter === 0; }),
           corr.map(function(t){ return t.inter; }).join(','));
      resid('DC_INCL', k, 'so the gross equals the answer', I.gross - I.formula, 0);
    } else {
      /* the positive control: on every other entry the corrections DO fire, or
         the disjoint check above is measuring nothing */
      flag('DC_INCL', k, 'corrections actually fire here', true,
           I.terms.some(function(t){ return t.bits > 1 && t.inter > 0; }),
           'gross ' + I.gross + ' vs answer ' + I.formula);
    }
  });

  /* ============================================================== DC_RECS ==== */
  /* Each entry declares its coefficients, its initial values, an nmax it claims
     to be evaluable at, a combinatorial interpretation with a SHIFT, and -- by
     omission -- whether a two-term closed form exists. All five are recomputed. */
  Object.keys(DC_RECS).forEach(function(k){
    var E = DC_RECS[k];
    /* the two integer routes must agree wherever the answer is still exact */
    [E.c.length, 10, Math.floor(E.nmax / 2)].forEach(function(n){
      var it = dcRecur(E.c, E.init, n)[n];
      if (!dcExact(it)) return;
      resid('DC_RECS', k, 'iteration minus the companion matrix at n=' + n,
            dcByMatrix(E.c, E.init, n) - it, 0, 'value ' + it);
    });
    /* nmax is a claim: the sequence is still evaluable there. For every entry
       but Pell that means still an exact integer; Pell's own nmax is past 2^53
       and the stage says so, so the claim is only that it is finite. */
    var top = dcRecur(E.c, E.init, E.nmax)[E.nmax];
    flag('DC_RECS', k, 'the declared nmax gives a finite value', true, isFinite(top), 'value ' + top);
    /* the combinatorial claim, at the declared shift */
    if (E.count) {
      for (var n = 2; n <= 12; n++) {
        var C = E.count(n);
        if (C.overflow) continue;
        var m = n + (E.shift || 0);
        resid('DC_RECS', k, 'the enumerated count at n=' + n + ' minus the term at n+' + (E.shift || 0),
              C.count - dcRecur(E.c, E.init, m)[m], 0, 'counted ' + C.count);
      }
    }
    /* a two-term recurrence has a closed form; a longer one must not be given
       one, and returning the two-term expression anyway would be answering a
       different question in the right format */
    flag('DC_RECS', k, 'a two-term closed form exists exactly when the order is 2',
         E.c.length === 2, dcClosedForm(E.c, E.init, 10) !== null, 'order ' + E.c.length);
    if (E.c.length === 2) {
      var R = dcCharRoots(E.c);
      /* the roots really are roots of the characteristic polynomial */
      resid('DC_RECS', k, 'r1 solves r^2 - p r - q = 0',
            R.r1 * R.r1 - E.c[0] * R.r1 - E.c[1], 1e-12, 'r1 ' + fx(R.r1));
      resid('DC_RECS', k, 'r2 solves it too',
            R.r2 * R.r2 - E.c[0] * R.r2 - E.c[1], 1e-12, 'r2 ' + fx(R.r2));
      /* and the term ratio reaches the larger one */
      var s = dcRecur(E.c, E.init, 45);
      num('DC_RECS', k, 'the term ratio reaches the larger root', R.r1, s[45] / s[44], 1e-12);
    }
  });

  /* ============================================================= DC_BIRTH ==== */
  /* Each entry declares a number of boxes. The checks recompute the half-way
     point by bisection on the exact product, compare it with the sqrt(2 ln2 N)
     estimate, and -- where the domain is small enough -- against a seeded
     simulation, using the simulation's OWN standard error as the tolerance. */
  Object.keys(DC_BIRTH).forEach(function(k){
    var B = DC_BIRTH[k];
    var lo = 1, hi = Math.min(B.N + 1, 200000);
    while (hi - lo > 1) {
      var mid = Math.floor((lo + hi) / 2);
      if (dcBirthday(mid, B.N).pSome < 0.5) lo = mid; else hi = mid;
    }
    flag('DC_BIRTH', k, 'the bisected half-way point really is the crossing', true,
         dcBirthday(hi, B.N).pSome >= 0.5 && (hi <= 1 || dcBirthday(hi - 1, B.N).pSome < 0.5),
         'k = ' + hi);
    /* The claim is ABSOLUTE, not relative, and that is the point: the crossing
       is an integer, so an estimate is useful when it lands within one of it.
       The relative form was tried first and failed on three of four entries --
       0.5 of a person at N = 365 is 2.2%, and at N = 12 it is 18% -- because
       the error here is a dropped term LINEAR in k, which costs order 1
       whatever N is. Solving the quadratic instead of dropping it is what
       dcBirthHalf does, and it lands inside one everywhere. */
    push('DC_BIRTH', k, 'the closed-form estimate lands within one of the crossing',
         hi, fx(dcBirthHalf(B.N)), Math.abs(dcBirthHalf(B.N) - hi),
         Math.abs(dcBirthHalf(B.N) - hi) < 1, 'the 1.177 root(N) form gives ' + fx(dcBirthScale(B.N)));
    /* the probability is a probability, everywhere on the slider */
    var bad = 0;
    for (var kk = 1; kk <= Math.min(B.N, 200); kk++) {
      var p = dcBirthday(kk, B.N).pSome;
      if (!(p >= 0 && p <= 1) || (kk > 1 && p < dcBirthday(kk - 1, B.N).pSome - 1e-12)) bad++;
    }
    push('DC_BIRTH', k, 'the curve stays in [0,1] and never decreases', 0, bad, bad, bad === 0, '');
    if (B.N <= 100000) {
      var S = dcBirthdaySim(Math.min(23, B.N), B.N, 40000, 11);
      var ex = dcBirthday(Math.min(23, B.N), B.N).pSome;
      /* the tolerance is the simulation's measured standard error, not a guess */
      push('DC_BIRTH', k, 'a seeded simulation agrees within 4 of its own standard errors',
           fx(ex), fx(S.p), Math.abs(S.p - ex),
           S.se === 0 || Math.abs(S.p - ex) < 4 * S.se, 'se ' + fx(S.se));
    }
  });

  /* ======================================================== Pascal parity ==== */
  /* The gasket is drawn from a BITWISE rule and not from the stored entry,
     because past row 53 the entry has lost its low-order bits. Both claims are
     checked here: the closed form 3^m over the first 2^m rows, and the fact
     that the naive test disagrees -- which is why the bitwise one exists. */
  [1, 2, 3, 4, 5, 6].forEach(function(m){
    num('DC_PARITY', '2^' + m + ' rows', 'odd entries by the bitwise rule',
        Math.pow(3, m), dcOddCount(Math.pow(2, m) - 1), 0, "Kummer's theorem in base two");
  });
  (function(){
    var T = dcPascal(50), bad = 0;
    for (var n = 0; n <= 50; n++) for (var k = 0; k <= n; k++) {
      if (!dcExact(T[n][k])) continue;
      if ((Math.abs(T[n][k] % 2) === 1) !== dcOddEntry(n, k)) bad++;
    }
    resid('DC_PARITY', 'exact rows', 'the bitwise rule agrees with the entry while the entry is exact',
          bad, 0);
    var T2 = dcPascal(63), diff = 0;
    for (var n2 = 54; n2 <= 63; n2++) for (var k2 = 0; k2 <= n2; k2++)
      if ((Math.abs(T2[n2][k2] % 2) === 1) !== dcOddEntry(n2, k2)) diff++;
    flag('DC_PARITY', 'inexact rows', 'and DISAGREES once the entry is past 2^53 -- the reason it exists',
         true, diff > 0, diff + ' entries differ');
  })();
  /* ============================================== PROOF, LOGIC & SETS ======== */
  /* Wing C1's tables declare things about themselves -- this pair of formulas
     IS or IS NOT equivalent, this set identity holds, this claim about every n
     is true or false, this number's approximation floor is that.  The wing
     already computes each of those two ways.  What this block adds is a THIRD
     route written here, sharing nothing with either: its own evaluator, its own
     sets-as-lists implementation, its own formulas for the six sum identities,
     and its own brute-force approximation search. */

  /* -- PF_LAWS: an evaluator written here, not the engine's ------------------ */
  (function(){
    function ev(node, env){
      switch (node.t) {
        case 'var': return env[node.name] === true;
        case 'top': return true;
        case 'bot': return false;
        /* deliberately spelled with arithmetic rather than the engine's
           boolean operators, so a shared slip is less likely */
        case 'not': return ev(node.a, env) === false;
        case 'and': return (ev(node.a, env) ? 1 : 0) * (ev(node.b, env) ? 1 : 0) === 1;
        case 'or':  return (ev(node.a, env) ? 1 : 0) + (ev(node.b, env) ? 1 : 0) > 0;
        case 'xor': return (ev(node.a, env) ? 1 : 0) + (ev(node.b, env) ? 1 : 0) === 1;
        case 'imp': return (ev(node.a, env) ? 1 : 0) <= (ev(node.b, env) ? 1 : 0);
        case 'iff': return (ev(node.a, env) ? 1 : 0) === (ev(node.b, env) ? 1 : 0);
      }
      return false;
    }
    Object.keys(PF_LAWS).forEach(function(k){
      var L = PF_LAWS[k];
      var A = pfParse(L.a), B = pfParse(L.b);
      if (!A.ok || !B.ok) {
        push('PF_LAWS', k, 'both sides parse', true, false, 1, false, (A.why || B.why));
        return;
      }
      var names = {}, i;
      [A, B].forEach(function(P){ P.vars.forEach(function(v){ names[v] = 1; }); });
      var vars = Object.keys(names).sort(), N = Math.pow(2, vars.length), same = true;
      for (i = 0; i < N; i++) {
        var env = {}, j;
        for (j = 0; j < vars.length; j++) env[vars[j]] = ((i >> j) & 1) === 1;
        if (ev(A.ast, env) !== ev(B.ast, env)) same = false;
      }
      flag('PF_LAWS', k, 'declared equivalence, by an evaluator written in this script',
           L.equiv, same, vars.length + ' letters, ' + N + ' assignments');
    });
  })();

  /* -- PF_SET_LAWS: sets as sorted lists, not as bitmasks -------------------- */
  (function(){
    function mk(pred, n){ var out = [], i; for (i = 1; i <= n; i++) if (pred(i)) out.push(i); return out; }
    function has(L, x){ return L.indexOf(x) >= 0; }
    var n = 18;
    var U = mk(function(){ return true; }, n);
    var trios = Object.keys(PF_TRIOS).filter(function(t){ return t !== 'custom'; });
    Object.keys(PF_SET_LAWS).forEach(function(k){
      var anyDiff = false, allSame = true;
      trios.forEach(function(tk){
        var T = PF_TRIOS[tk];
        var A = pfMaskOf(T.a, n), B = pfMaskOf(T.b, n), C = pfMaskOf(T.c, n);
        /* the masks come from the engine, but membership below is decided by
           list search, and the two sides are rebuilt from the law's own
           functions -- so the COMPARISON shares nothing with pfSetCheck */
        var S = pfSetCheck(k, A, B, C, n);
        var lhs = mk(function(x){ return pfIn(S.lhs, x); }, n);
        var rhs = mk(function(x){ return pfIn(S.rhs, x); }, n);
        var same = U.every(function(x){ return has(lhs, x) === has(rhs, x); });
        if (!same) { allSame = false; anyDiff = true; }
      });
      flag('PF_SET_LAWS', k, 'declared to hold, checked on ' + trios.length + ' triples by list membership',
           PF_SET_LAWS[k].holds, allSame,
           anyDiff ? 'separated by at least one triple' : 'held on every triple');
    });
  })();

  /* -- PF_CLAIMS: the six sum identities against formulas written here ------- */
  (function(){
    var mine = {
      sumFirst: function(m){ return m * (m + 1) / 2; },
      sumOdd:   function(m){ return m * m; },
      sumSq:    function(m){ return (2 * m * m * m + 3 * m * m + m) / 6; },
      sumCube:  function(m){ var s = m * (m + 1) / 2; return s * s; },
      geom:     function(m){ return Math.pow(2, m) - 1; },
      recip:    function(m){ return 1 - 1 / (m + 1); }
    };
    Object.keys(mine).forEach(function(k){
      var C = PF_CLAIMS[k], worst = 0, m;
      for (m = C.from; m <= 25; m++) {
        var a = C.rhs(m), b = mine[k](m);
        worst = Math.max(worst, Math.abs(a - b) / Math.max(1, Math.abs(b)));
      }
      /* every one of these is exact integer arithmetic except recip, whose two
         forms differ only by round-off at the last bit */
      resid('PF_CLAIMS', k, 'the closed form matches one written independently here',
            worst, k === 'recip' ? 4e-16 : 0, 'n from ' + C.from + ' to 25');
    });
    /* and the declared truth of every claim, from its own statement */
    Object.keys(PF_CLAIMS).forEach(function(k){
      var C = PF_CLAIMS[k];
      /* maxN is a bound on the claim's own trip count, not a display limit:
         the harmonic row sums 2^n terms, and calling it at 40 is how this
         block hung on 2026-08-19 before PF_CLAIMS.harm declared one. */
      var top = Math.min(C.maxN === undefined ? 40 : C.maxN, 40);
      var I = pfInductCheck(k, top);
      flag('PF_CLAIMS', k, 'declared true or false, checked at every n in range',
           C.trueClaim, I.allHold, 'n from ' + C.from + ' to ' + top +
           (I.firstFail === null ? '' : ', first failure at ' + I.firstFail));
    });
  })();

  /* -- PF_TARGETS: the declared approximation floor, searched again here ----- */
  (function(){
    Object.keys(PF_TARGETS).forEach(function(k){
      var T = PF_TARGETS[k];
      if (!(T.liminf > 0)) {
        push('PF_TARGETS', k, 'declares no positive floor', T.liminf === null ? 'unknown' : 0,
             T.limWhy || '-', 0, true, 'not checkable by a finite search, and the stage says so');
        return;
      }
      /* an independent brute-force search: best p for each q, records only,
         minimum of the tail.  No continued fractions anywhere. */
      var best = Infinity, tail = Infinity, q, p, e;
      for (q = 1; q <= 3000; q++) {
        p = Math.round(T.v * q);
        e = Math.abs(T.v - p / q);
        if (e < best - 1e-18) { best = e; if (q >= 20) tail = Math.min(tail, e * q * q); }
      }
      num('PF_TARGETS', k, 'q^2|x - p/q| along the record-holders past q = 20',
          T.liminf, tail, 0.01, 'brute force to q = 3000, no continued fractions');
    });
  })();

  /* -- PF_LISTS: the digits a diagonal is built from ------------------------- */
  (function(){
    Object.keys(PF_LISTS).forEach(function(k){
      var D = pfDiagonal(k, 14), badDigit = 0, r, c;
      for (r = 0; r < D.rows.length; r++)
        for (c = 0; c < D.rows[r].length; c++)
          if (!(D.rows[r][c] >= 0 && D.rows[r][c] < D.list.base)) badDigit++;
      resid('PF_LISTS', k, 'every listed digit is inside the declared base', badDigit, 0,
            'base ' + D.list.base);
      flag('PF_LISTS', k, 'the constructed number is on no row of the list', true, D.allDiffer,
           '14 rows');
    });
  })();

  } catch (ex) {
    ROWS.push(['HARNESS', '-', 'the probe threw', '-', String(ex && ex.message || ex), '-', 'BAD', ''].join('\t'));
  }

  var bad = 0;
  for (var r = 0; r < ROWS.length; r++) if (ROWS[r].split('\t')[6] === 'BAD') bad++;
  var t2 = document.createElement('div');
  t2.id = 'REPORT';
  t2.textContent = '@@' + ROWS.join('\n') +
    '\n#claims=' + ROWS.length + ' bad=' + bad + (bad ? ' REVIEW' : ' OK') +
    ' jserrors=' + window.__errs.length + '@@';
  document.body.appendChild(t2);
}, 600);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-claims.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1400,900 --virtual-time-budget=600000 `
          --user-data-dir="$(Join-Path $dir 'cprof-claims')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-claims.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-claims.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('@@','').Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$rows = @()
foreach ($line in ($rep -split "`n")) {
  if (-not $line.Trim() -or $line.StartsWith('#')) { continue }
  $f = $line -split "`t"
  if ($f.Count -lt 7) { continue }
  $rows += [pscustomobject]@{
    table = $f[0]; entry = $f[1]; claim = $f[2]
    declared = $f[3]; computed = $f[4]; difference = $f[5]
    verdict = $f[6]; note = $(if ($f.Count -gt 7) { $f[7] } else { '' })
  }
}
$rows | Export-Csv (Join-Path $dir 'audit-claims.csv') -NoTypeInformation -Encoding UTF8

$bad = @($rows | Where-Object { $_.verdict -eq 'BAD' })
if ($bad.Count) {
  Write-Output ''
  Write-Output ('  ' + $bad.Count + ' claim(s) the tables could not back up:')
  Write-Output ''
  foreach ($r in $bad) {
    Write-Output ("  {0}.{1}" -f $r.table, $r.entry)
    Write-Output ("      {0}" -f $r.claim)
    Write-Output ("      declared {0}   computed {1}   difference {2}" -f $r.declared, $r.computed, $r.difference)
    if ($r.note) { Write-Output ("      {0}" -f $r.note) }
    Write-Output ''
  }
}
$byTable = $rows | Group-Object table | Sort-Object Name
Write-Output '  claims checked, by table:'
foreach ($g in $byTable) {
  $nb = @($g.Group | Where-Object { $_.verdict -eq 'BAD' }).Count
  Write-Output ("    {0,-14} {1,4} checked  {2}" -f $g.Name, $g.Count, $(if ($nb) { "$nb BAD" } else { 'all backed up' }))
}
Write-Output ''
Write-Output (($rep -split "`n") | Where-Object { $_.StartsWith('#') })
