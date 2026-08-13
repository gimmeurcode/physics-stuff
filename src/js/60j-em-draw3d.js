/* ============================================================================
   4c · THE EM WING IN THREE DIMENSIONS
   Every electromagnetism stage can be viewed either as the flat z = 0 plane
   (clearest for reading numbers off a diagram) or as the real three-dimensional
   field, orbited with the same camera as the rest of the laboratory. The physics
   is identical — only the projection changes — so the probe readouts, the flux
   integrals and the Maxwell checks are shared verbatim between the two views.
   ============================================================================ */

/* ---- the view toggle every EM stage carries ---- */
function emDimControl(){
  const is3 = ST && ST.dim === '3d';
  return ctlRow('view', `<div class="seg" id="emDim">
      <button data-d="2d" aria-pressed="${!is3}">2D plane</button>
      <button data-d="3d" aria-pressed="${is3}">3D space</button>
    </div>`) +
    `<p class="help">${is3
      ? 'Three-dimensional view: <b>drag to orbit</b>, scroll to zoom. Field lines are traced through the full volume, not just one plane, and the Gaussian surfaces are real spheres.'
      : 'Flat view of the z = 0 plane. Out-of-plane components are drawn as ⊙ (toward you) and ⊗ (away). Switch to 3D to see the field fill space.'}</p>`;
}
function emWireDim(){
  const seg = $('emDim'); if(!seg) return;
  for(const b of seg.children) b.addEventListener('click', () => {
    if(!ST) return;
    ST.dim = b.dataset.d;
    ST.lineKey = ''; ST.lk = '';                     // both line caches are keyed per view
    if(ST.dim === '3d'){
      R.cam.az = 0.62; R.cam.el = 0.34; R.cam.dist = 13;
      R.cam.tx = R.cam.ty = R.cam.tz = 0;
    }
    buildStagePanel();                               // 3D adds z controls, 2D removes them
    updateStageLegend();
  });
}
const em3d = st => !!(st && st.dim === '3d');

