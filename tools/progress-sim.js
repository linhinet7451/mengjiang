// 第五階段：長期進度模擬（假時鐘＋自動玩家），找出「卡關牆」與升級節奏
// P2 起精力取消：每次上線改用「戰鬥場數預算」（預設 25 場，--battles）代表遊玩時間
// node tools/progress-sim.js [--days 30] [--econ standard|fast] [--sessions 4] [--json 檔名]
// 自動玩家只用遊戲本身的 G.* 介面（與玩家在 UI 上能做的事相同），不改任何數值。
var load = require('../tests/harness.js'), fs = require('fs');
function arg(k, d) { var i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; }

function simulate(opt) {
  var c = load(), M = c.MJ, G = M.G, U = M.U, R = M.R, D = M.D;
  var T = new Date(2026, 0, 5, 8, 0, 0).getTime();
  U.now = function () { return T; };
  if (opt.expk != null) R.EXP_K = opt.expk;
  G.newGame('模擬', opt.lead || '力耐', 'm', opt.seed || 1);
  if (opt.econ === 'fast' && G.setEcon) G.setEcon('fast');
  var s = M.S.state, stages = D.stages.stages, rngSeed = 1000;
  var log = [], dayStats = [], lastProgressDay = 0, maxStuck = 0, stuckAt = null, losses = 0, timeouts = 0, wins = 0, curStuck = 0;
  function cleared(id) { return s.stages[id] && s.stages[id].clears > 0; }
  function nextTarget() { for (var i = 0; i < stages.length; i++) { var x = stages[i]; if (!cleared(x.id) && G.stageUnlocked(x.id)) return x; } return null; }
  function grindTarget() { // 已通關中「經驗/精力」最好的關卡
    var best = null; stages.forEach(function (x) { if (cleared(x.id) && G.stageUnlocked(x.id) && (!best || x.exp > best.exp)) best = x; }); return best;
  }
  function tryAll(fn, ids) { ids.forEach(function (id) { try { fn(id); } catch (e) { } }); }
  function manage() {
    // 招募：普通刷新，挑最高品質買得起的
    try {
      G.refresh('normal');
      var cands = (s.recruit.cands || []).slice().sort(function (a, b) { return R.heroDef(b).quality - R.heroDef(a).quality; });
      cands.forEach(function (id) { if (s.player.silver > G.recruitCost(id) * 2) { var r = G.recruit(id); if (r.ok) G.addToTeam(r.hero.uid); } });
    } catch (e) { }
    // 上陣：空位補上等級最高的閒置武將
    s.heroes.slice().sort(function (a, b) { return b.lv - a.lv; }).forEach(function (h) { if (G.inTeam(h.uid) == null) G.addToTeam(h.uid); });
    G.teamList().forEach(function (x) {
      G.autoEquip(x.hero.uid);
      ['a', 'u', 'p'].forEach(function (w) { for (var k = 0; k < 3; k++) if (!G.skillUp(x.hero.uid, w).ok) break; });
    });
    // 包裹快滿就賣低品質裝備
    if (G.bagUsed() > 45) s.bag.equips.slice().sort(function (a, b) { return (a.q || 0) - (b.q || 0); }).slice(0, 15).forEach(function (e) { G.sellEquip(e.uid); });
    // 訓練：讓主角掛機
    if (G.trainNow) G.trainNow(G.lead().uid);
    // 每日／成就／簽到
    try { G.sign(); } catch (e) { }
    tryAll(G.claimDaily, (G.DAILY || []).map(function (x) { return x.id; }));
    tryAll(G.claimDailyChest, (G.DAILY_CHEST || []).map(function (x) { return x.id; }));
    tryAll(G.claimAch, (G.ACH || []).map(function (x) { return x.id; }));
    try { G.claimFreeGift(); } catch (e) { }
    try { G.harvestAll(U.rng(rngSeed++)); for (var i = 0; i < G.farmPlots(); i++) G.plant(i, i % 2 ? 'seed_exp' : 'seed_yin'); } catch (e) { }
    // 升級建築：由便宜到貴，保留一點銀幣給招募
    if (!opt.noBuild) for (var loop = 0; loop < 40; loop++) {
      var ks = ['juxian', 'shenbing', 'shenwu', 'farm', 'wuji', 'tongtian', 'jiangxing'].filter(function (k) { return D.config.buildings[k]; });
      ks.sort(function (a, b) { return G.buildingCost(a, s.buildings[a] || 1) - G.buildingCost(b, s.buildings[b] || 1); });
      var up = false;
      for (var bi = 0; bi < ks.length; bi++) { var k = ks[bi]; if (s.player.silver > G.buildingCost(k, s.buildings[k] || 1) * 1.5 && G.upgradeBuilding(k).ok) { up = true; break; } }
      if (!up) break;
    }
    // 強化出戰武將的裝備（銀幣夠才強化）
    if (!opt.noBuild && G.enhance) G.teamList().forEach(function (x) {
      var eq = x.hero.eq || {};
      Object.keys(eq).forEach(function (slot) { var e = eq[slot]; if (!e) return; for (var n = 0; n < 6; n++) { if (s.player.silver < R.enhanceCost(e) * 3) break; var r = G.enhance(e.uid, U.rng(rngSeed++)); if (!r.ok) break; } });
    });
    // 用掉經驗類道具
    ['tufeiling'].forEach(function (k) { while (s.bag.items && s.bag.items[k] > 0) { if (!G.useItem(k, G.lead().uid).ok) break; } });
  }
  function session(day) {
    G.tick(); manage();
    var guard = 0, progressed = false, budget = opt.battles || 25;
    while (guard++ < budget) {
      var tg = nextTarget(), use = tg;
      if (tg) {
        var r = G.fight(tg.id, rngSeed++);
        if (!r.ok) break;
        if (r.win) { wins++; progressed = true; continue; }
        losses++; if (r.battle && r.battle.timeout) timeouts++;
      }
      // 打不過或沒有新關：重打最佳關卡累積經驗
      var gt = grindTarget();
      if (!gt) break;
      var r2 = G.fight(gt.id, rngSeed++); if (!r2.ok) break;
      manage();
    }
    // 通天塔、幻境（每次上線各打幾場）
    if (G.lead().lv >= D.config.buildings.tongtian.open) for (var t = 0; t < 10; t++) { var tr = G.towerFight(rngSeed++); if (!tr.ok || !tr.win) break; }
    (G.WUJI || []).forEach(function (w) { for (var wn = 0; wn < 2 && G.lead().lv >= w.open; wn++) { if (!G.wujiRun(w.id, rngSeed++).ok) break; } });
    manage();
    return progressed;
  }
  var hours = [8, 12, 19, 23].slice(0, opt.sessions || 4);
  for (var d = 1; d <= opt.days; d++) {
    var dayProg = false;
    hours.forEach(function (h) { T = new Date(2026, 0, 4 + d, h, 0, 0).getTime(); if (session(d)) dayProg = true; });
    var nt = nextTarget(), done = stages.filter(function (x) { return cleared(x.id); }).length;
    if (dayProg || !nt) curStuck = 0; else curStuck++;
    if (curStuck > maxStuck) { maxStuck = curStuck; stuckAt = nt ? nt.id + '（' + nt.name + '，推薦 Lv' + nt.lv + '）' : null; }
    dayStats.push({ day: d, lv: G.lead().lv, cleared: done, next: nt ? nt.id : (done >= stages.length ? '全破' : '等級鎖'), tower: s.tower ? s.tower.best : 0, heroes: s.heroes.length, team: G.teamCount(), silver: s.player.silver, gold: s.player.gold, stuck: curStuck });
  }
  return { econ: opt.econ, total: stages.length, days: dayStats, maxStuck: maxStuck, stuckAt: stuckAt, wins: wins, losses: losses, timeouts: timeouts };
}

