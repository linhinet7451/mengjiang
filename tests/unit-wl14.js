// WL-14：新增頂尖武將 小叮噹／皮卡丘（Tomas 私心新增，D 級原創）＋特殊招募 0.5% 獨立抽取。node tests/unit-wl14.js
// 引擎層測試：武將數據、立繪三件套、特殊抽取 Monte Carlo、四池品質分布、招募流程、頂尖隊伍、考證表。
// UI 層（招募機率表特殊說明）見 tests/e2e.js。
var load = require('./harness.js');
var fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
function fresh(type) { var c = load(); c.MJ.G.newGame('測試', type || '力耐', 'm', 1); return c; }

console.log('[武將數據]');
var c = fresh(), M = c.MJ, G = M.G, R = M.R, S = M.S, D = M.D, U = M.U;
ok(D.heroes.list.length === 90, '武將共 90 名（88＋2）');
ok(D.heroes.list.filter(function (h) { return h.quality === 4; }).length === 42, '品質 4 共 42 名（40＋2）');
var dora = R.heroDef('doraemon'), pika = R.heroDef('pikachu');
ok(dora && dora.name === '小叮噹' && dora.quality === 4 && dora.type === '智耐', '小叮噹：品質 4、智耐');
ok(dora.faction === '原創' && dora.souls === 45 && dora.grade === 'D' && dora.passiveGrade === 'D', '小叮噹：原創、將魂 45、D 級');
ok(dora.base.str === 8 && dora.base.int === 15 && dora.base.agi === 9 && dora.base.con === 15, '小叮噹基礎四維 8／15／9／15（對標同型最強孫尚香，合計 47）');
ok(dora.growth.str === 1.2 && dora.growth.int === 3 && dora.growth.agi === 1 && dora.growth.con === 2.6, '小叮噹成長對標標準智耐');
ok(dora.active.name === '空氣砲' && dora.active.pattern === 'line2' && dora.active.mult === 1.5 && dora.active.flat === 0, '小叮噹主動：空氣砲 line2 1.5');
ok(dora.ult.name === '任意門' && dora.ult.pattern === 'all' && dora.ult.mult === 2 && dora.ult.flat === 200, '小叮噹無雙：任意門 all 2.0／200');
ok(dora.passive === 'shaqi', '小叮噹被動：殺氣訣');
ok(dora.look && dora.look.cloth === '#1e88e5' && dora.look.trim === '#ffca28' && dora.look.wp === 'none', '小叮噹 look：藍身黃鈴鐺、無武器');
ok(pika && pika.name === '皮卡丘' && pika.quality === 4 && pika.type === '智敏', '皮卡丘：品質 4、智敏');
ok(pika.faction === '原創' && pika.souls === 45 && pika.grade === 'D' && pika.passiveGrade === 'D', '皮卡丘：原創、將魂 45、D 級');
ok(pika.base.str === 10 && pika.base.int === 13 && pika.base.agi === 12 && pika.base.con === 11, '皮卡丘基礎四維 10／13／12／11（對標同型最強貂蟬，合計 46）');
ok(pika.growth.str === 1 && pika.growth.int === 3 && pika.growth.agi === 2.4 && pika.growth.con === 1.8, '皮卡丘成長對標標準智敏');
ok(pika.active.name === '電光一閃' && pika.active.pattern === 'line2' && pika.active.mult === 1.5 && pika.active.flat === 0, '皮卡丘主動：電光一閃 line2 1.5');
ok(pika.ult.name === '十萬伏特' && pika.ult.pattern === 'all' && pika.ult.mult === 2 && pika.ult.flat === 200, '皮卡丘無雙：十萬伏特 all 2.0／200');
ok(pika.passive === 'lianzhan', '皮卡丘被動：連斬');
ok(pika.look && pika.look.skin === '#ffeb3b' && pika.look.trim === '#e53935' && pika.look.wp === 'none', '皮卡丘 look：黃身紅腮紅、無武器');
ok(!D.heroes.list.some(function (h) { return h.id !== 'doraemon' && h.id !== 'pikachu' && (h.active.name === '空氣砲' || h.active.name === '電光一閃' || h.ult.name === '任意門' || h.ult.name === '十萬伏特'); }), '兩人技能名無重名');

