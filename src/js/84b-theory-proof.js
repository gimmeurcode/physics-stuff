/* ============================================================================
   THEORY — PROOF, LOGIC AND SETS  (Programme C wing C1)

   Every other wing in this laboratory carries definitions, theorems and proofs
   in cards like the ones below. Nothing anywhere taught a reader how to read
   one. This essay is that missing page, and it is deliberately the only place
   in the site where the cards are ABOUT the machinery they are written in.
   ============================================================================ */
const THEORY_PROOF = `
<div class="toc"><a href="#p0">What a proof is for</a><a href="#p1">Statements and connectives</a>
<a href="#p2">Implication</a><a href="#p3">Quantifiers</a><a href="#p4">Negation</a>
<a href="#p5">Induction</a><a href="#p6">Contradiction</a><a href="#p7">Sets</a>
<a href="#p8">Functions</a><a href="#p9">Sizes of infinity</a><a href="#p10">How to read the cards</a></div>

<h3 id="p0">What a proof is for, and what it is not</h3>
<p>A proof is not a ritual of justification and it is not a certificate of sincerity. It is a chain of statements, each of which follows from earlier ones by rules agreed in advance, ending at the claim. Its value is entirely practical: it tells you <em>which</em> hypotheses were used, so you know exactly when the conclusion may be reused, and it covers infinitely many cases at once, which no amount of checking can.</p>
<p>That second point deserves a demonstration rather than a slogan. In the induction stage, the claim <span class="mth"><i>n</i>² + <i>n</i> + 41</span> is prime holds for <span class="mth"><i>n</i> = 0, 1, …, 39</span> — forty consecutive confirmations — and fails at 40. The claim <span class="mth">Σ<i>k</i> = <i>n</i>(<i>n</i>+1)/2 + 1</span> has an inductive step that is completely valid at every single <span class="mth"><i>n</i></span>, and is false for every <span class="mth"><i>n</i></span>, because its base case fails. Checking and proving are different activities, and this wing is built so you can watch them disagree.</p>
<p>The rest of the laboratory is the payoff. Once you can read "for every ε there is a δ" and know that the δ may depend on the ε, the definition of continuity stops being a formula to memorise and becomes a sentence with a meaning you can attack.</p>

<h3 id="p1">Statements, and the five connectives</h3>
<p>A <em>statement</em> is something that is true or false. Not a question, not an expression: <span class="mth"><i>x</i>² + 1</span> is not a statement, while <span class="mth"><i>x</i>² + 1 &gt; 0 for every real <i>x</i></span> is one, and a true one. Compound statements are built with five connectives, and each is <em>defined</em> by what it does on every combination of inputs — which is why a truth table is not evidence about a connective but its definition.</p>

${stDefn('The connectives', `
<p>For statements <span class="mth"><i>p</i></span> and <span class="mth"><i>q</i></span>:</p>
${stEq('¬<i>p</i> — true exactly when <i>p</i> is false<br>' +
       '<i>p</i> ∧ <i>q</i> — true exactly when both are<br>' +
       '<i>p</i> ∨ <i>q</i> — true exactly when at least one is<br>' +
       '<i>p</i> → <i>q</i> — false only when <i>p</i> is true and <i>q</i> false<br>' +
       '<i>p</i> ↔ <i>q</i> — true exactly when they agree')}
<p>Two compound statements are <em>logically equivalent</em>, written <span class="mth">≡</span>, when they take the same value on every assignment of truth values to the letters.</p>`,
  { note:'∨ is <em>inclusive</em>: "p or q" is true when both hold. Ordinary speech usually means the exclusive one, which is written ⊕ and is ¬(p ↔ q).',
    see:'proof:pfTable', seeLabel:'Every assignment, drawn' })}

<p>With <span class="mth"><i>n</i></span> letters there are <span class="mth">2<sup><i>n</i></sup></span> assignments, so equivalence between two formulas is a <em>finite</em> question, and the truth-table stage settles it by looking at all of them. It also settles it a second way, by a route worth knowing about.</p>

<h3 id="p2">Implication, which is the one people find strange</h3>
<p>Everything unintuitive about → follows from one decision: it is <em>truth-functional</em>. Its value depends only on the truth values of its two halves, not on whether they are about the same subject, and not on any notion of cause. "If 2 + 2 = 5 then I am the Pope" is a true implication, and nothing is wrong.</p>

${stThm('Implication is a disjunction in disguise', {
  hyp:'<span class="mth"><i>p</i>, <i>q</i></span> statements',
  then:'',
  eq:'<i>p</i> <span class="op">→</span> <i>q</i> &nbsp;≡&nbsp; ¬<i>p</i> <span class="op">∨</span> <i>q</i> &nbsp;≡&nbsp; ¬(<i>p</i> <span class="op">∧</span> ¬<i>q</i>)',
  proof:`<p>Both sides are false exactly when <span class="mth"><i>p</i></span> is true and <span class="mth"><i>q</i></span> false, and true on the other three assignments. Since a two-letter formula is determined by its value on those four rows, they are equivalent.</p>
