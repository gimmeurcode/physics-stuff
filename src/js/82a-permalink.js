/* ============================================================================
   6d · THE PERMALINK — the view a reader is looking at, written into the URL

   "Open this link and look at what happens at β = 0.99" is how a laboratory
   gets used for teaching, and until now there was no way to say it: the app had
   zero uses of location.hash, so every one of the 593 experiments lived at the
   same address and every control returned to its default on reload.

   THE SHAPE OF A LINK

       …/vector-calculus.html#w=relativity&d=1.2&c.rlBeta=0.99

   `w` is the wing, `d` is the demo as group.item, and each `c.<id>` is one
   control that the reader has moved away from what the demo opened with.

   WHY A DIFF AND NOT A SNAPSHOT. The baseline is captured the instant a demo
   finishes loading, and only controls that differ from it are written down.
   That keeps a link to one changed slider short enough to paste into a message,
   but the real reason is durability: a link says "β = 0.99 on this experiment",
   not "here are the forty values that happened to be on screen". When a later
   build changes an unrelated default the link still means what its author
   meant, and nothing has to be versioned.

   WHY THE ADDRESS BAR TRACKS ONLY THE WING AND THE DEMO. Controls are not
   written to the URL as they move. A stage refreshes four times a second, and
   several browsers throttle history writes; more to the point, a URL that
   rewrites itself under the reader is not something anyone can copy with
   confidence. The address bar follows navigation, and **Copy link** is what
   captures the controls — at the moment the reader asks for it, which is the
   moment they are looking at what they want to share.

   WHAT IS DELIBERATELY NOT ENCODED. The View panel (`#pvPanel`) — pan, zoom and
   the four range boxes. Those describe whichever plot the reader last touched,
   and `PV_FOCUS` is null until a pointer has touched one, so there is no stable
   identity for a link to name: restoring them would set a window on an
   arbitrary plot, which is the wrong-but-valid failure this repository keeps
   finding. The theme is not encoded either — it is the viewer's preference, not
   the author's, and the artifact host sets it.

   RESTORING IS DONE BY DRIVING THE REAL CONTROLS, never by writing into `ST`.
   A segmented button is clicked and a box is given the event its own wiring
   listens for, so a restored view goes through exactly the code a reader's
   hands would. Nothing here knows what any stage means by any of its controls,
   which is what makes it work for all 178 of them without touching one.
   ============================================================================ */

/* The View panel is excluded wholesale — see the header. */
const PL_SKIP = '#pvPanel';

/* Controls that say how the reader GOT somewhere rather than where they are.

   `ddAng` swings û around a plane that refreshDirPanel() recomputes from û
   itself, and resets the slider to 0 every time it does. So the angle and the
   three û boxes are two descriptions of one direction, and restoring both means
   each undoing the other for as many passes as they are given — measured, in
   the run that put this list here. û is the state and the angle is the device
   that moves it, so the angle is dropped and nothing is lost: du/dv/dw pin the
   direction exactly. */
const PL_SKIP_IDS = { ddAng:1 };

let PL_READY = false;   /* nothing is written to the URL until the first restore
                           has run: boot()'s own applyDemo('0.0') would
                           otherwise stamp the address bar before the link the
                           reader actually followed has been read */
let PL_QUIET = false;   /* set while restoring, so the intermediate states a
                           restore passes through are not written back */
let PL_BASE  = {};      /* control values as the demo opened — the diff baseline */
let PL_KEY   = '';      /* the demo key currently applied, as group.item */

/* ---------------------------------------------------------------- reading ---- */

/* Where a restorable control can live: the dock holds the stage's own panel and
   the field pipeline's panels alike, and the view switch sits in the header. One
   walk covers both pipelines, so the 85 field experiments need no special case. */
function plRoots(){
  return [$('dock'), $('viewSeg')].filter(Boolean);
}

/* A slider's exact-value box, or null — and `.sldnum` is the whole test.

   `ctlSlider` emits `<id>` and `<id>n` together and `wireSlider` commits the
   box on **blur**; that pairing is the contract, and the class is what declares
   it. Matching on the name alone is not the same thing and was wrong: the probe
   panel hand-builds `pbx` beside `pbxn`, which is an ordinary `.num` box
   committing on **change**. Treating it as a slider box sent it a blur nothing
   was listening for, so the probe never moved — and because the value had still
   been written into the box, every control compared equal afterwards. The
   directional derivative printed from the probe was the only thing that knew,
   which is exactly why ./auditlink.ps1 reads the dock's text as well. */
