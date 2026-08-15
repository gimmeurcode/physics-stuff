STAGES.igTriple = {
  title:'Triple integrals',
  derive(st){
    return {
      title:'Three nested integrals, and the discipline the limits require',
      steps:[
        drvSay('nothing new happens, and that is worth saying',
          'Chop the solid into boxes, evaluate the integrand at a point in each, multiply by the box volume, add, take the limit. The definition is the same one used in one and two dimensions. What gets harder is not the concept but the bookkeeping of the limits.'),
        drvStep('the iterated form',
          `∭ ${dv('f')} d${dv('V')} ${dop('=')} ∫∫∫ ${dv('f')} d${dv('z')} d${dv('y')} d${dv('x')}`,
          'innermost limits may involve both other variables; the middle may involve the outer; the outer must be constants'),
        drvSay('that nesting rule is the entire difficulty',
          'Work from the inside out and each integration removes one variable. If a variable survives to the outermost integral the setup is wrong, because the answer would still depend on it. Checking this before integrating anything catches most errors for free.'),
        drvStep('to find the innermost limits, ask what a needle sees',
          `${dv('z')} runs from the bottom surface to the top`,
          'fire a line through the solid parallel to the innermost axis and record where it enters and leaves'),
        drvStep('then project the solid onto the remaining plane',
          `the shadow of the solid is the region for the outer two integrals`,
          'and that is a two-dimensional problem, already solved in the previous stage'),
        drvSay('projection is the step that makes this tractable',
          'A three-dimensional problem becomes a one-dimensional problem (the needle) plus a two-dimensional one (the shadow). The order chosen decides which shadow you get, and for an awkward solid one projection can be far simpler than the others.'),
        drvStep('volume is the case f = 1',
          `${dv('V')} ${dop('=')} ∭ 1 d${dv('V')}`,
          'the panel computes this and prints it against the known volume of the solid, with the difference'),
        drvStep('and the centroid divides a first moment by the total',
          `${dv('z')}̄ ${dop('=')} ${dfrac('∭ ' + dv('z') + ' d' + dv('V'), '∭ d' + dv('V'))}`,
          'the same centre-of-mass integral as the probability wing\'s mean, one dimension up'),
        drvSay('the hard part is never the integration',
          'Once the limits are written down the rest is three single integrals a first-year student could do. Finding the limits is the whole problem, and it is a geometry problem rather than a calculus one: which surfaces bound the solid, in which order do they cut it, and where do two of them cross. That is why the reliable method is to sketch the solid and its shadow first and only then reach for a pen — and why a wrong answer here is almost always a wrong region rather than a wrong antiderivative.'),
        drvSay('and why a Monte Carlo check is worth having beside it',
          'Throwing points into a box and counting how many land inside asks only "is this point in the solid?" — it never looks at the limit functions at all. So it agrees with the iterated integral only if those limits describe the solid that was meant, which makes it an independent check on precisely the step that goes wrong. It converges as 1/√N, so expect three figures rather than eight: a disagreement in the fourth digit is the method, and one in the first is a wrong limit.')
      ],
      note:'Every volume here is checked against a closed form known independently — a tetrahedron, a sphere, a cylinder. A triple integral is easy to set up wrongly and hard to sanity-check by eye, so the comparison is the point rather than a formality.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.solid = o.solid || 'tetra';
    st.solKind = o.solKind || 'z';
    st.sys = o.sys || 'cart';
    st.slice = 0.4;
    st.n = 9;
    R.cam.az = 0.7; R.cam.el = 0.32; ctCamFit(2.8);
  },
  controls(){
    const st = ST, S = igSolidCur(st);
    const kind = igSolKind(st);
    return pkSeg('igTS', IG_SOLIDS, st.solid, e => e.name.split('  ')[0]) +
      (st.solid === 'custom'
        ? ctSeg('igTK', kind, [['z', 'z-simple'], ['cyl', 'cylindrical'], ['sph', 'spherical']])
        : '') +
      pkBoxes('igsol', st.solid, st, igSolSlots(st), igSolBounds(st),
        kind === 'cyl'
          ? 'A <b>cylindrical</b> solid: θ between the two numbers, r between two functions of θ (write ' +
            'the angle as <b>t</b>), and z between two functions of r and θ (written <b>r</b> and <b>t</b>). ' +
            'The defaults are a unit cylinder of height 2. Try an inner radius of <b>0.5</b> for a pipe, or ' +
            'z up to <b>r</b> for a cone standing on its point.'
          : kind === 'sph'
          ? 'A <b>spherical</b> solid: θ between the two numbers, φ between two functions of θ (write the ' +
            'angle as <b>t</b>), and ρ between two functions of φ and θ (written <b>phi</b> and <b>t</b>). ' +
            'The defaults are an ice-cream cone — a ball capped at φ ≤ π/4. Set φ up to <b>pi</b> for the ' +
            'whole ball, or ρ from <b>1</b> to <b>2</b> for a shell.'
          : 'A <b>z-simple</b> solid: x between the two numbers, y between two functions of x, z between two ' +
            'functions of x and y. Use <b>max(0, ...)</b> and <b>min</b> to keep a square root real. Try a ' +
            'cone with z from <b>sqrt(x^2 + y^2)</b> up to <b>2</b>. A solid whose shadow is not a Type I ' +
            'region has no description of this shape at all — that is what the other two kinds are for.') +
      (S.sph || S.cyl ? '' : ctSeg('igTC', st.sys, [['cart', 'Cartesian  dz dy dx'], ['cyl', 'cylindrical  r dz dr dθ']])) +
      ctlRow('cross-section', ctlSlider('igTz', 0, 1, 0.005, st.slice)) +
      ctlRow('slices drawn', ctlSlider('igTn', 3, 24, 1, st.n)) +
      `<p class="help"><b>${S.name}</b> — ${S.note}</p>
      <p class="help">The triple integral is set up by peeling the solid one variable at a time.
      The innermost variable runs between two <i>surfaces</i>; the middle one between two <i>curves</i>
      in the shadow the solid casts on a coordinate plane; the outer one between two <i>numbers</i>. Get
      that hierarchy right and the rest is bookkeeping. The horizontal slices drawn here are what the
      inner two integrals produce, one per value of the outer variable.</p>
      <p class="help">Setting f = 1 gives the volume, which is how the panel checks itself: every solid
      here has a known volume, and the nested quadrature reproduces it.</p>`;
  },
  wire(){
    /* IG_SOLIDS has no custom entry, so the branch that decides which coordinate
       system a solid needs has to ask the accessor rather than the table */
    pkWire('igTS', 'igsol', ST.solid, ST, igSolSlots(ST), igSolBounds(ST),
      v => { ST.solid = v; },
      () => { if(igSolidCur(ST).sph) ST.sys = 'sph'; else if(ST.sys === 'sph') ST.sys = 'cart'; });
    ctWireSeg('igTK', v => { ST.solKind = v;
      const S = igSolidCur(ST);
      ST.sys = S.sph ? 'sph' : S.cyl ? 'cyl' : 'cart';
      buildStagePanel(); });
    ctWireSeg('igTC', v => { ST.sys = v; });
    wireSlider('igTz', () => ST.slice, v => { ST.slice = v; }, v => fmtNum(+v, 3));
    wireSlider('igTn', () => ST.n, v => { ST.n = Math.round(v); }, v => String(Math.round(v)));
  },
  /* membership test for each solid, used to draw the slices */
  inSolid(st, x, y, z){
    const S = igSolidCur(st);
    /* a typed curvilinear solid brings its own membership test, because the
       preset one assumes the inner radius is zero and φ starts at the pole */
    if(S.inside) return S.inside(x, y, z);
    if(S.sph){
      const sp = gaToSph(x, y, z);
      return sp.rho <= S.sph.r1(sp.ph, sp.th) + 1e-9 && sp.ph <= S.sph.p1(sp.th) + 1e-9;
    }
    if(S.region){
      const Rg = IG_REGIONS[S.region];
      return igInRegion(Rg, x, y) && z >= S.zLo(x, y) - 1e-9 && z <= S.zHi(x, y) + 1e-9;
    }
    if(x < S.x0 - 1e-9 || x > S.x1 + 1e-9) return false;
    const lo = S.yLo(x), hi = S.yHi(x);
    if(y < lo - 1e-9 || y > hi + 1e-9) return false;
    return z >= S.zLo(x, y) - 1e-9 && z <= S.zHi(x, y) + 1e-9;
  },
  bounds(st){
    const S = igSolidCur(st);
    /* a typed solid measured its own box off its own boundary */
    if(S.inside) return { x0:S.x0, x1:S.x1, y0:S.y0, y1:S.y1, z0:S.z0, z1:S.z1 };
    if(S.sph){ const r = S.sph.r1(0, 0); return { x0:-r, x1:r, y0:-r, y1:r, z0:-r, z1:r }; }
    if(S.region){ const Rg = IG_REGIONS[S.region]; return { x0:Rg.x0, x1:Rg.x1, y0:Rg.y0, y1:Rg.y1, z0:0, z1:3 }; }
    let z0 = Infinity, z1 = -Infinity;
    for(let i = 0; i <= 20; i++) for(let j = 0; j <= 20; j++){
      const x = S.x0 + (S.x1 - S.x0) * i / 20, y = S.yLo(x) + (S.yHi(x) - S.yLo(x)) * j / 20;
      z0 = Math.min(z0, S.zLo(x, y)); z1 = Math.max(z1, S.zHi(x, y));
    }
    return { x0:S.x0, x1:S.x1, y0:-Math.abs(S.x1), y1:Math.abs(S.x1), z0, z1 };
  },
  frame(st, dt, ctx, W, H){
    const B = this.bounds(st);
    const span = Math.max(B.x1 - B.x0, B.y1 - B.y0, B.z1 - B.z0);
    const sc = 4 / span;
    const cx = (B.x0 + B.x1) / 2, cy = (B.y0 + B.y1) / 2, cz = (B.z0 + B.z1) / 2;
    R.mode2d = false; R.extent = 2.8; R.begin();
    em3dAxes(2.2);
    /* horizontal cross-sections, traced by testing membership */
    for(let k = 0; k < st.n; k++){
      const z = B.z0 + (B.z1 - B.z0) * (k + 0.5) / st.n;
      const ring = this.traceSlice(st, z, B);
      if(ring.length > 2)
        R.path(ring.map(p => v3((p.x - cx) * sc, (p.y - cy) * sc, (z - cz) * sc)),
               rgbCss(rampSeq(k / st.n), 0.9), 1.6, 0.8);
    }
    /* the one highlighted slice, filled */
    const zs = B.z0 + (B.z1 - B.z0) * st.slice;
    const hi = this.traceSlice(st, zs, B);
    if(hi.length > 2){
      R.poly(hi.map(p => v3((p.x - cx) * sc, (p.y - cy) * sc, (zs - cz) * sc)),
             rgbCss(TH.warn, 0.35), rgbCss(TH.warn), 2.4, 0.95);
    }
    R.flush();
    em3dCaption(ctx, W, H, igSolidCur(st).name,
      'each ring is one cross-section — the inner two integrals compute its area, the outer one stacks them');
  },
  /* the boundary of the solid at height z, found by ray-casting from the centre */
  traceSlice(st, z, B){
    const out = [];
    const N = 90;
    const rmax = Math.max(B.x1 - B.x0, B.y1 - B.y0);
    for(let i = 0; i <= N; i++){
      const th = i / N * 6.2832;
      let lo = 0, hi = rmax;
      if(!this.inSolid(st, (B.x0 + B.x1) / 2, (B.y0 + B.y1) / 2, z)){
        /* the centre is outside: scan outwards for the first hit instead */
        let found = -1;
        for(let s = 0; s <= 80; s++){
          const r = rmax * s / 80;
          if(this.inSolid(st, (B.x0 + B.x1) / 2 + r * Math.cos(th), (B.y0 + B.y1) / 2 + r * Math.sin(th), z)){ found = r; break; }
        }
        if(found < 0) return [];
        lo = found;
      }
      for(let it = 0; it < 26; it++){
        const m = (lo + hi) / 2;
        if(this.inSolid(st, (B.x0 + B.x1) / 2 + m * Math.cos(th), (B.y0 + B.y1) / 2 + m * Math.sin(th), z)) lo = m; else hi = m;
      }
      out.push({ x:(B.x0 + B.x1) / 2 + lo * Math.cos(th), y:(B.y0 + B.y1) / 2 + lo * Math.sin(th) });
    }
    return out;
  },
  volume(st){
    const S = igSolidCur(st);
    if(S.cyl) return nqTripleCyl(() => 1, S.cyl.t0, S.cyl.t1, S.cyl.r0, S.cyl.r1, S.cyl.zLo, S.cyl.zHi, 5, 8);
    if(S.sph) return nqTripleSph(() => 1, S.sph.t0, S.sph.t1, S.sph.p0, S.sph.p1, S.sph.r0, S.sph.r1, 5, 8);
    /* THE SHADOW, RESOLVED ONCE, because the two routes below must agree about
       what it is. A solid either carries its own x/y limits or names a region
       that holds them — and the cylindrical branch read S.x0/S.yLo directly, so
       for every region-based solid it saw `undefined` and returned NaN. The box
       is region-based, and its volume in cylindrical coordinates was NaN: the
       panel printed "—" through fmtNum and nothing else noticed, because the
       literal word never appears and `runall`'s NaN grep looks for the word. */
    const Rg = S.region ? IG_REGIONS[S.region] : S;
    const sx0 = Rg.x0, sx1 = Rg.x1, syLo = Rg.yLo, syHi = Rg.yHi;
    if(st.sys === 'cyl'){
      /* the same solid in cylindrical coordinates, where the limits are simpler */
      /* THE DISC MUST CONTAIN THE SHADOW, AND THE CLIP MUST TEST BOTH
         COORDINATES.

         This route sweeps a full disc and zeroes the slab thickness outside the
         solid's shadow, which is how a solid with no native cylindrical
         description still gets integrated in r dz dr dθ. It tested only y
         against yLo/yHi and never x against the solid's own range — and for the
         tetrahedron x+y+z ≤ 1 the upper limit yHi(x) = 1 − x GROWS as x goes
         negative, so every point of the disc with x < 0 passed the shadow test
         and was integrated as solid. The volume came out near 0.95 against an
         exact 1/6, and the reader could reach it: the Cartesian/cylindrical
         switch is offered for every solid that does not declare its own S.cyl.

         rmax likewise has to cover the shadow in BOTH directions — a solid one
         unit wide in x and three deep in y would otherwise be sliced off by the
         disc — so the y extent is sampled rather than assumed. */
      let rmax = Math.max(Math.abs(sx0), Math.abs(sx1));
      if(syLo) for(let i = 0; i <= 32; i++){
        const x = sx0 + (sx1 - sx0) * i / 32;
        rmax = Math.max(rmax, Math.hypot(x, syLo(x)), Math.hypot(x, syHi(x)));
      }
      return nqTripleCyl(() => 1, 0, 2 * Math.PI, () => 0, () => rmax,
        (r, th) => S.zLo(r * Math.cos(th), r * Math.sin(th)),
        (r, th) => {
          const x = r * Math.cos(th), y = r * Math.sin(th);
          const hi = S.zHi(x, y), lo = S.zLo(x, y);
          /* clip to the solid's shadow: outside it the slab has zero thickness */
          const outX = x < sx0 - 1e-9 || x > sx1 + 1e-9;
          const outY = syLo && (y < syLo(x) - 1e-9 || y > syHi(x) + 1e-9);
          return (outX || outY) ? lo : Math.max(lo, hi);
        }, 5, 8);
    }
    return nqTriple(() => 1, sx0, sx1, syLo, syHi, S.zLo, S.zHi, 5, 8);
  },
  readout(st){
    const S = igSolidCur(st);
    const V = this.volume(st);
    const B = this.bounds(st);
    const zs = B.z0 + (B.z1 - B.z0) * st.slice;
    /* the area of the highlighted cross-section, by the shoelace formula */
    const ring = this.traceSlice(st, zs, B);
    let A = 0;
    for(let i = 0; i < ring.length - 1; i++) A += ring[i].x * ring[i + 1].y - ring[i + 1].x * ring[i].y;
    A = Math.abs(A) / 2;
    /* the moment of the solid — its centroid height, another triple integral */
    const zbar = S.cyl
      ? nqTripleCyl((x, y, z) => z, S.cyl.t0, S.cyl.t1, S.cyl.r0, S.cyl.r1, S.cyl.zLo, S.cyl.zHi, 5, 8) / V
      : S.sph
      ? nqTripleSph((x, y, z) => z, S.sph.t0, S.sph.t1, S.sph.p0, S.sph.p1, S.sph.r0, S.sph.r1, 5, 8) / V
      : (S.region
          ? nqTriple((x, y, z) => z, IG_REGIONS[S.region].x0, IG_REGIONS[S.region].x1,
              IG_REGIONS[S.region].yLo, IG_REGIONS[S.region].yHi, S.zLo, S.zHi, 5, 8) / V
          : nqTriple((x, y, z) => z, S.x0, S.x1, S.yLo, S.yHi, S.zLo, S.zHi, 5, 8) / V);
    return `<div class="card tight"><div class="ttl">${S.name}</div>
      ${kv('coordinate system', S.sph ? 'spherical — ρ² sin φ dρ dφ dθ' : (S.cyl || st.sys === 'cyl') ? 'cylindrical — r dz dr dθ' : 'Cartesian — dz dy dx')}
      ${kv('V = ∭ 1 dV, computed', fmtNum(V, 8))}
      ${kv(S.exactLabel || 'the known volume', fmtNum(S.exactVol, S.exactLabel ? 5 : 8))}
      ${kv('difference', fmtAgree(V, S.exactVol))}
    </div>
    <div class="card tight"><div class="ttl">The highlighted cross-section</div>
      ${kv('at height z =', fmtNum(zs, 5))}
      ${kv('its area, traced and measured', fmtNum(A, 6))}
      <p class="help">The inner two integrals compute exactly this number for each z, and the outer one
      integrates it. That is why "volume by cross-sections" from single-variable calculus and the triple
      integral are the same calculation — the triple integral simply refuses to assume you already know the
      area of a slice.</p>
    </div>
    <div class="card tight"><div class="ttl">A moment, for practice</div>
      ${kv('∭ z dV', fmtNum(zbar * V, 7))}
      ${kv('centroid height z̄ = (∭z dV)/V', fmtNum(zbar, 7))}
      <p class="help">Change the integrand and the same machinery answers a different question: mass for a
      density, a moment for a weighted coordinate, a moment of inertia for a squared distance. The limits
      are the hard part and they never change.</p>
    </div>`;
  },
  chip(st){
    return `<div class="k">${igSolidCur(st).name.split('  ')[0]}</div>
      <div style="color:var(--c-grad)">V = ${fmtNum(this.volume(st), 6)}</div>`;
  },
  legend(){ return [['var(--c-warn)', 'the highlighted cross-section'], ['var(--c-grad)', 'the stack of slices']]; }
};

/* ---- 8 · cylindrical and spherical triple integrals ----------------------- */
STAGES.igCylSph = {
  title:'Cylindrical & spherical integrals',
  derive(st){
    const n = v => fmtNum(v, 8);
    return {
      title:'Where r dz dr dθ and ρ² sin φ dρ dφ dθ come from',
      steps:[
        drvSay('the same lesson as polar, with more room to go wrong',
          'A curvilinear cell is not a box, and its volume depends on where it sits. In cylindrical coordinates one factor appears; in spherical, two. Both are geometric facts about how far the cell is from the axes it wraps around.'),
        drvStep('cylindrical: only the angular direction is stretched',
          `d${dv('V')} ${dop('=')} ${dv('r')} d${dv('z')} d${dv('r')} dθ`,
          'z is untouched, so this is polar area times a height'),
        drvStep('spherical: two directions are stretched, by different amounts',
          `d${dv('V')} ${dop('=')} ρ² sin φ dρ dφ dθ`,
          `the panel sums the exact cell volumes and compares with 4πρ³/3 = ${n(4 * Math.PI * Math.pow(st.rho, 3) / 3)}`),
        drvSay('take the two factors apart, because they mean different things',
          'The ρ² is the area of the spherical shell growing as the square of the radius — the same factor that makes an inverse-square law inverse-square. The sin φ is the shrinking of circles of latitude towards the poles: at the equator a cell of given angular width is at its widest, and at the pole it degenerates to nothing.'),
        drvStep('which the panel measures rather than asserts',
          `${dfrac('cell at the equator', 'the same cell at the pole')} ${dop('=')} ${dfrac('sin φ_eq', 'sin φ_pole')}`,
          'the ratio of the two cell volumes is printed, and it is the ratio of the sines'),
        drvSay('why the average of sin φ matters more than its value anywhere',
          'Integrating sin φ from 0 to π gives 2, not π. That is why the total solid angle is 4π rather than 2π², and why sampling directions uniformly on a sphere requires sampling cos φ uniformly rather than φ. Getting this wrong clusters points at the poles, which is one of the most common bugs in Monte Carlo simulation.'),
        drvStep('the payoff: a hard Cartesian integral becomes trivial',
          `∭ (${dv('x')}²{+}${dv('y')}²{+}${dv('z')}²) d${dv('V')} ${dop('=')} ∭ ρ² ${dop('·')} ρ² sin φ dρ dφ dθ`,
          `closed form 4πρ⁵/5 = ${n(4 * Math.PI * Math.pow(st.rho, 5) / 5)}, and the panel matches it numerically`),
        drvSay('and the moment of inertia falls out as a special case',
          'For a cylinder, ∭(x² + y²)dV is πr⁴h/2, which is ½MR² once the mass is folded in — the standard result of the rotation wing, obtained here by integration rather than quoted from a table.')
      ],
      note:'The cell volumes summed by the panel are exact — differences of spherical shells and sectors, not the infinitesimal formula. That they converge to 4πρ³/3 as the grid refines is what justifies the infinitesimal form, rather than the other way round.'
    };
  },
  mode:'3d',
  enter(st, o){
    st.sys = o.sys || 'sph';
    st.nr = 5; st.np = 6; st.nt = 10;
    st.rho = 2;
    R.cam.az = 0.72; R.cam.el = 0.3; ctCamFit(3);
  },
  controls(){
    const st = ST;
    return ctSeg('igCS', st.sys, [['cyl', 'cylindrical'], ['sph', 'spherical']]) +
      ctlRow('outer radius', ctlSlider('igCrho', 0.8, 3, 0.05, st.rho)) +
      ctlRow(st.sys === 'sph' ? 'ρ divisions' : 'r divisions', ctlSlider('igCnr', 2, 12, 1, st.nr)) +
      (st.sys === 'sph' ? ctlRow('φ divisions', ctlSlider('igCnp', 2, 14, 1, st.np)) : '') +
      ctlRow('θ divisions', ctlSlider('igCnt', 3, 24, 1, st.nt)) +
      `<p class="help">${st.sys === 'sph'
        ? 'The spherical volume element is <b>ρ² sin φ dρ dφ dθ</b>, and both factors are visible in the drawn cells. The <b>ρ²</b> is the same growth as in polar coordinates, one dimension up: a shell twice as far out has four times the area. The <b>sin φ</b> is the shrinking of the θ-circles as you approach the poles — at φ = 0 a full turn in θ moves you nowhere at all, so cells there have no volume.'
        : 'The cylindrical element is <b>r dz dr dθ</b> — the polar element in the plane, with z carried along unchanged. Nothing new happens in the vertical direction, which is exactly why the system suits anything with an axis.'}</p>
      <p class="help">Each drawn cell is colour-coded by its <i>exact</i> volume, computed from the closed
      form for a spherical or cylindrical box. The panel adds them all up and compares the total with the
      volume of the region — a check that the element is right, at every resolution.</p>`;
  },
  wire(){
    ctWireSeg('igCS', v => { ST.sys = v; });
    wireSlider('igCrho', () => ST.rho, v => { ST.rho = v; }, v => fmtNum(+v, 3));
    wireSlider('igCnr', () => ST.nr, v => { ST.nr = Math.round(v); }, v => String(Math.round(v)));
    wireSlider('igCnp', () => ST.np, v => { ST.np = Math.round(v); }, v => String(Math.round(v)));
    wireSlider('igCnt', () => ST.nt, v => { ST.nt = Math.round(v); }, v => String(Math.round(v)));
  },
  frame(st, dt, ctx, W, H){
    const L = 3, sc = 2.4 / st.rho;
    R.mode2d = false; R.extent = 3; R.begin();
    em3dAxes(2.4);
    if(st.sys === 'sph'){
      const dr = st.rho / st.nr, dp = Math.PI / st.np, dth = 2 * Math.PI / st.nt;
      let maxV = 0;
      for(let i = 0; i < st.nr; i++) for(let j = 0; j < st.np; j++){
        const V = (Math.pow((i + 1) * dr, 3) - Math.pow(i * dr, 3)) / 3 *
                  (Math.cos(j * dp) - Math.cos((j + 1) * dp)) * dth;
        maxV = Math.max(maxV, V);
      }
      /* draw only the front half so the interior is visible */
      for(let i = 0; i < st.nr; i++) for(let j = 0; j < st.np; j++) for(let k = 0; k < st.nt; k++){
        const th = k * dth;
        if(th > Math.PI * 0.9 && th < Math.PI * 1.9) continue;
        const r0 = i * dr, r1 = r0 + dr, p0 = j * dp, p1 = p0 + dp, t1 = th + dth;
        const V = (r1 * r1 * r1 - r0 * r0 * r0) / 3 * (Math.cos(p0) - Math.cos(p1)) * dth;
        const col = rgbCss(rampSeq(V / maxV), 0.85);
        const c = (rr, pp, tt) => vmul(gaFromSph(rr, pp, tt), sc);
        R.poly([c(r1, p0, th), c(r1, p1, th), c(r1, p1, t1), c(r1, p0, t1)], col, rgbCss(TH.bg, 0.4), 0.5, 0.9);
      }
      /* the three coordinate surfaces through one cell, emphasised */
      const c = (rr, pp, tt) => vmul(gaFromSph(rr, pp, tt), sc);
      const i0 = st.nr - 1, j0 = Math.floor(st.np / 2), k0 = 0;
      const r0 = i0 * dr, r1 = r0 + dr, p0 = j0 * dp, p1 = p0 + dp, t0 = k0 * dth, t1 = t0 + dth;
      for(const [A, B] of [[c(r0, p0, t0), c(r1, p0, t0)], [c(r0, p1, t0), c(r1, p1, t0)],
                            [c(r0, p0, t1), c(r1, p0, t1)], [c(r0, p1, t1), c(r1, p1, t1)]])
        R.line(A, B, rgbCss(TH.warn), 2.4, 1);
    } else {
      const dr = st.rho / st.nr, dz = 2 * st.rho / st.nr, dth = 2 * Math.PI / st.nt;
      let maxV = 0;
      for(let i = 0; i < st.nr; i++) maxV = Math.max(maxV, 0.5 * (Math.pow((i + 1) * dr, 2) - Math.pow(i * dr, 2)) * dth * dz);
      for(let i = 0; i < st.nr; i++) for(let k = 0; k < st.nt; k++) for(let m = 0; m < 3; m++){
        const th = k * dth;
        if(th > Math.PI * 0.9 && th < Math.PI * 1.9) continue;
        const r0 = i * dr, r1 = r0 + dr, t1 = th + dth;
        const z0 = (m - 1.5) * dz * 0.6, z1 = z0 + dz * 0.6;
        const V = 0.5 * (r1 * r1 - r0 * r0) * dth * (z1 - z0);
        const col = rgbCss(rampSeq(V / maxV), 0.85);
        const c = (rr, tt, zz) => vmul(gaFromCyl(rr, tt, zz), sc);
        R.poly([c(r1, th, z0), c(r1, t1, z0), c(r1, t1, z1), c(r1, th, z1)], col, rgbCss(TH.bg, 0.4), 0.5, 0.9);
        R.poly([c(r0, th, z1), c(r1, th, z1), c(r1, t1, z1), c(r0, t1, z1)], col, rgbCss(TH.bg, 0.3), 0.4, 0.6);
      }
    }
    R.flush();
    em3dCaption(ctx, W, H,
      st.sys === 'sph' ? 'dV = ρ² sin φ dρ dφ dθ — cells shrink to nothing at the poles'
                       : 'dV = r dz dr dθ — the polar element, extruded',
      'colour is each cell\'s exact volume · drag to orbit');
  },
  readout(st){
    if(st.sys === 'sph'){
      const dr = st.rho / st.nr, dp = Math.PI / st.np, dth = 2 * Math.PI / st.nt;
      let total = 0;
      for(let i = 0; i < st.nr; i++) for(let j = 0; j < st.np; j++)
        total += st.nt * (Math.pow((i + 1) * dr, 3) - Math.pow(i * dr, 3)) / 3 *
                 (Math.cos(j * dp) - Math.cos((j + 1) * dp)) * dth;
      const exact = 4 * Math.PI * Math.pow(st.rho, 3) / 3;
      const eq = (Math.pow(st.rho, 3) - Math.pow(st.rho * (st.nr - 1) / st.nr, 3)) / 3 *
                 (Math.cos(Math.PI / 2 - dp / 2) - Math.cos(Math.PI / 2 + dp / 2)) * dth;
      const pole = (Math.pow(st.rho, 3) - Math.pow(st.rho * (st.nr - 1) / st.nr, 3)) / 3 *
                   (1 - Math.cos(dp)) * dth;
      const shell = nqTripleSph(() => 1, 0, 2 * Math.PI, () => 0, () => Math.PI, () => 0, () => st.rho, 5, 8);
      const ball = nqTripleSph((x, y, z) => x * x + y * y + z * z, 0, 2 * Math.PI, () => 0, () => Math.PI, () => 0, () => st.rho, 5, 8);
      return `<div class="card tight"><div class="ttl">The cells add up to the ball</div>
        ${kv('cells', `${st.nr} × ${st.np} × ${st.nt} = ${st.nr * st.np * st.nt}`)}
        ${kv('Σ of exact cell volumes', fmtNum(total, 8))}
        ${kv('4πρ³/3', fmtNum(exact, 8))}
        ${kv('difference', fmtAgree(total, exact))}
        ${kv('by nested quadrature', fmtNum(shell, 8))}
      </div>
      <div class="card tight"><div class="ttl">The sin φ, in numbers</div>
        ${kv('outer cell at the equator', fmtNum(eq, 7))}
        ${kv('the same cell at the pole', fmtNum(pole, 7))}
        ${kv('their ratio', fmtNum(eq / (pole || 1e-30), 5))}
        ${kv('sin φ at the equator', '1')}
        ${kv('average sin φ over the polar cap', fmtNum((1 - Math.cos(dp)) / dp, 5))}
        <p class="help">Same Δρ, same Δφ, same Δθ — wildly different volumes, because the θ-circle at
        colatitude φ has radius ρ sin φ. Forgetting the sin φ over-counts the poles enormously, and it is
        the single most common error in spherical integration.</p>
      </div>
      <div class="card tight"><div class="ttl">Two integrals over the ball</div>
        ${kv('∭ 1 dV', fmtNum(shell, 8))}
        ${kv('∭ (x²+y²+z²) dV = ∭ ρ²·ρ²sinφ', fmtNum(ball, 8))}
        ${kv('the closed form 4πρ⁵/5', fmtNum(4 * Math.PI * Math.pow(st.rho, 5) / 5, 8))}
        <p class="help">The second integral is the moment of inertia of a solid ball about its centre —
        and in spherical coordinates it is a one-line monomial integral. In Cartesian coordinates it takes
        two square-root limits and a page of algebra.</p>
      </div>`;
    }
    const dr = st.rho / st.nr, dth = 2 * Math.PI / st.nt, hgt = 2;
    const V = nqTripleCyl(() => 1, 0, 2 * Math.PI, () => 0, () => st.rho, () => 0, () => hgt, 5, 8);
    const Iz = nqTripleCyl((x, y) => x * x + y * y, 0, 2 * Math.PI, () => 0, () => st.rho, () => 0, () => hgt, 5, 8);
    const inner = 0.5 * (dr * dr) * dth * (hgt / 4);
    const outer = 0.5 * (st.rho * st.rho - Math.pow(st.rho - dr, 2)) * dth * (hgt / 4);
    return `<div class="card tight"><div class="ttl">The cylinder r ≤ ${fmtNum(st.rho, 3)}, 0 ≤ z ≤ 2</div>
      ${kv('∭ r dz dr dθ', fmtNum(V, 8))}
      ${kv('πr²h', fmtNum(Math.PI * st.rho * st.rho * hgt, 8))}
      ${kv('difference', fmtAgree(V, Math.PI * st.rho * st.rho * hgt))}
    </div>
    <div class="card tight"><div class="ttl">The r, in numbers</div>
      ${kv('innermost cell volume', fmtNum(inner, 7))}
      ${kv('outermost cell volume', fmtNum(outer, 7))}
      ${kv('their ratio', fmtNum(outer / (inner || 1e-30), 5))}
      ${kv('ratio of their mean radii', fmtNum((st.rho - dr / 2) / (dr / 2), 5))}
      <p class="help">The two ratios agree, which is the r doing its work: cell volume grows in direct
      proportion to distance from the axis, and that is the whole of the cylindrical Jacobian.</p>
    </div>
    <div class="card tight"><div class="ttl">Moment of inertia about the axis</div>
      ${kv('∭ (x²+y²) dV = ∭ r²·r dz dr dθ', fmtNum(Iz, 8))}
      ${kv('the closed form πr⁴h/2', fmtNum(Math.PI * Math.pow(st.rho, 4) * hgt / 2, 8))}
      ${kv('as ½MR² with M = V', fmtNum(0.5 * V * st.rho * st.rho, 8))}
      <p class="help">The last row is the textbook formula for a solid cylinder, and it drops out of the
      integral rather than being quoted. Note the r appearing twice for different reasons: once as the
      distance squared in the integrand, once as the Jacobian.</p>
    </div>`;
  },
  chip(st){ return `<div class="k">${st.sys === 'sph' ? 'ρ² sin φ' : 'r'}</div>
    <div style="color:var(--c-grad)">${st.sys === 'sph' ? st.nr * st.np * st.nt : st.nr * st.nt * 3} cells</div>`; },
  legend(){ return [['var(--c-grad)', 'cell volume'], ['var(--c-warn)', 'one cell, picked out']]; }
};

/* ---- 9 · mass, centre of mass and moments of inertia ---------------------- */
