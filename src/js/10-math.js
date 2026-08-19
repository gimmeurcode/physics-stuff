/* ============================================================================
   1 · EXPRESSION ENGINE
   Tokenizer → Pratt-ish parser → AST, then three consumers:
     compile()   closure tree   (NEVER eval/new Function — blocked by the CSP)
     diff()      symbolic partial derivatives
     tex()       HTML math typesetting
   ============================================================================ */

/* ---- AST constructors ---- */
const N   = v => ({t:'n', v});
const V   = n => ({t:'v', n});
const bin = (o,a,b) => ({t:'b', o, a, b});
const add = (a,b) => bin('+',a,b);
const sub = (a,b) => bin('-',a,b);
const mul = (a,b) => bin('*',a,b);
const dvd = (a,b) => bin('/',a,b);
const pw  = (a,b) => bin('^',a,b);
const neg = a => ({t:'u', a});
const fnc = (f,...a) => ({t:'f', f, a});

class MathError extends Error {}
class NonDifferentiable extends Error {}

/* ---- function table: evaluator + derivative rule (args, dargs) -> AST ---- */
const FN = {
  sin  :{ar:1, ev:Math.sin,  d:(A,D)=>mul(fnc('cos',A[0]),D[0])},
  cos  :{ar:1, ev:Math.cos,  d:(A,D)=>neg(mul(fnc('sin',A[0]),D[0]))},
  tan  :{ar:1, ev:Math.tan,  d:(A,D)=>dvd(D[0],pw(fnc('cos',A[0]),N(2)))},
  asin :{ar:1, ev:Math.asin, d:(A,D)=>dvd(D[0],fnc('sqrt',sub(N(1),pw(A[0],N(2)))))},
  acos :{ar:1, ev:Math.acos, d:(A,D)=>neg(dvd(D[0],fnc('sqrt',sub(N(1),pw(A[0],N(2))))))},
  atan :{ar:1, ev:Math.atan, d:(A,D)=>dvd(D[0],add(N(1),pw(A[0],N(2))))},
  sinh :{ar:1, ev:Math.sinh, d:(A,D)=>mul(fnc('cosh',A[0]),D[0])},
  cosh :{ar:1, ev:Math.cosh, d:(A,D)=>mul(fnc('sinh',A[0]),D[0])},
  tanh :{ar:1, ev:Math.tanh, d:(A,D)=>dvd(D[0],pw(fnc('cosh',A[0]),N(2)))},
  exp  :{ar:1, ev:Math.exp,  d:(A,D)=>mul(fnc('exp',A[0]),D[0])},
  ln   :{ar:1, ev:Math.log,  d:(A,D)=>dvd(D[0],A[0])},
  log  :{ar:1, ev:v=>Math.log10(v), d:(A,D)=>dvd(D[0],mul(A[0],N(Math.LN10)))},
  sqrt :{ar:1, ev:Math.sqrt, d:(A,D)=>dvd(D[0],mul(N(2),fnc('sqrt',A[0])))},
  abs  :{ar:1, ev:Math.abs,  d:(A,D)=>mul(fnc('sign',A[0]),D[0])},
  sign :{ar:1, ev:Math.sign, d:()=>N(0)},
  floor:{ar:1, ev:Math.floor,d:()=>N(0)},
  atan2:{ar:2, ev:Math.atan2,
         d:(A,D)=>dvd(sub(mul(A[1],D[0]),mul(A[0],D[1])),add(pw(A[0],N(2)),pw(A[1],N(2))))},
  min  :{ar:2, ev:Math.min},
  max  :{ar:2, ev:Math.max}
};

const CONSTS = {pi:Math.PI, tau:2*Math.PI, e:Math.E};
/* macros expand at parse time so differentiation needs no special cases */
const MACROS = {
  r  : () => fnc('sqrt', add(add(pw(V('x'),N(2)),pw(V('y'),N(2))),pw(V('z'),N(2)))),
  rho: () => fnc('sqrt', add(pw(V('x'),N(2)),pw(V('y'),N(2))))
};
/* t is the animation clock: fields that mention it re-render as time advances.
   Spatial differentiation treats it as a constant, which is exactly right. */
const VARS = ['x','y','z','t'];
const CLOCK = { t: 0 };

/* names matched longest-first so `rho` beats `r` and `exp` beats `e` */
const NAMES = [...Object.keys(FN), ...Object.keys(CONSTS), ...Object.keys(MACROS), ...VARS]
  .sort((a,b)=>b.length-a.length);

/* ---- tokenizer ---- */
function tokenize(src){
  const T=[]; let i=0;
  while(i<src.length){
    const c=src[i];
    if(c===' '||c==='\t'){ i++; continue; }
    if(c>='0'&&c<='9' || (c==='.'&&/[0-9]/.test(src[i+1]||''))){
      let j=i; while(j<src.length && /[0-9.]/.test(src[j])) j++;
      if(src[j]==='e'||src[j]==='E'){                    // 1e-3 scientific form
        let k=j+1; if(src[k]==='+'||src[k]==='-') k++;
        if(/[0-9]/.test(src[k]||'')){ while(k<src.length&&/[0-9]/.test(src[k])) k++; j=k; }
      }
      const txt=src.slice(i,j), v=parseFloat(txt);
      if(!Number.isFinite(v)) throw new MathError(`"${txt}" is not a number`);
      T.push({k:'num', v, i}); i=j; continue;
    }
    if('+-*/^(),'.includes(c)){ T.push({k:c, i}); i++; continue; }
    if(c==='×'){ T.push({k:'*', i}); i++; continue; }
    if(c==='−'||c==='–'){ T.push({k:'-', i}); i++; continue; }        // unicode minus
    if(c==='÷'){ T.push({k:'/', i}); i++; continue; }
    if(c==='²'||c==='³'){ T.push({k:'^',i}); T.push({k:'num',v:c==='²'?2:3,i}); i++; continue; }
    const name = NAMES.find(n => src.startsWith(n, i));
    if(name){ T.push({k:'name', v:name, i}); i+=name.length; continue; }
    throw new MathError(`unexpected "${c}" at position ${i+1}`);
  }
  T.push({k:'end', i:src.length});
  return T;
}

