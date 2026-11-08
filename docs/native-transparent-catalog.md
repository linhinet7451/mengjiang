# 透明原圖候選與網頁遊戲優化紀錄

日期：2026-11-08（Asia/Taipei）

先前盤點的使用者素材包 `mengjiang_pack_transparent.zip` 中，真正具有角色透明 alpha、可作 Sprite 候選的素材為 4 張 `fb/all` PNG；其他透明檔主要是從攻略截圖挖出的 UI、表格、按鈕、技能欄或半透明畫面，不適合直接掛載到遊戲。

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

## `reference/333(5).zip` 素材篩選（2026-11-08）

已解壓檢視 ZIP 內的 `mengjiang_asset_pack_transparent/`。共 325 個影像檔（296 JPG、27 PNG、2 GIF）；其中 `reference/` 目錄的 304 個影像均與倉庫現有同路徑參考圖逐檔 SHA-256 相同，沒有新增可套用的原始圖。剩餘 21 張 RGBA PNG 位於 `assets-transparent/`，SHA-256 去重後有 15 張獨立影像（六組只是重複輸出）。

| 類別 | 篩選結果 | 可用方式 |
|---|---|---|
| FB 角色頭像／裁切圖 | 16 張檔案、10 張不同圖；包含下表既有 4 張候選及其他 6 張。檔名是 `t_###`，沒有可驗證的武將 ID。 | 適合繼續作角色卡／頭像候選；不能直接取代全身立繪、cut-in，亦不能在未確認身份前指派給遊戲武將。 |
| 巴哈姆特／宣傳片／web3 擷取圖 | 5 張檔案、4 張不同圖；仍含截圖、文字或不完整去背內容。 | 僅作版面與美術比對參考，不直接作 runtime UI 或背景。 |
| ZIP 內 `reference/` 圖片 | 304 張，均與倉庫既有參考素材完全相同。 | 可參考既有畫面；不需重複加入或另複製到 runtime。 |

未入選的 6 張不同 FB 頭像圖為 `t_009`（與 `t_010`、`fb_07` 完全相同）、`t_037`、`t_043`（與 `fb_18` 相同）、`t_044`（與 `fb_19` 相同）、`t_047`（與 `fb_21` 相同）、`t_049`（與 `fb_23` 相同）。透明覆蓋率介於約 59%–98%；此數字只能反映遮罩範圍，不能證明去背邊緣或人物身份正確，因此先保留在 ZIP，不納入 runtime。

**結論：本次沒有可安全直接套用到 runtime 的新圖。** 既有 4 張候選已最佳化存於 `reference/native-transparent/`，但仍因缺少角色 ID 對照而不啟用。以 reference 圖校正介面和場景是可行的後續工作；要換入角色素材，須先取得可追溯的人物名稱／ID 對照，並逐張檢查去背邊緣、實際畫面尺寸與 12 MB 單檔限制。