function plExactBox(range){
  const box = $(range.id + 'n');
  return (box && box.classList && box.classList.contains('sldnum')) ? box : null;
}

/* The value of one control, as the string a URL will carry — or null for
   anything with no state worth restoring (buttons, labels, containers).

   The `.sldnum` box beside every slider is where the exact value lives: a typed
   entry is deliberately not bounded by the track's min/max (the thumb pins, the
   stage uses what was asked for), so reading the range input would quietly round
   a reader's 12 000 back to the slider's 100. */
function plValueOf(el){
  if(el.classList && el.classList.contains('seg')){
    const on = el.querySelector('button[aria-pressed="true"]');
    if(!on) return null;
    /* most segmented controls carry data-v; the field mode switch predates that
       convention and carries data-mode */
    const v = on.dataset.v !== undefined ? on.dataset.v : on.dataset.mode;
    return v === undefined ? null : String(v);
  }
  const tag = el.tagName;
  if(tag === 'TEXTAREA' || tag === 'SELECT') return el.value;
  if(tag !== 'INPUT') return null;
  if(el.type === 'checkbox') return el.checked ? '1' : '0';
  if(el.type === 'range'){
    const box = plExactBox(el);
    return box ? box.value : el.value;
  }
  if(el.classList.contains('sldnum')) return null;   /* read through its slider */
  if(el.type === 'button' || el.type === 'submit') return null;
  return el.value;
}

/* Every restorable control now on screen, keyed by element id — the one name a
   stage and a URL can both refer to. */
function plRead(){
  const out = {};
  for(const root of plRoots()){
    if(root.closest && root.closest(PL_SKIP)) continue;
    const all = [root].concat([...root.querySelectorAll('[id]')]);
    for(const el of all){
      if(!el.id || PL_SKIP_IDS[el.id]) continue;
      if(el.closest && el.closest(PL_SKIP)) continue;
      const v = plValueOf(el);
      if(v !== null) out[el.id] = v;
    }
    /* matrix editors, whose cells are addressed by position rather than by id */
    for(const t of root.querySelectorAll('table.mxed[id]')){
      if(t.closest && t.closest(PL_SKIP)) continue;
      for(const cell of t.querySelectorAll('input.mxc'))
        out[t.id + '.' + cell.dataset.i + '.' + cell.dataset.j] = cell.value;
    }
  }
  return out;
}

/* ---------------------------------------------------------------- writing ---- */

/* Setting a control is deliberately TWO steps — assign, then notify — because
   several controls are read as a group by one handler (see plApply). Segmented
   controls are the exception: their state lives in the pressed attribute and
   the only honest way to set one is to click it. */

/* A matrix cell's key: the editor's table id, then the row and column it
   declares. The cells themselves carry no id — mxHtml identifies them by
   `data-i`/`data-j` inside a table that does — so without this the reader's own
   matrix, which is the entire point of the three linear-algebra wings, was the
   one thing a link could not carry. */
const PL_CELL = /^(.+)\.(\d+)\.(\d+)$/;

/* A control this module is willing to touch, or null. */
function plEl(id){
  if(PL_SKIP_IDS[id]) return null;
  const m = PL_CELL.exec(id);
  if(m){
    const t = document.getElementById(m[1]);
    if(!t || !t.classList.contains('mxed')) return null;
    const cell = t.querySelector('input.mxc[data-i="' + m[2] + '"][data-j="' + m[3] + '"]');
    if(!cell || (cell.closest && cell.closest(PL_SKIP))) return null;
    return cell;
  }
  const el = document.getElementById(id);
  if(!el) return null;
  if(el.closest && el.closest(PL_SKIP)) return null;
  return el;
}

/* Assign, telling nothing. Returns whether anything actually moved. */
function plSet(id, val){
  const el = plEl(id);
  if(!el || (el.classList && el.classList.contains('seg'))) return false;
  if(el.type === 'checkbox'){
    const on = (val === '1');
    if(el.checked === on) return false;
    el.checked = on;
    return true;
  }
  /* a ctlSlider's exact value lives in its typed box, which is also the only
     way to ask for one outside the track's range */
  const box = (el.type === 'range') ? plExactBox(el) : null;
  const target = box || el;
  if(target.value === String(val)) return false;
  target.value = val;
  return true;
}

