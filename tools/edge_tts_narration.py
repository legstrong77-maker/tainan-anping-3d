# 用本機的 edge-tts 產生旁白：python tools/edge_tts_narration.py [聲音] [語速]
# 預設聲音 zh-TW-YunJheNeural（台灣男聲），語速 -4%。產生 tools/audio/sXX.mp3，之後執行 node tools/build.mjs 會自動嵌入網頁。
import asyncio, json, os, re, sys
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOICE = sys.argv[1] if len(sys.argv) > 1 else 'zh-TW-YunJheNeural'
RATE = sys.argv[2] if len(sys.argv) > 2 else '-4%'
OUT = os.path.join(ROOT, 'tools', 'audio')
os.makedirs(OUT, exist_ok=True)

async def main():
    cfg = json.load(open(os.path.join(ROOT, 'tools', 'narration.json'), encoding='utf-8'))
    for s in cfg['segments']:
        text = re.sub(r'\[:[\d.]+\]', '', s['tts'])      # VoAI 停頓標籤 edge-tts 不支援，拿掉
        path = os.path.join(OUT, s['id'] + '.mp3')
        await edge_tts.Communicate(text, VOICE, rate=RATE, pitch='-2Hz').save(path)
        print(f"{s['id']} {s['title']} -> {os.path.getsize(path) // 1024} KB")
    with open(os.path.join(OUT, 'voice.txt'), 'w', encoding='utf-8') as f:
        f.write(VOICE)

asyncio.run(main())
