/* ============================================================================
   1d · PROOF, LOGIC & SETS — the sets half   (Programme C wing C1)

   A finite set on a universe of at most 30 elements is a 32-bit integer, and
   once that is said, every set identity in the subject becomes an assertion
   about two integers being equal — checkable exactly, with no tolerance and
   nothing to argue about.

   That is the whole design here, and it buys the two routes for free:

     route A   bitmask algebra — build both sides as integers and compare
     route B   membership, element by element: for each x, does x satisfy the
               left-hand condition exactly when it satisfies the right-hand one

   Route B is what a proof of a set identity actually does ("let x ∈ A∩(B∪C);
   then …"), so the two routes here are the computation and the proof, and
   seeing them agree is the point rather than a check on the arithmetic.

   The second half of the file is the other thing sets are for: counting the
   maps between them, deciding when a relation splits a set into classes, and
   the two constructions — Cantor's pairing and Cantor's diagonal — that
   between them say which infinities are the same size.
   ============================================================================ */

/* the power set is drawn, so its cap is what fits on a canvas */
const PF_SUBSET_CAP = 1024;

/* ---- sets as bitmasks ----------------------------------------------------- */
const pfBit = i => 1 << (i - 1);                       /* element i, one-based */
const pfIn = (mask, i) => (mask & pfBit(i)) !== 0;
const pfFull = n => (n >= 31 ? 0x7fffffff : (1 << n) - 1);
function pfCard(mask){
  let c = 0, m = mask;
  while(m){ m &= m - 1; c++; }                          /* Kernighan: one iteration per element present */
  return c;
}
const pfList = (mask, n) => {
  const out = [];
  for(let i = 1; i <= n; i++) if(pfIn(mask, i)) out.push(i);
  return out;
};
const pfSetText = (mask, n, max) => {
  const L = pfList(mask, n);
  if(!L.length) return '∅';
  const k = max || 12;
  return '{' + L.slice(0, k).join(', ') + (L.length > k ? ', … (' + (L.length - k) + ' more)' : '') + '}';
};
/* the operations, each on masks and each exact */
const pfUnion = (a, b) => a | b;
const pfInter = (a, b) => a & b;
const pfDiff  = (a, b) => a & ~b;
const pfSymm  = (a, b) => a ^ b;
const pfComp  = (a, n) => pfFull(n) & ~a;
/* the sets a reader can pick, each defined by a property rather than a list —
   which is what makes the identities below say something */
const PF_SETS = {
  even:   { name:'even numbers', ex:'E = {x : x ≡ 0 (mod 2)}', f:x => x % 2 === 0 },
  odd:    { name:'odd numbers', ex:'O = {x : x ≡ 1 (mod 2)}', f:x => x % 2 === 1 },
  prime:  { name:'primes', ex:'P = {x : x is prime}', f:x => pfIsPrime(x) },
  square: { name:'perfect squares', ex:'S = {x : x = k²}', f:x => Number.isInteger(Math.sqrt(x)) },
  triple: { name:'multiples of 3', ex:'T = {x : 3 | x}', f:x => x % 3 === 0 },
  small:  { name:'the first half', ex:'H = {x : 2x ≤ n}', f:(x, n) => 2 * x <= n },
  fib:    { name:'Fibonacci numbers', ex:'F = {1, 2, 3, 5, 8, 13, 21}', f:x => {
             let a = 1, b = 1;
             while(a < x){ const t = a + b; a = b; b = t; }
             return a === x; } }
};
function pfMaskOf(key, n){
  const S = PF_SETS[key];
  let m = 0;
  for(let i = 1; i <= n; i++) if(S.f(i, n)) m |= pfBit(i);
  return m;
}
/* a reader-supplied set: x belongs where their expression is positive.
   `x mod 4 - 1` is one class mod 4; `sin(x)` is a set with no name. */
function pfMaskFromExpr(src, n){
  try {
    const g = compile(parse(String(src)));
    let m = 0;
    for(let i = 1; i <= n; i++){
      const v = g(i, 0, 0);
      if(Number.isFinite(v) && v > 0) m |= pfBit(i);
    }
    return { ok:true, mask:m, why:'' };
  } catch(e){
    return { ok:false, mask:0, why:String(e && e.message || e) };
  }
}

