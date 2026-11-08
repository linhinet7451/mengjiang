// 網路資料搜查-2 P2：陣法 8 格、被動兩格、連攜、新被動、新武將、格圖換算、存檔 v9→v12。node tests/unit-web2-p2.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c.MJ.U.now = function () { return T0; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
var c = fresh(), M = c.MJ, G = M.G, S = M.S, R = M.R, D = M.D, B = M.Battle;
var PROV = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
function pe(id) { return PROV.entries.filter(function (e) { return e.id === id; })[0]; }
function mk(n, o) { var u = { name: n, hp: 1e6, patk: 1000, matk: 100, pdef: 0, mdef: 0, lv: 10, phys: true, dtype: 'p', active: { name: n + '技', pattern: 'single', mult: 1 }, ult: { name: n + '無雙', pattern: 'single', mult: 1 }, rv: 9 }; for (var k in (o || {})) u[k] = o[k]; return u; }
function dmg(r, from) { var t = 0; r.events.forEach(function (e) { if (e.t === 'hit' && !e.miss && e.from === from && !e.dot && !e.reflect) t += e.dmg; }); return t; }
function dmgTo(r, to) { var t = 0; r.events.forEach(function (e) { if (e.t === 'hit' && !e.miss && e.to === to) t += e.dmg; }); return t; }
function txt(r, s) { return r.events.filter(function (e) { return e.t === 'text' && e.s === s; }).length; }

console.log('[陣法 8 格（sn77 A）]');
ok(D.formations.every(function (f) { return f.cells.length === 8; }), '全部 ' + D.formations.length + ' 個陣法都是 8 格');
ok(D.formIndex.bagua.cells.indexOf(4) < 0, '八卦陣中宮（格 4）虛位');
var zx = D.formIndex.zhuixing; ok(zx && zx.bonus.npcCut === 16 && zx.bonus.def === 4, '新增錐行陣：防禦 +4%、受 NPC 傷害 −16%');
G.lead().lv = 70; ok(G.openCells().length === 8, '70 級開放格數＝8（不再開第 9 格）');
S.state.team.formation = '_none'; var tb0 = R.teamBonus(S.state); S.state.team.formation = 'fangyuan'; G.setFormation('bagua'); var tb = R.teamBonus(S.state);
ok(tb.patk - (tb0.patk || 0) === 5 && tb.matk - (tb0.matk || 0) === 5 && !tb.npcCut, '八卦陣：物攻／法攻各 +5%（teamBonus 展開，npcCut 不進屬性）');
ok(G.setFormation('zhuixing').ok !== false && S.state.team.formation === 'zhuixing', '可換成錐行陣（20 級開放）');
var tb2 = R.teamBonus(S.state); ok(tb2.pdef - (tb0.pdef || 0) === 4 && tb2.mdef - (tb0.mdef || 0) === 4, '錐行陣 def +4 展開成物防／法防');
var bt = G.buildTeam(); ok(bt.every(function (x) { return x.unit.npcCut === 16; }), '錐行陣出戰單位帶 npcCut 16');
var e1 = mk('敵'), r1 = B.run([{ cell: 0, unit: mk('我') }], [{ cell: 0, unit: e1 }], { seed: 3, maxRounds: 3 });
var r2 = B.run([{ cell: 0, unit: mk('我', { npcCut: 16 }) }], [{ cell: 0, unit: mk('敵') }], { seed: 3, maxRounds: 3 });
ok(dmgTo(r2, 'A0') < dmgTo(r1, 'A0'), '錐行陣：受 NPC（B 方）傷害較少（' + dmgTo(r2, 'A0') + ' < ' + dmgTo(r1, 'A0') + '）');
var r3 = B.run([{ cell: 0, unit: mk('我', { npcCut: 16 }) }], [{ cell: 0, unit: mk('敵') }], { seed: 3, maxRounds: 3, pvp: true });
ok(dmgTo(r3, 'A0') === dmgTo(r1, 'A0'), 'PVP 時錐行陣減傷不生效');

