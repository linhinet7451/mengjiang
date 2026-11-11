// WL-7：×2 挑戰——已通關關卡敵方攻防血 ×2、正常 36 回合（D 級原創）。node tests/unit-wl7.js
var load = require('./harness.js'), fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U;
// 壓級隊：全隊 20 級，打 s1_1（Lv1）必勝且無死亡，供獎勵與種子測試用
// 同章前置關一併標通關（否則目標關因 unlock 未解鎖而開不了戰）
function setupCleared(id) {
  G.newGame('測試俠', '力耐', 'm', 99);
  var sg = M.D.stageIndex[id];
  U.each(M.D.stages.stages, function (x) { if (x.ch === sg.ch && x.idx <= sg.idx) M.S.state.stages[x.id] = { stars: 3, clears: 1, fails: 0 }; });
  M.S.state.stages[id] = { stars: 3, clears: 1, fails: 0 };
  U.each(M.S.state.heroes, function (h) { h.lv = 20; });
  return M.S.state;
}
function soulsIn(rewards) { return (rewards.join('|').match(/將魂/g) || []).length; }
function hitRate(att, tgt) { return Math.max(20, Math.min(100, 90 + (att.hit - tgt.dodge))); } // 與 battle.js 命中公式一致

console.log('[常數與挑戰狀態]');
ok(G.DOUBLE.mult === 2, '×2 倍率 2');
ok(G.DOUBLE.silverMult === 1.5, '×2 挑戰銀幣倍率 ×1.5（沿用限回合挑戰，不膨脹經濟）');
ok(G.DOUBLE.firstGold === 5, '首次 ×2 挑戰成功金幣 +5');
G.newGame('測試俠', '力耐', 'm', 99);
ok(G.doubleState('s1_1').cleared === false && G.doubleState('s1_1').gold === false, '未挑戰過的關卡 ×2 狀態預設未完成／未領金幣');
ok(M.S.state.chal2 && typeof M.S.state.chal2 === 'object', '新存檔有 chal2 欄位（加法性）');
ok(G.challengeState('s1_1').cleared === false, '×2 模式不動限回合挑戰的紀錄（兩模式分開記）');

console.log('[doubleUnit 倍率正確性：攻防血 ×2，其餘不動]');
var sg11 = M.D.stageIndex['s1_1'], sg18 = M.D.stageIndex['s1_8'];
var bossBase = R.enemyUnit({ e: 'zj_boss', cell: 4, lv: 8 }, sg18);
var bossCopy = JSON.parse(JSON.stringify(bossBase));
G.doubleUnit(bossCopy);
U.each(['patk', 'matk', 'jatk', 'pdef', 'mdef', 'jdef'], function (k) { ok(bossCopy[k] === Math.floor(bossBase[k] * 2), '首領 ' + k + ' ' + bossBase[k] + ' → ' + bossCopy[k] + '（×2）'); });
ok(bossCopy.hp === Math.floor(bossBase.hp * 2), '首領 hp ' + bossBase.hp + ' → ' + bossCopy.hp + '（×2）');
ok(bossCopy.ult.flat === Math.floor(bossBase.ult.flat * 2), '首領無雙固定傷害 ult.flat ' + bossBase.ult.flat + ' → ' + bossCopy.ult.flat + '（×2）');
ok(bossCopy.hit === bossBase.hit && bossCopy.dodge === bossBase.dodge, '首領命中／閃避不動（' + bossBase.hit + '／' + bossBase.dodge + '，本來就是 0）');
ok(bossCopy.crit === bossBase.crit, '首領爆擊不動（' + bossBase.crit + '，爆擊是機率不是攻防血）');
ok(bossCopy.agi === bossBase.agi, '首領敏捷不動（' + bossBase.agi + '，翻倍會讓敵方幾乎每回合先手）');
ok(bossCopy.lv === bossBase.lv && bossCopy.layers === bossBase.layers, '首領等級／血條層數不動（Lv' + bossBase.lv + '／' + bossBase.layers + ' 層）');
var minBase = R.enemyUnit({ e: 'hj_bing', cell: 0, lv: 8 }, sg18);
var minCopy = JSON.parse(JSON.stringify(minBase));
G.doubleUnit(minCopy);
ok(minCopy.hp === Math.floor(minBase.hp * 2) && minCopy.patk === Math.floor(minBase.patk * 2) && minCopy.pdef === Math.floor(minBase.pdef * 2), '小兵 hp／物攻／物防 ×2（' + minBase.hp + '／' + minBase.patk + '／' + minBase.pdef + ' → ' + minCopy.hp + '／' + minCopy.patk + '／' + minCopy.pdef + '）');
ok(minCopy.crit === 0 && minCopy.hit === 0 && minCopy.dodge === 0, '小兵爆擊／命中／閃避維持 0');
ok(G.doubleUnit(null) === null, 'doubleUnit(null) 不報錯');