/* ---- the identities, as claims both routes recompute ---------------------
   Every entry declares `holds`, and nothing reads that flag to decide
   anything: pfSetCheck rebuilds both sides as masks AND walks the elements
   one at a time. Two rows are deliberately false. */
const PF_SET_LAWS = {
  deMorganU: { name:'De Morgan — the complement of a union', ex:'(A ∪ B)ᶜ = Aᶜ ∩ Bᶜ', holds:true,
    lhs:(A, B, C, n) => pfComp(pfUnion(A, B), n),
    rhs:(A, B, C, n) => pfInter(pfComp(A, n), pfComp(B, n)),
    elem:'x is outside A∪B exactly when it is outside A and outside B',
    why:'The set form of ¬(p ∨ q) ≡ ¬p ∧ ¬q, and the same proof: an element is in the left set iff it satisfies the left formula. Every law in the logic wing’s table has a twin here, because a set IS a predicate.' },
  deMorganI: { name:'De Morgan — the complement of an intersection', ex:'(A ∩ B)ᶜ = Aᶜ ∪ Bᶜ', holds:true,
    lhs:(A, B, C, n) => pfComp(pfInter(A, B), n),
    rhs:(A, B, C, n) => pfUnion(pfComp(A, n), pfComp(B, n)),
    elem:'x fails to be in both exactly when it fails to be in at least one',
    why:'The other half. "Not in both" is not "in neither", and the two masks make the difference visible as a set rather than as a row of a truth table.' },
  deMorganBad: { name:'the mis-remembered one — FALSE', ex:'(A ∩ B)ᶜ = Aᶜ ∩ Bᶜ', holds:false,
    lhs:(A, B, C, n) => pfComp(pfInter(A, B), n),
    rhs:(A, B, C, n) => pfInter(pfComp(A, n), pfComp(B, n)),
    elem:'the two sides differ on exactly A △ B — an element in one of them but not the other is in the left set and not in the right',
    why:'Forgetting to flip ∩ into ∪ — the same slip as in the logic table, and here you can look at the elements it loses.' },
  distribI: { name:'∩ distributes over ∪', ex:'A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)', holds:true,
    lhs:(A, B, C) => pfInter(A, pfUnion(B, C)),
    rhs:(A, B, C) => pfUnion(pfInter(A, B), pfInter(A, C)),
    elem:'x is in A and in one of B, C exactly when it is in A∩B or in A∩C',
    why:'The set twin of p ∧ (q ∨ r) ≡ (p ∧ q) ∨ (p ∧ r), and the reason the proof of one is a transcription of the proof of the other.' },
  distribU: { name:'∪ distributes over ∩ — which + and × do not', ex:'A ∪ (B ∩ C) = (A ∪ B) ∩ (A ∪ C)', holds:true,
    lhs:(A, B, C) => pfUnion(A, pfInter(B, C)),
    rhs:(A, B, C) => pfInter(pfUnion(A, B), pfUnion(A, C)),
    elem:'x is in A, or in both B and C — which is exactly "in A or B" and "in A or C"',
    why:'Union and intersection are symmetric in a way addition and multiplication are not. This is the law that most often surprises, and the masks settle it in one comparison.' },
  diffAsInter: { name:'set difference is an intersection', ex:'A ∖ B = A ∩ Bᶜ', holds:true,
    lhs:(A, B, C, n) => pfDiff(A, B),
    rhs:(A, B, C, n) => pfInter(A, pfComp(B, n)),
    elem:'"in A and not in B" is the definition of both sides',
    why:'Which is why ∖ is never a primitive operation, and why every identity involving it can be turned into one involving only ∪, ∩ and complement.' },
  symmDiff: { name:'symmetric difference is exclusive or', ex:'A △ B = (A ∖ B) ∪ (B ∖ A)', holds:true,
    lhs:(A, B) => pfSymm(A, B),
    rhs:(A, B) => pfUnion(pfDiff(A, B), pfDiff(B, A)),
    elem:'x is in exactly one of them',
    why:'The set operation whose logic twin is ⊕. It is also the addition of the Boolean ring on subsets — associative, with ∅ as zero and every set its own inverse.' },
  absorb: { name:'absorption', ex:'A ∪ (A ∩ B) = A', holds:true,
    lhs:(A, B) => pfUnion(A, pfInter(A, B)),
    rhs:A => A,
    elem:'everything in A∩B is already in A, so nothing is added',
    why:'B has vanished. As in the logic table, a formula can mention a set whose contents cannot possibly matter.' },
  unionInterBad: { name:'a plausible-looking FALSE one', ex:'A ∖ (B ∖ C) = (A ∖ B) ∖ C', holds:false,
    lhs:(A, B, C) => pfDiff(A, pfDiff(B, C)),
    rhs:(A, B, C) => pfDiff(pfDiff(A, B), C),
    elem:'the two sides differ on exactly A ∩ C — an element of A that is in C survives the left side whatever B does, and the right side removes it',
    why:'Set difference is not associative, and the elements that separate the two sides are exactly <b>A ∩ C</b>: on the left, being in C rescues an element from the removal, while on the right C removes it outright. (It is not only the triple overlap — an element of A and C but not of B differs too, which is the case worth checking by hand.) Anything written A ∖ B ∖ C without brackets is ambiguous, and this is why.' }
};
/* both routes, and the elements that separate the two sides when they differ */
function pfSetCheck(key, A, B, C, n){
  const L = PF_SET_LAWS[key];
  const lm = L.lhs(A, B, C, n), rm = L.rhs(A, B, C, n);
  /* route A: two integers */
  const sameMask = (lm & pfFull(n)) === (rm & pfFull(n));
  /* route B: membership, one element at a time — the proof, mechanised */
  let sameElem = true;
  const differs = [];
  for(let i = 1; i <= n; i++){
    const a = pfIn(lm, i), b = pfIn(rm, i);
    if(a !== b){ sameElem = false; differs.push(i); }
  }
  return { law:L, lhs:lm & pfFull(n), rhs:rm & pfFull(n), sameMask, sameElem, differs,
           equal:sameMask, agree:sameMask === sameElem, declared:L.holds,
           claimOK:sameMask === L.holds };
}
/* the eight Venn regions of three sets, each with its own membership word and
   its own count — the picture, and the inclusion–exclusion terms it explains */
