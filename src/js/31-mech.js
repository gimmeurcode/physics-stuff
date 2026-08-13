/* ============================================================================
   1k · MECHANICS — kinematics, dynamics, energy, momentum, gravitation
   AP Physics 1 units 1–5 and AP Physics C: Mechanics.

   The kinematic equations are not the model here; they are a *consequence* of
   integrating a = const twice, and where the acceleration is not constant (drag,
   a spring, an orbit) the same integrator handles it and the closed forms simply
   stop applying. Every conserved quantity is measured along the integrated
   trajectory rather than asserted.
   ============================================================================ */

/* Standard gravity: an exact defined value (CGPM 1901), not a measurement.
   Real local g varies with latitude and altitude from about 9.764 m/s² (high
   and near the equator) to 9.834 m/s² (at the poles) — a spread of 0.7%, which
   is far larger than the precision anything in this laboratory quotes. Every
   wing uses this one constant so that no two stages disagree with each other. */
const DY_G = 9.80665;                    // m/s², exact by definition
const DY_G_GRAV = 6.67430e-11;           // m³kg⁻¹s⁻² — CODATA 2022
const DY_M_EARTH = 5.9722e24;            // kg
const DY_R_EARTH = 6.371e6;              // m — volumetric mean radius

/* ------------------------------------------------------------ kinematics ---- */
/* The four constant-acceleration equations, each derived by eliminating one
   variable from x = x₀ + v₀t + ½at² and v = v₀ + at. */
const dyPos = (x0, v0, a, t) => x0 + v0 * t + 0.5 * a * t * t;
const dyVel = (v0, a, t) => v0 + a * t;
const dyVelFromX = (v0, a, dx) => Math.sqrt(Math.max(0, v0 * v0 + 2 * a * dx));
const dyAvgVel = (v0, v) => (v0 + v) / 2;
/* the time to reach a displacement — the quadratic, with the physical root */
function dyTimeTo(x0, v0, a, x){
  if(Math.abs(a) < 1e-12) return Math.abs(v0) < 1e-12 ? NaN : (x - x0) / v0;
  const disc = v0 * v0 + 2 * a * (x - x0);
  if(disc < 0) return NaN;
  const s = Math.sqrt(disc);
  const t1 = (-v0 + s) / a, t2 = (-v0 - s) / a;
  const pos = [t1, t2].filter(t => t >= -1e-12).sort((p, q) => p - q);
  return pos.length ? pos[0] : NaN;
}

/* projectile motion in closed form, and the same motion with quadratic drag
   integrated — so the difference the air makes is visible rather than described */
function dyProjectile(v0, ang, y0, g){
  const G = g === undefined ? DY_G : g;
  const vx = v0 * Math.cos(ang), vy = v0 * Math.sin(ang);
  const tTop = vy / G;
  const hMax = (y0 || 0) + vy * vy / (2 * G);
  const tLand = (vy + Math.sqrt(vy * vy + 2 * G * (y0 || 0))) / G;
  return { vx, vy, tTop, hMax, tLand, range:vx * tLand,
    at:t => ({ x:vx * t, y:(y0 || 0) + vy * t - 0.5 * G * t * t }),
    vAt:t => ({ x:vx, y:vy - G * t }) };
}
/* with drag F = −½ρC_dA|v|v, integrated by RK4 on the four-state system */
function dyProjectileDrag(v0, ang, y0, m, k, g, dt, nmax){
  const G = g === undefined ? DY_G : g;
  const h = dt || 0.002, N = nmax || 20000;
  let x = 0, y = y0 || 0, vx = v0 * Math.cos(ang), vy = v0 * Math.sin(ang);
  const pts = [{ x, y, t:0 }];
  const acc = (vx, vy) => {
    const s = Math.hypot(vx, vy);
    return { ax:-k / m * s * vx, ay:-G - k / m * s * vy };
  };
  for(let i = 1; i <= N && y >= -1e-9; i++){
    const a1 = acc(vx, vy);
    const a2 = acc(vx + h / 2 * a1.ax, vy + h / 2 * a1.ay);
    const a3 = acc(vx + h / 2 * a2.ax, vy + h / 2 * a2.ay);
    const a4 = acc(vx + h * a3.ax, vy + h * a3.ay);
    x += h * (vx + h / 6 * (a1.ax + a2.ax + a3.ax));
    y += h * (vy + h / 6 * (a1.ay + a2.ay + a3.ay));
    vx += h / 6 * (a1.ax + 2 * a2.ax + 2 * a3.ax + a4.ax);
    vy += h / 6 * (a1.ay + 2 * a2.ay + 2 * a3.ay + a4.ay);
    pts.push({ x, y, t:i * h });
    if(y < 0) break;
  }
  const last = pts[pts.length - 1];
  return { pts, range:last.x, tLand:last.t,
    hMax:pts.reduce((m2, p) => Math.max(m2, p.y), 0) };
}

