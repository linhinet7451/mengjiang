# TODO — 猛將無雙 HTML5 單機重製

## English summary
Unofficial, offline, single-file HTML5 remake of the 2012–2013 Facebook game 猛將無雙. Build output: `dist/mengjiang.html` (one file, ES5, no CDN, < 12,000,000 bytes). With the original company's consent (as stated by the repository owner), original art, music, and similar assets may be referenced or used directly so the remake stays as close to the original as possible. Record each use in `docs/美術素材來源.md`. If no original file is available, redraw closer assets from the screenshots and videos in `reference/`.
State on 2026-11-04 (UTC+8): data-restoration phases **P1 and P2 from `docs/網路資料搜查-2.md` are done and tested**; formation persistence and attack-range rules were fixed (rules v9). **P3 and P4 have not been started.** Nothing has been tested on a real phone (Playwright Chromium + WebKit "iPhone 13" emulation only). Social/online modes are not built (by design: single-player). Many numbers are still grade D (our own design). Each item below lists goal, evidence + grade + URL, files/functions, acceptance tests, priority and dependencies. Read "Project rules" first.

---

## 專案規則（任何人接手都必須遵守）
1. **以原版為準**：能找到原版證據就照原版；找不到才自訂，而且要標 D。
2. **分級**：每個數字／規則都要在 `src/data/provenance.json` 有一筆 entry，等級 A／B／C／D：
   - A＝原版畫面（官方宣傳片、遊戲截圖）；B＝當年玩家攻略；C＝推論／讀圖推定；D＝本作自訂。
   - C／D 的 label **不得含「原版」**（`tools/web2-data.js` 的 `entry()` 會丟錯）。衝突兩邊都保留在 `conflicts`。
   - 新資料一律寫成 `tools/web2-data.js` 的補丁（可重跑），不要手改 json。
3. **經原公司同意（依倉庫擁有者說明），可參考或直接使用原作的美術、音樂等素材，目標是盡量貼近原作。使用原作素材時需在 docs/美術素材來源.md 記錄來源。若無原始檔案，可依 reference/ 的截圖與影片重繪貼近原版的素材。**
4. **ES5 vanilla JS**，不用框架、不用 CDN、不連網（e2e 會擋所有 http 請求）。`node tools/es5check.js` 必須通過。
5. **iPhone Safari** 必須能開（單檔 < 12,000,000 bytes；e2e 的 WebKit iPhone 13 環境必須全過）。
6. **沒有真實付款**、沒有 FB 登入、沒有遠端資料庫。
7. **存檔相容**：改存檔結構就加 `S.STEPS[n]` 遷移並把 `S.VERSION` +1；不得刪除玩家的武將、道具；新增 fixture 測試舊存檔一路升級。新戰鬥規則用 `R.RV`／`v9(u)` 這類版本閘門，舊戰報要能照舊規則重播。
8. **不得宣稱沒測過的東西通過**。回報要寫實際數字（通過／失敗數、檔案大小）。

## 建置與測試（摘要，詳見 README）
- `npm install`（acorn、playwright；e2e 需 `npx playwright install chromium webkit`）
- 資料：`node tools/build-data.js`；素材：`node tools/build-assets.js`；單檔：`node tools/build.js` → `dist/mengjiang.html`、`dist/boot-test.html`
- 單元：`sh tools/runtests.sh`（2026-11-04 21:33 UTC+8：18 組 2607 通過／0 失敗）；e2e：`node tests/e2e.js all`（見 docs/test-log-e2e.txt）；平衡：`node tools/progress-sim.js --days 30`

---

