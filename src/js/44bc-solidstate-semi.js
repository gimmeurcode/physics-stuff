/* ============================================================================
   3kc · A SEMICONDUCTOR THE READER SPECIFIES

   `slNi` computes √(N_c N_v)·e^(−E_g/2kT) and `slCarriers` solves np = n_i² with
   charge neutrality. Both are correct, and both are correct only in a limit that
   the stage never names: the NON-DEGENERATE one, where the Fermi level sits
   several kT inside the gap so that the Fermi–Dirac occupation can be replaced by
   a Boltzmann exponential. Three separate things are assumed along the way and
   none of them is checked:

     · n = N_c e^(−(E_c−E_F)/kT). The true statement is n = ∫ g_c(E) f(E) dE, and
       the exponential is its tail. Dope heavily enough and E_F enters the
       conduction band, where the two differ by a factor.
     · np = n_i². This FOLLOWS from the exponentials — the E_F cancels — and it
       fails with them. In a degenerate semiconductor np is measurably less.
     · every dopant is ionised. A donor holds its electron with probability
       1/(1+2e^((E_F−E_d)/kT)); at 40 K in silicon most of them do, which is
       carrier freeze-out and is why cryogenic electronics is difficult.

   So the reader writes the material — gap, effective masses, dopant levels,
   concentrations — and each of the three is computed both ways:

     ROUTE 1 · the Boltzmann formulae the presets use. Closed form, no integral.
     ROUTE 2 · n = N_c(2/√π)F_(1/2)(η) with the Fermi–Dirac integral done by
       quadrature, dopant occupancies included, and E_F found by BISECTING charge
       neutrality rather than by assuming which term dominates.

   N_c itself is computed from the effective mass, 2(2πm*kT/h²)^(3/2), rather
   than taken from a table — which means the tabulated N_c of every material in
   `SL_SEMI` is reachable, and reproducing it is the anchor.

   Prefix: sl
   ============================================================================ */

const SL_H = 2 * Math.PI * SL_HBAR;             // Planck's constant, J·s (exact)

/* the band-edge effective density of states, cm⁻³, from the effective mass */
const slSemiNc = (mStar, T) =>
  2 * Math.pow(2 * Math.PI * Math.max(1e-6, mStar) * SL_ME * SL_KB * Math.max(1e-6, T) /
               (SL_H * SL_H), 1.5) / 1e6;
/* and its inverse, so a tabulated N_c can be read back as the mass it implies */
const slSemiMass = (Nc, T) =>
  Math.pow(Nc * 1e6 / 2, 2 / 3) * SL_H * SL_H / (2 * Math.PI * SL_ME * SL_KB * Math.max(1e-6, T));

/* ----------------------------------------------------------------------------
   THE FERMI–DIRAC INTEGRAL

       F_(1/2)(η) = ∫₀^∞ √x /(1 + e^(x−η)) dx,   n = N_c (2/√π) F_(1/2)(η)

   Two things make the naive quadrature bad and both are dealt with. The √x is a
   square-root zero at the origin, so x = u² is substituted and the Jacobian 2u
   cancels it — the same move as the band edges in `44ba` and the turning points
   in `ncBarrierG`. And the range is infinite, so it is cut where the integrand
   has fallen by e^(−46): at x = η + 46, beyond which nothing is left to find.

   As η → −∞ this must become e^η, which is the Boltzmann limit and is what makes
   route 1 legitimate at all. The FIRST CORRECTION to that is −e^(2η)/2^(3/2),
   and it is what the panel reports as the degeneracy.
   ---------------------------------------------------------------------------- */
function slFermiHalf(eta, panels){
  const xm = eta + 46;
  if(!(xm > 0)) return Math.exp(eta) * Math.sqrt(Math.PI) / 2;   // deep Boltzmann
  const um = Math.sqrt(xm);
  return nqGauss(u => {
    const x = u * u, d = x - eta;
    /* 1/(1+e^d) written as e^(−d)/(1+e^(−d)) above d = 0 so nothing overflows */
    const occ = d > 0 ? Math.exp(-d) / (1 + Math.exp(-d)) : 1 / (1 + Math.exp(d));
    return 2 * u * u * occ;
  }, 0, um, 5, panels || 220);
}
/* the electron density that goes with a reduced Fermi level η = (E_F−E_c)/kT */
const slSemiN = (Nc, eta) => Nc * 2 / Math.sqrt(Math.PI) * slFermiHalf(eta);
/* and what route 1 would have said instead */
const slSemiNBoltz = (Nc, eta) => Nc * Math.exp(eta);

