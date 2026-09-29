/* ================= 09 車流、紅綠燈、遊船與漁船 ================= */
const TRAFFIC = { t: 0, a: 'G', pedGreen: false, pedFlash: false, count: 0, vehicles: [], cycle: 34 };
const ROAD = { A: -28, B: 100, C: 22, D: -140 };
function roundedLoop(pts, r) {
  const out = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const d1x = p[0] - a[0], d1z = p[1] - a[1], l1 = Math.hypot(d1x, d1z), d2x = b[0] - p[0], d2z = b[1] - p[1], l2 = Math.hypot(d2x, d2z);
    const s = [p[0] - d1x / l1 * r, p[1] - d1z / l1 * r], e = [p[0] + d2x / l2 * r, p[1] + d2z / l2 * r];
    for (let k = 0; k <= 6; k++) { const t = k / 6, u = 1 - t; out.push([u * u * s[0] + 2 * u * t * p[0] + t * t * e[0], u * u * s[1] + 2 * u * t * p[1] + t * t * e[1]]); }
  }
  return out;
}
function makePath(pts, closed) {
  const P = pts.slice(); if (closed) P.push(pts[0]);
  const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return { P, cum, L: cum[cum.length - 1] };
}
function samplePath(path, s, out) {
  const L = path.L; s = ((s % L) + L) % L;
  let lo = 0, hi = path.cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (path.cum[m] <= s) lo = m; else hi = m; }
  const a = path.P[lo], b = path.P[hi], seg = path.cum[hi] - path.cum[lo] || 1, t = (s - path.cum[lo]) / seg;
  out.x = a[0] + (b[0] - a[0]) * t; out.z = a[1] + (b[1] - a[1]) * t; out.h = Math.atan2(b[0] - a[0], b[1] - a[1]);
  return out;
}
function projectS(path, x, z) {
  let best = 1e9, bs = 0;
  for (let i = 1; i < path.P.length; i++) {
    const a = path.P[i - 1], b = path.P[i], dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1;
    const t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1), px = a[0] + dx * t, pz = a[1] + dz * t, d = Math.hypot(x - px, z - pz);
    if (d < best) { best = d; bs = path.cum[i - 1] + Math.sqrt(l2) * t; }
  }
  return bs;
}
/* 小型頂點色網格 */
function segMesh(seg, material) { const m = new THREE.Mesh(seg.geo(), material || MAT.plain); m.castShadow = true; m.receiveShadow = true; return m; }
function atlasQuadMesh(r, w, h, material) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv; uv.setXY(0, r.u0, r.v1); uv.setXY(1, r.u1, r.v1); uv.setXY(2, r.u0, r.v0); uv.setXY(3, r.u1, r.v0);
  g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(12).fill(1), 3));
  return new THREE.Mesh(g, material);
}

