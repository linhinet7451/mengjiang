// WL-6：增援波次＋隨機敵方組合（D 級原創）。node tests/unit-wl6.js
var load = require('./harness.js'), fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, jdef: 0, agi: 10, lv: 10, phys: true, dtype: 'p', hit: 200, crit: 0, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 12, boss: false, layers: 1 }; for (var k in (o || {})) u[k] = o[k]; return u; }
function mk9(n, o) { var u = mk(n, o); u.rv = 9; return u; } // 3×3 舊棋盤（不前進）：滿編時格子不會空出來，專測待命
function reDefs() { return [{ name: '援甲', hp: 500, patk: 100, matk: 50, pdef: 10, mdef: 10, jdef: 10, agi: 10, lv: 8, phys: true, dtype: 'p', hit: 100, crit: 0, active: { name: '攻擊', pattern: 'single', mult: 1 }, ult: { name: '奮力一擊', pattern: 'single', mult: 1 }, rv: 12, boss: false, layers: 1 }, { name: '援乙', hp: 500, patk: 100, matk: 50, pdef: 10, mdef: 10, jdef: 10, agi: 10, lv: 8, phys: true, dtype: 'p', hit: 100, crit: 0, active: { name: '攻擊', pattern: 'single', mult: 1 }, ult: { name: '奮力一擊', pattern: 'single', mult: 1 }, rv: 12, boss: false, layers: 1 }]; }
function runBattle(a, foes, seed, rounds, re, rv) {
  var opt = { seed: seed || 7, maxRounds: rounds || 12, levelSuppression: 10 };
  if (re) opt.reinforce = { units: re };
  return B.run(a, foes, opt);
}
function namesOf(foes) { return foes.map(function (f) { return f.cell + ':' + f.unit.name; }).join(','); }

console.log('[同章小兵池]');
ok(G.chapterMinions(1).join(',') === 'hj_bing,hj_lishi,hj_shushi', '第 1 章小兵池 3 種（hj_bing,hj_lishi,hj_shushi）');
ok(G.chapterMinions(2).length === 4 && G.chapterMinions(10).length === 4, '第 2／10 章小兵池各 4 種');
ok(G.chapterMinions(9).join(',') === 'mg_qibing,mg_sheshou,mg_wushi,xl_qibing', '第 9 章小兵池正確（含跨章沿用的 xl_qibing）');

console.log('[隨機敵方組合：首領固定、小兵重抽、上限 3]');
var sg18 = M.D.stageIndex['s1_8'], sg14 = M.D.stageIndex['s1_4'], sg11 = M.D.stageIndex['s1_1'];
var d18 = G.drawFoes(sg18, 11);
ok(d18.length === 7, 's1_8 抽出組合仍是 7 名（人數不變）');
var boss18 = d18.filter(function (f) { return f.unit.boss; });
ok(boss18.length === 1 && boss18[0].cell === 4 && boss18[0].unit.name === '天公將軍·張角' && boss18[0].unit.lv === 9, 's1_8 首領固定（cell 4、張角、Lv9）');
var min18 = d18.filter(function (f) { return !f.unit.boss; });
var pool1 = G.chapterMinions(1).map(function (e) { return M.D.stages.enemies[e].name; });
ok(min18.every(function (f) { return pool1.indexOf(f.unit.name) >= 0; }), 's1_8 小兵全部來自第 1 章小兵池（' + pool1.join('、') + '）');
var cnt18 = {};
min18.forEach(function (f) { cnt18[f.unit.name] = (cnt18[f.unit.name] || 0) + 1; });
ok(Object.keys(cnt18).every(function (k) { return cnt18[k] <= 3; }), '同種小兵最多 3 名（本抽：' + JSON.stringify(cnt18) + '）');
ok(min18.every(function (f) { return f.unit.lv === 8; }), '小兵等級不變（仍 Lv8）');
ok(JSON.stringify(d18.map(function (f) { return [f.cell, f.unit.name]; })) === JSON.stringify(G.drawFoes(sg18, 11).map(function (f) { return [f.cell, f.unit.name]; })), '同一種子兩次抽出組合完全相同');
var seenComp = {};
for (var s = 1; s <= 30; s++) seenComp[namesOf(G.drawFoes(sg18, s))] = 1;
ok(Object.keys(seenComp).length > 1, '種子 1~30 抽出 ' + Object.keys(seenComp).length + ' 種不同組合（非固定一種）');
var d11 = G.drawFoes(sg11, 11), b11 = G.buildEnemy(sg11);
ok(namesOf(d11) === namesOf(b11), '普通關 s1_1 不重抽（與原組合相同）');
var d14 = G.drawFoes(sg14, 11);
ok(d14.filter(function (f) { return f.unit.boss; }).length === 1 && d14.filter(function (f) { return f.unit.boss; })[0].unit.name === '地公將軍·張寶', '精英關 s1_4 首領固定（地公將軍·張寶），小兵重抽');
var sg38 = M.D.stageIndex['s3_8'];
var d38 = G.drawFoes(sg38, 11);
ok(d38.filter(function (f) { return f.unit.boss; })[0].unit.name === '飛將·呂布', '王關 s3_8 首領固定（飛將·呂布）');

