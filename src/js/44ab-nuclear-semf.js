/* ============================================================================
   3jb · THE MASS FORMULA'S COEFFICIENTS, AS SOMETHING TO BE FITTED

   `ncSemf` carries the Wapstra set as five constants, and the stage that draws
   it therefore draws a curve that agrees with the measured nuclides because
   somebody else already did the fitting. Everything interesting about those
   five numbers is invisible while they are constants:

     · they were MEASURED, and a set the reader writes can be scored the same
       way — RMS residual in B/A against the AME2020 values in `NC_NUCLIDES`;
     · they are not free. The formula is LINEAR in all five, so the best
       possible set for a given list of nuclides is a 5×5 linear solve, and the
       reader's guess can be compared with the optimum rather than with an
       opinion;
     · the iron peak is not one of the inputs. It is where the surface term
       (which falls as A^(−1/3)) stops beating the Coulomb term (which grows as
       A^(2/3)), and typing a different aC MOVES it — which is the only way to
       find out that "iron is the most bound nucleus" is a statement about two
       competing coefficients rather than a fact about iron;
     · and the valley of stability has a closed form, dB/dZ = 0 solved for Z,
       which this file re-derives for arbitrary coefficients and checks against
       a brute-force search over every Z at that A. The closed form and the
       search share no code, so their agreement tests the algebra.

   The light nuclides are the honest complication. A liquid drop with a surface
   tension is a poor description of three nucleons, and including ²H and ³He in
   a least-squares fit drags every coefficient to fit two points the model was
   never meant to cover. `ncSemfFit` therefore takes a minimum A, and the panel
   reports the residual over both the fitted set and everything.

   Prefix: nc
   ============================================================================ */

/* the pairing parity: +1 even–even, −1 odd–odd, 0 otherwise */
function ncPairSign(Z, A){
  const N = A - Z, eZ = Z % 2 === 0, eN = N % 2 === 0;
  return eZ && eN ? 1 : (!eZ && !eN ? -1 : 0);
}
/* The five basis functions of B(Z, A), in the order [aV, aS, aC, aA, aP], each
   already carrying the sign the formula gives it. B = Σ cᵢ·basisᵢ exactly, which
   is what makes the fit linear and the derivative below exact. */
function ncSemfBasis(Z, A){
  const N = A - Z;
  return [A,
          -Math.pow(A, 2 / 3),
          -Z * (Z - 1) / Math.pow(A, 1 / 3),
          -(N - Z) * (N - Z) / A,
          ncPairSign(Z, A) / Math.sqrt(A)];
}
/* the mass formula with coefficients the caller supplies */
function ncSemfWith(C, Z, A){
  const b = ncSemfBasis(Z, A);
  const volume = C.aV * b[0], surface = C.aS * b[1], coulomb = C.aC * b[2],
        asymmetry = C.aA * b[3], pairing = C.aP * b[4];
  const total = volume + surface + coulomb + asymmetry + pairing;
  return { Z, N:A - Z, A, volume, surface, coulomb, asymmetry, pairing, total,
           perA:A > 0 ? total / A : 0 };
}

/* ---- scoring a set against the measured nuclides ------------------------- */
/* The residual is taken in B/A rather than in B, because that is the quantity
   the stage plots and the one whose 8.79 MeV plateau is the physics. A residual
   in B would be dominated by uranium for the trivial reason that it has 238
   nucleons. */
