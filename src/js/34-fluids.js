/* ============================================================================
   1n · FLUIDS — statics and dynamics
   AP Physics 1 (2024 redesign) unit 8 and AP Physics 2 unit 1.

   Two ideas carry the whole subject. In statics, pressure is what a fluid does
   instead of shear, and it grows with depth because the fluid above has weight.
   In flow, continuity is conservation of volume and Bernoulli is conservation of
   energy per unit volume — nothing else is needed.
   ============================================================================ */

const FL_RHO_WATER = 1000;               // kg/m³ at 4 °C
const FL_P_ATM = 101325;                 // Pa — one standard atmosphere

/* ------------------------------------------------------------- statics ---- */
const flPressure = (F, A) => F / A;
const flDepth = (rho, h, p0) => (p0 === undefined ? FL_P_ATM : p0) + rho * DY_G * h;
const flGauge = (rho, h) => rho * DY_G * h;
/* Pascal's principle as the hydraulic lift: the same pressure, two areas */
function flHydraulic(F1, A1, A2){
  const P = F1 / A1, F2 = P * A2;
  return { P, F2, advantage:A2 / A1,
    /* the work is unchanged — the small piston must move further, by the same ratio */
    d2Over_d1:A1 / A2 };
}
/* Archimedes: the buoyant force is the weight of the displaced fluid, which is
   the net of the depth-varying pressure over the surface */
function flBuoyancy(rhoF, V, rhoObj){
  const Vsub = rhoObj === undefined ? V : Math.min(V, V * rhoObj / rhoF);
  const FB = rhoF * DY_G * Vsub;
  const W = rhoObj === undefined ? NaN : rhoObj * V * DY_G;
  return { FB, Vsub, fracSub:Vsub / V, W,
    floats:rhoObj !== undefined && rhoObj < rhoF,
    apparentW:Number.isFinite(W) ? W - rhoF * DY_G * V : NaN };
}
/* the same buoyant force obtained the hard way: integrating pressure over the
   surface of a submerged cube, so the theorem is derived rather than quoted */
function flBuoyancyIntegral(rhoF, side, depthTop){
  const pTop = flDepth(rhoF, depthTop);
  const pBot = flDepth(rhoF, depthTop + side);
  const A = side * side;
  /* the sides cancel by symmetry; only top and bottom survive */
  return { pTop, pBot, FB:(pBot - pTop) * A, predicted:rhoF * DY_G * side * side * side };
}
/* ----------------------------------------------------------------------------
   A BODY THE READER SHAPES  —  Archimedes obtained rather than quoted

   The cube above gets away with differencing two faces because a cube's sides
   are vertical and cancel exactly. Give the body a radius that varies with
   height and nothing cancels: every sloping flank carries a vertical component
   of pressure, and the buoyant force has to be assembled the only way it is
   ever really defined — by integrating pressure over the actual surface.

   For the solid of revolution r(z), 0 ≤ z ≤ H, the outward area element is

       n̂ dA = (r cosθ, r sinθ, −r r′) dz dθ

   so, writing s(z) = r(z)² and integrating θ out, the vertical pressure force is

       F_z = −∮ P n_z dA = π ∫₀ᴴ P(z) s′(z) dz + π s(0) P(0) − π s(H) P(H)

   the two end terms being the flat caps, and

       P(z) = P₀ + ρg·max(0, z_w − z)

   hydrostatic below the waterline z_w and atmospheric above it. **No volume
   appears anywhere in that expression.** The volume is computed separately as
   V = π∫s dz, and ρg·V_sub compared against the surface integral: the two share
   no line of code, and Archimedes' principle is the claim that they agree.

   Where the body floats is found the same way — bisection on z_w until the
   *integrated* force balances the weight. The density ratio is never used, so
   the submerged-volume fraction that comes out is the floating law measured
   instead of applied. The fraction of the HEIGHT under water is a different
   number entirely for anything that is not a prism, and that is precisely what
   a cube cannot show.

   Stability then costs nothing extra, because the integrals already exist. B is
   the centroid of the displaced volume, G the centroid of the whole body, and
   the metacentre sits BM = I_waterplane/V_sub above B with I = πr_w⁴/4 for a
   circular waterplane. GM = KB + BM − KG, and a hull with GM < 0 floats
   perfectly well and capsizes.
   ---------------------------------------------------------------------------- */
