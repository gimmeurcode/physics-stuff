/* ============================================================================
   1o · THERMODYNAMICS — kinetic theory, the laws, and heat engines
   AP Physics 2 unit 2.

   Temperature is not a form of energy; it is the parameter that decides which
   way energy flows. The kinetic theory makes that concrete — ½m⟨v²⟩ = (3/2)kT
   for a monatomic gas — and everything else in the subject is bookkeeping on
   ΔU = Q − W plus the observation that entropy never decreases.
   ============================================================================ */

const TM_R = 8.314462618;                // J/(mol·K) — exact, since the 2019 SI
const TM_KB = 1.380649e-23;              // J/K — exact, since the 2019 SI
/* ---------------------------------------------------------- kinetic theory ---- */
const tmRMS = (T, M) => Math.sqrt(3 * TM_R * T / M);          // M in kg/mol
const tmMean = (T, M) => Math.sqrt(8 * TM_R * T / (Math.PI * M));
const tmMostProbable = (T, M) => Math.sqrt(2 * TM_R * T / M);
const tmKEavg = T => 1.5 * TM_KB * T;
/* the Maxwell–Boltzmann speed distribution, normalised so ∫f dv = 1 */
function tmMaxwell(T, M){
  const a = M / (2 * TM_R * T);
  const C = 4 * Math.PI * Math.pow(a / Math.PI, 1.5);
  return { f:v => C * v * v * Math.exp(-a * v * v),
    vp:tmMostProbable(T, M), vbar:tmMean(T, M), vrms:tmRMS(T, M) };
}
const TM_GASES = {
  he:  { name:'Helium',   M:0.004003, atoms:1, gamma:5 / 3 },
  ne:  { name:'Neon',     M:0.020180, atoms:1, gamma:5 / 3 },
  ar:  { name:'Argon',    M:0.039948, atoms:1, gamma:5 / 3 },
  n2:  { name:'Nitrogen', M:0.028014, atoms:2, gamma:7 / 5 },
  o2:  { name:'Oxygen',   M:0.031998, atoms:2, gamma:7 / 5 },
  co2: { name:'Carbon dioxide', M:0.044010, atoms:3, gamma:9 / 7 }
};
/* equipartition: ½kT per quadratic degree of freedom, which is where the
   specific heats and hence γ come from */
function tmDOF(atoms){
  const f = atoms === 1 ? 3 : atoms === 2 ? 5 : 6;
  return { f, Cv:f * TM_R / 2, Cp:(f + 2) * TM_R / 2, gamma:(f + 2) / f };
}

/* ------------------------------------------------------------- processes ---- */
/* Each returns the work done *by* the gas, the heat in, and ΔU — and the first
   law is checked rather than used to fill in the missing one. */
