/* 原版還原 P3（存檔 v6）：將魂合成、通天塔每 10 層獎勵、紫裝碎片、榮譽培養、6 名敏耐武將轉型。
   資料分級：A＝官方畫面 B＝攻略 C＝推論 D＝本作自訂。 */
(function (G) {
  var U = MJ.U, R = MJ.R, S = MJ.S;
  function st() { return S.state; }
  function C() { return MJ.D.config; }
  function ok(o) { o = o || {}; o.ok = true; return o; }
  function fail(msg) { return { ok: false, msg: msg }; }
  function def(o, k, v) { if (o[k] == null) o[k] = v; return o[k]; }
  function have(k) { return st().bag.stack[k] || 0; }
  function take(k, n) { var s = st(); s.bag.stack[k] = (s.bag.stack[k] || 0) - n; if (s.bag.stack[k] <= 0) delete s.bag.stack[k]; }

  S.extraDefaults = S.extraDefaults || [];
  S.extraDefaults.push(function (s) {
    if (s.player) def(s.player, 'honor', 0);
    if (s.settings) def(s.settings, 'soulRule', 'S4');
    def(s, 'soulLog', []);
  });

  // ================= 將魂合成（B：主角 30 級開放、5 個同品質合成 1 個；K1 規則衝突兩種都保留） =================
  // 品階：0 黑 1 白 2 綠 3 藍 4 紫(30 魂) 5 紫(45 魂)。K2：30 魂與 45 魂紫將並存。
  G.SOUL_RULES = {
    S4: '同品階隨機 1 個，10% 機率升 1 階（D 機率；來源 B：「不會降低品質」）',
    S1: '必定升 1 階（來源 B 另一說；紫 30 魂 ×5 → 紫 45 魂）'
  };
  G.soulRank = function (id) { var d = R.heroDef(id); if (!d) return -1; return d.quality === 4 ? (d.souls >= 45 ? 5 : 4) : d.quality; };
  G.SOUL_RANK_NAMES = ['黑', '白', '綠', '藍', '紫(30)', '紫(45)'];
  G.soulPool = function (rank) { return U.filter(MJ.D.heroes.list, function (d) { return d.souls > 0 && G.soulRank(d.id) === rank; }); };
  G.soulCombineOpen = function () { return G.lead().lv >= C().soulCombine.open; };
  G.soulStock = function (rank) {
    var s = st(), out = [], tot = 0;
    U.each(U.keys(s.bag.stack), function (k) {
      if (k.indexOf('soul:') !== 0 || !(s.bag.stack[k] > 0)) return;
      if (G.soulRank(k.slice(5)) === rank) { out.push({ k: k, n: s.bag.stack[k] }); tot += s.bag.stack[k]; }
    });
    out.sort(function (a, b) { return b.n - a.n || (a.k < b.k ? -1 : 1); });
    return { list: out, total: tot };
  };
  G.soulCombine = function (rank, rng, rule) {
    var s = st(), cfg = C().soulCombine; rng = rng || Math.random; rule = rule || s.settings.soulRule || 'S4';
    if (!G.soulCombineOpen()) return fail('將魂合成需要主角 ' + cfg.open + ' 級');
    var stock = G.soulStock(rank);
    if (stock.total < cfg.n) return fail(G.SOUL_RANK_NAMES[rank] + '將魂不足 ' + cfg.n + ' 個（目前 ' + stock.total + '）');
    var out = rank;
    if (rule === 'S1') out = Math.min(5, rank + 1);
    else if (rng() < cfg.up) out = Math.min(5, rank + 1);
    while (out > rank && !G.soulPool(out).length) out--; // 沒有更高品階時維持同品階（不會降低）
    var pool = G.soulPool(out); if (!pool.length) return fail('沒有可合成的武將');
    var need = cfg.n, used = [];
    U.each(stock.list, function (x) { if (!need) return; var t = Math.min(need, x.n); take(x.k, t); need -= t; used.push({ k: x.k, n: t }); });
    var pick = pool[Math.floor(rng() * pool.length)];
    G.addItem('soul:' + pick.id, 1);
    s.soulLog.unshift({ from: rank, to: out, id: pick.id, rule: rule }); if (s.soulLog.length > 20) s.soulLog.length = 20;
    G.log('將魂合成：' + cfg.n + ' 個' + G.SOUL_RANK_NAMES[rank] + '將魂 → ' + pick.name + '將魂' + (out > rank ? '（升階！）' : ''), 'lv');
    G.commit(); return ok({ id: pick.id, name: pick.name, rank: out, up: out > rank, used: used });
  };

  // ================= 通天塔：每 10 層獎勵（B：每 10 層有獎勵；內容 D）與紫裝碎片 =================
  G.FRAG = 'zizhuang_frag'; G.FRAG_NEED = 10; // D
  var baseFloor = G.towerFloor;
  G.towerFloor = function (f) {
    var sg = baseFloor(f);
    if (f % 10 === 0) {
      var k = f / 10;
      if (k % 2) { // 奇數：一件藍色裝備（等級約等於該層敵人等級，D）
        var lv = Math.min(54, Math.floor(Math.min(R.maxLevel, 18 + Math.round(f * 0.62)) / 6) * 6) || 1;
        var ids = ['wp', 'hm', 'ar', 'cp', 'bt', 'rg'], id = ids[(k >> 1) % ids.length] + lv;
        if (R.equipTpl(id)) sg.first.items.push({ item: 'eq:' + id, q: 2 });
      } else sg.first.items.push({ item: G.FRAG, n: k }); // 偶數：紫裝碎片 ×(層/10)
    }
    return sg;
  };
  G.fragLv = function () { var lv = G.lead().lv; return Math.max(1, Math.min(54, Math.floor(lv / 6) * 6)) || 1; };
  G.fragCombine = function (slot, kind) {
    if (have(G.FRAG) < G.FRAG_NEED) return fail('紫裝碎片不足 ' + G.FRAG_NEED + ' 個');
    var pre = { weapon: kind === 'm' ? 'wm' : (kind === 'j' ? 'wj' : 'wp'), helm: 'hm', armor: 'ar', cape: 'cp', belt: 'bt', ring: 'rg' }[slot] || (G.SLOT_PREFIX && G.SLOT_PREFIX[slot]);
    var lv = G.fragLv(); while (lv > 1 && !R.equipTpl(pre + lv)) lv -= 6;
    var id = pre + (lv < 1 ? 1 : lv);
    if (!R.equipTpl(id)) return fail('沒有這個部位');
    take(G.FRAG, G.FRAG_NEED);
    var e = G.addEquip(id, 3);
    G.log('紫裝碎片合成：紫·' + G.itemName('eq:' + id), 'lv');
    G.commit(); return ok({ equip: e });
  };

  // ================= v5 → v6 存檔升級 =================
  // 6 名敏耐武將轉型（C）；舊培養丹換榮譽；裝備中的絕技武器若主人改為力系／智系則換成同等級對應武器（保留強化、詞條、寶石）
  S.STEPS[5] = S.stepV6 = function (st0) {
    var notes = [];
    if (st0.player) {
      var pd = (st0.bag && st0.bag.stack && st0.bag.stack.peiyangdan) || 0;
      st0.player.honor = (st0.player.honor || 0) + pd * 50;
      if (pd) { delete st0.bag.stack.peiyangdan; notes.push('培養丹 ×' + pd + ' → 榮譽 +' + pd * 50); }
    }
    U.each(st0.heroes || [], function (h) {
      var d = MJ.R.heroDef(h.id); if (!d || d.typeFrom !== '敏耐') return;
      notes.push(d.name + '：敏耐 → ' + d.type);
      var w = h.eq && h.eq.weapon; if (!w) return;
      var t = MJ.R.equipTpl(w.t); if (!t || w.t.indexOf('wj') !== 0) return;
      var nt = (MJ.R.dtypeOf(d.type) === 'm' ? 'wm' : 'wp') + w.t.slice(2);
      if (MJ.R.equipTpl(nt)) { notes.push(d.name + ' 的絕技武器 ' + t.name + ' → ' + MJ.R.equipTpl(nt).name + '（保留品質/強化/寶石）'); w.t = nt; }
    });
    if (st0.settings && st0.settings.soulRule == null) st0.settings.soulRule = 'S4';
    if (st0.wuji && st0.wuji.best == null) st0.wuji.best = 0;
    st0.migrateNotes = (st0.migrateNotes || []).concat(notes);
  };
})(MJ.G);