## 已完成（供參考，不用再做）
| 項目 | 等級 | 備註 |
|---|---|---|
| P1 19 名品質、12 名類型修正（snA967） | B | 存檔 v8→v9 遷移，武器 wp↔wm 互換 |
| P1 30 魂紫將名單（sn60）；孫權／東方不敗／夏侯惇衝突採 45 | B／C | 衝突 K10 |
| P1 上陣人數 25/35/60/70 級（sn41），最多 8 | B（1、15 級 D） | |
| P2 被動兩格＋21 個被動數值（snA967） | B（部分 D） | `tools/web2-p2.js` |
| P2 8 陣（含錐行陣）、每陣 8 格（sn77） | A（數值 D、開放順序 D） | 存檔 v9→v10 |
| P2 連攜 30 對（snA967） | B（效果數值 D） | |
| P2 補 21 名武將＋原創立繪 | B（技能名／外觀 D） | |
| P2 宣傳片 5 個無雙名、cut-in 直書技名 | A（對應武將 C） | |
| P2 「玉墜」→「項鍊」顯示名（snA282 截圖） | A | |
| 緊急修正：陣法／站位保存 | D（規則）| 見 docs/原版還原-進度.md |
| 緊急修正：攻擊範圍以攻擊者為起點、往前數活人 | A／B／C／D 分項 | web2.range.* |
| 10 名查無來源武將保留、標 D | D | web2.hero.unsourced10 |

---

## 待辦

每項格式：**目標**／**證據（等級、URL）**／**檔案與函式**／**驗收與測試**／**優先、相依**。
URL 縮寫：`G2(sn)` = `https://forum.gamer.com.tw/G2.php?bsn=22512&sn=<sn>`；`C(snA)` = `https://forum.gamer.com.tw/C.php?bsn=22512&snA=<snA>`。整理過的事實在 `docs/sources-extracted/`（不含原始網頁）。

### P3-1 技能倍率重新校準（未做）
- 目標：普攻／六等／無雙倍率改照原帖寫法（普攻 X a+5、六等 X(b+125)、無雙 c+10），並做出「6 等後每級 +50 固定值」與技能傷害上限。
- 證據：C(967) 表 5（B）；C(282) 14 張 tooltip 截圖（A：曹操 Lv1 x0.74+5→Lv6 x1+125、劉備 x0.94+5→x1.24+125、小昭 Lv5 +75／Lv6 +125／Lv7 +175／Lv9 +275；楊過 Lv6 上限 6000、劉備無雙 Lv1 上限 3000）。
- 檔案：`src/data/heroes.json`（skills）、`src/js/rules.js`（R.skillLv、傷害公式）、`src/js/battle.js`；補丁寫在 `tools/web2-data.js` 新增 `P3`；`docs/sources-extracted/web2/c-snA967-skills.json`、`c-snA282-lv6.json`。目前倍率＝snA967 × 本作換算（主動 ×1.6、無雙 ×2.9，web2.hero.new.detail D）。
- 驗收：tests 新增 unit-web2-p3：抽 5 名武將比對 Lv1／Lv6／Lv9 倍率與截圖一致；上限生效；golden v9 若改變要重產並在進度檔寫明原因；平衡 sim 30 天不得出現 3 天以上卡關。
- 優先：高；相依：無（但會影響平衡，需同時調 enemyScale）。

### P3-2 967 範圍形狀套到既有武將（未做）
- 目標：所有武將的普攻／六等／無雙範圍改用 snA967 格圖（tools/glyph967.js 已能轉換，回傳 {ri, shape, ambiguous}）。
- 證據：C(967) 格圖（B；「●」＝自身格是讀圖推定 C）；C(282) 六等形狀（讀圖 B，模糊 C）；sn8 規則（六大天王六等不變、紫將只有趙雲／呂布不變、藍將全變、無雙不變，B）G2(8)。
- 檔案：`tools/glyph967.js`、`tools/web2-p2.js`（目前只套用新武將）、`src/data/heroes.json` active.shape、`src/js/rules.js` 範圍計算。
- 驗收：每名武將 shape 有 provenance（ambiguous 的標 C）；unit 測 sn8 規則；e2e 神武殿格圖顯示正確。
- 優先：高；相依：P3-1 可同時做。

### P3-3 開放等級（未做）
- 目標：榮譽試煉 8、榮譽商城 8、無極 12、公會 15、聯賽 20、圖騰 20、通天 22、上古 25、將星錄 30（30/45/60/75/80 分段）、華容道 30、武林大會 35、銅雀台 35、觀星台 40、玄機盤 50、除魔殿 65。
- 證據：G2(41)「1～60 全攻略」2013-02-17（B＋A 截圖）。
- 檔案：`src/data/config.json` buildings.*.openLv、`src/js/ui-city.js`；我方沒有的系統（公會、聯賽、圖騰、銅雀台、除魔殿）不要做開關，只在 TODO 社群項目記錄。
- 驗收：unit 測各建築 openLv；舊存檔已超過等級者不得被鎖；e2e 主城仍可進各建築。
- 優先：中；相依：無。

