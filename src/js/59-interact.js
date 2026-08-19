/* ============================================================================
   5b · THE INTERACTION TOOLKIT — how a reader supplies their own conditions

   Every experiment in this laboratory should be answerable with *your* data, not
   only with the preset the author chose. Four mechanisms cover that, and they
   are shared so a stage gets all of them for a couple of lines each:

     sk*  a sketch pad     — drag a curve, get an interpolated function f(x)
     lp*  a region tool    — drag a closed loop, get a contour and its interior
     mx*  a matrix editor  — type entries, get a live matrix
     fn*  an expression box — type a formula, get a compiled function

   The sketch and the expression box are interchangeable on purpose: anywhere a
   stage accepts an initial condition it accepts either, so "draw the starting
   temperature" and "type sin(3x)·e^(−x²)" are the same feature.
   ============================================================================ */

/* ---------------------------------------------------------------- sketch ---- */
/* A sketch is a uniform sample of y over [x0,x1]. Storing samples rather than a
   path means it can be evaluated anywhere, integrated, differentiated and fed to
   the same engines an expression would feed. */
function skNew(x0, x1, n, f){
  const N = n || 128;
  const ys = new Float64Array(N + 1);
  const sk = { x0, x1, N, ys, drawn:false, src:'' };
  if(f) skFill(sk, f);
  return sk;
}
function skFill(sk, f){
  for(let i = 0; i <= sk.N; i++){
    const v = f(sk.x0 + (sk.x1 - sk.x0) * i / sk.N);
    sk.ys[i] = Number.isFinite(v) ? v : 0;
  }
  sk.drawn = false;
}
/* linear interpolation, clamped at the ends — a drawn curve has no opinion
   outside the strip it was drawn on */
function skAt(sk, x){
  const u = (x - sk.x0) / (sk.x1 - sk.x0) * sk.N;
  if(!(u > 0)) return sk.ys[0];
  if(u >= sk.N) return sk.ys[sk.N];
  const i = Math.floor(u), t = u - i;
  return sk.ys[i] * (1 - t) + sk.ys[i + 1] * t;
}
const skFn = sk => (x => skAt(sk, x));
/* derivative and integral of the drawn curve, by the obvious finite schemes —
   good enough to show that d/dx and ∫ of *your* curve behave as they should */
function skDeriv(sk, x){
  const h = (sk.x1 - sk.x0) / sk.N;
  return (skAt(sk, x + h) - skAt(sk, x - h)) / (2 * h);
}
function skIntegral(sk, a, b){
  const n = 400, h = (b - a) / n;
  let s = 0;
  for(let i = 0; i <= n; i++){
    const w = (i === 0 || i === n) ? 1 : (i % 2 ? 4 : 2);
    s += w * skAt(sk, a + h * i);
  }
  return s * h / 3;
}

/* Painting: a pointer arrives as isolated samples, so fill the gap from the
   previous one. Without that a fast drag leaves the curve full of holes. */
function skStroke(sk, x, y){
  const idx = v => Math.max(0, Math.min(sk.N, Math.round((v - sk.x0) / (sk.x1 - sk.x0) * sk.N)));
  const i = idx(x);
  if(sk._last === undefined || sk._last === null){ sk.ys[i] = y; }
  else {
    const j = sk._last, yj = sk._lastY;
    const lo = Math.min(i, j), hi = Math.max(i, j);
    for(let k = lo; k <= hi; k++){
      const t = hi === lo ? 1 : (k - lo) / (hi - lo);
      sk.ys[k] = (i >= j ? yj + (y - yj) * t : y + (yj - y) * t);
    }
  }
  sk._last = i; sk._lastY = y;
  sk.drawn = true; sk.src = '';
}
/* the pointer contract every stage uses: down/move/up on a plot */
function skPick(sk, P, sx, sy, phase){
  if(phase === 'up'){ sk._last = null; return false; }
  if(!P || !P.inside(sx, sy)) return false;
  skStroke(sk, P.invX(sx), P.invY(sy));
  return true;
}
function skPaint(ctx, P, sk, col, w){
  ctx.beginPath();
  for(let i = 0; i <= sk.N; i++){
    const x = sk.x0 + (sk.x1 - sk.x0) * i / sk.N;
    const X = P.X(x), Y = P.Y(sk.ys[i]);
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  }
  ctx.strokeStyle = col; ctx.lineWidth = w || 2.4; ctx.stroke();
}

