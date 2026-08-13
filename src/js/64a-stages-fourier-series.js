/* ============================================================================
   4d · THE FOURIER WING
   Every stage here shows the same two pictures at once — a signal in time, and
   the same signal in frequency — because the entire subject is the claim that
   those are two descriptions of one object.
   ============================================================================ */

/* two stacked plot rectangles: time above, frequency below */
function ftPanes(W, H, split){
  const s = split === undefined ? 0.5 : split;
  const top = { x:66, y:34, w:W - 110, h:(H - 96) * s };
  const bot = { x:66, y:34 + top.h + 52, w:W - 110, h:(H - 96) * (1 - s) };
  return { top, bot };
}
function ftFrame(ctx, P, xl, yl, title){ plotFrame(ctx, P, xl, yl, title); plotZeroY(ctx, P); }
function ftLine(ctx, P, xs, ys, col, w){
  ctx.strokeStyle = col; ctx.lineWidth = w || 1.7;
  ctx.beginPath();
  let started = false;
  for(let i = 0; i < xs.length; i++){
    const y = ys[i];
    if(!Number.isFinite(y)){ started = false; continue; }
    const X = P.X(xs[i]), Y = P.Y(Math.max(P.y0, Math.min(P.y1, y)));
    started ? ctx.lineTo(X, Y) : (ctx.moveTo(X, Y), started = true);
  }
  ctx.stroke();
}
/* a stem plot — the honest way to draw a discrete spectrum, which is a set of
   isolated numbers rather than a continuous curve */
function ftStems(ctx, P, xs, ys, col, wid){
  ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wid || 2;
  for(let i = 0; i < xs.length; i++){
    if(!Number.isFinite(ys[i]) || Math.abs(ys[i]) < 1e-12) continue;
    const X = P.X(xs[i]);
    if(X < P.px - 1 || X > P.px + P.pw + 1) continue;
    ctx.beginPath(); ctx.moveTo(X, P.Y(0)); ctx.lineTo(X, P.Y(ys[i])); ctx.stroke();
    ctx.beginPath(); ctx.arc(X, P.Y(ys[i]), Math.max(1.6, (wid || 2) * 0.9), 0, 6.2832); ctx.fill();
  }
}
function ftYTicks(ctx, P, vals, fmt){
  ctx.fillStyle = rgbCss(TH.faint); ctx.font = '10px ' + FONT_MONO;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for(const v of vals) ctx.fillText((fmt || (x => fmtNum(x, 3)))(v), P.px - 6, P.Y(v));
}
const ftSeg = (id, cur, opts) => `<div class="seg" id="${id}" style="flex-wrap:wrap">` +
  opts.map(o => `<button data-v="${o[0]}" aria-pressed="${cur === o[0]}">${o[1]}</button>`).join('') + '</div>';
/* ---- a signal with no closed form -------------------------------------------
   The synthesis stage already had one: a curve you draw, whose coefficients come
   from quadrature rather than a formula. A typed function is the same thing
   arriving by a different route, so it goes down the same path — `ftNum` is true
   for both, and `ftSignal` hands back whichever one is loaded.

   Both are wrapped into one period before evaluation, because a Fourier series
   represents the periodic *extension* of whatever is given on [0, 1); that is
   also where the jump comes from when the two ends of the typed function
   disagree, and where Gibbs then appears. */
const ftNum = st => st.kind === 'draw' || st.kind === 'custom';
const FT_OWN = [{ k:'f', label:'f(t) =', vars:'t', def:'exp(-3*t)', build:pkParamBuild }];
const FT_OWN_HELP = 'One period, on 0 ≤ t &lt; 1, written in <b>t</b> — <b>exp(-3*t)</b>, ' +
  '<b>t*(1-t)</b>, <b>sin(2*pi*t) + 0.4*sin(6*pi*t)</b>, <b>abs(t-0.5)</b>. The coefficients are ' +
  'computed by quadrature, so nothing needs a closed form and nothing needs to be odd: both the ' +
  'cosine and the sine coefficients appear. If f(0) and f(1) disagree the periodic extension has a ' +
  'jump, and Gibbs overshoot appears at it.';
