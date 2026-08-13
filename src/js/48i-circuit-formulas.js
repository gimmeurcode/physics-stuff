/* ============================================================================
   10 · CLOSED FORMS THE APP CHECKS ITSELF AGAINST
   Each one is the textbook answer for a circuit the wing actually simulates,
   so the numerical result can be held up against it live.
   ============================================================================ */

const ckTauRC   = (R, C) => R * C;
const ckTauRL   = (R, L) => L / R;
/* series RLC: undamped resonance, damping ratio, and the damped frequency */
function ckRLC(R, L, C){
  const w0 = 1 / Math.sqrt(L * C);
  const zeta = (R / 2) * Math.sqrt(C / L);
  const Q = zeta > 0 ? 1 / (2 * zeta) : Infinity;
  const wd = zeta < 1 ? w0 * Math.sqrt(1 - zeta * zeta) : 0;
  return { w0, f0: w0 / (2 * Math.PI), zeta, Q, wd, fd: wd / (2 * Math.PI),
           regime: zeta < 1 ? 'underdamped' : (zeta > 1 ? 'overdamped' : 'critically damped'),
           bw: w0 / (2 * Math.PI) / (Q || Infinity) };
}
/* the impedance of each passive at one frequency, as a complex number */
function ckZR(R){ return { re:R, im:0 }; }
function ckZC(C, f){ return { re:0, im: -1 / (2 * Math.PI * f * C) }; }
function ckZL(L, f){ return { re:0, im: 2 * Math.PI * f * L }; }
const ckZAdd = (a, b) => ({ re:a.re + b.re, im:a.im + b.im });
function ckZPar(a, b){
  const nr = a.re * b.re - a.im * b.im, ni = a.re * b.im + a.im * b.re;
  const dr = a.re + b.re, di = a.im + b.im, d = dr * dr + di * di;
  return d < 1e-300 ? { re:Infinity, im:0 } : { re:(nr * dr + ni * di) / d, im:(ni * dr - nr * di) / d };
}
const ckZMag = z => Math.hypot(z.re, z.im);
const ckZPh  = z => Math.atan2(z.im, z.re) * 180 / Math.PI;

/* ============================================================================
   11 · A LIBRARY OF CIRCUITS
   Pure schematic constructors. They live with the engine rather than with the
   drawing code so the unit suite can build the very circuits the guided demos
   use and check them against closed forms — a wire one grid unit out would
   short a component silently, so these layouts are tested, not trusted.
   ============================================================================ */
/* the compact form the guided demos are written in */
function ckDemoSch(spec){
  return ckNewSch((spec.c || []).map(a => Object.assign({ kind:a[0], name:a[1], x:a[2], y:a[3] }, a[4] || {})),
                  (spec.w || []).map(w => ({ a:{ x:w[0], y:w[1] }, b:{ x:w[2], y:w[3] } })));
}
/* a series loop — source on the left, parts in a row, return rail underneath */
function ckSeriesLoop(src, parts){
  const c = [['V', 'V1', 0, 0, Object.assign({ rot:180 }, src)]];
  const w = [];
  let x = 4;
  for(const p of parts){ c.push([p.kind, p.name, x, 0, p]); x += 4; }
  for(let i = 0; i < parts.length; i++) w.push([4 * i + 1, 0, 4 * i + 3, 0]);
  const end = 4 * parts.length + 1;
  c.push(['GND', 'G1', end, -4]);
  w.push([end, 0, end, -4], [end, -4, -1, -4], [-1, -4, -1, 0]);
  return ckDemoSch({ c, w });
}

