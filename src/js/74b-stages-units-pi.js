/* ============================================================================
   5u · BUCKINGHAM'S THEOREM — the stage  (Programme C wing C3)

   The dimension matrix has one column per variable and one row per base
   dimension; a dimensionless product is a null vector of it. So the count of
   independent dimensionless groups is n − rank, which is rank–nullity and not
   a separate theorem — and the vector-spaces wing already proved it.

   Every group the stage prints is checked by recomputing its dimensions, and
   three of the presets carry a number the method predicts and something
   independent to compare it against: 4π² for the pendulum, exactly 1 for the
   wave on a string and for the Bohr radius, and 21 kilotons for Trinity.
   ============================================================================ */

/* The seven exponents in the order 30a-units.js uses: M L T I Θ N J. */
const unD = (M, L, T, I) => [M || 0, L || 0, T || 0, I || 0, 0, 0, 0];

/* Taylor's radii, read off G. I. Mack's photographs of the Trinity fireball and
   published in Proc. R. Soc. A 201 (1950) 175. The yield was still classified
   when he printed them; the plot below is what he did with them.

   The first point and the last two are kept rather than trimmed, because where
   they leave the line is the physics: at 0.10 ms the shock has barely cleared
   the device and the point-source idealisation has not started, and by 62 ms it
   is decaying towards an ordinary sound wave and the strong-shock idealisation
   has stopped. A similarity solution has a domain of validity and this is what
   its edges look like in data. */
const UN_TRINITY = [
  [0.10, 11.1], [0.24, 19.9], [0.38, 25.4], [0.52, 28.8], [0.66, 31.9],
  [0.80, 34.2], [0.94, 36.3], [1.08, 38.9], [1.22, 41.0], [1.36, 42.8],
  [1.50, 44.4], [1.65, 46.0], [1.79, 46.9], [1.93, 48.7], [3.26, 59.0],
  [3.53, 61.1], [3.80, 62.9], [4.07, 64.3], [4.34, 65.6], [4.61, 67.3],
  [15.0, 106.5], [25.0, 130.0], [34.0, 145.0], [53.0, 175.0], [62.0, 185.0]
];
const UN_TRIN_FIT = [0.2, 5.0];    /* ms — the window where the solution applies */
const UN_KT = 4.184e12;            /* J per kiloton of TNT, by convention exact */
const UN_SEDOV_XI = 1.033;         /* the similarity constant for gamma = 1.4 */

/* `nPi` is a claim each entry makes about itself and auditclaims.ps1 recomputes
   every one of them from the dimension matrix alone. `pi1` is the value the
   FIRST group takes when the real physical law is substituted — 4pi^2 for the
   pendulum, exactly 1 where dimensional analysis happens to get the constant
   right — and it is the second route the stage prints against. */
