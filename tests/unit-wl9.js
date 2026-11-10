// WL-9：關卡內隨機事件＋拜訪武將頂尖隊伍（D 級原創）。node tests/unit-wl9.js
// 目的：事件由戰鬥種子抽取、效果進戰鬥、戰報重播一致；頂尖隊伍等級＝玩家等級、練度拉滿、
// 名次隊伍 25% 刷頂尖（等級 1–99）、獎勵反映難度、不影響排名；存檔 v12 不變。
var load = require('./harness.js'), fs = require('fs'), path = require('path');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U, D = M.D;

// 與 tools/balance.js 相同的 D 級玩家模型（複製於此，避免單元測試依賴量測工具；競技勝負測試用）
var HEROES = D.heroes.list || D.heroes;
function profile(kind, L) {
  var typ = kind === 'typ';
  if (kind === 'max') return { hq: 4, top: 7, lvGap: 0, gearLv: L, gearQ: 3, plus: L, sk: Math.min(10, L), codex: 87, py: Math.floor(10 + 1.5 * L) };
  var hq = L < 10 ? 1 : L < 25 ? 2 : 3; if (!typ) hq = Math.max(1, hq - 1);
  return { hq: hq, top: typ ? (L >= 55 ? 3 : L >= 35 ? 2 : L >= 25 ? 1 : 0) : (L >= 50 ? 1 : 0), lvGap: typ ? 1 : 2, gearLv: typ ? L : L - 6, gearQ: typ ? (L < 15 ? 1 : L < 35 ? 2 : 3) : (L < 25 ? 0 : L < 45 ? 1 : 2), plus: Math.floor(L / (typ ? 5 : 9)), sk: Math.min(9, 1 + Math.floor(L / (typ ? 6 : 10))), codex: Math.min(60, Math.floor(3 + L * (typ ? 0.8 : 0.4))), py: Math.floor(L * (typ ? 0.6 : 0.25)) };
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
function playerTeam(kind, L, seed) {
  G.newGame('模擬', '力耐', 'm', seed || 1);
  var s = M.S.state, p = profile(kind, L), lead = G.lead(), rng = U.rng(L * 31 + (kind === 'typ' ? 1 : kind === 'max' ? 3 : 2));
  lead.lv = L; lead.sk = { a: p.sk, u: p.sk, p: p.sk }; gear(lead, L, p, 'p'); lead.py = { str: p.py, int: 0, agi: 0, con: p.py };
  if (kind === 'max') { lead.star = 5; lead.py = { str: p.py, int: p.py, agi: p.py, con: p.py }; s.player.leadQ = L < 20 ? 2 : L < 60 ? 3 : 4; }
  var slots = R.teamSlots(L), pool = HEROES.slice(), picks = [];
  function pick(q) { var c2 = U.filter(pool, function (h) { return h.quality === q && picks.indexOf(h) < 0; }); return c2[Math.floor(rng() * c2.length)]; }
  for (var k = 0; k < p.top && picks.length < slots - 1; k++) picks.push(pick(4) || pick(3));
  while (picks.length < slots - 1) picks.push(pick(p.hq) || pick(p.hq - 1));
  s.team.cells = {};
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

console.log('[事件表：四種事件，數值與持續回合]');
ok(B.EVENTS.length === 4, '四種事件（' + B.EVENTS.map(function (e) { return e.name; }).join('、') + '）');
var evById = {};
U.each(B.EVENTS, function (e) { evById[e.id] = e; });
ok(evById.fog && evById.fog.hit === -10 && evById.fog.rounds === 3, '濃霧：命中 −10，第 1–3 回合');
ok(evById.rock && evById.rock.pct === 0.15 && !evById.rock.rounds, '落石：每回合隨機一格受傷，最大生命 15%（無回合上限）');
ok(evById.drum && evById.drum.atkPct === 0.10 && evById.drum.rounds === 3, '戰鼓：攻擊 +10%，第 1–3 回合');
ok(evById.night && evById.night.dodge === 5 && !evById.night.rounds, '夜戰：閃避 +5，全場');
ok(B.eventById('fog') === evById.fog && B.eventById('不存在') === null, 'eventById 查表／未知 id 回 null');
ok(U.map(B.EVENTS, function (e) { return e.id; }).join() === 'fog,rock,drum,night', '事件順序固定（抽取結果可重現）');

console.log('[事件抽取：種子一致性、四種都出現]');
ok(B.pickEvent(1) === B.pickEvent(1) && B.pickEvent(4242) === B.pickEvent(4242), '同一種子同一事件（可重現）');
var seen = {};
for (var sd = 1; sd <= 200; sd++) seen[B.pickEvent(sd)] = 1;
ok(U.keys(seen).length === 4, '200 顆種子四種事件都出現（' + U.keys(seen).join('、') + '）');
var counts = { fog: 0, rock: 0, drum: 0, night: 0 };
for (sd = 1; sd <= 2000; sd++) counts[B.pickEvent(sd)]++;
ok(U.keys(counts).every(function (k) { return counts[k] >= 400 && counts[k] <= 600; }), '2000 次抽取四種大致均分（' + U.keys(counts).map(function (k) { return k + ' ' + counts[k]; }).join('／') + '，目標各 25%）');
ok(G.eventFor(12345) === G.eventFor(12345), 'G.eventFor 同一種子同一事件');

console.log('[事件進戰鬥：開場事件、落石、戰鼓、濃霧／夜戰命中]');
G.newGame('測試', '力耐', 'm', 7);
G.lead().lv = 25;
var sg11 = M.D.stageIndex['s1_1'];
var team0 = G.buildTeam(), foes0 = G.buildEnemy(sg11);
function runEv(evId, seed, rounds) {
  var team = JSON.parse(JSON.stringify(team0)), foes = JSON.parse(JSON.stringify(foes0));
  return B.run(team, foes, { seed: seed, maxRounds: rounds || 36, levelSuppression: D.config.levelSuppression, event: evId });
}
U.each(['fog', 'rock', 'drum', 'night'], function (id) {
  var r = runEv(id, 11);
  var evs = U.filter(r.events, function (e) { return e.t === 'event'; });
  ok(evs.length === 1 && evs[0].id === id && evs[0].name === evById[id].name && evs[0].desc === evById[id].desc, '開場有且只有一個「' + evById[id].name + '」事件（id／名稱／效果正確）');
});
var rNoEv = runEv(null, 11);
ok(U.filter(rNoEv.events, function (e) { return e.t === 'event'; }).length === 0, '不帶事件時沒有開場事件（舊戰報／塔／無極不受影響）');
// 落石：每回合一個 rock 事件，傷害＝該單位最大生命 15%（至少 1），雙方都可能中招
var rockEv = runEv('rock', 11);
var startEv = U.find(rockEv.events, function (e) { return e.t === 'start'; });
var maxHpByKey = {};
U.each(startEv.units, function (u) { maxHpByKey[u.key] = u.maxHp; });
var rocks = U.filter(rockEv.events, function (e) { return e.t === 'rock'; });
ok(rocks.length >= 1 && rocks.length <= 36, '落石每回合最多一個 rock 事件（共 ' + rocks.length + ' 個）');
ok(rocks.every(function (e) { return e.dmg === Math.max(1, Math.floor(maxHpByKey[e.to] * 0.15)) && e.hp >= 0; }), '每次落石傷害＝該單位最大生命 15%（至少 1），扣血後 hp 正確');
var rockSides = { A: 0, B: 0 };
for (sd = 1; sd <= 40; sd++) {
  var rr = runEv('rock', sd);
  U.each(U.filter(rr.events, function (e) { return e.t === 'rock'; }), function (e) {
    var st2 = U.find(rr.events, function (x) { return x.t === 'start'; });
    var side = U.find(st2.units, function (u) { return u.key === e.to; });
    // start 快照沒有 side，用 key 的前綴判斷（A 隊 key 以 A 開頭，B 隊以 B 開頭）
    rockSides[String(e.to).charAt(0)] = (rockSides[String(e.to).charAt(0)] || 0) + 1;
  });
}
ok((rockSides.A || 0) > 0 && (rockSides.B || 0) > 0, '落石雙方都可能中招（40 場：我方 ' + (rockSides.A || 0) + ' 次／敵方 ' + (rockSides.B || 0) + ' 次）');
// 戰鼓：同一種子，戰鼓第一擊傷害 > 無事件第一擊傷害（攻擊 +10%，命中不變故同一亂數序列）
function firstHit(r) { return U.find(r.events, function (e) { return e.t === 'hit' && !e.miss; }); }
var drumSeed = 0, baseFirst = null, drumFirst = null;
for (sd = 1; sd <= 20; sd++) {
  var b0 = runEv(null, sd), d0 = runEv('drum', sd);
  var hb = firstHit(b0), hd = firstHit(d0);
  if (hb && hd) { drumSeed = sd; baseFirst = hb; drumFirst = hd; break; }
}
ok(drumSeed > 0 && drumFirst.dmg > baseFirst.dmg, '戰鼓第一擊傷害提升（種子 ' + drumSeed + '：' + baseFirst.dmg + ' → ' + drumFirst.dmg + '，攻擊 +10%）');
// 濃霧／夜戰：固定種子集，前 3 回合（濃霧）／全場（夜戰）未命中數高於無事件
function missCounts(evId, seeds) {
  var miss = 0, total = 0, round = 0;
  U.each(seeds, function (s) {
    var r = runEv(evId, s, 36);
    round = 0;
    U.each(r.events, function (e) {
      if (e.t === 'round') round = e.n;
      if (e.t === 'hit' && (evId !== 'fog' || round <= 3)) { total++; if (e.miss) miss++; }
    });
  });
  return { miss: miss, total: total };
}
var seeds60 = [];
for (sd = 1; sd <= 60; sd++) seeds60.push(sd);
var mcBase = missCounts(null, seeds60), mcFog = missCounts('fog', seeds60), mcNight = missCounts('night', seeds60);
ok(mcFog.miss > mcBase.miss, '濃霧前 3 回合未命中更多（60 場：無事件 ' + mcBase.miss + '/' + mcBase.total + ' → 濃霧 ' + mcFog.miss + '/' + mcFog.total + '，命中 −10）');
ok(mcNight.miss > mcBase.miss, '夜戰全場未命中更多（60 場：無事件 ' + mcBase.miss + ' → 夜戰 ' + mcNight.miss + '，閃避 +5）');
// 事件不改變戰鬥種子決定性：同一種子同一事件重跑事件完全相同
var rA = runEv('rock', 77), rB = runEv('rock', 77);
ok(JSON.stringify(rA.events) === JSON.stringify(rB.events), '同一種子同一事件重跑事件完全相同（戰報重播一致）');

console.log('[關卡面板與 G.fight：事件與種子一致]');
var evPanel = G.stageEvent('s1_8');
ok(evPanel && evPanel.id === G.eventFor(G.ensureSeed('s1_8')), '關卡面板事件＝同一顆待用種子派生的事件（顯示與實戰一致）');
var fightEv = G.fight('s1_1', 999);
ok(fightEv.ok && fightEv.event === G.eventFor(999), 'G.fight 的事件＝戰鬥種子派生（' + fightEv.event + '）');
ok(fightEv.battle.events.some(function (e) { return e.t === 'event' && e.id === fightEv.event; }), '實戰事件列表有開場事件');

console.log('[頂尖隊伍生成：等級＝玩家等級、練度拉滿]');
G.lead().lv = 40;
var top40 = G.arenaTopFoe(1, 40);
ok(top40.top === true && top40.lv === 40 && top40.count === R.teamSlots(40), '頂尖隊伍 Lv40、' + top40.count + ' 人（上陣人數拉滿）');
ok(top40.title === '天下無雙' && top40.name.length > 0, '頂尖隊伍稱號「天下無雙」');
var topLead = G.arenaTopFoe(1);
ok(topLead.lv === G.lead().lv, '不傳等級時，頂尖隊伍等級＝主角等級（' + topLead.lv + '）');
G.lead().lv = 25;
var top25 = G.arenaTopFoe(1, 25);
ok(top25.lv === 25, '主角 25 級時頂尖隊伍 Lv25（動態跟隨）');
var topHeroes = U.map(top25.foes, function (f) { return f.unit; });
ok(topHeroes.every(function (u) { return u.quality === 4; }), '全部武將最高品質（品質 4）');
// 練度：裝備／技能／將星／培養／心法／寶石／洗鍊（原始武將物件在 top25.heroes）
var h0 = top25.heroes[0];
ok(h0.star === 5, '將星 5 星（全屬性 +30%）');
ok(h0.sk.a === 10 && h0.sk.u === 10 && h0.sk.p === 10, '技能升滿（sk＝min(10, 等級)＝10，9 級＋突破·神）');
ok(h0.py.str === R.peiyangCap({ lv: 25 }) && h0.py.int === R.peiyangCap({ lv: 25 }) && h0.py.agi === R.peiyangCap({ lv: 25 }) && h0.py.con === R.peiyangCap({ lv: 25 }), '培養拉滿（四維全滿＝培養上限 ' + R.peiyangCap({ lv: 25 }) + '）');
ok(U.keys(h0.eq || {}).length === 8, '8 件裝備齊全（' + U.keys(h0.eq || {}).join('、') + '）');
var eqOk = true, eqMsg = '';
U.each(R.SLOTS, function (slot) {
  var e = h0.eq[slot];
  if (!e) { eqOk = false; return; }
  var tpl = R.equipTpl(e.t);
  if (e.q !== 3) { eqOk = false; eqMsg = slot + ' 品質不是紫 q3'; }
  if (e.plus !== 25) { eqOk = false; eqMsg = slot + ' 強化不是 25'; }
  if (tpl.lv > 25) { eqOk = false; eqMsg = slot + ' 裝備等級超過 25'; }
  if (!Array.isArray(e.gems) || e.gems.length !== 3) { eqOk = false; eqMsg = slot + ' 寶石不是 3 顆'; }
  if (e.gems.indexOf('gem_atk_5') < 0 || e.gems.indexOf('gem_hp_6') < 0 || e.gems.indexOf('gem_pdef_6') < 0) { eqOk = false; eqMsg = slot + ' 寶石不是攻擊 Lv5／生命 Lv6／物防 Lv6'; }
  if (!Array.isArray(e.aff) || e.aff.length !== 3) { eqOk = false; eqMsg = slot + ' 洗鍊不是 3 條'; }
});
ok(eqOk, '裝備：當級最好＋最高品質（紫 q3）＋強化拉滿（plus＝等級）＋3 孔寶石＋3 條洗鍊' + (eqMsg ? '（' + eqMsg + '）' : ''));
ok(h0.xf.length === 1 && h0.xf[0].lv === 100, 'Lv25 心法 1 槽：主攻心法 Lv100（' + h0.xf[0].id + '）');
var top70 = G.arenaTopFoe(1, 70);
ok(top70.heroes[0].xf.length === 2 && top70.heroes[0].xf[1].id === 'jiuyin' && top70.heroes[0].xf[1].lv === 100, 'Lv70 心法 2 槽：主攻心法 Lv100＋九陰真經 Lv100');
ok(JSON.stringify(G.arenaTopFoe(1, 25)) === JSON.stringify(G.arenaTopFoe(1, 25)), '同一種子同一等級組合相同（可重現）');
ok(JSON.stringify(G.arenaTopFoe(1, 25).foes) !== JSON.stringify(G.arenaTopFoe(2, 25).foes), '不同種子組合不同（頂尖中的武將隨機調整）');
ok(top25.power > G.arenaFoe(25).power * 2, '頂尖隊伍戰力遠高於同級名次隊伍（' + U.fmt(top25.power) + ' vs ' + U.fmt(G.arenaFoe(25).power) + '）');
// 寶石不納入暴擊寶石（D 級退化值）；攻擊寶石用 Lv5 不用 Lv6（Lv6 是倒退值）
var allGems = [];
U.each(top25.heroes, function (h) { U.each(R.SLOTS, function (slot) { U.each((h.eq[slot] || {}).gems || [], function (g) { allGems.push(g); }); }); });
ok(allGems.indexOf('gem_crit_6') < 0 && allGems.indexOf('gem_atk_6') < 0, '不納入暴擊寶石 Lv6 與攻擊寶石 Lv6（D 級退化值）');
ok(allGems.every(function (g) { return g === 'gem_atk_5' || g === 'gem_hp_6' || g === 'gem_pdef_6'; }), '寶石只用攻擊 Lv5／生命 Lv6／物防 Lv6（每孔不同種類）');

console.log('[名次隊伍 25% 刷頂尖：機率、等級、顯示、獎勵]');
ok(G.ARENA_TOP_CHANCE === 0.25 && G.ARENA_TOP_LV_MIN === 1 && G.ARENA_TOP_LV_MAX === 99, '刷頂尖機率 25%、等級 1–99');
var allNormal = true;
for (var rk = 1; rk <= 30; rk++) if (G.arenaTopRoll(rk, 2809).top) allNormal = false;
ok(allNormal, '初始列表種子 2809：第 1–30 名全部不刷頂尖（新存檔第一份列表與舊版一致）');
var f30old = G.arenaFoe(30), f30new = G.arenaListFoe(30, 2809);
ok(f30new.top === false && f30new.lv === f30old.lv && f30new.power === f30old.power && JSON.stringify(f30new.foes) === JSON.stringify(f30old.foes), '初始種子下名次隊伍與舊版完全相同（只多 top: false）');
ok(G.arenaFoe(30).top === undefined, 'arenaFoe 本身不動（武林大會／平衡量測不受影響）');
var rate = { top: 0, n: 0 }, lvMin = 99, lvMax = 1;
for (sd = 1; sd <= 2000; sd++) for (rk = 1; rk <= 30; rk++) {
  var roll = G.arenaTopRoll(rk, sd);
  rate.n++;
  if (roll.top) { rate.top++; if (roll.lv < lvMin) lvMin = roll.lv; if (roll.lv > lvMax) lvMax = roll.lv; }
}
ok(rate.top / rate.n > 0.20 && rate.top / rate.n < 0.30, '2000 顆種子 × 30 名次刷出率接近 25%（' + (rate.top / rate.n * 100).toFixed(1) + '%，' + rate.top + '/' + rate.n + '）');
ok(lvMin === 1 && lvMax === 99, '頂尖等級覆蓋 1–99（最小 ' + lvMin + '／最大 ' + lvMax + '）');
// 找一顆讓第 30 名刷成頂尖的種子，驗證顯示與獎勵
var topSeed30 = 0, topLv30 = 0;
for (sd = 1; sd <= 5000; sd++) { var r30 = G.arenaTopRoll(30, sd); if (r30.top) { topSeed30 = sd; topLv30 = r30.lv; break; } }
ok(topSeed30 > 0, '找得到讓第 30 名刷成頂尖的列表種子（' + topSeed30 + '，Lv' + topLv30 + '）');
var foeTop30 = G.arenaListFoe(30, topSeed30);
ok(foeTop30.top === true && foeTop30.rank === 30 && foeTop30.lv === topLv30 && foeTop30.lv >= 1 && foeTop30.lv <= 99, '刷成頂尖時名次位置維持第 30 名，等級為實際等級（Lv' + foeTop30.lv + '）');
ok(foeTop30.foes.every(function (f) { return f.unit.quality === 4; }), '名次頂尖隊伍同樣最高品質、練度拉滿');
ok(G.arenaTopReward(25, 99).silver === G.arenaWinReward(25).silver + 990, '頂尖獎勵＝該名次一般獎勵＋等級×10（第 25 名 Lv99：660＋990＝1650）');
ok(G.arenaRewardFor(foeTop30).silver === G.arenaTopReward(30, topLv30).silver, 'arenaRewardFor 對頂尖隊伍用頂尖獎勵公式');
ok(G.arenaRewardFor(G.arenaFoe(30)).silver === G.arenaWinReward(30).silver, 'arenaRewardFor 對一般隊伍用原獎勵公式（360）');

console.log('[頂尖隊伍規則：挑戰、排名、戰報、種子重抽]');
// 一般隊 Lv80（balance.js 同模型）：打同級頂尖隊伍必敗（量測 0%），打 Lv1 頂尖隊伍必勝
playerTeam('typ', 80);
var S2 = M.S;
// 敗場：Lv80 玩家打 Lv80 固定第六組頂尖隊伍必敗（量測 0%），排名不變、戰報標頂尖
var rTopLose = G.arenaTopFight(123);
ok(rTopLose.ok && !rTopLose.win && rTopLose.top === true, '固定第六組：一般隊 Lv80 打同級頂尖隊伍落敗（預期，量測 0%）');
ok(S2.state.arena.rank === 31 && S2.state.arena.recs[0].top === true && S2.state.arena.recs[0].target === 0, '固定第六組戰敗：排名不變（未上榜），戰報標頂尖（target 0）');
var rpTop = G.arenaReplay(0);
ok(rpTop.ok && rpTop.consistent && rpTop.rec.top === true, '固定第六組戰報重播一致');
// 找一顆讓第 30 名刷成 Lv1 頂尖的種子：一般隊 Lv80 打得贏，驗證勝場規則
var winSeed = 0;
for (sd = 1; sd <= 20000; sd++) { var rw = G.arenaTopRoll(30, sd); if (rw.top && rw.lv === 1) { winSeed = sd; break; } }
ok(winSeed > 0, '找得到讓第 30 名刷成 Lv1 頂尖的列表種子（' + winSeed + '）');
var silverBefore = S2.state.player.silver;
var listStoredBefore = S2.state.arena.listSeed, topStoredBefore = S2.state.arena.topSeed;
var rTopWin = G.arenaFight(30, 456, winSeed);
ok(rTopWin.ok && rTopWin.win && rTopWin.top === true, '名次頂尖隊伍：一般隊 Lv80 打贏 Lv1 頂尖隊伍');
ok(S2.state.arena.rank === 31, '打贏名次頂尖隊伍：排名不變（不是名次對手）');
ok(S2.state.player.silver === silverBefore + G.arenaTopReward(30, 1).silver, '打贏名次頂尖隊伍：銀幣＝該名次一般獎勵＋等級×10（360＋10＝370，不動排名故無首次排名金幣）');
ok(S2.state.arena.recs[0].top === true && S2.state.arena.recs[0].target === 30, '名次頂尖隊伍戰報標頂尖（target 仍為名次 30）');
// 勝場後種子重抽：列表種子與頂尖組合種子都變了
ok(S2.state.arena.listSeed !== listStoredBefore, '勝場後列表種子重抽（打贏的頂尖隊伍不會留在列表上被重複刷）');
ok(S2.state.arena.topSeed !== topStoredBefore, '勝場後固定第六組組合種子重抽');
// 敗場不重抽：打一場必敗的頂尖隊伍（Lv>=90），種子不變
var listBefore = S2.state.arena.listSeed, topBefore = S2.state.arena.topSeed;
var loseSeed = 0;
for (sd = 1; sd <= 5000; sd++) { var rl = G.arenaTopRoll(G.arenaList()[0], sd); if (rl.top && rl.lv >= 90) { loseSeed = sd; break; } }
if (loseSeed) {
  var rLose = G.arenaFight(G.arenaList()[0], 789, loseSeed);
  ok(!rLose.win && S2.state.arena.listSeed === listBefore && S2.state.arena.topSeed === topBefore, '敗場不重抽種子（可重試同一支頂尖隊伍）');
} else ok(true, '（跳過敗場種子檢查：5000 顆種子內無 Lv>=90 頂尖）');

console.log('[存檔相容：v12 不變、舊存檔補欄位、匯出匯入]');
ok(M.S.VERSION === 12, '存檔版本仍為 v12');
ok(S2.state.arena.topSeed != null && S2.state.arena.listSeed != null, '新存檔有頂尖隊伍種子欄位（topSeed／listSeed，加法性）');
var old = JSON.parse(JSON.stringify(S2.state)); delete old.arena; old.version = 3;
var m = S2.migrate(old);
ok(m.arena && m.arena.topSeed === G.ARENA_TOP_SEED0 && m.arena.listSeed === G.ARENA_LIST_SEED0 && m.version === S2.VERSION, '舊存檔（v3）自動補上頂尖隊伍種子欄位（初始值）');
var txt = S2.exportText(), r2 = S2.parse(txt);
ok(r2.ok && r2.state.arena.topSeed === S2.state.arena.topSeed && r2.state.arena.listSeed === S2.state.arena.listSeed && r2.state.arena.recs.length === S2.state.arena.recs.length, '頂尖隊伍種子與戰報存進存檔並可匯入');

console.log('[考證：WL-9 新增 3 條 D 級]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
ok(prov.entries.length === 301, 'provenance 共 301 條（298＋3，WL-9 加 mode.randomEvents、arena.topTeam、arena.rankTop）');
ok(prov.entries.filter(function (e) { return e.grade === 'D'; }).length === 135, 'D 級共 135 條（132＋3）');
U.each(['mode.randomEvents', 'arena.topTeam', 'arena.rankTop'], function (id) {
  var e = U.find(prov.entries, function (x) { return x.id === id; });
  ok(!!e && e.grade === 'D' && e.tentative === true && e.phase === 'WL-9' && e.label.indexOf('原版') < 0, '考證條目 ' + id + '（D 級、暫定、WL-9、不標原版）');
});

console.log('\n結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