const TM_PROCESS = {
  isobaric: { name:'Isobaric  (constant P)',
    path:(P0, V0, V1) => v => P0,
    W:(n, T0, P0, V0, V1) => P0 * (V1 - V0),
    note:'The gas pushes at a steady pressure, so the work is simply PΔV — the area of a rectangle. Heating a gas at constant pressure costs more than at constant volume because some of the heat leaves again as work: that difference is exactly <b>C_p − C_v = R</b>.' },
  isochoric: { name:'Isochoric  (constant V)',
    path:(P0, V0, V1) => v => P0 * V0 / v,
    W:() => 0,
    note:'No volume change, so no work at all — every joule of heat goes into internal energy, and the P–V path is a vertical line enclosing no area. This is the process that <i>defines</i> C_v.' },
  isothermal: { name:'Isothermal  (constant T)',
    path:(P0, V0) => v => P0 * V0 / v,
    W:(n, T0, P0, V0, V1) => n * TM_R * T0 * Math.log(V1 / V0),
    note:'A hyperbola on the P–V diagram. The temperature never changes, so ΔU = 0 for an ideal gas and <b>every joule of heat comes straight back out as work</b>. It requires a reservoir and infinite patience: the process must be slow enough to stay in equilibrium.' },
  adiabatic: { name:'Adiabatic  (no heat exchanged)',
    path:(P0, V0, V1, g) => v => P0 * Math.pow(V0 / v, g),
    W:(n, T0, P0, V0, V1, g) => (P0 * V0 - P0 * Math.pow(V0 / V1, g) * V1) / (g - 1),
    note:'<b>PV^γ = const</b>, a steeper curve than the isotherm because the gas cools as it expands. Q = 0, so the work comes entirely out of internal energy. This is why a bicycle pump gets hot, why clouds form as air rises, and why the compression stroke of an engine raises the temperature before any fuel burns.' }
};
/* the first law, with the work obtained by integrating the actual P–V path */
function tmFirstLaw(proc, n, T0, V0, V1, gasKey, T1iso){
  const g = tmDOF(TM_GASES[gasKey].atoms);
  const P0 = n * TM_R * T0 / V0;
  /* An isochoric process has no V-path at all — its P–V "curve" is a vertical
     segment enclosing no area — so it is parameterised by the temperature it
     reaches rather than by a volume it does not change. Feeding it a volume
     ratio and integrating would silently compute an isothermal instead. */
  if(proc === 'isochoric'){
    const T1 = T1iso === undefined ? T0 * 1.5 : T1iso;
    const dU = n * g.Cv * (T1 - T0);
    return { P0, P1:n * TM_R * T1 / V0, T0, T1, V1:V0, W:0, dU, Q:dU,
      gamma:g.gamma, Cv:g.Cv, Cp:g.Cp, Wformula:0, residual:0 };
  }
  const P = TM_PROCESS[proc].path(P0, V0, V1, g.gamma);
  const W = nqAdaptive(P, V0, V1, 1e-11);
  const P1 = P(V1);
  const T1 = P1 * V1 / (n * TM_R);
  const dU = n * g.Cv * (T1 - T0);
  const Q = dU + W;
  return { P0, P1, T0, T1, W, dU, Q, gamma:g.gamma, Cv:g.Cv, Cp:g.Cp,
    Wformula:TM_PROCESS[proc].W(n, T0, P0, V0, V1, g.gamma),
    residual:Math.abs(dU - (Q - W)) };
}

/* ----------------------------------------------------------------------------
   A PATH THE READER DRAWS THROUGH THE P–V PLANE

   The four named processes above exist because each has a closed form for the
   work. A path that is none of them has no formula at all, so the work has to
   be what it always was — the area under the curve actually followed:

       W = ∫ P dV

   and the internal energy has to be what IT always was: nC_vT at the endpoints,
   which is a function of the state and of nothing else. Putting four different
   routes between the SAME two states side by side is the whole content of the
   first law — the works come out genuinely different, the heats differ by
   exactly the same amounts, and ΔU does not move.

   Be clear about which half of that is a measurement. For an ideal gas U = nC_vT
   *by definition of the model*, so ΔU agreeing across the four is arithmetic,
   not evidence, and the panel says so rather than selling it as a discovery.
   What is genuinely measured is everything else: whether the typed path is one
   of the named processes at all (from the spread of T and of PVᵞ along it,
   never declared), the work by two different quadrature rules that must agree,
   and the work against the closed form in the cases where one exists. A reader
   who types 200*(20/x)^(5/3) is not told it is an adiabat — the panel finds
   PVᵞ constant to a part in 10¹⁴ and Q coming out at 10⁻¹³ J, which is zero.

   Units: kPa·L = J exactly, and PV/(nR) with P in kPa and V in litres is
   already kelvin. Working in those units is not decoration — it means no
   conversion factor appears anywhere below, so nothing can hide in one.
   ---------------------------------------------------------------------------- */
