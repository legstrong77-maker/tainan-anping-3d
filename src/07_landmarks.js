/* ================= 07 地標：古堡、城垣殘蹟、洋行樹屋、天后宮、億載金城、海岸 ================= */
/* 拱廊開口（外框挖拱洞後擠出） */
const _archCache = new Map();
function archGeo(w, h, ow, oh, depth) {
  const key = [w, h, ow, oh, depth].join(',');
  if (_archCache.has(key)) return _archCache.get(key);
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.lineTo(-w / 2, 0);
  const r = ow / 2, hole = new THREE.Path(); hole.moveTo(-r, 0); hole.lineTo(r, 0); hole.lineTo(r, oh - r); hole.absarc(0, oh - r, r, 0, Math.PI, false); hole.lineTo(-r, 0);
  s.holes.push(hole);
  let g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -depth / 2);
  g = g.index ? g.toNonIndexed() : g; _archCache.set(key, g); return g;
}
function archBay(F, m, lx, y, lz, w, h, ow, oh, depth, col, ry) {
  const q = F.p(lx, lz); addGeo(m, archGeo(w, h, ow, oh, depth), mat(q[0], y, q[1], 0, F.rot + (ry || 0), 0), col);
}
/* 石像／銅像 */
function statue(x, y, z, rot, col, o) {
  o = o || {}; const F = new Frame(x, z, rot), m = 'plain';
  F.cyl(m, 0, y, 0, 0.42, 0.62, 1.25, 12, col);            // 袍
  F.cyl(m, 0, y + 1.25, 0, 0.3, 0.42, 0.55, 12, col);      // 胸
  F.sph(m, 0, y + 2.02, 0, 0.19, 0.22, 0.19, col);         // 頭
  if (o.hat) F.cyl(m, 0, y + 2.18, 0, 0.12, 0.26, 0.2, 10, col); else F.sph(m, 0, y + 2.18, -0.02, 0.2, 0.12, 0.2, col);
  F.tube(m, [0.36, y + 1.7, 0], [0.5, y + 1.25, 0.15], 0.09, 0.08, 6, col);
  F.tube(m, [-0.36, y + 1.7, 0], [-0.42, y + 1.1, 0.2], 0.09, 0.08, 6, col);
  if (o.sword) F.tube(m, [-0.42, y + 1.1, 0.2], [-0.45, y + 0.2, 0.45], 0.03, 0.03, 4, col);
  if (o.scroll) F.cyl(m, 0.5, y + 1.2, 0.2, 0.06, 0.06, 0.35, 6, col);
}
/* 解說牌＋知識卡 */
const INFO = [];
function infoBoard(x, z, rot, card, r) {
  const F = new Frame(x, z, rot);
  F.box('wood', -0.95, 0, -0.05, 0.12, 1.1, 0.12, '#4a3020'); F.box('wood', 0.95, 0, -0.05, 0.12, 1.1, 0.12, '#4a3020');
  F.box('wood', 0, 1.0, -0.08, 2.1, 1.45, 0.1, '#3b2616', { col: true });
  const ar = ATLAS_INFO.draw(512, 352, (g, w, h) => drawInfoBoard(g, w, h, card));
  F.panel('info', 0, 1.72, -0.02, 1.96, 1.35, ar);
  INFO.push(Object.assign({ x, z, r: r || 16 }, card));
}

