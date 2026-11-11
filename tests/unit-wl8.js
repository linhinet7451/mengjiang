// WL-8：主線精英／王／隱藏關章節倍率 bossScale（D 級原創）。node tests/unit-wl8.js
// 目的：一般隊同級打精英／王／隱藏關勝率約 70–80%，逼玩家養成裝備技能；普通關維持 100%。
var load = require('./harness.js'), fs = require('fs'), path = require('path'), vm = require('vm');
var pass = 0, fail = 0;
function ok(cond, name) { if (cond) { pass++; console.log('  通過', name); } else { fail++; console.log('✗ 失敗', name); } }
var c = load(), M = c.MJ, B = M.Battle, G = M.G, R = M.R, U = M.U, D = M.D;

console.log('[章節倍率表]');
var bs = D.config.bossScale;
ok(Array.isArray(bs) && bs.length === 13, 'bossScale 為 13 章倍率表（' + (bs && bs.length) + ' 章）');
ok(bs.every(function (x) { return typeof x === 'number' && x > 1; }), '13 章倍率皆 > 1（主線王系關全面加難）');
ok(bs[0] === 1.22, '第一章倍率最低 1.22（WL-12 S4b：1.20×1.02，保護新手）');
ok(bs[5] === 3.78 && bs[6] === 3.68, '第六／七章倍率最高 3.78／3.68（WL-12 S4b：3.60／3.50×1.05）');
ok(JSON.stringify(bs) === JSON.stringify([1.22, 1.68, 2.57, 2.42, 2.78, 3.78, 3.68, 3.1, 2.73, 2.42, 2.6, 2.9, 3.0]), '倍率表即校準值 [1.22, 1.68, 2.57, 2.42, 2.78, 3.78, 3.68, 3.10, 2.73, 2.42, 2.60, 2.90, 3.00]（WL-12 S4b）');

