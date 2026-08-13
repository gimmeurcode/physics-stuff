/* ============================================================================
   5 · COMPILING A SCHEMATIC INTO AN MNA PROBLEM
   ============================================================================ */

const CK_NEEDS_CURRENT = { L:1, V:1, XFMRI:1, VCVS:1, CCVS:1, OPAMP:1 };

function ckCompileSch(sch){
  const nm = ckNodeMap(sch);
  const els = [], byName = new Map();
  let nInt = 0, nCur = 0;
  for(const c of sch.comps){
    if(c.kind === 'GND' || c.kind === 'M' || !CK_KINDS[c.kind]) continue;
    if(c.wave === 'expr' && !c._fn) ckCompileExpr(c);
    const e = { c, kind:c.kind, name:c.name, n: ckPins(c).map(p => nm.node(p)),
                cur:-1, cur2:-1, ni:-1, mut:[], vdOld:0,
                h:{ v:0, i:0, v2:0, i2:0, vc:0, ic:0 } };
    if(CK_NEEDS_CURRENT[c.kind]) e.cur = nCur++;
    if(c.kind === 'XFMR'){ e.cur = nCur++; e.cur2 = nCur++; }
    if(c.kind === 'OPAMP' && !c.ideal) e.ni = nInt++;
    els.push(e); byName.set(c.name, e);
  }
  /* the current-controlled pair reference the branch whose current drives them;
     only elements that carry a current unknown of their own can be sensed */
  for(const e of els){
    if(e.kind !== 'CCVS' && e.kind !== 'CCCS') continue;
    const src = byName.get(e.c.ctl);
    e.ctlE = (src && src !== e && src.cur >= 0) ? src : null;
    if(!e.ctlE) e.ctlErr = 'CCVS/CCCS ' + e.name + ' senses "' + e.c.ctl +
      '", which is not an element that carries a branch current (use a voltage source or an inductor)';
  }
  /* mutual inductance links two named inductors: M = k√(L₁L₂) */
  for(const c of sch.comps){
    if(c.kind !== 'M') continue;
    const A = byName.get(c.a), B = byName.get(c.b);
    if(!A || !B || A === B || A.kind !== 'L' || B.kind !== 'L') continue;
    const M = Math.max(-1, Math.min(1, c.k || 0)) * Math.sqrt(Math.max(0, A.c.val * B.c.val));
    A.mut.push({ e:B, M }); B.mut.push({ e:A, M });
  }
  const nN = nm.count - 1;
  const ck = { sch, nm, els, byName, nN, nInt, nCur, n: nN + nInt + nCur };
  ck.iInt = i => nN + i;
  ck.iCur = i => nN + nInt + i;
  ck.nonlinear = els.some(e => e.kind === 'D' || (e.kind === 'OPAMP' && !e.c.ideal));
  ck.err = ck.n <= 0 ? 'nothing to solve — place components and wire them together' : '';
  const bad = els.find(e => e.ctlErr);
  if(bad && !ck.err) ck.err = bad.ctlErr;
  ck.warn = nm.warn;
  return ck;
}

/* ---- stamping primitives -------------------------------------------------- */
/* index of a node's row: ground (node 0) has no equation */
const ckNX = k => (k > 0 ? k - 1 : -1);

function ckStampG(A, n, a, b, g){
  if(a >= 0){ A[a * n + a] += g; if(b >= 0) A[a * n + b] -= g; }
  if(b >= 0){ A[b * n + b] += g; if(a >= 0) A[b * n + a] -= g; }
}
/* a fixed current I leaving node a and entering node b */
function ckStampI(bv, a, b, I){
  if(a >= 0) bv[a] -= I;
  if(b >= 0) bv[b] += I;
}
/* a current g·(v(cp) − v(cm)) leaving node a and entering node b */
function ckStampVCCS(A, n, a, b, cp, cm, g){
  if(a >= 0){ if(cp >= 0) A[a * n + cp] += g; if(cm >= 0) A[a * n + cm] -= g; }
  if(b >= 0){ if(cp >= 0) A[b * n + cp] -= g; if(cm >= 0) A[b * n + cm] += g; }
}
/* branch current unknown `k` flowing from node a to node b, and the v(a) − v(b)
   part of that branch's own equation */
