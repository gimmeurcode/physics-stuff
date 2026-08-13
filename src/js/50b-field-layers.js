function robustMax(vals){
  const a = vals.filter(Number.isFinite).map(Math.abs).sort((p,q)=>p-q);
  if(!a.length) return 1;
  const v = a[Math.min(a.length-1, Math.floor(a.length*0.93))];
  return v > 1e-9 ? v : (a[a.length-1] || 1);
}

/* which scalar the slice plane / map / terrain paints — this is where each
   operator's OUTPUT becomes a picture: divergence and scalar curl are signed
   scalar fields, so they get the diverging colour scale centred on zero */
function scalarSampler(){
  const F = S.field, flat = planar();
  const want = S.sliceOf==='auto' ? (S.mode==='scalar' ? 'f' : 'div') : S.sliceOf;
  switch(want){
    case 'f':
      if(F.f) return {ev:F.f.ev, signed:true, label:'f'};
      break;
    case 'mag':
      if(flat) return {ev:(x,y)=>Math.hypot(F.P.ev(x,y,0), F.Q.ev(x,y,0)), signed:false, label:'|'+fieldLabel(F)+'|'};
      return {ev:(x,y,z)=>vlen(F.at(x,y,z)), signed:false, label:'|'+fieldLabel(F)+'|'};
    case 'curl':
      return {ev:(x,y,z)=>vlen(F.curlAt(x,y,z)), signed:false, label:'|∇×'+fieldLabel(F)+'|'};
    case 'curl2':      /* the honest 2D curl: one signed number per point */
      return {ev:(x,y)=>F.curl2.ev(x,y,0), signed:true, label:'∇×'+fieldLabel(F)+' (scalar curl)'};
    case 'curln': {    /* the curl component pointing through the slice plane */
      const ax=S.sliceAxis, nm=['x̂','ŷ','ẑ'][ax];
      return {ev:(x,y,z)=>{ const c=F.curlAt(x,y,z); return ax===0?c.x:ax===1?c.y:c.z; },
              signed:true, label:'(∇×'+fieldLabel(F)+')·'+nm};
    }
  }
  if(flat) return {ev:(x,y)=>F.div2.ev(x,y,0), signed:true,
                   label: S.mode==='scalar' ? '∇²f (2D)' : '∇·'+fieldLabel(F)+' (2D)'};
  return {ev:F.divAt, signed:true, label: S.mode==='scalar' ? '∇²f' : '∇·'+fieldLabel(F)};
}

/* plane helpers: axis a is held at pos, (u,v) run along the other two axes */
const OTHER = [[1,2],[2,0],[0,1]];
function planePt(axis, pos, u, v){
  const [b,c] = OTHER[axis], o=[0,0,0];
  o[axis]=pos; o[b]=u; o[c]=v;
  return v3(o[0],o[1],o[2]);
}

/* ------------------------------------------------------- the height map ---- */
/* Surface view: the domain is the xy-plane and the third axis carries a scalar,
   so f(x, y) becomes literal terrain and ∇f becomes literal slope.            */
function buildSurface(){
  const L=S.extent, G=40, samp=scalarSampler();
  const step=2*L/G, H=new Float64Array((G+1)*(G+1)), vals=[];
  for(let i=0;i<=G;i++) for(let j=0;j<=G;j++){
    const v = samp.ev(-L+i*step, -L+j*step, 0);
    H[i*(G+1)+j] = v;
    if(Number.isFinite(v)) vals.push(v);
  }
  const hmax = robustMax(vals) || 1;
  const zs = (L*0.72/hmax) * S.hScale;
  const clamp = v => Math.max(-L*1.5, Math.min(L*1.5, v*zs));
  const light = vnorm(v3(0.42, 0.34, 0.84));

  const quads=[];
  for(let i=0;i<G;i++) for(let j=0;j<G;j++){
    const v00=H[i*(G+1)+j], v10=H[(i+1)*(G+1)+j], v11=H[(i+1)*(G+1)+j+1], v01=H[i*(G+1)+j+1];
    if(!(Number.isFinite(v00)&&Number.isFinite(v10)&&Number.isFinite(v11)&&Number.isFinite(v01))) continue;
    const x0=-L+i*step, y0=-L+j*step;
    const p=[ v3(x0,y0,clamp(v00)), v3(x0+step,y0,clamp(v10)),
              v3(x0+step,y0+step,clamp(v11)), v3(x0,y0+step,clamp(v01)) ];
    const mid=(v00+v10+v11+v01)/4;
    /* Lambert shading from the surface normal — terrain has to read as terrain */
    const n=vnorm(v3(-(clamp(v10)-clamp(v00))/step, -(clamp(v01)-clamp(v00))/step, 1));
    const lam=0.42 + 0.58*Math.max(0, vdot(n, light));
    const base = samp.signed ? rampDiv(mid/hmax) : rampSeq(Math.min(1,Math.abs(mid/hmax)));
    quads.push({p, c:rgbCss(mixRGB(TH.bg, base.map(v=>v*lam), 0.94))});
  }
  cache.surf = {quads, zs, hmax, samp, clampZ:clamp, label:samp.label};
}
function surfHeight(x,y){
  if(!cache.surf) buildSurface();
  const v = cache.surf.samp.ev(x,y,0);
  return Number.isFinite(v) ? cache.surf.clampZ(v) : null;
}
function drawSurface(){
  if(!cache.surf) buildSurface();
  for(const q of cache.surf.quads) R.poly(q.p, q.c, null, 0, 1);
}

