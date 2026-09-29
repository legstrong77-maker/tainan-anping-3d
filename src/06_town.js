/* ================= 06 街區：地面、道路、老街商店、透天厝、運河岸、劍獅埕 ================= */
const W = {
  seaX: -150, beachX: -136, canalZ0: 40, canalZ1: 62,
  fort: { x: 12, z: 145, rot: Math.PI / 4, half: 26, moatIn: 40, moatOut: 48 },
  bridgeX: 46,
};
/* 地面高度（水域為 -3 表示落水） */
baseGround = function (x, z) {
  if (x < W.seaX) return -3;
  if (x < W.beachX) return lerp(-1.3, 0, (x - W.seaX) / (W.beachX - W.seaX));
  if (z > W.canalZ0 && z < W.canalZ1) return -3;
  const f = W.fort, dx = x - f.x, dz = z - f.z;
  const lx = dx * Math.cos(f.rot) - dz * Math.sin(f.rot), lz = dx * Math.sin(f.rot) + dz * Math.cos(f.rot);
  const m = Math.max(Math.abs(lx), Math.abs(lz));
  if (m > f.moatIn && m < f.moatOut) return -3;
  return 0;
};
class Frame {
  constructor(ox, oz, rot) { this.ox = ox; this.oz = oz; this.rot = rot || 0; this.co = Math.cos(this.rot); this.si = Math.sin(this.rot); }
  p(lx, lz) { return [this.ox + this.co * lx + this.si * lz, this.oz - this.si * lx + this.co * lz]; }
  v(lx, y, lz) { const q = this.p(lx, lz); return V3(q[0], y, q[1]); }
  a(lx, y, lz) { const q = this.p(lx, lz); return [q[0], y, q[1]]; }
  box(m, lx, y, lz, sx, sy, sz, col, o, ry) { const q = this.p(lx, lz); box(m, q[0], y, q[1], sx, sy, sz, col, this.rot + (ry || 0), o); }
  cyl(m, lx, y, lz, rt, rb, h, n, col, o) { const q = this.p(lx, lz); cyl(m, q[0], y, q[1], rt, rb, h, n, col, o); }
  sph(m, lx, y, lz, rx, ry, rz, col) { const q = this.p(lx, lz); sph(m, q[0], y, q[1], rx, ry, rz, col, true); }
  panel(m, lx, y, lz, w, h, r, col, dbl, ra) { const q = this.p(lx, lz); panel(m, q[0], y, q[1], w, h, this.rot + (ra || 0), r, col, dbl); }
  quad(m, a, b, c, d, col, dbl) { quad4(m, this.a(...a), this.a(...b), this.a(...c), this.a(...d), col, null, dbl); }
  tube(m, a, b, ra, rb, n, col) { tube(m, this.v(...a), this.v(...b), ra, rb, n, col); }
}
/* 多邊形地面（可挖洞），點為 [x,z] */
function groundShape(m, outer, holes, y, col, uvs) {
  const sh = new THREE.Shape(outer.map(p => new THREE.Vector2(p[0], -p[1])));
  for (const h of holes || []) sh.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], -p[1]))));
  const g = new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI / 2); g.translate(0, y || 0, 0);
  const ng = g.index ? g.toNonIndexed() : g; const p = ng.attributes.position; const b = B(m); const c = col3(col || '#ffffff'); const s = uvs || 1;
  for (let i = 0; i < p.count; i++) b.v([p.getX(i), p.getY(i), p.getZ(i)], [0, 1, 0], p.getX(i) * s, -p.getZ(i) * s, c);
}
function rotSquare(cx, cz, h, rot) { const co = Math.cos(rot), si = Math.sin(rot); return [[-h, -h], [h, -h], [h, h], [-h, h]].map(([lx, lz]) => [cx + co * lx + si * lz, cz - si * lx + co * lz]); }