/* ---------- 安平古堡 ---------- */
const FORT_TOP = 4.2;
function buildOldFort() {
  ground('grass', -122, -124, -8, -36, 0.03, '#ffffff', { uv: 0.25 });
  ground('slab', -44, -40, -36, -34, 0.05, '#ffffff', { uv: 0.35 });
  const cx = -62, cz = -84;
  const tiers = [[48, 34, 1.4], [42, 29, 2.8], [36, 24, FORT_TOP]];
  for (const [w, d, top] of tiers) { box('brick', cx, 0, cz, w, top, d, '#f1e2d4', 0, { col: true, noTop: top === FORT_TOP }); box('plain', cx, top, cz, w + 0.3, 0.12, d + 0.3, '#c9b8a2', 0, { noSide: false }); }
  box('grass', cx, FORT_TOP + 0.12, cz, 35, 0.02, 23, '#ffffff', 0, { noSide: true, uv: 0.3 });
  box('slab', cx, FORT_TOP + 0.13, cz + 6, 5, 0.02, 12, '#ffffff', 0, { noSide: true, uv: 0.35 });
  addCol(cx, cz, 18, 12, 0, FORT_TOP + 0.13);
  // 前方大階梯
  const n = 21, run = 0.62, z0 = cz + 12 + n * run;
  for (let i = 0; i < n; i++) box('brick', cx, 0, z0 - i * run - run / 2, 5.6, (i + 1) * FORT_TOP / n + 0.13 / n * (i + 1), run, '#e9d6c4', 0, { col: true });
  for (const sd of [-1, 1]) { box('brick', cx + sd * 3.1, 0, z0 - n * run / 2, 0.6, 1.0, n * run, '#d8c4b0', 0, {}); }
  // 瞭望台（西側）：白色方塔＋外擴玻璃瞭望室＋紅瓦尖頂
  const tx = cx - 10, tz = cz - 3, y0 = FORT_TOP + 0.12;
  box('plaster', tx, y0, tz, 5, 11, 5, '#f5f4ef', 0, { col: true });
  for (let k = 1; k < 4; k++) box('plain', tx, y0 + k * 2.8, tz, 5.3, 0.18, 5.3, '#e6e2d8');
  for (let k = 0; k < 3; k++) for (const [dx, dz, r] of [[0, 2.51, 0], [0, -2.51, Math.PI], [2.51, 0, Math.PI / 2], [-2.51, 0, -Math.PI / 2]]) box('window', tx + dx, y0 + 1.1 + k * 2.8, tz + dz, 0.8, 1.2, 0.04, '#ffe3a8', r);
  const ry = y0 + 11;
  const Tf = new Frame(tx, tz, 0);
  for (let k = 0; k < 4; k++) { const G = new Frame(tx, tz, k * Math.PI / 2); G.quad('plaster', [-2.5, ry, 2.5], [2.5, ry, 2.5], [3.3, ry + 0.9, 3.3], [-3.3, ry + 0.9, 3.3], '#f5f4ef', true); }
  box('plain', tx, ry + 0.9, tz, 6.8, 0.2, 6.8, '#f0eee8');
  for (let k = 0; k < 4; k++) { const G = new Frame(tx, tz, k * Math.PI / 2); G.box('window', 0, ry + 1.1, 3.3, 6.2, 1.5, 0.06, '#ffe8b8'); for (const lx of [-3.3, -1.1, 1.1, 3.3]) G.box('plain', lx, ry + 1.1, 3.35, 0.14, 1.5, 0.12, '#f7f7f2'); }
  box('plain', tx, ry + 2.6, tz, 7.2, 0.25, 7.2, '#f7f7f2');
  addGeo('plain', GEO.cone(4), mat(tx, ry + 4.3, tz, 0, Math.PI / 4, 0, 5.2, 3.4, 5.2), '#b83a2e');
  cyl('plain', tx, ry + 6, tz, 0.05, 0.05, 1.3, 5, '#d8d2c4');
  addHalo(tx, ry + 1.8, tz, '#ffe0a0', 12);
  // 史蹟紀念館（東側）：白牆、半圓拱窗、四坡灰瓦
  const hx = cx + 7, hz = cz - 3, F = new Frame(hx, hz, 0);
  F.box('plaster', 0, y0, 0, 18, 5, 9, '#f2f0ea', { col: true });
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    for (const sd of [1, -1]) { const G = new Frame(hx, hz, sd > 0 ? 0 : Math.PI); G.box('window', i * 2.4, y0 + 1.2, 4.52, 1.1, 2.0, 0.05, '#ffe0a8'); const q = G.p(i * 2.4, 4.54); addGeo('window', GEO.halfDisc(), mat(q[0], y0 + 3.2, q[1], 0, G.rot, 0, 0.55, 0.55, 1), '#ffe0a8'); G.box('plain', i * 2.4, y0 + 0.9, 4.6, 1.5, 0.12, 0.25, '#e2ddd0'); }
  }
  for (const sd of [-1, 1]) F.box('plaster', sd * 2.3, y0, 5.6, 0.4, 4.2, 2.2, '#f2f0ea');
  F.box('plain', 0, y0 + 4.2, 5.6, 5.2, 0.3, 2.4, '#e9e6de');
  archBay(F, 'plaster', 0, y0, 6.6, 5, 4.2, 2.6, 3.4, 0.4, '#f2f0ea');
  F.box('wood', 0, y0, 4.55, 1.6, 2.6, 0.08, '#6b4a2e');
  hipRoof(F, 0, 0, 18, 9, y0 + 5, 2.6, 'roof', '#6d6a66', 0.7);
  // 古砲
  for (let i = 0; i < 6; i++) {
    const x = cx - 14 + i * 5.6; if (Math.abs(x - cx) < 3.5) continue;
    box('slab', x, y0, cz + 10.5, 1.2, 0.35, 2.2, '#9a948a');
    tube('plain', V3(x, y0 + 0.62, cz + 9.9), V3(x, y0 + 0.7, cz + 11.9), 0.24, 0.15, 10, '#2a2a2a', { cap: true });
    sph('plain', x, y0 + 0.62, cz + 9.8, 0.25, 0.25, 0.25, '#2a2a2a');
  }
  // 國姓爺立像
  box('slab', -40, 0, -58, 2.2, 2.4, 2.2, '#bdb8ae', 0, { col: true });
  statue(-40, 2.4, -58, 0, '#8f8a80', { hat: true, sword: true });
  // 石碑
  box('slab', -28, 0, -44, 1.8, 0.4, 0.9, '#9a948a', 0, { col: true });
  box('slab', -28, 0.4, -44, 1.4, 2.6, 0.4, '#bdb8ae', 0, { col: true });
  const sr = ATLAS_BOARD.draw(128, 256, (g, w, h) => { g.fillStyle = '#bdb8ae'; g.fillRect(0, 0, w, h); g.fillStyle = '#3a3530'; g.font = `900 52px ${FONT_SERIF}`; g.textAlign = 'center'; ['安', '平', '古', '堡'].forEach((c, i) => g.fillText(c, w / 2, 58 + i * 58)); });
  panel('boards', -28, 1.75, -43.79, 1.1, 2.2, 0, sr);
  // 園區入口
  for (const x of [-45, -35]) cyl('plain', x, 0, -35.5, 0.3, 0.32, 3.6, 10, '#a8452f', { col: true });
  box('roof', -40, 3.6, -35.5, 12, 0.3, 1.4, '#ffffff');
  const gr = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '安平古堡', en: 'ANPING OLD FORT · FORT ZEELANDIA', style: 'wood' }));
  panel('signs', -40, 3.1, -34.75, 6, 1.5, 0, gr);
  for (let x = -120; x < -8; x += 6) if (x < -48 || x > -32) box('brick', x + 3, 0, -36.5, 6, 0.8, 0.5, '#e9d6c4', 0, { col: true });
  // 熱蘭遮城博物館（清代稅務司公館）
  colonialHouse(new Frame(-104, -64, 0), 16, 14, 'plaster');
  // 樹
  banyanTree(-30, -100, { scale: 1.1, cards: 1300 });
  banyanTree(-110, -104, { scale: 1.0, cards: 1100 });
  flameTree(-18, -62, { scale: 1.0, cards: 1300 });
  for (const [x, z] of [[-90, -52], [-24, -80], [-15, -118]]) shrub(x, z, 1.4, '#4f8a3a');
}
/* 殖民地陽台式洋樓（德記洋行、稅務司公館共用） */
function colonialHouse(F, w, d, wm) {
  const H1 = 4.2, H2 = 4.0, bay = 3;
  F.box(wm, 0, 0, 0, w - 5, H1 + H2, d - 5, '#f4f3ee', { col: true });
  for (const sd of [-1, 1]) for (let i = -1; i <= 1; i++) { F.box('window', i * 3, 1.0, sd * ((d - 5) / 2 + 0.02), 1.2, 2.2, 0.05, '#ffe0a8'); F.box('window', i * 3, H1 + 1.0, sd * ((d - 5) / 2 + 0.02), 1.2, 2.0, 0.05, '#ffe0a8'); }
  F.box('plain', 0, 0, 0, w + 0.6, 0.5, d + 0.6, '#d9d2c2', { col: true });
  F.box('plain', 0, H1 - 0.1, 0, w, 0.3, d, '#e9e6de');
  const n = Math.round(w / bay), nd = Math.round(d / bay);
  for (const [side, len, cnt] of [[0, w, n], [Math.PI / 2, d, nd], [-Math.PI / 2, d, nd]]) {
    const G = new Frame(...F.p(side === 0 ? 0 : (side > 0 ? w / 2 : -w / 2), side === 0 ? d / 2 : 0), F.rot + side);
    for (let i = 0; i < cnt; i++) {
      const lx = -len / 2 + (i + 0.5) * len / cnt;
      archBay(G, wm, lx, 0.5, -0.2, len / cnt, H1 - 0.6, len / cnt - 0.8, H1 - 1.3, 0.5, '#f4f3ee');
      archBay(G, wm, lx, H1 + 0.2, -0.2, len / cnt, H2 - 0.3, len / cnt - 0.8, H2 - 1.1, 0.5, '#f4f3ee');
      for (let k = 0; k < 6; k++) G.cyl('plain', lx - len / cnt * 0.35 + k * len / cnt * 0.14, H1 + 0.2, -0.2, 0.06, 0.08, 0.75, 6, '#3e8e6a');
      G.box('plain', lx, H1 + 0.95, -0.2, len / cnt - 0.6, 0.1, 0.25, '#e9e6de');
    }
    addCol(...G.p(-len / 2 + 0.3, -0.2), 0.3, 0.3, 0, H1 + H2, G.rot); addCol(...G.p(len / 2 - 0.3, -0.2), 0.3, 0.3, 0, H1 + H2, G.rot);
  }
  hipRoof(F, 0, 0, w, d, H1 + H2 + 0.2, 3.0, 'roof', '#6a6866', 0.6);
  F.box('plain', 0, H1 + H2, 0, w + 0.3, 0.3, d + 0.3, '#e9e6de');
  for (let i = 0; i < 4; i++) F.box('slab', 0, 0, d / 2 + 0.6 + i * 0.4, 3, 0.5 - i * 0.12, 0.4, '#bdb8ae', { col: true });
}

