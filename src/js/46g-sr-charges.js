/* ============================================================================
   5g · A CHARGE CONFIGURATION, AND A WIRE, THE READER SUPPLIES
   Programme A relativity items 6 (relBoost) and 9 (rlWire), 2026-08-19.

   UNITS: c = 1, Gaussian. A point charge's field is q r̂/r², a line charge's is
   2λ/d, a current's is 2I/d, and Gauss's law reads ∮E·dA = 4πq. No ε₀ and no
   μ₀ appear anywhere below, which is the only way the two frames' arithmetic
   stays comparable line by line.

   ------------------------------------------------------------------- item 6 --
   GAUSS'S LAW SURVIVES A BOOST, AND THAT IS NOT OBVIOUS.

   The field of a charge in uniform motion is not a Coulomb field: it is
   squashed into a pancake, stronger by γ across the motion and weaker by γ²
   along it, and at β = 0.99 the ratio between those directions is 7×10³. Every
   piece of the sphere therefore reads a wildly different E·n̂ from what it read
   at rest — and the TOTAL comes out at exactly 4πq anyway, because charge is
   invariant and Gauss's law is a statement about charge.

     ROUTE A  ∮E·dA over a sphere in the LAB, with the boosted field.
     ROUTE B  the same physical surface in the charges' REST frame, where it is
              an ELLIPSOID (x′ = γx, and the field is plain Coulomb), with the
              surface element that ellipsoid actually has.

   Different surface, different integrand, different quadrature. What they share
   is the events they pass through, which is the point.

   AND THERE IS A CLOSED FORM FOR THE CENTRED CASE, which is worth writing down
   because it is where the cancellation lives:

     ∮E·dA = q(1−β²) ∫dΩ/(1−β²sin²θ)^(3/2) = q(1−β²)·4π/(1−β²) = 4πq

   exactly, for every β. The (1−β²) that suppresses the field along the motion
   is cancelled, to the last digit, by the solid angle the pancake concentrates
   into. A quadrature that resolves the pancake gets 4πq; one that does not gets
   whatever its grid happens to see — which is why `rlGaussPlan` sizes the polar
   grid from γ rather than from a constant.

   AND THE ERROR IS NOT SIGNED, which is worse than if it were. The obvious
   argument — a grid that misses part of a positive integrand can only lose
   flux — is a Riemann sum's, not a Gauss rule's: a node landing inside the
   peak over-weights it. Measured at β = 0.99: three panels by eight azimuthal
   points returns **13.30** against 12.566, and the earlier z-axis version
   returned 0.63 of the truth. High or low, it looks converged either way.

   ------------------------------------------------------------------- item 9 --
   A WIRE IS A LIST OF CARRIER SPECIES, AND NEUTRALITY IS A MEASUREMENT.

   The textbook wire has exactly two species — a fixed lattice and drifting
   electrons — chosen so the lab sees no net charge. That choice does a lot of
   work invisibly, so here the reader writes the species: a **lab** linear
   density and a drift speed each, which is what a reader can picture. The
   proper density is then λ/γ(v), neutrality is Σλ = 0 and is something the
   panel MEASURES rather than something the setup assumes, and a wire that is
   charged in the lab is a perfectly legal thing to type — the case the
   two-species version cannot express at all.

     ROUTE A  the lab: E = 2λ/d, B = 2I/d, and F = q(E − vₜB) on a test charge
              moving parallel at vₜ.
     ROUTE B  the test charge's rest frame: every species' drift transforms by
              velocity addition, every density re-contracts by ITS OWN new γ,
              and the force is purely electric — F′ = q·2λ′/d.

   The two are related by F = F′/γₜ, because a transverse force transforms that
   way when the particle is at rest in the primed frame. That factor is applied
   once and named, rather than folded in silently: it is the one place the two
   answers legitimately differ, and hiding it would make the agreement look like
   more than it is.

   THE CANCELLATION IS THE PHYSICS AND IT IS CATASTROPHIC. For a neutral wire
   the two lab densities are equal and opposite exactly, and the imbalance that
   carries the entire magnetic force is a part in 10¹⁷ of either at a real drift
   speed. `rlWirePrime` therefore returns BOTH sums: the naive species-by-species
   one, which is what the argument says in words and which loses every digit it
   has, and the closed form γ(v′) = γ(v)γ(vₜ)(1 − v vₜ) collapses it into —
   λ′ = γₜ(λ − vₜ I), the charge-density component of the four-current, with no
   cancellation in it at all. Printing both, and the number of digits the naive
   one has left, is the lesson rather than an implementation note.
   ============================================================================ */

