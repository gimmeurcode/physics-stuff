/* ============================================================================
   3c · THE PLOT VIEWPORT — pan, zoom, clip, and the information overlay

   Every flat picture in this laboratory is laid out by mkPlot(), and there are
   253 calls to it. That makes mkPlot the one place where a viewport can be added
   for all of them at once, which is the only way this is worth doing: the
   alternative is 253 edits and 253 chances to get one wrong.

   Four things live here.

   · A VIEW per plot — a pan offset and a zoom factor, stored RELATIVE to
     whatever window the stage asked for. At {ox:0, oy:0, kx:1, ky:1} the
     transform is the identity and mkPlot returns precisely the numbers it was
     given. That is a deliberate and load-bearing property: with no reader
     interaction, all 178 stages draw exactly what they drew before this file
     existed, so the regression surface of this change is the interaction and
     nothing else.

   · A REGISTRY of the plots built during the current frame, so a pointer can be
     told which plot it is over, and so the dock panel can list them.

   · CLIPPING, because a viewport without it is worse than none — zoom in and
     the curve runs across the axis labels, the readout chip and the next plot
     along. `plotCurve` used to clamp y into a band one full span outside the
     box, which drew over whatever was there. Clipping applies to mkPlot boxes
     only: a `ctBox` is an aspect-true diagram whose arrows are *meant* to reach
     past the frame, and cutting those would delete information rather than
     tidy it.

   · The OVERLAY — adaptive ticks, key features, the formula and the visible
     range. Each is independently toggleable, because which of them helps
     depends on what the reader is doing, and all four at once on a small plot
     is worse than none.

   Everything is keyed on the plot's box expressed as a FRACTION of the canvas,
   not in pixels, so a view survives a window resize. Views hang off ST, so
   changing stage or demo drops them and every experiment opens framed the way
   its author intended.
   ============================================================================ */

/* Which overlays are drawn. Global rather than per-stage: a reader who has
   turned the feature markers off means it, and having them come back on the
   next experiment would be a bug rather than a courtesy. */
const PV_SHOW = { grid:true, feats:true, formula:true, range:true };

/* How far the reader may go. The floor and ceiling are not arbitrary: zooming
   OUT multiplies the data span, and a handful of stages pass ctGrid an explicit
   step, so an unbounded zoom-out is an unbounded number of grid lines per frame
   — the failure mode recorded in AI-GUIDE §7, where the page stops responding
   without raising anything. ctGrid caps its own line count as well; this is the
   first of the two belts. */
const PV_KMIN = 1 / 32;      // zoomed out: 32x the span the stage asked for
const PV_KMAX = 1e5;         // zoomed in
/* Below this the double no longer resolves neighbouring pixels and the picture
   turns to steps; there is nothing further in to see. */
const PV_SPAN_MIN = 1e-12;

let PV_REG = [];             // plots built this frame, in draw order
let PV_FOCUS = null;         // key of the plot the reader last touched

/* ---------------------------------------------------------------- storage ---- */
/* Views hang off the live stage state, so they die with it. */
function pvViews(){
  if(typeof ST === 'undefined' || !ST) return null;
  if(!ST.pvv) ST.pvv = {};
  return ST.pvv;
}
/* The key is the box as a fraction of the canvas, quantised. Pixels would
   change on every resize and lose the view; the data window would change on
   every slider move and lose it too. Forty steps across the canvas is fine
   enough to tell two plots apart and coarse enough to survive a few pixels of
   layout drift. */
function pvKey(px, py, pw, ph){
  const W = (typeof R !== 'undefined' && R && R.W > 0) ? R.W : 1000;
  const H = (typeof R !== 'undefined' && R && R.H > 0) ? R.H : 500;
  return Math.round(px / W * 40) + ',' + Math.round(py / H * 40) + ',' +
         Math.round(pw / W * 40) + ',' + Math.round(ph / H * 40);
}
function pvOf(key){ const s = pvViews(); return s ? (s[key] || null) : null; }
function pvEnsure(key){
  const s = pvViews(); if(!s) return null;
  if(!s[key]) s[key] = { ox:0, oy:0, kx:1, ky:1 };
  return s[key];
}
function pvIsDefault(v){ return !v || (v.ox === 0 && v.oy === 0 && v.kx === 1 && v.ky === 1); }
/* True when anything on this stage has been panned or zoomed — the dock's
   "Reset view" button keys off it, and so does the overlay. */
