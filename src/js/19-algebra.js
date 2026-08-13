/* ============================================================================
   2b · ALGEBRA, FUNCTIONS AND TRIGONOMETRY ENGINE
   The material every later floor assumes. Nothing here is quoted: a quadratic
   is solved by completing the square and the formula is *derived* from that;
   a factorisation is found by root-searching and then verified by expanding.

   Prefix: ag
   ============================================================================ */

/* ---- quadratics, by completing the square -------------------------------- */
/* Returns the whole chain, not just the roots, so the derivation ladder can
   show each stage of it with the reader's own a, b, c substituted. */
function agQuadratic(a, b, c){
  if(Math.abs(a) < 1e-14) {
    return { degenerate:true, linear:true, root:(Math.abs(b) < 1e-14 ? null : -c / b) };
  }
  const h = -b / (2 * a);              // vertex x — the axis of symmetry
  const k = c - b * b / (4 * a);       // vertex y
  const disc = b * b - 4 * a * c;
  const out = { a, b, c, h, k, disc, vertex:{ x:h, y:k } };
  if(disc > 1e-14){
    const s = Math.sqrt(disc);
    out.kind = 'two real roots';
    out.roots = [(-b - s) / (2 * a), (-b + s) / (2 * a)];
  } else if(disc < -1e-14){
    out.kind = 'a complex conjugate pair';
    out.roots = [];
    out.re = h; out.im = Math.sqrt(-disc) / (2 * a);
  } else {
    out.kind = 'one repeated root';
    out.roots = [h];
  }
  /* the factored form, and a check that expanding it returns the original */
  if(out.roots && out.roots.length === 2){
    const [r1, r2] = out.roots;
    out.expandCheck = { b:-a * (r1 + r2), c:a * r1 * r2 };
  } else if(out.roots && out.roots.length === 1){
    out.expandCheck = { b:-2 * a * out.roots[0], c:a * out.roots[0] * out.roots[0] };
  }
  /* Vieta: sum and product of the roots straight from the coefficients */
  out.sum = -b / a; out.product = c / a;
  return out;
}

/* ---- polynomials --------------------------------------------------------- */
const agPolyAt = (co, x) => co.reduce((s, c, i) => s + c * Math.pow(x, i), 0);
/* Horner's scheme — the same arithmetic as synthetic division, and the reason
   dividing by (x − r) and evaluating at r are the same operation */
function agHorner(co, r){
  const n = co.length;
  const out = new Array(n - 1);
  let acc = co[n - 1];
  for(let i = n - 2; i >= 0; i--){ out[i] = acc; acc = co[i] + acc * r; }
  return { quotient:out, remainder:acc };
}
/* every real root, by scanning for sign changes and then bisecting */
function agPolyRoots(co, lo, hi, n){
  const N = n || 2000, a = lo === undefined ? -12 : lo, b = hi === undefined ? 12 : hi;
  const f = x => agPolyAt(co, x);
  const found = [];
  let prev = f(a);
  for(let i = 1; i <= N; i++){
    const x = a + (b - a) * i / N, v = f(x);
    if(Math.abs(prev) < 1e-13 && !found.some(r => Math.abs(r - (x - (b - a) / N)) < 1e-7))
      found.push(x - (b - a) / N);
    else if(prev * v < 0){
      let l = x - (b - a) / N, r = x;
      for(let k = 0; k < 90; k++){
        const m = (l + r) / 2;
        if(f(l) * f(m) <= 0) r = m; else l = m;
      }
      const root = (l + r) / 2;
      if(!found.some(q => Math.abs(q - root) < 1e-7)) found.push(root);
    }
    prev = v;
  }
  return found;
}
/* the rational-root candidates p/q — the theorem is a search space, not an answer */
function agRationalRoots(co){
  const divisors = n => {
    const m = Math.abs(Math.round(n)), out = [];
    if(!m) return [1];
    for(let i = 1; i <= m; i++) if(m % i === 0) out.push(i);
    return out;
  };
  const a0 = co[0], an = co[co.length - 1];
  if(!Number.isInteger(a0) || !Number.isInteger(an) || a0 === 0) return null;
  const cand = new Set();
  for(const p of divisors(a0)) for(const q of divisors(an)){
    cand.add(p / q); cand.add(-p / q);
  }
  const list = [...cand].sort((x, y) => x - y);
  return { candidates:list, actual:list.filter(r => Math.abs(agPolyAt(co, r)) < 1e-9) };
}
/* end behaviour and asymptotes of a rational function p/q */
function agRational(num, den){
  const dn = num.length - 1, dd = den.length - 1;
  const lead = num[num.length - 1] / den[den.length - 1];
  let asym;
  if(dn < dd) asym = { kind:'horizontal', y:0, text:'y = 0 — the denominator wins' };
  else if(dn === dd) asym = { kind:'horizontal', y:lead, text:'y = ' + fmtNum(lead, 4) + ' — the ratio of leading coefficients' };
  else if(dn === dd + 1) asym = { kind:'slant', text:'a slant asymptote — divide to find it' };
  else asym = { kind:'none', text:'no horizontal or slant asymptote — it grows without bound' };
  const poles = agPolyRoots(den, -20, 20).filter(r => Math.abs(agPolyAt(num, r)) > 1e-7);
  const holes = agPolyRoots(den, -20, 20).filter(r => Math.abs(agPolyAt(num, r)) <= 1e-7);
  return { asym, poles, holes, f:x => agPolyAt(num, x) / agPolyAt(den, x) };
}

