function buildDisplayPanel(){
  const sliceOpts = S.mode==='scalar'
    ? `<option value="auto">f (the scalar field)</option><option value="div">∇²f (Laplacian)</option><option value="mag">|∇f|</option>`
    : planar()
      ? `<option value="auto">∇·F — 2D divergence</option><option value="curl2">∇×F — scalar curl (vorticity)</option><option value="mag">|F|</option>`
      : `<option value="auto">∇·F (divergence)</option><option value="curln">(∇×F)·n̂ of the slice</option><option value="curl">|∇×F|</option><option value="mag">|F|</option>`;
  $('dispBody').innerHTML = `
    <div class="chkgrid">
      <label class="chk"><input type="checkbox" data-l="arrows"><span>Field arrows</span></label>
      <label class="chk"><input type="checkbox" data-l="fieldlines"><span>Field lines</span></label>
      <label class="chk"><input type="checkbox" data-l="stream"><span>Flow lines</span></label>
      <label class="chk"><input type="checkbox" data-l="slice"><span>Colour slice</span></label>
      <label class="chk"><input type="checkbox" data-l="level"><span>Level sets</span></label>
      <label class="chk"><input type="checkbox" data-l="axes"><span>Axes &amp; grid</span></label>
      <label class="chk"><input type="checkbox" data-l="probe"><span>Probe vectors</span></label>
      <label class="chk"><input type="checkbox" data-l="dirderiv"><span>Directional derivative</span></label>
      <label class="chk" id="lblCurlArrows"><input type="checkbox" data-l="curlarrows"><span>Curl field ∇×F</span></label>
    </div>
    <div class="row"><label class="lb" style="width:74px">Arrow grid</label><input type="range" id="dsN" min="3" max="11" step="1"><span class="val" id="dsNv"></span></div>
    <div class="row"><label class="lb" style="width:74px">Arrow size</label><input type="range" id="dsS" min="0.3" max="2.2" step="0.05"><span class="val" id="dsSv"></span></div>
    <div class="row"><label class="lb" style="width:74px">Length</label>
      <div class="seg" id="dsLen"><button data-m="log">log</button><button data-m="linear">true</button><button data-m="unit">equal</button></div></div>
    <p class="help"><b>log</b> compresses the range so tiny and huge vectors are both visible; <b>true</b> is proportional; <b>equal</b> shows direction only.</p>
    <div class="row"><label class="lb" style="width:74px">Domain</label><input type="range" id="dsL" min="1" max="8" step="0.5"><span class="val" id="dsLv"></span></div>
    <div class="row" id="dsAxRow"><label class="lb" style="width:74px">Slice plane</label>
      <div class="seg" id="dsAx"><button data-a="0">⊥x</button><button data-a="1">⊥y</button><button data-a="2">⊥z</button></div></div>
    <div class="row" id="dsPRow"><label class="lb" style="width:74px">Position</label><input type="range" id="dsP" step="0.02"><span class="val" id="dsPv"></span></div>
    <select class="sel" id="dsOf">${sliceOpts}</select>
    <label class="chk" id="dsNearRow"><input type="checkbox" id="dsNear"><span>Only draw arrows near the slice</span></label>
    <div class="row" id="dsTimeRow" style="display:none"><label class="lb" style="width:74px">Time</label>
      <button class="btn sm" id="dsPlay">Pause</button>
      <input type="range" id="dsSpeed" min="0" max="3" step="0.05"><span class="val" id="dsSpeedV"></span></div>
    <div class="row"><label class="lb" style="width:74px">Level sets</label><input type="range" id="dsLv2" min="2" max="14" step="1"><span class="val" id="dsLv2v"></span></div>
    <div class="row" id="dsHRow"><label class="lb" style="width:74px">Height</label><input type="range" id="dsH" min="0.15" max="2.5" step="0.05"><span class="val" id="dsHv"></span></div>
    <p class="help" id="lvlNote"></p>`;

  for(const c of $('dispBody').querySelectorAll('input[data-l]')){
    c.checked = S.show[c.dataset.l];
    c.addEventListener('change', ()=>{ S.show[c.dataset.l]=c.checked; if(c.dataset.l==='stream'&&c.checked) resetStream(); updateLegend(); });
  }
  const wire=(id,vid,key,fmt,after)=>{
    const e=$(id); e.value=S[key];
    $(vid).textContent = fmt(S[key]);
    e.addEventListener('input',()=>{ S[key]= +e.value; $(vid).textContent=fmt(S[key]); invalidate(); if(after) after(); });
  };
  wire('dsN','dsNv','density', v=>v+'³');
  wire('dsS','dsSv','arrowScale', v=>v.toFixed(2)+'×');
  wire('dsLv2','dsLv2v','levels', v=>String(v));
  $('dsL').value=S.extent; $('dsLv').textContent='±'+S.extent;
  $('dsL').addEventListener('input',()=>{
    S.extent=+$('dsL').value; $('dsLv').textContent='±'+S.extent;
    R.extent=S.extent; $('dsP').min=-S.extent; $('dsP').max=S.extent;
    fitView(); invalidate(); resetStream(); syncProbeInputs();
  });
  $('dsP').min=-S.extent; $('dsP').max=S.extent; $('dsP').value=S.slicePos;
  $('dsPv').textContent=S.slicePos.toFixed(2);
  $('dsP').addEventListener('input',()=>{ S.slicePos=+$('dsP').value; $('dsPv').textContent=S.slicePos.toFixed(2); cache.slice=null; if(S.nearSlice) cache.arrows=null; });
  for(const b of $('dsAx').children){
    b.setAttribute('aria-pressed', String(+b.dataset.a===S.sliceAxis));
    b.addEventListener('click',()=>{
      S.sliceAxis=+b.dataset.a;
      for(const c of $('dsAx').children) c.setAttribute('aria-pressed', String(c===b));
      cache.slice=null; if(S.nearSlice) cache.arrows=null;
    });
  }
  for(const b of $('dsLen').children){
    b.setAttribute('aria-pressed', String(b.dataset.m===S.lenMode));
    b.addEventListener('click',()=>{
      S.lenMode=b.dataset.m;
      for(const c of $('dsLen').children) c.setAttribute('aria-pressed', String(c===b));
      cache.arrows=null;
    });
  }
  /* a slice choice from another view/mode may not exist here — fall back */
  const allowedOf = Array.from($('dsOf').options).map(o=>o.value);
  if(!allowedOf.includes(S.sliceOf)) S.sliceOf='auto';
  $('dsOf').value=S.sliceOf;
  $('dsOf').addEventListener('change',()=>{ S.sliceOf=$('dsOf').value; cache.slice=null; cache.levels=null; cache.surf=null; updateLegend(); });
  $('lblCurlArrows').style.display = (S.mode==='vector' && !planar()) ? '' : 'none';
  $('dsNear').checked=S.nearSlice;
  $('dsNear').addEventListener('change',()=>{ S.nearSlice=$('dsNear').checked; cache.arrows=null; });
  $('dsH').value = S.hScale;
  $('dsHv').textContent = S.hScale.toFixed(2)+'×';
  $('dsHRow').style.display = isSurf() ? '' : 'none';
  $('dsH').addEventListener('input', ()=>{
    S.hScale = +$('dsH').value; $('dsHv').textContent = S.hScale.toFixed(2)+'×';
    cache.surf=null; cache.levels=null; cache.arrows=null;
  });
  /* the slice is pinned to the domain plane in 2D and height views */
  $('dsAxRow').style.display = planar() ? 'none' : '';
  $('dsPRow').style.display = planar() ? 'none' : '';
  $('dsNearRow').style.display = planar() ? 'none' : '';
  /* time controls appear only for animated (t-dependent) fields */
  const anim = S.field && S.field.animated;
  $('dsTimeRow').style.display = anim ? '' : 'none';
  $('dsPlay').textContent = S.time.paused ? 'Play' : 'Pause';
  $('dsPlay').addEventListener('click', ()=>{
    S.time.paused=!S.time.paused;
    $('dsPlay').textContent = S.time.paused ? 'Play' : 'Pause';
  });
  $('dsSpeed').value=S.time.speed; $('dsSpeedV').textContent=S.time.speed.toFixed(2)+'×';
  $('dsSpeed').addEventListener('input', ()=>{
    S.time.speed=+$('dsSpeed').value; $('dsSpeedV').textContent=S.time.speed.toFixed(2)+'×';
  });
  $('lvlNote').innerHTML = isSurf()
    ? 'On the height map the level sets become the real contour rings of the terrain — each one sits at exactly its own height.'
    : is2D()
      ? 'Contour lines of the scalar, labelled with their values: a topographic map. Gradient arrows always cross them at a right angle and point uphill.'
      : 'Level sets are surfaces of constant value, drawn as stacked contour slices. Every gradient arrow crosses them at a right angle.';
}

/* ------------------------------------------------------------------- HUD ---- */