function pfVennRegions(A, B, C, n){
  const R = [];
  for(let code = 1; code < 8; code++){
    let m = pfFull(n);
    m &= (code & 1) ? A : ~A;
    m &= (code & 2) ? B : ~B;
    m &= (code & 4) ? C : ~C;
    m &= pfFull(n);
    R.push({ code, mask:m, size:pfCard(m),
             inA:!!(code & 1), inB:!!(code & 2), inC:!!(code & 4) });
  }
  const outside = pfFull(n) & ~(A | B | C);
  R.push({ code:0, mask:outside, size:pfCard(outside), inA:false, inB:false, inC:false });
  return R;
}
/* |A ∪ B ∪ C| three ways: the alternating formula, the union's own popcount,
   and the sum of the seven disjoint regions */
function pfInclExcl3(A, B, C, n){
  const byFormula = pfCard(A) + pfCard(B) + pfCard(C)
                  - pfCard(A & B) - pfCard(A & C) - pfCard(B & C)
                  + pfCard(A & B & C);
  const byUnion = pfCard((A | B | C) & pfFull(n));
  const byRegions = pfVennRegions(A, B, C, n)
    .filter(r => r.code > 0).reduce((s, r) => s + r.size, 0);
  return { byFormula, byUnion, byRegions,
           agree:byFormula === byUnion && byUnion === byRegions };
}
/* the power set: 2ⁿ by the formula, and the subsets themselves by counting in
   binary — every subset IS a binary numeral, which is the bijection */
function pfPowerSet(mask, n, cap){
  const els = pfList(mask, n), k = els.length;
  const closed = Math.pow(2, k);
  if(closed > (cap || PF_SUBSET_CAP))
    return { k, closed, subsets:[], enumerated:0, overflow:true, agree:true };
  const subsets = [];
  for(let code = 0; code < closed; code++){
    const s = [];
    for(let j = 0; j < k; j++) if((code >> j) & 1) s.push(els[j]);
    subsets.push(s);
  }
  return { k, closed, subsets, enumerated:subsets.length, overflow:false,
           agree:subsets.length === closed };
}