console.log('[立繪三件套（磁碟＋meta）]');
var outDir = path.join(__dirname, '..', 'src', 'assets', 'out');
var meta = JSON.parse(fs.readFileSync(path.join(outDir, 'meta.json'), 'utf8'));
['doraemon', 'pikachu'].forEach(function (id) {
  ['h_' + id + '.webp', 'h_' + id + '_av.webp', 'h_' + id + '_ci.webp'].forEach(function (f) {
    var st = fs.statSync(path.join(outDir, f));
    ok(st.isFile() && st.size > 1000, '立繪檔存在且有實質內容 ' + f + '（' + st.size + ' bytes）');
  });
  ok(meta['h_' + id] && meta['h_' + id].w > 0 && meta['h_' + id].h === 360, 'meta 有條目 h_' + id + '（' + meta['h_' + id].w + '×' + meta['h_' + id].h + '）');
});

console.log('[特殊抽取 Monte Carlo（20 萬格）]');
var N = 200000, cd = 0, cp = 0, rng = U.rng(12345);
for (var i = 0; i < N; i++) {
  var sp = G.specialDraw(rng, {}, {});
  if (sp === 'doraemon') cd++;
  else if (sp === 'pikachu') cp++;
}
console.log('  MC 20 萬格：小叮噹 ' + cd + '（' + (cd / N * 100).toFixed(3) + '%）、皮卡丘 ' + cp + '（' + (cp / N * 100).toFixed(3) + '%）');
ok(cd / N > 0.004 && cd / N < 0.006, '小叮噹 MC 落在 0.4%～0.6%（' + (cd / N * 100).toFixed(3) + '%）');
ok(cp / N > 0.004 && cp / N < 0.006, '皮卡丘 MC 落在 0.4%～0.6%（' + (cp / N * 100).toFixed(3) + '%）');
ok(G.specialDraw(function () { return 0.002; }, {}, {}) === 'doraemon', '特殊抽取：亂數 0.002 命中 [0, 0.005) → 小叮噹');
ok(G.specialDraw(function () { return 0.007; }, {}, {}) === 'pikachu', '特殊抽取：亂數 0.007 命中 [0.005, 0.010) → 皮卡丘');
ok(G.specialDraw(function () { return 0.5; }, {}, {}) === null, '特殊抽取：亂數 0.5 未命中');
ok(G.specialDraw(function () { return 0.002; }, { doraemon: 1 }, {}) === null, '特殊抽取：已擁有小叮噹時該區間落空（不重抽）');
ok(G.specialDraw(function () { return 0.007; }, {}, { pikachu: 1 }) === null, '特殊抽取：本輪已抽中皮卡丘時該區間落空');
ok(D.config.recruit.special && D.config.recruit.special.doraemon === 0.005 && D.config.recruit.special.pikachu === 0.005, 'config.recruit.special：兩人各 0.005');

console.log('[四池品質分布（每池 4000 次刷新＝16000 格）]');
['normal', 'baijin', 'zijin', 'zhizun'].forEach(function (kind, ki) {
  var rng2 = U.rng(987654 + ki * 7919);
  var counts = [0, 0, 0, 0, 0], spc = { doraemon: 0, pikachu: 0 }, total = 0;
  for (var r = 0; r < 4000; r++) {
    var cands = G.rerollCands(kind, rng2);
    cands.forEach(function (id) {
      total++;
      if (id === 'doraemon') { spc.doraemon++; return; }
      if (id === 'pikachu') { spc.pikachu++; return; }
      counts[R.heroDef(id).quality]++;
    });
  }
  var odds = D.config.recruit[kind].odds, bad = [];
  for (var q = 0; q < 5; q++) {
    var share = counts[q] / total, expect = odds[q] * 0.99;
    if (Math.abs(share - expect) > 0.015) bad.push('q' + q + ' 實測 ' + (share * 100).toFixed(2) + '% vs 預期 ' + (expect * 100).toFixed(2) + '%');
  }
  console.log('  ' + kind + '：' + total + ' 格，特殊 ' + (spc.doraemon + spc.pikachu) + '（叮噹 ' + spc.doraemon + '／皮卡丘 ' + spc.pikachu + '），品質份額 ' + counts.map(function (x, qi) { return 'q' + qi + ' ' + (x / total * 100).toFixed(1) + '%'; }).join('、'));
  ok(bad.length === 0, kind + ' 池非特殊品質分布與設定 odds×0.99 在 ±1.5% 內' + (bad.length ? '（' + bad.join('；') + '）' : ''));
  ok(spc.doraemon / total > 0.003 && spc.doraemon / total < 0.007, kind + ' 池小叮噹落在 0.3%～0.7%（' + (spc.doraemon / total * 100).toFixed(3) + '%）');
  ok(spc.pikachu / total > 0.003 && spc.pikachu / total < 0.007, kind + ' 池皮卡丘落在 0.3%～0.7%（' + (spc.pikachu / total * 100).toFixed(3) + '%）');
});

