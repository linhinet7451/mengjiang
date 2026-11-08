# 來源索引（Source index）

> English: Index of every source cited in `src/data/provenance.json`, with URL, date, author, grade and the facts this project took from it. Raw HTML/text copies of forum posts are **not** included (Bahamut posts were written by individual players). `docs/sources-extracted/web2/c-*.json` holds only extracted facts, used by the web2 data patches and their unit tests.

產生方式：由 `src/data/provenance.json` 自動整理（2026-11-04）。等級：A 原版畫面／B 玩家攻略／C 推論／D 本作自訂。

## 整理後的事實檔（docs/sources-extracted/web2/）

| 檔案 | 來源 | 內容 |
|---|---|---|
| c-snA967-heroes.json | W967 | 61 名武將：品質（字色）、類型、被動、連攜 |
| c-snA967-skills.json | W967 | 普攻／六等／無雙倍率（表 5 寫法） |
| c-snA967-grids.json | W967 | 攻擊範圍格圖（■□●） |
| c-snA282-lv6.json | W282 | 14 張技能 tooltip 截圖讀出的 Lv6 範圍與數值 |
| c-snA4892-formations.json | W4892 | 8 張陣法 tooltip（名稱、Lv、加成） |
| c-snA541-recipes.json | W541 | 34 條 5 魂合成公式與規則 |
| c-p3-3-5.json | W6、W47、W48、W53、W60、S1 | 開放等級、Lv7–79 逐級經驗、19 組合摘錄與各品階魂量（含原文缺值／衝突） |

## 來源與採用的事實

### S1 — 【心得】1~60以後全攻略 內有你等不知道的小撇步（巴哈姆特精華區）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=41
- 作者：賀賀（gadder）；日期：2013-02-17；地區：台版；等級：B
- 採用的事實（32 筆 provenance）：
  - `lim.energy.orig`〔B〕原版精力規則（參考）：每關 1/2/3 點
  - `lim.retry.tower`〔D〕通天塔無限挑戰：P2：無限重打；塔俸改以勝場計（不看日期）
  - `lim.retry.wuji`〔D〕無極幻境無限挑戰：P2：無限挑戰（wujiLeft = ∞）；P3 改為無盡波次
  - `lim.recruitCd`〔D〕聚賢莊取消冷卻與每日次數：P2：沒有冷卻、沒有每日次數；四種刷新等級保留
  - `rec.tiers`〔B〕四種刷新等級：已有四種
  - `rec.goldSkip`〔B〕刷新金幣 10/50/200/500：P2 起金幣改為每次刷新費用（見 rec.perRefreshCost）
  - `rec.firstGuarantee`〔B〕紫金、至尊首刷保底：紫金保底藍、至尊保底紫
  - `rec.quality`〔B〕品質順序 黑<白<綠<藍<紫：config qualityNames 黑白綠藍紫
  - `rec.dismiss.black`〔B〕黑色不能遣散成將魂：黑色遣散不給將魂
  - `soul.cost.purple45`〔B〕紫將 45 魂召喚：19 位 45 魂（Tomas 決定 1：與 30 魂紫將並存）
  - `soul.cost.purple30`〔B〕30 魂紫將（令狐沖、周瑜、張無忌）：3 位 30 魂（Tomas 決定 1：保留）
  - `soul.combine`〔B〕5 魂合成 1 魂：P3：5 個同品質合成 1 個，不降品質；K1 兩種規則可切換（預設 S4）
  - `skill.liaoshang`〔C〕療傷：已實作：50% 機率回 8%
  - `skill.lianzhan`〔D〕連斬：已實作：20% 機率再攻擊一次
  - `skill.huajie`〔D〕化解：P4 已實作（效果與數值 D）
  - `grow.peiyang.cost`〔B〕培養每次 50 榮譽：P3：每次 50 榮譽；舊培養丹按比例換成榮譽
  - `grow.peiyang.options`〔B〕培養選項：重試／保持／替換：P3：重試／保持／替換
  - `grow.agiCap`〔B〕敏捷上限＝屬性×0.4：未採用
  - `grow.heroTypes`〔B〕武將類型：P3：6 位敏耐武將改為 4 種類型之一（C，Tomas 決定 5）
  - `grow.jx.irreversible`〔B〕將星錄灌注後不可取回：獻祭後不可逆
  - `grow.jx.openLv`〔B〕將星錄 30 級開放：P3：30 級開放；舊存檔已點亮的星保留
  - `st.tower.open`〔B〕通天塔 22 級開放：22 級
  - `st.tower.every10`〔B〕通天塔每 10 層獎勵：P3：每 10 層給裝備或紫裝碎片（內容 D）
  - `st.wuji.open`〔B〕無極幻境 12 級開放：12 級
  - `st.wuji.soul5`〔B〕無極每 5 波 1 魂：P3：無盡波次，每 5 波 1 個將魂；起點 1／41／81 波（S4），每次最多 40 波（D）
  - `st.xukong.kinds`〔B〕虛空四種關卡與隱藏關三星條件：普通、精英、王、隱藏；隱藏關要全圖三星
  - `st.shanggu`〔B〕上古寶窟（3 人組隊、3 關＋隱藏關）：P5：單機版：自己的隊伍連打 3 關（血量、怒氣延續），全破後 30% 機率出隱藏關（D）；掉將魂袋（B），袋內容與數量 D
  - `grow.honor`〔D〕榮譽來源與數量：競技場勝場、關卡獎勵、舊培養丹換算（數量 D）
  - `grow.minnai`〔C〕6 位敏耐武將轉型：段譽、黃藥師、周伯通、黃忠、甘寧、至尊寶依傷害種類改為 4 種類型之一；絕技武器換成同級對應武器
  - `st.shanggu.hidden`〔D〕隱藏關出現機率：全破後 30%
  - `st.shanggu.bags`〔D〕將魂袋內容：綠／藍／紫將魂袋：打開得 1 個該品質武將的將魂（隨機）
  - `web2.team.slots`〔B〕上陣人數：主角＋副將：1 級 3 人、15 級 4（D）、25 級 5、35 級 6、60 級 7、70 級 8（上限 8）

