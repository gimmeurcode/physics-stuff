/* ============================================================================
   SOLVER PLUMBING
   ============================================================================ */
const ckGeomKey = sch =>
  sch.comps.map(c => [c.kind, c.name, c.x, c.y, c.rot || 0].join(',')).join('|') + '#' +
  sch.wires.map(w => [w.a.x, w.a.y, w.b.x, w.b.y].join(',')).join('|');

/* rebuild the simulation. Called whenever anything about the circuit changes —
   a value, a wire, a rotation — because all of those change the matrix. */
function ckRebuild(st, restart){
  for(const c of st.sch.comps) if(c.wave === 'expr') ckCompileExpr(c);
  const h = ckAutoStep(st.sch);
  st.sim = ckSimNew(st.sch, { h, uic: !!st.uic });
  st.err = st.sim.ok ? '' : (st.sim.err || '');
  st.warn = st.sim.warn || '';
  st.h = h;
  if(restart || !st.hist) st.hist = [];
  st.flow = null;
  st.fieldKey = '';
  st.bodeCache = null; st.sweepCache = null;
  ckSample(st);
}
/* how many simulated seconds pass per real second */
function ckTimeScale(st){
  if(st.tscale) return st.tscale;
  let f = 0;
  for(const c of st.sch.comps) if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc' && c.freq) f = Math.max(f, c.freq);
  if(!f && st.sim) f = 1 / Math.max(1e-9, st.sim.h * 400);
  return Math.max(1e-9, Math.min(1, 2 / Math.max(1, f)));      /* ≈ two periods per second */
}
function ckWindow(st){
  if(st.win) return st.win;
  let f = 0;
  for(const c of st.sch.comps) if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc' && c.freq) f = Math.max(f, c.freq);
  if(f) return Math.max(1e-9, 3 / f);
  return Math.max(1e-9, (st.sim ? st.sim.h : 1e-6) * 600);
}
/* Step the circuit forward by `span` simulated seconds, capped so a slow frame
   can never lock the page up. The scope is sampled often enough to draw a
   smooth trace but not once per solver step — a full measurement is far more
   expensive than a timestep, and only the last one is displayed. */
function ckAdvance(st, span){
  const s = st.sim;
  if(!s || !s.ok) return;
  const h = st.h || s.h;
  const n = Math.min(6000, Math.max(1, Math.round(span / h)));
  const tr = ckActiveTraces(st, s.ck);
  const every = Math.max(1, Math.ceil(n / 500));
  for(let k = 0; k < n; k++){
    if(!ckStep(s, h)){ st.err = s.err; break; }
    if(k % every === 0 || k === n - 1) ckPush(st, tr);
  }
  ckSample(st);
}
/* one cheap scope sample: only the signals actually being plotted */
function ckPush(st, tr){
  const s = st.sim;
  const row = { t: s.t, v: tr.map(t => ckQuickValue(st, s.ck, s.x, t)) };
  st.hist.push(row);
  const keep = ckWindow(st) * 1.3;
  while(st.hist.length > 4 && st.hist[0].t < s.t - keep && s.t > keep) st.hist.shift();
  if(st.hist.length > 6000) st.hist.splice(0, st.hist.length - 6000);
}
function ckQuickValue(st, ck, x, t){
  if(t.kind === 'v') return t.node > 0 ? x[t.node - 1] : 0;
  const e = ck.byName.get(t.name);
  if(!e) return 0;
  const q = ckElemState(ck, e, x, st.h || st.sim.h, st.sim.steps ? 'trap' : 'be',
                        st.sim.steps ? 'tran' : 'dc');
  return t.kind === 'i' ? ckShowI(q) : ckShowP(q);
}
/* the full measurement, once per frame — this is what the panels read */
function ckSample(st){
  const s = st.sim;
  if(!s || !s.ok) return;
  st.meas = ckMeasure(s.ck, s.x, st.h || s.h, s.steps ? 'trap' : 'be', s.steps ? 'tran' : 'dc', s.t);
  if(!st.hist.length) ckPush(st, ckActiveTraces(st, s.ck));
}

