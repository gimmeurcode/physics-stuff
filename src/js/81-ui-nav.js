/* ============================================================================
   6a · NAVIGATION — wing menus, command palette, responsive panes

   Twenty wings holding ~309 guided experiments is more than a row of buttons
   can address. Three mechanisms cover it:
     · four grouped dropdown menus, each describing what its wings contain;
     · a command palette (Ctrl/⌘K) that searches wings AND every experiment;
     · a pane switcher that appears only when the three panes cannot fit.

   #wingNav still contains every button[data-w], so markWingNav() in
   82-ui-wings.js and the boot wiring keep working without knowing about menus.
   ============================================================================ */

/* Which dropdown holds which wing — drives the "you are here" highlight.
   Written in reading order: the menus run left to right in the order a reader
   should meet them, and the wings inside each menu run in the order they build
   on one another, so every wing's prerequisites are above it in this table.
   `smoke.ps1` checks this table against the menu markup in shell.html and
   against the home cards, because all three drifted apart once already — the
   home page was still listing thirty-one wings with one of them twice. */
const NAV_GROUP_OF = {
  proof:'pre', algebra:'pre', functions:'pre', trig:'pre', cnum:'pre',
  limits:'calc', deriv:'calc', integral:'calc', series:'calc', ode:'calc',
  linsys:'lin', vecspace:'lin', eigen:'lin', discrete:'lin', prob:'lin', numer:'lin',
  laplace:'deq', systems:'deq', phase:'deq',
  vectors:'mv', curves:'mv', partial:'mv', coords:'mv', vector:'mv', forms:'mv', potential:'mv',
  units:'phys',
  mechanics:'phys', rotation:'phys', rotenergy:'phys', waves:'phys', fluids:'phys',
  thermo:'phys', em:'phys', circuit:'phys', optics:'phys', relativity:'phys',
  complex:'mod', fourier:'mod', signal:'mod', quantum:'mod', statmech:'mod', solid:'mod',
  atom:'mod', nuclear:'mod', string:'mod'
};

/* ---- dropdown menus ---- */
function closeAllMenus(except){
  for(const g of document.querySelectorAll('.navgroup')){
    if(g === except) continue;
    g.classList.remove('open');
    const t = g.querySelector('.navgrp');
    if(t) t.setAttribute('aria-expanded','false');
  }
}

function markNavGroup(wing){
  const g = NAV_GROUP_OF[wing];
  for(const el of document.querySelectorAll('.navgroup'))
    el.classList.toggle('active', el.dataset.g === g);
  const home = document.querySelector('.navhome');
  if(home) home.setAttribute('aria-pressed', String(wing === 'home'));
}

function wireWingMenus(){
  for(const group of document.querySelectorAll('.navgroup')){
    const trigger = group.querySelector('.navgrp');
    if(!trigger) continue;
    trigger.addEventListener('click', ev => {
      ev.stopPropagation();
      const open = group.classList.contains('open');
      closeAllMenus();
      if(!open){
        group.classList.add('open');
        trigger.setAttribute('aria-expanded','true');
        const first = group.querySelector('.menupanel button');
        if(first) first.focus();
      }
    });
    /* a menu closes as soon as one of its wings is chosen */
    for(const b of group.querySelectorAll('.menupanel button'))
      b.addEventListener('click', () => closeAllMenus());

    group.addEventListener('keydown', ev => {
      const items = [...group.querySelectorAll('.menupanel button')];
      const i = items.indexOf(document.activeElement);
      if(ev.key === 'ArrowDown' && items.length){
        ev.preventDefault();
        (items[i + 1] || items[0]).focus();
        if(!group.classList.contains('open')){ group.classList.add('open'); trigger.setAttribute('aria-expanded','true'); }
      } else if(ev.key === 'ArrowUp' && items.length){
        ev.preventDefault();
        (items[i - 1] || items[items.length - 1]).focus();
      } else if(ev.key === 'Escape'){
        closeAllMenus(); trigger.focus();
      }
    });
  }
  document.addEventListener('click', ev => {
    if(!ev.target.closest('.navgroup')) closeAllMenus();
  });
}

/* ============================================================================
   COMMAND PALETTE
   ============================================================================ */
let PAL = { items:[], shown:[], sel:0, built:false };

/* Apostrophes and dashes are where a typed query and a printed title disagree
   most often ("greens" vs "Green's"), so both sides are flattened before
   matching. Accents are folded too, because the names worth searching for are
   full of them - L'Hôpital, Schrödinger, Ampère - and nobody types them. */
