/* ============================================================================
   DRAWING THE BOARD
   ============================================================================ */
function ckDrawGridDots(st, ctx, V){
  if(V.sc < 9) return;
  ctx.fillStyle = rgbCss(TH.line, 0.85);
  const g0 = V.toG(V.rect.x, V.rect.y + V.rect.h), g1 = V.toG(V.rect.x + V.rect.w, V.rect.y);
  for(let x = Math.floor(g0.x); x <= g1.x; x++)
    for(let y = Math.floor(g0.y); y <= g1.y; y++){
      const [sx, sy] = V.toS(x, y);
      ctx.fillRect(sx - 0.5, sy - 0.5, 1, 1);
    }
}

/* node potential → colour, on a diverging ramp scaled to the biggest swing */
function ckNodeColour(st, node){
  const m = st.meas;
  if(!m || !st.show.volts) return TH.text;
  let vmax = 1e-9;
  for(let k = 1; k < m.nodeV.length; k++) vmax = Math.max(vmax, Math.abs(m.nodeV[k]));
  const v = node > 0 ? (m.nodeV[node] || 0) : 0;
  return rampDiv(Math.max(-1, Math.min(1, v / vmax)));
}

function ckDrawWires(st, ctx, V){
  const sch = st.sch, ck = st.sim && st.sim.ck;
  ctx.lineCap = 'round';
  for(const w of sch.wires){
    const nd = ck ? ck.nm.node(w.a) : -1;
    const [x1, y1] = V.toS(w.a.x, w.a.y), [x2, y2] = V.toS(w.b.x, w.b.y);
    ctx.strokeStyle = rgbCss(ckNodeColour(st, nd), 0.95);
    ctx.lineWidth = Math.max(1.5, V.sc * 0.055);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  if(st.wireFrom){
    const [x1, y1] = V.toS(st.wireFrom.x, st.wireFrom.y);
    ctx.strokeStyle = rgbCss(TH.accent, 0.7);
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x1, y1, 5, 0, 6.2832); ctx.stroke();
    ctx.setLineDash([]);
  }
  if(ck) for(const j of ck.nm.junctions){
    const [jx, jy] = V.toS(j.x, j.y);
    ctx.fillStyle = rgbCss(ckNodeColour(st, ck.nm.node(j)));
    ctx.beginPath(); ctx.arc(jx, jy, Math.max(2.4, V.sc * 0.09), 0, 6.2832); ctx.fill();
  }
}

