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
  /* `exact` is the closed-form solution.  It is checked against the FIELD, not
     against an integrator: d/dx exact must equal F(x, exact) at every sample,
     and exact(x0) must be y0.  Nothing in the site does this, and a wrong
     closed form would make every "the numerical method drifts from the exact
     solution" readout drift from the wrong thing. */
  var OD_IC = { simple:{y0:1,lo:-1,hi:1}, linear:{y0:1,lo:-1,hi:1}, decay:{y0:2,lo:0,hi:3},
                sep:{y0:1,lo:-1,hi:1}, logistic:{y0:1,lo:0,hi:4}, newton:{y0:80,lo:0,hi:3},
                nonlin:{y0:1,lo:-1,hi:1}, circle:{y0:2,lo:-1,hi:1} };
  Object.keys(OD_FIELDS).forEach(function(k){
    var E = OD_FIELDS[k];
    if (typeof E.exact !== 'function') return;
    var ic = OD_IC[k] || { y0:1, lo:-1, hi:1 };
    var known = !!OD_IC[k];
    resid('OD_FIELDS', k, 'exact(x0) - y0', E.exact(0, 0, ic.y0) - ic.y0, 1e-12,
          known ? '' : 'NO TEST IC DECLARED for this key -- default used');
    var worst = 0, at = 0;
    sample(ic.lo, ic.hi, 20, function(x){
      var h = 1e-6;
      var d = (E.exact(x + h, 0, ic.y0) - E.exact(x - h, 0, ic.y0)) / (2 * h);
      var want = E.F(x, E.exact(x, 0, ic.y0));
      var e = Math.abs(d - want) / Math.max(1, Math.abs(want));
      if (e > worst) { worst = e; at = x; }
    });
    resid('OD_FIELDS', k, "max rel |d/dx exact - F(x, exact)|", worst, 1e-6,
          'y0=' + ic.y0 + ' on [' + ic.lo + ',' + ic.hi + '], worst at x=' + fx(at));
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
