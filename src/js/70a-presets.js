/* ============================================================================
   6 · PRESETS + USER INTERFACE
   ============================================================================ */

const PRESETS = [
{ g:'Vector fields  F(x, y, z)', items:[
  {n:'Vortex with updraft', mode:'vector', P:'-y', Q:'x', R:'0.35 z',
   note:'Swirls about the z-axis while spreading vertically. Curl points along ẑ; the vertical spreading is the entire divergence.'},
  {n:'Radial source', mode:'vector', P:'x', Q:'y', R:'z',
   note:'Everything flows outward from the origin. Divergence is 3 everywhere — every point is equally a source — and the curl vanishes identically.'},
  {n:'Sink', mode:'vector', P:'-x', Q:'-y', R:'-z',
   note:'The same field reversed. Divergence −3: every point drains. Put the flux box anywhere and the net flux is negative.'},
  {n:'Rigid rotation', mode:'vector', P:'-y', Q:'x', R:'0',
   note:'The whole space turning like a solid body at 1 rad/s. Divergence 0, curl (0,0,2) — exactly twice the angular velocity.'},
  {n:'Simple shear', mode:'vector', P:'y', Q:'0', R:'0',
   note:'Nothing visibly spins, yet curl = (0,0,−1). Shear is half pure strain and half rotation — open the Jacobian split to see the two halves.'},
  {n:'Inverse-square (point charge)', mode:'vector', P:'x/r^3', Q:'y/r^3', R:'z/r^3',
   note:'The subtle one. Arrows fan outward everywhere, yet the divergence is exactly 0 at every point except the origin, where the field is undefined.'},
  {n:'Irrotational vortex', mode:'vector', P:'-y/(x^2+y^2)', Q:'x/(x^2+y^2)', R:'0',
   note:'Curl is 0 everywhere off the axis, yet a loop enclosing the axis has non-zero circulation. Stokes needs the surface to avoid the singularity.'},
  {n:'Saddle flow', mode:'vector', P:'x', Q:'-y', R:'0',
   note:'Stretching along x, squeezing along y. The two cancel exactly, so divergence is 0 — area is preserved while shape is not.'},
  {n:'Helical flow', mode:'vector', P:'-y', Q:'x', R:'1',
   note:'Rotation plus a uniform drift. The drift adds nothing to either operator: divergence 0, curl still (0,0,2).'},
  {n:'Compression wave', mode:'vector', P:'sin(x)', Q:'0', R:'0',
   note:'Divergence is cos x — alternating bands of sources and sinks. Slide the flux box along x and watch the net flux change sign.'},
  {n:'Stretch and twist', mode:'vector', P:'x^2 y', Q:'sin(z) x', R:'y z^3',
   note:'Nothing special, deliberately. Both operators vary from point to point, so the numeric checks have to work for a genuinely messy field.'}
]},
{ g:'Scalar fields  f(x, y, z) — arrows show ∇f', items:[
  {n:'Paraboloid bowl', mode:'scalar', f:'x^2 + y^2 + z^2',
   note:'The gradient points straight out, growing with radius. Level sets are spheres and every arrow pierces them at a right angle.'},
  {n:'Saddle', mode:'scalar', f:'x^2 - y^2',
   note:'Uphill along x, downhill along y. The Laplacian is 0: the two curvatures cancel, so the surface is a minimal one.'},
  {n:'Coulomb potential', mode:'scalar', f:'1/r',
   note:'Its gradient is the inverse-square field. ∇²f = 0 away from the origin, which is why the point-charge field is divergence-free off the charge.'},
  {n:'Gaussian bump', mode:'scalar', f:'exp(-(x^2 + y^2 + z^2))',
   note:'Gradients point inward toward the peak. Near the top the Laplacian is negative — a local maximum curves down in every direction.'},
  {n:'Tilted plane', mode:'scalar', f:'2x + 3y - z',
   note:'A constant gradient (2, 3, −1) everywhere. Level sets are parallel planes and the field of arrows is perfectly uniform.'},
  {n:'Ripple', mode:'scalar', f:'sin(x) cos(y)',
   note:'A checkerboard of peaks and pits. The gradient reverses across every ridge, and ∇²f = −2f exactly.'},
  {n:'Dipole potential', mode:'scalar', f:'z/r^3',
   note:'The classic dipole. Its gradient field loops from one lobe to the other, and the Laplacian is still zero off the origin.'}
]}];

/* ----------------------------------------------------------------------------
   Worked examples. Each sets up the whole instrument — field, probe, layers,
   camera — so the point it is making is the only thing on screen.
   ---------------------------------------------------------------------------- */
