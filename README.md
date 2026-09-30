# 安平地名誌｜台南地名誌 EP.01

可以自由走動的 3D 動漫風台南安平，附約四分鐘的章節式知識導覽（運鏡、字幕、旁白）。

**線上遊玩：** https://legstrong77-maker.github.io/tainan-anping-3d/

## 玩法

| 按鍵 | 功能 |
| --- | --- |
| WASD／方向鍵 | 走路（Shift 跑步） |
| 滑鼠 | 點畫面鎖定視角後轉頭 |
| 空白鍵 | 跳躍；飛行中上升 |
| F | 切換飛行（C 下降） |
| 1–9、0 | 傳送到各景點 |
| T | 導覽影片（旁白＋字幕＋運鏡） |
| N | 切換時段：午後、夕照、夜晚 |
| H | 隱藏介面 |
| M | 靜音 |

手機：左半邊拖曳走路、右半邊拖曳轉頭。

## 內容

延平街老街、安平古堡、熱蘭遮城城垣殘蹟、德記洋行與安平樹屋、夕遊出張所、開台天后宮、劍獅埕、台南運河與遊船碼頭、億載金城、觀夕平台與蚵棚。靠近地標會跳出知識卡。史實的查證與出處見 [研究筆記.md](研究筆記.md)，場景規格見 [安平_提示詞.md](安平_提示詞.md)。

## 技術

- 單一 HTML，只用 cdnjs 的 three.js r128；所有模型、貼圖、招牌都用程式與 Canvas 產生。
- 環境音用 Web Audio 即時合成。
- 旁白：Google Gemini TTS，聲音 Rasalgethi（第 0–7 段 `gemini-3.8-flash-tts`，第 8–9 段 `gemini-3.1-flash-tts-preview` 並做 EQ 對齊音色），以本機 faster-whisper 檢查讀音。

## 建置

```bash
node tools/build.mjs
```

原始碼在 `src/`，建置後輸出 `docs/index.html`（GitHub Pages 使用）。重新產生旁白：`tools/gemini_tts_narration.py`（需要 `GEMINI_API_KEY`，金鑰不放在 repo 裡）。錄影與合成影片：`tools/devserver.py`＋頁面內 `recordTour()`，再執行 `tools/make_video.py`。
