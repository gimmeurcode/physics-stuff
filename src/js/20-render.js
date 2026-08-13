/* ============================================================================
   2 · RENDERER — a small purpose-built 3D engine on Canvas 2D.
   No WebGL and no library: the artifact CSP forbids external scripts, and a
   depth-sorted painter's pass is a good fit for arrows, rings and translucent
   quads, which is all this scene ever contains.
   ============================================================================ */

/* ---- vec3 (declared before the renderer, which uses it in its initialiser) ---- */
const v3    = (x,y,z)=>({x,y,z});
const vadd  = (a,b)=>({x:a.x+b.x, y:a.y+b.y, z:a.z+b.z});
const vsub  = (a,b)=>({x:a.x-b.x, y:a.y-b.y, z:a.z-b.z});
const vmul  = (a,s)=>({x:a.x*s, y:a.y*s, z:a.z*s});
const vdot  = (a,b)=>a.x*b.x + a.y*b.y + a.z*b.z;
const vcross= (a,b)=>({x:a.y*b.z-a.z*b.y, y:a.z*b.x-a.x*b.z, z:a.x*b.y-a.y*b.x});
const vlen  = a=>Math.hypot(a.x,a.y,a.z);
function vnorm(a){ const L=vlen(a); return L>1e-12 ? vmul(a,1/L) : v3(0,0,0); }
/* any unit vector perpendicular to n */
function vperp(n){
  const t = Math.abs(n.z) < 0.9 ? v3(0,0,1) : v3(1,0,0);
  return vnorm(vcross(t,n));
}

