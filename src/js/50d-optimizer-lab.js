function mkWalker(method){
  return { method, path:[ v3(S.probe.x, S.probe.y, S.probe.z) ], vel:v3(0,0,0), alive:true };
}
function descReset(){
  S.desc.walkers = [ mkWalker('gd') ];
  if(S.desc.race) S.desc.walkers.push(mkWalker('momentum'));
  S.desc.acc = 0;
}
function descDir(p){
  const F=S.field;
  if(S.mode==='scalar'){
    const g=F.at(p.x,p.y,p.z);                 // F.at IS ∇f in scalar mode
    return S.desc.mode==='max' ? g : vmul(g,-1);
  }
  return F.at(p.x,p.y,p.z);
}
function walkerColor(w){
  return w.method==='momentum' ? rgbCss(TH.accent) : rgbCss(TH.grad);
}
function descStep(){
  if(!S.desc.walkers.length) descReset();
  const L=S.extent*1.05;
  let anyAlive=false;
  for(const w of S.desc.walkers){
    if(!w.alive) continue;
    const p=w.path[w.path.length-1];
    const d=descDir(p);
    if(!Number.isFinite(d.x+d.y+d.z)){ w.alive=false; continue; }
    let q;
    if(w.method==='momentum'){
      const r = momStep(p, w.vel, vmul(d,-1), S.desc.eta, S.desc.beta);  // momStep expects the raw gradient
      q = r.p; w.vel = r.v;
    } else {
      q = gdStep(p, vmul(d,-1), S.desc.eta);
    }
    if(planar()) q.z=0;
    if(Math.abs(q.x)>L||Math.abs(q.y)>L||Math.abs(q.z)>L){ w.alive=false; continue; }
    w.path.push(q);
    if(w.path.length>420) w.path.shift();
    anyAlive=true;
  }
  if(!anyAlive) S.desc.running=false;
}
function drawDescent(){
  const lift = pt => isSurf() ? v3(pt.x, pt.y, (surfHeight(pt.x,pt.y)||0)+S.extent*0.03) : pt;
  for(const w of S.desc.walkers){
    const path=w.path;
    if(!path.length) continue;
    const col = walkerColor(w);
    const pts=path.map(lift);
    if(pts.length>1) R.path(pts, col, 2.2, 0.95);
    for(let i=Math.max(0,pts.length-16); i<pts.length; i++) R.dot(pts[i], 2.1, col, null, 0.8);
    const last=pts[pts.length-1];
    R.dot(last, 4.2, col, rgbCss(TH.bg));
    /* draw literally the NEXT step — overshoot becomes visible */
    const d=descDir(path[path.length-1]);
    if(Number.isFinite(d.x+d.y+d.z) && vlen(d)>1e-9){
      const stepv = w.method==='momentum' ? vadd(vmul(w.vel,S.desc.beta), vmul(d,S.desc.eta)) : vmul(d, S.desc.eta);
      const cap=S.extent*0.8, m=vlen(stepv);
      if(m>1e-9) R.arrow(last, m>cap ? vmul(stepv,cap/m) : stepv, rgbCss(TH.text), 1.8, 0.9);
    }
  }
}

/* ------------------------------------------- constrained walk: Lagrange live ---- */
/* Minimize f on the circle |x| = R by projected gradient. The walk stops
   exactly where no tangential descent remains — where ∇f ∥ ∇g. */
function conReset(){
  const t=Math.atan2(S.probe.y||0.3, S.probe.x||1);
  S.con.pos = v3(S.con.R*Math.cos(t), S.con.R*Math.sin(t), 0);
  S.con.acc = 0;
}
function conStepOnce(){
  if(!S.con.pos) conReset();
  const F=S.field, p=S.con.pos;
  const g=F.at(p.x,p.y,0);                                  // ∇f (scalar mode)
  if(!Number.isFinite(g.x+g.y)){ S.con.running=false; return; }
  S.con.pos = conStep(p, v3(g.x,g.y,0), 0.06, S.con.R);
}
function conAlignment(){
  const p=S.con.pos; if(!p) return null;
  const g=S.field.at(p.x,p.y,0);
  const n=vnorm(v3(p.x,p.y,0));                             // ∇g direction for g = x²+y²
  const gm=Math.hypot(g.x,g.y);
  if(gm<1e-12) return {sin:0, lambda:0, g, n};
  const cross=Math.abs(g.x*n.y - g.y*n.x)/gm;               // |sin θ| between ∇f and ∇g
  return { sin:cross, lambda:(g.x*n.x+g.y*n.y)/(2*S.con.R), g, n };
}
function drawConstraint(){
  if(!S.con.on || S.mode!=='scalar' || !planar()) return;
  const R0=S.con.R, tC=rgbCss(TH.text);
  const rim=[];
  for(let i=0;i<=90;i++){ const a=i/90*2*Math.PI; rim.push(v3(R0*Math.cos(a), R0*Math.sin(a), 0)); }
  R.path(rim, tC, 1.6, 0.8);
  R.label(v3(R0*0.72, -R0*0.72, 0), 'g = x² + y² = '+fmtNum(R0*R0,3), rgbCss(TH.dim), 0, 14, '11px '+FONT_UI);
  if(S.con.running){
    S.con.acc += 1;                                          // stepped from frame loop cadence
    for(let i=0;i<3;i++) conStepOnce();
  }
  const p=S.con.pos; if(!p) return;
  const al=conAlignment();
  R.dot(p, 4.5, rgbCss(TH.warn||[224,179,65]), rgbCss(TH.bg));
  if(al){
    const Lr=S.extent*0.35;
    const gm=Math.hypot(al.g.x,al.g.y);
    if(gm>1e-9) R.arrow(p, vmul(v3(al.g.x,al.g.y,0), Lr/gm), rgbCss(TH.grad), 2.4, 0.95);
    R.arrow(p, vmul(al.n, Lr*0.8), rgbCss(TH.curl), 2.4, 0.95);
    R.label(vadd(p, vmul(al.n, Lr*0.98)), '∇g', rgbCss(TH.curl), 0, -10, '600 12px '+FONT_UI);
    if(gm>1e-9) R.label(vadd(p, vmul(v3(al.g.x/gm,al.g.y/gm,0), Lr*1.18)), '∇f', rgbCss(TH.grad), 0, -10, '600 12px '+FONT_UI);
  }
}

