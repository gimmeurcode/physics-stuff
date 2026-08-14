/* ============================================================================
   4e · SHARED DRAWING HELPERS FOR THE CALCULUS WINGS
   The field pipeline draws in three dimensions with a depth sort. Most of the
   calculus stages instead want an honest flat plane with equal scales on both
   axes — you cannot see that a projection is perpendicular if the picture has
   stretched one direction — so they share this small toolkit.
   ============================================================================ */

/* an aspect-true plot box centred on (cx, cy) showing at least ±half */
function ctBox(W, H, cx, cy, half, pad){
  const p = Object.assign({ l:58, r:26, t:36, b:44 }, pad || {});
  const pw = Math.max(20, W - p.l - p.r), ph = Math.max(20, H - p.t - p.b);
  const u = Math.min(pw, ph) / (2 * half);
  const X = x => p.l + pw / 2 + (x - cx) * u;
  const Y = y => p.t + ph / 2 - (y - cy) * u;
  return { px:p.l, py:p.t, pw, ph, u, cx, cy, X, Y,
    invX:sx => cx + (sx - p.l - pw / 2) / u,
    invY:sy => cy - (sy - p.t - ph / 2) / u,
    x0:cx - (pw / 2) / u, x1:cx + (pw / 2) / u,
    y0:cy - (ph / 2) / u, y1:cy + (ph / 2) / u,
    inside:(sx, sy) => sx >= p.l && sx <= p.l + pw && sy >= p.t && sy <= p.t + ph };
}
/* Clip to a box's rectangle, whether it is an `mkPlot` or a `ctBox`.

   `pvClip` deliberately skips a `ctBox`, because §2.5 keeps aspect-true diagrams
   free to point an arrow past their own frame. That exemption is right for
   ARROWS and wrong for everything else: `ctFrame` strokes a rectangle round a
   ctBox, and a curve crossing a stroked frame is not a deliberate overflow, it
   is ink in the wrong place. The phase plane is a ctBox, and its background
   trajectories were sweeping across the entire canvas and straight through the
   trace–determinant chart beside it.

   So curves, fills and markers clip to any framed box; only ctArrow keeps the
   old plot-only rule. */
function ctClip(ctx, P, fn){
  if(!P || !(P.pw > 0) || !(P.ph > 0) || !Number.isFinite(P.px) || !Number.isFinite(P.py)){ fn(); return; }
  ctx.save();
  ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  try { fn(); } finally { ctx.restore(); }
}
function ctFrame(ctx, P, title){
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(P.px, P.py, P.pw, P.ph);
  if(title){
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 11.5px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    /* the caption hangs above the box, so a box flush to the top of a short
       canvas would put it off the edge */
    ctx.fillText(title, P.px + P.pw / 2, Math.max(P.py - 5, 12));
  }
}
/* a unit grid plus the two axes, with numbers on the ticks.

   EACH AXIS GETS ITS OWN STEP. The step used to be derived from the x span and
   applied to both, which is harmless on an aspect-true ctBox — there the two
   spans are equal by construction — and catastrophic on an mkPlot whose axes
   carry different units. A pressure axis spanning 200 kPa gridded at the x
   axis's step of 0.5 asks for four hundred thousand lines and as many formatted
   labels, once per animation frame; the stage does not fail, it simply stops
   returning. Passing `step` explicitly still forces both axes, because the
   callers that do so want a true unit grid. */
/* A step that cannot ask for more lines than a plot has pixels.

   Eleven call sites pass an explicit step because they want a true unit grid,
   and that step is a constant chosen for the window the stage opens with. The
   reader can now zoom out, which multiplies the span while the constant stays
   put: at 32x out, a step of 0.5 over what was a 20-unit axis asks for 1280
   lines per axis per frame, and the pathology AI-GUIDE §7 records — a frame
   that simply stops returning — is the same shape. Doubling the step until it
   fits keeps the grid a unit grid (2, 4, 8 units) rather than abandoning it. */