function ncSemfScore(C, minA){
  const rows = [];
  let s2 = 0, n = 0, worst = null, s2all = 0;
  for(const q of NC_NUCLIDES){
    const model = ncSemfWith(C, q.Z, q.A).perA;
    const d = model - q.bpa;
    rows.push({ ...q, model, resid:d, used:q.A >= (minA || 0) });
    s2all += d * d;
    if(q.A >= (minA || 0)){
      s2 += d * d; n++;
      if(!worst || Math.abs(d) > Math.abs(worst.resid)) worst = rows[rows.length - 1];
    }
  }
  return { rows, rms:n ? Math.sqrt(s2 / n) : NaN, n,
           rmsAll:Math.sqrt(s2all / NC_NUCLIDES.length), worst };
}
/* The best five coefficients for a list of nuclides, by normal equations.
   B/A = Σ cᵢ·(basisᵢ/A), so the design row is the basis divided by A; the normal
   matrix is 5×5 and `laSolve` finishes it. Returning the matrix as well is not
   decoration: with this table the pairing column is almost constant over the
   nuclides that survive the A cut, and a caller that prints the fitted aP
   without saying how well determined it is would be overstating the result. */
function ncSemfFit(minA){
  const use = NC_NUCLIDES.filter(q => q.A >= (minA || 0));
  const M = [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]];
  const r = [0, 0, 0, 0, 0];
  for(const q of use){
    const g = ncSemfBasis(q.Z, q.A).map(v => v / q.A);
    for(let i = 0; i < 5; i++){
      r[i] += g[i] * q.bpa;
      for(let j = 0; j < 5; j++) M[i][j] += g[i] * g[j];
    }
  }
  const sol = laSolve(M.map(row => row.slice()), r.slice());
  if(!sol.x || sol.kind === 'none')
    return { ok:false, C:{ ...NC_SEMF }, n:use.length };
  const x = sol.x;
  /* the signs are already in the basis, so the coefficients come out positive
     for a model that behaves like the real thing */
  const C = { aV:x[0], aS:x[1], aC:x[2], aA:x[3], aP:x[4] };
  /* How well the data pins each coefficient, MEASURED: move it by a tenth and
     see what happens to the residual. This began as the spread of each column,
     which is wrong for aV — its column is identically 1, span zero, and aV is
     the best determined of the five. Perturbation asks the question that was
     meant. The ratios are large and unequal, and the smallest of them is the
     reason the fitted pairing coefficient must not be quoted with a straight
     face: this table has almost no odd–odd nuclei in it. */
  const base = ncSemfScore(C, minA).rms;
  const sens = NC_SEMF_KEYS.map(k => {
    const up = { ...C };
    up[k] = C[k] * 1.1 + (C[k] === 0 ? 0.1 : 0);
    const rms = ncSemfScore(up, minA).rms;      // scored once, not once per field
    return { k, rms, ratio:base > 0 ? rms / base : NaN };
  });
  return { ok:true, C, n:use.length, sens, base, score:ncSemfScore(C, minA) };
}

/* ---- where the peak is, and where the valley runs ------------------------ */
/* dB/dZ = 0 at fixed A, solved for Z, with the caller's coefficients. Only the
   Coulomb and asymmetry terms depend on Z (the pairing term is not
   differentiable and is left out, which is the standard treatment and the
   reason the answer is checked against a search that keeps it). */
function ncValleyZWith(C, A){
  const num = 4 * C.aA + C.aC / Math.pow(A, 1 / 3);
  const den = 8 * C.aA / A + 2 * C.aC / Math.pow(A, 1 / 3);
  return den === 0 ? NaN : num / den;
}
function ncMostBoundZWith(C, A){
  let best = 1, bv = -Infinity;
  for(let Z = 1; Z < A; Z++){
    const b = ncSemfWith(C, Z, A).total;
    if(b > bv){ bv = b; best = Z; }
  }
  return { Z:best, B:bv };
}
/* The most bound nucleus: B/A maximised over A, with Z free at each A. Scanned
   rather than solved, because Z is an integer and the pairing term makes B/A
   sawtooth from one A to the next — a derivative-based search would stop on a
   tooth. The scan is over the whole table's range and returns the best few so
   the panel can say which real nuclide it lands on. */