function pvAnyMoved(){
  const s = pvViews(); if(!s) return false;
  for(const k in s) if(!pvIsDefault(s[k])) return true;
  return false;
}
function pvResetAll(){ const s = pvViews(); if(s) for(const k in s) delete s[k]; }

/* ------------------------------------------------------------- the transform -- */
/* Turn the window a stage asked for into the window the reader is looking at.
   Called by mkPlot and by nothing else. The identity case returns the input
   untouched, including when there is no stage at all — the field pipeline also
   builds plots and must not be disturbed. */
function pvApplyWindow(key, x0, x1, y0, y1){
  const v = pvOf(key);
  if(pvIsDefault(v)) return null;
  const spanX = x1 - x0, spanY = y1 - y0;
  const cx = (x0 + x1) / 2 + v.ox * spanX;
  const cy = (y0 + y1) / 2 + v.oy * spanY;
  const hx = spanX / (2 * v.kx), hy = spanY / (2 * v.ky);
  return { x0: cx - hx, x1: cx + hx, y0: cy - hy, y1: cy + hy };
}
/* Record a plot for this frame. Keyed rather than appended, because mkPlot is
   also called from pick() and readout() to invert a pointer position, and those
   would otherwise register the same box two or three more times per frame. */
function pvRegister(P){
  for(let i = 0; i < PV_REG.length; i++)
    if(PV_REG[i].key === P.key){ PV_REG[i] = P; return; }
  PV_REG.push(P);
}
function pvFrameStart(){ PV_REG = []; }
/* Which plot is under the pointer. Last registered wins, so a small inset plot
   drawn on top of a large one takes the pointer, which is what it looks like. */
function pvAt(sx, sy){
  for(let i = PV_REG.length - 1; i >= 0; i--){
    const P = PV_REG[i];
    if(sx >= P.px && sx <= P.px + P.pw && sy >= P.py && sy <= P.py + P.ph) return P;
  }
  return null;
}
function pvFocused(){
  if(PV_FOCUS) for(const P of PV_REG) if(P.key === PV_FOCUS) return P;
  return PV_REG.length ? PV_REG[0] : null;
}

/* ------------------------------------------------------------- interaction ---- */
/* Solve back for (offset, zoom) from an absolute window, against the base
   window the stage asked for. Everything the reader can do — wheel, drag, typed
   range — ends up here, so there is one place where the limits are enforced. */
function pvSetWindow(P, nx0, nx1, ny0, ny1){
  const v = pvEnsure(P.key); if(!v) return;
  const b = P.b;
  const bx = b.x1 - b.x0, by = b.y1 - b.y0;
  let sx = nx1 - nx0, sy = ny1 - ny0;
  if(!Number.isFinite(sx) || !Number.isFinite(sy) || sx === 0 || sy === 0) return;
  /* An inverted window is a typo, not a request to flip the axis: a stage that
     genuinely wants a descending axis passed one that way to begin with, and
     that orientation is carried in the base span's sign. */
  if(sx / bx < 0) { const t = nx0; nx0 = nx1; nx1 = t; sx = -sx; }
  if(sy / by < 0) { const t = ny0; ny0 = ny1; ny1 = t; sy = -sy; }
  let kx = bx / sx, ky = by / sy;
  kx = Math.max(PV_KMIN, Math.min(PV_KMAX, kx));
  ky = Math.max(PV_KMIN, Math.min(PV_KMAX, ky));
  if(Math.abs(bx / kx) < PV_SPAN_MIN || Math.abs(by / ky) < PV_SPAN_MIN) return;
  v.kx = kx; v.ky = ky;
  v.ox = ((nx0 + nx1) / 2 - (b.x0 + b.x1) / 2) / bx;
  v.oy = ((ny0 + ny1) / 2 - (b.y0 + b.y1) / 2) / by;
  PV_FOCUS = P.key;
}
/* Zoom about a pixel, so the data point under the cursor stays under it. That
   is the whole difference between a zoom that feels like a magnifier and one
   that feels like the picture jumping away from you. */
