/* ================= 13 主程式：載入流程、介面、主迴圈 ================= */
window.DEBUG_TRIS = /dbg/.test(location.search);
function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2200); }
function toggleHide() { const ui = $('ui'); if (TOUR.active) ui.classList.toggle('cine'); else ui.classList.toggle('hide'); }
function syncMute() { const b = $('btnMute'); b.textContent = SFX.muted ? '✕' : '♪'; b.setAttribute('aria-pressed', SFX.muted ? 'true' : 'false'); b.title = SFX.muted ? '取消靜音（M）' : '靜音（M）'; }
function hideStart() { const s = $('start'); s.classList.add('gone'); setTimeout(() => { s.hidden = true; }, 900); }
function TOD_KEY_NOW() { return todState.cur; }
function onTodChanged(k) {
  for (const b of document.querySelectorAll('#todSeg button')) b.classList.toggle('on', b.dataset.tod === k);
  const c = $('clock'); if (c) c.textContent = TOD[k].clock;
}
function setQuality(k) {
  if (!QUALITY[k]) return; QKEY = k; Q = QUALITY[k]; PREF.set('q', k);
  renderer.setPixelRatio(Q.pr); U.pr.value = renderer.getPixelRatio(); fitRenderer(true); onResize();
  ENV.sun.castShadow = Q.shadows;
  if (ENV.sun.shadow.map) { ENV.sun.shadow.map.dispose(); ENV.sun.shadow.map = null; }
  ENV.sun.shadow.mapSize.set(Q.shadow, Q.shadow);
  setFoliageDensity(Q.foliage); setPetalCount(Q.petals); applyPeopleQuality();
  for (const b of document.querySelectorAll('#qSeg button')) b.classList.toggle('on', b.dataset.q === k);
}
/* 版面上的地區名稱 */
const AREAS = [
  ['延平街・安平老街', (x, z) => x > -24 && x < 70 && Math.abs(z) < 14],
  ['劍獅埕廣場', (x, z) => x >= 70 && x < 93 && Math.abs(z) < 14],
  ['開台天后宮', (x, z) => Math.hypot(x - TEMPLE_POS.x, z - TEMPLE_POS.z) < 26],
  ['熱蘭遮城城垣殘蹟', (x, z) => x > -115 && x < -44 && z > -47 && z < -34],
  ['安平古堡', (x, z) => x > -122 && x < -8 && z > -124 && z <= -47],
  ['德記洋行・安平樹屋', (x, z) => x > -100 && x < -40 && z <= -124],
  ['夕遊出張所', (x, z) => x <= -100 && x > -136 && z <= -124],
  ['運河遊船碼頭', (x, z) => x > -40 && x < -12 && z > 26 && z < 45],
  ['台南運河', (x, z) => z >= 26 && z <= 70 && x > -136],
  ['億載金城', (x, z) => Math.hypot(x - W.fort.x, z - W.fort.z) < 72],
  ['觀夕平台', (x, z) => x < -134 && z > 92 && z < 128],
  ['安平海岸', (x) => x < -130],
  ['安北路口', (x, z) => Math.hypot(x - ROAD.B, z - ROAD.A) < 18],
  ['安平住宅區', () => true],
];
let _uiT = 0, _cardKey = '';
function updateUI(dt) {
  _uiT -= dt; if (_uiT > 0) return; _uiT = 0.25;
  const p = TOUR.active ? camera.position : PLAYER.pos;
  const a = AREAS.find(([, f]) => f(p.x, p.z));
  const el = $('area'); if (a && el.textContent !== a[0]) el.textContent = a[0];
  if (TOUR.active) { $('card').hidden = true; return; }
  let best = null, bd = 1e9;
  for (const c of INFO) { const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < c.r && d < bd) { bd = d; best = c; } }
  const card = $('card');
  if (!best) { if (!card.hidden) { card.hidden = true; _cardKey = ''; } return; }
  if (_cardKey !== best.title) {
    _cardKey = best.title;
    card.querySelector('.era').textContent = best.era; card.querySelector('h3').textContent = best.title;
    card.querySelector('.en').textContent = best.en; card.querySelector('p').textContent = best.body;
    const tag = card.querySelector('.tag'); tag.textContent = best.tag || ''; tag.hidden = !best.tag;
    card.hidden = false;
  }
}
function initUI() {
  const sp = $('spots');
  SPOTS.forEach((s, i) => { const b = document.createElement('button'); b.id = 'spot-' + s.k; b.innerHTML = `<kbd>${s.k}</kbd><span>${s.name}</span>`; b.addEventListener('click', () => { if (TOUR.active) tourStop(); teleport(i); }); sp.appendChild(b); });
  for (const b of document.querySelectorAll('#todSeg button')) b.addEventListener('click', () => setTOD(b.dataset.tod));
  for (const b of document.querySelectorAll('#qSeg button')) { b.addEventListener('click', () => setQuality(b.dataset.q)); b.classList.toggle('on', b.dataset.q === QKEY); }
  $('btnTour').addEventListener('click', () => { if (TOUR.active) tourStop(); else tourStart(); });
  $('btnMute').addEventListener('click', () => { SFX.start(); SFX.setMuted(!SFX.muted); syncMute(); });
  $('btnHelp').addEventListener('click', () => { $('help').hidden = !$('help').hidden; });
  $('helpClose').addEventListener('click', () => { $('help').hidden = true; });
  $('tourPrev').addEventListener('click', () => tourJump(-1));
  $('tourNext').addEventListener('click', () => tourJump(1));
  $('tourStop').addEventListener('click', () => tourStop());
  $('tourVoice').addEventListener('click', () => { TOUR.speechOn = !TOUR.speechOn; PREF.set('speech', TOUR.speechOn ? '1' : '0'); syncSpeechBtn(); if (!TOUR.speechOn) NARR.stop(); });
  $('btnWalk').addEventListener('click', () => { STARTED = true; SFX.start(); hideStart(); teleport(0); if (!isTouch) requestLock(); toast(isTouch ? '左半邊拖曳走路、右半邊拖曳轉頭' : '點畫面鎖定視角・WASD 走路・數字鍵傳送'); });
  $('btnWatch').addEventListener('click', () => { STARTED = true; tourStart(); });
  if (isTouch) document.documentElement.classList.add('touch');
  syncMute();
  addEventListener('resize', onResize);
}
function onResize() {
  fitRenderer(true);
  const h = VIEW_H * renderer.getPixelRatio();
  if (ENV.halos) ENV.halos.material.uniforms.uH.value = h;
  if (PETALS) PETALS.material.uniforms.uH.value = h;
  if (SMOKE) SMOKE.material.uniforms.uH.value = h;
}
/* 天公爐香煙 */
let SMOKE = null;
function buildSmoke() {
  const N = 120, pos = [], rnd4 = [];
  for (const s of SMOKE_SRC) for (let i = 0; i < N; i++) { pos.push(s.x, s.y, s.z); rnd4.push(rnd(), rnd(), rnd(), rnd()); }
  if (!pos.length) return;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd4, 4));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: U.time, uH: { value: innerHeight }, uWind: U.wind, uLight: U.folLight }, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 aRand;uniform float uTime,uH,uWind;varying float vA;void main(){float T=6.;float t=mod(uTime+aRand.x*T,T);vec3 p=position;p.y+=t*.9;p.x+=sin(t*.9+aRand.y*6.)*(.2+t*.15)+t*.25*uWind;p.z+=cos(t*.7+aRand.z*6.)*(.2+t*.12);vA=(1.-t/T)*smoothstep(0.,.6,t)*.13;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(.12+t*.16)*uH/(-mv.z);}`,
    fragmentShader: `uniform vec3 uLight;varying float vA;void main(){vec2 d=gl_PointCoord-.5;float a=smoothstep(.5,.0,length(d))*vA;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(.75),uLight,.4),a);
    #include <encodings_fragment>
    }`
  });
  SMOKE = new THREE.Points(g, m); SMOKE.frustumCulled = false; scene.add(SMOKE);
}
/* 基本圖集：劍獅、廟門、匾額 */
function drawAtlasBasics() {
  const A = ATLAS_BOARD;
  A.lionL = A.draw(160, 160, (g, w) => drawSwordLion(g, w / 2, w / 2, w / 2 - 2, 'L'));
  A.lionR = A.draw(160, 160, (g, w) => drawSwordLion(g, w / 2, w / 2, w / 2 - 2, 'R'));
  A.lionBig = A.draw(512, 512, (g, w) => drawSwordLion(g, w / 2, w / 2, w / 2 - 4, 'L'));
  A.door = A.draw(128, 200, (g, w, h) => {
    g.fillStyle = '#a61c1c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#e3b23c'; g.lineWidth = 5; g.strokeRect(4, 4, w - 8, h - 8);
    g.fillStyle = '#e3b23c'; for (let i = 0; i < 5; i++) for (let j = 0; j < 9; j++) { g.beginPath(); g.arc(20 + i * 22, 22 + j * 20, 4.2, 0, TAU); g.fill(); }
    g.strokeStyle = '#c9962e'; g.lineWidth = 4; g.beginPath(); g.arc(w - 20, h / 2 + 10, 9, 0, TAU); g.stroke();
  });
  const plaque = (text, w, h, bg, fg, border, rtl, font) => A.draw(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = border; g.lineWidth = h * 0.08; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
    const chars = [...text]; if (rtl) chars.reverse();
    const cs = Math.min(h * 0.62, (w - h * 0.4) / chars.length * 0.92);
    g.font = `900 ${cs}px ${font || FONT_KAI}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    chars.forEach((c, i) => { const x = w / 2 + (i - (chars.length - 1) / 2) * (w - h * 0.4) / chars.length; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillText(c, x + 2, h / 2 + 3); g.fillStyle = fg; g.fillText(c, x, h / 2); });
  });
  A.plaqueTemple = plaque('聖母安瀾', 512, 136, '#1f3a5a', '#f0c96a', '#e3b23c', true);
  A.plaqueGate = plaque('開台天后宮', 512, 104, '#1b1b1b', '#f0c96a', '#b3261e', true);
  A.plaqueFortOut = plaque('億載金城', 480, 150, '#d9d4c7', '#3a3530', '#a9a397', true, FONT_SERIF);
  A.plaqueFortIn = plaque('萬流砥柱', 480, 150, '#d9d4c7', '#3a3530', '#a9a397', true, FONT_SERIF);
}
function addInfoCards() {
  infoBoard(-19.5, -2.2, Math.PI / 2, { era: '荷蘭時期起源・清代市仔街', title: '延平街', en: 'Yanping Old Street', body: '常被稱作「台灣第一街」，源頭可追溯到荷蘭時期的熱蘭遮市鎮，清代叫市仔街。1995 年拓寬後，老街樣貌已大幅改變，蝦餅、蜜餞、豆花的香味倒是沒變。', tag: '通說：台灣第一街' }, 14);
  infoBoard(73.5, -9, 0, { era: '安平的守護符號', title: '劍獅', en: 'Sword Lion', body: '門楣上口咬寶劍的獅面。一說源自鄭軍把獅面盾牌和刀劍掛在家門，一說是鎮宅辟邪。劍柄在左祈福、在右辟邪，咬雙劍則是止煞（各家說法不一）。', tag: '說法不一' }, 11);
  infoBoard(88.5, 8.5, -Math.PI / 2, { era: '1896–97 年引進', title: '鳳凰木', en: 'Flame Tree · Delonix regia', body: '日治初期引進台灣，台南最早種在安平稅關與英國領事館。鳳凰花曾是台南市花，現為台南市樹；5 到 7 月盛開，正是畢業季。', tag: '台南市樹' }, 9);
  infoBoard(-6, 31.5, 0, { era: '1926 年開通', title: '台南運河', en: 'Tainan Canal', body: '1922 年動工、1926 年 4 月通航，全長 3.782 公里，連接府城與安平，取代淤塞的舊航道。2026 年正好滿一百年。', tag: '百年運河' }, 18);
  infoBoard(-52, -58, 0, { era: '1624 築城・1930 改建', title: '安平古堡', en: 'Anping Old Fort · Fort Zeelandia', body: '荷蘭人 1624 年開始築城，1634 年大致完工。高台上的白色洋房是 1930 年的紀念館，紅頂瞭望台 1975 年改建；真正的荷蘭遺跡是外側殘牆。', tag: '國定古蹟・熱蘭遮堡遺構' }, 20);
  infoBoard(-33, -40, 0, { era: '有爭議：大員的語源', title: '地名由來：大員 → 安平', en: 'Tayouan → Anping', body: '這裡古稱一鯤鯓，十七世紀叫大員，一說源自西拉雅語。1661 年鄭成功改名安平鎮，取自泉州安平，那是鄭家的根據地。', tag: '地名小百科' }, 12);
}
/* 船 */
function placeBoats() {
  buildJunk(-72, 59.2, -Math.PI / 2);
  buildFishingBoat(-145, 43.2, Math.PI / 2, '#2b5da8'); buildFishingBoat(-134, 43.2, Math.PI / 2, '#c0392b');
  buildFishingBoat(-140, 58.8, -Math.PI / 2, '#2b8a5a'); buildFishingBoat(-127, 58.8, -Math.PI / 2, '#2b5da8'); buildFishingBoat(-104, 58.8, -Math.PI / 2, '#d9822b');
}
/* 人物 */
const SKINS = ['#f6d7c3', '#f1cdb5', '#e9c3a8', '#f3d2bd', '#efc9ae'];
const HAIRS = ['#2b1d18', '#3a2418', '#1c1412', '#4a3020', '#5a3a28'];
const EYES = ['#6a3b2a', '#3a6fb0', '#5a3a8a', '#2f7a5a', '#8a4a2a', '#3b2a22'];
function girl(style, o) { return Object.assign({ female: true, skin: pick(SKINS), top: '#ffffff', bottom: '#23324f', bottomType: 'skirt', pleats: '#1a263e', skirtW: 0.24, socks: '#ffffff', socksH: 0.2, shoes: '#2a2426', ribbon: '#b3261e', hair: pick(HAIRS), hairStyle: style, face: { eye: pick(EYES), blush: true }, embroid: '#e0b23a', scale: rr(0.93, 0.98) }, o || {}); }
function boy(o) { return Object.assign({ skin: pick(SKINS), top: '#d9c9a2', bottom: '#c9b68c', bottomType: 'pants', shoes: '#2a2426', hair: pick(HAIRS), hairStyle: 'short', face: { eye: pick(['#3b2a22', '#2a2020']), male: true }, embroid: '#2a5ca8', scale: rr(1.0, 1.05) }, o || {}); }
function tourist(o) { const f = chance(0.55); return Object.assign({ female: f, skin: pick(SKINS), top: pick(['#f5e6c8', '#8ec3d8', '#f2b8a0', '#ffffff', '#b8d8a8', '#e8c5e0', '#3d6e9e']), bottom: pick(['#5a6b8a', '#2e2e2e', '#c9b48a', '#3a4a6a']), bottomType: f ? pick(['skirt', 'pants', 'shorts']) : pick(['pants', 'shorts']), skirtW: 0.27, shoes: pick(['#f2f2f2', '#2a2426', '#b8865a']), hair: pick(HAIRS), hairStyle: f ? pick(['long', 'bob', 'pony', 'twin']) : 'short', face: { eye: pick(EYES), blush: f, male: !f }, hat: chance(0.35) ? pick(['straw', 'cap']) : null, hatCol: pick(['#b3261e', '#2d5c93', '#2f6b4f']), bag: chance(0.4) ? pick(['#c9a27a', '#3a3a3a', '#e8d6b0']) : null, scale: f ? rr(0.94, 0.99) : rr(1.0, 1.06) }, o || {}); }
function placePeople() {
  reseed(90210);
  const W2 = (pts) => pts.map(p => [p[0], p[1]]);
  const street = (z, spd) => ({ type: 'walk', path: [[-18, z], [66, z]], stops: 0.25, speed: spd || rr(1.0, 1.3), pause: [1, 4] });
  // 老街
  addPerson(girl('pony'), street(1.0));
  addPerson(girl('twin', { sailor: '#5b8fc9', ribbon: '#1f3a6a', top: '#ffffff', bottom: '#1f3a6a' }), street(1.3));
  addPerson(boy(), street(-1.1));
  addPerson(tourist({ hold: 'bag' }), street(-0.8));
  // 劍獅埕
  addPerson(girl('long'), { type: 'chat', x: 75.2, z: 6.2, face: 2.2 });
  addPerson(girl('bob', { hold: 'cup' }), { type: 'chat', x: 76.8, z: 7.6, face: -2.6 });
  addPerson(girl('twin', { sailor: '#5b8fc9', ribbon: '#1f3a6a', bottom: '#1f3a6a' }), { type: 'chat', x: 74.3, z: 7.9, face: 2.9 });
  // 天后宮
  const T = new Frame(TEMPLE_POS.x, TEMPLE_POS.z, 1.05);
  addPerson({ female: true, skin: '#e9c3a8', top: '#d9829a', pattern: ['#f7e6c4', '#7a3a5a', '#2f7a5a'], bottom: '#2a2a3a', bottomType: 'pants', hair: '#8a8a8a', hairStyle: 'bun', face: { eye: '#3b2a22', old: true }, armCover: '#6d8fb3', hold: 'incense', scale: 0.92 }, { type: 'pray', x: T.p(-1.3, 19.8)[0], z: T.p(-1.3, 19.8)[1], face: T.rot + Math.PI });
  addPerson(tourist({ hold: 'incense', hat: null }), { type: 'pray', x: T.p(1.3, 19.9)[0], z: T.p(1.3, 19.9)[1], face: T.rot + Math.PI });
  addPerson({ skin: '#e9c3a8', top: '#f4f4f0', bottom: '#2a2a3a', bottomType: 'shorts', shortsCol: '#2a2a3a', hair: '#9a9a9a', hairStyle: 'short', face: { eye: '#3b2a22', old: true, male: true }, scale: 1.0 }, { type: 'idle', x: T.p(5.5, 12.4)[0], z: T.p(5.5, 12.4)[1], face: T.rot });
  // 碼頭
  addPerson(tourist({ hold: 'phone' }), { type: 'photo', x: -30, z: 41.6, face: 0.3 });
  addPerson(girl('long', { hat: 'straw', hatCol: '#e0773a', bottomType: 'skirt', top: '#f5e6c8', bottom: '#8ec3d8', socks: null, pleats: null }), { type: 'idle', x: -23, z: 41.2, face: 0.1 });
  addPerson({ skin: '#dcb090', top: '#4a6a8a', longSleeve: true, bottom: '#2a3a4a', bottomType: 'pants', boots: '#f2f2f0', hat: 'douli', hair: '#3a3a3a', hairStyle: 'short', face: { eye: '#3b2a22', male: true, old: true }, hold: 'rod', scale: 1.02 }, { type: 'fish', x: 10, z: 39.1, face: 0 });
  // 自行車
  addPerson(girl('pony', { bag: null }), { type: 'bike', path: [[-118, 33.4], [36, 33.4]], speed: 4.3, basket: true, keep: true });
  addPerson(tourist({ hat: 'cap' }), { type: 'bike', path: [[34, 65.6], [-126, 65.6]], speed: 4.8 });
  // 古堡
  addPerson({ skin: '#f1d0bb', top: '#2a2a30', longSleeve: true, cape: '#7a1a1a', sailor: '#f0e6d0', bottom: '#2a2a30', bottomType: 'pants', boots: '#3a2a1a', hat: 'dutch', hair: '#6a4a2a', hairStyle: 'short', face: { eye: '#3a6fb0', male: true }, scale: 1.04 }, { type: 'guide', x: -66, z: -66.5, y: FORT_TOP + 0.13, face: 0.4 });
  addPerson(tourist({ hold: 'phone' }), { type: 'photo', x: -61, z: -64, y: FORT_TOP + 0.13, face: Math.PI - 0.3 });
  addPerson(tourist({ hold: 'phone' }), { type: 'photo', x: -76, z: -37.6, face: Math.PI + 0.2 });
  // 億載金城
  const F = new Frame(W.fort.x, W.fort.z, W.fort.rot);
  addPerson(tourist(), { type: 'walk', path: [F.p(50, 0.6), F.p(22, 0.6), F.p(4, 6), F.p(-12, 12)], speed: 1.1, pause: [2, 5] });
  addPerson(boy({ top: '#ffffff', bottom: '#1f2d4a' }), { type: 'photo', x: F.p(8, -6)[0], z: F.p(8, -6)[1], face: F.rot + Math.PI / 2 });
  // 觀夕平台
  addPerson(tourist({ hat: null }), { type: 'idle', x: -156, z: 108.8, y: 0.65, face: -Math.PI / 2 });
  addPerson(girl('long', { top: '#f2b8a0', bottom: '#f5e6c8', socks: null, pleats: null, bottomType: 'skirt' }), { type: 'idle', x: -156, z: 110.4, y: 0.65, face: -Math.PI / 2 - 0.2 });
  // 路口行人
  const cross = { type: 'walk', loop: true, cross: [0, 3], speed: 1.25, path: [[ROAD.B - 7.2, ROAD.A + 5.4], [ROAD.B - 7.2, ROAD.A - 5.4], [60, ROAD.A - 5.4], [ROAD.B - 7.4, ROAD.A - 5.3], [ROAD.B - 7.4, ROAD.A + 5.3], [60, ROAD.A + 5.3]] };
  addPerson(tourist(), cross);
  addPerson(girl('bob'), Object.assign({}, cross, { path: cross.path.slice(3).concat(cross.path.slice(0, 3)), cross: [0, 3] }));
  // 老街攤商
  addPerson({ female: true, skin: '#e9c3a8', top: '#e7a6b7', pattern: ['#fff', '#b33a5a'], bottom: '#3a3a4a', bottomType: 'apron', apron: '#6d8fb3', hair: '#7a7a7a', hairStyle: 'bun', face: { eye: '#3b2a22', old: true }, armCover: '#6d8fb3', scale: 0.9 }, { type: 'sit', x: 27, z: 2.1, face: Math.PI });
  addPerson({ skin: '#efc9ae', top: '#ffffff', bottom: '#2e2e2e', bottomType: 'apron', apron: '#b3261e', hair: '#1c1412', hairStyle: 'short', face: { eye: '#3b2a22', male: true }, scale: 1.02 }, { type: 'vendor', x: -12, z: -1.8, face: 0 });
  addPerson({ female: true, skin: '#f3d2bd', top: '#f2d06b', bottom: '#2e2e2e', bottomType: 'apron', apron: '#2f7d4f', hair: '#3a2418', hairStyle: 'pony', face: { eye: '#6a3b2a', blush: true }, scale: 0.95 }, { type: 'vendor', x: 41, z: 1.8, face: Math.PI });
  // 其他
  addPerson(tourist(), street(0.2, 0.9));
  addPerson(boy({ top: '#ffffff', bottom: '#1f2d4a', bag: '#2a2a2a' }), street(-0.3, 1.35));
  addPerson(tourist({ hat: 'straw' }), { type: 'walk', path: [[-20, 1], [T.p(0, 30)[0], T.p(0, 30)[1]], [T.p(0, 22)[0], T.p(0, 22)[1]]], speed: 1.0, pause: [3, 6] });
  addPerson(tourist(), { type: 'walk', path: [[-110, 35.6], [30, 35.6]], speed: 1.15, stops: 0.1 });
  addPerson(girl('long', { top: '#ffffff', bottom: '#6d4a3a', pleats: '#5a3a2a', ribbon: '#2f6b4f' }), { type: 'walk', path: [[-120, 66.5], [30, 66.5]], speed: 1.1 });
}

