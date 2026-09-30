/* ================= 12 導覽影片：運鏡、章節卡、字幕、旁白 ================= */
/* NARRATION 由建置腳本注入（tools/narration.json）；NARR_AUDIO 為 VoAI 產生的 mp3（base64，可為 null） */
const SHOTS = [
  { tod: 'noon', shots: [{ f: 1, k: [[-235, 55, 150, -40, 0, -10], [-150, 42, 70, -20, 2, -20], [-90, 30, 32, 20, 0, -10]] }] },
  { tod: 'noon', shots: [{ f: 0.5, k: [[-205, 20, -30, -60, 0, -80], [-175, 30, -118, -62, 4, -84]] }, { f: 0.5, k: [[-125, 40, -58, -62, 6, -84], [-92, 26, -44, -62, 8, -84]] }] },
  { tod: 'noon', shots: [{ f: 0.58, k: [[-106, 2.2, -33.5, -92, 2.5, -41], [-84, 2.0, -34.5, -72, 2.8, -41], [-60, 2.4, -35, -52, 3, -41]] }, { f: 0.42, k: [[-62, 6.5, -58, -66, 10, -87], [-48, 9, -63, -64, 12, -87]] }] },
  { tod: 'noon', shots: [{ f: 0.5, k: [[-34, 3.0, -51, -40, 4.4, -58], [-47, 4, -51, -40, 4.2, -58]] }, { f: 0.5, k: [[-48, 3.2, 50, -72, 6, 59], [-70, 3.0, 48.5, -72, 7, 59], [-94, 3.4, 50, -72, 6, 59]] }] },
  { tod: 'noon', shots: [{ f: 0.55, k: [[-22, 2.4, 19, -52, 4, 1], [-36, 2.0, 11, -54, 4, 0]] }, { f: 0.45, k: [[81, 1.8, 3, 81, 2.6, -11.5], [77, 1.9, -4.5, 81, 2.4, -11.5]] }] },
  { tod: 'noon', shots: [{ f: 1, k: [[-20, 1.7, 0.3, 10, 2.2, 0], [18, 1.7, -0.4, 50, 2.4, 0], [55, 2.2, 0.5, 81, 5, 0]] }] },
  { tod: 'noon', shots: [{ f: 0.5, k: [[-79, 2, -115, -70, 5, -140], [-67, 2.4, -123, -70, 5, -142]] }, { f: 0.5, k: [[-48, 4, -156, -70, 4, -176], [-57, 2.2, -164, -72, 3.5, -178]] }] },
  { tod: 'noon', shots: [{ f: 0.55, k: [[60, 32, 95, 12, 0, 145], [85, 30, 150, 12, 0, 145], [55, 28, 205, 12, 0, 145]] }, { f: 0.45, k: [[53, 1.8, 103, 33.2, 4.5, 123.8], [42, 1.8, 113, 33.2, 5.4, 123.8]] }] },
  { tod: 'dusk', shots: [{ f: 0.6, k: [[-110, 2.2, 36.2, -60, 3, 44], [-50, 2.2, 36.3, 0, 3, 44], [8, 2.4, 36.3, 60, 4, 44]] }, { f: 0.4, k: [[60, 18, 18, 0, 0, 51], [20, 24, 28, -80, 0, 51]] }] },
  { tod: 'dusk', shots: [{ f: 0.62, k: [[-139, 2.3, 110, -200, 4, 110], [-157, 2.1, 110, -260, 6, 107]] }, { f: 0.38, k: [[-150, 6, 118, -300, 8, 100], [-125, 32, 128, -300, 10, 100]] }] },
];
const TOUR = { active: false, i: 0, t: 0, dur: 10, shotIdx: -1, curves: null, speechOn: false, ending: false, total: 0 };
const NARR = {
  gain: null, buffers: [], src: null, muted: false, voice: null,
  hasAudio(i) { return !!(typeof NARR_AUDIO !== 'undefined' && NARR_AUDIO && NARR_AUDIO[i]); },
  est(i) { const s = NARRATION.segments[i]; return s.text.replace(/\s/g, '').length / 4.3 + 1.6; },
  async prepare() {
    if (!SFX.ctx || this.gain) return;
    this.gain = SFX.ctx.createGain(); this.gain.gain.value = SFX.muted ? 0 : 1; this.gain.connect(SFX.ctx.destination);
    if (typeof NARR_AUDIO === 'undefined' || !NARR_AUDIO) return;
    for (let i = 0; i < NARRATION.segments.length; i++) {
      if (!NARR_AUDIO[i]) continue;
      try { const bin = Uint8Array.from(atob(NARR_AUDIO[i]), c => c.charCodeAt(0)); this.buffers[i] = await SFX.ctx.decodeAudioData(bin.buffer); } catch (e) { this.buffers[i] = null; }
    }
  },
  dur(i) { return this.buffers[i] ? this.buffers[i].duration + 1.0 : this.est(i); },
  play(i) {
    this.stop();
    if (this.buffers[i] && SFX.ctx) { const s = SFX.ctx.createBufferSource(); s.buffer = this.buffers[i]; s.connect(this.gain); s.start(SFX.ctx.currentTime + 0.3); this.src = s; return; }
    if (TOUR.speechOn && 'speechSynthesis' in window) {
      try {
        const u = new SpeechSynthesisUtterance(NARRATION.segments[i].tts.replace(/\[:[\d.]+\]/g, '，'));
        u.lang = 'zh-TW'; u.rate = 1.0; u.pitch = 0.9; u.volume = SFX.muted ? 0 : 1;
        const vs = speechSynthesis.getVoices(); const v = vs.find(v => /zh[-_]TW/i.test(v.lang)) || vs.find(v => /^zh/i.test(v.lang)); if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { }
    }
  },
  speaking() { try { return TOUR.speechOn && !this.buffers[TOUR.i] && speechSynthesis.speaking; } catch (e) { return false; } },
  stop() { if (this.src) { try { this.src.stop(); } catch (e) { } this.src = null; } try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { } },
  setMuted(m) { if (this.gain) this.gain.gain.value = m ? 0 : 1; if (m) try { speechSynthesis.cancel(); } catch (e) { } },
};
function splitSubs(text) {
  const out = []; let cur = '';
  for (const ch of text) { cur += ch; if ('。！？；'.includes(ch)) { out.push(cur); cur = ''; } }
  if (cur.trim()) out.push(cur);
  const res = [];
  for (let s of out) {
    s = s.trim();
    while (s.length > 30) { let cut = -1; for (let k = Math.floor(s.length / 2); k > 8; k--) if ('，、'.includes(s[k])) { cut = k; break; } if (cut < 0) cut = Math.floor(s.length / 2); res.push(s.slice(0, cut + 1)); s = s.slice(cut + 1); }
    if (s) res.push(s);
  }
  return res.map(s => s.replace(/[，。；：]$/, ''));
}
function shotCurves(seg) {
  return seg.shots.map(sh => ({
    f: sh.f,
    pos: new THREE.CatmullRomCurve3(sh.k.map(k => V3(k[0], k[1], k[2])), false, 'centripetal'),
    look: new THREE.CatmullRomCurve3(sh.k.map(k => V3(k[3], k[4], k[5])), false, 'centripetal'),
  }));
}
const $ = (id) => document.getElementById(id);
function showChapter(seg, big) {
  const c = $('chapter');
  c.querySelector('.ttl').textContent = seg.title; c.querySelector('.sub2').textContent = seg.sub; c.querySelector('.num').textContent = big ? '台南地名誌' : '第' + seg.num + '章';
  c.style.opacity = 1; clearTimeout(showChapter.t); showChapter.t = setTimeout(() => { c.style.opacity = 0; }, big ? 5200 : 3300);
}
function fadeCut() { const f = $('fade'); f.style.transition = 'none'; f.style.opacity = 0.85; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; }); }
function setSub(t) { const s = $('sub').firstElementChild; if (s.textContent !== t) s.textContent = t; }
async function tourStart() {
  if (TOUR.active) return;
  STARTED = true; hideStart();
  try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { }
  SFX.start(); await NARR.prepare();
  TOUR.active = true; TOUR.speechOn = !NARR.hasAudio(0) && PREF.get('speech', '1') === '1';
  $('ui').classList.add('touring'); $('tourbar').hidden = false; syncSpeechBtn();
  TOUR.total = 0; for (let i = 0; i < SHOTS.length; i++) TOUR.total += NARR.dur(i);
  tourGo(0);
}
function tourGo(i) {
  if (i < 0) i = 0;
  if (i >= SHOTS.length) { tourEnd(); return; }
  TOUR.i = i; TOUR.t = 0; TOUR.dur = NARR.dur(i); TOUR.shotIdx = -1; TOUR.hold = 0;
  const seg = NARRATION.segments[i];
  TOUR.curves = shotCurves(SHOTS[i]); TOUR.subs = splitSubs(seg.text);
  let acc = 0; const w = TOUR.subs.map(s => s.length + 3); const tw = w.reduce((a, b) => a + b, 0);
  TOUR.subT = w.map(x => (acc += x) / tw);
  if (SHOTS[i].tod !== todState.cur) setTOD(SHOTS[i].tod);
  showChapter(seg, i === 0);
  NARR.play(i);
}
function tourJump(d) { tourGo(TOUR.i + d); }
function tourEnd() {
  NARR.stop(); setSub('');
  const c = $('chapter'); c.querySelector('.ttl').textContent = '下集待續'; c.querySelector('.sub2').textContent = '台南地名誌 EP.01 安平・完'; c.querySelector('.num').textContent = '台南地名誌';
  c.style.opacity = 1; TOUR.ending = true;
  setTimeout(() => { c.style.opacity = 0; tourStop(true); }, 4200);
}
function tourStop(finished) {
  if (!TOUR.active) return;
  TOUR.active = false; TOUR.ending = false; NARR.stop(); setSub('');
  $('ui').classList.remove('touring'); $('tourbar').hidden = true; $('chapter').style.opacity = 0;
  if (finished) { teleport(8); } else { PLAYER.pos.copy(camera.position); PLAYER.pos.y = floorAt(PLAYER.pos.x, PLAYER.pos.z, PLAYER.pos.y); if (PLAYER.pos.y < -0.5) teleport(0); }
  const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); if (!finished) { PLAYER.yaw = e.y; PLAYER.pitch = clamp(e.x, -1.2, 1.2); }
  camera.fov = 68; camera.updateProjectionMatrix();
}
const _tp = new THREE.Vector3(), _tl = new THREE.Vector3();
function updateTour(dt) {
  if (!TOUR.active) return;
  if (TOUR.ending) return;
  TOUR.t += dt;
  const u = clamp(TOUR.t / TOUR.dur, 0, 1);
  // 目前鏡頭
  let acc = 0, si = 0; for (let k = 0; k < TOUR.curves.length; k++) { if (u <= acc + TOUR.curves[k].f || k === TOUR.curves.length - 1) { si = k; break; } acc += TOUR.curves[k].f; }
  if (si !== TOUR.shotIdx) { if (TOUR.shotIdx >= 0) fadeCut(); TOUR.shotIdx = si; }
  const c = TOUR.curves[si], lu = clamp((u - acc) / c.f, 0, 1), e = 0.5 - 0.5 * Math.cos(lu * Math.PI);
  c.pos.getPoint(e, _tp); c.look.getPoint(e, _tl);
  camera.position.copy(_tp); camera.lookAt(_tl);
  if (camera.fov !== 55) { camera.fov = 55; camera.updateProjectionMatrix(); }
  // 字幕
  let k = 0; const su = clamp(TOUR.t / Math.max(1, TOUR.dur - 1.0), 0, 1); while (k < TOUR.subT.length - 1 && su > TOUR.subT[k]) k++;
  setSub(TOUR.t < TOUR.dur - 0.4 ? TOUR.subs[k] : '');
  // 進度
  let before = 0; for (let j = 0; j < TOUR.i; j++) before += NARR.dur(j);
  $('tourbar').querySelector('i').style.width = ((before + Math.min(TOUR.t, TOUR.dur)) / TOUR.total * 100).toFixed(1) + '%';
  $('tourTime').textContent = fmtTime(before + TOUR.t) + ' / ' + fmtTime(TOUR.total);
  if (TOUR.t >= TOUR.dur) { if (!NARR.speaking() || TOUR.t > TOUR.dur * 1.9) { TOUR.hold += dt; if (TOUR.hold > 0.6) tourGo(TOUR.i + 1); } }
}
function syncSpeechBtn() { const b = $('tourVoice'); if (!b) return; const has = NARR.hasAudio(0); b.textContent = has ? '旁白：' + (/Gemini/.test(NARR_VOICE) ? 'Gemini TTS（Rasalgethi）' : /BlueMagpie/.test(NARR_VOICE) ? 'BlueMagpie-TTS' : /YunJhe/.test(NARR_VOICE) ? '雲哲（台灣男聲）' : (NARR_VOICE || '內建語音')) : (TOUR.speechOn ? '旁白：瀏覽器預覽聲' : '旁白：只有字幕'); b.disabled = has; }
