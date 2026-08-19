/* ============================================================================
   5c · "TYPE YOUR OWN" ENTRIES — one accessor per preset table

   Each function here returns an object shaped exactly like an entry of the
   table it shadows, so a stage that wrote TABLE[st.key] writes cur(st) instead
   and needs no other change. That shape-compatibility is the whole trick, and
   it is why forty stages could be opened up without rewriting any of them.

   The rule that costs the most work is the house rule: a property a preset
   *declares*, because its author checked it, has to be **measured** for a typed
   one. A preset sequence says `mono:'decreasing'`; a typed one is sampled and
   the answer reported with the evidence. A preset series quotes its exact sum;
   a typed one gets a partial sum with a stated tail bound, and says so.

   Loads after 59-interact.js (for pkOwn/pkFn/pkParam*) and before every stage.
   ============================================================================ */

/* An expression in the index n, which the engine does not know as a variable.
   The boundary has to be "not a letter", not \b: a digit is a word character,
   so \bn\b misses the n in `2n` — and `(2n+3)/(5n-1)` is exactly how a reader
   writes a sequence. Letters on either side are what must be excluded, so that
   the n of `ln`, `sin`, `tan` and `min` is left alone. */
const pkIndexAst = src => parse(String(src).replace(/(?<![A-Za-z])n(?![A-Za-z])/g, 'x'));
function pkIndexFn(src, fallback){
  try { const g = compile(pkIndexAst(src)); return n => g(n, 0, 0); }
  catch(e){ return fallback || (() => 0); }
}
/* the validator for an index slot: throws, so the reader sees the message */
const pkIndexBuild = s => { const g = compile(pkIndexAst(s)); return { f:n => g(n, 0, 0) }; };

/* ---- functions and their inverses (the precalculus wing) ------------------- */
const AG_OWN = [{ k:'f', label:'f(x) =', vars:'x', def:'x^3 - 2*x' }];
/* A numeric inverse, by bisection on the branch containing y. A typed function
   need not be invertible at all, and that is the interesting case rather than a
   failure: the stage draws the reflection either way, and a horizontal line
   meeting the graph twice is exactly what "not one-to-one" looks like. */
function agOwnInv(f, lo, hi){
  return y => {
    let a = lo, b = hi, fa = f(a) - y;
    if(!Number.isFinite(fa)) return NaN;
    for(let i = 0; i < 200; i++){
      const m = (a + b) / 2, fm = f(m) - y;
      if(!Number.isFinite(fm)) return NaN;
      if(fa * fm <= 0) b = m; else { a = m; fa = fm; }
    }
    return (a + b) / 2;
  };
}
/* strictly monotone on the window, or not — sampled, never assumed */
function agOwnMono(f, lo, hi){
  let up = true, down = true, prev = f(lo);
  for(let i = 1; i <= 400; i++){
    const v = f(lo + (hi - lo) * i / 400);
    if(!Number.isFinite(v) || !Number.isFinite(prev)){ prev = v; continue; }
    if(v < prev - 1e-12) up = false;
    if(v > prev + 1e-12) down = false;
    prev = v;
  }
  return up || down;
}
function agCur(st){
  if(st.key !== 'custom') return AG_FUNCS[st.key];
  const own = pkOwn(st, 'agown', AG_OWN, null);
  const f = pkFn(st, 'agown', 'f');
  const g = x => f(x, 0, 0);
  const mono = agOwnMono(g, -4, 4);
  return { n:own.f, f:g, inv:agOwnInv(g, -4, 4), mono,
    note:mono
      ? 'Sampled across the window your function is strictly monotone, so it is one-to-one there and the reflection in y = x really is a function.'
      : 'Sampled across the window your function is <b>not</b> monotone, so it is not one-to-one: some horizontal line meets it more than once, and the reflection fails the vertical line test. That is not a defect in the drawing — it is why inverses need their domains restricted.' };
}

/* ---- harmonic functions (the differential-forms wing) ---------------------- */
const DF_OWN = [{ k:'f', label:'f(x, y) =', vars:'x, y', def:'x^3 - 3*x*y^2' }];
function dfHarmCur(st){
  if(st.key !== 'custom') return DF_HARMONIC[st.key];
  const own = pkOwn(st, 'dfown', DF_OWN, null);
  const f = pkFn(st, 'dfown', 'f');
  /* the Laplacian, symbolically, then measured across the window — whether a
     typed function is harmonic is a question with an answer, not a label */
  let worst = 0;
  try {
    const A = parse(own.f);
    const lap = compile(add(diff(diff(A, 'x'), 'x'), diff(diff(A, 'y'), 'y')));
    for(let i = -10; i <= 10; i++) for(let j = -10; j <= 10; j++){
      const v = lap(i / 4, j / 4, 0);
      if(Number.isFinite(v)) worst = Math.max(worst, Math.abs(v));
    }
  } catch(e){ worst = NaN; }
  const harm = worst < 1e-9;
  return { n:own.f, f:(x, y) => f(x, y), harmonic:harm, lap:worst,
    note:'∇²f was formed symbolically and evaluated across the window; the largest value found was ' +
      (Number.isFinite(worst) ? fmtNum(worst, 4) : 'not computable') + '. ' + (harm
        ? 'That is zero to rounding, so your f is harmonic — its value at the centre of any circle is the average of its values around the rim, and it has no interior maximum.'
        : 'That is not zero, so your f is not harmonic: the mean-value property fails and the function can have an interior extremum.') };
}

/* ---- the forcing term of a driven oscillator ------------------------------- */
const OD_OWN = [{ k:'g', label:'g(t) =', vars:'t', def:'cos(2*t)*exp(-t/6)', build:pkParamBuild }];
function odForcingCur(st){
  if(st.forcing !== 'custom') return OD_FORCINGS[st.forcing];
  const own = pkOwn(st, 'odown', OD_OWN, null);
  const g = pkParamFn(own.g);
  return { name:'g(t) = ' + own.g, g:t => g(t, 1), tex:esc(own.g),
    note:'Your forcing. The particular solution is found by the same variation-of-parameters quadrature the presets use, so it does not need g to be of any special form — no undetermined coefficients, no table of trial solutions.' };
}

/* ---- sequences ------------------------------------------------------------- */
const SR_SEQ_OWN = [{ k:'a', label:'aₙ =', vars:'n', def:'(1 + 1/n)^n', build:pkIndexBuild }];
function srSeqCur(st){
  if(st.key !== 'custom') return SR_SEQ[st.key];
  const own = pkOwn(st, 'srseq', SR_SEQ_OWN, null);
  const f = pkIndexFn(own.a);
  /* everything below is observed from the terms themselves */
  let up = true, down = true, hi = -Infinity, lo = Infinity, prev = f(1);
  for(let n = 2; n <= 4000; n++){
    const v = f(n);
    if(!Number.isFinite(v)) continue;
    if(v > prev + 1e-14) down = false;
    if(v < prev - 1e-14) up = false;
    hi = Math.max(hi, v); lo = Math.min(lo, v);
    prev = v;
  }
  /* Widely spaced samples are not enough to see a limit: n = 20 000, 40 000 and
     80 000 are all even, so (−1)ⁿ reads as a constant 1 at every one of them and
     an oscillation is mistaken for convergence. Look at a run of *consecutive*
     far terms as well, and require them to agree with each other. */
  let tLo = Infinity, tHi = -Infinity;
  for(let n = 400000; n <= 400040; n++){
    const v = f(n);
    if(Number.isFinite(v)){ tLo = Math.min(tLo, v); tHi = Math.max(tHi, v); }
  }
  /* Reporting a(N) itself makes a poor limit: for 1/n at N = 400 000 it says
     2.5e-6 when the answer is 0. Most sequences approach their limit like
     c + k/n, and for those 2a(2N) − a(N) cancels the k/n term outright — 1/n
     extrapolates to exactly 0, n/(n+1) to exactly 1. Richardson's trick, and it
     costs two more evaluations. */
  const richard = 2 * f(800000) - f(400000);
  /* "Agree with one another" has to be judged against the sequence's own scale,
     not against 1. sin(n)/n wobbles by about 2.5e-5 out near n = 80 000, which
     is enormous next to an absolute tolerance and negligible next to the 1.8
     the sequence spans — and it converges to 0. */
  const settled = Number.isFinite(tLo) && (tHi - tLo) <= 1e-4 * (hi - lo) + 1e-12;
  return { name:'aₙ = ' + own.a, f,
    limit:settled ? (Number.isFinite(richard) ? richard : (tLo + tHi) / 2) : NaN,
    mono:up ? 'increasing' : down ? 'decreasing' : 'neither',
    bounded:Number.isFinite(hi) && Number.isFinite(lo) && Math.abs(hi) < 1e12 && Math.abs(lo) < 1e12,
    note:'Nothing here was told how your sequence behaves. Four thousand terms were generated and ' +
      'compared: it is ' + (up ? 'increasing' : down ? 'decreasing' : 'neither increasing nor decreasing') +
      ', and ' + (Number.isFinite(hi) && Math.abs(hi) < 1e12 ? 'bounded' : 'unbounded') + '. ' +
      (settled ? 'Forty consecutive terms around n = 400 000 agree with one another to within a ten-thousandth of the range the sequence covers, so a limit is offered: 2a(800 000) − a(400 000), which cancels the 1/n part of the error and is a numerical estimate rather than a proof.'
               : 'The far terms do not agree with one another, so no limit is quoted rather than a misleading one. An oscillation such as (−1)ⁿ is bounded and never converges, and sampling only at widely spaced n would hide that completely — every one of 20 000, 40 000 and 80 000 is even.') };
}

/* ---- series ---------------------------------------------------------------- */
const SR_SER_OWN = [{ k:'t', label:'the nth term =', vars:'n', def:'1/(n^2 + n)', build:pkIndexBuild }];
/* The alternating stage keeps its own storage and its own default, because a
   term that does not alternate makes that stage's whole subject vacuous. Same
   measurement, different starting point. */
const SR_ALT_OWN = [{ k:'t', label:'the nth term =', vars:'n', def:'(-1)^(n+1)/n^1.5', build:pkIndexBuild }];
/* Does a series of terms settle? Used for the series itself and, separately, for
   its absolute values — which is what decides absolute against conditional
   convergence, and is a question with an answer rather than a label. */
function srSettles(f, n){
  let s = 0, at = {};
  const marks = [1000, 10000, n || 100000];
  for(let i = 1; i <= (n || 100000); i++){
    const v = f(i);
    if(Number.isFinite(v)) s += v;
    if(marks.indexOf(i) >= 0) at[i] = s;
  }
  const last = marks[2];
  const moved = Math.abs(at[last] - at[10000]);
  return { sum:s, moved,
    conv:Number.isFinite(s) && moved < Math.abs(at[10000] - at[1000]) * 0.5 + 1e-15 };
}
function srSeriesCur(st){
  if(st.key !== 'custom') return SR_SERIES[st.key];
  const own = pkOwn(st, 'srser', SR_SER_OWN, null);
  const term = pkIndexFn(own.t);
  /* partial sums far out, and whether they are still moving. A typed series has
     no quoted sum, so what is offered is a partial sum with its own increment
     printed as the honest measure of how far it might still be from the truth. */
  let s = 0, sAt = {};
  const marks = [1000, 10000, 100000];
  for(let n = 1; n <= 100000; n++){
    const v = term(n);
    if(Number.isFinite(v)) s += v;
    if(marks.indexOf(n) >= 0) sAt[n] = s;
  }
  const moved = Math.abs(sAt[100000] - sAt[10000]);
  const conv = Number.isFinite(s) && moved < Math.abs(sAt[10000] - sAt[1000]) * 0.5 + 1e-15;
  /* Absolute convergence is a second, independent question, and the answer is
     what separates a robust series from one whose sum depends on the order its
     terms are written in. It is measured the same way rather than inferred. */
  const A = srSettles(n => Math.abs(term(n)));
  return { name:'Σ ' + own.t, term, sum:conv ? sAt[100000] : NaN, converges:conv,
    kind:'yours', abs:conv && A.conv, absName:'Σ |' + own.t + '|', absConverges:A.conv,
    note:'A hundred thousand terms were summed. Between n = 10 000 and n = 100 000 the total moved by ' +
      fmtNum(moved, 4) + '. ' + (conv
        ? 'It is still moving, as every convergent series is, but by less and less — the value shown is a partial sum, and that increment is the honest measure of how far from the true total it may still be. A partial sum is evidence, not a proof of convergence.'
        : 'It is not settling, so no total is quoted. Slow divergence looks exactly like slow convergence over any finite number of terms, which is precisely why the convergence tests exist rather than summing and squinting.') };
}

/* The alternating-series stage draws a band of width |a_(N+1)| around the sum
   and says the partial sums never leave it. That is a theorem with three
   hypotheses — the terms alternate, decrease in size, and tend to zero — and a
   preset satisfies all three because it was chosen to. A typed term satisfies
   whichever of them it happens to satisfy, so all three are tested, and the
   panel is told which ones failed. A reader who types a term that does not
   alternate should see the guarantee break, and see why. */