/* ---- scene furniture ---- */
function em3dBegin(ext){
  R.mode2d = false; R.extent = ext;
  R.begin();
}
function em3dAxes(L){
  const gl = rgbCss(TH.line), ac = rgbCss(TH.faint);
  const n = 6, s = L / n;
  for(let i = -n; i <= n; i++){
    R.line(v3(i * s, -L, -L), v3(i * s, L, -L), gl, 0.7, 0.32);
    R.line(v3(-L, i * s, -L), v3(L, i * s, -L), gl, 0.7, 0.32);
  }
  R.arrow(v3(-L, 0, 0), v3(2.1 * L, 0, 0), ac, 1.1, 0.7);
  R.arrow(v3(0, -L, 0), v3(0, 2.1 * L, 0), ac, 1.1, 0.7);
  R.arrow(v3(0, 0, -L), v3(0, 0, 2.1 * L), ac, 1.1, 0.7);
  R.label(v3(L * 1.16, 0, 0), 'x', rgbCss(TH.dim));
  R.label(v3(0, L * 1.16, 0), 'y', rgbCss(TH.dim));
  R.label(v3(0, 0, L * 1.16), 'z', rgbCss(TH.dim));
}
function em3dLines(lines, col, w, alpha){
  for(const ln of lines){
    if(ln.pts.length < 3) continue;
    R.path(ln.pts, col, w || 1.3, alpha === undefined ? 0.8 : alpha);
    for(let k = 34; k < ln.pts.length - 1; k += 70){
      const a = ln.pts[k], b = ln.pts[k + 1];
      R.arrow(a, vmul(vsub(b, a), 7), col, w || 1.3, alpha === undefined ? 0.85 : alpha);
    }
  }
}
/* a wireframe sphere: three great circles read as a solid without hiding anything */
function em3dSphere(c, rr, col, alpha){
  for(const ax of [0, 1, 2]){
    const rim = [];
    for(let i = 0; i <= 72; i++){
      const a = i / 72 * 6.2832;
      rim.push(vadd(c, planePt(ax, 0, rr * Math.cos(a), rr * Math.sin(a))));
    }
    R.path(rim, col, 1.3, alpha === undefined ? 0.75 : alpha);
  }
}
function em3dRing(c, rr, nh, col, w, alpha){
  const u = vperp(nh), v = vcross(nh, u), rim = [];
  for(let i = 0; i <= 72; i++){
    const a = i / 72 * 6.2832;
    rim.push(vadd(c, vadd(vmul(u, rr * Math.cos(a)), vmul(v, rr * Math.sin(a)))));
  }
  R.path(rim, col, w || 1.8, alpha === undefined ? 0.95 : alpha);
}
/* the placed objects, drawn as solids in the scene */
function em3dObject(o, L, selected){
  const p = v3(o.p.x, o.p.y, o.p.z || 0);
  if(selected) em3dSphere(p, 0.34, rgbCss(TH.text, 0.75), 0.75);
  if(o.kind === 'charge'){
    const col = o.q >= 0 ? rgbCss(TH.pos) : rgbCss(TH.neg);
    R.dot(p, 7 + 3 * Math.min(1.5, Math.abs(o.q)), col, rgbCss(TH.bg));
    R.label(p, o.q >= 0 ? '+' : '−', rgbCss(TH.bg), 0, 0, '700 12px ' + FONT_UI);
    R.label(p, 'q = ' + fmtNum(o.q, 2), col, 0, -23, '600 10.5px ' + FONT_MONO);
    if(o.v && (o.v.x || o.v.y || o.v.z)){
      const vv = v3(o.v.x, o.v.y, o.v.z || 0);
      R.arrow(p, vmul(vv, 1.8), rgbCss(TH.text), 2, 0.95);
      R.label(vadd(p, vmul(vv, 2.1)), 'v', rgbCss(TH.text), 0, 0, '600 11px ' + FONT_UI);
    }
  } else if(o.kind === 'wire'){
    const col = rgbCss(TH.warn);
    R.line(vadd(p, v3(0, 0, -L)), vadd(p, v3(0, 0, L)), col, 3, 0.95);
    R.arrow(vadd(p, v3(0, 0, L * 0.45)), v3(0, 0, (o.I >= 0 ? 1 : -1) * L * 0.32), col, 2.4, 0.95);
    R.label(vadd(p, v3(0, 0, L * 0.8)), 'I = ' + fmtNum(o.I, 2), col, 14, -8, '600 10px ' + FONT_MONO);
  } else if(o.kind === 'magnet'){
    const m = v3(o.m.x, o.m.y, o.m.z || 0);
    const len = vlen(m); if(len < 1e-9) return;
    const u = vmul(m, 1 / len), half = 0.28 + 0.1 * Math.min(3, len);
    R.line(p, vadd(p, vmul(u, half)), rgbCss(TH.pos), 7, 1);
    R.line(p, vsub(p, vmul(u, half)), rgbCss(TH.neg), 7, 1);
    R.label(vadd(p, vmul(u, half)), 'N', rgbCss(TH.bg), 0, 0, '700 10px ' + FONT_UI);
    R.label(vsub(p, vmul(u, half)), 'S', rgbCss(TH.bg), 0, 0, '700 10px ' + FONT_UI);
    if(o.v && (o.v.x || o.v.y || o.v.z)){
      const vv = v3(o.v.x, o.v.y, o.v.z || 0);
      R.arrow(p, vmul(vv, 1.8), rgbCss(TH.text), 2, 0.95);
    }
  } else if(o.kind === 'loop'){
    em3dRing(p, o.R, v3(0, 0, 1), rgbCss(TH.grad), 2.6, 1);
    R.label(vadd(p, v3(0, 0, 0.22)), 'pickup loop', rgbCss(TH.grad), 0, -10, '600 10px ' + FONT_UI);
  }
}
/* the ray under the cursor, dropped onto the z = 0 plane */
function em3dPickPlane(sx, sy){
  const ax = (sx - R.W / 2) / R.focal, ay = -(sy - R.H / 2) / R.focal;
  const dir = vadd(R.fwd, vadd(vmul(R.right, ax), vmul(R.up, ay)));
  if(Math.abs(dir.z) > 1e-4){
    const t = -R.eye.z / dir.z;
    if(t > 0.05) return vadd(R.eye, vmul(dir, t));
  }
  return null;
}
/* a caption drawn over the 3D scene, after flush() */
function em3dCaption(ctx, W, H, top, bottom){
  ctx.font = '600 12px ' + FONT_UI; ctx.textAlign = 'center';
  if(top){
    ctx.fillStyle = rgbCss(TH.dim); ctx.textBaseline = 'top';
    ctx.fillText(top, W / 2, 14);
  }
  if(bottom){
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI; ctx.textBaseline = 'bottom';
    ctx.fillText(bottom, W / 2, H - 8);
  }
}

