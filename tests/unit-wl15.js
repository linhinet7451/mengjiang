// WL-15：虛空之門 ch14–16／通天塔 240 層／無極幻境 w6＋w7——Lv80 頂尖隊壓線門檻（D 級原創）。
// 目的：16 章 144 關；bossScale 16 章［…6／7／16］；wujiScale2 {1.10, 220}；TOWER_MAX 240；G.WUJI 7 檔；
// 終關門檻為帶狀（Lv80 頂尖隊勝率約 50–70% 且勝場殘血低，見設計 §1.2）：s16_8／s16_9／F240 單場 12 種子、
// w7 全程 6 種子（全破 2–6／6 且平均通過 ≥37 波，避免 brittle）；新首領小叮噹／皮卡丘守 s14_8／s15_8
// （Tomas 2026-11-11 23:15 補充，設計 §3.5）；舊頂 F150／W200／s13_8／s13_9 回歸；存檔 v12 不變。
// 用法：node tests/unit-wl15.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c = fresh(), M = c.MJ, G = M.G, R = M.R, U = M.U, D = M.D, S = M.S;

console.log('[小叮噹／皮卡丘專屬設定]');
var sd = D.heroes.list.filter(function (h) { return h.id === 'doraemon'; })[0], sp = D.heroes.list.filter(function (h) { return h.id === 'pikachu'; })[0];
ok(sd.type === '智耐' && sd.growth.int === 3.42 && sd.growth.con === 3.03 && sd.active.mult === 1.8 && sd.active.fx.armorBreak === 0.5 && sd.ult.mult === 2.2 && sd.ult.fx.stun === 0.3 && sd.passive === 'dabaodai', '小叮噹：智耐模板、空氣砲破防、任意門眩暈、百寶袋');
ok(sp.type === '智敏' && sp.growth.int === 3.24 && sp.growth.agi === 3.25 && sp.active.mult === 2 && sp.ult.mult === 2.4 && sp.passive === 'jingdian', '皮卡丘：智敏模板、電光一閃 ×2、十萬伏特 ×2.4、靜電');
var stTop = { player: { leadQ: 3 }, codex: {}, team: { formation: null } }, hd = { id: 'doraemon', lv: 90, star: 5, py: {}, xf: [], eq: {} }, hp = { id: 'pikachu', lv: 90, star: 5, py: {}, xf: [], eq: {} };
ok(R.power(hd, stTop) === 8309, '小叮噹 Lv90／5星基礎戰力 8,309');
ok(R.derived(hp, stTop).agi === 488 && R.derived(hp, stTop).crit === 12, '皮卡丘 Lv90／5星敏捷 488、靜電暴擊 +12');

