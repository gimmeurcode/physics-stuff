/* ============================================================================
   1p · OPTICS — geometric and physical
   AP Physics 2 units 6–7.

   Geometric optics is the short-wavelength limit in which light may be treated
   as rays, and every law in it (reflection, refraction, the lens equation) can
   be derived from Fermat's principle that light takes the path of stationary
   optical length. Physical optics is what happens when the wavelength is no
   longer negligible — and the lab computes the same double slit both ways so
   the boundary between the two pictures is visible.
   ============================================================================ */

/* -------------------------------------------------------------- refraction ---- */
const OP_MEDIA = {
  vacuum:  { name:'Vacuum',        n:1 },
  air:     { name:'Air',           n:1.000293 },
  water:   { name:'Water',         n:1.333 },
  glass:   { name:'Crown glass',   n:1.52 },
  flint:   { name:'Flint glass',   n:1.62 },
  diamond: { name:'Diamond',       n:2.417 },
  acrylic: { name:'Acrylic',       n:1.491 }
};
const opSpeed = n => C_SI / n;
/* Snell's law, with total internal reflection reported rather than returning NaN */
function opSnell(n1, th1, n2){
  const s = n1 * Math.sin(th1) / n2;
  if(Math.abs(s) > 1) return { th2:NaN, tir:true, critical:Math.asin(Math.min(1, n2 / n1)) };
  return { th2:Math.asin(s), tir:false,
    critical:n1 > n2 ? Math.asin(n2 / n1) : NaN };
}
const opCritical = (n1, n2) => n1 > n2 ? Math.asin(n2 / n1) : NaN;
/* the Fresnel reflectance at normal incidence — why a window shows a reflection */
const opReflectance0 = (n1, n2) => Math.pow((n1 - n2) / (n1 + n2), 2);
/* Fermat's principle, made testable: the true refraction angle is the one that
   minimises the travel time, found by scanning the crossing point */
function opFermat(n1, n2, h1, h2, D, samples){
  const N = samples || 2000;
  let best = null;
  for(let i = 0; i <= N; i++){
    const x = D * i / N;
    const t = n1 * Math.hypot(x, h1) + n2 * Math.hypot(D - x, h2);   // optical path length
    if(!best || t < best.t) best = { x, t };
  }
  const th1 = Math.atan2(best.x, h1), th2 = Math.atan2(D - best.x, h2);
  return { x:best.x, opl:best.t, th1, th2,
    snellResidual:Math.abs(n1 * Math.sin(th1) - n2 * Math.sin(th2)) };
}
/* dispersion: n varies with wavelength, which is the whole of the rainbow */
function opCauchy(lamNm, A, B){
  const l = lamNm / 1000;                     // µm
  return (A === undefined ? 1.5046 : A) + (B === undefined ? 0.00420 : B) / (l * l);
}
const OP_COLOURS = [
  { name:'violet', lam:405, css:'#8B5CF6' }, { name:'blue', lam:470, css:'#3B82F6' },
  { name:'green',  lam:530, css:'#22C55E' }, { name:'yellow', lam:580, css:'#EAB308' },
  { name:'orange', lam:610, css:'#F97316' }, { name:'red', lam:660, css:'#EF4444' }
];

/* ------------------------------------------------------- mirrors and lenses ---- */
/* One equation serves both, with the sign convention doing all the work:
   1/f = 1/do + 1/di, m = −di/do. f > 0 converging, di > 0 real. */