/* ---- 3D frames, one per stage -------------------------------------------- */

STAGES.emSandbox.frame3d = function(st, dt, ctx, W, H){
  const L = 5, objs = st.objs;
  if(st.run) this.step(st, dt, true);
  em3dBegin(L);
  em3dAxes(L);
  if(st.show.lines){
    const key = this.key(st) + '3d';
    if(st.lineKey !== key){
      st.lineCache = {
        E: st.show.E ? emFieldLines(objs, 'E', L, false) : [],
        B: st.show.B ? emFieldLines(objs, 'B', L, false) : []
      };
      st.lineKey = key;
    }
    if(st.show.E) em3dLines(st.lineCache.E, rgbCss(TH.warn), 1.3, 0.8);
    if(st.show.B) em3dLines(st.lineCache.B, rgbCss(TH.neg), 1.3, 0.75);
  }
  /* field vectors on a coarse lattice — the honest 3D analogue of the ⊙/⊗ grid */
  if(!st.show.lines || st.show.poynt){
    const n = 4, step = 2 * L / (n + 1);
    let emax = 1e-9, bmax = 1e-9;
    const samp = [];
    for(let i = 1; i <= n; i++) for(let j = 1; j <= n; j++) for(let k = 1; k <= n; k++){
      const p = v3(-L + i * step, -L + j * step, -L + k * step);
      const f = emField(objs, p, 0);
      if(!Number.isFinite(f.E.x + f.B.x)) continue;
      samp.push({ p, f });
      emax = Math.max(emax, Math.min(50, vlen(f.E)));
      bmax = Math.max(bmax, Math.min(50, vlen(f.B)));
    }
    for(const s of samp){
      if(st.show.E && emax > 1e-6){
        const m = vlen(s.f.E);
        if(m > 1e-9) R.arrow(s.p, vmul(s.f.E, Math.min(1, Math.pow(m / emax, 0.4)) * 0.55 / m), rgbCss(TH.warn), 1.3, 0.75);
      }
      if(st.show.B && bmax > 1e-6){
        const m = vlen(s.f.B);
        if(m > 1e-9) R.arrow(s.p, vmul(s.f.B, Math.min(1, Math.pow(m / bmax, 0.4)) * 0.5 / m), rgbCss(TH.neg), 1.3, 0.7);
      }
      if(st.show.poynt){
        const S = emPoynting(s.f), m = vlen(S);
        if(m > 1e-9) R.arrow(s.p, vmul(S, 0.4 / m), rgbCss(TH.grad), 1.2, 0.7);
      }
    }
  }
  objs.forEach((o, i) => {
    em3dObject(o, L, i === st.sel);
    if(st.show.force && (o.kind === 'charge' || o.kind === 'magnet')){
      const F = emForceOn(objs, i, 0), m = vlen(F);
      if(m > 1e-9 && Number.isFinite(m)){
        const p = v3(o.p.x, o.p.y, o.p.z || 0);
        R.arrow(p, vmul(F, (0.5 + 0.9 * Math.min(1, m / 0.5)) / m), rgbCss(TH.curl), 2.4, 1);
      }
    }
    if(o.kind === 'loop'){
      const c = v3(o.p.x, o.p.y, o.p.z || 0);
      const phi = emFluxBDisc(objs, c, o.R, v3(0, 0, 1), 0, 12);
      R.label(vsub(c, v3(0, o.R * 1.25, 0)), 'Φ = ' + fmtNum(phi, 3), rgbCss(TH.grad), 0, 12, '600 10px ' + FONT_MONO);
    }
  });
  /* the probe, with its E and B vectors */
  const pp = v3(st.probeP.x, st.probeP.y, st.probeP.z || 0);
  const pf = emField(objs, pp, 0);
  R.dot(pp, 5, rgbCss(TH.text), rgbCss(TH.bg));
  const eL = vlen(pf.E), bL = vlen(pf.B);
  if(eL > 1e-9){
    R.arrow(pp, vmul(pf.E, 1.1 / eL), rgbCss(TH.warn), 3);
    R.label(vadd(pp, vmul(pf.E, 1.3 / eL)), 'E', rgbCss(TH.warn), 0, 0, '700 12px ' + FONT_UI);
  }
  if(bL > 1e-9){
    R.arrow(pp, vmul(pf.B, 1.0 / bL), rgbCss(TH.neg), 3);
    R.label(vadd(pp, vmul(pf.B, 1.2 / bL)), 'B', rgbCss(TH.neg), 0, 0, '700 12px ' + FONT_UI);
  }
  R.flush();
  em3dCaption(ctx, W, H, null,
    st.tool === 'probe'
      ? 'drag to orbit · click to move the probe or select an object · edit positions with the sliders'
      : 'click to place a ' + st.tool + ' on the z = 0 plane · drag to orbit');
};
STAGES.emSandbox.pick3d = function(st, sx, sy, phase){
  if(phase === 'move' || phase === 'up') return;      // orbiting owns the drag in 3D
  const w = em3dPickPlane(sx, sy);
  if(!w) return;
  let hit = -1, best = 0.6;
  st.objs.forEach((o, i) => {
    const d = vlen(vsub(v3(o.p.x, o.p.y, o.p.z || 0), w));
    if(d < best){ best = d; hit = i; }
  });
  if(hit >= 0){ st.sel = hit; this.buildSelPanel(); return; }
  if(st.tool !== 'probe' && Math.abs(w.x) < 5 && Math.abs(w.y) < 5){
    if(this.place(st, w.x, w.y)){ buildStagePanel(); return; }
  }
  st.probeP = { x: w.x, y: w.y, z: st.probeP.z || 0 };
};

