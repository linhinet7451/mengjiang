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
  // WL-8 補修：max＝該章最高理論隊伍（D 級）：最高品質武將（品質 4）、當級最好裝備（gearLv=L，裝備最高 Lv54）與
  // 最高品質（紫 q3）、強化拉滿（plus=L：神兵坊等級上限＝主角等級，銀幣成本不計）、技能升滿（sk=min(10,L)：9 級＋
  // 「突破·神」升 10 級，技能等級不能超過武將等級）、圖鑑全收（codex=87：88 名武將扣主角，獎勵封頂 15%）、
  // 培養拉滿（py=培養上限 floor(10+1.5L)，四維全滿）、將星 5 星（star=5）、主角升階（leadQ：Lv<20 為 2、
  // 20–59 為 3、60+ 為 4）、上陣人數拉滿（top=7：8 人上限扣主角）。不建模：心法／寶石／裝備洗鍊屬性
  // （所有檔次皆不建模，故 max 是保守估計——真實全滿隊伍只會更強）。
  if (kind === 'max') return { hq: 4, top: 7, lvGap: 0, gearLv: L, gearQ: 3, plus: L, sk: Math.min(10, L), codex: 87, py: Math.floor(10 + 1.5 * L) };
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
  var s = MJ.S.state, p = profile(kind, L), lead = G.lead(), rng = U.rng(L * 31 + (kind === 'typ' ? 1 : kind === 'max' ? 3 : 2));
  lead.lv = L; lead.sk = { a: p.sk, u: p.sk, p: p.sk }; gear(lead, L, p, 'p'); lead.py = { str: p.py, int: 0, agi: 0, con: p.py };
  if (kind === 'max') { lead.star = 5; lead.py = { str: p.py, int: p.py, agi: p.py, con: p.py }; s.player.leadQ = L < 20 ? 2 : L < 60 ? 3 : 4; }
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
    if (kind === 'max') { h.star = 5; h.py = { str: p.py, int: p.py, agi: p.py, con: p.py }; }
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
// 8) ×2 挑戰量測（WL-7）：精英／王關／隱藏關＋代表普通關，敵方攻防血 ×2（36 回合）vs 第 1 節基線。
// ×2 疊加隨機組合＋增援（王關／隱藏關；精英關無增援，疊加＝隨機＋×2）；s1_8 另測 ×2＋詞綴＋隨機＋增援全疊加。
// 倍率順序與 G.fight 一致：先 ×2 再套詞綴（Math.floor 取整順序一致，結果才與實戰相同）。
out.wl7 = [];
U.each(D.stages.stages, function (sg) {
  if (sg.kind !== 'elite' && sg.kind !== 'boss' && sg.kind !== 'hidden') return;
  var L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === sg.id; });
  var isBH = sg.kind === 'boss' || sg.kind === 'hidden';
  function mkDbl(rand, reinf) {
    return function (seed) {
      var foes = rand ? G.drawFoes(sg, seed) : G.buildEnemy(sg);
      U.each(foes, function (f) { G.doubleUnit(f.unit); });
      var re = (reinf && isBH) ? G.drawReinforce(sg, seed) : null;
      if (re) U.each(re, function (u) { G.doubleUnit(u); });
      return { foes: foes, reinforce: re };
    };
  }
  out.wl7.push({
    id: sg.id, kind: sg.kind, lv: sg.lv,
    baseTyp: base.typ, baseWeak3: base.weak3,
    dblTyp: winRateFull('typ', L, mkDbl(false, false)),
    dblWeak3: winRateFull('weak', Math.min(80, L + 3), mkDbl(false, false)),
    dblStackTyp: winRateFull('typ', L, mkDbl(true, true)),
    dblStackWeak3: winRateFull('weak', Math.min(80, L + 3), mkDbl(true, true))
  });
});
// 代表普通關 ×2（每章取第一個普通關）
out.wl7normal = [];
U.each([1, 3, 5, 8, 10], function (ch) {
  var sg = U.find(D.stages.stages, function (x) { return x.ch === ch && x.kind === 'normal'; });
  if (!sg) return;
  var L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === sg.id; });
  function mkN(seed) {
    var foes = G.buildEnemy(sg);
    U.each(foes, function (f) { G.doubleUnit(f.unit); });
    return { foes: foes, reinforce: null };
  }
  out.wl7normal.push({ id: sg.id, kind: sg.kind, lv: sg.lv, baseTyp: base.typ, baseWeak3: base.weak3, dblTyp: winRateFull('typ', L, mkN), dblWeak3: winRateFull('weak', Math.min(80, L + 3), mkN) });
});
// ×2 越級重打（WL-7 補充）：×2 模式的目標是「後期玩家回頭重打舊關」，同級勝率 0% 不代表打不贏；
// 測前三章王關在一般隊高出 5／10／15／20 級時的 ×2 勝率，看幾級後打得動。
out.wl7over = [];
U.each(['s1_8', 's2_8', 's3_8'], function (id) {
  var sg = MJ.D.stageIndex[id], L = Math.max(1, sg.lv);
  function mkO(seed) {
    var foes = G.buildEnemy(sg);
    U.each(foes, function (f) { G.doubleUnit(f.unit); });
    return { foes: foes, reinforce: null };
  }
  out.wl7over.push({ id: id, lv: sg.lv, plus5: winRateFull('typ', Math.min(80, L + 5), mkO), plus10: winRateFull('typ', Math.min(80, L + 10), mkO), plus15: winRateFull('typ', Math.min(80, L + 15), mkO), plus20: winRateFull('typ', Math.min(80, L + 20), mkO) });
});
// s1_8 ×2 全疊加：×2＋詞綴（種子派生）＋隨機組合＋增援
(function () {
  var sg = MJ.D.stageIndex['s1_8'], L = Math.max(1, sg.lv);
  var base = U.find(out.stages, function (x) { return x.id === 's1_8'; });
  var wl7row = U.find(out.wl7, function (x) { return x.id === 's1_8'; });
  function mkDblStack(seed) {
    var foes = G.drawFoes(sg, seed);
    U.each(foes, function (f) { G.doubleUnit(f.unit); });
    G.applyStageAffix(sg, foes, seed);
    var re = G.drawReinforce(sg, seed);
    U.each(re, function (u) { G.doubleUnit(u); });
    return { foes: foes, reinforce: re };
  }
  out.wl7stack = {
    id: 's1_8', lv: sg.lv,
    baseTyp: base.typ, baseWeak3: base.weak3,
    dblTyp: wl7row.dblTyp, dblWeak3: wl7row.dblWeak3,
    dblStackTyp: wl7row.dblStackTyp, dblStackWeak3: wl7row.dblStackWeak3,
    dblAffixStackTyp: winRateFull('typ', L, mkDblStack),
    dblAffixStackWeak3: winRateFull('weak', Math.min(80, L + 3), mkDblStack)
  };
})();
// 9) WL-8 調校前後對照：讀取 WL-7 基線 docs/balance-wl7-double.json（調校前），與本輪 §§1–8（已套 bossScale）對照。
// 另補 ×2 越級：十章王關在一般隊高出 5／10 級時的 ×2 勝率（WL-8 後 ×2 會更難，確認越級仍打得動；
// 若某王關 +10 級仍 < 50%，即「×2 連越級 10 級都打不動」，須在回報標出）。30 天模擬不在此工具內，另跑 tools/progress-sim.js 對照。
(function () {
  var fs = require('fs'), path = require('path'), base = null;
  try { base = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'balance-wl7-double.json'), 'utf8')); } catch (e) { base = null; }
  function avg(xs, k) { var s = 0, n = 0; xs.forEach(function (x) { if (x[k] != null) { s += x[k]; n++; } }); return n ? s / n : null; }
  function byId(list, id) { return U.find(list, function (x) { return x.id === id; }); }
  function cnt(xs, k, lo, hi) { var n = 0; xs.forEach(function (x) { if (x[k] != null && x[k] >= lo && x[k] < hi) n++; }); return n; }
  var wl8 = { bossScale: D.config.bossScale.slice(), baseline: base ? 'docs/balance-wl7-double.json' : null, chapters: [], overall: {}, tower: {}, wuji: {}, challenge: {}, double: {}, doubleOver: [] };
  var allBossA = [], allBossB = [], allNormA = [], allNormB = [];
  for (var ch = 1; ch <= 10; ch++) {
    var bossA = [], bossB = [], normA = [], normB = [];
    U.each(D.stages.stages, function (sg) {
      if (sg.ch !== ch) return;
      var a = byId(out.stages, sg.id), b = base ? byId(base.stages, sg.id) : null;
      if (sg.kind === 'normal') { if (a) normA.push(a); if (b) normB.push(b); }
      else { if (a) bossA.push(a); if (b) bossB.push(b); }
    });
    allBossA = allBossA.concat(bossA); allBossB = allBossB.concat(bossB); allNormA = allNormA.concat(normA); allNormB = allNormB.concat(normB);
    wl8.chapters.push({
      ch: ch, bossScale: D.config.bossScale[ch - 1], bossN: bossA.length,
      bossTypBefore: avg(bossB, 'typ'), bossTypAfter: avg(bossA, 'typ'),
      bossWeakBefore: avg(bossB, 'weak3'), bossWeakAfter: avg(bossA, 'weak3'),
      bossMinBefore: avg(bossB, 'min3'), bossMinAfter: avg(bossA, 'min3'),
      bossTypMinAfter: Math.min.apply(null, bossA.map(function (x) { return x.typ; })),
      bossTypMaxAfter: Math.max.apply(null, bossA.map(function (x) { return x.typ; })),
      normTypBefore: avg(normB, 'typ'), normTypAfter: avg(normA, 'typ'),
      normTypMinAfter: Math.min.apply(null, normA.map(function (x) { return x.typ; }))
    });
  }
  wl8.overall = {
    bossN: allBossA.length,
    bossTypBefore: avg(allBossB, 'typ'), bossTypAfter: avg(allBossA, 'typ'),
    bossWeakBefore: avg(allBossB, 'weak3'), bossWeakAfter: avg(allBossA, 'weak3'),
    bossMinBefore: avg(allBossB, 'min3'), bossMinAfter: avg(allBossA, 'min3'),
    bossTyp100: cnt(allBossA, 'typ', 1, 1.0001), bossTyp7080: cnt(allBossA, 'typ', 0.7, 0.85),
    bossTyp8599: cnt(allBossA, 'typ', 0.85, 1), bossTyp5069: cnt(allBossA, 'typ', 0.5, 0.7), bossTypBelow50: cnt(allBossA, 'typ', 0, 0.5),
    normN: allNormA.length, normTypBefore: avg(allNormB, 'typ'), normTypAfter: avg(allNormA, 'typ'),
    normTypMinAfter: Math.min.apply(null, allNormA.map(function (x) { return x.typ; }))
  };
  wl8.tower = { below100Before: base ? cnt(base.tower, 'typ', 0, 1) : null, below100After: cnt(out.tower, 'typ', 0, 1), f100Before: base ? (U.find(base.tower, function (x) { return x.floor === 100; }) || {}).typ : null, f100After: (U.find(out.tower, function (x) { return x.floor === 100; }) || {}).typ };
  wl8.wuji = { below100Before: base ? cnt(base.wuji, 'typ', 0, 1) : null, below100After: cnt(out.wuji, 'typ', 0, 1), zeroBefore: base ? cnt(base.wuji, 'typ', 0, 0.0001) : null, zeroAfter: cnt(out.wuji, 'typ', 0, 0.0001) };
  wl8.challenge = { typ12Before: base ? avg(base.challenge, 'typ12') : null, typ12After: avg(out.challenge, 'typ12'), weak312Before: base ? avg(base.challenge, 'weak312') : null, weak312After: avg(out.challenge, 'weak312') };
  wl8.double = { dblTypBefore: base ? avg(base.wl7, 'dblTyp') : null, dblTypAfter: avg(out.wl7, 'dblTyp'), dblWeakBefore: base ? avg(base.wl7, 'dblWeak3') : null, dblWeakAfter: avg(out.wl7, 'dblWeak3'), dblStackTypBefore: base ? avg(base.wl7, 'dblStackTyp') : null, dblStackTypAfter: avg(out.wl7, 'dblStackTyp') };
  // ×2 越級：十章王關，一般隊 +5／+10／+15／+20（WL-8 後 ×2 更難，需看幾級後打得動）
  for (var k = 1; k <= 10; k++) {
    var id = 's' + k + '_8', sg = MJ.D.stageIndex[id], L = Math.max(1, sg.lv);
    (function (sg, L) {
      function mkO(seed) {
        var foes = G.buildEnemy(sg);
        U.each(foes, function (f) { G.doubleUnit(f.unit); });
        return { foes: foes, reinforce: null };
      }
      wl8.doubleOver.push({ id: id, lv: sg.lv, plus5: winRateFull('typ', Math.min(80, L + 5), mkO), plus10: winRateFull('typ', Math.min(80, L + 10), mkO), plus15: winRateFull('typ', Math.min(80, L + 15), mkO), plus20: winRateFull('typ', Math.min(80, L + 20), mkO) });
    })(sg, L);
  }
  out.wl8 = wl8;
})();
// 10) WL-8 補修：max 模型（理論最高養成）打 ×2——確認 ×2 是否打得過；若 max 同級都打不動，×2 即實質鎖死。
// 量測：40 關精英／王／隱藏關，max 隊伍@關卡等級，12 種子；base＝原組合（與 WL-7 dblTyp 同口徑），stack＝隨機組合＋增援
// （實戰就是 stack：G.fight 對王系關一律 drawFoes，增援在王關觸發；base 是下限口徑）。
// 候選量測：current＝載入時的設定（走真實 G.doubleUnit）；A＝mult 1.5 不封頂（暫改 G.DOUBLE.mult，走真實 G.doubleUnit，測完還原）；
// B＝mult 2＋總倍率上限 4、C＝mult 1.5＋總倍率上限 4：遊戲沒有封頂機制（量測證明不需要），故用與 G.doubleUnit 同體的
// 鏡像 dblUnit 量測 what-if；鏡像在量測前先與 G.doubleUnit 對照（mult＝載入值時結果一致，否則直接拋錯）。
// 總倍率＝bossScale×doubleMult；上限 4 即 doubleMult＝min(mult, 4/bossScale)。
(function () {
  var wl8fix = {
    maxModel: 'hq4/top7/lvGap0/gearLv=L/gearQ3/plus=L/sk=min(10,L)/codex87/py=floor(10+1.5L)/star5/leadQ(L<20:2,20-59:3,60+:4)；心法／寶石／洗鍊不建模（保守估計）',
    loadedMult: G.DOUBLE.mult,
    rows: [], summary: {}
  };
  // 鏡像：與 G.doubleUnit 同體（攻防血＋無雙固定傷害，Math.floor 取整），供封頂候選 what-if 量測用。
  function dblUnit(u, m) {
    if (!u) return u;
    U.each(['patk', 'matk', 'jatk', 'pdef', 'mdef', 'jdef'], function (k) { u[k] = Math.floor(u[k] * m); });
    u.hp = Math.floor(u.hp * m);
    if (u.ult) u.ult.flat = Math.floor((u.ult.flat || 0) * m);
    return u;
  }
  // 鏡像對照：mult＝載入值時，鏡像與真實 G.doubleUnit 必須一致，否則量測不可信
  (function () {
    var sample = { patk: 123, matk: 45, jatk: 67, pdef: 89, mdef: 10, jdef: 11, hp: 999, ult: { flat: 33 } };
    var a = JSON.parse(JSON.stringify(sample)), b = JSON.parse(JSON.stringify(sample));
    G.doubleUnit(a); dblUnit(b, G.DOUBLE.mult);
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('§10 鏡像 dblUnit 與 G.doubleUnit 在 mult=' + G.DOUBLE.mult + ' 不一致');
  })();
  function effMult(sg, mult, cap) {
    var m = mult;
    if (cap) { var bs = (D.config.bossScale || [])[Math.min(Math.max(sg.ch, 1), (D.config.bossScale || []).length) - 1]; if (bs) m = Math.min(m, cap / bs); }
    return m;
  }
  // mode：'normal' 不翻倍；'base' 原組合翻倍；'stack' 隨機組合＋增援翻倍。useReal＝true 走真實 G.doubleUnit
  // （G.DOUBLE.mult 由 sweep 暫改），false 走鏡像 dblUnit（封頂候選）。
  function winMax(sg, mode, mult, cap, useReal) {
    var w = 0;
    for (var sd = 1; sd <= SEEDS; sd++) {
      var team = playerTeam('max', Math.max(1, sg.lv));
      var seed = sd * 977 + 3, foes, re = null, opt = { seed: seed, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression };
      function dbl(u) { if (useReal) G.doubleUnit(u); else dblUnit(u, effMult(sg, mult, cap)); }
      if (mode === 'normal') { foes = G.buildEnemy(sg); }
      else if (mode === 'stack') {
        foes = G.drawFoes(sg, seed);
        U.each(foes, function (f) { dbl(f.unit); });
        if (sg.kind === 'boss' || sg.kind === 'hidden') { re = G.drawReinforce(sg, seed); U.each(re, function (u) { dbl(u); }); opt.reinforce = { units: re }; }
      } else {
        foes = G.buildEnemy(sg);
        U.each(foes, function (f) { dbl(f.unit); });
      }
      var r = MJ.Battle.run(team, foes, opt);
      if (r.win) w++;
    }
    return w / SEEDS;
  }
  function sweep(label, mult, cap, useReal) {
    var savedMult = G.DOUBLE.mult;
    if (useReal) G.DOUBLE.mult = mult;
    U.each(D.stages.stages, function (sg) {
      if (sg.kind !== 'elite' && sg.kind !== 'boss' && sg.kind !== 'hidden') return;
      var row = U.find(wl8fix.rows, function (x) { return x.id === sg.id; });
      row[label + 'Base'] = winMax(sg, 'base', mult, cap, useReal);
      row[label + 'Stack'] = winMax(sg, 'stack', mult, cap, useReal);
    });
    G.DOUBLE.mult = savedMult;
  }
  // 對照：max 打一般模式（不翻倍）40 關
  U.each(D.stages.stages, function (sg) {
    if (sg.kind !== 'elite' && sg.kind !== 'boss' && sg.kind !== 'hidden') return;
    var row = { id: sg.id, kind: sg.kind, ch: sg.ch, lv: sg.lv, bossScale: (D.config.bossScale || [])[sg.ch - 1] };
    row.normalMax = winMax(sg, 'normal', G.DOUBLE.mult, 0, true);
    wl8fix.rows.push(row);
  });
  sweep('current', G.DOUBLE.mult, 0, true);
  sweep('candA', 1.5, 0, true);
  sweep('candB', 2, 4, false);
  sweep('candC', 1.5, 4, false);
  function summ(key) {
    var xs = wl8fix.rows.map(function (r) { return r[key]; });
    var avg = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
    var bosses = wl8fix.rows.filter(function (r) { return /_8$/.test(r.id); }).map(function (r) { return r[key]; });
    return {
      avg: avg, min: Math.min.apply(null, xs),
      nAbove0: xs.filter(function (x) { return x > 0; }).length,
      n100: xs.filter(function (x) { return x === 1; }).length,
      bossAvg: bosses.reduce(function (a, b) { return a + b; }, 0) / bosses.length,
      bossMin: Math.min.apply(null, bosses),
      bossBelow25: bosses.filter(function (x) { return x < 0.25; }).length
    };
  }
  wl8fix.summary = {
    normalMax: summ('normalMax'), currentBase: summ('currentBase'), currentStack: summ('currentStack'),
    candABase: summ('candABase'), candAStack: summ('candAStack'),
    candBBase: summ('candBBase'), candBStack: summ('candBStack'),
    candCBase: summ('candCBase'), candCStack: summ('candCStack')
  };
  out.wl8fix = wl8fix;
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
console.log('== ×2 挑戰（WL-7；精英／王關／隱藏關：一般@關卡等級 / 弱勢@+3；基線為第 1 節原組合 36 回合；疊加＝隨機組合＋增援再 ×2）==');
U.each(out.wl7, function (x) { console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), '基線', pct(x.baseTyp), pct(x.baseWeak3), '×2', pct(x.dblTyp), pct(x.dblWeak3), '×2疊加', pct(x.dblStackTyp), pct(x.dblStackWeak3)); });
console.log('== 代表普通關 ×2（WL-7；每章第一個普通關）==');
U.each(out.wl7normal, function (x) { console.log(x.id.padEnd(6), x.kind.padEnd(7), ('Lv' + x.lv).padEnd(5), '基線', pct(x.baseTyp), pct(x.baseWeak3), '×2', pct(x.dblTyp), pct(x.dblWeak3)); });
console.log('== s1_8 廣宗決戰 ×2 全疊加（WL-7；×2＋詞綴種子派生＋隨機組合＋增援）==');
(function () { var s8 = out.wl7stack; console.log('s1_8', ('Lv' + s8.lv).padEnd(5), '基線', pct(s8.baseTyp), pct(s8.baseWeak3), '×2', pct(s8.dblTyp), pct(s8.dblWeak3), '×2疊加', pct(s8.dblStackTyp), pct(s8.dblStackWeak3), '×2全疊加', pct(s8.dblAffixStackTyp), pct(s8.dblAffixStackWeak3)); })();
console.log('== ×2 越級重打（WL-7 補充；前三章王關：一般隊高出 5／10／15／20 級時的 ×2 勝率）==');
U.each(out.wl7over, function (x) { console.log(x.id.padEnd(6), ('Lv' + x.lv).padEnd(5), '+5', pct(x.plus5), '+10', pct(x.plus10), '+15', pct(x.plus15), '+20', pct(x.plus20)); });
console.log('== WL-8 調校前後對照（§9；基線 = WL-7，未套 bossScale；30 天模擬另見 progress-sim）==');
(function () {
  var w = out.wl8;
  console.log('章節倍率 bossScale：' + w.bossScale.map(function (x) { return x.toFixed(2); }).join(' '));
  console.log('章  王系關一般@同級 前→後    弱勢@+3 前→後    不養成@+3 前→後  普通關一般 前→後');
  U.each(w.chapters, function (c) {
    console.log(('ch' + c.ch).padEnd(4), pct(c.bossTypBefore || 0).padStart(5) + '→' + pct(c.bossTypAfter).padStart(5), pct(c.bossWeakBefore || 0).padStart(5) + '→' + pct(c.bossWeakAfter).padStart(5), pct(c.bossMinBefore || 0).padStart(5) + '→' + pct(c.bossMinAfter).padStart(5), pct(c.normTypBefore || 0).padStart(5) + '→' + pct(c.normTypAfter).padStart(5), '（王系關最低 ' + pct(c.bossTypMinAfter) + '／最高 ' + pct(c.bossTypMaxAfter) + '）');
  });
  var o = w.overall;
  console.log('王系關總計（' + o.bossN + ' 關）：一般 ' + pct(o.bossTypBefore || 0) + '→' + pct(o.bossTypAfter) + '；弱勢 ' + pct(o.bossWeakBefore || 0) + '→' + pct(o.bossWeakAfter) + '；不養成 ' + pct(o.bossMinBefore || 0) + '→' + pct(o.bossMinAfter));
  console.log('王系關分布（一般@同級，' + o.bossN + ' 關）：100% ' + o.bossTyp100 + ' 關／70–84% ' + o.bossTyp7080 + ' 關／85–99% ' + o.bossTyp8599 + ' 關／50–69% ' + o.bossTyp5069 + ' 關／<50% ' + o.bossTypBelow50 + ' 關');
  console.log('普通關（' + o.normN + ' 關）：一般 ' + pct(o.normTypBefore || 0) + '→' + pct(o.normTypAfter) + '，最低 ' + pct(o.normTypMinAfter));
  console.log('通天塔（取樣）：低於 100% 層數 ' + (w.tower.below100Before == null ? '?' : w.tower.below100Before) + '→' + w.tower.below100After + '；F100 ' + pct(w.tower.f100Before || 0) + '→' + pct(w.tower.f100After || 0));
  console.log('無極幻境（120 波）：低於 100% ' + (w.wuji.below100Before == null ? '?' : w.wuji.below100Before) + '→' + w.wuji.below100After + ' 波；0% 波次 ' + (w.wuji.zeroBefore == null ? '?' : w.wuji.zeroBefore) + '→' + w.wuji.zeroAfter + ' 波');
  console.log('限回合挑戰（8 代表關）：一般 12 回合 ' + pct(w.challenge.typ12Before || 0) + '→' + pct(w.challenge.typ12After) + '；弱勢 ' + pct(w.challenge.weak312Before || 0) + '→' + pct(w.challenge.weak312After));
  console.log('×2（40 王系關）：一般 ' + pct(w.double.dblTypBefore || 0) + '→' + pct(w.double.dblTypAfter) + '；弱勢 ' + pct(w.double.dblWeakBefore || 0) + '→' + pct(w.double.dblWeakAfter) + '；×2 疊加一般 ' + pct(w.double.dblStackTypBefore || 0) + '→' + pct(w.double.dblStackTypAfter));
  console.log('×2 越級（十章王關，一般隊）：');
  U.each(w.doubleOver, function (x) { console.log('  ', x.id.padEnd(6), ('Lv' + x.lv).padEnd(5), '+5', pct(x.plus5), '+10', pct(x.plus10), '+15', pct(x.plus15), '+20', pct(x.plus20), x.plus10 < 0.5 ? '⚠ +10 級仍 <50%（×2 連越級 10 級都打不動）' : ''); });
})();
console.log('== WL-8 補修：max 模型打 ×2（§10；max@關卡等級，12 種子；base＝原組合，stack＝隨機組合＋增援＝實戰口徑）==');
(function () {
  var f = out.wl8fix;
  console.log('max 模型：' + f.maxModel);
  console.log('載入時 G.DOUBLE.mult：' + f.loadedMult + '（×2 不封頂，遊戲未改）');
  function line(name, s) { console.log(name.padEnd(16), '平均', pct(s.avg), '最低', pct(s.min), '>0% ' + s.nAbove0 + '/40', '100% ' + s.n100 + '/40', '王關平均', pct(s.bossAvg), '王關最低', pct(s.bossMin), '王關<25% ' + s.bossBelow25 + '/10'); }
  line('一般模式', f.summary.normalMax);
  line('現況×2 base', f.summary.currentBase);
  line('現況×2 stack', f.summary.currentStack);
  line('候選A ×1.5 base', f.summary.candABase);
  line('候選A ×1.5 stack', f.summary.candAStack);
  line('候選B 總上限4 base', f.summary.candBBase);
  line('候選B 總上限4 stack', f.summary.candBStack);
  line('候選C ×1.5+上限4 base', f.summary.candCBase);
  line('候選C ×1.5+上限4 stack', f.summary.candCStack);
  console.log('章節王關逐關（max@同級，stack＝實戰口徑）：');
  U.each(f.rows, function (r) { if (/_8$/.test(r.id)) console.log('  ', r.id.padEnd(6), ('Lv' + r.lv).padEnd(5), 'bossScale', String(r.bossScale).padEnd(4), '一般', pct(r.normalMax), '現況', pct(r.currentStack), 'A', pct(r.candAStack), 'B', pct(r.candBStack), 'C', pct(r.candCStack)); });
})();
// 11) WL-9 隨機事件量測：四種事件 × 40 關精英／王／隱藏關（原組合口徑，對照第 1 節基線）＋8 關代表普通關（每章第一關普通關）；
// 事件由 opt.event 指定（與 G.fight 派生同一事件 id 走同一引擎路徑）。每關四種事件的平均＝該關帶事件的期望勝率
// （每場等機率抽一種）。另測 s1_8 全疊加（詞綴＋隨機＋增援）＋事件，及十章王關 typ+5 帶事件（硬牆檢查）。
function winRateEvent(kind, L, buildFn, eventId, rounds) {
  var w = 0;
  for (var sd = 1; sd <= SEEDS; sd++) {
    var team = playerTeam(kind, L), b = buildFn(sd * 977 + 3);
    var opt = { seed: sd * 977 + 3, maxRounds: rounds || D.config.maxRounds, levelSuppression: D.config.levelSuppression, event: eventId };
    if (b.reinforce) opt.reinforce = { units: b.reinforce };
    var r = MJ.Battle.run(team, b.foes, opt);
    if (r.win) w++;
  }
  return w / SEEDS;
}
(function () {
  var evs = MJ.Battle.EVENTS.map(function (e) { return e.id; });
  var wl9 = { scope: '主線全部關卡（普通／精英／王／隱藏）都套用；塔／無極／武林大會／藏寶窟不套', events: evs.slice(), boss: [], bossChapters: [], bossOverall: {}, normal: [], normalOverall: {}, stackS1_8: {}, hardWall: {} };
  function avg4(row, key) { var s = 0; U.each(evs, function (id) { s += row[id + key]; }); return s / evs.length; }
  function avg(arr, k) { var s = 0; U.each(arr, function (x) { s += x[k]; }); return arr.length ? s / arr.length : 0; }
  U.each(D.stages.stages, function (sg) {
    if (sg.kind !== 'elite' && sg.kind !== 'boss' && sg.kind !== 'hidden') return;
    var L = Math.max(1, sg.lv);
    var base = U.find(out.stages, function (x) { return x.id === sg.id; });
    var row = { id: sg.id, kind: sg.kind, lv: sg.lv, ch: sg.ch, baseTyp: base.typ, baseWeak3: base.weak3 };
    var mkBase = function () { return { foes: G.buildEnemy(sg) }; };
    U.each(evs, function (id) {
      row[id + 'Typ'] = winRateEvent('typ', L, mkBase, id);
      row[id + 'Weak3'] = winRateEvent('weak', Math.min(80, L + 3), mkBase, id);
    });
    row.avg4Typ = avg4(row, 'Typ'); row.avg4Weak3 = avg4(row, 'Weak3');
    wl9.boss.push(row);
  });
  // 章平均（帶事件期望值 avg4）對照 WL-8 第 9 節（無事件）
  var wl8ch = out.wl8 ? out.wl8.chapters : [];
  U.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], function (ch) {
    var rows = U.filter(wl9.boss, function (x) { return x.ch === ch; });
    var before = U.find(wl8ch, function (x) { return x.ch === ch; });
    wl9.bossChapters.push({
      ch: ch, n: rows.length,
      typBefore: before ? before.bossTypAfter : null, typAfter: avg(rows, 'avg4Typ'),
      weakBefore: before ? before.bossWeakAfter : null, weakAfter: avg(rows, 'avg4Weak3'),
      typMinAfter: Math.min.apply(null, U.map(rows, function (x) { return x.avg4Typ; })),
      typMaxAfter: Math.max.apply(null, U.map(rows, function (x) { return x.avg4Typ; }))
    });
  });
  function dist(rows, key) {
    var n100 = 0, n8599 = 0, n7080 = 0, n5069 = 0, nB50 = 0;
    U.each(rows, function (x) { var v = x[key]; if (v >= 1) n100++; else if (v >= 0.85) n8599++; else if (v >= 0.70) n7080++; else if (v >= 0.5) n5069++; else nB50++; });
    return { n100: n100, n8599: n8599, n7080: n7080, n5069: n5069, nB50: nB50 };
  }
  var d = dist(wl9.boss, 'avg4Typ');
  wl9.bossOverall = {
    bossN: wl9.boss.length,
    typBefore: avg(wl9.boss, 'baseTyp'), typAfter: avg(wl9.boss, 'avg4Typ'),
    weakBefore: avg(wl9.boss, 'baseWeak3'), weakAfter: avg(wl9.boss, 'avg4Weak3'),
    typMinAfter: Math.min.apply(null, U.map(wl9.boss, function (x) { return x.avg4Typ; })),
    typMaxAfter: Math.max.apply(null, U.map(wl9.boss, function (x) { return x.avg4Typ; })),
    dist: d
  };
  // 8 關代表普通關（每章第一關普通關）
  var normPick = [];
  U.each([1, 2, 3, 4, 5, 6, 7, 8], function (ch) {
    var sg = U.find(D.stages.stages, function (x) { return x.ch === ch && x.kind === 'normal'; });
    if (sg) normPick.push(sg);
  });
  U.each(normPick, function (sg) {
    var L = Math.max(1, sg.lv);
    var base = U.find(out.stages, function (x) { return x.id === sg.id; });
    var row = { id: sg.id, kind: sg.kind, lv: sg.lv, ch: sg.ch, baseTyp: base.typ, baseWeak3: base.weak3 };
    var mkBase = function () { return { foes: G.buildEnemy(sg) }; };
    U.each(evs, function (id) {
      row[id + 'Typ'] = winRateEvent('typ', L, mkBase, id);
      row[id + 'Weak3'] = winRateEvent('weak', Math.min(80, L + 3), mkBase, id);
    });
    row.avg4Typ = avg4(row, 'Typ'); row.avg4Weak3 = avg4(row, 'Weak3');
    wl9.normal.push(row);
  });
  wl9.normalOverall = { normN: wl9.normal.length, typBefore: avg(wl9.normal, 'baseTyp'), typAfter: avg(wl9.normal, 'avg4Typ'), typMinAfter: Math.min.apply(null, U.map(wl9.normal, function (x) { return x.avg4Typ; })) };
  // s1_8 全疊加（詞綴＋隨機＋增援）＋事件
  (function () {
    var sg = MJ.D.stageIndex['s1_8'], L = Math.max(1, sg.lv);
    var base = U.find(out.stages, function (x) { return x.id === 's1_8'; });
    function mkStack(seed) {
      var foes = G.drawFoes(sg, seed);
      G.applyStageAffix(sg, foes, seed);
      return { foes: foes, reinforce: G.drawReinforce(sg, seed) };
    }
    var s = { id: 's1_8', lv: sg.lv, baseTyp: base.typ, stackTyp: out.wl6stack.stackTyp };
    U.each(evs, function (id) { s[id + 'StackTyp'] = winRateEvent('typ', L, mkStack, id); });
    s.avg4StackTyp = avg4(s, 'StackTyp');
    wl9.stackS1_8 = s;
  })();
  // 十章王關 typ+5 帶事件（硬牆檢查：<40% 即新硬牆）
  var hw = { min: 1, below40: [] };
  U.each(D.stages.stages, function (sg) {
    if (sg.kind !== 'boss' || !/_8$/.test(sg.id)) return;
    var L = Math.max(1, sg.lv), vals = [];
    U.each(evs, function (id) { vals.push(winRateEvent('typ', Math.min(80, L + 5), function () { return { foes: G.buildEnemy(sg) }; }, id)); });
    var a = 0; U.each(vals, function (v) { a += v; }); a /= vals.length;
    if (a < hw.min) hw.min = a;
    if (a < 0.4) { hw.below40.push({ id: sg.id, lv: sg.lv, typ5avg4: a }); out.walls.push('WL-9 事件：主線 ' + sg.id + '（Lv' + sg.lv + '）+5 級帶事件勝率 ' + pct(a)); }
  });
  wl9.hardWall = hw;
  out.wl9events = wl9;
})();
// 12) WL-9 頂尖隊伍量測：(a) 五組名次隊伍 25% 機率實測（2000 顆列表種子 × 30 名次，純亂數抽取，不進戰鬥）；
// (b) 頂尖等級分布（1–99 覆蓋）；(c) 一般隊／max 隊同級打各等級頂尖隊伍勝率（PVP 口徑，頂尖隊伍組合每種子重抽）；
// (d) 固定第六組即同級頂尖隊伍（同 (c) 的同級列），另列戰力對比。
(function () {
  var wl9top = { chance: G.ARENA_TOP_CHANCE, lvMin: G.ARENA_TOP_LV_MIN, lvMax: G.ARENA_TOP_LV_MAX, seed0: G.ARENA_LIST_SEED0, prob: {}, levels: {}, winrates: [], power: [] };
  // (a) 機率實測：2000 顆列表種子 × 30 名次（G.arenaTopRoll，與 arenaListFoe 共用同一抽取）
  var NSEED = 2000, perRank = {}, totalTop = 0, total = 0, rk, sd;
  for (sd = 1; sd <= NSEED; sd++) {
    for (rk = 1; rk <= G.ARENA_N; rk++) {
      var roll = G.arenaTopRoll(rk, sd);
      perRank[rk] = perRank[rk] || { top: 0, n: 0 };
      perRank[rk].n++; total++;
      if (roll.top) { perRank[rk].top++; totalTop++; }
    }
  }
  wl9top.prob = { seeds: NSEED, total: total, totalTop: totalTop, overall: totalTop / total, perRank: {} };
  U.each(U.keys(perRank).sort(function (a, b) { return a - b; }), function (k) { wl9top.prob.perRank[k] = perRank[k].top / perRank[k].n; });
  // (b) 等級分布：同一批抽樣中，頂尖隊伍的等級（1–99 覆蓋與十分位）
  var lvMin = 99, lvMax = 1, deciles = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], lvCount = 0;
  for (sd = 1; sd <= NSEED; sd++) {
    for (rk = 1; rk <= G.ARENA_N; rk++) {
      var roll2 = G.arenaTopRoll(rk, sd);
      if (!roll2.top) continue;
      lvCount++;
      if (roll2.lv < lvMin) lvMin = roll2.lv;
      if (roll2.lv > lvMax) lvMax = roll2.lv;
      deciles[Math.min(9, Math.floor((roll2.lv - 1) / 10))]++;
    }
  }
  wl9top.levels = { n: lvCount, min: lvMin, max: lvMax, deciles: deciles };
  // (c) 勝率：一般隊／max 隊同級（Lv99 頂尖以 Lv90 玩家打，Lv90 為玩家等級上限）打各等級頂尖隊伍
  function winTop(kind, pLv, topLv) {
    var w = 0;
    for (var sd3 = 1; sd3 <= SEEDS; sd3++) {
      var team = playerTeam(kind, pLv);
      var foes = JSON.parse(JSON.stringify(G.arenaTopFoe(sd3 * 7919 + 5, topLv).foes));
      var r = MJ.Battle.run(team, foes, { seed: sd3 * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression, pvp: true });
      if (r.win) w++;
    }
    return w / SEEDS;
  }
  U.each([1, 8, 15, 25, 35, 50, 60, 70, 80, 90, 99], function (topLv) {
    var pLv = Math.min(90, topLv);
    wl9top.winrates.push({ topLv: topLv, playerLv: pLv, typ: winTop('typ', pLv, topLv), max: winTop('max', pLv, topLv) });
  });
  // (d) 戰力對比：一般隊／max 隊戰力 vs 同級頂尖隊伍戰力（種子 1 的組合）
  U.each([8, 25, 50, 70, 80, 90], function (L) {
    playerTeam('typ', L); var tp = G.myPower();
    playerTeam('max', L); var mp = G.myPower();
    var foe = G.arenaTopFoe(1, L);
    wl9top.power.push({ lv: L, typPower: tp, maxPower: mp, topPower: foe.power, topVsTyp: foe.power / tp, topVsMax: foe.power / mp, topCount: foe.count });
  });
  out.wl9top = wl9top;
})();
console.log('== WL-9 隨機事件量測（§11；12 種子；王系關＝原組合口徑，基線＝WL-8 第 1 節無事件；avg4＝四種事件平均＝帶事件期望勝率）==');
(function () {
  var w = out.wl9events;
  console.log('範圍：' + w.scope);
  console.log('章  王系關一般@同級 無事件→帶事件    弱勢@+3 無事件→帶事件    王系關帶事件最低／最高');
  U.each(w.bossChapters, function (c) {
    console.log(('ch' + c.ch).padEnd(4), pct(c.typBefore || 0).padStart(5) + '→' + pct(c.typAfter).padStart(5), pct(c.weakBefore || 0).padStart(5) + '→' + pct(c.weakAfter).padStart(5), '最低 ' + pct(c.typMinAfter) + '／最高 ' + pct(c.typMaxAfter));
  });
  var o = w.bossOverall;
  console.log('王系關總計（' + o.bossN + ' 關）：一般 ' + pct(o.typBefore) + '→' + pct(o.typAfter) + '；弱勢 ' + pct(o.weakBefore) + '→' + pct(o.weakAfter) + '；最低 ' + pct(o.typMinAfter) + '／最高 ' + pct(o.typMaxAfter));
  console.log('王系關分布（一般@同級帶事件，' + o.bossN + ' 關）：100% ' + o.dist.n100 + ' 關／85–99% ' + o.dist.n8599 + ' 關／70–84% ' + o.dist.n7080 + ' 關／50–69% ' + o.dist.n5069 + ' 關／<50% ' + o.dist.nB50 + ' 關');
  console.log('普通關（' + w.normalOverall.normN + ' 關）：一般 ' + pct(w.normalOverall.typBefore) + '→' + pct(w.normalOverall.typAfter) + '，最低 ' + pct(w.normalOverall.typMinAfter));
  console.log('四種事件王系關平均（一般@同級）：' + U.map(w.events, function (id) { var s = 0; U.each(w.boss, function (x) { s += x[id + 'Typ']; }); return id + ' ' + pct(s / w.boss.length); }).join('／'));
  console.log('四種事件普通關平均（一般@同級）：' + U.map(w.events, function (id) { var s = 0; U.each(w.normal, function (x) { s += x[id + 'Typ']; }); return id + ' ' + pct(s / w.normal.length); }).join('／'));
  console.log('s1_8 全疊加（詞綴＋隨機＋增援）一般@同級：無事件 ' + pct(w.stackS1_8.stackTyp) + '；' + U.map(w.events, function (id) { return id + ' ' + pct(w.stackS1_8[id + 'StackTyp']); }).join('／') + '；期望 ' + pct(w.stackS1_8.avg4StackTyp));
  console.log('十章王關 +5 級帶事件最低勝率：' + pct(w.hardWall.min) + (w.hardWall.below40.length ? ' ⚠ <40%：' + w.hardWall.below40.map(function (x) { return x.id; }).join('、') : '（無新硬牆）'));
})();
console.log('== WL-9 頂尖隊伍量測（§12）==');
(function () {
  var t = out.wl9top;
  console.log('名次隊伍刷頂尖機率（' + t.prob.seeds + ' 顆列表種子 × 30 名次，目標 25%）：整體 ' + (t.prob.overall * 100).toFixed(1) + '%（' + t.prob.totalTop + '/' + t.prob.total + '）');
  console.log('各名次機率：' + U.map(U.keys(t.prob.perRank).sort(function (a, b) { return a - b; }), function (k) { return '第' + k + '名 ' + (t.prob.perRank[k] * 100).toFixed(1) + '%'; }).join('／'));
  console.log('頂尖等級分布（' + t.levels.n + ' 次）：最小 ' + t.levels.min + '／最大 ' + t.levels.max + '；十分位（1–10…91–99）：' + t.levels.deciles.join(' '));
  console.log('同級打頂尖隊伍勝率（12 種子；Lv99 以 Lv90 玩家打）：');
  U.each(t.winrates, function (x) { console.log('  Lv' + String(x.topLv).padStart(2), '一般@' + x.playerLv, pct(x.typ), 'max@' + x.playerLv, pct(x.max)); });
  console.log('戰力對比（種子 1 的組合）：');
  U.each(t.power, function (x) { console.log('  Lv' + x.lv, '一般 ' + U.fmt(x.typPower), 'max ' + U.fmt(x.maxPower), '頂尖 ' + U.fmt(x.topPower), '頂尖／一般 ×' + x.topVsTyp.toFixed(2), '頂尖／max ×' + x.topVsMax.toFixed(2)); });
})();
console.log('== 硬牆 ==\n' + (out.walls.length ? out.walls.join('\n') : '無'));
if (JSON_OUT) require('fs').writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
