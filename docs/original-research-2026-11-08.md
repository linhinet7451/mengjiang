# 《猛將無雙》單機重製：原版貼近度研究與改進建議

**研究日期：2026-11-08（UTC+8）**  
**適用版本：目前存檔 v12／第五階段正式版＋奇遇**  
**專案定位：非官方、單機、離線 HTML5 重製**

## 1. 結論摘要

目前版本已經完成一個可離線遊玩的完整單機骨架：主城、聚賢莊、神武殿、陣法、虛空之門、通天塔、無極幻境、農田、任務、商城、奇遇、戰鬥演出、存檔遷移與錯誤復原均可運作。README／TODO 記錄的最近驗收為 **26 組單元測試 3,712／3,712、E2E 456／456、51 個 inline script 通過 ES5 檢查、單檔 11,890,862 bytes**；但僅使用 Chromium／WebKit iPhone 13 模擬，沒有實體 iPhone／Android 驗收。

原版貼近度不能用「功能數量」單一衡量。研究結果顯示：

1. **已完成且有台版 B 級支持的核心**：主城建築開放表中的無極 12 級、通天塔 22 級、將星錄 30 級；虛空普通／精英／王／隱藏與全圖三星開隱藏；通天每 10 層寶箱；無極每 5 波將魂；上古原版 3 人、3 關＋隱藏關的概念；部分武將技能、被動、連攜、技能格圖；八種陣法與每陣 8 格；寶石逐級表；部分 HUD／面板結構。
2. **真正尚未完成的高價值工作**：將已有證據拆到逐武將、逐欄位、逐版本；補 27 名武將與主角的來源缺口；把 W282／W967 的台版與陸版圖片、直接讀值、推論分開；補台版 UI golden reference；處理技能範圍與目標選擇中仍屬 C/D 的棋盤規則；做實體裝置測試。
3. **不應現在做的一比一線上化**：公會、好友、聯賽、武林大會、真人上古寶窟、VIP、遠端資料庫與 FB 登入。它們需要伺服器或社交狀態，與目前單機架構衝突。若要做，最多採本機 AI／固定賽程替代，必須標 D，不得稱為原版多人還原。
4. **目前最需要修正的不是再加系統，而是降低誤稱風險**：README 已明確把八章 72 關、通天 100 層、無極三欄、每日任務 7 項、農田即時／加速、塔俸、培養丹、八格裝備等標作現行玩法或 D 級設計；報告建議在 UI、資料模型與測試中同步標示「台版原版／陸版參考／本作設計／未驗證」。

## 2. 分級與判讀規則

本報告沿用專案規則：

- **A**：原版畫面、官方宣傳片或可直接辨識的遊戲截圖／影片。專案的 `reference/` 為本地素材，沒有公開 URL，因此只能在專案內作 A 級，不把它寫成外部可核對來源。
- **B**：當年玩家攻略、精華區、攻略百科。可支持規則或數值方向，但不是官方規格，也可能跨版本。
- **C**：由圖形、資料欄位或多個來源推定；不可冒充原版定值。
- **D**：本作自訂、單機化、平衡設計或尚無原版直接證據。

**地區標記**：

- **台版**：巴哈姆特台版攻略、台版截圖或明確台版頁面。
- **陸版**：百度百科、聚俠網、QQ／游俠等陸版或未能確認台版的資料。
- **A/B/C/D**：每項建議的可信度，不代表功能完成度。
- **來源衝突**：兩個來源都保留，不選一個冒充唯一真值。
- **無法驗證**：公開頁面沒有足夠文字、清晰圖片或影片；不可用記憶、相似度或現行程式反推。

## 3. 已完成項：不要重做，只需補標籤與驗收

### 3.1 單機產品骨架與工程品質（已完成）

README／TODO 已確認：單檔離線輸出、LocalStorage 主檔與備份、v1–v12 遷移、損毀檔拒絕升版、戰報版本閘門、ES5、無 CDN／無網路請求，以及目前測試數字均已完成。這些是本作工程成果，不是台版原版證據；應維持 **D／本作設計** 標籤，不需要為了「像原版」改成線上架構。

### 3.2 已有原版證據且已接入的資料

