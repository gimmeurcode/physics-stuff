/* ============================================================================
   1j · SEQUENCES AND SERIES  (AP Calculus BC unit 10)
   Partial sums, the convergence tests and what each one can and cannot decide,
   alternating series with their error bound, power series and their interval of
   convergence, and Taylor polynomials with the Lagrange remainder.

   Every test here is *run*, not looked up: the ratio test computes the actual
   limit of |aₙ₊₁/aₙ| from the terms, and the error bounds are compared against
   the errors that actually occur.
   ============================================================================ */

/* ------------------------------------------------------------- sequences ---- */
const SR_SEQ = {
  recip:  { name:'aₙ = 1/n',            f:n => 1 / n,                 limit:0, mono:'decreasing', bounded:true,
    note:'Decreasing and bounded below by 0, so it converges — and it converges to 0. That the <i>terms</i> go to zero says nothing about whether their sum does; the harmonic series is the standing warning.' },
  alt:    { name:'aₙ = (−1)ⁿ',          f:n => Math.pow(-1, n),       limit:NaN, mono:'neither', bounded:true,
    note:'Bounded but not monotone, and it does not converge: it has two limit points. Boundedness alone is never enough.' },
  ratio:  { name:'aₙ = n/(n+1)',        f:n => n / (n + 1),           limit:1, mono:'increasing', bounded:true,
    note:'Increasing and bounded above by 1 — the monotone convergence theorem guarantees a limit without ever telling you what it is. Here it is 1, but the theorem\'s power is that it works when you cannot compute the limit.' },
  fact:   { name:'aₙ = 2ⁿ/n!',          f:n => { let v = 1; for(let k = 1; k <= n; k++) v *= 2 / k; return v; }, limit:0, mono:'eventually decreasing', bounded:true,
    note:'Factorials beat exponentials, always and eventually. Past n = 2 every new factor 2/k is less than one, so the sequence collapses to zero faster than any geometric.' },
  root:   { name:'aₙ = n^(1/n)',        f:n => Math.pow(n, 1 / n),    limit:1, mono:'eventually decreasing', bounded:true,
    note:'It rises to a maximum at n = 3 and then falls to 1. The root test leans on this limit constantly, and it is why a polynomial factor never changes a root-test verdict.' },
  osc:    { name:'aₙ = sin(n)',         f:n => Math.sin(n),           limit:NaN, mono:'neither', bounded:true,
    note:'Bounded, never repeating, dense in [−1,1] because π is irrational. It has no limit and no periodicity — a sequence can be perfectly deterministic and still refuse to settle.' }
};

/* ---------------------------------------------------------------- series ---- */
/* Each entry gives the term, the exact sum where one exists, and which tests
   settle it — so the stage can show a test succeeding *and* a test failing. */
