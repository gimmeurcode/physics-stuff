/* ============================================================================
   6 · THE ANALYSES
   ============================================================================ */

/* --- DC operating point --------------------------------------------------- */
function ckOP(sch){
  const ck = ckCompileSch(sch);
  const r = ckSolveAt(ck, null, 'dc', 0, 0, {});
  ckSaveHistory(ck, r.x, 0, 'dc', 'be');
  return { ck, x: r.x, ok: r.ok, err: r.err || ck.err, warn: ck.warn };
}

/* --- transient ------------------------------------------------------------ */
/* A step size that resolves whatever is fastest in the circuit: the highest
   source frequency, the LC resonances, and the RC corners. */
function ckAutoStep(sch){
  let fmax = 0, hmin = 1e-3;
  const Rs = sch.comps.filter(c => c.kind === 'R');
  const Cs = sch.comps.filter(c => c.kind === 'C');
  const Ls = sch.comps.filter(c => c.kind === 'L' || c.kind === 'XFMR');
  for(const c of sch.comps){
    if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc'){
      if(c.freq) fmax = Math.max(fmax, c.freq);
      if(c.wave === 'exp' || c.wave === 'ring') hmin = Math.min(hmin, Math.max(1e-12, c.tau) / 40);
      if(c.wave === 'pulse') hmin = Math.min(hmin, Math.max(1e-12, c.pw) / 40);
    }
  }
  for(const L of Ls) for(const C of Cs){
    const Lv = L.kind === 'L' ? L.val : L.l1;
    fmax = Math.max(fmax, 1 / (2 * Math.PI * Math.sqrt(Math.max(1e-24, Lv * C.val))));
  }
  for(const C of Cs) for(const R of Rs) hmin = Math.min(hmin, Math.max(1e-12, R.val * C.val) / 30);
  for(const L of Ls) for(const R of Rs){
    const Lv = L.kind === 'L' ? L.val : L.l1;
    hmin = Math.min(hmin, Math.max(1e-12, Lv / Math.max(1e-6, R.val)) / 30);
  }
  if(fmax > 0) hmin = Math.min(hmin, 1 / (fmax * 300));
  return Math.max(1e-11, Math.min(1e-3, hmin));
}

function ckSimNew(sch, opt){
  opt = opt || {};
  const ck = ckCompileSch(sch);
  const s = { ck, sch, t:0, steps:0, h: opt.h || ckAutoStep(sch), method: opt.method || 'trap',
              ok:true, err: ck.err, warn: ck.warn, x: new Float64Array(Math.max(0, ck.n)) };
  if(ck.n > 0){
    if(opt.uic){
      /* start from the stated initial conditions instead of the quiescent point */
      for(const e of ck.els){
        if(e.kind === 'C'){ e.h.v = e.c.ic || 0; e.h.i = 0; }
        if(e.kind === 'L'){ e.h.i = e.c.ic || 0; e.h.v = 0; }
      }
    } else {
      const r = ckSolveAt(ck, null, 'dc', 0, 0, {});
      s.x = r.x; s.ok = r.ok; s.err = r.err || ck.err;
      ckSaveHistory(ck, s.x, 0, 'dc', 'be');
    }
  } else s.ok = false;
  return s;
}

/* advance one step; the first step after t = 0 uses backward Euler, which has
   no ringing, then trapezoidal takes over for its second-order accuracy */
function ckStep(s, h){
  if(!s.ok || s.ck.n <= 0) return false;
  h = h || s.h;
  const method = (s.steps === 0 || s.forceBE) ? 'be' : s.method;
  let r = ckSolveAt(s.ck, s.x, 'tran', h, s.t + h, { method });
  let tries = 0;
  while(!r.ok && tries < 4){
    h *= 0.25; tries++;
    r = ckSolveAt(s.ck, s.x, 'tran', h, s.t + h, { method:'be' });
  }
  if(!r.ok){ s.ok = false; s.err = r.err; return false; }
  s.x = r.x; s.t += h; s.steps++; s.lastH = h; s.forceBE = false;
  ckSaveHistory(s.ck, s.x, h, 'tran', tries ? 'be' : method);
  return true;
}

/* run a whole transient and return the samples — used by the tests and by the
   spectrum/RMS panels, which need a clean uniformly sampled record */
function ckTransient(sch, tstop, h, opt){
  const s = ckSimNew(sch, Object.assign({ h }, opt || {}));
  const out = { t:[], x:[], ok:s.ok, err:s.err, ck:s.ck, sim:s };
  if(!s.ok) return out;
  out.t.push(0); out.x.push(Float64Array.from(s.x));
  let guard = 0;
  while(s.t < tstop && guard++ < 2000000){
    if(!ckStep(s, h)){ out.ok = false; out.err = s.err; break; }
    out.t.push(s.t); out.x.push(Float64Array.from(s.x));
  }
  return out;
}