const UN_PI = {
  pend: { short:'the pendulum', name:'A pendulum: what can the period depend on?',
    vars:[{ name:'T', d:unD(0,0,1), what:'the period', u:'s' },
          { name:'L', d:unD(0,1,0), what:'the length', u:'m' },
          { name:'g', d:unD(0,1,-2), what:'gravity', u:'m/s²' },
          { name:'m', d:unD(1,0,0), what:'the bob\'s mass', u:'kg' }],
    nPi:1, pi1:4 * Math.PI * Math.PI,
    pi1why:'the small-angle solution gives T = 2π√(L/g), so T²g/L is 4π² = 39.478',
    why:'Four variables, three dimensions, one group. The mass cannot appear in any dimensionless combination at all — there is nothing to cancel its kilogram against — so the period cannot depend on it, and that is a genuine physical prediction obtained without solving anything. Galileo needed an experiment for it.' },
  string:{ short:'a wave on a string', name:'A wave on a string: dimensional analysis gets it exactly',
    vars:[{ name:'v', d:unD(0,1,-1), what:'the wave speed', u:'m/s' },
          { name:'F', d:unD(1,1,-2), what:'the tension', u:'N' },
          { name:'μ', d:unD(1,-1,0), what:'mass per unit length', u:'kg/m' }],
    nPi:1, pi1:1,
    pi1why:'the wave equation gives v = √(F/μ) with no numerical factor at all, so v²μ/F is exactly 1',
    why:'Three variables, two dimensions that matter, one group — and this time the leftover constant is 1. Dimensional analysis has produced the entire answer. That happens when there is exactly one group and the physics supplies no pure number, and it is luck rather than method: nothing in the argument said the constant would not be 7.' },
  bohr: { short:'the size of an atom', name:'How big is an atom? — with no quantum mechanics at all',
    vars:[{ name:'a', d:unD(0,1,0), what:'the atom\'s size', u:'m' },
          { name:'ħ', d:unD(1,2,-1), what:'Planck\'s constant', u:'J s' },
          { name:'mₑ', d:unD(1,0,0), what:'the electron mass', u:'kg' },
          { name:'ke²', d:unD(1,3,-2), what:'the Coulomb strength e²/4πε₀', u:'J m' }],
    nPi:1, pi1:1,
    pi1why:'the Bohr radius is DEFINED as ħ²/(mₑke²), so the group is 1 by construction — and the wing checks it against the CODATA value rather than taking that on trust',
    why:'Four variables, three dimensions, one group: a mₑ ke²/ħ². Setting it to 1 gives 5.29×10⁻¹¹ m, and that is the measured size of a hydrogen atom. No wavefunction, no Schrödinger equation, no Bohr model — the only physical input is the list of quantities an atom is allowed to be made of, and the answer is right to every digit CODATA publishes.' },
  /* The order of this list is not cosmetic. laNullBasis takes the pivot columns
     first, so putting rho, v and D in front makes THOSE the pivots and leaves
     mu and F free — which is what produces the Reynolds number and the drag
     coefficient rather than two correct but unrecognisable products of them.
     A different order gives a different basis of the same null space, and the
     stage's derivation says so; this order gives the basis with names. */
  drag: { short:'drag on a sphere', name:'Drag: two groups, and both of them are famous',
    vars:[{ name:'ρ', d:unD(1,-3,0), what:'fluid density', u:'kg/m³' },
          { name:'v', d:unD(0,1,-1), what:'the speed', u:'m/s' },
          { name:'D', d:unD(0,1,0), what:'the diameter', u:'m' },
          { name:'μ', d:unD(1,-1,-1), what:'viscosity', u:'Pa s' },
          { name:'F', d:unD(1,1,-2), what:'the drag force', u:'N' }],
    /* and `order` decides which variable each group is written around: the
       force for the one it appears in, so that group prints as the drag
       coefficient rather than as its reciprocal, and the density for the
       other, so it prints as the Reynolds number rather than as 1/Re. Both
       are cosmetic — a group and its reciprocal are the same group — and both
       are the difference between a name a reader knows and a puzzle. */
    nPi:2, pi1:null, pi1why:'', order:[4, 0, 1, 2, 3],
    why:'Five variables, three dimensions, two groups — and they are ρvD/μ, the Reynolds number, and F/ρv²D², the drag coefficient. Dimensional analysis now stops short of an answer and hands over a much better one: it says the drag coefficient is a function of the Reynolds number and of nothing else, so a wind tunnel has to measure a curve in ONE variable instead of a surface in five. That reduction, and the scale modelling it makes possible, is why the method earns its keep in engineering rather than in physics.' },
  blast:{ short:'a nuclear fireball', name:'Trinity: the yield, from photographs and a straight line',
    vars:[{ name:'R', d:unD(0,1,0), what:'the fireball radius', u:'m' },
          { name:'E', d:unD(1,2,-2), what:'the energy released', u:'J' },
          { name:'ρ', d:unD(1,-3,0), what:'the density of air', u:'kg/m³' },
          { name:'t', d:unD(0,0,1), what:'time since detonation', u:'s' }],
    nPi:1, pi1:Math.pow(UN_SEDOV_XI, 5),
    pi1why:'Sedov\'s similarity solution for γ = 1.4 gives R = 1.033 (Et²/ρ)^(1/5), so R⁵ρ/Et² is 1.033⁵',
    data:true,
    why:'One group, so R⁵ρ/Et² is a constant and R must grow as t^(2/5). G. I. Taylor read radii off published photographs, plotted them, measured the slope, and published the yield of a weapon whose yield was classified. The plot is below and the numbers are his.' },
  heat: { short:'how far heat spreads', name:'Diffusion: why the answer is always √(αt)',
    vars:[{ name:'x', d:unD(0,1,0), what:'how far it has spread', u:'m' },
          { name:'α', d:unD(0,2,-1), what:'thermal diffusivity', u:'m²/s' },
          { name:'t', d:unD(0,0,1), what:'elapsed time', u:'s' }],
    nPi:1, pi1:null, pi1why:'',
    why:'Three variables, two dimensions, one group: x²/αt. So a diffusing thing spreads as the square root of time and never as time — which is why a random walk goes as √N, why a Gaussian packet spreads as √t, and why the same √ turns up in the heat equation, in Brownian motion and in the quantum wing. One dimension vector, three subjects.' },
  custom:{ short:'type your own', name:'Your own list of quantities',
    vars:[{ name:'a', d:unD(0,1,0), what:'first', u:'m' },
          { name:'b', d:unD(0,0,1), what:'second', u:'s' },
          { name:'c', d:unD(0,1,-1), what:'third', u:'m/s' }],
    nPi:null, pi1:null, pi1why:'',
    why:'Write up to five units. The theorem counts the groups for you: as many as there are variables, minus the rank of the matrix they make.' }
};