/* ---------- 地面、道路 ---------- */
function buildGround() {
  const f = W.fort;
  // 運河北側陸地
  ground('asphalt', W.beachX, -400, 420, W.canalZ0, 0, '#bdb8b0');
  // 運河南側陸地（護城河挖洞）
  const outerSq = rotSquare(f.x, f.z, f.moatOut, f.rot), innerSq = rotSquare(f.x, f.z, f.moatIn, f.rot);
  groundShape('grass', [[W.beachX, W.canalZ1], [420, W.canalZ1], [420, 420], [W.beachX, 420]], [outerSq], 0, '#ffffff', 0.25);
  groundShape('grass', innerSq, [], 0, '#ffffff', 0.25);
  // 沙灘斜坡
  quad4('sand', [W.seaX, -1.3, 420], [W.beachX, 0, 420], [W.beachX, 0, -400], [W.seaX, -1.3, -400], '#ffffff', [0, 0, 14, 0, 14, 820, 0, 820]);
  // 運河與護城河岸壁
  box('slab', 140, -2.6, W.canalZ0 - 0.3, 580, 2.6, 0.6, '#9a948a');
  box('slab', 140, -2.6, W.canalZ1 + 0.3, 580, 2.6, 0.6, '#9a948a');
  for (const h of [f.moatIn, f.moatOut]) for (let k = 0; k < 4; k++) {
    const a = f.rot + k * Math.PI / 2, co = Math.cos(a), si = Math.sin(a);
    box('slab', f.x + si * h, -2.6, f.z + co * h, h * 2 + 1, 2.6, 0.6, '#9a948a', a);
  }
  // 道路
  const road = (x0, z0, x1, z1) => box('asphalt', (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.03, z1 - z0, '#8d8e90', 0, { noSide: true });
  road(ROAD.D - 4, ROAD.A - 4, 170, ROAD.A + 4);      // A
  road(ROAD.D - 4, ROAD.C - 4, 170, ROAD.C + 4);      // C
  road(ROAD.B - 5, -230, ROAD.B + 5, ROAD.C + 4);     // B
  road(ROAD.D - 4, ROAD.A - 4, ROAD.D + 4, ROAD.C + 4); // D
  // 人行道（高 0.15，導盲磚）
  const walk = (x0, z0, x1, z1, tx) => {
    box('sidewalk', (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.15, z1 - z0, '#ffffff', 0, { uv: 1 });
    addCol((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, -1, 0.15);
    if (tx === 'x') box('tactile', (x0 + x1) / 2, 0.151, (z0 + z1) / 2 + ((z1 - z0) > 0 ? 0 : 0), x1 - x0, 0.005, 0.3, '#ffffff', 0, { noSide: true, uv: 3.3 });
    if (tx === 'z') box('tactile', (x0 + x1) / 2, 0.151, (z0 + z1) / 2, 0.3, 0.005, z1 - z0, '#ffffff', 0, { noSide: true, uv: 3.3 });
  };
  walk(ROAD.D + 4, ROAD.A - 6.5, ROAD.B - 7.5, ROAD.A - 4, 'x'); walk(ROAD.B + 5, ROAD.A - 6.5, 170, ROAD.A - 4, 'x');
  walk(ROAD.D + 4, ROAD.A + 4, ROAD.B - 7.5, ROAD.A + 6.5, 'x'); walk(ROAD.B + 5, ROAD.A + 4, 170, ROAD.A + 6.5, 'x');
  walk(ROAD.D + 4, ROAD.C - 6.5, ROAD.B - 5, ROAD.C - 4, 'x'); walk(ROAD.D + 4, ROAD.C + 4, 170, ROAD.C + 6.5, 'x');
  walk(ROAD.B - 7.5, -230, ROAD.B - 5, ROAD.A - 6.5, 'z'); walk(ROAD.B - 7.5, ROAD.A + 6.5, ROAD.B - 5, ROAD.C - 6.5, 'z');
  walk(ROAD.B + 5, -230, ROAD.B + 7.5, ROAD.A - 6.5, 'z'); walk(ROAD.B + 5, ROAD.A + 6.5, ROAD.B + 7.5, ROAD.C - 4, 'z');
  // 標線
  const mk = (x, z, sx, sz, c) => box('markings', x, 0.035, z, sx, 0.01, sz, c || '#f4f2ea', 0, { noSide: true });
  for (let x = ROAD.D + 6; x < 168; x += 6) { if (Math.abs(x - ROAD.B) < 8) continue; mk(x, ROAD.A, 3, 0.15); mk(x, ROAD.C, 3, 0.15); }
  for (let z = -226; z < ROAD.C - 6; z += 6) { if (Math.abs(z - ROAD.A) < 7) continue; mk(ROAD.B, z, 0.15, 3); }
  for (let z = ROAD.A + 6; z < ROAD.C - 5; z += 6) mk(ROAD.D, z, 0.15, 3);
  mk(ROAD.B, -120, 0.15, 200, '#f2c230');
  // 斑馬線（跨 A 路，路口西側）＋停止線＋機車停等區
  for (let i = 0; i < 9; i++) mk(ROAD.B - 7.2, ROAD.A - 3.6 + i * 0.9, 3, 0.45);
  mk(ROAD.B - 12.7, ROAD.A + 2, 0.3, 4, '#ffffff');
  for (const z of [ROAD.A + 0.1, ROAD.A + 3.9]) mk(ROAD.B - 10.6, z, 3.6, 0.12, '#ffffff');
  mk(ROAD.B - 8.85, ROAD.A + 2, 0.12, 3.9, '#ffffff'); mk(ROAD.B - 12.4, ROAD.A + 2, 0.12, 3.9, '#ffffff');
  // 路口北側與東側斑馬線
  for (let i = 0; i < 11; i++) mk(ROAD.B - 4.5 + i * 0.9, ROAD.A - 6, 0.45, 3);
  // 水溝蓋
  for (let x = ROAD.D + 8; x < 165; x += 9) { box('plain', x, 0.16, ROAD.A + 4.4, 0.9, 0.01, 0.5, '#4d4d4f', 0, { noSide: true }); box('plain', x, 0.16, ROAD.C - 4.4, 0.9, 0.01, 0.5, '#4d4d4f', 0, { noSide: true }); }
}

/* ---------- 老街商店 ---------- */
const SHOP_LIST = [
  ['鯤鯓蜜餞行', 'KUNSHEN PRESERVED FRUIT', 'mijian', 'wood'], ['海風蝦餅', 'SEA BREEZE SHRIMP CHIPS', 'xiabing', 'red'],
  ['大灣豆花', 'TOFU PUDDING', 'douhua', 'cream'], ['港仔尾蚵嗲', 'OYSTER FRITTERS', 'kedie', 'red'],
  ['一鯤鯓蚵仔煎', 'OYSTER OMELETTE', 'kejian', 'white'], ['金城蝦捲', 'FRIED SHRIMP ROLLS', 'xiajuan', 'wood'],
  ['鳳凰木冰果室', 'FLAME TREE ICE HOUSE', 'ice', 'green'], ['古早味冬瓜茶', 'WINTER MELON TEA', 'tea', 'cream'],
  ['安瀾椪餅舖', 'PONG-BING BAKERY', 'bakery', 'wood'], ['囝仔宮柑仔店', 'OLD-TIME GROCERY', 'grocery', 'white'],
  ['轉轉陀螺童玩', 'RETRO TOYS', 'toys', 'blue'], ['劍獅工坊', 'SWORD LION CRAFTS', 'lion', 'black'],
  ['百草青草行', 'HERBAL TEA & HERBS', 'herb', 'green'], ['港邊打鐵漁具', 'BLACKSMITH & FISHING GEAR', 'iron', 'black'],
  ['福興香燭金紙', 'INCENSE & JOSS PAPER', 'joss', 'red'], ['夕照老屋咖啡', 'SUNSET HOUSE CAFE', 'cafe', 'cream'],
  ['運河單車出租', 'CANAL BIKE RENTAL', 'bike', 'teal'], ['明星理髮廳', 'BARBER SHOP', 'barber', 'white'],
  ['鯤鯓便利店', 'KUNSHEN MART 24H', 'mart', 'teal'], ['安心藥局', 'PHARMACY', 'pharmacy', 'green'],
  ['虱目魚粥', 'MILKFISH CONGEE', 'congee', 'white'], ['燈籠紙藝', 'LANTERNS & PAPER ART', 'lantern', 'red'],
  ['手工蛋捲', 'HANDMADE EGG ROLLS', 'eggroll', 'cream'], ['時光照相館', 'PHOTO STUDIO & POSTCARDS', 'photo', 'black'],
  ['掌中戲偶', 'GLOVE PUPPETS', 'puppet', 'red'], ['王城刻印', 'SEAL CARVING', 'seal', 'wood'],
  ['海產意麵', 'SEAFOOD NOODLES', 'noodle', 'white'], ['竹編斗笠行', 'BAMBOO HATS', 'hats', 'wood'],
];
const BANNER_WORDS = { mijian: '蜜餞', xiabing: '蝦餅', douhua: '豆花', kedie: '蚵嗲', kejian: '蚵仔煎', xiajuan: '蝦捲', ice: '冰', tea: '冬瓜茶', bakery: '椪餅', congee: '魚粥', noodle: '意麵', eggroll: '蛋捲', cafe: '咖啡', lion: '劍獅' };
const BARBER_POLES = [];
function phoneNo() { return '(06)2' + ri(100, 999) + '-' + ri(1000, 9999); }
function shopFacadeStyle(i) { return ['brick', 'wash', 'tile', 'wood', 'wash', 'brick', 'tile'][i % 7]; }
const WALLCOL = { brick: '#ffffff', wash: '#e9e4d6', tile: '#f1ede4', wood: '#ffffff', plaster: '#f4efe4' };
function wallMat(st) { return st === 'brick' ? 'brick' : st === 'wash' ? 'wash' : st === 'tile' ? 'tile' : st === 'wood' ? 'wood' : 'plaster'; }

function awning(F, w, y0, depth, cols) {
  const n = Math.max(4, Math.round(w / 0.45)), y1 = y0 - 0.55;
  for (let i = 0; i < n; i++) {
    const a = -w / 2 + i * w / n, b = a + w / n, c = cols[i % 2];
    F.quad('plain', [a, y1, depth], [b, y1, depth], [b, y0, 0.05], [a, y0, 0.05], c, true);
  }
  for (let i = 0; i < n * 2; i++) {
    const lx = -w / 2 + (i + 0.5) * w / (n * 2); const q = F.p(lx, depth + 0.005);
    addGeo('plainDS', GEO.halfDisc(), mat(q[0], y1, q[1], 0, F.rot, Math.PI, w / (n * 4) * 1.02, w / (n * 4) * 0.9, 1), cols[Math.floor(i / 2) % 2]);
  }
  F.tube('plain', [-w / 2, y1, depth], [w / 2, y1, depth], 0.02, 0.02, 4, '#6a6a6a');
}
function ironGrille(F, lx, y, w, h, d) {
  const c = '#e8e6df', s = 1 / 0.56, u = w * s, v = h * s, e = d * s;
  F.box('plain', lx, y - 0.04, d / 2 + 0.02, w + 0.1, 0.05, d, c);
  F.box('plain', lx, y + h, d / 2 + 0.02, w + 0.1, 0.05, d, c);
  quad4('grille', F.a(lx - w / 2, y, d), F.a(lx + w / 2, y, d), F.a(lx + w / 2, y + h, d), F.a(lx - w / 2, y + h, d), c, [0, 0, u, 0, u, v, 0, v]);
  quad4('grille', F.a(lx - w / 2, y, 0), F.a(lx - w / 2, y, d), F.a(lx - w / 2, y + h, d), F.a(lx - w / 2, y + h, 0), c, [0, 0, e, 0, e, v, 0, v]);
  quad4('grille', F.a(lx + w / 2, y, d), F.a(lx + w / 2, y, 0), F.a(lx + w / 2, y + h, 0), F.a(lx + w / 2, y + h, d), c, [0, 0, e, 0, e, v, 0, v]);
}
function windowUnit(F, lx, y, w, h, style, frameCol) {
  F.box('window', lx, y, 0.02, w, h, 0.05, pick(['#ffd9a0', '#ffe8c2', '#fff2d8', '#1a1a1a', '#ffcf8a']));
  const fc = frameCol || '#e8e2d4';
  F.box('plain', lx, y - 0.08, 0.06, w + 0.2, 0.08, 0.14, fc); F.box('plain', lx, y + h, 0.05, w + 0.12, 0.07, 0.1, fc);
  F.box('plain', lx - w / 2 - 0.04, y, 0.05, 0.07, h, 0.1, fc); F.box('plain', lx + w / 2 + 0.04, y, 0.05, 0.07, h, 0.1, fc);
  F.box('plain', lx, y, 0.06, 0.04, h, 0.04, fc);
  if (style === 'arch') { const q = F.p(lx, 0.06); addGeo('plain', GEO.halfDisc(), mat(q[0], y + h + 0.02, q[1], 0, F.rot, 0, w / 2 + 0.08, w / 2 * 0.7, 1), '#d9d2c2'); }
  if (style === 'shutter') { F.box('wood', lx - w / 2 - 0.3, y, 0.07, 0.5, h, 0.04, '#6b8a74'); F.box('wood', lx + w / 2 + 0.3, y, 0.07, 0.5, h, 0.04, '#6b8a74'); }
}
function laundry(F, lx, y, lz, w) {
  F.tube('plain', [lx - w / 2, y, lz], [lx + w / 2, y, lz], 0.015, 0.015, 4, '#c9a24a');
  const n = ri(3, 6);
  for (let i = 0; i < n; i++) { const x = lx - w / 2 + (i + 0.5) * w / n; F.box('plainDS', x, y - rr(0.45, 0.7), lz, rr(0.3, 0.45), rr(0.4, 0.65), 0.02, pick(['#ffffff', '#e7a6b7', '#7fb3d5', '#f2d06b', '#9bc58a', '#e76f51', '#dfe7ef'])); }
}
function lionPlaque(F, lx, y, lz, s, r) {
  const rr0 = r || (chance(0.5) ? ATLAS_BOARD.lionL : ATLAS_BOARD.lionR);
  F.cyl('plain', lx, y - s / 2, lz - 0.02, s / 2 + 0.04, s / 2 + 0.04, 0.04, 16, '#6e2a1c');
  F.panel('boards', lx, y, lz + 0.03, s, s, rr0, '#ffffff');
}

/* 店內擺設與門口陳列 */
function shopGoods(F, w, type) {
  const inD = -5.2;
  // 左右層架
  for (const sd of [-1, 1]) {
    const x = sd * (w / 2 - 0.55);
    F.box('wood', x, 0, (inD - 1.3) / 2, 0.6, 2.2, -inD - 1.5, '#8a6a4a');
    for (let k = 0; k < 4; k++) for (let j = 0; j < 5; j++) F.box('plain', x - sd * 0.05, 0.35 + k * 0.48, -1.6 - j * 0.72, 0.45, rr(0.18, 0.32), 0.5, Cv(pick(GOOD_COLS[type] || GOOD_COLS.def), 0.12));
  }
  F.box('wood', 0, 0, inD + 0.6, w * 0.5, 0.95, 0.6, '#9b7a55');
  F.box('plain', 0, 0.95, inD + 0.6, w * 0.52, 0.04, 0.64, '#e9e2d2');
  if (type === 'cafe') { for (const sd of [-1, 1]) { foldTableF(F, sd * 0.9, -3, '#6e4a2e'); } }
  // 門口
  const fz = 0.9;
  switch (type) {
    case 'mijian':
      F.box('wood', 0, 0, fz, w * 0.7, 0.75, 1.1, '#7a5230');
      for (let i = 0; i < 3; i++) for (let j = 0; j < 7; j++) { const x = -w * 0.3 + j * w * 0.1; F.cyl('plain', x, 0.75 + i * 0.0, fz - 0.35 + i * 0.35, 0.13, 0.13, 0.32, 10, Cv(pick(['#b33a2a', '#e0a32e', '#6e8a2e', '#7a2a4a', '#d96b3a', '#f2d06b']), 0.1)); F.cyl('plain', x, 1.07, fz - 0.35 + i * 0.35, 0.14, 0.14, 0.04, 10, '#d8d2c4'); }
      break;
    case 'xiabing': case 'eggroll': case 'bakery':
      F.box('wood', 0, 0, fz, w * 0.7, 0.8, 1.0, '#8a6038');
      for (let i = 0; i < 18; i++) F.box('plain', rr(-w * 0.32, w * 0.32), 0.8, fz + rr(-0.4, 0.4), 0.28, rr(0.25, 0.45), 0.12, Cv(type === 'xiabing' ? pick(['#f3b0a0', '#f7d6c8', '#f0e0d0']) : pick(['#e8c27a', '#d9a55a', '#f2e0b0']), 0.08));
      break;
    case 'douhua': case 'ice': case 'tea': case 'congee': case 'noodle':
      F.box('plain', w * 0.25, 0, fz - 0.2, 1.4, 0.9, 0.7, '#dfe4e6');
      for (let i = 0; i < 3; i++) F.cyl('plain', w * 0.25 - 0.45 + i * 0.45, 0.9, fz - 0.2, 0.18, 0.16, 0.34, 12, '#c9ccd0');
      stoolF(F, -w * 0.2, fz + 0.9); stoolF(F, -w * 0.2 + 0.6, fz + 1.2); foldTableF(F, -w * 0.2 + 0.3, fz + 0.5, '#f0ebe0');
      break;
    case 'kedie': case 'kejian': case 'xiajuan':
      F.box('plain', 0, 0, fz, 1.8, 0.9, 0.8, '#c9ccd0');
      F.cyl('plain', -0.4, 0.9, fz, 0.35, 0.28, 0.2, 14, '#3a3a3a'); F.box('plain', 0.45, 0.9, fz, 0.7, 0.05, 0.6, '#4a4a4a');
      F.box('window', 0, 0.95, fz - 0.3, 1.6, 0.5, 0.05, '#ffe7b0');
      break;
    case 'toys':
      for (let i = 0; i < 3; i++) { F.box('plain', -w * 0.25 + i * w * 0.25, 0, fz, 0.9, 1.4, 0.4, '#b5895a'); for (let j = 0; j < 6; j++) F.sph('plain', -w * 0.25 + i * w * 0.25 + rr(-.3, .3), 1.45 + rr(0, .3), fz, 0.09, 0.09, 0.09, Cv(pick(['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#457b9d']), 0.1)); }
      break;
    case 'lion':
      F.box('wood', 0, 0, fz - 0.2, w * 0.6, 1.5, 0.12, '#5a3a22');
      for (let i = 0; i < 6; i++) lionPlaque(F, -w * 0.22 + (i % 3) * w * 0.22, 0.55 + Math.floor(i / 3) * 0.55, fz - 0.12, 0.42);
      break;
    case 'bike':
      for (let i = 0; i < 4; i++) { const x = -w * 0.35 + i * w * 0.23; F.tube('plain', [x, 0.33, fz - 0.5], [x, 0.33, fz + 0.5], 0.33, 0.33, 12, '#1d1d1d'); F.box('plain', x, 0.4, fz, 0.05, 0.5, 0.9, pick(['#2a7f9e', '#d9482e', '#e0b23a'])); }
      break;
    case 'barber': {
      const q = F.p(w / 2 - 0.45, 0.35);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.9, 16, 1, true), BARBER_MAT());
      pole.position.set(q[0], 2.2, q[1]); scene.add(pole); BARBER_POLES.push(pole);
      F.sph('plain', w / 2 - 0.45, 2.7, 0.35, 0.13, 0.13, 0.13, '#f2f2f2'); F.cyl('plain', w / 2 - 0.45, 1.6, 0.35, 0.13, 0.13, 0.15, 10, '#dcdcdc');
      break;
    }
    case 'joss': case 'lantern':
      for (let i = 0; i < 5; i++) lantern(F.p(-w * 0.35 + i * w * 0.175, 1.1)[0], 2.55, F.p(-w * 0.35 + i * w * 0.175, 1.1)[1], i % 2 ? '#d8322a' : '#f2c14e', 0.8);
      F.box('plain', 0, 0, fz, w * 0.6, 0.8, 0.8, '#b3261e');
      break;
    case 'herb': case 'tea2':
      for (let i = 0; i < 6; i++) F.cyl('plain', -w * 0.3 + i * w * 0.12, 0, fz, 0.22, 0.2, 0.5, 10, pick(['#8a7a4a', '#6e8a3a', '#a08050']));
      break;
    case 'hats':
      for (let i = 0; i < 8; i++) { const q = F.p(-w * 0.35 + (i % 4) * w * 0.23, 0.08); addGeo('plain', GEO.cone(12), mat(q[0], 1.2 + Math.floor(i / 4) * 0.7, q[1], Math.PI / 2, F.rot, 0, 0.3, 0.12, 0.3), '#d9c28a'); }
      break;
    default:
      F.box('plain', 0, 0, fz, w * 0.5, 0.8, 0.6, '#c9b48a');
  }
}
const GOOD_COLS = {
  def: ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653', '#f1faee'], mijian: ['#b33a2a', '#e0a32e', '#6e8a2e', '#7a2a4a'], xiabing: ['#f3b0a0', '#f7d6c8', '#f0e0d0'],
  mart: ['#e63946', '#1d3557', '#f1faee', '#ffb703', '#8ecae6', '#219ebc'], pharmacy: ['#ffffff', '#a8dadc', '#457b9d', '#f1faee'], herb: ['#6e8a3a', '#8a7a4a', '#a08050', '#c9b48a'],
  joss: ['#d8322a', '#f2c14e', '#e0a32e'], lion: ['#c8372d', '#e2b33f', '#2f7d4f'], cafe: ['#6e4a2e', '#c9a27a', '#e9e2d2'],
};
let _barberMat = null;
function BARBER_MAT() {
  if (_barberMat) return _barberMat;
  const c = mkCanvas(64, 128), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 64, 128);
  g.lineWidth = 14; for (let i = -4; i < 8; i++) { g.strokeStyle = i % 2 ? '#d62828' : '#1d3f8a'; g.beginPath(); g.moveTo(0, i * 22); g.lineTo(64, i * 22 + 40); g.stroke(); }
  const t = mkTex(c); _barberMat = new THREE.MeshLambertMaterial({ map: t, emissive: C('#222'), side: THREE.DoubleSide }); return _barberMat;
}
function stoolF(F, lx, lz) { const q = F.p(lx, lz); stool(q[0], q[1], pick(['#d8352a', '#2a6fb3', '#e0b23a'])); }
function foldTableF(F, lx, lz, c) { const q = F.p(lx, lz); foldTable(q[0], q[1], F.rot, c); }

