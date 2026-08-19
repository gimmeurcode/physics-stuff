/* ============================================================================
   
2fa - QUANTUM: MEASUREMENT, TUNNELLING AND SPIN FILTERS
   Split out of 
60b-stages-quantum.js
 to keep each file under the ~600-line guidance
   in src/js/CLAUDE.md. Load order is unchanged: this file sorts immediately
   after its parent, and everything shares one script scope.
   ============================================================================ */


/* ---- 5 · measurement and collapse -------------------------------------------- */
STAGES.qmCollapse = {
  title: 'Measurement collapses ψ',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'The one place where the theory stops being a differential equation',
      steps:[
        drvSay('quantum mechanics has two rules, and they do not resemble each other',
          'Between measurements a state evolves by the Schrödinger equation: deterministic, continuous, reversible. On measurement it jumps to an eigenstate at random, with probabilities given by the Born rule: indeterministic, discontinuous, irreversible. No known principle derives the second from the first.'),
        drvStep('the Born rule',
          `${dv('P')}(${dv('x')}) ${dop('=')} |ψ(${dv('x')})|²`,
          'the probability density for finding the particle at x'),
        drvStep('and after the measurement the state is different',
          `ψ ${dop('→')} localised near the result`,
          `detector resolution ${n(st.res)} — the panel replaces ψ with a packet of that width`),
        drvSay('the modulus squared is what makes probabilities work',
          'ψ is complex and can be negative or imaginary, so it cannot be a probability. |ψ|² is real, non-negative, and its integral is conserved by the Schrödinger equation — so total probability stays 1 forever. The equation was built to make that true.'),
        drvStep('a sharper measurement makes a narrower packet',
          `Δ${dv('x')} small ${dop('⇒')} Δ${dv('p')} large`,
          'so the post-measurement packet spreads faster — the panel shows it happening'),
        drvSay('which is the observer effect, and it is a real but separate thing',
          'This *is* a disturbance caused by measuring, and it is genuine. It should not be confused with the uncertainty principle, which constrains a state nobody has touched. The two are often conflated and they are different claims.'),
        drvStep('repeat the measurement immediately and you get the same answer',
          `second measurement confirms the first`,
          'because the state is now an eigenstate of what was measured — the panel marks each measurement'),
        drvSay('and this is where the interpretations disagree',
          'Copenhagen takes collapse as a primitive and declines to explain it. Many-worlds denies it happens, saying the observer becomes entangled and each outcome is realised in a branch. Decoherence explains why interference becomes unobservable without explaining why one outcome occurs. No experiment has yet distinguished them.'),
        drvSay('what is not in doubt',
          'The predictions are the same for all of them and are confirmed to extraordinary precision. The disagreement is about what the mathematics means, not about what it forecasts — which is worth stating plainly, because the interpretations are often presented as rival theories rather than rival readings of one theory.')
      ],
      note:'Each measurement here draws a real random number from the computed |ψ|² and then replaces the state with a packet centred on that result. The subsequent evolution is exact, so the post-measurement spreading is a consequence of the narrower packet rather than an animation.'
    };
  },
  enter(st, o){
    st.P = { x0: 0, k0: 0, s0: 0.5 };
    st.res = o.res || 0.35;              // detector resolution → post-measurement width
    st.marks = []; st.auto = false; st.autoT = 0; st.tOff = 0;
  },
  controls(){
    return ctlRow('resolution', ctlSlider('qcRes', 0.1, 1, 0.02, ST.res)) +
      `<div class="row wrap"><button class="btn pri" id="qcMeasure">Measure position</button>
        <button class="btn sm" id="qcAuto" aria-pressed="false">Auto-measure</button>
        <button class="btn sm" id="qcReset">Reset</button></div>
      <p class="help">Between measurements ψ evolves deterministically by the Schrödinger equation — spreading, since a localized packet contains many momenta. A position measurement does the only non-deterministic thing in the theory: it returns x with probability |ψ(x)|², and leaves the particle in a packet of width = your detector's resolution, centred on the result. Then the spreading starts over.</p>`;
  },
  wire(){
    wireSlider('qcRes', () => ST.res, v => { ST.res = v; }, v => (+v).toFixed(2));
    const measure = () => {
      const t = ST.t - ST.tOff;
      const pdf = x => cAbs2(qmPacketPsi(x, t, ST.P));
      const xm = qmSampleFrom(pdf, -10, 10, 700);
      const kloc = qmLocalK(xm, t, ST.P);
      ST.marks.push({ x: xm, at: ST.t });
      if(ST.marks.length > 24) ST.marks.shift();
      ST.P = { x0: xm, k0: kloc, s0: ST.res };
      ST.tOff = ST.t;
    };
    $('qcMeasure').addEventListener('click', () => { measure(); refreshStageReadout(); });
    $('qcAuto').addEventListener('click', e => {
      ST.auto = !ST.auto;
      e.target.setAttribute('aria-pressed', String(ST.auto));
    });
    $('qcReset').addEventListener('click', () => { ST.P = { x0: 0, k0: 0, s0: 0.5 }; ST.marks = []; ST.tOff = ST.t; });
    ST.doMeasure = measure;
  },
  frame(st, dt, ctx, W, H){
    const t = st.t - st.tOff;
    if(st.auto){ st.autoT += dt; if(st.autoT > 1.6){ st.autoT = 0; st.doMeasure(); } }
    if(qmPacketStats(t, st.P).dx > 4.5) st.tOff = st.t - 0;   // keep it on screen: it has spread flat
    const stats = qmPacketStats(t, st.P);
    const pmax = Math.pow(2 * Math.PI * 0.1 * 0.1, -0.5) * 0.35;
    const pl = st.pl = mkPlot(64, 46, W - 90, H - 46 - 64, -8, 8, 0, pmax);
    plotFrame(ctx, pl, 'x', '', 'ψ evolving freely · time since last collapse = ' + t.toFixed(2));
    plotTicksX(ctx, pl, [-8, -4, 0, 4, 8]);
    const pdf = x => cAbs2(qmPacketPsi(x, t, st.P));
    plotCurve(ctx, pl, pdf, 320, null, 0, rgbCss(TH.accent, 0.20));
    plotCurve(ctx, pl, pdf, 320, rgbCss(TH.accent), 2.2);
    /* history of collapse results */
    ctx.font = '10px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    st.marks.forEach((m, i) => {
      const alpha = 0.25 + 0.75 * (i + 1) / st.marks.length;
      ctx.fillStyle = rgbCss(TH.pos, alpha);
      ctx.beginPath(); ctx.arc(pl.X(m.x), pl.py + pl.ph + 10, 3, 0, 6.2832); ctx.fill();
    });
    ctx.fillStyle = rgbCss(TH.faint);
    ctx.fillText('collapse results ↑ (each was random, weighted by |ψ|² at that instant)', pl.px + pl.pw / 2, pl.py + pl.ph + 20);
    probeLine(ctx, pl, st.probe, 'probe');
    stageNote(ctx, 'Δx now = ' + fmtNum(stats.dx, 3) + ' · measure while it is wide and the result scatters widely; measure fast and often and it barely moves (the Zeno regime)', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.max(-8, Math.min(8, st.pl.invX(sx))); },
  readout(st){
    const t = st.t - st.tOff, stats = qmPacketStats(t, st.P);
    const p2 = cAbs2(qmPacketPsi(st.probe, t, st.P));
    const last = st.marks.length ? st.marks[st.marks.length - 1] : null;
    return `<div class="card tight"><div class="ttl">At the probe · x = ${fmtNum(st.probe, 3)}</div>
      ${kv('|ψ(x)|² right now', fmtNear(p2))}
      ${kv('chance next measurement lands within ±0.25', fmtNum(Math.min(1, p2 * 0.5) * 100, 3) + '%')}
    </div>
    <div class="card tight"><div class="ttl">The state</div>
      ${kv('Δx since collapse', fmtNum(stats.dx, 4))}
      ${kv('Δp (fixed by the collapse width)', fmtNum(stats.dp, 4))}
      ${last ? kv('last result', 'x = ' + fmtNum(last.x, 3)) : ''}
      ${kv('measurements so far', String(st.marks.length))}
      <p class="help">Tighter detector resolution ⇒ narrower collapsed packet ⇒ larger Δp ⇒ faster re-spreading. You cannot win: that is Δx·Δp ≥ ħ/2 enforcing itself on the measurement chain.</p>
    </div>`;
  },
  chip(st){
    const t = st.t - st.tOff, stats = qmPacketStats(t, st.P);
    return `<div class="k">collapse lab</div><div>Δx = ${fmtNum(stats.dx, 3)}</div><div>N measured = ${st.marks.length}</div>`;
  },
  legend(){ return [['var(--accent)', '|ψ|² — evolves deterministically'], ['var(--c-pos)', 'measurement outcomes — irreducibly random']]; }
};