function tmPathRun(Pof, V0, V1, n, gasKey, samples){
  const g = tmDOF(TM_GASES[gasKey].atoms);
  const T = V => Pof(V) * V / (n * TM_R);
  const P0 = Pof(V0), P1 = Pof(V1), T0 = T(V0), T1 = T(V1);
  const dU = n * g.Cv * (T1 - T0);
  /* the reader's path: the area under the curve actually drawn, by adaptive
     Simpson — and again by a midpoint Riemann sum, which shares no code with
     it. The gap between them is the error bar on every W below. */
  const W = nqAdaptive(Pof, V0, V1, 1e-9);
  const Wmid = tmMidpoint(Pof, V0, V1, 4096);
  /* three other routes between the SAME endpoints. The corner routes have a
     leg at constant V, which does no work at all however the pressure moves. */
  const Wline = (P0 + P1) / 2 * (V1 - V0);           /* the straight chord      */
  const Wpv = P1 * (V1 - V0);                        /* change P first, then V  */
  const Wvp = P0 * (V1 - V0);                        /* change V first, then P  */
  const paths = [
    { name:'your path', W, Q:dU + W },
    { name:'a straight line in the P–V plane', W:Wline, Q:dU + Wline },
    { name:'change P first, then V', W:Wpv, Q:dU + Wpv },
    { name:'change V first, then P', W:Wvp, Q:dU + Wvp }
  ];
  let Wlo = Infinity, Whi = -Infinity;
  for(const p of paths){ Wlo = Math.min(Wlo, p.W); Whi = Math.max(Whi, p.W); }
  /* IS this path one of the named ones? Measured on the curve, not declared. */
  const M = samples || 400;
  let Tlo = Infinity, Thi = -Infinity, alo = Infinity, ahi = -Infinity,
      plo = Infinity, phi = -Infinity, bad = 0;
  for(let i = 0; i <= M; i++){
    const V = V0 + (V1 - V0) * i / M, p = Pof(V);
    if(!Number.isFinite(p) || p <= 0){ bad++; continue; }
    const t = p * V / (n * TM_R), a = p * Math.pow(V, g.gamma);
    Tlo = Math.min(Tlo, t); Thi = Math.max(Thi, t);
    alo = Math.min(alo, a); ahi = Math.max(ahi, a);
    plo = Math.min(plo, p); phi = Math.max(phi, p);
  }
  const spread = (lo, hi) => (hi > lo ? (hi - lo) / (0.5 * (hi + lo)) : 0);
  const sT = spread(Tlo, Thi), sA = spread(alo, ahi), sP = spread(plo, phi);
  const kind = bad ? 'not a physical path everywhere'
    : sT < 1e-9 ? 'isothermal — T is constant along it'
    : sA < 1e-9 ? 'adiabatic — PVᵞ is constant along it'
    : sP < 1e-9 ? 'isobaric — P is constant along it'
    : 'none of the four named processes';
  return { W, Wmid, quadGap:Math.abs(W - Wmid),
    Q:dU + W, dU, P0, P1, T0, T1, V0, V1, n, Cv:g.Cv, Cp:g.Cp, gamma:g.gamma,
    paths, kind, bad,
    /* how far apart the four routes actually are — if this were small the
       demonstration would be showing nothing */
    Wspread:Whi - Wlo,
    spreadT:sT, spreadAdi:sA, spreadP:sP, Tlo, Thi,
    /* the closed forms, for the cases where one exists — compared, never used */
    Wiso:sT < 1e-9 ? n * TM_R * T0 * Math.log(V1 / V0) : null,
    Wadi:sA < 1e-9 ? (P0 * V0 - P1 * V1) / (g.gamma - 1) : null };
}
/* the midpoint rule, kept separate so the two quadratures share nothing */
function tmMidpoint(f, a, b, N){
  const M = Math.max(1, N || 1024), h = (b - a) / M;
  let s = 0;
  for(let i = 0; i < M; i++) s += f(a + (i + 0.5) * h);
  return s * h;
}

/* ------------------------------------------------------------- the cycles ---- */
/* A cycle returns to its starting state, so ΔU = 0 over the loop and the net
   work is exactly the area enclosed — which the lab measures by the shoelace
   formula on the drawn path rather than by adding the four analytic pieces. */
function tmCarnot(Th, Tc){
  const eta = 1 - Tc / Th;
  return { eta, etaPct:100 * eta, Th, Tc,
    cop:Tc / (Th - Tc), copHeat:Th / (Th - Tc) };
}
function tmEngine(Qh, Qc){
  const W = Qh - Qc;
  return { W, eta:W / Qh, Qh, Qc };
}
/* ----------------------------------------------------------------------------
   A CYCLE THE READER WRITES DOWN

   The engine above is a bookkeeping identity: give it Q_h and Q_c and it hands
   back W and η. Nothing in it is a cycle. Write out an actual sequence of
   processes and every one of those numbers has to be *earned* — and two results
   that the bookkeeping version can only assert become things that are measured.

   THE FIRST is Clausius. Around any closed cycle the gas returns to its
   starting state, so ∮dS = 0 for the gas — but the reservoirs it exchanged heat
   with do not come back, and

       ∮ dQ/T_reservoir ≤ 0,   with equality if and only if every step was
                               reversible.

   The surplus is entropy created out of nothing, and it is computed here by
   summing dQ/T over the actual sub-steps of the actual path. Write a cycle
   whose steps each track their reservoir and it comes out zero. Add
   `from 900` to a step — heat the gas from a reservoir hotter than it is, which
   is what every real engine does — and it comes out positive, and the
   efficiency falls below the Carnot bound by an amount the panel prints. That
   is the second law happening rather than being described.

   THE SECOND is the work. It is obtained three ways that share nothing: summed
   as P dV over the sub-steps with no formula anywhere in it; added up from the
   four closed forms; and taken as the geometric area of the loop drawn in the
   P–V plane by the shoelace formula. Three routes, one number.

   Units are kPa and litres throughout, because kPa·L = J exactly and PV/(nR) in
   those units is already kelvin, so no conversion factor appears anywhere.
   ---------------------------------------------------------------------------- */
