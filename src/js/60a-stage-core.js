/* ============================================================================
   4b · CUSTOM STAGES
   A stage takes over the canvas for experiments the field pipeline cannot
   express: time-dependent wavefunctions, single-particle detection, spin
   filters, and the atom itself. Every stage still honours the probe contract:
   wherever the probe sits, the readout panel shows the exact values of the
   functions being drawn at that location, recomputed live.
   ============================================================================ */

const STAGES = {};
let ST = null;                       // active stage runtime state
let stageReadoutTimer = 0;
let stageChipHot = false;   // J8: true while the chip is changing frame to frame

function stageActive(){ return !!(S.stage && STAGES[S.stage]); }

function stageEnter(id, opts){
  const st = STAGES[id];
  if(!st) return;
  S.stage = id;
  /* `pvv` holds the reader's pan and zoom per plot. It is created empty with the
     rest of the stage state, so every experiment opens at the window its author
     framed it with rather than inheriting the last one's magnification. */
  ST = { probe: 0, t: 0, paused: false, opts: opts || {}, pvv: {} };
  PV_FOCUS = null; PV_REG = [];
  st.enter(ST, opts || {});
  buildStagePanel();
  applyWingSections();
  updateStageChip();
  updateStageLegend();
}
function stageExit(){
  S.stage = null; ST = null;
  /* remove the stage's controls so stale listeners can never fire on a dead ST */
  const sb = document.getElementById('stageBody');
  /* the readout goes through uiSetHtml so its cache marker is cleared too —
     writing innerHTML directly here left the marker holding the last readout,
     and reopening the same stage in the same state then skipped the identical
     write as a no-op and showed an empty panel */
  if(sb){ sb.innerHTML = ''; uiSetHtml(document.getElementById('stageReadout'), ''); }
}

/* one flat-plot frame: theme-aware clear, then hand the ctx to the stage */
function stageFrame(dt){
  const st = STAGES[S.stage];
  if(!st) return;
  /* Reconcile the renderer with the element before drawing anything.

     R.W and R.H are set by R.resize(), which is driven by a ResizeObserver and
     by a handful of explicit calls — several of them deferred through
     requestAnimationFrame. Any of those can be missed: a rAF-deferred resize
     never runs in a headless browser, a dock drag or a panel rebuild can change
     the canvas box between the observer firing and the next paint. When R and
     the element disagree the backing store is the wrong size for the box it is
     displayed in, and the ENTIRE stage is drawn stretched — at 1024 pixels wide
     the viewport audit caught R still holding 1527, a 24% horizontal squash of
     every picture in the laboratory, with nothing anywhere reporting a problem.

     clientWidth is a layout read, but it is one per frame on a layout that has
     already settled, and it makes the drawing correct no matter which path
     resized the canvas. */
  if(R.cv && (Math.abs(R.cv.clientWidth - R.W) > 1 || Math.abs(R.cv.clientHeight - R.H) > 1))
    R.resize();
  if(!ST.paused) ST.t += dt * (S.time.paused ? 0 : S.time.speed);
  const ctx = R.ctx;
  /* mode may be a function of the stage's own state: the EM stages switch
     between a flat plane and full 3D at runtime, and the 3D renderer clears
     the canvas itself in flush() */
  const mode = typeof st.mode === 'function' ? st.mode(ST) : st.mode;
  if(mode !== '3d'){
    ctx.setTransform(R.dpr, 0, 0, R.dpr, 0, 0);
    ctx.clearRect(0, 0, R.W, R.H);
    ctx.fillStyle = rgbCss(TH.bg);
    ctx.fillRect(0, 0, R.W, R.H);
  }
  pvFrameStart();
  st.frame(ST, dt, ctx, R.W, R.H);
  /* The viewport overlay goes on top of the finished picture, and BEFORE the
     readout refresh below: several stages rebuild their plots inside readout()
     to invert a probe position, which re-registers the same boxes without the
     curve samples the feature markers are read from. */
  if(mode !== '3d') pvDrawOverlay(ctx);
  stageReadoutTimer += dt;
  /* J8: a chip printing the running clock beside a canvas title printing the
     same clock showed two different instants (pcCurve: 7.76 against 6.9),
     on the stage whose rail text promises the picture and the numbers cannot
     drift apart. The chip therefore tracks the FRAME while it is changing:
     the 0.4 s tick arms per-frame refresh, and the first frame whose chip
     build comes back identical disarms it, so a static chip — however heavy
     its stage's report is — is never rebuilt at frame rate. */
  if(stageChipHot) stageChipHot = updateStageChip();
  if(stageReadoutTimer > 0.4){
    stageReadoutTimer = 0; refreshStageReadout();
    stageChipHot = updateStageChip() || stageChipHot;
    pvSyncBoxes();
  }
}