function ckStampBranch(A, n, k, a, b){
  if(a >= 0){ A[a * n + k] += 1; A[k * n + a] += 1; }
  if(b >= 0){ A[b * n + k] -= 1; A[k * n + b] -= 1; }
}

/* the op-amp output limiter: unity slope until the rails, then a smooth knee.
   Returns [value, d value/d u] so Newton can use it directly. */
function ckSat(u, vs){
  const D = 0.5, lin = Math.max(0.1, (vs === undefined ? 15 : vs) - D);
  const a = Math.abs(u);
  if(a <= lin) return [u, 1];
  const th = Math.tanh((a - lin) / D);
  return [Math.sign(u) * (lin + D * th), 1 - th * th];
}
/* SPICE's pn-junction limiter — without it the exponential overflows on the
   first Newton step of almost every rectifier */
function ckPnjLim(vnew, vold, vt, vcrit){
  if(vnew > vcrit && Math.abs(vnew - vold) > 2 * vt){
    if(vold > 0){
      const arg = 1 + (vnew - vold) / vt;
      vnew = arg > 0 ? vold + vt * Math.log(arg) : vcrit;
    } else {
      vnew = vnew > 0 ? vt * Math.log(Math.max(1e-12, vnew / vt)) : vcrit;
    }
  }
  return Math.max(-40, vnew);
}
const CK_VT = 0.025852;                       /* kT/q at 300 K, in volts */
const CK_XFMRI_GLEAK = 1e-9;                  /* the ideal transformer's magnetising leak */
const CK_OP_R1 = 1e6;                         /* op-amp gain-node resistance */
const CK_OP_RIN = 1e9;                        /* input resistance, differential and common mode */

/* ---- assemble one linearised system --------------------------------------- */
/* mode: 'dc' (capacitors open, inductors short) or 'tran' (companion models).
   x is the current Newton iterate; h the timestep; t the time the sources see. */