/* ---- parser ---- */
function parse(src){
  const T = tokenize(String(src));
  let p = 0;
  const peek = () => T[p];
  const eat  = k => { if(T[p].k===k){ return T[p++]; } return null; };
  const need = k => { const t=eat(k); if(!t) throw new MathError(`expected "${k}" but found ${desc(T[p])}`); return t; };
  const desc = t => t.k==='end' ? 'end of expression' : t.k==='num' ? `"${t.v}"` : `"${t.v||t.k}"`;
  /* a factor may follow another factor with no operator: 2x, 3sin(t), (x+1)(x-1) */
  const startsFactor = () => ['num','name','('].includes(peek().k);

  function pExpr(){
    let a = pTerm();
    for(;;){
      if(eat('+'))      a = add(a, pTerm());
      else if(eat('-')) a = sub(a, pTerm());
      else return a;
    }
  }
  function pTerm(){
    let a = pUnary();
    for(;;){
      if(eat('*'))      a = mul(a, pUnary());
      else if(eat('/')) a = dvd(a, pUnary());
      else if(startsFactor()){                          // implicit multiplication
        /* "2 3" is a typo, not 6 — juxtaposed number literals are rejected */
        if(peek().k==='num') throw new MathError(`missing operator before "${peek().v}"`);
        a = mul(a, pUnary());
      }
      else return a;
    }
  }
  function pUnary(){
    if(eat('-')) return neg(pUnary());
    if(eat('+')) return pUnary();
    return pPow();
  }
  function pPow(){
    const base = pAtom();
    if(eat('^')) return pw(base, pUnary());             // right-associative
    return base;
  }
  function pAtom(){
    const t = peek();
    if(t.k==='num'){ p++; return N(t.v); }
    if(t.k==='('){ p++; const e=pExpr(); need(')'); return e; }
    if(t.k==='name'){
      p++;
      const nm=t.v;
      if(VARS.includes(nm))            return V(nm);
      if(nm in CONSTS)                 return N(CONSTS[nm]);
      if(nm in MACROS)                 return MACROS[nm]();
      const spec=FN[nm];
      if(eat('(')){
        const args=[pExpr()];
        while(eat(',')) args.push(pExpr());
        need(')');
        if(args.length!==spec.ar) throw new MathError(`${nm}() takes ${spec.ar} argument${spec.ar>1?'s':''}, got ${args.length}`);
        return nm==='pow' ? pw(args[0],args[1]) : {t:'f', f:nm, a:args};
      }
      if(spec.ar!==1) throw new MathError(`${nm}() needs parentheses: ${nm}(a, b)`);
      return {t:'f', f:nm, a:[pPow()]};                 // bare form: sin x, sinx, sin x^2
    }
    throw new MathError(`unexpected ${desc(t)}`);
  }

  const ast = pExpr();
  if(peek().k!=='end') throw new MathError(`unexpected ${desc(peek())}`);
  return ast;
}