function buildShop(F, w, D, idx, spec) {
  const st = shopFacadeStyle(idx), wm = wallMat(st), wc = WALLCOL[st];
  const floors = st === 'brick' ? (idx % 3 === 0 ? 1 : 2) : st === 'tile' ? 3 : 2;
  const GF = 3.4, UF = 3.0, H = GF + (floors - 1) * UF;
  const hw = w / 2;
  // 側牆（與鄰居共用）、背牆
  F.box(wm, -hw + 0.15, 0, -D / 2, 0.3, H, D, wc, { col: true });
  F.box(wm, hw - 0.15, 0, -D / 2, 0.3, H, D, wc, { col: true });
  F.box(wm, 0, 0, -D + 0.15, w, H, 0.3, wc, { col: true });
  // 一樓：柱、樑、內凹店面
  F.box(wm, -hw + 0.4, 0, -0.35, 0.8, GF, 0.7, wc, { col: true }); F.box(wm, hw - 0.4, 0, -0.35, 0.8, GF, 0.7, wc, { col: true });
  F.box(wm, 0, GF - 0.45, -0.35, w, 0.45, 0.7, wc);
  F.box('wood', 0, 0, -2.65, w - 0.6, 0.06, 5.3, '#b89a72', { noSide: true });
  F.box('plaster', 0, GF - 0.5, -3.2, w - 0.6, 0.08, 4.2, '#f2eee6', { bottom: true, noTop: false });
  F.box('lamp', 0, GF - 0.54, -3.0, Math.min(1.6, w * 0.4), 0.04, 0.3, '#fff4d6');
  F.box('plaster', 0, 0, -5.35, w - 0.6, GF - 0.5, 0.1, '#efe6d6', { col: true });
  shopGoods(F, w, spec[2]);
  // 上層立面
  if (floors > 1) {
    F.box(wm, 0, GF, -0.15, w, H - GF, 0.3, wc);
    for (let f = 1; f < floors; f++) {
      const y = GF + (f - 1) * UF;
      F.box('plain', 0, y - 0.05, 0.02, w + 0.1, 0.18, 0.28, st === 'brick' ? '#d9cbb5' : '#d8d2c4');
      const nwin = w > 5 ? 2 : 1;
      for (let k = 0; k < nwin; k++) {
        const lx = nwin === 1 ? 0 : (k === 0 ? -w * 0.24 : w * 0.24), ww = nwin === 1 ? w * 0.45 : w * 0.3;
        windowUnit(F, lx, y + 0.9, ww, 1.45, st === 'wash' ? 'arch' : st === 'wood' ? 'shutter' : null);
        if (st === 'tile' || (st === 'brick' && chance(0.4))) ironGrille(F, lx, y + 0.85, ww + 0.1, 1.55, 0.26);
      }
      if (chance(0.7)) { const q = F.p(w * 0.3 * (chance(0.5) ? 1 : -1), 0.3); acUnit(q[0], y + 0.35, q[1], F.rot); }
      if (f === 1 && chance(0.45)) { // 陽台
        F.box('plain', 0, y + 0.05, 0.55, w - 0.3, 0.12, 1.1, '#d8d2c4');
        railing('plain', ...F.p(-w / 2 + 0.2, 1.05), ...F.p(w / 2 - 0.2, 1.05), y + 0.17, 0.95, '#e8e6df', 0.5);
        if (chance(0.7)) laundry(F, 0, y + 2.3, 0.9, w * 0.7);
        pottedPlant(...F.p(-w / 2 + 0.6, 0.8).slice(0, 1), y + 0.17, F.p(-w / 2 + 0.6, 0.8)[1], 0.9);
      }
    }
  }
  // 屋頂
  if (st === 'wash') {
    F.box(wm, 0, H, -0.15, w, 0.9, 0.3, wc);
    const q = F.p(0, -0.05); addGeo('wash', GEO.halfDisc(), mat(q[0], H + 0.9, q[1], 0, F.rot, 0, w * 0.32, w * 0.22, 1), wc);
    F.box('plain', 0, H + 0.95, 0.02, w * 0.3, 0.35, 0.05, '#cfc6b4');
    for (const sd of [-1, 1]) F.box('wash', sd * (hw - 0.25), H, 0, 0.5, 1.4, 0.4, wc);
    F.box('plain', 0, H - 0.05, -D / 2, w - 0.4, 0.1, D - 0.6, '#b9b2a6', { noSide: true });
  } else if (st === 'brick' || st === 'wood') {
    const rise = 1.6, ov = 0.5;
    F.quad('roof', [-hw - 0.05, H, 0.45], [hw + 0.05, H, 0.45], [hw + 0.05, H + rise, -D / 2], [-hw - 0.05, H + rise, -D / 2], '#ffffff', true);
    F.quad('roof', [hw + 0.05, H, -D - 0.2], [-hw - 0.05, H, -D - 0.2], [-hw - 0.05, H + rise, -D / 2], [hw + 0.05, H + rise, -D / 2], '#ffffff', true);
    F.box('plain', 0, H + rise - 0.05, -D / 2, w + 0.1, 0.22, 0.3, '#a8452f');
    F.quad(wm, [-hw + 0.02, H, 0], [-hw + 0.02, H, -D], [-hw + 0.02, H + rise, -D / 2], [-hw + 0.02, H + rise, -D / 2], wc, true);
    F.quad(wm, [hw - 0.02, H, -D], [hw - 0.02, H, 0], [hw - 0.02, H + rise, -D / 2], [hw - 0.02, H + rise, -D / 2], wc, true);
  } else {
    F.box('tile', 0, H, -0.15, w, 0.8, 0.3, wc);
    F.box('corr', 0, H, -D * 0.6, w - 0.6, 2.4, D * 0.6, pick(['#6f95b8', '#7aa37a', '#d9d6cf', '#b8b0a0']), { uv: 1 });
    waterTank(...F.p(w * 0.2, -D * 0.25).slice(0, 1), H, F.p(w * 0.2, -D * 0.25)[1], pick(['steel', 'blue', 'white']));
  }
  if (chance(0.6)) antenna(...F.p(-w * 0.25, -D * 0.4).slice(0, 1), H + (st === 'brick' ? 1.2 : 0.8), F.p(-w * 0.25, -D * 0.4)[1]);
  // 雨棚、招牌
  const awc = pick([['#c0392b', '#f4efe6'], ['#2a6f97', '#f4efe6'], ['#2f7d4f', '#f4efe6'], ['#e0a32e', '#7a3a1a'], ['#b3261e', '#f2c14e']]);
  awning(F, w - 0.2, GF - 0.05, 1.5, awc);
  const signStyle = spec[3];
  const sr = ATLAS_SIGN.draw(448, 112, (g, sw, sh) => drawSignH(g, sw, sh, { name: spec[0], en: spec[1], tel: phoneNo(), style: signStyle }));
  if (floors > 1) { F.box('plain', 0, GF + 0.45 - w * 0.86 / 8 - 0.04, 0.09, w * 0.88, w * 0.86 / 4 + 0.08, 0.16, '#3a2a20'); F.panel('signs', 0, GF + 0.45, 0.18, w * 0.86, w * 0.86 / 4, sr); }
  else F.panel('signs', 0, GF + 0.35, 0.02, w * 0.9, w * 0.9 / 4, sr);
  if (floors > 1) {
    const vr = ATLAS_SIGN.draw(80, 320, (g, sw, sh) => drawSignV(g, sw, sh, { name: spec[0].slice(0, 5), style: signStyle === 'white' ? 'red' : signStyle }));
    const vh = Math.min(H - GF - 0.4, 2.6);
    F.box('plain', hw - 0.25, GF + 0.6 + vh / 2, 0.5, 0.04, 0.04, 0.8, '#555');
    F.panel('signs', hw - 0.25, GF + 0.6 + vh / 2, 0.9, 0.62, vh, vr, '#ffffff', true, Math.PI / 2);
  }
  const bw = BANNER_WORDS[spec[2]];
  if (bw) {
    const br = ATLAS_SIGN.draw(56, 224, (g, sw, sh) => drawBanner(g, sw, sh, { text: bw, bg: pick(['#c0392b', '#e0a32e', '#2a6f97', '#b3261e']), fg: '#fff6e0' }));
    for (const sd of [-1, 1]) { F.tube('plain', [sd * (hw - 0.1), 0, 1.7], [sd * (hw - 0.1), 2.5, 1.7], 0.02, 0.02, 4, '#777'); F.panel('signs', sd * (hw - 0.1) - sd * 0.26, 1.75, 1.7, 0.45, 1.6, br, '#ffffff', true, Math.PI / 2); }
  }
  if (st === 'brick' || chance(0.25)) lionPlaque(F, 0, floors > 1 ? GF + 2.62 : GF + 0.4, 0.2, 0.55);
}