/* ------------------------------------------------------------- dynamics ---- */
/* Every scenario returns the free-body decomposition as well as the answer,
   because the decomposition *is* the physics and the answer is arithmetic. */
const DY_SCENES = {
  incline: { name:'Block on an incline', m:2, ang:25 * Math.PI / 180, mu:0.25,
    solve(m, ang, mu){
      const W = m * DY_G;
      const along = W * Math.sin(ang), normal = W * Math.cos(ang);
      const fMax = mu * normal;
      const slides = along > fMax;
      const a = slides ? (along - fMax) / m : 0;
      return { W, along, normal, fMax, slides, a,
        friction: slides ? fMax : along, net: slides ? along - fMax : 0 };
    },
    note:'Rotate the axes to lie along the slope and the weight splits into <b>mg sin θ</b> down the incline and <b>mg cos θ</b> into it. Static friction can supply anything up to <b>μN</b> and no more: below that threshold it exactly cancels the pull and the block sits still, which is why the friction force is not μN until the moment it slips.' },
  atwood: { name:'Atwood machine', m1:3, m2:2,
    solve(m1, m2){
      const a = (m1 - m2) * DY_G / (m1 + m2);
      const T = 2 * m1 * m2 * DY_G / (m1 + m2);
      return { a, T, check1:m1 * DY_G - T - m1 * a, check2:T - m2 * DY_G - m2 * a };
    },
    note:'Two masses, one string, one acceleration — the constraint that the string does not stretch is what couples them. Solving the two force equations together gives <b>a = (m₁−m₂)g/(m₁+m₂)</b>, and the tension is the <i>harmonic</i>-mean combination, always between the two weights. The two residual rows are Newton\'s second law re-checked on each block separately.' },
  drag: { name:'Terminal velocity', m:70, k:0.25,
    solve(m, k){
      const vt = Math.sqrt(m * DY_G / k);
      return { vt, tau:vt / DY_G, at:t => vt * Math.tanh(DY_G * t / vt) };
    },
    note:'With quadratic drag, <b>m dv/dt = mg − kv²</b> — a separable equation whose solution is <b>v = v_T tanh(gt/v_T)</b>. The terminal speed is where the two forces balance, <b>v_T = √(mg/k)</b>, and it is approached exponentially but never reached. A skydiver hits 95% of it in about three time constants.' },
  circular: { name:'Circular motion', m:1.2, r:0.8, v:3,
    solve(m, r, v){
      const ac = v * v / r, F = m * ac;
      return { ac, F, T:2 * Math.PI * r / v, omega:v / r,
        vMinTop:Math.sqrt(DY_G * r), FtopMin:0 };
    },
    note:'Uniform circular motion has constant <i>speed</i> and constantly changing velocity, so it is accelerating — towards the centre, at <b>v²/r</b>. There is no outward force: what is called centrifugal is the absence of a force in a rotating frame. At the top of a vertical loop gravity alone can supply the centripetal requirement once <b>v ≥ √(gr)</b>, which is the minimum speed to keep contact.' }
};
/* friction, as the piecewise thing it actually is */
function dyFriction(applied, normal, muS, muK, moving){
  const fs = muS * normal, fk = muK * normal;
  if(!moving && Math.abs(applied) <= fs) return { f:-applied, kind:'static, and not at its limit', moving:false };
  return { f:-Math.sign(applied || 1) * fk, kind:'kinetic', moving:true, fs, fk };
}

