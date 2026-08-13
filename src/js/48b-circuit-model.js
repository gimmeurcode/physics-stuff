/* ============================================================================
   2 · THE COMPONENT CATALOGUE
   Pin positions are in grid units relative to the component centre, with y
   pointing up, and are the single source of truth for both the drawing code
   and the netlist extractor — so what you see wired is what is solved.
   ============================================================================ */

const CK_KINDS = {
  R:     { np:2, sym:'R', name:'resistor',            unit:'Ω' },
  C:     { np:2, sym:'C', name:'capacitor',           unit:'F' },
  L:     { np:2, sym:'L', name:'inductor',            unit:'H' },
  V:     { np:2, sym:'V', name:'voltage source',      unit:'V' },
  I:     { np:2, sym:'I', name:'current source',      unit:'A' },
  D:     { np:2, sym:'D', name:'diode',               unit:''  },
  SW:    { np:2, sym:'S', name:'switch',              unit:''  },
  SWV:   { np:4, sym:'SV',name:'voltage-controlled switch', unit:'' },
  XFMR:  { np:4, sym:'T', name:'transformer',         unit:''  },
  XFMRI: { np:4, sym:'TI',name:'ideal transformer',   unit:''  },
  OPAMP: { np:3, sym:'U', name:'op amp',              unit:''  },
  VCVS:  { np:4, sym:'E', name:'voltage-controlled voltage source', unit:'' },
  VCCS:  { np:4, sym:'G', name:'voltage-controlled current source', unit:'' },
  CCVS:  { np:2, sym:'H', name:'current-controlled voltage source', unit:'' },
  CCCS:  { np:2, sym:'F', name:'current-controlled current source', unit:'' },
  GND:   { np:1, sym:'0', name:'ground',              unit:''  },
  M:     { np:0, sym:'K', name:'mutual coupling',     unit:''  }
};

const CK_DEFAULTS = {
  R:     { val:1e3 },
  C:     { val:1e-6, ic:0 },
  L:     { val:1e-3, esr:0, ic:0 },
  V:     { wave:'dc', val:5, amp:5, freq:1e3, phase:0, off:0, duty:0.5, tr:0.02,
           tau:1e-3, t0:0, pw:1e-3, rate:0, fm:100, depth:0.5, rs:0, expr:'5*sin(2*pi*1000*t)' },
  I:     { wave:'dc', val:1e-3, amp:1e-3, freq:1e3, phase:0, off:0, duty:0.5, tr:0.02,
           tau:1e-3, t0:0, pw:1e-3, rate:0, fm:100, depth:0.5, expr:'0.001*sin(2*pi*1000*t)' },
  D:     { is:1e-14, nn:1 },
  SW:    { closed:false, ron:0.01, roff:1e9, mode:'manual', ton:1e-3, toff:2e-3, period:0 },
  SWV:   { ron:0.01, roff:1e9, vth:2.5, vhys:0.2 },
  /* real windings have resistance, and saying so is not a fudge: an ideal
     inductor across an ideal source is a genuinely singular problem */
  XFMR:  { l1:1e-2, l2:1e-2, k:0.99, r1:0.5, r2:0.5 },
  XFMRI: { ratio:2 },
  OPAMP: { a0:2e5, fp:10, slew:5e5, vsat:15, rout:75, ideal:false },
  VCVS:  { gain:2 },
  VCCS:  { gain:1e-3 },
  CCVS:  { gain:100, ctl:'V1' },
  CCCS:  { gain:10,  ctl:'V1' },
  GND:   {},
  M:     { a:'L1', b:'L2', k:0.7 }
};

/* pin offsets, unrotated */
const CK_PINS2 = [[-1, 0], [1, 0]];
const CK_PINS4 = [[-1, 1], [-1, -1], [1, 1], [1, -1]];      /* [c+ c− | o+ o−] */
function ckPinBase(kind){
  if(kind === 'GND')   return [[0, 0]];
  if(kind === 'M')     return [];
  if(kind === 'OPAMP') return [[-2, -1], [-2, 1], [2, 0]];   /* in+, in−, out */
  return CK_KINDS[kind] && CK_KINDS[kind].np === 4 ? CK_PINS4 : CK_PINS2;
}
function ckRotXY(dx, dy, rot){
  switch(((rot | 0) % 360 + 360) % 360){
    case 90:  return [-dy,  dx];
    case 180: return [-dx, -dy];
    case 270: return [ dy, -dx];
    default:  return [ dx,  dy];
  }
}
function ckPins(c){
  return ckPinBase(c.kind).map(o => {
    const r = ckRotXY(o[0], o[1], c.rot || 0);
    return { x: c.x + r[0], y: c.y + r[1] };
  });
}
/* the label a pin carries, for tooltips and the readout */
function ckPinName(kind, i){
  if(kind === 'OPAMP') return ['in +', 'in −', 'out'][i];
  if(kind === 'XFMR' || kind === 'XFMRI') return ['pri +', 'pri −', 'sec +', 'sec −'][i];
  if(kind === 'VCVS' || kind === 'VCCS')  return ['ctl +', 'ctl −', 'out +', 'out −'][i];
  if(kind === 'SWV') return ['ctl +', 'ctl −', 'contact', 'contact'][i];
  return i === 0 ? 'pin 1' : 'pin 2';
}

/* Whether a switch is conducting right now. Time switches are a pure function
   of t; the voltage-controlled one carries hysteresis, so its state is latched
   between timesteps rather than inside the Newton loop — a switch that could
   flip mid-iteration would never converge. */