/* ---------- 透天厝 ---------- */
function buildHouse(F, w, D, floors, o) {
  o = o || {};
  const st = o.style || pick(['tile', 'tile', 'plaster', 'wash']), wm = wallMat(st);
  const wc = st === 'tile' ? pick(['#f1ede4', '#e6d3c0', '#d7e2d6', '#e9dfc8', '#c9a58a']) : pick(['#f4efe4', '#efe3cf', '#e2e8ea', '#f0dcd0']);
  const GF = 3.3, UF = 3.0, H = GF + (floors - 1) * UF, hw = w / 2;
  F.box(wm, 0, 0, -D / 2, w - 0.02, H, D, wc, { col: true });
  // 一樓：鐵捲門或店面
  if (chance(0.55)) { F.box('roller', 0, 0, 0.02, w - 1.0, GF - 0.4, 0.06, '#d9dde0'); }
  else { F.box('window', -w * 0.15, 0.2, 0.02, w * 0.45, 2.3, 0.05, '#ffe2b0'); F.box('wood', w * 0.28, 0, 0.02, 0.95, 2.2, 0.06, pick(['#6e4a2e', '#8a8f94'])); }
  if (o.lion || chance(0.3)) lionPlaque(F, 0, GF - 0.35, 0.05, 0.42);
  for (let f = 1; f < floors; f++) {
    const y = GF + (f - 1) * UF;
    F.box('plain', 0, y - 0.05, 0.05, w + 0.06, 0.15, 0.2, '#cfc8ba');
    windowUnit(F, 0, y + 0.9, w * 0.55, 1.4, null);
    ironGrille(F, 0, y + 0.85, w * 0.6, 1.5, 0.3);
    if (chance(0.65)) acUnit(...F.p(w * 0.36, 0.3).slice(0, 1), y + 0.3, F.p(w * 0.36, 0.3)[1], F.rot);
    if (f === 1 && chance(0.5)) { F.box('plain', 0, y + 0.02, 0.5, w - 0.2, 0.1, 1.0, '#d0cabd'); railing('plain', ...F.p(-hw + 0.15, 0.98), ...F.p(hw - 0.15, 0.98), y + 0.12, 0.9, '#e8e6df', 0.45); if (chance(0.6)) laundry(F, 0, y + 2.2, 0.85, w * 0.7); }
  }
  F.box(wm, 0, H, 0, w, 0.7, 0.2, wc);
  if (chance(0.7)) F.box('corr', 0, H, -D * 0.55, w - 0.4, 2.3, D * 0.7, pick(['#6f95b8', '#7aa37a', '#d9d6cf', '#c46a4a']), {});
  if (chance(0.8)) waterTank(...F.p(-w * 0.2, -D * 0.2).slice(0, 1), H, F.p(-w * 0.2, -D * 0.2)[1], pick(['steel', 'blue', 'white']));
  if (chance(0.5)) antenna(...F.p(w * 0.2, -D * 0.5).slice(0, 1), H + 2.3, F.p(w * 0.2, -D * 0.5)[1]);
  if (o.scooters !== false && chance(0.6)) for (let i = 0; i < ri(1, 3); i++) { const q = F.p(-hw + 0.8 + i * 1.0, 1.4); scooterParked(q[0], q[1], F.rot + Math.PI / 2 + rr(-.1, .1)); }
  if (o.sign) { const r = ATLAS_SIGN.draw(384, 96, (g, sw, sh) => drawSignH(g, sw, sh, o.sign)); F.panel('signs', 0, GF - 0.2, 0.1, w * 0.85, w * 0.85 / 4, r); }
}
/* 一排房子 */
function houseRow(x0, x1, zFace, facing, D, o) {
  let x = x0; const rot = facing;
  while (x < x1 - 3.5) {
    const w = Math.min(rr(4.2, 5.6), x1 - x);
    const cx = x + w / 2;
    const F = new Frame(cx, zFace, rot);
    buildHouse(F, w, D, ri(3, 4), o);
    x += w;
  }
}
function houseColumn(z0, z1, xFace, facing, D, o) {
  let z = z0;
  while (z < z1 - 3.5) { const w = Math.min(rr(4.2, 5.6), z1 - z); const F = new Frame(xFace, z + w / 2, facing); buildHouse(F, w, D, ri(3, 5), o); z += w; }
}