function ftSignal(st){
  if(st.kind === 'custom'){
    const own = pkOwn(st, 'ftown', FT_OWN, null);
    const g = pkParamFn(own.f);
    return t => g(((t % 1) + 1) % 1, 1);
  }
  return t => skAt(st.sk, ((t % 1) + 1) % 1);
}

function ftWireSeg(id, set){
  const s = $(id); if(!s) return;
  for(const b of s.children) b.addEventListener('click', () => {
    if(!ST) return;
    set(b.dataset.v); buildStagePanel(); updateStageLegend();
  });
}

/* ============================================================================
   1 · SYNTHESIS — building a shape out of sines
   ============================================================================ */
STAGES.ftSynth = {
  title: 'Fourier series',
  derive(st){
    return {
      title:'Why the coefficients can be extracted one at a time',
      steps:[
        drvSay('the claim, which was disbelieved for decades',
          'Any reasonable periodic function is a sum of sines and cosines. Fourier asserted this in 1807 and leading mathematicians rejected it, because a sum of smooth curves producing a square wave with genuine corners seemed impossible. The stage builds exactly that, and the corners appear in the limit.'),
        drvStep('the proposed expansion',
          `${dv('f')}(${dv('t')}) ${dop('=')} ${dfrac(dv('a') + '₀', '2')} ${dop('+')} Σ [${dv('a')}ₙcos ${dv('n')}ω${dv('t')} ${dop('+')} ${dv('b')}ₙsin ${dv('n')}ω${dv('t')}]`,
          `keeping ${st.K} harmonics here`),
        drvSay('the problem: infinitely many unknowns in one equation',
          'Normally that is hopeless. What rescues it is that the sines and cosines are orthogonal — and orthogonality lets each unknown be isolated without touching the others.'),
        drvStep('the orthogonality relations',
          `∫₀^T cos ${dv('m')}ω${dv('t')} cos ${dv('n')}ω${dv('t')} d${dv('t')} ${dop('=')} 0 for ${dv('m')} ${dop('≠')} ${dv('n')}`,
          'the panel evaluates these integrals numerically — they vanish to machine precision'),
        drvSay('this is the dot product from the vector-spaces wing',
          'Define the "dot product" of two functions as the integral of their product. Then the sines and cosines are mutually perpendicular, and the Fourier expansion is just writing a vector in an orthogonal basis. The formula for the coefficients is the projection formula, unchanged.'),
        drvStep('so multiply by one harmonic and integrate',
          `${dv('a')}ₙ ${dop('=')} ${dfrac('2', dv('T'))}∫₀^T ${dv('f')}(${dv('t')}) cos ${dv('n')}ω${dv('t')} d${dv('t')}`,
          'every other term integrates to zero and drops out, leaving one unknown'),
        drvSay('which is why the coefficients are independent of each other',
          'Adding more harmonics never changes the ones already computed. Contrast that with fitting a polynomial, where raising the degree changes every coefficient. Orthogonality is what makes truncation sensible, and hence what makes compression possible.'),
        drvStep('symmetry halves the work before it starts',
          `even ${dv('f')} ${dop('⇒')} all ${dv('b')}ₙ ${dop('=')} 0`,
          'an odd integrand over a symmetric interval integrates to zero'),
        drvSay('and the overshoot at a jump never goes away',
          'At a discontinuity the partial sums overshoot by about 9% of the jump, however many terms are kept. Increasing K narrows the overshoot but does not shrink it. That is the Gibbs phenomenon, and it is why a square wave through a band-limited channel always rings.')
      ],
      note:'You can draw your own waveform on the strip and its coefficients are computed numerically from your drawing. The reconstruction is then built from those coefficients alone, so the agreement is a test of the theory against an arbitrary hand-drawn function.'
    };
  },
  dockLegend: true,
  drag: true,
  enter(st, o){
    st.kind = o.kind || 'square';
    st.K = o.K || 7;
    st.showParts = o.showParts !== false;
    /* one period, drawable. Seeded with a shape so the stage is never blank. */
    st.sk = skNew(0, 1, 128, t => (t < 0.5 ? 1 : -1));
    st.coefKey = '';
  },
  /* coefficients of whichever signal has no closed form, recomputed only when
     it changes — the drawn curve and the typed one go down the same path */
  coefs(st){
    const key = st.kind === 'custom'
      ? 'f:' + (st.own_ftown ? st.own_ftown.f : '')
      : st.sk.ys.join(',').length + ':' + st.sk.ys[7] + ':' + st.sk.ys[64];
    if(st.coefKey !== key){
      const f = ftSignal(st);
      st._coefs = Array.from({ length:201 }, (_, k) => ftNumCoef(f, k));
      st.coefKey = key;
    }
    return st._coefs;
  },
  controls(){
    const st = ST;
    return ftSeg('ftKind', st.kind, [['square','square'],['saw','sawtooth'],['triangle','triangle'],
                                     ['draw','draw your own'],['custom','type your own']]) +
      pkBoxes('ftown', st.kind, st, FT_OWN, null, FT_OWN_HELP) +
      ctlRow('harmonics K', ctlSlider('ftK', 1, 200, 1, st.K)) +
      `<label class="chk"><input type="checkbox" id="ftParts" ${st.showParts?'checked':''}><span>show the individual harmonics</span></label>
       ${st.kind === 'draw' ? `<div class="row wrap">${ctBtn('ftClr','flatten it')}</div>` : ''}
       <p class="help">${st.kind === 'custom'
        ? 'Your function, on one period. Its coefficients come from quadrature, exactly as a drawn curve\'s do — there is no closed form and no reason for it to be odd, so both the cosine and the sine coefficients appear. Try <b>exp(-3*t)</b>: smooth in the middle, but f(0) = 1 and f(1) = 0.05 disagree, so the periodic extension has a jump and Gibbs overshoot appears at t = 0 however many harmonics you keep.'
        : ftNum(st)
        ? '<b>Drag on the upper plot to draw one period</b> of any shape at all. Its coefficients are computed by quadrature — a hand-drawn curve has no closed form and no reason to be odd, so both the cosine and the sine coefficients appear. Draw something with a sharp jump and Gibbs comes back; draw something smooth and the spectrum collapses to a handful of terms.'
        : 'Every one of these waveforms is an odd function, so it needs sines only — no cosines and no constant. The coefficients are <b>b_k = 4/kπ</b> for a square (odd k only), <b>2(−1)^(k+1)/kπ</b> for a sawtooth, and <b>8(−1)^((k−1)/2)/k²π²</b> for a triangle. Notice how much faster the triangle converges: its coefficients fall as <b>1/k²</b> rather than <b>1/k</b>, because it has no jump to reproduce.'}</p>`;
  },
  wire(){
    ftWireSeg('ftKind', v => { ST.kind = v; ST.coefKey = ''; });
    /* a new formula invalidates the cached coefficients, exactly as a new
       stroke on the sketch pad does */
    pkWireBoxes('ftown', ST.kind, ST, FT_OWN, null, () => { ST.coefKey = ''; });
    wireSlider('ftK', () => ST.K, v => { ST.K = Math.round(v); }, v => Math.round(v) + ' terms');
    $('ftParts').addEventListener('change', e => { ST.showParts = e.target.checked; });
    ctWireBtn('ftClr', () => { skFill(ST.sk, () => 0); ST.coefKey = ''; });
  },
  pick(st, sx, sy, phase){
    if(st.kind !== 'draw' || !st.T) return;
    /* the plot spans two periods; drawing maps back into the single period */
    if(phase === 'up'){ st.sk._last = null; return; }
    if(!st.T.inside(sx, sy)) return;
    const t = ((st.T.invX(sx) % 1) + 1) % 1;
    skStroke(st.sk, t, st.T.invY(sy));
    st.coefKey = '';
  },
  /* the two functions the rest of the stage draws, whichever mode is active */
  exactAt(st, t){
    return ftNum(st) ? ftSignal(st)(t) : ftExact(st.kind, t);
  },
  partialAt(st, t){
    return ftNum(st) ? ftNumPartial(this.coefs(st), st.K, t) : ftPartial(st.kind, st.K, t);
  },
  termAt(st, k){
    return ftNum(st) ? (this.coefs(st)[k] || { a:0, b:0 }) : { a:0, b:ftSeriesTerm(st.kind, k) };
  },
  frame(st, dt, ctx, W, H){
    const P = ftPanes(W, H, 0.62);
    const N = 900, xs = new Float64Array(N), ex = new Float64Array(N), ps = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const t = i / (N - 1) * 2;
      xs[i] = t; ex[i] = this.exactAt(st, t); ps[i] = this.partialAt(st, t);
    }
    const T = mkPlot(P.top.x, P.top.y, P.top.w, P.top.h, 0, 2, -1.45, 1.45);
    st.T = T;
    ftFrame(ctx, T, 'time  t  (periods)', 'x(t)',
      (st.kind === 'draw' ? 'Drag to draw one period — '
        : st.kind === 'custom' ? 'Your function, one period — ' : 'Adding sines up — ') +
      st.K + ' harmonic' + (st.K === 1 ? '' : 's'));
    plotTicksX(ctx, T, [0, 0.5, 1, 1.5, 2], v => fmtNum(v, 2));
    ftYTicks(ctx, T, [-1, 0, 1]);
    /* the individual harmonics, faint, underneath */
    if(st.showParts){
      for(let k = 1; k <= Math.min(st.K, 40); k++){
        const c = this.termAt(st, k);
        if(!c.a && !c.b) continue;
        const ys = new Float64Array(N);
        for(let i = 0; i < N; i++)
          ys[i] = c.a * Math.cos(2 * Math.PI * k * xs[i]) + c.b * Math.sin(2 * Math.PI * k * xs[i]);
        ftLine(ctx, T, xs, ys, rgbCss(TH.curl, 0.3), 1);
      }
    }
    ftLine(ctx, T, xs, ex, rgbCss(TH.faint, 0.9), 1.6);
    ftLine(ctx, T, xs, ps, rgbCss(TH.grad), 2.2);
    /* mark the Gibbs overshoot where there is a jump to overshoot */
    if(st.kind === 'square' || st.kind === 'saw'){
      ctx.strokeStyle = rgbCss(TH.warn, 0.75); ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(T.px, T.Y(FT_GIBBS)); ctx.lineTo(T.px + T.pw, T.Y(FT_GIBBS)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgbCss(TH.warn); ctx.font = '10px ' + FONT_MONO;
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText('Gibbs limit 1.1790', T.px + 5, T.Y(FT_GIBBS) - 2);
    }
    /* the spectrum: the coefficients themselves */
    const K2 = Math.max(12, Math.min(st.K + 4, 60));
    const F = mkPlot(P.bot.x, P.bot.y, P.bot.w, P.bot.h, 0, K2, -0.35, 1.45);
    ftFrame(ctx, F, 'harmonic number  k', 'b_k', 'The recipe — how much of each sine');
    plotTicksX(ctx, F, [1, Math.round(K2 / 4), Math.round(K2 / 2), Math.round(3 * K2 / 4), K2], v => String(v));
    ftYTicks(ctx, F, [0, 0.5, 1]);
    const ks = [], bs = [], kg = [], bg = [];
    for(let k = 1; k <= K2; k++){
      const c = this.termAt(st, k);
      /* a drawn curve has cosine content too, so the stem is the amplitude */
      const b = ftNum(st) ? Math.hypot(c.a, c.b) * Math.sign(c.b || c.a) : c.b;
      if(k <= st.K){ ks.push(k); bs.push(b); } else { kg.push(k); bg.push(b); }
    }
    ftStems(ctx, F, kg, bg, rgbCss(TH.faint, 0.45), 2);
    ftStems(ctx, F, ks, bs, rgbCss(TH.grad), 2.4);
    stageNote(ctx, 'the faint curve is the target · the faint stems are the harmonics not yet included', W, H);
  },
  readout(st){
    let err = 0, gib = 0;
    for(let i = 0; i <= 1200; i++){
      const t = i / 1200;
      if(Math.abs(t - 0.5) < 0.03 || t < 0.03 || t > 0.97) continue;
      err = Math.max(err, Math.abs(this.partialAt(st, t) - this.exactAt(st, t)));
    }
    for(let i = 1; i <= 3000; i++) gib = Math.max(gib, this.partialAt(st, (i / 3000) * (4 / st.K)));
    const rows = [];
    for(let k = 1; k <= Math.min(9, st.K); k++){
      const c = this.termAt(st, k);
      if(ftNum(st)){
        if(Math.abs(c.a) > 1e-9 || Math.abs(c.b) > 1e-9)
          rows.push(kv('k = ' + k, 'a = ' + fmtNum(c.a, 4) + ',  b = ' + fmtNum(c.b, 4)));
      } else if(c.b) rows.push(kv('b' + k, fmtNum(c.b, 5)));
    }
    if(ftNum(st)) rows.unshift(kv('mean a₀/2', fmtNum(this.coefs(st)[0].a / 2, 5)));
    return `<div class="card tight"><div class="ttl">The series, term by term</div>
      ${rows.join('')}
      ${kv('terms included', String(st.K))}
      <p class="help">Each coefficient is itself an integral: <b>b_k = 2∫₀¹ x(t) sin(2πkt) dt</b>. Orthogonality
      does the work — multiplying by sin(2πkt) and averaging annihilates every harmonic except the k-th.</p>
    </div>
    <div class="card tight"><div class="ttl">How good is the fit?</div>
      ${kv('largest error away from the jumps', fmtNum(err, 4))}
      ${st.kind !== 'triangle' ? kv('overshoot at the jump', fmtNum(gib, 5)) : ''}
      ${st.kind !== 'triangle' ? kv('Gibbs limit (2/π)Si(π)', fmtNum(FT_GIBBS, 6)) : ''}
      ${kv('coefficients fall as', st.kind === 'triangle' ? '1/k² — no jump to reproduce' : '1/k — there is a jump')}
      <p class="help">${st.kind === 'triangle'
        ? 'A triangle is continuous, so its series converges uniformly and quickly: doubling the terms roughly quarters the error.'
        : 'Away from the jumps the series converges. <b>At</b> them it never does: the overshoot stays at 8.95% of the step however many terms you add — it only gets narrower. That is the <b>Gibbs phenomenon</b>, and it is a permanent feature of representing a discontinuity with continuous functions, not a numerical artefact.'}</p>
    </div>`;
  },
  chip(st){ return `<div class="k">Fourier series · ${st.kind}</div>
    <div style="color:var(--c-grad)">${st.K} harmonics</div>`; },
  legend(){ return [['var(--c-grad)', 'the partial sum'], ['var(--faint)', 'the waveform it is approximating'],
                    ['var(--c-curl)', 'the individual sine terms']]; }
};

