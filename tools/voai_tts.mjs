// 用 VoAI TTS 產生旁白音檔：node tools/voai_tts.mjs
// 需要環境變數 VOAI_API_KEY（在 https://app.voai.ai/setting/api-keys 申請）。
// 產生的 tools/audio/sXX.mp3 會在下次 node tools/build.mjs 時自動嵌入網頁，導覽就會改用文彬的聲音。
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const key = process.env.VOAI_API_KEY;
if (!key) { console.error('請先設定環境變數 VOAI_API_KEY'); process.exit(1); }
const cfg = JSON.parse(readFileSync(join(root, 'tools', 'narration.json'), 'utf8'));
const outDir = join(root, 'tools', 'audio');
mkdirSync(outDir, { recursive: true });
const only = process.argv.slice(2);           // 可只重做指定段落：node tools/voai_tts.mjs s03 s07
const force = only.length > 0;
const API = 'https://connect.voai.ai/TTS/generate-voice';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function speak(text) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'x-api-key': key, 'x-output-format': 'mp3', 'x-sample-rate': '32000', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { voai_script_text: text },
        voice: { name: cfg.voice.name, style: cfg.voice.style, model: cfg.voice.model },
        audio_config: { speed: 1, pitch_shift: 0, breath_pause: 0 },
      }),
    });
    if (res.status === 529) { await sleep(2000 * 2 ** attempt); continue; }   // 同時請求太多：退避重試
    if (!res.ok) throw new Error(`VoAI ${res.status}: ${await res.text()}`);
    return { buf: Buffer.from(await res.arrayBuffer()), used: res.headers.get('x-used-quota') };
  }
  throw new Error('VoAI 忙線，重試多次仍失敗');
}

let total = 0;
for (const s of cfg.segments) {
  if (force && !only.includes(s.id)) continue;
  const file = join(outDir, s.id + '.mp3');
  if (!force && existsSync(file)) { console.log(`略過 ${s.id}（已有音檔）`); continue; }
  if (s.tts.length > 1000) throw new Error(`${s.id} 超過 1000 字上限`);
  process.stdout.write(`產生 ${s.id} ${s.title}… `);
  const { buf, used } = await speak(s.tts);
  writeFileSync(file, buf);
  total += Number(used || 0);
  console.log(`完成（${(buf.length / 1024).toFixed(0)} KB，扣點 ${used ?? '?'}）`);
}
console.log(`全部完成，共扣 ${total} 點。接著執行：node tools/build.mjs`);
