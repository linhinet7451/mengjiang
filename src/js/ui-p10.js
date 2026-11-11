/* P4-3 介面：生死劫九層挑戰與單場結算。 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G;
  function S() { return MJ.S.state; }

  var city0 = UI.screens.city;
  UI.screens.city = function () {
    var h = city0.apply(UI, arguments), a = '<a class="gift" data-a="shengsijie">' + UI.icon('star') + '<span>生死劫</span></a>';
    var i = h.indexOf('</div><div class="chat"');
    return i < 0 ? h : h.slice(0, i) + a + h.slice(i);
  };
  UI.actions.shengsijie = function () { UI.go('shengsijie'); };
  UI.screens.shengsijie = function () {
    var p = G.ssjProgress(), h = '<div class="scr hall-scr"><div class="frame bigframe hall sgf"><div class="plaque">生死劫</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="sg-tip">逐層挑戰九名首領。已通過最高層：<b>' + p.best + '/9</b>；首通可得銀幣與全隊經驗。<br>敵軍等級、外觀、獎勵與依序解鎖方式以本作設定為準。</div><div class="sg-list">';
    U.each(G.SSJ_LAYERS, function (layer, i) {
      var floor = i + 1, locked = floor > p.best + 1, done = !!p.clears[floor];
      h += '<div class="sg-card' + (locked ? ' locked' : '') + '"><div class="sg-h">第 ' + floor + ' 層：' + U.esc(layer.name) + '<small>（敵軍 Lv' + layer.lv + '）</small></div>' +
        '<div class="sg-b">' + (done ? '已通關 ' + p.clears[floor] + ' 次' : '首通：銀幣 ×' + (500 + floor * 200) + '、全隊經驗 +' + (layer.lv * 12)) + '</div>' +
        (locked ? '<div class="sg-lock">先通過前一層</div>' : '<a class="btn small" data-a="ssjGo" data-v="' + floor + '">' + (done ? '再戰' : '挑戰') + '</a>') + '</div>';
    });
    h += '</div></div></div>';
    return h;
  };
  UI.actions.ssjGo = function (v) { var r = G.ssjChallenge(+v); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.bSsj = function () { var b = UI.battleState(); if (b) b.done = true; UI.go('shengsijie'); };

  var modeResult0 = UI.modeResult;
  UI.modeResult = function (r) {
    if (r.mode !== 'shengsijie') return modeResult0.apply(UI, arguments);
    var p = G.ssjProgress(), next = r.floor < G.SSJ_LAYERS.length && r.floor === p.best;
    var h = '<div class="dim"></div><div class="result ' + (r.win ? 'win' : 'lose') + '"><div class="banner">' + (r.win ? '生死劫・第 ' + r.floor + ' 層勝利' : '挑戰失敗') + '</div><div class="parch rbody">' +
      '<div>首領：「' + U.esc(r.layer.name) + '」　回合數：' + r.battle.rounds + '</div>';
    if (r.win && r.first) h += '<div class="rw-h">首通獎勵</div><div class="reward-list">' + U.map(r.rewards, function (x) { return '<div class="rw">' + U.esc(x) + '</div>'; }).join('') + '</div><div>全隊經驗 +' + r.exp + '</div>' +
      (r.levelUps.length ? '<div class="lvup">升級！' + U.esc(r.levelUps.join('、')) + '</div>' : '');
    else if (r.win) h += '<div>此層首通獎勵已領取，本次不重複發放。</div>';
    else h += '<div>未扣除資源，可調整陣容後再次挑戰。</div>';
    h += '</div><div class="btn-row">' +
      (next ? '<a class="btn" data-a="ssjGo" data-v="' + (r.floor + 1) + '">挑戰下一層</a>' : '') +
      (!r.win ? '<a class="btn" data-a="ssjGo" data-v="' + r.floor + '">再戰一次</a>' : '') +
      '<a class="btn" data-a="bSsj">返回生死劫</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    return h;
  };
})();