const SR_SERIES = {
  geo:    { name:'Σ (1/2)ⁿ  from n = 0', term:n => Math.pow(0.5, n), sum:2, converges:true,
    kind:'geometric', r:0.5,
    note:'The one series whose partial sums have a closed form: <b>Sₙ = (1−rⁿ⁺¹)/(1−r)</b>. It converges exactly when |r| &lt; 1, and it is the yardstick every comparison test measures against.' },
  geodiv: { name:'Σ (3/2)ⁿ', term:n => Math.pow(1.5, n), sum:NaN, converges:false,
    kind:'geometric', r:1.5,
    note:'|r| ≥ 1, so the terms themselves grow without bound. The nth-term test alone kills it.' },
  harm:   { name:'Σ 1/n  (harmonic)', term:n => 1 / n, sum:Infinity, converges:false,
    kind:'p-series', p:1,
    note:'The terms go to zero and the sum still diverges — the single most important counterexample in the subject. Grouping 1/3+1/4 &gt; 1/2, then 1/5+…+1/8 &gt; 1/2, and so on adds another ½ forever. It diverges like ln n, so slowly that the first 10⁴³ terms sum to under 100.' },
  p2:     { name:'Σ 1/n²', term:n => 1 / (n * n), sum:Math.PI * Math.PI / 6, converges:true,
    kind:'p-series', p:2,
    note:'The Basel problem: Euler found the sum to be π²/6 in 1735, which nobody had expected a π to appear in. Any p &gt; 1 converges and any p ≤ 1 diverges, and the integral test is what draws that line.' },
  p05:    { name:'Σ 1/√n', term:n => 1 / Math.sqrt(n), sum:Infinity, converges:false,
    kind:'p-series', p:0.5,
    note:'p = ½ ≤ 1, so it diverges — more slowly than the harmonic series, but just as surely. The integral ∫dx/√x = 2√x grows without bound.' },
  alt:    { name:'Σ (−1)ⁿ⁺¹/n', term:n => Math.pow(-1, n + 1) / n, sum:Math.LN2, converges:true,
    kind:'alternating', abs:false,
    note:'<b>Conditionally</b> convergent: it converges to ln 2, but the series of absolute values is the harmonic series and diverges. Riemann proved such a series can be rearranged to sum to <i>any</i> number you like — convergence that depends on the order is a fragile thing.' },
  altsq:  { name:'Σ (−1)ⁿ⁺¹/n²', term:n => Math.pow(-1, n + 1) / (n * n), sum:Math.PI * Math.PI / 12, converges:true,
    kind:'alternating', abs:true,
    note:'<b>Absolutely</b> convergent, since Σ1/n² converges. Absolute convergence is the robust kind: rearrange it however you like and the sum does not move.' },
  tele:   { name:'Σ 1/(n(n+1))  (telescoping)', term:n => 1 / (n * (n + 1)), sum:1, converges:true,
    kind:'telescoping',
    note:'Split into 1/n − 1/(n+1) and almost everything cancels: <b>Sₙ = 1 − 1/(n+1)</b>. Along with the geometric series this is the other case where the partial sum is available in closed form.' },
  nfact:  { name:'Σ 1/n!', term:n => { let v = 1; for(let k = 1; k <= n; k++) v /= k; return v; }, sum:Math.E - 1, converges:true,
    kind:'ratio',
    note:'The ratio test gives a limit of 0, which is decisive convergence with room to spare. Adding the n = 0 term makes the sum exactly <b>e</b> — the Maclaurin series for eˣ at x = 1.' },
  nover2: { name:'Σ n/2ⁿ', term:n => n / Math.pow(2, n), sum:2, converges:true,
    kind:'ratio',
    note:'The ratio test gives ½: the geometric decay beats the linear growth easily. Differentiating the geometric series is where the closed form 2 comes from.' },
  lnn:    { name:'Σ 1/(n ln n)  from n = 2', term:n => 1 / (n * Math.log(n)), sum:Infinity, converges:false,
    kind:'integral',
    note:'The ratio and root tests both return 1 and say nothing. The integral test settles it: ∫dx/(x ln x) = ln(ln x), which still diverges — just barely, and unbelievably slowly.' }
};

/* the partial sums, kept as an array so the stage can draw them converging */
function srPartials(term, N, from){
  const start = from === undefined ? 1 : from;
  const out = new Float64Array(N + 1);
  let s = 0;
  for(let n = 0; n <= N; n++){
    const t = term(n + start);
    if(Number.isFinite(t)) s += t;
    out[n] = s;
  }
  return out;
}
/* the nth-term test: the only test that can prove divergence on its own, and
   the only one students routinely misuse in the other direction */
/* Comparing |aₙ| at n and 2n rather than testing a single term against a fixed
   threshold: the harmonic series still has terms of 2.5×10⁻⁴ at n = 4000 and a
   naive threshold would convict it, which is the one verdict this test must
   never return. What matters is whether the terms are still shrinking. */
