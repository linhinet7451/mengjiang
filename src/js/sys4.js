/* 第四階段（選做）：拜訪武將（名將切磋．單機 AI 競技場）＋戰報重播
   原作「拜訪武將」為社群玩法（拜訪好友的武將），單機版改為挑戰 30 支 AI 名將隊伍的排名賽。
   規則、對手陣容、獎勵全部為 D 級（自訂）。 */
(function (G) {
  var U = MJ.U, R = MJ.R;
  function C() { return MJ.D.config; }
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function def(o, k, v) { if (o[k] == null) o[k] = v; return o[k]; }
  G.ARENA_N = 30; G.ARENA_TRIES = 5; G.ARENA_RECS = 6; G.ARENA_OPEN = 8;
  // 武林大會（單機 AI 淘汰賽，第 41 屆，海選 Lv.70-75；宣傳片 B／D，見 provenance video2.wulin.ai）
  G.WULIN_OPEN = 70; G.WULIN_EDITION = 41;
  G.WULIN_REWARDS = [
    { silver: 1000, items: [{ item: 'peiyangdan', n: 2 }] },
    { silver: 2000, items: [{ item: 'jinengshu', n: 1 }, { item: 'peiyangdan', n: 3 }] },
    { silver: 5000, items: [{ item: 'jinengshu', n: 2 }, { item: 'peiyangdan', n: 5 }] }
  ];
  G.wulinRewards = function (round) { return G.WULIN_REWARDS[round] || { silver: 0, items: [] }; };
  MJ.S.extraDefaults = MJ.S.extraDefaults || [];
  MJ.S.extraDefaults.push(function (s) {
    def(s, 'arena', {});
    def(s.arena, 'rank', G.ARENA_N + 1); def(s.arena, 'best', G.ARENA_N + 1);
    def(s.arena, 'day', ''); def(s.arena, 'tries', G.ARENA_TRIES); def(s.arena, 'rewardDay', ''); def(s.arena, 'recs', []);
    def(s.arena, 'wins', 0);
    if (s.settings) { def(s.settings, 'bgm', true); def(s.settings, 'sfx', true); }
    def(s, 'wulin', {});
    def(s.wulin, 'edition', G.WULIN_EDITION); def(s.wulin, 'round', 0); def(s.wulin, 'bracket', null);
    def(s.wulin, 'champ', false); def(s.wulin, 'wins', 0); def(s.wulin, 'recs', []); def(s.wulin, 'done', false);
  });
  var TITLES = ['天下無雙', '一代宗師', '萬人敵', '絕世名將', '武林盟主', '江湖霸主', '沙場宿將', '少年英雄', '人中龍鳳', '蓋世豪傑'];
  // 對手：依排名決定等級、人數、品質與裝備（排名越前越強）
  G.arenaFoe = function (rank) {
    var rng = U.rng(rank * 7717 + 13), N = G.ARENA_N, t = (N - rank) / (N - 1); // 0（第 30 名）～1（第 1 名）
    var lv = Math.max(1, Math.min(R.maxLevel, Math.round(8 + t * 72)));
    var count = R.teamSlots(lv);
    // 對手養成程度介於「弱勢」與「一般」玩家之間（見 tools/balance.js）
    var qMin = lv < 15 ? 1 : (lv < 35 ? 2 : 3), qMax = lv < 15 ? 2 : 3, tops = lv >= 60 ? 2 : (lv >= 45 ? 1 : 0);
    var all = MJ.D.heroes.list || MJ.D.heroes;
    var pool = U.filter(all, function (h) { return h.quality >= qMin && h.quality <= qMax; });
    var top = U.filter(all, function (h) { return h.quality === 4; });
    var picks = [], used = {};
    function take(list) { for (var g = 0; g < 50; g++) { var h = list[Math.floor(rng() * list.length)]; if (!used[h.id]) { used[h.id] = 1; picks.push(h); return; } } }
    for (var k0 = 0; k0 < tops; k0++) take(top);
    while (picks.length < count) take(pool);
    picks.sort(function (a, b) { return b.quality - a.quality; });
    var cap = picks[0], plus = Math.floor(lv / 8), eqQ = lv < 25 ? 0 : (lv < 50 ? 1 : 2), skl = Math.min(9, 1 + Math.floor(lv / 8));
    var heroes = U.map(picks, function (d, i) {
      var h = { uid: -(i + 1), id: d.id, lv: lv, exp: 0, eq: {}, sk: { a: skl, u: skl, p: skl }, py: { str: 0, int: 0, agi: 0, con: 0 }, xf: [], star: 0 };
      var dt = R.dtypeOf(d.type);
      U.each(R.SLOTS, function (slot) {
        var best = null;
        U.each(MJ.D.equipment.list, function (e) {
          if (e.slot !== slot || e.lv > lv) return;
          if (slot === 'weapon' && e.id.charAt(1) !== { p: 'p', m: 'm', j: 'j' }[dt]) return;
          if (!best || e.lv > best.lv) best = e;
        });
        if (best) h.eq[slot] = { uid: -100 - i, t: best.id, q: eqQ, plus: plus, aff: [], gems: [] };
      });
      return h;
    });
    // 隊伍編制：前排放耐打的（耐力型），後排放其他
    var cellsFront = [1, 4, 7, 0, 3, 6, 2, 5, 8];
    var order = heroes.slice().sort(function (a, b) { var da = MJ.D.heroIndex[a.id], db = MJ.D.heroIndex[b.id]; return (db.type.indexOf('耐') >= 0) - (da.type.indexOf('耐') >= 0); });
    var fake = { player: { name: cap.name }, codex: {}, jiangxing: { lit: Math.max(0, Math.floor((lv - 16) * 0.5)) }, team: { formation: '' } };
    var n = Math.floor(3 + lv * 0.6); for (var k = 0; k < n; k++) fake.codex['x' + k] = 1;
    var foes = U.map(order, function (h, i) { var u = R.heroUnit(h, fake); return { cell: cellsFront[i], unit: u }; });
    var power = 0; U.each(order, function (h) { power += R.power(h, fake); });
    return { rank: rank, name: cap.name + '軍', title: TITLES[rank % TITLES.length], lv: lv, count: count, cap: cap, foes: foes, power: power };
  };
  G.myPower = function () { var s = st(), p = 0; U.each(G.teamList(), function (x) { p += R.power(x.hero, s); }); return p; };
  G.arenaState = function () {
    var a = st().arena; a.tries = G.ARENA_TRIES; // P2：沒有每日次數
    return a;
  };
  // 可挑戰的對手：自己前面 5 名（未上榜時為第 30～26 名）
  G.arenaList = function () {
    var a = G.arenaState(), out = [];
    for (var r = a.rank - 1; r >= Math.max(1, a.rank - 5); r--) out.push(r);
    return out;
  };
  G.arenaWinReward = function (target) { return { silver: 300 + (G.ARENA_N + 1 - target) * 60 }; };
  G.arenaDailyReward = function (rank) {
    if (rank > G.ARENA_N) return null;
    var rw = { silver: 1000 + (G.ARENA_N + 1 - rank) * 200, xinghun: Math.max(1, Math.ceil((G.ARENA_N + 1 - rank) / 3)) };
    if (rank <= 10) rw.gold = 11 - rank + 5;
    return rw;
  };
  function snap(team) { return JSON.parse(JSON.stringify(team)); }
  G.HONOR_WIN = 25; G.HONOR_LOSE = 5;
  G.arenaFight = function (target, seed) {
    var s = st(), a = G.arenaState(), lead = G.lead();
    if (lead.lv < G.ARENA_OPEN) return fail('拜訪武將需要主角 ' + G.ARENA_OPEN + ' 級');
    if (!G.teamCount()) return fail('沒有出戰武將');
    target = +target;
    if (G.arenaList().indexOf(target) < 0) return fail('只能挑戰排名在你前面 5 名以內的對手');
    seed = seed || (((U.now() ^ ((s.stats.battles + 11) * 2654435761)) >>> 0) || 1);
    var foe = G.arenaFoe(target), team = G.buildTeam();
    var tSnap = snap(team), fSnap = snap(foe.foes);
    var res = MJ.Battle.run(team, foe.foes, { seed: seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression, pvp: true }); // P4：拜訪武將＝PVP
    s.stats.battles++;
    var before = a.rank, rewards = [];
    if (res.win) {
      s.stats.wins++; a.wins++;
      if (target < a.rank) a.rank = target;
      var silver = G.arenaWinReward(target).silver;
      rewards = G.grant({ silver: silver });
      if (a.rank < a.best) { // 首次達到更高排名：一次性金幣（不重複）
        var gold = (Math.min(a.best, G.ARENA_N + 1) - a.rank) * 2;
        a.best = a.rank; rewards = rewards.concat(G.grant({ gold: gold }));
      }
      G.log('拜訪武將：擊敗第 ' + target + ' 名「' + foe.name + '」，排名 ' + (before > G.ARENA_N ? '未上榜' : before) + ' → ' + a.rank, 'battle');
    } else G.log('拜訪武將：挑戰第 ' + target + ' 名「' + foe.name + '」失敗', 'battle');
    rewards = rewards.concat(G.grant({ honor: res.win ? G.HONOR_WIN : G.HONOR_LOSE })); // B：榮譽來自武林大會／拜訪；數值 D
    if (G.bump) G.bump('arena');
    var rec = { ts: U.now(), target: target, name: foe.name, win: res.win, seed: seed, before: before, after: a.rank, team: tSnap, foes: fSnap, rounds: res.rounds, v: 7, pvp: true };
    a.recs.unshift(rec); if (a.recs.length > G.ARENA_RECS) a.recs.length = G.ARENA_RECS;
    G.commit();
    var sg = { id: 'arena' + target, name: '拜訪武將．' + foe.name, kind: 'boss', bg: MJ.D.stages.chapters[(target) % MJ.D.stages.chapters.length].bg };
    return ok({ mode: 'arena', win: res.win, battle: res, stage: sg, team: team, foes: foe.foes, rewards: rewards, levelUps: [], energyCost: 0, foe: foe, before: before, after: a.rank, seed: seed });
  };
  // 重播：以存下的雙方陣容快照與亂數種子重新模擬（結果與當時完全相同）
  G.arenaReplay = function (i) {
    var a = st().arena, rec = a.recs[+i];
    if (!rec) return fail('找不到這場戰報');
    var res = MJ.Battle.run(snap(rec.team), snap(rec.foes), { seed: rec.seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression, pvp: !!rec.pvp }); // 舊戰報（v6 以前）沒有 pvp，以舊規則重播
    var sg = { id: 'arena' + rec.target, name: '重播．' + rec.name, kind: 'boss', bg: MJ.D.stages.chapters[rec.target % MJ.D.stages.chapters.length].bg };
    return ok({ mode: 'arena', replay: true, win: res.win, consistent: res.win === rec.win && res.rounds === rec.rounds, battle: res, stage: sg, team: snap(rec.team), foes: snap(rec.foes), rewards: [], levelUps: [], energyCost: 0, before: rec.before, after: rec.after, rec: rec });
  };
  G.arenaClaimDaily = function () {
    var a = G.arenaState();
    if (a.rank > G.ARENA_N) return fail('尚未上榜，先擊敗任一位對手');
    var tk = G.ticket('arena'); if (!tk.ready) return fail('再贏 ' + tk.left + ' 場戰鬥就能再領排名獎勵');
    G.useTicket('arena');
    var rw = G.arenaDailyReward(a.rank), got = G.grant(rw);
    st().player.xinghun = (st().player.xinghun || 0) + rw.xinghun; got.push('星魂 +' + rw.xinghun);
    G.commit(); return ok({ got: got });
  };

  // ---------- 武林大會：8 人單淘汰賽（單機 AI，第 41 屆，海選 Lv.70-75） ----------
  // 規則、對手、獎勵全部為 D 級（本作設計）。不連線、不邀請，觀戰／重播沿用拜訪武將的戰報快照重播。
  G.wulinState = function () {
    var s = st(); if (!s.wulin) s.wulin = {};
    var w = s.wulin;
    def(w, 'edition', G.WULIN_EDITION); def(w, 'round', 0); def(w, 'bracket', null);
    def(w, 'champ', false); def(w, 'wins', 0); def(w, 'recs', []); def(w, 'done', false);
    return w;
  };
  // 產生對陣表：玩家＋7 支 AI 名將隊（沿用拜訪武將的 arenaFoe 陣容）。非玩家對戰以戰力＋少量隨機模擬；
  // 玩家路徑：八強 vs 第 7 名 AI、四強 vs 八強另一組勝方、決賽 vs 上半區勝方。
  G.wulinBracket = function (seed) {
    seed = seed || ((U.now() ^ 0x9e3779b9) >>> 0) || 1;
    var rng = U.rng(seed);
    function meta(rank) { var f = G.arenaFoe(rank); return { rank: rank, name: f.name, title: f.title, lv: f.lv, power: f.power }; }
    function sim(a, b) { var pa = a.power * (0.9 + rng() * 0.2), pb = b.power * (0.9 + rng() * 0.2); return pa >= pb ? a : b; }
    var ai = [1, 2, 3, 4, 5, 6, 7].map(meta);
    var w1 = sim(ai[0], ai[1]), w2 = sim(ai[2], ai[3]), w3 = sim(ai[4], ai[5]), w4 = sim(w1, w3);
    return {
      edition: G.WULIN_EDITION, seed: seed, round: 0,
      qf: [{ a: '你', b: ai[6].name }, { a: ai[0].name, b: ai[1].name, w: w1.name }, { a: ai[2].name, b: ai[3].name, w: w2.name }, { a: ai[4].name, b: ai[5].name, w: w3.name }],
      foes: [ai[6], w2, w4], done: false, champ: false, lost: false
    };
  };
  G.wulinStart = function (seed) {
    var w = G.wulinState();
    if (G.lead().lv < G.WULIN_OPEN) return fail('武林大會海選需要主角 ' + G.WULIN_OPEN + ' 級（海選 Lv.70-75）');
    if (!G.teamCount()) return fail('沒有出戰武將');
    if (w.bracket && !w.bracket.done) return fail('本屆武林大會還在進行中');
    w.bracket = G.wulinBracket(seed); w.round = 0; w.done = false;
    G.log('第 ' + G.WULIN_EDITION + ' 屆武林大會開幕，八強對手為「' + w.bracket.foes[0].name + '」', 'sys');
    G.commit(); return ok({ bracket: w.bracket });
  };
  G.wulinFight = function (seed) {
    var s = st(), w = G.wulinState(), rounds = ['八強', '四強', '決賽'];
    if (G.lead().lv < G.WULIN_OPEN) return fail('武林大會海選需要主角 ' + G.WULIN_OPEN + ' 級（海選 Lv.70-75）');
    if (!w.bracket || w.bracket.done) return fail('請先開始新一屆武林大會');
    var round = w.bracket.round, foeMeta = w.bracket.foes[round];
    if (!foeMeta) return fail('本屆武林大會已結束');
    if (!G.teamCount()) return fail('沒有出戰武將');
    seed = seed || (((U.now() ^ ((s.stats.battles + 11) * 2654435761)) >>> 0) || 1);
    var foe = G.arenaFoe(foeMeta.rank), team = G.buildTeam();
    var tSnap = snap(team), fSnap = snap(foe.foes);
    var res = MJ.Battle.run(team, foe.foes, { seed: seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression, pvp: true });
    s.stats.battles++;
    var rewards = [];
    if (res.win) {
      s.stats.wins++; w.wins++;
      rewards = G.grant(G.wulinRewards(round));
      w.bracket.round = round + 1;
      if (round >= 2) { w.bracket.done = true; w.bracket.champ = true; w.champ = true; }
      G.log('武林大會' + rounds[round] + '戰勝「' + foe.name + '」', 'battle');
    } else {
      w.bracket.done = true; w.bracket.lost = true;
      G.log('武林大會' + rounds[round] + '敗給「' + foe.name + '」，止步本輪', 'battle');
    }
    rewards = rewards.concat(G.grant({ honor: res.win ? G.HONOR_WIN : G.HONOR_LOSE }));
    var rec = { ts: U.now(), round: round, name: foe.name, win: res.win, seed: seed, team: tSnap, foes: fSnap, rounds: res.rounds, v: 7, pvp: true };
    w.recs.unshift(rec); if (w.recs.length > 3) w.recs.length = 3;
    if (G.bump) G.bump('wulin');
    G.commit();
    var sg = { id: 'wulin' + round, name: '武林大會．' + rounds[round] + '．' + foe.name, kind: 'boss', bg: MJ.D.stages.chapters[(round + 3) % MJ.D.stages.chapters.length].bg };
    return ok({ mode: 'wulin', win: res.win, battle: res, stage: sg, team: team, foes: foe.foes, rewards: rewards, levelUps: [], energyCost: 0, foe: foe, round: round, bracket: w.bracket, seed: seed });
  };
  // 重播：以存下的雙方陣容快照與亂數種子重新模擬（結果與當時完全相同）
  G.wulinReplay = function (i) {
    var w = G.wulinState(), rec = w.recs[+i];
    if (!rec) return fail('找不到這場戰報');
    var res = MJ.Battle.run(snap(rec.team), snap(rec.foes), { seed: rec.seed, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression, pvp: !!rec.pvp });
    var sg = { id: 'wulinR' + i, name: '重播．' + rec.name, kind: 'boss', bg: MJ.D.stages.chapters[(rec.round + 3) % MJ.D.stages.chapters.length].bg };
    return ok({ mode: 'wulin', replay: true, win: res.win, consistent: res.win === rec.win && res.rounds === rec.rounds, battle: res, stage: sg, team: snap(rec.team), foes: snap(rec.foes), rewards: [], levelUps: [], energyCost: 0, round: rec.round });
  };
})(MJ.G);