console.log('[被動兩格、連攜（snA967 B；連攜效果 D）]');
var two = D.heroes.list.filter(function (h) { return h.passive2; });
ok(two.length >= 20, two.length + ' 名武將有第二被動');
ok(D.heroes.list.filter(function (h) { return h.partner; }).every(function (h) { return !!R.heroDef(h.partner); }), '所有連攜對象都存在（' + D.heroes.list.filter(function (h) { return h.partner; }).length + ' 人）');
ok(pe('web2.partner.effect').grade === 'D' && !/原版/.test(pe('web2.partner.effect').label), '連攜效果標 D，不寫原版');
var pa = mk('甲', { did: 'x1', partner: 'x2' }), pb = mk('乙', { did: 'x2' });
var rl = B.run([{ cell: 0, unit: pa }, { cell: 3, unit: pb }], [{ cell: 0, unit: mk('敵') }], { seed: 5, maxRounds: 2 });
var rn = B.run([{ cell: 0, unit: mk('甲', { did: 'x1', partner: 'x9' }) }, { cell: 3, unit: mk('乙', { did: 'x2' }) }], [{ cell: 0, unit: mk('敵') }], { seed: 5, maxRounds: 2 });
ok(txt(rl, '連攜') >= 1 && txt(rn, '連攜') === 0, '夥伴同時上陣才出現「連攜」');
ok(dmg(rl, 'A0') > dmg(rn, 'A0'), '連攜：攻擊較高（' + dmg(rl, 'A0') + ' > ' + dmg(rn, 'A0') + '）');
var h2 = D.heroes.list.filter(function (h) { return h.passive2 && h.quality >= 3; })[0];
var gh = G.newHero(h2.id, S.state); var hu = R.heroUnit(gh, S.state);
ok(hu.passive2 === h2.passive2 && hu.did === h2.id && hu.rv >= 9, '遊戲單位帶第二被動與武將 id（' + h2.name + '：' + D.heroes.passives[h2.passive2].name + '）');

console.log('[新被動（snA967 B；數值依原文）]');
var base = B.run([{ cell: 0, unit: mk('我', { phys: false, dtype: 'm' }) }], [{ cell: 0, unit: mk('敵') }], { seed: 9, maxRounds: 3 });
var sq = B.run([{ cell: 0, unit: mk('我', { passive: 'shaqi', phys: false, dtype: 'm' }) }], [{ cell: 0, unit: mk('敵') }], { seed: 9, maxRounds: 3 });
ok(dmg(sq, 'A0') > dmg(base, 'A0'), '殺氣訣：傷害提高（' + dmg(sq, 'A0') + ' > ' + dmg(base, 'A0') + '）');
var qj = B.run([{ cell: 0, unit: mk('我', { passive: 'qiangjia', pdef: 500 }) }], [{ cell: 0, unit: mk('敵', { pdef: 500 }) }], { seed: 9, maxRounds: 3 });
var qj0 = B.run([{ cell: 0, unit: mk('我', { pdef: 500 }) }], [{ cell: 0, unit: mk('敵', { pdef: 500 }) }], { seed: 9, maxRounds: 3 });
ok(dmgTo(qj, 'A0') < dmgTo(qj0, 'A0'), '強甲：受到傷害較少（' + dmgTo(qj, 'A0') + ' < ' + dmgTo(qj0, 'A0') + '）');
var hs = B.run([{ cell: 0, unit: mk('我') }], [{ cell: 0, unit: mk('敵', { passive: 'huanshi' }) }], { seed: 9, maxRounds: 3 });
ok(hs.events.some(function (e) { return e.t === 'hit' && e.reflect && e.dmg <= 300; }), '幻視：反彈傷害（上限 300）');
var any = false, s; for (s = 1; s < 40 && !any; s++) { var rd = B.run([{ cell: 0, unit: mk('我', { passive: 'duohun' }) }], [{ cell: 0, unit: mk('敵') }], { seed: s, maxRounds: 4 }); any = rd.events.some(function (e) { return e.t === 'status' && e.s === '封印無雙'; }); }
ok(any, '奪魂：會封住對手無雙（seed ' + (s - 1) + '）');
var fxDot = false; for (s = 1; s < 30 && !fxDot; s++) { var rb = B.run([{ cell: 0, unit: mk('我', { active: { name: '火', pattern: 'single', mult: 1, fx: { burn: 0.9 } } }) }], [{ cell: 0, unit: mk('敵') }], { seed: s, maxRounds: 4 }); fxDot = rb.events.some(function (e) { return e.t === 'hit' && e.dot; }); }
ok(fxDot, '燒傷：之後每回合持續扣血（dot 事件）');
var nsome = D.heroes.list.filter(function (h) { return h.web2 === 'P2'; });
ok(nsome.length === 21, '新增 21 名武將（15 名 snA967＋6 名白將）');
ok(['shaqi', 'qiangren', 'qiangjia', 'piaohu', 'duohun', 'qingxin', 'xuruo', 'fenxin', 'bixie', 'huanshi', 'ningxin'].every(function (k) { var p = D.heroes.passives[k]; return p && p.name && p.desc && p.grade; }), '11 種新被動都有名稱、說明、分級');

