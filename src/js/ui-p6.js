/* 原版還原 P3 介面：榮譽培養（重試／保持／替換）、將魂合成、紫裝碎片、將星錄不可逆提示 */
(function (UI) {
  var U = MJ.U, G = MJ.G, R = MJ.R;
  function C() { return MJ.D.config; }
  function S() { return MJ.S.state; }
  var N = { str: '力量', int: '智力', agi: '敏捷', con: '耐力' };

  // ---------- 培養（B：一次 50 榮譽；三選一 重試／保持／替換） ----------
  UI.hallTabs.peiyang = function (h0, s) {
    var cap = R.peiyangCap(h0), p = h0.py, pend = h0.pyPending, c = C().peiyang, hon = s.player.honor || 0;
    var h = '<div class="py"><b>培養</b>：消耗榮譽與銀幣，隨機改變四維加成（每項上限 ' + cap + '）　持有榮譽 <b class="py-honor">' + hon + '</b><table class="stats py-t"><tr><th></th><th>目前</th>' + (pend ? '<th>新結果</th>' : '') + '</tr>';
    U.each(['str', 'int', 'agi', 'con'], function (a) {
      var dlt = pend ? pend[a] - p[a] : 0;
      h += '<tr><td>' + N[a] + '</td><td>+' + p[a] + '</td>' + (pend ? '<td class="' + (dlt > 0 ? 'up' : dlt < 0 ? 'down' : '') + '">+' + pend[a] + (dlt ? '（' + (dlt > 0 ? '+' : '') + dlt + '）' : '') + '</td>' : '') + '</tr>';
    });
    h += '</table>';
    if (pend) h += '<div class="btn-row"><a class="btn small" data-a="pyRetry" data-v="' + (UI.sel.pyMode || 'normal') + '">重試</a><a class="btn small red" data-a="pyNo">保持</a><a class="btn small" data-a="pyOk">替換</a></div><small>重試＝放棄這次結果並再培養一次（再付一次費用）；保持＝維持原數值；替換＝採用新結果。</small>';
    else h += '<div class="btn-row"><a class="btn small" data-a="pyDo" data-v="normal">普通培養</a><a class="btn small" data-a="pyDo" data-v="strong">加強培養</a></div>' +
      '<small>普通：榮譽 ' + c.normal.dan * G.HONOR_PER_TOKEN + '＋' + U.fmt(c.normal.silver) + ' 銀（' + c.normal.lo + '～+' + c.normal.hi + '）<br>加強：榮譽 ' + c.strong.dan * G.HONOR_PER_TOKEN + '＋' + U.fmt(c.strong.silver) + ' 銀（' + c.strong.lo + '～+' + c.strong.hi + '）<br>榮譽來源：拜訪武將（勝 +' + G.HONOR_WIN + '／敗 +' + G.HONOR_LOSE + '）、榮譽令（+50）</small>';
    return h + '</div>';
  };
  UI.actions.pyDo = function (m) { UI.sel.pyMode = m; var r = G.peiyang(UI.sel.hallUid, m); if (UI.res(r)) UI.render(); };
  UI.actions.pyRetry = function (m) { var r = G.peiyangRetry(UI.sel.hallUid, m); if (UI.res(r)) UI.render(); };
  UI.actions.pyOk = function () { if (UI.res(G.peiyangAccept(UI.sel.hallUid), '已替換為新結果')) UI.render(); };
  UI.actions.pyNo = function () { if (UI.res(G.peiyangCancel(UI.sel.hallUid), '已保持原數值')) UI.render(); };

  // ---------- 將星錄：將魂合成 ----------
  function soulPanel() {
    var cfg = C().soulCombine;
    var h = '<hr><b>將魂合成</b>（主角 ' + cfg.open + ' 級開放；指定 5 魂公式，材料順序不限）';
    if (!G.soulCombineOpen()) return h + '<br><small>主角 ' + cfg.open + ' 級開放</small>';
    h += '<small>' + G.SOUL_RULES.recipe + '</small><div class="rows sc-rows">';
    U.each(G.soulRecipes(), function (r, i) {
      var parts = r.split(','), x = G.soulRecipeState(i), names = U.map(parts.slice(0, 5), function (id) { var d = R.heroDef(id); return d ? d.name : '?'; }).join('＋'), out = R.heroDef(parts[5]);
      h += '<div class="row-item"><div class="ri-t"><b>' + (i + 1) + '. ' + U.esc(names) + ' → ' + U.esc(out ? out.name : '?') + '將魂</b><small>' + (x.can ? '材料足夠，可合成' : '材料不足') + '</small></div>' + (x.can ? '<a class="btn small" data-a="soulRecipe" data-v="' + i + '">合成</a>' : '<small>需 5 個指定魂</small>') + '</div>';
    });
    if (!G.soulRecipes().length) h += '<div class="row-item"><small>目前沒有可用的合成公式。</small></div>';
    return h + '</div><p class="note">綠將沒有合成公式。</p>';
  }
  var baseJxl = UI.screens.jxl;
  UI.screens.jxl = function () {
    var h = baseJxl.apply(this, arguments), at = h.indexOf('<div class="btn-row"><a class="btn small" data-a="open" data-v="codex">');
    return at < 0 ? h : h.slice(0, at) + soulPanel() + h.slice(at);
  };
  UI.actions.soulRecipe = function (i) { var x = G.soulCombineRecipe(+i); if (UI.res(x, '獲得 ' + (x.name || '') + '將魂')) UI.render(); };

  // ---------- 通天塔：紫裝碎片合成 ----------
  var baseTower = UI.screens.tower;
  UI.screens.tower = function () {
    var h = baseTower.apply(this, arguments), n = S().bag.stack[G.FRAG] || 0, at = h.indexOf('<p class="note">通天塔可無限挑戰');
    var p = '<div class="parch tw-frag"><b>紫裝碎片 ' + n + '/' + G.FRAG_NEED + '</b>（每 20 層獎勵；10 層／30 層…給藍裝）' + (n >= G.FRAG_NEED ? '<div class="btn-row">' + U.map([['weapon:p', '物攻武器'], ['weapon:m', '法攻武器'], ['weapon:j', '絕技武器'], ['armor', '盔甲'], ['cape', '披風'], ['belt', '腰帶'], ['helm', '帽子'], ['ring', '戒指']], function (x) { return '<a class="btn small" data-a="fragMix" data-v="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div>' : '') + '</div>';
    return at < 0 ? h : h.slice(0, at) + p + h.slice(at);
  };
  UI.actions.fragMix = function (v) { var a = v.split(':'), r = G.fragCombine(a[0], a[1]); if (UI.res(r, '合成：紫·' + (r.equip ? G.itemName('eq:' + r.equip.t) : ''))) UI.render(); };
})(MJ.UI);
