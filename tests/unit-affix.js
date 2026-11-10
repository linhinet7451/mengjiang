// WL-4：首領詞綴——王關／隱藏關首領隨機詞綴（D 級原創）。node tests/unit-affix.js
var load = require('./harness.js'), fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, jdef: 0, agi: 10, lv: 10, phys: true, dtype: 'p', hit: 200, crit: 0, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 11, boss: false, layers: 1 }; for (var k in (o || {})) u[k] = o[k]; return u; }
// 單首領假關卡（boss kind），供 applyStageAffix 指定詞綴測試
function bossSetup(affixId, bossOver, aOver) {
  var sg = { id: 't_boss', kind: 'boss', ch: 1, enemies: [{ e: 't_boss', cell: 3, lv: 10, leader: 1 }] };
  var boss = mk('王', { hp: 1000, patk: 1000, pdef: 100, mdef: 100, jatk: 100, jdef: 100, boss: true, layers: 3 });
  for (var k in (bossOver || {})) boss[k] = bossOver[k];
  var foes = [{ cell: 3, unit: boss }];
  var got = G.applyStageAffix(sg, foes, 7, affixId);
  var a = mk('攻', { hp: 1e6, patk: 1000 });
  for (var k2 in (aOver || {})) a[k2] = a[k2];
  return { sg: sg, foes: foes, boss: boss, a: a, got: got };
}
function runBattle(a, foes, seed, rounds) {
  return B.run([{ cell: 3, unit: a }], foes, { seed: seed || 7, maxRounds: rounds || 6, levelSuppression: 10 });
}
function hitsOf(r, from, to) {
  return r.events.filter(function (e) { return e.t === 'hit' && (!from || e.from === from) && (!to || e.to === to) && !e.miss && !e.reflect && !e.dot; });
}

console.log('[詞綴表與種子決定性]');
ok(B.AFFIXES.length === 5, '詞綴池 5 個');
ok(B.AFFIXES.map(function (x) { return x.id; }).join(',') === 'life,thorns,swift,rock,fury', '詞綴 id 依序為 life,thorns,swift,rock,fury');
ok(B.affixById('life').name === '嗜血' && B.affixById('thorns').name === '荊棘' && B.affixById('swift').name === '疾風' && B.affixById('rock').name === '堅岩' && B.affixById('fury').name === '狂怒', '五個詞綴中文名正確');
ok(B.affixById('nope') === null, '查不到的詞綴 id 回傳 null');
var det = true;
for (var s = 1; s <= 50; s++) if (B.pickAffix(s) !== B.pickAffix(s)) det = false;
ok(det, '同一種子 50 次取詞綴都相同');
var seen = {};
for (var s2 = 1; s2 <= 200; s2++) seen[B.pickAffix(s2)] = 1;
ok(Object.keys(seen).length === 5, '種子 1~200 覆蓋全部 5 個詞綴（非固定一種）');
var r0 = runBattle(mk('攻', {}), [{ cell: 3, unit: mk('守', {}) }], 7, 2);
B.pickAffix(7); B.pickAffix(7);
var r1 = runBattle(mk('攻', {}), [{ cell: 3, unit: mk('守', {}) }], 7, 2);
ok(JSON.stringify(r0.events) === JSON.stringify(r1.events), 'pickAffix 不消耗戰鬥亂數流：取詞綴前後同種子戰鬥事件完全相同');