/* ---- structural helpers ---- */
function eqAst(a,b){
  if(a===b) return true;
  if(a.t!==b.t) return false;
  switch(a.t){
    case 'n': return a.v===b.v;
    case 'v': return a.n===b.n;
    case 'u': return eqAst(a.a,b.a);
    case 'b': return a.o===b.o && eqAst(a.a,b.a) && eqAst(a.b,b.b);
    case 'f': return a.f===b.f && a.a.length===b.a.length && a.a.every((x,i)=>eqAst(x,b.a[i]));
  }
  return false;
}
function dependsOn(nd, v){
  switch(nd.t){
    case 'n': return false;
    case 'v': return v==null || nd.n===v;
    case 'u': return dependsOn(nd.a, v);
    case 'b': return dependsOn(nd.a,v) || dependsOn(nd.b,v);
    case 'f': return nd.a.some(x=>dependsOn(x,v));
  }
  return false;
}
/* ---- simplifier: load-bearing, not polish — raw derivative trees are unreadable ---- */
function applyOp(o,x,y){
  switch(o){ case '+':return x+y; case '-':return x-y; case '*':return x*y; case '/':return x/y; case '^':return Math.pow(x,y); }
}
function simp(nd){
  if(nd.t==='n' || nd.t==='v') return nd;

  if(nd.t==='u'){
    const a=simp(nd.a);
    if(a.t==='n') return N(-a.v);
    if(a.t==='u') return a.a;
    return neg(a);
  }
  if(nd.t==='f'){
    const a=nd.a.map(simp);
    if(a.every(x=>x.t==='n')){
      const v=FN[nd.f].ev(...a.map(x=>x.v));
      if(Number.isFinite(v)) return N(v);
    }
    return {t:'f', f:nd.f, a};
  }

  const o=nd.o; let a=simp(nd.a), b=simp(nd.b);
  const an=a.t==='n', bn=b.t==='n';
  if(an && bn){ const v=applyOp(o,a.v,b.v); if(Number.isFinite(v)) return N(v); }

  switch(o){
    case '+':
      if(an && a.v===0) return b;
      if(bn && b.v===0) return a;
      if(b.t==='u')     return simp(sub(a,b.a));
      if(bn && b.v<0)   return simp(sub(a,N(-b.v)));
      if(eqAst(a,b))    return simp(mul(N(2),a));
      break;
    case '-':
      if(bn && b.v===0) return a;
      if(an && a.v===0) return simp(neg(b));
      if(b.t==='u')     return simp(add(a,b.a));
      if(bn && b.v<0)   return simp(add(a,N(-b.v)));
      if(eqAst(a,b))    return N(0);
      break;
    case '*':
      if((an&&a.v===0)||(bn&&b.v===0)) return N(0);
      if(an && a.v===1)  return b;
      if(bn && b.v===1)  return a;
      if(an && a.v===-1) return simp(neg(b));
      if(bn && b.v===-1) return simp(neg(a));
      if(a.t==='u' && b.t==='u') return simp(mul(a.a,b.a));
      if(a.t==='u')      return simp(neg(mul(a.a,b)));
      if(b.t==='u')      return simp(neg(mul(a,b.a)));
      if(bn && !an)      return simp(mul(b,a));                      // numbers lead: x·2 → 2x
      if(eqAst(a,b))     return simp(pw(a,N(2)));
      /* x·x^k → x^(k+1) and x^j·x^k → x^(j+k) */
      if(b.t==='b'&&b.o==='^'&&b.b.t==='n'&&eqAst(a,b.a)) return simp(pw(a,N(b.b.v+1)));
      if(a.t==='b'&&a.o==='^'&&a.b.t==='n'&&eqAst(b,a.a)) return simp(pw(b,N(a.b.v+1)));
      if(a.t==='b'&&a.o==='^'&&b.t==='b'&&b.o==='^'&&a.b.t==='n'&&b.b.t==='n'&&eqAst(a.a,b.a))
        return simp(pw(a.a,N(a.b.v+b.b.v)));
      break;
    case '/':
      if(an && a.v===0)  return N(0);
      if(bn && b.v===1)  return a;
      if(bn && b.v===-1) return simp(neg(a));
      if(eqAst(a,b))     return N(1);
      if(a.t==='u')      return simp(neg(dvd(a.a,b)));
      if(b.t==='u')      return simp(neg(dvd(a,b.a)));
      break;
    case '^':
      if(bn && b.v===0)  return N(1);
      if(bn && b.v===1)  return a;
      if(an && a.v===1)  return N(1);
      if(a.t==='b'&&a.o==='^'&&bn&&a.b.t==='n') return simp(pw(a.a,N(a.b.v*b.v)));
      break;
  }
  return bin(o,a,b);
}

/* ----------------------------------------------------------------------------
   Canonicalisation. simp() only cancels structurally identical siblings, which
   is not enough: ∂/∂x∂y and ∂/∂y∂x of the same f produce equal terms written in
   a different factor order, so ∇×(∇f) would display as a pile of terms instead
   of the 0 it actually is. Flattening sums/products, keying each term by a
   sorted signature and adding the coefficients fixes that — and makes every
   derivative on screen dramatically shorter.
   ---------------------------------------------------------------------------- */
function flattenSum(nd, sign, out){
  if(nd.t==='b' && nd.o==='+'){ flattenSum(nd.a,sign,out); flattenSum(nd.b,sign,out); return; }
  if(nd.t==='b' && nd.o==='-'){ flattenSum(nd.a,sign,out); flattenSum(nd.b,-sign,out); return; }
  if(nd.t==='u'){ flattenSum(nd.a,-sign,out); return; }
  out.push({sign, nd});
}
function flattenProd(nd, out){
  if(nd.t==='b' && nd.o==='*'){ flattenProd(nd.a,out); flattenProd(nd.b,out); return; }
  out.push(nd);
}
/* order-independent signature of a subtree */
function ckey(nd){
  switch(nd.t){
    case 'n': return 'N'+nd.v;
    case 'v': return 'V'+nd.n;
    case 'u': return 'U'+ckey(nd.a);
    case 'f': return 'F'+nd.f+'('+nd.a.map(ckey).join(',')+')';
    case 'b': {
      if(nd.o==='*'){
        const fs=[]; flattenProd(nd,fs);
        return 'M('+fs.map(ckey).sort().join('|')+')';
      }
      if(nd.o==='+'||nd.o==='-'){
        const ts=[]; flattenSum(nd,1,ts);
        return 'S('+ts.map(t=>(t.sign<0?'-':'+')+ckey(t.nd)).sort().join('|')+')';
      }
      return 'B'+nd.o+'('+ckey(nd.a)+','+ckey(nd.b)+')';
    }
  }
  return '?';
}
function collectSum(nd){
  const terms=[]; flattenSum(nd,1,terms);
  const groups=new Map();
  for(const {sign, nd:t} of terms){
    const fs=[]; flattenProd(t,fs);
    let coef=sign; const rest=[];
    for(let f of fs){
      while(f.t==='u'){ coef=-coef; f=f.a; }
      if(f.t==='n') coef*=f.v; else rest.push(f);
    }
    const key = rest.map(ckey).sort().join('|');
    const g = groups.get(key);
    if(g) g.coef += coef; else groups.set(key, {coef, rest});
  }
  let result=null;
  for(const g of groups.values()){
    let c=g.coef;
    if(Math.abs(c-Math.round(c)) < 1e-12) c = Math.round(c);
    if(Math.abs(c) < 1e-12) continue;
    let term = g.rest.length ? g.rest.reduce((p,q)=>mul(p,q)) : N(1);
    if(c !== 1) term = g.rest.length ? mul(N(c), term) : N(c);
    result = result===null ? term : add(result, term);
  }
  return result===null ? N(0) : result;
}
function collectDeep(nd){
  if(nd.t==='n' || nd.t==='v') return nd;
  if(nd.t==='u') return neg(collectDeep(nd.a));
  if(nd.t==='f') return {t:'f', f:nd.f, a:nd.a.map(collectDeep)};
  const node = bin(nd.o, collectDeep(nd.a), collectDeep(nd.b));
  return (nd.o==='+' || nd.o==='-') ? collectSum(node) : node;
}
/* full normalisation: structural simplify → collect like terms → simplify again */
const norm = nd => simp(collectDeep(simp(nd)));

