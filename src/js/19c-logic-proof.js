/* ============================================================================
   1c · PROOF, LOGIC & SETS — induction, descent and contradiction   (wing C1)

   The propositional half next door decides finite things by exhaustion. This
   half is about the two arguments that reach statements no exhaustion can:

     induction     base case + step ⇒ every n, from two finite checks
     contradiction assume the thing, derive an impossibility

   The wing's whole point is that these are DIFFERENT from verification, and
   the engine is built so a stage can show the difference rather than assert
   it. Every claim below is checked by two routes that answer different
   questions:

     route A   verification — evaluate the statement at every n up to N
     route B   the induction certificate — the base case, and whether the
               step's algebra holds at every n; nothing else is evaluated

   Route B knows about infinitely many n and route A never will. Where they
   part is the lesson: PF_CLAIMS carries claims whose step is sound and whose
   base fails (so the certificate is void and the statement false everywhere),
   and claims verified for thirty-nine values that are false at the fortieth.
   ============================================================================ */

/* the checks are cheap, but they run inside frame(); these caps keep the trip
   count off the reader's slider */
const PF_INDUCT_MAX = 200;
const PF_SEARCH_MAX = 4000;

/* ---- integer helpers the proofs need ------------------------------------- */
function pfPrimesUpTo(n){
  const lim = Math.max(1, Math.min(200000, Math.floor(n)));
  const sieve = new Uint8Array(lim + 1);
  const out = [];
  for(let i = 2; i <= lim; i++){
    if(sieve[i]) continue;
    out.push(i);
    for(let j = i * i; j <= lim; j += i) sieve[j] = 1;
  }
  return out;
}
/* trial division, and honest about where it stops: above 2^53 the products are
   no longer exact integers, so the answer would be a fiction */
function pfFactor(n){
  if(!Number.isFinite(n) || n < 2 || n > Number.MAX_SAFE_INTEGER)
    return { ok:false, factors:[], why:'past 2⁵³, where float64 no longer holds integers exactly' };
  let m = Math.round(n);
  const out = [];
  for(let d = 2; d * d <= m; d++){
    while(m % d === 0){ out.push(d); m /= d; }
  }
  if(m > 1) out.push(m);
  return { ok:true, factors:out, prime:out.length === 1, why:'' };
}
const pfIsPrime = n => { const F = pfFactor(n); return F.ok && F.prime; };

/* ============================================================================
   INDUCTION
   Each claim supplies the statement P(n) and — separately — the algebra of the
   inductive step. Nothing derives one from the other, which is what lets the
   two routes disagree when they should.
   ============================================================================ */
