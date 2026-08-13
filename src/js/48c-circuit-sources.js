/* ============================================================================
   4 · SOURCE WAVEFORMS
   Every waveform is a pure function of t, so the Newton iterations inside one
   timestep all see the same source value — a requirement for convergence.
   Edges are given a finite rise time because nothing in nature switches in
   zero seconds, and an ideal step would ring the trapezoidal integrator.
   ============================================================================ */

const CK_WAVES = ['dc','sin','square','tri','saw','step','pulse','exp','ring','chirp','am','noise','expr'];
const CK_WAVE_NAMES = {
  dc:'DC (constant)', sin:'sine (AC)', square:'square', tri:'triangle', saw:'sawtooth',
  step:'step', pulse:'single pulse', exp:'decaying exponential', ring:'damped sine',
  chirp:'chirp (swept frequency)', am:'amplitude modulated', noise:'band-limited noise',
  expr:'any expression in t'
};

function ckCompileExpr(c){
  try { c._fn = compile(parse(String(c.expr || '0'))); c._err = ''; }
  catch(e){ c._fn = null; c._err = (e && e.message) ? e.message : String(e); }
}
/* the lab's parser resolves the symbol t through CLOCK; borrow it and put it
   back, so nothing else in the app can notice */
function ckEvalT(fn, t){
  const save = CLOCK.t;
  CLOCK.t = t;
  let v;
  try { v = fn(t, 0, 0); } finally { CLOCK.t = save; }
  return Number.isFinite(v) ? v : 0;
}
const ckEdge = (x, w) => 0.5 * (1 + Math.tanh(x / Math.max(1e-12, w)));
function ckValueNoise(s){
  const h = k => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; };
  const i = Math.floor(s), f = s - i, w = f * f * (3 - 2 * f);
  return h(i) * (1 - w) + h(i + 1) * w;
}

function ckSourceAt(c, t){
  const A = c.amp === undefined ? 0 : c.amp;
  const f = c.freq || 0, off = c.off || 0;
  const ph = (c.phase || 0) * Math.PI / 180;
  const T = f > 0 ? 1 / f : 1e12;
  const frac = ((t / T + ph / (2 * Math.PI)) % 1 + 1) % 1;
  switch(c.wave){
    case 'sin':    return off + A * Math.sin(2 * Math.PI * f * t + ph);
    case 'square': {
      const e = Math.max(1e-6, c.tr === undefined ? 0.02 : c.tr) * 0.5;
      const D = c.duty === undefined ? 0.5 : c.duty;
      return off + A * (2 * ckEdge(frac, e) * ckEdge(D - frac, e) - 1);
    }
    case 'tri':    return off + A * (frac < 0.5 ? 4 * frac - 1 : 3 - 4 * frac);
    case 'saw':    { const w = 0.03; return off + A * (frac < 1 - w ? 2 * frac / (1 - w) - 1 : 1 - 2 * (frac - (1 - w)) / w); }
    case 'step':   return off + A * ckEdge(t - (c.t0 || 0), Math.max(1e-12, (c.tr === undefined ? 0.02 : c.tr) * T * 0.1));
    case 'pulse':  { const t0 = c.t0 || 0, pw = Math.max(1e-12, c.pw || 1e-3), e = pw * 0.02;
                     return off + A * ckEdge(t - t0, e) * ckEdge(t0 + pw - t, e); }
    case 'exp':    return off + A * Math.exp(-Math.max(0, t) / Math.max(1e-12, c.tau || 1e-3));
    case 'ring':   return off + A * Math.exp(-Math.max(0, t) / Math.max(1e-12, c.tau || 1e-3)) * Math.sin(2 * Math.PI * f * t + ph);
    case 'chirp':  return off + A * Math.sin(2 * Math.PI * (f * t + 0.5 * (c.rate || 0) * t * t) + ph);
    case 'am':     return off + A * (1 + (c.depth === undefined ? 0.5 : c.depth) * Math.sin(2 * Math.PI * (c.fm || 100) * t)) * Math.sin(2 * Math.PI * f * t + ph);
    case 'noise':  return off + A * ckValueNoise(t * Math.max(1, f));
    case 'expr':   return c._fn ? ckEvalT(c._fn, t) : 0;
    default:       return c.val;
  }
}
/* the small-signal phasor a source presents to the AC analysis */
function ckSourceAC(c){
  if(c.acm !== undefined) return { mag: c.acm, ph: (c.acp || 0) * Math.PI / 180 };
  if(c.wave === 'sin' || c.wave === 'am' || c.wave === 'chirp' || c.wave === 'ring')
    return { mag: c.amp || 0, ph: (c.phase || 0) * Math.PI / 180 };
  return { mag: 0, ph: 0 };
}

