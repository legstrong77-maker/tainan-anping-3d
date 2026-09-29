/* ================= 10 環境音：全部用 Web Audio 即時合成 ================= */
const SFX = {
  ctx: null, master: null, muted: PREF.get('mute', '0') === '1', buses: {}, nextBird: 2, nextBell: 25, nextDrum: 40, beepT: 0, stepT: 0,
  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    let ctx; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    this.ctx = ctx;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(ctx.destination);
    const sr = ctx.sampleRate;
    const mkNoise = (type, sec) => {
      const b = ctx.createBuffer(1, sr * sec, sr), d = b.getChannelData(0);
      let l = 0, b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < d.length; i++) {
        const w = Math.random() * 2 - 1;
        if (type === 'brown') { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; }
        else if (type === 'pink') { b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16; }
        else d[i] = w;
      }
      return b;
    };
    this.nWhite = mkNoise('white', 2); this.nPink = mkNoise('pink', 4); this.nBrown = mkNoise('brown', 4);
    const loop = (buf, rate) => { const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.playbackRate.value = rate || 1; s.start(); return s; };
    const chain = (src, nodes, gainV) => { let n = src; for (const x of nodes) { n.connect(x); n = x; } const g = ctx.createGain(); g.gain.value = gainV || 0; n.connect(g); g.connect(this.master); return g; };
    const bq = (type, f, q) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q || 0.7; return b; };
    // 風
    this.windF = bq('lowpass', 420, 0.5); this.buses.wind = chain(loop(this.nBrown), [this.windF], 0.12);
    // 海浪
    this.waveF = bq('lowpass', 700, 0.6); this.buses.wave = chain(loop(this.nPink, 0.9), [this.waveF], 0);
    // 運河拍岸
    this.buses.canal = chain(loop(this.nPink, 1.2), [bq('bandpass', 900, 1.2)], 0);
    // 蟬鳴：帶通白噪音×振幅調變
    const cicF = bq('bandpass', 5600, 2.5), cicAM = ctx.createGain(); cicAM.gain.value = 0.5;
    const am = ctx.createOscillator(); am.frequency.value = 118; const amG = ctx.createGain(); amG.gain.value = 0.5; am.connect(amG); amG.connect(cicAM.gain); am.start();
    this.buses.cicada = chain(loop(this.nWhite), [cicF, cicAM], 0);
    // 夜間蟲鳴
    const cr = ctx.createOscillator(); cr.type = 'sine'; cr.frequency.value = 4400; const crAM = ctx.createGain(); crAM.gain.value = 0; const crL = ctx.createOscillator(); crL.frequency.value = 22; const crLG = ctx.createGain(); crLG.gain.value = 1; crL.connect(crLG); crLG.connect(crAM.gain); crL.start(); cr.start();
    cr.connect(crAM); this.buses.cricket = ctx.createGain(); this.buses.cricket.gain.value = 0; crAM.connect(this.buses.cricket); this.buses.cricket.connect(this.master);
    // 人聲嘈雜（老街）
    this.babF = bq('bandpass', 650, 0.9); this.buses.crowd = chain(loop(this.nPink, 1.0), [this.babF], 0);
    // 機車／汽車引擎
    const eng = ctx.createOscillator(); eng.type = 'sawtooth'; eng.frequency.value = 42; this.engOsc = eng; eng.start();
    this.buses.engine = chain(eng, [bq('lowpass', 520, 1)], 0);
    // 遊船柴油機
    const boat = ctx.createOscillator(); boat.type = 'square'; boat.frequency.value = 38; boat.start();
    const bAM = ctx.createGain(); bAM.gain.value = 0.5; const bl = ctx.createOscillator(); bl.frequency.value = 7; const blg = ctx.createGain(); blg.gain.value = 0.5; bl.connect(blg); blg.connect(bAM.gain); bl.start();
    this.buses.boat = chain(boat, [bq('lowpass', 180, 1), bAM], 0);
  },
  setMuted(m) { this.muted = m; PREF.set('mute', m ? '1' : '0'); if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05); if (typeof NARR !== 'undefined') NARR.setMuted(m); },
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  tone(f, t, dur, vol, type, f2, dest) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    o.connect(g); g.connect(dest || this.master); this.env(g, t, Math.min(0.02, dur * 0.2), vol, dur); o.start(t); o.stop(t + dur + 0.05);
  },
  bulbul(vol) { // 白頭翁：3～5 音節，2.4 kHz 附近跳動滑音
    const t = this.ctx.currentTime + 0.05; const n = ri(3, 5); let tt = t;
    for (let i = 0; i < n; i++) { const f = rr(1900, 3400); this.tone(f, tt, rr(0.08, 0.16), vol, 'sine', f * rr(0.75, 1.3)); tt += rr(0.13, 0.22); }
  },
  sparrow(vol) { const t = this.ctx.currentTime; const n = ri(2, 6); for (let i = 0; i < n; i++) this.tone(rr(3000, 4600), t + i * rr(0.1, 0.2), rr(0.05, 0.1), vol * 0.7, 'triangle', rr(2600, 4200)); },
  whiteEye(vol) { const t = this.ctx.currentTime; for (let i = 0; i < ri(4, 8); i++) { this.tone(rr(4200, 6200), t + i * 0.22, 0.07, vol * 0.5, 'sine', rr(3600, 5200)); this.tone(rr(3600, 5000), t + i * 0.22 + 0.09, 0.06, vol * 0.45, 'sine'); } },
  dove(vol) { // 珠頸斑鳩：咕—咕—咕～咕
    const t = this.ctx.currentTime; const seq = [[620, 0.35], [560, 0.3], [600, 0.45], [520, 0.5]]; let tt = t;
    for (const [f, d] of seq) { this.tone(f, tt, d, vol * 0.9, 'sine', f * 0.92); tt += d + 0.12; }
  },
  bell(pos) { // 銅鐘：非整數倍泛音、長衰減
    if (!this.ctx) return; const v = pos ? this.distVol(pos, 90) : 0.5; if (v < 0.01) return;
    const t = this.ctx.currentTime; const f = 168;
    [[1, 0.5, 7], [1.19, 0.25, 5], [1.5, 0.2, 4], [2, 0.16, 3.5], [2.5, 0.12, 3], [2.66, 0.1, 2.6], [3, 0.08, 2.2]].forEach(([m, a, d]) => { this.tone(f * m, t, d, a * v * 0.4); this.tone(f * m + 1, t, d, a * v * 0.2); });
  },
  drum(pos) { if (!this.ctx) return; const v = this.distVol(pos, 90); if (v < 0.01) return; const t = this.ctx.currentTime; for (let i = 0; i < 3; i++) this.tone(85, t + i * 0.55, 0.5, v * 0.7, 'sine', 62); },
  horn(pos) { if (!this.ctx) return; const v = this.distVol(pos, 160); if (v < 0.01) return; const t = this.ctx.currentTime; this.tone(196, t, 1.3, v * 0.35, 'sawtooth', 190); this.tone(247, t, 1.3, v * 0.2, 'sawtooth', 240); },
  beep(v) { const t = this.ctx.currentTime; this.tone(2750, t, 0.07, v * 0.25, 'square'); },
  step(v) { const c = this.ctx, s = c.createBufferSource(); s.buffer = this.nWhite; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700; const g = c.createGain(); s.connect(f); f.connect(g); g.connect(this.master); const t = c.currentTime; this.env(g, t, 0.005, v, 0.07); s.start(t, Math.random()); s.stop(t + 0.1); },
  distVol(p, R) { const d = camera.position.distanceTo(p); return clamp(1 - d / R, 0, 1) ** 1.6; },
  update(dt, player) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const c = this.ctx, now = c.currentTime, cp = camera.position;
    const day = 1 - U.night.value, set = (bus, v) => this.buses[bus].gain.setTargetAtTime(v, now, 0.3);
    // 風：慢速起伏
    set('wind', 0.06 + 0.06 * (0.5 + 0.5 * Math.sin(now * 0.13)) * U.wind.value + (cp.y > 20 ? 0.08 : 0));
    this.windF.frequency.setTargetAtTime(300 + 250 * (0.5 + 0.5 * Math.sin(now * 0.21)), now, 0.5);
    // 海浪：8～12 秒一次
    const coast = clamp(1 - (cp.x + 145) / 120, 0, 1);
    const wph = (now % 10) / 10, surge = Math.pow(Math.sin(wph * Math.PI), 2);
    set('wave', coast * (0.08 + 0.28 * surge));
    this.waveF.frequency.setTargetAtTime(500 + 2400 * surge * surge, now, 0.2);
    const canal = clamp(1 - Math.abs(cp.z - 51) / 30, 0, 1) * (cp.x > -150 ? 1 : 0);
    set('canal', canal * (0.03 + 0.05 * Math.max(0, Math.sin(now * 2.3) * Math.sin(now * 0.7))));
    // 蟬：白天、靠近樹
    const cic = day * (TOD_KEY_NOW() === 'noon' ? 1 : 0.35);
    set('cicada', cic * (0.012 + 0.022 * Math.pow(0.5 + 0.5 * Math.sin(now * 0.4), 3)));
    set('cricket', U.night.value * 0.02);
    // 老街人聲
    const street = (cp.x > -30 && cp.x < 80 && Math.abs(cp.z) < 16) ? 1 : clamp(1 - (Math.abs(cp.z) - 16) / 30, 0, 1) * (cp.x > -40 && cp.x < 90 ? 1 : 0);
    set('crowd', street * (0.03 + 0.02 * Math.sin(now * 1.7) * Math.sin(now * 0.9)) * (0.5 + 0.5 * day));
    this.babF.frequency.setTargetAtTime(500 + 300 * Math.sin(now * 3.1), now, 0.1);
    // 引擎：最近的車
    let best = 1e9, bv = 0;
    for (const v of TRAFFIC.vehicles) { const d = v.m.g.position.distanceTo(cp); if (d < best) { best = d; bv = v.v; } }
    set('engine', clamp(1 - best / 45, 0, 1) ** 2 * (0.03 + bv * 0.006));
    this.engOsc.frequency.setTargetAtTime(38 + bv * 5, now, 0.2);
    if (BOATS.tour) set('boat', this.distVol(BOATS.tour.g.position, 70) * (BOATS.tour.v > 0.1 ? 0.22 : 0.06));
    // 鳥
    this.nextBird -= dt;
    if (this.nextBird <= 0) {
      this.nextBird = rr(1.2, 4.5) / Math.max(0.2, day);
      if (day > 0.4 && cp.y < 30) { const r = rnd(); const v = rr(0.03, 0.07); if (r < 0.45) this.bulbul(v); else if (r < 0.75) this.sparrow(v); else if (r < 0.88) this.whiteEye(v); else this.dove(v); }
    }
    // 天后宮鐘鼓
    this.nextBell -= dt; if (this.nextBell <= 0) { this.nextBell = rr(35, 60); this.bell(TEMPLE_POS); }
    this.nextDrum -= dt; if (this.nextDrum <= 0) { this.nextDrum = rr(50, 80); this.drum(TEMPLE_POS); }
    // 行人號誌提示音
    if (TRAFFIC.pedGreen) {
      const v = this.distVol(SIGNAL_POS, 45);
      this.beepT -= dt; if (this.beepT <= 0 && v > 0.01) { this.beepT = TRAFFIC.pedFlash ? 0.28 : 0.75; this.beep(v); }
    }
  }
};
const TEMPLE_POS = new THREE.Vector3(-62, 3, -4);
const SIGNAL_POS = new THREE.Vector3(93, 2, -28);
