/* ================= 02 貼圖：全部用 Canvas 程式產生 ================= */
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function mkTex(c, o) {
  o = o || {};
  const t = new THREE.CanvasTexture(c);
  if (o.srgb !== false) t.encoding = THREE.sRGBEncoding;
  if (o.rep !== false) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = MAXANISO;
  if (o.mip === false) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; }
  return t;
}
function speckle(g, w, h, n, cols, s0, s1, a) {
  for (let i = 0; i < n; i++) { g.globalAlpha = a * (0.35 + rnd() * 0.65); g.fillStyle = pick(cols); const s = rr(s0, s1); g.fillRect(rnd() * w, rnd() * h, s, s); }
  g.globalAlpha = 1;
}
function hsl(h, s, l, a) { return a == null ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`; }
function blot(g, x, y, r, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.globalAlpha = 1;
}
const TEX = {};
const FONT_KAI = '"LXGW WenKai TC","DFKai-SB","BiauKai","Kaiti TC","STKaiti",serif';
const FONT_SERIF = '"Noto Serif TC","Songti TC","PMingLiU",serif';
const FONT_SANS = '"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",sans-serif';

function buildTextures() {
  reseed(77);
  /* 閩南紅磚（1 公尺一格） */
  TEX.brick = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#d6c4ab'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 16; r++) {
      const off = (r % 2) * 32;
      for (let i = -1; i < 5; i++) {
        const x = i * 64 + off;
        g.fillStyle = hsl(rr(7, 15), rr(48, 60), rr(36, 45)); g.fillRect(x + 1, r * 16 + 1, 62, 14);
        g.fillStyle = 'rgba(255,215,190,.13)'; g.fillRect(x + 1, r * 16 + 1, 62, 3);
        g.fillStyle = 'rgba(60,20,10,.16)'; g.fillRect(x + 1, r * 16 + 12, 62, 3);
      }
    }
    speckle(g, 256, 256, 1500, ['#5a2418', '#eab59b', '#7a3a28'], 1, 2, 0.3);
    return mkTex(c);
  })();
  /* 荷蘭時期老磚牆：暗、斑駁、帶青苔 */
  TEX.oldbrick = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#bfae98'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 20; r++) {
      const off = rr(0, 40), rh = 12.8;
      for (let i = -1; i < 6; i++) {
        const w = rr(36, 58), x = i * 48 + off;
        g.fillStyle = hsl(rr(4, 16), rr(38, 52), rr(26, 38)); g.fillRect(x + 1.5, r * rh + 1.5, w - 3, rh - 3);
      }
    }
    for (let i = 0; i < 9; i++) blot(g, rnd() * 256, rnd() * 256, rr(20, 60), pick(['#3d4a2a', '#2e2a26', '#4f5a36', '#6a3a2a']), rr(0.2, 0.4));
    speckle(g, 256, 256, 2000, ['#2a1a14', '#c9b79e', '#556b3a'], 1, 2.5, 0.3);
    return mkTex(c);
  })();
  /* 白灰泥（灰階，給頂點色上色） */
  TEX.plaster = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#f1eee8'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 6; i++) blot(g, rnd() * 256, rnd() * 256, rr(40, 90), '#d4cdc2', 0.12);
    for (let i = 0; i < 6; i++) { const x = rnd() * 256; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(120,110,100,0)'); gr.addColorStop(1, 'rgba(120,110,100,.06)'); g.fillStyle = gr; g.fillRect(x, 0, rr(4, 14), 256); }
    speckle(g, 256, 256, 1200, ['#e4dfd6', '#ffffff', '#cfc8bd'], 1, 2, 0.25);
    return mkTex(c);
  })();
  /* 洗石子 */
  TEX.wash = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#d9d5cc'; g.fillRect(0, 0, 256, 256);
    speckle(g, 256, 256, 7000, ['#a39d93', '#f6f3ee', '#b3a693', '#7e7870', '#d7c9b0'], 1, 2, 0.45);
    for (let i = 0; i < 4; i++) blot(g, rnd() * 256, rnd() * 256, rr(40, 90), '#a8a196', 0.08);
    return mkTex(c);
  })();
  /* 二丁掛磁磚 */
  TEX.tile = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#b8b2aa'; g.fillRect(0, 0, 256, 256);
    for (let r = 0; r < 16; r++) {
      const off = (r % 2) * 29;
      for (let i = -1; i < 5; i++) { const x = i * 58 + off; g.fillStyle = hsl(30, 8, rr(84, 92)); g.fillRect(x + 1.5, r * 16 + 1.5, 55, 13); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 2, r * 16 + 2, 53, 2); }
    }
    return mkTex(c);
  })();
  /* 閩南紅瓦（u 沿屋脊、v 沿坡） */
  TEX.roof = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#9a4a33'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) {
      const x = i * 32;
      const gr = g.createLinearGradient(x, 0, x + 32, 0);
      gr.addColorStop(0, '#7e3826'); gr.addColorStop(.25, '#b95c3e'); gr.addColorStop(.5, '#cf7050'); gr.addColorStop(.75, '#b0553a'); gr.addColorStop(1, '#7a3422');
      g.fillStyle = gr; g.fillRect(x, 0, 32, 256);
    }
    for (let j = 0; j < 12; j++) { g.fillStyle = 'rgba(40,12,6,.28)'; g.fillRect(0, j * 21.33, 256, 3); g.fillStyle = 'rgba(255,200,170,.12)'; g.fillRect(0, j * 21.33 + 3, 256, 2); }
    speckle(g, 256, 256, 1200, ['#4a2016', '#e7a383', '#6a6a58'], 1, 2, 0.3);
    return mkTex(c);
  })();
  /* 木板 */
  TEX.wood = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    for (let i = 0; i < 8; i++) {
      g.fillStyle = hsl(rr(22, 30), rr(30, 42), rr(40, 52)); g.fillRect(i * 32, 0, 32, 256);
      g.strokeStyle = 'rgba(50,25,10,.25)'; g.lineWidth = 1;
      for (let k = 0; k < 6; k++) { g.beginPath(); const x = i * 32 + rr(3, 29); g.moveTo(x, 0); g.bezierCurveTo(x + rr(-4, 4), 80, x + rr(-4, 4), 170, x + rr(-3, 3), 256); g.stroke(); }
      g.fillStyle = 'rgba(30,15,5,.45)'; g.fillRect(i * 32, 0, 2, 256);
    }
    return mkTex(c);
  })();
  /* 石板鋪面 */
  TEX.slab = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#6f675e'; g.fillRect(0, 0, 256, 256);
    let y = 0;
    while (y < 256) {
      const h = [48, 64, 64, 80][ri(0, 3)]; const hh = Math.min(h, 256 - y); let x = rr(-30, 0);
      while (x < 256) { const w = rr(60, 110); g.fillStyle = hsl(rr(28, 38), rr(8, 16), rr(62, 72)); g.fillRect(x + 2, y + 2, w - 4, hh - 4); x += w; }
      y += h;
    }
    speckle(g, 256, 256, 2500, ['#5a534b', '#e7e0d4'], 1, 2, 0.3);
    return mkTex(c);
  })();
  /* 紅磚鋪面（人字形） */
  TEX.brickpave = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#c9b8a2'; g.fillRect(0, 0, 256, 256);
    const u = 16;
    for (let i = -4; i < 20; i++) for (let j = -4; j < 20; j++) {
      const x = i * u * 2 + j * u, y = j * u - i * u * 0; // herringbone approximation
      g.fillStyle = hsl(rr(6, 16), rr(40, 55), rr(40, 50));
      if ((i + j) % 2 === 0) g.fillRect((x % 256 + 256) % 256 + 1, (y % 256 + 256) % 256 + 1, u * 2 - 2, u - 2);
      else g.fillRect((x % 256 + 256) % 256 + 1, (y % 256 + 256) % 256 + 1, u - 2, u * 2 - 2);
    }
    speckle(g, 256, 256, 1500, ['#5a2a1c', '#eec5a8'], 1, 2, 0.25);
    return mkTex(c);
  })();
  /* 柏油 */
  TEX.asphalt = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#5b5c5f'; g.fillRect(0, 0, 256, 256);
    speckle(g, 256, 256, 9000, ['#44464a', '#76777a', '#8a8580', '#3a3b3e'], 1, 2, 0.5);
    for (let i = 0; i < 8; i++) blot(g, rnd() * 256, rnd() * 256, rr(30, 80), '#3c3d40', 0.2);
    return mkTex(c);
  })();
  /* 人行道方磚 */
  TEX.sidewalk = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#8f8781'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = ((i + j) % 2) ? hsl(20, 12, rr(70, 75)) : hsl(12, 18, rr(62, 67)); g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30); }
    speckle(g, 256, 256, 2000, ['#6a625c', '#e6ded6'], 1, 2, 0.3);
    return mkTex(c);
  })();
  /* 導盲磚 */
  TEX.tactile = (() => {
    const c = mkCanvas(64, 64), g = c.getContext('2d');
    g.fillStyle = '#e2b62c'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#f5cf4a'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(8 + i * 16, 8 + j * 16, 4.5, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(80,60,0,.4)'; g.strokeRect(0.5, 0.5, 63, 63);
    return mkTex(c);
  })();
  /* 草地 */
  TEX.grass = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#6e9a46'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 12; i++) blot(g, rnd() * 256, rnd() * 256, rr(30, 70), pick(['#86ad52', '#5d8a3c', '#9bb85e']), 0.35);
    for (let i = 0; i < 2600; i++) { g.strokeStyle = hsl(rr(80, 100), rr(35, 55), rr(30, 52)); g.globalAlpha = 0.6; const x = rnd() * 256, y = rnd() * 256; g.beginPath(); g.moveTo(x, y); g.lineTo(x + rr(-2, 2), y - rr(3, 7)); g.stroke(); }
    g.globalAlpha = 1; return mkTex(c);
  })();
  /* 沙灘 */
  TEX.sand = (() => {
    const c = mkCanvas(256, 256), g = c.getContext('2d');
    g.fillStyle = '#d8c59b'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 10; i++) blot(g, rnd() * 256, rnd() * 256, rr(30, 80), pick(['#c4ae84', '#e6d6b0']), 0.35);
    speckle(g, 256, 256, 7000, ['#a89168', '#f2e6c8', '#8d8a80'], 1, 1.6, 0.4);
    return mkTex(c);
  })();
  /* 鐵捲門 */
  TEX.roller = (() => {
    const c = mkCanvas(64, 64), g = c.getContext('2d');
    for (let j = 0; j < 8; j++) { const gr = g.createLinearGradient(0, j * 8, 0, j * 8 + 8); gr.addColorStop(0, '#f2f2f2'); gr.addColorStop(.6, '#c9c9c9'); gr.addColorStop(1, '#8b8b8b'); g.fillStyle = gr; g.fillRect(0, j * 8, 64, 8); }
    return mkTex(c);
  })();
  /* 鐵皮浪板 */
  TEX.corr = (() => {
    const c = mkCanvas(64, 64), g = c.getContext('2d');
    for (let i = 0; i < 8; i++) { const gr = g.createLinearGradient(i * 8, 0, i * 8 + 8, 0); gr.addColorStop(0, '#9a9a9a'); gr.addColorStop(.5, '#f4f4f4'); gr.addColorStop(1, '#9a9a9a'); g.fillStyle = gr; g.fillRect(i * 8, 0, 8, 64); }
    return mkTex(c);
  })();
  /* 樹皮 */
  TEX.bark = (() => {
    const c = mkCanvas(128, 256), g = c.getContext('2d');
    g.fillStyle = '#b3aba1'; g.fillRect(0, 0, 128, 256);
    for (let i = 0; i < 70; i++) { g.strokeStyle = pick(['#948c83', '#c9c1b6', '#7f786f']); g.lineWidth = rr(1, 3); g.globalAlpha = 0.5; const x = rnd() * 128; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rr(-8, 8), 90, x + rr(-8, 8), 170, x + rr(-5, 5), 256); g.stroke(); }
    g.globalAlpha = 1; speckle(g, 128, 256, 800, ['#4f4942', '#c1b8ab'], 1, 2, 0.3);
    return mkTex(c);
  })();
  /* 劍獅 */
  TEX.lion = (() => { const c = mkCanvas(256, 256); drawSwordLion(c.getContext('2d'), 128, 128, 120, 'L'); return mkTex(c, { rep: false }); })();
  TEX.lionR = (() => { const c = mkCanvas(256, 256); drawSwordLion(c.getContext('2d'), 128, 128, 120, 'R'); return mkTex(c, { rep: false }); })();
  /* 鐵窗（透明底白色欄杆） */
  TEX.grille = (() => {
    const c = mkCanvas(64, 64), g = c.getContext('2d');
    g.clearRect(0, 0, 64, 64); g.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) g.fillRect(i * 16 + 6, 0, 4, 64);
    g.fillRect(0, 30, 64, 4);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(i * 16 + 8, 18, 5, Math.PI, 0); g.stroke(); }
    return mkTex(c);
  })();
  TEX.foliage = buildFoliageAtlas();
  reseed(1624);
}

/* ---------- 劍獅：獅面咬劍 ---------- */
function drawSwordLion(g, cx, cy, r, side, bg) {
  g.save(); g.translate(cx, cy); const s = r / 120; g.scale(s, s);
  if (bg !== false) {
    g.fillStyle = '#7c2a1c'; g.beginPath(); g.arc(0, 0, 120, 0, TAU); g.fill();
    g.fillStyle = '#b8862e'; g.beginPath(); g.arc(0, 0, 114, 0, TAU); g.fill();
    g.fillStyle = '#2f5d4e'; g.beginPath(); g.arc(0, 0, 108, 0, TAU); g.fill();
  }
  // 鬃毛：一圈火焰捲毛
  for (let i = 0; i < 18; i++) {
    const a = i / 18 * TAU; g.save(); g.rotate(a);
    g.fillStyle = i % 2 ? '#e0a72e' : '#c7502d';
    g.beginPath(); g.moveTo(-16, -62); g.quadraticCurveTo(0, -112, 18, -64); g.quadraticCurveTo(4, -84, -16, -62); g.fill();
    g.fillStyle = '#2d6a57'; g.beginPath(); g.arc(3, -86, 6, 0, TAU); g.fill();
    g.restore();
  }
  // 臉
  const fg = g.createRadialGradient(-10, -14, 10, 0, 0, 72); fg.addColorStop(0, '#f6c54e'); fg.addColorStop(1, '#d9892a');
  g.fillStyle = fg; g.beginPath(); g.ellipse(0, 4, 66, 64, 0, 0, TAU); g.fill();
  g.strokeStyle = '#5a2412'; g.lineWidth = 3; g.stroke();
  // 額頭「王」
  g.fillStyle = '#7c2a1c'; g.font = `900 30px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('王', 0, -38);
  // 眉毛：綠色捲眉
  for (const sx of [-1, 1]) {
    g.fillStyle = '#2d6a57'; g.beginPath(); g.ellipse(sx * 30, -22, 22, 9, sx * -0.25, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * 28, -4, 15, 0, TAU); g.fill();
    g.strokeStyle = '#3a1a0e'; g.lineWidth = 2.5; g.stroke();
    g.fillStyle = '#1a1a1a'; g.beginPath(); g.arc(sx * 26, -3, 8, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(sx * 23, -6, 2.6, 0, TAU); g.fill();
  }
  // 鼻
  g.fillStyle = '#c0392b'; g.beginPath(); g.ellipse(0, 14, 16, 11, 0, 0, TAU); g.fill();
  g.fillStyle = '#6e1a12'; g.beginPath(); g.arc(-7, 17, 4, 0, TAU); g.arc(7, 17, 4, 0, TAU); g.fill();
  // 嘴
  g.fillStyle = '#6e1a12'; g.beginPath(); g.ellipse(0, 40, 38, 16, 0, 0, TAU); g.fill();
  g.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 10 - 4, 27); g.lineTo(i * 10 + 4, 27); g.lineTo(i * 10, 35); g.fill(); }
  // 劍：橫咬
  const dir = side === 'R' ? 1 : -1;
  g.save(); g.rotate(-0.12 * dir);
  g.fillStyle = '#dfe6ea'; g.strokeStyle = '#4a5358'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-dir * 100, 38); g.lineTo(dir * 44, 33); g.lineTo(dir * 44, 45); g.lineTo(-dir * 100, 42); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#b8862e'; g.fillRect(dir > 0 ? 44 : -52, 26, 8, 26);
  g.fillStyle = '#7c2a1c'; g.fillRect(dir > 0 ? 52 : -86, 34, 34, 8);
  g.fillStyle = '#b8862e'; g.beginPath(); g.arc(dir * 90, 38, 6, 0, TAU); g.fill();
  g.restore();
  g.restore();
}

