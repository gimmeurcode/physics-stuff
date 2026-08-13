/* ============================================================================
   3ja · A DECAY CHAIN THE READER WRITES

   `ncChain` above solves parent → daughter → stable, and it solves it with the
   two-member Bateman formula written out by hand. Every statement the wing makes
   about chains — that the daughter peaks where its activity equals its parent's,
   that a long-lived head drags the whole series into secular equilibrium, that
   the populations sum to the starting number — is then true *by construction* of
   that formula, and none of it is tested.

   A chain the reader types has to have all of it computed instead, and the way
   to make that bite is to solve the same system twice by routes that share no
   algebra:

     ROUTE 1 — Bateman, the closed form. A partial-fraction expansion of the
       Laplace transform of the chain. It integrates nothing and knows no
       timestep; it also subtracts nearly-equal numbers, and how badly is
       measured rather than hoped about (`ncBatemanCancel`).

     ROUTE 2 — the coupled system dNₖ/dt = λₖ₋₁Nₖ₋₁ − λₖNₖ, stepped. NOT with
       RK4: a real chain runs from 10 hours to 0.3 microseconds, and an explicit
       method needs the step of the fastest member over the span of the slowest.
       Instead each member is advanced by the *exact* solution of its own linear
       equation over the step, with the source from the member above taken as
       linear across it — an exponential integrator. It is unconditionally
       stable, it degenerates to the trapezoidal rule for the stable sink, and it
       reproduces the quasi-steady-state of a very short-lived member exactly.
       Second order in h, and the order is measured by halving.

   The gap between the two is what the panel prints. Everything else the stage
   claims is then derived from whichever route is appropriate and checked against
   the other.

   Prefix: nc
   ============================================================================ */

/* Half-lives get written the way people write them, so the parser takes a unit.
   The year is the Julian year, 365.25 days, which is what `ncTime` prints in. */
const NC_TIME_UNITS = {
  ns:1e-9, us:1e-6, 'µs':1e-6, ms:1e-3,
  s:1, sec:1, secs:1, second:1, seconds:1,
  min:60, mins:60, minute:60, minutes:60,
  h:3600, hr:3600, hrs:3600, hour:3600, hours:3600,
  d:86400, day:86400, days:86400,
  y:3.15576e7, yr:3.15576e7, yrs:3.15576e7, year:3.15576e7, years:3.15576e7, a:3.15576e7,
  ky:3.15576e10, my:3.15576e13, gy:3.15576e16
};
const NC_CHAIN_MAX = 10;              // members; the picture and the O(m²) sum both care

/* ----------------------------------------------------------------------------
   THE PARSER

   Never throws. Collects {line, msg} and reports every complaint with its line
   number, because a sheet of eight nuclides with a typo on line six should say
   "line 6", not "no".

   Two of its rules are physics rather than syntax and are worth stating:

   · the last member must be marked `stable`, and nothing may follow it. That is
     how every real series is written — they all end on a lead isotope — and it
     is what makes ΣN = N₀ a conservation law worth checking rather than an
     accounting identity that drains to nothing.

   · two members may not have *exactly* equal half-lives. Bateman's partial
     fractions divide by (λᵢ − λⱼ), so equal decay constants are a removable
     singularity of the closed form: the limit exists (`ncChain` handles the
     two-member case explicitly) but the general formula is 0/0 there. Rather
     than silently returning NaN into a readout, the parser says so and asks for
     a one-percent change — which is also the honest statement of the situation,
     since no two real nuclides have identical half-lives to the last digit.
   ---------------------------------------------------------------------------- */