/* ---------- 熱蘭遮城城垣殘蹟：紅磚殘牆＋榕樹根 ---------- */
function buildWallRuin() {
  const z = -41, x0 = -112, x1 = -46, th = 1.8;
  let x = x0; const hs = [];
  while (x < x1) {
    const w = rr(1.2, 2.6), h = 2.4 + Math.sin(x * 0.13) * 0.8 + rr(-.5, .6) + (x > -80 && x < -60 ? 1.0 : 0);
    box('oldbrick', x + w / 2, 0, z + rr(-.08, .08), w + 0.02, h, th, '#ffffff', 0, { uv: 1 });
    if (chance(0.35)) box('oldbrick', x + w / 2 + rr(-.3, .3), h, z, w * rr(0.3, 0.6), rr(0.3, 0.7), th * 0.7, '#e8d8c8', 0, {});
    hs.push([x + w / 2, h]); x += w;
  }
  addCol((x0 + x1) / 2, z, (x1 - x0) / 2, th / 2, 0, 4);
  for (const ax of [-100, -78, -58]) { box('plain', ax, 1.6, z + th / 2 + 0.02, 0.12, 0.9, 0.06, '#2a2420'); box('plain', ax, 2.0, z + th / 2 + 0.02, 0.5, 0.1, 0.06, '#2a2420'); }
  // 榕樹與網狀樹根
  for (const [bx, s] of [[-96, 1.25], [-67, 1.45]]) {
    const bz = z - 3.2;
    banyanTree(bx, bz, { scale: s, cards: 2200, reach: 1.25, propRoots: 0.3 });
    for (let k = 0; k < 48; k++) {
      const wx = bx + rr(-8.5, 8.5) * s; let wh = 3;
      for (const [hx, hh] of hs) if (Math.abs(hx - wx) < 1.4) wh = hh;
      const r0 = rr(0.035, 0.12) * s, face = chance(0.7) ? 1 : -1, off = th / 2 + r0 * 0.7;
      const col = pick(['#b3a794', '#a39784', '#bcb09d', '#aa9e8b']);
      const start = V3(bx + rr(-0.8, 0.8), rr(1.8, 3.0) * s, bz + rr(-0.4, 0.4) * s);
      const pts = [start, V3((wx + start.x) / 2, wh + rr(0.3, 0.8), z - th / 2 - rr(0.3, 1.0)), V3(wx, wh + r0, z + face * th * 0.2)];
      let x = wx, y = wh;
      const n = ri(4, 6);
      for (let i = 1; i <= n; i++) { x += rr(-0.45, 0.45); y = wh * (1 - i / n); pts.push(V3(x, Math.max(0, y), z + face * (off + (i === n ? 0.15 : 0)))); }
      for (let i = 1; i < pts.length; i++) { const t0 = (i - 1) / (pts.length - 1), t1 = i / (pts.length - 1); tube('bark', pts[i - 1], pts[i], r0 * (1.25 - t0 * 0.6), r0 * (1.25 - t1 * 0.6), 5, col); }
      if (chance(0.45)) { const i = ri(3, pts.length - 2), p = pts[i]; const q = V3(p.x + rr(-1.8, 1.8), Math.max(0.2, p.y - rr(0.4, 1.4)), p.z); tube('bark', p, q, r0 * 0.6, r0 * 0.3, 4, col); }
    }
  }
  infoBoard(-86, -38.2, 0, { era: '17 世紀・荷蘭時期', title: '熱蘭遮城城垣殘蹟', en: 'Remains of Fort Zeelandia', body: '外城南壁的紅磚殘牆，長七十多公尺，是熱蘭遮城少數保留原貌的遺構。老榕樹的根把城牆緊緊抱住。相傳磚縫用糖水、糯米和蚵殼灰調和。', tag: '相傳：糖水糯米蚵殼灰' }, 22);
}