/* ---------- 閩南紅磚古厝（燕尾脊） ---------- */
function swallowRidge(F, lx0, lx1, y, lz, col) {
  F.box('plain', (lx0 + lx1) / 2, y, lz, lx1 - lx0, 0.3, 0.35, col || '#a8452f');
  for (const [x, d] of [[lx0, -1], [lx1, 1]]) {
    F.tube('plain', [x, y + 0.15, lz], [x + d * 0.7, y + 0.45, lz], 0.13, 0.1, 6, col || '#a8452f');
    F.tube('plain', [x + d * 0.7, y + 0.45, lz], [x + d * 1.15, y + 1.0, lz], 0.1, 0.05, 6, col || '#a8452f');
  }
}
function hipRoof(F, lx, lz, w, d, y, rise, m, col, ov) {
  ov = ov || 0.5; const hw = w / 2 + ov, hd = d / 2 + ov;
  F.quad(m, [lx - hw, y, lz + hd], [lx + hw, y, lz + hd], [lx + hw * 0.55, y + rise, lz], [lx - hw * 0.55, y + rise, lz], col, true);
  F.quad(m, [lx + hw, y, lz - hd], [lx - hw, y, lz - hd], [lx - hw * 0.55, y + rise, lz], [lx + hw * 0.55, y + rise, lz], col, true);
  F.quad(m, [lx + hw, y, lz + hd], [lx + hw, y, lz - hd], [lx + hw * 0.55, y + rise, lz], [lx + hw * 0.55, y + rise, lz], col, true);
  F.quad(m, [lx - hw, y, lz - hd], [lx - hw, y, lz + hd], [lx - hw * 0.55, y + rise, lz], [lx - hw * 0.55, y + rise, lz], col, true);
}
function gable(F, lx, lz, w, d, y, rise, m, col, ov) {
  ov = ov || 0.4; const hw = w / 2 + ov, hd = d / 2 + ov;
  F.quad(m, [lx - hw, y, lz + hd], [lx + hw, y, lz + hd], [lx + hw, y + rise, lz], [lx - hw, y + rise, lz], col, true);
  F.quad(m, [lx + hw, y, lz - hd], [lx - hw, y, lz - hd], [lx - hw, y + rise, lz], [lx + hw, y + rise, lz], col, true);
}
function courtyardHouse(F) {
  // 正身
  F.box('brick', 0, 0, -3, 13, 3.8, 6, '#ffffff', { col: true });
  gable(F, 0, -3, 13, 6, 3.8, 2.0, 'roof', '#ffffff');
  for (const sx of [-1, 1]) F.quad('brick', [sx * 6.5, 3.8, sx > 0 ? -6 : 0], [sx * 6.5, 3.8, sx > 0 ? 0 : -6], [sx * 6.5, 5.8, -3], [sx * 6.5, 5.8, -3], '#ffffff', true);
  swallowRidge(F, -6.9, 6.9, 5.7, -3);
  F.box('wood', 0, 0, 0.02, 1.8, 2.6, 0.08, '#8a2a1e'); F.box('plain', 0, 2.6, 0.03, 2.3, 0.3, 0.1, '#2a1a12');
  for (const sx of [-1, 1]) F.box('window', sx * 3.6, 1.0, 0.02, 1.2, 1.3, 0.06, '#ffd9a0');
  lionPlaque(F, 0, 3.25, 0.08, 0.55);
  // 護龍
  for (const sx of [-1, 1]) {
    F.box('brick', sx * 8.2, 0, 3.5, 4, 3.2, 10, '#ffffff', { col: true });
    const G = new Frame(...F.p(sx * 8.2, 3.5), F.rot + Math.PI / 2);
    gable(G, 0, 0, 10, 4, 3.2, 1.4, 'roof', '#ffffff');
    F.box('window', sx * 6.18, 1.0, 3.5, 0.06, 1.2, 1.0, '#ffd9a0');
  }
  // 紅磚埕
  F.box('brickpave', 0, 0, 4.5, 12, 0.05, 9, '#ffffff', { noSide: true, uv: 0.5 });
}