/* ---- item 6 · a charge configuration ------------------------------------- */

/* One charge per line: `q x y z` at rest, or `q x y z β` moving along +x.
   Everything is in the reader's own units with c = 1. */
function rlChargeParse(text, def){
  const rows = [], errs = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if(!line) return;
    const t = line.split(/[\s,]+/).filter(s => s.length);
    if(t.length < 4 || t.length > 5){
      errs.push({ line:i + 1, msg:'four numbers (q x y z), or five with a β along x — got ' + t.length });
      return;
    }
    const v = t.map(mathNum);
    const bad = v.findIndex(x => !Number.isFinite(x));
    if(bad >= 0){ errs.push({ line:i + 1, msg:'"' + t[bad] + '" is not a number' }); return; }
    const b = v.length === 5 ? v[4] : 0;
    if(!(Math.abs(b) < 1)){
      errs.push({ line:i + 1, msg:'β = ' + fmtSig(b, 4) + ' — a charge with mass moves slower than light' });
      return;
    }
    rows.push({ q:v[0], p:v3(v[1], v[2], v[3]), beta:b });
    if(rows.length > 12){ errs.push({ line:i + 1, msg:'twelve charges is the most the picture will hold' }); }
  });
  return { charges: rows.length && rows.length <= 12 ? rows : (def || []), errs };
}

/* the superposed field at a point: each charge contributes its own boosted
   Coulomb field, and its own B = β × E */
function rlChargeField(list, P){
  let E = v3(0, 0, 0), B = v3(0, 0, 0);
  for(const c of list){
    const r = vsub(P, c.p);
    const e = relMovingChargeE(c.q, c.beta, r);
    E = vadd(E, e);
    B = vadd(B, vcross(v3(c.beta, 0, 0), e));
  }
  return { E, B };
}

/* THE POLAR GRID IS SIZED BY γ, NOT BY A CONSTANT. The boosted field is
   concentrated into a band of angular width ~1/γ about the plane transverse to
   the motion, and — with the polar axis along that motion — resolving it is
   exactly what the panels are for. Swept: a centred charge at β = 0.99 goes
   from 2.8×10⁻⁸ at 20 panels to 7.8×10⁻¹⁴ at 50, and everything else is at
   round-off from the first row. The floors below are generous because the whole
   surface integral costs about 10 ms at them, and the failure mode this guards
   against is silent and **unsigned**: three panels by eight azimuthal points
   returns 13.30 against 12.566 at β = 0.99, and looks exactly as converged as
   the right answer does. */
function rlGaussPlan(list){
  let g = 1;
  for(const c of list) g = Math.max(g, relGamma(c.beta));
  return { panels: Math.max(80, Math.min(600, Math.round(16 * g))),
           nphi: Math.max(64, Math.min(256, Math.round(32 * Math.sqrt(g)))), gamma:g };
}

/* The 5-point Gauss–Legendre rule this repo already carries, panelled over
   u = cos θ — five nodes per panel, so `panels` × 5 is the polar resolution.
   φ gets the midpoint trapezoid, which on a periodic integrand is spectrally
   accurate and a Gauss rule there buys nothing.

   THE POLAR AXIS IS THE BOOST AXIS, x, AND THAT IS THE WHOLE DESIGN. The
   boosted field's structure is a band around the direction of motion, so
   putting the polar axis anywhere else buries that structure in φ — where the
   trapezoid has to resolve it with a grid that cannot be refined selectively.
   Measured with the polar axis along z instead: a centred charge at β = 0.9
   sticks at a **2.7×10⁻⁵** relative error and one at β = 0.99 at **6.4×10⁻²**,
   and neither improves with any number of panels, because panels were refining
   the easy direction. Along x, a centred charge's integrand is azimuthally
   symmetric and the same work reaches 10⁻¹⁴. */
function rlGaussSurf(f, panels, nphi){
  const G = NQ_GL[5], H = 2 / panels, dp = 2 * Math.PI / nphi;
  let a = 0, b = 0;
  for(let p = 0; p < panels; p++){
    const c = -1 + p * H + H / 2, hw = H / 2;
    for(let i = 0; i < G.x.length; i++){
      const u = c + hw * G.x[i], w = G.w[i] * hw;
      const s = Math.sqrt(Math.max(0, 1 - u * u));
      for(let j = 0; j < nphi; j++){
        const ph = (j + 0.5) * dp;
        const r = f(u, s, Math.cos(ph), Math.sin(ph));
        a += r[0] * w * dp;
        b += r[1] * w * dp;
      }
    }
  }
  return { flux:a, gross:b };
}

