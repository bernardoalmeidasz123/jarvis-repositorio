// Motor de render: desenha o quadro do tempo t (segundos) no canvas 1920x1080.
// Determinístico: o mesmo t gera sempre o mesmo quadro.
(function () {
  const W = 1920, H = 1080, BAND = 140, SAFE_B = H - BAND;
  const C = {
    bg: '#0B0710', pink: '#FF4F8B', orange: '#FF9A3C', teal: '#2EC4B6', blue: '#4C8DFF', amber: '#FFB020',
    green: '#7BD389', white: '#F6EEF7', dim: 'rgba(246,238,247,0.35)',
  };
  const REG = TL.REGION.color;
  const SEALS = { 'OFICIAL': C.teal, 'HISTÓRIA REAL': C.blue, 'COMUNIDADE': C.amber };
  const TITLE = '800 {s}px Bricolage', SUB = '600 {s}px Bricolage', MONO = '700 {s}px JBMono';
  const font = (f, s) => f.replace('{s}', s);

  const cv = document.getElementById('c');
  let ctx = cv.getContext('2d');

  // ---------- util ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = (p) => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  const eOut = (p) => 1 - Math.pow(1 - clamp(p), 3);
  const prog = (t, a, d) => clamp((t - a) / d);
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const fmtInt = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  function neonStroke(color, width, blur = 18) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width + 2; ctx.shadowColor = color; ctx.shadowBlur = blur;
    ctx.globalAlpha *= 0.85; ctx.stroke(); ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, width * 0.35); ctx.stroke(); ctx.restore();
  }
  function glowText(txt, x, y, f, color, blur = 22, align = 'left', base = 'alphabetic') {
    ctx.save(); ctx.font = f; ctx.textAlign = align; ctx.textBaseline = base;
    ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.fillStyle = color; ctx.fillText(txt, x, y);
    ctx.shadowBlur = 0; ctx.fillText(txt, x, y); ctx.restore();
  }
  function text(txt, x, y, f, color, align = 'left', base = 'alphabetic', spacing = 0) {
    ctx.save(); ctx.font = f; ctx.textAlign = align; ctx.textBaseline = base; ctx.fillStyle = color;
    if (spacing) ctx.letterSpacing = spacing + 'px';
    ctx.fillText(txt, x, y); ctx.restore();
  }
  function fitFont(txt, f, size, maxW) {
    ctx.save(); let s = size;
    while (s > 14) { ctx.font = font(f, s); if (ctx.measureText(txt).width <= maxW) break; s -= 2; }
    ctx.restore(); return s;
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function polyPath(pts, n) { // n = fração desenhada
    ctx.beginPath(); if (!pts.length) return;
    const segs = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
    let rem = total * (n === undefined ? 1 : clamp(n)); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) {
      const d = segs[i - 1], k = Math.min(1, rem / d);
      ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)); rem -= d;
    }
  }
  function pointAt(pts, n) {
    let total = 0; const segs = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); total += d; }
    let rem = total * clamp(n);
    for (let i = 1; i < pts.length; i++) {
      if (rem <= segs[i - 1]) { const k = rem / segs[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
      rem -= segs[i - 1];
    }
    const a = pts[pts.length - 2], b = pts[pts.length - 1]; return [b[0], b[1], Math.atan2(b[1] - a[1], b[0] - a[0])];
  }

  // ---------- efeitos sonoros ----------
  // Cada elemento que aparece registra um evento no tempo absoluto em que surge.
  // collectFx() percorre o vídeo e devolve a lista para o sfx.py sintetizar e mixar.
  const FXLOG = new Map(); let T_NOW = 0, SHOT = null;
  function fx(type, u, dur = 0) {
    const at = +(T_NOW - u).toFixed(2);
    if (SHOT && (at < SHOT.start - 0.05 || at >= SHOT.end)) return;
    FXLOG.set(type + '@' + at, { type, at, dur });
  }

  // ---------- assets ----------
  const FILES = {
    VC_01: 'VC_01_capa.jpg', VC_02: 'VC_02.jpg', VC_03: 'VC_03.jpg', VC_04: 'VC_04_recorte.jpg', VC_05: 'VC_05_recorte.jpg',
    MAP: '1_Vice_City_mapa.jpg', LEO: 'MAPA_LEONIDA_completo_V17.jpg',
  };
  const IMG = {}, BLUR = {};
  function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
  let MINI;

  async function init() {
    await Promise.all(Object.entries(FILES).map(async ([k, f]) => { IMG[k] = await loadImg('../assets/src/1_Vice_City/' + f); }));
    for (const k of Object.keys(IMG)) { // versão desfocada em baixa resolução para fundos de cartões
      const im = IMG[k], s = 960 / im.width, c = document.createElement('canvas');
      c.width = 960; c.height = Math.round(im.height * s);
      const x = c.getContext('2d'); x.filter = 'blur(10px) brightness(0.55) saturate(0.9)';
      x.drawImage(im, -20, -20, c.width + 40, c.height + 40); BLUR[k] = { c, s };
    }
    // mini-mapa: recorte da ilha no mapa da comunidade, dessaturado
    MINI = document.createElement('canvas'); MINI.width = 260; MINI.height = 366;
    const m = MINI.getContext('2d'); m.filter = 'grayscale(0.85) brightness(0.55) contrast(1.2)';
    m.drawImage(IMG.LEO, 0, 140, 1290, 1820, 0, 0, 260, 366);
    await document.fonts.load(font(TITLE, 40)); await document.fonts.load(font(SUB, 40));
    await document.fonts.load(font(MONO, 40)); await document.fonts.load('500 20px JBMono');
    await document.fonts.ready;
  }

  // ---------- câmera sobre imagens ----------
  function camDraw(key, cx, cy, w, bg) {
    const im = IMG[key], h = w * 9 / 16;
    if (!bg) { cx = clamp(cx, w / 2, im.width - w / 2); cy = clamp(cy, h / 2, im.height - h / 2); }
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); }
    const s = W / w;
    ctx.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
    ctx.drawImage(im, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { cx, cy, w, s, toScreen: (p) => [W / 2 + (p[0] - cx) * s, H / 2 + (p[1] - cy) * s] };
  }
  function blurDraw(key, cx, cy, w) {
    const b = BLUR[key], im = IMG[key], h = w * 9 / 16;
    w = Math.min(w, im.width); cx = clamp(cx, w / 2, im.width - w / 2); cy = clamp(cy, h / 2, im.height - h / 2);
    const s = W / (w * b.s);
    ctx.setTransform(s, 0, 0, s, W / 2 - cx * b.s * s, H / 2 - cy * b.s * s);
    ctx.drawImage(b.c, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
  // Ken Burns: 100% → 112% em ~7s, depois deriva lenta; pan contínuo de a até b.
  const kb = (lt) => 1 + 0.12 * eOut(Math.min(lt, 7) / 7) + 0.012 * Math.max(0, lt - 7);

  // LUPA: círculo neon, chamada até rótulo mono, zoom 2x por 2s e volta.
  function lupaZoom(lupas, lt) {
    let z = 1, p = null;
    for (const l of lupas) {
      const u = lt - l.t;
      if (u < 0.9 || u > 3.7) continue;
      const k = u < 1.4 ? ease((u - 0.9) / 0.5) : u < 3.2 ? 1 : 1 - ease((u - 3.2) / 0.5);
      z = 1 + k; p = l.p;
    }
    return { z, p };
  }
  function drawLupa(l, sp, lt) {
    const u = lt - l.t; fx('circle', u); fx('zoom', u - 0.9); fx('pop', u - 0.9);
    if (u < 0 || u > 4.3) return;
    const fade = u > 3.9 ? 1 - (u - 3.9) / 0.4 : 1;
    ctx.save(); ctx.globalAlpha *= fade;
    const r = 78;
    ctx.beginPath(); ctx.arc(sp[0], sp[1], r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eOut(u / 0.6));
    neonStroke(REG, 4, 22);
    const dir = sp[0] > W - 560 ? -1 : 1, up = sp[1] < 260 ? 1 : -1;
    const a0 = [sp[0] + dir * r * 0.7, sp[1] + up * r * 0.7], a1 = [a0[0] + dir * 90, a0[1] + up * 90], a2 = [a1[0] + dir * 50, a1[1]];
    const lp = eOut((u - 0.5) / 0.4);
    if (lp > 0) {
      polyPath([a0, a1, a2], lp); neonStroke(REG, 2.5, 12);
      if (lp >= 1) {
        ctx.font = font(MONO, 26); const tw = ctx.measureText(l.label).width;
        const bx = dir > 0 ? a2[0] + 6 : a2[0] - 6 - tw - 32, by = a2[1] - 24;
        ctx.save(); ctx.globalAlpha *= eOut((u - 0.9) / 0.25);
        roundRect(bx, by, tw + 32, 48, 6); ctx.fillStyle = 'rgba(11,7,16,0.85)'; ctx.fill(); neonStroke(REG, 1.5, 10);
        text(l.label, bx + 16, by + 34, font(MONO, 26), C.white); ctx.restore();
      }
    }
    ctx.restore();
  }

  function tagBox(txt, x, y, alpha, align = 'left', size = 28) {
    if (alpha <= 0) return;
    const parts = txt.split('→').map((s) => s.trim());
    ctx.save(); ctx.globalAlpha *= alpha; ctx.font = font(MONO, size);
    const wA = ctx.measureText(parts[0]).width, wArr = parts[1] ? ctx.measureText('  →  ').width : 0, wB = parts[1] ? ctx.measureText(parts[1]).width : 0;
    const tw = wA + wArr + wB + 40, th = size + 30;
    if (align === 'right') x -= tw; if (align === 'center') x -= tw / 2;
    x = clamp(x, 40, W - 40 - tw); y = clamp(y, 150, SAFE_B - th - 30);
    roundRect(x, y, tw, th, 8); ctx.fillStyle = 'rgba(11,7,16,0.88)'; ctx.fill(); neonStroke(REG, 2, 14);
    const by = y + th / 2 + size * 0.36;
    text(parts[0], x + 20, by, font(MONO, size), C.white);
    if (parts[1]) { glowText('  →  ', x + 20 + wA, by, font(MONO, size), REG, 12); glowText(parts[1], x + 20 + wA + wArr, by, font(MONO, size), REG, 14); }
    ctx.restore();
  }

  // partículas em parallax (camada da frente anda mais rápido que a imagem)
  function particles(lt, seed, dx = -1) {
    ctx.save();
    for (let i = 0; i < 46; i++) {
      const sp = 14 + hash(seed + i * 3) * 34, x = ((hash(seed + i) * W + dx * lt * sp) % W + W) % W;
      const y = ((hash(seed + i * 7) * SAFE_B - lt * sp * 0.35) % SAFE_B + SAFE_B) % SAFE_B;
      const r = 0.8 + hash(seed + i * 5) * 2.2, a = 0.12 + 0.25 * (0.5 + 0.5 * Math.sin(lt * 1.3 + i));
      ctx.fillStyle = i % 3 === 0 ? `rgba(255,79,139,${a})` : i % 3 === 1 ? `rgba(46,196,182,${a * 0.8})` : `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- contexto do shot ----------
  function mkL(sh, t) {
    const c = sh.chapter;
    return {
      lt: t - sh.start, dur: sh.end - sh.start, sh, c,
      seg: (i) => c.segT[Math.min(i, c.segT.length - 1)].start - sh.start,
      segEnd: (i) => c.segT[Math.min(i, c.segT.length - 1)].end - sh.start,
      at: (v) => (typeof v === 'string' ? c.segT[+v.slice(3)].start - sh.start : v),
    };
  }

  function imageShot(L) {
    const { sh, lt, dur } = L;
    const p = ease(lt / Math.max(dur, 1)) * 0.7 + (lt / Math.max(dur, 1)) * 0.3;
    let cx = lerp(sh.a.x, sh.b.x, p), cy = lerp(sh.a.y, sh.b.y, p), w = sh.a.w / kb(lt);
    const lupas = (sh.lupas || []).map((l) => ({ ...l, t: L.seg(l.s) + 0.25 + (l.dt || 0) }));
    const { z, p: d } = lupaZoom(lupas, lt);
    if (z > 1) { const w2 = w / z; cx = d[0] + (cx - d[0]) / z; cy = d[1] + (cy - d[1]) / z; w = w2; }
    const cam = camDraw(sh.img, cx, cy, w);
    if (sh.tint) { ctx.fillStyle = `rgba(11,7,16,${sh.tint})`; ctx.fillRect(0, 0, W, H); }
    particles(lt, sh.start, sh.b.x > sh.a.x ? -1 : 1);
    for (const l of lupas) drawLupa(l, cam.toScreen(l.p), lt);
    if (sh.name) {
      const u = lt - L.seg(sh.name.s) - (sh.name.dt || 0); fx('hit', u);
      if (u > 0) {
        ctx.save(); ctx.globalAlpha = eOut(u / 0.6);
        ctx.fillStyle = 'rgba(11,7,16,0.55)'; ctx.fillRect(0, 300, W, 260);
        glowText(sh.name.text, 120 - 30 * (1 - eOut(u / 0.8)), 470, font(TITLE, 150), REG, 30);
        ctx.restore();
      }
      if (sh.nameTag) fx('pop', lt - L.seg(sh.nameTag.s));
      if (sh.nameTag) tagBox(sh.nameTag.text, 124, 590, eOut((lt - L.seg(sh.nameTag.s)) / 0.5));
    }
  }

  function mapShot(L) {
    const { sh, lt, dur } = L;
    let cx, cy, w;
    if (sh.z) {
      const p = ease(lt / sh.zoomDur);
      cx = lerp(sh.a.x, sh.z.x, p); cy = lerp(sh.a.y, sh.z.y, p);
      w = Math.exp(lerp(Math.log(sh.a.w), Math.log(sh.z.w), p));
      const after = Math.max(0, lt - sh.zoomDur); w /= 1 + 0.1 * after / Math.max(1, dur - sh.zoomDur);
    } else {
      const p = lt / Math.max(dur, 1);
      cx = lerp(sh.a.x, sh.b.x, ease(p)); cy = lerp(sh.a.y, sh.b.y, ease(p)); w = sh.a.w / kb(lt);
    }
    const cam = camDraw(sh.img, cx, cy, w, sh.bg);
    ctx.fillStyle = 'rgba(11,7,16,0.22)'; ctx.fillRect(0, 0, W, H);
    particles(lt, sh.start + 9);
    if (sh.path) {
      polyPath(sh.path.map(cam.toScreen), eOut((lt - 0.3) / 2.4)); neonStroke(REG, 5, 24);
    }
    let anchor = null;
    if (sh.circle) {
      const u = lt - L.at(sh.circle.at), sp = cam.toScreen(sh.circle.p), r = sh.circle.r * cam.s * 1.6 + 30;
      fx('circle', u);
      anchor = [sp[0], sp[1], r];
      if (u > 0) {
        ctx.beginPath(); ctx.arc(sp[0], sp[1], r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eOut(u / 0.7));
        neonStroke(REG, 4, 24);
        const pulse = (u * 0.8) % 1; ctx.save(); ctx.globalAlpha = (1 - pulse) * 0.5 * clamp(u - 0.7);
        ctx.beginPath(); ctx.arc(sp[0], sp[1], r + pulse * 40, 0, 7); ctx.strokeStyle = REG; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      }
    }
    if (sh.tag) {
      const u = lt - L.at(sh.tag.at); fx('pop', u);
      if (anchor) {
        const right = anchor[0] < W * 0.6;
        tagBox(sh.tag.text, right ? anchor[0] + anchor[2] + 30 : anchor[0] - anchor[2] - 30, anchor[1] - 30, eOut(u / 0.5), right ? 'left' : 'right');
      } else tagBox(sh.tag.text, W / 2, 170, eOut(u / 0.5), 'center');
    }
  }

  function cardsShot(L) {
    const { sh, lt } = L, b = sh.bg;
    blurDraw(b.img, b.x + lt * 6, b.y, b.w / (1 + 0.012 * lt));
    ctx.fillStyle = 'rgba(11,7,16,0.45)'; ctx.fillRect(0, 0, W, H);
    particles(lt, sh.start + 3);
    sh.cards.forEach((cd, i) => {
      const t0 = i === 0 ? 0.15 : L.seg(cd.s), t1 = i + 1 < sh.cards.length ? L.seg(sh.cards[i + 1].s) : L.dur + 1;
      const u = lt - t0, out = t1 - lt;
      if (u < 0 || out < -0.01) return;
      drawCard(cd, u, out < 0.35 ? out / 0.35 : 1);
    });
  }
  function drawCard(cd, u, alpha) {
    fx('pop', u); fx('swish', u - 0.25); fx('pop', u - 0.35);
    const cy = 470, cw = 690, ch = 230;
    ctx.save(); ctx.globalAlpha *= alpha;
    const pl = eOut(u / 0.5), pr = eOut((u - 0.35) / 0.5);
    const lx = 110 - (1 - pl) * 200, rx = 1120 + (1 - pr) * 200;
    // esquerda: jogo
    ctx.save(); ctx.globalAlpha *= pl;
    roundRect(lx, cy - ch / 2, cw, ch, 14); ctx.fillStyle = 'rgba(11,7,16,0.9)'; ctx.fill(); neonStroke('rgba(246,238,247,0.6)', 1.5, 6);
    text('JOGO', lx + 36, cy - ch / 2 + 50, font(MONO, 22), C.dim, 'left', 'alphabetic', 4);
    let s = fitFont(cd.game, TITLE, 64, cw - 72); text(cd.game, lx + 36, cy + 40, font(TITLE, s), C.white);
    ctx.restore();
    // seta neon
    const ap = eOut((u - 0.25) / 0.45);
    if (ap > 0) {
      const x0 = 830, x1 = lerp(x0, 1090, ap);
      ctx.beginPath(); ctx.moveTo(x0, cy); ctx.lineTo(x1, cy);
      if (ap > 0.95) { ctx.moveTo(x1 - 26, cy - 22); ctx.lineTo(x1, cy); ctx.lineTo(x1 - 26, cy + 22); }
      neonStroke(REG, 6, 26);
    }
    // direita: vida real
    ctx.save(); ctx.globalAlpha *= pr;
    roundRect(rx, cy - ch / 2, cw, ch, 14); ctx.fillStyle = 'rgba(11,7,16,0.9)'; ctx.fill(); neonStroke(REG, 2.5, 22);
    text('VIDA REAL', rx + 36, cy - ch / 2 + 50, font(MONO, 22), REG, 'left', 'alphabetic', 4);
    s = fitFont(cd.real, TITLE, 64, cw - 72); glowText(cd.real, rx + 36, cy + 40, font(TITLE, s), C.white, 18);
    if (cd.sub) text(cd.sub, rx + 36, cy + 88, font(MONO, 24), C.orange);
    if (cd.badge) {
      const bu = eOut((u - 0.9) / 0.4); ctx.save(); ctx.globalAlpha *= bu;
      roundRect(rx + cw - 150, cy + ch / 2 - 30, 130, 60, 30); ctx.fillStyle = C.bg; ctx.fill(); neonStroke(C.orange, 2.5, 18);
      glowText(Math.round(24 * bu) + 'H', rx + cw - 85, cy + ch / 2 + 12, font(MONO, 30), C.orange, 14, 'center'); ctx.restore();
    }
    ctx.restore();
    ctx.restore();
  }

  // ---------- gráficos ----------
  function gfxBase(lt, seed = 0) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
    const off = (lt * 8 + seed) % 80;
    ctx.beginPath();
    for (let x = -off; x < W; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = -off * 0.5; y < H; y += 80) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke(); ctx.restore();
  }
  function drift(L, amt = 0.035) { // movimento lento para nada ficar parado
    const k = 1 + amt * (L.lt / Math.max(L.dur, 1));
    ctx.translate(W / 2, SAFE_B / 2); ctx.scale(k, k); ctx.translate(-W / 2, -SAFE_B / 2);
  }
  function timeline(items, y, lt, x0 = 260, x1 = 1660) {
    const n = items.length;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x0 - 60, y); ctx.lineTo(x1 + 60, y); ctx.strokeStyle = 'rgba(246,238,247,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    let litMax = x0 - 60;
    items.forEach((it, i) => { const x = n === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (n - 1)); if (lt >= it.at) litMax = Math.max(litMax, lerp(litMax, x, eOut((lt - it.at) / 0.6))); });
    if (litMax > x0 - 60) { ctx.beginPath(); ctx.moveTo(x0 - 60, y); ctx.lineTo(litMax, y); neonStroke(REG, 3, 14); }
    items.forEach((it, i) => {
      const x = n === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (n - 1)), u = lt - it.at, on = eOut(u / 0.5);
      fx('tick', u);
      ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = 'rgba(246,238,247,0.3)'; ctx.lineWidth = 2; ctx.stroke();
      if (on > 0) {
        ctx.save(); ctx.globalAlpha = on; ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fillStyle = REG; ctx.shadowColor = REG; ctx.shadowBlur = 26; ctx.fill(); ctx.restore();
        if (u > 0 && u < 1.2) { ctx.save(); ctx.globalAlpha = 1 - u / 1.2; ctx.beginPath(); ctx.arc(x, y, 11 + u * 40, 0, 7); ctx.strokeStyle = REG; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      }
      ctx.save(); ctx.globalAlpha = 0.35 + 0.65 * on;
      if (on > 0) glowText(it.y, x, y - 34, font(MONO, 40), C.white, 16 * on, 'center'); else text(it.y, x, y - 34, font(MONO, 40), C.white, 'center');
      text(it.label, x, y + 52, font(MONO, 22), on > 0 ? REG : C.white, 'center', 'alphabetic', 2);
      ctx.restore();
    });
    ctx.restore();
  }
  function counter(value, u, dur, x, y, size, color = REG, align = 'left', fmt = (v) => String(Math.round(v))) {
    fx('count', u, dur);
    const from = value >= 1800 && value <= 2100 ? value - 30 : 0; // anos contam só as últimas décadas
    glowText(fmt(lerp(from, value, eOut(prog(u, 0, dur)))), x, y, font(MONO, size), color, 26, align);
  }
  function pin(x, y, label, lt, color = REG, side = 1, size = 24) {
    fx('pop', lt);
    if (lt < 0) return;
    const a = eOut(lt / 0.5);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 20; ctx.fill();
    const pu = (lt * 0.7) % 1; ctx.shadowBlur = 0; ctx.globalAlpha = a * (1 - pu) * 0.7;
    ctx.beginPath(); ctx.arc(x, y, 9 + pu * 34, 0, 7); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = a;
    if (label) text(label, x + side * 24, y + 8, font(MONO, size), C.white, side > 0 ? 'left' : 'right');
    ctx.restore();
  }
  function headline(txt, lt, y = 150, color = C.white, size = 64) {
    fx('hit', lt);
    if (lt < 0) return;
    ctx.save(); ctx.globalAlpha = eOut(lt / 0.6);
    glowText(txt, W / 2, y + 20 * (1 - eOut(lt / 0.6)), font(TITLE, size), color, 20, 'center'); ctx.restore();
  }
  function caption(txt, x, y, lt, color = C.white, align = 'center', size = 26) {
    fx('tick', lt);
    if (lt < 0) return;
    ctx.save(); ctx.globalAlpha = eOut(lt / 0.5); text(txt, x, y, font(MONO, size), color, align, 'alphabetic', 3); ctx.restore();
  }

  // --- geografia estilizada (lon, lat) ---
  const FL = [[-87.6, 31.0], [-85.0, 31.0], [-84.86, 30.7], [-82.2, 30.57], [-82.0, 30.8], [-81.45, 30.7], [-81.3, 30.0], [-81.0, 29.2], [-80.6, 28.4],
    [-80.6, 28.0], [-80.4, 27.2], [-80.05, 26.5], [-80.1, 25.8], [-80.3, 25.4], [-80.5, 25.2], [-81.0, 25.1], [-81.2, 25.3], [-81.1, 25.8],
    [-81.7, 25.9], [-81.9, 26.5], [-82.2, 26.9], [-82.6, 27.5], [-82.8, 28.0], [-82.7, 28.7], [-83.0, 29.1], [-83.6, 29.9], [-84.0, 30.1],
    [-84.4, 29.9], [-85.0, 29.7], [-85.4, 29.7], [-85.4, 30.0], [-86.2, 30.4], [-87.4, 30.3], [-87.6, 30.9], [-87.6, 31.0]];
  const KEYS = [[-80.4, 25.2], [-80.6, 24.95], [-80.95, 24.75], [-81.3, 24.65], [-81.8, 24.55]];
  const CUBA = [[-84.95, 21.85], [-84.4, 22.2], [-83.6, 22.65], [-82.9, 22.95], [-82.6, 23.0], [-82.0, 23.15], [-81.0, 23.1], [-80.0, 22.9], [-79.0, 22.4],
    [-77.8, 21.8], [-76.5, 21.2], [-75.7, 20.7], [-74.2, 20.2], [-74.5, 20.0], [-75.8, 19.9], [-77.5, 19.85], [-77.1, 20.4], [-78.0, 20.7],
    [-78.8, 21.6], [-80.5, 22.0], [-81.8, 22.2], [-82.5, 22.35], [-83.3, 22.2], [-84.0, 21.9], [-84.95, 21.85]];
  const CITY = { miami: [-80.19, 25.77], jax: [-81.66, 30.33], staug: [-81.31, 29.9], havana: [-82.38, 23.13], mariel: [-82.75, 23.0], keywest: [-81.78, 24.55] };
  const RAIL = [[-81.66, 30.33], [-81.31, 29.9], [-81.02, 29.21], [-80.81, 28.61], [-80.62, 28.0], [-80.39, 27.2], [-80.08, 26.71], [-80.14, 26.12], [-80.19, 25.77]];
  function geo(cam) { // cam: {lon, lat, k, cy}
    const cos = Math.cos(cam.lat * Math.PI / 180);
    return (p) => [W / 2 + (p[0] - cam.lon) * cam.k * cos, (cam.cy || 470) - (p[1] - cam.lat) * cam.k];
  }
  function drawLand(pts, P, n, color = REG) {
    polyPath(pts.map(P), n);
    if (n >= 1) { ctx.save(); ctx.fillStyle = 'rgba(255,79,139,0.04)'; ctx.fill(); ctx.restore(); }
    neonStroke(color, 2.5, 16);
  }
  function icon(name, x, y, s, rot = 0, color = C.white) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5 / s; ctx.lineJoin = 'round';
    ctx.shadowColor = color; ctx.shadowBlur = 12;
    ctx.beginPath();
    if (name === 'train') {
      ctx.rect(-30, -14, 40, 20); ctx.rect(10, -24, 18, 30); ctx.moveTo(-18, -14); ctx.lineTo(-18, -26); ctx.stroke();
      ctx.beginPath(); for (const cx of [-22, -4, 18]) { ctx.moveTo(cx + 6, 10); ctx.arc(cx, 10, 6, 0, 7); } ctx.stroke();
    } else if (name === 'plane') {
      ctx.moveTo(30, 0); ctx.lineTo(-24, -4); ctx.lineTo(-30, -14); ctx.lineTo(-34, -14); ctx.lineTo(-30, 0); ctx.lineTo(-34, 14); ctx.lineTo(-30, 14); ctx.lineTo(-24, 4); ctx.closePath();
      ctx.moveTo(4, -2); ctx.lineTo(-8, -26); ctx.lineTo(-14, -26); ctx.lineTo(-8, -2); ctx.moveTo(4, 2); ctx.lineTo(-8, 26); ctx.lineTo(-14, 26); ctx.lineTo(-8, 2); ctx.stroke();
    } else if (name === 'boat') {
      ctx.moveTo(-26, 0); ctx.lineTo(26, 0); ctx.lineTo(18, 12); ctx.lineTo(-20, 12); ctx.closePath(); ctx.moveTo(-4, 0); ctx.lineTo(-4, -26); ctx.lineTo(12, -4); ctx.lineTo(-4, -4); ctx.stroke();
    } else if (name === 'flower') {
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; ctx.moveTo(0, 0); ctx.ellipse(Math.cos(a) * 12, Math.sin(a) * 12, 10, 6, a, 0, 7); }
      ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
    } else if (name === 'snow') {
      for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.lineTo(-Math.cos(a) * 12, -Math.sin(a) * 12); } ctx.stroke();
    } else if (name === 'mansion') {
      ctx.rect(-40, -20, 80, 40); ctx.moveTo(-48, -20); ctx.lineTo(0, -46); ctx.lineTo(48, -20); ctx.rect(-8, 2, 16, 18);
      for (const wx of [-30, 18]) ctx.rect(wx, -10, 12, 12); ctx.stroke();
    } else if (name === 'hurricane') {
      for (let a = 0; a < 2; a++) { ctx.moveTo(0, 0); for (let i = 0; i <= 40; i++) { const t = i / 40, ang = a * Math.PI + t * 4.2, r = t * 40; ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); } }
      ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 6, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  const GFX = {};

  GFX.florida = (L) => {
    const { lt } = L; gfxBase(lt);
    const zp = ease((lt - L.seg(4)) / 3);
    const cam = { lon: lerp(-82.3, -80.4, zp), lat: lerp(27.9, 25.9, zp), k: lerp(118, 420, zp), cy: 440 };
    ctx.save(); drift(L, 0.02);
    const P = geo(cam);
    drawLand(FL, P, eOut(lt / 2.5)); polyPath(KEYS.map(P), eOut((lt - 1.5) / 1.5)); neonStroke(REG, 2, 10);
    // laranjais do norte e a geada
    const fz = prog(lt, L.seg(1) + 0.6, 2.5);
    for (let i = 0; i < 26; i++) {
      const p = P([-82.9 + (i % 7) * 0.32 + (Math.floor(i / 7) % 2) * 0.16, 28.7 + Math.floor(i / 7) * 0.35]);
      if (lt < L.seg(1) - 1) continue;
      const a = eOut((lt - L.seg(1) + 1) / 1.2) * (1 - 0.7 * zp);
      ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 7);
      ctx.fillStyle = fz > hash(i) ? '#9fd8ff' : C.orange; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
    }
    if (lt > L.seg(1) && zp < 1) {
      for (let i = 0; i < 22; i++) {
        const x = P([-83.6 + hash(i) * 3.4, 30])[0], y0 = P([0, 30.6])[1], y1 = P([0, 28.2])[1];
        const y = y0 + ((lt * (20 + hash(i + 3) * 25) + hash(i + 9) * 400) % (y1 - y0));
        ctx.save(); ctx.globalAlpha = 0.6 * prog(lt, L.seg(1), 1) * (1 - zp); icon('snow', x, y, 0.8, lt + i, '#bfe6ff'); ctx.restore();
      }
      caption('GEADA NO NORTE', P([-85.6, 29.2])[0], P([-85.6, 29.2])[1], lt - L.seg(1) - 0.5, '#bfe6ff');
    }
    // Miami e Flagler
    const pm = P(CITY.miami), pf = P(CITY.staug);
    pin(pm[0], pm[1], lt < L.seg(3) ? 'MIAMI' : 'MIAMI · 1896', lt - 0.8, REG, 1, 24 + zp * 6);
    pin(pf[0], pf[1], 'HENRY FLAGLER', lt - L.seg(2) - 0.4, C.orange, 1);
    const fl = 0; // (flor de laranjeira saiu desta versão)
    if (fl > 0 && fl < 1) {
      const mid = [(pm[0] + pf[0]) / 2 + 220, (pm[1] + pf[1]) / 2], q = ease(fl);
      const x = (1 - q) * (1 - q) * pm[0] + 2 * (1 - q) * q * mid[0] + q * q * pf[0], y = (1 - q) * (1 - q) * pm[1] + 2 * (1 - q) * q * mid[1] + q * q * pf[1];
      ctx.save(); ctx.setLineDash([6, 10]); ctx.beginPath(); ctx.moveTo(pm[0], pm[1]); ctx.quadraticCurveTo(mid[0], mid[1], pf[0], pf[1]);
      ctx.strokeStyle = 'rgba(255,154,60,0.45)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      icon('flower', x, y, 1.3, lt, C.white);
    }
    // a ferrovia
    const rp = prog(lt, L.seg(2) + 0.8, 2.6); fx('swish', lt - L.seg(2) - 0.8);
    if (rp > 0) {
      polyPath(RAIL.map(P), rp); neonStroke(C.teal, 3.5, 18);
      const tp = pointAt(RAIL.map(P), rp); if (rp < 1) icon('train', tp[0], tp[1], 1, 0, C.white);
    }
    ctx.restore();
    if (zp < 1) {
      ctx.save(); ctx.globalAlpha = 1 - zp;
      timeline([{ y: '1894', label: 'GEADA', at: L.seg(1) + 0.5 }, { y: '1896', label: 'MIAMI VIRA CIDADE', at: L.seg(3) + 0.1 }], 850, lt, 1180, 1660);
      ctx.restore();
    }
    headline('UMA JOGADA DE NEGÓCIO', lt - L.seg(4) - 0.8, 160, C.white, 70);
  };

  GFX.growth = (L) => {
    const { lt, dur } = L; gfxBase(lt, 20);
    ctx.save(); drift(L);
    const hy = 760, g = prog(lt, 0.1, dur * 0.5);
    ctx.beginPath(); ctx.moveTo(80, hy); ctx.lineTo(W - 80, hy); neonStroke(C.teal, 2, 12);
    const B = [[180, 220], [330, 380], [470, 300], [610, 520], [760, 420], [900, 600], [1060, 340], [1200, 470], [1340, 260], [1480, 540], [1620, 360], [1740, 230]];
    const cols = [C.pink, C.orange, C.teal];
    B.forEach(([x, h], i) => {
      const p = eOut((g - i * 0.04) / 0.5); if (p <= 0) return;
      const hh = h * p, bw = 110;
      ctx.beginPath(); ctx.rect(x - bw / 2, hy - hh, bw, hh); neonStroke(cols[i % 3], 2.5, 14);
      ctx.save(); ctx.fillStyle = cols[i % 3]; ctx.globalAlpha = 0.5;
      for (let wy = hy - hh + 18; wy < hy - 14; wy += 30) for (let wx = -36; wx <= 24; wx += 30) if (hash(i * 100 + wy + wx) > 0.35) ctx.fillRect(x + wx, wy, 12, 10);
      ctx.restore();
    });
    ctx.restore();
    headline('QUEM ARRISCA, LEVA TUDO', lt - 0.6, 140, C.white, 64);
  };

  GFX.artdeco = (L) => {
    const { lt } = L; gfxBase(lt, 40);
    ctx.save(); drift(L);
    const hy = 760, cols = ['#FFB3C7', '#9FE7DD', '#FFD199', '#C9A0FF', '#FFB3C7', '#9FE7DD', '#FFD199'];
    for (let i = 0; i < 7; i++) {
      const x = 200 + i * 255, w = 200, h = 260 + (i % 3) * 60, p = eOut((lt - 0.2 - i * 0.18) / 0.8);
      if (p <= 0) continue;
      const pts = [[x - w / 2, hy], [x - w / 2, hy - h], [x - w / 4, hy - h], [x - w / 4, hy - h - 40], [x - 14, hy - h - 40], [x - 14, hy - h - 90], [x + 14, hy - h - 90],
        [x + 14, hy - h - 40], [x + w / 4, hy - h - 40], [x + w / 4, hy - h], [x + w / 2, hy - h], [x + w / 2, hy]];
      polyPath(pts, p); neonStroke(cols[i], 2.5, 14);
      if (p >= 1) { ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = cols[i]; ctx.lineWidth = 2; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + 20, hy - h + k * 50); ctx.lineTo(x + w / 2 - 20, hy - h + k * 50); ctx.stroke(); } ctx.restore(); }
      const sp = lt - L.seg(8) - 1.2 - i * 0.25; // protegido
      if (sp > 0) {
        ctx.save(); ctx.globalAlpha = eOut(sp / 0.4); ctx.beginPath(); ctx.arc(x, hy - h / 2, 30, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); neonStroke(C.blue, 3, 18);
        ctx.beginPath(); ctx.moveTo(x - 13, hy - h / 2); ctx.lineTo(x - 3, hy - h / 2 + 11); ctx.lineTo(x + 15, hy - h / 2 - 11); neonStroke(C.white, 3, 8); ctx.restore();
      }
    }
    ctx.restore();
    caption('OCEAN DRIVE · ART DÉCO', W / 2, 150, lt - 0.6, C.white, 'center', 32);
    caption('QUASE DEMOLIDA NOS ANOS 70', W / 2, 200, lt - 1.4, C.dim, 'center', 22);
    const u = lt - L.seg(8);
    if (u > 0) {
      ctx.save(); ctx.fillStyle = 'rgba(11,7,16,0.8)'; ctx.globalAlpha = eOut(u / 0.4); ctx.fillRect(0, 240, W, 170);
      counter(1979, u, 1.4, W / 2, 365, 120, REG, 'center'); ctx.restore();
      caption('PATRIMÔNIO HISTÓRICO', W / 2, 860, u - 1.2, C.blue, 'center', 24);
    }
  };

  GFX.timeline80 = (L) => {
    const { lt, sh } = L;
    blurDraw(sh.bgImg, 1920 + lt * 10, 1080, 3600 / (1 + 0.01 * lt));
    ctx.fillStyle = 'rgba(11,7,16,0.55)'; ctx.fillRect(0, 0, W, H); particles(lt, 77);
    ctx.save(); drift(L, 0.02);
    const items = sh.final
      ? [{ y: '1984', label: 'MIAMI VICE', at: -9 }, { y: '1986', label: 'ANO DO JOGO', at: -9 }, { y: '2002', label: 'GTA VICE CITY', at: -9 }, { y: '2026', label: 'GTA VI', at: 0.8 }]
      : [{ y: '1984', label: 'MIAMI VICE', at: 0.4 }, { y: '1986', label: 'ANO DO JOGO', at: L.seg(3) + 0.3 }, { y: '2002', label: 'GTA VICE CITY', at: L.seg(2) + 1.2 }, { y: '2026', label: 'GTA VI', at: 999 }];
    timeline(items, 520, lt);
    if (!sh.final) {
      caption('TERNO CLARO · CARRO ESPORTIVO · SINTETIZADOR', 260, 650, lt - 1.6, C.dim, 'left', 22);
      caption('MIAMI VICE + SCARFACE', 1193, 650, lt - L.seg(3) - 1.4, C.dim, 'center', 22);
    } else {
      const u = lt - 1.6, x0 = lerp(260, 1660, 1 / 3), x1 = 1660;
      if (u > 0) {
        ctx.beginPath(); ctx.moveTo(x0, 400); ctx.lineTo(x0, 380); ctx.lineTo(lerp(x0, x1, eOut(u / 0.8)), 380); if (u > 0.8) ctx.lineTo(x1, 400);
        neonStroke(C.orange, 2.5, 14);
        counter(40, u - 0.3, 1.5, (x0 + x1) / 2, 350, 56, C.orange, 'center', (v) => Math.round(v) + ' ANOS');
      }
    }
    ctx.restore();
  };

  GFX.cuba = (L) => {
    const { lt } = L; gfxBase(lt, 60);
    ctx.save(); drift(L, 0.03);
    const P = geo({ lon: -81.4, lat: 24.0, k: 175, cy: 450 });
    drawLand(FL, P, eOut(lt / 1.5)); drawLand(CUBA, P, eOut(lt / 1.5), C.orange);
    polyPath(KEYS.map(P), 1); neonStroke(REG, 2, 8);
    const ph = P(CITY.havana), pm = P(CITY.miami), pr = P(CITY.mariel), pk = P(CITY.keywest);
    pin(ph[0], ph[1], 'HAVANA', lt - 0.4, C.orange, 1); pin(pm[0], pm[1], 'MIAMI', lt - 0.6, REG, 1);
    const ap = prog(lt, 1.2, 1.8), mid = [(ph[0] + pm[0]) / 2 + 160, (ph[1] + pm[1]) / 2];
    const curve = []; for (let i = 0; i <= 40; i++) { const q = i / 40; curve.push([(1 - q) ** 2 * ph[0] + 2 * (1 - q) * q * mid[0] + q * q * pm[0], (1 - q) ** 2 * ph[1] + 2 * (1 - q) * q * mid[1] + q * q * pm[1]]); }
    if (ap > 0) { polyPath(curve, ap); neonStroke(REG, 4, 22); }
    const pl = prog(lt, 1.4, 2.6);
    if (pl > 0 && pl < 1) { const p = pointAt(curve, ease(pl)); icon('plane', p[0], p[1], 1.1, p[2], C.white); }
    caption('MENOS DE 1H DE AVIÃO', mid[0] + 40, mid[1], lt - 2.0, C.white, 'left', 22);
    // Mariel
    const m0 = 2.6;
    pin(pr[0], pr[1], 'MARIEL · 1980', lt - m0, C.orange, -1);
    if (lt > m0 + 0.6) {
      for (let i = 0; i < 26; i++) {
        const st = m0 + 0.6 + i * 0.45, q = (lt - st) / 7; if (q < 0 || q > 1) continue;
        const off = (hash(i) - 0.5) * 160, end = [lerp(pk[0], pm[0], hash(i + 4)), lerp(pk[1], pm[1], hash(i + 4)) + 20];
        const x = lerp(pr[0], end[0], q) + off * Math.sin(q * Math.PI), y = lerp(pr[1], end[1], q);
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 6, (1 - q) * 6); icon('boat', x, y, 0.6, 0, C.white); ctx.restore();
      }
    }
    ctx.restore();
    // contadores
    const u1 = lt - 0.2;
    ctx.save(); ctx.globalAlpha = eOut(u1 / 0.5) * (lt < m0 ? 1 : 0.45);
    counter(1959, u1, 1.4, 90, 210, 96); text('REVOLUÇÃO EM CUBA', 94, 256, font(MONO, 24), C.white, 'left', 'alphabetic', 2); ctx.restore();
    const u2 = lt - L.seg(3);
    if (u2 > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u2 / 0.5);
      counter(125000, u2, 3.2, 1830, 210, 96, C.orange, 'right', fmtInt);
      text('CUBANOS PELO MAR', 1826, 256, font(MONO, 24), C.white, 'right', 'alphabetic', 2); ctx.restore();
    }
  };

  GFX.connect = (L) => {
    const { lt } = L; gfxBase(lt, 90);
    ctx.save(); drift(L);
    const nodes = [{ x: 380, a: 'MARIEL · 1980', b: 'FATO REAL', at: 0.3, col: C.blue }, { x: 960, a: 'SCARFACE · 1983', b: 'TONY MONTANA (FICÇÃO)', at: 1.6, col: C.orange },
      { x: 1540, a: 'GTA VICE CITY · 2002', b: 'ROCKSTAR GAMES', at: 2.9, col: REG }];
    nodes.forEach((n, i) => {
      const u = lt - n.at; fx('pop', u - 0.4); if (u < 0) return;
      if (i > 0) { const pv = nodes[i - 1]; ctx.beginPath(); ctx.moveTo(pv.x + 110, 470); ctx.lineTo(lerp(pv.x + 110, n.x - 110, eOut(u / 0.6)), 470); neonStroke(REG, 3, 16); }
      const a = eOut((u - 0.4) / 0.5); if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.arc(n.x, 470, 100, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); neonStroke(n.col, 3, 24);
      text(n.a.split(' · ')[1], n.x, 486, font(MONO, 44), C.white, 'center');
      text(n.a.split(' · ')[0], n.x, 620, font(TITLE, 40), C.white, 'center');
      text(n.b, n.x, 662, font(MONO, 20), n.col, 'center', 'alphabetic', 2); ctx.restore();
    });
    ctx.restore();
    headline('TUDO SE CONECTA', lt - 4.4, 190, REG, 66);
  };

  GFX.fleeca = (L) => {
    const { lt } = L; gfxBase(lt, 110);
    ctx.save(); drift(L);
    const cx = W / 2, cy = 660;
    ctx.beginPath(); ctx.ellipse(cx, cy, 420 * eOut(lt / 1), 120, 0, 0, Math.PI * 2); neonStroke(C.teal, 3, 18);
    ctx.beginPath(); ctx.ellipse(cx, cy - 30, 300 * eOut((lt - 0.3) / 1), 70, 0, 0, Math.PI * 2); neonStroke(C.teal, 2, 10);
    for (let i = 0; i < 6; i++) { // torres de luz
      const a = eOut((lt - 0.6 - i * 0.1) / 0.5), x = cx - 380 + i * 152; if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, cy - 90); ctx.lineTo(x, cy - 260); neonStroke(C.white, 1.5, 6);
      ctx.beginPath(); ctx.arc(x, cy - 268, 10, 0, 7); ctx.fillStyle = C.white; ctx.shadowColor = C.white; ctx.shadowBlur = 30 + 10 * Math.sin(lt * 4 + i); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    const u = lt - 0.3;
    if (u > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u / 0.6); ctx.font = font(TITLE, 110);
      const w1 = ctx.measureText('FLEECA ').width, w2 = ctx.measureText('FIELD').width, x0 = W / 2 - (w1 + w2) / 2;
      glowText('FLEECA ', x0, 210, font(TITLE, 110), REG, 28); text('FIELD', x0 + w1, 210, font(TITLE, 110), C.white); ctx.restore();
    }
    caption('FLEECA = BANCO FICTÍCIO DE GTA V', W / 2, 290, lt - 2.4, C.amber, 'center', 28);
    caption('ESTÁDIO AMERICANO = NOME DE EMPRESA', W / 2, 860, lt - L.seg(7) - 0.2, C.white, 'center', 26);
  };

  GFX.boom = (L) => {
    const { lt } = L; gfxBase(lt, 130);
    const hz = L.seg(1) + 2.4, z0 = L.seg(2), zp = ease((lt - z0) / 3.2);
    const palm = [1150, 430];
    const k = lerp(1, 2.6, zp), fcx = lerp(W / 2, palm[0], zp), fy = lerp(SAFE_B / 2, palm[1], zp);
    ctx.save();
    ctx.translate(W / 2, SAFE_B / 2); ctx.scale(k * (1 + 0.02 * lt / L.dur), k * (1 + 0.02 * lt / L.dur)); ctx.translate(-fcx, -fy);
    // costa do continente, baía, ilha-barreira
    const coast = [[880, 0], [900, 200], [870, 420], [905, 640], [880, 940]];
    polyPath(coast, eOut(lt / 1.6)); neonStroke(C.teal, 3, 16);
    ctx.beginPath(); ctx.moveTo(1460, 0); ctx.bezierCurveTo(1500, 300, 1470, 600, 1520, 940); ctx.lineTo(1610, 940); ctx.bezierCurveTo(1560, 600, 1590, 300, 1550, 0);
    neonStroke(C.teal, 3, 16);
    // ilhas da baía
    for (const [x, y, rx] of [[1150, 430, 46], [1060, 300, 30], [1250, 300, 30], [1150, 620, 60]]) { ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.45, -0.2, 0, 7); neonStroke(C.teal, 2, 10); }
    // lotes
    const crash = prog(lt, hz + 1.2, 2.5);
    for (let gx = 0; gx < 13; gx++) for (let gy = 0; gy < 13; gy++) {
      const x = 120 + gx * 56, y = 80 + gy * 60, id = gx * 31 + gy;
      const app = eOut((lt - 0.5 - hash(id) * 2) / 0.5); if (app <= 0) continue;
      const blink = 0.5 + 0.5 * Math.sin(lt * (2 + hash(id + 1) * 4) + id);
      const sold = hash(id + 2) < prog(lt, 0.8, hz - 0.8);
      ctx.save(); ctx.globalAlpha = app * (1 - crash * 0.75);
      ctx.strokeStyle = crash > hash(id + 5) ? '#ff3b3b' : sold ? C.amber : 'rgba(246,238,247,0.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 46, 50);
      if (sold && crash < hash(id + 5)) { ctx.fillStyle = `rgba(255,176,32,${0.1 + 0.25 * blink})`; ctx.fillRect(x, y, 46, 50); }
      if (sold && hash(id + 7) > 0.8 && crash === 0) text('$↑', x + 23, y + 33, font(MONO, 18), C.amber, 'center');
      ctx.restore();
    }
    // Palm Island + mansão
    const pu = lt - z0 - 2.4;
    if (pu > 0) { ctx.save(); ctx.globalAlpha = eOut(pu / 0.5); icon('mansion', palm[0], palm[1] - 6, 0.38, 0, C.white); ctx.restore(); }
    ctx.restore();
    // furacão
    const hu = lt - hz; fx('boom', hu);
    if (hu > 0 && hu < 5.2) {
      const x = lerp(2100, 1100, eOut(hu / 3)), y = lerp(260, 420, eOut(hu / 3));
      ctx.save(); ctx.globalAlpha = hu > 4 ? 1 - (hu - 4) / 1.2 : 1; icon('hurricane', x, y, 2.6, hu * 3, C.white); ctx.restore();
      ctx.save(); ctx.globalAlpha = (hu > 4 ? 1 - (hu - 4) / 1.2 : 1) * eOut(hu / 0.5);
      ctx.fillStyle = 'rgba(11,7,16,0.7)'; ctx.fillRect(1290, 640, 520, 170);
      counter(1926, hu, 1.3, 1550, 750, 100, REG, 'center'); ctx.restore();
      caption('A BOLHA ESTOURA', 1550, 795, hu - 1.5, C.white);
    }
    if (lt < z0) {
      caption('FEBRE DOS TERRENOS · ANOS 20', 1180, 160, lt - L.seg(1), C.amber, 'center', 26);
      caption('COMPRA DE MANHÃ → VENDE À TARDE', 1180, 210, lt - L.seg(1) - 0.8, C.white, 'center', 22);
    }
    // Palm Island / Capone
    if (pu > 0) {
      const sp = [W / 2, SAFE_B / 2];
      ctx.beginPath(); ctx.arc(sp[0], sp[1] + 6, 150, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * eOut(pu / 0.8)); neonStroke(REG, 4, 24);
      tagBox('PALM ISLAND', sp[0] + 180, sp[1] - 30, eOut((pu - 0.4) / 0.5));
      caption('AL CAPONE', sp[0] - 180, sp[1] - 4, lt - L.seg(2) - 0.6, C.white, 'right', 34);
      caption('O GÂNGSTER MAIS CONHECIDO DOS EUA', sp[0] - 180, sp[1] + 38, lt - L.seg(2) - 1.0, C.dim, 'right', 18);
      timeline([{ y: '1928', label: 'COMPRA A MANSÃO', at: L.seg(3) + 0.4 }, { y: '1947', label: 'MORRE NA ILHA', at: L.seg(4) + 0.6 }], 820, lt, 700, 1220);
    }
  };

  GFX.walls = (L) => {
    const { lt } = L; gfxBase(lt, 150);
    ctx.save(); drift(L);
    const hy = 770, paint = prog(lt, L.seg(2) + 1.4, 3); fx('swish', lt - L.seg(2) - 1.4);
    const pal = [C.pink, C.orange, C.teal, '#C9A0FF', C.amber, C.green, C.blue];
    for (let i = 0; i < 5; i++) {
      const x = 130 + i * 340, w = 300, h = 300 + (i % 2) * 40, p = eOut((lt - 0.2 - i * 0.15) / 0.8);
      if (p <= 0) continue;
      const roof = [[x, hy - h], [x + 75, hy - h - 50], [x + 75, hy - h], [x + 150, hy - h - 50], [x + 150, hy - h], [x + 225, hy - h - 50], [x + 225, hy - h], [x + 300, hy - h - 50], [x + 300, hy - h]];
      polyPath([[x, hy], ...roof, [x + w, hy]], p); neonStroke('rgba(246,238,247,0.7)', 2, 6);
      const pp = clamp((paint - i * 0.14) / 0.4);
      if (pp > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(x + 2, hy - h + 2, (w - 4) * pp, h - 4); ctx.clip();
        ctx.fillStyle = pal[i % 7]; ctx.globalAlpha = 0.85; ctx.fillRect(x, hy - h, w, h);
        for (let k = 0; k < 9; k++) {
          ctx.fillStyle = pal[(i + k + 1) % 7]; ctx.beginPath();
          const bx = x + hash(i * 20 + k) * w, by = hy - h + hash(i * 20 + k + 5) * h, r = 20 + hash(i * 20 + k + 9) * 60;
          if (k % 3 === 0) ctx.arc(bx, by, r, 0, 7); else if (k % 3 === 1) ctx.rect(bx - r, by - 10, r * 2, 20);
          else { ctx.moveTo(bx - r, by); for (let z = 0; z < 6; z++) ctx.lineTo(bx - r + z * r / 2.5, by + (z % 2 ? -18 : 18)); ctx.lineWidth = 8; ctx.strokeStyle = ctx.fillStyle; ctx.stroke(); continue; }
          ctx.fill();
        }
        ctx.restore();
      } else if (lt > 1.4) {
        caption('PAREDE LISA', x + w / 2, hy - h / 2 + 10, lt - 1.4 - i * 0.2, C.dim, 'center', 20);
      }
    }
    ctx.restore();
    caption('GALPÕES · FÁBRICAS DE ROUPA', W / 2, 170, lt - 0.4, C.white, 'center', 28);
    const u = lt - L.seg(2);
    if (u > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u / 0.5); ctx.fillStyle = 'rgba(11,7,16,0.85)'; ctx.fillRect(0, 120, W, 160);
      counter(2009, u, 1.3, 120, 240, 100); text('ARTISTAS DO MUNDO INTEIRO', 470, 225, font(MONO, 26), C.white, 'left', 'alphabetic', 2); ctx.restore();
    }
    headline('WYNWOOD WALLS', lt - L.seg(3), 880 - 60, REG, 70);
  };

  GFX.river = (L) => {
    const { lt } = L; gfxBase(lt, 170);
    ctx.save(); drift(L);
    const pathA = [], pathB = [], mid = [];
    for (let i = 0; i <= 60; i++) {
      const x = -100 + i * 36, y = 470 + Math.sin(i / 9) * 110 + i * 1.5;
      mid.push([x, y]); pathA.push([x, y - 70]); pathB.push([x, y + 70]);
    }
    polyPath(pathA, eOut(lt / 1.4)); neonStroke(C.teal, 3, 16); polyPath(pathB, eOut(lt / 1.4)); neonStroke(C.teal, 3, 16);
    // quarteirões nas margens
    ctx.save(); ctx.strokeStyle = 'rgba(246,238,247,0.14)'; ctx.lineWidth = 2;
    mid.forEach((m, i) => { if (i % 3) return; ctx.strokeRect(m[0] - 30, m[1] - 210 - (i % 2) * 20, 60, 90); ctx.strokeRect(m[0] - 30, m[1] + 110, 60, 80); });
    ctx.restore();
    const cargo = ['bike', 'mattress', 'fridge', 'car'];
    for (let b = 0; b < 4; b++) {
      const q = ((lt * 0.045 + b * 0.25) % 1); const p = pointAt(mid, q);
      ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(p[2]); ctx.globalAlpha = Math.min(1, q * 8, (1 - q) * 8);
      ctx.beginPath(); ctx.moveTo(-90, -6); ctx.lineTo(90, -6); ctx.lineTo(70, 22); ctx.lineTo(-80, 22); ctx.closePath(); ctx.fillStyle = C.bg; ctx.fill(); neonStroke(C.white, 2, 8);
      ctx.beginPath(); ctx.rect(50, -40, 26, 34); neonStroke(C.white, 2, 6);
      for (let k = 0; k < 3; k++) { // carga empilhada
        const kind = cargo[(b + k) % 4], x = -70 + k * 38, col = [C.orange, REG, C.teal][k];
        ctx.beginPath();
        if (kind === 'bike') { ctx.arc(x + 4, -16, 9, 0, 7); ctx.moveTo(x + 35, -16); ctx.arc(x + 26, -16, 9, 0, 7); ctx.moveTo(x + 4, -16); ctx.lineTo(x + 15, -30); ctx.lineTo(x + 26, -16); }
        else if (kind === 'mattress') { roundRect(x, -30, 34, 22, 6); }
        else if (kind === 'fridge') { ctx.rect(x + 6, -44, 22, 38); ctx.moveTo(x + 6, -30); ctx.lineTo(x + 28, -30); }
        else { ctx.moveTo(x, -8); ctx.lineTo(x, -20); ctx.lineTo(x + 8, -20); ctx.lineTo(x + 13, -30); ctx.lineTo(x + 26, -30); ctx.lineTo(x + 32, -20); ctx.lineTo(x + 34, -8); ctx.closePath(); }
        neonStroke(col, 2, 8);
      }
      ctx.restore();
    }
    ctx.restore();
    // destino
    const da = eOut((lt - 0.8) / 0.6);
    ctx.save(); ctx.globalAlpha = da; ctx.beginPath(); ctx.moveTo(1640, 760); ctx.lineTo(1840, 760); ctx.moveTo(1814, 740); ctx.lineTo(1840, 760); ctx.lineTo(1814, 780); neonStroke(C.orange, 3, 16);
    text('HAITI · CARIBE', 1840, 820, font(MONO, 26), C.orange, 'right', 'alphabetic', 2); ctx.restore();
    caption('RIO MIAMI', 120, 170, lt - 0.3, C.teal, 'left', 28);
    const items = ['BICICLETA', 'COLCHÃO', 'GELADEIRA', 'CARRO USADO'];
    const u = lt - L.seg(2);
    if (u > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u / 0.4); ctx.fillStyle = 'rgba(11,7,16,0.8)'; ctx.fillRect(0, 130, W, 70); ctx.restore();
      ctx.font = font(MONO, 26); let x = W / 2 - (items.map((s) => ctx.measureText(s).width + 70).reduce((a, b) => a + b) - 70) / 2;
      items.forEach((s, i) => { caption(s, x, 176, u - i * 0.45, [C.orange, REG, C.teal, C.amber][i], 'left', 26); x += ctx.measureText(s).width + 70; });
    }
    headline('CENÁRIO PERFEITO PRA CONTRABANDO', lt - L.seg(3) - 0.2, 920 - 90, C.white, 48);
  };

  GFX.stadium = (L) => {
    const { lt } = L; gfxBase(lt, 190);
    ctx.save(); drift(L);
    const cx = W / 2, cy = 600, d0 = 2.8, dp = prog(lt, d0, 1.6), np = prog(lt, d0 + 1.6, 2.2);
    // Orange Bowl: arquibancada aberta
    if (dp < 1) {
      for (let i = 0; i < 14; i++) {
        const fall = clamp(dp * 1.6 - hash(i) * 0.6), x = cx - 390 + i * 60;
        ctx.save(); ctx.globalAlpha = (1 - fall) * eOut(lt / 1); ctx.translate(0, fall * 160);
        ctx.beginPath(); ctx.moveTo(x, cy - 40 - Math.sin(i / 13 * Math.PI) * 140); ctx.lineTo(x + 52, cy - 40 - Math.sin((i + 1) / 13 * Math.PI) * 140);
        ctx.lineTo(x + 52, cy); ctx.lineTo(x, cy); ctx.closePath(); neonStroke(C.orange, 2, 10); ctx.restore();
      }
      caption('ORANGE BOWL', cx, cy + 70, lt - 0.4 - (dp > 0 ? 99 : 0), C.orange, 'center', 34);
    }
    // novo estádio
    if (np > 0) {
      ctx.beginPath(); ctx.ellipse(cx, cy, 380, 110 * eOut(np), 0, Math.PI, 0); ctx.lineTo(cx + 380, cy); ctx.lineTo(cx - 380, cy); neonStroke(C.teal, 3, 20);
      ctx.beginPath(); ctx.ellipse(cx, cy - 20 * eOut(np), 300, 160 * eOut(np), 0, Math.PI, 0); neonStroke(C.teal, 2, 12);
      caption('ESTÁDIO DOS MARLINS', cx, cy + 70, lt - d0 - 2.2, C.teal, 'center', 34);
    }
    ctx.beginPath(); ctx.moveTo(cx - 520, cy); ctx.lineTo(cx + 520, cy); neonStroke('rgba(246,238,247,0.5)', 1.5, 4);
    ctx.restore();
    caption('ESTÁDIO LENDÁRIO DE FUTEBOL AMERICANO', W / 2, 170, lt - 0.6, C.white, 'center', 26);
    const u = lt - 2.2; fx('boom', lt - d0); fx('hit', lt - d0 - 1.6);
    if (u > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u / 0.5);
      counter(2008, u, 1.3, W / 2, 300, 100, REG, 'center');
      text('DEMOLIDO', W / 2, 345, font(MONO, 24), C.white, 'center', 'alphabetic', 4); ctx.restore();
    }
  };

  // ---------- shots especiais ----------
  function openingShot(L) {
    const { lt, sh } = L;
    const cx = lerp(sh.a.x, sh.b.x, lt / 10), w = sh.a.w * 0.555 / kb(lt);
    camDraw(sh.img, cx, lerp(sh.a.y, sh.b.y, lt / 10), w);
    ctx.fillStyle = 'rgba(11,7,16,0.3)'; ctx.fillRect(0, 0, W, H); particles(lt, 5);
    const out = 1 - prog(lt, L.dur - 0.9, 0.8); fx('hit', lt - 0.5); fx('pop', lt - 1.7);
    ctx.save(); ctx.globalAlpha = out;
    const T = 'VICE CITY'; ctx.font = font(TITLE, 210); let x = W / 2 - ctx.measureText(T).width / 2;
    ctx.fillStyle = 'rgba(11,7,16,0.62)'; ctx.fillRect(0, 300, W, 330);
    for (let i = 0; i < T.length; i++) {
      const a = eOut((lt - 0.5 - i * 0.08) / 0.5); ctx.font = font(TITLE, 210); const cw = ctx.measureText(T[i]).width;
      ctx.save(); ctx.globalAlpha *= a; glowText(T[i], x, 500 + 30 * (1 - a), font(TITLE, 210), REG, 34); ctx.restore(); x += cw;
    }
    const sa = eOut((lt - 1.7) / 0.6);
    ctx.globalAlpha = out * sa; text('A HISTÓRIA REAL', W / 2, 580, font(MONO, 44), C.white, 'center', 'alphabetic', 14);
    ctx.globalAlpha = out * eOut((lt - 2.4) / 0.6);
    ctx.beginPath(); ctx.moveTo(W / 2 - 240 * sa, 610); ctx.lineTo(W / 2 + 240 * sa, 610); neonStroke(REG, 2, 10);
    ctx.restore();
  }
  function endingShot(L) {
    const { lt, sh, dur } = L;
    const p = lt / dur;
    camDraw(sh.img, lerp(sh.a.x, sh.b.x, p), lerp(sh.a.y, sh.b.y, p), 1800 / kb(lt));
    ctx.fillStyle = `rgba(11,7,16,${lerp(0.25, 0.68, eOut(lt / 2))})`; ctx.fillRect(0, 0, W, H);
    particles(lt, 13);
    const u = lt - 2.5; fx('hit', u);
    if (u > 0) {
      ctx.save(); ctx.globalAlpha = eOut(u / 0.6);
      text('PRÓXIMA REGIÃO:', 110, 410, font(MONO, 34), C.white, 'left', 'alphabetic', 6);
      glowText('LEONIDA', 104, 540, font(TITLE, 130), TL.REGION.nextColor, 30);
      glowText('KEYS', 104, 670, font(TITLE, 130), TL.REGION.nextColor, 30);
      ctx.beginPath(); ctx.moveTo(110, 712); ctx.lineTo(110 + 560 * eOut((u - 0.3) / 0.8), 712); neonStroke(TL.REGION.nextColor, 2.5, 14);
      text('A HISTÓRIA REAL DE LEONIDA', 110, 760, font(MONO, 22), C.dim, 'left', 'alphabetic', 4);
      ctx.restore();
    }
  }

  function drawShot(sh, t) {
    const L = mkL(sh, t); SHOT = sh; T_NOW = t;
    ctx.save();
    if (sh.type === 'image') imageShot(L);
    else if (sh.type === 'map') mapShot(L);
    else if (sh.type === 'cards') cardsShot(L);
    else if (sh.type === 'gfx') GFX[sh.gfx](L);
    else if (sh.type === 'opening') openingShot(L);
    else if (sh.type === 'ending') endingShot(L);
    ctx.restore();
  }

  // ---------- camadas fixas ----------
  function chapterCard(c, t) {
    const u = t - c.start; if (c.n === 0 || c.n === 10) return;
    SHOT = null; T_NOW = t; fx('card', u);
    if (u < 0 || u > 1.2) return;
    const x = u < 0.25 ? -W * (1 - eOut(u / 0.25)) : u > 0.95 ? W * ease((u - 0.95) / 0.25) : 0;
    ctx.save(); ctx.translate(x, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.94)'; ctx.fillRect(0, 400, W, 170);
    ctx.fillStyle = REG; ctx.shadowColor = REG; ctx.shadowBlur = 20; ctx.fillRect(0, 400, 14, 170); ctx.shadowBlur = 0;
    glowText('CAP ' + String(c.n).padStart(2, '0'), 110, 495, font(MONO, 40), REG, 16);
    const s = fitFont(c.title, TITLE, 64, W - 520); text(c.title, 360, 507, font(TITLE, s), C.white);
    ctx.restore();
  }
  function seal(label, color, y, alpha) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.font = font(MONO, 20);
    const tw = ctx.measureText(label).width + label.length * 2, w = tw + 62, x = W - 48 - w;
    roundRect(x, y, w, 44, 22); ctx.fillStyle = 'rgba(11,7,16,0.82)'; ctx.fill(); neonStroke(color, 2, 12);
    ctx.beginPath(); ctx.arc(x + 24, y + 22, 6, 0, 7); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
    text(label, x + 40, y + 29, font(MONO, 20), color, 'left', 'alphabetic', 2); ctx.restore();
  }
  function miniMap(t) {
    const tEnd = TL.chapters[TL.chapters.length - 1].start;
    const t0 = TL.chapters[0].shots[1].start;
    if (t < t0 || t >= tEnd) return;
    const a = Math.min(prog(t, t0, 0.6), 1 - prog(t, tEnd - 0.6, 0.6));
    const x = 40, y = SAFE_B - 24 - 183, w = 130, h = 183;
    ctx.save(); ctx.globalAlpha = a;
    roundRect(x - 6, y - 6, w + 12, h + 12, 8); ctx.fillStyle = 'rgba(11,7,16,0.85)'; ctx.fill(); neonStroke('rgba(246,238,247,0.35)', 1, 2);
    ctx.drawImage(MINI, x, y, w, h);
    const vx = x + 984 / 1290 * w, vy = y + (1020 - 140) / 1820 * h;
    ctx.beginPath(); ctx.arc(vx, vy, 16, 0, 7); neonStroke(REG, 2.5, 14);
    const pu = (t * 0.6) % 1; ctx.globalAlpha = a * (1 - pu); ctx.beginPath(); ctx.arc(vx, vy, 16 + pu * 18, 0, 7); ctx.strokeStyle = REG; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = a; text('VICE CITY', x + w + 16, y + h - 6, font(MONO, 15), REG, 'left', 'alphabetic', 2);
    ctx.restore();
  }
  function wrap(txt, maxW, f) {
    ctx.font = f; const words = txt.split(' '), lines = []; let cur = '';
    for (const w of words) { const t2 = cur ? cur + ' ' + w : w; if (ctx.measureText(t2).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t2; }
    lines.push(cur);
    if (lines.length > 2) { // equilibra em 2 linhas
      const mid = Math.ceil(words.length / 2); return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }
    return lines;
  }
  function subtitleBand(c, t) {
    ctx.fillStyle = 'rgba(11,7,16,0.9)'; ctx.fillRect(0, SAFE_B, W, BAND);
    ctx.fillStyle = 'rgba(255,79,139,0.35)'; ctx.fillRect(0, SAFE_B, W, 1.5);
    text('CONTEÚDO DE FÃ', 40, H - 18, '500 15px JBMono', 'rgba(246,238,247,0.45)', 'left', 'alphabetic', 2);
    const i = c.segT.findIndex((s) => t >= s.start && t < s.end); if (i < 0) return;
    const s = c.segT[i], a = Math.min(prog(t, s.start, 0.12), 1 - prog(t, s.end - 0.12, 0.12));
    const end = c.n === 10, f = font(SUB, 38), lines = wrap(c.segs[i], end ? 820 : 1300, f);
    ctx.save(); ctx.globalAlpha = a; ctx.font = f; ctx.textAlign = end ? 'left' : 'center'; ctx.fillStyle = C.white;
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6;
    const x = end ? 110 : W / 2, y0 = lines.length === 1 ? SAFE_B + 84 : SAFE_B + 56;
    lines.forEach((ln, k) => ctx.fillText(ln, x, y0 + k * 46));
    ctx.restore();
  }

  function locate(t) {
    const chs = TL.chapters; let c = chs[chs.length - 1];
    for (const ch of chs) if (t >= ch.start && t < ch.end) { c = ch; break; }
    let i = c.shots.findIndex((s) => t >= s.start && t < s.end); if (i < 0) i = c.shots.length - 1;
    const sh = c.shots[i];
    let prev = i > 0 ? c.shots[i - 1] : null;
    if (!prev && c.n > 0) { const pc = chs[c.n - 1]; prev = pc.shots[pc.shots.length - 1]; }
    return { c, sh, prev };
  }

  const XF = 0.5;
  function renderFrame(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const { c, sh, prev } = locate(t);
    const lt = t - sh.start;
    SHOT = null; T_NOW = t;
    if (prev && (sh.start !== c.start || c.n === 10)) fx('whoosh', lt + 0.15);
    if (prev && lt < XF) {
      drawShot(prev, t);
      ctx.save(); ctx.globalAlpha = ease(lt / XF);
      // desenha o novo shot numa camada para o fade cruzado
      if (!renderFrame.buf) { renderFrame.buf = document.createElement('canvas'); renderFrame.buf.width = W; renderFrame.buf.height = H; }
      const real = ctx; const b = renderFrame.buf.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
      swapCtx(b); drawShot(sh, t); swapCtx(real);
      ctx.drawImage(renderFrame.buf, 0, 0); ctx.restore();
    } else drawShot(sh, t);

    // selos
    const sealOf = (s) => s && (s.seal || null);
    const sa = prev && lt < XF ? ease(lt / XF) : 1;
    if (prev && lt < XF && sealOf(prev) && sealOf(prev) !== sealOf(sh)) seal(prev.seal, SEALS[prev.seal], 40, 1 - sa);
    if (sealOf(sh)) seal(sh.seal, SEALS[sh.seal], 40, sealOf(prev) === sealOf(sh) ? 1 : sa);
    const fanA = sh.fan ? (prev && prev.fan ? 1 : sa) : prev && prev.fan && lt < XF ? 1 - sa : 0;
    seal('MAPA DE FÃS · NÃO OFICIAL', C.white, 94, fanA);

    // crédito
    const credit = (s) => (s.type === 'map' || (s.type === 'cards' && s.bg.img === 'MAP') ? 'MAPA: YANIS COMMUNITY MAP / GTADB.ORG'
      : ['image', 'opening', 'ending'].includes(s.type) || s.type === 'cards' || (s.gfx === 'timeline80') ? 'IMAGEM: ROCKSTAR GAMES' : '');
    const cr = credit(sh);
    if (cr) text(cr, W - 40, H - 18, '500 15px JBMono', 'rgba(246,238,247,0.72)', 'right', 'alphabetic', 1);

    miniMap(t);
    chapterCard(c, t);
    subtitleBand(c, t);
  }
  function swapCtx(n) { ctx = n; }

  window.renderFrame = renderFrame;
  window.collectFx = (fps = 10) => {
    FXLOG.clear();
    for (let f = 0; f < TL.duration * fps; f++) renderFrame(f / fps);
    return [...FXLOG.values()].filter((e) => e.at >= 0 && e.at < TL.duration).sort((a, b) => a.at - b.at);
  };
  window.ready = init();
})();
