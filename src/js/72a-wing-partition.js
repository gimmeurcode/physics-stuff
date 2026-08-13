/* ============================================================================
   6b · WINGS — the floors of the laboratory.
   The legacy DEMOS array predates the split into wings, so it is partitioned
   here rather than rewritten: the trailing group is the quantum field-demo set
   and moves to the quantum wing; the gradient, directional-derivative and
   optimization groups belong with the partial-derivatives wing; everything else
   is the vector-calculus wing, which now means the integral theorems.
   ============================================================================ */

const QM_FIELD_GROUP = DEMOS[DEMOS.length - 1];          // 'Quantum mechanics — wavefunctions'
QM_FIELD_GROUP.g = 'Wavefunctions as fields — the probe is an eigenvalue meter';
const VECTOR_GROUPS = DEMOS.slice(0, DEMOS.length - 1);
const MV_IS_PARTIAL = g => /Gradient|Directional derivative|Optimization/.test(g.g);
const MV_FIELD_GROUPS = VECTOR_GROUPS.filter(MV_IS_PARTIAL);
const VC_FIELD_GROUPS = VECTOR_GROUPS.filter(g => !MV_IS_PARTIAL(g));

/* an orbital gallery: real hydrogen eigenfunctions (atomic units), where the
   probe's ∇²ψ/ψ row verifies the Schrödinger equation at any point you pick */
QM_FIELD_GROUP.items.push(
  {n:'Orbital gallery: 2s — a radial node', ex:'ψ = (2 − r)e^(−r/2)', mode:'scalar', f:'(2 - r) exp(-0.5r)',
   probe:[1.2,0.8,0.5], show:{arrows:0,stream:0,slice:1,level:1,axes:1,flux:0,circ:0,probe:1,dirderiv:0,curlarrows:0}, dens:4, extent:7, sliceOf:'auto', sliceAxis:0,
   out:'The real 2s orbital: positive core, a spherical node exactly at r = 2 a₀ where ψ changes sign, negative shell outside. Probe it: ∇²ψ/ψ = ¼ − 2/r wherever ψ ≠ 0 — the same eigenvalue relation as 2p, because E depends only on n.',
   note:'"Orbits" die here: nothing circulates. An s-orbital carries zero angular momentum — the electron is a spherically symmetric standing wave whose only feature is radial structure. The node is not empty space the electron avoids while passing; it is a surface where the amplitude itself vanishes. Degeneracy (2s and 2p sharing E = −1/8) is special to the 1/r potential — the same accident that makes Kepler orbits close in the vector wing\'s mechanics demos.'},
  {n:'Orbital gallery: 3d — the cloverleaf', ex:'ψ = xy·e^(−r/3)', mode:'scalar', f:'x y exp(-r/3)',
   probe:[2,2,0], show:{arrows:0,stream:0,slice:1,level:1,axes:1,flux:0,circ:0,probe:1,dirderiv:0,curlarrows:0}, dens:4, extent:9, sliceOf:'auto', sliceAxis:2,
   out:'A real 3d orbital (the xy cloverleaf of chemistry class): four lobes of alternating sign separated by two nodal planes. The eigenvalue meter reads ∇²ψ/ψ = 1/9 − 2/r at every probe position — E₃ = −1/18 in these units.',
   note:'Two units of angular momentum (ℓ = 2) show up as two nodal planes through the origin. Chemistry\'s entire d-block — transition metals, their colours, their magnetism — is electrons occupying five shapes like this one. The lobes\' signs matter: bonding is constructive interference of overlapping orbitals, so the ± pattern controls which molecular geometries bond at all.'}
);

