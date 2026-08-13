/* ============================================================================
   3 · FIELD MODEL — vector algebra, the derived operators, and the numeric
   integrators used to check the symbolic answers against their definitions.
   ============================================================================ */

const AX = ['x','y','z'];

/* ---- an expression paired with its compiled closure ---- */
function mk(ast){ return {ast, ev:compile(ast), numeric:false}; }
function mkNumeric(ev){ return {ast:null, ev, numeric:true}; }
const ZERO = () => mk(N(0));

/* partial derivative with graceful degradation to central differences */
function partial(entry, axis){
  if(entry.ast){
    try { return mk(diff(entry.ast, axis)); }
    catch(e){ if(!(e instanceof NonDifferentiable)) throw e; }
  }
  return mkNumeric(numericPartial(entry.ev, axis));
}

/* ----------------------------------------------------------------------------
   buildField — scalar mode is deliberately implemented as the vector field
   F = ∇f. Divergence then *is* the Laplacian and curl *is* identically zero,
   which is exactly the mathematics rather than a special case bolted on.
   ---------------------------------------------------------------------------- */
function buildField(mode, src){
  const F = {mode, src:{...src}, f:null, grad:null, laplacian:null, hess:null};

  let comps;
  if(mode === 'scalar'){
    const f = mk(parse(src.f));
    F.f = f;
    F.grad = AX.map(a => partial(f, a));
    comps = F.grad;
    F.hess = F.grad.map(g => AX.map(j => partial(g, j)));   // H[i][j] = ∂²f/∂xⱼ∂xᵢ
  } else {
    comps = [mk(parse(src.P)), mk(parse(src.Q)), mk(parse(src.R))];
  }
  F.P = comps[0]; F.Q = comps[1]; F.R = comps[2];
  F.comps = comps;

  /* Jacobian J[i][j] = ∂Fᵢ/∂xⱼ */
  F.J = comps.map(c => AX.map(a => partial(c, a)));

  /* ∇·F = ∂P/∂x + ∂Q/∂y + ∂R/∂z  — the trace of J */
  const dAst = (F.J[0][0].ast && F.J[1][1].ast && F.J[2][2].ast)
    ? norm(add(add(F.J[0][0].ast, F.J[1][1].ast), F.J[2][2].ast)) : null;
  F.div = dAst ? mk(dAst)
    : mkNumeric((x,y,z)=>F.J[0][0].ev(x,y,z)+F.J[1][1].ev(x,y,z)+F.J[2][2].ev(x,y,z));
  if(mode === 'scalar') F.laplacian = F.div;

  /* ∇×F = (R_y − Q_z, P_z − R_x, Q_x − P_y) */
  const pairs = [[2,1,1,2],[0,2,2,0],[1,0,0,1]];   // curl_i = J[i][j] − J[k][l]
  F.curl = pairs.map(([i,j,k,l])=>{
    const A=F.J[i][j], B=F.J[k][l];
    return (A.ast && B.ast) ? mk(norm(sub(A.ast, B.ast)))
                            : mkNumeric((x,y,z)=>A.ev(x,y,z)-B.ev(x,y,z));
  });

  /* ---- the honest two-dimensional operators ----
     Restricted to the plane, divergence drops the ∂R/∂z term and curl keeps only
     its ẑ-component, which is then a *scalar*. These are not approximations of
     the 3D operators — they are what the 3D definitions become in the plane. */
  const d2 = (F.J[0][0].ast && F.J[1][1].ast) ? norm(add(F.J[0][0].ast, F.J[1][1].ast)) : null;
  F.div2 = d2 ? mk(d2) : mkNumeric((x,y,z)=>F.J[0][0].ev(x,y,z)+F.J[1][1].ev(x,y,z));
  const c2 = (F.J[1][0].ast && F.J[0][1].ast) ? norm(sub(F.J[1][0].ast, F.J[0][1].ast)) : null;
  F.curl2 = c2 ? mk(c2) : mkNumeric((x,y,z)=>F.J[1][0].ev(x,y,z)-F.J[0][1].ev(x,y,z));

  /* a field that mentions t re-renders as the clock advances */
  F.animated = (F.f && F.f.ast && dependsOn(F.f.ast,'t')) ||
               comps.some(c => c.ast && dependsOn(c.ast, 't'));

  /* fast un-boxed samplers used by the render loop */
  const p=F.P.ev, q=F.Q.ev, r=F.R.ev;
  F.at   = (x,y,z)=>v3(p(x,y,z), q(x,y,z), r(x,y,z));
  F.curlAt = (x,y,z)=>v3(F.curl[0].ev(x,y,z), F.curl[1].ev(x,y,z), F.curl[2].ev(x,y,z));
  F.divAt  = F.div.ev;
  F.finiteAt = (x,y,z)=>{ const a=p(x,y,z),b=q(x,y,z),c=r(x,y,z);
    return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(c); };
  return F;
}

