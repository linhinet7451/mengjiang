// 網路資料搜查-2 P3：技能倍率、等級曲線、傷害上限與舊規則相容。node tests/unit-web2-p3.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, R = M.R, D = M.D, B = M.Battle;
function skill(id, w, lv) { return R.skillOf({ id: id, lv: 30, sk: { a: lv, u: lv } }, w); }
function close(a, b) { return Math.abs(a - b) < 0.0001; }
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
function pe(id) { return (prov.entries || []).filter(function (e) { return e.id === id; })[0]; }

console.log('[來源倍率覆蓋]');
var sourced = D.heroes.list.filter(function (h) { return h.active && h.active.p3 && h.ult && h.ult.p3; });
ok(sourced.length === 61, 'W967 的 61 名武將均有主動與無雙基準倍率（實際 ' + sourced.length + '）');
ok(D.heroes.list.filter(function (h) { return h.active && !h.active.p3; }).length === 27, '其餘 27 名未列來源武將保留原有 D 級技能倍率');
['web2.skill.rates', 'web2.skill.activeCurve', 'web2.skill.ultProgression', 'web2.skill.capObserved', 'web2.skill.capRule'].forEach(function (id) {
  var e = pe(id); ok(!!e && /^[ABCD]$/.test(e.grade) && (!/^[CD]$/.test(e.grade) || !/原版/.test(e.label || '')), 'provenance ' + id + ' 有正確分級');
});

console.log('[主動技能倍率觀測與推算]');
var s = skill('caocao', 'a', 1); ok(close(s.mult, 0.74) && s.flat === 5, '曹操 Lv1 = x0.74+5（W967）');
s = skill('caocao', 'a', 6); ok(close(s.mult, 1) && s.flat === 125, '曹操 Lv6 = x1+125（W967／W282）');
s = skill('caocao', 'a', 9); ok(close(s.mult, 1) && s.flat === 275, '曹操 Lv9 固定值依 Lv6 後每級 +50 推算');
s = skill('liubei', 'a', 1); ok(close(s.mult, 0.94) && s.flat === 5, '劉備 Lv1 = x0.94+5');
s = skill('liubei', 'a', 6); ok(close(s.mult, 1.24) && s.flat === 125, '劉備 Lv6 = x1.24+125');
s = skill('liubei', 'a', 9); ok(close(s.mult, 1.24) && s.flat === 275, '劉備 Lv9 = x1.24+275');
s = skill('xiaozhao', 'a', 5); ok(s.flat === 75, '小昭 Lv5 固定值符合截圖 +75');
s = skill('xiaozhao', 'a', 6); ok(close(s.mult, 0.99) && s.flat === 125, '小昭 Lv6 基準符合來源');
s = skill('xiaozhao', 'a', 7); ok(s.flat === 175, '小昭 Lv7 固定值 +175');
s = skill('xiaozhao', 'a', 9); ok(s.flat === 275, '小昭 Lv9 固定值 +275');
s = skill('yangguo', 'a', 1); ok(close(s.mult, 0.68) && s.flat === 5, '楊過 Lv1 主動倍率採來源表');
s = skill('yangguo', 'a', 6); ok(close(s.mult, 0.88) && s.flat === 125, '楊過 Lv6 主動倍率採來源表');
s = skill('wangyuyan', 'a', 1); ok(close(s.mult, 1.1) && s.flat === 5, '王語嫣 Lv1 主動倍率採來源表');
s = skill('wangyuyan', 'a', 6); ok(close(s.mult, 1.55) && s.flat === 125, '王語嫣 Lv6 主動倍率採來源表');

console.log('[無雙基準與 cap]');
s = skill('liubei', 'u', 1); ok(close(s.mult, 0.52) && s.flat === 10, '劉備無雙 Lv1 = x0.52+10');
ok(s.pattern === 'all' && s.maxDamage === 3000, '劉備無雙採全體攻擊並帶 3000 上限');
s = skill('yangguo', 'a', 6); ok(s.maxDamage === 6000, '楊過 Lv6 主動帶 6000 傷害上限');
function duelHitDamage(active, ult, rage) {
  var attack = { name: '測試攻擊者', hp: 10000000, maxHp: 10000000, patk: 1000000, matk: 1000000, jatk: 1000000, pdef: 0, mdef: 0, jdef: 0, hit: 200, lv: 30, dtype: 'p', active: active, ult: ult, curRage: rage || 0, rv: 13 };
  var target = { name: '測試目標', hp: 10000000, maxHp: 10000000, patk: 0, matk: 0, jatk: 0, pdef: 0, mdef: 0, jdef: 0, hit: 200, lv: 30, dtype: 'p', active: { name: '無', pattern: 'all', mult: 0, flat: 0 }, ult: { name: '無', pattern: 'all', mult: 0, flat: 0 }, rv: 13 };
  var r = B.run([{ cell: 0, unit: attack }], [{ cell: 0, unit: target }], { seed: 17, maxRounds: 1 });
  return r.events.filter(function (e) { return e.t === 'hit' && e.from === 'A0' && !e.miss && !e.dot; }).map(function (e) { return e.dmg; });
}
var yg = skill('yangguo', 'a', 6); yg.pattern = 'all';
var yHits = duelHitDamage(yg, { name: '無', pattern: 'all', mult: 0, flat: 0 }, 0);
ok(yHits.length > 0 && yHits.every(function (n) { return n <= 6000; }) && yHits.indexOf(6000) >= 0, '楊過主動傷害命中時逐目標封頂 6000（實際 ' + yHits.join(',') + '）');
var lbUlt = skill('liubei', 'u', 1);
var lbHits = duelHitDamage({ name: '無', pattern: 'all', mult: 0, flat: 0 }, lbUlt, 100);
ok(lbHits.length > 0 && lbHits.every(function (n) { return n <= 3000; }) && lbHits.indexOf(3000) >= 0, '劉備無雙傷害命中時逐目標封頂 3000（實際 ' + lbHits.join(',') + '）');

console.log('[舊規則快照與 fallback]');
R.RV = 12;
var old = skill('caocao', 'a', 6);
ok(close(old.mult, 1.755) && old.flat === 0 && old.maxDamage == null, 'RV12 重建沿用舊倍率曲線且不套新 cap');
R.RV = 13;
var unsourced = D.heroes.list.filter(function (h) { return h.active && !h.active.p3; })[0];
var fallback = skill(unsourced.id, 'a', 6);
ok(!!unsourced && close(fallback.mult, unsourced.active.mult * 1.3), '未列來源武將保留既有 D 級等級倍率');
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exitCode = fail ? 1 : 0;
