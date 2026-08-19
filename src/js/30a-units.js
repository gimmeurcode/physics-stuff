/* ============================================================================
   2r · UNITS, DIMENSIONS & UNCERTAINTY  (Programme C wing C3)
   Every physics wing in this laboratory prints numbers to eight digits and
   nothing anywhere says which of those digits mean anything. This engine is
   what that wing computes with, and it does three separate jobs:

     dimensions   a unit expression to a vector of seven exponents, TWICE, by
                  routes that share only the tokenizer
     Pi groups    Buckingham's theorem as a null space, so the count of
                  dimensionless groups is rank-nullity and not a rule of thumb
     uncertainty  first-order propagation against a seeded Monte Carlo, with
                  the disagreement printed rather than assumed away

   The two-route structure is the point of each. A dimension vector obtained by
   adding exponents is checked by *rescaling the base units and reading the
   power law*; a Pi group obtained from a null space is checked by recomputing
   its dimensions; a linear error bar is checked by sampling. Where the routes
   disagree is where the wing has something to say.
   ============================================================================ */

/* ---- the seven base dimensions, in SI's order ---------------------------- */
const UN_BASE   = ['M', 'L', 'T', 'I', 'Θ', 'N', 'J'];
const UN_BASE_U = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd'];
const UN_NB     = 7;
const unZero    = () => [0, 0, 0, 0, 0, 0, 0];
const unDimAdd  = (a, b) => a.map((v, i) => v + b[i]);
const unDimSub  = (a, b) => a.map((v, i) => v - b[i]);
const unDimMul  = (a, k) => a.map(v => v * k);
/* exponents come out of a null space and are therefore floats; 1e-9 is far
   above the round-off of an RREF on small integers and far below any exponent
   physics uses, half-integers included */
const unDimZero = a => a.every(v => Math.abs(v) < 1e-9);
const unDimSame = (a, b) => unDimZero(unDimSub(a, b));

/* ---- the units a reader may write --------------------------------------- */
/* `d` is the dimension vector, `f` the factor that turns it into SI. Only
   units that appear somewhere in this laboratory are here; the point is not a
   complete table but that every entry is one a reader has already met. */
const UN_UNITS = {
  /* base */
  kg:{ d:[1,0,0,0,0,0,0], f:1 },        m:{ d:[0,1,0,0,0,0,0], f:1 },
  s: { d:[0,0,1,0,0,0,0], f:1 },        A:{ d:[0,0,0,1,0,0,0], f:1 },
  K: { d:[0,0,0,0,1,0,0], f:1 },      mol:{ d:[0,0,0,0,0,1,0], f:1 },
  cd:{ d:[0,0,0,0,0,0,1], f:1 },
  /* scaled masses, lengths and times a reader actually types */
  g:  { d:[1,0,0,0,0,0,0], f:1e-3 },
  u:  { d:[1,0,0,0,0,0,0], f:1.66053906892e-27 },
  cm: { d:[0,1,0,0,0,0,0], f:1e-2 },   mm:{ d:[0,1,0,0,0,0,0], f:1e-3 },
  km: { d:[0,1,0,0,0,0,0], f:1e3 },    nm:{ d:[0,1,0,0,0,0,0], f:1e-9 },
  fm: { d:[0,1,0,0,0,0,0], f:1e-15 },
  ms: { d:[0,0,1,0,0,0,0], f:1e-3 },   us:{ d:[0,0,1,0,0,0,0], f:1e-6 },
  ns: { d:[0,0,1,0,0,0,0], f:1e-9 },
  min:{ d:[0,0,1,0,0,0,0], f:60 },      h:{ d:[0,0,1,0,0,0,0], f:3600 },
  day:{ d:[0,0,1,0,0,0,0], f:86400 },  yr:{ d:[0,0,1,0,0,0,0], f:31557600 },
  /* named derived units - each one a product of the seven, and the wing's
     first observation is that there are only seven */
  N:  { d:[1,1,-2,0,0,0,0],  f:1 },
  J:  { d:[1,2,-2,0,0,0,0],  f:1 },
  W:  { d:[1,2,-3,0,0,0,0],  f:1 },
  Pa: { d:[1,-1,-2,0,0,0,0], f:1 },
  Hz: { d:[0,0,-1,0,0,0,0],  f:1 },
  C:  { d:[0,0,1,1,0,0,0],   f:1 },
  V:  { d:[1,2,-3,-1,0,0,0], f:1 },
  F:  { d:[-1,-2,4,2,0,0,0], f:1 },
  ohm:{ d:[1,2,-3,-2,0,0,0], f:1 },
  S:  { d:[-1,-2,3,2,0,0,0], f:1 },
  T:  { d:[1,0,-2,-1,0,0,0], f:1 },
  Wb: { d:[1,2,-2,-1,0,0,0], f:1 },
  H:  { d:[1,2,-2,-2,0,0,0], f:1 },
  L:  { d:[0,3,0,0,0,0,0],   f:1e-3 },
  eV: { d:[1,2,-2,0,0,0,0],  f:1.602176634e-19 },
  MeV:{ d:[1,2,-2,0,0,0,0],  f:1.602176634e-13 },
  /* angles are dimensionless and this is worth being explicit about: a radian
     is a length over a length, which is why an angular frequency and a
     frequency share a dimension and do not share a meaning */
  rad:{ d:[0,0,0,0,0,0,0], f:1 },
  sr: { d:[0,0,0,0,0,0,0], f:1 }
};
/* what a reader is likely to type for the ohm and the micro prefix */
const UN_ALIAS = { Ω:'ohm', Ohm:'ohm', ohms:'ohm', µs:'us', μs:'us', sec:'s',
                   metre:'m', meter:'m', second:'s', kilogram:'kg', litre:'L', liter:'L' };

