# TODO — 猛將無雙 HTML5 單機重製

## BOARD-3 走到底後回「最上方第一列」排隊（已完成）

BOARD-3 已完成；維持現行 v12 棋盤規則，本次不重做、不改動其行為。原規則摘要：雙方持續往前，走到底後不分敵我排入最上方第一列；已佔用位置依序排隊，不上下換列。歷史版本測試由 `unit-wrap12.js`、`unit-board.js` 及 golden fixtures 覆蓋。

## English summary
Unofficial, offline, single-file HTML5 remake of the 2012–2013 Facebook game 猛將無雙. Build output: `dist/mengjiang.html` (one file, ES5, no CDN, < 12,000,000 bytes). With the original company's consent (as stated by the repository owner), original art, music, and similar assets may be referenced or used directly so the remake stays as close to the original as possible. Record each use in `docs/美術素材來源.md`. If no original file is available, redraw closer assets from the screenshots and videos in `reference/`.
State on 2026-11-08 (UTC+8): P1/P2 and P3-1–P3-6, SHOP-1, TASK-1 and P4-1–P4-6 are complete. P3-1 rates/caps remain RV13; P3-2 skill range shapes RV14; P3-6 field-item replay events RV15. P3-3–P3-5 remain in save v12; P4-2 third-slot compatibility is idempotent. P4-7 and later remain pending. Nothing here claims real-device testing; Playwright Chromium/WebKit iPhone 13 are emulations only. Social/online modes are not built (by design: single-player); the Honor Trial multiplayer item economy is not reconstructed. Many numbers remain grade D. Each item below lists goal, evidence + grade + URL, files/functions, acceptance tests, priority and dependencies. Read "Project rules" first.

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
- `npm install`（acorn、playwright、terser；e2e 需 `npx playwright install chromium webkit`）
- 資料：`node tools/build-data.js`；素材：`node tools/build-assets.js`；單檔：`node tools/build.js` → `dist/mengjiang.html`、`dist/boot-test.html`
- 單元：`sh tools/runtests.sh`（本輪 26 組、3,712 項通過／0 失敗，見 `docs/test-log-unit.txt`）；e2e：`node tests/e2e.js all`（444 通過／0 失敗，Chromium、WebKit iPhone 13、橫向手機各 148）；單檔 11,890,862 bytes（<12,000,000），51 個 inline script 全通過 ES5。平衡：`node tools/progress-sim.js --days 30`（P3-1 已執行）。

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

### P3-1 技能倍率重新校準（已完成，RV13）
- 實作：W967 表 5 的 61 名武將（88 名中）主動 Lv1／Lv6 與無雙基準已加入；4 個姓名差異明確以 alias 對應，未列來源的 27 名維持 D 級既有倍率。
- 主動技能等級：倍率在 Lv1/Lv6 間線性插值（C）；固定值採 Lv1 +5、Lv5 +75、Lv6 +125，Lv7 起每級 +50；Lv2–4 插值規則列 C。無雙採來源基準 c+10，升級仍沿用未有逐級來源的原本 D 曲線。
- 截圖上限：楊過主動 6000、劉備無雙 3000；劉備無雙按截圖設為對敵全體攻擊。引擎採每目標單次最終傷害上限，語義列 C；舊 replay 快照維持當時倍率，上限只對新技能快照生效。
- 資料補丁：`tools/web2-data.js P3` → `tools/web2-p3.js`；來源與可信度寫入 `src/data/provenance.json`。P3-1 技能倍率在 RV13；P3-2 格圖在 RV14；BOARD-3 棋盤仍為 v12。
- P3-1 驗收（完成當時）：`unit-web2-p3.js` 28/28；全單元 21 組、2,705/2,705；E2E 405/405；RV10–RV12 golden 保持、另建 RV13 golden。30 天標準／加速模式最長連續卡關均為 0 天；12-seed balance 已執行，不需調整 `enemyScale`。
- 優先：高；已完成。