/* ---- symbolic differentiation ---- */
function diffRaw(nd, wrt){
  switch(nd.t){
    case 'n': return N(0);
    case 'v': return N(nd.n===wrt ? 1 : 0);
    case 'u': return neg(diffRaw(nd.a, wrt));
    case 'b': {
      const a=nd.a, b=nd.b, da=diffRaw(a,wrt), db=diffRaw(b,wrt);
      switch(nd.o){
        case '+': return add(da,db);
        case '-': return sub(da,db);
        case '*': return add(mul(da,b), mul(a,db));
        case '/': return dvd(sub(mul(da,b), mul(a,db)), pw(b,N(2)));
        case '^':
          if(!dependsOn(b,null))                                    // constant exponent
            return mul(mul(b, pw(a, sub(b,N(1)))), da);
          return mul(pw(a,b), add(mul(db, fnc('ln',a)), dvd(mul(b,da), a)));
      }
      break;
    }
    case 'f': {
      const spec=FN[nd.f];
      if(!spec.d) throw new NonDifferentiable(nd.f);
      return spec.d(nd.a, nd.a.map(x=>diffRaw(x,wrt)));
    }
  }
  throw new MathError('cannot differentiate this expression');
}
const diff = (nd, wrt) => norm(diffRaw(nd, wrt));

/* ---- closure-tree compiler (no eval — required by the artifact CSP) ---- */
function compile(nd){
  switch(nd.t){
    case 'n': { const v=nd.v; return () => v; }
    case 'v': {
      if(nd.n==='x') return (x)=>x;
      if(nd.n==='y') return (x,y)=>y;
      if(nd.n==='t') return ()=>CLOCK.t;
      return (x,y,z)=>z;
    }
    case 'u': { const f=compile(nd.a); return (x,y,z)=> -f(x,y,z); }
    case 'f': {
      const ev=FN[nd.f].ev, A=nd.a.map(compile);
      if(A.length===1){ const a=A[0]; return (x,y,z)=>ev(a(x,y,z)); }
      const a=A[0], b=A[1];         return (x,y,z)=>ev(a(x,y,z), b(x,y,z));
    }
    case 'b': {
      const a=compile(nd.a), b=compile(nd.b);
      switch(nd.o){
        case '+': return (x,y,z)=>a(x,y,z)+b(x,y,z);
        case '-': return (x,y,z)=>a(x,y,z)-b(x,y,z);
        case '*': return (x,y,z)=>a(x,y,z)*b(x,y,z);
        case '/': return (x,y,z)=>a(x,y,z)/b(x,y,z);
        case '^': return (x,y,z)=>Math.pow(a(x,y,z), b(x,y,z));
      }
    }
  }
  return () => NaN;
}

/* ---- numeric fallback when a function has no derivative rule (min/max/floor edges) ---- */
function numericPartial(f, axis){
  const h = 1e-5, i2h = 1/(2*h);
  if(axis==='x') return (x,y,z)=>(f(x+h,y,z)-f(x-h,y,z))*i2h;
  if(axis==='y') return (x,y,z)=>(f(x,y+h,z)-f(x,y-h,z))*i2h;
  return (x,y,z)=>(f(x,y,z+h)-f(x,y,z-h))*i2h;
}

/* ---- a number the reader typed, or an expression for one ----
   Number() first — it is the common case and stricter about trailing junk —
   then the laboratory's own expression engine, so pi/4, 2^10, 1/3, sqrt(2) and
   3e-4 are all legal ways to say one number. NaN means "that is not a number",
   and every caller must treat it as a refusal rather than as a value.

   It lives here, in the engine, rather than in the panel layer where it began
   as ctlParse: a scenario the reader supplies as TEXT — a chain of boosts, a
   stack of layers, a netlist — is parsed by an engine module, and runtests only
   extracts modules above the state banner, so an engine calling ctlParse would
   work in the app and be undefined under test. One implementation, two callers;
   ctlParse (60a) is now a one-line alias kept for its hundred call sites. */
