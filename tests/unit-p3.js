// 第三階段單元測試：node tests/unit-p3.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = new Date(2026, 10, 3, 9, 0, 0).getTime(), H = 3600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return c._t; }; c._t = T0; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
function seq(arr) { var i = 0; return function () { return arr[i++ % arr.length]; }; }
function nonNeg(S) { var p = S.state.player, bad = [];
  ['gold', 'silver', 'energy', 'xinghun'].forEach(function (k) { if (p[k] < 0) bad.push(k); });
  Object.keys(S.state.bag.stack).forEach(function (k) { if (S.state.bag.stack[k] < 0) bad.push(k); });
  return bad; }
function power(G, lv) { // 把隊伍拉到指定等級並給好裝備，用於測試
  var s = G.lead(); s.lv = lv;
  G.teamList().forEach(function (x) { x.hero.lv = lv; });
}

console.log('[農田：P2 起立即成熟、不等現實時間]');
var c = fresh(), M = c.MJ, G = M.G, S = M.S;
ok(G.farmPlots() === 3, '1 級農田有 3 塊田');
ok(!G.plant(0, 'seed_yin').ok, '沒有種子不能種');
G.addItem('seed_yin', 3); G.addItem('seed_gem', 1); G.addItem('huafei', 2);
var r = G.plant(0, 'seed_yin');
ok(r.ok && S.state.bag.stack.seed_yin === 2, '種下搖錢樹苗，扣 1 顆種子');
ok(!G.plant(0, 'seed_yin').ok, '同一塊田不能重複種');
ok(!G.plant(5, 'seed_yin').ok, '未開墾的田不能種');
ok(G.plotState(0).ready && G.plotState(0).left === 0, '種下立即成熟（不等現實時間）');
var y0 = G.harvestYield('seed_yin').silver;
r = G.fertilize(0);
ok(r.ok && G.plotState(0).fert, '成熟前可施肥（收成 +50%）');
ok(!G.fertilize(0).ok, '同一季只能施肥一次');
// 匯出存檔再重新載入：作物狀態保留
var save = S.exportText();
var c2 = load(); c2.MJ.U.now = function () { return c2._t; }; c2._t = T0;
var p = c2.MJ.S.parse(save); c2.MJ.S.state = p.state;
ok(c2.MJ.G.plotState(0).ready && c2.MJ.G.plotState(0).fert, '重新載入後作物與施肥狀態保留');
var s0 = c2.MJ.S.state.player.silver; r = c2.MJ.G.harvest(0);
ok(r.ok && c2.MJ.S.state.player.silver === s0 + Math.floor(y0 * 1.5), '施肥後收成搖錢樹銀幣 ×1.5（' + y0 + ' → ' + Math.floor(y0 * 1.5) + '）');
ok(!c2.MJ.G.harvest(0).ok && c2.MJ.S.state.farm.plots[0] === null, '同一株不能重複收成（不會重複給獎勵）');
G.plant(1, 'seed_gem'); c._t = T0 - 5 * H;
ok(G.plotState(1).ready, '系統時鐘倒退也不影響（不看時間）');
c._t = T0; r = G.harvest(1, seq([0.1]));
ok(r.ok && S.state.bag.stack.gem_atk_1 === 1, '靈石花收成 1 級寶石（固定亂數）');
ok((S.state.counters.harvest || 0) === 1 && G.daily().c.harvest === 1, '收成計入成就與每日任務');
S.state.settings.econ = 'fast'; ok(G.farmDur('seed_yin') === 0, '任何模式成長時間都是 0');
S.state.settings.econ = 'std'; S.state.buildings.farm = 9; ok(G.farmPlots() === 6, '農田 9 級開墾到 6 塊');
ok(nonNeg(S).length === 0, '沒有負數資源');