function ckSwitchOn(e, t){
  const c = e.c;
  if(e.kind === 'SWV') return !!e.swOn;
  if(c.mode === 'time'){
    const p = c.period || 0;
    const u = p > 0 ? ((t % p) + p) % p : t;
    const on = c.ton || 0, off = (c.toff === undefined || c.toff === null) ? Infinity : c.toff;
    return off >= on ? (u >= on && u < off) : (u >= on || u < off);
  }
  return !!c.closed;
}
const ckSwitchG = (e, t) => 1 / (ckSwitchOn(e, t) ? Math.max(1e-6, e.c.ron) : Math.max(1e3, e.c.roff));

function ckNewComp(kind, x, y, name, over){
  const c = Object.assign({ kind, name, x, y, rot: 0 }, CK_DEFAULTS[kind] || {}, over || {});
  if(c.wave === 'expr') ckCompileExpr(c);
  return c;
}
/* R1, R2, C1 … — the next free designator of this kind */
function ckAutoName(sch, kind){
  const p = CK_KINDS[kind].sym;
  let n = 1;
  while(sch.comps.some(c => c.name === p + n)) n++;
  return p + n;
}
function ckNewSch(comps, wires){
  return { comps: (comps || []).map(c => ckNewComp(c.kind, c.x, c.y, c.name, c)),
           wires: (wires || []).map(w => ({ a:{x:w.a.x, y:w.a.y}, b:{x:w.b.x, y:w.b.y} })) };
}
const ckClone = sch => ckNewSch(sch.comps, sch.wires);

/* ============================================================================
   3 · GEOMETRY → NETLIST
   Two points are the same node when they coincide, when a wire joins them, or
   when one lands on the interior of a wire (a T junction). Crossing wires that
   share no endpoint are NOT connected, exactly as on paper.
   ============================================================================ */

const ckKey = p => Math.round(p.x * 2) + ':' + Math.round(p.y * 2);

function ckOnSegment(p, w){
  const eps = 0.02;
  if(p.x < Math.min(w.a.x, w.b.x) - eps || p.x > Math.max(w.a.x, w.b.x) + eps) return false;
  if(p.y < Math.min(w.a.y, w.b.y) - eps || p.y > Math.max(w.a.y, w.b.y) + eps) return false;
  const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, L2 = dx * dx + dy * dy;
  if(L2 < 1e-9) return Math.hypot(p.x - w.a.x, p.y - w.a.y) < eps;
  const u = ((p.x - w.a.x) * dx + (p.y - w.a.y) * dy) / L2;
  return Math.abs(p.x - (w.a.x + u * dx)) < eps && Math.abs(p.y - (w.a.y + u * dy)) < eps;
}

function ckNodeMap(sch){
  const parent = new Map();
  const add = k => { if(!parent.has(k)) parent.set(k, k); return k; };
  const find = k => { let r = add(k); while(parent.get(r) !== r) r = parent.get(r);
                      while(parent.get(k) !== r){ const nx = parent.get(k); parent.set(k, r); k = nx; } return r; };
  const uni = (a, b) => { const ra = find(a), rb = find(b); if(ra !== rb) parent.set(ra, rb); };

  const pts = [];                                  /* every electrically real point */
  for(const c of sch.comps) for(const p of ckPins(c)){ add(ckKey(p)); pts.push(p); }
  for(const w of sch.wires){ add(ckKey(w.a)); add(ckKey(w.b)); pts.push(w.a, w.b); }
  for(const w of sch.wires) uni(ckKey(w.a), ckKey(w.b));
  /* T junctions: an endpoint or pin sitting on another wire */
  for(const w of sch.wires) for(const p of pts){
    const k = ckKey(p);
    if(k === ckKey(w.a) || k === ckKey(w.b)) continue;
    if(ckOnSegment(p, w)) uni(k, ckKey(w.a));
  }

  const grounds = sch.comps.filter(c => c.kind === 'GND');
  for(let i = 1; i < grounds.length; i++) uni(ckKey(ckPins(grounds[0])[0]), ckKey(ckPins(grounds[i])[0]));

  /* count how many things attach to each root, so a groundless circuit can pick
     its reference sensibly instead of failing */
  const pop = new Map();
  for(const p of pts){ const r = find(ckKey(p)); pop.set(r, (pop.get(r) || 0) + 1); }

  let warn = '';
  let gRoot = null;
  if(grounds.length) gRoot = find(ckKey(ckPins(grounds[0])[0]));
  else {
    let best = -1;
    for(const [r, n] of pop) if(n > best){ best = n; gRoot = r; }
    if(gRoot !== null) warn = 'no ground symbol — the busiest node is taken as 0 V';
  }

  const idx = new Map();
  let n = 0;
  if(gRoot !== null){ idx.set(gRoot, 0); n = 1; }
  for(const k of parent.keys()){ const r = find(k); if(!idx.has(r)) idx.set(r, n++); }

  const node = p => { const k = ckKey(p); return parent.has(k) ? idx.get(find(k)) : -1; };
  /* junction dots: a point where three or more conductors meet */
  const junctions = [];
  const seen = new Set();
  for(const p of pts){
    const k = ckKey(p);
    if(seen.has(k)) continue;
    seen.add(k);
    let deg = 0;
    for(const w of sch.wires){ if(ckKey(w.a) === k || ckKey(w.b) === k) deg++; else if(ckOnSegment(p, w)) deg += 2; }
    for(const c of sch.comps) for(const q of ckPins(c)) if(ckKey(q) === k) deg++;
    if(deg >= 3) junctions.push({ x: p.x, y: p.y });
  }
  return { node, count: Math.max(1, n), warn, junctions, pop };
}

