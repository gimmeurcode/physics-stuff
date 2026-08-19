/* ============================================================================
   5f · THE ELECTROMAGNETIC FIELD THE READER SUPPLIES
   Programme A relativity items 7 (rlEB) and 8 (rlTensor), 2026-08-19.

   UNITS: c = 1 and Gaussian, so E and B are the same kind of number, the
   invariants are E·B and E² − B², and a point charge's flux is 4πq.

   WHAT WAS ALREADY HERE, in module 46: `relTransformEB(E, B, v)` for a boost
   in any direction, `relFieldInvariants`, `relFieldCharacter`,
   `relDriftVelocity`, `relFieldTensor` and `relBoostTensor` — the last of which
   conjugates F by Λ, but only for a boost along **x**. That restriction is why
   this module exists: every interesting boost in the two stages below is along
   E×B, which points wherever the reader's field points.

   ------------------------------------------------------------ the two routes
   ROUTE A  the six component formulas, `relTransformEB`:
              E∥′ = E∥,  E⊥′ = γ(E + v×B)⊥,  B⊥′ = γ(B − v×E)⊥.
   ROUTE B  build F^μν, build Λ for the same velocity in a GENERAL direction,
            conjugate — F′ = Λ F Λᵀ — and read E′ and B′ back off the result.

   They share nothing. Route A never forms a matrix; route B never mentions a
   parallel or perpendicular component, and it does not know which axis the
   boost is along: the direction enters only through Λⁱⱼ = δⁱⱼ + (γ−1)vⁱvʲ/v².
   That the two agree is the claim "E and B are six components of one tensor",
   and it is the one thing this wing asserts most often and had never measured
   off the diagonal.

   ---------------------------------------------------- what the reader can do
   TYPE A FIELD — six numbers. The panel then does what no slider version could:
   it reads the two invariants, CLASSIFIES the field from them, and then goes
   and finds the frame the classification promises. E·B = 0 with E² > B² says a
   frame exists where B vanishes; `rlFieldDrift` boosts by (E×B)/E² and
   MEASURES what is left of B there. A classification that names a frame and
   never visits it is a claim, not a result.

   TYPE A TENSOR — sixteen numbers. Antisymmetry is then a property of what was
   typed rather than of how it was built: `rlTensorCheck` reports the worst
   |F^μν + F^νμ| against the size of the entries, reads E and B off the
   components, and rebuilds both invariants from the double contractions
   F_μν F^μν = 2(B² − E²) and F_μν F̃^μν = −4E·B. Those must agree with E·B and
   E² − B² computed from the vectors — same numbers, two definitions that look
   nothing alike.

   ------------------------------------------------------------------ a caution
   THE NULL FIELD IS THE EDGE OF EVERY FORMULA HERE, not a special case to be
   guarded past. E·B = 0 and E² = B² makes |E×B| = E² exactly, so the drift
   velocity is exactly c: there is no frame in which a light wave is anything
   but a light wave, and the boost that would find one does not exist. Every
   routine below reports that as a *reason*, never as a NaN and never by
   quietly clamping β to 0.999 and printing whatever comes out.
   ============================================================================ */

/* Λ^μ_ν for a boost with velocity 3-vector v, any direction. x⁰ = t, signature
   (+,−,−,−). The spatial block is the identity plus (γ−1) v̂v̂ᵀ — a stretch by γ
   along the motion and nothing at all across it, which is length contraction
   written as a matrix. */
function rlBoost4(v){
  const v2 = vdot(v, v);
  if(!(v2 < 1)) throw new MathError('a boost needs |v| < 1 — got ' + Math.sqrt(v2));
  const g = 1 / Math.sqrt(1 - v2);
  const L = [[g, -g * v.x, -g * v.y, -g * v.z],
             [-g * v.x, 1, 0, 0],
             [-g * v.y, 0, 1, 0],
             [-g * v.z, 0, 0, 1]];
  if(v2 > 1e-30){
    const k = (g - 1) / v2, c = [v.x, v.y, v.z];
    for(let i = 0; i < 3; i++) for(let j = 0; j < 3; j++)
      L[i + 1][j + 1] = (i === j ? 1 : 0) + k * c[i] * c[j];
  }
  return L;
}

/* F′^μν = Λ^μ_α Λ^ν_β F^αβ, which in matrix form is plain conjugation. The
   x-only `relBoostTensor` in module 46 is this with v = (β,0,0). */
function rlTensorBoost(F, v){
  const L = rlBoost4(v);
  return relMat4Mul(relMat4Mul(L, F), relMat4T(L));
}