function ncParseChain(text){
  const members = [], errs = [];
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;                       // blank and comments
    const tk = bare.split(/[\s,]+/).filter(s => s.length);
    const name = tk[0];
    if(name.length > 14){ errs.push({ line:i + 1, msg:'"' + esc(name.slice(0, 18)) + '" is too long for a nuclide name' }); continue; }
    if(tk.length < 2){
      errs.push({ line:i + 1, msg:'a name on its own — every member needs a half-life after it, or the word <b>stable</b>' });
      continue;
    }
    const rest = tk.slice(1).join(' ');
    if(/^(stable|infinite|infinity|inf|∞)$/i.test(rest)){
      members.push({ name, half:Infinity, lam:0, stable:true });
      continue;
    }
    const num = Number(tk[1]);
    if(!Number.isFinite(num) || num <= 0){
      errs.push({ line:i + 1, msg:'"' + esc(tk[1]) + '" is not a positive half-life — write a number, then a unit, or <b>stable</b>' });
      continue;
    }
    const unit = String(tk[2] === undefined ? 's' : tk[2]).toLowerCase();
    const mult = NC_TIME_UNITS[unit];
    if(mult === undefined){
      errs.push({ line:i + 1, msg:'"' + esc(String(tk[2])) + '" is not a time unit — use ns, µs, ms, s, min, h, d, y, ky, My or Gy' });
      continue;
    }
    const half = num * mult;
    members.push({ name, half, lam:Math.LN2 / half, stable:false });
  }
  /* structure */
  if(members.length && members.length < 2)
    errs.push({ line:0, msg:'a chain needs at least two members — a parent and something it turns into' });
  if(!members.length && !errs.length)
    errs.push({ line:0, msg:'nothing to decay — write one nuclide per line, name then half-life' });
  if(members.length > NC_CHAIN_MAX)
    errs.push({ line:0, msg:'that is ' + members.length + ' members; ' + NC_CHAIN_MAX + ' is the limit here' });
  for(let i = 0; i < members.length - 1; i++)
    if(members[i].stable)
      errs.push({ line:0, msg:'<b>' + esc(members[i].name) + '</b> is stable, so nothing can come after it — a stable nuclide is the end of a chain' });
  if(members.length >= 2 && !members[members.length - 1].stable)
    errs.push({ line:0, msg:'the last member must be <b>stable</b> — write <b>' + esc(members[members.length - 1].name) +
      ' stable</b>. Without an end product the populations have nowhere to accumulate, and there is no conservation law left to check.' });
  for(let i = 0; i < members.length; i++)
    for(let j = i + 1; j < members.length; j++)
      if(members[i].lam === members[j].lam && !members[i].stable)
        errs.push({ line:0, msg:'<b>' + esc(members[i].name) + '</b> and <b>' + esc(members[j].name) +
          '</b> have exactly the same half-life. Bateman\'s closed form divides by (λᵢ − λⱼ) and is 0/0 there — the limit exists but the formula does not. Change one by a percent.' });
  return { ok:errs.length === 0, members, errs, lams:members.map(m => m.lam) };
}

/* ----------------------------------------------------------------------------
   ROUTE 1 — BATEMAN, THE CLOSED FORM

       Nₖ(t) = (∏_{i<k} λᵢ) · Σ_{j≤k} e^(−λⱼt) / ∏_{i≤k, i≠j} (λᵢ − λⱼ)

   with N₁(0) = 1 and every other member starting empty. The stable end member,
   λ = 0, needs no special case: put λₖ = 0 in and the two-member version comes
   out as 1 − e^(−λ₁t), which is what it should be.
   ---------------------------------------------------------------------------- */
function ncBateman(lams, t){
  const m = lams.length, out = new Array(m).fill(0);
  for(let k = 0; k < m; k++){
    let pre = 1;
    for(let i = 0; i < k; i++) pre *= lams[i];
    let s = 0;
    for(let j = 0; j <= k; j++){
      let d = 1;
      for(let i = 0; i <= k; i++) if(i !== j) d *= (lams[i] - lams[j]);
      s += Math.exp(-lams[j] * t) / d;
    }
    out[k] = pre * s;
  }
  return out;
}
/* How much of the closed form's precision goes to cancellation. The sum above is
   alternating, and when two decay constants are close its individual terms are
   enormous compared with the answer. Reporting log₁₀(largest term ÷ answer) is
   reporting how many decimal digits Bateman throws away — which is the reason
   the second route is not a formality. */