/* Send the event this control's own wiring listens for. They are not the same
   event: ctWireChk and fnWire listen for `change`, a bare range for `input`,
   and wireSlider's typed box commits on **blur** — it has no change listener at
   all, because a box that committed on every keystroke would fight the reader
   mid-number. */
function plNotify(id){
  const el = plEl(id);
  if(!el) return;
  /* mxWire listens for `input` on each cell, not `change` */
  if(el.classList && el.classList.contains('mxc')){
    el.dispatchEvent(new Event('input'));
    return;
  }
  if(el.type === 'range'){
    const box = plExactBox(el);
    if(box) box.dispatchEvent(new Event('blur'));
    else el.dispatchEvent(new Event('input'));
    return;
  }
  el.dispatchEvent(new Event('change'));
}

/* Set one control outright, the way a reader would. Used for segmented
   controls, where a click is the only route, and as the single-shot form. */
function plWrite(id, val){
  const el = plEl(id);
  if(!el) return false;
  if(el.classList && el.classList.contains('seg')){
    for(const b of el.children){
      const bv = b.dataset.v !== undefined ? b.dataset.v : b.dataset.mode;
      if(String(bv) !== String(val)) continue;
      if(b.getAttribute('aria-pressed') === 'true') return false;
      b.click();
      return true;
    }
    return false;
  }
  if(!plSet(id, val)) return false;
  plNotify(id);
  return true;
}

/* Apply a whole set of controls.

   THREE THINGS MAKE THIS HARDER THAN A LOOP, and each was measured by
   ./auditlink.ps1 rather than guessed at.

   1. Applying one control can rebuild the entire panel. ctWireSeg calls
      buildStagePanel(), and so does fnWire the moment an expression parses,
      which destroys every element a caller might have held and can reveal
      controls that did not exist a moment ago — the "type your own" boxes
      appear only once the picker is on `custom`. So nothing is cached: each
      pass re-queries by id, and the passes repeat until one changes nothing.

   2. Some controls are one quantity wearing three boxes. û is `du`, `dv`, `dw`
      and n̂ is `cnx`, `cny`, `cnz`, and each of those handlers reads all three
      boxes and re-normalises — so setting them one at a time, event and all,
      walks the vector somewhere neither the link nor the reader asked for.
      Hence two phases: every value is assigned first, and only then are the
      events sent. A coupled group is correct after the first event because by
      then all three boxes already hold what the link said; an independent
      control cannot tell the difference.

   3. A control can switch another one off on purpose. Dragging `igFx`,
      `mvLgt` or `ftWF` stops the sweep those stages animate, because you cannot
      hand-place a marker that is moving; the same slider clears the checkbox's
      own `checked` as it goes. The coupling runs one way only, so toggles are
      applied last, and whatever is still wrong afterwards is put right by the
      NEXT PASS rather than by re-asserting inside this one.

      That distinction was itself a finding. Re-asserting each value immediately
      before its event looks like the obvious repair, and it breaks (2): the
      first member of a coupled group to be notified rewrites all three boxes to
      the normalised vector, so re-asserting the second member's raw target and
      normalising again walks û somewhere else entirely. The controls still
      compared equal — they are rounded for display — while the directional
      derivative printed beside them moved by 17%. Only the second route in
      ./auditlink.ps1, which reads what the stage PRINTS rather than what its
      boxes hold, could see it.

   The pass cap is there so two controls that reset each other cannot spin. */
function plApply(vals){
  const ids = Object.keys(vals || {});
  if(!ids.length) return;
  for(let pass = 0; pass < 4; pass++){
    /* re-sorted every pass, because which ids are segs depends on a DOM that
       the previous pass may have rebuilt */
    const segs = [], values = [], toggles = [];
    for(const id of ids){
      const el = plEl(id);
      if(!el) continue;
      if(el.classList && el.classList.contains('seg')) segs.push(id);
      else if(el.type === 'checkbox') toggles.push(id);
      else values.push(id);
    }
    let moved = 0;
    for(const id of segs) if(plWrite(id, vals[id])) moved++;
    const rest = values.concat(toggles);
    const changed = [];
    for(const id of rest)                        // phase 1: assign, tell nothing
      if(plSet(id, vals[id])) changed.push(id);
    for(const id of changed){                    // phase 2: re-assert, then notify
      /* Re-asserted because an earlier notify in this same pass may have
         overwritten it: moving the probe runs refreshDirPanel(), which rewrites
         all three û boxes from the û it finds — so û was assigned, wiped by the
         probe, and then read back at its default. The re-assert is safe for a
         coupled group only because those boxes now carry eight figures: at the
         four they used to carry, re-asserting a raw target over the normalised
         value the group had just written walked the vector somewhere else. */
      plSet(id, vals[id]);
      plNotify(id);
    }
    moved += changed.length;
    if(!moved) return;
  }
}