/* ---------------------------------------------------------------- axes ---- */
function drawAxes(){
  const L = S.extent, gl = rgbCss(TH.line), gl2 = rgbCss(TH.line2);
  if(isSurf()){
    const n=8;
    for(let i=-n;i<=n;i++){                       // the flat domain grid, at z = 0
      const p=i*(L/n);
      R.line(v3(p,-L,0), v3(p,L,0), gl, p===0?1.2:0.7, p===0?0.9:0.4);
      R.line(v3(-L,p,0), v3(L,p,0), gl, p===0?1.2:0.7, p===0?0.9:0.4);
    }
    const ac=rgbCss(TH.faint);
    R.arrow(v3(-L,0,0), v3(2.2*L,0,0), ac, 1.1, 0.85);
    R.arrow(v3(0,-L,0), v3(0,2.2*L,0), ac, 1.1, 0.85);
    R.label(v3(L*1.24,0,0), 'x', rgbCss(TH.dim));
    R.label(v3(0,L*1.24,0), 'y', rgbCss(TH.dim));
    return;
  }
  if(is2D()){
    const n=8;
    for(let i=-n;i<=n;i++){
      const p=i*(L/n);
      R.line(v3(p,-L,0), v3(p,L,0), gl, p===0?1.4:0.7, p===0?1:0.55);
      R.line(v3(-L,p,0), v3(L,p,0), gl, p===0?1.4:0.7, p===0?1:0.55);
    }
    R.arrow(v3(0,0,0), v3(L*1.06,0,0), rgbCss(TH.faint), 1.2);
    R.arrow(v3(0,0,0), v3(0,L*1.06,0), rgbCss(TH.faint), 1.2);
    R.label(v3(L*1.13,0,0), 'x', rgbCss(TH.dim));
    R.label(v3(0,L*1.13,0), 'y', rgbCss(TH.dim));
    /* numeric ticks so positions can be read straight off the map */
    const stp = L>4 ? 2 : 1, fC=rgbCss(TH.faint), fnt='10px '+FONT_MONO;
    for(let vI=-Math.floor(L); vI<=Math.floor(L); vI+=stp){
      if(vI===0) continue;
      R.label(v3(vI, 0, 0), String(vI).replace('-','−'), fC, 0, 12, fnt);
      R.label(v3(0, vI, 0), String(vI).replace('-','−'), fC, -13, 0, fnt);
    }
    return;
  }
  /* floor grid grounds the scene without competing with the field */
  const n=6, st=L/n;
  for(let i=-n;i<=n;i++){
    R.line(v3(i*st,-L,-L), v3(i*st,L,-L), gl, 0.7, 0.5);
    R.line(v3(-L,i*st,-L), v3(L,i*st,-L), gl, 0.7, 0.5);
  }
  /* bounding box */
  const c=[-L,L];
  for(const a of c) for(const b of c){
    R.line(v3(a,b,-L), v3(a,b,L), gl2, 0.7, 0.4);
    R.line(v3(a,-L,b), v3(a,L,b), gl2, 0.7, 0.4);
    R.line(v3(-L,a,b), v3(L,a,b), gl2, 0.7, 0.4);
  }
  /* axes through the origin */
  const ac = rgbCss(TH.faint);
  R.arrow(v3(-L,0,0), v3(2.12*L,0,0), ac, 1.1, 0.9);
  R.arrow(v3(0,-L,0), v3(0,2.12*L,0), ac, 1.1, 0.9);
  R.arrow(v3(0,0,-L), v3(0,0,2.12*L), ac, 1.1, 0.9);
  R.label(v3(L*1.19,0,0), 'x', rgbCss(TH.dim));
  R.label(v3(0,L*1.19,0), 'y', rgbCss(TH.dim));
  R.label(v3(0,0,L*1.19), 'z', rgbCss(TH.dim));
  for(let i=-n;i<=n;i++){
    if(i===0) continue;
    const t=i*st, k=L*0.028;
    R.line(v3(t,-k,0), v3(t,k,0), ac, 0.9, 0.7);
    R.line(v3(-k,t,0), v3(k,t,0), ac, 0.9, 0.7);
    R.line(v3(-k,0,t), v3(k,0,t), ac, 0.9, 0.7);
  }
}

