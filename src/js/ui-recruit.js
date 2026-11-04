/* 聚賢莊：刷新、拜訪（招募）、機率、結果動畫、解僱、將魂召喚 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  var TYPE_TIP = { '力敏': '物理．敏捷', '力耐': '物理．耐力', '智敏': '法術．敏捷', '智耐': '法術．耐力', '敏耐': '絕技．耐力' };
  UI.TYPE_TIP = TYPE_TIP;
  function candCard(id, i) {
    var d = R.heroDef(id), h = { id: id, lv: 1, eq: {} }, p = R.primary(h), cost = G.recruitCost(id);
    var s = MJ.S.state, afford = s.player.silver >= cost;
    return '<div class="cand ' + UI.qcls(d.quality) + (UI.sel.justRefreshed ? ' flip-in' : '') + '" style="-webkit-animation-delay:' + (i * 0.12) + 's;animation-delay:' + (i * 0.12) + 's">' +
      '<div class="cand-q">' + UI.qname(d.quality) + '</div>' +
      '<div class="cand-art">' + MJ.Art.portrait(d.look, d.quality) + '</div>' +
      '<div class="cand-name">' + U.esc(d.name) + '</div>' +
      '<div class="cand-type">' + d.type + '（' + TYPE_TIP[d.type] + '）</div>' +
      '<table class="mini-stats"><tr><td>力量</td><td>' + p.str + '</td><td>智力</td><td>' + p.int + '</td></tr><tr><td>敏捷</td><td>' + p.agi + '</td><td>耐力</td><td>' + p.con + '</td></tr></table>' +
      '<div class="cand-skill">技能：' + U.esc(d.active.name) + '／' + U.esc(d.ult.name) + (d.passive ? '<br>被動：' + MJ.D.heroes.passives[d.passive].name + (d.passive2 && MJ.D.heroes.passives[d.passive2] ? '、' + MJ.D.heroes.passives[d.passive2].name : '') : '') + (d.partner && R.heroDef(d.partner) ? '<br>連攜：' + U.esc(R.heroDef(d.partner).name) : '') + '</div>' +
      '<a class="btn small' + (afford ? '' : ' disabled') + '" data-a="doRecruit" data-v="' + id + '" data-why="銀幣不足（需要 ' + U.fmt(cost) + '）">拜訪 ' + UI.icon('silver') + U.fmt(cost) + '</a></div>';
  }
  UI.screens.recruit = function () {
    var s = MJ.S.state, cfg = MJ.D.config, tab = UI.sel.recTab || 'cands';
    var h = '<div class="scr recruit-scr">' + UI.hud();
    h += '<div class="frame bigframe"><div class="plaque">聚賢莊 Lv' + (s.buildings.juxian || 1) + '</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="tabs"><a class="tab' + (tab === 'cands' ? ' on' : '') + '" data-a="recTab" data-v="cands">拜訪武將</a><a class="tab' + (tab === 'roster' ? ' on' : '') + '" data-a="recTab" data-v="roster">我的武將</a><a class="tab' + (tab === 'souls' ? ' on' : '') + '" data-a="recTab" data-v="souls">將魂召喚</a></div>';
    h += '<div class="parch inner">';
    if (tab === 'cands') {
      h += '<div class="rec-left">';
      U.each(G.recruitKinds, function (k) {
        var x = G.recruitStatus(k), c = x.cfg;
        var label = x.cost ? '每次 ' + x.cost + ' 金' : '免費';
        var afford = s.player.gold >= x.cost;
        h += '<a class="rbtn rk-' + k + (afford ? '' : ' disabled') + '" data-a="doRefresh" data-v="' + k + '" data-why="金幣不足（' + c.name + '每次 ' + x.cost + ' 金）">' +
          '<b>' + c.name + '</b><span>' + label + '</span><span class="sub">無冷卻．不限次數</span></a>';
      });
      h += '<a class="link" data-a="showOdds">查看品質機率</a></div>';
      h += '<div class="cands">' + (s.recruit.cands.length ? U.map(s.recruit.cands, candCard).join('') : '<div class="empty">名單已空，請刷新</div>') + '</div>';
      UI.sel.justRefreshed = false;
      h += '<a class="link jx-link" data-a="recTab" data-v="roster">升級聚賢莊（武將上限 ' + R.rosterCap(s) + '）</a>';
    } else if (tab === 'roster') {
      var list = s.heroes.slice();
      var pg = UI.pager('roster', list, 10, function (hh) {
        var sel = UI.sel.rosterUid === hh.uid;
        return UI.portrait(hh, { act: 'rosterSel', sel: sel, badge: G.inTeam(hh.uid) != null ? '陣' : '' });
      });
      h += '<div class="roster-grid">' + pg.html + '</div>' + pg.nav;
      var hs = G.hero(UI.sel.rosterUid);
      h += '<div class="roster-side"><div class="roster-info">武將數 ' + s.heroes.length + '/' + R.rosterCap(s) + '　';
      if (hs) {
        var d = R.heroDef(hs.id);
        h += '已選：<b>' + U.esc(G.nameOf(hs)) + '</b> Lv' + hs.lv + '　';
        if (hs.id !== 'lead') h += '<a class="btn small red" data-a="doDismiss" data-v="' + hs.uid + '">' + (MJ.D.config.dismissSouls[d.quality] ? '解僱（得將魂 ×' + MJ.D.config.dismissSouls[d.quality] + '）' : '解僱（黑色不得將魂）') + '</a>';
        else h += '（主角不可解僱）';
      } else h += '點選武將可解僱，解僱後獲得該武將將魂。';
      h += '</div>';
      var jx = G.juxianInfo();
      h += '<div class="jx-up"><b>聚賢莊 Lv' + jx.lv + '</b>：武將上限 <b>' + jx.cap + '</b>　→　<b>Lv' + jx.next + '</b>：武將上限 <b class="g">' + jx.nextCap + '</b>' +
        '<span class="jx-cost">費用 ' + UI.icon('silver') + U.fmt(jx.cost) + '・需要主角 Lv' + jx.needLead + '</span>' +
        '<a class="btn small' + (jx.ok ? '' : ' disabled') + '" data-a="upBld" data-v="juxian" data-why="' + U.esc(jx.why) + '">升級</a>' +
        (jx.ok ? '' : '<span class="jx-why">' + U.esc(jx.why) + '</span>') + '</div></div>';
    } else {
      var souls = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('soul:') === 0 && s.bag.stack[k] > 0; });
      var pg2 = UI.pager('souls', souls, 8, function (k) {
        var id = k.slice(5), d = R.heroDef(id), have = s.bag.stack[k], owned = U.find(s.heroes, function (x) { return x.id === id; });
        return '<div class="soulrow ' + UI.qcls(d.quality) + '">' + MJ.Art.portrait(d.look, d.quality) + '<div><b>' + U.esc(d.name) + '</b>（' + UI.qname(d.quality) + '）<br>將魂 ' + have + '/' + d.souls + '</div>' +
          '<a class="btn small' + (owned || have < d.souls ? ' disabled' : '') + '" data-a="doSummon" data-v="' + id + '" data-why="' + (owned ? '已擁有此武將' : '將魂不足') + '">召喚</a></div>';
      }, '尚無將魂。解僱武將或在虛空之門戰鬥可獲得將魂。');
      h += '<div class="soul-list">' + pg2.html + '</div>' + pg2.nav;
    }
    h += '</div></div></div>';
    return h;
  };
  UI.actions.recTab = function (v) { UI.sel.recTab = v; UI.render(); };
  UI.actions.doRefresh = function (k) {
    var r = G.refresh(k, true); if (UI.res(r)) { UI.sel.justRefreshed = true; UI.render(); }
  };
  // A（官方圖）：招募確認視窗標題「招募武將」、按鈕「立即招募」
  UI.actions.doRecruit = function (id) {
    var d = R.heroDef(id), cost = G.recruitCost(id);
    UI.confirm('招募武將', '<div class="rc-box">' + MJ.Art.portrait(d.look, d.quality) + '<div>是否花費 <b>' + U.fmt(cost) + ' 銀幣</b> 招募<br><span class="qtag ' + UI.qcls(d.quality) + '">' + UI.qname(d.quality) + '</span> <b>' + U.esc(d.name) + '</b>（' + d.type + '）？<br><small>武將數 ' + MJ.S.state.heroes.length + '/' + R.rosterCap(MJ.S.state) + '</small></div></div>', function () {
      var r = G.recruit(id); if (!UI.res(r)) return;
      UI.render(); UI.open('recruitResult', r.hero.uid);
    }, '立即招募');
  };
  UI.modals.recruitResult = function (uid) {
    var h = G.hero(uid), d = R.heroDef(h.id), p = R.primary(h);
    return '<div class="dim" data-a="close"></div><div class="reveal ' + UI.qcls(d.quality) + '">' +
      '<div class="rays"></div><div class="reveal-stand"><div class="mc-wrap">' + MJ.Art.magicCircle() + '</div><div class="aura-wrap">' + MJ.Art.aura(d.quality) + '</div><div class="hero-fig">' + MJ.Art.figure(d.look) + '</div></div>' +
      '<div class="reveal-text"><span class="qtag ' + UI.qcls(d.quality) + '">' + UI.qname(d.quality) + '</span> ' + U.esc(d.name) + ' 加入麾下！</div>' +
      '<div class="reveal-sub">力量 ' + p.str + '　智力 ' + p.int + '　敏捷 ' + p.agi + '　耐力 ' + p.con + '</div>' +
      '<div class="btn-row"><a class="btn" data-a="recToTeam" data-v="' + uid + '">加入出戰</a><a class="btn" data-a="close">好的</a></div></div>';
  };
  UI.actions.recToTeam = function (uid) { var r = G.addToTeam(+uid); if (UI.res(r, '已加入出戰隊伍')) UI.close(); };
  UI.actions.showOdds = function () {
    var cfg = MJ.D.config, t = '<table class="odds"><tr><th></th>' + U.map(cfg.qualityNames.slice(0, 5), function (q, i) { return '<th class="q' + i + 't">' + q + '</th>'; }).join('') + '<th>每次</th><th>原版冷卻</th></tr>';
    U.each(G.recruitKinds, function (k) {
      var c = cfg.recruit[k];
      t += '<tr><td>' + c.name + '</td>' + U.map(c.odds, function (o) { return '<td>' + (o * 100).toFixed(1) + '%</td>'; }).join('') + '<td>' + (c.cost ? c.cost + ' 金' : '免費') + '</td><td>' + (c.cdMin >= 1440 ? c.cdMin / 1440 + ' 天' : c.cdMin + ' 分') + '</td></tr>';
    });
    t += '</table><p class="note">刷新種類與原版冷卻：B（巴哈姆特攻略）。單機版取消冷卻與每日次數，普通免費、其餘每次付金幣（本作改編，D）。機率：D（原作未公開，本作自訂）。首次紫金／至尊刷新保底藍／紫：B。</p>';
    UI.confirm('品質機率', t, null, '知道了');
    var btns = UI.$('confirm').getElementsByClassName('btn'); if (btns[1]) btns[1].style.display = 'none';
  };
  UI.actions.rosterSel = function (uid) { UI.sel.rosterUid = +uid; UI.render(); };
  UI.actions.doDismiss = function (uid) {
    var h = G.hero(+uid);
    UI.confirm('解僱武將', '確定解僱 <b>' + U.esc(G.nameOf(h)) + '</b>？身上裝備會放回包裹。', function () {
      var r = G.dismiss(+uid); if (UI.res(r, r.souls ? '獲得將魂 ×' + r.souls : '已解僱（黑色武將不得將魂）')) { UI.sel.rosterUid = null; UI.render(); }
    }, '解僱');
  };
  UI.actions.doSummon = function (id) { var r = G.summon(id); if (UI.res(r, '召喚成功')) UI.render(); };
})();