### S2 — 【攻略】新手導覽（巴哈姆特哈啦板）

- URL：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=1570
- 作者：水瀲；日期：2012-06-23；地區：台版；等級：B
- 採用的事實（13 筆 provenance）：
  - `lim.energy`〔D〕精力：P2 已取消：不檢查、不扣精力；player.energy 欄位保留不用
  - `lim.energy.orig`〔B〕原版精力規則（參考）：每關 1/2/3 點
  - `lim.retry.tower`〔D〕通天塔無限挑戰：P2：無限重打；塔俸改以勝場計（不看日期）
  - `lim.retry.wuji`〔D〕無極幻境無限挑戰：P2：無限挑戰（wujiLeft = ∞）；P3 改為無盡波次
  - `lim.retry.shanggu`〔D〕上古寶窟無限挑戰：P5：單機上古寶窟可無限挑戰，戰敗沒有懲罰
  - `rec.tiers`〔B〕四種刷新等級：已有四種
  - `rec.firstGuarantee`〔B〕紫金、至尊首刷保底：紫金保底藍、至尊保底紫
  - `rec.quality`〔B〕品質順序 黑<白<綠<藍<紫：config qualityNames 黑白綠藍紫
  - `soul.combineLv`〔B〕將魂合成 30 級開放：P3：主角 30 級開放
  - `grow.jx.irreversible`〔B〕將星錄灌注後不可取回：獻祭後不可逆
  - `st.tower.every10`〔B〕通天塔每 10 層獎勵：P3：每 10 層給裝備或紫裝碎片（內容 D）
  - `st.xukong.cards`〔B〕戰後抽牌、技能書掉落：—
  - `st.shanggu`〔B〕上古寶窟（3 人組隊、3 關＋隱藏關）：P5：單機版：自己的隊伍連打 3 關（血量、怒氣延續），全破後 30% 機率出隱藏關（D）；掉將魂袋（B），袋內容與數量 D

### S3 — 【心得】猛將無雙 入門指南 5.24更新（巴哈姆特哈啦板）