/* ---- 汽車：側面輪廓擠出 ---- */
function buildCar(kind, color) {
  const g = new THREE.Group();
  const L = kind === 'van' ? 4.6 : kind === 'hatch' ? 3.9 : 4.5, W = 1.72, wr = 0.32;
  const fa = kind === 'hatch' ? 3.1 : L - 0.95, ra = 0.85;
  const sh = new THREE.Shape();
  sh.moveTo(0.05, 0.3); sh.lineTo(ra - 0.42, 0.3); sh.absarc(ra, 0.32, 0.42, Math.PI, 0, true);
  sh.lineTo(fa - 0.42, 0.3); sh.absarc(fa, 0.32, 0.42, Math.PI, 0, true);
  sh.lineTo(L - 0.08, 0.32); sh.lineTo(L, 0.55);
  let win;
  if (kind === 'van') {
    sh.lineTo(L - 0.05, 0.95); sh.lineTo(L - 0.75, 1.55); sh.lineTo(L - 1.0, 1.9); sh.lineTo(0.12, 1.92); sh.lineTo(0, 1.8); sh.lineTo(0, 0.55);
    win = [[[L - 0.8, 1.05], [L - 1.05, 1.75], [L - 1.7, 1.78], [L - 1.7, 1.05]], [[L - 1.8, 1.1], [L - 1.8, 1.78], [L - 2.8, 1.78], [L - 2.8, 1.1]]];
  } else if (kind === 'hatch') {
    sh.lineTo(L - 0.06, 0.82); sh.lineTo(L - 0.9, 0.95); sh.lineTo(L - 1.55, 1.42); sh.lineTo(0.35, 1.44); sh.lineTo(0.05, 1.05); sh.lineTo(0, 0.55);
    win = [[[L - 1.0, 1.0], [L - 1.55, 1.36], [L - 2.1, 1.37], [L - 2.1, 1.0]], [[L - 2.2, 1.0], [L - 2.2, 1.37], [0.45, 1.38], [0.28, 1.02]]];
  } else {
    sh.lineTo(L - 0.06, 0.82); sh.lineTo(L - 1.1, 0.96); sh.lineTo(L - 1.85, 1.42); sh.lineTo(1.25, 1.44); sh.lineTo(0.45, 1.0); sh.lineTo(0.05, 0.93); sh.lineTo(0, 0.55);
    win = [[[L - 1.2, 1.0], [L - 1.85, 1.36], [L - 2.45, 1.37], [L - 2.45, 1.0]], [[L - 2.55, 1.0], [L - 2.55, 1.37], [1.3, 1.38], [0.62, 1.02]]];
  }
  const s = new Seg();
  const eg = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 6 });
  eg.translate(-L / 2, 0, -W / 2);
  const R = mat(0, 0, 0, 0, -Math.PI / 2, 0);
  s.add(eg, R, color);
  for (const w of win) {
    const ws = new THREE.Shape(); ws.moveTo(w[0][0], w[0][1]); for (let i = 1; i < w.length; i++) ws.lineTo(w[i][0], w[i][1]);
    const wg = new THREE.ExtrudeGeometry(ws, { depth: W + 0.12, bevelEnabled: false }); wg.translate(-L / 2, 0, -(W + 0.12) / 2);
    s.add(wg, R, '#243241');
  }
  // 前後擋風玻璃（沿斜面薄片）
  const slope = (x0, y0, x1, y1) => { const cx = (x0 + x1) / 2 - L / 2, cy = (y0 + y1) / 2, len = Math.hypot(x1 - x0, y1 - y0), ang = Math.atan2(y1 - y0, x1 - x0); s.add(GEO_BOX(), mat(0, cy + 0.03, cx, -ang, 0, 0, W * 0.86, 0.02, len * 0.9), '#2a3a4a'); };
  if (kind === 'van') slope(L - 0.75, 1.55, L - 1.0, 1.9); else if (kind === 'hatch') { slope(L - 0.9, 0.95, L - 1.55, 1.42); slope(0.05, 1.05, 0.35, 1.44); } else { slope(L - 1.1, 0.96, L - 1.85, 1.42); slope(1.25, 1.44, 0.45, 1.0); }
  s.box(W + 0.1, 0.14, 0.12, 0, 0.36, L / 2 - 0.02, '#3a3a3a').box(W + 0.1, 0.14, 0.12, 0, 0.36, -L / 2 + 0.02, '#3a3a3a');
  s.box(0.03, 0.05, 0.22, W / 2 + 0.07, 1.0, L / 2 - 1.2, color).box(0.03, 0.05, 0.22, -W / 2 - 0.07, 1.0, L / 2 - 1.2, color);
  if (kind === 'taxi') { s.box(0.55, 0.16, 0.22, 0, 1.52, 0.1, '#f7f2e0'); }
  const body = segMesh(s); g.add(body);
  const ls = new Seg();
  ls.box(0.36, 0.14, 0.04, W / 2 - 0.3, 0.68, L / 2 + 0.01, '#fff6d6').box(0.36, 0.14, 0.04, -W / 2 + 0.3, 0.68, L / 2 + 0.01, '#fff6d6');
  ls.box(0.34, 0.14, 0.04, W / 2 - 0.28, 0.78, -L / 2 - 0.01, '#d8261e').box(0.34, 0.14, 0.04, -W / 2 + 0.28, 0.78, -L / 2 - 0.01, '#d8261e');
  g.add(segMesh(ls, MAT.lamp));
  // 車牌
  const plateTxt = pick(['ABC', 'BKT', 'RAD', 'AMP', 'TNN', 'KLY', 'RBJ']) + '-' + String(ri(1000, 9899));
  const pr = ATLAS_BOARD.draw(160, 56, (gg, w, h) => drawPlate(gg, w, h, plateTxt));
  const pf = atlasQuadMesh(pr, 0.46, 0.16, MAT.boards); pf.position.set(0, 0.45, L / 2 + 0.085); g.add(pf);
  const pb = atlasQuadMesh(pr, 0.46, 0.16, MAT.boards); pb.position.set(0, 0.55, -L / 2 - 0.085); pb.rotation.y = Math.PI; g.add(pb);
  const wheels = [];
  for (const z of [L / 2 - (L - fa), -L / 2 + ra]) {
    const ws = new Seg();
    for (const x of [W / 2 - 0.05, -W / 2 + 0.05]) { ws.cyl(wr, wr, 0.22, x, 0, 0, '#1b1b1d', 1, 1, 14, 0, Math.PI / 2); ws.cyl(0.17, 0.17, 0.235, x, 0, 0, '#b9bcc0', 1, 1, 8, 0, Math.PI / 2); ws.box(0.24, 0.05, 0.3, x, 0, 0, '#8d9094'); }
    const wm = segMesh(ws); wm.position.set(0, wr, z); g.add(wm); wheels.push(wm);
  }
  return { g, wheels, len: L, wr };
}
/* ---- 機車（含騎士） ---- */
function buildScooter(color, riderSpec) {
  const g = new THREE.Group(), s = new Seg();
  s.box(0.34, 0.1, 1.05, 0, 0.3, 0, '#2a2a2a');
  s.box(0.38, 0.4, 0.62, 0, 0.36, -0.36, color); s.sph(0.2, 0, 0.62, -0.5, color, 1, 0.7, 1.6);
  s.box(0.33, 0.12, 0.7, 0, 0.78, -0.3, '#1c1c1c');
  s.box(0.4, 0.62, 0.14, 0, 0.34, 0.5, color, -0.22);
  s.cyl(0.03, 0.03, 0.4, 0, 0.95, 0.56, '#333', 1, 1, 5, -0.2);
  s.cyl(0.02, 0.02, 0.66, 0, 1.12, 0.56, '#222', 1, 1, 5, 0, Math.PI / 2);
  s.box(0.2, 0.12, 0.08, 0, 1.02, 0.66, '#f4f0e0');
  s.box(0.14, 0.08, 0.04, 0, 0.65, -0.82, '#d8261e');
  const m = segMesh(s); g.add(m);
  const wheels = [];
  for (const z of [-0.6, 0.62]) { const ws = new Seg(); ws.cyl(0.23, 0.23, 0.12, 0, 0, 0, '#161616', 1, 1, 12, 0, Math.PI / 2); ws.cyl(0.12, 0.12, 0.13, 0, 0, 0, '#9a9ea3', 1, 1, 8, 0, Math.PI / 2); const wm = segMesh(ws); wm.position.set(0, 0.23, z); g.add(wm); wheels.push(wm); }
  const rider = makeChar(riderSpec); rider.root.position.set(0, 0.0, -0.25);
  resetPose(rider.J);
  const J = rider.J; J.hips.position.y = 0.74; J.thighL.rotation.x = J.thighR.rotation.x = -1.45; J.kneeL.rotation.x = J.kneeR.rotation.x = 1.3;
  J.thighL.rotation.z = 0.12; J.thighR.rotation.z = -0.12; J.armL.rotation.x = J.armR.rotation.x = -1.1; J.elbowL.rotation.x = J.elbowR.rotation.x = -0.3;
  J.torso.rotation.x = 0.1;
  for (const o of rider.outlines) o.visible = Q.outline;
  g.add(rider.root);
  return { g, wheels, len: 1.9, wr: 0.23, rider };
}