console.log('[新武將招募]');
var nh = R.heroDef('yuanshao'); ok(nh && nh.name === '袁紹' && nh.active.pattern === 'shape' && nh.active.shape && nh.active.shape.length, '袁紹：原版格圖範圍');
S.state.recruit.cands = ['yuanshao', 'caobao']; S.state.player.silver = 1e9; S.state.heroes.length = 1;
var rr = G.recruit('yuanshao'), rw = G.recruit('caobao');
ok(rr.ok !== false && rw.ok !== false && G.teamList && S.state.heroes.some(function (h) { return h.id === 'yuanshao'; }) && S.state.heroes.some(function (h) { return h.id === 'caobao'; }), '可招募新武將袁紹與白將曹豹');
ok(R.heroDef('caobao').quality === 1, '曹豹為白將');
ok(R.heroDef('wuyazi').name === '無崖子' && R.heroDef('ziyun').ult.name === '往昔若凝', '無崖子（967 作無涯子）、紫雲無雙往昔若凝');

console.log('[格圖換算（C）]');
var gly = require('../tools/glyph967.js');
var g1 = gly(['●●', '■■', '●●']); ok(g1.ri === 1 && JSON.stringify(g1.shape) === '[[0,0]]', '單格：自己那列往前第 1 格 → [0,0]');
var g2 = gly(['●■', '■■■', '●■']); ok(JSON.stringify(g2.shape) === '[[-1,0],[0,0],[0,1],[1,0]]', '十字形換算正確');
ok(pe('web2.range.glyph') && pe('web2.range.glyph').grade === 'C', '換算規則標 C');

console.log('[存檔 v9 → v10]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var st = S.state; G.lead().lv = 70;
['zhangfei', 'guanyu', 'zhaoyun', 'machao'].forEach(function (id) { if (R.heroDef(id)) st.heroes.push(G.newHero(id, st)); });
st.team.formation = 'bagua'; st.team.cells = {}; st.team.cells[4] = st.heroes[0].uid; for (var i = 1; i < st.heroes.length; i++) st.team.cells[[0, 1, 2, 3, 5][i - 1]] = st.heroes[i].uid;
st.version = 9; var nHero = st.heroes.length, uids = st.heroes.map(function (h) { return h.uid; }).join();
var p = S.parse(JSON.stringify({ app: S.APP, version: 9, savedAt: T0, data: JSON.parse(JSON.stringify(st)) }));
  ok(p.ok && p.state.version === S.VERSION && S.VERSION === 12, 'v9 存檔升級到 v' + (p.state && p.state.version));
if (p.ok) {
  var s2 = p.state;
  ok(s2.heroes.length === nHero && s2.heroes.map(function (h) { return h.uid; }).join() === uids, '武將 ' + nHero + ' 人全部保留');
  ok(!s2.team.cells[4] && M.U.keys(s2.team.cells).length === nHero, '八卦陣中宮的武將移到其他格，沒有人被移出（' + M.U.keys(s2.team.cells).length + ' 人）');
  ok((s2.migrateNotes || []).some(function (n) { return /被動/.test(n); }), '升級說明有記錄');
}
console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exitCode = fail ? 1 : 0;
