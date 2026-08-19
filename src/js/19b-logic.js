/* ============================================================================
   1b · PROOF, LOGIC & SETS — the propositional half   (Programme C wing C1)

   The site has a formal layer of definitions, theorems and proofs across every
   wing, and nothing anywhere that teaches a reader how to READ one. This is
   that missing page, and the first thing it needs is a machine that decides
   propositional truth — because the whole of "and", "or", "not", "if" and
   "if and only if" is finite, and a finite thing can be checked exhaustively.

   Two routes to every claim, and here they are unusually far apart:

     route A   enumerate the 2^n assignments and evaluate the formula on each
     route B   convert to conjunctive normal form and look for a complementary
               pair of literals in every clause — a decision made by SYNTAX,
               which never evaluates the formula at any assignment at all

   A CNF is valid exactly when every clause contains some variable together
   with its negation, so route B is not an approximation to route A: both are
   exact, and they share no code below the parser. When they disagree the
   parser is wrong, and nothing else can be.

   Everything is prefixed pf (proof). The caps exist because a truth table is
   2^n rows and a distribution to CNF is worse: an unbounded loop whose trip
   count is a reader's slider is a hang waiting for its input.
   ============================================================================ */

/* 6 variables is 64 rows — the most a table can show and still be read. */
const PF_MAX_VARS = 6;
/* distributing an NNF into CNF is exponential in the worst case, and the worst
   case is a formula a reader can easily type: (p₁∧q₁)∨(p₂∧q₂)∨… . Refuse
   loudly rather than truncating — a truncated clause list would make an
   invalid formula look valid, which is the one direction that must never
   happen silently. */
const PF_CNF_CAP = 6000;

/* ---- the lexer -----------------------------------------------------------
   Accepts what a reader will actually type: Unicode operators, the ASCII
   spellings of each, and the words. Identifiers are propositional variables,
   so `rain -> wet` parses and reads like the sentence it stands for. */
const PF_WORDS = { and:'and', or:'or', not:'not', xor:'xor', iff:'iff',
                   implies:'imp', 'true':'top', 'false':'bot' };
const PF_CHARS = { '¬':'not', '~':'not', '!':'not',
                   '∧':'and', '&':'and',
                   '∨':'or', '|':'or',
                   '→':'imp', '⇒':'imp', '⊃':'imp',
                   '↔':'iff', '⇔':'iff', '≡':'iff',
                   '⊕':'xor', '⊻':'xor', '^':'xor',   /* ^ is exclusive or here — this language has no exponent */
                   '⊤':'top', '⊥':'bot',
                   '(':'(', ')':')' };
function pfLex(src){
  const s = String(src === undefined || src === null ? '' : src);
  const out = [];
  let i = 0;
  while(i < s.length){
    const c = s[i];
    if(/\s/.test(c)){ i++; continue; }
    if(s.startsWith('<->', i) || s.startsWith('<=>', i)){ out.push({ t:'iff', at:i }); i += 3; continue; }
    if(s.startsWith('->', i) || s.startsWith('=>', i)){ out.push({ t:'imp', at:i }); i += 2; continue; }
    if(s.startsWith('&&', i)){ out.push({ t:'and', at:i }); i += 2; continue; }
    if(s.startsWith('||', i)){ out.push({ t:'or', at:i }); i += 2; continue; }
    if(s.startsWith('/\\', i)){ out.push({ t:'and', at:i }); i += 2; continue; }
    if(s.startsWith('\\/', i)){ out.push({ t:'or', at:i }); i += 2; continue; }
    if(PF_CHARS[c]){ out.push({ t:PF_CHARS[c], at:i }); i++; continue; }
    const m = /^[A-Za-z][A-Za-z0-9_]*/.exec(s.slice(i));
    if(m){
      const w = m[0], k = PF_WORDS[w.toLowerCase()];
      if(k) out.push({ t:k, at:i });
      else if(w === 'T') out.push({ t:'top', at:i });
      else if(w === 'F') out.push({ t:'bot', at:i });
      else out.push({ t:'var', name:w, at:i });
      i += w.length; continue;
    }
    return { ok:false, why:'I cannot read “' + c + '” at character ' + (i + 1) +
             ' — the operators are ¬ ∧ ∨ → ↔, or ~ & | -> <->' };
  }
  return { ok:true, toks:out };
}