/* ---------- 德記洋行＋安平樹屋＋夕遊出張所 ---------- */
function buildTaitAndTreeHouse() {
  ground('grass', -122, -200, -8, -124, 0.03, '#ffffff', { uv: 0.25 });
  ground('slab', -74, -150, -66, -124, 0.05, '#ffffff', { uv: 0.35 });
  colonialHouse(new Frame(-70, -142, 0), 20, 15, 'plaster');
  const tr = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '英商德記洋行', en: 'TAIT & CO. MERCHANT HOUSE · 1867', style: 'cream' }));
  panel('signs', -70, 3.95, -134.38, 3.2, 0.8, 0, tr);
  // 樹屋：無頂紅磚倉庫殘牆
  const cx = -70, cz = -176, w = 26, d = 13, h = 5.6;
  const wall = (x, z, sx, sz) => box('oldbrick', x, 0, z, sx, h, sz, '#f0dccc', 0, { col: true });
  for (let i = 0; i < 5; i++) { const x = cx - w / 2 + i * w / 5; wall(x + 1.3, cz + d / 2, 2.6, 0.7); wall(x + 1.3, cz - d / 2, 2.6, 0.7); box('oldbrick', x + 3.9, 3.8, cz + d / 2, 2.6, h - 3.8, 0.7, '#f0dccc'); box('oldbrick', x + 3.9, 3.8, cz - d / 2, 2.6, h - 3.8, 0.7, '#f0dccc'); box('oldbrick', x + 3.9, 0, cz - d / 2, 2.6, 1.0, 0.7, '#f0dccc', 0, { col: true }); }
  wall(cx - w / 2, cz, 0.7, d); wall(cx + w / 2, cz, 0.7, d);
  // 木棧道與觀景台
  box('wood', cx, 0.03, cz + d / 2 + 2, w, 0.1, 3.2, '#8b6b4a', 0, { col: true });
  for (let i = 0; i < 16; i++) box('wood', cx - 11.6 + i * 0.35 + 0.175, 0, cz - 2, 0.36, (i + 1) * 0.226, 2, '#8b6b4a', 0, { col: true });
  box('wood', cx + 1, 3.4, cz - 2, 14, 0.22, 2.2, '#8b6b4a', 0, { col: true });
  for (let x = cx - 6; x <= cx + 8; x += 3.5) { cyl('plain', x, 0, cz - 3.1, 0.07, 0.07, 3.4, 6, '#3a3a3a'); cyl('plain', x, 0, cz - 0.9, 0.07, 0.07, 3.4, 6, '#3a3a3a'); }
  railing('plain', cx - 6, cz - 3.1, cx + 8, cz - 3.1, 3.62, 1.0, '#3a3a3a', 1, true); railing('plain', cx - 6, cz - 0.9, cx + 8, cz - 0.9, 3.62, 1.0, '#3a3a3a', 1, true);
  for (let i = 0; i < 12; i++) box('wood', cx + 8.17 + i * 0.33, 3.4, cz - 2, 0.34, 0.22 + (i + 1) * 0.2, 2.2, '#8b6b4a', 0, { col: true });
  box('wood', cx + 14, 6.0, cz - 2, 4, 0.2, 4, '#8b6b4a', 0, { col: true });
  for (const [dx, dz] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) cyl('plain', cx + 14 + dx, 0, cz - 2 + dz, 0.08, 0.08, 7.2, 6, '#3a3a3a');
  railing('plain', cx + 12, cz - 4, cx + 16, cz - 4, 6.2, 1.1, '#3a3a3a', 0.8, true); railing('plain', cx + 16, cz - 4, cx + 16, cz, 6.2, 1.1, '#3a3a3a', 0.8, true); railing('plain', cx + 12, cz, cx + 16, cz, 6.2, 1.1, '#3a3a3a', 0.8, true);
  // 吞覆的榕樹
  banyanTree(cx - 2, cz + 3.2, { scale: 1.9, cards: 3800, reach: 1.1, propRoots: 0.35 });
  banyanTree(cx + 9, cz + 2, { scale: 1.3, cards: 1600, propRoots: 0.4 });
  for (let k = 0; k < 90; k++) {
    const side = pick(['n', 's', 'e', 'w']);
    let wx, wz, nx = 0, nz = 0;
    if (side === 'n' || side === 's') { wx = cx + rr(-w / 2, w / 2); wz = cz + (side === 's' ? d / 2 : -d / 2); nz = side === 's' ? 1 : -1; }
    else { wz = cz + rr(-d / 2, d / 2); wx = cx + (side === 'e' ? w / 2 : -w / 2); nx = side === 'e' ? 1 : -1; }
    const r0 = rr(0.04, 0.18), top = V3(wx, h + 0.15, wz);
    tube('bark', V3(cx + rr(-3, 3), rr(4.5, 7), cz + rr(-2, 2)), top, r0 * 1.2, r0, 5, BARK_BANYAN);
    let prev = top;
    for (let s = 1; s <= 3; s++) { const p = V3(wx + nx * (0.4 + s * 0.05) + rr(-.8, .8) * (nz ? 1 : 0), h * (1 - s / 3) + 0.02, wz + nz * (0.4 + s * 0.05) + rr(-.8, .8) * (nx ? 1 : 0)); tube('bark', prev, p, r0, r0 * 0.9, 5, chance(0.5) ? BARK_BANYAN : '#a89c8a'); prev = p; }
  }
  // 夕遊出張所：L 型木造、灰瓦、白沙與鹽山
  const S = new Frame(-112, -158, Math.PI / 2);
  S.box('wood', 0, 0.4, 0, 14, 3.4, 7, '#6a5240', { col: true }); S.box('wood', -4.5, 0.4, 7, 5, 3.4, 7, '#6a5240', { col: true });
  S.box('plain', 0, 0, 0, 14.6, 0.4, 7.6, '#c9c2b4', { col: true }); S.box('plain', -4.5, 0, 7, 5.6, 0.4, 7.6, '#c9c2b4');
  for (let i = -2; i <= 2; i++) S.box('window', i * 2.6, 1.5, 3.52, 1.2, 1.5, 0.05, '#ffe0a8');
  gable(S, 0, 0, 14, 7, 3.8, 2.2, 'roof', '#6f7478', 0.6); const S2 = new Frame(...S.p(-4.5, 7), S.rot + Math.PI / 2); gable(S2, 0, 0, 7, 5, 3.8, 1.8, 'roof', '#6f7478', 0.5);
  S.cyl('plain', 2, 0, 4.2, 0.2, 0.2, 3.0, 8, '#a7a193'); S.cyl('plain', -2, 0, 4.2, 0.2, 0.2, 3.0, 8, '#a7a193');
  box('sand', -100, 0.04, -158, 10, 0.05, 16, '#f4f0e6', 0, { noSide: true, uv: 0.5 });
  addGeo('plain', GEO.cone(14), mat(-99, 0.8, -154, 0, 0, 0, 2.2, 1.6, 2.2), '#f7f6f2');
  const sgn = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '夕遊出張所', en: 'FORMER SALT OFFICE', style: 'black' }));
  panel('signs', -108.4, 2.6, -158, 3.2, 0.8, Math.PI / 2, sgn);
  banyanTree(-124, -176, { scale: 1.2, cards: 1300 });
  infoBoard(-64, -129, 0, { era: '1867 年', title: '英商德記洋行', en: 'Tait & Co. Merchant House', body: '1858 年天津條約後安平開港，德記、怡記、和記、唻記、東興五家洋行進駐，把糖和樟腦運往世界。這棟白色拱廊洋樓是英商德記洋行。', tag: '市定古蹟' }, 16);
  infoBoard(-56, -160, 0, { era: '日治時期鹽業倉庫', title: '安平樹屋', en: 'Anping Tree House', body: '原是德記洋行的倉庫，日治時期堆放鹽。屋頂塌落後，榕樹氣根一點一點吞覆牆面，樹冠成了新的屋頂。2004 年整修開放。', tag: '氣根吞覆的倉庫' }, 18);
  infoBoard(-104, -146, Math.PI / 2, { era: '日治 1920 年代', title: '夕遊出張所', en: 'Former Salt Office', body: '日治時期專賣局的鹽務辦公處，和洋折衷的木造建築。安平一帶曾是鹽田，鹽業、蚵業與漁業撐起港鎮的日常。', tag: '鹽的故事' }, 14);
}

