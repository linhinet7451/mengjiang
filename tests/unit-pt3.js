// pt12u 第 3 階段（P3）：將魂合成、無極無盡波次、通天塔每 10 層、榮譽培養、敏耐轉型、v5→v6。node tests/unit-pt3.js
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var T0 = 1767225600000;
function fresh() { var c = load(); c._t = T0; c.MJ.U.now = function () { return c._t; }; c.MJ.G.newGame('測試', '力耐', 'm', 1); return c; }
function seq(a) { var i = 0; return function () { return a[i++ % a.length]; }; }
var c, M, G, S, R, r, i;

console.log('[將魂合成：W541 34 條公式、30 級開放]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var recipes = M.D.config.soulCombine.recipes, firstRecipe = recipes[0].split(',');
var greens = M.D.heroes.list.filter(function (d) { return d.quality === 2; });
G.addItem('soul:' + firstRecipe[0], 1);
r = G.soulCombineRecipe(0);
ok(!r.ok && /30/.test(r.msg), '主角未滿 30 級不能合成');
G.lead().lv = 30;
ok(recipes.length === 34 && recipes.every(function (x) { var p = x.split(','); return p.length === 6 && p[5]; }), 'W541 載入 34 條固定五魂公式');
var shuffled = firstRecipe.slice(0, 5).reverse();
ok(G.soulRecipeFind(shuffled).index === 0, '公式材料順序無關');
firstRecipe.slice(0, 5).forEach(function (id) { G.addItem('soul:' + id, 1); });
r = G.soulCombineRecipe(0);
ok(r.ok && r.id === firstRecipe[5], '正確 5 魂配方產出指定將魂');
var secondRecipe = recipes[1].split(','), missing = 'soul:' + secondRecipe[0];
delete S.state.bag.stack[missing];
var beforeOut = S.state.bag.stack['soul:' + secondRecipe[5]] || 0;
r = G.soulCombineRecipe(1);
ok(!r.ok && (S.state.bag.stack['soul:' + secondRecipe[5]] || 0) === beforeOut, '缺少材料時不合成、不產出');
var p30 = M.D.heroes.list.filter(function (d) { return G.soulRank(d.id) === 4; }), p45 = M.D.heroes.list.filter(function (d) { return G.soulRank(d.id) === 5; });
ok(p30.length > 0 && p45.length > 0, 'K2：30 魂紫將（' + p30.length + ' 名）與 45 魂紫將（' + p45.length + ' 名）並存');
ok(M.D.config.soulCombine.recipes.length === 34, '爭議公式不進入 runtime');
ok(M.D.config.soulCombine.open === 30 && M.D.config.soulCombine.n === 5, '設定：30 級開放、5 魂配方');

console.log('[無極幻境：無盡波次、每 5 波 1 將魂]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
ok(G.WUJI[0].start === 1 && G.WUJI[1].start === 41 && G.WUJI[2].start === 81, '三個起點：第 1／41／81 波');
var w5 = G.wujiWaveReward(5), w10 = G.wujiWaveReward(10), w7 = G.wujiWaveReward(7);
ok(w5.soulQ === 2 && w10.soulQ === 2 && w7.soulQ == null, '第 5、10 波掉將魂，第 7 波不掉');
ok(G.wujiSoulQ(40) === 2 && G.wujiSoulQ(45) === 3 && G.wujiSoulQ(85) === 4, '將魂品質：≤40 綠、≤80 藍、之後紫');
ok(G.wujiLv(1) === 14 && G.wujiLv(41) === 30 && G.wujiLv(81) === 46, '敵軍等級隨波數提升（14／30／46）');
var a1 = G.wujiWave(G.WUJI[0], 9, 1), a2 = G.wujiWave(G.WUJI[0], 4, 1), a3 = G.wujiWave(G.WUJI[0], 2, 1);
ok(a1.kind === 'boss' && a2.kind === 'elite' && a3.kind === 'normal', '第 10 波王、第 5 波精英、第 3 波普通');
S.state.heroes.forEach(function (h) { h.lv = 40; h.star = 3; });
var sv = S.state.player.silver; r = G.wujiRun('w1', 3);
ok(r.ok && r.cleared >= 1 && S.state.player.silver > sv, '40 級隊伍挑戰並獲得已通過波次的銀幣');
var soulN = 0; Object.keys(S.state.bag.stack).forEach(function (k) { if (k.indexOf('soul:') === 0) soulN += S.state.bag.stack[k]; });
ok(soulN === Math.floor(r.cleared / 5) && r.souls === soulN, '將魂數＝通過波數 ÷ 5（通過 ' + r.cleared + ' 波，將魂 ' + soulN + '）');
ok(S.state.wuji.best === r.cleared, '最深紀錄 = ' + r.cleared);
var g10 = S.state.wuji.first.W10;
ok(r.cleared >= 10 ? g10 === true : !g10, '第 10 波里程碑金幣只記錄一次');
var gold0 = S.state.player.gold; r = G.wujiRun('w1', 3);
var c1 = r.cleared; r = G.wujiRun('w1', 3);
ok(r.ok && r.cleared === c1 && !r.firstRewards && S.state.player.gold === gold0, '同種子重打同樣波數：不再給里程碑金幣（金幣不變）');

console.log('[通天塔：每 10 層獎勵、紫裝碎片]');
c = fresh(); M = c.MJ; G = M.G; S = M.S; R = M.R;
var f10 = G.towerFloor(10), f20 = G.towerFloor(20), f9 = G.towerFloor(9);
ok(f10.first.items.some(function (x) { return x.item.indexOf('eq:') === 0 && x.q === 2; }), '第 10 層：藍色裝備');
ok(f20.first.items.some(function (x) { return x.item === G.FRAG && x.n === 2; }), '第 20 層：紫裝碎片 ×2');
ok(!f9.first.items.some(function (x) { return x.item === G.FRAG || x.item.indexOf('eq:') === 0; }), '第 9 層沒有 10 層獎勵');
r = G.fragCombine('armor'); ok(!r.ok, '碎片不足不能合成');
G.addItem(G.FRAG, 10); G.lead().lv = 33;
r = G.fragCombine('weapon', 'm');
ok(r.ok && r.equip.q === 3 && /^wm/.test(r.equip.t) && !S.state.bag.stack[G.FRAG], '10 個碎片 → 紫色法攻武器（Lv' + R.equipTpl(r.equip.t).lv + '）');
G.addItem(G.FRAG, 10); r = G.fragCombine('weapon', 'j'); ok(r.ok && /^wj/.test(r.equip.t), '也可合成絕技武器（決策 4：保留絕技）');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
G.lead().lv = 80; S.state.heroes.forEach(function (h) { h.lv = 80; h.star = 5; }); S.state.tower.best = 9;
var b0 = S.state.bag.equips.length; r = G.towerFight(7);
ok(r.ok && r.win && S.state.tower.best === 10 && S.state.bag.equips.length === b0 + 1, '實際打通第 10 層拿到裝備');
var b1 = S.state.bag.equips.length; r = G.towerFight(8); r = G.towerFight(8);
ok(S.state.tower.best === 12 && S.state.bag.equips.length === b1, '第 11、12 層沒有裝備（首通獎勵只給一次）');

console.log('[榮譽培養：一次 50 榮譽、重試／保持／替換]');
c = fresh(); M = c.MJ; G = M.G; S = M.S;
var h = G.teamList()[0].hero; S.state.player.silver = 100000; S.state.player.honor = 0;
r = G.peiyang(h.uid, 'normal', seq([0.9])); ok(!r.ok && /榮譽/.test(r.msg), '榮譽不足時不能培養');
G.addItem('peiyangdan', 2);
ok(S.state.player.honor === 100 && !S.state.bag.stack.peiyangdan, '榮譽令（舊培養丹）入袋即換成 50 榮譽');
r = G.peiyang(h.uid, 'normal', seq([0.9]));
ok(r.ok && S.state.player.honor === 50 && S.state.player.silver === 100000 - 300, '普通培養扣 50 榮譽＋300 銀');
var first = JSON.stringify(h.pyPending);
r = G.peiyangRetry(h.uid, 'normal', seq([0.1]));
ok(r.ok && S.state.player.honor === 0 && JSON.stringify(h.pyPending) !== first, '重試：再付 50 榮譽並得到新結果');
r = G.peiyangRetry(h.uid, 'normal', seq([0.9]));
ok(!r.ok && h.pyPending && S.state.player.honor === 0, '榮譽不足時重試失敗，保留上一個結果');
var pend = JSON.stringify(h.pyPending); G.peiyangAccept(h.uid);
ok(JSON.stringify(h.py) === pend, '替換：採用新結果');
S.state.player.honor = 50; G.peiyang(h.uid, 'normal', seq([0.9])); var keep = JSON.stringify(h.py); G.peiyangCancel(h.uid);
ok(JSON.stringify(h.py) === keep && !h.pyPending, '保持：維持原數值');
S.state.player.honor = 149; r = G.peiyang(h.uid, 'strong'); ok(!r.ok, '加強培養需要 150 榮譽');
r = G.grant({ honor: 30 }); ok(S.state.player.honor === 179 && r[0] === '榮譽 +30', 'grant 支援榮譽');
c = fresh(); M = c.MJ; G = M.G; S = M.S; G.lead().lv = 20;
var hn = S.state.player.honor; r = G.arenaFight(G.arenaList()[0], 3);
ok(r.ok && S.state.player.honor === hn + (r.win ? 25 : 5), '拜訪武將：' + (r.win ? '勝 +25' : '敗 +5') + ' 榮譽');

console.log('[6 名敏耐武將轉型（C）]');
c = fresh(); M = c.MJ; R = M.R;
// v9（網路資料搜查-2）：段譽、周伯通改依 snA967 類型欄（B）；其餘 4 人仍為 C 推定
var conv = { duanyu: '力敏', huangyaoshi: '智耐', zhoubotong: '力耐', huangzhong: '力敏', ganning: '力敏', zhizunbao: '力耐' }, v9t = { duanyu: 1, zhoubotong: 1 };
Object.keys(conv).forEach(function (id) { var d = R.heroDef(id); ok(d.type === conv[id] && d.typeFrom === '敏耐' && (v9t[id] ? /^B/.test(d.typeGrade) : /^C/.test(d.typeGrade)), d.name + '：敏耐 → ' + conv[id] + '（' + (v9t[id] ? 'B，v9 依 snA967' : 'C') + '）'); });
ok(M.D.heroes.list.every(function (d) { return ['力敏', '力耐', '智敏', '智耐'].indexOf(d.type) >= 0; }), '非主角武將只剩原版 4 型');
ok(M.D.config.leadTypes['敏耐'] != null, '主角仍可選敏耐（B：主角可配點成敏耐）');
ok(R.dtypeOf(R.heroDef('duanyu').type) === 'p' && R.dtypeOf(R.heroDef('ganning').type) === 'p', '段譽（v9 力敏）、甘寧改物理傷害');

console.log('[將星錄：來源魂升級不可逆]');
c = fresh(); M = c.MJ; G = M.G; R = M.R; S = M.S;
G.lead().lv = 30;
var jxh = G.newHero('caocao', S.state); S.state.heroes.push(jxh);
G.addItem('soul:caocao', R.jxSoulCost(jxh, 1));
var jxu = G.jxLevelUp(jxh.uid);
ok(jxu.ok && jxh.jxLevel === 1 && typeof G.unJxLevel === 'undefined', '依來源魂量升至 Lv1，且沒有退回功能');
ok(typeof G.lightStar === 'undefined' && typeof G.unlightStar === 'undefined', '二十八宿點亮／復原 API 已退役');

console.log('[存檔 v5 → v6 遷移]');
var txt = fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v5.json'), 'utf8');
c = load(); c._t = T0; c.MJ.U.now = function () { return c._t; }; M = c.MJ;
var p = M.S.parse(txt);
ok(p.ok && p.state.version === M.S.VERSION && p.state.migratedFrom === 5, 'v5 存檔可匯入並升到 v' + M.S.VERSION);
if (p.ok) {
  var st = p.state, by = {}; st.heroes.forEach(function (x) { by[x.id] = x; });
  ok(st.player.honor === 200 && !st.bag.stack.peiyangdan, '培養丹 ×4 → 榮譽 200');
  var wpn = by.duanyu.eq.weapon;
  ok(wpn.t === 'wp30' && wpn.q === 2 && wpn.plus === 3 && wpn.uid === 7 && wpn.gems[0] === 'gem_atk_1' && wpn.aff.length === 1, '段譽裝備中的絕技武器 wj30 → 物攻 wp30（v9 段譽為力敏；保留品質、強化、詞條、寶石、uid）');
  ok(by.zhizunbao.eq.weapon.t === 'wp18', '至尊寶原本的物攻武器不變');
  ok(st.bag.equips.some(function (e) { return e.t === 'wj24'; }), '包裹裡的絕技武器保留（決策 4）');
  ok(st.bag.stack['soul:duanyu'] === 3 && by.duanyu.lv === 30 && by.huangyaoshi.lv === 25, '將魂、等級保留');
  ok(st.settings.soulRule === 'S4' && st.wuji.best === 0, '補上合成規則與無極最深紀錄');
  ok((st.migrateNotes || []).filter(function (x) { return /敏耐 →/.test(x); }).length === 3, '遷移紀錄列出 3 名轉型武將');
  M.S.state = st;
  ok(M.G.fight('s1_1', 5).ok !== false, '遷移後可戰鬥');
  var again = load().MJ.S.parse(M.S.exportText());
  ok(again.ok && again.state.version === M.S.VERSION && again.state.player.honor === 200, '遷移後再匯出／匯入正常');
}
var v4 = load(); v4.MJ.U.now = function () { return T0; };
var p4 = v4.MJ.S.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'save-v4.json'), 'utf8'));
ok(p4.ok && p4.state.version === v4.MJ.S.VERSION && p4.state.player.honor >= 0, 'v4 存檔仍可一路升到 v' + v4.MJ.S.VERSION);

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