/* ---- what can be plotted, and what it currently reads --------------------- */
function ckSignalList(ck){
  const out = [];
  for(let k = 1; k < ck.nm.count; k++) out.push({ id:'v' + k, kind:'v', node:k, label:'V(node ' + k + ')', unit:'V' });
  for(const e of ck.els){
    if(e.kind === 'GND') continue;
    out.push({ id:'i' + e.name, kind:'i', name:e.name, label:'I(' + e.name + ')', unit:'A' });
  }
  for(const e of ck.els){
    if(e.kind === 'GND') continue;
    out.push({ id:'p' + e.name, kind:'p', name:e.name, label:'P(' + e.name + ')', unit:'W' });
  }
  return out;
}
function ckActiveTraces(st, ck){
  const all = ckSignalList(ck);
  if(st.traces && st.traces.length) return all.filter(o => st.traces.indexOf(o.id) >= 0);
  /* a sensible default: the source's terminal voltage and the current it drives */
  const src = ck.els.find(e => e.kind === 'V');
  const def = [];
  if(src && src.n[0] > 0) def.push(all.find(o => o.id === 'v' + src.n[0]));
  /* an amplifier's output is always the interesting node */
  for(const amp of ck.els) if(amp.kind === 'OPAMP' && amp.n[2] > 0)
    def.push(all.find(o => o.id === 'v' + amp.n[2]));
  const last = ck.els.filter(e => e.kind === 'R' || e.kind === 'C' || e.kind === 'L').pop();
  if(last){
    const nd = last.n[0] > 0 ? last.n[0] : last.n[1];
    if(nd > 0) def.push(all.find(o => o.id === 'v' + nd));
  }
  if(src) def.push(all.find(o => o.id === 'i' + src.name));
  const seen = {};
  return def.filter(o => o && !seen[o.id] && (seen[o.id] = 1));
}
function ckSignalValue(st, t){
  const m = st.meas;
  if(!m) return 0;
  if(t.kind === 'v') return m.nodeV[t.node] || 0;
  const s = m.states.find(q => q.name === t.name);
  if(!s) return 0;
  return t.kind === 'i' ? ckShowI(s) : ckShowP(s);
}
/* The solver works in one convention throughout — i enters pin 1 — because that
   is what makes p = v·i the absorbed power for every element and Tellegen's sum
   close to machine precision. But nobody describes a battery by the current
   flowing INTO its positive terminal. So the display flips voltage sources, and
   flips their power with them, which keeps p = v·i true on screen as well. */
const ckIsSrc = kind => kind === 'V';
const ckShowI = s => ckIsSrc(s.kind) ? -s.i : s.i;
const ckShowP = s => ckIsSrc(s.kind) ? -s.p : s.p;
/* the verb follows the sign, not the part: a source feeding an inductor gets
   that energy back a quarter cycle later, and for those instants it really is
   absorbing. Saying otherwise would hide the whole point of reactive power. */
function ckShowVerb(s){
  const pos = ckShowP(s) >= 0;
  return ckIsSrc(s.kind) ? (pos ? 'delivers' : 'absorbs') : (pos ? 'absorbs' : 'delivers');
}

const CK_TRACE_COLS = ['--c-grad', '--c-pos', '--c-neg', '--c-curl', '--c-warn'];
const ckTraceColour = i => 'var(' + CK_TRACE_COLS[i % CK_TRACE_COLS.length] + ')';
const ckTraceRGB = i => [TH.grad, TH.pos, TH.neg, TH.curl, TH.warn][i % 5];

/* ---- <select> option lists ------------------------------------------------ */
function ckIndOptions(cur){
  if(!ST) return '';
  return ST.sch.comps.filter(c => c.kind === 'L')
    .map(c => `<option value="${c.name}" ${c.name === cur ? 'selected' : ''}>${c.name}</option>`).join('') ||
    '<option value="">— place two inductors first —</option>';
}
function ckCtlOptions(cur){
  if(!ST) return '';
  return ST.sch.comps.filter(c => c.kind === 'V' || c.kind === 'L')
    .map(c => `<option value="${c.name}" ${c.name === cur ? 'selected' : ''}>${c.name}</option>`).join('') ||
    '<option value="">— needs a voltage source or inductor to sense —</option>';
}
function ckSrcOptions(ck, cur){
  const srcs = ck.els.filter(e => e.kind === 'V' || e.kind === 'I');
  if(!srcs.length) return '<option value="">— no sources —</option>';
  if(!cur) cur = srcs[0].name;
  return srcs.map(e => `<option value="${e.name}" ${e.name === cur ? 'selected' : ''}>${e.name}</option>`).join('');
}
function ckProbeOptions(ck, cur){
  let h = '';
  for(let k = 1; k < ck.nm.count; k++)
    h += `<option value="${k}" ${String(cur) === String(k) ? 'selected' : ''}>V(node ${k})</option>`;
  for(const e of ck.els) if(e.cur >= 0)
    h += `<option value="${e.name}" ${cur === e.name ? 'selected' : ''}>I(${e.name})</option>`;
  return h;
}
function ckSweepOptions(st){
  return st.sch.comps.filter(c => ['V','I','R','C','L'].indexOf(c.kind) >= 0)
    .map(c => `<option value="${c.name}" ${c.name === st.sweep.name ? 'selected' : ''}>${c.name}</option>`).join('');
}