console.log('[命中率合理性：翻倍前後命中公式結果完全相同]');
var mockPlayer = { hit: 65, dodge: 20 };
ok(hitRate(mockPlayer, bossBase) === hitRate(mockPlayer, bossCopy), '我方打首領命中率翻倍前後相同（' + hitRate(mockPlayer, bossBase) + '%）');
ok(hitRate(bossBase, mockPlayer) === hitRate(bossCopy, mockPlayer), '首領打我方命中率翻倍前後相同（' + hitRate(bossBase, mockPlayer) + '%）');
ok(hitRate(mockPlayer, minBase) === hitRate(mockPlayer, minCopy), '我方打小兵命中率翻倍前後相同');

console.log('[只開放已通關的關卡；兩種挑戰不能同時進行]');
var rNotCleared = G.fight('s1_1', 1, { double: true });
ok(!rNotCleared.ok && rNotCleared.msg.indexOf('尚未通關') >= 0, '未通關關卡 ×2 挑戰被拒（' + rNotCleared.msg + '）');
ok(!M.S.state.stages['s1_1'] || M.S.state.stages['s1_1'].clears === 0, '被拒的挑戰不寫入通關紀錄');
setupCleared('s1_1');
var rBoth = G.fight('s1_1', 1, { challenge: true, double: true });
ok(!rBoth.ok && rBoth.msg.indexOf('不能同時進行') >= 0, '限回合＋×2 同時指定被拒（' + rBoth.msg + '）');
var rNormalOk = G.fight('s1_1', 1);
ok(rNormalOk.ok, '同一關一般戰鬥不受 ×2 開關影響（照常開戰）');

console.log('[實戰敵方全部 ×2：普通關／精英關隨機組合／王關＋增援]');
setupCleared('s1_1');
var outN = G.fight('s1_1', 4242, { double: true });
ok(outN.ok && outN.double === true && outN.maxRounds === 36, '×2 實戰：double 標記、36 回合（不是 12）');
var baseN = G.buildEnemy(sg11);
ok(outN.foes.length === baseN.length, '普通關 ×2 敵方人數不變（' + outN.foes.length + ' 名）');
var allDblN = true;
U.each(outN.foes, function (f, i) { var b = baseN[i].unit; if (f.unit.hp !== Math.floor(b.hp * 2) || f.unit.patk !== Math.floor(b.patk * 2) || f.unit.pdef !== Math.floor(b.pdef * 2)) allDblN = false; });
ok(allDblN, '普通關 ×2：全部敵人 hp／物攻／物防皆為原值 ×2');
setupCleared('s1_4');
var sg14 = M.D.stageIndex['s1_4'];
var outE = G.fight('s1_4', 4242, { double: true });
var baseE = G.drawFoes(sg14, 4242);
ok(outE.ok && outE.reinforce === null, '精英關 ×2 實戰：有隨機組合、沒有增援');
var allDblE = outE.foes.length === baseE.length;
U.each(outE.foes, function (f, i) { var b = baseE[i].unit; if (f.unit.hp !== Math.floor(b.hp * 2) || f.unit.matk !== Math.floor(b.matk * 2) || f.unit.jdef !== Math.floor(b.jdef * 2)) allDblE = false; });
ok(allDblE, '精英關 ×2：隨機組合抽出的小兵也全部 ×2（與原組合逐隻對照）');
setupCleared('s1_8');
var outB = G.fight('s1_8', 4242, { double: true });
// 預期值：同一種子抽出的組合 → 先 ×2 再套詞綴（與 G.fight 同一順序，Math.floor 取整順序一致）
var expFoes = G.drawFoes(sg18, 4242);
U.each(expFoes, function (f) { G.doubleUnit(f.unit); });
G.applyStageAffix(sg18, expFoes, 4242);
ok(outB.ok && outB.reinforce && outB.reinforce.length === 2, '王關 ×2 實戰帶 2 名增援小兵資料');
var allDblB = outB.foes.length === expFoes.length;
U.each(outB.foes, function (f, i) { var b = expFoes[i].unit; U.each(['patk', 'matk', 'jatk', 'pdef', 'mdef', 'jdef', 'hp'], function (k) { if (f.unit[k] !== b[k]) allDblB = false; }); });
ok(allDblB, '王關 ×2：首領＋小兵攻防血皆與「抽出組合→×2→套詞綴」預期值逐隻相同（詞綴疊在翻倍後）');
var expRe = G.drawReinforce(sg18, 4242);
U.each(expRe, function (u) { G.doubleUnit(u); });
var allDblR = outB.reinforce.length === 2;
U.each(outB.reinforce, function (u, i) { if (u.hp !== expRe[i].hp || u.patk !== expRe[i].patk || u.eid !== expRe[i].eid) allDblR = false; });
ok(allDblR, '王關 ×2：增援小兵也 ×2（種類與預期相同，hp／物攻為原值 ×2）');
ok(outB.battle.reinforced !== undefined, '王關 ×2 實戰結果有 reinforced 欄位');

