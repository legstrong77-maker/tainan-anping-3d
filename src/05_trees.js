/* ================= 05 樹木：鳳凰木、老榕樹、木麻黃、落花 ================= */
const FOL = { cards: [] };   // 每張卡：[cx,cy,cz, ux,uy,uz, vx,vy,vz, cell, shade, sway]
const PETAL_SRC = [];        // 飄落花瓣的來源樹冠
const _fn = new THREE.Vector3(), _fu = new THREE.Vector3(), _fv = new THREE.Vector3(), _fr = new THREE.Vector3();
function card(c, n, size, cell, shade, sway, roll) {
  _fn.copy(n).normalize();
  _fr.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5);
  if (roll != null) _fr.set(Math.cos(roll), 0, Math.sin(roll));
  _fu.crossVectors(_fn, _fr); if (_fu.lengthSq() < 1e-6) _fu.set(1, 0, 0); _fu.normalize().multiplyScalar(size);
  _fv.crossVectors(_fn, _fu).normalize().multiplyScalar(size);
  FOL.cards.push([c.x, c.y, c.z, _fu.x, _fu.y, _fu.z, _fv.x, _fv.y, _fv.z, cell, clamp(shade, 0, 1), sway]);
}
function randInEllipsoid(rx, ry, rz) {
  let x, y, z; do { x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; } while (x * x + y * y + z * z > 1);
  return V3(x * rx, y * ry, z * rz);
}
const BARK_FLAME = '#e6dfd6', BARK_BANYAN = '#b9aea0';