function srNthTerm(term, N){
  const n = Math.max(4, N || 400);
  const a = Math.abs(term(n)), b = Math.abs(term(2 * n));
  const grows = !Number.isFinite(b) || b > a * 1.0001;
  const shrinks = b < a * 0.75 || b < 1e-9;
  const diverges = grows || (!shrinks && b > 1e-3);
  return { limit:b, prev:a, diverges, verdict:diverges
    ? 'the terms do not go to zero — the series diverges'
    : 'the terms go to zero — the test is inconclusive, and says nothing either way' };
}
/* the ratio and root tests, with the limit measured from the actual terms */
function srRatio(term, N){
  const n = N || 800;
  const a = Math.abs(term(n)), b = Math.abs(term(n + 1));
  const L = a > 0 ? b / a : NaN;
  return { L, verdict: !Number.isFinite(L) ? 'undetermined'
    : L < 0.999 ? 'L < 1 — converges absolutely'
    : L > 1.001 ? 'L > 1 — diverges'
    : 'L = 1 — inconclusive, the test cannot decide' };
}
function srRoot(term, N){
  const n = N || 800;
  const L = Math.pow(Math.abs(term(n)), 1 / n);
  return { L, verdict: !Number.isFinite(L) ? 'undetermined'
    : L < 0.999 ? 'L < 1 — converges absolutely'
    : L > 1.001 ? 'L > 1 — diverges'
    : 'L = 1 — inconclusive' };
}
/* The integral test, run as a genuine improper integral: integrate to a finite
   cut-off and let the cut-off grow.

   The obvious route — substituting x = a + t/(1−t) to map infinity onto a finite
   endpoint — is a trap. It turns a logarithmic divergence into an integrable-
   looking singularity that the quadrature quietly truncates, and Σ1/n comes back
   "convergent". The substitution used here is x = a·e^ᵗ, under which dx = x dt
   and the integrand for 1/x is exactly 1, so the divergence stays visible. */
function srIntegral(f, from){
  const a = from === undefined ? 1 : from;
  const upTo = R => nqAdaptive(t => {
    const x = a * Math.exp(t);
    const v = f(x);
    return Number.isFinite(v) ? v * x : 0;
  }, 0, Math.log(R / a), 1e-11);
  const I2 = upTo(a * 1e6), I3 = upTo(a * 1e9);
  const converges = Number.isFinite(I3) && Math.abs(I3 - I2) < 1e-3 * Math.max(1, Math.abs(I2));
  return { integral:converges ? I3 : Infinity, atCutoff:{ I2, I3 }, converges,
    verdict:converges
      ? 'the improper integral converges — so does the series'
      : 'the improper integral diverges — so does the series' };
}
/* the alternating series bound: the error after N terms is at most the first
   term you left out. The lab prints the bound beside the error that occurred. */
function srAltBound(term, N, exact){
  const S = srPartials(term, N)[N];
  return { partial:S, bound:Math.abs(term(N + 2)), error:Math.abs(S - exact),
    holds:Math.abs(S - exact) <= Math.abs(term(N + 2)) + 1e-12 };
}

/* --------------------------------------------------- Taylor & Maclaurin ---- */
/* Each entry supplies the coefficient pattern rather than the finished series,
   so the polynomial is *built* by the stage.

   The coefficient rule takes the centre. That is not decoration: a Taylor
   coefficient is f⁽ᵏ⁾(c)/k!, so it depends on c, and a rule that ignored the
   argument would hand back the coefficients about the origin while the stage
   raised (x − c) to the powers. The two together are not the Taylor polynomial
   of anything — for eˣ about c = 1 the degree-0 "polynomial" came out as 1
   rather than e. Every guided experiment centres at 0, where the error is
   invisible; the centre slider is the reader's, and it was not.

   `rad(c)` is the radius of convergence about c, which likewise moves: it is the
   distance from c to the nearest singularity in the complex plane. For arctan
   that is √(1+c²), the distance from c to ±i — a number with no explanation
   anywhere on the real line, which is exactly the point the wing makes. */