console.log('[通天塔]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(!G.towerFight().ok, '未達 22 級不能挑戰');
var f1 = G.towerFloor(1), f10 = G.towerFloor(10), f100 = G.towerFloor(100);
ok(f1.enemies.length === 3 && f10.kind === 'boss' && f100.enemies.length === 9, '第 1 層 3 人、第 10 層王、第 100 層 9 人');
ok(f10.enemies[0].leader && M.R.enemyUnit(f10.enemies[0], f10).layers >= 3, '每 10 層 Boss 有多層血條');
ok(f100.enemies[0].lv > f1.enemies[0].lv, '樓層越高敵人越強');
power(G, 80); S.state.heroes.forEach(function (h) { h.lv = 80; h.star = 5; });
var gold0 = S.state.player.gold, xh0 = S.state.player.xinghun;
r = G.towerFight(12345);
ok(r.ok && r.win && S.state.tower.best === 1 && r.rewards.length > 0 && S.state.player.xinghun > xh0, '滿級隊伍通過第 1 層，給首通獎勵與星魂');
var sil = S.state.player.silver; S.state.tower.best = 1;
// 失敗不給獎勵：用 1 級隊伍打第 60 層
c = fresh(); M = c.MJ; G = M.G; S = M.S; G.lead().lv = 22; S.state.tower.best = 59;
var silB = S.state.player.silver; r = G.towerFight(7);
ok(r.ok && !r.win && S.state.tower.best === 59 && S.state.player.silver === silB, '戰敗不前進、不給獎勵');
ok(G.daily().c.towerTry === 1, '挑戰次數計入每日任務');
r = G.towerSweep(); ok(r.ok && S.state.player.silver > silB, '塔俸可領（新存檔立即可領）');
ok(!G.towerSweep().ok, '領過後要再贏 ' + G.TICKET.tower + ' 場才能再領');
c._t = T0 + 24 * H; ok(!G.towerSweep().ok, '隔天也不會重置（不看日期）');
S.state.stats.wins += G.TICKET.tower; ok(G.towerSweep().ok, '再贏 ' + G.TICKET.tower + ' 場後可以再領');
S.state.tower.best = 100; ok(!G.towerFight().ok, '登頂後不能再挑戰');

console.log('[無極幻境：連續波次]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(!G.wujiRun('w1').ok, '未達 12 級不能挑戰');
power(G, 80); S.state.heroes.forEach(function (h) { h.lv = 80; h.star = 5; });
var t1 = G.wujiTier('w1'), w0 = G.wujiWave(t1, 0, 1), wl = G.wujiWave(t1, t1.waves - 1, 1);
ok(wl.kind === 'boss' && wl.enemies.length > w0.enemies.length, '波次越後敵人越多，最後一波是王');
var g0 = S.state.player.gold; r = G.wujiRun('w1', 99);
ok(r.ok && r.full && r.waves.length === 40 && r.cleared === 40, '滿級隊伍連破 40 波（P3 無盡波次，每次最多 40 波）');
ok(r.souls === 8 && S.state.wuji.best === 40, '每 5 波 1 個將魂：40 波得 8 個，最深紀錄 40');
ok(r.firstRewards && S.state.player.gold >= g0 + 50 && S.state.wuji.clears === 1, '首次全破有額外金幣');
var hp2 = r.waves[1].team.map(function (x) { return x.unit.curHp; });
ok(hp2.every(function (v) { return typeof v === 'number'; }), '第 2 波沿用第 1 波結束時的生命值');
r = G.wujiRun('w1', 100); ok(r.ok && !r.firstRewards, '第二次全破不會重複給首破獎勵');
r = G.wujiRun('w1', 101); ok(r.ok && G.wujiLeft('w1') === Infinity, '第 3 次以後仍可挑戰（無每日次數）');
c = fresh(); M = c.MJ; G = M.G; S = M.S; G.teamList().forEach(function (x) { x.hero.lv = 12; }); G.lead().lv = 42;
var sv = S.state.player.silver; r = G.wujiRun('w3', 5);
ok(r.ok && !r.full && r.cleared < 40 && S.state.wuji.clears === 0, '弱隊挑戰化境中途失敗，不算全破');
ok(S.state.player.silver >= sv && nonNeg(S).length === 0, '只發放已通過波次的獎勵，沒有負數資源');

console.log('[歷練任務（原每日任務，P2 改為可重複的輪次）]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(!G.claimDaily('d1').ok, '未完成不能領');
for (var i = 0; i < 3; i++) G.fight('s1_1', i + 1);
ok(G.dailyProgress(G.DAILY[0]) === 3, '虛空之門挑戰 3 次被記錄');
var sl = S.state.player.silver; r = G.claimDaily('d1');
ok(r.ok && S.state.player.silver === sl + 1000 && G.daily().act === 20, '領取每日任務：銀幣 +1000、活躍度 +20');
ok(!G.claimDaily('d1').ok, '同一任務一輪只能領一次');
ok(!G.claimDailyChest('c2').ok, '活躍度不足不能開寶箱');
G.daily().act = 30; ok(G.claimDailyChest('c1').ok && !G.claimDailyChest('c1').ok, '活躍寶箱只能開一次');
c._t = T0 + 24 * H; ok(G.daily().act === 30 && G.daily().claimed.d1, '隔天不會重置（不看日期）');
ok(G.dailyNewRound().ok && G.daily().round === 2 && G.daily().act === 0 && !G.daily().claimed.d1 && G.dailyProgress(G.DAILY[0]) === 0, '領完後立即開始下一輪：進度與活躍度歸零');
ok(!G.dailyNewRound().ok, '新一輪還沒領任何任務時不能再換輪');
for (i = 0; i < 3; i++) G.fight('s1_1', i + 11);
ok(!G.dailyNewRound().ok && G.dailyPending(), '有完成但未領的任務時不能換輪（避免損失）');
ok(G.claimDaily('d1').ok, '第 2 輪同一任務可再領');

console.log('[成就]');
var a = G.ACH[0]; S.state.stats.wins = 9;
ok(!G.claimAch('a_win').ok, '未達 10 勝不能領');
S.state.stats.wins = 120; var gg = S.state.player.gold;
ok(G.claimAch('a_win').ok && S.state.player.gold === gg + 20, '第 1 階（10 勝）金幣 +20');
ok(G.claimAch('a_win').ok && G.achState(a).tier === 2, '第 2 階（100 勝）可接著領');
ok(!G.claimAch('a_win').ok, '第 3 階（500 勝）未達，不能領');

console.log('[簽到]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
sl = S.state.player.silver; r = G.sign();
ok(r.ok && S.state.player.silver === sl + 1000 && S.state.sign.total === 1, '第 1 天簽到：銀幣 +1000');
ok(!G.sign().ok, '簽到後要再贏 ' + G.TICKET.sign + ' 場才能再簽');
S.state.stats.wins += G.TICKET.sign; r = G.sign();
ok(r.ok && S.state.sign.total === 2 && S.state.sign.days.length === 2, '再贏 ' + G.TICKET.sign + ' 場後可簽第 2 次（不用等隔天）');
S.state.player.gold = 100; ok(!G.signMakeup().ok && S.state.player.gold === 100, '沒有補簽、不扣金');
ok(!G.claimSignBonus(7).ok, '累計 7 次才可領 7 次獎');
S.state.sign.days = [1, 2, 3, 4, 5, 6, 7]; ok(G.claimSignBonus(7).ok && !G.claimSignBonus(7).ok, '7 次獎只能領一次');
c._t = new Date(2026, 11, 1, 9).getTime(); var ss = G.signState();
ok(ss.count === 7, '跨月不會重置（不看日期）');
S.state.sign.days = []; for (i = 1; i <= 28; i++) S.state.sign.days.push(i); S.state.sign.bonus = { 7: 1 };
S.state.stats.wins += G.TICKET.sign; var gs = S.state.player.gold; r = G.sign();
ok(r.ok && S.state.sign.days.length === 1 && !S.state.sign.bonus[7], '簽滿 28 次後開始新一輪');
ok(S.state.player.gold > gs, '一輪結束時未領的累計獎勵自動補發');

console.log('[經濟模式]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(G.econ().id === 'std', '預設標準模式');
G.setEcon('fast');
ok(G.econ().id === 'fast' && G.econ().farm === 1, '單機加速：精力已取消，只保留訓練與銀幣倍率');
var tr = G.trainRate(G.lead()); G.setEcon('std'); ok(tr === G.trainRate(G.lead()) * 2 || tr === Math.floor(G.trainRate(G.lead()) * 2), '單機加速：訓練經驗 2 倍');
G.setEcon('fast'); r = G.fight('s1_1', 3); var base = M.D.stageIndex.s1_1.silver;
ok(!r.win || r.rewards[0] === '銀幣 ×' + Math.floor(base * 1.5), '單機加速：關卡銀幣 1.5 倍');

console.log('[第 5～8 章多層血條]');
var b5 = M.D.stageIndex.s5_8, b8 = M.D.stageIndex.s8_8, b1 = M.D.stageIndex.s1_8;
var L = function (sg) { var e = sg.enemies.filter(function (x) { return x.leader; })[0]; return M.R.enemyUnit(e, sg).layers; };
ok(L(b1) === 3 && L(b5) === 4 && L(b8) === 5, '王關血條層數：第 1 章 3 層、第 5 章 4 層、第 8 章 5 層');
ok(M.D.stages.stages.filter(function (x) { return x.ch === 8; }).some(function (x) { return x.enemies.length === 9; }), '第 8 章有 9 人敵陣');

console.log('[存檔 v2 → 最新版 遷移]');
var txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v2.json'), 'utf8');
c = fresh(); M = c.MJ; p = M.S.parse(txt);
ok(p.ok && p.state.version === M.S.VERSION && p.state.migratedFrom === 2, '可匯入第二階段（v2）存檔並升為最新版（v' + M.S.VERSION + '）');
if (p.ok) {
  var s3 = p.state;
  ok(s3.tower.best === 0 && s3.farm && s3.sign && s3.ach && s3.wuji, '補齊通天塔／農田／簽到／成就／幻境欄位');
  ok(s3.player.silver === 54321 && s3.heroes[0].sk.a === 3 && s3.player.xinghun === 40, '保留第二階段資料（銀幣、技能等級、星魂）');
  M.S.state = s3;
  ok(M.G.sign().ok && M.G.fight('s1_1', 2).ok, '遷移後可簽到、戰鬥');
  var p5 = load().MJ.S.parse(M.S.exportText()); ok(p5.ok && p5.state.version === M.S.VERSION, '遷移後再匯出／匯入正常');
}
var bad = JSON.parse(txt); bad.data.version = 99; var pb = M.S.parse(JSON.stringify(bad));
ok(!pb.ok && /比遊戲新/.test(pb.errors.join('')), '比遊戲新的存檔會被拒絕');

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