function ckAssemble(ck, x, mode, h, t, gmin, method){
  const n = ck.n, A = new Float64Array(n * n), bv = new Float64Array(n);
  const tran = mode === 'tran';
  const trap = tran && method !== 'be';
  const f = trap ? 2 / h : 1 / h;
  gmin = gmin || 0;
  const V = i => (i >= 0 ? x[i] : 0);
  /* set whenever a junction limiter has to hold a diode back. While that is
     happening the iterate is NOT a solution, however still it may be sitting —
     the node voltages can stall for several iterations while the limiter walks
     the junction voltage up, and mistaking that for convergence leaves the
     diode parked at the full supply. */
  let limited = false;

  for(const e of ck.els){
    const c = e.c;
    const a = ckNX(e.n[0]), b = ckNX(e.n[1]);
    switch(e.kind){
      case 'R': ckStampG(A, n, a, b, 1 / Math.max(1e-9, c.val)); break;

      case 'SW': ckStampG(A, n, a, b, ckSwitchG(e, tran ? t : 0)); break;

      case 'SWV': ckStampG(A, n, ckNX(e.n[2]), ckNX(e.n[3]), ckSwitchG(e, tran ? t : 0)); break;

      case 'C': {
        const Cv = Math.max(1e-18, c.val);
        if(!tran){ ckStampG(A, n, a, b, Math.max(gmin, 1e-12)); break; }
        const Geq = f * Cv;
        const Ieq = trap ? -(Geq * e.h.v + e.h.i) : -(Geq * e.h.v);
        ckStampG(A, n, a, b, Geq);
        ckStampI(bv, a, b, Ieq);
        break;
      }

      case 'L': {
        const k = ck.iCur(e.cur);
        ckStampBranch(A, n, k, a, b);
        A[k * n + k] -= (c.esr || 0);
        if(!tran) break;                                   /* a short at DC */
        const Lv = Math.max(1e-15, c.val);
        A[k * n + k] -= f * Lv;
        let rhs = -f * Lv * e.h.i;
        for(const m of e.mut){
          A[k * n + ck.iCur(m.e.cur)] -= f * m.M;
          rhs -= f * m.M * m.e.h.i;
        }
        if(trap) rhs -= e.h.v;
        bv[k] = rhs;
        break;
      }

      case 'XFMR': {
        const k1 = ck.iCur(e.cur), k2 = ck.iCur(e.cur2);
        const p1 = ckNX(e.n[0]), p2 = ckNX(e.n[1]), s1 = ckNX(e.n[2]), s2 = ckNX(e.n[3]);
        ckStampBranch(A, n, k1, p1, p2);
        ckStampBranch(A, n, k2, s1, s2);
        A[k1 * n + k1] -= (c.r1 || 0);
        A[k2 * n + k2] -= (c.r2 || 0);
        if(!tran) break;
        const L1 = Math.max(1e-12, c.l1), L2 = Math.max(1e-12, c.l2);
        const M = Math.max(-0.9999, Math.min(0.9999, c.k)) * Math.sqrt(L1 * L2);
        A[k1 * n + k1] -= f * L1; A[k1 * n + k2] -= f * M;
        A[k2 * n + k2] -= f * L2; A[k2 * n + k1] -= f * M;
        bv[k1] = -f * (L1 * e.h.i + M * e.h.i2) - (trap ? e.h.v : 0);
        bv[k2] = -f * (L2 * e.h.i2 + M * e.h.i) - (trap ? e.h.v2 : 0);
        break;
      }

      case 'XFMRI': {
        const k = ck.iCur(e.cur), N = c.ratio || 1;
        const p1 = ckNX(e.n[0]), p2 = ckNX(e.n[1]), s1 = ckNX(e.n[2]), s2 = ckNX(e.n[3]);
        if(p1 >= 0){ A[k * n + p1] += 1; A[p1 * n + k] += 1; }
        if(p2 >= 0){ A[k * n + p2] -= 1; A[p2 * n + k] -= 1; }
        if(s1 >= 0){ A[k * n + s1] -= N; A[s1 * n + k] -= N; }
        if(s2 >= 0){ A[k * n + s2] += N; A[s2 * n + k] += N; }
        ckStampG(A, n, p1, p2, CK_XFMRI_GLEAK);             /* magnetising leak, keeps it solvable */
        break;
      }

      case 'V': {
        const k = ck.iCur(e.cur);
        ckStampBranch(A, n, k, a, b);
        A[k * n + k] -= (c.rs || 0);
        bv[k] = ckSourceAt(c, tran ? t : 0);
        break;
      }

      case 'I': ckStampI(bv, a, b, ckSourceAt(c, tran ? t : 0)); break;

      case 'D': {
        const vt = CK_VT * Math.max(0.1, c.nn || 1), Is = Math.max(1e-20, c.is);
        const vcrit = vt * Math.log(vt / (Math.SQRT2 * Is));
        const raw = V(a) - V(b);
        const vd = ckPnjLim(raw, e.vdOld, vt, vcrit);
        if(Math.abs(vd - raw) > 1e-9) limited = true;
        const ex = Math.exp(Math.min(60, vd / vt));
        const Id = Is * (ex - 1) + gmin * vd;
        const gd = Is * ex / vt + gmin + 1e-12;
        ckStampG(A, n, a, b, gd);
        ckStampI(bv, a, b, Id - gd * vd);
        e.vdOld = vd;
        break;
      }

      case 'VCVS': {
        const k = ck.iCur(e.cur), g = c.gain;
        const cp = ckNX(e.n[0]), cm = ckNX(e.n[1]);
        ckStampBranch(A, n, k, ckNX(e.n[2]), ckNX(e.n[3]));
        if(cp >= 0) A[k * n + cp] -= g;
        if(cm >= 0) A[k * n + cm] += g;
        break;
      }

      case 'VCCS':
        ckStampVCCS(A, n, ckNX(e.n[2]), ckNX(e.n[3]), ckNX(e.n[0]), ckNX(e.n[1]), c.gain);
        break;

      /* current-controlled pair: the controlling current is already an unknown,
         so both stamp as a single extra column */
      case 'CCVS': {
        const k = ck.iCur(e.cur);
        ckStampBranch(A, n, k, a, b);
        if(e.ctlE) A[k * n + ck.iCur(e.ctlE.cur)] -= c.gain;
        break;
      }

      case 'CCCS': {
        if(!e.ctlE) break;
        const kc = ck.iCur(e.ctlE.cur);
        if(a >= 0) A[a * n + kc] += c.gain;
        if(b >= 0) A[b * n + kc] -= c.gain;
        break;
      }

      case 'OPAMP': {
        const p = ckNX(e.n[0]), m = ckNX(e.n[1]), o = ckNX(e.n[2]);
        const k = ck.iCur(e.cur);
        if(c.ideal){
          /* the nullor: the inputs are forced equal and draw nothing, and the
             output delivers whatever current that demands */
          if(p >= 0) A[k * n + p] += 1;
          if(m >= 0) A[k * n + m] -= 1;
          if(o >= 0) A[o * n + k] += 1;
          break;
        }
        const ni = ck.iInt(e.ni);
        const C1 = 1 / (2 * Math.PI * Math.max(0.01, c.fp) * CK_OP_R1);
        const gm = Math.max(1e-9, c.a0) / CK_OP_R1;
        const Ilim = Math.max(1e-12, c.slew) * C1;
        ckStampG(A, n, p, m, 1 / CK_OP_RIN);
        ckStampG(A, n, p, -1, 1 / CK_OP_RIN);
        ckStampG(A, n, m, -1, 1 / CK_OP_RIN);
        /* transconductance stage: saturating, so its limit IS the slew rate */
        const vd = V(p) - V(m);
        const th = Math.tanh(Math.max(-40, Math.min(40, gm * vd / Ilim)));
        const Ig = Ilim * th, G = gm * (1 - th * th) + 1e-12;
        ckStampVCCS(A, n, -1, ni, p, m, G);
        ckStampI(bv, -1, ni, Ig - G * vd);
        A[ni * n + ni] += 1 / CK_OP_R1;                      /* the pole's R … */
        if(tran){                                            /* … and its C */
          const Geq = f * C1;
          const Ieq = trap ? -(Geq * e.h.vc + e.h.ic) : -(Geq * e.h.vc);
          A[ni * n + ni] += Geq;
          ckStampI(bv, ni, -1, Ieq);
        }
        /* output branch: v(out) − rout·i − sat(v_ni) = 0, returning to ground
           because the current an op amp delivers comes from its rails */
        const vni = x[ni];
        const sat = ckSat(vni, c.vsat);
        if(o >= 0){ A[k * n + o] += 1; A[o * n + k] += 1; }
        A[k * n + k] -= Math.max(0.1, c.rout);
        A[k * n + ni] -= sat[1];
        bv[k] = sat[0] - sat[1] * vni;
        break;
      }
    }
  }
  return { A, b: bv, limited };
}