/* The derivatives of arctan, from the partial fractions of its derivative:
   1/(1+x²) = (1/2i)[1/(x−i) − 1/(x+i)], so differentiating n−1 more times and
   writing x + i = r e^(iφ) with r = √(1+x²) and φ = atan2(1, x) gives

       y⁽ⁿ⁾(x) = (−1)ⁿ⁻¹ (n−1)! sin(nφ) / rⁿ .

   The coefficient is that over n!, and the two factorials cancel to leave
   sin(nφ)/(n rⁿ) — which matters, because the recurrence route computes
   (n−1)!/n! as a ratio of two numbers that overflow past n ≈ 170, and the
   arctan series is the one the site sums to twenty thousand terms to show how
   slowly Leibniz's formula converges. */
function srAtanCoef(k, c){
  if(k === 0) return Math.atan(c);
  const r = Math.hypot(1, c), ph = Math.atan2(1, c);
  return Math.pow(-1, k - 1) * Math.sin(k * ph) / (k * Math.pow(r, k));
}
function srAtanDeriv(k, x){
  if(k === 0) return Math.atan(x);
  const r = Math.hypot(1, x), ph = Math.atan2(1, x);
  return Math.pow(-1, k - 1) * srFact(k - 1) * Math.sin(k * ph) / Math.pow(r, k);
}
/* the kth derivative of √(1+x): ∏(½ − i) · (1+x)^(½ − k) */
function srSqrtDeriv(k, x){
  let v = 1;
  for(let i = 0; i < k; i++) v *= (0.5 - i);
  return v * Math.pow(1 + x, 0.5 - k);
}
const SR_TAYLOR = {
  exp:   { name:'eˣ', f:Math.exp, c:0, R:'∞', rad:() => Infinity,
    coef:(k, c) => { let v = Math.exp(c || 0); for(let i = 1; i <= k; i++) v /= i; return v; },
    deriv:(k, x) => Math.exp(x),
    note:'Every derivative of eˣ is eˣ, so every coefficient is e^c/k!. It converges for all x — and the factorial in the denominator is what makes that possible, since it eventually beats any xᵏ.' },
  sin:   { name:'sin x', f:Math.sin, c:0, R:'∞', rad:() => Infinity,
    coef:(k, c) => { let v = Math.sin((c || 0) + k * Math.PI / 2); for(let i = 1; i <= k; i++) v /= i; return v; },
    deriv:(k, x) => Math.sin(x + k * Math.PI / 2),
    note:'Differentiating four times returns you to where you started, so the coefficients cycle. About the origin only odd powers survive, because sin is odd; move the centre and that sparsity disappears, which shows it was a fact about the centre rather than about the function.' },
  cos:   { name:'cos x', f:Math.cos, c:0, R:'∞', rad:() => Infinity,
    coef:(k, c) => { let v = Math.cos((c || 0) + k * Math.PI / 2); for(let i = 1; i <= k; i++) v /= i; return v; },
    deriv:(k, x) => Math.cos(x + k * Math.PI / 2),
    note:'Only even powers about the origin, because cos is even. Differentiating the sine series term by term gives exactly this — power series may be differentiated inside their interval of convergence, which is not true of series in general.' },
  geo:   { name:'1/(1 − x)', f:x => 1 / (1 - x), c:0, R:'1',
    rad:c => Math.abs(1 - (c || 0)),
    coef:(k, c) => 1 / Math.pow(1 - (c || 0), k + 1),
    deriv:(k, x) => srFact(k) / Math.pow(1 - x, k + 1),
    note:'The geometric series, read as a function. Its radius is the distance from the centre to the pole at x = 1 — so it is 1 about the origin, and it shrinks to nothing as the centre is slid towards 1.' },
  ln:    { name:'ln(1 + x)', f:x => Math.log(1 + x), c:0, R:'1',
    rad:c => Math.abs(1 + (c || 0)),
    coef:(k, c) => k === 0 ? Math.log(1 + (c || 0))
                           : Math.pow(-1, k + 1) / (k * Math.pow(1 + (c || 0), k)),
    deriv:(k, x) => k === 0 ? Math.log(1 + x) : Math.pow(-1, k - 1) * srFact(k - 1) / Math.pow(1 + x, k),
    note:'Integrate the geometric series term by term. Its radius is the distance from the centre to the singularity at x = −1. At x = 1 the Maclaurin series becomes the alternating harmonic series and converges to ln 2 — an endpoint that converges even though the interior test is indifferent to it.' },
  atan:  { name:'arctan x', f:Math.atan, c:0, R:'1',
    rad:c => Math.hypot(1, c || 0),
    coef:srAtanCoef,
    deriv:srAtanDeriv,
    note:'Integrating 1/(1+x²) term by term. At x = 1 it gives <b>π/4 = 1 − ⅓ + ⅕ − …</b>, the Leibniz formula — beautiful, and uselessly slow: five hundred terms buy two decimal places. Its radius about c is √(1+c²), the distance to the singularities at ±i, which is why a perfectly smooth real function has a series that stops working.' },
  binom: { name:'√(1 + x)', f:x => Math.sqrt(1 + x), c:0, R:'1',
    rad:c => Math.abs(1 + (c || 0)),
    coef:(k, c) => { let v = 1; for(let i = 0; i < k; i++) v *= (0.5 - i) / (i + 1); return v * Math.pow(1 + (c || 0), 0.5 - k); },
    deriv:srSqrtDeriv,
    note:'The binomial series with exponent ½. Newton found it in 1665 by pattern-matching the integer cases and then simply assuming the pattern continued — one of the most productive unjustified steps in the history of mathematics.' }
};
function srFact(n){ let v = 1; for(let i = 2; i <= n; i++) v *= i; return v; }
/* These are called with a key by the stages that use the table, and with a whole
   entry by the one that lets the reader type their own function. Accepting both
   is what puts a typed f on exactly the same code path as a preset, rather than
   on a parallel one that could drift away from it. */