function pvZoomAt(P, sx, sy, factor){
  const fx = (sx - P.px) / P.pw, fy = (sy - P.py) / P.ph;
  const ax = P.invX(sx), ay = P.invY(sy);
  const nsx = (P.x1 - P.x0) / factor, nsy = (P.y1 - P.y0) / factor;
  const nx0 = ax - fx * nsx, ny1 = ay + fy * nsy;
  pvSetWindow(P, nx0, nx0 + nsx, ny1 - nsy, ny1);
}
/* Zoom a plot about its own centre — what the dock buttons do, since they have
   no cursor to zoom about. */
function pvZoomCentre(P, factor){
  pvZoomAt(P, P.px + P.pw / 2, P.py + P.ph / 2, factor);
}
/* Drag the picture with the pointer: the data under the finger stays under it,
   so the window moves the other way. */
function pvPanBy(P, dpx, dpy){
  const dx = -dpx / P.pw * (P.x1 - P.x0);
  const dy =  dpy / P.ph * (P.y1 - P.y0);
  pvSetWindow(P, P.x0 + dx, P.x1 + dx, P.y0 + dy, P.y1 + dy);
}
/* ---------------------------------------------------------------- clipping ---- */
/* Run a drawing function with the pen confined to the plot box. Used by the
   curve helpers; also exported for stages that draw their own paths. */
function pvClip(ctx, P, fn){
  if(!P || P.kind !== 'plot'){ fn(); return; }
  ctx.save();
  ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  try { fn(); } finally { ctx.restore(); }
}

/* ------------------------------------------------------------- auto-framing --- */
/* The y-window that shows all of a function over [x0, x1].

   Sampling has to survive the things that make a function interesting: poles
   that send it to ±∞, gaps where it is not defined, and single spikes that
   would otherwise flatten everything else onto the axis. So this does NOT take
   the min and max — it takes a high and low percentile of the finite samples,
   then widens to include the true extremes only as far as a fixed multiple of
   that percentile band. A tangent curve therefore frames its branches instead
   of framing one asymptote and drawing a horizontal line.

   Returns null when there is nothing finite to frame, and the caller keeps
   whatever window it already had. */
function pvFitY(fn, x0, x1, n){
  const N = n || 401, ys = [];
  for(let i = 0; i <= N; i++){
    const y = fn(x0 + (x1 - x0) * i / N);
    if(Number.isFinite(y)) ys.push(y);
  }
  if(ys.length < 2) return null;
  const s = ys.slice().sort((a, b) => a - b);
  const q = t => s[Math.max(0, Math.min(s.length - 1, Math.round(t * (s.length - 1))))];
  const lo = q(0.02), hi = q(0.98);
  let band = hi - lo;
  if(!(band > 0)) band = Math.max(1e-9, Math.abs(hi) * 0.2 || 1);
  /* let a genuine peak in, but not a pole */
  const min = Math.max(s[0], lo - band * 1.5);
  const max = Math.min(s[s.length - 1], hi + band * 1.5);
  const pad = (max - min) * 0.08 || 1;
  return { y0: min - pad, y1: max + pad };
}

/* ---------------------------------------------------------- key features ----- */
/* Read the interesting points off a sampled curve rather than off a formula,
   so this works for every curve the laboratory draws — typed expressions,
   interpolated sketches and tabulated data alike, none of which can be
   differentiated symbolically.

   Three kinds, and each is a claim that has to be earned:
     zero     a sign change between neighbouring samples, refined by bisection
     extremum a turning point in the sampled differences, kept only if it
              stands clear of the sampling noise around it
     break    a jump between finite neighbours far larger than the typical
              step, or a finite sample beside a non-finite one — a pole or a
              genuine discontinuity, and labelled as neither since sampling
              cannot tell them apart */