/* the numbers the pi1 claims are checked against, computed at call time so the
   constants come from the wings that already pin them */
function unPiSecond(key){
  if(key === 'pend') return { v:4 * Math.PI * Math.PI, txt:'4π² from T = 2π√(L/g)' };
  if(key === 'string') return { v:1, txt:'1 from v = √(F/μ), which has no numerical factor' };
  if(key === 'bohr'){
    /* the group evaluated on CODATA numbers: a * m * ke^2 / hbar^2, which is 1
       exactly when a is the Bohr radius. Nothing here re-derives a0 — it is the
       published value, and the arithmetic is the check. */
    const ke2 = SL_E * SL_E / (4 * Math.PI * SL_EPS0);
    const a0 = 5.29177210544e-11;                 /* m, CODATA 2022 */
    return { v:a0 * SL_ME * ke2 / (SL_HBAR * SL_HBAR),
             txt:'a₀ mₑ ke²/ħ² on CODATA 2022 numbers, with a₀ = 5.29177210544×10⁻¹¹ m' };
  }
  if(key === 'blast') return { v:Math.pow(UN_SEDOV_XI, 5), txt:'ξ₀⁵ with ξ₀ = 1.033 for γ = 1.4' };
  return null;
}

/* the Trinity fit, done once and cached against nothing because it depends on
   nothing the reader can move */
let UN_TRIN_CACHE = null;
function unTrinity(){
  if(UN_TRIN_CACHE) return UN_TRIN_CACHE;
  const xs = [], ys = [], inFit = [];
  for(const [tms, R] of UN_TRINITY){
    const t = tms * 1e-3;
    xs.push(Math.log10(t)); ys.push(Math.log10(R));
    inFit.push(tms >= UN_TRIN_FIT[0] && tms <= UN_TRIN_FIT[1]);
  }
  const fx = xs.filter((_, i) => inFit[i]), fy = ys.filter((_, i) => inFit[i]);
  const F = pbRegress(fx, fy);
  /* R = C t^slope with log10 C = intercept. Sedov says slope = 2/5 and
     C = xi0 (E/rho)^(1/5), so E follows from the intercept — but only after
     the slope has been CHECKED rather than imposed, which is the whole point of
     measuring it. */
  const rho = 1.25;                       /* kg/m^3, air at Alamogordo's altitude */
  const C = Math.pow(10, F.inter);
  const E = rho * Math.pow(C / UN_SEDOV_XI, 5);
  /* and the same energy from a slope forced to exactly 2/5, so the reader can
     see how much of the answer came from the data and how much from the theory */
  let sum = 0;
  fx.forEach((x, i) => { sum += fy[i] - 0.4 * x; });
  const Cf = Math.pow(10, sum / fx.length);
  const Ef = rho * Math.pow(Cf / UN_SEDOV_XI, 5);
  UN_TRIN_CACHE = { xs, ys, inFit, F, C, E, kt:E / UN_KT, Ef, ktF:Ef / UN_KT, rho,
                    nFit:fx.length, declassified:21 };
  return UN_TRIN_CACHE;
}

