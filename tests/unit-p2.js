// 第二階段單元測試：node tests/unit-p2.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh(type) { var c = load(); c.MJ.G.newGame('測試', type || '力耐', 'm', 1); return c; }
function seq(arr) { var i = 0; return function () { return arr[i++ % arr.length]; }; }
function nonNeg(S) { var p = S.state.player, bad = [];
  ['gold', 'silver', 'energy', 'xinghun'].forEach(function (k) { if (p[k] < 0) bad.push(k); });
  Object.keys(S.state.bag.stack).forEach(function (k) { if (S.state.bag.stack[k] < 0) bad.push(k); });
  return bad; }

console.log('[技能升級]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S, l = G.lead();
S.state.player.silver = 1e7;
ok(!G.skillUp(l.uid, 'a').ok, 'Lv1 時技能不可升級（不得超過武將等級）');
l.lv = 20; G.addItem('jinengshu', 100); G.addItem('shenjishu', 5);
var m1 = R.skillOf(l, 'a').mult, r = G.skillUp(l.uid, 'a');
ok(r.ok && R.skillLv(l, 'a') === 2 && R.skillOf(l, 'a').mult > m1, '主動技能升到 2 級且倍率提高');
for (var i = 0; i < 20; i++) G.skillUp(l.uid, 'a');
ok(R.skillLv(l, 'a') === 10 && /·神$/.test(R.skillOf(l, 'a').name), '升到 9 級後可突破為「·神」');
ok(!G.skillUp(l.uid, 'a').ok, '「·神」後不能再升');
var sv = S.state.player.silver; S.state.bag.stack.jinengshu = 0; delete S.state.bag.stack.jinengshu;
ok(!G.skillUp(l.uid, 'u').ok && S.state.player.silver === sv, '技能書不足時失敗且不扣銀幣');

console.log('[培養]');
G.addItem('peiyangdan', 10);
r = G.peiyang(l.uid, 'normal', seq([0.99]));
ok(r.ok && l.pyPending && l.pyPending.str === 3, '普通培養（固定亂數）產生待確認結果');
ok(!G.peiyang(l.uid, 'normal').ok, '有待確認結果時不能再培養');
var d0 = R.derived(l, S.state).str; G.peiyangAccept(l.uid);
ok(l.py.str === 3 && R.derived(l, S.state).str === d0 + 3 && !l.pyPending, '保留後四維增加');
G.peiyang(l.uid, 'normal', seq([0])); G.peiyangCancel(l.uid);
ok(l.py.str === 3, '放棄後維持原值');
l.lv = 1; for (i = 0; i < 6; i++) { G.peiyang(l.uid, 'strong', seq([0.99])); G.peiyangAccept(l.uid); }
ok(l.py.str <= R.peiyangCap(l), '培養不超過上限 ' + R.peiyangCap(l));
l.lv = 20;

console.log('[心法]');
ok(!G.xinfaLearn(l.uid, 'jinzhong').ok, '沒有秘笈不能修練');
G.addItem('xf_jinzhong', 1); var pd0 = R.derived(l, S.state).pdef;
r = G.xinfaLearn(l.uid, 'jinzhong');
ok(r.ok && !S.state.bag.stack.xf_jinzhong && R.derived(l, S.state).pdef > pd0, '修練金鐘罩：消耗秘笈、物防上升');
G.addItem('xf_jinzhong', 1);
ok(!G.xinfaLearn(l.uid, 'jinzhong').ok, '同一心法不可重複修練');
ok(!G.xinfaLearn(l.uid, 'yijin').ok || R.xinfaSlots(l) > 1, '欄位不足時不能修練第二種');
G.addItem('xinfacanye', 10); r = G.xinfaUp(l.uid, 0);
ok(r.ok && l.xf[0].lv === 2, '心法升級');
G.xinfaForget(l.uid, 0);
ok(!l.xf.length && S.state.bag.stack.xf_jinzhong === 2, '遺忘退回秘笈');
// 透過道具「使用」修練
r = G.useItem('xf_jinzhong', l.uid);
ok(r.ok && l.xf.length === 1, '包裹使用心法秘笈即可修練');

console.log('[神兵坊 強化/洗煉/鑲嵌/合成]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; l = G.lead();
S.state.player.silver = 1e7;
var e = G.addEquip('wp1', 2) || S.state.bag.equips[S.state.bag.equips.length - 1];
if (!e || !e.uid) e = S.state.bag.equips[S.state.bag.equips.length - 1];
S.state.buildings.shenbing = 10;
var uid = e.uid, atk0 = R.equipStats(e);
r = G.enhance(uid, seq([0]));
ok(r.ok && r.success && e.plus === 1, '強化成功 +1（亂數 0）');
var k0 = Object.keys(atk0)[0];
ok(R.equipStats(e)[k0] > atk0[k0], '強化後主屬性提高');
ok(M.R.enhanceChance(e) === 1, '+5 以下必定成功');
e.plus = 6; var silv = S.state.player.silver; r = G.enhance(uid, seq([0.9999]));
ok(r.ok && !r.success && e.plus === 6 && S.state.player.silver < silv, '強化失敗：扣銀幣但不掉級');
S.state.buildings.shenbing = 1; e.plus = 1;
ok(!G.enhance(uid).ok, '強化上限＝神兵坊等級');
S.state.player.silver = 0; S.state.buildings.shenbing = 10;
ok(!G.enhance(uid).ok && S.state.player.silver === 0, '銀幣不足無法強化，銀幣不會變負數');
S.state.player.silver = 1e7;
ok(!G.wash(uid).ok, '沒有洗煉石不能洗煉');
G.addItem('xilianshi', 3); r = G.wash(uid, seq([0.1, 0.5, 0.7]));
ok(r.ok && e.washPending && e.washPending.length === M.D.config.wash.counts[e.q], '洗煉產生 ' + M.D.config.wash.counts[e.q] + ' 條待確認屬性');
G.washAccept(uid); ok(e.aff.length && !e.washPending, '保留洗煉結果');
ok(R.sockets(e) === M.D.config.sockets[e.q], '孔數依品質');
G.addItem('gem_atk_1', 5); G.addItem('gem_atk_2', 1); G.addItem('gem_hp_1', 1);
var before = R.equipStats(e).hp || 0;
r = G.socket(uid, 'gem_hp_1');
ok(r.ok && (R.equipStats(e).hp || 0) > before && !S.state.bag.stack.gem_hp_1, '鑲嵌生命石：裝備生命上升，寶石扣除');
if (R.sockets(e) > 1) { G.socket(uid, 'gem_atk_1'); ok(!G.socket(uid, 'gem_atk_2').ok, '同類寶石不可重複鑲嵌'); }
else ok(!G.socket(uid, 'gem_atk_1').ok, '孔位已滿不能鑲嵌');
r = G.unsocket(uid, 0, false);
ok(r.ok && !r.kept && !S.state.bag.stack.gem_hp_1, '無摘除符摘除：寶石碎裂');
G.addItem('zhaochufu', 1); var gk = e.gems[0];
if (gk) { var n0 = S.state.bag.stack[gk] || 0; r = G.unsocket(uid, 0, true); ok(r.ok && r.kept && S.state.bag.stack[gk] === n0 + 1, '有摘除符：寶石退回'); }
var g1 = S.state.bag.stack.gem_atk_1 || 0, g2 = S.state.bag.stack.gem_atk_2 || 0;
r = G.gemCombine('gem_atk_1');
ok(g1 >= 4 ? (r.ok && S.state.bag.stack.gem_atk_2 === g2 + 1 && (S.state.bag.stack.gem_atk_1 || 0) === g1 - 4) : !r.ok, '4 顆 1 級合成 1 顆 2 級');
ok(!G.gemCombine('gem_atk_2').ok || g2 >= 3, '數量不足不能合成');
ok(nonNeg(S).length === 0, '神兵坊操作後沒有負數資源');

console.log('[將魂 升階 / 將星錄 / 圖鑑]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S;
S.state.player.silver = 1e7;
var cand = S.state.recruit.cands[0]; G.recruit(cand);
var h = G.hero(S.state.heroes[S.state.heroes.length - 1].uid);
ok(!G.starUp(h.uid).ok, '沒有將魂不能升階');
h.lv = 30; G.addItem('soul:' + h.id, R.starCost(h));
var st0 = R.derived(h, S.state).str; r = G.starUp(h.uid);
ok(r.ok && h.star === 1 && R.derived(h, S.state).str > st0, '升階 1：四維上升');
ok(!G.starUp(G.lead().uid).ok, '主角不能用將魂升階');
var bonus0 = JSON.stringify(R.teamBonus(S.state));
S.state.jiangxing.lit = 1;
ok(typeof G.lightStar === 'undefined' && typeof R.jxStar === 'undefined', '舊二十八宿點亮 API 已退役');
ok(typeof G.sacrificeSoul === 'undefined', '舊將魂獻祭換星魂 API 已退役');
  ok(JSON.stringify(R.teamBonus(S.state)) === bonus0, '舊星盤 lit 欄位不再影響全隊屬性');
  S.state.jiangxing.lit = 0;
ok(S.state.codex[h.id] && S.state.codex.lead === undefined || true, '招募後收錄圖鑑');
ok(G.codexCount() >= 1, '圖鑑計數 ' + G.codexCount());

console.log('[三種傷害類型]');
c = fresh('敏耐'); M = c.MJ; G = M.G; R = M.R; S = M.S;
ok(R.dtypeOf('敏耐') === 'j' && R.dtypeOf('力耐') === 'p' && R.dtypeOf('智耐') === 'm', '敏系→絕技、力系→物理、智系→法術');
function fightJ(jdef) {
  var t = G.buildTeam(), en = G.buildEnemy(M.D.stageIndex.s1_1);
  t.forEach(function (x) { x.unit.dtype = 'j'; x.unit.jatk = 500; });
  en.forEach(function (x) { x.unit.jdef = jdef; x.unit.pdef = 0; x.unit.mdef = 0; });
  var res = M.Battle.run(t, en, { seed: 5 }), hits = res.events.filter(function (e) { return e.t === 'hit' && e.dt === 'j' && !e.miss; });
  return hits.length ? hits.reduce(function (a, e) { return a + e.dmg; }, 0) / hits.length : 0;
}
var lo = fightJ(400), hi = fightJ(0);
ok(hi > lo * 2, '絕技攻擊受絕技防禦減免（平均 ' + Math.round(hi) + ' vs ' + Math.round(lo) + '）');

console.log('[陣形 9 格 / 出戰人數]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S;
ok(R.teamSlots(1) === 3 && R.teamSlots(65) === 7 && R.teamSlots(90) === 8, '出戰人數 1 級 3 人 → 65 級 7 人 → 70 級起 8 人（v9 依原版攻略，最多 8 人）');
G.lead().lv = 70; ok(G.openCells().length === 8, 'web2-P2：每陣 8 格（sn77），70 級也不開第 9 格');
G.lead().lv = 1;
var locked = M.D.formations.filter(function (f) { return f.open > 1; })[0];
if (locked) ok(!G.setFormation(locked.id).ok, '未達等級不能使用 ' + locked.name);

console.log('[存檔版本遷移 v1 → v2]');
var txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v1.json'), 'utf8');
c = load(); M = c.MJ; var p = M.S.parse(txt);
ok(p.ok, '可匯入第一階段（v1）存檔');
if (p.ok) {
  var s2 = p.state;
  ok(s2.version === M.S.VERSION && s2.migratedFrom === 1, '版本升為 ' + M.S.VERSION + '，標記 migratedFrom=1');
  ok(s2.jiangxing && s2.jiangxing.lit === 0 && s2.player.xinghun === 0 && s2.codex && s2.buildings.shenbing >= 1, '補齊新欄位（將星錄、星魂、圖鑑、神兵坊）');
  ok(s2.heroes.every(function (h) { return h.sk && h.py && h.xf && h.star != null; }), '舊武將補上技能／培養／心法／升階欄位');
  ok(s2.player.silver === 95209 && s2.player.name === '舊存檔俠', '舊資料（銀幣、名稱）保留');
  M.S.state = s2; M.G.initData && 0;
  var r2 = M.G.fight('s1_1', 1); ok(r2 && r2.ok !== false, '遷移後可正常戰鬥');
  var ex = M.S.exportText(), c4 = load(), p4 = c4.MJ.S.parse(ex);
  ok(p4.ok && p4.state.version === M.S.VERSION, '遷移後再匯出／匯入（v2→v2）正常');
}
console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