/* Is the gap between two neighbouring samples a real discontinuity, or just a
   place where the curve is steep?

   THE OLD TEST COULD NOT TELL, and said "pole" to both. It compared the step
   against 12× the MEDIAN step of the whole curve, which asks whether this part
   of the curve is steeper than the rest of it — a completely different question.
   Any curve with a long flat tail and a short steep head answers it wrongly, so
   a damped oscillation's first swing, 1/s near the origin, and every decay curve
   in the nuclear wing grew a picket fence of dashed yellow "pole" markers across
   a stretch that is perfectly continuous.

   REFINEMENT IS THE HONEST TEST, and it is available because the plot registry
   keeps each curve's own function. Halve the interval and look at the midpoint:
   on a continuous stretch, however steep, the midpoint lands between its
   endpoints — that is what continuity means at this scale. Near a pole it runs
   AWAY from both, because the function is growing without bound in there.

   With no `fn` to refine with, fall back to a LOCAL comparison — the step
   against its immediate neighbours — rather than the global median. For a
   smooth curve consecutive differences are comparable, since |Δy| ≈ |f′|h and
   f′ cannot change much in one step; at a jump, one difference dwarfs both of
   its neighbours.

   Two shapes count, and between them they are what "unbounded in here" looks
   like on a sampled curve:

     · the midpoint is not finite, or is FURTHER OUT than both endpoints — the
       function is still growing inside the interval;
     · the two endpoints straddle zero with large magnitudes — the curve has
       gone up one side of a pole and come back the other.

   The second clause is not decoration. A first attempt used only the midpoint,
   and the named control in ./auditmarks.ps1 caught it dropping BOTH of tan's
   real poles: when the pole sits off-centre in its interval the midpoint lands
   on one branch and is no larger than the endpoint on that side, so a test
   asking only "is the middle bigger" says no to a genuine pole. `mag` is the
   curve's own scale — the median |y| — so "large" is measured against the
   curve rather than against a constant. */
function pvBreakReal(x0, x1, y0, y1, fn, nb, mag){
  /* up one side of a pole and back down the other */
  if((y0 < 0) !== (y1 < 0) && Math.min(Math.abs(y0), Math.abs(y1)) > mag * 4) return true;
  if(typeof fn === 'function'){
    const m = fn((x0 + x1) / 2);
    if(!Number.isFinite(m)) return true;          /* it left the reals in there */
    /* still climbing inside the interval, rather than interpolating across it */
    return Math.abs(m) > Math.max(Math.abs(y0), Math.abs(y1)) * 4;
  }
  return Number.isFinite(nb) && Math.abs(y1 - y0) > nb * 8;
}

function pvFeatures(xs, ys, fn){
  const F = [], n = xs.length;
  if(n < 3) return F;
  /* the typical absolute step, used as the yardstick for "far larger" */
  const steps = [];
  for(let i = 1; i < n; i++)
    if(Number.isFinite(ys[i]) && Number.isFinite(ys[i - 1])) steps.push(Math.abs(ys[i] - ys[i - 1]));
  if(!steps.length) return F;
  steps.sort((a, b) => a - b);
  const med = steps[Math.floor(steps.length / 2)] || 0;
  const big = Math.max(med * 12, 1e-12);
  /* the curve's own vertical scale, so "a large value" is judged against this
     curve rather than against a constant that knows nothing about its units */
  const mags = [];
  for(let i = 0; i < n; i++) if(Number.isFinite(ys[i])) mags.push(Math.abs(ys[i]));
  mags.sort((a, b) => a - b);
  const mag = mags.length ? (mags[Math.floor(mags.length / 2)] || 0) : 0;
  for(let i = 1; i < n; i++){
    const a = ys[i - 1], b = ys[i];
    const fa = Number.isFinite(a), fb = Number.isFinite(b);
    if(fa !== fb){ F.push({ t:'break', x:xs[fa ? i - 1 : i], y:fa ? a : b }); continue; }
    if(!fa) continue;
    if(Math.abs(b - a) > big && steps.length > 8){
      /* the step is large for this curve — now find out whether it is a
         discontinuity or merely a steep stretch. See pvBreakReal. */
      const dl = (i >= 2 && Number.isFinite(ys[i - 2])) ? Math.abs(a - ys[i - 2]) : NaN;
      const dr = (i + 1 < n && Number.isFinite(ys[i + 1])) ? Math.abs(ys[i + 1] - b) : NaN;
      const nb = Math.max(Number.isFinite(dl) ? dl : 0, Number.isFinite(dr) ? dr : 0) || NaN;
      if(pvBreakReal(xs[i - 1], xs[i], a, b, fn, nb, mag)){
        F.push({ t:'break', x:(xs[i - 1] + xs[i]) / 2, y:(a + b) / 2 });
        continue;
      }
    }
    if(a === 0){ F.push({ t:'zero', x:xs[i - 1], y:0 }); continue; }
    if((a < 0) !== (b < 0)){
      /* Linear interpolation first, and for the marker that is already enough:
         the sample spacing is finer than a pixel on any plot this size. It is
         the printed NUMBER that needs better, and only labelled features get
         one — so the bisection below is spent only where it is read. */
      const t = a / (a - b);
      F.push({ t:'zero', x:xs[i - 1] + t * (xs[i] - xs[i - 1]), y:0, lo:xs[i - 1], hi:xs[i], fa:a });
    }
  }
  for(let i = 1; i < n - 1; i++){
    const a = ys[i - 1], b = ys[i], c = ys[i + 1];
    if(!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c)) continue;
    const up = (b - a), dn = (c - b);
    if(up === 0 || dn === 0 || (up > 0) === (dn > 0)) continue;
    /* a turning point that only clears the noise floor is sampling, not shape */
    if(Math.max(Math.abs(up), Math.abs(dn)) < med * 0.75) continue;
    F.push({ t: up > 0 ? 'max' : 'min', x:xs[i], y:b });
  }
  return F;
}
/* Sharpen a root to the precision its printed label claims. Bisection rather
   than Newton because the only thing available is the sampled function itself,
   and bisection cannot be thrown by a derivative that vanishes at the root.
   Called only for the handful of features that are actually labelled — running
   it on every sign change of a fast-oscillating curve, every frame, is work
   nobody reads. */