const PF_CLAIMS = {
  sumFirst: {
    name:'1 + 2 + … + n  =  n(n+1)/2', ex:'Σ k  =  n(n+1)/2', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += k; return s; },
    rhs:n => n * (n + 1) / 2,
    term:k => k,
    step:'rhs(n+1) − rhs(n) must equal the term added, n+1',
    why:'The first induction anybody meets, and the one where the step is a single line of algebra: (n+1)(n+2)/2 − n(n+1)/2 = n+1, which is exactly the term that was added. Gauss’s pairing argument proves the same thing without induction at all, and the two agreeing is worth noticing.' },
  sumOdd: {
    name:'1 + 3 + 5 + … + (2n−1)  =  n²', ex:'Σ (2k−1)  =  n²', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += 2 * k - 1; return s; },
    rhs:n => n * n,
    term:k => 2 * k - 1,
    step:'(n+1)² − n² must equal 2n+1, the next odd number',
    why:'The prettiest of them: the step is (n+1)² − n² = 2n+1, so each odd number is exactly the L-shaped border that turns an n×n square into an (n+1)×(n+1) one. The picture is the proof, and induction is the bookkeeping.' },
  sumSq: {
    name:'Σ k²  =  n(n+1)(2n+1)/6', ex:'Σ k²  =  n(n+1)(2n+1)/6', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += k * k; return s; },
    rhs:n => n * (n + 1) * (2 * n + 1) / 6,
    term:k => k * k,
    step:'rhs(n+1) − rhs(n) must equal (n+1)²',
    why:'The formula nobody guesses and everybody can check. Induction verifies it in two lines and explains nothing about where it came from — which is the honest complaint about the method, and the reason the Riemann-sum route in the integration wing feels more like an explanation.' },
  sumCube: {
    name:'Σ k³  =  (n(n+1)/2)²  =  (Σ k)²', ex:'Σ k³  =  (Σ k)²', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += k * k * k; return s; },
    rhs:n => Math.pow(n * (n + 1) / 2, 2),
    term:k => k * k * k,
    step:'rhs(n+1) − rhs(n) must equal (n+1)³',
    why:'The sum of the first n cubes is the square of the sum of the first n numbers, which is the kind of coincidence that has to be checked before it can be believed. The step reduces to (n+1)³ = ((n+1)(n+2)/2)² − (n(n+1)/2)², an identity in n and nothing more.' },
  geom: {
    name:'1 + 2 + 4 + … + 2ⁿ⁻¹  =  2ⁿ − 1', ex:'Σ 2^(k−1)  =  2ⁿ − 1', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += Math.pow(2, k - 1); return s; },
    rhs:n => Math.pow(2, n) - 1,
    term:k => Math.pow(2, k - 1),
    step:'(2ⁿ⁺¹ − 1) − (2ⁿ − 1) must equal 2ⁿ, the term added',
    why:'Why a row of n binary digits counts to 2ⁿ − 1 and not to 2ⁿ, and why doubling a debt each day is a bad idea: the whole of what came before is always one less than the next term alone.' },
  recip: {
    name:'Σ 1/(k(k+1))  =  n/(n+1)', ex:'Σ 1/(k(k+1))  =  n/(n+1)', from:1, trueClaim:true, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += 1 / (k * (k + 1)); return s; },
    rhs:n => n / (n + 1),
    term:k => 1 / (k * (k + 1)),
    step:'n/(n+1) + 1/((n+1)(n+2)) must equal (n+1)/(n+2)',
    why:'The one claim here whose two sides are not integers, so its residual is round-off rather than exactly zero — and the readout says which. It also telescopes: 1/(k(k+1)) = 1/k − 1/(k+1), everything cancels, and no induction is needed at all. Two proofs, one true statement.' },
  cube6: {
    name:'6 divides n³ − n, for every n', ex:'6 | n³ − n', from:1, trueClaim:true, kind:'divisibility',
    lhs:n => (n * n * n - n) % 6,
    rhs:() => 0,
    stepOK:n => (3 * n * (n + 1)) % 6 === 0,
    step:'the increase is (n+1)³−(n+1) − (n³−n) = 3n(n+1), and n(n+1) is even',
    why:'A divisibility claim, where the step is not an identity but an argument: the increase is 3n(n+1), one of n and n+1 is even, so the increase is a multiple of 6 and divisibility survives. The alternative proof — n³−n = (n−1)n(n+1), three consecutive integers, so one is a multiple of 3 and at least one is even — needs no induction and is the better proof.' },
  pow2: {
    name:'2ⁿ > n²  — but only from n = 5', ex:'2ⁿ > n²', from:5, trueClaim:true, kind:'inequality',
    lhs:n => Math.pow(2, n),
    rhs:n => n * n,
    holds:n => Math.pow(2, n) > n * n,
    stepOK:n => 2 * n * n >= (n + 1) * (n + 1),
    step:'doubling gives 2ⁿ⁺¹ > 2n², and 2n² ≥ (n+1)² whenever n ≥ 3',
    why:'The claim is FALSE at n = 2, 3 and 4 and true from 5 onwards, so the base case is doing real work — move the base below 5 and the certificate correctly refuses. It is also the cleanest case of a step that needs its own side condition: 2n² ≥ (n+1)² fails at n = 1 and 2.' },
  harm: {
    /* maxN IS LOAD-BEARING HERE, and it is the only claim in this table for
       which that is true. Every other lhs costs O(n); this one sums 2ⁿ terms
       because that is what H(2ⁿ) means, so the trip count is an EXPONENTIAL
       function of a number a reader can drag. At n = 40 it is 10¹² terms and
       the page is gone. Found on 2026-08-19 by auditclaims, which called it at
       40 and never returned; runstagetests had capped its own sweep at 24 and
       so only made it slow. 14 is 16 384 terms, which is instant and still
       passes 1 + n/2 = 8 — far enough to make the point that the partial sums
       run away. (SITE-RULES: a loop counted in the quantity is a hang waiting
       for its input.) */
    name:'H(2ⁿ) ≥ 1 + n/2  — the harmonic series diverges', ex:'H(2ⁿ) ≥ 1 + n/2', from:0, trueClaim:true, kind:'inequality', maxN:14,
    lhs:n => { const m = Math.pow(2, n); let s = 0; for(let k = 1; k <= m; k++) s += 1 / k; return s; },
    rhs:n => 1 + n / 2,
    holds:n => { const m = Math.pow(2, n); let s = 0; for(let k = 1; k <= m; k++) s += 1 / k; return s >= 1 + n / 2 - 1e-12; },
    stepOK:() => true,
    step:'the block from 2ⁿ+1 to 2ⁿ⁺¹ has 2ⁿ terms, each at least 1/2ⁿ⁺¹, so it adds at least ½',
    why:'Induction reaching a conclusion about infinity: the partial sums pass every bound, so the harmonic series diverges — while its terms go to zero and the sum grows like log n, so 1 + n/2 is reached at 2ⁿ terms, which for n = 20 is a million. The engine only checks n small; the argument covers all of them, which is precisely the point of the method.' },
  offByOne: {
    name:'Σ k  =  n(n+1)/2 + 1  — the step is sound and the claim is false', ex:'Σ k  =  n(n+1)/2 + 1', from:1, trueClaim:false, kind:'identity',
    lhs:n => { let s = 0; for(let k = 1; k <= n; k++) s += k; return s; },
    rhs:n => n * (n + 1) / 2 + 1,
    term:k => k,
    step:'rhs(n+1) − rhs(n) is still n+1 — the added constant cancels — so the step holds at every n',
    why:'The one to sit with. The inductive step is perfectly valid: the stray +1 cancels in the difference, so P(n) ⇒ P(n+1) for every n. The base case fails, and with it the entire chain — the dominoes are all correctly spaced and nobody pushed the first one. Verification and the certificate disagree here, and the certificate is the one that is right to refuse.' },
  primes41: {
    name:'n² + n + 41 is prime — true for n = 0…39', ex:'n² + n + 41 ∈ ℙ', from:0, trueClaim:false, kind:'pattern',
    lhs:n => n * n + n + 41,
    rhs:() => 0,
    holds:n => pfIsPrime(n * n + n + 41),
    stepOK:() => false,
    step:'there is no step — nothing connects the primality of one value to the next',
    why:'Euler’s polynomial, and the best argument in mathematics for why checking is not proving. Forty consecutive values are prime; at n = 40 the value is 41² = 1681, because 40² + 40 + 41 = 40·41 + 41 = 41·41, which is obvious once written that way and invisible for thirty-nine steps. A pattern with no inductive step is a conjecture however many times it holds.' },
  fermat: {
    name:'2^(2ⁿ) + 1 is prime — Fermat’s conjecture', ex:'F(n) = 2^(2ⁿ) + 1 ∈ ℙ', from:0, trueClaim:false, kind:'pattern',
    lhs:n => Math.pow(2, Math.pow(2, n)) + 1,
    rhs:() => 0,
    holds:n => n <= 5 && pfIsPrime(Math.pow(2, Math.pow(2, n)) + 1),
    stepOK:() => false,
    maxN:5,
    step:'no step existed; Fermat checked five values and conjectured the rest',
    why:'3, 5, 17, 257, 65537 — five primes, and Fermat believed the pattern. Euler found that 641 divides the sixth, 4 294 967 297. The panel factors it here, ninety-odd years after the conjecture and in about a millisecond, which is a fair summary of what changed.' }
};
/* ---- a memo, because these run inside frame() ----------------------------
   The Fermat row factors 2³² + 1 by trial division — 65 000 divisions — and
   frame() runs sixty times a second. Everything below is a pure function of
   its arguments, so one cache line is enough and it is cleared by nothing. */