function srAltCur(st){
  if(st.key !== 'custom') return SR_SERIES[st.key];
  const own = pkOwn(st, 'sralt', SR_ALT_OWN, null);
  const term = pkIndexFn(own.t);
  let alt = true, dec = true, prev = Math.abs(term(1)), tiny = true;
  for(let n = 2; n <= 4000; n++){
    const a = term(n - 1), b = term(n);
    if(!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if(a * b > 0) alt = false;                         // same sign twice running
    const m = Math.abs(b);
    if(m > prev + 1e-15) dec = false;
    prev = m;
  }
  for(let n = 100000; n <= 100010; n++)
    if(!(Math.abs(term(n)) < 1e-3)) tiny = false;
  const S = srSettles(term);
  const A = srSettles(n => Math.abs(term(n)));
  const holds = alt && dec && tiny;
  const failed = [!alt ? 'the signs do not alternate' : null,
                  !dec ? 'the sizes do not decrease' : null,
                  !tiny ? 'the terms do not tend to zero' : null].filter(Boolean);
  return { name:'Σ ' + own.t, term, sum:S.conv ? S.sum : NaN, converges:S.conv,
    kind:'yours', abs:S.conv && A.conv, absName:'Σ |' + own.t + '|', absConverges:A.conv,
    altHolds:holds,
    note:'The three hypotheses of the alternating series test were checked against four thousand of your ' +
      'terms rather than assumed. ' + (holds
        ? 'All three hold — consecutive terms have opposite signs, their sizes never increase, and they have fallen below a thousandth by n = 100 000 — so the error bound drawn as a band really is guaranteed here.'
        : 'Not all of them hold: ' + failed.join(', ') + '. The band is still drawn, because seeing the guarantee fail is the point — the theorem is not a formality, and a series that breaks one of its hypotheses can leave the band whenever it likes.') };
}

/* ---- your own function to expand as a Taylor polynomial ---------------------
   A Taylor coefficient is f⁽ᵏ⁾(c)/k!, so a typed f needs its derivatives. They
   are taken symbolically, one order at a time, each simplified before the next —
   which makes every coefficient exact rather than a finite difference, and makes
   the Lagrange remainder bound a real bound rather than an estimate.

   The presets run to degree 24 because their coefficients have closed forms. A
   typed one cannot: each differentiation can roughly double the size of the
   expression, and e^(−x²) or tan x reach thousands of nodes within a dozen
   orders. So the ladder is built until it stops being affordable and the stage
   is told how far it got, rather than either freezing or quietly returning
   nonsense. The reason is shown to the reader — a control that stops moving
   without saying why teaches nothing. */
const SR_TAY_OWN = [{ k:'f', label:'f(x) =', vars:'x', def:'exp(-x^2)' }];
const SR_TAY_MAX = 14;
const SR_TAY_CACHE = new Map();
/* How big an expression has become, so the ladder can stop before it hurts.
   The node shapes are the ones 10-math.js builds: {t:'b', o, a, b} for a binary
   operator, {t:'u', a} for a negation, {t:'f', f, a:[…]} for a call — so `a` is
   an array on one of them and a node on the others, and `b` exists only on
   binaries. Reading the wrong field names would have counted a sum as a single
   node and never fired at all. */
function srAstSize(A){
  if(!A || typeof A !== 'object') return 1;
  let n = 1;
  if(A.a) n += Array.isArray(A.a) ? A.a.reduce((s, k) => s + srAstSize(k), 0) : srAstSize(A.a);
  if(A.b) n += srAstSize(A.b);
  return n;
}
function srTayBuild(src){
  const hit = SR_TAY_CACHE.get(src);
  if(hit) return hit;
  const G = [];
  let top = 0, ok = true, grew = false;
  try {
    let A = parse(src);
    G.push(compile(A));
    for(let k = 1; k <= SR_TAY_MAX; k++){
      A = simp(diff(A, 'x'));
      if(srAstSize(A) > 24000){ grew = true; break; }
      G.push(compile(A));
      top = k;
    }
  } catch(e){ ok = false; }
  const at = (k, x) => (ok && k < G.length) ? G[k](x, 0, 0) : NaN;
  const made = {
    ok, top, grew,
    f:x => (ok ? G[0](x, 0, 0) : NaN),
    deriv:(k, x) => at(k, x),
    /* beyond the orders that were built the coefficient is reported as zero
       rather than NaN: the polynomial then simply stops at the degree that was
       actually computed, instead of turning the whole curve into nothing */
    coef:(k, c) => {
      if(!ok || k > top) return 0;
      let v = G[k](c || 0, 0, 0);
      if(!Number.isFinite(v)) return 0;
      for(let i = 1; i <= k; i++) v /= i;
      return v;
    }
  };
  if(SR_TAY_CACHE.size > 12) SR_TAY_CACHE.clear();
  SR_TAY_CACHE.set(src, made);
  return made;
}
function srTayCur(st){
  if(st.key !== 'custom') return SR_TAYLOR[st.key];
  const own = pkOwn(st, 'srtay', SR_TAY_OWN, null);
  const B = srTayBuild(own.f);
  return { name:'f(x) = ' + own.f, f:B.f, c:0, R:'measured', maxN:B.top,
    coef:B.coef, deriv:B.ok ? B.deriv : null,
    /* the radius is measured from the coefficients by the root test, about
       whichever centre is loaded — never quoted */
    rad:c => srRadius(k => B.coef(k, c), Math.max(6, B.top)),
    note:!B.ok
      ? 'That expression did not parse, so no derivatives could be taken. The previous function is still shown.'
      : 'Your function, differentiated <b>symbolically</b> ' + B.top + ' times — so every coefficient is ' +
        'f⁽ᵏ⁾(c)/k! exactly, and the Lagrange bound below is a genuine bound rather than an estimate. ' +
        (B.grew
          ? 'The ladder stopped at order ' + B.top + ' because the derivatives were growing too fast to keep going: each differentiation can roughly double the size of the expression, and that is a fact about your function rather than a limitation of the arithmetic. The degree slider is capped there.'
          : 'The degree slider is capped at ' + B.top + ', which is as far as the derivatives were taken.') +
        ' The radius of convergence is measured from those coefficients by the root test rather than quoted.' };
}

/* ---- your own limit ---------------------------------------------------------
   A preset declares `hole` and `fills`: whether the graph has a gap at a, and
   what value would close it. Its author knew. A typed f is asked instead — the
   two one-sided limits are computed by ``clLimit``, which approaches from both
   directions and reports whether each settled, and the answer is read off that.
   So the reader can type a function nobody chose to illustrate anything and
   still get a correct verdict, including "no limit, because the two sides
   disagree" and "no limit, because one side never settles at all". */
const CL_LIM_OWN = [{ k:'f', label:'f(x) =', vars:'x', def:'(exp(x) - 1)/x' }];
const CL_LIM_BOUNDS = [{ k:'a', label:'at x =', def:0 }];
function clLimitCur(st){
  if(st.key !== 'custom') return CL_LIMITS[st.key];
  const own = pkOwn(st, 'cllim', CL_LIM_OWN, CL_LIM_BOUNDS);
  const g = pkFn(st, 'cllim', 'f');
  const f = x => g(x, 0, 0);
  const a = +own.a;
  const fa = f(a);
  const defined = Number.isFinite(fa);
  const L = clLimit(f, a);
  /* A hole is a point where the limit exists but the function does not take
     that value there — either because it is undefined or because it is defined
     to something else. Both are removable, and both are worth naming. */
  const hole = L.exists && Number.isFinite(L.value) &&
               (!defined || Math.abs(fa - L.value) > 1e-9 * Math.max(1, Math.abs(L.value)));
  return { name:'f(x) = ' + own.f + ', at x = ' + fmtNum(a, 4), src:own.f, a,
    hole, fills:hole ? L.value : undefined,
    note:'Nothing here was told what your function does at x = ' + fmtNum(a, 4) + '. ' +
      (defined ? 'It is defined there, with f = ' + fmtNum(fa, 6) + '. ' : 'It is not defined there. ') +
      'Approaching from the left gave ' + (L.left.settled ? fmtNum(L.left.value, 6) : 'no settled value') +
      ' and from the right ' + (L.right.settled ? fmtNum(L.right.value, 6) : 'no settled value') + ', so ' +
      (L.exists
        ? 'the limit exists and equals ' + fmtNum(L.value, 6) + ' — ' + L.reason + '. ' + (hole
            ? (defined
                ? 'The function is defined there but not to that value, so there is a removable discontinuity: a single point in the wrong place.'
                : 'The function is not defined there, so the graph has a hole the limit tells you exactly how to fill.')
            : 'The function takes that value there, so it is continuous at the point — all three conditions of the definition hold at once.')
        : 'no limit exists: ' + L.reason + '. That is a verdict about the two sides, and it is why one-sided limits get their own notation.') };
}

/* ---- your own field to decompose (the differential-forms wing) --------------
   The Helmholtz stage already *solves* for the split rather than quoting it, and
   the solver takes P and Q as functions, so a typed field needs nothing but the
   two components. The check the stage performs afterwards — differentiating the
   two pieces back and confirming one has no curl and the other no divergence —
   is the same check, and it is now being run on a field nobody chose. */
const DF_FIELD_OWN = [{ k:'P', label:'P(x, y) =', vars:'x, y', def:'x - y + sin(y)' },
                      { k:'Q', label:'Q(x, y) =', vars:'x, y', def:'x + y^2/3' }];
function dfFieldCur(st){
  if(st.key !== 'custom') return DF_FIELDS[st.key];
  const own = pkOwn(st, 'dffield', DF_FIELD_OWN, null);
  const gp = pkFn(st, 'dffield', 'P'), gq = pkFn(st, 'dffield', 'Q');
  return { n:'⟨' + own.P + ', ' + own.Q + '⟩',
    P:(x, y) => { const v = gp(x, y); return Number.isFinite(v) ? v : 0; },
    Q:(x, y) => { const v = gq(x, y); return Number.isFinite(v) ? v : 0; },
    note:'Your field. The two pieces are not read off a formula — each is relaxed from a Poisson ' +
      'equation on a grid, exactly as for the presets, and then differentiated back so the panel can ' +
      'report how much curl is left in the curl-free part and how much divergence in the other. Those ' +
      'residuals are the evidence that the decomposition worked, and on a field with a singularity in ' +
      'the window they are where you will see it stop working.' };
}

/* ---- your own identity to test (the trigonometry wing) ----------------------
   The stage's whole method is to evaluate two sides independently and print the
   difference, so it extends to a typed identity without changing anything: the
   reader writes a left side and a right side in a and b, and both are evaluated
   by the same engine.

   One addition earns its place. Watching the difference stay at zero while two
   sliders move is persuasive but local, so a typed identity is also swept over a
   grid of angle pairs and the worst difference found anywhere on it is reported.
   An identity is a claim about *all* angles; sampling many is not a proof, but
   it is the difference between "true here" and "true everywhere I looked", and a
   candidate identity that is merely true at one point fails it instantly. */
const AG_ID_OWN = [{ k:'lhs', label:'left side =', vars:'a, b — written x, y', def:'sin(x + y)' },
                   { k:'rhs', label:'right side =', vars:'a, b — written x, y', def:'sin(x)cos(y) + cos(x)sin(y)' }];
const AG_ID_CACHE = new Map();
function agIdentCur(st){
  const own = pkOwn(st, 'agid', AG_ID_OWN, null);
  const ck = own.lhs + ' =? ' + own.rhs;
  const hit = AG_ID_CACHE.get(ck);
  if(hit) return hit;
  const L = pkFn(st, 'agid', 'lhs'), R = pkFn(st, 'agid', 'rhs');
  /* the worst disagreement over a grid, ignoring the points where either side is
     not finite — tan has poles, and a pole is not a counterexample */
  let worst = 0, at = null, seen = 0;
  for(let i = 0; i <= 60; i++) for(let j = 0; j <= 60; j++){
    const a = -3 + 6 * i / 60, b = -3 + 6 * j / 60;
    const l = L(a, b), r = R(a, b);
    if(!Number.isFinite(l) || !Number.isFinite(r)) continue;
    if(Math.abs(l) > 1e6 || Math.abs(r) > 1e6) continue;      // near a pole
    seen++;
    const d = Math.abs(l - r);
    if(d > worst){ worst = d; at = { a, b }; }
  }
  const holds = seen > 100 && worst < 1e-9;
  const made = { n:own.lhs + ' = ' + own.rhs, L, R, worst, at, seen, holds,
    note:seen < 100
      ? 'Almost nowhere on the grid could both sides be evaluated, so there is nothing to compare. Check the expressions parse and are finite somewhere in −3 ≤ a, b ≤ 3.'
      : 'Both sides were evaluated independently at ' + seen + ' pairs of angles across −3 ≤ a, b ≤ 3, ' +
        'skipping the points where either side runs to a pole. The largest disagreement found anywhere ' +
        'was ' + fmtNum(worst, 4) + (holds
          ? ', which is rounding. That is strong evidence for an identity and still not a proof — a sweep can only ever say "true everywhere I looked".'
          : ', at a = ' + fmtNum(at.a, 4) + ', b = ' + fmtNum(at.b, 4) + '. One disagreement is enough: this is not an identity, whatever it does at the two angles the sliders happen to be set to.') };
  if(AG_ID_CACHE.size > 16) AG_ID_CACHE.clear();
  AG_ID_CACHE.set(ck, made);
  return made;
}

/* ---- your own polynomial (the precalculus wing) -----------------------------
   The stage stores a coefficient array, and every coefficient is already a typed
   slider — but the number of them is fixed by whichever preset was loaded, so a
   reader could not write a quintic. An expression box fixes that, and the
   coefficients are extracted the exact way: aₖ = p⁽ᵏ⁾(0)/k!, by symbolic
   differentiation, which is exact for a polynomial and rounds to nothing for
   anything else.

   Whether what was typed *is* a polynomial is then a question with an answer
   rather than an assumption: differentiate once more than the degree asked for
   and see whether what is left is zero. sin(x) has every derivative non-zero,
   and the reader is told so instead of being handed a silent truncation. */
const AG_POLY_OWN = [{ k:'p', label:'p(x) =', vars:'x', def:'x^4 - 5x^2 + 4' }];
const AG_POLY_BOUNDS = [{ k:'deg', label:'degree', def:4 }];
const AG_POLY_CACHE = new Map();
function agPolyCur(st){
  const own = pkOwn(st, 'agpoly', AG_POLY_OWN, AG_POLY_BOUNDS);
  const deg = Math.max(1, Math.min(8, Math.round(+own.deg) || 4));
  const ck = own.p + ' @ ' + deg;
  const hit = AG_POLY_CACHE.get(ck);
  if(hit) return hit;
  let co = null, tail = NaN, ok = true;
  try {
    let A = parse(own.p);
    co = [];
    let fact = 1;
    for(let k = 0; k <= deg; k++){
      if(k > 0){ A = simp(diff(A, 'x')); fact *= k; }
      const v = compile(A)(0, 0, 0);
      co.push(Number.isFinite(v) ? v / fact : 0);
    }
    /* one derivative past the degree: zero for a genuine polynomial */
    const B = compile(simp(diff(A, 'x')));
    tail = 0;
    for(let i = -4; i <= 4; i++){
      const v = B(i / 2, 0, 0);
      if(Number.isFinite(v)) tail = Math.max(tail, Math.abs(v));
    }
  } catch(e){ ok = false; co = [0, 1]; }
  const isPoly = ok && Number.isFinite(tail) && tail < 1e-7;
  const made = { co, deg, isPoly, tail, ok,
    note:!ok ? 'That expression did not parse, so the previous polynomial is still shown.'
      : 'Coefficients taken as p⁽ᵏ⁾(0)/k! by symbolic differentiation, so they are exact rather than fitted. ' +
        (isPoly
          ? 'Differentiating once more than degree ' + deg + ' leaves zero everywhere it was sampled, so what you typed really is a polynomial of that degree or lower, and the roots and factors below describe it completely.'
          : 'Differentiating once more than degree ' + deg + ' leaves as much as ' + fmtNum(tail, 4) +
            ', so what you typed is <b>not</b> a polynomial of degree ' + deg + '. What is drawn is its degree-' + deg +
            ' Taylor polynomial at the origin — a genuine approximation near 0 and nothing more, which is why the rational-root machinery below does not apply to it.') };
  if(AG_POLY_CACHE.size > 16) AG_POLY_CACHE.clear();
  AG_POLY_CACHE.set(ck, made);
  return made;
}

/* ---- your own conic, in general form (the plane-curves wing) ----------------
   The stage builds a conic from a focus, a directrix and an eccentricity, which
   is the definition worth meeting first but cannot produce a rotated or
   off-centre one. The general second-degree equation can produce any of them,
   and it is the form a reader meets in coordinate geometry:

       Ax² + Bxy + Cy² + Dx + Ey + F = 0.

   There is no parametrisation, so the curve is *traced* — the same level-set
   tracer the Lagrange stage uses for a typed constraint. The classification then
   comes from the discriminant B² − 4AC, computed rather than asserted, and the
   traced curve is there to be checked against it: a reader who is told "this is
   a hyperbola" can see two branches, and see the tracer follow only the one it
   found first, which is a true fact about the curve rather than a bug. */
const PC_CONIC_OWN = [];
const PC_CONIC_BOUNDS = [{ k:'A', label:'A', def:1 }, { k:'B', label:'B', def:1.2 },
                         { k:'C', label:'C', def:1 }, { k:'D', label:'D', def:0 },
                         { k:'E', label:'E', def:0 }, { k:'F', label:'F', def:-3 }];
const PC_CONIC_CACHE = new Map();
function pcConicCur(st){
  const own = pkOwn(st, 'pccon', PC_CONIC_OWN, PC_CONIC_BOUNDS);
  const A = +own.A, B = +own.B, C = +own.C, D = +own.D, E = +own.E, F = +own.F;
  const ck = [A, B, C, D, E, F].join(',');
  const hit = PC_CONIC_CACHE.get(ck);
  if(hit) return hit;
  const disc = B * B - 4 * A * C;
  /* the degenerate cases are a determinant away, and calling a pair of lines an
     ellipse because the discriminant is negative is the classic mistake */
  const det3 = A * (C * F - E * E / 4) - (B / 2) * ((B / 2) * F - (E / 2) * (D / 2))
             + (D / 2) * ((B / 2) * (E / 2) - C * (D / 2));
  const degenerate = Math.abs(det3) < 1e-12;
  const kind = degenerate
    ? (disc < 0 ? 'a single point, or nothing real' : disc > 0 ? 'two crossing lines' : 'one or two parallel lines')
    : (disc < 0 ? (Math.abs(A - C) < 1e-12 && Math.abs(B) < 1e-12 ? 'a circle' : 'an ellipse')
       : disc > 0 ? 'a hyperbola' : 'a parabola');
  /* the rotation that removes the xy term: cot 2θ = (A − C)/B */
  const rot = Math.abs(B) < 1e-14 ? 0 : 0.5 * Math.atan2(B, A - C);
  const G = { f:(x, y) => A * x * x + B * x * y + C * y * y + D * x + E * y + F,
              fx:(x, y) => 2 * A * x + B * y + D,
              fy:(x, y) => B * x + 2 * C * y + E };
  const box = { x0:-4.5, x1:4.5, y0:-4.5, y1:4.5 };
  let curve = null;
  try { curve = mvLevelCurve(G, box); } catch(e){ curve = null; }
  const made = { A, B, C, D, E, F, disc, kind, rot, degenerate, G, curve,
    eq:'Ax² + Bxy + Cy² + Dx + Ey + F = 0',
    note:'The discriminant B² − 4AC came out ' + fmtNum(disc, 5) + ' and the 3×3 determinant ' +
      fmtNum(det3, 5) + ', so this is <b>' + kind + '</b>. ' + (Math.abs(B) > 1e-12
        ? 'The xy term means the axes are rotated by ' + fmtNum(rot * 180 / Math.PI, 4) +
          '° from the coordinate axes — that angle is where cot 2θ = (A − C)/B comes from, and it is the whole reason the general form looks harder than the standard one.'
        : 'With B = 0 the axes are already aligned with the coordinate axes, which is the standard form.') +
      (curve
        ? ' The curve itself was traced numerically from the equation — ' + curve.pts.length + ' points along ' +
          (curve.closed ? 'a closed loop' : 'an open arc') + '. A hyperbola has two branches and the tracer walks the one nearest its starting point, so seeing only half of it is the picture being honest about what it followed.'
        : ' No curve was traced: this equation has no real points in the window, which is what "an ellipse with no real solutions" looks like from the inside.') };
  if(PC_CONIC_CACHE.size > 16) PC_CONIC_CACHE.clear();
  PC_CONIC_CACHE.set(ck, made);
  return made;
}

/* ---- your own signal to wind (the Fourier wing) -----------------------------
   The winding stage builds its samples from two pure tones, which is the right
   thing to meet first — two spikes, and nothing else to explain. But the whole
   point of the construction is that it works on *any* signal, and that claim is
   only convincing on a signal the reader chose.

   The constant 1 the preset carries is not decoration: an offset moves the whole
   wound curve away from the origin at low winding frequencies and is what the
   f = 0 end of a spectrum means. A typed signal keeps whatever offset it has,
   including none. */
const FT_WIND_OWN = [{ k:'g', label:'g(t) =', vars:'t', def:'1 + sin(2pi*3t) + 0.7sin(2pi*5t)', build:pkParamBuild }];
/* Compiled once per formula, not once per sample. This function is called nine
   hundred times a frame to build the sample buffer, and `pkParamFn` parses and
   compiles on every call — putting it inside the loop would mean nine hundred
   parses per frame, which is the difference between a stage that runs and one
   that does not. */
let FT_WIND_FN = { src:null, f:null };
const ftWindSignal = (st, t) => {
  if(!st.own) return 1 + Math.sin(2 * Math.PI * st.f1 * t) + st.a2 * Math.sin(2 * Math.PI * st.f2 * t);
  const own = st['own_ftwsig'];
  const src = own ? own.g : FT_WIND_OWN[0].def;
  if(FT_WIND_FN.src !== src) FT_WIND_FN = { src, f:pkParamFn(src) };
  const v = FT_WIND_FN.f(t, 1);
  return Number.isFinite(v) ? v : 0;
};

/* ---- your own potential (the quantum wing) ----------------------------------
   The particle in a box has closed-form eigenstates because the box is the one
   potential anybody can solve by hand, and that is exactly the limitation: the
   wing can currently only answer "what are the levels?" for a square well. A
   typed V(x) has no closed form, so the levels and the wavefunctions are found
   numerically — Numerov integration and a bisection on the node count — and
   returned behind the same two functions the analytic case provides, E(n) and
   φ(n, x), so the stage's superposition, animation and probe need no change.

   The walls stay: the box is still a box, and V(x) is what is added inside it.
   That keeps the picture honest — every state really is bound, because the
   window is closed — and it keeps the comparison meaningful, since setting
   V = 0 must reproduce n²π²/2L² and the panel says whether it does. */
const QM_WELL_OWN = [{ k:'V', label:'V(x) =', vars:'x, across the box', def:'0.06(x - 5)^2' }];
const QM_WELL_CACHE = new Map();
function qmWellCur(st){
  const L = st.L;
  if(!st.own) return {
    flat:true, name:'the infinite square well',
    E:n => qmWellE(n, L), phi:(n, x) => qmWellPhi(n, L, x), V:() => 0,
    note:'The flat-bottomed box, where the eigenstates are sinusoids and the levels are exactly ' +
      'n²π²/2L². Everything on this panel is a closed form.'
  };
  const own = pkOwn(st, 'qmwell', QM_WELL_OWN, null);
  const ck = own.V + ' @ ' + L;
  const hit = QM_WELL_CACHE.get(ck);
  if(hit) return hit;
  const g = pkCompile(own.V);
  const V = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
  let states = [];
  try { states = qmBoundStates(V, 0, L, 6); } catch(e){ states = []; }
  /* The flat case is the one place the numerics can be checked against an answer
     that is known exactly, so it is checked and reported — the house rule
     applied to the solver rather than to the physics. */
  let flatErr = NaN;
  try {
    const chk = qmBoundStates(() => 0, 0, L, 3);
    flatErr = Math.max(...chk.map((s, i) => Math.abs(s.E - qmWellE(i + 1, L)) / qmWellE(i + 1, L)));
  } catch(e){ flatErr = NaN; }
  const made = {
    flat:false, name:'V(x) = ' + own.V, states, V,
    E:n => (states[n - 1] ? states[n - 1].E : NaN),
    phi:(n, x) => (states[n - 1] ? states[n - 1].at(x) : 0),
    note:states.length
      ? 'Your potential, solved numerically inside the same box. ψ″ = 2(V − E)ψ is integrated by ' +
        'Numerov and the energies are located by bisecting on the <b>node count</b> — the nth state has ' +
        'n − 1 interior nodes, and that is a far more stable thing to hunt for than a zero of ψ at the ' +
        'far wall. Running the identical solver on V = 0, where the answer is known exactly, reproduces ' +
        'n²π²/2L² to a relative ' + (Number.isFinite(flatErr) ? fmtNum(flatErr, 3) : 'unknown amount') +
        ', which is what the numbers below are worth. The levels are no longer proportional to n² unless ' +
        'you make them so — a harmonic V gives equally spaced levels instead, and a double well splits ' +
        'them into close pairs.'
      : 'No states could be found for that potential inside the box. If it is enormous everywhere the ' +
        'search window may sit below the whole spectrum; try something smaller, or wider.'
  };
  if(QM_WELL_CACHE.size > 8) QM_WELL_CACHE.clear();
  QM_WELL_CACHE.set(ck, made);
  return made;
}
/* ---- your own barrier (the quantum wing) ------------------------------------
   qmBarrier solves the rectangle exactly, and the rectangle is the only barrier
   whose matching conditions can be written down. That is a real limitation
   rather than a stylistic one: every barrier in nature is smooth, alpha decay
   sees a Coulomb tail, and a resonant tunnelling diode is two barriers with a
   well between them. None of those is a rectangle, and none of them can be
   asked of this stage as it stands.

   A typed V(x) is scattered off by transfer matrix (`qmScatter`), and the same
   three quantities come back — T, R and a plottable ψ. Two things are then
   reported that a preset never has to justify. T + R is computed and printed,
   because nothing in the transfer matrix imposes it and a value that is not 1
   would mean the numerics had failed. And the WKB estimate is computed by
   quadrature over the reader's own barrier, so the classic exp(−2∫κ dx) can be
   watched succeeding on a thick smooth hump and failing on a thin sharp one.

   The typed shape is scaled by the V₀ slider rather than replacing it, so the
   control still means something and E/V₀ stays the number the wing talks about. */
const QM_TUN_OWN = [{ k:'V', label:'barrier shape ∝', vars:'x, across the structure',
                      def:'exp(-(x - 0.35)^2/0.006) + exp(-(x - 1.05)^2/0.006)' }];
const QM_TUN_CACHE = new Map();
function qmTunCur(st){
  const a = st.a, E = st.E, V0 = st.V0;
  if(!st.own){
    const B = qmBarrier(E, V0, a);
    return { custom:false, name:'a rectangular barrier', a, Vmax:V0,
      V:x => (x > 0 && x < a ? V0 : 0),
      T:B.T, R:B.R, k:B.k, psi:B.psi, gamow:qmGamow(x => (x > 0 && x < a ? V0 : 0), E, 0, a),
      note:'The rectangle, matched exactly at both walls. Everything on this panel is a closed form — ' +
        'which is possible here and nowhere else, because a constant potential is the only one whose ' +
        'Schrödinger equation has elementary solutions on both sides of a wall.' };
  }
  const own = pkOwn(st, 'qmtun', QM_TUN_OWN, null);
  const ck = own.V + ' @ ' + [E, V0, a].join(',');
  const hit = QM_TUN_CACHE.get(ck);
  if(hit) return hit;
  const g = pkCompile(own.V);
  const shape = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
  const V = x => (x > 0 && x < a ? V0 * shape(x) : 0);
  let Vmax = 0, Vmin = 0;
  for(let i = 0; i <= 400; i++){
    const v = V(a * i / 400);
    Vmax = Math.max(Vmax, v); Vmin = Math.min(Vmin, v);
  }
  let S = null;
  try { S = qmScatter(V, E, 0, a, 4000); } catch(e){ S = null; }
  const G = qmGamow(V, E, 0, a);
  const made = S ? {
    custom:true, name:'V(x) = ' + fmtNum(V0, 3) + '·(' + own.V + ')', a, Vmax, Vmin,
    V, T:S.T, R:S.R, k:S.k, psi:S.psi, unit:S.unit, gamow:G,
    note:'Your barrier, scattered off numerically. The structure is sliced into four thousand thin slabs, ' +
      'each of which has an exact propagator, and the sweep runs <b>from the far side backwards</b> — ' +
      'forwards it would launch a growing exponential that swamps the answer within a few decay lengths. ' +
      'Nothing in that construction imposes conservation of probability, so T + R came out ' +
      fmtNum(S.T + S.R, 10) + ' rather than being set to 1, and the ' + fmtNum(Math.abs(S.unit), 2) +
      ' it misses by is the honest error bar on T. Beside it sits the WKB estimate exp(−2∫κ dx) with the ' +
      'integral taken over what you typed: it is close for a thick smooth hump and wrong by a large ' +
      'factor for a thin sharp one, and the two numbers together show you which regime your barrier is in.' +
      (Vmin < -1e-9 ? ' Your V dips <b>below</b> zero somewhere, so part of this is a well rather than a barrier — and a well reflects too, which is the thing classical intuition gets most wrong.' : '')
  } : {
    custom:true, name:'V(x) = ' + own.V, a, Vmax, Vmin, V,
    T:0, R:1, k:Math.sqrt(2 * E), psi:() => C(0, 0), unit:0, gamow:G,
    note:'That expression could not be scattered off. The previous barrier is still shown.'
  };
  if(QM_TUN_CACHE.size > 8) QM_TUN_CACHE.clear();
  QM_TUN_CACHE.set(ck, made);
  return made;
}

/* ---- your own wave packet (the quantum wing) --------------------------------
   The free-packet stage plots a Gaussian because the Gaussian is the one profile
   whose evolution is a formula. But the lesson — that localising a particle
   forces a spread of momenta, and a spread of momenta forces the packet apart —
   is a statement about *every* profile, and it is far more convincing on one the
   reader chose than on the single shape that happens to be solvable.

   There is a second lesson that only a typed shape can teach at all. The stage
   prints Δx·Δp and notes that it starts at exactly ħ/2. That is not a general
   fact: ħ/2 is the *minimum*, attained by the Gaussian and by nothing else. Type
   a flat-topped pulse and the product starts at 0.6, or 2, or 90 — and the
   inequality stops being a formula that happens to hold with equality and
   becomes an inequality with a reason.

   The evolution is spectral (`qmFreeShape`): transform, rotate each plane wave
   by its own e^(−ik²t/2), transform back. Exact for all time, and the norm
   cannot drift because a phase cannot change a modulus. */
const QM_PK_OWN = [{ k:'s', label:'shape ψ₀(x) ∝', vars:'x', def:'exp(-(x + 6)^4/2)' }];
const QM_PK_CACHE = new Map();
function qmPkCur(st){
  const P = st.P;
  if(!st.own) return {
    custom:false, name:'a Gaussian packet',
    psi:(x, t) => qmPacketPsi(x, t, P), stats:t => qmPacketStats(t, P),
    localK:(x, t) => qmLocalK(x, t, P),
    pmax:Math.pow(2 * Math.PI * P.s0 * P.s0, -0.5) * 1.15,
    note:'The Gaussian, which is the one profile whose evolution is a closed form — and the one profile ' +
      'for which Δx·Δp starts at exactly ħ/2. Both of those are special to it.'
  };
  const own = pkOwn(st, 'qmpk', QM_PK_OWN, null);
  const ck = own.s + ' @ ' + P.k0;
  const hit = QM_PK_CACHE.get(ck);
  if(hit) return hit;
  const g = pkCompile(own.s);
  const shape = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
  let F = null;
  try { F = qmFreeShape(shape, P.k0, -32, 32, 2048); } catch(e){ F = null; }
  if(!F || !(F.dx0 > 0)){
    const made = { custom:true, name:'ψ₀(x) ∝ ' + own.s, psi:() => C(0, 0),
      stats:() => ({ mean:0, dx:0, dp:0, product:0, wrap:0, norm:0 }), localK:() => 0, pmax:1,
      note:'That shape has no probability in the window at all, so there is nothing to evolve. It may be ' +
        'zero everywhere, or it may live outside −32 &lt; x &lt; 32; either way, try a shape with a bump in it.' };
    QM_PK_CACHE.set(ck, made);
    return made;
  }
  /* the peak of |ψ|² at t = 0, so the vertical scale fits whatever was typed */
  let pk = 0;
  for(let i = 0; i <= 400; i++) pk = Math.max(pk, cAbs2(F.psi(-32 + 64 * i / 400, 0)));
  const made = {
    custom:true, name:'ψ₀(x) ∝ ' + own.s, F,
    psi:(x, t) => F.psi(x, t), stats:t => F.stats(t),
    /* the local momentum Im(ψ′/ψ), by a central difference on the grid spacing */
    localK:(x, t) => {
      const h = 2 * F.dx;
      const b = F.psi(x + h, t), a = F.psi(x - h, t), c = F.psi(x, t);
      if(cAbs2(c) < 1e-24) return F.meanK;
      return cDiv(cScale(cSub(b, a), 1 / (2 * h)), c).im;
    },
    pmax:pk * 1.15,
    note:'Your shape, evolved <b>exactly</b> — not stepped. It is transformed to momentum space once, every ' +
      'plane wave is turned through its own e^(−ik²t/2), and it is transformed back, so the picture at t = 8 ' +
      'is as accurate as the one at t = 0 and the total probability cannot drift. Δx and Δp below are ' +
      'measured from the computed |ψ|² and |φ(k)|² rather than read off a formula for a family your shape ' +
      'need not belong to. The product starts at ' + fmtNum(F.product0, 5) + ': ħ/2 = 0.5 is the floor of ' +
      'the uncertainty relation and the Gaussian is the only profile that sits on it, so anything you type ' +
      'that is not a Gaussian must come out above — which is what makes it an inequality.' +
      (F.edge > 0.01 ? ' <b>Note:</b> your shape is still at ' + fmtNum(F.edge, 3) + ' of its peak at the edge of the computing window, so it is being cut off; the spectrum below is partly the cut rather than your shape.' : '') +
      (F.alias > 1e-3 ? ' <b>Note:</b> ' + fmtNum(F.alias * 100, 3) + '% of the momentum lies against the grid\'s Nyquist ceiling. A corner or a jump has a spectrum falling only as 1/k and no finite grid holds all of it, so Δp below is a property of the grid as much as of your shape.' : '')
  };
  if(QM_PK_CACHE.size > 8) QM_PK_CACHE.clear();
  QM_PK_CACHE.set(ck, made);
  return made;
}

/* the superposition, from whichever eigenstates are in play */
function qmWellPsiCur(W, x, t, comps){
  let re = 0, im = 0;
  for(const { n, c } of comps){
    const E = W.E(n);
    if(!Number.isFinite(E)) continue;
    const ph = -E * t, f = W.phi(n, x);
    re += c * f * Math.cos(ph);
    im += c * f * Math.sin(ph);
  }
  return C(re, im);
}

/* ---- your own transform pair (the Fourier wing) -----------------------------
   The three presets are analytic pairs — someone did the integral. A typed
   signal gets the integral done numerically, and the panel is then obliged to
   say two things a preset never has to.

   First, X(f) is in general **complex**. All three presets are even, so their
   transforms are real and the stage could plot a single curve. A signal with any
   asymmetry has a phase, and plotting only the real part of it would be a
   quietly wrong picture — so the magnitude is plotted for a typed signal and the
   panel says which it is showing.

   Second, the answer is only the transform if the window contains the signal.
   `ftTruncation` measures the edge value against the peak, and when that ratio
   is not small what is on screen includes the rectangle's own sinc tails. The
   panel reports the number rather than letting leakage pass for mathematics.

   The spectrum is computed once into a table and interpolated: the plot asks for
   several hundred frequencies per frame, and each one is an integral. */
const FT_PAIR_OWN = [{ k:'x', label:'x(t) =', vars:'t', def:'exp(-2t^2)*cos(6t)', build:pkParamBuild }];
const FT_PAIR_BOUNDS = [{ k:'T', label:'window ±', def:8 }];
const FT_PAIR_CACHE = new Map();
function ftPairCur(st){
  if(st.kind !== 'custom') return null;           // the presets keep their own path
  const own = pkOwn(st, 'ftpair', FT_PAIR_OWN, FT_PAIR_BOUNDS);
  const T = Math.max(0.5, +own.T || 8);
  const ck = own.x + ' @ ' + T;
  const hit = FT_PAIR_CACHE.get(ck);
  if(hit) return hit;
  const g = pkParamFn(own.x);
  const x = t => { const v = g(t, 1); return Number.isFinite(v) ? v : 0; };
  const FS = 4, M = 320;                          // frequency half-span, table size
  const re = new Float64Array(M + 1), im = new Float64Array(M + 1);
  for(let i = 0; i <= M; i++){
    const f = -FS + 2 * FS * i / M;
    const H = ftHatNum(x, f, T, 2048);
    re[i] = H.re; im[i] = H.im;
  }
  const mag = f => {
    const u = (f + FS) / (2 * FS) * M;
    const i = Math.max(0, Math.min(M - 1, Math.floor(u))), s = u - i;
    const a = Math.hypot(re[i], im[i]), b = Math.hypot(re[i + 1], im[i + 1]);
    return a + (b - a) * s;
  };
  const tr = ftTruncation(x, T);
  const par = ftParsevalNum(x, T, FS, 2048, 640);
  const made = { custom:true, name:'x(t) = ' + own.x, x, T, FS, re, im, M, mag, tr, par,
    note:'Your signal, with the integral done rather than looked up. What is plotted below is ' +
      '<b>|X(f)|</b>, not X(f): a signal that is not even has a phase, and drawing only the real part of ' +
      'a complex transform would be a picture that is quietly wrong. ' +
      (tr.ratio < 1e-4
        ? 'Your signal has fallen to ' + fmtNum(tr.ratio, 3) + ' of its peak by the edge of the window, so the truncation is doing nothing and what you see is the transform.'
        : '<b>Careful:</b> your signal is still at ' + fmtNum(tr.ratio, 3) + ' of its peak where the window cuts it off. Cutting a signal is multiplying it by a rectangle, and multiplying in time is convolving in frequency — so a good part of the structure below is the window\'s own sinc tails rather than your signal\'s spectrum. Widen the window until that number is small, and watch the spurious ripples go away.') +
      ' As an independent check, the energy computed in time is ' + fmtNum(par.time, 6) +
      ' and the energy computed from the spectrum is ' + fmtNum(par.freq, 6) +
      ' — Parseval\'s theorem says those are the same number, and the gap of ' + fmtAgree(par.time, par.freq) +
      ' is the quadrature\'s honest error bar on everything else here.' };
  if(FT_PAIR_CACHE.size > 8) FT_PAIR_CACHE.clear();
  FT_PAIR_CACHE.set(ck, made);
  return made;
}

/* ---- the shared "sample a typed signal" helper (the Fourier wing) -----------
   Four stages here work on an array of samples rather than on a function: the
   sampling stage, the FFT timing stage, the inverse-and-compression stage and
   the convolution stage. Each of them builds that array from a formula written
   into its own source, and each therefore answers its question about one signal
   somebody else chose.

   They need exactly one thing in common — turn a typed x(t) into N samples over
   a stated span — so that is what this is. It compiles once per formula rather
   than once per sample: these arrays are rebuilt every frame, and `pkParamFn`
   parses on every call, so putting it inside the loop is the difference between
   a stage that runs and one that does not.

   The parameter is written `t` and rewritten to x before parsing, the same
   convention every signal slot in the wing uses. */
const FT_SIG_CACHE = new Map();
function ftOwnSamples(src, N, t0, t1){
  const ck = src + ' @ ' + N + ',' + t0 + ',' + t1;
  const hit = FT_SIG_CACHE.get(ck);
  if(hit) return hit;
  const f = pkParamFn(src);
  const out = new Float64Array(N);
  for(let i = 0; i < N; i++){
    const v = f(t0 + (t1 - t0) * i / N, 1);
    out[i] = Number.isFinite(v) ? v : 0;
  }
  if(FT_SIG_CACHE.size > 24) FT_SIG_CACHE.clear();
  FT_SIG_CACHE.set(ck, out);
  return out;
}
/* the same formula as a function of t, compiled once and cached */
const FT_FN_CACHE = new Map();
function ftOwnFn(src){
  const hit = FT_FN_CACHE.get(src);
  if(hit) return hit;
  const g = pkParamFn(src);
  const f = t => { const v = g(t, 1); return Number.isFinite(v) ? v : 0; };
  if(FT_FN_CACHE.size > 24) FT_FN_CACHE.clear();
  FT_FN_CACHE.set(src, f);
  return f;
}

/* ---- your own signal to sample ----------------------------------------------
   The sampling stage uses a pure tone, and a pure tone is the right thing to
   meet first: it has one frequency, so "where did it go?" has a one-line answer
   and `ftAlias` computes it. But a pure tone is also the only signal for which
   aliasing can be described by arithmetic, and a reader who has only seen that
   case can come away believing aliasing is about tones.

   For a typed signal the same verdict is *measured* instead. The signal is
   transformed at sixteen times the rate under test and the energy above Nyquist
   is added up: that is the part the samples cannot carry, and it does not vanish
   — it folds down onto the lower frequencies and is then indistinguishable from
   them. The panel prints the fraction.

   The reconstruction drawn is Whittaker–Shannon, from the samples alone. Below
   Nyquist it lies on the original; above it, it lies on something else entirely,
   and the residual between the two is printed rather than described. */
const FT_DISC_OWN = [{ k:'x', label:'x(t) =', vars:'t, in seconds',
                       def:'sin(2pi*3t) + 0.5sin(2pi*11t) + 0.3sin(2pi*23t)', build:pkParamBuild }];
const FT_DISC_CACHE = new Map();
function ftDiscCur(st){
  const N = st.N, fs = st.fs;
  if(!st.own){
    const x = t => Math.sin(2 * Math.PI * st.f * t);
    return { custom:false, name:'a pure tone at ' + fmtNum(st.f, 4) + ' Hz', x, tone:st.f,
      note:'One tone, so "where did it go?" has an exact answer: |f − k·f_s| for whichever k brings it into ' +
        'range. That closed form is available here and nowhere else — it is a property of a single line, not ' +
        'of sampling.' };
  }
  const own = pkOwn(st, 'ftdisc', FT_DISC_OWN, null);
  const ck = own.x + ' @ ' + fs + ',' + N;
  const hit = FT_DISC_CACHE.get(ck);
  if(hit) return hit;
  const x = ftOwnFn(own.x);
  const A = ftAliasEnergy(x, fs, N, 16);
  const made = { custom:true, name:'x(t) = ' + own.x, x, tone:null, alias:A,
    note:'Your signal. Nothing here knows what frequencies are in it, so the question is settled by ' +
      'measurement: it was transformed at <b>sixteen times</b> the sample rate below, and ' +
      fmtNum(A.frac * 100, 4) + '% of its energy was found above the Nyquist frequency ' +
      fmtNum(fs / 2, 4) + ' Hz. ' + (A.frac < 1e-6
        ? 'That is nothing, so this rate carries your signal faithfully and the reconstruction below should lie on top of it.'
        : 'That energy does not disappear when the signal is sampled — it <b>folds down</b> onto frequencies below Nyquist, where nothing downstream can tell it apart from content that was genuinely there. The bright curve is the Whittaker–Shannon reconstruction from the dots alone, and where it parts company with the pale one is the damage.') +
      ' Raise the sample rate until that percentage reaches zero and watch the two curves close.' };
  if(FT_DISC_CACHE.size > 12) FT_DISC_CACHE.clear();
  FT_DISC_CACHE.set(ck, made);
  return made;
}

/* ---- your own data for the FFT to be timed on -------------------------------
   The timing stage compares two algorithms, and the algorithms do not care what
   they are handed — so at first sight there is nothing here to type. There is
   one thing, and it is the stage's actual claim: that the FFT is not an
   approximation. A claim of exactness checked on one fixed array chosen by the
   author is a weak claim; checked on whatever the reader types, it is a real
   one. So the typed signal is what both routines are run on, and the largest
   disagreement between them is reported for that data. */
const FT_FAST_OWN = [{ k:'x', label:'x(t) =', vars:'t, over one record',
                       def:'sin(2pi*5t) + 0.4cos(2pi*17t) + t^2', build:pkParamBuild }];
function ftFastCur(st){
  const N = 1 << st.p;
  /* The noise is generated from a fixed seed rather than from Math.random. A
     readout that changes when nothing was changed teaches the reader to distrust
     all of it, and this one is refreshed several times a second. */
  if(!st.own) return { custom:false, name:'a tone plus a little noise',
    samples:() => { const s = new Float64Array(N);
      let seed = 20250809;
      for(let i = 0; i < N; i++){
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        s[i] = Math.sin(2 * Math.PI * 5 * i / N) + (seed / 0x7fffffff) * 0.2;
      }
      return s; },
    note:'A tone with noise on it — the algorithms do not care what they are handed, and that is the point of this stage.' };
  const own = pkOwn(st, 'ftfast', FT_FAST_OWN, null);
  return { custom:true, name:'x(t) = ' + own.x,
    samples:() => Float64Array.from(ftOwnSamples(own.x, N, 0, 1)),
    note:'Your data. The exactness claim on this stage — that the FFT and the direct sum compute the same ' +
      'numbers — is worth far more when it is checked on an array the author did not choose. Press the ' +
      'button and the two routines are run on your samples and compared bin by bin; the largest disagreement ' +
      'is printed. It will be a few times the machine epsilon, and the FFT will be the more accurate of the ' +
      'two, because it performs fewer operations on each value.' };
}

/* ---- your own signal to compress --------------------------------------------
   The three presets were chosen to compress well, badly and in between, which is
   the right way to introduce the idea. But "does my signal compress?" is a
   question about a particular signal, and the honest answer for a typed one is a
   measurement: how many coefficients does it take to get the error below a
   stated threshold? That number is computed here by keeping coefficients one at
   a time in order of size, which is exactly what the stage's slider does by
   hand — so the reader can find the answer themselves and then read it off. */
const FT_INV_OWN = [{ k:'x', label:'x(t) =', vars:'t, over one record 0…1',
                      def:'exp(-30(t - 0.35)^2) - 0.7exp(-60(t - 0.7)^2)', build:pkParamBuild }];
const FT_INV_CACHE = new Map();
function ftInvCur(st){
  const N = 128;
  if(!st.own) return { custom:false, name:st.kind,
    sig:() => { const s = new Float64Array(N);
      for(let i = 0; i < N; i++){ const t = i / N;
        s[i] = st.kind === 'pulse' ? (Math.abs(i - N / 2) < 10 ? 1 : 0)
             : st.kind === 'chirp' ? Math.sin(2 * Math.PI * (3 * t + 14 * t * t))
             : Math.sin(2 * Math.PI * 5 * t) + 0.35 * (Math.sin(i * 91.7) * Math.cos(i * 13.3));
      }
      return s; },
    note:'Three signals chosen to compress badly, moderately and well — a pulse, a chirp and a noisy tone.' };
  const own = pkOwn(st, 'ftinv', FT_INV_OWN, null);
  const hit = FT_INV_CACHE.get(own.x);
  if(hit) return hit;
  const sig = ftOwnSamples(own.x, N, 0, 1);
  /* how many coefficients your signal actually needs, measured by keeping them
     one at a time in order of size — the same procedure the slider performs */
  const re = Float64Array.from(sig), im = new Float64Array(N);
  ftFFT(re, im);
  const idx = [];
  for(let k = 0; k <= N / 2; k++) idx.push({ k, m:Math.hypot(re[k], im[k]) });
  idx.sort((a, b) => b.m - a.m);
  let energy = 0;
  for(let i = 0; i < N; i++) energy += sig[i] * sig[i];
  energy = Math.sqrt(energy / N) || 1;
  let need = idx.length;
  (function(){
    const keep = new Set();
    for(let n = 1; n <= idx.length; n++){
      keep.add(idx[n - 1].k);
      if(idx[n - 1].k > 0 && idx[n - 1].k < N / 2) keep.add(N - idx[n - 1].k);
      const kr = new Float64Array(N), ki = new Float64Array(N);
      for(const k of keep){ kr[k] = re[k]; ki[k] = im[k]; }
      ftFFT(kr, ki, true);
      let e = 0;
      for(let i = 0; i < N; i++) e += (kr[i] - sig[i]) * (kr[i] - sig[i]);
      if(Math.sqrt(e / N) < 0.01 * energy){ need = n; return; }
    }
  })();
  const made = { custom:true, name:'x(t) = ' + own.x, sig:() => Float64Array.from(sig), need,
    note:'Your signal. Whether it compresses is not a matter of opinion, so it was measured: keeping the ' +
      'largest coefficients one at a time, it takes <b>' + need + '</b> of them to bring the RMS error below ' +
      '1% of the signal\'s own RMS. A signal that is a few pure tones needs a handful; one with a sharp edge ' +
      'in it needs most of them, because an edge is spread across every bin — which is the same fact as ' +
      'Gibbs, met from the other side. Set the slider to that number and see what 1% looks like.' };
  if(FT_INV_CACHE.size > 8) FT_INV_CACHE.clear();
  FT_INV_CACHE.set(own.x, made);
  return made;
}

/* ---- your own signal and your own filter ------------------------------------
   The convolution stage filters a fixed two-tone signal with an ideal brick-wall
   low-pass. Both halves are worth opening up, and the filter is the more
   interesting of the two.

   The stage's own closing remark is that the brick wall rings, because a
   rectangle in frequency is a sinc in time, and that real filters round the
   corner to avoid it. That is currently something the reader is told. With a
   typed H(k) they can find it out: `1/(1 + (k/6)^4)` is a Butterworth response
   and its impulse response has no ringing worth the name, while the brick wall
   beside it has visible tails. Two formulas, one lesson, and no assertion.

   H is written as a function of the bin index k and must be even about the
   middle of the spectrum, or the impulse response comes out complex — so it is
   evaluated on the folded index min(k, N−k), which enforces that rather than
   hoping for it. */
const FT_CONV_OWN = [{ k:'x', label:'signal x(t) =', vars:'t, over one record 0…1',
                       def:'sin(2pi*3t) + 0.55sin(2pi*19t)', build:pkParamBuild },
                     { k:'H', label:'filter gain H(k) =', vars:'k, the bin index', def:'1/(1 + (k/6)^4)' }];
const FT_CONV_CACHE = new Map();
function ftConvCur(st){
  const N = 128;
  if(!st.own) return { custom:false, name:'two tones through a brick wall',
    sig:() => { const s = new Float64Array(N);
      for(let i = 0; i < N; i++) s[i] = Math.sin(2 * Math.PI * 3 * i / N) + 0.55 * Math.sin(2 * Math.PI * 19 * i / N);
      return s; },
    gain:k => (k <= st.cut ? 1 : 0), hName:'an ideal low-pass at bin ' + st.cut,
    note:'A three-cycle tone with a nineteen-cycle intruder on it, and an ideal brick-wall low-pass. Both are ' +
      'the simplest thing that shows the theorem — and the brick wall is also the worst filter in the world, ' +
      'for a reason visible in the top-right panel.' };
  const own = pkOwn(st, 'ftconv', FT_CONV_OWN, null);
  const ck = own.x + ' | ' + own.H;
  const hit = FT_CONV_CACHE.get(ck);
  if(hit) return hit;
  const g = pkCompile(own.H);
  const gain = k => { const v = g(k, 0, 0); return Number.isFinite(v) ? v : 0; };
  /* the impulse response's own tails, measured — which is what "ringing" is */
  const hr = new Float64Array(N), hi = new Float64Array(N);
  for(let k = 0; k < N; k++) hr[k] = gain(Math.min(k, N - k));
  ftFFT(hr, hi, true);
  let peak = 0;
  for(let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(hr[i]));
  let tail = 0;
  for(let i = 12; i <= N - 12; i++) tail = Math.max(tail, Math.abs(hr[i]));
  const ring = peak > 0 ? tail / peak : 0;
  const made = { custom:true, name:'x(t) = ' + own.x, hName:'H(k) = ' + own.H,
    sig:() => Float64Array.from(ftOwnSamples(own.x, N, 0, 1)), gain, ring,
    note:'Your signal and your filter. H is read at the folded bin index min(k, N−k), which forces it to be ' +
      'symmetric about the middle of the spectrum — without that the impulse response would come back complex ' +
      'and there would be nothing sensible to draw. Twelve samples away from its peak your impulse response ' +
      'is still at ' + fmtNum(ring * 100, 3) + '% of it: that number <b>is</b> the ringing, and it is what the ' +
      'brick wall is guilty of. Try <b>1/(1 + (k/6)^4)</b> against something like <b>1</b> below a cutoff and ' +
      '<b>0</b> above, and watch the tails appear. The two bottom curves are still computed by completely ' +
      'different routes, so they still have to agree whatever you type — that is the theorem, and it does not ' +
      'care whether your filter is a good one.' };
  if(FT_CONV_CACHE.size > 8) FT_CONV_CACHE.clear();
  FT_CONV_CACHE.set(ck, made);
  return made;
}

/* ---- your own distribution (the probability wing) ---------------------------
   Every preset here carries its mean and its variance as closed forms, because
   they are known. A typed density has neither, so both are obtained the only
   honest way: by quadrature against the density itself.

       Z = ∫f,   μ = (1/Z)∫x f,   σ² = (1/Z)∫(x − μ)² f

   Three things a typed density has to be defended against, and the panel says
   which one it hit rather than printing a number that is quietly meaningless.
   A density that integrates to zero cannot be normalised. A density that goes
   negative is not a density at all — the reader has typed a function, not a
   distribution, and clamping it silently would hide that. And a density with
   heavy tails may have a perfectly finite integral and no finite variance, so
   the second moment is checked for growth against the window rather than
   assumed to have settled. */
const PB_OWN = [{ k:'f', label:'shape f(x) ∝', vars:'x', def:'exp(-abs(x))*(1 + 0.6cos(3x))' }];
const PB_OWN_BOUNDS = [{ k:'lo', label:'from', def:-6 }, { k:'hi', label:'to', def:6 }];
const PB_OWN_CACHE = new Map();
function pbDistCur(st){
  if(st.key !== 'custom') return PB_DISTS[st.key];
  const own = pkOwn(st, 'pbown', PB_OWN, PB_OWN_BOUNDS);
  const lo = +own.lo, hi = +own.hi;
  const ck = own.f + ' @ ' + lo + ',' + hi;
  const hit = PB_OWN_CACHE.get(ck);
  if(hit) return hit;
  const g = pkFn(st, 'pbown', 'f');
  const raw = x => { const v = g(x, 0, 0); return Number.isFinite(v) ? v : 0; };
  /* negative anywhere? sampled, and reported rather than clamped in silence */
  let neg = 0;
  for(let i = 0; i <= 600; i++){
    const v = raw(lo + (hi - lo) * i / 600);
    if(v < 0) neg = Math.min(neg, v);
  }
  const f = x => Math.max(0, raw(x));
  const Z = nqAdaptive(f, lo, hi, 1e-11);
  const ok = Number.isFinite(Z) && Z > 1e-12;
  const pdf = x => (ok && x >= lo && x <= hi ? f(x) / Z : 0);
  const mean = ok ? nqAdaptive(x => x * pdf(x), lo, hi, 1e-11) : NaN;
  const vari = ok ? nqAdaptive(x => (x - mean) * (x - mean) * pdf(x), lo, hi, 1e-11) : NaN;
  /* does the second moment settle, or is it still growing with the window? */
  let heavy = false;
  if(ok){
    const half = nqAdaptive(x => (x - mean) * (x - mean) * pdf(x), lo / 2, hi / 2, 1e-11);
    heavy = Number.isFinite(vari) && vari > 0 && (vari - half) / vari > 0.25;
  }
  /* sampling by inverting the CDF, built once as a table */
  const NS = 2048, hs = (hi - lo) / NS;
  const cdf = new Float64Array(NS + 1);
  for(let i = 1; i <= NS; i++)
    cdf[i] = cdf[i - 1] + (pdf(lo + (i - 1) * hs) + pdf(lo + i * hs)) / 2 * hs;
  const tot = cdf[NS] || 1;
  const sample = () => {
    const u = Math.random() * tot;
    let a = 0, b = NS;
    while(b - a > 1){ const m = (a + b) >> 1; if(cdf[m] <= u) a = m; else b = m; }
    const seg = cdf[b] - cdf[a];
    return lo + (a + (seg > 1e-15 ? (u - cdf[a]) / seg : 0)) * hs;
  };
  const made = { n:'your density', cont:true, lo, hi, custom:true,
    pdf:x => pdf(x), par:{ a:0, b:0 }, pn:['—', '—'],
    mean:() => mean, vari:() => vari, sample,
    note:!ok
      ? 'That shape integrates to ' + fmtNum(Z, 3) + ' over the interval, so it cannot be normalised into a density. A density has to enclose a positive, finite area — try a function that is positive somewhere and decays at both ends.'
      : 'Your density. Nothing here is quoted: the shape you typed was integrated to give a normalising constant of ' +
        fmtNum(Z, 6) + ', and the mean and variance below are ∫x·f and ∫(x−μ)²·f evaluated by adaptive ' +
        'quadrature at a tolerance of 10⁻¹¹ — not formulas for a family your function maynot belong to. ' +
        'Samples are drawn by inverting the cumulative distribution, so the histogram is a genuine test of ' +
        'the density rather than a redrawing of it.' +
        (neg < 0 ? ' <b>Note:</b> what you typed goes as low as ' + fmtNum(neg, 4) + ' somewhere in the window. A density cannot be negative, so those parts have been treated as zero — which means the picture is no longer the function you wrote.' : '') +
        (heavy ? ' <b>Note:</b> the variance is still growing as the window widens, so this density has heavy tails and its variance may not exist at all. The number below is a property of the window as much as of the distribution — a Cauchy density does exactly this.' : '') };
  if(PB_OWN_CACHE.size > 8) PB_OWN_CACHE.clear();
  PB_OWN_CACHE.set(ck, made);
  return made;
}

/* ---- your own complex function, as two real ones ----------------------------
   The expression engine parses real expressions, and giving it a complex parser
   would be a large piece of work for a worse lesson. Two real boxes are better:
   the reader writes u(x, y) and v(x, y) for f = u + iv, and the question "is this
   function analytic?" becomes something they can *discover* rather than be told.

   Cauchy–Riemann is uₓ = v_y and u_y = −vₓ. Both partials are taken
   symbolically, so the residual is exact arithmetic rather than a difference
   quotient, and it is measured across the window and reported as the largest
   value found. A reader who types u = x, v = −y gets a residual of 2 and can see
   the conjugate fail; u = x² − y², v = 2xy gives zero and is z². Nothing is
   asserted — and finding out which of your own maps is holomorphic is a better
   lesson than a parser that only accepts the ones that are. */
const CX_OWN = [{ k:'u', label:'u(x, y) =', vars:'x, y', def:'x^2 - y^2' },
                { k:'v', label:'v(x, y) =', vars:'x, y', def:'2x y' }];
const CX_OWN_CACHE = new Map();
function cxOwnCur(st){
  if(st.key !== 'custom') return CX_FUNCS[st.key];
  const own = pkOwn(st, 'cxown', CX_OWN, null);
  const ck = own.u + ' + i(' + own.v + ')';
  const hit = CX_OWN_CACHE.get(ck);
  if(hit) return hit;
  const gu = pkFn(st, 'cxown', 'u'), gv = pkFn(st, 'cxown', 'v');
  const fin = v => Number.isFinite(v) ? v : 0;
  /* the four partials, symbolically */
  let ux = null, uy = null, vx = null, vy = null, ok = true;
  try {
    const U = parse(own.u), V = parse(own.v);
    ux = compile(diff(U, 'x')); uy = compile(diff(U, 'y'));
    vx = compile(diff(V, 'x')); vy = compile(diff(V, 'y'));
  } catch(e){ ok = false; }
  /* the residual, measured over the window rather than claimed */
  let worst = 0, at = null;
  if(ok){
    for(let i = -12; i <= 12; i++) for(let j = -12; j <= 12; j++){
      const x = i / 6, y = j / 6;
      const a = ux(x, y, 0) - vy(x, y, 0);
      const b = uy(x, y, 0) + vx(x, y, 0);
      if(!Number.isFinite(a) || !Number.isFinite(b)) continue;
      const d = Math.max(Math.abs(a), Math.abs(b));
      if(d > worst){ worst = d; at = { x, y }; }
    }
  }
  const holo = ok && worst < 1e-9;
  const made = {
    n:'f = (' + own.u + ') + i(' + own.v + ')', custom:true,
    f:z => cx(fin(gu(z.re, z.im)), fin(gv(z.re, z.im))),
    poles:[], res:[], holo, crWorst:worst, crAt:at,
    note:!ok ? 'One of those expressions did not parse, so the previous function is still shown.'
      : 'Your function, written as two real ones. The Cauchy–Riemann equations — uₓ = v_y and ' +
        'u_y = −vₓ — were formed by differentiating both of your expressions <b>symbolically</b> and then ' +
        'evaluated across the window. The largest violation found anywhere was ' + fmtNum(worst, 4) +
        (holo
          ? ', which is zero to rounding: your f is <b>holomorphic</b> here. That is why the grid below meets itself at right angles — a conformal map is exactly one that satisfies these equations, and the angle-preservation is the geometry of that algebra.'
          : ', at x = ' + fmtNum(at.x, 3) + ', y = ' + fmtNum(at.y, 3) +
            '. That is not zero, so your f is <b>not</b> holomorphic. It is still a perfectly good map of the plane and it is still drawn — but it does not preserve angles, it has no complex derivative, and none of the contour-integral theorems apply to it. Cauchy–Riemann is the whole difference between a pair of real functions and a complex one.') +
        (holo ? '' : ' Residues and contour integrals are left empty for a non-holomorphic f rather than computed, because the quantities they name do not exist for it.') };
  if(CX_OWN_CACHE.size > 12) CX_OWN_CACHE.clear();
  CX_OWN_CACHE.set(ck, made);
  return made;
}

/* ---- polar curves ---------------------------------------------------------- */
const PC_POLAR_OWN = [{ k:'r', label:'r(θ) =', vars:'θ, a', def:'a*(1 + cos(t))', build:pkParamBuild }];
function pcPolarCur(st){
  if(st.key !== 'custom') return PC_POLAR[st.key];
  const own = pkOwn(st, 'pcpol', PC_POLAR_OWN, null);
  const f = pkParamFn(own.r), d = pkParamD(own.r, 1);
  return { name:'r = ' + own.r, k:1, a:1, t0:0, t1:2 * Math.PI,
    f:(th, a) => f(th, a), d:(th, a) => d(th, a),
    note:'Your polar curve. Write the angle as <b>t</b> and the slider as <b>a</b>. dr/dθ is symbolic, so the tangent, the area swept and the arc length are all exact for what you typed.' };
}

/* ---- space curves ---------------------------------------------------------- */
const PC_SPACE_OWN = [{ k:'x', label:'x(t) =', vars:'t, a', def:'a*cos(t)', build:pkParamBuild },
                      { k:'y', label:'y(t) =', vars:'t, a', def:'a*sin(t)', build:pkParamBuild },
                      { k:'z', label:'z(t) =', vars:'t, a', def:'t/3', build:pkParamBuild }];
const PC_SPACE_BOUNDS = [{ k:'t0', label:'t from', def:-3 * Math.PI },
                         { k:'t1', label:'t to', def:3 * Math.PI }];
const PK_SPACE_CACHE = new Map();
function pcSpaceBuild(xs, ys, zs){
  const key = JSON.stringify([xs, ys, zs]);
  const hit = PK_SPACE_CACHE.get(key);
  if(hit) return hit;
  const c = (s, n) => (n ? pkParamD(s, n) : pkParamFn(s));
  const X = c(xs, 0), Y = c(ys, 0), Z = c(zs, 0);
  const Xd = c(xs, 1), Yd = c(ys, 1), Zd = c(zs, 1);
  const X2 = c(xs, 2), Y2 = c(ys, 2), Z2 = c(zs, 2);
  const made = {
    f:(t, a) => v3(X(t, a), Y(t, a), Z(t, a)),
    d:(t, a) => v3(Xd(t, a), Yd(t, a), Zd(t, a)),
    dd:(t, a) => v3(X2(t, a), Y2(t, a), Z2(t, a))
  };
  if(PK_SPACE_CACHE.size > 32) PK_SPACE_CACHE.clear();
  PK_SPACE_CACHE.set(key, made);
  return made;
}
function pcSpaceCur(st){
  if(st.key !== 'custom') return PC_SPACE[st.key];
  const own = pkOwn(st, 'pcsp', PC_SPACE_OWN, PC_SPACE_BOUNDS);
  const C = pcSpaceBuild(own.x, own.y, own.z);
  return { name:'your curve', eq:'⟨' + own.x + ', ' + own.y + ', ' + own.z + '⟩',
    t0:+own.t0, t1:+own.t1, a:1, c:1,
    f:C.f, d:C.d, dd:C.dd,
    note:'Your space curve, differentiated symbolically twice — so the unit tangent, the normal, the binormal, the curvature and the torsion are all exact for what you typed rather than estimated from samples.' };
}

/* ---- two-variable limits at the origin -------------------------------------
   The preset table *declares* `exists`, because whoever wrote each entry proved
   it. A typed f is entitled to no such claim, so the verdict is measured: the
   spread of f around circles of shrinking radius. If direction stops mattering
   the limit exists and the common value is it; if it does not, the spread is
   itself the proof that no limit can. Nothing is asserted that was not seen. */
const MV_LIM_OWN = [{ k:'f', label:'f(x, y) =', vars:'x, y', def:'x y^2/(x^2 + y^4)' }];
/* frame() names the function every frame and readout() asks for the verdict four
   times a second; the verdict costs 1 440 evaluations and a parse. Both would be
   repeated for a formula that has not changed, so the answer is kept against the
   source that produced it. */
const MV_LIM_CACHE = new Map();
function mvLimitCur(st){
  if(st.key !== 'custom') return MV_LIMIT_CASES[st.key];
  const own = pkOwn(st, 'mvlim', MV_LIM_OWN, null);
  const hit = MV_LIM_CACHE.get(own.f);
  if(hit) return hit;
  const g = pkFn(st, 'mvlim', 'f');
  const F = { f:(x, y) => g(x, y) };
  /* the spread over direction, at radii four decades apart */
  const rs = [0.5, 0.05, 0.005, 5e-4];
  const sp = rs.map(r => mvPolarSpread(F, r, 360));
  const last = sp[sp.length - 1];
  /* Collapsing means the spread is shrinking *and* has become small next to the
     size of the values themselves — an absolute tolerance would call a function
     of magnitude 1e-9 continuous whatever it does. */
  const scale = Math.max(1e-12, Math.abs(last.lo), Math.abs(last.hi));
  const shrinking = sp.every((s, i) => i === 0 || !Number.isFinite(s.spread) || s.spread <= sp[i - 1].spread + 1e-12);
  const exists = Number.isFinite(last.spread) && shrinking && last.spread < 1e-4 * scale + 1e-9;
  const value = exists ? (last.lo + last.hi) / 2 : NaN;
  const rows = rs.map((r, i) => 'r = ' + fmtNum(r, 3) + ' → ' + fmtNum(sp[i].spread, 4)).join(',  ');
  const made = { name:'f = ' + own.f, src:own.f, exists, value,
    why:'Nothing here was told what your function does. f was evaluated at 360 directions around circles of four shrinking radii and the spread — the highest value minus the lowest — recorded at each: ' +
      rows + '. ' + (exists
        ? 'The spread collapses, so direction stops mattering as the origin is approached and the limit exists; the common value is ' + fmtNum(value, 6) +
          '. That is strong numerical evidence and not a proof — the honest proof is the polar squeeze, a bound g(r) → 0 independent of θ.'
        : 'The spread does not collapse. Different directions keep giving different answers arbitrarily close to the origin, so no single L can be the limit — and unlike the existence case this <b>is</b> conclusive: one pair of disagreeing paths settles it.') };
  if(MV_LIM_CACHE.size > 32) MV_LIM_CACHE.clear();
  MV_LIM_CACHE.set(own.f, made);
  return made;
}

/* ---- your own constrained optimisation --------------------------------------
   Every preset here arrives with a parametrisation of its constraint because
   whoever wrote it knew one. A typed g(x, y) does not, so the curve g = 0 is
   traced numerically (mvLevelCurve) and walked by arc length. The reader
   therefore gets to constrain by anything that has a curve, not only by the five
   shapes someone could write down a formula for. */
const MV_LAGR_OWN = [{ k:'f', label:'maximise f =', vars:'x, y', def:'x^2 + y' },
                     { k:'g', label:'subject to g =', vars:'x, y', def:'x^2 + 4y^2 - 4' }];
const MV_LAGR_BOX = { x0:-2.9, x1:2.9, y0:-2.9, y1:2.9 };
const MV_LAGR_CACHE = new Map();
function mvLagrCur(st){
  if(st.prob !== 'custom') return STAGES.mvLagr.problems()[st.prob];
  const own = pkOwn(st, 'mvlagr', MV_LAGR_OWN, null);
  const ck = own.f + ' ⟂ ' + own.g;
  const hit = MV_LAGR_CACHE.get(ck);
  if(hit) return hit;
  let C = null;
  try { C = mvLevelCurve(mvCompile(own.g), MV_LAGR_BOX); } catch(e){ C = null; }
  const made = C
    ? { name:'stationary points of ' + own.f + ' on ' + own.g + ' = 0',
        f:own.f, g:own.g, param:C.param, t0:0, t1:1, traced:C,
        note:'Your constraint came with no parametrisation, so one was <b>traced</b>: a point on g = 0 was ' +
          'found by bisection and then marched along, each step turning ∇g through a right angle and ' +
          'correcting back onto the curve by Newton. That produced ' + C.pts.length + ' points along ' +
          (C.closed ? 'a closed loop' : 'an open arc') + ' of length ' + fmtNum(C.length, 4) +
          ', walked at constant speed because the parametrisation is by arc length. The tracer sees only ' +
          'the window, so a constraint with several separate branches is walked along the one nearest the ' +
          'seed — which is worth knowing before reading the list of solutions as complete.' }
    : { name:'no constraint curve in this window',
        f:own.f, g:own.g, param:() => ({ x:0, y:0 }), t0:0, t1:1, traced:null,
        note:'Nothing was traced: g never changes sign anywhere in the window, so the set g = 0 has no ' +
          'curve here to walk along. That is a real answer rather than a failure — x² + y² + 1 is never ' +
          'zero, and a constraint no point satisfies constrains nothing. Try a g that is positive ' +
          'somewhere and negative somewhere else.' };
  if(MV_LAGR_CACHE.size > 16) MV_LAGR_CACHE.clear();
  MV_LAGR_CACHE.set(ck, made);
  return made;
}

/* ---- your own change of variables -------------------------------------------
   A map of the plane is written in u and v, and the engine knows neither, so the
   same rewrite the curve slots use applies here: u → x, v → y before parsing.
   The exclusion is letters either side rather than \b, so the u of `sqrt` and
   the v of `div` survive while the u of `2u` does not.

   The stage prints det J twice — once from the finite-difference Jacobian and
   once from "the closed form" — and the gap between them is the evidence that
   the derivative is what it claims to be. A preset supplies that closed form
   because its author worked it out. For a typed map it is obtained by
   differentiating the two expressions symbolically and expanding the 2×2
   determinant, so the comparison stays a comparison of two independent routes
   rather than of one route with itself. */
const pkUVAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])u(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])v(?![A-Za-z])/g, 'y'));
const pkUVBuild = s => { const g = compile(pkUVAst(s)); return { f:(u, v) => g(u, v, 0) }; };
const MV_MAP_OWN = [{ k:'x', label:'x(u, v) =', vars:'u, v', def:'u^2 - v^2', build:pkUVBuild },
                    { k:'y', label:'y(u, v) =', vars:'u, v', def:'2u v', build:pkUVBuild }];