### P3-2 967 範圍形狀套到既有武將（已完成，RV14）
- 覆蓋：W967 有來源的 61/88 名既有武將已映射主動 Lv1、Lv6 與無雙格圖；4 個姓名差異以 alias 對應。49 筆使用 W282 格位截圖（34 張原始 Lv6、15 張 Lv7+ 推用）；其餘 12 筆使用 W967 格圖。未列來源的 27 名武將及主角保留原 pattern/D 級，不臆造格位。
- sn8 規則：六名綠魂將範圍不變、20 名藍魂將範圍改變、紫將趙雲／呂布不變；紫雲採 W282 直接 Lv6 圖處理 W967「same」差異。熊貓缺清晰 Lv6 格圖，保留 W967 shape 並將未解衝突標 C。
- Provenance：89 名武將/主角逐人留檔（61 C、28 D）；19 筆 W282 shape?／Lv7+ 推用有逐人 C 級註記（shape? 6、Lv7+ 15，其中 2 筆重疊）。W967 格圖錨點換算規則依 C 級 provenance；資料和來源索引皆可重建。
- 實作：`tools/web2-p3.js` 寫入 compact offsets（主動 [Lv1,Lv6]、無雙 shape）；`src/js/rules.js` 只在 RV14 套用，新舊 replay 分流，BOARD-3 棋盤維持 v12。新增 `battle-golden-v14.json`；RV10–RV13 golden 不覆寫。
- 驗收：完整單元 22 組、3,513/3,513；完整 E2E 408/408（桌機 Chromium、WebKit iPhone 13、橫向 Chromium；三平台均驗證神武殿紫雲 Lv6 三格圖）；ES5 全通過，部署單檔 11,994,670 bytes，小於 12,000,000。詳見 `docs/test-log-unit.txt`、`docs/test-log-e2e.txt`。
- 優先：高；已完成。

### P3-3 開放等級（已完成）
- 來源摘錄保存 sn=41 全部建築等級及分段：榮譽試煉／榮譽商城 8、無極 12、公會 15、聯賽／圖騰 20、通天 22、上古 25、將星錄 30（30/45/60/75/80 分段）、華容道 30、武林大會／銅雀台 35、觀星台 40、玄機盤 50、除魔殿 65。只更新已實作入口的無極 12、通天 22、將星錄 30；未實作／社群建築僅記來源，不新增假入口。
- 證據：G2(41)「1～60 全攻略」2013-02-17（B；截圖可見部分建築）。`docs/sources-extracted/web2/c-p3-3-5.json`、`SOURCES-INDEX.md` 保留來源與採用範圍；不把不同版本通用化。
- 實作：`tools/web2-p3.js` 寫 `config.buildings.*.open`；`G.buildingOpen`、`ui-city.js` 使用 30 級門檻。
- 遷移：v10→v11 對舊版 16 級門檻已能進入者設 `buildingUnlocks.jiangxing`；已存在新版本存檔亦保留等級與入口旗標。
- 驗收：`tests/unit-web2-p3-3-5.js` 檢查 12/22/30、Lv29 鎖定/Lv30 開放與舊入口保留；E2E 將星錄流程另測。
- 優先：中；已完成。

### P3-4 經驗表 Lv7～79（已完成）
- 目標：主角／武將升級使用來源逐級表：10:840、20:4610、30:16070、60:210470、70:830732。Lv1–6 沿用原低階公式；Lv80–90 從 Lv79 原表值錨定、每級 ×1.05；兩者皆標 D，不冒充來源值。
- 證據：G2(6)（B，2012-06-22；逐級表註明為對岸資料），見 `docs/sources-extracted/web2/c-p3-3-5.json`。Lv72／73 均為 892,766，照錄；不以階段合計改寫逐級數值。
- 實作：`tools/web2-p3.js` 產生 `config.expTable`；`src/js/rules.js` `R.expNeed` 讀取來源表和 D 邊界政策。
- 存檔：v10→v11 不重算／清除舊角色等級與經驗；最高主角等級維持舊值。
- 驗收：`tests/unit-web2-p3-3-5.js` 逐筆比對 Lv7–79 共 73 值、檢查 Lv72／73 重複與單調 D 尾段；`tests/unit-p5.js` 更新來源值與 7 天進度模擬。
- 優先：中；已完成。