/* ---------------------------------------------------------------- region ---- */
/* A freehand closed curve. Kept as a polygon: everything a stage wants from it
   — its area, its perimeter, whether a point is inside, and a parametrisation
   to integrate along — is elementary on a polygon and exact on the polygon
   actually drawn, so the numbers always describe what is on screen. */
function lpNew(){ return { pts:[], closed:false }; }
function lpPick(lp, P, sx, sy, phase){
  if(!P) return false;
  if(phase === 'down'){ lp.pts = []; lp.closed = false; }
  if(phase === 'up'){ if(lp.pts.length > 2) lp.closed = true; return true; }
  if(!P.inside(sx, sy)) return false;
  const p = { x:P.invX(sx), y:P.invY(sy) };
  const n = lp.pts.length;
  /* thin the path: freehand input arrives far denser than the maths needs */
  if(!n || Math.hypot(p.x - lp.pts[n-1].x, p.y - lp.pts[n-1].y) > (P.x1 - P.x0) / 160)
    lp.pts.push(p);
  return true;
}
/* the shoelace formula — signed, so its sign is the orientation */
function lpArea(lp){
  const p = lp.pts, n = p.length;
  if(n < 3) return 0;
  let s = 0;
  for(let i = 0; i < n; i++){ const q = p[(i + 1) % n]; s += p[i].x * q.y - q.x * p[i].y; }
  return s / 2;
}
function lpPerim(lp){
  const p = lp.pts, n = p.length;
  if(n < 2) return 0;
  let s = 0;
  for(let i = 0; i < n; i++){ const q = p[(i + 1) % n]; s += Math.hypot(q.x - p[i].x, q.y - p[i].y); }
  return s;
}
/* ray casting, counting crossings of a horizontal ray to the right */
function lpInside(lp, x, y){
  const p = lp.pts, n = p.length;
  let inside = false;
  for(let i = 0, j = n - 1; i < n; j = i++){
    const a = p[i], b = p[j];
    if((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
/* arc-length parametrisation on [0,1], so a line integral over a drawn loop
   uses the same quadrature as one over an analytic curve */
function lpParam(lp){
  const p = lp.pts, n = p.length;
  const cum = [0];
  for(let i = 0; i < n; i++){
    const q = p[(i + 1) % n];
    cum.push(cum[i] + Math.hypot(q.x - p[i].x, q.y - p[i].y));
  }
  const L = cum[n] || 1;
  return t => {
    const s = ((t % 1) + 1) % 1 * L;
    let i = 0;
    while(i < n && cum[i + 1] < s) i++;
    const seg = cum[i + 1] - cum[i] || 1, u = (s - cum[i]) / seg;
    const a = p[i], b = p[(i + 1) % n];
    return { x:a.x + (b.x - a.x) * u, y:a.y + (b.y - a.y) * u,
             dx:(b.x - a.x) / seg * L, dy:(b.y - a.y) / seg * L };
  };
}
function lpPaint(ctx, P, lp, col, fill){
  const p = lp.pts;
  if(p.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(P.X(p[0].x), P.Y(p[0].y));
  for(let i = 1; i < p.length; i++) ctx.lineTo(P.X(p[i].x), P.Y(p[i].y));
  if(lp.closed) ctx.closePath();
  if(fill && lp.closed){ ctx.fillStyle = fill; ctx.fill(); }
  ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
}

/* ---------------------------------------------------------------- matrix ---- */
/* An editable grid. Values live in the caller's array; the editor only reports
   changes, so a stage can recompute an eigendecomposition on every keystroke. */
function mxHtml(id, M, rowLbl, colLbl){
  const r = M.length, c = M[0].length;
  let h = `<table class="mxed" id="${id}"><tr><td class="hd"></td>` +
          Array.from({length:c}, (_, j) => `<td class="hd">${colLbl ? colLbl[j] : ''}</td>`).join('') + '</tr>';
  for(let i = 0; i < r; i++){
    h += `<tr><td class="hd">${rowLbl ? rowLbl[i] : ''}</td>` +
      M[i].map((v, j) =>
        `<td><input class="mxc" data-i="${i}" data-j="${j}" value="${fmtNum(v, 4)}" ` +
        `inputmode="decimal" spellcheck="false" aria-label="row ${i+1} column ${j+1}"></td>`).join('') +
      '</tr>';
  }
  return h + '</table>';
}
function mxWire(id, set){
  const t = $(id); if(!t) return;
  for(const e of t.querySelectorAll('input.mxc')){
    e.addEventListener('input', () => {
      const v = parseFloat(e.value.replace('−', '-'));
      if(!Number.isFinite(v)) return;
      set(+e.dataset.i, +e.dataset.j, v);
      refreshStageReadout(); updateStageLegend(); updateStageChip();
    });
  }
}
const mxClone = M => M.map(r => r.slice());

/* ------------------------------------------------------------ expression ---- */
/* One-line expression input with inline error reporting. `vars` is only a hint
   printed to the reader; the parser accepts whatever the engine supports. */
/* `audit` is what a gate should TYPE into this box, and it exists for the same
   reason the textareas have it: not every reader-supplied box takes an
   expression. auditcustom types `0.37*x^2 + sin(1.7*x)` into every .fld input
   it finds, which a box expecting a complex number correctly rejects — leaving
   the value unchanged, the readout unchanged, and a perfectly wired box
   reported as unwired. A box whose content is not an expression must say what
   it will accept. It must also differ from what the box already shows, or the
   comparison has nothing to see. */
function fnHtml(id, label, src, vars, audit){
  return `<div class="row"><label class="lb" style="width:86px">${label}</label>
    <span class="fld grow"><input id="${id}" value="${esc(src)}" spellcheck="false"
      autocomplete="off"${audit ? ` data-audit="${esc(audit)}"` : ``} aria-label="${esc(label)} expression"></span></div>
    <div class="err" id="${id}err"></div>` +
    (vars ? `<p class="help">in <b>${esc(vars)}</b> — the same syntax as the field engine</p>` : '');
}
/* set(compiled, source) is called only when the expression parses; on failure
   the message is shown and the previous function is left in place, so a
   half-typed formula never blanks the picture */
function fnWire(id, set, build){
  const e = $(id); if(!e) return;
  const err = $(id + 'err');
  const run = () => {
    try {
      const made = (build || (s => { const a = parse(s); const g = compile(a); return { f:(x, y, z) => g(x, y || 0, z || 0), ast:a }; }))(e.value);
      if(err) err.textContent = '';
      e.parentElement.classList.remove('bad');
      set(made, e.value);
      /* Accepting the formula changes what the panel should show — captions,
         readouts, the ladder — so the panel is rebuilt. That destroys the very
         input being typed into, and without putting the reader back they lose
         the caret every time the debounce fires, mid-word. */
      const live = document.activeElement === e;
      const at = live ? e.selectionStart : 0, val = e.value;
      buildStagePanel();
      if(live){
        const back = $(id);
        if(back){
          back.value = val;
          back.focus();
          try { back.setSelectionRange(at, at); } catch(_){}
        }
      }
    } catch(ex){
      if(err) err.textContent = String(ex && ex.message || ex);
      e.parentElement.classList.add('bad');
    }
  };
  let deb = 0;
  e.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(run, 260); });
  e.addEventListener('change', () => { clearTimeout(deb); run(); });
}

/* ------------------------------------------------------- your own function ---- */
/* Every preset picker in the laboratory ends with the same option — "type your
   own" — and every one of them then needs the same four things: the extra
   choice, the boxes it reveals, somewhere to keep what was typed, and a name to
   print when the current choice is not in the table. Writing that once per wing
   is how the partial-derivatives wing ended up with mvPick; writing it once
   *here* is how the other twelve got it for four lines each.

   A **slot** is one editable expression: {k, label, vars, def}.
   A **bound** is one editable number:    {k, label, def}.
   The answers live in st.own, one object, so a stage saves and restores the
   reader's whole problem in a single move.

   The important invariant: pkCur() hands the stage an object shaped exactly like
   one of its own table entries. A stage that used to write TABLE[st.key] writes
   pkCur(...) instead and needs no other change — which is what makes this
   affordable across forty stages. */
/* Storage hangs off the picker's own id, so a stage carrying two pickers — a
   field *and* a surface, say — keeps two independent sets of answers. */
function pkOwn(st, id, slots, bounds){
  const key = 'own_' + id;
  if(!st[key]){
    const o = {};
    for(const s of slots) o[s.k] = s.def;
    for(const b of (bounds || [])) o[b.k] = b.def;
    st[key] = o;
  }
  return st[key];
}
/* the wing's options, then ours */
function pkSeg(id, table, cur, nameOf){
  const label = nameOf || ((e, k) => e.name || k);
  return ctSeg(id, cur, Object.keys(table).map(k => [k, label(table[k], k)])
                                          .concat([['custom', 'type your own']]));
}
/* the boxes, which exist only while "type your own" is the choice */
function pkBoxes(id, cur, st, slots, bounds, help){
  if(cur !== 'custom') return '';
  const own = pkOwn(st, id, slots, bounds);
  let h = slots.map(s => fnHtml(id + '_' + s.k, s.label, own[s.k], s.vars, s.audit)).join('');
  if(bounds && bounds.length)
    h += '<div class="row wrap">' + bounds.map(b =>
      `<label class="lb">${b.label}</label><input class="num" style="width:78px" id="${id}_${b.k}"` +
      ` value="${esc(String(own[b.k]))}" spellcheck="false" autocomplete="off"` +
      ` aria-label="${esc(b.label)}"><span class="val" id="${id}_${b.k}v"></span>`).join('') + '</div>';
  return h + `<p class="help">${help || 'Anything the expression engine understands — ' +
    '<b>x^2</b>, <b>sin(3x)</b>, <b>exp(-x^2)</b>, <b>1/(1+x^2)</b>. Bounds take expressions too, ' +
    'so <b>pi</b>, <b>2pi</b> and <b>sqrt(2)</b> are all valid endpoints.'}</p>`;
}
/* Wire only the boxes. Kept separate from the picker because a stage often
   wires its picker itself — to reset a dependent slider when the choice
   changes — and because the boxes may carry a different id prefix from the
   segmented control that reveals them. */
function pkWireBoxes(id, cur, st, slots, bounds, after){
  if(cur !== 'custom') return;
  const own = pkOwn(st, id, slots, bounds);
  /* A slot may carry its own `build`, and must when its variables are not the
     engine's own. A curve written in t and a becomes t→x, a→y before parsing;
     validating the raw text instead would reject `a*cos(t)` as an unknown
     identifier, leave the previous formula in place and silently ignore
     everything the reader typed. */
  for(const s of slots)
    fnWire(id + '_' + s.k, (m, src) => { own[s.k] = src; if(after) after('custom'); }, s.build);
  for(const b of (bounds || [])){
    const e = $(id + '_' + b.k); if(!e) continue;
    const echo = () => ctlLabel(id + '_' + b.k + 'v', fmtNum(+own[b.k], 6));
    echo();
    /* bounds accept expressions too, and an unreadable one is left alone rather
       than being allowed to collapse the interval to NaN */
    const commit = () => {
      const v = ctlParse(e.value);
      if(Number.isFinite(v)){
        own[b.k] = v; echo();
        if(after) after('custom');
        refreshStageReadout(); updateStageChip(); updateStageLegend();
      } else e.value = String(own[b.k]);
    };
    e.addEventListener('change', commit);
    e.addEventListener('keydown', ev => { if(ev.key === 'Enter'){ ev.preventDefault(); commit(); } });
  }
}
/* picker and boxes together, for the stages that need nothing extra.
   ctWireSeg already rebuilds the panel, and that rebuild is what makes the
   boxes appear and disappear with the choice. */
function pkWire(segId, boxId, cur, st, slots, bounds, setKey, after){
  ctWireSeg(segId, v => { setKey(v); if(after) after(v); });
  pkWireBoxes(boxId, cur, st, slots, bounds, after);
}
/* ---- pickers whose value *is* the expression --------------------------------
   Half the wings keep no table at all: the segmented control's value is the
   source string itself and choosing a preset simply assigns it. Those need a
   far smaller retrofit than pkSeg — no accessor, no synthetic key, and none of
   the `TABLE[st.key]` hazard — because the "type your own" option can carry an
   ordinary source string as its value. The stage's existing ctWireSeg handler
   then needs no change at all.

   Whether the reader is on a preset is decided by looking rather than by a
   flag: if the current source is not one of the offered ones, it is theirs.

   The option list is given once, to pkSrcSeg, and remembered against the
   picker's id — so the box and the wiring can ask "is this one of ours?" without
   the caller repeating a list that is mostly typeset Unicode. controls() always
   runs before wire(), so the entry is always there by the time it is needed. */
const PK_SRC_OPTS = {};
const pkIsOwn = (id, cur) => { const o = PK_SRC_OPTS[id]; return !!o && o.indexOf(cur) < 0; };
function pkSrcSeg(id, cur, opts, def){
  PK_SRC_OPTS[id] = opts.map(o => o[0]);
  /* While a preset is showing, the extra chip offers a formula to start from —
     the first preset unless the stage names a better one. Once the reader is on
     their own formula the chip carries that, so it stays the selected one. */
  let start = pkIsOwn(id, cur) ? cur : (def || (opts[0] && opts[0][0]) || 'x');
  /* It must not carry a value the list already offers, or choosing it would
     simply re-select that preset and no box would ever appear. A trailing space
     parses to the identical function and is textually distinct, so the fallback
     is invisible to the mathematics and corrects itself the moment anything is
     typed. Stages should still pass a `def` that is genuinely their own. */
  if(!pkIsOwn(id, start)) start += ' ';
  return ctSeg(id, cur, opts.concat([[start, 'type your own']]));
}
function pkSrcBox(id, cur, label, vars, help){
  if(!pkIsOwn(id, cur)) return '';
  return fnHtml(id + 'x', label || 'f(x) =', cur, vars || 'x') +
    `<p class="help">${help || 'Anything the expression engine understands — <b>x^3-2x</b>, ' +
      '<b>sin(3x)</b>, <b>exp(-x^2)</b>, <b>1/(1+x^2)</b>, <b>abs(x)</b>. It is differentiated ' +
      'symbolically, so everything below is exact for whatever you type.'}</p>`;
}
function pkSrcWire(id, cur, set){
  if(pkIsOwn(id, cur)) fnWire(id + 'x', (m, s) => set(s));
}

/* ---- expressions in a parameter, not in x -----------------------------------
   Curves, signals and forcing terms are written in t, and the expression engine
   binds `t` to the animation clock — so a curve typed in terms of t would be
   evaluated at whatever time it happens to be. Rewrite the parameter to x
   before parsing.

   The boundary is "not a letter" rather than \b, because a digit is a word
   character and \bt\b would miss the t in `2t` — which is exactly how a curve
   gets written. Letters either side are what must be excluded, and that leaves
   the t of `atan`, `tan`, `sqrt` and `cot`, and the a of `atan` and `abs`,
   untouched. So the reader writes the parameter the way the mathematics writes
   it rather than renaming it x.

   A second convention rides along: `a` becomes y, so a stage with one live
   parameter beside the curve can pass it as an argument instead of splicing its
   value into the source and re-parsing whenever the slider moves. */
const pkParamAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'x')
  .replace(/(?<![A-Za-z])a(?![A-Za-z])/g, 'y'));
function pkParamFn(src, fallback){
  try { const g = compile(pkParamAst(src)); return (t, a) => g(t, a === undefined ? 1 : a, 0); }
  catch(e){ return fallback || (() => 0); }
}
/* the nth derivative with respect to the parameter, symbolically */
function pkParamD(src, n, fallback){
  try {
    let A = pkParamAst(src);
    for(let i = 0; i < (n || 1); i++) A = diff(A, 'x');
    const g = compile(A);
    return (t, a) => g(t, a === undefined ? 1 : a, 0);
  } catch(e){ return fallback || (() => 0); }
}
/* Build and cache a curve's value and its first two derivatives. Compiling per
   sample is what makes a stage unusable: this one is asked for ~900 points a
   frame, so the parse must happen once per formula, not once per point. */
/* the validator a parameter slot hands to fnWire: it must *throw* on bad input
   so the message reaches the reader, which is why it does not go through the
   guarded pkParamFn */
const pkParamBuild = s => { const g = compile(pkParamAst(s)); return { f:(t, a) => g(t, a, 0) }; };
/* The same rewrite for a law written in a SPEED. A drag force is naturally D(v)
   and a reader will write it that way; the engine binds x, y and z and knows
   nothing called v, so `v` is folded onto x before parsing. As with the
   parameter form, a slot using this must hand `pkSpeedBuild` to fnWire, or the
   validator rejects `0.004*v^2` as an unknown identifier and silently keeps the
   previous law. */
const pkSpeedAst = src => parse(String(src).replace(/(?<![A-Za-z])v(?![A-Za-z])/g, 'x'));
function pkSpeedFn(src, fallback){
  try { const g = compile(pkSpeedAst(src)); return s => g(s, 0, 0); }
  catch(e){ return fallback || (() => 0); }
}
const pkSpeedBuild = s => { const g = compile(pkSpeedAst(s)); return { f:v => g(v, 0, 0) }; };
/* And a force law, which wants three names at once: position, velocity and time.
   The engine has three slots, so v rides on y and t on z. The order of the two
   replacements matters only in that `v` must go first; both lookarounds keep
   them off the letters inside `atan`, `exp` and the rest. */
const pkXVTAst = src => parse(String(src)
  .replace(/(?<![A-Za-z])v(?![A-Za-z])/g, 'y')
  .replace(/(?<![A-Za-z])t(?![A-Za-z])/g, 'z'));
function pkXVTFn(src, fallback){
  try { const g = compile(pkXVTAst(src)); return (x, v, t) => g(x, v || 0, t || 0); }
  catch(e){ return fallback || (() => 0); }
}
const pkXVTBuild = s => { const g = compile(pkXVTAst(s)); return { f:(x, v, t) => g(x, v, t) }; };
const PK_CURVE_CACHE = new Map();
function pkCurve2(xs, ys){
  const key = JSON.stringify([xs, ys]);
  const hit = PK_CURVE_CACHE.get(key);
  if(hit) return hit;
  const X = pkParamFn(xs), Y = pkParamFn(ys);
  const Xd = pkParamD(xs, 1), Yd = pkParamD(ys, 1);
  const Xdd = pkParamD(xs, 2), Ydd = pkParamD(ys, 2);
  const made = {
    f:(t, a) => ({ x:X(t, a), y:Y(t, a) }),
    d:(t, a) => ({ x:Xd(t, a), y:Yd(t, a) }),
    dd:(t, a) => ({ x:Xdd(t, a), y:Ydd(t, a) })
  };
  if(PK_CURVE_CACHE.size > 32) PK_CURVE_CACHE.clear();
  PK_CURVE_CACHE.set(key, made);
  return made;
}

/* Compile a source string to a guarded function, and remember it. For the places
   where the expression is a plain string rather than a slot — a preset's `src`
   beside a typed one — and where the caller is a frame loop asking for it
   several hundred times a second. Parsing per evaluation is what makes a stage
   unusable, and it is not obvious from the call site that it is happening. */
const PK_SRC_CACHE = new Map();
/* A typed expression, dressed for reading.

   The source string is what the parser gets and must stay ASCII; this is only
   ever for showing it back to the reader in a readout or a caption. The two are
   NOT interchangeable — never feed the result of this to parse(). Caret
   exponents are left alone because supify() turns them into real superscripts
   downstream, which is also why this must not be applied inside a tag.

   Every hyphen in an expression is a minus sign, so they all become U+2212;
   there are no identifiers with hyphens in them and no entity that esc() emits
   contains one. */
function pkPretty(src){
  return esc(String(src == null ? '' : src))
    .replace(/\bsqrt\(/g, '√(')
    .replace(/\bcbrt\(/g, '∛(')
    .replace(/\bpi\b/g, 'π')
    .replace(/\btau\b/g, 'τ')
    .replace(/\btheta\b/g, 'θ')
    .replace(/\balpha\b/g, 'α')
    .replace(/\bbeta\b/g, 'β')
    .replace(/\bomega\b/g, 'ω')
    .replace(/\*/g, '·')
    .replace(/-/g, '−');
}
function pkCompile(src, fallback){
  const hit = PK_SRC_CACHE.get(src);
  if(hit) return hit;
  let f;
  try { const g = compile(parse(String(src))); f = (x, y, z) => g(x, y || 0, z || 0); }
  catch(e){ f = fallback || (() => NaN); }
  if(PK_SRC_CACHE.size > 64) PK_SRC_CACHE.clear();
  PK_SRC_CACHE.set(src, f);
  return f;
}

/* Compile one slot, guarded: a stage must never be taken down by a formula. */
function pkFn(st, id, k, fallback){
  const own = st['own_' + id];
  try { const g = compile(parse(own && own[k])); return (x, y, z) => g(x, y || 0, z || 0); }
  catch(e){ return fallback || (() => 0); }
}

/* ---------------------------------------------------------------- shared ---- */
/* The control block a stage shows above a sketch pad: choose a preset, type a
   formula, or draw. Presented together because they are the same choice. */
function skControls(ids, sk, presets){
  return ctSeg(ids + 'p', sk.src, presets.map(p => [p[0], p[1]])) +
    fnHtml(ids + 'f', 'or type', sk.src || '', 'x') +
    `<div class="row wrap">${ctBtn(ids + 'c', 'clear')}
      <span class="help">…or <b>drag on the strip</b> to draw the curve yourself.</span></div>`;
}
