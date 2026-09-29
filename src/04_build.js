/* ================= 04 建模工具：依材質合併、招牌圖集、共用道具 ================= */
class Batch {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; }
  v(p, n, u, v, c) { this.p.push(p[0], p[1], p[2]); this.n.push(n[0], n[1], n[2]); this.u.push(u, v); this.c.push(c.r, c.g, c.b); }
  quad(a, b, c, d, n, ua, va, ub, vb, uc, vc, ud, vd, col) {
    this.v(a, n, ua, va, col); this.v(b, n, ub, vb, col); this.v(c, n, uc, vc, col);
    this.v(a, n, ua, va, col); this.v(c, n, uc, vc, col); this.v(d, n, ud, vd, col);
  }
  get count() { return this.p.length / 3; }
}
const BATCH = {};
function B(name) { return BATCH[name] || (BATCH[name] = new Batch()); }
const _O = {};
function col3(c) { return typeof c === 'string' ? C(c) : c; }

/* 方塊：x,z 為中心，y 為底部；UV 用世界尺度（1 公尺 = 1 × uv） */
function box(m, x, y, z, sx, sy, sz, c, rot, o) {
  o = o || _O; c = col3(c); rot = rot || 0;
  const b = B(m), co = Math.cos(rot), si = Math.sin(rot), hx = sx / 2, hz = sz / 2, y0 = y, y1 = y + sy, s = o.uv || 1;
  const W = (lx, ly, lz) => [x + co * lx + si * lz, ly, z - si * lx + co * lz];
  const N = (nx, ny, nz) => [co * nx + si * nz, ny, -si * nx + co * nz];
  const uo = o.uo != null ? o.uo : ((x * 0.37 + z * 0.61) % 1);
  if (!o.noSide) {
    if (!o.noPX) b.quad(W(hx, y0, hz), W(hx, y0, -hz), W(hx, y1, -hz), W(hx, y1, hz), N(1, 0, 0), uo, y0 * s, uo + sz * s, y0 * s, uo + sz * s, y1 * s, uo, y1 * s, c);
    if (!o.noNX) b.quad(W(-hx, y0, -hz), W(-hx, y0, hz), W(-hx, y1, hz), W(-hx, y1, -hz), N(-1, 0, 0), uo, y0 * s, uo + sz * s, y0 * s, uo + sz * s, y1 * s, uo, y1 * s, c);
    if (!o.noPZ) b.quad(W(-hx, y0, hz), W(hx, y0, hz), W(hx, y1, hz), W(-hx, y1, hz), N(0, 0, 1), uo, y0 * s, uo + sx * s, y0 * s, uo + sx * s, y1 * s, uo, y1 * s, c);
    if (!o.noNZ) b.quad(W(hx, y0, -hz), W(-hx, y0, -hz), W(-hx, y1, -hz), W(hx, y1, -hz), N(0, 0, -1), uo, y0 * s, uo + sx * s, y0 * s, uo + sx * s, y1 * s, uo, y1 * s, c);
  }
  if (!o.noTop) b.quad(W(-hx, y1, hz), W(hx, y1, hz), W(hx, y1, -hz), W(-hx, y1, -hz), [0, 1, 0], (x - hx) * s, (z + hz) * s, (x + hx) * s, (z + hz) * s, (x + hx) * s, (z - hz) * s, (x - hx) * s, (z - hz) * s, c);
  if (o.bottom) b.quad(W(-hx, y0, -hz), W(hx, y0, -hz), W(hx, y0, hz), W(-hx, y0, hz), [0, -1, 0], 0, 0, sx * s, 0, sx * s, sz * s, 0, sz * s, c);
  if (o.col) addCol(x, z, hx, hz, y0, y1, rot);
}
/* 平面地面（上表面） */
function ground(m, x0, z0, x1, z1, y, c, o) {
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  box(m, cx, (y || 0) - 0.4, cz, Math.abs(x1 - x0), 0.4, Math.abs(z1 - z0), c || '#ffffff', 0, Object.assign({ noSide: false }, o || {}));
}
/* 任意四邊形（a,b,c,d 逆時針，法線自動） */
const _va = new THREE.Vector3(), _vb = new THREE.Vector3(), _vn = new THREE.Vector3();
function quad4(m, a, b, c, d, col, uvs, dbl) {
  col = col3(col);
  _va.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); _vb.set(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
  _vn.crossVectors(_va, _vb).normalize();
  const n = [_vn.x, _vn.y, _vn.z];
  const u = uvs || [0, 0, 1, 0, 1, 1, 0, 1];
  B(m).quad(a, b, c, d, n, u[0], u[1], u[2], u[3], u[4], u[5], u[6], u[7], col);
  if (dbl) B(m).quad(d, c, b, a, [-n[0], -n[1], -n[2]], u[6], u[7], u[4], u[5], u[2], u[3], u[0], u[1], col);
}
/* 錐台管：a→b，半徑 ra→rb，n 邊 */
const _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _ax = new THREE.Vector3();
function tube(m, a, b, ra, rb, n, c, o) {
  c = col3(c); o = o || _O;
  _ax.set(b.x - a.x, b.y - a.y, b.z - a.z); const L = _ax.length(); if (L < 1e-5) return; _ax.divideScalar(L);
  if (Math.abs(_ax.y) < 0.95) _t1.set(0, 1, 0); else _t1.set(1, 0, 0);
  _t2.crossVectors(_ax, _t1).normalize(); _t1.crossVectors(_t2, _ax).normalize();
  const bt = B(m), us = o.uvx || 1, vs = o.uvy || 1;
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
    const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    const n0 = [_t1.x * c0 + _t2.x * s0, _t1.y * c0 + _t2.y * s0, _t1.z * c0 + _t2.z * s0];
    const n1 = [_t1.x * c1 + _t2.x * s1, _t1.y * c1 + _t2.y * s1, _t1.z * c1 + _t2.z * s1];
    const p0 = [a.x + n0[0] * ra, a.y + n0[1] * ra, a.z + n0[2] * ra], p1 = [a.x + n1[0] * ra, a.y + n1[1] * ra, a.z + n1[2] * ra];
    const q1 = [b.x + n1[0] * rb, b.y + n1[1] * rb, b.z + n1[2] * rb], q0 = [b.x + n0[0] * rb, b.y + n0[1] * rb, b.z + n0[2] * rb];
    const u0 = i / n * us, u1 = (i + 1) / n * us, v0 = (o.v0 || 0), v1 = v0 + L * vs;
    bt.v(p0, n0, u0, v0, c); bt.v(p1, n1, u1, v0, c); bt.v(q1, n1, u1, v1, c);
    bt.v(p0, n0, u0, v0, c); bt.v(q1, n1, u1, v1, c); bt.v(q0, n0, u0, v1, c);
  }
  if (o.cap) { // 頂蓋
    const nn = [_ax.x, _ax.y, _ax.z];
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
      const p0 = [b.x + (_t1.x * Math.cos(a0) + _t2.x * Math.sin(a0)) * rb, b.y + (_t1.y * Math.cos(a0) + _t2.y * Math.sin(a0)) * rb, b.z + (_t1.z * Math.cos(a0) + _t2.z * Math.sin(a0)) * rb];
      const p1 = [b.x + (_t1.x * Math.cos(a1) + _t2.x * Math.sin(a1)) * rb, b.y + (_t1.y * Math.cos(a1) + _t2.y * Math.sin(a1)) * rb, b.z + (_t1.z * Math.cos(a1) + _t2.z * Math.sin(a1)) * rb];
      bt.v([b.x, b.y, b.z], nn, 0.5, 0.5, c); bt.v(p0, nn, 0, 0, c); bt.v(p1, nn, 1, 0, c);
    }
  }
}
function cyl(m, x, y, z, rt, rb, h, n, c, o) { tube(m, V3(x, y, z), V3(x, y + h, z), rb, rt, n, c, Object.assign({ cap: true }, o || {})); if (o && o.col) addCol(x, z, Math.max(rt, rb), Math.max(rt, rb), y, y + h, 0); }
/* 以 three 幾何加入批次 */
const _geoCache = new Map();
function geoNI(key, make) { let g = _geoCache.get(key); if (!g) { g = make(); if (g.index) g = g.toNonIndexed(); _geoCache.set(key, g); } return g; }
const _nm = new THREE.Matrix3(), _gv = new THREE.Vector3(), _gn = new THREE.Vector3();
function addGeo(m, geo, mtx, c, uvs) {
  c = col3(c); const b = B(m), p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  _nm.getNormalMatrix(mtx); uvs = uvs || 1;
  for (let i = 0; i < p.count; i++) {
    _gv.fromBufferAttribute(p, i).applyMatrix4(mtx); _gn.fromBufferAttribute(n, i).applyMatrix3(_nm).normalize();
    b.p.push(_gv.x, _gv.y, _gv.z); b.n.push(_gn.x, _gn.y, _gn.z);
    if (uv) b.u.push(uv.getX(i) * uvs, uv.getY(i) * uvs); else b.u.push(0, 0);
    b.c.push(c.r, c.g, c.b);
  }
}
const GEO = {
  sphere: () => geoNI('sph', () => new THREE.SphereGeometry(1, 12, 8)),
  sphereLo: () => geoNI('sphlo', () => new THREE.SphereGeometry(1, 7, 5)),
  ico: () => geoNI('ico', () => new THREE.IcosahedronGeometry(1, 0)),
  cone: (n) => geoNI('cone' + n, () => new THREE.ConeGeometry(1, 1, n || 8)),
  cyl: (n) => geoNI('cyl' + n, () => new THREE.CylinderGeometry(1, 1, 1, n || 8)),
  torus: () => geoNI('tor', () => new THREE.TorusGeometry(1, 0.12, 6, 18)),
  halfDisc: () => geoNI('hd', () => new THREE.CircleGeometry(1, 8, 0, Math.PI)),
};
function sph(m, x, y, z, rx, ry, rz, c, lo) { addGeo(m, lo ? GEO.sphereLo() : GEO.sphere(), mat(x, y, z, 0, 0, 0, rx, ry, rz), c); }