### P3-5 將星錄組合名與將星魂量（已完成；存檔 v11）
- 將 19 組來源名稱取代我方二十八宿；只有傲血忠魂（力耐 Lv1＋智敏 Lv2）與天山霜雪（天山童姥／許褚／孫策各 Lv2）判斷來源明列的條件。其他 17 組只呈現已知名稱／部分文字，缺漏明確顯示未知。所有組合效果（包括原文物攻 +17、法攻 +27／法防 +23／敏捷 +20）目前只顯示原文參考，尚未套入戰鬥屬性；原文未說明受益範圍與套用時點。
- 魂量：白／綠／藍／30 魂紫／45 魂紫逐級表，原文有值照錄、空白 null 不外推。W53 白魂 Lv10=11、W48 白魂 9→10=10 相衝：conflict `P3R-JX-WHITE-L10`，runtime 留 null、該級升級被阻擋，待直接圖證。
- 證據：G2(47/53/48/41/60)（B，逐項分開記錄作者／日期／URL）；S1／W60 部分組合只是名稱、推薦或將魂線索，未當成完整條件。詳見 `docs/sources-extracted/web2/c-p3-3-5.json` 和 `SOURCES-INDEX.md`。
- 實作：`tools/web2-p3.js`、`src/data/config.json`、`src/js/rules.js` 魂量查表、`src/js/sys2.js` 兩組條件進度／扣同名魂、`src/js/ui-p2.js`／`ui-p6.js`、`src/css/style.css`；效果文字明示「尚未套入戰鬥」，provenance 另列 D 級保守範圍。
- 遷移：`S.VERSION=11`；舊二十八宿已點亮 N 顆依舊本作 D 級成本 `10+8×index` 全額退回星魂，保留既有餘額、主角等級／經驗、武將和 v10 以下存檔相容；不允許新舊星盤重複套用加成。
- 驗收：`tests/unit-web2-p3-3-5.js` 覆蓋 19 組名稱、五類 Lv1–18 魂量、白 Lv10 衝突阻擋、兩組已知條件、未知條件不推測、故障遷移拒絕升版、舊星盤不再套戰鬥；`unit-p2.js`、`unit-pt3.js`、`tests/e2e.js` 覆蓋 UI 與操作。
- 優先：中；已完成。

### P3-6 戰場道具與榮譽試煉 BOSS／精英（已完成：資料、RV15 事件與畫面）
- 目標：炸彈大／中／小三形分別為 XOOX/OOOO/XOOX、OXO/XOX/OXO、XOX/OOO/XOX；威力定性分低／中／高，命中目標隨機。旗幟命中 1／2／3 次的來源級距為 8%×1／7%×2／6%×3，屬性例子包括物攻、法攻、命中、法防且隨機。噴火槍按左右方向發射 4 格斜線並附灼傷。BOSS 金框、精英銀框。
- 證據：G2(51)「戰場物品效果」（B，2012-12-06）、G2(17)「新手導覽」（B，2012-06-23）；作者均為水瀲。`docs/sources-extracted/web2/c-p3-6.json` 保存結構化摘錄與 URL。來源沒有傷害係數、灼傷機率／持續時間、旗幟完整屬性池／受益對象，或第 4 次起級距，不得外推。
- 實作：`tools/web2-p3.js`／`web2-data.js` 可重跑寫入 config、provenance 與 24 個 stage leader frame 標記；`battle.js`／`ui-battle.js` 以 RV15 支援可重播道具事件與範圍預覽。道具事件需由戰鬥呼叫明確傳入；沒有把道具任意發給一般關卡或推測傷害。未重建未在本作存在的榮譽試煉多人棋盤／道具經濟。
- 驗收：`unit-web2-p3-6.js` 21/21 固定 seed 的炸彈／旗幟事件可重現、三種格形與左右 4 格火焰方向逐格比對、來源未記載數值不改戰鬥屬性、RV14 golden 完全不變；`tests/e2e.js all` 三種 viewport 均顯示精英銀框／BOSS 金框與道具事件。
- 優先：低；已完成。

### SHOP-1 商城商品篩選（已完成）
- 在商城可依商品類別（全部、裝備、寶石、心法、種子、其他道具）及付款貨幣（金幣／銀幣）篩選；兩種篩選可同時套用。結果數量及空結果清楚可見，切換篩選後回到第一頁，不改商品、價格、庫存或購買規則。
- 實作：`src/js/ui-misc.js` 商城列表與篩選 action、`src/css/style.css` chip 樣式；分類依商品 ID 前綴／資料型態，不依顯示名稱猜測。
- 驗收：`tests/e2e.js all` 在三種 viewport 覆蓋類別／貨幣交叉篩選、空結果提示、分頁重設與篩選後購買仍可用。
- 優先：中；已完成。

