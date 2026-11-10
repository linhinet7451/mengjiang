// WL-5：限回合挑戰——已通關關卡 12 回合內打贏（D 級原創）。node tests/unit-challenge.js
var load = require('./harness.js'), fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, jdef: 0, agi: 10, lv: 10, phys: true, dtype: 'p', hit: 200, crit: 0, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 11, boss: false, layers: 1 }; for (var k in (o || {})) u[k] = o[k]; return u; }
// 壓級隊：全隊 20 級，打 s1_1（Lv1）必勝且無死亡，供獎勵與種子測試用
function setupCleared(id) {
  G.newGame('測試俠', '力耐', 'm', 99);
  M.S.state.stages[id] = { stars: 3, clears: 1, fails: 0 };
  U.each(M.S.state.heroes, function (h) { h.lv = 20; });
  return M.S.state;
}
function soulsIn(rewards) { return (rewards.join('|').match(/將魂/g) || []).length; }

console.log('[常數與挑戰狀態]');
ok(G.CHALLENGE.rounds === 12, '挑戰回合上限 12');
ok(G.CHALLENGE.silverMult === 1.5, '挑戰銀幣倍率 ×1.5');
ok(G.CHALLENGE.firstGold === 5, '首次挑戰成功金幣 +5');
G.newGame('測試俠', '力耐', 'm', 99);
ok(G.challengeState('s1_1').cleared === false && G.challengeState('s1_1').gold === false, '未挑戰過的關卡挑戰狀態預設未完成／未領金幣');
ok(M.S.state.chal && typeof M.S.state.chal === 'object', '新存檔有 chal 欄位（加法性）');

console.log('[只開放已通關的關卡]');
var rNotCleared = G.fight('s1_1', 1, { challenge: true });
ok(!rNotCleared.ok && rNotCleared.msg.indexOf('尚未通關') >= 0, '未通關關卡挑戰被拒（' + rNotCleared.msg + '）');
ok(!M.S.state.stages['s1_1'] || M.S.state.stages['s1_1'].clears === 0, '被拒的挑戰不寫入通關紀錄');
var rNormalOk = G.fight('s1_1', 1);
ok(rNormalOk.ok, '同一關一般戰鬥不受挑戰開關影響（照常開戰）');

console.log('[12 回合上限：打得慢的戰鬥 12 回合判超時、36 回合打得贏]');
var slowA = mk('攻', { hp: 1e6, patk: 10 });
var slowB = mk('守', { hp: 200, patk: 1 });
var r12 = B.run([{ cell: 3, unit: slowA }], [{ cell: 3, unit: slowB }], { seed: 7, maxRounds: 12, levelSuppression: 10 });
var r36 = B.run([{ cell: 3, unit: mk('攻', { hp: 1e6, patk: 10 }) }], [{ cell: 3, unit: mk('守', { hp: 200, patk: 1 }) }], { seed: 7, maxRounds: 36, levelSuppression: 10 });
ok(!r12.win && r12.timeout && r12.rounds === 12, '12 回合上限：打不完判超時（rounds ' + r12.rounds + '）');
ok(r36.win && !r36.timeout && r36.rounds > 12, '同一戰鬥 36 回合打得贏（rounds ' + r36.rounds + '）');

console.log('[挑戰失敗不影響通關紀錄與越戰越勇]');
setupCleared('s1_1');
var runOrig = M.Battle.run;
M.Battle.run = function () { return { win: false, timeout: true, rounds: 12, events: [], deadA: 0, units: [] }; };
var rChalTO = G.fight('s1_1', 5, { challenge: true });
ok(rChalTO.ok && !rChalTO.win && rChalTO.chalFailed === true && rChalTO.maxRounds === 12, '挑戰超時：win=false、chalFailed、maxRounds=12');
ok(rChalTO.battle.timeout === true, '挑戰超時的 battle.timeout 為 true');
var st1 = M.S.state.stages['s1_1'];
ok(st1.clears === 1 && st1.stars === 3 && st1.fails === 0, '挑戰失敗後通關次數／星級／連敗數都不變（clears ' + st1.clears + '／stars ' + st1.stars + '／fails ' + st1.fails + '）');
ok(!rChalTO.nextMorale, '挑戰失敗不產生越戰越勇加成');
ok(!G.challengeState('s1_1').cleared, '挑戰失敗不記為挑戰完成');
var rNormalTO = G.fight('s1_1', 6);
ok(!rNormalTO.win && M.S.state.stages['s1_1'].fails === 1 && rNormalTO.nextMorale > 0, '對照組：一般戰鬥超時仍計連敗 1 次、給越戰越勇（' + Math.round(rNormalTO.nextMorale * 100) + '%）');
M.Battle.run = runOrig;