function ctGridStep(want, span, px){
  let s = want;
  if(!(s > 0) || !Number.isFinite(s)) return ctNiceStep(Math.abs(span));
  const most = Math.max(4, Math.min(400, px / 3));
  let guard = 0;
  while(Math.abs(span) / s > most && guard++ < 60) s *= 2;
  return s;
}
function ctGrid(ctx, P, step, labels){
  /* ONE OWNER FOR THE AXIS FURNITURE.

     Once the reader has panned or zoomed, pvDrawAxes (59c) draws the grid, the
     zero axes and the tick numbers for the window actually on screen — and it
     was drawing them ON TOP of these rather than instead of them. Two grids at
     two different steps, and two sets of numbers one pixel and one significant
     figure apart: that is why every negative tick on a zoomed plot read `=40`
     rather than `−40`. Two minus signs, a pixel apart, look like an equals sign.

     Yielding rather than suppressing the other one is the right way round,
     because pv's ticks follow the window and a stage's are a fixed list chosen
     for the window its author framed. When the view is home, the author's win. */
  if(P && P.key && typeof pvOf === 'function' && typeof pvIsDefault === 'function'
     && !pvIsDefault(pvOf(P.key))) return;
  const sx = step ? ctGridStep(step, P.x1 - P.x0, P.pw) : ctNiceStep(P.x1 - P.x0);
  const sy = step ? ctGridStep(step, P.y1 - P.y0, P.ph) : ctNiceStep(P.y1 - P.y0);
  ctx.save();
  ctx.beginPath(); ctx.rect(P.px, P.py, P.pw, P.ph); ctx.clip();
  ctx.strokeStyle = rgbCss(TH.line, 0.75); ctx.lineWidth = 0.7;
  for(let x = Math.ceil(P.x0 / sx) * sx; x <= P.x1; x += sx){
    ctx.beginPath(); ctx.moveTo(P.X(x), P.py); ctx.lineTo(P.X(x), P.py + P.ph); ctx.stroke();
  }
  for(let y = Math.ceil(P.y0 / sy) * sy; y <= P.y1; y += sy){
    ctx.beginPath(); ctx.moveTo(P.px, P.Y(y)); ctx.lineTo(P.px + P.pw, P.Y(y)); ctx.stroke();
  }
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.2;
  if(P.y0 < 0 && P.y1 > 0){ ctx.beginPath(); ctx.moveTo(P.px, P.Y(0)); ctx.lineTo(P.px + P.pw, P.Y(0)); ctx.stroke(); }
  if(P.x0 < 0 && P.x1 > 0){ ctx.beginPath(); ctx.moveTo(P.X(0), P.py); ctx.lineTo(P.X(0), P.py + P.ph); ctx.stroke(); }
  ctx.restore();
  if(labels !== false){
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for(let x = Math.ceil(P.x0 / sx) * sx; x <= P.x1; x += sx)
      if(Math.abs(x) > 1e-9) ctx.fillText(fmtNum(x, 3), P.X(x), P.py + P.ph + 4);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for(let y = Math.ceil(P.y0 / sy) * sy; y <= P.y1; y += sy)
      if(Math.abs(y) > 1e-9) ctx.fillText(fmtNum(y, 3), P.px - 6, P.Y(y));
  }
}
function ctNiceStep(span){
  const raw = span / 8, mag = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / mag;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * mag;
}
/* a 2D arrow in data coordinates, with the head sized in pixels */
function ctArrow(ctx, P, x0, y0, x1, y1, col, w, label){
  const ax = P.X(x0), ay = P.Y(y0), bx = P.X(x1), by = P.Y(y1);
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w || 2;
  if(L < 0.6){ ctx.beginPath(); ctx.arc(ax, ay, 2, 0, 6.2832); ctx.fill(); return; }
  const ux = dx / L, uy = dy / L;
  const hl = Math.max(5, Math.min(14, L * 0.3)), hw = hl * 0.44;
  /* The SHAFT AND HEAD clip to the plot, the LABEL does not. An arrow whose tip
     leaves the chart was being drawn across the rest of the canvas — laMatrix's
     AB parallelogram sent e₂ ↦ (0,5) through the top of its box and over the
     fps counter. Its name still has to be readable though, and ctFitText below
     already pins that back onto the canvas, so keeping the label outside the
     clip is what lets a just-off-scale arrow still say which one it is. */
  pvClip(ctx, P, () => {
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx - ux * hl * 0.78, by - uy * hl * 0.78); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - ux * hl - uy * hw, by - uy * hl + ux * hw);
    ctx.lineTo(bx - ux * hl + uy * hw, by - uy * hl - ux * hw);
    ctx.closePath(); ctx.fill();
  });
  if(label){
    ctx.font = '600 11.5px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    /* the label sits beyond the head, so an arrow reaching the edge of the plot
       puts its own name outside the canvas — the SVD stage lost both σu labels
       that way whenever the image ellipse filled the frame */
    const p = ctFitText(ctx, bx + ux * 13, by + uy * 13, String(label));
    ctx.fillText(label, p.x, p.y);
  }
}
/* Clipped for the same reason as ctPath, and with a sharper consequence: a
   marker outside its own chart does not read as "off the scale", it reads as a
   position. The trace–determinant plane put the system's (trace, det) dot in
   the empty canvas below its own box whenever det went past the window, where
   it looked exactly like a legitimate reading. */
