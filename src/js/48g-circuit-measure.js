/* ============================================================================
   7b · CURRENT IN THE WIRES
   A branch current is known exactly; a wire's current is not, because several
   wires can meet at one node. But the wires belonging to a node form a graph
   whose leaves are component pins with known injections, so stripping leaves
   one at a time determines every wire in a tree exactly. Wires left inside a
   loop are genuinely indeterminate from topology alone (a real board splits
   that current by resistance) and are reported as zero.
   ============================================================================ */

/* split every wire wherever another wire's end or a component pin lands on it,
   so the connection graph has no hidden T junctions */
function ckSegments(sch){
  const pts = [];
  for(const c of sch.comps) for(const p of ckPins(c)) pts.push(p);
  for(const w of sch.wires) pts.push(w.a, w.b);
  const segs = [];
  sch.wires.forEach((w, wi) => {
    const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y, L2 = dx * dx + dy * dy;
    const us = [0, 1];
    if(L2 > 1e-12) for(const p of pts){
      if(!ckOnSegment(p, w)) continue;
      const u = ((p.x - w.a.x) * dx + (p.y - w.a.y) * dy) / L2;
      if(u > 1e-6 && u < 1 - 1e-6) us.push(u);
    }
    us.sort((a, b) => a - b);
    for(let i = 0; i + 1 < us.length; i++){
      if(us[i + 1] - us[i] < 1e-6) continue;
      segs.push({ wire: wi,
        a:{ x: w.a.x + dx * us[i],     y: w.a.y + dy * us[i] },
        b:{ x: w.a.x + dx * us[i + 1], y: w.a.y + dy * us[i + 1] } });
    }
  });
  return segs;
}

function ckWireCurrents(ck, sch, states, segs){
  segs = segs || ckSegments(sch);
  const cur = new Float64Array(segs.length);
  const P = new Map();
  const get = k => { if(!P.has(k)) P.set(k, { inj:0, edges:[] }); return P.get(k); };
  segs.forEach((s, i) => {
    get(ckKey(s.a)).edges.push({ e:i, s: 1 });
    get(ckKey(s.b)).edges.push({ e:i, s:-1 });
  });
  const gnd = sch.comps.find(c => c.kind === 'GND');
  const gndKey = gnd ? ckKey(ckPins(gnd)[0]) : null;
  for(const st of states){
    const pins = ckPins(st.e.c);
    for(const p of st.ports){
      const i = p[2];
      if(!Number.isFinite(i)) continue;
      /* current leaves the node at pin A and re-enters at pin B */
      if(p[3] >= 0 && pins[p[3]]) get(ckKey(pins[p[3]])).inj -= i;
      else if(gndKey) get(gndKey).inj -= i;
      if(p[4] >= 0 && pins[p[4]]) get(ckKey(pins[p[4]])).inj += i;
      else if(gndKey) get(gndKey).inj += i;
    }
  }
  const known = new Uint8Array(segs.length);
  let progress = true, guard = 0;
  while(progress && guard++ <= segs.length + 4){
    progress = false;
    P.forEach(p => {
      let un = null, nun = 0, sum = p.inj;
      for(const e of p.edges){
        if(known[e.e]) sum -= e.s * cur[e.e];
        else { un = e; nun++; }
      }
      if(nun !== 1) return;
      cur[un.e] = sum / un.s;
      known[un.e] = 1;
      progress = true;
    });
  }
  return cur;
}

/* the whole solution, in the units a meter would read */
function ckMeasure(ck, x, h, method, mode, t){
  const states = [];
  for(const e of ck.els){ e._t = t || 0; states.push(ckElemState(ck, e, x, h, method, mode)); }
  const nodeV = new Float64Array(ck.nm.count);
  for(let k = 1; k < ck.nm.count; k++) nodeV[k] = x[k - 1];
  /* KCL residual per node, from the independently recomputed branch currents */
  const kcl = new Float64Array(ck.nm.count);
  let scale = 1e-12;
  for(const s of states) for(const p of s.ports){
    if(p[0] > 0) kcl[p[0]] += p[2];
    if(p[1] > 0) kcl[p[1]] -= p[2];
    scale = Math.max(scale, Math.abs(p[2]));
  }
  let kclMax = 0, kclNode = 0;
  for(let k = 1; k < ck.nm.count; k++) if(Math.abs(kcl[k]) > kclMax){ kclMax = Math.abs(kcl[k]); kclNode = k; }
  let pIn = 0, pOut = 0;
  for(const s of states){ if(s.p > 0) pIn += s.p; else pOut -= s.p; }
  const energy = states.reduce((a, s) => a + (s.energy || 0), 0);
  return { states, nodeV, kcl, kclMax, kclNode, kclRel: kclMax / scale,
           absorbed: pIn, delivered: pOut, residual: pIn - pOut, energy, scale };
}

/* ============================================================================
   8 · SIGNAL MATHS — RMS, average power, and the spectrum
   ============================================================================ */

function ckRMS(a, from){
  let s = 0, n = 0;
  for(let i = from || 0; i < a.length; i++){ s += a[i] * a[i]; n++; }
  return n ? Math.sqrt(s / n) : 0;
}
function ckMean(a, from){
  let s = 0, n = 0;
  for(let i = from || 0; i < a.length; i++){ s += a[i]; n++; }
  return n ? s / n : 0;
}
/* in-place radix-2 FFT; re and im must have a power-of-two length */
function ckFFT(re, im){
  const n = re.length;
  for(let i = 1, j = 0; i < n; i++){
    let bit = n >> 1;
    for(; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if(i < j){ let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for(let len = 2; len <= n; len <<= 1){
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for(let i = 0; i < n; i += len){
      let cr = 1, ci = 0;
      for(let k = 0; k < len / 2; k++){
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
/* single-sided amplitude spectrum with a Hann window, scaled so a pure sine of
   amplitude A reads A at its own bin */
function ckSpectrum(samples, dt, nfft){
  let N = 1;
  while(N * 2 <= Math.min(samples.length, nfft || 1024)) N *= 2;
  if(N < 8) return { f:[], mag:[], df:0 };
  const off = samples.length - N;
  const re = new Float64Array(N), im = new Float64Array(N);
  let mean = 0;
  for(let i = 0; i < N; i++) mean += samples[off + i];
  mean /= N;
  for(let i = 0; i < N; i++){
    const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
    re[i] = (samples[off + i] - mean) * w;
  }
  ckFFT(re, im);
  const half = N / 2, f = new Float64Array(half), mag = new Float64Array(half);
  const df = 1 / (N * dt);
  for(let k = 0; k < half; k++){
    f[k] = k * df;
    mag[k] = 4 * Math.hypot(re[k], im[k]) / N;              /* 2 for one side, 2 for Hann */
  }
  mag[0] = Math.abs(mean);
  return { f, mag, df, n:N };
}
/* total harmonic distortion referred to the largest spectral line */
function ckTHD(spec){
  let k0 = 1, m0 = 0;
  for(let k = 2; k < spec.mag.length; k++) if(spec.mag[k] > m0){ m0 = spec.mag[k]; k0 = k; }
  if(m0 <= 0) return { thd:0, f0:0, fund:0 };
  let s = 0;
  for(let h = 2; h * k0 < spec.mag.length; h++) s += spec.mag[h * k0] * spec.mag[h * k0];
  return { thd: Math.sqrt(s) / m0, f0: spec.f[k0], fund: m0 };
}