function stagePick(sx, sy, phase){
  const st = STAGES[S.stage];
  if(st && st.pick) { st.pick(ST, sx, sy, phase || 'click'); refreshStageReadout(); updateStageChip(); }
}

/* ---------------------------------------------------------------- plotting ---- */
/* The canvas a stage is currently drawing into, in CSS pixels — the one thing
   every layout helper needs and none of them used to be told.

   It reads back from R rather than taking W and H as arguments because the
   helpers that need it (mkPlot, plotFrame, ctText, ctFrame) are called from two
   hundred places that do not have them to hand. The guard matters: the field
   pipeline renders some layers into small offscreen canvases, and clamping a
   label to the main canvas while drawing into a 256-pixel tile would be worse
   than the problem it fixes, so anything whose backing store is not R's is left
   alone and reports itself as unbounded. */
function ctBounds(ctx){
  if(typeof R === 'undefined' || !R || !(R.W > 0) || !(R.H > 0)) return { w:Infinity, h:Infinity, off:true };
  if(ctx && ctx.canvas && (Math.abs(ctx.canvas.width - R.W * R.dpr) > 2 ||
                           Math.abs(ctx.canvas.height - R.H * R.dpr) > 2))
    return { w:Infinity, h:Infinity, off:true };
  return { w:R.W, h:R.H, off:false };
}
/* Where a label has to be drawn so that all of it lands on the canvas.

   There are two label helpers in the codebase — ctText for the stages and
   rlText for the relativity and string wings — and both had the same hole: a
   string placed outside the canvas is drawn, discarded, and reported by nothing.
   The arithmetic lives here once, because it has two traps in it. textAlign and
   textBaseline decide which corner sx, sy actually names, so the box has to be
   reconstructed before it can be moved; and the font size must be pulled out
   with a regex rather than parseFloat, because these font strings are
   '600 11px Inter' and parseFloat happily returns the weight. */
function ctFitText(ctx, sx, sy, txt){
  const B = ctBounds(ctx);
  if(B.off) return { x:sx, y:sy };
  const m = /(\d+(?:\.\d+)?)px/.exec(ctx.font);
  const size = m ? parseFloat(m[1]) : 12;
  const w = ctx.measureText(txt).width, a = ctx.textAlign;
  const left = a === 'center' ? sx - w / 2 : a === 'right' ? sx - w : sx;
  const nl = Math.max(2, Math.min(B.w - w - 2, left));
  const b = ctx.textBaseline;
  const top = b === 'top' ? sy : b === 'middle' ? sy - size / 2
            : b === 'bottom' ? sy - size : sy - size * 0.8;
  const nt = Math.max(1, Math.min(B.h - size - 1, top));
  return { x:sx + (nl - left), y:sy + (nt - top) };
}
/* A rectangular data→pixel mapping with axes. Every flat stage draws with one
   or more of these, so ticks, labels and probe lines look identical everywhere. */
/* The box is clamped into the canvas before anything else happens.

   Almost every call site computes its margins from W and H with constants
   chosen on one screen — `mkPlot(80, 55, W - 170, H - 145, …)` is the house
   pattern, and there are two hundred of them. Those constants are fine at the
   size they were written at and wrong at others: on a short window H − 145 goes
   small, and below H = 145 it goes NEGATIVE, at which point Y() inverts and the
   stage silently draws itself upside down above the top edge. On a narrow one
   the same thing happens horizontally.

   Clamping here fixes all two hundred at once, and it fixes them in the only
   direction that is ever right: a cramped window should give a small plot, never
   an inverted or off-screen one. At any size the margins were designed for, none
   of these bounds bind and the box is exactly what was asked for. */
