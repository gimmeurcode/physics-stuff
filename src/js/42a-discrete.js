/* ============================================================================
   2z · DISCRETE MATHEMATICS & COMBINATORICS  (Programme C wing C5)

   Counting is the one branch of mathematics where a second route is always
   available and almost never taken: you can ENUMERATE. Every closed form in
   this engine is checked against an actual list of the objects it claims to
   count, built and counted one at a time, for whatever n is small enough. That
   is not a numerical approximation to the answer — it IS the answer, obtained
   by the definition, and a formula that disagrees with it is wrong.

   The enumerators are therefore first-class here rather than test scaffolding,
   and they are bounded: an enumeration whose length is a factorial is a hang
   waiting for its input (SITE-RULES, the ctUnitMarks lesson), so every one of
   them refuses above a cap and says so instead of trying.
   ============================================================================ */

/* ---- the cap, and why there is one ---------------------------------------
   8! is 40 320 and 12! is 479 001 600. A stage that enumerates on every frame
   must refuse the second, and refusing loudly is the only safe form: silently
   truncating a list turns a wrong count into a plausible one. */
const DC_MAX_ENUM = 60000;

/* ---- exact integer arithmetic where it matters ---------------------------
   C(52, 26) is 4.96e14, which float64 holds exactly (below 2^53), but
   computing it as 52!/(26!26!) overflows the numerator to 8e67 and loses the
   integer. The multiplicative form keeps every partial product an integer and
   stays exact wherever the answer is. Its own limit is printed rather than
   assumed: dcExact says whether the result is still an exact integer. */
function dcFact(n){
  if(!(n >= 0) || n !== Math.round(n)) return NaN;
  let f = 1;
  for(let i = 2; i <= n; i++) f *= i;
  return f;
}
function dcChoose(n, k){
  if(!(n >= 0) || !(k >= 0) || k > n || n !== Math.round(n) || k !== Math.round(k)) return 0;
  k = Math.min(k, n - k);
  /* the multiplicative form: at each step the running product is divisible by i
     exactly, because C(n, i) is an integer, so no rounding ever enters */
  let r = 1;
  for(let i = 1; i <= k; i++) r = r * (n - k + i) / i;
  return Math.round(r);
}
function dcPerm(n, k){
  if(!(n >= 0) || !(k >= 0) || k > n) return 0;
  let r = 1;
  for(let i = 0; i < k; i++) r *= (n - i);
  return r;
}
const dcExact = v => Number.isFinite(v) && Math.abs(v) <= Number.MAX_SAFE_INTEGER;

/* ---- the four counting problems -------------------------------------------
   Order matters or it does not; repetition is allowed or it is not. That is a
   two-by-two table and it is the whole of elementary counting. Each entry has a
   closed form AND an enumerator, and the wing prints both. */
const DC_KINDS = {
  perm:   { name:'arrangements — order matters, no repeats', sym:'P(n, k)',
            f:(n, k) => dcPerm(n, k),
            ex:'n!/(n−k)!' },
  permRep:{ name:'sequences — order matters, repeats allowed', sym:'nᵏ',
            f:(n, k) => Math.pow(n, k),
            ex:'nᵏ' },
  comb:   { name:'subsets — order does not matter, no repeats', sym:'C(n, k)',
            f:(n, k) => dcChoose(n, k),
            ex:'n!/(k!(n−k)!)' },
  combRep:{ name:'multisets — order does not matter, repeats allowed', sym:'C(n+k−1, k)',
            f:(n, k) => dcChoose(n + k - 1, k),
            ex:'C(n+k−1, k)' }
};
/* the enumerator for each: build the actual objects, as arrays of indices into
   an n-element set, and let the caller count them or draw them */
function dcEnum(kind, n, k, cap){
  const lim = cap || DC_MAX_ENUM;
  const out = [];
  let overflow = false;
  const push = a => { if(out.length >= lim){ overflow = true; return false; } out.push(a.slice()); return true; };
  const cur = [];
  if(kind === 'perm' || kind === 'permRep'){
    const used = new Array(n).fill(false);
    (function rec(){
      if(overflow) return;
      if(cur.length === k){ push(cur); return; }
      for(let i = 0; i < n; i++){
        if(kind === 'perm' && used[i]) continue;
        used[i] = true; cur.push(i);
        rec();
        cur.pop(); used[i] = false;
        if(overflow) return;
      }
    })();
  } else {
    /* non-decreasing index sequences: strictly for subsets, weakly for multisets */
    (function rec(start){
      if(overflow) return;
      if(cur.length === k){ push(cur); return; }
      for(let i = start; i < n; i++){
        cur.push(i);
        rec(kind === 'comb' ? i + 1 : i);
        cur.pop();
        if(overflow) return;
      }
    })(0);
  }
  return { list:out, n:out.length, overflow };
}
/* the two routes, side by side, with the second one's refusal made explicit */
function dcCountCheck(kind, n, k, cap){
  const closed = DC_KINDS[kind].f(n, k);
  const E = dcEnum(kind, n, k, cap || DC_MAX_ENUM);
  return { closed, enumerated:E.overflow ? null : E.n, list:E.list, overflow:E.overflow,
           agree:!E.overflow && E.n === closed, exact:dcExact(closed) };
}