<p>The third form is the one to carry: <span class="mth"><i>p</i> → <i>q</i></span> asserts nothing more than that the case "<span class="mth"><i>p</i></span> true and <span class="mth"><i>q</i></span> false" does not occur.</p>`,
  note:'This is why a statement with a false hypothesis is called <em>vacuously true</em>: it forbids one combination, and that combination cannot arise.',
  see:'proof:pfTable', seeLabel:'The rows, with the clause form beside them' })}

${stThm('The contrapositive, and the two impostors', {
  hyp:'<span class="mth"><i>p</i>, <i>q</i></span> statements',
  then:'the first pair are equivalent and the second two are not',
  eq:'<i>p</i> <span class="op">→</span> <i>q</i> &nbsp;≡&nbsp; ¬<i>q</i> <span class="op">→</span> ¬<i>p</i> &nbsp;&nbsp;&nbsp; but &nbsp;&nbsp;&nbsp; <i>p</i> <span class="op">→</span> <i>q</i> &nbsp;≢&nbsp; <i>q</i> <span class="op">→</span> <i>p</i>',
  proof:`<p>By the theorem above, <span class="mth"><i>p</i> → <i>q</i></span> is <span class="mth">¬<i>p</i> ∨ <i>q</i></span> and <span class="mth">¬<i>q</i> → ¬<i>p</i></span> is <span class="mth"><i>q</i> ∨ ¬<i>p</i></span>. Since ∨ is commutative these are the same formula, so the equivalence holds without needing the table at all.</p>
<p>For the converse, take <span class="mth"><i>p</i></span> false and <span class="mth"><i>q</i></span> true: then <span class="mth"><i>p</i> → <i>q</i></span> is true and <span class="mth"><i>q</i> → <i>p</i></span> is false. One assignment is enough, because a claim of equivalence is a claim about all of them.</p>`,
  note:'Proving the contrapositive instead of the statement is not a trick or a weaker result — it is the same statement. Proving the <em>converse</em> instead is proving something else.',
  see:'proof:pfTable', seeLabel:'The row that separates them' })}

<h3 id="p3">Quantifiers, and why their order is not a matter of style</h3>
<p>Almost every real mathematical statement quantifies. <span class="mth">∀<i>x</i></span> means "for every <span class="mth"><i>x</i></span> in the domain" and <span class="mth">∃<i>y</i></span> means "there is at least one <span class="mth"><i>y</i></span>". The domain is part of the statement: <span class="mth">∀<i>x</i> ∃<i>y</i> : <i>x</i> &lt; <i>y</i></span> is true over ℕ and false over <span class="mth">{1, …, 6}</span>, and the quantifier stage shows exactly which element refutes it.</p>

${stThm('∃∀ is strictly stronger than ∀∃', {
  hyp:'<span class="mth"><i>R</i></span> a relation on a set <span class="mth"><i>S</i></span>',
  then:'',
  eq:'(∃<i>y</i> ∀<i>x</i> : <i>R</i>(<i>x</i>, <i>y</i>)) &nbsp;<span class="op">⟹</span>&nbsp; (∀<i>x</i> ∃<i>y</i> : <i>R</i>(<i>x</i>, <i>y</i>)) &nbsp;&nbsp;&nbsp; and the converse fails',
  proof:`<p>Suppose some <span class="mth"><i>y</i>₀</span> satisfies <span class="mth"><i>R</i>(<i>x</i>, <i>y</i>₀)</span> for every <span class="mth"><i>x</i></span>. Given any <span class="mth"><i>x</i></span>, that same <span class="mth"><i>y</i>₀</span> witnesses the inner ∃. So the implication holds.</p>