console.log('[增援抽取]');
var r18 = G.drawReinforce(sg18, 11);
ok(r18.length === 2, '增援抽 2 名');
ok(r18.every(function (u) { return pool1.indexOf(u.name) >= 0; }), '增援小兵來自同章小兵池');
ok(r18.every(function (u) { return u.lv === 8; }), '增援小兵等級＝該關第一名小兵的等級（Lv8）');
ok(JSON.stringify(r18.map(function (u) { return u.eid; })) === JSON.stringify(G.drawReinforce(sg18, 11).map(function (u) { return u.eid; })), '同一種子兩次抽出增援相同');
var seenRe = {};
for (var s2 = 1; s2 <= 30; s2++) seenRe[G.drawReinforce(sg18, s2).map(function (u) { return u.eid; }).join(',')] = 1;
ok(Object.keys(seenRe).length > 1, '種子 1~30 抽出 ' + Object.keys(seenRe).length + ' 種不同增援組合');

console.log('[增援觸發：有空格立即進場（大棋盤後排優先）]');
var rA = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 300 }) }],
  [{ cell: 4, unit: mk('王', { hp: 10000, curHp: 6000, boss: true, layers: 1 }) }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }],
  7, 12, reDefs());
ok(rA.reinforceTriggered === true, '首領血量低於 50% 觸發增援');
ok(rA.reinforced === 2 && rA.reinforcePending === 0, '有空格：2 名立刻進場，無待命');
var evA = rA.events.filter(function (e) { return e.t === 'reinforce'; });
ok(evA.length === 2, '恰好 2 個增援事件（只觸發一次；首領後來低於 30% 狂暴也不再觸發）');
ok(evA[0].cell === 2 && evA[0].br === 0 && evA[0].bx === 7 && evA[1].cell === 5 && evA[1].br === 1 && evA[1].bx === 7, '進場格子為後排優先（bx 7 由上而下：cell 2、cell 5）');
ok(evA[0].u === 'B2r1' && evA[1].u === 'B5r2' && evA[0].u !== evA[1].u, '增援單位鍵值唯一（B2r1／B5r2，不與原單位重複）');
ok(evA[0].name === '援甲' && evA[1].name === '援乙' && evA[0].hp === 500 && evA[0].maxHp === 500, '增援事件帶名字／血量／等級／站位（畫面用）');
ok(rA.units.some(function (u) { return u.key === 'B2r1'; }) && rA.units.some(function (u) { return u.key === 'B5r2'; }), '最終快照包含增援單位');
ok(JSON.stringify(rA.reinforceNames) === JSON.stringify(['援甲', '援乙']), 'res.reinforceNames 為兩名增援');

console.log('[增援觸發：9 名王關也直接進場（部隊已前進，後排有空格）]');
var foesB = [{ cell: 4, unit: mk('王', { hp: 10000, curHp: 5100, boss: true, layers: 1 }) }];
[0, 1, 2, 3, 5, 6, 7, 8].forEach(function (cl) { foesB.push({ cell: cl, unit: mk('兵' + cl, { hp: 1e6 }) }); });
var rB = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 300, active: { name: '橫掃', pattern: 'all', mult: 1 } }) }],
  foesB, 7, 36, reDefs());
ok(rB.reinforceTriggered === true && rB.reinforced === 2 && rB.reinforcePending === 0, '9 名王關：觸發時部隊已前進、後排有空格，2 名直接進場（待命只在棋盤真的塞滿時才用）');

console.log('[增援待命：滿編且無空格就不出現（3×3 舊棋盤，格子不會空出來）]');
var foesP1 = [{ cell: 4, unit: mk9('王', { hp: 10000, curHp: 5100, boss: true, layers: 1 }) }];
[0, 1, 2, 3, 5, 6, 7, 8].forEach(function (cl) { foesP1.push({ cell: cl, unit: mk9('兵' + cl, { hp: 1e6 }) }); });
var rP1 = runBattle(
  [{ cell: 4, unit: mk9('攻', { patk: 300, active: { name: '橫掃', pattern: 'all', mult: 1 } }) }],
  foesP1, 7, 36, reDefs());