/* ---- the parser ----------------------------------------------------------
   Precedence, loosest last: ↔ , → (right associative), ⊕ , ∨ , ∧ , ¬ .
   It never throws: every failure comes back as {ok:false, why} with the
   character position, because a half-typed formula must leave the picture
   alone and say why rather than blanking it. */
function pfParse(src){
  const L = pfLex(src);
  if(!L.ok) return { ok:false, why:L.why };
  const T = L.toks;
  if(!T.length) return { ok:false, why:'nothing to read yet — try p → q' };
  let i = 0;
  let bad = null;
  const fail = why => { if(!bad) bad = why; return { t:'bot' }; };
  const peek = () => (i < T.length ? T[i].t : 'end');
  const atom = () => {
    const tk = T[i];
    if(!tk) return fail('the formula stops in the middle — something is missing after the last operator');
    if(tk.t === 'var'){ i++; return { t:'var', name:tk.name }; }
    if(tk.t === 'top' || tk.t === 'bot'){ i++; return { t:tk.t }; }
    if(tk.t === 'not'){ i++; return { t:'not', a:atom() }; }
    if(tk.t === '('){
      i++;
      const a = iff();
      if(peek() !== ')') return fail('a bracket opened and never closed');
      i++;
      return a;
    }
    i++;
    return fail('I did not expect that operator at character ' + (tk.at + 1) +
                ' — an operator needs a formula on each side of it');
  };
  const bin = (next, kinds) => () => {
    let a = next();
    while(kinds.indexOf(peek()) >= 0){ const k = peek(); i++; a = { t:k, a, b:next() }; }
    return a;
  };
  const and = bin(atom, ['and']);
  const or = bin(and, ['or']);
  const xor = bin(or, ['xor']);
  /* → is right associative: p → q → r means p → (q → r) */
  const imp = () => {
    const a = xor();
    if(peek() === 'imp'){ i++; return { t:'imp', a, b:imp() }; }
    return a;
  };
  const iff = () => {
    let a = imp();
    while(peek() === 'iff'){ i++; a = { t:'iff', a, b:imp() }; }
    return a;
  };
  const ast = iff();
  if(bad) return { ok:false, why:bad };
  if(i < T.length)
    return { ok:false, why:'I read a whole formula and then found more at character ' +
             (T[i].at + 1) + ' — a missing operator, or one bracket too many' };
  const vars = pfVars(ast);
  if(vars.length > PF_MAX_VARS)
    return { ok:false, why:vars.length + ' different letters — the table would be ' +
             Math.pow(2, vars.length) + ' rows, and ' + PF_MAX_VARS + ' letters (' +
             Math.pow(2, PF_MAX_VARS) + ' rows) is the most that can be read' };
  return { ok:true, ast, vars, why:'' };
}

/* the variables, sorted: the table's column order must not depend on how the
   formula was written, or two equivalent formulas draw two different tables */
function pfVars(ast){
  const seen = {};
  (function walk(n){
    if(!n) return;
    if(n.t === 'var'){ seen[n.name] = 1; return; }
    walk(n.a); walk(n.b);
  })(ast);
  return Object.keys(seen).sort();
}

/* ---- route A: evaluate ---------------------------------------------------- */
function pfEval(n, env){
  switch(n.t){
    case 'var': return !!env[n.name];
    case 'top': return true;
    case 'bot': return false;
    case 'not': return !pfEval(n.a, env);
    case 'and': return pfEval(n.a, env) && pfEval(n.b, env);
    case 'or':  return pfEval(n.a, env) || pfEval(n.b, env);
    case 'xor': return pfEval(n.a, env) !== pfEval(n.b, env);
    case 'imp': return !pfEval(n.a, env) || pfEval(n.b, env);
    case 'iff': return pfEval(n.a, env) === pfEval(n.b, env);
  }
  return false;
}
/* the environment for row r: the leftmost variable is the most significant
   bit, so the rows read down in the order a textbook prints them — all true
   first, all false last */
