/* ============================================================================
   1l · ROTATIONAL MECHANICS — torque, moment of inertia, angular momentum
   AP Physics 1 units 6–7 and AP Physics C: Mechanics.

   Every rotational quantity is the linear one with the mass replaced by a
   *distribution* of mass, and each moment of inertia here is obtained by
   integrating r²dm over the body rather than read off a table — the table is
   printed beside the integral so the two can be compared.
   ============================================================================ */

/* --------------------------------------------------- rotational kinematics ---- */
/* the same four equations as linear motion, one symbol at a time */
const rtTheta = (th0, w0, al, t) => th0 + w0 * t + 0.5 * al * t * t;
const rtOmega = (w0, al, t) => w0 + al * t;
const rtOmegaFromTh = (w0, al, dth) => Math.sqrt(Math.max(0, w0 * w0 + 2 * al * dth));
/* the bridge to linear motion: every point of a rigid body at radius r */
const rtVTangential = (w, r) => w * r;
const rtACentripetal = (w, r) => w * w * r;
const rtATangential = (al, r) => al * r;

/* ------------------------------------------------------ moments of inertia ---- */
/* Each body supplies its density profile so I = ∫r²dm can be integrated, and
   the closed form so the integral can be checked against it. */
const RT_BODIES = {
  rodCentre: { name:'Thin rod about its centre', I:(M, L) => M * L * L / 12, param:'length L',
    integrate:(M, L) => nqAdaptive(x => x * x * (M / L), -L / 2, L / 2, 1e-12),
    note:'Half the mass sits within L/4 of the axis and contributes almost nothing, because the weighting is r². That r² is the whole difference between mass and moment of inertia.' },
  rodEnd: { name:'Thin rod about one end', I:(M, L) => M * L * L / 3, param:'length L',
    integrate:(M, L) => nqAdaptive(x => x * x * (M / L), 0, L, 1e-12),
    note:'Four times the centre value, and the parallel-axis theorem says exactly why: <b>I = I_cm + Md²</b> with d = L/2 gives ML²/12 + ML²/4 = ML²/3.' },
  hoop: { name:'Hoop about its axis', I:(M, R) => M * R * R, param:'radius R',
    integrate:(M, R) => M * R * R,
    note:'Every scrap of mass is at the same radius, so this is the largest moment of inertia any body of that mass and size can have. A hoop and a disc released together on a ramp are the classic demonstration — the hoop always loses.' },
  disc: { name:'Solid disc about its axis', I:(M, R) => M * R * R / 2, param:'radius R',
    integrate:(M, R) => nqAdaptive(r => r * r * (2 * M * r / (R * R)), 0, R, 1e-12),
    note:'Integrating over rings of mass dm = (2Mr/R²)dr. The answer is half the hoop\'s, because the mass is spread inward where r² is small.' },
  sphere: { name:'Solid sphere', I:(M, R) => 2 * M * R * R / 5, param:'radius R',
    integrate:(M, R) => nqTripleSph((x, y, z) => (x * x + y * y) * (M / (4 * Math.PI * R * R * R / 3)),
      0, 2 * Math.PI, () => 0, () => Math.PI, () => 0, () => R, 5, 8),
    note:'The genuine triple integral of (x²+y²) over the ball, with the density folded in. 2/5 is smaller than a disc\'s 1/2 because a sphere packs even more of itself near the axis.' },
  shell: { name:'Spherical shell', I:(M, R) => 2 * M * R * R / 3, param:'radius R',
    integrate:(M, R) => nqAdaptive(ph => (R * Math.sin(ph)) * (R * Math.sin(ph)) *
      (M / 2) * Math.sin(ph), 0, Math.PI, 1e-11),
    note:'All the mass at radius R but spread over latitudes, so the effective r² is R²·⟨sin²φ⟩ = 2R²/3. Between the hoop and the solid sphere, as it must be.' },
  plate: { name:'Rectangular plate about its centre', I:(M, a) => M * a * a / 6, param:'side a',
    integrate:(M, a) => nqDoubleRect((x, y) => (x * x + y * y) * (M / (a * a)), -a / 2, a / 2, -a / 2, a / 2, 5, 16),
    note:'A square plate about the axis through its centre and perpendicular to it. The perpendicular-axis theorem assembles it from the two in-plane moments: Ma²/12 + Ma²/12.' }
};
/* the parallel-axis theorem, which the lab verifies by re-integrating */
const rtParallelAxis = (Icm, M, d) => Icm + M * d * d;
/* a system of point masses, for the case where the integral is a sum */
function rtInertiaPoints(parts, ax, ay){
  let I = 0, M = 0;
  for(const p of parts){
    const r2 = Math.pow(p.x - (ax || 0), 2) + Math.pow((p.y || 0) - (ay || 0), 2);
    I += p.m * r2; M += p.m;
  }
  return { I, M };
}