### TASK-1 任務獎勵一鍵領取（已完成）
- 任務面板提供一鍵領取目前所有可領的主線、歷練任務、已達活躍度寶箱與已達成成就獎勵；先領歷練任務再檢查活躍寶箱。逐階可領成就依序領完。不可重領或略過現有資格檢查；簽到／簽到累計獎勵仍由原按鈕手動領取。回報領取項數並在同一獎勵窗合併顯示所有獎勵；無可領時停用按鈕。
- 實作：`src/js/sys3.js` 共用 `taskRewardCount`／`claimAllTaskRewards`；`src/js/ui-p3.js` 在任務各分頁提供按鈕及合併回報。
- 驗收：`unit-p3.js` 覆蓋混合主線、歷練、寶箱、多階成就、簽到累計獎勵排除、空集合、重複呼叫與獎勵／活躍度帳目；E2E 覆蓋 UI 批領。
- 優先：中；已完成。

### P4-1 寶石數值（已完成）
- W84 逐級表已寫入 `config.gems.sourceLevels`：物攻 17/58/164/324/665、物防 9/29/82/162/333、暴擊／閃避 55/182/345/545/1000/1636，命中／生命照來源摘錄；缺值不外推。`rules.equipStats` 依既有 `gem_*` ID 讀新表，已鑲寶石存檔不丟等級。
- 545＝4.54%、基礎閃避 5%、敏捷上限＝屬性×0.4 仍按來源／既有規則保留，不把說明百分比誤換算成另一套 runtime 數值。證據：G2(84)（B）；P4 摘錄與 provenance 可重建。
- 驗收：`unit-web2-p4-1-2-5-6.js` 驗證 W84 表與 gem_atk Lv1/Lv5 套值；`unit-pt4.js` 鑲嵌回歸通過。優先：中；已完成。

### P4-2 心法 2 格與魂經驗（已完成）
- `xinfaSlots` 改為 Lv1／Lv60 兩格，第一格普通、第二格特殊；白／綠／藍／紫魂經驗為 1／10／50／100，心法上限 100。`xinfaFeed` 的特殊欄僅接受武將連攜魂。
- 舊存檔第三格載入時退回對應 `xf_*` 秘笈，原資料保留於 `xfOverflow`，旗標避免重複退還；介面不再顯示第三格。證據：G2(86)、G2(91)（B）。
- 驗收：P4 專項 3 項遷移／魂經驗測試與 `unit-pt4.js` 心法回歸通過。優先：中；已完成。

### P4-3 生死劫 9 層（已完成；數值與規則為 D）
- 目標：魑、冷香絕、摩羅、羅迦、魎、羲天、阿修羅、深淵之龍、窮奇。敵方數值與獎勵 D。
- 證據：G2(88)（B；九層名稱）；逐層開放、首領等級／外觀／技能與首通獎勵均為本作 D 級。`provenance.json` 由 `tools/web2-data.js` 可重複產生並列明此界線。
- 實作：`src/js/sys10.js`、`src/js/ui-p10.js`，`index.html` 載入順序在 ui-p9 之後；存檔 v11→v12 保留舊進度並建立生死劫欄位。
- 驗收：`tests/unit-web2-p4-3.js` 17 項覆蓋九層名稱、首領、鎖層／通關／敗北、首通獎勵、重複挑戰、邊界輸入、實際戰鬥引擎與 v11 存檔遷移；E2E 驗證入口、九層與首層鎖定。完整 26 組單元與 444 項 E2E 回歸均通過。
- 優先：低；已完成（本作規則明確標 D）。

### P4-4 5 魂合成公式 34 條（已完成）
- 目標：照 C(541) 34 條公式（順序無關、綠將無公式、30 級開放、正確配方提示）取代原本沒有來源的隨機合成；正確配方消耗 5 個指定將魂並產出指定將魂。兩條留言爭議公式不啟用。
- 證據：C(541)（B；留言中爭議兩條標 C 不實作）；G2(4)（B）。整理檔 `docs/sources-extracted/web2/c-snA541-recipes.json`。
- 實作：`tools/web2-data.js` 將來源公式映射成 `config.soulCombine.recipes`；`src/js/sys6.js` 提供順序無關的公式比對、缺料保護與合成；`src/js/ui-p6.js` 顯示 34 條配方與可用狀態。
- 驗收：P4 專項測試覆蓋 34 條、固定 5 材料、順序無關、正確輸出、缺料不扣除與爭議公式不觸發；完整單元／E2E 回歸另行執行。優先：中；已完成。

