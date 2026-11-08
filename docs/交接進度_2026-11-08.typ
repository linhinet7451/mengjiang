#set document(author: "Manus", title: "猛將無雙 HTML5 重製｜專案交接進度", keywords: ("猛將無雙", "交接", "Three Kingdoms", "HTML5"))
#set page(paper: "a4", margin: (top: 18mm, bottom: 18mm, left: 19mm, right: 19mm), numbering: "1")
#set text(font: ("Noto Sans CJK TC", "Noto Sans CJK SC"), size: 9.5pt, lang: "zh")
#set par(justify: true, leading: 0.72em, spacing: 0.7em)
#set heading(numbering: "1.1")
#show heading.where(level: 1): set text(size: 16pt, weight: "bold", fill: rgb("7b3f1d"))
#show heading.where(level: 2): set text(size: 12pt, weight: "bold", fill: rgb("9a5a25"))
#show heading.where(level: 3): set text(size: 10.5pt, weight: "bold", fill: rgb("4f5965"))
#show link: underline
#show link: set text(fill: rgb("175a8a"))

#align(center)[
  #v(18mm)
  #text(size: 24pt, weight: "bold", fill: rgb("6d3518"))[猛將無雙 HTML5 重製]
  #v(5mm)
  #text(size: 16pt, weight: "bold")[專案交接進度]
  #v(5mm)
  #text(size: 11pt, fill: rgb("555555"))[供新對話直接承接使用]
  #v(12mm)
  #line(length: 70%, stroke: 1.2pt + rgb("c18a50"))
  #v(8mm)
  *交接日期：2026-11-08（Asia/Taipei）* \
  *目前分支：* `main` \
  *最新 commit：* `166c241 Implement W541 soul fusion recipes`
]

#pagebreak()

= 一、專案定位與硬性限制

這是「猛將無雙」Three Kingdoms／武俠題材 HTML5 單機離線網頁遊戲重製專案。技術採 vanilla JavaScript、ES5 相容語法、CSS 與內嵌 WebP 資產；最終部署必須是單一 HTML 檔，且檔案大小低於 12,000,000 bytes。

專案路徑：`/home/ubuntu/work/mengjiang`

GitHub repository：`https://github.com/linhinet7451/mengjiang`

GitHub Pages：`https://linhinet7451.github.io/mengjiang/`

主要檔案：
- 專案根目錄的待辦清單檔案：所有 P3、P4、ART 與商城／任務工作項目。
- `README.md`：建置、測試與專案總覽。
- `src/js/rules.js`：戰鬥版本、寶石、心法等核心規則。
- `src/js/sys6.js`：將魂合成與 P4-4 runtime 邏輯。
- `src/js/ui-p6.js`：將星錄與將魂公式 UI。
- `tools/web2-data.js`：可重跑的 web2 資料補丁。
- `docs/美術素材來源.md`：現有美術資產與來源紀錄。
- `docs/native-transparent-catalog.md`：透明原圖候選目錄。
- `reference/native-transparent/manifest.json`：透明候選的 hash、尺寸、alpha 與 runtime 使用狀態。

== 單檔限制

最後成功建置的 `dist/mengjiang.html` 大小為 *11,999,864 bytes*，仍低於 12,000,000 bytes，但安全餘量只有 136 bytes。任何新增圖片、長字串、資料欄位或 UI 文案都必須重新建置並檢查大小；不要未經壓縮直接加入 runtime 資產。

建置命令：
```bash
cd /home/ubuntu/work/mengjiang
node tools/web2-data.js P4
node tools/build-data.js
node tools/build-assets.js
node tools/build.js
node tools/es5check.js
wc -c dist/mengjiang.html
```

若 `build.js` 顯示「超過 12,000,000 bytes 上限」，先不要推送；應優先壓縮或移除 runtime 冗餘資料。

= 二、已完成工作總覽

== P3／商城／任務

- P3-3：完成 30 級將星錄解鎖、原始組合與將魂成本。
- P3-4：導入原始經驗表（sn=6）。
- P3-5：完成將星錄組合名稱、將魂量與存檔 v11 相容。
- P3-6：加入炸彈、旗幟、噴火槍戰場事件；BOSS 金框與精英銀框。
- SHOP-1：商城類別／貨幣交叉篩選。
- TASK-1：任務跨分頁一鍵領取，包括主線、歷練、活躍寶箱與多階成就。