function opImage(f, dobj){
  const di = 1 / (1 / f - 1 / dobj);
  const m = -di / dobj;
  return { di, m,
    real:di > 0, upright:m > 0, magnified:Math.abs(m) > 1,
    kind:(di > 0 ? 'real' : 'virtual') + ', ' + (m > 0 ? 'upright' : 'inverted') +
         ', ' + (Math.abs(m) > 1 ? 'magnified' : Math.abs(m) < 1 ? 'reduced' : 'same size') };
}
const opMirrorF = R => R / 2;
/* the lensmaker's equation, so f is a consequence of the glass and the shape */
const opLensMaker = (n, R1, R2) => 1 / ((n - 1) * (1 / R1 - 1 / R2));
/* two lenses in a row: the first image is the second object */
function opTwoLens(f1, f2, dobj, sep){
  const a = opImage(f1, dobj);
  const d2 = sep - a.di;                       // negative means a virtual object
  const b = opImage(f2, d2);
  return { first:a, second:b, total:a.m * b.m, d2 };
}
const OP_SETUPS = {
  converging: { name:'Converging lens', f:0.20, obj:0.35,
    note:'Object beyond 2f gives a real, inverted, reduced image — a camera. Between f and 2f it is real, inverted and magnified — a projector. Inside f the image goes virtual and upright: that is a magnifying glass.' },
  diverging: { name:'Diverging lens', f:-0.20, obj:0.30,
    note:'A negative focal length always gives a virtual, upright, reduced image, wherever the object sits. Nothing you can do makes a diverging lens project.' },
  concave: { name:'Concave mirror', f:0.15, obj:0.40, mirror:true,
    note:'The mirror analogue of a converging lens, and the shape of every reflecting telescope. Its focal length is R/2, which is a small-angle result — a spherical mirror suffers from spherical aberration, and a parabolic one does not.' },
  convex: { name:'Convex mirror', f:-0.15, obj:0.30, mirror:true,
    note:'Always virtual, upright and reduced, with a very wide field of view. This is the security mirror and the passenger wing mirror, complete with its warning that objects are closer than they appear.' }
};
/* the three principal rays a ray diagram is built from */
function opRays(f, dobj, hobj){
  const im = opImage(f, dobj);
  const hi = im.m * hobj;
  return { im, hi,
    /* each ray is a pair of points before and after the lens plane at x = 0 */
    parallel:{ a:{ x:-dobj, y:hobj }, b:{ x:0, y:hobj }, c:{ x:im.di, y:hi } },
    through:{ a:{ x:-dobj, y:hobj }, b:{ x:0, y:0 }, c:{ x:im.di, y:hi } },
    focal:{ a:{ x:-dobj, y:hobj }, b:{ x:0, y:hi }, c:{ x:im.di, y:hi } } };
}

/* ----------------------------------------------------------------------------
   A LENS THE READER DESIGNS — A SURFACE PRESCRIPTION

   Everything above treats a lens as a number: one focal length, obeying
   1/f = 1/d_o + 1/d_i. That is the thin-lens approximation, and it is a good
   place to start precisely because it hides everything an actual lens does.
   A real lens is a *prescription*: a list of surfaces, each with a radius of
   curvature, a distance to the next, and the index of the glass behind it.

       R (mm)   thickness (mm)   index after
        60.0      4.0             1.5168
       −60.0      0               1

   Two calculations are done on it, and the interest is entirely in their
   disagreement.

   PARAXIAL, by ray transfer matrices. Refraction at a surface and translation
   between surfaces are each a 2×2 matrix acting on (height, angle), so a whole
   system multiplies out into one matrix, and every first-order property — focal
   length, principal planes, image position, magnification — is read off its four
   entries. This is the thin-lens formula's honest big brother: still linear,
   still assuming sin θ ≈ θ, but no longer assuming the glass has no thickness.

   REAL, by tracing finite rays through the spheres with Snell's law and no
   approximation at all. A ray entering at the edge of the lens does not cross
   the axis where a ray entering near the centre does, and the gap between them
   is **spherical aberration** — the oldest defect in optics, invisible to every
   formula above, and the reason a camera lens has six elements instead of one.

   The paraxial answer is the limit of the real one as the aperture shrinks, so
   the two are computed independently and the difference is the measurement.
   ---------------------------------------------------------------------------- */

/* one surface: { R, t, n }. R = Infinity is a plane. `n` is the index AFTER it.
   Distances are millimetres; the caller keeps them consistent. */