/* ---------- 安平開台天后宮 ---------- */
function dragonRidge(F, lx0, lx1, y, lz) {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = lerp(lx0, lx1, t), yy = y + 0.25 + Math.sin(t * Math.PI * 3) * 0.18;
    F.sph('plain', x, yy, lz, 0.2, 0.16, 0.16, i % 3 === 0 ? '#e3b23c' : i % 3 === 1 ? '#2f8a5a' : '#2b6fb3');
  }
  F.sph('plain', (lx0 + lx1) / 2, y + 0.6, lz, 0.25, 0.25, 0.25, '#e8392b');
}
function templeHall(F, lz, w, d, eave, rise, dbl, open) {
  F.box('plain', 0, 0, lz, w, 0.5, d, '#bdb8ae', { col: true });
  const iw = w - 1.2, id = d - 1.6, H = eave - 0.5, wc = '#e8cfc0';
  const fz = lz + id / 2 - 0.2, bz = lz - id / 2 + 0.2;
  F.box('brick', -iw / 2 + 0.2, 0.5, lz, 0.4, H, id, wc, { col: true });
  F.box('brick', iw / 2 - 0.2, 0.5, lz, 0.4, H, id, wc, { col: true });
  const wallWithDoor = (z) => {
    const side = (iw - 2.8) / 2;
    F.box('brick', -1.4 - side / 2, 0.5, z, side, H, 0.4, wc, { col: true });
    F.box('brick', 1.4 + side / 2, 0.5, z, side, H, 0.4, wc, { col: true });
    F.box('brick', 0, 3.4, z, 2.8, H + 0.5 - 3.4, 0.4, wc);
  };
  if (open) { F.box('brick', 0, 0.5, bz, iw, H, 0.4, wc, { col: true }); for (const lx of [-iw / 2 + 1.2, -iw / 6, iw / 6, iw / 2 - 1.2]) F.cyl('plain', lx, 0.5, fz, 0.28, 0.3, H, 12, '#b3261e', { col: true }); }
  else { wallWithDoor(fz); wallWithDoor(bz); }
  F.box('plain', 0, eave - 0.15, lz, iw, 0.15, id, '#7a2a1e', { bottom: true });
  hipRoof(F, 0, lz, w, d, eave, rise * 0.55, 'plain', '#2e7d6b', 0.9);
  if (dbl) {
    F.box('plain', 0, eave + rise * 0.4, lz, w * 0.62, 1.1, d * 0.5, '#b3261e');
    gable(F, 0, lz, w * 0.66, d * 0.62, eave + rise * 0.4 + 1.1, rise * 0.7, 'plain', '#2e7d6b', 0.7);
    swallowRidge(F, -w * 0.33, w * 0.33, eave + rise * 1.1 + 1.0, lz, '#2e7d6b');
    dragonRidge(F, -w * 0.28, w * 0.28, eave + rise * 1.1 + 1.1, lz);
  } else {
    swallowRidge(F, -w * 0.4, w * 0.4, eave + rise * 0.55 - 0.1, lz, '#2e7d6b');
    dragonRidge(F, -w * 0.3, w * 0.3, eave + rise * 0.55, lz);
  }
}
function buildTemple() {
  const T = new Frame(TEMPLE_POS.x, TEMPLE_POS.z, 1.05);
  // 廟埕
  const q = T.p(0, 17); box('slab', q[0], 0, q[1], 24, 0.06, 18, '#ffffff', T.rot, { noSide: true, uv: 0.35 });
  const q2 = T.p(0, 0); box('slab', q2[0], 0, q2[1], 26, 0.05, 26, '#ffffff', T.rot, { noSide: true, uv: 0.35 });
  // 三川殿（重簷歇山、青綠琉璃瓦）
  templeHall(T, 7, 18, 8, 4.6, 3.2, true);
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    T.cyl('plain', i * 3.1, 0.5, 10.65, 0.3, 0.34, 4.1, 12, '#8a8f8a', { col: true });
    for (let k = 0; k < 8; k++) { const a = k * 0.9, y = 0.8 + k * 0.45; T.sph('plain', i * 3.1 + Math.cos(a) * 0.34, y, 10.65 + Math.sin(a) * 0.34, 0.14, 0.12, 0.14, '#7a807a'); }
  }
  for (const lx of [-5.6, -3.0, 3.0, 5.6]) T.panel('boards', lx, 2.1, 10.23, 1.9, 3.0, ATLAS_BOARD.door, '#ffffff');
  T.panel('boards', 0, 4.1, 10.24, 3.2, 0.85, ATLAS_BOARD.plaqueTemple, '#ffffff');
  for (let i = 0; i < 9; i++) { const lx = -7.2 + i * 1.8; lantern(...T.p(lx, 11.6).slice(0, 1), 4.1, T.p(lx, 11.6)[1], '#d0302a', 0.95); }
  // 天井＋正殿
  T.box('slab', 0, 0.02, 0, 12, 0.06, 6, '#ffffff', { noSide: true });
  templeHall(T, -7, 20, 10, 5.2, 3.6, false, true);
  T.box('plain', 0, 0.5, -3.2, 2.5, 0.08, 0.5, '#b3261e');
  T.box('plain', 0, 0.5, -6.5, 5, 1.1, 1.6, '#8a2a1e'); T.box('plain', 0, 1.6, -6.5, 5.2, 0.1, 1.8, '#e3b23c');
  { const sp = T.p(0, -7.3); statue(sp[0], 1.7, sp[1], T.rot, '#c9962e'); }
  for (const lx of [-1.8, 1.8]) { T.cyl('lamp', lx, 1.7, -6.1, 0.07, 0.07, 0.5, 6, '#ffcf70'); }
  T.box('lamp', 0, 3.6, -5.5, 3, 0.1, 0.1, '#ffb070');
  addHalo(...T.a(0, 3.2, -4), '#ffb070', 9);
  // 鐘鼓樓
  for (const sd of [-1, 1]) {
    T.box('brick', sd * 11.5, 0, 2, 4, 5, 4, '#e8cfc0', { col: true });
    hipRoof(new Frame(...T.p(sd * 11.5, 2), T.rot), 0, 0, 4, 4, 5, 2.2, 'plain', '#2e7d6b', 0.5);
  }
  // 牌樓
  // 三間四柱牌樓：中高側低、各自有青綠琉璃瓦頂
  for (const [lx, h] of [[-4.6, 4.2], [-1.9, 5.3], [1.9, 5.3], [4.6, 4.2]]) {
    T.box('slab', lx, 0, 26, 0.95, 0.55, 0.95, '#a8a49a', { col: true });
    T.cyl('plain', lx, 0.55, 26, 0.26, 0.28, h - 0.55, 12, '#a61c1c', { col: true });
    T.box('plain', lx, h - 0.25, 26, 0.62, 0.25, 0.62, '#e3b23c');
  }
  T.box('plain', 0, 4.35, 26, 3.8, 0.95, 0.5, '#a61c1c'); T.box('plain', 0, 4.25, 26, 3.8, 0.1, 0.56, '#e3b23c'); T.box('plain', 0, 5.3, 26, 4.4, 0.12, 0.62, '#2b6fb3');
  for (const sd of [-1, 1]) { T.box('plain', sd * 3.25, 3.35, 26, 2.3, 0.7, 0.44, '#a61c1c'); T.box('plain', sd * 3.25, 4.05, 26, 2.5, 0.1, 0.52, '#2b6fb3'); }
  hipRoof(T, 0, 26, 4.6, 1.3, 5.42, 1.0, 'plain', '#2e7d6b', 0.45); swallowRidge(T, -2.0, 2.0, 6.3, 26, '#2e7d6b'); dragonRidge(T, -1.6, 1.6, 6.35, 26);
  for (const sd of [-1, 1]) { hipRoof(T, sd * 3.3, 26, 2.3, 1.0, 4.15, 0.6, 'plain', '#2e7d6b', 0.35); }
  T.panel('boards', 0, 4.82, 26.27, 3.3, 0.66, ATLAS_BOARD.plaqueGate, '#ffffff');
  // 天公爐＋香煙
  T.cyl('plain', 0, 0, 17, 0.9, 1.1, 0.5, 14, '#6a5a3a'); T.cyl('plain', 0, 0.5, 17, 1.3, 0.9, 1.2, 16, '#8a7442'); T.cyl('plain', 0, 1.7, 17, 1.4, 1.3, 0.2, 16, '#a88a4a');
  for (const sd of [-1, 1]) T.tube('plain', [sd * 1.3, 1.6, 17], [sd * 1.7, 2.2, 17], 0.12, 0.1, 6, '#8a7442');
  SMOKE_SRC.push(T.v(0, 1.9, 17));
  // 石獅
  for (const sd of [-1, 1]) {
    T.box('slab', sd * 3.6, 0, 13, 1.2, 0.9, 1.6, '#a8a49a', { col: true });
    T.box('plain', sd * 3.6, 0.9, 12.9, 0.8, 0.7, 1.2, '#b8b4aa'); T.sph('plain', sd * 3.6, 1.9, 13.3, 0.45, 0.45, 0.42, '#b8b4aa'); T.sph('plain', sd * 3.6, 1.85, 13.7, 0.2, 0.16, 0.12, '#a8a49a');
    for (let k = 0; k < 7; k++) T.sph('plain', sd * 3.6 + Math.cos(k) * 0.42, 1.9 + Math.sin(k) * 0.42, 13.1, 0.14, 0.14, 0.14, '#9a968c');
  }
  // 金爐
  const kq = T.p(-9, 18); cyl('brick', kq[0], 0, kq[1], 1.1, 1.3, 3, 8, '#ffffff', { col: true }); cyl('plain', kq[0], 3, kq[1], 0.6, 1.4, 1.2, 8, '#2e7d6b'); box('lamp', kq[0], 0.8, kq[1], 0.9, 0.7, 2.25, '#ff7a2a', T.rot);
  addHalo(kq[0], 1.2, kq[1], '#ff7a2a', 3);
  // 土地公小祠
  const tq = T.p(9.5, 20); box('brick', tq[0], 0, tq[1], 1.6, 1.6, 1.2, '#ffffff', T.rot, { col: true }); hipRoof(new Frame(tq[0], tq[1], T.rot), 0, 0, 1.6, 1.2, 1.6, 0.7, 'plain', '#b3261e', 0.25);
  // 祈願卡架
  const wq = T.p(9.5, 14);
  const WF = new Frame(wq[0], wq[1], T.rot + Math.PI / 2);
  WF.box('wood', 0, 0, 0, 3.2, 2.0, 0.12, '#6b4a2e', { col: true });
  for (let i = 0; i < 70; i++) WF.box('plain', rr(-1.5, 1.5), rr(0.4, 1.9), 0.1 * (chance(0.5) ? 1 : -1), 0.14, 0.2, 0.01, pick(['#d8322a', '#f2c14e', '#e0773a', '#f7e6c4']));
  // 老榕
  banyanTree(...T.p(-11, 20), { scale: 1.2, cards: 1600 });
  infoBoard(...T.p(6, 23), T.rot, { era: '相傳 1668 年建廟', title: '安平開台天后宮', en: 'Anping Kaitai Tianhou Temple', body: '相傳媽祖神像在 1661 年隨鄭成功的船隊來台。舊廟在日治時期被拆，1962 年在清代水師衙門舊址重建。三川殿為重簷歇山頂，鋪青綠琉璃瓦。', tag: '安平信仰中心' }, 22);
}

