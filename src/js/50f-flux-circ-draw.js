function drawFlux(){
  if(!inst.flux) recomputeInstruments();
  const p=S.probe, h=S.flux.h, res=inst.flux;
  const posC = rgbCss(TH.pos), negC = rgbCss(TH.neg);

  /* in the plane the closed surface is a closed CURVE: a square with four edges */
  if(planar()){
    const z = isSurf() ? (surfHeight(p.x,p.y)||0) + S.extent*0.02 : 0;
    const maxFace = Math.max(...res.faces.map(f=>Math.abs(f.flux)), 1e-12);
    const cor=(sx,sy)=>v3(p.x+sx*h, p.y+sy*h, z);
    R.poly([cor(-1,-1),cor(1,-1),cor(1,1),cor(-1,1)], rgbCss(TH.mid,0.10), null, 0, 1);
    for(const face of res.faces){
      const {axis,s,n}=face;
      const a = axis===0 ? cor(s,-1) : cor(-1,s);
      const b = axis===0 ? cor(s, 1) : cor( 1,s);
      R.line(a, b, rgbCss(rampDiv(face.flux/maxFace)), 2.4, 1);
      const m=7;
      for(let i=0;i<m;i++){
        const t=(i+0.5)/m, q=vadd(a, vmul(vsub(b,a), t));
        const d=vdot(S.field.at(q.x,q.y,0), n);
        if(!Number.isFinite(d) || Math.abs(d)<1e-12) continue;
        const Lp=Math.max(-1,Math.min(1, d/(robustMaxFlux()||1)))*h*0.85;
        R.arrow(q, vmul(n,Lp), d>0?posC:negC, 1.5, 0.95);
      }
    }
    return;
  }

  if(S.flux.shape==='sphere'){
    const Rr=h, ringPts=64;
    for(const ax of [0,1,2]){
      const pts=[];
      for(let i=0;i<=ringPts;i++){
        const t=i/ringPts*Math.PI*2;
        pts.push(vadd(p, planePt(ax,0,Rr*Math.cos(t),Rr*Math.sin(t))));
      }
      R.path(pts, rgbCss(TH.line2), 1, 0.75);
    }
    const nT=7, nP=14;
    for(let i=0;i<nT;i++){
      const th=(i+0.5)*Math.PI/nT, st=Math.sin(th), ct=Math.cos(th);
      for(let j=0;j<nP;j++){
        const ph=(j+0.5)*2*Math.PI/nP;
        const n=v3(st*Math.cos(ph), st*Math.sin(ph), ct);
        const q=vadd(p, vmul(n,Rr));
        const d=vdot(S.field.at(q.x,q.y,q.z), n);
        if(!Number.isFinite(d) || Math.abs(d)<1e-12) continue;
        const L=Math.max(-1,Math.min(1, d/(robustMaxFlux()||1)))*h*0.78;
        R.arrow(q, vmul(n,L), d>0?posC:negC, 1.5, 0.92);
      }
    }
    return;
  }

  /* cube: translucent faces tinted by their own net flux, plus the F·n̂ samples */
  const maxFace = Math.max(...res.faces.map(f=>Math.abs(f.flux)), 1e-12);
  for(const face of res.faces){
    const a=face.axis, s=face.s, [b,c]=OTHER[a];
    const corner=(su,sv)=>{ const o=[0,0,0]; o[a]=s*h; o[b]=su*h; o[c]=sv*h; return vadd(p, v3(o[0],o[1],o[2])); };
    const quad=[corner(-1,-1), corner(1,-1), corner(1,1), corner(-1,1)];
    R.poly(quad, rgbCss(rampDiv(face.flux/maxFace), 0.16), rgbCss(TH.line2), 1, 1);
  }
  const m=3;
  for(const face of res.faces){
    const a=face.axis, s=face.s, [b,c]=OTHER[a], n=face.n;
    for(let i=0;i<m;i++) for(let j=0;j<m;j++){
      const u=(-1 + (i+0.5)*2/m)*h, v=(-1 + (j+0.5)*2/m)*h;
      const o=[0,0,0]; o[a]=s*h; o[b]=u; o[c]=v;
      const q=vadd(p, v3(o[0],o[1],o[2]));
      const d=vdot(S.field.at(q.x,q.y,q.z), n);
      if(!Number.isFinite(d) || Math.abs(d)<1e-12) continue;
      const L=Math.max(-1,Math.min(1, d/(robustMaxFlux()||1)))*h*0.8;
      R.arrow(q, vmul(n,L), d>0?posC:negC, 1.5, 0.95);
    }
  }
}
/* scale for the F·n̂ sample arrows: the normal component sampled on the actual
   surface in use (box faces, sphere points, or square edges) */