function pfEnvOf(vars, r){
  const env = {}, n = vars.length;
  for(let j = 0; j < n; j++) env[vars[j]] = !((r >> (n - 1 - j)) & 1);
  return env;
}
function pfTable(ast, vars){
  const V = vars || pfVars(ast), rows = [];
  const N = Math.pow(2, V.length);
  let t = 0;
  for(let r = 0; r < N; r++){
    const env = pfEnvOf(V, r);
    const val = pfEval(ast, env);
    if(val) t++;
    rows.push({ env, val, bits:V.map(v => env[v]) });
  }
  return { vars:V, rows, trueRows:t, falseRows:N - t,
           kind: t === N ? 'tautology' : (t === 0 ? 'contradiction' : 'contingent') };
}

/* ---- route B: normal form, decided by syntax -----------------------------
   pfNNF removes → ↔ ⊕ and pushes every negation down onto the variables; pfCNF
   then distributes ∨ over ∧. Neither ever asks what a variable's value is. */
function pfNNF(n, neg){
  switch(n.t){
    case 'var': return { t:'lit', name:n.name, neg:!!neg };
    case 'top': return { t: neg ? 'bot' : 'top' };
    case 'bot': return { t: neg ? 'top' : 'bot' };
    case 'not': return pfNNF(n.a, !neg);
    case 'and': return { t: neg ? 'or' : 'and', a:pfNNF(n.a, neg), b:pfNNF(n.b, neg) };
    case 'or':  return { t: neg ? 'and' : 'or', a:pfNNF(n.a, neg), b:pfNNF(n.b, neg) };
    case 'imp': return neg ? { t:'and', a:pfNNF(n.a, false), b:pfNNF(n.b, true) }
                           : { t:'or',  a:pfNNF(n.a, true),  b:pfNNF(n.b, false) };
    case 'iff': return neg ? { t:'or',  a:{ t:'and', a:pfNNF(n.a, false), b:pfNNF(n.b, true) },
                                        b:{ t:'and', a:pfNNF(n.a, true),  b:pfNNF(n.b, false) } }
                           : { t:'and', a:{ t:'or', a:pfNNF(n.a, true),  b:pfNNF(n.b, false) },
                                        b:{ t:'or', a:pfNNF(n.a, false), b:pfNNF(n.b, true) } };
    case 'xor': return pfNNF({ t:'iff', a:n.a, b:n.b }, !neg);
  }
  return { t:'bot' };
}
/* a clause is a list of literals; a CNF is a list of clauses. A literal
   repeated inside one clause is dropped (p ∨ p is p) and that is the ONLY
   simplification made — removing a clause could turn an invalid formula into a
   valid-looking one, which is the direction that must never happen. */
function pfClauseMerge(c1, c2){
  const out = c1.slice();
  for(const l of c2) if(!out.some(m => m.name === l.name && m.neg === l.neg)) out.push(l);
  return out;
}
function pfCNF(nnf, cap){
  const lim = cap || PF_CNF_CAP;
  let over = false;
  const go = n => {
    if(over) return [];
    switch(n.t){
      case 'lit': return [[{ name:n.name, neg:n.neg }]];
      /* ⊤ is the empty conjunction: no clauses to satisfy, and vacuously
         valid. ⊥ is the empty clause, which contains no complementary pair,
         so validity correctly fails on it. */
      case 'top': return [];
      case 'bot': return [[]];
      case 'and': { const A = go(n.a), B = go(n.b);
                    if(A.length + B.length > lim){ over = true; return []; }
                    return A.concat(B); }
      case 'or': {
        const A = go(n.a), B = go(n.b);
        if(A.length * B.length > lim){ over = true; return []; }
        const out = [];
        for(const a of A) for(const b of B) out.push(pfClauseMerge(a, b));
        return out;
      }
    }
    return [[]];
  };
  const clauses = go(nnf);
  return { clauses, overflow:over };
}
/* a clause is valid iff it holds a variable beside its own negation; a CNF is
   valid iff every clause is. This is the whole of route B. */