### P3-4 經驗表 Lv7～79（未做）
- 目標：主角／武將升級經驗改用原版表（例 10:840、20:4610、30:16070、60:210470、70:830732）；Lv1～6、80～90 標 D 補間。
- 證據：G2(6)（B）。
- 檔案：`src/js/rules.js` expNeed、`src/data/config.json` grow；`src/js/state.js` 85 行。
- 驗收：unit 比對表中每一級；存檔遷移時不降級（經驗超過時保留等級）；平衡 sim 30 天。
- 優先：中；相依：與 P3-1 一起調平衡。

### P3-5 將星錄組合名與將星魂量（未做）
- 目標：以原版組合（傲血忠魂 物攻+17、月下舞劍、天公將軍、紅袖添香、百戰將軍、替天行道、六大天王、金剛神力丸、三風、五嶽盟主、雄霸一方、五虎名將、曹魏英豪、嵩山劍氣、世外高人、妻妾成群、天山霜雪、千嬌百媚、玉貌仙姿）取代目前二十八宿（D）；白／綠／藍／30 紫／45 紫各等所需魂到 Lv18。
- 證據：G2(47)、G2(53)、G2(48)、G2(41)、G2(60)（B）；多數組合效果數值未記載（D）。
- 檔案：`src/js/sys3.js`／`ui-p3.js`（將星錄）、`src/data/config.json` jiangxing。
- 驗收：存檔遷移把舊星盤投入的星魂全數退回或換算，不得遺失；unit 測組合條件與魂量表。
- 優先：中；相依：P3-3（將星錄 30 級開放）。

### P3-6 戰場道具與榮譽試煉 BOSS／精英（未做）
- 目標：炸彈 3 形（大 XOOX/OOOO/XOOX、中 OXO/XOX/OXO、小 XOX/OOO/XOX）、旗幟 8%×1／7%×2／6%×3、火焰器 4 格斜線＋燒傷；BOSS 金框、精英銀框。
- 證據：G2(51)、G2(17)（B）。
- 檔案：`src/js/battle.js`（新事件類型，須 v9 閘門或新 RV）、`src/js/ui-battle.js`、`src/data/stages.json`。
- 驗收：固定種子 unit；舊戰報重播不變；e2e 顯示。
- 優先：低；相依：P3-1。

### P4-1 寶石數值（未做）
- 目標：物攻 17/58/164/324/665、物防 9/29/82/162/333、暴擊／閃避 55/182/345/545/1000（Lv6 1636）、命中 60…1100、生命 54…1998；545＝4.54%、基礎閃避 5%；敏捷上限＝屬性×0.4。
- 證據：G2(84)（B）。
- 檔案：`src/data/config.json` gems、`src/js/sys2.js`（神兵坊）。
- 驗收：已鑲寶石的存檔照等級換新數值，不丟寶石；unit 測表。優先：中。

### P4-2 心法 2 格與魂經驗（未做）
- 目標：心法 2 格（隨機＋特殊）；魂經驗 白 1／綠 10／藍 50／紫 100。目前 20、40 級各多 1 欄（D）。
- 證據：G2(86)、G2(91)（B）。檔案：`src/js/sys2.js` xinfaSlots、`src/js/rules.js` 78 行、`ui-p2.js`。
- 驗收：已修第 3 格的存檔要退回秘笈而不是刪除；unit＋e2e。優先：中。

### P4-3 生死劫 9 層（未做）
- 目標：魑、冷香絕、摩羅、羅迦、魎、羲天、阿修羅、深淵之龍、窮奇。敵方數值與獎勵 D。
- 證據：G2(88)（B）。檔案：新 `sys10.js`／`ui-p10.js`，`index.html` 載入順序在 ui-p9 之後。優先：低。