/* --- AC: a complex solve linearised about the operating point -------------- */
/* `gleak` puts a tiny conductance across every capacitor. It is needed only by
   the driving-point solve, which runs at ω = 0 where a capacitor is an open
   circuit and would otherwise leave its node with no equation at all. The
   ordinary AC analysis passes zero, so the frequency response stays exact
   rather than carrying a parasitic that would show up in the fifth decade. */
function ckAssembleAC(ck, xop, w, drive, gleak){
  const n = ck.n;
  const Ar = new Float64Array(n * n), Ai = new Float64Array(n * n);
  const br = new Float64Array(n), bi = new Float64Array(n);
  const V = i => (i >= 0 ? xop[i] : 0);
  for(const e of ck.els){
    const c = e.c;
    const a = ckNX(e.n[0]), b = ckNX(e.n[1]);
    switch(e.kind){
      case 'R': ckStampG(Ar, n, a, b, 1 / Math.max(1e-9, c.val)); break;
      case 'SW': ckStampG(Ar, n, a, b, ckSwitchG(e, 0)); break;
      case 'SWV': ckStampG(Ar, n, ckNX(e.n[2]), ckNX(e.n[3]), ckSwitchG(e, 0)); break;
      case 'C':
        ckStampG(Ai, n, a, b, w * Math.max(1e-18, c.val));
        if(gleak) ckStampG(Ar, n, a, b, gleak);
        break;
      case 'L': {
        const k = ck.iCur(e.cur);
        ckStampBranch(Ar, n, k, a, b);
        Ar[k * n + k] -= (c.esr || 0);
        Ai[k * n + k] -= w * Math.max(1e-15, c.val);
        for(const m of e.mut) Ai[k * n + ck.iCur(m.e.cur)] -= w * m.M;
        break;
      }
      case 'XFMR': {
        const k1 = ck.iCur(e.cur), k2 = ck.iCur(e.cur2);
        ckStampBranch(Ar, n, k1, ckNX(e.n[0]), ckNX(e.n[1]));
        ckStampBranch(Ar, n, k2, ckNX(e.n[2]), ckNX(e.n[3]));
        Ar[k1 * n + k1] -= (c.r1 || 0); Ar[k2 * n + k2] -= (c.r2 || 0);
        const L1 = Math.max(1e-12, c.l1), L2 = Math.max(1e-12, c.l2);
        const M = Math.max(-0.9999, Math.min(0.9999, c.k)) * Math.sqrt(L1 * L2);
        Ai[k1 * n + k1] -= w * L1; Ai[k1 * n + k2] -= w * M;
        Ai[k2 * n + k2] -= w * L2; Ai[k2 * n + k1] -= w * M;
        break;
      }
      case 'XFMRI': {
        const k = ck.iCur(e.cur), N = c.ratio || 1;
        const p1 = ckNX(e.n[0]), p2 = ckNX(e.n[1]), s1 = ckNX(e.n[2]), s2 = ckNX(e.n[3]);
        if(p1 >= 0){ Ar[k * n + p1] += 1; Ar[p1 * n + k] += 1; }
        if(p2 >= 0){ Ar[k * n + p2] -= 1; Ar[p2 * n + k] -= 1; }
        if(s1 >= 0){ Ar[k * n + s1] -= N; Ar[s1 * n + k] -= N; }
        if(s2 >= 0){ Ar[k * n + s2] += N; Ar[s2 * n + k] += N; }
        ckStampG(Ar, n, p1, p2, CK_XFMRI_GLEAK);
        break;
      }
      case 'V': {
        const k = ck.iCur(e.cur);
        ckStampBranch(Ar, n, k, a, b);
        Ar[k * n + k] -= (c.rs || 0);
        const ph = drive ? (c.name === drive ? { mag:1, ph:0 } : { mag:0, ph:0 }) : ckSourceAC(c);
        br[k] = ph.mag * Math.cos(ph.ph);
        bi[k] = ph.mag * Math.sin(ph.ph);
        break;
      }
      case 'I': {
        const ph = drive ? (c.name === drive ? { mag:1, ph:0 } : { mag:0, ph:0 }) : ckSourceAC(c);
        const Ire = ph.mag * Math.cos(ph.ph), Iim = ph.mag * Math.sin(ph.ph);
        ckStampI(br, a, b, Ire); ckStampI(bi, a, b, Iim);
        break;
      }
      case 'D': {
        /* small signal: the junction's slope conductance at the bias point */
        const vt = CK_VT * Math.max(0.1, c.nn || 1), Is = Math.max(1e-20, c.is);
        const vd = V(a) - V(b);
        ckStampG(Ar, n, a, b, Is * Math.exp(Math.min(60, vd / vt)) / vt + 1e-12);
        break;
      }
      case 'VCVS': {
        const k = ck.iCur(e.cur), g = c.gain;
        const cp = ckNX(e.n[0]), cm = ckNX(e.n[1]);
        ckStampBranch(Ar, n, k, ckNX(e.n[2]), ckNX(e.n[3]));
        if(cp >= 0) Ar[k * n + cp] -= g;
        if(cm >= 0) Ar[k * n + cm] += g;
        break;
      }
      case 'VCCS':
        ckStampVCCS(Ar, n, ckNX(e.n[2]), ckNX(e.n[3]), ckNX(e.n[0]), ckNX(e.n[1]), c.gain);
        break;
      case 'CCVS': {
        const k = ck.iCur(e.cur);
        ckStampBranch(Ar, n, k, a, b);
        if(e.ctlE) Ar[k * n + ck.iCur(e.ctlE.cur)] -= c.gain;
        break;
      }
      case 'CCCS': {
        if(!e.ctlE) break;
        const kc = ck.iCur(e.ctlE.cur);
        if(a >= 0) Ar[a * n + kc] += c.gain;
        if(b >= 0) Ar[b * n + kc] -= c.gain;
        break;
      }
      case 'OPAMP': {
        const p = ckNX(e.n[0]), m = ckNX(e.n[1]), o = ckNX(e.n[2]);
        const k = ck.iCur(e.cur);
        if(c.ideal){
          if(p >= 0) Ar[k * n + p] += 1;
          if(m >= 0) Ar[k * n + m] -= 1;
          if(o >= 0) Ar[o * n + k] += 1;
          break;
        }
        const ni = ck.iInt(e.ni);
        const C1 = 1 / (2 * Math.PI * Math.max(0.01, c.fp) * CK_OP_R1);
        const gm = Math.max(1e-9, c.a0) / CK_OP_R1;
        const Ilim = Math.max(1e-12, c.slew) * C1;
        ckStampG(Ar, n, p, m, 1 / CK_OP_RIN);
        ckStampG(Ar, n, p, -1, 1 / CK_OP_RIN);
        ckStampG(Ar, n, m, -1, 1 / CK_OP_RIN);
        const th = Math.tanh(Math.max(-40, Math.min(40, gm * (V(p) - V(m)) / Ilim)));
        ckStampVCCS(Ar, n, -1, ni, p, m, gm * (1 - th * th) + 1e-12);
        Ar[ni * n + ni] += 1 / CK_OP_R1;
        ckStampG(Ai, n, ni, -1, w * C1);
        if(o >= 0){ Ar[k * n + o] += 1; Ar[o * n + k] += 1; }
        Ar[k * n + k] -= Math.max(0.1, c.rout);
        Ar[k * n + ni] -= ckSat(xop[ni], c.vsat)[1];
        break;
      }
    }
  }
  return { Ar, Ai, br, bi };
}

