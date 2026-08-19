/* ============================================================================
   2f-bis · CYLINDRICAL AND SPHERICAL VOLUME ELEMENTS
   Wing C4, three dimensions.  Same question as 25a and one dimension up: the
   r in r dz dr dθ and the ρ²sinφ in ρ²sinφ dρ dφ dθ are Jacobians, and the
   only honest way to show it is to integrate the SAME solid in two or three
   coordinate systems and compare.

   Prefix: cs (shared with 25a).  Every integral here goes through
   21-numerics — `nqTriple`, `nqTripleCyl`, `nqTripleSph` — so nothing in this
   file implements a quadrature, and the three routes differ in the coordinate
   system rather than in the rule.

   Each solid declares a closed-form volume. Nothing here reads that declaration
   to compute anything; `./auditclaims.ps1` compares it against whichever routes
   the solid supports.
   ============================================================================ */

/* The bounds of each solid, written once per coordinate system. A solid that
   cannot be described in a system says so with `null` rather than being given
   an approximation — a cone has no tidy spherical description from the axis,
   and pretending otherwise would make the "three routes agree" claim vacuous. */
const CS_SOLIDS = {
  ball:     { name:'a ball', short:'ball', R:1,
              vol:P => 4 * Math.PI * P.R * P.R * P.R / 3,
              volTex:'4π<i>R</i>³/3',
              why:'The first solid anyone integrates and the one where the three systems differ most in effort. In spherical coordinates the limits are three constants; in Cartesian they are two nested square roots, and the quadrature pays for it in accuracy — which the panel measures rather than asserts.' },
  cylinder: { name:'a cylinder', short:'cylinder', R:1, H:2,
              vol:P => Math.PI * P.R * P.R * P.H,
              volTex:'π<i>R</i>²<i>H</i>',
              why:'The shape cylindrical coordinates are named for: every limit is a constant, so the integral is a product of three one-dimensional ones and the volume element does all the work.' },
  cone:     { name:'a cone', short:'cone', R:1, H:2,
              vol:P => Math.PI * P.R * P.R * P.H / 3,
              volTex:'π<i>R</i>²<i>H</i>/3',
              why:'The factor of a third that every school textbook states and few derive. Here it comes out of the integral: the radius falls linearly with height, so the cross-sectional area falls quadratically, and ∫₀¹(1−t)²dt = 1/3.' },
  cap:      { name:'a spherical cap', short:'cap', R:1, a:0.4,
              vol:P => Math.PI * (P.R - P.a) * (P.R - P.a) * (2 * P.R + P.a) / 3,
              volTex:'π(<i>R</i><span class="op">−</span><i>a</i>)²(2<i>R</i><span class="op">+</span><i>a</i>)/3',
              why:'The part of a ball above a horizontal plane — the shape of a contact lens, and of the region of the Earth a satellite can see. Natural in cylindrical coordinates and awkward in spherical, which is the opposite of the ball and makes the point that no one system is best.' },
  shell:    { name:'a spherical shell', short:'shell', R:1, a:0.6,
              vol:P => 4 * Math.PI * (P.R * P.R * P.R - P.a * P.a * P.a) / 3,
              volTex:'4π(<i>b</i>³<span class="op">−</span><i>a</i>³)/3',
              why:'Two constants in spherical coordinates and a genuinely unpleasant region in Cartesian ones. The shell is also where the ρ² in the volume element becomes visible as a fact about the world: the same thickness of shell holds more material further out, which is why the outer shells of a star hold most of its mass.' },
  ice:      { name:'an ice-cream cone', short:'cone ∩ ball', R:1, phi:Math.PI / 4,
              vol:P => 2 * Math.PI * P.R * P.R * P.R * (1 - Math.cos(P.phi)) / 3,
              volTex:'2π<i>R</i>³(1<span class="op">−</span>cos φ₀)/3',
              why:'A solid angle made solid: everything within R of the origin and within φ₀ of the axis. Three constant limits in spherical coordinates, and in Cartesian coordinates a region whose description needs a case split. Its volume is R³/3 times the solid angle it subtends, which is the definition of a steradian doing its job.' }
};