console.log('[挑戰失敗不影響通關紀錄與越戰越勇]');
setupCleared('s1_1');
var runOrig = M.Battle.run;
M.Battle.run = function () { return { win: false, timeout: true, rounds: 36, events: [], deadA: 0, units: [] }; };
var rDblTO = G.fight('s1_1', 5, { double: true });
ok(rDblTO.ok && !rDblTO.win && rDblTO.dblFailed === true && rDblTO.maxRounds === 36, '×2 超時：win=false、dblFailed、maxRounds=36');
var st1 = M.S.state.stages['s1_1'];
ok(st1.clears === 1 && st1.stars === 3 && st1.fails === 0, '×2 失敗後通關次數／星級／連敗數都不變（clears ' + st1.clears + '／stars ' + st1.stars + '／fails ' + st1.fails + '）');
ok(!rDblTO.nextMorale, '×2 失敗不產生越戰越勇加成');
ok(!G.doubleState('s1_1').cleared, '×2 失敗不記為挑戰完成');
M.Battle.run = runOrig;

console.log('[獎勵：銀幣 +50%]');
setupCleared('s1_1');
var silBefore = M.S.state.player.silver;
var rDblWin = G.fight('s1_1', 11, { double: true });
ok(rDblWin.ok && rDblWin.win, '壓級隊 ×2 挑戰 s1_1 獲勝');
ok(rDblWin.double === true && rDblWin.maxRounds === 36, '×2 結果帶 double／maxRounds 標記');
ok(rDblWin.rewards.join('|').indexOf('銀幣 ×42') >= 0, '×2 挑戰銀幣 28 ×1.5＝42（' + rDblWin.rewards.join('、') + '）');
ok(M.S.state.player.silver - silBefore >= 42, '玩家銀幣實際增加 ≥42');

console.log('[首次 ×2 挑戰成功金幣 +5，只領一次]');
setupCleared('s1_1');
var gold0 = M.S.state.player.gold;
var rG1 = G.fight('s1_1', 21, { double: true });
ok(rG1.ok && rG1.win && rG1.dblGold === 5, '首次 ×2 挑戰成功 dblGold=5');
ok(M.S.state.player.gold === gold0 + 5, '玩家金幣 +5（' + gold0 + '→' + M.S.state.player.gold + '）');
ok(rG1.rewards.join('|').indexOf('金幣 ×5') >= 0, '獎勵清單有「金幣 ×5」');
ok(G.doubleState('s1_1').cleared === true && G.doubleState('s1_1').gold === true, '×2 挑戰紀錄：cleared 與 gold 皆已記');
ok(G.challengeState('s1_1').cleared === false, '×2 挑戰成功不動限回合挑戰的紀錄');
var gold1 = M.S.state.player.gold;
var rG2 = G.fight('s1_1', 22, { double: true });
ok(rG2.ok && rG2.win && !rG2.dblGold, '第二次 ×2 挑戰成功不再給首通金幣');
ok(M.S.state.player.gold === gold1, '第二次 ×2 挑戰金幣不變（' + gold1 + '）');

console.log('[無死亡多一次將魂掉落判定]');
setupCleared('s1_1');
var soulN = 0, soulD = 0;
for (var sd = 1; sd <= 40; sd++) { var rn = G.fight('s1_1', sd); if (rn.win && rn.battle.deadA === 0) soulN += soulsIn(rn.rewards); }
setupCleared('s1_1');
for (var sd2 = 1; sd2 <= 40; sd2++) { var rc = G.fight('s1_1', sd2, { double: true }); if (rc.win && rc.battle.deadA === 0) soulD += soulsIn(rc.rewards); }
ok(soulD > soulN, '40 種子無死亡勝場：×2 將魂總數（' + soulD + '）＞一般（' + soulN + '），額外判定確實多給');