console.log('[套用範圍：只動王關／隱藏關首領本人]');
var sg18 = M.D.stageIndex['s1_8'], sg19 = M.D.stageIndex['s1_9'], sg14 = M.D.stageIndex['s1_4'], sg11 = M.D.stageIndex['s1_1'];
var f18 = G.buildEnemy(sg18);
var got18 = G.applyStageAffix(sg18, f18, 11);
var tagged18 = f18.filter(function (f) { return f.unit.affix; });
ok(got18 && B.affixById(got18) && tagged18.length === 1, '王關 s1_8 套用詞綴（' + got18 + '），全場只有 1 名單位帶詞綴');
ok(tagged18.length === 1 && tagged18[0].cell === 4 && tagged18[0].unit.boss, '王關帶詞綴的是 cell 4 首領本人');
var minionTagged = f18.some(function (f) { return f.cell !== 4 && f.unit.affix; });
ok(!minionTagged, '王關小兵不帶詞綴');
var f19 = G.buildEnemy(sg19);
ok(G.applyStageAffix(sg19, f19, 11) && f19.filter(function (f) { return f.unit.affix; }).length === 1, '隱藏關 s1_9 同樣套用詞綴，只有首領帶');
var f14 = G.buildEnemy(sg14);
ok(G.applyStageAffix(sg14, f14, 11) === null && !f14.some(function (f) { return f.unit.affix; }), '精英關 s1_4 不套用詞綴（首領雖是 boss 模板也不帶）');
var f11 = G.buildEnemy(sg11);
ok(G.applyStageAffix(sg11, f11, 11) === null && !f11.some(function (f) { return f.unit.affix; }), '普通關 s1_1 不套用詞綴');
ok(G.applyStageAffix(sg18, G.buildEnemy(sg18), 11, 'rock') === 'rock', '可指定詞綴（forcedId）');
ok(G.applyStageAffix(sg18, G.buildEnemy(sg18), 11, 'nope') === null, '指定的詞綴 id 不存在時回傳 null、不套用');
var bSw = bossSetup('swift'); ok(bSw.boss.agi === 13 && bSw.boss.jatk === 130 && bSw.boss.jdef === 130, '疾風：敏捷 10→13、絕技攻防 100→130（皆 +30%）');
var bRk = bossSetup('rock'); ok(bRk.boss.pdef === 120 && bRk.boss.mdef === 120, '堅岩：物防法防 100→120（+20%）');
var bLf = bossSetup('life'); ok(bLf.boss.patk === 1000 && bLf.boss.pdef === 100 && bLf.boss.agi === 10, '嗜血／荊棘／狂怒不改即時屬性（動態效果由引擎處理）');
var minBefore = G.buildEnemy(sg18).filter(function (f) { return f.cell !== 4; }).map(function (f) { return f.unit.pdef; }).join(',');
var minAfter = f18.filter(function (f) { return f.cell !== 4; }).map(function (f) { return f.unit.pdef; }).join(',');
ok(minBefore === minAfter, '套用詞綴後小兵防禦數值不變（只動首領）');

console.log('[嗜血：造成傷害的 10% 回血]');
var lf = bossSetup('life', { hp: 1e6, curHp: 500000 });
lf.a.patk = 100; // 我方打得輕，首領活得夠久才吸得到血（原設定首領 500 血會被一擊打死）
var rLf = runBattle(lf.a, lf.foes, 7, 4);
var lfHeal = null, lfHitDmg = 0;
for (var i = 0; i < rLf.events.length; i++) {
  var e = rLf.events[i];
  if (e.t === 'hit' && e.from === 'B3' && !e.miss && !e.reflect) lfHitDmg = e.dmg;
  if (e.t === 'heal' && e.to === 'B3' && e.why === '嗜血') { lfHeal = e; break; }
}
ok(!!lfHeal, '嗜血首領攻擊後出現 why=嗜血 的回復事件');
ok(lfHeal && lfHeal.amt === Math.max(1, Math.floor(lfHitDmg * 0.1)), '嗜血回復量＝該次傷害 ×10%（dmg ' + lfHitDmg + ' → 回 ' + (lfHeal ? lfHeal.amt : '?') + '）');
var lf0 = bossSetup(null, { hp: 1e6, curHp: 500000 }); lf0.a.patk = 100; lf0.foes[0].unit.affix = null;
var rLf0 = runBattle(lf0.a, lf0.foes, 7, 4);
ok(!rLf0.events.some(function (e) { return e.t === 'heal' && e.why === '嗜血'; }), '無詞綴首領不會出現嗜血回復（同條件對照組）');

console.log('[荊棘：反彈所受傷害 15%]');
var th = bossSetup('thorns', { hp: 1e6 });
var rTh = runBattle(th.a, th.foes, 7, 4);
var thHit = null, thRef = null;
for (var j = 0; j < rTh.events.length; j++) {
  var e2 = rTh.events[j];
  if (e2.t === 'hit' && e2.from === 'A3' && e2.to === 'B3' && !e2.miss && !e2.reflect) thHit = e2;
  if (e2.t === 'hit' && e2.from === 'B3' && e2.reflect) { thRef = e2; break; }
}
ok(!!thRef, '攻擊荊棘首領後出現反彈傷害事件（reflect）');
ok(thHit && thRef && thRef.dmg === Math.max(1, Math.floor(thHit.dmg * 0.15)), '反彈傷害＝所受傷害 ×15%（dmg ' + (thHit ? thHit.dmg : '?') + ' → 反 ' + (thRef ? thRef.dmg : '?') + '）');
ok(rTh.events.some(function (e) { return e.t === 'text' && e.s === '荊棘'; }), '反彈時飄「荊棘」文字');
var th0 = bossSetup(null, { hp: 1e6 });
var rTh0 = runBattle(th0.a, th0.foes, 7, 4);
ok(!rTh0.events.some(function (e) { return e.t === 'hit' && e.reflect; }), '無詞綴首領不會反彈（同條件對照組）');

