/* ============================================================================
   4e · THE RELATIVITY WING
   Einstein's arguments were pictures before they were equations, and most of
   them are pictures of two observers disagreeing. So most stages here draw two
   scenes at once — the same events in two frames — and every number in the
   readout is computed from the relativity engine rather than written down.

   Colour convention, kept across the whole wing:
     lab / unprimed frame  · teal      moving / primed frame · orange
     light and light cones · yellow    curvature and metric  · purple
     E field · yellow (as in the E&M wing)   B field · blue
   ============================================================================ */

/* ---- small drawing helpers, shared by every stage in this file ---- */
function rlArrow(ctx, x0, y0, x1, y1, col, w, head){
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  if(L < 0.8) return;
  const hl = Math.min(head || 8, L * 0.45), ux = dx / L, uy = dy / L;
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - ux * hl * 0.8, y1 - uy * hl * 0.8); ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - ux * hl - uy * hl * 0.40, y1 - uy * hl + ux * hl * 0.40);
  ctx.lineTo(x1 - ux * hl + uy * hl * 0.40, y1 - uy * hl - ux * hl * 0.40);
  ctx.closePath(); ctx.fill();
}
function rlSegment(ctx, x0, y0, x1, y1, col, w, dash){
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.4;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  if(dash) ctx.setLineDash([]);
}
/* The relativity and string wings' label helper. Unlike ctText it does NOT run
   uniSup — these stages pass tensor notation like ∂_μ F^μν, whose carets and
   underscores are already the characters wanted — but it shares the clamp, so a
   caption laid out for a tall canvas ends up at the edge of a short one rather
   than off it. See ctFitText in 60a. */
function rlText(ctx, x, y, s, col, font, align, base){
  if(!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.fillStyle = col; ctx.font = font || ('11px ' + FONT_UI);
  ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'middle';
  const p = ctFitText(ctx, x, y, String(s));
  ctx.fillText(s, p.x, p.y);
}
function rlDot(ctx, x, y, r, col, ring){
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  if(ring){ ctx.strokeStyle = ring; ctx.lineWidth = 1.2; ctx.stroke(); }
}
/* A labelled sub-scene — the two-frame stages are built out of these. The title
   is centred rather than left-aligned because the readout chip floats over the
   top-left corner of the canvas and would otherwise sit on top of it. */
function rlScene(ctx, x, y, w, h, title, col){
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
  rlText(ctx, x + w / 2, y + 13, title, rgbCss(col), '600 11.5px ' + FONT_UI, 'center', 'middle');
  return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
}
function rlPanes(W, H, gap){
  const g = gap === undefined ? 16 : gap;
  const top = { x: 44, y: 26, w: W - 78, h: (H - 74 - g) / 2 };
  return { top, bot: { x: top.x, y: top.y + top.h + g, w: top.w, h: top.h } };
}
function rlLine(ctx, P, xs, ys, col, w, dash){
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.8;
  if(dash) ctx.setLineDash(dash);
  ctx.beginPath();
  let on = false;
  for(let i = 0; i < xs.length; i++){
    const y = ys[i];
    if(!Number.isFinite(y)){ on = false; continue; }
    const X = P.X(xs[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, y)));
    on ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), on = true);
  }
  ctx.stroke();
  if(dash) ctx.setLineDash([]);
}
function rlYTicks(ctx, P, vals, fmt){
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(const v of vals) ctx.fillText((fmt || (x => fmtNum(x, 3)))(v), P.px - 6, P.Y(v));
}
const rlSeg = (id, cur, opts) => `<div class="seg" id="${id}" style="flex-wrap:wrap">` +
  opts.map(o => `<button data-v="${o[0]}" aria-pressed="${cur === o[0]}">${supify(o[1])}</button>`).join('') + '</div>';
function rlWireSeg(id, set){
  const s = $(id); if(!s) return;
  for(const b of s.children) b.addEventListener('click', () => {
    if(!ST) return;
    set(b.dataset.v); buildStagePanel(); updateStageLegend();
  });
}
/* pause / restart, for the stages that run a scripted animation */
function rlClockCtl(){
  return `<div class="row wrap">
    <button class="btn sm" id="rlPause">${ST && ST.paused ? 'Run' : 'Pause'}</button>
    <button class="btn sm" id="rlRestart">Restart</button>
  </div>`;
}
function rlWireClock(onRestart){
  const p = $('rlPause');
  if(p) p.addEventListener('click', () => {
    if(!ST) return;
    ST.paused = !ST.paused;
    p.textContent = ST.paused ? 'Run' : 'Pause';
  });
  const r = $('rlRestart');
  if(r) r.addEventListener('click', () => {
    if(!ST) return;
    ST.t = 0;
    if(onRestart) onRestart(ST);
  });
}
/* β sliders are everywhere; keep their formatting identical */
const rlBetaFmt = v => fmtNum(+v, 4) + ' c  ·  γ = ' + fmtNum(relGamma(Math.min(0.999999, +v)), 5);
/* Every value box will now take whatever a reader types, and |β| ≥ 1 makes
   relCheckBeta throw rather than draw a wrong picture. This is the one kind of
   ceiling that is allowed to stop them, because it is physics and not a widget:
   pass it to wireSlider and the refusal explains itself in the panel. 0.999999
   is where rlBetaFmt already stops, and it still reaches γ ≈ 707. */
const RL_BETA_LIM = { lo:-0.999999, hi:0.999999,
  why:'Nothing that carries mass reaches c, so |β| < 1 is a law rather than a ' +
      'slider limit — γ = 1/√(1 − β²) has no value at β = 1. Held at β = ±0.999999, ' +
      'which is already γ ≈ 707.' };

/* ============================================================================
   GROUP 1 · EINSTEIN'S THOUGHT EXPERIMENTS
   ============================================================================ */

/* ---- 1 · chasing a light beam ---------------------------------------------
   The question Einstein said he asked himself at sixteen: what does a light
   wave look like if you run alongside it? Maxwell has no answer — a standing
   electromagnetic wave is not a solution of his equations — and the resolution
   is that you never catch it. Boost as hard as you like: the wave still passes
   you at c, merely redder. */
