/* 神武殿：裝備／技能／訓練（版面依 A 級截圖：左屬性、中人物與四格裝備、右包裹、下方武將列） */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  var SN = G.SLOT_NAMES;
  function pct(v) { return (v || 0).toFixed(2); }
  // 修正（攻擊範圍看不到）：攻擊格以「施放者自己」為起點（綠格＝自己，紅格＝往前打到的格；A：巴哈 sn282 技能說明圖）
  // 版面：最左一欄是自己這一側（綠格），往右依序是正前方第 1、2、3 格
  function patternGrid(p, row, skill) {
    if (p === 'all' || p === 'healAll') {
      var h0 = '<div class="pgrid">';
      for (var k = 0; k < 9; k++) h0 += '<i class="on' + (p === 'healAll' ? ' heal' : '') + '"></i>';
      return h0 + '</div>';
    }
    var rw = row == null ? 1 : row, offs = MJ.Battle.rangeOffsets(skill || { pattern: p }, rw), mc = 2;
    U.each(offs, function (o) { mc = Math.max(mc, o[1]); });
    var cols = mc + 2, sz = Math.floor(46 / Math.max(3, cols)) - 2;
    // 三列是實際的上／中／下列（不在格子上時以中列示意）；超出棋盤的位移不畫
    var h = '<div class="pgrid rgrid" style="width:' + (cols * (sz + 2) + 2) + 'px;height:' + (3 * (sz + 2) + 2) + 'px">';
    for (var r = 0; r < 3; r++) for (var c = 0; c < cols; c++) {
      var dr = r - rw, dc = c - 1, on = c > 0 && U.find(offs, function (o) { return o[0] === dr && o[1] === dc; });
      h += '<i style="width:' + sz + 'px;height:' + sz + 'px" class="' + (c === 0 && dr === 0 ? 'me' : on ? 'on' : '') + '"></i>';
    }
    return h + '</div>';
  }
  UI.patternGrid = patternGrid;
  UI.screens.hall = function () {
    var s = MJ.S.state, tab = UI.sel.hallTab || 'equip';
    var h0 = G.hero(UI.sel.hallUid) || G.lead(); UI.sel.hallUid = h0.uid;
    var d = R.derived(h0, s), def = R.heroDef(h0.id), type = R.typeOf(h0, s);
    var h = '<div class="scr hall-scr">';
    h += '<div class="frame bigframe hall"><div class="plaque">神武殿</div><a class="xbtn" data-a="city">×</a>';
    var bs = R.battleStats(h0, s);
    h += '<div class="tabs">' + U.map([['equip', '裝備'], ['skill', '技能'], ['peiyang', '培養'], ['xinfa', '心法'], ['star', '升階'], ['train', '訓練']], function (t) { return '<a class="tab' + (tab === t[0] ? ' on' : '') + '" data-a="hallTab" data-v="' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</div>';
    // 左：屬性
    h += '<div class="parch statpanel"><div class="sp-name">' + U.esc(G.nameOf(h0)) + (h0.id === 'lead' ? '(主)' : '') + ' <span>Lv' + h0.lv + '</span></div>' +
      '<div class="sp-type">' + type + (h0.id === 'lead' ? '．主角' : '．' + UI.qname(def.quality) + '品') + '</div>' +
      UI.bar(h0.exp, R.expNeed(h0.lv), 'exp', h0.exp + '/' + R.expNeed(h0.lv)) +
      '<table class="stats">' +
      '<tr><td>力量</td><td>' + d.str + '</td><td>智力</td><td>' + d.int + '</td></tr>' +
      '<tr><td>敏捷</td><td>' + d.agi + '</td><td>耐力</td><td>' + d.con + '</td></tr>' +
      '<tr class="sep"><td>物攻</td><td>' + d.patk + '</td><td>法攻</td><td>' + d.matk + '</td></tr>' +
      '<tr><td>絕攻</td><td>' + d.jatk + '</td><td>生命</td><td>' + d.hp + '</td></tr>' +
      '<tr><td>物防</td><td>' + d.pdef + '</td><td>法防</td><td>' + d.mdef + '</td></tr>' +
      '<tr><td>絕防</td><td>' + d.jdef + '</td><td>命中</td><td>' + pct(d.hit) + '</td></tr>' +
      '<tr><td>暴擊</td><td>' + pct(d.crit) + '</td><td>閃避</td><td>' + pct(d.dodge) + '</td></tr>' +
      '<tr class="sep p4st"><td>抵抗</td><td>' + pct(d.res || 0) + '</td><td>施加</td><td>' + pct(d.dbf || 0) + '</td></tr>' +
      '<tr class="p4st"><td>PVP</td><td>' + pct(d.pvp || 0) + '</td><td>PVE</td><td>' + pct(d.pve || 0) + '</td></tr></table>' +
      '<div class="sp-team">傷害：' + MJ.D.config.damageTypes[d.dtype] + (h0.star ? '　' + UI.stars(h0.star) : '') + '<br>含全隊加成：攻 ' + Math.max(bs.patk, bs.matk, bs.jatk) + '　命 ' + bs.hp + '</div>' +
      '<div class="sp-btns"><a class="btn small" data-a="open" data-v="heroCompare">成長比較</a>' + (G.inTeam(h0.uid) != null ? (h0.id === 'lead' ? '<span class="tagok">出戰中</span>' : '<a class="btn small" data-a="hallRest" data-v="' + h0.uid + '">休息</a>') : '<a class="btn small" data-a="hallJoin" data-v="' + h0.uid + '">出戰</a>') +
      (h0.id !== 'lead' && s.bag.stack.tufeiling ? '<a class="btn small" data-a="useTufei" data-v="' + h0.uid + '">突飛令 ×' + s.bag.stack.tufeiling + '</a>' : '') + '</div></div>';
    // 中
    h += '<div class="hall-center"><div class="starry"></div><div class="rock"></div><div class="mc-wrap">' + MJ.Art.magicCircle() + '</div><div class="aura-wrap">' + MJ.Art.aura(h0.id === 'lead' ? 3 : def.quality) + '</div><div class="hero-fig">' + MJ.Art.figure(h0.id === 'lead' ? s.player.look : def.look, { cape: h0.id === 'lead' }) + '</div>';
    if (tab === 'equip') {
      U.each(G.SLOTS, function (sl, i) {
        var e = h0.eq[sl];
        h += '<div class="eslot es' + i + '">' + (e ? UI.equipCell(e, { act: 'slotClick' }) .replace('data-v="' + e.uid + '"', 'data-v="' + sl + '"') : '<div class="ecell empty-slot" data-a="info" data-v="' + SN[sl] + '：從右側包裹點選裝備">' + SN[sl] + '</div>') + '</div>';
      });
      h += '<div class="hc-btns"><a class="btn small" data-a="autoEq" data-v="' + h0.uid + '">最強</a><a class="btn small" data-a="open" data-v="heroDetail">詳情</a></div>';
    }
    h += '</div>';
    // 右
    h += '<div class="parch rightpanel">';
    if (tab === 'equip') {
      var et = UI.sel.bagSlot || 'weapon';
      h += '<div class="tabs small">' + U.map(G.SLOTS, function (sl) { return '<a class="tab' + (et === sl ? ' on' : '') + '" data-a="bagSlot" data-v="' + sl + '">' + SN[sl] + '</a>'; }).join('') + '</div>';
      // P5：武器分 物攻／法攻／絕技 三類（決定 4），可篩選
      var wk = et === 'weapon' ? (UI.sel.wKind || '') : '';
      if (et === 'weapon') h += '<div class="wkind">' + U.map([['', '全部'], ['p', '物攻'], ['m', '法攻'], ['j', '絕技']], function (k) { return '<a class="chip' + (wk === k[0] ? ' on' : '') + '" data-a="wKind" data-v="' + k[0] + '">' + k[1] + '</a>'; }).join('') + '</div>';
      var hq = UI.sel.hallQ == null ? '' : UI.sel.hallQ;
      h += UI.qualityChips('hallQ', hq);
      var items = U.filter(s.bag.equips, function (e) { var tp = R.equipTpl(e.t); return tp.slot === et && (!wk || tp.id.charAt(1) === wk) && (hq === '' || e.q === +hq); });
      items.sort(function (a, b) { return b.q - a.q || R.equipScore(b) - R.equipScore(a); });
      var pg = UI.pager('hallbag', items, 12, function (e) { return UI.equipCell(e, { act: 'bagPick', sel: UI.sel.bagPick === e.uid }); }, '沒有' + SN[et]);
      h += '<div class="egrid">' + pg.html + UI.padSlots('hallbag', items, 12) + '</div>' + pg.nav;
      var pick = U.find(s.bag.equips, function (e) { return e.uid === UI.sel.bagPick; });
      if (pick) {
        var tpl = R.equipTpl(pick.t), cur = h0.eq[tpl.slot];
        h += '<div class="einfo"><b class="eqt' + pick.q + '">' + MJ.D.config.equipQualityNames[pick.q] + '．' + U.esc(tpl.name) + (pick.plus ? ' +' + pick.plus : '') + '</b>（需 Lv' + tpl.lv + '）<br>' + UI.equipLines(R.equipStats(pick)).join('　') +
          (cur ? '<br><span class="cmp">目前：' + UI.equipLines(R.equipStats(cur)).join('　') + '</span>' : '') +
          '<div class="btn-row"><a class="btn small' + (h0.lv < tpl.lv ? ' disabled' : '') + '" data-why="需要等級 ' + tpl.lv + '" data-a="doEquip" data-v="' + pick.uid + '">穿上</a><a class="btn small red" data-a="doSell" data-v="' + pick.uid + '">賣出 ' + R.equipSell(pick) + ' 銀</a></div></div>';
      }
    } else if (UI.hallTabs[tab]) {
      h += UI.hallTabs[tab](h0, s, def);
    } else {
      var tc = G.trainCost(h0), tn = G.TRAIN_MIN * G.trainRate(h0), ab = G.trainAbsorbable(h0), eff = Math.min(tn, ab);
      h += '<div class="train"><b>訓練</b>（神武殿 Lv' + (s.buildings.shenwu || 1) + '）<br>';
      h += '立即完成，不用等待，可重複。<br>' + U.esc(G.nameOf(h0)) + ' 每次經驗 +' + U.fmt(tn) + '，花費 ' + U.fmt(tc) + ' 銀幣' + (ab <= 0 ? '<br><b>武將等級已達主角等級上限，無法再吸收經驗</b>' : (eff < tn ? '（受等級上限影響，預計實際可獲得 +' + U.fmt(eff) + ' 經驗）' : '，預計實際可獲得 +' + U.fmt(eff) + ' 經驗')) + '<div class="btn-row"><a class="btn small' + (ab <= 0 ? ' disabled' : (s.player.silver >= tc ? '' : ' disabled')) + '" data-why="' + (ab <= 0 ? '武將等級已達主角等級上限' : '銀幣不足（需要 ' + U.fmt(tc) + '）') + '" data-a="startTrain" data-v="' + h0.uid + '">立即訓練</a></div>';
      var lv = s.buildings.shenwu || 1;
      h += '<hr><b>升級神武殿</b>：訓練速度 +10%／級<br>費用 ' + U.fmt(G.buildingCost('shenwu', lv)) + ' 銀幣<div class="btn-row"><a class="btn small" data-a="upBld" data-v="shenwu">升級</a></div>';
      h += '<p class="note">武將等級不能超過主角。</p></div>';
    }
    h += '</div>';
    // 下：武將列
    var list = s.heroes.slice();
    var pgh = UI.pager('hallheroes', list, 8, function (x) { return UI.portrait(x, { act: 'hallSel', sel: x.uid === h0.uid, badge: G.inTeam(x.uid) != null ? '陣' : '' }); });
    var locked = Math.max(0, 8 - (pgh.html.split('class="card').length - 1));
    var lockHtml = ''; for (var i = 0; i < Math.min(locked, R.rosterCap(s) - s.heroes.length); i++) lockHtml += '<div class="card lockslot"><span>將</span></div>';
    var power = 0; U.each(G.teamList(), function (x) { power += R.power(x.hero, s); });
    h += '<div class="hall-bottom"><div class="hrow">' + pgh.html + lockHtml + '</div>' + pgh.nav +
      '<div class="hb-info">武將數 ' + s.heroes.length + '/' + R.rosterCap(s) + '<br>戰鬥力 <b>' + U.fmt(power) + '</b></div><a class="btn" data-a="city">返回</a></div>';
    h += '</div></div>';
    return h;
  };
  UI.actions.hallTab = function (v) { UI.sel.hallTab = v; UI.render(); };
  UI.actions.hallSel = function (v) { UI.sel.hallUid = +v; UI.sel.bagPick = null; UI.render(); };
  UI.actions.wKind = function (v) { UI.sel.wKind = v || ''; UI.sel.bagPick = null; UI.page.hallbag = 0; UI.render(); };
  UI.actions.bagSlot = function (v) { UI.sel.bagSlot = v; UI.sel.bagPick = null; UI.page.hallbag = 0; UI.render(); };
  UI.actions.hallQ = function (v) { UI.sel.hallQ = v; UI.sel.bagPick = null; UI.page.hallbag = 0; UI.render(); };
  UI.actions.bagPick = function (v) { UI.sel.bagPick = +v; UI.render(); };
  UI.actions.doEquip = function (v) { var r = G.equip(UI.sel.hallUid, +v); if (UI.res(r, '已穿上')) { UI.sel.bagPick = null; UI.render(); } };
  UI.actions.slotClick = function (slot) {
    var h = G.hero(UI.sel.hallUid), e = h.eq[slot], tpl = R.equipTpl(e.t);
    UI.confirm(SN[slot], '<b class="eqt' + e.q + '">' + U.esc(tpl.name) + (e.plus ? ' +' + e.plus : '') + '</b><br>' + UI.equipLines(R.equipStats(e)).join('　') + (e.gems && e.gems.length ? '<br>寶石：' + U.map(e.gems, function (g) { return G.itemName(g); }).join('、') : ''), function () {
      var r = G.unequip(h.uid, slot); if (UI.res(r, '已卸下')) UI.render();
    }, '卸下');
  };
  UI.actions.autoEq = function (v) { var r = G.autoEquip(+v); if (UI.res(r, r.changed ? '已換上最強裝備（' + r.changed + ' 件）' : '目前已是最佳搭配')) UI.render(); };
  UI.actions.doSell = function (v) { var r = G.sellEquip(+v); if (UI.res(r, '獲得 ' + r.silver + ' 銀幣')) { UI.sel.bagPick = null; UI.render(); } };
  UI.actions.hallJoin = function (v) { if (UI.res(G.addToTeam(+v), '已加入出戰')) UI.render(); };
  UI.actions.hallRest = function (v) { if (UI.res(G.removeFromTeam(+v), '已下陣休息')) UI.render(); };
  UI.actions.useTufei = function (v) { var r = G.useItem('tufeiling', +v); if (UI.res(r, r.msg)) UI.render(); };
  UI.actions.startTrain = function (v) { var r = G.trainNow(+v); if (UI.res(r, r.ok ? r.name + ' 經驗 +' + U.fmt(r.exp) + (r.up ? '，升到 ' + r.up + ' 級' : '') : '')) UI.render(); };
  UI.actions.stopTrain = function () { var r = G.stopTrain(); if (UI.res(r, r.name + ' 獲得 ' + r.exp + ' 經驗')) UI.render(); };
  UI.actions.upBld = function (k) { if (UI.res(G.upgradeBuilding(k), '升級成功')) UI.render(); };
  UI.modals.heroDetail = function () {
    var s = MJ.S.state, h0 = G.hero(UI.sel.hallUid), def = R.heroDef(h0.id);
    var t = '<div class="parch detail"><b>' + U.esc(G.nameOf(h0)) + '</b>（' + U.esc(def.faction) + '）<br>' +
      '品質：' + (h0.id === 'lead' ? '主角' : UI.qname(def.quality)) + '　類型：' + R.typeOf(h0, s) + '<br>' +
      '每級成長：力 ' + (h0.id === 'lead' ? MJ.D.config.leadTypes[R.leadTypeOf(s)].growth.str : def.growth.str) + '　智 ' + (h0.id === 'lead' ? MJ.D.config.leadTypes[R.leadTypeOf(s)].growth.int : def.growth.int) + '　敏 ' + (h0.id === 'lead' ? MJ.D.config.leadTypes[R.leadTypeOf(s)].growth.agi : def.growth.agi) + '　耐 ' + (h0.id === 'lead' ? MJ.D.config.leadTypes[R.leadTypeOf(s)].growth.con : def.growth.con) + '<br>' +
      '單人戰鬥力：' + U.fmt(R.power(h0, s)) + '<br>' +
      '傷害類型：' + MJ.D.config.damageTypes[R.derived(h0, s).dtype] + '　升階：' + (h0.star || 0) + '/5<br>' +
      '<p class="note">屬性公式：物攻 = 力量×5+5（力系）、物防 = 力×0.5+耐×0.67、法防 = 智×0.5+耐×0.42、生命 = 耐×20+等級×13。絕技攻 = 敏×5+5（敏耐型）、絕技防 = 敏×0.6+耐×0.3。培養、升階、心法加成在四維/屬性內；將星錄、圖鑑、陣法為全隊加成，只在戰鬥時套用。</p></div>';
    return UI.panel('武將詳情', t, { cls: 'narrow' });
  };
})();
