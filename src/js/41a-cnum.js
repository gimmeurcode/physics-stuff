/* ============================================================================
   3g-bis · COMPLEX NUMBERS, ELEMENTARY
   Programme C wing 1 (C2).  The third-year wing above this one (41-complex.js)
   opens with domain colouring and closes with residues; it assumes a reader who
   already knows what i is.  Nothing taught that.  This module is the arithmetic
   floor under it: what i fixes, what multiplication DOES, where Euler's formula
   comes from, and why a polynomial of degree n has exactly n roots once you
   stop insisting they be real.

   Prefix: cn.  A complex number is {re, im} — the same shape 41-complex.js
   uses — so everything here composes with cxAdd/cxMul/cxExp/cxAbs rather than
   restating them.  Nothing in this file re-implements an operation that file
   already has.

   Every claim below is computed twice, and the two routes share nothing:

     the roots of a polynomial   Aberth's iteration    against Vieta's formulas,
                                                       which rebuild the
                                                       coefficients from the
                                                       roots by multiplying out
     e^(iθ)                      the power series      against cos θ + i sin θ
     z^n                         n multiplications     against r^n∠nθ
     a sum of phasors            complex addition      against projecting the
                                                       summed WAVE onto cos and
                                                       sin by quadrature
   ============================================================================ */

/* ---- reading a complex number a reader typed ------------------------------
   "3 - 2i", "-i", "2i", "1/2 + (3/4)i", "pi - i*e".  The coefficients go
   through mathNum (10-math), so an expression is allowed wherever a number is
   — which is the same rule every other typed box on the site follows, and the
   reason this does not have its own arithmetic parser.

   The split is on top-level + and −, not on every one of them: "e^(-2)" and
   "3*(1 - 4)i" both contain signs that are not term boundaries.  Depth counting
   is what makes the difference, and a caret is NOT a boundary either. */
function cnSplitTerms(s){
  const t = String(s).replace(/−/g, '-').replace(/[×·]/g, '*').trim();
  const out = [];
  let depth = 0, start = 0;
  for(let k = 0; k < t.length; k++){
    const c = t[k];
    if(c === '(') depth++;
    else if(c === ')') depth--;
    else if((c === '+' || c === '-') && depth === 0 && k > start){
      /* an exponent sign is part of the exponent: e^-2, 1e-3 */
      const p = t[k - 1];
      if(p === '^' || p === 'e' || p === 'E' || p === '*' || p === '/') continue;
      out.push(t.slice(start, k));
      start = k;
    }
  }
  out.push(t.slice(start));
  return out.map(x => x.trim()).filter(x => x.length);
}

/* One term: does it carry an i, and what is in front of it?  The i may be
   written first ("i·3"), last ("3i"), or be the whole term ("-i"). */
function cnTerm(term){
  const t = term.replace(/\s+/g, '');
  const sign = t[0] === '-' ? -1 : 1;
  let body = (t[0] === '+' || t[0] === '-') ? t.slice(1) : t;
  /* an i that is a VARIABLE name inside a longer word is not the unit */
  const hasI = /(?:^|[^A-Za-z])i(?![A-Za-z0-9])/.test(body) || body === 'i';
  if(!hasI){
    const v = mathNum(body);
    return Number.isFinite(v) ? { ok:true, re:sign * v, im:0 } : { ok:false, why:body };
  }
  /* strip the unit and whatever multiplication sign held it on */
  let co = body.replace(/(?:^|[^A-Za-z])i(?![A-Za-z0-9])/, m => m.length > 1 ? m[0] : '');
  co = co.replace(/[*\/]\s*$/, '').replace(/^\s*\*/, '').trim();
  if(co === '' || co === '+') return { ok:true, re:0, im:sign };
  if(/^\//.test(co)){                       // "i/2"
    const v = mathNum('1' + co);
    return Number.isFinite(v) ? { ok:true, re:0, im:sign * v } : { ok:false, why:body };
  }
  const v = mathNum(co);
  return Number.isFinite(v) ? { ok:true, re:0, im:sign * v } : { ok:false, why:body };
}

