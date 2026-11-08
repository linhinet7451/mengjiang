// 網路資料搜查-2 P3-3～P3-5 驗收。node tests/unit-web2-p3-3-5.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var facts = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'sources-extracted', 'web2', 'c-p3-3-5.json'), 'utf8'));
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh() { var c = load(); c.MJ.G.newGame('P3測試', '力耐', 'm', 13); return c; }

console.log('[P3-3 建築開放與舊存檔保留]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S, D = M.D;
ok(D.config.buildings.wuji.open === 12 && D.config.buildings.tongtian.open === 22 && D.config.buildings.jiangxing.open === 30, '已實作建築門檻為無極 12／通天 22／將星錄 30');
G.lead().lv = 29; ok(!G.buildingOpen('jiangxing'), '新存檔 Lv29 將星錄鎖定');
G.lead().lv = 30; ok(G.buildingOpen('jiangxing'), '主角 Lv30 將星錄開放');
var old = JSON.parse(JSON.stringify(S.state)), oldLead = old.heroes.filter(function (h) { return h.id === 'lead'; })[0];
old.version = 10; oldLead.lv = 63; oldLead.exp = R.expNeed(63) + 54321; old.jiangxing = { lit: 5, pts: 7 }; old.player.xinghun = 17; delete old.buildingUnlocks;
var oldLevel = oldLead.lv, oldExp = oldLead.exp, migrated = S.migrate(old);
ok(migrated.version === 11 && migrated.migratedFrom === 10, 'v10 存檔升至 v11');
ok(migrated.heroes.filter(function (h) { return h.id === 'lead'; })[0].lv === oldLevel && migrated.heroes.filter(function (h) { return h.id === 'lead'; })[0].exp === oldExp, '經驗表切換不降主角等級、不清除現有經驗');
ok(migrated.jiangxing.lit === 0 && migrated.jiangxing.legacyStarsRefunded === 5 && migrated.jiangxing.legacySoulRefunded === 130 && migrated.player.xinghun === 147, '5 顆舊星盤投入按 10+18+26+34+42 全數退回，既有星魂一併保留');
S.state = migrated;
ok(migrated.buildingUnlocks.jiangxing && G.buildingOpen('jiangxing') === true, '舊版 16 級門檻已能進入者遷移後保留解鎖');
var balanceAfter = migrated.player.xinghun; S.migrate(migrated); ok(migrated.player.xinghun === balanceAfter, '重複執行遷移不會重複退款');
var savedStep10 = S.STEPS[10], failingState = JSON.parse(JSON.stringify(migrated)), migrationThrew = false;
failingState.version = 10; failingState.jiangxing = { lit: 5, pts: 0 };
S.STEPS[10] = function () { throw new Error('測試用遷移失敗'); };
try { S.migrate(failingState); } catch (migrationError) { migrationThrew = /v10/.test(migrationError.message); }
var rejectedMigration = S.parse(JSON.stringify({ app: S.APP, version: 10, data: failingState }));
S.STEPS[10] = savedStep10;
ok(migrationThrew && failingState.version === 10, '遷移步驟拋錯時版本留在 v10');
ok(!rejectedMigration.ok && /v10/.test(rejectedMigration.errors[0]), '失敗的部分遷移存檔由 parse 拒絕，不回存假 v11');

console.log('[P3-4 sn=6 逐級經驗表]');
var exp = facts.experience, badLv = [];
for (var i = 0; i < exp.values.length; i++) if (R.expNeed(exp.minLevel + i) !== exp.values[i]) badLv.push(exp.minLevel + i);
ok(exp.values.length === 73 && badLv.length === 0, '逐級比對 sn=6 Lv7–79 全部 73 列（不符：' + (badLv.join(',') || '無') + '）');
ok(R.expNeed(72) === 892766 && R.expNeed(73) === 892766, 'Lv72／73 重複值照錄，沒有自動修補');
ok(R.expNeed(6) === 125 && R.expNeed(1) > 0 && R.expNeed(80) > R.expNeed(79) && R.expNeed(90) > R.expNeed(89), '來源表外 Lv1–6／80–90 有明示 D 級值且尾段單調');

console.log('[P3-5 組合條件與魂量表]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; D = M.D;
var names = facts.jiangxing.combinations.map(function (x) { return x.name; });
ok(D.config.jiangxing.combos.length === 19 && names.join('|') === D.config.jiangxing.combos.map(function (x) { return x.name; }).join('|'), '載入 19 組原版組合名稱，未混用其他新增組合');
var ranks = Object.keys(facts.jiangxing.soulCostsByLevel), tableBad = [];
ranks.forEach(function (rank) {
  var expected = facts.jiangxing.soulCostsByLevel[rank], actual = D.config.jiangxing.soulCostsByLevel[rank];
  for (var lv = 1; lv <= 18; lv++) if (actual[lv - 1] !== expected[lv - 1]) tableBad.push(rank + ':' + lv);
});
ok(ranks.length === 5 && tableBad.length === 0, '白／綠／藍／30紫／45紫逐格核對 Lv1–18（缺值與 null 保留）');
var whiteDef = D.heroes.list.filter(function (h) { return h.quality === 1; })[0];
var w = G.newHero(whiteDef.id, S.state); S.state.heroes.push(w); G.lead().lv = 30; w.jxLevel = 9;
S.state.bag.stack['soul:' + w.id] = 999;
ok(R.jxSoulGroup(w) === 'white' && R.jxSoulCost(w, 10) === null, '白魂 Lv10 衝突欄為 null，未暗選 10 或 11');
var wBefore = S.state.bag.stack['soul:' + w.id], blocked = G.jxLevelUp(w.uid);
ok(!blocked.ok && w.jxLevel === 9 && S.state.bag.stack['soul:' + w.id] === wBefore, '來源缺值／衝突時禁止升級，不扣除將魂');

function addHero(id, lv) { var h = G.newHero(id, S.state); h.jxLevel = lv; S.state.heroes.push(h); return h; }
var aoxue = G.jxComboStatus('aoxuezhonghun');
ok(aoxue.state === 'incomplete', '已知組合在缺少條件武將時顯示未符合');
addHero('caocao', 1); addHero('huangyueying', 2);
ok(G.jxComboStatus('aoxuezhonghun').state === 'ready', '傲血忠魂依力耐 Lv1＋智敏 Lv2 判斷條件');
addHero('tianshantonglao', 2); addHero('xuchu', 2); addHero('sunce', 2);
ok(G.jxComboStatus('tianshanshuangxue').state === 'ready', '天山霜雪依天山童姥／許褚／孫策 Lv2 判斷條件');
ok(G.jxComboStatus('yuexiawujian').state === 'unknown', '原文未列完整條件的月下舞劍保持未知，不推測啟動');
var bonus0 = JSON.stringify(R.teamBonus(S.state)); S.state.jiangxing.lit = 1;
ok(JSON.stringify(R.teamBonus(S.state)) === bonus0 && typeof G.lightStar === 'undefined', '舊二十八宿不再加成；新組合數值未擅自套入戰鬥');
var effectRule = D.provenance.entries.filter(function (e) { return e.id === 'web2.jiangxing.combatEffects'; })[0];
ok(effectRule && effectRule.grade === 'D' && /未加進戰鬥/.test(effectRule.current), '來源效果的戰鬥套用政策另列 D 級 provenance');

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
