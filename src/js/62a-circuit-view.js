/* ============================================================================
   4c · THE CIRCUIT BENCH
   One stage, because a circuit is one object seen several ways: the schematic
   on top, an instrument underneath. The instrument changes (oscilloscope, Bode
   plotter, DC sweep, spectrum analyser, power meter, phasor diagram) but the
   circuit being measured never does.

   Everything drawn here comes from the MNA solve in the engine above. The
   carriers that crawl along a wire are moving at a speed proportional to that
   wire's own current, the wire's tint is its node's potential, and the field
   overlay is Laplace's equation relaxed on the real conductor geometry.
   ============================================================================ */

const CK_GRID = 1;                        /* one grid unit between pin holes */
const CK_SPLIT = 0.60;                    /* fraction of the canvas given to the schematic */

/* ---- schematic ↔ screen ---------------------------------------------------- */
function ckView(st, W, H){
  const split = st.pane === 'none' ? 1 : CK_SPLIT;
  const rect = { x:0, y:0, w:W, h:H * split };
  const f = st.fit || { cx:0, cy:0, wx:34, wy:20 };
  const sc = st.zoom * Math.min(rect.w / f.wx, rect.h / f.wy);
  const cx = rect.x + rect.w / 2 + st.pan.x - f.cx * sc;
  const cy = rect.y + rect.h / 2 + st.pan.y + f.cy * sc;
  return {
    rect, sc, cx, cy, split,
    toS: (x, y) => [cx + x * sc, cy - y * sc],
    toG: (sx, sy) => ({ x:(sx - cx) / sc, y:(cy - sy) / sc }),
    inRect: (sx, sy) => sy <= rect.y + rect.h
  };
}
/* the extent of everything on the board, so the view can frame it */
function ckBounds(sch){
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, any = false;
  const add = (x, y) => { any = true; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  for(const c of sch.comps){ add(c.x, c.y); for(const p of ckPins(c)) add(p.x, p.y); }
  for(const w of sch.wires){ add(w.a.x, w.a.y); add(w.b.x, w.b.y); }
  return any ? { x0, x1, y0, y1 } : null;
}
/* frame the circuit with a margin wide enough for its labels */
function ckFitView(st){
  const b = ckBounds(st.sch);
  st.pan = { x:0, y:0 };
  st.zoom = 1;
  st.fit = b ? { cx:(b.x0 + b.x1) / 2, cy:(b.y0 + b.y1) / 2,
                 wx: Math.max(12, (b.x1 - b.x0) + 7),
                 wy: Math.max(8,  (b.y1 - b.y0) + 5) }
             : { cx:0, cy:0, wx:24, wy:16 };
}
const ckSnap = p => ({ x: Math.round(p.x / CK_GRID) * CK_GRID, y: Math.round(p.y / CK_GRID) * CK_GRID });

