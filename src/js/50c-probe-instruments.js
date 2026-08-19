/* ============================================================================
   5 · INSTRUMENTS — the probe, the flux box and the circulation loop.
   Each one shows the *definition* being evaluated, not just its answer.
   ============================================================================ */

const inst = { flux:null, circ:null };
/* the divergence to compare against: the planar one when the domain is the plane */
const activeDiv = () => planar() ? S.field.div2 : S.field.div;
function recomputeInstruments(){
  const F=S.field, p=S.probe;
  inst.flux = planar()
    ? fluxRect(F, p, S.flux.h, Math.max(6, S.flux.m*2))
    : (S.flux.shape==='box' ? fluxBox(F, p, S.flux.h, S.flux.m)
                            : fluxSphere(F, p, S.flux.h, Math.max(6, S.flux.m)));
  inst.circ = circulation(F, p, S.circ.r, planar()? v3(0,0,1) : vnorm(S.circ.n), 96);
}

/* length used for the highlighted probe vectors, commensurate with the field arrows */
function probeVecLen(m){
  const mmax = (cache.arrows && cache.arrows.mmax) || 1;
  const r = Math.min(1, m/mmax);
  return S.extent * 0.34 * (0.28 + 0.72*Math.log(1+9*r)/Math.log(10));
}

/* where the probe marker actually sits — lifted onto the terrain in surface view */
function probeAnchor(){
  const p=S.probe;
  if(!isSurf()) return p;
  const h=surfHeight(p.x,p.y);
  return v3(p.x, p.y, h===null ? 0 : h);
}

function drawProbe(){
  const F=S.field, p=S.probe, anc=probeAnchor();
  const Fv = F.at(p.x,p.y,p.z), cu = F.curlAt(p.x,p.y,p.z);
  const mF = vlen(Fv), mC = vlen(cu);

  if(isSurf()){                       /* drop line ties the terrain point to the map */
    R.line(v3(p.x,p.y,0), anc, rgbCss(TH.faint), 1, 0.7);
    R.dot(v3(p.x,p.y,0), 2.6, rgbCss(TH.faint));
  }
  R.dot(anc, 4.5, rgbCss(TH.text), rgbCss(TH.bg));

  if(mF > 1e-9 && Number.isFinite(mF)){
    const col = S.mode==='scalar' ? rgbCss(TH.grad) : rgbCss(TH.accent);
    R.arrow(anc, vmul(Fv, probeVecLen(mF)/mF), col, 2.6);
    R.label(vadd(anc, vmul(Fv, (probeVecLen(mF)+S.extent*0.09)/mF)),
            S.mode==='scalar' ? '∇f' : 'F', col, 0, 0, '600 12px '+FONT_UI);
  }
  if(planar()){
    /* in the plane the curl is a single number, so the honest glyph is a turning
       arc — counter-clockwise for positive, clockwise for negative */
    const k = F.curl2.ev(p.x,p.y,0);
    if(Number.isFinite(k) && Math.abs(k) > 1e-9){
      const kmax = Math.max(Math.abs(k), (cache.arrows && cache.arrows.mmax) || 1);
      const rad = S.extent*0.10 + S.extent*0.14*Math.min(1, Math.abs(k)/kmax);
      const dir = k>0 ? 1 : -1, col = rgbCss(TH.curl), z = anc.z;
      const arc=[];
      for(let i=0;i<=44;i++){
        const t = dir*(i/44)*(2*Math.PI*0.78) + (dir>0?0.5:-0.5);
        arc.push(v3(p.x+rad*Math.cos(t), p.y+rad*Math.sin(t), z));
      }
      R.path(arc, col, 2.2, 0.95);
      const a=arc[arc.length-2], b=arc[arc.length-1];
      R.arrow(a, vmul(vsub(b,a), 2.4), col, 2.2, 0.95);
      R.label(v3(p.x, p.y - rad*1.34, z), '∇×F = '+fmtNear(k), col, 0, 0, '600 11px '+FONT_MONO);
    }
  } else {
    /* skip the curl arrow when the circulation loop already draws n̂ along it */
    const loopAligned = S.show.circ && mC>1e-9 && Math.abs(vdot(vnorm(cu), vnorm(S.circ.n))) > 0.97;
    if(mC > 1e-9 && Number.isFinite(mC) && !loopAligned){
      const col = rgbCss(TH.curl);
      R.arrow(p, vmul(cu, probeVecLen(mC)/mC), col, 2.6);
      R.label(vadd(p, vmul(cu, (probeVecLen(mC)+S.extent*0.09)/mC)),
              '∇×F', col, 0, -9, '600 12px '+FONT_UI);
    }
  }
}