function opSysMatrix(surf, n0){
  /* M = Tₖ … R₂ T₁ R₁, built left to right through the system */
  let A = 1, B = 0, Cc = 0, D = 1;                      // the identity
  const mul = (a, b, c, d) => {                          // pre-multiply by [[a,b],[c,d]]
    const nA = a * A + b * Cc, nB = a * B + b * D;
    const nC = c * A + d * Cc, nD = c * B + d * D;
    A = nA; B = nB; Cc = nC; D = nD;
  };
  let n1 = n0 === undefined ? 1 : n0;
  for(let i = 0; i < surf.length; i++){
    const s = surf[i], n2 = s.n;
    const P = Number.isFinite(s.R) ? (n2 - n1) / s.R : 0;
    mul(1, 0, -P / n2, n1 / n2);                         // refraction
    if(i < surf.length - 1 && s.t) mul(1, s.t, 0, 1);    // translation to the next
    n1 = n2;
  }
  const efl = Cc !== 0 ? -1 / Cc : Infinity;
  return { A, B, C:Cc, D, efl,
    bfd:Cc !== 0 ? -A / Cc : Infinity,                   // last vertex → rear focus
    ffd:Cc !== 0 ? D / Cc : Infinity,                    // first vertex → front focus
    p1:Cc !== 0 ? (D - 1) / Cc : 0,                      // front vertex → principal plane
    p2:Cc !== 0 ? (1 - A) / Cc : 0,                      // rear vertex → principal plane
    /* an image is where the (1,2) entry of the whole chain vanishes: then the
       height at the image does not depend on the angle a ray set out with, which
       is what "image" means */
    image(dobj){
      const den = Cc * dobj + D;
      const di = Math.abs(den) < 1e-14 ? Infinity : -(A * dobj + B) / den;
      return { di, m:A + di * Cc };
    } };
}
/* one meridional ray, traced exactly. State is (z, y, u): axial position, height,
   and the angle its direction makes with the axis. */
function opTraceRay(surf, y0, u0, z0, n0){
  let z = z0 || 0, y = y0, u = u0 || 0, n1 = n0 === undefined ? 1 : n0;
  let zv = 0;                                            // the vertex being approached
  const path = [{ z, y }];
  for(let i = 0; i < surf.length; i++){
    const s = surf[i], n2 = s.n;
    let phi;                                             // the surface normal's angle
    if(!Number.isFinite(s.R)){
      /* a plane: march to z = zv */
      const dz = zv - z;
      y += dz * Math.tan(u); z = zv; phi = 0;
    } else {
      /* the sphere through the vertex, centred at zv + R */
      const zc = zv + s.R;
      const cz = Math.cos(u), cy = Math.sin(u);
      const ez = z - zc, ey = y;
      const b = ez * cz + ey * cy, c = ez * ez + ey * ey - s.R * s.R;
      const disc = b * b - c;
      if(disc < 0) return { ok:false, why:'a ray missed surface ' + (i + 1) + ' — it passes outside the sphere', path };
      const rt = Math.sqrt(disc);
      /* the intersection nearer the vertex is the one the glass actually has */
      const sA = -b - rt, sB = -b + rt;
      const zA = z + sA * cz, zB = z + sB * cz;
      const sPick = Math.abs(zA - zv) <= Math.abs(zB - zv) ? sA : sB;
      z += sPick * cz; y += sPick * cy;
      phi = Math.atan2(y, z - zc);
    }
    /* The normal is a LINE, and φ and φ + π describe it equally well — but only
       one of them gives the right angle of incidence, and picking the wrong one
       silently reflects the ray back up the axis instead of refracting it. The
       rule is that the ray must be travelling broadly along the chosen normal,
       not against it, which for a concave surface (R < 0) is the other branch. */
    let inc = u - phi;
    inc = Math.atan2(Math.sin(inc), Math.cos(inc));       // into (−π, π]
    if(Math.abs(inc) > Math.PI / 2){
      phi += Math.PI;
      inc = u - phi;
      inc = Math.atan2(Math.sin(inc), Math.cos(inc));
    }
    const sin2 = (n1 / n2) * Math.sin(inc);
    if(Math.abs(sin2) > 1)
      return { ok:false, why:'total internal reflection at surface ' + (i + 1) +
                            ' — this ray never leaves the glass', path };
    u = phi + Math.asin(sin2);
    u = Math.atan2(Math.sin(u), Math.cos(u));
    n1 = n2;
    path.push({ z, y });
    zv += s.t || 0;
  }
  /* where it finally crosses the axis, as a distance from where it now is */
  const cross = Math.abs(Math.tan(u)) < 1e-14 ? Infinity : -y / Math.tan(u);
  return { ok:true, z, y, u, path, cross };
}
/* Spherical aberration, measured: where rays at a spread of heights cross the
   axis, against where the paraxial matrix says they should. The marginal ray is
   the outermost one, and the classic figure of merit is how far its crossing sits
   from the paraxial focus. */
