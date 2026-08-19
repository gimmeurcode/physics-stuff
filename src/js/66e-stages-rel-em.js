/* ============================================================================
   GROUP 4 · ELECTROMAGNETISM IS RELATIVITY
   Einstein's 1905 paper opens not with clocks or trains but with a complaint
   about magnets: the same experiment gets two unrelated explanations depending
   on which object you call "moving", and that asymmetry "does not appear to be
   inherent in the phenomena". This group is that complaint, resolved.
   ============================================================================ */

/* an oblique 3D triad: +x right (the boost direction), +y up, +z up-and-left */
function rlProj(o, s, v){
  return { x: o.x + (v.x - 0.50 * v.z) * s, y: o.y - (v.y + 0.34 * v.z) * s };
}
function rlTriad(ctx, o, s, labels){
  const ax = [[v3(1,0,0), 'x'], [v3(0,1,0), 'y'], [v3(0,0,1), 'z']];
  for(const [u, nm] of ax){
    const p = rlProj(o, s, u);
    rlSegment(ctx, o.x, o.y, p.x, p.y, rgbCss(TH.line2), 1);
    if(labels) rlText(ctx, p.x + 4, p.y - 4, nm, rgbCss(TH.faint), '10px ' + FONT_MONO);
  }
}
function rlVecArrow(ctx, o, s, v, col, label){
  const p = rlProj(o, s, v);
  rlArrow(ctx, o.x, o.y, p.x, p.y, col, 2.4, 9);
  if(label && vlen(v) > 0.02)
    rlText(ctx, p.x + 6, p.y - 7, label, col, '600 11px ' + FONT_MONO);
}

/* ---- 13 · boosting the field -----------------------------------------------
   Six numbers, one object. A boost mixes E into B and B into E, and the only
   things it leaves alone are E·B and E² − c²B². */
