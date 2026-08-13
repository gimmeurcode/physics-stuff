/* ============================================================================
   SYMBOLS
   Drawn in grid units about the component's centre, then rotated — so the
   picture and the netlist can never disagree about where a pin is.
   ============================================================================ */
function ckDrawSym(ctx, c, V, sel, sim){
  const [sx, sy] = V.toS(c.x, c.y);
  const s = V.sc;
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(-(c.rot || 0) * Math.PI / 180);
  const col = sel ? rgbCss(TH.accent) : rgbCss(TH.text, 0.92);
  ctx.strokeStyle = col; ctx.fillStyle = col;
  ctx.lineWidth = Math.max(1.2, s * 0.045);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = (x, y) => [x * s, -y * s];
  const line = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(...P(x1, y1)); ctx.lineTo(...P(x2, y2)); ctx.stroke(); };
  const K = c.kind;

  if(CK_KINDS[K] && CK_KINDS[K].np === 2 && K !== 'GND'){ line(-1, 0, -0.42, 0); line(0.42, 0, 1, 0); }

  switch(K){
    case 'R': {
      ctx.beginPath();
      const n = 6, a = 0.4, h = 0.26;
      ctx.moveTo(...P(-a, 0));
      for(let i = 0; i < n; i++) ctx.lineTo(...P(-a + (i + 0.5) * (2 * a / n), (i % 2 ? -1 : 1) * h));
      ctx.lineTo(...P(a, 0));
      ctx.stroke();
      break;
    }
    case 'C':
      line(-0.12, -0.42, -0.12, 0.42);
      line( 0.12, -0.42,  0.12, 0.42);
      line(-0.42, 0, -0.12, 0); line(0.12, 0, 0.42, 0);
      break;
    case 'L': {
      ctx.beginPath();
      for(let i = 0; i < 4; i++){
        const x0 = -0.4 + i * 0.2;
        ctx.moveTo(...P(x0, 0));
        ctx.arc(...P(x0 + 0.1, 0), 0.1 * s, Math.PI, 0, false);
      }
      ctx.stroke();
      break;
    }
    case 'V': case 'I': {
      ctx.beginPath(); ctx.arc(0, 0, 0.42 * s, 0, 6.2832); ctx.stroke();
      ctx.font = '600 ' + (0.36 * s).toFixed(0) + 'px ' + FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if(K === 'I'){
        ctx.beginPath();
        ctx.moveTo(...P(0.24, 0)); ctx.lineTo(...P(-0.16, 0)); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(...P(-0.26, 0)); ctx.lineTo(...P(-0.1, 0.1)); ctx.lineTo(...P(-0.1, -0.1));
        ctx.closePath(); ctx.fill();
      } else if(c.wave === 'dc'){
        line(0.16, -0.2, 0.16, 0.2);        /* the long plate: + terminal is pin 1 */
        line(-0.16, -0.1, -0.16, 0.1);
      } else {
        ctx.beginPath();
        for(let i = 0; i <= 24; i++){
          const u = -0.26 + 0.52 * i / 24;
          const p = P(u, 0.2 * Math.sin(i / 24 * 2 * Math.PI));
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
      }
      break;
    }
    case 'D':
      ctx.beginPath();
      ctx.moveTo(...P(-0.25, 0.3)); ctx.lineTo(...P(0.2, 0)); ctx.lineTo(...P(-0.25, -0.3));
      ctx.closePath(); ctx.fill();
      line(0.2, -0.32, 0.2, 0.32);
      break;
    case 'SW': {
      const on = sim ? ckSwitchOn({ kind:'SW', c }, sim.t) : !!c.closed;
      ctx.beginPath(); ctx.arc(...P(-0.36, 0), 0.07 * s, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(...P(0.36, 0), 0.07 * s, 0, 6.2832); ctx.fill();
      line(-0.34, 0, on ? 0.34 : 0.26, on ? 0 : 0.34);
      break;
    }
    case 'SWV': {
      /* control pair on the left, switched contacts on the right, with the
         dashed link that says one operates the other. The contacts are pins 3
         and 4, so the switched path must actually run between them. */
      const on = sim && sim.ck ? (function(){
        const e = (sim.ck.els || []).find(q => q.c === c);
        return e ? !!e.swOn : false;
      })() : false;
      line(-1, 1, -0.62, 1); line(-1, -1, -0.62, -1);
      ctx.strokeRect(...P(-0.62, 0.42), 0.34 * s, 0.84 * s);   /* the coil box */
      ctx.setLineDash([3, 3]); line(-0.28, 0, 0.5, 0); ctx.setLineDash([]);
      line(1, 1, 0.62, 1); line(1, -1, 0.62, -1);
      ctx.beginPath(); ctx.arc(...P(0.62, 0.45), 0.075 * s, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(...P(0.62, -0.45), 0.075 * s, 0, 6.2832); ctx.fill();
      line(0.62, 1, 0.62, 0.45); line(0.62, -1, 0.62, -0.45);
      /* the lever: vertical when closed, swung aside when open */
      if(on) line(0.62, -0.45, 0.62, 0.45);
      else   line(0.62, -0.45, 1.05, 0.36);
      break;
    }
    case 'GND':
      line(0, 0, 0, -0.3);
      line(-0.4, -0.3, 0.4, -0.3);
      line(-0.24, -0.46, 0.24, -0.46);
      line(-0.1, -0.6, 0.1, -0.6);
      break;
    case 'OPAMP': {
      ctx.beginPath();
      ctx.moveTo(...P(-1.1, 1.5)); ctx.lineTo(...P(1.1, 0)); ctx.lineTo(...P(-1.1, -1.5));
      ctx.closePath(); ctx.stroke();
      line(-2, -1, -1.1, -1); line(-2, 1, -1.1, 1); line(1.1, 0, 2, 0);
      ctx.font = '600 ' + (0.42 * s).toFixed(0) + 'px ' + FONT_UI;
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText('+', ...P(-0.95, -1));
      ctx.fillText('−', ...P(-0.95, 1));
      break;
    }
    case 'XFMR': case 'XFMRI': {
      const coil = (x, dir) => {
        ctx.beginPath();
        for(let i = 0; i < 3; i++){
          const y0 = 0.8 - i * 0.55;
          ctx.moveTo(...P(x, y0));
          ctx.arc(...P(x, y0 - 0.275), 0.275 * s, Math.PI / 2, -Math.PI / 2, dir > 0);
        }
        ctx.stroke();
      };
      coil(-0.35, 1); coil(0.35, -1);
      line(-1, 1, -0.35, 1); line(-1, -1, -0.35, -0.85);
      line(1, 1, 0.35, 1); line(1, -1, 0.35, -0.85);
      line(-0.09, 0.95, -0.09, -0.95); line(0.09, 0.95, 0.09, -0.95);
      if(K === 'XFMRI'){ ctx.font = '600 ' + (0.3 * s).toFixed(0) + 'px ' + FONT_MONO;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText('ideal', ...P(0, 1.05)); }
      break;
    }
    case 'VCVS': case 'VCCS': case 'CCVS': case 'CCCS': {
      const four = K === 'VCVS' || K === 'VCCS';
      const cy2 = 0;
      ctx.beginPath();
      ctx.moveTo(...P(0, cy2 + 0.5)); ctx.lineTo(...P(0.45, cy2)); ctx.lineTo(...P(0, cy2 - 0.5));
      ctx.lineTo(...P(-0.45, cy2)); ctx.closePath(); ctx.stroke();
      if(four){ line(-1, 1, -0.6, 1); line(-1, -1, -0.6, -1);
                line(1, 1, 0.6, 1); line(1, -1, 0.6, -1);
                line(0.6, 1, 0.6, 0.02); line(0.6, -1, 0.6, -0.02);
                ctx.setLineDash([3, 3]); line(-0.6, 1, -0.6, -1); ctx.setLineDash([]);
                line(-0.6, 0, -0.45, 0); line(0.45, 0, 0.6, 0); }
      ctx.font = '600 ' + (0.34 * s).toFixed(0) + 'px ' + FONT_UI;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(CK_KINDS[K].sym, ...P(0, cy2));
      break;
    }
    case 'M': {
      ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.arc(0, 0, 0.3 * s, 0, 6.2832); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '600 ' + (0.3 * s).toFixed(0) + 'px ' + FONT_MONO;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('k', 0, 0);
      break;
    }
  }
  ctx.restore();
}

/* the value a component announces on the canvas, in proper units */
function ckLabelOf(c){
  switch(c.kind){
    case 'R': return ckEng(c.val, 'Ω');
    case 'C': return ckEng(c.val, 'F');
    case 'L': return ckEng(c.val, 'H');
    case 'V': return c.wave === 'dc' ? ckEng(c.val, 'V')
            : ckEng(c.amp, 'V') + (c.freq ? ' · ' + ckEng(c.freq, 'Hz') : '');
    case 'I': return c.wave === 'dc' ? ckEng(c.val, 'A')
            : ckEng(c.amp, 'A') + (c.freq ? ' · ' + ckEng(c.freq, 'Hz') : '');
    case 'XFMR': return 'n = ' + fmtNum(Math.sqrt(c.l2 / c.l1), 3) + ' · k = ' + fmtNum(c.k, 3);
    case 'XFMRI': return 'N = ' + fmtNum(c.ratio, 3) + ' : 1';
    case 'OPAMP': return c.ideal ? 'ideal' : 'A₀ = ' + ckEng(c.a0, '') + ' · ±' + fmtNum(c.vsat, 3) + ' V';
    case 'SW': return c.mode === 'time' ? 'closes at ' + ckEng(c.ton, 's') : (c.closed ? 'closed' : 'open');
    case 'SWV': return 'V_th = ' + fmtNum(c.vth, 3) + ' V ± ' + fmtNum(c.vhys, 3);
    case 'VCVS': return 'µ = ' + fmtNum(c.gain, 3);
    case 'VCCS': return 'g_m = ' + ckEng(c.gain, 'S');
    case 'CCVS': return 'r = ' + ckEng(c.gain, 'Ω') + ' × i(' + c.ctl + ')';
    case 'CCCS': return 'β = ' + fmtNum(c.gain, 3) + ' × i(' + c.ctl + ')';
    case 'M': return c.a + '–' + c.b + '  k = ' + fmtNum(c.k, 3);
    case 'D': return 'Iₛ = ' + ckEng(c.is, 'A');
    default: return '';
  }
}