STAGES.emGauss.frame3d = function(st, dt, ctx, W, H){
  const L = 4.2, objs = st.objs;
  em3dBegin(L);
  em3dAxes(L);
  const key = JSON.stringify(objs) + '3d' + (TH.dark ? 'd' : 'l');
  if(!st.lc3 || st.lk3 !== key){ st.lc3 = emFieldLines(objs, 'E', L, false); st.lk3 = key; }
  em3dLines(st.lc3, rgbCss(TH.warn), 1.3, 0.72);
  for(const o of objs) em3dObject(o, L, false);
  /* the Gaussian surface as a real sphere, with E·n̂ sampled over it */
  const c = v3(st.c.x, st.c.y, st.c.z || 0);
  const qEnc = emEnclosedCharge(objs, c, st.R, 0);
  const surfCol = qEnc > 1e-9 ? TH.pos : qEnc < -1e-9 ? TH.neg : TH.mid;
  em3dSphere(c, st.R, rgbCss(surfCol, 0.85), 0.85);
  const N = 42, samp = [];
  let smax = 1e-9;
  for(let i = 0; i < N; i++){
    const nh = emFibSphere(N, i);
    const d = vdot(emField(objs, vadd(c, vmul(nh, st.R)), 0).E, nh);
    if(!Number.isFinite(d)) continue;
    samp.push({ nh, d }); smax = Math.max(smax, Math.abs(d));
  }
  for(const s of samp){
    if(Math.abs(s.d) < smax * 1e-3) continue;
    const base = vadd(c, vmul(s.nh, st.R));
    const len = Math.sign(s.d) * Math.pow(Math.abs(s.d) / smax, 0.55) * 0.85;
    R.arrow(base, vmul(s.nh, len), s.d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.7, 0.95);
  }
  R.flush();
  em3dCaption(ctx, W, H,
    'the flux out of this closed surface equals the charge inside it — drag to orbit, click to move the sphere',
    'orange arrows leave the surface, blue ones enter; their sum over the whole sphere is Q');
};
STAGES.emGauss.pick3d = function(st, sx, sy, phase){
  if(phase === 'move' || phase === 'up') return;
  const w = em3dPickPlane(sx, sy);
  if(w) st.c = { x: w.x, y: w.y, z: 0 };
};

