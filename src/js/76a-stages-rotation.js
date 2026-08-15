/* ============================================================================
   4o · THE ROTATION WING  and  THE OSCILLATIONS & WAVES WING
   AP Physics 1 units 6–7 (torque, rotational dynamics, oscillations),
   AP Physics 2 waves and sound, AP Physics C: Mechanics rotation.
   ============================================================================ */

/* ---- 1 · moment of inertia: mass, weighted by r² -------------------------- */
STAGES.rtInertia = {
  title:'Moment of inertia',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Why the same mass resists spinning by different amounts',
      steps:[
        drvSay('the question mass alone cannot answer',
          'Two objects of equal mass can be wildly different to spin up. Mass measures resistance to being accelerated in a straight line; it says nothing about rotation, because in rotation how far the mass sits from the axis matters as much as how much of it there is.'),
        drvStep('add up the kinetic energy of every particle',
          `${dv('KE')} ${dop('=')} Σ ${dfrac('1', '2')}${dv('m')}ᵢ${dv('v')}ᵢ²`,
          'ordinary kinetic energy, applied to each piece'),
        drvStep('and in rigid rotation every particle shares one ω',
          `${dv('v')}ᵢ ${dop('=')} ω${dv('r')}ᵢ`,
          'that shared angular velocity is what makes the body rigid'),
        drvStep('substitute and pull ω out of the sum',
          `${dv('KE')} ${dop('=')} ${dfrac('1', '2')}ω² Σ ${dv('m')}ᵢ${dv('r')}ᵢ²`,
          'the bracket depends only on the shape, not on how fast it is turning'),
        drvSay('so the moment of inertia defines itself',
          'Whatever is left after factoring out ½ω² plays the role that mass plays in ½mv². It was not invented and then justified — it is what the algebra produces, and it explains why it is a sum of mr² and not something else.'),
        drvStep('for a continuous body the sum becomes an integral',
          `${dv('I')} ${dop('=')} ∫ ${dv('r')}² d${dv('m')}`,
          `${st.key}: the panel integrates this numerically and compares with the closed form`),
        drvSay('the square is why shape beats mass',
          'Move a piece of mass twice as far out and it contributes four times as much. That is why a hoop has I = MR² while a disc of the same mass and radius has only ½MR² — the disc\'s material is on average much closer in.'),
        drvStep('the parallel axis theorem shifts the axis',
          `${dv('I')} ${dop('=')} ${dv('I')}_cm ${dop('+')} ${dv('M')}${dv('d')}²`,
          `at offset d = ${n(st.d)} m the panel integrates directly and checks this`),
        drvSay('and it shows the centre of mass is the easiest axis',
          'Md² is never negative, so no axis is easier to spin about than one through the centre of mass. That is not obvious in advance and falls straight out of the algebra when the cross term integrates to zero — which it does precisely because the centre of mass is where the first moment vanishes.'),
        drvStep('the same integral is the probability wing\'s variance',
          `${dv('I')} ${dop('=')} ∫ ${dv('r')}² d${dv('m')} , &nbsp; σ² ${dop('=')} ∫ ${dv('x')}² ${dv('f')} d${dv('x')}`,
          'second moment about the centre, in both cases — which is why variances add like inertias do')
      ],
      note:'Every moment of inertia here is computed by numerical integration over the actual body and printed beside the standard closed form. The parallel axis theorem is verified by integrating about the offset axis directly rather than by applying the formula.'
    };
  },
  enter(st, o){
    st.key = o.key || 'disc';
    st.M = 3; st.R = 0.7; st.d = 0;
    st.own = !!o.own;
    st.body = o.body || '* piece   x     y    mass  size\n  disc     0     0    2.0   1.0\n  rod      1.5   0    0.5   0.8\n  point   -1.0   0.6  0.3\n  ring     0     1.2  1.0   0.4';
    st.bodyErr = '';
  },
  /* the reader's own body, parsed and measured — cached against the text, since
     the readout asks four times a second and every call is a stack of quadratures */
  own(st){
    if(st._bk === st.body && st._bd !== undefined) return st._bd;
    const P = rtParseBody(st.body);
    st._bk = st.body;
    st._bd = P.ok ? { ok:true, pieces:P.pieces } : { ok:false, errs:P.errs };
    return st._bd;
  },
  ownProps(st){
    const B = this.own(st);
    if(!B.ok) return null;
    const ck = st._bk + '@' + st.d;
    if(st._pk === ck) return st._pd;
    st._pk = ck;
    st._pd = rtBodyProps(B.pieces, st.d, 0);
    return st._pd;
  },
  controls(){
    const st = ST, B = RT_BODIES[st.key];
    if(st.own){
      const P = STAGES.rtInertia.ownProps(st);
      return ctSeg('rtIK', 'custom',
                   Object.keys(RT_BODIES).map(k => [k, RT_BODIES[k].name.split(' about')[0]])
                     .concat([['custom', 'build your own']])) +
        `<div class="fld" style="align-items:stretch">
          <textarea id="rtBody" rows="7" spellcheck="false" autocomplete="off"
            aria-label="body sheet — one piece per line: kind, x, y, mass, size"
            data-audit="disc 0 0 3 1.2&#10;rod 2 0 1 1.5&#10;point -1.4 1.1 0.8&#10;ring 0.5 -1.2 1.5 0.6"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.body)}</textarea>
        </div>
        <div class="row wrap"><button class="btn sm pri" id="rtBodyGo">Build it</button></div>
        ${ctlRow('shift the axis', ctlSlider('rtId', -2.5, 2.5, 0.01, st.d))}
        <p class="help" id="rtBodyMsg" style="color:${st.bodyErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.bodyErr ||
          'One piece per line: <b>kind&nbsp; x&nbsp; y&nbsp; mass&nbsp; size</b>. The kinds are <b>point</b> ' +
          '(no size), <b>rod</b> (its length, lying along x), <b>disc</b> and <b>ring</b> (a radius), and ' +
          '<b>plate</b> (a square\'s side). Everything is in metres and kilograms.'}</p>
        <p class="help">There is no closed form for whatever you build, so the panel does not quote one. It
        computes I <b>twice, by routes with nothing in common</b>: once by integrating r² dm over each piece
        with the axis wherever you have put it — the definition, and no theorem — and once by adding up the
        pieces\' own closed forms and shifting them with the <b>parallel-axis theorem</b>, twice. Nothing
        makes those agree. Their difference is the theorem being tested on a body nobody chose, and it is
        printed below.</p>` +
        (P ? '' : '');
    }
    return ctSeg('rtIK', st.key,
                 Object.keys(RT_BODIES).map(k => [k, RT_BODIES[k].name.split(' about')[0]])
                   .concat([['custom', 'build your own']])) +
      ctlRow('mass M', ctlSlider('rtIM', 0.5, 8, 0.1, st.M)) +
      ctlRow(B.param, ctlSlider('rtIR', 0.2, 1.6, 0.02, st.R)) +
      ctlRow('shift the axis', ctlSlider('rtId', 0, 1.4, 0.01, st.d)) +
      `<p class="help"><b>${B.name}</b> — ${B.note}</p>
      <p class="help">Moment of inertia is <b>I = ∫r²dm</b>: mass weighted by the <i>square</i> of its
      distance from the axis. That squaring is everything. Mass near the axis is nearly free; mass at the
      rim costs the most it possibly can, which is why a hoop has the largest I of any shape and a solid
      sphere among the smallest.</p>
      <p class="help">The panel integrates r²dm over the body and prints the answer beside the textbook
      formula, so the table entry is a <i>result</i> here rather than a thing to memorise. The
      <b>parallel-axis theorem</b> is checked the same way: shift the axis and compare I_cm + Md² against
      the re-integrated value.</p>`;
  },
  wire(){
    ctWireSeg('rtIK', v => { ST.own = (v === 'custom'); if(v !== 'custom') ST.key = v; ST.d = 0; });
    if(!ST.own){
      wireSlider('rtIM', () => ST.M, v => { ST.M = v; }, v => fmtNum(+v, 3) + ' kg');
      wireSlider('rtIR', () => ST.R, v => { ST.R = v; }, v => fmtNum(+v, 3) + ' m');
    } else {
      const apply = () => {
        const box = $('rtBody'); if(!box) return;
        ST.body = box.value;
        const P = rtParseBody(ST.body);
        ST.bodyErr = P.ok ? '' :
          '⚠ ' + P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
          '<br><span style="color:var(--faint)">The previous body is still shown.</span>';
        const msg = $('rtBodyMsg');
        if(msg){
          msg.innerHTML = ST.bodyErr || ('Built: ' + P.pieces.length + ' piece' +
            (P.pieces.length === 1 ? '' : 's') + ', total mass ' +
            fmtNum(P.pieces.reduce((a, q) => a + q.m, 0), 4) + ' kg.');
          msg.style.color = ST.bodyErr ? 'var(--c-neg)' : 'var(--faint)';
        }
        refreshStageReadout(); updateStageChip();
      };
      const b = $('rtBody'); if(b) b.addEventListener('change', apply);
      const g = $('rtBodyGo'); if(g) g.addEventListener('click', apply);
    }
    wireSlider('rtId', () => ST.d, v => { ST.d = v; }, v => fmtNum(+v, 3) + ' m');
  },
  frame(st, dt, ctx, W, H){
    if(st.own) return STAGES.rtInertia.frameOwn(st, dt, ctx, W, H);
    const B = RT_BODIES[st.key];
    const P = ctBox(W, H, 0, 0, 2);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, B.name + '   —   colour is r², the weight each element carries');
    const R = st.R;
    /* Draw the body as cells shaded by r² about the (possibly shifted) axis —
       built as pixels and blitted once. Cell by cell this was up to 8 100
       fillRect calls and as many colour strings PER FRAME (auditperf measured
       6 399, the heaviest stage in the laboratory) for a picture that only
       changes when the body, its size or the axis does.

       The blit also fixes what the old cell size got wrong: it used P.pw/N,
       the box's width over N, while the grid spans 2R and not the box's four
       units. Every cell was therefore drawn oversized and the cells overlapped,
       which at alpha 0.9 fattened the body — most visibly on the rod, which is
       only a few cells thick. The bitmap tiles them exactly. */
    const ax = st.d;
    /* J16: the cell count follows the BLIT TARGET, not a constant — at a fixed
       N = 90 the disc's edge was visibly stair-stepped on any large canvas,
       because the bitmap scaled up while its resolution did not. One cell per
       ~2 screen pixels, bounded (the canvas bounds the box, so this cannot
       become the unbounded loop §2.5 warns about). */
    const N = Math.max(90, Math.min(240, Math.round((P.X(R) - P.X(-R)) / 2)));
    /* HB, not B — B is already the body in this scope, and a second `const B`
       here is a syntax error that takes the whole single-scope bundle down */
    const HB = ctHeatBuf(N), hd = HB.img.data;
    for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
      const x = -R + 2 * R * (i + 0.5) / N, y = -R + 2 * R * (j + 0.5) / N;
      /* row 0 of an ImageData is the TOP row, while j counts upward from −R */
      const o = 4 * ((N - 1 - j) * N + i);
      let inside = false;
      if(st.key === 'hoop') inside = Math.abs(Math.hypot(x, y) - R) < R / 22;
      else if(st.key === 'shell') inside = Math.abs(Math.hypot(x, y) - R) < R / 16;
      else if(st.key === 'disc' || st.key === 'sphere') inside = Math.hypot(x, y) <= R;
      else if(st.key === 'plate') inside = Math.abs(x) <= R / 2 && Math.abs(y) <= R / 2;
      else inside = Math.abs(y) < R / 26 && (st.key === 'rodEnd' ? (x >= 0 && x <= R) : Math.abs(x) <= R / 2);
      /* the buffer is shared, so empty space must be cleared, not skipped */
      if(!inside){ hd[o + 3] = 0; continue; }
      const r2 = (x - ax) * (x - ax) + y * y;
      const t = Math.min(1, r2 / (R * R * (1 + st.d / R) * 1.1));
      const c = rampSeq(t);
      hd[o] = c[0]; hd[o + 1] = c[1]; hd[o + 2] = c[2]; hd[o + 3] = 255;
    }
    HB.ctx.putImageData(HB.img, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(HB.cv, 0, 0, N, N, P.X(-R), P.Y(R), P.X(R) - P.X(-R), P.Y(-R) - P.Y(R));
    ctx.restore();
    /* the axis */
    ctPath(ctx, P, [{ x:ax, y:-1.9 }, { x:ax, y:1.9 }], rgbCss(TH.curl), 2.4, [6, 4]);
    ctDot(ctx, P, ax, 0, 6, rgbCss(TH.curl), rgbCss(TH.bg));
    if(st.d > 1e-6){
      ctPath(ctx, P, [{ x:0, y:-1.5 }, { x:0, y:1.5 }], rgbCss(TH.faint), 1.6, [3, 3]);
      ctArrow(ctx, P, 0, -1.2, ax, -1.2, rgbCss(TH.warn), 2, 'd');
    }
    stageNote(ctx, 'warm cells are far from the axis and carry most of the inertia — the weighting is r², not r', W, H);
  },
  /* the assembled body, drawn piece by piece */
  frameOwn(st, dt, ctx, W, H){
    const B = STAGES.rtInertia.own(st);
    if(!B.ok){
      const P0 = ctBox(W, H, 0, 0, 2);
      ctFrame(ctx, P0, 'the body sheet does not parse');
      ctText(ctx, W / 2, H / 2, B.errs[0] ? ('line ' + (B.errs[0].line || '?') + ': ' + B.errs[0].msg) : 'no pieces',
             rgbCss(TH.neg), '600 13px ' + FONT_UI, 'center');
      return;
    }
    const R = STAGES.rtInertia.ownProps(st);
    /* a span that holds every piece and the axis */
    let span = 0.6;
    for(const p of B.pieces) span = Math.max(span, Math.abs(p.x) + p.s, Math.abs(p.y) + p.s);
    span = Math.max(span, Math.abs(st.d)) * 1.25;
    const P = ctBox(W, H, 0, 0, span);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, 'your body — colour is r² about the axis, the weight each piece carries');
    /* every piece shaded by its own distance², so the r² weighting is visible */
    const worst = Math.max(1e-9, ...B.pieces.map(p => (p.x - st.d) ** 2 + p.y * p.y + p.s * p.s));
    for(const p of B.pieces){
      const t = Math.min(1, ((p.x - st.d) ** 2 + p.y * p.y) / worst);
      const col = rgbCss(rampSeq(t), 0.85);
      if(p.kind === 'point'){ ctDot(ctx, P, p.x, p.y, 5 + 3 * Math.min(2, p.m), col, rgbCss(TH.bg)); }
      else if(p.kind === 'rod') ctPath(ctx, P, [{ x:p.x - p.s / 2, y:p.y }, { x:p.x + p.s / 2, y:p.y }], col, 4);
      else if(p.kind === 'ring'){
        const pts = [];
        for(let i = 0; i <= 64; i++){ const a = 2 * Math.PI * i / 64; pts.push({ x:p.x + p.s * Math.cos(a), y:p.y + p.s * Math.sin(a) }); }
        ctPath(ctx, P, pts, col, 3);
      } else if(p.kind === 'disc'){
        const pts = [];
        for(let i = 0; i <= 64; i++){ const a = 2 * Math.PI * i / 64; pts.push({ x:p.x + p.s * Math.cos(a), y:p.y + p.s * Math.sin(a) }); }
        ctFill(ctx, P, pts, col); ctPath(ctx, P, pts, col, 1.4);
      } else {
        const h = p.s / 2;
        const pts = [{ x:p.x - h, y:p.y - h }, { x:p.x + h, y:p.y - h }, { x:p.x + h, y:p.y + h }, { x:p.x - h, y:p.y + h }];
        ctFill(ctx, P, pts, col); ctPath(ctx, P, pts.concat([pts[0]]), col, 1.4);
      }
    }
    /* the axis, and the centre of mass it is measured from */
    ctPath(ctx, P, [{ x:st.d, y:-span }, { x:st.d, y:span }], rgbCss(TH.curl), 2.4, [6, 4]);
    ctDot(ctx, P, R.cx, R.cy, 6, rgbCss(TH.pos), rgbCss(TH.bg));
    ctText(ctx, P.X(R.cx) + 9, P.Y(R.cy) - 9, 'centre of mass', rgbCss(TH.pos), '600 10.5px ' + FONT_MONO);
    if(Math.abs(R.d) > 1e-9)
      ctArrow(ctx, P, R.cx, R.cy, st.d, R.cy, rgbCss(TH.warn), 2, 'd');
    stageNote(ctx, 'move the axis and watch I fall to its minimum exactly at the centre of mass — that is the parallel-axis theorem, and the panel checks it by integrating', W, H);
  },
  readout(st){
    if(st.own) return STAGES.rtInertia.readoutOwn(st);
    const B = RT_BODIES[st.key];
    const Icm = B.I(st.M, st.R);
    const Iint = B.integrate(st.M, st.R);
    const Ishift = rtParallelAxis(Icm, st.M, st.d);
    const k = Math.sqrt(Icm / st.M);
    return `<div class="card tight"><div class="ttl">${B.name}</div>
      ${kv('M', fmtNum(st.M, 4) + ' kg')}${kv(B.param, fmtNum(st.R, 4) + ' m')}
      ${kv('I from the formula', fmtNum(Icm, 8) + ' kg·m²')}
      ${kv('I = ∫r²dm, integrated', fmtNum(Iint, 8) + ' kg·m²')}
      ${kv('difference', fmtAgree(Icm, Iint))}
      ${kv('radius of gyration √(I/M)', fmtNum(k, 6) + ' m')}
      ${kv('as a fraction of the size', fmtNum(k / st.R, 5))}
    </div>
    <div class="card tight"><div class="ttl">The parallel-axis theorem</div>
      ${kv('axis shifted by d', fmtNum(st.d, 4) + ' m')}
      ${kv('I_cm', fmtNum(Icm, 7))}
      ${kv('M d²', fmtNum(st.M * st.d * st.d, 7))}
      ${kv('I_cm + Md²', fmtNum(Ishift, 7))}
      ${kv('ratio to I_cm', fmtNum(Ishift / Icm, 5))}
      <p class="help">Moving the axis <i>always</i> increases I, and the increase is Md² regardless of the
      shape. So the smallest possible moment of inertia is always about an axis through the centre of mass
      — which is why a thrown object spins about its centre of mass and nothing else.</p>
    </div>
    <div class="card tight"><div class="ttl">Every shape, side by side</div>
      ${Object.keys(RT_BODIES).map(k2 => {
        const b = RT_BODIES[k2];
        return kv(b.name.split(' about')[0], fmtNum(b.I(st.M, st.R) / (st.M * st.R * st.R), 5) + ' × MR²');
      }).join('')}
      <p class="help">Expressed as multiples of MR², the whole table is one dimensionless number per shape
      — and that number is all that distinguishes them dynamically. It is the <b>c</b> that decides who
      wins the race down a ramp in the next stage.</p>
    </div>`;
  },
  /* No closed form exists for an assembled body, so nothing is quoted. What is
     printed is the same quantity computed two ways — the definition integrated,
     and the parallel-axis theorem applied — with the gap between them. */
  readoutOwn(st){
    const B = STAGES.rtInertia.own(st);
    if(!B.ok) return `<div class="card tight"><div class="ttl">The body sheet does not parse</div>
      ${B.errs.slice(0, 5).map(e => kv(e.line ? 'line ' + e.line : 'the whole sheet', esc(e.msg))).join('')}
      <p class="help">Each line is <b>kind&nbsp; x&nbsp; y&nbsp; mass</b>, and a size as well for anything
      that is not a point. Nothing is computed until every line reads, because a body with a missing piece
      is not a body with a missing piece — it is a different body.</p></div>`;
    const R = STAGES.rtInertia.ownProps(st);
    const rel = R.direct > 0 ? R.gap / R.direct : 0;
    return `<div class="card tight"><div class="ttl">The body you built</div>
      ${kv('pieces', String(B.pieces.length))}
      ${kv('total mass M', fmtNum(R.M, 6) + ' kg')}
      ${kv('centre of mass', '(' + fmtNum(R.cx, 5) + ', ' + fmtNum(R.cy, 5) + ')')}
      ${kv('axis at x =', fmtNum(st.d, 4) + ' m')}
      ${kv('distance d from the CoM', fmtNum(R.d, 5) + ' m')}
    </div>
    <div class="card tight"><div class="ttl">I about that axis, computed twice</div>
      ${kv('∫r²dm, integrated directly', '<b>' + fmtNum(R.direct, 8) + '</b> kg·m²')}
      ${kv('I_cm + Md², by the theorem', fmtNum(R.theorem, 8) + ' kg·m²')}
      ${kv('difference', fmtAgree(R.direct, R.theorem, 'kg·m²'))}
      ${kv('I_cm, integrated', fmtNum(R.directCm, 8))}
      ${kv('I_cm, from the pieces', fmtNum(R.Icm, 8))}
      ${kv('radius of gyration √(I/M)', fmtNum(R.k, 6) + ' m')}
      <p class="help">The two routes have nothing in common. The first integrates <b>r² dm</b> over each
      piece with the axis wherever you put it — the definition of I, and no theorem anywhere in it. The
      second adds up the pieces' own closed forms, shifts each to the centre of mass by the
      <b>parallel-axis theorem</b>, and shifts the total out to the axis by it again. Nothing forces them
      to agree, so the ${rel < 1e-6 ? 'agreement to ' + fmtNum(rel, 2) + ' relative is the theorem verified on a body nobody chose' : 'gap of ' + fmtNum(rel, 3) + ' relative is worth reading — with pieces this small next to the axis the quadrature is working hard'}.</p>
    </div>
    <div class="card tight"><div class="ttl">Where the minimum is</div>
      ${kv('I about the centre of mass', fmtNum(R.directCm, 7))}
      ${kv('I about this axis', fmtNum(R.direct, 7))}
      ${kv('the cost of moving off it, Md²', fmtNum(R.M * R.d * R.d, 7))}
      <p class="help">Md² is never negative, so <b>no axis anywhere gives a smaller I than one through the
      centre of mass</b> — whatever shape you build. Drag the axis and watch the first number stay put
      while the second dips to meet it and rises again. That is why a thrown hammer tumbles about its
      centre of mass and about nothing else, and why the point is worth finding before the moment is.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const B = STAGES.rtInertia.own(st);
      if(!B.ok) return `<div class="k">your body</div><div style="color:var(--c-neg)">the sheet does not parse</div>`;
      const R = STAGES.rtInertia.ownProps(st);
      return `<div class="k">your body · ${B.pieces.length} pieces</div>
        <div style="color:var(--c-grad)">I = ${fmtNum(R.direct, 6)} kg·m²</div>
        <div>theorem differs by ${fmtAgreeTight(R.direct, R.theorem)}</div>`;
    }
    const B = RT_BODIES[st.key];
    return `<div class="k">I</div><div style="color:var(--c-grad)">${fmtNum(B.I(st.M, st.R), 6)} kg·m²</div>
      <div>${fmtNum(B.I(st.M, st.R) / (st.M * st.R * st.R), 4)} MR²</div>`;
  },
  legend(){ return [['var(--c-grad)', 'r² — the weight each mass element carries'],
                    ['var(--c-curl)', 'the axis'], ['var(--c-warn)', 'the shift d']]; },
  dockLegend:true
};

/* ---- 2 · rolling, and the race down the ramp ------------------------------ */
STAGES.rtRoll = {
  title:'Rolling without slipping',
  derive(st){
    const n = v => fmtNum(v, 6);
    const g = 9.80665;
    return {
      title:'Why the race is won by shape alone',
      steps:[
        drvStep('the rolling constraint',
          `${dv('v')} ${dop('=')} ω${dv('R')}`,
          'the contact point is instantaneously at rest, which is what "without slipping" means'),
        drvSay('and that is why friction does no work here',
          'Work is force times the displacement of its point of application. The contact point is momentarily stationary, so static friction acts through zero distance and dissipates nothing. That is why energy conservation may be used even though a friction force is present.'),
        drvStep('so the energy released is shared between two motions',
          `${dv('M')}${dv('g')}${dv('h')} ${dop('=')} ${dfrac('1', '2')}${dv('M')}${dv('v')}² ${dop('+')} ${dfrac('1', '2')}${dv('I')}ω²`,
          'translation of the centre of mass, plus rotation about it'),
        drvStep('write I as a shape factor times MR²',
          `${dv('I')} ${dop('=')} ${dv('c')}${dv('M')}${dv('R')}²`,
          'c = ½ for a disc, 1 for a hoop, ⅖ for a solid sphere — a pure number'),
        drvStep('substitute the constraint and the mass cancels',
          `${dv('M')}${dv('g')}${dv('h')} ${dop('=')} ${dfrac('1', '2')}${dv('M')}${dv('v')}²(1 ${dop('+')} ${dv('c')})`,
          'both R and M disappear, leaving only c'),
        drvSay('so a marble beats a tin can beats a hoop, whatever their size',
          'A larger c means a larger share of the energy goes into spinning rather than moving, so less is left for speed. Nothing about mass or radius survives the cancellation. A tiny steel ball and a huge stone sphere reach the bottom together.'),
        drvStep('the acceleration follows',
          `${dv('a')} ${dop('=')} ${dfrac(dv('g') + ' sin θ', '1 + ' + dv('c'))}`,
          `at ${n(st.ang * 180 / Math.PI)}°: a sliding block would get ${n(g * Math.sin(st.ang))} m/s², and each roller less`),
        drvSay('and a frictionless block beats everything',
          'It stores no rotational energy at all, so c = 0 and it gets the full g sin θ. Rolling is always slower than sliding, which is the opposite of most people\'s intuition about friction helping or hindering.'),
        drvStep('but the constraint requires a friction force to exist',
          `${dv('f')} ${dop('=')} ${dfrac(dv('c'), '1 + ' + dv('c'))}${dv('M')}${dv('g')} sin θ`,
          'the panel prints the friction demanded and the minimum μ that can supply it'),
        drvSay('and beyond that slope the analysis collapses',
          'If the surface cannot provide that much static friction the object slips, v = ωR fails, friction becomes kinetic and does dissipate energy, and every result above is void. The panel reports the critical μ so you can see when the model stops applying.'),
        st.own
          ? drvSay('and on a body you assembled, none of that may be assumed',
              'Every line above ends in a formula a preset is allowed to quote. A body built from pieces has no entry in any table, so the panel does the elimination instead: Newton\'s law along the slope and τ = Iα about the centre are two equations in the two unknowns a and f, solved as a linear system that contains no shape factor anywhere. Then v and ω are stepped as separate variables from that solved friction, so v = ωR is never imposed on the motion — the residual slip printed below is the constraint being checked rather than enforced, and the flat energy ledger beside it is the statement that static friction does no work, measured.')
          : drvSay('the shape factor is the only thing that has to be looked up',
              'And it need not be: switch this stage to a body of your own and c is computed from the assembly instead, which turns the race from a demonstration into a prediction you can get wrong.')
      ],
      note:'The race is integrated from the equations of motion rather than staged, and the finishing order is whatever the physics produces. The friction required and the minimum coefficient are computed at the chosen slope, so the point at which the constraint would break is a number rather than a caveat.'
    };
  },
  enter(st, o){
    st.ang = (o.ang === undefined ? 20 : o.ang) * Math.PI / 180;
    st.t = 0; st.run = o.run !== false;
    st.own = !!o.own;
    st.R = o.R === undefined ? 0.55 : o.R;
    st.body = o.body || '* piece   x    y   mass  size\n  disc     0    0   2.0   0.55\n  ring     0    0   0.8   0.55';
    st.bodyErr = '';
  },
  /* the reader's assembly, parsed and measured once per edit — the readout asks
     four times a second and every call is a stack of quadratures */
  body(st){
    if(st._bk === st.body && st._bd) return st._bd;
    st._bk = st.body;
    const P = rtParseBody(st.body);
    if(!P.ok){ st._bd = { ok:false, errs:P.errs }; return st._bd; }
    const B = rtBodyProps(P.pieces, 0, 0);
    st._bd = { ok:true, n:P.pieces.length, M:B.M, I:B.directCm, Icm:B.Icm,
               gapCm:B.gapCm, off:Math.hypot(B.cx, B.cy) };
    return st._bd;
  },
  /* the field: the five standard shapes as unit-mass, unit-radius stand-ins —
     legitimate, because M and R cancel out of everything the race decides */
  entries(st){
    const base = RT_RACE.map(b => ({ name:b.name, short:b.short || b.name, M:1, R:1, I:b.c }));
    if(!st.own) return base;
    const B = STAGES.rtRoll.body(st);
    if(!B.ok || !(st.R > 0)) return base;
    return base.concat([{ name:'the body you built', short:'yours', M:B.M, R:st.R, I:B.I, own:true }]);
  },
  race(st){
    const key = (st.own ? st.body + '@' + st.R : 'std') + '@' + st.ang;
    if(st._rk === key) return st._rd;
    st._rk = key;
    st._rd = rtRaceRun(STAGES.rtRoll.entries(st), st.ang, RT_RAMP_L, 600);
    return st._rd;
  },
  controls(){
    const st = ST;
    const head = ctSeg('rtRmode', st.own ? 'custom' : 'std',
                       [['std', 'the five standard shapes'], ['custom', 'race a body of your own']]) +
      ctlRow('slope', ctlSlider('rtRa', 3, 40, 0.5, st.ang * 180 / Math.PI)) +
      ctChk('rtRrun', 'race them', st.run);
    if(st.own){
      const B = STAGES.rtRoll.body(st);
      return head +
        `<div class="fld" style="align-items:stretch">
          <textarea id="rtRbody" rows="5" spellcheck="false" autocomplete="off"
            aria-label="body sheet — one piece per line: kind, x, y, mass, size"
            data-audit="disc 0 0 3 0.5&#10;ring 0 0 2 0.5&#10;point 0 0 1"
            style="flex:1;font:12px/1.5 var(--f-mono);resize:vertical">${esc(st.body)}</textarea>
        </div>
        <div class="row wrap"><button class="btn sm pri" id="rtRbodyGo">Roll it</button></div>` +
        ctlRow('rolling radius R', ctlSlider('rtRr', 0.1, 1.2, 0.01, st.R)) +
        `<p class="help" id="rtRbodyMsg" style="color:${st.bodyErr ? 'var(--c-neg)' : 'var(--faint)'}">${st.bodyErr ||
          (B.ok ? 'Built: ' + B.n + ' piece' + (B.n === 1 ? '' : 's') + ', mass ' + fmtNum(B.M, 4) +
                  ' kg, I = ' + fmtNum(B.I, 4) + ' kg·m² about the centre of mass.'
                : 'One piece per line: <b>kind&nbsp; x&nbsp; y&nbsp; mass&nbsp; size</b> — <b>point</b>, ' +
                  '<b>rod</b>, <b>disc</b>, <b>ring</b> or <b>plate</b>, in metres and kilograms.')}</p>
        <p class="help">The rolling radius is the radius of the surface that touches the ramp; the moment
        of inertia is taken about the axle through the centre of mass. Those are two different lengths and
        the shape factor <b>c = I/MR²</b> depends on both — a heavy rim on a small hub rolls quite
        differently from the same mass spread over a wide disc.</p>
        <p class="help">Nothing here quotes <b>a = g sin θ/(1+c)</b>. The panel eliminates the friction
        between Newton's law along the slope and <b>τ = Iα</b> about the centre — two equations, two
        unknowns, solved as a linear system that contains no shape factor. Then <b>v and ω are stepped as
        separate variables</b> from that solved friction, so <b>v = ωR is never imposed</b>: the slip
        printed below is the constraint being tested. Predict where your body finishes before you look.</p>`;
    }
    return head +
      `<p class="help">Rolling without slipping is the constraint <b>v = ωR</b>: the contact point is
      instantaneously at rest, which is why static friction acts and why it does <b>no work</b>. The energy
      that would all have gone into translation is now shared with rotation, in the ratio fixed by the
      shape factor <b>c = I/MR²</b> and by nothing else.</p>
      <p class="help"><b>a = g sin θ / (1 + c)</b>. Mass cancels. Radius cancels. Only the shape survives —
      so a marble beats a tin can beats a hoop, every time, regardless of size or weight, and a
      frictionless sliding block beats them all because it stores no rotational energy at all.</p>
      <p class="help">The panel also reports the friction the constraint <i>demands</i> and the minimum μ
      that can supply it. Below that the object slips, the constraint breaks, and the whole analysis has to
      be redone.</p>`;
  },
  wire(){
    ctWireSeg('rtRmode', v => { ST.own = (v === 'custom'); ST.t = 0; });
    wireSlider('rtRa', () => ST.ang * 180 / Math.PI, v => { ST.ang = v * Math.PI / 180; }, v => fmtNum(+v, 3) + '°');
    ctWireChk('rtRrun', v => { ST.run = v; });
    if(!ST.own) return;
    wireSlider('rtRr', () => ST.R, v => { ST.R = v; ST.t = 0; }, v => fmtNum(+v, 3) + ' m');
    const apply = () => {
      const box = $('rtRbody'); if(!box) return;
      ST.body = box.value; ST.t = 0;
      const P = rtParseBody(ST.body);
      ST.bodyErr = P.ok ? '' :
        '⚠ ' + P.errs.slice(0, 4).map(e => (e.line ? 'line ' + e.line + ': ' : '') + e.msg).join('<br>⚠ ') +
        '<br><span style="color:var(--faint)">The previous body is still racing.</span>';
      const msg = $('rtRbodyMsg');
      if(msg){
        const B = STAGES.rtRoll.body(ST);
        msg.innerHTML = ST.bodyErr || ('Built: ' + B.n + ' piece' + (B.n === 1 ? '' : 's') +
          ', mass ' + fmtNum(B.M, 4) + ' kg, I = ' + fmtNum(B.I, 4) + ' kg·m² about the centre of mass.');
        msg.style.color = ST.bodyErr ? 'var(--c-neg)' : 'var(--faint)';
      }
      refreshStageReadout(); updateStageChip();
    };
    const b = $('rtRbody'); if(b) b.addEventListener('change', apply);
    const g = $('rtRbodyGo'); if(g) g.addEventListener('click', apply);
  },
  frame(st, dt, ctx, W, H){
    if(st.run) st.t += dt * 0.7; else st.t = Math.min(st.t, 6);
    const L = RT_RAMP_L;
    const RC = STAGES.rtRoll.race(st);
    const rows = RC.rows;
    const P = ctBox(W, H, 2.4, 0.9, 3.2);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, `the race at ${fmtNum(st.ang * 180 / Math.PI, 3)}°  —  shape decides, mass and radius do not`);
    const th = st.ang;
    const top = { x:0, y:L * Math.sin(th) };
    ctPath(ctx, P, [top, { x:L * Math.cos(th), y:0 }], rgbCss(TH.faint), 3);
    ctPath(ctx, P, [{ x:L * Math.cos(th), y:0 }, { x:0, y:0 }, top], rgbCss(TH.line2), 1.6);
    rows.forEach((R, i) => {
      const s = Math.min(L - 0.5, 0.5 * R.a * st.t * st.t);
      const cx = s * Math.cos(th), cy = L * Math.sin(th) - s * Math.sin(th);
      const r = 0.2;
      const nx = -Math.sin(th) * r, ny = Math.cos(th) * r;
      const col = R.own ? rgbCss(TH.pos) : rgbCss(rampSeq(i / Math.max(1, RT_RACE.length - 1)), 0.95);
      ctx.strokeStyle = col; ctx.lineWidth = R.own ? 3.6 : 2.6;
      ctx.beginPath(); ctx.arc(P.X(cx + nx), P.Y(cy + ny), r * P.u, 0, 6.2832); ctx.stroke();
      /* a spoke, so the rolling is visible */
      const phi = R.c > 0 ? -s / r : 0;
      ctPath(ctx, P, [{ x:cx + nx, y:cy + ny },
        { x:cx + nx + r * Math.cos(phi + th), y:cy + ny + r * Math.sin(phi + th) }], col, 2);
      /* the entrants start together, so the labels would pile into one
         illegible smear for the first second of every race — stagger them */
      ctText(ctx, P.X(cx + nx), P.Y(cy + ny) - r * P.u - 8 - i * 12,
             (st.own ? R.short + ' c=' + fmtNum(R.c, 3) : R.short), col, '600 10px ' + FONT_UI, 'center');
    });
    stageNote(ctx, st.own
      ? 'your body carries the c it was measured to have — nothing here looked it up'
      : 'the spokes show the rotation — the hoop turns fastest per metre and arrives last', W, H);
  },
  readout(st){
    if(st.own) return STAGES.rtRoll.readoutOwn(st);
    const rows = RT_RACE.map(R => {
      const a = DY_G * Math.sin(st.ang) / (1 + R.c);
      const t = Math.sqrt(2 * RT_RAMP_L / a);
      return kv(R.name, `c = ${fmtNum(R.c, 4)},  a = ${fmtNum(a, 5)} m/s²,  ` +
                        `${fmtNum(RT_RAMP_L, 3)} m in ${fmtNum(t, 5)} s`);
    });
    const sph = rtRolling(2, 0.3, 2 * 2 * 0.09 / 5, st.ang);
    return `<div class="card tight"><div class="ttl">The race, ordered</div>
      ${rows.join('')}
      <p class="help">Every acceleration here is <b>g sin θ/(1+c)</b>. Doubling the mass changes nothing;
      doubling the radius changes nothing. Only c — the fraction of the mass that sits far from the axis —
      matters, and that is why this experiment is a shape-measuring device.</p>
    </div>
    <div class="card tight"><div class="ttl">A solid sphere in detail</div>
      ${kv('shape factor c = I/MR²', fmtNum(sph.c, 5))}
      ${kv('acceleration', fmtNum(sph.a, 6) + ' m/s²')}
      ${kv('if it slid frictionlessly', fmtNum(sph.aSlide, 6) + ' m/s²')}
      ${kv('fraction of energy in rotation', fmtNum(100 * sph.fracRot, 4) + '%')}
      ${kv('fraction in translation', fmtNum(100 * sph.fracTrans, 4) + '%')}
      ${kv('static friction required', fmtNum(sph.f, 6) + ' N')}
      ${kv('minimum μ to supply it', fmtNum(sph.muMin, 5))}
      <p class="help">Two sevenths of the energy ends up as rotation for a sphere, half for a disc, and a
      full half again for a hoop — which is exactly the ordering of the race. If μ falls below the minimum
      the object slips: the constraint v = ωR fails, kinetic friction takes over, and it starts sliding as
      well as spinning.</p>
    </div>
    <div class="card tight"><div class="ttl">Why friction does no work here</div>
      ${kv('speed of the contact point', '0 — it is instantaneously at rest')}
      ${kv('so the work done by friction is', '0')}
      <p class="help">Static friction supplies the torque that spins the object up, and yet removes no
      energy at all, because the point it acts on never moves. That is what makes rolling efficient and
      sliding wasteful, and it is why mechanical energy is conserved for a rolling object despite friction
      being essential to the motion.</p>
    </div>`;
  },
  readoutOwn(st){
    const B = STAGES.rtRoll.body(st);
    if(!B.ok) return `<div class="card tight"><div class="ttl">The sheet has a problem</div>
      ${B.errs.slice(0, 5).map(e => kv(e.line ? 'line ' + e.line : 'the sheet', e.msg)).join('')}
      <p class="help">The previous body is still in the race. One piece per line:
      <b>kind&nbsp; x&nbsp; y&nbsp; mass&nbsp; size</b>.</p></div>`;
    const RC = STAGES.rtRoll.race(st);
    const me = RC.rows.filter(r => r.own)[0];
    if(!me || !me.ok) return `<div class="card tight"><div class="ttl">That body will not roll</div>
      <p class="help">With this slope and rolling radius the solved acceleration is not positive, so there
      is no run to time. Raise the slope, or give the body a rolling radius it can turn on.</p></div>`;
    const place = RC.bySim.indexOf(me.name) + 1;
    const gy = Math.max(1e-30, RT_RAMP_L * Math.sin(st.ang) * me.M * DY_G);
    return `<div class="card tight"><div class="ttl">The body you built</div>
      ${kv('pieces', String(B.n))}
      ${kv('total mass M', fmtNum(B.M, 5) + ' kg')}
      ${kv('I about the centre of mass, by quadrature', fmtNum(B.I, 6) + ' kg·m²')}
      ${kv('the same by the parallel-axis theorem', fmtNum(B.Icm, 6) + ' kg·m²')}
      ${kv('difference', fmtAgree(B.I, B.Icm, 'kg·m²'))}
      ${kv('rolling radius R', fmtNum(st.R, 4) + ' m')}
      ${kv('shape factor c = I/MR², measured', fmtNum(me.c, 6))}
      ${kv('centre of mass, off the axle by', fmtNum(B.off, 4) + ' m')}
      <p class="help">There is no table entry for this body, so c is <i>computed</i> from the assembly —
      twice, by the two routes the moment-of-inertia stage uses, and their difference is the row above.
      The run puts the axle through the centre of mass; an assembly whose mass sits off to one side would
      wobble as it rolled, and the offset row says how far from that idealisation you are.</p>
    </div>
    <div class="card tight"><div class="ttl">Two routes to the acceleration</div>
      ${kv('a, from eliminating f between the two laws', fmtNum(me.a, 7) + ' m/s²')}
      ${kv('a, from g sin θ/(1+c)', fmtNum(me.aClosed, 7) + ' m/s²')}
      ${kv('difference', fmtAgree(me.a, me.aClosed, 'm/s²'))}
      ${kv('static friction the constraint demands', fmtNum(me.f, 6) + ' N')}
      ${kv('minimum μ that can supply it', fmtNum(me.muMin, 5))}
      <p class="help">The first row comes from solving <b>Ma + f = Mg sin θ</b> and <b>(I/R)a − Rf = 0</b>
      together as a linear system. It has never met the second row's formula. Their agreement is the
      derivation, done twice on a body nobody chose. Below the minimum μ the surface cannot hold the
      constraint, the body slips, and every number on this panel is void.</p>
    </div>
    <div class="card tight"><div class="ttl">The run, integrated over ${fmtNum(RT_RAMP_L, 3)} m</div>
      ${kv('finishing time, from the integrated track', fmtNum(me.t, 7) + ' s')}
      ${kv('from √(2L/a)', fmtNum(me.tClosed, 7) + ' s')}
      ${kv('difference', fmtAgree(me.t, me.tClosed, 's'))}
      ${kv('arrival speed, integrated', fmtNum(me.v, 7) + ' m/s')}
      ${kv('from √(2gL sin θ/(1+c))', fmtNum(me.vClosed, 7) + ' m/s')}
      ${kv('largest slip |v − ωR| along the run', fmtNum(me.slip, 3) + ' m/s')}
      ${kv('largest wobble in ½Mv² + ½Iω² + Mgh', fmtNum(me.dE, 3) + ' J')}
      ${kv('as a fraction of the energy released', fmtNum(me.dE / gy, 3))}
      <p class="help">v and ω were stepped as independent variables from the solved friction, so the slip
      row is the rolling constraint <i>surviving</i> rather than being imposed. The flat energy ledger
      beside it is the claim that static friction does no work — the contact point never moves, so there is
      no distance for it to dissipate through, and the total does not budge.</p>
    </div>
    <div class="card tight"><div class="ttl">Where it finished</div>
      ${kv('your place', place + ' of ' + RC.bySim.length)}
      ${kv('the order that came out of the integrations', RC.bySim.join(' → '))}
      ${kv('the order predicted by c alone', RC.byShape.join(' → '))}
      ${kv('do they agree', RC.orderMatches ? 'yes — every place' : 'no — see the two rows above')}
      <p class="help">The five standard entrants are run at unit mass and unit radius and yours at whatever
      you built, which is exactly the point: mass and radius cancel out of the acceleration, so a
      prediction made from c alone has to hold across bodies with nothing else in common. It is a
      prediction that could fail, and the two rows above are it not failing.</p>
    </div>`;
  },
  chip(st){
    if(st.own){
      const B = STAGES.rtRoll.body(st);
      if(!B.ok) return `<div class="k">the sheet</div><div style="color:var(--c-neg)">not readable yet</div>`;
      const RC = STAGES.rtRoll.race(st);
      const me = RC.rows.filter(r => r.own)[0];
      if(!me || !me.ok) return `<div class="k">your body</div><div style="color:var(--c-neg)">will not roll here</div>`;
      return `<div class="k">your body</div>
        <div style="color:var(--c-pos)">c = ${fmtNum(me.c, 4)}</div>
        <div>finished ${RC.bySim.indexOf(me.name) + 1} of ${RC.bySim.length}</div>`;
    }
    const a = DY_G * Math.sin(st.ang);
    return `<div class="k">a = g sinθ/(1+c)</div>
      <div style="color:var(--c-grad)">sphere ${fmtNum(a / 1.4, 5)} m/s²</div>
      <div>hoop ${fmtNum(a / 2, 5)} m/s²</div>`;
  },
  legend(st){
    return st && st.own
      ? [['var(--c-pos)', 'the body you built'], ['var(--c-grad)', 'the fastest standard shape'],
         ['var(--c-warn)', 'the slowest']]
      : [['var(--c-grad)', 'the fastest shape'], ['var(--c-warn)', 'the slowest']];
  },
  dockLegend:true
};

/* ---- 3 · angular momentum -------------------------------------------------- */
STAGES.rtAngular = {
  title:'Angular momentum',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'A conserved quantity that appears whenever there is no torque',
      steps:[
        drvStep('the rotational analogue of momentum',
          `${dv('L')} ${dop('=')} ${dv('I')}ω`,
          `I₁ = ${n(st.I1)}, ω₁ = ${n(st.w1)}, so L = ${n(st.I1 * st.w1)} kg·m²/s`),
        drvStep('and the rotational second law',
          `τ ${dop('=')} ${dfrac('d' + dv('L'), 'd' + dv('t'))}`,
          'exactly parallel to F = dp/dt, with torque in place of force'),
        drvSay('so conservation is immediate when nothing twists',
          'No external torque means dL/dt = 0, so L cannot change. The skater pulls her arms in: that is an internal rearrangement, exerting no torque about her own axis, so L is fixed while I falls — and ω must rise to compensate.'),
        drvStep('the skater, worked through',
          `${dv('I')}₁ω₁ ${dop('=')} ${dv('I')}₂ω₂`,
          `ω₂ = ${n(st.I1 * st.w1 / st.I2)} rad/s — a factor of ${n(st.I1 / st.I2)} faster`),
        drvStep('but the kinetic energy is not conserved',
          `${dv('KE')} ${dop('=')} ${dfrac(dv('L') + '²', '2' + dv('I'))}`,
          `energy rises from ${n(0.5 * st.I1 * st.w1 * st.w1)} to ${n(0.5 * st.I2 * Math.pow(st.I1 * st.w1 / st.I2, 2))} J`),
        drvSay('and that increase has a source, which is worth chasing',
          'The skater does work pulling her arms inwards against the centrifugal tendency. That muscular work is exactly the energy gained. Nothing is created — but it is a genuine surprise that a conservation law can hold while a related quantity goes up, and the accounting is what makes it believable.'),
        drvSay('why angular momentum is conserved at all',
          'Noether\'s theorem: every continuous symmetry gives a conserved quantity. Rotational symmetry of the laws of physics gives angular momentum, translational symmetry gives momentum, and symmetry under shifts of time gives energy. These are not three separate coincidences.'),
        drvStep('as a vector, it also explains gyroscopes',
          `τ ${dop('=')} ${dv('r')} ${dop('×')} ${dv('F')}`,
          'perpendicular to both, by the cross product — so torque changes L sideways, not in magnitude'),
        drvSay('which is why a spinning top precesses instead of falling',
          'Gravity applies a horizontal torque. A horizontal change to a vertical-ish L rotates it rather than shortening it, so the axis sweeps round a cone. It looks like magic and it is a cross product — the same right-hand rule the vectors wing insisted was a convention with consequences.'),
        drvStep('and quantum mechanics keeps the algebra, quantising the values',
          `${dv('L')}_z ${dop('=')} ${dv('m')}ħ , &nbsp; |${dv('L')}| ${dop('=')} √(${dv('l')}(${dv('l')}{+}1))ħ`,
          'the conservation law survives intact; only the permitted values become discrete'),
        st.scene === 'custom'
          ? drvSay('and on a shape change you write, none of that is set by hand',
              'Two before-and-after numbers cannot fail to conserve anything — you can always divide. So this scene never sets ω = L/I. It differentiates the conservation statement instead, d(Iω)/dt = 0, giving dω/dt = −(İ/I)ω, and hands that differential equation to RK4. Nothing in the stepper holds Iω fixed, so the drift printed below is the conservation law surviving a calculation that had every opportunity to break it — and the algebraic answer L₀/I(t), which the stepper never saw, is a second and independent route. The work follows from the same place: differentiating K = L²/2I gives a power of −½İω², and integrating that along the track must reproduce the energy the endpoints report.')
          : drvSay('two numbers, before and after, cannot test anything',
              'Given I₁, ω₁ and I₂ there is only one ω₂ that conserves L, so this scene cannot be caught being wrong. Write your own I(t) and the same statement becomes a differential equation that has to be integrated, at which point conservation is something the answer either has or does not.')
      ],
      note:'The simulation conserves L to integrator accuracy while the moment of inertia is changed, and the panel tracks the energy alongside so the difference between the two is visible rather than asserted.'
    };
  },
  enter(st, o){
    st.scene = o.scene || 'skater';
    st.I1 = 5; st.I2 = 1.5; st.w1 = 2;
    st.f = 0; st.run = o.run !== false;
    st.isrc = o.isrc || '5 - 3.5/(1 + exp(-3*(t - 2)))';
    st.T1 = o.T1 === undefined ? 4 : o.T1;
    st.w0 = o.w0 === undefined ? 1.2 : o.w0;
  },
  /* the typed I(t), integrated once per edit. İ comes from the symbolic
     differentiator rather than from finite differences, so the measured order
     of the stepper is not capped by the derivative's own truncation error. */
  own(st){
    const key = st.isrc + '@' + st.w0 + '@' + st.T1;
    if(st._ak === key) return st._ad;
    st._ak = key;
    const rawI = pkParamFn(st.isrc, () => 1);
    const rawD = pkParamD(st.isrc, 1, () => 0);
    const IOf = t => { const v = rawI(t); return Number.isFinite(v) && v > 1e-6 ? Math.min(1e6, v) : 1e-6; };
    const dOf = t => { const v = rawD(t); return Number.isFinite(v) ? Math.max(-1e6, Math.min(1e6, v)) : 0; };
    const D = rtRedistribute(IOf, st.w0, 0, st.T1, 1600, dOf);
    D.order = rtRedistOrder(IOf, st.w0, 0, st.T1, 16, dOf);
    D.IOf = IOf;
    st._ad = D;
    return D;
  },
  controls(){
    const st = ST;
    const head = ctSeg('rtAS', st.scene, [['skater', 'the skater'], ['stick', 'a sticking collision'],
                                          ['gyro', 'a gyroscope'], ['custom', 'a shape change of your own']]) +
      ctChk('rtArun', 'animate', st.run);
    if(st.scene === 'custom'){
      return head +
        fnHtml('rtAIt', 'I(t) =', st.isrc, 't, in seconds') +
        ctlRow('run for', ctlSlider('rtAT', 0.5, 20, 0.1, st.T1)) +
        ctlRow('ω at t = 0', ctlSlider('rtAw0', 0.05, 8, 0.05, st.w0)) +
        `<p class="help">Write the moment of inertia as a function of <b>t</b> in seconds — the default
        is a smooth pull-in from 5 to 1.5 kg·m² around t = 2 s. Anything works: <b>5·e^(−t/3)</b>,
        <b>1 + t</b>, <b>3 + 2·cos(t)</b> for a shape that breathes.</p>
        <p class="help">The other three scenes give a before and an after, and two numbers can always be
        made to conserve something. Here nothing is set by hand: the panel differentiates <b>Iω = const</b>
        into <b>dω/dt = −(İ/I)ω</b> and integrates <i>that</i>. <b>L = I(t)ω(t) is then an output</b>, and
        its drift along the whole run is printed — a number that could have been large.</p>
        <p class="help">The energy is accounted for the same way. <b>K = L²/2I</b> differentiates to a
        power of <b>−½İω²</b>: the work whatever pulls the mass in has to do. Integrating that along the
        track and comparing with the energy the two endpoints report is the work–energy theorem for a body
        that changes shape, tested on the shape change <i>you</i> wrote.</p>`;
    }
    return head +
      ctlRow('I before', ctlSlider('rtAI1', 0.5, 8, 0.1, st.I1)) +
      ctlRow('I after', ctlSlider('rtAI2', 0.3, 8, 0.1, st.I2)) +
      ctlRow('ω before', ctlSlider('rtAw', 0.3, 6, 0.05, st.w1)) +
      `<p class="help">With no external torque, <b>L = Iω</b> is conserved. Pull the mass inwards and I
      falls, so ω must rise in exact proportion — the skater spins faster without pushing on anything.</p>
      <p class="help">Kinetic energy is <b>not</b> conserved: <b>K = L²/2I</b>, so halving I <i>doubles</i>
      the energy. That extra energy is real work, done by the skater's arms pulling inwards against the
      outward push of the rotation. The panel prints it.</p>
      <p class="help">A sticking collision runs the other way: I increases, ω falls, and energy is
      <i>lost</i> — the same asymmetry as an inelastic linear collision, and for the same reason. And a
      gyroscope shows the third face of L: a torque perpendicular to it turns it instead of speeding it,
      which is why a spinning top precesses instead of falling over.</p>`;
  },
  wire(){
    ctWireSeg('rtAS', v => { ST.scene = v; ST.f = 0; });
    ctWireChk('rtArun', v => { ST.run = v; });
    if(ST.scene === 'custom'){
      fnWire('rtAIt', (m, s) => { ST.isrc = s; ST.f = 0; }, pkParamBuild);
      wireSlider('rtAT', () => ST.T1, v => { ST.T1 = v; ST.f = 0; }, v => fmtNum(+v, 3) + ' s');
      wireSlider('rtAw0', () => ST.w0, v => { ST.w0 = v; ST.f = 0; }, v => fmtNum(+v, 3) + ' rad/s');
      return;
    }
    wireSlider('rtAI1', () => ST.I1, v => { ST.I1 = v; }, v => fmtNum(+v, 3) + ' kg·m²');
    wireSlider('rtAI2', () => ST.I2, v => { ST.I2 = v; }, v => fmtNum(+v, 3) + ' kg·m²');
    wireSlider('rtAw', () => ST.w1, v => { ST.w1 = v; }, v => fmtNum(+v, 3) + ' rad/s');
  },
  frameOwn(st, dt, ctx, W, H){
    if(st.run) st.f += dt;
    const D = STAGES.rtAngular.own(st);
    const T1 = Math.max(0.05, st.T1);
    const tm = st.f - Math.floor(st.f / T1) * T1;
    const NS = 200, ip = [];
    let ilo = Infinity, ihi = -Infinity;
    for(let i = 0; i <= NS; i++){
      const t = T1 * i / NS, y = D.IOf(t);
      ip.push({ x:t, y }); ilo = Math.min(ilo, y); ihi = Math.max(ihi, y);
    }
    if(ihi - ilo < 1e-9){ ilo -= 0.5; ihi += 0.5; }
    const wp = [], ap = [];
    let wlo = Infinity, whi = -Infinity;
    const skip = Math.max(1, Math.round(D.n / 300));
    for(let i = 0; i <= D.n; i += skip){
      const t = D.ts[i];
      wp.push({ x:t, y:D.ws[i] });
      ap.push({ x:t, y:D.L0 / D.IOf(t) });
      wlo = Math.min(wlo, D.ws[i]); whi = Math.max(whi, D.ws[i]);
    }
    if(whi - wlo < 1e-9){ wlo -= 0.5; whi += 0.5; }
    const gap = 52, ph = Math.max(56, (H - 168) / 2);
    const px = 74, pw = Math.max(60, W - 132);
    const P1 = mkPlot(px, 44, pw, ph, 0, T1, ilo - (ihi - ilo) * 0.12, ihi + (ihi - ilo) * 0.12);
    const P2 = mkPlot(px, 44 + ph + gap, pw, ph, 0, T1, wlo - (whi - wlo) * 0.14, whi + (whi - wlo) * 0.14);
    const ticks = [];
    for(let i = 0; i <= 6; i++) ticks.push(T1 * i / 6);
    /* snap a midpoint tick that lands on rounding noise, or its nine-character
       label runs into the rotated axis title */
    const fy = (a, b) => v => fmtNum(Math.abs(v) < (b - a) * 1e-6 ? 0 : v, 3);
    plotFrame(ctx, P1, null, 'I (kg·m²)', 'the shape change you wrote:  I(t) = ' + pkPretty(st.isrc));
    plotTicksX(ctx, P1, ticks, v => fmtNum(v, 2));
    plotTicksY(ctx, P1, [ilo, (ilo + ihi) / 2, ihi], fy(ilo, ihi));
    ctPath(ctx, P1, ip, rgbCss(TH.curl), 2.4);
    ctDot(ctx, P1, tm, D.IOf(tm), 5, rgbCss(TH.curl), rgbCss(TH.bg));
    plotFrame(ctx, P2, 'time t (s)', 'ω (rad/s)',
              'ω stepped from dω/dt = −(İ/I)ω, with L₀/I(t) dashed over it');
    plotTicksX(ctx, P2, ticks, v => fmtNum(v, 2));
    plotTicksY(ctx, P2, [wlo, (wlo + whi) / 2, whi], fy(wlo, whi));
    ctPath(ctx, P2, wp, rgbCss(TH.grad), 3);
    ctPath(ctx, P2, ap, rgbCss(TH.pos), 1.8, [6, 4]);
    const iw = Math.min(D.n, Math.max(0, Math.round(tm / T1 * D.n)));
    ctDot(ctx, P2, tm, D.ws[iw], 5, rgbCss(TH.grad), rgbCss(TH.bg));
    stageNote(ctx, 'the dashed line was never given to the integrator — that it lies underneath is the conservation law', W, H);
  },
  frame(st, dt, ctx, W, H){
    if(st.scene === 'custom') return STAGES.rtAngular.frameOwn(st, dt, ctx, W, H);
    const S = st.scene === 'stick' ? rtStick(st.I1, st.w1, 1, Math.sqrt(Math.max(0.01, st.I2 - st.I1)))
                                   : rtSkater(st.I1, st.w1, st.I2);
    if(st.run){ st.f += dt * 0.35; if(st.f > 2) st.f = 0; }
    const phase = st.f < 1 ? 0 : 1;
    const w = phase ? (S.w2 !== undefined ? S.w2 : S.w1) : st.w1;
    const I = phase ? st.I2 : st.I1;
    st.ang = (st.ang || 0) + w * dt;
    const P = ctBox(W, H, 0, 0, 2);
    ctGrid(ctx, P, undefined, false);
    ctFrame(ctx, P, phase ? 'after — arms in, I smaller, ω larger' : 'before — arms out');
    if(st.scene === 'gyro'){
      const G = rtPrecess(st.I1, st.w1 * 8, 1, 0.4);
      const pr = st.ang * 0.06;
      ctPath(ctx, P, [{ x:0, y:-1.6 }, { x:0, y:0 }], rgbCss(TH.faint), 3);
      const tipx = 1.1 * Math.cos(pr), tipy = 1.1 * Math.sin(pr) * 0.35;
      ctPath(ctx, P, [{ x:0, y:0 }, { x:tipx, y:tipy }], rgbCss(TH.grad), 4);
      ctx.strokeStyle = rgbCss(TH.curl); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.ellipse(P.X(tipx), P.Y(tipy), 0.34 * P.u, 0.1 * P.u, 0, 0, 6.2832); ctx.stroke();
      ctArrow(ctx, P, tipx, tipy, tipx * 1.35, tipy * 1.35, rgbCss(TH.warn), 2.6, 'L');
      ctArrow(ctx, P, tipx, tipy, tipx, tipy - 0.5, rgbCss(TH.neg), 2.2, 'mg');
      const dx = -Math.sin(pr) * 0.45, dy = Math.cos(pr) * 0.16;
      ctArrow(ctx, P, tipx, tipy, tipx + dx, tipy + dy, rgbCss(TH.pos), 2.4, 'τ = r×F');
      ctx.strokeStyle = rgbCss(TH.faint, 0.6); ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.ellipse(P.X(0), P.Y(0), 1.1 * P.u, 0.385 * P.u, 0, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      stageNote(ctx, 'the torque is perpendicular to L, so it turns L rather than shortening it — the axis precesses', W, H);
      return;
    }
    const r = Math.sqrt(I / st.I1) * 1.1;
    ctx.strokeStyle = rgbCss(TH.faint, 0.5); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(P.X(0), P.Y(0), r * P.u, 0, 6.2832); ctx.stroke();
    for(let k = 0; k < 2; k++){
      const a = st.ang + k * Math.PI;
      ctPath(ctx, P, [{ x:0, y:0 }, { x:r * Math.cos(a), y:r * Math.sin(a) }], rgbCss(TH.grad), 4);
      ctDot(ctx, P, r * Math.cos(a), r * Math.sin(a), 9, rgbCss(TH.curl), rgbCss(TH.bg));
    }
    ctDot(ctx, P, 0, 0, 7, rgbCss(TH.text), rgbCss(TH.bg));
    ctArrow(ctx, P, 0, 1.5, 0.55 * Math.min(2, w / 2), 1.5, rgbCss(TH.warn), 2.6, 'ω');
    stageNote(ctx, 'the same L, redistributed — arms in means less I and more ω, and more energy too', W, H);
  },
  readoutOwn(st){
    const D = STAGES.rtAngular.own(st);
    const ordTxt = Number.isFinite(D.order)
      ? fmtNum(D.order, 3) + '  (RK4 should give 4)'
      : 'no order to measure — the shape is not changing, so RK4 is exact';
    return `<div class="card tight"><div class="ttl">The shape change you wrote</div>
      ${kv('I(t)', pkPretty(st.isrc) + ' kg·m²')}
      ${kv('I at the start', fmtNum(D.I0, 6) + ' kg·m²')}
      ${kv('I at the end', fmtNum(D.I1, 6) + ' kg·m²')}
      ${kv('the factor it changed by', fmtNum(D.I0 / D.I1, 5))}
      ${kv('ω at the start', fmtNum(D.w0, 5) + ' rad/s')}
      ${kv('L₀ = I(0)·ω(0)', fmtNum(D.L0, 7) + ' kg·m²/s')}
    </div>
    <div class="card tight"><div class="ttl">Conservation, as an outcome</div>
      ${kv('largest |I(t)ω(t) − L₀| along the run', fmtGap(D.dL, Math.abs(D.L0), 'kg·m²/s'))}
      ${kv('largest |ω − L₀/I(t)| along the run', fmtGap(D.gapW, Math.max(Math.abs(D.w0), Math.abs(D.wEnd)), 'rad/s'))}
      ${kv('ω at the end, from the stepper', fmtNum(D.wEnd, 8) + ' rad/s')}
      ${kv('ω at the end, from L₀/I(T)', fmtNum(D.wAlg, 8) + ' rad/s')}
      ${kv('order of the stepper, measured by halving h', ordTxt)}
      <p class="help">The integrator was handed <b>dω/dt = −(İ/I)ω</b> and nothing else — no instruction
      to hold anything fixed. So the first row is angular momentum staying put through a calculation with
      every opportunity to lose it, and the second is the algebraic answer <b>ω = L₀/I</b>, which the
      stepper never saw, arriving at the same place.</p>
    </div>
    <div class="card tight"><div class="ttl">The energy, and where it came from</div>
      ${kv('K at the start', fmtNum(D.K0, 6) + ' J')}
      ${kv('K at the end', fmtNum(D.K1, 6) + ' J')}
      ${kv('change', fmtNum(D.dK, 6) + ' J')}
      ${kv('work done, ∫ −½ İ ω² dt', fmtNum(D.work, 6) + ' J')}
      ${kv('difference', fmtGap(D.gapWork, Math.max(1e-12, Math.abs(D.dK), Math.abs(D.work)), 'J'))}
      ${kv('K = L²/2I at the end, for comparison', fmtNum(D.L0 * D.L0 / (2 * D.I1), 6) + ' J')}
      <p class="help">${D.dK >= 0
        ? 'The body pulled itself in, so I fell, ω rose, and the energy rose with it. It did not come from nowhere: something had to haul the mass inwards against its tendency to keep going straight, and the work row is exactly how much.'
        : 'The body spread out, so I rose, ω fell, and the energy fell with it. The work row is negative — whatever let the mass move outwards absorbed that energy rather than supplying it, which is the same accounting run backwards.'}
      Neither number was set: one is read off the two ends of the run, the other is a quadrature over
      everything in between, and their difference is the work–energy theorem holding for a body that
      changes shape.</p>
    </div>
    <div class="card tight"><div class="ttl">Why one is conserved and the other is not</div>
      <p class="help">No external torque acts, so <b>L cannot change</b> — that is the whole content of
      τ = dL/dt with τ = 0. Energy is under no such protection: an internal agent is free to do work, and
      here it does. Conserving one quantity says nothing whatever about another, and the two rows above
      are the cleanest place in mechanics to see that.</p>
      <p class="help">Push it: type an <b>I(t) that comes back to where it started</b> — say
      <b>3 + 2·cos(t)</b> over 2π seconds. L never moved, ω returns to its opening value, and the total
      work over the cycle is zero, because everything hauled inwards was let back out again.</p>
    </div>`;
  },
  readout(st){
    if(st.scene === 'custom') return STAGES.rtAngular.readoutOwn(st);
    if(st.scene === 'gyro'){
      const G = rtPrecess(st.I1, st.w1 * 8, 1, 0.4);
      return `<div class="card tight"><div class="ttl">A precessing gyroscope</div>
        ${kv('I', fmtNum(st.I1, 4) + ' kg·m²')}
        ${kv('spin ω', fmtNum(st.w1 * 8, 5) + ' rad/s')}
        ${kv('L = Iω', fmtNum(G.L, 6) + ' kg·m²/s')}
        ${kv('torque mgr', fmtNum(G.tau, 6) + ' N·m')}
        ${kv('precession rate Ω = τ/L', fmtNum(G.Omega, 6) + ' rad/s')}
        ${kv('precession period', fmtNum(G.period, 5) + ' s')}
        ${kv('ratio spin/precession', fmtNum(st.w1 * 8 / G.Omega, 5))}
      </div>
      <div class="card tight"><div class="ttl">Why it does not fall</div>
        <p class="help">Gravity exerts a torque about the pivot, and torque changes angular momentum:
        <b>τ = dL/dt</b>. Here τ is <i>perpendicular</i> to L, so it cannot change L's length — only its
        direction. The axis therefore swings sideways at Ω = τ/L instead of tipping over.</p>
        <p class="help">Spin it faster and the precession slows, because the same sideways nudge is a
        smaller fraction of a bigger L. Stop the spin and L is zero, the argument collapses, and the thing
        simply falls — which is the honest test of the explanation.</p>
      </div>`;
    }
    const S = st.scene === 'stick' ? rtStick(st.I1, st.w1, 1, Math.sqrt(Math.max(0.01, st.I2 - st.I1)))
                                   : rtSkater(st.I1, st.w1, st.I2);
    const w2 = S.w2 !== undefined ? S.w2 : S.w1;
    const I2 = st.scene === 'stick' ? S.I1 : st.I2;
    const K1 = st.scene === 'stick' ? S.K0 : S.K1;
    const K2 = st.scene === 'stick' ? S.K1 : S.K2;
    return `<div class="card tight"><div class="ttl">${st.scene === 'stick' ? 'A sticking collision' : 'The skater'}</div>
      ${kv('I before', fmtNum(st.I1, 5) + ' kg·m²')}
      ${kv('ω before', fmtNum(st.w1, 5) + ' rad/s')}
      ${kv('I after', fmtNum(I2, 5) + ' kg·m²')}
      ${kv('ω after', fmtNum(w2, 5) + ' rad/s')}
      ${kv('L before', fmtNum(st.I1 * st.w1, 7))}
      ${kv('L after', fmtNum(I2 * w2, 7))}
      ${kv('ΔL', fmtNum(Math.abs(I2 * w2 - st.I1 * st.w1), 3))}
    </div>
    <div class="card tight"><div class="ttl">Energy is a different story</div>
      ${kv('K before  ½Iω²', fmtNum(K1, 6) + ' J')}
      ${kv('K after', fmtNum(K2, 6) + ' J')}
      ${kv('change', fmtNum(K2 - K1, 6) + ' J')}
      ${kv('ratio', fmtNum(K2 / (K1 || 1e-9), 5))}
      ${kv('and I₁/I₂ for comparison', fmtNum(st.I1 / (I2 || 1e-9), 5))}
      <p class="help">Since K = L²/2I with L fixed, the energy ratio is exactly the inverse of the inertia
      ratio — the two rows above agree. ${st.scene === 'stick'
        ? 'Here I increased, so the energy fell, and the loss went into deformation and heat exactly as in an inelastic linear collision.'
        : 'Here I decreased, so the energy rose, and every joule of it was work done by the skater pulling their arms in against the outward tendency of the rotating mass.'}</p>
    </div>
    <div class="card tight"><div class="ttl">Where this shows up</div>
      <p class="help">A neutron star is the extreme case: a stellar core collapses from a radius of
      100 000 km to 10 km, so I falls by a factor of 10⁸ and the spin rises by the same factor — a star
      rotating once a month becomes a pulsar spinning hundreds of times a second. Nothing pushed it; the
      collapse did all the work.</p>
      <p class="help">Closer to hand: a diver tucks to rotate faster and opens up to slow down before
      entry, a cat rights itself in mid-air with zero total angular momentum by counter-rotating its two
      halves, and a helicopter needs a tail rotor because the torque on the main blades has to go
      somewhere.</p>
    </div>`;
  },
  chip(st){
    if(st.scene === 'custom'){
      const D = STAGES.rtAngular.own(st);
      return `<div class="k">L drift over the run</div>
        <div style="color:var(--c-grad)">${fmtNum(D.dL, 2)} kg·m²/s</div>
        <div style="color:var(--c-neg)">ΔK = ${fmtNum(D.dK, 4)} J</div>`;
    }
    if(st.scene === 'gyro'){ const G = rtPrecess(st.I1, st.w1 * 8, 1, 0.4);
      return `<div class="k">precession</div><div style="color:var(--c-warn)">Ω = ${fmtNum(G.Omega, 5)} rad/s</div>`; }
    const S = rtSkater(st.I1, st.w1, st.I2);
    return `<div class="k">L conserved</div>
      <div style="color:var(--c-grad)">ω: ${fmtNum(st.w1, 4)} → ${fmtNum(S.w2, 4)}</div>
      <div style="color:var(--c-neg)">ΔK = ${fmtNum(S.work, 4)} J</div>`;
  },
  legend(st){
    return st && st.scene === 'custom'
      ? [['var(--c-curl)', 'the I(t) you wrote'], ['var(--c-grad)', 'ω, stepped from the ODE'],
         ['var(--c-pos)', 'L₀/I(t) — the route the stepper never saw']]
      : [['var(--c-grad)', 'the rotating body'], ['var(--c-curl)', 'the masses'],
         ['var(--c-warn)', 'ω, or L'], ['var(--c-pos)', 'the torque'], ['var(--c-neg)', 'weight']];
  },
  dockLegend:true
};

/* ---- 4 · simple harmonic motion ------------------------------------------- */