module.exports = simulate;
if (require.main === module) {
var days = +arg('days', 30), out = [];
['standard', 'fast'].forEach(function (econ) {
  var r = simulate({ days: econ === 'fast' ? Math.min(days, 14) : days, econ: econ, sessions: +arg('sessions', 4), battles: +arg('battles', 25), expk: arg('expk', null) == null ? null : +arg('expk') });
  out.push(r);
  console.log('\n== 經濟模式：' + (econ === 'fast' ? '單機加速' : '標準') + '（每天 ' + (+arg('sessions', 4)) + ' 次上線）==');
  console.log('天數  主角等級  通關數/' + r.total + '  下一關     通天塔  武將  出戰  銀幣');
  r.days.forEach(function (x) { if (x.day <= 7 || x.day % 5 === 0 || x.day === r.days.length) console.log(('第' + x.day + '天').padEnd(6) + String(x.lv).padStart(6) + String(x.cleared).padStart(10) + '   ' + String(x.next).padEnd(9) + String(x.tower).padStart(6) + String(x.heroes).padStart(6) + String(x.team).padStart(6) + String(x.silver).padStart(9)); });
  console.log('最長連續卡關：' + r.maxStuck + ' 天' + (r.stuckAt ? '（' + r.stuckAt + '）' : '') + '；勝 ' + r.wins + ' 敗 ' + r.losses + '（其中超時 ' + r.timeouts + '）');
  console.log(r.maxStuck >= 3 ? '⚠ 可能有硬牆（連續 3 天以上沒有新進度）' : '沒有硬牆（沒有連續 3 天以上卡關）');
});
var jf = arg('json', null); if (jf) fs.writeFileSync(jf, JSON.stringify(out, null, 1));
}
