STAGES.relBoost = {
  title: 'Relativity of the fields',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 1 / Math.sqrt(1 - st.beta * st.beta);
    return {
      title:'What a moving charge\'s field really looks like',
      steps:[
        drvStep('at rest, the field is spherically symmetric',
          `${dv('E')} ${dop('=')} ${dfrac(dv('q'), '4πε₀' + dv('r') + '²')}${dv('r')}̂`,
          'the same in every direction — Coulomb, with nothing special about any axis'),
        drvStep('now boost, and the transverse components are multiplied by γ',
          `${dv('E')}_⊥′ ${dop('=')} γ${dv('E')}_⊥ , &nbsp; ${dv('E')}_∥′ ${dop('=')} ${dv('E')}_∥`,
          `β = ${n(st.beta)} gives γ = ${n(g)} — the panel draws both frames`),
        drvSay('so the field pancakes',
          'Sideways it is strengthened by γ; forwards and backwards it is unchanged. The result is a field concentrated into a disc perpendicular to the motion, growing flatter as the speed rises. A fast charge does not carry a sphere of field with it.'),
        drvStep('and a magnetic field appears from nothing',
          `${dv('B')}′ ${dop('=')} ${dfrac('1', dv('c') + '²')}${dv('v')} ${dop('×')} ${dv('E')}′`,
          'circling the direction of travel — the panel reads both fields at the probe'),
        drvSay('which is the magnetism of a current, one charge at a time',
          'A wire\'s magnetic field is the sum of these, one per moving electron. Nothing new is introduced when charges move — the same field, seen from a frame in which it looks different, is what we call magnetic.'),
        drvStep('the field lines stay radial but bunch up',
          `pointing at the present position, not the retarded one`,
          'for uniform motion the field points at where the charge is now, which is a genuine surprise'),
        drvSay('and that is not a violation of causality',
          'The information travels at c, but for unaccelerated motion it is predictable — the field "extrapolates". Accelerate the charge and the extrapolation fails: a kink propagates outwards at c, and that kink is electromagnetic radiation. Radiation is the field failing to keep up.'),
        drvStep('the flux is unchanged, so Gauss still holds',
          `∯ ${dv('E')}′ ${dop('·')} d${dv('A')} ${dop('=')} ${dfrac(dv('q'), 'ε₀')}`,
          'the panel integrates it in the boosted frame and gets the same answer — charge is invariant'),
        drvSay('and charge being invariant is a stronger statement than it sounds',
          'Energy, momentum, length and time all change under a boost; charge does not. A current-carrying wire is electrically neutral in the lab and stays neutral however fast you run past it, even though the moving and stationary charges in it have different length contractions applied to their spacing. That is an experimental fact accurate to about one part in 10²¹, and it is why the electron and proton charges cancel to that precision despite the particles being nothing alike.'),
        drvSay('which is what makes magnetism a relativistic effect rather than a separate force',
          'Boost into the frame of the drifting electrons in a wire and the two charge densities contract differently, so the wire acquires a net charge and a pure electric field appears — and what the lab frame calls a magnetic force on a passing charge, that frame calls an ordinary Coulomb attraction. There is one field, and the split into E and B is a choice of observer. β for drifting electrons in copper is about 10⁻¹¹, so the whole of electrical engineering rests on a relativistic correction at the eleventh decimal place, amplified by the sheer number of charges present.')
      ],
      note:'Charge is a Lorentz invariant, unlike energy or momentum. The panel confirms it by integrating the flux in both frames: the field is redistributed but its total outflow is unchanged, which is why an atom stays neutral however its electrons move.'
    };
  },
  enter(st, o){
    st.beta = o.beta !== undefined ? o.beta : 0.7;
    st.frame = 'lab';                 // 'rest' | 'lab'
    st.probe = 1.6; st.probeY = 1.1; st.phase = 0;
  },
  controls(){
    return ctlRow('speed β = v/c', ctlSlider('rbB', 0, 0.99, 0.01, ST.beta)) +
      ctlRow('frame', `<div class="seg" id="rbF">
        <button data-f="rest" aria-pressed="false">charge's frame</button>
        <button data-f="lab" aria-pressed="true">lab frame</button></div>`) +
      `<p class="help">One charge, two observers. Riding with the charge you measure a pure Coulomb field - no magnetism anywhere. Watching it fly past, the SAME charge shows a compressed electric field plus a <b>magnetic</b> field circling the motion. Neither observer is wrong: <b>E and B are one object</b> (the field tensor F) sliced two ways, exactly as this stage computes from the closed-form boosted solution. All magnetism - every motor, every compass - is this effect, sourced by charges in relative motion.</p>`;
  },
  wire(){
    wireSlider('rbB', () => ST.beta, v => { ST.beta = v; }, v => (+v).toFixed(2), RL_BETA_LIM);
    for(const b of $('rbF').children) b.addEventListener('click', () => {
      ST.frame = b.dataset.f;
      for(const c of $('rbF').children) c.setAttribute('aria-pressed', String(c === b));
      refreshStageReadout(); updateStageLegend();
    });
  },
  frame(st, dt, ctx, W, H){
    st.phase += dt;
    const beta = st.frame === 'rest' ? 0 : st.beta;
    const gam = 1 / Math.sqrt(1 - st.beta * st.beta);
    const scale = Math.min(W, H) / 8;
    const cx = W / 2, cy = H / 2 + 10;
    const toS = (x, y) => [cx + x * scale, cy - y * scale];
    st.fromS = (sx, sy) => [(sx - cx) / scale, (cy - sy) / scale];
    /* field lines: uniform angles in the rest frame, tan(th_lab) = gamma tan(th_rest) */
    const N = 24;
    for(let i = 0; i < N; i++){
      const th0 = i / N * 2 * Math.PI + 0.001;
      const th = beta > 0 ? Math.atan2(Math.sin(th0) * gam, Math.cos(th0)) : th0;
      const ux = Math.cos(th), uy = Math.sin(th);
      /* line length ~ sqrt(E) so the crowding also reads as strength */
      const F0 = relBoostField(ux * 1, uy * 1, beta);
      const len = 0.8 + 2.6 * Math.min(1, Math.sqrt(F0.E / 1.2));
      const [x1, y1] = toS(ux * 0.28, uy * 0.28), [x2, y2] = toS(ux * (0.28 + len), uy * (0.28 + len));
      ctx.strokeStyle = rgbCss(TH.warn, 0.85); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const hx = (x2 - x1), hy = (y2 - y1), hl = Math.hypot(hx, hy) || 1;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 7 * hx / hl - 3.5 * -hy / hl, y2 - 7 * hy / hl - 3.5 * hx / hl);
      ctx.lineTo(x2 - 7 * hx / hl + 3.5 * -hy / hl, y2 - 7 * hy / hl + 3.5 * hx / hl);
      ctx.closePath(); ctx.fillStyle = rgbCss(TH.warn, 0.85); ctx.fill();
    }
    /* the magnetic field: dot/cross symbols on a grid, size ~ |B| */
    if(beta > 0.005){
      ctx.font = '600 13px ' + FONT_MONO; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for(let gx = -3.4; gx <= 3.4; gx += 0.85){
        for(let gy = -2.4; gy <= 2.4; gy += 0.85){
          if(gx * gx + gy * gy < 0.35) continue;
          const F = relBoostField(gx, gy, beta);
          const s2 = Math.min(1, Math.abs(F.Bz) / 0.9);
          if(s2 < 0.02) continue;
          const [sx2, sy2] = toS(gx, gy);
          ctx.fillStyle = rgbCss(TH.neg, 0.25 + 0.75 * s2);
          ctx.fillText(F.Bz > 0 ? '⊙' : '⊗', sx2, sy2);   /* out of / into the page */
        }
      }
    }
    /* the charge, with a motion streak in the lab frame */
    if(beta > 0.005){
      ctx.strokeStyle = rgbCss(TH.pos, 0.35); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 90, cy); ctx.lineTo(cx - 14, cy); ctx.stroke();
      ctx.fillStyle = rgbCss(TH.pos);
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 5); ctx.lineTo(cx - 12, cy); ctx.lineTo(cx - 22, cy + 5); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = rgbCss(TH.pos);
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = rgbCss(TH.bg); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = rgbCss(TH.bg); ctx.font = '700 12px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('+', cx, cy);
    /* probe */
    const [px2, py2] = toS(st.probe, st.probeY);
    ctx.strokeStyle = rgbCss(TH.text, 0.8); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(px2, py2); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = rgbCss(TH.text);
    ctx.beginPath(); ctx.arc(px2, py2, 4.5, 0, 6.2832); ctx.fill();
    ctx.font = '600 11px ' + FONT_UI; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('probe', px2 + 8, py2 - 4);
    ctx.fillStyle = rgbCss(TH.dim); ctx.font = '600 12px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(st.frame === 'rest'
      ? "charge's own frame: pure Coulomb E, B = 0 everywhere — by definition of 'at rest'"
      : 'lab frame: β = ' + st.beta.toFixed(2) + ', γ = ' + gam.toFixed(3) + ' — E pancakes transverse, and B appears', W / 2, 16);
    stageNote(ctx, 'the invariant E² − B² in the panel is the same number in both frames — that is what "E and B are one tensor" means operationally', W, H);
  },
  pick(st, sx, sy){
    if(!st.fromS) return;
    const [x, y] = st.fromS(sx, sy);
    if(x * x + y * y > 0.09){ st.probe = x; st.probeY = y; }
  },
  readout(st){
    const gam = 1 / Math.sqrt(1 - st.beta * st.beta);
    const lab = relBoostField(st.probe, st.probeY, st.beta);
    const rest = relBoostField(st.probe, st.probeY, 0);
    const showLab = st.frame === 'lab';
    const F = showLab ? lab : rest;
    const inv = (lab.Ex * lab.Ex + lab.Ey * lab.Ey) - lab.Bz * lab.Bz;
    /* the same spacetime event has rest-frame coordinates (gamma x, y) */
    const restAt = relBoostField(gam * st.probe, st.probeY, 0);
    const invRest = restAt.E * restAt.E;
    return `<div class="card tight"><div class="ttl">At the probe · r = ${fmtNum(Math.hypot(st.probe, st.probeY), 3)}, θ = ${fmtNum(F.th * 180 / Math.PI, 1)}°</div>
      ${kv('E = (E<sub>x</sub>, E<sub>y</sub>)', '(' + fmtNum(F.Ex, 4) + ', ' + fmtNum(F.Ey, 4) + ')')}
      ${kv('|E|', fmtNum(Math.hypot(F.Ex, F.Ey), 4) + (showLab ? '' : ' — plain Coulomb 1/r²'))}
      ${kv('B (out of page)', showLab ? fmtNum(F.Bz, 4) + ' = β × E' : '<b>0</b> — no motion, no magnetism')}
      ${kv('γ = 1/√(1−β²)', fmtNum(gam, 4))}
      ${kv('invariant E² − B² (lab)', fmtNum(inv, 5))}
      ${kv("same invariant, charge's frame", fmtNum(invRest, 5) + ' — identical, as it must be')}
      <p class="help">Special relativity, quantitatively: E<sub>⊥</sub> is multiplied by γ while E<sub>∥</sub> is untouched, and B = β × E materialises. A wire's magnetic force on a moving charge is the SAME effect run backwards: in the charge's frame, length-contracted ion and electron densities unbalance and the force is purely electric. Magnetism is electrostatics plus relativity.</p>
    </div>
    <div class="card tight"><div class="ttl">And general relativity?</div>
      <p class="help">Gravity plays the same frame games with time instead of fields: clocks deeper in a
      potential run slower by √(1 + 2Φ/c²) — GPS satellites gain 38 microseconds a day and the system
      corrects for it or fails within minutes. Light bends (1.75″ at the sun, 1919), orbits precess
      (Mercury's 43″/century), and accelerating masses radiate spacetime ripples heard by LIGO since 2015.
      This stage shows only the <i>special</i>-relativistic half of the story, because a Coulomb-style
      field engine cannot draw curvature. The general-relativity demos later in this wing do it properly:
      the Schwarzschild metric, orbits integrated from the geodesic equation, gravitational lensing and
      the LIGO chirp.</p>
    </div>`;
  },
  chip(st){
    const gam = 1 / Math.sqrt(1 - st.beta * st.beta);
    const F = relBoostField(st.probe, st.probeY, st.frame === 'lab' ? st.beta : 0);
    return `<div class="k">frames &amp; fields — ${st.frame}</div><div>β = ${st.beta.toFixed(2)}, γ = ${gam.toFixed(3)}</div><div style="color:var(--c-warn)">|E| = ${fmtNum(Math.hypot(F.Ex, F.Ey), 3)}</div><div style="color:var(--c-neg)">B = ${fmtNum(F.Bz, 3)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'E field lines (exact boosted Coulomb)'], ['var(--c-neg)', 'B into/out of page (appears with motion)'], ['var(--c-pos)', 'the charge']]; }
};