/* ---- the source waveform editor, shared by V and I ------------------------ */
function ckSourceRows(c, unit){
  const num = (id, label, val, u) =>
    `<div class="row"><label class="lb" style="width:96px">${label}</label>
      <div class="fld" style="flex:1"><input id="${id}" value="${val}" spellcheck="false" autocomplete="off"><span class="pre">${u}</span></div></div>`;
  let h = `<div class="row"><label class="lb" style="width:96px">waveform</label>
      <select class="sel" id="ckWave">${CK_WAVES.map(w =>
        `<option value="${w}" ${w === c.wave ? 'selected' : ''}>${CK_WAVE_NAMES[w]}</option>`).join('')}</select></div>`;
  const W = c.wave;
  if(W === 'dc') h += num('ckDC', 'value', ckEng(c.val, ''), unit);
  if(['sin','square','tri','saw','ring','chirp','am','noise','step','pulse','exp'].indexOf(W) >= 0)
    h += num('ckAmp', 'amplitude', ckEng(c.amp, ''), unit);
  if(['sin','square','tri','saw','ring','chirp','am','noise'].indexOf(W) >= 0)
    h += num('ckFreq', 'frequency f', ckEng(c.freq, ''), 'Hz');
  if(['sin','square','tri','saw','ring','chirp','am'].indexOf(W) >= 0)
    h += ctlRow('phase φ', ctlSlider('ckPhase', 0, 360, 1, c.phase));
  if(W === 'square') h += ctlRow('duty', ctlSlider('ckDuty', 0.02, 0.98, 0.01, c.duty));
  if(W === 'exp' || W === 'ring') h += num('ckTau', 'time constant τ', ckEng(c.tau, ''), 's');
  if(W === 'step' || W === 'pulse') h += num('ckT0', 'starts at t₀', ckEng(c.t0, ''), 's');
  if(W === 'pulse') h += num('ckPW', 'width', ckEng(c.pw, ''), 's');
  if(W === 'chirp') h += num('ckRate', 'sweep rate', ckEng(c.rate, ''), 'Hz/s');
  if(W === 'am') h += num('ckFM', 'modulation f', ckEng(c.fm, ''), 'Hz') +
                      ctlRow('depth', ctlSlider('ckDepth', 0, 1, 0.01, c.depth));
  if(['sin','square','tri','saw','noise','step','pulse','exp','ring','chirp','am'].indexOf(W) >= 0)
    h += num('ckOff', 'DC offset', ckEng(c.off, ''), unit);
  if(W === 'expr'){
    h += `<div class="row" style="align-items:flex-start"><label class="lb" style="width:96px">${unit === 'V' ? 'v(t) =' : 'i(t) ='}</label>
      <div class="fld" style="flex:1"><input id="ckExpr" value="${(c.expr || '').replace(/"/g, '&quot;')}" spellcheck="false" autocomplete="off"></div></div>
      <div class="help" id="ckExprErr" style="color:${c._err ? 'var(--c-neg)' : 'var(--faint)'}">${c._err ? '⚠ ' + c._err : ''}</div>
      <p class="help">Any function of <b>t</b>, in seconds. The full library is available —
      <b>sin cos tan asin acos atan sinh cosh tanh exp ln log sqrt abs sign floor min max atan2</b>,
      with <b>π</b> as <code>pi</code> and <b>2π</b> as <code>tau</code>. That is enough for anything
      piecewise too: <code>sign(sin(tau*1000*t))</code> is a square wave,
      <code>2*(1000*t - floor(1000*t)) - 1</code> a sawtooth,
      <code>5*exp(-t/0.002)*sin(tau*3000*t)</code> a ringing transient.</p>`;
  }
  if(unit === 'V') h += num('ckRs', 'series R', ckEng(c.rs || 0, ''), 'Ω');
  return h;
}

/* ---- hit testing ---------------------------------------------------------- */
function ckHitTest(sch, g){
  let hit = -1, best = 0.75;
  sch.comps.forEach((c, i) => {
    const d = Math.hypot(c.x - g.x, c.y - g.y);
    if(d < best){ best = d; hit = i; }
  });
  return hit;
}
function ckWireHit(sch, g){
  for(let i = 0; i < sch.wires.length; i++) if(ckOnSegment(g, sch.wires[i])) return i;
  return -1;
}
function ckPinAt(sch, p){
  for(const c of sch.comps) for(const q of ckPins(c)) if(ckKey(q) === ckKey(p)) return true;
  return false;
}