### P4-4 5 魂合成公式 34 條（未做）
- 目標：照 C(541) 34 條公式（順序無關、綠將無公式、30 級開放、5 個同階魂機率得高階或同階隨機）；公式正確時提示。目前是隨機合成（K1 兩規則）。
- 證據：C(541)（B；留言中爭議兩條標 C 不實作）；G2(4)（B）。整理檔 `docs/sources-extracted/web2/c-snA541-recipes.json`。
- 檔案：`src/js/sys3.js` 將魂合成。驗收：每條公式 unit；爭議兩條不觸發。優先：中。

### P4-5 六等範圍規則全面套用（未做）→ 見 P3-2；另把 967 的狀態效果（附加狀態、機率）套到全部武將。證據 C(967)、C(282)（A／B）。優先：中。

### P4-6 10 名查無來源武將（洪七公、紫霞、黃藥師、歐陽鋒、司馬懿、至尊寶、岳不群、魏延、黃忠、甘寧）
- 目前：保留、整組標 D（web2.hero.unsourced10）。待辦：繼續找來源（巴哈精華區已失效圖、Wayback mjws.snsyx.com 2016 快照原檔 0 bytes）；找到就升級，找不到維持 D。優先：低。

### P4-7 體力規則（不做，記錄）
- 原版：虛空每戰 1 點、30 級前敗不扣、上古 5 點、30 分回 1（G2(15)、G2(17)，B）。本作依 Tomas 規格**取消精力**（D，K9）。只需在 UI 說明，不還原。

### ART-1 血條／無雙條 5px（部分）
- 目標：戰場單位血條、無雙條粗細、顏色、位置對照宣傳片（A，https://www.youtube.com/watch?v=tcxWoC-Rtb8，本地 `reference/web2/video/`）。
- 現況：底部頭像列 `.pb-bar` 4px（手機 5px，`src/css/style.css` 789／806 行）；單位頭上條需逐格比對影片。
- 驗收：截圖比對（`node tools/shots.js dist/mengjiang.html <dir> <prefix>`）＋e2e 不回歸。優先：中。

### ART-2 底部頭像列只顯示我方（未做）
- 宣傳片底部 6 個武將頭像（A）。目前 `src/js/ui-battle.js` 47 行 `#bpbar` 只列我方。需確認原版是否也只列我方（影片逐格），若原版有敵方則加上。優先：中。

### ART-3 提示／彈出訊息位置（部分）
- art4 已把神武殿／神兵坊／聚賢莊提示移到下方金框；其他畫面（戰鬥結算、陣法「陣法已儲存」）位置仍需對照影片／截圖。檔案：`src/js/ui.js` toast、`style.css`。優先：低。

### ART-4 無雙半身特寫（大致完成）
- 已有：每名武將 `_ci` 半身像（256px Q58）＋直書金字技名（宣傳片 A）。待辦：特寫進場動畫時序與光效對照影片；新武將 18 名 _ci 為自動裁切，個別需 `tools/art_process.py` 的 `crop_over` 微調。優先：低。

### ART-5 以原作素材或更貼近的重繪取代生成圖與音樂（未做）
- 目標：在取得原作檔案，或有經同意的來源時，把目前生成的美術與音樂換成原作素材，或依 `reference/` 的截圖與影片重繪得更貼近原版。
- Replace generated art and music with original assets, or closer redraws, when original files or permission-backed sources are available.
- 證據：原公司同意（依倉庫擁有者說明）。使用原作素材時記入 `docs/美術素材來源.md`。
- 檔案：`src/assets/`、`src/js/audio.js`、`src/js/art.js`、`docs/美術素材來源.md`。
- 驗收：每項替換都有來源紀錄；`sh tools/runtests.sh` 仍通過；單檔仍 < 12,000,000 bytes。
- 優先：中；相依：有原始檔，或 `reference/` 的截圖與影片可對照。

### JX-1 聚賢莊升級（完成數值 D，2026-11-04）
- 已做：升級按鈕與目前／下一級效果。數值（5＋(lv−1)、500×lv² 銀、不超過主角等級）全是 D。待查：原作每級欄位數、費用、經驗池上限、解僱返還經驗（S1 提到，未做）。優先：中。