/* The pseudoscalar invariant, read off the tensor rather than off E and B, so
   that it is a second definition and not a restatement of the first. Under
   this module's conventions the dual contraction is

       F_μν F̃^μν = −4 E·B ,

   and the sum below is E·B exactly: F^0i = −Eⁱ and the three spatial pairs
   are −Bⁱ, so each product is +EⁱBⁱ. The factor is checked against the vector
   route on every preset in tests.js rather than trusted — a stray 2 here would
   be invisible to every other gate, because both routes would still be
   perfectly invariant under a boost. */
function rlTensorInvariant2(F){
  return -4 * (F[0][1] * F[2][3] + F[0][2] * F[3][1] + F[0][3] * F[1][2]);
}

/* BOTH ROUTES, and the gap between them. `gross` is what a residual has to be
   read against here: the fields themselves, because a boosted field can
   legitimately be zero (boost a pure E by its own drift velocity and B really
   does vanish) and a difference of zeros scaled by itself is meaningless. */
function rlFieldBoostTwo(E, B, v){
  const A = relTransformEB(E, B, v);
  const F2 = rlTensorBoost(relFieldTensor(E, B), v);
  const Bt = { E: relTensorE(F2), B: relTensorB(F2) };
  const gross = Math.sqrt(vdot(E, E) + vdot(B, B));
  const dE = vlen(vsub(A.E, Bt.E)), dB = vlen(vsub(A.B, Bt.B));
  return { vec:A, ten:Bt, F:F2, dE, dB, worst:Math.max(dE, dB), gross };
}

/* The frame the classification promises, visited rather than asserted.

   E·B = 0 and E² > B²  →  v = (E×B)/E²  and B vanishes there.
   E·B = 0 and E² < B²  →  v = (E×B)/B²  and E vanishes there.
   E·B ≠ 0              →  neither vanishes in any frame; the drift makes them
                           PARALLEL instead, and that is what gets measured.
   E·B = 0 and E² = B²  →  |v| = 1 exactly. No such frame exists, and this
                           returns the reason instead of a number. */
function rlFieldDrift(E, B){
  const I = relFieldInvariants(E, B);
  const scale = Math.max(1e-300, vdot(E, E) + vdot(B, B));
  const v = relDriftVelocity(E, B);
  const sp = vlen(v);
  const out = { v, speed:sp, character:relFieldCharacter(E, B), ok:false, why:'' };
  if(scale < 1e-24){ out.why = 'there is no field to boost'; return out; }
  if(!(sp < 1)){
    out.why = 'this is a null field — E·B = 0 and E² = B² — so the boost that ' +
              'would remove one of them is exactly at c, and no frame does it';
    return out;
  }
  const R = rlFieldBoostTwo(E, B, v);
  out.ok = true;
  out.E = R.vec.E; out.B = R.vec.B;
  out.eLeft = vlen(out.E); out.bLeft = vlen(out.B);
  out.gross = Math.sqrt(scale);
  /* in the drift frame E and B are parallel (or one of them is gone), and the
     angle between them is the thing to print when neither vanishes */
  const eb = vlen(out.E) * vlen(out.B);
  out.parallel = eb < 1e-24 ? 0 : Math.abs(vlen(vcross(out.E, out.B))) / eb;
  out.removes = Math.abs(I.dot) > 1e-9 * scale ? 'neither'
              : I.diff > 0 ? 'magnetic' : I.diff < 0 ? 'electric' : 'neither';
  return out;
}

/* A 4×4 the reader typed. Four rows of four numbers, whitespace-separated;
   lines beginning # are comments. Antisymmetry is MEASURED, not imposed — a
   tensor that is not antisymmetric is not a field tensor, and saying so is
   more use than silently symmetrising it. */
function rlTensorParse(text, def){
  const rows = [], errs = [];
  String(text).split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, '').trim();
    if(!line) return;
    if(rows.length >= 4){ errs.push({ line:i + 1, msg:'a rank-2 tensor in four dimensions has four rows' }); return; }
    const t = line.split(/[\s,]+/).filter(s => s.length);
    if(t.length !== 4){ errs.push({ line:i + 1, msg:'four entries to a row, got ' + t.length }); return; }
    const r = t.map(mathNum);
    const bad = r.findIndex(x => !Number.isFinite(x));
    if(bad >= 0){ errs.push({ line:i + 1, msg:'"' + t[bad] + '" is not a number' }); return; }
    rows.push(r);
  });
  if(rows.length && rows.length < 4) errs.push({ line:0, msg:'only ' + rows.length + ' of the four rows' });
  return { F: rows.length === 4 ? rows : (def || null), errs };
}

/* What the typed tensor is, measured. `anti` is the worst |F^μν + F^νμ| and it
   is reported against `scale`, the size of the largest entry: an antisymmetry
   residual of 10⁻⁹ means one thing on entries of order 1 and another on
   entries of order 10⁹. */