/* ------------------------------------------------------------- arrows ---- */
function buildArrows(){
  const F=S.field, L=S.extent, n=S.density;
  const step = 2*L/n, base = step*0.82*S.arrowScale;
  const pts=[], mags=[];
  const twoD = S.dim===2;
  const kMax = twoD ? 0 : n;

  for(let i=0;i<=n;i++) for(let j=0;j<=n;j++){
    for(let k=0;k<=kMax;k++){
      const x=-L+i*step, y=-L+j*step, z= twoD ? 0 : -L+k*step;
      if(S.nearSlice && !twoD){
        const c=[x,y,z][S.sliceAxis];
        if(Math.abs(c - S.slicePos) > step*0.55) continue;
      }
      const vx=F.P.ev(x,y,z), vy=F.Q.ev(x,y,z), vz= twoD ? 0 : F.R.ev(x,y,z);
      if(!Number.isFinite(vx)||!Number.isFinite(vy)||!Number.isFinite(vz)) continue;
      const m=Math.hypot(vx,vy,vz);
      if(!(m>1e-12)) continue;
      pts.push({p:v3(x,y,z), v:v3(vx,vy,vz), m});
      mags.push(m);
    }
  }
  const mmax = robustMax(mags);
  const K = 9;      // log compression strength
  for(const a of pts){
    const r = Math.min(1, a.m/mmax);
    let len;
    if(S.lenMode==='unit')       len = base*0.78;
    else if(S.lenMode==='linear')len = base*r;
    else                         len = base*Math.log(1+K*r)/Math.log(1+K);
    a.draw = vmul(a.v, len/a.m);
    a.col  = rgbCss(rampSeq(Math.pow(r,0.62)));
    /* on the height map, arrows stand on the terrain: "which way is uphill from here" */
    if(isSurf()){
      const h = surfHeight(a.p.x, a.p.y);
      if(h===null){ a.skip=true; continue; }
      /* float clear of the mesh — a painter's-algorithm quad can otherwise sort
         in front of an arrow lying exactly on it */
      a.p = v3(a.p.x, a.p.y, h + S.extent*0.05);
    }
  }
  cache.arrows = {pts:pts.filter(a=>!a.skip), mmax};
}
function drawArrows(){
  if(!cache.arrows) buildArrows();
  const {pts} = cache.arrows;
  const dist = R.cam.dist;
  for(const a of pts){
    let alpha = 1;
    if(S.dim===3){
      const q = R.project(a.p.x,a.p.y,a.p.z);
      if(!q) continue;
      alpha = Math.max(0.22, Math.min(1, 1.5 - q.d/(dist*1.7)));
    }
    R.arrow(a.p, a.draw, a.col, 1.35, alpha);
  }
}

/* ------------------------------------------------------- curl arrows ---- */
/* The OUTPUT of the vector curl, drawn as its own field: at every lattice
   point, an arrow of ∇×F. For rigid rotation this is a uniform forest of
   identical ẑ-arrows — the picture that makes "curl is a vector field" land. */
