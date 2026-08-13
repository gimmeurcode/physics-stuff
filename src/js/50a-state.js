/* ============================================================================
   4 · APPLICATION STATE + VISUAL LAYERS
   Sampled geometry is cached in world coordinates and merely re-projected each
   frame, so orbiting stays smooth no matter how expensive the expression is.
   ============================================================================ */

const S = {
  mode:'vector',
  src:{ f:'x^2 + y^2 + z^2', P:'-y', Q:'x', R:'0.35 z' },
  field:null, err:'',
  /* view: '3d'   full three-dimensional field
           'surf' the domain is the xy-plane, drawn as the height map z = (a scalar)
           '2d'   the domain is the xy-plane, drawn flat as a map                */
  view:'3d',
  hScale:1, showBase:true,
  extent:3,
  probe:v3(1.0, 0.6, 0.5),
  dirU:v3(1,0,0),
  show:{ arrows:true, stream:true, slice:false, level:false, axes:true, flux:false, circ:false, probe:true, dirderiv:false, curlarrows:false, descent:false, basins:false, fieldlines:false },
  density:5, arrowScale:0.9, lenMode:'log',
  sliceAxis:2, slicePos:0, sliceOf:'auto',
  nearSlice:false,
  levels:6,
  flux:{ shape:'box', h:0.55, m:9 },
  circ:{ r:0.7, n:v3(0,0,1), paddle:true, spin:0 },
  presetNote:'',
  /* the gradient-descent walkers: discrete steps x ← x − η∇f from the probe.
     walkers[0] is plain GD; a race adds a heavy-ball momentum twin. */
  desc:{ eta:0.15, beta:0.88, mode:'min', running:false, race:false, stepsPerSec:12, acc:0, walkers:[] },
  /* projected-gradient walk on the constraint circle |x| = R (Lagrange live) */
  con:{ on:false, R:2, pos:null, running:false, acc:0 },
  /* basins of attraction: which minimum does descent reach from each start? */
  basins:{ job:null, img:null, minima:[], G:96 },
  /* least-squares inset: the walker position IS (slope, intercept) */
  fit:{ active:false },
  time:{ speed:1, paused:false },
  phys:{ objects:[], applied:false },
  /* test particles obeying Newton's 2nd law. In scalar mode the field is a
     potential energy and F = −∇f; in vector mode it is a force, or a magnetic
     field driving the Lorentz force q(E + v×B) with a uniform E from settings. */
  part:{ interp:'force', m:1, q:1, v:{x:1,y:0.8,z:0}, E:{x:0,y:0,z:0}, simSpeed:1, run:true, bodies:[] },
  dirty:true
};
const cache = { arrows:null, slice:null, levels:null, surf:null, curlArrows:null, fieldLines:null };
function invalidate(){ cache.arrows = cache.slice = cache.levels = cache.surf = cache.curlArrows = cache.fieldLines = null; }

/* --- which kind of world are we in? --------------------------------------- */
const is2D   = () => S.view==='2d';        // flat, orthographic
const isSurf = () => S.view==='surf';      // 3D camera, 2D domain, height = scalar
const planar = () => S.view!=='3d';        // domain is the xy-plane either way
/* legacy shorthand used throughout: 2 when the domain is the plane */
Object.defineProperty(S, 'dim', { get(){ return planar() ? 2 : 3; } });

/* robust upper bound — ignores the blow-up next to a singularity */