const pfClauseValid = c => c.some(l => c.some(m => m.name === l.name && m.neg !== l.neg));
const pfCNFValid = cl => cl.every(pfClauseValid);
/* clause form, typeset for a panel */
const pfClauseText = c => c.length
  ? '(' + c.map(l => (l.neg ? '¬' : '') + l.name).join(' ∨ ') + ')'
  : '(⊥)';
const pfCNFText = (cl, max) => cl.length
  ? cl.slice(0, max || 8).map(pfClauseText).join(' ∧ ') +
    (cl.length > (max || 8) ? ' ∧ … (' + (cl.length - (max || 8)) + ' more)' : '')
  : '⊤ — no clauses at all, which is what a tautology reduces to';

/* ---- the two routes, run against each other ------------------------------ */
function pfClassify(src){
  const P = pfParse(src);
  if(!P.ok) return { ok:false, why:P.why };
  const T = pfTable(P.ast, P.vars);
  const C = pfCNF(pfNNF(P.ast, false));
  const D = pfCNF(pfNNF(P.ast, true));   /* the negation: valid iff the formula is a contradiction */
  const byCNF = C.overflow ? null : pfCNFValid(C.clauses);
  const negByCNF = D.overflow ? null : pfCNFValid(D.clauses);
  const kindCNF = byCNF === null || negByCNF === null ? null
                : (byCNF ? 'tautology' : (negByCNF ? 'contradiction' : 'contingent'));
  return { ok:true, ast:P.ast, vars:P.vars, table:T, kind:T.kind,
           clauses:C.clauses, overflow:C.overflow || D.overflow,
           kindCNF, agree: kindCNF === null || kindCNF === T.kind };
}
/* equivalence. Route A finds the assignment where they differ; route B asks
   whether the biconditional is valid without assigning anything at all. */
function pfEquiv(srcA, srcB){
  const A = pfParse(srcA), B = pfParse(srcB);
  if(!A.ok) return { ok:false, why:A.why, which:'a' };
  if(!B.ok) return { ok:false, why:B.why, which:'b' };
  const vars = pfVars({ t:'and', a:A.ast, b:B.ast });
  if(vars.length > PF_MAX_VARS)
    return { ok:false, why:'the two formulas use ' + vars.length + ' letters between them, and ' +
             PF_MAX_VARS + ' is the most a table can show', which:'a' };
  const N = Math.pow(2, vars.length);
  const rows = [];
  let same = true, counter = null, agreeRows = 0;
  for(let r = 0; r < N; r++){
    const env = pfEnvOf(vars, r);
    const va = pfEval(A.ast, env), vb = pfEval(B.ast, env);
    rows.push({ env, a:va, b:vb, agree:va === vb });
    if(va === vb) agreeRows++;
    else { same = false; if(!counter) counter = { env, a:va, b:vb }; }
  }
  const C = pfCNF(pfNNF({ t:'iff', a:A.ast, b:B.ast }, false));
  const byCNF = C.overflow ? null : pfCNFValid(C.clauses);
  return { ok:true, vars, rows, rowCount:N, agreeRows, equal:same, counter,
           astA:A.ast, astB:B.ast, clauses:C.clauses, overflow:C.overflow, byCNF,
           agree: byCNF === null || byCNF === same };
}
/* ---- the display copy of a formula ---------------------------------------
   The parser reads ASCII and Unicode alike, and the ASCII spellings are what a
   reader types — but SITE-RULES §4 is about what is displayed, and `p -> q` in
   a readout is an ASCII stand-in for `p → q`. One converter rather than a
   display string beside every source string: the table's entries and the
   reader's own typing both come through here, so neither can be forgotten.
   The reverse is never done — the editable box keeps exactly what was typed,
   because a box whose contents cannot be read back is the fmtNum defect in
   another spelling. */
