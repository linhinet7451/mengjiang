// 聚賢莊升級／武將上限（Tomas 2026-11-04：聚賢莊 Lv1 武將數 5/5 無法升級）。node tests/unit-juxian.js
// B（S1 sn41）：建築升級可以提升武將欄位；數字（每級 +1、500×Lv² 銀、不超過主角等級）D。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, G = M.G, S = M.S, R = M.R;
M.U.now = function () { return 1767225600000; };
G.newGame('測', '力耐', 'm', 1);
var s = S.state;
console.log('[新遊戲]');
ok((s.buildings.juxian || 1) === 1 && R.rosterCap(s) === 5, '新遊戲：聚賢莊 Lv1、武將上限 5');
var info = G.juxianInfo();
ok(info.cap === 5 && info.nextCap === 6 && info.cost === G.buildingCost('juxian', 1) && info.needLead === 2, '升級資訊：Lv1 上限 5 → Lv2 上限 6，費用 ' + info.cost + ' 銀，需要主角 Lv2');
G.lead().lv = 1; s.player.silver = 1e9;
var r = G.upgradeBuilding('juxian');
ok(!r.ok && /主角/.test(r.msg || r.err || JSON.stringify(r)) && s.buildings.juxian === 1, '主角 Lv1 時不能升級（不超過主角等級），等級不變');
ok(!G.juxianInfo().ok && /主角 Lv2/.test(G.juxianInfo().why), '畫面上的不能升級原因寫明需要主角 Lv2');
G.lead().lv = 10; s.player.silver = 100;
r = G.upgradeBuilding('juxian');
ok(!r.ok && s.buildings.juxian === 1 && s.player.silver === 100, '銀幣不足時不能升級、不扣錢');
s.player.silver = 1e6;
var cost = G.buildingCost('juxian', 1);
r = G.upgradeBuilding('juxian');
ok(r.ok && s.buildings.juxian === 2 && s.player.silver === 1e6 - cost && R.rosterCap(s) === 6, '升級成功：Lv2、扣 ' + cost + ' 銀、武將上限 6');
var p = S.load();
ok(p.ok && p.state.buildings.juxian === 2 && R.rosterCap(p.state) === 6, '升級後自動存檔，重新讀檔仍是 Lv2／上限 6');
for (var i = 0; i < 3; i++) G.upgradeBuilding('juxian');
ok(s.buildings.juxian === 5 && R.rosterCap(s) === 9, '連升到 Lv5：上限 9（每級 +1）');
ok(G.buildingCost('juxian', 4) === 8000, '費用 500×Lv²（Lv4→5：8,000 銀）');
G.lead().lv = 5; r = G.upgradeBuilding('juxian');
ok(!r.ok && s.buildings.juxian === 5, '主角 Lv5 時聚賢莊最多 Lv5');

console.log('[招募上限]');
c = load(); M = c.MJ; G = M.G; S = M.S; R = M.R; M.U.now = function () { return 1767225600000; };
G.newGame('測', '力耐', 'm', 1); s = S.state;
var ids = Object.keys(M.D.heroIndex || {}).filter(function (id) { return id !== 'lead' && !s.heroes.some(function (h) { return h.id === id; }); });
while (s.heroes.length < 5) s.heroes.push(G.newHero(ids.shift(), s));
var cid = ids.shift(); s.recruit.cands = [cid]; s.player.silver = 1e9;
r = G.recruit(cid);
ok(!r.ok && /升級聚賢莊/.test(JSON.stringify(r)) && s.heroes.length === 5, '5/5 時招募失敗，訊息提示升級聚賢莊');
G.lead().lv = 3; G.upgradeBuilding('juxian');
r = G.recruit(cid);
ok(r.ok && s.heroes.length === 6, '升級聚賢莊後可以招募第 6 名武將（6/' + R.rosterCap(s) + '）');

console.log('[舊存檔不縮減]');
['save-v8.json', 'save-v9.json', 'save-v10.json'].forEach(function (f) {
  var raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
  var cc = load(), MM = cc.MJ;
  var d = raw.data || raw; var n0 = d.heroes.length;
  // 人為讓武將數超過上限：多塞 3 名，聚賢莊設回 1
  var hid = Object.keys(MM.D.heroIndex).filter(function (id) { return id !== 'lead' && !d.heroes.some(function (h) { return h.id === id; }); });
  var over = JSON.parse(JSON.stringify(d.heroes[d.heroes.length - 1]));
  var extra = 7 - n0; for (var k = 0; k < extra; k++) { var x = JSON.parse(JSON.stringify(over)); x.uid = 'xx' + k; x.id = hid[k]; d.heroes.push(x); }
  if (d.buildings) d.buildings.juxian = 1;
  var pr = MM.S.parse(JSON.stringify(raw));
  ok(pr.ok && pr.state.heroes.length === Math.max(7, n0) && pr.state.buildings.juxian === 1, f + '：武將數超過上限（' + pr.state.heroes.length + '/' + MM.R.rosterCap(pr.state) + '）時讀檔不刪武將、聚賢莊等級不變');
  var raw2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8')), d2 = raw2.data || raw2;
  var lv0 = (d2.buildings && d2.buildings.juxian) || 1, pr2 = MM.S.parse(JSON.stringify(raw2));
  ok(pr2.ok && (pr2.state.buildings.juxian || 1) === lv0 && pr2.state.heroes.length === d2.heroes.length && MM.R.rosterCap(pr2.state) >= 5, f + '：原樣讀檔聚賢莊 Lv' + lv0 + '、武將 ' + d2.heroes.length + ' 名都保留');
});
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