function cnParse(s){
  const txt = String(s == null ? '' : s).trim();
  if(!txt) return { ok:false, z:cx(0, 0), why:'nothing typed' };
  let re = 0, im = 0;
  const terms = cnSplitTerms(txt);
  for(const term of terms){
    const T = cnTerm(term);
    if(!T.ok) return { ok:false, z:cx(0, 0), why:'cannot read "' + T.why + '"' };
    re += T.re; im += T.im;
  }
  if(!Number.isFinite(re) || !Number.isFinite(im))
    return { ok:false, z:cx(0, 0), why:'that is not a finite number' };
  return { ok:true, z:cx(re, im), why:'' };
}

/* the display form, with the sign carried into the join so nothing prints
   "3 + -2i" — and U+2212 for the minus, because SITE-RULES 1.7 */
function cnFmt(z, sig){
  const g = sig || 4, a = fmtNum(z.re, g);
  if(Math.abs(z.im) < 1e-14) return a;
  const b = fmtNum(Math.abs(z.im), g);
  const unit = (b === '1') ? 'i' : b + 'i';
  if(Math.abs(z.re) < 1e-14) return (z.im < 0 ? '−' : '') + unit;
  return a + (z.im < 0 ? ' − ' : ' + ') + unit;
}

/* the editable form — fmtEdit, never fmtNum, because this one goes back into a
   box the reader types in and parseFloat cannot read a U+2212 (see CLAUDE.md) */
function cnFmtEdit(z, sig){
  const g = sig || 6, a = fmtEdit(z.re, g);
  if(Math.abs(z.im) < 1e-14) return a;
  const b = fmtEdit(Math.abs(z.im), g);
  return a + (z.im < 0 ? ' - ' : ' + ') + b + 'i';
}

/* ---- multiplication as a rotation, measured -------------------------------
   The claim every course makes and few check: multiplying by z scales by |z|
   and turns by arg z.  Both halves are measured here against the product
   computed componentwise, which knows nothing about polar form. */
function cnMulPolar(a, b){
  const prod = cxMul(a, b);
  const ra = cxAbs(a), rb = cxAbs(b);
  const polar = { re:ra * rb * Math.cos(cxArg(a) + cxArg(b)),
                  im:ra * rb * Math.sin(cxArg(a) + cxArg(b)) };
  const gross = ra * rb;                       /* what a cancellation cancelled */
  return { prod, polar, gross,
           gap:cxAbs(cxSub(prod, polar)),
           modGap:Math.abs(cxAbs(prod) - ra * rb),
           /* arguments live on a circle: 179 degrees and -181 are the same */
           argGap:Math.abs(cnWrapPi(cxArg(prod) - (cxArg(a) + cxArg(b)))) };
}

/* the difference of two angles, brought into (-pi, pi] — without this every
   product whose argument crosses the branch cut reports a gap of 2pi and the
   claim looks false exactly where it is most interesting */
function cnWrapPi(t){
  let x = t;
  while(x >  Math.PI) x -= 2 * Math.PI;
  while(x <= -Math.PI) x += 2 * Math.PI;
  return x;
}

/* ---- de Moivre ------------------------------------------------------------
   z^n by n honest multiplications, against r^n(cos nθ + i sin nθ).  The first
   route is what a reader would do by hand; the second is the theorem.  They
   are not the same computation, and for large n they do not even have the same
   error: repeated multiplication accumulates round-off linearly in n. */
function cnPowerTwo(z, n){
  let acc = cx(1, 0);
  for(let k = 0; k < Math.abs(n); k++) acc = cxMul(acc, z);
  if(n < 0) acc = cxDiv(cx(1, 0), acc);
  const r = Math.pow(cxAbs(z), n), th = cxArg(z) * n;
  const moivre = { re:r * Math.cos(th), im:r * Math.sin(th) };
  return { repeated:acc, moivre, gap:cxAbs(cxSub(acc, moivre)), gross:Math.abs(r) };
}