/* ------------------------------------------------------------- the string ---- */

function plEncode(){
  const parts = [];
  const home = $('home') && $('home').classList.contains('open');
  if(home) return '#w=home';
  parts.push('w=' + encodeURIComponent(WING));
  if(PL_KEY) parts.push('d=' + encodeURIComponent(PL_KEY));
  const now = plRead();
  for(const id of Object.keys(now)){
    if(PL_BASE[id] === now[id]) continue;
    parts.push('c.' + encodeURIComponent(id) + '=' + encodeURIComponent(now[id]));
  }
  return '#' + parts.join('&');
}

/* A hash a reader may have edited, truncated or had mangled by a chat client.
   decodeURIComponent throws on a stray percent sign, and a bad link must land
   the reader somewhere sensible rather than take the laboratory down. */
function plParse(hash){
  let h = String(hash || '');
  if(h.charAt(0) === '#') h = h.slice(1);
  if(!h) return null;
  const out = { w:'', d:'', c:{} };
  for(const pair of h.split('&')){
    if(!pair) continue;
    const i = pair.indexOf('=');
    let k = i < 0 ? pair : pair.slice(0, i);
    let v = i < 0 ? '' : pair.slice(i + 1);
    try { k = decodeURIComponent(k); v = decodeURIComponent(v); }
    catch(err){ continue; }        /* one unreadable pair, not a broken link */
    if(k === 'w') out.w = v;
    else if(k === 'd') out.d = v;
    else if(k.slice(0, 2) === 'c.' && k.length > 2) out.c[k.slice(2)] = v;
  }
  return out.w ? out : null;
}

function plUrl(){
  return String(location.href).split('#')[0] + plEncode();
}

/* Keep the address bar in step, without adding a history entry for every demo:
   replaceState leaves Back where the reader expects it — on whatever page they
   came from — and, unlike assigning location.hash, it fires no hashchange, so
   the restore path can never be re-entered by our own write.

   A published artifact runs in a sandboxed frame whose origin is opaque, and
   replaceState throws there. That is not a failure worth reporting: the reader's
   own Copy link button still builds the correct string. */
function plSave(){
  if(!PL_READY || PL_QUIET) return;
  try { history.replaceState(null, '', plUrl()); }
  catch(err){ /* opaque origin — see above */ }
}

/* Called at the end of every demo application, from applyDemo() in 80a. This is
   where the diff baseline comes from: the panel has been built and wired by
   now, so wireSlider's show() has already filled every typed box. */
function plAfterDemo(key){
  PL_KEY = key;
  PL_BASE = plRead();
  plSave();
}

/* ------------------------------------------------------------- navigating ---- */

function plDemoAt(key){
  const m = /^(\d+)\.(\d+)$/.exec(String(key || ''));
  if(!m) return null;
  const grp = DEMOS && DEMOS[+m[1]];
  const it = grp && grp.items && grp.items[+m[2]];
  return it || null;
}

/* Follow a parsed link. Returns false if it named a wing that does not exist,
   so a stale link falls back to the home overview rather than a blank page. */