/* -------------------------------------------------- directional derivative ---- */
/* The rate of change along û. In scalar mode that is Dûf = ∇f·û, so the picture
   is literally the projection of ∇f onto û; in vector mode the analogue is the
   vector Jû together with the signed stretching rate û·(Jû) along û.          */
function dirData(){
  const F=S.field, p=S.probe;
  const u = vnorm(S.dirU);
  const M = jacobianAt(F,p.x,p.y,p.z);
  const Ju = v3(M[0][0]*u.x+M[0][1]*u.y+M[0][2]*u.z,
                M[1][0]*u.x+M[1][1]*u.y+M[1][2]*u.z,
                M[2][0]*u.x+M[2][1]*u.y+M[2][2]*u.z);
  if(F.f){
    const g = F.at(p.x,p.y,p.z);
    return {u, ref:g, value:vdot(g,u), max:vlen(g), refName:'∇f', valName:'D<sub>û</sub> f', Ju};
  }
  return {u, ref:Ju, value:vdot(u,Ju), max:vlen(Ju), refName:'(û·∇)F', valName:'û · (û·∇)F', Ju};
}
/* the plane the polar rose is drawn in: contains û and the reference vector */
function rosePlane(d){
  if(S.dim===2) return {a:v3(1,0,0), b:v3(0,1,0)};
  let a = d.u;
  let b = vsub(d.ref, vmul(a, vdot(d.ref,a)));
  if(vlen(b) < 1e-9) b = vperp(a); else b = vnorm(b);
  return {a, b};
}
function dirValueAlong(w){
  const F=S.field, p=S.probe;
  if(F.f) return vdot(F.at(p.x,p.y,p.z), w);
  const M=jacobianAt(F,p.x,p.y,p.z);
  const Jw=v3(M[0][0]*w.x+M[0][1]*w.y+M[0][2]*w.z,
              M[1][0]*w.x+M[1][1]*w.y+M[1][2]*w.z,
              M[2][0]*w.x+M[2][1]*w.y+M[2][2]*w.z);
  return vdot(w,Jw);
}
function drawDirDeriv(){
  const F=S.field, d=dirData();
  const p = probeAnchor();
  const {a,b} = rosePlane(d);
  const posC=rgbCss(TH.pos), negC=rgbCss(TH.neg), gC=rgbCss(TH.grad), uC=rgbCss(TH.text);
  const Lref = S.extent*0.34;
  const scale = d.max>1e-12 ? Lref/d.max : 0;

  /* On the height map the directional derivative IS the slope of the terrain in
     that direction, so draw the rise-over-run triangle you would walk. The polar
     rose is skipped here — half of it would be buried inside the hill. */
  if(isSurf() && cache.surf){
    const zs = cache.surf.zs, run = S.extent*0.26;
    const climb = Math.max(-S.extent*0.9, Math.min(S.extent*0.9, d.value * zs * run));
    const lift = v3(0,0,S.extent*0.02);
    const p0  = vadd(p, lift);
    const flat= vadd(v3(p.x + d.u.x*run, p.y + d.u.y*run, p.z), lift);
    const tip = vadd(flat, v3(0,0,climb));
    R.line(p0, flat, rgbCss(TH.faint), 1.4, 0.85);
    R.line(flat, tip, d.value>=0?posC:negC, 3.2, 1);
    R.line(p0, tip, uC, 2, 0.9);
    R.dot(tip, 3, d.value>=0?posC:negC);
    R.label(vadd(flat, vmul(vsub(tip,flat),0.5)), 'rise ' + fmtNear(d.value),
            d.value>=0?posC:negC, 30, 0, '600 11px '+FONT_MONO);
    R.label(vadd(p0, vmul(vsub(flat,p0),0.5)), 'run', rgbCss(TH.faint), 0, 14, '11px '+FONT_MONO);
    R.arrow(p0, vmul(d.u, run*0.9), uC, 2.2, 0.95);
    R.label(vadd(p0, vmul(d.u, run*1.12)), 'û', uC, 0, -10, '600 12px '+FONT_UI);
    if(vlen(d.ref) > 1e-12){
      R.arrow(p0, vmul(vnorm(d.ref), run*0.95), gC, 2.4, 0.95);
      R.label(vadd(p0, vmul(vnorm(d.ref), run*1.2)), 'uphill ∇f', gC, 0, 10, '600 12px '+FONT_UI);
    }
    return;
  }

  /* the polar rose: radius = the rate of change in that direction.
     Sampling it also tells us where the rate crosses zero, which is where û
     lies along a level set — no formula needed, and it stays correct in both modes. */
  const K=120, runs=[], zeros=[];
  let run=null, prevSign=0, prevVal=0, prevDir=null;
  for(let i=0;i<=K;i++){
    const t=i/K*2*Math.PI;
    const w=vadd(vmul(a,Math.cos(t)), vmul(b,Math.sin(t)));
    const val=dirValueAlong(w);
    if(!Number.isFinite(val)){ run=null; prevDir=null; continue; }
    const sg = val>=0 ? 1 : -1;
    if(prevDir && sg!==prevSign){
      const f = prevVal/(prevVal-val);
      zeros.push(vnorm(vadd(prevDir, vmul(vsub(w,prevDir), f))));
    }
    /* plot |rate| and carry the sign in the colour: the positive and negative
       lobes then separate into the two tangent circles instead of overlapping */
    if(!run || sg!==prevSign){ run={sg, pts:[]}; runs.push(run); if(prevDir) run.pts.push(vadd(p, vmul(prevDir, Math.abs(prevVal)*scale))); }
    run.pts.push(vadd(p, vmul(w, Math.abs(val)*scale)));
    prevSign=sg; prevVal=val; prevDir=w;
  }
  for(const r of runs) if(r.pts.length>1) R.path(r.pts, r.sg>0?posC:negC, 1.6, 0.85);
  for(const z of zeros) R.line(vsub(p, vmul(z, Lref*0.9)), vadd(p, vmul(z, Lref*0.9)), rgbCss(TH.faint), 1, 0.6);

  /* û itself, and the projection of the reference vector onto it */
  R.arrow(p, vmul(d.u, Lref*0.92), uC, 2.2, 0.95);
  R.label(vadd(p, vmul(d.u, Lref*1.08)), 'û', uC, 0, 0, '600 12px '+FONT_UI);

  if(vlen(d.ref) > 1e-12){
    R.arrow(p, vmul(d.ref, scale), gC, 2.4, 0.95);
    R.label(vadd(p, vmul(d.ref, scale*1.14)), d.refName, gC, 0, 0, '600 12px '+FONT_UI);
    /* the component itself, drawn along û — this segment IS the value */
    const foot = vadd(p, vmul(d.u, d.value*scale));
    R.line(p, foot, d.value>=0?posC:negC, 4.5, 0.95);
    R.line(vadd(p, vmul(d.ref, scale)), foot, rgbCss(TH.faint), 1, 0.8);   // drop line
    R.dot(foot, 3.2, d.value>=0?posC:negC);
    R.label(vadd(foot, vmul(d.u, Lref*0.13)), fmtNear(d.value), d.value>=0?posC:negC, 0, -11, '600 11px '+FONT_MONO);
  }
}

/* ------------------------------------------------ gradient-descent walkers ---- */
/* Optimization made visible: discrete steps x ← x − η∇f(x) from wherever the
   probe was, with the path left on the terrain. In vector mode the walker
   follows F itself — which is only "descent" if F has a potential, i.e. no curl.
   A race pits plain GD against a heavy-ball momentum twin from the same start. */