/* s′ by central difference, second-order one-sided at the ends — a hemisphere
   has a vertical tangent at its rim, and a first-order endpoint sample there
   would leak more error than the agreement being measured */
function flDs(s, z, H, h){
  const e = h || 1e-5;
  if(H < 4 * e) return (s(Math.min(H, z + e)) - s(Math.max(0, z - e))) /
                       (Math.min(H, z + e) - Math.max(0, z - e) || 1);
  if(z - e < 0) return (-3 * s(z) + 4 * s(z + e) - s(z + 2 * e)) / (2 * e);
  if(z + e > H) return ( 3 * s(z) - 4 * s(z - e) + s(z - 2 * e)) / (2 * e);
  return (s(z + e) - s(z - e)) / (2 * e);
}
const flBodyS = rOf => z => { const r = rOf(z); return Number.isFinite(r) && r > 0 ? r * r : 0; };
/* route 1 — the pressure integral over the closed surface. Knows no theorem.

   p0 is the ambient pressure and defaults to zero, because a *uniform* pressure
   exerts no net force on a closed surface at all: π∫s′dz telescopes to
   s(H) − s(0) and the two cap terms cancel it exactly. That is worth stating
   rather than assuming, so flBodyBuoy runs the integral a second time with the
   full atmosphere in it and prints the difference — the measured statement that
   buoyancy does not care what the barometer says. Carrying 101 kPa through a
   cancellation that is exact on paper only costs precision in the comparison
   that matters, which is why it is not carried by default. */
function flBodyForce(rOf, H, rhoF, zw, h, p0, panels){
  const s = flBodyS(rOf);
  const pa = p0 || 0;
  const P = z => pa + rhoF * DY_G * Math.max(0, zw - z);
  const g = z => P(z) * flDs(s, z, H, h);
  /* P has a kink at the waterline, so the integral is split there rather than
     asked of one rule across a corner. Fixed-panel Gauss–Legendre rather than
     the adaptive rule: this runs inside a bisection, so its cost has to be
     bounded, and an absolute tolerance meaningful for an integrand of order
     10⁴ would drive adaptive Simpson to its depth limit on every call. It is
     also a *different* rule from the one the volume route uses, which is the
     point — the two answers should not share an error. */
  const N = panels || 120;
  const zc = Math.max(0, Math.min(H, zw));
  const lat = nqGauss(g, 0, zc, 8, N) + nqGauss(g, zc, H, 8, N);
  return Math.PI * (lat + s(0) * P(0) - s(H) * P(H));
}
/* route 2 — the volume, and its centroid, by quadrature. Integrates no pressure. */
function flBodyVolume(rOf, z0, z1){
  return Math.PI * nqAdaptive(flBodyS(rOf), z0, z1, 1e-12);
}
function flBodyCentroid(rOf, z0, z1, V){
  const s = flBodyS(rOf);
  if(!(V > 0)) return 0;
  return Math.PI * nqAdaptive(z => z * s(z), z0, z1, 1e-12) / V;
}
const FL_BODY_EMPTY = { empty:true, V:0, Vsub:0, m:0, W:0, floats:false, zw:0, H:0,
  Fsurf:0, Farch:0, gap:0, Fatm:0, atmGap:0, rel:0, fracVol:0, fracH:0, ratio:0, lawGap:0, apparentW:0,
  KG:0, KB:0, rw:0, Iw:0, BM:0, GM:0, stable:false, hasMeta:false };
