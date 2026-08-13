/* ============================================================================
   THE INSTRUMENTS
   ============================================================================ */
function ckPaneAxes(ctx, P, xlabel, ylabel, title){
  plotFrame(ctx, P, xlabel, ylabel, title);
  plotZeroY(ctx, P);
}
/* the trace key, above the plot's own title so the two never collide */
function ckLegendRow(ctx, P, items){
  ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  let x = P.px + 4;
  const y = P.py - 26;
  items.forEach(it => {
    ctx.fillStyle = rgbCss(it.col);
    ctx.fillRect(x, y - 1, 9, 3);
    ctx.fillText(it.label, x + 13, y);
    x += 22 + ctx.measureText(it.label).width;
  });
}

/* A real oscilloscope gives each channel its own volts-per-division, and it has
   to: a 15 mA current plotted against a 5 V axis is a flat line. Here every
   *unit* gets a full scale of its own, so traces sharing a unit stay directly
   comparable while amps and volts are both visible at once. */
function ckPaneScope(st, ctx, r){
  const ck = st.sim && st.sim.ck;
  if(!ck || !st.hist.length){ ckPaneEmpty(ctx, r, 'no samples yet — press Run'); return; }
  const tr = ckActiveTraces(st, ck);
  if(!tr.length){ ckPaneEmpty(ctx, r, 'tick a trace to plot'); return; }
  const win = ckWindow(st);
  /* Until the run is longer than the window, hold the axis at [0, win] and let
     the trace grow into it — the way a triggered scope behaves. Scrolling from
     the start would plot time before the circuit existed. */
  const t1 = Math.max(win, st.sim.t), t0 = t1 - win;
  const fs = {};
  for(const t of tr) fs[t.unit] = 1e-30;
  for(const row of st.hist){
    if(row.t < t0) continue;
    tr.forEach((t, k) => { const v = row.v[k];
      if(Number.isFinite(v)) fs[t.unit] = Math.max(fs[t.unit], Math.abs(v)); });
  }
  for(const u in fs) fs[u] *= 1.15;

  const P = mkPlot(r.x, r.y, r.w, r.h, t0, t1, -1, 1);
  ckPaneAxes(ctx, P, 'time  t (s)', '', 'Oscilloscope — the circuit in time');
  plotTicksX(ctx, P, [t0, t0 + win / 4, t0 + win / 2, t0 + 3 * win / 4, t1], v => ckEng(v, 's'));
  /* the full scale of each unit, stacked down the axis like a scope's channels */
  ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  const units = Object.keys(fs);
  units.forEach((u, i) => {
    const col = ckTraceRGB(tr.findIndex(t => t.unit === u));
    ctx.fillStyle = rgbCss(col, 0.95);
    ctx.fillText('+' + ckEng(fs[u], u), P.px - 5, P.Y(1) + 6 + i * 12);
    ctx.fillText('−' + ckEng(fs[u], u), P.px - 5, P.Y(-1) - 6 - (units.length - 1 - i) * 12);
  });
  ctx.fillStyle = rgbCss(TH.faint);
  ctx.fillText('0', P.px - 5, P.Y(0));

  tr.forEach((t, k) => {
    const scale = fs[t.unit] || 1;
    ctx.strokeStyle = rgbCss(ckTraceRGB(k)); ctx.lineWidth = 1.7;
    ctx.beginPath();
    let started = false;
    for(const row of st.hist){
      if(row.t < t0) continue;
      const y = row.v[k];
      if(!Number.isFinite(y)){ started = false; continue; }
      const X = P.X(row.t), Y = P.Y(Math.max(-1, Math.min(1, y / scale)));
      started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true);
    }
    ctx.stroke();
  });
  ckLegendRow(ctx, P, tr.map((t, k) => ({ col: ckTraceRGB(k),
    label: t.label + ' = ' + ckEng(ckSignalValue(st, t), t.unit) })));
}