/* ---- Euler's formula as a SERIES ------------------------------------------
   e^(iθ) = Σ (iθ)^k/k!.  Summing it and watching the real part become cos and
   the imaginary part become sin is the derivation; asserting Euler's formula
   and then "verifying" it with cxExp — which is DEFINED as e^x(cos y + i sin y)
   — would be a tautology, and that is the trap this function exists to avoid.
   Nothing here calls cxExp. */
function cnExpSeries(theta, n){
  let term = cx(1, 0), sum = cx(1, 0);
  const partials = [cx(1, 0)];
  for(let k = 1; k <= n; k++){
    term = cxScale(cxMul(term, cx(0, theta)), 1 / k);
    sum = cxAdd(sum, term);
    partials.push(sum);
  }
  const truth = cx(Math.cos(theta), Math.sin(theta));
  return { sum, partials, truth, gap:cxAbs(cxSub(sum, truth)),
           gross:Math.exp(Math.abs(theta)),   /* the sum of the ABSOLUTE terms */
           lastTerm:cxAbs(term) };
}

/* ---- polynomials ----------------------------------------------------------
   Coefficients are complex, HIGHEST POWER FIRST, which is the order they are
   written in.  cnPolyEval is Horner: n multiplications, no powers formed. */
function cnPolyEval(c, z){
  let acc = cx(0, 0);
  for(let k = 0; k < c.length; k++) acc = cxAdd(cxMul(acc, z), c[k]);
  return acc;
}

/* the scale a residual of p(z) has to be read against: evaluating the same
   polynomial with every sign made positive.  |p(z)| = 1e-9 means one thing on
   a polynomial whose terms are of order 1 and another on one whose terms are
   of order 1e12, and without this the root of the second looks worse than the
   root of the first (SITE-RULES 2.1). */
function cnPolyGross(c, z){
  let acc = 0;
  const r = cxAbs(z);
  for(let k = 0; k < c.length; k++) acc = acc * r + cxAbs(c[k]);
  return acc;
}

/* Aberth–Ehrlich.  Every root is refined at once, each one shielded from the
   others by the sum term — which is what stops all of them collapsing onto the
   same root, the failure mode of running Newton n times from n starting points.
   The starting circle is the Cauchy bound, so every root is inside it. */
function cnPolyRoots(coeffs, iters){
  const c = coeffs.slice();
  while(c.length && cxAbs(c[0]) < 1e-300) c.shift();        // drop leading zeros
  const n = c.length - 1;
  if(n < 1) return { ok:false, roots:[], why:'that is a constant, not a polynomial' };
  /* Cauchy's bound: every root lies inside 1 + max|c_k/c_0| */
  let big = 0;
  for(let k = 1; k <= n; k++) big = Math.max(big, cxAbs(c[k]) / cxAbs(c[0]));
  const R = 1 + big;
  const roots = [];
  for(let k = 0; k < n; k++){
    /* offset by 0.5 so no start sits on the real axis, where a real polynomial
       has a symmetry that can trap the iteration */
    const th = 2 * Math.PI * (k + 0.5) / n + 0.25;
    roots.push({ re:0.4 * R * Math.cos(th), im:0.4 * R * Math.sin(th) });
  }
  /* the derivative, once */
  const d = [];
  for(let k = 0; k < n; k++) d.push(cxScale(c[k], n - k));
  const N = iters || 260;
  for(let it = 0; it < N; it++){
    let moved = 0;
    const next = roots.slice();
    for(let k = 0; k < n; k++){
      const z = roots[k];
      const pv = cnPolyEval(c, z), dv = cnPolyEval(d, z);
      if(cxAbs(dv) < 1e-300) continue;
      const nw = cxDiv(pv, dv);                 // the Newton step
      let s = cx(0, 0);
      for(let j = 0; j < n; j++){
        if(j === k) continue;
        const dz = cxSub(z, roots[j]);
        if(cxAbs(dz) < 1e-300) continue;
        s = cxAdd(s, cxDiv(cx(1, 0), dz));
      }
      const den = cxSub(cx(1, 0), cxMul(nw, s));
      if(cxAbs(den) < 1e-300) continue;
      const step = cxDiv(nw, den);
      next[k] = cxSub(z, step);
      moved = Math.max(moved, cxAbs(step));
    }
    for(let k = 0; k < n; k++) roots[k] = next[k];
    if(moved < 1e-15 * (1 + R)) break;
  }
  /* a stable order, so a table can declare "the third root" and mean it */
  roots.sort((p, q) => (cxArg(p) - cxArg(q)) || (cxAbs(p) - cxAbs(q)));
  return { ok:true, roots, degree:n, bound:R, why:'' };
}