function buildCurlArrows(){
  const F=S.field, L=S.extent, n=Math.max(3, S.density-1);
  const step=2*L/n, base=step*0.7*S.arrowScale;
  const pts=[], mags=[];
  for(let i=0;i<=n;i++) for(let j=0;j<=n;j++) for(let k=0;k<=n;k++){
    const x=-L+i*step, y=-L+j*step, z=-L+k*step;
    const c=F.curlAt(x,y,z);
    if(!Number.isFinite(c.x)||!Number.isFinite(c.y)||!Number.isFinite(c.z)) continue;
    const m=vlen(c);
    if(!(m>1e-12)) continue;
    pts.push({p:v3(x,y,z), v:c, m});
    mags.push(m);
  }
  const mmax=robustMax(mags);
  for(const a of pts){
    const r=Math.min(1, a.m/mmax);
    a.draw=vmul(a.v, base*Math.log(1+9*r)/(Math.log(10)*a.m));
  }
  cache.curlArrows={pts, mmax};
}
function drawCurlArrows(){
  if(planar() || S.mode!=='vector') return;   // scalar mode: identically zero
  if(!cache.curlArrows) buildCurlArrows();
  const col=rgbCss(TH.curl);
  for(const a of cache.curlArrows.pts){
    const q=R.project(a.p.x,a.p.y,a.p.z);
    if(!q) continue;
    const alpha=Math.max(0.25, Math.min(0.92, 1.45 - q.d/(R.cam.dist*1.7)));
    R.arrow(a.p, a.draw, col, 1.5, alpha);
  }
}

/* ------------------------------------------------------- field lines ---- */
/* The textbook picture: continuous curves everywhere tangent to the field,
   with arrowheads for direction. Seeded on the sources when the field was
   built from objects (lines leave + charges and enter − ones), otherwise on
   a ring around the domain. Spacing is qualitative — a 2D drawing cannot
   make density ∝ strength exact — but tangency is exact. */
function fieldLineSources(){
  if(!S.phys.applied) return [];
  return S.phys.objects.filter(o => o.type==='charge' || o.type==='mass');
}
function buildFieldLines(){
  const F=S.field, L=S.extent, twoD=planar();
  const lines=[], srcs=fieldLineSources();
  const seeds=[];
  if(srcs.length){
    for(const o of srcs){
      const outgoing = o.type==='charge' && o.q>0;   // masses and −q: lines flow IN
      const n=Math.max(8, Math.round(10*Math.sqrt(Math.abs(o.q!==undefined?o.q:o.M||1))));
      for(let i=0;i<n;i++){
        const a=i/n*2*Math.PI + 0.13;
        const off = twoD ? v3(Math.cos(a), Math.sin(a), 0)
                         : vnorm(v3(Math.cos(a), Math.sin(a), Math.sin(2.4*a+1)));
        seeds.push({p:vadd(v3(o.pos.x,o.pos.y,o.pos.z||0), vmul(off,0.14)), dir: outgoing?1:-1});
      }
    }
  } else {
    const n = twoD ? 20 : 30;
    for(let i=0;i<n;i++){
      const a=i/n*2*Math.PI;
      const p = twoD ? v3(L*0.55*Math.cos(a), L*0.55*Math.sin(a), 0)
                     : vmul(vnorm(v3(Math.cos(a)*Math.cos(3*a), Math.sin(a), Math.sin(3*a)*0.8)), L*0.55);
      seeds.push({p, dir:1}); seeds.push({p, dir:-1});
    }
  }
  const h=L/55, maxSteps=260;
  for(const s of seeds){
    const pts=[v3(s.p.x,s.p.y,s.p.z)], heads=[];
    let p=s.p, prevDir=null;
    for(let k2=0;k2<maxSteps;k2++){
      const f1=F.at(p.x,p.y, twoD?0:p.z);
      const m1=twoD?Math.hypot(f1.x,f1.y):vlen(f1);
      if(!(m1>1e-7)||!Number.isFinite(m1)) break;
      const d1=vmul(twoD?v3(f1.x,f1.y,0):f1, s.dir/m1);
      /* a sharp direction reversal means we are straddling a singularity */
      if(prevDir && vdot(d1, prevDir) < -0.4) break;
      prevDir=d1;
      const mid=vadd(p, vmul(d1,h/2));
      const f2=F.at(mid.x,mid.y, twoD?0:mid.z);
      const m2=twoD?Math.hypot(f2.x,f2.y):vlen(f2);
      if(!(m2>1e-7)||!Number.isFinite(m2)) break;
      p=vadd(p, vmul(vmul(twoD?v3(f2.x,f2.y,0):f2, s.dir/m2), h));
      if(Math.abs(p.x)>L*1.02||Math.abs(p.y)>L*1.02||Math.abs(p.z)>L*1.02) { pts.push(p); break; }
      let hitSrc=false;
      for(const o of srcs) if(Math.hypot(p.x-o.pos.x, p.y-o.pos.y, p.z-(o.pos.z||0))<0.12){ hitSrc=true; break; }
      pts.push(v3(p.x,p.y,p.z));
      if(hitSrc) break;
      if(k2>0 && k2%34===0) heads.push(pts.length-1);
    }
    if(pts.length>6) lines.push({pts, heads, dir:s.dir});
  }
  cache.fieldLines={lines};
}
function drawFieldLines(){
  if(!cache.fieldLines) buildFieldLines();
  const col=rgbCss(TH.accent);
  for(const ln of cache.fieldLines.lines){
    R.path(ln.pts, col, 1.4, 0.8);
    for(const hi of ln.heads){
      const a=ln.pts[hi-1], b=ln.pts[hi];
      /* traversal follows ±F; the arrowhead must always point along +F */
      if(a&&b) R.arrow(ln.dir>0 ? a : b, vmul(vsub(b,a), ln.dir>0 ? 3 : -3), col, 1.4, 0.85);
    }
  }
}