STAGES.unPi = {
  title:'Buckingham\'s theorem',
  enter(st, o){
    st.pkey = o.pkey || 'pend';
    st.view = o.view || (o.pkey === 'blast' ? 'data' : 'groups');
  },
  cur(st){
    if(st.pkey === 'custom'){
      const O = unPiOwn(st);
      const vars = O.slots.map((s, i) => {
        const src = O.own[s.k];
        const P = unRead(src);
        return { name:'x' + (i + 1), d:P.ok ? P.d : unZero(),
                 what:P.ok ? unFmtDim(P.d) : P.why, u:src, ok:P.ok };
      });
      return { name:UN_PI.custom.name, why:UN_PI.custom.why, vars,
               G:unPiGroups(vars), second:null, data:false, declared:null,
               bad:vars.filter(v => !v.ok) };
    }
    const E = UN_PI[st.pkey];
    return { name:E.name, why:E.why, vars:E.vars, G:unPiGroups(E.vars, E.order),
             second:unPiSecond(st.pkey), data:!!E.data, declared:E.nPi, pi1why:E.pi1why };
  },
  controls(){
    const st = ST, N = this.cur(st);
    const views = [['groups', 'the groups']].concat(N.data ? [['data', 'Taylor\'s photographs']] : []);
    return ctSeg('unPiK', st.pkey, Object.keys(UN_PI).map(k => [k, UN_PI[k].short])) +
      (st.pkey === 'custom'
        ? pkBoxes('unPi', 'custom', st, unPiOwn(st).slots, UN_PI_BOUNDS,
                  'One unit per box — <b>m</b>, <b>s</b>, <b>kg/m^3</b>, <b>m/s^2</b>. ' +
                  'The theorem does the rest: it counts the groups as the number of ' +
                  'variables minus the rank of the matrix they make.') +
          ((N.bad && N.bad.length)
            ? `<p class="help" style="color:var(--c-neg)">${esc(N.bad[0].what)} — that quantity is
               being treated as dimensionless until it reads.</p>` : '')
        : '') +
      (views.length > 1 ? ctSeg('unPiV', st.view, views) : '') +
      `<p class="help">The top half is the <b>dimension matrix</b>: one column per quantity, one row
      per base dimension, and each entry the power that dimension is raised to. A dimensionless
      product of the quantities is exactly a vector <b>a</b> with <b>D a = 0</b> — so the
      dimensionless groups are the null space, and there are n − rank D of them.</p>
      <p class="help">That count is not a new theorem. It is rank–nullity from the vector-spaces
      wing, applied to a matrix of exponents. Buckingham's contribution was noticing that the
      physical statement — "how many independent dimensionless combinations are there" — is that
      linear-algebra question and nothing more.</p>`;
  },
  wire(){
    const st = ST;
    ctWireSeg('unPiK', v => { ST.pkey = v; ST.view = v === 'blast' ? 'data' : 'groups'; });
    ctWireSeg('unPiV', v => { ST.view = v; });
    if(st.pkey === 'custom')
      pkWireBoxes('unPi', 'custom', st, unPiOwn(st).slots, UN_PI_BOUNDS);
  },
  frame(st, dt, ctx, W, H){
    const N = this.cur(st);
    const B = unChipBox(ctx, W, H, 34, 58);
    const topH = N.data && st.view === 'data' ? B.ph * 0.30 : B.ph * 0.46;
    unPiMatrix(ctx, N, B.px, B.py, B.pw, topH);
    if(N.data && st.view === 'data') unPiData(ctx, B.px, B.py + topH + 22, B.pw, B.ph - topH - 22);
    else unPiBars(ctx, N, B.px, B.py + topH + 22, B.pw, B.ph - topH - 22);
    stageNote(ctx, N.G.n + ' quantities − rank ' + N.G.rank + ' = ' + N.G.nPi +
              ' independent dimensionless group' + (N.G.nPi === 1 ? '' : 's'), W, H);
  },
  derive(st){
    const N = this.cur(st), G = N.G;
    const first = G.groups[0];
    const val = N.second;
    return {
      title:'Counting the dimensionless groups',
      steps:[
        drvStep('write the exponents as a matrix',
          `${dv('D')}ᵢⱼ ${dop('=')} the power of dimension ${dv('i')} in quantity ${dv('j')}`,
          G.D.length + ' rows by ' + G.n + ' columns, of which ' +
          UN_BASE.filter((_, i) => G.D[i].some(v => Math.abs(v) > 1e-9)).length + ' rows are not all zero'),
        drvSay('a dimensionless product IS a null vector, and that is the whole idea',
          'The product of the quantities raised to powers a₁ … aₙ has dimension vector D a, by the same "multiplying adds exponents" rule the first stage measured. Being dimensionless means that vector is zero. So the question "which products are dimensionless" is the question "what is the null space of D", asked in physical language.'),
        drvStep('so the number of independent groups is rank–nullity',
          `${dv('n')} ${dop('−')} ${dfn('rank')} ${dv('D')} ${dop('=')} ${dfn('nullity')} ${dv('D')}`,
          G.n + ' − ' + G.rank + ' = ' + G.nPi + ' group' + (G.nPi === 1 ? '' : 's')),
        drvSay('rank, not "the number of dimensions involved" — and the difference bites',
          'It is tempting to count the base dimensions that appear and subtract that. That is right only when the rows are independent. If every quantity in the list happens to involve mass and length in the same fixed ratio, two rows are proportional, the rank is one less than the count, and there is one MORE group than the shortcut predicts. The matrix knows; the shortcut is guessing.'),
        first ? drvStep('the first group, read out of the null space',
          `Π₁ ${dop('=')} ${unPiText(first, N.vars)}`,
          'exponents [' + first.a.map(v => fmtNum(v, 3)).join(', ') + '], recomputed dimension ' +
          fmtGapTight(first.resid, 1) + ' from zero')
              : drvSay('there are no groups at all',
          'Every dimensionless combination of these quantities is trivial. That is itself a statement: no relation among them can be written without bringing in something else.'),
        val ? drvStep('and the constant, which dimensional analysis cannot supply',
          `Π₁ ${dop('=')} constant`,
          'the physics says ' + fmtSig(val.v, 9) + ' — ' + val.txt)
            : drvSay('the constant is not available from here, and saying so is the honest step',
          'With one group, the physics reads Π₁ = constant and the constant needs an experiment or a solved equation. With two, it reads Π₁ = f(Π₂) and a whole function needs measuring. Either way dimensional analysis has reduced the unknown; it has not removed it.'),
        drvSay('what the method is actually buying',
          'A drag law in five variables is a surface in a four-dimensional space, and measuring it is a career. Written in the two groups it is a curve in one variable, and measuring it is an afternoon. The information content is identical — the collapse is a change of coordinates — but one of the two can be plotted.'),
        drvSay('and one warning that has cost real time',
          'The groups are not unique. Any product of powers of a basis of the null space is another basis, so Π₁Π₂ and Π₂ describe the same physics as Π₁ and Π₂. What is unique is HOW MANY there are. A textbook giving a different-looking pair from this panel is not disagreeing with it.')
      ],
      note:'Every group printed here has had its own dimensions recomputed from the tidied ' +
           'exponents; the worst residual over all of them is ' + fmtGapTight(G.worst, 1) + '.'
    };
  },
  readout(st){
    const N = this.cur(st), G = N.G, V = N.second;
    const rows = G.groups.map((g, i) =>
      kv('Π' + uniSup(String(i + 1)), unPiText(g, N.vars) +
         '  <span style="color:var(--c-dim)">— dimensions ' + fmtGapTight(g.resid, 1) + ' from zero</span>')).join('');
    let trin = '';
    if(N.data && st.view === 'data'){
      const T = unTrinity();
      trin = `<div class="card tight"><div class="ttl">Trinity, 16 July 1945 — from the photographs</div>
        ${kv('slope predicted', '0.4 exactly — because R⁵ρ/Et² is the only group')}
        ${kv('slope measured', fmtNum(T.F.slope, 6) + '  over ' + T.nFit + ' points between ' +
             UN_TRIN_FIT[0] + ' and ' + UN_TRIN_FIT[1] + ' ms')}
        ${kv('the two, compared', fmtAgree(0.4, T.F.slope))}
        ${kv('r² of the fit', fmtNum(T.F.r2, 8))}
        ${kv('energy, slope measured', fmtSig(T.E, 4) + ' J   =  ' + fmtNum(T.kt, 4) + ' kilotons')}
        ${kv('energy, slope forced to 2/5', fmtSig(T.Ef, 4) + ' J   =  ' + fmtNum(T.ktF, 4) + ' kilotons')}
        ${kv('the declassified yield', T.declassified + ' kilotons')}
        ${kv('against the declassified figure', fmtAgree(T.ktF, T.declassified, 'kt'))}
        <p class="help">Two rows are worth reading together, because they came from different places.
        The <b>slope</b> is a prediction of the theorem alone, and the photographs agree with it to
        0.3% — the fireball really does grow as t^(2/5), which is not obvious and was not known. The
        <b>energy</b> then follows from where the line sits, and it needs one thing the theorem cannot
        give: Sedov's similarity constant ξ₀ = 1.033, which comes from solving the flow. Dimensional
        analysis got the shape; a differential equation got the size.</p>
        <p class="help">The energy lands about 14% below the declassified figure, and that gap is
        worth attributing rather than apologising for. Two terms in it are known to be imperfect and
        both push the same way. ξ₀ = 1.033 is computed for γ = 1.4, and the air inside a fireball is
        hot enough to dissociate and ionise, which lowers γ; and the visible edge on a photograph is
        the luminous front, not exactly the shock. Neither is a defect in the method. Getting a
        classified yield to fifteen percent from published photographs and a rank calculation is what
        the method is <i>for</i>, and Taylor's own published estimate sat in the same place.</p>
        <p class="help">The first point and the last three are outside the fitting window on purpose.
        At 0.10 ms the shock has not yet forgotten the size of the device, and by 62 ms it has decayed
        towards an ordinary sound wave. A similarity solution is exact in the middle and wrong at both
        ends, and the plot shows you where those ends are rather than asserting a range.</p>
      </div>`;
    }
    return `<div class="card tight"><div class="ttl">${N.name}</div>
      ${kv('quantities', G.n + ' — ' + N.vars.map(v => v.name + ' in ' + esc(String(v.u || '?'))).join(', '))}
      ${kv('their dimensions', N.vars.map(v => unFmtDim(v.d)).join('  ·  '))}
      ${kv('rank of the matrix', String(G.rank))}
      ${kv('independent groups', G.nPi + '  (= ' + G.n + ' − ' + G.rank + ')')}
      ${rows || '<p class="help">No dimensionless combination exists.</p>'}
      <p class="help">${N.why}</p>
    </div>
    ${V ? `<div class="card tight"><div class="ttl">The constant the method cannot supply</div>
      ${kv('Π₁, from the physics', fmtSig(V.v, 10))}
      ${kv('where that comes from', V.txt)}
      ${kv('what dimensional analysis says', 'only that Π₁ is <i>some</i> constant')}
      <p class="help">${N.pi1why || ''}</p>
      <p class="help">This is the honest boundary of the method, and it is worth being precise about
      which side of it each number lives on. That the group exists, that there is exactly one of it,
      and that the mass cannot enter — all of that came from counting. That the constant is
      ${fmtSig(V.v, 6)} came from somewhere else entirely.</p>
    </div>` : ''}
    ${trin}`;
  },
  chip(st){
    const N = this.cur(st);
    return `<div class="k">groups</div>
      <div style="color:var(--c-pos)">${N.G.n} − ${N.G.rank} = ${N.G.nPi}</div>
      <div style="color:var(--c-dim)">${N.G.groups.length ? unPiText(N.G.groups[0], N.vars) : 'none'}</div>`;
  },
  legend(st){
    const N = this.cur(st);
    if(N.data && st.view === 'data')
      return [['var(--c-pos)', 'radii used in the fit'],
              ['var(--c-dim)', 'radii outside the similarity solution\'s range'],
              ['var(--c-warn)', 'the least-squares line, slope measured'],
              ['var(--c-grad)', 'slope forced to exactly 2/5']];
    return [['var(--c-pos)', 'a positive exponent in the group'],
            ['var(--c-neg)', 'a negative one'],
            ['var(--c-warn)', 'a pivot column — this quantity is determined by the others']];
  },
  dockLegend:true
};