console.log('[招募流程＋戰鬥單位]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S; D = M.D;
S.state.player.silver = 1e7;
ok(G.recruitCost('doraemon') === 20000 && G.recruitCost('pikachu') === 20000, '兩人招募費皆為品質 4 的 20000 銀');
S.state.recruit.cands = ['doraemon', 'pikachu'];
var silv = S.state.player.silver;
var rr = G.recruit('doraemon');
ok(rr.ok && S.state.heroes.some(function (h) { return h.id === 'doraemon'; }) && S.state.player.silver === silv - 20000, '招募小叮噹：扣銀 20000、入隊');
ok(S.state.codex.doraemon === 1, '招募後圖鑑收錄小叮噹');
rr = G.recruit('pikachu');
ok(rr.ok && S.state.heroes.some(function (h) { return h.id === 'pikachu'; }), '招募皮卡丘：入隊');
var hd = G.newHero('doraemon', S.state), hp2 = G.newHero('pikachu', S.state);
var ud = R.heroUnit(hd, S.state), up = R.heroUnit(hp2, S.state);
ok(ud.hp > 0 && ud.dtype === 'm' && ud.active.name === '空氣砲' && ud.ult.name === '任意門', '小叮噹戰鬥單位：法攻型、主動／無雙正確、血量 >0');
ok(up.hp > 0 && up.dtype === 'm' && up.active.name === '電光一閃' && up.ult.name === '十萬伏特', '皮卡丘戰鬥單位：法攻型、主動／無雙正確、血量 >0');
ok(ud.matk > ud.patk && up.matk > up.patk, '兩人皆為法攻主導（matk > patk）');

console.log('[頂尖隊伍（q4 池 42 名）]');
var top1 = G.arenaTopFoe(1, 60);
ok(top1 && top1.top && top1.heroes.length === 7, 'seed 1 Lv60 頂尖隊伍 7 人（Lv60 上陣 7 人）');
ok(top1.heroes.every(function (h) { return R.heroDef(h.id).quality === 4; }), '頂尖隊伍全為品質 4');
console.log('  seed 1 Lv60 頂尖隊伍：' + top1.name + '（' + top1.heroes.map(function (h) { return R.heroDef(h.id).name; }).join('、') + '），戰力 ' + top1.power);
var top90 = G.arenaTopFoe(1, 90);
ok(top90 && top90.heroes.length === 8, 'seed 1 Lv90 頂尖隊伍 8 人（Lv70+ 上陣 8 人）');
console.log('  seed 1 Lv90 頂尖隊伍：' + top90.name + '，戰力 ' + top90.power);
var top25 = G.arenaTopFoe(1, 25);
console.log('  seed 1 Lv25 頂尖隊伍：' + top25.name + '，戰力 ' + top25.power);

console.log('[考證表 WL-14]');
var prov = M.D.provenance;
ok(prov.entries.length === 324, '考證表共 324 條（319＋5）');
ok(prov.entries.filter(function (x) { return x.grade === 'D'; }).length === 158, 'D 級共 158 條（153＋5）');
['hero.doraemon', 'hero.pikachu', 'recruit.special', 'web2.range.hero.doraemon', 'web2.range.hero.pikachu'].forEach(function (id) {
  var e = prov.entries.filter(function (x) { return x.id === id; })[0];
  ok(!!e && e.grade === 'D' && e.tentative === true && e.phase === 'WL-14', '考證含 WL-14 條目 ' + id + '（D 級、暫定）');
  ok(e && e.label.indexOf('原版') < 0, '考證條目 ' + id + ' 標籤不寫「原版」（unit-prov 規則）');
});
ok(prov.entries.filter(function (x) { return x.id === 'hero.doraemon'; })[0].current.indexOf('非原版') >= 0, '小叮噹考證正文明確寫「非原版」');
ok(prov.entries.filter(function (x) { return x.id === 'hero.pikachu'; })[0].current.indexOf('非原版') >= 0, '皮卡丘考證正文明確寫「非原版」');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