const PF_MEMO = {};
function pfMemo(tag, args, make){
  const k = tag + '|' + args.join(',');
  if(!(k in PF_MEMO)){
    /* an unbounded cache in a page that never reloads is a leak; these keys
       are slider positions, so a few hundred is the whole key space */
    const keys = Object.keys(PF_MEMO);
    if(keys.length > 400) delete PF_MEMO[keys[0]];
    PF_MEMO[k] = make();
  }
  return PF_MEMO[k];
}

/* the two routes. `verify` walks the statement; the certificate looks only at
   the base case and at the step's own algebra, and neither consults the other. */
function pfInductCheck(key, N){
  return pfMemo('induct', [key, Math.round(N)], () => pfInductCompute(key, N));
}
function pfInductCompute(key, N){
  const C = PF_CLAIMS[key];
  const top = Math.min(C.maxN === undefined ? PF_INDUCT_MAX : C.maxN,
                       Math.max(C.from, Math.round(N)));
  const holds = C.holds || (n => {
    const a = C.lhs(n), b = C.rhs(n);
    if(C.kind === 'divisibility') return a === 0;
    const scale = Math.max(Math.abs(a), Math.abs(b), 1);
    return Math.abs(a - b) <= 1e-12 * scale;
  });
  const rows = [];
  let firstFail = null, worst = 0, worstScale = 1;
  for(let n = C.from; n <= top; n++){
    const ok = holds(n);
    if(C.kind === 'identity'){
      const a = C.lhs(n), b = C.rhs(n);
      const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
      if(d / s > worst / worstScale){ worst = d; worstScale = s; }
    }
    rows.push({ n, ok, lhs:C.lhs(n), rhs:C.rhs(n) });
    if(!ok && firstFail === null) firstFail = n;
  }
  /* the certificate: the base case, and the step's algebra at every n in range.
     For an identity the step IS an identity — rhs(n+1) − rhs(n) = term(n+1) —
     and is checked as one; the other kinds carry their own stepOK. */
  const stepOK = C.stepOK || (n => {
    const d = C.rhs(n + 1) - C.rhs(n), t = C.term(n + 1);
    const s = Math.max(Math.abs(d), Math.abs(t), 1);
    return Math.abs(d - t) <= 1e-12 * s;
  });
  let stepFail = null, stepWorst = 0;
  for(let n = C.from; n < top; n++){
    if(C.term && !C.stepOK){
      const d = C.rhs(n + 1) - C.rhs(n), t = C.term(n + 1);
      const s = Math.max(Math.abs(d), Math.abs(t), 1);
      stepWorst = Math.max(stepWorst, Math.abs(d - t) / s);
    }
    if(!stepOK(n) && stepFail === null) stepFail = n;
  }
  const baseOK = holds(C.from);
  const certified = baseOK && stepFail === null && C.kind !== 'pattern';
  return { claim:C, key, from:C.from, top, rows, firstFail,
           allHold:firstFail === null, baseOK, stepFail, stepAllOK:stepFail === null,
           certified, resid:worst, residScale:worstScale, stepResid:stepWorst,
           /* the whole point: what each route is entitled to say */
           verdict: certified ? 'proved for every n ≥ ' + C.from
                  : (!baseOK ? 'the base case fails, so the chain never starts'
                  : (stepFail !== null ? 'the step first fails at n = ' + stepFail
                  : 'checked, never proved — this claim has no inductive step')),
           agree: certified ? firstFail === null : true };
}