/* ---- 6 · tunnelling through a barrier ---------------------------------------- */
STAGES.qmTunnel = {
  title: 'Quantum tunnelling',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Getting through a wall by having a wavefunction that does not stop',
      steps:[
        drvStep('outside the barrier the solution oscillates',
          `ψ ${dop('=')} ${dop('e')}^(${dop('±')}${dop('i')}${dv('k')}${dv('x')}), &nbsp; ${dv('k')} ${dop('=')} √(2${dv('m')}${dv('E')})/ħ`,
          `E = ${n(st.E)}, V₀ = ${n(st.V0)}, width a = ${n(st.a)}`),
        drvStep('inside, with E below V₀, the sign flips',
          `ψ″ ${dop('=')} ${dfrac('2' + dv('m') + '(' + dv('V') + '₀ − ' + dv('E') + ')', 'ħ²')}ψ`,
          'a positive coefficient, so the solutions are real exponentials rather than oscillations'),
        drvSay('that sign change is the entire phenomenon',
          'Classically the kinetic energy would be negative inside the barrier, which is impossible, so the particle turns round. Quantum mechanically the equation simply changes character: instead of a wave it gives a decaying exponential. Decaying is not zero, and the wavefunction survives to the far side.'),
        drvStep('match ψ and ψ′ at both edges',
          `ψ and ψ′ continuous at ${dv('x')} ${dop('=')} 0 and ${dv('a')}`,
          'four conditions, which fix the amplitudes on both sides'),
        drvSay('continuity of the derivative is what forces leakage',
          'A kink in ψ would mean an infinite second derivative and hence infinite energy. So ψ cannot simply stop at the wall — it must join smoothly to the decaying exponential, and that exponential must join smoothly to a travelling wave beyond. There is no way to make the far-side amplitude zero.'),
        drvStep('the transmission probability',
          `${dv('T')} ${dop('≈')} ${dop('e')}^(${dop('−')}2∫κ d${dv('x')}), &nbsp; κ ${dop('=')} √(2${dv('m')}(${dv('V')}(${dv('x')}){−}${dv('E')}))/ħ`,
          `the panel solves the matching and prints T, with this estimate alongside — here ∫κ dx = ${n(qmTunCur(st).gamow.integral)}`),
        drvSay('and the integral is what generalises past the rectangle',
          'For a rectangle ∫κ dx is just κa, which is where the familiar e^(−2κa) comes from. But nothing in the argument needed the barrier to be flat: slice any shape thinly enough and each slice contributes its own κ times its own width. That is the whole content of the WKB approximation, and it is why the same formula covers an alpha particle climbing a Coulomb tail, a scanning tunnelling microscope\'s vacuum gap, and whatever you type into the box above. Type a barrier and watch the estimate track the exact answer — closely when the barrier is thick and smooth, badly when it is thin or steep, because the slicing argument assumed κ changes slowly across a decay length.'),
        drvSay('exponential in both width and height, which is why it is so sensitive',
          'Double the barrier width and T does not halve — it squares. That extreme sensitivity is what makes the scanning tunnelling microscope work: the current depends so sharply on the gap that a change of one atomic diameter alters it by orders of magnitude, giving atomic resolution from a blunt tip.'),
        drvStep('and above the barrier there is still reflection',
          `${dv('E')} ${dop('>')} ${dv('V')}₀ ${dop('⇒')} ${dv('T')} ${dop('<')} 1`,
          st.E > st.V0 ? 'which is the case here — a classical particle would always pass' : 'raise E above V₀ to see it'),
        drvSay('because reflection happens at any change of medium',
          'Waves reflect wherever the wave equation\'s coefficients change abruptly, whether the change is upwards or downwards. Light partly reflects off a pane of glass for the same reason. And at particular energies the two internal reflections cancel exactly, giving perfect transmission — resonant tunnelling, which the panel shows as sharp peaks.'),
        drvStep('and the nuclear wing uses this at scale',
          `α decay half-lives span 10²⁴`,
          'because the Gamow factor puts the barrier integral in an exponent, exactly as here')
      ],
      note:'The transmission coefficient is obtained by solving the matching conditions exactly rather than from the exponential estimate, so the resonances above the barrier appear correctly. The estimate is printed alongside and the difference is visible where the approximation is poor.'
    };
  },
  enter(st, o){
    st.E = o.E || 0.6; st.V0 = o.V0 || 1; st.a = o.a || 1.4; st.probe = st.a / 2;
    st.own = !!o.own;
  },
  controls(){
    const cur = qmTunCur(ST);
    return ctlRow('energy E', ctlSlider('qtE', 0.05, 2.5, 0.01, ST.E)) +
      ctlRow(ST.own ? 'barrier scale V₀' : 'barrier V₀', ctlSlider('qtV', 0.2, 2.5, 0.01, ST.V0)) +
      ctlRow('width a', ctlSlider('qtA', 0.3, 4, 0.05, ST.a)) +
      ctSeg('qtOwn', ST.own ? 'own' : 'rect',
            [['rect', 'a rectangular barrier'], ['own', 'type your own V(x)']]) +
      (ST.own ? fnHtml('qmtun_V', 'V(x) ∝', pkOwn(ST, 'qmtun', QM_TUN_OWN, null).V,
                       'x, from 0 to ' + fmtNum(ST.a, 3)) : '') +
      `<p class="help">${cur.note}</p>
      <p class="help">The stationary scattering state, matched at both walls. With E &lt; V₀ a classical particle bounces off every time; the wave instead decays as e^(−κx) inside and emerges with probability T &gt; 0. Alpha decay, nuclear fusion in the sun, and tunnelling microscopes all live on this exponential.</p>`;
  },
  wire(){
    wireSlider('qtE', () => ST.E, v => { ST.E = v; }, v => (+v).toFixed(2));
    wireSlider('qtV', () => ST.V0, v => { ST.V0 = v; }, v => (+v).toFixed(2));
    wireSlider('qtA', () => ST.a, v => { ST.a = v; ST.probe = Math.min(ST.probe, v); }, v => (+v).toFixed(2));
    ctWireSeg('qtOwn', v => { ST.own = (v === 'own'); });
    if(ST.own){
      const own = pkOwn(ST, 'qmtun', QM_TUN_OWN, null);
      fnWire('qmtun_V', (m, s) => { own.V = s; });
    }
  },
  frame(st, dt, ctx, W, H){
    const B = qmTunCur(st);
    st.B = B;
    const xlo = -6, xhi = st.a + 6;
    const pl = st.pl = mkPlot(64, 46, W - 90, H - 46 - 44, xlo, xhi, -2.6, 2.6);
    plotFrame(ctx, pl, 'x', '', `scattering state · E = ${st.E.toFixed(2)}, peak V = ${B.Vmax.toFixed(2)} · T = ${(B.T * 100).toFixed(2)}%  R = ${(B.R * 100).toFixed(2)}%`);
    plotZeroY(ctx, pl);
    /* the barrier, drawn as the profile it actually is — a rectangle when that
       is what was chosen, and whatever was typed when it was not */
    const vScale = 1.6 / Math.max(B.Vmax, st.E, 1);
    ctx.fillStyle = rgbCss(TH.warn, 0.16);
    ctx.strokeStyle = rgbCss(TH.warn, 0.7); ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(pl.X(0), pl.Y(0));
    for(let i = 0; i <= 300; i++){
      const x = st.a * i / 300;
      ctx.lineTo(pl.X(x), pl.Y(B.V(x) * vScale));
    }
    ctx.lineTo(pl.X(st.a), pl.Y(0));
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    const by = pl.Y(B.Vmax * vScale), bx0 = pl.X(0);
    /* energy line */
    ctx.strokeStyle = rgbCss(TH.pos, 0.8); ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(pl.px, pl.Y(st.E * vScale)); ctx.lineTo(pl.px + pl.pw, pl.Y(st.E * vScale)); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = rgbCss(TH.pos); ctx.font = '600 10.5px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('E', pl.px + 4, pl.Y(st.E * vScale) - 2);
    ctx.fillStyle = rgbCss(TH.warn);
    ctx.fillText(B.custom ? 'peak V' : 'V₀', bx0 + 4, by - 2);
    /* ψ with the time phase e^{-iEt} so it visibly travels */
    const ph = C(Math.cos(-st.E * st.t * 2), Math.sin(-st.E * st.t * 2));
    plotCurve(ctx, pl, x => cMul(B.psi(x), ph).re, 460, rgbCss(TH.grad), 1.5);
    plotCurve(ctx, pl, x => cAbs2(B.psi(x)) * 0.5, 460, rgbCss(TH.accent), 2.2);
    probeLine(ctx, pl, st.probe, 'probe');
    const kappa = st.E < B.Vmax ? Math.sqrt(2 * (B.Vmax - st.E)) : 0;
    stageNote(ctx, st.E < B.Vmax
      ? 'under the barrier ψ ∝ e^(−κx), κ = √(2(V−E)) = ' + fmtNum(kappa, 3) + ' at the peak — every extra width costs e^(−2κ·Δa) in T'
      : 'E above the whole barrier: classically it always crosses — but the wave still partially reflects, and T oscillates with width', W, H);
  },
  pick(st, sx){ if(st.pl) st.probe = Math.max(st.pl.x0, Math.min(st.pl.x1, st.pl.invX(sx))); },
  readout(st){
    const B = st.B || qmTunCur(st);
    const c = B.psi(st.probe);
    const reg = st.probe < 0 ? 'I — incident + reflected' : st.probe > st.a ? 'III — transmitted' : 'II — inside the barrier';
    const kappa = st.E < B.Vmax ? Math.sqrt(2 * (B.Vmax - st.E)) : 0;
    return `<div class="card tight"><div class="ttl">At the probe · x = ${fmtNum(st.probe, 3)} · region ${reg}</div>
      ${kv('V(x) here', fmtNum(B.V(st.probe), 4))}
      ${kv('|ψ(x)|²', fmtNear(cAbs2(c)))}
      ${kv('Re ψ / Im ψ', fmtNum(c.re, 3) + ' / ' + fmtNum(c.im, 3))}
    </div>
    <div class="card tight"><div class="ttl">${B.custom ? 'Coefficients, by transfer matrix' : 'Exact coefficients'}</div>
      ${kv('T (transmission)', '<b>' + fmtNum(B.T, 5) + '</b>')}
      ${kv('R (reflection)', fmtNum(B.R, 5))}
      ${kv('T + R (must be 1)', fmtNum(B.T + B.R, 10))}
      ${kv('k = √(2E)', fmtNum(B.k, 4))}
      ${kv('WKB ∫κ dx over your barrier', fmtNum(B.gamow.integral, 5))}
      ${kv('WKB estimate e^(−2∫κ dx)', fmtNum(B.gamow.T, 5))}
      ${st.E < B.Vmax ? kv('κ at the peak', fmtNum(kappa, 4)) + kv('decay length 1/κ', fmtNum(1 / kappa, 4)) : ''}
      <p class="help">${st.E < B.Vmax ? 'T ≈ 16(E/V)(1−E/V)e^(−2∫κ) for a thick barrier: exponential in width and in √(V−E). Double the width and T roughly squares — which is why alpha-decay lifetimes span 30 orders of magnitude. The WKB row is that exponential alone, without the prefactor the wall-matching supplies, so the ratio to T is the prefactor being measured.' : 'Above the barrier, T dips below 1 except at the resonances where the two internal reflections cancel and the barrier becomes perfectly transparent. WKB has nothing to say up here — there is no forbidden region to integrate over — and the row reads 1.'}</p>
    </div>`;
  },
  chip(st){
    const B = st.B || qmTunCur(st);
    return `<div class="k">tunnelling</div><div>E/V = ${(st.E / (B.Vmax || 1)).toFixed(2)}</div><div style="color:var(--c-pos)">T = ${(B.T * 100).toFixed(2)}%</div><div style="color:var(--c-neg)">R = ${(B.R * 100).toFixed(2)}%</div>`;
  },
  legend(){ return [['var(--accent)', '|ψ|² (scaled)'], ['var(--c-grad)', 'Re ψ e^(−iEt)'], ['var(--c-warn)', 'the barrier V(x)'], ['var(--c-pos)', 'energy E']]; }
};

