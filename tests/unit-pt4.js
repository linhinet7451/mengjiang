// pt12u 第 4 階段（P4）：16 種被動＋高級熱血、後天被動欄、狀態抵抗／施加機率／PVP／PVE、戰報版本、v6→v7。node tests/unit-pt4.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return T0; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c, M, G, S, R, B, r;
function cp(x) { return JSON.parse(JSON.stringify(x)); }
// 測試用單位：同數值，只改被動／屬性
function unit(o) {
  var u = { name: '甲', lv: 30, dtype: 'p', phys: true, patk: 400, matk: 50, jatk: 50, pdef: 120, mdef: 120, jdef: 120, hp: 6000, hit: 0, crit: 0, dodge: 0,
    active: { name: '攻擊', pattern: 'single', mult: 1, flat: 0 }, ult: { name: '無雙', pattern: 'single', mult: 1.5, flat: 0 }, passive: null, pm: 1, layers: 1 };
  for (var k in o) u[k] = o[k];
  return u;
}
function duel(a, b, seed, opt) { opt = opt || {}; opt.seed = seed; opt.maxRounds = opt.maxRounds || 8; opt.levelSuppression = 10; return B.run([{ unit: cp(a), cell: 4 }], [{ unit: cp(b), cell: 4 }], opt); }
function dmgTo(res, key) { var t = 0; res.events.forEach(function (e) { if (e.t === 'hit' && e.to === key && e.dmg) t += e.dmg; }); return t; }
function count(res, f) { return res.events.filter(f).length; }

console.log('[回歸：沒有新被動時，戰鬥事件與 P3 引擎完全相同]');
var gold = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v6.json'), 'utf8'));
var now = require('./golden-run.js')(load, { legacy: true }); // 改版前資料＋舊規則版本
var same = gold.runs.length === now.runs.length && gold.runs.every(function (g, i) { var n = now.runs[i]; return g.h === n.h && g.n === n.n && g.win === n.win; });
ok(same, gold.runs.length + ' 場固定種子戰鬥（含 ' + gold.passives.filter(function (p, i, a) { return a.indexOf(p) === i; }).join('、') + '）雜湊一致');

