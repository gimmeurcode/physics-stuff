const DERIV_GROUPS = [
{ g:'The derivative itself', items:[
  {n:'The limit of secants', ex:'watch the chord pivot onto the tangent', stage:'clDeriv', opts:{ src:'x^2', a:1 },
   out:'Three difference quotients — forward, backward and symmetric — are plotted converging on the symbolic f′(a). The symmetric one converges as h² rather than h, and for a parabola it is exact at every h.',
   note:'The derivative is <i>defined</i> as this limit. Choose |x| and put a at 0: the two one-sided quotients settle on −1 and +1, so no derivative exists there even though the function is perfectly continuous. Differentiability is strictly stronger than continuity, and this is the cheapest demonstration of it.'},
  {n:'Reading a curve from its derivatives', ex:'increasing, concave, critical, inflected', stage:'clCurve',
   opts:{ src:'x^4/4-2x^2+x' },
   out:'f, f′ and f″ are drawn together with the shading showing where f is increasing and where it is concave up. Critical points and inflections are located by root-finding on the symbolic derivatives.',
   note:'An inflection needs f″ to <i>change sign</i>, not merely to vanish — x⁴ has f″ = 12x², zero at the origin and never negative, so there is no inflection there. The search rejects it for exactly that reason, which a "set the second derivative to zero" recipe would not.'},
  {n:'Optimisation', ex:'the box from a square sheet', stage:'clApply', opts:{ mode:'optim' },
   out:'V = x(L−2x)², and the optimum is found by root-finding on the symbolic derivative rather than by quoting L/6 — which is printed beside it for comparison. The sheet and the folded box are drawn to scale.',
   note:'Three steps every time: express the quantity in one variable using the constraint, find the critical points on the <b>feasible interval</b>, and compare — including the endpoints, where the volume is zero because the box is either flat or has no base. The endpoints are not a formality.'},
  {n:'Related rates', ex:'the chain rule with a clock in it', stage:'clApply', opts:{ mode:'rates', scene:'ladder' },
   out:'Each geometry is drawn live with its rates as scaled arrows. The panel computes the answer analytically and also by finite difference on the constraint itself, and prints both.',
   note:'Differentiate the geometric constraint with respect to t and every changing length contributes its own rate. Watch the ladder: as it flattens, the top runs away to infinite speed — the mathematics of a rigid rod driven at constant horizontal speed, and a clear signal that the model has stopped describing any real ladder.'},
  {n:"Newton's method", ex:'follow the tangent to the axis, repeat', stage:'clApply', opts:{ mode:'newton' },
   out:'Each step is drawn as the construction it is. The error ratio eₙ₊₁/eₙ² settles on a constant — quadratic convergence, so the number of correct digits roughly doubles per step.',
   note:'Choose x³ − 2x + 2 and start near zero: the iteration falls into a two-cycle and never converges. Newton is spectacular when it works and gives no warning at all when it does not, which is why every serious implementation carries a bisection fallback.'},
  {n:"L'Hôpital's rule, and when it lies", ex:'0/0 and ∞/∞ only', stage:'clApply', opts:{ mode:'lhop' },
   out:'Each standard form is evaluated twice — once by the rule, once by marching in numerically — and the two agree. Then (x+1)/(x+2) at 0 is shown giving 1 by the rule and ½ in fact.',
   note:'The rule is not merely unhelpful on a non-indeterminate form; it is <b>wrong</b>, and silently so. Always confirm the form first. The reason the rule works at all is the Cauchy Mean Value Theorem: near a common zero both functions are their own linearisations, and the ratio of two lines through the same point is the ratio of their slopes.'}
]}];