function pfPretty(src){
  return String(src === undefined || src === null ? '' : src)
    .replace(/<->|<=>/g, '↔').replace(/->|=>/g, '→')
    .replace(/&&|\/\\|&/g, '∧').replace(/\|\||\\\/|\|/g, '∨')
    .replace(/~|!/g, '¬').replace(/\^/g, '⊕')
    .replace(/\bT\b/g, '⊤').replace(/\bF\b/g, '⊥')
    .replace(/\band\b/gi, '∧').replace(/\bor\b/gi, '∨').replace(/\bnot\b/gi, '¬');
}

/* how a counterexample reads in words — a readout must not print a row index
   and call that an explanation */
const pfEnvWords = env => Object.keys(env).sort()
  .map(k => k + ' = ' + (env[k] ? 'true' : 'false')).join(', ');

/* ---- the laws, as claims a gate can recompute ----------------------------
   Every row declares `equiv`, and nothing in the wing reads that flag to
   decide anything — both routes recompute it, and ./auditclaims.ps1 recomputes
   it a third time. Four rows are deliberately FALSE: the converse, the
   inverse, the mis-remembered De Morgan and affirming the consequent, which
   between them are the commonest invalid steps in print. */
const PF_LAWS = {
  implication: { name:'→ is not primitive', a:'p -> q', b:'~p | q', equiv:true,
    ex:'p → q  ≡  ¬p ∨ q',
    why:'"If p then q" says nothing about causation and nothing about time. It says only: not(p and not q). That is the entire content of →, and it is why a false premise makes the whole implication true — a fact that reads as a trick until you see it as this disjunction.' },
  contrapositive: { name:'the contrapositive', a:'p -> q', b:'~q -> ~p', equiv:true,
    ex:'p → q  ≡  ¬q → ¬p',
    why:'The one rewriting that is always legal, and the workhorse of real proofs: to show "if n² is even then n is even", show instead "if n is odd then n² is odd", which is a direct computation.' },
  converse: { name:'the converse — NOT equivalent', a:'p -> q', b:'q -> p', equiv:false,
    ex:'p → q  vs  q → p',
    why:'Swapping the halves of an implication changes what it says. They part on both of the mixed rows — p true with q false, and p false with q true — and the second of those is where every argument that confuses a statement with its converse goes wrong.' },
  inverse: { name:'the inverse — NOT equivalent', a:'p -> q', b:'~p -> ~q', equiv:false,
    ex:'p → q  vs  ¬p → ¬q',
    why:'Negating both halves without swapping them is the converse in disguise — it is the contrapositive OF the converse — and it parts from p → q on the same two mixed rows. "If it rains the match is off" tells you nothing about a dry day.' },
  deMorganAnd: { name:'De Morgan, for ∧', a:'~(p & q)', b:'~p | ~q', equiv:true,
    ex:'¬(p ∧ q)  ≡  ¬p ∨ ¬q',
    why:'A negation crossing a connective flips it. "Not both" means "at least one fails" — not "both fail".' },
  deMorganOr: { name:'De Morgan, for ∨', a:'~(p | q)', b:'~p & ~q', equiv:true,
    ex:'¬(p ∨ q)  ≡  ¬p ∧ ¬q',
    why:'The other half, and the one that keeps its shape: "neither" means "not this and not that".' },
  deMorganWrong: { name:'the mis-remembered De Morgan — NOT equivalent', a:'~(p & q)', b:'~p & ~q', equiv:false,
    ex:'¬(p ∧ q)  vs  ¬p ∧ ¬q',
    why:'Forgetting to flip the connective is the commonest slip in elementary logic, and the table shows what it costs: the two disagree on two of the four rows.' },
  distribAndOr: { name:'∧ distributes over ∨', a:'p & (q | r)', b:'(p & q) | (p & r)', equiv:true,
    ex:'p ∧ (q ∨ r)  ≡  (p ∧ q) ∨ (p ∧ r)',
    why:'The same shape as a(b+c) = ab+ac, and the reason the set identity A∩(B∪C) = (A∩B)∪(A∩C) holds — that identity IS this law, read one element at a time.' },
  distribOrAnd: { name:'∨ distributes over ∧ — which × and + do not', a:'p | (q & r)', b:'(p | q) & (p | r)', equiv:true,
    ex:'p ∨ (q ∧ r)  ≡  (p ∨ q) ∧ (p ∨ r)',
    why:'Here the analogy with arithmetic breaks: a+(b·c) is not (a+b)(a+c). Logic is more symmetric than arithmetic, and this is where the resemblance stops being a guide.' },
  absorption: { name:'absorption', a:'p | (p & q)', b:'p', equiv:true,
    ex:'p ∨ (p ∧ q)  ≡  p',
    why:'q has vanished entirely. Worth seeing once, because it shows a formula can mention a variable whose value cannot possibly matter — and the table proves it by agreeing on every row.' },
  exportation: { name:'two premises, or one at a time', a:'(p & q) -> r', b:'p -> (q -> r)', equiv:true,
    ex:'(p ∧ q) → r  ≡  p → (q → r)',
    why:'The licence for the way every proof is actually written: assume the hypotheses one after another rather than as a lump.' },
  biconditional: { name:'↔ is two implications', a:'p <-> q', b:'(p -> q) & (q -> p)', equiv:true,
    ex:'p ↔ q  ≡  (p → q) ∧ (q → p)',
    why:'Which is why proving "if and only if" is always two jobs, and why a proof that does one of them has not proved half the statement — it has proved a different statement.' },
  xorIff: { name:'exclusive or', a:'p ^ q', b:'~(p <-> q)', equiv:true,
    ex:'p ⊕ q  ≡  ¬(p ↔ q)',
    why:'The "or" of ordinary speech — tea or coffee, not both. Mathematical ∨ is the inclusive one, and this is the formula for the other.' },
  doubleNeg: { name:'double negation', a:'~~p', b:'p', equiv:true,
    ex:'¬¬p  ≡  p',
    why:'Assumed by every proof by contradiction, and the one law intuitionistic logic declines to accept — which is why an existence proved by contradiction can leave you with no way to find the thing.' },
  modusPonens: { name:'modus ponens is a tautology', a:'((p -> q) & p) -> q', b:'T', equiv:true,
    ex:'((p → q) ∧ p) → q  ≡  ⊤',
    why:'The rule every proof uses, stated as a formula and then checked: true on all four rows, so it can never let a false conclusion out of true premises.' },
  affirmConseq: { name:'affirming the consequent — NOT a tautology', a:'((p -> q) & q) -> p', b:'T', equiv:false,
    ex:'((p → q) ∧ q) → p  vs  ⊤',
    why:'The invalid argument that looks like modus ponens. It fails on exactly one row — p false, q true — and that single row is the difference between an argument and a fallacy.' },
  modusTollens: { name:'modus tollens', a:'((p -> q) & ~q) -> ~p', b:'T', equiv:true,
    ex:'((p → q) ∧ ¬q) → ¬p  ≡  ⊤',
    why:'The contrapositive doing work: a failed conclusion refutes the hypothesis. This is the rule a proof by contradiction is built from.' },
  resolution: { name:'resolution', a:'((p | q) & (~p | r)) -> (q | r)', b:'T', equiv:true,
    ex:'((p ∨ q) ∧ (¬p ∨ r)) → (q ∨ r)  ≡  ⊤',
    why:'The one rule a mechanical prover needs, and the reason clause form is worth the trouble: cancel a variable against its negation and join what is left.' },
  excluded: { name:'the excluded middle', a:'p | ~p', b:'T', equiv:true,
    ex:'p ∨ ¬p  ≡  ⊤',
    why:'Not an observation about the world but a decision about the logic: this is a two-valued logic, and this formula is what "two-valued" means.' }
};