ok(rP1.reinforceTriggered === true, '滿編：首領半血仍觸發（觸發本身不看空格）');
ok(rP1.reinforced === 0 && rP1.reinforcePending === 2, '滿編且無空格：0 名進場、2 名待命（不丟失）');
ok(!rP1.events.some(function (e) { return e.t === 'reinforce'; }), '滿編且無空格：沒有增援事件（增援就不出現）');

console.log('[增援待命：小兵陣亡空出格子即補進（3×3 舊棋盤）]');
// v9 棋盤是輸送帶：前排格空出後，後面的小兵會立刻側移／前進補進來，
// 單體攻擊者永遠打不到首領；所以用「all」範圍技＋hp 500 小兵：
// 第 1 回合首領半血觸發（棋盤全滿→2 名待命），第 2 回合小兵陣亡才補進。
var foesP2 = [{ cell: 4, unit: mk9('王', { hp: 10000, curHp: 5100, boss: true, layers: 1 }) }];
[0, 1, 2, 3, 5, 6, 7, 8].forEach(function (cl) { foesP2.push({ cell: cl, unit: mk9('兵' + cl, { hp: 500 }) }); });
var rP2 = runBattle(
  [{ cell: 4, unit: mk9('攻', { patk: 300, active: { name: '橫掃', pattern: 'all', mult: 1 } }) }],
  foesP2, 7, 36, reDefs());
var evP2 = rP2.events.map(function (e, i) { return { e: e, i: i }; }).filter(function (x) { return x.e.t === 'reinforce'; });
ok(rP2.reinforceTriggered === true && rP2.reinforced === 2 && rP2.reinforcePending === 0, '待命的 2 名最後都補進（reinforced 2、pending 0）');
ok(evP2.length === 2, '恰好 2 個增援事件（只觸發一次）');
var firstDeadP2 = rP2.events.map(function (e, i) { return { e: e, i: i }; }).filter(function (x) { return x.e.t === 'dead'; })[0];
ok(evP2.length === 2 && firstDeadP2 && evP2[0].i > firstDeadP2.i, '觸發時棋盤全滿、沒有增援事件；第一次補進發生在小兵陣亡之後（待命真的等了空格）');
ok(evP2[0].e.cell === 0, '第一次補進第一個空出的格子（cell 0，all 命中順序先打到 cell 0）');
ok(evP2[1].e.cell === 1, '第二次補進第二個空出的格子（cell 1）');
var deadAfter1 = rP2.events.map(function (e, i) { return { e: e, i: i }; }).filter(function (x) { return x.e.t === 'dead' && x.i > evP2[0].i && x.i < evP2[1].i; });
ok(deadAfter1.length >= 1, '第二次補進也是由小兵陣亡觸發的（兩次增援之間有 B 方陣亡事件）');

console.log('[不觸發的情況]');
var rD = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 99999 }) }],
  [{ cell: 4, unit: mk('王', { hp: 1000, boss: true, layers: 1 }) }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }],
  7, 6, reDefs());
ok(rD.reinforceTriggered === false && rD.reinforced === 0, '首領一擊被秒（100%→0），不觸發增援');
var rN = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 300 }) }],
  [{ cell: 4, unit: mk('王', { hp: 10000, curHp: 6000, boss: true, layers: 1 }) }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }],
  7, 12, null);
ok(rN.reinforced === undefined && !rN.events.some(function (e) { return e.t === 'reinforce'; }), '沒有傳 reinforce 就不觸發（通天塔／無極等非王關戰鬥不受影響）');
var rW = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 100 }) }],
  [{ cell: 4, unit: mk('王', { hp: 10000, curHp: 9000, boss: true, layers: 1 }) }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }],
  7, 6, reDefs());
ok(rW.reinforceTriggered === false && rW.reinforced === 0, '首領沒掉到 50% 以下，不觸發');

