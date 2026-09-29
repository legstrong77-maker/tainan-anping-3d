# 用本機 BlueMagpie-TTS 產生旁白（沿用你的 bluemagpie-tts-narration 腳本與預設聲音 hung_yi_lee）
# 執行：D:\AI工具\BlueMagpie-TTS-main\BlueMagpie-TTS\.venv\Scripts\python.exe tools\bluemagpie_narration.py [s03 s07 ...]
# 產生 tools/audio/sXX.mp3，之後執行 node tools/build.mjs 會自動嵌入網頁。
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NARRATE = r'C:\Users\User\.codex\skills\bluemagpie-tts-narration\scripts\narrate.py'
TMP = os.path.join(ROOT, 'tools', 'audio_bm')
OUT = os.path.join(ROOT, 'tools', 'audio')
os.makedirs(TMP, exist_ok=True); os.makedirs(OUT, exist_ok=True)
only = sys.argv[1:]

cfg = json.load(open(os.path.join(ROOT, 'tools', 'narration.json'), encoding='utf-8'))
for s in cfg['segments']:
    if only and s['id'] not in only:
        continue
    text = re.sub(r'\[:[\d.]+\]', '\n', s['tts'])            # 停頓標籤改成換行，讓腳本在這裡斷句
    txt = os.path.join(TMP, s['id'] + '.txt'); wav = os.path.join(TMP, s['id'] + '.wav'); mp3 = os.path.join(OUT, s['id'] + '.mp3')
    open(txt, 'w', encoding='utf-8').write(text)
    r = subprocess.run([sys.executable, NARRATE, '--text-file', txt, '--output', wav], capture_output=True, text=True, encoding='utf-8', errors='replace')
    status = [l for l in r.stdout.splitlines() if l.startswith('{')]
    if r.returncode != 0 or not status or json.loads(status[-1]).get('status') != 'ok':
        print(s['id'], '失敗', r.stderr[-800:]); sys.exit(1)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '44100', '-b:a', '96k', mp3], check=True)
    print(s['id'], s['title'], f"{json.loads(status[-1])['duration_seconds']:.1f}s", flush=True)
open(os.path.join(OUT, 'voice.txt'), 'w', encoding='utf-8').write('BlueMagpie-TTS hung_yi_lee')
print('完成')