/* The box a plot will actually get, after being kept on the canvas. Extracted
   from mkPlot so that a caller which needs to CHOOSE its box from the room
   available — an equal-scale pane, where the two axes must end up at the same
   number of pixels per unit — can ask first instead of discovering the clamp
   afterwards. csRectPane fitted its scale to the box it wanted, mkPlot then
   trimmed the height to the canvas, and the two scales came out 1.3% apart on a
   tall window: an equal-scale pane that is not equal is worse than one that
   never claimed to be. One clamp, two callers, so they cannot drift. */
function ctFitBox(px, py, pw, ph){
  if(typeof R !== 'undefined' && R && R.W > 0 && R.H > 0){
    px = Math.max(0, Math.min(px, R.W - 24));
    py = Math.max(0, Math.min(py, R.H - 24));
    pw = Math.max(20, Math.min(pw, R.W - px));
    ph = Math.max(20, Math.min(ph, R.H - py));
  } else {
    pw = Math.max(20, pw); ph = Math.max(20, ph);
  }
  return { px, py, pw, ph };
}
function mkPlot(px, py, pw, ph, x0, x1, y0, y1){
  { const F = ctFitBox(px, py, pw, ph); px = F.px; py = F.py; pw = F.pw; ph = F.ph; }
  /* The reader's viewport, if they have moved one on this plot. `b` keeps the
     window the STAGE asked for: every pan and zoom is stored relative to it, so
     a slider that changes the natural window carries the reader's framing with
     it instead of throwing it away. When nothing has been moved pvApplyWindow
     returns null and the four numbers below are exactly the four passed in —
     which is what makes this change invisible to all 178 stages until somebody
     actually scrolls on one. See 59c-plot-view.js. */
  const b = { x0, x1, y0, y1 };
  const key = pvKey(px, py, pw, ph);
  const w = pvApplyWindow(key, x0, x1, y0, y1);
  if(w){ x0 = w.x0; x1 = w.x1; y0 = w.y0; y1 = w.y1; }
  const X = x => px + (x - x0) / (x1 - x0) * pw;
  const Y = y => py + ph - (y - y0) / (y1 - y0) * ph;
  const P = { px, py, pw, ph, x0, x1, y0, y1, X, Y, b, key, kind:'plot', curves:null, label:null,
    invX: sx => x0 + (sx - px) / pw * (x1 - x0),
    /* invY completes the inverse map, so a pointer can be read back as data —
       which is what the sketch pad and the region tool in 59-interact.js need */
    invY: sy => y0 + (py + ph - sy) / ph * (y1 - y0),
    inside: (sx, sy) => sx >= px - 8 && sx <= px + pw + 8 && sy >= py - 8 && sy <= py + ph + 8 };
  pvRegister(P);
  return P;
}
/* Name what a plot is drawing, so the overlay can typeset it into the corner.
   Returns the plot, so it reads as one step of the layout:
       const P = pvName(mkPlot(…), 'f(x) = x² sin x'); */
function pvName(P, label){ if(P) P.label = label; return P; }

/* mkPlot with the y-window derived from the functions instead of guessed.

   A fixed y-window is written for the settings a stage opens with, and stops
   being right the moment a slider moves: a quadratic on a fixed ±10 shows its
   vertex and loses both arms as soon as the reader steepens it. `auditframe.ps1`
   measures exactly this, and found ten stages drawing half their curve outside
   the frame.

   Two things stop the cure being worse than the disease:

   · The window is QUANTISED to a round step. An exact fit recomputed every
     frame twitches by a pixel whenever the curve moves, and a picture whose
     axes never settle is harder to read than one that is slightly too big.
     Snapping to a nice step means the window changes in visible jumps, when
     the curve genuinely needs more room, and holds still otherwise.

   · pvFitY frames the BODY of the function rather than its extremes, so a pole
     inside the interval does not flatten everything else onto the axis. That
     is the difference between framing tan x and framing one of its asymptotes.

   opts: { n, include:[values that must be visible], symmetric, minSpan }  */