/* ----------------------------------------------------------------------------
   THE MATERIAL SHEET

   One property per line: a name and a number. Never throws; every complaint
   carries its line. Concentrations may be written 1e17 or 1E17 or 100000000000000000.
   ---------------------------------------------------------------------------- */
const SL_SEMI_KEYS = {
  eg:  { k:'Eg',  lo:0.01, hi:12,   d:1.12,  u:'eV',   what:'the band gap' },
  mc:  { k:'mc',  lo:0.005, hi:20,  d:1.08,  u:'m_e',  what:'the conduction-band density-of-states effective mass' },
  mv:  { k:'mv',  lo:0.005, hi:20,  d:0.56,  u:'m_e',  what:'the valence-band density-of-states effective mass' },
  ed:  { k:'Ed',  lo:0, hi:2000,    d:45,    u:'meV',  what:'the donor level, below the conduction edge' },
  ea:  { k:'Ea',  lo:0, hi:2000,    d:45,    u:'meV',  what:'the acceptor level, above the valence edge' },
  nd:  { k:'Nd',  lo:0, hi:1e22,    d:1e17,  u:'cm⁻³', what:'the donor concentration' },
  na:  { k:'Na',  lo:0, hi:1e22,    d:1e15,  u:'cm⁻³', what:'the acceptor concentration' },
  eps: { k:'eps', lo:1, hi:60,      d:11.7,  u:'',     what:'the relative permittivity' }
};
function slParseSemi(text){
  const out = {}, errs = [];
  for(const k in SL_SEMI_KEYS) out[k] = SL_SEMI_KEYS[k].d;
  const seen = {};
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,=:]+/).filter(s => s.length);
    if(tk.length < 2){
      errs.push({ line:i + 1, msg:'"' + esc(bare.slice(0, 24)) + '" needs a name and then a number' });
      continue;
    }
    const key = tk[0].toLowerCase();
    const spec = SL_SEMI_KEYS[key];
    if(!spec){
      errs.push({ line:i + 1, msg:'"' + esc(tk[0]) + '" is not one of <b>' +
        Object.keys(SL_SEMI_KEYS).map(s => SL_SEMI_KEYS[s].k).join(' ') + '</b>' });
      continue;
    }
    const v = Number(tk[1]);
    if(!Number.isFinite(v)){
      errs.push({ line:i + 1, msg:'"' + esc(tk[1]) + '" is not a number' });
      continue;
    }
    if(v < spec.lo || v > spec.hi){
      errs.push({ line:i + 1, msg:'<b>' + spec.k + '</b> is ' + spec.what + ', and ' +
        fmtNum(v, 4) + ' is outside ' + spec.lo + ' to ' + spec.hi + ' ' + spec.u });
      continue;
    }
    if(seen[key]) errs.push({ line:i + 1, msg:'<b>' + spec.k + '</b> was already given on line ' + seen[key] });
    seen[key] = i + 1;
    out[key] = v;
  }
  if(!Object.keys(seen).length && !errs.length)
    errs.push({ line:0, msg:'nothing here — write one property per line, a name then a number' });
  if(out.nd <= 0 && out.na <= 0 && !errs.length)
    errs.push({ line:0, msg:'both <b>Nd</b> and <b>Na</b> are zero, so there is nothing to dope with — intrinsic material is fine, but write at least one of them as a positive number' });
  return { ok:errs.length === 0, M:out, errs, given:seen };
}

/* ----------------------------------------------------------------------------
   THE SOLVE

   Charge neutrality, bisected on E_F measured from the valence edge:

       n(E_F) − p(E_F) + N_a⁻(E_F) − N_d⁺(E_F) = 0

   with n and p the Fermi integrals and the dopants only partly ionised. The
   left-hand side is strictly decreasing in E_F — n rises, p falls, N_d⁺ falls,
   N_a⁻ rises — so the root is unique and bisection is safe.

   The degeneracy factors are the standard ones and they are not symmetric: a
   donor level takes one electron of either spin, giving 2; an acceptor level in
   a doubly degenerate valence band gives 4.
   ---------------------------------------------------------------------------- */