const palNorm = s => s.toLowerCase().normalize('NFD')
  .replace(new RegExp('[\u0300-\u036f]', 'g'), '')
  .replace(/['’`–—-]/g, '');

/* Built once, lazily: WINGS is only fully populated after every demo module
   has run, and the palette is not needed until the user asks for it. */
function buildPaletteIndex(){
  const out = [];
  for(const w of Object.keys(WINGS)){
    const W = WINGS[w];
    out.push({ kind:'wing', wing:w, glyph:W.glyph, name:W.title, where:W.sub, hay:(W.title + ' ' + W.sub + ' ' + w).toLowerCase() });
  }
  for(const w of Object.keys(WINGS)){
    const W = WINGS[w];
    (W.groups || []).forEach((grp, gi) => {
      (grp.items || []).forEach((it, ii) => {
        const name = it.n || '';
        /* The outcome and commentary are indexed too, so a search for a term
           that names a concept rather than a demo — "carnot", "hessian" —
           still finds the experiment that demonstrates it. Tags are stripped
           because the prose is HTML. */
        const prose = ((it.out || '') + ' ' + (it.note || '')).replace(/<[^>]*>/g, ' ');
        out.push({
          kind:'demo', wing:w, key:gi + '.' + ii, glyph:W.glyph,
          name, where: W.title + ' · ' + grp.g,
          hay: (name + ' ' + (it.ex || '') + ' ' + grp.g + ' ' + W.title + ' ' + prose).toLowerCase()
        });
      });
    });
  }
  /* normalise once, not on every keystroke: the haystacks include demo prose
     and there are 329 of them */
  for(const it of out){
    it.nameN = palNorm(it.name);
    it.hayN  = palNorm(it.hay);
    it.nameT = it.nameN.replace(/\s+/g, '');
    it.hayT  = it.hayN.replace(/\s+/g, '');
  }
  PAL.items = out;
  PAL.built = true;
}

/* subsequence match — every query character must appear in order. This is only
   a last resort: over a long haystack it matches almost anything, which is what
   made "carnot" return a polar-integration demo and "bohr" return basins. */
function palSeq(hay, q){
  let hi = 0, score = 0, run = 0;
  for(let qi = 0; qi < q.length; qi++){
    let found = -1;
    for(let i = hi; i < hay.length; i++){ if(hay[i] === q[qi]){ found = i; break; } }
    if(found < 0) return null;
    if(found === hi && qi > 0){ run++; score += 4 + run; } else { run = 0; }
    if(found === 0 || hay[found - 1] === ' ') score += 6;
    hi = found + 1;
  }
  return score - hay.length * 0.02;
}

/* Ranking is tiered, strongest evidence first. A contiguous hit in the item's
   own name beats anything found in its surrounding context, so a demo actually
   called "Carnot…" always outranks one that merely sits in a wing whose text
   happens to contain those letters in order. */
function palRank(it, q, qt){
  const name = it.nameN, ctx = it.hayN;

  const at = name.indexOf(q);
  if(at >= 0){
    let s = 1000 - at * 1.5 - name.length * 0.06;
    if(at === 0 || name[at - 1] === ' ') s += 70;      // starts a word
    return { score:s, exact:true };
  }
  /* whitespace-insensitive retry, so a typed "which path" still finds a demo
     printed as "which-path" */
  if(qt !== q && it.nameT.indexOf(qt) >= 0) return { score:900, exact:true };

  const cat = ctx.indexOf(q);
  if(cat >= 0) return { score:520 - Math.min(cat, 200) * 0.4, exact:false };
  if(qt !== q && it.hayT.indexOf(qt) >= 0) return { score:470, exact:false };

  const sn = palSeq(name, q);
  if(sn !== null) return { score:240 + sn, exact:false };

  const sc = palSeq(ctx, q);
  if(sc !== null) return { score:Math.max(1, sc * 0.35), exact:false };
  return null;
}

/* Highlight only a genuine substring hit. Mapping scattered subsequence
   positions back through HTML escaping is where this kind of code goes wrong,
   and a missing highlight is a far smaller failure than a broken one. */
function palHighlight(text, q){
  if(!q) return esc(text);
  const norm = palNorm(text);
  const at = norm.indexOf(q);
  if(at < 0 || norm.length !== text.length) return esc(text);
  return esc(text.slice(0, at)) + '<mark>' + esc(text.slice(at, at + q.length)) +
         '</mark>' + esc(text.slice(at + q.length));
}

function palFilter(q){
  const query = palNorm(q.trim());
  if(!query){
    /* with no query, offer the wings themselves — the useful default */
    return PAL.items.filter(it => it.kind === 'wing').map(it => ({ it, q:'' }));
  }
  const tight = query.replace(/\s+/g, '');
  const scored = [];
  for(const it of PAL.items){
    const m = palRank(it, query, tight);
    if(!m) continue;
    /* a wing is the broader answer, but only nudge it ahead when its own name
       matched — otherwise a wing would outrank the demo the user asked for */
    scored.push({ it, q:query, score:m.score + (it.kind === 'wing' && m.exact ? 40 : 0) });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 60);
}

function renderPalette(){
  const list = $('palList');
  const rows = PAL.shown;
  if(!rows.length){
    list.innerHTML = '<div class="palette-empty">Nothing matches that.</div>';
    $('palCount').textContent = '';
    return;
  }
  let html = '', lastKind = '';
  rows.forEach((r, i) => {
    const it = r.it;
    if(it.kind !== lastKind){
      html += '<div class="pgrp">' + (it.kind === 'wing' ? 'Wings' : 'Guided experiments') + '</div>';
      lastKind = it.kind;
    }
    html += '<button class="pitem' + (i === PAL.sel ? ' sel' : '') + '" data-i="' + i + '" role="option"' +
            ' aria-selected="' + (i === PAL.sel) + '">' +
            '<span class="pg">' + esc(it.glyph) + '</span>' +
            '<span class="pmain"><span class="pname">' + palHighlight(it.name, r.q) + '</span>' +
            '<span class="pwhere">' + esc(it.where || '') + '</span></span>' +
            '<span class="pkind">' + (it.kind === 'wing' ? 'wing' : 'demo') + '</span></button>';
  });
  list.innerHTML = html;
  $('palCount').textContent = rows.length + (rows.length === 1 ? ' result' : ' results');
  for(const b of list.querySelectorAll('.pitem'))
    b.addEventListener('click', () => palChoose(+b.dataset.i));
}

function palMove(d){
  if(!PAL.shown.length) return;
  PAL.sel = (PAL.sel + d + PAL.shown.length) % PAL.shown.length;
  renderPalette();
  const el = $('palList').querySelector('.pitem.sel');
  if(el) el.scrollIntoView({ block:'nearest' });
}

function palChoose(i){
  const r = PAL.shown[i];
  if(!r) return;
  const it = r.it;
  closePalette();
  setWing(it.wing);
  if(it.kind === 'demo'){
    applyDemo(it.key);
    /* reveal it in the experiments list so the surrounding context is visible */
    const btn = $('demoList').querySelector('button[data-d="' + it.key + '"]');
    if(btn){
      const grp = btn.closest('details');
      if(grp) grp.open = true;
      btn.scrollIntoView({ block:'center' });
    }
  }
  markNavGroup(it.wing);
}

function openPalette(){
  if(!PAL.built) buildPaletteIndex();
  closeAllMenus();
  $('palette').classList.add('open');
  const inp = $('palInput');
  inp.value = '';
  PAL.shown = palFilter('');
  PAL.sel = 0;
  renderPalette();
  inp.focus();
}
function closePalette(){ $('palette').classList.remove('open'); }
function paletteOpen(){ return $('palette').classList.contains('open'); }

function wirePalette(){
  $('btnPalette').addEventListener('click', openPalette);
  const inp = $('palInput');
  inp.addEventListener('input', () => {
    PAL.shown = palFilter(inp.value);
    PAL.sel = 0;
    renderPalette();
  });
  inp.addEventListener('keydown', ev => {
    if(ev.key === 'ArrowDown'){ ev.preventDefault(); palMove(1); }
    else if(ev.key === 'ArrowUp'){ ev.preventDefault(); palMove(-1); }
    else if(ev.key === 'Enter'){ ev.preventDefault(); palChoose(PAL.sel); }
    else if(ev.key === 'Escape'){ ev.preventDefault(); closePalette(); }
  });
  $('palette').addEventListener('click', ev => { if(ev.target === $('palette')) closePalette(); });

  /* ⌘K on a Mac, Ctrl+K everywhere else; "/" as a bare shortcut when the focus
     is not already inside a text field */
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  $('palKbd').textContent = mac ? '⌘K' : 'Ctrl K';
  document.addEventListener('keydown', ev => {
    const key = (ev.key || '').toLowerCase();
    if(key === 'k' && (ev.metaKey || ev.ctrlKey)){
      ev.preventDefault();
      paletteOpen() ? closePalette() : openPalette();
      return;
    }
    if(key === '/' && !paletteOpen()){
      const t = ev.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if(!typing){ ev.preventDefault(); openPalette(); }
    }
  });
}

/* ============================================================================
   RESPONSIVE PANES
   On a phone the three panes stack and one shows at a time; on a tablet only
   the experiments rail slides over. Both are driven from the same bar.
   ============================================================================ */
function setPane(name){
  const app = $('app');
  app.dataset.pane = name;
  app.classList.toggle('rail-open', name === 'rail');
  for(const b of $('paneBar').querySelectorAll('button'))
    b.setAttribute('aria-pressed', String(b.dataset.pane === name));
  /* the canvas keeps its own pixel buffer, so any layout change must tell it */
  if(typeof R !== 'undefined' && R && R.resize) requestAnimationFrame(() => R.resize());
}

function wirePanes(){
  for(const b of $('paneBar').querySelectorAll('button'))
    b.addEventListener('click', () => setPane(b.dataset.pane));
  $('railScrim').addEventListener('click', () => setPane('stage'));
  setPane('stage');
}

/* Escape closes whatever is open, outermost first */
function wireNavEscape(){
  document.addEventListener('keydown', ev => {
    if(ev.key !== 'Escape') return;
    if(paletteOpen()){ closePalette(); return; }
    if(document.querySelector('.navgroup.open')){ closeAllMenus(); return; }
    if($('app').classList.contains('rail-open')) setPane('stage');
  });
}