/* ============================================================================
   2 · THE WINDING MACHINE — why the transform works at all
   ============================================================================ */
STAGES.ftWind = {
  title: 'Why it works',
  derive(st){
    const n = v => fmtNum(v, 6);
    return {
      title:'Wrapping a signal round a circle, and watching its centre of mass',
      steps:[
        drvSay('a mechanical picture of what the integral is doing',
          'Take the signal and wind it round a circle at some chosen rate. Then ask where the centre of mass of the wound-up curve sits. That single question is the Fourier transform, and it explains why the transform can pick one frequency out of a mixture.'),
        drvStep('winding at frequency w means multiplying by a rotating phase',
          `${dv('g')}(${dv('t')}) ${dop('=')} ${dv('f')}(${dv('t')}) ${dop('e')}^(${dop('−')}2π${dop('i')}${dv('w')}${dv('t')})`,
          `winding frequency w = ${n(st.wf)}`),
        drvStep('the centre of mass is the average of that',
          `${dv('F')}(${dv('w')}) ${dop('=')} ∫ ${dv('f')}(${dv('t')}) ${dop('e')}^(${dop('−')}2π${dop('i')}${dv('w')}${dv('t')}) d${dv('t')}`,
          'the panel plots the wound curve and marks its centre of mass live'),
        drvSay('now the key observation about where that centre sits',
          'For almost every winding rate, the wound curve is spread symmetrically round the circle and its centre of mass sits near the origin — the contributions cancel. Only when the winding rate matches a frequency actually present does the curve pile up on one side, and the centre lurches away from the origin.'),
        drvStep('so a peak in |F(w)| is a resonance between signal and winding',
          `|${dv('F')}(${dv('w')})| large ${dop('⇔')} ${dv('w')} is present in ${dv('f')}`,
          `the signal here contains ${n(st.f1)} and ${n(st.f2)} — sweep w and watch two spikes`),
        drvSay('and this is orthogonality seen dynamically',
          'The cancellation for a mismatched winding rate is precisely the statement that different harmonics are orthogonal. The static integral relation and the wound-up picture are the same fact — one algebraic, one visible.'),
        drvStep('the complex exponential does both trigonometric jobs at once',
          `${dop('e')}^(${dop('i')}θ) ${dop('=')} cos θ ${dop('+')} ${dop('i')} sin θ`,
          'the real part carries the cosine component and the imaginary part the sine'),
        drvSay('which is why the complex form is the one everybody uses',
          'Two families of coefficients become one, the orthogonality relations collapse into a single statement, and phase becomes the argument of a complex number rather than a separate bookkeeping problem. Euler\'s formula is not a convenience here — it is what makes the theory tidy.'),
        drvSay('and the phase is not a detail',
          'Where the centre of mass sits, as an angle, is the phase of that frequency component. Discard it and keep only the magnitudes and the signal is unrecoverable — two quite different sounds can share a magnitude spectrum. The transform needs both numbers per frequency.')
      ],
      note:'Sweeping the winding frequency traces out the magnitude spectrum in real time, so the plot on the right is generated by the process on the left rather than computed separately. The spikes appear exactly at the frequencies used to build the signal.'
    };
  },
  dockLegend: true,
  enter(st, o){
    st.f1 = o.f1 || 3; st.f2 = o.f2 || 5; st.a2 = o.a2 === undefined ? 0.7 : o.a2;
    st.wf = o.wf || 1.0; st.sweep = o.sweep !== false;
    st.own = !!o.own;
  },
  controls(){
    const st = ST;
    return ctlRow('winding f', ctlSlider('ftWF', 0.2, 9, 0.01, st.wf)) +
      `<label class="chk"><input type="checkbox" id="ftSweep" ${st.sweep?'checked':''}><span>sweep it automatically</span></label>` +
      ctSeg('ftWSrc', st.own ? 'own' : 'tones', [['tones', 'two pure tones'], ['own', 'type your own signal']]) +
      (st.own
        ? fnHtml('ftwsig', 'g(t) =', pkOwn(st, 'ftwsig', FT_WIND_OWN, null).g, 't, over 0 ≤ t ≤ 2') +
          `<p class="help">Write the time as <b>t</b>. The winding is done on <i>your</i> samples, so the
          centre of mass swings out wherever your signal actually has energy — including at frequencies
          you did not put there on purpose. A square wave shows its odd harmonics; a chirp shows a
          smear rather than spikes, which is the honest answer for a signal whose frequency changes.</p>`
        : ctlRow('tone 1', ctlSlider('ftF1', 1, 8, 1, st.f1)) +
          ctlRow('tone 2', ctlSlider('ftF2', 1, 8, 1, st.f2)) +
          ctlRow('its amplitude', ctlSlider('ftA2', 0, 1, 0.05, st.a2))) +
      `<p class="help">The signal is wrapped around a circle at the <b>winding frequency</b>, then its centre of
      mass is measured. Almost everywhere the wrapped shape is balanced and the centre sits at the origin. Only
      when the winding frequency matches a frequency actually present does the signal's humps line up on one
      side, and the centre lurches away from zero. <b>That displacement is the Fourier transform.</b></p>`;
  },
  wire(){
    wireSlider('ftWF', () => ST.wf, v => { ST.wf = v; ST.sweep = false; const c = $('ftSweep'); if(c) c.checked = false; }, v => fmtNum(+v, 3) + ' Hz');
    wireSlider('ftF1', () => ST.f1, v => { ST.f1 = Math.round(v); }, v => Math.round(v) + ' Hz');
    wireSlider('ftF2', () => ST.f2, v => { ST.f2 = Math.round(v); }, v => Math.round(v) + ' Hz');
    wireSlider('ftA2', () => ST.a2, v => { ST.a2 = v; }, v => fmtNum(+v, 2));
    $('ftSweep').addEventListener('change', e => { ST.sweep = e.target.checked; });
    ctWireSeg('ftWSrc', v => { ST.own = (v === 'own'); });
    if(ST.own){
      const own = pkOwn(ST, 'ftwsig', FT_WIND_OWN, null);
      fnWire('ftwsig', (m, s) => { own.g = s; }, pkParamBuild);
    }
  },
  frame(st, dt, ctx, W, H){
    if(st.sweep){
      st.wf += dt * 0.55;
      if(st.wf > 9) st.wf = 0.2;
      const s = $('ftWF'); if(s){ s.value = st.wf; const v = $('ftWFv'); if(v) v.textContent = fmtNum(st.wf, 3) + ' Hz'; }
    }
    const N = 900, dur = 2, ts = new Float64Array(N), sig = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const t = i / (N - 1) * dur;
      ts[i] = t;
      sig[i] = ftWindSignal(st, t);
    }
    /* left: the signal. right: it wound round a circle. bottom: the sweep. */
    const half = Math.min(W * 0.42, H * 0.52);
    const T = mkPlot(66, 34, W - half - 130, half - 20, 0, dur, -0.4, 2.9);
    ftFrame(ctx, T, 'time  t (s)', 'x(t)', 'The signal');
    plotTicksX(ctx, T, [0, 0.5, 1, 1.5, 2], v => fmtNum(v, 2));
    ftYTicks(ctx, T, [0, 1, 2]);
    ftLine(ctx, T, ts, sig, rgbCss(TH.grad), 1.9);

    /* the wound path */
    const cx = W - half / 2 - 40, cy = 34 + half / 2 - 10, rad = half / 2 - 26;
    const path = ftWindPath(sig, dur / (N - 1), st.wf);
    let mx = 1e-9;
    for(const p of path) mx = Math.max(mx, Math.hypot(p.x, p.y));
    const sc = rad / mx;
    ctx.strokeStyle = rgbCss(TH.line2); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 6.2832); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - rad, cy); ctx.lineTo(cx + rad, cy);
    ctx.moveTo(cx, cy - rad); ctx.lineTo(cx, cy + rad); ctx.stroke();
    ctx.strokeStyle = rgbCss(TH.curl, 0.85); ctx.lineWidth = 1.4;
    ctx.beginPath();
    path.forEach((p, i) => { const X = cx + p.x * sc, Y = cy - p.y * sc; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
    ctx.stroke();
    const wd = ftWind(sig, dur / (N - 1), st.wf);
    ckArrow(ctx, cx, cy, cx + wd.cx * sc * 3, cy - wd.cy * sc * 3, rgbCss(TH.pos), 2.4, 10);
    ctx.fillStyle = rgbCss(TH.pos);
    ctx.beginPath(); ctx.arc(cx + wd.cx * sc * 3, cy - wd.cy * sc * 3, 4.5, 0, 6.2832); ctx.fill();
    ctx.font = '11px ' + FONT_UI; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillStyle = rgbCss(TH.faint);
    ctx.fillText('wound at ' + fmtNum(st.wf, 3) + ' Hz — centre of mass ×3', cx, cy + rad + 8);

    /* the sweep: the magnitude of that displacement against winding frequency */
    const B = mkPlot(66, 34 + half + 34, W - 110, H - (34 + half + 34) - 46, 0.2, 9, 0, 0.62);
    ftFrame(ctx, B, 'winding frequency  f  (Hz)', '|centre of mass|',
      'Sweeping the winding frequency — the transform, drawn out');
    plotTicksX(ctx, B, [1, 2, 3, 4, 5, 6, 7, 8, 9], v => String(v));
    ftYTicks(ctx, B, [0, 0.25, 0.5]);
    const M = 340, fs = new Float64Array(M), ms = new Float64Array(M);
    for(let i = 0; i < M; i++){
      const f = 0.2 + (9 - 0.2) * i / (M - 1);
      fs[i] = f; ms[i] = ftWind(sig, dur / (N - 1), f).mag;
    }
    ftLine(ctx, B, fs, ms, rgbCss(TH.grad), 1.8);
    probeLine(ctx, B, st.wf, fmtNum(st.wf, 2) + ' Hz');
    stageNote(ctx, 'the spikes sit exactly at the frequencies the signal is made of — nowhere else', W, H);
  },
  readout(st){
    const N = 900, dur = 2;
    const sig = new Float64Array(N);
    for(let i = 0; i < N; i++){
      const t = i / (N - 1) * dur;
      sig[i] = ftWindSignal(st, t);
    }
    const w = ftWind(sig, dur / (N - 1), st.wf);
    const at1 = ftWind(sig, dur / (N - 1), st.f1).mag;
    const at2 = ftWind(sig, dur / (N - 1), st.f2).mag;
    return `<div class="card tight"><div class="ttl">At this winding frequency</div>
      ${kv('f', fmtNum(st.wf, 4) + ' Hz')}
      ${kv('centre of mass', '(' + fmtNum(w.cx, 4) + ', ' + fmtNum(w.cy, 4) + ')')}
      ${kv('|centre|', '<b>' + fmtNum(w.mag, 4) + '</b>')}
      ${kv('near a tone?', (Math.abs(st.wf - st.f1) < 0.15 || Math.abs(st.wf - st.f2) < 0.15) ? 'yes — the mass swings out' : 'no — it stays balanced')}
    </div>
    <div class="card tight"><div class="ttl">The signal is made of</div>
      ${kv('a constant term', '1')}
      ${kv('a sine at ' + st.f1 + ' Hz', 'amplitude 1 → reads ' + fmtNum(at1, 4))}
      ${kv('a sine at ' + st.f2 + ' Hz', 'amplitude ' + fmtNum(st.a2, 2) + ' → reads ' + fmtNum(at2, 4))}
      <p class="help">The height of each spike is <b>half</b> the amplitude of its sine, because a real sine is
      built from two counter-rotating complex exponentials and each carries half the weight. That factor of two
      is exactly why one-sided amplitude spectra double every bin except DC.</p>
    </div>
    <div class="card tight"><div class="ttl">What the picture is showing</div>
      <p class="help">Multiplying by <b>e^(−2πift)</b> rotates the signal round the origin at f turns per second;
      wrapping it that way and taking the average is precisely
      <b>X(f) = ∫ x(t) e^(−2πift) dt</b>. When f does not match anything in the signal, each hump is cancelled by
      another half a turn away and the average is zero — that cancellation is <b>orthogonality</b>, and it is the
      whole mechanism. When f does match, every hump lands on the same side and they add instead.</p>
      <p class="help">Note the spike at <b>0 Hz</b> too: the constant offset never rotates, so it always
      contributes. That is the DC term.</p>
    </div>`;
  },
  chip(st){ return `<div class="k">winding at ${fmtNum(st.wf, 3)} Hz</div>
    <div style="color:var(--c-pos)">|centre| = ${fmtNum(ftWind((function(){const N=900,s=new Float64Array(N);for(let i=0;i<N;i++){s[i]=ftWindSignal(st,i/(N-1)*2);}return s;})(), 2/899, st.wf).mag, 4)}</div>`; },
  legend(){ return [['var(--c-grad)', 'the signal, and the swept transform'],
                    ['var(--c-curl)', 'the signal wound round a circle'],
                    ['var(--c-pos)', 'the centre of mass — the transform itself']]; }
};

/* ============================================================================
   3 · TRANSFORM PAIRS — duality and the uncertainty principle
   ============================================================================ */