/* ============================================================================
   IRRATIONALITY — what a search can and cannot show

   No search proves irrationality: every real is approximated by rationals as
   closely as you like, so "no p/q found" is not evidence. What a search CAN
   show is the SHAPE of the approximation — q²|x − p/q| stays bounded below for
   an irrational and drops to exactly zero at one q for a rational — and that
   shape is exactly what the parity proof explains.

   Two routes to the best approximation with denominator ≤ Q:

     route A   try every q and take the best — 4000 divisions, no theory
     route B   the continued-fraction convergents AND their semiconvergents

   Route B without the semiconvergents is the classic mistake: the convergents
   are the best approximations, but the best approximation with q ≤ Q need not
   be a convergent when Q falls between two of them. The two routes disagree at
   about one Q in three when the semiconvergents are dropped, which is how this
   was found rather than assumed.
   ============================================================================ */
const PF_TARGETS = {
  root2: { name:'√2', v:Math.SQRT2, irrational:true, liminf:1 / (2 * Math.SQRT2),
           limWhy:'1/(2√2) = 0.3536, because |p² − 2q²| is a positive integer and so is at least 1',
           why:'The number the proof was invented for. Its continued fraction is [1; 2, 2, 2, …] — every coefficient the same — and the convergents 3/2, 7/5, 17/12, 41/29 are the ones the descent below walks through backwards.' },
  phi:   { name:'φ = (1+√5)/2', v:(1 + Math.sqrt(5)) / 2, irrational:true, liminf:1 / Math.sqrt(5),
           limWhy:'1/√5 = 0.4472 — the largest such limit any number has, which is Hurwitz’s theorem, and φ is the case that makes it sharp',
           why:'The hardest number to approximate. Its continued fraction is all 1s, which is the slowest possible convergence, and q²|φ − p/q| approaches 1/√5 = 0.4472 — the largest such limit any number has. Hurwitz’s theorem says no number does worse, and φ is the reason the constant is √5.' },
  root3: { name:'√3', v:Math.sqrt(3), irrational:true, liminf:1 / (2 * Math.sqrt(3)),
           limWhy:'1/(2√3) = 0.2887, by the same integer argument as √2 — but only half the record-holders come near it and the others sit at twice that, which is what an uneven continued fraction looks like',
           why:'Continued fraction [1; 1, 2, 1, 2, …], so the convergents arrive in uneven jumps and the semiconvergents matter more than they do for √2 — which makes it the row where a convergents-only route goes wrong soonest.' },
  /* liminf is null where the value is NOT KNOWN, and the panel says so rather
     than printing a zero it cannot justify. Whether π's partial quotients are
     unbounded — which is what a liminf of 0 would need — is open. */
  pi:    { name:'π', v:Math.PI, irrational:true, liminf:null,
           limWhy:'not known: a limit of zero needs unbounded partial quotients, and whether π has them is an open problem',
           why:'Its continued fraction is [3; 7, 15, 1, 292, …] and that 292 is why 355/113 is so extraordinarily good: it agrees with π to seven figures with a three-digit denominator. Irrational, and the proof is nothing like the one for √2 — no elementary parity argument reaches it.' },
  e:     { name:'e', v:Math.E, irrational:true, liminf:0,
           limWhy:'zero, and provably so — the partial quotients 2, 4, 6, 8, … grow without bound',
           why:'[2; 1, 2, 1, 1, 4, 1, 1, 6, …] — a pattern, but not a periodic one, which is exactly the signature of a number that is irrational and not the root of any quadratic.' },
  threeHalves: { name:'3/2 — rational, for contrast', v:1.5, irrational:false, liminf:0,
           limWhy:'zero, and reached: the error is exactly zero at q = 2',
           why:'The control. The error is exactly zero at q = 2 and at every even q after it, so the curve the irrationals never reach is touched immediately. This is what the search looks like when the thing it is searching for exists.' },
  decimal: { name:'1.4142135 — rational, and pretending', v:1.4142135, irrational:false, liminf:0,
           limWhy:'zero in principle — the number is 2828427/2000000 — but that denominator is far outside any search this stage can run, so nothing here will ever see it',
           why:'The honest limit of the whole method. This is a ratio of integers, 14142135/10000000, and within any denominator you can search it behaves exactly like √2 — same curve, same bound, no exact hit. A search cannot tell them apart, and only the parity argument can.' }
};
/* route A: brute force */
function pfBestRatBrute(x, Q){
  const lim = Math.max(1, Math.min(PF_SEARCH_MAX, Math.round(Q)));
  let best = { p:Math.round(x), q:1, err:Math.abs(x - Math.round(x)) };
  for(let q = 1; q <= lim; q++){
    const p = Math.round(x * q), e = Math.abs(x - p / q);
    if(e < best.err) best = { p, q, err:e };
  }
  return best;
}
/* the continued fraction, and the convergents it generates */
function pfCF(x, depth){
  const a = [], p = [], q = [];
  let v = x;
  for(let i = 0; i < (depth || 20); i++){
    const ai = Math.floor(v);
    a.push(ai);
    p.push(i === 0 ? ai : (i === 1 ? ai * p[0] + 1 : ai * p[i - 1] + p[i - 2]));
    q.push(i === 0 ? 1  : (i === 1 ? ai            : ai * q[i - 1] + q[i - 2]));
    const frac = v - ai;
    if(frac < 1e-13) break;
    v = 1 / frac;
  }
  return { a, p, q };
}
/* route B: convergents AND semiconvergents. Dropping the second word is the
   error this comment exists to prevent — see the header. */