| 項目 | 現況 | 證據與界線 |
|---|---|---|
| 無極／通天／將星錄開放 | 已接入 12／22／30 級與舊存檔相容 | 台版玩家攻略 B；`README`／`TODO`／`SOURCE_INDEX` 已記錄。 |
| 虛空四類與三星隱藏 | 已有關卡、星數、抽牌與隱藏流程 | 台版 B；精確 8 章 72 關逐關內容仍非公開證實。 |
| W967 61 名技能基準 | 已接入主動 Lv1／Lv6、無雙基準與部分被動／連攜 | 台版 B；作者明示部分參考陸版且可能有誤。 |
| W282／W967 範圍 | RV14 已套用部分普攻／Lv6／無雙格圖 | W282 有台／陸混用與缺圖；部分是 C 級圖形換算。 |
| 八陣與每陣 8 格 | 已接入陣法與站位 | W77 可支持名稱、方向與 8 格；逐級加成與開放順序仍 B/C/D。 |
| 寶石逐級值 | P4-1 已寫入 `gem_*` 來源表，缺值不外推 | 台版 W84／snA=5150，B；換算公式與所有 LV6 不完整。 |
| 將星錄 19 組、5 魂合成 34 條 | 已接入、衝突值保留 null、合成 UI 已測 | 台版／陸版玩家攻略 B；組合效果尚未套入戰鬥，屬保守實作。 |
| 原版風格演出 | 已完成面板、血條、頭像列、無雙切入、程序化音效／音樂 | 有台版截圖／影片參考，但原版 BGM、SFX、完整動畫時序無公開可驗證檔。 |

### 3.3 已完成但不是原版還原的項目

以下功能可以保留，因為它們是單機可玩性或相容性設計；但 UI 與文件應明確顯示 **D／本作設計**：

- 培養丹模式、取消等待的刷新／訓練／農田、單機加速模式。
- 通天塔 100 層、每 5 層精英／每 10 層首領、每日塔俸。
- 無極三欄 3／5／7 波、生命與怒氣延續及全破箱。
- 上古改為自己的隊伍連戰 3 關、隱藏關 30% 機率。
- 八格裝備、絕技武器、心法、圖鑑、主角升階、九層生死劫。
- 拜訪武將改為 30 隊 AI 排名賽、越戰越勇、任務／簽到／商城的現行數值。
- 程序化 BGM、音效、粒子與無雙演出；目前沒有證據能稱為原版演出。

## 4. 優先級 P0：現在就應做，且不需要改成線上架構

### P0-1：建立「原版／陸版／本作」分層的 provenance matrix

- **建議**：以 `src/data/provenance.json` 與 `tools/web2-data.js` 為唯一可重跑來源，對每個建築、關卡、武將欄位、技能格、裝備欄、寶石數值、獎勵與 UI 元件逐項記錄 `region`、版本日期、grade、URL、原文／圖證、採用狀態、衝突與未驗證原因。每個欄位獨立分級，不要再以「W967 有表」涵蓋所有欄位。
- **目前缺口**：README／TODO 已有大量完成資料，但仍存在「61 名有基準／27 名未列來源／主角只有最小範圍」與「台版攻略、陸版轉貼、推論、本作 D 值」混在同一功能頁的風險。`SOURCE_INDEX` 也明示來源是玩家攻略，不是官方規格。
- **來源證據**：台版 W967：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967；台版 W282：https://forum.gamer.com.tw/C.php?bsn=22512&snA=282；台版 S1：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；陸版 W60 轉貼：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=60；專案分級規則與採用清單：`README.md`、`TODO.md`、`docs/sources-extracted/SOURCES-INDEX.md`。
- **可信度**：B（來源事實）；A（若引用專案本地原版截圖的可見欄位）；C/D（推定與本作值）。
- **實作位置**：`tools/web2-data.js`、`src/data/provenance.json`、`docs/sources-extracted/web2/`、`src/js/ui-p2.js`／`ui-p6.js`／`ui-city.js`；新增 `docs/provenance-matrix.md` 或產生器輸出。
- **驗收方式**：自動檢查每個 runtime 數值都有 provenance；台版／陸版／D 不能共用無地區欄位；衝突兩邊都存在；缺值維持 `null`，不得被插值；UI 能篩選「台版已證／陸版參考／本作設計／待補」。
- **是否建議現在做**：**是，最高優先**。

