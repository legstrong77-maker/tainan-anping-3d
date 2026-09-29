// 建置：把 src/ 串成單一 HTML（dist/anping.html 給 Artifact 發布；dist/index.html 給本機預覽）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => readFileSync(join(root, 'src', f), 'utf8');
const JS = ['01_core.js', '02_tex.js', '03_env.js', '04_build.js', '05_trees.js', '06_town.js', '07_landmarks.js', '08_people.js', '09_vehicles.js', '10_audio.js', '11_controls.js', '12_tour.js', '13_main.js', '14_record.js'];

const narration = JSON.parse(readFileSync(join(root, 'tools', 'narration.json'), 'utf8'));
const audioDir = join(root, 'tools', 'audio');
let audio = null, found = 0;
if (existsSync(audioDir)) {
  audio = narration.segments.map((s) => {
    const f = join(audioDir, s.id + '.mp3');
    if (!existsSync(f)) return null;
    found++;
    return readFileSync(f).toString('base64');
  });
  if (!found) audio = null;
}
const voiceFile = join(audioDir, 'voice.txt');
const voice = audio && existsSync(voiceFile) ? readFileSync(voiceFile, 'utf8').trim() : '';
const data = `const NARR_VOICE = ${JSON.stringify(voice)};
const NARRATION = ${JSON.stringify({ segments: narration.segments.map(({ id, num, title, sub, text, tts }) => ({ id, num, title, sub, text, tts })) })};\nconst NARR_AUDIO = ${audio ? JSON.stringify(audio) : 'null'};\n`;
const js = data + JS.map((f) => `/* ---- ${f} ---- */\n` + src(f)).join('\n');
const page = src('00_head.html') + '\n<script>\n' + js + '\n</script>\n';

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'app.js'), js);
writeFileSync(join(root, 'dist', 'anping.html'), page);
// 獨立網頁版（GitHub Pages）：title、meta、樣式放進 <head>
const cut = page.indexOf('<canvas id="c"');
const standalone = '<!doctype html>\n<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + page.slice(0, cut) + '</head><body>\n' + page.slice(cut) + '</body></html>\n';
writeFileSync(join(root, 'dist', 'index.html'), standalone);
mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs', 'index.html'), standalone);
writeFileSync(join(root, 'docs', '.nojekyll'), '');
console.log(`built: ${(page.length / 1024).toFixed(0)} KB, narration audio: ${found}/${narration.segments.length}`);