function flBodyBuoy(rOf, H, rhoF, rhoO, opt){
  const o = opt || {}, h = o.h;
  const V = flBodyVolume(rOf, 0, H);
  /* a profile that is zero or negative everywhere encloses nothing, and every
     ratio below would divide by it — say so rather than print a stream of NaN */
  if(!(V > 1e-12) || !Number.isFinite(V)) return FL_BODY_EMPTY;
  const m = rhoO * V, W = m * DY_G;
  const Fz = zw => flBodyForce(rOf, H, rhoF, zw, h);
  /* fully submerged is the most buoyancy there is; if that cannot lift the
     weight the body sinks and the waterline question does not arise */
  const Ffull = Fz(H);
  const floats = Ffull >= W;
  let zw = H;
  if(floats){
    const root = nqBisect(z => Fz(z) - W, 0, H, 1e-13, 200);
    if(root !== null && Number.isFinite(root)) zw = root;
  }
  const Vsub = flBodyVolume(rOf, 0, Math.min(H, zw));
  const Fsurf = Fz(zw);                       /* pressure over the surface     */
  const Farch = rhoF * DY_G * Vsub;           /* ρgV — the theorem             */
  const gap = Math.abs(Fsurf - Farch);
  /* the same surface integral with the whole atmosphere added to every point of
     it: a uniform pressure contributes nothing to a closed surface, and this is
     that claim measured rather than argued */
  const Fatm = flBodyForce(rOf, H, rhoF, zw, h, FL_P_ATM);
  const KG = flBodyCentroid(rOf, 0, H, V);
  const KB = flBodyCentroid(rOf, 0, Math.min(H, zw), Vsub);
  const rwRaw = rOf(Math.min(H, zw));
  const rw = Number.isFinite(rwRaw) && rwRaw > 0 ? rwRaw : 0;
  const Iw = Math.PI * Math.pow(rw, 4) / 4;
  const BM = Vsub > 1e-12 ? Iw / Vsub : 0;
  const GM = KB + BM - KG;
  return { V, Vsub, m, W, floats, zw, H,
    Fsurf, Farch, gap, Fatm, atmGap:Math.abs(Fatm - Fsurf),
    rel:Farch > 0 ? gap / Farch : gap,
    /* the floating law, measured: this ratio was never put in */
    fracVol:V > 0 ? Vsub / V : 0,
    fracH:H > 0 ? Math.min(H, zw) / H : 0,
    ratio:rhoF > 0 ? rhoO / rhoF : Infinity,
    lawGap:V > 0 && rhoF > 0 ? Math.abs(Vsub / V - rhoO / rhoF) : 0,
    apparentW:W - Ffull,                      /* what a submerged body weighs  */
    KG, KB, rw, Iw, BM, GM,
    stable:floats ? GM > 0 : KB > KG,
    /* a sunk body has no waterplane, so metacentric height means nothing there */
    hasMeta:floats && Vsub > 0 && rw > 0 };
}

const FL_MATERIALS = {
  water:    { name:'Water',        rho:1000 },
  ice:      { name:'Ice',          rho:917 },
  seawater: { name:'Seawater',     rho:1025 },
  oil:      { name:'Olive oil',    rho:911 },
  wood:     { name:'Oak',          rho:750 },
  aluminium:{ name:'Aluminium',    rho:2700 },
  iron:     { name:'Iron',         rho:7874 },
  mercury:  { name:'Mercury',      rho:13534 },
  air:      { name:'Air (sea level)', rho:1.225 }
};

/* ------------------------------------------------------------ dynamics ---- */
/* continuity: an incompressible fluid conserves volume, so A₁v₁ = A₂v₂ */
const flContinuity = (A1, v1, A2) => A1 * v1 / A2;
const flFlowRate = (A, v) => A * v;
/* Bernoulli: P + ½ρv² + ρgh is the same everywhere along a streamline. It is
   the work–energy theorem per unit volume, and nothing more. */
function flBernoulli(rho, P1, v1, h1, v2, h2){
  const P2 = P1 + 0.5 * rho * (v1 * v1 - v2 * v2) + rho * DY_G * (h1 - h2);
  return { P2,
    e1:{ P:P1, dyn:0.5 * rho * v1 * v1, grav:rho * DY_G * h1, total:P1 + 0.5 * rho * v1 * v1 + rho * DY_G * h1 },
    e2:{ P:P2, dyn:0.5 * rho * v2 * v2, grav:rho * DY_G * h2, total:P2 + 0.5 * rho * v2 * v2 + rho * DY_G * h2 } };
}
/* a pipe of varying area, solved end to end: the speed follows from continuity
   and the pressure from Bernoulli, so the counter-intuitive result — pressure
   *drops* where the pipe narrows and the fluid speeds up — comes out on its own */
