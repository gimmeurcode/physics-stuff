/* ============================================================================
   3fb · A CURRENT DENSITY THE READER WRITES — the two magnetic laws

   `emGauss` gave the reader a charge density; these give them a current, and the
   two laws it decides are the two the preset panels cannot honestly test.

   ∮B·dA = 0 is drawn on this site with a bar magnet, whose field comes from a
   closed-form dipole with ∇·B = 0 written into it. Getting zero out of that
   integral tests the quadrature and nothing else. With J typed as three
   expressions the field is Biot–Savart integrated over cells, and the zero has
   to come from the structure of the answer — B is a curl, and a curl has no
   divergence — for every current anyone can write, including currents that
   could not flow. There is nothing to arrange and no configuration to hunt for:
   that is precisely what "no magnetic charges" means, and it is invisible while
   the only sources on offer are objects whose fields were solved in advance.

   ∮B·dl = I_enc is the sharper one. It holds exactly when the typed current is
   divergence-free and fails when it is not, and the failure is not a small
   error: charge streaming radially outwards produces NO magnetic field at all
   by symmetry, and still threads a disc. Ampère's law without Maxwell's term is
   then not approximately wrong but self-contradictory, and a reader can type the
   counterexample in three boxes.

   Both stages live in `60i`/`60ia`; only their own-mode branches are here, to
   keep those files near the size guidance in src/js/CLAUDE.md.

   Prefix: emj
   ============================================================================ */

/* Each preset is a scenario, not a formula: what it demonstrates depends on
   where the surface or the loop is put, so the table carries that too. The
   sources are the strings themselves, so the boxes always show exactly what is
   being integrated.

   The ring circulates about the y-axis, which puts its two crossings at
   (±1, 0) in the z = 0 plane the panel draws — the two dots of every textbook
   picture. Writing it as h(s, y)·(−z, 0, x) rather than h·φ̂ avoids dividing by
   s: the vector (−z, 0, x) is s·φ̂ already, so the field is bounded on the axis
   and still exactly divergence-free, because a purely azimuthal field with no
   dependence on the azimuth has ∇·J = (1/s)∂J_φ/∂φ = 0. */
const EM_J_PRESETS = [
  { k:'ring', label:'a ring of current',
    jx:'-z*1.7*exp(-((sqrt(x^2+z^2)-1)^2 + y^2)/0.09)',
    jy:'0',
    jz:'x*1.7*exp(-((sqrt(x^2+z^2)-1)^2 + y^2)/0.09)',
    lc:[1, 0], z0:0, R:0.8 },
  { k:'sol', label:'a short solenoid',
    jx:'-z*2.1*exp(-(sqrt(x^2+z^2)-1)^2/0.05 - y^4/0.4)',
    jy:'0',
    jz:'x*2.1*exp(-(sqrt(x^2+z^2)-1)^2/0.05 - y^4/0.4)',
    lc:[1, 0], z0:0, R:0.7 },
  { k:'rad', label:'charge streaming outwards',
    jx:'1.3*x*exp(-(x^2+y^2+z^2)/0.25)',
    jy:'1.3*y*exp(-(x^2+y^2+z^2)/0.25)',
    jz:'1.3*z*exp(-(x^2+y^2+z^2)/0.25)',
    lc:[0, 0], z0:0.35, R:0.95 },
  { k:'wire', label:'a wire crossing the box',
    jx:'0', jy:'0', jz:'2*exp(-(x^2+y^2)/0.09)',
    lc:[0, 0], z0:0, R:0.8 }
];
const EM_J_HALF = 2.6, EM_J_N = 32;

/* ---- the reader's current, compiled, sampled and cached ------------------- */
function emjEnter(st, o){
  const P = EM_J_PRESETS[0];
  st.jkey = o.jkey || P.k;
  const D = EM_J_PRESETS.find(p => p.k === st.jkey) || P;
  st.jx = o.jx || D.jx; st.jy = o.jy || D.jy; st.jz = o.jz || D.jz;
  st.z0 = o.z0 === undefined ? D.z0 : o.z0;
}
function emjKey(st){ return st.jx + '' + st.jy + '' + st.jz; }
function emjFns(st){
  if(st._jfk !== emjKey(st)){
    st._jfk = emjKey(st);
    st._jfd = [pkCompile(st.jx, () => 0), pkCompile(st.jy, () => 0), pkCompile(st.jz, () => 0)];
  }
  return st._jfd;
}
/* The cell decomposition. Keyed on the three formulae alone — it is a property
   of the current, not of where the surface or the loop happens to be, and
   rebuilding it on a drag would cost 30 ms a frame for no change at all. */
function emjGrid(st){
  if(st._jgk !== emjKey(st)){
    st._jgk = emjKey(st);
    const F = emjFns(st);
    st._jgd = emCellGridV(F[0], F[1], F[2], EM_J_HALF, EM_J_N);
  }
  return st._jgd;
}
/* Whether the typed current could flow at all, by the two independent tests it
   can fail: charge piling up at a point (∇·J ≠ 0) and current running in one
   wall of the box and out of the other (a gross leak), which a purely local
   test cannot see because ∇·J is zero everywhere along such a current. */
function emjSteady(st){
  if(st._jsk !== emjKey(st)){
    st._jsk = emjKey(st);
    const F = emjFns(st);
    /* 9 samples a side, not 5: the panel prints the largest |J| it saw beside
       the largest |∇·J|, and a coarse lattice can miss the peak of a compact
       source by a factor of three, which makes the comparison meaningless. */
    st._jsd = { div:emJDivMax(F[0], F[1], F[2], 2.2, 9),
                leak:emJBoxLeak(F[0], F[1], F[2], EM_J_HALF, 20) };
  }
  return st._jsd;
}
/* The strongest cell, so a surface can be put through the source and a loop on
   top of it without the reader having to hunt for where they typed it.

   Among cells that are all but tied — a ring is uniform round its whole
   circumference, a wire along its whole length — the one nearest the origin
   wins, or the "surface through the source" lands wherever the scan order
   happened to reach the peak first, which for a wire is the corner of the box. */