function pvRefineZero(f, fn){
  if(typeof fn !== 'function' || !(f.hi > f.lo)) return f.x;
  let lo = f.lo, hi = f.hi, flo = f.fa;
  for(let k = 0; k < 24; k++){
    const m = (lo + hi) / 2, fm = fn(m);
    if(!Number.isFinite(fm)) return f.x;
    if((flo < 0) === (fm < 0)){ lo = m; flo = fm; } else hi = m;
  }
  return (lo + hi) / 2;
}

/* ------------------------------------------------------------- the overlay ---- */
/* Drawn after the stage's own frame(), so it sits on top of the picture rather
   than under whatever the stage drew next. Called once per registered plot from
   stageFrame(). */
function pvDrawOverlay(ctx){
  if(typeof R === 'undefined' || !R) return;
  for(const P of PV_REG){
    if(P.kind !== 'plot') continue;
    const moved = !pvIsDefault(pvOf(P.key));
    /* Axis furniture is only taken over once the reader has moved the view.
       At the default window the stage's own ticks are the ones its author
       chose, and they are better than anything derived generically — but they
       are a FIXED list, so zoomed in they vanish entirely and the reader is
       left with an unlabelled rectangle. */
    if(moved && PV_SHOW.grid) pvDrawAxes(ctx, P);
    if(PV_SHOW.feats && P.curves && P.curves.length) pvDrawFeatures(ctx, P);
    if(PV_SHOW.formula && P.label) pvDrawLabel(ctx, P);
    if(PV_SHOW.range && moved) pvDrawRange(ctx, P);
  }
}
/* An adaptive grid with real numbers on it, replacing the stage's fixed ticks
   once those have stopped covering the window. */
function pvDrawAxes(ctx, P){
  const sx = ctNiceStep(Math.abs(P.x1 - P.x0)), sy = ctNiceStep(Math.abs(P.y1 - P.y0));
  const lo = (a, b) => Math.min(a, b), hi = (a, b) => Math.max(a, b);
  ctx.save();
  ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  ctx.strokeStyle = rgbCss(TH.line, 0.7); ctx.lineWidth = 0.7;
  for(let x = Math.ceil(lo(P.x0, P.x1) / sx) * sx; x <= hi(P.x0, P.x1); x += sx){
    ctx.beginPath(); ctx.moveTo(P.X(x), P.py); ctx.lineTo(P.X(x), P.py + P.ph); ctx.stroke();
  }
  for(let y = Math.ceil(lo(P.y0, P.y1) / sy) * sy; y <= hi(P.y0, P.y1); y += sy){
    ctx.beginPath(); ctx.moveTo(P.px, P.Y(y)); ctx.lineTo(P.px + P.pw, P.Y(y)); ctx.stroke();
  }
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.2;
  if(lo(P.y0, P.y1) < 0 && hi(P.y0, P.y1) > 0){
    ctx.beginPath(); ctx.moveTo(P.px, P.Y(0)); ctx.lineTo(P.px + P.pw, P.Y(0)); ctx.stroke();
  }
  if(lo(P.x0, P.x1) < 0 && hi(P.x0, P.x1) > 0){
    ctx.beginPath(); ctx.moveTo(P.X(0), P.py); ctx.lineTo(P.X(0), P.py + P.ph); ctx.stroke();
  }
  ctx.restore();
  const f = '10px ' + FONT_MONO, col = rgbCss(TH.faint);
  for(let x = Math.ceil(lo(P.x0, P.x1) / sx) * sx; x <= hi(P.x0, P.x1); x += sx)
    ctText(ctx, P.X(x), P.py + P.ph + 3, fmtNum(x, 4), col, f, 'center', 'top');
  for(let y = Math.ceil(lo(P.y0, P.y1) / sy) * sy; y <= hi(P.y0, P.y1); y += sy)
    ctText(ctx, P.px - 5, P.Y(y), fmtNum(y, 4), col, f, 'right', 'middle');
}
/* Zeros, turning points and breaks, marked on the curve they belong to.

   Labels are printed only when there are few enough of them to read. On a
   sine over ten periods there are twenty turning points and putting a number
   beside each turns the plot into a wall of text — the markers alone still say
   where they are, and the probe still reads the exact value. */