console.log('[獎勵：銀幣 +50%]');
setupCleared('s1_1');
var silBefore = M.S.state.player.silver;
var rChalWin = G.fight('s1_1', 11, { challenge: true });
ok(rChalWin.ok && rChalWin.win, '壓級隊挑戰 s1_1 獲勝');
ok(rChalWin.challenge === true && rChalWin.maxRounds === 12, '挑戰結果帶 challenge／maxRounds 標記');
ok(rChalWin.battle.rounds <= 12, '挑戰勝利回合數 ' + rChalWin.battle.rounds + ' ≤ 12');
ok(rChalWin.rewards.join('|').indexOf('銀幣 ×42') >= 0, '挑戰銀幣 28 ×1.5＝42（' + rChalWin.rewards.join('、') + '）');
ok(M.S.state.player.silver - silBefore >= 42, '玩家銀幣實際增加 ≥42');
setupCleared('s1_1');
var rNormWin = G.fight('s1_1', 11);
ok(rNormWin.ok && rNormWin.win && rNormWin.rewards.join('|').indexOf('銀幣 ×28') >= 0, '對照組：同一種子一般戰鬥銀幣 ×28（挑戰不影響一般獎勵）');
ok(!rNormWin.challenge && rNormWin.maxRounds === 36, '一般戰鬥 maxRounds 仍為 36');

console.log('[首次挑戰成功金幣 +5，只領一次]');
setupCleared('s1_1');
var gold0 = M.S.state.player.gold;
var rG1 = G.fight('s1_1', 21, { challenge: true });
ok(rG1.ok && rG1.win && rG1.chalGold === 5, '首次挑戰成功 chalGold=5');
ok(M.S.state.player.gold === gold0 + 5, '玩家金幣 +5（' + gold0 + '→' + M.S.state.player.gold + '）');
ok(rG1.rewards.join('|').indexOf('金幣 ×5') >= 0, '獎勵清單有「金幣 ×5」');
ok(G.challengeState('s1_1').cleared === true && G.challengeState('s1_1').gold === true, '挑戰紀錄：cleared 與 gold 皆已記');
var gold1 = M.S.state.player.gold;
var rG2 = G.fight('s1_1', 22, { challenge: true });
ok(rG2.ok && rG2.win && !rG2.chalGold, '第二次挑戰成功不再給首通金幣');
ok(M.S.state.player.gold === gold1, '第二次挑戰金幣不變（' + gold1 + '）');
ok(rG2.rewards.join('|').indexOf('金幣') < 0, '第二次挑戰獎勵清單無金幣');

console.log('[無死亡多一次將魂掉落判定]');
var sg11 = M.D.stageIndex['s1_1'];
ok(G.extraSoulDrop(sg11, function () { return 0; }) && G.extraSoulDrop(sg11, function () { return 0; }).item === 'soul:zhangjiao', '額外判定：亂數 0 一定中（soul:zhangjiao）');
ok(G.extraSoulDrop(sg11, function () { return 0.99; }) === null, '額外判定：亂數 0.99 一定不中（機率上限 0.8）');
setupCleared('s1_1');
var soulN = 0, soulC = 0;
for (var sd = 1; sd <= 40; sd++) { var rn = G.fight('s1_1', sd); if (rn.win && rn.battle.deadA === 0) soulN += soulsIn(rn.rewards); }
setupCleared('s1_1');
for (var sd2 = 1; sd2 <= 40; sd2++) { var rc = G.fight('s1_1', sd2, { challenge: true }); if (rc.win && rc.battle.deadA === 0) soulC += soulsIn(rc.rewards); }
ok(soulC > soulN, '40 種子無死亡勝場：挑戰將魂總數（' + soulC + '）＞一般（' + soulN + '），額外判定確實多給');
setupCleared('s1_1');
var rSoul = G.fight('s1_1', 31, { challenge: true });
ok(rSoul.ok && rSoul.win && rSoul.battle.deadA === 0, '種子 31 挑戰無死亡獲勝（供對照）');

console.log('[種子決定性：同一種子挑戰結果完全相同]');
function chalRun(seed) {
  setupCleared('s1_1');
  var r = G.fight('s1_1', seed, { challenge: true });
  return { rewards: JSON.stringify(r.rewards), events: JSON.stringify(r.battle.events), win: r.win, rounds: r.battle.rounds, deadA: r.battle.deadA };
}
var d1 = chalRun(42), d2 = chalRun(42);
ok(d1.win && d2.win && d1.rewards === d2.rewards && d1.events === d2.events && d1.rounds === d2.rounds, '同一種子兩次挑戰：勝負／回合／獎勵／戰鬥事件完全相同');

console.log('[存檔 v12 不變：chal 為加法性欄位，舊存檔補齊]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12');
setupCleared('s1_1');
G.fight('s1_1', 51, { challenge: true });
ok(M.S.state.chal['s1_1'] && M.S.state.chal['s1_1'].cleared === 1 && M.S.state.chal['s1_1'].gold === 1, '挑戰紀錄寫入存檔 chal.s1_1（cleared／gold 皆 1）');
var oldJson = JSON.parse(JSON.stringify(M.S.state));
delete oldJson.chal;
var parsed = M.S.parse(JSON.stringify({ app: M.S.APP, version: 12, savedAt: Date.now(), data: oldJson }));
ok(parsed.ok && parsed.state.chal && typeof parsed.state.chal === 'object', '刪除 chal 的舊存檔仍可讀取，applyDefaults 補回空物件');
ok(JSON.stringify(M.S.state).indexOf('"challenge"') < 0, '存檔 JSON 沒有執行期 challenge 標記外洩（只留 chal 紀錄）');

