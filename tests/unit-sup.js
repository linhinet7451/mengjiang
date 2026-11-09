// WL-3：等級壓制改傷害遞減——等差 >10 時每多 1 級 −5%，最低 10%（D）。node tests/unit-sup.js
var load = require('./harness.js');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle;
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', hit: 200, crit: 0, active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 11 }; for (var k in (o || {})) u[k] = o[k]; return u; }
// 我方先攻：取第一個 A→B 的 hit 事件
function firstHit(attLv, tgtLv, seed, opt) {
  opt = opt || {}; opt.seed = seed; opt.maxRounds = 2; if (opt.levelSuppression == null) opt.levelSuppression = 10;
  var r = B.run([{ cell: 3, unit: mk('攻', { lv: attLv }) }], [{ cell: 3, unit: mk('守', { lv: tgtLv }) }], opt);
  var hits = r.events.filter(function (e) { return e.t === 'hit' && e.from === 'A3' && e.to === 'B3'; });
  return hits.length ? hits[0] : null;
}

console.log('[壓制倍率 e.sup]');
var h = firstHit(20, 30, 1);
ok(h && !h.miss && h.dmg > 0 && h.sup == null, '等差 10：不壓制，正常命中（dmg ' + (h ? h.dmg : '?') + '，無 e.sup）');
h = firstHit(20, 31, 1);
ok(h && !h.miss && h.sup === 0.95, '等差 11：倍率 0.95（e.sup=' + (h ? h.sup : '?') + '）');
h = firstHit(20, 40, 1);
ok(h && !h.miss && h.sup === 0.5, '等差 20：倍率 0.50（e.sup=' + (h ? h.sup : '?') + '）');
h = firstHit(20, 48, 1);
ok(h && !h.miss && h.sup === 0.1, '等差 28：倍率剛好 0.10（e.sup=' + (h ? h.sup : '?') + '）');
h = firstHit(20, 50, 1);
ok(h && !h.miss && h.sup === 0.1, '等差 30：倍率鎖底 0.10（e.sup=' + (h ? h.sup : '?') + '），不是 0');
h = firstHit(20, 60, 1);
ok(h && !h.miss && h.sup === 0.1 && h.dmg > 0, '等差 40：仍鎖底 0.10 且造成傷害（dmg ' + (h ? h.dmg : '?') + '）');

console.log('[仍能命中並造成傷害：傷害值＝同種子無壓制傷害 × 倍率]');
var base = firstHit(20, 30, 7), sup15 = firstHit(20, 35, 7);
ok(base && sup15 && !sup15.miss && sup15.sup === 0.75 && sup15.dmg > 0, '等差 15：命中且有傷害（e.sup=0.75，dmg ' + (sup15 ? sup15.dmg : '?') + '）');
ok(base && sup15 && sup15.dmg === Math.floor(base.dmg * 0.75), '等差 15 傷害＝同種子等差 10 傷害 ×0.75（' + (base ? base.dmg : '?') + ' → ' + (sup15 ? sup15.dmg : '?') + '）');

console.log('[不再必定未命中：大等差多種子都沒有「等級壓制」未命中]');
var noSupMiss = true, landed = 0;
for (var s = 1; s <= 20; s++) {
  var r = B.run([{ cell: 3, unit: mk('攻', { lv: 10 }) }], [{ cell: 3, unit: mk('守', { lv: 40 }) }], { seed: s, maxRounds: 4, levelSuppression: 10 });
  r.events.forEach(function (e) { if (e.t === 'hit' && e.miss && e.why === '等級壓制') noSupMiss = false; if (e.t === 'hit' && e.from === 'A3' && !e.miss && e.dmg > 0) landed++; });
}
ok(noSupMiss, '等差 30、20 個種子：沒有任何「等級壓制」未命中事件');
ok(landed > 0, '等差 30、20 個種子：我方確實打中 ' + landed + ' 次');

console.log('[門檻取 lvSup，不寫死 10]');
h = firstHit(20, 28, 1, { levelSuppression: 5 });
ok(h && !h.miss && h.sup === 0.85, '自訂 levelSuppression=5、等差 8：倍率 0.85（e.sup=' + (h ? h.sup : '?') + '）');

console.log('[舊戰報重播：v6 以前仍用必定未命中舊規則]');
h = firstHit(20, 50, 1, { oldSuppression: true });
ok(h && h.miss && h.why === '等級壓制' && h.sup == null, 'oldSuppression：等差 30 仍必定未命中（why=等級壓制，無 e.sup）');
h = firstHit(20, 50, 1, { oldSuppression: false });
ok(h && !h.miss && h.sup === 0.1, '不傳 oldSuppression：等差 30 走傷害遞減（e.sup=0.1）');

console.log('[公式說明與設定]');
ok(B.FORMULA_NOTE.indexOf('以上必定未命中') < 0 && B.FORMULA_NOTE.indexOf('遞減') >= 0, 'FORMULA_NOTE 已改為傷害遞減說法，不再寫必定未命中（舊規則僅在括號註明已取代）');
ok(M.D.config.levelSuppression === 10, 'config.levelSuppression 仍為 10（現為遞減門檻）');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