/* ROUTE A — ∮E·dA over a sphere in the LAB, with the boosted field. `gross` is
   ∮|E|dA, which is what the answer is a cancellation of when the sphere
   encloses nothing. */
function rlGaussFlux(list, C, R, panels, nphi){
  const P = rlGaussPlan(list);
  panels = panels || P.panels; nphi = nphi || P.nphi;
  const out = rlGaussSurf((u, s, cp, sp) => {
    const n = v3(u, s * cp, s * sp);            // polar axis = the boost axis
    const F = rlChargeField(list, vadd(C, vmul(n, R)));
    return [vdot(F.E, n) * R * R, vlen(F.E) * R * R];
  }, panels, nphi);
  out.panels = panels; out.nphi = nphi;
  return out;
}

/* ROUTE B — the SAME events, in the rest frame of a configuration that shares
   one β. The lab sphere maps to the ELLIPSOID x′ = γx, y′ = y, z′ = z, and the
   field there is plain Coulomb.

   The surface element is taken as ∂P/∂θ × ∂P/∂φ rather than derived by hand,
   so nothing about the ellipsoid's geometry is asserted; converting dθ to du
   contributes a 1/s which the cross product's own sin θ cancels, so the poles
   are finite. Different surface, different integrand, different element — what
   the two routes share is the events they pass through. */
function rlGaussFluxRest(list, C, R, beta, panels, nphi){
  const P = rlGaussPlan(list);
  panels = panels || P.panels; nphi = nphi || P.nphi;
  const g = relGamma(beta);
  const rest = list.map(c => ({ q:c.q, p:v3(g * c.p.x, c.p.y, c.p.z), beta:0 }));
  const Cr = v3(g * C.x, C.y, C.z);
  const out = rlGaussSurf((u, s, cp, sp) => {
    /* polar axis along x, which is also the stretch direction */
    const Pt = v3(Cr.x + g * R * u, Cr.y + R * s * cp, Cr.z + R * s * sp);
    const dth = v3(-g * R * s, R * u * cp, R * u * sp);
    const dph = v3(0, -R * s * sp, R * s * cp);
    const nA = vcross(dth, dph);                       // outward, and its length is the element
    const F = rlChargeField(rest, Pt);
    const inv = 1 / Math.max(1e-300, s);               // dθ → du
    return [vdot(F.E, nA) * inv, vlen(F.E) * vlen(nA) * inv];
  }, panels, nphi);
  out.panels = panels; out.nphi = nphi;
  return out;
}

/* how much charge is actually inside the sphere — the right-hand side of the
   law, and the only thing the left-hand side is allowed to depend on */
function rlEnclosed(list, C, R){
  let q = 0, near = Infinity;
  for(const c of list){
    const d = vlen(vsub(c.p, C));
    near = Math.min(near, Math.abs(d - R));
    if(d < R) q += c.q;
  }
  return { q, near };
}

/* everything the panel prints for item 6 */
function rlGaussMeasure(list, C, R){
  const out = { ok:false, why:'' };
  if(!list.length){ out.why = 'no charges'; return out; }
  const enc = rlEnclosed(list, C, R);
  /* A CHARGE ON THE SURFACE IS NOT A CASE, IT IS A SINGULARITY. Gauss's law
     says nothing about it and the quadrature diverges, so it is refused by
     name rather than integrated to whatever the grid happens to produce. */
  if(enc.near < 1e-6 * R){
    out.why = 'a charge is sitting on the surface, where the field is infinite and ' +
              'Gauss\'s law says nothing — move the sphere or the charge';
    return out;
  }
  const A = rlGaussFlux(list, C, R);
  const betas = list.map(c => c.beta);
  const oneBeta = betas.every(b => Math.abs(b - betas[0]) < 1e-15) ? betas[0] : null;
  out.ok = true;
  out.enclosed = enc.q; out.expect = 4 * Math.PI * enc.q;
  out.lab = A.flux; out.gross = A.gross; out.panels = A.panels; out.nu = 5 * A.panels; out.nphi = A.nphi;
  out.gamma = rlGaussPlan(list).gamma;
  if(oneBeta !== null){
    const B = rlGaussFluxRest(list, C, R, oneBeta, A.panels, A.nphi);
    out.rest = B.flux; out.restGross = B.gross; out.beta = oneBeta;
  } else out.beta = null;
  return out;
}