const MV_MAP_BOUNDS = [{ k:'u0', label:'u from', def:0.1 }, { k:'u1', label:'u to', def:1.5 },
                       { k:'v0', label:'v from', def:0.1 }, { k:'v1', label:'v to', def:1.5 }];
const MV_MAP_CACHE = new Map();
/* T and the symbolic determinant, compiled once per formula — the stage asks for
   T some three thousand times a frame drawing the mapped grid */
function mvMapBuild(xs, ys){
  const ck = xs + ' , ' + ys;
  const hit = MV_MAP_CACHE.get(ck);
  if(hit) return hit;
  let T, jac, ok = true;
  try {
    const X = pkUVAst(xs), Y = pkUVAst(ys);
    const gx = compile(X), gy = compile(Y);
    const xu = compile(diff(X, 'x')), xv = compile(diff(X, 'y'));
    const yu = compile(diff(Y, 'x')), yv = compile(diff(Y, 'y'));
    T = (u, v) => ({ x:gx(u, v, 0), y:gy(u, v, 0) });
    jac = (u, v) => xu(u, v, 0) * yv(u, v, 0) - xv(u, v, 0) * yu(u, v, 0);
  } catch(e){
    ok = false;
    T = (u, v) => ({ x:u, y:v });
    jac = () => 1;
  }
  const made = { T, jac, ok };
  if(MV_MAP_CACHE.size > 24) MV_MAP_CACHE.clear();
  MV_MAP_CACHE.set(ck, made);
  return made;
}
function mvMapCur(st){
  if(st.key !== 'custom') return MV_MAPS[st.key];
  const own = pkOwn(st, 'mvmap', MV_MAP_OWN, MV_MAP_BOUNDS);
  const M = mvMapBuild(own.x, own.y);
  return { name:'(u, v) → (' + own.x + ', ' + own.y + ')',
    u0:+own.u0, u1:+own.u1, v0:+own.v0, v1:+own.v1, ul:'u', vl:'v',
    T:M.T, jac:M.jac,
    note:'Your map. Both components were differentiated <b>symbolically</b> in u and in v, and the row ' +
      'labelled "the closed form" is x_u y_v − x_v y_u evaluated from those derivatives. The row above it ' +
      'is det J built from central differences instead. Nothing forces the two to agree — they are ' +
      'computed by different routes — so the gap between them is a measurement of how well the numerical ' +
      'derivative is behaving, and it is the one place on this stage where a discrepancy would be telling ' +
      'you something true.' };
}