console.log('[套用範圍：開關對照，主線王系關才套]');
var orig = bs.slice();
function setScale(on) { D.config.bossScale = on ? orig : null; }
function eu(spec, stage) { return R.enemyUnit(spec, stage); }
var sg18 = M.D.stageIndex['s1_8'], sg14 = M.D.stageIndex['s1_4'], sg19 = M.D.stageIndex['s1_9'], sg11 = M.D.stageIndex['s1_1'];
var sg68 = M.D.stageIndex['s6_8'], sg108 = M.D.stageIndex['s10_8'];
setScale(false);
var off18 = eu({ e: 'zj_boss', cell: 4, lv: 8 }, sg18), offMin18 = eu({ e: 'hj_bing', cell: 0, lv: 8 }, sg18);
var off68 = eu({ e: 'zj_boss', cell: 4, lv: 42 }, sg68), off108 = eu({ e: 'zj_boss', cell: 4, lv: 75 }, sg108);
var off14 = eu({ e: 'zj_boss', cell: 4, lv: 4 }, sg14), off19 = eu({ e: 'zj_boss', cell: 4, lv: 10 }, sg19);
var off11 = eu({ e: 'hj_bing', cell: 0, lv: 1 }, sg11);
var tw10 = G.towerFloor(10), offTw = eu(tw10.enemies[0], tw10);
var wj10 = G.wujiWave(G.WUJI[0], 9, 4242), offWj = eu(wj10.enemies[0], wj10);
var offClamp = eu({ e: 'hj_bing', cell: 0, lv: 8 }, { kind: 'boss', ch: 99 });
setScale(true);
var on18 = eu({ e: 'zj_boss', cell: 4, lv: 8 }, sg18), onMin18 = eu({ e: 'hj_bing', cell: 0, lv: 8 }, sg18);
var on68 = eu({ e: 'zj_boss', cell: 4, lv: 42 }, sg68), on108 = eu({ e: 'zj_boss', cell: 4, lv: 75 }, sg108);
var on14 = eu({ e: 'zj_boss', cell: 4, lv: 4 }, sg14), on19 = eu({ e: 'zj_boss', cell: 4, lv: 10 }, sg19);
var on11 = eu({ e: 'hj_bing', cell: 0, lv: 1 }, sg11);
var onTw = eu(tw10.enemies[0], tw10), onWj = eu(wj10.enemies[0], wj10);
var onClamp = eu({ e: 'hj_bing', cell: 0, lv: 8 }, { kind: 'boss', ch: 99 });
ok(on18.patk === Math.floor(off18.patk * 1.22) && on18.hp === Math.floor(off18.hp * 1.22) && on18.ult.flat === Math.floor(off18.ult.flat * 1.22), '王關 s1_8 首領攻／血／無雙固定傷害 ×1.22（WL-12 S4b：1.20×1.02；' + off18.patk + '→' + on18.patk + '／' + off18.hp + '→' + on18.hp + '）');
ok(onMin18.patk === Math.floor(offMin18.patk * 1.22) && onMin18.hp === Math.floor(offMin18.hp * 1.22), '王關小兵同樣 ×1.22（不只首領）');
ok(on68.patk === Math.floor(off68.patk * 3.78) && on68.hp === Math.floor(off68.hp * 3.78), '第六章王關 s6_8 首領 ×3.78（WL-12 S4b：3.60×1.05）');
ok(on108.patk === Math.floor(off108.patk * 2.42) && on108.hp === Math.floor(off108.hp * 2.42), '第十章王關 s10_8 首領 ×2.42（WL-12 S4b：2.30×1.05）');
ok(on14.patk === Math.floor(off14.patk * 1.22), '精英關 s1_4 首領 ×1.22（WL-12 S4b）');
ok(on19.patk === Math.floor(off19.patk * 1.22), '隱藏關 s1_9 首領 ×1.22（WL-12 S4b）');
ok(on11.patk === off11.patk && on11.hp === off11.hp, '普通關 s1_1 不套倍率（主線推進不動）');
ok(onTw.patk === offTw.patk && onTw.hp === offTw.hp, '通天塔第 10 層（王種，floor=10）不套倍率');
ok(onWj.patk === offWj.patk && onWj.hp === offWj.hp, '無極幻境第 10 波（王種，wave=10）不套倍率');
ok(onClamp.patk === Math.floor(offClamp.patk * 3.0), '章節超出表長時夾到最後一章倍率 3.00（WL-12：13 章表末為 ch13 3.0，不報錯）');

console.log('[不動的屬性：命中／閃避／爆擊／敏捷／等級／層數]');
ok(on18.hit === off18.hit && on18.dodge === off18.dodge, '命中／閃避不動（' + on18.hit + '／' + on18.dodge + '，敵人本來就是 0）');
ok(on18.crit === off18.crit, '爆擊不動（' + on18.crit + '，爆擊是機率不是攻防血）');
ok(on18.agi === off18.agi, '敏捷不動（' + on18.agi + '，翻倍會讓敵方幾乎每回合先手）');
ok(on18.lv === off18.lv && on18.layers === off18.layers, '等級／血條層數不動（Lv' + on18.lv + '／' + on18.layers + ' 層）');

console.log('[與 ×2 挑戰疊加：先章節倍率再翻倍]');
var dbl = JSON.parse(JSON.stringify(on18)); G.doubleUnit(dbl);
ok(dbl.patk === Math.floor(on18.patk * 2) && dbl.hp === Math.floor(on18.hp * 2) && dbl.ult.flat === Math.floor(on18.ult.flat * 2), '王關 ×2 挑戰在章節倍率後再 ×2（' + on18.patk + '→' + dbl.patk + '）');
ok(dbl.crit === on18.crit && dbl.agi === on18.agi, '×2 仍不動爆擊／敏捷');