<p>For the failure of the converse, take <span class="mth"><i>S</i> = {1, …, <i>n</i>}</span> and <span class="mth"><i>R</i>(<i>x</i>, <i>y</i>)</span> to be <span class="mth"><i>x</i> ≤ <i>y</i></span> with the roles as in the stage: every <span class="mth"><i>x</i></span> has a partner, and on the relation <span class="mth"><i>x</i> &lt; <i>y</i></span> no single <span class="mth"><i>y</i></span> serves them all. The witness must depend on <span class="mth"><i>x</i></span>, and that dependence is the entire difference.</p>`,
  note:'Continuity says: for each x and each ε there is a δ. <em>Uniform</em> continuity moves the δ outside the ∀x, and that single move is the whole distinction — the same move as here.',
  see:'proof:pfQuant', seeLabel:'Both orders, on one grid' })}

${stThm('Negation flips every quantifier', {
  hyp:'<span class="mth"><i>P</i></span> a property',
  then:'',
  eq:'¬(∀<i>x</i> : <i>P</i>(<i>x</i>)) ≡ ∃<i>x</i> : ¬<i>P</i>(<i>x</i>) &nbsp;&nbsp;&nbsp;&nbsp; ¬(∃<i>x</i> : <i>P</i>(<i>x</i>)) ≡ ∀<i>x</i> : ¬<i>P</i>(<i>x</i>)',
  proof:`<p>"Not every x has P" says precisely that some x fails it, and "no x has P" says precisely that every x fails it. On a finite domain both are De Morgan's laws applied to a long conjunction and a long disjunction respectively, since <span class="mth">∀</span> over <span class="mth">{1,…,n}</span> is <span class="mth"><i>P</i>(1) ∧ ⋯ ∧ <i>P</i>(n)</span>.</p>
<p>Applying the rule to a nested statement flips each quantifier in turn: <span class="mth">¬∀<i>x</i>∃<i>y</i> <i>R</i></span> is <span class="mth">∃<i>x</i>∀<i>y</i> ¬<i>R</i></span>.</p>`,
  note:'This is how a definition becomes usable. "f is not continuous at a" is not a vaguer statement than continuity — it is ∃ε ∀δ ∃x with the inequality reversed, and that form tells you exactly what to construct.',
  see:'proof:pfQuant', seeLabel:'The negated dual, computed' })}

<h3 id="p4">Two shapes of counterexample</h3>
<p>Because of the negation rule, refuting a statement means proving a different one, and its shape tells you what to produce. To refute <span class="mth">∀<i>x</i> : <i>P</i>(<i>x</i>)</span> you must exhibit one <span class="mth"><i>x</i></span> — a single object, and the argument is over. To refute <span class="mth">∃<i>x</i> : <i>P</i>(<i>x</i>)</span> you must prove something about every <span class="mth"><i>x</i></span>, which is usually much harder. That asymmetry is why "find a counterexample" is good advice for a universal claim and useless for an existential one.</p>

<h3 id="p5">Induction: two finite checks, infinitely many conclusions</h3>

${stDefn('The principle of mathematical induction', `
<p>Let <span class="mth"><i>P</i>(<i>n</i>)</span> be a statement about integers <span class="mth"><i>n</i> ≥ <i>n</i>₀</span>. If</p>
${stEq('<i>P</i>(<i>n</i>₀) holds &nbsp;&nbsp; and &nbsp;&nbsp; <i>P</i>(<i>n</i>) <span class="op">⟹</span> <i>P</i>(<i>n</i><span class="op">+</span>1) for every <i>n</i> ≥ <i>n</i>₀')}
<p>then <span class="mth"><i>P</i>(<i>n</i>)</span> holds for every <span class="mth"><i>n</i> ≥ <i>n</i>₀</span>.</p>`,
  { note:'It is not an observation about dominoes but an axiom about ℕ, equivalent to the statement that every non-empty set of positive integers has a least member — which is what the descent argument below uses instead.',
    see:'proof:pfInduct', seeLabel:'The dominoes, and the two verdicts' })}

<p>Both hypotheses are load-bearing, and the stage carries a claim that fails each way. <span class="mth">Σ<i>k</i> = <i>n</i>(<i>n</i>+1)/2 + 1</span> has a perfect inductive step — the added constant cancels in the difference — and no base case, so it is false everywhere. <span class="mth">2<sup><i>n</i></sup> &gt; <i>n</i>²</span> has a base case at <span class="mth"><i>n</i> = 1</span> and then fails at 2, 3 and 4, because the step needs <span class="mth">2<i>n</i>² ≥ (<i>n</i>+1)²</span>, which is only true from <span class="mth"><i>n</i> = 3</span>; starting the chain at 5 fixes it.</p>

${stThm('The sum of the first n odd numbers', {
  hyp:'<span class="mth"><i>n</i> ≥ 1</span>',
  then:'',
  eq:'1 <span class="op">+</span> 3 <span class="op">+</span> ⋯ <span class="op">+</span> (2<i>n</i><span class="op">−</span>1) <span class="op">=</span> <i>n</i>²',
  proof:`<p><em>Base.</em> At <span class="mth"><i>n</i> = 1</span> the left side is 1 and the right side is 1.</p>
