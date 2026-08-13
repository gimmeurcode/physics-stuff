/* ============================================================================
   THE STAGE
   ============================================================================ */
STAGES.ckLab = {
  title: 'Circuit bench',
  derive(st){
    return {
      title:'How a circuit simulator actually solves a circuit',
      steps:[
        drvSay('the problem to be solved',
          'A netlist gives components and how they connect. What is wanted are all the node voltages and branch currents. Both Kirchhoff laws must hold everywhere at once, so this is a simultaneous system rather than something to work through element by element.'),
        drvSay('and where the netlist comes from here',
          'This bench is drawn rather than written, so it does the opposite of a simulator first: it recovers the netlist from the geometry. Two points are one node when they touch, and two wires that merely cross share nothing — exactly the convention paper uses. That is also why the text box below has to place what it reads. Every node it meets becomes a vertical rail and every part a row of its own, set down at a column where neither the body nor its pins can land on a rail; a lead then reaches its node across whatever rails lie in between, crossing without connecting. Placement is not decoration here. A lead forced to double back over its own part would run through the other pin, and a wire through a pin is a short.'),
        drvStep('Kirchhoff\'s current law at each node',
          `Σ ${dv('I')}_in ${dop('=')} Σ ${dv('I')}_out`,
          'charge does not accumulate at a junction — one equation per node'),
        drvStep('and each component relates its current to its voltage',
          `${dv('I')} ${dop('=')} ${dv('V')}/${dv('R')}, &nbsp; ${dv('I')} ${dop('=')} ${dv('C')}${dfrac('d' + dv('V'), 'd' + dv('t'))}, &nbsp; ${dv('V')} ${dop('=')} ${dv('L')}${dfrac('d' + dv('I'), 'd' + dv('t'))}`,
          'substituting these into KCL leaves only node voltages as unknowns'),
        drvSay('that substitution is what modified nodal analysis is',
          'Write KCL at every node in terms of voltages, and add one extra unknown and equation for each voltage source, whose current cannot be written from its voltage. The result is a square linear system — and the linear-algebra wing solves it.'),
        drvStep('so each timestep is a matrix solve',
          `${dv('G')}${dv('v')} ${dop('=')} ${dv('i')}`,
          'the conductance matrix is sparse and symmetric for resistive networks'),
        drvStep('capacitors and inductors become resistors plus sources',
          `${dv('C')}${dfrac('d' + dv('V'), 'd' + dv('t'))} ${dop('→')} ${dfrac(dv('C'), 'Δ' + dv('t'))}(${dv('V')}ₙ ${dop('−')} ${dv('V')}ₙ₋₁)`,
          'the companion model — a discretised derivative, which is the ODE wing\'s backward Euler step'),
        drvSay('so a transient simulation is an ODE solver wearing a circuit costume',
          'Each timestep converts the differential equations into algebraic ones using the previous step\'s values, then solves the linear system. Running it forward is numerical integration, with all the stability questions the numerical-methods wing raises.'),
        drvStep('nonlinear parts need an inner iteration',
          `${dv('I')} ${dop('=')} ${dv('I')}ₛ(${dop('e')}^(${dv('V')}/${dv('nV')}_T) ${dop('−')} 1)`,
          'a diode is solved by Newton\'s method at each timestep — linearise, solve, repeat until it settles'),
        drvSay('and the bench checks itself every step',
          'Kirchhoff\'s current law is re-evaluated at every node from the computed solution, and Tellegen\'s theorem — that the powers of all branches sum to zero — is checked independently. Both residuals are printed. A simulator that does not check its own output is not to be trusted, and neither is one that hides the residual.')
      ],
      note:'The capacitor current must be read back from the stored history rather than differentiated from the displayed waveform, and the solver absorbs sign conventions that the display then flips for sources. Both are documented traps in this codebase.'
    };
  },
  drag: true,
  mode: '2d',

  enter(st, o){
    st.net = o.net || '';
    st.netErr = '';
    st.sch = o.net ? (ckParseNetlist(o.net).sch || ckNewSch([], []))
           : o.sch ? ckDemoSch(o.sch)
           : (o.build ? o.build() : ckSeriesLoop(
      { wave:'sin', amp:5, freq:1000 },
      [{ kind:'R', name:'R1', val:100 }, { kind:'L', name:'L1', val:1e-3 }, { kind:'C', name:'C1', val:1e-6 }]));
    st.tool = 'probe';
    st.sel = -1;
    st.run = o.run !== false;
    st.pane = o.pane || 'scope';
    st.pan = { x:0, y:0 };
    st.zoom = o.zoom || 1;
    st.probeP = o.probe ? { x:o.probe[0], y:o.probe[1] } : { x:2, y:2 };
    st.pB = o.probeB ? { x:o.probeB[0], y:o.probeB[1] } : { x: st.probeP.x + 5, y: st.probeP.y - 2 };
    st.wireFrom = null;
    st.show = Object.assign({ volts:true, amps:true, flow:true, labels:true,
                              heat:false, efield:false, equipot:false, bfield:false,
                              carriers:true }, o.show || {});
    st.uic = !!o.uic;                   /* start from stated initial conditions */
    st.tscale = o.tscale || 0;          /* 0 = pick one from the circuit */
    st.win = o.win || 0;
    st.traces = o.traces || null;
    st.hist = [];
    st.field = null; st.fieldKey = '';
    st.flow = null;
    st.drive = o.drive || '';
    st.sweep = Object.assign({ name:'', prop:'val', from:0, to:10, n:60, probe:0 }, o.sweep || {});
    st.bode = Object.assign({ f0:10, f1:1e6, n:160, probe:0, kind:'v' }, o.bode || {});
    st.err = ''; st.warn = '';
    st.yauto = true; st.yspan = 1;
    ckRebuild(st, true);
    ckFitView(st);
  },

  key(st){ return ckGeomKey(st.sch); },

  /* ---------------------------------------------------------------- panel ---- */
  controls(){
    const st = ST;
    const tool = (id, label, title) =>
      `<button class="btn sm" data-ckt="${id}" aria-pressed="${st.tool === id}" title="${title}">${label}</button>`;
    const pane = (id, label) =>
      `<button data-ckp="${id}" aria-pressed="${st.pane === id}">${label}</button>`;
    return `<div class="seg" id="ckPane" style="flex-wrap:wrap">
        ${pane('both', 'Time + frequency')}${pane('scope', 'Oscilloscope')}${pane('spectrum', 'Spectrum')}
        ${pane('bode', 'Bode')}${pane('sweep', 'DC sweep')}
        ${pane('power', 'Power')}${pane('phasor', 'Phasors')}${pane('none', 'Schematic only')}
      </div>
      <div class="row wrap" style="gap:5px;margin-top:7px">
        <button class="btn pri" id="ckRun">${st.run ? 'Pause' : 'Run'}</button>
        <button class="btn sm" id="ckStep1">Step</button>
        <button class="btn sm" id="ckReset">Restart</button>
      </div>
      ${ctlRow('time ×', ctlSlider('ckTS', -7, 1, 0.1, Math.log10(ckTimeScale(st))))}
      <p class="help">The circuit is solved in real seconds; <b>time ×</b> is how many simulated seconds pass per second of your time. Microsecond circuits need a very small number.</p>

      <div class="ttl" style="margin-top:9px">Place a part</div>
      <div class="row wrap" style="gap:5px">
        ${tool('probe', '⌖ probe A', 'Select and drag parts, and place the red probe')}
        ${tool('probeB', '⌖ probe B', 'Place the second probe — the two together read a voltage difference and a Thévenin equivalent')}
        ${tool('wire', '╱ wire', 'Click pin to pin; each click drops one segment')}
        ${tool('R', '◠ R', 'Resistor')}
        ${tool('C', '⊣⊢ C', 'Capacitor')}
        ${tool('L', '◡◡ L', 'Inductor')}
        ${tool('V', 'V source', 'Voltage source — DC, AC, or any function of t')}
        ${tool('I', 'I source', 'Current source')}
        ${tool('D', '▷| diode', 'Junction diode')}
        ${tool('SW', '⌿ switch', 'Switch — manual or timed')}
        ${tool('SWV', '⌿ᵥ V-switch', 'Voltage-controlled switch, with hysteresis')}
        ${tool('OPAMP', '▷ op amp', 'Operational amplifier')}
        ${tool('XFMR', '⧢ transformer', 'Two coupled windings')}
        ${tool('XFMRI', '⧢ ideal xfmr', 'Pure turns ratio')}
        ${tool('M', 'k coupling', 'Couple two named inductors')}
        ${tool('VCVS', 'VCVS', 'Voltage-controlled voltage source')}
        ${tool('VCCS', 'VCCS', 'Voltage-controlled current source')}
        ${tool('CCVS', 'CCVS', 'Current-controlled voltage source')}
        ${tool('CCCS', 'CCCS', 'Current-controlled current source')}
        ${tool('GND', '⏚ ground', 'The 0 V reference — every circuit needs one')}
      </div>
      <p class="help">Pick a part, then <b>click the schematic</b> to drop it. Drag anything to move it. With the
      <b>wire</b> tool, click once to start and again to lay a segment; clicking a pin ends the run.
      ${st.wireFrom ? '<b>Wiring in progress</b> — click the next point, or press Finish.' : ''}</p>
      <div class="row wrap">
        ${st.wireFrom ? '<button class="btn sm" id="ckWireEnd">Finish wire</button>' : ''}
        <button class="btn sm" id="ckRot">Rotate</button>
        <button class="btn sm" id="ckDel">Delete</button>
        <button class="btn sm" id="ckFit">Fit to view</button>
        <button class="btn sm" id="ckClear">Clear all</button>
      </div>

      <div class="ttl" style="margin-top:9px">Or type the circuit</div>
      <div class="fld" style="align-items:stretch">
        <textarea id="ckNet" rows="7" spellcheck="false" autocomplete="off"
          aria-label="netlist — one part per line"
          data-audit="V1 in 0 SIN(5 1k)&#10;R1 in out 1k&#10;C1 out 0 100n"
          style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.net || ckNetlistText(st.sch))}</textarea>
      </div>
      <div class="row wrap">
        <button class="btn sm pri" id="ckNetGo">Build it</button>
        <button class="btn sm" id="ckNetRead">Read the board back</button>
      </div>
      <p class="help" id="ckNetMsg" style="color:${st.netErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.netErr ||
        'One part per line: <b>name  node  node  value</b>. The first letter of the name chooses the part — ' +
        '<b>R C L V I D</b>, <b>S</b> for a switch, <b>U</b> for an op amp (+ input, − input, output), ' +
        '<b>K</b> to couple two inductors. Node names are any words you like; <b>0</b> is ground. ' +
        'Values take engineering shorthand — <b>1k</b>, <b>4k7</b>, <b>100n</b>. A source is a number, or ' +
        '<b>DC 12</b>, or <b>SIN(5 1k)</b> and the other waveforms. ' +
        '<b>Read the board back</b> prints whatever is currently drawn, which is the quickest way to learn the format.'}</p>

      <div class="ttl" style="margin-top:9px">Show</div>
      <div class="chkgrid">
        <label class="chk"><input type="checkbox" id="ckShV" ${st.show.volts?'checked':''}><span>node voltages</span></label>
        <label class="chk"><input type="checkbox" id="ckShI" ${st.show.amps?'checked':''}><span>branch currents</span></label>
        <label class="chk"><input type="checkbox" id="ckShF" ${st.show.carriers?'checked':''}><span>charge flowing</span></label>
        <label class="chk"><input type="checkbox" id="ckShL" ${st.show.labels?'checked':''}><span>part values</span></label>
        <label class="chk"><input type="checkbox" id="ckShH" ${st.show.heat?'checked':''}><span>potential map</span></label>
        <label class="chk"><input type="checkbox" id="ckShQ" ${st.show.equipot?'checked':''}><span>equipotentials</span></label>
        <label class="chk"><input type="checkbox" id="ckShE" ${st.show.efield?'checked':''}><span>electric field E</span></label>
        <label class="chk"><input type="checkbox" id="ckShB" ${st.show.bfield?'checked':''}><span>magnetic field B</span></label>
      </div>
      <p class="help">The potential map, equipotentials and <b>E</b> solve <b>∇²V = 0</b> in the plane of the board
      with every conductor pinned at the potential the circuit solve gave it, so <b>E = −∇V</b> on screen is the
      real field of that arrangement — fringing at a capacitor's plates included. <b>B</b> is the other half of the
      picture: <b>Biot–Savart</b> integrated along every conductor from the current it actually carries. It points
      straight out of the board, so it is drawn as ⊙ (toward you) and ⊗ (away), taking one grid square to be 1 cm.</p>
      <div class="ttl" style="margin-top:9px">Colour key</div>
      <div class="lg-row"><span class="sw" style="background:var(--c-grad)"></span>node potential — warm positive, cool negative</div>
      <div class="lg-row"><span class="sw" style="background:var(--c-pos)"></span>branch current, arrow along conventional flow</div>
      ${st.show.carriers ? '<div class="lg-row"><span class="sw" style="background:var(--c-warn)"></span>charge carriers — speed ∝ current</div>' : ''}
      ${st.show.efield ? '<div class="lg-row"><span class="sw" style="background:var(--c-curl)"></span>E = −∇V from the Laplace solve</div>' : ''}
      ${st.show.equipot ? '<div class="lg-row"><span class="sw" style="background:var(--c-neg)"></span>equipotentials — surfaces of constant V</div>' : ''}
      ${st.show.bfield ? '<div class="lg-row"><span class="sw" style="background:var(--c-neg)"></span>B out of the board — ⊙ toward you, ⊗ away</div>' : ''}
      <div id="ckSelBody"></div>
      <div id="ckPaneBody"></div>`;
  },

  wire(){
    const st = ST;
    for(const b of $('stageBody').querySelectorAll('button[data-ckt]')) b.addEventListener('click', () => {
      if(!ST) return;
      ST.tool = b.dataset.ckt; ST.wireFrom = null;
      buildStagePanel();
    });
    for(const b of $('ckPane').children) b.addEventListener('click', () => {
      if(!ST) return;
      ST.pane = b.dataset.ckp; buildStagePanel(); updateStageLegend();
    });
    $('ckRun').addEventListener('click', () => {
      ST.run = !ST.run;
      $('ckRun').textContent = ST.run ? 'Pause' : 'Run';
    });
    $('ckStep1').addEventListener('click', () => { ckAdvance(ST, ckTimeScale(ST) * 0.02); });
    $('ckReset').addEventListener('click', () => { ckRebuild(ST, true); refreshStageReadout(); });
    wireSlider('ckTS', () => Math.log10(ckTimeScale(ST)), v => { ST.tscale = Math.pow(10, v); },
               v => ckEng(Math.pow(10, v), '×'));
    const rot = $('ckRot'); if(rot) rot.addEventListener('click', () => {
      const c = ST.sch.comps[ST.sel];
      if(!c) return;
      c.rot = ((c.rot || 0) + 90) % 360;
      ckRebuild(ST);
    });
    $('ckDel').addEventListener('click', () => {
      if(ST.sel < 0) return;
      ST.sch.comps.splice(ST.sel, 1); ST.sel = -1;
      ckRebuild(ST); buildStagePanel();
    });
    $('ckClear').addEventListener('click', () => {
      ST.sch = ckNewSch([], []); ST.sel = -1; ST.wireFrom = null;
      ckRebuild(ST); buildStagePanel();
    });
    const we = $('ckWireEnd'); if(we) we.addEventListener('click', () => { ST.wireFrom = null; buildStagePanel(); });
    /* the netlist. A deck that does not parse leaves the board exactly as it was
       and says which line was wrong — the same rule the expression boxes follow,
       and for the same reason: a control that blanks the picture on a typo has
       taught the reader to stop typing. */
    const applyNet = () => {
      const box = $('ckNet'); if(!box) return;
      ST.net = box.value;
      const P = ckParseNetlist(ST.net);
      if(P.ok){
        ST.sch = P.sch; ST.sel = -1; ST.wireFrom = null; ST.netErr = '';
        ckRebuild(ST, true); ckFitView(ST);
      } else {
        ST.netErr = '⚠ ' + P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
          (P.errs.length > 4 ? '<br>… and ' + (P.errs.length - 4) + ' more' : '') +
          '<br><span style="color:var(--faint)">The board is unchanged.</span>';
      }
      const msg = $('ckNetMsg');
      if(msg){ msg.innerHTML = ST.netErr || 'Built: ' + P.parts.length + ' part' + (P.parts.length === 1 ? '' : 's') +
        ' across ' + P.nodes.length + ' node' + (P.nodes.length === 1 ? '' : 's') + ', node 0 being ground.';
        msg.style.color = ST.netErr ? 'var(--c-neg)' : 'var(--faint)'; }
      refreshStageReadout(); updateStageChip();
    };
    const nb = $('ckNet'); if(nb) nb.addEventListener('change', applyNet);
    const ng = $('ckNetGo'); if(ng) ng.addEventListener('click', applyNet);
    const nr = $('ckNetRead'); if(nr) nr.addEventListener('click', () => {
      ST.net = ckNetlistText(ST.sch); ST.netErr = '';
      const box = $('ckNet'); if(box) box.value = ST.net;
      const msg = $('ckNetMsg');
      if(msg){ msg.textContent = 'That is the board as it stands. Edit it and press Build it.'; msg.style.color = 'var(--faint)'; }
    });
    $('ckFit').addEventListener('click', () => { ckFitView(ST); });
    const chk = (id, key) => { const e = $(id); if(e) e.addEventListener('change', ev => {
      ST.show[key] = ev.target.checked; ST.fieldKey = ''; updateStageLegend(); }); };
    chk('ckShV','volts'); chk('ckShI','amps'); chk('ckShF','carriers'); chk('ckShL','labels');
    chk('ckShH','heat'); chk('ckShQ','equipot'); chk('ckShE','efield'); chk('ckShB','bfield');
    this.buildSelPanel();
    this.buildPanePanel();
  },

  /* ---- the editor for whichever part is selected ---- */
  buildSelPanel(){
    const box = $('ckSelBody'); if(!box || !ST) return;
    const c = ST.sch.comps[ST.sel];
    if(!c){
      box.innerHTML = '<p class="help">No part selected — click one with the <b>probe</b> tool to edit its value.</p>';
      return;
    }
    const K = c.kind;
    const num = (id, label, val, unit) =>
      `<div class="row"><label class="lb" style="width:96px">${label}</label>
        <div class="fld" style="flex:1"><input id="${id}" value="${val}" spellcheck="false" autocomplete="off"><span class="pre">${unit}</span></div></div>`;
    let rows = '';
    if(K === 'R') rows += num('ckV1', 'resistance R', ckEng(c.val, ''), 'Ω');
    if(K === 'C') rows += num('ckV1', 'capacitance C', ckEng(c.val, ''), 'F') + num('ckIC', 'initial v(0)', c.ic || 0, 'V');
    if(K === 'L') rows += num('ckV1', 'inductance L', ckEng(c.val, ''), 'H') +
                          num('ckESR', 'winding R', c.esr || 0, 'Ω') + num('ckIC', 'initial i(0)', c.ic || 0, 'A');
    if(K === 'D') rows += num('ckIS', 'saturation Iₛ', ckEng(c.is, ''), 'A') + num('ckN', 'ideality n', c.nn, '');
    if(K === 'SW'){
      rows += ctlRow('kind', `<div class="seg" id="ckSwMode">
        <button data-m="manual" aria-pressed="${c.mode !== 'time'}">manual</button>
        <button data-m="time" aria-pressed="${c.mode === 'time'}">timed</button></div>`);
      if(c.mode === 'time') rows += num('ckTon', 'closes at', ckEng(c.ton, ''), 's') +
                                    num('ckToff', 'opens at', ckEng(c.toff, ''), 's') +
                                    num('ckPer', 'repeat every', ckEng(c.period, ''), 's');
      else rows += `<div class="row"><label class="lb" style="width:96px">contact</label>
        <button class="btn sm" id="ckToggle">${c.closed ? 'closed — click to open' : 'open — click to close'}</button></div>`;
      rows += num('ckRon', 'closed R', ckEng(c.ron, ''), 'Ω');
    }
    if(K === 'SWV') rows += num('ckVth', 'threshold', c.vth, 'V') + num('ckVhys', 'hysteresis ±', c.vhys, 'V') +
                            num('ckRon', 'closed R', ckEng(c.ron, ''), 'Ω');
    if(K === 'XFMR') rows += num('ckL1', 'primary L₁', ckEng(c.l1, ''), 'H') + num('ckL2', 'secondary L₂', ckEng(c.l2, ''), 'H') +
                             ctlRow('coupling k', ctlSlider('ckK', 0, 1, 0.001, c.k)) +
                             num('ckR1', 'winding R₁', c.r1, 'Ω') + num('ckR2', 'winding R₂', c.r2, 'Ω');
    if(K === 'XFMRI') rows += num('ckRatio', 'turns N : 1', c.ratio, '');
    if(K === 'M') rows += `<div class="row"><label class="lb" style="width:96px">couples</label>
        <select class="sel" id="ckMA">${ckIndOptions(c.a)}</select>
        <select class="sel" id="ckMB">${ckIndOptions(c.b)}</select></div>` +
        ctlRow('coupling k', ctlSlider('ckK', -1, 1, 0.01, c.k));
    if(K === 'OPAMP'){
      rows += ctlRow('model', `<div class="seg" id="ckOpMode">
        <button data-m="real" aria-pressed="${!c.ideal}">real</button>
        <button data-m="ideal" aria-pressed="${!!c.ideal}">ideal</button></div>`);
      if(!c.ideal) rows += num('ckA0', 'open-loop A₀', ckEng(c.a0, ''), '') +
                           num('ckFP', 'pole f_p', ckEng(c.fp, ''), 'Hz') +
                           num('ckSlew', 'slew rate', ckEng(c.slew, ''), 'V/s') +
                           num('ckVsat', 'rails ±', c.vsat, 'V') +
                           num('ckRout', 'output R', c.rout, 'Ω');
    }
    if(K === 'VCVS') rows += num('ckG', 'gain µ', c.gain, 'V/V');
    if(K === 'VCCS') rows += num('ckG', 'gain gₘ', ckEng(c.gain, ''), 'S');
    if(K === 'CCVS') rows += num('ckG', 'transresistance', ckEng(c.gain, ''), 'Ω') +
                             `<div class="row"><label class="lb" style="width:96px">senses i of</label>
                              <select class="sel" id="ckCtl">${ckCtlOptions(c.ctl)}</select></div>`;
    if(K === 'CCCS') rows += num('ckG', 'current gain β', c.gain, 'A/A') +
                             `<div class="row"><label class="lb" style="width:96px">senses i of</label>
                              <select class="sel" id="ckCtl">${ckCtlOptions(c.ctl)}</select></div>`;
    if(K === 'V' || K === 'I') rows += ckSourceRows(c, K === 'V' ? 'V' : 'A');

    box.innerHTML = `<div class="card tight"><div class="ttl">${c.name} — ${CK_KINDS[K].name}</div>${rows}
      <p class="help">Values accept engineering shorthand: <b>4k7</b>, <b>100n</b>, <b>2.2M</b>, <b>1e-6</b>.</p></div>`;
    this.wireSelPanel(c);
  },

  wireSelPanel(c){
    const inv = () => { ckRebuild(ST); refreshStageReadout(); };
    const txt = (id, get, set) => {
      const e = $(id); if(!e) return;
      const commit = () => {
        const v = ckParseEng(e.value);
        if(Number.isFinite(v)){ set(v); inv(); e.classList.remove('bad'); }
        else e.classList.add('bad');
      };
      e.addEventListener('change', commit);
      e.addEventListener('blur', commit);
    };
    txt('ckV1', 0, v => c.val = v);
    txt('ckIC', 0, v => c.ic = v);
    txt('ckESR', 0, v => c.esr = v);
    txt('ckIS', 0, v => c.is = v);
    txt('ckN', 0, v => c.nn = v);
    txt('ckRon', 0, v => c.ron = v);
    txt('ckTon', 0, v => c.ton = v);
    txt('ckToff', 0, v => c.toff = v);
    txt('ckPer', 0, v => c.period = v);
    txt('ckVth', 0, v => c.vth = v);
    txt('ckVhys', 0, v => c.vhys = v);
    txt('ckL1', 0, v => c.l1 = v);
    txt('ckL2', 0, v => c.l2 = v);
    txt('ckR1', 0, v => c.r1 = v);
    txt('ckR2', 0, v => c.r2 = v);
    txt('ckRatio', 0, v => c.ratio = v);
    txt('ckA0', 0, v => c.a0 = v);
    txt('ckFP', 0, v => c.fp = v);
    txt('ckSlew', 0, v => c.slew = v);
    txt('ckVsat', 0, v => c.vsat = v);
    txt('ckRout', 0, v => c.rout = v);
    txt('ckG', 0, v => c.gain = v);
    if($('ckK')) wireSlider('ckK', () => c.k, v => { c.k = v; ckRebuild(ST); }, v => fmtNum(+v, 3));
    const seg = (id, key, map) => { const s = $(id); if(!s) return;
      for(const b of s.children) b.addEventListener('click', () => { map(b.dataset.m); ckRebuild(ST); buildStagePanel(); }); };
    seg('ckSwMode', 0, m => c.mode = m);
    seg('ckOpMode', 0, m => c.ideal = (m === 'ideal'));
    const tog = $('ckToggle'); if(tog) tog.addEventListener('click', () => { c.closed = !c.closed; ckRebuild(ST); buildStagePanel(); });
    const sel = (id, set) => { const s = $(id); if(s) s.addEventListener('change', () => { set(s.value); ckRebuild(ST); }); };
    sel('ckMA', v => c.a = v); sel('ckMB', v => c.b = v); sel('ckCtl', v => c.ctl = v);
    /* the source waveform editor */
    const ws = $('ckWave'); if(ws) ws.addEventListener('change', () => { c.wave = ws.value; ckRebuild(ST); buildStagePanel(); });
    txt('ckAmp', 0, v => c.amp = v);
    txt('ckFreq', 0, v => c.freq = v);
    txt('ckOff', 0, v => c.off = v);
    txt('ckDC', 0, v => c.val = v);
    txt('ckTau', 0, v => c.tau = v);
    txt('ckT0', 0, v => c.t0 = v);
    txt('ckPW', 0, v => c.pw = v);
    txt('ckRate', 0, v => c.rate = v);
    txt('ckFM', 0, v => c.fm = v);
    txt('ckRs', 0, v => c.rs = v);
    if($('ckPhase')) wireSlider('ckPhase', () => c.phase, v => { c.phase = v; ckRebuild(ST); }, v => Math.round(v) + '°');
    if($('ckDuty')) wireSlider('ckDuty', () => c.duty, v => { c.duty = v; ckRebuild(ST); }, v => Math.round(v * 100) + '%');
    if($('ckDepth')) wireSlider('ckDepth', () => c.depth, v => { c.depth = v; ckRebuild(ST); }, v => Math.round(v * 100) + '%');
    const ex = $('ckExpr');
    if(ex) ex.addEventListener('change', () => {
      c.expr = ex.value; ckCompileExpr(c); ckRebuild(ST);
      $('ckExprErr').textContent = c._err ? '⚠ ' + c._err : '';
      $('ckExprErr').style.color = c._err ? 'var(--c-neg)' : 'var(--faint)';
    });
  },

  /* ---- the controls belonging to the instrument on the bottom half ---- */
  buildPanePanel(){
    const box = $('ckPaneBody'); if(!box || !ST) return;
    const st = ST;
    const ck = st.sim && st.sim.ck;
    if(!ck){ box.innerHTML = ''; return; }
    let h = '';
    if(st.pane === 'scope' || st.pane === 'spectrum' || st.pane === 'phasor' || st.pane === 'both'){
      h += `<div class="card tight"><div class="ttl">Traces</div><div class="chkgrid">`;
      const opts = ckSignalList(ck);
      const on = ckActiveTraces(st, ck);
      opts.forEach((o, i) => {
        h += `<label class="chk"><input type="checkbox" data-cktr="${o.id}" ${on.some(t => t.id === o.id) ? 'checked' : ''}>
              <span style="color:${ckTraceColour(i)}">${o.label}</span></label>`;
      });
      h += `</div></div>`;
      if(st.pane === 'scope' || st.pane === 'both')
        h += ctlRow('window', ctlSlider('ckWin', -6, 1, 0.05, Math.log10(ckWindow(st))));
    }
    if(st.pane === 'bode'){
      h += `<div class="card tight"><div class="ttl">Frequency response</div>
        <div class="row"><label class="lb" style="width:96px">drive</label>
          <select class="sel" id="ckBodeSrc">${ckSrcOptions(ck, st.drive)}</select></div>
        <div class="row"><label class="lb" style="width:96px">measure</label>
          <select class="sel" id="ckBodeProbe">${ckProbeOptions(ck, st.bode.probe)}</select></div>
        ${ctlRow('from', ctlSlider('ckF0', -1, 6, 0.1, Math.log10(st.bode.f0)))}
        ${ctlRow('to', ctlSlider('ckF1', 1, 9, 0.1, Math.log10(st.bode.f1)))}
        <p class="help">The drive source is replaced by a 1 V∠0° test signal and every other source is
        switched off, which is what "small-signal frequency response" means. Gain is
        <b>20 log₁₀|H(jω)|</b> in decibels; the phase is <b>arg H(jω)</b> in degrees.</p></div>`;
    }
    if(st.pane === 'sweep'){
      h += `<div class="card tight"><div class="ttl">DC sweep</div>
        <div class="row"><label class="lb" style="width:96px">sweep</label>
          <select class="sel" id="ckSwName">${ckSweepOptions(st)}</select></div>
        ${ctlRow('from', ctlSlider('ckSwFrom', -20, 20, 0.1, st.sweep.from))}
        ${ctlRow('to', ctlSlider('ckSwTo', -20, 20, 0.1, st.sweep.to))}
        <div class="row"><label class="lb" style="width:96px">measure</label>
          <select class="sel" id="ckSwProbe">${ckProbeOptions(ck, st.sweep.probe)}</select></div>
        <p class="help">Every point is a fresh DC operating point: capacitors open, inductors shorted,
        and Newton's method run to convergence on the nonlinear parts.</p></div>`;
    }
    box.innerHTML = h;
    for(const b of box.querySelectorAll('input[data-cktr]')) b.addEventListener('change', () => {
      if(!ST) return;
      const cur = ckActiveTraces(ST, ST.sim.ck).map(t => t.id);
      const id = b.dataset.cktr;
      ST.traces = b.checked ? cur.concat([id]).filter((v, i, a) => a.indexOf(v) === i)
                            : cur.filter(t => t !== id);
      ST.hist = [];
    });
    if($('ckWin')) wireSlider('ckWin', () => Math.log10(ckWindow(ST)),
      v => { ST.win = Math.pow(10, v); }, v => ckEng(Math.pow(10, v), 's'));
    const s1 = $('ckBodeSrc'); if(s1) s1.addEventListener('change', () => { ST.drive = s1.value; });
    const s2 = $('ckBodeProbe'); if(s2) s2.addEventListener('change', () => { ST.bode.probe = s2.value; });
    if($('ckF0')) wireSlider('ckF0', () => Math.log10(ST.bode.f0), v => { ST.bode.f0 = Math.pow(10, v); }, v => ckEng(Math.pow(10, v), 'Hz'));
    if($('ckF1')) wireSlider('ckF1', () => Math.log10(ST.bode.f1), v => { ST.bode.f1 = Math.pow(10, v); }, v => ckEng(Math.pow(10, v), 'Hz'));
    const s3 = $('ckSwName'); if(s3) s3.addEventListener('change', () => { ST.sweep.name = s3.value; });
    const s4 = $('ckSwProbe'); if(s4) s4.addEventListener('change', () => { ST.sweep.probe = s4.value; });
    if($('ckSwFrom')) wireSlider('ckSwFrom', () => ST.sweep.from, v => { ST.sweep.from = v; }, v => fmtNum(+v, 3));
    if($('ckSwTo')) wireSlider('ckSwTo', () => ST.sweep.to, v => { ST.sweep.to = v; }, v => fmtNum(+v, 3));
  },

  /* ---------------------------------------------------------------- input ---- */
  pick(st, sx, sy, phase){
    const V = ckView(st, R.W, R.H);
    if(!V.inRect(sx, sy)) return;
    const g = V.toG(sx, sy);
    const snap = ckSnap(g);

    if(phase === 'up'){ st.dragC = null; return; }

    if(phase === 'move'){
      if(st.dragC !== null && st.sch.comps[st.dragC]){
        const c = st.sch.comps[st.dragC];
        if(c.x !== snap.x || c.y !== snap.y){ c.x = snap.x; c.y = snap.y; ckRebuild(st); }
      } else if(st.tool === 'probe') st.probeP = g;
      else if(st.tool === 'probeB') st.pB = g;
      return;
    }
    if(st.tool === 'probeB'){ st.pB = g; return; }

    /* down / click */
    if(st.tool === 'wire'){
      if(!st.wireFrom){ st.wireFrom = snap; buildStagePanel(); return; }
      const a = st.wireFrom;
      const b = Math.abs(snap.x - a.x) >= Math.abs(snap.y - a.y) ? { x:snap.x, y:a.y } : { x:a.x, y:snap.y };
      if(b.x !== a.x || b.y !== a.y){
        st.sch.wires.push({ a:{ x:a.x, y:a.y }, b:{ x:b.x, y:b.y } });
        st.wireFrom = b;
        ckRebuild(st);
      }
      /* landing on a pin ends the run */
      if(ckPinAt(st.sch, b)) st.wireFrom = null;
      buildStagePanel();
      return;
    }

    const hit = ckHitTest(st.sch, g);
    if(st.tool === 'probe'){
      if(hit >= 0){ st.sel = hit; st.dragC = hit; STAGES.ckLab.buildSelPanel(); return; }
      const wi = ckWireHit(st.sch, g);
      if(wi >= 0 && st.selWire !== wi){ st.selWire = wi; }
      st.probeP = g;
      return;
    }
    if(st.tool === 'del'){
      if(hit >= 0){ st.sch.comps.splice(hit, 1); st.sel = -1; ckRebuild(st); buildStagePanel(); }
      return;
    }
    /* a component tool: drop one here */
    const kind = st.tool;
    if(CK_KINDS[kind]){
      const c = ckNewComp(kind, snap.x, snap.y, ckAutoName(st.sch, kind));
      if(kind === 'M'){
        const inds = st.sch.comps.filter(q => q.kind === 'L');
        c.a = inds[0] ? inds[0].name : ''; c.b = inds[1] ? inds[1].name : '';
      }
      if(kind === 'CCVS' || kind === 'CCCS'){
        const srcs = st.sch.comps.filter(q => q.kind === 'V' || q.kind === 'L');
        c.ctl = srcs[0] ? srcs[0].name : '';
      }
      st.sch.comps.push(c);
      st.sel = st.sch.comps.length - 1;
      ckRebuild(st);
      buildStagePanel();
    }
  },

  /* ---------------------------------------------------------------- frame ---- */
  frame(st, dt, ctx, W, H){
    const V = ckView(st, W, H);
    st.lastDT = Math.min(0.05, dt || 0.016);
    if(st.run) ckAdvance(st, st.lastDT * ckTimeScale(st));

    ctx.save();
    ctx.beginPath(); ctx.rect(V.rect.x, V.rect.y, V.rect.w, V.rect.h); ctx.clip();
    ckDrawField(st, ctx, V);
    ckDrawGridDots(st, ctx, V);
    if(st.show.bfield) ckDrawBField(st, ctx, V);
    ckDrawWires(st, ctx, V);
    ckDrawParts(st, ctx, V);
    ckDrawAnnotations(st, ctx, V);
    ckDrawProbe(st, ctx, V);
    ctx.restore();

    if(st.pane !== 'none'){
      const pr = { x:64, y:V.rect.h + 40, w:W - 112, h:H - V.rect.h - 88 };
      if(pr.h > 40){
        ctx.strokeStyle = rgbCss(TH.line); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, V.rect.h + 0.5); ctx.lineTo(W, V.rect.h + 0.5); ctx.stroke();
        ({ scope: ckPaneScope, bode: ckPaneBode, sweep: ckPaneSweep, both: ckPaneBoth,
           spectrum: ckPaneSpectrum, power: ckPanePower, phasor: ckPanePhasor }[st.pane] || ckPaneScope)(st, ctx, pr);
      }
    }
    if(st.err){
      ctx.fillStyle = rgbCss(TH.neg);
      ctx.font = '600 12px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText('⚠ ' + st.err, W / 2, 8);
    } else if(st.warn){
      ctx.fillStyle = rgbCss(TH.warn);
      ctx.font = '11px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      ctx.fillText(st.warn, W / 2, 8);
    }
    stageNote(ctx, st.tool === 'probe'
      ? 'probe tool — click a part to select and edit it, drag to move it, click empty board to move the probe'
      : (st.tool === 'wire' ? 'wire tool — click to start, click again to lay a segment, click a pin to finish'
                            : 'click the board to place: ' + (CK_KINDS[st.tool] ? CK_KINDS[st.tool].name : st.tool)), W, H);
  },

  readout(st){ return ckReadout(st); },

  chip(st){
    const m = st.meas;
    if(!m) return `<div class="k">Circuit bench</div><div style="color:var(--c-neg)">${st.err || 'no solution'}</div>`;
    return `<div class="k">t = ${ckEng(st.sim.t, 's')} · ${st.sim.ck.nm.count - 1} nodes</div>
      <div style="color:var(--c-grad)">Σ P delivered = ${ckEng(m.delivered, 'W')}</div>
      <div style="color:var(--c-pos)">stored in L and C = ${ckEng(m.energy, 'J')}</div>
      <div>KCL residual = ${ckEng(m.kclMax, 'A')}</div>`;
  },

  /* The canvas is shared between a schematic and an instrument, so a floating
     legend would always be sitting on top of one of them. The colour key lives
     in the dock instead, where there is room for it. */
  legend(){ return []; }
};