/* ---- Pascal's triangle ---------------------------------------------------
   Built by the RECURRENCE, never by the factorial formula — which is what makes
   comparing it with dcChoose a test rather than a restatement. */
function dcPascal(rows){
  const T = [[1]];
  for(let n = 1; n <= rows; n++){
    const prev = T[n - 1], row = [1];
    for(let k = 1; k < n; k++) row.push(prev[k - 1] + prev[k]);
    row.push(1);
    T.push(row);
  }
  return T;
}
/* the identities a row satisfies, each measured rather than asserted */
function dcRowFacts(row, n){
  let sum = 0, alt = 0, weighted = 0, squares = 0;
  row.forEach((v, k) => {
    sum += v;
    alt += (k % 2 ? -v : v);
    weighted += k * v;
    squares += v * v;
  });
  return {
    sum, sumExact:Math.pow(2, n), sumGap:Math.abs(sum - Math.pow(2, n)),
    alt, altExact:n === 0 ? 1 : 0, altGap:Math.abs(alt - (n === 0 ? 1 : 0)),
    weighted, weightedExact:n * Math.pow(2, n - 1),
    weightedGap:Math.abs(weighted - n * Math.pow(2, n - 1)),
    squares, squaresExact:dcChoose(2 * n, n), squaresGap:Math.abs(squares - dcChoose(2 * n, n))
  };
}
/* ---- parity, WITHOUT looking at the entry --------------------------------
   The obvious test is T[n][k] % 2, and it is wrong exactly where the picture
   becomes interesting. C(63, 31) is 9.2×10^17, past 2^53, so the stored float
   has no low-order bits left and its remainder mod 2 is meaningless: the naive
   count over the first 64 rows came to 665 where the answer is 3^6 = 729.
   Nothing raised, nothing was NaN, and the gasket simply had holes in it.

   Kummer's theorem gives the power of a prime p dividing C(n, k) as the number
   of carries when k and n−k are added in base p. For p = 2 that count is zero —
   the entry is odd — exactly when adding k to n−k carries nowhere, which is to
   say when every one-bit of k is also a one-bit of n. That is a bitwise test on
   two small integers and it is exact for every n a canvas can draw. */
const dcOddEntry = (n, k) => (k >= 0 && k <= n) ? ((k & (n - k)) === 0) : false;
/* the count of odd entries in rows 0 … n, which over the first 2^m rows is
   exactly 3^m — and is therefore a closed form the bitwise route can be checked
   against, on a range where the naive route cannot even be run */
function dcOddCount(rows){
  let c = 0;
  for(let n = 0; n <= rows; n++) for(let k = 0; k <= n; k++) if(dcOddEntry(n, k)) c++;
  return c;
}

/* the hockey-stick identity: a diagonal of the triangle sums to one entry */
function dcHockey(r, n){
  let s = 0;
  for(let i = r; i <= n; i++) s += dcChoose(i, r);
  return { sum:s, exact:dcChoose(n + 1, r + 1), gap:Math.abs(s - dcChoose(n + 1, r + 1)) };
}
/* the binomial theorem, expanded numerically at a point: (a+b)^n against the sum */
function dcBinomAt(a, b, n){
  let s = 0;
  for(let k = 0; k <= n; k++) s += dcChoose(n, k) * Math.pow(a, n - k) * Math.pow(b, k);
  const direct = Math.pow(a + b, n);
  return { sum:s, direct, gap:Math.abs(s - direct), gross:Math.max(Math.abs(s), Math.abs(direct),
           /* the gross is the sum of the MAGNITUDES, because with b negative the
              two sides can both legitimately vanish and the derived scale would
              then be the round-off itself */
           (function(){ let g = 0; for(let k = 0; k <= n; k++) g += dcChoose(n, k) * Math.pow(Math.abs(a), n - k) * Math.pow(Math.abs(b), k); return g; })()) };
}