- URL：https://forum.gamer.com.tw/Co.php?bPage=0&bsn=22512&sn=15643&subbsn=1
- 作者：賀賀（gadder）；日期：2013-05-24；地區：台版；等級：B；備註：與 S1 同作者的更新版，不算獨立來源
- 採用的事實（15 筆 provenance）：
  - `skill.busi`〔B〕不死：已實作：復活一次，剩 1 血
  - `skill.suxing`〔B〕甦醒：已實作：復活一次，回 15% 血
  - `skill.liaoshang`〔C〕療傷：已實作：50% 機率回 8%
  - `skill.xinu`〔D〕息怒：已實作：對方無雙 −20
  - `skill.lianzhan`〔D〕連斬：已實作：20% 機率再攻擊一次
  - `skill.huizhan`〔D〕回斬：已實作：20% 機率反擊
  - `skill.rexue`〔D〕熱血：已實作：生命 +10%
  - `skill.rennai`〔D〕忍耐：P4 已實作（數值 D）
  - `skill.pozhou`〔D〕破咒：P4 已實作（數值 D）
  - `skill.pojia`〔D〕破甲：P4 已實作（效果 D）
  - `skill.dunhua`〔D〕鈍化：P4 已實作（效果 D）
  - `skill.suijia`〔D〕碎甲：P4 已實作（效果 D）
  - `skill.gjliaoshang`〔D〕高級療傷：P4 已實作（數值 D）
  - `skill.gjrexue`〔D〕高級熱血（規格書未列）：P4 已實作（Tomas 決定 7；名稱與效果 B，數值 D）
  - `grow.orange`〔B〕橙（橘）品質存在：P5：新增品質索引 5「橙」（只用於主角）

### S4 — 猛将无双将魂获得方法 将魂合成攻略（聚侠网）

- URL：https://www.juxia.com/news/2012-4-3/37222.html
- 作者：聚俠網；日期：2012-04-03；地區：陸版（崑崙）；等級：B；備註：陸版簡體，可能與台版不同
- 採用的事實（6 筆 provenance）：
  - `soul.cost.green`〔B〕綠將 1 魂召喚：黑／白／綠 1
  - `soul.cost.blue`〔B〕藍將 5 魂召喚：藍 5
  - `soul.cost.purple45`〔B〕紫將 45 魂召喚：19 位 45 魂（Tomas 決定 1：與 30 魂紫將並存）
  - `soul.combine`〔B〕5 魂合成 1 魂：P3：5 個同品質合成 1 個，不降品質；K1 兩種規則可切換（預設 S4）
  - `soul.sources`〔B〕將魂來源：虛空之門、無極幻境等：虛空掉落、聚賢莊遣散、無極每 5 波、上古寶窟將魂袋（P5）
  - `st.wuji.soul5`〔B〕無極每 5 波 1 魂：P3：無盡波次，每 5 波 1 個將魂；起點 1／41／81 波（S4），每次最多 40 波（D）

### V — 原版畫面：截圖與影片（reference/，見 docs/資料考證.md §1）

- URL：（無，本地）
- 作者：官方／玩家錄影；日期：2012–2013；地區：台版；等級：A
- 採用的事實（3 筆 provenance）：
  - `eq.dmgTypes`〔A〕物理、法術、絕技三種傷害：三種都有
  - `eq.stats.basic`〔A〕物攻、法攻、物防、法防、生命：已有
  - `st.xukong.content`〔C〕虛空各章名稱、敵人配置：8 章 72 關

### SPEC — Tomas 提供的還原計畫（pt12u）