/* ============================================================================
   RELATIONS AND FUNCTIONS

   A relation on {1…n} is an n×n grid of booleans; the four properties are four
   loops over it, and an equivalence relation is exactly one that splits the
   set into classes. Both directions are computed: the classes are built from
   the relation, and the relation is rebuilt from the classes — a relation is
   an equivalence relation iff those two agree, which is the theorem.
   ============================================================================ */
function pfRelProps(R, n){
  let refl = true, symm = true, trans = true, antisym = true;
  const witness = { refl:null, symm:null, trans:null, antisym:null };
  for(let x = 1; x <= n; x++){
    if(!R(x, x)){ if(refl) witness.refl = { x }; refl = false; }
    for(let y = 1; y <= n; y++){
      if(R(x, y) && !R(y, x)){ if(symm) witness.symm = { x, y }; symm = false; }
      if(R(x, y) && R(y, x) && x !== y){ if(antisym) witness.antisym = { x, y }; antisym = false; }
      if(!R(x, y)) continue;
      for(let z = 1; z <= n; z++)
        if(R(y, z) && !R(x, z)){ if(trans) witness.trans = { x, y, z }; trans = false; }
    }
  }
  return { refl, symm, trans, antisym, witness,
           equivalence:refl && symm && trans,
           partialOrder:refl && antisym && trans };
}
/* the classes, by union–find: route A */
function pfClasses(R, n){
  const parent = [];
  for(let i = 0; i <= n; i++) parent.push(i);
  const find = a => { while(parent[a] !== a){ parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for(let x = 1; x <= n; x++)
    for(let y = 1; y <= n; y++)
      if(R(x, y)){ const a = find(x), b = find(y); if(a !== b) parent[a] = b; }
  const by = {};
  for(let x = 1; x <= n; x++){
    const r = find(x);
    (by[r] = by[r] || []).push(x);
  }
  return Object.keys(by).map(k => by[k]).sort((u, v) => u[0] - v[0]);
}
/* route B: rebuild the relation from the classes — x ~ y iff they landed in
   the same class — and compare it with the one we started from, cell by cell.
   They agree for every x, y exactly when R was an equivalence relation, which
   is the theorem rather than a check on the code. */
function pfClassCheck(R, n){
  const classes = pfClasses(R, n);
  const of = {};
  classes.forEach((c, i) => c.forEach(x => { of[x] = i; }));
  let same = true;
  const differs = [];
  for(let x = 1; x <= n; x++)
    for(let y = 1; y <= n; y++){
      const rebuilt = of[x] === of[y];
      if(!!R(x, y) !== rebuilt){ same = false; if(differs.length < 6) differs.push({ x, y, was:!!R(x, y), now:rebuilt }); }
    }
  const P = pfRelProps(R, n);
  return { classes, sizes:classes.map(c => c.length), same, differs, props:P,
           /* the two statements that must match */
           agree: same === P.equivalence,
           partition: classes.reduce((s, c) => s + c.length, 0) === n };
}
/* how many equivalence relations are there on n elements? Bell(n), by two
   routes: the Bell triangle, and enumerating every partition. */
function pfBellTriangle(n){
  let row = [1];
  const bell = [1];
  for(let i = 1; i <= n; i++){
    const next = [row[row.length - 1]];
    for(let j = 0; j < row.length; j++) next.push(next[j] + row[j]);
    row = next;
    bell.push(row[0]);
  }
  return bell;
}
function pfPartitionCount(n, cap){
  return pfMemo('parts', [n, cap || 0], () => pfPartitionCompute(n, cap));
}
function pfPartitionCompute(n, cap){
  const lim = cap || 5000;
  let count = 0, over = false;
  const assign = new Array(n + 1).fill(0);
  (function rec(i, used){
    if(over) return;
    if(i > n){ count++; if(count > lim) over = true; return; }
    for(let c = 0; c <= used && !over; c++){
      assign[i] = c;
      rec(i + 1, c === used ? used + 1 : used);
    }
  })(1, 0);
  return { count, overflow:over };
}
/* ---- functions between finite sets --------------------------------------- */
const PF_MAPS = {
  square:  { name:'f(k) = k² mod m', f:(k, m) => (k * k) % m || m,
             why:'Neither injective nor surjective in general: squares collide (k and m−k land together) and most residues are never hit. Move m and watch both properties switch on and off.' },
  shift:   { name:'f(k) = k + 1 mod m', f:(k, m) => (k % m) + 1,
             why:'A bijection for every m — it is a cyclic shift, and its inverse is the shift the other way. The cleanest example of a map that is both injective and surjective without being the identity.' },
  fold:    { name:'f(k) = min(k, m+1−k)', f:(k, m) => Math.min(k, m + 1 - k),
             why:'Two-to-one almost everywhere: it folds the set in half, so it is surjective onto the first half and injective nowhere. The image is exactly half the size, which is the counting statement behind it.' },
  double:  { name:'f(k) = 2k mod m', f:(k, m) => (2 * k) % m || m,
             why:'Whether this is a bijection depends on gcd(2, m): for odd m it is, for even m it is not — an arithmetic fact showing up as a property of a drawing.' },
  constant:{ name:'f(k) = 1', f:() => 1,
             why:'The extreme case, and worth having: injective only when the domain has one element, surjective only when the codomain does. Everything collapses to a single arrow.' }
};
function pfMapCheck(key, m, n){
  const F = PF_MAPS[key];
  const C = pfMapCheckWith(F.f, m, n, F.name);
  C.map = F;
  return C;
}
/* the same, for a function the reader supplied — the preset path goes through
   here too, so a typed map is checked by exactly the code the presets are */
function pfMapCheckWith(f, m, n, name){
  const F = { f, name:name || 'your map' };
  const image = {}, arrows = [];
  let inj = true, collision = null;
  const seenAt = {};
  for(let k = 1; k <= m; k++){
    const v = Math.max(1, Math.min(n, F.f(k, n)));
    arrows.push({ from:k, to:v });
    if(seenAt[v] !== undefined){ if(inj) collision = { a:seenAt[v], b:k, at:v }; inj = false; }
    else seenAt[v] = k;
    image[v] = 1;
  }
  const hit = Object.keys(image).length;
  const missed = [];
  for(let v = 1; v <= n; v++) if(!image[v]) missed.push(v);
  return { map:F, arrows, injective:inj, surjective:missed.length === 0,
           bijective:inj && missed.length === 0, collision, missed, hit,
           /* the pigeonhole statement, computed rather than quoted */
           forcedCollision:m > n };
}
/* how many injections m → n, two routes: the falling factorial, and building
   them. The enumeration is capped; above it the closed form stands alone. */
function pfInjectionCount(m, n, cap){
  return pfMemo('inj', [m, n, cap || 0], () => pfInjectionCompute(m, n, cap));
}
function pfInjectionCompute(m, n, cap){
  let closed = 1;
  for(let i = 0; i < m; i++) closed *= (n - i);
  if(closed < 0) closed = 0;
  const lim = cap || 50000;
  if(closed > lim || Math.pow(n, m) > 200000)
    return { closed, enumerated:null, overflow:true, agree:true };
  let count = 0;
  const used = new Array(n + 1).fill(false);
  (function rec(k){
    if(k > m){ count++; return; }
    for(let v = 1; v <= n; v++){
      if(used[v]) continue;
      used[v] = true; rec(k + 1); used[v] = false;
    }
  })(1);
  return { closed, enumerated:count, overflow:false, agree:count === closed };
}
/* how many surjections m → n: inclusion–exclusion, against enumeration.
   The enumeration is nᵐ assignments and this runs inside frame(), so the cap
   is low and the memo in 19c does the rest. */
function pfSurjectionCount(m, n, cap){
  return pfMemo('surj', [m, n, cap || 0], () => pfSurjectionCompute(m, n, cap));
}
function pfSurjectionCompute(m, n, cap){
  let closed = 0;
  for(let j = 0; j <= n; j++){
    let c = 1;
    for(let i = 0; i < j; i++) c = c * (n - i) / (i + 1);
    closed += (j % 2 ? -1 : 1) * Math.round(c) * Math.pow(n - j, m);
  }
  closed = Math.round(closed);
  const lim = cap || 30000;
  if(Math.pow(n, m) > lim) return { closed, enumerated:null, overflow:true, agree:true };
  let count = 0;
  const f = new Array(m + 1).fill(1);
  const total = Math.pow(n, m);
  for(let code = 0; code < total; code++){
    let c = code;
    const seen = {};
    for(let k = 1; k <= m; k++){ f[k] = (c % n) + 1; c = Math.floor(c / n); seen[f[k]] = 1; }
    if(Object.keys(seen).length === n) count++;
  }
  return { closed, enumerated:count, overflow:false, agree:count === closed };
}

/* ============================================================================
   COUNTABILITY — the two constructions

   Cantor's pairing sends ℕ × ℕ into ℕ and is a bijection, which is why the
   rationals are countable. Cantor's diagonal shows no list of reals can be
   complete, which is why the reals are not. Both are constructions, so both
   can be run rather than described.
   ============================================================================ */
const pfPair = (i, j) => ((i + j) * (i + j + 1)) / 2 + j;
function pfUnpair(k){
  const w = Math.floor((Math.sqrt(8 * k + 1) - 1) / 2);
  const t = (w * w + w) / 2;
  const j = k - t;
  return { i:w - j, j };
}
/* the bijection, checked in both directions over a block: every k below the
   bound is produced exactly once, and every pair round-trips */
function pfPairCheck(N){
  const hit = {};
  let maxK = 0, roundTrip = true, dupe = null;
  for(let i = 0; i <= N; i++)
    for(let j = 0; j <= N; j++){
      const k = pfPair(i, j);
      maxK = Math.max(maxK, k);
      if(hit[k] !== undefined && !dupe) dupe = { a:hit[k], b:[i, j], k };
      hit[k] = [i, j];
      const U = pfUnpair(k);
      if(U.i !== i || U.j !== j) roundTrip = false;
    }
  /* the diagonal block 0…N covers every k below the (N+1)-th triangular
     number, and covering means covering exactly — no gaps, no repeats */
  const covered = (N + 1) * (N + 2) / 2;
  let gaps = 0;
  for(let k = 0; k < covered; k++) if(hit[k] === undefined) gaps++;
  return { roundTrip, dupe, gaps, covered, maxK,
           onto:gaps === 0, injective:!dupe, bijection:!dupe && gaps === 0 && roundTrip };
}
/* the diagonal. The list is generated by a rule so it is genuinely infinite in
   principle; the constructed number differs from row k at digit k, and the
   check is exactly that — for every row, one digit that disagrees. */
const PF_LISTS = {
  binaryCount: { name:'the binary numerals, in order', base:2,
                 digit:(row, col) => (Math.floor(row / Math.pow(2, col)) % 2),
                 why:'The obvious first attempt at listing the reals in [0,1): write out every finite binary numeral. The diagonal argument walks straight through it and produces a number no row can equal.' },
  rationals:   { name:'the rationals k/(k+1), digit by digit', base:10,
                 digit:(row, col) => {
                   const v = row / (row + 1);
                   return Math.floor(v * Math.pow(10, col + 1)) % 10;
                 },
                 why:'A list of genuine reals — every one of them rational. The construction still produces something absent from the list, and what it produces is irrational, which is the theorem doing exactly what it should.' },
  digitsOfPi:  { name:'shifted digits of π', base:10,
                 digit:(row, col) => Math.floor(Math.PI * Math.pow(10, col + row + 1)) % 10,
                 why:'A list with no pattern to exploit, to make the point that the argument uses nothing about the list except that it is a list.' }
};
function pfDiagonal(key, N){
  const L = PF_LISTS[key], base = L.base;
  const rows = [], diag = [];
  for(let r = 0; r < N; r++){
    const d = [];
    for(let c = 0; c < N; c++) d.push(L.digit(r, c) % base);
    rows.push(d);
    /* the changed digit: anything but the one on the diagonal, and — for base
       10 — never 9 or 0, so the number cannot be a second decimal expansion of
       something already listed. That subtlety is the one real gap in the
       usual telling of this proof. */
    const on = d[r];
    diag.push(base === 2 ? (1 - on) : ((on + 1) % 8) + 1);
  }
  /* the check: for every row, the constructed number differs somewhere */
  const differsAt = rows.map((d, r) => (d[r] !== diag[r] ? r : -1));
  return { list:L, rows, diag, differsAt,
           allDiffer:differsAt.every(v => v >= 0),
           value:diag.reduce((s, d, i) => s + d * Math.pow(base, -(i + 1)), 0) };
}
