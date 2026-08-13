/* ============================================================================
   THE READOUT — every number the solve produced, at the probe and everywhere
   ============================================================================ */
function ckReadout(st){
  const s = st.sim, m = st.meas;
  if(!s || !m) return `<div class="card tight"><div class="ttl">No solution</div>
    <p class="help">${st.err || 'Place components, wire them together, and add a ground.'}</p></div>`;
  const ck = s.ck;

  /* what is under the probe */
  let near = null, nd = -1, bestD = 1e9;
  for(const st2 of m.states){
    const pins = ckPins(st2.e.c);
    if(pins.length < 2) continue;
    const mid = { x:(pins[0].x + pins[1].x) / 2, y:(pins[0].y + pins[1].y) / 2 };
    const d = Math.hypot(mid.x - st.probeP.x, mid.y - st.probeP.y);
    if(d < bestD){ bestD = d; near = st2; }
  }
  for(const c of st.sch.comps) for(const p of ckPins(c)){
    const d = Math.hypot(p.x - st.probeP.x, p.y - st.probeP.y);
    if(d < 0.8){ nd = ck.nm.node(p); }
  }
  let fieldRows = '';
  if(st.field && (st.show.efield || st.show.heat || st.show.equipot)){
    const q = ckFieldAt(st.field, st.probeP.x, st.probeP.y);
    fieldRows = kv('V at the probe', ckEng(q.V, 'V')) +
      kv('E = −∇V', '(' + fmtNum(q.Ex, 4) + ', ' + fmtNum(q.Ey, 4) + ') V per grid unit') +
      kv('|E|', fmtNum(q.mag, 4)) +
      kv('inside a conductor?', q.inside ? 'yes — E = 0 inside an ideal conductor' : 'no');
  }
  if(st.show.bfield){
    const bz = ckBAt(ckCurrentPaths(st), st.probeP.x, st.probeP.y);
    fieldRows += kv('B out of the board', ckEng(bz, 'T') + (bz > 0 ? '  ⊙ toward you' : bz < 0 ? '  ⊗ away' : ''));
    fieldRows += kv('as a fraction of Earth\'s field', fmtNum(Math.abs(bz) / 5e-5, 3) + ' × 50 µT');
  }

  const nodeRows = [];
  for(let k = 1; k < ck.nm.count; k++)
    nodeRows.push(kv('node ' + k + (k === nd ? ' ← probe' : ''), ckEng(m.nodeV[k], 'V')));

  const elRows = m.states.map(q => {
    let extra = '';
    if(q.kind === 'XFMR' || q.kind === 'XFMRI')
      extra = ' · secondary ' + ckEng(q.v2, 'V') + ', ' + ckEng(q.i2, 'A');
    if(q.energy) extra += ' · stores ' + ckEng(q.energy, 'J');
    if(q.note) extra += ' · ' + q.note;
    return kv(q.name + ' (' + CK_KINDS[q.kind].name + ')',
      ckEng(q.v, 'V') + ' · ' + ckEng(ckShowI(q), 'A') + ' · ' +
      ckShowVerb(q) + ' ' + ckEng(Math.abs(ckShowP(q)), 'W') + extra);
  });

  /* the closed forms this particular circuit should obey */
  let theory = '';
  const Rs = st.sch.comps.filter(c => c.kind === 'R');
  const Cs = st.sch.comps.filter(c => c.kind === 'C');
  const Ls = st.sch.comps.filter(c => c.kind === 'L');
  if(Rs.length === 1 && Cs.length === 1 && !Ls.length){
    const tau = ckTauRC(Rs[0].val, Cs[0].val);
    theory = kv('τ = RC', ckEng(tau, 's')) +
             kv('corner f_c = 1/(2πRC)', ckEng(1 / (2 * Math.PI * tau), 'Hz')) +
             kv('reaches 63.2% of its step in', ckEng(tau, 's'));
  } else if(Rs.length === 1 && Ls.length === 1 && !Cs.length){
    const tau = ckTauRL(Rs[0].val, Ls[0].val);
    theory = kv('τ = L/R', ckEng(tau, 's')) + kv('corner f_c = R/(2πL)', ckEng(1 / (2 * Math.PI * tau), 'Hz'));
  } else if(Rs.length >= 1 && Ls.length === 1 && Cs.length === 1){
    const r = ckRLC(Rs[0].val, Ls[0].val, Cs[0].val);
    theory = kv('ω₀ = 1/√(LC)', ckEng(r.w0, 'rad/s')) +
             kv('f₀ = ω₀/2π', ckEng(r.f0, 'Hz')) +
             kv('damping ζ = (R/2)√(C/L)', fmtNum(r.zeta, 4)) +
             kv('quality Q = 1/2ζ', fmtNum(r.Q, 4)) +
             kv('regime', r.regime) +
             (r.fd ? kv('ringing at f_d = f₀√(1−ζ²)', ckEng(r.fd, 'Hz')) : '') +
             kv('bandwidth Δf = f₀/Q', ckEng(r.bw, 'Hz'));
  }

  let acRows = '';
  let f = 0;
  for(const c of st.sch.comps) if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc' && c.freq) f = Math.max(f, c.freq);
  if(f){
    const drive = st.drive || (ck.els.find(e => e.kind === 'V') || {}).name;
    const Z = drive ? ckImpedance(ck, s.x, f, drive) : null;
    if(Z && Number.isFinite(Z.mag))
      acRows = kv('drive frequency f', ckEng(f, 'Hz')) +
               kv('ω = 2πf', ckEng(2 * Math.PI * f, 'rad/s')) +
               kv('impedance seen by ' + drive, ckEng(Z.re, 'Ω') + (Z.im >= 0 ? ' + j' : ' − j') + ckEng(Math.abs(Z.im), 'Ω')) +
               kv('|Z| ∠ φ', ckEng(Z.mag, 'Ω') + ' ∠ ' + fmtNum(Z.ph, 4) + '°') +
               kv('power factor cos φ', fmtNum(Math.cos(Z.ph * Math.PI / 180), 4));
    for(const c of st.sch.comps){
      if(c.kind === 'C') acRows += kv('X_C of ' + c.name + ' = 1/(2πfC)', ckEng(1 / (2 * Math.PI * f * c.val), 'Ω'));
      if(c.kind === 'L') acRows += kv('X_L of ' + c.name + ' = 2πfL', ckEng(2 * Math.PI * f * c.val, 'Ω'));
    }
  }

  /* RMS and average over the visible scope window */
  let rmsRows = '';
  const tr = ckActiveTraces(st, ck);
  if(st.hist.length > 8 && tr.length){
    tr.forEach((t, k) => {
      const a = st.hist.map(r => r.v[k]).filter(Number.isFinite);
      if(!a.length) return;
      rmsRows += kv(t.label + ' — RMS', ckEng(ckRMS(a), t.unit) + ' · mean ' + ckEng(ckMean(a), t.unit));
    });
  }

  /* ---- the two-probe meter: a voltmeter, an ohmmeter and Thévenin at once ---- */
  const na = ckProbeNode(st, st.probeP), nb = ckProbeNode(st, st.pB);
  let fdrive = 0;
  for(const c of st.sch.comps)
    if((c.kind === 'V' || c.kind === 'I') && c.wave !== 'dc' && c.freq) fdrive = Math.max(fdrive, c.freq);
  let probeCard;
  if(na < 0 || nb < 0){
    probeCard = `<div class="card tight"><div class="ttl">Between the probes</div>
      <p class="help">Put <b>both</b> probes on the circuit to measure between them. Probe
      ${na < 0 ? 'A' : 'B'} is in empty space — pick the <b>probe ${na < 0 ? 'A' : 'B'}</b> tool and click a
      wire or a pin. The probes read whatever two points you choose, on any circuit you build.</p></div>`;
  } else if(na === nb){
    probeCard = `<div class="card tight"><div class="ttl">Between the probes</div>
      ${kv('both probes are on', 'node ' + na)}
      ${kv('ΔV', '0 V — the same node cannot differ from itself')}
      <p class="help">A wire is an equipotential: every point along it is one node, so move probe B
      across a component to measure something.</p></div>`;
  } else {
    const pp = ckProbePair(ck, s.x, na, nb, fdrive);
    const z = pp.z;
    probeCard = `<div class="card tight"><div class="ttl">Between the probes · node ${na} → node ${nb}</div>
      ${kv('V at probe A', ckEng(pp.va, 'V'))}
      ${kv('V at probe B', ckEng(pp.vb, 'V'))}
      ${kv('ΔV = V_A − V_B', '<b>' + ckEng(pp.dv, 'V') + '</b>')}
      ${z ? kv('Thévenin V_th', ckEng(pp.dv, 'V')) : ''}
      ${z ? kv(fdrive ? 'Thévenin Z_th at ' + ckEng(fdrive, 'Hz') : 'Thévenin R_th',
               fdrive ? ckEng(z.re, 'Ω') + (z.im >= 0 ? ' + j' : ' − j') + ckEng(Math.abs(z.im), 'Ω')
                      : ckEng(z.re, 'Ω')) : ''}
      ${z && fdrive ? kv('|Z_th| ∠ φ', ckEng(z.mag, 'Ω') + ' ∠ ' + fmtNum(z.ph, 4) + '°') : ''}
      ${pp.ishort !== null ? kv('current if you shorted them', '<b>' + ckEng(pp.ishort, 'A') + '</b>') : ''}
      ${z ? kv('power a matched load would take', ckEng(z.mag > 1e-12 ? pp.dv * pp.dv / (4 * Math.max(1e-12, z.re)) : 0, 'W')) : ''}
      <p class="help">An ideal voltmeter draws nothing, so <b>ΔV</b> is just the difference of two solved node
      potentials. The rest is <b>Thévenin's theorem</b>: every linear network seen from two terminals is
      indistinguishable from one source <b>V_th</b> behind one impedance <b>Z_th</b>. Z_th is measured here the
      way you would on a bench — switch every independent source off, drive 1 A in at A and out at B, and read
      the voltage that appears. The short-circuit current is then <b>I_N = V_th/Z_th</b>, and the most power any
      load can extract is <b>V_th²/4R_th</b>, when it matches.</p>
      ${ck.nonlinear ? '<p class="help" style="color:var(--faint)">This circuit contains nonlinear parts, so the equivalent is the <i>small-signal</i> one about the present operating point — which is exactly what Thévenin equivalence means for something that is not linear.</p>' : ''}
    </div>`;
  }

  return probeCard + `<div class="card tight"><div class="ttl">At the probe · (${fmtNum(st.probeP.x,3)}, ${fmtNum(st.probeP.y,3)})</div>
      ${near ? kv('nearest part', near.name + ' — ' + CK_KINDS[near.kind].name) : ''}
      ${near ? kv('v across it', ckEng(near.v, 'V')) : ''}
      ${near ? kv('i through it', ckEng(ckShowI(near), 'A')) : ''}
      ${near ? kv('p = v·i', ckEng(Math.abs(ckShowP(near)), 'W') + ' ' + ckShowVerb(near)) : ''}
      ${fieldRows}
      ${fieldRows ? '' : '<p class="help">Switch on <b>potential map</b>, <b>equipotentials</b> or <b>electric field E</b> to have the probe read the field as well as the circuit.</p>'}
    </div>
    <div class="card tight"><div class="ttl">Node voltages · t = ${ckEng(st.sim.t, 's')}</div>
      ${nodeRows.join('')}
      <p class="help">Every voltage is measured from the ground symbol, which is node 0 by definition.</p>
    </div>
    <div class="card tight"><div class="ttl">Every part — v, i and p</div>
      ${elRows.join('')}
      <p class="help">Sign convention: for a passive part <b>i</b> is the current entering pin 1, so
      <b>p = v·i</b> is the power it <i>absorbs</i>. A source is quoted the other way round — by the
      current it drives out of its + terminal and the power it <i>delivers</i> — because that is what
      anyone actually wants to know about a battery. Internally the solver uses the single absorbing
      convention throughout, which is what makes the Tellegen sum below close exactly.</p>
    </div>
    <div class="card tight"><div class="ttl">The laws, checked numerically</div>
      ${kv('largest KCL residual  Σi at a node', ckEng(m.kclMax, 'A') + (m.kclNode ? ' (node ' + m.kclNode + ')' : ''))}
      ${kv('relative to the biggest branch current', fmtNum(m.kclRel, 3))}
      ${kv('KCL verdict', m.kclRel < 1e-6 ? '✓ Kirchhoff\'s current law holds' : 'check the circuit')}
      ${kv('Σ power absorbed', ckEng(m.absorbed, 'W'))}
      ${kv('Σ power delivered', ckEng(m.delivered, 'W'))}
      ${kv('Tellegen residual', ckEng(m.residual, 'W'))}
      ${kv('energy stored in L and C', ckEng(m.energy, 'J'))}
      <p class="help">Both checks are computed from each part's own constitutive law — <b>v = iR</b>,
      <b>i = C dv/dt</b>, <b>v = L di/dt</b> — evaluated at the solved node voltages, never read back out of
      the matrix. Their agreement is therefore evidence that the solve is right, not a restatement of it.</p>
    </div>
    ${theory ? `<div class="card tight"><div class="ttl">What theory says this circuit must do</div>${theory}</div>` : ''}
    ${acRows ? `<div class="card tight"><div class="ttl">In the frequency domain</div>${acRows}
      <p class="help">Impedance is the AC generalisation of resistance: <b>Z = R + jX</b>, with
      <b>X_L = ωL</b> positive and <b>X_C = −1/ωC</b> negative. When they cancel, the circuit is at resonance.</p></div>` : ''}
    ${rmsRows ? `<div class="card tight"><div class="ttl">Over the scope window</div>${rmsRows}
      <p class="help">RMS is the DC value that would dissipate the same power: <b>V_rms = √(⟨v²⟩)</b>,
      which for a sine of amplitude V₀ is <b>V₀/√2</b>.</p></div>` : ''}
    <div class="card tight"><div class="ttl">How it is solved</div>
      ${kv('unknowns in the matrix', String(ck.n) + ' (' + ck.nN + ' node voltages, ' + ck.nCur + ' branch currents' + (ck.nInt ? ', ' + ck.nInt + ' internal' : '') + ')')}
      ${kv('integration', st.sim.steps ? 'trapezoidal, h = ' + ckEng(st.h, 's') : 'DC operating point')}
      ${kv('nonlinear', ck.nonlinear ? 'yes — Newton–Raphson each step' : 'no — one linear solve per step')}
      ${st.warn ? kv('note', st.warn) : ''}
      <p class="help">Modified nodal analysis: one equation per node from <b>Σi = 0</b>, plus one extra
      equation for every branch whose current cannot be written from the node voltages alone — inductors,
      voltage sources, transformers and op-amp outputs. Capacitors and inductors enter through trapezoidal
      companion models, which is why the LC energy neither grows nor decays.</p>
    </div>`;
}