function mkPlotFit(px, py, pw, ph, x0, x1, fns, opts){
  const o = opts || {};
  const list = Array.isArray(fns) ? fns : [fns];
  let lo = Infinity, hi = -Infinity;
  for(const f of list){
    if(typeof f !== 'function') continue;
    const r = pvFitY(f, x0, x1, o.n);
    if(r){ lo = Math.min(lo, r.y0); hi = Math.max(hi, r.y1); }
  }
  for(const v of (o.include || [])) if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
  if(!(hi > lo)){ lo = -1; hi = 1; }                 // nothing finite to frame
  if(o.symmetric){ const m = Math.max(Math.abs(lo), Math.abs(hi)); lo = -m; hi = m; }
  if(o.minSpan > 0 && hi - lo < o.minSpan){
    const c = (lo + hi) / 2; lo = c - o.minSpan / 2; hi = c + o.minSpan / 2;
  }
  const q = ctNiceStep(hi - lo) / 2;
  if(q > 0 && Number.isFinite(q)){ lo = Math.floor(lo / q) * q; hi = Math.ceil(hi / q) * q; }
  if(!(hi > lo)){ lo = -1; hi = 1; }
  return mkPlot(px, py, pw, ph, x0, x1, lo, hi);
}
/* The three labels sit OUTSIDE the box — below it, above it and to its left —
   so a plot that fits the canvas perfectly can still put its own axis titles
   past the edge. They are pinned back inside here rather than at each of the
   two hundred call sites. `ctBounds` is the shared clamp; see 61a. */
/* J6: the readout chip floats over the canvas top-left (~180×90 CSS px), and
   a heading drawn under it is unreadable. The two title owners — plotFrame
   here and ctFrame in 61a — ask for this zone and shift a title clear of it,
   so no stage has to know the chip exists. In canvas pixels; NOT cached — a
   time-keyed cache held the zone measured before the chip filled (and virtual
   time in the harness makes performance.now() jump), so the shift never
   applied. Two rect reads per titled plot per frame do not dirty layout.
   ./auditticks.ps1 fails on any heading whose anchor lands inside the chip. */
function ctChipZone(ctx){
  let w = 0, h = 0;
  const chip = document.getElementById('chip');
  if(chip && chip.offsetParent && (chip.textContent || '').trim()){
    const cr = chip.getBoundingClientRect(), vr = ctx.canvas.getBoundingClientRect();
    const s = vr.width ? ctx.canvas.width / vr.width : 1;
    w = (cr.right - vr.left) * s; h = (cr.bottom - vr.top) * s;
  }
  return { w: w, h: h };
}
function ctTitleClearChip(ctx, cx, y, title){
  const z = ctChipZone(ctx);
  if(!(z.h > 0) || y > z.h + 4) return cx;
  const w = ctx.measureText(title).width;
  if(cx - w / 2 >= z.w + 8) return cx;
  return Math.min(z.w + 8 + w / 2, ctBounds(ctx).w - w / 2 - 4);
}

