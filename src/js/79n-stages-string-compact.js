/* ============================================================================
   4s · THE STRING WING — IV · COMPACTIFICATION, THE LANDSCAPE, THE SWAMPLAND
   This is where the subject is hardest on itself, so these three stages are
   written to let a reader form an opinion rather than to be reassured. The
   Calabi–Yau stage draws a real algebraic surface and counts real moduli; the
   flux stage reproduces the KKLT construction and shows the tuning it needs;
   the swampland stage runs the conjectured constraints against the potential
   on screen and against the measured bound on the tensor-to-scalar ratio.
   ============================================================================ */

/* ============================================================================
   10 · CALABI–YAU — the shape of the six directions
   ============================================================================ */
STAGES.wsCY = {
  title: 'Calabi–Yau — six dimensions, and what they decide',
  dockLegend: true,
  derive(st){
    const M = WS_CY[st.i];
    const chi = wsEulerChi(M.h11, M.h21);
    return {
      title:'Why the shape of the hidden space is the particle physics',
      steps:[
        drvSay('the constraint that picks the shape',
          'Six dimensions have to be rolled up, but not arbitrarily: keeping any supersymmetry in four dimensions forces the compact space to admit a covariantly constant spinor, which forces SU(3) holonomy, which — by Yau\'s proof of the Calabi conjecture — is equivalent to admitting a Ricci-flat Kähler metric. The name is a theorem, not a label.'),
        drvStep('Ricci-flat, so the vacuum Einstein equation holds in the compact directions',
          `${dv('R')}_μν ${dop('=')} 0`,
          'the extra dimensions must solve the same field equation the visible ones do, with nothing sourcing them'),
        drvSay('and then the topology becomes physics',
          'Deformations of the metric that preserve Ricci-flatness are massless scalar fields in four dimensions — moduli. There are h¹¹ of them controlling sizes and h²¹ controlling shapes, and there is no potential to fix any of them at this level. Every one is a massless scalar that ought to mediate a fifth force.'),
        drvStep('the moduli you get from this manifold',
          `${dv('h')}^(1,1) ${dop('=')} ${dnum(M.h11)}, ${dv('h')}^(2,1) ${dop('=')} ${dnum(M.h21)}`,
          `${wsModuliCount(M.h11, M.h21)} massless scalars including the dilaton — and not one of them has been observed`),
        drvStep('the Euler characteristic counts the generations',
          `χ ${dop('=')} 2(${dv('h')}^(1,1) ${dop('−')} ${dv('h')}^(2,1)) ${dop('=')} ${dnum(chi)}`,
          `|χ|/2 = ${fmtNum(wsGenerations(M.h11, M.h21), 4)} chiral generations in the standard heterotic embedding`),
        drvSay('which is the most striking claim in the subject',
          'The number of generations of matter — one of the crudest facts about the Standard Model, and one the Standard Model itself does not explain — comes out as a topological invariant of a six-dimensional shape. Not a coupling, not a mass: a count. Getting exactly three requires |χ| = 6, and manifolds with that property exist: the Tian–Yau manifold has χ = −18, and quotienting by a freely acting ℤ₃ gives −6.'),
        drvSay('and the difficulty is that it is not unique',
          `The Kreuzer–Skarke database contains ${fmtNum(WS_CY_COUNTS.kreuzerSkarke, 9)} reflexive four-dimensional polytopes and ${fmtNum(WS_CY_COUNTS.ksHodgePairs, 5)} distinct Hodge pairs among the threefolds built from them; the complete-intersection list adds ${fmtNum(WS_CY_COUNTS.cicy, 4)} more configurations. Each is a different four-dimensional world. The mechanism is beautiful and the selection principle is missing, and that gap is the honest state of string phenomenology.`),
        drvSay('mirror symmetry — where this stopped being only physics',
          'Swapping h¹¹ with h²¹ gives a different manifold that produces identical physics. That is a strange claim about geometry, and it was made by physicists first. It turned out to compute answers in enumerative geometry that mathematicians could not obtain — counting rational curves on the quintic — and it is now a research area in mathematics with its own literature and its own theorems.'),
        drvSay('and what has changed recently',
          'The Ricci-flat metric whose existence Yau proved is not known in closed form for a single compact Calabi–Yau. Since about 2020 neural networks have been trained to produce numerically accurate approximations to it, which for the first time makes it possible to compute physical Yukawa couplings rather than only topological counts. Work through 2025 has pushed this to symmetry-aware architectures, to combining machine learning with Donaldson\'s algorithm, and to distilling the trained networks back into closed-form Kähler potentials. A forty-year gap between "a metric exists" and "here is the metric" is being closed numerically.')
      ],
      note:'The surface drawn is a genuine two-real-dimensional slice of the Fermat quintic z₁⁵ + z₂⁵ = 1, in the standard parametrisation with 25 patches indexed by pairs of fifth roots of unity, projected orthographically from four real dimensions to three and then to the screen. It is the object in every picture captioned "a Calabi–Yau", and it is computed here rather than drawn from memory.'
    };
  },
  enter(st, o){
    st.i = o.i === undefined ? 0 : o.i;
    st.n = o.n === undefined ? 5 : o.n;
    st.alpha = o.alpha === undefined ? 0.6 : o.alpha;
    st.spin = o.spin !== false;
    st.patches = o.patches === undefined ? 25 : o.patches;
  },
  controls(){
    const st = ST;
    return ctSeg('wsCyI', String(st.i), WS_CY.map((m, i) => [String(i), m.n])) +
      ctlRow('degree n', ctlSlider('wsCyN', 3, 8, 1, st.n)) +
      ctlRow('projection angle', ctlSlider('wsCyA', 0, 1.57, 0.01, st.alpha)) +
      ctChk('wsCyS', 'let it turn', st.spin) +
      `<p class="help">The picture is the real surface z₁<sup>n</sup> + z₂<sup>n</sup> = 1 seen inside four
      real dimensions and projected down — for n = 5 that is the Fermat quintic, the standard example. What
      the panel below counts is what actually matters physically: the number of massless scalars the shape
      leaves behind, and the Euler characteristic, which fixes how many generations of matter the
      four-dimensional theory has.</p>`;
  },
  wire(){
    ctWireSeg('wsCyI', v => { ST.i = +v; });
    wireSlider('wsCyN', () => ST.n, v => { ST.n = Math.round(v); }, v => 'n = ' + Math.round(v));
    wireSlider('wsCyA', () => ST.alpha, v => { ST.alpha = v; }, v => fmtNum(+v, 3) + ' rad');
    ctWireChk('wsCyS', v => { ST.spin = v; });
  },
  frame(st, dt, ctx, W, H){
    const M = WS_CY[st.i];
    const alpha = st.alpha + (st.spin ? st.t * 0.18 : 0);
    /* ---- the surface ---- */
    const cx = W * 0.30, cy = H * 0.48, S = Math.min(W * 0.19, H * 0.34);
    wsTitle(ctx, cx, 52, 'a real slice of z₁' + supDigits(String(st.n)) + ' + z₂' + supDigits(String(st.n)) + ' = 1, projected from four dimensions', TH.grad);
    /* a fixed viewing rotation, so the patches read as a surface rather than a blur */
    const ca = Math.cos(0.62), sa = Math.sin(0.62), cb = Math.cos(0.42), sb = Math.sin(0.42);
    const proj = p => {
      const X = p.x * ca - p.y * sa;
      const Z = p.x * sa + p.y * ca;
      const Y = p.z * cb - Z * sb;
      const Zd = p.z * sb + Z * cb;
      return { sx: cx + X * S * 0.8, sy: cy - Y * S * 0.8, d: Zd };
    };
    const NU = 9, NV = 9;
    const quads = [];
    for(let k1 = 0; k1 < st.n; k1++) for(let k2 = 0; k2 < st.n; k2++){
      const grid = [];
      for(let i = 0; i <= NU; i++){
        const row = [];
        for(let j = 0; j <= NV; j++){
          const x = (Math.PI / 2) * i / NU;
          const y = -1 + 2 * j / NV;
          row.push(proj(wsFermatPoint(k1, k2, x, y, st.n, alpha)));
        }
        grid.push(row);
      }
      for(let i = 0; i < NU; i++) for(let j = 0; j < NV; j++){
        const a = grid[i][j], b = grid[i + 1][j], c = grid[i + 1][j + 1], d = grid[i][j + 1];
        quads.push({ pts:[a, b, c, d], d:(a.d + b.d + c.d + d.d) / 4, k:(k1 + k2) % st.n });
      }
    }
    quads.sort((p, q) => p.d - q.d);
    /* ONE FILL AND ONE STROKE PER QUAD, DELIBERATELY. At 2 025 quads this is
       4 072 rasterising calls a frame — the heaviest stage left in the
       laboratory, and the surface turns by default so there is nothing to
       cache. It was batched once, by depth slab and patch colour, and the
       result was wrong in a way worth recording so it is not tried again:

       the subpaths of a single path are filled by the NONZERO rule, so two
       quads of one path wound in opposite directions cancel where they
       overlap. Normalising the winding to stop that cancellation is worse
       still — the gaps between this surface's lobes ARE those opposite-wound
       back-facing quads, and filling them in turned a folded surface into a
       flat coloured disc. Both variants pass every gate in the repo; only the
       screenshot showed it.

       Batching a depth-sorted translucent mesh is not a safe transformation.
       If this stage needs to get cheaper, spend the effort on NU/NV or on
       caching when `spin` is off, not here. */
    for(const q of quads){
      const t = (q.k + 0.5) / st.n;
      const col = rampSeq(t);
      const shade = 0.28 + 0.5 * (1 / (1 + Math.exp(-q.d * 1.6)));
      ctx.fillStyle = rgbCss(col, shade);
      ctx.strokeStyle = rgbCss(TH.bg, 0.35); ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(q.pts[0].sx, q.pts[0].sy);
      for(let i = 1; i < 4; i++) ctx.lineTo(q.pts[i].sx, q.pts[i].sy);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    wsSub(ctx, cx, cy + S + 30, st.n * st.n + ' patches, one for each pair of ' + st.n + 'th roots of unity');
    wsSub(ctx, cx, cy + S + 46, 'two of the six real dimensions — the rest cannot be drawn at all');

    /* ---- the census ---- */
    const P = mkPlot(W * 0.56, 60, W * 0.38, (H - 150) * 0.55, -130, 130, -0.5, WS_CY.length - 0.5);
    plotFrame(ctx, P, 'Euler characteristic χ = 2(h¹¹ − h²¹)', '',
      'the manifolds in the picker, and what each predicts');
    plotTicksX(ctx, P, [-120, -60, 0, 60, 120], v => fmtNum(v, 3));
    rlSegment(ctx, P.X(0), P.py, P.X(0), P.py + P.ph, rgbCss(TH.line2), 1.2);
    for(let i = 0; i < WS_CY.length; i++){
      const m = WS_CY[i], chi = wsEulerChi(m.h11, m.h21);
      const y = P.Y(i);
      const sel = i === st.i;
      const xc = P.X(Math.max(-128, Math.min(128, chi)));
      rlSegment(ctx, P.X(0), y, xc, y, rgbCss(sel ? TH.pos : TH.curl, sel ? 1 : 0.55), sel ? 3 : 1.8);
      rlDot(ctx, xc, y, sel ? 5 : 3.5, rgbCss(sel ? TH.pos : TH.curl));
      rlText(ctx, chi < 0 ? P.X(0) + 6 : P.X(0) - 6, y - 9, m.n,
             rgbCss(sel ? TH.pos : TH.faint), '10px ' + FONT_UI, chi < 0 ? 'left' : 'right');
      rlText(ctx, xc + (chi < 0 ? -6 : 6), y, fmtNum(Math.abs(chi) / 2, 3) + ' gen',
             rgbCss(sel ? TH.pos : TH.faint), '9.5px ' + FONT_MONO, chi < 0 ? 'right' : 'left');
    }
    /* the target: three generations */
    for(const v of [-6, 6]){
      rlSegment(ctx, P.X(v), P.py, P.X(v), P.py + P.ph, rgbCss(TH.accent, 0.8), 1.4, [4, 4]);
    }
    rlText(ctx, P.X(0), P.py + P.ph - 12, '|χ| = 6 is what three generations needs',
           rgbCss(TH.accent), '10.5px ' + FONT_UI, 'center');

    /* the size of the catalogue, drawn as the problem it is */
    const bx = W * 0.57, by = 60 + (H - 150) * 0.55 + 50;
    rlText(ctx, bx, by, 'and how many shapes there are to choose from',
           rgbCss(TH.dim), '600 11px ' + FONT_UI);
    wsNum(ctx, bx, by + 22, 'reflexive 4-polytopes', fmtNum(WS_CY_COUNTS.kreuzerSkarke, 9), TH.warn);
    wsNum(ctx, bx, by + 40, 'distinct Hodge pairs', fmtNum(WS_CY_COUNTS.ksHodgePairs, 6), TH.warn);
    wsNum(ctx, bx, by + 58, 'complete-intersection configurations', fmtNum(WS_CY_COUNTS.cicy, 4), TH.warn);
    rlText(ctx, bx, by + 84, 'each is a different four-dimensional universe,',
           rgbCss(TH.faint), '10.5px ' + FONT_UI);
    rlText(ctx, bx, by + 99, 'and nothing yet selects between them',
           rgbCss(TH.faint), '10.5px ' + FONT_UI);
    stageNote(ctx, 'colour marks which of the patches a point belongs to — the surface really is glued out of them', W, H);
  },
  readout(st){
    const M = WS_CY[st.i];
    const chi = wsEulerChi(M.h11, M.h21);
    const g = wsGenerations(M.h11, M.h21);
    return `<div class="card tight"><div class="ttl">${M.n}</div>
      ${kv('h<sup>1,1</sup> — Kähler moduli (sizes)', String(M.h11))}
      ${kv('h<sup>2,1</sup> — complex-structure moduli (shapes)', String(M.h21))}
      ${kv('massless scalars, with the dilaton', String(wsModuliCount(M.h11, M.h21)))}
      ${kv('Euler characteristic χ', fmtNum(chi, 4))}
      ${kv('chiral generations, |χ|/2', fmtNum(g, 4))}
      ${kv('does that match the world', g === 3 ? 'yes — three, as observed'
            : 'no — the world has three, and this gives ' + fmtNum(g, 3))}
      <p class="help">${M.w}</p>
    </div>
    <div class="card tight"><div class="ttl">The moduli problem</div>
      ${kv('what a modulus is', 'a deformation of the shape that costs no energy')}
      ${kv('what it looks like in four dimensions', 'an exactly massless scalar field')}
      ${kv('how many this manifold leaves', String(wsModuliCount(M.h11, M.h21)))}
      ${kv('how many have been observed', 'none')}
      ${kv('what a massless scalar would do', 'mediate a long-range fifth force, and let constants drift')}
      <p class="help">This is not a subtlety — it is a flat contradiction with experiment unless something
      gives every modulus a mass. Torsion-balance tests of the equivalence principle and limits on the
      time-variation of the fine-structure constant both exclude massless scalars coupled with gravitational
      strength. Fixing them is what the next stage is about, and the way it is done is where the landscape
      comes from.</p>
    </div>
    <div class="card tight"><div class="ttl">Where this stands as research</div>
      ${kv('the metric Yau proved exists', 'still not known in closed form for any compact case')}
      ${kv('numerical Ricci-flat metrics', 'neural networks, since about 2020')}
      ${kv('what that unlocks', 'physical Yukawa couplings, not just topological counts')}
      ${kv('2025 directions', 'symmetry-aware architectures; Donaldson\'s algorithm on the Grassmannian; symbolic distillation of trained models')}
      ${kv('mirror symmetry', 'a physics conjecture that became a mathematics research field')}
      <p class="help">The gap being closed here is unusual. Yau's theorem guarantees a metric exists but is
      an existence proof and supplies no formula, and without a metric you cannot compute a single fermion
      mass — only counts like the ones above. Machine-learned approximations have changed that in the last
      few years, and recent work has managed to distil trained networks back into closed-form Kähler
      potentials with near-zero scalar curvature, which is a genuinely new kind of result.</p>
    </div>`;
  },
  chip(st){
    const M = WS_CY[st.i];
    return `<div class="k">Calabi–Yau</div>
      <div style="color:var(--c-curl)">χ = ${fmtNum(wsEulerChi(M.h11, M.h21), 4)}</div>
      <div style="color:var(--c-pos)">${fmtNum(wsGenerations(M.h11, M.h21), 3)} generations</div>`;
  },
  legend(){ return [['var(--c-grad)', 'the Fermat surface, coloured by patch'],
                    ['var(--c-curl)', 'the manifolds in the picker'],
                    ['var(--c-pos)',  'the one you have selected'],
                    ['var(--accent)', '|χ| = 6, which is what three generations requires'],
                    ['var(--c-warn)', 'the size of the catalogue to choose from']]; }
};

/* ============================================================================
   11 · FLUX STABILISATION AND THE LANDSCAPE
   ============================================================================ */
STAGES.wsFlux = {
  title: 'KKLT — fixing the moduli, and the price',
  dockLegend: true,
  derive(st){
    const m0 = wsKKLTMinimum(st.W0, st.A, st.a, 0, 3);
    const mU = wsKKLTMinimum(st.W0, st.A, st.a, st.D, 3);
    return {
      title:'Stabilising a modulus, and what it costs to make the answer positive',
      steps:[
        drvSay('the problem inherited from the last stage',
          'A Calabi–Yau leaves dozens of exactly massless scalars, and the world contains none. Something must generate a potential for them. Fluxes threading the cycles of the compact space do most of it, and they are quantised, which is where the discreteness of the landscape comes from.'),
        drvStep('a superpotential with one non-perturbative term',
          `${dv('W')} ${dop('=')} ${dv('W')}₀ ${dop('+')} ${dv('A')} ${dop('e')}^(−${dv('a')}${dv('T')})`,
          `W₀ = ${fmtNum(st.W0, 4)} from the fluxes; the exponential is a gaugino condensate or a wrapped instanton`),
        drvStep('the F-term potential collapses to one function of the volume',
          `${dv('V')}(σ) ${dop('=')} ${dfrac(dv('a') + dv('A') + dop('e') + '^(−' + dv('a') + 'σ)', '2σ²')}[${dfrac('σ' + dv('a') + dv('A') + dop('e') + '^(−' + dv('a') + 'σ)', '3')} ${dop('+')} ${dv('W')}₀ ${dop('+')} ${dv('A')}${dop('e')}^(−${dv('a')}σ)]`,
          m0 ? `a minimum at σ = ${fmtNum(m0.sigma, 6)} with V = ${fmtNum(m0.V, 4)} — located by scanning and bisecting dV/dσ, not by quoting` : 'no minimum at these parameters'),
        drvSay('and it is negative, which is the wrong sign',
          'The minimum is supersymmetric and anti-de Sitter. Our universe is observed to be accelerating, with a small POSITIVE vacuum energy. Something has to lift the minimum through zero without destroying it.'),
        drvStep('add an anti-brane in a warped throat',
          `${dv('V')} ${dop('→')} ${dv('V')} ${dop('+')} ${dfrac(dv('D'), 'σ³')}`,
          `D = ${fmtNum(st.D, 4)} here; the warping is what makes D small enough to be tunable rather than catastrophic`),
        drvStep('and tune D until the minimum is where you want it',
          `${dv('V')}_min ${dop('=')} ${dop('~')} 0`,
          mU ? `σ = ${fmtNum(mU.sigma, 6)}, V_min = ${fmtNum(mU.V, 4)} — solved for by bisecting on D`
             : 'the barrier has been over-topped: there is no minimum left, only runaway decompactification'),
        drvSay('now look at what has just happened',
          'The flux integers are discrete, so W₀ takes discrete values, so the minimum sits at a discrete depth. Getting a vacuum energy as small as the observed one requires finding a flux choice whose depth happens to land in an extraordinarily narrow window. There is no mechanism selecting it; there are only very many choices.'),
        drvStep('and there are enough choices',
          `${dv('N')} ${dop('∼')} ${dfrac('(2π' + dv('L') + ')^' + dv('K'), dv('K') + '!')}`,
          `with L = ${st.L} and K = ${st.K} cycles that is about 10^${fmtNum(wsVacuaLog10(st.L, st.K), 5)}; a 2015 count on one F-theory fourfold reached 10^${fmtNum(WS_LANDSCAPE_LOG10, 6)}`),
        drvSay('which is the landscape, and the reason for the argument',
          'If the number of vacua is large enough, some will have a tiny positive cosmological constant simply because there are so many, and we would necessarily find ourselves in one of those. Whether that is an explanation or an abdication is the live dispute in the field, and it is not a dispute that can be settled by calculation alone.'),
        drvSay('and the construction itself is contested',
          'KKLT has been challenged on its own terms since about 2018 — whether the anti-brane uplift is under control, whether the effective description survives at the required parameter values, and whether the supersymmetric minimum is trustworthy. Several groups argue that no controlled de Sitter vacuum has yet been constructed in string theory at all. That objection is the swampland programme, and it is the next stage.')
      ],
      note:'The default parameters are KKLT\'s own — W₀ = −10⁻⁴, A = 1, a = 0.1 — and the minimum reproduces their σ ≈ 113. The uplift D is bisected for rather than supplied, so the tuning is visible as an actual search rather than described.'
    };
  },
  enter(st, o){
    st.W0 = o.W0 === undefined ? -1e-4 : o.W0;
    st.A  = o.A === undefined ? 1 : o.A;
    st.a  = o.a === undefined ? 0.1 : o.a;
    st.L  = o.L === undefined ? 500 : o.L;
    st.K  = o.K === undefined ? 200 : o.K;
    st.uplift = o.uplift || 'ads';
    st.D = 0;
    wsFluxSolve(st);
  },
  controls(){
    const st = ST;
    return ctSeg('wsFxU', st.uplift, [['ads','no uplift — the AdS minimum'],
                                      ['zero','tuned to zero'],
                                      ['ds','tuned to a small positive value'],
                                      ['over','over-uplifted']]) +
      ctlRow('W₀ (×10⁻⁴)', ctlSlider('wsFxW', -4, -0.2, 0.02, st.W0 * 1e4)) +
      ctlRow('a', ctlSlider('wsFxA', 0.04, 0.3, 0.005, st.a)) +
      ctlRow('flux quanta K', ctlSlider('wsFxK', 20, 400, 1, st.K)) +
      ctlRow('tadpole L', ctlSlider('wsFxL', 50, 3000, 10, st.L)) +
      `<p class="help">The potential is computed from the KKLT expression and its minimum is <b>found</b>,
      by scanning for a sign change in dV/dσ and bisecting. The uplift D is likewise solved for, by bisecting
      until the minimum sits at the requested vacuum energy. Switch to "over-uplifted" and watch the barrier
      disappear entirely — beyond a certain D there is no vacuum at all, only runaway growth of the extra
      dimensions.</p>`;
  },
  wire(){
    ctWireSeg('wsFxU', v => { ST.uplift = v; wsFluxSolve(ST); });
    wireSlider('wsFxW', () => ST.W0 * 1e4, v => { ST.W0 = v * 1e-4; wsFluxSolve(ST); },
               v => 'W₀ = ' + fmtNum(+v * 1e-4, 3));
    wireSlider('wsFxA', () => ST.a, v => { ST.a = v; wsFluxSolve(ST); }, v => 'a = ' + fmtNum(+v, 3));
    wireSlider('wsFxK', () => ST.K, v => { ST.K = Math.round(v); }, v => 'K = ' + Math.round(v));
    wireSlider('wsFxL', () => ST.L, v => { ST.L = Math.round(v); }, v => 'L = ' + Math.round(v));
  },
  frame(st, dt, ctx, W, H){
    const m = wsKKLTMinimum(st.W0, st.A, st.a, st.D, 3);
    /* the vertical scale has to follow the potential, which spans decades */
    const probe = [];
    for(let i = 0; i <= 400; i++){
      const s = 20 + 380 * i / 400;
      const v = wsKKLTTotal(s, st.W0, st.A, st.a, st.D, 3);
      if(Number.isFinite(v)) probe.push(v);
    }
    const lo = Math.min(...probe), hi = Math.max(...probe);
    const span = Math.max(Math.abs(lo), Math.abs(hi)) * 1.25 || 1e-15;
    const P = mkPlot(W * 0.08, 54, W * 0.55, H - 132, 20, 400, -span, span);
    plotFrame(ctx, P, 'volume modulus σ', 'V(σ)',
      'the potential, with its minimum located numerically');
    plotTicksX(ctx, P, [20, 100, 200, 300, 400], v => fmtNum(v, 3));
    rlYTicks(ctx, P, [-span, -span / 2, 0, span / 2, span], v => fmtNum(v, 3));
    plotZeroY(ctx, P);
    /* the un-uplifted potential, for comparison */
    plotCurve(ctx, P, s => wsKKLTV(s, st.W0, st.A, st.a), 320, rgbCss(TH.faint), 1.6);
    plotCurve(ctx, P, s => wsKKLTTotal(s, st.W0, st.A, st.a, st.D, 3), 320, rgbCss(TH.curl), 2.6);
    if(m){
      rlDot(ctx, P.X(m.sigma), P.Y(m.V), 6, rgbCss(TH.pos), rgbCss(TH.bg));
      rlSegment(ctx, P.X(m.sigma), P.py, P.X(m.sigma), P.py + P.ph, rgbCss(TH.pos, 0.45), 1.2, [3, 3]);
      rlText(ctx, P.X(m.sigma), P.Y(m.V) - 16,
        'σ = ' + fmtNum(m.sigma, 5) + '   V = ' + fmtNum(m.V, 4),
        rgbCss(TH.pos), '600 10.5px ' + FONT_MONO, 'center');
    } else {
      rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2,
        'no minimum — the potential runs away to σ → ∞',
        rgbCss(TH.neg), '600 12px ' + FONT_UI, 'center');
      rlText(ctx, P.px + P.pw / 2, P.py + P.ph / 2 + 18,
        'the extra dimensions decompactify, and there is no four-dimensional world left',
        rgbCss(TH.neg), '10.5px ' + FONT_UI, 'center');
    }
    rlArrow(ctx, P.X(370), P.Y(span * 0.55), P.X(395), P.Y(span * 0.12), rgbCss(TH.warn), 1.8, 8);
    rlText(ctx, P.X(330), P.Y(span * 0.68), 'runaway: σ → ∞ is always there',
           rgbCss(TH.warn), '10.5px ' + FONT_UI, 'center');
    rlText(ctx, P.px + 10, P.py + 16, 'grey: before the uplift', rgbCss(TH.faint), '10.5px ' + FONT_UI);

    /* right: the counting */
    const bx = W * 0.68, by = 90;
    rlText(ctx, bx, by, 'how many vacua a discrete choice of flux allows',
           rgbCss(TH.dim), '600 11px ' + FONT_UI);
    wsNum(ctx, bx, by + 26, 'cycles to thread, K', String(st.K), TH.curl);
    wsNum(ctx, bx, by + 44, 'tadpole budget, L', String(st.L), TH.curl);
    wsNum(ctx, bx, by + 62, 'log₁₀ of the count', fmtNum(wsVacuaLog10(st.L, st.K), 6), TH.pos);
    wsNum(ctx, bx, by + 88, 'atoms in the observable universe', '10⁸⁰', TH.faint);
    wsNum(ctx, bx, by + 106, 'the 2015 F-theory count', '10' + supDigits(String(WS_LANDSCAPE_LOG10)), TH.warn);
    /* the exponent, drawn as a bar so its size registers */
    const Q = mkPlot(bx, by + 140, W * 0.25, Math.max(80, H - by - 240), 0, 300000, -0.5, 2.5);
    plotFrame(ctx, Q, 'log₁₀ (number of vacua)', '', '');
    plotTicksX(ctx, Q, [0, 100000, 200000, 300000], v => '10' + supDigits(fmtNum(v, 6)));
    for(const [i, v, lab, col] of [[0, 80, 'atoms in the universe', TH.faint],
                                   [1, wsVacuaLog10(st.L, st.K), 'this flux choice', TH.pos],
                                   [2, WS_LANDSCAPE_LOG10, 'Taylor–Wang, 2015', TH.warn]]){
      rlSegment(ctx, Q.X(0), Q.Y(i), Q.X(Math.min(300000, v)), Q.Y(i), rgbCss(col), 8);
      rlText(ctx, Q.X(0) + 6, Q.Y(i) - 13, lab, rgbCss(col), '10px ' + FONT_UI);
    }
    stageNote(ctx, 'every number here is found by search — the minimum by bisection on dV/dσ, the uplift by bisection on D', W, H);
  },
  readout(st){
    const m0 = wsKKLTMinimum(st.W0, st.A, st.a, 0, 3);
    const m  = wsKKLTMinimum(st.W0, st.A, st.a, st.D, 3);
    const res = m0 ? wsKKLTSusyResidual(m0.sigma, st.W0, st.A, st.a) : 0;
    const lg = wsVacuaLog10(st.L, st.K);
    return `<div class="card tight"><div class="ttl">The supersymmetric minimum</div>
      ${kv('W₀ (from quantised flux)', fmtNum(st.W0, 4))}
      ${kv('a', fmtNum(st.a, 4))}
      ${kv('σ at the minimum', m0 ? fmtNum(m0.sigma, 7) : 'none at these parameters')}
      ${kv('V there', m0 ? fmtNum(m0.V, 5) : 'not defined — there is no minimum')}
      ${kv('the SUSY condition D_TW = 0, evaluated there', m0 ? fmtNum(res, 3) : 'not applicable')}
      ${kv('sign of V', m0 ? (m0.V < 0 ? 'negative — anti-de Sitter' : 'positive') : 'not applicable')}
      <p class="help">The location is found by scanning for a sign change in dV/dσ and bisecting to machine
      precision — nothing is read off a remembered figure. The independent check beside it is that the
      supersymmetry condition D<sub>T</sub>W = 0 vanishes at the same σ, which it must if the minimum really
      is the supersymmetric one. With KKLT's own parameters this lands at σ ≈ 113, matching their paper.</p>
    </div>
    <div class="card tight"><div class="ttl">After the uplift</div>
      ${kv('uplift chosen', st.uplift === 'ads' ? 'none' : st.uplift === 'zero' ? 'tuned to V = 0'
            : st.uplift === 'ds' ? 'tuned to a small positive V' : 'deliberately too large')}
      ${kv('D, solved for by bisection', fmtNum(st.D, 5))}
      ${kv('σ after uplifting', m ? fmtNum(m.sigma, 7) : 'there is no minimum left')}
      ${kv('V after uplifting', m ? fmtNum(m.V, 5) : 'the potential runs away')}
      ${kv('the vacuum', m ? (m.V > 0 ? 'metastable de Sitter — it can tunnel out' : m.V < 0 ? 'still anti-de Sitter' : 'Minkowski, to the accuracy shown')
            : 'gone — decompactification')}
      ${kv('fractional change in D that destroys it', m ? 'a factor of about 3' : 'already exceeded')}
      <p class="help">Notice how narrow the window is. Too little uplift and the vacuum energy stays
      negative; too much and the barrier against decompactification disappears entirely. The whole
      construction lives in the gap between those, and D has to be tuned into it — which is exactly the
      objection that the swampland programme raises against this class of construction.</p>
    </div>
    <div class="card tight"><div class="ttl">And the count</div>
      ${kv('cycles K', String(st.K))}
      ${kv('tadpole L', String(st.L))}
      ${kv('vacua, log₁₀', fmtNum(lg, 7))}
      ${kv('  written out', '10' + '^' + fmtNum(lg, 6))}
      ${kv('the 2015 F-theory estimate', '10^' + fmtNum(WS_LANDSCAPE_LOG10, 6))}
      ${kv('observed vacuum energy', 'about 10⁻¹²² in Planck units')}
      <p class="help">The argument that follows is genuinely contested and worth stating fairly. Its
      supporters point out that with 10<sup>272000</sup> vacua, some will have a vacuum energy as small as
      ours purely by counting, and observers can only exist in those — so the number requires no further
      explanation. Its critics reply that this makes no prediction that could fail, and that a framework
      which accommodates any observation has stopped doing physics. Both objections are about what counts
      as an explanation, not about any step in the arithmetic above.</p>
    </div>`;
  },
  chip(st){
    const m = wsKKLTMinimum(st.W0, st.A, st.a, st.D, 3);
    return `<div class="k">Moduli stabilisation</div>
      <div style="color:var(--c-pos)">${m ? 'σ = ' + fmtNum(m.sigma, 5) : 'runaway'}</div>
      <div style="color:var(--c-curl)">${m ? 'V = ' + fmtNum(m.V, 3) : 'no vacuum'}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the potential you are looking at'],
                    ['var(--faint)',  'the same potential before the uplift'],
                    ['var(--c-pos)',  'the minimum, located by bisection'],
                    ['var(--c-warn)', 'the runaway direction, which never goes away'],
                    ['var(--c-neg)',  'over-uplifted — no vacuum at all']]; }
};
/* Solving for D is a search over many minimisations, so it happens on a control
   change and is cached on the stage — never inside a frame. */
function wsFluxSolve(st){
  if(st.uplift === 'ads'){ st.D = 0; return; }
  const base = wsKKLTMinimum(st.W0, st.A, st.a, 0, 3);
  const depth = base ? Math.abs(base.V) : 1e-15;
  if(st.uplift === 'zero') st.D = wsKKLTUpliftFor(st.W0, st.A, st.a, 3, 0);
  else if(st.uplift === 'ds') st.D = wsKKLTUpliftFor(st.W0, st.A, st.a, 3, depth * 0.05);
  else st.D = wsKKLTUpliftFor(st.W0, st.A, st.a, 3, 0) * 3;
}

/* ============================================================================
   12 · THE SWAMPLAND — the conjectures that would make it predictive again
   ============================================================================ */
STAGES.wsSwamp = {
  title: 'The swampland — what a landscape forbids',
  dockLegend: true,
  derive(st){
    const V = wsSwampV(st, st.phi), dV = wsSwampdV(st, st.phi);
    const ratio = wsDSRatio(V, dV, 1);
    const eps = wsSlowRollEps(V, dV, 1);
    return {
      title:'Turning "anything is possible" back into "these things are not"',
      steps:[
        drvSay('the move that rescues the programme',
          'If string theory has 10^272000 vacua it seems to permit anything. The swampland programme inverts the question: rather than asking what string theory allows, ask what a consistent theory of quantum gravity FORBIDS. The set of effective field theories that look fine on their own but cannot come from any quantum gravity is the swampland, and it appears to be very much larger than the landscape.'),
        drvStep('the distance conjecture — you cannot go far for free',
          `${dv('m')}(φ) ${dop('∼')} ${dv('m')}₀ ${dop('e')}^(−λΔφ/${dv('M')}_Pl)`,
          `at Δφ = ${fmtNum(st.dphi, 4)} M_Pl with λ = ${fmtNum(st.lam, 3)}, the tower has fallen to ${fmtNum(wsSDCMass(1, st.lam, st.dphi), 4)} of its starting mass`),
        drvSay('which kills large field ranges',
          'Move a scalar field more than about a Planck unit and an infinite tower of states becomes light, the effective description you started with stops being valid, and you are no longer doing the calculation you thought you were doing. Every large-field inflation model has to answer this.'),
        drvStep('and the species scale falls with it',
          `Λ_s ${dop('=')} ${dfrac(dv('M') + '_Pl', dv('N') + '^(1/(' + dv('d') + '{−}2))')}`,
          `with N = ${fmtNum(st.N, 5)} light species, gravity's own cutoff sits at ${fmtNum(wsSpeciesScale(1, st.N, 4), 5)} M_Pl`),
        drvSay('so "just add more fields" is not free',
          'Each new light species lowers the energy at which gravity becomes strong. This is why the number of light species and the Planck scale are not independent, and it is one of the few swampland statements with a straightforward semi-classical argument behind it — black holes would evaporate too fast otherwise.'),
        drvStep('the weak gravity conjecture — gravity must be the weakest force',
          `${dv('m')} ${dop('≤')} √2 ${dv('g')}${dv('q')} ${dv('M')}_Pl`,
          `the electron has m/(√2 e M_Pl) = ${fmtNum(wsWGCRatio(WS_M_ELECTRON_GEV, WS_E_GAUGE, 1, WS_MPL_RED), 4)} — it satisfies the bound by twenty-one orders of magnitude`),
        drvSay('and the argument for it is about black holes',
          'An extremal charged black hole has to be able to decay. If every charged particle were heavier than the extremality bound, it could not shed its charge, and an infinite tower of exactly stable remnants would be left behind — which causes trouble everywhere it appears. So some state must be lighter than that bound, which is precisely the statement that gravity is the weakest force. That is otherwise a brute fact about our universe with no explanation at all.'),
        drvStep('the de Sitter conjecture — the contested one',
          `${dv('M')}_Pl|∇${dv('V')}| ${dop('≥')} ${dv('c')} ${dv('V')}`,
          `for the potential on screen at φ = ${fmtNum(st.phi, 4)}: the ratio is ${fmtNum(ratio, 5)}, against a conjectured c of order 1`),
        drvSay('which is in genuine tension with observation',
          'A positive potential with a small gradient — exactly what an accelerating universe and slow-roll inflation both need — is what this forbids. Yet the tensor-to-scalar ratio is measured to be small, and for single-field slow roll r = 16ε, so the data force √(2ε) below about 0.07, an order of magnitude under an O(1) constant. Either the conjecture is wrong, or the constant is much smaller than "order one", or inflation is not single-field slow roll, or dark energy is quintessence rather than a cosmological constant.'),
        drvStep('the observational bound, put in',
          `${dv('r')} ${dop('=')} 16ε ${dop('<')} ${dnum(WS_R_LIMIT)}`,
          `so ε < ${fmtNum(WS_R_LIMIT / 16, 4)} and √(2ε) < ${fmtNum(Math.sqrt(2 * WS_R_LIMIT / 16), 4)} — the conjecture wants that to be of order 1`),
        drvSay('and this is why the programme matters',
          'These are conjectures, not theorems, and the 2025 review literature is explicit about which have proofs in special cases, which have only examples, and which have counterexamples. But taken seriously they are the first thing in decades to make string theory constrain cosmology in a way that experiment can push back on — and the pushing back has already started.')
      ],
      note:'The potential is yours to choose, and every conjecture is evaluated pointwise on it, so a potential can be watched passing one test and failing another. The measured bound on r is BICEP/Keck 2021 at 95% confidence, which remains the tightest direct limit.'
    };
  },
  enter(st, o){
    st.pot = o.pot || 'quad';
    st.phi = o.phi === undefined ? 1.2 : o.phi;
    st.lam = o.lam === undefined ? 1 : o.lam;
    st.dphi = o.dphi === undefined ? 1.5 : o.dphi;
    st.N = o.N === undefined ? 100 : o.N;
    st.c = o.c === undefined ? 1 : o.c;
  },
  controls(){
    const st = ST;
    return ctSeg('wsSwP', st.pot, [['quad','V = ½m²φ² — chaotic inflation'],
                                   ['exp','V = V₀e^(−λφ) — quintessence'],
                                   ['plateau','a plateau — Starobinsky-like'],
                                   ['cc','V = constant — a cosmological constant']]) +
      ctlRow('field value φ', ctlSlider('wsSwF', 0.05, 8, 0.01, st.phi)) +
      ctlRow('conjectured c', ctlSlider('wsSwC', 0.05, 2, 0.01, st.c)) +
      ctlRow('tower λ', ctlSlider('wsSwL', 0.2, 3, 0.01, st.lam)) +
      ctlRow('light species N', ctlSlider('wsSwN', 0, 6, 0.05, Math.log10(Math.max(1, st.N)))) +
      `<p class="help">Everything is in reduced Planck units. Pick a potential and slide along it: the panel
      evaluates M<sub>Pl</sub>|V′|/V at your point and compares it with the conjectured constant c, and it
      converts the same slope into the slow-roll parameter ε and hence into a tensor-to-scalar ratio that
      can be set against what BICEP/Keck have actually measured. A flat, positive potential — which is what
      both inflation and dark energy want — is exactly what the conjecture says cannot exist.</p>`;
  },
  wire(){
    ctWireSeg('wsSwP', v => { ST.pot = v; });
    wireSlider('wsSwF', () => ST.phi, v => { ST.phi = v; }, v => 'φ = ' + fmtNum(+v, 4) + ' M_Pl');
    wireSlider('wsSwC', () => ST.c, v => { ST.c = v; }, v => 'c = ' + fmtNum(+v, 3));
    wireSlider('wsSwL', () => ST.lam, v => { ST.lam = v; }, v => 'λ = ' + fmtNum(+v, 3));
    wireSlider('wsSwN', () => Math.log10(Math.max(1, ST.N)), v => { ST.N = Math.pow(10, v); },
               v => 'N = ' + fmtNum(Math.pow(10, +v), 4) + ' species');
  },
  frame(st, dt, ctx, W, H){
    /* the potential, with the region the conjecture forbids shaded on it */
    /* V is in arbitrary units and the sliders scale it, so a fixed ceiling of
       1.35 cut the potential off for much of the parameter space. What the
       conjecture is about is the ratio |V′|/V, which the shape carries and the
       absolute scale does not — so fit the window and keep the whole curve. */
    const P = mkPlotFit(W * 0.07, 54, W * 0.44, (H - 140) * 0.98, 0, 8,
      f => wsSwampV(st, f), { include:[0], minSpan:0.4 });
    plotFrame(ctx, P, 'φ   (reduced Planck units)', 'V(φ)   (arbitrary units)',
      'the potential, with the forbidden region marked on it');
    plotTicksX(ctx, P, [0, 2, 4, 6, 8], v => fmtNum(v, 2));
    rlYTicks(ctx, P, [0, 0.5, 1]);
    /* shade every φ where the conjecture is violated */
    const NS = 300;
    for(let i = 0; i < NS; i++){
      const f0 = 0.02 + 8 * i / NS, f1 = 0.02 + 8 * (i + 1) / NS;
      const V = wsSwampV(st, f0), dV = wsSwampdV(st, f0);
      if(!(V > 0)) continue;
      if(wsDSRatio(V, dV, 1) < st.c){
        ctx.fillStyle = rgbCss(TH.neg, 0.14);
        ctx.fillRect(P.X(f0), P.py, Math.max(1, P.X(f1) - P.X(f0)), P.ph);
      }
    }
    plotCurve(ctx, P, f => wsSwampV(st, f), 320, rgbCss(TH.curl), 2.6);
    const Vp = wsSwampV(st, st.phi), dVp = wsSwampdV(st, st.phi);
    rlDot(ctx, P.X(st.phi), P.Y(Vp), 6, rgbCss(TH.pos), rgbCss(TH.bg));
    /* the tangent, which is what the conjecture is about */
    const slopeLen = 1.1;
    rlSegment(ctx, P.X(st.phi - slopeLen), P.Y(Vp - dVp * slopeLen),
                   P.X(st.phi + slopeLen), P.Y(Vp + dVp * slopeLen), rgbCss(TH.accent), 1.8);
    const ok = wsDSRatio(Vp, dVp, 1) >= st.c;
    rlText(ctx, P.px + P.pw / 2, P.py + 18,
      ok ? 'here the conjecture is satisfied — the potential is steep enough'
         : 'here the conjecture is VIOLATED — too flat, and positive',
      rgbCss(ok ? TH.pos : TH.neg), '600 11.5px ' + FONT_UI, 'center');
    wsNum(ctx, P.px + 14, P.py + P.ph - 58, '|V′|/V  in Planck units', fmtNum(wsDSRatio(Vp, dVp, 1), 5), ok ? TH.pos : TH.neg);
    wsNum(ctx, P.px + 14, P.py + P.ph - 40, 'conjectured c', fmtNum(st.c, 4), TH.accent);
    wsNum(ctx, P.px + 14, P.py + P.ph - 22, 'slow-roll ε', fmtNum(wsSlowRollEps(Vp, dVp, 1), 5), TH.curl);

    /* the tower coming down, and the species scale */
    const Q = mkPlot(W * 0.56, 54, W * 0.38, (H - 140) * 0.48, 0, 5, -3, 0.3);
    plotFrame(ctx, Q, 'Δφ   (Planck units)', 'log₁₀ (tower mass)',
      'the distance conjecture — go far and a tower comes down');
    plotTicksX(ctx, Q, [0, 1, 2, 3, 4, 5], v => fmtNum(v, 2));
    rlYTicks(ctx, Q, [-3, -2, -1, 0]);
    plotCurve(ctx, Q, d => Math.log10(wsSDCMass(1, st.lam, d)), 220, rgbCss(TH.curl), 2.4);
    rlDot(ctx, Q.X(st.dphi), Q.Y(Math.log10(wsSDCMass(1, st.lam, st.dphi))), 5, rgbCss(TH.pos));
    rlSegment(ctx, Q.X(1), Q.py, Q.X(1), Q.py + Q.ph, rgbCss(TH.accent, 0.7), 1.4, [4, 4]);
    rlText(ctx, Q.X(1) + 5, Q.py + 15, 'one Planck unit', rgbCss(TH.accent), '10px ' + FONT_MONO);

    /* the tensor-to-scalar comparison, which is the observational teeth */
    /* the three bars sit in the upper part of the box and the exclusion
       annotation in the strip below them — at equal heights the top bar's own
       label ran straight through the annotation */
    const R = mkPlot(W * 0.56, 54 + (H - 140) * 0.48 + 60, W * 0.38, (H - 140) * 0.52 - 32,
                     0, 1.2, 0, 3.6);
    plotFrame(ctx, R, '√(2ε)  —  what the conjecture bounds from below', '',
      'the measurement, against the conjecture');
    plotTicksX(ctx, R, [0, 0.3, 0.6, 0.9, 1.2], v => fmtNum(v, 2));
    const sqrt2e = Math.sqrt(2 * wsSlowRollEps(Vp, dVp, 1));
    const obs = Math.sqrt(2 * WS_R_LIMIT / 16);
    ctx.fillStyle = rgbCss(TH.neg, 0.13);
    ctx.fillRect(R.X(obs), R.py, R.px + R.pw - R.X(obs), R.ph);
    rlSegment(ctx, R.X(obs), R.py, R.X(obs), R.py + R.ph, rgbCss(TH.neg), 1.8, [5, 4]);
    rlText(ctx, R.X(obs) + 6, R.Y(0.55), 'excluded by r < ' + fmtNum(WS_R_LIMIT, 3),
           rgbCss(TH.neg), '10.5px ' + FONT_UI);
    rlText(ctx, R.X(obs) + 6, R.Y(0.25), '(BICEP/Keck, 95% CL)', rgbCss(TH.neg), '10px ' + FONT_UI);
    for(const [i, v, lab, col] of [[1.3, Math.min(1.2, st.c), 'the conjectured c', TH.accent],
                                   [2.1, Math.min(1.2, sqrt2e), 'your potential here', TH.curl],
                                   [2.9, obs, 'the observational ceiling', TH.pos]]){
      rlSegment(ctx, R.X(0), R.Y(i), R.X(v), R.Y(i), rgbCss(col), 7);
      rlText(ctx, R.X(0) + 6, R.Y(i) - 13, lab + '  =  ' + fmtNum(v, 4), rgbCss(col), '10.5px ' + FONT_UI);
    }
    stageNote(ctx, 'these are conjectures with evidence, not theorems — and that is exactly why the measured bound above matters', W, H);
  },
  readout(st){
    const V = wsSwampV(st, st.phi), dV = wsSwampdV(st, st.phi);
    const ratio = wsDSRatio(V, dV, 1);
    const eps = wsSlowRollEps(V, dV, 1);
    const r = wsTensorRatio(eps);
    const wgc = wsWGCRatio(WS_M_ELECTRON_GEV, WS_E_GAUGE, 1, WS_MPL_RED);
    return `<div class="card tight"><div class="ttl">The de Sitter conjecture, on your potential</div>
      ${kv('V(φ)', fmtNum(V, 6))}
      ${kv('V′(φ)', fmtNum(dV, 6))}
      ${kv('M_Pl|V′|/V', fmtNum(ratio, 6))}
      ${kv('conjectured lower bound c', fmtNum(st.c, 4))}
      ${kv('verdict at this point', ratio >= st.c ? 'satisfied' : 'violated — this potential would be in the swampland')}
      ${kv('slow-roll ε', fmtNum(eps, 6))}
      ${kv('tensor-to-scalar r = 16ε', fmtNum(r, 6))}
      ${kv('measured limit on r', '< ' + fmtNum(WS_R_LIMIT, 4) + '  (95% CL)')}
      ${kv('is this potential allowed by the data', r < WS_R_LIMIT ? 'yes' : 'no — it predicts more tensor modes than are seen')}
      <p class="help">The two verdicts pull in opposite directions, and that is the point of the stage. Data
      want a flat potential; the conjecture forbids one. A potential steep enough to satisfy c ≈ 1 predicts
      r ≈ 2, which is fifty times the measured ceiling. Something has to give, and which thing gives is an
      open research question rather than a settled matter.</p>
    </div>
    <div class="card tight"><div class="ttl">Distance and species</div>
      ${kv('Δφ travelled', fmtNum(st.dphi, 5) + ' M_Pl')}
      ${kv('tower mass, as a fraction of its start', fmtNum(wsSDCMass(1, st.lam, st.dphi), 6))}
      ${kv('λ', fmtNum(st.lam, 4))}
      ${kv('light species N', fmtNum(st.N, 5))}
      ${kv('species scale Λ_s = M_Pl/√N', fmtNum(wsSpeciesScale(1, st.N, 4), 6) + ' M_Pl')}
      ${kv('  in GeV', fmtNum(wsSpeciesScale(WS_MPL_RED, st.N, 4), 5))}
      <p class="help">These two are the best-supported members of the family. The distance conjecture has
      been verified in every controlled string compactification anyone has checked, and the tower that comes
      down is always identifiable — Kaluza–Klein states as a dimension decompactifies, or winding states as
      one shrinks. The species bound has an independent semi-classical argument: with too many species,
      black holes evaporate faster than the Planck-scale description permits.</p>
    </div>
    <div class="card tight"><div class="ttl">Weak gravity, and the electron</div>
      ${kv('electron mass', fmtNum(WS_M_ELECTRON_GEV, 6) + ' GeV')}
      ${kv('gauge coupling e = √(4πα)', fmtNum(WS_E_GAUGE, 6))}
      ${kv('the bound √2·e·M_Pl', fmtNum(wsWGCBound(WS_E_GAUGE, 1, WS_MPL_RED), 5) + ' GeV')}
      ${kv('m/(√2 e M_Pl)', fmtNum(wgc, 5))}
      ${kv('verdict', wgc <= 1 ? 'satisfied, by about twenty-one orders of magnitude' : 'violated')}
      <p class="help">"Gravity is the weakest force" is usually presented as a curious fact. The weak gravity
      conjecture says it is a requirement: if it failed, extremal charged black holes would have no decay
      channel and would leave an infinite tower of stable remnants behind. The electron passes with room to
      spare, and so does every charged particle known — which is either a coincidence repeated a dozen times
      or a clue.</p>
    </div>`;
  },
  chip(st){
    const V = wsSwampV(st, st.phi), dV = wsSwampdV(st, st.phi);
    const ratio = wsDSRatio(V, dV, 1);
    return `<div class="k">Swampland</div>
      <div style="color:${ratio >= st.c ? 'var(--c-pos)' : 'var(--c-neg)'}">M_Pl|V′|/V = ${fmtNum(ratio, 4)}</div>
      <div style="color:var(--accent)">c = ${fmtNum(st.c, 3)}</div>`;
  },
  legend(){ return [['var(--c-curl)', 'the potential, and the falling tower'],
                    ['var(--c-neg)',  'where the conjecture is violated, and what r excludes'],
                    ['var(--c-pos)',  'your field value, and the observational ceiling'],
                    ['var(--accent)', 'the tangent, and the conjectured constant c']]; }
};
/* the potentials on offer, and their exact derivatives — the conjecture is a
   statement about a slope, so a finite difference would be answering a slightly
   different question than the one asked */
function wsSwampV(st, f){
  switch(st.pot){
    case 'exp':     return Math.exp(-0.7 * f);
    case 'plateau': return 1 - Math.exp(-1.1 * f);
    case 'cc':      return 0.6;
    default:        return 0.03 * f * f;
  }
}
function wsSwampdV(st, f){
  switch(st.pot){
    case 'exp':     return -0.7 * Math.exp(-0.7 * f);
    case 'plateau': return 1.1 * Math.exp(-1.1 * f);
    case 'cc':      return 0;
    default:        return 0.06 * f;
  }
}