- URL：（無，本地）
- 作者：Tomas；日期：2026-11-04；地區：—；等級：D；備註：規格書本身不是原版證據；四個來源找不到的項目一律暫列 D
- 採用的事實（17 筆 provenance）：
  - `lim.energy`〔D〕精力：P2 已取消：不檢查、不扣精力；player.energy 欄位保留不用
  - `lim.retry.xukong`〔D〕虛空之門無限挑戰：P2：無限重打，不耗精力；首通一次
  - `lim.daily`〔D〕取消每日次數：P2：競技場、觀星、轉盤、刷新、塔俸都不看日期；改以勝場或付費
  - `lim.recruitCd`〔D〕聚賢莊取消冷卻與每日次數：P2：沒有冷卻、沒有每日次數；四種刷新等級保留
  - `lim.realtime`〔D〕不得有現實時間等待：P2：訓練付銀立即完成、農田立即成熟、免費禮每 3 勝、七日禮立即依序領、簽到每 5 勝 1 次（Tomas 決定 2：保留並改為立即／可重複）
  - `lim.firstClear`〔D〕首通獎勵只拿一次：虛空、通天、無極、上古首通只發一次，一般獎勵可重複（有測試）
  - `rec.perRefreshCost`〔D〕每次刷新都付費：P2：普通免費；白金 50、紫金 200、至尊 500 金（Tomas 決定 3）
  - `rec.odds`〔D〕刷新品質機率：自訂機率，UI 已標 D
  - `eq.slots8`〔D〕八個裝備欄位：P5：8 格：武器、帽子（helm）、盔甲（armor）、披風、腰帶、戒指（ring）、玉墜（jade，新）、護手（glove，新）
  - `eq.weapon`〔D〕物攻／法攻武器二選一：P5：保留物攻、法攻、絕技三種（Tomas 決定 4），神武殿武器分頁可篩選
  - `eq.stats.new`〔D〕狀態抵抗、PVP 傷害、PVE 傷害、負面狀態施加機率：P4：狀態抵抗、施加機率、PVP、PVE 已接上戰鬥；P5 玉墜、護手提供這些屬性
  - `grow.leadPromote`〔D〕主角升階：20 藍、60 紫、90 橙：P5：主角 20 級藍、60 級紫、90 級橙；花銀幣 2 萬／30 萬／150 萬（D），全屬性 ×1.03／1.07／1.12（D）
  - `data.table`〔D〕獨立的資料分級表：本檔 src/data/provenance.json
  - `lim.realtime.training`〔D〕訓練立即完成：付銀幣立即得到 60 分鐘份的經驗，可重複
  - `lim.realtime.farm`〔D〕農田立即成熟：種下立即成熟；化肥改為收成 +50%
  - `lim.tickets`〔D〕以勝場代替日期的額外獎勵：免費禮每 3 勝、簽到／觀星／轉盤免費每 5 勝、塔俸以勝場計、歷練任務一輪一輪
  - `grow.maxLevel`〔D〕等級上限 90：80 → 90（為了 90 級升橙）

### W967 — 【攻略】武將技能一覽表(段譽降臨)（巴哈姆特哈啦板 snA=967）

- URL：https://forum.gamer.com.tw/C.php?bsn=22512&snA=967
- 作者：gjo3xu04（水瀲）；日期：2012-06-14～2013-05-23；地區：台版；等級：B
- 採用的事實（77 筆 provenance）：
  - `web2.hero.quality`〔B〕19 名武將品質修正：綠→藍 7、藍→紫 11、綠→紫 1（熊貓）
  - `web2.hero.type`〔B〕12 名武將類型修正：孫尚香/小喬 智耐、黃月英/雙兒 智敏、周伯通/曹操/呂布 力耐、典韋/滅絕/孫權/劉備/段譽 力敏；成長改為該類型成長
  - `web2.range.anchor`〔A〕範圍以施放者自己的格子為起點：技能範圍圖的起點是武將自己（往前數格）
  - `web2.range.count`〔B〕往前數的是「格上的活人」：dc 往前數同列活著的單位；e = dc − 前方我方人數，指到敵方第 r+dr 列由前往後第 e 個活人
  - `web2.range.block`〔C〕我方擋住前方格子：同列前方有活著的我方時，前排佔掉的格數不能打到敵人；前方我方陣亡後才打得到
  - `web2.range.convert`〔C〕舊範圍資料換算：本作 single/line/col… 範圍名換成以自己為起點的格子偏移
  - `web2.passive.two`〔B〕每將兩個被動：47 名既有武將改為 snA967 的 1～2 個被動（新武將 15 名同）；舊被動記在 passive0；沒在表上的 10 名＋主角照舊（D）
  - `web2.passive.values`〔B〕被動數值（v9）：熱血 +5%、息怒 30%、連斬 20%、不死 15%、破咒 30%、吸血 12%/10%、化解 30% 偷 10、忍耐 30%、療傷 50% 攻擊×20%、復甦 5%/15%/2 次、回斬 15%、虛弱 31%/−24%/5 回合、辟邪 −50%、還施彼身 50%/300、凝心 +1%+2%/級、殺氣訣／強刃／強甲 +10
  - `web2.partner`〔B〕連攜對象：58 名武將有連攜對象
  - `web2.hero.new15`〔B〕補上 15 名武將：袁紹、阿珂、天山童姥、董卓、鰲拜、張遼、左冷禪、顏良、李莫愁、無崖子、任我行、夏侯惇、小昭、紫雲、甄姬（名稱／品質／類型／被動／連攜 B；技能名／倍率／外觀 D）
  - `web2.range.glyph`〔C〕格圖換算：● 是空白對齊；武將所在列（奇數列取中間）第一格 ■ 是自己，往右是前方第 1、2…格；7 列無雙圖只取上下 2 列
  - `web2.skill.rates`〔B〕技能倍率基準：61 名武將採表 5；其餘未列武將維持 D
  - `web2.skill.activeCurve`〔C〕主動技能 Lv1/Lv6 倍率插值與固定值曲線
  - `web2.skill.ultProgression`〔D〕無雙來源基準與本作升級曲線
  - `web2.skill.rangeShapes`、`web2.skill.rangeLv6Rules`〔C/B〕及 `web2.range.hero.*`（61 筆）〔C〕既有武將普攻／六等／無雙格圖及逐人來源

