/* ============================================================================
   4j · THE VECTOR CALCULUS WING — the integral theorems
   Line integrals, conservative fields, Green's theorem, surface integrals,
   Stokes' theorem and the divergence theorem.

   Each theorem equates two integrals of different dimension. Every stage here
   computes *both* sides with quadrature that knows nothing about the theorem,
   and prints the difference. That difference is the evidence.
   ============================================================================ */

/* ---- the reader's own field -------------------------------------------------
   VC_FIELDS and VC_FIELDS3 keep their components as expression *source*, which
   the wing compiles for itself, so a typed field needs nothing but the same
   strings. Every stage in the wing reads its field out of one table lookup, and
   turning that lookup into a call is the whole retrofit.

   Two properties cannot be copied across, because they are claims about the
   field rather than descriptions of it. A preset says `conservative` because its
   author checked; a typed field must be *measured*. vcScan2 differentiates
   symbolically and evaluates Q_x − P_y across the window, then reports the
   largest magnitude it found — so the answer arrives with its evidence, which is
   the standard the rest of the laboratory holds itself to. `punctured` is
   measured the same way: by finding a point where the formula has no value. */
const VC_OWN2 = [{ k:'P', label:'P(x, y) =', vars:'x, y', def:'y*cos(x)' },
                 { k:'Q', label:'Q(x, y) =', vars:'x, y', def:'sin(x) - 2y' }];
const VC_OWN3 = [{ k:'P', label:'P(x,y,z) =', vars:'x, y, z', def:'y*z' },
                 { k:'Q', label:'Q(x,y,z) =', vars:'x, y, z', def:'x*z - y' },
                 { k:'R', label:'R(x,y,z) =', vars:'x, y, z', def:'x*y + z' }];
const VC_OWN_HELP = 'Each component is an ordinary expression — <b>-y/(x^2+y^2)</b>, ' +
  '<b>exp(-x^2-y^2)</b>, <b>x*sin(y)</b>. They are differentiated symbolically, not numerically, ' +
  'so the divergence and curl reported below are exact for whatever you type.';
/* sample the window and return what was actually observed, never an assertion */
function vcScan(P, Q, R){
  const out = { curl:0, div:0, hole:false, bad:false };
  try {
    const f = vcField3(P, Q, R || '0');
    const lim = R ? 6 : 12, s = R ? 0.4 : 0.2, zs = R ? [-0.8, 0, 0.8] : [0];
    for(let i = -lim; i <= lim; i++) for(let j = -lim; j <= lim; j++) for(const z of zs){
      const x = i * s, y = j * s;
      const F = f.F(x, y, z), c = f.curl(x, y, z), d = f.div(x, y, z);
      if(![F.x, F.y, F.z, c.x, c.y, c.z, d].every(Number.isFinite)){ out.hole = true; continue; }
      out.curl = Math.max(out.curl, Math.hypot(c.x, c.y, c.z));
      out.div  = Math.max(out.div, Math.abs(d));
    }
  } catch(e){ out.bad = true; }
  return out;
}
function vcCur2(st){
  if(st.fld !== 'custom') return VC_FIELDS[st.fld];
  const own = pkOwn(st, 'vcown2', VC_OWN2, null);
  const s = vcScan(own.P, own.Q, null);
  const flat = s.curl < 1e-9 && !s.bad;
  return { name:'F = ⟨' + own.P + ', ' + own.Q + '⟩', P:own.P, Q:own.Q,
    conservative:flat, punctured:s.hole,
    note:'Your field. Nothing here was told whether it is conservative. Q<sub>x</sub> − P<sub>y</sub> was ' +
      'differentiated symbolically and evaluated across the window, and the largest magnitude found was ' +
      fmtNum(s.curl, 4) + '. ' + (flat
        ? 'That is zero to rounding, so on a simply connected domain the field has a potential, and every closed loop does zero work.'
        : 'That is not zero, so the field is not a gradient and the work done depends on which path you take.') +
      (s.hole ? ' The formula also has no value at some points of the window, so the domain has a hole in it and "simply connected" stops applying — which is exactly the vortex field\'s situation.' : '') };
}
function vcCur3(st){
  if(st.fld !== 'custom') return VC_FIELDS3[st.fld];
  const own = pkOwn(st, 'vcown3', VC_OWN3, null);
  const s = vcScan(own.P, own.Q, own.R);
  return { name:'F = ⟨' + own.P + ', ' + own.Q + ', ' + own.R + '⟩', P:own.P, Q:own.Q, R:own.R,
    note:'Your field, differentiated symbolically. Across the sampled block the largest divergence found ' +
      'was ' + fmtNum(s.div, 4) + ' and the largest curl magnitude ' + fmtNum(s.curl, 4) + '. ' +
      (s.div < 1e-9 ? 'Divergence vanishing everywhere means every closed surface has zero net flux. ' : '') +
      (s.curl < 1e-9 ? 'Curl vanishing everywhere means every closed loop has zero circulation, whatever surface caps it. ' : '') +
      'Both theorems on this floor are checked against your field the same way they are checked against the presets — both sides computed independently, and the difference printed.' };
}

