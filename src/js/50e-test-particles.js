const FITDATA = [[-1.8,-1.1],[-1.2,-0.4],[-0.6,-0.5],[0,0.3],[0.5,0.7],[1.1,0.9],[1.6,1.7],[2,1.9]];
function drawFitInset(){
  const box=$('fitBox');
  if(!box) return;
  if(!S.fit.active || !S.desc.walkers.length){ box.style.display='none'; return; }
  box.style.display='';
  const cv=$('fitCv'), ctx=cv.getContext('2d');
  const W=cv.width, H=cv.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle=rgbCss(TH.bg3||TH.bg); ctx.fillRect(0,0,W,H);
  const X=t=>(t+2.3)/4.6*W, Y=v=>H-(v+2.3)/4.6*H;
  ctx.strokeStyle=rgbCss(TH.line2,1); ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(X(-2.3),Y(0)); ctx.lineTo(X(2.3),Y(0));
  ctx.moveTo(X(0),Y(-2.3)); ctx.lineTo(X(0),Y(2.3)); ctx.stroke();
  const w=S.desc.walkers[0], p=w.path[w.path.length-1];   // (slope, intercept)
  ctx.strokeStyle=rgbCss(TH.grad); ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(X(-2.3), Y(p.x*-2.3+p.y)); ctx.lineTo(X(2.3), Y(p.x*2.3+p.y)); ctx.stroke();
  ctx.fillStyle=rgbCss(TH.pos);
  for(const [tx,ty] of FITDATA){
    ctx.beginPath(); ctx.arc(X(tx), Y(ty), 3, 0, 6.2832); ctx.fill();
  }
  $('fitLbl').textContent = `y = ${fmtNum(p.x,3)}·x ${p.y>=0?'+':'−'} ${fmtNum(Math.abs(p.y),3)}   ·   loss ${fmtNear(S.field.f ? S.field.f.ev(p.x,p.y,0) : NaN)}`;
}

/* ------------------------------------------------------- test particles ---- */
/* Newton's second law with a real integrator. This is where kinematics lives:
   the trail IS x(t), and the readouts watch what the laws say is conserved. */
function partAccelAt(x, v){
  const F=S.field, cfg=S.part;
  if(S.mode==='scalar'){
    const g=F.at(x.x, x.y, x.z);                    // f is potential energy: F = −∇f
    return vmul(g, -1/cfg.m);
  }
  if(cfg.interp==='lorentz'){
    const B = planar() ? v3(0, 0, F.R.ev(x.x, x.y, 0)) : F.at(x.x, x.y, x.z);
    const Fl = vadd(cfg.E, vcross(v, B));           // q(E + v×B)
    return vmul(Fl, cfg.q/cfg.m);
  }
  return vmul(F.at(x.x, x.y, x.z), 1/cfg.m);
}
function partEnergy(b){
  const KE = 0.5*S.part.m*vlen(b.v)**2;
  const U = S.mode==='scalar' && S.field.f ? S.field.f.ev(b.x.x, b.x.y, b.x.z) : null;
  return {KE, U, E: U===null ? KE : KE+U};
}
function partLz(b){ return S.part.m*(b.x.x*b.v.y - b.x.y*b.v.x); }
function partLaunch(){
  if(S.part.bodies.length>=5) S.part.bodies.shift();
  const z0 = planar() ? 0 : S.probe.z;
  const b = {
    x: v3(S.probe.x, S.probe.y, z0),
    v: v3(S.part.v.x, S.part.v.y, planar()? (S.part.interp==='lorentz'?0:0) : S.part.v.z),
    trail: [], alive:true, steps:0
  };
  b.trail.push(v3(b.x.x,b.x.y,b.x.z));
  b.E0 = partEnergy(b).E;
  b.L0 = partLz(b);
  S.part.bodies.push(b);
  S.part.run = true;
}
function partAdvance(dt){
  if(!S.field) return;
  const H = 0.008;
  const steps = Math.max(1, Math.min(60, Math.round(dt*S.part.simSpeed/H)));
  const L = S.extent*1.7;
  for(const b of S.part.bodies){
    if(!b.alive) continue;
    for(let s=0;s<steps;s++){
      const r = rk4Part(b.x, b.v, H, partAccelAt);
      if(!Number.isFinite(r.x.x+r.x.y+r.x.z+r.v.x+r.v.y+r.v.z)){ b.alive=false; break; }
      b.x=r.x; b.v=r.v;
      if(planar()){ b.x.z=0; if(S.mode!=='vector'||S.part.interp!=='lorentz') b.v.z=0; else b.v.z=0; }
      if(Math.abs(b.x.x)>L||Math.abs(b.x.y)>L||Math.abs(b.x.z)>L){ b.alive=false; break; }
      b.steps++;
      if(b.steps%2===0){ b.trail.push(v3(b.x.x,b.x.y,b.x.z)); if(b.trail.length>900) b.trail.shift(); }
    }
  }
}
function drawParticles(){
  if(!S.part.bodies.length) return;
  const col=rgbCss(TH.warn);
  const lift = pt => isSurf() ? v3(pt.x, pt.y, (surfHeight(pt.x,pt.y)||0)+S.extent*0.03) : pt;
  for(const b of S.part.bodies){
    if(b.trail.length>1) R.path(b.trail.map(lift), col, 2, 0.85);
    const hd=lift(b.x);
    R.dot(hd, 4.4, col, rgbCss(TH.bg));
    const sp=vlen(b.v);
    if(b.alive && sp>1e-9){
      const cap=S.extent*0.4;
      R.arrow(hd, vmul(b.v, Math.min(cap, sp*0.42)/sp), rgbCss(TH.text), 1.8, 0.9);
    }
  }
}