function emjPeakCell(G, z0){
  let bm = 0;
  const near = c => (z0 === undefined || Math.abs(c.z - z0) <= G.h * 0.75);
  for(const c of G.cells)
    if(near(c)) bm = Math.max(bm, Math.hypot(c.jx, c.jy, c.jz));
  let best = null, bd = Infinity;
  for(const c of G.cells){
    if(!near(c) || Math.hypot(c.jx, c.jy, c.jz) < 0.98 * bm) continue;
    const d = c.x * c.x + c.y * c.y + c.z * c.z;
    if(d < bd){ bd = d; best = c; }
  }
  return best ? { x:best.x, y:best.y, z:best.z, m:bm } : { x:0, y:0, z:z0 || 0, m:0 };
}

/* ---- the picture: one plane through the current --------------------------
   Everything drawn is a slice at z = z₀, with x across and y up, so the
   out-of-plane direction is +z — towards the reader. J·ẑ is drawn with the ⊙/⊗
   glyphs every textbook uses and the in-plane part as arrows; B is drawn as its
   in-plane arrows, which is the whole of B for a current lying in the plane.

   Each B arrow is a sum over every cell, so the lattice is cached against the
   formulae and the slice: a drag moves the surface, not the field. */
function emjSlice(st){
  const key = emjKey(st) + '|' + fmtNum(st.z0 || 0, 5);
  if(st._slk === key) return st._sld;
  st._slk = key;
  const G = emjGrid(st), F = emjFns(st), z0 = st.z0 || 0;
  const M = 15, ext = 2.3, pts = [];
  let bmax = 1e-30, jmax = 1e-30, jpmax = 1e-30, bsum = 0, gsum = 0;
  for(let i = 0; i < M; i++) for(let j = 0; j < M; j++){
    const x = -ext + 2 * ext * i / (M - 1), y = -ext + 2 * ext * j / (M - 1);
    const B = emCellsB(G, x, y, z0);
    const jx = F[0](x, y, z0), jy = F[1](x, y, z0), jz = F[2](x, y, z0);
    const p = { x, y,
                bx:Number.isFinite(B.x) ? B.x : 0, by:Number.isFinite(B.y) ? B.y : 0,
                jx:Number.isFinite(jx) ? jx : 0, jy:Number.isFinite(jy) ? jy : 0,
                jz:Number.isFinite(jz) ? jz : 0 };
    bmax = Math.max(bmax, Math.hypot(p.bx, p.by));
    jmax = Math.max(jmax, Math.abs(p.jz));
    jpmax = Math.max(jpmax, Math.hypot(p.jx, p.jy));
    /* How much field is left once the elements have cancelled: Σ|ΣdB| over the
       lattice against Σ Σ|dB| on the same points. Without it a current that
       produces no field at all still draws a full set of arrows, because they
       are scaled to their own maximum — a picture of amplified round-off, which
       is a lie the numbers underneath would not tell.

       Summed over the lattice rather than taken at the strongest point: the
       maximum is by construction where the residue is worst, and reading the
       ratio there called a field 1400× too weak to exist "one part in eighty".
       Every third point, because it is a ratio of averages and the cost is a
       second pass over every cell. */
    if(i % 3 === 0 && j % 3 === 0){
      bsum += Math.hypot(Number.isFinite(B.x) ? B.x : 0, Number.isFinite(B.y) ? B.y : 0,
                         Number.isFinite(B.z) ? B.z : 0);
      gsum += emCellsBGross(G, x, y, z0);
    }
    pts.push(p);
  }
  st._sld = { pts, bmax, jmax, jpmax, ext, z0, bgross:gsum,
              cancel:gsum > 1e-30 ? bsum / gsum : 1 };
  return st._sld;
}
function emjDrawSlice(st, ctx, V){
  const S = emjSlice(st);
  const faint = S.cancel < 1e-2 ? 0.3 : 1;      // nearly all cancellation: say so, don't draw it bold
  for(const p of S.pts){
    const [sx, sy] = V.toS(p.x, p.y);
    if(Math.abs(p.jz) > 0.06 * S.jmax)
      emDrawPerp(ctx, sx, sy, p.jz, S.jmax, rgbCss(TH.warn), rgbCss(TH.warn, 0.85));
    const jp = Math.hypot(p.jx, p.jy);
    if(jp > 0.08 * S.jpmax && S.jpmax > 1e-12){
      const L = 9 + 11 * Math.pow(jp / S.jpmax, 0.6);
      emDrawArrow(ctx, sx, sy, sx + p.jx / jp * L, sy - p.jy / jp * L, rgbCss(TH.warn, 0.9), 1.8, 7);
    }
    /* B gets its own colour rather than the field-line red of the preset
       panels: on these two stages the pos/neg pair is already spoken for by
       B·n̂ and B·T̂ on the surface, and an inward rim arrow drawn in the same
       colour as the lattice behind it is unreadable. */
    const b = Math.hypot(p.bx, p.by);
    if(b > 0.035 * S.bmax && S.bmax > 1e-12){
      const L = 5 + 14 * Math.pow(b / S.bmax, 0.55);
      emDrawArrow(ctx, sx, sy, sx + p.bx / b * L, sy - p.by / b * L,
                  rgbCss(TH.grad, 0.8 * faint), 1.3, 6);
    }
  }
  return S;
}
/* the one sentence the picture owes the reader when there is no field in it */
function emjDrawResidueNote(st, ctx, W, H){
  const S = emjSlice(st);
  if(S.cancel >= 1e-2) return S;
  ctText(ctx, W / 2, H - 28,
         'no field to speak of — |B| is 1 part in ' + fmtNum(1 / Math.max(1e-30, S.cancel), 3) +
         ' of the elements’ own sum',
         rgbCss(TH.warn), '600 11.5px ' + FONT_UI, 'center', 'bottom');
  return S;
}
/* the control block both stages share */
function emjBoxes(pre, st, help){
  return ctSeg(pre + 'P', st.jkey, EM_J_PRESETS.map(p => [p.k, p.label])) +
    fnHtml(pre + 'Jx', 'Jx(x, y, z) =', st.jx, 'x, y and z') +
    fnHtml(pre + 'Jy', 'Jy(x, y, z) =', st.jy, 'x, y and z') +
    fnHtml(pre + 'Jz', 'Jz(x, y, z) =', st.jz, 'x, y and z') +
    (help || '');
}
function emjWireBoxes(pre, after){
  ctWireSeg(pre + 'P', v => {
    const P = EM_J_PRESETS.find(p => p.k === v);
    if(!P) return;
    ST.jkey = P.k; ST.jx = P.jx; ST.jy = P.jy; ST.jz = P.jz; ST.z0 = P.z0;
    if(after) after(P);
  });
  const edit = () => { ST.jkey = 'own'; if(after) after(null); };
  fnWire(pre + 'Jx', (m, s) => { ST.jx = s; edit(); });
  fnWire(pre + 'Jy', (m, s) => { ST.jy = s; edit(); });
  fnWire(pre + 'Jz', (m, s) => { ST.jz = s; edit(); });
}
/* what the reader typed, echoed as one line of real notation */
function emjPrettyJ(st){
  return 'J = (' + pkPretty(st.jx) + ',  ' + pkPretty(st.jy) + ',  ' + pkPretty(st.jz) + ')';
}
/* fmtNum, not toExponential: it typesets 1.3×10⁻¹⁶ properly, and half the
   numbers on these panels are that small. The guard is for a formula that
   parsed but evaluates nowhere.

   emjE is for the quantities that are meant to come out small — a flux, a gap,
   a ratio — and it exists because fmtNum's `sig` counts SIGNIFICANT FIGURES
   above 1 and DECIMAL PLACES below it. A flux of 0.0032 asked for to two
   figures therefore came back as the string "0", which is not a rounding of the
   answer but a different answer, and it reached the canvas heading. Below 1 the
   place count has to be raised by the number of leading zeros. */