/* --------------------------------------------------------- slice plane ---- */
function buildSlice(){
  const L=S.extent, samp=scalarSampler();

  /* Flat view: the plane is axis-aligned on screen, so paint it once into an
     offscreen bitmap and blit it. Smooth, and far cheaper than thousands of quads. */
  if(is2D()){
    const G=190, cv=document.createElement('canvas');
    cv.width=cv.height=G;
    const ictx=cv.getContext('2d'), img=ictx.createImageData(G,G);
    const vals=new Float64Array(G*G);
    for(let j=0;j<G;j++) for(let i=0;i<G;i++){
      vals[j*G+i] = samp.ev(-L + (i+0.5)*2*L/G, L - (j+0.5)*2*L/G, 0);   // row 0 = top = +y
    }
    const vmax = robustMax(Array.from(vals));
    for(let k=0;k<G*G;k++){
      const v=vals[k], o=k*4;
      if(!Number.isFinite(v)){ img.data[o+3]=0; continue; }
      const t=v/vmax;
      const c = samp.signed ? rampDiv(t) : rampSeq(Math.min(1,Math.abs(t)));
      img.data[o]=c[0]|0; img.data[o+1]=c[1]|0; img.data[o+2]=c[2]|0; img.data[o+3]=255;
    }
    ictx.putImageData(img,0,0);
    cache.slice = {img:cv, vmax, label:samp.label, flat:true};
    return;
  }

  const M=30;
  const axis = S.dim===2 ? 2 : S.sliceAxis, pos = S.dim===2 ? 0 : S.slicePos;
  const step=2*L/M, vals=[], cells=[];
  for(let i=0;i<M;i++) for(let j=0;j<M;j++){
    const u=-L+(i+0.5)*step, v=-L+(j+0.5)*step;
    const p=planePt(axis,pos,u,v);
    const val=samp.ev(p.x,p.y,p.z);
    vals.push(val);
    cells.push({u,v,val});
  }
  const vmax = robustMax(vals);
  /* in the height view the coloured map lies flat underneath the terrain */
  const zBase = isSurf() ? -L*1.02 : 0;
  const at = (u,v)=> isSurf() ? v3(u,v,zBase) : planePt(axis,pos,u,v);
  const quads = cells.map(c=>{
    const t = c.val/vmax;
    const col = samp.signed ? rampDiv(t) : rampSeq(Math.min(1,Math.abs(t)));
    return {
      p:[ at(c.u-step/2,c.v-step/2), at(c.u+step/2,c.v-step/2),
          at(c.u+step/2,c.v+step/2), at(c.u-step/2,c.v+step/2) ],
      c: Number.isFinite(c.val) ? rgbCss(col) : null
    };
  });
  cache.slice = {quads, vmax, label:samp.label};
}
function drawSlice(){
  if(!cache.slice) buildSlice();
  if(cache.slice.flat){
    const L=S.extent;
    const a=R.project(-L, L, 0), b=R.project(L, -L, 0);      // top-left, bottom-right
    if(a&&b) R.items.push({k:6, d:1e6, img:cache.slice.img, x1:a.x, y1:a.y, w:b.x-a.x, h:b.y-a.y, a:1});
    return;
  }
  const a = isSurf() ? 0.95 : 0.82;
  for(const q of cache.slice.quads) if(q.c) R.poly(q.p, q.c, null, 0, a);
}