/* ---- a typed integrand, in whatever coordinates suit it ----------------------
   The rewrite itself is `igCoordSrc` in `25a-integrate-typed.js`, where it can
   be unit-tested; this is the compile step, which cannot live there because
   `pkCompile` belongs to the interaction toolkit at 59.

   Guarded, because it is handed straight to a quadrature routine that would
   otherwise take an exception thrown from inside its innermost loop. */
function igCoordFn(src, fallback){
  const g = pkCompile(igCoordSrc(src), fallback || (() => 0));
  return (x, y, z) => { const v = g(x, y || 0, z || 0); return Number.isFinite(v) ? v : 0; };
}
/* One paragraph, shown under every typed integrand in the integral wings. It
   has to mention the clash with the field engine's macros, because a reader who
   has met `r` in the vector-calculus wings has met it meaning the other thing. */
const IG_COORD_HELP =
  'Write the integrand in <b>whatever coordinates suit it</b> — they are not modes to switch ' +
  'between, and may be mixed in one expression. <b>x y z</b> are Cartesian; <b>r</b> is the ' +
  'cylindrical radius √(x²+y²); <b>rho</b> is the spherical radius √(x²+y²+z²); <b>theta</b> is ' +
  'measured from the +x axis and <b>phi</b> from the +z axis — the convention every calculus text ' +
  'uses. So <b>x^2 + y^2</b>, <b>r^2</b> and <b>rho^2*sin(phi)^2</b> are three spellings of one ' +
  'function, and the panel reports which you used. (In the vector-calculus wings the field engine\'s ' +
  '<b>r</b> means the <i>spherical</i> radius instead; inside the integrals the textbook convention wins.)';