### W60 — 將魂/品質表（巴哈姆特精華區 sn=60，轉貼百度）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=60
- 作者：巴哈玩家；日期：2012-12-29；地區：台版轉陸版；等級：B
- 採用的事實（3 筆 provenance）：
  - `web2.hero.quality`〔B〕19 名武將品質修正：綠→藍 7、藍→紫 11、綠→紫 1（熊貓）
  - `web2.hero.souls30`〔B〕30 魂紫將名單：任我行、令狐沖、曹操（45→30）、雙兒、虛竹、無崖子、阿紫、張無忌、周瑜；其餘紫 45
  - `web2.hero.white6`〔B〕6 名白將：曹豹、曹德、曹昂、曹節、丁管、汗貼摩（白品 B；其餘全 D）

### W77 — 陣法（巴哈姆特精華區 sn=77，8 張陣法面板截圖）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=77
- 作者：巴哈玩家；日期：2013-03；地區：台版；等級：A
- 採用的事實（2 筆 provenance）：
  - `web2.formation.cells8`〔A〕每陣 8 格：8 陣都是 8 格（八卦陣中宮虛位）；哪一格空著是本作設計
  - `web2.formation.kinds`〔A〕陣法加成種類：八卦 物+法攻、鋒矢 命中+攻、七星 暴擊+攻、雁行 敏捷、偃月 閃避+防、魚鱗 物+法防、錐行 減 NPC 傷害 16%（對玩家無效）+防

### W6 — 經驗表（巴哈姆特精華區 sn=6）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=6
- 作者：不知所云（anice0004720）；日期：2012-06-22；地區：台版（原文註明逐級表為對岸資料）；等級：B
- 採用的事實（P3-4）：Lv7–79 共 73 筆逐級經驗；原文 Lv72／73 皆為 892,766，照錄不修。其他等級保留本作 D 級邊界政策。

### W84 — 寶石數值（巴哈姆特精華區 sn=84）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=84
- 作者：巴哈玩家；日期：2013；地區：台版；等級：B
- 採用的事實：尚未採用（P3／P4 待辦，見 TODO.md）

### W86 — 心法（巴哈姆特精華區 sn=86／91）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=86
- 作者：巴哈玩家；日期：2013；地區：台版；等級：B
- 採用的事實：尚未採用（P3／P4 待辦，見 TODO.md）

### W88 — 生死劫（巴哈姆特精華區 sn=88）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=88
- 作者：巴哈玩家；日期：2013；地區：台版；等級：B
- 採用的事實：尚未採用（P3／P4 待辦，見 TODO.md）