console.log('[16 種被動＋高級熱血：資料齊全]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R; B = M.Battle;
var names = G.PASSIVE_IDS.map(function (id) { return M.D.heroes.passives[id] && M.D.heroes.passives[id].name; });
ok(G.PASSIVE_IDS.length === 17 && names.every(Boolean), '17 個被動都有名稱與說明：' + names.join('、'));
var spec = ['不死', '復甦', /* web2-P2：snA967 原名「復甦」，舊稱甦醒 */ '忍耐', '化解', '息怒', '吸血', '熱血', '高級禦敵', '破咒', '破甲', '鈍化', '碎甲', '連斬', '回斬', '療傷', '高級療傷'];
ok(spec.every(function (n) { return names.indexOf(n) >= 0; }) && names.indexOf('高級熱血') >= 0, '規格的 16 種＋決策 7 的高級熱血全部存在');
ok(G.PASSIVE_IDS.filter(function (id) { return [/* renai、huajie、pozhou 於 web2-P2 改依 snA967 標 B */ 'gaojiyudi', 'pojia', 'dunhua', 'suijia', 'gjliaoshang', 'gjrexue'].indexOf(id) >= 0; }).every(function (id) { return /D/.test(M.D.heroes.passives[id].grade); }), '本作自創被動數值全部標 D（暫定）；忍耐、化解、破咒改依 snA967 為 B');

console.log('[新被動戰鬥效果（同種子比較）]');
var A0 = unit({}), Bf = unit({ name: '乙' });
var base = duel(A0, Bf, 7);
r = duel(unit({ passive: 'renai' }), Bf, 7);
ok(r.events[0].units[0].rage === 15 && base.events[0].units[0].rage === 0, '忍耐：開場無雙值 +15');
r = duel(A0, unit({ name: '乙', pb: 'gaojiyudi' }), 7);
ok(dmgTo(r, 'B4') < dmgTo(base, 'B4'), '高級禦敵（習得欄）：受到傷害較少（' + dmgTo(r, 'B4') + ' < ' + dmgTo(base, 'B4') + '）');
r = duel(unit({ passive: 'pojia' }), Bf, 7);
ok(dmgTo(r, 'B4') > dmgTo(base, 'B4'), '破甲：造成傷害較多（' + dmgTo(r, 'B4') + ' > ' + dmgTo(base, 'B4') + '）');
r = duel(A0, unit({ name: '乙', passive: 'huajie' }), 7, { maxRounds: 20 });
var hj = r.events.filter(function (e) { return e.t === 'hit' && e.to === 'B4' && e.hj; });
ok(hj.length > 0 && count(r, function (e) { return e.t === 'text' && e.s === '化解'; }) === hj.length, '化解：觸發時出現「化解」字樣（' + hj.length + ' 次）');
r = duel(unit({ passive: 'suijia' }), unit({ name: '乙', hp: 60000 }), 7, { maxRounds: 10 });
var sj = r.events.filter(function (e) { return e.t === 'text' && /^碎甲/.test(e.s); }).map(function (e) { return e.s; });
ok(sj.join(',') === '碎甲1,碎甲2,碎甲3', '碎甲：最多疊 3 層（' + sj.join(',') + '）');
r = duel(unit({ passive: 'dunhua' }), unit({ name: '乙', hp: 60000 }), 7, { maxRounds: 12 });
ok(count(r, function (e) { return e.t === 'status' && e.s === '鈍化'; }) > 0, '鈍化：命中後可使目標鈍化');
r = duel(unit({ passive: 'dunhua' }), unit({ name: '乙', hp: 60000, res: 100 }), 7, { maxRounds: 12 });
ok(count(r, function (e) { return e.t === 'status' && e.s === '鈍化'; }) === 0, '狀態抵抗 100%：不會被鈍化');
r = duel(unit({ hp: 6000 }), unit({ name: '乙', passive: 'gjliaoshang' }), 7, { maxRounds: 6 });
var gl = count(r, function (e) { return e.t === 'text' && e.s === '高級療傷'; });
ok(gl >= 4, '高級療傷：受傷後每回合必定回復（' + gl + ' 次／6 回合）');
r = duel(unit({ patk: 99999 }), unit({ name: '乙', pb: 'busi' }), 7, { maxRounds: 2 });
ok(count(r, function (e) { return e.t === 'revive' && e.name === '不死'; }) === 1, '習得欄的「不死」在戰鬥中生效（復活 1 次）');

console.log('[狀態抵抗／負面狀態施加機率]');
var stunA = unit({ hit: 20, active: { name: '擊暈', pattern: 'single', mult: 0.1, flat: 0, fx: { stun: 0.5 } } });
function stuns(a, b) { var n = 0; for (var sd = 1; sd <= 30; sd++) { var x = duel(a, b, sd, { maxRounds: 1 }); n += count(x, function (e) { return e.t === 'status' && e.s === '眩暈'; }); } return n; }
var s0 = stuns(stunA, unit({ name: '乙', hp: 60000 })), s1 = stuns(unit({ hit: 20, dbf: 100, active: stunA.active }), unit({ name: '乙', hp: 60000 })), s2 = stuns(stunA, unit({ name: '乙', hp: 60000, passive: 'pozhou', res: 50 }));
ok(s1 === 30 && s0 > 0 && s0 < 30, '施加機率 +100%：50% 眩暈變 100%（30 場：' + s0 + ' → ' + s1 + '）');
ok(s2 === 0, '破咒 +50% 加上 50% 抵抗＝100%：不會被眩暈（' + s2 + ' 次）');

console.log('[PVP／PVE 傷害]');
var pA = unit({ pvp: 50 }), eA = unit({ pve: 50 });
ok(dmgTo(duel(pA, Bf, 7, { pvp: true }), 'B4') > dmgTo(duel(A0, Bf, 7, { pvp: true }), 'B4'), 'PVP 傷害 +50% 在 PVP 戰鬥提高傷害');
ok(dmgTo(duel(pA, Bf, 7), 'B4') === dmgTo(base, 'B4'), 'PVP 傷害在 PVE 戰鬥無效');
ok(dmgTo(duel(eA, Bf, 7), 'B4') > dmgTo(base, 'B4') && dmgTo(duel(eA, Bf, 7, { pvp: true }), 'B4') === dmgTo(duel(A0, Bf, 7, { pvp: true }), 'B4'), 'PVE 傷害只在 PVE 戰鬥生效');

console.log('[後天被動欄：習得與替換]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var L = G.lead(); S.state.player.silver = 20000; G.addItem('jinengshu', 12);
r = G.pbLearn(L.uid, 'huajie');
ok(!r.ok && /30/.test(r.msg), '未滿 30 級不能習得');
L.lv = 30;
var hp0 = R.derived(L, S.state).hp;
r = G.pbLearn(L.uid, 'gjrexue');
ok(r.ok && L.pb === 'gjrexue' && S.state.player.silver === 15000 && S.state.bag.stack.jinengshu === 7, '習得高級熱血：扣 5000 銀＋5 技能書');
ok(R.derived(L, S.state).hp === Math.floor(hp0 * 1.2), '高級熱血：生命 ×1.2（' + hp0 + ' → ' + R.derived(L, S.state).hp + '）');
ok(R.heroUnit(L, S.state).pb === 'gjrexue', '戰鬥單位帶上習得被動');
r = G.pbLearn(L.uid, 'gjrexue');
ok(!r.ok, '已經習得的不能重複習得');
r = G.pbLearn(L.uid, 'rexue');
ok(r.ok && L.pb === 'rexue' && R.derived(L, S.state).hp === Math.floor(hp0 * 1.1) && r.old === 'gjrexue', '替換為熱血：生命 ×1.1，舊被動被取代');
r = G.pbLearn(L.uid, 'pojia');
ok(!r.ok && /技能書/.test(r.msg) && L.pb === 'rexue', '技能書不足時失敗，不改變被動');
var withP = M.D.heroes.list.filter(function (d) { return d.passive === 'lianzhan'; })[0];
var hh = G.newHero(withP.id, S.state); hh.lv = 30; S.state.heroes.push(hh);
ok(G.pbChoices(hh.uid).indexOf('lianzhan') < 0 && G.pbChoices(hh.uid).length === 16, '武將本身的被動不在可習得清單（' + withP.name + '：16 種可選）');

console.log('[新屬性來源：心法]');
G.addItem('xf_jingang', 1); G.addItem('xf_zhengfeng', 1);
L.lv = 40; r = G.xinfaLearn(L.uid, 'jingang');
ok(r.ok && R.derived(L, S.state).res === 1.5, '金剛心法 Lv1：狀態抵抗 +1.5');
var buy = M.D.shop.filter(function (x) { return /^shop_xf_/.test(x.id); });
ok(buy.length === 4 && G.buy('shop_xf_fumo').ok && S.state.bag.stack.xf_fumo === 1, '商城可買 4 種新心法（伏魔心法購買成功）');

console.log('[拜訪武將：PVP 戰報 v7，重播一致]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
G.lead().lv = 40; S.state.heroes.forEach(function (h) { h.lv = 40; });
r = G.arenaFight(30, 99);
var rec = S.state.arena.recs[0];
ok(r.ok && rec.v === 7 && rec.pvp === true, '新戰報 v = 7 並標記 PVP');
var rp = G.arenaReplay(0);
ok(rp.ok && rp.consistent, '新戰報重播結果相同');

console.log('[存檔 v6 → v7 遷移]');
c = load(); c.MJ.U.now = function () { return T0; }; M = c.MJ;
var p = M.S.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v6.json'), 'utf8'));
ok(p.ok && p.state.version === M.S.VERSION && p.state.migratedFrom === 6, 'v6 存檔可匯入並升到 v' + M.S.VERSION);
if (p.ok) {
  var st = p.state;
  ok(st.heroes.length === 4 && st.heroes.every(function (h) { return h.pb === null; }), '所有武將補上空的後天被動欄');
  ok(st.player.silver === 50780 && st.player.honor === 170 && st.bag.stack.jinengshu === 12, '銀幣、榮譽（120＋2 勝×25＝170）、技能書保留');
  ok(st.arena.recs.length === 2 && st.arena.recs.every(function (x) { return x.v === 6 && !x.pvp; }), '舊戰報標記 v6（非 PVP）');
  M.S.state = st;
  var ok2 = [0, 1].every(function (i) { var x = M.G.arenaReplay(i); return x.ok && x.consistent; });
  ok(ok2, '舊戰報以舊規則重播，勝負與回合數與當時相同');
  ok(M.G.pbLearn(st.heroes[0].uid, 'huajie').ok, '遷移後可習得被動（主角 Lv40）');
  var again = load().MJ.S.parse(M.S.exportText());
  ok(again.ok && again.state.heroes[0].pb === 'huajie', '遷移後再匯出／匯入保留習得被動');
}
['save-v5.json', 'save-v4.json'].forEach(function (f) {
  var cc = load(); cc.MJ.U.now = function () { return T0; };
  var pp = cc.MJ.S.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
  ok(pp.ok && pp.state.version === cc.MJ.S.VERSION && pp.state.heroes.every(function (h) { return h.pb === null; }), f + ' 一路升到 v' + cc.MJ.S.VERSION);
});

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