/* ---- 鳳凰木：低處分叉 3～4 大枝，三層遞迴，平展傘形，末端微垂 ---- */
function flameTree(x, z, o) {
  o = o || {}; const S = o.scale || 1, budget = o.cards || 1600, y0 = o.y || 0;
  const trunkH = rr(1.9, 2.6) * S;
  const top = V3(x + rr(-.2, .2) * S, y0 + trunkH, z + rr(-.2, .2) * S);
  tube('bark', V3(x, y0 - 0.1, z), top, 0.4 * S, 0.3 * S, 9, BARK_FLAME, { uvy: 0.5 });
  for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + rr(-.3, .3); tube('bark', V3(x + Math.cos(a) * 0.15 * S, y0 + 0.7 * S, z + Math.sin(a) * 0.15 * S), V3(x + Math.cos(a) * 0.95 * S, y0, z + Math.sin(a) * 0.95 * S), 0.16 * S, 0.06 * S, 5, BARK_FLAME); }
  addCol(x, z, 0.38 * S, 0.38 * S, y0, y0 + trunkH + 2, 0);
  const clusters = [];
  const grow = (p, az, el, len, r, lvl) => {
    const d = V3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el));
    const mid = p.clone().addScaledVector(d, len * 0.5);
    const el2 = el * 0.45 - (lvl === 2 ? 0.18 : 0.02);
    const d2 = V3(Math.cos(az) * Math.cos(el2), Math.sin(el2), Math.sin(az) * Math.cos(el2));
    const end = mid.clone().addScaledVector(d2, len * 0.5);
    tube('bark', p, mid, r, r * 0.82, lvl < 1 ? 7 : lvl < 2 ? 5 : 4, BARK_FLAME);
    tube('bark', mid, end, r * 0.82, r * 0.62, lvl < 1 ? 7 : lvl < 2 ? 5 : 4, BARK_FLAME);
    if (lvl < 2) {
      const n = lvl === 0 ? 3 : ri(2, 3);
      for (let i = 0; i < n; i++) {
        const na = az + (i - (n - 1) / 2) * rr(0.45, 0.75) + rr(-.15, .15);
        const ne = lvl === 0 ? rr(0.18, 0.42) : rr(-0.02, 0.2);
        grow(end, na, ne, len * rr(0.55, 0.7), r * 0.58, lvl + 1);
      }
      if (lvl === 1) clusters.push({ p: mid.clone(), r: rr(1.2, 1.6) * S });
    } else clusters.push({ p: end.clone(), r: rr(1.5, 2.2) * S });
  };
  const nL = o.limbs || ri(3, 4), a0 = rnd() * TAU;
  for (let i = 0; i < nL; i++) grow(top, a0 + i / nL * TAU + rr(-.3, .3), rr(0.55, 0.85), rr(3.0, 4.0) * S, 0.25 * S, 0);
  // 樹冠範圍
  let yMin = 1e9, yMax = -1e9, rMax = 0;
  for (const c of clusters) { yMin = Math.min(yMin, c.p.y - c.r * 0.4); yMax = Math.max(yMax, c.p.y + c.r * 0.7); rMax = Math.max(rMax, Math.hypot(c.p.x - x, c.p.z - z) + c.r); }
  const per = budget / clusters.length;
  for (const cl of clusters) {
    const n = Math.round(per * rr(0.8, 1.2));
    for (let j = 0; j < n; j++) {
      const off = randInEllipsoid(cl.r, cl.r * 0.5, cl.r);
      off.y = Math.abs(off.y) * 0.9 - cl.r * 0.12;   // 偏上方：傘形
      const p = cl.p.clone().add(off);
      const rad = Math.hypot(p.x - x, p.z - z) / rMax, hy = (p.y - yMin) / (yMax - yMin + 0.01);
      const outward = V3(p.x - x, 0, p.z - z).normalize().multiplyScalar(0.6);
      const nrm = V3(outward.x + rr(-.6, .6), 1.1 + rr(-.3, .5), outward.z + rr(-.6, .6));
      const flower = rnd() < (o.flowers != null ? o.flowers : 0.62);
      card(p, nrm, rr(0.42, 0.72) * S, flower ? 0 : 1, 0.12 + hy * 0.55 + rad * 0.35 + rr(-.08, .08), 0.5 + rad * 0.8);
    }
    if (chance(0.55)) { // 內側填充團塊
      const q = cl.p.clone(); q.y += cl.r * 0.05;
      addGeo('plain', GEO.ico(), mat(q.x, q.y, q.z, 0, rnd() * 3, 0, cl.r * 0.7, cl.r * 0.28, cl.r * 0.7), Cv(chance(0.6) ? '#9c3526' : '#4f7a2e', 0.12));
    }
  }
  // 地上落花毯
  const nF = Math.round(rMax * rMax * 0.45 * (o.carpet != null ? o.carpet : 1));
  for (let i = 0; i < nF; i++) {
    const a = rnd() * TAU, d = Math.sqrt(rnd()) * rMax * 0.95;
    card(V3(x + Math.cos(a) * d, y0 + 0.03 + rnd() * 0.01, z + Math.sin(a) * d), V3(0, 1, 0), rr(0.5, 0.9), 3, 0.75 + rr(-.1, .1), 0, rnd() * TAU);
  }
  PETAL_SRC.push({ x, z, r: rMax * 0.9, y: yMax, y0, w: rMax * rMax });
  return { top: yMax, r: rMax };
}

