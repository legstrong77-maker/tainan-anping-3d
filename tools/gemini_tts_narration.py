"""安平旁白：Gemini 3.8 Flash TTS（紀錄片男聲）→ faster-whisper 挑最準的 take → tools/audio/sXX.mp3

python tools/gemini_tts_narration.py audition          # 試聽多個男聲，依準確度與語速挑一個
python tools/gemini_tts_narration.py gen [聲音] [takes]  # 每段產生 takes 個版本
python tools/gemini_tts_narration.py check              # whisper 評分、挑最佳、修頭尾、輸出 mp3
金鑰從 D:\\opus55\\.env 讀取（GEMINI_API_KEY），不寫進程式或網頁。
"""
import json, re, subprocess, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

sys.path.insert(0, r"D:\opus55\tainan_lib")
import tts_gemini  # noqa: E402  (synth, key)
from google import genai  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / "tools" / "audio_gemini"
TAKES = WORK / "takes"
OUT = ROOT / "tools" / "audio"
LINES = WORK / "lines.json"
STYLE = ("Read the following Traditional Chinese narration aloud in natural Taiwan Mandarin with a Taiwanese accent. "
         "Voice: a calm, steady, warm male narrator of a public-television local-history documentary; natural conversational pace (not slow), "
         "clear articulation, gentle gravitas, slight pauses between sentences, no exaggeration. Speak only the narration text below.\n\n")
MALE = ["Charon", "Orus", "Sadaltager", "Iapetus", "Schedar", "Rasalgethi"]


def lines():
    cfg = json.loads((ROOT / "tools" / "narration.json").read_text(encoding="utf-8"))
    out = [{"id": s["id"], "text": re.sub(r"\[:[\d.]+\]", "", s["tts"])} for s in cfg["segments"]]
    WORK.mkdir(parents=True, exist_ok=True)
    LINES.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    return out


def save48(pcm, rate, path):
    wav = resample_poly(pcm, 48, rate // 1000).astype(np.float32) if rate != 48000 else pcm
    sf.write(str(path), wav, 48000, subtype="PCM_16")
    return len(wav) / 48000


def audition():
    ls = lines()
    text = ls[1]["text"][:90]
    client = genai.Client(api_key=tts_gemini.key())
    d = WORK / "audition"; d.mkdir(parents=True, exist_ok=True)
    for v in MALE:
        p = d / f"{v}.wav"
        if not p.exists():
            pcm, rate = tts_gemini.synth(client, text, v, STYLE)
            print(v, round(save48(pcm, rate, p), 1), "s", flush=True)
    from faster_whisper import WhisperModel
    sys.argv = [sys.argv[0], "x", "x", "x"]
    import importlib.util
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")
    from pypinyin import lazy_pinyin
    syl = lambda t: [re.sub(r"[^a-z]", "", x) for x in lazy_pinyin(t, errors="ignore") if re.sub(r"[^a-z]", "", x)]
    def edit(a, b):
        dd = list(range(len(b) + 1))
        for i, x in enumerate(a, 1):
            prev, dd[0] = dd[0], i
            for j, y in enumerate(b, 1):
                prev, dd[j] = dd[j], min(dd[j] + 1, dd[j - 1] + 1, prev + (x != y))
        return dd[len(b)]
    ref = syl(text); n = len(re.sub(r"[，。！？、「」\s]", "", text)); res = []
    for v in MALE:
        p = d / f"{v}.wav"; w, sr = sf.read(str(p), dtype="float32")
        segs, _ = model.transcribe(str(p), language="zh", beam_size=5, initial_prompt="以下是繁體中文的句子。")
        hyp = "".join(s.text for s in segs); cer = edit(ref, syl(hyp)) / len(ref); cps = n / (len(w) / sr)
        res.append({"voice": v, "cer": round(cer, 3), "cps": round(cps, 2), "score": round(cer + 0.05 * abs(cps - 4.3), 3), "hyp": hyp})
    res.sort(key=lambda r: r["score"])
    for r in res: print(r, flush=True)
    (WORK / "audition.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print("BEST", res[0]["voice"])


def gen(voice, takes, model=None, only=None, base=100):
    ls = lines()
    TAKES.mkdir(parents=True, exist_ok=True)
    if model: tts_gemini.MODEL = model          # 額度用完時可改用其他 Gemini TTS 模型（各自獨立額度）
    client = genai.Client(api_key=tts_gemini.key())
    for ln in ls:
        if only and ln["id"] not in only:
            continue
        for k in range(takes):
            p = TAKES / f"{ln['id']}_t{base + k}.wav"
            if p.exists():
                continue
            t0 = time.time(); pcm, rate = tts_gemini.synth(client, ln["text"], voice, STYLE)
            print(ln["id"], k, round(save48(pcm, rate, p), 1), "s", round(time.time() - t0, 1), "api_s", flush=True)
    (WORK / "voice.txt").write_text(voice, encoding="utf-8")
    print("GEN DONE")


def check():
    lines()
    best = WORK / "best"
    subprocess.run([sys.executable, r"D:\opus55\tainan_lib\tts_check.py", str(LINES), str(TAKES), str(best)], check=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for w in sorted(best.glob("s*.wav")):
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(w), "-ac", "1", "-ar", "44100", "-b:a", "112k", str(OUT / (w.stem + ".mp3"))], check=True)
    voice = (WORK / "voice.txt").read_text(encoding="utf-8").strip()
    (OUT / "voice.txt").write_text(f"Gemini 3.8 Flash TTS {voice}", encoding="utf-8")
    print("EXPORT DONE", voice)


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "audition"
    if cmd == "audition": audition()
    elif cmd == "gen": gen(sys.argv[2] if len(sys.argv) > 2 else "Rasalgethi", int(sys.argv[3]) if len(sys.argv) > 3 else 2)
    elif cmd == "gen31":   # 備援：gemini-3.1-flash-tts-preview，take 編號 200 起
        gen(sys.argv[2], 1, "gemini-3.1-flash-tts-preview", set(sys.argv[3].split(",")), 200)
    elif cmd == "check": check()
