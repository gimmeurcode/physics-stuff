/* ============================================================================
   4h · THE PARTIAL DERIVATIVES WING
   Functions of several variables, limits, partial and higher-order partials,
   tangent planes, the chain rule, gradients and directional derivatives,
   critical points and their classification, Lagrange multipliers, and the
   Jacobian.

   Every derivative on screen is symbolic, differentiated from the expression
   the user typed by the same engine the vector wing uses.
   ============================================================================ */

/* a small quad-mesh surface drawn through the depth-sorted renderer */
function ctSurf3(f, x0, x1, y0, y1, n, zlo, zhi, alpha, wire){
  const N = n || 24;
  const hx = (x1 - x0) / N, hy = (y1 - y0) / N;
  const span = (zhi - zlo) || 1;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
    const xa = x0 + i * hx, xb = xa + hx, ya = y0 + j * hy, yb = ya + hy;
    const z00 = f(xa, ya), z10 = f(xb, ya), z11 = f(xb, yb), z01 = f(xa, yb);
    if(!Number.isFinite(z00) || !Number.isFinite(z10) || !Number.isFinite(z11) || !Number.isFinite(z01)) continue;
    const zc = (z00 + z10 + z11 + z01) / 4;
    const t = Math.max(0, Math.min(1, (zc - zlo) / span));
    R.poly([v3(xa, ya, z00), v3(xb, ya, z10), v3(xb, yb, z11), v3(xa, yb, z01)],
           rgbCss(rampSeq(t)), wire ? rgbCss(TH.line2, 0.5) : null, 0.6, alpha === undefined ? 0.92 : alpha);
  }
}
/* the range of a scalar over a rectangle, for scaling a surface honestly */
function ctZRange(f, x0, x1, y0, y1, n){
  const N = n || 40;
  let lo = Infinity, hi = -Infinity;
  for(let i = 0; i <= N; i++) for(let j = 0; j <= N; j++){
    const v = f(x0 + (x1 - x0) * i / N, y0 + (y1 - y0) * j / N);
    if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  if(!Number.isFinite(lo)) { lo = -1; hi = 1; }
  if(hi - lo < 1e-9) hi = lo + 1;
  return { lo, hi };
}
/* the shared function picker — one list, used by every stage in the wing */
const MV_FUNCS = {
  bowl:    { src:'x^2+y^2',                name:'x² + y²  — a bowl' },
  saddle:  { src:'x^2-y^2',                name:'x² − y²  — a saddle' },
  ripple:  { src:'sin(x) cos(y)',          name:'sin x · cos y  — an egg box' },
  gauss2:  { src:'exp(-(x^2+y^2)/2)',      name:'e^(−(x²+y²)/2)  — a hill' },
  monkey:  { src:'x^3-3x y^2',             name:'x³ − 3xy²  — the monkey saddle' },
  ridge:   { src:'x^3-3x+y^2',             name:'x³ − 3x + y²  — a minimum and a saddle' },
  rosen:   { src:'(1-x)^2+10(y-x^2)^2',    name:"(1−x)² + 10(y−x²)²  — Rosenbrock's banana" },
  hyp:     { src:'x y',                    name:'xy  — the simplest saddle' },
  wavehill:{ src:'sin(x) exp(-(x^2+y^2)/8)', name:'sin x · e^(−r²/8)  — several critical points' },
  cone2:   { src:'sqrt(x^2+y^2)',          name:'√(x²+y²)  — a cone, not differentiable at 0' }
};
/* The picker also offers "type your own", and emits the expression box beside
   it. Every stage in this wing calls mvPick, so adding it here retrofits custom
   functions across the whole floor rather than stage by stage. */
function mvPick(id, cur){
  return ctSeg(id, cur, Object.keys(MV_FUNCS).map(k => [k, MV_FUNCS[k].name.split('  —')[0]])
                 .concat([['custom', 'type your own']])) +
    (cur === 'custom' ? fnHtml(id + 'x', 'f(x, y) =', (ST && ST.src) || 'x^2 + y^2', 'x, y') : '');
}
/* Choosing a key sets the source; 'custom' keeps whatever is already there so
   switching away and back does not discard what the reader typed. */
function mvSetKey(st, v){
  st.key = v;
  if(v !== 'custom') st.src = MV_FUNCS[v].src;
  mvSafe(st);
}
/* wire both the picker and, when it is showing, the expression box */
function mvWirePick(id, after){
  ctWireSeg(id, v => { mvSetKey(ST, v); if(after) after(v); });
  fnWire(id + 'x', (m, s) => { ST.src = s; mvSafe(ST); if(after) after('custom'); },
         s => mvCompile(s));
}
/* The display name of whatever is loaded. MV_FUNCS has no 'custom' entry, so
   every caption has to go through this rather than indexing the table directly. */
const mvName = st => (MV_FUNCS[st.key] ? MV_FUNCS[st.key].name : 'f = ' + (st.src || '?'));
const mvShort = st => mvName(st).split('  —')[0];

/* compile with a guard, so a broken expression cannot take the stage down */
function mvSafe(st){
  try { st.F = mvCompile(st.src); st.err = ''; }
  catch(e){ st.err = String(e && e.message || e); }
  return st.F;
}

/* ---- 1 · functions of two variables ---------------------------------------- */
