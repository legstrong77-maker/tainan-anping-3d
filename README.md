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
- 旁白：[BlueMagpie-TTS](https://github.com/OpenFormosa/BlueMagpie-TTS)（OpenFormosa）內附的授權語者 `hung_yi_lee`。

## 建置

```bash
node tools/build.mjs
```

原始碼在 `src/`，建置後輸出 `docs/index.html`（GitHub Pages 使用）。重新產生旁白：`tools/bluemagpie_narration.py`。