/* ----------------------------------------------------------------------------
   A BODY THE READER ASSEMBLES

   Every entry in RT_BODIES above is a shape somebody solved, and it carries its
   answer twice — the closed form and an integration — so the panel can print the
   difference rather than assert the formula. A body the reader builds has no
   closed form at all, so the same standard has to be met a different way.

   The body is a list of pieces, each with a kind, a position, a mass and a size:

       disc    0     0    2.0   1.0
       rod     1.5   0    0.5   0.8
       point  -1.0   0.6  0.3
       ring    0     1.2  1.0   0.4

   From that, two genuinely independent routes to the moment of inertia about any
   axis the reader chooses:

     DIRECT     integrate ((x−a)² + (y−b)²) dm over each piece's own extent, with
                the axis wherever it is. No theorem is used — it is the definition
                of I, evaluated by quadrature.
     THEOREM    add each piece's own I_cm, shift it to the body's centre of mass
                by the parallel-axis theorem, and shift the total out to the axis
                by the parallel-axis theorem again.

   Those two must agree, and nothing forces them to: one is a quadrature over
   geometry and the other is an algebraic identity applied twice. Their difference
   is therefore the **parallel-axis theorem being tested on the reader's own
   body**, which is exactly the thing a preset gets to assume.
   ---------------------------------------------------------------------------- */
const RT_PIECES = {
  point: { np:0, name:'point mass' },
  rod:   { np:1, name:'thin rod, along x' },
  disc:  { np:1, name:'solid disc' },
  ring:  { np:1, name:'thin ring' },
  plate: { np:1, name:'square plate' }
};
/* each piece's moment about the axis through its OWN centre, perpendicular to
   the plane — the closed forms, which is all the theorem route is allowed */
function rtPieceIcm(p){
  const m = p.m, s = p.s || 0;
  switch(p.kind){
    case 'rod':   return m * s * s / 12;
    case 'disc':  return m * s * s / 2;
    case 'ring':  return m * s * s;
    case 'plate': return m * s * s / 6;
    default:      return 0;                       // a point has no extent
  }
}
/* the definition, integrated over the piece wherever the axis happens to be.
   Nothing here knows the parallel-axis theorem exists. */