== P4

- P4-1：W84 寶石逐級數值，舊存檔 `gem_*` 等級照新表讀取。
- P4-2：心法兩格規則；第一格 Lv1、第二格 Lv60；舊第三格轉入 `xfOverflow` 並退回秘笈；魂經驗白 1、綠 10、藍 50、紫 100。
- P4-4：完成 W541 34 條非爭議五魂合成公式。
- P4-5：W967 武將技能狀態效果與來源分級。
- P4-6：完成 10 名來源不足武將的查核與保守分級，不擅自補寫未知倍率。

=== P4-4 詳細狀態

W541 公式已由 `tools/web2-data.js` 從 `docs/sources-extracted/web2/c-snA541-recipes.json` 重建到 `src/data/config.json`，再由 `tools/build-data.js` 生成 `src/js/data.generated.js`。

runtime 公式使用壓縮字串格式：`materialId,materialId,materialId,materialId,materialId,outputId`，以控制 12MB 單檔限制。`src/js/sys6.js` 會拆解公式、建立材料需求、忽略材料順序，並在缺料時拒絕合成且不改變背包。`G.soulCombine()` 舊入口保留為拒絕提示，不再執行無來源隨機合成。

UI 位於 `src/js/ui-p6.js`，顯示 34 條公式、材料名稱、輸出名稱及目前是否可合成。兩條爭議留言公式只保留在來源文件脈絡，不進入 runtime。

= 三、美術素材狀態

== 已完成的原生素材整理

已處理兩個素材包：`mengjiang_pack.zip` 與 `mengjiang_asset_pack_transparent.zip`。目前已建立：

- `reference/native-pack/`：7 張最佳化的原生視覺參考 WebP。
- `reference/native-transparent/`：4 張保留 alpha 的透明角色候選。
- `docs/native-transparent-catalog.md`：候選來源、hash、尺寸、alpha 與限制。
- `reference/native-transparent/manifest.json`：4 張候選目前均為 `mapped_hero_id: null`、`runtime_use: false`。

4 張透明候選來源：
- `assets-transparent/fb/all/t_006.png`
- `assets-transparent/fb/all/t_011.png`
- `assets-transparent/fb/all/t_036.png`
- `assets-transparent/fb/all/t_078.png`

最佳化輸出：
- `reference/native-transparent/native-character-01.webp`
- `reference/native-transparent/native-character-02.webp`
- `reference/native-transparent/native-character-03.webp`
- `reference/native-transparent/native-character-04.webp`

== 透明包的最新判定

2026-11-08 重新檢查透明包後，確認：

1. README 只說明 `assets-transparent/` 是自動去除邊界連通淺色背景的 PNG，沒有 t 編號到武將名稱的 mapping。
2. ZIP 沒有 comment；候選 PNG 沒有可用 EXIF／metadata。
3. `source-index/資料考證.md` 與 `source-index/美術素材來源.md` 有整體武將名稱與來源，但沒有把 `t_006`、`t_011`、`t_036`、`t_078` 對應到 runtime hero ID。
4. 其他透明包素材大多是商城、寶石、經驗池、廣告拼圖或攻略截圖，不適合直接替換角色立繪。
5. 因此目前不可安全宣稱任何候選就是關羽、阿紫、熊貓或其他特定武將；不要直接覆蓋 `src/assets/out/h_*.webp`。

若下一輪取得帶有明確武將名稱的原圖或對照截圖，應先更新 manifest 的 `mapped_hero_id`，再依現有尺寸／構圖轉換流程產生 runtime WebP，完成 unit、E2E 與 12MB 驗證後才推送。

= 四、ART 狀態

- ART-1：HP／Musou bars 統一 5px。
- ART-2：戰鬥 HUD 底部只顯示我方頭像。
- ART-3：toast 分流到不同位置，降低遮擋。
- ART-4：高解析 Musou cut-in，直排金色技能文字與戰場暗角。
- ART-5：尚未完成。待辦清單定義為原作素材或更貼近的重繪取代生成圖與音樂的審核／替換工作。現有音樂仍是 `src/js/audio.js` 的 WebAudio 即時合成，尚未換成原作音樂。

= 五、目前尚未完成項目

