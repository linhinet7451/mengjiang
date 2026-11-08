/* 第二階段養成：技能升級、培養、心法、神兵坊（強化/洗煉/鑲嵌/合成）、將魂升階、將星錄、圖鑑
   所有數值為 D 級（自訂、可調整），功能存在與否的等級見 docs/資料考證.md */
(function (G) {
  var U = MJ.U, R = MJ.R;
  function C() { return MJ.D.config; }
  function st() { return MJ.S.state; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function rnd(rng) { return rng ? rng() : Math.random(); }
  function have(k) { return st().bag.stack[k] || 0; }
  function take(k, n) { var s = st(); s.bag.stack[k] = (s.bag.stack[k] || 0) - n; if (s.bag.stack[k] <= 0) delete s.bag.stack[k]; }
  function count(k, n) { var c = st().counters; c[k] = (c[k] || 0) + (n || 1); }
  G.count = count;

  // ---------- 找裝備（包裹或身上） ----------
  G.findEquip = function (uid) {
    var s = st(), e = U.find(s.bag.equips, function (x) { return x.uid === uid; });
    if (e) return { e: e, where: 'bag' };
    var res = null;
    U.each(s.heroes, function (h) { U.each(R.SLOTS, function (sl) { if (!res && h.eq[sl] && h.eq[sl].uid === uid) res = { e: h.eq[sl], where: 'hero', hero: h, slot: sl }; }); });
    return res;
  };

  // ---------- 技能升級（主動 a／無雙 u／被動 p） ----------
  G.SKILL_NAMES = { a: '主動', u: '無雙', p: '被動' };
  G.skillUpCost = function (h, w) {
    var L = R.skillLv(h, w), c = C().skill;
    if (L > c.maxLv) return null;
    if (L === c.maxLv) return { silver: c.silverBase * L * L * 2, items: { shenjishu: c.shenBooks, jinengshu: L } };
    return { silver: c.silverBase * L * L, items: { jinengshu: L } };
  };
  G.skillUp = function (uid, w) {
    var s = st(), h = G.hero(uid); if (!h) return fail('找不到武將');
    if (!G.SKILL_NAMES[w]) return fail('未知技能');
    var def = R.heroDef(h.id);
    if (w === 'p' && !def.passive) return fail('此武將沒有被動技能');
    if (w === 'u' && !def.ult) return fail('此武將沒有無雙技能');
    var cost = G.skillUpCost(h, w); if (!cost) return fail('已達「·神」最高階');
    var L = R.skillLv(h, w);
    if (L >= h.lv) return fail('技能等級不能超過武將等級（' + h.lv + '）');
    if (s.player.silver < cost.silver) return fail('銀幣不足（需要 ' + U.fmt(cost.silver) + '）');
    var miss = U.find(U.keys(cost.items), function (k) { return have(k) < cost.items[k]; });
    if (miss) return fail(G.itemName(miss) + '不足（需要 ' + cost.items[miss] + '）');
    s.player.silver -= cost.silver;
    U.each(U.keys(cost.items), function (k) { take(k, cost.items[k]); });
    h.sk[w] = L + 1; count('skillUp');
    var shen = h.sk[w] > C().skill.maxLv;
    G.log(G.nameOf(h) + ' 的' + G.SKILL_NAMES[w] + '技能升到 ' + (shen ? '「·神」' : h.sk[w] + ' 級'), 'lv');
    G.commit(); return ok({ lv: h.sk[w], shen: shen });
  };

  // ---------- 培養 ----------
  G.peiyang = function (uid, mode, rng) {
    var s = st(), h = G.hero(uid), c = C().peiyang[mode];
    if (!h) return fail('找不到武將'); if (!c) return fail('未知培養方式');
    if (h.pyPending) return fail('請先保留或放棄上次培養結果');
    var hon = c.dan * G.HONOR_PER_TOKEN; // B：一次 50 榮譽（加強＝3 倍，D）
    if ((s.player.honor || 0) < hon) return fail('榮譽不足（需要 ' + hon + '，拜訪武將可獲得榮譽）');
    if (s.player.silver < c.silver) return fail('銀幣不足（需要 ' + U.fmt(c.silver) + '）');
    s.player.honor -= hon; s.player.silver -= c.silver;
    var cap = R.peiyangCap(h), p = {};
    U.each(['str', 'int', 'agi', 'con'], function (a) {
      var d = c.lo + Math.floor(rnd(rng) * (c.hi - c.lo + 1));
      p[a] = Math.max(0, Math.min(cap, (h.py[a] || 0) + d));
    });
    h.pyPending = p; count('peiyang');
    G.commit(); return ok({ pending: p, cap: cap });
  };
  G.peiyangAccept = function (uid) {
    var h = G.hero(uid); if (!h || !h.pyPending) return fail('沒有待確認的培養結果');
    h.py = h.pyPending; delete h.pyPending; G.commit(); return ok();
  };
  // B：培養結果三選一「重試／保持／替換」。重試＝放棄這次結果並以同樣花費再培養一次
  G.peiyangRetry = function (uid, mode, rng) {
    var h = G.hero(uid); if (!h || !h.pyPending) return fail('沒有待確認的培養結果');
    var keep = h.pyPending; delete h.pyPending;
    var r = G.peiyang(uid, mode || 'normal', rng);
    if (!r.ok) h.pyPending = keep;
    return r;
  };
  G.peiyangCancel = function (uid) {
    var h = G.hero(uid); if (!h || !h.pyPending) return fail('沒有待確認的培養結果');
    delete h.pyPending; G.commit(); return ok();
  };

  // ---------- 心法 ----------
  G.xinfaLearn = function (uid, xid) {
    var h = G.hero(uid), cfg = C().xinfa[xid];
    if (!h || !cfg) return fail('找不到武將或心法');
    if (!have('xf_' + xid)) return fail('沒有「' + cfg.name + '」秘笈');
    if (U.find(h.xf, function (x) { return x.id === xid; })) return fail('已修練此心法');
    if (h.xf.length >= R.xinfaSlots(h)) return fail('心法欄位不足（等級 ' + C().xinfaSlots.join('/') + ' 開放）');
    take('xf_' + xid, 1); h.xf.push({ id: xid, lv: 1, kind: h.xf.length === 0 ? 'normal' : 'special', exp: 0 });
    G.log(G.nameOf(h) + ' 修練了心法「' + cfg.name + '」', 'lv');
    G.commit(); return ok({ msg: G.nameOf(h) + ' 修練了「' + cfg.name + '」' });
  };
  G.xinfaSoulExp = function (soulId) {
    var d = R.heroDef(soulId), q = d && d.quality, x = C().xinfaSoulExp || { white: 1, green: 10, blue: 50, purple: 100 };
    return q === 1 ? x.white : q === 2 ? x.green : q === 3 ? x.blue : q === 4 ? x.purple : 0;
  };
  G.xinfaFeed = function (uid, idx, soulId, n) {
    var s = st(), h = G.hero(uid), x = h && h.xf[idx], d = R.heroDef(soulId), count = Math.max(1, Math.floor(n || 1)), key = 'soul:' + soulId;
    if (!x || !d) return fail('找不到心法或將魂');
    if (x.kind === 'special') {
      var partner = R.heroDef(h.id) && R.heroDef(h.id).partner;
      if (!partner || partner !== soulId) return fail('特殊心法只能使用連攜武將將魂');
    }
    if ((s.bag.stack[key] || 0) < count) return fail('將魂不足');
    var gain = G.xinfaSoulExp(soulId) * count; if (!gain) return fail('此將魂沒有心法經驗值');
    s.bag.stack[key] -= count; if (!s.bag.stack[key]) delete s.bag.stack[key];
    x.exp = (x.exp || 0) + gain;
    while (x.lv < C().xinfaMax && x.exp >= x.lv * 100) { x.exp -= x.lv * 100; x.lv++; }
    G.commit(); return ok({ lv: x.lv, exp: x.exp, gained: gain });
  };
  G.xinfaUpCost = function (x) { return { pages: x.lv, silver: C().xinfaSilver * x.lv }; };
  G.xinfaUp = function (uid, idx) {
    var s = st(), h = G.hero(uid), x = h && h.xf[idx];
    if (!x) return fail('找不到心法');
    if (x.lv >= C().xinfaMax) return fail('心法已達最高級');
    var c = G.xinfaUpCost(x);
    if (have('xinfacanye') < c.pages) return fail('心法殘頁不足（需要 ' + c.pages + '）');
    if (s.player.silver < c.silver) return fail('銀幣不足（需要 ' + U.fmt(c.silver) + '）');
    take('xinfacanye', c.pages); s.player.silver -= c.silver; x.lv++;
    G.commit(); return ok({ lv: x.lv });
  };
  G.xinfaForget = function (uid, idx) {
    var h = G.hero(uid), x = h && h.xf[idx];
    if (!x) return fail('找不到心法');
    h.xf.splice(idx, 1); G.addItem('xf_' + x.id, 1);
    G.commit(); return ok();
  };

  // ---------- 神兵坊：強化 ----------
  G.enhance = function (uid, rng) {
    var s = st(), f = G.findEquip(uid); if (!f) return fail('找不到裝備');
    var e = f.e, cap = R.enhanceCap(s);
    if ((e.plus || 0) >= cap) return fail('已達強化上限 +' + cap + '（升級神兵坊可提高）');
    var cost = R.enhanceCost(e);
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    s.player.silver -= cost;
    var success = rnd(rng) < R.enhanceChance(e);
    if (success) { e.plus = (e.plus || 0) + 1; count('enhance'); }
    G.commit(); return ok({ success: success, plus: e.plus, cost: cost });
  };
  // ---------- 洗煉 ----------
  G.washCost = function (e) { return C().wash.silver * (R.equipTpl(e.t).lv + 5) / 5 | 0; };
  G.wash = function (uid, rng) {
    var s = st(), f = G.findEquip(uid); if (!f) return fail('找不到裝備');
    var e = f.e, n = C().wash.counts[e.q] || 0;
    if (!n) return fail('白色裝備沒有附加屬性，無法洗煉');
    if (e.washPending) return fail('請先保留或放棄上次洗煉結果');
    if (!have('xilianshi')) return fail('洗煉石不足');
    var cost = G.washCost(e);
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    take('xilianshi', 1); s.player.silver -= cost;
    var pool = C().wash.pool, keys = U.keys(pool), lv = R.equipTpl(e.t).lv + 5, out = [];
    for (var i = 0; i < n; i++) {
      var k = keys[Math.floor(rnd(rng) * keys.length)], r = pool[k], v = (r[0] + (r[1] - r[0]) * rnd(rng)) * lv;
      v = (k === 'hit' || k === 'crit' || k === 'dodge') ? Math.round(v * 100) / 100 : Math.max(1, Math.round(v));
      out.push({ k: k, v: v });
    }
    e.washPending = out; count('wash');
    G.commit(); return ok({ pending: out, cost: cost });
  };
  G.washAccept = function (uid) { var f = G.findEquip(uid); if (!f || !f.e.washPending) return fail('沒有待確認的洗煉結果'); f.e.aff = f.e.washPending; delete f.e.washPending; G.commit(); return ok(); };
  G.washCancel = function (uid) { var f = G.findEquip(uid); if (!f || !f.e.washPending) return fail('沒有待確認的洗煉結果'); delete f.e.washPending; G.commit(); return ok(); };
  // ---------- 鑲嵌 ----------
  G.socket = function (uid, gemKey) {
    var f = G.findEquip(uid), it = MJ.D.equipment.items[gemKey];
    if (!f) return fail('找不到裝備'); if (!it || !it.gem) return fail('不是寶石');
    if (!have(gemKey)) return fail('沒有這顆寶石');
    var e = f.e; e.gems = e.gems || [];
    if (e.gems.length >= R.sockets(e)) return fail('孔位已滿（' + R.sockets(e) + ' 孔）');
    if (U.find(e.gems, function (g) { return MJ.D.equipment.items[g].gem.k === it.gem.k; })) return fail('同一件裝備不能鑲嵌同類寶石');
    take(gemKey, 1); e.gems.push(gemKey); count('socket');
    G.commit(); return ok();
  };
  G.unsocket = function (uid, idx, useFu) {
    var f = G.findEquip(uid); if (!f || !f.e.gems || !f.e.gems[idx]) return fail('找不到寶石');
    var g = f.e.gems[idx], kept = false;
    if (useFu) { if (!have('zhaochufu')) return fail('摘除符不足'); take('zhaochufu', 1); }
    if (useFu) { G.addItem(g, 1); kept = true; }
    f.e.gems.splice(idx, 1);
    G.commit(); return ok({ kept: kept, gem: g });
  };
  G.gemCombine = function (key) {
    var s = st(), it = MJ.D.equipment.items[key], c = C().gemCombine;
    if (!it || !it.gem) return fail('不是寶石');
    if (it.gem.lv >= C().gemMaxLv) return fail('已是最高級寶石');
    if (have(key) < c.n) return fail('需要 ' + c.n + ' 顆相同寶石');
    var cost = c.silver[it.gem.lv - 1];
    if (s.player.silver < cost) return fail('銀幣不足（需要 ' + U.fmt(cost) + '）');
    var to = 'gem_' + it.gem.k + '_' + (it.gem.lv + 1);
    take(key, c.n); s.player.silver -= cost; G.addItem(to, 1);
    G.commit(); return ok({ to: to });
  };

  // ---------- 將魂升階 ----------
  G.starUp = function (uid) {
    var h = G.hero(uid); if (!h) return fail('找不到武將');
    if (h.id === 'lead') return fail('主角不能以將魂升階');
    if ((h.star || 0) >= C().star.max) return fail('已達最高 ' + C().star.max + ' 階');
    var cost = R.starCost(h), k = 'soul:' + h.id;
    if (have(k) < cost) return fail('將魂不足（' + have(k) + '/' + cost + '）');
    take(k, cost); h.star = (h.star || 0) + 1; count('starUp');
    G.log(G.nameOf(h) + ' 升到 ' + h.star + ' 階！', 'lv');
    G.commit(); return ok({ star: h.star });
  };
  G.jxLevelUp = function (uid) {
    var s = st(), h = G.hero(uid);
    if (!h) return fail('找不到武將');
    if (h.id === 'lead') return fail('主角不在來源所列的將星魂量範圍');
    if (!G.buildingOpen('jiangxing')) return fail('將星錄主角 30 級開放');
    var level = (h.jxLevel || 0) + 1;
    if (level > R.jxMaxLevel) return fail('已達將星 Lv18 上限');
    var cost = R.jxSoulCost(h, level);
    if (cost == null) return fail('來源未提供此品階升至 Lv' + level + ' 的魂數；不以推算值扣魂');
    var k = 'soul:' + h.id;
    if (have(k) < cost) return fail('將魂不足（' + have(k) + '/' + cost + '）');
    take(k, cost); h.jxLevel = level; count('jxLevelUp');
    G.commit(); return ok({ level: level, cost: cost, hero: h });
  };
  G.jxLevelTotal = function () {
    var n = 0; U.each(st().heroes || [], function (h) { if (h && h.id !== 'lead') n += h.jxLevel || 0; }); return n;
  };
  G.jxComboStatus = function (id) {
    var list = C().jiangxing && C().jiangxing.combos || [], combo = U.find(list, function (x) { return x.id === id; });
    if (!combo) return { state: 'unknown', combo: null, missing: [] };
    if (!combo.requirements || !combo.requirements.length) return { state: 'unknown', combo: combo, missing: [] };
    var heroes = st().heroes || [], used = {}, missing = [];
    U.each(combo.requirements, function (req) {
      var found = U.find(heroes, function (h) {
        if (!h || h.id === 'lead' || used[h.uid] || (h.jxLevel || 0) < req.level) return false;
        var def = R.heroDef(h.id);
        return req.hero ? h.id === req.hero : (!!def && req.type && def.type === req.type);
      });
      if (found) used[found.uid] = true;
      else missing.push(req);
    });
    return { state: missing.length ? 'incomplete' : 'ready', combo: combo, missing: missing };
  };
  // ---------- 圖鑑 ----------
  G.codexCount = function () { return U.keys(st().codex).length; };

  // ---------- 道具：秘笈直接修練 ----------
  var oldUse = G.useItem;
  G.useItem = function (key, heroUid) {
    var it = MJ.D.equipment.items[key];
    if (it && it.xinfa) return G.xinfaLearn(heroUid, it.xinfa);
    if (it && !it.use) return fail('此道具請在對應建築使用');
    return oldUse(key, heroUid);
  };
  // ---------- 任務條件擴充 ----------
  var oldDone = G.taskDone;
  G.taskDone = function (t) {
    var s = st(), c = t.cond;
    if (c.plus) return !!U.find(s.heroes.concat([]), function (h) { return U.find(R.SLOTS, function (sl) { return h.eq[sl] && h.eq[sl].plus >= c.plus; }); }) || !!U.find(s.bag.equips, function (e) { return e.plus >= c.plus; });
    if (c.skill) return !!U.find(s.heroes, function (h) { return h.sk && (h.sk.a >= c.skill || h.sk.u >= c.skill || h.sk.p >= c.skill); });
    if (c.peiyang) return (s.counters.peiyang || 0) >= c.peiyang;
    if (c.stars) return G.jxLevelTotal() >= c.stars;
    if (c.codex) return G.codexCount() >= c.codex;
    if (c.tower) return ((s.tower && s.tower.best) || 0) >= c.tower;
    return oldDone(t);
  };
})(MJ.G);