### P0-2：補 27 名武將與主角的逐欄位缺口，不猜技能

- **建議**：建立 88 名非主角＋主角的欄位矩陣：品質、類型、主動技能名、Lv1、Lv2–5、Lv6、Lv7–9、無雙名／倍率／格圖、兩個被動、連攜對象／效果。先補有清晰台版 tooltip、影片畫格或原版截圖者；沒有直接證據則保留 `null` 與「未列來源」。
- **目前缺口**：研究盤點的 27 名未列來源武將（管亥、鄧茂、程遠志、陸大有、廖化、周倉、裴元紹、田伯光、余滄海、包不同、祝融夫人、洪七公、魏延、紫霞、黃藥師、歐陽鋒、黃忠、甘寧、司馬懿、至尊寶、岳不群、曹豹、曹德、曹昂、曹節、丁管、汗貼摩）不能以目前 runtime 反推原版。主角也只有類型與 Lv1／Lv6 範圍的最小 B 級證據。
- **來源證據**：W967 逐將表：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967；W282 Lv6 整理：https://forum.gamer.com.tw/C.php?bsn=22512&snA=282；主角／類型與攻略總表：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；段譽衝突頁：https://forum.gamer.com.tw/C.php?bsn=22512&snA=5095。
- **可信度**：B（已直接列出的台版攻略欄位）；C（圖形轉錄／推定）；D（目前自訂或未列來源）。
- **實作位置**：`tools/web2-data.js`、`src/data/config.json`、`src/data/provenance.json`、`src/js/ui-p2.js`、武將圖鑑與 tooltip 元件。
- **驗收方式**：圖鑑逐人顯示已證欄位數；缺欄顯示「未列來源」而非現值；測試確認未證技能不改戰鬥；一個來源只能提升對應欄位，不得整列升級；保留舊存檔與 replay golden。
- **是否建議現在做**：**是，現在做資料模型與缺口 UI；搜尋／補證可分批做**。

### P0-3：把範圍引擎拆成命中掩碼、活人計數、阻擋、目標排序四層

- **建議**：保留 W967 可支持的「施放者自身格為錨點、往前數活人」；把「我方阻擋」「死亡後重新選目標」「跨列換列」「無目標 fallback」獨立成 C/D policy。每種技能保存原始格圖，不以 `single／line／column` 抽象類型代替。
- **目前缺口**：TODO 明列 BOARD-1／BOARD-2 的前進、排隊、卡住穿過、僵局及是否換列仍有 C/D 或待確認項；研究也未找到完整原版棋盤演算法。玩家站位文只能支持策略意義，不能證明固定仇恨。
- **來源證據**：W967：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967；W282：https://forum.gamer.com.tw/C.php?bsn=22512&snA=282；陣法／8 格：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=77；無極與通天棋盤不同：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570；玩家站位建議：https://forum.gamer.com.tw/Co.php?bsn=22512&sn=22752。
- **可信度**：A/B（可見格圖、施放者錨點）；C/D（目標排序與棋盤行為）。
- **實作位置**：`src/js/rules.js`、`src/js/battle.js`、`src/js/ui-battle.js`、`tests/fixtures/battle-golden-v*.json`、`tests/unit-board.js`、`tests/unit-wrap.js`。
- **驗收方式**：新增逐格 replay fixture：前排活人、前排死亡、跨列、無目標、走到底排隊各一組；範圍預覽與實際傷害共用同一掩碼；舊 RV10–RV15 golden 完全不變。
- **是否建議現在做**：**是，先拆層與測試，不要先改成未證實的換列規則**。

### P0-4：加入台版 UI golden reference 與相對比例驗收