const emjN = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 5 : d) : 'not defined there');
function emjE(v, sig){
  if(!Number.isFinite(v)) return 'not defined there';
  const n = sig || 3, a = Math.abs(v);
  if(a === 0) return '0';
  if(a < 1e-4 || a >= 1e6) return fmtNum(v, n);        // fmtNum's own ×10ⁿ branch
  const lead = Math.floor(Math.log10(a)) + 1;
  return fmtNum(v, lead >= 1 ? n : n - lead);
}
/* A ratio of two numbers that are both meant to be small is not a measurement.
   Where the parts are individually zero there was nothing to cancel, and the
   panel says so rather than printing a ratio of 1 and calling it a failure. */
function emjRatio(num, den, floor){
  if(!(den > (floor === undefined ? 1e-13 : floor))) return null;
  return Math.abs(num) / den;
}
/* the steadiness verdict, in one sentence, for whichever stage asks */
function emjSteadyWord(st){
  const S = emjSteady(st), G = emjGrid(st);
  const leaky = S.leak.gross > 1e-3 * Math.max(1e-12, G.peak * G.h * G.h);
  const piling = S.div.rel > 1e-3;
  if(piling) return { ok:false, why:'charge is piling up: ∇·J reaches ' + emjN(S.div.worst, 4) +
                                    ' where |J| is at most ' + emjN(S.div.scale, 4) };
  if(leaky) return { ok:false, why:'the current does not close inside the box — ' +
                                   emjN(S.leak.gross, 4) + ' of it crosses the walls' };
  return { ok:true, why:'divergence-free to ' + emjE(S.div.rel) + ', and none of it crosses the walls of the box' };
}

/* ============================================================================
   #38 · ∮B·dA = 0 for a current the reader wrote
   ============================================================================ */
STAGES.emGaussB.enterOwn = function(st, o){
  emjEnter(st, o);
  st.c = { x:o.cx === undefined ? 0.6 : o.cx, y:o.cy === undefined ? 0.35 : o.cy, z:0 };
  st.R = o.R || 1.0;
};
STAGES.emGaussB.fluxOf = function(st){
  const key = emjKey(st) + '|' + fmtNum(st.c.x, 5) + '|' + fmtNum(st.c.y, 5) + '|' + fmtNum(st.R, 5);
  if(st._fbk === key) return st._fbd;
  st._fbk = key;
  const G = emjGrid(st);
  const F = emCellFluxB(G, st.c.x, st.c.y, 0, st.R, 5, 10);
  const dp = emCellDivParts(G, st.c.x, st.c.y, 0, 'B');
  /* "the three parts cancelled" is only a claim where the parts existed. On a
     symmetry — the middle of a ring, the axis of a solenoid — each ∂Bᵢ/∂xᵢ is
     separately zero and their ratio to the sum is 1, which would read as a total
     failure of a cancellation that was never asked for. The threshold has to be
     relative to the field: |B|/h is the largest derivative this grid can carry,
     so a thousandth of that is comfortably below anything real and far above the
     1e-16 of an exact zero. */
  const Bc = emCellsB(G, st.c.x, st.c.y, 0);
  const floor = 1e-3 * Math.hypot(Bc.x, Bc.y, Bc.z) / G.h;
  const rim = [];
  for(let i = 0; i < 28; i++){
    const a = (i + 0.5) / 28 * 2 * Math.PI;
    const nx = Math.cos(a), ny = Math.sin(a);
    const B = emCellsB(G, st.c.x + st.R * nx, st.c.y + st.R * ny, 0);
    rim.push({ a, d:B.x * nx + B.y * ny });
  }
  st._fbd = { flux:F.flux, gross:F.gross, mean:F.mean, rim, cells:G.cells.length,
              rel:emjRatio(F.flux, F.gross), div:dp.div, parts:dp.parts, dgross:dp.gross,
              drel:emjRatio(dp.div, dp.gross, Math.max(1e-13, floor)) };
  return st._fbd;
};
/* Four surfaces, chosen to be four different questions rather than four sizes:
   the reader's own, one round everything, one small enough to sit inside the
   source with the current running through its wall, and one at an angle to
   every symmetry the scenario has — because a mesh that is symmetric about the
   same axis as the field can return zero for reasons that are about the mesh. */
