/* ============================================================================
   6h · THE CALCULUS WINGS
   Six floors covering the standard third-semester syllabus, in the order the
   ideas depend on one another: vectors and the geometry of space, curves and
   the motion along them, differentiation in several variables, integration in
   several variables, the integral theorems, and the differential equations that
   all of it was invented to write down.
   ============================================================================ */

const GEOM_GROUPS = [
{ g:'Vectors — the two products', items:[
  {n:'Vector arithmetic, by hand', ex:'drag two arrows; add, subtract, scale', stage:'gaVec',
   opts:{},
   out:'Drag either arrowhead. The parallelogram closes on a + b whichever order you take them in, |k·a| = |k||a| exactly, and the triangle inequality |a+b| ≤ |a|+|b| becomes an equality only when the two arrows line up.',
   note:'A vector is a displacement, and everything else follows. Addition is defined tip-to-tail because displacements compose that way; it commutes because the parallelogram has two sides. Subtraction <b>a − b</b> is the arrow <i>from</i> the tip of b <i>to</i> the tip of a — what you must add to b to get a — which is why relative velocity and relative position always come out as differences in that order.'},
  {n:'Into three dimensions', ex:'components, direction cosines, the sphere', stage:'gaSpace',
   opts:{},
   out:'One extra component and nothing else changes: components still add, the length is still Pythagoras (applied twice), and the unit vector is still the vector over its length. The direction cosines square to exactly 1.',
   note:'The genuinely new thing is the <b>distance formula becoming the equation of a sphere</b>. (x−a)²+(y−b)²+(z−c)² = r² is not a formula to memorise — it is the statement that the distance is r, written out. Turn on the sphere and slide a component until the readout |a|² − r² reaches zero; the arrowhead lands on the surface.'},
  {n:'The dot product is a projection', ex:'a·b = |a||b|cos θ, and the shadow it casts', stage:'gaDot',
   opts:{mode:'proj'},
   out:'Two definitions computed independently — a₁b₁+a₂b₂ from the components and |a||b|cos θ from the geometry — agree to machine precision at every drag. The thick bar is proj<sub>b</sub> a, and what is left over is orthogonal to b to 15 digits.',
   note:'The dot product is the whole of "how much of this points along that". Every least-squares fit, every Fourier coefficient, every quantum amplitude and every work calculation is this one operation, sometimes in a space with more than three dimensions. It is zero exactly for perpendicular vectors, which is the cheapest orthogonality test there is.'},
  {n:'Work: the force that does nothing', ex:'W = F·d, and why circular orbits are free', stage:'gaDot',
   opts:{mode:'work'},
   out:'Turn F until the readout reads zero: a force perpendicular to the motion does no work at all, however hard it pushes.',
   note:'The normal force on a sliding block, the tension in a pendulum string, the magnetic force on a moving charge — none of them can change a kinetic energy, and the reason is one dot product being zero. A satellite in a circular orbit needs no engine for exactly this reason.'},
  {n:'The cross product: area, and a direction', ex:'|a × b| = |a||b| sin θ, perpendicular to both', stage:'gaCross',
   opts:{mode:'area'},
   out:'The shaded parallelogram\'s area is |a × b|, and the product is perpendicular to both factors — the readout prints (a×b)·a and (a×b)·b as zeros. Lagrange\'s identity |a×b|² + (a·b)² = |a|²|b|² holds at every setting.',
   note:'The two products are complementary: the dot product dies for perpendicular vectors, the cross product for parallel ones, and between them they capture the whole angle. The right-hand rule is not an arbitrary convention — it is the choice that makes <b>î × ĵ = k̂</b>, and every sign in electromagnetism is downstream of it.'},
  {n:'Torque and the triple product', ex:'τ = r × F, and a signed volume', stage:'gaCross',
   opts:{mode:'triple'},
   out:'a·(b×c) is the signed volume of the parallelepiped. Slide c₃ to zero and it vanishes the instant the three vectors become coplanar — the sharpest test for coplanarity there is.',
   note:'Cycling the three vectors leaves the answer alone; swapping any two flips its sign. That is the determinant of the matrix whose rows they are, and it is the reason a Jacobian determinant carries orientation information in the integration wing. Torque is the same product read as a lever: only the perpendicular part of the force turns anything.'}
]},
{ g:'Lines, planes and surfaces', items:[
  {n:'A line is a point and a direction', ex:'r(t) = p + t d, and the distance to it', stage:'gaLines',
   opts:{scene:'line'},
   out:'The dashed segment is the shortest route from the marked point to the line. Two independent formulas for its length — |w × d|/|d| and the leftover after projecting — agree, and (q − foot)·d is zero.',
   note:'Eliminating t from the parametric form gives the symmetric equations, which fail the moment a component of d is zero. The parametric form never fails, which is why it is the honest one. The shortest route meets the line at a right angle, and that is derived here rather than assumed.'},
  {n:'Skew lines — the generic case', ex:'two lines in space usually miss', stage:'gaLines',
   opts:{scene:'pair'},
   out:'Slide the direction and watch the classification change. Intersecting requires (p₂−p₁)·(d₁×d₂) = 0 exactly — one equation among four free parameters, so you have to aim very carefully to hit it.',
   note:'Skew has no analogue in the plane, where any two non-parallel lines must cross. The distance between skew lines is the gap projected onto the common perpendicular d₁ × d₂, and the drawn segment <i>is</i> that perpendicular.'},
  {n:'A plane is a point and a normal', ex:'n·(r − p) = 0 becomes ax+by+cz = d', stage:'gaLines',
   opts:{scene:'plane'},
   out:'The signed distance changes sign as the point crosses the plane. Multiply out the normal form and the coefficients of x, y, z <i>are</i> the components of n — the single most useful fact about the equation of a plane.',
   note:'Every displacement inside the plane must be perpendicular to n, and that is the entire definition. The sign of n·r − d splits space into two half-spaces, which is the clipping test every renderer uses — including the one drawing this scene.'},
  {n:'Where a line meets a plane', ex:'one linear equation, three outcomes', stage:'gaLines',
   opts:{scene:'both'},
   out:'Substituting the line into the plane leaves one equation in t. It has one root, none, or infinitely many — and which one is decided entirely by whether n·d is zero.',
   note:'This is the whole of linear algebra in miniature: a system either has a unique solution, no solution, or a family of them, and the determinant (here n·d) tells you which. Ray tracing, collision detection and clipping are all this calculation run millions of times a second.'},
  {n:'The quadric surfaces', ex:'six shapes, classified by three signs', stage:'gaQuadric',
   opts:{kind:'ellipsoid'},
   out:'Each surface is drawn from its own horizontal traces. Slide the cutting plane and watch the trace grow, shrink, or vanish — the vanishing is the entire difference between the one- and two-sheeted hyperboloids.',
   note:'A second-degree equation in three variables can only produce these shapes, once rotations and translations are allowed. The classification is nothing but which squared terms are present and what signs they carry. Two of them are worth knowing by name: the <b>hyperbolic paraboloid</b> is the saddle that the critical-point stage keeps meeting, and the <b>cone</b> is where the conic sections got their name.'},
  {n:'Cylindrical and spherical coordinates', ex:'the same point, three ways', stage:'gaCoord',
   opts:{sys:'sph'},
   out:'The three coordinate surfaces — a sphere, a cone and a half-plane — meet at right angles. The readout differentiates the coordinate map numerically and takes the determinant, getting ρ² sin φ with no formula consulted.',
   note:'A coordinate system earns its keep when the boundary of your region becomes a constant. The integration wing\'s hardest Cartesian regions — the disc, the annulus, the ice-cream cone — are all plain rectangles in one of these two systems, and the volume element you pay for that is exactly the Jacobian computed here.'}
]}];