/* ============================================================================
   QUANTIFIERS — where the order of two symbols changes the meaning

   On a finite domain a quantifier is a loop, so both a quantified statement
   and its negation are decidable here, and the ∀∃ / ∃∀ asymmetry becomes
   something to look at rather than something to be warned about.

   Three routes:

     route A   short-circuiting nested loops, which also return the witness or
               the counterexample — the object a proof would have to produce
     route B   count, for each outer value, how many inner values work; then
               every one of the six statements is a statement about the counts
     route C   the negation identity ¬∀x∃y R ≡ ∃x∀y ¬R, evaluated on the
               negated relation with both quantifiers flipped
   ============================================================================ */
function pfGcd(a, b){ a = Math.abs(a); b = Math.abs(b); while(b){ const t = a % b; a = b; b = t; } return a; }

const PF_RELS = {
  lt:      { name:'x < y', ex:'x < y', f:(x, y) => x < y,
             why:'The relation to start with, because ∀x∃y and ∃y∀x differ on it in the most instructive way: on a finite domain the largest x has no y above it, so ∀x∃y is FALSE here — while on ℕ it would be true. The domain is part of the statement.' },
  leq:     { name:'x ≤ y', ex:'x ≤ y', f:(x, y) => x <= y,
             why:'One character apart from the row above, and true where that was false: the largest x still has y = x. Both quantified forms hold, and ∃y∀x is witnessed by the single value y = n.' },
  divides: { name:'x divides y', ex:'x | y', f:(x, y) => y % x === 0,
             why:'∀x∃y holds trivially (take y = x), and ∃y∀x asks for a common multiple of everything in the domain — which exists only if the domain happens to contain it. The witness appears and vanishes as you move n.' },
  coprime: { name:'gcd(x, y) = 1', ex:'gcd(x, y) = 1', f:(x, y) => pfGcd(x, y) === 1,
             why:'Symmetric, and the ∃y∀x form asks for a y coprime to everything — which fails as soon as y itself is in the domain, because gcd(y, y) = y. A quantified claim defeated by its own witness.' },
  sumEven: { name:'x + y is even', ex:'x + y ≡ 0 (mod 2)', f:(x, y) => (x + y) % 2 === 0,
             why:'An equivalence relation in disguise — same parity — and the relations stage builds its two classes. ∀x∃y holds; ∃y∀x cannot, because no single y has the parity of both an odd and an even number.' },
  square:  { name:'y = x²', ex:'y = x²', f:(x, y) => y === x * x,
             why:'A function drawn as a relation: exactly one y per x, and ∀x∃y is true precisely while x² stays inside the domain. Move n and watch it fail — a statement about a function that depends only on where you stopped looking.' },
  near:    { name:'|x − y| = 1', ex:'|x − y| = 1', f:(x, y) => Math.abs(x - y) === 1,
             why:'Sparse and symmetric, with no reflexive pairs at all, so it is neither an order nor an equivalence — three of the four property boxes come up empty on it.' }
};
/* the six quantified statements. `spec` is read by all three routes, so none
   of them can quietly answer a different question. */