/* ---------- 億載金城（二鯤鯓砲台） ---------- */
function armstrong(F, lx, y, lz, ry, big) {
  const s = big ? 1 : 0.6; const G = new Frame(...F.p(lx, lz), F.rot + ry);
  G.box('wood', 0, y, 0, 1.6 * s, 0.7 * s, 3.2 * s, '#4a3424');
  for (const sd of [-1, 1]) G.cyl('plain', sd * 0.85 * s, y, 0.9 * s, 0.45 * s, 0.45 * s, 0.001, 3, '#2a2a2a');
  G.tube('plain', [0, y + 0.95 * s, -1.4 * s], [0, y + 1.0 * s, 3.4 * s], 0.42 * s, 0.24 * s, 12, '#262626');
  G.sph('plain', 0, y + 0.95 * s, -1.45 * s, 0.44 * s, 0.44 * s, 0.44 * s, '#262626');
}
function buildEternalFort() {
  const f = W.fort, F = new Frame(f.x, f.z, f.rot), H = 3.4, T = 9, h = f.half;
  const rampart = (lx, lz, sx, sz, ry) => { F.box('brick', lx, 0, lz, sx, H, sz, '#f0dccc', { col: true, noTop: true }, ry); F.box('grass', lx, H - 0.02, lz, sx, 0.04, sz, '#ffffff', { noSide: true, uv: 0.3 }, ry); };
  // 城牆（+x 面為城門）
  rampart(-h + T / 2, 0, T, 2 * h - 12, 0);
  rampart(0, h - T / 2, 2 * h - 12, T, 0);
  rampart(0, -h + T / 2, 2 * h - 12, T, 0);
  rampart(h - T / 2, -(h - 6 + 2.6) / 2 - 1.3, T, h - 6 - 2.6, 0);
  rampart(h - T / 2, (h - 6 + 2.6) / 2 + 1.3, T, h - 6 - 2.6, 0);
  // 四角稜堡
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) rampart(sx * (h - 1), sz * (h - 1), 14, 14, 0);
  // 雉堞
  for (let i = -18; i <= 18; i += 2.2) for (const [lx, lz] of [[i, h - 0.3], [i, -h + 0.3], [-h + 0.3, i]]) F.box('brick', lx, H, lz, 0.9, 0.7, 0.9, '#f0dccc');
  // 城門（拱門隧道）
  archBay(F, 'brick', h - 2, 0, 0, 10, 6.8, 4, 4.4, 12, '#f0dccc', Math.PI / 2);
  addCol(...F.p(h - 2, 3.5), 6, 1.5, 0, 6.8, F.rot); addCol(...F.p(h - 2, -3.5), 6, 1.5, 0, 6.8, F.rot);
  addCol(...F.p(h - 2, 0), 6, 2.0, 4.4, 6.8, F.rot);
  for (let i = -4; i <= 4; i++) F.box('brick', h + 4.2, 6.8, i * 1.1, 0.5, 0.6, 0.6, '#f0dccc');
  F.panel('boards', h + 4.02, 5.55, 0, 3.4, 1.1, ATLAS_BOARD.plaqueFortOut, '#ffffff', false, Math.PI / 2);
  F.panel('boards', h - 8.02, 5.55, 0, 3.4, 1.1, ATLAS_BOARD.plaqueFortIn, '#ffffff', false, -Math.PI / 2);
  // 登城階梯（內側）
  for (let i = 0; i < 12; i++) F.box('brick', -h + T + 0.25 + i * 0.5, 0, -12, 0.5, (12 - i) * H / 12, 3, '#e8d0bf', { col: true }, 0);
  for (let i = 0; i < 12; i++) F.box('brick', 12, 0, h - T - 0.25 - i * 0.5, 3, (12 - i) * H / 12, 0.5, '#e8d0bf', { col: true }, 0);
  // 護城河上的橋
  for (let lx = h + 7; lx < f.moatOut + 3; lx += 1) F.box('wash', lx + 0.5, -0.5, 0, 1.02, 0.8, 4.6, '#b8b2a4', { col: true });
  for (const sd of [-1, 1]) { F.box('wash', (h + 7 + f.moatOut + 3) / 2, 0.3, sd * 2.2, f.moatOut + 3 - h - 7, 0.9, 0.3, '#a8a396', { col: true }); }
  // 大砲
  for (const [sx, sz] of [[-1, 1], [-1, -1], [1, 1], [1, -1]]) { for (const o of [-2.5, 2.5]) armstrong(F, sx * (h - 1) + o * 0.5, H, sz * (h - 1) - o * 0.5 * sx * sz, Math.atan2(sx, sz), true); }
  for (const lz of [-14, 14]) armstrong(F, h - T / 2, H, lz, Math.PI / 2, false);
  for (const lx of [-12, 12]) armstrong(F, lx, H, -h + T / 2, Math.PI, false);
  // 沈葆楨像
  F.box('slab', 10, 0, 0, 2.2, 1.8, 2.2, '#bdb8ae', { col: true }); { const sp = F.p(10, 0); statue(sp[0], 1.8, sp[1], F.rot + Math.PI / 2, '#6e5a3a', { scroll: true }); }
  for (const [a, b] of [[-14, -14], [-14, 10], [6, -16]]) flameTree(...F.p(a, b), { scale: 0.9, cards: 1000 });
  // 通往運河的步道
  const p0 = F.p(f.moatOut + 3, 0);
  box('slab', (p0[0] + W.bridgeX) / 2, 0.02, (p0[1] + 70) / 2, 4, 0.05, Math.abs(p0[1] - 70) + 4, '#ffffff', 0, { noSide: true, uv: 0.35 });
  box('slab', (p0[0] + W.bridgeX) / 2, 0.021, p0[1], Math.abs(W.bridgeX - p0[0]) + 4, 0.05, 4, '#ffffff', 0, { noSide: true, uv: 0.35 });
  infoBoard(p0[0] + 3, p0[1] - 2, Math.PI * 0.75, { era: '1874–1876', title: '億載金城', en: 'Eternal Golden Castle', body: '牡丹社事件後，沈葆楨來台籌防，請法籍工程師設計的西式砲台，又稱二鯤鯓砲台。城門外題「億載金城」、內題「萬流砥柱」；部分城磚據說取自熱蘭遮城。', tag: '國定古蹟' }, 30);
}

