/* P5 介面：主角升階（培養分頁）、上古寶窟畫面、主城入口、將魂袋、武將詳情的主角品質 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  function S() { return MJ.S.state; }
  function C() { return MJ.D.config; }
  function qn(q) { return C().qualityNames[q]; }

  // ---------- 主角升階 ----------
  var py0 = UI.hallTabs.peiyang;
  UI.hallTabs.peiyang = function (h0, s, def) {
    var html = py0(h0, s, def);
    if (h0.id !== 'lead') return html;
    var q = R.leadQ(s), nx = G.leadPromoteNext();
    var box = '<div class="lp-box"><b>主角升階</b>　目前：<b class="q' + (q - 1) + 't lp-q">' + qn(q) + '</b>（全屬性 ×' + R.leadMult(s) + '）<br>';
    if (!nx) box += '<small>已達最高品質「' + qn(q) + '」。</small>';
    else {
      var can = h0.lv >= nx.lv && s.player.silver >= nx.silver;
      box += '<small>下一階：' + qn(nx.q) + '　需要主角 ' + nx.lv + ' 級、銀幣 ' + U.fmt(nx.silver) + '　升階後全屬性 ×' + C().leadPromote.statMult[String(nx.q)] + '</small>' +
        '<div class="btn-row"><a class="btn small' + (can ? '' : ' off') + '" data-a="leadPromote">升為' + qn(nx.q) + '</a></div>';
    }
    return box + '<p class="note">主角 20 級藍、60 級紫、90 級橙：照規格書，攻略只提到「主將升階」與「轉橘將」，尚待證實（D）；銀幣與屬性倍率：D（暫定）。</p></div>' + html;
  };
  UI.actions.leadPromote = function () {
    var r = G.leadPromote();
    if (UI.res(r, r.ok ? '主角升為「' + qn(r.to) + '」' : '')) UI.render();
  };
  var det0 = UI.modals.heroDetail;
  UI.modals.heroDetail = function () {
    var h = det0.apply(this, arguments);
    return h.replace('品質：主角', '品質：主角（' + qn(R.leadQ(S())) + '）');
  };
  var hud0 = UI.hud;
  UI.hud = function () {
    return hud0().replace(MJ.Art.portrait(S().player.look, 3), MJ.Art.portrait(S().player.look, R.leadQ(S())));
  };

  // ---------- 主城入口 ----------
  var city0 = UI.screens.city;
  UI.screens.city = function () {
    var h = city0.apply(this, arguments), open = G.lead().lv >= G.SG_TIERS[0].lv;
    var a = '<a class="gift sg-entry' + (open ? '' : ' dim2') + '" data-a="shanggu">' + UI.icon('chest') + '<span>上古寶窟</span></a>';
    var i = h.indexOf('</div><div class="chat"');
    return i < 0 ? h : h.slice(0, i) + a + h.slice(i);
  };
  UI.actions.shanggu = function () {
    if (G.lead().lv < G.SG_TIERS[0].lv) { UI.toast('上古寶窟：主角 ' + G.SG_TIERS[0].lv + ' 級開放'); return; }
    UI.go('shanggu');
  };

  // ---------- 上古寶窟畫面 ----------
  UI.screens.shanggu = function () {
    var s = S(), sg = s.shanggu, lv = G.lead().lv;
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall sgf"><div class="plaque">上古寶窟</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="sg-tip">單機版：以出戰隊伍連闖 <b>3 關</b>（生命與怒氣延續），通過後有機會出現<b>隱藏關</b>。可<b>無限挑戰</b>，首次通關獎勵只給一次，一般獎勵可重複取得。全破 ' + sg.clears + ' 次・隱藏關 ' + sg.hidden + ' 次</div><div class="sg-list">';
    U.each(G.SG_TIERS, function (t) {
      var locked = lv < t.lv, best = sg.best[t.id] || 0;
      h += '<div class="sg-card' + (locked ? ' locked' : '') + (t.v2013 ? ' v2013' : '') + '" data-t="' + t.id + '"><div class="sg-h">' + U.esc(t.name) + '<small>（' + t.lv + ' 級）</small>' + (t.v2013 ? '<span class="sg-src">2013 版</span>' : '') + '</div>' +
        '<div class="sg-b">敵軍 Lv' + t.lv + '～' + Math.min(R.maxLevel, t.lv + 5) + '　最佳 ' + Math.min(best, 3) + '/3' + (best >= 4 ? '＋隱藏' : '') + '<br>全破：' + U.esc(MJ.D.equipment.items[t.bag].name) + ' ×' + t.bagN + '　隱藏關：' + U.esc(MJ.D.equipment.items[t.hBag].name) + ' ×' + t.hN +
        (sg.first[t.id] ? '' : '<br><span class="sg-first">首次全破：金幣 ×' + t.gold + '</span>') + '</div>' +
        (locked ? '<div class="sg-lock">主角 ' + t.lv + ' 級開放</div>' : '<a class="btn small" data-a="sgGo" data-v="' + t.id + '">挑　戰</a>') + '</div>';
    });
    h += '</div><p class="note sg-note">上古寶窟（3 關＋隱藏關、25 級開放）：B（攻略）。K4 分階衝突：2012 年攻略為 25/35/45/60 四階，2013 年攻略另有 70/80 階，兩者都保留（70／80 標「2013 版」）。單機化、敵軍、隱藏關機率 ' + Math.round(G.SG_HIDDEN * 100) + '%、將魂袋與獎勵數值：D。</p></div></div>';
    return h;
  };
  UI.actions.sgGo = function (id) { var r = G.sgRun(id); if (!UI.res(r)) return; UI.sgPlay(r, 0); };
  UI.sgPlay = function (run, i) {
    var w = run.waves[i];
    UI.startBattle({ mode: 'shanggu', run: run, idx: i, win: w.win, battle: w.battle, stage: w.stage, team: w.team, foes: w.foes, rewards: [], levelUps: [], energyCost: 0 });
  };
  UI.actions.sgNext = function () { var b = UI.battleState(); if (!b) return; b.done = true; UI.sgPlay(b.r.run, b.r.idx + 1); };
  UI.actions.sgSum = function () { var b = UI.battleState(); if (!b) return; var el = document.getElementById('bresult'); if (el) el.innerHTML = UI.modeResult(b.r, true); };
  UI.actions.bShanggu = function () { var b = UI.battleState(); if (b) b.done = true; UI.go('shanggu'); };
  function rl(list, cls) { return '<div class="reward-list">' + U.map(list || [], function (x) { return '<div class="rw' + (cls ? ' ' + cls : '') + '">' + U.esc(x) + '</div>'; }).join('') + '</div>'; }
  var mr0 = UI.modeResult;
  UI.modeResult = function (r, summary) {
    if (r.mode !== 'shanggu') return mr0(r, summary);
    var run = r.run, t = run.tier, last = r.idx === run.waves.length - 1;
    if (!summary && r.win && !last) {
      var nextHidden = r.idx === 2;
      return '<div class="dim"></div><div class="result win"><div class="banner">' + (r.idx === 3 ? '隱藏關' : '第 ' + (r.idx + 1) + ' 關') + ' 勝</div><div class="parch rbody"><div>' + U.esc(r.stage.name) + ' 通過。</div>' +
        (nextHidden ? '<div class="sg-hidden">寶窟深處出現了<b>隱藏關</b>！</div>' : '<div>存活的武將會帶著目前的生命與怒氣進入下一關。</div>') + '</div>' +
        '<div class="btn-row"><a class="btn" data-a="sgNext">' + (nextHidden ? '進入隱藏關' : '下一關') + '</a><a class="btn" data-a="sgSum">略過，看結算</a></div></div>';
    }
    var h = '<div class="dim"></div><div class="result ' + (run.full ? 'win' : 'lose') + '"><div class="banner">' + (run.hiddenWin ? '隱 藏 關 破' : (run.full ? '全 破' : '結 算')) + '</div><div class="parch rbody">' +
      '<div>' + U.esc(t.name) + '：通過 <b>' + Math.min(run.cleared, 3) + '/3</b> 關' + (run.hidden ? (run.hiddenWin ? '，並擊破隱藏關！' : '；隱藏關失利。') : (run.full ? '（這次沒有出現隱藏關）' : '。')) + '</div>' +
      (run.exp ? '<div>全隊經驗 +' + run.exp + '</div>' : '') + (run.levelUps.length ? '<div class="lvup">升級！' + U.esc(run.levelUps.join('、')) + '</div>' : '') +
      '<div class="rw-h">獲得獎勵</div>' + (run.rewards.length ? rl(run.rewards) : '<div>沒有通過任何一關，沒有獎勵。戰敗沒有懲罰，可以再挑戰。</div>') +
      (run.firstRewards ? '<div class="rw-h">首次獎勵</div>' + rl(run.firstRewards, 'first') : '') + '</div>' +
      '<div class="btn-row"><a class="btn" data-a="bShanggu">返回寶窟</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    return h;
  };
})();