function ncBatemanCancel(lams, t){
  const m = lams.length;
  let worst = 0, at = 0;
  for(let k = 0; k < m; k++){
    let pre = 1;
    for(let i = 0; i < k; i++) pre *= lams[i];
    let s = 0, amp = 0;
    for(let j = 0; j <= k; j++){
      let d = 1;
      for(let i = 0; i <= k; i++) if(i !== j) d *= (lams[i] - lams[j]);
      const term = pre * Math.exp(-lams[j] * t) / d;
      s += term;
      if(Math.abs(term) > amp) amp = Math.abs(term);
    }
    const lost = (Math.abs(s) > 0 && amp > 0) ? Math.log10(amp / Math.abs(s)) : 0;
    if(lost > worst){ worst = lost; at = k; }
  }
  return { digits:Math.max(0, worst), member:at };
}

/* ----------------------------------------------------------------------------
   ROUTE 2 — THE SYSTEM, STEPPED BY AN EXPONENTIAL INTEGRATOR

   Over one step of length h the member k obeys Ṅ = −λN + λₖ₋₁u(t), whose exact
   solution is a decay plus a convolution. Take u linear across the step — its
   two endpoints are already known, because member k−1 is advanced first — and
   the convolution has a closed form in the two φ-functions

       φ₁(−z) = Σ (−z)ⁿ/(n+1)! = (1 − e^(−z))/z
       φ₂(−z) = Σ (−z)ⁿ/(n+2)!

   giving   N(t+h) = N e^(−z) + λₖ₋₁h[ u₀(φ₁ − φ₂) + u₁φ₂ ],   z = λh.

   Three things make this the right method here rather than RK4:

   · λ = 0 is not a special case. φ₁ → 1 and φ₂ → ½, and the step becomes the
     trapezoidal rule — so the stable sink is integrated, not bookkept.
   · z → ∞ is not a special case either. φ₂ → 1/z, and the step returns
     λₖ₋₁u₁/λₖ, the quasi-steady-state population of a member that decays as fast
     as it is made. ²¹²Po lives 0.3 µs under a parent that lives 10 hours, and an
     explicit method would need 10¹¹ steps to say that.
   · φ₁ − φ₂ = (1 − e^(−z)(1+z))/z² is evaluated as *that*, not as a subtraction
     of two nearly equal φs, so nothing cancels at large z either.

   Both φs switch to their series below z = ½ and to their closed forms above,
   which is where each is the stable one.
   ---------------------------------------------------------------------------- */
function ncPhi2(z){                         /* Σ (−z)ⁿ/(n+2)! */
  if(z >= 0.5){ const E = Math.exp(-z); return (1 - (1 - E) / z) / z; }
  let s = 0, c = 0.5;                       /* 1/2! */
  for(let n = 0; n < 16; n++){ s += c; c *= -z / (n + 3); }
  return s;
}
function ncPhi12(z){                        /* φ₁ − φ₂ = Σ (−z)ⁿ(n+1)/(n+2)! */
  if(z >= 0.5){ const E = Math.exp(-z); return (1 - E * (1 + z)) / (z * z); }
  let s = 0, c = 0.5, n = 0;
  for(; n < 16; n++){ s += c * (n + 1); c *= -z / (n + 3); }
  return s;
}
/* the state after n steps to time t, starting from one unit of the head */
function ncChainRun(lams, t, n){
  const m = lams.length;
  n = Math.max(1, Math.round(n || 4000));
  const h = t / n;
  const co = lams.map(l => ({ E:Math.exp(-l * h), d:ncPhi12(l * h), p2:ncPhi2(l * h) }));
  const N = new Float64Array(m), M = new Float64Array(m);
  N[0] = 1;
  for(let s = 0; s < n; s++){
    M[0] = N[0] * co[0].E;
    for(let k = 1; k < m; k++)
      M[k] = N[k] * co[k].E + lams[k - 1] * h * (N[k - 1] * co[k].d + M[k - 1] * co[k].p2);
    N.set(M);
  }
  return N;
}

/* The comparison the stage exists for: both routes at the same instant, the
   worst disagreement between them, and the integrator's order measured by
   halving the step rather than asserted from the derivation. */
