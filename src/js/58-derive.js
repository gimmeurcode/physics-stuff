/* ============================================================================
   5a · THE DERIVATION LADDER — from algebra to the result, one line at a time

   A result is not understood because it has been stated. This module lets a
   stage supply the chain that *produces* its result: the definition, the
   algebraic manipulation, the limit or integral actually taken, and the answer
   — with the reader's current numbers substituted at every rung, so the whole
   chain re-evaluates when a slider moves.

   A stage opts in by defining derive(st), returning:

     { title:'…',
       steps:[ { lbl:'the definition', eq:'…', sub:'…' }, … ],
       note:'why this works, or where it stops working' }

   `eq` is typeset markup (the .mth conventions of the theory prose); `sub` is
   the same line with numbers put in. Both are optional per step, so a rung can
   be pure prose where that is what the argument needs.

   Stages without derive() simply do not show the panel, so this can be added
   wing by wing without breaking anything.
   ============================================================================ */

/* one rung. `step()` in 80d-ui-derivation-panel.js renders the same .dstep
   block for the field engine, and this reuses it so the two look identical. */
const drvStep = (lbl, eq, sub) => ({ lbl, eq, sub });

/* a rung that is only prose — for the "why are we allowed to do this" lines
   that carry the actual understanding */
const drvSay = (lbl, prose) => ({ lbl, prose });

/* `{−}` in an equation means a TIGHT operator — a minus with nothing added
   around it, as in f(t{−}τ) or √(l(l{+}1)), where dop() would push the terms
   apart and read as a separate step. Nothing ever converted it, so 68 rungs
   printed the braces. Only a lone operator character is unwrapped: braces with
   real content inside are real mathematics (ℱ{f * g}, set-builder notation) and
   must survive untouched. */
const drvTight = s => String(s).replace(/\{([−+·×±∓])\}/g, '$1');

function drvRender(d){
  if(!d || !d.steps || !d.steps.length) return '';
  const rungs = d.steps.map((s, i) => {
    if(s.prose)
      return `<div class="dstep drv-say"><div class="lbl">${s.lbl || ''}</div>
        <p class="help" style="margin:0">${s.prose}</p></div>`;
    return `<div class="dstep"><div class="lbl"><span class="drv-n">${i + 1}</span>${s.lbl || ''}</div>` +
      (s.eq ? `<div class="eq mth">${drvTight(s.eq)}</div>` : '') +
      (s.sub ? `<div class="subst">${drvTight(s.sub)}</div>` : '') + '</div>';
  }).join('');
  return (d.title ? `<div class="ttl">${d.title}</div>` : '') + rungs +
    (d.note ? `<p class="help">${d.note}</p>` : '');
}

function refreshDerive(){
  const host = $('deriveBody');
  if(!host) return;
  const st = S.stage && STAGES[S.stage];
  let html = '';
  if(st && st.derive && ST){
    try { html = drvRender(st.derive(ST)); }
    catch(e){ html = `<p class="help">the derivation could not be built: ${esc(String(e && e.message || e))}</p>`; }
  }
  uiSetHtml(host, supify(html));
  const sec = $('secDerive2');
  if(sec) sec.style.display = html ? '' : 'none';
}

/* ---------------------------------------------------------------------------
   Small typesetting shorthands, so a derivation reads like mathematics in the
   source too. These are the same conventions the long-form essays use.
   --------------------------------------------------------------------------- */
const dv  = s => `<i>${s}</i>`;                       // a variable
const dfn = s => `<span class="fn">${s}</span>`;      // a function name, upright
const dop = s => `<span class="op">${s}</span>`;      // a spaced operator
const dfrac = (n, d) => `<span class="frac"><span class="nm">${n}</span><span class="den">${d}</span></span>`;
const dlim = (v, to) => `${dfn('lim')}<sub>${v}→${to}</sub> `;
const dnum = v => `<span class="num">${fmtNum(v, 6)}</span>`;
