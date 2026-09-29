'use strict';
/* ================= 01 核心：工具、渲染器、畫質、碰撞 ================= */
const TAU = Math.PI * 2, DEG = Math.PI / 180;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let rnd = mulberry32(1624);
function reseed(s) { rnd = mulberry32(s); }
const R = () => rnd();
const rr = (a, b) => a + (b - a) * rnd();
const ri = (a, b) => Math.floor(a + (b - a + 1) * rnd());
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
const _cc = new Map();
function C(h) { let c = _cc.get(h); if (!c) { c = new THREE.Color(h).convertSRGBToLinear(); _cc.set(h, c); } return c; }
function Cv(h, v) { return C(h).clone().multiplyScalar(1 + (rnd() * 2 - 1) * v); }
function Cmix(a, b, t) { return C(a).clone().lerp(C(b), t); }
const isTouch = matchMedia('(pointer:coarse)').matches && ('ontouchstart' in window);

const PREF = {
  get(k, d) { try { const v = localStorage.getItem('anping.' + k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('anping.' + k, v); } catch (e) { } }
};

const DPR = window.devicePixelRatio || 1;
const QUALITY = {
  high: { pr: Math.min(DPR, 2), shadow: 2048, chars: 30, outline: true, foliage: 1, petals: 5000, shadows: true, lod: 70 },
  mid: { pr: Math.min(DPR, 1.25), shadow: 1024, chars: 22, outline: true, foliage: 0.62, petals: 2400, shadows: true, lod: 50 },
  low: { pr: Math.min(DPR, 1) * 0.8, shadow: 512, chars: 12, outline: false, foliage: 0.38, petals: 800, shadows: false, lod: 34 },
};
let QKEY = PREF.get('q', isTouch ? 'low' : 'mid'); if (!QUALITY[QKEY]) QKEY = 'mid';
let Q = QUALITY[QKEY];

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(Q.pr);
let VIEW_W = 0, VIEW_H = 0;
function fitRenderer(force) {
  const w = canvas.clientWidth || innerWidth || 800, h = canvas.clientHeight || innerHeight || 600;
  if (!force && w === VIEW_W && h === VIEW_H) return false;
  VIEW_W = w; VIEW_H = h; renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  return true;
}
const MAXANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(68, (VIEW_W || 1) / (VIEW_H || 1), 0.08, 1500);
camera.rotation.order = 'YXZ';
scene.add(camera);
fitRenderer(true);

/* 全域共用 uniform */
const U = {
  time: { value: 0 }, wind: { value: 1 }, glow: { value: 0 }, night: { value: 0 },
  sunDir: { value: new THREE.Vector3(-0.5, 0.7, 0.3).normalize() },
  folLight: { value: new THREE.Color(1, 1, 1) }, folShade: { value: new THREE.Color(0.5, 0.4, 0.5) },
  pr: { value: renderer.getPixelRatio() },
};
const updaters = [];
function onUpdate(fn) { updaters.push(fn); }

/* ---------- 碰撞：定向方塊，網格加速 ---------- */
const COL = { cell: 8, grid: new Map(), list: [] };
const STEP = 0.55;
function addCol(cx, cz, hx, hz, y0, y1, rot) {
  rot = rot || 0;
  const c = { cx, cz, hx, hz, y0, y1, co: Math.cos(rot), si: Math.sin(rot) };
  const ex = Math.abs(hx * c.co) + Math.abs(hz * c.si) + 1, ez = Math.abs(hx * c.si) + Math.abs(hz * c.co) + 1;
  const i0 = Math.floor((cx - ex) / COL.cell), i1 = Math.floor((cx + ex) / COL.cell);
  const j0 = Math.floor((cz - ez) / COL.cell), j1 = Math.floor((cz + ez) / COL.cell);
  for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
    const k = i + ',' + j; let a = COL.grid.get(k); if (!a) { a = []; COL.grid.set(k, a); } a.push(c);
  }
  COL.list.push(c);
  return c;
}
const _EMPTY = [];
function colsAt(x, z) { return COL.grid.get(Math.floor(x / COL.cell) + ',' + Math.floor(z / COL.cell)) || _EMPTY; }
let baseGround = (x, z) => 0;
function floorAt(x, z, feet) {
  let h = baseGround(x, z);
  const a = colsAt(x, z);
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    if (c.y1 <= h || c.y1 > feet + STEP) continue;
    const dx = x - c.cx, dz = z - c.cz;
    const lx = dx * c.co - dz * c.si, lz = dx * c.si + dz * c.co;
    if (Math.abs(lx) <= c.hx + 0.12 && Math.abs(lz) <= c.hz + 0.12) h = c.y1;
  }
  return h;
}
function ceilAt(x, z, head) {
  let h = 1e9; const a = colsAt(x, z);
  for (let i = 0; i < a.length; i++) {
    const c = a[i]; if (c.y0 < head - 0.3) continue;
    const dx = x - c.cx, dz = z - c.cz;
    const lx = dx * c.co - dz * c.si, lz = dx * c.si + dz * c.co;
    if (Math.abs(lx) <= c.hx && Math.abs(lz) <= c.hz && c.y0 < h) h = c.y0;
  }
  return h;
}
function pushOut(p, feet, r, height) {
  const a = colsAt(p.x, p.z);
  for (let i = 0; i < a.length; i++) {
    const c = a[i];
    if (c.y1 <= feet + STEP || c.y0 >= feet + height) continue;
    const dx = p.x - c.cx, dz = p.z - c.cz;
    let lx = dx * c.co - dz * c.si, lz = dx * c.si + dz * c.co;
    const qx = clamp(lx, -c.hx, c.hx), qz = clamp(lz, -c.hz, c.hz);
    const ex = lx - qx, ez = lz - qz, dd = ex * ex + ez * ez;
    if (dd >= r * r) continue;
    if (dd > 1e-9) { const d = Math.sqrt(dd); lx += ex / d * (r - d); lz += ez / d * (r - d); }
    else {
      const ox = c.hx - Math.abs(lx), oz = c.hz - Math.abs(lz);
      if (ox < oz) lx = (Math.sign(lx) || 1) * (c.hx + r); else lz = (Math.sign(lz) || 1) * (c.hz + r);
    }
    p.x = c.cx + c.co * lx + c.si * lz;
    p.z = c.cz - c.si * lx + c.co * lz;
  }
}

/* ---------- 小工具 ---------- */
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
function mat(x, y, z, rx, ry, rz, sx, sy, sz) {
  _e.set(rx || 0, ry || 0, rz || 0, 'YXZ'); _q.setFromEuler(_e);
  _p.set(x, y, z); _s.set(sx == null ? 1 : sx, sy == null ? (sx == null ? 1 : sx) : sy, sz == null ? (sx == null ? 1 : sx) : sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}
const _up = new THREE.Vector3(0, 1, 0);
/* 從 a 到 b 的圓柱變換（圓柱原生沿 y 軸，高度 1，中心在原點） */
function matBetween(a, b, rx, rz) {
  const d = new THREE.Vector3().subVectors(b, a); const L = d.length();
  const q = new THREE.Quaternion().setFromUnitVectors(_up, d.clone().normalize());
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(rx, L, rz == null ? rx : rz));
  return m;
}
function fmtTime(s) { s = Math.max(0, Math.floor(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