/* ---- colour helpers ---- */
function hexRGB(h){
  h = h.trim();
  if(h.startsWith('#')){
    if(h.length===4) h = '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
    return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  }
  const m = h.match(/-?\d+(\.\d+)?/g);
  return m ? [ +m[0], +m[1], +m[2] ] : [128,128,128];
}
const mixRGB = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
const rgbCss = (c,a)=> a===undefined || a>=1
  ? `rgb(${c[0]|0},${c[1]|0},${c[2]|0})`
  : `rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;

function rampAt(stops, t){
  t = Math.max(0, Math.min(1, t));
  const n = stops.length - 1, i = Math.min(n-1, Math.floor(t*n));
  return mixRGB(stops[i], stops[i+1], t*n - i);
}

/* Theme tokens are the single source of truth; the canvas reads them back. */
const TH = {};
function readTheme(){
  const cs = getComputedStyle(document.documentElement);
  const g = k => cs.getPropertyValue(k);
  TH.bg    = hexRGB(g('--bg'));
  TH.line  = hexRGB(g('--line'));
  TH.line2 = hexRGB(g('--line2'));
  TH.text  = hexRGB(g('--text'));
  TH.dim   = hexRGB(g('--dim'));
  TH.faint = hexRGB(g('--faint'));
  TH.accent= hexRGB(g('--accent'));
  TH.mid   = hexRGB(g('--mid'));
  TH.grad  = hexRGB(g('--c-grad'));
  TH.pos   = hexRGB(g('--c-pos'));
  TH.neg   = hexRGB(g('--c-neg'));
  TH.curl  = hexRGB(g('--c-curl'));
  TH.warn  = hexRGB(g('--c-warn'));
  TH.bg3   = hexRGB(g('--bg3'));
  TH.dark  = (TH.bg[0]+TH.bg[1]+TH.bg[2]) < 380;
  /* sequential ramp for |F| — reads on either ground */
  TH.seq = TH.dark
    ? [[58,84,150],[45,132,166],[53,168,142],[140,187,78],[229,169,60],[222,107,69]]
    : [[46,74,140],[36,120,158],[28,150,124],[122,168,60],[206,146,40],[198,88,52]];
}
const rampSeq = t => rampAt(TH.seq, t);
/* diverging: negative → theme neutral → positive, for signed scalars */
function rampDiv(t){
  t = Math.max(-1, Math.min(1, t));
  return t < 0 ? mixRGB(TH.mid, TH.neg, -t) : mixRGB(TH.mid, TH.pos, t);
}

/* ---- the renderer ---- */
const R = {
  cv:null, ctx:null, W:0, H:0, dpr:1,
  cam:{ tx:0, ty:0, tz:0, az:0.62, el:0.42, dist:9.5, fov:0.85 },
  mode2d:false, extent:3,
  items:[], focal:1, eye:v3(0,0,0), fwd:v3(0,0,0), right:v3(0,0,0), up:v3(0,0,0),
  scale2d:1,

  attach(cv){
    this.cv = cv; this.ctx = cv.getContext('2d');
    this.resize();
  },
  resize(){
    const rect = this.cv.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = Math.max(1, Math.round(rect.width));
    this.H = Math.max(1, Math.round(rect.height));
    this.cv.width  = Math.round(this.W * this.dpr);
    this.cv.height = Math.round(this.H * this.dpr);
  },

  /* rebuild the camera basis; call once per frame before projecting */
  begin(){
    const c = this.cam;
    c.el = Math.max(-1.52, Math.min(1.52, c.el));
    const t = v3(c.tx, c.ty, c.tz);
    if(this.mode2d){
      this.scale2d = Math.min(this.W, this.H) / (2 * this.extent * 1.12) * (9.5 / c.dist);
    } else {
      const dir = v3(Math.cos(c.el)*Math.cos(c.az), Math.cos(c.el)*Math.sin(c.az), Math.sin(c.el));
      this.eye   = vadd(t, vmul(dir, c.dist));
      this.fwd   = vmul(dir, -1);
      this.right = vnorm(vcross(this.fwd, v3(0,0,1)));
      this.up    = vcross(this.right, this.fwd);
      this.focal = (this.H/2) / Math.tan(c.fov/2);
    }
    this.items.length = 0;
  },

  /* world → screen. returns null when behind the eye. */
  project(x,y,z){
    if(this.mode2d){
      const c=this.cam, s=this.scale2d;
      return { x:this.W/2 + (x-c.tx)*s, y:this.H/2 - (y-c.ty)*s, d:0, s };
    }
    const vx=x-this.eye.x, vy=y-this.eye.y, vz=z-this.eye.z;
    const d = vx*this.fwd.x + vy*this.fwd.y + vz*this.fwd.z;
    if(d < 0.05) return null;
    const s = this.focal / d;
    return {
      x: this.W/2 + (vx*this.right.x + vy*this.right.y + vz*this.right.z) * s,
      y: this.H/2 - (vx*this.up.x    + vy*this.up.y    + vz*this.up.z   ) * s,
      d, s
    };
  },
  /* screen px per world unit at a given depth */
  pxPerUnit(d){ return this.mode2d ? this.scale2d : this.focal / Math.max(0.05, d); },

  /* ---- primitives: each pushes a pre-projected record, sorted later ---- */
  line(a, b, col, w, alpha){
    const A=this.project(a.x,a.y,a.z), B=this.project(b.x,b.y,b.z);
    if(!A||!B) return;
    this.items.push({k:0, d:(A.d+B.d)/2, x1:A.x, y1:A.y, x2:B.x, y2:B.y, c:col, w:w||1, a:alpha===undefined?1:alpha});
  },
  arrow(base, vec, col, w, alpha){
    const tip = vadd(base, vec);
    const A=this.project(base.x,base.y,base.z), B=this.project(tip.x,tip.y,tip.z);
    if(!A||!B) return;
    const dx=B.x-A.x, dy=B.y-A.y, L=Math.hypot(dx,dy);
    if(!(L>0.7) || !Number.isFinite(L)) return;
    const ux=dx/L, uy=dy/L;
    const hl = Math.max(3.2, Math.min(13, L*0.34)), hw = hl*0.44;
    this.items.push({
      k:1, d:(A.d+B.d)/2, x1:A.x, y1:A.y,
      x2:B.x-ux*hl*0.72, y2:B.y-uy*hl*0.72,     // shaft stops inside the head
      tx:B.x, ty:B.y,
      ax:B.x-ux*hl+(-uy)*hw, ay:B.y-uy*hl+(ux)*hw,
      bx:B.x-ux*hl-(-uy)*hw, by:B.y-uy*hl-(ux)*hw,
      c:col, w:w||1.35, a:alpha===undefined?1:alpha
    });
  },
  poly(pts, fill, stroke, w, alpha){
    const P=[]; let dsum=0;
    for(const p of pts){ const q=this.project(p.x,p.y,p.z); if(!q) return; P.push(q); dsum+=q.d; }
    this.items.push({k:2, d:dsum/P.length, p:P, f:fill, s:stroke, w:w||1, a:alpha===undefined?1:alpha});
  },
  path(pts, col, w, alpha, depthOverride){
    const P=[]; let dsum=0;
    for(const p of pts){ const q=this.project(p.x,p.y,p.z); if(!q) return; P.push(q); dsum+=q.d; }
    if(P.length<2) return;
    this.items.push({k:3, d:depthOverride!==undefined?depthOverride:dsum/P.length, p:P, c:col, w:w||1, a:alpha===undefined?1:alpha});
  },
  dot(p, rpx, col, ring, alpha){
    const A=this.project(p.x,p.y,p.z); if(!A) return;
    this.items.push({k:4, d:A.d, x1:A.x, y1:A.y, r:rpx, c:col, s:ring, a:alpha===undefined?1:alpha});
  },
  label(p, str, col, dx, dy, font){
    const A=this.project(p.x,p.y,p.z); if(!A) return;
    /* pull labels well forward: a single mesh quad must never swallow one */
    this.items.push({k:5, d:A.d - Math.max(0.08, A.d*0.035), x1:A.x+(dx||0), y1:A.y+(dy||0), t:str, c:col, fnt:font});
  },

  /* ---- painter's pass ---- */
  flush(){
    const ctx=this.ctx, dpr=this.dpr, LW=this.W, LH=this.H;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,this.W,this.H);
    ctx.fillStyle = rgbCss(TH.bg);
    ctx.fillRect(0,0,this.W,this.H);
    ctx.lineCap='round'; ctx.lineJoin='round';

    this.items.sort((a,b)=>b.d-a.d);          // far to near
    let alpha = -1;
    for(const it of this.items){
      if(it.a !== alpha){ ctx.globalAlpha = alpha = it.a; }
      switch(it.k){
        case 0:
          ctx.strokeStyle=it.c; ctx.lineWidth=it.w;
          ctx.beginPath(); ctx.moveTo(it.x1,it.y1); ctx.lineTo(it.x2,it.y2); ctx.stroke();
          break;
        case 1:
          ctx.strokeStyle=it.c; ctx.lineWidth=it.w;
          ctx.beginPath(); ctx.moveTo(it.x1,it.y1); ctx.lineTo(it.x2,it.y2); ctx.stroke();
          ctx.fillStyle=it.c;
          ctx.beginPath(); ctx.moveTo(it.tx,it.ty); ctx.lineTo(it.ax,it.ay); ctx.lineTo(it.bx,it.by); ctx.closePath(); ctx.fill();
          break;
        case 2: {
          ctx.beginPath(); ctx.moveTo(it.p[0].x,it.p[0].y);
          for(let i=1;i<it.p.length;i++) ctx.lineTo(it.p[i].x,it.p[i].y);
          ctx.closePath();
          if(it.f){ ctx.fillStyle=it.f; ctx.fill(); }
          if(it.s){ ctx.strokeStyle=it.s; ctx.lineWidth=it.w; ctx.stroke(); }
          break;
        }
        case 3:
          ctx.strokeStyle=it.c; ctx.lineWidth=it.w;
          ctx.beginPath(); ctx.moveTo(it.p[0].x,it.p[0].y);
          for(let i=1;i<it.p.length;i++) ctx.lineTo(it.p[i].x,it.p[i].y);
          ctx.stroke();
          break;
        case 4:
          ctx.fillStyle=it.c;
          ctx.beginPath(); ctx.arc(it.x1,it.y1,it.r,0,6.2832); ctx.fill();
          if(it.s){ ctx.strokeStyle=it.s; ctx.lineWidth=1.5; ctx.stroke(); }
          break;
        case 5: {
          ctx.font = it.fnt || '11px ' + FONT_UI;
          ctx.textAlign='center'; ctx.textBaseline='middle';
          /* A projected label can land off the canvas even when the thing it
             names is on it: the tip of the z axis rises above the top edge on a
             short window, and a vector's label follows the vector off the side.
             Pin it to the edge instead of losing it — an axis with no letter on
             it is the one drawing error nothing else in the suite can see.
             The size is read with a regex, not parseFloat: these font strings
             are '600 11px …' and parseFloat returns the weight. */
          const fm = /(\d+(?:\.\d+)?)px/.exec(ctx.font), fs = fm ? parseFloat(fm[1]) : 11;
          const hw = ctx.measureText(it.t).width / 2 + 3, hh = fs * 0.7 + 2;
          const lx = Math.max(hw, Math.min(LW - hw, it.x1));
          const ly = Math.max(hh, Math.min(LH - hh, it.y1));
          ctx.lineWidth=3; ctx.strokeStyle=rgbCss(TH.bg,0.82);
          ctx.strokeText(it.t, lx, ly);              // halo keeps labels legible
          ctx.fillStyle=it.c;
          ctx.fillText(it.t, lx, ly);
          break;
        }
        case 6:
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(it.img, it.x1, it.y1, it.w, it.h);
          break;
      }
    }
    ctx.globalAlpha = 1;
  }
};
const FONT_UI = '"Segoe UI Variable Text","Segoe UI",system-ui,sans-serif';
const FONT_MONO = '"Cascadia Mono",Consolas,ui-monospace,monospace';

/* ---- orbit / pan / zoom / probe drag ----
   Pressing down within grab range of the probe dot enters probe-drag mode:
   the pointer moves the probe continuously and the camera stays put. */
function installControls(cv, onChange, onPick, probeScreen){
  let dragging=false, moved=0, lx=0, ly=0, panning=false, probing=false;
  const pointers = new Map();
  let pinchDist = 0;
  let plotPan = null;                       // the plot a Shift-drag is moving

  /* Which flat plot the pointer is over, or null. Only meaningful while a stage
     is showing: the field pipeline owns the canvas otherwise and its own camera
     handles the wheel. See 59c-plot-view.js for the registry. */
  const plotUnder = e => {
    if(typeof stageActive !== 'function' || !stageActive()) return null;
    const r = cv.getBoundingClientRect();
    return pvAt(e.clientX - r.left, e.clientY - r.top);
  };

  cv.addEventListener('pointerdown', e=>{
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pointers.size===1){
      dragging=true; moved=0; lx=e.clientX; ly=e.clientY;
      panning = e.shiftKey || e.button===1;
      probing = false;
      /* Shift-drag moves the picture. It is behind a modifier because a plain
         drag already means something on most stages — placing a charge, pulling
         a probe, sketching a curve — and taking that over would break them. */
      plotPan = (e.shiftKey || e.button===1) ? plotUnder(e) : null;
      if(plotPan){ PV_FOCUS = plotPan.key; cv.classList.add('drag'); return; }
      if(!panning && probeScreen){
        const ps = probeScreen();
        /* 'drag': a stage wants every pointer press and move, not a hit test */
        if(ps === 'drag'){ probing = true; if(onPick) onPick(e, 'down'); }
        else if(ps){
          const rect=cv.getBoundingClientRect();
          if(Math.hypot(e.clientX-rect.left-ps.x, e.clientY-rect.top-ps.y) < 16) probing = true;
        }
      }
      cv.classList.add('drag');
    } else if(pointers.size===2){
      probing=false;
      const [a,b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x-b.x, a.y-b.y);
    }
  });
  cv.addEventListener('pointermove', e=>{
    if(!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, {x:e.clientX, y:e.clientY});
    if(pointers.size===2){
      const [a,b] = [...pointers.values()];
      const d = Math.hypot(a.x-b.x, a.y-b.y);
      if(pinchDist>0){ R.cam.dist = Math.max(1.2, Math.min(40, R.cam.dist * pinchDist/d)); onChange(); }
      pinchDist = d; return;
    }
    if(!dragging) return;
    const dx=e.clientX-lx, dy=e.clientY-ly;
    lx=e.clientX; ly=e.clientY; moved += Math.abs(dx)+Math.abs(dy);
    if(plotPan){ pvPanBy(plotPan, dx, dy); pvSyncBoxes(); return; }
    if(probing){ if(onPick) onPick(e, 'move'); return; }
    if(R.mode2d){                                  // nothing to orbit in the plane
      const k = 1/R.scale2d;
      R.cam.tx -= dx*k; R.cam.ty += dy*k;
    } else if(panning){
      const k = R.cam.dist*0.0016;
      const mv = vadd(vmul(R.right, -dx*k), vmul(R.up, dy*k));
      R.cam.tx += mv.x; R.cam.ty += mv.y; R.cam.tz += mv.z;
    } else {
      R.cam.az -= dx*0.0062;
      R.cam.el = Math.max(-1.52, Math.min(1.52, R.cam.el + dy*0.0062));
    }
    onChange();
  });
  const end = e=>{
    pointers.delete(e.pointerId);
    if(pointers.size===0){
      /* a Shift-drag was a view move, never a click on the experiment */
      if(plotPan){ plotPan=null; dragging=false; probing=false; cv.classList.remove('drag'); return; }
      if(dragging && !probing && moved < 4 && onPick) onPick(e);
      else if(probing && onPick) onPick(e, 'up');
      dragging=false; probing=false; cv.classList.remove('drag');
    }
    if(pointers.size<2) pinchDist=0;
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('wheel', e=>{
    e.preventDefault();
    /* Over a flat plot the wheel is a magnifier on that plot; everywhere else it
       is the camera dolly it has always been. Zooming about the cursor rather
       than the centre is what makes it usable — the point you are looking at is
       the point that stays still. */
    const P = plotUnder(e);
    if(P){
      const r = cv.getBoundingClientRect();
      pvZoomAt(P, e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016));
      PV_FOCUS = P.key;
      pvSyncBoxes();
      return;
    }
    R.cam.dist = Math.max(1.2, Math.min(40, R.cam.dist * Math.exp(e.deltaY*0.0011)));
    onChange();
  }, {passive:false});
}
