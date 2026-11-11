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

  // ================= 將魂合成（W541：主角 30 級開放、34 條五魂公式） =================
  // 品階：0 黑 1 白 2 綠 3 藍 4 紫(30 魂) 5 紫(45 魂)。K2：30 魂與 45 魂紫將並存。
  G.SOUL_RULES = {
    recipe: '放入 5 個指定將魂，順序不拘；正確配方可合成指定將魂',
    legacy: '舊版隨機合成設定僅供存檔相容，不再提供隨機合成'
  };
  G.soulRank = function (id) { var d = R.heroDef(id); if (!d) return -1; return d.quality === 4 ? (d.souls >= 45 ? 5 : 4) : d.quality; };
  G.soulCombineOpen = function () { return G.lead().lv >= C().soulCombine.open; };
  G.soulRecipes = function () { return (C().soulCombine && C().soulCombine.recipes) || []; };
  function recipeIn(r) { return r.split(',').slice(0, 5); }
  function recipeOut(r) { return r.split(',')[5]; }
  function recipeKey(ids) { return ids.slice().sort().join('|'); }
  G.soulRecipeState = function (i) {
    var r = G.soulRecipes()[i], need = {}, haveAll = true;
    if (!r) return null;
    U.each(recipeIn(r), function (id) { need[id] = (need[id] || 0) + 1; });
    U.each(U.keys(need), function (id) { if (have('soul:' + id) < need[id]) haveAll = false; });
    return { index: i, recipe: r, need: need, can: haveAll, out: R.heroDef(recipeOut(r)) };
  };
  G.soulRecipeFind = function (ids) {
    var key = recipeKey(ids), found = null;
    U.each(G.soulRecipes(), function (r, i) { if (!found && recipeKey(recipeIn(r)) === key) found = { index: i, recipe: r }; });
    return found;
  };
  G.soulCombineRecipe = function (i) {
    var s = st(), cfg = C().soulCombine, x = G.soulRecipeState(+i);
    if (!G.soulCombineOpen()) return fail('將魂合成需要主角 ' + cfg.open + ' 級');
    if (!x) return fail('沒有這條合成公式');
    if (!x.can) return fail('指定將魂不足，正確配方需要 5 個材料各 1 個');
    U.each(U.keys(x.need), function (id) { take('soul:' + id, x.need[id]); });
    var pick = x.out;
    G.addItem('soul:' + pick.id, 1);
    s.soulLog.unshift({ recipe: +i, id: pick.id, rule: 'W541' }); if (s.soulLog.length > 20) s.soulLog.length = 20;
    G.log('將魂合成：' + pick.name + '將魂', 'lv');
    G.commit(); return ok({ id: pick.id, name: pick.name, recipe: +i, used: x.need });
  };
  // 舊呼叫端仍可得到明確錯誤，不再執行未有來源的隨機合成。
  G.soulCombine = function () { return fail('請選擇指定合成公式'); };

  // ================= 通天塔：每 10 層獎勵（B：每 10 層有獎勵；內容 D）與紫裝碎片 =================
  G.FRAG = 'zizhuang_frag'; G.FRAG_NEED = 10; // D
  var baseFloor = G.towerFloor;
  G.towerFloor = function (f) {
    var sg = baseFloor(f);
    if (f % 10 === 0) {
      var k = f / 10;
      if (k % 2) { // 奇數：一件藍色裝備（WL-10：與關卡掉落一致，等級一律 Lv1，玩家在神兵坊升級；D）
        var ids = ['wp', 'hm', 'ar', 'cp', 'bt', 'rg'], id = ids[(k >> 1) % ids.length] + 1;
        if (R.equipTpl(id)) sg.first.items.push({ item: 'eq:' + id, q: 2 });
      } else sg.first.items.push({ item: G.FRAG, n: k }); // 偶數：紫裝碎片 ×(層/10)
    }
    if (f === 150) { // WL-11：登頂里程碑（首通額外，D）：紫裝碎片 ×15＋金 100
      sg.first.items.push({ item: G.FRAG, n: 15 });
      sg.first.gold = (sg.first.gold || 0) + 100;
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