<p><em>Step.</em> Assume the identity at <span class="mth"><i>n</i></span>. The next term is <span class="mth">2(<i>n</i>+1) − 1 = 2<i>n</i>+1</span>, so the new sum is <span class="mth"><i>n</i>² + 2<i>n</i> + 1 = (<i>n</i>+1)²</span>, which is the identity at <span class="mth"><i>n</i>+1</span>.</p>
<p>By induction it holds for every <span class="mth"><i>n</i> ≥ 1</span>.</p>`,
  note:'The step is the L-shaped border that grows an n×n square into an (n+1)×(n+1) one, so the picture is the proof and the induction is the bookkeeping.',
  see:'proof:pfInduct', seeLabel:'Every domino standing' })}

<h3 id="p6">Contradiction, and the descent</h3>
<p>To prove <span class="mth"><i>p</i></span> by contradiction, assume <span class="mth">¬<i>p</i></span> and derive something false. The step at the end — concluding <span class="mth"><i>p</i></span> from <span class="mth">¬¬<i>p</i></span> — is double negation, and it is the one law of classical logic that constructive mathematics declines, precisely because an existence proved this way leaves you with nothing to point at.</p>

${stThm('√2 is irrational', {
  hyp:'',
  then:'there are no positive integers <span class="mth"><i>p</i>, <i>q</i></span> with <span class="mth"><i>p</i>² = 2<i>q</i>²</span>',
  eq:'',
  proof:`<p><em>By descent.</em> Suppose some pair exists. Among all such pairs choose one with <span class="mth"><i>q</i></span> least — legitimate because every non-empty set of positive integers has a least member.</p>
<p>Set <span class="mth"><i>p</i>′ = 2<i>q</i> − <i>p</i></span> and <span class="mth"><i>q</i>′ = <i>p</i> − <i>q</i></span>. Since <span class="mth">1 &lt; <i>p</i>/<i>q</i> &lt; 2</span>, both are positive, and <span class="mth"><i>q</i>′ &lt; <i>q</i></span>. Expanding,</p>
${stEq('<i>p</i>′² <span class="op">−</span> 2<i>q</i>′² <span class="op">=</span> (2<i>q</i><span class="op">−</span><i>p</i>)² <span class="op">−</span> 2(<i>p</i><span class="op">−</span><i>q</i>)² <span class="op">=</span> <span class="op">−</span>(<i>p</i>² <span class="op">−</span> 2<i>q</i>²) <span class="op">=</span> 0')}
<p>so <span class="mth">(<i>p</i>′, <i>q</i>′)</span> is another solution with a smaller <span class="mth"><i>q</i></span>, contradicting minimality. Hence no solution exists.</p>
<p><em>The parity proof, for comparison.</em> If <span class="mth"><i>p</i>² = 2<i>q</i>²</span> with the fraction in lowest terms, then <span class="mth"><i>p</i>²</span> is even, so <span class="mth"><i>p</i></span> is even, so <span class="mth"><i>p</i>²</span> is divisible by 4, so <span class="mth"><i>q</i>²</span> is even, so <span class="mth"><i>q</i></span> is even — contradicting lowest terms.</p>`,
  note:'The descent map is drawn in the stage, running 17/12 → 7/5 → 3/2 → 1/1 and preserving p² − 2q² exactly, which is why it halts at 1 rather than at 0.',
  see:'proof:pfDescent', seeLabel:'The chain, and the floor no search can cross' })}

<p>A search cannot substitute for that argument, and the stage is built to make the point concretely: one of its presets is <span class="mth">2828427/2000000</span>, a rational whose behaviour under any feasible search is indistinguishable from <span class="mth">√2</span>'s. What the search <em>can</em> show is the shape the proof explains — for a quadratic irrational, <span class="mth"><i>q</i>²|<i>x</i> − <i>p</i>/<i>q</i>|</span> stays above a positive floor, because <span class="mth">|<i>p</i>² − 2<i>q</i>²|</span> is a positive integer and so is at least 1.</p>

${stThm('There are infinitely many primes', {
  hyp:'',
  then:'no finite list of primes contains them all',
  eq:'',
  proof:`<p>Let <span class="mth"><i>p</i>₁, …, <i>p</i><sub>k</sub></span> be any finite list of primes and put <span class="mth"><i>N</i> = <i>p</i>₁⋯<i>p</i><sub>k</sub> + 1</span>. Each <span class="mth"><i>p</i><sub>i</sub></span> divides the product, so if it also divided <span class="mth"><i>N</i></span> it would divide the difference, which is 1 — impossible.</p>