/* ---- 老榕樹：多幹、氣根垂落、深綠傘冠 ---- */
function banyanTree(x, z, o) {
  o = o || {}; const S = o.scale || 1, budget = o.cards || 1400, y0 = o.y || 0;
  const H = rr(3.2, 4.2) * S;
  const stems = ri(3, 5), top = V3(x, y0 + H, z);
  for (let i = 0; i < stems; i++) {
    const a = i / stems * TAU + rr(-.3, .3), d = rr(0.25, 0.6) * S;
    tube('bark', V3(x + Math.cos(a) * d, y0 - 0.1, z + Math.sin(a) * d), V3(x + Math.cos(a) * d * 0.3, y0 + H, z + Math.sin(a) * d * 0.3), rr(0.3, 0.5) * S, rr(0.24, 0.34) * S, 7, BARK_BANYAN, { uvy: 0.5 });
  }
  for (let k = 0; k < 7; k++) { const a = rnd() * TAU; tube('bark', V3(x + Math.cos(a) * 0.4 * S, y0 + 0.5 * S, z + Math.sin(a) * 0.4 * S), V3(x + Math.cos(a) * rr(1.2, 2.2) * S, y0 - 0.05, z + Math.sin(a) * rr(1.2, 2.2) * S), 0.2 * S, 0.05 * S, 5, BARK_BANYAN); }
  addCol(x, z, 0.8 * S, 0.8 * S, y0, y0 + H, 0);
  const clusters = [], reach = o.reach || 1;
  const nL = ri(5, 7), a0 = rnd() * TAU;
  for (let i = 0; i < nL; i++) {
    const az = a0 + i / nL * TAU + rr(-.25, .25), el = rr(0.12, 0.5), len = rr(4, 6.5) * S * reach;
    let p = top.clone(); let r = 0.3 * S;
    const segs = 3;
    for (let s = 0; s < segs; s++) {
      const e = el * (1 - s / segs) - 0.05 * s;
      const d = V3(Math.cos(az) * Math.cos(e), Math.sin(e), Math.sin(az) * Math.cos(e));
      const q = p.clone().addScaledVector(d, len / segs);
      tube('bark', p, q, r, r * 0.75, 6, BARK_BANYAN); r *= 0.75;
      // 氣根
      const nr = ri(2, 5);
      for (let k = 0; k < nr; k++) {
        const t = rnd(), rp = p.clone().lerp(q, t);
        const toGround = chance(o.propRoots != null ? o.propRoots : 0.22);
        const bottom = toGround ? y0 : rp.y - rr(0.8, Math.max(1, rp.y - y0 - 0.4));
        tube('bark', rp, V3(rp.x + rr(-.15, .15), bottom, rp.z + rr(-.15, .15)), toGround ? rr(0.06, 0.16) * S : 0.025, toGround ? rr(0.08, 0.2) * S : 0.012, toGround ? 5 : 3, toGround ? BARK_BANYAN : '#b8ab98');
        if (toGround) addCol(rp.x, rp.z, 0.15, 0.15, y0, rp.y, 0);
      }
      clusters.push({ p: q.clone(), r: rr(2.0, 2.8) * S });
      // 側枝
      if (s > 0 && chance(0.7)) { const sa = az + rr(-1, 1), sq = q.clone().add(V3(Math.cos(sa) * 2 * S, rr(0.3, 1.2) * S, Math.sin(sa) * 2 * S)); tube('bark', q, sq, r * 0.7, r * 0.4, 4, BARK_BANYAN); clusters.push({ p: sq, r: rr(1.8, 2.4) * S }); }
      p = q;
    }
  }
  clusters.push({ p: top.clone().add(V3(0, 1.6 * S, 0)), r: 3.2 * S });
  let yMin = 1e9, yMax = -1e9, rMax = 0;
  for (const c of clusters) { yMin = Math.min(yMin, c.p.y - c.r * 0.4); yMax = Math.max(yMax, c.p.y + c.r * 0.8); rMax = Math.max(rMax, Math.hypot(c.p.x - x, c.p.z - z) + c.r); }
  const per = budget / clusters.length;
  for (const cl of clusters) {
    const n = Math.round(per * rr(0.8, 1.2));
    for (let j = 0; j < n; j++) {
      const off = randInEllipsoid(cl.r, cl.r * 0.62, cl.r); off.y = off.y * 0.8 + cl.r * 0.15;
      const p = cl.p.clone().add(off);
      const rad = Math.hypot(p.x - x, p.z - z) / rMax, hy = (p.y - yMin) / (yMax - yMin + 0.01);
      const nrm = V3(p.x - cl.p.x + rr(-.5, .5), (p.y - cl.p.y) + 0.8, p.z - cl.p.z + rr(-.5, .5));
      card(p, nrm, rr(0.6, 1.0) * S, 2, 0.1 + hy * 0.6 + rad * 0.3 + rr(-.08, .08), 0.35 + rad * 0.5);
    }
    if (chance(0.7)) addGeo('plain', GEO.ico(), mat(cl.p.x, cl.p.y + cl.r * 0.1, cl.p.z, 0, rnd() * 3, 0, cl.r * 0.72, cl.r * 0.4, cl.r * 0.72), Cv('#28502a', 0.1));
  }
  return { top: yMax, r: rMax };
}
/* ---- 木麻黃（海岸防風林） ---- */
function casuarina(x, z, s) {
  s = s || 1; const h = rr(7, 10) * s;
  tube('bark', V3(x, -0.2, z), V3(x + rr(-.3, .3), h, z + rr(-.3, .3)), 0.18 * s, 0.07 * s, 6, '#7d7266');
  for (let i = 0; i < 4; i++) {
    const y = h * (0.45 + i * 0.16);
    addGeo('plain', GEO.cone(7), mat(x + rr(-.4, .4), y, z + rr(-.4, .4), 0, rnd() * 3, 0, (2.2 - i * 0.4) * s, 2.4 * s, (2.2 - i * 0.4) * s), Cv('#4c6b45', 0.12));
  }
  addCol(x, z, 0.2, 0.2, 0, h, 0);
}
function shrub(x, z, s, hex, y) {
  s = s || 1; y = y || 0;
  for (let i = 0; i < 3; i++) sph('plain', x + rr(-.4, .4) * s, y + (0.35 + rr(0, .2)) * s, z + rr(-.4, .4) * s, rr(0.45, 0.65) * s, rr(0.35, 0.5) * s, rr(0.45, 0.65) * s, Cv(hex || '#4f8a3a', 0.15), true);
}