STAGES.emGaussB.frame3d = function(st, dt, ctx, W, H){
  const L = 4.2, objs = st.objs;
  em3dBegin(L);
  em3dAxes(L);
  const key = JSON.stringify(objs) + '3d' + (TH.dark ? 'd' : 'l');
  if(!st.lc3 || st.lk3 !== key){ st.lc3 = emFieldLines(objs, 'B', L, false); st.lk3 = key; }
  em3dLines(st.lc3, rgbCss(TH.neg), 1.3, 0.75);
  for(const o of objs) em3dObject(o, L, false);
  const c = v3(st.c.x, st.c.y, st.c.z || 0);
  em3dSphere(c, st.R, rgbCss(TH.mid), 0.85);
  const N = 42, samp = [];
  let smax = 1e-9;
  for(let i = 0; i < N; i++){
    const nh = emFibSphere(N, i);
    const d = vdot(emField(objs, vadd(c, vmul(nh, st.R)), 0).B, nh);
    if(!Number.isFinite(d)) continue;
    samp.push({ nh, d }); smax = Math.max(smax, Math.abs(d));
  }
  for(const s of samp){
    if(Math.abs(s.d) < smax * 1e-3) continue;
    const base = vadd(c, vmul(s.nh, st.R));
    const len = Math.sign(s.d) * Math.pow(Math.abs(s.d) / smax, 0.55) * 0.8;
    R.arrow(base, vmul(s.nh, len), s.d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.7, 0.95);
  }
  R.flush();
  em3dCaption(ctx, W, H,
    'every B line that enters this surface leaves it again — the flux is zero wherever you put the sphere',
    'in 3D the loops are unmistakable: B lines close on themselves, so they have no sources to count');
};
STAGES.emGaussB.pick3d = STAGES.emGauss.pick3d;

STAGES.emFaraday.frame3d = function(st, dt, ctx, W, H){
  st.tt += dt;
  const objs = this.objsAt(st, st.tt);
  const c = v3(0, 0, 0), nh = v3(1, 0, 0);
  const phi = emFluxBDisc(objs, c, st.R, nh, 0, 14);
  const emf = -emDPhiBdt(objs, c, st.R, nh, 0, 0.02, 12);
  st.phi = phi; st.emf = emf; st.objsNow = objs;
  st.hist.push({ t: st.tt, phi, emf });
  while(st.hist.length && st.hist[0].t < st.tt - 7) st.hist.shift();

  const L = 4;
  em3dBegin(L);
  em3dAxes(L);
  em3dLines(emFieldLines(objs, 'B', L, false), rgbCss(TH.neg), 1.2, 0.6);
  /* the coil is a real ring, seen from any angle */
  em3dRing(c, st.R, nh, rgbCss(TH.grad), 3.4, 1);
  R.label(vadd(c, v3(0, 0, st.R * 1.25)), 'pickup coil', rgbCss(TH.grad), 0, -8, '600 11px ' + FONT_UI);
  /* the induced E field around the loop — the thing Faraday's law is about */
  const u = vperp(nh), v = vcross(nh, u), K = 16;
  let tmax = 1e-9;
  const tang = [];
  for(let i = 0; i < K; i++){
    const a = (i + 0.5) / K * 2 * Math.PI;
    const p = vadd(c, vadd(vmul(u, st.R * Math.cos(a)), vmul(v, st.R * Math.sin(a))));
    const T = vadd(vmul(u, -Math.sin(a)), vmul(v, Math.cos(a)));
    const d = vdot(emField(objs, p, 0).E, T);
    tang.push({ p, T, d }); tmax = Math.max(tmax, Math.abs(d));
  }
  for(const s of tang){
    if(Math.abs(s.d) < tmax * 0.02) continue;
    R.arrow(s.p, vmul(s.T, Math.sign(s.d) * Math.pow(Math.abs(s.d) / tmax, 0.6) * 0.6),
            s.d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 2, 0.95);
  }
  for(const o of objs) em3dObject(o, L, false);
  R.flush();
  /* the plot rides on top, in its own band */
  const bandY = H - 190;
  ctx.fillStyle = rgbCss(TH.bg, 0.88);
  ctx.fillRect(0, bandY - 10, W, H - bandY + 10);
  const pl = st.pl = mkPlot(64, bandY + 16, W - 100, 118, st.tt - 7, st.tt, -1, 1);
  let pmax = 1e-6, emax = 1e-6;
  for(const h of st.hist){ pmax = Math.max(pmax, Math.abs(h.phi)); emax = Math.max(emax, Math.abs(h.emf)); }
  plotFrame(ctx, pl, 'time', '', 'Φ_B(t) and the EMF it induces — EMF is the slope of Φ');
  plotZeroY(ctx, pl);
  const series = (key, norm, col) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.beginPath();
    st.hist.forEach((h, i) => {
      const x = pl.X(h.t), y = pl.Y(h[key] / norm * 0.86);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    });
    ctx.stroke();
  };
  series('phi', pmax, rgbCss(TH.neg));
  series('emf', emax, rgbCss(TH.warn));
  ctx.font = '600 11px ' + FONT_UI; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = rgbCss(TH.neg); ctx.fillText('Φ_B', pl.px + pl.pw - 8, pl.py + 12);
  ctx.fillStyle = rgbCss(TH.warn); ctx.fillText('EMF', pl.px + pl.pw - 8, pl.py + 27);
  em3dCaption(ctx, W, H, 'the induced E field genuinely circles the coil — orbit to see the loop it forms', null);
};