const RL_CHARGES = {
  one:    { name:'one charge, at rest', short:'at rest',
            text:'1 0 0 0', cx:0, cy:0, cz:0, R:2, enc:1,
            why:'The case Gauss stated. Everything below is this one, moved.' },
  fast:   { name:'one charge at 0.9c', short:'0.9c',
            text:'1 0 0 0 0.9', cx:0, cy:0, cz:0, R:2, enc:1,
            why:'The same charge, moving. Its field is a pancake — γ³ = 12 times stronger across the motion than along it — and the total flux is unchanged to the last digit.' },
  ultra:  { name:'one charge at 0.99c', short:'0.99c',
            text:'1 0 0 0 0.99', cx:0, cy:0, cz:0, R:2, enc:1,
            why:'γ = 7.09, and the flux is concentrated into a band about a seventh of a radian wide — the integrand varies by a factor of 350 around one sphere. This is the preset that breaks a fixed quadrature grid, and it does so <b>without announcing it</b>: at three panels by eight azimuthal points the answer comes out 13.30 instead of 12.57, and at a coarse grid about the wrong axis it came out 37% low. High or low, it looks exactly as converged as the right answer.' },
  pair:   { name:'a dipole, both moving', short:'a dipole',
            text:'1 -0.6 0 0 0.8\n-1 0.6 0 0 0.8', cx:0, cy:0, cz:0, R:2, enc:0,
            why:'Two opposite charges inside one sphere. The enclosed charge is exactly zero, so the flux is a cancellation — printed against ∮|E|dA, which is not zero at all.' },
  outside:{ name:'a charge outside the sphere', short:'outside',
            text:'1 3 0 0 0.5', cx:0, cy:0, cz:0, R:2, enc:0,
            why:'Every part of the sphere feels this charge, and the total is zero: what goes in comes out. That is the half of Gauss\'s law people forget, and it is a cancellation too.' },
  three:  { name:'three charges, two inside', short:'three',
            text:'2 0.5 0.5 0 0.6\n-1 -0.8 0 0.3 0.6\n5 4 0 0 0.6', cx:0, cy:0, cz:0, R:2, enc:1,
            why:'The enclosed total is 2 − 1 = 1, and the third charge — five times larger and outside — contributes nothing whatever to the total.' }
};

/* ---- item 9 · a wire the reader composes ---------------------------------- */

/* One carrier species per line: `λ v [name]`, where λ is the density measured
   in the LAB (which is what a reader can picture) and v its drift speed. The
   proper density is then λ/γ(v), and a neutral wire is simply one whose λ's
   sum to zero — something the panel MEASURES rather than something the setup
   assumes. A wire that is charged in the lab is a legal thing to type, and it
   is the case the two-species textbook version cannot express. */
function rlWireParse(text, def){
  const rows = [], errs = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if(!line) return;
    const t = line.split(/[\s,]+/).filter(s => s.length);
    if(t.length < 2){ errs.push({ line:i + 1, msg:'a density and a drift speed, then an optional name' }); return; }
    const lam = mathNum(t[0]), v = mathNum(t[1]);
    if(!Number.isFinite(lam)){ errs.push({ line:i + 1, msg:'"' + t[0] + '" is not a density' }); return; }
    if(!Number.isFinite(v)){ errs.push({ line:i + 1, msg:'"' + t[1] + '" is not a speed' }); return; }
    if(!(Math.abs(v) < 1)){
      errs.push({ line:i + 1, msg:'β = ' + fmtSig(v, 4) + ' — charge carriers move slower than light' });
      return;
    }
    rows.push({ lam, v, name:t.slice(2).join(' ') || ('species ' + (rows.length + 1)) });
  });
  if(rows.length > 8) errs.push({ line:0, msg:'eight carrier species is the most this will take' });
  return { species: rows.length && rows.length <= 8 ? rows : (def || []), errs };
}

/* the lab: net density and net current, each a plain sum over the species */
function rlWireLab(sp){
  let lam = 0, I = 0;
  for(const s of sp){ lam += s.lam; I += s.lam * s.v; }
  return { lam, I };
}