/* A potential sampled onto a grid, so the contour tracer can ask for it as
   often as it likes. Recovering f at one point means integrating F along a path
   to get there, so an evaluation is a quadrature, not an arithmetic expression —
   and a contour plot wants tens of thousands of them. The grid is rebuilt only
   when the field, the window or the resolution changes; between those it is
   free. Bilinear interpolation is more than enough, because the thing being
   interpolated is smooth wherever it exists at all. */
function vcPotGrid(st, F, P, budget){
  /* The canvas window is about three and a half times wider than it is tall, so
     a square grid puts cells three and a half times coarser in x than in y —
     and the interpolation error, which goes as the square of the cell size, is
     then set entirely by x. Splitting the budget by the aspect ratio makes the
     cells square and costs nothing extra.

     Measured rather than assumed, over all six preset fields at 231×66 nodes,
     289 samples each taken deliberately off the nodes (a golden-ratio offset, so
     none can land on one) and compared against a real line integral:

       rot, shear      1.8×10⁻¹⁴   — exactly linear, so interpolation is exact
       radial          1.6×10⁻³    0.004% of the plotted range
       grad            1.4×10⁻²    0.004% of the plotted range
       vortex          2.5×10⁻²    0.42%
       source          2.7×10⁻²    0.63%

     The two worst are the two with a singularity at the origin: their potentials
     are logarithmic there, the second derivative is unbounded, and no grid of
     any fixed spacing does better within a cell of it. It is worth being clear
     what this approximation touches — only the drawn contours, displaced by the
     error divided by |∇f|, which near those singularities is large and so the
     displacement is sub-pixel. Every number the panel *reports* still comes from
     vcPotential itself, at full precision. */
  const want = budget || 15000;
  const asp = Math.max(0.05, (P.x1 - P.x0) / Math.max(1e-9, P.y1 - P.y0));
  const ny = Math.max(16, Math.round(Math.sqrt(want / asp)));
  const nx = Math.max(16, Math.round(ny * asp));
  const V = vcCur2(st);
  const sig = [V.P, V.Q, P.x0, P.x1, P.y0, P.y1, nx, ny].join('|');
  if(st._pot && st._pot.sig === sig) return st._pot;
  const wx = nx + 1;
  const g = new Float64Array(wx * (ny + 1));
  for(let i = 0; i <= nx; i++){
    const x = P.x0 + (P.x1 - P.x0) * i / nx;
    for(let j = 0; j <= ny; j++)
      g[i * (ny + 1) + j] = vcPotential(F.P, F.Q, x, P.y0 + (P.y1 - P.y0) * j / ny, -1.6, -1.2);
  }
  st._pot = { sig, nx, ny, g, x0:P.x0, x1:P.x1, y0:P.y0, y1:P.y1,
    at(x, y){
      const u = (x - this.x0) / (this.x1 - this.x0) * this.nx;
      const v = (y - this.y0) / (this.y1 - this.y0) * this.ny;
      const i = Math.max(0, Math.min(this.nx - 1, Math.floor(u)));
      const j = Math.max(0, Math.min(this.ny - 1, Math.floor(v)));
      const s = u - i, t = v - j, w = this.ny + 1;
      return this.g[i * w + j]           * (1 - s) * (1 - t)
           + this.g[(i + 1) * w + j]     * s       * (1 - t)
           + this.g[i * w + j + 1]       * (1 - s) * t
           + this.g[(i + 1) * w + j + 1] * s       * t;
    } };
  return st._pot;
}

/* draw a plane vector field as a grid of arrows, scaled so the longest fits */
function vcArrows(ctx, P, Pf, Qf, n, col, alpha){
  const N = n || 15;
  const pts = [];
  let mx = 1e-9;
  for(let i = 0; i < N; i++) for(let j = 0; j < N; j++){
    const x = P.x0 + (P.x1 - P.x0) * (i + 0.5) / N;
    const y = P.y0 + (P.y1 - P.y0) * (j + 0.5) / N;
    const u = Pf(x, y), v = Qf(x, y);
    if(!Number.isFinite(u) || !Number.isFinite(v)) continue;
    pts.push({ x, y, u, v }); mx = Math.max(mx, Math.hypot(u, v));
  }
  const s = (P.x1 - P.x0) / N * 0.9 / mx;
  for(const p of pts){
    const L = Math.hypot(p.u, p.v);
    ctArrow(ctx, P, p.x, p.y, p.x + p.u * s, p.y + p.v * s,
      col || rgbCss(rampSeq(L / mx), alpha === undefined ? 0.75 : alpha), 1.4);
  }
  return mx;
}

