/* ============================================================================
   3g · CIRCUIT ENGINE — modified nodal analysis, in real SI units
   Unlike the field engines above this one works in volts, amps, ohms, farads
   and henries, because a circuit is a thing you build rather than a geometry
   you explore. Everything here is a pure function of a schematic object:

     sch = { comps:[ {id,kind,name,x,y,rot, ...values} ], wires:[ {a,b} ] }

   The unknown vector is the standard MNA one,

     x = [ node voltages 1..N | op-amp internal nodes | branch currents ]

   with node 0 the ground. Node equations are written as "sum of the currents
   LEAVING this node = 0", and every branch current unknown is defined as the
   current entering pin 0 of its element and leaving pin 1. That single
   convention makes the absorbed power (v0 − v1)·i correct for every element,
   so Tellegen's theorem Σ v_b i_b = 0 becomes a numerical check the app runs
   live rather than an assertion.

   Reactive elements enter through companion models. For a capacitor the
   trapezoidal rule gives

     i_{n+1} = (2C/h)(v_{n+1} − v_n) − i_n,

   i.e. a conductance 2C/h in parallel with a current source that remembers
   the past; an inductor carries its own current unknown so that mutual
   inductance — where several branch currents appear in one branch equation —
   is expressible at all:

     v_k = Σ_j L_kj di_j/dt,     L_kj = M_kj = k√(L_k L_j).

   Nonlinear devices (junction diodes, and the op-amp transconductance stage
   with its slew limit and output saturation) are solved by Newton–Raphson
   with the standard pn-junction voltage limiter and Gmin stepping as a
   fallback. The AC analysis is a complex MNA solve linearised about the DC
   operating point, so it is small-signal in the proper sense.
   ============================================================================ */

/* ---- engineering notation: 4.7 kΩ, 100 nF, 1.59 MHz, −12.3 mA ------------- */
const CK_PREFIX = [[1e12,'T'],[1e9,'G'],[1e6,'M'],[1e3,'k'],[1,''],
                   [1e-3,'m'],[1e-6,'µ'],[1e-9,'n'],[1e-12,'p'],[1e-15,'f']];
function ckEng(v, unit, sig){
  unit = unit || ''; sig = sig || 3;
  const suf = unit ? ' ' : '';
  if(!Number.isFinite(v)) return (Number.isNaN(v) ? '—' : (v > 0 ? '∞' : '−∞')) + suf + unit;
  const a = Math.abs(v);
  if(a < 1e-18) return '0' + suf + unit;
  let s = 1e-15, p = 'f';
  for(const q of CK_PREFIX) if(a >= q[0] * 0.9995){ s = q[0]; p = q[1]; break; }
  const m = v / s;
  let str = m.toFixed(Math.max(0, Math.min(9, sig - 1 - Math.floor(Math.log10(Math.abs(m))))));
  if(str.includes('.')) str = str.replace(/\.?0+$/, '');
  return str.replace('-', '−') + ' ' + p + unit;
}
/* the inverse: "4k7", "100n", "2.2M" → a number. Used by the value editor. */
function ckParseEng(s){
  if(typeof s === 'number') return s;
  const t = String(s).trim().replace('−', '-').replace(/[ΩFHVAs]/g, '');
  const m = /^(-?[\d.]*)\s*([TGMkKmuµnpf]?)\s*(-?[\d.]*)$/.exec(t);
  if(!m) return NaN;
  const mul = { T:1e12, G:1e9, M:1e6, k:1e3, K:1e3, m:1e-3, u:1e-6, 'µ':1e-6, n:1e-9, p:1e-12, f:1e-15, '':1 }[m[2]];
  if(m[3]) return (parseFloat(m[1]) + parseFloat('0.' + m[3])) * mul;   // the "4k7" form
  return parseFloat(m[1]) * mul;
}

/* ============================================================================
   1 · DENSE LINEAR ALGEBRA
   Circuits here are small (n well under 100), so a dense LU with partial
   pivoting is both fastest and easiest to trust.
   ============================================================================ */

/* Solves A x = b in place. A is row-major n×n. Returns b (now x), or null if
   the matrix is singular — which for a circuit means a floating subnetwork or
   a loop made only of voltage sources. */
function ckSolveLin(A, b, n){
  for(let k = 0; k < n; k++){
    let p = k, mx = Math.abs(A[k * n + k]);
    for(let i = k + 1; i < n; i++){ const v = Math.abs(A[i * n + k]); if(v > mx){ mx = v; p = i; } }
    if(!(mx > 1e-290)) return null;
    if(p !== k){
      for(let j = k; j < n; j++){ const t = A[k * n + j]; A[k * n + j] = A[p * n + j]; A[p * n + j] = t; }
      const t = b[k]; b[k] = b[p]; b[p] = t;
    }
    const d = A[k * n + k];
    for(let i = k + 1; i < n; i++){
      const f = A[i * n + k] / d;
      if(f === 0) continue;
      A[i * n + k] = 0;
      for(let j = k + 1; j < n; j++) A[i * n + j] -= f * A[k * n + j];
      b[i] -= f * b[k];
    }
  }
  for(let i = n - 1; i >= 0; i--){
    let s = b[i];
    for(let j = i + 1; j < n; j++) s -= A[i * n + j] * b[j];
    b[i] = s / A[i * n + i];
  }
  return b;
}

/* A complex system (Ar + jAi)(xr + jxi) = br + jbi, solved by expanding it
   into the equivalent 2n real system [Ar −Ai; Ai Ar][xr;xi] = [br;bi]. */
function ckSolveComplex(Ar, Ai, br, bi, n){
  const m = 2 * n, B = new Float64Array(m * m), r = new Float64Array(m);
  for(let i = 0; i < n; i++){
    for(let j = 0; j < n; j++){
      B[i * m + j]             =  Ar[i * n + j];
      B[i * m + (j + n)]       = -Ai[i * n + j];
      B[(i + n) * m + j]       =  Ai[i * n + j];
      B[(i + n) * m + (j + n)] =  Ar[i * n + j];
    }
    r[i] = br[i]; r[i + n] = bi[i];
  }
  const x = ckSolveLin(B, r, m);
  if(!x) return null;
  return { re: x.slice(0, n), im: x.slice(n, m) };
}