/* ---- inclusion and exclusion ---------------------------------------------
   The formula alternates over every non-empty subset of the sets. The second
   route is a membership table: walk the universe once and count the elements in
   at least one set. Nothing about the alternating sum is used to build it. */
function dcInclExcl(sets, universe){
  const m = sets.length;
  let formula = 0;
  const terms = [];
  for(let mask = 1; mask < (1 << m); mask++){
    let bits = 0, inter = 0;
    for(let i = 0; i < m; i++) if(mask & (1 << i)) bits++;
    for(let x = 0; x < universe; x++){
      let all = true;
      for(let i = 0; i < m && all; i++) if((mask & (1 << i)) && !sets[i](x)) all = false;
      if(all) inter++;
    }
    const sign = (bits % 2) ? 1 : -1;
    formula += sign * inter;
    terms.push({ mask, bits, inter, sign });
  }
  let direct = 0;
  for(let x = 0; x < universe; x++){
    let any = false;
    for(let i = 0; i < m && !any; i++) if(sets[i](x)) any = true;
    if(any) direct++;
  }
  return { formula, direct, gap:Math.abs(formula - direct), terms, m,
           /* what the alternation cancelled: the sum of the term SIZES. A union
              can legitimately be empty, and then max(|a|,|b|) is the round-off */
           gross:terms.reduce((s, t) => s + t.inter, 0) };
}
/* derangements, three ways: inclusion-exclusion, the recurrence, and n!/e */
function dcDerange(n){
  let ie = 0;
  for(let k = 0; k <= n; k++) ie += (k % 2 ? -1 : 1) * dcChoose(n, k) * dcFact(n - k);
  const rec = [1, 0];
  for(let i = 2; i <= n; i++) rec[i] = (i - 1) * (rec[i - 1] + rec[i - 2]);
  const round = Math.round(dcFact(n) / Math.E);
  return { ie, rec:rec[n], round, gapIE:Math.abs(ie - rec[n]), gapRound:Math.abs(round - rec[n]),
           ratio:rec[n] > 0 ? dcFact(n) / rec[n] : NaN };
}
/* and the brute-force route: count the permutations with no fixed point */
function dcDerangeEnum(n, cap){
  if(dcFact(n) > (cap || DC_MAX_ENUM)) return null;
  const E = dcEnum('perm', n, n, cap || DC_MAX_ENUM);
  if(E.overflow) return null;
  let c = 0;
  for(const p of E.list){
    let fixed = false;
    for(let i = 0; i < n && !fixed; i++) if(p[i] === i) fixed = true;
    if(!fixed) c++;
  }
  return c;
}

/* ---- linear recurrences ---------------------------------------------------
   Three routes to the same sequence: iterate it, raise the companion matrix to
   a power, and evaluate the closed form built from the characteristic roots.
   The third is the one that loses accuracy, and where it loses it is the lesson
   the units wing set up. */
function dcRecur(coeffs, init, n){
  /* a(m) = c0 a(m-1) + c1 a(m-2) + ... */
  const d = coeffs.length;
  const a = init.slice(0, d);
  for(let m = d; m <= n; m++){
    let v = 0;
    for(let i = 0; i < d; i++) v += coeffs[i] * a[m - 1 - i];
    a.push(v);
  }
  return a;
}
/* the companion matrix, and its n-th power by repeated squaring — a genuinely
   different computation with a different arithmetic path */
function dcCompanion(coeffs){
  const d = coeffs.length, M = [];
  M.push(coeffs.slice());
  for(let i = 1; i < d; i++){
    const row = new Array(d).fill(0);
    row[i - 1] = 1;
    M.push(row);
  }
  return M;
}
function dcMatPow(M, n){
  const d = M.length;
  let R = M.map((_, i) => M.map((__, j) => (i === j ? 1 : 0)));
  let B = M.map(r => r.slice()), e = n;
  while(e > 0){
    if(e & 1) R = laMul(R, B);
    B = laMul(B, B);
    e = Math.floor(e / 2);
  }
  return R;
}
function dcByMatrix(coeffs, init, n){
  const d = coeffs.length;
  if(n < d) return init[n];
  const P = dcMatPow(dcCompanion(coeffs), n - d + 1);
  /* the state vector is (a(d-1), a(d-2), ..., a(0)) */
  let v = 0;
  for(let j = 0; j < d; j++) v += P[0][j] * init[d - 1 - j];
  return v;
}
/* the characteristic polynomial's roots, and the closed form they build.
   For the two-term case the roots are exact and so is the closed form. */