console.log('[疾風：先手]');
var sw = bossSetup('swift');
var rSw = runBattle(sw.a, sw.foes, 7, 2);
var firstAct = rSw.events.filter(function (e) { return e.t === 'act'; })[0];
ok(firstAct && firstAct.u === 'B3', '疾風首領第一個行動（首個 act 事件是 B3，否則 A 先攻）');
var sw0 = bossSetup(null);
var rSw0 = runBattle(sw0.a, sw0.foes, 7, 2);
var firstAct0 = rSw0.events.filter(function (e) { return e.t === 'act'; })[0];
ok(firstAct0 && firstAct0.u === 'A3', '無詞綴時我方先攻（對照組首個 act 是 A3）');

console.log('[堅岩：受擊傷害確實降低]');
var rkA = bossSetup('rock', { hp: 1e6, pdef: 100 });
var rkB = bossSetup(null, { hp: 1e6, pdef: 100 });
var rRkA = runBattle(rkA.a, rkA.foes, 7, 3), rRkB = runBattle(rkB.a, rkB.foes, 7, 3);
var hitA = hitsOf(rRkA, 'A3', 'B3')[0], hitB = hitsOf(rRkB, 'A3', 'B3')[0];
ok(hitA && hitB && hitA.dmg === hitB.dmg - 20, '同種子首擊傷害：堅岩比無詞綴少 20（pdef 100→120；' + (hitB ? hitB.dmg : '?') + ' → ' + (hitA ? hitA.dmg : '?') + '）');

console.log('[狂怒與狂暴疊加]');
var fu = bossSetup('fury', { hp: 1000, curHp: 1000, pdef: 0, mdef: 0 });
var fuA = mk('攻', { hp: 1e6, patk: 300 });
var rFu = runBattle(fuA, fu.foes, 7, 6);
var fu0 = bossSetup(null, { hp: 1000, curHp: 1000, pdef: 0, mdef: 0 });
var rFu0 = runBattle(mk('攻', { hp: 1e6, patk: 300 }), fu0.foes, 7, 6);
ok(rFu.events.some(function (e) { return e.t === 'text' && e.s === '狂怒'; }), '血量低於 50% 時飄「狂怒」');
ok(rFu.events.some(function (e) { return e.t === 'text' && e.s === '狂暴'; }), '血量低於 30% 時仍飄「狂暴」');
ok(!rFu0.events.some(function (e) { return e.t === 'text' && e.s === '狂怒'; }), '無詞綴對照組不飄「狂怒」');
var bHitsFu = hitsOf(rFu, 'B3'), bHits0 = hitsOf(rFu0, 'B3');
ok(bHitsFu.length >= 3 && bHits0.length >= 3, '雙方首領都至少出手 3 次（可比較 1／2／3 擊）');
function ratio(a, b) { return a && b ? a.dmg / b.dmg : 0; }
var r1x = ratio(bHitsFu[0], bHits0[0]), r2x = ratio(bHitsFu[1], bHits0[1]), r3x = ratio(bHitsFu[2], bHits0[2]);
ok(r1x > 0.99 && r1x < 1.01, '狂怒觸發前首領傷害與對照組相同（比值 ' + r1x.toFixed(3) + '）');
ok(r2x > 1.14 && r2x < 1.16, '狂怒觸發後首領傷害 ×1.15（比值 ' + r2x.toFixed(3) + '）');
ok(r3x > 1.34 && r3x < 1.36, '狂怒＋狂暴疊加後首領傷害 ×1.35（比值 ' + r3x.toFixed(3) + '）');
ok(rFu.events.some(function (e) { return e.t === 'text' && e.s === '詞綴·狂怒'; }), '開場戰鬥 log 有「詞綴·狂怒」提示事件');