function ncSemfPeak(C, Amin, Amax){
  const top = Math.max(20, Amax || 260), lo = Amin === undefined ? 16 : Amin;
  let bestA = 0, bestZ = 0, bestPerA = -Infinity;
  const curve = [];
  for(let A = 2; A <= top; A++){
    const Z = ncMostBoundZWith(C, A);
    const perA = Z.B / A;
    curve.push({ A, Z:Z.Z, perA });
    /* The peak is looked for above A = 16 by default. Below that a liquid drop
       with a surface tension is not a model of anything, and a coefficient set
       whose pairing term is loose will happily put its maximum on ⁴He — which
       says something about the fit and nothing about nuclei. */
    if(A >= lo && perA > bestPerA){ bestPerA = perA; bestA = A; bestZ = Z.Z; }
  }
  /* the measured champion, for comparison — ⁶²Ni, not ⁵⁶Fe, and the panel says
     so because it is the sort of thing everyone remembers wrongly */
  const meas = NC_NUCLIDES.reduce((a, q) => (q.bpa > a.bpa ? q : a), NC_NUCLIDES[0]);
  /* A maximum sitting on the end of the scan is not a maximum, and a caller
     that reports it as one is reporting the window. Deleting the surface term
     does exactly this: nothing is left to punish a small nucleus, B/A falls
     monotonically from aV, and there is no iron peak to find at all. */
  return { A:bestA, Z:bestZ, perA:bestPerA, curve, measured:meas,
           edge:bestA <= lo || bestA >= top };
}

/* ---- the sheet ----------------------------------------------------------- */
/* Five named coefficients, one per line, in MeV. Never throws; every complaint
   carries its line number. */
