# 原版素材包篩選與網頁優化紀錄

日期：2026-11-08（Asia/Taipei）

本次輸入為使用者提供的 `mengjiang_pack.zip`。檢查後確認內容以原版遊戲截圖、攻略頁截圖與宣傳影片畫格為主；沒有可直接掛載的透明 PNG、Sprite sheet、原始建築圖層或無 UI 背景圖。因此不把含有原版文字、按鈕、帳號與數值的截圖直接嵌入公開遊戲 runtime。

## 篩選結果

| 優化檔 | 來源用途 | 可用方式 | Runtime |
|---|---|---|---|
| `city-ui-reference.webp` | `reference/main_city.jpg` | 主城建築位置、青綠／紫金色彩與 UI 遮罩參考 | 否 |
| `shenwu-ui-reference.webp` | `reference/shenwudian.jpg` | 神武殿兩欄布局、深橄欖金框、人物預覽區參考 | 否 |
| `battle-ui-reference.webp` | `reference/fb/fb_08.jpg` | 戰鬥 HUD、角色列、技能／生命條相對位置參考 | 否 |
| `cutin-reference.webp` | `reference/fb/fb_10.jpg` | 無雙特寫構圖、紫紅光效與角色比例參考 | 否 |
| `hero-sheet-reference.webp` | `reference/web3/sn282-01.JPG` | 武將卡、品質框與圖鑑資訊密度參考 | 否 |
| `skill-ui-reference.webp` | `reference/web3/sn4892-01.JPG` | 技能面板、技能圖示與深色欄位參考 | 否 |
| `showcase-reference.webp` | `reference/web2/video/hi/h03.jpg` | 宣傳片畫面比例與特寫演出參考 | 否 |

## 優化處理

精選檔以 Pillow 轉為 WebP quality 84、method 6，保留完整比例與內容，只改變編碼以便本地視覺 QA；原始來源不覆寫。每一筆來源 SHA-256、尺寸與輸出位元組保存在 `reference/native-pack/manifest.json`。

這批檔案是設計／驗收參考，不會進入 `src/assets/out`、`assets.generated.js` 或單檔 bundle，因此不增加玩家下載量，也不會把原版截圖中的 UI 文字誤當成遊戲可用 Sprite。真正上線素材仍沿用專案既有原創／重繪 WebP，並以本批參考圖校正色彩、構圖、面板密度與特寫演出。

## 後續可直接升級的素材條件

若取得具授權的原生透明素材，優先替換：角色全身立繪與頭像、主城建築獨立圖層、戰鬥背景無 UI 版本、技能／道具透明圖示。每個檔案仍需通過尺寸、alpha 邊緣、WebP 大小與離線 12 MB bundle 檢查後才進入 `src/assets/out`。