function pfBestRatCF(x, Q){
  const lim = Math.max(1, Math.min(PF_SEARCH_MAX, Math.round(Q)));
  const C = pfCF(x, 24);
  let best = { p:Math.round(x), q:1, err:Math.abs(x - Math.round(x)) };
  const offer = (p, q) => {
    if(q < 1 || q > lim) return;
    const e = Math.abs(x - p / q);
    if(e < best.err - 1e-18) best = { p, q, err:e };
  };
  for(let i = 0; i < C.q.length; i++){
    offer(C.p[i], C.q[i]);
    /* The semiconvergents built on convergent i. The i = 0 term needs the
       conventional p₋₁/q₋₁ = 1/0, and leaving it out is not a rounding of the
       theory but a wrong answer: at Q = 5 the best approximation to π is 16/5,
       which is a semiconvergent on i = 0 and is not any convergent. The
       routes disagreed on exactly that case before this line existed. */
    if(i + 1 < C.a.length){
      const pp = i === 0 ? 1 : C.p[i - 1], qq = i === 0 ? 0 : C.q[i - 1];
      for(let j = 1; j <= C.a[i + 1]; j++)
        offer(j * C.p[i] + pp, j * C.q[i] + qq);
    }
  }
  return best;
}
function pfBestRat(x, Q){
  return pfMemo('bestrat', [x, Math.round(Q)], () => pfBestRatCompute(x, Q));
}
function pfBestRatCompute(x, Q){
  const A = pfBestRatBrute(x, Q), B = pfBestRatCF(x, Q);
  return { A, B, agree:A.q === B.q && A.p === B.p,
           /* equal error with different fractions is possible (x exactly
              halfway) and is not a disagreement */
           errAgree:Math.abs(A.err - B.err) <= 1e-15 * Math.max(A.err, 1e-15) };
}
/* the curve the stage draws: q²·|x − p/q| against q, and the record-holders */
function pfApproxCurve(x, Q){
  return pfMemo('curve', [x, Math.round(Q)], () => pfApproxCurveCompute(x, Q));
}
function pfApproxCurveCompute(x, Q){
  const lim = Math.max(1, Math.min(PF_SEARCH_MAX, Math.round(Q)));
  const pts = [], records = [];
  let bestErr = Infinity, minScaled = Infinity, exact = null;
  for(let q = 1; q <= lim; q++){
    const p = Math.round(x * q), e = Math.abs(x - p / q);
    pts.push({ q, err:e, scaled:e * q * q });
    if(e === 0 && exact === null) exact = { p, q };
    if(e < bestErr - 1e-18){ bestErr = e; records.push({ p, q, err:e, scaled:e * q * q }); }
    if(e > 0) minScaled = Math.min(minScaled, e * q * q);
  }
  return { pts, records, exact, minScaled:Number.isFinite(minScaled) ? minScaled : 0, bestErr };
}
/* the declared liminf, recomputed from the search rather than quoted.
   Two things had to be got right here and neither is obvious. The minimum of
   q²|x − p/q| over ALL q is NOT the liminf — for √2 it is 0.3431, attained at
   3/2, below the limit of 0.35355 that the tail approaches — so the measurement
   has to be taken along the record-holders and only where they have settled.
   And for √3 the records alternate between 0.2887 and 0.5774, so it must be the
   minimum over the tail and not the last one. Both mistakes were made first. */