const TM_CYCLE_KIND = {
  isothermal:{ arg:'V', what:'volume in litres' },
  isobaric:  { arg:'V', what:'volume in litres' },
  adiabatic: { arg:'V', what:'volume in litres' },
  isochoric: { arg:'T', what:'temperature in kelvin' }
};
/* The parser NEVER throws: it collects {line, msg} and reports every complaint
   against the line that caused it, so a reader who mistypes one word is told
   which word rather than shown a blank picture. */
function tmParseCycle(text){
  const errs = [], steps = [];
  let gas = 'ar', n = 1, V0 = null, T0 = null;
  const num = s => { const v = Number(s); return Number.isFinite(v) ? v : NaN; };
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,]+/).filter(s => s.length);
    const k = tk[0].toLowerCase(), L = i + 1;
    if(k === 'gas'){
      if(!TM_GASES[tk[1]]) errs.push({ line:L, msg:'unknown gas "' + (tk[1] === undefined ? '' : tk[1]) +
        '" — one of ' + Object.keys(TM_GASES).join(', ') });
      else gas = tk[1];
      continue;
    }
    if(k === 'moles'){
      const v = num(tk[1]);
      if(!(v > 0)) errs.push({ line:L, msg:'moles needs a positive number' });
      else n = v;
      continue;
    }
    if(k === 'start'){
      const v = num(tk[1]), t = num(tk[2]);
      if(!(v > 0) || !(t > 0)) errs.push({ line:L, msg:'start needs a volume in litres and a temperature in kelvin, both positive' });
      else { V0 = v; T0 = t; }
      continue;
    }
    const kind = TM_CYCLE_KIND[k];
    if(kind){
      const v = num(tk[1]);
      if(!(v > 0)){ errs.push({ line:L, msg:k + ' needs a target ' + kind.what }); continue; }
      let res = null;
      if(tk[2] !== undefined){
        if(String(tk[2]).toLowerCase() !== 'from'){
          errs.push({ line:L, msg:'expected "from <reservoir temperature>" after the target, not "' + tk[2] + '"' }); continue;
        }
        res = num(tk[3]);
        if(!(res > 0)){ errs.push({ line:L, msg:'"from" needs a reservoir temperature in kelvin' }); continue; }
        if(k === 'adiabatic'){
          errs.push({ line:L, msg:'an adiabatic step exchanges no heat at all, so it has no reservoir' }); continue;
        }
      }
      steps.push({ kind:k, target:v, res, line:L });
      continue;
    }
    errs.push({ line:L, msg:'unknown instruction "' + tk[0] + '" — expected gas, moles, start, or one of ' +
      Object.keys(TM_CYCLE_KIND).join(', ') });
  }
  if(V0 === null) errs.push({ line:0, msg:'no starting state — write "start <litres> <kelvin>"' });
  if(steps.length < 2) errs.push({ line:0, msg:'a cycle needs at least two processes' });
  return { ok:errs.length === 0, errs, gas, n, V0, T0, steps };
}
/* the state reached at fraction s along a process, from the state it began in */
function tmCycleAt(kind, target, V, T, s, gam){
  if(kind === 'isochoric') return { V, T:T + (target - T) * s };
  const Vs = V + (target - V) * s;
  if(kind === 'isothermal') return { V:Vs, T };
  if(kind === 'isobaric')   return { V:Vs, T:T * Vs / V };
  return { V:Vs, T:T * Math.pow(V / Vs, gam - 1) };          /* adiabatic */
}
function tmRunCycle(spec, N){
  const g = tmDOF(TM_GASES[spec.gas].atoms);
  const n = spec.n, Cv = g.Cv, gam = g.gamma, M = Math.max(4, N || 200);
  const Pof = (V, T) => n * TM_R * T / V;
  let V = spec.V0, T = spec.T0;
  /* the gas's entropy relative to its starting state, which for an ideal gas is
     a closed form in the state alone — so a T–S diagram costs nothing and a
     Carnot cycle draws itself as a rectangle on it */
  const Sof = (Vv, Tt) => n * Cv * Math.log(Tt / spec.T0) + n * TM_R * Math.log(Vv / spec.V0);
  const path = [{ V, P:Pof(V, T), T, S:0 }], out = [];
  let Wsum = 0, Wform = 0, Qin = 0, Qout = 0, dUsum = 0;
  let Sgas = 0, Sform = 0, Ssurr = 0;
  let Tlo = T, Thi = T;
  for(const st of spec.steps){
    const V1 = st.kind === 'isochoric' ? V : st.target;
    const T1 = tmCycleAt(st.kind, st.target, V, T, 1, gam).T;
    let W = 0, Q = 0, dU = 0, dS = 0, dSs = 0;
    for(let i = 0; i < M; i++){
      const a = tmCycleAt(st.kind, st.target, V, T, i / M, gam);
      const b = tmCycleAt(st.kind, st.target, V, T, (i + 1) / M, gam);
      const m = tmCycleAt(st.kind, st.target, V, T, (i + 0.5) / M, gam);
      const dV = b.V - a.V, dT = b.T - a.T;
      const dW = Pof(m.V, m.T) * dV;                 /* P dV, no formula in it */
      const du = n * Cv * dT;
      const dq = du + dW;                            /* the first law, locally */
      W += dW; dU += du; Q += dq;
      dS += dq / m.T;                                /* the gas's own ledger   */
      dSs -= dq / (st.res === null || st.res === undefined ? m.T : st.res);
      Tlo = Math.min(Tlo, b.T); Thi = Math.max(Thi, b.T);
      path.push({ V:b.V, P:Pof(b.V, b.T), T:b.T, S:Sof(b.V, b.T) });
    }
    /* the same step from its closed form, which integrates nothing */
    const Wf = st.kind === 'isochoric' ? 0
      : st.kind === 'isothermal' ? n * TM_R * T * Math.log(V1 / V)
      : st.kind === 'isobaric' ? Pof(V, T) * (V1 - V)
      : n * Cv * (T - T1);
    const Sf = n * Cv * Math.log(T1 / T) + n * TM_R * Math.log(V1 / V);
    out.push({ kind:st.kind, res:st.res, line:st.line, V0:V, T0:T, V1, T1,
      P0:Pof(V, T), P1:Pof(V1, T1), W, Wf, Q, dU, dS, dSf:Sf, dSs });
    Wsum += W; Wform += Wf; dUsum += dU; Sgas += dS; Sform += Sf; Ssurr += dSs;
    if(Q > 0) Qin += Q; else Qout -= Q;
    V = V1; T = T1;
  }
  /* the loop's geometric area, by the shoelace on the drawn polygon: a third
     route to the same work, and the only one that never mentions a process */
  let A = 0, B = 0;
  for(let i = 0; i < path.length; i++){
    const a = path[i], b = path[(i + 1) % path.length];
    A += a.V * b.P - b.V * a.P;
    B += a.S * b.T - b.S * a.T;
  }
  const Wshoe = -A / 2;                     /* ∮P dV = −(the ccw shoelace area) */
  /* and a FOURTH route, on a different diagram entirely: ∮T dS is the net heat,
     which for a closed cycle is the net work. A Carnot cycle is a rectangle
     here, and its area is (T_h − T_c)ΔS by inspection. */
  const Wts = -B / 2;
  const closeV = Math.abs(V - spec.V0) / spec.V0, closeT = Math.abs(T - spec.T0) / spec.T0;
  const closes = closeV < 1e-9 && closeT < 1e-9;
  /* The Carnot bound belongs to the RESERVOIRS, not to the gas: the hottest
     source heat was actually drawn from, and the coldest sink it was actually
     rejected to. A step whose reservoir was not named tracks the gas, so its
     relevant temperature is the extreme end of its own excursion. Steps that
     exchange no heat — the adiabats — are excluded by a tolerance, because
     their sub-step dq is O(h²) rather than exactly zero and its sign wanders. */
  const qtol = 1e-7 * Math.max(Qin, 1);
  let Thot = 0, Tcold = Infinity;
  for(const s of out){
    if(s.Q > qtol) Thot = Math.max(Thot, s.res === null || s.res === undefined ? Math.max(s.T0, s.T1) : s.res);
    if(s.Q < -qtol) Tcold = Math.min(Tcold, s.res === null || s.res === undefined ? Math.min(s.T0, s.T1) : s.res);
  }
  const etaCarnot = Thot > 0 && Number.isFinite(Tcold) ? 1 - Tcold / Thot : 0;
  return { steps:out, path, n, gas:spec.gas, gamma:gam, Cv, Cp:g.Cp,
    Wsum, Wform, Wshoe, Wts,
    workGap:Math.abs(Wsum - Wform), shoeGap:Math.abs(Wsum - Wshoe),
    tsGap:Math.abs(Wsum - Wts),
    Qin, Qout, dU:dUsum, closes, closeV, closeT, Vend:V, Tend:T,
    /* ∮dS for the gas: zero because S is a state function, computed not assumed */
    Sgas, Sform, entGap:Math.abs(Sgas - Sform),
    /* Clausius: `clausius` IS ∮dQ/T_reservoir, so it is ≤ 0 and equals zero
       only for a reversible cycle. `generated` is the entropy created, which is
       the same quantity with the opposite sign once ∮dS for the gas is zero —
       and it is computed as Sgas + Ssurr rather than by negating, so that a
       cycle which fails to close cannot quietly report a tidy number. */
    clausius:-Ssurr, generated:Sgas + Ssurr,
    reversible:Math.abs(Sgas + Ssurr) < 1e-9 * Math.max(1, Math.abs(Sgas) || 1),
    eta:Qin > 0 ? Wsum / Qin : 0, etaCarnot, Thot, Tcold, Tlo, Thi,
    /* how far short of the bound this cycle falls. It is NOT the same question
       as whether entropy was generated: a perfectly reversible cycle that draws
       its heat over a range of temperatures rather than all at the top one
       falls short too, and the Stirling cycle is exactly that case. */
    etaGap:etaCarnot - (Qin > 0 ? Wsum / Qin : 0) };
}