/* ---------- 海岸：沙灘、防風林、觀夕平台、燈塔、蚵棚 ---------- */
function buildCoast() {
  for (let z = -210; z < 235; z += rr(5, 8)) { if (z > 30 && z < 72) continue; if (z > 96 && z < 124) continue; casuarina(W.beachX + rr(-1, 2.5), z, rr(0.9, 1.15)); if (chance(0.5)) casuarina(W.beachX + rr(3, 7), z + rr(-2, 2), rr(0.8, 1)); }
  // 觀夕平台（三角形木棧）
  const ax = -140, az = 110;
  for (let x = ax; x > -166; x -= 0.6) {
    const t = (ax - x) / 26, half = 11 * (1 - t);
    if (half < 0.4) break;
    box('wood', x - 0.3, 0.45, az, 0.62, 0.2, half * 2, '#b88a5a', 0, { uv: 1 });
    addCol(x - 0.3, az, 0.31, half, -2, 0.65);
  }
  for (let x = ax; x > -164; x -= 3) { const t = (ax - x) / 26; cyl('plain', x, -2, az + 11 * (1 - t), 0.12, 0.12, 2.5, 6, '#6a5040'); cyl('plain', x, -2, az - 11 * (1 - t), 0.12, 0.12, 2.5, 6, '#6a5040'); }
  for (const sd of [-1, 1]) {
    const a = V3(ax, 0.65, az + sd * 11), b = V3(-165.5, 0.65, az);
    const n = 14; for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); tube('plain', p, V3(p.x, 1.7, p.z), 0.04, 0.04, 5, '#8a6a4a'); if (i % 2 === 0) addHalo(p.x, 0.75, p.z, '#ffd9a0', 1.2); }
    tube('plain', V3(a.x, 1.7, a.z), V3(b.x, 1.7, b.z), 0.05, 0.05, 5, '#8a6a4a');
    const L = a.distanceTo(b), mid = a.clone().lerp(b, 0.5); addCol(mid.x, mid.z, L / 2, 0.12, 0.65, 1.8, Math.atan2(-(b.z - a.z), b.x - a.x));
  }
  box('wood', ax - 0.4, -1, az, 3, 1.65, 6, '#b88a5a', 0, { col: true }); box('wood', ax + 1.6, -0.5, az, 1, 0.94, 6, '#b88a5a', 0, { col: true }); box('wood', ax + 2.6, -0.5, az, 1, 0.72, 6, '#b88a5a', 0, { col: true }); box('wood', ax + 3.6, -0.5, az, 1, 0.5, 6, '#b88a5a', 0, { col: true });
  bench(-147, az - 3.5, -Math.PI / 2); bench(-147, az + 3.5, -Math.PI / 2);
  infoBoard(-138, az + 8, -Math.PI / 2, { era: '安平夕照', title: '觀夕平台', en: 'Sunset Platform', body: '面向台灣海峽的三角形木棧平台。清代「沙鯤漁火」列入台灣八景；一鯤鯓到七鯤鯓這串沙洲，就是安平與南方海岸的前身。', tag: '看夕陽的好地方' }, 26);
  // 港口導流堤與燈塔（北綠南紅）
  for (const [z, col] of [[37, '#2f8a5a'], [65, '#c0392b']]) {
    box('slab', -164, -2, z, 30, 2.8, 4, '#b9b3a8', 0, { col: true });
    for (let x = -151; x > -178; x -= 1.6) for (const sd of [-1, 1]) addGeo('plain', GEO.ico(), mat(x + rr(-.3, .3), 0.4, z + sd * 2.6, rr(0, 3), rr(0, 3), 0, 0.9, 0.7, 0.9), '#a9a49a');
    cyl('plain', -177, 0.8, z, 1.1, 1.3, 6.5, 12, col, { col: true }); for (let k = 0; k < 3; k++) cyl('plain', -177, 1.8 + k * 1.8, z, 1.16, 1.16, 0.4, 12, '#f4f4f0');
    cyl('lamp', -177, 7.3, z, 0.6, 0.6, 0.9, 10, col === '#2f8a5a' ? '#7fffb0' : '#ff7a6a'); addGeo('plain', GEO.cone(12), mat(-177, 8.6, z, 0, 0, 0, 0.9, 0.8, 0.9), col);
    addHalo(-177, 7.7, z, col === '#2f8a5a' ? '#7fffb0' : '#ff7a6a', 14);
  }
  // 蚵棚
  const rack = (x0, z0, nx, nz) => {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { const x = x0 - i * 3, z = z0 + j * 3; tube('plain', V3(x, -1.8, z), V3(x + rr(-.1, .1), 0.6, z + rr(-.1, .1)), 0.04, 0.035, 4, '#bfae72'); }
    for (let i = 0; i < nx; i++) tube('plain', V3(x0 - i * 3, 0.35, z0), V3(x0 - i * 3, 0.35, z0 + (nz - 1) * 3), 0.03, 0.03, 4, '#c9bb8a');
    for (let j = 0; j < nz; j++) tube('plain', V3(x0, 0.45, z0 + j * 3), V3(x0 - (nx - 1) * 3, 0.45, z0 + j * 3), 0.03, 0.03, 4, '#c9bb8a');
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz; j++) { for (let k = 0; k < 3; k++) tube('plain', V3(x0 - i * 3 - 0.7 - k * 0.8, 0.35, z0 + j * 3), V3(x0 - i * 3 - 0.7 - k * 0.8, -0.9, z0 + j * 3), 0.05, 0.03, 3, '#8a8578'); if (chance(0.3)) box('plain', x0 - i * 3 - 1.5, -0.55, z0 + j * 3 + 0.4, 0.6, 0.3, 0.4, '#f4f4f0'); }
  };
  rack(-184, 128, 10, 7); rack(-190, 160, 8, 6); rack(-184, -150, 10, 6); rack(-192, -110, 7, 6);
  for (const [x, z, s] of [[-141, 150, 1.4], [-139, 156, 1.0], [-141, -96, 1.2], [-138, -30, 0.9]]) addGeo('plain', GEO.cone(10), mat(x, 0.2 * s, z, 0, rr(0, 3), 0, 2.4 * s, 1.5 * s, 2.4 * s), '#d4cec4');
  infoBoard(-134, 146, -Math.PI / 2, { era: '養蚵原鄉', title: '蚵棚與蚵殼灰', en: 'Oyster Racks & Shell Lime', body: '安平被稱為養蚵原鄉，竹棚下吊著一串串蚵殼。蚵殼燒成蚵灰，是早年造船、蓋房子的材料，也是劍獅泥塑的原料之一。', tag: '' }, 20);
}