/* --------------------------------------------- level sets (marching squares) */
/* 16 unambiguous cases; entries list the cell edges each segment connects.
   edge 0 = c0-c1, 1 = c1-c2, 2 = c2-c3, 3 = c3-c0 (corners run round the cell) */
const MS = [ [], [[0,3]], [[0,1]], [[1,3]], [[1,2]], [[0,3],[1,2]], [[0,2]], [[2,3]],
             [[2,3]], [[0,2]], [[0,1],[2,3]], [[1,2]], [[1,3]], [[0,1]], [[0,3]], [] ];

function buildLevels(){
  const L=S.extent, G=42;
  const samp = scalarSampler(), ev = samp.ev;
  /* stack the contour planes across the axis we are looking most nearly along,
     so the slices read as one surface rather than a picket fence */
  let axis = 2;
  if(!planar()){
    const f=R.fwd, m=[Math.abs(f.x),Math.abs(f.y),Math.abs(f.z)];
    axis = m.indexOf(Math.max(...m));
  }
  const K = planar() ? 1 : 13;

  /* one coarse pass to choose contour values */
  const probe=[];
  for(let i=0;i<=12;i++) for(let j=0;j<=12;j++) for(let k=0;k<=12;k++){
    const v=ev(-L+i*2*L/12, -L+j*2*L/12, planar()?0:(-L+k*2*L/12));
    if(Number.isFinite(v)) probe.push(v);
    if(planar()) break;
  }
  probe.sort((a,b)=>a-b);
  if(!probe.length){ cache.levels={sets:[]}; return; }
  const lo=probe[Math.floor(probe.length*0.04)], hi=probe[Math.floor(probe.length*0.96)];
  const nL=S.levels, levels=[];
  for(let i=0;i<nL;i++) levels.push(lo + (hi-lo)*(i+0.5)/nL);
  const amax = Math.max(Math.abs(lo), Math.abs(hi)) || 1;

  const step=2*L/G, sets=[];
  /* on the height map a contour of value Lv sits at exactly that height, so the
     stack of plane contours becomes the real contour rings of the terrain */
  const zs = isSurf() ? (cache.surf || (buildSurface(), cache.surf)).zs : 0;
  const lift = (pt, Lv) => isSurf() ? v3(pt.x, pt.y, Math.max(-L*1.5, Math.min(L*1.5, Lv*zs)) + L*0.006) : pt;

  for(let kp=0; kp<K; kp++){
    const pos = planar() ? 0 : (K===1 ? 0 : -L + kp*(2*L/(K-1)));
    const g = new Float64Array((G+1)*(G+1));
    for(let i=0;i<=G;i++) for(let j=0;j<=G;j++){
      const p=planePt(axis,pos,-L+i*step,-L+j*step);
      g[i*(G+1)+j] = ev(p.x,p.y,p.z);
    }
    for(let li=0; li<levels.length; li++){
      const Lv=levels[li], segs=[];
      for(let i=0;i<G;i++) for(let j=0;j<G;j++){
        const v0=g[i*(G+1)+j], v1=g[(i+1)*(G+1)+j], v2=g[(i+1)*(G+1)+j+1], v3=g[i*(G+1)+j+1];
        if(!(Number.isFinite(v0)&&Number.isFinite(v1)&&Number.isFinite(v2)&&Number.isFinite(v3))) continue;
        const idx = (v0>Lv?1:0)|(v1>Lv?2:0)|(v2>Lv?4:0)|(v3>Lv?8:0);
        const cs = MS[idx];
        if(!cs.length) continue;
        const u0=-L+i*step, w0=-L+j*step;
        const CU=[u0, u0+step, u0+step, u0], CW=[w0, w0, w0+step, w0+step], CV=[v0,v1,v2,v3];
        const onEdge = e=>{
          const a=e, b=(e+1)&3;
          const t=(Lv-CV[a])/(CV[b]-CV[a]);
          return planePt(axis,pos, CU[a]+(CU[b]-CU[a])*t, CW[a]+(CW[b]-CW[a])*t);
        };
        for(const [e1,e2] of cs) segs.push([lift(onEdge(e1),Lv), lift(onEdge(e2),Lv)]);
      }
      if(segs.length) sets.push({segs, col:rgbCss(rampDiv(Lv/amax)), val:Lv});
    }
  }
  cache.levels = {sets, axis, levels, label:samp.label};
}
function drawLevels(){
  if(!cache.levels) buildLevels();
  const flat = planar();
  const a = is2D() ? 0.92 : (isSurf() ? 0.9 : 0.42);
  /* Over a tinted map the contours must be ink, not more of the same colour
     scale — otherwise every line vanishes into the band it borders. */
  const overTint = is2D() && S.show.slice;
  const ink = rgbCss(TH.dark ? [235,240,250] : [30,38,54]);
  for(const s of cache.levels.sets){
    const col = overTint ? ink : s.col;
    for(const [p,q] of s.segs) R.line(p,q,col, flat?1.5:1, a);
    /* label the contours so the flat view reads as a proper topographic map */
    if(is2D() && s.segs.length){
      const seg = s.segs[Math.floor(s.segs.length*0.34)];
      R.label(seg[0], fmtNum(s.val,3), col, 0, 0, '600 10px '+FONT_MONO);
    }
  }
}