function pfLiminfMeasured(x, Q, qmin){
  const C = pfApproxCurve(x, Q);
  if(C.exact) return 0;
  const tail = C.records.filter(r => r.q >= (qmin || 20));
  if(!tail.length) return null;
  return Math.min.apply(null, tail.map(r => r.scaled));
}

/* ---- the proof the search cannot do: infinite descent ---------------------
   If p² = 2q² with p, q positive integers, then (2q−p, p−q) is another such
   pair, strictly smaller and still positive. No strictly decreasing sequence
   of positive integers is infinite, so no such pair exists. Run on a NEAR
   solution the same map walks the convergents of √2 backwards and preserves
   p² − 2q² exactly — which is why it terminates at 1 rather than at 0. */
function pfDescent(p, q, steps){
  const out = [{ p, q, resid:p * p - 2 * q * q }];
  for(let i = 0; i < (steps || 12); i++){
    const last = out[out.length - 1];
    const np = 2 * last.q - last.p, nq = last.p - last.q;
    if(nq < 1 || np < 1) break;
    out.push({ p:np, q:nq, resid:np * np - 2 * nq * nq });
    if(nq === 1 && np === 1) break;
  }
  return { chain:out, invariant:out.every(r => Math.abs(r.resid) === Math.abs(out[0].resid)),
           ended:out[out.length - 1] };
}