function ctDot(ctx, P, x, y, r, col, ring){
  ctClip(ctx, P, () => {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(P.X(x), P.Y(y), r, 0, 6.2832); ctx.fill();
    if(ring){ ctx.strokeStyle = ring; ctx.lineWidth = 1.6; ctx.stroke(); }
  });
}
/* A label is the one thing on a canvas that fails completely silently. A curve
   drawn past the edge still shows the part that fits; a string drawn past the
   edge shows nothing, raises nothing, and leaves the readout and every other
   check in the suite reporting a perfectly healthy stage. Twenty-seven stages
   were losing labels that way at window shapes nobody had tested — an axis tip
   that projects above the canvas at a short aspect ratio, an annotation pinned
   to a curve that runs off the right on a narrow one.

   So the label is pulled back inside instead of being thrown away. Non-finite
   coordinates draw nothing at all, which is what an argument-order slip
   produces and what `auditsize.ps1` now looks for. */
function ctText(ctx, sx, sy, s, col, font, align, base){
  if(!Number.isFinite(sx) || !Number.isFinite(sy)) return;
  ctx.fillStyle = col; ctx.font = font || ('12px ' + FONT_UI);
  ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'alphabetic';
  /* canvas cannot take markup, so caret exponents become Unicode here — see
     uniSup() in 10-math.js for why the same string needs two renderers */
  const txt = uniSup(s);
  const p = ctFitText(ctx, sx, sy, txt);
  ctx.fillText(txt, p.x, p.y);
}
/* CLIPPED TO ITS PLOT, like plotCurve — and for 310 call sites at once.

   `plotCurve` has always drawn inside pvClip; everything else that puts a line
   into a plot comes through here, and this did not. So a phase-plane trajectory
   spiralled out across the whole canvas and straight over the neighbouring
   trace–determinant chart; the nuclear term curves ran above the frame and
   through the fps counter; the Regge fit line and the modular-τ ray reached the
   canvas corner. Eleven of Programme J's forty screenshots are this one missing
   call.

   `pvClip` is a no-op for anything that is not a `kind:'plot'` box, so the
   aspect-true `ctBox` diagrams keep the arrows that are *meant* to reach past
   their frame — the distinction §2.5 draws, now enforced in one place instead
   of being left to each caller to remember. */
function ctPath(ctx, P, pts, col, w, dash){
  if(pts.length < 2) return;
  ctClip(ctx, P, () => {
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.8;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath();
  let started = false;
  for(const p of pts){
    if(!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)){ started = false; continue; }
    const X = P.X(p.x), Y = P.Y(p.y);
    started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true);
  }
  ctx.stroke();
  if(dash) ctx.setLineDash([]);
  });
}
function ctFill(ctx, P, pts, col){
  if(pts.length < 3) return;
  ctClip(ctx, P, () => {          /* same reason as ctPath — see above */
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(P.X(pts[0].x), P.Y(pts[0].y));
  for(let i = 1; i < pts.length; i++) ctx.lineTo(P.X(pts[i].x), P.Y(pts[i].y));
  ctx.closePath(); ctx.fill();
  });
}
/* sample a parametrised curve into points, so it can be drawn or filled */
function ctSample(f, t0, t1, n){
  const out = [];
  for(let i = 0; i <= n; i++) out.push(f(t0 + (t1 - t0) * i / n));
  return out;
}
function ctParam(ctx, P, f, t0, t1, n, col, w, dash){
  ctPath(ctx, P, ctSample(f, t0, t1, n), col, w, dash);
}
function ctArcAngle(ctx, P, cx, cy, rpx, a0, a1, col, w){
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.4;
  ctx.beginPath();
  ctx.arc(P.X(cx), P.Y(cy), rpx, -a0, -a1, a1 > a0);
  ctx.stroke();
}

/* ---- level curves by marching squares --------------------------------------
   Contours are the whole language of the multivariable wings, and a contour
   that is drawn by colouring pixels instead of tracing the level set looks
   convincing while being subtly wrong near saddles. This traces properly. */