/* THE SECOND ROUTE, and it shares nothing with the first: multiply the factors
   (z − r_k) back out and compare the coefficients.  Aberth never forms a
   product of factors and Vieta never evaluates the polynomial, so agreement is
   evidence rather than arithmetic restated. */
function cnVieta(coeffs, roots){
  const c = coeffs.slice();
  while(c.length && cxAbs(c[0]) < 1e-300) c.shift();
  let poly = [cx(1, 0)];
  for(const r of roots){
    const out = [cx(0, 0)];
    for(let k = 0; k < poly.length; k++){
      out[k] = cxAdd(out[k] || cx(0, 0), poly[k]);
      out[k + 1] = cxSub(out[k + 1] || cx(0, 0), cxMul(poly[k], r));
    }
    poly = out;
  }
  /* the rebuilt polynomial is monic; scale it by the leading coefficient */
  const lead = c[0];
  const rebuilt = poly.map(t => cxMul(t, lead));
  let gap = 0, gross = 0;
  for(let k = 0; k < c.length; k++){
    gap = Math.max(gap, cxAbs(cxSub(c[k], rebuilt[k] || cx(0, 0))));
    gross = Math.max(gross, cxAbs(c[k]));
  }
  /* and the two headline symmetric functions, which a reader can check by eye */
  let sum = cx(0, 0), prod = cx(1, 0);
  for(const r of roots){ sum = cxAdd(sum, r); prod = cxMul(prod, r); }
  const n = c.length - 1;
  const sumSaid = cxScale(cxDiv(c[1] || cx(0, 0), lead), -1);
  const prodSaid = cxScale(cxDiv(c[n] || cx(0, 0), lead), (n % 2) ? -1 : 1);
  return { rebuilt, gap, gross:Math.max(gross, 1e-300),
           sum, prod, sumSaid, prodSaid,
           sumGap:cxAbs(cxSub(sum, sumSaid)), prodGap:cxAbs(cxSub(prod, prodSaid)) };
}

/* ---- how well a root CAN be known ----------------------------------------
   A root of multiplicity m is conditioned like ε^(1/m), not like ε: near a
   double root p behaves like (z − r)², so a perturbation of size ε in the
   coefficients moves the root by √ε ≈ 1.5×10⁻⁸.  This is the mathematics, not
   the root finder — Newton, Aberth, companion-matrix eigenvalues and exact
   rational arithmetic followed by a floating-point square root all hit the same
   wall — and the first version of this module's tests asserted 10⁻¹⁰ on
   (z² + z + 1)² and failed at 1.3×10⁻⁸, which is √ε to within a factor of ten.

   So the accuracy a panel may claim is DERIVED from the multiplicity rather
   than assumed, and the multiplicity is measured by clustering rather than
   declared.  The threshold is the one place a constant is unavoidable, and it
   is chosen where the two populations are furthest apart: two copies of one
   root sit within √ε·scale ≈ 10⁻⁸ of each other, two genuinely different roots
   of these polynomials are O(1)·scale apart, so anything in between separates
   them — 10⁻⁵ is three orders clear of the first and five clear of the second.
   A polynomial with two roots one part in 10⁶ apart would defeat it, and would
   defeat every other method too; the panel says which reading it took. */
