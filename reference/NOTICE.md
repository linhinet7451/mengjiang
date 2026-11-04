# reference/ — 使用說明 NOTICE

**Reference for comparison only, used with the original company's permission per the repo owner; never embedded in the game build.**

本資料夾的素材僅供比對參考；依 repo 擁有者（Tomas）表示，已取得原作公司同意使用；這些素材永遠不會內嵌到遊戲 build（dist/mengjiang.html 只含本作原創生成的美術）。

- 內容：官方宣傳片（reference/web2/video/，YouTube tcxWoC-Rtb8）、遊戲截圖（reference/fb/、reference/web3/、reference/*.jpg）、巴哈姆特精華區文章內嵌的遊戲截圖（reference/web2/bahamut/，每張的原始 URL 見 reference/web2/SOURCES.md）、宣傳／錄影影片（reference/video_ref*.mp4）。
- 巴哈姆特文章本文由玩家個人撰寫，**不在**此處；只保留我們整理的事實與來源索引（docs/sources-extracted/SOURCES-INDEX.md）。
- 建置工具（tools/build-assets.js、tools/build.js）不讀取 reference/；tests/unit-art.js 與 docs/美術素材來源.md 記錄遊戲內每張圖都是原創生成（含 sha256）。
- 不要把 reference/ 的任何檔案複製到 src/assets/。