console.log('[新章結構]');
ok(D.stages.chapters.length === 16, '共 16 章');
ok(D.stages.stages.length === 144, '共 144 關（117 + 27）');
var ch14 = D.stages.chapters[13], ch15 = D.stages.chapters[14], ch16 = D.stages.chapters[15];
ok(ch14.id === 14 && ch14.name === '蓬萊仙島' && ch14.lv === 80 && ch14.bg === '#1a5a6a', 'ch14 蓬萊仙島 Lv80（解鎖 Lv80）');
ok(ch15.id === 15 && ch15.name === '終南絕巔' && ch15.lv === 80 && ch15.bg === '#6a5a3a', 'ch15 終南絕巔 Lv80（解鎖 Lv80）');
ok(ch16.id === 16 && ch16.name === '九重天' && ch16.lv === 80 && ch16.bg === '#3a3a6a', 'ch16 九重天 Lv80（解鎖 Lv80）');
ok(JSON.stringify(ch14.pool) === JSON.stringify(['hs_jianke', 'hs_baituo', 'hs_tiezhang', 'hs_yinshi', 'dz_qinwei']), 'ch14 敵池 5 模板（華山池＋親衛）');
ok(JSON.stringify(ch15.pool) === JSON.stringify(['mj_jiaozhong', 'em_dizi', 'kl_dizi', 'wd_dizi']), 'ch15 敵池 4 模板（ch4 光明頂池）');
ok(JSON.stringify(ch16.pool) === JSON.stringify(['ry_jiaozhong', 'ry_zhanglao', 'ry_anqi', 'ry_hufa', 'dz_qinwei']), 'ch16 敵池 5 模板（日月池＋親衛）');
ok(JSON.stringify(ch14.elite) === JSON.stringify(['e_ouyangke', 'e_qiuqianren']) && ch14.boss === 'doraemon' && ch14.hidden === 'xiexun', 'ch14 精英／王／隱藏：歐陽克／裘千仞／小叮噹／金毛獅王（§3.5）');
ok(JSON.stringify(ch15.elite) === JSON.stringify(['e_luzhangke', 'e_hebiweng']) && ch15.boss === 'pikachu' && ch15.hidden === 'b_dongfang', 'ch15 精英／王／隱藏：鹿杖客／鶴筆翁／皮卡丘／東方不敗（§3.5）');
ok(JSON.stringify(ch16.elite) === JSON.stringify(['e_xiangwentian', 'e_yanglianting']) && ch16.boss === 'b_lvbu' && ch16.hidden === 'b_dugu', 'ch16 精英／王／隱藏：向問天／楊蓮亭／呂布／獨孤求敗');
ok(JSON.stringify(ch14.souls) === JSON.stringify(['huangrong', 'guojing', 'zhoubotong', 'ouyangfeng', 'hongqigong', 'huangyaoshi']), 'ch14 將魂輪替：黃蓉／郭靖／周伯通／歐陽鋒／洪七公／黃藥師');
ok(JSON.stringify(ch15.souls) === JSON.stringify(['xiaolongnv', 'yangguo', 'zhangwuji', 'xiaozhao', 'wuyazi', 'tianshan']), 'ch15 將魂輪替：小龍女／楊過／張無忌／小昭／無崖子／天山童姥');
ok(JSON.stringify(ch16.souls) === JSON.stringify(['guanyu', 'zhangfei', 'machao', 'huangzhong', 'lvbu', 'zhaoyun']), 'ch16 將魂輪替：關羽／張飛／馬超／黃忠／呂布／趙雲（同 ch13）');
ok(ch14.stageNames[0] === '蓬萊閣' && ch14.stageNames[8] === '羽化仙境' && ch15.stageNames[8] === '古墓密室' && ch16.stageNames[7] === '九重天之巔' && ch16.stageNames[8] === '混沌之境', '三章關名（蓬萊閣／羽化仙境／古墓密室／九重天之巔／混沌之境）');
ok(ch14.desc.indexOf('仙山') >= 0 && ch15.desc.indexOf('終南') >= 0 && ch16.desc.indexOf('九重天') >= 0, '三章描述文案');
[14, 15, 16].forEach(function (ch) {
  var ss = D.stages.stages.filter(function (s) { return s.ch === ch; });
  ok(ss.length === 9 && ss.filter(function (s) { return s.kind === 'normal'; }).length === 5 && ss.filter(function (s) { return s.kind === 'elite'; }).length === 2 && ss.filter(function (s) { return s.kind === 'boss'; }).length === 1 && ss.filter(function (s) { return s.kind === 'hidden'; }).length === 1, 'ch' + ch + ' 共 9 關（普通 5／精英 2／王 1／隱藏 1）');
  ok(ss.every(function (s) { return s.enemies.length === 9; }), 'ch' + ch + ' 每關 9 名敵人');
  ok(ss.every(function (s) { return s.lv === 90; }), 'ch' + ch + ' 等級全 Lv90');
});
var byId = {};
D.stages.stages.forEach(function (s) { byId[s.id] = s; });
ok(byId['s14_8'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'doraemon' && byId['s14_8'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's14_8 首領小叮噹 cell 4 Lv91（§3.5）');
ok(byId['s15_8'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'pikachu' && byId['s15_8'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's15_8 首領皮卡丘 cell 4 Lv91（§3.5）');
ok(byId['s16_8'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'b_lvbu' && byId['s16_8'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's16_8 首領呂布 cell 4 Lv91（關卡 Lv90＋1，金框）');
ok(byId['s16_9'].enemies.filter(function (e) { return e.cell === 4; })[0].e === 'b_dugu' && byId['s16_9'].enemies.filter(function (e) { return e.cell === 4; })[0].lv === 91, 's16_9 隱藏首領獨孤求敗 cell 4 Lv91');
ok(D.stages.stages.filter(function (s) { return s.ch >= 14; }).every(function (s) { return s.enemies.every(function (e) { return D.stages.enemies[e.e]; }); }), '新章全部敵人 id 皆存在於 enemies 表');
ok([14, 15, 16].every(function (ch) { return D.stages.chapters[ch - 1].souls.every(function (id) { return D.heroes.list.some(function (h) { return h.id === id; }); }); }), '新章全部將魂 id 皆為 90 名武將之一');

console.log('[關卡表與獎勵（設計 §3.3）]');
ok(byId['s14_1'].silver === 718 && byId['s14_1'].exp === 539 && byId['s14_1'].first.gold === 5 && byId['s14_1'].first.silver === 1590, 's14_1 獎勵：銀 718／經驗 539／首通金 5／首通銀 1590（Lv90 同 s13）');
ok(byId['s16_8'].silver === 1687 && byId['s16_8'].exp === 1267 && byId['s16_8'].first.gold === 30 && byId['s16_8'].first.silver === 3737, 's16_8 獎勵：銀 1687／經驗 1267／首通金 30／首通銀 3737');
ok(byId['s16_9'].silver === 2082 && byId['s16_9'].exp === 1563 && byId['s16_9'].first.gold === 500 && byId['s16_9'].first.silver === 4612, 's16_9 獎勵：銀 2082／經驗 1563／首通金 500（里程碑）／首通銀 4612');
ok(byId['s16_9'].first.items.some(function (it) { return it.item === 'zizhuang_frag' && it.n === 30; }) && byId['s16_9'].first.items.some(function (it) { return it.item === 'soul:zhaoyun' && it.n === 5; }), 's16_9 首通物品：紫裝碎片 ×30＋趙雲將魂 ×5（全遊戲最高里程碑）');
ok(byId['s14_8'].first.items.some(function (it) { return it.item === 'xf_kuihua' && it.n === 1; }) && byId['s15_8'].first.items.some(function (it) { return it.item === 'xf_lingbo' && it.n === 1; }) && byId['s16_8'].first.items.some(function (it) { return it.item === 'xf_jiuyang' && it.n === 1; }), '三章王首通心法：ch14 葵花／ch15 凌波／ch16 九陽');
ok(byId['s14_8'].drops.some(function (d) { return d.item === 'soul:huangrong' && d.chance === 0.25; }) && byId['s15_8'].drops.some(function (d) { return d.item === 'soul:xiaolongnv' && d.chance === 0.25; }) && byId['s16_8'].drops.some(function (d) { return d.item === 'soul:zhaoyun' && d.chance === 0.25; }), '三章王第二魂 @25%＝該章隱藏首通魂（黃蓉／小龍女／趙雲）');
ok(byId['s14_9'].drops.some(function (d) { return d.item === 'soul:huangrong' && d.n === 3 && d.chance === 0.8; }) && byId['s15_9'].drops.some(function (d) { return d.item === 'soul:xiaolongnv' && d.n === 3 && d.chance === 0.8; }) && byId['s16_9'].drops.some(function (d) { return d.item === 'soul:zhaoyun' && d.n === 3 && d.chance === 0.8; }), '三章隱藏魂 ×3 @80%＝該章隱藏首通魂');
ok(D.stages.stages.filter(function (s) { return s.ch >= 14; }).every(function (s) { return s.drops.some(function (d) { return d.item.indexOf('gem_') === 0 && /_5$/.test(d.item); }); }), '新章寶石掉落皆為 Lv5');
ok(D.stages.stages.filter(function (s) { return s.ch >= 14; }).every(function (s) { return s.drops.filter(function (d) { return d.item.indexOf('eq:') === 0; }).every(function (d) { return /1$/.test(d.item); }); }), '新章 54 條裝備掉落皆為 Lv1（WL-10 規則）');

console.log('[解鎖鏈]');
ok(byId['s14_1'].unlock === 's13_8' && byId['s15_1'].unlock === 's14_8' && byId['s16_1'].unlock === 's15_8', '新章首關解鎖：s14_1←s13_8、s15_1←s14_8、s16_1←s15_8');
ok(byId['s14_9'].unlock === 'all3star' && byId['s15_9'].unlock === 'all3star' && byId['s16_9'].unlock === 'all3star', '三章隱藏關皆為 all3star');
(function () {
  var c2 = fresh(), G2 = c2.MJ.G, S2 = c2.MJ.S;
  G2.lead().lv = 80;
  S2.state.stages['s13_8'] = { stars: 3, clears: 1 };
  ok(G2.chapterUnlocked(14) && G2.stageUnlocked('s14_1'), '主角 Lv80、通關 s13_8：ch14 與 s14_1 解鎖');
  ok(!G2.chapterUnlocked(15) && !G2.chapterUnlocked(16), '未通關 s14_8：ch15／ch16 仍鎖定');
  S2.state.stages['s14_8'] = { stars: 3, clears: 1 };
  S2.state.stages['s15_8'] = { stars: 3, clears: 1 };
  ok(G2.chapterUnlocked(16) && G2.stageUnlocked('s16_1'), '通關 s15_8：ch16 與 s16_1 解鎖');
  ok(!G2.stageUnlocked('s16_9'), 's16_9 未全三星：仍鎖定');
  ['s16_1', 's16_2', 's16_3', 's16_4', 's16_5', 's16_6', 's16_7', 's16_8'].forEach(function (id) { S2.state.stages[id] = { stars: 3, clears: 1 }; });
  ok(G2.stageUnlocked('s16_9'), '本章其餘 8 關皆三星：s16_9 解鎖');
})();

console.log('[bossScale／wujiScale2／塔／幻境定義]');
var bs = D.config.bossScale;
ok(bs.length === 16 && JSON.stringify(bs) === JSON.stringify([1.22, 1.68, 2.57, 2.42, 2.78, 3.78, 3.68, 3.1, 2.73, 2.42, 2.6, 2.9, 3.0, 6, 7, 16]), 'bossScale 為 16 章表（舊 13 章不動，新章 6／7／16）');
ok(bs[13] === 6 && bs[14] === 7 && bs[15] === 16, '新章倍率：ch14 6／ch15 7／ch16 16');
ok(JSON.stringify(D.config.wujiScale2) === JSON.stringify({ mult: 1.1, from: 220 }), 'wujiScale2 {mult: 1.10, from: 220}（幻境第二階段倍率）');
ok(G.TOWER_MAX === 240, 'TOWER_MAX＝240（OD-5：塔頂 F250→F240）');
ok(G.WUJI.length === 7, '無極幻境共 7 檔');
var t6 = G.wujiTier('w6'), t7 = G.wujiTier('w7');
ok(t6 && t6.name === '神武之境' && t6.open === 70 && t6.start === 201 && t6.waves === 40, 'w6 神武之境：Lv70 開、201–240 波');
ok(t7 && t7.name === '無上之境' && t7.open === 75 && t7.start === 241 && t7.waves === 40, 'w7 無上之境：Lv75 開、241–280 波');
ok(t6.first.gold === 700 && JSON.stringify(t6.first.items) === JSON.stringify([{ item: 'shenjishu', n: 2 }]), 'w6 首破：金 700＋神農書 ×2');
ok(t7.first.gold === 1000 && JSON.stringify(t7.first.items) === JSON.stringify([{ item: 'seed_soul', n: 3 }]), 'w7 首破：金 1000＋種子魂 ×3');
ok(t6.bonus.items.some(function (it) { return it.item === 'shenjishu' && it.n === 4; }) && t6.bonus.items.some(function (it) { return it.item === 'xinfacanye' && it.n === 6; }) && t6.bonus.items.some(function (it) { return it.item === 'gem_atk_6' && it.n === 1; }), 'w6 全破 bonus：神農書 ×4／心法殘頁 ×6／gem_atk_6 ×1');
ok(t7.bonus.items.some(function (it) { return it.item === 'shenjishu' && it.n === 5; }) && t7.bonus.items.some(function (it) { return it.item === 'xinfacanye' && it.n === 8; }) && t7.bonus.items.some(function (it) { return it.item === 'gem_hp_6' && it.n === 1; }), 'w7 全破 bonus：神農書 ×5／心法殘頁 ×8／gem_hp_6 ×1');
var f240 = G.towerFloor(240), f150 = G.towerFloor(150);
ok(f240.kind === 'boss' && f240.enemies.length === 9 && f240.enemies[0].lv === 91, 'F240 王層、9 人、首領 Lv91（OD-5 定案新頂）');
ok(f240.first.gold === 290 && f240.first.items.some(function (it) { return it.item === G.FRAG && it.n === 20; }), 'F240 登頂里程碑：金 290（140＋150）＋紫裝碎片 ×20');
ok(f150.first.gold === 195 && f150.first.items.some(function (it) { return it.item === G.FRAG && it.n === 15; }), 'F150 里程碑不變：金 195＋紫裝碎片 ×15（現為中途里程碑）');
ok(G.ACH.filter(function (a) { return a.id === 'a_tower'; })[0].tiers.indexOf(240) >= 0, '成就凌雲之志加 240 階（OD-5）');
ok(G.ACH.filter(function (a) { return a.id === 'a_tower'; })[0].tiers.indexOf(150) >= 0, '成就凌雲之志仍含 150 階');
(function () { var save = S.state.tower.best; S.state.tower.best = 240; var sw = G.towerSweepReward(); S.state.tower.best = save; ok(sw.silver === 36000 && sw.items.some(function (it) { return it.item === 'peiyangdan' && it.n === 24; }), '塔俸 best=240 時銀 36,000＋培養丹 ×24（公式自動提高；OD-5）'); })();

console.log('[新首領：小叮噹／皮卡丘（設計 §3.5）]');
var enD = D.stages.enemies.doraemon, enP = D.stages.enemies.pikachu;
ok(!!enD && enD.name === '小叮噹' && enD.type === '智耐' && enD.pattern === 'line2' && enD.ult === 'all' && enD.boss === 1, 'enemies 有 doraemon 模板（智耐／line2／all／boss）');
ok(!!enP && enP.name === '皮卡丘' && enP.type === '智敏' && enP.pattern === 'line2' && enP.ult === 'all' && enP.boss === 1, 'enemies 有 pikachu 模板（智敏／line2／all／boss）');
ok(enD.actName === '空氣砲' && enD.actMult === 1.8 && enD.actFx.armorBreak === 0.5 && enD.ultName === '任意門' && enD.ultMult === 2.2 && enD.ultFx.stun === 0.3 && enD.ultFlat === 200 && enD.passive === 'dabaodai', 'doraemon 技能欄位：空氣砲 ×1.8 破防／任意門 ×2.2 眩暈／百寶袋');
ok(enP.actName === '電光一閃' && enP.actMult === 2 && enP.ultName === '十萬伏特' && enP.ultMult === 2.4 && enP.ultFlat === 200 && enP.passive === 'jingdian', 'pikachu 技能欄位：電光一閃 ×2.0／十萬伏特 ×2.4／靜電');
var uD = R.enemyUnit({ e: 'doraemon', cell: 4, lv: 91 }, byId['s14_8']);
ok(uD.active.name === '空氣砲' && uD.active.mult === 1.8 && uD.active.pattern === 'line2' && uD.active.fx.armorBreak === 0.5, 's14_8 首領單位主動：空氣砲 ×1.8／line2／破防');
ok(uD.ult.name === '任意門' && uD.ult.mult === 2.2 && uD.ult.pattern === 'all' && uD.ult.flat === 8532 && uD.ult.fx.stun === 0.3, 's14_8 首領單位無雙：任意門 ×2.2／all／flat 8532／30%眩暈');
ok(uD.passive === 'dabaodai', 's14_8 首領單位被動：百寶袋');
var uP = R.enemyUnit({ e: 'pikachu', cell: 4, lv: 91 }, byId['s15_8']);
ok(uP.active.name === '電光一閃' && uP.active.mult === 2 && uP.active.pattern === 'line2', 's15_8 首領單位主動：電光一閃 ×2.0／line2');
ok(uP.ult.name === '十萬伏特' && uP.ult.mult === 2.4 && uP.ult.pattern === 'all' && uP.ult.flat === 9954, 's15_8 首領單位無雙：十萬伏特 ×2.4／all／flat 9954');
ok(uP.passive === 'jingdian', 's15_8 首領單位被動：靜電');
var uL = R.enemyUnit({ e: 'b_lvbu', cell: 4, lv: 91 }, byId['s13_8']);
ok(uL.active.name === '呂布之擊' && uL.active.mult === 1 && uL.ult.name === '絕技·呂布' && uL.ult.mult === 1.6 && uL.passive == null, '既有首領（無新欄位）行為不變：通用名、主動 ×1、無雙 ×1.6、無被動');
ok(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'assets-map.js'), 'utf8').indexOf("doraemon: 'h_doraemon'") >= 0 && fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'assets-map.js'), 'utf8').indexOf("pikachu: 'h_pikachu'") >= 0, 'assets-map.js E 表有 doraemon→h_doraemon、pikachu→h_pikachu（WL-14 美術；瀏覽器端 MJ.ART_ENEMY 由 e2e 驗）');
ok(ch14.boss === 'doraemon' && byId['s14_8'].enemies.filter(function (e) { return e.leader; })[0].e === 'doraemon', 'ch14.boss 與 s14_8 leader 一致（小叮噹）');
ok(ch15.boss === 'pikachu' && byId['s15_8'].enemies.filter(function (e) { return e.leader; })[0].e === 'pikachu', 'ch15.boss 與 s15_8 leader 一致（皮卡丘）');
// 幻境第二階段倍率只套幻境：主線王關不受 wujiScale2 影響、幻境 W220 以下不受影響
(function () {
  var spec = { e: 'zj_boss', lv: 80, leader: 1 };
  var base = R.enemyUnit(spec, { kind: 'normal', ch: 1, depth: 0 });
  var w220 = R.enemyUnit(spec, { kind: 'normal', ch: 1, depth: 0, wave: 220 });
  var w230 = R.enemyUnit(spec, { kind: 'normal', ch: 1, depth: 0, wave: 230 });
  ok(Math.abs(w220.patk / base.patk - Math.pow(1.08, 17)) < 0.03, 'W220 只有 wujiScale ×1.08^17（≈3.70），不受 wujiScale2 影響（from=220，當波倍率 ×1）');
  ok(Math.abs(w230.patk / w220.patk - 1.08 * 1.1) < 0.03, 'W230 再 ×1.08（wujiScale）×1.10（wujiScale2），合計 ×1.188');
  var mainBase = R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0 });
  ok(mainBase.patk === R.enemyUnit(spec, { kind: 'boss', ch: 1, depth: 0 }).patk, '主線王關數值不受塔／幻境倍率影響（floor／wave 為 null）');
})();