function ncChainCompare(lams, t, n){
  n = Math.max(2, Math.round(n || 20000));
  const closed = ncBateman(lams, t);
  const A = ncChainRun(lams, t, n), B = ncChainRun(lams, t, 2 * n);
  const scale = Math.max(1e-300, closed.reduce((a, v) => Math.max(a, Math.abs(v)), 0));
  const err = X => closed.reduce((a, v, i) => Math.max(a, Math.abs(v - X[i])), 0);
  const eA = err(A), eB = err(B);
  const sum = v => v.reduce((a, x) => a + x, 0);
  return {
    closed, numeric:Array.from(B), gap:eB, rel:eB / scale,
    coarse:eA, ratio:eB > 0 ? eA / eB : Infinity,
    order:(eA > 0 && eB > 0 && eA !== eB) ? Math.log2(eA / eB) : NaN,
    steps:2 * n,
    sumClosed:sum(closed), sumNumeric:sum(Array.from(B)),
    cancel:ncBatemanCancel(lams, t)
  };
}

/* ----------------------------------------------------------------------------
   WHERE A DAUGHTER PEAKS, LOCATED TWICE

   The textbook statement is that a daughter is at its maximum when its own
   activity equals its parent's — production balancing decay. That is a theorem
   (it is dNₖ/dt = 0 written out), and it is exactly the kind of thing a preset
   is allowed to assume. So it is checked, by locating the same instant two ways
   that have nothing to do with each other:

     · by MAXIMISING Nₖ(t), golden section on log t, which knows no activities;
     · by ROOT-FINDING λₖ₋₁Nₖ₋₁ − λₖNₖ = 0, which knows no maximum.

   The gap between the two times is the theorem, measured. For a two-member chain
   the answer is also compared with `ncChainPeak`, which was here first — pinning
   against an engine that already works is the cheapest strong test there is.
   ---------------------------------------------------------------------------- */
function ncChainWindow(lams){
  const pos = lams.filter(l => l > 0);
  if(!pos.length) return { lo:0, hi:1 };
  const fast = Math.max.apply(null, pos), slow = Math.min.apply(null, pos);
  return { lo:1e-7 / fast, hi:60 / slow };
}
function ncChainMaxima(lams){
  const W = ncChainWindow(lams), out = [];
  const L0 = Math.log(W.lo), L1 = Math.log(W.hi), S = 600;
  /* one pass over the window for the whole chain: Bateman costs O(m²) a call and
     scanning it once per member would cost m³ per readout */
  const grid = [];
  for(let i = 0; i <= S; i++) grid.push(ncBateman(lams, Math.exp(L0 + (L1 - L0) * i / S)));
  for(let k = 1; k < lams.length; k++){
    if(!(lams[k] > 0)) continue;                       // the stable end never peaks
    /* route A — the maximum of Nₖ, bracketed on that grid and then refined by
       golden section, so the answer is not limited by the grid it was found on */
    let bi = -1, bv = -Infinity;
    for(let i = 0; i <= S; i++) if(grid[i][k] > bv){ bv = grid[i][k]; bi = i; }
    if(bi <= 0 || bi >= S) continue;                   // the peak is off the window
    let a = L0 + (L1 - L0) * (bi - 1) / S, b = L0 + (L1 - L0) * (bi + 1) / S;
    const f = u => ncBateman(lams, Math.exp(u))[k];
    const gr = (Math.sqrt(5) - 1) / 2;
    let c = b - gr * (b - a), d = a + gr * (b - a), fc = f(c), fd = f(d);
    for(let it = 0; it < 120 && b - a > 1e-13 * Math.max(1, Math.abs(a)); it++){
      if(fc > fd){ b = d; d = c; fd = fc; c = b - gr * (b - a); fc = f(c); }
      else       { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = f(d); }
    }
    const tMax = Math.exp((a + b) / 2);
    /* route B — the activity balance, bracketed on the same grid and bisected */
    const g = t => { const N = ncBateman(lams, t); return lams[k - 1] * N[k - 1] - lams[k] * N[k]; };
    const t0 = Math.exp(L0 + (L1 - L0) * (bi - 1) / S), t1 = Math.exp(L0 + (L1 - L0) * (bi + 1) / S);
    const tBal = nqBisect(g, t0, t1, 1e-14 * t1, 200);
    const N = ncBateman(lams, tMax);
    out.push({ k, tMax, tBal, t:tMax, N:N[k],
               actIn:lams[k - 1] * N[k - 1], actOut:lams[k] * N[k],
               gap:(tBal === null) ? NaN : Math.abs(tMax - tBal),
               rel:(tBal === null) ? NaN : Math.abs(tMax - tBal) / tMax });
  }
  return out;
}