function opSpherical(surf, hmax, n0){
  const M = opSysMatrix(surf, n0);
  let zLast = 0;
  for(let i = 0; i < surf.length - 1; i++) zLast += surf[i].t || 0;
  const rows = [];
  for(let k = 1; k <= 8; k++){
    const h = hmax * k / 8;
    const r = opTraceRay(surf, h, 0, -10, n0);
    if(!r.ok){ rows.push({ h, ok:false, why:r.why }); continue; }
    /* the axis crossing, referred to the last vertex like bfd is */
    rows.push({ h, ok:true, z:r.z + r.cross - zLast });
  }
  const good = rows.filter(r => r.ok);
  const marginal = good.length ? good[good.length - 1].z : NaN;
  return { rows, paraxial:M.bfd, marginal,
    lsa:Number.isFinite(marginal) ? marginal - M.bfd : NaN,
    spread:good.length ? Math.max(...good.map(r => r.z)) - Math.min(...good.map(r => r.z)) : NaN };
}
/* ----------------------------------------------------------------------------
   AN APERTURE THE READER CUTS

   Every diffraction formula in this wing — the single slit's sinc², the double
   slit's cosine fringes under that envelope, the grating's sharp orders — is a
   special case of one statement:

       the far-field amplitude is the FOURIER TRANSFORM of the aperture.

   Each closed form exists because somebody did that integral for one shape. A
   shape the reader cuts has no closed form, so the integral is done numerically,
   and then the three formulas above become predictions that can be checked
   rather than results to be quoted.

   The transform is evaluated directly rather than by FFT: the screen coordinate
   wanted is an angle, the sample count is modest, and a direct sum keeps the
   relationship between aperture coordinate and diffraction angle visible instead
   of buried in a bin index.
   ---------------------------------------------------------------------------- */
function opDiffract(apert, halfWidth, lam, L, y, n){
  const N = n || 1200, h = 2 * halfWidth / N;
  /* the path-difference phase across the aperture, in the Fraunhofer limit:
     a point at aperture coordinate u contributes e^(−ik·u·sinθ), and sinθ ≈ y/L */
  const k = 2 * Math.PI / lam, s = y / Math.hypot(L, y);
  let re = 0, im = 0;
  for(let i = 0; i <= N; i++){
    const u = -halfWidth + i * h;
    const A = apert(u);
    if(!Number.isFinite(A) || A === 0) continue;
    const ph = -k * u * s;
    const w = (i === 0 || i === N) ? 0.5 : 1;
    re += w * A * Math.cos(ph);
    im += w * A * Math.sin(ph);
  }
  return (re * re + im * im) * h * h;
}
/* the pattern across a screen, normalised to its own peak so any aperture is
   comparable with any other */
function opDiffractScan(apert, halfWidth, lam, L, ymax, m, n){
  const M = m || 400, out = [];
  let peak = 0;
  for(let i = 0; i <= M; i++){
    const y = -ymax + 2 * ymax * i / M;
    const I = opDiffract(apert, halfWidth, lam, L, y, n);
    out.push({ y, I });
    peak = Math.max(peak, I);
  }
  for(const r of out) r.I = peak > 0 ? r.I / peak : 0;
  return { rows:out, peak };
}

/* The prescription as text — three numbers a line, which is how lens data has
   been published since the nineteenth century and how every optical design
   program still reads it. Nothing here throws: a mistyped line is reported with
   its number, because a reader who has written one bad row wants to be told
   which row rather than handed an empty bench. */