function pvDrawFeatures(ctx, P){
  const all = [];
  for(const c of P.curves){
    if(!c.xs || c.xs.length < 3) continue;
    for(const f of pvFeatures(c.xs, c.ys, c.fn)) all.push({ f, col:c.col, fn:c.fn });
  }
  if(!all.length || all.length > 60) return;
  const label = all.length <= 6;
  ctx.save();
  ctx.beginPath(); ctx.rect(P.px - 2, P.py - 2, P.pw + 4, P.ph + 4); ctx.clip();
  for(const { f, col } of all){
    const X = P.X(f.x), Y = P.Y(f.y);
    if(!Number.isFinite(X) || !Number.isFinite(Y)) continue;
    if(f.t === 'break'){
      /* a pole or a jump is a place the curve is NOT, so it is drawn as a gap
         marker on the axis rather than as a point on the curve */
      ctx.strokeStyle = rgbCss(TH.warn || TH.faint, 0.8); ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(X, P.py); ctx.lineTo(X, P.py + P.ph); ctx.stroke();
      ctx.setLineDash([]);
      continue;
    }
    ctx.fillStyle = rgbCss(TH.bg);
    ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = col || rgbCss(TH.text); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(X, Y, 3.2, 0, 6.2832); ctx.stroke();
  }
  ctx.restore();
  if(!label) return;
  for(const { f, fn } of all){
    if(f.t === 'break') continue;
    const X = P.X(f.x), Y = P.Y(f.y);
    if(!Number.isFinite(X) || !Number.isFinite(Y)) continue;
    /* the printed root is bisected, not the sampled one — a label reading
       "zero at x = 1.57" should be a zero, not the nearest sample to one */
    const txt = f.t === 'zero' ? 'zero at x = ' + fmtNum(pvRefineZero(f, fn), 4)
              : (f.t === 'max' ? 'max ' : 'min ') + fmtNum(f.y, 3) + ' at ' + fmtNum(f.x, 3);
    ctText(ctx, X, Y - 8, txt, rgbCss(TH.dim), '10px ' + FONT_UI, 'center', 'bottom');
  }
}
/* The formula the plot is drawing, typeset into the corner of the plot itself,
   so the picture says what it is without the reader looking away from it.

   Top RIGHT, not top left: the readout chip floats over the canvas's top-left
   corner (about 180x90 px), and a label placed there is simply behind it —
   drawn, covered, and reported by nothing. The bottom right is taken by the
   range readout, so the two never meet. */
function pvDrawLabel(ctx, P){
  ctText(ctx, P.px + P.pw - 6, P.py + 5, P.label, rgbCss(TH.dim),
         '600 11.5px ' + FONT_UI, 'right', 'top');
}
/* What window you are looking at, and how far in. Only shown once the view has
   been moved — at the default window the axis numbers already say it. */
function pvDrawRange(ctx, P){
  const v = pvOf(P.key);
  const z = v ? Math.max(v.kx, v.ky) : 1;
  const txt = 'x ' + fmtNum(P.x0, 3) + '…' + fmtNum(P.x1, 3) +
              '   y ' + fmtNum(P.y0, 3) + '…' + fmtNum(P.y1, 3) +
              '   ' + (z >= 1 ? fmtNum(z, 3) + '× in' : fmtNum(1 / z, 3) + '× out');
  ctText(ctx, P.px + P.pw - 5, P.py + P.ph - 4, txt,
         rgbCss(TH.faint), '10px ' + FONT_MONO, 'right', 'bottom');
}