function mathNum(s){
  const t = String(s).replace(/−/g, '-').replace(/[×·]/g, '*').trim();
  if(!t) return NaN;
  const plain = Number(t);
  if(Number.isFinite(plain)) return plain;
  try {
    const g = compile(parse(t));
    const v = g(0, 0, 0);
    if(!Number.isFinite(v)) return NaN;
    /* AND IT MUST BE A CONSTANT. The engine's own variables parse perfectly
       well, so `x`, `y`, `r` and `rho` all evaluated at the origin and came
       back as a confident 0 — a numeric box that silently reads a variable
       name as zero is the same defect as one that reads its own display
       formatting back as NaN, and it reached every `ctlParse` site. Evaluating
       at a second, unrelated point costs one call and settles it. (Two probes
       cannot rule out an expression that happens to agree at both and vary
       elsewhere; nothing short of symbolic differentiation can, and a
       contrived `x*(x-1.234567)` is not the failure this exists to stop.) */
    const w = g(1.234567, -2.345678, 3.456789);
    if(v !== w) return NaN;
    /* `t` is the fourth variable and it is bound to the animation CLOCK rather
       than to an argument, so no choice of x, y, z separates it — it would
       come back as whatever second the reader happened to type in. It is the
       one variable that has to be refused by name. */
    if(/(?<![A-Za-z])t(?![A-Za-z])/.test(t)) return NaN;
    return v;
  }
  catch(err){ return NaN; }
}

/* ---- number formatting ----
   Output goes to both HTML panels and canvas fillText, so the exponent is real
   Unicode superscript rather than markup or an ASCII caret: 2.5×10⁻⁶, never
   2.5×10^-6. Both minus signs are U+2212, not the hyphen. */
const SUPERS = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻','+':'' };
const supDigits = s => String(s).split('').map(c => SUPERS[c] !== undefined ? SUPERS[c] : c).join('');

function fmtNum(v, sig){
  if(!Number.isFinite(v)) return Number.isNaN(v) ? '—' : (v>0?'∞':'−∞');
  if(v===0) return '0';
  const a=Math.abs(v);
  if(a>=1e6 || a<1e-4){
    /* split first: a single replace('-','−') would convert the mantissa's sign
       and leave the exponent's hyphen behind */
    const parts = v.toExponential(2).split('e');
    return parts[0].replace('-','−') + '×10' + supDigits(parts[1]);
  }
  let s = v.toFixed(Math.max(0, (sig||4) - Math.max(0, Math.floor(Math.log10(a))+1)));
  if(s.includes('.')) s = s.replace(/\.?0+$/,'');
  return s.replace('-','−');
}
const fmtNear = v => (Math.abs(v) < 5e-12 ? '0' : fmtNum(v,4));

/* Significant figures, properly.

   fmtNum's exponent term is clamped at zero, so for |v| < 1 its `sig` silently
   stops counting FIGURES and starts counting DECIMALS. Swept, the consequence
   is exact: a non-zero value prints as "0" for v in [1e-4, 4.99e-4] at sig 3,
   and in [1e-4, 4.99e-3] at sig 2. `dyForce` printed a real 1.4988e-4 J
   disagreement — 7.8% of the quantity beside it — as "they differ by 0", in the
   affirmative colour. That is J9. This formatter never does it: use it for a
   residual, a gap, or anything else whose whole meaning is its size. */
function fmtSig(v, sig){
  if(!Number.isFinite(v)) return Number.isNaN(v) ? '—' : (v > 0 ? '∞' : '−∞');
  if(v === 0) return '0';
  const a = Math.abs(v);
  if(a >= 1e6 || a < 1e-3){
    const parts = v.toExponential(Math.max(0, (sig || 3) - 1)).split('e');
    return parts[0].replace('-','−') + '×10' + supDigits(parts[1]);
  }
  return String(+v.toPrecision(sig || 3)).replace('-','−');
}

/* Axis tick labels. fmtNum(v, 3) collapsed any axis whose span is ≲ 0.01 into
   DUPLICATE labels — the statmech speed distribution's density axis read
   0.002, 0.002, 0.002, 0.002, 0.001 … — because below 1 fmtNum's `sig` counts
   decimals, not figures (the same clamp J9 documents). A tick label's
   precision must come from the STEP between ticks, never from a constant:
   exactly enough decimals that the step is representable, so adjacent ticks
   can never print the same string. Both owners of axis furniture use this —
   ctGrid (61a) and pvDrawAxes (59c) — and nothing else may label a tick;
   ./auditticks.ps1 reads the strings actually drawn and fails on a duplicate
   in any one row or column. */
function fmtTick(v, step){
  if(!Number.isFinite(v)) return '';
  const a = Math.abs(v), s = Math.abs(step);
  if(s > 0 && a < s * 1e-9) return '0';            // float noise at the origin
  if(a >= 1e6) return fmtNum(v, 3);                // 2.50×10⁶ — one label per decade step
  if(a > 0 && a < 1e-4) return fmtSig(v, 3);       // scientific, and NO dead zone —
                                                   // fmtNum here is the J9 clamp again
  let d = 0;
  while(d < 12 && Math.abs(s - +s.toFixed(d)) > s * 1e-9) d++;
  let out = v.toFixed(d);
  if(out.includes('.')) out = out.replace(/0+$/, '').replace(/\.$/, '');
  return out.replace('-', '−');
}

/* A residual is not a measurement — §2.1 — and the way it stops being one is to
   print it against the scale it must be read against, and to say what it means.

   Two numbers computed by two routes can only be said to agree down to the
   resolution the routes themselves have. Below `floorRel` there is no
   information left, so this says so instead of quoting a digit the calculation
   never earned; above it, the absolute gap, the relative gap and the number of
   figures the two share are all printed together, because the absolute one
   alone is what made a 100% disagreement look like success. */
