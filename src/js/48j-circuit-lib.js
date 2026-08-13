/* ============================================================================
   A LIBRARY OF CIRCUITS
   The guided experiments are built from these rather than from coordinates
   written out by hand, because a wire laid one grid unit off would silently
   short a component instead of failing. Several of these layouts are the ones
   the unit suite solves and checks against closed-form answers.
   ============================================================================ */
const ckO = (a, b) => Object.assign({}, a, b || {});

/* the inverting amplifier — the feedback part is whatever you pass as `fb` */
function ckLibInvAmp(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -12, 1, ckO({ rot:180, wave:'dc', val:0.5 }, o.src)],
        [o.inKind || 'R', 'Rin', -8, 1, ckO({ val:1000 }, o.in)],
        [o.fbKind || 'R', 'Rf', 0, 4, ckO({ val:10000 }, o.fb)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['GND', 'G1', -6, -4]],
    w: [[-11,1, -9,1], [-7,1, -2,1], [-2,1, -2,4], [-1,4, -2,4],
        [1,4, 2,4], [2,4, 2,0],
        [-13,1, -13,-4], [-13,-4, -6,-4], [-2,-1, -6,-1], [-6,-1, -6,-4]]
  });
}
/* the non-inverting amplifier: gain 1 + Rf/Rg */
function ckLibNonInvAmp(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -10, -1, ckO({ rot:180, wave:'sin', amp:0.5, freq:1000 }, o.src)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['R', 'Rg', -6, 4, ckO({ val:1000 }, o.rg)],
        ['R', 'Rf', 2, 4, ckO({ val:10000 }, o.rf)],
        ['GND', 'G1', -6, -8]],
    w: [[-9,-1, -2,-1], [-11,-1, -11,-8], [-11,-8, 8,-8],
        [-2,1, -2,4], [-5,4, -2,4], [-7,4, -7,-8],
        [-2,4, 1,4], [3,4, 5,4], [5,4, 5,0], [5,0, 2,0]]
  });
}
/* an open-loop comparator driving a load */
function ckLibComparator(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -10, -1, ckO({ rot:180, wave:'sin', amp:2, freq:200 }, o.src)],
        ['OPAMP', 'U1', 0, 0, ckO({ vsat:15 }, o.amp)],
        ['R', 'R1', 5, 0, ckO({ val:10000 }, o.load)],
        ['GND', 'G1', -6, -8]],
    w: [[-9,-1, -2,-1], [-11,-1, -11,-8], [-11,-8, 8,-8],
        [-2,1, -4,1], [-4,1, -4,-8],
        [2,0, 4,0], [6,0, 8,0], [8,0, 8,-8]]
  });
}
/* a Schmitt trigger: the same comparator, with positive feedback */
function ckLibSchmitt(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -14, -1, ckO({ rot:180, wave:'sin', amp:5, freq:200 }, o.src)],
        ['R', 'R1', -10, -1, ckO({ val:10000 }, o.rin)],
        ['OPAMP', 'U1', 0, 0, ckO({ vsat:12 }, o.amp)],
        ['R', 'Rf', 0, -5, ckO({ val:47000 }, o.rf)],
        ['R', 'RL', 7, 0, ckO({ val:100000 }, o.load)],
        ['GND', 'G1', -6, -8]],
    w: [[-13,-1, -11,-1], [-9,-1, -2,-1],
        [-15,-1, -15,-8], [-15,-8, 10,-8],
        [-2,1, -4,1], [-4,1, -4,-8],
        [-2,-1, -2,-5], [-2,-5, -1,-5], [1,-5, 4,-5], [4,-5, 4,0], [4,0, 2,0],
        [4,0, 6,0], [8,0, 10,0], [10,0, 10,-8]]
  });
}
/* a relaxation oscillator: a Schmitt trigger charging its own capacitor */
function ckLibRelax(o){
  o = o || {};
  return ckDemoSch({
    c: [['OPAMP', 'U1', 0, 0, ckO({ vsat:12 }, o.amp)],
        ['R', 'Rf', 0, -5, ckO({ val:10000 }, o.rf)],
        ['R', 'R2', -6, -5, ckO({ val:10000 }, o.r2)],
        ['R', 'R3', 0, 5, ckO({ val:10000 }, o.r3)],
        ['C', 'C1', -8, 1, ckO({ val:1e-7, ic:0.1 }, o.cap)],
        ['GND', 'G1', -3, -10]],
    w: [[-2,-1, -2,-5], [-2,-5, -1,-5], [1,-5, 5,-5], [5,-5, 5,0], [5,0, 2,0],
        [-5,-5, -2,-5], [-7,-5, -7,-10],
        [-7,1, -2,1], [-9,1, -9,-10],
        [5,0, 5,5], [5,5, 1,5], [-1,5, -4,5], [-4,5, -4,1],
        [-9,-10, 8,-10]]
  });
}
/* a Sallen–Key second-order low-pass, built round a unity-gain buffer */
function ckLibSallenKey(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -16, -1, ckO({ rot:180, wave:'sin', amp:1, freq:1000 }, o.src)],
        ['R', 'R1', -12, -1, ckO({ val:11000 }, o.r1)],
        ['R', 'R2', -8, -1, ckO({ val:11000 }, o.r2)],
        ['C', 'C2', -7, -4, ckO({ rot:90, val:1e-8 }, o.c2)],
        ['C', 'C1', -11, 3, ckO({ rot:90, val:2e-8 }, o.c1)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['GND', 'G1', -13, -9]],
    w: [[-15,-1, -13,-1], [-11,-1, -9,-1], [-7,-1, -2,-1],
        [-7,-1, -7,-3], [-7,-5, -7,-9],
        [-11,-1, -11,2], [-11,4, 5,4], [5,4, 5,0], [5,0, 2,0],
        [-2,1, -2,2], [-2,2, 5,2],
        [-17,-1, -17,-9], [-17,-9, 8,-9]]
  });
}
/* a real transformer, or an ideal one, driving a load */
function ckLibXfmr(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -6, 1, ckO({ rot:180, wave:'sin', amp:10, freq:1000 }, o.src)],
        [o.kind || 'XFMR', 'T1', 0, 0, ckO({}, o.xf)],
        ['R', 'R1', 4, 1, ckO({ val:1000 }, o.load)],
        ['GND', 'G1', -1, -4]],
    w: [[-5,1, -1,1], [-7,1, -7,-4], [-7,-4, -1,-4], [-1,-1, -1,-4],
        [1,1, 3,1], [5,1, 5,-4], [-1,-4, 5,-4], [1,-1, 1,-4]]
  });
}
/* two separate inductors sharing flux through a coupling coefficient */
function ckLibMutual(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -10, 1, ckO({ rot:180, wave:'sin', amp:1, freq:1000 }, o.src)],
        ['R', 'R0', -6, 1, { val:1 }],
        ['L', 'L1', -2, 1, ckO({ val:1 }, o.l1)],
        ['L', 'L2', 2, 6, ckO({ val:1 }, o.l2)],
        ['R', 'R2', 6, 6, ckO({ val:1e5 }, o.load)],
        ['M', 'K1', 0, 3, ckO({ a:'L1', b:'L2', k:0.5 }, o.k)],
        ['GND', 'G1', -11, -4]],
    w: [[-9,1, -7,1], [-5,1, -3,1], [-1,1, -1,-4],
        [-11,1, -11,-4], [-11,-4, 8,-4],
        [1,6, 1,-4], [3,6, 5,6], [7,6, 8,6], [8,6, 8,-4]]
  });
}
/* the full-wave bridge, with an optional smoothing capacitor */
function ckLibBridge(o){
  o = o || {};
  const c = [['V', 'V1', 3, 0, ckO({ wave:'sin', amp:10, freq:200 }, o.src)],
             ['D', 'D1', -2, 3, { rot:90 }], ['D', 'D2', 8, 3, { rot:90 }],
             ['D', 'D3', -2, -3, { rot:90 }], ['D', 'D4', 8, -3, { rot:90 }],
             ['R', 'RL', 12, 0, ckO({ rot:90, val:1000 }, o.load)],
             ['GND', 'G1', 3, -6]];
  const w = [[-2,4, -2,6], [-2,6, 16,6], [-2,2, -2,0],
             [8,4, 8,6], [8,2, 8,0],
             [-2,-2, -2,0], [-2,-4, -2,-6], [-2,-6, 16,-6],
             [8,-2, 8,0], [8,-4, 8,-6],
             [-2,0, 2,0], [4,0, 8,0],
             [12,6, 12,1], [12,-1, 12,-6]];
  if(o.smooth !== false){
    c.push(['C', 'C1', 16, 0, ckO({ rot:90, val:1e-5 }, o.cap)]);
    w.push([16,6, 16,1], [16,-1, 16,-6]);
  }
  return ckDemoSch({ c, w });
}
/* a two-loop resistive network — the classic Kirchhoff exercise */
function ckLibTwoLoop(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', 0, 0, ckO({ rot:180, wave:'dc', val:12 }, o.src)],
        ['R', 'R1', 4, 0, { val:1000 }],
        ['R', 'R2', 6, -3, { rot:90, val:2200 }],
        ['R', 'R3', 9, 0, { val:1500 }],
        ['R', 'R4', 12, -3, { rot:90, val:3300 }],
        ['GND', 'G1', 2, -7]],
    w: [[1,0, 3,0], [5,0, 6,0], [6,0, 6,-2], [6,-4, 6,-7],
        [6,0, 8,0], [10,0, 12,0], [12,0, 12,-2], [12,-4, 12,-7],
        [-1,0, -1,-7], [-1,-7, 14,-7]]
  });
}
/* two of a kind side by side across one source — the parallel rule */
function ckLibParallel(kind, o){
  o = o || {};
  const p = CK_KINDS[kind].sym;
  return ckDemoSch({
    c: [['V', 'V1', 0, 0, ckO({ rot:180, wave:'dc', val:8 }, o.src)],
        [kind, p + '1', 4, 2, ckO({}, o.a)],
        [kind, p + '2', 4, -2, ckO({}, o.b)],
        ['GND', 'G1', -1, -6]],
    w: [[1,0, 1,2], [1,2, 3,2], [1,0, 1,-2], [1,-2, 3,-2],
        [5,2, 7,2], [5,-2, 7,-2], [7,2, 7,-6], [7,-6, -1,-6], [-1,-6, -1,0]]
  });
}
/* a lossless LC tank, started with a charged capacitor */
function ckLibLC(o){
  o = o || {};
  return ckDemoSch({
    c: [['C', 'C1', 0, 0, ckO({ rot:90, val:1e-6, ic:5 }, o.c)],
        ['L', 'L1', 6, 0, ckO({ rot:90, val:1e-3 }, o.l)],
        ['GND', 'G1', 0, -3]],
    w: [[0,1, 6,1], [0,-1, 0,-3], [0,-3, 6,-3], [6,-3, 6,-1]]
  });
}
/* the voltage follower: output wired straight back to the inverting input */
function ckLibFollower(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -10, -1, ckO({ rot:180, wave:'sin', amp:3, freq:500 }, o.src)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['R', 'RL', 8, 0, ckO({ val:1000 }, o.load)],
        ['GND', 'G1', -6, -8]],
    w: [[-9,-1, -2,-1], [-11,-1, -11,-8], [-11,-8, 11,-8],
        [-2,1, -2,3], [-2,3, 5,3], [5,3, 5,0], [5,0, 2,0],
        [5,0, 7,0], [9,0, 11,0], [11,0, 11,-8]]
  });
}
/* the summing amplifier: two inputs meeting at one virtual earth */
function ckLibSummer(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -14, 1, ckO({ rot:180, wave:'dc', val:1 }, o.a)],
        ['R', 'Ra', -10, 1, ckO({ val:10000 }, o.ra)],
        ['V', 'V2', -14, 4, ckO({ rot:180, wave:'sin', amp:0.5, freq:400 }, o.b)],
        ['R', 'Rb', -10, 4, ckO({ val:10000 }, o.rb)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['R', 'Rf', 0, 7, ckO({ val:10000 }, o.rf)],
        ['GND', 'G1', -8, -10]],
    w: [[-13,1, -11,1], [-9,1, -2,1], [-13,4, -11,4], [-9,4, -6,4], [-6,4, -6,1],
        [-2,1, -2,7], [-2,7, -1,7], [1,7, 3,7], [3,7, 3,0], [3,0, 2,0],
        [-2,-1, -4,-1], [-4,-1, -4,-10],
        [-15,1, -15,-10], [-15,4, -15,1], [-15,-10, 6,-10]]
  });
}
/* the difference amplifier: one input to each terminal, subtracted */
function ckLibDifference(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -14, 1, ckO({ rot:180, wave:'dc', val:3 }, o.a)],
        ['R', 'R1', -10, 1, ckO({ val:10000 }, o.r1)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['R', 'Rf', 0, 5, ckO({ val:10000 }, o.rf)],
        ['V', 'V2', -14, -1, ckO({ rot:180, wave:'dc', val:5 }, o.b)],
        ['R', 'R2', -10, -1, ckO({ val:10000 }, o.r2)],
        ['R', 'R3', -6, -5, ckO({ val:10000 }, o.r3)],
        ['GND', 'G1', -10, -10]],
    w: [[-13,1, -11,1], [-9,1, -2,1],
        [-2,1, -2,5], [-2,5, -1,5], [1,5, 4,5], [4,5, 4,0], [4,0, 2,0],
        [-13,-1, -11,-1], [-9,-1, -2,-1],
        [-2,-1, -2,-5], [-2,-5, -5,-5], [-7,-5, -7,-10],
        [-15,1, -15,-10], [-15,-1, -15,1], [-15,-10, 6,-10]]
  });
}
/* a Wheatstone bridge on its own — the classic two-probe measurement */
function ckLibWheatstone(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -8, 0, ckO({ rot:180, wave:'dc', val:5 }, o.src)],
        ['R', 'Ra', -4, 2, ckO({ rot:90, val:1000 }, o.ra)],
        ['R', 'Rb', -4, -2, ckO({ rot:90, val:1000 }, o.rb)],
        ['R', 'Rc', 2, 2, ckO({ rot:90, val:1000 }, o.rc)],
        ['R', 'Rd', 2, -2, ckO({ rot:90, val:1100 }, o.rd)],
        ['GND', 'G1', -1, -6]],
    w: [[-7,0, -7,4], [-7,4, -4,4], [-4,4, 2,4], [-4,3, -4,4], [2,3, 2,4],
        [-4,1, -4,-1], [2,1, 2,-1],
        [-4,-3, -4,-6], [2,-3, 2,-6], [-4,-6, 2,-6],
        [-9,0, -9,-6], [-9,-6, -4,-6]]
  });
}
/* that bridge feeding a difference amplifier — a load cell, in effect */
function ckLibBridgeAmp(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -8, 0, ckO({ rot:180, wave:'dc', val:5 }, o.src)],
        ['R', 'Ra', -4, 2, ckO({ rot:90, val:1000 }, o.ra)],
        ['R', 'Rb', -4, -2, ckO({ rot:90, val:1000 }, o.rb)],
        ['R', 'Rc', 2, 2, ckO({ rot:90, val:1000 }, o.rc)],
        ['R', 'Rd', 2, -2, ckO({ rot:90, val:1050 }, o.rd)],
        ['R', 'R1', 7, 7, ckO({ val:1000 }, o.r1)],
        ['OPAMP', 'U1', 14, 0, ckO({}, o.amp)],
        ['R', 'Rf', 14, 4, ckO({ val:47000 }, o.rf)],
        ['R', 'R2', 10, -3, ckO({ rot:90, val:1000 }, o.r2)],
        ['GND', 'G1', -1, -8]],
    w: [[-7,0, -7,4], [-7,4, -4,4], [-4,4, 2,4], [-4,3, -4,4], [2,3, 2,4],
        [-4,1, -4,-1], [2,1, 2,-1],
        [-4,-3, -4,-6], [2,-3, 2,-6], [-4,-6, 2,-6], [-4,-6, -4,-8],
        [-9,0, -9,-8], [-9,-8, 18,-8],
        [-4,0, -6,0], [-6,0, -6,7], [-6,7, 6,7], [8,7, 9,7], [9,7, 9,1], [9,1, 12,1],
        [12,1, 12,4], [12,4, 13,4], [15,4, 17,4], [17,4, 17,0], [17,0, 16,0],
        [2,0, 4,0], [4,0, 4,-4], [4,-4, 10,-4], [10,-1, 10,-2], [10,-1, 12,-1],
        [10,-4, 10,-2], [10,-4, 10,-8]]
  });
}
/* a voltage doubler: one capacitor clamps, the next holds the sum */
function ckLibDoubler(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -8, 0, ckO({ rot:180, wave:'sin', amp:5, freq:500 }, o.src)],
        ['C', 'C1', -4, 0, ckO({ val:1e-5 }, o.c1)],
        ['D', 'D1', -2, -3, ckO({ rot:90 }, o.d1)],
        ['D', 'D2', 2, 0, ckO({}, o.d2)],
        ['C', 'C2', 6, -3, ckO({ rot:90, val:1e-5 }, o.c2)],
        ['R', 'RL', 10, -3, ckO({ rot:90, val:10000 }, o.load)],
        ['GND', 'G1', -6, -6]],
    w: [[-7,0, -5,0], [-3,0, -2,0], [-2,0, -2,-2], [-2,-4, -2,-6],
        [-2,0, 1,0], [3,0, 6,0], [6,0, 6,-2], [6,-4, 6,-6],
        [6,0, 10,0], [10,0, 10,-2], [10,-4, 10,-6],
        [-9,0, -9,-6], [-9,-6, 12,-6]]
  });
}
/* the precision rectifier: a diode inside the feedback loop loses no 0.6 V */
function ckLibPrecisionRect(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -10, -1, ckO({ rot:180, wave:'sin', amp:0.3, freq:400 }, o.src)],
        ['OPAMP', 'U1', 0, 0, ckO({}, o.amp)],
        ['D', 'D1', 5, 0, ckO({}, o.d)],
        ['R', 'RL', 10, -3, ckO({ rot:90, val:10000 }, o.load)],
        ['GND', 'G1', -6, -8]],
    w: [[-9,-1, -2,-1], [-11,-1, -11,-8], [-11,-8, 12,-8],
        [2,0, 4,0], [6,0, 10,0], [10,0, 10,-2], [10,-4, 10,-8],
        [10,0, 10,3], [10,3, -2,3], [-2,3, -2,1]]
  });
}
/* a diode clipper: two junctions back to back cut the peaks off */
function ckLibClipper(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -8, 0, ckO({ rot:180, wave:'sin', amp:3, freq:400 }, o.src)],
        ['R', 'R1', -4, 0, ckO({ val:1000 }, o.r)],
        ['D', 'D1', 0, -3, ckO({ rot:90 }, o.d1)],
        ['D', 'D2', 4, -3, ckO({ rot:270 }, o.d2)],
        ['GND', 'G1', -6, -6]],
    w: [[-7,0, -5,0], [-3,0, 0,0], [0,0, 0,-2], [0,-4, 0,-6],
        [0,0, 4,0], [4,0, 4,-2], [4,-4, 4,-6],
        [-9,0, -9,-6], [-9,-6, 6,-6]]
  });
}
/* a notch filter: a series LC shunts the signal to ground at resonance */
function ckLibNotch(o){
  o = o || {};
  return ckDemoSch({
    c: [['V', 'V1', -8, 0, ckO({ rot:180, wave:'sin', amp:1, freq:5000 }, o.src)],
        ['R', 'R1', -4, 0, ckO({ val:1000 }, o.r)],
        ['L', 'L1', 0, -2, ckO({ rot:90, val:1e-3 }, o.l)],
        ['C', 'C1', 0, -5, ckO({ rot:90, val:1e-6 }, o.c)],
        ['R', 'RL', 4, -4, ckO({ rot:90, val:10000 }, o.load)],
        ['GND', 'G1', -6, -8]],
    w: [[-7,0, -5,0], [-3,0, 0,0], [0,0, 0,-1], [0,-3, 0,-4], [0,-6, 0,-8],
        [0,0, 4,0], [4,0, 4,-3], [4,-5, 4,-8],
        [-9,0, -9,-8], [-9,-8, 6,-8]]
  });
}

/* a parallel resonant tank, driven by a current source */
function ckLibTank(o){
  o = o || {};
  return ckDemoSch({
    c: [['I', 'I1', 0, 0, ckO({ rot:90, wave:'sin', amp:1e-3, freq:5000 }, o.src)],
        ['R', 'R1', 3, 0, ckO({ rot:90, val:10000 }, o.r)],
        ['L', 'L1', 7, 0, ckO({ rot:90, val:1e-3 }, o.l)],
        ['C', 'C1', 11, 0, ckO({ rot:90, val:1e-6 }, o.c)],
        ['GND', 'G1', 12, -3]],
    w: [[0,1, 0,3], [0,3, 12,3], [3,1, 3,3], [7,1, 7,3], [11,1, 11,3],
        [0,-1, 0,-3], [0,-3, 12,-3], [3,-1, 3,-3], [7,-1, 7,-3], [11,-1, 11,-3]]
  });
}