- **建議**：把公開台版截圖與本地 `reference/` 影像編成 reference board，優先校正主城 HUD、右上資源列、神武殿四分頁、聚賢莊品質色、虛空／無極／通天面板、戰鬥下方我方頭像列。用相對比例、欄位順序、面板層級驗收，不虛構固定 px。
- **目前缺口**：目前已有 7 張 WebP 參考集與 41 名武將重繪，但沒有逐像素量測、公開影片時序、透明 Sprite 或獨立背景層。原版音樂、音效與完整 cut-in 仍無法驗證。
- **來源證據**：台版新手導覽與截圖：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570；台版全攻略與圖：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；台版技能格表：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967；作品索引：https://acg.gamer.com.tw/acgDetail.php?s=55622。
- **可信度**：B（玩家保存的台版截圖）；A 僅限專案內已辨識的原版畫面；原版音樂／演出為無法驗證。
- **實作位置**：`reference/`、`src/assets/`、`src/js/art.js`、`src/css/style.css`、`docs/美術素材來源.md`、可新增 `tools/reference-diff.js`。
- **驗收方式**：每張 reference 有完整 URL、日期、地區、裁切與 hash；桌機／WebKit／橫向手機截圖通過欄位順序、無溢出、面板返回層級；不把攻略文字整張嵌入 runtime。
- **是否建議現在做**：**是，優先 UI 與色票；音樂／原版動畫暫不追求一比一**。

## 5. 優先級 P1：完成後明顯更像台版，但可排在 P0 之後

### P1-1：原版建築開放表做成資料卡，未實作建築不建假入口

- **建議**：在主城或圖鑑增加「原版開放表」：榮譽試煉 8、無極 12、公會 15、聯賽／圖騰柱 20、通天 22、上古 25、將星錄 30、華容道 30、武林大會／銅雀台 35、觀星台 40、玄機盤 50、除魔殿 65。對未實作／社群功能只顯示鎖定資料卡與來源，不新增空殼入口。
- **目前缺口**：目前已接入無極／通天／將星錄；README 的奇遇 5 級、拜訪武將 8 級與其他本作門檻不可宣稱為原版。榮譽試煉存在 Lv8／Lv10 衝突，武林大會存在 Lv30／Lv35 衝突。
- **來源證據**：台版全攻略：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；新手導覽：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570；榮譽試煉百科：https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%BA%8C%E3%80%81%E6%A6%AE%E8%AD%BD%E8%A9%A6%E7%85%89%E5%8A%9F%E8%83%BD&ss=55622；FAQ：https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E7%8C%9B%E5%B0%87%E7%84%A1%E9%9B%99FAQ&ss=55622。
- **可信度**：B；衝突項目 B／待選版本，不升 A。
- **實作位置**：`tools/web2-p3.js`、`config.buildings.*`、`src/js/ui-city.js`、建築 tooltip／鎖定卡。
- **驗收方式**：測試 Lv7／8、11／12、21／22、29／30；舊存檔已開入口仍可用；衝突門檻同時顯示來源版本，不自動覆蓋現行值。
- **是否建議現在做**：**是**。

### P1-2：把虛空、通天、無極、上古的原版值與 D 值雙欄化

- **建議**：副本結算、圖鑑與資料檔分成 `originalSupported` 與 `remakeDesign`。原版台版欄只放已證值：虛空四類／三星／抽牌；通天 22 級、每 10 層寶箱；無極 12 級、每 5 波 1 魂；上古 25 級、3 人、3 關＋隱藏、5 精力。專案的 8 章 72 關、100 層、三欄 3／5／7 波、單機連戰與詳細掉落維持 D/C。
- **目前缺口**：公開台版來源沒有完整虛空逐關敵人／掉落、通天 100 層敵人與塔俸、無極固定波次與每波經驗、台版上古逐級掉落。陸版百科的 70／80 級上古與逐關表不能覆寫台版。
- **來源證據**：台版新手導覽：https://forum.gamer.com.tw/C.php?bsn=22512&snA=1570；台版全攻略：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；台版通天索引：https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%B8%80%E3%80%81%E9%80%9A%E5%A4%A9%E5%A1%94%E4%BD%8D%E7%BD%AE&ss=55622；陸版百科：https://baike.baidu.com/item/%E7%8C%9B%E5%B0%86%E6%97%A0%E5%8F%8C/9184624；陸版 Boss 參考：https://www.juxia.com/news/2012-6-27/48594.html。
- **可信度**：台版 B；陸版 B 但僅 referenceOnly；逐關本作內容 C/D。
- **實作位置**：`src/data/config.json`、`tools/web2-data.js`、`src/js/ui-p3.js`、副本結算與圖鑑。
- **驗收方式**：任何陸版資料不能出現在台版原版欄；未證掉落為 `null` 或 D 標籤；通天／無極／上古現行玩法仍可玩；來源頁與版本在 UI 可追溯。
- **是否建議現在做**：**是**。