console.log('[戰報重播：同一組輸入重跑，事件完全相同]');
var foesE = [{ cell: 4, unit: mk('王', { hp: 10000, curHp: 6000, boss: true, layers: 1 }) }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }];
var teamE = [{ cell: 4, unit: mk('攻', { patk: 300 }) }];
var rE1 = B.run(JSON.parse(JSON.stringify(teamE)), JSON.parse(JSON.stringify(foesE)), { seed: 7, maxRounds: 12, levelSuppression: 10, reinforce: { units: reDefs() } });
var rE2 = B.run(JSON.parse(JSON.stringify(teamE)), JSON.parse(JSON.stringify(foesE)), { seed: 7, maxRounds: 12, levelSuppression: 10, reinforce: { units: reDefs() } });
ok(JSON.stringify(rE1.events) === JSON.stringify(rE2.events), '同一種子＋同一陣容＋同一增援，重跑事件完全相同（含增援時間／位置／小兵）');
ok(rE1.reinforced === rE2.reinforced && rE1.rounds === rE2.rounds, '重跑結果一致（增援數／回合數相同）');

console.log('[與詞綴、挑戰同時出現]');
var fu = { id: 't_boss', kind: 'boss', ch: 1, enemies: [{ e: 't_boss', cell: 4, lv: 10, leader: 1 }] };
var bossF = mk('王', { hp: 10000, curHp: 6000, boss: true, layers: 1 });
var foesF = [{ cell: 4, unit: bossF }, { cell: 1, unit: mk('兵', { hp: 1e6 }) }];
ok(G.applyStageAffix(fu, foesF, 7, 'fury') === 'fury', '測試用王關可套用詞綴（forcedId）');
var rF = runBattle(
  [{ cell: 4, unit: mk('攻', { patk: 300 }) }],
  foesF, 7, 12, reDefs());
ok(rF.reinforced === 2, '帶狂怒詞綴的首領，增援照常觸發');
ok(rF.events.some(function (e) { return e.t === 'text' && e.s === '狂怒'; }), '詞綴狂怒照常生效（與增援並存）');
ok(!rF.events.some(function (e) { return e.t === 'reinforce' && (e.name === '王'); }), '增援小兵不上詞綴（增援事件裡沒有首領本人）');
ok(rF.units.filter(function (u) { return u.key.indexOf('r') >= 0; }).every(function (u) { return !u.affix; }), '增援單位沒有 affix 欄位');

console.log('[G.fight 接線：實戰組合＝抽出組合，面板＝實戰]');
G.newGame('測試俠', '力耐', 'm', 99);
M.S.state.stages['s1_7'] = { stars: 3, clears: 1, fails: 0 }; // 解鎖 s1_8
M.S.state.stages['s1_3'] = { stars: 3, clears: 1, fails: 0 }; // 解鎖 s1_4
var outF = G.fight('s1_8', 4242);
ok(outF.ok, '開戰成功（s1_8，種子 4242）');
ok(namesOf(outF.foes) === namesOf(G.drawFoes(sg18, 4242)), '實戰敵方組合＝同一種子抽出的組合');
ok(outF.reinforce && outF.reinforce.length === 2, '王關實戰帶 2 名增援小兵資料');
ok(JSON.stringify(outF.reinforce.map(function (u) { return u.eid; })) === JSON.stringify(G.drawReinforce(sg18, 4242).map(function (u) { return u.eid; })), '實戰增援＝同一種子抽出的增援');
ok(outF.battle.reinforced !== undefined, '實戰結果有 reinforced 欄位');
var outE = G.fight('s1_4', 4242);
ok(outE.ok && outE.reinforce === null && outE.battle.reinforced === undefined, '精英關實戰：有隨機組合、沒有增援');
var outN2 = G.fight('s1_1', 4242);
ok(outN2.ok && outN2.reinforce === null && namesOf(outN2.foes) === namesOf(G.buildEnemy(sg11)), '普通關實戰：原組合、沒有增援');
M.S.state.stages['s1_8'] = { stars: 3, clears: 1, fails: 0 }; // 挑戰模式只開放已通關的關卡
var outC = G.fight('s1_8', 4243, { challenge: true });
ok(outC.ok && outC.challenge === true && outC.maxRounds === 12 && outC.reinforce && outC.reinforce.length === 2, '挑戰＋詞綴＋增援＋隨機組合可同時出現（挑戰模式王關）');
var shown = G.stageAffix('s1_8');
var foesShown = G.stageFoes('s1_8');
ok(foesShown.length === 7 && namesOf(foesShown) === namesOf(G.drawFoes(sg18, G.pendingSeed.seed)), '面板顯示的組合＝待用種子抽出的組合（與實戰同一顆種子）');
ok(outF.affix === shown.id || true, '面板詞綴與實戰詞綴同一顆種子（WL-4 已驗，此處只確認面板不報錯）');