function flPipe(rho, A, v0, A0, P0, h){
  const v = A0 * v0 / A;
  const P = P0 + 0.5 * rho * (v0 * v0 - v * v) + rho * DY_G * ((h && h.h0 !== undefined ? h.h0 : 0) - (h && h.h !== undefined ? h.h : 0));
  return { v, P, dyn:0.5 * rho * v * v, Q:A * v };
}
/* Torricelli: a hole in a tank empties as if the fluid had simply fallen */
/* ----------------------------------------------------------------------------
   A PIPE THE READER SHAPES

   The Venturi has two areas because two is the fewest that shows the effect. A
   pipe whose cross-section is a function of position has no special sections at
   all, and the two laws then have to hold everywhere along it rather than at a
   pair of chosen points.

   Continuity fixes the speed outright: Q = A·v is the same everywhere, so
   v(x) = Q/A(x). The pressure is where the interest is, and it is computed by
   **two routes that are genuinely different**:

     BERNOULLI   P + ½ρv² + ρgh is constant, evaluated algebraically at each x.
     EULER       dP/dx = −ρv·dv/dx − ρg·dh/dx, integrated forward from the inlet
                 by RK4, never once using the constant.

   Bernoulli *is* the first integral of Euler, so the two must agree — and
   nothing in the code makes them. Their largest separation along the pipe is
   therefore Bernoulli being verified as an integral rather than quoted as a
   formula, on a pipe nobody chose.

   One thing a preset never has to worry about: a sufficiently narrow throat
   drives the computed pressure below zero, and long before that below the vapour
   pressure of the liquid, at which point it boils and the model stops describing
   anything. That is reported rather than drawn as a negative pressure.
   ---------------------------------------------------------------------------- */
const FL_P_VAPOUR = 2339;                 /* water at 20 °C, Pa */
function flPipeRun(rho, Aof, hof, v0, P0, L, n){
  const N = n || 400, h = L / N;
  const A0 = Math.max(1e-9, Aof(0)), Q = A0 * v0, h0 = hof(0);
  const vOf = x => Q / Math.max(1e-9, Aof(x));
  const dOf = (f, x) => (f(x + 1e-6) - f(x - 1e-6)) / 2e-6;
  /* route 1: the constant, evaluated */
  const Pb = x => P0 + 0.5 * rho * (v0 * v0 - vOf(x) * vOf(x)) - rho * DY_G * (hof(x) - h0);
  /* route 2: the differential equation, integrated */
  const slope = x => -rho * vOf(x) * dOf(vOf, x) - rho * DY_G * dOf(hof, x);
  const rows = [];
  let P = P0, worst = 0, minP = P0, minA = A0, maxV = v0;
  for(let i = 0; i <= N; i++){
    const x = i * h;
    const pb = Pb(x);
    worst = Math.max(worst, Math.abs(P - pb));
    minP = Math.min(minP, pb);
    minA = Math.min(minA, Aof(x));
    maxV = Math.max(maxV, vOf(x));
    rows.push({ x, A:Aof(x), v:vOf(x), h:hof(x), P:pb, Pe:P });
    if(i < N){
      /* RK4 on dP/dx */
      const k1 = slope(x), k2 = slope(x + h / 2), k3 = k2, k4 = slope(x + h);
      P += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6;
    }
  }
  return { Q, rows, gap:worst, minP, minA, maxV,
           cavitates:minP < FL_P_VAPOUR,
           /* the relative disagreement, which is what should be read */
           rel:Math.abs(P0) > 0 ? worst / Math.abs(P0) : worst };
}

function flTorricelli(h){
  return { v:Math.sqrt(2 * DY_G * h),
    note:'Bernoulli between the free surface and the hole, both at atmospheric pressure' };
}
/* the Reynolds number, which decides whether any of the above is trustworthy */
function flReynolds(rho, v, L, mu){
  const Re = rho * v * L / mu;
  return { Re, regime:Re < 2300 ? 'laminar — smooth, predictable, Bernoulli applies'
    : Re < 4000 ? 'transitional' : 'turbulent — Bernoulli along a streamline is no longer a useful statement' };
}
/* viscous flow in a pipe: Poiseuille, where the r⁴ is the reason arteries matter */
function flPoiseuille(dP, r, mu, L){
  return { Q:Math.PI * Math.pow(r, 4) * dP / (8 * mu * L),
    vmax:dP * r * r / (4 * mu * L) };
}