/* ---- Newton driver -------------------------------------------------------- */
function ckSolveAt(ck, x0, mode, h, t, opt){
  opt = opt || {};
  const n = ck.n;
  if(n <= 0) return { x: new Float64Array(0), ok:false, err: ck.err || 'empty circuit', iters:0 };
  let x = new Float64Array(n);
  if(x0) x.set(x0.subarray ? x0.subarray(0, n) : x0);

  if(!ck.nonlinear){
    const sys = ckAssemble(ck, x, mode, h, t, 0, opt.method);
    const xs = ckSolveLin(sys.A, sys.b, n);
    if(!xs) return { x, ok:false, iters:1,
      err:'the matrix is singular — usually a node connected to nothing, or a loop of voltage sources' };
    return { x: xs, ok:true, iters:1 };
  }

  /* Gmin stepping: solve an easier, leakier circuit first and walk the leakage
     away, using each solution as the next initial guess */
  const ladder = opt.hard ? [1e-2, 1e-4, 1e-6, 1e-9, 1e-12] : [1e-12];
  let last = x, lastOk = false;
  for(const gmin of ladder){
    let xx = new Float64Array(n); xx.set(last);
    for(const e of ck.els) e.vdOld = 0;
    lastOk = false;
    for(let it = 0; it < 200; it++){
      const sys = ckAssemble(ck, xx, mode, h, t, gmin, opt.method);
      const xs = ckSolveLin(sys.A, sys.b, n);
      if(!xs) break;
      let done = !sys.limited;                 /* a clamped junction is not a solution */
      for(let i = 0; i < n; i++){
        if(!Number.isFinite(xs[i])){ xs[i] = 0; done = false; }
        else if(Math.abs(xs[i] - xx[i]) > 1e-9 + 1e-4 * Math.abs(xs[i])) done = false;
      }
      xx = xs;
      if(done && it >= 1){ lastOk = true; break; }
    }
    last = xx;
    if(lastOk && gmin <= 1e-12){ ck.gminUsed = gmin; return { x: last, ok:true, iters:0 }; }
  }
  if(!opt.hard) return ckSolveAt(ck, x0, mode, h, t, Object.assign({}, opt, { hard:true }));
  return { x: last, ok:lastOk, iters:0,
           err: lastOk ? '' : 'Newton did not converge — try a smaller step, or add a little series resistance' };
}