function slSemiSolve(M, T){
  const kT = SL_KBEV * Math.max(1e-6, T);
  const Nc = slSemiNc(M.mc, T), Nv = slSemiNc(M.mv, T);
  const Eg = M.eg, Ed = Eg - M.ed / 1000, Ea = M.ea / 1000;   // above the valence edge
  const nOf = EF => slSemiN(Nc, (EF - Eg) / kT);
  const pOf = EF => slSemiN(Nv, (0 - EF) / kT);
  /* A donor depth of zero means the level has MERGED with the band, and the
     dopants are then fully ionised however high E_F rises. That is not a
     convenience: above the Mott density the impurity wavefunctions overlap, the
     discrete level broadens into an impurity band and joins the conduction band,
     and the two-level occupancy below stops describing anything. Without this
     escape the model does something wrong and plausible — it reports that a
     heavily doped semiconductor has almost no free carriers, because E_F has
     risen past E_d and the "donors" have taken their electrons back. */
  const ndP = EF => (M.ed <= 0 ? M.nd : M.nd / (1 + 2 * Math.exp((EF - Ed) / kT)));
  const naM = EF => (M.ea <= 0 ? M.na : M.na / (1 + 4 * Math.exp((Ea - EF) / kT)));
  const F = EF => nOf(EF) - pOf(EF) + naM(EF) - ndP(EF);
  /* a window wide enough to hold a degenerate level of either sign */
  const lo = -0.6 * Eg - 30 * kT, hi = 1.6 * Eg + 30 * kT;
  const EF = nqBisect(F, lo, hi, 1e-14 * Math.max(1, Eg), 400);
  if(EF === null) return { ok:false, why:'charge neutrality has no solution in a window ±(0.6·Eg + 30kT) around the gap' };
  const n = nOf(EF), p = pOf(EF);
  /* route 1, the same material through the Boltzmann formulae */
  const ni = Math.sqrt(Nc * Nv) * Math.exp(-Eg / (2 * kT));
  const d = M.nd - M.na;
  const nB = d / 2 + Math.sqrt(d * d / 4 + ni * ni);
  const pB = ni * ni / Math.max(1e-300, nB);
  return { ok:true, EF, kT, Nc, Nv, Eg, Ed, Ea, T,
           n, p, np:n * p,
           /* the two reduced Fermi levels: positive means the level is inside a
              band, which is the definition of degenerate */
           etaC:(EF - Eg) / kT, etaV:-EF / kT,
           nBoltz:slSemiNBoltz(Nc, (EF - Eg) / kT), pBoltz:slSemiNBoltz(Nv, -EF / kT),
           ni, nB, pB, niSq:ni * ni,
           mass:n * p / Math.max(1e-300, ni * ni),      // np ÷ nᵢ², which route 1 says is 1
           ndIon:ndP(EF), naIon:naM(EF),
           ionD:M.nd > 0 ? ndP(EF) / M.nd : 1,
           ionA:M.na > 0 ? naM(EF) / M.na : 1,
           merged:M.ed <= 0 || M.ea <= 0,
           degenerate:(EF - Eg) / kT > -3 || -EF / kT > -3,
           resid:F(EF),
           /* the largest TERM in n − p + N_a⁻ − N_d⁺, which is what the
              neutrality residual has to be read against: these densities span
              many orders of magnitude with doping, so an absolute residual in
              cm⁻³ is unreadable on its own. */
           residScale:Math.max(Math.abs(n), Math.abs(p), Math.abs(ndP(EF)), Math.abs(naM(EF))) };
}

/* ----------------------------------------------------------------------------
   THE JUNCTION, FROM TWO SOLVED SIDES

   V_bi = kT·ln(N_d N_a/n_i²) is route 1 again: it is the difference of two
   Boltzmann Fermi levels. Route 2 solves each side separately — an n-side with
   only donors and a p-side with only acceptors — and subtracts the two Fermi
   levels that come out. They agree while both sides are non-degenerate and both
   fully ionised, and part company otherwise.
   ---------------------------------------------------------------------------- */
function slSemiJunction(M, T){
  const nSide = slSemiSolve({ ...M, na:0 }, T);
  const pSide = slSemiSolve({ ...M, nd:0 }, T);
  if(!nSide.ok || !pSide.ok) return { ok:false, why:'one side of the junction has no neutral solution' };
  const kT = SL_KBEV * T;
  const ni = nSide.ni;
  const closed = (M.nd > 0 && M.na > 0 && ni > 0) ? kT * Math.log(M.nd * M.na / (ni * ni)) : NaN;
  const solved = nSide.EF - pSide.EF;
  return { ok:true, nSide, pSide, solved, closed,
           gap:Number.isFinite(closed) ? Math.abs(solved - closed) : NaN,
           rel:Number.isFinite(closed) && closed !== 0 ? Math.abs(solved - closed) / Math.abs(closed) : NaN };
}