/* the Cartesian description: z between two surfaces over a region in (x,y) */
function csSolidCart(key, P){
  const R = P.R;
  const disc = x => Math.sqrt(Math.max(0, R * R - x * x));
  switch(key){
    case 'ball':
      return { a:-R, b:R, g1:x => -disc(x), g2:x => disc(x),
               h1:(x, y) => -Math.sqrt(Math.max(0, R * R - x * x - y * y)),
               h2:(x, y) =>  Math.sqrt(Math.max(0, R * R - x * x - y * y)) };
    case 'cylinder':
      return { a:-R, b:R, g1:x => -disc(x), g2:x => disc(x),
               h1:() => 0, h2:() => P.H };
    case 'cone':
      /* r ≤ R(1 − z/H)  ⇔  z ≤ H(1 − r/R) */
      return { a:-R, b:R, g1:x => -disc(x), g2:x => disc(x),
               h1:() => 0,
               h2:(x, y) => P.H * (1 - Math.min(1, Math.hypot(x, y) / R)) };
    case 'cap':
      { const rc = Math.sqrt(Math.max(0, R * R - P.a * P.a));
        const d = x => Math.sqrt(Math.max(0, rc * rc - x * x));
        return { a:-rc, b:rc, g1:x => -d(x), g2:x => d(x),
                 h1:() => P.a,
                 h2:(x, y) => Math.sqrt(Math.max(0, R * R - x * x - y * y)) }; }
    default: return null;              /* no honest Cartesian description */
  }
}
/* the cylindrical description: z between two surfaces over an annulus in (r,θ) */
function csSolidCyl(key, P){
  const R = P.R;
  switch(key){
    case 'ball':
      return { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => R,
               z1:r => -Math.sqrt(Math.max(0, R * R - r * r)),
               z2:r =>  Math.sqrt(Math.max(0, R * R - r * r)) };
    case 'cylinder':
      return { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => R,
               z1:() => 0, z2:() => P.H };
    case 'cone':
      return { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => R,
               z1:() => 0, z2:r => P.H * (1 - r / R) };
    case 'cap':
      { const rc = Math.sqrt(Math.max(0, R * R - P.a * P.a));
        return { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => rc,
                 z1:() => P.a, z2:r => Math.sqrt(Math.max(0, R * R - r * r)) }; }
    case 'shell':
      /* Expressible, but in TWO pieces: inside the inner radius the solid is
         the gap between the two spheres, outside it the outer sphere alone.
         Returning the pieces rather than `null` is the difference between a
         second route and a shrug — and the pieces are what a reader would draw.
         Both halves are doubled by the symmetry about z = 0. */
      return [
        { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => P.a,
          z1:r => Math.sqrt(Math.max(0, P.a * P.a - r * r)),
          z2:r => Math.sqrt(Math.max(0, R * R - r * r)), twice:true },
        { t0:0, t1:2 * Math.PI, r1:() => P.a, r2:() => R,
          z1:() => 0, z2:r => Math.sqrt(Math.max(0, R * R - r * r)), twice:true }
      ];
    case 'ice':
      /* the cone from below, the sphere from above, out to where they meet */
      { const rmax = R * Math.sin(P.phi), slope = 1 / Math.tan(P.phi);
        return { t0:0, t1:2 * Math.PI, r1:() => 0, r2:() => rmax,
                 z1:r => r * slope,
                 z2:r => Math.sqrt(Math.max(0, R * R - r * r)) }; }
    default: return null;
  }
}
/* the spherical description: ρ between two surfaces over (φ, θ) */
function csSolidSph(key, P){
  const R = P.R;
  switch(key){
    case 'ball':
      return { t0:0, t1:2 * Math.PI, p1:() => 0, p2:() => Math.PI,
               R1:() => 0, R2:() => R };
    case 'shell':
      return { t0:0, t1:2 * Math.PI, p1:() => 0, p2:() => Math.PI,
               R1:() => P.a, R2:() => R };
    case 'ice':
      return { t0:0, t1:2 * Math.PI, p1:() => 0, p2:() => P.phi,
               R1:() => 0, R2:() => R };
    case 'cap':
      /* ρ runs from the plane z = a, which is ρ = a/cos φ, out to the sphere —
         and only for φ below the rim angle. Awkward but honest. */
      { const rim = Math.acos(Math.min(1, Math.max(-1, P.a / R)));
        return { t0:0, t1:2 * Math.PI, p1:() => 0, p2:() => rim,
                 R1:ph => P.a / Math.max(1e-12, Math.cos(ph)), R2:() => R }; }
    default: return null;
  }
}

/* one route each, with the panel count exposed so a caller can refine and
   measure the rule's own error instead of assuming one */