STAGES.emGaussB.sweepOf = function(st){
  if(st._mwk === emjKey(st)) return st._mwd;
  st._mwk = emjKey(st);
  const G = emjGrid(st), P = emjPeakCell(G);
  st._mwd = emMonopoleSweep(G, [
    { x:0, y:0, z:0, R:1.7 },
    { x:P.x, y:P.y, z:P.z, R:Math.max(0.3, 2.6 * G.h), cuts:true },
    { x:0.55, y:0.45, z:0.3, R:0.95 },
    { x:0, y:0, z:0, R:0.55 }
  ]);
  return st._mwd;
};
STAGES.emGaussB.controlsOwn = function(){
  const st = ST;
  return emjBoxes('gbJ', st) +
    ctlRow('surface R', ctlSlider('gbRo', 0.25, 2.4, 0.05, st.R)) +
    `<p class="help"><b>Drag the surface anywhere</b>, including straight through the current. Nothing
    here is a dipole formula with ∇·B = 0 built into it: B is Biot–Savart integrated over your J, and
    the flux is that field summed over the sphere. The panel prints the net flux beside the
    <b>gross</b> — ∮|B·n̂|dA, how much crosses the surface in each direction before the cancellation —
    because a net of 10⁻¹⁶ means nothing until you know what it cancelled.</p>
    <p class="help">Try a current that could not flow. <b>Charge streaming outwards</b> has ∇·J ≠ 0, so
    it is piling charge up at every point and cannot be steady; a <b>wire crossing the box</b> never
    closes. The flux is still zero for both, because B is a curl whatever J is, and div curl = 0 is an
    identity rather than a law about currents.</p>`;
};
STAGES.emGaussB.wireOwn = function(){
  emjWireBoxes('gbJ', () => {});
  wireSlider('gbRo', () => ST.R, v => { ST.R = v; }, v => (+v).toFixed(2));
};
STAGES.emGaussB.frameOwn = function(st, dt, ctx, W, H){
  const V = emView(st, W, H, 2.6);
  const S = emjDrawSlice(st, ctx, V);
  const D = STAGES.emGaussB.fluxOf(st);
  const [cx, cy] = V.toS(st.c.x, st.c.y), rr = st.R * V.sc;
  ctx.setLineDash([6, 5]); ctx.lineWidth = 2.2; ctx.strokeStyle = rgbCss(TH.mid);
  ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  /* Scaled against the lattice behind them, not against their own largest:
     normalising a set of arrows to itself makes numerical residue look like a
     field, which is exactly the case this stage invites the reader to create. */
  const al = S.cancel < 1e-2 ? 0.4 : 1;
  const scale = Math.max(1e-14, 0.5 * S.bmax, ...D.rim.map(r => Math.abs(r.d)));
  for(const r of D.rim){
    if(!Number.isFinite(r.d) || Math.abs(r.d) < 1e-15) continue;
    const nx = Math.cos(r.a), ny = Math.sin(r.a);
    const L = Math.sign(r.d) * Math.pow(Math.min(1, Math.abs(r.d) / scale), 0.55) * 24;
    const [sx, sy] = V.toS(st.c.x + st.R * nx, st.c.y + st.R * ny);
    emDrawArrow(ctx, sx, sy, sx + nx * L, sy - ny * L,
                r.d > 0 ? rgbCss(TH.pos, al) : rgbCss(TH.neg, al), 1.6, 7);
  }
  emjDrawResidueNote(st, ctx, W, H);
  ctText(ctx, W / 2, 12, 'as much B leaves as arrives — on every surface, for every current',
         rgbCss(TH.dim), '600 12px ' + FONT_UI, 'center', 'top');
  ctText(ctx, W / 2, 30, '∮B·dA = ' + emjE(D.flux, 2) + '   against a gross flux of ' + emjN(D.gross, 4),
         rgbCss(TH.text), '600 13px ' + FONT_UI, 'center', 'top');
  stageNote(ctx, 'B is a curl, and a curl has no divergence — there is no current anyone can write that gives this integral anything but zero', W, H);
  if(S.jmax < 1e-12 && S.jpmax < 1e-12)
    ctText(ctx, W / 2, H / 2, 'no current in this plane — try another slice or another formula',
           rgbCss(TH.faint), '600 12px ' + FONT_UI, 'center', 'middle');
};
STAGES.emGaussB.readoutOwn = function(st){
  const D = STAGES.emGaussB.fluxOf(st), M = STAGES.emGaussB.sweepOf(st);
  const S = emjSteady(st), V = emjSteadyWord(st), SL = emjSlice(st);
  const dead = D.gross < 1e-9 * Math.max(1e-12, D.mean * st.R * st.R);
  return `<div class="card tight"><div class="ttl">Your current, surface at (${fmtNum(st.c.x, 2)}, ${fmtNum(st.c.y, 2)}), R = ${fmtNum(st.R, 2)}</div>
    ${kv('J(x, y, z)', emjPrettyJ(st))}
    ${kv('∮B·dA, from the integrated field', '<b>' + emjE(D.flux, 3) + '</b>')}
    ${kv('∮|B·n̂|dA — what it cancelled', emjN(D.gross, 5))}
    ${kv('net as a fraction of gross', D.rel === null ? 'no field crosses this surface at all' : emjE(D.rel, 2))}
    ${kv('mean |B| on the surface', emjN(D.mean, 5))}
    ${kv('|B| against the elements’ own sum', emjE(SL.cancel) +
      (SL.cancel < 1e-2 ? ' — the field itself is almost all cancellation' : ''))}
    ${kv('cells carrying your current', String(D.cells))}
    <p class="help">${dead || SL.cancel < 1e-2
      ? 'This current produces essentially no magnetic field anywhere, and the second-to-last row is how that is known: every element contributes, and the contributions annihilate to a part in ' + fmtNum(1 / Math.max(1e-30, SL.cancel), 3) + '. That is a fact about your J rather than about the law — and the Ampère panel is where it turns into a contradiction.'
      : 'The gross is what makes the net worth printing. Field crosses this surface in both directions in quantity, and the two amounts agree to the accuracy of the mesh. Drag the surface <b>through</b> the current and it still holds. Do that on the electric panel next door and the answer changes, because there the flux counts what is inside; here there is nothing for it to count.'}</p>
  </div>
  <div class="card tight"><div class="ttl">The differential form, at the centre</div>
    ${kv('∂Bx/∂x, ∂By/∂y, ∂Bz/∂z', D.parts.map(p => emjN(p, 4)).join(',  '))}
    ${kv('their magnitudes add to', emjN(D.dgross, 5))}
    ${kv('∇·B — their signed sum', '<b>' + emjE(D.div, 3) + '</b>')}
    ${kv('the cancellation, as a ratio', D.drel === null ? 'nothing to cancel here — B is stationary in all three directions' : emjE(D.drel, 2))}
    <p class="help">∇·B is three numbers added together, and printing only the total would look the
    same whether they cancelled or were never computed. Each of them is a real derivative of a field
    integrated from your J, and they sum to nothing. Any residue is the difference stencil: its step
    cannot go below the cell size without measuring the grid instead of the field, so where B turns
    over within a couple of cells the cancellation shows at the percent level and is exact — 10⁻¹⁶ —
    wherever the field is smooth on that scale.</p>
  </div>
  <div class="card tight"><div class="ttl">Four surfaces, four different questions</div>
    ${M.rows.map((r, i) => kv(
      (i === 1 ? 'through the source' : i === 2 ? 'off every axis' : 'R = ' + fmtNum(r.R, 2)) +
      ' at (' + fmtNum(r.x, 2) + ', ' + fmtNum(r.y, 2) + ', ' + fmtNum(r.z, 2) + ')',
      'net ' + emjE(r.flux, 2) + ',  gross ' + emjN(r.gross, 4) + ',  |B| ≈ ' + emjN(r.meanB, 4))).join('')}
    ${kv('worst net/gross of the four', emjE(M.worst, 2))}
    <p class="help">The second sits inside the source with your current running through its wall — the
    case a list of wires and magnets cannot pose. The third is centred off every symmetry the scenario
    has, which matters: a surface sharing the field's own axis can return zero for reasons that belong
    to the mesh rather than to the physics, and that one cannot.</p>
  </div>
  <div class="card tight"><div class="ttl">Could this current even flow?</div>
    ${kv('largest |∇·J| found', emjN(S.div.worst, 5) + ',  where |J| reaches ' + emjN(S.div.scale, 4))}
    ${kv('current crossing the walls of the box', emjN(S.leak.gross, 5) + ' gross,  ' + emjE(S.leak.net, 2) + ' net')}
    ${kv('so, steady?', V.ok ? '✓ yes — ' + V.why : '✗ no — ' + V.why)}
    ${kv('and the flux is still', emjE(D.flux, 2))}
    <p class="help">This is the point. A charge density decides the electric flux, so Gauss's law for E
    has something on the right-hand side to compute. Nothing about J appears on the right of ∮B·dA = 0
    — not its size, not its shape, not even whether it is a current that could exist. Write one that
    piles charge up at every point, or one that runs out through the wall, and the flux is zero to the
    same accuracy. Magnetic field lines have no ends because B = ∇×A, and ∇·(∇×A) = 0 is an identity
    of the calculus, not a fact about magnets.</p>
  </div>`;
};