console.log('[provenance]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var pe = prov.entries.filter(function (e) { return e.id === 'mode.limitedRounds'; })[0];
ok(!!pe && pe.grade === 'D' && pe.phase === 'WL-5', 'provenance 有 mode.limitedRounds D 級紀錄（WL-5）');
ok(prov.entries.length === 301, 'provenance 共 301 條（298＋3，WL-9 加 mode.randomEvents、arena.topTeam、arena.rankTop）');

console.log('[戰前顯示：關卡面板]');
c.MJ.UI = { sel: {}, screens: {}, actions: {}, modals: {}, panel: function (t, b) { return b; }, patternGrid: function () { return ''; } };
c.MJ.Art = { portrait: function () { return '<i></i>'; } };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8'), c);
setupCleared('s1_1');
var modalCleared = M.UI.modals.stage('s1_1');
ok(modalCleared.indexOf('限回合挑戰') >= 0, '已通關出戰視窗有「限回合挑戰」區塊');
ok(modalCleared.indexOf('12 回合') >= 0, '出戰視窗寫明 12 回合限制');
ok(modalCleared.indexOf('銀幣 28 → 42') >= 0, '出戰視窗寫明挑戰銀幣 28 → 42（+50%）');
ok(modalCleared.indexOf('金幣 +5') >= 0, '出戰視窗寫明首次挑戰成功金幣 +5');
ok(modalCleared.indexOf('將魂') >= 0, '出戰視窗寫明無死亡多一次將魂掉落');
ok(modalCleared.indexOf('startChallenge') >= 0, '出戰視窗有「限回合挑戰」入口按鈕（startChallenge）');
ok(modalCleared.indexOf('尚未完成挑戰') >= 0, '未完成挑戰時顯示狀態');
G.newGame('測試俠', '力耐', 'm', 99);
var modalLocked = M.UI.modals.stage('s1_2');
ok(modalLocked.indexOf('限回合挑戰') < 0 && modalLocked.indexOf('startChallenge') < 0, '未通關關卡出戰視窗沒有挑戰區塊與入口');
var gateSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8');
ok(gateSrc.indexOf('challengeState') >= 0 && gateSrc.indexOf('CHALLENGE') >= 0, 'ui-gate.js 含有挑戰顯示邏輯');
var cssSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'style.css'), 'utf8');
ok(cssSrc.indexOf('.row.chal') >= 0 && cssSrc.indexOf('.rbody .chal') >= 0, 'style.css 有挑戰面板列與結算樣式');

// ---- 結算畫面（非同步：battleFinish 後 300ms 才出現 showResult）----
console.log('[結算畫面：挑戰勝／敗文案]');
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
var outWin = G.fight('s1_1', 61, { challenge: true });
ok(outWin.ok && outWin.win, '結算測試：壓級隊挑戰獲勝（種子 61）');
M.UI.startBattle(outWin);
clearTimeout(M.UI.battleState().timer);
M.UI.battleFinish();
finish('win', function (htmlWin) {
  ok(htmlWin.indexOf('限回合挑戰成功') >= 0, '勝利結算有「限回合挑戰成功」');
  ok(htmlWin.indexOf('銀幣 +50%') >= 0, '勝利結算寫明銀幣 +50%');
  ok(outWin.chalGold === 5 ? htmlWin.indexOf('首次挑戰獎勵') >= 0 : true, '首次挑戰成功結算有首通金幣行');
  // 敗場：用超時假戰報走挑戰失敗分支
  setupCleared('s1_1');
  M.Battle.run = function () { return { win: false, timeout: true, rounds: 12, events: [], deadA: 0, units: [] }; };
  var outLose = G.fight('s1_1', 62, { challenge: true });
  M.Battle.run = runOrig;
  ok(outLose.ok && !outLose.win, '結算測試：挑戰超時失敗（種子 62）');
  M.UI.startBattle(outLose);
  clearTimeout(M.UI.battleState().timer);
  M.UI.battleFinish();
  finish('lose', function (htmlLose) {
    ok(htmlLose.indexOf('12 回合上限') >= 0, '失敗結算寫明 12 回合上限（不是 36）');
    ok(htmlLose.indexOf('限回合挑戰失敗') >= 0, '失敗結算有「限回合挑戰失敗」');
    ok(htmlLose.indexOf('通關紀錄與越戰越勇不受影響') >= 0, '失敗結算說明通關紀錄與越戰越勇不受影響');
    ok(htmlLose.indexOf('越戰越勇：下次挑戰本關') < 0, '挑戰失敗結算不顯示越戰越勇加成');
    console.log('結果：通過 ' + pass + '，失敗 ' + fail);
    process.exit(fail ? 1 : 0);
  });
});