function csVolCart(key, P, f, panels){
  const S = csSolidCart(key, P);
  if(!S) return null;
  const g = f || (() => 1);
  return nqTriple(g, S.a, S.b, S.g1, S.g2, S.h1, S.h2, 5, panels || 14);
}
function csVolCyl(key, P, f, panels){
  const S = csSolidCyl(key, P);
  if(!S) return null;
  const g = f || (() => 1);
  /* a solid may need more than one piece; `twice` doubles a piece described
     only above the plane z = 0, which is where the symmetry of a shell lives */
  const pieces = Array.isArray(S) ? S : [S];
  let sum = 0;
  for(const p of pieces)
    sum += (p.twice ? 2 : 1) *
           nqTripleCyl(g, p.t0, p.t1, p.r1, p.r2, p.z1, p.z2, 5, panels || 14);
  return sum;
}
function csVolSph(key, P, f, panels){
  const S = csSolidSph(key, P);
  if(!S) return null;
  const g = f || (() => 1);
  return nqTripleSph(g, S.t0, S.t1, S.p1, S.p2, S.R1, S.R2, 5, panels || 14);
}

/* Everything a panel prints, with each route's OWN error measured by refining
   it — never a shared tolerance. The three systems do not converge at the same
   rate on the same solid and that difference is the wing's whole point: a ball
   in spherical coordinates has three constant limits and is exact to round-off,
   while in Cartesian coordinates the same ball is bounded by two nested square
   roots whose derivatives are infinite at the edge, and no amount of Gauss
   fixes that. */
function csSolidMeasure(key, over){
  const P = Object.assign({}, CS_SOLIDS[key]);
  if(over) Object.assign(P, over);
  const out = { key, P, declared:CS_SOLIDS[key].vol(P), routes:[] };
  const add = (name, fn, note) => {
    const a = fn(14), b = fn(22);
    if(a === null || b === null) return;
    out.routes.push({ name, value:b, coarse:a, self:Math.abs(b - a), note:note || '' });
  };
  add('Cartesian', p => csVolCart(key, P, null, p),
      'z between two surfaces, over a region in the plane');
  add('cylindrical', p => csVolCyl(key, P, null, p), 'dV = r dz dr dθ');
  add('spherical',  p => csVolSph(key, P, null, p), 'dV = ρ² sin φ dρ dφ dθ');
  /* the worst disagreement with the closed form, and the scale to read it
     against — which is the volume itself, not zero */
  out.worst = 0;
  for(const r of out.routes) out.worst = Math.max(out.worst, Math.abs(r.value - out.declared));
  out.gross = Math.abs(out.declared);
  /* and the two routes that disagree with EACH OTHER the most, which is the
     comparison that needs no closed form at all */
  out.spread = 0;
  for(const a of out.routes) for(const b of out.routes)
    out.spread = Math.max(out.spread, Math.abs(a.value - b.value));
  return out;
}

/* The volume element, sampled: how much volume one unit of each coordinate
   buys at a point. This is the three-dimensional scale-factor story and it is
   what a stage draws — the cell at the equator of a sphere is ρ²sinφ times the
   cell in (ρ, φ, θ), and at the pole it is nothing at all. */
function csElementCyl(r){ return { j:r, hs:[1, r, 1], names:['r', 'θ', 'z'] }; }
function csElementSph(rho, phi){
  return { j:rho * rho * Math.sin(phi), hs:[1, rho, rho * Math.sin(phi)],
           names:['ρ', 'φ', 'θ'] };
}
/* and the same by measuring a small box rather than by quoting the formula:
   eight corners, and the volume of the parallelepiped they span */
function csCellVolCyl(r, th, z, h){
  const T = (a, b, c) => ({ x:a * Math.cos(b), y:a * Math.sin(b), z:c });
  return csBoxVol(T, r, th, z, h);
}
function csCellVolSph(rho, ph, th, h){
  const T = (a, b, c) => ({ x:a * Math.sin(b) * Math.cos(c),
                            y:a * Math.sin(b) * Math.sin(c),
                            z:a * Math.cos(b) });
  return csBoxVol(T, rho, ph, th, h);
}
/* the scalar triple product of the three edge vectors of the mapped box —
   the finite version of the 3×3 Jacobian determinant, and a route to it that
   never differentiates anything symbolically */
function csBoxVol(T, a, b, c, h){
  const O = T(a, b, c), A = T(a + h, b, c), B = T(a, b + h, c), C = T(a, b, c + h);
  const e1 = { x:A.x - O.x, y:A.y - O.y, z:A.z - O.z };
  const e2 = { x:B.x - O.x, y:B.y - O.y, z:B.z - O.z };
  const e3 = { x:C.x - O.x, y:C.y - O.y, z:C.z - O.z };
  const cr = { x:e2.y * e3.z - e2.z * e3.y,
               y:e2.z * e3.x - e2.x * e3.z,
               z:e2.x * e3.y - e2.y * e3.x };
  return Math.abs(e1.x * cr.x + e1.y * cr.y + e1.z * cr.z);
}