STAGES.emGaussB.chipOwn = function(st){
  const D = STAGES.emGaussB.fluxOf(st);
  return `<div class="k">your current</div><div style="color:var(--c-neg)">Φ_B = ${emjE(D.flux, 2)}</div>
    <div>gross ${emjN(D.gross, 3)}</div>`;
};
STAGES.emGaussB.legendOwn = function(){
  return [['var(--c-warn)', 'your J — ⊙ out of the plane, ⊗ into it'],
          ['var(--c-grad)', 'B in the plane, integrated from it'],
          ['var(--c-pos)', 'B·n̂ outward on the surface'],
          ['var(--c-neg)', 'B·n̂ inward — and the two cancel exactly'],
          ['var(--mid)', 'the surface — drag it, even through the current']];
};
STAGES.emGaussB.deriveOwn = function(st){
  const D = STAGES.emGaussB.fluxOf(st), M = STAGES.emGaussB.sweepOf(st);
  const V = emjSteadyWord(st);
  return {
    title:'The law with nothing on its right-hand side',
    steps:[
      drvSay('the usual demonstration is circular, and worth admitting',
        'The magnet on the preset panel is a point dipole, and a point dipole\'s field is a closed formula whose divergence is zero by construction. Integrating it over a surface and finding zero tests the surface mesh. It cannot test the law, because the law was assumed before the integral began.'),
      drvStep('so start from a current instead, and integrate Biot–Savart over it',
        `${dv('B')}(${dv('p')}) ${dop('=')} ${dfrac('1', '4π')} ∫ ${dv('J')}(${dv('r')}′) ${dop('×')} ${dfrac(dv('p') + '−' + dv('r') + '′', '|' + dv('p') + '−' + dv('r') + '′|³')} d³${dv('r')}′`,
        emjPrettyJ(st) + ' — sampled onto ' + D.cells + ' cells'),
      drvStep('that integral is a curl, whatever J is',
        `${dv('B')} ${dop('=')} ∇${dop('×')}${dv('A')}, ${dv('A')}(${dv('p')}) ${dop('=')} ${dfrac('1', '4π')} ∫ ${dfrac(dv('J') + '(' + dv('r') + '′)', '|' + dv('p') + '−' + dv('r') + '′|')} d³${dv('r')}′`,
        'the 1/|p−r′|³ kernel with the cross product is exactly ∇ of the 1/|p−r′| one'),
      drvSay('and the divergence of a curl is zero as an identity',
        'Not as a law about magnets, not as an experimental fact, and not because of anything the current does — ∇·(∇×A) = 0 is d∘d = 0 from the differential-forms wing, true for any A that can be differentiated twice. Every magnetic field is the curl of something, so no magnetic field has sources, and there is nothing to arrange.'),
      drvStep('the flux, over a surface put wherever you like',
        `∯ ${dv('B')} ${dop('·')} d${dv('A')} ${dop('=')} ${dv('R')}² ∫dΩ ${dv('B')}(${dv('c')} ${dop('+')} ${dv('R')}n̂) ${dop('·')} n̂`,
        emjE(D.flux, 3) + ' — against a gross flux of ' + emjN(D.gross, 4)),
      drvSay('the gross is what makes the net worth reading',
        'A net of 10⁻¹⁶ proves nothing on its own; a routine that computed nothing at all would print the same. The gross flux is how much field crosses the surface in each direction before the two amounts cancel, and it is a number of order one. Zero out of that is a measurement.'),
      drvStep('the pointwise form, as three derivatives that cancel',
        `∇${dop('·')}${dv('B')} ${dop('=')} ${dfrac('∂B_x', '∂x')} ${dop('+')} ${dfrac('∂B_y', '∂y')} ${dop('+')} ${dfrac('∂B_z', '∂z')}`,
        'the three are ' + D.parts.map(p => emjN(p, 3)).join(', ') + ' and they sum to ' + emjE(D.div, 2)),
      drvStep('and on four surfaces at once, one of them through the source',
        `∯ ${dv('B')} ${dop('·')} d${dv('A')} ${dop('=')} 0 everywhere`,
        'worst net/gross of the four: ' + emjE(M.worst, 2)),
      drvSay('now try to break it, which is the part a preset cannot offer',
        'Type a current that could not flow. Charge streaming radially outwards piles charge up at every point, so it is not a steady current at all; a wire crossing the box never closes on itself. Both are physically impossible and both give exactly zero flux, because the identity never asked whether J was a current — only that it was a vector field. Your J: ' + V.why + '.'),
      drvSay('which is why finding one monopole would be worth a Nobel prize',
        'Gauss\'s law for E has ρ on the right, so the flux is whatever the charge inside happens to be. The magnetic version has nothing there. Dirac showed in 1931 that a single monopole anywhere in the universe would force electric charge to be quantised in exact multiples — which it observably is — so the argument for their existence is much better than the evidence, which after ninety years of searching remains none at all.')
    ],
    note:'Nothing on this panel is a dipole formula. The field is Biot–Savart integrated over a current you wrote, the flux is that field summed over a surface you dragged, and the divergence is a finite difference of it. The zero survives currents that could not physically flow, which is the strongest form the statement has.'
  };
};