### P1-3：神兵坊改成「證實規則優先、未知不插值」

- **建議**：採用台版寶石攻略的逐級表：物攻 17/58/164/324/665、法攻 18/59/165/325/666、物防 9/29/82/162/333、法防 10/30/83/163/334、暴擊／閃避 55/182/345/545/1000/1636、命中 60/200/380/600/1100、生命 54/177/495/975/1998。強化冷卻、好友祝福、最多 3 顆、4 合 1、種子／商城來源可分別標 B；缺 LV6 或逐品質孔位則保持未知。
- **目前缺口**：README 現行「+5 以下必成功、失敗不掉級」、品質 1/1/2/3 孔、完整洗煉／套裝／裝備基礎屬性、第三種武器逐級資料沒有本次直接台版證據。4 格裝備是陸版／早期對照，不能覆寫台版目前 6 格。
- **來源證據**：台版 W84／寶石攻略：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=5150&bpage=1&ltype=；桌面同文：https://forum.gamer.com.tw/Co.php?bsn=22512&sn=22486；台版入門指南：https://forum.gamer.com.tw/Co.php?bsn=22512&sn=15643；台版全攻略：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；陸版裝備對照：https://www.juxia.com/news/2012-4-6/37586.html；孔位參考：https://m.ali213.net/gonglue/140912/131059.html；強化祝福參考：https://www.qqan.com/article/article_45044_1.html。
- **可信度**：B；生命／暴擊／閃避公式部分 B/C；陸版四格為 B 但非台版。
- **實作位置**：`tools/web2-data.js`、`src/data/config.json`、`src/js/rules.js`、`src/js/ui-p2.js`／神兵坊 UI。
- **驗收方式**：已知表逐級比對；未知值不自動插值；最多 3 顆與 4 合 1 測試；顯示命中／閃避「抵消後」但不固定百分比；舊存檔寶石等級不丟失。
- **是否建議現在做**：**是，先完成 provenance 與未知值保護；不要現在補套裝與洗煉數值**。

### P1-4：補原版精力／培養／經驗規則的參考模式，不破壞單機模式

- **建議**：加入設定或資料檢視中的「原版參考」：虛空每戰 1 點、30 級前失敗不扣、自然回復每 30 分鐘 1 點、上古每次 5 點；培養每次 50 榮譽，選重試／保持／替換；訓練不可超過主角等級。現行培養丹、立即完成、加速精力保留為本作模式。
- **目前缺口**：README 已明示本作取消等待、培養丹與加速收益；目前 UI 若沒有標籤，玩家可能把 D 級規則誤認台版原值。每日任務、簽到、商城精確金額也未完整公開。
- **來源證據**：精力與培養：https://forum.gamer.com.tw/C.php?bsn=22512&snA=1570；https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；訓練：https://forum.gamer.com.tw/Co.php?bsn=22512&sn=15643&subbsn=1；經驗表：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=6；商城例值：https://www.962.net/gl/29157.html。
- **可信度**：B；`G2(6)` 的部分逐級表在台版頁面標為對岸資料，仍需 B／地區標籤。
- **實作位置**：`src/js/rules.js`、`src/js/sys*.js`、`src/js/ui-p3.js`、`config.economy`、`provenance.json`。
- **驗收方式**：模式切換不改存檔核心；原版參考值與單機值並排顯示；Lv7–79 來源表逐筆測試，Lv1–6／80–90 保持 D；精力回復倍率有明確模式標籤。
- **是否建議現在做**：**是，但做成參考／顯示層，不強制改單機經濟**。

### P1-5：陣法資料增加版本與證據欄，不追猜逐級數值