/* ---------- 電線桿、電線、路燈、燈籠 ---------- */
function streetWires(pts, rot, sag) {
  const poles = pts.map(([x, z]) => utilityPole(x, z, rot));
  for (let i = 1; i < poles.length; i++) for (let k = 0; k < poles[i].length; k++) wire(poles[i - 1][k], poles[i][k], sag || 0.5);
  return poles;
}

/* ---------- 老街 ---------- */
function buildOldStreet() {
  const x0 = -22, x1 = 68;
  ground('slab', x0 - 2, -3, x1 + 2, 3, 0.02, '#ffffff', { uv: 0.35 });
  box('brickpave', (x0 + x1) / 2, 0.02, 0, x1 - x0, 0.01, 0.5, '#ffffff', 0, { noSide: true, uv: 0.5 });
  let li = 0;
  for (const side of ['N', 'S']) {
    let x = x0;
    while (x < x1 - 4) {
      const w = Math.min(rr(4.6, 6.2), x1 - x); const spec = SHOP_LIST[li % SHOP_LIST.length];
      const F = side === 'N' ? new Frame(x + w / 2, -3, 0) : new Frame(x + w / 2, 3, Math.PI);
      if (li < SHOP_LIST.length) buildShop(F, w, 10, li, spec); else buildHouse(F, w, 10, 2, { scooters: false, lion: true });
      li++; x += w;
    }
  }
  // 燈籠串、仿古路燈、電線
  for (let x = x0 + 4; x < x1; x += 9) lanternString(V3(x, 6.2, -3.2), V3(x + 2, 6.2, 3.2), 5, 0.5);
  for (let x = x0 + 8; x < x1; x += 16) { streetLamp(x, -2.4, 0, 'old'); streetLamp(x + 8, 2.4, 0, 'old'); }
  for (let x = x0 + 3; x < x1; x += 11) { const a = V3(x, 7.4, -3.2), b = V3(x + 11, 7.1, 3.2); wire(a, b, 0.4, '#1e1e22', 0.012); }
  // 老街牌樓
  for (const x of [x0 - 1.5, x1 + 1.5]) {
    for (const z of [-2.8, 2.8]) cyl('plain', x, 0, z, 0.25, 0.28, 5.4, 10, '#b3261e', { col: true });
    box('plain', x, 5.2, 0, 0.6, 0.7, 7, '#b3261e');
    box('roof', x, 5.9, 0, 1.4, 0.25, 8, '#ffffff');
    const r = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '延平街・安平老街', en: 'YANPING OLD STREET', style: 'black' }));
    panel('signs', x + (x < 0 ? -0.31 : 0.31), 5.55, 0, 4.8, 1.2, x < 0 ? -Math.PI / 2 : Math.PI / 2, r);
  }
}
/* ---------- 劍獅埕廣場 ---------- */
function buildPlaza() {
  const cx = 81, cz = 0;
  ground('brickpave', 70, -14, 92.4, 14, 0.03, '#ffffff', { uv: 0.4 });
  flameTree(cx, cz, { scale: 1.7, cards: 6500, limbs: 4 });
  // 環形長椅
  const n = 24, R = 3.4;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, a2 = (i + 1) / n * TAU;
    const p0 = [cx + Math.cos(a) * R, cz + Math.sin(a) * R], p1 = [cx + Math.cos(a2) * R, cz + Math.sin(a2) * R];
    const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2, rot = -a - Math.PI / 2 + Math.PI / n * 0;
    box('wood', mx, 0.42, mz, Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) + 0.05, 0.07, 0.5, '#b8865a', Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]));
    if (i % 3 === 0) box('plain', mx, 0, mz, 0.12, 0.42, 0.4, '#555', Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]));
  }
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; addCol(cx + Math.cos(a) * R, cz + Math.sin(a) * R, 0.5, 0.5, 0, 0.49, -a); }
  // 劍獅照牆
  const F = new Frame(cx, -11.5, 0);
  F.box('brick', 0, 0, 0, 9, 4.2, 1.2, '#ffffff', { col: true });
  F.box('plain', 0, 4.2, 0, 9.6, 0.35, 1.5, '#8a3a26');
  gable(F, 0, 0, 9.4, 1.4, 4.55, 0.7, 'roof', '#ffffff', 0.2);
  swallowRidge(F, -4.5, 4.5, 5.2, 0, '#9a3a26');
  F.cyl('plain', 0, 0.8, 0.62, 1.55, 1.55, 0.15, 24, '#6e2a1c');
  const q = F.p(0, 0.62); addGeo('plain', GEO.cyl(24), mat(q[0], 2.35, q[1], Math.PI / 2, 0, 0, 1.5, 0.16, 1.5), '#b8862e');
  F.panel('boards', 0, 2.35, 0.72, 2.9, 2.9, ATLAS_BOARD.lionBig, '#ffffff');
  for (const sd of [-1, 1]) { F.cyl('plain', sd * 3.3, 0, 0.8, 0.28, 0.3, 3.8, 12, '#b3261e', { col: true }); }
  const r = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '劍獅埕', en: 'SWORD LION SQUARE', style: 'red' }));
  F.panel('signs', 0, 4.0, 0.78, 3.2, 0.8, r);
  for (let i = 0; i < 5; i++) pottedPlant(72 + i * 4.5, 0.03, 12.5, 1.2);
  bench(74, 10, 0); bench(88, 10, 0); bench(74, -8, Math.PI); bench(88, -8, Math.PI);
  streetLamp(72, -12, 0, 'old'); streetLamp(90, 12, 0, 'old');
  lanternString(V3(71, 5, -13), V3(91, 5, -13), 10, 0.6);
}