/* --------------------------------------------------- basins of attraction ---- */
/* From every starting point on a grid, run capped gradient descent and colour
   the start by which minimum it reached. Chunked across frames to stay smooth. */
function basinsStart(){
  if(S.mode!=='scalar' || S.field.animated){ S.basins.job=null; return; }
  const G=S.basins.G;
  S.basins.job = { i:0, G, owner:new Int16Array(G*G).fill(-1), minima:[] };
  S.basins.img = null;
  S.show.basins = true;
}
function basinsWork(){
  const job=S.basins.job;
  if(!job || !S.field || S.mode!=='scalar') return;
  const {G}=job, L=S.extent, F=S.field;
  const eta=0.12, maxSteps=160, snap=0.22;
  const t0=performance.now();
  while(job.i < G*G && performance.now()-t0 < 6){           // ≤6 ms per frame
    const gi=job.i % G, gj=(job.i / G)|0;
    let x=-L+(gi+0.5)*2*L/G, y=L-(gj+0.5)*2*L/G;
    let ok=false;
    for(let s=0;s<maxSteps;s++){
      const g=F.at(x,y,0);
      if(!Number.isFinite(g.x+g.y)) break;
      const gm=Math.hypot(g.x,g.y);
      if(gm<1e-3){ ok=true; break; }
      const st=Math.min(eta, 0.35/gm);                      // cap the step length
      x-=g.x*st; y-=g.y*st;
      if(Math.abs(x)>L*1.4||Math.abs(y)>L*1.4) break;
    }
    if(ok){
      let id=-1;
      for(let m=0;m<job.minima.length;m++)
        if(Math.hypot(job.minima[m].x-x, job.minima[m].y-y) < snap){ id=m; break; }
      if(id<0 && job.minima.length<14){
        job.minima.push({x, y, f:F.f.ev(x,y,0), n:0});
        id=job.minima.length-1;
      }
      if(id>=0){ job.owner[job.i]=id; job.minima[id].n++; }
    }
    job.i++;
  }
  if(job.i >= G*G){
    /* paint the bitmap: one hue per basin, mixed toward the ground */
    const cv=document.createElement('canvas'); cv.width=cv.height=G;
    const ictx=cv.getContext('2d'), img=ictx.createImageData(G,G);
    const cols=job.minima.map((_,m)=>hsl2rgb((210 + m*137.5)%360, 0.52, TH.dark?0.42:0.62));
    for(let k2=0;k2<G*G;k2++){
      const o=k2*4, id=job.owner[k2];
      if(id<0){ img.data[o+3]=0; continue; }
      const c=mixRGB(TH.bg, cols[id], 0.75);
      img.data[o]=c[0]|0; img.data[o+1]=c[1]|0; img.data[o+2]=c[2]|0; img.data[o+3]=255;
    }
    ictx.putImageData(img,0,0);
    S.basins.img=cv;
    S.basins.minima=job.minima.map((m,i)=>({...m, col:cols[i]}));
    S.basins.job=null;
    refreshBasinsPanel();
  } else if(frameNo % 10 === 0) refreshBasinsPanel();
}
function drawBasins(){
  if(!is2D()) return;
  if(S.basins.img){
    const L=S.extent;
    const a=R.project(-L, L, 0), b=R.project(L, -L, 0);
    if(a&&b) R.items.push({k:6, d:1e7, img:S.basins.img, x1:a.x, y1:a.y, w:b.x-a.x, h:b.y-a.y, a:1});
  }
  for(const m of (S.basins.minima||[]))
    R.dot(v3(m.x,m.y,0), 4, rgbCss(m.col||TH.text), rgbCss(TH.bg));
}
function hsl2rgb(h,s,l){
  const f=(n)=>{ const k=(n+h/30)%12; const a=s*Math.min(l,1-l);
    return Math.round(255*(l - a*Math.max(-1, Math.min(k-3, Math.min(9-k, 1))))); };
  return [f(0), f(8), f(4)];
}

/* ------------------------------------------------------ least-squares inset ---- */
/* The demo's loss field is L(slope, intercept) for this dataset; the walker's
   position IS the candidate line. The inset draws both, live. */