/* ---- tokenizer + parser for a unit expression ---------------------------- */
/* One parse, two evaluators. That split is the whole design: `unEvalDim` does
   vector arithmetic on exponents and `unEvalNum` does scalar arithmetic on
   ordinary numbers, and neither can see the other. A sign error in "dividing
   subtracts exponents" cannot survive being checked by actually dividing. */
function unTok(src){
  const out = [], s = String(src);
  let i = 0;
  while(i < s.length){
    const c = s[i];
    if(/\s/.test(c)){ out.push({ t:'sp' }); i++; continue; }
    if(/[0-9.]/.test(c)){
      let j = i;
      while(j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t:'num', v:parseFloat(s.slice(i, j)) }); i = j; continue;
    }
    if(/[A-Za-zΩµμ_]/.test(c)){
      let j = i; while(j < s.length && /[A-Za-z0-9Ωµμ_]/.test(s[j])) j++;
      out.push({ t:'id', v:s.slice(i, j) }); i = j; continue;
    }
    if(c === '·' || c === '×' || c === '*'){ out.push({ t:'*' }); i++; continue; }
    if('/^()'.indexOf(c) >= 0){ out.push({ t:c }); i++; continue; }
    return { ok:false, why:'"' + c + '" is not something a unit can contain' };
  }
  return { ok:true, toks:out };
}

/* expr := term ( ('*' | '/' | juxtaposition) term )*
   term := atom ( '^' exponent )?
   atom := identifier | number | '(' expr ')'
   Juxtaposition is multiplication, because "kg m s^-2" is how a physicist
   writes it and rejecting that would make the box useless. */