let _fluxScaleCache = {key:'', v:1};
function robustMaxFlux(){
  const p=S.probe, h=S.flux.h;
  const key = [p.x,p.y,p.z,h,S.flux.shape,S.src.P,S.src.Q,S.src.R,S.src.f,S.mode,S.view,CLOCK.t|0].join('|');
  if(_fluxScaleCache.key===key) return _fluxScaleCache.v;
  const vals=[];
  if(!planar() && S.flux.shape==='sphere'){
    for(let i=0;i<6;i++) for(let j=0;j<6;j++){
      const th=(i+0.5)*Math.PI/6, ph=(j+0.5)*Math.PI/3;
      const n=v3(Math.sin(th)*Math.cos(ph), Math.sin(th)*Math.sin(ph), Math.cos(th));
      const q=vadd(p, vmul(n,h));
      vals.push(vdot(S.field.at(q.x,q.y,q.z), n));
    }
  } else {
    const nAx = planar() ? 2 : 3;    // no z-faces when the domain is the plane
    for(let i=0;i<nAx;i++) for(const s of [-1,1]) for(let a=0;a<3;a++){
      const o=[0,0,0]; o[i]=s*h; o[(i+1)%3]=(a-1)*h*0.6;
      const q=vadd(p, v3(o[0],o[1],o[2]));
      const n=v3(i===0?s:0, i===1?s:0, i===2?s:0);
      vals.push(vdot(S.field.at(q.x,q.y,q.z), n));
    }
  }
  const v = robustMax(vals) || 1;
  _fluxScaleCache = {key, v};
  return v;
}

/* ------------------------------------------------------ circulation loop ---- */
function drawCirc(){
  if(!inst.circ) recomputeInstruments();
  const r=S.circ.r, n = planar() ? v3(0,0,1) : vnorm(S.circ.n), res=inst.circ;
  const p = isSurf() ? v3(S.probe.x, S.probe.y, (surfHeight(S.probe.x,S.probe.y)||0)+S.extent*0.02) : S.probe;
  const u=res.u, v=res.v;
  const posC=rgbCss(TH.pos), negC=rgbCss(TH.neg), cCol=rgbCss(TH.curl);

  /* the disc and its rim */
  const rim=[];
  for(let i=0;i<=72;i++){
    const t=i/72*2*Math.PI;
    rim.push(vadd(p, vadd(vmul(u, r*Math.cos(t)), vmul(v, r*Math.sin(t)))));
  }
  R.poly(rim.slice(0,72), rgbCss(TH.curl,0.08), null, 0, 1);
  R.path(rim, cCol, 1.8, 0.95);

  /* n̂ and the right-hand orientation (there is only one choice in the plane) */
  if(!is2D()){
    R.arrow(p, vmul(n, r*1.5), cCol, 2.2);
    R.label(vadd(p, vmul(n, r*1.72)), planar()?'ẑ':'n̂', cCol, 0, 0, '600 12px '+FONT_UI);
  }

  /* tangential component F·T̂ — the integrand of the circulation */
  const maxT = Math.max(...res.samples.map(s=>Math.abs(s.v)), 1e-12);
  const K=20;
  for(let i=0;i<K;i++){
    const t=(i+0.5)/K*2*Math.PI, ct=Math.cos(t), st=Math.sin(t);
    const q=vadd(p, vadd(vmul(u, r*ct), vmul(v, r*st)));
    const T=vadd(vmul(u,-st), vmul(v,ct));
    const d=vdot(S.field.at(q.x,q.y,q.z), T);
    if(!Number.isFinite(d) || Math.abs(d)<1e-12) continue;
    const L=Math.max(-1,Math.min(1, d/maxT))*r*0.52;
    R.arrow(q, vmul(T,L), d>0?posC:negC, 1.6, 0.95);
  }

  /* paddle wheel: spins at ω·n̂ = ½(∇×F)·n̂, the true local angular velocity */
  if(S.circ.paddle){
    const sp=S.circ.spin, blades=6, br=r*0.56;
    for(let i=0;i<blades;i++){
      const t=sp + i*2*Math.PI/blades;
      const dir=vadd(vmul(u,Math.cos(t)), vmul(v,Math.sin(t)));
      const tip=vadd(p, vmul(dir,br));
      R.line(p, tip, rgbCss(TH.text), 1.6, 0.85);
      const perp=vadd(vmul(u,-Math.sin(t)), vmul(v,Math.cos(t)));
      R.line(vadd(tip, vmul(perp, r*0.15)), vsub(tip, vmul(perp, r*0.15)), rgbCss(TH.text), 2.4, 0.85);
    }
    R.dot(p, 3, rgbCss(TH.text), null, 0.9);
  }
}