const PF_QUANTS = {
  AA:  { lbl:'∀x ∀y R(x, y)', outer:'x', oq:'A', iq:'A',
         why:'The strongest of the six: every pair. It is refuted by a single pair, which is why a "for all" statement is attacked by looking for one counterexample.' },
  AEy: { lbl:'∀x ∃y R(x, y)', outer:'x', oq:'A', iq:'E',
         why:'"Everyone has someone." The y may depend on x, and that dependence is the whole difference from the row below it.' },
  EAx: { lbl:'∃y ∀x R(x, y)', outer:'y', oq:'E', iq:'A',
         why:'"Someone works for everyone." Now one y must serve every x at once. Same two symbols, other order, and a strictly stronger claim — the stage measures both and shows where they part.' },
  AEx: { lbl:'∀y ∃x R(x, y)', outer:'y', oq:'A', iq:'E',
         why:'The mirror of ∀x∃y, and on an asymmetric relation like x < y it comes out differently — which is worth seeing, because it is the same English sentence with the roles swapped.' },
  EAy: { lbl:'∃x ∀y R(x, y)', outer:'x', oq:'E', iq:'A',
         why:'The mirror of ∃y∀x. For x | y this asks for a single x dividing everything, which is x = 1 — a witness that exists for every n.' },
  EE:  { lbl:'∃x ∃y R(x, y)', outer:'x', oq:'E', iq:'E',
         why:'The weakest: one pair anywhere. Its negation is the strongest statement of the six, which is the cleanest illustration of what negation does to a quantifier.' }
};
/* route A: nested loops that short-circuit and hand back the object a proof
   would owe you — a witness for ∃, a counterexample for ∀ */