/* ---- your own region of integration -----------------------------------------
   This used to be polar only, on the reasoning that a Cartesian region needs
   both a Type I and a Type II description and a reader who has one has no
   reason to know the other. That was wrong twice over. A reader who supplies
   ONE description is entitled to integrate over it — the second is needed only
   to change the order, which is a separate question. And supplying both is
   exactly what makes Fubini's theorem testable rather than quotable, which is
   the most valuable thing this stage could possibly offer.

   So the typed region now comes in four kinds, and the slots follow the kind:

     I     x over an interval, y between two functions of x
     II    y over an interval, x between two functions of y
     polar θ over an interval, r between two functions of θ
     both  all four, so the two iterated integrals can be differenced

   The slot keys are distinct per kind and share one store, so switching kinds
   keeps whatever was already typed in the others. The defaults describe the
   SAME region — between y = x² and y = 2x — in every kind, so switching is
   itself the lesson. */
const IG_REG_I_OWN  = [{ k:'gHi', label:'y up to', vars:'x', def:'2*x' },
                       { k:'gLo', label:'y from',  vars:'x', def:'x^2' }];
const IG_REG_I_BOUNDS = [{ k:'a', label:'x from', def:0 }, { k:'b', label:'x to', def:2 }];
const IG_REG_II_OWN = [{ k:'hHi', label:'x up to', vars:'y', def:'sqrt(max(0,y))' },
                       { k:'hLo', label:'x from',  vars:'y', def:'y/2' }];