/* ---- 建立樹葉網格（卡片打散，可用 drawRange 調密度） ---- */
let FOLIAGE_MESH = null, FOLIAGE_TOTAL = 0;
function buildFoliage() {
  const cards = shuffle(FOL.cards);
  const N = cards.length; FOLIAGE_TOTAL = N;
  const pos = new Float32Array(N * 12), uv = new Float32Array(N * 8), sh = new Float32Array(N * 4), sw = new Float32Array(N * 4), idx = new Uint32Array(N * 6);
  const cellUV = [[0, .5, .5, 1], [.5, .5, 1, 1], [0, 0, .5, .5], [.5, 0, 1, .5]];
  for (let i = 0; i < N; i++) {
    const c = cards[i], cu = cellUV[c[9]], m = 0.004;
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) {
      const a = corners[k][0], b = corners[k][1], o = i * 12 + k * 3;
      pos[o] = c[0] + c[3] * a + c[6] * b; pos[o + 1] = c[1] + c[4] * a + c[7] * b; pos[o + 2] = c[2] + c[5] * a + c[8] * b;
      uv[i * 8 + k * 2] = a < 0 ? cu[0] + m : cu[2] - m; uv[i * 8 + k * 2 + 1] = b < 0 ? cu[1] + m : cu[3] - m;
      sh[i * 4 + k] = c[10]; sw[i * 4 + k] = c[11];
    }
    const v = i * 4; idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aShade', new THREE.BufferAttribute(sh, 1));
  g.setAttribute('aSway', new THREE.BufferAttribute(sw, 1));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N * 12).fill(0), 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingSphere();
  const vsWind = `attribute float aShade;attribute float aSway;uniform float uTime,uWind;varying vec2 vUv;varying float vShade;
vec3 windOff(vec3 p,float s){float ph=dot(p.xz,vec2(.07,.05));
 return vec3(sin(uTime*1.25+ph)*.55+sin(uTime*2.9+ph*3.)*.2,sin(uTime*2.2+ph*2.)*.14,cos(uTime*1.05+ph*1.3)*.4+sin(uTime*3.4+ph*2.3)*.15)*s*uWind*.17;}`;
  const uni = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uMap: { value: TEX.foliage }, uTime: U.time, uWind: U.wind, uLight: U.folLight, uShade: U.folShade });
  const m = new THREE.ShaderMaterial({
    uniforms: uni, side: THREE.DoubleSide, fog: true,
    vertexShader: vsWind + `
#include <fog_pars_vertex>
void main(){vec3 p=position+windOff(position,aSway);vUv=uv;vShade=aShade;vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform sampler2D uMap;uniform vec3 uLight,uShade;varying vec2 vUv;varying float vShade;
#include <fog_pars_fragment>
void main(){vec4 t=texture2D(uMap,vUv);if(t.a<.5)discard;vec3 base=pow(t.rgb,vec3(2.2));
 vec3 col=base*mix(uShade,uLight,smoothstep(0.,1.,vShade));gl_FragColor=vec4(col,1.);
#include <fog_fragment>
#include <encodings_fragment>
}`
  });
  const depth = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: TEX.foliage }, uTime: U.time, uWind: U.wind },
    vertexShader: vsWind + `void main(){vec3 p=position+windOff(position,aSway);vUv=uv;vShade=aShade;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
    fragmentShader: `#include <packing>