/* ---- 號誌 ---- */
let PED_CANVAS, PED_TEX;
const SIG_MATS = {};
function drawPedSignal() {
  const g = PED_CANVAS.getContext('2d'), w = 128, h = 256;
  g.fillStyle = '#141414'; g.fillRect(0, 0, w, h);
  const man = (cx, cy, col, walk, frame) => {
    g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = 9;
    g.beginPath(); g.arc(cx, cy - 34, 9, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(cx, cy - 22); g.lineTo(cx, cy + 8); g.stroke();
    if (!walk) { g.beginPath(); g.moveTo(cx - 12, cy - 16); g.lineTo(cx - 12, cy + 4); g.moveTo(cx + 12, cy - 16); g.lineTo(cx + 12, cy + 4); g.moveTo(cx - 5, cy + 8); g.lineTo(cx - 5, cy + 36); g.moveTo(cx + 5, cy + 8); g.lineTo(cx + 5, cy + 36); g.stroke(); }
    else { const a = frame % 2 ? 1 : -1; g.beginPath(); g.moveTo(cx, cy - 16); g.lineTo(cx + 13 * a, cy); g.moveTo(cx, cy - 16); g.lineTo(cx - 13 * a, cy - 2); g.moveTo(cx, cy + 8); g.lineTo(cx + 13 * a, cy + 36); g.moveTo(cx, cy + 8); g.lineTo(cx - 10 * a, cy + 34); g.stroke(); }
  };
  const green = TRAFFIC.pedGreen && !(TRAFFIC.pedFlash && (Math.floor(TRAFFIC.t * 4) % 2));
  man(64, 70, TRAFFIC.pedGreen ? '#3a1512' : '#ff3b2f', false, 0);
  man(64, 190, green ? '#39ff8a' : '#0f2a1a', true, Math.floor(TRAFFIC.t * (TRAFFIC.pedFlash ? 5 : 2.5)));
  if (TRAFFIC.pedGreen) { g.fillStyle = '#39ff8a'; g.font = `700 30px ${FONT_SANS}`; g.textAlign = 'right'; g.fillText(String(Math.max(0, Math.ceil(TRAFFIC.count))).padStart(2, '0'), 124, 130); }
  PED_TEX.needsUpdate = true;
}
function signalHead(x, y, z, rot, grp) {
  const co = Math.cos(rot), si = Math.sin(rot);
  const hg = new THREE.Group(); hg.position.set(x, y, z); hg.rotation.y = rot; scene.add(hg);
  const hs = new Seg(); hs.box(1.15, 0.42, 0.28, 0, 0, 0, '#2b2d2f'); for (let i = -1; i <= 1; i++) hs.box(0.34, 0.06, 0.18, i * 0.36, 0.2, 0.18, '#2b2d2f');
  hg.add(segMesh(hs));
  ['R', 'Y', 'G'].forEach((k, i) => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.14, 16), SIG_MATS[grp + k]); m.position.set((i - 1) * 0.36, 0, 0.145); hg.add(m);
  });
}
function buildTrafficSignals() {
  const on = { R: '#ff2a1f', Y: '#ffc21a', G: '#1fff8a' };
  for (const grp of ['A', 'B']) for (const k of ['R', 'Y', 'G']) { SIG_MATS[grp + k] = new THREE.MeshBasicMaterial({ color: C('#2a2a2a') }); SIG_MATS[grp + k].userData.on = C(on[k]); SIG_MATS[grp + k].userData.off = C('#3a3432'); }
  PED_CANVAS = mkCanvas(128, 256); PED_TEX = mkTex(PED_CANVAS, { rep: false, mip: false });
  const pedMat = new THREE.MeshBasicMaterial({ map: PED_TEX });
  const X = ROAD.B, Z = ROAD.A;
  // 東向車流號誌：路口遠端，桿在東南角，懸臂伸向車道
  cyl('plain', X + 6.5, 0, Z + 6, 0.13, 0.16, 6.4, 8, '#9aa0a6', { col: true });
  tube('plain', V3(X + 6.5, 6.1, Z + 6), V3(X + 6.5, 6.1, Z - 1), 0.08, 0.06, 6, '#9aa0a6');
  signalHead(X + 6.5, 5.7, Z + 2, -Math.PI / 2, 'A');
  cyl('plain', X - 8.5, 0, Z - 5.5, 0.12, 0.15, 5.2, 8, '#9aa0a6', { col: true });
  signalHead(X - 8.5, 4.9, Z - 5.5, Math.PI / 2, 'A');
  // 南北向（北側支道）
  cyl('plain', X - 6, 0, Z + 5.2, 0.12, 0.15, 5.2, 8, '#9aa0a6', { col: true });
  signalHead(X - 6, 4.9, Z + 5.2, Math.PI, 'B');
  // 行人號誌（跨 A 路斑馬線兩端）
  for (const [pz, rot] of [[Z - 4.8, 0], [Z + 4.8, Math.PI]]) {
    cyl('plain', X - 7.2, 0, pz, 0.07, 0.08, 3.2, 8, '#9aa0a6', { col: true });
    const h = new THREE.Group(); h.position.set(X - 7.2, 2.6, pz); h.rotation.y = rot; scene.add(h);
    const bs = new Seg(); bs.box(0.42, 0.78, 0.2, 0, 0, 0, '#26282a'); h.add(segMesh(bs));
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.72), pedMat); p.position.z = 0.105; h.add(p);
  }
  drawPedSignal();
}
function updateTrafficLights(dt) {
  TRAFFIC.t = (TRAFFIC.t + dt) % TRAFFIC.cycle;
  const t = TRAFFIC.t;
  const a = t < 17 ? 'G' : t < 20 ? 'Y' : 'R';
  const pg = t >= 21 && t < 33; TRAFFIC.pedGreen = pg; TRAFFIC.pedFlash = t >= 28 && t < 33; TRAFFIC.count = 33 - t;
  const b = (t >= 21 && t < 30) ? 'G' : (t >= 30 && t < 33) ? 'Y' : 'R';
  if (a !== TRAFFIC.a || b !== TRAFFIC.b) {
    TRAFFIC.a = a; TRAFFIC.b = b;
    for (const k of ['R', 'Y', 'G']) { SIG_MATS['A' + k].color.copy(k === a ? SIG_MATS['A' + k].userData.on : SIG_MATS['A' + k].userData.off); SIG_MATS['B' + k].color.copy(k === b ? SIG_MATS['B' + k].userData.on : SIG_MATS['B' + k].userData.off); }
  }
  TRAFFIC.redraw = (TRAFFIC.redraw || 0) - dt;
  if (TRAFFIC.redraw <= 0) { TRAFFIC.redraw = 0.2; drawPedSignal(); }
}