const IG_REG_II_BOUNDS = [{ k:'c', label:'y from', def:0 }, { k:'d', label:'y to', def:4 }];
const IG_REG_OWN = [{ k:'r1', label:'outer r(θ) =', vars:'θ, written t', def:'1 + 0.6 cos(3t)', build:pkParamBuild },
                    { k:'r0', label:'inner r(θ) =', vars:'θ, written t', def:'0', build:pkParamBuild }];
const IG_REG_BOUNDS = [{ k:'t0', label:'θ from', def:0 }, { k:'t1', label:'θ to', def:2 * Math.PI }];

/* every slot and bound the store must hold, whatever kind is showing — pkOwn
   seeds defaults from the list it is given, so it has to be given all of them
   or a kind switched to for the first time would find its keys undefined */
const IG_REG_ALL_OWN    = IG_REG_I_OWN.concat(IG_REG_II_OWN, IG_REG_OWN);
const IG_REG_ALL_BOUNDS = IG_REG_I_BOUNDS.concat(IG_REG_II_BOUNDS, IG_REG_BOUNDS);
const igRegKind = st => (st.regKind || 'polar');
/* what to render and wire for the kind showing */
function igRegSlots(st){
  const k = igRegKind(st);
  return k === 'I' ? IG_REG_I_OWN : k === 'II' ? IG_REG_II_OWN
       : k === 'both' ? IG_REG_I_OWN.concat(IG_REG_II_OWN) : IG_REG_OWN;
}
function igRegBounds(st){
  const k = igRegKind(st);
  return k === 'I' ? IG_REG_I_BOUNDS : k === 'II' ? IG_REG_II_BOUNDS
       : k === 'both' ? IG_REG_I_BOUNDS.concat(IG_REG_II_BOUNDS) : IG_REG_BOUNDS;
}

