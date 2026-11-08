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
    return h + '<p class="note">培養 50 榮譽、重試／保持／替換：B（攻略）；加強培養、銀幣、增減範圍：D。</p></div>';
  };
  UI.actions.pyDo = function (m) { UI.sel.pyMode = m; var r = G.peiyang(UI.sel.hallUid, m); if (UI.res(r)) UI.render(); };
  UI.actions.pyRetry = function (m) { var r = G.peiyangRetry(UI.sel.hallUid, m); if (UI.res(r)) UI.render(); };
  UI.actions.pyOk = function () { if (UI.res(G.peiyangAccept(UI.sel.hallUid), '已替換為新結果')) UI.render(); };
  UI.actions.pyNo = function () { if (UI.res(G.peiyangCancel(UI.sel.hallUid), '已保持原數值')) UI.render(); };

  // ---------- 將星錄：將魂合成 ----------
  function soulPanel() {
    var s = S(), cfg = C().soulCombine, rule = s.settings.soulRule || 'S4';
    var h = '<hr><b>將魂合成</b>（主角 ' + cfg.open + ' 級開放；' + cfg.n + ' 個同品階 → 1 個，不會降低品質）';
    if (!G.soulCombineOpen()) return h + '<br><small>主角 ' + cfg.open + ' 級開放</small>';
    h += '<div class="tabs small">' + U.map(['S4', 'S1'], function (k) { return '<a class="tab' + (rule === k ? ' on' : '') + '" data-a="soulRule" data-v="' + k + '">' + (k === 'S4' ? '同階（升階 ' + Math.round(cfg.up * 100) + '%）' : '必定升階') + '</a>'; }).join('') + '</div><small>' + G.SOUL_RULES[rule] + '</small><div class="rows sc-rows">';
    for (var r = 0; r <= 5; r++) {
      var stk = G.soulStock(r); if (!stk.total) continue;
      h += '<div class="row-item">' + UI.icon('soul', Math.min(4, r)) + '<div class="ri-t"><b>' + G.SOUL_RANK_NAMES[r] + '將魂 ×' + stk.total + '</b></div>' + (stk.total >= cfg.n ? '<a class="btn small" data-a="soulMix" data-v="' + r + '">合成</a>' : '<small>需 ' + cfg.n + '</small>') + '</div>';
    }
    return h + '</div><p class="note">K1 來源衝突：合成規則兩種說法都保留，可切換（B）。升階機率：D。</p>';
  }
  var baseJxl = UI.screens.jxl;
  UI.screens.jxl = function () {
    var h = baseJxl.apply(this, arguments), at = h.indexOf('<div class="btn-row"><a class="btn small" data-a="open" data-v="codex">');
    return at < 0 ? h : h.slice(0, at) + soulPanel() + h.slice(at);
  };
  UI.actions.soulRule = function (k) { S().settings.soulRule = k; G.commit(); UI.render(); };
  UI.actions.soulMix = function (r) { var x = G.soulCombine(+r); if (UI.res(x, '獲得 ' + (x.name || '') + '將魂' + (x.up ? '（升階！）' : ''))) UI.render(); };

  // ---------- 通天塔：紫裝碎片合成 ----------
  var baseTower = UI.screens.tower;
  UI.screens.tower = function () {
    var h = baseTower.apply(this, arguments), n = S().bag.stack[G.FRAG] || 0, at = h.indexOf('<p class="note">通天塔可無限挑戰');
    var p = '<div class="parch tw-frag"><b>紫裝碎片 ' + n + '/' + G.FRAG_NEED + '</b>（每 20 層獎勵；10 層／30 層…給藍裝）' + (n >= G.FRAG_NEED ? '<div class="btn-row">' + U.map([['weapon:p', '物攻武器'], ['weapon:m', '法攻武器'], ['weapon:j', '絕技武器'], ['armor', '盔甲'], ['cape', '披風'], ['belt', '腰帶'], ['helm', '帽子'], ['ring', '戒指']], function (x) { return '<a class="btn small" data-a="fragMix" data-v="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div>' : '') + '<small>碎片數量、合成數：D</small></div>';
    return at < 0 ? h : h.slice(0, at) + p + h.slice(at);
  };
  UI.actions.fragMix = function (v) { var a = v.split(':'), r = G.fragCombine(a[0], a[1]); if (UI.res(r, '合成：紫·' + (r.equip ? G.itemName('eq:' + r.equip.t) : ''))) UI.render(); };
})(MJ.UI);