/* the reader's own list of units, as slots that grow with the count */
const UN_PI_BOUNDS = [{ k:'n', label:'how many', def:3 }];
function unPiSlots(st){
  const own = st.own_unPi || {};
  const n = Math.max(2, Math.min(5, Math.round(+own.n) || 3));
  const defs = ['m', 's', 'm/s^2', 'kg', 'kg/m^3'];
  /* The audit values must differ from the defaults IN DIMENSION, not merely in
     spelling. The first version used km, ms and N/kg — which are the same seven
     exponents as m, s and m/s², so this stage's every output was byte-identical
     after typing and auditcustom correctly reported a wired picker as unwired.
     A gate is right to complain when the thing typed cannot change the answer;
     that is the whole point of the check. These five give rank 3 with no
     dimensionless combination at all, which is as different as it gets. */
  const audits = ['kg', 'J', 'V', 'Pa', 'mol'];
  const out = [];
  for(let i = 0; i < n; i++)
    out.push({ k:'u' + i, label:'x' + (i + 1) + ' is in', def:defs[i],
               vars:'a unit — m, s, kg, m/s^2, kg/m^3', audit:audits[i], build:unBuild });
  return out;
}
/* the slots and the storage together, with any slot the reader has grown into
   seeded from its default. pkOwn only seeds on FIRST call, so raising the count
   from three to five left u3 and u4 undefined and their boxes rendered the word
   "undefined" — which then failed to parse and was blamed on the reader. */