- **建議**：先固定八種陣法名稱、主要加成方向與每陣 8 格；W77 的 1.5.9 陸版轉貼、截圖讀值、作者「據說／初步估計」分開保存。陣法說明可放「前排保護敏將、延長控制輸出」作玩家攻略提示，但不可實作成固定仇恨。
- **目前缺口**：W77 同時有台版索引、陸版轉貼與推估數字；逐級開放、每格數值、12／16／20 級效果不是完整台版官方規格。模式間棋盤也未完整公開。
- **來源證據**：W77：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=77；台版無極／通天差異：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570；站位實例：https://forum.gamer.com.tw/Co.php?bsn=22512&sn=22752。
- **可信度**：B；每陣 8 格與方向可較高採用，逐級數值 B/C。
- **實作位置**：`src/data/config.json`、`src/js/ui-p2.js`、`src/js/rules.js`、`docs/sources-extracted/`。
- **驗收方式**：UI 顯示來源版本；所有未確認逐級值為未知；虛空／通天／PK／無極可保存模式欄位，不能假設共用同一棋盤。
- **是否建議現在做**：**是，資料標籤與測試先做；數值不急著改**。

## 6. 優先級 P2：現在可規劃，但不應阻擋正式版

### P2-1：補原版 UI 與素材證據索引

- **建議**：繼續補透明 Sprite、建築背景、面板邊框與可替換 cut-in cue；每項素材記錄來源、sha256、授權／同意說明與是否台版。原版音效與 BGM 在沒有可播放來源前，維持目前 WebAudio 原創。
- **目前缺口**：公開頁面只證明有截圖與圖片外鏈，沒有完整台版 gameplay 影片、原始音效、BGM stem 或動畫時間軸；不可由「有無雙」反推原版演出。
- **來源證據**：台版新手導覽：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570；台版全攻略：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；W967：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967；ACG 索引：https://acg.gamer.com.tw/acgDetail.php?s=55622；專案現況：https://github.com/linhinet7451/mengjiang/blob/main/README.md。
- **可信度**：B；本地 reference 的可見欄位可作 A；音訊與完整動畫為無法驗證。
- **實作位置**：`src/assets/`、`src/js/art.js`、`src/js/audio.js`、`docs/美術素材來源.md`、`reference/`。
- **驗收方式**：素材替換不增加錯配；來源與 hash 齊全；單檔小於 12 MB；單元／E2E 不回歸。
- **是否建議現在做**：**可做，但低於資料分層與真機測試**。

### P2-2：建立台版副本資料補證工作流

- **建議**：若取得原版錄影，按逐關／逐層／逐波建立畫格索引：地區、日期、關卡、敵人、首領、掉落、星數、抽牌、可見／不可見欄位。只把畫面可辨識內容升為 A，不能由 OCR 猜全表。
- **目前缺口**：公開資料不能證實專案的虛空 8 章 72 關逐項敵人、通天 100 層、無極波次敵人與台版上古掉落。陸版百科的逐關表與台版「3 關＋隱藏」存在差異。
- **來源證據**：台版虛空／副本：https://forum.gamer.com.tw/C.php?bsn=22512&snA=1570；台版攻略：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；台版畫面：https://truth.bahamut.com.tw/s01/201301/43d9676dbe8567dd915c3f68fdcaf803.JPG；陸版百科：https://baike.baidu.com/item/%E7%8C%9B%E5%B0%86%E6%97%A0%E5%8F%8C/9184624。
- **可信度**：A（清晰原版畫面可見欄位）；B（攻略）；未找到前為無法驗證。
- **實作位置**：`docs/sources-extracted/`、`tools/web2-data.js`、`src/data/provenance.json`、副本資料表。
- **驗收方式**：台版與陸版資料不同表；每個掉落值可回溯到畫格／URL；沒有證據的欄位為 `null`；不因完整度壓力補假資料。
- **是否建議現在做**：**只建立工具與 schema；等待新影片／截圖再填數值**。

### P2-3：實體裝置 QA