/* ---- exponentials and logarithms ----------------------------------------- */
/* The three laws, each stated as an identity that can be checked numerically
   rather than remembered. */
function agLogLaws(x, y, b){
  const B = b || Math.E, L = v => Math.log(v) / Math.log(B);
  return {
    product:{ lhs:L(x * y),      rhs:L(x) + L(y) },
    quotient:{ lhs:L(x / y),     rhs:L(x) - L(y) },
    power:{ lhs:L(Math.pow(x, 3)), rhs:3 * L(x) },
    change:{ lhs:L(x), rhs:Math.log(x) / Math.log(B) }
  };
}
const agLogBase = (x, b) => Math.log(x) / Math.log(b);

/* ---- trigonometry -------------------------------------------------------- */
/* The unit circle is the definition; everything else is read off it. */
function agUnitCircle(th){
  const c = Math.cos(th), s = Math.sin(th);
  return {
    theta:th, deg:th * 180 / Math.PI, cos:c, sin:s,
    tan:Math.abs(c) < 1e-12 ? null : s / c,
    sec:Math.abs(c) < 1e-12 ? null : 1 / c,
    csc:Math.abs(s) < 1e-12 ? null : 1 / s,
    cot:Math.abs(s) < 1e-12 ? null : c / s,
    pythag:c * c + s * s,                 // must be 1, and is checked not assumed
    quadrant:(s >= 0 ? (c >= 0 ? 1 : 2) : (c < 0 ? 3 : 4))
  };
}
/* the exact-value table, as fractions of π with their surd values */
const AG_EXACT = [
  { th:0,               name:'0',     cos:'1',    sin:'0' },
  { th:Math.PI / 6,     name:'π/6',   cos:'√3/2', sin:'1/2' },
  { th:Math.PI / 4,     name:'π/4',   cos:'√2/2', sin:'√2/2' },
  { th:Math.PI / 3,     name:'π/3',   cos:'1/2',  sin:'√3/2' },
  { th:Math.PI / 2,     name:'π/2',   cos:'0',    sin:'1' },
  { th:2 * Math.PI / 3, name:'2π/3',  cos:'−1/2', sin:'√3/2' },
  { th:3 * Math.PI / 4, name:'3π/4',  cos:'−√2/2',sin:'√2/2' },
  { th:5 * Math.PI / 6, name:'5π/6',  cos:'−√3/2',sin:'1/2' },
  { th:Math.PI,         name:'π',     cos:'−1',   sin:'0' }
];
/* the identities worth having, each checked at the given angles */
function agIdentities(a, b){
  return [
    { n:'sin² + cos² = 1',          lhs:Math.sin(a) ** 2 + Math.cos(a) ** 2, rhs:1 },
    { n:'sin(a+b) = sin a cos b + cos a sin b',
      lhs:Math.sin(a + b), rhs:Math.sin(a) * Math.cos(b) + Math.cos(a) * Math.sin(b) },
    { n:'cos(a+b) = cos a cos b − sin a sin b',
      lhs:Math.cos(a + b), rhs:Math.cos(a) * Math.cos(b) - Math.sin(a) * Math.sin(b) },
    { n:'sin 2a = 2 sin a cos a',   lhs:Math.sin(2 * a), rhs:2 * Math.sin(a) * Math.cos(a) },
    { n:'cos 2a = cos²a − sin²a',   lhs:Math.cos(2 * a), rhs:Math.cos(a) ** 2 - Math.sin(a) ** 2 },
    { n:'cos²a = (1 + cos 2a)/2',   lhs:Math.cos(a) ** 2, rhs:(1 + Math.cos(2 * a)) / 2 },
    { n:'tan(a+b) = (tan a + tan b)/(1 − tan a tan b)',
      lhs:Math.tan(a + b), rhs:(Math.tan(a) + Math.tan(b)) / (1 - Math.tan(a) * Math.tan(b)) }
  ].map(o => Object.assign(o, { diff:Math.abs(o.lhs - o.rhs) }));
}
/* laws of sines and cosines, and the ambiguous SSA case */
function agTriangle(A, b, c){
  const a = Math.sqrt(b * b + c * c - 2 * b * c * Math.cos(A));   // law of cosines
  const B = Math.asin(Math.max(-1, Math.min(1, b * Math.sin(A) / a)));
  const C = Math.PI - A - B;
  return { a, b, c, A, B, C,
    area:0.5 * b * c * Math.sin(A),
    /* the law of sines as a single constant, printed three ways so it can be
       seen to be one number rather than three coincidences */
    sines:[a / Math.sin(A), b / Math.sin(B), c / Math.sin(C)],
    angleSum:A + B + C };
}
/* a sinusoid in the form A sin(ωx + φ) + k, with its parts named */
function agSinusoid(A, w, ph, k){
  return { A, w, ph, k,
    period:2 * Math.PI / Math.abs(w),
    freq:Math.abs(w) / (2 * Math.PI),
    shift:-ph / w,
    at:x => A * Math.sin(w * x + ph) + k,
    max:k + Math.abs(A), min:k - Math.abs(A) };
}
/* the harmonic-addition identity: a cos + b sin is a single shifted sinusoid.
   This is the algebraic seed of every phasor in the circuits wing. */
