/* Densities worth starting from. The values are the source strings themselves,
   so choosing one simply assigns it and the box beside them always shows what
   is actually being integrated. */
const EM_RHO_PRESETS = [
  ['2.4*exp(-(x^2+y^2+z^2)/0.22)', 'a blob'],
  ['1.6*exp(-((x-1.1)^2+y^2+z^2)/0.18) - 1.6*exp(-((x+1.1)^2+y^2+z^2)/0.18)', 'a pair'],
  ['2*exp(-(sqrt(x^2+y^2)-1.3)^2/0.05 - z^2/0.05)', 'a ring'],
  ['1.2*exp(-(x^2+y^2)/0.25 - z^2/6)', 'a filament']
];
/* The current densities live beside the two stages that take them, in
   60ib-em-typed-fields.js, because each one carries the surface and the loop
   that make it worth choosing as well as its three components. */

STAGES.emGauss = {
  title: "Gauss's law  ∮E·dA = Q",
  deriveOwn(st){
    const D = STAGES.emGauss.gaussOf(st), S = STAGES.emGauss.sweepOf(st);
    const n = v => (Number.isFinite(v) ? fmtNum(v, 6) : 'not defined here');
    return {
      title:'Gauss\'s law where nothing can be counted',
      steps:[
        drvSay('the usual demonstration has a thumb on the scale',
          'A surface drawn around point charges has its enclosed charge worked out by looking at the list and adding up the ones inside. The flux integral then agrees, and what has been checked is the quadrature. Here the charge is spread out, so both sides have to be integrated, and the surface is allowed to cut straight through the source.'),
        drvStep('the field, by integrating Coulomb\'s law over your density',
          `${dv('E')}(${dv('p')}) ${dop('=')} ${dfrac('1', '4π')} ∫ ρ(${dv('r')}′) ${dfrac(dv('p') + '−' + dv('r') + '′', '|' + dv('p') + '−' + dv('r') + '′|³')} d³${dv('r')}′`,
          `ρ = ${pkPretty(st.rho)}`),
        drvStep('in spherical coordinates about the point itself, the singularity cancels',
          `${dv('E')}(${dv('p')}) ${dop('=')} ${dop('−')}${dfrac('1', '4π')} ∫dΩ n̂ ∫₀^L ρ(${dv('p')} ${dop('+')} ${dv('r')} n̂) d${dv('r')}`,
          'the r² of d³r meets the 1/r² of the kernel — the integrand is bounded even inside the charge'),
        drvSay('which is why this panel can put the surface through the source',
          'That cancellation is not a numerical trick; it is the reason a continuous charge distribution has a finite field inside itself while a point charge does not. It also means every number below survives the surface being dragged into the middle of the blob, where "the charge enclosed" stops being a count and becomes an integral.'),
        drvStep('the enclosed charge, by a second integral in different coordinates',
          `${dv('Q')}_enc ${dop('=')} ∫dΩ ∫₀^${dv('R')} ρ(${dv('c')} ${dop('+')} ${dv('r')} n̂) ${dv('r')}² d${dv('r')}`,
          `${n(D.Q)} of a total ${n(D.Qtot)}`),
        drvStep('and the flux, over the surface, from that field',
          `∯ ${dv('E')} ${dop('·')} d${dv('A')} ${dop('=')} ${dv('R')}² ∫dΩ ${dv('E')}(${dv('c')} ${dop('+')} ${dv('R')}n̂) ${dop('·')} n̂`,
          `${n(D.flux)} — apart from Q_enc by ${fmtAgree(D.flux, D.Q)}`),
        drvStep('the differential form, checked pointwise',
          `∇${dop('·')}${dv('E')} ${dop('=')} ρ`,
          `at the centre: ∇·E = ${n(D.divE)} against ρ = ${n(D.rhoHere)}`),
        drvSay('and that is a different statement from the one above',
          'The integral form is about a region and everything in it; the differential form is about a point. Counting charges can never test the second, because a point charge has infinite density at one place and none anywhere else. With ρ written as a function, the field is differentiated numerically and compared with the density at that very point — and the divergence theorem is what says the two forms had to agree.'),
        drvStep('the invariance, swept rather than sampled',
          `∯ ${dv('E')} ${dop('·')} d${dv('A')} independent of ${dv('R')} once the charge is inside`,
          S ? `four radii: flux spread ${fmtSig(S.spread, 3)} while |E| on the surface changes by ${fmtNum(S.eRange, 3)}×` : ''),
        drvSay('which is the whole content of the law',
          'The field on the surface falls off steeply as it grows, and the area grows just as fast, and the product does not move at all. That exact cancellation is the inverse square and nothing else: with any other exponent the flux would depend on the radius, and Gauss\'s law would be false. Experiments looking for exactly that dependence bound the deviation from 2 to about 10⁻¹⁶, which is really a bound on the photon\'s mass.')
      ],
      note:'Nothing on this panel counts anything. Two independent quadratures over a density you wrote, one surface integral of the field that came out of the first, and a finite difference of it — and they agree to the accuracy of the meshes, which is printed rather than assumed.'
    };
  },
  derive(st){
    if(st.own) return STAGES.emGauss.deriveOwn(st);
    const n = v => fmtNum(v, 6);
    const qIn = st.objs.filter(o => o.kind === 'charge' &&
      Math.hypot(o.p.x - st.c.x, o.p.y - st.c.y, o.p.z - st.c.z) < st.R)
      .reduce((a, o) => a + o.q, 0);
    return {
      title:'Why the flux counts the charge and ignores everything else',
      steps:[
        drvStep('the law',
          `∯ ${dv('E')} ${dop('·')} d${dv('A')} ${dop('=')} ${dfrac(dv('Q') + '_enc', 'ε₀')}`,
          `radius ${n(st.R)}: enclosed charge ${n(qIn)} — the panel integrates the flux over the sphere`),
        drvStep('start from Coulomb, with one charge at the centre',
          `${dv('E')} ${dop('=')} ${dfrac(dv('q'), '4πε₀' + dv('r') + '²')}`,
          'radial, and constant in magnitude over a sphere centred on the charge'),
        drvStep('so the flux is that field times the area',
          `${dfrac(dv('q'), '4πε₀' + dv('r') + '²')} ${dop('×')} 4π${dv('r')}² ${dop('=')} ${dfrac(dv('q'), 'ε₀')}`,
          'the r² cancels exactly, and the radius has vanished from the answer'),
        drvSay('that cancellation is the inverse-square law and nothing else',
          'Field strength falls as 1/r² while area grows as r². Only for an inverse square do the two cancel and leave the flux independent of radius. Any other exponent and Gauss\'s law would simply be false — the theorem is a statement about the 2 in the denominator.'),
        drvStep('the divergence theorem then removes the need for a sphere',
          `∯ ${dv('E')} ${dop('·')} d${dv('A')} ${dop('=')} ∭ (∇${dop('·')}${dv('E')}) d${dv('V')}`,
          'drag the surface off-centre or reshape it and the flux does not move'),
        drvSay('and superposition handles any arrangement of charges',
          'The divergence of a Coulomb field vanishes everywhere except at its own charge, so the flux depends only on what is inside. Fields add, so several charges simply add their contributions to the total.'),
        drvStep('charges outside contribute exactly nothing',
          `∯ ${dop('=')} 0 for external charge`,
          'every field line entering must leave — the panel shows the inflow and outflow cancelling'),
        drvSay('which is what makes the law useful rather than merely true',
          'Choose a surface that matches the symmetry and the integral becomes arithmetic: a sphere for a point charge, a cylinder for a line, a pillbox for a plane. Without symmetry the law is still true and entirely useless for computing the field, which is worth saying plainly.'),
        drvStep('and in differential form it is local',
          `∇${dop('·')}${dv('E')} ${dop('=')} ρ/ε₀`,
          'charge is where field lines begin and end — the first of Maxwell\'s four'),
        drvSay('the two forms say the same thing, and the divergence theorem is the translation',
          'One is about a surface and the charge it encloses; the other is about a point and the charge density there. The divergence theorem in the vector-calculus wing converts between them and does nothing else — which is why that theorem is not an optional extra here but the reason Maxwell\'s equations can be written in either an integral or a differential form at all. The same pairing turns Ampère\'s and Faraday\'s laws inside out, using Stokes\'s theorem instead.'),
        drvSay('and the inverse square is hiding inside the law rather than being assumed by it',
          'Gauss\'s law works because flux through a sphere is (field) × (area), the area grows as r², and so the field must fall as 1/r² for the product to stay fixed. Change the exponent to 2.000001 and the law fails — the flux would depend on the radius of the surface. Experiments testing exactly that have bounded the deviation to about 10⁻¹⁶, which is really a bound on the photon\'s mass, since a massive photon would give a Yukawa fall-off instead. A geometric-looking statement turns out to be a precision test of particle physics.')
      ],
      note:'The flux is computed by summing E·dA over a mesh on the sphere, so it is a genuine numerical integral rather than an evaluated formula. Drag the sphere until a charge crosses its surface and the total jumps by exactly that charge over ε₀.'
    };
  },
  drag: true,
  enter(st, o){
    st.objs = [
      { kind:'charge', q: 2, p:{x:-1.1,y:0.5,z:0} },
      { kind:'charge', q:-1, p:{x: 1.5,y:-0.8,z:0} }
    ];
    st.c = { x: -1.1, y: 0.5, z: 0 }; st.R = o.R || 1.2; st.dragging = false;
    st.own = !!o.own;
    st.rho = o.rho || '2.4*exp(-(x^2+y^2+z^2)/0.22)';
    if(st.own) st.c = { x:0, y:0, z:0 };
  },
  /* Two volume integrals and a surface integral, at a few hundred thousand
     evaluations of a compiled expression apiece. Keyed on the density, the
     surface AND the quality, because a drag runs at a coarse mesh and settles
     to a fine one the moment the pointer is released — and the two answers are
     different numbers, so they must not share a cache entry. */
  rhoOf(st){ return pkCompile(st.rho, () => 0); },
  /* The cell decomposition of the density, which everything else is built on.
     Keyed on the formula alone — it is a property of the charge, not of where
     the surface happens to be. */
  gridOf(st){
    if(st._Gk === st.rho) return st._Gd;
    st._Gk = st.rho;
    st._Gd = emCellGrid(STAGES.emGauss.rhoOf(st), 3.4, 34);
    return st._Gd;
  },
  gaussOf(st){
    const key = st.rho + '|' + fmtNum(st.c.x, 4) + '|' + fmtNum(st.c.y, 4) + '|' + fmtNum(st.R, 4);
    if(st._gk === key) return st._gd;
    st._gk = key;
    const rho = STAGES.emGauss.rhoOf(st), G = STAGES.emGauss.gridOf(st);
    const c = st.c, R = st.R;
    const F = emCellFlux(G, c.x, c.y, 0, R, 4, 9);
    const Q = emRhoQ(rho, c.x, c.y, 0, R, 8, 16, 12);
    const Qtot = emRhoQ(rho, 0, 0, 0, 6, 8, 16, 16);
    /* the rim arrows the picture draws, computed once here rather than per frame */
    const rim = [];
    for(let i = 0; i < 28; i++){
      const a = (i + 0.5) / 28 * 2 * Math.PI;
      const nx = Math.cos(a), ny = Math.sin(a);
      const E = emCellsE(G, c.x + R * nx, c.y + R * ny, 0);
      rim.push({ a, d:E.x * nx + E.y * ny });
    }
    st._gd = { flux:F.flux, gross:F.gross, Q, Qtot, rim, cells:G.cells.length, gridSum:G.sum,
               gap:Math.abs(F.flux - Q),
               rel:Math.abs(Q) > 1e-9 ? Math.abs(F.flux - Q) / Math.abs(Q) : NaN,
               divE:emCellDiv(G, c.x, c.y, 0, 'E'),
               rhoHere:rho(c.x, c.y, 0) };
    return st._gd;
  },
  /* The sweep is about the ORIGIN and depends on the density alone, so it
     survives dragging the surface and is computed once per formula. */
  sweepOf(st){
    if(st._wk === st.rho) return st._wd;
    st._wk = st.rho;
    st._wd = emGaussSweep(STAGES.emGauss.gridOf(st), STAGES.emGauss.rhoOf(st), 0, 0, 0,
                          [0.7, 1.4, 2.2, 3.1]);
    return st._wd;
  },
  controlsOwn(){
    const st = ST;
    return ctSeg('egP', st.rho, EM_RHO_PRESETS) +
      fnHtml('egRho', 'ρ(x, y, z) =', st.rho, 'x, y and z — the density, not the charge') +
      ctlRow('surface R', ctlSlider('egR', 0.3, 3.5, 0.05, st.R)) +
      `<p class="help"><b>Drag the surface anywhere.</b> Nothing here is counted: E is Coulomb's law
      integrated over your density, and the enclosed charge is a second integral of the same density
      over the ball. The two are computed by different quadratures in different coordinates, and the
      panel prints the difference.</p>
      <p class="help">Because the field integral is done in spherical coordinates <b>about the point
      it is evaluated at</b>, the r² of d³r cancels the 1/r² of Coulomb's law exactly and the
      integrand stays bounded inside the charge. So a surface that <b>cuts through</b> the source is
      a legal question here — which is the case a list of point charges cannot express.</p>
      <p class="help">The panel also differentiates the integrated field to get ∇·E and compares it
      with ρ at that point. That is the differential form, and counting charges never tests it.</p>`;
  },
  controls(){
    const st = ST;
    const seg = ctSeg('egM', st.own ? 'own' : 'pts',
                      [['pts', 'two point charges'], ['own', 'write your own charge density']]);
    if(st.own) return seg + STAGES.emGauss.controlsOwn();
    return seg + ctlRow('surface R', ctlSlider('egR', 0.3, 3.5, 0.05, ST.R)) +
      `<p class="help"><b>Drag the dashed Gaussian surface anywhere.</b> The flux is computed by summing E·n̂ over the sphere — it never looks at the charge list — yet it always equals exactly the charge enclosed. Slide it past a charge and watch the flux jump while the field itself changes smoothly: flux counts <i>sources</i>, not field strength. Enlarge it, move it, put it anywhere with the same charges inside — the answer does not move.</p>`;
  },
  wire(){
    ctWireSeg('egM', v => { ST.own = (v === 'own'); });
    wireSlider('egR', () => ST.R, v => { ST.R = v; }, v => (+v).toFixed(2));
    if(!ST.own) return;
    ctWireSeg('egP', v => { ST.rho = v; });
    fnWire('egRho', (m, s) => { ST.rho = s; });
  },
  frameOwn(st, dt, ctx, W, H){
    const V = emView(st, W, H, 3.6);
    const D = STAGES.emGauss.gaussOf(st);
    const rho = STAGES.emGauss.rhoOf(st);
    /* the density itself, as a heat map in the plane it is drawn in */
    const N = 46, ext = V.ext, cell = 2 * ext / N;
    let peak = 1e-30;
    const grid = [];
    for(let i = 0; i < N; i++){
      grid.push([]);
      for(let j = 0; j < N; j++){
        const x = -ext + cell * (i + 0.5), y = -ext + cell * (j + 0.5);
        const v = rho(x, y, 0);
        grid[i].push(Number.isFinite(v) ? v : 0);
        peak = Math.max(peak, Math.abs(grid[i][j]));
      }
    }
    for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
      const v = grid[i][j];
      if(Math.abs(v) < peak * 0.012) continue;
      const [sx, sy] = V.toS(-ext + cell * i, -ext + cell * (j + 1));
      const [sx2, sy2] = V.toS(-ext + cell * (i + 1), -ext + cell * j);
      ctx.fillStyle = rgbCss(v > 0 ? TH.pos : TH.neg, Math.min(0.75, Math.abs(v) / peak * 0.8));
      ctx.fillRect(Math.round(sx), Math.round(sy), Math.max(1, Math.round(sx2 - sx)),
                   Math.max(1, Math.round(sy2 - sy)));
    }
    /* the surface, and E·n̂ on its rim */
    const [cx, cy] = V.toS(st.c.x, st.c.y), rr = st.R * V.sc;
    ctx.setLineDash([6, 5]); ctx.lineWidth = 2.2;
    ctx.strokeStyle = rgbCss(D.Q > 1e-6 ? TH.pos : D.Q < -1e-6 ? TH.neg : TH.mid);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    const scale = Math.max(1e-12, ...D.rim.map(r => Math.abs(r.d)));
    for(const r of D.rim){
      if(!Number.isFinite(r.d) || Math.abs(r.d) < 1e-14) continue;
      const nx = Math.cos(r.a), ny = Math.sin(r.a);
      const L = Math.sign(r.d) * Math.pow(Math.abs(r.d) / scale, 0.55) * 26;
      const [sx, sy] = V.toS(st.c.x + st.R * nx, st.c.y + st.R * ny);
      emDrawArrow(ctx, sx, sy, sx + nx * L, sy - ny * L,
                  r.d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.6, 7);
    }
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('drag the surface — through the charge if you like', W / 2, 14);
    ctText(ctx, W / 2, 34, 'Φ = ' + fmtNum(D.flux, 5) + '   against   Q_enc = ' + fmtNum(D.Q, 5),
           rgbCss(TH.text), '600 13px ' + FONT_UI, 'center', 'top');
    stageNote(ctx, 'the shading is your density; the arrows are E·n̂, integrated from it — nothing here counts charges', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.emGauss.frameOwn(st, dt, ctx, W, H);
    const V = emView(st, W, H, 4.2);
    const objs = st.objs;
    const key = JSON.stringify(objs) + (TH.dark ? 'd' : 'l');
    if(!st.lc || st.lk !== key){ st.lc = emFieldLines(objs, 'E', V.ext); st.lk = key; }
    ctx.strokeStyle = rgbCss(TH.warn, 0.55); ctx.lineWidth = 1.2;
    for(const ln of st.lc){
      if(ln.pts.length < 3) continue;
      ctx.beginPath();
      ln.pts.forEach((p, i) => { const [x, y] = V.toS(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      for(let k = 26; k < ln.pts.length - 1; k += 60){
        const [x1, y1] = V.toS(ln.pts[k].x, ln.pts[k].y), [x2, y2] = V.toS(ln.pts[k+1].x, ln.pts[k+1].y);
        const dx = x2 - x1, dy = y2 - y1, m = Math.hypot(dx, dy) || 1;
        emDrawArrow(ctx, x1, y1, x1 + dx/m*9, y1 + dy/m*9, rgbCss(TH.warn, 0.75), 1.2, 7);
      }
    }
    for(const o of objs) emDrawObject(ctx, o, V, false);
    const [cx, cy] = V.toS(st.c.x, st.c.y), rr = st.R * V.sc;
    const qEnc = emEnclosedCharge(objs, v3(st.c.x, st.c.y, 0), st.R, 0);
    const surfCol = qEnc > 1e-9 ? TH.pos : qEnc < -1e-9 ? TH.neg : TH.mid;
    ctx.fillStyle = rgbCss(surfCol, 0.07);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.fill();
    ctx.setLineDash([6, 5]); ctx.lineWidth = 2.2; ctx.strokeStyle = rgbCss(surfCol);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    const K = 28, rimE = [];
    for(let i = 0; i < K; i++){
      const a = (i + 0.5) / K * 2 * Math.PI;
      const nh = v3(Math.cos(a), Math.sin(a), 0);
      rimE.push(vdot(emField(objs, v3(st.c.x + st.R * nh.x, st.c.y + st.R * nh.y, 0), 0).E, nh));
    }
    const scaleE = Math.max(1e-9, ...rimE.filter(Number.isFinite).map(Math.abs));
    for(let i = 0; i < K; i++){
      const a = (i + 0.5) / K * 2 * Math.PI;
      const nh = v3(Math.cos(a), Math.sin(a), 0);
      const p = v3(st.c.x + st.R * nh.x, st.c.y + st.R * nh.y, 0);
      const d = rimE[i];
      if(!Number.isFinite(d) || Math.abs(d) < 1e-12) continue;
      const L = Math.sign(d) * Math.pow(Math.abs(d) / scaleE, 0.55) * 26;
      const [sx, sy] = V.toS(p.x, p.y);
      emDrawArrow(ctx, sx, sy, sx + nh.x * L, sy - nh.y * L, d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.6, 7);
    }
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('drag the surface — outward flux minus inward always equals the charge inside', W / 2, 14);
    stageNote(ctx, 'lines that pass in and out contribute nothing; only lines that START or END inside count — that is ∇·E = ρ', W, H);
  },
  pick(st, sx, sy, phase){
    if(!st.emS) return;
    const wx = (sx - st.emCx) / st.emS, wy = (st.emCy - sy) / st.emS;
    if(phase === 'up'){ st.dragging = false; return; }
    if(phase === 'down' || phase === 'click') st.dragging = true;
    if(st.dragging) st.c = { x: wx, y: wy };
  },
  readoutOwn(st){
    const D = STAGES.emGauss.gaussOf(st), S = STAGES.emGauss.sweepOf(st);
    const n = (v, d) => (Number.isFinite(v) ? fmtNum(v, d === undefined ? 6 : d) : 'not defined here');
    return `<div class="card tight"><div class="ttl">Your density, surface at (${fmtNum(st.c.x, 2)}, ${fmtNum(st.c.y, 2)}), R = ${fmtNum(st.R, 2)}</div>
      ${kv('ρ(x, y, z)', pkPretty(st.rho))}
      ${kv('∮E·dA, from the integrated field', '<b>' + n(D.flux) + '</b>')}
      ${kv('Q enclosed, by its own quadrature', '<b>' + n(D.Q) + '</b>')}
      ${kv('difference', fmtAgree(D.flux, D.Q))}
      ${kv('total charge in the whole space', n(D.Qtot))}
      ${kv('the grid holds', n(D.gridSum) + ' of it, in ' + D.cells + ' cells')}
      <p class="help">Neither number is a count. The field is Coulomb's law integrated over your
      density and the enclosed charge is a second integral of the same density in different
      coordinates, so their agreement is evidence. Drag the surface until it <b>cuts through</b> the
      charge — the case a list of point charges cannot pose at all — and it still holds.</p>
    </div>
    <div class="card tight"><div class="ttl">The differential form, at the centre</div>
      ${kv('∇·E, differentiated from the field', n(D.divE))}
      ${kv('ρ at that point', n(D.rhoHere))}
      ${kv('difference', fmtAgree(D.divE, D.rhoHere))}
      <p class="help">∮E·dA = Q is about a region; ∇·E = ρ is about a point, and no amount of counting
      charges can test it. Here the integrated field is differentiated numerically and compared with
      the density at that very point. The divergence theorem is the reason the two forms are the same
      law — and it is the only reason.</p>
    </div>
    <div class="card tight"><div class="ttl">The sweep, about the origin</div>
      ${S ? S.rows.map(r => kv('R = ' + fmtNum(r.R, 2),
        'Φ = ' + fmtNum(r.flux, 5) + ',  Q = ' + fmtNum(r.Q, 5) + ',  |E| ≈ ' + fmtNum(r.meanE, 4))).join('') +
        kv('spread in the flux once enclosed', Number.isFinite(S.spread) ? fmtSig(S.spread, 4) : '—') +
        kv('range of |E| over the same radii', Number.isFinite(S.eRange) ? fmtNum(S.eRange, 4) + '×' : '—')
       : ''}
      <p class="help">The field on the surface falls steeply as it grows and the area grows just as
      fast, and the product does not move. That exact cancellation <b>is</b> the inverse square: with
      any other exponent the flux would depend on the radius. One radius could never show this — it
      takes the sweep, and the two columns moving differently is the whole point.</p>
    </div>`;
  },
  readout(st){
    if(st.own) return STAGES.emGauss.readoutOwn(st);
    const c = v3(st.c.x, st.c.y, st.c.z || 0);
    const flux = emFluxE(st.objs, c, st.R, 0, 30);
    const q = emEnclosedCharge(st.objs, c, st.R, 0);
    const f = emField(st.objs, c, 0);
    return `<div class="card tight"><div class="ttl">Surface at (${fmtNum(st.c.x,2)}, ${fmtNum(st.c.y,2)}), R = ${fmtNum(st.R,2)}</div>
      ${kv('∮E·dA  (summed over the sphere)', '<b>' + fmtNum(flux, 4) + '</b>')}
      ${kv('Q enclosed', fmtNum(q, 4))}
      ${kv('difference', fmtAgree(flux, q) + ' — integration error only')}
      ${kv('|E| at the centre', fmtNear(vlen(f.E)))}
    </div>
    <div class="card tight"><div class="ttl">Why it works</div>
      <p class="help">Differential form <b>∇·E = ρ/ε₀</b>; integral form <b>∮E·dA = Q/ε₀</b> (= Q in these units). They are one statement, converted by the divergence theorem — the same machinery as the vector-calculus wing's flux box. The 1/r² falloff is what makes it exact: the field weakens as r² while the sphere's area grows as r², so the product is scale-free. In a universe with 1/r³ forces, Gauss's law would fail.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const D = STAGES.emGauss.gaussOf(st);
      return `<div class="k">your density</div><div>Φ = ${fmtNum(D.flux, 5)}</div>
        <div style="color:var(--c-pos)">Q_enc = ${fmtNum(D.Q, 5)}</div>`;
    }
    const c = v3(st.c.x, st.c.y, st.c.z || 0);
    return `<div class="k">Gauss's law</div><div>Φ_E = ${fmtNum(emFluxE(st.objs, c, st.R, 0, 18), 3)}</div>
      <div style="color:var(--c-pos)">Q_enc = ${fmtNum(emEnclosedCharge(st.objs, c, st.R, 0), 3)}</div>`;
  },
  legend(st){
    if(st && st.own)
      return [['var(--c-pos)', 'positive charge density, and E·n̂ outward'],
              ['var(--c-neg)', 'negative charge density, and E·n̂ inward'],
              ['var(--mid)', 'the Gaussian surface — drag it, even through the charge']];
    return [['var(--c-warn)','E field lines'],['var(--c-pos)','E·n̂ outward (+ flux)'],['var(--c-neg)','E·n̂ inward (− flux)'],['var(--mid)','the Gaussian surface — drag it']]; }
};

/* ---- 18 · Gauss's law for B: there are no magnetic charges ------------------- */
STAGES.emGaussB = {
  title: '∮B·dA = 0 — no monopoles',
  derive(st){
    if(st.own) return STAGES.emGaussB.deriveOwn(st);
    return {
      title:'The law that says what does not exist',
      steps:[
        drvStep('the law',
          `∯ ${dv('B')} ${dop('·')} d${dv('A')} ${dop('=')} 0`,
          'the panel integrates the magnetic flux over a closed surface — it vanishes wherever you put it'),
        drvSay('compare that with the electric case',
          'Gauss\'s law for E has a source term on the right: charge. The magnetic version has zero. That single difference is the whole asymmetry of electromagnetism, and it says magnetic field lines never begin or end.'),
        drvStep('so every field line that enters must leave',
          `∇${dop('·')}${dv('B')} ${dop('=')} 0`,
          'the differential form — no point is a source or a sink'),
        drvSay('and that is why magnetic field lines close on themselves',
          'A line with nowhere to start and nowhere to stop has no choice but to form a loop. Surround a bar magnet with any surface at all and as much flux returns through the sides as leaves the north pole.'),
        drvStep('cut a magnet in half and you get two magnets',
          `no isolated ${dv('N')} or ${dv('S')} has ever been found`,
          'the panel lets you enclose one pole alone — the flux still comes to zero'),
        drvSay('because the field of a magnet is made by currents, not by poles',
          'A bar magnet is a collection of circulating electron currents. A current loop produces a dipole field with no source anywhere, so ∇·B = 0 is automatic. There is no arrangement of currents that produces a monopole.'),
        drvStep('the law is equivalent to B being a curl',
          `${dv('B')} ${dop('=')} ∇${dop('×')}${dv('A')} ${dop('⇒')} ∇${dop('·')}${dv('B')} ${dop('=')} 0`,
          'because div curl = 0 identically — d∘d = 0 from the forms wing'),
        drvSay('which is why the vector potential exists at all',
          'The absence of monopoles is exactly the condition that lets B be written as the curl of something. That vector potential is a computational convenience in classical physics and becomes unavoidable in quantum mechanics, where the Aharonov–Bohm effect shows it has observable consequences where B itself is zero.'),
        drvSay('and if a monopole were ever found, the equations would improve',
          'Dirac showed in 1931 that a single monopole anywhere in the universe would force electric charge to be quantised — which it observably is. That is a startlingly good argument for something never seen. Searches continue, and so far every one has returned zero.')
      ],
      note:'The flux integral is computed numerically over the surface wherever it is dragged, including surfaces enclosing a single pole of the magnet. It returns zero to integration accuracy every time, which is the law being tested rather than assumed.'
    };
  },
  drag: true,
  enter(st, o){
    st.objs = [{ kind:'magnet', m:{x:1.6,y:0.5,z:0}, p:{x:0,y:0,z:0} },
               { kind:'wire', I:1.6, p:{x:2.2,y:-1.4,z:0} }];
    st.dragging = false;
    st.own = !!o.own;
    STAGES.emGaussB.enterOwn(st, o);
    if(!st.own){ st.c = { x:0, y:0, z:0 }; st.R = 1.1; }
  },
  controls(){
    const seg = ctSeg('gbM', ST.own ? 'own' : 'mag',
                      [['mag', 'a magnet and a wire'], ['own', 'write your own current density']]);
    if(ST.own) return seg + STAGES.emGaussB.controlsOwn();
    return seg + ctlRow('surface R', ctlSlider('gbR', 0.3, 3.2, 0.05, ST.R)) +
      `<p class="help">The same experiment as Gauss's law, run on a magnet. <b>Drag the surface anywhere</b> — over the north pole, the south pole, the whole magnet, the current-carrying wire — and the flux stays zero every time. There is no magnetic charge for it to count. Every B line that enters must leave, because <b>B lines have no ends: they close on themselves</b>.</p>`;
  },
  wire(){
    ctWireSeg('gbM', v => {
      ST.own = (v === 'own');
      ST.c = ST.own ? { x:0.6, y:0.35, z:0 } : { x:0, y:0, z:0 };
      ST.R = ST.own ? 1.0 : 1.1;
    });
    if(ST.own) return STAGES.emGaussB.wireOwn();
    wireSlider('gbR', () => ST.R, v => { ST.R = v; }, v => (+v).toFixed(2));
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.emGaussB.frameOwn(st, dt, ctx, W, H);
    const V = emView(st, W, H, 4.2);
    const objs = st.objs;
    const key = JSON.stringify(objs) + (TH.dark ? 'd' : 'l');
    if(!st.lc || st.lk !== key){ st.lc = emFieldLines(objs, 'B', V.ext); st.lk = key; }
    ctx.strokeStyle = rgbCss(TH.neg, 0.6); ctx.lineWidth = 1.3;
    for(const ln of st.lc){
      if(ln.pts.length < 3) continue;
      ctx.beginPath();
      ln.pts.forEach((p, i) => { const [x, y] = V.toS(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      for(let k = 30; k < ln.pts.length - 1; k += 70){
        const [x1, y1] = V.toS(ln.pts[k].x, ln.pts[k].y), [x2, y2] = V.toS(ln.pts[k+1].x, ln.pts[k+1].y);
        const dx = x2 - x1, dy = y2 - y1, m = Math.hypot(dx, dy) || 1;
        emDrawArrow(ctx, x1, y1, x1 + dx/m*9, y1 + dy/m*9, rgbCss(TH.neg, 0.8), 1.2, 7);
      }
    }
    for(const o of objs) emDrawObject(ctx, o, V, false);
    const [cx, cy] = V.toS(st.c.x, st.c.y), rr = st.R * V.sc;
    ctx.setLineDash([6, 5]); ctx.lineWidth = 2.2; ctx.strokeStyle = rgbCss(TH.mid);
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
    const K = 28, rimB = [];
    for(let i = 0; i < K; i++){
      const a = (i + 0.5) / K * 2 * Math.PI;
      const nh = v3(Math.cos(a), Math.sin(a), 0);
      rimB.push(vdot(emField(objs, v3(st.c.x + st.R * nh.x, st.c.y + st.R * nh.y, 0), 0).B, nh));
    }
    const scaleB = Math.max(1e-9, ...rimB.filter(Number.isFinite).map(Math.abs));
    for(let i = 0; i < K; i++){
      const a = (i + 0.5) / K * 2 * Math.PI;
      const nh = v3(Math.cos(a), Math.sin(a), 0);
      const p = v3(st.c.x + st.R * nh.x, st.c.y + st.R * nh.y, 0);
      const d = rimB[i];
      if(!Number.isFinite(d) || Math.abs(d) < 1e-12) continue;
      const L = Math.sign(d) * Math.pow(Math.abs(d) / scaleB, 0.55) * 24;
      const [sx, sy] = V.toS(p.x, p.y);
      emDrawArrow(ctx, sx, sy, sx + nh.x * L, sy - nh.y * L, d > 0 ? rgbCss(TH.pos) : rgbCss(TH.neg), 1.6, 7);
    }
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('outward and inward flux cancel exactly — wherever you put the surface', W / 2, 14);
    stageNote(ctx, 'cut a magnet in half and you get two magnets, never a lone N pole — that experimental fact IS ∇·B = 0', W, H);
  },
  pick(st, sx, sy, phase){
    if(!st.emS) return;
    const wx = (sx - st.emCx) / st.emS, wy = (st.emCy - sy) / st.emS;
    if(phase === 'up'){ st.dragging = false; return; }
    if(phase === 'down' || phase === 'click') st.dragging = true;
    if(st.dragging) st.c = { x: wx, y: wy };
  },
  readout(st){
    if(st.own) return STAGES.emGaussB.readoutOwn(st);
    const c = v3(st.c.x, st.c.y, st.c.z || 0);
    const fluxB = emFluxB(st.objs, c, st.R, 0, 34);
    const fluxE = emFluxE(st.objs, c, st.R, 0, 20);
    const f = emField(st.objs, c, 0);
    return `<div class="card tight"><div class="ttl">Surface at (${fmtNum(st.c.x,2)}, ${fmtNum(st.c.y,2)}), R = ${fmtNum(st.R,2)}</div>
      ${kv('∮B·dA', '<b>' + fmtNum(fluxB, 6) + '</b>')}
      ${kv('zero to precision?', Math.abs(fluxB) < 2e-3 ? '✓ yes, everywhere' : fmtNum(fluxB, 6))}
      ${kv('∮E·dA (no charges here)', fmtNum(fluxE, 6))}
      ${kv('|B| at the centre', fmtNear(vlen(f.B)))}
    </div>
    <div class="card tight"><div class="ttl">What the zero means</div>
      <p class="help"><b>∇·B = 0</b> everywhere — the one Maxwell equation with nothing on the right-hand side. Magnetism has no charges: a magnet's north and south are two ends of the same current loop, not two separable objects. Dirac showed a single monopole anywhere in the universe would explain why electric charge comes in exact multiples of e; searches have found none. If one turned up, this equation would gain a ρ_m and Maxwell's set would become perfectly symmetric.</p>
    </div>`;
  },
  chip(st){
    if(st.own) return STAGES.emGaussB.chipOwn(st);
    return `<div class="k">∇·B = 0</div><div style="color:var(--c-neg)">Φ_B = ${fmtNum(emFluxB(st.objs, v3(st.c.x,st.c.y,st.c.z||0), st.R, 0, 20), 5)}</div><div>no monopoles</div>`;
  },
  legend(st){
    if(st && st.own) return STAGES.emGaussB.legendOwn();
    return [['var(--c-neg)','B field lines — closed, endless'],['var(--c-pos)','B·n̂ outward'],['var(--mid)','the surface — drag it anywhere']]; }
};

/* ---- 19 · Faraday: a moving magnet makes an electric field ------------------- */
STAGES.emFaraday = {
  title: "Faraday's law",
  derive(st){
    return {
      title:'A changing magnetic flux drives a current, and the sign is not negotiable',
      steps:[
        drvStep('the law',
          `∮ ${dv('E')} ${dop('·')} d${dv('r')} ${dop('=')} ${dop('−')}${dfrac('d Φ_B', 'd' + dv('t'))}`,
          'the panel moves the loop through the field and plots the induced EMF against time'),
        drvStep('and Stokes converts it to the local form',
          `∇${dop('×')}${dv('E')} ${dop('=')} ${dop('−')}${dfrac('∂' + dv('B'), '∂' + dv('t'))}`,
          'circulation round the boundary becomes curl over the surface'),
        drvSay('this is what makes electricity and magnetism one subject',
          'Before Faraday they were separate phenomena that happened to involve similar-looking forces. This law says a changing magnetic field creates an electric one. They are not two fields that interact; they are two aspects of one.'),
        drvStep('the flux can change three different ways',
          `Φ ${dop('=')} ${dv('B')}${dv('A')} cos θ`,
          'change B, change the area, or rotate the loop — the panel does the third and the readout tracks it'),
        drvSay('and rotating the loop is how every generator works',
          'Spin a coil in a fixed field and the flux varies as cos ωt, so the EMF varies as sin ωt. Alternating current is not a design choice — it is what a rotating loop necessarily produces, and rectifying it is an extra step rather than the natural one.'),
        drvStep('the minus sign is Lenz\'s law',
          `induced effects oppose the change that caused them`,
          'the panel shows the induced current and the force it produces on the moving loop'),
        drvSay('and it has to be there, or energy would come from nowhere',
          'Suppose the sign were positive. The induced current would create a field reinforcing the change, which would increase the current, which would reinforce it further — free energy, growing without bound. The minus sign is conservation of energy expressing itself as a sign convention.'),
        drvStep('the induced EMF is a genuine non-conservative field',
          `∮ ${dv('E')} ${dop('·')} d${dv('r')} ${dop('≠')} 0`,
          'so there is no potential function here — voltage between two points is not well defined'),
        drvSay('which is why "voltage" gets slippery around transformers',
          'A conservative field has a potential and its loop integral is zero. An induced field does not. Two voltmeters on the same two points of a loop threaded by changing flux can read different values, depending on which way their leads run. That is not a fault in the meters.'),
        drvSay('and for a fixed loop the law is a theorem of calculus wearing physics',
          'Hold the loop still and Faraday\'s law says d/dt ∬B·dA = ∬(∂B/∂t)·dA — the Leibniz rule for differentiating under the integral sign. The "type your own B" scene verifies exactly that, on whatever field you write: one route differentiates the flux integral, the other integrates the time derivative, by quadratures sharing no samples, no step and no rule. When the loop moves, the extra motional term ∮(v×B)·dl appears — and that is the magnet scene.')
      ],
      note:'The EMF is computed as the numerical time derivative of the flux integral through the moving loop, and the trace on screen is that computed value. The force on the loop is then obtained from the induced current, so Lenz\'s law appears as a direction rather than as a rule.'
    };
  },
  enter(st, o){
    st.scene = o.scene || 'magnet';
    st.speed = o.speed !== undefined ? o.speed : 0.9;
    st.R = 1.0; st.mm = 2.2; st.hist = []; st.tt = 0;
    st.bsrc = o.bsrc || '2.2*sin(1.3*t)*exp(-(x^2+y^2))';
    st.bfn = this.bBuild(st.bsrc).f;
  },
  /* The typed field lives on the loop's own plane: B·n̂ as a function of the
     plane coordinates x, y and the time t. The parser knows three slots
     (x, y, z), so t is rewritten onto z before parsing — the pkIndexAst trick —
     and a literal z in the source is rejected with its own message rather than
     silently meaning time. */
  bBuild(s){
    if(/(?<![A-Za-z])z(?![A-Za-z])/.test(String(s)))
      throw new Error('the loop plane is x and y, and time is t — there is no z here');
    const g = compile(parse(String(s).replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'z')));
    return { f:(x, y, t) => g(x, y, t) };
  },
  objsAt(st, t){
    const x = -3.4 + (((t * st.speed) % 6.8) + 6.8) % 6.8;
    return [{ kind:'magnet', m:{x:st.mm, y:0, z:0}, p:{x, y:0, z:0}, v:{x:st.speed, y:0, z:0} }];
  },
  /* ---- the two routes for a typed field, exposed for runstagetests ----
     Faraday's law for a static loop is the Leibniz rule made physical: the
     derivative of the integral must equal the integral of the derivative.
     Route A differentiates OUTSIDE (two flux quadratures at t ± h, midpoint
     rings); route B differentiates INSIDE (∂B/∂t at every sample point, then
     a Gauss–Legendre radial quadrature at a different h and node set). The
     routes share no samples, no step and no rule. */
  typedFlux(st, t, nr, ns){
    const R = st.R, NR = nr || 24, NS = ns || 48;
    let s = 0;
    for(let i = 0; i < NR; i++){
      const r = R * (i + 0.5) / NR;
      let ring = 0;
      for(let j = 0; j < NS; j++){
        const th = 2 * Math.PI * (j + 0.5) / NS;
        const v = st.bfn(r * Math.cos(th), r * Math.sin(th), t);
        if(Number.isFinite(v)) ring += v;
      }
      s += ring / NS * r;
    }
    return s * (R / NR) * 2 * Math.PI;
  },
  typedEMF(st, t, nr, ns){
    /* the frame's history plot reads this at display resolution; the readout
       and the stage tests pass 192 rings, because a COMPARISON deserves a
       finer grid than a picture — at 24 rings the midpoint rule's own O(h²)
       truncation (3.1×10⁻⁴ relative, measured) would be the thing compared */
    const h = 1e-3;
    return -(this.typedFlux(st, t + h, nr, ns) - this.typedFlux(st, t - h, nr, ns)) / (2 * h);
  },
  typedEMFInside(st, t){
    const h = 2e-3, NS = 64;
    const ringDeriv = r => {
      let s = 0;
      for(let j = 0; j < NS; j++){
        const th = 2 * Math.PI * (j + 0.5) / NS;
        const x = r * Math.cos(th), y = r * Math.sin(th);
        const d = (st.bfn(x, y, t + h) - st.bfn(x, y, t - h)) / (2 * h);
        if(Number.isFinite(d)) s += d;
      }
      return s / NS * 2 * Math.PI * r;
    };
    return -nqGauss(ringDeriv, 0, st.R, 5, 6);
  },
  controls(){
    const st = ST;
    return ctSeg('efS', st.scene, [['magnet', 'a magnet through the loop'], ['own', 'type your own B(x, y, t)']]) +
      (st.scene === 'own'
        ? fnHtml('efB', 'B·n̂(x, y, t) =', st.bsrc, 'x and y on the loop plane, t the time') +
          ctlRow('loop radius', ctlSlider('efR', 0.4, 2, 0.05, st.R)) +
          `<p class="help">Type any B·n̂ over the loop's plane and Faraday's law is <b>verified as the
          Leibniz rule</b>: the EMF is computed once as the derivative of the flux integral
          (differentiate outside) and once as the integral of ∂B/∂t (differentiate inside), by
          quadratures sharing no samples, no step and no rule. The two agree to the routes' own
          resolution — or the build is wrong. Make B static (delete the t) and both vanish together:
          it is not the field that drives current, it is the <b>change</b>.</p>`
        : ctlRow('magnet speed', ctlSlider('efV', -1.6, 1.6, 0.05, st.speed)) +
          ctlRow('loop radius', ctlSlider('efR', 0.4, 2, 0.05, st.R)) +
          ctlRow('moment |m|', ctlSlider('efM', 0.5, 4, 0.1, st.mm)) +
          `<p class="help">The magnet sweeps through a fixed loop; the plot tracks Φ_B(t) and the EMF it induces. <b>EMF = −dΦ/dt</b> — the induced voltage is the <i>slope</i> of the flux curve, so it peaks where the flux changes fastest and vanishes at the instant the magnet is centred (maximum flux, zero slope). Set the speed to 0 and everything dies: it is not the field that drives current, it is the <b>change</b>.</p>`);
  },
  wire(){
    ctWireSeg('efS', v => { ST.scene = v; ST.hist = []; ST.tt = 0; buildStagePanel(); });
    wireSlider('efV', () => ST.speed, v => { ST.speed = v; ST.hist = []; }, v => (+v).toFixed(2));
    wireSlider('efR', () => ST.R, v => { ST.R = v; ST.hist = []; }, v => (+v).toFixed(2));
    wireSlider('efM', () => ST.mm, v => { ST.mm = v; ST.hist = []; }, v => (+v).toFixed(1));
    fnWire('efB', (made, src) => { ST.bfn = made.f; ST.bsrc = src; ST.hist = []; },
           s => this.bBuild(s));
  },
  frame(st, dt, ctx, W, H){
    st.tt += dt;
    if(st.scene === 'own'){
      const phi = this.typedFlux(st, st.tt);
      const emf = this.typedEMF(st, st.tt);
      st.phi = phi; st.emf = emf;
      st.hist.push({ t: st.tt, phi, emf });
      while(st.hist.length && st.hist[0].t < st.tt - 7) st.hist.shift();
      /* the field on the loop plane, face-on, with the loop drawn over it */
      const topH = H * 0.48;
      const half = st.R * 1.35;
      const P = ctBox(Math.min(W, topH * 1.1), topH + 8, 0, 0, half);
      const rg = ctRange((x, y) => st.bfn(x, y, st.tt), P, 24);
      const span = Math.max(Math.abs(rg.lo), Math.abs(rg.hi), 1e-9);
      ctHeat(ctx, P, (x, y) => st.bfn(x, y, st.tt), -span, span, 56, 0.8, true);
      ctParam(ctx, P, u => ({ x:st.R * Math.cos(u), y:st.R * Math.sin(u) }), 0, 2 * Math.PI, 120,
              rgbCss(TH.grad), 3);
      ctFrame(ctx, P, 'B·n̂ on the loop plane, face-on — the loop in green');
      /* the history plot, shared with the magnet scene */
      this.histPlot(st, ctx, W, H, topH);
      stageNote(ctx, 'two computations of the same EMF — derivative of the integral, and integral of the derivative', W, H);
      return;
    }
    const objs = this.objsAt(st, st.tt);
    const c = v3(0, 0, 0), nh = v3(1, 0, 0);
    const phi = emFluxBDisc(objs, c, st.R, nh, 0, 14);
    const emf = -emDPhiBdt(objs, c, st.R, nh, 0, 0.02, 12);
    st.phi = phi; st.emf = emf; st.objsNow = objs;
    st.hist.push({ t: st.tt, phi, emf });
    while(st.hist.length && st.hist[0].t < st.tt - 7) st.hist.shift();

    const topH = H * 0.48;
    const sc = Math.min((W - 140) / 8.4, topH / 4.6);
    const cx = W / 2, cy = topH / 2 + 6;
    const toS = (x, y) => [cx + x * sc, cy - y * sc];
    /* the apparatus lives in the top band; clip so field lines cannot bleed
       into the plot underneath */
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, topH); ctx.clip();
    const lines = emFieldLines(objs, 'B', 4);
    ctx.strokeStyle = rgbCss(TH.neg, 0.4); ctx.lineWidth = 1.1;
    for(const ln of lines){
      if(ln.pts.length < 3) continue;
      ctx.beginPath();
      ln.pts.forEach((p, i) => { const [x, y] = toS(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
    }
    /* the coil, edge-on */
    const [lx, ly1] = toS(0, st.R), [, ly2] = toS(0, -st.R);
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(lx, (ly1 + ly2) / 2, 10, Math.abs(ly2 - ly1) / 2, 0, 0, 6.2832); ctx.stroke();
    if(Math.abs(emf) > 1e-4){
      ctx.fillStyle = rgbCss(TH.grad); ctx.font = '600 11px ' + FONT_UI;
      /* below the coil, not beside its middle — the middle is the axis the
         magnet travels along, and the magnet printed through the label
         (2026-08-19 screenshot sweep) */
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('induced current ' + (emf > 0 ? '↺' : '↻') + '  (Lenz: it opposes the change)', lx + 22, Math.max(ly1, ly2) + 10);
    }
    const mo = objs[0];
    const [mx, my] = toS(mo.p.x, mo.p.y);
    const half = 0.44 * sc;
    ctx.fillStyle = rgbCss(TH.pos); ctx.fillRect(mx, my - 13, half, 26);
    ctx.fillStyle = rgbCss(TH.neg); ctx.fillRect(mx - half, my - 13, half, 26);
    ctx.fillStyle = rgbCss(TH.bg); ctx.font = '700 12px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('N', mx + half / 2, my); ctx.fillText('S', mx - half / 2, my);
    if(Math.abs(st.speed) > 0.02)
      emDrawArrow(ctx, mx, my - 28, mx + Math.sign(st.speed) * 44, my - 28, rgbCss(TH.text), 2, 9);
    ctx.restore();

    this.histPlot(st, ctx, W, H, topH);
    stageNote(ctx, 'the EMF crosses zero exactly where Φ peaks — that is what "the derivative of" looks like', W, H);
  },
  histPlot(st, ctx, W, H, topH){
    const pl = st.pl = mkPlot(64, topH + 38, W - 100, H - topH - 96, st.tt - 7, st.tt, -1, 1);
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
    ctx.fillStyle = rgbCss(TH.neg); ctx.fillText('Φ_B  (peak ' + fmtNum(pmax, 3) + ')', pl.px + pl.pw - 8, pl.py + 14);
    ctx.fillStyle = rgbCss(TH.warn); ctx.fillText('EMF  (peak ' + fmtNum(emax, 3) + ')', pl.px + pl.pw - 8, pl.py + 30);
  },
  readout(st){
    if(st.scene === 'own'){
      const t = st.tt;
      const phi = this.typedFlux(st, t, 192, 64);
      const emfA = this.typedEMF(st, t, 192, 64);
      const emfB = this.typedEMFInside(st, t);
      /* both routes vanish together for a static B — fmtAgree's floor says
         "every digit" there, which is the honest verdict */
      return `<div class="card tight"><div class="ttl">Faraday's law as the Leibniz rule, on your field</div>
        ${kv('B·n̂', pkPretty(st.bsrc))}
        ${kv('Φ_B = ∬B·n̂ dA', fmtNum(phi, 6))}
        ${kv('EMF, differentiating the integral', '<b>' + fmtNum(emfA, 6) + '</b>')}
        ${kv('EMF, integrating ∂B/∂t', fmtNum(emfB, 6))}
        ${kv('difference', fmtAgree(emfA, emfB))}
        ${kv("Lenz's sign", Math.abs(emfA) < 1e-9 ? 'nothing to oppose — the flux is not changing'
          : emfA * phi < 0 ? 'the EMF opposes a growing flux' : 'the EMF opposes a collapsing flux')}
        <p class="help">The first route computes Φ(t±h) by a midpoint-ring quadrature and takes the
        slope; the second differentiates B in time at every sample point and integrates with a
        Gauss–Legendre rule — different samples, different step, different rule. Their agreement is
        the Leibniz rule <b>d/dt ∬B dA = ∬ ∂B/∂t dA</b> measured rather than assumed, and for a
        static loop that identity <i>is</i> Faraday's law. Delete the <b>t</b> from your formula and
        both routes vanish together — no change, no EMF, however strong the field.</p>
      </div>
      <div class="card tight"><div class="ttl">The physics</div>
        ${kv('differential form', '∇×E = −∂B/∂t')}
        ${kv('integral form', '∮E·dl = −dΦ_B/dt')}
        ${kv("Lenz's law", 'the minus sign')}
        <p class="help">For a loop that moves or deforms, a motional term ∮(v×B)·dl joins the
        partial-time term — the magnet scene next door is exactly that case, with the E field of the
        moving magnet doing the work. Here the loop is fixed, so the whole EMF is the ∂B/∂t piece,
        and the law reduces to the calculus identity the panel verifies.</p>
      </div>`;
    }
    const objs = st.objsNow || this.objsAt(st, st.tt);
    const circ = emCircE(objs, v3(0,0,0), st.R, v3(1,0,0), 0, 240);
    const emf = st.emf || 0;
    return `<div class="card tight"><div class="ttl">Right now</div>
      ${kv('Φ_B through the loop', fmtNum(st.phi || 0, 5))}
      ${kv('−dΦ_B/dt', '<b>' + fmtNum(emf, 5) + '</b>')}
      ${kv('∮E·dl around the loop', fmtNum(circ, 5))}
      ${kv('Faraday: equal?', Math.abs(circ - emf) < 3e-3 + 0.08 * Math.abs(emf) ? '✓ the law holds' : 'sampling transient')}
      <p class="help">The circulation is measured from the induced E field itself (E = −v×B for the moving magnet); the flux derivative comes from the magnetic flux. Separate routines, no shared assumptions — and they agree. That is Faraday's law verified rather than asserted.</p>
    </div>
    <div class="card tight"><div class="ttl">The physics</div>
      ${kv('differential form', '∇×E = −∂B/∂t')}
      ${kv('integral form', '∮E·dl = −dΦ_B/dt')}
      ${kv("Lenz's law", 'the minus sign')}
      <p class="help">A changing magnetic field <b>curls an electric field around itself</b> — an E field with no charges anywhere, whose lines close in loops rather than starting on charge. The minus sign is Lenz's law: the induced current opposes the change that created it, so the magnet is resisted as it approaches. That resistance is why a generator must be turned, and it is where essentially every watt on the grid comes from. Drop a magnet down a copper pipe and it falls in slow motion — this equation, doing work.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">Faraday's law</div><div style="color:var(--c-neg)">Φ_B = ${fmtNum(st.phi || 0, 4)}</div>
      <div style="color:var(--c-warn)">EMF = ${fmtNum(st.emf || 0, 4)}</div>`;
  },
  legend(st){
    return st.scene === 'own'
      ? [['var(--c-neg)', 'B·n̂ on the loop plane · Φ_B(t)'], ['var(--c-warn)', 'EMF, two routes'],
         ['var(--c-grad)', 'the loop']]
      : [['var(--c-neg)','B lines of the magnet · Φ_B(t)'],['var(--c-warn)','induced EMF = −dΦ/dt'],['var(--c-grad)','the pickup coil']];
  }
};