/* --------------------------------------------------------------- energy ---- */
const dyKE = (m, v) => 0.5 * m * v * v;
const dyPEg = (m, h, g) => m * (g === undefined ? DY_G : g) * h;
const dyPEs = (k, x) => 0.5 * k * x * x;
const dyWork = (F, d, ang) => F * d * Math.cos(ang === undefined ? 0 : ang);
/* work done by a varying force is the integral — the definition, not a special case */
const dyWorkVar = (F, a, b) => nqAdaptive(F, a, b, 1e-11);
const dyPower = (W, t) => W / t;
/* a roller-coaster style track: energy conservation checked at every point of
   an integrated run, with friction removing exactly the work it does */
function dyTrackRun(hOf, x0, v0, m, mu, dx, n){
  const h = dx || 0.002, N = n || 40000;
  let x = x0, v = v0, lost = 0;
  const E0 = dyKE(m, v0) + dyPEg(m, hOf(x0));
  const pts = [];
  for(let i = 0; i < N; i++){
    const slope = (hOf(x + 1e-5) - hOf(x - 1e-5)) / 2e-5;
    const th = Math.atan(slope);
    const a = -DY_G * Math.sin(th) - (mu || 0) * DY_G * Math.cos(th) * Math.sign(v || 1);
    const ds = v * h;
    v += a * h;
    x += ds * Math.cos(th);
    lost += (mu || 0) * m * DY_G * Math.cos(th) * Math.abs(ds);
    pts.push({ x, h:hOf(x), v, KE:dyKE(m, v), PE:dyPEg(m, hOf(x)), lost });
    if(!Number.isFinite(v) || Math.abs(v) > 1e4) break;
  }
  return { pts, E0, drift:pts.length ? Math.abs(pts[pts.length - 1].KE + pts[pts.length - 1].PE + pts[pts.length - 1].lost - E0) : 0 };
}

/* ------------------------------------------------------------- momentum ---- */
const dyMomentum = (m, v) => m * v;
const dyImpulse = (F, dt) => F * dt;
/* a one-dimensional collision at any elasticity e: e = 1 elastic, e = 0
   perfectly inelastic. Momentum is conserved for every e; energy only at e = 1. */
function dyCollide(m1, u1, m2, u2, e){
  const M = m1 + m2;
  const vcm = (m1 * u1 + m2 * u2) / M;
  const v1 = vcm + e * m2 * (u2 - u1) / M;
  const v2 = vcm + e * m1 * (u1 - u2) / M;
  const p0 = m1 * u1 + m2 * u2, p1 = m1 * v1 + m2 * v2;
  const K0 = dyKE(m1, u1) + dyKE(m2, u2), K1 = dyKE(m1, v1) + dyKE(m2, v2);
  return { v1, v2, vcm, p0, p1, dp:p1 - p0, K0, K1, dK:K1 - K0,
    elastic:Math.abs(e - 1) < 1e-12, lost:K0 - K1 };
}
/* the centre of mass of a set of particles, and its velocity — which no
   internal force can ever change */
function dyCOM(parts){
  let M = 0, x = 0, y = 0, px = 0, py = 0;
  for(const p of parts){
    M += p.m; x += p.m * p.x; y += p.m * (p.y || 0);
    px += p.m * (p.vx || 0); py += p.m * (p.vy || 0);
  }
  return { M, x:x / M, y:y / M, vx:px / M, vy:py / M, px, py };
}
/* a two-dimensional elastic collision of equal spheres, resolved along the
   line of centres — the only direction an impulse can act between smooth spheres */