/* ---- 車流 ---- */
const _sp = { x: 0, z: 0, h: 0 };
function buildTraffic() {
  const r = 5;
  const carPath = makePath(roundedLoop([[ROAD.D + 2, ROAD.A + 2], [ROAD.B - 2, ROAD.A + 2], [ROAD.B - 2, ROAD.C - 2], [ROAD.D + 2, ROAD.C - 2]], r), true);
  const motoPath = makePath(roundedLoop([[ROAD.D + 3.3, ROAD.A + 3.3], [ROAD.B - 3.3, ROAD.A + 3.3], [ROAD.B - 3.3, ROAD.C - 3.3], [ROAD.D + 3.3, ROAD.C - 3.3]], r - 1.3), true);
  TRAFFIC.carPath = carPath; TRAFFIC.motoPath = motoPath;
  TRAFFIC.carStop = projectS(carPath, ROAD.B - 12.5, ROAD.A + 2);
  TRAFFIC.motoStop = projectS(motoPath, ROAD.B - 9.2, ROAD.A + 3.3);
  const cars = [['sedan', '#f2f2ee'], ['taxi', '#f2c230'], ['hatch', '#c8372d'], ['sedan', '#9aa3ab'], ['van', '#eef0f0'], ['hatch', '#2d5c93'], ['sedan', '#1f2226']];
  cars.forEach((c, i) => {
    const v = buildCar(c[0], c[1]); scene.add(v.g);
    TRAFFIC.vehicles.push({ kind: 'car', path: carPath, s: i / cars.length * carPath.L, v: 8, vmax: rr(8, 10.5), m: v, stop: TRAFFIC.carStop });
  });
  const riders = [
    { skin: '#f1d0bb', top: '#2d4f7c', bottom: '#2a2a2a', bottomType: 'pants', hat: 'helmet', hatCol: '#f4f4f4', hair: '#231816', hairStyle: 'short', male: true, face: { eye: '#3b2a22', male: true } },
    { skin: '#f6d7c3', top: '#f0e6d8', bottom: '#4a5a78', bottomType: 'pants', hat: 'helmet', hatCol: '#e76f7e', hair: '#3a2418', hairStyle: 'long', female: true, face: { eye: '#6b3b2b', blush: true }, armCover: '#9fc2de' },
    { skin: '#e8c0a4', top: '#8a3a2a', bottom: '#2e2e2e', bottomType: 'pants', hat: 'helmet', hatCol: '#2a2a2a', hair: '#1c1412', hairStyle: 'short', face: { eye: '#3b2a22', male: true } },
    { skin: '#f6d7c3', top: '#ffffff', bottom: '#1f2d4a', bottomType: 'pants', hat: 'helmet', hatCol: '#7fb8d8', hair: '#2b1d18', hairStyle: 'bob', female: true, face: { eye: '#5a3a8a', blush: true } },
    { skin: '#efc9ae', top: '#4d7a4a', bottom: '#3a3a3a', bottomType: 'pants', hat: 'helmet', hatCol: '#f2c230', hair: '#241a16', hairStyle: 'short', face: { eye: '#3b2a22', male: true } },
    { skin: '#f3d2bd', top: '#d8a1b8', bottom: '#2a2a2a', bottomType: 'pants', hat: 'helmet', hatCol: '#ffffff', hair: '#3a2418', hairStyle: 'pony', female: true, face: { eye: '#3a5a8a', blush: true }, armCover: '#f0f0f0' },
  ];
  const cols = ['#e8e4dc', '#c83a2e', '#2d5fa0', '#1f1f1f', '#8fb7c9', '#f0c23c'];
  riders.forEach((rs, i) => {
    const v = buildScooter(cols[i % cols.length], rs); scene.add(v.g);
    TRAFFIC.vehicles.push({ kind: 'moto', path: motoPath, s: (i + 0.5) / riders.length * motoPath.L, v: 7, vmax: rr(8.5, 11), m: v, stop: TRAFFIC.motoStop });
  });
}
function updateTraffic(dt) {
  updateTrafficLights(dt);
  const Vs = TRAFFIC.vehicles;
  for (const kind of ['car', 'moto']) {
    const list = Vs.filter(v => v.kind === kind).sort((a, b) => a.s - b.s);
    const L = list[0].path.L;
    for (let i = 0; i < list.length; i++) {
      const v = list[i], ahead = list[(i + 1) % list.length];
      let gap = ahead.s - v.s; if (gap <= 0) gap += L;
      gap -= (ahead.m.len + v.m.len) / 2;
      let want = v.vmax;
      if (gap < 16) want = Math.min(want, Math.max(0, (gap - 2.2) * 0.8));
      const front = v.s + v.m.len / 2;
      let d = v.stop - front; if (d < -L / 2) d += L;
      if (TRAFFIC.a !== 'G' && d > -0.3 && d < 32) {
        if (!(TRAFFIC.a === 'Y' && d < 5)) want = Math.min(want, Math.max(0, d * 0.55 - 0.1));
      }
      const acc = want > v.v ? 2.8 : 7;
      v.v += clamp(want - v.v, -acc * dt, acc * dt); if (v.v < 0.02 && want === 0) v.v = 0;
      v.s = (v.s + v.v * dt) % L;
      samplePath(v.path, v.s, _sp);
      const g = v.m.g; g.position.set(_sp.x, 0, _sp.z);
      let dh = _sp.h - g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); g.rotation.y += dh * Math.min(1, dt * 8);
      for (const w of v.m.wheels) w.rotation.x += v.v * dt / v.m.wr;
    }
  }
}