function dcCharRoots(coeffs){
  if(coeffs.length !== 2) return null;
  const [p, q] = coeffs;                       /* a(n) = p a(n-1) + q a(n-2) */
  const disc = p * p + 4 * q;
  if(disc < 0) return { real:false, disc };
  const s = Math.sqrt(disc);
  return { real:true, disc, r1:(p + s) / 2, r2:(p - s) / 2 };
}
function dcClosedForm(coeffs, init, n){
  const R = dcCharRoots(coeffs);
  if(!R || !R.real || Math.abs(R.r1 - R.r2) < 1e-12) return null;
  /* solve A r1^0 + B r2^0 = a0, A r1 + B r2 = a1 */
  const det = R.r2 - R.r1;
  const A = (init[1] - init[0] * R.r2) / (R.r1 - R.r2);
  const B = init[0] - A;
  return { v:A * Math.pow(R.r1, n) + B * Math.pow(R.r2, n), A, B, r1:R.r1, r2:R.r2, det };
}

/* ---- counting by recurrence, checked by enumeration -----------------------
   Binary strings of length n with no two adjacent 1s. The count satisfies
   f(n) = f(n-1) + f(n-2), which is why it is a Fibonacci number — and the
   enumerator settles that without knowing the recurrence exists. */
function dcNoTwoOnes(n, cap){
  const lim = cap || DC_MAX_ENUM;
  if(Math.pow(2, n) > lim) return { count:null, overflow:true, list:[] };
  const list = [];
  for(let m = 0; m < (1 << n); m++){
    if((m & (m >> 1)) === 0) list.push(m);
  }
  return { count:list.length, overflow:false, list };
}
/* and the other classic: tilings of a 2-by-n strip by dominoes, same sequence */
function dcTilings(n){
  const a = [1, 1];
  for(let i = 2; i <= n; i++) a[i] = a[i - 1] + a[i - 2];
  return a[n];
}

/* ---- the pigeonhole principle, made concrete -----------------------------
   With n items in k boxes some box holds at least ceil(n/k). The wing measures
   the actual worst box over an explicit assignment rather than asserting it. */
function dcPigeon(n, k, assign){
  const boxes = new Array(k).fill(0);
  for(let i = 0; i < n; i++) boxes[assign ? assign(i) : i % k]++;
  const worst = Math.max.apply(null, boxes);
  return { boxes, worst, bound:Math.ceil(n / k), holds:worst >= Math.ceil(n / k) };
}

/* ---- the birthday problem, closed form against simulation -----------------
   A place where "obvious" is wrong by a factor of five, and where a seeded
   Monte Carlo is the honest second route. The generator is the units wing's,
   because a reproducible panel is worth more than a fresh one. */
function dcBirthday(n, days){
  let p = 1;
  for(let i = 0; i < n; i++) p *= (days - i) / days;
  return { pNone:p, pSome:1 - p };
}
/* Where the curve crosses a half, in closed form.
   log P(none) is approximately -sum(i/N) = -k(k-1)/2N, so the crossing solves
   k(k-1)/2N = ln 2 — a quadratic, and solving it is no harder than dropping the
   k/2 term. Dropping it gives the famous k ~ 1.177 root(N), which is the right
   SCALING and is out by half a person at N = 365 and by a fifth at N = 12: an
   absolute error of order 1, which is exactly what a term linear in k costs.
   The quadratic form lands within one of the true crossing at every preset this
   wing offers, and it is what the claims block checks. */
const dcBirthHalf = N => 0.5 + Math.sqrt(0.25 + 2 * Math.log(2) * N);
/* the scaling law on its own, kept because it is the thing worth remembering */
const dcBirthScale = N => Math.sqrt(2 * Math.log(2) * N);
function dcBirthdaySim(n, days, trials, seed){
  const rng = unRng(seed || 4242);
  let hit = 0;
  for(let t = 0; t < trials; t++){
    const seen = new Set();
    let clash = false;
    for(let i = 0; i < n && !clash; i++){
      const d = Math.floor(rng() * days);
      if(seen.has(d)) clash = true; else seen.add(d);
    }
    if(clash) hit++;
  }
  const p = hit / trials;
  return { p, n:trials, se:Math.sqrt(Math.max(1e-12, p * (1 - p)) / trials) };
}