/* --------------------------------------------------------- streamlines ---- */
const stream = { parts:[], mmax:1 };
function seedParticle(p){
  const L=S.extent;
  p.pos = v3((Math.random()*2-1)*L, (Math.random()*2-1)*L, S.dim===2 ? 0 : (Math.random()*2-1)*L);
  p.trail = [];
  p.age = Math.random()*40;
  p.life = 90 + Math.random()*90;
}
function resetStream(){
  const n = S.dim===2 ? 340 : 460;
  stream.parts = Array.from({length:n}, ()=>{ const p={}; seedParticle(p); return p; });
}
function stepStream(dt){
  const F=S.field, L=S.extent;
  const f = (x,y,z)=>{
    const a=F.P.ev(x,y,z), b=F.Q.ev(x,y,z), c=S.dim===2?0:F.R.ev(x,y,z);
    return (Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(c)) ? v3(a,b,c) : null;
  };
  const mags=[];
  for(const p of stream.parts){
    p.age++;
    const k1 = f(p.pos.x,p.pos.y,p.pos.z);
    if(!k1){ seedParticle(p); continue; }
    const m = vlen(k1);
    mags.push(m);
    if(m < 1e-7 || p.age > p.life){ seedParticle(p); continue; }
    /* step by a roughly constant screen distance: fast regions stay stable,
       slow regions still crawl visibly instead of freezing */
    const h = Math.min(0.075, (L*0.022)/m) * (dt/0.016);
    const a1=vmul(k1,h);
    const q2=vadd(p.pos, vmul(a1,0.5)); const k2=f(q2.x,q2.y,q2.z); if(!k2){ seedParticle(p); continue; }
    const q3=vadd(p.pos, vmul(k2,h*0.5)); const k3=f(q3.x,q3.y,q3.z); if(!k3){ seedParticle(p); continue; }
    const q4=vadd(p.pos, vmul(k3,h));    const k4=f(q4.x,q4.y,q4.z); if(!k4){ seedParticle(p); continue; }
    const inc = vmul(vadd(vadd(k1, vmul(k2,2)), vadd(vmul(k3,2), k4)), h/6);
    p.pos = vadd(p.pos, inc);
    p.speed = m;
    if(Math.abs(p.pos.x)>L*1.05 || Math.abs(p.pos.y)>L*1.05 || (S.dim===3 && Math.abs(p.pos.z)>L*1.05)){
      seedParticle(p); continue;
    }
    p.trail.push(p.pos);
    if(p.trail.length > 14) p.trail.shift();
  }
  if(mags.length) stream.mmax = robustMax(mags);
}
function drawStream(){
  const mmax = stream.mmax || 1;
  for(const p of stream.parts){
    if(p.trail.length < 2) continue;
    const t = Math.min(1, (p.speed||0)/mmax);
    const col = rgbCss(rampSeq(Math.pow(t,0.6)));
    const fade = Math.min(1, p.age/12) * Math.min(1, (p.life-p.age)/18);
    R.path(p.trail, col, S.dim===2?1.7:1.4, Math.max(0, 0.72*fade));
    R.dot(p.pos, S.dim===2?2:1.7, col, null, Math.max(0,0.9*fade));
  }
}