function opParsePrescription(text){
  const surf = [], errs = [];
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,]+/).filter(s => s.length);
    if(tk.length < 3){ errs.push({ line:i + 1, msg:'expected three numbers — radius, thickness, index' }); continue; }
    const flat = /^(inf|infinity|flat|plane)$/i.test(tk[0]);
    const R = flat ? Infinity : parseFloat(tk[0]);
    const t = parseFloat(tk[1]), n = parseFloat(tk[2]);
    if(!flat && !Number.isFinite(R))
      errs.push({ line:i + 1, msg:'"' + tk[0] + '" is not a radius — write a number, or "inf" for a flat surface' });
    else if(!Number.isFinite(t) || t < 0)
      errs.push({ line:i + 1, msg:'"' + tk[1] + '" is not a thickness — it must be a number, and not negative' });
    else if(!Number.isFinite(n) || n < 1)
      errs.push({ line:i + 1, msg:'"' + tk[2] + '" is not a refractive index — it is at least 1, and 1 means air' });
    else if(!flat && Math.abs(R) < 1e-9)
      errs.push({ line:i + 1, msg:'a radius of zero is not a surface — write "inf" if you meant flat' });
    else surf.push({ R, t, n });
  }
  if(!surf.length && !errs.length)
    errs.push({ line:0, msg:'no surfaces — write at least one line of "radius  thickness  index"' });
  if(surf.length && Math.abs(surf[surf.length - 1].n - 1) > 1e-9)
    errs.push({ line:0, msg:'the last line\'s index is ' + surf[surf.length - 1].n +
      ', so the light never comes back out into air — the final surface should end in 1' });
  return { ok:errs.length === 0, surf, errs };
}

/* double slit: the intensity is the two-path interference term modulated by the
   single-slit envelope, and the lab draws both so the missing orders are visible */
function opDoubleSlit(d, a, lam, L, y){
  const th = Math.atan2(y, L);
  const beta = Math.PI * a * Math.sin(th) / lam;
  const alpha = Math.PI * d * Math.sin(th) / lam;
  const env = beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2);
  return { th, I:env * Math.pow(Math.cos(alpha), 2), env,
    interference:Math.pow(Math.cos(alpha), 2), order:d * Math.sin(th) / lam };
}
const opFringeSpacing = (lam, L, d) => lam * L / d;
/* single slit: the first minimum at a sinθ = λ is the diffraction limit */
function opSingleSlit(a, lam, th){
  const beta = Math.PI * a * Math.sin(th) / lam;
  return { I:beta === 0 ? 1 : Math.pow(Math.sin(beta) / beta, 2),
    firstMin:Math.asin(Math.min(1, lam / a)) };
}
/* a grating: N slits sharpen each maximum by a factor of N */
function opGrating(d, N, lam, th){
  const p = Math.PI * d * Math.sin(th) / lam;
  const num = Math.sin(N * p), den = Math.sin(p);
  const I = Math.abs(den) < 1e-12 ? N * N : Math.pow(num / den, 2);
  return { I:I / (N * N), orderAngle:m => Math.asin(Math.min(1, m * lam / d)),
    resolving:m => N * m };
}
/* thin films: the extra half-wave on reflection off a denser medium is what
   makes a soap film black where it is thinnest */
function opThinFilm(nFilm, t, lam, nAbove, nBelow){
  const flipTop = nFilm > (nAbove === undefined ? 1 : nAbove);
  const flipBottom = (nBelow === undefined ? 1 : nBelow) > nFilm;
  const netFlip = flipTop !== flipBottom;
  const pathPhase = 2 * nFilm * t / lam;
  return { netFlip, pathPhase,
    constructive:m => netFlip ? (m + 0.5) * lam / (2 * nFilm) : m * lam / (2 * nFilm),
    /* the intensity as a fraction, for the drawn colour band */
    I:Math.pow(Math.cos(Math.PI * (pathPhase + (netFlip ? 0.5 : 0))), 2) };
}
/* Malus's law, and the three-polariser puzzle that follows from it */
const opMalus = (I0, th) => I0 * Math.pow(Math.cos(th), 2);
function opPolarisers(I0, angles){
  let I = I0 / 2;                        // unpolarised light through the first
  const steps = [{ I, ang:angles[0] }];
  for(let i = 1; i < angles.length; i++){
    I = opMalus(I, angles[i] - angles[i - 1]);
    steps.push({ I, ang:angles[i] });
  }
  return { I, steps };
}
const opBrewster = (n1, n2) => Math.atan(n2 / n1);
/* the Rayleigh criterion — the reason a telescope's aperture matters */
const opRayleigh = (lam, D) => 1.22 * lam / D;