STAGES.emAmpere.frame3d = function(st, dt, ctx, W, H){
  st.tt += dt;
  if(st.mode === 'capacitor'){
    /* the two-surfaces argument stays a schematic: switch back to 2D for it */
    return this.frameCap(st, dt, ctx, W, H);
  }
  const L = 3.6;
  const objs = [{ kind: 'wire', I: st.I, p: { x: 0, y: 0, z: 0 } }];
  st.objs = objs;
  em3dBegin(L);
  em3dAxes(L);
  em3dLines(emFieldLines(objs, 'B', L, false), rgbCss(TH.neg), 1.3, 0.72);
  em3dObject(objs[0], L, false);
  /* the Amperian loop, with B·T̂ around it */
  const c = v3(0, 0, 0), nh = v3(0, 0, 1);
  em3dRing(c, st.R, nh, rgbCss(TH.curl), 2.6, 1);
  const K = 20;
  for(let i = 0; i < K; i++){
    const a = (i + 0.5) / K * 2 * Math.PI;
    const p = v3(st.R * Math.cos(a), st.R * Math.sin(a), 0);
    const T = v3(-Math.sin(a), Math.cos(a), 0);
    const d = vdot(emField(objs, p, 0).B, T);
    if(!Number.isFinite(d) || Math.abs(d) < 1e-9) continue;
    R.arrow(p, vmul(T, Math.max(-1, Math.min(1, d / 0.4)) * 0.5), d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.7, 0.95);
  }
  R.flush();
  em3dCaption(ctx, W, H,
    'the current runs along ẑ and its B field wraps around it — right-hand rule, in three dimensions',
    '∮B·dl around the violet loop = the current threading it, whatever the radius');
};

/* ---- the sandbox's equations of motion, shared by both views ---------------
   Charges obey F = q(E + v×B) with unit mass; magnets feel τ = m×B and swing.
   In the flat view the motion is constrained to the plane, because that is the
   only place the flat view can honestly draw it. */
STAGES.emSandbox.step = function(st, dt, threeD){
  const objs = st.objs, h = Math.min(0.03, dt), L = 5;
  for(let i = 0; i < objs.length; i++){
    const o = objs[i];
    const others = objs.filter((_, j) => j !== i);   // never its own field
    const at = v3(o.p.x, o.p.y, o.p.z || 0);

    if(o.kind === 'charge' && o.v){
      let v = v3(o.v.x, o.v.y, threeD ? (o.v.z || 0) : 0);
      if(others.length){
        const fld = emField(others, at, 0);
        /* the flat view can only show in-plane motion, so there it responds to
           the in-plane E and the out-of-plane B — exactly the components that
           keep a planar trajectory planar */
        const E = threeD ? fld.E : v3(fld.E.x, fld.E.y, 0);
        const B = threeD ? fld.B : v3(0, 0, fld.B.z);
        v = emBorisPush(v, o.q, E, B, h);
      }
      o.v.x = v.x; o.v.y = v.y; o.v.z = threeD ? v.z : 0;
      o.p.x += v.x * h; o.p.y += v.y * h;
      if(threeD) o.p.z = (o.p.z || 0) + v.z * h;

    } else if(o.kind === 'magnet'){
      if(others.length){
        const B = emField(others, at, 0).B;
        const m0 = v3(o.m.x, o.m.y, o.m.z || 0);
        const w0 = o.w && o.w.x !== undefined ? o.w : v3(0, 0, +o.w || 0);
        const r = emSpinStep(m0, B, w0, h, !threeD);
        o.m.x = r.m.x; o.m.y = r.m.y; o.m.z = threeD ? r.m.z : 0;
        o.w = r.w;
      }
      if(o.v){
        o.p.x += o.v.x * h; o.p.y += o.v.y * h;
        if(threeD) o.p.z = (o.p.z || 0) + (o.v.z || 0) * h;
      }
    }

    /* the domain is a box; reflect elastically at its walls so nothing is lost
       and no energy is invented */
    for(const ax of ['x', 'y', 'z']){
      if(ax === 'z' && !threeD) continue;
      const q = o.p[ax] || 0;
      if(Math.abs(q) > L){
        o.p[ax] = Math.sign(q) * L;
        if(o.v) o.v[ax] = -(o.v[ax] || 0);
      }
    }
  }
  st.lineKey = '';
};