/* how the vector field should be named in the UI for the current mode */
const fieldLabel = F => F.mode==='scalar' ? '∇f' : 'F';

/* ---- Jacobian numerics: strain (symmetric) and rotation (antisymmetric) ---- */
function jacobianAt(F,x,y,z){
  const M=[[0,0,0],[0,0,0],[0,0,0]];
  for(let i=0;i<3;i++) for(let j=0;j<3;j++) M[i][j]=F.J[i][j].ev(x,y,z);
  return M;
}
const symPart  = M => M.map((r,i)=>r.map((_,j)=>(M[i][j]+M[j][i])/2));
const skewPart = M => M.map((r,i)=>r.map((_,j)=>(M[i][j]-M[j][i])/2));

/* ============================================================================
   Numeric integrators. These never consult the symbolic derivatives, so
   comparing them against div/curl is a genuine independent check of both.
   ============================================================================ */

/* Φ = ∯ F·n̂ dS over a cube of half-side h, plus the per-face breakdown. */
function fluxBox(F, c, h, m){
  const step = 2*h/m, dA = step*step;
  const faces = [];
  let total = 0;
  for(let axis=0; axis<3; axis++){
    for(const s of [-1, 1]){
      const n = v3(axis===0?s:0, axis===1?s:0, axis===2?s:0);
      let sum = 0;
      for(let i=0;i<m;i++) for(let j=0;j<m;j++){
        const u = -h + (i+0.5)*step, v = -h + (j+0.5)*step;
        let p;
        if(axis===0)      p = v3(c.x + s*h, c.y+u, c.z+v);
        else if(axis===1) p = v3(c.x+u, c.y + s*h, c.z+v);
        else              p = v3(c.x+u, c.y+v, c.z + s*h);
        const Fv = F.at(p.x,p.y,p.z);
        const d = vdot(Fv, n);
        if(Number.isFinite(d)) sum += d * dA;
      }
      faces.push({axis, s, n, flux:sum});
      total += sum;
    }
  }
  return {total, faces, volume:8*h*h*h, area:24*h*h};
}

/* The plane version: flux across the four EDGES of a square, per unit AREA.
   The surface integral becomes a line integral and the volume becomes an area —
   this is the 2D divergence, and half of Green's theorem. */
function fluxRect(F, c, h, m){
  const step = 2*h/m, dL = step;      // "dS" is now arc length
  const faces = [];
  let total = 0;
  for(let axis=0; axis<2; axis++){
    for(const s of [-1, 1]){
      const n = v3(axis===0?s:0, axis===1?s:0, 0);
      let sum = 0;
      for(let i=0;i<m;i++){
        const u = -h + (i+0.5)*step;
        const p = axis===0 ? v3(c.x + s*h, c.y+u, 0) : v3(c.x+u, c.y + s*h, 0);
        const d = vdot(F.at(p.x,p.y,0), n);
        if(Number.isFinite(d)) sum += d * dL;
      }
      faces.push({axis, s, n, flux:sum});
      total += sum;
    }
  }
  return {total, faces, volume:4*h*h, area:8*h, planar:true};
}

/* Φ over a sphere of radius R — dS = R² sinθ dθ dφ */
function fluxSphere(F, c, R, m){
  const nT=m, nP=2*m, dT=Math.PI/nT, dP=2*Math.PI/nP;
  let total=0; const samples=[];
  for(let i=0;i<nT;i++){
    const th=(i+0.5)*dT, st=Math.sin(th), ct=Math.cos(th);
    for(let j=0;j<nP;j++){
      const ph=(j+0.5)*dP;
      const n = v3(st*Math.cos(ph), st*Math.sin(ph), ct);
      const p = vadd(c, vmul(n,R));
      const d = vdot(F.at(p.x,p.y,p.z), n);
      const dS = R*R*st*dT*dP;
      if(Number.isFinite(d)){ total += d*dS; samples.push({p, n, v:d}); }
    }
  }
  return {total, samples, volume:(4/3)*Math.PI*R*R*R, area:4*Math.PI*R*R};
}