/* ---------- 材質 ---------- */
const MAT = {};
function glowPatch(m, mode, k) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uGlow = U.glow;
    sh.fragmentShader = 'uniform float uGlow;\n' + sh.fragmentShader;
    if (mode === 'window') sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor * uGlow * ' + k.toFixed(2) + ';');
    else if (mode === 'lamp') sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vColor * uGlow * ' + k.toFixed(2) + ';');
    else sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uGlow * ' + k.toFixed(2) + ';');
  };
  m.customProgramCacheKey = () => 'glow_' + mode + k;
  return m;
}
let ATLAS_SIGN, ATLAS_BOARD, ATLAS_INFO;
function buildMaterials() {
  const L = (o) => new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, o));
  MAT.plain = L({});
  MAT.plainDS = L({ side: THREE.DoubleSide });
  for (const k of ['brick', 'oldbrick', 'plaster', 'wash', 'tile', 'roof', 'wood', 'slab', 'brickpave', 'asphalt', 'sidewalk', 'tactile', 'grass', 'sand', 'roller', 'corr', 'bark']) MAT[k] = L({ map: TEX[k] });
  MAT.window = glowPatch(L({ color: C('#56687a') }), 'window', 1.15);
  MAT.grille = L({ map: TEX.grille, alphaTest: 0.5, side: THREE.DoubleSide });
  MAT.lamp = glowPatch(L({}), 'lamp', 1.1);
  ATLAS_SIGN = new Atlas(2048); ATLAS_BOARD = new Atlas(2048); ATLAS_INFO = new Atlas(2048);
}
function finishAtlasMaterials() {
  MAT.signs = glowPatch(new THREE.MeshLambertMaterial({ vertexColors: true, map: ATLAS_SIGN.tex() }), 'sign', 0.5);
  MAT.boards = glowPatch(new THREE.MeshLambertMaterial({ vertexColors: true, map: ATLAS_BOARD.tex() }), 'sign', 0.3);
  MAT.info = glowPatch(new THREE.MeshLambertMaterial({ vertexColors: true, map: ATLAS_INFO.tex() }), 'sign', 0.3);
}
const NO_CAST = { grass: 1, sand: 1, asphalt: 1, sidewalk: 1, slab: 1, brickpave: 1, tactile: 1, markings: 1 };
const STATIC_MESHES = [];
function buildBatches() {
  MAT.markings = MAT.markings || new THREE.MeshLambertMaterial({ vertexColors: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const CH = 110;
  for (const k in BATCH) {
    const b = BATCH[k]; if (!b.p.length) continue;
    const T = b.p.length / 9;
    // 大批次依空間切塊，讓視錐與陰影相機能剔除看不到的區塊
    const groups = new Map();
    if (T > 12000) {
      for (let t = 0; t < T; t++) {
        const o = t * 9, cx = (b.p[o] + b.p[o + 3] + b.p[o + 6]) / 3, cz = (b.p[o + 2] + b.p[o + 5] + b.p[o + 8]) / 3;
        const key = Math.floor((cx + 400) / CH) + ',' + Math.floor((cz + 400) / CH);
        let g = groups.get(key); if (!g) { g = []; groups.set(key, g); } g.push(t);
      }
    } else groups.set('all', null);
    for (const [key, tris] of groups) {
      let P = b.p, N = b.n, UV = b.u, CC = b.c;
      if (tris) {
        P = new Float32Array(tris.length * 9); N = new Float32Array(tris.length * 9); UV = new Float32Array(tris.length * 6); CC = new Float32Array(tris.length * 9);
        for (let i = 0; i < tris.length; i++) {
          const s9 = tris[i] * 9, d9 = i * 9, s6 = tris[i] * 6, d6 = i * 6;
          for (let j = 0; j < 9; j++) { P[d9 + j] = b.p[s9 + j]; N[d9 + j] = b.n[s9 + j]; CC[d9 + j] = b.c[s9 + j]; }
          for (let j = 0; j < 6; j++) UV[d6 + j] = b.u[s6 + j];
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(CC, 3));
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, MAT[k] || MAT.plain);
      m.castShadow = !NO_CAST[k]; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix();
      m.name = 'batch_' + k + '_' + key;
      scene.add(m); STATIC_MESHES.push(m);
    }
    b.p = b.n = b.u = b.c = null; delete BATCH[k];
  }
}

/* ---------- 招牌圖集 ---------- */
class Atlas {
  constructor(S) { this.S = S; this.c = mkCanvas(S, S); this.g = this.c.getContext('2d'); this.rows = []; this.nextY = 2; }
  alloc(w, h) {
    // 依高度分列擺放，減少不同尺寸混排的浪費
    let row = this.rows.find(r => r.h >= h && r.h <= h * 1.3 + 4 && r.x + w + 2 <= this.S);
    if (!row) {
      if (this.nextY + h + 2 > this.S) { console.warn('atlas full', w, h); return null; }
      row = { y: this.nextY, h, x: 2 }; this.rows.push(row); this.nextY += h + 4;
    }
    const r = { x: row.x, y: row.y, w, h }; row.x += w + 4;
    r.u0 = (r.x + 0.5) / this.S; r.u1 = (r.x + w - 0.5) / this.S; r.v1 = 1 - (r.y + 0.5) / this.S; r.v0 = 1 - (r.y + h - 0.5) / this.S;
    return r;
  }
  draw(w, h, fn) {
    let r = this.alloc(w, h);
    if (!r) { w = Math.max(8, w >> 1); h = Math.max(8, h >> 1); r = this.alloc(w, h); if (!r) return { u0: 0, u1: 0.001, v0: 0, v1: 0.001 }; }
    const g = this.g; g.save(); g.beginPath(); g.rect(r.x, r.y, w, h); g.clip(); g.translate(r.x, r.y); fn(g, w, h); g.restore();
    return r;
  }
  tex() { this.t = mkTex(this.c, { rep: false }); return this.t; }
}
/* 直立四邊形：中心(x,y,z)，寬 w 高 h，朝向 rot（rot=0 面向 +z） */
function panel(m, x, y, z, w, h, rot, r, col, dbl) {
  const co = Math.cos(rot), si = Math.sin(rot), hw = w / 2, hh = h / 2;
  const P = (lx, ly) => [x + co * lx, y + ly, z - si * lx];
  const uvs = [r.u0, r.v0, r.u1, r.v0, r.u1, r.v1, r.u0, r.v1];
  quad4(m, P(-hw, -hh), P(hw, -hh), P(hw, hh), P(-hw, hh), col || '#ffffff', uvs, false);
  if (dbl) { // 背面也貼（反向 UV 讓文字不鏡像）
    const P2 = (lx, ly) => [x + co * lx, y + ly, z - si * lx];
    quad4(m, P2(hw, -hh), P2(-hw, -hh), P2(-hw, hh), P2(hw, hh), col || '#ffffff', uvs, false);
  }
}
function wrapText(g, text, maxW) {
  const lines = []; let cur = '';
  for (const ch of text) {
    if (ch === '\n') { lines.push(cur); cur = ''; continue; }
    if (g.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch;
  }
  if (cur) lines.push(cur); return lines;
}
function fitFont(g, text, weight, family, maxW, maxH) {
  let s = maxH; g.font = `${weight} ${s}px ${family}`;
  while (s > 8 && g.measureText(text).width > maxW) { s -= 2; g.font = `${weight} ${s}px ${family}`; }
  return s;
}
const SIGN_STYLES = {
  wood: { bg: '#4a2a18', bg2: '#3a1f10', fg: '#f0c96a', sub: '#e8d6b0', border: '#c9963a', font: FONT_KAI },
  red: { bg: '#b3261e', bg2: '#8f1c16', fg: '#ffe7a1', sub: '#ffe9d6', border: '#f2c14e', font: FONT_KAI },
  white: { bg: '#faf7f0', bg2: '#ece6da', fg: '#b3261e', sub: '#3a3a3a', border: '#b3261e', font: FONT_SERIF },
  blue: { bg: '#1e4f7a', bg2: '#173d5f', fg: '#ffffff', sub: '#cfe3f5', border: '#f2d06b', font: FONT_SANS },
  green: { bg: '#2f6b4f', bg2: '#24533d', fg: '#fff6d8', sub: '#d9eadf', border: '#e9d38a', font: FONT_KAI },
  cream: { bg: '#f3e6c8', bg2: '#e6d4ae', fg: '#5a2a18', sub: '#6a4a38', border: '#8a5a38', font: FONT_KAI },
  black: { bg: '#1c1b1a', bg2: '#111', fg: '#f3d27a', sub: '#e0d6c4', border: '#8a6a2a', font: FONT_KAI },
  teal: { bg: '#127f86', bg2: '#0e666c', fg: '#fff9e0', sub: '#e0f4f2', border: '#f6c945', font: FONT_SANS },
};
function drawSignH(g, w, h, o) {
  const st = SIGN_STYLES[o.style] || SIGN_STYLES.wood;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, st.bg); gr.addColorStop(1, st.bg2);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = st.border; g.lineWidth = Math.max(3, h * 0.04); g.strokeRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const hasSub = o.en || o.tel;
  const nameH = hasSub ? h * 0.52 : h * 0.7;
  fitFont(g, o.name, 700, st.font, w * 0.86, nameH);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillText(o.name, w / 2 + 2, (hasSub ? h * 0.38 : h * 0.52) + 2);
  g.fillStyle = st.fg; g.fillText(o.name, w / 2, hasSub ? h * 0.38 : h * 0.52);
  if (hasSub) {
    g.fillStyle = st.sub;
    const line = [o.en, o.tel].filter(Boolean).join('   ☎ ');
    fitFont(g, line, 500, FONT_SANS, w * 0.84, h * 0.15);
    g.fillText(line, w / 2, h * 0.78);
  }
}
function drawSignV(g, w, h, o) {
  const st = SIGN_STYLES[o.style] || SIGN_STYLES.red;
  g.fillStyle = st.bg; g.fillRect(0, 0, w, h);
  g.strokeStyle = st.border; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  const chars = [...o.name]; const cs = Math.min(w * 0.72, (h - 20) / (chars.length + (o.small ? 1.2 : 0)) * 0.92);
  g.font = `700 ${cs}px ${st.font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = st.fg;
  const total = chars.length * cs * 1.05; let y = (h - total - (o.small ? cs * 1.1 : 0)) / 2 + cs * 0.55;
  for (const ch of chars) { g.fillText(ch, w / 2, y); y += cs * 1.05; }
  if (o.small) { g.font = `500 ${cs * 0.34}px ${FONT_SANS}`; g.fillStyle = st.sub; g.fillText(o.small, w / 2, y + cs * 0.2); }
}
function drawBanner(g, w, h, o) {
  g.fillStyle = o.bg || '#c0392b'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, 0, w, h * 0.06); g.fillRect(0, h * 0.94, w, h * 0.06);
  const chars = [...o.text]; const cs = Math.min(w * 0.78, h * 0.86 / chars.length);
  g.font = `700 ${cs}px ${FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = o.fg || '#fff';
  let y = h / 2 - (chars.length - 1) * cs / 2; for (const ch of chars) { g.fillText(ch, w / 2, y); y += cs; }
}
function drawInfoBoard(g, w, h, o) {
  g.fillStyle = '#3b2616'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f5ecd8'; g.fillRect(12, 12, w - 24, h - 24);
  g.fillStyle = '#a8432c'; g.fillRect(12, 12, w - 24, 8);
  g.textAlign = 'left'; g.textBaseline = 'top';
  g.fillStyle = '#a8432c'; g.font = `700 20px ${FONT_SANS}`; g.fillText(o.era || '', 34, 36);
  g.fillStyle = '#2a1f1a'; g.font = `900 46px ${FONT_SERIF}`; g.fillText(o.title, 34, 64);
  g.fillStyle = '#6e5d52'; g.font = `500 18px ${FONT_SANS}`; g.fillText(o.en || '', 34, 120);
  g.strokeStyle = 'rgba(90,52,34,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(34, 150); g.lineTo(w - 34, 150); g.stroke();
  g.fillStyle = '#2a1f1a'; g.font = `400 22px ${FONT_SANS}`;
  const lines = wrapText(g, o.body || '', w - 68); let y = 166;
  for (const l of lines) { if (y > h - 60) break; g.fillText(l, 34, y); y += 34; }
  g.fillStyle = '#8a7666'; g.font = `500 15px ${FONT_SANS}`; g.fillText('台南地名誌・安平篇　解說牌', 34, h - 42);
  drawSwordLion(g, w - 58, h - 58, 34, 'L');
}
function drawPlate(g, w, h, text) {
  g.fillStyle = '#f7f7f2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 3; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#1a1a1a'; g.textAlign = 'center'; g.textBaseline = 'middle'; fitFont(g, text, 700, FONT_SANS, w * 0.9, h * 0.7); g.fillText(text, w / 2, h * 0.54);
}

/* ---------- 夜間光暈（加法混合點精靈） ---------- */
const HALO = { p: [], c: [], s: [] };
function addHalo(x, y, z, hex, size) { const c = C(hex); HALO.p.push(x, y, z); HALO.c.push(c.r, c.g, c.b); HALO.s.push(size || 1); }
function buildHalos() {
  if (!HALO.p.length) return;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(HALO.p, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(HALO.c, 3));
  g.setAttribute('aSize', new THREE.Float32BufferAttribute(HALO.s, 1));
  const m = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uGlow: U.glow, uPR: U.pr, uH: { value: innerHeight } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `attribute float aSize;uniform float uPR,uH,uGlow;varying vec3 vC;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float d=-mv.z;vC=color*(1.-smoothstep(35.,150.,d));gl_Position=projectionMatrix*mv;gl_PointSize=aSize*uH*.9/d*step(.02,uGlow);}`,
    fragmentShader: `uniform float uGlow;varying vec3 vC;void main(){vec2 d=gl_PointCoord-.5;float r=length(d)*2.;float a=exp(-r*r*4.)*(1.-r);if(a<=0.)discard;gl_FragColor=vec4(vC*a*uGlow*.6,1.);
    #include <encodings_fragment>
    }`
  }));
  m.frustumCulled = false; m.renderOrder = 5; scene.add(m); ENV.halos = m;
}

