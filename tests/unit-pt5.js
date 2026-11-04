// pt12u 第 5 階段（P5）：8 部位裝備、主角升階、等級上限 90、上古寶窟（K4 兩種分階都保留）、武器三類、v7→v8。node tests/unit-pt5.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return T0; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c, M, G, S, R, r;

console.log('[回歸：舊戰鬥事件完全相同]');
var gold = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'battle-golden-v6.json'), 'utf8'));
var now = require('./golden-run.js')(load, { legacy: true }); // 改版前資料＋舊規則版本
ok(gold.runs.length === now.runs.length && gold.runs.every(function (g, i) { return g.h === now.runs[i].h && g.n === now.runs[i].n; }), gold.runs.length + ' 場固定種子戰鬥雜湊與 P3 引擎一致');

console.log('[8 部位]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var want = { weapon: '武器', armor: '盔甲', cape: '披風', belt: '腰帶', helm: '帽子', jade: '玉墜', ring: '戒指', glove: '護手' };
ok(R.SLOTS.length === 8 && R.SLOTS.every(function (s) { return G.SLOT_NAMES[s] === want[s]; }), '8 部位名稱：' + R.SLOTS.map(function (s) { return G.SLOT_NAMES[s]; }).join('、'));
var L = M.D.equipment.list, jd = L.filter(function (e) { return e.slot === 'jade'; }), gl = L.filter(function (e) { return e.slot === 'glove'; });
ok(jd.length === 10 && gl.length === 10, '玉墜、護手各 10 個等級模板（1～54 級）');
ok(jd.every(function (e) { return e.stats.res > 0 && e.sec === 'dbf' && /D/.test(e.grade); }) && gl.every(function (e) { return e.stats.pve > 0 && e.sec === 'pvp' && /D/.test(e.grade); }), '玉墜給狀態抵抗（副屬性施加機率），護手給 PVE（副屬性 PVP），數值標 D');
G.lead().lv = 30;
var d0 = R.derived(G.lead(), S.state);
var ej = G.addEquip('jd30', 2), eg = G.addEquip('gl30', 3);
ok(G.equip(G.lead().uid, ej.uid).ok && G.equip(G.lead().uid, eg.uid).ok, '主角可穿上玉墜與護手');
var d1 = R.derived(G.lead(), S.state);
ok(d1.res > d0.res && d1.dbf > d0.dbf && d1.pve > d0.pve && d1.pvp > d0.pvp, '穿上後 抵抗 ' + d0.res + '→' + d1.res + '、施加 ' + d0.dbf + '→' + d1.dbf + '、PVE ' + d0.pve + '→' + d1.pve + '、PVP ' + d0.pvp + '→' + d1.pvp);
ok(G.unequip(G.lead().uid, 'glove').ok && !G.lead().eq.glove, '可以卸下護手');
G.addEquip('gl1', 0); G.addEquip('gl24', 1);
var ae = G.autoEquip(G.lead().uid); ok(ae.ok && G.lead().eq.glove && R.equipTpl(G.lead().eq.glove.t).id === 'gl30', '「最強」會自動選擇護手（gl30 紫）');
S.state.bag.stack['frag_purple'] = 0;
ok(G.SLOT_PREFIX.jade === 'jd' && G.SLOT_PREFIX.glove === 'gl', '紫裝碎片合成支援新部位前綴');

console.log('[武器三類：物攻／法攻／絕技（決定 4）]');
var wk = { p: 0, m: 0, j: 0 }; L.forEach(function (e) { if (e.slot === 'weapon') wk[e.id.charAt(1)]++; });
ok(wk.p > 0 && wk.m > 0 && wk.j > 0, '武器模板 物攻 ' + wk.p + '、法攻 ' + wk.m + '、絕技 ' + wk.j);

console.log('[主角升階]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var s = S.state;
ok(s.player.leadQ === 2 && R.leadQ(s) === 2 && R.leadMult(s) === 1, '新遊戲主角為綠（屬性倍率 1）');
ok(R.maxLevel === 90, '等級上限 90');
var pr0 = R.primary(G.lead(), s).str;
r = G.leadPromote(); ok(!r.ok && /20 級/.test(r.msg), '未滿 20 級不能升藍：' + r.msg);
G.lead().lv = 20; s.player.silver = 19999;
r = G.leadPromote(); ok(!r.ok && /銀幣不足/.test(r.msg) && s.player.silver === 19999, '銀幣不足時失敗、不扣錢');
s.player.silver = 20000; var pA = R.primary(G.lead(), s).str;
r = G.leadPromote(); ok(r.ok && s.player.leadQ === 3 && s.player.silver === 0, '20 級花 20000 銀升為藍');
var pB = R.primary(G.lead(), s).str; ok(pB > pA, '升藍後力量 ' + pA + '→' + pB + '（×1.03）');
ok(R.heroUnit(G.lead(), s).quality === 3, '戰鬥單位品質改為藍');
s.player.silver = 1e7; r = G.leadPromote(); ok(!r.ok && /60 級/.test(r.msg), '未滿 60 級不能升紫');
G.lead().lv = 60; ok(G.leadPromote().ok && s.player.leadQ === 4, '60 級升紫');
r = G.leadPromote(); ok(!r.ok && /90 級/.test(r.msg), '未滿 90 級不能升橙');
G.lead().lv = 89; G.lead().exp = 0; G.addExp(G.lead(), 1e9); ok(G.lead().lv === 90, '經驗足夠可升到 90 級（上限）');
ok(G.leadPromote().ok && s.player.leadQ === 5 && M.D.config.qualityNames[5] === '橙', '90 級升橙');
r = G.leadPromote(); ok(!r.ok && /最高/.test(r.msg), '橙後不能再升');
var hu = R.heroUnit(G.lead(), s); ok(hu.quality === 5, '橙品主角戰鬥單位品質 5');

console.log('[上古寶窟]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R; s = S.state;
var tiers = G.SG_TIERS.map(function (t) { return t.lv; }).join('/');
ok(tiers === '25/35/45/60/70/80', 'K4 兩種分階都保留：' + tiers);
ok(G.SG_TIERS.filter(function (t) { return t.v2013; }).map(function (t) { return t.lv; }).join('/') === '70/80', '70／80 階標示為 2013 版來源');
r = G.sgRun('s25', 5); ok(!r.ok && /25 級/.test(r.msg), '主角 25 級前不能進入');
G.lead().lv = 60; s.heroes.forEach(function (h) { h.lv = 60; h.star = 3; });
var add = ['luzhangke', 'yuelingshan', 'ganning'];
add.forEach(function (id) { var h = G.newHero(id, s); h.lv = 60; h.star = 3; s.heroes.push(h); G.addToTeam && G.addToTeam(h.uid); });
var runs = [], hid = null, plain = null, gold0;
for (var sd = 1; sd < 60 && (!hid || !plain); sd++) {
  c = fresh(); M = c.MJ; G = M.G; S = M.S; s = S.state;
  G.lead().lv = 60; add.forEach(function (id) { var h = G.newHero(id, s); h.lv = 60; h.star = 3; s.heroes.push(h); G.addToTeam(h.uid); });
  s.heroes.forEach(function (h) { h.lv = 60; });
  var g0 = s.player.gold, x = G.sgRun('s25', sd);
  if (!x.ok) { console.log('   ', x.msg); break; }
  if (x.full && x.hidden && x.hiddenWin && !hid) hid = { r: x, sd: sd, g0: g0, st: s };
  if (x.full && !x.hidden && !plain) plain = { r: x, sd: sd, g0: g0, st: s, G: G };
}
ok(plain && plain.r.cleared === 3 && plain.r.waves.length === 3, '一般全破：3 關（種子 ' + (plain && plain.sd) + '）');
ok(plain && plain.st.bag.stack.sg_bag_2 === 1 && plain.st.player.gold === plain.g0 + 30 && plain.st.shanggu.first.s25, '全破得綠將魂袋 ×1，首次全破金幣 +30');
ok(hid && hid.r.waves.length === 4 && hid.st.bag.stack.sg_bag_3 === 1 && hid.st.bag.stack.sg_bag_4 === 1 && hid.st.shanggu.firstH.s25, '隱藏關（種子 ' + (hid && hid.sd) + '）：藍將魂袋 ×1，首次隱藏關另給紫將魂袋 ×1');
if (plain) {
  G = plain.G; S.state = plain.st; s = plain.st;
  var gA = s.player.gold, again = G.sgRun('s25', plain.sd);
  ok(again.ok && again.full && s.player.gold === gA && s.bag.stack.sg_bag_2 === 2, '再次挑戰（無限次）：一般獎勵可重複，首次金幣不再給');
  var tries = 0; for (var k = 0; k < 5; k++) if (G.sgRun('s25', 100 + k).ok) tries++;
  ok(tries === 5, '連續挑戰 5 次都可以進入（沒有次數限制）');
  var n0 = s.bag.stack.sg_bag_2, souls0 = Object.keys(s.bag.stack).filter(function (q) { return q.indexOf('soul:') === 0; }).reduce(function (a, q) { return a + s.bag.stack[q]; }, 0);
  var u = G.useItem('sg_bag_2', null, function () { return 0.5; });
  var souls1 = Object.keys(s.bag.stack).filter(function (q) { return q.indexOf('soul:') === 0; }).reduce(function (a, q) { return a + s.bag.stack[q]; }, 0);
  ok(u.ok && M.R.heroDef(u.soul).quality === 2 && souls1 === souls0 + 1 && (s.bag.stack.sg_bag_2 || 0) === n0 - 1, '打開綠將魂袋得到綠色武將將魂 ×1（' + (u.soul && M.R.heroDef(u.soul).name) + '）');
}
c = fresh(); M = c.MJ; G = M.G; S = M.S; s = S.state; G.lead().lv = 25;
var lose = G.sgRun('s25', 3); var g1 = s.player.gold;
ok(lose.ok && (lose.full || lose.cleared < 3), '單人 25 級也可挑戰（戰敗沒有懲罰）：通過 ' + lose.cleared + ' 關');
var sgA = G.sgRun('s25', 777), sgB;
c = fresh(); M = c.MJ; G = M.G; S = M.S; s = S.state; G.lead().lv = 25; G.sgRun('s25', 3); sgB = G.sgRun('s25', 777);
ok(sgA.cleared === sgB.cleared && sgA.waves.length === sgB.waves.length, '同種子結果相同（可重現）');

console.log('[存檔 v7 → v8 遷移]');
c = load(); c.MJ.U.now = function () { return T0; }; M = c.MJ;
var p = M.S.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v7.json'), 'utf8'));
ok(p.ok && p.state.version === M.S.VERSION && p.state.migratedFrom === 7, 'v7 存檔（P4 程式產生）可匯入並升到 v8');
if (p.ok) {
  var st = p.state; M.S.state = st;
  ok(st.player.leadQ === 4, '主角 Lv64 依等級補為紫（屬性只增不減）');
  ok(st.heroes[0].pb === 'huajie' && st.player.silver === 395360 && st.heroes.length === 4, '習得被動、銀幣、武將保留');
  ok(st.shanggu && st.shanggu.clears === 0, '補上上古寶窟紀錄');
  var x7 = M.G.arenaReplay(0); ok(x7.ok && x7.consistent, 'v7 戰報重播結果與當時相同');
  ok((st.migrateNotes || []).some(function (n) { return /8 部位/.test(n); }), '遷移說明寫入 migrateNotes');
  ok(M.G.leadPromoteNext() && M.G.leadPromoteNext().q === 5, '下一階為橙（需 90 級）');
}
['save-v6.json', 'save-v5.json', 'save-v4.json', 'save-v2.json', 'save-v1.json'].forEach(function (f) {
  var cc = load(); cc.MJ.U.now = function () { return T0; };
  var pp = cc.MJ.S.parse(fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8'));
  var L0 = pp.ok && pp.state.heroes.filter(function (h) { return h.id === 'lead'; })[0];
  ok(pp.ok && pp.state.version === cc.MJ.S.VERSION && pp.state.player.leadQ === (L0.lv >= 60 ? 4 : L0.lv >= 20 ? 3 : 2) && pp.state.shanggu, f + ' 一路升到 v8（主角 Lv' + (L0 && L0.lv) + ' → ' + (pp.ok && cc.MJ.D.config.qualityNames[pp.state.player.leadQ]) + '）');
});

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
