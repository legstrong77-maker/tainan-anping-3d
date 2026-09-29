/* ================= 08 人物：動漫風角色、關節動畫、行為 ================= */
const TOON_GRAD = (() => { const d = new Uint8Array([118, 118, 118, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 2, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
let TOON, TOON_DS, OUTLINE_MAT;
const FACE_MATS = {};
function initPeopleMats() {
  TOON = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_GRAD });
  TOON_DS = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_GRAD, side: THREE.DoubleSide });
  OUTLINE_MAT = new THREE.ShaderMaterial({
    uniforms: { uW: { value: 0.012 }, uC: { value: C('#2a1d24') } }, side: THREE.BackSide,
    vertexShader: `uniform float uW;void main(){vec3 p=position+normal*uW;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `uniform vec3 uC;void main(){gl_FragColor=vec4(uC,1.);
    #include <encodings_fragment>
    }`
  });
}
function faceMat(o) {
  const key = JSON.stringify(o);
  if (!FACE_MATS[key]) {
    const mk = (closed) => new THREE.MeshLambertMaterial({ map: drawFace(o, closed), transparent: true, alphaTest: 0.35, depthWrite: false });
    FACE_MATS[key] = [mk(false), mk(true)];
  }
  return FACE_MATS[key];
}
/* 部件幾何：頂點色合併 */
class Seg {
  constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, m, col) {
    col = col3(col); if (geo.index) geo = geo.toNonIndexed();
    const p = geo.attributes.position, n = geo.attributes.normal; _nm.getNormalMatrix(m);
    for (let i = 0; i < p.count; i++) {
      _gv.fromBufferAttribute(p, i).applyMatrix4(m); _gn.fromBufferAttribute(n, i).applyMatrix3(_nm).normalize();
      this.p.push(_gv.x, _gv.y, _gv.z); this.n.push(_gn.x, _gn.y, _gn.z); this.c.push(col.r, col.g, col.b);
    }
    return this;
  }
  cyl(rt, rb, h, x, y, z, col, sx, sz, n, rx, rz) { return this.add(new THREE.CylinderGeometry(rt, rb, h, n || 9), mat(x, y, z, rx || 0, 0, rz || 0, sx || 1, 1, sz || 1), col); }
  sph(r, x, y, z, col, sx, sy, sz) { return this.add(GEO.sphere(), mat(x, y, z, 0, 0, 0, r * (sx || 1), r * (sy || 1), r * (sz || 1)), col); }
  box(w, h, d, x, y, z, col, rx, ry, rz) { return this.add(GEO_BOX(), mat(x, y, z, rx || 0, ry || 0, rz || 0, w, h, d), col); }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere(); return g;
  }
}
const GEO_BOX = () => geoNI('box1', () => new THREE.BoxGeometry(1, 1, 1));
const PEOPLE = [];

function partMesh(parent, seg, ds, outline) {
  const g = seg.geo();
  const m = new THREE.Mesh(g, ds ? TOON_DS : TOON); m.castShadow = true;
  parent.add(m);
  if (outline) { const o = new THREE.Mesh(g, OUTLINE_MAT); o.userData.outline = true; parent.add(o); }
  return m;
}

/* 角色規格 → 3D 角色 */
function makeChar(sp) {
  const s = sp.scale || 1;
  const skin = sp.skin || '#f6d7c3', top = sp.top || '#ffffff', bottom = sp.bottom || '#23324f';
  const root = new THREE.Group(); root.scale.setScalar(s);
  const J = {};
  const hipY = 0.84;
  J.hips = new THREE.Group(); J.hips.position.y = hipY; root.add(J.hips);
  // 骨盆＋裙／褲
  const hs = new Seg();
  if (sp.bottomType === 'skirt') {
    hs.cyl(0.125, 0.13, 0.12, 0, 0.1, 0, bottom, 1, 0.8);
    const sk = new THREE.CylinderGeometry(0.13, sp.skirtW || 0.25, 0.3, 14, 1, true); hs.add(sk, mat(0, -0.07, 0, 0, 0, 0, 1, 1, 0.85), bottom);
    if (sp.pleats) for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; hs.box(0.012, 0.28, 0.01, Math.sin(a) * 0.19, -0.07, Math.cos(a) * 0.19 * 0.85, sp.pleats, 0.28 * Math.cos(a) * 0, a, 0); }
  } else if (sp.bottomType === 'apron') {
    hs.cyl(0.13, 0.14, 0.2, 0, 0.05, 0, bottom, 1, 0.8); hs.box(0.26, 0.42, 0.02, 0, -0.08, 0.13, sp.apron || '#6d8fb3');
  } else { hs.cyl(0.13, 0.14, 0.2, 0, 0.05, 0, bottom, 1, 0.8); }
  if (sp.belt) hs.cyl(0.132, 0.132, 0.03, 0, 0.14, 0, sp.belt, 1, 0.82);
  partMesh(J.hips, hs, sp.bottomType === 'skirt', true);
  // 腿
  const legLen = 0.4;
  for (const side of [1, -1]) {
    const L = side > 0 ? 'L' : 'R';
    const th = new THREE.Group(); th.position.set(side * 0.072, -0.02, 0); J.hips.add(th); J['thigh' + L] = th;
    const ts = new Seg();
    const thighCol = (sp.bottomType === 'pants' || sp.bottomType === 'apron') ? bottom : (sp.bottomType === 'shorts' ? (sp.shortsCol || bottom) : skin);
    ts.cyl(0.072, 0.056, legLen, 0, -legLen / 2, 0, thighCol);
    if (sp.bottomType === 'shorts') ts.cyl(0.074, 0.07, 0.22, 0, -0.11, 0, sp.shortsCol || bottom);
    ts.sph(0.056, 0, -legLen, 0, thighCol);
    partMesh(th, ts, false, true);
    const kn = new THREE.Group(); kn.position.y = -legLen; th.add(kn); J['knee' + L] = kn;
    const ks = new Seg();
    const shinCol = sp.bottomType === 'pants' || sp.bottomType === 'apron' ? bottom : skin;
    ks.cyl(0.054, 0.04, legLen, 0, -legLen / 2, 0, shinCol);
    if (sp.socks) ks.cyl(0.047, 0.042, sp.socksH || 0.16, 0, -legLen + (sp.socksH || 0.16) / 2, 0, sp.socks);
    if (sp.boots) ks.cyl(0.06, 0.055, 0.3, 0, -legLen + 0.15, 0, sp.boots);
    const shoe = sp.boots || sp.shoes || '#2a2426';
    ks.box(0.095, 0.07, 0.22, 0, -legLen - 0.02, 0.045, shoe);
    partMesh(kn, ks, false, true);
  }
  // 軀幹
  J.torso = new THREE.Group(); J.torso.position.y = 0.1; J.hips.add(J.torso);
  const tsg = new Seg();
  tsg.cyl(0.155, 0.12, 0.42, 0, 0.21, 0, top, 1, 0.72);
  tsg.sph(0.155, 0, 0.42, 0, top, 1, 0.45, 0.72);
  if (sp.female) tsg.sph(0.07, 0.055, 0.29, 0.07, top, 1, 0.9, 0.8).sph(0.07, -0.055, 0.29, 0.07, top, 1, 0.9, 0.8);
  if (sp.vest) tsg.cyl(0.158, 0.124, 0.36, 0, 0.19, 0, sp.vest, 1, 0.74);
  if (sp.sailor) { tsg.box(0.3, 0.02, 0.16, 0, 0.44, -0.07, sp.sailor, 0.25); tsg.box(0.2, 0.14, 0.02, 0, 0.36, 0.105, sp.sailor, -0.2); }
  if (sp.ribbon) { tsg.box(0.1, 0.05, 0.03, 0, 0.36, 0.115, sp.ribbon); tsg.box(0.03, 0.09, 0.02, -0.02, 0.3, 0.115, sp.ribbon, 0, 0, 0.3); tsg.box(0.03, 0.09, 0.02, 0.02, 0.3, 0.115, sp.ribbon, 0, 0, -0.3); }
  if (sp.tie) tsg.box(0.035, 0.2, 0.02, 0, 0.28, 0.113, sp.tie);
  if (sp.pattern) for (let i = 0; i < 14; i++) { const a = rr(-1.2, 1.2), y = rr(0.05, 0.4); tsg.sph(0.018, Math.sin(a) * 0.14, y, Math.cos(a) * 0.1, pick(sp.pattern), 1, 1, 0.5); }
  if (sp.embroid) tsg.box(0.06, 0.012, 0.01, -0.07, 0.34, 0.112, sp.embroid);
  if (sp.bag) tsg.box(0.24, 0.3, 0.12, 0, 0.24, -0.16, sp.bag);
  if (sp.sling) { tsg.box(0.03, 0.5, 0.02, 0.02, 0.22, 0.1, sp.sling, 0, 0, 0.7); tsg.box(0.18, 0.2, 0.06, 0.14, 0.02, 0.1, sp.sling); }
  tsg.cyl(0.045, 0.05, 0.1, 0, 0.5, 0, skin);
  if (sp.cape) tsg.box(0.36, 0.5, 0.03, 0, 0.18, -0.12, sp.cape, 0.12);
  partMesh(J.torso, tsg, false, true);
  // 頭
  J.head = new THREE.Group(); J.head.position.y = 0.53; J.torso.add(J.head);
  const HR = 0.135, hy = 0.13;
  const hd = new Seg();
  hd.sph(HR, 0, hy, 0, skin, 1, 1.03, 1);
  hd.sph(0.03, HR * 0.98, hy - 0.01, 0, skin, 0.5, 1, 1).sph(0.03, -HR * 0.98, hy - 0.01, 0, skin, 0.5, 1, 1);
  const hc = sp.hair || '#2b1d18', st = sp.hairStyle || 'short';
  // 頭髮殼
  hd.add(new THREE.SphereGeometry(HR * 1.08, 16, 10, 0, TAU, 0, Math.PI * 0.42), mat(0, hy + 0.005, 0), hc);
  hd.add(new THREE.SphereGeometry(HR * 1.09, 14, 10, Math.PI * 0.5 + 0.95, TAU - 1.9, 0, Math.PI * (st === 'short' || st === 'buzz' ? 0.58 : 0.66)), mat(0, hy, 0), hc);
  // 一撮一撮的瀏海
  const nb = st === 'buzz' ? 0 : 7;
  for (let i = 0; i < nb; i++) {
    const a = (i - (nb - 1) / 2) * 0.24, len = (st === 'short' ? 0.085 : 0.1) + (i % 2) * 0.025;
    const x = Math.sin(a) * HR * 1.02, z = Math.cos(a) * HR * 1.02;
    hd.add(GEO.cone(4), mat(x, hy + 0.06 - len * 0.3, z * 0.98, Math.PI + 0.25, a, -Math.sin(a) * 0.35, 0.034, len, 0.02), hc);
  }
  if (st !== 'buzz' && st !== 'short') for (const sx of [1, -1]) hd.add(GEO.cone(4), mat(sx * HR * 0.95, hy - 0.04, HR * 0.35, Math.PI, 0, sx * 0.12, 0.03, 0.16, 0.025), hc);
  if (st === 'long') { hd.add(new THREE.CylinderGeometry(HR * 1.02, HR * 1.12, 0.36, 12, 1, true, 0.9, TAU - 1.8), mat(0, hy - 0.16, -0.01), hc); }
  if (st === 'bob') { hd.add(new THREE.CylinderGeometry(HR * 1.1, HR * 1.18, 0.15, 14, 1, true, 0.8, TAU - 1.6), mat(0, hy - 0.06, 0), hc); }
  if (st === 'bun') hd.sph(0.07, 0, hy + 0.11, -0.08, hc);
  if (st === 'short') hd.add(new THREE.CylinderGeometry(HR * 1.06, HR * 1.02, 0.08, 12, 1, true, 1.1, TAU - 2.2), mat(0, hy - 0.02, 0), hc);
  // 帽子
  if (sp.hat === 'douli') { hd.add(new THREE.ConeGeometry(0.36, 0.2, 18), mat(0, hy + 0.17, 0), '#d9c28a'); if (sp.scarf) hd.add(new THREE.CylinderGeometry(HR * 1.12, HR * 1.14, 0.18, 12, 1, true, 0.8, TAU - 1.6), mat(0, hy - 0.04, 0), sp.scarf); }
  if (sp.hat === 'cap') { hd.add(new THREE.SphereGeometry(HR * 1.12, 14, 8, 0, TAU, 0, Math.PI * 0.5), mat(0, hy + 0.02, 0), sp.hatCol || '#c83a2e'); hd.box(0.2, 0.015, 0.12, 0, hy + 0.03, HR + 0.03, sp.hatCol || '#c83a2e'); }
  if (sp.hat === 'straw') { hd.add(new THREE.CylinderGeometry(0.3, 0.3, 0.015, 20), mat(0, hy + 0.06, 0), '#e6cf8f'); hd.add(new THREE.CylinderGeometry(0.11, 0.14, 0.1, 14), mat(0, hy + 0.11, 0), '#e6cf8f'); hd.add(new THREE.CylinderGeometry(0.142, 0.142, 0.025, 14), mat(0, hy + 0.075, 0), sp.hatCol || '#b3261e'); }
  if (sp.hat === 'helmet') { hd.add(new THREE.SphereGeometry(HR * 1.22, 14, 9, 0, TAU, 0, Math.PI * 0.56), mat(0, hy + 0.01, 0), sp.hatCol || '#f2f2f2'); }
  if (sp.hat === 'dutch') { hd.add(new THREE.CylinderGeometry(0.28, 0.28, 0.015, 20), mat(0, hy + 0.08, 0), '#1e1e22'); hd.add(new THREE.CylinderGeometry(0.1, 0.13, 0.16, 14), mat(0, hy + 0.15, 0), '#1e1e22'); hd.add(GEO.cone(5), mat(0.1, hy + 0.2, -0.05, -0.8, 0, -0.5, 0.03, 0.22, 0.03), '#f0e6d0'); }
  const headMesh = partMesh(J.head, hd, true, true);
  // 臉
  const fo = sp.face || { eye: '#6a3b2a' };
  const fm = faceMat(Object.assign({ hair: hc }, fo));
  const face = new THREE.Mesh(new THREE.SphereGeometry(HR * 1.012, 14, 10, Math.PI / 2 - 0.9, 1.8, Math.PI / 2 - 0.75, 1.35), fm[0]);
  face.position.y = hy; face.renderOrder = 2;
  J.head.add(face);
  // 馬尾／雙馬尾
  J.tails = [];
  const tail = (x, y, z, len, r) => {
    const g = new THREE.Group(); g.position.set(x, y, z); J.head.add(g);
    const ts2 = new Seg(); ts2.sph(0.03, 0, 0, 0, sp.tie2 || '#c0392b'); ts2.add(new THREE.ConeGeometry(r, len, 8), mat(0, -len / 2, -0.02, Math.PI, 0, 0, 1, 1, 0.75), hc);
    partMesh(g, ts2, false, true); J.tails.push(g); return g;
  };
  if (st === 'pony') tail(0, hy + 0.06, -HR * 0.95, 0.34, 0.06);
  if (st === 'twin') { tail(HR * 0.8, hy + 0.06, -HR * 0.35, 0.3, 0.05); tail(-HR * 0.8, hy + 0.06, -HR * 0.35, 0.3, 0.05); }
  // 手臂
  for (const side of [1, -1]) {
    const L = side > 0 ? 'L' : 'R';
    const ar = new THREE.Group(); ar.position.set(side * 0.19, 0.4, 0); J.torso.add(ar); J['arm' + L] = ar;
    const as = new Seg();
    as.sph(0.058, 0, 0, 0, top);
    as.cyl(0.046, 0.04, 0.27, 0, -0.135, 0, sp.longSleeve ? top : skin);
    if (!sp.longSleeve) as.cyl(0.062, 0.056, sp.sleeve || 0.13, 0, -(sp.sleeve || 0.13) / 2, 0, top);
    if (sp.armCover) as.cyl(0.05, 0.045, 0.16, 0, -0.19, 0, sp.armCover);
    partMesh(ar, as, false, true);
    const el = new THREE.Group(); el.position.y = -0.27; ar.add(el); J['elbow' + L] = el;
    const es = new Seg();
    es.cyl(0.04, 0.033, 0.24, 0, -0.12, 0, sp.longSleeve ? top : (sp.armCover || skin));
    es.sph(0.043, 0, -0.26, 0.005, skin, 0.9, 1.1, 0.8);
    partMesh(el, es, false, true);
    J['hand' + L] = new THREE.Group(); J['hand' + L].position.y = -0.27; el.add(J['hand' + L]);
  }
  // 手持物
  if (sp.hold) addHeld(J, sp.hold);
  root.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const ch = { root, J, sp, face, fm, blinkT: rr(1, 4), blink: 0, phase: rnd() * TAU, t: rnd() * 10, outlines: [] };
  root.traverse(o => { if (o.userData.outline) ch.outlines.push(o); });
  return ch;
}
function addHeld(J, what) {
  const s = new Seg();
  if (what === 'phone') s.box(0.07, 0.13, 0.012, 0, -0.03, 0.03, '#1d2230');
  if (what === 'incense') { for (let i = -1; i <= 1; i++) s.cyl(0.004, 0.004, 0.36, i * 0.012, 0.12, 0.03, '#b33a2a'); s.sph(0.012, 0, 0.3, 0.03, '#ffb040'); }
  if (what === 'rod') s.add(new THREE.CylinderGeometry(0.006, 0.014, 3.0, 5), mat(0, 1.3, 0.55, 0.45, 0, 0), '#3b2a1f');
  if (what === 'bag') s.box(0.22, 0.26, 0.08, 0, -0.16, 0, '#e8d6b0');
  if (what === 'snack') s.box(0.1, 0.16, 0.04, 0, -0.06, 0.02, '#f2c14e');
  if (what === 'cup') s.cyl(0.035, 0.03, 0.12, 0, -0.03, 0.03, '#e9f2ee');
  if (what === 'umbrella') { s.cyl(0.008, 0.008, 0.9, 0, 0.4, 0, '#444'); s.add(new THREE.ConeGeometry(0.5, 0.18, 10, 1, true), mat(0, 0.85, 0), '#e7a6b7'); }
  const hand = J.handR; const m = new THREE.Mesh(s.geo(), TOON_DS); m.castShadow = true; hand.add(m);
  return m;
}

/* ---------- 姿勢 ---------- */
function resetPose(J) {
  for (const k of ['hips', 'torso', 'head', 'thighL', 'thighR', 'kneeL', 'kneeR', 'armL', 'armR', 'elbowL', 'elbowR']) J[k].rotation.set(0, 0, 0);
  J.hips.position.y = 0.84;
}
function poseWalk(ch, ph, amp) {
  const J = ch.J, a = amp;
  J.thighL.rotation.x = -Math.sin(ph) * 0.5 * a; J.thighR.rotation.x = Math.sin(ph) * 0.5 * a;
  J.kneeL.rotation.x = (0.08 + 0.85 * Math.pow(Math.max(0, Math.cos(ph)), 1.4)) * a;
  J.kneeR.rotation.x = (0.08 + 0.85 * Math.pow(Math.max(0, -Math.cos(ph)), 1.4)) * a;
  J.armL.rotation.x = Math.sin(ph) * 0.45 * a; J.armR.rotation.x = -Math.sin(ph) * 0.45 * a;
  J.armL.rotation.z = 0.08; J.armR.rotation.z = -0.08;
  J.elbowL.rotation.x = -0.25 - Math.max(0, -Math.sin(ph)) * 0.3 * a; J.elbowR.rotation.x = -0.25 - Math.max(0, Math.sin(ph)) * 0.3 * a;
  J.hips.position.y = 0.84 - 0.018 * a + Math.abs(Math.cos(ph)) * 0.022 * a;
  J.hips.rotation.y = Math.sin(ph) * 0.07 * a; J.torso.rotation.y = -Math.sin(ph) * 0.1 * a;
  J.torso.rotation.x = 0.04 * a;
  for (const t of J.tails) { t.rotation.x = 0.25 + Math.sin(ph * 2) * 0.16 * a; t.rotation.z = Math.sin(ph) * 0.12 * a; }
}
function poseIdle(ch, t) {
  const J = ch.J;
  J.torso.rotation.x = Math.sin(t * 1.4) * 0.015;
  J.armL.rotation.z = 0.1 + Math.sin(t * 1.4) * 0.02; J.armR.rotation.z = -0.1 - Math.sin(t * 1.4) * 0.02;
  J.elbowL.rotation.x = J.elbowR.rotation.x = -0.12;
  for (const tl of J.tails) { tl.rotation.x = 0.12 + Math.sin(t * 1.3) * 0.04; tl.rotation.z = Math.sin(t * 0.9) * 0.05; }
}
function poseSit(ch) {
  const J = ch.J;
  J.hips.position.y = 0.47; J.thighL.rotation.x = J.thighR.rotation.x = -1.45; J.kneeL.rotation.x = J.kneeR.rotation.x = 1.4;
  J.thighL.rotation.z = 0.06; J.thighR.rotation.z = -0.06;
}

/* ---------- 行為 ---------- */
const CHAR_DEFS = [];   // 由世界建構時登錄
function addPerson(spec, beh) { CHAR_DEFS.push({ spec, beh }); }
function buildPeople() {
  reseed(4242);
  for (let i = 0; i < CHAR_DEFS.length; i++) {
    const d = CHAR_DEFS[i];
    const ch = makeChar(d.spec); ch.beh = d.beh; ch.idx = i;
    const b = d.beh;
    b.path = (b.path || [[b.x || 0, b.z || 0]]).map(p => [p[0], p[1]]);
    ch.seg = b.start || 0; ch.u = 0; ch.dir = 1; ch.wait = 0;
    const p0 = b.path[0];
    ch.root.position.set(p0[0], b.y || 0, p0[1]);
    ch.root.rotation.y = b.face != null ? b.face : 0;
    if (b.type === 'walk' || b.type === 'bike') {
      ch.seg = Math.floor(rnd() * (b.path.length - 1)); ch.u = rnd();
      if (b.type === 'bike') attachBike(ch);
    }
    if (b.type === 'sit' || b.type === 'boat') poseSit(ch);
    scene.add(ch.root); PEOPLE.push(ch);
  }
  applyPeopleQuality();
}
function attachBike(ch) {
  const g = new THREE.Group(); const s = new Seg();
  const frame = ch.beh.bikeCol || pick(['#2a7f9e', '#d9482e', '#e0b23a', '#3b8a4a']);
  s.cyl(0.018, 0.018, 0.95, 0, 0.55, 0, frame, 1, 1, 6, Math.PI / 2 - 0.2);
  s.cyl(0.018, 0.018, 0.6, 0, 0.45, -0.25, frame, 1, 1, 6, 0.35);
  s.cyl(0.02, 0.02, 0.62, 0, 0.62, 0.42, frame, 1, 1, 6, -0.3);
  s.box(0.1, 0.04, 0.24, 0, 0.9, -0.2, '#222');
  s.cyl(0.012, 0.012, 0.5, 0, 1.0, 0.5, '#333', 1, 1, 5, 0, Math.PI / 2);
  if (ch.beh.basket) s.box(0.3, 0.2, 0.25, 0, 0.9, 0.68, '#c9c2b0');
  const fm = new THREE.Mesh(s.geo(), TOON); fm.castShadow = true; g.add(fm);
  ch.wheels = [];
  for (const z of [-0.52, 0.52]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.025, 6, 20), TOON_DS.clone()); w.material.color = C('#1c1c1c'); w.material.vertexColors = false;
    w.position.set(0, 0.35, z); w.rotation.y = Math.PI / 2; g.add(w); ch.wheels.push(w);
  }
  ch.root.add(g); ch.bike = g;
}
function applyPeopleQuality() {
  for (const ch of PEOPLE) {
    const vis = ch.idx < Q.chars || ch.beh.keep;
    ch.root.visible = vis; ch.hiddenByQ = !vis;
    for (const o of ch.outlines) o.visible = Q.outline;
  }
}
const _cp = new THREE.Vector3();
function updatePeople(dt, time) {
  const light = typeof TRAFFIC !== 'undefined' ? TRAFFIC.pedGreen : true;
  for (const ch of PEOPLE) {
    if (ch.hiddenByQ) continue;
    const b = ch.beh, J = ch.J;
    ch.t += dt;
    const dist = camera.position.distanceTo(ch.root.position);
    const near = dist < 90;
    // 移動
    if (b.type === 'walk' || b.type === 'bike') {
      const speed = b.speed || (b.type === 'bike' ? 4.2 : 1.2);
      if (ch.wait > 0) { ch.wait -= dt; }
      else {
        const P = b.path; const a = P[ch.seg], c = P[ch.seg + 1] || P[0];
        // 行人號誌：進入斑馬線前等待
        if (b.cross && b.cross.indexOf(ch.seg) >= 0 && ch.u < 0.02 && !light) { ch.waiting = true; }
        else {
          ch.waiting = false;
          const L = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1;
          ch.u += speed * dt / L;
          if (ch.u >= 1) {
            ch.u = 0; ch.seg++;
            if (ch.seg >= P.length - (b.loop ? 0 : 1)) {
              if (b.loop) ch.seg = 0; else { P.reverse(); ch.seg = 0; if (b.pause) ch.wait = rr(b.pause[0], b.pause[1]); }
            }
            if (b.stops && chance(b.stops)) ch.wait = rr(2, 6);
          }
          const a2 = P[ch.seg], c2 = P[ch.seg + 1] || P[0];
          const x = lerp(a2[0], c2[0], ch.u), z = lerp(a2[1], c2[1], ch.u);
          const tgt = Math.atan2(c2[0] - a2[0], c2[1] - a2[1]);
          let dy = tgt - ch.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
          ch.root.rotation.y += dy * Math.min(1, dt * 6);
          ch.root.position.x = x; ch.root.position.z = z;
          if (near || ch.t % 1 < dt) ch.root.position.y = floorAt(x, z, ch.root.position.y + 0.6) + (b.type === 'bike' ? 0 : 0);
        }
      }
    }
    if (!near) { ch.face.visible = false; continue; }
    ch.face.visible = dist < Q.lod;
    if (Q.outline) { const ov = dist < Q.lod * 0.9; if (ch.outlineVis !== ov) { ch.outlineVis = ov; for (const o of ch.outlines) o.visible = ov; } }
    // 眨眼
    ch.blinkT -= dt;
    if (ch.blinkT <= 0) { if (!ch.blink) { ch.blink = 0.12; ch.face.material = ch.fm[1]; } }
    if (ch.blink) { ch.blink -= dt; if (ch.blink <= 0) { ch.blink = 0; ch.face.material = ch.fm[0]; ch.blinkT = rr(1.8, 5); } }
    // 動畫
    resetPose(J);
    const moving = (b.type === 'walk' && ch.wait <= 0 && !ch.waiting);
    switch (b.type) {
      case 'walk':
        if (moving) { ch.phase += dt * (b.speed || 1.2) * 4.6; poseWalk(ch, ch.phase, 1); }
        else { poseIdle(ch, ch.t); J.head.rotation.y = Math.sin(ch.t * 0.5) * 0.4; }
        break;
      case 'bike': {
        const sp = b.speed || 4.2; ch.phase += dt * sp * 1.7;
        J.hips.position.y = 0.92; J.torso.rotation.x = 0.35;
        J.thighL.rotation.x = -1.05 + Math.sin(ch.phase) * 0.35; J.thighR.rotation.x = -1.05 - Math.sin(ch.phase) * 0.35;
        J.kneeL.rotation.x = 1.15 + Math.cos(ch.phase) * 0.4; J.kneeR.rotation.x = 1.15 - Math.cos(ch.phase) * 0.4;
        J.armL.rotation.x = J.armR.rotation.x = -1.05; J.elbowL.rotation.x = J.elbowR.rotation.x = -0.3;
        J.armL.rotation.z = -0.12; J.armR.rotation.z = 0.12;
        for (const w of ch.wheels) w.rotation.x += dt * sp / 0.33;
        for (const tl of J.tails) { tl.rotation.x = 0.7 + Math.sin(ch.t * 6) * 0.08; }
        break;
      }
      case 'chat': {
        poseIdle(ch, ch.t);
        const g = Math.sin(ch.t * 0.8 + ch.idx) ;
        if (g > 0.3) { J.armR.rotation.x = -0.5 - Math.sin(ch.t * 3) * 0.15; J.elbowR.rotation.x = -1.1; J.armR.rotation.z = -0.25; }
        J.head.rotation.x = Math.sin(ch.t * 2.2 + ch.idx) * 0.06; J.head.rotation.y = Math.sin(ch.t * 0.4 + ch.idx) * 0.25;
        break;
      }
      case 'pray': {
        const cyc = (ch.t % 9);
        const bow = cyc < 5 ? Math.max(0, Math.sin(cyc / 5 * Math.PI * 3)) : 0;
        J.torso.rotation.x = 0.05 + bow * 0.32; J.head.rotation.x = bow * 0.15;
        J.armL.rotation.x = J.armR.rotation.x = -0.95; J.armL.rotation.z = -0.32; J.armR.rotation.z = 0.32;
        J.elbowL.rotation.x = J.elbowR.rotation.x = -0.95;
        break;
      }
      case 'photo': {
        const up = Math.sin(ch.t * 0.35 + ch.idx) > -0.2;
        if (up) { J.armR.rotation.x = -1.35; J.elbowR.rotation.x = -0.9; J.armR.rotation.z = 0.25; J.armL.rotation.x = -1.2; J.elbowL.rotation.x = -1.1; J.armL.rotation.z = -0.35; J.head.rotation.x = -0.05; }
        else poseIdle(ch, ch.t);
        break;
      }
      case 'sit': case 'boat': {
        poseSit(ch);
        J.armL.rotation.x = J.armR.rotation.x = -0.5; J.elbowL.rotation.x = J.elbowR.rotation.x = -0.7;
        J.head.rotation.y = Math.sin(ch.t * 0.3 + ch.idx) * 0.5; J.head.rotation.x = Math.sin(ch.t * 1.7) * 0.03;
        break;
      }
      case 'fish': {
        poseIdle(ch, ch.t); J.armR.rotation.x = -0.9; J.elbowR.rotation.x = -0.6; J.armL.rotation.x = -0.7; J.elbowL.rotation.x = -0.9; J.armL.rotation.z = -0.4;
        J.armR.rotation.x += Math.sin(ch.t * 0.7) * 0.05;
        break;
      }
      case 'guide': {
        poseIdle(ch, ch.t);
        const g = (ch.t % 7) < 3.5; if (g) { J.armR.rotation.x = -1.2; J.armR.rotation.z = -0.5; J.elbowR.rotation.x = -0.2; }
        J.head.rotation.y = Math.sin(ch.t * 0.6) * 0.5;
        break;
      }
      case 'vendor': {
        poseIdle(ch, ch.t);
        if ((ch.t % 10) < 2) { J.armR.rotation.x = -0.6; J.armR.rotation.z = -1.2 - Math.sin(ch.t * 8) * 0.25; J.elbowR.rotation.x = -0.5; }
        else { J.armL.rotation.x = J.armR.rotation.x = -0.6; J.elbowL.rotation.x = J.elbowR.rotation.x = -0.8; }
        break;
      }
      case 'ride': {
        J.hips.position.y = 0.62; J.thighL.rotation.x = J.thighR.rotation.x = -1.3; J.kneeL.rotation.x = J.kneeR.rotation.x = 1.25;
        J.thighL.rotation.z = 0.15; J.thighR.rotation.z = -0.15;
        J.armL.rotation.x = J.armR.rotation.x = -1.0; J.elbowL.rotation.x = J.elbowR.rotation.x = -0.35; J.armL.rotation.z = -0.1; J.armR.rotation.z = 0.1;
        J.torso.rotation.x = 0.08;
        break;
      }
      default: poseIdle(ch, ch.t);
    }
  }
}