function plotFrame(ctx, P, xlabel, ylabel, title){
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(P.px, P.py, P.pw, P.ph);
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '12px ' + FONT_UI;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const B = ctBounds(ctx);
  if(xlabel) ctx.fillText(uniSup(xlabel), P.px + P.pw / 2, Math.min(P.py + P.ph + 18, B.h - 14));
  if(title){
    ctx.textAlign = 'center'; ctx.fillStyle = rgbCss(TH.dim);
    ctx.font = '600 12.5px ' + FONT_UI;
    /* the title is often a display string shared with an HTML control, so it
       arrives with caret exponents that only supify() would have handled */
    const tty = Math.max(P.py - 16, 2);
    ctx.fillText(uniSup(title), ctTitleClearChip(ctx, P.px + P.pw / 2, tty, uniSup(title)), tty);
  }
  if(ylabel){
    /* J4: the rotated title must sit clear of the gutter the tick labels
       actually use — at the old fixed P.px − 34, sixty plots on forty-one
       stages (measured 2026-08-15) drew their title through their own tick
       numbers. The expected labels are computed exactly the way ctGrid
       computes them, measured, and the title placed to their left. */
    const syT = ctNiceStep(Math.abs(P.y1 - P.y0));
    let wmax = 0;
    ctx.save(); ctx.font = '10px ' + FONT_MONO;
    for(let yt = Math.ceil(Math.min(P.y0, P.y1) / syT) * syT; yt <= Math.max(P.y0, P.y1); yt += syT)
      if(Math.abs(yt) > 1e-9) wmax = Math.max(wmax, ctx.measureText(fmtTick(yt, syT)).width);
    ctx.restore();
    const tx = Math.max(Math.min(P.px - 34, P.px - 12 - wmax - 6), 12);
    ctx.save(); ctx.translate(tx, P.py + P.ph / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI;
    ctx.fillText(ylabel, 0, 0); ctx.restore();
  }
}
/* Ticks outside the axis are skipped rather than drawn.

   Most call sites pass a fixed list — [0, 1, 2, …] — and the axis they are drawn
   on depends on a slider. When the range shrinks below the last tick, the old
   code still drew it: a grid line hard against the frame and a number printed
   past the right-hand edge of the canvas, where it is invisible. A tick for a
   value the axis does not cover is not a layout problem to be nudged, it is a
   tick that should not exist. */
function plotTicksX(ctx, P, ticks, fmt){
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.strokeStyle = rgbCss(TH.line); ctx.lineWidth = 0.7;
  const lo = Math.min(P.x0, P.x1) - 1e-9, hi = Math.max(P.x0, P.x1) + 1e-9;
  for(const t of ticks){
    if(!Number.isFinite(t) || t < lo || t > hi) continue;
    const x = P.X(t);
    ctx.beginPath(); ctx.moveTo(x, P.py); ctx.lineTo(x, P.py + P.ph); ctx.stroke();
    const lbl = String((fmt || String)(t));
    const p = ctFitText(ctx, x, P.py + P.ph + 3, lbl);
    ctx.fillText(lbl, p.x, p.y);
  }
}
/* The same for the vertical axis, with the same rule: a tick for a value the
   axis does not cover is not drawn. Labels sit just outside the left edge and
   go through ctFitText, so a plot pushed against the canvas edge keeps them. */
function plotTicksY(ctx, P, ticks, fmt){
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.strokeStyle = rgbCss(TH.line); ctx.lineWidth = 0.7;
  const lo = Math.min(P.y0, P.y1) - 1e-9, hi = Math.max(P.y0, P.y1) + 1e-9;
  for(const t of ticks){
    if(!Number.isFinite(t) || t < lo || t > hi) continue;
    const y = P.Y(t);
    ctx.beginPath(); ctx.moveTo(P.px, y); ctx.lineTo(P.px + P.pw, y); ctx.stroke();
    const lbl = String((fmt || String)(t));
    const p = ctFitText(ctx, P.px - 5, y, lbl);
    ctx.fillText(lbl, p.x, p.y);
  }
}
function plotZeroY(ctx, P){
  if(P.y0 < 0 && P.y1 > 0){
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(P.px, P.Y(0)); ctx.lineTo(P.px + P.pw, P.Y(0)); ctx.stroke();
  }
}
/* The curve is drawn INSIDE the box and nowhere else.

   It used to be clamped into a band one full span above and below instead,
   which is not the same thing: a function that leaves the window came back as a
   flat line ruled across the axis labels, the readout chip and whatever plot
   was drawn next to it. Clamping also invents data — a pole pinned at y1 + span
   looks like a plateau at a finite height. Clipping draws the part that is
   there and nothing where the curve is not, which is the honest picture and the
   one that survives being zoomed into.

   The samples are kept on the plot so the overlay can find zeros and turning
   points from them (59c). They are the samples actually drawn, so a marker can
   never disagree with the curve under it. */
/* The sample count follows the BOX, not a constant.

   `x` below runs over `P.x0…P.x1`, which is the window AFTER the reader's pan
   and zoom, so the curve is already re-evaluated for whatever is on screen —
   zoom in and you are looking at new arithmetic, not a magnified polyline. What
   was fixed at 240 was how many points that arithmetic used, which is the part
   the reader actually sees: 240 samples across a 1 200-pixel plot is a point
   every five pixels, so every corner is cut and a curve zoomed into far enough
   turns visibly polygonal.

   One sample per pixel-and-a-half is the target. The count is derived from the
   plot's WIDTH, which the canvas already bounds, so this cannot become the
   unbounded loop §2.5 warns about — the span may grow without limit under zoom,
   the box cannot. A caller that knows better still wins: an explicit `n` is
   taken as given, because a few stages sample something expensive per point. */
function plotCurve(ctx, P, fn, n, col, w, fill){
  const N = n || Math.max(240, Math.min(1200, Math.round((P && P.pw) || 0)));
  const xs = new Array(N + 1), ys = new Array(N + 1);
  const draw = () => {
    ctx.beginPath();
    let started = false, prevC = NaN;
    const band = (P.y1 - P.y0) * 4, cLo = P.y0 - band, cHi = P.y1 + band;
    for(let i = 0; i <= N; i++){
      const x = P.x0 + (P.x1 - P.x0) * i / N;
      const y = fn(x);
      xs[i] = x; ys[i] = y;
      if(!Number.isFinite(y)){ started = false; continue; }
      /* still bounded before it reaches the canvas: a coordinate of 1e300 makes
         the rasteriser drop the whole path, so a pole would erase the curve it
         belongs to rather than run off the top of it */
      const yc = Math.max(cLo, Math.min(cHi, y));
      /* J10: adjacent samples pinned to OPPOSITE clamp bands are the two sides
         of a sign-flipping pole — two branches, never a chord. Joining them
         drew the Veneziano amplitude as a polyline running from +∞ to −∞
         along the clamp. A steep but finite curve never trips this: its
         samples live inside the window and are not clamped at all. */
      if(started && ((prevC === cHi && yc === cLo) || (prevC === cLo && yc === cHi))) started = false;
      if(!started){ ctx.moveTo(P.X(x), P.Y(yc)); started = true; }
      else ctx.lineTo(P.X(x), P.Y(yc));
      prevC = yc;
    }
    if(fill){
      ctx.lineTo(P.X(P.x1), P.Y(Math.max(P.y0, 0)));
      ctx.lineTo(P.X(P.x0), P.Y(Math.max(P.y0, 0)));
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      return;
    }
    ctx.strokeStyle = col; ctx.lineWidth = w || 1.6; ctx.stroke();
  };
  pvClip(ctx, P, draw);
  if(!fill && P && P.kind === 'plot'){
    if(!P.curves) P.curves = [];
    if(P.curves.length < 4) P.curves.push({ xs, ys, fn, col });
  }
}
function probeLine(ctx, P, x, label){
  if(x < P.x0 || x > P.x1) return;
  const sx = P.X(x);
  ctx.strokeStyle = rgbCss(TH.text, 0.75); ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(sx, P.py); ctx.lineTo(sx, P.py + P.ph); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = rgbCss(TH.text);
  ctx.beginPath(); ctx.arc(sx, P.py + P.ph, 4, 0, 6.2832); ctx.fill();
  if(label){
    ctx.font = '600 10px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(label, sx, P.py - 2);
  }
}
function stageNote(ctx, txt, W, H){
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '12px ' + FONT_UI;
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.fillText(uniSup(txt), W / 2, H - 8);
}
/* small DOM helpers for stage control panels */
/* A row holding a slider is allowed to wrap, because that row now carries three
   things — the track, the typed value and the formatted reading — and on a
   narrow dock column the reading should drop to a second line rather than
   squeeze the track down to a stub. */
function ctlRow(label, inner){
  const sl = inner.indexOf('type="range"') >= 0 ? ' rowsl' : '';
  return `<div class="row${sl}"><label class="lb" style="width:86px">${label}</label>${inner}</div>`;
}

/* Every numeric control in the laboratory is typeable, because a slider can only
   ask the questions its author thought of. Beside each track sits a box holding
   the plain number, and what is typed there is NOT limited by the slider's
   min/max: the track spans the comfortable range, the typed value may leave it,
   and the thumb simply pins at the end while the stage uses the number actually
   asked for. Only genuine physical limits clamp, and those announce themselves —
   see the `lim` argument to wireSlider.

   The formatted reading stays a separate span. It carries units and commentary
   ("0.5 c · γ = 1.1547") that could never be typed back in, and a span grows to
   fit its text where a fixed-width input would clip it. */
function ctlSlider(id, min, max, step, val){
  return `<input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">` +
    `<input class="num sldnum" id="${id}n" spellcheck="false" autocomplete="off"` +
    ` title="Type an exact value — π/4, 2^10, 1/3 and sqrt(2) all work, and you may go` +
    ` outside the slider's ${min} to ${max}."` +
    ` aria-label="exact value — type it here, beyond the slider if you need to">` +
    `<span class="val" id="${id}v"></span>`;
}
/* The value label is the one piece of a control panel that is written AFTER
   buildStagePanel() has supify()'d the panel, so it has to typeset itself. It
   used to assign textContent, which meant a formatter emitting "10^16 cm⁻³"
   put a literal caret on screen — invisible to runall (which greps only for
   NaN/undefined) and to the unit suite (which never sees the DOM). Formatters
   are number-driven, so treating their output as HTML is safe. */
function ctlLabel(id, s){ const e = $(id); if(e) e.innerHTML = supify(String(s)); }
/* What counts as a number the reader may type: π/4, 2^10, 1/3, sqrt(2), 3e-4.
   The implementation is `mathNum` in 10-math.js, because engine modules parse
   typed scenarios too and `runtests` cannot see anything down here. This name
   stays as the panel layer's alias for its hundred call sites. */
const ctlParse = s => mathNum(s);
/* Why a typed value was refused. A clamp that silently moves the number teaches
   the reader nothing, so the box is marked and the reason is stated in full in
   the panel's status line — and only the control that raised it may clear it. */
function ctlWhy(id, why){
  const box = $(id + 'n');
  if(box) box.classList.toggle('clamped', !!why);
  const n = $('ctlWhy'); if(!n) return;
  if(why){ n.innerHTML = supify(why); n.dataset.from = id; }
  else if(n.dataset.from === id){ n.textContent = ''; n.removeAttribute('data-from'); }
}
/* `lim` is optional and describes the *physics*, not the widget:
   {lo, hi, why} — e.g. {hi:0.999, why:'Nothing with mass reaches c…'}.
   It may instead be a function returning that, for the cases where two controls
   constrain each other — a probe on a spinning disk may not pass c, and how far
   out that is depends on the rim speed currently set. */
function wireSlider(id, get, set, fmt, lim){
  const e = $(id); if(!e) return;
  const box = $(id + 'n'), F = fmt || String;
  /* the reading and the typed box are two views of one number, refreshed
     together — except never over the top of whoever is mid-keystroke */
  const show = () => {
    ctlLabel(id + 'v', F(get()));
    if(box && box !== document.activeElement){
      const v = +get();
      box.value = Number.isFinite(v) ? String(+v.toPrecision(12)) : '';
    }
  };
  /* one commit path for the slider and the box, so the two cannot disagree */
  const apply = v => {
    let why = '';
    /* A control stepping by whole numbers from a positive start is a *count* —
       mesh panels, series terms, orbits. Typed entry is allowed to ask for more
       of them than the slider offers, because more resolution is a real
       question; it is not allowed to ask for a third of a panel, nor for a
       million, because the first is degenerate and the second wedges the page.
       A stage that knows its own cost better says so with an explicit `lim`. */
    const cnt = (+e.step === 1 && +e.min > 0);
    if(cnt){
      v = Math.round(v);
      const cap = Math.max(+e.max * 10, +e.max + 100);
      if(v < +e.min){ v = +e.min; why = `This is a count, and ${fmtNum(+e.min, 3)} is the fewest that still draws something meaningful.`; }
      else if(v > cap){ v = cap; why = `Held at ${fmtNum(cap, 6)}. The work grows with this number, and past here the page would stop responding rather than tell you anything new.`; }
    }
    const L = (typeof lim === 'function') ? lim() : lim;
    if(L){
      if(L.lo !== undefined && v < L.lo){ v = L.lo; why = L.why || ''; }
      if(L.hi !== undefined && v > L.hi){ v = L.hi; why = L.why || ''; }
    }
    set(v);
    e.value = String(Math.max(+e.min, Math.min(+e.max, v)));   // the thumb pins
    show(); ctlWhy(id, why);
    refreshStageReadout(); updateStageLegend(); updateStageChip();
  };
  show();
  e.addEventListener('input', () => {
    if(!ST) return;                       // the stage that owned this slider is gone
    apply(+e.value);
  });
  if(!box) return;
  box.addEventListener('focus', () => box.select());
  box.addEventListener('blur', () => {
    if(box.dataset.esc){ box.removeAttribute('data-esc'); show(); return; }
    if(!ST) return;
    const v = ctlParse(box.value);
    if(Number.isFinite(v)) apply(v);
    else show();                          // gibberish leaves the picture alone
  });
  box.addEventListener('keydown', ev => {
    if(ev.key === 'Enter'){ ev.preventDefault(); box.blur(); }
    else if(ev.key === 'Escape'){ ev.preventDefault(); box.dataset.esc = '1'; box.blur(); }
  });
}