console.log('[待用種子：面板與實戰一致]');
G.newGame('測試俠', '力耐', 'm', 99);
M.S.state.stages['s1_7'] = { stars: 3, clears: 1, fails: 0 };
ok(G.stageAffix('s1_1') === null && G.stageAffix('s1_4') === null, '普通關／精英關的面板不取詞綴');
var shown = G.stageAffix('s1_8');
ok(shown && shown.id && shown.name && shown.desc && G.pendingSeed && G.pendingSeed.id === 's1_8', '王關面板取到詞綴（' + (shown ? shown.name : '?') + '），待用種子已定');
var out = G.fight('s1_8');
ok(out.ok, '開戰成功');
ok(out.affix === shown.id, '實戰詞綴＝面板顯示的詞綴（' + out.affix + '）');
ok(G.pendingSeed === null, '開戰後待用種子已清除（重打不再沿用同一顆種子）');
var leaderFoe = out.foes.filter(function (f) { return f.cell === 4; })[0];
ok(leaderFoe && leaderFoe.unit.affix === shown.id, '實戰首領單位帶有面板顯示的詞綴');
ok(out.foes.filter(function (f) { return f.unit.affix; }).length === 1, '實戰全場只有首領帶詞綴');
var out2 = G.fight('s1_8', 4242);
ok(out2.ok && out2.affix === B.pickAffix(4242), '明確傳入種子時詞綴由該種子派生（' + out2.affix + '）');
ok(G.stageAffix('s1_8').id === B.pickAffix(G.pendingSeed.seed), '再次開面板：顯示的詞綴＝待用種子派生的詞綴');

console.log('[存檔不動：詞綴不寫入存檔，版本不變]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12');
ok(JSON.stringify(M.S.state).indexOf('affix') < 0, '存檔 JSON 沒有 affix 欄位（詞綴只活在執行期）');
ok(JSON.stringify(M.S.state).indexOf('pendingSeed') < 0, '存檔 JSON 沒有 pendingSeed 欄位');

console.log('[戰前顯示：關卡面板]');
c.MJ.UI = { sel: {}, screens: {}, actions: {}, modals: {}, panel: function (t, b) { return b; }, patternGrid: function () { return ''; } };
c.MJ.Art = { portrait: function () { return '<i></i>'; } };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8'), c);
var affixShown = G.stageAffix('s1_8');
var modalHtml = M.UI.modals.stage('s1_8');
ok(modalHtml.indexOf('首領詞綴') >= 0, '王關出戰視窗有「首領詞綴」列');
ok(affixShown && modalHtml.indexOf(affixShown.name) >= 0 && modalHtml.indexOf(affixShown.desc) >= 0, '出戰視窗顯示詞綴名與效果（' + (affixShown ? affixShown.name + '／' + affixShown.desc : '?') + '）');
var modalNormal = M.UI.modals.stage('s1_1');
ok(modalNormal.indexOf('首領詞綴') < 0, '普通關出戰視窗沒有詞綴列');

console.log('[戰鬥首領頭像標籤]');
c.setTimeout = setTimeout; c.clearTimeout = clearTimeout; // harness 的 vm 沒有 timer，借 node 的
c.document = { getElementById: function () { return null; } };
c.MJ.UI.go = function () {};
c.MJ.Art.battlefield = function () { return ''; };
c.MJ.Art.figure = function () { return ''; };
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-battle.js'), 'utf8'), c);
var outB = G.fight('s1_8');
M.UI.startBattle(outB);
clearTimeout(M.UI.battleState().timer);
var battleHtml = M.UI.screens.battle();
ok(battleHtml.indexOf('affix-tag') >= 0, '戰鬥畫面有 affix-tag');
ok(outB.affix && battleHtml.indexOf(B.affixById(outB.affix).name) >= 0, '戰鬥畫面首領頭像旁顯示詞綴名（' + (outB.affix ? B.affixById(outB.affix).name : '?') + '）');
var outN = G.fight('s1_1');
M.UI.startBattle(outN);
clearTimeout(M.UI.battleState().timer);
var battleHtmlN = M.UI.screens.battle();
ok(battleHtmlN.indexOf('affix-tag') < 0, '普通關戰鬥畫面沒有詞綴標籤');
var gateSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'ui-gate.js'), 'utf8');
ok(gateSrc.indexOf('首領詞綴') >= 0 && gateSrc.indexOf('stageAffix') >= 0, 'ui-gate.js 含有詞綴顯示邏輯');
var cssSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'css', 'style.css'), 'utf8');
ok(cssSrc.indexOf('.affix-tag') >= 0 && cssSrc.indexOf('.row.affix') >= 0, 'style.css 有詞綴標籤與面板列樣式');

console.log('[provenance]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var pe = prov.entries.filter(function (e) { return e.id === 'boss.affix'; })[0];
ok(!!pe && pe.grade === 'D' && pe.phase === 'WL-4', 'provenance 有 boss.affix D 級紀錄（WL-4）');
ok(prov.entries.length === 296, 'provenance 共 296 條（295＋1，WL-7 加 mode.doubleChallenge）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