STAGES.rlEB = {
  title: 'Boosting E and B',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Electric and magnetic are not separate things',
      steps:[
        drvSay('the fields are frame-dependent, and that is not a technicality',
          'A pure electric field in one frame has a magnetic component in another. Neither observer is wrong. What is electric and what is magnetic depends on who is looking, which means they cannot be two independent physical entities.'),
        drvStep('components along the boost are unchanged',
          `${dv('E')}_∥′ ${dop('=')} ${dv('E')}_∥ , &nbsp; ${dv('B')}_∥′ ${dop('=')} ${dv('B')}_∥`,
          `boosting at β = ${n(st.beta)} — the panel transforms and draws both frames`),
        drvStep('and the transverse components mix',
          `${dv('E')}_⊥′ ${dop('=')} γ(${dv('E')}_⊥ ${dop('+')} ${dv('v')} ${dop('×')} ${dv('B')})_⊥`,
          'each field acquires a piece of the other'),
        drvSay('so a purely electric field generates a magnetic one merely by being watched from a moving frame',
          'Start with a static charge: pure E, no B. Boost, and now the charge is a current, which must have a magnetic field. Nothing changed about the charge — only the description. The next stage takes this seriously and derives magnetism from it.'),
        drvStep('but two combinations are the same for everyone',
          `${dv('E')}² ${dop('−')} ${dv('c')}²${dv('B')}² and ${dv('E')} ${dop('·')} ${dv('B')}`,
          'the panel computes both in each frame and prints the differences, which vanish'),
        drvSay('and invariants are how you tell what is really there',
          'If E·B = 0 in one frame it is zero in all — perpendicular fields stay perpendicular. If E² − c²B² is positive there is a frame with pure E and no B; if negative, a frame with pure B. Those are frame-independent facts about the field, and the frame-dependent split is not.'),
        drvStep('a light wave is the marginal case',
          `${dv('E')} ${dop('=')} ${dv('cB')} and ${dv('E')} ${dop('·')} ${dv('B')} ${dop('=')} 0`,
          'both invariants vanish, so no frame can remove either field — which is why light looks like light to everyone'),
        drvSay('and the honest conclusion is that there is one field',
          'The electromagnetic field is a single object, and E and B are the pieces a particular observer slices it into. The next stage writes it as a tensor, where that unity is manifest rather than argued for.')
      ],
      note:'Both invariants are computed independently in the two frames and printed with their differences. They agree to machine precision at every boost and field orientation, which is the claim being tested rather than stated.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.fkey = o.fkey || 'pureE';
    st.beta = o.beta === undefined ? 0.6 : o.beta;
  },
  /* the accessor is the whole retrofit: every `this.fields(st)` below is
     unchanged and now reads a typed field as happily as a preset */
  fields(st){ const C = rlEbCur(st); return { E:C.E, B:C.B }; },
  controls(){ return rlEbControls(ST); },
  wire(){ rlEbWire(); },
  frame(st, dt, ctx, W, H){
    const f = this.fields(st);
    const F = relTransformEB(f.E, f.B, v3(st.beta, 0, 0));
    /* s and the row spacing below are chosen so the two component read-outs
       clear the plot's title: at the old s = 0.30·top they landed within a
       pixel of it and the right-hand block was printed straight through
       "Sweeping every boost". Text over text on a canvas is invisible to every
       gate here — auditticks reads duplicate TICKS and headings under the
       chip, not two labels colliding — so it is a screenshot finding. */
    const top = H * 0.46, s = Math.min(W * 0.09, top * 0.26);
    const panel = (ox, oy, E, B, title, tint) => {
      const o = { x: ox, y: oy };
      rlText(ctx, ox, oy - s * 1.9, title, rgbCss(tint), '600 12px ' + FONT_UI, 'center');
      rlTriad(ctx, o, s * 1.15, true);
      /* the boost direction, drawn once so the geometry is unambiguous */
      rlVecArrow(ctx, o, s, E, rgbCss(TH.warn), 'E');
      rlVecArrow(ctx, o, s, B, rgbCss(TH.neg), 'B');
      rlDot(ctx, ox, oy, 3, rgbCss(TH.text));
      const rows = [
        ['E', E, TH.warn], ['B', B, TH.neg]
      ];
      rows.forEach(([nm, v, col], i) => {
        rlText(ctx, ox - s * 1.6, oy + s * 1.35 + i * 15,
          nm + ' = (' + fmtNum(v.x, 3) + ', ' + fmtNum(v.y, 3) + ', ' + fmtNum(v.z, 3) + ')',
          rgbCss(col), '10.5px ' + FONT_MONO);
      });
    };
    panel(W * 0.27, top * 0.62, f.E, f.B, 'Lab frame', TH.grad);
    panel(W * 0.70, top * 0.62, F.E, F.B, 'Moving at β = ' + fmtNum(st.beta, 3) + 'c along x', TH.pos);
    rlArrow(ctx, W * 0.45, top * 0.62, W * 0.53, top * 0.62, rgbCss(TH.mid), 2, 9);
    rlText(ctx, W * 0.49, top * 0.62 - 14, 'boost', rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');

    /* the invariants, swept over every boost */
    const P = mkPlot(60, top + 46, W - 100, H - top - 116, -0.99, 0.99, -3, 3);
    plotFrame(ctx, P, 'boost β', '', 'Sweeping every boost: two of these curves are flat');
    plotZeroY(ctx, P);
    plotTicksX(ctx, P, [-0.99, -0.5, 0, 0.5, 0.99], v => fmtNum(v, 2));
    rlYTicks(ctx, P, [-3, -1.5, 0, 1.5, 3]);
    const N = 320, bs = new Float64Array(N), eL = new Float64Array(N), bL = new Float64Array(N),
          i1 = new Float64Array(N), i2 = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const bb = -0.99 + 1.98 * i / (N - 1);
      const G = relTransformEB(f.E, f.B, v3(bb, 0, 0));
      const I = relFieldInvariants(G.E, G.B);
      bs[i] = bb; eL[i] = vlen(G.E); bL[i] = vlen(G.B); i1[i] = I.diff; i2[i] = I.dot;
    }
    rlLine(ctx, P, bs, eL, rgbCss(TH.warn, 0.55), 1.7, [4, 4]);
    rlLine(ctx, P, bs, bL, rgbCss(TH.neg, 0.55), 1.7, [4, 4]);
    rlLine(ctx, P, bs, i1, rgbCss(TH.grad), 2.6);
    rlLine(ctx, P, bs, i2, rgbCss(TH.curl), 2.6);
    rlSegment(ctx, P.X(st.beta), P.py, P.X(st.beta), P.py + P.ph, rgbCss(TH.pos, 0.6), 1.2, [4, 4]);
    stageNote(ctx, 'the dashed curves are |E| and |B| — they move; the solid ones are the invariants, and they do not', W, H);
  },
  readout(st){
    const f = this.fields(st);
    const F = relTransformEB(f.E, f.B, v3(st.beta, 0, 0));
    const I0 = relFieldInvariants(f.E, f.B), I1 = relFieldInvariants(F.E, F.B);
    /* Both invariants legitimately VANISH — E·B = 0 for crossed fields, E² − c²B² = 0
       for a null one — and then fmtAgree's derived scale IS the round-off, so a
       perfect result prints as a 100% disagreement. The gross is what the
       cancellation came from, taken in whichever frame is larger. */
    const gDot = Math.max(vlen(f.E) * vlen(f.B), vlen(F.E) * vlen(F.B));
    const gDif = Math.max(vdot(f.E, f.E), vdot(f.B, f.B), vdot(F.E, F.E), vdot(F.B, F.B));
    const c3 = v => '(' + fmtNum(v.x, 4) + ',  ' + fmtNum(v.y, 4) + ',  ' + fmtNum(v.z, 4) + ')';
    return `<div class="card tight"><div class="ttl">The six components, before and after</div>
      ${kv('E   (lab)', c3(f.E))}
      ${kv('B   (lab)', c3(f.B))}
      ${kv("E′  (moving)", c3(F.E))}
      ${kv("B′  (moving)", c3(F.B))}
      ${kv('|E| → |E′|', fmtNum(vlen(f.E), 5) + '  →  ' + fmtNum(vlen(F.E), 5))}
      ${kv('|B| → |B′|', fmtNum(vlen(f.B), 5) + '  →  ' + fmtNum(vlen(F.B), 5))}
      <p class="help">The x components never change — a boost cannot touch the field along its own
      direction. Everything else rotates in the six-dimensional space that E and B jointly live in.</p>
    </div>
    <div class="card tight"><div class="ttl">What no observer can argue with</div>
      ${kv('E·B      (lab)', fmtNear(I0.dot))}
      ${kv("E′·B′   (moving)", fmtNear(I1.dot))}
      ${kv('E² − c²B²  (lab)', fmtNum(I0.diff, 6))}
      ${kv("E′² − c²B′²  (moving)", fmtNum(I1.diff, 6))}
      ${kv('residuals', fmtAgreeGross(I1.dot, I0.dot, gDot) + '  /  ' + fmtAgreeGross(I1.diff, I0.diff, gDif))}
      ${kv('this field is', relFieldCharacter(f.E, f.B))}
      <p class="help">Neither number moves, at any boost, in any direction. They are what the field
      <i>is</i>, as against what a particular observer measures — and the card below takes the
      classification they produce and goes to the frame it names.</p>
    </div>` + rlEbDriftCard(st);
  },
  chip(st){
    const f = this.fields(st);
    const F = relTransformEB(f.E, f.B, v3(st.beta, 0, 0));
    return `<div class="k">Field boost</div>
      <div style="color:var(--c-warn)">|E′| = ${fmtNum(vlen(F.E), 4)}</div>
      <div style="color:var(--c-neg)">|B′| = ${fmtNum(vlen(F.B), 4)}</div>
      <div style="color:var(--c-grad)">E²−B² = ${fmtNear(relFieldInvariants(F.E, F.B).diff)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'E, and |E| against β'], ['var(--c-neg)', 'B, and |B| against β'],
                    ['var(--c-grad)', 'E² − c²B² — invariant'],
                    ['var(--c-curl)', 'E·B — invariant'],
                    ['var(--c-pos)', 'your chosen boost']]; }
};

/* ---- 14 · the current-carrying wire -----------------------------------------
   The demonstration the whole wing is built around. A neutral wire and a moving
   charge: one frame calls the force magnetic, the other calls it electrostatic,
   and they agree to the last digit. Magnetism is not a separate force. */
STAGES.rlWire = {
  title: 'Where magnetism comes from',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Magnetism is electrostatics plus length contraction',
      steps:[
        drvSay('the setup, which is the most persuasive argument in this wing',
          'A current-carrying wire is electrically neutral: as many positive ions as conduction electrons. A charge moving parallel to it feels a magnetic force. Now analyse the same situation from the moving charge\'s own frame, where it is at rest and can feel no magnetic force at all.'),
        drvStep('in the lab frame the wire is neutral',
          `λ₊ ${dop('+')} λ₋ ${dop('=')} 0`,
          'equal and opposite line charge densities, so no electric field outside'),
        drvStep('boost to the test charge\'s frame and the two densities contract differently',
          `λ′ ${dop('=')} γ λ`,
          `drift β = ${n(st.bd)}, test charge β = ${n(st.bv)} — the panel computes both densities in both frames`),
        drvSay('here is the crux',
          'The positive ions were at rest in the lab and are now moving, so their spacing contracts and their density rises. The electrons were already moving and now move differently, so their density changes by a different factor. The cancellation that made the wire neutral no longer holds.'),
        drvStep('so in that frame the wire carries net charge',
          `λ_net ${dop('≠')} 0`,
          'the panel prints the residual density — small, but nonzero'),
        drvStep('and a net charge produces an ordinary electric force',
          `${dv('F')} ${dop('=')} ${dfrac('λ_net' + dv('q'), '2πε₀' + dv('d'))}`,
          `at distance ${n(st.d)}: the panel computes this and the lab-frame magnetic force, and they match`),
        drvSay('so the magnetic force and the electric force are the same force',
          'One observer calls it magnetic, the other electric, and they compute the same physical effect — the same acceleration of the same particle. Magnetism is what electrostatics looks like when the charges are moving and lengths contract.'),
        drvSay('and the astonishing part is the size of the effect',
          'Drift velocities in a copper wire are of order a millimetre per second, so γ − 1 is around 10⁻²³. That utterly negligible contraction produces forces strong enough to run motors — because the electric forces being unbalanced are enormous, and only their near-perfect cancellation kept them hidden.'),
        drvStep('which is why relativity is not only about fast things',
          `a tiny γ acting on a huge force`,
          'every electric motor is a relativistic effect operating at walking pace')
      ],
      note:'The panel computes the force in both frames from first principles — magnetic in the lab, purely electrostatic in the charge\'s frame — and prints them together. They agree, which is the argument completed numerically rather than gestured at.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.mode = o.mode || 'cartoon';
    st.bd = o.bd === undefined ? 0.5 : o.bd;     // drift speed as a fraction of c (cartoon mode)
    st.bv = o.bv === undefined ? 0.6 : o.bv;     // test charge speed
    st.d = 0.02;                                  // 2 cm from the wire
    st.lam0 = 1e-6;                               // C/m of each lattice
    /* the sheet mode's own state — its own units (c = 1), so it keeps its own
       keys rather than reinterpreting the SI ones above */
    st.wkeyw = o.wkeyw || 'neutral';
    st.wsheet = o.wsheet !== undefined ? o.wsheet : (RL_WIRES[st.wkeyw] || RL_WIRES.neutral).text;
    st.wvt = o.wvt === undefined ? (RL_WIRES[st.wkeyw] || RL_WIRES.neutral).vt : o.wvt;
  },
  controls(){
    const st = ST;
    const head = rlSeg('rlWiM', st.mode, [['cartoon','cartoon speeds — you can see the effect'],
                                     ['real','real speeds — you cannot'],
                                     ['sheet','build the wire yourself']]);
    if(st.mode === 'sheet') return head + rlWireSheetControls(st);
    return head +
      ctlRow('electron drift', ctlSlider('rlWiD', 0.05, 0.9, 0.01, st.bd)) +
      ctlRow('test charge v', ctlSlider('rlWiV', -0.9, 0.9, 0.01, st.bv)) +
      rlClockCtl() +
      `<p class="help">The wire is <b>neutral</b>: a fixed lattice of positive ions and an equal density
      of electrons drifting along it. In the lab (top) a charge moving parallel to the wire feels a
      <b>magnetic</b> force, <b>qv×B</b>. Ride along with that charge (bottom) and there is no magnetic
      force to feel — but the two lattices are now contracted by <i>different</i> factors, the wire
      carries net charge, and the force is <b>electrostatic</b>. Same force, same magnitude, two
      completely different stories. In "real speeds" mode the electron drift is a tenth of a millimetre
      per second and the charge imbalance is a part in 10¹⁷ — invisible, and still the entire origin of
      every magnet you have ever handled.</p>`;
  },
  wire(){
    rlWireSeg('rlWiM', v => { ST.mode = v; });
    if(ST.mode === 'sheet'){ rlWireSheetWire(); return; }
    wireSlider('rlWiD', () => ST.bd, v => { ST.bd = v; }, v => fmtNum(+v, 3) + ' c  (cartoon only)', RL_BETA_LIM);
    wireSlider('rlWiV', () => ST.bv, v => { ST.bv = v; }, rlBetaFmt, RL_BETA_LIM);
    rlWireClock();
  },
  facts(st){
    const real = st.mode === 'real';
    const vd = real ? 1e-4 : st.bd * C_SI;
    const v  = real ? 2e5  : st.bv * C_SI;
    return { vd, v, w: relWireFrames(st.lam0, vd, v, st.d, 1.602176634e-19), real };
  },
  frame(st, dt, ctx, W, H){
    if(st.mode === 'sheet') return rlWireSheetFrame(st, ctx, W, H);
    const f = this.facts(st);
    const bd = f.vd / C_SI, bv = f.v / C_SI;
    const gd = relGamma(bd), gv = relGamma(bv);
    const bdp = relVelAdd(bd, -bv), gdp = relGamma(bdp);
    /* the drawn spacings: proportional to 1/density, so contraction shows up as
       charges crowding together. In "real" mode nothing would be visible, so the
       picture keeps the cartoon geometry and the readout keeps the truth. */
    const T = st.t * 0.5;
    const P = rlPanes(W, H, 26);

    const wireScene = (pane, title, tint, sPlus, sMinus, vPlus, vMinus, charge, testV, force, fLabel) => {
      const S1 = rlScene(ctx, pane.x, pane.y, pane.w, pane.h, title, tint);
      const y0 = S1.y + S1.h * 0.34, y1 = S1.y + S1.h * 0.52;
      const x0 = S1.x + 24, x1 = S1.x + S1.w - 24, span = x1 - x0;
      /* the wire body */
      ctx.fillStyle = rgbCss(TH.bg3, 0.75);
      ctx.fillRect(x0, y0 - 13, span, 34);
      ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
      ctx.strokeRect(x0, y0 - 13, span, 34);
      const draw = (spacing, vel, yy, col, sym) => {
        const step = span * spacing / 14;
        const off = ((vel * T * 60) % step + step) % step;
        for(let x = x0 + off - step; x < x1 + step; x += step){
          if(x < x0 - 1 || x > x1 + 1) continue;
          rlDot(ctx, x, yy, 4.6, rgbCss(col, 0.9));
          rlText(ctx, x, yy, sym, rgbCss(TH.bg), '600 9px ' + FONT_MONO, 'center');
        }
        return step;
      };
      const stepP = draw(sPlus, vPlus, y0, TH.pos, '+');
      const stepM = draw(sMinus, vMinus, y1, TH.neg, '−');
      /* no row labels at the left edge — the first pane's sat under the
         readout chip (J6), and every carrier dot already carries its sign */
      rlText(ctx, x1 + 6, y0, fmtNum(1 / sPlus, 4) + '×', rgbCss(TH.pos), '10px ' + FONT_MONO);
      rlText(ctx, x1 + 6, y1, fmtNum(1 / sMinus, 4) + '×', rgbCss(TH.neg), '10px ' + FONT_MONO);
      /* net charge verdict */
      rlText(ctx, S1.cx, y1 + 26, charge, rgbCss(charge.indexOf('neutral') >= 0 ? TH.faint : TH.pos),
             '600 11px ' + FONT_MONO, 'center');
      /* the test charge and the force on it */
      const qy = S1.y + S1.h * 0.83;
      const qx = S1.cx + (testV ? ((testV * T * 60) % (span * 0.5)) - span * 0.12 : 0);
      rlDot(ctx, qx, qy, 7, rgbCss(TH.curl));
      rlText(ctx, qx, qy, 'q', rgbCss(TH.bg), '600 10px ' + FONT_MONO, 'center');
      if(testV) rlArrow(ctx, qx + 12, qy, qx + 12 + 34 * Math.sign(testV), qy, rgbCss(TH.curl, 0.7), 1.6, 7);
      if(Math.abs(force) > 1e-40) rlArrow(ctx, qx, qy - 10, qx, qy - 10 - 30 * Math.sign(force), rgbCss(TH.grad), 2.4, 9);
      rlText(ctx, qx + 20, qy - 26, fLabel, rgbCss(TH.grad), '10.5px ' + FONT_MONO);
      return S1;
    };

    /* --- lab frame --- */
    const S1 = wireScene(P.top, 'Lab frame — the wire is neutral, and the force is magnetic', TH.grad,
      1, 1, 0, bd, 'net charge: zero — the wire is neutral', bv, f.w.Flab > 0 ? 1 : -1,
      'F = qv×B = ' + fmtNum(f.w.Flab, 4) + ' N');
    /* B field symbols around the wire — the label goes on the left, where there
       is room, rather than off the right-hand edge of the pane */
    for(let i = 0; i < 5; i++){
      const bxp = S1.cx - 130 + i * 65;
      const yy = S1.y + S1.h * 0.70;
      ctx.strokeStyle = rgbCss(TH.neg, 0.85); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(bxp, yy, 6, 0, 6.2832); ctx.stroke();
      rlDot(ctx, bxp, yy, 2, rgbCss(TH.neg));
    }
    rlText(ctx, S1.cx - 148, S1.y + S1.h * 0.70, 'B out of the page',
           rgbCss(TH.neg), '10px ' + FONT_MONO, 'right');

    /* --- the charge's frame --- */
    wireScene(P.bot, "The charge's frame — the charge is at rest, and the force is electrostatic", TH.pos,
      1 / gv, gd / gdp, -bv, bdp,
      'net charge: ' + fmtNum(f.w.lamNet, 4) + ' C/m — the wire is charged',
      0, f.w.Fprime > 0 ? 1 : -1, 'F′ = qE′ = ' + fmtNum(f.w.Fprime, 4) + ' N');
    stageNote(ctx, f.real
      ? 'at real drift speeds the two rows are identical to sixteen decimal places — and the force is still there'
      : 'the ions crowd together, the electrons spread out, and what was magnetism becomes electrostatics', W, H);
  },
  readout(st){
    if(st.mode === 'sheet') return rlWireSheetReadout(st);
    const f = this.facts(st), w = f.w;
    return `<div class="card tight"><div class="ttl">The lab frame: a magnetic force</div>
      ${kv('lattice density λ₀', fmtNum(st.lam0, 4) + ' C/m  (each sign)')}
      ${kv('electron drift v_d', fmtNum(f.vd, 4) + ' m/s')}
      ${kv('current I = λ₀v_d', fmtNum(w.I, 5) + ' A')}
      ${kv('distance from the wire', fmtNum(st.d * 100, 3) + ' cm')}
      ${kv('B = μ₀I/2πd', fmtNum(w.B, 5) + ' T')}
      ${kv('test charge speed v', fmtNum(f.v, 4) + ' m/s')}
      ${kv('F = qvB', fmtNum(w.Flab, 6) + ' N')}
      ${kv('net charge on the wire', '0 — exactly')}
    </div>
    <div class="card tight"><div class="ttl">The charge's frame: an electric force</div>
      ${kv('γ of the boost', fmtNum(w.gammaV, 12))}
      ${kv("electrons' new drift v_d′", fmtNum(w.vdPrime, 5) + ' m/s')}
      ${kv("λ₊′ = γ_v λ₀", fmtNum(w.lamPlus, 12) + ' C/m')}
      ${kv("λ₋′ = −λ₀ γ_d′/γ_d", fmtNum(w.lamMinus, 12) + ' C/m')}
      ${kv('net λ′ = λ₀γ_v v v_d/c²', fmtNum(w.lamNet, 5) + ' C/m')}
      ${kv('as a fraction of either', fmtNum(Math.abs(w.lamNet / w.lamPlus), 4))}
      ${kv("E′ = λ′/2πε₀d", fmtNum(w.Eprime, 5) + ' V/m')}
      ${kv("F′ = qE′", fmtNum(w.Fprime, 6) + ' N')}
    </div>
    <div class="card tight"><div class="ttl">And they agree</div>
      ${kv("F′ / F", fmtNum(w.ratio, 12))}
      ${kv('γ_v', fmtNum(w.gammaV, 12))}
      ${kv('residual |F′ − γF|', fmtGap(w.residual, w.Fprime, 'N'))}
      <p class="help">The leftover factor of γ is not a discrepancy: transverse force transforms as
      <b>F′⊥ = γF⊥</b> when the particle is at rest in the primed frame, so <b>F′ = γ_v F</b> is exactly
      what agreement looks like. Divide it out and the two calculations — one using only <b>B</b>, the
      other using only <b>E</b> — give the same physical answer to the last bit.</p>
      <p class="help">Look at the size of the imbalance:
      <b>${fmtNum(Math.abs(w.lamNet / w.lamPlus), 3)}</b> of either lattice
      ${f.real ? '— a part in 10¹⁷ —' : ''} is all that separates a neutral wire from a charged one, and it
      is the whole of magnetism. ${f.real
        ? 'The drift speed of electrons in household wiring really is about a tenth of a millimetre per second: it would take them hours to travel the length of a lamp cord. Relativity has no small-velocity limit here, because the charge density is so vast that a correction of order v·v_d/c² is still a force you can feel.'
        : 'Switch to "real speeds" to see how absurdly small the effect is at drift velocities anything like the truth — and note that the force does not get any smaller, because the number of charges is correspondingly vast.'}</p>
      <p class="help">This is what Einstein meant in the first paragraph of the 1905 paper. Move the
      magnet or move the conductor and classical electrodynamics tells two unrelated stories — an
      induced electric field in one case, a Lorentz force in the other — which happen to agree every
      time. That coincidence "does not appear to be inherent in the phenomena", he wrote. It is not a
      coincidence: they are the same field.</p>
    </div>`;
  },
  chip(st){
    if(st.mode === 'sheet') return rlWireSheetChip(st);
    const w = this.facts(st).w;
    return `<div class="k">Magnetism from motion</div>
      <div style="color:var(--c-grad)">F = ${fmtNum(w.Flab, 4)} N</div>
      <div style="color:var(--c-pos)">F′ = ${fmtNum(w.Fprime, 4)} N</div>
      <div style="color:var(--c-neg)">λ′/λ₊ = ${fmtNum(Math.abs(w.lamNet / w.lamPlus), 3)}</div>`;
  },
  legend(st){
    if(st && st.mode === 'sheet')
      return [['var(--c-pos)', 'a species with positive density'], ['var(--c-neg)', 'a negative one'],
              ['var(--c-warn)', 'the test charge and its motion'],
              ['var(--c-curl)', 'the force on it — the same in both frames'],
              ['var(--mid)', 'which way each species drifts']];
    return [['var(--c-pos)', 'the positive lattice'], ['var(--c-neg)', 'the drifting electrons, and B'],
            ['var(--c-curl)', 'the test charge and its velocity'],
            ['var(--c-grad)', 'the force on it — same in both frames']]; }
};

/* ---- 15 · the field tensor -------------------------------------------------
   Everything above, written once. Maxwell's four equations become two, the
   boost becomes a matrix conjugation, and the reason E and B mix stops being a
   set of rules to memorise and becomes the statement that they are the entries
   of one antisymmetric tensor. */
STAGES.rlTensor = {
  title: 'The field tensor',
  derive(st){
    return {
      title:'Writing all four Maxwell equations as two',
      steps:[
        drvSay('why a tensor is the right container',
          'E and B mix under boosts, so neither is a vector in spacetime. What transforms cleanly is the pair taken together — six components arranged in an antisymmetric 4×4 array. That object is the electromagnetic field; E and B are its slices.'),
        drvStep('the field tensor',
          `${dv('F')}^μν with ${dv('E')} in the time row and ${dv('B')} in the space block`,
          'the panel displays it and transforms it under a boost'),
        drvStep('antisymmetry leaves exactly six independent components',
          `${dv('F')}^μν ${dop('=')} ${dop('−')}${dv('F')}^νμ`,
          'three for E and three for B — which is why there are two three-vectors and not one or three'),
        drvSay('the count is not a coincidence',
          'An antisymmetric 4×4 array has 4×3/2 = 6 independent entries. Electromagnetism has exactly six field components. The structure of spacetime dictates how many there can be.'),
        drvStep('and boosting is now just a matrix conjugation',
          `${dv('F')}′ ${dop('=')} Λ${dv('F')}Λ^T`,
          'the panel applies it and recovers the mixing formulas of the earlier stage exactly'),
        drvStep('two of Maxwell\'s equations collapse into one line',
          `∂_μ${dv('F')}^μν ${dop('=')} μ₀${dv('J')}^ν`,
          'Gauss\'s law and Ampère–Maxwell, together'),
        drvStep('and the other two into another',
          `∂_[α${dv('F')}_βγ] ${dop('=')} 0`,
          'the no-monopole law and Faraday, together — automatic once F comes from a potential'),
        drvSay('and the second pair is d∘d = 0 in disguise',
          'Writing F as the exterior derivative of a potential one-form makes the homogeneous pair an identity rather than a law. The forms wing derived exactly that, and here it is doing physical work: two of Maxwell\'s equations are consequences of the potential existing.'),
        drvSay('this is why relativity and electromagnetism fit so well',
          'Maxwell\'s equations were already Lorentz invariant thirty years before anyone noticed. They were never Galilean, which is why they seemed to demand an ether. In tensor form the compatibility is manifest — the equations are relativistic by construction.')
      ],
      note:'The panel transforms the tensor numerically under a boost and reads the resulting E and B back out, confirming they match the component transformation rules of the earlier stage. The two routes agree to machine precision.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.tkey = o.tkey || 'general';
    st.tsheet = o.tsheet !== undefined ? o.tsheet
              : (RL_TENSORS[st.tkey] || RL_TENSORS.general).text;
    st.beta = o.beta === undefined ? 0.7 : o.beta;
  },
  /* the sixteen numbers come first here, and E and B are read OFF them —
     which is the opposite of the stage before, where the tensor was built */
  cur(st){
    const C = rlTnCur(st);
    const F = C.F && C.F.length === 4 ? C.F : rlTensorParse(RL_TN_SHEET, null).F;
    const K = rlTensorCheck(F);
    return { C, F, E:K.E, B:K.B, K };
  },
  controls(){ return rlTnControls(ST); },
  wire(){ rlTnWire(); },
  frame(st, dt, ctx, W, H){
    const F = this.cur(st).F;
    const L = relLorentzMatrix(st.beta);
    const Fp = relBoostTensor(F, st.beta);
    /* draw a 4x4 matrix as a coloured grid with its numbers in the cells */
    const drawMat = (ox, oy, cell, M, title, note) => {
      rlText(ctx, ox + cell * 2, oy - 26, title, rgbCss(TH.text), '600 12.5px ' + FONT_UI, 'center');
      if(note) rlText(ctx, ox + cell * 2, oy - 10, note, rgbCss(TH.faint), '10.5px ' + FONT_UI, 'center');
      let mx = 1e-9;
      for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++) mx = Math.max(mx, Math.abs(M[i][j]));
      for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){
        const v = M[i][j], x = ox + j * cell, y = oy + i * cell;
        const t = Math.abs(v) / mx;
        ctx.fillStyle = rgbCss(v > 0 ? TH.warn : TH.neg, 0.06 + 0.36 * t);
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 0.8;
        ctx.strokeRect(x, y, cell, cell);
        rlText(ctx, x + cell / 2, y + cell / 2, fmtNum(v, 3),
               rgbCss(Math.abs(v) < 1e-12 ? TH.faint : TH.text), '10.5px ' + FONT_MONO, 'center');
      }
      /* index labels */
      for(let i = 0; i < 4; i++){
        rlText(ctx, ox - 8, oy + i * cell + cell / 2, 'txyz'[i], rgbCss(TH.faint), '10px ' + FONT_MONO, 'right');
        rlText(ctx, ox + i * cell + cell / 2, oy - 40 + 34, 'txyz'[i], rgbCss(TH.faint), '10px ' + FONT_MONO, 'center');
      }
    };
    const cell = Math.min(52, (W - 160) / 13);
    const top = 92;
    drawMat(70, top, cell, F, 'F^μν  (lab)', 'E along the first column, B in the 3×3 block');
    drawMat(70 + cell * 4 + 78, top, cell, L, 'Λ^μ_ν  (the boost)', 'a hyperbolic rotation in the t–x plane');
    drawMat(70 + 2 * (cell * 4 + 78), top, cell, Fp, "F′^μν = Λ F Λᵀ", 'the same field, in the moving frame');
    rlText(ctx, 70 + cell * 4 + 39, top + cell * 2, '×', rgbCss(TH.faint), '600 20px ' + FONT_MONO, 'center');
    rlText(ctx, 70 + 2 * (cell * 4 + 78) - 39, top + cell * 2, '=', rgbCss(TH.faint), '600 20px ' + FONT_MONO, 'center');

    /* the invariants, as bars that do not move */
    const by = top + cell * 4 + 56;
    const I0 = relFieldInvariants(relTensorE(F), relTensorB(F));
    const bars = [
      ['F_μν F^μν = 2(B² − E²)', relTensorInvariant1(F), relTensorInvariant1(Fp), TH.grad],
      ['F_μν F̃^μν = −4 E·B', relTensorInvariant2(F), relTensorInvariant2(Fp), TH.curl]
    ];
    rlText(ctx, 70, by - 12, 'The two scalars you can build out of F — computed in both frames',
           rgbCss(TH.dim), '600 11.5px ' + FONT_UI);
    bars.forEach(([nm, a, b, col], i) => {
      const y = by + 12 + i * 42;
      rlText(ctx, 70, y, nm, rgbCss(col), '11px ' + FONT_MONO);
      rlText(ctx, 340, y, 'lab: ' + fmtNum(a, 6), rgbCss(TH.grad), '11px ' + FONT_MONO);
      rlText(ctx, 520, y, "moving: " + fmtNum(b, 6), rgbCss(TH.pos), '11px ' + FONT_MONO);
      rlText(ctx, 720, y, 'Δ = ' + fmtNear(b - a), rgbCss(TH.faint), '11px ' + FONT_MONO);
    });
    /* Maxwell, in the form that shows the symmetry */
    const my = by + 104;
    rlText(ctx, 70, my, 'Maxwell, in this notation:', rgbCss(TH.dim), '600 11.5px ' + FONT_UI);
    rlText(ctx, 70, my + 22, '∂_μ F^μν = μ₀ J^ν', rgbCss(TH.warn), '600 15px ' + FONT_MONO);
    rlText(ctx, 260, my + 22, '— Gauss and Ampère–Maxwell, both of them',
           rgbCss(TH.faint), '11px ' + FONT_UI);
    rlText(ctx, 70, my + 46, '∂_[λ F_μν] = 0', rgbCss(TH.neg), '600 15px ' + FONT_MONO);
    rlText(ctx, 260, my + 46, '— no magnetic monopoles, and Faraday, both of them',
           rgbCss(TH.faint), '11px ' + FONT_UI);
    stageNote(ctx, 'four vector equations become two tensor ones, and the fact that they are the same in every frame becomes obvious', W, H);
  },
  readout(st){
    const cur = this.cur(st);
    const F = cur.F;
    const Fp = relBoostTensor(F, st.beta);
    const V = relTransformEB(cur.E, cur.B, v3(st.beta, 0, 0));
    const Et = relTensorE(Fp), Bt = relTensorB(Fp);
    const dE = vlen(vsub(Et, V.E)), dB = vlen(vsub(Bt, V.B));
    const row = M => '<tr>' + M.map(v => `<td>${fmtNum(v, 4)}</td>`).join('') + '</tr>';
    return rlTnCard(st) + `<div class="card tight"><div class="ttl">Two routes to the same field</div>
      ${kv("E′ from ΛFΛᵀ", '(' + fmtNum(Et.x, 5) + ', ' + fmtNum(Et.y, 5) + ', ' + fmtNum(Et.z, 5) + ')')}
      ${kv("E′ from the vector formula", '(' + fmtNum(V.E.x, 5) + ', ' + fmtNum(V.E.y, 5) + ', ' + fmtNum(V.E.z, 5) + ')')}
      ${kv("B′ from ΛFΛᵀ", '(' + fmtNum(Bt.x, 5) + ', ' + fmtNum(Bt.y, 5) + ', ' + fmtNum(Bt.z, 5) + ')')}
      ${kv("B′ from the vector formula", '(' + fmtNum(V.B.x, 5) + ', ' + fmtNum(V.B.y, 5) + ', ' + fmtNum(V.B.z, 5) + ')')}
      ${kv('difference', fmtGap(dE, Math.hypot(V.E.x, V.E.y, V.E.z)) + '  /  ' + fmtGap(dB, Math.hypot(V.B.x, V.B.y, V.B.z)))}
      <p class="help">Those are not two derivations that happen to agree — they are the same derivation.
      The six component rules of the previous stage are what <b>ΛFΛᵀ</b> looks like when you write it out
      by hand, which is why nobody writes it out by hand.</p>
    </div>
    <div class="card tight"><div class="ttl">F′^μν, in full</div>
      <div class="mat-wrap"><table class="mat">
        ${Fp.map(row).join('')}
      </table></div>
      ${kv('antisymmetric?', (function(){
        let a = 0;
        for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++) a = Math.max(a, Math.abs(Fp[i][j] + Fp[j][i]));
        return a < 1e-12 ? 'yes, to ' + fmtNear(a) : 'no — ' + fmtNum(a, 4);
      })())}
      ${kv('so it has', '6 independent components — 3 E and 3 B')}
      <p class="help">Antisymmetry is why there are six and not sixteen, and it is why E and B come in
      threes. A rank-2 antisymmetric tensor in four dimensions has exactly <b>4·3/2 = 6</b> components,
      which is the deepest available answer to "why are there two fields, and why do they have three
      components each?"</p>
    </div>
    <div class="card tight"><div class="ttl">What else lives in this notation</div>
      ${kv('four-position', 'x^μ = (ct, x, y, z)')}
      ${kv('four-velocity', 'u^μ = γ(c, v)  — with u·u = c² always')}
      ${kv('four-momentum', 'p<sup>μ</sup> = m u<sup>μ</sup> = (E/c, p)  — with p·p = (mc)²')}
      ${kv('four-current', 'J^ν = (cρ, J)  — and ∂_ν J^ν = 0 is charge conservation')}
      ${kv('four-potential', 'A^ν = (φ/c, A),  F^μν = ∂^μA^ν − ∂^νA^μ')}
      ${kv('the Lorentz force', 'dp^μ/dτ = qF<sup>μν</sup> u<sub>ν</sub>')}
      <p class="help">Every one of those is a four-component object that transforms with the same Λ. That
      is what "covariant" means, and it is why Maxwell's equations needed no repair when relativity
      arrived: they were <i>already</i> relativistic, and it was Newton's mechanics that had to change.
      Lorentz found the transformation as a curiosity of electrodynamics a decade before Einstein
      recognised it as a property of space and time.</p>
    </div>`;
  },
  chip(st){
    const F = this.cur(st).F, Fp = relBoostTensor(F, st.beta);
    return `<div class="k">F^μν</div>
      <div style="color:var(--c-grad)">F·F = ${fmtNear(relTensorInvariant1(Fp))}</div>
      <div style="color:var(--c-curl)">F·F̃ = ${fmtNear(relTensorInvariant2(Fp))}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'positive tensor entries (and the E block)'],
                    ['var(--c-neg)', 'negative entries (and the B block)'],
                    ['var(--c-grad)', 'F_μν F^μν — unchanged by the boost'],
                    ['var(--c-curl)', 'F_μν F̃^μν — likewise']]; }
};