/* one frequency; returns complex node voltages and branch currents */
function ckACAt(ck, xop, f, drive){
  const sys = ckAssembleAC(ck, xop, 2 * Math.PI * f, drive);
  return ckSolveComplex(sys.Ar, sys.Ai, sys.br, sys.bi, ck.n);
}
/* a logarithmic sweep. `probe` is a node index (≥1) or an element name whose
   current is wanted; `drive` names the source that carries the 1 V test signal. */
function ckACSweep(sch, f0, f1, npts, drive, probe){
  const op = ckOP(sch);
  const ck = op.ck;
  const out = { f:[], mag:[], db:[], phase:[], ok: op.ok, err: op.err, ck };
  if(!op.ok) return out;
  const N = Math.max(2, npts | 0);
  /* A voltage source's branch current is defined as the current entering its +
     terminal, which is the opposite of the current it delivers — a fixed 180°
     that would otherwise appear as a phase jump in the middle of the plot.
     Report what the source drives into the circuit instead. */
  const pe = (typeof probe === 'number') ? null : ck.byName.get(probe);
  const flip = pe && pe.kind === 'V' ? -1 : 1;
  out.delivered = flip < 0;
  let prev = null, turns = 0;
  for(let i = 0; i < N; i++){
    const f = f0 * Math.pow(f1 / f0, i / (N - 1));
    const z = ckACAt(ck, op.x, f, drive);
    if(!z){ out.ok = false; out.err = 'the AC matrix is singular at ' + ckEng(f, 'Hz'); break; }
    let re = 0, im = 0;
    if(typeof probe === 'number'){ const r = ckNX(probe); if(r >= 0){ re = z.re[r]; im = z.im[r]; } }
    else if(pe && pe.cur >= 0){ re = flip * z.re[ck.iCur(pe.cur)]; im = flip * z.im[ck.iCur(pe.cur)]; }
    const m = Math.hypot(re, im);
    out.f.push(f); out.mag.push(m);
    out.db.push(20 * Math.log10(Math.max(1e-300, m)));
    /* unwrap: a Bode phase that steps by 360° is an artefact of atan2, not physics */
    let ph = Math.atan2(im, re) * 180 / Math.PI + turns * 360;
    if(prev !== null){
      while(ph - prev >  180){ ph -= 360; turns--; }
      while(ph - prev < -180){ ph += 360; turns++; }
    }
    prev = ph;
    out.phase.push(ph);
  }
  return out;
}