/* ---- history: what the companion models remember about the last step ------ */
function ckSaveHistory(ck, x, h, mode, method){
  const V = k => (k > 0 ? x[k - 1] : 0);
  const trap = mode === 'tran' && method !== 'be';
  const f = trap ? 2 / h : 1 / h;
  for(const e of ck.els){
    const c = e.c;
    if(e.kind === 'C'){
      const v = V(e.n[0]) - V(e.n[1]);
      let i = 0;
      if(mode === 'tran'){
        const Geq = f * Math.max(1e-18, c.val);
        const Ieq = trap ? -(Geq * e.h.v + e.h.i) : -(Geq * e.h.v);
        i = Geq * v + Ieq;
      }
      e.h.v = v; e.h.i = i;
    } else if(e.kind === 'L'){
      const i = x[ck.iCur(e.cur)];
      e.h.i = i;
      e.h.v = V(e.n[0]) - V(e.n[1]) - (c.esr || 0) * i;
    } else if(e.kind === 'XFMR'){
      const i1 = x[ck.iCur(e.cur)], i2 = x[ck.iCur(e.cur2)];
      e.h.i = i1; e.h.i2 = i2;
      e.h.v  = V(e.n[0]) - V(e.n[1]) - (c.r1 || 0) * i1;
      e.h.v2 = V(e.n[2]) - V(e.n[3]) - (c.r2 || 0) * i2;
    } else if(e.kind === 'OPAMP' && e.ni >= 0){
      const v = x[ck.iInt(e.ni)];
      let i = 0;
      if(mode === 'tran'){
        const C1 = 1 / (2 * Math.PI * Math.max(0.01, c.fp) * CK_OP_R1);
        const Geq = f * C1;
        const Ieq = trap ? -(Geq * e.h.vc + e.h.ic) : -(Geq * e.h.vc);
        i = Geq * v + Ieq;
      }
      e.h.vc = v; e.h.ic = i;
    } else if(e.kind === 'SWV'){
      /* latch the contact between steps, with hysteresis, so the next Newton
         solve sees a switch that cannot chatter */
      const vc = V(e.n[0]) - V(e.n[1]);
      const hy = Math.abs(c.vhys || 0);
      if(e.swOn) e.swOn = vc > (c.vth || 0) - hy;
      else       e.swOn = vc > (c.vth || 0) + hy;
    }
  }
}