== P4-3：生死劫 9 層

專案根目錄的待辦清單檔案 標記為未做。下一步需要先確認可追溯來源、層數／解鎖／獎勵規則，再設計最小實作與專項 unit test。不要根據一般遊戲慣例自行補原版數值。

== P4-7：體力規則

專案根目錄的待辦清單檔案 明確記錄為「不做，記錄」。不要把它當成待實作項目；除非使用者提供新的一手證據並明確要求重開。

== ART-5：音效／音樂與素材審核

目前仍以程序化 WebAudio 音效／音樂為主。若要替換，必須先確認授權、檔案大小、單檔限制與離線播放相容性，再逐場景審核。不要因找到參考音樂就直接加入 runtime。

== 透明角色 ID mapping

這是目前素材工作中最重要的待辦，但不是 P4／ART 既有待辦項目。只有在名稱與人物外觀都能明確確認時才導入 runtime；若只是「看起來像」，應留在 `reference/native-transparent/`。

= 六、驗證與已知通過結果

最近一次完整驗證結果：

- 完整單元回歸：3,655 通過／0 失敗。
- P4-4 專項：13 通過／0 失敗。
- Chromium 桌機 E2E：145／145。
- WebKit iPhone 13 E2E：145／145。
- Chromium 橫向手機 844×390 E2E：145／145。
- E2E 合計：435 通過／0 失敗。
- ES5：49 個 inline script 全部通過。
- 無網路請求、無 JS 錯誤、無水平／垂直捲軸的既有 E2E 條件均通過。

主要測試命令：
```bash
cd /home/ubuntu/work/mengjiang
sh tools/runtests.sh
node tests/unit-web2-p4-1-2-5-6.js
node tests/e2e.js all
node tools/es5check.js
```

修改任何 runtime 或資產後，至少重新執行：
1. `sh tools/runtests.sh`
2. `node tests/e2e.js all`
3. 完整單檔建置命令
4. `wc -c dist/mengjiang.html`

= 七、Git 與部署狀態

目前：
- 分支：`main`
- `HEAD`：`166c241 Implement W541 soul fusion recipes`
- `origin/main`：已同步於 `166c241`
- 工作樹：上一輪確認為乾淨。
- GitHub Pages：`https://linhinet7451.github.io/mengjiang/`

上一輪已完成 push；若新一輪沒有程式或文件變更，不需要重複 push。

建議新對話開場先執行：
```bash
cd /home/ubuntu/work/mengjiang
git status --short
git log -1 --oneline
sed -n '1,220p' <待辦清單檔案>
cat reference/native-transparent/manifest.json
```

= 八、新對話可直接貼上的承接指令

以下文字可直接貼給新的對話：

#quote[
請承接 `/home/ubuntu/work/mengjiang` 的猛將無雙 HTML5 重製專案。先讀 專案根目錄的待辦清單檔案、`README.md`、`docs/美術素材來源.md`、`docs/native-transparent-catalog.md`、`reference/native-transparent/manifest.json`，確認 git `main` 最新 commit 為 `166c241`。

目前 P3、SHOP-1、TASK-1、P4-1、P4-2、P4-4、P4-5、P4-6、ART-1～ART-4 已完成並已 push。P4-7 是 待辦清單明確記錄的「不做，記錄」，不要自行實作。尚待 P4-3、ART-5，以及透明角色候選的 hero ID mapping。

透明包的 4 張候選目前均沒有可驗證武將名稱對照，manifest 的 `mapped_hero_id` 為 null、`runtime_use` 為 false；不要直接替換 `h_*.webp`。若要繼續素材工作，先從使用者提供的帶名稱截圖或原圖建立明確 mapping。

單檔部署硬限制是低於 12,000,000 bytes；目前 `dist/mengjiang.html` 為 11,999,864 bytes，只有 136 bytes 餘量。任何改動後執行 `sh tools/runtests.sh`、`node tests/e2e.js all`、ES5 檢查與完整建置，再確認 `wc -c dist/mengjiang.html`。只有所有測試通過且低於限制才 commit／push。
]

#align(center)[
  #v(8mm)
  #line(length: 70%, stroke: 0.8pt + rgb("c18a50"))
  #v(3mm)
  *文件結束｜請以 repository 內實際檔案與最新測試結果為準。*
]