- **建議**：在實體 iPhone Safari（iOS 16+）與至少一台 Android Chrome 執行：開啟 GitHub Pages、主城、戰鬥、存檔重整、匯出／匯入、橫向旋轉、長時間農田／動畫與記憶體觀察。
- **目前缺口**：TODO 的 QA-1 明確列為未做；Playwright iPhone 13 是模擬，不等於實機。
- **來源證據**：專案 QA 限制見 `TODO.md`；部署入口：https://linhinet7451.github.io/mengjiang/。
- **可信度**：A（實機測試結果）；目前狀態是未驗證。
- **實作位置**：部署版、`tests/e2e.js`、`docs/test-log-e2e.txt`、新增 `docs/test-log-real-device.md`。
- **驗收方式**：記錄機型、OS、瀏覽器、載入秒數、是否捲軸、錯誤、記憶體警告、存檔往返；不能寫「通過」而只有模擬器結果。
- **是否建議現在做**：**是，與 P0 資料工作並列高優先**。

## 7. 社交／線上功能的保守建議

原版公會、好友支援、聯賽、武林大會、上古 3 人組隊、銅雀台與 VIP 依賴真人玩家、共享房間、伺服器狀態或 Facebook；而專案規則明確禁止 FB 登入、遠端資料庫與真實付款。因此：

- **建議現在做**：只做資料卡、開放等級、來源與「本作未重建」說明；榮譽試煉可繼續使用已完成的本機事件，但標示為單機替代。可做固定 14 人 AI 聯賽或 AI 助陣，但所有獎勵與賽程標 D。
- **不建議現在做**：假造真人好友、在線排名、共享房間、社交貨幣、VIP 充值或遠端同步。這些會破壞離線承諾，也無法由現有來源驗收。
- **來源證據**：公會／聯賽／武林大會／圖騰：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41；好友與原版導覽：https://forum.gamer.com.tw/C.php?bsn=22512&snA=1570；FAQ：https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E7%8C%9B%E5%B0%87%E7%84%A1%E9%9B%99FAQ&ss=55622；銅雀台：https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%B8%80%E3%80%81%E9%8A%85%E9%9B%80%E5%8F%B0%E4%BB%8B%E7%B4%B9&ss=55622&f=M。
- **驗收方式**：離線狀態下功能仍可啟動；UI 明示「AI／本作替代」；不產生網路請求；D 級獎勵與原版參考資料分欄。
- **是否建議現在做**：**只做保守資訊層與既有 AI 替代，不做線上化**。

## 8. 必須保留的來源衝突與無法驗證清單

| 主題 | 衝突／未知 | 處理方式 |
|---|---|---|
| 榮譽試煉 | 台版攻略 Lv8；百科 Lv10 | 兩者保留，標版本／來源，不宣稱唯一值。 |
| 武林大會 | 精華攻略 Lv35；FAQ 建築表 Lv30 | 保留 Lv30／Lv35，等待同版本畫面。 |
| 段譽 | +91 敏捷、+102 敏捷、約 20% 閃避 | 不合併；等待台版 tooltip／影片。來源：https://forum.gamer.com.tw/C.php?bsn=22512&snA=5095 。 |
| 療傷 | 50% 回 8%；另文為攻擊×20%生命 | 兩條 provenance 並存，不自動覆寫。來源：https://forum.gamer.com.tw/Co.php?bPage=0&bsn=22512&sn=15643&subbsn=1；https://forum.gamer.com.tw/C.php?bsn=22512&snA=967 。 |
| 上古 | 台版 25／35／45／60；陸版百科另有 70／80 與逐關表 | 台版欄與陸版 referenceOnly 分離。 |
| 裝備欄 | 陸版／早期 4 格；本作目前 6 格，SOURCE_INDEX 的 D 規格曾規劃 8 格 | 不用陸版四格覆寫台版；現行 6 格標 D／本作設計。 |
| 棋盤 | 前進、排隊、卡住穿過、是否換列多為 C/D | 以 RV fixture 保守維持；等待原版影片，不把 TODO 規則升 A/B。 |
| 技能缺圖 | W282 自己說仍有角色未找到；W967 部分參考陸版 | 缺圖為 null／D，不用相似格形補全。 |
| 音樂與動畫 | 沒有公開可播放台版原版檔／完整時間軸 | 維持原創程序化音樂與可替換 cue，不宣稱復原。 |
| 精力與社交 | 原版每 30 分鐘 1 點、好友／公會補給；本作單機加速／立即完成 | 兩種模式並列，社交流程不強制一比一。 |