function cnMultiplicity(roots, scale){
  const s = Math.max(1e-300, scale || 1);
  const tol = 1e-5 * s;
  const used = roots.map(() => false), groups = [];
  for(let k = 0; k < roots.length; k++){
    if(used[k]) continue;
    const g = [roots[k]];
    used[k] = true;
    for(let j = k + 1; j < roots.length; j++){
      if(used[j]) continue;
      if(cxAbs(cxSub(roots[j], roots[k])) <= tol){ g.push(roots[j]); used[j] = true; }
    }
    /* the centre of a cluster is a better root than any member of it: the
       errors are spread round the true root like the m-th roots of ε */
    let c = cx(0, 0);
    for(const z of g) c = cxAdd(c, z);
    groups.push({ at:cxScale(c, 1 / g.length), m:g.length, spread:
      g.reduce((mx, z) => Math.max(mx, cxAbs(cxSub(z, cxScale(c, 1 / g.length)))), 0) });
  }
  const maxM = groups.reduce((mx, g) => Math.max(mx, g.m), 1);
  return { groups, maxM,
           /* what any method can promise on this polynomial */
           expected:Math.pow(2.22e-16, 1 / maxM) };
}

/* what the stage prints: the roots, how well each satisfies the equation, and
   the Vieta cross-check — all in one call, because a panel that asks for these
   separately is a panel that can be given inconsistent ones */
function cnPolyMeasure(coeffs){
  const R = cnPolyRoots(coeffs);
  if(!R.ok) return { ok:false, why:R.why, roots:[] };
  let worst = 0, worstGross = 1e-300;
  const resid = R.roots.map(z => {
    const v = cxAbs(cnPolyEval(coeffs, z)), g = cnPolyGross(coeffs, z);
    if(v / Math.max(1e-300, g) > worst / worstGross){ worst = v; worstGross = g; }
    return { z, res:v, gross:g };
  });
  const V = cnVieta(coeffs, R.roots);
  /* how many roots are real, and how many come in conjugate pairs — the two
     facts a reader of a REAL polynomial can check without any of this */
  const M = cnMultiplicity(R.roots, R.bound);
  /* "is this root real?" is a question about a number that is only known to
     `expected` in the first place, so the test has to be at least that loose —
     at 10⁻⁸ a double root sitting on the axis would be reported as a conjugate
     pair 10⁻⁸ apart, which is a statement about round-off, not about the
     polynomial */
  const tol = Math.max(1e-8, 4 * M.expected) * Math.max(1, R.bound);
  const real = R.roots.filter(z => Math.abs(z.im) <= tol).length;
  return { ok:true, roots:R.roots, degree:R.degree, bound:R.bound,
           resid, worst, worstGross, vieta:V, real,
           mult:M.maxM, groups:M.groups, expected:M.expected * Math.max(1, R.bound),
           why:'' };
}

/* a real polynomial's non-real roots come in conjugate PAIRS.  This is not a
   convention: p(z̄) = conj(p(z)) when every coefficient is real, so z being a
   root forces z̄ to be one.  Measured by pairing them up, not asserted. */
function cnConjugatePairs(coeffs, roots){
  const allReal = coeffs.every(c => Math.abs(c.im) < 1e-14);
  if(!allReal) return { applies:false, worst:0, why:'the coefficients are not all real' };
  let worst = 0, scale = 1e-300;
  for(const z of roots){
    if(Math.abs(z.im) < 1e-12) continue;
    let best = Infinity;
    for(const w of roots) best = Math.min(best, cxAbs(cxSub(w, cxConj(z))));
    worst = Math.max(worst, best);
    scale = Math.max(scale, cxAbs(z));
  }
  return { applies:true, worst, scale, why:'' };
}

/* ---- phasors --------------------------------------------------------------
   A sum of sinusoids at ONE frequency is a sinusoid at that frequency, and the
   complex plane is where that stops being a trigonometric identity and becomes
   vector addition.  Route A adds the complex numbers.  Route B never forms a
   complex number at all: it samples the summed wave over one period and pulls
   the amplitude and phase out by projecting onto cos and sin — a quadrature,
   with its own truncation error, which is why the tolerance below is set from
   the measured error of the rule rather than from a guess. */