/* ---------- 共用小道具 ---------- */
function acUnit(x, y, z, rot) {
  box('plain', x, y, z, 0.8, 0.55, 0.32, '#e9e7e1', rot);
  const co = Math.cos(rot), si = Math.sin(rot);
  addGeo('plain', GEO.cyl(8), mat(x + si * 0.17 - co * 0.1, y + 0.27, z + co * 0.17 + si * 0.1, Math.PI / 2, rot, 0, 0.2, 0.02, 0.2), '#7a7a76');
}
function waterTank(x, y, z, kind) {
  for (const dx of [-0.5, 0.5]) for (const dz of [-0.5, 0.5]) tube('plain', V3(x + dx, y, z + dz), V3(x + dx * 0.9, y + 1.1, z + dz * 0.9), 0.04, 0.04, 4, '#6e6e6a');
  const c = kind === 'blue' ? '#3f86c8' : kind === 'white' ? '#e8e6e0' : '#c9ccd0';
  cyl('plain', x, y + 1.1, z, 0.65, 0.65, 1.3, 10, c);
  addGeo('plain', GEO.cone(10), mat(x, y + 2.52, z, 0, 0, 0, 0.66, 0.24, 0.66), c);
}
function antenna(x, y, z) {
  tube('plain', V3(x, y, z), V3(x, y + 2.6, z), 0.025, 0.02, 4, '#8b8b8b');
  for (let i = 0; i < 4; i++) { const yy = y + 1.6 + i * 0.28, l = 0.9 - i * 0.15; tube('plain', V3(x - l / 2, yy, z), V3(x + l / 2, yy, z), 0.012, 0.012, 3, '#9a9a9a'); }
  tube('plain', V3(x, y + 2.2, z - 0.5), V3(x, y + 2.2, z + 0.5), 0.012, 0.012, 3, '#9a9a9a');
}
function railing(m, x0, z0, x1, z1, y, h, c, post, col) {
  const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / (post || 1.6)));
  for (let i = 0; i <= n; i++) { const t = i / n; tube(m, V3(lerp(x0, x1, t), y, lerp(z0, z1, t)), V3(lerp(x0, x1, t), y + h, lerp(z0, z1, t)), 0.035, 0.035, 5, c); }
  tube(m, V3(x0, y + h, z0), V3(x1, y + h, z1), 0.04, 0.04, 5, c);
  tube(m, V3(x0, y + h * 0.5, z0), V3(x1, y + h * 0.5, z1), 0.025, 0.025, 4, c);
  if (col) { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, rot = Math.atan2(-(z1 - z0), x1 - x0); addCol(cx, cz, L / 2, 0.12, y, y + h + 0.25, rot); }
}
/* 懸垂電線（懸鏈線近似） */
function wire(a, b, sag, c, r) {
  const n = 8; let prev = a.clone();
  for (let i = 1; i <= n; i++) {
    const t = i / n; const p = new THREE.Vector3().lerpVectors(a, b, t); p.y -= sag * 4 * t * (1 - t);
    tube('plain', prev, p, r || 0.014, r || 0.014, 3, c || '#1e1e22'); prev = p;
  }
}
/* 電線桿：回傳掛線點 */
function utilityPole(x, z, rot, h) {
  h = h || 9.5;
  cyl('plain', x, 0, z, 0.13, 0.17, h, 8, '#9d9a94', { col: true });
  const co = Math.cos(rot), si = Math.sin(rot);
  const arm = (y, L) => { tube('plain', V3(x - co * L, y, z + si * L), V3(x + co * L, y, z - si * L), 0.05, 0.05, 4, '#6b6b68'); };
  arm(h - 0.4, 1.0); arm(h - 1.2, 0.8);
  cyl('plain', x + si * 0.35, h - 3.2, z + co * 0.35, 0.28, 0.28, 0.9, 10, '#8c9197');
  const pts = [];
  for (const L of [-0.9, -0.3, 0.3, 0.9]) pts.push(V3(x + co * L, h - 0.35, z - si * L));
  for (const L of [-0.7, 0.7]) pts.push(V3(x + co * L, h - 1.15, z - si * L));
  return pts;
}
function streetLamp(x, z, rot, style) {
  const co = Math.cos(rot), si = Math.sin(rot);
  if (style === 'old') { // 老街仿古燈柱
    cyl('plain', x, 0, z, 0.07, 0.1, 3.6, 8, '#2d2a28', { col: true });
    box('plain', x, 0, z, 0.36, 0.5, 0.36, '#2d2a28');
    box('lamp', x, 3.6, z, 0.42, 0.55, 0.42, '#ffe2a8');
    addGeo('plain', GEO.cone(4), mat(x, 4.3, z, 0, Math.PI / 4, 0, 0.38, 0.3, 0.38), '#2d2a28');
    addHalo(x, 3.9, z, '#ffc978', 6);
    return;
  }
  cyl('plain', x, 0, z, 0.08, 0.12, 7.5, 8, '#8d9196', { col: true });
  const tip = V3(x + si * 1.8, 7.7, z + co * 1.8);
  tube('plain', V3(x, 7.4, z), tip, 0.06, 0.05, 5, '#8d9196');
  box('lamp', tip.x, 7.45, tip.z, 0.36, 0.2, 0.7, '#fff1c9', rot);
  addHalo(tip.x, 7.3, tip.z, '#ffe0a8', 9);
}
function lantern(x, y, z, hex, s) {
  s = s || 1;
  sph('lamp', x, y, z, 0.22 * s, 0.28 * s, 0.22 * s, hex || '#d8322a', true);
  cyl('plain', x, y + 0.24 * s, z, 0.1 * s, 0.1 * s, 0.07 * s, 6, '#2a2020');
  cyl('plain', x, y - 0.32 * s, z, 0.1 * s, 0.1 * s, 0.07 * s, 6, '#2a2020');
  addHalo(x, y, z, hex === '#f3e3b8' ? '#ffe7b0' : '#ff7a4a', 1.7 * s);
}
function lanternString(a, b, n, sag, hex) {
  wire(a, b, sag, '#2b2320', 0.01);
  for (let i = 1; i < n; i++) { const t = i / n; const x = lerp(a.x, b.x, t), z = lerp(a.z, b.z, t), y = lerp(a.y, b.y, t) - sag * 4 * t * (1 - t) - 0.35; lantern(x, y, z, hex || (i % 2 ? '#d8322a' : '#e4552c'), 0.8); }
}
function bench(x, z, rot, c) {
  const co = Math.cos(rot), si = Math.sin(rot);
  box('wood', x, 0.42, z, 1.8, 0.06, 0.45, c || '#b8865a', rot);
  box('wood', x - si * 0.2, 0.48, z - co * 0.2, 1.8, 0.4, 0.05, c || '#b8865a', rot);
  for (const d of [-0.75, 0.75]) box('plain', x + co * d, 0, z - si * d, 0.07, 0.42, 0.42, '#3a3a3a', rot);
  addCol(x, z, 0.9, 0.25, 0, 0.47, rot);
}
function stool(x, z, hex) { cyl('plain', x, 0, z, 0.15, 0.19, 0.45, 8, hex || '#d8352a'); }
function foldTable(x, z, rot, hex) { box('plain', x, 0.72, z, 0.8, 0.04, 0.8, hex || '#e8e2d6', rot); cyl('plain', x, 0, z, 0.04, 0.05, 0.72, 5, '#777'); }
function scooterParked(x, z, rot, hex) {
  const co = Math.cos(rot), si = Math.sin(rot);
  const P = (l, y, s) => [x + si * l + co * s, y, z + co * l - si * s];
  const body = hex || pick(['#e8e4dc', '#c83a2e', '#2d5fa0', '#1f1f1f', '#8fb7c9', '#f0c23c']);
  let p = P(0, 0, 0);
  box('plain', p[0], 0.28, p[2], 0.36, 0.1, 1.1, '#2a2a2a', rot);
  p = P(-0.35, 0, 0); box('plain', p[0], 0.35, p[2], 0.38, 0.38, 0.6, body, rot);
  p = P(-0.3, 0, 0); box('plain', p[0], 0.73, p[2], 0.32, 0.1, 0.7, '#1b1b1b', rot);
  p = P(0.5, 0, 0); box('plain', p[0], 0.35, p[2], 0.38, 0.6, 0.14, body, rot);
  p = P(0.56, 0, 0); tube('plain', V3(p[0], 0.9, p[2]), V3(p[0], 1.02, p[2]), 0.03, 0.03, 4, '#333');
  const hl = P(0.56, 0, -0.33), hr = P(0.56, 0, 0.33); tube('plain', V3(hl[0], 1.02, hl[2]), V3(hr[0], 1.02, hr[2]), 0.02, 0.02, 4, '#222');
  for (const l of [-0.6, 0.62]) { const w = P(l, 0, 0); addGeo('plain', GEO.cyl(6), mat(w[0], 0.22, w[2], 0, rot, Math.PI / 2, 0.22, 0.1, 0.22), '#1a1a1a'); }
  addCol(x, z, 0.3, 0.9, 0, 1.0, rot);
}
function pottedPlant(x, y, z, s) {
  s = s || 1;
  cyl('plain', x, y, z, 0.18 * s, 0.13 * s, 0.3 * s, 8, pick(['#9a5a3a', '#6f7b83', '#c9c3b6']));
  for (let i = 0; i < 4; i++) sph('plain', x + rr(-.1, .1) * s, y + (0.4 + rr(0, .2)) * s, z + rr(-.1, .1) * s, 0.2 * s, 0.24 * s, 0.2 * s, Cv('#4f8a3a', 0.2), true);
}