const IG_REG_CACHE = new Map();
function igRegCur(st){
  if(st.reg !== 'custom') return IG_REGIONS[st.reg];
  const own = pkOwn(st, 'igreg', IG_REG_ALL_OWN, IG_REG_ALL_BOUNDS);
  const kind = igRegKind(st);
  if(kind !== 'polar') return igRegCartesian(st, own, kind);
  const ck = ['polar', own.r0, own.r1, own.t0, own.t1].join(' | ');
  const hit = IG_REG_CACHE.get(ck);
  if(hit) return hit;
  const f1 = pkParamFn(own.r1), f0 = pkParamFn(own.r0);
  const t0 = +own.t0, t1 = +own.t1;
  /* A negative radius is not a region — it is the curve reflected through the
     origin, and the sector formula would hand back a positive area for it. Clamp
     and say so, rather than integrating something the picture does not show. */
  let neg = false;
  const r1 = th => { const v = f1(th, 1); if(v < 0) neg = true; return Number.isFinite(v) ? Math.max(0, v) : 0; };
  const r0 = th => { const v = f0(th, 1); if(v < 0) neg = true; return Number.isFinite(v) ? Math.max(0, v) : 0; };
  /* the bounding box, measured from the boundary rather than guessed */
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for(let i = 0; i <= 720; i++){
    const th = t0 + (t1 - t0) * i / 720, R = Math.max(r1(th), r0(th));
    const x = R * Math.cos(th), y = R * Math.sin(th);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = Math.max(x1 - x0, y1 - y0) * 0.06 + 1e-3;
  x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
  /* Two independent routes to the area. The sector formula ½∫(r₁² − r₀²)dθ is a
     one-dimensional integral that never touches the quadrature the stage uses;
     the stage's own route is a nested r-then-θ quadrature of the constant 1. The
     house rule is that equality is claimed only after computing both and
     printing the gap, so both are computed here. */
  const sector = nqAdaptive(th => 0.5 * (r1(th) * r1(th) - r0(th) * r0(th)), t0, t1, 1e-12);
  const nested = nqDoublePolar(() => 1, t0, t1, r0, r1, 5, 14);
  /* the crossing check has to happen after the two integrals, because `neg` is
     only set once the radius functions have actually been called */
  let crossed = false;
  for(let i = 0; i <= 360; i++){
    const th = t0 + (t1 - t0) * i / 360;
    if(r0(th) > r1(th) + 1e-12) crossed = true;
  }
  const made = { name:'your region  ' + own.r0 + ' ≤ r ≤ ' + own.r1,
    x0, x1, y0, y1, yLo:null, yHi:null, xLo:null, xHi:null,
    both:false, polar:{ t0, t1, r0, r1 },
    desc:'Your region, swept by wedges. Its area was computed twice by routes with nothing in common: the ' +
      'sector formula ½∫(r₁² − r₀²) dθ gives ' + fmtNum(sector, 8) + ', and the nested r-then-θ quadrature ' +
      'the stage uses for every other integral gives ' + fmtNum(nested, 8) + ' — a difference of ' +
      fmtNum(Math.abs(sector - nested), 3) + '. Agreement to that many figures is the evidence that the ' +
      'r dr dθ element is being applied correctly; it is not asserted anywhere.' +
      (crossed ? ' <b>Note:</b> your inner radius exceeds the outer one at some angles, so the region is empty there and those wedges contribute nothing.' : '') +
      (neg ? ' <b>Note:</b> your r(θ) goes negative somewhere. A negative radius draws the curve reflected through the origin rather than bounding a region, so it has been clamped at zero — which is why the picture may not match the curve you had in mind.' : '') };
  if(IG_REG_CACHE.size > 16) IG_REG_CACHE.clear();
  IG_REG_CACHE.set(ck, made);
  return made;
}

/* The Cartesian kinds. `both` builds each description separately and then
   differences the two iterated integrals of the constant 1 — which is Fubini
   applied to the area, and is the one number on the panel that says whether the
   two things the reader typed are descriptions of the SAME region.

   A gap here has two possible causes and telling them apart is the whole value
   of the check: quadrature, which shrinks when the panel count is raised, and a
   genuine mismatch, which does not. `igFubiniConverge` refines and reports
   which, so the panel can say "these disagree because one of them is wrong"
   rather than leaving a number hanging. */
function igRegCartesian(st, own, kind){
  const ck = [kind, own.gLo, own.gHi, own.a, own.b, own.hLo, own.hHi, own.c, own.d].join(' | ');
  const hit = IG_REG_CACHE.get(ck);
  if(hit) return hit;
  const gLo = pkFn(st, 'igreg', 'gLo'), gHi = pkFn(st, 'igreg', 'gHi');
  const hLo = pkFn(st, 'igreg', 'hLo'), hHi = pkFn(st, 'igreg', 'hHi');
  const RI  = igTypeIRegion(+own.a, +own.b, x => gLo(x, 0, 0), x => gHi(x, 0, 0),
                            'your region  ' + own.gLo + ' ≤ y ≤ ' + own.gHi);
  const RII = igTypeIIRegion(+own.c, +own.d, y => hLo(0, y, 0), y => hHi(0, y, 0),
                             'your region  ' + own.hLo + ' ≤ x ≤ ' + own.hHi);
  let made;
  if(kind === 'I')  made = RI;
  else if(kind === 'II') made = RII;
  else {
    /* both descriptions of one region: the union of the two boxes, and every
       limit function carried, so the stage can integrate it either way */
    const F = igFubini(RI, RII, () => 1);
    const CV = igFubiniConverge(RI, RII, () => 1);
    /* x0/x1 must stay the Type I OUTER LIMITS and y0/y1 the Type II ones —
       these fields are integration bounds, not a bounding box, and taking the
       union of the two boxes integrated the region over [−0.241, 2.241] and
       reported an area of 1.4596 for a region whose area is 4/3. */
    made = { kind:'both', name:'your region, described both ways',
      x0:RI.x0, x1:RI.x1, y0:RII.y0, y1:RII.y1,
      yLo:RI.yLo, yHi:RI.yHi, xLo:RII.xLo, xHi:RII.xHi, both:true,
      flipped:RI.flipped || RII.flipped, bad:RI.bad + RII.bad,
      fubini:F, converge:CV,
      desc:'You have given the same region twice. Its area comes out ' + fmtNum(F.I, 8) +
        ' sweeping vertical strips and ' + fmtNum(F.II, 8) + ' sweeping horizontal ones, a difference of ' +
        fmtSig(F.gap, 4) + '. ' + (CV.falling
          ? 'Refining the quadrature drives that difference down by a factor of ' + fmtNum(CV.ratio, 1) +
            ', so it is arithmetic rather than a mismatch — Fubini holding, measured.'
          : 'Refining the quadrature does <b>not</b> reduce it, which means the two descriptions are not of the same region. One of the four limits is wrong.') };
  }
  if(made.flipped)
    made.desc += ' <b>Note:</b> one of your limits is larger than the other over part of the range, so they were swapped — the integral is over the region between them either way, and comes out positive.';
  if(made.bad)
    made.desc += ' <b>Note:</b> a limit function returned a non-finite value at ' + made.bad +
      ' of the sample points and was read as zero there. <b>max(0, …)</b> around a square root is usually what is wanted.';
  if(IG_REG_CACHE.size > 16) IG_REG_CACHE.clear();
  IG_REG_CACHE.set(ck, made);
  return made;
}

/* The chosen order has to be one the region can actually supply. A typed Type I
   region has no Type II description and vice versa, and an order left over from
   a previous choice would ask `igRegionIntegral` for a null limit function —
   which returns NaN and prints it. This is the one place the two are
   reconciled, and every path that can change either calls it. */
function igRegFixOrder(st){
  const R = igRegCur(st);
  if((st.order === 'dydx' && R.yLo) || (st.order === 'dxdy' && R.xLo) ||
     (st.order === 'polar' && R.polar)) return;
  st.order = R.yLo ? 'dydx' : R.xLo ? 'dxdy' : 'polar';
}

/* ---- your own solid ---------------------------------------------------------
   A z-simple solid is four functions and two numbers: x between two constants,
   y between two functions of x, z between two functions of x and y. That is
   exactly the shape every Cartesian preset here already has, so a typed one
   drops into the same code path.

   Every preset also carries `exactVol`, because its author knew the answer in
   closed form. A typed solid has no closed form to quote and the house rule
   forbids inventing one — so the second opinion is a Monte Carlo estimate,
   which asks only "is this point inside?" and never sees the limit functions at
   all. It is a genuinely independent check on whether the limits describe the
   solid intended, which is the one thing that actually goes wrong here; and
   because it converges only as 1/√N it is labelled as an estimate rather than
   printed as though it were exact. */
const IG_SOL_OWN = [{ k:'zHi', label:'z up to', vars:'x, y', def:'4 - x^2 - y^2' },
                    { k:'zLo', label:'z from', vars:'x, y', def:'0' },
                    { k:'yHi', label:'y up to', vars:'x', def:'sqrt(max(0, 4 - x^2))' },
                    { k:'yLo', label:'y from', vars:'x', def:'-sqrt(max(0, 4 - x^2))' }];
const IG_SOL_BOUNDS = [{ k:'x0', label:'x from', def:-2 }, { k:'x1', label:'x to', def:2 }];

/* the two curvilinear kinds. Their limit functions take two curvilinear
   coordinates, so each carries its own `build` that maps the pair onto the
   engine's first two slots — the same device `pkParamBuild` uses for t. */
const igCylBuild = s => { const g = compile(parse(igPairSrc(s, 'r', 't'))); return { f:(r, t) => g(r, t, 0) }; };
const igSphBuild = s => { const g = compile(parse(igPairSrc(s, 'phi', 't'))); return { f:(p, t) => g(p, t, 0) }; };
const IG_SOL_CYL_OWN = [
  { k:'crHi', label:'r out to',  vars:'θ, written t', def:'1', build:pkParamBuild },
  { k:'crLo', label:'r from',    vars:'θ, written t', def:'0', build:pkParamBuild },
  { k:'czHi', label:'z up to',   vars:'r and θ, written r and t', def:'2', build:igCylBuild },
  { k:'czLo', label:'z from',    vars:'r and θ, written r and t', def:'0', build:igCylBuild }];
const IG_SOL_CYL_BOUNDS = [{ k:'ct0', label:'θ from', def:0 }, { k:'ct1', label:'θ to', def:2 * Math.PI }];
const IG_SOL_SPH_OWN = [
  { k:'srHi', label:'ρ out to',  vars:'φ and θ, written phi and t', def:'2', build:igSphBuild },
  { k:'srLo', label:'ρ from',    vars:'φ and θ, written phi and t', def:'0', build:igSphBuild },
  { k:'spHi', label:'φ up to',   vars:'θ, written t', def:'pi/4', build:pkParamBuild },
  { k:'spLo', label:'φ from',    vars:'θ, written t', def:'0', build:pkParamBuild }];
const IG_SOL_SPH_BOUNDS = [{ k:'st0', label:'θ from', def:0 }, { k:'st1', label:'θ to', def:2 * Math.PI }];

const IG_SOL_ALL_OWN    = IG_SOL_OWN.concat(IG_SOL_CYL_OWN, IG_SOL_SPH_OWN);
const IG_SOL_ALL_BOUNDS = IG_SOL_BOUNDS.concat(IG_SOL_CYL_BOUNDS, IG_SOL_SPH_BOUNDS);
const igSolKind = st => (st.solKind || 'z');
function igSolSlots(st){
  const k = igSolKind(st);
  return k === 'cyl' ? IG_SOL_CYL_OWN : k === 'sph' ? IG_SOL_SPH_OWN : IG_SOL_OWN;
}
function igSolBounds(st){
  const k = igSolKind(st);
  return k === 'cyl' ? IG_SOL_CYL_BOUNDS : k === 'sph' ? IG_SOL_SPH_BOUNDS : IG_SOL_BOUNDS;
}
/* the Monte Carlo second opinion, shared by all three kinds: throw points into
   the bounding box and ask only "is this one inside?" — which never looks at
   the limit functions the way the iterated integral does */
function igSolidMC(box, inside, N){
  /* `igRandStream`, not the `seed * 1103515245 & 0x7fffffff` LCG the older
     solids use: that product exceeds 2^53 and loses its low bits to floating
     point, so the stream is measurably worse than uniform and the estimate sat
     four standard errors from the truth on a case whose answer is known. */
  const rnd = igRandStream(987654321);
  const n = N || 120000;
  let hits = 0;
  for(let i = 0; i < n; i++){
    const x = box.x0 + (box.x1 - box.x0) * rnd();
    const y = box.y0 + (box.y1 - box.y0) * rnd();
    const z = box.z0 + (box.z1 - box.z0) * rnd();
    if(inside(x, y, z)) hits++;
  }
  /* the estimate AND its own standard error, box·√(p(1−p)/N) — §2.1 says a
     difference is meaningless without its scale, and for a Monte Carlo route
     the scale is the 1/√N error bar, so it ships with the number */
  const boxV = (box.x1 - box.x0) * (box.y1 - box.y0) * (box.z1 - box.z0);
  const p = hits / n;
  return { v: p * boxV, se: boxV * Math.sqrt(Math.max(0, p * (1 - p)) / n) };
}

const IG_SOL_CACHE = new Map();
function igSolidCur(st){
  if(st.solid !== 'custom') return IG_SOLIDS[st.solid];
  const own = pkOwn(st, 'igsol', IG_SOL_ALL_OWN, IG_SOL_ALL_BOUNDS);
  const kind = igSolKind(st);
  if(kind !== 'z') return igSolidCurv(st, own, kind);
  const ck = [own.zHi, own.zLo, own.yHi, own.yLo, own.x0, own.x1].join(' | ');
  const hit = IG_SOL_CACHE.get(ck);
  if(hit) return hit;
  const gz1 = pkFn(st, 'igsol', 'zHi'), gz0 = pkFn(st, 'igsol', 'zLo');
  const gy1 = pkFn(st, 'igsol', 'yHi'), gy0 = pkFn(st, 'igsol', 'yLo');
  const fin = (v, d) => Number.isFinite(v) ? v : d;
  const zHi = (x, y) => fin(gz1(x, y), 0), zLo = (x, y) => fin(gz0(x, y), 0);
  const yHi = x => fin(gy1(x, 0), 0), yLo = x => fin(gy0(x, 0), 0);
  const x0 = +own.x0, x1 = +own.x1;
  /* the bounding box, measured over the base */
  let ylo = Infinity, yhi = -Infinity, zlo = Infinity, zhi = -Infinity;
  for(let i = 0; i <= 40; i++){
    const x = x0 + (x1 - x0) * i / 40, a = yLo(x), b = yHi(x);
    ylo = Math.min(ylo, a, b); yhi = Math.max(yhi, a, b);
    for(let j = 0; j <= 40; j++){
      const y = Math.min(a, b) + Math.abs(b - a) * j / 40;
      zlo = Math.min(zlo, zLo(x, y), zHi(x, y)); zhi = Math.max(zhi, zLo(x, y), zHi(x, y));
    }
  }
  if(!Number.isFinite(ylo)){ ylo = -1; yhi = 1; }
  if(!Number.isFinite(zlo)){ zlo = 0; zhi = 1; }
  if(zhi - zlo < 1e-12) zhi = zlo + 1;
  if(yhi - ylo < 1e-12) yhi = ylo + 1;
  /* Monte Carlo, with a fixed seed so the number does not shimmer from one
     refresh to the next — a readout that changes when nothing was changed
     teaches the reader to distrust all of it */
  let seed = 987654321;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const N = 120000;
  let inside = 0;
  for(let i = 0; i < N; i++){
    const x = x0 + (x1 - x0) * rnd(), y = ylo + (yhi - ylo) * rnd(), z = zlo + (zhi - zlo) * rnd();
    const a = yLo(x), b = yHi(x);
    if(y < Math.min(a, b) || y > Math.max(a, b)) continue;
    const c = zLo(x, y), d = zHi(x, y);
    if(z < Math.min(c, d) || z > Math.max(c, d)) continue;
    inside++;
  }
  const boxV = Math.abs(x1 - x0) * (yhi - ylo) * (zhi - zlo);
  const p = inside / N;
  const mc = p * boxV;
  const mcSe = boxV * Math.sqrt(Math.max(0, p * (1 - p)) / N);
  const made = { name:'your solid  ' + own.zLo + ' ≤ z ≤ ' + own.zHi,
    region:null, x0, x1, yLo, yHi, zLo, zHi,
    exactVol:mc, mcSe,
    exactLabel:'by Monte Carlo, 120 000 darts (± ' + fmtSig(mcSe, 2) + ')',
    note:'Your solid, described the way every Cartesian solid on this stage is: x between two numbers, ' +
      'y between two functions of x, z between two functions of x and y. There is no closed-form volume ' +
      'to compare against, so the second number is a Monte Carlo estimate — 120 000 points thrown into ' +
      'the bounding box, counting how many land inside. It never looks at the limit functions the way the ' +
      'iterated integral does, so agreement between the two is real evidence that the limits describe the ' +
      'solid you meant. Monte Carlo converges as 1/√N, so expect three figures rather than eight; a ' +
      'disagreement in the fourth digit is the method, and a disagreement in the first is a wrong limit.' };
  if(IG_SOL_CACHE.size > 12) IG_SOL_CACHE.clear();
  IG_SOL_CACHE.set(ck, made);
  return made;
}

/* ---- your own solid, in cylindrical or spherical coordinates -----------------
   A z-simple description can only ever be a solid whose shadow is a Type I
   region, which is most of them and not all of them: an ice-cream cone bounded
   by φ ≤ π/4 has no such description at all, and the presets that need one
   carry a hand-written `sph` block. A reader was offered the presets and not
   the description.

   Both kinds produce exactly the block shape the stage already consumes — `cyl`
   or `sph` with its six limits — so `igTriple` needs only to be told they exist.
   The Monte Carlo second opinion is the same one the z-simple kind gets, with a
   membership test written in the matching coordinates. */
function igSolidCurv(st, own, kind){
  const ck = [kind, own.crHi, own.crLo, own.czHi, own.czLo, own.ct0, own.ct1,
              own.srHi, own.srLo, own.spHi, own.spLo, own.st0, own.st1].join(' | ');
  const hit = IG_SOL_CACHE.get(ck);
  if(hit) return hit;
  let made;
  if(kind === 'cyl'){
    const r1 = pkParamFn(own.crHi), r0 = pkParamFn(own.crLo);
    const z1 = pkFn(st, 'igsol', 'czHi'), z0 = pkFn(st, 'igsol', 'czLo');
    const S = igCylSolid(+own.ct0, +own.ct1, th => r0(th, 1), th => r1(th, 1),
                         (r, th) => z0(r, th, 0), (r, th) => z1(r, th, 0));
    const inside = (x, y, z) => {
      const r = Math.hypot(x, y);
      let th = Math.atan2(y, x);
      if(th < S.cyl.t0) th += 2 * Math.PI;
      if(th < S.cyl.t0 - 1e-12 || th > S.cyl.t1 + 1e-12) return false;
      if(r < S.cyl.r0(th) - 1e-12 || r > S.cyl.r1(th) + 1e-12) return false;
      return z >= S.cyl.zLo(r, th) - 1e-12 && z <= S.cyl.zHi(r, th) + 1e-12;
    };
    const mcC = igSolidMC(S, inside);
    made = { name:'your cylindrical solid  ' + own.crLo + ' ≤ r ≤ ' + own.crHi,
      region:null, cyl:S.cyl, x0:S.x0, x1:S.x1, y0:S.y0, y1:S.y1, z0:S.z0, z1:S.z1,
      exactVol:mcC.v, mcSe:mcC.se,
      exactLabel:'by Monte Carlo, 120 000 darts (± ' + fmtSig(mcC.se, 2) + ')',
      inside,
      note:'Your solid in cylindrical coordinates: θ between the two numbers, r between two functions of θ, ' +
        'and z between two functions of r and θ. The volume element is <b>r dz dr dθ</b> — the polar element ' +
        'in the plane with z carried along unchanged, which is exactly why the system suits anything with an ' +
        'axis. There is no closed form to compare against, so the second number is a Monte Carlo estimate ' +
        'that never sees the limit functions; agreement is evidence that they describe the solid you meant.' };
  } else {
    const R1 = pkFn(st, 'igsol', 'srHi'), R0 = pkFn(st, 'igsol', 'srLo');
    const p1 = pkParamFn(own.spHi), p0 = pkParamFn(own.spLo);
    const S = igSphSolid(+own.st0, +own.st1, th => p0(th, 1), th => p1(th, 1),
                         (ph, th) => R0(ph, th, 0), (ph, th) => R1(ph, th, 0));
    const inside = (x, y, z) => {
      const rho = Math.hypot(x, y, z);
      if(rho < 1e-12) return S.sph.r0(0, S.sph.t0) <= 1e-12;
      const ph = Math.atan2(Math.hypot(x, y), z);
      let th = Math.atan2(y, x);
      if(th < S.sph.t0) th += 2 * Math.PI;
      if(th < S.sph.t0 - 1e-12 || th > S.sph.t1 + 1e-12) return false;
      if(ph < S.sph.p0(th) - 1e-12 || ph > S.sph.p1(th) + 1e-12) return false;
      return rho >= S.sph.r0(ph, th) - 1e-12 && rho <= S.sph.r1(ph, th) + 1e-12;
    };
    const mcS = igSolidMC(S, inside);
    made = { name:'your spherical solid  ' + own.srLo + ' ≤ ρ ≤ ' + own.srHi,
      region:null, sph:S.sph, x0:S.x0, x1:S.x1, y0:S.y0, y1:S.y1, z0:S.z0, z1:S.z1,
      exactVol:mcS.v, mcSe:mcS.se,
      exactLabel:'by Monte Carlo, 120 000 darts (± ' + fmtSig(mcS.se, 2) + ')',
      inside,
      note:'Your solid in spherical coordinates: θ between the two numbers, φ between two functions of θ, ' +
        'and ρ between two functions of φ and θ. The volume element is <b>ρ² sin φ dρ dφ dθ</b>, and both ' +
        'factors earn their place — the ρ² is the shell area growing as the square of the radius, and the ' +
        'sin φ is the shrinking of the circles of latitude towards the poles. Leave the defaults and you ' +
        'have an ice-cream cone; set φ up to <b>pi</b> and you have a ball. The second number is a Monte ' +
        'Carlo estimate that never sees the limit functions.' };
  }
  if(IG_SOL_CACHE.size > 12) IG_SOL_CACHE.clear();
  IG_SOL_CACHE.set(ck, made);
  return made;
}

/* ---- your own worldline, and your own chain of boosts ------------------------
   Programme A items 10 and 11. Both are shaped so that everything the stage
   used to read off a preset it now reads off `rlWlCur(st)` / the parsed sheet,
   and nothing downstream knows which it is looking at. */
const RL_WL_SLOTS  = [{ k:'x', label:'x(t) =', vars:'t — and c = 1 here, so |dx/dt| must stay under 1',
                        def:'0.35*t + 0.3*sin(2*t)', build:pkParamBuild }];
const RL_WL_BOUNDS = [{ k:'t0', label:'from t =', def:0 },
                      { k:'t1', label:'to t =', def:4 }];
function rlWlCur(st){
  if(st.wkey !== 'custom') return RL_WORLDLINES[st.wkey] || RL_WORLDLINES.shuttle;
  const own = pkOwn(st, 'rlwl', RL_WL_SLOTS, RL_WL_BOUNDS);
  return { name:'your worldline', short:'yours', own:true,
           src:own.x, ex:'x(t) = ' + pkPretty(own.x),
           t0:+own.t0, t1:+own.t1,
           vmax:null, tau:null,
           why:'Your worldline. Nothing about it is assumed — the top speed is <b>scanned</b> for and ' +
                'refused if it reaches c, the proper time is integrated rather than looked up, and the ' +
                'moving observer re-measures it from the boosted events alone. The one thing that cannot ' +
                'be typed around is the reverse triangle inequality: whatever you write, the straight ' +
                'worldline between your two endpoints ages more.' };
}

/* ---- your own electromagnetic field, and your own field tensor ---------------
   Programme A relativity items 7 and 8. Both return an object shaped like one
   of the wing's own table entries, so the stages read `rlEbCur(st)` /
   `rlTnCur(st)` and nothing downstream knows which it is looking at. */
const RL_EB_BOUNDS = [{ k:'Ex', label:'Eₓ =', def:0 }, { k:'Ey', label:'E_y =', def:1 },
                      { k:'Ez', label:'E_z =', def:0 },
                      { k:'Bx', label:'Bₓ =', def:0 }, { k:'By', label:'B_y =', def:0 },
                      { k:'Bz', label:'B_z =', def:0.5 }];
function rlEbCur(st){
  if(st.fkey !== 'custom'){
    const P = RL_FIELDS[st.fkey] || RL_FIELDS.pureE;
    return { name:P.name, short:P.short, E:rlFieldVec(P.E), B:rlFieldVec(P.B),
             character:P.character, removes:P.removes, why:P.why };
  }
  const own = pkOwn(st, 'rleb', [], RL_EB_BOUNDS);
  return { name:'your own field', short:'yours', own:true,
           E:v3(+own.Ex, +own.Ey, +own.Ez), B:v3(+own.Bx, +own.By, +own.Bz),
           character:null, removes:null,
           why:'Your six numbers. Nothing about them is assumed: the two invariants are computed, ' +
                'the field is <b>classified from them</b>, and then the panel goes to the frame that ' +
                'classification promises and measures what is left there. Set E·B ≠ 0 and no frame ' +
                'removes either field — but one still makes them parallel, and that one is found too.' };
}

const RL_TN_SHEET = '0 -0.4 -0.9 -0.2\n0.4 0 -0.7 0.5\n0.9 0.7 0 -0.3\n0.2 -0.5 0.3 0';
function rlTnCur(st){
  if(st.tkey !== 'custom'){
    const P = RL_TENSORS[st.tkey] || RL_TENSORS.general;
    const R = rlTensorParse(P.text, null);
    return { name:P.name, short:P.short, F:R.F, errs:R.errs, anti:P.anti, why:P.why };
  }
  const R = rlTensorParse(st.tsheet === undefined ? RL_TN_SHEET : st.tsheet,
                          rlTensorParse(RL_TN_SHEET, null).F);
  return { name:'your own tensor', short:'yours', own:true, F:R.F, errs:R.errs, anti:null,
           why:'Your sixteen numbers. <b>Antisymmetry is measured rather than imposed</b> — type ' +
                'something that is not antisymmetric and the panel says so and says where, because a ' +
                'symmetric part is not a field at all and silently deleting it would teach the ' +
                'opposite of the lesson.' };
}

/* ---- your own charge configuration, and your own wire ------------------------
   Programme A relativity items 6 and 9. */
const RL_Q_SHEET = '1 0 0 0 0.9';
function rlQCur(st){
  const P = st.qkey !== 'custom' ? RL_CHARGES[st.qkey] : null;
  const text = st.qkey === 'custom' ? (st.qsheet === undefined ? RL_Q_SHEET : st.qsheet)
                                    : (P || RL_CHARGES.one).text;
  const R = rlChargeParse(text, rlChargeParse(RL_Q_SHEET, null).charges);
  if(P) return { name:P.name, short:P.short, charges:R.charges, errs:R.errs,
                 cx:P.cx, cy:P.cy, cz:P.cz, R:P.R, enc:P.enc, why:P.why };
  return { name:'your own charges', short:'yours', own:true, charges:R.charges, errs:R.errs,
           cx:+ (st.qcx === undefined ? 0 : st.qcx), cy:0, cz:0,
           R:+ (st.qR === undefined ? 2 : st.qR), enc:null,
           why:'One charge per line: <b>q x y z</b>, or <b>q x y z β</b> to send it along x. ' +
                'The flux is integrated over the sphere you set, and it must come to <b>4πq</b> for ' +
                'whatever charge is <i>inside</i> — no matter how fast anything is moving, and no ' +
                'matter how badly the field is distorted on the way.' };
}

const RL_W_SHEET = '1 0 lattice\n-1 0.5 electrons';
function rlWCur(st){
  const P = st.wkeyw !== 'custom' ? RL_WIRES[st.wkeyw] : null;
  const text = st.wkeyw === 'custom' ? (st.wsheet === undefined ? RL_W_SHEET : st.wsheet)
                                     : (P || RL_WIRES.neutral).text;
  const R = rlWireParse(text, rlWireParse(RL_W_SHEET, null).species);
  if(P) return { name:P.name, short:P.short, species:R.species, errs:R.errs,
                 vt:P.vt, neutral:P.neutral, why:P.why };
  return { name:'your own wire', short:'yours', own:true, species:R.species, errs:R.errs,
           vt:+ (st.wvt === undefined ? 0.4 : st.wvt), neutral:null,
           why:'One carrier species per line: a <b>lab</b> linear density and a drift speed. ' +
                'Neutrality is whatever your densities sum to — it is measured, not assumed — so a ' +
                'wire that is charged in the lab is a legal thing to build, and the two frames still agree.' };
}

/* ---- your own motion programme ----------------------------------------------
   Programme A relativity items 12 and 13. Both stages read this; the `pk` id is
   passed in so the two keep separate answers, and the state keys are prefixed
   for the same reason — one dock, one document, and `auditlink` fails on a
   duplicate id. */
const RL_MOT_SLOTS = [{ k:'a', label:'a(τ) =',
                        vars:'τ, written as t — your own clock, in years; a is in ly/yr², and one g is 1.0323',
                        def:'1.0323*cos(t/2)', build:pkParamBuild }];
const RL_MOT_BOUNDS = [{ k:'tau1', label:'for τ up to', def:8 }];
function rlMotCur(st, pre){
  const key = st[pre + 'key'];
  if(key !== 'custom'){
    const P = RL_MOTIONS[key] || RL_MOTIONS.oneg;
    return { name:P.name, short:P.short, src:P.src, ex:P.ex, tau1:P.tau1,
             t:P.t, x:P.x, phi:P.phi, why:P.why };
  }
  const own = pkOwn(st, pre, RL_MOT_SLOTS, RL_MOT_BOUNDS);
  return { name:'your own programme', short:'yours', own:true,
           src:own.a, ex:'a(τ) = ' + pkPretty(own.a), tau1:+own.tau1,
           t:null, x:null, phi:null,
           why:'Your engine, as a function of <b>your own clock</b>. What it delivers is <b>rapidity</b> ' +
                '— dφ/dτ = a exactly — so the final speed is tanh of the area under whatever you write, ' +
                'and no amount of area reaches c. Nothing here divides by 1 − β², so a programme that ' +
                'gets to 0.999999999c is no harder to integrate than one that dawdles.' };
}

/* ---- the last three thought experiments -------------------------------------
   Programme A relativity items 16, 20 and 21. Numbers rather than expressions,
   because in all three the scenario IS the numbers — and each carries a theorem
   the panel then goes and tests. */
const RL_BARN_BOUNDS = [{ k:'L', label:'ladder length', def:2 },
                        { k:'B', label:'barn length', def:1.2 },
                        { k:'bt', label:'β', def:0.8 }];
function rlBarnCur(st){
  if(st.bkey !== 'custom'){
    const P = RL_BARNS[st.bkey] || RL_BARNS.classic;
    return { name:P.name, short:P.short, L:P.L, B:P.B, beta:P.beta,
             fits:P.fits, doors:P.doors, why:P.why };
  }
  const own = pkOwn(st, 'rlbarn', [], RL_BARN_BOUNDS);
  return { name:'your own ladder and barn', short:'yours', own:true,
           L:+own.L, B:+own.B, beta:+own.bt, fits:null, doors:null,
           why:'Whether it fits is a statement about the <b>barn frame</b>, and whether anyone can ' +
                'disagree about the order of the two door-closings is a condition on your three ' +
                'numbers: they are reorderable exactly when L/γ > B(1−β). Find the case where the two ' +
                'closings are on each other\'s light cone.' };
}

const RL_ELEV_BOUNDS = [{ k:'a', label:'acceleration a', def:0.4 },
                        { k:'w', label:'box width', def:0.5 },
                        { k:'h', label:'box height', def:0.5 }];
function rlElevCur(st){
  if(st.gkey !== 'custom'){
    const P = RL_ELEVATORS[st.gkey] || RL_ELEVATORS.strong;
    return { name:P.name, short:P.short, a:P.a, w:P.w, h:P.h, why:P.why };
  }
  const own = pkOwn(st, 'rlelev', [], RL_ELEV_BOUNDS);
  return { name:'your own box', short:'yours', own:true,
           a:+own.a, w:+own.w, h:+own.h,
           why:'The equivalence principle says a box accelerating at <b>a</b> and a uniform field of ' +
                'strength <b>a</b> are indistinguishable from inside. The panel computes the light ' +
                'deflection in the box by <b>integrating</b> the floor\'s rise, and in the field from ' +
                'the closed form — two different calculations that must land on the same number.' };
}

const RL_DISK_BOUNDS = [{ k:'R', label:'radius R', def:1 },
                        { k:'om', label:'ω', def:0.5 },
                        { k:'ell', label:'ruler length', def:0.01 }];
function rlDiskCur(st){
  if(st.dkey !== 'custom'){
    const P = RL_DISKS[st.dkey] || RL_DISKS.fast;
    return { name:P.name, short:P.short, R:P.R, omega:P.omega, ell:P.ell, why:P.why };
  }
  const own = pkOwn(st, 'rldisk', [], RL_DISK_BOUNDS);
  return { name:'your own disk', short:'yours', own:true,
           R:+own.R, omega:+own.om, ell:+own.ell,
           why:'C/2R is computed two ways: the closed form πγ, and a <b>count</b> — how many contracted ' +
                'rulers of your length it takes to get round the rim. The count is what a surveyor on ' +
                'the disk would actually do, and shrinking the rulers is what makes the two agree.' };
}