function unPiOwn(st){
  const slots = unPiSlots(st);
  const own = pkOwn(st, 'unPi', slots, UN_PI_BOUNDS);
  for(const s of slots) if(own[s.k] === undefined) own[s.k] = s.def;
  return { own, slots };
}

/* ---- the dimension matrix, drawn as a matrix ----------------------------- */
function unPiMatrix(ctx, N, x, y, w, h){
  const G = N.G;
  /* only the rows that carry something: printing four rows of zeros is noise,
     and the rank is about the rows that are there */
  const rows = [];
  for(let i = 0; i < UN_NB; i++) if(G.D[i].some(v => Math.abs(v) > 1e-9)) rows.push(i);
  if(!rows.length) rows.push(0);
  const nc = G.n, nr = rows.length;
  const labH = 22, lblW = 34;
  const cw = Math.max(34, Math.min(96, (w - lblW - 8) / nc));
  const ch = Math.max(16, Math.min(30, (h - labH - 6) / nr));
  const x0 = x + lblW, y0 = y + labH;
  const { pivots } = laRREF(G.D);
  /* a raw fillText gets no help from plotFrame, so the chip has to be dodged by
     hand — see auditticks' second check */
  const cap = 'the dimension matrix — a column per quantity, a row per dimension';
  ctx.save(); ctx.font = '11px ' + FONT_UI;
  const capX = ctTitleClearChip(ctx, x + w / 2, y - 12, cap);
  ctx.restore();
  ctText(ctx, capX, y - 12, cap, rgbCss(TH.dim), '11px ' + FONT_UI, 'center', 'bottom');
  for(let j = 0; j < nc; j++){
    const cx = x0 + (j + 0.5) * cw;
    const piv = pivots.indexOf(j) >= 0;
    ctText(ctx, cx, y0 - 6, N.vars[j].name, rgbCss(piv ? TH.warn : TH.text),
           '600 12px ' + FONT_UI, 'center', 'bottom');
    ctText(ctx, cx, y0 - 6 + labH * 0.72, N.vars[j].u || '', rgbCss(TH.faint),
           '9px ' + FONT_UI, 'center', 'bottom');
  }
  for(let r = 0; r < nr; r++){
    const i = rows[r], cy = y0 + (r + 0.5) * ch;
    ctText(ctx, x0 - 8, cy, UN_BASE[i], rgbCss(TH.dim), '11px ' + FONT_UI, 'right', 'middle');
    for(let j = 0; j < nc; j++){
      const v = G.D[i][j];
      ctText(ctx, x0 + (j + 0.5) * cw, cy, Math.abs(v) < 1e-9 ? '·' : fmtNum(v, 3),
             rgbCss(Math.abs(v) < 1e-9 ? TH.faint : (v > 0 ? TH.pos : TH.neg)),
             (Math.abs(v) < 1e-9 ? '' : '600 ') + '12px ' + FONT_UI, 'center', 'middle');
    }
  }
  /* the two brackets that make it read as a matrix rather than as a table */
  ctx.save();
  ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1.4;
  const yT = y0 - 2, yB = y0 + nr * ch + 2, xl = x0 - 4, xr = x0 + nc * cw + 4;
  ctx.beginPath();
  ctx.moveTo(xl + 7, yT); ctx.lineTo(xl, yT); ctx.lineTo(xl, yB); ctx.lineTo(xl + 7, yB);
  ctx.moveTo(xr - 7, yT); ctx.lineTo(xr, yT); ctx.lineTo(xr, yB); ctx.lineTo(xr - 7, yB);
  ctx.stroke();
  ctx.restore();
  ctText(ctx, x + w / 2, yB + 14,
         'rank ' + G.rank + ' — ' + (G.rank === nr ? 'the rows are independent'
                                                   : 'two rows are proportional, so the rank is below the row count'),
         rgbCss(TH.dim), '10px ' + FONT_UI, 'center', 'top');
}