function ckPaneBode(st, ctx, r){
  const ck = st.sim && st.sim.ck;
  if(!ck) return ckPaneEmpty(ctx, r, 'no circuit');
  const drive = st.drive || (ck.els.find(e => e.kind === 'V' || e.kind === 'I') || {}).name;
  if(!drive) return ckPaneEmpty(ctx, r, 'add a source to sweep');
  let probe = st.bode.probe;
  if(!probe) probe = ck.nm.count > 1 ? 1 : '';
  const key = ckGeomKey(st.sch) + drive + probe + st.bode.f0 + st.bode.f1 +
              st.sch.comps.map(c => c.val + ',' + c.l1 + ',' + c.k + ',' + c.gain).join(';');
  if(!st.bodeCache || st.bodeCache.key !== key){
    const num = /^\d+$/.test(String(probe)) ? +probe : probe;
    st.bodeCache = { key, d: ckACSweep(st.sch, st.bode.f0, st.bode.f1, st.bode.n, drive, num) };
  }
  const d = st.bodeCache.d;
  if(!d.ok || !d.f.length) return ckPaneEmpty(ctx, r, d.err || 'the sweep did not solve');
  const half = (r.h - 22) / 2;
  const lf = Math.log10(d.f[0]), hf = Math.log10(d.f[d.f.length - 1]);
  let dmin = Infinity, dmax = -Infinity;
  for(const v of d.db){ if(Number.isFinite(v)){ dmin = Math.min(dmin, v); dmax = Math.max(dmax, v); } }
  if(!Number.isFinite(dmin)){ dmin = -60; dmax = 20; }
  dmin = Math.max(dmin, dmax - 120);
  const P1 = mkPlot(r.x, r.y, r.w, half, lf, hf, dmin - 3, dmax + 3);
  ckPaneAxes(ctx, P1, '', 'gain (dB)', 'Bode — magnitude 20 log₁₀|H(jω)| and phase arg H(jω)');
  const decades = [];
  for(let k = Math.ceil(lf); k <= Math.floor(hf); k++) decades.push(k);
  plotTicksX(ctx, P1, decades, v => ckEng(Math.pow(10, v), 'Hz'));
  ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.8;
  ctx.beginPath();
  d.f.forEach((f, i) => { const X = P1.X(Math.log10(f)), Y = P1.Y(d.db[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  /* the −3 dB line, the definition of a bandwidth */
  const peak = Math.max.apply(null, d.db.filter(Number.isFinite));
  ctx.strokeStyle = rgbCss(TH.faint, 0.8); ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(P1.px, P1.Y(peak - 3)); ctx.lineTo(P1.px + P1.pw, P1.Y(peak - 3)); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('−3 dB', P1.px + 4, P1.Y(peak - 3) - 2);
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(fmtNum(dmax, 3) + ' dB', P1.px - 5, P1.Y(dmax));
  ctx.fillText(fmtNum(dmin, 3), P1.px - 5, P1.Y(dmin));

  /* frame the unwrapped phase on whole quadrants, so 0°, ±90° and ±180° land on gridlines */
  let pmin = Infinity, pmax = -Infinity;
  for(const v of d.phase){ if(Number.isFinite(v)){ pmin = Math.min(pmin, v); pmax = Math.max(pmax, v); } }
  if(!Number.isFinite(pmin)){ pmin = -180; pmax = 180; }
  pmin = Math.min(-15, Math.floor(pmin / 90) * 90);
  pmax = Math.max(15, Math.ceil(pmax / 90) * 90);
  const P2 = mkPlot(r.x, r.y + half + 22, r.w, half - 22, lf, hf, pmin - 10, pmax + 10);
  ckPaneAxes(ctx, P2, 'frequency  f (Hz), logarithmic', 'phase (°)', '');
  plotTicksX(ctx, P2, decades, v => ckEng(Math.pow(10, v), 'Hz'));
  ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 1.6;
  ctx.beginPath();
  d.f.forEach((f, i) => { const X = P2.X(Math.log10(f)), Y = P2.Y(d.phase[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(let a = pmin; a <= pmax; a += 90) ctx.fillText(a + '°', P2.px - 5, P2.Y(a));
}

function ckPaneSweep(st, ctx, r){
  const ck = st.sim && st.sim.ck;
  if(!ck) return ckPaneEmpty(ctx, r, 'no circuit');
  let name = st.sweep.name;
  if(!name){ const s = st.sch.comps.find(c => c.kind === 'V' || c.kind === 'I'); name = s ? s.name : ''; }
  if(!name) return ckPaneEmpty(ctx, r, 'add a source or a component to sweep');
  const target = st.sch.comps.find(c => c.name === name);
  const prop = (target && (target.kind === 'V' || target.kind === 'I')) ?
    (target.wave === 'dc' ? 'val' : 'off') : 'val';
  let probe = st.sweep.probe || (ck.nm.count > 1 ? 1 : '');
  const key = ckGeomKey(st.sch) + name + prop + st.sweep.from + st.sweep.to + probe +
              st.sch.comps.map(c => c.val).join(';');
  if(!st.sweepCache || st.sweepCache.key !== key)
    st.sweepCache = { key, d: ckDCSweep(st.sch, name, prop, st.sweep.from, st.sweep.to, st.sweep.n) };
  const d = st.sweepCache.d;
  if(!d.ok || !d.v.length) return ckPaneEmpty(ctx, r, d.err || 'the sweep did not solve');
  const isNode = /^\d+$/.test(String(probe));
  const el = isNode ? null : d.ck.byName.get(probe);
  const ys = d.x.map(xx => {
    if(isNode){ const k = ckNX(+probe); return k >= 0 ? xx[k] : 0; }
    return el && el.cur >= 0 ? xx[d.ck.iCur(el.cur)] : 0;
  });
  let ymin = Math.min.apply(null, ys), ymax = Math.max.apply(null, ys);
  if(ymax - ymin < 1e-12){ ymax += 1; ymin -= 1; }
  const pad = (ymax - ymin) * 0.1;
  const P = mkPlot(r.x, r.y, r.w, r.h, d.v[0], d.v[d.v.length - 1], ymin - pad, ymax + pad);
  ckPaneAxes(ctx, P, name + ' (' + (target && target.kind === 'R' ? 'Ω' : 'V') + ')',
             isNode ? 'V (volts)' : 'I (amps)', 'DC sweep — the operating point as one value is varied');
  plotTicksX(ctx, P, [d.v[0], (d.v[0] + d.v[d.v.length - 1]) / 2, d.v[d.v.length - 1]], v => fmtNum(v, 3));
  ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 1.9;
  ctx.beginPath();
  d.v.forEach((v, i) => { const X = P.X(v), Y = P.Y(ys[i]); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
  ctx.stroke();
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(ckEng(ymax, isNode ? 'V' : 'A'), P.px - 5, P.Y(ymax));
  ctx.fillText(ckEng(ymin, isNode ? 'V' : 'A'), P.px - 5, P.Y(ymin));
}

function ckPaneSpectrum(st, ctx, r){
  const ck = st.sim && st.sim.ck;
  if(!ck || st.hist.length < 64) return ckPaneEmpty(ctx, r, 'collecting samples — let it run');
  const tr = ckActiveTraces(st, ck);
  if(!tr.length) return ckPaneEmpty(ctx, r, 'tick a trace');
  const dt = st.h || st.sim.h;
  const raw = st.hist.map(row => row.v[0]);
  const spec = ckSpectrum(raw, dt, 1024);
  if(!spec.f.length) return ckPaneEmpty(ctx, r, 'not enough samples yet');
  const thd = ckTHD(spec);
  let mmax = 1e-12;
  for(let k = 1; k < spec.mag.length; k++) mmax = Math.max(mmax, spec.mag[k]);
  const fmax = Math.min(spec.f[spec.f.length - 1], thd.f0 ? thd.f0 * 12 : spec.f[spec.f.length - 1]);
  const P = mkPlot(r.x, r.y, r.w, r.h, 0, fmax, 0, mmax * 1.1);
  ckPaneAxes(ctx, P, 'frequency  f (Hz)', 'amplitude', 'Spectrum of ' + tr[0].label +
    (thd.f0 ? '  —  f₀ = ' + ckEng(thd.f0, 'Hz') + ', THD = ' + fmtNum(thd.thd * 100, 3) + '%' : ''));
  plotTicksX(ctx, P, [0, fmax / 2, fmax], v => ckEng(v, 'Hz'));
  ctx.fillStyle = rgbCss(TH.grad, 0.85);
  const bw = Math.max(1, P.pw / (fmax / spec.df) * 0.7);
  for(let k = 1; k < spec.mag.length; k++){
    if(spec.f[k] > fmax) break;
    const h = (spec.mag[k] / (mmax * 1.1)) * P.ph;
    if(h < 0.4) continue;
    ctx.fillRect(P.X(spec.f[k]) - bw / 2, P.py + P.ph - h, bw, h);
  }
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillText(ckEng(mmax, tr[0].unit), P.px - 5, P.Y(mmax));
}

function ckPanePower(st, ctx, r){
  const m = st.meas;
  if(!m) return ckPaneEmpty(ctx, r, 'no solution');
  const rows = m.states.filter(s => s.kind !== 'GND');
  if(!rows.length) return ckPaneEmpty(ctx, r, 'no components');
  let pmax = 1e-12;
  for(const s of rows) pmax = Math.max(pmax, Math.abs(s.p));
  const P = mkPlot(r.x, r.y, r.w, r.h, 0, rows.length, -pmax * 1.15, pmax * 1.15);
  ckPaneAxes(ctx, P, '', 'power  p = v·i  (W)',
    'Power now — above the line absorbs, below it delivers.  Σ p = ' + ckEng(m.residual, 'W') +
    ' (Tellegen: it must be zero)');
  const bw = P.pw / rows.length;
  rows.forEach((s, i) => {
    const h = (s.p / (pmax * 1.15)) * (P.ph / 2);
    ctx.fillStyle = rgbCss(s.p >= 0 ? TH.pos : TH.grad, 0.85);
    ctx.fillRect(P.px + i * bw + bw * 0.2, P.Y(0) - Math.max(h, 0), bw * 0.6, Math.abs(h));
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '9.5px ' + FONT_MONO;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(s.name, P.px + i * bw + bw / 2, P.py + P.ph + 3);
    ctx.textBaseline = s.p >= 0 ? 'bottom' : 'top';
    ctx.fillStyle = rgbCss(TH.faint);
    ctx.fillText(ckEng(s.p, 'W'), P.px + i * bw + bw / 2, P.Y(0) - h + (s.p >= 0 ? -2 : 2));
    if(s.energy){
      ctx.fillStyle = rgbCss(TH.curl); ctx.textBaseline = 'top';
      ctx.fillText(ckEng(s.energy, 'J'), P.px + i * bw + bw / 2, P.py + P.ph + 15);
    }
  });
}

function ckPanePhasor(st, ctx, r){
  const ck = st.sim && st.sim.ck;
  if(!ck) return ckPaneEmpty(ctx, r, 'no circuit');
  let f = 0;
  for(const c of st.sch.comps) if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc' && c.freq) f = Math.max(f, c.freq);
  if(!f) return ckPaneEmpty(ctx, r, 'phasors need a sinusoidal source — set one to "sine (AC)"');
  const drive = st.drive || (ck.els.find(e => e.kind === 'V') || {}).name;
  const z = ckACAt(ck, st.sim.x, f, null);
  if(!z) return ckPaneEmpty(ctx, r, 'the phasor solve is singular here');
  const tr = ckActiveTraces(st, ck);
  const items = [];
  tr.forEach((t, k) => {
    let re = 0, im = 0;
    if(t.kind === 'v'){ const i = ckNX(t.node); if(i >= 0){ re = z.re[i]; im = z.im[i]; } }
    else if(t.kind === 'i'){
      const e = ck.byName.get(t.name);
      if(e && e.cur >= 0){ const i = ck.iCur(e.cur), fl = ckIsSrc(e.kind) ? -1 : 1;
                           re = fl * z.re[i]; im = fl * z.im[i]; }
    }
    if(Math.hypot(re, im) > 1e-15) items.push({ re, im, label:t.label, col:ckTraceRGB(k), unit:t.unit });
  });
  if(!items.length) return ckPaneEmpty(ctx, r, 'tick a node voltage or a branch current to see its phasor');
  /* Each unit gets its own length scale. Comparing the length of a volt arrow
     with an amp arrow would be meaningless anyway — what a phasor diagram is
     for is the ANGLE between them. */
  const fs = {};
  for(const it of items) fs[it.unit] = Math.max(fs[it.unit] || 1e-30, Math.hypot(it.re, it.im));

  /* the dial goes on the right: the canvas legend overlay occupies bottom-left */
  const size = Math.min(r.w * 0.40, r.h);
  const rad = size / 2 - 16;
  const cx = r.x + r.w - size / 2, cy = r.y + r.h / 2;
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy);
  ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad); ctx.stroke();
  const wt = 2 * Math.PI * f * st.sim.t;
  for(const it of items){
    const A = Math.hypot(it.re, it.im) / fs[it.unit] * rad;
    const ph = Math.atan2(it.im, it.re) + wt;
    ckArrow(ctx, cx, cy, cx + A * Math.cos(ph), cy - A * Math.sin(ph), rgbCss(it.col), 2.2, 9);
  }
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_UI;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillText('rotating at ω = 2πf = ' + ckEng(2 * Math.PI * f, 'rad/s'), cx, cy + rad + 6);
  ctx.textBaseline = 'bottom';
  ctx.fillText('each unit scaled to its own maximum', cx, cy - rad - 4);
  /* the phasors' shadows on the real axis are the waveforms themselves */
  const P = mkPlot(r.x, r.y, r.w - size - 40, r.h, 0, 3, -1.1, 1.1);
  ckPaneAxes(ctx, P, 'cycles', 'normalised', 'Phasors, and the waveforms they project');
  plotTicksX(ctx, P, [0, 1, 2, 3], v => v + '');
  items.forEach(it => {
    const A = Math.hypot(it.re, it.im) / fs[it.unit], ph = Math.atan2(it.im, it.re);
    ctx.strokeStyle = rgbCss(it.col); ctx.lineWidth = 1.6;
    ctx.beginPath();
    for(let i = 0; i <= 200; i++){
      const u = i / 200 * 3;
      const y = A * Math.cos(2 * Math.PI * u + ph);
      const X = P.X(u), Y = P.Y(y);
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
  });
  ckLegendRow(ctx, P, items.map(it => ({ col: it.col,
    label: it.label + ' = ' + ckEng(Math.hypot(it.re, it.im), it.unit) + ' ∠ ' +
           fmtNum(Math.atan2(it.im, it.re) * 180 / Math.PI, 3) + '°' })));
}

/* The same signal, side by side, in both domains at once. Nothing about the
   circuit differs between the two panels — only the basis it is written in. */
function ckPaneBoth(st, ctx, r){
  const gap = 34, w = (r.w - gap) / 2;
  ckPaneScope(st, ctx, { x:r.x, y:r.y, w, h:r.h });
  ckPaneSpectrum(st, ctx, { x:r.x + w + gap, y:r.y, w, h:r.h });
}

function ckPaneEmpty(ctx, r, msg){
  ctx.fillStyle = rgbCss(TH.faint);
  ctx.font = '12px ' + FONT_UI;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(msg, r.x + r.w / 2, r.y + r.h / 2);
}

