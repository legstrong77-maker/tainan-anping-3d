"""把 gemini-3.1 的旁白用 EQ 對齊 3.8 的長期平均頻譜（音色一致），輸出到 takes/*_t200.wav"""
import glob, os
import numpy as np, soundfile as sf
from scipy.signal import welch, firwin2, fftconvolve
W = 'tools/audio_gemini'
ref = [f for f in glob.glob(W + '/takes/*_t10[01].wav')]
src = sorted(glob.glob(W + '/v31/*_t200.wav'))
def ltas(files):
    acc = None
    for f in files:
        w, sr = sf.read(f, dtype='float32'); w[:int(sr * 0.01)] = 0
        fr, p = welch(w, sr, nperseg=4096); acc = p if acc is None else acc + p
    return fr, acc / len(files), sr
fr, pr, sr = ltas(ref); _, ps, _ = ltas(src)
g = np.sqrt((pr + 1e-12) / (ps + 1e-12))
# 1/3 八度平滑、限制 ±9 dB
sm = np.array([np.exp(np.mean(np.log(g[(fr >= f / 2 ** (1 / 6)) & (fr <= f * 2 ** (1 / 6))] + 1e-12))) if f > 40 else 1.0 for f in fr])
sm = np.clip(sm, 10 ** (-9 / 20), 10 ** (9 / 20)); sm[fr < 60] = sm[fr < 60].min() if (fr < 60).any() else 1
fir = firwin2(2047, fr / (sr / 2), sm)
for f in src:
    w, s = sf.read(f, dtype='float32')
    y = fftconvolve(w, fir, 'same').astype(np.float32); y *= min(1, 0.95 / (np.abs(y).max() + 1e-9))
    sf.write(os.path.join(W, 'takes', os.path.basename(f)), y, s, subtype='PCM_16')
    print('eq', os.path.basename(f))
for band in [(100, 300), (300, 1000), (1000, 3000), (3000, 8000)]:
    m = (fr >= band[0]) & (fr < band[1]); print(band, 'gain %.1f dB' % (20 * np.log10(np.mean(sm[m]))))