function rtPieceI(p, ax, ay){
  const m = p.m, s = p.s || 0;
  const dx = p.x - ax, dy = p.y - ay;
  switch(p.kind){
    case 'rod':
      /* a line of density m/s from −s/2 to s/2 about the piece's own centre */
      return nqAdaptive(u => ((dx + u) * (dx + u) + dy * dy) * (m / s), -s / 2, s / 2, 1e-12);
    case 'ring':
      return nqAdaptive(th => ((dx + s * Math.cos(th)) ** 2 + (dy + s * Math.sin(th)) ** 2) * (m / (2 * Math.PI)),
                        0, 2 * Math.PI, 1e-12);
    case 'disc':
      /* nqDoublePolar hands its integrand CARTESIAN offsets and has already
         folded in the r of r dr dθ, so the lambda takes (u, v) and not (r, θ).
         The order k indexes NQ_GL, which stops at 5 — asking for 6 returns
         undefined and throws on its first node. */
      return nqDoublePolar((u, v) => ((dx + u) * (dx + u) + (dy + v) * (dy + v)) * (m / (Math.PI * s * s)),
                           0, 2 * Math.PI, () => 0, () => s, 5, 16);
    case 'plate':
      return nqDoubleRect((u, v) => ((dx + u) * (dx + u) + (dy + v) * (dy + v)) * (m / (s * s)),
                          -s / 2, s / 2, -s / 2, s / 2, 5, 16);
    default:
      return m * (dx * dx + dy * dy);
  }
}
/* the whole assembly: mass, centre of mass, and I by both routes */
function rtBodyProps(pieces, ax, ay){
  let M = 0, sx = 0, sy = 0;
  for(const p of pieces){ M += p.m; sx += p.m * p.x; sy += p.m * p.y; }
  const cx = M > 0 ? sx / M : 0, cy = M > 0 ? sy / M : 0;
  /* route 1 — the definition, by quadrature, about the chosen axis */
  let direct = 0;
  for(const p of pieces) direct += rtPieceI(p, ax, ay);
  /* route 2 — closed forms, shifted twice by the parallel-axis theorem */
  let Icm = 0;
  for(const p of pieces){
    const d2 = (p.x - cx) ** 2 + (p.y - cy) ** 2;
    Icm += rtPieceIcm(p) + p.m * d2;
  }
  const d = Math.hypot(cx - ax, cy - ay);
  const theorem = rtParallelAxis(Icm, M, d);
  /* and the same quadrature about the centre of mass, so I_cm itself is checked
     rather than only the shift */
  let directCm = 0;
  for(const p of pieces) directCm += rtPieceI(p, cx, cy);
  return { M, cx, cy, Icm, directCm, direct, theorem, d,
           gap:Math.abs(direct - theorem),
           gapCm:Math.abs(directCm - Icm),
           /* the radius of gyration: where a single point mass M would have to
              sit to have this same moment — the honest "effective radius" */
           k:M > 0 ? Math.sqrt(direct / M) : 0 };
}
/* the text form. Never throws: a bad line is reported with its number. */
function rtParseBody(text){
  const pieces = [], errs = [];
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,]+/).filter(s => s.length);
    const kind = (tk[0] || '').toLowerCase();
    const K = RT_PIECES[kind];
    if(!K){ errs.push({ line:i + 1, msg:'"' + tk[0] + '" is not a piece — use point, rod, disc, ring or plate' }); continue; }
    const need = 3 + K.np;
    if(tk.length < need){
      errs.push({ line:i + 1, msg:kind + ' needs ' + (need - 1) + ' numbers after it: x, y, mass' +
        (K.np ? ', and its ' + (kind === 'rod' ? 'length' : kind === 'plate' ? 'side' : 'radius') : '') });
      continue;
    }
    const x = parseFloat(tk[1]), y = parseFloat(tk[2]), m = parseFloat(tk[3]);
    const s = K.np ? parseFloat(tk[4]) : 0;
    if(![x, y, m].every(Number.isFinite)){ errs.push({ line:i + 1, msg:'x, y and mass must all be numbers' }); continue; }
    if(!(m > 0)){ errs.push({ line:i + 1, msg:'a mass of ' + tk[3] + ' — it has to be positive' }); continue; }
    if(K.np && !(s > 0)){ errs.push({ line:i + 1, msg:'a size of ' + tk[4] + ' — it has to be positive' }); continue; }
    pieces.push({ kind, x, y, m, s });
  }
  if(!pieces.length && !errs.length) errs.push({ line:0, msg:'no pieces — write at least one line' });
  return { ok:errs.length === 0, pieces, errs };
}

