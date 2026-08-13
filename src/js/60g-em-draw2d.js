/* ============================================================================
   ELECTROMAGNETISM STAGES
   ============================================================================ */

/* shared 2D world<->screen mapping for the EM stages */
function emView(st, W, H, L){
  const ext = L || 5;
  const sc = Math.min(W - 40, H - 60) / (2 * ext);
  const cx = (W - 40) / 2 + 20, cy = H / 2;
  st.emS = sc; st.emCx = cx; st.emCy = cy; st.emL = ext;
  return {
    sc, cx, cy, ext,
    toS: (x, y) => [cx + x * sc, cy - y * sc],
    toW: (sx, sy) => [(sx - cx) / sc, (cy - sy) / sc]
  };
}
function emDrawArrow(ctx, x1, y1, x2, y2, col, w, head){
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if(!(L > 0.5)) return;
  const ux = dx / L, uy = dy / L, hl = Math.min(head || 8, L * 0.5), hw = hl * 0.5;
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.4;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - ux * hl * 0.7, y2 - uy * hl * 0.7); ctx.stroke();
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
  ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
  ctx.closePath(); ctx.fill();
}
/* out-of-plane component drawn the way every textbook draws it */
function emDrawPerp(ctx, x, y, val, scale, colOut, colIn){
  const s = Math.min(1, Math.abs(val) / scale);
  if(s < 0.05) return;
  const r = 3 + 7 * s;
  ctx.strokeStyle = val > 0 ? colOut : colIn;
  ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
  ctx.beginPath();
  if(val > 0){ ctx.arc(x, y, Math.max(1, r * 0.22), 0, 6.2832); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); }
  else {
    const d = r * 0.62;
    ctx.moveTo(x - d, y - d); ctx.lineTo(x + d, y + d);
    ctx.moveTo(x + d, y - d); ctx.lineTo(x - d, y + d); ctx.stroke();
  }
}
/* glyphs for the placed objects */
function emDrawObject(ctx, o, V, selected){
  const [sx, sy] = V.toS(o.p.x, o.p.y);
  ctx.save();
  if(selected){
    ctx.strokeStyle = rgbCss(TH.text, 0.9); ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.arc(sx, sy, 20, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  }
  if(o.kind === 'charge'){
    const col = o.q >= 0 ? rgbCss(TH.pos) : rgbCss(TH.neg);
    const r = 8 + 4 * Math.min(1.5, Math.abs(o.q));
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.bg); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgbCss(TH.bg); ctx.font = '700 ' + Math.round(r * 1.5) + 'px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(o.q >= 0 ? '+' : '−', sx, sy + 0.5);
    if(o.v && (o.v.x || o.v.y)){
      const [ex, ey] = V.toS(o.p.x + o.v.x * 1.6, o.p.y + o.v.y * 1.6);
      emDrawArrow(ctx, sx, sy, ex, ey, rgbCss(TH.text, 0.85), 2, 9);
      ctx.fillStyle = rgbCss(TH.text); ctx.font = '600 10px ' + FONT_MONO;
      ctx.fillText('v', (sx + ex) / 2 + 8, (sy + ey) / 2 - 8);
    }
  } else if(o.kind === 'wire'){
    const col = rgbCss(TH.warn);
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(sx, sy, 9, 0, 6.2832); ctx.stroke();
    if(o.I >= 0){ ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, 3, 0, 6.2832); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(sx - 6, sy - 6); ctx.lineTo(sx + 6, sy + 6);
           ctx.moveTo(sx + 6, sy - 6); ctx.lineTo(sx - 6, sy + 6); ctx.stroke(); }
    ctx.fillStyle = col; ctx.font = '600 10px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('I=' + fmtNum(o.I, 2), sx, sy + 12);
  } else if(o.kind === 'magnet'){
    /* a bar magnet drawn along its moment: red N, blue S */
    const m = Math.hypot(o.m.x, o.m.y) || 1;
    const ux = o.m.x / m, uy = o.m.y / m, len = 16 + 6 * Math.min(2, m);
    const [nx, ny] = [sx + ux * len, sy - uy * len];
    const [px, py] = [sx - ux * len, sy + uy * len];
    ctx.lineCap = 'round';
    ctx.strokeStyle = rgbCss(TH.pos); ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(nx, ny); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.neg);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(px, py); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.bg); ctx.font = '700 10px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', nx, ny); ctx.fillText('S', px, py);
    if(o.v && (o.v.x || o.v.y)){
      const [ex, ey] = V.toS(o.p.x + o.v.x * 1.6, o.p.y + o.v.y * 1.6);
      emDrawArrow(ctx, sx, sy, ex, ey, rgbCss(TH.text, 0.85), 2, 9);
    }
  } else if(o.kind === 'loop'){
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.arc(sx, sy, o.R * V.sc, 0, 6.2832); ctx.stroke();
    ctx.fillStyle = rgbCss(TH.grad); ctx.font = '600 10px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('pickup loop', sx, sy - o.R * V.sc - 5);
  }
  ctx.restore();
}

/* ---- 16 · the EM sandbox: place anything, watch everything interact -------- */
