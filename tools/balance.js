/* 平衡模擬（第五階段）：以「一般玩家」與「弱勢玩家」兩種養成模型，模擬各關卡、通天塔、無極幻境、拜訪武將的勝率曲線。
   用法：node tools/balance.js [--json out.json] [--seeds 12]
   玩家模型全部為 D 級假設（依該等級合理可取得的武將品質、裝備、強化、技能、將星、圖鑑估算）。 */
var harness = require('../tests/harness.js');
var args = process.argv.slice(2), SEEDS = 12, JSON_OUT = null;
for (var i = 0; i < args.length; i++) { if (args[i] === '--seeds') SEEDS = +args[++i]; if (args[i] === '--json') JSON_OUT = args[++i]; }
var ctx = harness(), MJ = ctx.MJ, G = MJ.G, R = MJ.R, D = MJ.D, U = MJ.U;
var HEROES = D.heroes.list || D.heroes;

function profile(kind, L) {
  var typ = kind === 'typ';
  if (kind === 'min') return { hq: L < 25 ? 1 : 2, top: 0, lvGap: 3, gearLv: L - 12, gearQ: 0, plus: 0, sk: 1, jx: 0, codex: 3, py: 0 };
  var hq = L < 10 ? 1 : L < 25 ? 2 : 3; if (!typ) hq = Math.max(1, hq - 1);
  return {
    hq: hq, top: typ ? (L >= 55 ? 3 : L >= 35 ? 2 : L >= 25 ? 1 : 0) : (L >= 50 ? 1 : 0),
    lvGap: typ ? 1 : 2,
    gearLv: typ ? L : L - 6,
    gearQ: typ ? (L < 15 ? 1 : L < 35 ? 2 : 3) : (L < 25 ? 0 : L < 45 ? 1 : 2),
    plus: Math.floor(L / (typ ? 5 : 9)),
    sk: Math.min(9, 1 + Math.floor(L / (typ ? 6 : 10))),
    codex: Math.min(60, Math.floor(3 + L * (typ ? 0.8 : 0.4))),
    py: Math.floor(L * (typ ? 0.6 : 0.25))
  };
}
function gear(h, L, p, dt) {
  U.each(R.SLOTS, function (slot) {
    var best = null;
    U.each(D.equipment.list, function (e) {
      if (e.slot !== slot || e.lv > Math.max(1, p.gearLv)) return;
      if (slot === 'weapon' && e.id.charAt(1) !== dt) return;
      if (!best || e.lv > best.lv) best = e;
    });
    if (best) h.eq[slot] = { uid: 0, t: best.id, q: p.gearQ, plus: p.plus, aff: [], gems: [] };
  });
}
// 建立某等級的模擬玩家存檔並回傳隊伍
function playerTeam(kind, L, seed) {
  G.newGame('模擬', '力耐', 'm', seed || 1);
  var s = MJ.S.state, p = profile(kind, L), lead = G.lead(), rng = U.rng(L * 31 + (kind === 'typ' ? 1 : 2));
  lead.lv = L; lead.sk = { a: p.sk, u: p.sk, p: p.sk }; gear(lead, L, p, 'p'); lead.py = { str: p.py, int: 0, agi: 0, con: p.py };
  var slots = R.teamSlots(L), pool = HEROES.slice(), picks = [];
  function pick(q) { var c = U.filter(pool, function (h) { return h.quality === q && picks.indexOf(h) < 0; }); return c[Math.floor(rng() * c.length)]; }
  for (var k = 0; k < p.top && picks.length < slots - 1; k++) picks.push(pick(4) || pick(3));
  while (picks.length < slots - 1) picks.push(pick(p.hq) || pick(p.hq - 1));
  s.team.cells = {};
  // 前排：耐力型，主角放中排中間
  picks.sort(function (a, b) { return (b.type.indexOf('耐') >= 0) - (a.type.indexOf('耐') >= 0); });
  var order = [1, 7, 0, 6, 2, 8, 3, 5], ci = 0;
  s.team.cells[4] = lead.uid;
  U.each(picks, function (d) {
    var h = G.newHero(d.id, s); h.lv = Math.max(1, L - p.lvGap); h.sk = { a: p.sk, u: p.sk, p: p.sk };
    var c0 = d.type.charAt(0), dt = c0 === '力' ? 'p' : c0 === '智' ? 'm' : 'j'; gear(h, L, p, dt);
    h.py = { str: p.py / 2 | 0, int: p.py / 2 | 0, agi: p.py / 2 | 0, con: p.py / 2 | 0 };
    s.heroes.push(h); s.team.cells[order[ci++]] = h.uid;
  });
  for (var n = 0; n < p.codex; n++) s.codex['sim' + n] = 1;
  return G.buildTeam();
}
function winRate(kind, L, foesFn) {
  var w = 0;
  for (var sd = 1; sd <= SEEDS; sd++) {
    var team = playerTeam(kind, L), foes = foesFn(sd);
    var r = MJ.Battle.run(team, foes, { seed: sd * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (r.win) w++;
  }
  return w / SEEDS;
}
function pct(x) { return (Math.round(x * 100) + '%').padStart(5); }
var out = { stages: [], tower: [], wuji: [], arena: [], walls: [] };

// 1) 主線關卡：玩家等級 = 關卡等級（一般）／關卡等級 +3（弱勢）
U.each(D.stages.stages, function (sg) {
  var L = Math.max(1, sg.lv);
  var foes = function () { return G.buildEnemy(sg); };
  var a = winRate('typ', L, foes), b = winRate('weak', Math.min(80, L + 3), foes), c = winRate('typ', Math.min(80, L + 5), foes), m = winRate('min', Math.min(80, L + 3), foes);
  out.stages.push({ id: sg.id, kind: sg.kind, lv: sg.lv, typ: a, weak3: b, typ5: c, min3: m });
});
// 2) 通天塔：每 5 層取樣
for (var f = 1; f <= G.TOWER_MAX; f += (f < 10 ? 3 : 5)) {
  var sg = G.towerFloor(f), L = Math.min(80, sg.enemies[sg.enemies.length - 1].lv);
  var fn = function () { return G.buildEnemy(sg); };
  out.tower.push({ floor: f, lv: L, typ: winRate('typ', Math.max(22, L), fn), typ3: winRate('typ', Math.min(80, Math.max(22, L + 3)), fn), weak5: winRate('weak', Math.min(80, Math.max(22, L + 5)), fn) });
}
// 3) 無極幻境：逐波（不計血量延續，單波勝率）
U.each(G.WUJI, function (t) {
  for (var w = 0; w < t.waves; w++) {
    var sg2 = G.wujiWave(t, w, 4242), L2 = Math.max(t.open, t.lv);
    var fn2 = function () { return G.buildEnemy(sg2); };
    out.wuji.push({ tier: t.id, wave: w + 1, lv: sg2.enemies[sg2.enemies.length - 1].lv, typ: winRate('typ', L2, fn2), typ4: winRate('typ', Math.min(80, L2 + 4), fn2) });
  }
});
// 4) 拜訪武將：玩家等級 = 對手等級
for (var rk = G.ARENA_N; rk >= 1; rk -= (rk > 5 ? 3 : 1)) {
  var fo = G.arenaFoe(rk);
  var fn3 = (function (fo) { return function () { return JSON.parse(JSON.stringify(fo.foes)); }; })(fo);
  out.arena.push({ rank: rk, lv: fo.lv, n: fo.count, typ: winRate('typ', Math.max(G.ARENA_OPEN, fo.lv), fn3), typ5: winRate('typ', Math.min(80, Math.max(G.ARENA_OPEN, fo.lv + 5)), fn3), weak: winRate('weak', Math.max(G.ARENA_OPEN, fo.lv), fn3), weak8: winRate('weak', Math.min(80, Math.max(G.ARENA_OPEN, fo.lv + 8)), fn3) });
}
// 5) 首領詞綴量測（WL-4）：王關／隱藏關每詞綴 vs 不帶詞綴對照（不改既有量測與數值）
out.affix = [];
U.each(D.stages.stages, function (sg) {
  if (sg.kind !== 'boss' && sg.kind !== 'hidden') return;
  var L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === sg.id; });
  var row = { id: sg.id, kind: sg.kind, lv: sg.lv, baseTyp: base.typ, baseWeak3: base.weak3, affixes: {} };
  U.each(MJ.Battle.AFFIXES, function (af) {
    var fn = function (sd) { var foes = G.buildEnemy(sg); G.applyStageAffix(sg, foes, sd * 977 + 3, af.id); return foes; };
    row.affixes[af.id] = { typ: winRate('typ', L, fn), weak3: winRate('weak', Math.min(80, L + 3), fn) };
  });
  out.affix.push(row);
});
// 6) 限回合挑戰量測（WL-5）：代表關卡 12 回合內打贏比例（一般@關卡等級 / 弱勢@+3），
// 對照同一批種子、同一隊伍的 36 回合基線（第 1 節）；挑戰不動既有戰鬥數值，第 1～5 節數字必須與基線相同。
function winRateRounds(kind, L, foesFn, rounds) {
  var w = 0;
  for (var sd = 1; sd <= SEEDS; sd++) {
    var team = playerTeam(kind, L), foes = foesFn(sd);
    var r = MJ.Battle.run(team, foes, { seed: sd * 977 + 3, maxRounds: rounds, levelSuppression: D.config.levelSuppression });
    if (r.win) w++;
  }
  return w / SEEDS;
}
out.challenge = [];
U.each(['s1_1', 's1_8', 's2_8', 's3_8', 's5_3', 's6_8', 's8_8', 's10_1'], function (id) {
  var sg = MJ.D.stageIndex[id], L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === id; });
  var fn = function () { return G.buildEnemy(sg); };
  out.challenge.push({ id: id, kind: sg.kind, lv: sg.lv, typ12: winRateRounds('typ', L, fn, 12), weak312: winRateRounds('weak', Math.min(80, L + 3), fn, 12), typ36: base.typ, weak336: base.weak3 });
});
// 7) 增援波次＋隨機敵方組合量測（WL-6）：精英／王關／隱藏關，隨機組合、增援、兩者疊加 vs 第 1 節基線。
// 精英關沒有增援（只有王關／隱藏關），所以精英關 reinf＝base、both＝rand，作自我檢查。
// 增援小兵不上詞綴；s1_8 另測詞綴（種子派生）＋隨機＋增援全疊加，及再加限回合挑戰（12 回合）。
function winRateFull(kind, L, buildFn, rounds) {
  var w = 0;
  for (var sd = 1; sd <= SEEDS; sd++) {
    var team = playerTeam(kind, L), b = buildFn(sd * 977 + 3);
    var opt = { seed: sd * 977 + 3, maxRounds: rounds || D.config.maxRounds, levelSuppression: D.config.levelSuppression };
    if (b.reinforce) opt.reinforce = { units: b.reinforce };
    var r = MJ.Battle.run(team, b.foes, opt);
    if (r.win) w++;
  }
  return w / SEEDS;
}
out.wl6 = [];
U.each(D.stages.stages, function (sg) {
  if (sg.kind !== 'elite' && sg.kind !== 'boss' && sg.kind !== 'hidden') return;
  var L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === sg.id; });
  var isBH = sg.kind === 'boss' || sg.kind === 'hidden';
  function mk(rand, reinf) {
    return function (seed) {
      var foes = rand ? G.drawFoes(sg, seed) : G.buildEnemy(sg);
      return { foes: foes, reinforce: (reinf && isBH) ? G.drawReinforce(sg, seed) : null };
    };
  }
  out.wl6.push({
    id: sg.id, kind: sg.kind, lv: sg.lv,
    baseTyp: base.typ, baseWeak3: base.weak3,
    randTyp: winRateFull('typ', L, mk(true, false)),
    randWeak3: winRateFull('weak', Math.min(80, L + 3), mk(true, false)),
    reinfTyp: winRateFull('typ', L, mk(false, true)),
    reinfWeak3: winRateFull('weak', Math.min(80, L + 3), mk(false, true)),
    bothTyp: winRateFull('typ', L, mk(true, true)),
    bothWeak3: winRateFull('weak', Math.min(80, L + 3), mk(true, true))
  });
});
// s1_8 全疊加：詞綴（種子派生）＋隨機組合＋增援，36 回合與 12 回合（挑戰）各一組
(function () {
  var sg = MJ.D.stageIndex['s1_8'], L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === 's1_8'; });
  var chal = U.find(out.challenge, function (x) { return x.id === 's1_8'; });
  var aff = U.find(out.affix, function (x) { return x.id === 's1_8'; });
  var affAvgTyp = 0, affAvgWeak = 0, n = 0;
  U.each(MJ.Battle.AFFIXES, function (af) { affAvgTyp += aff.affixes[af.id].typ; affAvgWeak += aff.affixes[af.id].weak3; n++; });
  affAvgTyp /= n; affAvgWeak /= n;
  function mkStack(seed) {
    var foes = G.drawFoes(sg, seed);
    G.applyStageAffix(sg, foes, seed);
    return { foes: foes, reinforce: G.drawReinforce(sg, seed) };
  }
  out.wl6stack = {
    id: 's1_8', lv: sg.lv,
    baseTyp: base.typ, baseWeak3: base.weak3,
    affixAvgTyp: affAvgTyp, affixAvgWeak3: affAvgWeak,
    chalTyp12: chal.typ12, chalWeak312: chal.weak312,
    stackTyp: winRateFull('typ', L, mkStack),
    stackWeak3: winRateFull('weak', Math.min(80, L + 3), mkStack),
    stackTyp12: winRateFull('typ', L, mkStack, 12),
    stackWeak312: winRateFull('weak', Math.min(80, L + 3), mkStack, 12)
  };
})();
// 硬牆判定：一般玩家高出 5 級仍 < 40%
U.each(out.stages, function (x) { if (x.typ5 < 0.4) out.walls.push('主線 ' + x.id + '（Lv' + x.lv + '）+5 級勝率 ' + pct(x.typ5)); });
U.each(out.tower, function (x) { if (x.typ3 < 0.4 && x.lv < 80) out.walls.push('通天塔 ' + x.floor + ' 層 +3 級勝率 ' + pct(x.typ3)); });
U.each(out.wuji, function (x) { if (x.typ4 < 0.4) out.walls.push('無極 ' + x.tier + ' 第' + x.wave + '波 +4 級勝率 ' + pct(x.typ4)); });
U.each(out.arena, function (x) { if (x.typ5 < 0.4 && x.lv < 80) out.walls.push('拜訪武將第 ' + x.rank + ' 名 +5 級勝率 ' + pct(x.typ5)); });

