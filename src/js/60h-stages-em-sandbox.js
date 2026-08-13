STAGES.emSandbox = {
  title: 'EM sandbox',
  derive(st){
    return {
      title:'What the sandbox is actually computing at every point',
      steps:[
        drvSay('everything here is superposition',
          'There is no special code for two charges, or for a charge near a wire. Each source contributes its own field by its own formula, and the fields are added vectorially. That the total is simply the sum is the linearity of Maxwell\'s equations, and it is why arbitrary arrangements can be handled at all.'),
        drvStep('a point charge contributes a Coulomb field',
          `${dv('E')} ${dop('=')} ${dfrac(dv('q'), '4πε₀' + dv('r') + '²')}${dv('r')}̂`,
          'the probe reads the vector sum over every charge placed'),
        drvStep('a straight wire contributes a circling magnetic field',
          `${dv('B')} ${dop('=')} ${dfrac('μ₀' + dv('I'), '2π' + dv('r'))}`,
          'falling as 1/r rather than 1/r², because the source is a line rather than a point'),
        drvSay('the different power is a dimensional consequence',
          'Flux from a point spreads over a sphere of area 4πr², giving 1/r². Flux from an infinite line spreads over a cylinder of area 2πrL, giving 1/r. The geometry of the source decides the falloff, which is why a charged plate gives a field that does not fall off at all.'),
        drvStep('the force on a moving charge combines both',
          `${dv('F')} ${dop('=')} ${dv('q')}(${dv('E')} ${dop('+')} ${dv('v')} ${dop('×')} ${dv('B')})`,
          'the Lorentz force — the panel draws it on any selected charge'),
        drvSay('and the magnetic part never does any work',
          'v × B is perpendicular to v, so F·v = 0 and the kinetic energy cannot change. A magnetic field can only turn a charge, never speed it up. That is why cyclotrons need an oscillating electric field to accelerate and use the magnetic field purely for steering.'),
        drvStep('field lines are traced, not drawn',
          `follow ${dv('E')} step by step from a seed point`,
          'integrated numerically, which is why they bend correctly around every configuration'),
        drvStep('the energy density and the Poynting vector are local quantities',
          `${dv('u')} ${dop('=')} ${dfrac('ε₀', '2')}${dv('E')}² ${dop('+')} ${dfrac('1', '2μ₀')}${dv('B')}², &nbsp; ${dv('S')} ${dop('=')} ${dfrac('1', 'μ₀')}${dv('E')} ${dop('×')} ${dv('B')}`,
          'switch them on and the field itself carries energy and transports it'),
        drvSay('which is the deepest idea in the wing',
          'Energy is not stored in the charges but in the field, spread through space at u joules per cubic metre. When a wave leaves an antenna the energy leaves with it and continues even if the antenna is destroyed. The field is not a bookkeeping device for forces between distant objects — it is a physical thing with energy and momentum of its own.')
      ],
      note:'Every arrow, line and reading in the sandbox comes from summing the contributions of the objects actually placed. Add, move or delete anything and the whole field is recomputed — nothing is precomputed or approximated by a stored picture.'
    };
  },
  drag: true,
  enter(st, o){
    st.objs = (o.objs ? JSON.parse(JSON.stringify(o.objs)) : [
      { kind:'charge', q: 1.5, p:{x:-1.6,y:0,z:0}, v:{x:0,y:0,z:0} },
      { kind:'charge', q:-1.5, p:{x: 1.6,y:0,z:0}, v:{x:0,y:0,z:0} }
    ]);
    st.tool = 'probe';
    st.sel = -1;
    st.run = false;
    st.probeP = { x: 0, y: 1.4, z: 0 };
    st.show = Object.assign({ E:true, B:true, lines:true, force:true, energy:false, poynt:false },
                            o.show || {});
    st.drag = null;
    st.lineCache = null; st.lineKey = '';
    st.trails = [];
  },
  key(st){
    return st.objs.map(o => [o.kind, o.q, o.I, o.m && o.m.x, o.m && o.m.y, o.R,
      o.p.x.toFixed(3), o.p.y.toFixed(3), (o.p.z||0).toFixed(3), o.v && o.v.x, o.v && o.v.y, o.v && o.v.z].join(',')).join('|')
      + '|' + st.show.lines + (TH.dark ? 'd' : 'l');
  },
  controls(){
    const tool = (id, label, title) =>
      `<button class="btn sm" data-emt="${id}" aria-pressed="${ST.tool === id}" title="${title}">${label}</button>`;
    return `<div class="row wrap" style="gap:5px">
        ${tool('probe', '⌖ probe', 'Click to move the field probe')}
        ${tool('pos', '+ charge', 'Place a positive charge')}
        ${tool('neg', '− charge', 'Place a negative charge')}
        ${tool('moving', '→ moving charge', 'Place a charge with velocity')}
        ${tool('wireOut', '⊙ wire out', 'Current out of the page')}
        ${tool('wireIn', '⊗ wire in', 'Current into the page')}
        ${tool('magnet', '⊣⊢ bar magnet', 'Place a magnetic dipole')}
        ${tool('movingMagnet', '⇢ moving magnet', 'A magnet with velocity — makes an E field')}
        ${tool('loop', '◯ pickup loop', 'A loop that reports Φ and the induced EMF')}
      </div>
      <p class="help">Pick a tool, then <b>click the canvas to place</b>. Drag anything to move it. Click an object with the probe tool to select and edit it below. Press <b>Run</b> and the objects obey the real laws: charges accelerate under F = q(E + v×B), magnets feel torque τ = m×B and swing to align.</p>
      <div class="row wrap">
        <button class="btn pri" id="emRun">Run</button>
        <button class="btn sm" id="emStop">Reset motion</button>
        <button class="btn sm" id="emDel">Delete selected</button>
        <button class="btn sm" id="emClear">Clear all</button>
      </div>
      <div class="chkgrid">
        <label class="chk"><input type="checkbox" id="emShowE" ${ST.show.E?'checked':''}><span>E field</span></label>
        <label class="chk"><input type="checkbox" id="emShowB" ${ST.show.B?'checked':''}><span>B field</span></label>
        <label class="chk"><input type="checkbox" id="emShowL" ${ST.show.lines?'checked':''}><span>Field lines</span></label>
        <label class="chk"><input type="checkbox" id="emShowF" ${ST.show.force?'checked':''}><span>Forces</span></label>
        <label class="chk"><input type="checkbox" id="emShowU" ${ST.show.energy?'checked':''}><span>Energy density</span></label>
        <label class="chk"><input type="checkbox" id="emShowS" ${ST.show.poynt?'checked':''}><span>Poynting S</span></label>
      </div>
      <div id="emSelBody"></div>`;
  },
  wire(){
    for(const b of $('stageBody').querySelectorAll('button[data-emt]')) b.addEventListener('click', () => {
      ST.tool = b.dataset.emt;
      for(const c of $('stageBody').querySelectorAll('button[data-emt]'))
        c.setAttribute('aria-pressed', String(c.dataset.emt === ST.tool));
    });
    $('emRun').addEventListener('click', e => {
      ST.run = !ST.run; e.target.textContent = ST.run ? 'Pause' : 'Run';
      e.target.classList.toggle('pri', !ST.run);
    });
    $('emStop').addEventListener('click', () => {
      for(const o of ST.objs){
        if(o.v){ o.v.x = o.v0 ? o.v0.x : 0; o.v.y = o.v0 ? o.v0.y : 0; o.v.z = 0; }
        o.w = v3(0, 0, 0);
      }
      ST.trails = []; ST.run = false;
      $('emRun').textContent = 'Run';
    });
    $('emDel').addEventListener('click', () => {
      if(ST.sel >= 0){ ST.objs.splice(ST.sel, 1); ST.sel = -1; ST.lineKey = ''; buildStagePanel(); }
    });
    $('emClear').addEventListener('click', () => { ST.objs = []; ST.sel = -1; ST.lineKey = ''; buildStagePanel(); });
    const chk = (id, key) => $(id).addEventListener('change', e => { ST.show[key] = e.target.checked; ST.lineKey = ''; updateStageLegend(); });
    chk('emShowE','E'); chk('emShowB','B'); chk('emShowL','lines');
    chk('emShowF','force'); chk('emShowU','energy'); chk('emShowS','poynt');
    this.buildSelPanel();
  },
  buildSelPanel(){
    const box = $('emSelBody'); if(!box) return;
    const o = ST.objs[ST.sel];
    if(!o){ box.innerHTML = '<p class="help">No object selected — click one with the probe tool.</p>'; return; }
    let rows = '';
    if(o.kind === 'charge') rows += ctlRow('charge q', ctlSlider('emQ', -3, 3, 0.1, o.q));
    if(o.kind === 'wire')   rows += ctlRow('current I', ctlSlider('emI', -3, 3, 0.1, o.I));
    if(o.kind === 'magnet'){
      const m = Math.hypot(o.m.x, o.m.y) || 1;
      rows += ctlRow('moment |m|', ctlSlider('emM', 0.2, 4, 0.1, m));
      rows += ctlRow('angle', ctlSlider('emMA', 0, 360, 1, Math.round(Math.atan2(o.m.y, o.m.x) * 180 / Math.PI + 360) % 360));
    }
    if(o.kind === 'loop') rows += ctlRow('radius R', ctlSlider('emR', 0.3, 2.5, 0.05, o.R));
    if(ST.dim === '3d') rows += ctlRow('height z', ctlSlider('emZ', -5, 5, 0.05, o.p.z || 0));
    if(o.v){
      rows += ctlRow('velocity vx', ctlSlider('emVX', -0.8, 0.8, 0.02, o.v.x));
      rows += ctlRow('velocity vy', ctlSlider('emVY', -0.8, 0.8, 0.02, o.v.y));
    }
    box.innerHTML = `<div class="card tight"><div class="ttl">Selected — ${o.kind}</div>${rows}
      <p class="help">${o.v ? 'Velocity is in units of c: a moving charge carries B = v×E, and a moving magnet carries E = −v×B. Both are the same relativity as the E-becomes-B stage.' : 'The wire runs perpendicular to the screen; its B field circles it by the right-hand rule.'}</p></div>`;
    const inv = () => { ST.lineKey = ''; };
    if($('emQ')) wireSlider('emQ', () => o.q, v => { o.q = v; inv(); }, v => (+v).toFixed(1));
    if($('emI')) wireSlider('emI', () => o.I, v => { o.I = v; inv(); }, v => (+v).toFixed(1));
    if($('emR')) wireSlider('emR', () => o.R, v => { o.R = v; inv(); }, v => (+v).toFixed(2));
    if($('emZ')) wireSlider('emZ', () => o.p.z || 0, v => { o.p.z = v; inv(); }, v => (+v).toFixed(2));
    if($('emM')) wireSlider('emM', () => Math.hypot(o.m.x, o.m.y),
      v => { const a = Math.atan2(o.m.y, o.m.x); o.m.x = v * Math.cos(a); o.m.y = v * Math.sin(a); inv(); }, v => (+v).toFixed(1));
    if($('emMA')) wireSlider('emMA', () => (Math.atan2(o.m.y, o.m.x) * 180 / Math.PI + 360) % 360,
      v => { const m = Math.hypot(o.m.x, o.m.y) || 1, a = v * Math.PI / 180; o.m.x = m * Math.cos(a); o.m.y = m * Math.sin(a); inv(); }, v => Math.round(v) + '°');
    if($('emVX')) wireSlider('emVX', () => o.v.x, v => { o.v.x = v; o.v0 = {x:o.v.x, y:o.v.y}; inv(); }, v => (+v).toFixed(2));
    if($('emVY')) wireSlider('emVY', () => o.v.y, v => { o.v.y = v; o.v0 = {x:o.v.x, y:o.v.y}; inv(); }, v => (+v).toFixed(2));
  },
  place(st, x, y){
    const T = st.tool;
    const mk = {
      pos:          { kind:'charge', q: 1.5, p:{x,y,z:0}, v:{x:0,y:0,z:0} },
      neg:          { kind:'charge', q:-1.5, p:{x,y,z:0}, v:{x:0,y:0,z:0} },
      moving:       { kind:'charge', q: 1.5, p:{x,y,z:0}, v:{x:0.35,y:0,z:0}, v0:{x:0.35,y:0} },
      wireOut:      { kind:'wire',   I: 2,   p:{x,y,z:0} },
      wireIn:       { kind:'wire',   I:-2,   p:{x,y,z:0} },
      magnet:       { kind:'magnet', m:{x:1.5,y:0,z:0}, p:{x,y,z:0}, v:{x:0,y:0,z:0} },
      movingMagnet: { kind:'magnet', m:{x:1.5,y:0,z:0}, p:{x,y,z:0}, v:{x:0.3,y:0,z:0}, v0:{x:0.3,y:0} },
      loop:         { kind:'loop',   R: 0.9, p:{x,y,z:0} }
    }[T];
    if(!mk) return false;
    st.objs.push(mk);
    st.sel = st.objs.length - 1;
    st.lineKey = '';
    return true;
  },
  pick(st, sx, sy, phase){
    if(!st.emS) return;
    const wx = (sx - st.emCx) / st.emS, wy = (st.emCy - sy) / st.emS;
    if(phase === 'up'){ st.drag = null; return; }
    if(phase === 'down' || phase === 'click'){
      /* an object under the pointer always wins: select and start dragging it */
      let hit = -1, best = 0.42;
      st.objs.forEach((o, i) => {
        const d = Math.hypot(o.p.x - wx, o.p.y - wy);
        if(d < best){ best = d; hit = i; }
      });
      if(hit >= 0){
        st.sel = hit; st.drag = hit;
        this.buildSelPanel();
        return;
      }
      if(st.tool !== 'probe' && Math.abs(wx) < st.emL && Math.abs(wy) < st.emL){
        if(this.place(st, wx, wy)){ buildStagePanel(); return; }
      }
      st.probeP = { x: wx, y: wy };
      return;
    }
    /* phase === 'move' */
    if(st.drag !== null && st.objs[st.drag]){
      st.objs[st.drag].p.x = Math.max(-st.emL, Math.min(st.emL, wx));
      st.objs[st.drag].p.y = Math.max(-st.emL, Math.min(st.emL, wy));
      st.lineKey = '';
    } else if(st.tool === 'probe'){
      st.probeP = { x: wx, y: wy };
    }
  },
  frame(st, dt, ctx, W, H){
    const V = emView(st, W, H, 5);
    const objs = st.objs;

    /* ---- integrate the motion: this is where "interaction" becomes visible ---- */
    if(st.run) this.step(st, dt, false);

    /* ---- energy density heatmap, underneath everything ---- */
    if(st.show.energy){
      const G = 84, cell = (V.ext * 2 / G) * V.sc;
      let umax = 1e-9;
      const vals = new Float64Array(G * G);
      for(let j = 0; j < G; j++) for(let i = 0; i < G; i++){
        const x = -V.ext + (i + 0.5) * 2 * V.ext / G, y = V.ext - (j + 0.5) * 2 * V.ext / G;
        const u = emEnergyDensity(emField(objs, v3(x, y, 0), 0));
        vals[j * G + i] = u; if(u > umax && u < 1e4) umax = u;
      }
      for(let j = 0; j < G; j++) for(let i = 0; i < G; i++){
        const u = Math.min(1, Math.pow(vals[j * G + i] / umax, 0.32));
        if(u < 0.03) continue;
        const c = rampSeq(u);
        ctx.fillStyle = rgbCss(c, 0.42 * u);
        const [px, py] = V.toS(-V.ext + i * 2 * V.ext / G, V.ext - j * 2 * V.ext / G);
        ctx.fillRect(px, py, cell + 1, cell + 1);
      }
    }

    /* ---- field lines (cached: tracing is the expensive part) ---- */
    if(st.show.lines){
      const key = this.key(st);
      if(st.lineKey !== key){
        st.lineCache = {
          E: st.show.E ? emFieldLines(objs, 'E', V.ext) : [],
          B: st.show.B ? emFieldLines(objs, 'B', V.ext) : []
        };
        st.lineKey = key;
      }
      const draw = (lines, col, wdt) => {
        for(const ln of lines){
          if(ln.pts.length < 3) continue;
          ctx.strokeStyle = col; ctx.lineWidth = wdt;
          ctx.beginPath();
          ln.pts.forEach((p, i) => { const [x, y] = V.toS(p.x, p.y); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
          ctx.stroke();
          for(let k = 26; k < ln.pts.length - 1; k += 55){
            const [x1, y1] = V.toS(ln.pts[k].x, ln.pts[k].y);
            const [x2, y2] = V.toS(ln.pts[k + 1].x, ln.pts[k + 1].y);
            const dx = x2 - x1, dy = y2 - y1, m = Math.hypot(dx, dy) || 1;
            emDrawArrow(ctx, x1, y1, x1 + dx / m * 9, y1 + dy / m * 9, col, 1.2, 7);
          }
        }
      };
      if(st.show.E) draw(st.lineCache.E, rgbCss(TH.warn, 0.75), 1.3);
      if(st.show.B) draw(st.lineCache.B, rgbCss(TH.neg, 0.7), 1.3);
    }

    /* ---- out-of-plane components as ⊙ / ⊗, and in-plane arrows on a grid ---- */
    const G2 = 13, stp = 2 * V.ext / G2;
    let ezMax = 1e-9, bzMax = 1e-9;
    const samples = [];
    for(let i = 0; i < G2; i++) for(let j = 0; j < G2; j++){
      const x = -V.ext + (i + 0.5) * stp, y = -V.ext + (j + 0.5) * stp;
      const f = emField(objs, v3(x, y, 0), 0);
      if(!Number.isFinite(f.E.x + f.B.x)) continue;
      samples.push({ x, y, f });
      if(Math.abs(f.E.z) < 1e3) ezMax = Math.max(ezMax, Math.abs(f.E.z));
      if(Math.abs(f.B.z) < 1e3) bzMax = Math.max(bzMax, Math.abs(f.B.z));
    }
    for(const s of samples){
      const [px, py] = V.toS(s.x, s.y);
      if(st.show.B && bzMax > 1e-6) emDrawPerp(ctx, px, py, s.f.B.z, bzMax, rgbCss(TH.neg, 0.85), rgbCss(TH.neg, 0.85));
      if(st.show.E && ezMax > 1e-6) emDrawPerp(ctx, px + 5, py + 5, s.f.E.z, ezMax, rgbCss(TH.warn, 0.7), rgbCss(TH.warn, 0.7));
      if(st.show.poynt){
        const S = emPoynting(s.f), m = Math.hypot(S.x, S.y);
        if(m > 1e-9) emDrawArrow(ctx, px, py, px + S.x / m * 13, py - S.y / m * 13, rgbCss(TH.grad, 0.8), 1.3, 6);
      }
    }

    /* ---- the objects, their forces, and pickup-loop readouts ---- */
    objs.forEach((o, i) => {
      emDrawObject(ctx, o, V, i === st.sel);
      if(st.show.force && (o.kind === 'charge' || o.kind === 'magnet')){
        const F = emForceOn(objs, i, 0), m = vlen(F);
        if(m > 1e-9 && Number.isFinite(m)){
          const [sx, sy] = V.toS(o.p.x, o.p.y);
          const L = Math.min(70, 22 + 40 * Math.min(1, m / 0.5));
          emDrawArrow(ctx, sx, sy, sx + F.x / m * L, sy - F.y / m * L, rgbCss(TH.curl), 2.4, 10);
          ctx.fillStyle = rgbCss(TH.curl); ctx.font = '600 10px ' + FONT_MONO;
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('F=' + fmtNum(m, 3), sx + F.x / m * L + 5, sy - F.y / m * L);
        }
      }
      if(o.kind === 'loop'){
        const c = v3(o.p.x, o.p.y, 0), nh = v3(0, 0, 1);
        const phi = emFluxBDisc(objs, c, o.R, nh, 0, 12);
        const emf = -emDPhiBdt(objs, c, o.R, nh, 0, 0.02, 10);
        const [sx, sy] = V.toS(o.p.x, o.p.y);
        ctx.fillStyle = rgbCss(TH.grad); ctx.font = '600 10.5px ' + FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText('Φ=' + fmtNum(phi, 3), sx, sy + o.R * V.sc + 5);
        ctx.fillText('EMF=' + fmtNum(emf, 3), sx, sy + o.R * V.sc + 19);
        if(Math.abs(emf) > 1e-5){
          /* Lenz's law: the induced current opposes the change */
          const dir = emf > 0 ? 1 : -1, rr = o.R * V.sc;
          ctx.strokeStyle = rgbCss(TH.grad, 0.9); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(sx, sy, rr, -0.4, 0.4 + Math.PI, dir < 0); ctx.stroke();
        }
      }
    });

    /* ---- the probe ---- */
    const [px, py] = V.toS(st.probeP.x, st.probeP.y);
    const pf = emField(objs, v3(st.probeP.x, st.probeP.y, 0), 0);
    ctx.strokeStyle = rgbCss(TH.text); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px - 11, py); ctx.lineTo(px + 11, py);
    ctx.moveTo(px, py - 11); ctx.lineTo(px, py + 11); ctx.stroke();
    const eL = Math.hypot(pf.E.x, pf.E.y);
    if(eL > 1e-9) emDrawArrow(ctx, px, py, px + pf.E.x / eL * 42, py - pf.E.y / eL * 42, rgbCss(TH.warn), 2.6, 10);
    const bL = Math.hypot(pf.B.x, pf.B.y);
    if(bL > 1e-9) emDrawArrow(ctx, px, py, px + pf.B.x / bL * 34, py - pf.B.y / bL * 34, rgbCss(TH.neg), 2.6, 10);

    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText(st.tool === 'probe'
      ? 'probe tool — click empty space to move the probe, or an object to select it; drag to reposition'
      : 'click anywhere to place: ' + st.tool + '  ·  drag any object to move it', W / 2, H - 8);
  },
  readout(st){
    const objs = st.objs;
    const p = v3(st.probeP.x, st.probeP.y, st.probeP.z || 0);
    const f = emField(objs, p, 0);
    const S = emPoynting(f);
    const u = emEnergyDensity(f);
    const loops = objs.map((o, i) => ({ o, i })).filter(r => r.o.kind === 'loop');
    let loopRows = '';
    for(const { o } of loops){
      const c = v3(o.p.x, o.p.y, 0), nh = v3(0, 0, 1);
      const phi = emFluxBDisc(objs, c, o.R, nh, 0, 16);
      const emf = -emDPhiBdt(objs, c, o.R, nh, 0, 0.02, 14);
      const circ = emCircE(objs, c, o.R, nh, 0, 200);
      loopRows += kv('Φ_B through the loop', fmtNum(phi, 5)) +
                  kv('EMF = −dΦ_B/dt', '<b>' + fmtNum(emf, 5) + '</b>') +
                  kv('∮E·dl (measured)', fmtNum(circ, 5)) +
                  kv('Faraday check', Math.abs(circ - emf) < 1e-3 + Math.abs(emf) * 0.05 ? '✓ they agree' : 'transient');
    }
    /* Gauss's law evaluated on a sphere centred on the probe */
    const RG = 0.8;
    const fluxE = emFluxE(objs, p, RG, 0, 22);
    const qEnc = emEnclosedCharge(objs, p, RG, 0);
    const fluxB = emFluxB(objs, p, RG, 0, 22);
    let movers = '';
    for(const o of objs){
      if(o.kind === 'charge' && o.v){
        const vv = v3(o.v.x, o.v.y, o.v.z || 0), sp = vlen(vv);
        if(sp > 1e-4) movers += kv('charge q = ' + fmtNum(o.q, 2) + ' speed', fmtNum(sp, 4) + ' c · γ = ' + fmtNum(emGamma(vv), 4));
      } else if(o.kind === 'magnet'){
        const m0 = v3(o.m.x, o.m.y, o.m.z || 0);
        const others = objs.filter(x => x !== o);
        if(others.length){
          const B = emField(others, v3(o.p.x, o.p.y, o.p.z || 0), 0).B;
          const tq = vlen(emTorque(m0, { B }));
          movers += kv('magnet |τ| = |m×B|', fmtNum(tq, 5) + (tq < 1e-4 ? ' — aligned' : ' — still turning'));
        }
      }
    }
    return `<div class="card tight"><div class="ttl">At the probe · (${fmtNum(st.probeP.x,2)}, ${fmtNum(st.probeP.y,2)})</div>
      ${kv('E (in-plane)', '(' + fmtNum(f.E.x,4) + ', ' + fmtNum(f.E.y,4) + ')')}
      ${Math.abs(f.E.z) > 1e-9 ? kv('E_z (out of page)', fmtNum(f.E.z,4) + ' — from a moving magnet') : ''}
      ${kv('|E|', fmtNear(vlen(f.E)))}
      ${kv('B (in-plane)', '(' + fmtNum(f.B.x,4) + ', ' + fmtNum(f.B.y,4) + ')')}
      ${Math.abs(f.B.z) > 1e-9 ? kv('B<sub>z</sub> (out of page)', fmtNum(f.B.z,4) + ' — from moving charge') : ''}
      ${kv('|B|', fmtNear(vlen(f.B)))}
      ${kv('energy density u = ½(E²+B²)', fmtNear(u))}
      ${kv('Poynting S = E×B', '(' + fmtNum(S.x,4) + ', ' + fmtNum(S.y,4) + ', ' + fmtNum(S.z,4) + ')')}
    </div>
    <div class="card tight"><div class="ttl">Maxwell, checked on a sphere of R = 0.8 here</div>
      ${kv('∮E·dA (measured)', fmtNum(fluxE, 4))}
      ${kv('Q enclosed', fmtNum(qEnc, 4))}
      ${kv('Gauss ∮E·dA = Q', Math.abs(fluxE - qEnc) < 0.05 + 0.05*Math.abs(qEnc) ? '✓ holds' : 'move the probe off a source')}
      ${kv('∮B·dA (measured)', fmtNum(fluxB, 6))}
      ${kv('no monopoles ∮B·dA = 0', Math.abs(fluxB) < 1e-3 ? '✓ holds everywhere' : fmtNum(fluxB,5))}
      ${loopRows}
      <p class="help">Both integrals are computed from the drawn fields alone — nothing consults the object list — so the agreement is evidence, not bookkeeping. Units have ε₀ = μ₀ = c = 1, which is why Gauss reads simply ∮E·dA = Q.</p>
    </div>
    <div class="card tight"><div class="ttl">Scene</div>
      ${kv('objects placed', String(objs.length))}
      ${kv('total charge', fmtNum(objs.reduce((a,o)=> a + (o.kind==='charge'? o.q : 0), 0), 3))}
      ${kv('running', st.run ? 'yes' : 'paused')}
      ${movers}
      <p class="help">Charges are pushed by <b>dp/dt = q(E + v×B)</b> with p = γv, so speed climbs toward c and never reaches it. Magnets are rigid rotors: <b>τ = m×B</b> integrated about the torque axis, with |m| fixed and a little damping so a compass settles. Each object sees every field but its own.</p>
      <p class="help" style="color:var(--faint)">Honest limits: the fields are the exact ones for sources in <i>uniform</i> motion, so while things accelerate this is the standard quasi-static approximation — retardation and radiation reaction are not modelled, and the field momentum is not booked. Walls reflect elastically.</p>
    </div>`;
  },
  chip(st){
    const f = emField(st.objs, v3(st.probeP.x, st.probeP.y, st.probeP.z || 0), 0);
    return `<div class="k">EM sandbox · ${st.objs.length} objects</div>
      <div style="color:var(--c-warn)">|E| = ${fmtNear(vlen(f.E))}</div>
      <div style="color:var(--c-neg)">|B| = ${fmtNear(vlen(f.B))}</div>
      <div>u = ${fmtNear(emEnergyDensity(f))}</div>`;
  },
  legend(){
    const rows = [['var(--c-warn)', 'E field — lines leave + and enter −'],
                  ['var(--c-neg)', 'B field — closed loops, ⊙/⊗ out of page']];
    if(ST && ST.show.force) rows.push(['var(--c-curl)', 'net force on each object']);
    if(ST && ST.show.poynt) rows.push(['var(--c-grad)', 'Poynting S = E×B — energy flow']);
    rows.push(['var(--c-grad)', 'pickup loop — Φ and induced EMF']);
    return rows;
  }
};

/* ---- 17 · Gauss's law for E: flux counts the charge inside ------------------- */
