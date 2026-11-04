/* 原版還原 P5（存檔 v8）：8 部位裝備（新增玉墜、護手）、主角升階（綠→藍→紫→橙）、等級上限 90、單機版上古寶窟。
   資料分級：A＝官方畫面 B＝攻略 C＝推論 D＝本作自訂。上古寶窟分階 K4 有兩種來源，兩者都保留（見 G.SG_TIERS 的 src）。 */
(function (G) {
  var U = MJ.U, R = MJ.R, S = MJ.S;
  function st() { return S.state; }
  function C() { return MJ.D.config; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function seedOf() { return ((U.now() ^ ((st().stats.battles + 11) * 2654435761)) >>> 0) || 1; }

  G.SLOT_PREFIX = U.extend(G.SLOT_PREFIX || {}, { jade: 'jd', glove: 'gl' });
  G.REC_V = 8;

  function leadQOfLv(lv) { return lv >= 60 ? 4 : (lv >= 20 ? 3 : 2); }
  S.extraDefaults = S.extraDefaults || [];
  S.extraDefaults.push(function (s) {
    if (s.player && s.player.leadQ == null) { var L = U.find(s.heroes || [], function (h) { return h.id === 'lead'; }); s.player.leadQ = leadQOfLv(L ? L.lv : 1); }
    if (!s.shanggu) s.shanggu = { best: {}, first: {}, firstH: {}, clears: 0, hidden: 0 };
    U.each(['best', 'first', 'firstH'], function (k) { if (!s.shanggu[k]) s.shanggu[k] = {}; });
  });

  // ================= 主角升階 =================
  G.lpCfg = function () { return C().leadPromote; };
  G.leadPromoteNext = function () {
    var q = R.leadQ(st()), steps = G.lpCfg().steps;
    return U.find(steps, function (x) { return x.q === q + 1; }) || null;
  };
  G.leadPromote = function () {
    var s = st(), L = G.lead(), nx = G.leadPromoteNext();
    if (!nx) return fail('主角已是最高品質（' + C().qualityNames[R.leadQ(s)] + '）');
    if (L.lv < nx.lv) return fail('主角需要 ' + nx.lv + ' 級才能升為' + C().qualityNames[nx.q]);
    if (s.player.silver < nx.silver) return fail('銀幣不足（需要 ' + U.fmt(nx.silver) + '）');
    var q0 = R.leadQ(s);
    s.player.silver -= nx.silver; s.player.leadQ = nx.q;
    G.log('主角升階：' + C().qualityNames[q0] + ' → ' + C().qualityNames[nx.q] + '（全屬性 ×' + R.leadMult(s) + '）', 'lv');
    G.commit(); return ok({ from: q0, to: nx.q });
  };

  // ================= 上古寶窟（單機版） =================
  // K4：S2（2012）記載 25/35/45/60 四階；S1、S3（2013）記載 25/35/45/60/70/80。兩種都保留：70／80 階標示「2013 版」。
  G.SG_TIERS = [
    { id: 's25', lv: 25, name: '上古寶窟・一階', src: 'S2,S1,S3', bag: 'sg_bag_2', bagN: 1, hBag: 'sg_bag_3', hN: 1, gold: 30 },
    { id: 's35', lv: 35, name: '上古寶窟・二階', src: 'S2,S1,S3', bag: 'sg_bag_2', bagN: 2, hBag: 'sg_bag_3', hN: 1, gold: 50 },
    { id: 's45', lv: 45, name: '上古寶窟・三階', src: 'S2,S1,S3', bag: 'sg_bag_3', bagN: 1, hBag: 'sg_bag_3', hN: 2, gold: 80 },
    { id: 's60', lv: 60, name: '上古寶窟・四階', src: 'S2,S1,S3', bag: 'sg_bag_3', bagN: 2, hBag: 'sg_bag_4', hN: 1, gold: 120 },
    { id: 's70', lv: 70, name: '上古寶窟・五階', src: 'S1,S3', v2013: true, bag: 'sg_bag_3', bagN: 3, hBag: 'sg_bag_4', hN: 1, gold: 160 },
    { id: 's80', lv: 80, name: '上古寶窟・六階', src: 'S1,S3', v2013: true, bag: 'sg_bag_4', bagN: 1, hBag: 'sg_bag_4', hN: 2, gold: 200 }
  ];
  G.SG_HIDDEN = 0.3; // D：通過第 3 關後出現隱藏關的機率
  G.sgTier = function (id) { return U.find(G.SG_TIERS, function (t) { return t.id === id; }); };
  G.sgOpen = function (t) { return G.lead().lv >= t.lv; };
  G.sgStage = function (t, i, seed) { // i：0..2 一般關，3 隱藏關
    var cs = MJ.D.stages.chapters, ch = cs[(Math.floor(t.lv / 10) + i) % cs.length];
    var kind = i === 3 ? 'boss' : (i === 2 ? 'elite' : 'normal');
    var sg = G.makeFoes({ ch: ch, count: [5, 6, 7, 6][i], lv: Math.min(R.maxLevel, t.lv + [0, 1, 3, 5][i]), kind: kind, seed: (seed + i * 313 + t.lv * 7) >>> 0, depth: i === 3 ? 6 : (i === 2 ? 3 : 1) });
    sg.name = t.name + '・' + (i === 3 ? '隱藏關' : '第 ' + (i + 1) + ' 關'); sg.bg = ch.bg; sg.id = t.id; sg.sgi = i;
    sg.silver = Math.floor((300 + t.lv * 30) * (i === 3 ? 2 : 1) * G.econ().reward); sg.exp = t.lv * 10;
    return sg;
  };
  G.sgRun = function (id, seed) {
    var s = st(), t = G.sgTier(id); if (!t) return fail('沒有這個寶窟');
    if (!G.sgOpen(t)) return fail(t.name + '需要主角 ' + t.lv + ' 級');
    if (!G.teamCount()) return fail('沒有出戰武將');
    seed = seed || seedOf();
    var rng = U.rng(seed ^ 0x3c3c), team = G.buildTeam(), stages = [], silver = 0, exp = 0, cleared = 0, hidden = false, items = [];
    for (var i = 0; i < 4; i++) {
      if (i === 3) { hidden = rng() < G.SG_HIDDEN; if (!hidden) break; }
      var sg = G.sgStage(t, i, seed), foes = G.buildEnemy(sg);
      var cur = U.map(team, function (x) { return { cell: x.cell, unit: x.unit }; });
      var res = MJ.Battle.run(cur, foes, { seed: (seed + i * 541) >>> 0, maxRounds: C().maxRounds, levelSuppression: C().levelSuppression });
      s.stats.battles++;
      stages.push({ battle: res, team: cur, foes: foes, stage: sg, win: res.win });
      if (!res.win) break;
      s.stats.wins++; cleared++; silver += sg.silver; exp += sg.exp;
      var next = [];
      U.each(res.units, function (u) {
        if (u.side !== 'A' || u.hp <= 0) return;
        var c0 = u.cell0 != null ? u.cell0 : u.cell; // v9：衝鋒後下一波回到原陣位
        var src = U.find(cur, function (x) { return x.cell === c0; });
        var nu = U.extend({}, src.unit); nu.curHp = u.hp; nu.curRage = u.rage; next.push({ cell: c0, unit: nu });
      });
      team = next;
    }
    var full = cleared >= 3, hWin = hidden && cleared === 4;
    var out = { mode: 'shanggu', tier: t, waves: stages, cleared: cleared, full: full, hidden: hidden, hiddenWin: hWin, rewards: [], firstRewards: null, levelUps: [] };
    if (full) items.push({ item: t.bag, n: t.bagN });
    if (hWin) items.push({ item: t.hBag, n: t.hN });
    if (silver) out.rewards = out.rewards.concat(G.grant({ silver: silver }));
    if (items.length) out.rewards = out.rewards.concat(G.grant({ items: items }));
    if (exp) { U.each(G.teamList(), function (x) { var b = x.hero.lv; G.addExp(x.hero, exp); if (x.hero.lv > b) out.levelUps.push(G.nameOf(x.hero) + ' Lv' + b + '→' + x.hero.lv); }); out.exp = exp; }
    var first = [], sgS = s.shanggu;
    if (full) { sgS.clears++; if (!sgS.first[id]) { sgS.first[id] = true; first = first.concat(G.grant({ gold: t.gold })); } }
    if (hWin) { sgS.hidden++; if (!sgS.firstH[id]) { sgS.firstH[id] = true; first = first.concat(G.grant({ gold: t.gold, items: [{ item: 'sg_bag_4', n: 1 }] })); } }
    if (first.length) out.firstRewards = first;
    if (cleared > (sgS.best[id] || 0)) sgS.best[id] = cleared;
    G.log(t.name + '：通過 ' + Math.min(cleared, 3) + '/3 關' + (hidden ? (hWin ? '，擊破隱藏關！' : '，隱藏關失利') : ''), 'battle');
    G.commit(); return ok(out);
  };
  // 將魂袋：打開得到該品質隨機武將的將魂 1 個（D）
  var use0 = G.useItem;
  G.useItem = function (key, heroUid, rng) {
    var it = MJ.D.equipment.items[key];
    if (!it || !it.use || it.use.soulBag == null) return use0(key, heroUid);
    var s = st(); if (!(s.bag.stack[key] > 0)) return fail('沒有這個道具');
    var pool = U.filter(MJ.D.heroes.list, function (d) { return d.quality === it.use.soulBag && d.souls > 0; });
    if (!pool.length) return fail('沒有可以獲得的將魂');
    var pick = pool[Math.floor((rng || Math.random)() * pool.length)];
    s.bag.stack[key]--; if (!s.bag.stack[key]) delete s.bag.stack[key];
    G.addItem('soul:' + pick.id, 1);
    G.log('打開' + it.name + '：獲得「' + pick.name + '」將魂 ×1', 'item');
    G.commit(); return ok({ soul: pick.id, msg: '獲得「' + pick.name + '」將魂 ×1' });
  };

  // ================= v7 → v8 存檔升級 =================
  S.STEPS[7] = S.stepV8 = function (st0) {
    var notes = [], L = U.find(st0.heroes || [], function (h) { return h.id === 'lead'; }), lv = L ? L.lv : 1;
    if (st0.player && st0.player.leadQ == null) {
      st0.player.leadQ = leadQOfLv(lv);
      notes.push('主角品質依等級補為「' + MJ.D.config.qualityNames[st0.player.leadQ] + '」（' + (lv >= 20 ? '已達升階等級，免費補發，屬性只增不減' : '20 級前為綠，屬性不變；舊版顯示為藍') + '）');
    }
    if (!st0.shanggu) st0.shanggu = { best: {}, first: {}, firstH: {}, clears: 0, hidden: 0 };
    notes.push('裝備改為 8 部位（新增玉墜、護手；頭盔改稱帽子、飾品改稱戒指），已穿戴的裝備不變');
    notes.push('等級上限 80 → 90；新增上古寶窟');
    st0.migrateNotes = (st0.migrateNotes || []).concat(notes);
  };
})(MJ.G);