const srTayEntry = k => (typeof k === 'string' ? SR_TAYLOR[k] : k);
/* the Taylor polynomial of degree N, built from the coefficient rule */
function srTaylor(key, N, x, c){
  const T = srTayEntry(key), a = c === undefined ? T.c : c;
  let s = 0, p = 1;
  /* the coefficient is f⁽ᵏ⁾(a)/k!, so it must be asked for at the centre the
     powers below are being taken about */
  for(let k = 0; k <= N; k++){ s += T.coef(k, a) * p; p *= (x - a); }
  return s;
}
/* the Lagrange remainder bound: |Rₙ| ≤ max|f⁽ⁿ⁺¹⁾|·|x−c|ⁿ⁺¹/(n+1)!, with the
   maximum taken over the interval rather than guessed */
function srLagrange(key, N, x, c){
  const T = srTayEntry(key), a = c === undefined ? T.c : c;
  if(!T.deriv) return { bound:NaN, actual:Math.abs(T.f(x) - srTaylor(key, N, x, a)) };
  let M = 0;
  const steps = 60;
  for(let i = 0; i <= steps; i++){
    const t = a + (x - a) * i / steps;
    const v = Math.abs(T.deriv(N + 1, t));
    if(Number.isFinite(v)) M = Math.max(M, v);
  }
  const bound = M * Math.pow(Math.abs(x - a), N + 1) / srFact(N + 1);
  const actual = Math.abs(T.f(x) - srTaylor(key, N, x, a));
  return { bound, actual, M, holds:actual <= bound * (1 + 1e-9) + 1e-15 };
}
/* the radius of convergence of a power series, from its own coefficients */
function srRadius(coef, N){
  let best = 0, found = false;
  for(let k = (N || 60); k > Math.max(4, (N || 60) - 18); k--){
    const v = Math.abs(coef(k));
    if(v > 1e-300){ best = Math.max(best, Math.pow(v, 1 / k)); found = true; }
  }
  return found && best > 0 ? 1 / best : Infinity;
}
