function step(label, eqHtml, sub){
  return `<div class="dstep"><div class="lbl">${label}</div><div class="eq mth">${eqHtml}</div>${sub?`<div class="subst">${sub}</div>`:''}</div>`;
}
function showExpr(entry){
  if(!entry.ast) return '<span class="pl">(computed numerically)</span>';
  const s = tex(entry.ast,0);
  /* superposed physics fields can produce book-length derivatives — the math
     is still exact, but typesetting it all would drown the panel */
  if(s.length > 9000) return '<span class="pl">(exact but too long to typeset — ' +
    'a superposition of many terms, each differentiated by the usual rules)</span>';
  return s;
}
function refreshDerivation(){
  const F=S.field; if(!F) return;
  const p=S.probe, x=p.x, y=p.y, z=p.z, lbl=fieldLabel(F);
  const at = `at (${fmtNear(x)}, ${fmtNear(y)}, ${fmtNear(z)})`;
  let h='';

  if(F.f){
    h += step('The scalar field', '<i>f</i> <span class="op">=</span> '+tex(F.f.ast,0),
              `f = <b>${fmtNear(F.f.ev(x,y,z))}</b> ${at}`);
    h += step('Gradient — one partial derivative per axis',
      AX.map((a,i)=>`<div><span class="frac"><span class="nm">∂<i>f</i></span><span class="den">∂<i>${a}</i></span></span><span class="op">=</span>${showExpr(F.grad[i])}</div>`).join(''),
      '∇f = (<b>' + AX.map((a,i)=>fmtNear(F.grad[i].ev(x,y,z))).join('</b>, <b>') + '</b>)');
  } else {
    h += step('The vector field',
      `<i>F</i> <span class="op">=</span> ( ${tex(F.P.ast,0)} , ${tex(F.Q.ast,0)} , ${tex(F.R.ast,0)} )`,
      `F = (<b>${fmtNear(F.P.ev(x,y,z))}</b>, <b>${fmtNear(F.Q.ev(x,y,z))}</b>, <b>${fmtNear(F.R.ev(x,y,z))}</b>) ${at}`);
  }

  const comp = S.mode==='scalar' ? ['∂f/∂x','∂f/∂y','∂f/∂z'] : ['P','Q','R'];
  h += step('Every first partial derivative',
    F.J.map((row,i)=>row.map((e,j)=>
      `<div><span class="frac"><span class="nm">∂${comp[i]}</span><span class="den">∂<i>${AX[j]}</i></span></span><span class="op">=</span>${showExpr(e)}</div>`
    ).join('')).join(''),
    null);

  h += step('Divergence — add the three diagonal partials',
    `∇<span class="op">·</span><i>${lbl}</i> <span class="op">=</span> ` +
    `<span class="frac"><span class="nm">∂${comp[0]}</span><span class="den">∂<i>x</i></span></span><span class="op">+</span>` +
    `<span class="frac"><span class="nm">∂${comp[1]}</span><span class="den">∂<i>y</i></span></span><span class="op">+</span>` +
    `<span class="frac"><span class="nm">∂${comp[2]}</span><span class="den">∂<i>z</i></span></span>` +
    `<span class="op">=</span>${showExpr(F.div)}`,
    `${fmtNear(F.J[0][0].ev(x,y,z))} + ${fmtNear(F.J[1][1].ev(x,y,z))} + ${fmtNear(F.J[2][2].ev(x,y,z))} = <b>${fmtNear(F.divAt(x,y,z))}</b> ${at}`);

  const cf = [['∂'+comp[2]+'/∂y','∂'+comp[1]+'/∂z'],['∂'+comp[0]+'/∂z','∂'+comp[2]+'/∂x'],['∂'+comp[1]+'/∂x','∂'+comp[0]+'/∂y']];
  h += step('Curl — each component is a difference of two cross-partials',
    F.curl.map((c,i)=>
      `<div>(∇<span class="op">×</span><i>${lbl}</i>)<sub>${AX[i]}</sub><span class="op">=</span>${cf[i][0]}<span class="op">−</span>${cf[i][1]}<span class="op">=</span>${showExpr(c)}</div>`
    ).join(''),
    '∇×'+lbl+' = (<b>' + F.curl.map(c=>fmtNear(c.ev(x,y,z))).join('</b>, <b>') + '</b>)');

  if(planar()){
    h += step('Restricted to the plane',
      `<div>∇<span class="op">·</span><i>${lbl}</i><span class="op">=</span>` +
      `<span class="frac"><span class="nm">∂${comp[0]}</span><span class="den">∂<i>x</i></span></span><span class="op">+</span>` +
      `<span class="frac"><span class="nm">∂${comp[1]}</span><span class="den">∂<i>y</i></span></span><span class="op">=</span>${showExpr(F.div2)}</div>` +
      `<div>∇<span class="op">×</span><i>${lbl}</i><span class="op">=</span>` +
      `<span class="frac"><span class="nm">∂${comp[1]}</span><span class="den">∂<i>x</i></span></span><span class="op">−</span>` +
      `<span class="frac"><span class="nm">∂${comp[0]}</span><span class="den">∂<i>y</i></span></span><span class="op">=</span>${showExpr(F.curl2)}</div>`,
      `2D divergence = <b>${fmtNear(F.div2.ev(x,y,0))}</b> &nbsp;·&nbsp; 2D curl = <b>${fmtNear(F.curl2.ev(x,y,0))}</b>. ` +
      `The z-terms drop out and the curl keeps only its ẑ-component, so it becomes a single signed number.`);
  }

  if(F.f){
    h += step('Laplacian — the divergence of the gradient',
      `∇²<i>f</i> <span class="op">=</span> ∇<span class="op">·</span>(∇<i>f</i>) <span class="op">=</span> ${showExpr(F.div)}`,
      `∇²f = <b>${fmtNear(F.divAt(x,y,z))}</b> ${at} — ${F.divAt(x,y,z)<-1e-9?'above the local average (a hilltop)':F.divAt(x,y,z)>1e-9?'below the local average (a basin)':'exactly the local average (harmonic here)'}`);
    const allZero = F.curl.every(c=>c.ast && c.ast.t==='n' && c.ast.v===0);
    h += step('Consequence', `∇<span class="op">×</span>(∇<i>f</i>) <span class="op">=</span> 0`,
      allZero ? 'Confirmed symbolically: all three curl components reduced to exactly 0, because mixed partials commute.'
              : 'Should vanish identically wherever f has continuous second partials.');
  }
  $('derivBody').innerHTML = h;
}

/* ---------------------------------------------------------- panel: flux box ---- */
