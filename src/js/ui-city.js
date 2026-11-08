/* 主城：浮空島建築、左上角色資訊、上方貨幣、禮包、底部功能列、系統訊息 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  // 建築位置（版面參考 A 級截圖：浮空島 + 瀑布；座標為自訂）
  var B = [
    { k: 'shenwu', x: 365, y: 52, w: 220, act: 'hall' },
    { k: 'juxian', x: 112, y: 112, w: 190, act: 'recruit' },
    { k: 'xukong', x: 636, y: 118, w: 190, act: 'gate' },
    { k: 'tongtian', x: 836, y: 186, w: 118, act: 'tower' },
    { k: 'shenbing', x: 18, y: 318, w: 165, act: 'forge' },
    { k: 'baifang', x: 200, y: 336, w: 148, act: 'arena' },
    { k: 'farm', x: 384, y: 318, w: 186, act: 'farm' },
    { k: 'jiangxing', x: 592, y: 336, w: 148, act: 'jxl' },
    { k: 'wuji', x: 762, y: 336, w: 148, act: 'wuji' }
  ];
  UI.hud = function () {
    var s = MJ.S.state, lead = G.lead();
    var h = '<div class="hud-tl frame-s">' +
      '<div class="avatar" data-a="hall">' + MJ.Art.portrait(s.player.look, 3) + '<span class="lvb big">' + lead.lv + '</span></div>' +
      '<div class="hud-info"><div class="pname">' + U.esc(s.player.name) + '</div>' +
      UI.bar(lead.exp, R.expNeed(lead.lv), 'exp', '經驗 ' + lead.exp + '/' + R.expNeed(lead.lv)) +
      '<div class="erow pw">戰力 <b>' + U.fmt(G.myPower ? G.myPower() : 0) + '</b></div></div></div>';
    h += '<div class="hud-top">' +
      '<div class="cur" title="金幣">' + UI.icon('gold') + '<b>' + U.fmt(s.player.gold) + '</b><a class="plus" data-a="info" data-v="單機版沒有儲值；金幣可從任務、首通與禮包取得">+</a></div>' +
      '<div class="cur" title="銀幣">' + UI.icon('silver') + '<b>' + U.fmt(s.player.silver) + '</b></div>' +
      (UI.muteBtn ? UI.muteBtn() : '') +
      '<a class="cur mailbtn" data-a="open" data-v="mail">' + UI.icon('mail') + (U.filter(s.mail, function (m) { return !m.claimed; }).length ? '<i class="dot"></i>' : '') + '</a>' +
      '</div>';
    return h;
  };
  UI.screens.city = function () {
    var s = MJ.S.state, lead = G.lead(), cfg = MJ.D.config;
    var h = '<div class="city">' + MJ.Art.sky();
    U.each(B, function (b) {
      var c = cfg.buildings[b.k], lv = s.buildings[b.k] || 1, unlocked = b.k === 'jiangxing' ? G.buildingOpen(b.k) : lead.lv >= c.open, locked = !unlocked, phase = c.phase;
      var tag = phase ? '第' + ['', '一', '二', '三', '四'][phase] + '階段開放' : (locked ? '需要等級 ' + c.open : 'Lv' + lv);
      if (phase && locked) tag = '需要等級 ' + c.open;
      var act = (!phase && !locked && b.act) ? b.act : 'bLocked';
      h += '<div class="bld' + (phase || locked ? ' locked' : '') + '" style="left:' + b.x + 'px;top:' + b.y + 'px;width:' + b.w + 'px;height:' + b.w + 'px" data-a="' + act + '" data-v="' + b.k + '">' +
        MJ.Art.building(b.k) + '<div class="bname"><b>' + U.esc(c.name) + '</b><span>' + U.esc(tag) + '</span></div></div>';
    });
    h += UI.hud();
    // 出戰隊伍
    h += '<div class="team-strip frame-s" data-a="open" data-v="formation"><span class="ts-t">出戰</span>';
    U.each(G.teamList(), function (x) { h += UI.portrait(x.hero, { cls: 'mini' }); });
    h += '<span class="ts-n">' + G.teamCount() + '/' + R.teamSlots(lead.lv) + '</span></div>';
    // 禮包
    var ft = G.freeGiftState(), sd = G.sevenDayState();
    h += '<div class="gifts">';
    if (!s.gifts.opening) h += '<a class="gift" data-a="giftOpening">' + UI.icon('gift') + '<span>開服大禮包</span></a>';
    if (sd.claimed < 7) h += '<a class="gift' + (sd.canClaim ? '' : ' dim2') + '" data-a="giftSeven">' + UI.icon('chest') + '<span>七日禮包</span>' + (sd.canClaim ? '<i class="dot"></i>' : '') + '</a>';
    h += '<a class="gift' + (ft.ready ? '' : ' dim2') + '" data-a="giftFree">' + UI.icon('gift') + '<span>' + (ft.ready ? '免費禮物' : '再勝' + ft.left + '場') + '</span>' + (ft.ready ? '<i class="dot"></i>' : '') + '</a>';
    h += '<a class="gift" data-a="open" data-v="tasks">' + UI.icon('quest') + '<span>任務</span>' + (UI.taskDot && UI.taskDot() ? '<i class="dot"></i>' : '') + '</a>';
    if (G.signState) { var sgs = G.signState(); h += '<a class="gift' + (sgs.signedToday ? ' dim2' : '') + '" data-a="openSign">' + UI.icon('scroll2') + '<span>簽到</span>' + (sgs.signedToday ? '' : '<i class="dot"></i>') + '</a>'; }
    if (G.qiyuOpen && G.qiyuOpen()) h += '<a class="gift" data-a="open" data-v="qiyu">' + UI.icon('star') + '<span>奇遇</span>' + (UI.qiyuDot && UI.qiyuDot() ? '<i class="dot"></i>' : '') + '</a>';
    h += '<a class="gift" data-a="open" data-v="originalModes">' + UI.icon('scroll2') + '<span>原版玩法</span></a>';
    h += '</div>';
    // 系統訊息
    h += '<div class="chat" id="chat">' + UI.chatHtml() + '</div>';
    // 底部功能列（A：道具、陣法、日志、郵件、商城、設置）
    h += '<div class="bottombar">';
    U.each([['bag', '道具', 'bag'], ['formation', '陣法', 'formation'], ['log', '日志', 'scroll'], ['mail', '郵件', 'mail'], ['shop', '商城', 'shop'], ['provenance', '考證', 'scroll2'], ['settings', '設置', 'gear']], function (x) {
      h += '<a class="bb" data-a="open" data-v="' + x[0] + '">' + UI.icon(x[2]) + '<span>' + x[1] + '</span></a>';
    });
    h += '</div></div>';
    return h;
  };
  UI.chatHtml = function () {
    var lines = G.chatLines.length ? G.chatLines : ['【系統】歡迎來到猛將無雙（單機重製版）'];
    return U.map(lines.slice(0, 3), function (l) { return '<div>' + U.esc(l) + '</div>'; }).join('');
  };
  UI.actions.bLocked = function (k) {
    var c = MJ.D.config.buildings[k];
    var unlocked = k === 'jiangxing' ? G.buildingOpen(k) : G.lead().lv >= c.open;
    UI.toast(c.name + '：' + (!unlocked ? '需要等級 ' + c.open + '。' : '') + (c.phase ? '此功能預定於第' + ['', '一', '二', '三', '四'][c.phase] + '階段開放。' : ''));
  };
  UI.actions.hall = function () { UI.go('hall'); };
  UI.actions.recruit = function () { UI.go('recruit'); };
  UI.actions.gate = function () { UI.go('gate'); };
  UI.actions.city = function () { UI.go('city'); };
  UI.actions.giftOpening = function () { var r = G.claimOpening(); if (UI.res(r)) { UI.render(); UI.rewardBox('開服大禮包', r.got); } };
  UI.actions.giftSeven = function () { var r = G.claimSevenDay(); if (UI.res(r)) { UI.render(); UI.rewardBox('七日禮包 第 ' + r.day + ' 天', r.got); } };
  UI.actions.giftFree = function () { var r = G.claimFreeGift(); if (UI.res(r)) { UI.render(); UI.rewardBox('免費禮物', r.got); } };
})();