uniform sampler2D uMap;varying vec2 vUv;void main(){if(texture2D(uMap,vUv).a<.5)discard;gl_FragColor=packDepthToRGBA(gl_FragCoord.z);}`
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.customDepthMaterial = depth; mesh.castShadow = true; mesh.frustumCulled = false; mesh.matrixAutoUpdate = false;
  scene.add(mesh); FOLIAGE_MESH = mesh;
  FOL.cards = null;
  setFoliageDensity(Q.foliage);
}
function setFoliageDensity(f) { if (FOLIAGE_MESH) FOLIAGE_MESH.geometry.setDrawRange(0, Math.floor(FOLIAGE_TOTAL * f) * 6); }

/* ---- 空中持續飄落的鳳凰花瓣（shader） ---- */
let PETALS = null;
function buildPetals() {
  const N = 5000, org = new Float32Array(N * 3), rnd4 = new Float32Array(N * 4);
  let tw = 0; for (const s of PETAL_SRC) tw += s.w;
  let i = 0;
  for (const s of PETAL_SRC) {
    const n = Math.round(N * s.w / tw);
    for (let k = 0; k < n && i < N; k++, i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * s.r;
      org[i * 3] = s.x + Math.cos(a) * d; org[i * 3 + 1] = s.y0 + (s.y - s.y0) * rr(0.55, 1); org[i * 3 + 2] = s.z + Math.sin(a) * d;
      rnd4.set([rnd(), rnd(), rnd(), rnd()], i * 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(org, 3));
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd4, 4));
  const uni = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTime: U.time, uWind: U.wind, uPR: U.pr, uH: { value: innerHeight }, uLight: U.folLight, uShade: U.folShade });
  const m = new THREE.ShaderMaterial({
    uniforms: uni, fog: true, transparent: false,
    vertexShader: `attribute vec4 aRand;uniform float uTime,uWind,uH;varying float vRot;varying vec3 vCol;varying float vA;
#include <fog_pars_vertex>
void main(){
 float H=max(position.y,1.);float sp=.55+aRand.y*.55;float T=H/sp+3.;
 float t=mod(uTime+aRand.x*T*7.,T);
 float y=position.y-t*sp;vA=1.;
 if(y<0.){y=.02;vA=1.-clamp((t-H/sp)/3.,0.,1.);}
 float ft=min(t,H/sp);
 vec3 p=vec3(position.x+sin(ft*1.6+aRand.z*30.)*.55+ft*.45*uWind,y+(y>.03?0.:0.),position.z+cos(ft*1.2+aRand.w*30.)*.5+ft*.18*uWind);
 p.y=max(p.y,.02);
 vRot=ft*(2.+aRand.z*3.)+aRand.w*6.28;
 vCol=mix(vec3(.72,.07,.03),vec3(.95,.25,.07),aRand.w);
 if(aRand.z>.9)vCol=vec3(.95,.8,.45);
 vec4 mvPosition=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mvPosition;
 gl_PointSize=(.045+aRand.w*.03)*uH/(-mvPosition.z)*(vA>.01?1.:0.)*smoothstep(.8,2.5,-mvPosition.z);
#include <fog_vertex>
}`,
    fragmentShader: `uniform vec3 uLight;varying float vRot;varying vec3 vCol;varying float vA;
#include <fog_pars_fragment>
void main(){vec2 d=gl_PointCoord-.5;float c=cos(vRot),s=sin(vRot);d=mat2(c,-s,s,c)*d;
 d.x*=1.7;float r=length(d);if(r>.5||vA<.02)discard;if(abs(d.x)<.05&&d.y>.38)discard;
 vec3 col=vCol*mix(vec3(.55),uLight,.8);gl_FragColor=vec4(col,1.);
#include <fog_fragment>
#include <encodings_fragment>
}`
  });
  PETALS = new THREE.Points(g, m); PETALS.frustumCulled = false; scene.add(PETALS);
  setPetalCount(Q.petals);
}
function setPetalCount(n) { if (PETALS) PETALS.geometry.setDrawRange(0, n); }