function dyCollide2D(a, b, e){
  const nx = b.x - a.x, ny = b.y - a.y;
  const d = Math.hypot(nx, ny) || 1;
  const ux = nx / d, uy = ny / d;
  const va = a.vx * ux + a.vy * uy, vb = b.vx * ux + b.vy * uy;
  if(va - vb <= 0) return null;                      // separating already
  const r = dyCollide(a.m, va, b.m, vb, e === undefined ? 1 : e);
  const dA = r.v1 - va, dB = r.v2 - vb;
  return { a:{ vx:a.vx + dA * ux, vy:a.vy + dA * uy },
           b:{ vx:b.vx + dB * ux, vy:b.vy + dB * uy }, along:{ ux, uy }, r };
}

/* ----------------------------------------------------------- gravitation ---- */
const dyGForce = (m1, m2, r) => DY_G_GRAV * m1 * m2 / (r * r);
const dyGField = (M, r) => DY_G_GRAV * M / (r * r);
const dyGPot = (M, m, r) => -DY_G_GRAV * M * m / r;
const dyOrbitV = (M, r) => Math.sqrt(DY_G_GRAV * M / r);
const dyEscapeV = (M, r) => Math.sqrt(2 * DY_G_GRAV * M / r);
const dyOrbitT = (M, r) => 2 * Math.PI * Math.sqrt(r * r * r / (DY_G_GRAV * M));
/* the total energy of an orbit — negative for a bound one, and exactly half
   the potential energy for a circle (the virial theorem) */
function dyOrbitEnergy(M, m, r){
  const K = 0.5 * m * DY_G_GRAV * M / r, U = -DY_G_GRAV * M * m / r;
  return { K, U, E:K + U, virial:K + U / 2 };
}
/* an integrated orbit, so Kepler's laws can be measured rather than quoted */
function dyOrbitRun(M, r0, v0, dt, n){
  const h = dt, N = n || 20000;
  let x = r0, y = 0, vx = 0, vy = v0;
  const pts = [], L0 = x * vy - y * vx;
  const acc = (x, y) => {
    const r = Math.hypot(x, y), k = -DY_G_GRAV * M / (r * r * r);
    return { ax:k * x, ay:k * y };
  };
  let rmin = Infinity, rmax = 0;
  for(let i = 0; i < N; i++){
    /* velocity Verlet: symplectic, so the energy does not drift over many orbits */
    const a1 = acc(x, y);
    x += vx * h + 0.5 * a1.ax * h * h;
    y += vy * h + 0.5 * a1.ay * h * h;
    const a2 = acc(x, y);
    vx += 0.5 * (a1.ax + a2.ax) * h;
    vy += 0.5 * (a1.ay + a2.ay) * h;
    const r = Math.hypot(x, y);
    rmin = Math.min(rmin, r); rmax = Math.max(rmax, r);
    pts.push({ x, y, vx, vy, r });
  }
  const last = pts[pts.length - 1];
  const L1 = last.x * last.vy - last.y * last.vx;
  return { pts, L0, L1, Ldrift:Math.abs(L1 - L0), rmin, rmax,
    a:(rmin + rmax) / 2, e:(rmax - rmin) / (rmax + rmin) };
}
/* named bodies, so the numbers on screen are the real ones */
const DY_BODIES = {
  earth:  { name:'Earth',  M:DY_M_EARTH,  R:DY_R_EARTH },
  moon:   { name:'Moon',   M:7.346e22,    R:1.7374e6 },
  mars:   { name:'Mars',   M:6.417e23,    R:3.3895e6 },
  jupiter:{ name:'Jupiter',M:1.8982e27,   R:6.9911e7 },
  sun:    { name:'Sun',    M:1.98892e30,  R:6.957e8 }
};