function ctContour(ctx, P, f, level, col, w, n, dash){
  const N = n || 120;
  const hx = (P.x1 - P.x0) / N, hy = (P.y1 - P.y0) / N;
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.2;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath();
  const V = new Float64Array((N + 1) * (N + 1));
  for(let j = 0; j <= N; j++) for(let i = 0; i <= N; i++)
    V[j * (N + 1) + i] = f(P.x0 + i * hx, P.y0 + j * hy) - level;
  const ip = (a, b, va, vb) => a + (b - a) * (va / (va - vb));
  for(let j = 0; j < N; j++) for(let i = 0; i < N; i++){
    const x0 = P.x0 + i * hx, x1 = x0 + hx, y0 = P.y0 + j * hy, y1 = y0 + hy;
    const v00 = V[j * (N + 1) + i], v10 = V[j * (N + 1) + i + 1];
    const v01 = V[(j + 1) * (N + 1) + i], v11 = V[(j + 1) * (N + 1) + i + 1];
    if(!Number.isFinite(v00) || !Number.isFinite(v10) || !Number.isFinite(v01) || !Number.isFinite(v11)) continue;
    const pts = [];
    if((v00 > 0) !== (v10 > 0)) pts.push({ x:ip(x0, x1, v00, v10), y:y0 });
    if((v10 > 0) !== (v11 > 0)) pts.push({ x:x1, y:ip(y0, y1, v10, v11) });
    if((v01 > 0) !== (v11 > 0)) pts.push({ x:ip(x0, x1, v01, v11), y:y1 });
    if((v00 > 0) !== (v01 > 0)) pts.push({ x:x0, y:ip(y0, y1, v00, v01) });
    for(let k = 0; k + 1 < pts.length; k += 2){
      ctx.moveTo(P.X(pts[k].x), P.Y(pts[k].y));
      ctx.lineTo(P.X(pts[k + 1].x), P.Y(pts[k + 1].y));
    }
  }
  ctx.stroke();
  if(dash) ctx.setLineDash([]);
}
/* a filled colour map of a scalar, drawn as cells — the backdrop every contour
   plot needs so that "uphill" has a direction you can see at a glance */
/* Offscreen bitmaps, reused across calls and across stages, sized in CELLS
   rather than pixels — the blit scales to whatever the box is, so a resize
   costs nothing and a window shape costs nothing.

   Kept as a POOL keyed on N, not a single buffer. A single buffer is correct
   but reallocates a canvas whenever N changes, and a stage drawing two maps of
   different sizes in one frame would then allocate two canvases per frame —
   trading the cost rather than removing it. No stage does that today; the pool
   is here so that the next one cannot reintroduce the problem by accident.
   There are only a handful of distinct N in the whole laboratory (52…70, plus
   90, 120 and the Ising lattice), so the pool never grows. */
const CT_HEAT_BUFS = new Map();
function ctHeatBuf(N){
  let B = CT_HEAT_BUFS.get(N);
  if(!B){
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const c2 = cv.getContext('2d');
    B = { n:N, cv, ctx:c2, img:c2.createImageData(N, N) };
    CT_HEAT_BUFS.set(N, B);
  }
  return B;
}
/* A scalar field as colour. The map is built as PIXELS and blitted once, not
   painted cell by cell.

   Cell by cell it was one fillRect, one CSS colour string built and one colour
   string parsed by the canvas PER CELL PER FRAME, and at the 60x60 and 70x70
   grids the multivariable stages ask for that is 3 600 to 4 900 rasterising
   calls a frame — ten of the seventeen stages auditperf called heavy spent
   almost all of their frame right here. It is now two calls whatever N is.

   The values are still recomputed every frame, deliberately: f is usually a
   closure built fresh by the caller, so there is no honest identity to key a
   cache on, and a heat map showing a stale field would look exactly like a
   correct one. What is removed is the canvas round trip, not the mathematics.

   Nearest-neighbour keeps the flat cells the fillRect version drew, and the
   blit gives them exact non-overlapping edges — which is what the rounding it
   replaces was for. Overlapping cells double-composite at translucent alpha
   and paint a visible grid over the data. */