/* ----------------------------------------------------------------- torque ---- */
/* τ = rF sinθ = r⊥F: only the perpendicular component turns anything */
const rtTorque = (r, F, ang) => r * F * Math.sin(ang === undefined ? Math.PI / 2 : ang);
const rtAlpha = (tau, I) => tau / I;
/* rolling without slipping: the contact point is instantaneously at rest, which
   is the constraint v = ωR and the reason static friction does no work */
function rtRolling(M, R, I, ang){
  const c = I / (M * R * R);                            // the shape factor
  const a = DY_G * Math.sin(ang) / (1 + c);
  const f = c * M * a;                                  // the static friction required
  const muMin = c * Math.tan(ang) / (1 + c);
  return { c, a, f, muMin, aSlide:DY_G * Math.sin(ang),
    fracRot:c / (1 + c), fracTrans:1 / (1 + c) };
}
/* the race down a ramp: the winner is decided by shape alone, not by mass or
   radius, because both cancel out of a = g sinθ/(1+I/MR²) */
/* J17: `short` is the canvas race label. Deriving it as name.split(' ')[0]
   made two entrants both read "Solid" — the label must identify the SHAPE. */
const RT_RACE = [
  { name:'Solid sphere', short:'sphere', c:2 / 5 },
  { name:'Solid disc / cylinder', short:'disc', c:1 / 2 },
  { name:'Spherical shell', short:'shell', c:2 / 3 },
  { name:'Hoop / thin ring', short:'hoop', c:1 },
  { name:'Sliding block (frictionless)', short:'block', c:0 }
];

/* -------------------------------------------------------- angular momentum ---- */
const rtL = (I, w) => I * w;
const rtLpoint = (m, v, r, ang) => m * v * r * Math.sin(ang === undefined ? Math.PI / 2 : ang);
const rtKErot = (I, w) => 0.5 * I * w * w;
/* the skater: no external torque, so Iω is conserved and the kinetic energy is
   not — the difference is the work the skater's muscles do pulling in */
function rtSkater(I1, w1, I2){
  const w2 = I1 * w1 / I2;
  /* L1 and L2 are formed separately from each state rather than one being copied
     to the other, so a panel printing both is showing two evaluations and their
     difference is a real (if small) rounding residual. Two stages read these by
     name; before they existed those readouts printed −∞. */
  return { w2, L:I1 * w1, L1:I1 * w1, L2:I2 * w2,
    K1:rtKErot(I1, w1), K2:rtKErot(I2, w2),
    work:rtKErot(I2, w2) - rtKErot(I1, w1) };
}
/* a rotational collision: a lump of putty sticks to a spinning disc */
function rtStick(I0, w0, m, r){
  const I1 = I0 + m * r * r;
  const w1 = I0 * w0 / I1;
  return { I1, w1, L:I0 * w0, K0:rtKErot(I0, w0), K1:rtKErot(I1, w1),
    lost:rtKErot(I0, w0) - rtKErot(I1, w1) };
}
/* the gyroscope: a torque perpendicular to L turns it rather than speeding it,
   so the axis precesses at Ω = τ/L instead of falling */
function rtPrecess(I, w, m, r){
  const L = I * w, tau = m * DY_G * r;
  return { L, tau, Omega:tau / L, period:2 * Math.PI * L / tau };
}

/* --------------------------------------------- statics: the balance point ---- */
/* Σ F = 0 and Σ τ = 0 together — two conditions, and the second is the one that
   makes the problem interesting */
function rtBeam(L, W, loads, x1, x2){
  /* a uniform beam of weight W on two supports at x1 and x2, plus point loads */
  let sumW = W, sumM = W * L / 2;
  for(const l of loads){ sumW += l.w; sumM += l.w * l.x; }
  const R2 = (sumM - sumW * x1) / (x2 - x1);
  const R1 = sumW - R2;
  return { R1, R2, sumW, sumM,
    checkF:R1 + R2 - sumW,
    checkT:R1 * x1 + R2 * x2 - sumM };
}
