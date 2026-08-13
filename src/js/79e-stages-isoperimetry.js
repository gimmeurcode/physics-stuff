/* ============================================================================
   4u · THE ISOPERIMETRIC INEQUALITY — draw a loop, measure it
   The oldest optimisation problem there is, and the one place where a
   hand-drawn curve is not a convenience but the whole point: the theorem is a
   statement about *every* closed curve, so being able to try your own is the
   difference between reading it and testing it.
   ============================================================================ */

STAGES.dfIso = {
  title:'The isoperimetric inequality',
  derive(st){
    const A = Math.abs(lpArea(st.loop)), L = lpPerim(st.loop);
    const Q = L > 0 ? 4 * Math.PI * A / (L * L) : 0;
    const n = v => fmtNum(v, 6);
    return {
      title:'Why the circle wins, and how to measure how badly everything else loses',
      steps:[
        drvSay('the oldest optimisation problem there is',
          'Among all closed curves of a given length, which encloses the most area? The answer has been believed since antiquity and was not properly proved until the nineteenth century, because "obviously the circle" is not an argument and the existence of a maximiser is itself a real difficulty.'),
        drvStep('measure the area with the shoelace formula',
          `${dv('A')} ${dop('=')} ${dfrac('1', '2')}∮(${dv('x')} d${dv('y')} ${dop('−')} ${dv('y')} d${dv('x')})`,
          `for the loop drawn: A = ${n(A)}`),
        drvSay('that formula is Green\'s theorem, not a separate trick',
          'Taking P = −y/2 and Q = x/2 makes the integrand of Green\'s theorem exactly 1, so the double integral is the area. A boundary integral has computed an interior quantity — which is the point of the whole vector-calculus wing, applied here to get a number out of a drawn curve.'),
        drvStep('measure the perimeter as arc length',
          `${dv('L')} ${dop('=')} ∮ |d${dv('r')}|`,
          `L = ${n(L)}`),
        drvStep('form the ratio that scaling cannot change',
          `${dv('Q')} ${dop('=')} ${dfrac('4π' + dv('A'), dv('L') + '²')}`,
          `Q = ${n(Q)} for this loop`),
        drvSay('why the combination has to be A over L squared',
          'Double every dimension and area quadruples while perimeter merely doubles. So A/L² is unchanged by scaling, and any meaningful comparison of shapes must use it. The 4π is chosen so that a circle scores exactly 1 — a normalisation, not part of the mathematics.'),
        drvStep('the inequality',
          `4π${dv('A')} ${dop('≤')} ${dv('L')}²  , with equality only for a circle`,
          `this loop scores ${n(Q)}, so it is ${Q > 0.999 ? 'essentially a circle' : 'less efficient than a circle'}`),
        drvStep('and the square is an exact test case',
          `${dv('Q')}_square ${dop('=')} ${dfrac('4π' + dv('s') + '²', '(4' + dv('s') + ')²')} ${dop('=')} ${dfrac('π', '4')}`,
          `π/4 = ${n(Math.PI / 4)} — draw a square and the readout should land on it`),
        drvSay('the proof is harder than the statement, and instructive about why',
          'The elegant route expands the boundary curve in a Fourier series and applies Wirtinger\'s inequality; the circle is the case where every harmonic above the first vanishes. Deviation from circularity is literally higher-harmonic content, which is why the Fourier wing and this one are connected.'),
        drvSay('and the same principle is why bubbles are round',
          'Surface tension minimises area for a fixed volume, which is the three-dimensional version. A soap bubble is not choosing to be a sphere; the sphere is the only shape for which no local rearrangement reduces the surface. Nature solves the isoperimetric problem by not being able to do anything else.')
      ],
      note:'Draw any closed loop and the readout computes both integrals from the drawn points and forms the ratio. It never exceeds 1, and approaches it only as the drawing approaches a circle — the inequality tested against an arbitrary hand-drawn curve rather than illustrated with a chosen example.'
    };
  },
  drag:true,
  enter(st, o){
    st.loop = lpNew();
    st.preset = o.preset || 'circle';
    this.load(st, st.preset);
  },
  load(st, kind){
    const pts = [];
    const N = 160;
    for(let i = 0; i < N; i++){
      const t = i / N * 2 * Math.PI;
      if(kind === 'circle') pts.push({ x:Math.cos(t), y:Math.sin(t) });
      else if(kind === 'ellipse') pts.push({ x:1.7 * Math.cos(t), y:0.55 * Math.sin(t) });
      else if(kind === 'square'){
        const u = i / N * 4, s = Math.floor(u), f = u - s;
        const c = [[-1,-1],[1,-1],[1,1],[-1,1]], d = c[(s + 1) % 4], a = c[s];
        pts.push({ x:a[0] + (d[0] - a[0]) * f, y:a[1] + (d[1] - a[1]) * f });
      } else if(kind === 'star'){
        const r = 1 + 0.42 * Math.cos(5 * t);
        pts.push({ x:r * Math.cos(t), y:r * Math.sin(t) });
      } else pts.push({ x:Math.cos(t), y:Math.sin(t) });
    }
    st.loop.pts = pts; st.loop.closed = true;
    st.preset = kind;
  },
  controls(){
    const st = ST;
    return ctSeg('isoP', st.preset, [['circle','a circle'],['ellipse','an ellipse'],
                                     ['square','a square'],['star','a star']]) +
      `<div class="row wrap">${ctBtn('isoClr', 'draw your own')}</div>
      <p class="help">Among all closed curves of a given perimeter, <b>the circle encloses the most
      area</b>. Equivalently, for every closed curve</p>
      <div class="eqb"><span class="mth">4π<i>A</i> ≤ <i>L</i>²</span></div>
      <p class="help">with equality only for a circle. The panel computes A by the shoelace formula
      and L by summing the segments — both from the polygon actually on screen — and forms the
      dimensionless ratio <b>Q = 4πA/L²</b>. It cannot exceed 1. <b>Press "draw your own" and try to
      beat the circle</b>: every wiggle you add lengthens the boundary faster than it adds area, and
      Q falls.</p>`;
  },
  wire(){
    ctWireSeg('isoP', v => STAGES.dfIso.load(ST, v));
    ctWireBtn('isoClr', () => { ST.loop = lpNew(); ST.preset = 'yours'; });
  },
  pick(st, sx, sy, phase){
    if(!st.P) return;
    if(lpPick(st.loop, st.P, sx, sy, phase)) st.preset = 'yours';
  },
  frame(st, dt, ctx, W, H){
    const P = ctBox(Math.min(W, H * 1.3), H, 0, 0, 2.3);
    st.P = P;
    ctGrid(ctx, P);
    const A = Math.abs(lpArea(st.loop)), L = lpPerim(st.loop);
    const Q = L > 1e-9 ? 4 * Math.PI * A / (L * L) : 0;
    lpPaint(ctx, P, st.loop, rgbCss(TH.grad), rgbCss(TH.grad, 0.18));
    /* the circle of the same perimeter, for comparison */
    if(L > 1e-6){
      const r = L / (2 * Math.PI);
      let cx0 = 0, cy0 = 0;
      for(const p of st.loop.pts){ cx0 += p.x; cy0 += p.y; }
      cx0 /= (st.loop.pts.length || 1); cy0 /= (st.loop.pts.length || 1);
      ctParam(ctx, P, t => ({ x:cx0 + r * Math.cos(t), y:cy0 + r * Math.sin(t) }),
              0, 2 * Math.PI, 160, rgbCss(TH.warn, 0.85), 2, [6, 4]);
    }
    ctFrame(ctx, P, st.preset === 'yours' ? 'your curve — drag to draw a closed loop'
                                          : 'the ' + st.preset);
    /* the quality bar */
    const bx = P.px + 14, by = P.py + P.ph - 34, bw = Math.min(240, P.pw - 28);
    ctx.fillStyle = rgbCss(TH.line2); ctx.fillRect(bx, by, bw, 12);
    ctx.fillStyle = rgbCss(Q > 0.999 ? TH.grad : TH.pos);
    ctx.fillRect(bx, by, bw * Math.max(0, Math.min(1, Q)), 12);
    ctx.fillStyle = rgbCss(TH.faint); ctx.font = '11px ' + FONT_UI;
    ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
    ctx.fillText('Q = 4πA/L² = ' + fmtNum(Q, 5) + '   (1 is the circle, and the ceiling)', bx, by - 4);
    stageNote(ctx, 'the dashed orange circle has the same perimeter as your curve — compare the areas', W, H);
  },
  readout(st){
    const A = lpArea(st.loop), L = lpPerim(st.loop);
    const Q = L > 1e-9 ? 4 * Math.PI * Math.abs(A) / (L * L) : 0;
    const rEq = L / (2 * Math.PI);
    return `<div class="card tight"><div class="ttl">Measured from the curve on screen</div>
      ${kv('area A  (shoelace)', fmtNum(Math.abs(A), 6))}
      ${kv('signed area', fmtNum(A, 6))}
      ${kv('orientation', A > 0 ? 'counter-clockwise' : 'clockwise')}
      ${kv('perimeter L', fmtNum(L, 6))}
      ${kv('Q = 4πA/L²', fmtNum(Q, 6))}
      ${kv('Q ≤ 1?', Q <= 1.0000001 ? 'yes' : 'NO — that would be a bug')}
      <p class="help">The area comes from the shoelace formula, which is Green's theorem applied to
      the polygon — so this readout is the vector-calculus wing's planimeter, reused. Its
      <i>sign</i> is the orientation, which is why the signed value is shown too.</p>
    </div>
    <div class="card tight"><div class="ttl">Against the circle of equal perimeter</div>
      ${kv('a circle of this perimeter has radius', fmtNum(rEq, 6))}
      ${kv('and area', fmtNum(Math.PI * rEq * rEq, 6))}
      ${kv('yours encloses', fmtNum(Math.abs(A), 6))}
      ${kv('shortfall', fmtNum(Math.PI * rEq * rEq - Math.abs(A), 6))}
      <p class="help">Every closed curve loses to the circle, and the amount it loses by is exactly
      what Q measures. Try to beat it by hand: adding a bulge adds area, but the extra boundary it
      costs always outweighs the gain.</p>
      <p class="help">The result is ancient — Dido's problem — and was not rigorously proved until
      the nineteenth century. The modern proof is a Fourier argument: expand the boundary curve as a
      Fourier series, and the inequality falls out of Parseval's theorem, with equality exactly when
      every harmonic above the first vanishes. That is the circle.</p>
    </div>`;
  },
  chip(st){
    const A = Math.abs(lpArea(st.loop)), L = lpPerim(st.loop);
    const Q = L > 1e-9 ? 4 * Math.PI * A / (L * L) : 0;
    return `<div class="k">isoperimetric</div>
      <div style="color:${Q > 0.999 ? 'var(--c-grad)' : 'var(--c-pos)'}">Q = ${fmtNum(Q, 4)}</div>
      <div>A = ${fmtNum(A, 4)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'your curve'], ['var(--c-warn)', 'the circle of equal perimeter']]; },
  dockLegend:true
};