/* ---- 3D-only extra controls ---- */
STAGES.emSandbox.controls3dExtra = function(){
  return ctlRow('probe z', ctlSlider('emPZ', -5, 5, 0.05, ST.probeP.z || 0));
};
STAGES.emSandbox.wire3dExtra = function(){
  wireSlider('emPZ', () => ST.probeP.z || 0, v => { ST.probeP.z = v; }, v => (+v).toFixed(2));
};
STAGES.emGauss.controls3dExtra = function(){
  return ctlRow('surface z', ctlSlider('egZ', -3, 3, 0.05, ST.c.z || 0));
};
STAGES.emGauss.wire3dExtra = function(){
  wireSlider('egZ', () => ST.c.z || 0, v => { ST.c.z = v; }, v => (+v).toFixed(2));
};
STAGES.emGaussB.controls3dExtra = function(){
  return ctlRow('surface z', ctlSlider('gbZ', -3, 3, 0.05, ST.c.z || 0));
};
STAGES.emGaussB.wire3dExtra = function(){
  wireSlider('gbZ', () => ST.c.z || 0, v => { ST.c.z = v; }, v => (+v).toFixed(2));
};

/* ---- wrap every EM stage with the view switch -----------------------------
   The 2D and 3D frames share all the physics; only the projection differs, so
   readouts, chips and legends are untouched by the toggle. */
for(const id of ['emSandbox', 'emGauss', 'emGaussB', 'emFaraday', 'emAmpere']){
  const S0 = STAGES[id];
  if(!S0.use3d) S0.use3d = st => !!(st && st.dim === '3d');
  const baseEnter = S0.enter, baseControls = S0.controls, baseWire = S0.wire;
  const baseFrame = S0.frame, basePick = S0.pick;

  S0.mode = st => S0.use3d(st) ? '3d' : '2d';
  S0.drag = st => !S0.use3d(st);          // in 3D the pointer orbits the camera

  S0.enter = function(st, o){
    baseEnter.call(this, st, o);
    st.dim = (o && o.dim) === '3d' ? '3d' : '2d';
    if(st.dim === '3d'){ R.cam.az = 0.62; R.cam.el = 0.34; R.cam.dist = 13; R.cam.tx = R.cam.ty = R.cam.tz = 0; }
  };
  S0.controls = function(){
    let h = emDimControl() + baseControls.call(this);
    if(S0.use3d(ST) && this.controls3dExtra) h += this.controls3dExtra();
    return h;
  };
  S0.wire = function(){
    emWireDim();
    baseWire.call(this);
    if(S0.use3d(ST) && this.wire3dExtra) this.wire3dExtra();
  };
  S0.frame = function(st, dt, ctx, W, H){
    if(S0.use3d(st) && this.frame3d) return this.frame3d(st, dt, ctx, W, H);
    return baseFrame.call(this, st, dt, ctx, W, H);
  };
  S0.pick = function(st, sx, sy, phase){
    if(S0.use3d(st)) return this.pick3d ? this.pick3d(st, sx, sy, phase) : undefined;
    return basePick ? basePick.call(this, st, sx, sy, phase) : undefined;
  };
}
/* the capacitor is a schematic argument about two surfaces on one loop; it stays
   flat even when the rest of the stage is in 3D */
STAGES.emAmpere.use3d = st => !!(st && st.dim === '3d' && st.mode !== 'capacitor');
