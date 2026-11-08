/* 第二階段介面：神武殿 技能／培養／心法／升階 分頁、神兵坊、將星錄、圖鑑 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  function C() { return MJ.D.config; }
  function have(k) { return MJ.S.state.bag.stack[k] || 0; }
  function itemsLine(o) { return U.map(U.keys(o), function (k) { return G.itemName(k) + ' ' + have(k) + '/' + o[k]; }).join('　'); }
  UI.hallTabs = {};

  // ---------- 技能 ----------
  function skillRow(h0, w, base, sub) {
    var lv = R.skillLv(h0, w), x = w === 'p' ? null : R.skillOf(h0, w), cost = G.skillUpCost(h0, w), shen = lv > C().skill.maxLv;
    var lab = G.SKILL_NAMES[w], out = '<div class="skill3' + (shen ? ' shen' : '') + '"><div class="sk-lab">' + lab.charAt(0) + '<br>' + lab.charAt(1) + '</div>';
    if (w === 'p') {
      var ps = base ? MJ.D.heroes.passives[base] : null;
      out += '<div class="pgrid none"></div><div class="sk-d">' + (ps ? '<b>' + ps.name + (shen ? '·神' : '') + '</b> <span class="sklv">' + (shen ? '神' : 'Lv' + lv) + '</span><br>' + U.esc(ps.desc) + '<br><small>效果 ×' + R.passiveMul(h0).toFixed(2) + '</small>' : '<b>無</b><br><small>此武將沒有被動技能</small>');
    } else {
      out += UI.patternGrid(x.pattern, null, x) + '<div class="sk-d"><b>' + U.esc(x.name) + '</b> <span class="sklv">' + (shen ? '神' : 'Lv' + lv) + '</span><br>範圍：' + MJ.D.heroes.patterns[x.pattern] + '　倍率：' + (x.pattern === 'healAll' ? '治療 ' : '') + Math.round(x.mult * 100) + '%' + (x.flat ? ' + ' + x.flat : '') +
        (x.fx && x.fx.stun ? '　' + Math.round(x.fx.stun * 100) + '% 眩暈' : '') + (x.fx && x.fx.armorBreak ? '　' + Math.round(x.fx.armorBreak * 100) + '% 破甲' : '') + (x.fx && x.fx.buffDef ? '　全隊物防 +' + Math.round(x.fx.buffDef * 100) + '%' : '') + '<br><small>' + sub + '</small>';
    }
    if ((w !== 'p' || base) && cost) out += '<div class="sk-up"><small>' + U.fmt(cost.silver) + ' 銀　' + itemsLine(cost.items) + '</small><a class="btn small" data-a="skUp" data-v="' + w + '">' + (lv === C().skill.maxLv ? '突破·神' : '升級') + '</a></div>';
    return out + '</div></div>';
  }
  UI.hallTabs.skill = function (h0, s, def) {
    var h = skillRow(h0, 'a', def.active, '每次行動施放') + skillRow(h0, 'u', def.ult, '無雙值滿 100 時施放') + skillRow(h0, 'p', def.passive, '');
    return h + '<p class="note">三技能欄（A：官方圖）。「·神」階（A：影片 3）。升級倍率 +6%/級、·神 +20%、被動效果 +8%/級（D）。技能等級不可超過武將等級。</p>';
  };
  UI.actions.skUp = function (w) { var r = G.skillUp(UI.sel.hallUid, w); if (UI.res(r, r.shen ? '技能突破為「·神」！' : '技能升到 ' + r.lv + ' 級')) UI.render(); };

  // ---------- 培養 ----------
  UI.hallTabs.peiyang = function (h0, s) {
    var cap = R.peiyangCap(h0), p = h0.py, pend = h0.pyPending, N = { str: '力量', int: '智力', agi: '敏捷', con: '耐力' };
    var h = '<div class="py"><b>培養</b>：消耗培養丹，隨機改變四維加成（每項上限 ' + cap + '，隨等級提高）<table class="stats py-t"><tr><th></th><th>目前</th>' + (pend ? '<th>新結果</th>' : '') + '</tr>';
    U.each(['str', 'int', 'agi', 'con'], function (a) {
      var dlt = pend ? pend[a] - p[a] : 0;
      h += '<tr><td>' + N[a] + '</td><td>+' + p[a] + '</td>' + (pend ? '<td class="' + (dlt > 0 ? 'up' : dlt < 0 ? 'down' : '') + '">+' + pend[a] + (dlt ? '（' + (dlt > 0 ? '+' : '') + dlt + '）' : '') + '</td>' : '') + '</tr>';
    });
    h += '</table>';
    if (pend) h += '<div class="btn-row"><a class="btn small" data-a="pyOk">保留</a><a class="btn small red" data-a="pyNo">放棄</a></div>';
    else {
      var c = C().peiyang;
      h += '<div class="btn-row"><a class="btn small" data-a="pyDo" data-v="normal">普通培養</a><a class="btn small" data-a="pyDo" data-v="strong">加強培養</a></div>' +
        '<small>普通：培養丹×' + c.normal.dan + '＋' + U.fmt(c.normal.silver) + ' 銀（' + c.normal.lo + '～+' + c.normal.hi + '）<br>加強：培養丹×' + c.strong.dan + '＋' + U.fmt(c.strong.silver) + ' 銀（' + c.strong.lo + '～+' + c.strong.hi + '）<br>持有培養丹：' + have('peiyangdan') + '</small>';
    }
    return h + '<p class="note">培養功能：B（攻略提及神武殿培養）；數值、上限：D。</p></div>';
  };
  UI.actions.pyDo = function (m) { var r = G.peiyang(UI.sel.hallUid, m); if (UI.res(r)) UI.render(); };
  UI.actions.pyOk = function () { if (UI.res(G.peiyangAccept(UI.sel.hallUid), '已保留培養結果')) UI.render(); };
  UI.actions.pyNo = function () { if (UI.res(G.peiyangCancel(UI.sel.hallUid), '已放棄')) UI.render(); };

  // ---------- 心法 ----------
  UI.hallTabs.xinfa = function (h0, s) {
    var n = R.xinfaSlots(h0), h = '<div class="xf"><b>心法</b>（欄位 ' + n + '/2，於 ' + C().xinfaSlots.join('/') + ' 級開放；第一格普通／第二格特殊）';
    for (var i = 0; i < 2; i++) {
      var x = h0.xf[i], c = x && C().xinfa[x.id];
      if (x) {
        var cost = G.xinfaUpCost(x);
        h += '<div class="row-item xf-row">' + UI.icon('scroll2') + '<div class="ri-t"><b>' + c.name + ' Lv' + x.lv + '</b><small>' + c.desc + '（目前 +' + (c.flat ? (c.flat * x.lv).toFixed(1) : c.pct * x.lv + '%') + '）' + (x.lv < C().xinfaMax ? '<br>升級：殘頁 ' + have('xinfacanye') + '/' + cost.pages + '　' + U.fmt(cost.silver) + ' 銀' : '<br>已滿級') + '</small></div>' +
          (x.lv < C().xinfaMax ? '<a class="btn small" data-a="xfUp" data-v="' + i + '">升級</a>' : '') + '<a class="btn small red" data-a="xfForget" data-v="' + i + '">遺忘</a></div>';
      } else if (i < n) h += '<div class="row-item xf-row empty">空欄位</div>';
      else h += '<div class="row-item xf-row empty dim2">' + (C().xinfaSlotTypes && C().xinfaSlotTypes[i] === 'special' ? '60 級特殊欄開放' : '1 級普通欄開放') + '</div>';
    }
    var books = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('xf_') === 0 && s.bag.stack[k] > 0; });
    h += '<b>可修練秘笈</b><div class="xf-books">' + (books.length ? U.map(books, function (k) { var it = MJ.D.equipment.items[k]; return '<a class="btn small" data-a="xfLearn" data-v="' + it.xinfa + '">' + C().xinfa[it.xinfa].name + ' ×' + s.bag.stack[k] + '</a>'; }).join('') : '<small>沒有秘笈（王關、隱藏關、商城可取得）</small>') + '</div>';
    return h + '<p class="note">心法：B（攻略提及）；種類與效果：D。遺忘會退回秘笈，但等級歸零。</p></div>';
  };
  UI.actions.xfLearn = function (id) { var r = G.xinfaLearn(UI.sel.hallUid, id); if (UI.res(r, r.msg)) UI.render(); };
  UI.actions.xfUp = function (i) { var r = G.xinfaUp(UI.sel.hallUid, +i); if (UI.res(r, '心法升到 ' + r.lv + ' 級')) UI.render(); };
  UI.actions.xfForget = function (i) { UI.confirm('遺忘心法', '確定遺忘？秘笈會退回包裹，但已升的等級會消失。', function () { if (UI.res(G.xinfaForget(UI.sel.hallUid, +i), '已遺忘，秘笈已退回')) UI.render(); }, '遺忘'); };

  // ---------- 升階（將魂） ----------
  UI.hallTabs.star = function (h0, s) {
    var h = '<div class="xf"><b>將魂升階</b>　' + UI.stars(h0.star || 0) + '<br>';
    if (h0.id === 'lead') return h + '<small>主角沒有將魂，請以裝備、培養、心法提升。</small></div>';
    var k = 'soul:' + h0.id, cost = R.starCost(h0), max = C().star.max;
    h += '每階四維 +' + Math.round(C().star.perStar * 100) + '%（目前 +' + Math.round((h0.star || 0) * C().star.perStar * 100) + '%）<br>';
    if ((h0.star || 0) < max) h += '下一階需要 ' + R.heroDef(h0.id).name + ' 將魂：<b>' + have(k) + '/' + cost + '</b><div class="btn-row"><a class="btn small" data-a="starUp">升階</a></div>';
    else h += '<b>已達最高階</b>';
    h += '<small>將魂來源：重複招募的武將解僱、王關／隱藏關掉落、農田英魂草。此處一般升階與將星錄將星等級為不同系統，消耗分開計算。</small>';
    return h + '<p class="note">將魂：A（截圖有「將魂」道具）；升階規則與數值：D。</p></div>';
  };
  UI.actions.starUp = function () { var r = G.starUp(UI.sel.hallUid); if (UI.res(r, '升到 ' + r.star + ' 階！')) UI.render(); };

  // ---------- 神兵坊 ----------
  function allEquips() {
    var s = MJ.S.state, out = [];
    U.each(s.heroes, function (h) { U.each(R.SLOTS, function (sl) { if (h.eq[sl]) out.push({ e: h.eq[sl], h: h }); }); });
    U.each(s.bag.equips, function (e) { out.push({ e: e }); });
    return out;
  }
  UI.actions.forge = function () { UI.go('forge'); };
  UI.screens.forge = function () {
    var s = MJ.S.state, tab = UI.sel.forgeTab || 'enhance', lv = s.buildings.shenbing || 1;
    var list = allEquips();
    if (UI.sel.forgeWorn) list = U.filter(list, function (x) { return x.h; });
    list.sort(function (a, b) { return R.equipScore(b.e) - R.equipScore(a.e); });
    var pick = U.find(list, function (x) { return x.e.uid === UI.sel.forgeUid; }) || list[0];
    if (pick) UI.sel.forgeUid = pick.e.uid;
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall forge"><div class="plaque">神兵坊</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="tabs">' + U.map([['enhance', '強化'], ['wash', '洗煉'], ['gem', '鑲嵌'], ['combine', '寶石合成']], function (t) { return '<a class="tab' + (tab === t[0] ? ' on' : '') + '" data-a="forgeTab" data-v="' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</div>';
    // 左：裝備列表
    h += '<div class="parch fg-list"><div class="tabs small"><a class="tab' + (UI.sel.forgeWorn ? ' on' : '') + '" data-a="forgeWorn" data-v="1">已穿戴</a><a class="tab' + (!UI.sel.forgeWorn ? ' on' : '') + '" data-a="forgeWorn" data-v="0">全部</a></div>';
    var pg = UI.pager('forgeP', list, 15, function (x) { return '<div class="fg-it">' + UI.equipCell(x.e, { act: 'forgePick', sel: pick && x.e.uid === pick.e.uid }) + (x.h ? '<span class="fg-who">' + U.esc(G.nameOf(x.h)) + '</span>' : '') + '</div>'; }, '沒有裝備');
    h += '<div class="egrid">' + pg.html + UI.padSlots('forgeP', list, 15, true) + '</div>' + pg.nav + '</div>';
    // 右：操作
    h += '<div class="parch fg-main">';
    if (tab === 'combine') h += combinePanel(s);
    else if (!pick) h += '沒有裝備。';
    else {
      var e = pick.e, tpl = R.equipTpl(e.t);
      h += '<div class="fg-head">' + UI.equipCell(e) + '<div><b class="eqt' + e.q + '">' + C().equipQualityNames[e.q] + '．' + U.esc(tpl.name) + (e.plus ? ' +' + e.plus : '') + '</b>' + (pick.h ? '（' + U.esc(G.nameOf(pick.h)) + ' 穿戴中）' : '') +
        '<br>' + UI.equipLines(R.equipStats(e)).join('　') + '</div></div>';
      if (tab === 'enhance') {
        var cap = R.enhanceCap(s), next = U.extend({}, e); next.plus = (e.plus || 0) + 1;
        h += '<div class="fg-box">強化等級 <b>+' + (e.plus || 0) + '</b> / 上限 +' + cap + '（＝神兵坊等級）<br>';
        if ((e.plus || 0) < cap) h += '強化後：' + UI.equipLines(R.equipStats(next)).join('　') + '<br>成功率 <b>' + Math.round(R.enhanceChance(e) * 100) + '%</b>　費用 ' + U.fmt(R.enhanceCost(e)) + ' 銀（失敗只扣銀幣，不會掉級）<div class="btn-row"><a class="btn" data-a="doEnhance">強化</a></div>';
        else h += '<b>已達上限，請升級神兵坊</b>';
        h += '</div>';
      } else if (tab === 'wash') {
        var n = C().wash.counts[e.q];
        h += '<div class="fg-box">附加屬性（' + n + ' 條，依品質）：<br>' + (e.aff && e.aff.length ? UI.equipLines(affObj(e.aff)).join('　') : '<small>尚未洗煉</small>');
        if (e.washPending) h += '<br><b>新結果：</b>' + UI.equipLines(affObj(e.washPending)).join('　') + '<div class="btn-row"><a class="btn small" data-a="washOk">保留</a><a class="btn small red" data-a="washNo">放棄</a></div>';
        else if (n) h += '<br>費用：洗煉石 ' + have('xilianshi') + '/1　' + U.fmt(G.washCost(e)) + ' 銀<div class="btn-row"><a class="btn" data-a="doWash">洗煉</a></div>';
        else h += '<br><small>白色裝備沒有附加屬性。</small>';
        h += '</div>';
      } else {
        var sk = R.sockets(e), gems = e.gems || [];
        h += '<div class="fg-box">孔位 ' + gems.length + '/' + sk + '（依品質 1/1/2/3）<div class="gem-slots">';
        for (var i = 0; i < sk; i++) h += gems[i] ? '<a class="gem-s on" data-a="gemOut" data-v="' + i + '">' + UI.icon('gem', MJ.D.equipment.items[gems[i]].color) + '<small>' + G.itemName(gems[i]) + '</small></a>' : '<span class="gem-s">空孔</span>';
        h += '</div>';
        var mine = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('gem_') === 0 && s.bag.stack[k] > 0; });
        h += '<b>包裹寶石</b>（點選鑲嵌）<div class="gem-bag">' + (mine.length ? U.map(mine, function (k) { var it = MJ.D.equipment.items[k]; return '<a class="gem-b" data-a="gemIn" data-v="' + k + '">' + UI.icon('gem', it.color) + '<small>' + it.name + '×' + s.bag.stack[k] + '<br>' + UI.equipLines(it.gem.stats)[0] + '</small></a>'; }).join('') : '<small>沒有寶石</small>') + '</div>';
        h += '<small>摘除寶石：有摘除符（' + have('zhaochufu') + '）可保留寶石，否則寶石碎裂。同類寶石每件限 1 顆。</small></div>';
      }
    }
    h += '<div class="fg-bld">神兵坊 Lv' + lv + '　升級費用 ' + U.fmt(G.buildingCost('shenbing', lv)) + ' 銀 <a class="btn small" data-a="upBld" data-v="shenbing">升級</a></div>';
    h += '<p class="note">強化／洗煉／鑲嵌／寶石合成：B（攻略提及神兵坊功能）；成功率、數值：D。</p></div>';
    h += '<div class="fg-foot"><a class="btn" data-a="city">返回</a></div></div></div>';
    return h;
  };
  function affObj(list) { var o = {}; U.each(list, function (a) { o[a.k] = Math.round(((o[a.k] || 0) + a.v) * 100) / 100; }); return o; }
  function combinePanel(s) {
    var mine = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('gem_') === 0 && s.bag.stack[k] > 0; }), c = C().gemCombine;
    var h = '<div class="fg-box"><b>寶石合成</b>：' + c.n + ' 顆同級寶石 → 1 顆下一級<div class="rows">';
    h += mine.length ? U.map(mine, function (k) {
      var it = MJ.D.equipment.items[k], can = it.gem.lv < C().gemMaxLv;
      return '<div class="row-item">' + UI.icon('gem', it.color) + '<div class="ri-t"><b>' + it.name + ' ×' + s.bag.stack[k] + '</b><small>' + UI.equipLines(it.gem.stats).join(' ') + (can ? '　合成費 ' + U.fmt(c.silver[it.gem.lv - 1]) + ' 銀' : '　最高級') + '</small></div>' + (can ? '<a class="btn small' + (s.bag.stack[k] < c.n ? ' disabled' : '') + '" data-why="需要 ' + c.n + ' 顆" data-a="gemComb" data-v="' + k + '">合成</a>' : '') + '</div>';
    }).join('') : '<small>沒有寶石</small>';
    return h + '</div></div>';
  }
  UI.actions.forgeTab = function (v) { UI.sel.forgeTab = v; UI.render(); };
  UI.actions.forgeWorn = function (v) { UI.sel.forgeWorn = v === '1'; UI.page.forgeP = 0; UI.render(); };
  UI.actions.forgePick = function (v) { UI.sel.forgeUid = +v; UI.render(); };
  UI.actions.doEnhance = function () { var r = G.enhance(UI.sel.forgeUid); if (r.ok) UI.toast(r.success ? '強化成功！+' + r.plus : '強化失敗（裝備不掉級）', r.success ? 'good' : 'bad'); else UI.res(r); UI.render(); };
  UI.actions.doWash = function () { if (UI.res(G.wash(UI.sel.forgeUid))) UI.render(); };
  UI.actions.washOk = function () { if (UI.res(G.washAccept(UI.sel.forgeUid), '已保留')) UI.render(); };
  UI.actions.washNo = function () { if (UI.res(G.washCancel(UI.sel.forgeUid), '已放棄')) UI.render(); };
  UI.actions.gemIn = function (k) { if (UI.res(G.socket(UI.sel.forgeUid, k), '鑲嵌成功')) UI.render(); };
  UI.actions.gemOut = function (i) {
    var fu = have('zhaochufu') > 0;
    UI.confirm('摘除寶石', fu ? '使用 1 張摘除符，寶石將退回包裹。' : '<b>沒有摘除符，摘除後寶石會碎裂！</b>確定嗎？', function () {
      var r = G.unsocket(UI.sel.forgeUid, +i, fu); if (UI.res(r, r.kept ? '寶石已退回包裹' : '寶石已碎裂')) UI.render();
    }, '摘除');
  };
  UI.actions.gemComb = function (k) { var r = G.gemCombine(k); if (UI.res(r, '合成：' + G.itemName(r.to))) UI.render(); };

  // ---------- 將星錄 ----------
  UI.actions.jxl = function () { if (!G.buildingOpen('jiangxing')) { UI.toast('將星錄：主角 30 級開放', 'bad'); return; } UI.go('jxl'); };
  UI.screens.jxl = function () {
    var s = MJ.S.state, cfg = C().jiangxing, combos = cfg.combos || [], groupNames = { white: '白魂', green: '綠魂', blue: '藍魂', purple30: '30 魂紫', purple45: '45 魂紫' };
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall jxl"><div class="plaque">將星錄</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="parch jx-map jx-list"><b>原版組合（' + combos.length + ' 組）</b><small>名稱依攻略記載；未載條件／效果留白。來源效果字串僅供參考，本版尚未套入戰鬥。</small>';
    h += U.map(combos, function (c) {
      var state = G.jxComboStatus(c.id), stat = state.state === 'ready' ? '條件符合（效果未套戰鬥）' : (state.state === 'incomplete' ? '條件未符合' : '條件資料不完整');
      return '<div class="jx-combo" data-jx="' + U.esc(c.id) + '"><b>' + U.esc(c.name) + '</b><span class="jx-status">' + stat + '</span><small>條件：' + U.esc(c.requirement || '來源未載') + '</small><small>效果：' + U.esc(c.effect || '來源未載') + '</small></div>';
    }).join('');
    h += '</div><div class="parch jx-side"><b>武將將星等級</b><small>此等級獨立於神武殿「升階」。升級會消耗該武將將魂；放入後不可取回。</small>';
    var owned = U.filter(s.heroes, function (x) { return x.id !== 'lead'; });
    h += '<div class="rows jx-roster">' + (owned.length ? U.map(owned, function (x) {
      var def = R.heroDef(x.id), next = (x.jxLevel || 0) + 1, cost = R.jxSoulCost(x, next), n = s.bag.stack['soul:' + x.id] || 0;
      var need = cost == null ? (next > R.jxMaxLevel ? '已達 Lv18 上限' : '來源未提供 Lv' + next + ' 魂數') : '升至 Lv' + next + '：' + n + '/' + cost + ' 魂';
      return '<div class="row-item"><div class="ri-t"><b>' + U.esc(def.name) + '　Lv' + (x.jxLevel || 0) + '</b><small>' + (groupNames[R.jxSoulGroup(x)] || '未列品階') + '　' + need + '</small></div>' + (cost == null ? '' : '<a class="btn small" data-a="jxHeroUp" data-v="' + x.uid + '">升級</a>') + '</div>';
    }).join('') : '<small>尚無武將</small>') + '</div>';
    h += '<details class="jx-table"><summary>原文將魂量表（升至該級所需魂）</summary><div class="jx-table-scroll"><table><tr><th>品階</th>';
    for (var level = 1; level <= R.jxMaxLevel; level++) h += '<th>' + level + '</th>';
    h += '</tr>';
    U.each(['white', 'green', 'blue', 'purple30', 'purple45'], function (group) {
      h += '<tr><th>' + groupNames[group] + '</th>';
      U.each(cfg.soulCostsByLevel[group], function (n) { h += '<td>' + (n == null ? '—' : n) + '</td>'; });
      h += '</tr>';
    });
    h += '</table></div><small>空白不補算；白魂 Lv10 來源 W48／W53 相異，故保留空白（C）。</small></details>';
    h += '<small>舊星盤星魂餘額：' + U.fmt(s.player.xinghun || 0) + '（遷移退款與原餘額均保留；本版不再使用二十八宿扣點）。</small>';
    h += '<div class="btn-row"><a class="btn small" data-a="open" data-v="codex">圖鑑（' + G.codexCount() + '/' + MJ.D.heroes.list.length + '）</a><a class="btn small" data-a="city">返回</a></div>';
    h += '<p class="note">組合名稱／部分條件與效果文字：B；逐級魂量：B（空白／衝突留空）。本版所有組合效果只顯示來源文字，尚未套入戰鬥屬性。</p></div></div></div>';
    return h;
  };
  UI.actions.jxHeroUp = function (uid) {
    var h0 = G.hero(+uid), level = h0 ? (h0.jxLevel || 0) + 1 : 0, cost = h0 && R.jxSoulCost(h0, level);
    if (!h0 || cost == null) { UI.toast('來源未提供此級魂數；不扣魂、不推算', 'bad'); return; }
    var def = R.heroDef(h0.id);
    UI.confirm('將星升級', '將「' + U.esc(def.name) + '」升至 Lv' + level + '，消耗 ' + cost + ' 個同名將魂？<br><b>放入後不可取回</b>。確定？', function () {
      var r = G.jxLevelUp(+uid); if (UI.res(r, '已升至將星 Lv' + (r.level || level))) UI.render();
    }, '升級');
  };

  // ---------- 圖鑑 ----------
  UI.modals.codex = function () {
    var s = MJ.S.state, q = UI.sel.codexQ == null ? -1 : UI.sel.codexQ;
    var list = U.filter(MJ.D.heroes.list, function (d) { return q < 0 || d.quality === q; });
    list.sort(function (a, b) { return b.quality - a.quality; });
    var n = G.codexCount(), bon = Math.min(C().codexMax, n * C().codexPer);
    var b = '<div class="tabs small">' + U.map([[-1, '全部']].concat(U.map(C().qualityNames.slice(0, 5), function (q, i) { return [i, q]; }).reverse()), function (t) { return '<a class="tab' + (q === t[0] ? ' on' : '') + '" data-a="codexQ" data-v="' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</div>';
    b += '<div class="cdx-h">已收錄 <b>' + n + '/' + MJ.D.heroes.list.length + '</b>　全隊四維戰鬥屬性 +' + (Math.round(bon * 100) / 100) + '%（每名 +' + C().codexPer + '%，上限 ' + C().codexMax + '%，D）</div>';
    var pg = UI.pager('codexP', list, 18, function (d) {
      var got = !!s.codex[d.id];
      return '<div class="cdx' + (got ? '' : ' no') + '" data-a="codexInfo" data-v="' + d.id + '">' + MJ.Art.portrait(d.look, d.quality) + '<span class="nm">' + (got ? U.esc(d.name) : '？？？') + '</span><small class="source-tag">' + U.esc(d.grade || 'D 待補') + '</small></div>';
    });
    b += '<div class="cdx-grid">' + pg.html + '</div>' + pg.nav;
    return UI.panel('武將圖鑑', b, { cls: 'wide' });
  };
  UI.actions.codexQ = function (v) { UI.sel.codexQ = +v; UI.page.codexP = 0; UI.renderModal(); };
  UI.actions.codexInfo = function (id) {
    var d = R.heroDef(id), got = !!MJ.S.state.codex[id];
    if (!got) { UI.toast('尚未收錄：' + UI.qname(d.quality) + '品．' + d.faction + '（招募或以將魂召喚後收錄）'); return; }
    var ps = d.passive ? MJ.D.heroes.passives[d.passive] : null;
    UI.toast(d.name + '｜' + UI.qname(d.quality) + '．' + d.type + '｜主動 ' + d.active.name + (d.ult ? '／無雙 ' + d.ult.name : '') + (ps ? '／被動 ' + ps.name : '') + '｜資料 ' + (d.grade || ''));
  };
})();