### W51 — 戰場道具（巴哈姆特精華區 sn=51）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=51
- 作者：巴哈玩家；日期：2012；地區：台版；等級：B
- 採用的事實：尚未採用（P3／P4 待辦，見 TODO.md）

### W47 — 【情報】新增之將星錄（巴哈姆特精華區 sn=47）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=47
- 作者：☆猖獗☆（diabl9ooo）；日期：2012-11-26；地區：台版；等級：B
- 採用的事實（P3-5）：傲血忠魂（力耐 L1＋智敏 L2，物攻 +17）、天山霜雪（天山童姥／許褚／孫策 L2，法攻 +27／法防 +23／敏捷 +20）。條件可判斷，效果數字暫作來源文字呈現、不套入戰鬥，因原文未完整說明受益範圍與套用時點；runtime 另以 `web2.jiangxing.combatEffects` 標 D。

### W48 — 【討論】將星錄武將升級所需將魂數資料補完計劃（巴哈姆特精華區 sn=48）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=48
- 作者：賀賀（gadder）；日期：2012-11-26；地區：台版；等級：B；與 S1 同作者，非獨立作者證據。
- 採用的事實（P3-5）：提供白／綠／藍／紫將升級區間的部分魂數；表格有空白／欄位對齊不明處。白魂升至 Lv10 列 10 魂，與 W53 的 11 魂相異；runtime 欄位留空並標 C。

### W53 — 【問題】將星等級所需魂數（巴哈姆特精華區 sn=53）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=53
- 作者：Will（willwillhi）；日期：2012-12-16；地區：台版；等級：B。
- 採用的事實（P3-5）：白／綠／藍／30 魂紫／45 魂紫逐級表。依原表保留空白；白魂 Lv10 原文列 11，與 W48 的 10 有差異，未裁決。

### W4892 — 1.5.9 陣法優劣（巴哈姆特哈啦板 snA=4892）

- URL：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=4892
- 作者：巴哈玩家（轉自大陸玩家）；日期：2013-03-13；地區：陸版轉貼；等級：B；備註：內嵌 tooltip 截圖為 A
- 採用的事實：尚未採用（P3／P4 待辦，見 TODO.md）

### W541 — 合成公式表（巴哈姆特哈啦板 snA=541）

- URL：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=541
- 作者：巴哈玩家；日期：2012-06；地區：台版；等級：B
- 採用的事實（1 筆 provenance）：
  - `web2.hero.quality`〔B〕19 名武將品質修正：綠→藍 7、藍→紫 11、綠→紫 1（熊貓）

### W282 — 6 級技能範圍（巴哈姆特哈啦板 snA=282，14 張技能截圖）

- URL：https://m.gamer.com.tw/forum/C.php?bsn=22512&snA=282
- 作者：孤風蒼月；日期：2012-05-30～2013-02；地區：台版；等級：A；備註：截圖為原版畫面（A）；內文規則為 B
- 採用的事實（56 筆 provenance）：
  - `web2.hero.type`〔B〕12 名武將類型修正：孫尚香/小喬 智耐、黃月英/雙兒 智敏、周伯通/曹操/呂布 力耐、典韋/滅絕/孫權/劉備/段譽 力敏；成長改為該類型成長
  - `web2.slot.necklace`〔A〕玉墜部位改稱項鍊：只改顯示名稱，存檔欄位 jade 不變
  - `web2.skill.activeCurve`〔C〕、`web2.skill.capObserved`〔A〕、`web2.skill.capRule`〔C〕：技能曲線節點、傷害上限與引擎解讀
  - `web2.skill.rangeShapes`、`web2.skill.rangeLv6Rules` 及 49 筆 `web2.range.hero.*`〔C/B〕：49 張 W282 格位截圖中有 34 張原為 Lv6、15 張為 Lv7+ 推用；均優先於 W967 轉換格圖，模糊或高等級推用標 C

### W8 — 六等範圍規則（巴哈姆特精華區 sn=8）

- URL：https://forum.gamer.com.tw/G2.php?bsn=22512&sn=8
- 作者：未保存；日期：未保存；地區：台版；等級：B
- 採用的事實（2 筆 provenance）：
  - `web2.skill.rangeLv6Rules`〔B〕六大天王六等不變、紫將僅趙雲／呂布不變、藍將全變、無雙不變
  - `web2.skill.rangeShapes`〔C〕：W8 規則套用於既有範圍映射；逐名 shape entries 另直接引用 W967/W282