console.log('[種子決定性：同一種子 ×2 結果完全相同；戰報寫明 ×2]');
function dblRun(seed) {
  setupCleared('s1_1');
  var r = G.fight('s1_1', seed, { double: true });
  return { rewards: JSON.stringify(r.rewards), events: JSON.stringify(r.battle.events), win: r.win, rounds: r.battle.rounds, deadA: r.battle.deadA };
}
var d1 = dblRun(42), d2 = dblRun(42);
ok(d1.win && d2.win && d1.rewards === d2.rewards && d1.events === d2.events && d1.rounds === d2.rounds, '同一種子兩次 ×2：勝負／回合／獎勵／戰鬥事件完全相同');
ok(d1.events.indexOf('敵方數值 ×2') >= 0, '戰鬥事件有開場「敵方數值 ×2」紀錄（戰報寫明模式）');
setupCleared('s1_1');
var rNorm42 = G.fight('s1_1', 42);
ok(JSON.stringify(rNorm42.battle.events) !== d1.events, '同一種子：×2 戰鬥事件與一般戰鬥不同（模式確實進了戰報）');

console.log('[存檔 v12 不變：chal2 為加法性欄位，舊存檔補齊]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12');
setupCleared('s1_1');
G.fight('s1_1', 51, { double: true });
ok(M.S.state.chal2['s1_1'] && M.S.state.chal2['s1_1'].cleared === 1 && M.S.state.chal2['s1_1'].gold === 1, '×2 挑戰紀錄寫入存檔 chal2.s1_1（cleared／gold 皆 1）');
var oldJson = JSON.parse(JSON.stringify(M.S.state));
delete oldJson.chal2;
var parsed = M.S.parse(JSON.stringify({ app: M.S.APP, version: 12, savedAt: Date.now(), data: oldJson }));
ok(parsed.ok && parsed.state.chal2 && typeof parsed.state.chal2 === 'object', '刪除 chal2 的舊存檔仍可讀取，applyDefaults 補回空物件');
ok(JSON.stringify(M.S.state).indexOf('"double"') < 0, '存檔 JSON 沒有執行期 double 標記外洩（只留 chal2 紀錄）');

console.log('[provenance]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var pe = prov.entries.filter(function (e) { return e.id === 'mode.doubleChallenge'; })[0];
ok(!!pe && pe.grade === 'D' && pe.phase === 'WL-7', 'provenance 有 mode.doubleChallenge D 級紀錄（WL-7）');
ok(prov.entries.length === 313, 'provenance 共 313 條（310＋3，WL-12 加 balance.bossScale12、balance.doubleGate、stages.ch11_13）');

console.log('[戰前顯示：關卡面板]');
c.MJ.UI = { sel: {}, screens: {}, actions: {}, modals: {}, panel: function (t, b) { return b; }, patternGrid: function () { return ''; } };
c.MJ.Art = { portrait: function () { return '<i></i>'; } };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8'), c);
setupCleared('s1_1');
var modalCleared = M.UI.modals.stage('s1_1');
ok(modalCleared.indexOf('×2 挑戰') >= 0, '已通關出戰視窗有「×2 挑戰」區塊');
ok(modalCleared.indexOf('限回合挑戰') >= 0, '已通關出戰視窗同時保留「限回合挑戰」區塊（兩模式並存）');
ok(modalCleared.indexOf('36 回合') >= 0, '出戰視窗寫明 ×2 是 36 回合（不是 12）');
ok(modalCleared.indexOf('敵方攻擊／防禦／血量全部 ×2') >= 0, '出戰視窗寫明敵方攻防血全部 ×2');
ok(modalCleared.indexOf('銀幣 28 → 42') >= 0, '出戰視窗寫明 ×2 挑戰銀幣 28 → 42（+50%）');
ok(modalCleared.indexOf('金幣 +5') >= 0, '出戰視窗寫明首次 ×2 挑戰成功金幣 +5');
ok(modalCleared.indexOf('將魂') >= 0, '出戰視窗寫明無死亡多一次將魂掉落');
ok(modalCleared.indexOf('startDouble') >= 0, '出戰視窗有「×2 挑戰」入口按鈕（startDouble）');
ok(modalCleared.indexOf('尚未完成挑戰') >= 0, '未完成 ×2 挑戰時顯示狀態');
G.newGame('測試俠', '力耐', 'm', 99);
var modalLocked = M.UI.modals.stage('s1_2');
ok(modalLocked.indexOf('×2 挑戰') < 0 && modalLocked.indexOf('startDouble') < 0, '未通關關卡出戰視窗沒有 ×2 區塊與入口');
var gateSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8');
ok(gateSrc.indexOf('doubleState') >= 0 && gateSrc.indexOf('DOUBLE') >= 0, 'ui-gate.js 含有 ×2 挑戰顯示邏輯');
var cssSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'style.css'), 'utf8');
ok(cssSrc.indexOf('.row.dbl') >= 0 && cssSrc.indexOf('.dbl-tag') >= 0 && cssSrc.indexOf('.rbody .dbl') >= 0, 'style.css 有 ×2 面板列、戰鬥標籤與結算樣式');