function ckDrawParts(st, ctx, V){
  const ck = st.sim && st.sim.ck;
  st.sch.comps.forEach((c, i) => {
    if(c.kind === 'M'){
      /* draw the coupling as a dashed link between the two inductors it names */
      const A = st.sch.comps.find(q => q.name === c.a), B = st.sch.comps.find(q => q.name === c.b);
      if(A && B){
        const [ax, ay] = V.toS(A.x, A.y), [bx, by] = V.toS(B.x, B.y);
        ctx.strokeStyle = rgbCss(TH.curl, 0.65); ctx.lineWidth = 1.4;
        ctx.setLineDash([5, 4]);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    ckDrawSym(ctx, c, V, i === st.sel, st.sim);
    /* pin dots, tinted by node */
    if(ck) ckPins(c).forEach(p => {
      const [px, py] = V.toS(p.x, p.y);
      ctx.fillStyle = rgbCss(ckNodeColour(st, ck.nm.node(p)), 0.9);
      ctx.beginPath(); ctx.arc(px, py, Math.max(1.8, V.sc * 0.06), 0, 6.2832); ctx.fill();
    });
    if(st.show.labels){
      const [sx, sy] = V.toS(c.x, c.y);
      const vert = ((c.rot || 0) % 180) === 90;
      ctx.fillStyle = rgbCss(TH.dim);
      ctx.font = '600 10.5px ' + FONT_MONO;
      ctx.textAlign = vert ? 'left' : 'center';
      ctx.textBaseline = vert ? 'middle' : 'bottom';
      const dx = vert ? V.sc * 0.7 : 0, dy = vert ? -7 : -(V.sc * 0.62 + 17);
      ctx.fillText(c.name, sx + dx, sy + dy);
      ctx.fillStyle = rgbCss(TH.faint);
      ctx.font = '10px ' + FONT_MONO;
      ctx.fillText(ckLabelOf(c), sx + dx, sy + dy + (vert ? 13 : 12));
    }
  });
}

/* voltages at nodes, currents through branches, carriers on the move */
function ckDrawAnnotations(st, ctx, V){
  const ck = st.sim && st.sim.ck, m = st.meas;
  if(!ck || !m) return;

  if(st.show.amps){
    for(const s of m.states){
      const c = s.e.c;
      if(c.kind === 'GND' || c.kind === 'M') continue;
      const pins = ckPins(c);
      /* Draw one arrow per PORT, not per component. An op amp drives its output
         pin, a controlled source its output pair, a transformer both windings —
         putting a single arrow across pins 1–2 would label the wrong terminals. */
      const flip = ckIsSrc(s.kind) ? -1 : 1;
      for(const port of s.ports){
        const pa = port[3], pb = port[4];
        if(pa < 0 || !pins[pa]) continue;
        const cur = port[2] * flip;
        let mid, dir;
        if(pb >= 0 && pins[pb]){
          mid = { x:(pins[pa].x + pins[pb].x) / 2, y:(pins[pa].y + pins[pb].y) / 2 };
          dir = { x:pins[pb].x - pins[pa].x, y:pins[pb].y - pins[pa].y };
        } else {
          /* a port that returns internally (an op-amp output): draw it on the lead */
          dir = { x:pins[pa].x - c.x, y:pins[pa].y - c.y };
          const dl = Math.hypot(dir.x, dir.y) || 1;
          mid = { x:pins[pa].x + dir.x / dl * 0.55, y:pins[pa].y + dir.y / dl * 0.55 };
        }
        const L = Math.hypot(dir.x, dir.y) || 1;
        /* the arrow sits below the body, the value labels above it and the node
           voltages out along the leads, forced to the same side whatever the
           rotation — otherwise a flipped part throws its arrow into its own label */
        const sgn = cur >= 0 ? 1 : -1;
        let nx = -dir.y / L, ny = dir.x / L;
        if(ny > 0.01 || (Math.abs(ny) <= 0.01 && nx < 0)){ nx = -nx; ny = -ny; }
        const [mx, my] = V.toS(mid.x + nx * 0.5, mid.y + ny * 0.5);
        const ux = dir.x / L * sgn, uy = dir.y / L * sgn;
        const a = V.sc * 0.3;
        ckArrow(ctx, mx - ux * a, my + uy * a, mx + ux * a, my - uy * a, rgbCss(TH.pos, 0.9), 1.8, 7);
        ctx.fillStyle = rgbCss(TH.pos);
        ctx.font = '600 9.5px ' + FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(ckEng(Math.abs(cur), 'A'), mx, my + 6);
      }
    }
  }

  if(st.show.volts){
    const done = {};
    for(const c of st.sch.comps){
      const pins = ckPins(c);
      pins.forEach(p => {
        const nd = ck.nm.node(p);
        if(nd <= 0 || done[nd]) return;
        done[nd] = 1;
        const [px, py] = V.toS(p.x, p.y);
        /* Push the label outward along the lead. A part's name and value sit
           above it and its current arrow below, so horizontal parts get their
           node labels left and right, and vertical ones get them on the left —
           three annotations round one component with nothing overlapping. */
        const out = p.x - c.x, up = p.y - c.y;
        ctx.fillStyle = rgbCss(TH.grad);
        ctx.font = '600 10px ' + FONT_MONO;
        if(Math.abs(up) > 0.1 && Math.abs(out) <= 0.1){
          ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(ckEng(m.nodeV[nd], 'V'), px - 9, py);
        } else {
          ctx.textAlign = out > 0.1 ? 'left' : 'right';
          ctx.textBaseline = 'bottom';
          ctx.fillText(ckEng(m.nodeV[nd], 'V'), px + (out > 0.1 ? 8 : -8), py - 5);
        }
      });
    }
  }

  if(st.show.carriers) ckDrawCarriers(st, ctx, V);
}

/* Carriers advance by ∫i dt, so the distance a dot has travelled is literally
   proportional to the charge that has passed. */
function ckDrawCarriers(st, ctx, V){
  const ck = st.sim.ck, m = st.meas;
  if(!st.flow || st.flow.key !== ckGeomKey(st.sch)){
    st.flow = { key: ckGeomKey(st.sch), segs: ckSegments(st.sch), ph:null };
    st.flow.ph = new Float64Array(st.flow.segs.length + ck.els.length);
  }
  const segCur = ckWireCurrents(ck, st.sch, m.states, st.flow.segs);
  let imax = 1e-12;
  for(const s of m.states) imax = Math.max(imax, Math.abs(s.i));
  for(let i = 0; i < segCur.length; i++) imax = Math.max(imax, Math.abs(segCur[i]));
  const dt = st.lastDT || 0.016;
  const spd = 1.1 / imax;                              /* grid units per amp-second */
  const paths = [];
  st.flow.segs.forEach((s, i) => paths.push({ a:s.a, b:s.b, i:segCur[i], ph:i }));
  ck.els.forEach((e, k) => {
    const pins = ckPins(e.c);
    if(pins.length < 2) return;
    const s = m.states.find(q => q.e === e);
    if(!s) return;
    paths.push({ a:pins[0], b:pins[1], i:s.i, ph: st.flow.segs.length + k });
  });
  const rad = Math.max(1.6, V.sc * 0.055);
  for(const p of paths){
    if(!Number.isFinite(p.i) || Math.abs(p.i) < imax * 1e-4) continue;
    st.flow.ph[p.ph] = (st.flow.ph[p.ph] + p.i * spd * dt) % 1;
    const len = Math.hypot(p.b.x - p.a.x, p.b.y - p.a.y);
    const n = Math.max(1, Math.round(len * 1.6));
    const alpha = Math.min(0.95, 0.3 + 0.7 * Math.abs(p.i) / imax);
    ctx.fillStyle = rgbCss(TH.warn, alpha);
    for(let k = 0; k < n; k++){
      let u = (k / n + st.flow.ph[p.ph]) % 1;
      if(u < 0) u += 1;
      const [cx, cy] = V.toS(p.a.x + (p.b.x - p.a.x) * u, p.a.y + (p.b.y - p.a.y) * u);
      ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.fill();
    }
  }
}

function ckArrow(ctx, x1, y1, x2, y2, col, w, head){
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  const ux = dx / L, uy = dy / L, px = -uy, py = ux;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head + px * head * 0.45, y2 - uy * head + py * head * 0.45);
  ctx.lineTo(x2 - ux * head - px * head * 0.45, y2 - uy * head - py * head * 0.45);
  ctx.closePath(); ctx.fill();
}

/* ---- the field overlay ---------------------------------------------------- */
function ckDrawField(st, ctx, V){
  if(!st.show.heat && !st.show.efield && !st.show.equipot) return;
  const ck = st.sim && st.sim.ck, m = st.meas;
  if(!ck || !m) return;
  const g0 = V.toG(V.rect.x, V.rect.y + V.rect.h), g1 = V.toG(V.rect.x + V.rect.w, V.rect.y);
  const key = ckGeomKey(st.sch) + '|' + [g0.x, g0.y, g1.x, g1.y].map(q => q.toFixed(2)).join(',');
  if(!st.field || st.fieldKey !== key){
    const nx = 128, ny = Math.max(24, Math.round(nx * (g1.y - g0.y) / Math.max(0.01, g1.x - g0.x)));
    st.field = ckFieldGrid(nx, Math.min(110, ny), g0.x, g1.x, g0.y, g1.y);
    st.fieldCond = ckConductors(st.sch, ck);
    ckFieldPaint(st.field, st.fieldCond);
    st.fieldKey = key;
    st.fieldCv = null;
  }
  const F = st.field;
  ckFieldValues(F, st.fieldCond, m.nodeV);
  ckFieldRelax(F, 16, 1.92);

  let vmax = 1e-9;
  for(let k = 1; k < m.nodeV.length; k++) vmax = Math.max(vmax, Math.abs(m.nodeV[k]));

  if(st.show.heat){
    if(!st.fieldCv){
      st.fieldCv = document.createElement('canvas');
      st.fieldCv.width = F.nx; st.fieldCv.height = F.ny;
    }
    const g = st.fieldCv.getContext('2d');
    const img = g.createImageData(F.nx, F.ny);
    for(let j = 0; j < F.ny; j++) for(let i = 0; i < F.nx; i++){
      const v = F.V[j * F.nx + i] / vmax;
      const c = rampDiv(Math.max(-1, Math.min(1, v)));
      const o = ((F.ny - 1 - j) * F.nx + i) * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2];
      img.data[o + 3] = Math.round(150 * Math.min(1, Math.abs(v) * 1.6 + 0.12));
    }
    g.putImageData(img, 0, 0);
    const [x0, y1] = V.toS(F.x0, F.y1), [x1, y0] = V.toS(F.x1, F.y0);
    ctx.save(); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(st.fieldCv, x0, y1, x1 - x0, y0 - y1);
    ctx.restore();
  }

  if(st.show.equipot){
    ctx.lineWidth = 1;
    for(let n = -6; n <= 6; n++){
      if(n === 0) continue;
      const lev = vmax * n / 7;
      const segs = ckContour(F, lev);
      ctx.strokeStyle = rgbCss(rampDiv(n / 7), 0.5);
      ctx.beginPath();
      for(const s of segs){
        const [ax, ay] = V.toS(s[0].x, s[0].y), [bx, by] = V.toS(s[1].x, s[1].y);
        ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }
  }

  if(st.show.efield){
    const step = 7;
    let emax = 1e-12;
    for(let j = 2; j < F.ny - 2; j += step) for(let i = 2; i < F.nx - 2; i += step){
      const q = ckFieldAt(F, F.x0 + i * F.dx, F.y0 + j * F.dy);
      if(!q.inside) emax = Math.max(emax, q.mag);
    }
    for(let j = 2; j < F.ny - 2; j += step) for(let i = 2; i < F.nx - 2; i += step){
      const x = F.x0 + i * F.dx, y = F.y0 + j * F.dy;
      const q = ckFieldAt(F, x, y);
      if(q.inside || q.mag < emax * 0.02) continue;
      const s = Math.min(1, q.mag / emax);
      const L = V.sc * 0.42 * (0.35 + 0.65 * Math.pow(s, 0.5));
      const [sx, sy] = V.toS(x, y);
      const ux = q.Ex / q.mag, uy = q.Ey / q.mag;
      ckArrow(ctx, sx - ux * L / 2, sy + uy * L / 2, sx + ux * L / 2, sy - uy * L / 2,
              rgbCss(TH.curl, 0.35 + 0.5 * s), 1.2, 5);
    }
  }
}

/* which node a probe is touching: the nearest pin or wire within half a grid
   unit, or −1 for a probe sitting in empty space */
function ckProbeNode(st, p){
  const ck = st.sim && st.sim.ck;
  if(!ck) return -1;
  let best = 0.55, node = -1;
  for(const c of st.sch.comps) for(const q of ckPins(c)){
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    if(d < best){ best = d; node = ck.nm.node(q); }
  }
  for(const w of st.sch.wires){
    const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, L2 = dx * dx + dy * dy;
    let u = L2 > 1e-12 ? ((p.x - w.a.x) * dx + (p.y - w.a.y) * dy) / L2 : 0;
    u = Math.max(0, Math.min(1, u));
    const d = Math.hypot(p.x - (w.a.x + u * dx), p.y - (w.a.y + u * dy));
    if(d < best){ best = d; node = ck.nm.node(w.a); }
  }
  return node;
}

/* every current-carrying path on the board, as straight segments — the wires
   with the currents the leaf-stripping solve found, plus the parts themselves */
function ckCurrentPaths(st){
  const ck = st.sim && st.sim.ck, m = st.meas;
  if(!ck || !m) return [];
  const segs = ckSegments(st.sch);
  const cur = ckWireCurrents(ck, st.sch, m.states, segs);
  const paths = segs.map((s, i) => ({ a:s.a, b:s.b, i:cur[i] }));
  for(const s of m.states){
    const pins = ckPins(s.e.c);
    for(const port of s.ports){
      if(port[3] < 0 || port[4] < 0 || !pins[port[3]] || !pins[port[4]]) continue;
      paths.push({ a:pins[port[3]], b:pins[port[4]], i:port[2] });
    }
  }
  return paths;
}

/* B out of the board, drawn the way a field perpendicular to the page must be */
function ckDrawBField(st, ctx, V){
  const paths = ckCurrentPaths(st);
  if(!paths.length) return;
  const g0 = V.toG(V.rect.x, V.rect.y + V.rect.h), g1 = V.toG(V.rect.x + V.rect.w, V.rect.y);
  const step = Math.max(0.8, 26 / V.sc);
  let bmax = 1e-30;
  const pts = [];
  for(let y = Math.ceil(g0.y / step) * step; y <= g1.y; y += step)
    for(let x = Math.ceil(g0.x / step) * step; x <= g1.x; x += step){
      const b = ckBAt(paths, x, y);
      if(!Number.isFinite(b)) continue;
      pts.push({ x, y, b });
      bmax = Math.max(bmax, Math.abs(b));
    }
  if(bmax < 1e-18) return;
  st.bmax = bmax;
  for(const p of pts){
    const s = Math.abs(p.b) / bmax;
    if(s < 0.02) continue;
    const r = Math.max(1.6, Math.min(9, V.sc * 0.10 * Math.pow(s, 0.4)));
    const [sx, sy] = V.toS(p.x, p.y);
    const col = rgbCss(TH.neg, 0.25 + 0.6 * Math.pow(s, 0.5));
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.2832); ctx.stroke();
    if(p.b > 0){                                   /* ⊙ — out of the board */
      ctx.beginPath(); ctx.arc(sx, sy, Math.max(0.9, r * 0.28), 0, 6.2832); ctx.fill();
    } else {                                       /* ⊗ — into it */
      const k = r * 0.68;
      ctx.beginPath();
      ctx.moveTo(sx - k, sy - k); ctx.lineTo(sx + k, sy + k);
      ctx.moveTo(sx + k, sy - k); ctx.lineTo(sx - k, sy + k);
      ctx.stroke();
    }
  }
}