/* the entropy change of a reversible isothermal step, and the total for a cycle */
function tmEntropyCycle(Qh, Th, Qc, Tc){
  const dSh = -Qh / Th, dSc = Qc / Tc;
  return { dSh, dSc, total:dSh + dSc,
    reversible:Math.abs(dSh + dSc) < 1e-9 * Math.max(Math.abs(dSh), 1) };
}
/* the free expansion that shows entropy rising with no heat at all */
function tmFreeExpansion(n, V0, V1){
  return { Q:0, W:0, dU:0, dS:n * TM_R * Math.log(V1 / V0),
    note:'No heat, no work, no temperature change — and yet the entropy rises. Irreversibility is not about energy.' };
}
/* the statistical reading: entropy counts microstates, and the arrow of time is
   a statement about how overwhelmingly many of them look the same */
function tmMicrostates(N, nLeft){
  /* log of the binomial coefficient, computed in logs so N can be large */
  let lg = 0;
  for(let i = 1; i <= N; i++) lg += Math.log(i);
  for(let i = 1; i <= nLeft; i++) lg -= Math.log(i);
  for(let i = 1; i <= N - nLeft; i++) lg -= Math.log(i);
  return { logW:lg, S:TM_KB * lg, frac:nLeft / N };
}

/* ------------------------------------------------------------ heat transfer ---- */
const tmLatent = (m, L) => m * L;
const TM_SUBSTANCE = {
  water: { name:'Water',    c:4186, cIce:2090, cSteam:2010, Lf:3.33e5, Lv:2.26e6, Tm:0, Tb:100 },
  al:    { name:'Aluminium',c:900,  Lf:3.97e5, Tm:660 },
  cu:    { name:'Copper',   c:385,  Lf:2.05e5, Tm:1085 },
  fe:    { name:'Iron',     c:449,  Lf:2.72e5, Tm:1538 },
  pb:    { name:'Lead',     c:128,  Lf:2.45e4, Tm:327 }
};
/* a calorimetry mix: the two settle where the heat lost equals the heat gained */
function tmMix(m1, c1, T1, m2, c2, T2){
  const Tf = (m1 * c1 * T1 + m2 * c2 * T2) / (m1 * c1 + m2 * c2);
  return { Tf, Q1:m1 * c1 * (Tf - T1), Q2:m2 * c2 * (Tf - T2),
    residual:m1 * c1 * (Tf - T1) + m2 * c2 * (Tf - T2) };
}
