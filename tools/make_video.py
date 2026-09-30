"""把錄好的影格＋旁白＋合成配樂組成影片：python tools/make_video.py [frames 資料夾] [輸出 mp4]

旁白依 shots/frames/timeline.json 的段落起點擺放；背景是慢速和弦 pad＋海風環境音，旁白出現時自動壓低。
"""
import json, subprocess, sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
FR = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "shots" / "frames"
OUTMP4 = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "video" / "安平_台南地名誌EP01.mp4"
VOICE = ROOT / "tools" / "audio_gemini" / "best"
SR = 48000
tl = json.loads((FR / "timeline.json").read_text(encoding="utf-8"))
TOTAL = tl["frames"] / tl["fps"]
N = int(TOTAL * SR)
rng = np.random.default_rng(1624)
t = np.arange(N) / SR
lp = lambda x, f: sosfilt(butter(2, f, "lowpass", fs=SR, output="sos"), x)
hp = lambda x, f: sosfilt(butter(2, f, "highpass", fs=SR, output="sos"), x)

# 旁白
narr = np.zeros(N, np.float32)
for s in tl["segStarts"]:
    sid = f"s{s['i']:02d}"
    w, sr = sf.read(str(VOICE / f"{sid}.wav"), dtype="float32")
    if w.ndim > 1: w = w.mean(1)
    a = int((s["t"] + tl.get("audioOffset", 0.3)) * SR); b = min(N, a + len(w))
    narr[a:b] += w[: b - a]
narr *= 0.93 / (np.abs(narr).max() + 1e-9)

# 旁白包絡 → 壓低背景
env = lp(np.abs(narr), 3.0); env = np.clip(env / (env.max() + 1e-9) * 6, 0, 1)
duck = 1 - 0.62 * env

# 和弦 pad（慢速進行，每 8 秒換和弦）
def note(m): return 440 * 2 ** ((m - 69) / 12)
chords = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 55, 59, 64], [50, 53, 57, 62], [55, 59, 62, 67]]
pad = np.zeros(N, np.float32); L = 8.0
for k in range(int(TOTAL / L) + 2):
    c = chords[k % len(chords)]; a = int(k * L * SR); n = int((L + 3) * SR); b = min(N, a + n)
    if a >= N: break
    tt = np.arange(b - a) / SR
    e = np.minimum(1, tt / 2.5) * np.clip((L + 3 - tt) / 3, 0, 1)
    for m in c:
        f = note(m)
        pad[a:b] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.003 * tt) + 0.15 * np.sin(2 * np.pi * f * 0.5 * tt)) * e * 0.05
pad = lp(pad, 1800)

# 海風環境音
brown = np.cumsum(rng.standard_normal(N)).astype(np.float32); brown = hp(brown, 20); brown /= np.abs(brown).max() + 1e-9
swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / 9.0) ** 2
sea = lp(brown, 500) * swell * 0.22

# 章節鐘聲
bell = np.zeros(N, np.float32)
for s in tl["segStarts"]:
    a = int((s["t"] + 0.05) * SR); d = int(3.5 * SR); b = min(N, a + d); tt = np.arange(b - a) / SR
    for m, g in [(1, 0.5), (2.76, 0.22), (5.4, 0.1)]:
        bell[a:b] += np.sin(2 * np.pi * note(84) * m * tt) * np.exp(-tt * (1.4 + m * 0.5)) * g * 0.07

fade = np.minimum(1, t / 2.0) * np.clip((TOTAL - t) / 3.0, 0, 1)
bgm = (pad * 0.9 + sea * 0.5) * duck + bell
left = narr + bgm * fade * 1.0
right = narr + (pad * 0.9 * duck + sea * 0.5 * np.roll(swell, SR * 3) / (swell + 1e-9) * duck + bell) * fade
mix = np.stack([left, right], 1)
mix *= 0.95 / (np.abs(mix).max() + 1e-9)
OUTMP4.parent.mkdir(parents=True, exist_ok=True)
wav = OUTMP4.with_suffix(".wav")
sf.write(str(wav), mix.astype(np.float32), SR, subtype="PCM_16")
print("mix", round(TOTAL, 1), "s")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(tl["fps"]), "-i", str(FR / "%05d.jpg"), "-i", str(wav),
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                "-shortest", "-movflags", "+faststart", str(OUTMP4)], check=True)
print("video", OUTMP4)