/* ---------- 運河岸：鳳凰木花隧道、自行車道、碼頭、橋 ---------- */
function buildCanalside() {
  // 北岸步道
  ground('brickpave', ROAD.D + 4, 28.5, 170, W.canalZ0, 0.03, '#ffffff', { uv: 0.4 });
  box('asphalt', 60, 0.035, 34, 380, 0.01, 2.6, '#c98270', 0, { noSide: true });
  for (let x = ROAD.D + 10; x < 165; x += 5) box('markings', x, 0.047, 34, 2, 0.005, 0.1, '#f4f2ea', 0, { noSide: true });
  // 南岸步道
  ground('brickpave', W.beachX, W.canalZ1, 170, 70, 0.03, '#ffffff', { uv: 0.4 });
  // 欄杆
  for (let x = ROAD.D + 6; x < 168; x += 12) {
    if (x > -40 && x < -12) continue; if (Math.abs(x - W.bridgeX) < 5) continue;
    railing('plain', x, W.canalZ0 - 0.25, Math.min(x + 12, 168), W.canalZ0 - 0.25, 0.03, 1.05, '#e9e6de', 2, true);
  }
  for (let x = W.beachX + 2; x < 168; x += 12) { if (Math.abs(x - W.bridgeX) < 5) continue; railing('plain', x, W.canalZ1 + 0.25, Math.min(x + 12, 168), W.canalZ1 + 0.25, 0.03, 1.05, '#e9e6de', 2, true); }
  // 鳳凰木雙排
  let k = 0;
  for (let x = ROAD.D + 14; x < 160; x += 15) {
    if (Math.abs(x - W.bridgeX) < 7 || (x > -44 && x < -10)) { k++; continue; }
    flameTree(x + (k % 2) * 7, 30.2, { scale: rr(0.95, 1.15), cards: 1500 });
    flameTree(x + 3.5 + (k % 2) * 7, 38.2, { scale: rr(0.9, 1.1), cards: 1400 });
    k++;
  }
  for (let x = W.beachX + 20; x < 160; x += 24) if (Math.abs(x - W.bridgeX) > 8) flameTree(x, 67, { scale: rr(0.9, 1.1), cards: 1300 });
  // 燈籠柱
  for (let x = ROAD.D + 12; x < 165; x += 10) { if (Math.abs(x - W.bridgeX) < 5 || (x > -38 && x < -14)) continue; cyl('plain', x, 0, 39.2, 0.06, 0.08, 2.6, 6, '#3a2a22'); lantern(x, 2.35, 39.2, '#d8322a', 0.9); }
  for (let x = W.beachX + 8; x < 165; x += 12) { if (Math.abs(x - W.bridgeX) < 5) continue; streetLamp(x, 63.2, Math.PI, 'old'); }
  for (let x = ROAD.D + 20; x < 160; x += 30) { if (Math.abs(x - W.bridgeX) < 8 || (x > -44 && x < -8)) continue; bench(x, 36.3, Math.PI); }
  // 行人橋（拱橋）
  const bx = W.bridgeX, zA = 32, zB = 70, top = 4.4;
  const prof = (z) => { if (z < 38) return (z - zA) / 6 * top; if (z > 64) return (zB - z) / 6 * top; return top; };
  for (let z = zA; z < zB; z += 0.5) {
    const y = prof(z + 0.25);
    box('wood', bx, y - 0.25, z + 0.25, 4.6, 0.25, 0.52, '#b08a5e', 0, { uv: 1 });
    addCol(bx, z + 0.25, 2.3, 0.26, y - 0.4, y);
  }
  for (const sd of [-1, 1]) {
    let prev = null;
    for (let z = zA; z <= zB; z += 1.5) { const y = prof(z); const p = V3(bx + sd * 2.3, y + 1.05, z); tube('plain', V3(bx + sd * 2.3, y, z), p, 0.04, 0.04, 5, '#c0392b'); if (prev) tube('plain', prev, p, 0.05, 0.05, 5, '#c0392b'); prev = p; }
    addCol(bx + sd * 2.35, (zA + zB) / 2, 0.1, (zB - zA) / 2, 0, top + 1.3);
  }
  box('plain', bx, top - 0.9, 51, 4.8, 0.65, 26, '#c9c2b4');
  for (const z of [40.5, 61.5]) { box('slab', bx - 2, -2.6, z, 0.9, top + 1.8, 0.9, '#b9b2a6'); box('slab', bx + 2, -2.6, z, 0.9, top + 1.8, 0.9, '#b9b2a6'); }
  for (const z of [44, 58]) lantern(bx - 2.3, top + 1.5, z, '#d8322a', 0.8), lantern(bx + 2.3, top + 1.5, z, '#d8322a', 0.8);
  // 遊船碼頭
  box('wood', -26, -0.35, 41.8, 20, 0.35, 3.6, '#a47c52', 0, { col: true });
  for (let x = -35; x <= -17; x += 3) cyl('plain', x, -2, 43.5, 0.15, 0.15, 2.4, 8, '#5a4a3a');
  railing('plain', -36, 43.55, -30, 43.55, 0, 1.0, '#e9e6de', 2, true); railing('plain', -22, 43.55, -16, 43.55, 0, 1.0, '#e9e6de', 2, true);
  // 候船亭
  for (const [x, z] of [[-34, 29.5], [-18, 29.5], [-34, 35.5], [-18, 35.5]]) cyl('plain', x, 0, z, 0.12, 0.12, 3.2, 8, '#f0ede6', { col: true });
  box('plain', -26, 3.2, 32.5, 18, 0.25, 7.5, '#f7f3ea'); box('plain', -26, 3.45, 32.5, 18.5, 0.2, 8, '#2a6f97');
  bench(-30, 31, 0); bench(-22, 31, 0);
  box('plain', -16.6, 0, 33.8, 1.0, 1.9, 0.8, '#d62828', 0, { col: true }); box('window', -16.6, 0.8, 34.21, 0.8, 0.9, 0.02, '#fff4d6'); box('plain', -16.6, 0.1, 34.22, 0.8, 0.4, 0.02, '#2a2a2a');
  box('plain', -15.4, 0, 33.8, 1.0, 1.9, 0.8, '#2a6f97', 0, { col: true }); box('window', -15.4, 0.8, 34.21, 0.8, 0.9, 0.02, '#fff4d6');
  const r = ATLAS_SIGN.draw(448, 112, (g, w, h) => drawSignH(g, w, h, { name: '運河遊船 安平碼頭', en: 'ANPING PIER  CANAL CRUISE', style: 'blue' }));
  panel('signs', -26, 2.6, 36.3, 5.6, 1.4, 0, r, '#ffffff', true);
  cyl('plain', -31, 0, 36.3, 0.08, 0.08, 2.2, 6, '#555'); cyl('plain', -21, 0, 36.3, 0.08, 0.08, 2.2, 6, '#555');
  const tr = ATLAS_SIGN.draw(256, 128, (g, w, h) => { g.fillStyle = '#10222e'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd24a'; g.font = `700 22px ${FONT_SANS}`; g.fillText('下一班 NEXT', 14, 34); g.fillStyle = '#7fffb0'; g.font = `700 36px ${FONT_SANS}`; g.fillText('約 5 分鐘', 14, 84); g.fillStyle = '#fff'; g.font = `500 16px ${FONT_SANS}`; g.fillText('航程 40 分・往返安億橋', 14, 114); });
  panel('signs', -26, 2.6, 28.9, 1.8, 0.9, Math.PI, tr);
}