/* Γ = ∮ F·T̂ ds around a circle of radius R with unit normal n̂ (right-hand rule) */
function circulation(F, c, R, n, m){
  const u = vperp(n), v = vcross(n, u);      // {u, v, n} right-handed
  const dth = 2*Math.PI/m;
  let total = 0; const samples = [];
  for(let i=0;i<m;i++){
    const th = (i+0.5)*dth, ct=Math.cos(th), st=Math.sin(th);
    const p = vadd(c, vadd(vmul(u, R*ct), vmul(v, R*st)));
    const T = vadd(vmul(u,-st), vmul(v,ct));
    const Fv = F.at(p.x,p.y,p.z);
    const d = vdot(Fv, T);
    if(Number.isFinite(d)){ total += d * R * dth; samples.push({p, T, v:d, Fv}); }
  }
  return {total, samples, area:Math.PI*R*R, u, v};
}
/* ============================================================================
   3b · PHYSICS EXPRESSION WRITERS
   Each placeable object contributes an exact closed-form term; superposition
   is literal string addition. The generated formula is written into the
   ordinary field inputs, so every instrument, derivation and test downstream
   operates on physics fields exactly as it does on typed ones.
   ============================================================================ */

const num2s = v => {
  const s = parseFloat((+v).toPrecision(6));
  return Object.is(s, -0) ? '0' : String(s);
};
/* (x − a) with the sign folded in; plain axis name when a = 0 */
const shiftS = (ax, c) => Math.abs(c) < 1e-12 ? ax : (c > 0 ? `(${ax} - ${num2s(c)})` : `(${ax} + ${num2s(-c)})`);
/* join additive terms, folding "+ -k…" into "− k…" for readable formulas */
function smartJoin(terms){
  const T = terms.filter(s => s && s !== '0');
  if(!T.length) return '0';
  let out = T[0];
  for(let i=1;i<T.length;i++){
    const t = T[i];
    out += t.startsWith('-') ? ' - ' + t.slice(1) : ' + ' + t;
  }
  return out;
}

/* E of a point charge q at p — Coulomb, unit-free: q·(r−p)/|r−p|³ */
function physChargeExpr(q, p){
  const X=shiftS('x',p.x), Y=shiftS('y',p.y), Z=shiftS('z',p.z);
  const d3 = `(${X}^2 + ${Y}^2 + ${Z}^2)^1.5`;
  const k = num2s(q);
  const mk = c => q===0 ? '0' : (k==='1' ? `${c}/${d3}` : k==='-1' ? `-${c}/${d3}` : `${k}${c}/${d3}`);
  return { P: mk(X), Q: mk(Y), R: mk(Z) };
}
/* B of an infinite straight wire carrying I along +axis through p:
   B = I·φ̂/s, circling by the right-hand rule */
function physWireExpr(I, axis, p){
  const co = {P:'0', Q:'0', R:'0'};
  const A = ['x','y','z'], comp = ['P','Q','R'];
  const i = A.indexOf(axis), u = (i+1)%3, v = (i+2)%3;   // (axis, u, v) right-handed
  const U = shiftS(A[u], [p.x,p.y,p.z][u]), V = shiftS(A[v], [p.x,p.y,p.z][v]);
  const D = `(${U}^2 + ${V}^2)`;
  if(I!==0){
    const k = num2s(Math.abs(I));
    const pre = k==='1' ? '' : k;
    if(I>0){ co[comp[u]] = `-${pre}${V}/${D}`; co[comp[v]] = `${pre}${U}/${D}`; }
    else   { co[comp[u]] = `${pre}${V}/${D}`;  co[comp[v]] = `-${pre}${U}/${D}`; }
  }
  return co;
}
/* B of an ideal point dipole with moment m along +axis at p:
   (3(m·r̂)r̂ − m)/r³  →  components (3 m aᵢ w / r⁵) and (3w²/r⁵ − 1/r³)·m */
function physDipoleExpr(m, axis, p){
  const A=['x','y','z'], comp=['P','Q','R'];
  const S3=[shiftS('x',p.x), shiftS('y',p.y), shiftS('z',p.z)];
  const i=A.indexOf(axis);
  const r2=`(${S3[0]}^2 + ${S3[1]}^2 + ${S3[2]}^2)`;
  const k=num2s(3*m);
  const iso = m>0 ? `-${num2s(m)}/${r2}^1.5` : `${num2s(-m)}/${r2}^1.5`;   // the −m/r³ part
  const co={};
  for(let j=0;j<3;j++){
    if(j===i) co[comp[j]] = smartJoin([`${k}${S3[i]}^2/${r2}^2.5`, iso]);
    else      co[comp[j]] = `${k}${S3[j]}${S3[i]}/${r2}^2.5`;
  }
  return co;
}
function physUniformExpr(v){ return { P:num2s(v.x), Q:num2s(v.y), R:num2s(v.z) }; }
/* Radiating vertical antenna at (a, b): the far-field E_z in the horizontal
   plane, softened at the mast so the 1/√ρ amplitude cannot blow up:
   E_z = A·cos(k·ρ − t + φ)/√(ρ² + 0.3) */