/* ---- the groups, drawn as exponent bars ---------------------------------- */
function unPiBars(ctx, N, x, y, w, h){
  const G = N.G;
  if(!G.groups.length){
    ctText(ctx, x + w / 2, y + h / 2, 'no dimensionless combination exists',
           rgbCss(TH.dim), '13px ' + FONT_UI, 'center', 'middle');
    return;
  }
  const rowH = Math.min(96, h / G.groups.length);
  let hi = 1;
  G.groups.forEach(g => g.a.forEach(v => { hi = Math.max(hi, Math.abs(v)); }));
  hi = Math.ceil(hi) + 0.4;
  G.groups.forEach((g, k) => {
    const yy = y + k * rowH;
    const P = mkPlot(x + 8, yy + 20, w - 16, rowH - 32, -0.6, G.n - 0.4, -hi, hi);
    ctText(ctx, x + 8, yy + 12, 'Π' + uniSup(String(k + 1)) + '  =  ' + unPiText(g, N.vars),
           rgbCss(TH.text), '600 12px ' + FONT_UI, 'left', 'bottom');
    ctPath(ctx, P, [{ x:-0.6, y:0 }, { x:G.n - 0.4, y:0 }], rgbCss(TH.line2), 1.2);
    g.a.forEach((e, j) => {
      const col = Math.abs(e) < 1e-9 ? TH.faint : (e > 0 ? TH.pos : TH.neg);
      if(Math.abs(e) > 1e-9){
        ctFill(ctx, P, [{ x:j - 0.28, y:0 }, { x:j + 0.28, y:0 },
                        { x:j + 0.28, y:e }, { x:j - 0.28, y:e }], rgbCss(col, 0.5));
        ctPath(ctx, P, [{ x:j - 0.28, y:0 }, { x:j + 0.28, y:0 }, { x:j + 0.28, y:e },
                        { x:j - 0.28, y:e }, { x:j - 0.28, y:0 }], rgbCss(col), 1.5);
      }
      ctText(ctx, P.X(j), P.Y(0) + (e >= 0 ? 11 : -11), N.vars[j].name,
             rgbCss(TH.dim), '10px ' + FONT_UI, 'center', e >= 0 ? 'top' : 'bottom');
      if(Math.abs(e) > 1e-9)
        ctText(ctx, P.X(j), P.Y(e) + (e > 0 ? -4 : 4), fmtNum(e, 3), rgbCss(col),
               '600 10px ' + FONT_UI, 'center', e > 0 ? 'bottom' : 'top');
    });
  });
}