function ctHeat(ctx, P, f, lo, hi, cells, alpha, diverging){
  const N = cells || 56;
  const span = (hi - lo) || 1;
  const B = ctHeatBuf(N), d = B.img.data;
  for(let j = 0; j < N; j++) for(let i = 0; i < N; i++){
    const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / N;
    const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / N;
    const v = f(x, y);
    /* row 0 of an ImageData is the TOP row, while j counts upward from y0 */
    const o = 4 * ((N - 1 - j) * N + i);
    /* the buffer is reused, so a cell with no finite value must be cleared
       rather than skipped — skipping it would show the previous frame's colour */
    if(!Number.isFinite(v)){ d[o + 3] = 0; continue; }
    const t = (v - lo) / span;
    const c = diverging ? rampDiv(2 * t - 1) : rampSeq(t);
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
  }
  B.ctx.putImageData(B.img, 0, 0);
  ctx.save();
  ctx.globalAlpha = alpha === undefined ? 0.72 : alpha;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(B.cv, 0, 0, N, N, P.px, P.py, P.pw, P.ph);
  ctx.restore();
}
/* the range of a scalar over the box, for scaling the map honestly */
function ctRange(f, P, n){
  const N = n || 40;
  let lo = Infinity, hi = -Infinity;
  for(let j = 0; j <= N; j++) for(let i = 0; i <= N; i++){
    const v = f(P.x0 + (P.x1 - P.x0) * i / N, P.y0 + (P.y1 - P.y0) * j / N);
    if(Number.isFinite(v)){ lo = Math.min(lo, v); hi = Math.max(hi, v); }
  }
  return { lo, hi };
}
/* evenly spaced contour levels that avoid landing exactly on a flat region */
function ctLevels(lo, hi, k){
  const out = [];
  for(let i = 1; i < (k || 12); i++) out.push(lo + (hi - lo) * i / (k || 12));
  return out;
}

/* ---- small DOM controls, matching the ones the other wings use ---- */
/* Labels are supify()'d at render time so a picker showing e^(−x²) typesets it,
   while the underlying table keeps the ASCII the expression parser needs. */
const ctSeg = (id, cur, opts) => `<div class="seg" id="${id}" style="flex-wrap:wrap">` +
  opts.map(o => `<button data-v="${o[0]}" aria-pressed="${String(cur) === String(o[0])}">${supify(o[1])}</button>`).join('') + '</div>';
function ctWireSeg(id, set){
  const s = $(id); if(!s) return;
  for(const b of s.children) b.addEventListener('click', () => {
    if(!ST) return;
    set(b.dataset.v); buildStagePanel(); updateStageLegend(); updateStageChip();
  });
}
const ctChk = (id, label, on) =>
  `<label class="chk"><input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span>${label}</span></label>`;
function ctWireChk(id, set){
  const e = $(id); if(!e) return;
  e.addEventListener('change', () => { if(ST){ set(e.checked); refreshStageReadout(); updateStageLegend(); } });
}
/* The perspective camera's focal length is (H/2)/tan(fov/2) ≈ 1.10·H, so an
   object of half-size s at distance d spans 2·1.10·H·s/d pixels. Filling about
   80% of the canvas height therefore wants d ≈ 2.7·s. Every 3D calculus stage
   sets its opening distance from this rather than from a guessed constant. */
const ctCamFit = s => {
  R.cam.dist = Math.max(1.4, Math.min(40, 2.7 * s));
  /* clear any pan inherited from the stage before, or the scene opens off-centre */
  R.cam.tx = R.cam.ty = R.cam.tz = 0;
};
const ctBtn = (id, label) => `<button class="btn sm" id="${id}">${label}</button>`;
function ctWireBtn(id, fn){
  const e = $(id); if(!e) return;
  e.addEventListener('click', () => { if(ST){ fn(); buildStagePanel(); } });
}
/* a matrix of any shape — the UI module's matTable is fixed at 3×3, and the
   Hessian and the 2×2 Jacobian both need to be printed too */
function ctMat(M, rowLbl, colLbl){
  /* labels are optional: the linear-algebra wings print plenty of matrices that
     have nothing useful to say about their rows and columns */
  const cl = colLbl || M[0].map(() => '');
  const rl = rowLbl || M.map(() => '');
  let h = '<div class="mat-wrap"><table class="mat"><tr><td class="hd"></td>' +
    cl.map(c => `<td class="hd">${c}</td>`).join('') + '</tr>';
  for(let i = 0; i < M.length; i++){
    h += `<tr><td class="hd">${rl[i]}</td>`;
    for(let j = 0; j < M[i].length; j++) h += `<td>${fmtNear(M[i][j])}</td>`;
    h += '</tr>';
  }
  return h + '</table></div>';
}
/* a labelled numeric row for a readout card */
const ctVec2 = (v, d) => `⟨${fmtNum(v.x, d || 4)}, ${fmtNum(v.y, d || 4)}⟩`;
const ctVec3f = (v, d) => `⟨${fmtNum(v.x, d || 4)}, ${fmtNum(v.y, d || 4)}, ${fmtNum(v.z, d || 4)}⟩`;
const ctDeg = r => fmtNum(r * 180 / Math.PI, 4) + '°';