function cnPhasorSum(list){
  let z = cx(0, 0);
  for(const p of list) z = cxAdd(z, { re:p.amp * Math.cos(p.phase), im:p.amp * Math.sin(p.phase) });
  /* Route B: the wave, sampled.  A trapezoid on a periodic integrand is
     spectrally accurate — this is the one place where "just use the trapezoid"
     is the sophisticated choice rather than the lazy one. */
  const N = 2048;
  let ic = 0, is = 0;
  for(let k = 0; k < N; k++){
    const t = 2 * Math.PI * k / N;
    let y = 0;
    for(const p of list) y += p.amp * Math.cos(t + p.phase);
    ic += y * Math.cos(t); is += y * Math.sin(t);
  }
  const fitted = { re:2 * ic / N, im:-2 * is / N };
  const gross = list.reduce((s, p) => s + Math.abs(p.amp), 0);
  return { z, fitted, gross:Math.max(gross, 1e-300),
           gap:cxAbs(cxSub(z, fitted)),
           amp:cxAbs(z), phase:cxArg(z) };
}

/* ---- the presets ----------------------------------------------------------
   Each declares something a route below RECOMPUTES: `degree`, `real` (how many
   roots are real), and `unit` (how many sit on the unit circle).  ./auditclaims
   checks all three by a route that never reads the declaration. */
const CN_POLYS = {
  unity3:  { name:'z³ − 1', short:'z³ = 1', coeffs:'1 0 0 -1', degree:3, real:1, unit:3, mult:1,
             why:'The three cube roots of one, equally spaced round the unit circle. Only one of them is real, which is exactly why the real numbers could not answer this question.' },
  unity5:  { name:'z⁵ − 1', short:'z⁵ = 1', coeffs:'1 0 0 0 0 -1', degree:5, real:1, unit:5, mult:1,
             why:'Five points on the circle at 72° apart. The regular pentagon is a statement about a polynomial, which is the observation Gauss built a career on.' },
  quad:    { name:'z² + z + 1', short:'no real root', coeffs:'1 1 1', degree:2, real:0, unit:2, mult:1,
             why:'The discriminant is −3. Over the reals this equation has no solution at all; over ℂ it has two, and they are a conjugate pair on the unit circle.' },
  cubic:   { name:'z³ − 6z² + 11z − 6', short:'three real', coeffs:'1 -6 11 -6', degree:3, real:3, unit:1, mult:1,
             why:'Roots 1, 2 and 3 — a reminder that going complex costs nothing when the answer was real all along. Vieta reads the sum as 6 and the product as 6 straight off the coefficients.' },
  mixed:   { name:'z⁴ − 1', short:'z⁴ = 1', coeffs:'1 0 0 0 -1', degree:4, real:2, unit:4, mult:1,
             why:'Two real roots (±1) and two imaginary ones (±i). The four fourth-roots of unity are the corners of a square, and multiplying by i is the quarter-turn that walks round it.' },
  hard:    { name:'z⁴ + 2z³ + 3z² + 2z + 1', short:'a repeated pair', coeffs:'1 2 3 2 1', degree:4, real:0, unit:4, mult:2,
             why:'(z² + z + 1)² — a REPEATED pair of roots, which is where a root finder earns its keep: Newton loses its quadratic convergence at a double root and Aberth still lands on both.' },
  complexc:{ name:'z² − (3+i)z + (2+2i)', short:'complex coefficients', coeffs:'1 -3-1i 2+2i', degree:2, real:1, unit:0, mult:1,
             why:'The coefficients are themselves complex, so the conjugate-pair rule does NOT apply — and the panel says so rather than quietly pairing roots that are not pairs. The roots are 1+i and 2.' }
};

/* pairs to multiply, each declaring what the product's modulus and argument
   should be — recomputed from the components, which know no polar form */