/* The form to reach for, and the reason it exists rather than everyone calling
   fmtGap: hand it the TWO numbers rather than their difference, and the scale
   they must be read against is DERIVED instead of remembered. A scale passed by
   hand at sixty call sites is a scale that will be wrong at some of them; this
   one cannot be. Use fmtGap directly only where the two routes are not both in
   scope — an accumulated drift, a worst-case over a sweep. */
const fmtAgree = (a, b, unit, floorRel) =>
  fmtGap(Math.abs(a - b), Math.max(Math.abs(a), Math.abs(b)), unit, floorRel);

function fmtGap(gap, scale, unit, floorRel){
  const u = unit ? ' ' + unit : '';
  /* A NaN is NOT agreement. `!(rel > floor)` is true when rel is NaN, so a
     route that returned no number at all fell into the affirmative branch and
     printed "they agree to every digit" — which is how a plunging orbit with
     no perihelion to measure reported perfect agreement with the perihelion
     formula (rlOrbit at the ISCO preset, found by auditsides 2026-08-15).
     Say what actually happened instead. */
  if(!Number.isFinite(gap) || !Number.isFinite(scale))
    return 'not computable — a route returned no number';
  const rel = Math.abs(gap) / Math.max(1e-300, Math.abs(scale));
  if(!(rel > (floorRel || 1e-9)))
    return '0' + u + ' — they agree to every digit either route has';
  const figs = Math.max(0, Math.floor(-Math.log10(rel)));
  return fmtSig(Math.abs(gap), 3) + u + '  (' + fmtSig(100 * rel, 3) + '% — agreeing to ' +
         figs + (figs === 1 ? ' figure)' : ' figures)');
}

/* The one case fmtAgree CANNOT get right on its own: BOTH routes vanish.

   fmtAgree derives its scale as max(|a|,|b|), which is the right answer until
   the quantity itself is zero — and then the derived scale IS the round-off,
   so a perfect result reads as a 100% disagreement in the affirmative colour.
   dyMoment at e = 1 printed "1.78×10⁻¹⁵ J (100% — agreeing to 0 figures)"
   directly beneath prose promising the two "match exactly"; smBoltz managed the
   same thing at 1.81×10⁻¹⁷⁰. That is J9 inverted — there a real gap printed as
   0, here a zero gap prints as total disagreement — and it is the same defect
   underneath: a residual quoted against a scale that means nothing.
   ./auditsides.ps1 found ten of them and is what fails if an eleventh lands.

   `gross` is the quantity the cancellation came from — §2.1's "print what the
   zero cancelled", ∮|B·n̂|dA beside ∮B·dA. A residual of 5×10⁻¹¹ is round-off
   in a sum of terms of size π and a catastrophe in a sum of terms of size
   10⁻¹⁰, and only the gross separates them.

   THE GROSS SETS A FLOOR — it does not rescale the verdict. Taking
   max(|a|,|b|,|gross|) as the scale was tried first and is wrong: it reports a
   genuine 50% disagreement between two routes as 5% whenever the gross happens
   to be ten times larger, which buries exactly the defect this family exists to
   surface. The test pinning that is in tests.js and it failed on the first
   version. Above the floor the ordinary fmtAgree verdict stands untouched;
   below it there is nothing left to resolve and it says so. A gross of 0
   degrades to exactly fmtAgree. */
function fmtAgreeGross(a, b, gross, unit, floorRel){
  const gap = Math.abs(a - b);
  /* a NaN gross must not defeat the floor test silently (NaN||0 is NaN, and
     every comparison against NaN is false) — treat it as no floor at all, and
     let fmtGap's own finiteness guard handle a NaN gap */
  const g = Number.isFinite(gross) ? Math.abs(gross) : 0;
  if(gap <= (floorRel || 1e-9) * g)
    return '0' + (unit ? ' ' + unit : '') + ' — they agree to every digit either route has';
  return fmtGap(gap, Math.max(Math.abs(a), Math.abs(b)), unit, floorRel);
}

/* The same verdict, sized for a CANVAS label.

   fmtGap's sentence is right for an HTML row and far too wide for a fixed
   column like wsNum's 250 px — so the four canvas sites that print a difference
   had each quietly dropped the scale rather than wrap, which is the J9 defect
   again in the one surface ./auditresid.ps1 cannot read (canvas text is not in
   the DOM). Same derivation and the same floor, no prose. Output is Unicode
   only, because canvas text is drawn literally and markup would be painted. */
const fmtAgreeTight = (a, b, unit) =>
  fmtGapTight(Math.abs(a - b), Math.max(Math.abs(a), Math.abs(b)), unit);

function fmtGapTight(gap, scale, unit, floorRel){
  const u = unit ? ' ' + unit : '';
  if(!Number.isFinite(gap) || !Number.isFinite(scale)) return 'not computable';
  const rel = Math.abs(gap) / Math.max(1e-300, Math.abs(scale));
  if(!(rel > (floorRel || 1e-9))) return '0' + u + ' (every digit)';
  return fmtSig(Math.abs(gap), 3) + u + ' (' + fmtSig(100 * rel, 2) + '%)';
}

