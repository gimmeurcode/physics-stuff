/* ============================================================================
   2ea · REGIONS AND INTEGRANDS THE READER WRITES

   Two things were missing from the integral wings and both are the same
   omission: the reader could choose a description, but only from a list.

     · The typed region was POLAR ONLY. Every preset carries a Type I and a
       Type II description and the stage makes a great deal of the difference
       between them — but a region the reader wrote could only ever be r(θ),
       which is the one case where the distinction does not arise.

     · The typed integrand was CARTESIAN ONLY. A stage whose entire argument is
       that polar coordinates turn a square root into a constant would not let
       the reader write the integrand in polar coordinates.

   Both are fixed here, in the engine, where they can be tested.

   --- THE COORDINATE NAMES, AND A TRAP IN THEM ---

   The maths engine has macros `r` and `rho` already, and they are the OPPOSITE
   WAY ROUND from every calculus textbook: `r` expands to √(x²+y²+z²) — the
   spherical radius — and `rho` to √(x²+y²). Stewart, Thomas and Anton all use
   r for the cylindrical radius and ρ for the spherical one, and a reader typing
   `r^2` into a polar integral means the first of those.

   Inside the integral wings the textbook convention wins, and `igCoordSrc`
   rewrites the source before the parser sees it so that it does:

       r      →  √(x² + y²)             the cylindrical / polar radius
       rho    →  √(x² + y² + z²)        the spherical radius
       theta  →  atan2(y, x)            measured from the +x axis
       phi    →  atan2(√(x²+y²), z)     measured from the +z axis

   Everything becomes Cartesian before parsing, which has a consequence worth
   stating plainly: the coordinate systems are not modes to be switched between.
   `x^2 + y^2`, `r^2` and `rho^2*sin(phi)^2` are three spellings of one function
   and may be mixed in a single expression. Nothing downstream — the region, the
   integrator, the picture — needs to know which was used.

   Prefix: ig
   ============================================================================ */

/* Whole identifiers only, so `sqrt` keeps its r, `rho` is not eaten by the `r`
   rule, and a reader's `theta1` is left alone. `rho` is replaced before `r`
   even though the lookahead already protects it — the order is what makes that
   protection unnecessary to reason about. */
const igCoordSrc = s => String(s == null ? '' : s)
  .replace(/(?<![A-Za-z0-9_])theta(?![A-Za-z0-9_])/g, '(atan2(y,x))')
  .replace(/(?<![A-Za-z0-9_])phi(?![A-Za-z0-9_])/g,   '(atan2(sqrt(x^2+y^2),z))')
  .replace(/(?<![A-Za-z0-9_])rho(?![A-Za-z0-9_])/g,   '(sqrt(x^2+y^2+z^2))')
  .replace(/(?<![A-Za-z0-9_])r(?![A-Za-z0-9_])/g,     '(sqrt(x^2+y^2))');

/* The limit functions of a curvilinear solid are functions of TWO curvilinear
   coordinates — z(r, θ) for a cylindrical solid, ρ(φ, θ) for a spherical one —
   and the engine has only x, y and z to bind them to. Each pair is mapped onto
   the first two slots, whole identifiers only, so `sqrt` keeps its r and its t
   and `atan2` keeps its t. */
const igPairSrc = (s, a, b) => String(s == null ? '' : s)
  .replace(new RegExp('(?<![A-Za-z0-9_])' + a + '(?![A-Za-z0-9_])', 'g'), 'x')
  .replace(new RegExp('(?<![A-Za-z0-9_])' + b + '(?![A-Za-z0-9_])', 'g'), 'y');

/* which coordinate names a source actually used — so a panel can echo back
   "you wrote that in spherical coordinates" rather than leaving the reader to
   wonder whether their `phi` was understood */
function igCoordUsed(s){
  const t = String(s == null ? '' : s);
  const has = w => new RegExp('(?<![A-Za-z0-9_])' + w + '(?![A-Za-z0-9_])').test(t);
  const cart = has('x') || has('y') || has('z');
  const pol  = has('r') || has('theta');
  const sph  = has('rho') || has('phi');
  const names = [];
  if(has('x')) names.push('x'); if(has('y')) names.push('y'); if(has('z')) names.push('z');
  if(has('r')) names.push('r'); if(has('theta')) names.push('theta');
  if(has('rho')) names.push('rho'); if(has('phi')) names.push('phi');
  return { cart, pol, sph, names,
           mixed:[cart, pol, sph].filter(Boolean).length > 1,
           label:sph ? (cart || pol ? 'mixed, including spherical' : 'spherical')
                     : pol ? (cart ? 'mixed, Cartesian and polar' : 'polar')
                     : cart ? 'Cartesian' : 'a constant' };
}
/* The compile step that goes with this lives in `59b-pk-entries.js` as
   `igCoordFn`, not here: `pkCompile` is part of the interaction toolkit at 59
   and nothing in the 21–49 engine range may reach forward to it. What stays
   here is the part worth unit-testing — the rewrite itself, which is pure text.

   ---------------------------------------------------------------------------- */