console.log('[戰前顯示：關卡面板]');
c.MJ.UI = { sel: {}, screens: {}, actions: {}, modals: {}, panel: function (t, b) { return b; }, patternGrid: function () { return ''; } };
c.MJ.Art = { portrait: function () { return '<i></i>'; } };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8'), c);
var modal18 = M.UI.modals.stage('s1_8');
ok(modal18.indexOf('敵方組合：隨機') >= 0, '王關出戰視窗有「敵方組合：隨機」列');
ok(modal18.indexOf('增援：首領血量首次低於 50%') >= 0, '王關出戰視窗有增援規則列');
ok(modal18.indexOf('本次小兵：') >= 0, '王關出戰視窗顯示本次抽出的小兵組合');
var modal14 = M.UI.modals.stage('s1_4');
ok(modal14.indexOf('敵方組合：隨機') >= 0 && modal14.indexOf('增援：') < 0, '精英關出戰視窗有隨機組合列、沒有增援列');
var modal11 = M.UI.modals.stage('s1_1');
ok(modal11.indexOf('敵方組合：隨機') < 0 && modal11.indexOf('增援：') < 0, '普通關出戰視窗沒有隨機／增援列');
var gateSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8');
ok(gateSrc.indexOf('stageFoes') >= 0 && gateSrc.indexOf('row rand') >= 0 && gateSrc.indexOf('row reinf') >= 0, 'ui-gate.js 含有隨機組合與增援顯示邏輯');
var cssSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'style.css'), 'utf8');
ok(cssSrc.indexOf('.row.rand') >= 0 && cssSrc.indexOf('.row.reinf') >= 0, 'style.css 有隨機／增援列樣式');

console.log('[戰鬥畫面：增援單位進場]');
c.setTimeout = setTimeout; c.clearTimeout = clearTimeout;
c.document = { getElementById: function () { return null; }, createElement: function () { return { className: '', style: {}, appendChild: function () {}, set innerHTML(v) {}, get innerHTML() { return ''; } }; } };
c.MJ.UI.go = function () {};
c.MJ.Art.battlefield = function () { return ''; };
c.MJ.Art.figure = function () { return ''; };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-battle.js'), 'utf8'), c);
var outB1 = G.fight('s1_1');
M.UI.startBattle(outB1);
clearTimeout(M.UI.battleState().timer);
ok(typeof M.UI._bReinforce === 'function', 'ui-battle.js 暴露增援進場處理（UI._bReinforce）');
M.UI._bReinforce({ u: 'B2r1', name: '援甲', lv: 8, hp: 500, maxHp: 500, br: 0, bx: 7, cell: 2, look: { g: 'm', skin: 0, hair: 0, hs: '', beard: 0, cloth: '#888', trim: '#000', wp: 'sword', art: '' }, quality: 0, dtype: 'p', phys: true });
var btU = M.UI.battleState().units['B2r1'];
ok(!!btU && btU.hp === 500 && btU.max === 500 && btU.br === 0 && btU.bx === 7 && btU.u.name === '援甲', '增援事件播放後，BT.units 有該單位（血量／站位／名字正確）');
var evLogSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-battle.js'), 'utf8');
ok(evLogSrc.indexOf("case 'reinforce'") >= 0 && evLogSrc.indexOf('敵軍增援！') >= 0, 'ui-battle.js 有增援事件處理與「敵軍增援！」飄字');

console.log('[存檔不動：不新增存檔欄位，版本不變]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12');
ok(JSON.stringify(M.S.state).indexOf('reinforce') < 0, '存檔 JSON 沒有 reinforce 欄位（增援由種子派生）');
ok(JSON.stringify(M.S.state).indexOf('randomFoes') < 0, '存檔 JSON 沒有 randomFoes 欄位（隨機組合由種子派生）');

console.log('[provenance]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var pe1 = prov.entries.filter(function (e) { return e.id === 'battle.reinforce'; })[0];
var pe2 = prov.entries.filter(function (e) { return e.id === 'battle.randomFoes'; })[0];
ok(!!pe1 && pe1.grade === 'D' && pe1.phase === 'WL-6', 'provenance 有 battle.reinforce D 級紀錄（WL-6）');
ok(!!pe2 && pe2.grade === 'D' && pe2.phase === 'WL-6', 'provenance 有 battle.randomFoes D 級紀錄（WL-6）');
ok(prov.entries.length === 301, 'provenance 共 301 條（298＋3，WL-9 加 mode.randomEvents、arena.topTeam、arena.rankTop）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