function unParse(src){
  const T = unTok(src);
  if(!T.ok) return { ok:false, why:T.why, d:unZero(), f:1, ast:null };
  const toks = T.toks;
  let p = 0, err = null;
  const peek = () => toks[p];
  const skipSp = () => { while(peek() && peek().t === 'sp') p++; };
  function atom(){
    skipSp();
    const k = peek();
    if(!k){ err = err || 'the expression stops early - something is missing after the last operator'; return null; }
    if(k.t === 'num'){ p++; return { k:'num', v:k.v }; }
    if(k.t === 'id'){
      p++;
      const raw = k.v, name = UN_ALIAS[raw] || raw;
      if(!UN_UNITS[name]){ err = err || '"' + raw + '" is not a unit this wing knows'; return null; }
      return { k:'unit', v:name };
    }
    if(k.t === '('){
      p++; const e = expr(); if(e === null) return null;
      skipSp();
      if(!peek() || peek().t !== ')'){ err = err || 'a bracket was opened and never closed'; return null; }
      p++; return e;
    }
    err = err || 'expected a unit here, found "' + (k.v !== undefined ? k.v : k.t) + '"';
    return null;
  }
  /* -2, (-2), (1/2) and 2 are all legal, and the fraction matters: the square
     root of a dimension is a half-integer exponent, which is exactly what
     appears in the pendulum's root(L/g) */
  function exponent(){
    skipSp();
    let neg = false;
    if(peek() && peek().t === 'id' && peek().v === 'neg'){ p++; neg = true; skipSp(); }
    if(peek() && peek().t === '('){
      p++; skipSp();
      let inner = false;
      if(peek() && peek().t === 'id' && peek().v === 'neg'){ p++; inner = true; skipSp(); }
      if(!peek() || peek().t !== 'num'){ err = err || 'the exponent bracket has no number in it'; return null; }
      let num = peek().v; p++;
      skipSp();
      if(peek() && peek().t === '/'){
        p++; skipSp();
        if(!peek() || peek().t !== 'num'){ err = err || 'a fractional exponent needs a number under the bar'; return null; }
        num = num / peek().v; p++;
        skipSp();
      }
      if(!peek() || peek().t !== ')'){ err = err || 'the exponent bracket was never closed'; return null; }
      p++;
      return num * (neg || inner ? -1 : 1);
    }
    if(peek() && peek().t === 'num'){ const v = peek().v; p++; return v * (neg ? -1 : 1); }
    err = err || 'an exponent must be a number - write s^-2 or s^(-2)';
    return null;
  }
  function term(){
    let a = atom();
    if(a === null) return null;
    skipSp();
    if(peek() && peek().t === '^'){
      p++;
      const e = exponent();
      if(e === null) return null;
      a = { k:'pow', a, e };
    }
    return a;
  }
  function expr(){
    let a = term();
    if(a === null) return null;
    for(;;){
      skipSp();
      const k = peek();
      if(!k) break;
      if(k.t === '*'){ p++; const b = term(); if(b === null) return null; a = { k:'mul', a, b }; continue; }
      if(k.t === '/'){ p++; const b = term(); if(b === null) return null; a = { k:'div', a, b }; continue; }
      if(k.t === 'id' || k.t === 'num' || k.t === '('){ const b = term(); if(b === null) return null; a = { k:'mul', a, b }; continue; }
      break;
    }
    return a;
  }
  const ast = expr();
  skipSp();
  if(!err && p < toks.length) err = 'there is something left over after "' + String(src).trim() + '" was read';
  if(err || !ast) return { ok:false, why:err || 'nothing to read', d:unZero(), f:1, ast:null };
  return { ok:true, why:'', d:unEvalDim(ast), f:unEvalSI(ast), ast };
}
/* The parser has no unary minus, because a unit expression has no subtraction
   for it to be confused with - so "s^-2" is rewritten before tokenizing. Doing
   it here rather than in the tokenizer keeps "m-1" an error. */