/* ----------------------------------------------------------------------------
   TYPED PLANE REGIONS

   Each builder returns the same shape the preset table uses — `x0 x1 y0 y1` for
   the bounding box, `yLo/yHi` for the Type I description, `xLo/xHi` for Type II,
   `polar` for the polar one — so `igRegionIntegral` and `igInRegion` need no
   changes at all and every stage downstream keeps working.

   The bounding box is MEASURED off the boundary rather than asked for. A reader
   who writes y between x² and 2x should not also have to work out that the
   picture wants to run from 0 to 4.

   Limits are clamped to finite values and the two are ordered, so a region
   written upside down integrates to a positive area rather than a negative one
   — and `flipped` is set, because that is worth telling them.
   ---------------------------------------------------------------------------- */
const igFin = (v, d) => (Number.isFinite(v) ? v : (d || 0));

function igTypeIRegion(a, b, g0, g1, name){
  const x0 = Math.min(a, b), x1 = Math.max(a, b);
  let y0 = Infinity, y1 = -Infinity, flipped = false, bad = 0;
  const lo = x => igFin(g0(x), 0), hi = x => igFin(g1(x), 0);
  for(let i = 0; i <= 400; i++){
    const x = x0 + (x1 - x0) * i / 400;
    const A = g0(x), B = g1(x);
    if(!Number.isFinite(A) || !Number.isFinite(B)) bad++;
    const l = lo(x), h = hi(x);
    if(l > h) flipped = true;
    y0 = Math.min(y0, l, h); y1 = Math.max(y1, l, h);
  }
  if(!Number.isFinite(y0)){ y0 = 0; y1 = 1; }
  /* NO padding. `x0 x1 y0 y1` are not a drawing box — `igRegionIntegral` uses
     them as the OUTER LIMITS of the iterated integral, so a padded y here
     becomes a Type II integral taken over the wrong interval. The stages pad
     when they frame the picture, which is where padding belongs. */
  return { kind:'I', name:name || 'your Type I region',
           x0, x1, y0, y1,
           yLo:x => Math.min(lo(x), hi(x)), yHi:x => Math.max(lo(x), hi(x)),
           xLo:null, xHi:null, both:false, flipped, bad,
           desc:'x runs over an interval and, for each x, y runs between two functions of x. ' +
                'The inner integral sweeps a vertical strip and the outer one slides it across.' };
}
function igTypeIIRegion(c, d, h0, h1, name){
  const y0 = Math.min(c, d), y1 = Math.max(c, d);
  let x0 = Infinity, x1 = -Infinity, flipped = false, bad = 0;
  const lo = y => igFin(h0(y), 0), hi = y => igFin(h1(y), 0);
  for(let i = 0; i <= 400; i++){
    const y = y0 + (y1 - y0) * i / 400;
    const A = h0(y), B = h1(y);
    if(!Number.isFinite(A) || !Number.isFinite(B)) bad++;
    const l = lo(y), h = hi(y);
    if(l > h) flipped = true;
    x0 = Math.min(x0, l, h); x1 = Math.max(x1, l, h);
  }
  if(!Number.isFinite(x0)){ x0 = 0; x1 = 1; }
  /* unpadded, for the same reason as Type I above */
  return { kind:'II', name:name || 'your Type II region',
           x0, x1, y0, y1,
           yLo:null, yHi:null,
           xLo:y => Math.min(lo(y), hi(y)), xHi:y => Math.max(lo(y), hi(y)),
           both:false, flipped, bad,
           desc:'y runs over an interval and, for each y, x runs between two functions of y. ' +
                'The strip is horizontal, and the outer integral slides it up the region.' };
}
function igPolarRegion(t0, t1, r0f, r1f, name){
  let neg = false;
  const r1 = th => { const v = r1f(th); if(v < 0) neg = true; return Number.isFinite(v) ? Math.max(0, v) : 0; };
  const r0 = th => { const v = r0f(th); if(v < 0) neg = true; return Number.isFinite(v) ? Math.max(0, v) : 0; };
  let x0 = 0, x1 = 0, y0 = 0, y1 = 0;
  for(let i = 0; i <= 720; i++){
    const th = t0 + (t1 - t0) * i / 720, R = Math.max(r1(th), r0(th));
    const x = R * Math.cos(th), y = R * Math.sin(th);
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = Math.max(x1 - x0, y1 - y0) * 0.06 + 1e-3;
  return { kind:'polar', name:name || 'your polar region',
           x0:x0 - pad, x1:x1 + pad, y0:y0 - pad, y1:y1 + pad,
           yLo:null, yHi:null, xLo:null, xHi:null, both:false, neg,
           polar:{ t0, t1, r0, r1 },
           desc:'θ runs over an interval and, for each θ, r runs between two functions of θ. ' +
                'The area element is r dr dθ — a wedge far from the origin is wider than the same wedge near it.' };
}

/* ----------------------------------------------------------------------------
   FUBINI, MEASURED

   A region given BOTH descriptions is the only place the theorem can be tested
   rather than recited. The two iterated integrals share no code — one sweeps
   vertical strips, the other horizontal — and a third route, Monte Carlo over
   the bounding box, shares nothing with either and never looks at a limit
   function at all. It converges as 1/√N, so it is worth three figures and is
   reported with its own standard error rather than pretended to be exact.

   The Monte Carlo generator is the deterministic one below rather than
   `Math.random`, so a reported disagreement is reproducible.
   ---------------------------------------------------------------------------- */
function igFubini(RgI, RgII, f, panels){
  const p = Math.max(4, Math.round(panels || 14));
  const I  = RgI  ? nqDoubleTypeI(f, RgI.x0, RgI.x1, RgI.yLo, RgI.yHi, 5, p) : NaN;
  const II = RgII ? nqDoubleTypeII(f, RgII.y0, RgII.y1, RgII.xLo, RgII.xHi, 5, p) : NaN;
  const gap = (Number.isFinite(I) && Number.isFinite(II)) ? Math.abs(I - II) : NaN;
  const scale = Math.max(Math.abs(I) || 0, Math.abs(II) || 0, 1e-300);
  return { I, II, gap, rel:gap / scale, panels:p };
}
/* The two orders are equal as mathematics and unequal as arithmetic, and which
   is which is worth measuring. A limit function with an unbounded derivative —
   x = √y where y = x² was inverted, or √(4−x²) at the rim of a disc — puts a
   kink in the OUTER integrand, and Gauss–Legendre loses most of its order on it.
   Refining tells the two apart: a gap that falls steadily is quadrature, and a
   gap that sits still is a region described wrongly. */
function igFubiniConverge(RgI, RgII, f, list){
  const ps = list || [8, 16, 32, 64];
  const runs = ps.map(p => { const F = igFubini(RgI, RgII, f, p); return { p, gap:F.gap, I:F.I, II:F.II }; });
  const first = runs[0].gap, last = runs[runs.length - 1].gap;
  return { runs, falling:Number.isFinite(first) && Number.isFinite(last) && last < first / 4,
           first, last, ratio:last > 0 ? first / last : Infinity };
}
/* a reproducible uniform stream — the same lattice the probability wing uses
   for its own repeatable sampling */
function igRandStream(seed){
  let s = (seed || 12345) >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
function igMonteCarlo(Rg, f, N, seed){
  const n = Math.max(100, Math.round(N || 40000));
  const rnd = igRandStream(seed);
  const area = (Rg.x1 - Rg.x0) * (Rg.y1 - Rg.y0);
  let sum = 0, sq = 0, hits = 0;
  for(let i = 0; i < n; i++){
    const x = Rg.x0 + (Rg.x1 - Rg.x0) * rnd(), y = Rg.y0 + (Rg.y1 - Rg.y0) * rnd();
    let v = 0;
    if(igInRegion(Rg, x, y)){ const w = f(x, y); v = Number.isFinite(w) ? w : 0; hits++; }
    sum += v; sq += v * v;
  }
  const mean = sum / n, var2 = Math.max(0, sq / n - mean * mean);
  return { value:mean * area, se:area * Math.sqrt(var2 / n), hits, n,
           frac:hits / n, area };
}

/* ----------------------------------------------------------------------------
   TYPED SOLIDS

   The same three shapes one dimension up. Each returns an object carrying its
   own integrator, because a solid described in spherical coordinates has no
   Type I description to fall back on and pretending otherwise is how a wrong
   volume gets printed with confidence.
   ---------------------------------------------------------------------------- */
function igZSimpleSolid(a, b, g0, g1, z0, z1, name){
  const base = igTypeIRegion(a, b, g0, g1, name);
  let zlo = Infinity, zhi = -Infinity;
  for(let i = 0; i <= 40; i++){
    const x = base.x0 + (base.x1 - base.x0) * i / 40;
    const l = base.yLo(x), h = base.yHi(x);
    for(let j = 0; j <= 40; j++){
      const y = l + (h - l) * j / 40;
      const A = igFin(z0(x, y), 0), B = igFin(z1(x, y), 0);
      zlo = Math.min(zlo, A, B); zhi = Math.max(zhi, A, B);
    }
  }
  if(!Number.isFinite(zlo)){ zlo = 0; zhi = 1; }
  return { kind:'zsimple', name:name || 'your solid', base,
           x0:base.x0, x1:base.x1, y0:base.y0, y1:base.y1, z0:zlo, z1:zhi,
           yLo:base.yLo, yHi:base.yHi,
           zLo:(x, y) => Math.min(igFin(z0(x, y), 0), igFin(z1(x, y), 0)),
           zHi:(x, y) => Math.max(igFin(z0(x, y), 0), igFin(z1(x, y), 0)),
           integrate:(f, k, p) => nqTriple(f, base.x0, base.x1, base.yLo, base.yHi,
                                           (x, y) => Math.min(igFin(z0(x, y), 0), igFin(z1(x, y), 0)),
                                           (x, y) => Math.max(igFin(z0(x, y), 0), igFin(z1(x, y), 0)), k || 5, p || 8) };
}
function igCylSolid(t0, t1, r0f, r1f, z0f, z1f, name){
  const r0 = th => Math.max(0, igFin(r0f(th), 0)), r1 = th => Math.max(0, igFin(r1f(th), 0));
  const zL = (r, th) => Math.min(igFin(z0f(r, th), 0), igFin(z1f(r, th), 0));
  const zH = (r, th) => Math.max(igFin(z0f(r, th), 0), igFin(z1f(r, th), 0));
  let R = 0, zlo = Infinity, zhi = -Infinity;
  for(let i = 0; i <= 240; i++){
    const th = t0 + (t1 - t0) * i / 240;
    const a = r0(th), b = r1(th);
    R = Math.max(R, a, b);
    for(let j = 0; j <= 8; j++){
      const r = Math.min(a, b) + Math.abs(b - a) * j / 8;
      zlo = Math.min(zlo, zL(r, th)); zhi = Math.max(zhi, zH(r, th));
    }
  }
  if(!Number.isFinite(zlo)){ zlo = 0; zhi = 1; }
  return { kind:'cyl', name:name || 'your cylindrical solid',
           x0:-R * 1.06 - 1e-3, x1:R * 1.06 + 1e-3, y0:-R * 1.06 - 1e-3, y1:R * 1.06 + 1e-3,
           z0:zlo, z1:zhi, cyl:{ t0, t1, r0, r1, zLo:zL, zHi:zH },
           integrate:(f, k, p) => nqTripleCyl(f, t0, t1, r0, r1, zL, zH, k || 5, p || 8) };
}
function igSphSolid(t0, t1, p0f, p1f, R0f, R1f, name){
  const p0 = th => igFin(p0f(th), 0), p1 = th => igFin(p1f(th), Math.PI);
  const R0 = (ph, th) => Math.max(0, igFin(R0f(ph, th), 0));
  const R1 = (ph, th) => Math.max(0, igFin(R1f(ph, th), 0));
  /* The box is measured off the BOUNDARY SURFACE, not from the largest radius.
     A ball of radius 2 capped at φ ≤ π/4 lives in z ∈ [0, 2] and |x|,|y| ≤ √2;
     using ±ρ_max on every axis gave it a box more than four times too big, so
     the drawn cross-sections were mostly empty and the Monte Carlo estimate
     threw most of its darts at nothing. */
  let Rm = 0, bx0 = 0, bx1 = 0, by0 = 0, by1 = 0, bz0 = 0, bz1 = 0, first = true;
  for(let i = 0; i <= 72; i++) for(let j = 0; j <= 72; j++){
    const th = t0 + (t1 - t0) * i / 72;
    const ph = p0(th) + (p1(th) - p0(th)) * j / 72;
    for(const rho of [R0(ph, th), R1(ph, th)]){
      Rm = Math.max(Rm, rho);
      const sp = Math.sin(ph);
      const x = rho * sp * Math.cos(th), y = rho * sp * Math.sin(th), z = rho * Math.cos(ph);
      if(first){ bx0 = bx1 = x; by0 = by1 = y; bz0 = bz1 = z; first = false; }
      bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x);
      by0 = Math.min(by0, y); by1 = Math.max(by1, y);
      bz0 = Math.min(bz0, z); bz1 = Math.max(bz1, z);
    }
  }
  const pad = Rm * 0.04 + 1e-3;
  return { kind:'sph', name:name || 'your spherical solid', rmax:Rm,
           x0:bx0 - pad, x1:bx1 + pad, y0:by0 - pad, y1:by1 + pad, z0:bz0 - pad, z1:bz1 + pad,
           sph:{ t0, t1, p0, p1, r0:R0, r1:R1 },
           integrate:(f, k, p) => nqTripleSph(f, t0, t1, p0, p1, R0, R1, k || 5, p || 8) };
}
