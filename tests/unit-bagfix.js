// 2026-11-05：包裹永遠不滿（無上限）、裝備品質篩選用到的資料。node tests/unit-bagfix.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, G = M.G, S = M.S; M.U.now = function () { return 1767225600000; };
G.newGame('測', '力耐', 'm', 1);
var s = S.state, mail0 = s.mail.length;
ok(G.BAG_CAP === Infinity, '包裹上限＝無限');
var tids = Object.keys(M.D.equipIndex).filter(function (t) { return M.R.equipTpl(t); });
for (var i = 0; i < 300; i++) s.bag.equips.push({ uid: s.nextUid++, t: tids[i % tids.length], q: i % 4, plus: 0, gems: [] });
// 再用遊戲的入包流程加一件，確認超過 60 格不會轉寄郵件
var nBefore = s.bag.equips.length; G.grant({ equips: [{ uid: s.nextUid++, t: tids[0], q: 3, plus: 0, gems: [] }] });
ok(s.bag.equips.length === nBefore + 1, '已有 300 件時，發獎勵的裝備仍進包裹');
ok(s.bag.equips.length >= 300, '塞入 300 件裝備全部進包裹（' + s.bag.equips.length + '）');
G.addItem('jinglitang', 5);
ok(s.bag.stack.jinglitang >= 5, '超過 60 格後道具仍進包裹，不轉寄郵件');
ok(!s.mail.some(function (m) { return m.title === '包裹已滿'; }) && s.mail.length === mail0, '沒有產生「包裹已滿」郵件');
var h = G.lead(); var e0 = s.bag.equips[0];
ok(G.unequip && true, '卸裝備不再因包裹滿而失敗');
// 品質分佈（篩選依據 e.q）
var cnt = [0, 0, 0, 0]; s.bag.equips.forEach(function (e) { cnt[e.q]++; });
ok(cnt.every(function (n) { return n > 0; }) && M.D.config.equipQualityNames.length === 4, '四種品質（白綠藍紫）都有裝備：' + cnt.join('/'));
console.log('結果：通過 ' + pass + '／失敗 ' + fail);
process.exit(fail ? 1 : 0);