function agHarmonic(a, b){
  const R = Math.hypot(a, b), ph = Math.atan2(b, a);
  return { R, ph,
    check:x => Math.abs((a * Math.cos(x) + b * Math.sin(x)) - R * Math.cos(x - ph)) };
}

/* ---- functions: composition, inverses, transformations ------------------- */
const AG_FUNCS = {
  lin:  { n:'2x − 1',        f:x => 2 * x - 1,          inv:y => (y + 1) / 2,      mono:true },
  sq:   { n:'x²',            f:x => x * x,              inv:y => Math.sqrt(y),     mono:false },
  cube: { n:'x³',            f:x => x * x * x,          inv:y => Math.cbrt(y),     mono:true },
  exp:  { n:'eˣ',            f:Math.exp,                inv:Math.log,              mono:true },
  ln:   { n:'ln x',          f:Math.log,                inv:Math.exp,              mono:true },
  sin:  { n:'sin x',         f:Math.sin,                inv:Math.asin,             mono:false },
  recip:{ n:'1/x',           f:x => 1 / x,              inv:y => 1 / y,            mono:false },
  sqrt: { n:'√x',            f:Math.sqrt,               inv:y => y * y,            mono:true }
};
/* is f one-to-one on [a,b]? Decided by looking for a repeated value rather
   than by asserting it — the horizontal line test, executed. */
function agOneToOne(f, a, b, n){
  const N = n || 600;
  let rising = 0, falling = 0;
  let prev = f(a);
  for(let i = 1; i <= N; i++){
    const v = f(a + (b - a) * i / N);
    if(Number.isFinite(v) && Number.isFinite(prev)){
      if(v > prev) rising++; else if(v < prev) falling++;
    }
    prev = v;
  }
  return { monotone:rising === 0 || falling === 0, rising, falling };
}