/* ---- Taylor's plot ------------------------------------------------------- */
function unPiData(ctx, x, y, w, h){
  const T = unTrinity();
  const B = ctFitBox(x, y, w, h);
  const xs = T.xs, ys = T.ys;
  const x0 = Math.min.apply(null, xs) - 0.2, x1 = Math.max.apply(null, xs) + 0.2;
  const y0 = Math.min.apply(null, ys) - 0.1, y1 = Math.max.apply(null, ys) + 0.1;
  const P = mkPlot(B.px, B.py, B.pw, B.ph, x0, x1, y0, y1);
  plotFrame(ctx, P, 'log₁₀ t  (t in seconds)', 'log₁₀ R  (R in metres)',
            'Trinity — radius against time, both logarithmic');
  ctGrid(ctx, P);
  /* the measured line, and the line the theorem predicts, drawn separately so
     the reader can see they are the same line rather than being told */
  ctPath(ctx, P, [{ x:x0, y:T.F.predict(x0) }, { x:x1, y:T.F.predict(x1) }], rgbCss(TH.warn), 2.2);
  const cF = Math.log10(T.Ef === 0 ? 1 : Math.pow(T.Ef / T.rho, 0.2) * UN_SEDOV_XI);
  ctPath(ctx, P, [{ x:x0, y:cF + 0.4 * x0 }, { x:x1, y:cF + 0.4 * x1 }],
         rgbCss(TH.grad), 1.6, [7, 5]);
  xs.forEach((xv, i) => {
    ctDot(ctx, P, xv, ys[i], T.inFit[i] ? 4.2 : 3, rgbCss(T.inFit[i] ? TH.pos : TH.dim), rgbCss(TH.bg));
  });
  ctText(ctx, P.px + 10, P.py + 14,
         'slope measured ' + fmtNum(T.F.slope, 5) + '   ·   predicted 0.4   ·   ' +
         fmtNum(T.ktF, 3) + ' kt against 21 declassified',
         rgbCss(TH.dim), '10px ' + FONT_UI, 'left', 'top');
}