/* ---------------------------------------------------------- physics glyphs ---- */
function drawPhysGlyphs(){
  if(!S.phys.applied || !S.phys.objects.length) return;
  const L=S.extent;
  for(const o of S.phys.objects){
    const op=o.pos||{};
    const p=v3(op.x||0, op.y||0, op.z||0);
    if(o.type==='charge'){
      const col = o.q>=0 ? rgbCss(TH.pos) : rgbCss(TH.neg);
      R.dot(p, 6, col, rgbCss(TH.bg));
      R.label(p, o.q>=0?'+':'−', rgbCss(TH.bg), 0, 0, '700 11px '+FONT_UI);
      R.label(p, 'q = '+num2s(o.q), col, 0, -16, '600 10px '+FONT_MONO);
    } else if(o.type==='mass'){
      R.dot(p, 6.5, rgbCss(TH.dim), rgbCss(TH.text));
      R.label(p, 'M = '+num2s(o.M), rgbCss(TH.dim), 0, -16, '600 10px '+FONT_MONO);
    } else if(o.type==='wire'){
      const ax=o.axis||'z';
      const dir=v3(ax==='x'?1:0, ax==='y'?1:0, ax==='z'?1:0);
      const a=vsub(p, vmul(dir,L)), b=vadd(p, vmul(dir,L));
      R.line(a, b, rgbCss(TH.warn||[224,179,65]), 3, 0.9);
      R.arrow(vadd(p, vmul(dir, L*0.55)), vmul(dir, (o.I>=0?1:-1)*L*0.3), rgbCss(TH.warn||[224,179,65]), 2.4, 0.95);
      R.label(vadd(p, vmul(dir, L*0.55)), 'I = '+num2s(o.I), rgbCss(TH.dim), 16, -10, '600 10px '+FONT_MONO);
    } else if(o.type==='dipole'){
      const ax=o.axis||'z';
      const dir=v3(ax==='x'?1:0, ax==='y'?1:0, ax==='z'?1:0);
      const s=(o.m>=0?1:-1)*S.extent*0.28;
      R.arrow(vsub(p, vmul(dir,s/2)), vmul(dir,s), rgbCss(TH.curl), 3, 0.95);
      R.label(p, 'm', rgbCss(TH.curl), 12, -10, '600 11px '+FONT_UI);
    } else if(o.type==='uniform'){
      /* three faint parallel arrows in a corner say "background field" */
      const u=vnorm(v3(o.v.x,o.v.y,o.v.z)); if(vlen(u)<1e-9) continue;
      for(let i=0;i<3;i++)
        R.arrow(v3(-L*0.9, -L*0.9+i*0.3, L*0.9), vmul(u, L*0.28), rgbCss(TH.faint), 1.6, 0.8);
    } else if(o.type==='antenna'){
      R.dot(p, 4.5, rgbCss(TH.accent), rgbCss(TH.bg));
      for(const rr of [0.18,0.34]){
        const ring=[]; for(let i=0;i<=40;i++){ const a2=i/40*2*Math.PI; ring.push(v3(p.x+rr*Math.cos(a2), p.y+rr*Math.sin(a2), 0)); }
        R.path(ring, rgbCss(TH.accent), 1, 0.5);
      }
    } else if(o.type==='array'){
      const ax=o.axis||'y';
      for(let i=0;i<o.N;i++){
        const off=(i-(o.N-1)/2)*o.d;
        R.dot(v3(p.x+(ax==='x'?off:0), p.y+(ax==='y'?off:0), 0), 4, rgbCss(TH.accent), rgbCss(TH.bg));
      }
    }
  }
}

/* ------------------------------------------------------------- flux box ---- */