function pfQuantEval(R, n, spec){
  const holds = (a, b) => (spec.outer === 'x' ? !!R(a, b) : !!R(b, a));
  const inner = a => {
    if(spec.iq === 'E'){
      for(let b = 1; b <= n; b++) if(holds(a, b)) return { val:true, at:b };
      return { val:false, at:null };
    }
    for(let b = 1; b <= n; b++) if(!holds(a, b)) return { val:false, at:b };
    return { val:true, at:null };
  };
  if(spec.oq === 'A'){
    for(let a = 1; a <= n; a++){
      const I = inner(a);
      if(!I.val) return { val:false, outer:a, inner:I.at, kind:'counterexample' };
    }
    return { val:true, outer:null, inner:null, kind:'no counterexample exists' };
  }
  for(let a = 1; a <= n; a++){
    const I = inner(a);
    if(I.val) return { val:true, outer:a, inner:I.at, kind:'witness' };
  }
  return { val:false, outer:null, inner:null, kind:'no witness exists' };
}
/* route B: counts. Every one of the six statements is a statement about the
   list of counts, and this route evaluates no quantifier at all. */
function pfQuantCounts(R, n, spec){
  const holds = (a, b) => (spec.outer === 'x' ? !!R(a, b) : !!R(b, a));
  const counts = [];
  let total = 0;
  for(let a = 1; a <= n; a++){
    let c = 0;
    for(let b = 1; b <= n; b++) if(holds(a, b)) c++;
    counts.push(c); total += c;
  }
  const val = spec.oq === 'A'
    ? (spec.iq === 'E' ? counts.every(c => c > 0) : counts.every(c => c === n))
    : (spec.iq === 'E' ? counts.some(c => c > 0) : counts.some(c => c === n));
  return { counts, total, val };
}
/* route C: the quantified De Morgan, on the negated relation */
function pfQuantByNeg(R, n, spec){
  const flip = q => (q === 'A' ? 'E' : 'A');
  const D = pfQuantEval((x, y) => !R(x, y), n,
                        { outer:spec.outer, oq:flip(spec.oq), iq:flip(spec.iq) });
  return { val:!D.val, dual:D };
}
function pfQuantCheck(R, n, key){
  const spec = PF_QUANTS[key];
  const A = pfQuantEval(R, n, spec);
  const B = pfQuantCounts(R, n, spec);
  const C = pfQuantByNeg(R, n, spec);
  return { spec, key, A, B, C, val:A.val,
           agree: A.val === B.val && A.val === C.val };
}
/* every statement at once, so the ∀∃ / ∃∀ gap is a column of the readout */
function pfQuantAll(R, n){
  const out = {};
  for(const k of Object.keys(PF_QUANTS)) out[k] = pfQuantCheck(R, n, k);
  return out;
}
/* the pairs where R holds, for drawing — capped, because the grid is n² */
function pfRelGrid(R, n){
  const cells = [];
  for(let x = 1; x <= n; x++)
    for(let y = 1; y <= n; y++) if(R(x, y)) cells.push({ x, y });
  return cells;
}
/* a reader-supplied relation: R(x, y) holds where their expression is
   positive. Anything the field engine understands works, which makes `y - x`
   the order relation and `sin(x*y)` a relation with no name at all. */
function pfRelFromExpr(src){
  try {
    const g = compile(parse(String(src)));
    const f = (x, y) => {
      const v = g(x, y, 0);
      return Number.isFinite(v) && v > 0;
    };
    f(1, 1);   /* run it once here rather than inside a frame, where a throw would take the picture down */
    return { ok:true, f, why:'' };
  } catch(e){
    return { ok:false, f:() => false, why:String(e && e.message || e) };
  }
}
