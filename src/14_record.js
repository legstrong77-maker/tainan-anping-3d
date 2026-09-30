/* ================= 14 錄影：固定時間步進逐格輸出（本機開發伺服器接收影格，網頁上不會自動執行） ================= */
let RECORDING = false;
const REC = { frame: 0, done: false, err: null };
function drawChapterCard(g, W, H, a, ttl, sub, num) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha = a; g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 30; g.textBaseline = 'alphabetic';
  g.font = `900 ${Math.round(H * 0.118)}px ${FONT_SERIF}`; const tw = g.measureText(ttl).width;
  g.font = `400 ${Math.round(H * 0.037)}px ${FONT_KAI}`; const sw = g.measureText(sub).width;
  const S = H * 0.1, gap = H * 0.034, nw = H * 0.03, cw = Math.max(tw, sw);
  const x0 = (W - (S + gap + cw + gap + nw)) / 2, cy = H / 2;
  // 印章
  g.save(); g.translate(x0 + S / 2, cy); g.rotate(-6 * DEG); g.shadowBlur = 0;
  g.strokeStyle = '#e0573c'; g.lineWidth = H * 0.005; g.fillStyle = 'rgba(255,245,235,.08)';
  g.beginPath(); g.rect(-S / 2, -S / 2, S, S); g.fill(); g.stroke();
  g.fillStyle = '#e0573c'; g.font = `900 ${Math.round(S * 0.36)}px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('安', 0, -S * 0.2); g.fillText('平', 0, S * 0.22); g.restore();
  // 標題與副標
  const tx = x0 + S + gap;
  g.fillStyle = '#ffffff'; g.textAlign = 'left';
  g.font = `900 ${Math.round(H * 0.118)}px ${FONT_SERIF}`; g.fillText(ttl, tx, cy + H * 0.015);
  g.font = `400 ${Math.round(H * 0.037)}px ${FONT_KAI}`; g.fillText(sub, tx + (cw - sw) * 0, cy + H * 0.075);
  // 直書章節
  const nx = tx + cw + gap;
  g.shadowBlur = 0; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(nx, cy - H * 0.1); g.lineTo(nx, cy + H * 0.1); g.stroke();
  g.shadowBlur = 20; g.font = `600 ${Math.round(H * 0.022)}px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const chars = [...num]; chars.forEach((c, i) => g.fillText(c, nx + nw * 0.8, cy - (chars.length - 1) * H * 0.016 + i * H * 0.032));
  g.restore();
}
function drawSubtitle(g, W, H, text) {
  if (!text) return;
  g.save(); const fs = Math.round(H * 0.044); g.font = `700 ${fs}px ${FONT_SANS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  const tw = g.measureText(text).width, bw = tw + fs * 0.9, bh = fs * 1.55, x = W / 2, y = H - H * 0.085;
  g.fillStyle = 'rgba(10,8,8,.55)'; g.beginPath(); const r = fs * 0.18, l = x - bw / 2, t = y - bh / 2;
  g.moveTo(l + r, t); g.arcTo(l + bw, t, l + bw, t + bh, r); g.arcTo(l + bw, t + bh, l, t + bh, r); g.arcTo(l, t + bh, l, t, r); g.arcTo(l, t, l + bw, t, r); g.fill();
  g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 4; g.fillStyle = '#ffffff'; g.fillText(text, x, y + fs * 0.04);
  g.restore();
}
function drawBrand(g, W, H, a) {
  if (a <= 0.01) return;
  g.save(); g.globalAlpha = a * 0.85; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 8;
  const s = H * 0.024; g.fillStyle = '#e0573c'; g.fillRect(H * 0.04, H * 0.04, s * 1.8, s * 1.8);
  g.fillStyle = '#fff'; g.font = `900 ${Math.round(s * 0.7)}px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('安', H * 0.04 + s * 0.9, H * 0.04 + s * 0.5); g.fillText('平', H * 0.04 + s * 0.9, H * 0.04 + s * 1.3);
  g.textAlign = 'left'; g.font = `600 ${Math.round(s * 0.85)}px ${FONT_SANS}`; g.fillText('台南地名誌 EP.01', H * 0.04 + s * 2.3, H * 0.04 + s * 0.9);
  g.restore();
}
async function recordTour(opts) {
  opts = Object.assign({ w: 1920, h: 1080, fps: 30, dir: 'frames', quality: 'high', maxFrames: 1e9 }, opts || {});
  try {
    RECORDING = true; REC.frame = 0; REC.done = false; REC.err = null;
    setQuality(opts.quality); STARTED = true; hideStart();
    $('ui').classList.add('hide'); $('ui').classList.add('touring');
    SFX.start(); await NARR.prepare();
    renderer.setPixelRatio(1); renderer.setSize(opts.w, opts.h, false); camera.aspect = opts.w / opts.h; camera.updateProjectionMatrix();
    for (const m of [ENV.halos, PETALS, SMOKE]) if (m) m.material.uniforms.uH.value = opts.h;
    const comp = mkCanvas(opts.w, opts.h), g = comp.getContext('2d');
    const segStarts = []; const dt = 1 / opts.fps;
    NARR.play = (i) => { segStarts.push({ i, t: REC.frame / opts.fps }); };
    NARR.stop = () => { };
    tourEnd = () => { TOUR.ending = true; };
    TOUR.active = true; TOUR.speechOn = false; TOUR.total = 0; for (let i = 0; i < SHOTS.length; i++) TOUR.total += NARR.dur(i);
    setTOD(SHOTS[0].tod, true);
    tourGo(0);
    let fade = 0, lastKey = '', endT = 0; const inflight = new Set();
    for (; ;) {
      U.time.value += dt; updateTOD(dt);
      if (!TOUR.ending) updateTour(dt); else endT += dt;
      updateTraffic(dt); updateBoats(dt, U.time.value); updatePeople(dt, U.time.value);
      if (_barberMat) _barberMat.map.offset.y = (_barberMat.map.offset.y + dt * 0.4) % 1;
      updateSunShadow(camera.position);
      renderer.render(scene, camera);
      g.drawImage(renderer.domElement, 0, 0, opts.w, opts.h);
      const key = TOUR.i + ':' + TOUR.shotIdx;
      if (key !== lastKey) { if (lastKey) fade = 1; lastKey = key; }
      if (TOUR.ending) {
        g.fillStyle = `rgba(0,0,0,${Math.min(0.55, endT * 0.5)})`; g.fillRect(0, 0, opts.w, opts.h);
        drawChapterCard(g, opts.w, opts.h, Math.min(1, endT / 0.8), '下集待續', '台南地名誌 EP.01 安平・完', '台南地名誌');
      } else {
        const seg = NARRATION.segments[TOUR.i], show = TOUR.i === 0 ? 5.2 : 3.3, t = TOUR.t;
        const ca = Math.min(1, t / 0.6) * (1 - clamp((t - show) / 0.9, 0, 1));
        drawChapterCard(g, opts.w, opts.h, ca, seg.title, seg.sub, TOUR.i === 0 ? '台南地名誌' : '第' + seg.num + '章');
        drawBrand(g, opts.w, opts.h, TOUR.i === 0 ? 0 : 1 - ca);
        drawSubtitle(g, opts.w, opts.h, $('sub').firstElementChild.textContent);
      }
      if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade * 0.9})`; g.fillRect(0, 0, opts.w, opts.h); fade = Math.max(0, fade - dt / 0.5); }
      const url = comp.toDataURL('image/jpeg', 0.92);
      const name = String(REC.frame).padStart(5, '0') + '.jpg';
      const send = async () => { for (let k = 0; k < 8; k++) { try { const r = await fetch('/save?dir=' + opts.dir + '&name=' + name, { method: 'POST', body: url }); if (r.ok) return; } catch (e) { } await new Promise(res => setTimeout(res, 300 * (k + 1))); } throw new Error('upload failed ' + name); };
      const p = send().finally(() => inflight.delete(p));
      inflight.add(p); if (inflight.size >= 6) await Promise.race(inflight);
      REC.frame++;
      if ((TOUR.ending && endT > 5) || REC.frame >= opts.maxFrames) break;
    }
    await Promise.all(inflight);
    await fetch('/save?dir=' + opts.dir + '&name=timeline.json', { method: 'POST', body: JSON.stringify({ fps: opts.fps, frames: REC.frame, segStarts, audioOffset: 0.3, voice: NARR_VOICE }) });
    REC.done = true; REC.segStarts = segStarts;
  } catch (e) { REC.err = String(e && e.stack || e); }
  return REC;
}