/* ---------- 載入流程 ---------- */
const nextFrame = () => new Promise(r => { let done = false; const f = () => { if (!done) { done = true; r(); } }; requestAnimationFrame(f); setTimeout(f, 60); });
async function loadFonts() {
  if (!document.fonts || !document.fonts.load) return;
  const txt = SHOP_LIST.map(s => s[0]).join('') + '延平街安平老街劍獅埕運河遊船碼頭聖母安瀾開台天后宮億載金城萬流砥柱安平古堡英商德記洋行夕遊出張所下一班約分鐘航程往返安億橋停古堡街安北路老街站熱蘭遮城城垣殘蹟台南地名誌解說牌蝦餅蜜餞豆花蚵嗲蚵仔煎蝦捲冰冬瓜茶椪餅魚粥意麵蛋捲咖啡王';
  const t = Promise.all([
    document.fonts.load(`700 40px "LXGW WenKai TC"`, txt), document.fonts.load(`900 40px "Noto Serif TC"`, txt),
    document.fonts.load(`700 20px "Noto Sans TC"`, txt + '台灣第一街 NEXT'), document.fonts.load(`400 20px "Noto Sans TC"`, INFO_TEXT_SAMPLE),
  ]).catch(() => { });
  await Promise.race([t, new Promise(r => setTimeout(r, 4000))]);
}
const INFO_TEXT_SAMPLE = '常被稱作台灣第一街源頭可追溯到荷蘭時期的熱蘭遮市鎮清代叫市仔街年拓寬後老街樣貌已大幅改變蝦餅蜜餞豆花香味倒是沒變門楣上口咬寶劍的獅面一說源自鄭軍把獅面盾牌和刀劍掛在家門是鎮宅辟邪劍柄在左祈福右止煞咬雙各家說法不日治初期引進灣南最早種安平稅關與英國領事館鳳凰花曾市現為樹月盛開正畢業季動工通航全長公里連接府城取代淤塞舊航道好滿一百人始築完工高台上白色洋房紀念紅頂瞭望改建真遺跡外側殘牆古稱鯤鯓十七世紀大員西拉雅語改名泉州根據地城南壁磚七十多保留原貌遺構老榕樹根緊抱相傳縫糖水糯米蚵殼灰調和條約開港德記怡記和記唻記東興五家洋行進駐運往界這棟拱廊樓英商倉庫堆放鹽屋頂塌落氣根點吞覆牆面冠成新整修專賣務辦公處洋折衷木造建築曾田業漁撐起港鎮日常媽祖神像隨船隊來舊廟拆於水師衙門址重殿為簷歇山青綠琉璃瓦牡丹社事件沈葆楨籌防請法籍工程師設計西式砲又稱二題億載金萬流砥柱部分據說取自面向峽三角形棧平清沙鯤漁火列入八景一到串洲就前身養蚵原竹棚下吊著燒成料也泥塑之';
async function boot() {
  const bar = document.querySelector('#loading .bar i'), lab = $('loading').firstChild;
  const steps = [
    ['準備字型', loadFonts],
    ['畫貼圖與招牌', () => { buildTextures(); buildMaterials(); initPeopleMats(); drawAtlasBasics(); }],
    ['天空與海', () => { buildEnv(); setTOD('noon', true); }],
    ['地面與道路', buildGround],
    ['延平街商店', buildOldStreet],
    ['劍獅埕與運河岸', () => { buildPlaza(); buildCanalside(); }],
    ['安平古堡與城垣殘蹟', () => { buildOldFort(); buildWallRuin(); }],
    ['德記洋行與樹屋', buildTaitAndTreeHouse],
    ['開台天后宮', buildTemple],
    ['億載金城', buildEternalFort],
    ['海岸與蚵棚', buildCoast],
    ['住宅與街景', () => { buildNeighborhoods(); addInfoCards(); buildTrafficSignals(); }],
    ['合併網格與樹冠', () => { finishAtlasMaterials(); buildBatches(); buildFoliage(); buildPetals(); buildHalos(); buildSmoke(); }],
    ['車流與遊船', () => { buildTraffic(); buildTourBoat(); placeBoats(); }],
    ['居民與遊客', () => { placePeople(); buildPeople(); }],
    ['完成', () => { ATLAS_SIGN.t.needsUpdate = true; ATLAS_BOARD.t.needsUpdate = true; ATLAS_INFO.t.needsUpdate = true; initUI(); initControls(); onTodChanged('noon'); }],
  ];
  for (let i = 0; i < steps.length; i++) {
    lab.textContent = steps[i][0] + '…';
    await nextFrame();
    await steps[i][1]();
    if (window.DEBUG_TRIS) { const o = {}; for (const k in BATCH) if (BATCH[k].p) o[k] = Math.round(BATCH[k].p.length / 9); (window.TRILOG = window.TRILOG || []).push(steps[i][0] + ' ' + JSON.stringify(o)); }
    bar.style.width = ((i + 1) / steps.length * 100).toFixed(0) + '%';
  }
  lab.textContent = '街景搭好了，選一種方式進入安平';
  $('btnWalk').disabled = false; $('btnWatch').disabled = false;
  renderer.compile(scene, camera);
  onResize();
  requestAnimationFrame(frame);
}
let _last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (RECORDING) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - _last) / 1000)); _last = now;
  U.time.value += dt;
  if (fitRenderer(false)) onResize();
  updateTOD(dt);
  if (TOUR.active) updateTour(dt);
  else if (STARTED) updatePlayer(dt);
  else { const a = U.time.value * 0.04; camera.position.set(Math.cos(a) * 150 - 20, 55, Math.sin(a) * 150); camera.lookAt(-10, 0, 0); }
  updateTraffic(dt); updateBoats(dt, U.time.value); updatePeople(dt, U.time.value);
  if (_barberMat) _barberMat.map.offset.y = (_barberMat.map.offset.y + dt * 0.4) % 1;
  updateSunShadow(camera.position);
  SFX.update(dt);
  updateUI(dt);
  renderer.render(scene, camera);
}
boot().catch(e => { console.error(e); const l = $('loading'); if (l) l.firstChild.textContent = '載入失敗：' + e.message; });