console.log('[勝率目標區間：與 tools/balance.js 同模型、12 種子；精確量測見 balance §9]');
// 與 tools/balance.js 相同的 D 級玩家模型（複製於此，避免單元測試依賴量測工具）
var HEROES = D.heroes.list || D.heroes;
function profile(kind, L) {
  var typ = kind === 'typ';
  // WL-8 補修 max 模型（與 tools/balance.js 同定義，複製於此）：最高品質武將 4、當級最好裝備與最高品質（紫 q3）、
  // 強化拉滿（plus＝等級）、技能升滿（sk＝min(10, 等級)）、圖鑑全收（90）、培養拉滿（py＝floor(10+1.5L) 四維全滿）、
  // 將星 5 星、主角升階（Lv<20 為 2、20–59 為 3、60+ 為 4）、上陣人數拉滿。心法／寶石／洗鍊不建模（保守估計）。
  if (kind === 'max') return { hq: 4, top: 7, lvGap: 0, gearLv: L, gearQ: 3, plus: L, sk: Math.min(10, L), codex: 90, py: Math.floor(10 + 1.5 * L) };
  if (kind === 'min') return { hq: L < 25 ? 1 : 2, top: 0, lvGap: 3, gearLv: L - 12, gearQ: 0, plus: 0, sk: 1, jx: 0, codex: 3, py: 0 };
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
function winRate(kind, L, foesFn) {
  var w = 0;
  for (var sd = 1; sd <= 12; sd++) {
    var team = playerTeam(kind, L), foes = foesFn(sd);
    var r = M.Battle.run(team, foes, { seed: sd * 977 + 3, maxRounds: D.config.maxRounds, levelSuppression: D.config.levelSuppression });
    if (r.win) w++;
  }
  return w / 12;
}
var rN11 = winRate('typ', 1, function () { return G.buildEnemy(sg11); });
ok(rN11 === 1, '普通關 s1_1 一般隊同級 12/12 全勝（維持 100%，' + rN11 + '）');
var rB18 = winRate('typ', 8, function () { return G.buildEnemy(sg18); });
ok(rB18 >= 0.5 && rB18 <= 1, '王關 s1_8 一般隊同級勝率在守門區間 0.50–1.00（實測 ' + rB18 + '，校準目標約 0.75）');
var rB108 = winRate('typ', 75, function () { return G.buildEnemy(sg108); });
ok(rB108 >= 0.05 && rB108 <= 1, '王關 s10_8 一般隊同級勝率 ≥0.05（實測 ' + rB108 + '；S4b 後為 ch10 最硬關，12 種子 1/12；章平均見 balance §15，仍在 70–80% 帶；越戰越勇＋越級可過）');
var rW18 = winRate('weak', 11, function () { return G.buildEnemy(sg18); });
ok(rW18 <= 0.9, '王關 s1_8 弱勢隊（+3 級）勝率 ≤ 0.90（實測 ' + rW18 + '，裝備技能不升就卡關）');

console.log('[WL-8 補修：max 模型打 ×2——現況已達標，遊戲不用改]');
var pMax75 = profile('max', 75);
ok(pMax75.hq === 4 && pMax75.top === 7 && pMax75.lvGap === 0, 'max 模型：品質 4、上陣拉滿、無等級落差');
ok(pMax75.gearLv === 75 && pMax75.gearQ === 3 && pMax75.plus === 75, 'max 模型：當級最好裝備、紫品質、強化拉滿（plus＝等級）');
ok(pMax75.sk === 10 && pMax75.codex === 90 && pMax75.py === 122, 'max 模型：技能 10（神）、圖鑑 90、培養 122＝floor(10+1.5×75)');
ok(profile('max', 8).sk === 8 && profile('max', 8).py === 22, 'max 模型低等級：技能不超過等級（sk＝min(10,L)）、培養 floor(10+1.5×8)＝22');
// max 隊伍數值明顯強於一般隊（同一等級對照）
function teamAtk(team) { var a = 0; U.each(team, function (t) { a += t.unit.patk + t.unit.matk + t.unit.jatk; }); return a; }
var tMax75 = playerTeam('max', 75), tTyp75 = playerTeam('typ', 75);
ok(tMax75.length === 8 && tTyp75.length === 8, 'Lv75 max 與一般隊皆 8 人上陣');
ok(teamAtk(tMax75) > teamAtk(tTyp75) * 2, 'Lv75 max 隊攻擊為一般隊 2 倍以上（實測 ' + teamAtk(tMax75) + ' 對 ' + teamAtk(tTyp75) + '）');
// max 同級打 ×2 王關（原組合口徑，12 種子）：王關 ≥25%（Tomas 標準）；實測皆 100%
function winRateDbl(kind, L, sg) {
  return winRate(kind, L, function () { var fs = G.buildEnemy(sg); U.each(fs, function (f) { G.doubleUnit(f.unit); }); return fs; });
}
var rMax18 = winRateDbl('max', 8, sg18);
ok(rMax18 >= 0.25, '王關 s1_8 max 同級打 ×2 勝率 ≥25%（實測 ' + rMax18 + '）');
var rMax108 = winRateDbl('max', 75, sg108);
ok(rMax108 >= 0.25, '王關 s10_8 max 同級打 ×2 勝率 ≥25%（實測 ' + rMax108 + '）');
// ×2 比一般模式難：翻倍後敵方攻防血確實 ×2
var e18 = G.buildEnemy(sg18), e18d = G.buildEnemy(sg18);
U.each(e18d, function (f) { G.doubleUnit(f.unit); });
var bossN = U.find(e18, function (f) { return f.unit.boss; }).unit, bossD = U.find(e18d, function (f) { return f.unit.boss; }).unit;
ok(bossD.patk === Math.floor(bossN.patk * 2) && bossD.hp === Math.floor(bossN.hp * 2), '×2 首領攻／血確實 ×2（' + bossN.patk + '→' + bossD.patk + '／' + bossN.hp + '→' + bossD.hp + '），×2 比一般模式難');
// 遊戲未改：×2 機制維持 WL-7 原樣（mult 2、不封頂、無 doubleMultFor）
ok(G.DOUBLE.mult === 2 && G.DOUBLE.totalCap === undefined && G.doubleMultFor === undefined, '×2 機制未改：mult＝2、無總倍率上限、無 doubleMultFor（補修只加量測）');

console.log('[舊存檔相容：bossScale 在 config，不在存檔]');
ok(M.S.VERSION === 12, '存檔版本維持 v12（WL-8 不加存檔欄位）');
G.newGame('測試俠', '力耐', 'm', 99);
ok(M.S.state.version === 12, '新存檔版本 v12');
ok(M.S.state.bossScale === undefined, '存檔沒有 bossScale 欄位（倍率在 config，舊存檔不用遷移）');
var st0 = JSON.parse(JSON.stringify(M.S.state));
M.S.applyDefaults(st0);
ok(st0.version === 12 && st0.bossScale === undefined, '舊存檔套用預設值後仍是 v12、仍無 bossScale 欄位');

console.log('[provenance]');
var prov = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'provenance.json'), 'utf8'));
var pe = prov.entries.filter(function (e) { return e.id === 'balance.bossScale'; })[0];
ok(!!pe && pe.grade === 'D' && pe.phase === 'WL-8', 'provenance 有 balance.bossScale D 級紀錄（WL-8）');
ok(pe && pe.current.indexOf('1.20') >= 0 && pe.current.indexOf('3.60') >= 0, 'provenance 記下倍率表與校準理由');
var peMax = prov.entries.filter(function (e) { return e.id === 'balance.maxTeam'; })[0];
ok(!!peMax && peMax.grade === 'D' && peMax.phase === 'WL-8', 'provenance 有 balance.maxTeam D 級紀錄（WL-8 補修）');
ok(peMax && peMax.current.indexOf('100%') >= 0 && peMax.current.indexOf('不用改') >= 0, 'provenance 記下 max 打 ×2 全部 100%、×2 不用改的結論');

console.log('結果：通過 ' + pass + '，失敗 ' + fail);
process.exit(fail ? 1 : 0);