## 9. 建議實作順序

1. **第一批（現在）**：provenance matrix、地區／版本／衝突欄位、27 名＋主角缺口 UI、台版／陸版／D 的資料分離、P0 範圍引擎 fixture。
2. **第二批**：UI golden reference、寶石與神兵坊未知值保護、建築資料卡、虛空／通天／無極／上古雙欄模型、原版參考經濟面板。
3. **第三批**：實體 iPhone／Android QA、逐關影片索引、剩餘武將圖像與 UI 素材重繪。
4. **暫緩**：完整套裝／洗煉／第三武器逐級表、原版 BGM／SFX 重製、真人社交與遠端服務。

## 10. 完成定義

這個版本可以宣稱「更貼近台版原版」的條件，不是新增最多玩法，而是：

- 每個原版聲稱都有 URL 或專案內可定位的 A 級畫面；
- 台版、陸版、C 推論、D 本作設計在資料與 UI 分開；
- 所有衝突都保留，不以單一猜測覆蓋；
- 未驗證的技能、掉落、棋盤、動畫與音效不會進入「原版已還原」文案；
- 舊存檔、舊戰報、離線單檔與目前測試數字不回歸；
- 實體裝置測試結果獨立記錄，模擬器不冒充真機。

---

## 來源總表（本報告引用的完整 URL）

1. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41
2. https://forum.gamer.com.tw/C.php?bsn=22512&snA=1570
3. https://forum.gamer.com.tw/C.php?bsn=22512&snA=967
4. https://forum.gamer.com.tw/C.php?bsn=22512&snA=282
5. https://forum.gamer.com.tw/Co.php?bsn=22512&sn=15643&subbsn=1
6. https://forum.gamer.com.tw/C.php?bsn=22512&snA=5095
7. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=60
8. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=77
9. https://forum.gamer.com.tw/Co.php?bsn=22512&sn=22752
10. https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=5150&bpage=1&ltype=
11. https://forum.gamer.com.tw/Co.php?bsn=22512&sn=22486
12. https://www.qqan.com/article/article_45044_1.html
13. https://m.ali213.net/gonglue/140912/131059.html
14. https://www.juxia.com/news/2012-4-6/37586.html
15. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=6
16. https://baike.baidu.com/item/%E7%8C%9B%E5%B0%86%E6%97%A0%E5%8F%8C/9184624
17. https://www.juxia.com/news/2012-6-27/48594.html
18. https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%B8%80%E3%80%81%E9%80%9A%E5%A4%A9%E5%A1%94%E4%BD%8D%E7%BD%AE&ss=55622
19. https://wiki2.gamer.com.tw/wiki.php?n=55622:%E4%BA%8C%E3%80%81%E4%介面總覽&ss=55622&f=M
20. https://www.9k9k.com/gonglue/225/588.html
21. https://truth.bahamut.com.tw/s01/201301/43d9676dbe8567dd915c3f68fdcaf803.JPG
22. https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%BA%8C%E3%80%81%E6%A6%AE%E8%AD%BD%E8%A9%A6%E7%85%89%E5%8A%9F%E8%83%BD&ss=55622
23. https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%B8%80%E3%、榮譽試煉位置&ss=55622&f=M
24. https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E7%8C%9B%E5%B0%87%E7%84%A1%E9%9B%99FAQ&ss=55622
25. https://wiki2.gamer.com.tw/wiki.php?n=55622%3A%E4%B8%80%E3%、銅雀台介紹&ss=55622&f=M
26. https://www.962.net/gl/29157.html
27. https://acg.gamer.com.tw/acgDetail.php?s=55622
28. https://github.com/linhinet7451/mengjiang/blob/main/README.md
29. https://linhinet7451.github.io/mengjiang/
30. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=15
31. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=51
32. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=17
33. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=48
34. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=53
35. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=47
36. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=84
37. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=88
38. https://forum.gamer.com.tw/C.php?bsn=22512&snA=541
39. https://forum.gamer.com.tw/G2.php?bsn=22512&sn=4
40. https://home.gamer.com.tw/aaa1357932
