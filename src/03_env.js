/* ================= 03 天空、海水、光影、時段 ================= */
const GLSL_NOISE = `
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float hash3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
 return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
`;
const ENV = {};
function buildEnv() {
  /* ---- 天空 ---- */
  const su = {
    uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uLow: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uCloud: { value: new THREE.Color() }, uCloudSh: { value: new THREE.Color() },
    uSunDir: U.sunDir, uTime: U.time, uNight: U.night,
  };
  ENV.skyU = su;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1000, 40, 20), new THREE.ShaderMaterial({
    uniforms: su, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir;void main(){vDir=normalize(position);vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
    fragmentShader: `uniform vec3 uTop,uMid,uHor,uLow,uSunCol,uCloud,uCloudSh;uniform vec3 uSunDir;uniform float uTime,uNight;varying vec3 vDir;
${GLSL_NOISE}
void main(){
 vec3 d=normalize(vDir);float h=d.y;
 vec3 col=mix(uHor,uMid,smoothstep(0.,.2,h));col=mix(col,uTop,smoothstep(.16,.72,h));
 col=mix(col,uLow,smoothstep(0.,-.1,h));
 float sd=max(dot(d,uSunDir),0.);
 col+=uSunCol*(pow(sd,7.)*.28+pow(sd,60.)*.4)*(1.-uNight*.75);
 col+=uSunCol*smoothstep(.99935,.9997,sd)*3.5*(1.-uNight);
 col+=vec3(.85,.9,1.)*smoothstep(.9991,.9994,sd)*uNight*1.6;
 if(h>0.){
  vec2 uv=d.xz/(h*1.5+.1);uv=uv*.9+vec2(uTime*.005,uTime*.0018);
  float n=fbm(uv*.8);float n2=fbm(uv*.8+uSunDir.xz*.06);
  float cov=smoothstep(.5,.64,n)*smoothstep(0.,.16,h);
  float lit=clamp((n-n2)*7.+.62,0.,1.);
  vec3 cc=mix(uCloudSh,uCloud,lit);
  cc+=uSunCol*pow(sd,5.)*.35;
  col=mix(col,cc,cov*.96);
 }
 if(uNight>.01&&h>0.){vec3 sp=floor(d*380.);float s=hash3(sp);float st=step(.9972,s)*(.55+.45*sin(uTime*1.7+s*90.));col+=vec3(st)*uNight*smoothstep(0.,.25,h);}
 gl_FragColor=vec4(col,1.);
 #include <encodings_fragment>
}`
  }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky); ENV.sky = sky;

  /* ---- 遠山（中央山脈淡影，東側） ---- */
  const mc = mkCanvas(2048, 256), mg = mc.getContext('2d');
  const drawRidge = (base, amp, col, seed) => {
    reseed(seed); mg.fillStyle = col; mg.beginPath(); mg.moveTo(0, 256);
    let y = base; for (let x = 0; x <= 2048; x += 8) { y += rr(-amp, amp); y = clamp(y, base - 70, base + 30); const edge = sstep(0, 300, x) * sstep(2048, 1748, x); mg.lineTo(x, 256 - (256 - y) * edge); }
    mg.lineTo(2048, 256); mg.fill();
  };
  drawRidge(150, 7, '#ffffff', 11); drawRidge(190, 5, '#dddddd', 12);
  const mTex = mkTex(mc, { rep: false, srgb: false });
  ENV.mtnU = { uMap: { value: mTex }, uCol: { value: new THREE.Color() }, uCol2: { value: new THREE.Color() } };
  const mtn = new THREE.Mesh(new THREE.CylinderGeometry(900, 900, 120, 64, 1, true, Math.PI * 0.12, Math.PI * 0.7),
    new THREE.ShaderMaterial({
      uniforms: ENV.mtnU, transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`,
      fragmentShader: `uniform sampler2D uMap;uniform vec3 uCol,uCol2;varying vec2 vUv;void main(){vec4 t=texture2D(uMap,vUv);if(t.a<.02)discard;vec3 c=mix(uCol2,uCol,t.r);gl_FragColor=vec4(c,t.a*.9);
      #include <encodings_fragment>
      }`
    }));
  mtn.position.y = 30; mtn.renderOrder = -9; mtn.frustumCulled = false;
  scene.add(mtn); ENV.mtn = mtn;

  /* ---- 水面（運河、港、海共用一大片） ---- */
  const wu = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
    uTime: U.time, uSunDir: U.sunDir,
    uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uSky: { value: new THREE.Color() }, uHor: { value: new THREE.Color() },
    uSunCol: { value: new THREE.Color() }, uGlow: U.glow, uNight: U.night,
  });
  ENV.waterU = wu;
  const water = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000, 1, 1), new THREE.ShaderMaterial({
    uniforms: wu, fog: true,
    vertexShader: `varying vec3 vW;
#include <fog_pars_vertex>
void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform float uTime,uGlow,uNight;uniform vec3 uSunDir,uDeep,uShallow,uSky,uHor,uSunCol;varying vec3 vW;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
 vec2 p=vW.xz;float t=uTime;
 float sea=smoothstep(-140.,-175.,p.x);
 float amp=mix(.35,1.,sea);
 vec2 g=vec2(0.);
 g+=.10*vec2(.35,.12)*cos(p.x*.35+p.y*.12+t*1.2);
 g+=.07*vec2(-.2,.5)*cos(-p.x*.2+p.y*.5+t*1.6);
 g+=.05*vec2(.8,-.6)*cos(p.x*.8-p.y*.6+t*2.3);
 g+=.03*vec2(1.7,1.1)*cos(p.x*1.7+p.y*1.1+t*3.1);
 g+=(vec2(noise(p*.9+t*.3),noise(p*.9-t*.25+7.))-.5)*.25;
 g*=amp;
 vec3 n=normalize(vec3(-g.x,1.,-g.y));
 vec3 V=normalize(cameraPosition-vW);
 float fres=pow(1.-max(dot(n,V),0.),3.);
 vec3 base=mix(uShallow,uDeep,sea*.7+.3*smoothstep(.2,.8,noise(p*.05)));
 vec3 r=reflect(-V,n);
 vec3 refl=mix(uHor,uSky,clamp(r.y*2.2,0.,1.));
 vec3 col=mix(base,refl,.18+.62*fres);
 float sp=pow(max(dot(reflect(-uSunDir,n),V),0.),180.);
 col+=uSunCol*sp*2.2*(1.-uNight*.6);
 float s=sin(p.x*.9+sin(p.y*.35+t*.5)*2.2+t*.8)*sin(p.y*1.1-t*.7+sin(p.x*.3)*1.7);
 col+=smoothstep(.9,.985,s)*.16*(1.-uNight*.7);
 float shore=smoothstep(-151.,-146.5,p.x)*step(p.x,-140.);
 float foam=shore*smoothstep(.35,.8,noise(vec2(p.y*.3,t*.6))+sin(p.x*2.+t*1.8)*.25);
 col=mix(col,vec3(.95,.97,1.)*(1.-uNight*.7),foam*.8);
 gl_FragColor=vec4(col,1.);
 #include <fog_fragment>
 #include <encodings_fragment>
}`
  }));
  water.rotation.x = -Math.PI / 2; water.position.y = -0.62;
  scene.add(water); ENV.water = water;

  /* ---- 光源 ---- */
  const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 0.7); scene.add(hemi); ENV.hemi = hemi;
  const amb = new THREE.AmbientLight(0x6a5a8a, 0.12); scene.add(amb); ENV.amb = amb;
  const sun = new THREE.DirectionalLight(0xffffff, 1.1);
  sun.castShadow = Q.shadows;
  sun.shadow.mapSize.set(Q.shadow, Q.shadow);
  const sc = sun.shadow.camera; sc.left = -75; sc.right = 75; sc.top = 75; sc.bottom = -75; sc.near = 1; sc.far = 420;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
  scene.add(sun); scene.add(sun.target); ENV.sun = sun;
  scene.fog = new THREE.Fog(0xcccccc, 120, 700);
}

/* ---- 時段設定（sRGB 色碼，套用時轉線性） ---- */
const TOD = {
  noon: {
    name: '午後', sun: [-0.52, 0.66, 0.54], sunCol: '#fff0d8', sunI: 1.15, hemiSky: '#c4dcff', hemiGround: '#b4a2c8', hemiI: 0.78, amb: 0.12,
    top: '#3a7fdc', mid: '#77b3ee', hor: '#d9ebf6', low: '#c9d8e2', fog: '#d2e2ee', fogN: 140, fogF: 760,
    cloud: '#ffffff', cloudSh: '#b8c6e4', deep: '#2b6f86', shallow: '#4f9d9a', wsky: '#8ec0ea', whor: '#dcebf2',
    folLight: '#fff4e6', folShade: '#9e7a93', mtn: '#9fb6cf', mtn2: '#b9cadb', glow: 0, night: 0, wind: 1, clock: '午後 15:20'
  },
  dusk: {
    name: '夕照', sun: [-0.93, 0.11, 0.35], sunCol: '#ffb067', sunI: 1.05, hemiSky: '#8e92c8', hemiGround: '#c98a86', hemiI: 0.62, amb: 0.16,
    top: '#2b3d7c', mid: '#b17394', hor: '#ffb36e', low: '#b77d7a', fog: '#dea287', fogN: 110, fogF: 620,
    cloud: '#ffd09a', cloudSh: '#8c6798', deep: '#394b6c', shallow: '#b77a66', wsky: '#b58aa6', whor: '#ffbf80',
    folLight: '#ffd2a6', folShade: '#7c5474', mtn: '#8a7da8', mtn2: '#a88aa8', glow: 0.45, night: 0.08, wind: 1.2, clock: '夕照 18:25'
  },
  night: {
    name: '夜晚', sun: [0.35, 0.62, -0.5], sunCol: '#9fb2ff', sunI: 0.32, hemiSky: '#46558f', hemiGround: '#261d3c', hemiI: 0.6, amb: 0.2,
    top: '#050a1d', mid: '#0f1c46', hor: '#2b3a6f', low: '#141a33', fog: '#1a2242', fogN: 70, fogF: 480,
    cloud: '#3b4674', cloudSh: '#171d3c', deep: '#0a1730', shallow: '#17294c', wsky: '#1a2a58', whor: '#33447a',
    folLight: '#8d93c8', folShade: '#3a3158', mtn: '#1b2448', mtn2: '#222c55', glow: 1, night: 1, wind: 0.8, clock: '夜晚 20:10'
  }
};
const todState = { cur: 'noon', from: null, to: null, t: 1 };
const _todA = {}, _todB = {};
function todVals(p, out) {
  out.sun = new THREE.Vector3().fromArray(p.sun).normalize();
  for (const k of ['sunCol', 'hemiSky', 'hemiGround', 'top', 'mid', 'hor', 'low', 'fog', 'cloud', 'cloudSh', 'deep', 'shallow', 'wsky', 'whor', 'folLight', 'folShade', 'mtn', 'mtn2']) out[k] = C(p[k]).clone();
  for (const k of ['sunI', 'hemiI', 'amb', 'fogN', 'fogF', 'glow', 'night', 'wind']) out[k] = p[k];
  return out;
}
function applyTodMix(a, b, t) {
  const L = (k) => a[k].clone().lerp(b[k], t);
  const N = (k) => lerp(a[k], b[k], t);
  const sd = a.sun.clone().lerp(b.sun, t).normalize();
  U.sunDir.value.copy(sd);
  ENV.sun.color.copy(L('sunCol')); ENV.sun.intensity = N('sunI');
  ENV.hemi.color.copy(L('hemiSky')); ENV.hemi.groundColor.copy(L('hemiGround')); ENV.hemi.intensity = N('hemiI');
  ENV.amb.intensity = N('amb');
  const s = ENV.skyU; s.uTop.value.copy(L('top')); s.uMid.value.copy(L('mid')); s.uHor.value.copy(L('hor')); s.uLow.value.copy(L('low'));
  s.uSunCol.value.copy(L('sunCol')); s.uCloud.value.copy(L('cloud')); s.uCloudSh.value.copy(L('cloudSh'));
  scene.fog.color.copy(L('fog')); scene.fog.near = N('fogN'); scene.fog.far = N('fogF');
  const w = ENV.waterU; w.uDeep.value.copy(L('deep')); w.uShallow.value.copy(L('shallow')); w.uSky.value.copy(L('wsky')); w.uHor.value.copy(L('whor')); w.uSunCol.value.copy(L('sunCol'));
  U.folLight.value.copy(L('folLight')); U.folShade.value.copy(L('folShade'));
  ENV.mtnU.uCol.value.copy(L('mtn')); ENV.mtnU.uCol2.value.copy(L('mtn2'));
  U.glow.value = N('glow'); U.night.value = N('night'); U.wind.value = N('wind');
  renderer.setClearColor(scene.fog.color);
}
function setTOD(key, instant) {
  if (!TOD[key]) return;
  const from = todState.to ? todVals(TOD[todState.cur], _todA) : null;
  if (todState.t < 1 && todState.from && todState.to) { // 過渡中：從目前混合值出發
    const a = todState.from, b = todState.to, t = todState.t;
    for (const k in a) { if (a[k] && a[k].isColor) _todA[k] = a[k].clone().lerp(b[k], t); else if (a[k] && a[k].isVector3) _todA[k] = a[k].clone().lerp(b[k], t).normalize(); else _todA[k] = lerp(a[k], b[k], t); }
  } else todVals(TOD[todState.cur], _todA);
  todVals(TOD[key], _todB);
  todState.cur = key;
  todState.from = Object.assign({}, _todA); todState.to = Object.assign({}, _todB);
  todState.t = instant ? 1 : 0;
  applyTodMix(todState.from, todState.to, instant ? 1 : 0);
  if (typeof onTodChanged === 'function') onTodChanged(key);
}
function updateTOD(dt) {
  if (todState.t < 1) { todState.t = Math.min(1, todState.t + dt / 2.2); applyTodMix(todState.from, todState.to, sstep(0, 1, todState.t)); }
}
function updateSunShadow(focus) {
  const sun = ENV.sun;
  const texel = 150 / Math.max(256, sun.shadow.mapSize.x);
  const fx = Math.round(focus.x / texel) * texel, fz = Math.round(focus.z / texel) * texel;
  sun.target.position.set(fx, 0, fz);
  sun.position.set(fx + U.sunDir.value.x * 220, U.sunDir.value.y * 220 + 2, fz + U.sunDir.value.z * 220);
  if (U.sunDir.value.y < 0.08) sun.position.y = 22;
  ENV.sky.position.copy(camera.position);
  ENV.mtn.position.set(camera.position.x, 30, camera.position.z);
}