/* ---------------------------------------------------------------- the dock ---- */
/* The panel that makes all of this reachable without knowing the gestures, and
   testable by a script that has no pointer at all. Built into every stage's
   control panel, below its own controls. */
function pvPanelHtml(){
  const ck = (id, on, lbl) =>
    `<label class="chk"><input type="checkbox" id="${id}"${on ? ' checked' : ''}><span>${lbl}</span></label>`;
  return `<div class="pvpanel" id="pvPanel">
    <div class="hd">View</div>
    <div class="pvrow">
      <button class="btn sm" id="pvOut" title="Show more of the picture">− zoom out</button>
      <button class="btn sm" id="pvIn"  title="Look closer">+ zoom in</button>
      <button class="btn sm" id="pvRst" title="Back to the window this experiment was framed with">Reset view</button>
    </div>
    <div class="pvrow pvnum">
      <label class="lb">x from</label><input class="num" id="pvX0" spellcheck="false" autocomplete="off">
      <label class="lb">to</label><input class="num" id="pvX1" spellcheck="false" autocomplete="off">
    </div>
    <div class="pvrow pvnum">
      <label class="lb">y from</label><input class="num" id="pvY0" spellcheck="false" autocomplete="off">
      <label class="lb">to</label><input class="num" id="pvY1" spellcheck="false" autocomplete="off">
    </div>
    <div class="pvrow pvtog">
      ${ck('pvTg', PV_SHOW.grid,    'axes &amp; ticks')}
      ${ck('pvTf', PV_SHOW.feats,   'key points')}
      ${ck('pvTl', PV_SHOW.formula, 'formula')}
      ${ck('pvTr', PV_SHOW.range,   'range')}
    </div>
    <p class="help pvhint">Scroll over a picture to zoom, drag with <b>Shift</b> to move it, or type an exact
    window above. Zooming acts on the plot under the pointer.</p>
  </div>`;
}
/* The range boxes describe the plot the reader last touched, and there is no
   such plot until a frame has been drawn — so they are filled in from the
   registry rather than at build time, and refreshed whenever the view moves. */
function pvSyncBoxes(){
  const P = pvFocused();
  const set = (id, val) => {
    const e = $(id); if(!e || e === document.activeElement) return;
    e.value = Number.isFinite(val) ? String(+val.toPrecision(8)) : '';
    e.disabled = !P;
  };
  set('pvX0', P ? P.x0 : NaN); set('pvX1', P ? P.x1 : NaN);
  set('pvY0', P ? P.y0 : NaN); set('pvY1', P ? P.y1 : NaN);
  const r = $('pvRst'); if(r) r.disabled = !pvAnyMoved();
}
function pvWirePanel(){
  const step = f => () => { const P = pvFocused(); if(P){ pvZoomCentre(P, f); pvSyncBoxes(); } };
  const on = (id, ev, fn) => { const e = $(id); if(e) e.addEventListener(ev, fn); };
  on('pvIn',  'click', step(1.6));
  on('pvOut', 'click', step(1 / 1.6));
  on('pvRst', 'click', () => { pvResetAll(); pvSyncBoxes(); });
  /* One commit path for all four boxes: a window is four numbers and changing
     one of them alone is still a window. ctlParse means π/4 and sqrt(2) are
     legal here for the same reason they are legal in every other numeric box
     in the laboratory. */
  const commit = () => {
    const P = pvFocused(); if(!P) return;
    const g = (id, dflt) => { const e = $(id); if(!e) return dflt;
      const v = ctlParse(e.value); return Number.isFinite(v) ? v : dflt; };
    pvSetWindow(P, g('pvX0', P.x0), g('pvX1', P.x1), g('pvY0', P.y0), g('pvY1', P.y1));
    pvSyncBoxes();
  };
  for(const id of ['pvX0','pvX1','pvY0','pvY1']){
    on(id, 'blur', commit);
    on(id, 'keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); ev.target.blur(); } });
  }
  const tog = (id, k) => on(id, 'change', ev => { PV_SHOW[k] = !!ev.target.checked; });
  tog('pvTg', 'grid'); tog('pvTf', 'feats'); tog('pvTl', 'formula'); tog('pvTr', 'range');
  pvSyncBoxes();
}
