/* ============================================================================
   6c · FORMAL STATEMENTS — definitions, theorems and their proofs

   The essays were written as continuous prose, which is the right register for
   explaining why a result matters and where it came from. What prose cannot do
   is let a reader point at a thing: cite a hypothesis, check whether a theorem
   applies to the case in front of them, or read the proof rather than a
   description of the proof. Before this module the whole site contained four
   occurrences of the word "proof" and no proofs.

   So the essays keep their prose and gain a formal layer inside it. A card
   states the thing exactly — hypotheses separated from conclusion, because
   nearly every misapplication in a first course is a dropped hypothesis — and
   carries the proof in a fold, so a reader chooses when to open it.

   Numbering is applied at RENDER time by stNumber(), not written into the
   source. The demo groups already work this way (`gnum` in 80a-ui-core.js) for
   the same reason: several essays are assembled from more than one constant,
   and hand-numbering restarts the count halfway through or silently duplicates
   when a statement is inserted.

   Every theorem may name the experiment that demonstrates it via `see:`. That
   is the link the reader actually wants — a theorem and the picture of it are
   one idea, and the site already owns 163 of the pictures.
   ============================================================================ */

/* the equation block used inside a card — same visual language as .eqb in the
   essays, but tighter, because it sits inside an already-indented box */
const stEq = s => `<div class="st-eq mth">${s}</div>`;

/* `see` is "wing:groupIndex.itemIndex" — resolved at click time rather than at
   build time, so a demo may be renumbered without silently breaking the link.
   stSee() reports a bad target instead of doing nothing. */
function stSeeBtn(see, label){
  if(!see) return '';
  return `<div class="st-see"><button type="button" class="st-go" data-see="${see}">` +
         `<span class="st-play">▶</span>${label || 'See it in the laboratory'}</button></div>`;
}

/* A definition. Definitions get their own colour because a reader scanning for
   "what does this word mean" is doing something different from a reader
   scanning for "what may I conclude". */
function stDefn(name, body, o){
  o = o || {};
  return `<div class="stmt st-def" data-kind="Definition">` +
    `<div class="st-h"><span class="st-k">Definition</span><span class="st-n"></span>` +
    `<span class="st-t">${name}</span></div>` +
    `<div class="st-b">${body}</div>` +
    (o.note ? `<p class="st-note">${o.note}</p>` : '') +
    stSeeBtn(o.see, o.seeLabel) + `</div>`;
}

/* A theorem, with the hypotheses split out. `proof` is optional only where a
   proof genuinely belongs to a later subject; when it is omitted, `because`
   must say what is being taken on trust and where the argument lives, so that
   an absent proof is always a stated boundary rather than a silent gap. */
function stThm(name, o){
  o = o || {};
  const kind = o.kind || 'Theorem';
  const body =
    (o.hyp  ? `<div class="st-row"><span class="st-lbl">If</span><div>${o.hyp}</div></div>` : '') +
    (o.then ? `<div class="st-row"><span class="st-lbl">then</span><div>${o.then}</div></div>` : '') +
    (o.eq   ? stEq(o.eq) : '');
  const proof = o.proof
    ? `<details class="st-proof"><summary>Proof</summary><div class="st-pb">${o.proof}` +
      `<span class="st-qed">∎</span></div></details>`
    : (o.because ? `<p class="st-note"><strong>Not proved here.</strong> ${o.because}</p>` : '');
  return `<div class="stmt st-thm" data-kind="${kind}">` +
    `<div class="st-h"><span class="st-k">${kind}</span><span class="st-n"></span>` +
    `<span class="st-t">${name}</span></div>` +
    `<div class="st-b">${body}</div>` + proof +
    (o.note ? `<p class="st-note">${o.note}</p>` : '') +
    stSeeBtn(o.see, o.seeLabel) + `</div>`;
}

/* shorthands for the two other things a formal layer needs */
const stLemma = (name, o) => stThm(name, Object.assign({}, o, { kind:'Lemma' }));
const stCor   = (name, o) => stThm(name, Object.assign({}, o, { kind:'Corollary' }));

/* ---- render-time numbering, per kind, per essay ---- */
function stNumber(host){
  if(!host) return;
  const seen = {};
  host.querySelectorAll('.stmt').forEach(el => {
    const k = el.dataset.kind || 'Theorem';
    seen[k] = (seen[k] || 0) + 1;
    const n = el.querySelector('.st-n');
    if(n) n.textContent = seen[k];
  });
}

/* A `see` target may be an index — `1.4` — or a STAGE ID, which is what the
   newer ones use. The index form is a position in a list, and inserting a demo
   into the middle of a group silently renumbers every link after it: two of the
   electromagnetism statements were pointing at the wrong experiment for a whole
   release because a "write your own charge density" demo had been added above
   them, and nothing complained, because a wrong-but-valid index is
   indistinguishable from a right one. A stage id survives insertion.

   Resolution is by first demo carrying that stage, so `em:emWave` always finds
   the wave experiment wherever it has moved to. An id that matches nothing falls
   through to `applyDemo`, which throws, which the caller reports. */
function stSeeKey(key){
  if(/^\d+\.\d+$/.test(key)) return key;
  if(typeof DEMOS === 'undefined' || !DEMOS) return key;
  for(let g = 0; g < DEMOS.length; g++){
    const items = (DEMOS[g] && DEMOS[g].items) || [];
    for(let i = 0; i < items.length; i++)
      if(items[i] && items[i].stage === key) return g + '.' + i;
  }
  throw new Error('no experiment on this wing uses the stage "' + key + '"');
}

/* ---- "See it" — close the essay and load the experiment ---- */
function stWireSee(host){
  if(!host) return;
  host.querySelectorAll('.st-go').forEach(b => {
    b.addEventListener('click', () => {
      const t = String(b.dataset.see || '');
      const c = t.indexOf(':');
      if(c < 0) return;
      const wing = t.slice(0, c), key = t.slice(c + 1);
      try {
        $('sheet').classList.remove('open');
        if(wing && wing !== WING) setWing(wing, true);
        applyDemo(stSeeKey(key));
      } catch(e){
        /* a renumbered demo must say so rather than appearing to do nothing */
        b.textContent = 'that experiment has moved — ' + (e && e.message || e);
      }
    });
  });
}

/* Every statement a wing declares, for the audit script: it walks the rendered
   essay so it counts what a reader can actually see, not what the source says. */
function stAudit(host){
  const rows = [];
  (host || document).querySelectorAll('.stmt').forEach(el => {
    rows.push({
      kind:  el.dataset.kind,
      title: (el.querySelector('.st-t') || {}).textContent || '',
      proved: !!el.querySelector('.st-proof'),
      declared: !!el.querySelector('.st-note'),
      see:   (el.querySelector('.st-go') || {}).dataset ? el.querySelector('.st-go').dataset.see : ''
    });
  });
  return rows;
}