/* ----------------------------------------------------------------------------
   EQUILIBRIUM, AS A THEOREM WITH A CONDITION ON IT

   "In an old ore every member of a chain has the same activity" is the slogan,
   and it is a special case of something both more general and easier to check.
   Once the head's exponential is the slowest surviving one, every member below
   it settles into a FIXED ratio of activities

       Aₖ / A₁  →  ∏_{i=1..k} λᵢ / (λᵢ − λ₁)                    (transient)

   which follows from Bateman by keeping only the j = 1 term of the sum. Secular
   equilibrium — every ratio equal to one — is the λ₁ ≪ λᵢ limit of that product
   and nothing more. So the panel measures the ratios late in the chain's life,
   compares them against the product, and then reports how far the product itself
   sits from unity. Two claims tested, and the relationship between them shown
   rather than asserted.

   None of it holds if the head is not the longest-lived member: then some
   daughter outlives its own supply, and the chain has no steady ratio to reach.
   That is checked first and reported as a result rather than hidden by clamping.
   ---------------------------------------------------------------------------- */
function ncChainEquilibrium(lams){
  const dau = [];
  for(let k = 1; k < lams.length; k++) if(lams[k] > 0) dau.push(lams[k]);
  if(!dau.length || !(lams[0] > 0))
    return { ok:false, why:'this chain has no unstable daughter, so there is nothing to equilibrate' };
  const slow = Math.min.apply(null, dau);
  if(slow <= lams[0])
    return { ok:false, ratioTo:slow / lams[0],
             why:'the head is not the longest-lived member here — a daughter outlives its own supply, so the chain never settles into a fixed ratio at all' };
  /* Twenty-five mean lives of the slowest daughter. The transient dies as
     e^(−(λ_slow−λ₁)t), so the sampling time sets how sharp this test can be —
     at twelve it is only 10⁻⁵ and the residual transient, not the theorem, is
     what `off` would be measuring. Capped where the head would underflow. */
  const t = Math.min(25 / slow, 600 / lams[0]);
  const N = ncBateman(lams, t);
  const A0 = lams[0] * N[0];
  const rows = [];
  let prod = 1;
  for(let k = 1; k < lams.length; k++){
    if(!(lams[k] > 0)) continue;
    prod *= lams[k] / (lams[k] - lams[0]);
    const ratio = A0 > 0 ? lams[k] * N[k] / A0 : NaN;
    rows.push({ k, act:lams[k] * N[k], ratio, pred:prod,
                off:Number.isFinite(ratio) ? Math.abs(ratio / prod - 1) : NaN });
  }
  const off = rows.reduce((a, r) => Math.max(a, Number.isFinite(r.off) ? r.off : 0), 0);
  const secular = rows.reduce((a, r) => Math.max(a, Math.abs(r.pred - 1)), 0);
  return { ok:true, t, rows, off, secular, prod,
           filled:slow * t, headGone:1 - Math.exp(-lams[0] * t),
           /* how far this chain is from the secular limit, as the one number
              that controls it: the head's rate against the slowest daughter's */
           mu:lams[0] / slow,
           holds:secular < 0.01,
           why:secular < 0.01
             ? 'the head is more than a hundred times the longest-lived, so every activity ratio is one to better than a percent — secular equilibrium'
             : 'the head is only ' + fmtNum(slow / lams[0], 3) + ' times longer-lived than its slowest daughter, so the ratios settle at ' +
               fmtNum(rows[rows.length - 1].pred, 5) + ' rather than at 1 — transient equilibrium, of which secular is the limit' };
}