function rlTensorCheck(F){
  let anti = 0, scale = 0, diag = 0;
  for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){
    scale = Math.max(scale, Math.abs(F[i][j]));
    if(i === j) diag = Math.max(diag, Math.abs(F[i][j]));
    else anti = Math.max(anti, Math.abs(F[i][j] + F[j][i]));
  }
  const E = relTensorE(F), B = relTensorB(F);
  const I = relFieldInvariants(E, B);
  /* the same two numbers by contraction rather than by vector algebra */
  const s1 = relTensorInvariant1(F);        // = 2(B² − E²)
  const s2 = rlTensorInvariant2(F);         // = −4 E·B
  return { E, B, anti, diag, scale:Math.max(1e-300, scale),
           dot:I.dot, diff:I.diff,
           fromTensorDiff:-s1 / 2, fromTensorDot:-s2 / 4,
           s1, s2, character:relFieldCharacter(E, B) };
}

/* The presets. `character` is a claim about the field and `auditclaims`
   recomputes it from the invariants; `removes` says which field a frame can
   get rid of, and the check for that one is to GO to the frame. */
const RL_FIELDS = {
  pureE:  { name:'a pure electric field', short:'pure E',
            E:[0, 1, 0], B:[0, 0, 0], character:'electric', removes:'magnetic',
            why:'A static charge sees this. Boost it and a magnetic field appears — which is the whole of magnetism, met from the other end.' },
  pureB:  { name:'a pure magnetic field', short:'pure B',
            E:[0, 0, 0], B:[0, 0, 1], character:'magnetic', removes:'electric',
            why:'Inside a solenoid. There is a frame where the electric field vanishes, and it is this one; every other frame sees both.' },
  wave:   { name:'a light wave', short:'a wave',
            E:[0, 1, 0], B:[0, 0, 1], character:'null', removes:'neither',
            why:'E ⊥ B and |E| = |B|, so both invariants vanish. No frame can make it purely electric, purely magnetic, or stationary — which is exactly the obstruction that ends the "chasing a light beam" stage.' },
  skew:   { name:'E and B at an angle', short:'E·B ≠ 0',
            E:[0, 1, 0], B:[0, 0.6, 0.8], character:'neither', removes:'neither',
            why:'E·B ≠ 0, so no frame removes either field. The drift frame makes them PARALLEL instead, and the panel measures the angle it is left with.' },
  strong: { name:'mostly magnetic, and skew', short:'strong B',
            E:[0.3, 0.2, 0.25], B:[0, 0, 1.4], character:'neither', removes:'neither',
            why:'A pulsar magnetosphere is nearer this than to any of the tidy cases: a large B, a small E across it, and E·B not quite zero.' },
  cross:  { name:'crossed, nearly null', short:'nearly null',
            E:[0, 1, 0], B:[0, 0, 0.98], character:'electric', removes:'magnetic',
            why:'E·B = 0 and E² only just beats B², so the frame that removes B exists but is moving at 0.98c. Watch what that does to the numbers — this is where a formula that ignores conditioning starts printing nonsense.' }
};
const rlFieldVec = a => v3(a[0], a[1], a[2]);
/* The presets for the tensor stage, written as tensors rather than as fields,
   because the point of that stage is that the sixteen numbers come first. */
const RL_TENSORS = {
  fromE:   { name:'built from a pure E', short:'pure E',
             text:'0 -1 0 0\n1 0 0 0\n0 0 0 0\n0 0 0 0',
             anti:true, why:'The first row and column carry E; everything else is zero. Read it back and B = 0.' },
  fromB:   { name:'built from a pure B', short:'pure B',
             text:'0 0 0 0\n0 0 0 0\n0 0 0 -1\n0 0 1 0',
             anti:true, why:'The spatial block carries B and the time row is empty, so this field is purely magnetic in this frame — and in no other.' },
  wave:    { name:'a light wave', short:'a wave',
             text:'0 0 -1 0\n0 0 0 0\n1 0 0 -1\n0 0 1 0',
             anti:true, why:'Both contractions vanish: F_μν F^μν = 0 and F_μν F̃^μν = 0. That pair of zeros is what "light" means in this language.' },
  general: { name:'six independent components', short:'general',
             text:'0 -0.4 -0.9 -0.2\n0.4 0 -0.7 0.5\n0.9 0.7 0 -0.3\n0.2 -0.5 0.3 0',
             anti:true, why:'Nothing special about it — six numbers, none of them zero, and the invariants are whatever they are.' },
  broken:  { name:'NOT antisymmetric', short:'not a tensor',
             text:'0 -1 0 0\n1 0 0 0\n0 0 0 1\n0 0 1 0',
             anti:false, why:'The bottom-right block is symmetric, so this is not a field tensor at all. The panel says so and says where — a stage that silently symmetrised it would be teaching the opposite of the lesson.' }
};
