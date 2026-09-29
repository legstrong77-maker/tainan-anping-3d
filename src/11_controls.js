/* ================= 11 操作：第一人稱、碰撞、傳送、觸控 ================= */
const PLAYER = { pos: new THREE.Vector3(-8, 0, 0.5), vx: 0, vz: 0, vy: 0, yaw: -Math.PI / 2, pitch: 0.02, fly: false, onGround: true, safe: new THREE.Vector3(-8, 0, 0.5), safeT: 0, bob: 0, stepT: 0 };
const KEYS = {};
const TOUCH = { f: 0, s: 0, jump: false, up: false, id: null, lookId: null, ox: 0, oy: 0, lx: 0, ly: 0 };
const EYE = 1.62, RAD = 0.32, HEIGHT = 1.75;
let pointerLocked = false, dragLook = false, STARTED = false;
const SPOTS = [
  { k: '1', name: '延平街・安平老街', p: [-8, 0, 0.5], yaw: -Math.PI / 2, pitch: 0.02 },
  { k: '2', name: '安平古堡', p: [-62, 4.33, -66], yaw: 0.2, pitch: 0.18 },
  { k: '3', name: '熱蘭遮城城垣殘蹟', p: [-80, 0, -37.5], yaw: 0.35, pitch: 0.1 },
  { k: '4', name: '德記洋行・樹屋', p: [-70, 0, -126], yaw: 0, pitch: 0.12 },
  { k: '5', name: '開台天后宮', p: [-32.5, 0, 12.9], yaw: 1.05, pitch: 0.1 },
  { k: '6', name: '劍獅埕廣場', p: [80, 0, 11], yaw: 0.1, pitch: 0.1 },
  { k: '7', name: '運河・遊船碼頭', p: [-6, 0, 36], yaw: Math.PI / 2 + 0.15, pitch: 0.02 },
  { k: '8', name: '億載金城', p: [47, 0, 100], yaw: Math.PI - 0.55, pitch: 0.06 },
  { k: '9', name: '觀夕平台', p: [-146, 0.65, 110], yaw: Math.PI / 2, pitch: 0.03 },
  { k: '0', name: '安北路口・紅綠燈', p: [86, 0.15, -22.8], yaw: -1.21, pitch: 0.04 },
];
function look(dx, dy) { PLAYER.yaw -= dx * 0.0022; PLAYER.pitch = clamp(PLAYER.pitch - dy * 0.0022, -1.45, 1.45); }
function requestLock() { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => { }); } catch (e) { } }
function teleport(i) {
  const s = SPOTS[i]; if (!s) return;
  PLAYER.pos.set(s.p[0], s.p[1], s.p[2]); PLAYER.safe.copy(PLAYER.pos); PLAYER.vy = 0; PLAYER.vx = PLAYER.vz = 0;
  PLAYER.yaw = s.yaw; PLAYER.pitch = s.pitch; PLAYER.fly = false;
  toast('已傳送：' + s.name);
}
function initControls() {
  addEventListener('keydown', (e) => {
    if (!STARTED) return;
    KEYS[e.code] = true;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    if (TOUR.active) { if (k === 't' || e.code === 'Escape') tourStop(); else if (k === 'h') toggleHide(); else if (k === 'm') SFX.setMuted(!SFX.muted), syncMute(); else if (e.code === 'ArrowRight') tourJump(1); else if (e.code === 'ArrowLeft') tourJump(-1); return; }
    if (k === 'f') { PLAYER.fly = !PLAYER.fly; PLAYER.vy = 0; toast(PLAYER.fly ? '飛行模式：空白鍵上升、C 下降' : '回到地面行走'); }
    else if (k === 'h') toggleHide();
    else if (k === 'm') { SFX.setMuted(!SFX.muted); syncMute(); }
    else if (k === 't') tourStart();
    else if (k === 'n') { const ks = ['noon', 'dusk', 'night']; setTOD(ks[(ks.indexOf(todState.cur) + 1) % 3]); }
    else { const i = SPOTS.findIndex(s => s.k === e.key); if (i >= 0) teleport(i); }
  });
  addEventListener('keyup', (e) => { KEYS[e.code] = false; });
  addEventListener('blur', () => { for (const k in KEYS) KEYS[k] = false; });
  canvas.addEventListener('click', () => { if (STARTED && !isTouch && !TOUR.active && !pointerLocked) requestLock(); });
  document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === canvas; });
  document.addEventListener('mousemove', (e) => { if (TOUR.active) return; if (pointerLocked) look(e.movementX, e.movementY); else if (dragLook) look(e.movementX * 1.4, e.movementY * 1.4); });
  canvas.addEventListener('mousedown', () => { if (!pointerLocked) dragLook = true; });
  addEventListener('mouseup', () => { dragLook = false; });
  // 觸控：左半邊走路、右半邊轉頭
  const stick = document.getElementById('stick'), knob = stick.firstElementChild;
  canvas.addEventListener('touchstart', (e) => {
    if (!STARTED) return;
    for (const t of e.changedTouches) {
      if (t.clientX < innerWidth / 2 && TOUCH.id === null) { TOUCH.id = t.identifier; TOUCH.ox = t.clientX; TOUCH.oy = t.clientY; stick.style.display = 'block'; stick.style.left = t.clientX + 'px'; stick.style.top = t.clientY + 'px'; knob.style.transform = ''; }
      else if (TOUCH.lookId === null) { TOUCH.lookId = t.identifier; TOUCH.lx = t.clientX; TOUCH.ly = t.clientY; }
    }
    e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === TOUCH.id) { const dx = (t.clientX - TOUCH.ox) / 45, dy = (t.clientY - TOUCH.oy) / 45; TOUCH.s = clamp(dx, -1, 1); TOUCH.f = clamp(-dy, -1, 1); knob.style.transform = `translate(${TOUCH.s * 32}px,${-TOUCH.f * 32}px)`; }
      else if (t.identifier === TOUCH.lookId) { if (!TOUR.active) look((t.clientX - TOUCH.lx) * 2.4, (t.clientY - TOUCH.ly) * 2.4); TOUCH.lx = t.clientX; TOUCH.ly = t.clientY; }
    }
    e.preventDefault();
  }, { passive: false });
  const end = (e) => { for (const t of e.changedTouches) { if (t.identifier === TOUCH.id) { TOUCH.id = null; TOUCH.f = TOUCH.s = 0; stick.style.display = 'none'; } if (t.identifier === TOUCH.lookId) TOUCH.lookId = null; } };
  canvas.addEventListener('touchend', end); canvas.addEventListener('touchcancel', end);
  const tj = document.getElementById('tJump'), tf = document.getElementById('tFly');
  tj.addEventListener('touchstart', (e) => { TOUCH.jump = true; TOUCH.up = true; e.preventDefault(); }, { passive: false });
  tj.addEventListener('touchend', () => { TOUCH.up = false; });
  tf.addEventListener('click', () => { PLAYER.fly = !PLAYER.fly; PLAYER.vy = 0; toast(PLAYER.fly ? '飛行模式：按「跳」上升' : '回到地面行走'); });
}
function updatePlayer(dt) {
  const p = PLAYER.pos;
  let f = 0, s = 0;
  if (KEYS.KeyW || KEYS.ArrowUp) f += 1; if (KEYS.KeyS || KEYS.ArrowDown) f -= 1;
  if (KEYS.KeyD || KEYS.ArrowRight) s += 1; if (KEYS.KeyA || KEYS.ArrowLeft) s -= 1;
  f += TOUCH.f; s += TOUCH.s;
  const run = KEYS.ShiftLeft || KEYS.ShiftRight || Math.hypot(TOUCH.f, TOUCH.s) > 0.95;
  const sp = PLAYER.fly ? (run ? 28 : 12) : (run ? 6.5 : 3.2);
  const sy = Math.sin(PLAYER.yaw), cy = Math.cos(PLAYER.yaw);
  let mx = -sy * f + cy * s, mz = -cy * f - sy * s; const ml = Math.hypot(mx, mz); if (ml > 1) { mx /= ml; mz /= ml; }
  const k = Math.min(1, dt * (PLAYER.onGround || PLAYER.fly ? 10 : 2.5));
  PLAYER.vx = lerp(PLAYER.vx, mx * sp, k); PLAYER.vz = lerp(PLAYER.vz, mz * sp, k);
  if (PLAYER.fly) {
    p.x += PLAYER.vx * dt; p.z += PLAYER.vz * dt;
    let vy = 0; if (KEYS.Space || TOUCH.up) vy += sp * 0.7; if (KEYS.KeyC || KEYS.ControlLeft) vy -= sp * 0.7;
    p.y = Math.max(p.y + vy * dt, floorAt(p.x, p.z, p.y) + 0.05); p.y = Math.min(p.y, 160);
    TOUCH.jump = false;
  } else {
    const d = Math.hypot(PLAYER.vx, PLAYER.vz) * dt, n = Math.max(1, Math.ceil(d / 0.2));
    for (let i = 0; i < n; i++) { p.x += PLAYER.vx * dt / n; p.z += PLAYER.vz * dt / n; pushOut(p, p.y, RAD, HEIGHT); }
    pushOut(p, p.y, RAD, HEIGHT);
    PLAYER.vy -= 18 * dt; p.y += PLAYER.vy * dt;
    const fl = floorAt(p.x, p.z, Math.max(p.y, p.y - PLAYER.vy * dt));
    if (p.y <= fl || (PLAYER.onGround && PLAYER.vy <= 0 && p.y - fl < STEP)) { p.y = fl; PLAYER.vy = 0; PLAYER.onGround = true; }
    else PLAYER.onGround = false;
    const ce = ceilAt(p.x, p.z, p.y + HEIGHT); if (p.y + HEIGHT > ce && PLAYER.vy > 0) { PLAYER.vy = 0; }
    if (PLAYER.onGround && (KEYS.Space || TOUCH.jump)) { PLAYER.vy = 5.4; PLAYER.onGround = false; }
    TOUCH.jump = false;
    if (p.y < -0.9) { p.copy(PLAYER.safe); PLAYER.vy = 0; PLAYER.vx = PLAYER.vz = 0; toast('掉進水裡了，已帶你回岸上'); }
    PLAYER.safeT -= dt; if (PLAYER.onGround && PLAYER.safeT <= 0 && p.y > -0.2) { PLAYER.safe.copy(p); PLAYER.safeT = 0.5; }
    // 腳步聲與鏡頭晃動
    const v = Math.hypot(PLAYER.vx, PLAYER.vz);
    if (PLAYER.onGround && v > 0.6) {
      PLAYER.bob += dt * v * 2.3;
      PLAYER.stepT -= dt * v; if (PLAYER.stepT <= 0) { PLAYER.stepT = 1.45; if (SFX.ctx) SFX.step(0.05 + v * 0.01); }
    }
  }
  p.x = clamp(p.x, -235, 245); p.z = clamp(p.z, -235, 245);
  const bob = PLAYER.fly ? 0 : Math.sin(PLAYER.bob * 2) * 0.035;
  camera.position.set(p.x, p.y + EYE + bob, p.z);
  camera.rotation.set(PLAYER.pitch, PLAYER.yaw, 0);
}