function ckDrawProbe(st, ctx, V){
  /* probe B first, so A draws on top of it */
  const nb = ckProbeNode(st, st.pB);
  const [bx, by] = V.toS(st.pB.x, st.pB.y);
  ctx.strokeStyle = rgbCss(nb > 0 ? TH.neg : TH.faint); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(bx, by, 6, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx - 9, by); ctx.lineTo(bx + 9, by);
  ctx.moveTo(bx, by - 9); ctx.lineTo(bx, by + 9); ctx.stroke();
  ctx.fillStyle = rgbCss(nb > 0 ? TH.neg : TH.faint);
  ctx.font = '600 11px ' + FONT_MONO;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('B', bx + 9, by - 7);

  const [px, py] = V.toS(st.probeP.x, st.probeP.y);
  /* the line between them is the potential difference being measured */
  const na = ckProbeNode(st, st.probeP);
  if(na >= 0 && nb >= 0 && na !== nb){
    ctx.strokeStyle = rgbCss(TH.accent, 0.5); ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(bx, by); ctx.stroke();
    ctx.setLineDash([]);
    if(st.meas){
      const dv = (st.meas.nodeV[na] || 0) - (st.meas.nodeV[nb] || 0);
      ctx.fillStyle = rgbCss(TH.accent);
      ctx.font = '600 11px ' + FONT_MONO;
      ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('ΔV = ' + ckEng(dv, 'V'), (px + bx) / 2, (py + by) / 2 - 4);
    }
  }
  ctx.strokeStyle = rgbCss(na > 0 ? TH.text : TH.faint); ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(px - 11, py); ctx.lineTo(px + 11, py);
  ctx.moveTo(px, py - 11); ctx.lineTo(px, py + 11); ctx.stroke();
  ctx.fillStyle = rgbCss(na > 0 ? TH.text : TH.faint);
  ctx.font = '600 11px ' + FONT_MONO;
  ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
  ctx.fillText('A', px + 11, py - 9);
  if(st.field && (st.show.efield || st.show.heat || st.show.equipot)){
    const q = ckFieldAt(st.field, st.probeP.x, st.probeP.y);
    if(q.mag > 1e-9 && !q.inside){
      const L = 34, ux = q.Ex / q.mag, uy = q.Ey / q.mag;
      ckArrow(ctx, px, py, px + ux * L, py - uy * L, rgbCss(TH.curl), 2.2, 9);
    }
  }
}

