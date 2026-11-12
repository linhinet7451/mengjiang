/* 第三階段：通天塔、無極幻境（連續波次）、農田（種下立即成熟）、每日任務、成就、簽到、經濟模式
   所有數值皆為 D 級（自訂），功能存在與否的等級見 docs/資料考證.md */
(function (G) {
  var U = MJ.U, R = MJ.R;
  function C() { return MJ.D.config; }
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function have(k) { return st().bag.stack[k] || 0; }
  function take(k, n) { var s = st(); s.bag.stack[k] = (s.bag.stack[k] || 0) - n; if (s.bag.stack[k] <= 0) delete s.bag.stack[k]; }
  function now() { return U.now(); }
  function seedOf() { return ((now() ^ ((st().stats.battles + 7) * 2654435761)) >>> 0) || 1; }
  var GEMK = ['atk', 'hp', 'pdef', 'mdef', 'jdef', 'crit'];
  var XF = ['jinzhong', 'yijin', 'jiuyang', 'kuangfeng', 'beiming', 'kuihua', 'lingbo', 'xixing'];

  // ---------- 存檔欄位（舊存檔自動補齊） ----------
  function def(o, k, v) { if (o[k] == null) o[k] = v; return o[k]; }
  MJ.S.extraDefaults = MJ.S.extraDefaults || [];
  MJ.S.extraDefaults.push(function (s) {
    def(s, 'tower', { best: 0, sweepDay: '' });
    def(s.tower, 'best', 0); def(s.tower, 'sweepDay', '');
    def(s, 'wuji', { first: {}, clears: 0, best: 0 }); def(s.wuji, 'best', 0);
    def(s, 'farm', { plots: [] });
    def(s, 'daily', null);
    def(s, 'ach', {});
    def(s, 'sign', { month: '', days: [], total: 0, bonus: {} });
    if (s.settings) def(s.settings, 'econ', 'std');
  });

  // ---------- 經濟模式 ----------
  // 標準；單機加速：訓練 2 倍、戰鬥銀幣 1.5 倍（D）。P2 起精力與農田等待已取消
  G.ECON = {
    std: { id: 'std', name: '標準', energy: 'original', farm: 1, train: 1, reward: 1 },
    fast: { id: 'fast', name: '單機加速', energy: 'fast', farm: 1, train: 2, reward: 1.5 }
  };
  G.econ = function () { var s = st(); return G.ECON[s && s.settings && s.settings.econ === 'fast' ? 'fast' : 'std']; };
  G.setEcon = function (id) {
    var s = st(); if (!G.ECON[id]) return fail('未知模式');
    s.settings.econ = id; s.settings.energyMode = G.ECON[id].energy;
    G.commit(); return ok();
  };
  var oldTrainRate = G.trainRate;
  G.trainRate = function (h) { return Math.floor(oldTrainRate(h) * G.econ().train); };

  // ---------- 歷練任務（P2：原「每日任務」改成可重複的一輪一輪，不看日期；D） ----------
  G.daily = function () {
    var s = st();
    if (!s.daily) s.daily = { day: '', round: 1, c: {}, claimed: {}, chest: {}, act: 0, wuji: {} };
    if (s.daily.round == null) s.daily.round = 1;
    return s.daily;
  };
  // 還有完成但沒領的獎勵時不能換下一輪（避免白白損失）
  G.dailyPending = function () {
    var d = G.daily();
    return !!(U.find(G.DAILY, function (q) { return !d.claimed[q.id] && G.dailyProgress(q) >= q.n; }) || U.find(G.DAILY_CHEST, function (c) { return !d.chest[c.id] && d.act >= c.need; }));
  };
  G.dailyNewRound = function () {
    var d = G.daily();
    if (!U.keys(d.claimed).length) return fail('這一輪還沒有領取任何任務');
    if (G.dailyPending()) return fail('還有可以領取的獎勵，先領完再開始下一輪');
    var r = d.round + 1; st().daily = { day: '', round: r, c: {}, claimed: {}, chest: {}, act: 0, wuji: {} };
    G.commit(); return ok({ round: r });
  };
  G.bump = function (k, n) { var d = G.daily(); d.c[k] = (d.c[k] || 0) + (n || 1); G.count(k, n || 1); };
  function wrap(name, key, cond) {
    var f = G[name];
    G[name] = function () {
      var r = f.apply(G, arguments);
      if (r && r.ok && (!cond || cond(r))) { G.bump(key); G.commit(); }
      return r;
    };
  }
  wrap('fight', 'fight');
  wrap('fight', 'win', function (r) { return r.win; });
  wrap('refresh', 'refresh');
  wrap('recruit', 'recruitD');
  wrap('enhance', 'enhanceTry');
  wrap('skillUp', 'skillUpD');

  G.DAILY = [
    { id: 'd1', name: '小試身手', desc: '虛空之門挑戰 3 次', k: 'fight', n: 3, act: 20, reward: { silver: 1000 } },
    { id: 'd2', name: '連戰連勝', desc: '戰鬥勝利 5 次', k: 'win', n: 5, act: 20, reward: { items: [{ item: 'jinengshu', n: 1 }] } },
    { id: 'd3', name: '廣納賢才', desc: '聚賢莊刷新 2 次', k: 'refresh', n: 2, act: 10, reward: { silver: 800 } },
    { id: 'd4', name: '精益求精', desc: '神兵坊強化 3 次', k: 'enhanceTry', n: 3, act: 15, reward: { items: [{ item: 'xilianshi', n: 1 }] } },
    { id: 'd5', name: '勤耕不輟', desc: '農田收成 2 次', k: 'harvest', n: 2, act: 15, reward: { items: [{ item: 'huafei', n: 1 }] } },
    { id: 'd6', name: '登高望遠', desc: '挑戰通天塔 1 次', k: 'towerTry', n: 1, act: 10, reward: { items: [{ item: 'peiyangdan', n: 2 }] } },
    { id: 'd7', name: '幻境歷練', desc: '挑戰無極幻境 1 次', k: 'wujiTry', n: 1, act: 10, reward: { items: [{ item: 'xinfacanye', n: 1 }] } }
  ];
  G.DAILY_CHEST = [
    { id: 'c1', need: 30, reward: { silver: 2000 } },
    { id: 'c2', need: 60, reward: { gold: 10, items: [{ item: 'jinglitang', n: 1 }] } },
    { id: 'c3', need: 90, reward: { gold: 20, items: [{ item: 'tufeiling', n: 1 }] } }
  ];
  G.dailyProgress = function (q) { var d = G.daily(); return Math.min(q.n, d.c[q.k] || 0); };
  G.claimDaily = function (id) {
    var q = U.find(G.DAILY, function (x) { return x.id === id; }); if (!q) return fail('任務不存在');
    var d = G.daily();
    if (d.claimed[id]) return fail('這一輪已領取');
    if (G.dailyProgress(q) < q.n) return fail('任務尚未完成');
    d.claimed[id] = true; d.act += q.act;
    var got = G.grant(q.reward); got.push('活躍度 +' + q.act);
    G.commit(); return ok({ got: got });
  };
  G.claimDailyChest = function (id) {
    var c = U.find(G.DAILY_CHEST, function (x) { return x.id === id; }); if (!c) return fail('寶箱不存在');
    var d = G.daily();
    if (d.chest[id]) return fail('這一輪已領取');
    if (d.act < c.need) return fail('活躍度不足（需要 ' + c.need + '）');
    d.chest[id] = true; var got = G.grant(c.reward); G.commit(); return ok({ got: got });
  };

  // ---------- 成就（多階段，每階只能領一次） ----------
  G.ACH = [
    { id: 'a_win', name: '百戰百勝', desc: '戰鬥勝利', tiers: [10, 100, 500, 2000], val: function (s) { return s.stats.wins || 0; } },
    { id: 'a_rec', name: '招賢納士', desc: '招募武將', tiers: [5, 30, 100], val: function (s) { return s.stats.recruits || 0; } },
    { id: 'a_codex', name: '群英譜', desc: '圖鑑收錄武將', tiers: [10, 30, 60], val: function () { return G.codexCount(); } },
    { id: 'a_lv', name: '一代宗師', desc: '主角等級', tiers: [20, 40, 60, 80], val: function () { return G.lead().lv; } },
    { id: 'a_stars', name: '星羅棋布', desc: '虛空之門累計星數', tiers: [30, 108, 216], val: function (s) { var n = 0; U.each(U.keys(s.stages), function (k) { n += s.stages[k].stars || 0; }); return n; } },
    { id: 'a_tower', name: '凌雲之志', desc: '通天塔最高層', tiers: [10, 30, 60, 100, 150, 240], val: function (s) { return s.tower.best; } },
    { id: 'a_wuji', name: '幻境行者', desc: '無極幻境全波次通關', tiers: [1, 10, 50], val: function (s) { return s.wuji.clears; } },
    { id: 'a_farm', name: '春耕秋收', desc: '農田收成', tiers: [10, 50, 200], val: function (s) { return s.counters.harvest || 0; } },
    { id: 'a_enh', name: '千錘百鍊', desc: '強化成功', tiers: [10, 50, 200], val: function (s) { return s.counters.enhance || 0; } },
    { id: 'a_sign', name: '持之以恆', desc: '累計簽到天數', tiers: [7, 30, 100], val: function (s) { return s.sign.total; } }
  ];
  G.ACH_GOLD = [20, 50, 100, 200];
  G.achState = function (a) {
    var s = st(), got = s.ach[a.id] || 0, v = a.val(s);
    return { tier: got, done: got >= a.tiers.length, need: a.tiers[Math.min(got, a.tiers.length - 1)], val: v, can: got < a.tiers.length && v >= a.tiers[got], gold: G.ACH_GOLD[Math.min(got, 3)] };
  };
  G.claimAch = function (id) {
    var a = U.find(G.ACH, function (x) { return x.id === id; }); if (!a) return fail('成就不存在');
    var x = G.achState(a);
    if (x.done) return fail('已全部完成');
    if (!x.can) return fail('尚未達成（' + x.val + '/' + x.need + '）');
    st().ach[id] = x.tier + 1;
    var got = G.grant({ gold: x.gold }); G.log('達成成就「' + a.name + '」第 ' + (x.tier + 1) + ' 階', 'sys');
    G.commit(); return ok({ got: got });
  };
  G.achPending = function () { return U.filter(G.ACH, function (a) { return G.achState(a).can; }).length; };

  // ---------- 簽到（P2：不看日曆。每贏 5 場可簽 1 次，28 次一輪；累計 7/14/21/28 次另有獎勵；D） ----------
  G.SIGN_CYCLE = 28;
  G.SIGN_REWARD = [{ silver: 1000 }, { items: [{ item: 'jinglitang', n: 1 }] }, { silver: 1500 }, { items: [{ item: 'peiyangdan', n: 2 }] }, { items: [{ item: 'jinengshu', n: 1 }] }, { silver: 2000 }, { gold: 20 }];
  G.SIGN_BONUS = { 7: { gold: 30 }, 14: { items: [{ item: 'shenjishu', n: 1 }] }, 21: { gold: 50, items: [{ item: 'xilianshi', n: 3 }] }, 28: { gold: 100, items: [{ item: 'seed_soul', n: 2 }] } };
  G.signState = function () {
    var s = st(), t = G.ticket('sign'), n = s.sign.days.length;
    return { today: Math.min(G.SIGN_CYCLE, n + 1), daysInMonth: G.SIGN_CYCLE, count: n, signedToday: !t.ready, winsLeft: t.left, every: t.every, days: s.sign.days, canMakeup: false, bonus: s.sign.bonus };
  };
  G.sign = function () {
    var s = st(), t = G.ticket('sign');
    if (!t.ready) return fail('再贏 ' + t.left + ' 場戰鬥就能簽到');
    var got = [];
    if (s.sign.days.length >= G.SIGN_CYCLE) { // 一輪結束：沒領的累計獎勵自動補發，再開新一輪
      U.each(U.keys(G.SIGN_BONUS), function (k) { if (!s.sign.bonus[k]) got = got.concat(G.grant(G.SIGN_BONUS[k])); });
      s.sign.days = []; s.sign.bonus = {};
    }
    var x = G.signState(), rw = G.SIGN_REWARD[x.count % G.SIGN_REWARD.length];
    G.useTicket('sign'); s.sign.days.push(x.count + 1); s.sign.total++;
    G.bump('sign');
    got = got.concat(G.grant(rw)); G.commit(); return ok({ got: got, n: x.count + 1 });
  };
  G.signMakeup = function () { return fail('簽到不看日期，沒有補簽'); };
  G.claimSignBonus = function (n) {
    n = +n; var x = G.signState(), s = st();
    if (!G.SIGN_BONUS[n]) return fail('沒有這個獎勵');
    if (s.sign.bonus[n]) return fail('已領取');
    if (x.count < n) return fail('本輪累計簽到 ' + n + ' 次才能領取');
    s.sign.bonus[n] = true; var got = G.grant(G.SIGN_BONUS[n]); G.commit(); return ok({ got: got });
  };
  // 一鍵領取範圍不含簽到／累計簽到獎勵；每日寶箱以領完可領的歷練任務後活躍度計算。
  G.taskRewardCount = function () {
    var s = st(), d = G.daily(), n = 0, act = d.act || 0;
    U.each(MJ.D.tasks, function (t) { if (!s.tasksClaimed[t.id] && G.taskDone(t)) n++; });
    U.each(G.DAILY, function (q) {
      if (!d.claimed[q.id] && G.dailyProgress(q) >= q.n) { n++; act += q.act; }
    });
    U.each(G.DAILY_CHEST, function (c) { if (!d.chest[c.id] && act >= c.need) n++; });
    U.each(G.ACH, function (a) {
      var tier = s.ach[a.id] || 0, value = a.val(s);
      while (tier < a.tiers.length && value >= a.tiers[tier]) { n++; tier++; }
    });
    return n;
  };
  G.claimAllTaskRewards = function () {
    var s = st(), d = G.daily(), n = 0, got = [], failed = [];
    function collect(r, label) {
      if (r && r.ok) { n++; got = got.concat(r.got || []); }
      else if (r) failed.push(label + '：' + (r.msg || '領取失敗'));
    }
    U.each(MJ.D.tasks, function (t) { if (!s.tasksClaimed[t.id] && G.taskDone(t)) collect(G.claimTask(t.id), t.name); });
    U.each(G.DAILY, function (q) { if (!d.claimed[q.id] && G.dailyProgress(q) >= q.n) collect(G.claimDaily(q.id), q.name); });
    U.each(G.DAILY_CHEST, function (c) { if (!d.chest[c.id] && d.act >= c.need) collect(G.claimDailyChest(c.id), '活躍 ' + c.need + ' 寶箱'); });
    U.each(G.ACH, function (a) {
      var guard = 0, x = G.achState(a);
      while (x.can && guard < a.tiers.length) {
        collect(G.claimAch(a.id), a.name + ' 第 ' + (x.tier + 1) + ' 階');
        guard++; x = G.achState(a);
      }
    });
    if (!n) return fail('目前沒有可領取的任務獎勵');
    if (failed.length) got.push('未能領取 ' + failed.length + ' 項：' + failed.join('；'));
    return ok({ count: n, got: got, failed: failed.length });
  };

  // ---------- 農田（P2：種下立即成熟，不等現實時間；化肥改成收成 +50%；D） ----------
  G.SEEDS = {
    seed_yin: { hours: 4, kind: 'silver' },
    seed_exp: { hours: 6, kind: 'exp' },
    seed_gem: { hours: 8, kind: 'gem' },
    seed_soul: { hours: 12, kind: 'soul' }
  };
  G.farmLv = function () { return st().buildings.farm || 1; };
  G.farmPlots = function () { return Math.min(9, 3 + Math.floor(G.farmLv() / 3)); };
  G.farmDur = function (seed) {
    return 0;
  };
  function plot(i) { var s = st(); return s.farm.plots[i] || null; }
  G.plotState = function (i) {
    var p = plot(i); if (!p) return { empty: true };
    return { empty: false, seed: p.seed, left: 0, pct: 1, ready: true, fert: !!p.fert, end: p.ts };
  };
  G.plant = function (i, seed) {
    i = +i; var s = st();
    if (!(i >= 0 && i < G.farmPlots())) return fail('這塊田尚未開墾（農田升級可開墾更多）');
    if (plot(i)) return fail('這塊田已經種了作物');
    if (!G.SEEDS[seed]) return fail('這不是種子');
    if (have(seed) < 1) return fail('沒有' + G.itemName(seed));
    take(seed, 1);
    s.farm.plots[i] = { seed: seed, ts: now(), dur: G.farmDur(seed), fert: false };
    G.commit(); return ok();
  };
  G.fertilize = function (i) {
    i = +i; var p = plot(i);
    if (!p) return fail('這塊田沒有作物');
    if (p.fert) return fail('這一季已經施過肥了');
    if (have('huafei') < 1) return fail('沒有化肥');
    take('huafei', 1); p.fert = true;
    G.commit(); return ok();
  };
  G.harvestYield = function (seed) {
    var lv = G.lead().lv, k = 1 + 0.05 * (G.farmLv() - 1);
    switch (G.SEEDS[seed].kind) {
      case 'silver': return { silver: Math.floor((1500 + lv * 120) * k) };
      case 'exp': return { exp: Math.floor((300 + lv * 40) * k) };
      case 'gem': return { gem: 1 + (G.farmLv() >= 10 ? 1 : 0) };
      default: return { soul: 3 + Math.floor(G.farmLv() / 10) };
    }
  };
  G.harvest = function (i, rng) {
    i = +i; var s = st(), p = plot(i), x = G.plotState(i);
    if (!p) return fail('這塊田沒有作物');
    rng = rng || Math.random;
    var y = G.harvestYield(p.seed), got = [];
    if (p.fert) { if (y.silver) y.silver = Math.floor(y.silver * 1.5); if (y.exp) y.exp = Math.floor(y.exp * 1.5); if (y.gem) y.gem = Math.min(5, y.gem + 1); if (y.soul) y.soul = Math.ceil(y.soul * 1.5); }
    s.farm.plots[i] = null; // 先清空，避免重複收成
    if (y.silver) got = got.concat(G.grant({ silver: y.silver }));
    if (y.exp) { var L = G.lead(), b = L.lv; G.addExp(L, y.exp); got.push('主角經驗 +' + y.exp + (L.lv > b ? '（升到 ' + L.lv + ' 級）' : '')); }
    if (y.gem) { var gk = 'gem_' + GEMK[Math.floor(rng() * 6)] + '_' + y.gem; got = got.concat(G.grant({ items: [{ item: gk, n: 1 }] })); }
    if (y.soul) {
      var pool = U.filter(s.heroes, function (h) { return h.id !== 'lead'; });
      var id = pool.length ? pool[Math.floor(rng() * pool.length)].id : MJ.D.heroes.list[Math.floor(rng() * MJ.D.heroes.list.length)].id;
      got = got.concat(G.grant({ items: [{ item: 'soul:' + id, n: y.soul }] }));
    }
    G.bump('harvest');
    G.commit(); return ok({ got: got });
  };
  G.harvestAll = function (rng) {
    var got = [], n = 0;
    for (var i = 0; i < G.farmPlots(); i++) if (G.plotState(i).ready) { var r = G.harvest(i, rng); if (r.ok) { n++; got = got.concat(r.got); } }
    if (!n) return fail('沒有成熟的作物');
    return ok({ got: got, n: n });
  };

  // ---------- 敵軍產生（通天塔、無極幻境共用） ----------
  function chapterOf(i) { var cs = MJ.D.stages.chapters; return cs[((i % cs.length) + cs.length) % cs.length]; }
  function cellsFor(n, r) {
    var pref = [[1, 4, 7], [0, 4, 8, 1, 7], [0, 3, 6, 4, 1, 7], [3, 0, 6, 4, 2, 8, 5]][Math.floor(r * 4)];
    var all = [0, 3, 6, 1, 4, 7, 2, 5, 8], out = [];
    U.each(pref.concat(all), function (c) { if (out.length < n && out.indexOf(c) < 0) out.push(c); });
    return out;
  }
  G.makeFoes = function (o) { // o: {ch, count, lv, kind, seed, depth}
    var rng = U.rng(o.seed || 1), ch = o.ch, en = [];
    var cells = cellsFor(o.count, rng());
    if (o.kind !== 'normal') {
      en.push({ e: o.kind === 'elite' ? ch.elite[Math.floor(rng() * 2)] : ch.boss, cell: 4, lv: o.lv + 1, leader: 1 });
      cells = U.filter(cells, function (c) { return c !== 4; }).slice(0, o.count - 1);
    }
    U.each(cells, function (c) { en.push({ e: ch.pool[Math.floor(rng() * ch.pool.length)], cell: c, lv: o.lv }); });
    return { kind: o.kind, enemies: en, depth: o.depth || 0 };
  };

  // ---------- 通天塔 ----------
  G.TOWER_MAX = 240; // WL-15：150→240（Tomas 2026-11-11 22:17 立項；OD-5 主代理 2026-11-11 23:50 裁決：原定 F250 實測 12/12／殘血 38% 超帶，改頂 F240；終關 F240 以 Lv80 頂尖隊壓線為門檻，見 provenance balance.topGate15）
  G.towerFloor = function (f) {
    var kind = f % 10 === 0 ? 'boss' : (f % 5 === 0 ? 'elite' : 'normal');
    var ch = chapterOf(Math.floor((f - 1) / 10));
    var sg = G.makeFoes({ ch: ch, count: Math.min(9, 3 + Math.floor(f / 8)), lv: Math.min(R.maxLevel, 18 + Math.round(f * 0.62)), kind: kind, seed: f * 7919, depth: Math.floor(f / 20) + 3 });
    sg.id = 'tw' + f; sg.name = '通天塔．第 ' + f + ' 層'; sg.floor = f; sg.bg = ch.bg; sg.chName = ch.name;
    var rw = { silver: 500 + f * 80, items: [{ item: f % 2 ? 'peiyangdan' : 'jinengshu', n: 1 + Math.floor(f / 25) }] };
    if (f % 5 === 0) rw.items.push({ item: 'gem_' + GEMK[(f / 5) % 6] + '_' + Math.min(6, 1 + Math.floor(f / 20)), n: 1 }); // WL-11：寶石上限 Lv5→Lv6，F120 起給 Lv6
    if (f % 10 === 0) { rw.gold = 20 + f / 2; rw.items.push({ item: 'xf_' + XF[(f / 10) % XF.length], n: 1 }); }
    if (f % 25 === 0) rw.items.push({ item: 'shenjishu', n: 1 });
    sg.first = rw; sg.xinghun = 5 + Math.floor(f / 10) * 2; sg.exp = 20 + f * 10;
    return sg;
  };
  G.towerFight = function (seed) {
    var s = st(), lead = G.lead(), cfg = C().buildings.tongtian;
    if (lead.lv < cfg.open) return fail('通天塔需要主角 ' + cfg.open + ' 級');
    if (s.tower.best >= G.TOWER_MAX) return fail('已登上塔頂');
    if (!G.teamCount()) return fail('沒有出戰武將');
    var f = s.tower.best + 1, sg = G.towerFloor(f);
    seed = seed || seedOf();
    var team = G.buildTeam(), foes = G.buildEnemy(sg);
    var res = MJ.Battle.run(team, foes, { seed: seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression });
    s.stats.battles++; G.bump('towerTry');
    var out = { mode: 'tower', win: res.win, battle: res, stage: sg, team: team, foes: foes, rewards: [], levelUps: [], seed: seed, energyCost: 0 };
    if (res.win) {
      s.stats.wins++;
      if (f > s.tower.best) { // 只有首次登上新的一層才給獎勵（不重複）
        s.tower.best = f;
        out.rewards = G.grant(sg.first);
        s.player.xinghun = (s.player.xinghun || 0) + sg.xinghun; out.rewards.push('星魂 +' + sg.xinghun);
        U.each(G.teamList(), function (x) { var b = x.hero.lv; G.addExp(x.hero, sg.exp); if (x.hero.lv > b) out.levelUps.push(G.nameOf(x.hero) + ' Lv' + b + '→' + x.hero.lv); });
        out.exp = sg.exp;
      }
      G.log('登上通天塔第 ' + f + ' 層', 'battle');
    } else G.log('通天塔第 ' + f + ' 層挑戰失敗', 'battle');
    G.commit(); return ok(out);
  };

  // ---------- 自動接續／跳過（WL-3 任務 2；純 G 層邏輯，可單元測試；不動存檔） ----------
  // 自動接續判定：塔＝勝利且未登頂；無極＝勝利且未播完最後一波
  G.towerAutoNext = function (r) {
    return !!(r && r.ok !== false && r.win && r.mode === 'tower' && st().tower.best < G.TOWER_MAX);
  };
  G.wujiAutoNext = function (r) {
    return !!(r && r.win && r.mode === 'wuji' && r.run && r.idx < r.run.waves.length - 1);
  };
  // 通天塔跳過：從目前 best 起連續呼叫 G.towerFight() 直到戰敗／登頂／失敗。
  // 獎勵由 towerFight 內按首次登層發放，本函式只彙總，不重發、不漏發。
  // maxFloors 為安全上限（預設 100＝塔高），避免萬一迴圈失控。
  G.towerSkip = function (maxFloors) {
    var s = st(), startBest = s.tower.best;
    var limit = maxFloors == null ? G.TOWER_MAX : Math.max(0, +maxFloors || 0);
    if (s.tower.best >= G.TOWER_MAX) return fail('已登上塔頂');
    var out = { startBest: startBest, floors: [], rewards: [], levelUps: [], exp: 0, topped: false, lostAt: 0, win: false };
    for (var i = 0; i < limit; i++) {
      if (s.tower.best >= G.TOWER_MAX) { out.topped = true; break; }
      var r = G.towerFight();
      if (!r.ok) {
        if (!out.floors.length && !out.topped) return fail(r.msg || '無法挑戰通天塔');
        break;
      }
      out.floors.push(r.stage.floor);
      out.rewards = out.rewards.concat(r.rewards || []);
      out.levelUps = out.levelUps.concat(r.levelUps || []);
      out.exp += r.exp || 0;
      out.win = !!r.win;
      if (!r.win) { out.lostAt = r.stage.floor; break; }
      if (s.tower.best >= G.TOWER_MAX) out.topped = true;
    }
    out.reached = s.tower.best; out.fought = out.floors.length;
    return ok(out);
  };
  // 無極幻境跳過：結果已在 G.wujiRun 內算好並發放，本函式只從 run 彙總總結資料，不重算、不重發。
  // waveWins 為逐波勝場數，應等於 cleared（逐波播完與跳過總結一致的依據）。
  G.wujiSummary = function (run) {
    if (!run || !run.tier) return fail('沒有幻境結果');
    var wins = 0;
    U.each(run.waves || [], function (w) { if (w.win) wins++; });
    return ok({ tier: run.tier, cleared: run.cleared, full: !!run.full, souls: run.souls || 0, rewards: run.rewards || [], firstRewards: run.firstRewards || null, exp: run.exp || 0, levelUps: run.levelUps || [], waveWins: wins });
  };
  G.towerSweepReward = function () {
    var b = st().tower.best;
    return { silver: Math.floor(b * 150 * G.econ().reward), items: b >= 10 ? [{ item: 'peiyangdan', n: Math.floor(b / 10) }] : [] };
  };
  G.towerSweep = function () {
    var s = st();
    if (s.tower.best < 1) return fail('至少要通過第 1 層才能領取塔俸');
    var t = G.ticket('tower'); if (!t.ready) return fail('再贏 ' + t.left + ' 場戰鬥就能再領塔俸');
    G.useTicket('tower');
    var got = G.grant(G.towerSweepReward()); G.commit(); return ok({ got: got });
  };

  // ---------- 無極幻境（連續波次，血量與怒氣延續） ----------
  // P3：無極幻境改為無盡波次（規格書：每 5 波 1 個將魂）。三個起點 第 1／41／81 波，每次挑戰最多連打 40 波（D）。
  G.WUJI_SEG = 40;
  G.WUJI = [
    { id: 'w1', name: '初窺之境', open: 12, start: 1, waves: 40, bonus: { items: [{ item: 'jinengshu', n: 2 }, { item: 'peiyangdan', n: 2 }] }, first: { gold: 50 } },
    { id: 'w2', name: '登堂之境', open: 25, start: 41, waves: 40, bonus: { items: [{ item: 'jinengshu', n: 3 }, { item: 'xinfacanye', n: 2 }, { item: 'gem_atk_2', n: 1 }] }, first: { gold: 100, items: [{ item: 'shenjishu', n: 1 }] } },
    { id: 'w3', name: '化境', open: 42, start: 81, waves: 40, bonus: { items: [{ item: 'shenjishu', n: 1 }, { item: 'xinfacanye', n: 3 }, { item: 'gem_hp_3', n: 1 }] }, first: { gold: 200, items: [{ item: 'seed_soul', n: 2 }] } },
    { id: 'w4', name: '破軍之境', open: 55, start: 121, waves: 40, bonus: { items: [{ item: 'jinengshu', n: 4 }, { item: 'xinfacanye', n: 3 }, { item: 'gem_atk_4', n: 1 }] }, first: { gold: 300, items: [{ item: 'shenjishu', n: 2 }] } }, // WL-11：新增第 4 檔（121–160 波）
    { id: 'w5', name: '無雙之境', open: 65, start: 161, waves: 40, bonus: { items: [{ item: 'shenjishu', n: 3 }, { item: 'xinfacanye', n: 5 }, { item: 'gem_hp_5', n: 1 }] }, first: { gold: 500, items: [{ item: 'seed_soul', n: 3 }] } }, // WL-11：新增第 5 檔（161–200 波）
    { id: 'w6', name: '神武之境', open: 70, start: 201, waves: 40, bonus: { items: [{ item: 'shenjishu', n: 4 }, { item: 'xinfacanye', n: 6 }, { item: 'gem_atk_6', n: 1 }] }, first: { gold: 700, items: [{ item: 'shenjishu', n: 2 }] } }, // WL-15：新增第 6 檔（201–240 波）
    { id: 'w7', name: '無上之境', open: 75, start: 241, waves: 40, bonus: { items: [{ item: 'shenjishu', n: 5 }, { item: 'xinfacanye', n: 8 }, { item: 'gem_hp_6', n: 1 }] }, first: { gold: 1000, items: [{ item: 'seed_soul', n: 3 }] } } // WL-15：新增第 7 檔（241–280 波）
  ];
  G.wujiTier = function (id) { return U.find(G.WUJI, function (t) { return t.id === id; }); };
  G.wujiLeft = function () { return Infinity; }; // P2：無限挑戰（規格書）
  G.wujiLv = function (W) { return Math.min(R.maxLevel, 14 + Math.floor((W - 1) * 0.4)); }; // D
  G.WUJI.forEach(function (t) { t.lv = G.wujiLv(t.start); });
  G.wujiSoulQ = function (W) { return W <= 40 ? 2 : (W <= 80 ? 3 : 4); }; // D：越深的波次將魂品質越高（綠→藍→紫）
  G.wujiWaveReward = function (W) { // 每 5 波 1 個將魂（規格書 B）；每 10 波道具包（D）
    var rw = { items: [] };
    if (W % 5 === 0) rw.soulQ = G.wujiSoulQ(W);
    if (W % 10 === 0) rw.items = [{ item: W % 20 ? 'jinengshu' : 'xinfacanye', n: 1 + Math.floor(W / 40) }, { item: 'peiyangdan', n: 1 }];
    return rw;
  };
  G.wujiMilestone = function (W) { return W % 10 === 0 ? { gold: Math.floor(W / 2) } : null; }; // D：每 10 波第一次到達給金幣（只一次）
  G.wujiWave = function (t, w, seed) {
    var W = t.start + w, lv = G.wujiLv(W), ch = chapterOf(Math.min(12, Math.floor((W - 1) / 15))); // WL-12：敵池上限改到第 13 章（原 min 9＝第 10 章）
    var kind = W % 10 === 0 ? 'boss' : (W % 5 === 0 ? 'elite' : 'normal');
    var sg = G.makeFoes({ ch: ch, count: Math.min(9, 3 + Math.floor((W - 1) / 12)), lv: lv, kind: kind, seed: seed + W * 101, depth: lv >= 40 ? 5 : 0 });
    sg.name = '無極．第 ' + W + ' 波'; sg.bg = ch.bg; sg.id = t.id; sg.wave = W;
    sg.silver = Math.floor((200 + lv * 25) * G.econ().reward); sg.exp = lv * 8;
    return sg;
  };
  function soulOfQ(q, rng) {
    var pool = U.filter(MJ.D.heroes.list, function (d) { return d.quality === q && d.souls > 0; });
    if (!pool.length) return null;
    return pool[Math.floor(rng() * pool.length)].id;
  }
  G.wujiRun = function (id, seed) {
    var s = st(), t = G.wujiTier(id); if (!t) return fail('沒有這個幻境');
    if (G.lead().lv < t.open) return fail(t.name + '需要主角 ' + t.open + ' 級');
    if (!G.teamCount()) return fail('沒有出戰武將');
    seed = seed || seedOf();
    G.bump('wujiTry');
    var team = G.buildTeam(), waves = [], silver = 0, exp = 0, cleared = 0, rng = U.rng(seed ^ 0x5a5a), drops = { items: [] }, mile = { gold: 0 };
    for (var w = 0; w < t.waves; w++) {
      var sg = G.wujiWave(t, w, seed), foes = G.buildEnemy(sg);
      var cur = U.map(team, function (x) { return { cell: x.cell, unit: x.unit }; });
      var res = MJ.Battle.run(cur, foes, { seed: (seed + w * 977) >>> 0, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression });
      s.stats.battles++;
      waves.push({ battle: res, team: cur, foes: foes, stage: sg, win: res.win });
      if (!res.win) break;
      s.stats.wins++; cleared++; silver += sg.silver; exp += sg.exp;
      var W = sg.wave, wr = G.wujiWaveReward(W);
      if (wr.soulQ != null) { var sid = soulOfQ(wr.soulQ, rng); if (sid) drops.items.push({ item: 'soul:' + sid, n: 1 }); }
      drops.items = drops.items.concat(wr.items);
      var m = G.wujiMilestone(W); if (m && !s.wuji.first['W' + W]) { s.wuji.first['W' + W] = true; mile.gold += m.gold; }
      if (W > (s.wuji.best || 0)) s.wuji.best = W;
      // 下一波：存活者帶著剩餘生命與怒氣
      var next = [];
      U.each(res.units, function (u) {
        if (u.side !== 'A' || u.hp <= 0) return;
        var c0 = u.cell0 != null ? u.cell0 : u.cell; // v9：衝鋒後下一波回到原陣位
        var src = U.find(cur, function (x) { return x.cell === c0; });
        var nu = U.extend({}, src.unit); nu.curHp = u.hp; nu.curRage = u.rage;
        next.push({ cell: c0, unit: nu });
      });
      team = next;
    }
    var full = cleared === t.waves, out = { mode: 'wuji', tier: t, waves: waves, cleared: cleared, full: full, rewards: [], levelUps: [], firstRewards: null, souls: 0 };
    if (silver) out.rewards = out.rewards.concat(G.grant({ silver: silver }));
    U.each(drops.items, function (it) { if (it.item.indexOf('soul:') === 0) out.souls++; });
    if (drops.items.length) out.rewards = out.rewards.concat(G.grant(drops));
    if (exp) {
      U.each(G.teamList(), function (x) { var b = x.hero.lv; G.addExp(x.hero, exp); if (x.hero.lv > b) out.levelUps.push(G.nameOf(x.hero) + ' Lv' + b + '→' + x.hero.lv); });
      out.exp = exp;
    }
    var first = [];
    if (mile.gold) first = first.concat(G.grant(mile));
    if (full) {
      s.wuji.clears++;
      out.rewards = out.rewards.concat(G.grant(t.bonus));
      if (!s.wuji.first[id]) { s.wuji.first[id] = true; first = first.concat(G.grant(t.first)); }
    }
    if (first.length) out.firstRewards = first;
    G.log(t.name + '：第 ' + t.start + '～' + (t.start + Math.max(0, cleared - 1)) + ' 波，通過 ' + cleared + ' 波' + (out.souls ? '，將魂 ×' + out.souls : '') + (full ? '（全破）' : ''), 'battle');
    G.commit(); return ok(out);
  };

  // ---------- 任務條件擴充 ----------
  var oldDone = G.taskDone;
  G.taskDone = function (t) {
    var c = t.cond, s = st();
    if (c.harvest) return (s.counters.harvest || 0) >= c.harvest;
    if (c.wuji) return s.wuji.clears >= c.wuji;
    return oldDone(t);
  };
})(MJ.G);