function plGo(L){
  if(!L) return false;
  if(L.w === 'home'){ setWing('home'); return true; }
  if(!WINGS[L.w]) return false;
  let missing = false;
  PL_QUIET = true;
  try {
    /* force, so a link into the wing already on screen still reloads its demo
       rather than being taken for a no-op */
    setWing(L.w, true);
    if(L.d){
      if(plDemoAt(L.d)) applyDemo(L.d);
      else missing = true;   /* an experiment has been renumbered under the link */
    }
    /* THE TARGET IS THE DEMO'S OWN DEFAULTS WITH THE LINK'S OVERRIDES ON TOP,
       not the overrides alone.

       The URL carries only the difference, which is what keeps it short and
       durable — but the difference is not enough to restore by. Restoring one
       control can knock another OFF its default on purpose: moving `igFx`,
       `mvLgt` or `ftWF` stops the sweep those stages animate. If the reader had
       that sweep running — its default — the link records no override for it,
       and applying the overrides alone leaves it switched off by the very
       control the link did restore. Twenty-five experiments came back that way.

       applyDemo() has just refreshed PL_BASE for this demo, so the full state
       the link describes is exactly the baseline with the overrides merged in,
       and plSet's own equality check means the controls that were already right
       cost nothing and send no events. */
    plApply(Object.assign({}, PL_BASE, L.c));

    /* Re-seed what the controls seed. applyDemo() ends with descReset() and
       conReset() because both take their starting point from the probe — and a
       link moves the probe AFTERWARDS, so without this the gradient-descent
       walker starts from the demo's default position while the probe it is
       supposed to have started from sits somewhere else. Whether it looked
       right depended on whether the reader had happened to touch a descent
       control, which is exactly the kind of path dependence a permalink is
       supposed to remove. Stages own their own state and are not touched. */
    if(!stageActive()){
      descReset();
      if(S.con.on) conReset();
      refreshAll();
      /* refreshAll() does not reach the optimizer panel, and the walker's
         position is printed there — reset without repainting left the panel
         quoting where the walker used to be */
      refreshDescPanel();
    }
  } finally {
    PL_QUIET = false;
  }
  /* normalise the address bar to what actually loaded, which is how a reader
     finds out that a link resolved to something slightly different */
  plSave();
  if(missing)
    plToast('That experiment has moved. This is the wing it was in — ' +
            'the list on the right has its current position.');
  return true;
}

/* ------------------------------------------------------------------ copying -- */

/* The async clipboard needs a secure context, which a file:// page and a
   sandboxed artifact frame are not. The old execCommand path still works in
   both, so it is the fallback rather than the dead letter it is usually called. */
function plCopyText(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch(err){ ok = false; }
  document.body.removeChild(ta);
  return ok;
}

function plCopy(){
  const url = plUrl();
  /* write it to the address bar as well, so what was copied and what the reader
     is looking at are the same string */
  const was = PL_READY; PL_READY = true; plSave(); PL_READY = was;
  const done = () => plToast('Link copied. It opens this experiment with the controls exactly as they are now.');
  const manual = () => plToastCopy(url);
  let async = null;
  try {
    if(navigator.clipboard && navigator.clipboard.writeText)
      async = navigator.clipboard.writeText(url);
  } catch(err){ async = null; }
  if(async && async.then){
    async.then(done, () => { if(plCopyText(url)) done(); else manual(); });
    return;
  }
  if(plCopyText(url)) done(); else manual();
}

/* --------------------------------------------------------------- the toast --- */

let PL_TOAST_T = 0;

function plToast(msg){
  const t = $('toast');
  if(!t) return;
  t.innerHTML = '<div class="toast-msg">' + esc(msg) + '</div>';
  t.hidden = false;
  clearTimeout(PL_TOAST_T);
  PL_TOAST_T = setTimeout(() => { t.hidden = true; t.innerHTML = ''; }, 4200);
}

/* When the clipboard is refused there is still a right answer: show the reader
   the link, selected, so one keystroke takes it. Failing silently would leave
   them believing they had copied something. */
function plToastCopy(url){
  const t = $('toast');
  if(!t) return;
  t.innerHTML = '<div class="toast-msg">This browser would not let the page reach the clipboard. ' +
                'Here is the link — it is selected, so Ctrl/⌘ C will take it.</div>' +
                '<input class="toast-url" id="toastUrl" readonly spellcheck="false" value="' + esc(url) + '">';
  t.hidden = false;
  const box = $('toastUrl');
  if(box){ box.focus(); box.select(); }
  clearTimeout(PL_TOAST_T);
  PL_TOAST_T = setTimeout(() => { t.hidden = true; t.innerHTML = ''; }, 20000);
}

/* ------------------------------------------------------------------- boot ---- */

function plInit(){
  const b = $('btnLink');
  if(b) b.addEventListener('click', plCopy);

  /* A hash arriving after load is a reader pasting a link into the tab they
     already have open. Our own writes go through replaceState, which fires no
     hashchange, so anything reaching here came from outside. */
  window.addEventListener('hashchange', () => {
    if(PL_QUIET) return;
    const L = plParse(location.hash);
    if(L) plGo(L);
  });

  const L = plParse(location.hash);
  PL_READY = true;
  if(L && !plGo(L))
    plToast('That link names a wing this laboratory does not have. Here is the overview instead.');
}