/* ============================================================================
   #39 · ∮B·dl against the current threading the loop, for a typed J
   ============================================================================ */
STAGES.emAmpere.enterOwn = function(st, o){
  emjEnter(st, o);
  const D = EM_J_PRESETS.find(p => p.k === st.jkey) || EM_J_PRESETS[0];
  st.lc = { x:o.lx === undefined ? D.lc[0] : o.lx, y:o.ly === undefined ? D.lc[1] : o.ly };
  st.R = o.R || D.R || 0.8;
};
STAGES.emAmpere.loopOf = function(st){
  const key = emjKey(st) + '|' + fmtNum(st.lc.x, 5) + '|' + fmtNum(st.lc.y, 5) + '|' +
              fmtNum(st.R, 5) + '|' + fmtNum(st.z0 || 0, 5);
  if(st._lok === key) return st._lod;
  st._lok = key;
  const G = emjGrid(st), F = emjFns(st);
  const c = v3(st.lc.x, st.lc.y, st.z0 || 0), nh = v3(0, 0, 1);
  const circ = emCellCircB(G, c, st.R, nh, 96);
  const I = emJThread(F[0], F[1], F[2], c, st.R, nh, 20);
  /* B·T̂ round the path, which is what the circulation is made of */
  const rim = [];
  let mag = 0;
  for(let i = 0; i < 24; i++){
    const a = (i + 0.5) / 24 * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a);
    const B = emCellsB(G, c.x + st.R * ca, c.y + st.R * sa, c.z);
    rim.push({ a, d:-B.x * sa + B.y * ca });
    mag += Math.hypot(B.x, B.y, B.z);
  }
  st._lod = { circ, I, gap:Math.abs(circ - I),
              rel:emjRatio(circ - I, Math.abs(I), 1e-12), rim, meanB:mag / 24,
              cells:G.cells.length };
  return st._lod;
};
STAGES.emAmpere.sweepOf = function(st){
  const key = emjKey(st) + '|' + fmtNum(st.lc.x, 5) + '|' + fmtNum(st.lc.y, 5) + '|' + fmtNum(st.z0 || 0, 5);
  if(st._aswk === key) return st._aswd;
  st._aswk = key;
  const G = emjGrid(st), F = emjFns(st);
  st._aswd = emAmpereSweep(G, F[0], F[1], F[2], v3(st.lc.x, st.lc.y, st.z0 || 0), v3(0, 0, 1),
                           [0.5, 0.8, 1.15, 1.5]);
  return st._aswd;
};
STAGES.emAmpere.controlsOwn = function(){
  const st = ST;
  return emjBoxes('eaJ', st) +
    ctlRow('slice z', ctlSlider('eaZ0', -1.2, 1.2, 0.05, st.z0 || 0)) +
    ctlRow('loop radius', ctlSlider('eaRo', 0.25, 2.2, 0.05, st.R)) +
    ctlRow('', ctBtn('eaSnap', 'put the loop on the strongest current')) +
    `<p class="help"><b>Drag the loop anywhere</b> in the plane. The circulation ∮B·dl is summed from a
    field integrated over your J; the current threading the disc is a second integral of the same J
    over the flat disc inside the loop. They share no node and no line of code, and Stokes's theorem
    is the reason they should agree at all.</p>
    <p class="help">Then break it. <b>Charge streaming outwards</b> is spherically symmetric, so it
    produces <b>no magnetic field whatsoever</b> — and at a slice above the middle it still pushes
    current through the disc. The circulation is zero and the enclosed current is not, on the same
    loop. That is not a small error in Ampère's law; it is the law contradicting itself, and the
    displacement current is what Maxwell added to repair it.</p>`;
};
STAGES.emAmpere.wireOwn = function(){
  emjWireBoxes('eaJ', P => { if(P){ ST.lc = { x:P.lc[0], y:P.lc[1] }; ST.R = P.R || 0.8; } });
  wireSlider('eaZ0', () => ST.z0 || 0, v => { ST.z0 = v; }, v => (+v).toFixed(2));
  wireSlider('eaRo', () => ST.R, v => { ST.R = v; }, v => (+v).toFixed(2));
  const b = $('eaSnap');
  if(b) b.addEventListener('click', () => {
    const P = emjPeakCell(emjGrid(ST), ST.z0 || 0);
    ST.lc = { x:P.x, y:P.y };
    refreshStageReadout(); updateStageChip();
  });
};
STAGES.emAmpere.frameOwn = function(st, dt, ctx, W, H){
  const V = emView(st, W, H, 2.6);
  const S = emjDrawSlice(st, ctx, V);
  const D = STAGES.emAmpere.loopOf(st);
  const [cx, cy] = V.toS(st.lc.x, st.lc.y), rr = st.R * V.sc;
  ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4; ctx.setLineDash([7, 4]);
  ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  /* Against the lattice, and against what the enclosed current calls for: a
     loop whose circulation is zero must not be ringed with full-length arrows
     because the largest of them happened to be the largest. */
  const al = S.cancel < 1e-2 ? 0.4 : 1;
  const scale = Math.max(1e-14, 0.5 * S.bmax, ...D.rim.map(r => Math.abs(r.d)));
  for(const r of D.rim){
    if(!Number.isFinite(r.d) || Math.abs(r.d) < 1e-15) continue;
    const ca = Math.cos(r.a), sa = Math.sin(r.a);
    const tx = -sa, ty = ca;
    const L = Math.sign(r.d) * Math.pow(Math.min(1, Math.abs(r.d) / scale), 0.55) * 22;
    const [sx, sy] = V.toS(st.lc.x + st.R * ca, st.lc.y + st.R * sa);
    emDrawArrow(ctx, sx, sy, sx + tx * L, sy - ty * L,
                r.d > 0 ? rgbCss(TH.pos, al) : rgbCss(TH.neg, al), 1.6, 7);
  }
  emjDrawResidueNote(st, ctx, W, H);
  ctText(ctx, W / 2, 12, 'the circulation of B round the loop, against the current through the disc',
         rgbCss(TH.dim), '600 12px ' + FONT_UI, 'center', 'top');
  ctText(ctx, W / 2, 30, '∮B·dl = ' + emjN(D.circ, 5) + '    I through the disc = ' + emjN(D.I, 5),
         rgbCss(TH.text), '600 13px ' + FONT_UI, 'center', 'top');
  const V2 = emjSteadyWord(st);
  if(!V2.ok && Math.abs(D.I) > 1e-6)
    ctText(ctx, W / 2, 48, 'this current cannot be steady — and the two numbers no longer match',
           rgbCss(TH.warn), '600 11.5px ' + FONT_UI, 'center', 'top');
  stageNote(ctx, 'slice z = ' + fmtNum(st.z0 || 0, 2) + ' — ⊙ and ⊗ are your current through this plane, thin arrows are B in it', W, H);
  if(S.jmax < 1e-12 && S.jpmax < 1e-12)
    ctText(ctx, W / 2, H / 2, 'no current in this plane — move the slice or change the formula',
           rgbCss(TH.faint), '600 12px ' + FONT_UI, 'center', 'middle');
};
STAGES.emAmpere.readoutOwn = function(st){
  const D = STAGES.emAmpere.loopOf(st), W = STAGES.emAmpere.sweepOf(st);
  const S = emjSteady(st), V = emjSteadyWord(st), SL = emjSlice(st);
  const broken = !V.ok && Math.abs(D.I) > 1e-6 &&
                 Math.abs(D.circ - D.I) > 0.2 * Math.abs(D.I);
  const owed = V.ok ? 'Neither side knows about the other: one is a line integral of a field built from Biot–Savart, the other a surface integral of the density you typed. Stokes\'s theorem is what makes their agreement a theorem rather than a coincidence.'
    : broken ? 'These two are supposed to be the same number and they are not. Nothing has gone wrong with the arithmetic — Ampère\'s law in this form is simply false for a current that is not divergence-free, and the card below says which way yours fails.'
    : 'They are close, but nothing guarantees it: your current is not one that could flow, and the card below says why. Grow the loop and watch the gap open — the shortfall is not a numerical error, it is the law losing its hypothesis.';
  return `<div class="card tight"><div class="ttl">Loop at (${fmtNum(st.lc.x, 2)}, ${fmtNum(st.lc.y, 2)}) in the plane z = ${fmtNum(st.z0 || 0, 2)}, R = ${fmtNum(st.R, 2)}</div>
    ${kv('J(x, y, z)', emjPrettyJ(st))}
    ${kv('∮B·dl, from the integrated field', '<b>' + emjN(D.circ, 6) + '</b>')}
    ${kv('I through the disc, by its own quadrature', '<b>' + emjN(D.I, 6) + '</b>')}
    ${kv('difference', emjE(D.gap, 3) + (D.rel === null ? '' : '  (' + emjN(100 * D.rel, 3) + '%)'))}
    ${kv('mean |B| on the path', emjN(D.meanB, 5))}
    ${kv('|B| against the elements’ own sum', emjE(SL.cancel) +
      (SL.cancel < 1e-2 ? ' — there is no field here to circulate' : ''))}
    <p class="help">${owed}</p>
  </div>
  <div class="card tight"><div class="ttl">Grow the loop — the invariance, swept</div>
    ${W.rows.map(r => kv('R = ' + fmtNum(r.R, 2),
      '∮B·dl = ' + emjN(r.circ, 5) + ',  I = ' + emjN(r.I, 5) + ',  |B| ≈ ' + emjN(r.meanB, 4))).join('')}
    ${kv('spread once the current is all inside', Number.isFinite(W.spread) ? emjE(W.spread, 2) : 'the loop never encloses it all')}
    ${kv('range of |B| over those same radii', Number.isFinite(W.bRange) ? emjN(W.bRange, 3) + '×' : '—')}
    <p class="help">While the loop is still swallowing the current, the circulation climbs with it.
    Once the whole of it is threaded the circulation stops moving even though the field on the path
    keeps falling — and that is the entire content of the law. A single loop could never show it;
    it takes the sweep, and the two columns moving differently is the point.</p>
  </div>
  <div class="card tight"><div class="ttl">Whether Ampère's law is entitled to hold here</div>
    ${kv('largest |∇·J| found', emjN(S.div.worst, 5) + ',  where |J| reaches ' + emjN(S.div.scale, 4))}
    ${kv('current crossing the walls of the box', emjN(S.leak.gross, 5) + ' gross,  ' + emjE(S.leak.net, 2) + ' net')}
    ${kv('so, steady?', V.ok ? '✓ yes — ' + V.why : '✗ no — ' + V.why)}
    <p class="help">∮B·dl = I_enc follows from Stokes's theorem only if the current through <i>every</i>
    surface with the same rim is the same, and that is exactly the condition ∇·J = 0. Radial flow
    fails it pointwise, by piling charge up; a current that runs out through the wall of the box fails
    it globally, while looking perfectly divergence-free at every interior point. Maxwell's repair is
    to add ε₀∂E/∂t, whose divergence is precisely −∇·J by Gauss's law, so the corrected right-hand
    side is divergence-free for <b>every</b> current and the surface stops mattering again.</p>
  </div>`;
};
STAGES.emAmpere.chipOwn = function(st){
  const D = STAGES.emAmpere.loopOf(st);
  return `<div class="k">your current</div><div style="color:var(--c-curl)">∮B·dl = ${emjN(D.circ, 4)}</div>
    <div>I through the disc = ${emjN(D.I, 4)}</div>`;
};
STAGES.emAmpere.legendOwn = function(){
  return [['var(--c-warn)', 'your J — ⊙ out of the plane, ⊗ into it'],
          ['var(--c-grad)', 'B in the plane, integrated from it'],
          ['var(--c-curl)', 'the Amperian loop — drag it'],
          ['var(--c-pos)', 'B·T̂ along the traversal'],
          ['var(--c-neg)', 'B·T̂ against it']];
};
STAGES.emAmpere.deriveOwn = function(st){
  const D = STAGES.emAmpere.loopOf(st), W = STAGES.emAmpere.sweepOf(st);
  const S = emjSteady(st), V = emjSteadyWord(st);
  return {
    title:'The law, its condition, and the current that breaks it',
    steps:[
      drvSay('the wire on the preset panel cannot fail this test',
        'Its field is B = I/2πs, put there by hand. Integrating that round a circle of radius s returns I because 2πs cancels 1/2πs, which is arithmetic rather than physics. Nothing about that calculation could come out wrong, so nothing about it is evidence.'),
      drvStep('so integrate the field of your current instead',
        `∮ ${dv('B')} ${dop('·')} d${dv('r')} ${dop('=')} ${dv('R')} ∫₀^{2π} ${dv('B')}(${dv('c')} ${dop('+')} ${dv('R')}ê(θ)) ${dop('·')} T̂(θ) dθ`,
        emjN(D.circ, 6) + ' — from a field summed over ' + D.cells + ' cells of Biot–Savart'),
      drvStep('and integrate the current through the disc, which shares nothing with it',
        `${dv('I')}_enc ${dop('=')} ∬_disc ${dv('J')} ${dop('·')} n̂ d${dv('A')}`,
        emjN(D.I, 6) + ' — apart from the circulation by ' + emjE(D.gap, 2)),
      drvSay('Stokes\'s theorem is the reason those two are the same question',
        'The circulation of a field round a rim equals the flux of its curl through any surface with that rim. Ampère\'s law is that theorem applied to ∇×B = J, and it converts a statement about a loop into one about a surface — the same translation the divergence theorem performs for Gauss\'s law, and the reason Maxwell\'s equations can be written in either form.'),
      drvStep('grow the loop: the circulation stops depending on it',
        `∮ ${dv('B')} ${dop('·')} d${dv('r')} independent of ${dv('R')} once the current is inside`,
        Number.isFinite(W.spread)
          ? 'four radii: spread ' + emjE(W.spread, 2) + ' while |B| on the path changes by ' + emjN(W.bRange, 3) + '×'
          : 'this loop never encloses the whole current — grow it, or move it onto one'),
      drvSay('but the theorem has a condition, and it is not decorative',
        'Any surface with the same rim must catch the same current, or the right-hand side depends on a choice nobody made. That requirement is exactly ∇·J = 0. It holds automatically for a current that flows in closed loops and fails for one that does not — and until Maxwell, nobody had written the law with its condition attached.'),
      drvStep('so measure the divergence of the current you typed',
        `∇${dop('·')}${dv('J')} ${dop('=')} ${dop('−')}${dfrac('∂ρ', '∂t')}`,
        'largest |∇·J| here: ' + emjN(S.div.worst, 5) + ', against |J| up to ' + emjN(S.div.scale, 4)),
      drvSay('and watch the radial current destroy the law rather than dent it',
        'Charge streaming outwards from a point is spherically symmetric, and a spherically symmetric current produces no magnetic field at all — there is no direction for B to point. Yet on any slice above the centre it pushes current through the disc. The circulation is zero, the enclosed current is not, and no amount of care with the quadrature will reconcile them. Your current: ' + V.why + '.'),
      drvStep('the repair, and why its size was never adjustable',
        `∮ ${dv('B')} ${dop('·')} d${dv('r')} ${dop('=')} ${dv('I')}_enc ${dop('+')} ${dfrac('dΦ_E', 'd' + dv('t'))}`,
        'the added term has divergence −∇·J exactly, by Gauss\'s law, so the total is divergence-free for every current'),
      drvSay('which is theory correcting itself, and light falling out of the correction',
        'No experiment demanded the extra term; the effect is far too weak to have been noticed in 1861. Maxwell added it because the equations were inconsistent without it, and the repaired set turned out to permit a self-sustaining disturbance travelling at 1/√(μ₀ε₀) — a number he computed from two bench measurements having nothing to do with optics, and which came out equal to the measured speed of light.')
    ],
    note:'Both sides are quadratures of a current you wrote, computed by routines that share no node and no code. They agree while the current is divergence-free and part company when it is not, by an amount the panel prints — which is the inconsistency the displacement term was invented to remove, arrived at rather than described.'
  };
};