console.log('[終關門檻：Lv80 頂尖隊（12 種子單場／6 種子全程，實戰 stacked 口徑）]');
function topTeam(lv) { return G.arenaTopFoe(1, lv).foes; }
function hpLeft(res) {
  var hp = 0, mx = 0;
  U.each(res.units, function (u) { if (u.side === 'A') { hp += Math.max(0, u.hp); mx += u.maxHp; } });
  return mx ? hp / mx : 0;
}
function gateTop(stageId, lv, seeds) {
  var sg = D.stageIndex[stageId], w = 0, hpSum = 0, hpN = 0;
  for (var sd = 1; sd <= seeds; sd++) {
    var seed = sd * 977 + 3;
    var foes = G.drawFoes(sg, seed);
    G.applyStageAffix(sg, foes, seed);
    var re = G.drawReinforce(sg, seed);
    var r = M.Battle.run(topTeam(lv), foes, { seed: seed, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression, fieldItems: sg.fieldItems || [], double: false, reinforce: re && re.length ? { units: re } : null, event: G.eventFor(seed) });
    if (r.win) { w++; hpSum += hpLeft(r); hpN++; }
  }
  return { wins: w, n: seeds, hp: hpN ? hpSum / hpN : 0 };
}
var g;
g = gateTop('s16_8', 80, 12);
ok(g.wins >= 4 && g.wins <= 10 && g.hp >= 0.05 && g.hp <= 0.5, 's16_8 王關 Lv80 頂尖隊：勝 ' + g.wins + '/12、勝場殘血 ' + (g.hp * 100).toFixed(1) + '%（設計 58%／23.9%，帶狀驗收）');
g = gateTop('s16_9', 80, 12);
ok(g.wins >= 3 && g.wins <= 9 && g.hp >= 0.01 && g.hp <= 0.3, 's16_9 隱藏關 Lv80 頂尖隊：勝 ' + g.wins + '/12、勝場殘血 ' + (g.hp * 100).toFixed(1) + '%（設計 50%／6.9%，教科書級險勝）');
function towerTop(f, lv, seeds) {
  var w = 0, hpSum = 0, hpN = 0;
  for (var sd = 1; sd <= seeds; sd++) {
    var sg = G.towerFloor(f);
    var r = M.Battle.run(topTeam(lv), G.buildEnemy(sg), { seed: sd * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (r.win) { w++; hpSum += hpLeft(r); hpN++; }
  }
  return { wins: w, hp: hpN ? hpSum / hpN : 0 };
}
// OD-5 定案新頂 F240（主代理 2026-11-11 23:50）：原 F250 實測 12/12、殘血 38% 超出帶狀，
// 16 章後 chapterOf 循環改變使設計校準失效；F240 梯度最乾淨（Lv79 42%／9.1% → Lv80 50%／9.6% →
// Lv81 58%／10.7%，見 balance §16）；F280 亦在帶內但 Lv81 plateau，不取。F250／F280 皆不可達，不留死斷言。
g = towerTop(240, 80, 12);
ok(g.wins >= 4 && g.wins <= 8 && g.hp >= 0.05 && g.hp <= 0.25, 'F240 Lv80 頂尖隊：勝 ' + g.wins + '/12、勝場殘血 ' + (g.hp * 100).toFixed(1) + '%（OD-5 定案新頂，帶狀 4–8 勝／殘血 5–25%）');
function wujiFullRun(tier, lv, seed) {
  var team = topTeam(lv), cleared = 0, lastHp = 1;
  for (var w = 0; w < tier.waves; w++) {
    var sg = G.wujiWave(tier, w, seed);
    var cur = U.map(team, function (x) { return { cell: x.cell, unit: x.unit }; });
    var res = M.Battle.run(cur, G.buildEnemy(sg), { seed: (seed + w * 977) >>> 0, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (!res.win) break;
    cleared++; lastHp = hpLeft(res);
    var next = [];
    U.each(res.units, function (u) {
      if (u.side !== 'A' || u.hp <= 0) return;
      var c0 = u.cell0 != null ? u.cell0 : u.cell;
      var src = U.find(cur, function (x) { return x.cell === c0; });
      var nu = U.extend({}, src.unit); nu.curHp = u.hp; nu.curRage = u.rage;
      next.push({ cell: c0, unit: nu });
    });
    team = next;
  }
  return { cleared: cleared, lastHp: lastHp };
}
(function () {
  var full = 0, sum = 0;
  for (var sd = 1; sd <= 6; sd++) { var r = wujiFullRun(G.wujiTier('w7'), 80, sd * 7919); sum += r.cleared; if (r.cleared === 40) full++; }
  ok(full >= 1 && full <= 6 && sum / 6 >= 37, 'w7 全程 Lv80 頂尖隊：全破 ' + full + '/6、平均通過 ' + (sum / 6).toFixed(1) + '/40 波（小叮噹強化後新基準）');
})();
(function () {
  var full = 0, sum = 0;
  for (var sd = 1; sd <= 6; sd++) { var r = wujiFullRun(G.wujiTier('w6'), 80, sd * 7919); sum += r.cleared; if (r.cleared === 40) full++; }
  ok(full === 6, 'w6 全程 Lv80 頂尖隊：全破 ' + full + '/6（過渡檔，應仍全破）');
})();

console.log('[max@90 梯度（真實首領，設計 §3.5 probe9：ch14 約 67%、ch15 約 58%、ch16 0%）]');
function maxTeam(L) {
  var cc = load(), Mx = cc.MJ, Gx = Mx.G, Sx = Mx.S, Dx = Mx.D, Rx = Mx.R, Ux = Mx.U;
  Gx.newGame('測試', '力耐', 'm', 1);
  var sx = Sx.state;
  Gx.lead().lv = L; Gx.lead().sk = { a: 10, u: 10, p: 10 }; Gx.lead().star = 5;
  var py = Math.floor(10 + 1.5 * L); Gx.lead().py = { str: py, int: py, agi: py, con: py };
  sx.player.leadQ = L < 20 ? 2 : L < 60 ? 3 : 4;
  sx.team.cells = {}; sx.team.cells[4] = Gx.lead().uid;
  var order = [1, 7, 0, 6, 2, 8, 3];
  ['zhaoyun', 'guanyu', 'zhangfei', 'huangzhong', 'machao', 'diaochan', 'lvbu'].forEach(function (id, i) {
    var h = Gx.newHero(id, sx); h.lv = L; h.sk = { a: 10, u: 10, p: 10 }; h.star = 5; h.py = { str: py, int: py, agi: py, con: py };
    sx.heroes.push(h); sx.team.cells[order[i]] = h.uid;
  });
  function gear(h) {
    var dt = h.id === 'lead' ? 'p' : (Rx.heroDef(h.id).type.charAt(0) === '力' ? 'p' : Rx.heroDef(h.id).type.charAt(0) === '智' ? 'm' : 'j');
    Ux.each(Rx.SLOTS, function (slot) {
      var best = null;
      Ux.each(Dx.equipment.list, function (e) { if (e.slot !== slot || e.lv > 54) return; if (slot === 'weapon' && e.id.charAt(1) !== dt) return; if (!best || e.lv > best.lv) best = e; });
      if (best) h.eq[slot] = { uid: 0, t: best.id, q: 3, plus: L, aff: [], gems: [] };
    });
  }
  sx.heroes.forEach(function (h) { gear(h); });
  for (var n = 0; n < 90; n++) sx.codex['sim' + n] = 1;
  return { Mx: Mx, Gx: Gx, Sx: Sx, Dx: Dx };
}
function maxWins(stageId, seeds) {
  var w = 0;
  for (var sd = 1; sd <= seeds; sd++) {
    var t = maxTeam(90), Mx = t.Mx, Gx = t.Gx, Dx = t.Dx;
    var sg = Dx.stageIndex[stageId], seed = sd * 977 + 3;
    var team = Gx.buildTeam(), foes = Gx.drawFoes(sg, seed);
    Gx.applyStageAffix(sg, foes, seed);
    var re = Gx.drawReinforce(sg, seed);
    var r = Mx.Battle.run(team, foes, { seed: seed, maxRounds: Dx.config.maxRounds, levelSuppression: Dx.config.levelSuppression, fieldItems: sg.fieldItems || [], double: false, reinforce: re && re.length ? { units: re } : null, event: Gx.eventFor(seed) });
    if (r.win) w++;
  }
  return w;
}
var mw;
mw = maxWins('s14_8', 12);
ok(mw >= 2 && mw <= 5, 'max@90 s14_8（小叮噹）：勝 ' + mw + '/12（小叮噹強化後新基準）');
mw = maxWins('s15_8', 12);
ok(mw >= 3 && mw <= 10, 'max@90 s15_8（皮卡丘）：勝 ' + mw + '/12（probe9 7/12，帶狀）');
mw = maxWins('s16_8', 12);
ok(mw <= 3, 'max@90 s16_8：勝 ' + mw + '/12（設計 0%，終關以頂尖隊為標準）');

console.log('[舊頂不變（回歸）]');
(function () {
  var w = 0;
  for (var sd = 1; sd <= 12; sd++) {
    var sg = G.towerFloor(150);
    var r = M.Battle.run(topTeam(80), G.buildEnemy(sg), { seed: sd * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (r.win) w++;
  }
  ok(w === 12, 'F150 Lv80 頂尖隊仍 12/12 全勝（舊頂無傷，WL-14 一致）');
})();
(function () {
  var w = 0;
  for (var sd = 1; sd <= 12; sd++) {
    var sg = G.wujiWave(G.wujiTier('w5'), 39, sd * 7919);
    var r = M.Battle.run(topTeam(80), G.buildEnemy(sg), { seed: sd * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (r.win) w++;
  }
  ok(w === 12, 'W200 單波 Lv80 頂尖隊仍 12/12 全勝（WL-14 一致）');
})();
g = gateTop('s13_8', 80, 12);
ok(g.wins === 12, 's13_8 Lv80 頂尖隊仍 12/12 全勝（WL-14 一致）');
g = gateTop('s13_9', 80, 12);
ok(g.wins === 12, 's13_9 Lv80 頂尖隊仍 12/12 全勝（WL-14 一致）');
ok(byId['s13_9'].first.gold === 300 && byId['s13_9'].first.items.some(function (it) { return it.item === 'zizhuang_frag' && it.n === 20; }), 's13_9 首通金 300＋紫裝碎片 ×20 不變');
ok(G.towerFloor(200).first.gold === 120, 'F200 首通金 120（公式 20＋100，不變）');

console.log('[存檔 v12 與考證]');
ok(S.VERSION === 12, '存檔版本仍為 v12（零遷移、零新欄位）');
ok(G.stageState('s16_9').stars === 0 && G.stageState('s16_9').clears === 0, '新關預設紀錄為 0（舊存檔讀取時不憑空建立）');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
ok(prov.entries.length === 334, '考證共 334 條（WL-15 ＋10）');
ok(prov.entries.filter(function (x) { return x.grade === 'D'; }).length === 168, 'D 級共 168 條（WL-15 ＋10）');
['stages.ch14_16', 'balance.bossScale15', 'balance.topGate15', 'balance.wujiScale2', 'wuji.w6w7', 'reward.towerTop240', 'reward.wujiW6W7', 'ach.tower240', 'reward.gateMilestone16', 'boss.doraemonPikachu'].forEach(function (id) {
  var e = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e && e.grade === 'D' && e.label.indexOf('原版') < 0 && e.tentative === true && e.phase === 'WL-15', '考證條目 ' + id + ' 為 D 級／暫定／WL-15／不標原版');
});
ok(M.D.provenance && M.D.provenance.entries.length === 334, 'data.generated.js 含最新考證表（334 條）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
if (fail) process.exit(1);