### P4-5 六等範圍規則全面套用（已完成／P3-2 已覆蓋）
- 六等範圍與來源格圖沿用 P3-2 的 RV14 實作；本次補上 W967 61 名技能列的來源效果抽取／狀態 tags provenance。已有明確 `fx` 才套入戰鬥；W967 未列的觸發機率、持續回合或完整屬性不自行補值。
- 證據：C(967)、C(282)（A／B）；驗收：P4 provenance 測試與 `unit-pt4` 狀態機率回歸。優先：中；已完成（保守來源邊界）。

### P4-6 10 名查無來源武將（已完成本輪查核；維持保守分級）
- 洪七公、紫霞、黃藥師、歐陽鋒、司馬懿、至尊寶、岳不群、魏延、黃忠、甘寧均保留現有登場／技能資料與既有品質，不以搜尋結果補改未知倍率；`web2.hero.unverifiedRoster` 及 P4 摘錄記錄 W967 可辨識登場欄，但數值仍 C/D。
- 巴哈失效圖與 Wayback 2016 快照未取得可驗證原檔；本項交付是完成查核與標記，不宣稱已找到完整原版數值。找到直接圖證後可升級，不需重寫存檔。優先：低；已完成本輪來源邊界處理。

### P4-7 體力規則（不做，記錄）
- 原版：虛空每戰 1 點、30 級前敗不扣、上古 5 點、30 分回 1（G2(15)、G2(17)，B）。本作依 Tomas 規格**取消精力**（D，K9）。只需在 UI 說明，不還原。

### ART-1 血條／無雙條 5px（已完成）
- 戰場單位血條、底部我方頭像列的生命／無雙條統一為 5px，生命紅色、無雙金色，並保留滿怒光暈與陣亡灰階；頭上血條與宣傳片構圖保持在角色上方，不遮總生命條。
- 實作：`src/css/style.css` `.pb-bar` 5px、`src/js/ui-battle.js` `hpHtml`／頭像列同步寬度；不改戰鬥數值或 replay。
- 驗收：`tests/e2e.js all` 三種 viewport 均驗證血條／無雙條存在、在舞台內、無重疊且至少一條有值；截圖工具可再做逐格人工比對。優先：中；已完成。

### ART-2 底部頭像列只顯示我方（已完成）
- `#bpbar` 僅由 `r.team` 產生，按陣位排序顯示我方頭像、生命條與無雙條；敵方不混入列中，戰鬥結束時隱藏。這符合目前可核對的宣傳片構圖；未宣稱原版所有模式均有相同數量。
- 驗收：E2E 驗證頭像數量等於我方隊伍、無敵方 DOM、列在舞台內且不與底部按鈕／角色重疊。優先：中；已完成。

### ART-3 提示／彈出訊息位置（已完成）
- `UI.toast` 依場景分流：主城提示位於上方中央；神武殿／神兵坊／聚賢莊提示位於下方金框；戰鬥、陣法與其他彈窗維持不遮核心操作區的預設提示層。提示內容仍由既有 action 產生，不改獎勵或購買邏輯。
- 實作：`src/js/ui.js` toast class 分流、`src/css/style.css` `#toast.top`／`#toast.low` 與金框樣式；E2E 覆蓋陣法儲存、戰鬥結果、商店與設定提示不回歸。優先：低；已完成。

### ART-4 無雙半身特寫（已完成）
- 每名武將使用 `_ci` 半身像（256px Q58，缺圖有既有回退），搭配直書金字技名、金色光效、側邊滑入動畫與總傷害顯示；敵方鏡像與省電模式均有對應處理。
- 實作：`src/js/ui-battle.js` cut-in event、`src/css/style.css` `.ci-art.hi`／`ciin`／光帶、`src/js/art.js` cut-in asset mapping。新武將自動裁切的個別像素差異屬素材微調，不阻擋本項交付。
- 驗收：`tests/e2e.js all` 驗證無雙特寫、技能名、總傷害與 battle replay 不回歸；`tools/showcase.js` 可產生特寫截圖。優先：低；已完成。

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