### WPV — 官方宣傳片「猛將無雙 ／ Facebook 臉書網頁遊戲 ／ 宣傳片」（YouTube，本地 reference/web2/video）

- URL：https://www.youtube.com/watch?v=tcxWoC-Rtb8
- 作者：XtremeLegend2013；日期：2013-11-04；地區：台版；等級：A
- 採用的事實（2 筆 provenance）：
  - `web2.range.anchor`〔A〕範圍以施放者自己的格子為起點：技能範圍圖的起點是武將自己（往前數格）
  - `web2.ultname.pv`〔A〕宣傳片無雙名：關羽 義薄雲天（A）；落英神劍→黃藥師、雷霆震怒→張飛、日月神功→任我行、驚鴻月斬→甄姬（C：片中未標武將）

## 衝突（conflicts）

- K1 將魂合成結果：5 個同品質將魂隨機合成 1 個，結果不會低於投入品質〔S4〕 ↔ 5 個合成下一階，也可能同階；有指定公式；30 紫魂 ×5 → 45 紫魂〔S1,S3〕
- K2 紫將需要的將魂數：紫將 45 魂〔S4〕 ↔ 另有 30 魂紫將（令狐沖、周瑜、張無忌）〔S1,S3〕
- K3 最低品質名稱：黑〔S1,S2〕 ↔ 灰（第 3 樓引述 NPC 紫雲：灰白綠藍紫）〔S2〕
- K4 上古寶窟分階：25/35/45/60 四階〔S2〕 ↔ 25/35/45/60/70/80〔S1,S3〕
- K5 聚賢莊金幣的意義：金幣是冷卻加速費，冷卻結束後免費刷新〔S1,S2〕 ↔ 取消冷卻，每次刷新付 10/50/200/500 金〔SPEC〕
- K6 非主角武將能不能是敏耐：武將只有力敏、力耐、智敏、智耐 4 種，只有主角能配成敏耐〔S1,S3〕 ↔ 現有資料有 6 位敏耐武將（段譽、黃藥師、周伯通、黃忠、甘寧、至尊寶）〔〕
- K7 武器類型：物攻、法攻武器二選一〔SPEC〕 ↔ 原版有物理、法術、絕技三種傷害〔V〕
- K8 療傷數值：「每回和50%回血」：可解讀為 50% 機率回血〔S3〕 ↔ 「每回和50%回血」：可解讀為每回合回 50% 血〔S3〕
- K9 副本每日次數：無極、通天、上古每天 2 次，用道具多 1 次〔S1,S2〕 ↔ 無限挑戰〔SPEC〕
- K10 孫權／東方不敗／夏侯惇 的將魂數：紫將有公式的要 30 個（此三人在公式表中有公式）〔W541〕 ↔ 30 魂紫將名單不含此三人（45 魂）〔W60,W967〕
- K11 吸血機率：攻擊有 12% 機率轉化 10% 傷害〔W967〕 ↔ Lv1 10% 機率／10%（技能說明圖）〔W282〕
- K12 紫霞與紫雲的「往昔若凝」：往昔若凝是紫雲的無雙（治療）〔W967,W282〕 ↔ 本作原有紫霞無雙「往昔若凝」（登場資料）〔S1〕
- P3R-JX-WHITE-L10 白魂升至 Lv10 所需魂數：11〔W53，2012-12-16〕 ↔ 10〔W48，2012-11-26〕；處理：保留兩說，runtime 留空、升級阻擋，待補直接圖證。

## 未取得的來源

- Wayback mjws.snsyx.com（http://web.archive.org/web/20160313044608/http://mjws.snsyx.com/，2016-03-13 快照）：原檔 0 bytes，未取得內容。
- 巴哈精華區其他 sn（sn4、sn8、sn15、sn17、sn43、sn59、sn62 等）：見 `docs/網路資料搜查-2.md` 來源表；URL 格式 https://forum.gamer.com.tw/G2.php?bsn=22512&sn=<sn>。