console.log('== 主線（一般@關卡等級 / 弱勢@+3 / 一般@+5 / 不養成@+3）==');
U.each(out.stages, function (x) { console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), pct(x.typ), pct(x.weak3), pct(x.typ5), pct(x.min3)); });
console.log('== 通天塔（一般@守軍等級 / +3 / 弱勢+5）==');
U.each(out.tower, function (x) { console.log(String(x.floor).padStart(3) + 'F', ('Lv' + x.lv).padEnd(5), pct(x.typ), pct(x.typ3), pct(x.weak5)); });
console.log('== 無極幻境（單波；一般@開放等級 / +4）==');
U.each(out.wuji, function (x) { console.log(x.tier, 'W' + x.wave, ('Lv' + x.lv).padEnd(5), pct(x.typ), pct(x.typ4)); });
console.log('== 拜訪武將（一般@同等級 / +5 / 弱勢同等級 / 弱勢+8）==');
U.each(out.arena, function (x) { console.log(('#' + x.rank).padEnd(4), ('Lv' + x.lv).padEnd(5), x.n + '人', pct(x.typ), pct(x.typ5), pct(x.weak), pct(x.weak8)); });
console.log('== 首領詞綴（WL-4；王關／隱藏關：一般@關卡等級 / 弱勢@+3；「無」為不帶詞綴對照）==');
U.each(out.affix, function (x) {
  console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), '無'.padEnd(6), pct(x.baseTyp), pct(x.baseWeak3));
  U.each(MJ.Battle.AFFIXES, function (af) { var a = x.affixes[af.id]; console.log('      ', af.name.padEnd(6), pct(a.typ), pct(a.weak3)); });
});
console.log('== 限回合挑戰（WL-5；代表關卡 12 回合內打贏：一般@關卡等級 / 弱勢@+3；括號為 36 回合基線）==');
U.each(out.challenge, function (x) { console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), pct(x.typ12), pct(x.weak312), '（36 回合：' + pct(x.typ36) + ' / ' + pct(x.weak336) + '）'); });
console.log('== 增援＋隨機組合（WL-6；精英／王關／隱藏關：一般@關卡等級 / 弱勢@+3；基線為第 1 節原組合 36 回合；精英關無增援，增援＝基線、疊加＝隨機為自我檢查）==');
U.each(out.wl6, function (x) { console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), '基線', pct(x.baseTyp), pct(x.baseWeak3), '隨機', pct(x.randTyp), pct(x.randWeak3), '增援', pct(x.reinfTyp), pct(x.reinfWeak3), '疊加', pct(x.bothTyp), pct(x.bothWeak3)); });
console.log('== s1_8 廣宗決戰全疊加（WL-6；詞綴種子派生＋隨機組合＋增援；挑戰＝12 回合）==');
(function () { var s8 = out.wl6stack; console.log('s1_8', ('Lv' + s8.lv).padEnd(5), '基線', pct(s8.baseTyp), pct(s8.baseWeak3), '詞綴平均', pct(s8.affixAvgTyp), pct(s8.affixAvgWeak3), '挑戰12', pct(s8.chalTyp12), pct(s8.chalWeak312), '全疊加36', pct(s8.stackTyp), pct(s8.stackWeak3), '全疊加12', pct(s8.stackTyp12), pct(s8.stackWeak312)); })();
console.log('== 硬牆 ==\n' + (out.walls.length ? out.walls.join('\n') : '無'));
if (JSON_OUT) require('fs').writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