/* ---- 7 · Stern–Gerlach: spin, filters, and cos²(θ/2) -------------------------- */
STAGES.qmSG = {
  title: 'Stern–Gerlach filters',
  derive(st){
    const n = v => fmtNum(v, 6);
    const th = st.theta * Math.PI / 180;
    return {
      title:'Three magnets, and the destruction of classical intuition',
      steps:[
        drvSay('the setup, which is deliberately simple',
          'A beam of atoms passes through a magnet that separates them by spin. Take only the "up" output and pass it through a second magnet tilted by an angle. Then, optionally, a third back along the original axis. Nothing here is subtle apparatus — the surprise is in the counts.'),
        drvStep('the first filter prepares a definite state',
          `everything leaving is |↑⟩_z`,
          'measured along z, and a repeat measurement along z would confirm it every time'),
        drvStep('the tilted analyser projects onto its own axis',
          `${dv('P')} ${dop('=')} cos²(θ/2)`,
          `θ = ${n(st.theta)}° gives ${n(Math.cos(th / 2) * Math.cos(th / 2))} — the panel counts atoms and converges on it`),
        drvSay('note the half-angle, which is the signature of spin ½',
          'A classical vector projected onto a tilted axis would give cos θ. Spin ½ gives cos²(θ/2), so the state must be rotated by 720° to return to itself, not 360°. Half-integer spin is not a metaphor — it is visible in this exponent.'),
        drvStep('at 90° the beam splits exactly evenly',
          `cos²(45°) ${dop('=')} ${dfrac('1', '2')}`,
          'a state definitely up along z is completely undetermined along x'),
        drvStep('and the third magnet is the one that breaks intuition',
          `re-measure along ${dv('z')}: half are down`,
          st.third ? 'the third analyser is on — and the "up" atoms have half of them coming out down' : 'switch the third analyser on to see it'),
        drvSay('this is the part with no classical explanation available',
          'Every atom entering the second magnet was verified up along z. After being measured along x, half are down along z. The measurement did not reveal a pre-existing x-value — it destroyed the z-value. There was no hidden list of answers being read off.'),
        drvStep('because the operators do not commute',
          `[${dv('S')}_x, ${dv('S')}_z] ${dop('≠')} 0`,
          'so no state can have both definite — the general uncertainty relation, applied to spin'),
        drvSay('and Bell later showed hidden variables cannot rescue it',
          'The natural objection is that each atom carries hidden instructions. Bell derived an inequality that any such theory must satisfy, and experiments violate it — decisively, and now with every loophole closed. The indefiniteness is not ignorance about a definite value; there is no definite value.')
      ],
      note:'The atoms are simulated individually, each drawn at random with probability cos²(θ/2). The counts converge on the predicted fractions as the beam runs, so the statistics are generated rather than displayed — and the fluctuations are the real 1/√N of the probability wing.'
    };
  },
  enter(st, o){
    st.theta = o.theta !== undefined ? o.theta : 60;   // degrees, analyzer 2 vs 1
    st.third = !!o.third;                              // re-measure along z after the tilt
    st.atoms = []; st.counts = [0, 0, 0, 0]; st.emitAcc = 0;
  },
  controls(){
    return ctlRow('analyzer θ', ctlSlider('sgTh', 0, 180, 1, ST.theta)) +
      `<label class="chk"><input type="checkbox" id="sgThird" ${ST.third ? 'checked' : ''}><span>Add a third analyzer back along ẑ</span></label>
      <div class="row wrap"><button class="btn sm" id="sgClear">Reset counters</button></div>
      <p class="help">Atoms leave the oven unpolarised. Analyzer 1 keeps only spin-up along ẑ. Analyzer 2 is tilted by θ: quantum mechanics says each atom goes "up-along-θ" with probability <b>cos²(θ/2)</b> — individually random, statistically exact. The third analyzer shows the sharpest fact in the subject: measuring along θ <b>erases</b> the earlier ẑ answer.</p>`;
  },
  wire(){
    wireSlider('sgTh', () => ST.theta, v => { ST.theta = v; ST.counts = [0, 0, 0, 0]; ST.atoms = []; }, v => v + '°');
    $('sgThird').addEventListener('change', e => { ST.third = e.target.checked; ST.counts = [0, 0, 0, 0]; ST.atoms = []; });
    $('sgClear').addEventListener('click', () => { ST.counts = [0, 0, 0, 0]; ST.atoms = []; });
  },
  frame(st, dt, ctx, W, H){
    const yMid = H / 2, thR = st.theta * Math.PI / 180;
    const stations = st.third ? 4 : 3;
    const sx = i => 60 + (W - 140) * i / (stations - 0.4);
    /* emit */
    st.emitAcc += dt * 28;
    while(st.emitAcc >= 1){
      st.emitAcc -= 1;
      st.atoms.push({ x: sx(0), y: yMid, lane: 0, stage: 0, alive: true });
      if(st.atoms.length > 260) st.atoms.shift();
    }
    /* draw stations */
    const label = ['oven', 'SG-ẑ (keep +)', 'SG-θ = ' + st.theta + '°', 'SG-ẑ again'];
    ctx.font = '600 11px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for(let i = 0; i < stations; i++){
      const x = sx(i);
      ctx.fillStyle = i === 0 ? rgbCss(TH.warn, 0.25) : rgbCss(TH.accent, 0.14);
      ctx.strokeStyle = i === 0 ? rgbCss(TH.warn) : rgbCss(TH.accent);
      ctx.lineWidth = 1.2;
      ctx.fillRect(x - 22, yMid - 46, 44, 92);
      ctx.strokeRect(x - 22, yMid - 46, 44, 92);
      ctx.fillStyle = rgbCss(TH.dim);
      ctx.fillText(label[i], x, yMid - 52);
      if(i > 0){
        /* magnet gap glyph */
        ctx.fillStyle = rgbCss(TH.pos, 0.6); ctx.fillRect(x - 14, yMid - 40, 28, 7);
        ctx.fillStyle = rgbCss(TH.neg, 0.6); ctx.fillRect(x - 14, yMid + 33, 28, 7);
      }
    }
    /* advance atoms */
    const pUp2 = sgProbUp(thR);                        // P(+θ | +z)
    const pUp3 = sgProbUp(thR);                        // P(+z | +θ) — same angle back
    for(const a of st.atoms){
      if(!a.alive) continue;
      a.x += dt * 170;
      for(let i = 1; i < stations; i++){
        const x = sx(i);
        if(a.stage === i - 1 && a.x > x){
          a.stage = i;
          let keepP;
          if(i === 1) keepP = 0.5;                     // unpolarised → ½ up
          else if(i === 2) keepP = pUp2;
          else keepP = pUp3;
          if(Math.random() < keepP){ a.y = yMid - 22 - Math.random() * 6; a.up = true; }
          else {
            a.y = yMid + 22 + Math.random() * 6; a.up = false;
            if(i >= 2){ a.alive = false; a.dead = true; }  // blocked: only + beam continues
            if(i === 1){ a.alive = false; a.dead = true; }
          }
          if(i === stations - 1){
            st.counts[a.up ? 0 : 1]++;
            if(i === 2 && !st.third){} // counted at final analyzer
          }
        }
      }
      if(a.x > W - 50 && a.alive){ a.done = true; a.alive = false; }
    }
    st.atoms = st.atoms.filter(a => a.alive || (a.fade = (a.fade || 1) - dt * 2) > 0);
    for(const a of st.atoms){
      ctx.fillStyle = rgbCss(a.up === false ? TH.neg : a.up ? TH.pos : TH.text, Math.max(0.15, Math.min(1, a.fade || 1)));
      ctx.beginPath(); ctx.arc(a.x, a.y, 3, 0, 6.2832); ctx.fill();
    }
    /* counters + prediction */
    const tot = st.counts[0] + st.counts[1] || 1;
    const exp2 = st.third ? pUp2 * pUp3 : pUp2;
    ctx.fillStyle = rgbCss(TH.text); ctx.font = '12px ' + FONT_MONO; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    /* the legend floats over the canvas bottom-left; start the counters clear
       of it — "= 75.0%" lost its own label under it (2026-08-19 sweep) */
    const lz = ctLegendZone(ctx);
    const cx0 = (lz && H - 66 > lz.top - 2) ? Math.max(60, lz.right + 12) : 60;
    ctx.fillText('kept:    ' + st.counts[0] + '  (' + (100 * st.counts[0] / tot).toFixed(1) + '%)', cx0, H - 66);
    ctx.fillText('blocked: ' + st.counts[1], cx0, H - 48);
    ctx.fillStyle = rgbCss(TH.pos);
    ctx.fillText('prediction: ' + (st.third ? 'cos²(θ/2)·cos²(θ/2)' : 'cos²(θ/2)') + ' = ' + (exp2 * 100).toFixed(1) + '%', cx0, H - 30);
  },
  readout(st){
    const thR = st.theta * Math.PI / 180, p = sgProbUp(thR);
    const tot = st.counts[0] + st.counts[1] || 1;
    const exp2 = st.third ? p * p : p;
    return `<div class="card tight"><div class="ttl">The amplitude arithmetic</div>
      ${kv('|⟨+θ|+z⟩|² = cos²(θ/2)', fmtNum(p, 4))}
      ${kv('predicted keep rate' + (st.third ? ' (×2 filters)' : ''), fmtNum(exp2 * 100, 4) + '%')}
      ${kv('measured keep rate', fmtNum(100 * st.counts[0] / tot, 4) + '% of ' + tot)}
      <p class="help">θ = 0 keeps everything; θ = 180° keeps nothing; θ = 90° is a coin flip. With the third analyzer on, atoms that were <i>certainly</i> spin-up along ẑ fail the final ẑ test half the time (at θ = 90°): the tilted measurement destroyed that information. Non-commuting measurements cannot have simultaneous answers.</p>
    </div>`;
  },
  chip(st){
    const p = sgProbUp(st.theta * Math.PI / 180);
    return `<div class="k">Stern–Gerlach</div><div>θ = ${st.theta}°</div><div style="color:var(--c-pos)">cos²(θ/2) = ${fmtNum(p, 4)}</div>`;
  },
  legend(){ return [['var(--c-pos)', 'deflected up — kept'], ['var(--c-neg)', 'deflected down — blocked'], ['var(--text)', 'not yet measured']]; }
};

/* ============================================================================
   ATOM STAGES
   ============================================================================ */

/* ---- 8 · the atom, across its scales, with its force carriers ----------------- */
