# TODO — 猛將無雙 HTML5 單機重製

## BOARD-3 走到底後回「最上方第一列」排隊（已完成）

BOARD-3 已完成；維持現行 v12 棋盤規則，本次不重做、不改動其行為。原規則摘要：雙方持續往前，走到底後不分敵我排入最上方第一列；已佔用位置依序排隊，不上下換列。歷史版本測試由 `unit-wrap12.js`、`unit-board.js` 及 golden fixtures 覆蓋。

## English summary
Unofficial, offline, single-file HTML5 remake of the 2012–2013 Facebook game 猛將無雙. Build output: `dist/mengjiang.html` (one file, ES5, no CDN, < 20,000,000 bytes; WL-2 起由 12,000,000 放寬，見 §WL-2). With the original company's consent (as stated by the repository owner), original art, music, and similar assets may be referenced or used directly so the remake stays as close to the original as possible. Record each use in `docs/美術素材來源.md`. If no original file is available, redraw closer assets from the screenshots and videos in `reference/`.
State on 2026-11-09 (UTC+8): ART-5 complete (88 heroes full art; 12 named-enemy boss arts added in WL-2 as D-grade originals; 15/15 screens have dedicated synthesized music). P1/P2 and P3-1–P3-6, SHOP-1, TASK-1, P4-1–P4-6 are complete; P4-3 is explicitly complete and P4-4 now has dedicated UI E2E acceptance. VID-2（兩支影片實戰分析-2：骰子玄機盤、6 枚技能牌無雙切入＋演出開關、士兵剪影、武林大會 AI、攻擊動作）已完成，見 §VID-2。WL-1（武林大會當機修復、關卡小兵增加、全身動作攻擊動畫）已完成，見 §WL-1。WL-2（單檔上限 20MB、ART-5 完成、無雙改名、D 級升級、平衡量測、虛空之門 ch9／ch10）已完成，見 §WL-2。P3-1 rates/caps remain RV13; P3-2 skill range shapes RV14; P3-6 field-item replay events RV15. P3-3–P3-5 remain implemented in current save v12 (P3-5 migration introduced in v11; P4-3 added v12). P4-2 third-slot compatibility is idempotent. P4-7 and later remain pending where explicitly scoped or dependent on original assets, real-device tests, or external confirmation. Nothing here claims real-device testing; Playwright Chromium/WebKit iPhone 13 are emulations only. Social/online modes are not built (by design: single-player); the Honor Trial multiplayer item economy is not reconstructed. Many numbers remain grade D. Each item below lists goal, evidence + grade + URL, files/functions, acceptance tests, priority and dependencies. Read "Project rules" first.

---

## 專案規則（任何人接手都必須遵守）
1. **以原版為準**：能找到原版證據就照原版；找不到才自訂，而且要標 D。
2. **分級**：每個數字／規則都要在 `src/data/provenance.json` 有一筆 entry，等級 A／B／C／D：
   - A＝原版畫面（官方宣傳片、遊戲截圖）；B＝當年玩家攻略；C＝推論／讀圖推定；D＝本作自訂。
   - C／D 的 label **不得含「原版」**（`tools/web2-data.js` 的 `entry()` 會丟錯）。衝突兩邊都保留在 `conflicts`。
   - 新資料一律寫成 `tools/web2-data.js` 的補丁（可重跑），不要手改 json。
3. **經原公司同意（依倉庫擁有者說明），可參考或直接使用原作的美術、音樂等素材，目標是盡量貼近原作。使用原作素材時需在 docs/美術素材來源.md 記錄來源。若無原始檔案，可依 reference/ 的截圖與影片重繪貼近原版的素材。**
4. **ES5 vanilla JS**，不用框架、不用 CDN、不連網（e2e 會擋所有 http 請求）。`node tools/es5check.js` 必須通過。
5. **iPhone Safari** 必須能開（單檔 < 20,000,000 bytes，WL-2 起由 12,000,000 放寬；e2e 的 WebKit iPhone 13 環境必須全過）。
6. **沒有真實付款**、沒有 FB 登入、沒有遠端資料庫。
7. **存檔相容**：改存檔結構就加 `S.STEPS[n]` 遷移並把 `S.VERSION` +1；不得刪除玩家的武將、道具；新增 fixture 測試舊存檔一路升級。新戰鬥規則用 `R.RV`／`v9(u)` 這類版本閘門，舊戰報要能照舊規則重播。
8. **不得宣稱沒測過的東西通過**。回報要寫實際數字（通過／失敗數、檔案大小）。

