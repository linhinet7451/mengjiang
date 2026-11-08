# 透明原圖候選與網頁遊戲優化紀錄

日期：2026-11-08（Asia/Taipei）

本次輸入為使用者提供的 `mengjiang_pack_transparent.zip`。檔案中真正具有角色透明 alpha、可作 Sprite 候選的素材為 4 張 `fb/all` PNG；其他透明檔主要是從攻略截圖挖出的 UI、表格、按鈕、技能欄或半透明畫面，不適合直接掛載到遊戲。

## 已篩選角色候選

| 輸出 | 來源 | 尺寸 | alpha | Runtime |
|---|---|---:|---:|---|
| `reference/native-transparent/native-character-01.webp` | `assets-transparent/fb/all/t_006.png` | 206×206 | 保留 | 否，待身份對應 |
| `reference/native-transparent/native-character-02.webp` | `assets-transparent/fb/all/t_011.png` | 206×206 | 保留 | 否，待身份對應 |
| `reference/native-transparent/native-character-03.webp` | `assets-transparent/fb/all/t_036.png` | 206×206 | 保留 | 否，待身份對應 |
| `reference/native-transparent/native-character-04.webp` | `assets-transparent/fb/all/t_078.png` | 206×206 | 保留 | 否，待身份對應 |

## 優化處理

- 僅轉碼，不改變構圖、不裁切、不填背景；輸出 WebP quality 90、method 6。
- 驗證所有輸出均保留 RGBA alpha，alpha 範圍 0–255，角色外緣不變成實色背景。
- `reference/native-transparent/manifest.json` 保存來源 SHA-256、alpha 覆蓋率、輸出尺寸與大小。
- 暫不替換 `src/assets/out/h_*.webp` 或 `g_*.webp`：原圖檔名只有 `t_006` 等流水號，沒有可驗證的武將 ID；錯配會造成角色名稱、技能、圖鑑與立繪不一致。

取得角色名稱／武將 ID 或原始素材授權對照表後，可將 `mapped_hero_id` 寫入 manifest，再依現有 `tools/art_process.py` 的全身／頭像／cut-in 三尺寸流程導入 runtime。這個保守步驟保留了原圖品質，也避免把攻略截圖中的 UI 透明挖圖誤用為遊戲素材。