/* ---- 運河遊船與漁船 ---- */
const BOATS = { tour: null, bob: [] };
function hullShape(w, l, bow) {
  const s = new THREE.Shape(); const hw = w / 2, hl = l / 2;
  s.moveTo(-hw, -hl); s.lineTo(hw, -hl); s.lineTo(hw, hl - bow); s.quadraticCurveTo(hw, hl - bow * 0.2, 0, hl); s.quadraticCurveTo(-hw, hl - bow * 0.2, -hw, hl - bow); s.lineTo(-hw, -hl);
  return s;
}
function hullGeo(w, l, bow, depth) { const g = new THREE.ExtrudeGeometry(hullShape(w, l, bow), { depth, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 2 }); g.rotateX(Math.PI / 2); return g; }
function buildTourBoat() {
  const g = new THREE.Group(); const s = new Seg();
  s.add(hullGeo(4.2, 14, 3, 1.3), mat(0, 1.0, 0), '#f4f4f0');
  s.add(hullGeo(4.3, 14.1, 3, 0.2), mat(0, 0.75, 0), '#1f5f9a');
  s.box(4.0, 0.08, 11, 0, 1.0, -0.8, '#c9b48a');
  for (let r = 0; r < 6; r++) for (const x of [-1.15, 1.15]) { s.box(1.3, 0.42, 0.45, x, 1.08, -5 + r * 1.55, '#2f6fae'); s.box(1.3, 0.5, 0.08, x, 1.4, -5.2 + r * 1.55, '#2f6fae'); }
  for (const x of [-1.95, 1.95]) for (let z = -5.8; z <= 4.2; z += 2) s.cyl(0.05, 0.05, 2.1, x, 2.1, z, '#dcdcdc');
  s.box(4.3, 0.12, 11.2, 0, 3.2, -0.8, '#f7f7f2').box(4.4, 0.25, 11.3, 0, 3.02, -0.8, '#c0392b');
  s.box(3.2, 1.3, 2.0, 0, 1.65, -6.4, '#f4f4f0');
  for (const x of [-1.95, 1.95]) s.box(0.02, 0.5, 10, x, 1.4, -0.8, '#dcdcdc');
  const hm = segMesh(s); g.add(hm);
  const wr = new Seg(); wr.box(3.22, 0.5, 2.02, 0, 1.8, -6.4, '#ffe2a8'); g.add(segMesh(wr, MAT.window));
  const nr = ATLAS_BOARD.draw(512, 96, (gg, w, h) => drawSignH(gg, w, h, { name: '安平運河遊船', en: 'ANPING CANAL CRUISE', style: 'blue' }));
  for (const sd of [1, -1]) { const p = atlasQuadMesh(nr, 3.6, 0.68, MAT.boards); p.position.set(sd * 2.22, 3.02, -0.8); p.rotation.y = sd * Math.PI / 2; g.add(p); }
  // 乘客
  const pax = [
    { skin: '#f6d7c3', top: '#f5e6c8', bottom: '#5a6b8a', bottomType: 'pants', hair: '#2b1d18', hairStyle: 'long', female: true, face: { eye: '#6a3b2a', blush: true }, hat: 'straw' },
    { skin: '#efc9ae', top: '#3d6e9e', bottom: '#2e2e2e', bottomType: 'shorts', hair: '#1c1412', hairStyle: 'short', face: { eye: '#3b2a22', male: true }, hat: 'cap', hatCol: '#2d5c93' },
    { skin: '#f6d7c3', top: '#ffffff', bottom: '#1f2d4a', bottomType: 'skirt', hair: '#3a2418', hairStyle: 'twin', female: true, face: { eye: '#3a6fb0', blush: true }, socks: '#fff', shoes: '#2a2426' },
    { skin: '#e9c3a8', top: '#e0773a', bottom: '#3a3a3a', bottomType: 'pants', hair: '#6b6b6b', hairStyle: 'bun', female: true, face: { eye: '#3b2a22', old: true } },
  ];
  pax.forEach((p, i) => { const c = makeChar(p); resetPose(c.J); poseSit(c); c.J.armL.rotation.x = c.J.armR.rotation.x = -0.4; c.root.position.set(i % 2 ? 1.15 : -1.15, 0.85, -4.6 + i * 2.6); c.root.scale.setScalar(0.95); for (const o of c.outlines) o.visible = false; g.add(c.root); });
  scene.add(g);
  const arc = (cx, a0, a1) => { const o = []; for (let k = 0; k <= 8; k++) { const a = a0 + (a1 - a0) * k / 8; o.push([cx + Math.cos(a) * 3.5, 50 + Math.sin(a) * 3.5]); } return o; };
  const path = makePath([[175, 46.5], [-118, 46.5]].concat(arc(-118, -Math.PI / 2, -Math.PI * 1.5).slice(1, -1), [[-118, 53.5], [175, 53.5]], arc(175, Math.PI / 2, -Math.PI / 2).slice(1, -1)), true);
  BOATS.tour = { g, path, s: 60, v: 3, dock: projectS(path, -26, 46.5), wait: 0, state: 'go', horn: 0 };
}
function buildFishingBoat(x, z, rot, c) {
  const g = new THREE.Group(); const s = new Seg();
  s.add(hullGeo(3.4, 11, 2.6, 1.2), mat(0, 0.8, 0), '#f5f5f2');
  s.add(hullGeo(3.45, 11.05, 2.6, 0.25), mat(0, 0.55, 0), c || '#2b5da8');
  s.add(hullGeo(3.3, 10.8, 2.6, 0.35), mat(0, -0.15, 0), '#a33a2e');
  s.box(1.8, 1.4, 2.2, 0, 0.85, -1.8, '#f5f5f2').box(2.0, 0.1, 2.4, 0, 2.25, -1.8, '#2b5da8');
  s.cyl(0.06, 0.05, 5, 0, 0.8, 1.5, '#dcdcdc');
  for (let i = 0; i < 6; i++) s.sph(0.1, 0, 2.2 + i * 0.5, 1.5, '#fff3c4');
  s.box(0.02, 0.5, 0.8, 0.03, 5.2, 1.9, '#d8322a').box(0.02, 0.4, 0.6, 0.03, 4.7, 1.8, '#f2c230');
  g.add(segMesh(s));
  const w = new Seg(); w.box(1.82, 0.45, 2.22, 0, 1.55, -1.8, '#ffe2a8'); g.add(segMesh(w, MAT.window));
  const er = ATLAS_BOARD.eye || (ATLAS_BOARD.eye = ATLAS_BOARD.draw(96, 96, (gg, W, H) => { gg.fillStyle = '#f5f5f2'; gg.fillRect(0, 0, W, H); gg.fillStyle = '#d8322a'; gg.beginPath(); gg.arc(48, 48, 40, 0, TAU); gg.fill(); gg.fillStyle = '#fff'; gg.beginPath(); gg.arc(48, 48, 32, 0, TAU); gg.fill(); gg.fillStyle = '#111'; gg.beginPath(); gg.arc(48, 62, 17, 0, TAU); gg.fill(); }));
  for (const sd of [1, -1]) { const e = atlasQuadMesh(er, 0.7, 0.7, MAT.boards); e.position.set(sd * 1.1, 0.35, 4.3); e.rotation.y = sd * (Math.PI / 2 - 0.45); g.add(e); }
  g.position.set(x, -0.62, z); g.rotation.y = rot; scene.add(g);
  BOATS.bob.push({ g, ph: rnd() * TAU, y: -0.62, rot });
}
function buildJunk(x, z, rot) {
  const g = new THREE.Group(), s = new Seg();
  s.add(hullGeo(6, 24, 5, 2.4), mat(0, 1.9, 0), '#6b4228');
  s.box(5.6, 0.12, 20, 0, 1.9, -1, '#8a6038');
  s.box(5.8, 2.6, 5, 0, 1.9, -9.5, '#5c3820').box(5.9, 0.3, 5.2, 0, 4.5, -9.5, '#b3261e');
  s.box(5.0, 1.2, 3, 0, 1.9, 9, '#5c3820');
  for (let i = 0; i < 3; i++) s.box(6.1, 0.18, 0.18, 0, 1.5 + i * 0.4, 0, '#c9a24a');
  const masts = [[0, 1.5, 17], [0, -3.5, 13], [0, 8, 10]];
  for (const m of masts) s.cyl(0.18, 0.24, m[2], m[0], 1.9, m[1], '#4a2e1c');
  g.add(segMesh(s));
  const sr = ATLAS_BOARD.sail || (ATLAS_BOARD.sail = ATLAS_BOARD.draw(128, 192, (gg, W, H) => { gg.fillStyle = '#9c4a2e'; gg.fillRect(0, 0, W, H); gg.strokeStyle = '#5a2a18'; gg.lineWidth = 4; for (let y = 8; y < H; y += 22) { gg.beginPath(); gg.moveTo(0, y); gg.lineTo(W, y); gg.stroke(); } gg.fillStyle = 'rgba(255,220,180,.12)'; gg.fillRect(0, 0, W / 2, H); }));
  for (const [i, m] of masts.entries()) { const hgt = m[2] * 0.62, wid = hgt * 0.62; for (const sd of [1, -1]) { const p = atlasQuadMesh(sr, wid, hgt, MAT.boards); p.position.set(0.02 * sd, 1.9 + m[2] - hgt / 2 - 0.8, m[1] - wid * 0.25); p.rotation.y = sd * Math.PI / 2; g.add(p); } }
  g.position.set(x, -0.62, z); g.rotation.y = rot; scene.add(g);
  BOATS.bob.push({ g, ph: rnd() * TAU, y: -0.62, rot, slow: true });
}
function updateBoats(dt, time) {
  for (const b of BOATS.bob) { b.g.position.y = b.y + Math.sin(time * (b.slow ? 0.7 : 1.1) + b.ph) * 0.08; b.g.rotation.z = Math.sin(time * 0.9 + b.ph) * (b.slow ? 0.015 : 0.035); b.g.rotation.x = Math.sin(time * 0.7 + b.ph * 2) * 0.012; }
  const T = BOATS.tour; if (!T) return;
  const L = T.path.L;
  let d = T.dock - T.s; if (d < 0) d += L;
  if (T.state === 'go') {
    let want = 3.2;
    if (d < 25) want = Math.max(0.25, d * 0.14);
    if (d < 0.25) { T.state = 'dock'; T.wait = 14; T.v = 0; if (typeof SFX !== 'undefined') SFX.bell(T.g.position); }
    T.v += clamp(want - T.v, -0.9 * dt, 0.6 * dt);
  } else { T.wait -= dt; T.v = 0; if (T.wait <= 0) { T.state = 'go'; T.s += 0.3; if (typeof SFX !== 'undefined') SFX.horn(T.g.position); } }
  T.s = (T.s + T.v * dt) % L;
  samplePath(T.path, T.s, _sp);
  T.g.position.set(_sp.x, -0.62 + Math.sin(time * 1.2) * 0.04, _sp.z);
  let dh = _sp.h - T.g.rotation.y; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); T.g.rotation.y += dh * Math.min(1, dt * 1.5);
  T.g.rotation.z = Math.sin(time * 0.9) * 0.012;
}