/* The test charge's rest frame, TWICE.

   NAIVE  transform each species' drift by velocity addition, re-contract its
          own proper density by its own new γ, and add them up. This is what
          the argument says in words, and at any real drift speed it is
          arithmetic suicide: the terms are equal to sixteen digits and the
          imbalance carrying the whole magnetic force is a part in 10¹⁷ of
          either one.
   EXACT  the same sum collapsed in closed form using γ(v′) = γ(v)γ(vₜ)(1−v vₜ),
          which gives λ′ = γₜ(λ − vₜ I) — the charge-density component of the
          four-current transforming, with no cancellation in it at all.

   Both are returned, along with `gross` (Σ|λ′ᵢ|, what the cancellation happens
   against) and the number of digits the naive route has left. That number is
   the lesson: this is not a coding inconvenience, it is why the effect is
   invisible in the lab and enormous in its consequences. */
function rlWirePrime(sp, vt){
  const gt = relGamma(vt);
  let naive = 0, gross = 0;
  for(const s of sp){
    const vp = relVelAdd(s.v, -vt);
    const lp = s.lam * relGamma(vp) / relGamma(s.v);
    naive += lp; gross += Math.abs(lp);
  }
  const L = rlWireLab(sp);
  const exact = gt * (L.lam - vt * L.I);
  const digits = gross > 0 ? Math.max(0, -Math.log10(Math.max(1e-300, Math.abs(exact)) / gross)) : 0;
  return { exact, naive, gross, digits, gamma:gt, lost:Math.abs(naive - exact) };
}

/* The force on a test charge q at distance d, moving parallel at vt.

   ROUTE A  the lab: E = 2λ/d radially and B = 2I/d azimuthally, and the
            Lorentz force F = q(E − vₜB) across the wire.
   ROUTE B  the charge's own frame, where it is at rest and the magnetic force
            is identically zero: F′ = q·2λ′/d, purely electrostatic.

   They are related by F = F′/γₜ, because a transverse force transforms that
   way when the particle is at rest in the primed frame. That factor is applied
   once and named, rather than being folded in silently — it is the one place
   the two answers legitimately differ, and hiding it would make the agreement
   look like more than it is. */
function rlWireForce(sp, vt, d, q){
  const L = rlWireLab(sp);
  const P = rlWirePrime(sp, vt);
  const E = 2 * L.lam / d, B = 2 * L.I / d;
  const lab = q * (E - vt * B);
  const restExact = q * 2 * P.exact / d;
  const restNaive = q * 2 * P.naive / d;
  return { lab, restExact, restNaive, viaExact:restExact / P.gamma, viaNaive:restNaive / P.gamma,
           E, B, lam:L.lam, I:L.I, prime:P,
           gross: Math.abs(q * 2 * P.gross / d / P.gamma),
           neutral: Math.abs(L.lam) <= 1e-12 * Math.max(1e-30, sp.reduce((a, s) => a + Math.abs(s.lam), 0)) };
}

const RL_WIRES = {
  neutral:  { name:'the textbook wire — neutral in the lab', short:'neutral',
              text:'1 0 lattice\n-1 0.5 electrons', vt:0.4, neutral:true,
              why:'Equal and opposite lab densities, so the lab sees no electric field at all and the force is purely magnetic. Ride with the test charge and the magnetism is gone — but the two densities no longer cancel, and the same force reappears as electrostatics.' },
  charged:  { name:'a wire with net charge', short:'charged',
              text:'1.2 0 lattice\n-1 0.5 electrons', vt:0.4, neutral:false,
              why:'The textbook setup cannot express this, because it assumes neutrality. Here both an electric and a magnetic force act in the lab, and the frames still agree — which is the point: neutrality was never what made the argument work.' },
  twoCarrier:{ name:'two carriers drifting opposite ways', short:'two carriers',
              text:'1 0 lattice\n-0.5 0.6 electrons\n-0.5 -0.3 holes', vt:0.3, neutral:true,
              why:'A semiconductor, roughly: two mobile species moving in opposite directions. Still neutral, still a current, and the frame argument does not care how many species there are.' },
  real:     { name:'a real copper wire', short:'realistic',
              text:'1 0 lattice\n-1 3.3e-13 electrons', vt:1e-8, neutral:true,
              why:'Electrons drift through household wiring at about a tenth of a millimetre a second — β = 3×10⁻¹³. The naive frame-by-frame sum loses every digit it has here; the closed form does not, and the ratio between them is the whole reason this effect is so easy to miss and so impossible to avoid.' }
};