### BOARD-1 v10 大棋盤規則（C／D，2026-11-04）
- 前進／不換列 C（Tomas 回憶）；中間 2 欄、前線限制、僵局判定、等待不加怒氣 D。待找影片確認雙方起始距離與是否真的每回合前進。1 對 1 時 yulin、yanxing 因範圍不對稱勝率 22/30，需觀察。優先：中。

### BOARD-2 v11 持續前進、走到底排隊（C／D，2026-11-04，Tomas t23u）
- 規則（R.RV=11，只對全部單位 rv≥11 的戰鬥；rv 10 戰報照 v10 重播，`tests/fixtures/battle-golden-v10.json` 逐位元相同）：
  - C（Tomas 回憶）：雙方每回合一直往前一格，同一列對面敵人死了也繼續走；走到盡頭時回到「自己這一方第一排」後方排隊，敵我都一樣；不換列。provenance v11.board.advance、v11.board.wrap。
  - D：前方是隊友就停下；是敵人就停下來打（v11.board.block）。卡住穿過：上一回合已緊貼敵人停下、那回合技能打不到（等待），這回合從敵人身邊穿到同一列下一個空格（同 v11.board.block）。
  - D：排隊格＝我方其他活著的人最前面那一欄的後一欄（同列），有人就再往後，後面全滿才往前找；只剩自己回到開場第一排（我方第 2 欄／敵方第 5 欄）（v11.board.queue）。
  - D：連續 8 回合（棋盤 8 欄）雙方沒人受傷 → 以剩餘血量比例判僵局（我方嚴格較高才贏）（v11.board.stale）。v10 的「沒人走得動」僵局在 v11 不會成立。
- **待 Tomas 確認**：「統一到第一排後方排隊」是否表示走到底的人可以換到別列？目前不換列。模擬裡剩下的超時大多是「雙方剩下的人不同列」（標準 30 天 103 場超時中 100 場），如果原作會換列，這是最該改的地方。另外「卡住穿過」原作是否如此不確定。
- 模擬（progress-sim 30 天，標準／快速 14 天）：見 docs/progress-sim-v10.txt、docs/progress-sim-v11.txt。超時 1509→103、1254→96；全部 64 關 第 20 天→第 10 天。平衡表 docs/balance-v10-before.txt、docs/balance-v11.txt。
- 測試：tests/unit-wrap.js（36）、unit-board.js 改成 v10 固定 rv 10 重跑；e2e.js 新增走到底排隊畫面檢查與截圖 `screenshots/*-26-battle-wrap.png`。
- 優先：中；相依：Tomas 回覆換列問題。

### QA-1 真機測試（未做）
- 從未在實體 iPhone／Android 測試，只跑 Playwright 模擬。目標：iPhone Safari（iOS 16+）開啟 GitHub Pages 版、進主城、打一場、存檔重整、匯出匯入。記錄機型、iOS 版本、載入秒數、記憶體警告。優先：**高**。

### SOC-1 社群／線上模式（不做，記錄）
- 原版有公會、聯賽、武林大會（對人）、上古寶窟 3 人組隊、好友拜訪。本作為單機：拜訪武將＝AI 競技場、上古寶窟＝單人版（D）。不得接遠端資料庫。若要做，只能用本機 AI 模擬並標 D。

### DATA-1 仍是 D 的資料（持續）
- 主要 D 項（`provenance.json` 中 grade D 的 73 筆（共 131 筆））：招募機率、上古寶窟分層與掉落、主角升階 20／60／90、陣法加成數字與 8 格開放順序、連攜效果數值、未寫數值的被動、新武將技能名與外觀、攻擊範圍「往前衝／換列／揮空／無雙改主動技」、陣法保存規則、1／15 級上陣人數。
- 做法：查到 A／B 來源就改 `tools/web2-data.js` 補丁並升級等級；在 `docs/網路資料搜查-2.md` 補來源列。

---

## 已知限制
- 單檔已接近 12,000,000 bytes 上限（目前約 11.9 MB）；再加美術前先降其他素材或改 lazy chunk。
- 平衡（progress-sim 30 天，最後一次）：64／72 關、勝 64 敗 117、最長卡關 0 天。v9 範圍規則下 1 對 1 可能磨血超時，見 docs/原版還原-進度.md。
