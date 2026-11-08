/* P4-3 生死劫：攻略提供九層名稱；敵軍數值、逐層開放與獎勵皆為 D 級本作設計。 */
(function (G) {
  var U = MJ.U, R = MJ.R, S = MJ.S;
  function st() { return S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function seedOf() { return ((U.now() ^ ((st().stats.battles + 19) * 2654435761)) >>> 0) || 1; }

  G.SSJ_LAYERS = [
    { name: '魑', lv: 10 },
    { name: '冷香絕', lv: 17 },
    { name: '摩羅', lv: 24 },
    { name: '羅迦', lv: 31 },
    { name: '魎', lv: 38 },
    { name: '羲天', lv: 45 },
    { name: '阿修羅', lv: 52 },
    { name: '深淵之龍', lv: 59 },
    { name: '窮奇', lv: 66 }
  ];

  function fresh() { return { best: 0, clears: {} }; }
  function progress() {
    var s = st();
    if (!s.shengsijie) s.shengsijie = fresh();
    if (typeof s.shengsijie.best !== 'number') s.shengsijie.best = 0;
    if (!s.shengsijie.clears || typeof s.shengsijie.clears !== 'object') s.shengsijie.clears = {};
    return s.shengsijie;
  }
  S.extraDefaults = S.extraDefaults || [];
  S.extraDefaults.push(function (s) {
    if (!s.shengsijie) s.shengsijie = fresh();
    if (typeof s.shengsijie.best !== 'number') s.shengsijie.best = 0;
    if (!s.shengsijie.clears || typeof s.shengsijie.clears !== 'object') s.shengsijie.clears = {};
  });
  S.STEPS[11] = function (s) {
    if (!s.shengsijie) s.shengsijie = fresh();
    s.migrateNotes = (s.migrateNotes || []).concat(['P4-3：新增生死劫九層進度，原有武將、道具與其他進度保留。']);
  };

  G.ssjStage = function (floor, seed) {
    floor = Math.floor(+floor);
    if (!(floor >= 1 && floor <= G.SSJ_LAYERS.length)) return null;
    var layer = G.SSJ_LAYERS[floor - 1], ch = MJ.D.stages.chapters[(floor - 1) % MJ.D.stages.chapters.length];
    var sg = G.makeFoes({ ch: ch, count: 1, lv: Math.min(R.maxLevel, layer.lv), kind: 'boss', seed: seed || floor * 7919, depth: 4 });
    sg.kind = 'boss'; sg.id = 'ssj' + floor; sg.name = '生死劫・第 ' + floor + 層; sg.bg = ch.bg; sg.floor = floor; sg.chName = ch.name;
    sg.enemies[0].name = layer.name;
    sg.enemies[0].honorFrame = 'gold';
    sg.silver = 500 + floor * 200;
    sg.exp = layer.lv * 12;
    return sg;
  };
  G.ssjProgress = progress;
  G.ssjChallenge = function (floor, seed) {
    var s = st(), p = progress();
    floor = Math.floor(+floor);
    if (floor < 1 || floor > G.SSJ_LAYERS.length) return fail('沒有這一層');
    if (floor > p.best + 1) return fail('請先通過前一層');
    if (!G.teamCount()) return fail('沒有出戰武將');
    seed = seed || seedOf();
    var sg = G.ssjStage(floor, seed), team = G.buildTeam(), foes = G.buildEnemy(sg);
    U.each(foes, function (x) {
      x.unit.name = G.SSJ_LAYERS[floor - 1].name;
      x.unit.active.name = x.unit.name + '之擊';
      x.unit.ult.name = '劫滅・' + x.unit.name;
    });
    var battle = MJ.Battle.run(team, foes, { seed: seed, maxRounds: MJ.D.config.maxRounds, levelSuppression: MJ.D.config.levelSuppression });
    var first = false, rewards = [], levelUps = [];
    s.stats.battles++;
    if (battle.win) {
      s.stats.wins++;
      first = !p.clears[floor];
      p.clears[floor] = (p.clears[floor] || 0) + 1;
      p.best = Math.max(p.best, floor);
      if (first) {
        rewards = G.grant({ silver: sg.silver });
        U.each(G.teamList(), function (x) {
          var before = x.hero.lv;
          G.addExp(x.hero, sg.exp);
          if (x.hero.lv > before) levelUps.push(G.nameOf(x.hero) + ' Lv' + before + '→' + x.hero.lv);
        });
      }
      G.log('生死劫・第 ' + floor + ' 層「' + G.SSJ_LAYERS[floor - 1].name + '」通過' + (first ? '（首通）' : ''), 'battle');
    } else G.log('生死劫・第 ' + floor + ' 層挑戰失敗', 'battle');
    var out = { mode: 'shengsijie', floor: floor, layer: G.SSJ_LAYERS[floor - 1], win: battle.win, first: first, battle: battle, stage: sg, team: team, foes: foes, rewards: rewards, levelUps: levelUps, seed: seed, energyCost: 0 };
    if (first) out.exp = sg.exp;
    G.commit();
    return ok(out);
  };
})(MJ.G);