/* The ASCII form of a number, for a box the reader is expected to type back
   into. fmtNum is a DISPLAY formatter: it emits U+2212 for the minus sign and
   real superscripts for an exponent, which is right for a label and wrong for
   an <input>, because nothing can read them back — parseFloat('−0.7') is NaN,
   and no parser here can see 10⁻¹⁷ at all.

   Two panels wrote fmtNum into editable boxes: û (du/dv/dw) and n̂
   (cnx/cny/cnz), each three boxes holding one unit vector, each handler reading
   all three back with parseFloat. Any component displayed as negative therefore
   read as NaN, fell through `|| 0`, and the vector silently swung to a
   different direction the moment the reader edited a neighbouring box. Nothing
   raised, nothing printed NaN, and the picture simply showed the wrong
   direction. Found by ./auditlink.ps1, which asks a different question — can a
   control's value be written back — and got the answer as a side effect. */
const fmtEdit = (v, sig) => Number.isFinite(v) ? String(+v.toPrecision(sig || 4)) : '';

/* ---- ^ exponents and _ indices -> real markup, for HTML labels ----
   Applied where a label is rendered, never to the stored string: the same
   tables also feed the expression parser, which needs e^(-x^2) to stay ASCII.
   Only call this on text that is about to become HTML.

   Never rewrite inside a tag. That is load-bearing rather than tidy: segmented
   controls carry the expression itself in data-v="x^2+y^2-4", and rewriting the
   attribute once fed "x<sup>2</sup>+…" straight to the expression parser.

   Why this walks the string instead of running a regex per text run. The
   derivation ladders build equations by concatenating tag helpers, so a script
   very often SPANS tags:

       ${dop('e')}^(${dop('i')}${dv('k')}${dv('a')})
         ->  e^(<span class="op">i</span><i>k</i><i>a</i>)

   Treating each text run separately cannot see that — the run holding "^(" has
   no closing paren in it, so nothing matched and a literal "^(" reached the
   reader on some fifty derivation steps. The walker below marks which
   characters sit inside a tag once, then matches the group across tags by
   counting only the parentheses that live in text. It also handles the three
   other shapes the ladders produce and the old regex never covered: an exponent
   that is itself markup (T^<i>N</i>), a non-ASCII exponent (∫₀^∞, F^μν), and
   the same four cases for "_" subscripts (∂_μ, Σ_(n=0), E_g). */
function supify(s){
  const src = String(s);
  if(src.indexOf('^') < 0 && src.indexOf('_') < 0) return src;
  const n = src.length;

  const inTag = new Uint8Array(n);
  for(let i = 0, t = 0; i < n; i++){
    const c = src[i];
    if(!t && c === '<') t = 1;
    inTag[i] = t;
    if(t && c === '>') t = 0;
  }

  /* what may appear in an unbracketed exponent or index — digits, letters, a
     decimal point, the signs, and the Greek and maths letters these equations
     actually use (μν on the field tensor, ∞ on an integral limit) */
  /* …and the vulgar fractions, added 2026-08-18. `A^⅔` in the SEMF prose left
     its caret on screen in five places because ⅔ was not in this class, and
     `auditscan` reported it as a HIGH notation leak — the exponent is converted
     only when EVERY character of it qualifies, so one unlisted character
     silently disables the whole conversion rather than half of it. The five
     sites now read `A^(2/3)`, which typesets better; this line is so that the
     next author who writes the fraction directly does not reintroduce it. */
  const EXP = /[0-9A-Za-z.\/′∞½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞αβγδεζηθικλμνξπρστυφχψωΓΔΘΛΞΠΣΦΨΩ]/;

  let out = '', i = 0;
  while(i < n){
    const c = src[i];
    if(inTag[i] || (c !== '^' && c !== '_')){ out += c; i++; continue; }
    const tag = c === '^' ? 'sup' : 'sub';
    const j = i + 1;
    if(j >= n){ out += c; i++; continue; }
    /* an underscore is an index only when attached to something on its left;
       a lone one in prose is just an underscore */
    if(c === '_' && (i === 0 || /\s/.test(src[i - 1]))){ out += c; i++; continue; }

    if(src[j] === '('){
      let depth = 0, end = -1;
      for(let k = j; k < n; k++){
        if(inTag[k]) continue;
        if(src[k] === '(') depth++;
        else if(src[k] === ')'){ depth--; if(!depth){ end = k; break; } }
      }
      if(end < 0){ out += c; i++; continue; }        // never closes — leave it alone
      out += '<' + tag + '>' + supify(src.slice(j + 1, end)) + '</' + tag + '>';
      i = end + 1; continue;
    }
    if(src[j] === '<'){                              // the exponent is markup
      const m = /^<([A-Za-z]+)[^>]*>/.exec(src.slice(j));
      if(m){
        const close = '</' + m[1] + '>';
        const at = src.indexOf(close, j + m[0].length);
        if(at >= 0){
          const end = at + close.length;
          out += '<' + tag + '>' + src.slice(j, end) + '</' + tag + '>';
          i = end; continue;
        }
      }
      out += c; i++; continue;
    }
    let k = j;
    if(src[k] === '−' || src[k] === '-' || src[k] === '+' || src[k] === '±' || src[k] === '∓') k++;
    while(k < n && !inTag[k] && EXP.test(src[k])) k++;
    if(k === j){ out += c; i++; continue; }
    out += '<' + tag + '>' + src.slice(j, k) + '</' + tag + '>';
    i = k;
  }
  return out;
}

/* ---- caret exponents -> Unicode superscripts, for CANVAS text ----
   ctx.fillText draws markup literally, so <sup> is useless there and the house
   rule is "Unicode, or reword". The awkward part is that several display strings
   are shared: CL_LIMITS[k].name is both a segmented-control label (HTML, where
   supify handles it) and the plot heading (canvas, where it does not). One
   string, two renderers. This is the canvas half.

   An exponent is converted only when EVERY character in it has a superscript
   form. A half-converted exponent — "e⁻ˣ^2" — is worse than an honest caret, so
   the fallback is to leave the text exactly as it was and let auditcanvas.ps1
   report it for rewording. */