/* ---- 1 · line integrals ---------------------------------------------------- */
STAGES.vcLineInt = {
  title:'Line integrals',
  derive(st){
    return {
      title:'Adding up a field along a path, and why only one component counts',
      steps:[
        drvSay('the physical question that defines it',
          'A force pushes an object along a path. How much work is done? The force varies from place to place and the path bends, so no single multiplication will do. The only way forward is to chop the path into pieces short enough that the force is effectively constant on each.'),
        drvStep('on one short piece, work is force times displacement',
          `Δ${dv('W')} ${dop('=')} ${dv('F')} ${dop('·')} Δ${dv('r')}`,
          'a dot product, because only the component along the motion does any work'),
        drvSay('that dot product is doing the essential filtering',
          'Push perpendicular to the motion and no work is done at all — carrying a bag along level ground costs nothing against gravity, however heavy. The dot product removes the perpendicular part automatically, which is why work is a scalar built from two vectors.'),
        drvStep('add the pieces and take the limit',
          `${dv('W')} ${dop('=')} ∫_C ${dv('F')} ${dop('·')} d${dv('r')}`,
          st.kind === 'work' ? 'the panel accumulates this as the marker moves along the path' : ''),
        drvStep('to compute it, parametrise the curve',
          `∫_a^b ${dv('F')}(${dv('r')}(${dv('t')})) ${dop('·')} ${dv('r')}′(${dv('t')}) d${dv('t')}`,
          'an ordinary one-variable integral once everything is expressed in t'),
        drvSay('and the answer does not depend on how you parametrise',
          'Traverse the same curve faster and r′ grows while dt shrinks by exactly the compensating factor. The integral is a property of the path and the field, not of the schedule used to walk it. Reversing direction, though, flips the sign — orientation is real information here.'),
        drvStep('a scalar line integral is the same idea with arc length',
          `∫_C ${dv('f')} d${dv('s')} ${dop('=')} ∫_a^b ${dv('f')} |${dv('r')}′| d${dv('t')}`,
          st.kind !== 'work' ? 'this one is orientation-independent — mass of a wire does not care which way you walk it' : 'used for mass, and for arc length when f = 1'),
        drvSay('the two differ in exactly one respect',
          'dr is a vector and ds is its length. The vector version keeps direction and therefore sign; the scalar version discards it. That is why work reverses when you retrace your steps but the length of a wire does not.'),
        drvStep('and in general the answer depends on the whole route',
          `∫_C₁ ${dop('≠')} ∫_C₂ between the same endpoints`,
          'the panel lets you compare paths — for most fields the values differ, and the next stage asks when they do not')
      ],
      note:'The integral is accumulated numerically as the marker travels, so the running total on screen is the partial integral rather than an illustration of one. Switching the field or the path re-integrates from scratch.'
    };
  },
  enter(st, o){
    st.kind = o.kind || 'work';
    st.path = o.path || 'circle';
    st.fld = o.fld || 'rot';
    st.t = 0;
    st.run = o.run !== false;
  },
  controls(){
    const st = ST;
    const paths = ['circle', 'ellipse', 'square', 'cardioid', 'segment', 'arc', 'parabola'];
    return ctSeg('vcLK', st.kind, [['scalar', '∫ f ds — the curtain'], ['work', '∫ F·dr — work'], ['flux', '∮ F·n ds — flux']]) +
      ctSeg('vcLP', st.path, paths.map(p => [p, VC_PATHS[p].name.split('  ')[0]])) +
      (st.kind === 'scalar' ? '' : pkSeg('vcLF', VC_FIELDS, st.fld) +
        pkBoxes('vcown2', st.fld, st, VC_OWN2, null, VC_OWN_HELP)) +
      ctChk('vcLrun', 'run the traverse', st.run) +
      `<p class="help">${st.kind === 'scalar'
        ? 'A <b>scalar</b> line integral <b>∫<sub>C</sub> f ds</b> adds f up along the curve, weighted by arc length. The picture is a curtain: erect a wall over C whose height at each point is f, and the integral is its area. Because ds is a length it carries no direction — reversing the curve does not change the answer, and a mass or a total charge along a wire is exactly this integral.'
        : st.kind === 'work'
        ? 'A <b>vector</b> line integral <b>∫<sub>C</sub> F·dr</b> adds up only the component of F <i>along</i> the curve. This is work, and it is orientation-sensitive: run the curve backwards and the answer changes sign, because dr does. The running total is drawn beneath, so you can watch the integral being accumulated.'
        : 'The <b>flux form</b> <b>∮ F·n̂ ds</b> measures how much of the field crosses the curve rather than running along it. In the plane the outward normal is the tangent turned clockwise, so <b>F·n̂ ds = P dy − Q dx</b> — the same integrand with the roles of the two components swapped and one sign flipped.'}</p>
      <p class="help">Everything is parametrised: <b>ds = |r′(t)| dt</b> and <b>dr = r′(t) dt</b>, so both
      integrals become ordinary single integrals in t. The panel evaluates them adaptively, and where a
      path has corners (the square) it integrates each side separately, because r′ does not exist at a
      corner.</p>`;
  },
  wire(){
    ctWireSeg('vcLK', v => { ST.kind = v; });
    ctWireSeg('vcLP', v => { ST.path = v; });
    pkWire('vcLF', 'vcown2', ST.fld, ST, VC_OWN2, null, v => { ST.fld = v; });
    ctWireChk('vcLrun', v => { ST.run = v; });
  },
  fns(st){ const V = vcCur2(st); return vcPlaneFns(V.P, V.Q); },
  scalarF(x, y){ return 1 + 0.6 * x * x + 0.4 * Math.sin(3 * y); },
  frame(st, dt, ctx, W, H){
    const C = VC_PATHS[st.path];
    if(st.run){ st.t += dt * (C.t1 - C.t0) * 0.22; if(st.t > C.t1) st.t = C.t0; }
    st.t = Math.max(C.t0, Math.min(C.t1, st.t));
    const a = C.a === undefined ? 1 : C.a, b = C.b;
    const pf = t => C.f(t, a, b);
    const pts = ctSample(pf, C.t0, C.t1, 700);
    let mx = 0.8;
    for(const p of pts) mx = Math.max(mx, Math.abs(p.x), Math.abs(p.y));
    const P = ctBox(W, H, 0, 0, mx * 1.3, { r:W * 0.46 });
    const F = this.fns(st);
    if(st.kind === 'scalar'){
      ctHeat(ctx, P, (x, y) => this.scalarF(x, y), 0, 4, 54, 0.5);
    } else {
      vcArrows(ctx, P, F.P, F.Q, 15);
    }
    ctGrid(ctx, P, undefined, true);
    ctFrame(ctx, P, C.name + (st.kind === 'scalar' ? '  —  f drawn as colour' : '  —  the field, and the path'));
    ctPath(ctx, P, pts, rgbCss(TH.text, 0.9), 2.6);
    /* the traversed part, and the tangent/normal at the moving point */
    ctPath(ctx, P, ctSample(pf, C.t0, st.t, 400), rgbCss(TH.grad), 3.4);
    const p = pf(st.t), d = C.d(st.t, a, b);
    const sp = Math.hypot(d.x, d.y) || 1;
    const uT = { x:d.x / sp, y:d.y / sp }, uN = { x:uT.y, y:-uT.x };
    const scl = mx * 0.3;
    if(st.kind === 'flux') ctArrow(ctx, P, p.x, p.y, p.x + uN.x * scl, p.y + uN.y * scl, rgbCss(TH.curl), 2.4, 'n̂');
    else ctArrow(ctx, P, p.x, p.y, p.x + uT.x * scl, p.y + uT.y * scl, rgbCss(TH.curl), 2.4, 'T̂');
    if(st.kind !== 'scalar'){
      const fv = { x:F.P(p.x, p.y), y:F.Q(p.x, p.y) };
      const fl = Math.hypot(fv.x, fv.y) || 1;
      ctArrow(ctx, P, p.x, p.y, p.x + fv.x / fl * scl * 1.2, p.y + fv.y / fl * scl * 1.2, rgbCss(TH.warn), 2.6, 'F');
    }
    ctDot(ctx, P, p.x, p.y, 6, rgbCss(TH.grad), rgbCss(TH.bg));
    /* the integrand and its running total, alongside */
    const x0 = W * 0.55;
    const integ = t => {
      const q = pf(t), dq = C.d(t, a, b);
      if(st.kind === 'scalar') return this.scalarF(q.x, q.y) * Math.hypot(dq.x, dq.y);
      if(st.kind === 'flux') return F.P(q.x, q.y) * dq.y - F.Q(q.x, q.y) * dq.x;
      return F.P(q.x, q.y) * dq.x + F.Q(q.x, q.y) * dq.y;
    };
    let ilo = Infinity, ihi = -Infinity;
    for(let i = 0; i <= 200; i++){
      const v = integ(C.t0 + (C.t1 - C.t0) * i / 200);
      if(Number.isFinite(v)){ ilo = Math.min(ilo, v); ihi = Math.max(ihi, v); }
    }
    const acc = nqAccumulate(integ, C.t0, C.t1, 400);
    let alo = 0, ahi = 0;
    for(let i = 0; i <= 400; i++){ alo = Math.min(alo, acc.As[i]); ahi = Math.max(ahi, acc.As[i]); }
    const hp = (H - 160) / 2;
    const A = mkPlot(x0 + 52, 52, W - x0 - 92, hp, C.t0, C.t1, ilo - 0.2 * (ihi - ilo + 1e-9), ihi + 0.2 * (ihi - ilo + 1e-9));
    const B = mkPlot(x0 + 52, 52 + hp + 58, W - x0 - 92, hp, C.t0, C.t1, alo - 0.2 * (ahi - alo + 1e-9), ahi + 0.2 * (ahi - alo + 1e-9));
    plotFrame(ctx, A, 't', 'the integrand', st.kind === 'scalar' ? 'f·|r′|' : st.kind === 'flux' ? "P y′ − Q x′" : "F·r′ = P x′ + Q y′");
    plotZeroY(ctx, A); plotTicksX(ctx, A, [C.t0, (C.t0 + C.t1) / 2, C.t1], v => fmtNum(v, 3));
    plotCurve(ctx, A, integ, 500, rgbCss(TH.warn), 2.2);
    probeLine(ctx, A, st.t, 't');
    plotFrame(ctx, B, 't', 'running total', 'the integral, accumulated');
    plotZeroY(ctx, B); plotTicksX(ctx, B, [C.t0, (C.t0 + C.t1) / 2, C.t1], v => fmtNum(v, 3));
    ctx.strokeStyle = rgbCss(TH.grad); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for(let i = 0; i <= 400; i++){
      const X = B.X(acc.xs[i]), Y = B.Y(Math.max(B.y0, Math.min(B.y1, acc.As[i])));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    probeLine(ctx, B, st.t, 't');
    stageNote(ctx, 'the lower plot is the integral being accumulated — its final value is the answer', W, H);
  },
  readout(st){
    const C = VC_PATHS[st.path];
    const a = C.a === undefined ? 1 : C.a, b = C.b;
    const F = this.fns(st);
    const brk = st.path === 'square' ? [1, 2, 3] : null;
    const len = vcArcLen(C, C.t0, C.t1, a, b);
    const work = brk ? vcLineWorkPiecewise(F.P, F.Q, C, C.t0, C.t1, a, b, brk)
                     : vcLineWork(F.P, F.Q, C, C.t0, C.t1, a, b);
    const flux = vcLineFlux(F.P, F.Q, C, C.t0, C.t1, a, b);
    const scal = vcLineScalar((x, y) => this.scalarF(x, y), C, C.t0, C.t1, a, b);
    const V = vcCur2(st);
    return `<div class="card tight"><div class="ttl">The curve</div>
      ${kv('parametrisation', C.name)}
      ${kv('t from', `${fmtNum(C.t0, 4)} to ${fmtNum(C.t1, 4)}`)}
      ${kv('closed?', C.closed ? 'yes' : 'no')}
      ${kv('arc length ∫|r′| dt', fmtNum(len, 7))}
      <p class="help">${C.note}</p>
    </div>
    <div class="card tight"><div class="ttl">All three integrals over it</div>
      ${kv('∫ f ds  (scalar)', fmtNum(scal, 7))}
      ${kv('average of f along C', fmtNum(scal / len, 7))}
      ${kv('∫ F·dr  (work)', fmtNum(work, 7))}
      ${kv('average of F·T̂', fmtNum(work / len, 7))}
      ${kv('∮ F·n̂ ds  (flux)', fmtNum(flux, 7))}
      ${kv('reversing the curve changes', 'the work and the flux, but not ∫f ds')}
      <p class="help">The scalar integral uses |r′| dt, which is positive whichever way you go. The other
      two use r′ dt, which reverses. That is not a technicality: work done against a force is the negative
      of work done by it, and the sign is the whole point.</p>
    </div>
    <div class="card tight"><div class="ttl">The field</div>
      ${kv('F', V.name)}
      ${kv('conservative?', V.conservative ? 'yes' : 'no')}
      ${V.pot ? kv('a potential', V.pot) : ''}
      ${C.closed ? kv('∮ F·dr around this closed curve', fmtNum(work, 7)) : ''}
      ${C.closed && V.conservative ? kv('as it must be for a conservative field', 'zero') : ''}
      <p class="help">${V.note}</p>
    </div>`;
  },
  chip(st){
    const C = VC_PATHS[st.path];
    const a = C.a === undefined ? 1 : C.a, b = C.b;
    const F = this.fns(st);
    const v = st.kind === 'scalar' ? vcLineScalar((x, y) => this.scalarF(x, y), C, C.t0, C.t1, a, b)
      : st.kind === 'flux' ? vcLineFlux(F.P, F.Q, C, C.t0, C.t1, a, b)
      : (st.path === 'square' ? vcLineWorkPiecewise(F.P, F.Q, C, C.t0, C.t1, a, b, [1, 2, 3])
                              : vcLineWork(F.P, F.Q, C, C.t0, C.t1, a, b));
    return `<div class="k">${st.kind === 'scalar' ? '∫ f ds' : st.kind === 'flux' ? '∮ F·n ds' : '∫ F·dr'}</div>
      <div style="color:var(--c-grad)">${fmtNum(v, 6)}</div>`;
  },
  legend(){ return [['var(--text)', 'the curve C'], ['var(--c-grad)', 'traversed so far, and the running total'],
                    ['var(--c-curl)', 'T̂ or n̂'], ['var(--c-warn)', 'F at the moving point, and the integrand']]; },
  dockLegend:true
};

/* ---- 2 · conservative fields ----------------------------------------------- */
STAGES.vcConserv = {
  title:'Conservative fields',
  derive(st){
    return {
      title:'When the path stops mattering, and what that buys you',
      steps:[
        drvSay('the special case worth naming',
          'For most fields the work done depends on the route taken. For some it does not — only the endpoints matter. Those fields are called conservative, and gravity and electrostatics are both of them, which is why the whole idea of potential energy exists.'),
        drvStep('suppose the field is a gradient',
          `${dv('F')} ${dop('=')} ∇φ`,
          'φ is a scalar potential — one function instead of a vector field'),
        drvStep('then the line integral collapses by the chain rule',
          `${dfrac('d', 'd' + dv('t'))}φ(${dv('r')}(${dv('t')})) ${dop('=')} ∇φ ${dop('·')} ${dv('r')}′`,
          'which is exactly the integrand of the work integral'),
        drvStep('so the integral is a difference of endpoint values',
          `∫_C ∇φ ${dop('·')} d${dv('r')} ${dop('=')} φ(end) ${dop('−')} φ(start)`,
          'the Fundamental Theorem of Calculus, for line integrals'),
        drvSay('and everything else follows from that one line',
          'The route has vanished from the answer. Any two paths with the same endpoints give the same work; any closed loop gives zero, because the endpoints coincide. Path independence, zero circulation and the existence of a potential are three faces of one fact.'),
        drvStep('a necessary test: a gradient has no curl',
          `∇${dop('×')}(∇φ) ${dop('=')} 0`,
          'which the forms wing derives in one stroke as d∘d = 0'),
        drvSay('but zero curl is not quite enough, and the exception matters',
          'On a region with a hole, a field can have zero curl everywhere and still fail to be conservative. The standard example circulates around the origin with zero curl away from it, yet gives 2π round any loop enclosing it. The obstruction is topological, not local — and it is the same phenomenon as the complex wing\'s ∮dz/z = 2πi.'),
        drvStep('on a simply connected region, though, the test is complete',
          `∇${dop('×')}${dv('F')} ${dop('=')} 0 ${dop('⇒')} ${dv('F')} ${dop('=')} ∇φ`,
          'the panel checks the curl and, where it vanishes, reconstructs φ by integrating'),
        drvSay('and this is where energy conservation comes from',
          'Define potential energy as −φ. Work done by the field equals the drop in potential energy, whatever the route, so kinetic plus potential is constant. Conservation of energy in mechanics is a corollary of the field being a gradient — and for a non-conservative force like friction, it fails exactly as the mathematics predicts.')
      ],
      note:'The potential is reconstructed here by integrating the field along a path from a reference point, then checked by differentiating it back and comparing with the original field. Where the field is not conservative that reconstruction depends on the path chosen, and the panel shows it disagreeing.'
    };
  },
  drag:true,
  enter(st, o){
    st.fld = o.fld || 'grad';
    st.x = 1.2; st.y = 0.8;
    st.show = Object.assign({ paths:true, pot:true }, o.show || {});
  },
  controls(){
    const st = ST, V = vcCur2(st);
    return pkSeg('vcCF', VC_FIELDS, st.fld) +
      pkBoxes('vcown2', st.fld, st, VC_OWN2, null, VC_OWN_HELP) +
      `<div class="row wrap">${ctChk('vcCp', 'three different paths between the same ends', st.show.paths)}
        ${ctChk('vcCpot', 'the recovered potential, as contours', st.show.pot)}</div>
      <p class="help"><b>${V.name}</b> — ${V.note}</p>
      <p class="help">Four statements that are equivalent for a field on a <b>simply connected</b> domain,
      and which the panel checks one at a time:</p>
      <p class="help">① <b>F = ∇f</b> for some scalar f.  ② <b>∮F·dr = 0</b> around every closed curve.
      ③ The work between two points is the same along every path.  ④ <b>∂P/∂y = ∂Q/∂x</b> everywhere.</p>
      <p class="help">The last one is the cheap test, and it is the one with a catch: it detects only a
      <i>local</i> obstruction. Choose the vortex field and watch ④ pass everywhere while ② fails around
      the origin — because the domain has a hole in it, and the hypothesis quietly did real work.
      <b>Click the canvas</b> to move the endpoint.</p>`;
  },
  wire(){
    pkWire('vcCF', 'vcown2', ST.fld, ST, VC_OWN2, null, v => { ST.fld = v; });
    ctWireChk('vcCp', v => { ST.show.paths = v; });
    ctWireChk('vcCpot', v => { ST.show.pot = v; });
  },
  fns(st){ const V = vcCur2(st); return vcPlaneFns(V.P, V.Q); },
  /* three routes from (−1.6, −1.2) to the probe */
  routes(st){
    const A = { x:-1.6, y:-1.2 }, B = { x:st.x, y:st.y };
    return [
      { name:'straight', f:t => ({ x:A.x + (B.x - A.x) * t, y:A.y + (B.y - A.y) * t }),
        d:() => ({ x:B.x - A.x, y:B.y - A.y }) },
      { name:'L-shaped', f:t => t < 0.5 ? { x:A.x + (B.x - A.x) * 2 * t, y:A.y }
                                        : { x:B.x, y:A.y + (B.y - A.y) * (2 * t - 1) },
        d:t => t < 0.5 ? { x:2 * (B.x - A.x), y:0 } : { x:0, y:2 * (B.y - A.y) } },
      { name:'bulging arc', f:t => {
          const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
          const s = Math.sin(Math.PI * t) * 1.1;
          return { x:A.x + dx * t - s * dy / L, y:A.y + dy * t + s * dx / L };
        },
        d:t => {
          const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1;
          const ds = Math.PI * Math.cos(Math.PI * t) * 1.1;
          return { x:dx - ds * dy / L, y:dy + ds * dx / L };
        } }
    ];
  },
  pick(st, sx, sy, phase){
    if(phase === 'up' || !st.P) return;
    if(st.P.inside(sx, sy)){ st.x = st.P.invX(sx); st.y = st.P.invY(sy); }
  },
  frame(st, dt, ctx, W, H){
    const F = this.fns(st);
    const E = 2.6;
    const P = ctBox(W, H, 0, 0, E);
    st.P = P;
    if(st.show.pot){
      /* The potential, recovered by integrating — drawn only where it means
         something, i.e. where the field passes the cross-partial test.

         Each evaluation of it is a line integral, and the range scan plus
         sixteen contour traces asked for about 150 000 of them *per frame*, for
         a picture that only changes when the field or the window does. Sampling
         once onto a grid and interpolating costs 9 409 line integrals when
         something changes and nothing at all when it does not — the contours are
         indistinguishable, and the stage went from roughly nine million adaptive
         quadratures a second to none. */
      const G = vcPotGrid(st, F, P);
      const pot = (x, y) => G.at(x, y);
      const rg = ctRange(pot, P, 26);
      if(Number.isFinite(rg.lo) && Number.isFinite(rg.hi))
        for(const L of ctLevels(rg.lo, rg.hi, 16)) ctContour(ctx, P, pot, L, rgbCss(TH.pos, 0.45), 1.2, 70);
    }
    vcArrows(ctx, P, F.P, F.Q, 16);
    ctGrid(ctx, P, undefined, true);
    ctFrame(ctx, P, vcCur2(st).name + '  —  click to move the endpoint');
    const A = { x:-1.6, y:-1.2 }, B = { x:st.x, y:st.y };
    if(st.show.paths){
      const cols = [TH.grad, TH.curl, TH.neg];
      this.routes(st).forEach((r, i) => ctParam(ctx, P, r.f, 0, 1, 240, rgbCss(cols[i]), 2.6));
    }
    ctDot(ctx, P, A.x, A.y, 7, rgbCss(TH.text), rgbCss(TH.bg));
    ctText(ctx, P.X(A.x) + 10, P.Y(A.y) + 14, 'start', rgbCss(TH.text), '600 11px ' + FONT_UI);
    ctDot(ctx, P, B.x, B.y, 7, rgbCss(TH.warn), rgbCss(TH.bg));
    ctText(ctx, P.X(B.x) + 10, P.Y(B.y) - 10, 'end', rgbCss(TH.warn), '600 11px ' + FONT_UI);
    stageNote(ctx, 'three routes, three work integrals — equal if and only if the field is conservative', W, H);
  },
  readout(st){
    const V = vcCur2(st);
    const F = this.fns(st);
    const t = vcConservativeTest(V.P, V.Q, st.x, st.y);
    const works = this.routes(st).map(r =>
      ({ name:r.name, w:vcLineWork(F.P, F.Q, { f:r.f, d:r.d }, 0, 1) }));
    const spread = Math.max(...works.map(w => w.w)) - Math.min(...works.map(w => w.w));
    const pot = vcPotential(F.P, F.Q, st.x, st.y, -1.6, -1.2);
    const potAlt = vcPotentialAlt(F.P, F.Q, st.x, st.y, -1.6, -1.2);
    /* the circulation around a small loop enclosing the origin, which is where
       the punctured-plane fields betray themselves */
    const circ = vcLineWork(F.P, F.Q, VC_PATHS.circle, 0, 2 * Math.PI, 1.0);
    return `<div class="card tight"><div class="ttl">④ The cross-partial test, symbolically</div>
      ${kv('∂P/∂y', fmtNum(t.py, 7))}
      <div class="dstep"><div class="lbl">∂P/∂y</div>${texEq(t.astPy)}</div>
      ${kv('∂Q/∂x', fmtNum(t.qx, 7))}
      <div class="dstep"><div class="lbl">∂Q/∂x</div>${texEq(t.astQx)}</div>
      ${kv('Q<sub>x</sub> − P<sub>y</sub>  (the scalar curl)', fmtNum(t.curl, 7))}
      ${kv('verdict', Math.abs(t.curl) < 1e-9 ? 'passes — no local obstruction' : 'fails — this field is not a gradient')}
    </div>
    <div class="card tight"><div class="ttl">③ Three paths, same endpoints</div>
      ${works.map(w => kv(w.name, fmtNum(w.w, 7))).join('')}
      ${kv('spread between them', fmtNum(spread, 4))}
      ${kv('verdict', spread < 1e-6 ? 'path independent' : 'path dependent — the route matters')}
      <p class="help">Three genuinely different curves, each integrated on its own. When the field is
      conservative these agree to quadrature precision; when it is not, the difference is the circulation
      around the loop the two paths make together.</p>
    </div>
    <div class="card tight"><div class="ttl">① The potential, recovered</div>
      ${kv('f by ∫P dx then ∫Q dy', fmtNum(pot, 7))}
      ${kv('f by ∫Q dy then ∫P dx', fmtNum(potAlt, 7))}
      ${kv('difference', fmtNum(Math.abs(pot - potAlt), 4))}
      ${V.pot ? kv('the closed form', V.pot) : ''}
      ${kv('work along the straight path', fmtNum(works[0].w, 7))}
      ${kv('f(end) − f(start)', fmtNum(pot, 7))}
      <p class="help">The staircase construction integrates P along a horizontal leg and then Q along a
      vertical one. Doing it in the other order must give the same answer, and the gap above is exactly the
      circulation around the rectangle the two staircases bound — which is why the two rows agree precisely
      when the cross-partial test passes.</p>
      <p class="help">Once f exists, the <b>Fundamental Theorem for line integrals</b> takes over:
      <b>∫<sub>C</sub> ∇f·dr = f(end) − f(start)</b>. It is the one-variable Fundamental Theorem with the
      interval replaced by a curve, and it is why potential energy is a useful idea at all.</p>
    </div>
    <div class="card tight"><div class="ttl">② A closed loop around the origin</div>
      ${kv('∮ F·dr around the unit circle', fmtNum(circ, 7))}
      ${kv('Q<sub>x</sub> − P<sub>y</sub> on that circle', V.punctured ? 'zero everywhere it is defined' : fmtNum(t.curl, 5))}
      ${kv('is the domain simply connected?', V.punctured ? 'no — the origin is missing' : 'yes')}
      <p class="help">${V.punctured
        ? 'Here is the catch in full view. The curl vanishes at every point of the domain, and yet the circulation around this loop is not zero — because the loop cannot be shrunk to a point without leaving the domain. The field is <i>locally</i> a gradient (the potential exists on any disc avoiding the origin) but not globally: the "potential" is the polar angle θ, which increases by 2π every time round. Winding numbers, branch cuts, and Aharonov–Bohm phases all live in this gap.'
        : 'With no holes in the domain, a vanishing curl really does guarantee a potential — this is the Poincaré lemma, and it is what makes the cheap test trustworthy here.'}</p>
    </div>`;
  },
  chip(st){
    const V = vcCur2(st);
    const t = vcConservativeTest(V.P, V.Q, st.x, st.y);
    return `<div class="k">Q<sub>x</sub> − P<sub>y</sub></div>
      <div style="color:${Math.abs(t.curl) < 1e-9 ? 'var(--c-pos)' : 'var(--c-neg)'}">${fmtNum(t.curl, 5)}</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the straight path'], ['var(--c-curl)', 'the L-shaped path'],
                    ['var(--c-neg)', 'the bulging arc'], ['var(--c-pos)', 'level curves of the potential'],
                    ['var(--c-warn)', 'the endpoint']]; },
  dockLegend:true
};

/* ---- 3 · Green's theorem --------------------------------------------------- */
