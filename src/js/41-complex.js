/* ============================================================================
   3g · COMPLEX NUMBERS, COMPLEX FUNCTIONS AND CONTOUR INTEGRALS
   Complex numbers earn their place here twice over: as the natural home of
   oscillation (e^(iωt) is what a sinusoid really is), and as a subject whose
   integrals behave better than real ones rather than worse.

   Prefix: cx.  A complex number is {re, im} throughout.
   ============================================================================ */

const cx = (re, im) => ({ re, im:im || 0 });
const cxAdd = (a, b) => ({ re:a.re + b.re, im:a.im + b.im });
const cxSub = (a, b) => ({ re:a.re - b.re, im:a.im - b.im });
const cxMul = (a, b) => ({ re:a.re * b.re - a.im * b.im, im:a.re * b.im + a.im * b.re });
function cxDiv(a, b){
  const d = b.re * b.re + b.im * b.im;
  return { re:(a.re * b.re + a.im * b.im) / d, im:(a.im * b.re - a.re * b.im) / d };
}
const cxAbs  = a => Math.hypot(a.re, a.im);
const cxArg  = a => Math.atan2(a.im, a.re);
const cxConj = a => ({ re:a.re, im:-a.im });
const cxScale= (a, s) => ({ re:a.re * s, im:a.im * s });

/* e^z = e^x(cos y + i sin y) — Euler's formula is not a definition to accept
   but the only extension of the exponential that keeps e^(a+b) = e^a e^b. */
const cxExp = a => ({ re:Math.exp(a.re) * Math.cos(a.im), im:Math.exp(a.re) * Math.sin(a.im) });
const cxLog = a => ({ re:Math.log(cxAbs(a)), im:cxArg(a) });     // principal branch
const cxPow = (a, b) => cxExp(cxMul(cxLog(a), b));
const cxSin = a => ({ re:Math.sin(a.re) * Math.cosh(a.im), im:Math.cos(a.re) * Math.sinh(a.im) });
const cxCos = a => ({ re:Math.cos(a.re) * Math.cosh(a.im), im:-Math.sin(a.re) * Math.sinh(a.im) });
function cxSqrt(a){
  const r = Math.sqrt(cxAbs(a)), t = cxArg(a) / 2;
  return { re:r * Math.cos(t), im:r * Math.sin(t) };
}

/* the n-th roots of a complex number: n points equally spaced on a circle,
   which is the whole content of "the fundamental theorem of algebra is easy
   once you go complex" */
function cxRoots(a, n){
  const r = Math.pow(cxAbs(a), 1 / n), t0 = cxArg(a) / n;
  return Array.from({ length:n }, (_, k) => {
    const t = t0 + 2 * Math.PI * k / n;
    return { re:r * Math.cos(t), im:r * Math.sin(t) };
  });
}

/* The Cauchy–Riemann test. A function is differentiable as a function of z only
   if u_x = v_y and u_y = −v_x; the residual is returned so the stage can print
   how badly a non-analytic function fails rather than merely saying that it does. */
function cxCR(f, z, h){
  const e = h || 1e-6;
  const fx = cxScale(cxSub(f({ re:z.re + e, im:z.im }), f({ re:z.re - e, im:z.im })), 1 / (2 * e));
  const fy = cxScale(cxSub(f({ re:z.re, im:z.im + e }), f({ re:z.re, im:z.im - e })), 1 / (2 * e));
  /* ∂f/∂x should equal −i ∂f/∂y for an analytic function */
  const rot = { re:fy.im, im:-fy.re };
  return { fx, fy, resid:cxAbs(cxSub(fx, rot)),
           ux:fx.re, vx:fx.im, uy:fy.re, vy:fy.im,
           cr1:fx.re - fy.im, cr2:fx.im + fy.re,
           deriv:fx };
}

/* ∮ f(z) dz along a parametrised path. Everything interesting in the subject is
   a statement about this number. */
function cxContour(f, path, n){
  const N = n || 2000;
  let sum = { re:0, im:0 };
  for(let i = 0; i < N; i++){
    const t0 = i / N, t1 = (i + 1) / N;
    const z0 = path(t0), z1 = path(t1);
    const dz = cxSub(z1, z0);
    const zm = { re:(z0.re + z1.re) / 2, im:(z0.im + z1.im) / 2 };
    const v = f(zm);
    if(!Number.isFinite(v.re) || !Number.isFinite(v.im)) continue;
    sum = cxAdd(sum, cxMul(v, dz));
  }
  return sum;
}
/* a circle, the contour every residue calculation actually uses */
const cxCircle = (c, r) => (t => ({ re:c.re + r * Math.cos(2 * Math.PI * t),
                                    im:c.im + r * Math.sin(2 * Math.PI * t) }));

/* The residue of a simple pole, by the definition rather than by a rule:
   shrink a circle around the point and divide by 2πi. If the limit settles the
   pole is simple and the number is the residue. */
function cxResidue(f, c, r){
  const I = cxContour(f, cxCircle(c, r || 0.12), 4000);
  return cxDiv(I, { re:0, im:2 * Math.PI });
}

/* the winding number of a closed path about a point — an integer, and the
   reason the punctured-plane demo in the vector wing gives 2π */
function cxWinding(path, c, n){
  const N = n || 2000;
  let total = 0, prev = cxArg(cxSub(path(0), c));
  for(let i = 1; i <= N; i++){
    const a = cxArg(cxSub(path(i / N), c));
    let d = a - prev;
    while(d > Math.PI) d -= 2 * Math.PI;
    while(d < -Math.PI) d += 2 * Math.PI;
    total += d; prev = a;
  }
  return total / (2 * Math.PI);
}

/* the named functions the stages offer, with their poles marked so a contour
   can be dragged around them */
const CX_FUNCS = {
  inv:   { n:'1/z',        f:z => cxDiv(cx(1, 0), z),                      poles:[cx(0, 0)], res:[cx(1, 0)] },
  invsq: { n:'1/z²',       f:z => cxDiv(cx(1, 0), cxMul(z, z)),            poles:[cx(0, 0)], res:[cx(0, 0)] },
  twop:  { n:'1/(z²+1)',   f:z => cxDiv(cx(1, 0), cxAdd(cxMul(z, z), cx(1, 0))),
           poles:[cx(0, 1), cx(0, -1)], res:[cx(0, -0.5), cx(0, 0.5)] },
  exp:   { n:'e^z',        f:cxExp,                                        poles:[], res:[] },
  sq:    { n:'z²',         f:z => cxMul(z, z),                             poles:[], res:[] },
  conj:  { n:'z̄  (not analytic)', f:cxConj,                                poles:[], res:[] },
  sin:   { n:'sin z',      f:cxSin,                                        poles:[], res:[] },
  pole2: { n:'1/(z−1)(z+1)', f:z => cxDiv(cx(1, 0), cxMul(cxSub(z, cx(1, 0)), cxAdd(z, cx(1, 0)))),
           poles:[cx(1, 0), cx(-1, 0)], res:[cx(0.5, 0), cx(-0.5, 0)] }
};