<p><span class="mth"><i>N</i> &gt; 1</span>, so it has at least one prime factor, and by the previous paragraph that factor is not on the list. The list was arbitrary, so no finite list is complete.</p>`,
  note:'The proof does <strong>not</strong> claim N is prime, and it is not: 2·3·5·7·11·13 + 1 = 30031 = 59 × 509. The stage factors it. What the argument needs is a new prime FACTOR, which it has.',
  see:'proof:pfEuclid', seeLabel:'30031, factored' })}

<h3 id="p7">Sets, which are predicates wearing a different hat</h3>
<p>A set is determined by its members: <span class="mth"><i>A</i> = <i>B</i></span> means every element of one is an element of the other. So proving a set identity is proving a biconditional about membership, and every law of the propositional calculus becomes a law of sets by reading ∧ as ∩, ∨ as ∪ and ¬ as complement.</p>

${stThm('De Morgan for sets', {
  hyp:'<span class="mth"><i>A</i>, <i>B</i> ⊆ <i>U</i></span>',
  then:'',
  eq:'(<i>A</i> <span class="op">∪</span> <i>B</i>)<sup>c</sup> <span class="op">=</span> <i>A</i><sup>c</sup> <span class="op">∩</span> <i>B</i><sup>c</sup> &nbsp;&nbsp;&nbsp;&nbsp; (<i>A</i> <span class="op">∩</span> <i>B</i>)<sup>c</sup> <span class="op">=</span> <i>A</i><sup>c</sup> <span class="op">∪</span> <i>B</i><sup>c</sup>',
  proof:`<p>Let <span class="mth"><i>x</i> ∈ <i>U</i></span>. Then <span class="mth"><i>x</i> ∈ (<i>A</i> ∪ <i>B</i>)<sup>c</sup></span> means <span class="mth">¬(<i>x</i> ∈ <i>A</i> ∨ <i>x</i> ∈ <i>B</i>)</span>, which by the propositional De Morgan law is <span class="mth">¬(<i>x</i> ∈ <i>A</i>) ∧ ¬(<i>x</i> ∈ <i>B</i>)</span>, which is <span class="mth"><i>x</i> ∈ <i>A</i><sup>c</sup> ∩ <i>B</i><sup>c</sup></span>. Since the two sets have the same members they are equal. The second identity is the same argument with ∧ and ∨ exchanged.</p>`,
  note:'The stage checks it both ways: as two integers compared bitwise, and as this element-by-element argument run as a loop. The second is the proof; the first is what a computer would rather do.',
  see:'proof:pfSets', seeLabel:'Both routes, on sixteen elements' })}

${stThm('Inclusion–exclusion for three sets', {
  hyp:'<span class="mth"><i>A</i>, <i>B</i>, <i>C</i></span> finite',
  then:'',
  eq:'|<i>A</i><span class="op">∪</span><i>B</i><span class="op">∪</span><i>C</i>| <span class="op">=</span> |<i>A</i>|<span class="op">+</span>|<i>B</i>|<span class="op">+</span>|<i>C</i>| <span class="op">−</span> |<i>A</i><span class="op">∩</span><i>B</i>| <span class="op">−</span> |<i>A</i><span class="op">∩</span><i>C</i>| <span class="op">−</span> |<i>B</i><span class="op">∩</span><i>C</i>| <span class="op">+</span> |<i>A</i><span class="op">∩</span><i>B</i><span class="op">∩</span><i>C</i>|',
  proof:`<p>Count the contribution of a single element and check it is 1 in every case. An element in exactly one set contributes <span class="mth">1</span>. In exactly two, it contributes <span class="mth">1+1−1 = 1</span>. In all three, <span class="mth">3 − 3 + 1 = 1</span>. An element in none contributes 0. Summing over elements gives the identity.</p>`,
  note:'The stage computes the left side three ways — this formula, a direct count of the union, and the sum of the seven disjoint Venn regions — and prints all three.',
  see:'proof:pfSets', seeLabel:'The seven regions, each with its count' })}

<h3 id="p8">Functions, injections, surjections</h3>
<p>A function <span class="mth"><i>f</i> : <i>X</i> → <i>Y</i></span> assigns to each element of <span class="mth"><i>X</i></span> exactly one element of <span class="mth"><i>Y</i></span>. It is <em>injective</em> if distinct inputs have distinct outputs, <em>surjective</em> if every element of <span class="mth"><i>Y</i></span> is an output, and <em>bijective</em> if both — and only then does an inverse function exist.</p>

${stThm('The pigeonhole principle', {
  hyp:'<span class="mth"><i>f</i> : <i>X</i> → <i>Y</i></span> with <span class="mth"><i>X</i>, <i>Y</i></span> finite and <span class="mth">|<i>X</i>| &gt; |<i>Y</i>|</span>',
  then:'<span class="mth"><i>f</i></span> is not injective — some two elements share an image',
  eq:'',
  proof:`<p>If <span class="mth"><i>f</i></span> were injective, the images of the <span class="mth">|<i>X</i>|</span> elements would be <span class="mth">|<i>X</i>|</span> distinct members of <span class="mth"><i>Y</i></span>, giving <span class="mth">|<i>Y</i>| ≥ |<i>X</i>|</span> and contradicting the hypothesis.</p>`,
  note:'Its proof is barely longer than its statement, and it gives the birthday problem, the recurrence of every rational’s decimal expansion, and half of combinatorics.',
  see:'proof:pfMap', seeLabel:'Seven arrows into six targets' })}

<p>Between <em>finite</em> sets of equal size, injective and surjective are equivalent — which is why "one-to-one" and "onto" feel interchangeable for square matrices. The next section is what happens when that equivalence fails.</p>

<h3 id="p9">Sizes of infinity</h3>
<p>Two sets have the same size when a bijection exists between them. For finite sets that agrees with counting; for infinite sets it is the definition, and it has consequences that look wrong until the alternatives are tried and found worse.</p>

${stThm('ℕ × ℕ is countable', {
  hyp:'',
  then:'there is a bijection <span class="mth">π : ℕ × ℕ → ℕ</span>',
  eq:'<i>π</i>(<i>i</i>, <i>j</i>) <span class="op">=</span> (<i>i</i><span class="op">+</span><i>j</i>)(<i>i</i><span class="op">+</span><i>j</i><span class="op">+</span>1)/2 <span class="op">+</span> <i>j</i>',
  proof:`<p>The pairs with <span class="mth"><i>i</i>+<i>j</i> = <i>d</i></span> form the <span class="mth"><i>d</i></span>-th diagonal, which has <span class="mth"><i>d</i>+1</span> members. The diagonals before it contain <span class="mth">1 + 2 + ⋯ + <i>d</i> = <i>d</i>(<i>d</i>+1)/2</span> pairs in total, and <span class="mth"><i>j</i></span> gives the position within the diagonal. So <span class="mth"><i>π</i></span> enumerates the pairs diagonal by diagonal without gaps or repeats, which is exactly what a bijection onto ℕ is.</p>`,
  note:'Hence the rationals are countable: a fraction is a pair. The stage checks both halves separately — no index skipped, no index used twice — because an injection that misses part of ℕ passes one check and fails the other.',
  see:'proof:pfCount', seeLabel:'The walk, with its indices' })}

${stThm('ℝ is not countable', {
  hyp:'any list <span class="mth"><i>r</i>₀, <i>r</i>₁, <i>r</i>₂, …</span> of real numbers',
  then:'some real number is missing from it',
  eq:'',
  proof:`<p>Write each <span class="mth"><i>r</i><sub>k</sub></span> in decimal. Build <span class="mth"><i>e</i></span> whose <span class="mth"><i>k</i></span>-th digit differs from the <span class="mth"><i>k</i></span>-th digit of <span class="mth"><i>r</i><sub>k</sub></span>, choosing digits from <span class="mth">1, …, 8</span> so that <span class="mth"><i>e</i></span> has only one decimal expansion.</p>
