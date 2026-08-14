STAGES.vcStokes = {
  title:"Stokes' theorem",
  derive(st){
    return {
      title:'Green\'s theorem lifted off the plane, and why the surface is irrelevant',
      steps:[
        drvSay('the same trade, one dimension up',
          'Green\'s theorem related circulation round a plane loop to curl over the flat region inside. Stokes says the region need not be flat: any surface with that loop as its edge will do, and they all give the same answer.'),
        drvStep('the theorem',
          `∮_(∂S) ${dv('F')} ${dop('·')} d${dv('r')} ${dop('=')} ∬_S (∇${dop('×')}${dv('F')}) ${dop('·')} d${dv('S')}`,
          'the panel computes the loop integral and the surface integral independently and prints both'),
        drvStep('the proof is the same tiling and the same cancellation',
          `Σ over small patches ${dop('=')} ∮ over the edge`,
          'each internal edge is shared by two patches traversed oppositely, so it cancels'),
        drvSay('the curl must be dotted with the normal, and that is the new ingredient',
          'In the plane the curl was a single number. In space it is a vector, and only its component along the surface normal contributes. Circulation round a loop measures the swirl about the axis the loop encircles, so the field\'s swirl about other axes is irrelevant to it.'),
        drvStep('so any surface with the same boundary gives the same result',
          `∬_(S₁) ${dop('=')} ∬_(S₂) whenever ∂${dv('S')}₁ ${dop('=')} ∂${dv('S')}₂`,
          `the panel offers a flat disc and a bulging cap on the same rim — switch between them and the total does not move`),
        drvSay('why that independence is guaranteed rather than lucky',
          'Glue the two surfaces along their shared rim and you get a closed surface. The flux of a curl through any closed surface is zero, because div(curl F) = 0 and the divergence theorem applies. So the two surface integrals must agree — and that identity is d∘d = 0 again.'),
        drvStep('shrink the loop and the theorem defines the curl',
          `(∇${dop('×')}${dv('F')}) ${dop('·')} ${dv('n')} ${dop('=')} ${dlim(dv('A'), '0')} ${dfrac('circulation', dv('A'))}`,
          'circulation per unit area about the axis n — a definition free of coordinates'),
        drvSay('and this is Faraday\'s law in its useful form',
          'Maxwell\'s ∇×E = −∂B/∂t is local and hard to apply. Integrate it over a surface and Stokes converts the left side into the EMF round the loop: the voltage induced in a coil equals the rate of change of flux through it. Every generator and transformer is that conversion.')
      ],
      note:'The two surfaces offered share a rim exactly, so the comparison is fair. Any disagreement in the readout would be discretisation error in the surface mesh, and the panel prints it so its size can be judged.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.cap = o.cap || 'hemisphere';
    st.fld = o.fld || 'swirl';
    st.t = 0;
    st.run = o.run !== false;
    R.cam.az = 0.68; R.cam.el = 0.3; ctCamFit(1.9);
  },
  controls(){
    const st = ST;
    return ctSeg('vcStC', st.cap, [['hemisphere', 'a hemisphere cap'], ['disc', 'a flat disc'],
                                    ['paraboloid', 'a paraboloid cap'], ['cone', 'a cone cap']]) +
      pkSeg('vcStF', VC_FIELDS3, st.fld) +
    pkBoxes('vcown3', st.fld, st, VC_OWN3, null, VC_OWN_HELP) +
      ctChk('vcStrun', 'run the loop', st.run) +
      `<p class="help"><b>∮<sub>∂S</sub> F·dr = ∬<sub>S</sub> (∇ × F)·dS.</b> The circulation around the
      edge of a surface equals the flux of the curl through it. Green's theorem is the special case where
      S lies flat in the plane.</p>
      <p class="help">The claim with real content is that the <b>surface does not matter</b>. Every cap in
      the list has the same boundary — the unit circle in the plane z = 0 — and the flux of the curl
      through all of them is the same number, because the line integral it must equal never noticed which
      cap you chose. Switch between them and watch the flux column stay put while the surface changes
      shape and area completely.</p>
      <p class="help">The reason is the divergence theorem applied to the region between two caps:
      <b>∇·(∇×F) = 0</b> identically, so no net curl-flux can accumulate in the space between them. The two
      great theorems are not independent, and the identity that links them is the one the vector-calculus
      wing's "send ∇×F to F" button demonstrates.</p>`;
  },
  wire(){
    ctWireSeg('vcStC', v => { ST.cap = v; });
    pkWire('vcStF', 'vcown3', ST.fld, ST, VC_OWN3, null, v => { ST.fld = v; });
    ctWireChk('vcStrun', v => { ST.run = v; });
  },
  loop(){ return { t0:0, t1:2 * Math.PI,
    f:t => v3(Math.cos(t), Math.sin(t), 0), d:t => v3(-Math.sin(t), Math.cos(t), 0) }; },
  field(st){ const V = vcCur3(st); return vcField3(V.P, V.Q, V.R); },
  frame(st, dt, ctx, W, H){
    const S = VC_SURFACES[st.cap];
    const fld = this.field(st);
    const L = this.loop();
    if(st.run){ st.t = (st.t + dt * 0.7) % (2 * Math.PI); }
    R.mode2d = false; R.extent = 1.9; R.begin();
    em3dAxes(1.4);
    /* the cap, coloured by the normal component of the curl */
    const nu = 14, nv = 26;
    let mx = 1e-9;
    const patches = [];
    for(let i = 0; i < nu; i++) for(let j = 0; j < nv; j++){
      const u0 = S.u0 + (S.u1 - S.u0) * i / nu, u1 = S.u0 + (S.u1 - S.u0) * (i + 1) / nu;
      const v0 = S.v0 + (S.v1 - S.v0) * j / nv, v1 = S.v0 + (S.v1 - S.v0) * (j + 1) / nv;
      const fr = vcSurfFrame(S, (u0 + u1) / 2, (v0 + v1) / 2);
      const w = vdot(fld.curl(fr.p.x, fr.p.y, fr.p.z), fr.nh);
      patches.push({ u0, u1, v0, v1, w });
      mx = Math.max(mx, Math.abs(w));
    }
    for(const q of patches){
      R.poly([S.r(q.u0, q.v0), S.r(q.u1, q.v0), S.r(q.u1, q.v1), S.r(q.u0, q.v1)],
             rgbCss(rampDiv(q.w / mx), 0.85), rgbCss(TH.bg, 0.4), 0.5, 0.9);
    }
    /* the curl, as arrows through the cap */
    for(let i = 0; i < 5; i++) for(let j = 0; j < 8; j++){
      const u = S.u0 + (S.u1 - S.u0) * (i + 0.5) / 5, v = S.v0 + (S.v1 - S.v0) * (j + 0.5) / 8;
      const fr = vcSurfFrame(S, u, v);
      const c = fld.curl(fr.p.x, fr.p.y, fr.p.z);
      const cl = vlen(c);
      if(cl > 1e-9) R.arrow(fr.p, vmul(c, 0.32 / cl), rgbCss(TH.curl, 0.8), 1.5, 0.85);
    }
    /* the boundary loop, and F along it */
    const rim = [];
    for(let i = 0; i <= 120; i++) rim.push(L.f(L.t0 + (L.t1 - L.t0) * i / 120));
    R.path(rim, rgbCss(TH.text), 3.2, 1);
    const p = L.f(st.t), d = L.d(st.t);
    R.arrow(p, vmul(vnorm(d), 0.42), rgbCss(TH.grad), 2.6, 1);
    const f = fld.F(p.x, p.y, p.z);
    const fl = vlen(f) || 1;
    R.arrow(p, vmul(f, 0.5 / fl), rgbCss(TH.warn), 2.6, 1);
    R.dot(p, 6, rgbCss(TH.text), rgbCss(TH.bg));
    R.flush();
    em3dCaption(ctx, W, H, '∮ F·dr around the edge  =  ∬ (∇×F)·dS through the cap',
      'every cap shares the same boundary — swap them and the flux does not move');
  },
  readout(st){
    const fld = this.field(st);
    const L = this.loop();
    const cur = vcStokesCheck(fld, VC_SURFACES[st.cap], L, 1);
    const others = ['hemisphere', 'disc', 'paraboloid', 'cone'].map(k =>
      ({ k, flux:vcSurfFlux(VC_SURFACES[k], (x, y, z) => fld.curl(x, y, z), 1),
         area:vcSurfArea(VC_SURFACES[k]) }));
    const p = L.f(st.t);
    return `<div class="card tight"><div class="ttl">Both sides</div>
      ${kv('∮ F·dr around the unit circle', fmtNum(cur.circ, 8))}
      ${kv('∬ (∇×F)·dS through the cap', fmtNum(cur.flux, 8))}
      ${kv('difference', fmtAgree(cur.circ, cur.flux))}
      ${kv('curl at the moving point', ctVec3f(fld.curl(p.x, p.y, p.z)))}
      ${kv('F there', ctVec3f(fld.F(p.x, p.y, p.z)))}
    </div>
    <div class="card tight"><div class="ttl">Four different caps, one answer</div>
      ${others.map(o => kv(VC_SURFACES[o.k].name.split('  ')[0],
        `flux ${fmtNum(o.flux, 6)}  ·  area ${fmtNum(o.area, 5)}`)).join('')}
      ${kv('spread in the fluxes', fmtNum(Math.max(...others.map(o => o.flux)) - Math.min(...others.map(o => o.flux)), 4))}
      ${kv('spread in the areas', fmtNum(Math.max(...others.map(o => o.area)) - Math.min(...others.map(o => o.area)), 4))}
      <p class="help">The areas differ by a factor of two; the fluxes agree to quadrature precision. That
      is the surface-independence of Stokes' theorem, and it is the property that makes it useful — when
      faced with a hard surface integral of a curl, replace the surface with any easier one sharing the
      boundary.</p>
    </div>
    <div class="card tight"><div class="ttl">The identity behind it</div>
      ${kv('∇·(∇×F) at (0.4, 0.3, 0.5)', fmtNum((() => {
        const h = 1e-4;
        const dx = (fld.curl(0.4 + h, 0.3, 0.5).x - fld.curl(0.4 - h, 0.3, 0.5).x) / (2 * h);
        const dy = (fld.curl(0.4, 0.3 + h, 0.5).y - fld.curl(0.4, 0.3 - h, 0.5).y) / (2 * h);
        const dz = (fld.curl(0.4, 0.3, 0.5 + h).z - fld.curl(0.4, 0.3, 0.5 - h).z) / (2 * h);
        return dx + dy + dz;
      })(), 4))}
      ${kv('the closed torus, which has no boundary', fmtNum(vcSurfFlux(VC_SURFACES.torus, (x, y, z) => fld.curl(x, y, z), 1), 4))}
      <p class="help">A curl is divergence-free, always, for any smooth field — so its flux through any
      <i>closed</i> surface must vanish, and the torus row confirms it. Glue two caps with the same
      boundary into a closed surface and the same statement says their fluxes are equal, which is exactly
      the previous card. The whole of Stokes' surface-independence is one identity in disguise.</p>
      <p class="help">${vcCur3(st).note}</p>
    </div>`;
  },
  chip(st){
    const cur = vcStokesCheck(this.field(st), VC_SURFACES[st.cap], this.loop(), 1);
    return `<div class="k">Stokes</div>
      <div style="color:var(--c-grad)">∮ = ${fmtNum(cur.circ, 5)}</div>
      <div style="color:var(--c-warn)">∬ = ${fmtNum(cur.flux, 5)}</div>`;
  },
  legend(){ return [['var(--text)', 'the shared boundary'], ['var(--c-grad)', 'the direction of travel'],
                    ['var(--c-warn)', 'F on the boundary'], ['var(--c-curl)', '∇ × F'],
                    ['var(--c-pos)', 'positive curl flux'], ['var(--c-neg)', 'negative']]; }
};

/* ---- 6 · the divergence theorem -------------------------------------------- */
STAGES.vcDiverg = {
  title:'The divergence theorem',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'What leaves a volume equals what was produced inside it',
      steps:[
        drvSay('the bookkeeping statement underneath',
          'If more fluid crosses out of a closed surface than crosses in, the difference had to come from somewhere inside. The theorem is that accounting identity made exact, and it is why divergence deserves the name.'),
        drvStep('the theorem',
          `∯_(∂V) ${dv('F')} ${dop('·')} d${dv('S')} ${dop('=')} ∭_V (∇${dop('·')}${dv('F')}) d${dv('V')}`,
          `radius ${n(st.rr)} — the panel computes the surface flux and the volume integral separately`),
        drvStep('take one small box and add up its six faces',
          `net flux ${dop('≈')} (${dv('P')}ₓ ${dop('+')} ${dv('Q')}_y ${dop('+')} ${dv('R')}_z) Δ${dv('V')}`,
          'each opposite pair differs by a derivative times the face separation'),
        drvSay('so divergence is outflow per unit volume',
          'Again the definition emerges rather than being decreed. P_x + Q_y + R_z is what is left after cancelling the parts of each face pair that agree, and it measures how much the field spreads out at a point.'),
        drvStep('fill the volume with such boxes',
          `Σ over boxes ${dop('=')} ∭ (∇${dop('·')}${dv('F')}) d${dv('V')}`,
          'internal faces are shared by two boxes with opposite outward normals, so they cancel'),
        drvStep('leaving only the outer surface',
          `Σ ${dop('=')} ∯ over ∂${dv('V')}`,
          'the same cancellation argument as Green and Stokes, in three dimensions'),
        drvSay('and this is what makes Gauss\'s law work',
          'The flux of the electric field out of any closed surface equals the enclosed charge over ε₀ — whatever the shape of the surface. That freedom is what the theorem buys, and it is why choosing a sphere for a point charge, or a cylinder for a wire, turns an impossible integral into arithmetic.'),
        drvStep('the inverse-square law is exactly what makes it work',
          `∇${dop('·')}(${dv('r')}̂/${dv('r')}²) ${dop('=')} 0 away from the origin`,
          'the panel evaluates this and it vanishes everywhere except at the source'),
        drvSay('which explains why flux is independent of radius',
          'Field strength falls as 1/r² while surface area grows as r². The two cancel exactly, so every sphere around a charge carries the same flux. Any other power law would break Gauss\'s law — the inverse square is not one option among many, it is the one that makes the field divergence-free in empty space.'),
        drvSay('and continuity equations everywhere have this form',
          '∂ρ/∂t + ∇·J = 0 says charge cannot appear or vanish, only flow. The same equation with different letters conserves mass in fluids, probability in quantum mechanics and energy in thermodynamics. All of them are this theorem applied to an arbitrary volume.')
      ],
      note:'The panel puts the source inside or outside the surface at will. With it inside the flux is the enclosed strength; move it outside and the flux drops to zero — inflow on one side exactly balancing outflow on the other, computed rather than asserted.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.fld = o.fld || 'radial';
    st.rr = o.rr === undefined ? 1 : o.rr;
    st.show = Object.assign({ inside:true }, o.show || {});
    R.cam.az = 0.7; R.cam.el = 0.3; ctCamFit(2.4);
  },
  controls(){
    const st = ST;
    return pkSeg('vcDF', VC_FIELDS3, st.fld) +
      pkBoxes('vcown3', st.fld, st, VC_OWN3, null, VC_OWN_HELP) +
      ctlRow('radius a', ctlSlider('vcDr', 0.4, 1.8, 0.02, st.rr)) +
      ctChk('vcDi', 'show the divergence inside', st.show.inside) +
      `<p class="help"><b>∯<sub>∂E</sub> F·dS = ∭<sub>E</sub> (∇·F) dV.</b> What leaves through the skin
      equals what is produced inside. It is the three-dimensional Green's theorem and it is the reason
      Gauss's law works: the flux out of any closed surface counts the charge within, whatever the shape.</p>
      <p class="help">The sphere's surface is coloured by <b>F·n̂</b> — warm where the field is leaving,
      cool where it is entering — and the interior slice by <b>∇·F</b>. The panel integrates both
      independently and prints the gap. Change the radius and watch the two sides move together.</p>
      <p class="help">Try the <b>inverse-square</b> field. Its divergence is exactly zero at every point
      where it is defined, and yet the flux is 4π at every radius. All of the source is concentrated at the
      one point the field forgot to have a value at — which is what a delta function is, and what a point
      charge is.</p>`;
  },
  wire(){
    pkWire('vcDF', 'vcown3', ST.fld, ST, VC_OWN3, null, v => { ST.fld = v; });
    wireSlider('vcDr', () => ST.rr, v => { ST.rr = v; }, v => fmtNum(+v, 3));
    ctWireChk('vcDi', v => { ST.show.inside = v; });
  },
  field(st){ const V = vcCur3(st); return vcField3(V.P, V.Q, V.R); },
  frame(st, dt, ctx, W, H){
    const fld = this.field(st);
    const a = st.rr;
    R.mode2d = false; R.extent = 2.4; R.begin();
    em3dAxes(1.7);
    /* the sphere of radius a, coloured by the outward normal component */
    const nu = 18, nv = 30;
    let mx = 1e-9;
    const patches = [];
    for(let i = 0; i < nu; i++) for(let j = 0; j < nv; j++){
      const p0 = Math.PI * i / nu, p1 = Math.PI * (i + 1) / nu;
      const t0 = 2 * Math.PI * j / nv, t1 = 2 * Math.PI * (j + 1) / nv;
      const pm = (p0 + p1) / 2, tm = (t0 + t1) / 2;
      const c = gaFromSph(a, pm, tm);
      const w = vdot(fld.F(c.x, c.y, c.z), vnorm(c));
      patches.push({ p0, p1, t0, t1, w, tm });
      if(Number.isFinite(w)) mx = Math.max(mx, Math.abs(w));
    }
    for(const q of patches){
      /* leave a wedge open so the interior slice is visible */
      if(st.show.inside && q.tm > 0.15 && q.tm < 1.35) continue;
      R.poly([gaFromSph(a, q.p0, q.t0), gaFromSph(a, q.p1, q.t0),
              gaFromSph(a, q.p1, q.t1), gaFromSph(a, q.p0, q.t1)],
             rgbCss(rampDiv(q.w / mx), 0.85), rgbCss(TH.bg, 0.35), 0.5, 0.88);
    }
    if(st.show.inside){
      /* the divergence on a slice through the open wedge */
      let dmx = 1e-9;
      const cells = [];
      for(let i = 0; i < 16; i++) for(let j = 0; j < 16; j++){
        const r = a * (i + 0.5) / 16, z = -a + 2 * a * (j + 0.5) / 16;
        if(r * r + z * z > a * a) continue;
        const th = 0.75;
        const p = v3(r * Math.cos(th), r * Math.sin(th), z);
        const d = fld.div(p.x, p.y, p.z);
        if(!Number.isFinite(d)) continue;
        cells.push({ i, j, d, th });
        dmx = Math.max(dmx, Math.abs(d));
      }
      for(const c of cells){
        const r0 = a * c.i / 16, r1 = a * (c.i + 1) / 16;
        const z0 = -a + 2 * a * c.j / 16, z1 = -a + 2 * a * (c.j + 1) / 16;
        const th = c.th;
        R.poly([v3(r0 * Math.cos(th), r0 * Math.sin(th), z0), v3(r1 * Math.cos(th), r1 * Math.sin(th), z0),
                v3(r1 * Math.cos(th), r1 * Math.sin(th), z1), v3(r0 * Math.cos(th), r0 * Math.sin(th), z1)],
               rgbCss(rampDiv(c.d / dmx), 0.75), null, 0, 0.8);
      }
    }
    /* the field, sampled outside and in */
    for(let i = 0; i < 6; i++) for(let j = 0; j < 6; j++) for(let k = 0; k < 3; k++){
      const x = -1.6 + 3.2 * (i + 0.5) / 6, y = -1.6 + 3.2 * (j + 0.5) / 6, z = -1.2 + 2.4 * (k + 0.5) / 3;
      const f = fld.F(x, y, z);
      const L = vlen(f);
      if(!Number.isFinite(L) || L < 1e-9 || L > 1e4) continue;
      R.arrow(v3(x, y, z), vmul(f, 0.3 / L), rgbCss(TH.text, 0.4), 1.1, 0.55);
    }
    R.flush();
    em3dCaption(ctx, W, H, '∯ F·dS through the sphere  =  ∭ ∇·F dV inside it',
      'surface colour is F·n̂ · the open wedge shows ∇·F on a slice');
  },
  readout(st){
    const fld = this.field(st);
    const a = st.rr;
    /* scale the unit-sphere parametrisation to radius a */
    const S = { u0:0, u1:Math.PI, v0:0, v1:2 * Math.PI,
      r:(u, v) => vmul(v3(Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)), a) };
    const flux = vcSurfFlux(S, fld.F, 1);
    const vol = vcBallDivIntegral(fld, a);
    const V = vcCur3(st);
    const half = vcSurfFlux(S, fld.F, 1);
    /* a cylinder, as a second region — the theorem is not about spheres */
    const cylFlux = (() => {
      /* u is the angle and v the height, which makes
         r_u × r_v = (a cos u, a sin u, 0) — radially outward, the orientation
         the theorem asks for. Taking the two parameters the other way round
         reverses that cross product and measures the flux *into* the cylinder.
         This stage shipped with them the other way round, and it went unnoticed
         because the side flux of every preset except the radial and inverse
         fields vanishes by symmetry, so the sign had nothing to act on. */
      const side = { u0:0, u1:2 * Math.PI, v0:0, v1:1.4,
        r:(u, v) => v3(a * Math.cos(u), a * Math.sin(u), v) };
      /* each cap is parametrised by radius and angle, giving r_u × r_v = (0,0,u)
         — up on both, so the bottom's outward normal is the one to negate */
      const top = { u0:0, u1:a, v0:0, v1:2 * Math.PI,
        r:(u, v) => v3(u * Math.cos(v), u * Math.sin(v), 1.4) };
      const bot = { u0:0, u1:a, v0:0, v1:2 * Math.PI,
        r:(u, v) => v3(u * Math.cos(v), u * Math.sin(v), 0) };
      return vcSurfFlux(side, fld.F, 1) + vcSurfFlux(top, fld.F, 1) - vcSurfFlux(bot, fld.F, 1);
    })();
    const cylVol = vcCylDivIntegral(fld, a, 1.4);
    return `<div class="card tight"><div class="ttl">The sphere of radius ${fmtNum(a, 3)}</div>
      ${kv('∯ F·dS  (outward)', fmtNum(flux, 8))}
      ${kv('∭ ∇·F dV', fmtNum(vol, 8))}
      ${kv('difference', fmtAgree(flux, vol))}
      ${kv('surface area 4πa²', fmtNum(4 * Math.PI * a * a, 7))}
      ${kv('volume 4πa³/3', fmtNum(4 * Math.PI * a * a * a / 3, 7))}
      ${kv('average of F·n̂ over the surface', fmtNum(flux / (4 * Math.PI * a * a), 7))}
      ${kv('average of ∇·F over the volume', fmtNum(vol / (4 * Math.PI * a * a * a / 3), 7))}
    </div>
    <div class="card tight"><div class="ttl">A cylinder, to show it is not about spheres</div>
      ${kv('∯ F·dS  (side + two caps)', fmtNum(cylFlux, 7))}
      ${kv('∭ ∇·F dV', fmtNum(cylVol, 7))}
      ${kv('difference', fmtAgree(cylFlux, cylVol))}
      <p class="help">Three separate surface integrals — the curved side and the two flat caps, each with
      its normal chosen to point out of the solid — added up and compared with one volume integral. Getting
      the cap orientations right is most of the work in a hand calculation, and it is the step where signs
      go wrong.</p>
      ${Math.abs(cylFlux - cylVol) < 1e-6
        ? `<p class="help">The two sides share no code: one is a sum of surface quadratures, the other a
           triple integral in cylindrical coordinates. They agree to ${fmtNum(Math.abs(cylFlux - cylVol), 3)},
           which is discretisation and not disagreement.</p>`
        : `<p class="help"><b>That difference is not a numerical error, and it is the most interesting thing
           on this panel.</b> The divergence theorem asks that <b>F</b> be continuously differentiable
           <i>throughout</i> the region, and somewhere in this one it is not. ∇·F is zero everywhere the
           volume quadrature is able to sample, so that side reports essentially nothing, while the surface
           still carries the entire flux of the source. For the inverse-square field the missing point is the
           origin — which sits at the centre of the <i>bottom face</i>, on the boundary rather than strictly
           inside it. A surface enclosing a point source collects 4π; this one subtends only half the
           directions around that point, so it collects <b>2π = ${fmtNum(2 * Math.PI, 7)}</b>. The theorem has
           not failed. Its hypothesis has, and the size of the gap is exactly the source the volume integral
           could not see.</p>`}
    </div>
    <div class="card tight"><div class="ttl">The field</div>
      ${kv('F', V.name)}
      ${kv('∇·F at (0.3, 0.4, 0.2)', fmtNum(fld.div(0.3, 0.4, 0.2), 6))}
      ${kv('∇×F there', ctVec3f(fld.curl(0.3, 0.4, 0.2)))}
      <p class="help">${V.note}</p>
      <p class="help">Divergence is defined as the limit of flux per unit volume over a shrinking region —
      which is the divergence theorem read backwards, applied to an infinitesimal box. The theorem is then
      the statement that these local rates add up correctly across a large region, and the reason they do
      is the same cancellation that drives Green's theorem: the shared face between two adjacent boxes is
      counted twice with opposite normals.</p>
    </div>`;
  },
  chip(st){
    const fld = this.field(st), a = st.rr;
    const S = { u0:0, u1:Math.PI, v0:0, v1:2 * Math.PI,
      r:(u, v) => vmul(v3(Math.sin(u) * Math.cos(v), Math.sin(u) * Math.sin(v), Math.cos(u)), a) };
    return `<div class="k">divergence theorem</div>
      <div style="color:var(--c-grad)">∯ = ${fmtNum(vcSurfFlux(S, fld.F, 1), 5)}</div>
      <div style="color:var(--c-warn)">∭ = ${fmtNum(vcBallDivIntegral(fld, a), 5)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'field leaving the surface'], ['var(--c-neg)', 'field entering'],
                    ['var(--c-pos)', 'positive divergence inside']]; }
};