function physAntennaExpr(A, k, p, phi){
  const X=shiftS('x',p.x), Y=shiftS('y',p.y);
  const r2=`(${X}^2 + ${Y}^2)`;
  const ph = Math.abs(phi)<1e-12 ? '' : (phi>0 ? ` + ${num2s(phi)}` : ` - ${num2s(-phi)}`);
  const amp = num2s(A)==='1' ? '' : `${num2s(A)} `;
  return `${amp}cos(${num2s(k)} sqrt(${r2} + 0.02) - t${ph})/sqrt(${r2} + 0.3)`;
}
/* A phased line array: N antennas spaced d along `axis`, phase step dphi.
   The phase gradient steers the beam — the whole point of a phased array. */
function physArrayExpr(N, d, axis, center, k, dphi){
  const terms=[];
  for(let i=0;i<N;i++){
    const off=(i-(N-1)/2)*d;
    const p={ x:center.x + (axis==='x'?off:0), y:center.y + (axis==='y'?off:0) };
    terms.push(physAntennaExpr(1, k, p, i*dphi));
  }
  return smartJoin(terms);
}
/* objects → {mode, src}. Wave sources make a scalar field E_z(x, y, t);
   static sources superpose into a vector field. The two cannot mix. */
function physBuild(objects){
  const wave = objects.some(o => o.type==='antenna' || o.type==='array');
  if(wave){
    const terms = objects.map(o =>
      o.type==='antenna' ? physAntennaExpr(o.A, o.k, o.pos, o.phi||0)
      : o.type==='array' ? physArrayExpr(o.N, o.d, o.axis||'y', o.pos, o.k, o.dphi||0)
      : null).filter(Boolean);
    return { mode:'scalar', src:{ f: smartJoin(terms) }, mixed: terms.length !== objects.length };
  }
  const Ps=[], Qs=[], Rs=[];
  for(const o of objects){
    let c = null;
    if(o.type==='charge')  c = physChargeExpr(o.q, o.pos);
    if(o.type==='mass')    c = physChargeExpr(-(o.M!==undefined?o.M:1), o.pos);  // gravity: always attractive
    if(o.type==='wire')    c = physWireExpr(o.I, o.axis||'z', o.pos);
    if(o.type==='dipole')  c = physDipoleExpr(o.m, o.axis||'z', o.pos);
    if(o.type==='uniform') c = physUniformExpr(o.v);
    if(c){ Ps.push(c.P); Qs.push(c.Q); Rs.push(c.R); }
  }
  return { mode:'vector', src:{ P:smartJoin(Ps), Q:smartJoin(Qs), R:smartJoin(Rs) }, mixed:false };
}

/* ============================================================================
   3c · PURE OPTIMIZER STEPS — testable in isolation
   ============================================================================ */
const gdStep = (p, g, eta) => vsub(p, vmul(g, eta));
/* heavy-ball momentum: velocity remembers the past, damping the zigzag */
function momStep(p, vel, g, eta, beta){
  const v = vsub(vmul(vel, beta), vmul(g, eta));
  return { p: vadd(p, v), v };
}
/* one projected-gradient step constrained to the circle |p| = R (z ignored):
   remove the normal component of the step, then snap back onto the circle */
function conStep(p, g, eta, R){
  const n = vnorm(v3(p.x, p.y, 0));
  const d = vmul(g, -eta);
  const tang = vsub(d, vmul(n, vdot(d, n)));
  const q = vadd(p, tang);
  const L = Math.hypot(q.x, q.y) || 1;
  return v3(q.x*R/L, q.y*R/L, 0);
}

/* Newton's second law, integrated: one RK4 step of the joint state (x, v).
   accel(x, v) may depend on velocity — that is what makes the Lorentz force
   qv×B possible. RK4 keeps Kepler orbits closed and cyclotron circles round. */
function rk4Part(x, v, h, accel){
  const a1=accel(x, v);
  const x2=vadd(x, vmul(v,  h/2)), v2=vadd(v, vmul(a1, h/2));
  const a2=accel(x2, v2);
  const x3=vadd(x, vmul(v2, h/2)), v3=vadd(v, vmul(a2, h/2));
  const a3=accel(x3, v3);
  const x4=vadd(x, vmul(v3, h)),   v4=vadd(v, vmul(a3, h));
  const a4=accel(x4, v4);
  return {
    x: vadd(x, vmul(vadd(vadd(v,  vmul(v2,2)), vadd(vmul(v3,2), v4)), h/6)),
    v: vadd(v, vmul(vadd(vadd(a1, vmul(a2,2)), vadd(vmul(a3,2), a4)), h/6))
  };
}