const NC_SEMF_KEYS = ['aV', 'aS', 'aC', 'aA', 'aP'];
function ncParseSemf(text){
  const C = {}, errs = [];
  const lines = String(text == null ? '' : text).split(/\r?\n/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[;#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const tk = bare.split(/[\s,=:]+/).filter(s => s.length);
    if(tk.length < 2){ errs.push({ line:i + 1, msg:'"' + esc(bare) + '" needs a name and a value' }); continue; }
    const key = NC_SEMF_KEYS.find(k => k.toLowerCase() === tk[0].toLowerCase());
    if(!key){ errs.push({ line:i + 1, msg:'"' + esc(tk[0]) + '" is not one of aV, aS, aC, aA, aP' }); continue; }
    const v = Number(tk[1]);
    if(!Number.isFinite(v)){ errs.push({ line:i + 1, msg:'"' + esc(tk[1]) + '" is not a number' }); continue; }
    if(Object.prototype.hasOwnProperty.call(C, key)){ errs.push({ line:i + 1, msg:key + ' is given twice' }); continue; }
    C[key] = v;
  }
  for(const k of NC_SEMF_KEYS) if(!Object.prototype.hasOwnProperty.call(C, k))
    errs.push({ line:0, msg:k + ' is missing — all five coefficients are needed' });
  if(errs.length === 0 && C.aV <= 0)
    errs.push({ line:0, msg:'aV must be positive, or nothing is bound at all' });
  return { ok:errs.length === 0, C, errs };
}
function ncSemfSheet(C){
  return NC_SEMF_KEYS.map(k => k + ' ' + (Math.round(C[k] * 10000) / 10000)).join('\n');
}

/* ============================================================================
   WHETHER A NUCLIDE CAN β DECAY, FROM MASSES

   The wing's β stage decays a free neutron with Q = 0.782 MeV written into it.
   For a nuclide the reader names, Q has to be computed — and there are two ways
   to compute it that are algebraically identical and numerically nothing alike.

     ROUTE 1 · atomic masses, subtracted. M(Z,A) − M(Z+1,A). Both are about
       200 GeV for a heavy nuclide and their difference is about 1 MeV, so five
       significant figures are destroyed in one subtraction and the panel says
       how many.
     ROUTE 2 · the same identity rearranged. Substituting
       M(Z,A) = Z·m_H + (A−Z)·m_n − B(Z,A) makes every large term cancel
       symbolically, leaving

         Q(β⁻) = (m_n − m_H) + [B(Z+1,A) − B(Z,A)]

       — a difference of binding energies, both of order 10 MeV, added to a
       constant. Nothing large is ever formed.

   That constant is worth staring at: m_n − m_H = 0.78235 MeV is precisely the
   free neutron's Q value, and it drops out of the general formula when both
   binding energies are zero. The stage's own headline number turns out to be
   the special case of the thing the reader just typed.

   Positron emission needs 2m_e because atomic masses carry the electrons, and
   electron capture does not — which is why there are nuclides that can capture
   and cannot emit, a distinction of exactly 1.022 MeV.
   ============================================================================ */
const NC_QN = NC_MN - NC_MH;              // 0.78235 MeV — the free neutron's Q

/* Q for the three weak channels, each by both routes. `src` says whether the
   binding energies came from AME2020 or from the liquid drop, because a Q
   assembled from model masses is worth much less than one assembled from
   measured ones and the reader should be told which they have. */
/* The liquid drop with nothing measured mixed in. A Q value assembled from one
   measured binding energy and one modelled one is not a compromise between the
   two, it is the difference between them: the model is out by several MeV in
   places, and the Q values being decided are of order one. Comparing nuclides
   along a chain therefore has to be done in a single consistent source, and the
   panel keeps both so the gap between them can be printed. */
function ncNuclideMassModel(Z, A){
  if(Z === 0 && A === 1) return { m:NC_MN, src:'model', B:0 };
  if(Z === 1 && A === 1) return { m:NC_MH, src:'model', B:0 };
  const B = ncSemf(Z, A).total;
  return { m:Z * NC_MH + (A - Z) * NC_MN - B, src:'model', B };
}
function ncBetaQ(Z, A, modelOnly){
  const mass = modelOnly ? ncNuclideMassModel : ncNuclideMass;
  const P = mass(Z, A);
  const chan = (dZ, extra, name) => {
    const Zd = Z + dZ;
    if(Zd < 0 || Zd > A) return { name, ok:false, why:'no such daughter' };
    const D = mass(Zd, A);
    const direct = P.m - D.m - (extra || 0);
    /* the same thing with the large terms cancelled by hand */
    const viaB = (dZ > 0 ? NC_QN : -NC_QN) + (D.B - P.B) - (extra || 0);
    return { name, ok:true, Zd, Q:direct, viaB, gap:Math.abs(direct - viaB),
             /* how much of the answer the subtraction threw away */
             digits:Math.log10(Math.max(P.m, D.m) / Math.max(1e-12, Math.abs(direct))),
             /* "mixed" is its own answer, not a shade of "model": one end
                measured and the other modelled subtracts a real binding energy
                from a fitted one, and the several-MeV error in the fit lands
                whole on a Q value of order one. */
             src:(P.src === D.src) ? P.src : 'mixed',
             parent:P, daughter:D };
  };
  const bm = chan(1, 0, 'β⁻'), bp = chan(-1, 2 * NC_ME, 'β⁺'), ec = chan(-1, 0, 'electron capture');
  const open = [bm, bp, ec].filter(c => c.ok && c.Q > 0);
  /* The warning belongs to whatever the verdict actually rests on. A nuclide
     said to be stable rests on all three channels being negative; one said to
     decay rests on the open ones. Flagging every channel regardless put a
     caveat about positron emission on tritium, whose β⁻ Q comes from two
     measured binding energies and needs no caveat at all. */
  const deciding = open.length ? open : [bm, bp, ec].filter(c => c.ok);
  return { Z, A, parent:P, beta:bm, betaPlus:bp, ec, modelOnly:!!modelOnly,
           channels:[bm, bp, ec].filter(c => c.ok),
           allowed:open.map(c => c.name), open,
           stable:open.length === 0,
           mixed:deciding.some(c => c.src === 'mixed'),
           /* How much of this is the reader's to believe. A comparison with one
              measured end and one modelled end is not a compromise between
              them: the liquid drop is out by several MeV in places and these Q
              values are of order one, so such a channel settles nothing
              whatever its sign. Saying "✓" on one of those would be inventing a
              result — it is how ⁵⁶Fe came to be reported as an electron
              capturer, which it is not. */
           trust:deciding.every(c => c.src === 'measured') ? 'measured'
                 : deciding.some(c => c.src === 'mixed') ? 'undecided' : 'model',
           worstGap:[bm, bp, ec].reduce((a, c) => Math.max(a, c.ok ? c.gap : 0), 0) };
}
/* The isobaric chain at fixed A: every Z, its β⁻ Q, and where the sign flips.
   The nuclide the chain settles on is LOCATED — by following the decays — and
   the SEMF's closed-form Z* is a separate prediction of the same thing. */
function ncIsobar(A){
  const rows = [];
  const M = Z => ncNuclideMassModel(Z, A).m;
  const base = M(Math.max(1, Math.round(ncValleyZWith(NC_SEMF, A))));
  for(let Z = 1; Z < A; Z++){
    const q = ncBetaQ(Z, A, true);          // one consistent source along the chain
    rows.push({ Z, A, qm:q.beta.ok ? q.beta.Q : NaN, qp:q.betaPlus.ok ? q.betaPlus.Q : NaN,
                qec:q.ec.ok ? q.ec.Q : NaN, stable:q.stable,
                excess:M(Z) - base, odd:ncPairSign(Z, A) === -1, even:ncPairSign(Z, A) === 1 });
  }
  const stable = rows.filter(r => r.stable).map(r => r.Z);
  /* the bottom of the chain, found by FOLLOWING the decays from both ends
     rather than by minimising: start at each edge, take whichever channel is
     open, and see where it stops. It has to agree with the minimum of the mass
     itself, and with the closed-form Z* — three routes to one number. */
  const walk = start => {
    let Z = start;
    for(let i = 0; i < 2 * A; i++){
      const q = ncBetaQ(Z, A, true);
      if(q.beta.ok && q.beta.Q > 0){ Z++; continue; }
      if(q.betaPlus.ok && q.betaPlus.Q > 0){ Z--; continue; }
      if(q.ec.ok && q.ec.Q > 0){ Z--; continue; }
      break;
    }
    return Z;
  };
  let low = 1;
  for(const r of rows) if(M(r.Z) < M(low)) low = r.Z;
  return { A, rows, stable, minimumZ:low,
           fromBelow:walk(1), fromAbove:walk(A - 1),
           valleyZ:ncValleyZWith(NC_SEMF, A) };
}
/* a nuclide list the reader writes: one per line, `C14`, `40K`, `n`, `alpha` */
function ncParseNuclides(text){
  const list = [], errs = [];
  const lines = String(text == null ? '' : text).split(/[\r\n,;]+/);
  for(let i = 0; i < lines.length; i++){
    const bare = lines[i].replace(/[#].*$/, '').trim();
    if(!bare || bare[0] === '*') continue;
    const sp = ncBareSpecies(bare);
    if(!sp){ errs.push({ line:i + 1, msg:'"' + esc(bare) + '" is not a nuclide — write a symbol with a mass number, like <b>C14</b> or <b>40K</b>' }); continue; }
    if(sp.A < 1 || sp.A > 300){ errs.push({ line:i + 1, msg:'mass number ' + sp.A + ' is outside anything this model covers' }); continue; }
    list.push({ ...sp, label:ncNuclideLabel(sp.Z, sp.A) });
  }
  if(!list.length && !errs.length) errs.push({ line:0, msg:'no nuclides — write at least one, like <b>C14</b>' });
  return { ok:errs.length === 0, list, errs };
}
function ncNuclideLabel(Z, A){
  if(Z === 0 && A === 1) return 'n';
  const s = NC_ELEMENTS[Z] || '?';
  return supDigits(String(A)) + s;
}