<p>Then <span class="mth"><i>e</i> ≠ <i>r</i><sub>k</sub></span> for every <span class="mth"><i>k</i></span>, because they differ at the <span class="mth"><i>k</i></span>-th digit and neither has an alternative expansion. So the list omits <span class="mth"><i>e</i></span>. Since the list was arbitrary, no list of reals is complete.</p>`,
  note:'The restriction to digits 1…8 is not fussiness: 0.4999… and 0.5000… are the same number, so "differs in every digit" alone would not finish the argument. The stage marks the constructed digits and confirms none is 0 or 9.',
  see:'proof:pfCount', seeLabel:'The number the list forgot' })}

${stCor('There is no largest infinity', {
  hyp:'<span class="mth"><i>S</i></span> any set',
  then:'no function <span class="mth"><i>S</i> → 𝒫(<i>S</i>)</span> is surjective, so <span class="mth">|<i>S</i>| &lt; |𝒫(<i>S</i>)|</span>',
  eq:'',
  proof:`<p>Let <span class="mth"><i>f</i> : <i>S</i> → 𝒫(<i>S</i>)</span> and put <span class="mth"><i>D</i> = {<i>x</i> ∈ <i>S</i> : <i>x</i> ∉ <i>f</i>(<i>x</i>)}</span>. If <span class="mth"><i>D</i> = <i>f</i>(<i>d</i>)</span> for some <span class="mth"><i>d</i></span>, then <span class="mth"><i>d</i> ∈ <i>D</i></span> holds exactly when <span class="mth"><i>d</i> ∉ <i>D</i></span> — impossible. So <span class="mth"><i>D</i></span> is not in the image.</p>`,
  note:'The same diagonal argument as the theorem above, with membership in place of digits. It is also Russell’s paradox in disguise, which is why set theory needed axioms rather than good intentions.',
  see:'proof:pfSets', seeLabel:'Power sets, counted' })}

<h3 id="p10">How to read the cards in every other wing</h3>
<p>Now the payoff, because the layout of the cards above is the layout used across all forty-five wings.</p>
<ul>
<li><strong>Definition.</strong> A name given to a condition. Nothing to prove and nothing to believe: the only question worth asking is whether it captures what you wanted, and the borderline cases are the place to look.</li>
<li><strong>If … / then …</strong> The hypotheses and the conclusion, split apart deliberately. The hypotheses tell you when you may reuse the result, and a theorem quoted without them is a theorem quoted wrongly. When a card here says a claim is not proved, it says where the proof lives instead.</li>
<li><strong>Proof.</strong> Collapsed by default and worth opening once per card. Read it asking one question — <em>where is each hypothesis used?</em> — because a hypothesis that is never used is either unnecessary or the sign of a gap.</li>
<li><strong>The ∎</strong> marks the end. The note beneath is commentary and is not part of the argument.</li>
<li><strong>"See it in the laboratory"</strong> jumps to the experiment that measures the statement. Almost every theorem in this site has one, and the number it prints was computed twice by independent routes — because a theorem that has never been checked against an independent computation is a theorem you are taking on trust.</li>
</ul>
<p>One last thing, which this wing exists to make ordinary rather than intimidating: a proof you cannot follow is not a verdict on you. It is usually a proof with a step left out, and the useful response is to find the step and put it back.</p>
`;