const unPrep = s => String(s).replace(/\^\s*-\s*\(/g, '^neg(')
                             .replace(/\^\s*-\s*/g, '^neg ')
                             .replace(/\(\s*-\s*/g, '(neg ');
const unRead = s => unParse(unPrep(s));

/* route 1 - exponent arithmetic */
function unEvalDim(nd){
  if(nd.k === 'num') return unZero();
  if(nd.k === 'unit') return UN_UNITS[nd.v].d.slice();
  if(nd.k === 'mul') return unDimAdd(unEvalDim(nd.a), unEvalDim(nd.b));
  if(nd.k === 'div') return unDimSub(unEvalDim(nd.a), unEvalDim(nd.b));
  if(nd.k === 'pow') return unDimMul(unEvalDim(nd.a), nd.e);
  return unZero();
}
/* route 2 - ordinary numbers. Give the seven base units the values in `lam`
   and evaluate; a unit expression comes out as the product of lam_i to the
   power d_i, and nothing about exponent vectors was used to get there. */
function unEvalNum(nd, lam){
  if(nd.k === 'num') return nd.v;
  if(nd.k === 'unit'){
    const U = UN_UNITS[nd.v];
    let v = 1;
    for(let i = 0; i < UN_NB; i++) v *= Math.pow(lam[i], U.d[i]);
    return v;
  }
  if(nd.k === 'mul') return unEvalNum(nd.a, lam) * unEvalNum(nd.b, lam);
  if(nd.k === 'div') return unEvalNum(nd.a, lam) / unEvalNum(nd.b, lam);
  if(nd.k === 'pow') return Math.pow(unEvalNum(nd.a, lam), nd.e);
  return 1;
}
/* the SI factor, which is what a number in these units must be multiplied by */
function unEvalSI(nd){
  if(nd.k === 'num') return nd.v;
  if(nd.k === 'unit') return UN_UNITS[nd.v].f;
  if(nd.k === 'mul') return unEvalSI(nd.a) * unEvalSI(nd.b);
  if(nd.k === 'div') return unEvalSI(nd.a) / unEvalSI(nd.b);
  if(nd.k === 'pow') return Math.pow(unEvalSI(nd.a), nd.e);
  return 1;
}

/* ---- the second route, in full ------------------------------------------
   Rescale the base units by seven independent factors, evaluate the expression
   as an ordinary number, and take logs: log v = sum d_i log lam_i. Seven such
   trials are a 7x7 linear system whose solution IS the dimension vector -
   recovered without a single exponent ever being added.

   The factors are fixed rather than random, and chosen to make the log matrix
   well conditioned: powers of seven distinct primes give rows that are
   rationally independent, so the system is never singular. A random draw would
   occasionally produce a near-singular one and a gate that fails on the second
   Tuesday of the month. */
const UN_LAM = [2, 3, 5, 7, 11, 13, 17];
function unScaleRow(k){
  return UN_LAM.map((p, i) => Math.pow(p, ((i + 2 * k) % UN_NB) + 1));
}
function unDimByScaling(ast){
  const A = [], b = [];
  for(let k = 0; k < UN_NB; k++){
    const lam = unScaleRow(k);
    A.push(lam.map(Math.log));
    b.push(Math.log(unEvalNum(ast, lam)));
  }
  const S = laSolve(A, b);
  return S.x || unZero();
}
/* the gap between the two routes, on the scale of the exponents themselves */
function unDimCheck(src){
  const P = unRead(src);
  if(!P.ok) return { ok:false, why:P.why, d:unZero(), d2:unZero(), gap:0, gross:1 };
  const d2 = unDimByScaling(P.ast);
  let gap = 0, gross = 0;
  for(let i = 0; i < UN_NB; i++){
    gap = Math.max(gap, Math.abs(P.d[i] - d2[i]));
    gross = Math.max(gross, Math.abs(P.d[i]), Math.abs(d2[i]));
  }
  return { ok:true, why:'', d:P.d, d2, gap, gross:Math.max(gross, 1), f:P.f };
}

/* ---- printing a dimension ------------------------------------------------ */
/* An exponent has to READ as an exponent — SITE-RULES §1.7, no ASCII where
   notation exists. Two attempts at this were wrong and both were caught by a
   test asserting the exact string rather than the number:

     uniSup('2')        returns '2', because uniSup lifts what follows a CARET,
                        and the whole wing printed "T2 g / L";
     uniSup('^(0.5)')   returns '^(0.5)' unchanged, because UNI_SUP has no
                        superscript full stop, so the run fails to lift and the
                        caret survives into a canvas label.

   So the decimal never appears: a half-integer is written as the fraction it is,
   using UNI_SUP's own '/' (U+141F), and the characters are mapped one at a time
   rather than through uniSup's caret grammar. Every exponent this wing produces
   is rational — a null space of a rational matrix cannot give anything else —
   so the denominator search below always terminates in the first few entries;
   the last two exist only for an exponent a reader typed by hand. */
function unSupStr(e){
  if(Math.abs(e - Math.round(e)) < 1e-9) return String(Math.round(e));
  const tol = 1e-9 * Math.max(1, Math.abs(e));
  for(const q of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 16, 100, 1000])
    if(Math.abs(e * q - Math.round(e * q)) < tol) return Math.round(e * q) + '/' + q;
  return String(Math.round(e * 1000)) + '/1000';
}
function unSup(e){
  const s = unSupStr(e);
  let o = '';
  for(const ch of s){
    const u = UNI_SUP[ch];
    if(!u) return uniSup('^(' + s + ')');
    o += u;
  }
  return o;
}
function unFmtDim(d, syms){
  const S = syms || UN_BASE;
  const parts = [];
  for(let i = 0; i < UN_NB; i++){
    if(Math.abs(d[i]) < 1e-9) continue;
    parts.push(S[i] + (Math.abs(d[i] - 1) < 1e-9 ? '' : unSup(d[i])));
  }
  return parts.length ? parts.join(' ') : 'dimensionless (1)';
}
const unFmtSI = d => {
  const s = unFmtDim(d, UN_BASE_U);
  return s === 'dimensionless (1)' ? s : s.replace(/ /g, '·');
};
/* the shortest named SI unit with these dimensions, if there is one */
function unNamed(d){
  const skip = { rad:1, sr:1 };
  let best = null;
  for(const k in UN_UNITS){
    if(skip[k] || UN_UNITS[k].f !== 1) continue;
    if(!unDimSame(UN_UNITS[k].d, d)) continue;
    if(!best || k.length < best.length) best = k;
  }
  return best;
}

/* ---- Buckingham's theorem ------------------------------------------------
   The dimension matrix has one COLUMN per variable and one ROW per base
   dimension. A product of the variables raised to powers a_j is dimensionless
   exactly when D a = 0, so the dimensionless groups are the null space of D -
   and there are n - rank D of them, which is rank-nullity and not a separate
   theorem to be memorised. */
/* `order` is an optional priority list of column indices deciding WHICH
   variable each group is oriented around — see the sign step below. It changes
   nothing mathematical: Pi and 1/Pi are the same group, and a group is only
   defined up to that. It decides whether the panel prints the drag coefficient
   or its reciprocal, which is the difference between a name a reader knows and
   an unfamiliar product of the same five symbols. */
function unPiGroups(vars, order){
  const D = [];
  for(let i = 0; i < UN_NB; i++) D.push(vars.map(v => v.d[i]));
  const rank = laRank(D);
  const basis = laNullBasis(D);
  const pri = (order && order.length === vars.length) ? order : vars.map((_, j) => j);
  /* Tidy each exponent vector: clear the fractions a null space produces, then
     fix the sign so that the highest-priority variable APPEARING IN THIS GROUP
     carries a positive power. The default priority is the order the caller
     listed them in, and callers list the quantity being solved for first — so
     the group reads T²g/L and R⁵ρ/Et² rather than their reciprocals. A caller
     with two groups and a different subject in each passes `order`.
     Neither step changes the group, both make it readable, and the residual
     below is recomputed on the TIDIED vector so a bad tidy cannot hide behind
     a check of the untidied one. */
  const groups = basis.map(v => {
    let a = v.slice();
    for(const q of [1, 2, 3, 4, 6]){
      if(a.every(x => Math.abs(x * q - Math.round(x * q)) < 1e-9)){ a = a.map(x => x * q); break; }
    }
    a = a.map(x => Math.abs(x) < 1e-9 ? 0 : x);
    let lead = 0;
    for(const j of pri) if(Math.abs(a[j]) > 1e-9){ lead = a[j]; break; }
    if(lead < 0) a = a.map(x => -x);
    let d = unZero();
    a.forEach((e, j) => { d = unDimAdd(d, unDimMul(vars[j].d, e)); });
    return { a, d, resid:Math.max.apply(null, d.map(Math.abs)) };
  });
  return { D, rank, n:vars.length, nPi:vars.length - rank, groups,
           worst:groups.length ? Math.max.apply(null, groups.map(g => g.resid)) : 0 };
}
/* a Pi group written the way it would be on paper */
function unPiText(g, vars){
  const num = [], den = [];
  g.a.forEach((e, j) => {
    if(Math.abs(e) < 1e-9) return;
    const s = vars[j].name + (Math.abs(Math.abs(e) - 1) < 1e-9 ? '' : unSup(Math.abs(e)));
    (e > 0 ? num : den).push(s);
  });
  if(!num.length && !den.length) return '1';
  if(!den.length) return num.join(' ');
  return (num.length ? num.join(' ') : '1') + ' / ' + den.join(' ');
}

/* ---- significant figures -------------------------------------------------
   Rounding to k figures is a statement about RELATIVE error and nothing else,
   which is why it is the right thing to carry when a quantity spans decades
   and the wrong thing when it is a difference of two nearly equal numbers. */
function unSigRound(x, k){
  if(!isFinite(x) || x === 0) return 0;
  const e = Math.floor(Math.log10(Math.abs(x)));
  const p = Math.pow(10, k - 1 - e);
  const r = Math.round(x * p) / p;
  /* rounding 9.97 to two figures lands on 10, one decade up, and the naive
     scale factor then leaves three figures. Re-round on the new exponent. */
  const e2 = Math.floor(Math.log10(Math.abs(r)));
  if(e2 === e) return r;
  const p2 = Math.pow(10, k - 1 - e2);
  return Math.round(x * p2) / p2;
}
/* the half-ulp bound the rounding guarantees, and the relative version of it */
function unSigBand(x, k){
  const r = unSigRound(x, k);
  if(!isFinite(r) || r === 0) return { abs:0, rel:0, rounded:0 };
  const e = Math.floor(Math.log10(Math.abs(r)));
  const abs = 0.5 * Math.pow(10, e - k + 1);
  return { abs, rel:abs / Math.abs(r), rounded:r };
}
/* how many figures a measurement with this uncertainty actually justifies:
   the first uncertain digit is the last one worth writing down */
function unSigJustified(x, dx){
  if(!(dx > 0) || !isFinite(x) || x === 0) return null;
  return Math.max(1, Math.floor(Math.log10(Math.abs(x))) - Math.floor(Math.log10(dx)) + 1);
}
/* ---- uncertainty propagation --------------------------------------------
   Two routes to the same error bar, and the gap between them is the wing's
   most useful number: first-order propagation is a linearisation, so it is
   exact for a linear f and wrong by an amount that grows with sigma and with
   the second derivative. */
function unGrad(f, xs, h){
  const g = [];
  for(let i = 0; i < xs.length; i++){
    /* the step is relative to the variable's own size, with an absolute floor
       for a variable that is legitimately zero - a fixed h is either round-off
       on a quantity of 1e6 or truncation on one of 1e-6 */
    const step = (h && h[i] > 0) ? h[i] : Math.max(1e-6 * Math.abs(xs[i]), 1e-9);
    const a = xs.slice(), b = xs.slice();
    a[i] = xs[i] + step; b[i] = xs[i] - step;
    g.push((f(a) - f(b)) / (2 * step));
  }
  return g;
}
function unLinProp(f, xs, sig){
  const g = unGrad(f, xs, sig.map(s => Math.abs(s) > 0 ? 1e-4 * Math.abs(s) : 0));
  let v = 0;
  const terms = g.map((gi, i) => { const t = gi * sig[i]; v += t * t; return { g:gi, t:Math.abs(t) }; });
  const sd = Math.sqrt(v);
  return { f0:f(xs), sd, grad:g, terms,
           share:terms.map(t => sd > 0 ? (t.t * t.t) / (sd * sd) : 0) };
}
/* A seeded generator, so a panel and a gate read the same number twice.
   xorshift32 with a Box-Muller pair; the seed is an argument rather than
   global state, so the picture does not shimmer between frames. */
function unRng(seed){
  let s = (seed | 0) || 2463534242;
  return () => {
    s ^= s << 13; s |= 0; s ^= s >>> 17; s ^= s << 5; s |= 0;
    return ((s >>> 0) + 0.5) / 4294967296;
  };
}
function unNormals(rng, n){
  const out = [];
  while(out.length < n){
    const u = Math.max(1e-12, rng()), v = rng();
    const r = Math.sqrt(-2 * Math.log(u));
    out.push(r * Math.cos(2 * Math.PI * v));
    if(out.length < n) out.push(r * Math.sin(2 * Math.PI * v));
  }
  return out;
}
function unMCProp(f, xs, sig, n, seed){
  const rng = unRng(seed || 12345);
  const N = n || 20000;
  let m = 0, m2 = 0, kept = 0;
  const sample = [];
  for(let k = 0; k < N; k++){
    const z = unNormals(rng, xs.length);
    const y = f(xs.map((x, i) => x + sig[i] * z[i]));
    if(!isFinite(y)) continue;
    kept++;
    const d = y - m;
    m += d / kept;
    m2 += d * (y - m);
    if(sample.length < 4000) sample.push(y);
  }
  const sd = kept > 1 ? Math.sqrt(m2 / (kept - 1)) : 0;
  /* the standard error OF the standard deviation, which is what decides
     whether a disagreement with the linear route is real or is the sample */
  return { mean:m, sd, n:kept, dropped:N - kept,
           seSd:kept > 1 ? sd / Math.sqrt(2 * (kept - 1)) : 0, sample };
}
/* the two routes together, with the bias the linear one cannot see */
function unPropCompare(f, xs, sig, n, seed){
  const L = unLinProp(f, xs, sig), M = unMCProp(f, xs, sig, n, seed);
  return { lin:L, mc:M, sdGap:Math.abs(L.sd - M.sd), bias:M.mean - L.f0,
           sigmas:M.seSd > 0 ? Math.abs(L.sd - M.sd) / M.seSd : 0,
           relGap:M.sd > 0 ? Math.abs(L.sd - M.sd) / M.sd : 0 };
}
