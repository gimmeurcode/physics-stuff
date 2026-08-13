/* ============================================================================
   6i · THE AP WINGS
   Single-variable calculus (AB/BC), sequences and series (BC), and the physics
   of AP Physics 1, 2 and C. Written to the same rule as everything else: a
   claim that two things are equal is only made after both have been computed.
   ============================================================================ */

const LIMIT_GROUPS = [
{ g:'Limits and continuity', items:[
  {n:'What a limit is', ex:'and the four ways it can fail', stage:'clLimit', opts:{ key:'hole' },
   out:'Zoom in and the two approach lines converge — or do not. The panel marches in geometrically from both sides and reports what the values settle on, so "the limit" is a measurement rather than a guess.',
   note:'A limit is a statement about what happens <i>near</i> a point and deliberately not about what happens <i>at</i> it. The open circle marks the value f actually takes, and the limit does not care. Work through the list: a removable hole, a jump, a blow-up, and sin(1/x), which never settles however far you zoom.'},
  {n:'The squeeze theorem', ex:'x² sin(1/x) — wild, and yet forced to zero', stage:'clLimit', opts:{ key:'squeeze' },
   out:'The function oscillates infinitely often in every neighbourhood of the origin, and its limit is still exactly 0 — because |f| ≤ x², and the envelope collapses.',
   note:'This is the one technique that handles a function too badly behaved to approach directly. Trap it between two functions that agree in the limit and it has nowhere to go. It is also how sin(x)/x → 1 is proved, which is why the derivative of sine is cosine.'},
  {n:'The ε–δ definition, played as a game', ex:'name an ε, and δ is found by bisection', stage:'clLimit', opts:{ key:'poly' },
   out:'The panel actually tests whether every x within δ of a lands within ε of L, and shrinks δ until it does. Halve ε and watch δ halve for a linear function — that ratio is the derivative.',
   note:'The quantifier order is the whole content: for <i>every</i> ε, <i>there exists</i> a δ. δ is allowed to depend on ε and must. Weierstrass wrote this down in the 1860s, two centuries after the calculus it makes rigorous, and it is still the definition every analysis course starts from.'},
  {n:'sin x / x, the limit that starts calculus', ex:'the answer is 1, and it is not obvious', stage:'clLimit',
   opts:{ key:'sinc' },
   out:'Marching in from both sides gives 1 to as many digits as you like, even though the function is undefined at 0 itself.',
   note:'Everything about differentiating sine rests on this one limit, and the standard proof is a squeeze between two triangles and a sector — which is why the squeeze theorem is not a curiosity but load-bearing. Zoom in: the graph looks flat and passes straight through the hole.'},
  {n:'When the limit is infinite', ex:'growing without bound is not converging', stage:'clLimit',
   opts:{ key:'infinite' },
   out:'The values do not settle on anything — they exceed every bound — so the limit does not exist, and saying it "equals infinity" is shorthand for exactly that failure.',
   note:'The distinction matters. "Tends to infinity" describes <i>how</i> the limit fails, and it is a stronger statement than "does not exist" because it says the divergence is orderly. The oscillating case fails in a completely different way.'},
  {n:'The exponential limit that defines e', ex:'(1 + x)^(1/x) → e', stage:'clLimit',
   opts:{ key:'expo' },
   out:'The marching values converge on 2.718281828…, which is how e is defined rather than a property discovered afterwards.',
   note:'The indeterminate form here is 1^∞, which is genuinely indeterminate: 1 to any power is 1, but the base is only approaching 1 while the exponent runs away, and the race between them decides. That race is what e measures.'},  {n:'Continuity, and its three failure modes', ex:'defined, limit exists, and they agree', stage:'clLimit', opts:{ key:'jump' },
   out:'The panel checks all three conditions separately and names which one failed. A jump cannot be repaired at all; a removable discontinuity needs one value redefined; an essential one is not even approachable.',
   note:'Continuity is the hypothesis of nearly every theorem in the subject, so knowing exactly what it rules out matters. The Intermediate Value Theorem needs it; so does the Extreme Value Theorem; so does the Mean Value Theorem, which needs differentiability on top.'},
  {n:'IVT, EVT and the Mean Value Theorem', ex:'each with its witness located numerically', stage:'clTheorems',
   opts:{ which:'mvt' },
   out:'Every c is found by scanning for sign changes and refining by bisection — nothing is hard-coded, so switching the function genuinely re-solves. The MVT chord and every tangent parallel to it are drawn together.',
   note:'The MVT is the workhorse behind almost everything later. "f′ > 0 implies increasing" is the MVT. "Equal derivatives means differing by a constant" is the MVT. The Taylor error bound is the MVT applied n+1 times. Choose |x| and drag the interval across zero to watch it fail when differentiability does.'}
]}];