/* ---------- 樹葉／花簇圖集（2×2） ---------- */
function drawFlameFlower(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const petal = pick(['#e0452c', '#e54b2e', '#d9412a', '#ea5634']);
  for (let k = 0; k < 5; k++) {
    g.save(); g.rotate(k / 5 * TAU + rr(-.15, .15));
    const std = k === 0, L = std ? 30 : 27, W = std ? 21 : 19;
    const gr = g.createLinearGradient(0, 0, 0, -L);
    if (std) { gr.addColorStop(0, '#f2d27a'); gr.addColorStop(0.5, '#f7e8c4'); gr.addColorStop(1, '#f0c96a'); }
    else { gr.addColorStop(0, '#a82618'); gr.addColorStop(0.35, petal); gr.addColorStop(1, '#f06a3c'); }
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2.5, -8, -W / 2, -L * .55);
    g.bezierCurveTo(-W * .72, -L * .95, -W * .2, -L * 1.08, 0, -L * .98);
    g.bezierCurveTo(W * .2, -L * 1.08, W * .72, -L * .95, W / 2, -L * .55);
    g.quadraticCurveTo(2.5, -8, 0, 0); g.fill();
    if (std) { g.strokeStyle = '#c93a24'; g.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 1.2, -8); g.quadraticCurveTo(i * 4, -L * .5, i * 5, -L * .8); g.stroke(); } }
    g.restore();
  }
  g.strokeStyle = '#b3261a'; g.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + rr(-.9, .9); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * 12, Math.sin(a) * 12 - 6, Math.cos(a) * 24, Math.sin(a) * 24 - 4); g.stroke(); g.fillStyle = '#6b1d10'; g.beginPath(); g.arc(Math.cos(a) * 24, Math.sin(a) * 24 - 4, 1.8, 0, TAU); g.fill(); }
  g.fillStyle = '#8a1e12'; g.beginPath(); g.arc(0, 0, 3.5, 0, TAU); g.fill();
  g.restore();
}
function drawPinnate(g, x, y, len, ang, cols, leaflet) {
  // 二回羽狀複葉：主軸＋羽片＋小葉
  g.save(); g.translate(x, y); g.rotate(ang);
  g.strokeStyle = '#5b7a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -len); g.stroke();
  const n = Math.floor(len / 13);
  for (let i = 1; i <= n; i++) {
    const py = -i * len / (n + 0.6);
    for (const sd of [-1, 1]) {
      const pl = len * 0.34 * (1 - Math.abs(i / n - 0.45) * 0.6);
      g.save(); g.translate(0, py); g.rotate(sd * (1.05 + rr(-.1, .1)));
      g.strokeStyle = '#61852f'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -pl); g.stroke();
      const m = Math.max(3, Math.floor(pl / 4.2));
      for (let k = 1; k <= m; k++) {
        const ly = -k * pl / (m + 0.5);
        g.fillStyle = pick(cols);
        g.beginPath(); g.ellipse(-2.6, ly, leaflet * 1.1, leaflet * 0.55, -0.6, 0, TAU); g.fill();
        g.beginPath(); g.ellipse(2.6, ly, leaflet * 1.1, leaflet * 0.55, 0.6, 0, TAU); g.fill();
      }
      g.restore();
    }
  }
  g.restore();
}
function buildFoliageAtlas() {
  const S = 512, c = mkCanvas(S * 2, S * 2), g = c.getContext('2d');
  const leafCols = ['#7fb043', '#6ea23a', '#8fbf4f', '#5f9434', '#9ccb5a'];
  // [0] 鳳凰花簇：底層柔和橘紅團＋花朵＋少量羽葉
  g.save(); g.beginPath(); g.rect(0, 0, S, S); g.clip();
  for (let i = 0; i < 7; i++) drawPinnate(g, rr(60, S - 60), rr(260, S - 30), rr(90, 150), rr(-1.2, 1.2), leafCols, 3.2);
  for (let i = 0; i < 26; i++) { const x = S / 2 + rr(-150, 150), y = S / 2 + rr(-120, 130); const r = rr(45, 80); const gr = g.createRadialGradient(x, y - r * .3, r * .1, x, y, r); gr.addColorStop(0, '#e2583a'); gr.addColorStop(0.75, '#c9442c'); gr.addColorStop(1, 'rgba(180,55,35,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  for (let i = 0; i < 34; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * 185; drawFlameFlower(g, S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d * 0.85, rr(1.3, 1.9), rnd() * TAU); }
  g.restore();
  // [1] 鳳凰木羽葉
  g.save(); g.translate(S, 0); g.beginPath(); g.rect(0, 0, S, S); g.clip();
  for (let i = 0; i < 14; i++) drawPinnate(g, S / 2 + rr(-120, 120), S - rr(40, 150), rr(170, 260), rr(-1.1, 1.1), leafCols, 4.2);
  for (let i = 0; i < 4; i++) drawFlameFlower(g, rr(120, S - 120), rr(120, S - 180), rr(1.2, 1.6), rnd() * TAU);
  g.restore();
  // [2] 榕樹葉團
  g.save(); g.translate(0, S); g.beginPath(); g.rect(0, 0, S, S); g.clip();
  for (let i = 0; i < 16; i++) { const x = S / 2 + rr(-140, 140), y = S / 2 + rr(-130, 130), r = rr(50, 90); const gr = g.createRadialGradient(x, y, r * .2, x, y, r); gr.addColorStop(0, '#2f5e2b'); gr.addColorStop(.8, '#2a5427'); gr.addColorStop(1, 'rgba(40,80,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  for (let i = 0; i < 260; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 215, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
    g.save(); g.translate(x, y); g.rotate(rnd() * TAU);
    g.fillStyle = hsl(rr(95, 118), rr(38, 52), rr(24, 40)); g.beginPath(); g.ellipse(0, 0, rr(13, 18), rr(6.5, 9), 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(210,240,170,.22)'; g.beginPath(); g.ellipse(-2, -2, 9, 3.5, 0, 0, TAU); g.fill();
    g.restore();
  }
  g.restore();
  // [3] 地上落花
  g.save(); g.translate(S, S); g.beginPath(); g.rect(0, 0, S, S); g.clip();
  for (let i = 0; i < 90; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * 230, x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d;
    g.save(); g.translate(x, y); g.rotate(rnd() * TAU);
    g.fillStyle = pick(['#d9432b', '#e55a33', '#c73a26', '#ef7a45', '#f2d27a', '#b8321f']);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-9, -6, -8, -18, 0, -20); g.bezierCurveTo(8, -18, 9, -6, 0, 0); g.fill();
    g.restore();
  }
  g.restore();
  const t = mkTex(c, { rep: false });
  return t;
}

/* ---------- 動漫臉 ---------- */
function drawFace(o, closed) {
  const S = 256, c = mkCanvas(S, S), g = c.getContext('2d');
  const cx = 128, ey = o.old ? 150 : 152, ex = o.male ? 40 : 42;
  const ew = o.male ? 15 : 17, eh = o.old ? 9 : (o.male ? 18 : 23);
  // 腮紅
  if (o.blush) for (const sx of [-1, 1]) {
    const gr = g.createRadialGradient(cx + sx * 56, ey + 30, 2, cx + sx * 56, ey + 30, 22); gr.addColorStop(0, 'rgba(240,120,130,.55)'); gr.addColorStop(1, 'rgba(240,120,130,0)');
    g.fillStyle = gr; g.fillRect(cx + sx * 56 - 24, ey + 8, 48, 44);
    g.strokeStyle = 'rgba(220,90,100,.5)'; g.lineWidth = 1.5; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx + sx * 50 + i * 6 - 6, ey + 34); g.lineTo(cx + sx * 50 + i * 6 - 2, ey + 26); g.stroke(); }
  }
  for (const sx of [-1, 1]) {
    const x = cx + sx * ex;
    // 眉
    g.strokeStyle = o.hair || '#3a2a22'; g.lineWidth = o.male ? 5 : 3.5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x - sx * 16, ey - eh - 16 + (o.male ? 2 : 0)); g.quadraticCurveTo(x, ey - eh - 24, x + sx * 16, ey - eh - 18); g.stroke();
    if (closed || o.old) {
      g.strokeStyle = '#2a1d1a'; g.lineWidth = 4.5;
      g.beginPath(); g.moveTo(x - 16, ey + 2); g.quadraticCurveTo(x, ey + (closed ? 10 : 6), x + 16, ey + 2); g.stroke();
      if (o.old && !closed) { g.fillStyle = '#2a1d1a'; g.beginPath(); g.ellipse(x, ey + 1, 5, 4, 0, 0, TAU); g.fill(); }
      continue;
    }
    // 眼白
    g.fillStyle = '#fffdfb'; g.beginPath(); g.ellipse(x, ey, ew, eh, 0, 0, TAU); g.fill();
    // 虹膜
    const ig = g.createLinearGradient(x, ey - eh, x, ey + eh); ig.addColorStop(0, '#1b1414'); ig.addColorStop(0.45, o.eye); ig.addColorStop(1, lighten(o.eye));
    g.fillStyle = ig; g.beginPath(); g.ellipse(x + sx * 1, ey + 2, ew * 0.8, eh * 0.86, 0, 0, TAU); g.fill();
    g.fillStyle = '#140e0e'; g.beginPath(); g.ellipse(x + sx * 1, ey + 3, ew * 0.36, eh * 0.42, 0, 0, TAU); g.fill();
    // 反光
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x - 5, ey - eh * 0.35, ew * 0.3, eh * 0.24, -0.3, 0, TAU); g.fill();
    g.beginPath(); g.arc(x + 5, ey + eh * 0.42, 2.6, 0, TAU); g.fill();
    // 上睫毛
    g.strokeStyle = '#1f1515'; g.lineWidth = o.male ? 5 : 6.5; g.lineCap = 'round';
    g.beginPath(); g.ellipse(x, ey + 1, ew + 2, eh + 1, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
    if (!o.male) { g.lineWidth = 3; g.beginPath(); g.moveTo(x + sx * (ew + 1), ey - eh * 0.4); g.lineTo(x + sx * (ew + 7), ey - eh * 0.75); g.stroke(); }
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(40,20,20,.7)'; g.beginPath(); g.ellipse(x, ey, ew, eh, 0, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
  }
  if (o.glasses) { g.strokeStyle = '#3b3030'; g.lineWidth = 3; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(cx + sx * ex, ey, 24, 18, 0, 0, TAU); g.stroke(); } g.beginPath(); g.moveTo(cx - ex + 24, ey - 3); g.lineTo(cx + ex - 24, ey - 3); g.stroke(); }
  // 鼻、嘴
  g.fillStyle = 'rgba(170,90,80,.55)'; g.beginPath(); g.arc(cx + 2, ey + 34, 2.2, 0, TAU); g.fill();
  g.strokeStyle = '#7a2e2e'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath();
  if (o.mouth === 'open') { g.fillStyle = '#b3434a'; g.moveTo(cx - 9, 212); g.quadraticCurveTo(cx, 226, cx + 9, 212); g.closePath(); g.fill(); g.stroke(); }
  else if (o.mouth === 'smile') { g.moveTo(cx - 10, 210); g.quadraticCurveTo(cx, 219, cx + 10, 210); g.stroke(); }
  else { g.moveTo(cx - 7, 214); g.lineTo(cx + 7, 214); g.stroke(); }
  if (o.old) { g.strokeStyle = 'rgba(120,70,60,.35)'; g.lineWidth = 1.5; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(cx + sx * 30, 200); g.quadraticCurveTo(cx + sx * 24, 214, cx + sx * 28, 226); g.stroke(); } }
  const t = mkTex(c, { rep: false }); return t;
}
function lighten(hex) { const c = new THREE.Color(hex); c.lerp(new THREE.Color('#ffffff'), 0.45); return '#' + c.getHexString(); }