/* ---------- 住宅區、遠景 ---------- */
function buildNeighborhoods() {
  // A 路南側（老街北排的背後）面向北
  houseRow(-22, ROAD.B - 26, ROAD.A + 6.5, Math.PI, 8);
  // A 路北側、古堡東邊
  houseRow(-6, 82, ROAD.A - 6.5, 0, 10, {});
  box('asphalt', 45, 0.01, -80, 4, 0.02, 80, '#9a9b9d', 0, { noSide: true });
  box('asphalt', 42, 0.011, -76, 98, 0.02, 4, '#9a9b9d', 0, { noSide: true });
  houseRow(-6, 34, -80, 0, 10); houseRow(56, 82, -80, 0, 10);
  houseRow(-6, 43, -76, Math.PI, 9); houseRow(47, 82, -76, Math.PI, 9);
  houseColumn(-120, -82, 43, Math.PI / 2, 9); houseColumn(-120, -82, 47, -Math.PI / 2, 9);
  courtyardHouse(new Frame(22, -108, 0));
  // B 路東側
  houseColumn(-200, ROAD.A - 8, ROAD.B + 7.5, -Math.PI / 2, 11); houseColumn(ROAD.A + 8, ROAD.C - 6, ROAD.B + 7.5, -Math.PI / 2, 11);
  houseRow(ROAD.B + 20, 168, ROAD.A + 6.5, Math.PI, 10); houseRow(ROAD.B + 20, 168, ROAD.A - 6.5, 0, 10);
  houseRow(ROAD.B + 20, 168, ROAD.C - 6.5, 0, 10);
  // B 路西側（廣場北）
  houseColumn(-120, ROAD.A - 8, ROAD.B - 7.5, Math.PI / 2, 10);
  // 運河南岸東段、遠景大樓
  for (let i = 0; i < 70; i++) {
    const side = i % 3; let x, z;
    if (side === 0) { x = rr(-120, 260); z = rr(-215, -250); } else if (side === 1) { x = rr(175, 270); z = rr(-240, 240); } else { x = rr(90, 260); z = rr(200, 260); }
    const w = rr(8, 18), d = rr(8, 16), h = rr(9, 36), br = rr(-0.2, 0.2);
    box(chance(0.5) ? 'tile' : 'plaster', x, 0, z, w, h, d, Cv(pick(['#e9e4da', '#d9dde0', '#e6d8c8', '#cfd6cf']), 0.05), br);
    for (let y = 3; y < h - 2; y += 3.2) box('window', x, y, z, w + 0.05, 1.2, d + 0.05, pick(['#ffd9a0', '#ffe8c2', '#1a1a1a', '#fff2d8']), br, { noTop: true });
    if (chance(0.5)) waterTank(x, h, z, 'steel');
  }
  for (const [x, z] of [[120, 90], [150, 120], [100, 180], [160, 170], [-60, 110], [-90, 150], [-110, 200], [-40, 190]]) (chance(0.5) ? banyanTree : flameTree)(x, z, { scale: rr(0.9, 1.2), cards: 1000 });
  for (let i = 0; i < 16; i++) shrub(rr(-120, 160), rr(76, 225), rr(0.9, 1.4), pick(['#4f8a3a', '#5e9a44', '#3f7a33']));
  // 電線桿與電線（A、C 路）
  const pa = []; for (let x = ROAD.D + 8; x < 165; x += 24) pa.push([x, ROAD.A - 5.3]); streetWires(pa, 0, 0.6);
  const pc = []; for (let x = ROAD.D + 14; x < 165; x += 24) pc.push([x, ROAD.C + 5.3]); streetWires(pc, 0, 0.6);
  for (let x = ROAD.D + 20; x < 165; x += 24) { streetLamp(x, ROAD.A + 5.2, Math.PI, 'road'); streetLamp(x + 12, ROAD.C - 5.2, 0, 'road'); }
  for (let z = -200; z < 15; z += 26) streetLamp(ROAD.B - 6.3, z, Math.PI / 2, 'road');
  // 公車站
  const bs = new Frame(40, ROAD.C + 5.8, Math.PI);
  bs.box('plain', 0, 0.15, -0.8, 4.4, 0.08, 1.6, '#e9e6de'); bs.box('plain', 0, 2.6, -0.4, 4.6, 0.12, 2, '#2a6f97');
  bs.box('window', 0, 0.9, -1.5, 4.2, 1.6, 0.04, '#dff0f8'); for (const lx of [-2.1, 2.1]) bs.cyl('plain', lx, 0.15, -1.3, 0.05, 0.05, 2.45, 6, '#777', { col: true });
  const busr = ATLAS_SIGN.draw(256, 96, (g, w, h) => drawSignH(g, w, h, { name: '安平老街站', en: 'ANPING OLD ST. BUS', style: 'blue' }));
  bs.panel('signs', 0, 2.95, -0.2, 2.4, 0.9, busr);
  // 停字標誌、路名牌
  const stopR = ATLAS_BOARD.draw(96, 96, (g, w, h) => { g.fillStyle = '#d62828'; g.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; g.lineTo(48 + Math.cos(a) * 46, 48 + Math.sin(a) * 46); } g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.fillStyle = '#fff'; g.font = `900 48px ${FONT_SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('停', 48, 52); });
  cyl('plain', ROAD.D + 5.2, 0, ROAD.A - 5.2, 0.04, 0.04, 2.4, 6, '#888'); panel('boards', ROAD.D + 5.2, 2.2, ROAD.A - 5.14, 0.75, 0.75, 0, stopR);
  const roadName = (x, z, rot, t, en) => { const r = ATLAS_SIGN.draw(256, 64, (g, w, h) => drawSignH(g, w, h, { name: t, en, style: 'blue' })); cyl('plain', x, 0, z, 0.05, 0.05, 3.1, 6, '#888'); panel('signs', x, 3.0, z, 1.6, 0.4, rot, r, '#ffffff', true); };
  roadName(ROAD.B - 6.2, ROAD.A + 5.4, 0, '古堡街', 'Gubao St.'); roadName(ROAD.B + 6.2, ROAD.A - 6.2, Math.PI / 2, '安北路', 'Anbei Rd.');
  // 路邊停放的機車
  for (let x = ROAD.D + 12; x < 160; x += rr(4, 9)) { if (Math.abs(x - ROAD.B) < 12) continue; if (chance(0.55)) for (let i = 0; i < ri(2, 5); i++) scooterParked(x + i * 0.8, ROAD.A + 5.6, Math.PI + rr(-.1, .1)); x += 4; }
}
const SMOKE_SRC = [];