const UNI_SUP = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
  '+':'⁺','-':'⁻','−':'⁻','=':'⁼','(':'⁽',')':'⁾','/':'ᐟ',
  'a':'ᵃ','b':'ᵇ','c':'ᶜ','d':'ᵈ','e':'ᵉ','f':'ᶠ','g':'ᵍ','h':'ʰ','i':'ⁱ','j':'ʲ',
  'k':'ᵏ','l':'ˡ','m':'ᵐ','n':'ⁿ','o':'ᵒ','p':'ᵖ','r':'ʳ','s':'ˢ','t':'ᵗ','u':'ᵘ',
  'v':'ᵛ','w':'ʷ','x':'ˣ','y':'ʸ','z':'ᶻ',
  'β':'ᵝ','γ':'ᵞ','δ':'ᵟ','θ':'ᶿ','φ':'ᵠ','χ':'ᵡ',
  /* already superscript — pass through so e^(−x²) converts whole */
  '⁰':'⁰','¹':'¹','²':'²','³':'³','⁴':'⁴','⁵':'⁵','⁶':'⁶','⁷':'⁷','⁸':'⁸','⁹':'⁹',
  '⁺':'⁺','⁻':'⁻','⁽':'⁽','⁾':'⁾','ⁿ':'ⁿ','ˣ':'ˣ'
};
function uniSup(s){
  const t = String(s);
  if(t.indexOf('^') < 0) return t;
  const lift = run => {
    let o = '';
    for(const ch of run){ const u = UNI_SUP[ch]; if(!u) return null; o += u; }
    return o;
  };
  return t
    .replace(/\^\(([^()]*)\)/g, (m, g) => lift(g) || m)
    .replace(/\^([0-9A-Za-z]+)/g, (m, g) => lift(g) || m);
}

/* ---- HTML math typesetter ---- */
const esc = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function texNum(v){
  if(Math.abs(v-Math.PI)<1e-12) return '<i>π</i>';
  if(Math.abs(v+Math.PI)<1e-12) return '−<i>π</i>';
  if(Math.abs(v-Math.E )<1e-12) return '<i>e</i>';
  let s;
  if(Number.isInteger(v)) s=String(v);
  else { s=String(parseFloat(v.toPrecision(6))); }
  return '<span class="num">'+esc(s).replace('-','−')+'</span>';
}
/* precedence: sum 1 · product 2 · power 3 · atom 4 */
function tex(nd, ctx){
  ctx = ctx || 0;
  const wrap = (s,need) => need ? '(' + s + ')' : s;
  switch(nd.t){
    case 'n': return wrap(texNum(nd.v), nd.v<0 && ctx>=2);
    case 'v': return '<i>'+nd.n+'</i>';
    case 'u': return wrap('−'+tex(nd.a,2), ctx>2);
    case 'f': {
      const f=nd.f;
      if(f==='sqrt') return '√<span class="rad">'+tex(nd.a[0],0)+'</span>';
      if(f==='abs')  return '|'+tex(nd.a[0],0)+'|';
      const args = nd.a.map(x=>tex(x,0)).join('<span class="op">,</span> ');
      return '<span class="fn">'+f+'</span>('+args+')';
    }
    case 'b': {
      const {o,a,b}=nd;
      if(o==='/') return wrap('<span class="frac"><span class="nm">'+tex(a,0)+'</span><span class="den">'+tex(b,0)+'</span></span>', ctx>=3);
      if(o==='^') return tex(a,4)+'<sup>'+tex(b,0)+'</sup>';
      if(o==='*'){
        const dot = (a.t==='n' && b.t==='n') ? '<span class="op">·</span>' : '';
        const gap = dot ? '' : '<span style="display:inline-block;width:.16em"></span>';
        return wrap(tex(a,2)+dot+gap+tex(b,2), ctx>2);
      }
      const sign = o==='+' ? '+' : '−';
      return wrap(tex(a,1)+'<span class="op">'+sign+'</span>'+tex(b,2), ctx>1);
    }
  }
  return '?';
}
const texEq = nd => '<span class="mth">'+tex(nd,0)+'</span>';

/* ---- AST → plain source, so derived fields can be written back into the inputs ---- */
function astToSource(nd, ctx){
  ctx = ctx || 0;
  const wrap = (s,need) => need ? '('+s+')' : s;
  switch(nd.t){
    case 'n': {
      const v=nd.v;
      let s = Number.isInteger(v) ? String(v) : String(parseFloat(v.toPrecision(12)));
      return wrap(s, v<0 && ctx>=2);
    }
    case 'v': return nd.n;
    case 'u': return wrap('-'+astToSource(nd.a,2), ctx>2);
    case 'f': return nd.f+'('+nd.a.map(x=>astToSource(x,0)).join(', ')+')';
    case 'b': {
      const {o,a,b}=nd;
      if(o==='^') return wrap(astToSource(a,4)+'^'+astToSource(b,3), ctx>3);
      if(o==='*'||o==='/') return wrap(astToSource(a,2)+o+astToSource(b,3), ctx>2);
      return wrap(astToSource(a,1)+o+astToSource(b,2), ctx>1);
    }
  }
  return '0';
}