/* ============================================================================
   EUCLID — infinitely many primes, and the misstatement of his proof

   The theorem: no finite list holds them all. The proof: multiply the list and
   add one; the result is divisible by none of them, so its prime factors are
   all new. The misstatement, which is in a great many books: "so ∏ + 1 is
   prime". It is not — 2·3·5·7·11·13 + 1 = 30031 = 59 × 509 — and the panel
   factors it rather than saying so.

   Two routes to "no listed prime divides N": factor N and compare the factors
   against the list, or take N mod p for each listed p and find 1 every time.
   The second never factors anything.
   ============================================================================ */
function pfEuclidStep(list){
  let prod = 1;
  for(const p of list) prod *= p;
  const N = prod + 1;
  const F = pfFactor(N);
  const newPrimes = F.ok ? F.factors.filter(f => list.indexOf(f) < 0) : [];
  /* route B: the remainders, which need no factorisation at all */
  const rems = list.map(p => ({ p, r:N % p }));
  return { list:list.slice(), prod, N, ok:F.ok, why:F.why,
           factors:F.factors, isPrime:!!F.prime, newPrimes,
           rems, noneDivides:rems.every(r => r.r === 1),
           /* the two routes, compared: "every factor is new" must agree with
              "every listed prime leaves remainder 1" */
           agree: F.ok ? (newPrimes.length === F.factors.length) === rems.every(r => r.r !== 0) : true };
}
/* the Euclid–Mullin sequence: start from a prime, and each step takes the
   SMALLEST new prime factor of ∏+1. It grows out of exact arithmetic in six
   steps, and stopping when it does is the honest thing to do. */
function pfEuclidChain(start, steps){
  return pfMemo('euclid', [start || 2, steps || 5], () => pfEuclidChainCompute(start, steps));
}
function pfEuclidChainCompute(start, steps){
  const list = [start || 2], out = [];
  for(let i = 0; i < (steps || 5); i++){
    const S = pfEuclidStep(list);
    out.push(S);
    if(!S.ok || !S.newPrimes.length) break;
    list.push(Math.min.apply(null, S.newPrimes));
  }
  return { chain:out, primes:list };
}
/* the misstatement, evaluated: the first k primes, multiplied and incremented,
   and whether the result is prime. False first at k = 6. */
function pfPrimorialPrime(k){
  return pfMemo('primorial', [Math.round(k)], () => pfPrimorialCompute(k));
}
function pfPrimorialCompute(k){
  const P = pfPrimesUpTo(100).slice(0, Math.max(1, Math.min(9, k)));
  const S = pfEuclidStep(P);
  return { primes:P, N:S.N, factors:S.factors, isPrime:S.isPrime, ok:S.ok, why:S.why };
}