const CN_PAIRS = {
  turn:   { name:'multiplying by i', short:'× i', pair:'a quarter turn', a:'2 + 1i', b:'i',
            why:'Multiplying by i turns the plane a quarter turn and changes nothing else — |i| = 1, arg i = 90°. Four of them get you back where you started, which is what i⁴ = 1 means geometrically.' },
  scale:  { name:'a pure stretch', short:'× 2', pair:'a real multiplier', a:'1 + 2i', b:'2',
            why:'A real multiplier has argument 0, so it scales and does not turn. Real multiplication is the special case of complex multiplication that fixes the axis.' },
  both:   { name:'stretch and turn', short:'× (1+i)', pair:'both at once', a:'2 - 1i', b:'1 + 1i',
            why:'|1+i| = √2 and arg(1+i) = 45°, so this scales by 1.414 and turns by an eighth of a turn. The two effects are independent and the panel measures each.' },
  root:   { name:'a root of unity', short:'× e^(2πi/3)', pair:'on the unit circle', a:'1.5 + 0.5i', b:'-0.5 + 0.8660254037844386i',
            why:'Multiplier of modulus exactly 1 and argument exactly 120°: three of them return any number to itself, however it started.' },
  shrink: { name:'inside the unit circle', short:'× 0.4∠150°', pair:'inside the circle', a:'-1 + 2i', b:'-0.34641016151377546 + 0.2i',
            why:'Modulus below 1, so repeated multiplication spirals inward. This is the whole of why |z| < 1 is the condition for a geometric series to converge, in one picture.' }
};

/* phasor sets at one frequency: the sum is claimed, and measured twice */
const CN_PHASORS = {
  quarter: { name:'two waves a quarter cycle apart', short:'90° apart',
             parts:[{ amp:1, phase:0 }, { amp:1, phase:Math.PI / 2 }],
             why:'Two equal waves 90° apart add to one wave of amplitude √2 at 45°. Adding the two cosines by a trigonometric identity is a page of algebra; adding the two arrows is a triangle.' },
  cancel:  { name:'antiphase', short:'180° apart',
             parts:[{ amp:1, phase:0 }, { amp:1, phase:Math.PI }],
             why:'Equal and opposite: the sum is exactly zero, and both routes have to produce zero from numbers that are not zero. This is the case where a residual needs the gross to mean anything at all.' },
  three:   { name:'three-phase', short:'120° apart',
             parts:[{ amp:1, phase:0 }, { amp:1, phase:2 * Math.PI / 3 }, { amp:1, phase:4 * Math.PI / 3 }],
             why:'The three phases of a mains supply sum to zero at every instant — which is why the neutral wire of a balanced three-phase load carries no current. Three unit vectors at 120° close a triangle.' },
  uneven:  { name:'unequal amplitudes', short:'3 and 1',
             parts:[{ amp:3, phase:0 }, { amp:1, phase:2.2 }],
             why:'Nothing tidy: the sum is neither in phase with either part nor of any memorable amplitude, which is the ordinary case and the reason the arrow picture is worth having.' },
  beatish: { name:'four small contributions', short:'four arrows',
             parts:[{ amp:0.6, phase:0.3 }, { amp:0.9, phase:1.1 }, { amp:0.4, phase:2.9 }, { amp:0.7, phase:-1.4 }],
             why:'Four arrows laid nose to tail. Interference in the double slit, the structure factor of a crystal and the Fourier coefficient of a signal are all this sum with different names on the arrows.' }
};

/* the coefficient list a preset stores is text, because it is the same text the
   reader edits — one source of truth, so a preset cannot drift from the box */
function cnCoeffsParse(s){
  const parts = String(s == null ? '' : s).trim().split(/[\s,]+/).filter(x => x.length);
  if(!parts.length) return { ok:false, c:[], why:'nothing typed' };
  if(parts.length > 13) return { ok:false, c:[], why:'that is more than twelve coefficients' };
  const c = [];
  for(const p of parts){
    const P = cnParse(p);
    if(!P.ok) return { ok:false, c:[], why:P.why };
    c.push(P.z);
  }
  if(cxAbs(c[0]) < 1e-300) return { ok:false, c:[], why:'the leading coefficient is zero' };
  return { ok:true, c, why:'' };
}