// ---- 戰鬥畫面與結算畫面（非同步：battleFinish 後 300ms 才出現 showResult）----
console.log('[戰鬥畫面：標題與敵方 ×2 標籤；結算畫面：×2 勝／敗文案]');
var elems = {};
c.setTimeout = setTimeout; c.clearTimeout = clearTimeout;
c.document = {
  getElementById: function (id) { if (!elems[id]) elems[id] = { id: id, innerHTML: '', className: '', style: {}, appendChild: function () {}, setAttribute: function () {}, offsetWidth: 0 }; return elems[id]; },
  createElement: function () { return { style: {}, className: '', innerHTML: '', appendChild: function () {}, setAttribute: function () {} }; }
};
c.MJ.UI.go = function () {};
c.MJ.Art.battlefield = function () { return ''; };
c.MJ.Art.figure = function () { return ''; };
if (M.Audio) M.Audio.sfx = function () {};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-battle.js'), 'utf8'), c);
function finish(name, done) {
  setTimeout(function () {
    var html = (elems['bresult'] && elems['bresult'].innerHTML) || '';
    done(html);
  }, 600);
}
setupCleared('s1_1');
var outWin = G.fight('s1_1', 61, { double: true });
ok(outWin.ok && outWin.win, '結算測試：壓級隊 ×2 挑戰獲勝（種子 61）');
M.UI.startBattle(outWin);
clearTimeout(M.UI.battleState().timer);
var bHtml = M.UI.screens.battle();
ok(bHtml.indexOf('（×2 挑戰）') >= 0, '戰鬥畫面標題有「（×2 挑戰）」');
ok(bHtml.indexOf('dbl-tag') >= 0 && bHtml.indexOf('×2</em>') >= 0, '戰鬥畫面敵方頭像旁有 ×2 標籤');
M.UI.battleFinish();
finish('win', function (htmlWin) {
  ok(htmlWin.indexOf('×2 挑戰成功') >= 0, '勝利結算有「×2 挑戰成功」');
  ok(htmlWin.indexOf('敵方數值 ×2') >= 0, '勝利結算寫明敵方數值 ×2');
  ok(htmlWin.indexOf('銀幣 +50%') >= 0, '勝利結算寫明銀幣 +50%');
  ok(outWin.dblGold === 5 ? htmlWin.indexOf('首次挑戰獎勵') >= 0 : true, '首次 ×2 挑戰成功結算有首通金幣行');
  // 再戰一次：重複同一模式（×2）
  M.UI.actions.bAgain('s1_1');
  var bt2 = M.UI.battleState();
  ok(!!bt2 && bt2.r.double === true && bt2.r.challenge !== true, '「再戰一次」重複 ×2 模式（不是限回合、不是一般戰鬥）');
  clearTimeout(bt2.timer);
  // 敗場：用超時假戰報走 ×2 失敗分支
  setupCleared('s1_1');
  M.Battle.run = function () { return { win: false, timeout: true, rounds: 36, events: [], deadA: 0, units: [] }; };
  var outLose = G.fight('s1_1', 62, { double: true });
  M.Battle.run = runOrig;
  ok(outLose.ok && !outLose.win, '結算測試：×2 超時失敗（種子 62）');
  M.UI.startBattle(outLose);
  clearTimeout(M.UI.battleState().timer);
  M.UI.battleFinish();
  finish('lose', function (htmlLose) {
    ok(htmlLose.indexOf('36 回合上限') >= 0, '失敗結算寫明 36 回合上限（不是 12）');
    ok(htmlLose.indexOf('×2 挑戰失敗') >= 0, '失敗結算有「×2 挑戰失敗」');
    ok(htmlLose.indexOf('通關紀錄與越戰越勇不受影響') >= 0, '失敗結算說明通關紀錄與越戰越勇不受影響');
    ok(htmlLose.indexOf('越戰越勇：下次挑戰本關') < 0, '×2 失敗結算不顯示越戰越勇加成');
    console.log('結果：通過 ' + pass + '，失敗 ' + fail);
    process.exit(fail ? 1 : 0);
  });
});