## 建置與測試（摘要，詳見 README）
- `npm install`（acorn、playwright、terser；e2e 需 `npx playwright install chromium webkit`）
- 資料：`node tools/build-data.js`；素材：`node tools/build-assets.js`；單檔：`node tools/build.js` → `dist/mengjiang.html`、`dist/boot-test.html`
- 單元：`sh tools/runtests.sh`（WL-2：31 組、5,074 項通過／0 失敗，見 `docs/test-log-unit.txt`）；E2E：`node tests/e2e.js all`（WL-2：**546 通過／0 失敗**，Chromium 桌機、WebKit iPhone 13、橫向手機各 182，含新增 ch9 關卡 E2E 8 項；WL-1 為 522；見 `docs/test-log-e2e.txt`）；單檔 12,466,559 bytes（<20,000,000，建置 20261109-1122-e3c9b8a0），55 個 inline script 全通過 ES5。平衡：`node tools/progress-sim.js --days 30`（WL-2 已執行，見 TODO §WL-2）。
- 注意：`node tools/gen-data.js` 目前不可直接跑——以乾淨 HEAD 驗證，它會把 `src/data/config.json` 從 50 個鍵砍到 39 個鍵（含 `soulCombine` 遺失），其內建 config 已落後於已提交資料；`node tools/web2-data.js P1 P2 P3 P4` 內容上可重跑，但會把 `config.json`／`provenance.json` 從 2 空格重排為 1 空格，並還原 3 筆手改的 provenance `current` 文字（`web2.range.advance`、`web2.range.sidestep`、`web2.formation.persist`）。本輪因此跳過這兩步，只跑 `build-data`／`build-assets`／`build`／`es5check`；修好前不要把它們放回預設建置流程。

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
| P4-3 生死劫九層 | B（層名）／D（戰鬥與獎勵規則） | v11→v12 遷移；26 組單元與 456 項 E2E 全通過 |
| P4-4 5 魂合成公式 34 條 | B（來源公式） | 專屬 UI E2E：34 條、缺料狀態、合成扣料／產出；三種 viewport 全通過 |
| ART-5（部分）41 名武將依原版截圖重繪（含巴哈精華區 31 名） | B／C | 其餘美術與音樂仍待辦 |
| MAIL-1 郵件一鍵領取（G.claimAllMail；包裹不足的附件郵件略過並提示） | 本作設計（D） | tests/unit-mailall.js |
| BATTLE-SPEED 戰鬥 4x 加速（1x→2x→4x，設定頁同步） | 本作設計（D） | src/js/ui-battle.js、ui-misc.js |
| VID-2 影片實戰分析-2：骰子玄機盤、6 牌無雙切入＋演出開關、士兵剪影、武林大會 AI、攻擊動作 | A／B／D 分項 | 見 §VID-2；`docs/影片實戰分析-2.md` |
| PERF-1 網頁版載入優化：index.html 由 11.9 MB 降為 0.75 MB，圖片改為 assets/*.webp 依需要載入；單檔離線版保留為 mengjiang.html | 本作設計（D） | tools/build.js、src/js/art.js |

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
- 覆蓋：W967 有來源的 61/88 名既有武將已映射主動 Lv1、Lv6 與無雙格圖；4 個姓名差異以 alias 對應。49 筆使用 W282 格位截圖（34 張原始 Lv6、15 張 Lv7+ 推用）；其餘 12 筆使用 W967 格圖。未列來源的 27 名武將保留原 pattern/D 級；主角依 G2 sn=7 與使用者補充改為 Lv1 向前一格、Lv6 向前兩格。
- sn8 規則：六名綠魂將範圍不變、20 名藍魂將範圍改變、紫將趙雲／呂布不變；紫雲採 W282 直接 Lv6 圖處理 W967「same」差異。熊貓缺清晰 Lv6 格圖，保留 W967 shape 並將未解衝突標 C。
- Provenance：89 名武將/主角逐人留檔（61 C、27 D、主角 B）；19 筆 W282 shape?／Lv7+ 推用有逐人 C 級註記（shape? 6、Lv7+ 15，其中 2 筆重疊）。W967 格圖錨點換算規則依 C 級 provenance；資料和來源索引皆可重建。
- 實作：`tools/web2-p3.js` 寫入 compact offsets（主動 [Lv1,Lv6]、無雙 shape）；`src/js/rules.js` 只在 RV14 套用，新舊 replay 分流，BOARD-3 棋盤維持 v12。新增 `battle-golden-v14.json`；RV10–RV13 golden 不覆寫。
- 驗收：完整單元 24 組、3,657/3,657；完整 E2E 435/435（桌機 Chromium、WebKit iPhone 13、橫向 Chromium；三平台均驗證神武殿紫雲 Lv6 三格圖）；ES5 全通過，部署單檔 11,994,670 bytes，小於 12,000,000。詳見 `docs/test-log-unit.txt`、`docs/test-log-e2e.txt`。
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

### P3-5 將星錄組合名與將星魂量（已完成；遷移 v10→v11，現行存檔 v12）
- 將 19 組來源名稱取代我方二十八宿；只有傲血忠魂（力耐 Lv1＋智敏 Lv2）與天山霜雪（天山童姥／許褚／孫策各 Lv2）判斷來源明列的條件。其他 17 組只呈現已知名稱／部分文字，缺漏明確顯示未知。所有組合效果（包括原文物攻 +17、法攻 +27／法防 +23／敏捷 +20）目前只顯示原文參考，尚未套入戰鬥屬性；原文未說明受益範圍與套用時點。
- 魂量：白／綠／藍／30 魂紫／45 魂紫逐級表，原文有值照錄、空白 null 不外推。W53 白魂 Lv10=11、W48 白魂 9→10=10 相衝：conflict `P3R-JX-WHITE-L10`，runtime 留 null、該級升級被阻擋，待直接圖證。
- 證據：G2(47/53/48/41/60)（B，逐項分開記錄作者／日期／URL）；S1／W60 部分組合只是名稱、推薦或將魂線索，未當成完整條件。詳見 `docs/sources-extracted/web2/c-p3-3-5.json` 和 `SOURCES-INDEX.md`。
- 實作：`tools/web2-p3.js`、`src/data/config.json`、`src/js/rules.js` 魂量查表、`src/js/sys2.js` 兩組條件進度／扣同名魂、`src/js/ui-p2.js`／`ui-p6.js`、`src/css/style.css`；效果文字明示「尚未套入戰鬥」，provenance 另列 D 級保守範圍。
- 遷移：此項引入時 `S.VERSION=11`；舊二十八宿已點亮 N 顆依舊本作 D 級成本 `10+8×index` 全額退回星魂，保留既有餘額、主角等級／經驗、武將和 v10 以下存檔相容；P4-3 後現行版本為 v12。不允許新舊星盤重複套用加成。
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
- 單元測試覆蓋 34 條、固定 5 材料、順序無關、30 級開放、正確輸出、缺料不扣除與爭議公式不觸發；`tests/e2e.js` 專項操作驗收介面列出 34 條、缺料提示與按鈕、材料齊備後合成、五魂扣除、指定輸出與合成紀錄。
- 驗收：完整 26 組單元 3,712／3,712；三種 viewport E2E 各 152 項通過（總計 456／456）。優先：中；已完成。

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

### VID-2 影片實戰分析-2（已完成，2026-11-08）

- 來源：兩支影片分析報告 `docs/影片實戰分析-2.md`（影片 1：https://youtu.be/RlsGxFnwKZk；影片 2 官方宣傳片：https://youtu.be/tcxWoC-Rtb8）。影片檔與抽幀不在 repo 內。
- 高優先（已完成）：
  - 無雙切入重做：左上武將名＋技名小字、紅框白字總傷害（從 0 計數）、直書金字技名（黃＋紅光暈）、範圍格縮小右置、底部 6 枚技能牌（出招方全隊無雙名，CSS 直書籤）；另加設置開關「無雙演出：開／關」（預設開，舊存檔預設開；關閉時不建切入、不播特效、不延遲，傷害直接結算）。戰鬥速度維持 1x→2x→4x 不變，兩開關獨立。實作：`src/js/ui-battle.js`（`UI.musouOn`、`ciCards`）、`src/css/style.css`（`.ci-top`／`.ci-cards`／`.ci-mini`／`.ci-total`）、`src/js/ui-misc.js`（`setOpt musou:`）、`src/js/state.js`／`src/js/game.js`（預設）。
  - 戰鬥 HUD：上方一條合併總生命條（左綠＝我方／右橙紅＝敵方、金色端頭、火焰分隔、數字置中於條下方）；底部回合＋站位小格（綠／紅）＋連擊列（頭像列上方，頭像列保留）；傷害數字黃紅漸層黑邊、增益綠字。連擊＝本回合內連續造成傷害的命中次數（雙方合計，不計閃避／無效），每回合歸零（D）。實作：`src/js/ui-battle.js`（`updateInfo`、`BT.combo`）、`src/css/style.css`（`.b-tot.split`／`.b-info`／`.ftxt.dmg`）。
  - 聚賢莊金底面板：金底＋深綠翠玉框＋四角飾＋左側直書粉紅「聚賢莊」；招募邏輯、機率、費用不變。實作：`src/js/ui-recruit.js`、`.juxian-gold`／`.jx-cn`／`.jx-vtitle`。
- 中優先（已完成）：
  - 全屏無雙特效（CSS/SVG，無圖片，D）：關羽→地球光束、梅超風→紅色爪痕、王語嫣→冰藍光束、貂蟬／孫尚香→粉瓣、呂布→水墨黑龍、張飛→巨足踩踏、其餘→黃色全屏閃光；省電模式與無雙演出關閉時不播。實作：`src/js/ui-battle.js`（`ULT_FX`、`ultFx`）、`.ultfx`。
  - 玄機盤改骰子：金色橢圓盤上 5 顆骰子（CSS 點陣，擲骰動畫）；映射：5 顆骰子作 base-6 數字（0..7775）均勻對應既有 12 項加權表（D），分布與原加權表相同；獎項、權重、每贏 5 場免費 1 次、費用 500＋等級×100、10 次保底全部不變。實作：`src/js/sys5.js`（`G.wheelDice`）、`src/js/ui-p5.js`、`src/css/style.css`（`.dice-plate`／`.die`）。
  - 武林大會 AI：第 41 屆、8 人單淘汰賽、海選 Lv.70（畫面標註 Lv.70-75）；對手沿用拜訪武將 AI 陣容（八強 vs 第 7 名、四強／決賽由非玩家對戰戰力模擬產生）；八強／四強／決賽三輪，獎勵銀幣 1,000／2,000／5,000＋培養丹／技能書分輪次（D）；戰報可重播；唯一入口：主城 → 原版玩法中心 → 武林大會。實作：`src/js/sys4.js`（`G.wulinBracket`／`G.wulinStart`／`G.wulinFight`／`G.wulinReplay`）、`src/js/ui-p4.js`（`UI.screens.wulin`）、`src/js/ui-p1p2.js`（原版玩法入口改指 `wulin`）。
  - 士兵剪影：戰場背景兩側深色半透明剪影（CSS/SVG，棋盤後方，純裝飾；省電模式隱藏）。實作：`src/js/ui-battle.js`（`armyHtml`）、`.b-army`。
- 追加（Tomas 2026-11-08，D 級原創）：攻擊動作動畫——揮刀（物理近戰：弧形刀光＋前衝＋回位）、出拳（物理徒手 `wp: none`：拳影＋衝擊波環）、氣功（法術／絕技 `dtype: m/j`：聚氣光球＋發射波）；約 380ms 基準，隨 1x/2x/4x 等比縮短；省電模式不加新光效；與無雙演出開關獨立；每個行動只觸發一次，傷害在既有 impact 時點結算。實作：`src/js/ui-battle.js`（`attackKind`／`attackAnim`）、`.atkfx`。原版攻擊動作無法考察。
- 考證：`src/data/provenance.json` 新增 `video2.*` 15 條（248→263）與衝突 `VID2-NAMES`；`docs/資料考證.md` §18。無雙名衝突：關羽「義薄雲天」、梅超風「九陰白骨爪」與 W967 數據一致；貂蟬（宣傳片「千秋蓮舞」vs 數據「千秋萬載」）、孫尚香（「美人計」vs「梟姬亂箭」）、王語嫣（「滅絕劍法」vs「口吐蓮花」）保留 W967 數據名、不改名，切入與技能頁一律顯示數據名。神兵坊幸運值／好友祝福只記錄、不實作（B）。**WL-2 更新（2026-11-09，Tomas 決定）：三名武將無雙已改用宣傳片 A 級名稱（貂蟬「千秋蓮舞」、孫尚香「美人計」、王語嫣「滅絕劍法」）；ULT_FX 對應鍵同步更新，特效不變；衝突 VID2-NAMES 已解決（另註影片3見貂蟬「千秋萬載」，待考證）。另註：大喬無雙原本就叫「千秋蓮舞」，改名後與貂蟬重名，待後續處理。**
- 驗收：27 組單元測試 3,900／3,900（新增 `tests/unit-wulin.js` 19 項；`tests/unit-extras.js` 玄機盤 44→49 項）；E2E **459／459**（`tests/e2e.js` 更新 3 處：合併血條選擇器、骰子 5 顆、攻擊動作對應）；ES5 全過（54 個 inline script）；單檔 `dist/mengjiang.html` 11,846,499 bytes（<12,000,000）。存檔版本不變（v12；`musou` 與 `wulin` 欄位由 `applyDefaults`／`extraDefaults` 補齊，舊存檔有 fixture 測試）。
- 未完成／保持原樣：ART-5 剩餘（其餘約 87 名武將、主城建築、UI 外框、音樂）；QA-1 真機測試未做；P4-7 不做（記錄）；神兵坊幸運值／好友祝福不實作。優先：高／中；已完成。

### WL-1 武林大會當機修復＋關卡小兵增加＋全身動作攻擊動畫（已完成，2026-11-09）

- 武林大會當機修復（P0，Tomas 2026-11-09 回報：按進入武林大會，螢幕卡住）：
  - 重現：新存檔 → 主城 → 原版玩法中心 → 點「進入武林大會」→ `#modal` 顯示空白全屏覆蓋層（`innerHTML` 長度 0、內無任何可關閉元素），下方主城可見但所有點擊都被空白層攔截；JS 引擎仍活著（`1+1` 可求值）、無 console 錯誤，唯一出路是重新整理頁面。直接呼叫 `MJ.UI.actions.wulin()` 則正常顯示 Lv70 鎖定訊息。Node harness 證明邏輯層無問題（`wulinState`／`wulinStart`／`wulinFight` 低等級皆 0ms 優雅失敗、`arenaFoe` 1–7ms、`wulinBracket` 10ms、八強戰鬥模擬 6ms、無無限迴圈）。
  - 根本原因：`src/js/ui-p1p2.js:15` 把武林大會卡片接成 `data-a="open" data-v="wulin"`（當作 modal），但武林大會是全屏（`UI.screens.wulin`，`src/js/ui-p4.js`），根本沒有 `UI.modals.wulin`；`UI.renderModal` 於是渲染空白 HTML 並顯示覆蓋層（`src/css/style.css` `#modal` 為 960×600、z-index 50 的全屏絕對定位層）。其餘 `data-a="open"` 目標與所有直接 `UI.open('...')` 呼叫皆有對應 modal，武林大會是唯一接錯的。
  - 修法：入口改為 `data-a="wulin"`（→ `UI.actions.wulin` → `UI.go('wulin')`，先清 modal 再渲染全屏）；另加防呆：`UI.open` 拒絕未知 modal 名（toast「未實作的動作」且不動 `UI.modal`），`UI.renderModal` 遇缺失 modal 函式時隱藏覆蓋層並清掉殘留狀態。實作：`src/js/ui-p1p2.js`、`src/js/ui.js`。
  - 回歸：`tests/unit-wulin.js` 19→25 項（新增 6 項接線檢查）；E2E 武林大會 12 項（低等級進全屏無空白 modal、只顯示「未滿 70 級」鎖定訊息且無開始按鈕、可回主城；Lv70 開賽 → 淘汰賽 → 出戰 → 結算 → 戰報＋1 → 重播 →「重播結束」→ 返回），三環境全過。
- 關卡小兵數量增加（Tomas 2026-11-09：每關敵方小兵太少，貼近原版人海；D 級設計）：
  - `src/data/stages.json` 為手寫檔（`tools/build-data.js` 只打包），72 關敵人總數 499→556（＋57，僅新增、未動既有敵人／首領／掉落／獎勵；新增小兵沿用該章 pool 輪替、等級＝關卡 lv、空位依 [1,4,7,0,3,6,2,5,8] 填入、首領固定 cell 4）。新梯度：第 1 章普通 [4,4,5,5,5]、菁英 6、首領 7、隱藏 7；第 2 章普通 [5,5,6,6,6]、菁英 7、首領 7、隱藏 7；第 3 章普通 [6,6,7,7,7]、菁英 8、首領 8、隱藏 8；第 4 章普通 7、菁英 8、首領 8、隱藏 8；第 5 章普通 8、菁英 9、首領 9、隱藏 9；第 6–8 章普通 9、菁英／首領／隱藏 9（每方 9 格上限）。
  - 平衡（`tools/balance.js`，12／40 顆種子前後對照）：典型玩家（typ）除 s1_4 菁英 92.5% 外皆 100%；弱勢模型（weak3）s1_8 68%（原 38%，敵人變多使範圍技更有效）、s1_9 85%（選打隱藏關）、其餘 ≥95%；最弱模型（min3，白將無裝備技能 Lv1）約 10 關勝率下降、min3＝0 的關數 31→33——接受：min 模型原本就已 31／72 關打不過、勝場多為血量比僵持，且實機有連敗士氣補償（每連敗 ＋8% 血／攻、上限 ＋80%，模擬器未建模）；小兵等級不調整。s1_1 新手隊 40 顆種子 40／40 勝（原 3 名敵人時亦 40／40），平均回合 4.2→5.1。
  - 黃金 fixture：`tests/golden-run.js` 對 s1_1／s1_2／s1_3 的固定種子戰鬥雜湊全事件流，改數量後 v9–v14 六檔皆只變 5 場 stage run（事件數變多、仍全勝，例 s1_1 84→137 事件），mix run 與被動不變；已按 repo 機制重生（v9–v11 腳本、v12–v14 經 `node tests/unit-wrap12.js --write-golden`），每檔恰 20 行差異。新增 `tests/unit-stages.js` 7 項（72 關數量符合梯度、cell 唯一且 0–8、種類屬該章 pool、首領關恰 1 名 leader、總數 556、s1_1 新手隊 10／10 固定種子勝）。
- 全身動作攻擊動畫（Tomas 2026-11-09 實機回饋：揮刀／出拳動作仍太不明顯，批准全身動作版；D 級原創——武將立繪是單張點陣圖，無手臂／武器分層可關節化，只能對整個立繪做全身變換）：
  - 揮刀：蓄力後仰 -18px＋傾斜 -5°（約 120ms，1x）→ 向目標前衝約 20–30px、身體轉 12°（B 方鏡像 `scaleX(-1)`）→ 200px 雙弧刀光（主弧＋殘影弧，白金亮色雙層光暈）落在攻擊者與目標中點、隨速度縮放（500／250／125ms）→ 回位。受擊：目標後仰 -20px＋傾斜 -3°（無雙 -30px／-6°）＋目標處 120px 命中閃光。
  - 出拳：蓄力後仰 → 向目標前頂 22px（`atk-thrust`／`atk-hit`，無轉身）；60px 拳影從攻擊者飛向目標（`T(220)`ms）→ 抵達時 160px 拳爆（光球＋擴張衝擊環）。
  - 氣功：抬手蓄力（上移 -8px＋後仰）→ 前推 14px（`atk-raise`／`atk-cast`）；聚氣光球 80→120px；投射光球 40→52px，飛行時間改隨速度縮放（`T(300)`ms，原寫死 .3s）→ 抵達時在目標處爆開（`.hitflash`）。
  - 命中頓停：命中瞬間在 `#bt` 加 `.hitstop`（CSS 暫停 `.bfig`／`.atkfx`／`.spark`／`.skfx`／`.orb`／`.ftxt` 動畫），60／30／15ms（1x／2x／4x），傷害仍經原 `applyEv` 結算、數值與事件順序不變；治療與省電模式不頓停。跳過戰鬥中途按下時攻擊者仍回位（還原排在 `BT.done` 檢查之前）。
  - 安全：省電模式（`UI.lowFx()`）下不產生新特效（隱藏 `.hitflash`／`.fistfly`／`.fistburst`、取消刀光光暈與前衝轉身，僅保留原有前衝位移）；無雙演出開關獨立；治療跳過攻擊動畫；每行動最多觸發一次；傷害／怒氣／回合／棋盤狀態不變；存檔版本維持 v12（無新存檔欄位、無新設定）。實作：`src/js/ui-battle.js`（`ATK_SPEC`、`UI._atkDur`／`UI._hitstopMs`／`UI._atkDir`、`attackAnim`／`bodyThrust`／`impactFlash`、step() 命中頓停）、`src/css/style.css`（`.atkfx` 200px、`.hitflash`、`.hitstop`、`.bu.windup`／`.lunge`／`.atk-*`、加大後仰）；身體動作對應表記於 `attackAnim` 上方註解。
  - 回歸（WebKit E2E 曾中斷）：`impactFlash` 每擊呼叫 `shake(false)`，會讓整個 `#bt`（含跳過按鈕）每擊震動 0.3s，忙碌戰鬥中 Playwright 等不到按鈕穩定、WebKit「戰鬥失敗」段 bSkip 點擊 30 秒逾時（80 通過後中斷）；已修為全屏震動只留給暴擊／無雙／重踏（原有行為），目標處閃光與翻身不變，`tests/unit-atkfx.js` 新增 2 項回歸檢查（`impactFlash` 本體不含 `shake(`、全檔 `shake(` 恰 5 處：定義＋內部正則＋3 處呼叫），重跑後三環境全過。
  - 測試：`tests/unit-atkfx.js` 55→57 項（規格表、時長等比 1x／2x／4x＝380／190／95ms、頓停 60／30／15ms、方向、省電抑制、還原、雙弧／拳影／光球、CSS 尺寸與低電抑制）；E2E 9 項（時長與頓停等比、方向、特效出現、取樣全身動作、頓停出現、省電開啟／不新增特效／切回、結算後回位），三環境全過。
- 驗收：29 組單元測試 3,970／3,970（VID-2 3,900＋unit-wulin 6＋unit-atkfx 57＋unit-stages 7＝3,970；`sh tools/runtests.sh` exit 0）；E2E **522／522**（Chromium 桌機、WebKit iPhone 13、Chromium 橫向手機各 174，新增武林大會 12＋全身動作 9 項）；ES5 全過（54 個 inline script）；單檔 `dist/mengjiang.html` 11,855,789 bytes（建置 20261109-0510-8e450778，md5 `06a6589d8a73720e116aacd49ef9e864`，上限 12,000,000）。存檔版本不變（v12）。
- 未完成／保持原樣：QA-1 真機測試未做（Tomas 尚未回報）；ART-5 剩餘；P4-7 不做（記錄）；神兵坊幸運值／好友祝福不實作。優先：高；已完成。

### WL-2 單檔上限 20MB、ART-5 完成、無雙改名、D 級升級、平衡微調、虛空之門擴充（已完成，2026-11-09，Tomas 決定）

- 單檔上限 12MB → 20MB：`tools/build.js:55` 檢查改為 20,000,000（錯誤訊息同步更新）；`tests/unit-atkfx.js:91` 斷言改為 < 20,000,000；TODO 規則 5、README 說明同步更新。
- ART-5 完成：盤點再驗證——88 位可玩武將早已全套立繪／頭像／cut-in（85 位直有 `h_*`、3 位 artAlias 沿用同人首領圖，0 缺圖；TODO 原稱「87 位待重繪」已過時）；9 棟主城建築 `k_*` 齊全；剩餘缺口是 12 名具名敵方共用通用／他人立繪。本輪為 12 人各產獨立 `b_*` 立繪＋頭像＋cut-in（36 檔 WebP：b_zhangbao、b_zhangliang、b_nanhua、b_qiuqianren、b_yanglianting、b_huodu、b_ouyangke、b_lijue、b_caoren、b_daerba、b_menge、b_hebiweng；圖像生成工具產洋紅底原稿 → `FIG_H=360 Q=60 tools/art_process.py` → `CI=256 CIQ=58 tools/ci_process.py`；無原版立繪截圖可對照，皆為風格一致原創，**D 級**，原稿 sha256 見 `docs/美術素材來源.md`、`src/assets/provenance-hashes.txt`；對應改 `src/js/assets-map.js` E 表 12 項）。音樂：15 個畫面原有 6 個無專屬曲（forge、hall、jxl、shanggu、shengsijie、wulin 回退主城曲），本輪於 `src/js/audio.js` 新增 6 首 WebAudio 合成曲目＋`SCENE_OF` 對應，0 音檔、0 體積增加。驗收：`tests/unit-art5.js` 767 項（12 新圖齊全且不共用、63 敵方 key 立繪＋頭像齊全、每張被用到的 b_/g_ 圖有 cut-in、88 武將全套、meta.json 無殘留、15 畫面皆有專屬曲且 6 新曲旋律互異且異於主城曲）。單檔 11,855,789 → 12,452,791 bytes（＋597,002；ART-5 新圖約 ＋589 KB，資料約 ＋8 KB），其後補 21 條考證條目（gate2／美術）再 ＋13,768 → 最終 12,466,559 bytes（建置 20261109-1122-e3c9b8a0），仍遠低於 20,000,000 上限。
- 無雙改名（宣傳片 A 級名）：貂蟬「千秋萬載」→「千秋蓮舞」、孫尚香「梟姬亂箭」→「美人計」、王語嫣「口吐蓮花」→「滅絕劍法」（`src/data/heroes.json`、`src/js/ui-battle.js` ULT_FX 鍵同步更新；`docs/資料考證.md` §18、`docs/附錄-資料表.md` 3 列更新；衝突 VID2-NAMES 已解決）。**新問題：大喬無雙原本就叫「千秋蓮舞」，改名後與貂蟬重名**（ULT_FX 以名為鍵，兩者皆 petal 特效，功能正常，僅顯示重複）；不擅自擴大範圍，建議後續將大喬無雙改名（D 級），待 Tomas 決定。
- D 級升級（詳見 `docs/資料考證.md` §19）：考證表 263 → 290 條（D 111 → 124、B 58 → 71、A 16 → 17、C 78 不變；D→B/A 升級使 D 減 8，另新增 gate2.* 9 條＋art.b_* 12 條 D 條目使 D 增 21）。升級 8 條 D→B（息怒 −20→−30，連斬 20%、回斬 15%、熱血 +5%、吸血 12%/10%、化解 30% 偷 10、破咒 30%、`skill.values` 改指 `web2.passive.values`；其中回斬／熱血／吸血三條舊 D 文字本身就是錯的，實作值本來正確，僅訂正文字）；奪魂機率 12% 升 A（Lv5 截圖），回合數維持 2（新衝突 K-N2，待確認）；小昭「聖火令」→「梵天之舞」、劉備「仁德」→「施仁天下」（A，W282 截圖；倍率不動）；上古寶窟分階清單／掉落種類／隱藏機制／圖騰／通天塔碎片數拆條升 B（S1 全文新取回；一般通關亦掉玉璧、種子為 B，現行獎勵無此二項，缺漏待補）；陣法固定值證據升 A（W4892／W77 截圖：八卦 Lv11 +1453 等），**僅記證據、未改模型**（本作仍用百分比；改固定值模型與 9 人上陣問題待後續決定）。新衝突 K-N1（已解決）、K-N2（部分解決）、K-N3／K-N4（已解決）、K-N6（15 級 4 人 vs S1 暗示 15 級仍 3 人，待 Tomas 裁決）；K12 補註（W282 坐實往昔若凝為紫雲無雙；紫霞無雙名無來源，維持 D，遊戲內暫沿用舊名顯示）。維持 D（查過、找不到）：招募機率、連攜效果數值、攻擊範圍／換列／揮空／改招規則、陣法保存規則、其餘 13 名新武將無雙名與全部主動技名／外觀、10 名查無來源武將、主角升階 20／60／90 與銀費／倍率、上古每階敵人數／袋數／金幣／袋內容、忍耐 +15／清心 30%／焚心觸發機率／飄忽 +5%／不死每場 1 次、高級禦敵等 6 項數值、27 筆 `web2.range.hero.*`。
- 息怒改值連帶：`src/js/battle.js` 引擎值 20→30（兩處）；黃金 fixture 7 檔（v6、v9、v10、v11、v12、v13、v14）按 repo 機制重生——僅 5 場 mix 戰鬥雜湊變動（皆含息怒武將；勝負不變、事件數僅 ±1），s1 場次全數不變。`node tests/unit-wrap.js --write-golden`（v11）、`node tests/unit-wrap12.js --write-golden`（v12／v13／v14），v6／v9／v10 以 `tests/golden-run.js` 同格式重寫。
- 平衡（`tools/balance.js` 24 種子、`tools/progress-sim.js` 30 天；**量測後決定不改數值**）：典型玩家（typ）90 關全 100%；弱勢（weak3）僅 s1_8 63%、s1_9 83% 其餘 100%；最弱（min3）0 勝 52／90（WL-1 為 33／72；新增 18 關 ch9／ch10 皆為 min3 零勝，另 ＋3 關來自息怒 −30 的來源修正——min3 為零養成底線模型，屬設計預期，不以此為由削弱敵人）。通天塔 100F 弱勢 75%；無極 w1–w3 第 36–40 波 ＋4 級勝率 0%（硬牆，設計預期）。30 天模擬：標準第 30 天 Lv90、80／90 關、通天塔 100、勝 80 敗 133（**超時 0**、僵局判定 2）；快速第 14 天 Lv90、80／90、勝 80 敗 115（超時 0、僵局判定 1）；最長卡關 0 天、無硬牆。80／90 的天花板是既有「隱藏關需本章其餘 8 關全三星」門檻（10 關隱藏關皆未開，自動玩家無法全三星；非 WL-2 新問題）。曾 A/B 測試 s1_8 減 1 小兵：weak3 58%→50%（12 種子，±1 種子即 ±8.3%，屬量測雜訊），證實單兵調整無法量測，故不改。**未改任何平衡數值。**
- 虛空之門擴充（D 級合理設計，無來源，Tomas 授權）：`src/data/stages.json` 純新增 ch9 雁門關（Lv60–69）＋ ch10 長安（Lv69–78），各 9 關，8 章 72 關 → 10 章 90 關；每關 9 名敵人（9 格上限），普通關無首領、菁英／首領／隱藏關恰 1 名首領（首領等級＝關卡 lv＋1、固定 cell 4，小兵等級＝關卡 lv）；敵人沿用既有章 pool＋菁英／首領武將（ch9 精英達爾巴／李傕、首領蒙哥、隱藏呂布；ch10 精英張遼／曹仁、首領曹操、隱藏司馬懿；獎勵／經驗／銀幣按 ch8 比例放大，首通獎勵沿用既有模式）；解鎖鏈：ch9 需通關 s8_8（章節 Lv60）、ch10 需通關 s9_8（章節 Lv69）、隱藏關需本章其餘 8 關全三星（與既有規則一致）。存檔相容：純新增，v12 舊存檔照常載入（`tests/unit-gate2.js` 含舊存檔 fixture 測試）。測試：新增 `tests/unit-gate2.js` 35 項（章／關數量、cell 唯一且 0–8、解鎖鏈、等級遞進、獎勵遞增、舊存檔相容、地圖 UI vols＝3 卷自動容納）；`tests/unit-stages.js` 更新為 90 關、總數 718（TARGETS 增 ch9／ch10 全 9 名）。
- **WL-1 遺留修正（本輪發現）**：WL-1 的小兵增加（499→556）只寫進 `data.generated.js`，`src/data/stages.json` 仍是 499——任何一次 `build-data` 重跑都會無聲地把 72 關打回 499。本輪把 57 名新增小兵（與 WL-1 生成檔逐關比對、敵人種類／cell／等級完全一致）補寫回 `stages.json`（ch1–8 總數 499→556，ch9／ch10 另 ＋162，合計 718），之後 `build-data` 可確定重現；並以 WL-1 生成檔為基準驗證 72 舊關敵人列表 0 差異。另 `tests/unit-stages.js` 的 72 關斷言改為 90 關。
- 驗收：單元測試 31 組 5,074／5,074（WL-1 29 組 3,970；新增 unit-art5 767 項與 unit-gate2 35 項；unit-prov 2,277→2,445 來自 21 條新考證條目；其餘為考證條目增加與既有測試隨資料成長；`sh tools/runtests.sh` exit 0；`tests/unit-gate2.js` 已加入 `tools/runtests.sh`）；E2E 546／546（三環境各 182／182，含新增 ch9 關卡 8 項×3；另補記：首版 ch9 案例因先前流程選過 gateCh=1、未經 gateBack 不歸零，重進地圖停在第 1 章關卡格而非地圖，導致 gateVol 按鈕逾時——已修正為重進前先清 `UI.sel.gateCh`／`gateVol`，並確認地圖預設卷由目前進度決定；最終建置重跑時 WebKit 連續兩次各 1 項時序檢查抖動——玄機盤確認 4 秒逾時、名牌淡化取樣未命中——兩項在重跑時皆通過，桌機每次皆 182／182，判定為 WebKit 時序抖動，非回歸）；ES5 全過（55 個 inline script，WL-1 為 54，＋1 來自 ART-5 新圖使 assets chunk 13→14）；單檔 `dist/mengjiang.html` 12,466,559 bytes（建置 20261109-1122-e3c9b8a0，md5 `ce792c906c2e98fc2576e3f8dd8d2ad3`，上限 20,000,000）。存檔版本不變（v12）。
- 未完成／待決定：大喬無雙重名（建議改名，待 Tomas 決定）；陣法固定值模型改版＋9 人上陣（待決定）；K-N6 15 級上陣人數（待 Tomas 裁決）；K-N2 奪魂回合數（2 vs 3，待確認）；上古寶窟玉璧／種子掉落缺漏（待補）；QA-1 真機測試未做（Tomas 尚未回報）；WL-2 單檔與 72 張敵方立繪已由 Tomas 於 2026-11-09 自行上傳（commit 01fd5880「WL-2」，經驗證與建置完全一致），但該次 Pages 部署 #48 在 deploy 步驟逾時失敗，主站暫留上一版部署 #47，待另一次成功部署才會更新；P4-7 不做（記錄）；神兵坊幸運值／好友祝福不實作。優先：高；已完成。

### WL-3 等級壓制改傷害遞減、通天塔／無極幻境自動接續＋跳過（已完成，2026-11-09，Tomas 決定）

- 任務 1：等級壓制改傷害遞減（D 級原創曲線，Tomas 2026-11-09 指示）。舊規則：目標等級 − 攻擊者等級 > 10 必定未命中（`src/js/battle.js` hurt()，B 級）。新規則：取消必定未命中，改傷害倍率，d ＝ 目標等級 − 攻擊者等級，d ≤ 10 倍率 1.0，d > 10 倍率 max(0.10, 1 − 0.05 × (d − 10))（d=11 → 0.95、d=20 → 0.50、d=28 以上鎖底 0.10）；門檻取 `config.levelSuppression`（=10，未寫死）。套用位置在 hurt() 傷害算完後、pv／npcCut 之後、skill.maxDamage 上限之前，dmg 至少為 1；命中判定（90%＋命中−閃避，最低 20%）不動。倍率 < 1 時 hit 事件加 `e.sup`（小數 2 位）；戰鬥 log 加註「（壓制 ×0.95）」，傷害浮字下方多飄一行小字「壓制 ×0.95」。FORMULA_NOTE（battle.js:6）改為新曲線說法，標 D、註明舊 B 級「必定未命中」已取代；`src/data/provenance.json` 新增 D 級條目 `battle.suppressionCurve`（290 → 291 條），舊規則原本只在 FORMULA_NOTE、provenance 無舊條目，故歷史脈絡寫在新條目 note。例外：v6 以前舊戰報重播仍走舊必定未命中（`B.run` 新增 `opt.oldSuppression`，僅 `src/js/sys4.js` arenaReplay／wulinReplay 在 `rec.v < 7` 時傳入；新戰鬥一律走遞減），否則 save-v6.json 兩場拜訪戰報重播回合數 4→3、consistent 變 false——repo 既有「舊戰報照舊規則重播」承諾（v10～v14 棋盤同例）。舊 `why === '等級壓制'` 的 miss 顯示分支保留，僅供舊戰報重播。
- 任務 1 測試：新增 `tests/unit-sup.js` 15 項（d≤10→1.0 無 e.sup；d=11→0.95；d=20→0.50；d=28／30→0.10 鎖底；d=40 仍 0.10 且有傷害；d=15 命中且傷害＝同種子 d=10 傷害 ×0.75；d=30、20 種子零「等級壓制」未命中；自訂 levelSuppression:5、d=8→0.85 證明門檻非寫死；oldSuppression 下 d=30 仍必定未命中／不傳則走遞減；FORMULA_NOTE 與 config 檢查）。Golden fixtures 零個重生：6 檔（v6、v10、v11、v12、v13、v14）對照全部 UNCHANGED——golden 戰鬥皆無等差 >10 的攻擊，曲線一次也沒觸發。
- 任務 1 平衡量測（`tools/balance.js` 12 種子、`tools/progress-sim.js` 30 天；**未改任何平衡數值**，基線與改動後存檔見 `docs/balance-wl3-before/after.txt/.json`、`docs/progress-sim-wl3-before/after.txt/.json`）：主線 typ 仍 90／90 關 100%，typ+5／weak+3／min+3 完全相同；通天塔、拜訪武將 typ 全部 100% 不變；變動集中在無極幻境：typ <100% 波數 47／120 → **13／120**，硬牆 15 條 → **0 條**（w2／w3 第 26～40 波 typ 由 0% → 100%，w1 第 25～33 波亦大幅上升；舊規則下高波敵方等級遠高於玩家、攻擊全數未命中，新曲線下仍能造成 10%～50% 傷害）。30 天模擬標準：終點不變（Lv90、80／90 關、通天塔 100、武將 32），勝 80／敗 133 → **63**，超時 0、僵局 2 → **0**，最長卡關 0 → 1 天（s10_1 潼關 Lv69，仍無硬牆）；加速 14 天：勝 80／敗 115 → **71**，超時 0 → **1**、僵局 1 → **3**（皆單一場次；敗場減少的副作用：以前「打不中就速敗」的戰鬥現在拖長，偶爾觸到 36 回合超時／8 回合僵局判定）。
- 任務 2：通天塔與無極幻境自動接續＋跳過（Tomas 2026-11-09 決定）。邏輯（`src/js/sys3.js`，不動存檔）：`G.towerAutoNext(r)`（塔勝利且未登頂才接續）、`G.wujiAutoNext(r)`（無極勝利且未播完最後一波才接續）、`G.towerSkip(maxFloors)`（從目前 best 起連續呼叫 `G.towerFight()` 直到戰敗／登頂／失敗，獎勵由 towerFight 內按首次登層發放、本函式只彙總不重發，安全上限預設 100 層，已登頂起手即拒絕）、`G.wujiSummary(run)`（只從已算好的 wujiRun 結果彙總，不重算、不重發，含 waveWins 供與 cleared 比對）。UI（`src/js/ui-p3.js`、`src/js/ui-battle.js`、`src/css/style.css`）：自動接續預設開（`UI.autoContinue = {tower:true, wuji:true}` 執行期狀態，不寫入存檔），結算出現後約 1.2 秒（`UI.AUTO_DELAY = 1200`）自動開下一層／下一波，期間顯示「即將挑戰下一層…／即將播放下一波…」與「停止」鈕（按停止＝清計時、關掉該模式自動接續、停在結算畫面，可再手動點下一層／返回）；塔／無極畫面各有「自動接續：開／關」切換鈕（無極的開關放在底部註解列，因三欄卡片為絕對定位、放說明區會被蓋住點不到）；自動接續走現有 `UI.actions.bTower('1')`／`UI.actions.wjNext()` 路徑。跳過：戰鬥重播右下加「跳過全部」鈕（只在塔／無極出現，`bSkipAll`；塔＝本層已打完，直接連打到戰敗或登頂再看總結；無極＝直接跳到總結），結算畫面塔加「跳過剩餘層數」（`twSkipAll` → `UI.towerSkipRun` 彙總本層＋`G.towerSkip` → `UI.towerSkipSummary` 顯示「從第 X 層打到第 Y 層、本輪共打 N 層、本輪拿到獎勵」），無極結算沿用現有「略過，看結算」（`wjSum` → `UI.modeResult(b.r, true)`）。startBattle、手動下一層／下一波／返回／回主城都會清掉待發的自動接續計時，避免重複開戰。文案：`wj-tip` 與塔畫面提示皆寫明自動接續（約 1.2 秒、按停止中斷）與跳過。
- 任務 2 測試：`tests/unit-p3.js` 新增一段 18 項（塔自動接續判定勝／登頂／敗、跳過上限 3 層、強隊跳過登頂 97 層與逐層打獎勵／銀／金／星魂／戰鬥場次完全一致、弱隊跳過在第 60 層戰敗停下、已登頂跳過被拒、無極自動接續判定首波／末波／敗、跳過總結與逐波 run 一致 40 波／將魂 8／首次獎勵保留、自動接續 39 步走到末波不卡住、弱隊總結波數＝逐波勝場數；附註：一般滿級隊伍 Lv80／90 無裝備在第 50 層王關會戰敗，測登頂路徑用培養拉滿的 7 人測試隊，僅為驗證迴圈與獎勵一致性）。E2E（`tests/e2e.js`）：既有塔／無極段落改為結算後先按「停止」再走原手動流程（否則自動接續會搶在舊斷言前開下一層）；新增塔與無極各一段自動接續＋跳過流程（waitForFunction 等狀態變化，不寫死短 timeout）。
- 驗收：建置 `20261109-2135-1e38396b`（我獨立重建驗證；實作建置為 20261109-1329-1e38396b，同一原始碼，僅時間戳不同），單檔 `dist/mengjiang.html` 12,474,511 bytes（md5 `43f66d30f783645d21193fc241f6dd37`，上限 20,000,000）；單元測試 32 組 **5,115／5,115**（`sh tools/runtests.sh` exit 0；WL-2 為 31 組 5,074，新增 unit-sup 15 項與 unit-p3 18 項，其餘為既有測試隨資料成長）；E2E Chromium 桌機 1280x800 **195／195**、Chromium 手機橫向 844x390 **195／195**（合計 390／390；新流程實測：塔自動進第 3 層、跳過總結打到第 14 層（桌機）／第 9 層（手機），無極自動播到第 2 波、跳過到總結）；ES5 全過（55 個 inline script）；存檔版本不變（v12）。WebKit iPhone 13 已於 2026-11-09 23:09 補驗通過 **195／195**（見下「修正版」）。
- 修正版（2026-11-09 晚，建置 `20261109-2227-6c6d83c6`，單檔 12,474,555 bytes，md5 `14170dadc96d3ee0d226605a8977a146`）：自動接續延遲 1.2 秒 → 3 秒（`UI.AUTO_DELAY`，`src/js/ui-p3.js:29`；WebKit 排版穩定時間比 1.2 秒長，點「停止」會因元素脫離 DOM 超時；文案「約 1.2 秒」→「約 3 秒」，`tests/e2e.js` 同步）；showResult 競態修正（`src/js/ui-battle.js`：`finish()` 的 300ms 後呼叫只在 `BT` 未變時執行（`if (BT === bt)`），`showResult()` 開頭加 `if (!BT) return;`——在該視窗內離開戰鬥會讓 `BT.r` 讀空指標，WebKit 上重現「null is not an object (evaluating 'BT.r')」並修復）。驗證：單元 5,115／5,115、ES5 全過、Chromium 桌機 195／195、WebKit iPhone 13 **195／195**（2026-11-09 23:09；先前三次 WebKit 載入超時是 VM 忙碌造成，非遊戲問題；另一次 runtime restart 清掉 apt 裝的 WebKit 系統依賴，runtime 自身 package restore 已補回）。本修正版未單獨推，與 WL-4 一起推（Tomas 2026-11-09 決定，單檔只傳一次）。
- 未完成／待決定：「停止」鈕語義——目前實作是「停止自動接續、停在結算畫面」，若 Tomas 預期按停止就直接回塔畫面，請再定；舊戰報是否也應跟新遞減規則（目前 v6 以前重播仍用舊必定未命中）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高；已完成，2026-11-09 與 WL-4 一起推上線（見 §WL-4）。

### WL-4 首領詞綴（已完成，2026-11-09，Tomas 決定）

- 設計（D 級原創，Tomas 2026-11-09 指示：首領詞綴先做——改動最小、只動王關、戰前可見、可直接量測）。王關／隱藏關的首領每場帶一個詞綴，詞綴池 5 個：嗜血（吸血 10%）、荊棘（反彈所受傷害 15%）、疾風（敏捷 +30%、先手）、堅岩（物防法防 +20%）、狂怒（血量低於 50% 時攻擊 +15%）。詞綴由戰鬥種子派生（`B.pickAffix`，獨立亂數流，不消耗戰鬥亂數；同一種子同一關詞綴相同；禁用 Math.random），重播不變。關卡面板（出戰視窗）戰前顯示「首領詞綴：名（效果）」，開面板即固定下一戰種子，顯示與實戰同一詞綴；戰鬥中首領頭像旁加詞綴標籤，開場戰鬥 log 顯示「詞綴·某名」。普通關與精英關不上詞綴（精英關首領雖也是 boss 模板，但只認關卡 kind 為 boss／hidden）。詞綴只影響首領本人，不影響小兵；不寫入存檔（由種子派生，存檔 v12 不動）。狂暴由直接賦值改為累加，才能與狂怒疊加（<30% 時合計 +35%）。疾風的先手為行動順序最前（本作行動順序本來只看站位，敏捷不影響順序），且絕技攻防一併 +30%（否則敏捷在戰鬥中不起作用）。`src/data/provenance.json` 新增 D 級條目 `boss.affix`（291 → 292 條）。
- 實作檔案：`src/js/battle.js`（詞綴表 `B.AFFIXES`、`B.pickAffix`、吸血／反彈／狂怒／疾風先手鉤子、狂暴改累加）、`src/js/game.js`（待用種子 `G.pendingSeed`、`G.stageAffix`、`G.applyStageAffix`，`forcedId` 僅供測試與量測）、`src/js/ui-gate.js`（關卡面板戰前顯示）、`src/js/ui-battle.js`（首領頭像旁詞綴標籤、開場 log）、`src/css/style.css`（`.affix-tag`、`.sp-r.row.affix`）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生）、`tools/balance.js`（新增第 5 節「首領詞綴」量測，不改既有量測與數值）、`docs/balance-wl4-affix.txt/.json`（本輪量測存檔）。
- 測試：新增 `tests/unit-affix.js` 59 項（各詞綴效果、種子決定性、非王關不上詞綴、顯示標籤；`tools/runtests.sh` 加入 unit-affix）。
- 平衡量測（`tools/balance.js` 第 5 節，20 個王關／隱藏關，一般隊@關卡等級／弱勢隊@+3，各 12 種子；「無詞綴」對照為同一進程、同一種子、同一模型重測）：一般隊 20 關 × 5 詞綴全部 100%，與無詞綴基線完全相同。弱勢隊只有前 4 關有變化：s1_8 廣宗決戰 Lv8 基線 58% → 嗜血 42%、荊棘 17%、疾風 17%、堅岩 50%、狂怒 25%（平均約 30%）；s1_9 南華仙洞 Lv10 基線 75% → 平均 70%（荊棘／疾風 83% 高於基線是 12 種子雜訊，僅 1 顆種子之差）；s2_8 僅嗜血 92%、其餘 100%；s2_9 嗜血／荊棘／狂怒 92%、其餘 100%。s3_8 起全部 100%、毫無影響。**無新增硬牆**。
- 決定：s1_8 弱勢隊勝率掉較多（58% → 平均約 30%，荊棘／疾風 17%），Tomas 2026-11-09 23:17 接受原樣（s1_8 本來就是第一道真牆，實戰另有越戰越勇連敗加成與超前練級可補）。
- 驗收：建置 `20261109-2313-5afd0b6c`（我獨立重建驗證），單檔 `dist/mengjiang.html` 12,479,429 bytes（md5 `eaecbdd2bf43477947141559362b4de3`，上限 20,000,000）；單元測試 33 組 **5,182／5,182**（`sh tools/runtests.sh` exit 0；新增 unit-affix 59 項）；E2E `node tests/e2e.js all` **585／585**（Chromium 桌機 195／195、WebKit iPhone 13 195／195、Chromium 手機橫向 195／195）；ES5 全過（55 個 inline script）；存檔版本不變（v12）。與 WL-3 修正版一起推上線，單檔只傳一次（Tomas 手動上傳）。
- 未完成／待決定：限回合挑戰（見 §WL-5）、增援波次、隨機敵方組合（見 §WL-6）、關卡內隨機事件、章節地形、無雙封印關、場地道具實裝（Tomas 2026-11-09 22:30 確認的順序，依序做）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高。

### WL-5 限回合挑戰（已完成，2026-11-10，Tomas 決定）

- 設計（D 級原創，Tomas 2026-11-09 指示：限回合挑戰第二做——零平衡風險、給老玩家重打舊關的理由）。只開放給已通關的關卡（重打舊關的挑戰模式，不影響首次通關流程與進度）。挑戰條件：12 回合內打贏（`G.CHALLENGE.rounds = 12`，用 `Battle.run` 現有的 maxRounds 參數）。獎勵：銀幣 +50%（以該關正常銀幣獎勵為基數）；首次挑戰成功另給金幣 +5（每關只領一次）；整場我方無人陣亡且挑戰成功，多一次將魂掉落判定（沿用戰鬥種子亂數流）。關卡面板（出戰視窗）戰前寫明挑戰規則（12 回合限制）與獎勵（銀幣 +50%、首通金幣 +5、無死亡多一次將魂掉落）與挑戰狀態（已完成／尚未完成），未通關關卡完全不顯示挑戰區塊。12 回合內未打贏或全滅＝挑戰失敗，不影響通關紀錄（clears／stars 不動）、不加連敗、不給越戰越勇，結算寫明。挑戰勝利仍計通關次數與星級（可補三星）；獎勵結算時一次發放。挑戰也吃越戰越勇加成（沿用既有 code path；該關已通關時 fails 通常已是 0，實務上幾乎不觸發）；經驗照常給。王關挑戰同時帶 WL-4 詞綴（詞綴是關卡本身的屬性）；「再戰一次」會重打同一模式。`src/data/provenance.json` 新增 D 級條目 `mode.limitedRounds`（292 → 293 條）。
- 實作檔案：`src/js/game.js`（挑戰核心 `G.CHALLENGE`、`G.challengeState`、`G.extraSoulDrop`、`G.fight` challenge 分支；`newGame` 存檔加 `chal: {}`）、`src/js/state.js`（`applyDefaults` 補齊 `chal: {}`，舊存檔加法性相容）、`src/js/ui-gate.js`（出戰視窗挑戰區塊與入口按鈕）、`src/js/ui-battle.js`（`startChallenge` 動作、結算挑戰勝／敗文案、超時文案改用該場實際回合上限 `r.maxRounds`）、`src/css/style.css`（`.sp-r .row.chal`、`.rbody .chal`）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生）、`tools/balance.js`（新增第 6 節「限回合挑戰」量測）、`docs/balance-wl5-challenge.txt/.json`（本輪量測存檔）。
- 測試：新增 `tests/unit-challenge.js` 60 項（挑戰條件判定、獎勵計算、首通金幣只領一次、無死亡多一次掉落判定、非已通關關卡不開放、12 回合到時未打贏判挑戰失敗且不影響通關紀錄、種子決定性）。
- 平衡量測（`tools/balance.js` 第 6 節，12 種子；基線與 `docs/balance-wl4-affix.txt` 完全相同）：**零平衡風險得證**——既有量測第 1～5 節（主線／通天塔／無極幻境／拜訪武將／首領詞綴）與基線逐字相同，硬牆仍為「無」；`Battle.run` 本體完全未改。挑戰模式代表關卡 12 回合內打贏（一般隊@關卡等級／弱勢隊@+3；括號為同一批種子、同一隊伍的 36 回合基線）：一般隊全部 100%；弱勢隊只在前兩章王關收緊（s1_8 33%（基線 58%）、s2_8 58%（基線 100%）），s3_8 起全部 100%。附註：挑戰量測用不帶詞綴的基礎關卡（只隔離「12 回合」一個變數）；實戰中王關挑戰另帶 WL-4 詞綴，s1_8／s2_8 弱勢隊挑戰勝率實際會再低一些。
- 決定：王關挑戰同時帶詞綴（s1_8 弱勢隊挑戰勝率實戰會比量測的 33% 再低）、挑戰銀幣 +50% 與 econ 倍率相乘（與一般獎勵同一公式）——維持現狀上線，若 Tomas 想要再改。
- 驗收：建置 `20261110-0002-96ab3f98`（我獨立重建驗證），單檔 `dist/mengjiang.html` 12,483,652 bytes；單元測試 34 組 **5,250／5,250**（`sh tools/runtests.sh` exit 0；新增 unit-challenge 60 項）；ES5 全過（55 個 inline script）；存檔版本不變（v12，`chal` 為加法性欄位，刪除 `chal` 的舊存檔仍可讀取）。未單獨跑完整 E2E 與單獨推，與 WL-6 合併建置一起驗、合併一次推上線（Tomas 2026-11-09 23:54 指示，單檔只傳一次）。
- 未完成／待決定：增援波次、隨機敵方組合（見 §WL-6）；關卡內隨機事件、章節地形、無雙封印關、場地道具實裝（Tomas 2026-11-09 22:30 確認的順序，依序做）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高。

### WL-6 增援波次＋隨機敵方組合（已完成，2026-11-10，Tomas 決定）

- 設計（D 級原創，Tomas 2026-11-09 指示：增援波次第三、隨機敵方組合第四，2026-11-09 23:54 指示合併一輪做好並上線）。
- 增援波次：王關／隱藏關的首領血量首次低於 50% 時觸發一次（每場最多一次），2 名同章小兵加入戰場，進場時飄字「敵軍增援！」。滿編空格處理：觸發本身不看空格——首領首次低於 50% 即記下待命（`reinPending`），之後每當敵方小兵陣亡空出格子就立即補進，直到補滿 2 名或戰鬥結束；戰鬥結束前始終沒有空格，增援就不出現（不丟失、不重觸發）。增援小兵種類由戰鬥種子派生（禁用 Math.random），不上詞綴（詞綴只給首領本人）。增援進場位置：大棋盤以後排優先（bx 7→6→5，由上而下），3×3 棋盤順序 [2,5,8,1,4,7,0,3,6]。增援寫進戰報重播：沿用現有 sys4.js 格式，增援是 `B.run` 事件流裡的 `reinforce` 事件（含單位鍵、名字、等級、血量、cell／br／bx），重播同一組輸入即重現同一時間、同一位置、同一小兵；增援小兵鍵值唯一（`B<cell>r<n>`）。關卡面板戰前寫明「首領血量首次低於 50% 時，2 名同章小兵加入戰場（滿編時待命，空出格子即補進）」。
- 隨機敵方組合：精英關／王關／隱藏關的小兵組合由戰鬥種子重抽（首領固定不變），同一種小兵最多 3 名（避免 9 名全同一種）；小兵池為同一章的小兵種類（第 1 章 3 種、第 2～10 章各 3～4 種，取自 stages.json／heroes 資料）。關卡面板直接顯示本次抽出的小兵組合（與實戰同一顆種子，開面板即固定）；抽取與增援各用獨立亂數流（種子 XOR 不同常數），與戰鬥亂數流互不干擾。普通關不重抽。
- 兩項交互：王關挑戰（WL-5）＋詞綴（WL-4）＋增援＋隨機組合可同時出現在一場戰鬥；增援小兵不上詞綴。`src/data/provenance.json` 新增 D 級條目 `battle.reinforce`、`battle.randomFoes`（293 → 295 條）。
- 實作檔案：`src/js/battle.js`（增援引擎：觸發、待命、補進、戰報事件）、`src/js/game.js`（`G.drawFoes`、`G.drawReinforce`、`G.stageFoes`、`G.fight` 接線：王／隱藏關帶增援，精英關只有隨機組合）、`src/js/ui-gate.js`（面板改用 `G.stageFoes` 顯示，加「敵方組合：隨機（本次小兵：X×n、Y×n）」與增援兩列）、`src/js/ui-battle.js`（增援事件播放、`finish()` 先從結果回填單位以便跳過結算時血量總數正確）、`src/css/style.css`（`.row.rand` 藍、`.row.reinf` 紅）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生）、`tools/balance.js`（新增第 7 節 `winRateFull`，隨機／增援／疊加四組對照＋s1_8 全疊加）、`docs/balance-wl6-reinforce-random.txt/.json`（本輪量測存檔）。
- 測試：新增 `tests/unit-wl6.js` 72 項（增援觸發、待命、重播、隨機組合、面板、畫面、詞綴／挑戰交互、存檔、provenance）；`tests/unit-affix.js:192`、`tests/unit-challenge.js:120` 僅改考證總數斷言 293 → 295。
- 平衡量測（`tools/balance.js` 第 7 節，12 種子，一般隊@關卡等級／弱勢隊@+3，36 回合）：第 1～6 節與 WL-5 基線逐字完全相同。一般隊：40 個精英／王／隱藏關，四種變體（基線／隨機／增援／疊加）全部 100%，零變化。弱勢隊只有 4 關有變化：s1_8 廣宗決戰基線 58% → 隨機 42% → 增援 33% → 疊加 **17%**；s1_9 基線 75% → 疊加 67%（隨機、增援單獨皆 75%）；s2_8 基線 100% → 隨機 92% → 增援 100% → 疊加 100%；其餘 36 關四種變體皆 100%。s1_8 全疊加（弱勢隊）：基線 58% → 詞綴平均 30% → 挑戰 12 回合 33% → 全疊加 36 回合 25% → **全疊加＋挑戰 12 回合 0%**；一般隊全疊加 36 回合 100%、12 回合 **92%**。附註：s1_8 弱勢隊全疊加挑戰 12 回合 0% 是「刻意養成不足的弱勢模型」打「第一道真牆」又疊加「自選的限回合挑戰」，一般隊同條件仍有 92%，36 回合弱勢隊也有 25%，且挑戰模式只開放已通關的關卡；未改任何數值，僅量測。
- 驗收：建置 `20261110-0024-049549ec`（我獨立重建驗證），單檔 `dist/mengjiang.html` 12,491,804 bytes（md5 `19a8a5b2d22aa635a183731f508ae26c`，上限 20,000,000）；單元測試 35 組 **5,338／5,338**（`sh tools/runtests.sh` exit 0；新增 unit-wl6 72 項）；E2E 合計 **585／585**（Chromium 桌機 195／195、Chromium 手機橫向 195／195，`node tests/e2e.js all`；WebKit iPhone 13 195／195 為單獨重跑——all run 中 WebKit 194／195，唯一失敗「最上排飄字期間淡化名牌」為時序抖動，該 ftop 邏輯與 WL-4 遠端版逐字相同、未被 WL-5／WL-6 動過，重跑全過；詳見 `docs/test-log-e2e.txt` 末段）；ES5 全過（55 個 inline script）；存檔版本不變（v12，無新增存檔欄位）。與 WL-5 合併一次推上線，單檔只傳一次（Tomas 手動上傳）。
- 未完成／待決定：關卡內隨機事件、章節地形、無雙封印關、場地道具實裝（Tomas 2026-11-09 22:30 確認的順序，依序做）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高。

### WL-7 ×2 挑戰模式（已完成，2026-11-10，Tomas 決定）

- 設計（D 級原創，Tomas 2026-11-10 08:10 決定：保留 WL-5 限回合挑戰，另外加一個 ×2 模式，給玩到後期／練很勤的玩家挑戰）。只開放給已通關的關卡（重打舊關的挑戰模式，不影響首次通關流程與進度）。敵方首領＋小兵全部 ×2（含隨機組合抽出的小兵與增援進場的小兵），回合數為正常 36 回合（**不是** 12 回合）。翻倍清單——翻：物攻／法攻／絕技攻、物防／法防／絕技防、血量、無雙固定傷害（ult.flat）；不翻：命中／閃避（敵人本來就是 0，且命中公式 90% + (命中−閃避)% 夾在 [20%,100%]，把差距翻倍會把雙方命中率一起推向上下限變成純運氣）、爆擊（王關 5、小兵 0，爆擊是機率不是攻防血）、敏捷（決定行動順序，翻倍會讓敵方幾乎每回合先手；敏捷衍生的絕技攻防已在翻倍清單裡）、等級（牽動等級壓制曲線與敵人成長曲線，翻倍無意義）、血條層數（血量 ×2 已把總血量翻倍）。王關的 ×2 與 WL-4 詞綴、WL-6 增援＋隨機組合疊加（先翻倍再套詞綴，詞綴百分比疊在翻倍後的數值上；增援小兵不上詞綴）。獎勵沿用限回合挑戰結構（銀幣 +50%、首次成功金幣 +5、無死亡多一次將魂掉落判定），不膨脹經濟。關卡面板戰前寫明規則（敵方攻防血全部 ×2、36 回合、詞綴／增援／隨機組合照常疊加）與獎勵與挑戰狀態（已完成／尚未完成），與限回合挑戰各自顯示、各自入口，未通關關卡兩個模式都不顯示。戰鬥中敵方頭像旁顯示 ×2 標籤、戰鬥標題顯示（×2 挑戰）、開場戰報事件寫「敵方數值 ×2」。挑戰失敗（36 回合內未打贏或全滅）不影響通關紀錄（clears／stars 不動）與越戰越勇計數（fails 不加）；挑戰勝利仍計通關次數與星級；「再戰一次」重複同一模式；限回合挑戰與 ×2 挑戰不能同時進行（`G.fight` 同時指定兩個模式會拒絕）。倍率是確定性乘法（Math.floor 取整），不吃亂數、不開新亂數流，沿用現有的待用種子機制；同一種子同一模式重打，勝負／回合／獎勵／戰鬥事件完全相同。`src/data/provenance.json` 新增 D 級條目 `mode.doubleChallenge`（295 → 296 條）。
- 實作檔案：`src/js/game.js`（`G.DOUBLE`、`G.doubleState`、`G.doubleUnit`、`G.fight` double 分支；`newGame` 存檔加 `chal2: {}`）、`src/js/state.js`（`applyDefaults` 補齊 `chal2: {}`，舊存檔加法性相容）、`src/js/battle.js`（開場戰報事件「敵方數值 ×2」，`opt.double`）、`src/js/ui-gate.js`（出戰視窗 ×2 區塊與入口按鈕 `startDouble`，與限回合挑戰並存）、`src/js/ui-battle.js`（`startDouble` 動作、戰鬥標題（×2 挑戰）、敵方頭像旁 ×2 標籤、結算 ×2 勝／敗文案、`bAgain` 重複 ×2 模式）、`src/css/style.css`（`.sp-r .row.dbl` 紫、`.dbl-tag`、`.rbody .dbl`）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生）、`tools/balance.js`（新增第 8 節「×2 挑戰」量測＋越級重打補充）、`docs/balance-wl7-double.txt/.json`（本輪量測存檔）。
- 測試：新增 `tests/unit-wl7.js` 87 項（倍率正確性：攻防血與無雙固定傷害 ×2、命中／閃避／爆擊／敏捷／等級／層數不動；命中率合理性：翻倍前後命中公式結果完全相同；隨機組合與增援也 ×2；只開放已通關關卡；兩模式不能同時進行；36 回合；失敗不影響通關紀錄與越戰越勇；獎勵銀幣 +50%／首通金幣 +5 只領一次／無死亡多一次將魂掉落；種子決定性與戰報寫明 ×2；存檔 v12 不變；面板兩模式並存；戰鬥標題與 ×2 標籤；結算勝／敗文案；再戰一次重複 ×2）；`tests/unit-affix.js:192`、`tests/unit-challenge.js:120`、`tests/unit-wl6.js:213` 僅改考證總數斷言 295 → 296。
- 平衡量測（`tools/balance.js` 第 8 節，12 種子，一般隊@關卡等級／弱勢隊@+3，36 回合）：第 1～7 節與 WL-6 基線逐字完全相同，零平衡風險得證（未改任何數值）。代表普通關 ×2：每章第一個普通關（s1_1、s3_1、s5_1、s8_1、s10_1）一般隊／弱勢隊全部 100%，×2 對普通關幾乎沒有威脅。精英／王／隱藏關 ×2（40 關）：一般隊第 3 章起全部 100%（除 s4_8 王關 75%、s2_8 王關 33%），第 1～2 章同級打不動（s1_4、s1_7、s1_8、s1_9、s2_4、s2_9 皆 0%，s2_7 83%）；弱勢隊 ×2 全部 10 個王關皆 0%，隱藏關只有 s6_9 50%、s7_9 58% 高於 0%，精英關第 7 章起才有 100%（s7_4、s7_7、s8_4、s8_7）。×2 再疊加隨機＋增援：一般隊第 3 章起仍多半 100%，s10_8／s10_9 掉到 92%；弱勢隊 s6_9 疊加 58%、s7_4 疊加 92%、s9_7 疊加 58%。s1_8 ×2 全疊加（×2＋詞綴＋隨機＋增援）：一般隊／弱勢隊皆 0%（基線 100%／58%）。附註：以上是「同級隊伍」打 ×2 的勝率——×2 的目標是後期玩家回頭重打舊關，越級重打補充量測：前三章王關（s1_8、s2_8、s3_8）一般隊只要高出 5 級，×2 勝率就是 100%，調校符合「回頭挑戰」的定位；同級 0% 不代表模式打不贏。另：隨機組合有時會讓 ×2 變容易（s1_7 ×2 0% → 疊加 17%，重抽換掉了較強的小兵種類），是 WL-6 已有的性質。
- 驗收：建置 `20261110-0900-c7c8af3f`（我獨立重建驗證；內容雜湊 c7c8af3f 與協調員建置 20261110-0018 相同），單檔 `dist/mengjiang.html` 12,497,905 bytes（md5 `b53540b7d3a9beceeb1a32c2c2f18714`，上限 20,000,000）；單元測試 36 組 **5,433／5,433**（`sh tools/runtests.sh` exit 0；新增 unit-wl7 87 項；另 +8 項是 unit-prov 對新增考證條目的逐條檢查）；E2E 合計 **585／585**（Chromium 桌機 195／195、WebKit iPhone 13 195／195、Chromium 手機橫向 195／195，`node tests/e2e.js all`；我獨立驗證第一次 all run 在 WebKit 觀星確認步驟中斷（`#confirm .rw` 4 秒逾時，元素已在 DOM 內，屬 VM 時序抖動；該對話框由 ui.js 渲染，非 WL-7 動過的檔案），當時 Chromium 桌機已 195／195 全過，重跑一次全過；協調員自己的 all run 亦曾兩次被環境打斷（WebKit 程序關閉、runtime 重啟後函式庫缺失），第三次重跑一次全過，與遊戲邏輯無關；詳見 `docs/test-log-e2e.txt`）；ES5 全過（55 個 inline script）；存檔版本不變（v12，`chal2` 為加法性欄位，刪除 `chal2` 的舊存檔仍可讀取）。待推上線，單檔只傳一次（Tomas 手動上傳；今早給的 WL-5/WL-6 單檔連結作廢，跳過不用傳，只傳 WL-7 這一個檔案）。
- 未完成／待決定：關卡內隨機事件、章節地形、無雙封印關、場地道具實裝（Tomas 2026-11-09 22:30 確認的順序，依序做）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高。

### WL-8 主線加難度：主線精英／王／隱藏關章節倍率 bossScale（已完成，2026-11-10，Tomas 決定）

- 設計（D 級原創，Tomas 2026-11-10 12:42 決定：主線要加難度——現在只要等級到了就全過，裝備技能不升也過得了，要的是「裝備技能不升就卡關」；12:45 再把一般隊同級精英／王／隱藏關勝率目標從我提的 85–95% 收緊到 **70–80%**，普通關維持 100%）。手段：主線精英／王／隱藏關的敵方攻防血 × 本章倍率（`src/data/config.json` 的 `bossScale`，依章 1–10）：**1.20、1.65、2.45、2.30、2.65、3.60、3.50、2.95、2.60、2.30**（`src/js/rules.js` 的 `R.enemyUnit` 在既有敵人成長曲線之後套用）。只套主線精英／王／隱藏關；普通關不套；通天塔（floor）與無極幻境（wave）不套；增援與隨機組合經 `enemyUnit` 產生，同樣套用；與 ×2 挑戰、王關詞綴疊加時先套章節倍率再翻倍／套詞綴。不動：命中／閃避／爆擊／敏捷／等級／血條層數；不改戰鬥規則（命中、爆擊、怒氣、壓制曲線）、玩家成長、獎勵與經濟。校準方法（`tools/balance.js`，12 種子）：先以固定倍率掃描各章翻轉點（章節平均勝率約 0.75 時的倍率：ch1 約 1.3、ch2 約 1.7、ch3 約 2.45、ch4 約 2.3、ch5 約 2.65、ch6 約 3.6、ch7 約 3.5、ch8 約 2.95、ch9 約 2.6、ch10 約 2.3；各章翻轉點差異極大，因為隊伍強度在上陣人數／品質階層處階梯跳升、敵人成長曲線已在高級補償——平坦倍率、統一曲線、線性章節公式都對不齊各章，只能用逐章表），再按章取表；第一章取 1.20（略低於翻轉點 1.3，避免第一個精英關 s1_4 被壓到約 13% 而擋住新手）。`src/data/provenance.json` 新增 D 級條目 `balance.bossScale`（296 → 297 條，記下倍率表、校準方法與分布提醒）。
- 注意（雙峰分布，量測證實）：勝率隨敵方強度呈雙峰分布——關卡多在 100% 或驟降至 50% 以下，幾乎不停在 70–80%。章節平均 70–80% **不代表每關都在 70–80%**：40 關王系關中 19 關仍 100%、5 關 85–99%、3 關 70–84%、7 關 50–69%、**6 關 <50%**（s2_4 42%、s3_8 0%、s4_8 0%、s5_7 8%、s7_8 17%、s8_9 33%；其中 s3_8、s4_8 兩個章節王關同級一般隊 0%，要高出 5 級才 100%）。這是分組倍率的物理極限，不是校準失誤；要逐關都落在 70–80% 只能逐關調數值（40 個手調數字），未做。
- 實作檔案：`src/data/config.json`（新增 `bossScale`）、`src/js/rules.js`（`enemyUnit` 套用章節倍率，限主線王系關）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生，含新 config 與新考證條目）、`src/data/provenance.json`（新增 `balance.bossScale` D 級）、`tools/balance.js`（新增第 9 節「WL-8 調校前後對照」：讀 WL-7 基線逐章／總計對照，另補十章王關 ×2 越級 +5／+10／+15／+20）、`docs/balance-wl8-after.txt/.json`（本輪量測存檔）、`docs/progress-sim-wl8.txt/.json`（30 天模擬存檔）、`tests/unit-wl8.js`（新增）、`tools/runtests.sh`（登記 unit-wl8）。補修（2026-11-10，見下）：`tools/balance.js`（新增 max 模型與第 10 節）、`src/data/provenance.json`（新增 `balance.maxTeam` D 級，297 → 298 條）、`tests/unit-wl8.js`（擴充 12 項）、`src/js/data.generated.js`（以 `tools/build-data.js` 重新產生，含新考證條目）。遊戲程式（`src/js/game.js`、`src/js/rules.js`、`src/data/config.json`）零改動。
- 測試：新增 `tests/unit-wl8.js` 31 項（倍率表即校準值；開關對照：王／精英／隱藏關按章倍率、普通關／塔／幻境不套、超章夾到末章；命中／閃避／爆擊／敏捷／等級／層數不動；×2 在章節倍率後再 ×2；勝率守門區間：普通關 s1_1 12/12、王關 s1_8 一般隊 12/12、s10_8 一般隊 6/12、弱勢隊 s1_8 1/12；舊存檔相容：存檔 v12 不變、無 bossScale 存檔欄位；provenance 有 `balance.bossScale` D 級）；`tests/unit-affix.js:192`、`tests/unit-challenge.js:120`、`tests/unit-wl6.js:213`、`tests/unit-wl7.js:168` 僅改考證總數斷言 296 → 297。補修擴充 unit-wl8 至 43 項（+12：max 模型定義 4 項、max 與一般隊皆 8 人上陣、max 隊攻擊為一般隊 2 倍以上、max 同級打 ×2 王關 s1_8／s10_8 勝率 ≥25% 各 1 項、×2 首領攻／血確實 ×2、×2 機制未改、provenance 有 `balance.maxTeam` 2 項）；4 處考證總數斷言再改 297 → 298；unit-prov 對新條目逐條檢查 +8 項；單元全套 37 組 5,492／5,492（UNIT EXIT 0；unit-restore.js 檔不存在，runtests.sh 跳過，已是舊況）。
- 平衡量測（`tools/balance.js` 第 9 節，12 種子；基線 = WL-7，未套 bossScale）：主線王系關（40 關）一般隊同級 **100% → 78%**（逐章：ch1 85%、ch2 83%、ch3 71%、ch4 75%、ch5 75%、ch6 77%、ch7 77%、ch8 79%、ch9 77%、ch10 79%；ch1／ch2 略高於 70–80% 帶，但在 12 種子量測雜訊（約 ±6%）內；整體 78% 在帶內）；弱勢隊（+3 級）**98% → 4%**（ch1 33%、ch2 2%、其餘 0%——裝備技能不升，王關幾乎全滅，符合 Tomas「不升就卡關」的方向）；不養成隊（+3 級）6% → 2%（維持打不動）；普通關（50 關）一般隊 **100% → 100%**（最低 100%，主線推進不動）。通天塔取樣低於 100% 層數 0 → 0（F100 100% → 100%）；無極幻境低於 100% 波次 13 → 13 波、0% 波次 8 → 8 波（兩者與基線完全相同，bossScale 未碰塔／幻境，範圍限定得證）。限回合挑戰（8 代表關）：一般隊 12 回合 100% → 65%、弱勢隊 86% → 38%。×2（40 王系關，同級）：一般隊 82% → **0%**、弱勢隊 16% → 0%、×2 疊加一般隊 81% → 0%（×2 同級已無一關打得動）。×2 越級（十章王關，一般隊）：s1_8／s2_8 +5 即 100%；s3_8／s4_8 +10 100%；s5_8 +10 75%、+15 100%；s6_8 +15 83%、+20 92%；**s7_8／s8_8／s9_8／s10_8 +20 仍 0%**；另測滿級 Lv80：s7_8 100%、s8_8 92%，但 **s9_8／s10_8 滿級仍 0/12（×2 連滿級都打不動）**，見下方待決定。硬牆判定（一般隊 +5 級 <40%）：無。
- 30 天模擬（`tools/progress-sim.js`，標準 30 天／加速 14 天；基線 = WL-3 後：標準最長卡關 1 天、加速 0 天，皆 80/90 通關）：WL-8 標準 **80/90 通關、最長連續卡關 4 天（s8_8 華山之巔 Lv56，敗 1701 場）**、加速 **80/90 通關、最長 2 天（同為 s8_8，敗 1159 場）**；通關數不變（80/90，第 18 天後只剩等級鎖），但標準模式 4 天**超過「最長不超過 2 天」的防線**（模擬器本身亦標「⚠ 可能有硬牆」），見下方待決定。原因：模擬自動玩家隊伍品質弱於 typ 模型（近弱勢隊），在 ch7／ch8 最高倍率（3.50／2.95）前需多練 3–4 天等級才突破；一般隊（typ）+5 級即 100%，不會這樣卡。防線與 70–80% 目標在此衝突：要模擬 ≤2 天就得把 ch7／ch8 倍率下修到章平均 85–100%（破壞目標帶），故維持現表、提請決定。
- 補修（2026-11-10，Tomas 14:09 決定 ×2 要讓 max 隊伍打得過後執行）：max 模型（`tools/balance.js` `profile('max')`，D 級）：最高品質武將（品質 4）、當級最好裝備（gearLv＝關卡等級，裝備最高 Lv54）與最高品質（紫 q3）、強化拉滿（plus＝主角等級：神兵坊等級上限＝主角等級，銀幣成本不計）、技能升滿（sk＝min(10, 等級)：9 級＋「突破·神」升 10 級，技能等級不能超過武將等級）、圖鑑全收（codex＝87：88 名武將扣主角，獎勵封頂 15%）、培養拉滿（py＝培養上限 floor(10+1.5×等級)，四維全滿）、將星 5 星（全屬性 +30%）、主角升階（leadQ：Lv<20 為 2、20–59 為 3、60+ 為 4）、上陣人數拉滿（8 人）。不建模：心法／寶石／裝備洗鍊屬性（所有檔次皆不建模，故 max 是保守估計——真實全滿隊伍只會更強）。量測結果（`tools/balance.js` §10，12 種子）：max 同級打 ×2（現況 mult 2、不封頂）40 關精英／王／隱藏關**全部 100%**（原組合與隨機組合＋增援實戰口徑皆然），章節王關 10 關也全部 100%——遠高於 Tomas 定的標準（每關 >0%、王關 ≥25%）。主因：max 隊數值約為一般隊的 2.8–3.0 倍（Lv75 攻擊 225,338 對 79,726、血量 1,557,880 對 527,133），足以抵銷 ×2 的翻倍；對照：一般隊同級打 ×2 重測仍是 0%（§9 不變），max 打一般模式也是 100%（模型本身沒錯）。候選量測：A（mult 1.5）、B（mult 2＋總倍率上限 4）、C（1.5＋上限 4）同樣全部 100%——改動無意義。結論：**×2 不用改（mult 維持 2、不封頂），遊戲零改動**；本輪只加量測模型（tools/balance.js max＋§10）、考證條目 `balance.maxTeam`（D 級，297 → 298 條）、單元測試擴充、量測檔更新。×2 仍比一般模式難（額外倍率 2 > 1）。30 天模擬不用重跑（×2 不影響主線推進）。Tomas 決定（2026-11-10 14:09）：(1) ×2 須讓 max 隊伍打得過——已達標，無需改程式；(2) **接受 30 天模擬 4–5 天卡關（s8_8）**——標準模式最長 4 天（協調員量測，敗 1701 場）／5 天（獨立重跑，敗 1761 場）已接受，不下修 ch7／ch8 倍率；(3) **接受章平均分布**——雙峰分布（19 關 100%、6 關 <50%）已接受，不改逐關調數值。
- 驗收（補修後，取代 WL-8 建置 20261110-0513-61c09982）：建置 `20261110-1445-97b1635b`（我獨立重建驗證；內容雜湊 97b1635b 與協調員建置 20261110-0626 相同），單檔 `dist/mengjiang.html` 12,503,226 bytes（md5 `c4c7a25859b74d0be43c5376c267d397`，上限 20,000,000；較 WL-8 建置 +2,372 bytes，只因考證表多一條 `balance.maxTeam`，遊戲程式零改動）；單元測試 37 組 **5,492／5,492**（`sh tools/runtests.sh` UNIT EXIT 0；unit-wl8 43 項；另 +8 項是 unit-prov 對新增考證條目的逐條檢查）；E2E 合計 **585／585**（Chromium 桌機 195／195、WebKit iPhone 13 195／195、Chromium 手機橫向 195／195，`node tests/e2e.js all` 一次全過、無時序抖動；詳見 `docs/test-log-e2e-wl8.txt`）；ES5 全過（55 個 inline script）；存檔版本不變（v12，無新增存檔欄位，舊存檔不用遷移）。**不要 push、不要上傳單檔**（待獨立驗證後再推；WL-7 單檔連結作廢，Tomas 只傳 WL-8 這一個檔案）。
- 未完成／待決定：(1) ×2 模式：**已解決（2026-11-10 Tomas 14:09 決定＋補修量測）**——max 隊伍同級打 ×2 40 關全部 100%，現況已達標，×2 不改；一般隊同級打 ×2 仍是 0%（這是挑戰模式的本意，不是 bug）。(2) 30 天模擬 4–5 天卡關：**已接受（Tomas 2026-11-10 14:09）**，不下修 ch7／ch8 倍率。(3) 單關分布不均：**已接受（Tomas 2026-11-10 14:09）**，不改逐關調數值。(4) 後續路線：關卡內隨機事件、章節地形、無雙封印關、場地道具實裝（Tomas 2026-11-09 22:30 確認的順序，依序做）；大喬無雙重名、陣法固定值模型＋9 人上陣、K-N6、K-N2、上古寶窟玉璧／種子掉落缺漏（沿用 WL-2 未決事項）；QA-1 真機測試未做。優先：高。

### ART-5 以原作素材或更貼近的重繪取代生成圖與音樂（已完成，WL-2，2026-11-09）
- 目標：在取得原作檔案，或有經同意的來源時，把目前生成的美術與音樂換成原作素材，或依 `reference/` 的截圖與影片重繪得更貼近原版。
- Replace generated art and music with original assets, or closer redraws, when original files or permission-backed sources are available.
- 證據：原公司同意（依倉庫擁有者說明）。使用原作素材時記入 `docs/美術素材來源.md`。
- 檔案：`src/assets/`、`src/js/audio.js`、`src/js/art.js`、`docs/美術素材來源.md`。
- 驗收：每項替換都有來源紀錄；`sh tools/runtests.sh` 仍通過；單檔仍 < 20,000,000 bytes（WL-2 起上限放寬）。
- 本輪已分析 2026-11-08 提供的實戰影片，整理可辨識的 HUD、範圍提示、技能／無雙演出、飄字、音效與待取得素材，詳見 `docs/影片實戰分析_2026-11-08.md`；新增行動角色腳下旋轉虛線光環（CSS，不增加圖片素材）。透明包角色仍因 ID 對應不足而不替換，避免錯配。
- 已做（2026-11-08，B/C）：依原版面板截圖重繪 10 名武將立繪、頭像、無雙切入像（h_*、h_*_av、h_*_ci）：韋小寶、貂蟬、呂布、東方不敗（擁有者提供截圖）；王語嫣、鰲拜、典韋、梅超風、袁紹、阿珂（
eference/native-pack/hero-sheet-reference.webp）。來源與 sha256 記入 docs/美術素材來源.md、src/assets/provenance-hashes.txt。截圖同時核對 10 名武將類型，與 heroes.json 全部一致（A，記於 docs/網路資料搜查-2.md）。驗收：單元 25 檔 0 失敗；E2E 455 通過／1 失敗（WebKit iPhone 13「沒有水平/垂直捲軸」，重繪前版本在同一台 Windows 機器上同樣失敗，非本次造成）；ES5 全過；單檔 11,883,146 bytes（<12,000,000）。未做真機測試。
- 已做（WL-2，2026-11-09）：盤點再驗證——88 位可玩武將全套立繪／頭像／cut-in 早已齊全（85 位直有 `h_*`、3 位 artAlias 沿用同人首領圖），9 棟主城建築 `k_*` 齊全，TODO 原稱「其餘約 87 名武將待重繪」已過時。剩餘缺口為 12 名具名敵方共用通用／他人立繪，本輪各產獨立 `b_*` 立繪＋頭像＋cut-in（36 檔，D 級原創，無原版截圖可對照；原稿 sha256 見 docs/美術素材來源.md）。音樂：15 個畫面補齊 6 首 WebAudio 合成專屬曲（forge、hall、jxl、shanggu、shengsijie、wulin），0 音檔。詳見 §WL-2；`tests/unit-art5.js` 767 項全過；單檔最終 12,466,559 bytes（<20,000,000，建置 20261109-1122-e3c9b8a0）。

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
- 主要 D 項（`provenance.json` 中 grade D 的 132 筆（共 298 筆）；WL-2 升級前為 111／263，升級後 103／269，再加 gate2／美術新條目 21 條，WL-3 加 battle.suppressionCurve 1 條、WL-4 加 boss.affix 1 條、WL-5 加 mode.limitedRounds 1 條、WL-6 加 battle.reinforce／battle.randomFoes 2 條、WL-7 加 mode.doubleChallenge 1 條、WL-8 加 balance.bossScale 1 條、WL-8 補修加 balance.maxTeam 1 條）：招募機率、連攜效果數值、攻擊範圍「往前衝／換列／揮空／無雙改主動技」、陣法保存規則、1／15 級上陣人數（K-N6 待 Tomas 裁決）、新武將技能名與外觀（其餘 13 名）、27 筆 `web2.range.hero.*`、未寫數值的被動殘項（忍耐 +15、清心 30%、焚心觸發機率、飄忽 +5%、不死每場 1 次）、高級禦敵等 6 項數值、上古每階敵人數／袋數／金幣／袋內容、主角升階 20／60／90 與銀費／倍率、虛空之門 ch9／ch10 設計（gate2.* 9 條）、12 名新敵方首領美術（art.b_* 12 條）。
- WL-2 已升級（見 §WL-2 與 `docs/資料考證.md` §19）：息怒、連斬、回斬、熱血、吸血、化解、破咒、`skill.values`（D→B）；奪魂機率（→A）；小昭／劉備無雙名（→A）；上古分階／掉落／隱藏機制／圖騰／通天塔碎片（拆條升 B）；陣法固定值證據（→A，僅記證據、未改模型）。
- 做法：查到 A／B 來源就改 `tools/web2-data.js` 補丁並升級等級；在 `docs/網路資料搜查-2.md` 補來源列。

---

## 已知限制
- 單檔上限已於 WL-2 放寬至 20,000,000 bytes（原 12,000,000；目前 12,503,226 bytes，建置 20261110-1445-97b1635b）；再加美術前仍須追蹤單檔大小。
- 平衡（progress-sim 30 天，WL-2）：80／90 關、勝 80 敗 133、超時 0、僵局判定 2、最長卡關 0 天；天花板是既有「隱藏關需本章其餘 8 關全三星」門檻（自動玩家無法全三星）。v9 範圍規則下 1 對 1 可能磨血超時，見 docs/原版還原-進度.md。

