/* 其他視窗：道具、陣法、日志、郵件、商城、設置、任務；新遊戲畫面 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R, S = MJ.S;
  function tabs(key, list, cur) {
    return '<div class="tabs">' + U.map(list, function (t) { return '<a class="tab' + (t[0] === cur ? ' on' : '') + '" data-a="mtab" data-v="' + key + ':' + t[0] + '">' + t[1] + '</a>'; }).join('') + '</div>';
  }
  UI.actions.mtab = function (v) { var a = v.split(':'); UI.sel[a[0]] = a[1]; UI.page[a[0] + 'P'] = 0; UI.renderModal(); };

  // ---------- 道具（包裹） ----------
  UI.modals.bag = function () {
    var s = S.state, tab = UI.sel.bag || 'items', b = tabs('bag', [['items', '道具'], ['equips', '裝備'], ['souls', '魂魄']], tab);
    b += '<div class="bag-cap">包裹 ' + G.bagUsed() + ' 件　（空間無上限）</div>';
    var list, pg;
    if (tab === 'items') {
      list = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('soul:') !== 0 && s.bag.stack[k] > 0; });
      pg = UI.pager('bagP', list, 6, function (k) {
        var it = MJ.D.equipment.items[k];
        return '<div class="row-item">' + UI.icon(it.icon, it.color) + '<div class="ri-t"><b>' + U.esc(it.name) + ' ×' + s.bag.stack[k] + '</b><small>' + U.esc(it.desc) + '</small></div>' +
          '<a class="btn small" data-a="useItem" data-v="' + k + '">使用</a></div>';
      }, '沒有道具');
    } else if (tab === 'equips') {
      var bq = UI.sel.bagQ == null ? '' : UI.sel.bagQ;
      b += UI.qualityChips('bagQ', bq);
      var eqs = U.filter(s.bag.equips, function (e) { return bq === '' || e.q === +bq; });
      eqs.sort(function (a, c) { return c.q - a.q || R.equipScore(c) - R.equipScore(a); });
      pg = UI.pager('bagP', eqs, 6, function (e) {
        var tpl = R.equipTpl(e.t);
        return '<div class="row-item">' + UI.equipCell(e) + '<div class="ri-t"><b class="eqt' + e.q + '">' + MJ.D.config.equipQualityNames[e.q] + '·' + U.esc(tpl.name) + '</b><small>需要 Lv' + tpl.lv + '　' + U.esc(UI.equipLines(R.equipStats(e)).join('　')) + '</small></div>' +
          '<a class="btn small" data-a="sellEq" data-v="' + e.uid + '">賣出 ' + R.equipSell(e) + '</a></div>';
      }, '沒有閒置裝備（穿裝備請到神武殿）');
    } else {
      list = U.filter(U.keys(s.bag.stack), function (k) { return k.indexOf('soul:') === 0 && s.bag.stack[k] > 0; });
      pg = UI.pager('bagP', list, 6, function (k) {
        var d = R.heroDef(k.slice(5));
        return '<div class="row-item">' + UI.icon('soul', d.quality) + '<div class="ri-t"><b>' + U.esc(d.name) + ' 魂魄 ×' + s.bag.stack[k] + '</b><small>集滿 ' + d.souls + ' 個可在聚賢莊召喚（不佔包裹格）</small></div></div>';
      }, '沒有魂魄');
    }
    b += '<div class="rows">' + pg.html + '</div>' + pg.nav;
    return UI.panel('道具', b, { cls: 'mid' });
  };
  UI.actions.bagQ = function (v) { UI.sel.bagQ = v; UI.page.bagP = 0; UI.renderModal(); };
  UI.actions.useItem = function (k) {
    var it = MJ.D.equipment.items[k];
    if (!it.use && !it.xinfa) { UI.toast(it.name + '：' + it.desc); return; }
    if (it.xinfa || it.use.heroExp) { UI.open('pickHero', k); return; }
    var r = G.useItem(k); if (UI.res(r, r.msg)) UI.renderModal();
  };
  UI.modals.pickHero = function (k) {
    var s = S.state, xf = MJ.D.equipment.items[k].xinfa, list = U.filter(s.heroes, function (h) { return xf || h.id !== 'lead'; });
    var pg = UI.pager('pickP', list, 8, function (h) { return UI.portrait(h, { act: 'useOn', v: k + ':' + h.uid }); }, '沒有可使用的武將');
    return UI.panel('選擇武將（' + MJ.D.equipment.items[k].name + '）', '<div class="cards">' + pg.html + '</div>' + pg.nav + '<div class="btn-row"><a class="btn" data-a="open" data-v="bag">返回</a></div>', { cls: 'mid' });
  };
  UI.actions.useOn = function (v) { var a = v.split(':'); var r = G.useItem(a[0], +a[1]); if (UI.res(r, r.msg)) UI.renderModal(); };
  UI.actions.sellEq = function (uid) { var r = G.sellEquip(+uid); if (UI.res(r, '賣出，獲得銀幣 ' + r.silver)) UI.renderModal(); };

  // ---------- 陣法 ----------
  UI.modals.formation = function () {
    var s = S.state, f = G.formation(), slots = R.teamSlots(G.lead().lv), selH = UI.sel.fHero;
    var b = '<div class="form-wrap"><div class="form-list">';
    var lv = G.lead().lv, oc = G.openCells();
    U.each(MJ.D.formations, function (x) {
      var bon = U.map(U.keys(x.bonus || {}), function (k) { return k === 'npcCut' ? '受 NPC 傷害 −' + x.bonus[k] + '%' : UI.STAT_NAMES[k] + '+' + x.bonus[k] + '%'; }).join(' ');
      b += '<a class="fl' + (x.id === f.id ? ' on' : '') + (x.open > lv ? ' dim2' : '') + '" data-a="setForm" data-v="' + x.id + '"><b>' + U.esc(x.name) + (x.open > lv ? '（' + x.open + '級）' : '') + '</b><small>' + U.esc(x.desc) + '<br>全隊 ' + bon + '</small></a>';
    });
    b += '</div><div class="form-mid"><div class="fm-h">出戰 ' + G.teamCount() + '/' + slots + '　<small>（' + U.map(MJ.D.config.teamSlotsByLevel.slice(1), function (x) { return x[0]; }).join('/') + ' 級各 +1 人，最多 ' + R.teamSlots(999) + ' 人）</small></div><div class="fgrid"><span class="fg-dir">敵方 ▶</span>';
    // 修正（Tomas 回報：格子擠成兩欄、文字黏在一起）：每一列包成 .frow，固定 3 格一列；狀態字置中加底色，前／中／後標籤放角落
    for (var r = 0; r < 3; r++) {
      b += '<div class="frow">';
      for (var c = 2; c >= 0; c--) {
        var cell = r * 3 + c, open = oc.indexOf(cell) >= 0, uid = s.team.cells[cell], h = uid && G.hero(uid);
        b += '<div class="fcell' + (open ? '' : ' closed') + (h ? ' occ' : '') + (h && h.uid === selH ? ' sel' : '') + '" data-cell="' + cell + '"' + (open ? ' data-a="fCell" data-v="' + cell + '"' : '') + (h ? ' data-uid="' + h.uid + '"' : '') + '>' +
          (h ? UI.portrait(h, { cls: 'mini' }) + fRange(h, r) : (open ? '<span class="fc-e">空位</span>' : '<span class="fc-e">未開放</span>')) + '<i class="fc-n">' + ['前', '中', '後'][c] + '</i></div>';
      }
      b += '</div>';
    }
    b += '</div>' + (UI.lxLine ? UI.lxLine() : '') + '<div class="fm-tip">先點右側武將或陣中武將，再點格子放入／互換。第 1 列（最右）為前排。<br>出手順序：雙方交替，前列先、同列由下往上。<br>戰鬥時雙方站在同一個大棋盤上，每回合都往前走一格（只能前後、不能換列），前面有人就停下。<br>格子右上角是主動技攻擊格：綠＝自己，紅＝從自己正前方那一格起算的攻擊格；紅格裡有敵人才打得到。</div></div>';
    var list = s.heroes.slice().sort(function (a, b2) { return b2.lv - a.lv; });
    var pg = UI.pager('formP', list, 8, function (h) {
      var inT = G.inTeam(h.uid) != null;
      return '<div class="fh">' + UI.portrait(h, { act: 'fPick', sel: h.uid === selH, badge: inT ? '陣' : '' }) +
        (h.id === 'lead' ? '<span class="fh-b dim2">主角</span>' : (inT ? '<a class="fh-b" data-a="fOut" data-v="' + h.uid + '">下陣</a>' : '<a class="fh-b" data-a="fIn" data-v="' + h.uid + '">上陣</a>')) + '</div>';
    });
    b += '<div class="form-roster"><div class="cards">' + pg.html + '</div>' + pg.nav + '</div></div>';
    return UI.panel('陣法', b, { cls: 'wide' });
  };
  // 陣法畫面：每位上陣武將的主動技攻擊格（依所在列）
  function fRange(h, row) { var sk = R.skillOf(h, 'a'); return sk ? '<span class="fc-rg" title="主動技攻擊格">' + UI.patternGrid(sk.pattern, row, sk) + '</span>' : ''; }
  UI.formRange = fRange;
  UI.actions.setForm = function (id) {
    var r = G.setFormation(id);
    if (UI.res(r, '陣法已儲存' + (r.moved && r.moved.length ? '：' + r.moved.join('、') + ' 依新陣形換位' : ''))) UI.renderModal();
  };
  UI.actions.fPick = function (uid) { uid = +uid; UI.sel.fHero = UI.sel.fHero === uid ? null : uid; UI.renderModal(); };
  UI.actions.fCell = function (cell) {
    cell = +cell; var s = S.state, occ = s.team.cells[cell];
    if (!UI.sel.fHero) { if (occ) { UI.sel.fHero = occ; UI.renderModal(); } else UI.toast('請先選擇武將'); return; }
    var r = G.setCell(cell, UI.sel.fHero); if (UI.res(r, '站位已儲存')) { UI.sel.fHero = null; UI.renderModal(); }
  };
  UI.actions.fIn = function (uid) { if (UI.res(G.addToTeam(+uid))) UI.renderModal(); };
  UI.actions.fOut = function (uid) { if (UI.res(G.removeFromTeam(+uid))) UI.renderModal(); };

  // ---------- 日志 ----------
  UI.modals.log = function () {
    var s = S.state;
    var pg = UI.pager('logP', s.log, 9, function (l) { var d = new Date(l.t); return '<div class="logl"><small>' + U.pad2(d.getMonth() + 1) + '/' + U.pad2(d.getDate()) + ' ' + U.pad2(d.getHours()) + ':' + U.pad2(d.getMinutes()) + '</small> ' + U.esc(l.text) + '</div>'; }, '還沒有紀錄');
    return UI.panel('日志', '<div class="rows">' + pg.html + '</div>' + pg.nav, { cls: 'mid' });
  };

  // ---------- 郵件 ----------
  UI.modals.mail = function () {
    var s = S.state, list = s.mail.slice().reverse();
    var pg = UI.pager('mailP', list, 5, function (m) {
      var parts = [];
      if (m.att) { if (m.att.gold) parts.push('金幣 ×' + m.att.gold); if (m.att.silver) parts.push('銀幣 ×' + m.att.silver); U.each(m.att.items || [], function (it) { parts.push(G.itemName(it.item) + ' ×' + (it.n || 1)); }); U.each(m.att.equips || [], function (e) { parts.push(R.equipTpl(e.t).name); }); }
      return '<div class="row-item">' + UI.icon('mail') + '<div class="ri-t"><b>' + U.esc(m.title) + '</b><small>' + U.esc(m.text) + (parts.length ? '<br>附件：' + U.esc(parts.join('、')) : '') + '</small></div>' +
        (parts.length ? (m.claimed ? '<span class="dim2">已領取</span>' : '<a class="btn small" data-a="claimMail" data-v="' + m.id + '">領取</a>') : '') + '</div>';
    }, '沒有郵件');
    var pend = 0; U.each(s.mail, function (m) { if (m.att && !m.claimed) pend++; });
    var bar = '<div class="row"><a class="btn small" data-a="claimAllMail">一鍵領取' + (pend ? '（' + pend + '）' : '') + '</a></div>';
    return UI.panel('郵件', bar + '<div class="rows">' + pg.html + '</div>' + pg.nav, { cls: 'mid' });
  };
  UI.actions.claimAllMail = function () { var r = G.claimAllMail(); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('一鍵領取 ' + r.n + ' 封' + (r.skipped ? '（' + r.skipped + ' 封因包裹已滿略過）' : ''), r.got); } };
  UI.actions.claimMail = function (id) { var r = G.claimMail(+id); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('領取成功', r.got); } };

  // ---------- 任務 ----------
  UI.modals.tasks = function () {
    var s = S.state;
    var pg = UI.pager('taskP', MJ.D.tasks, 5, function (t) {
      var done = G.taskDone(t), cl = s.tasksClaimed[t.id], rw = [];
      if (t.reward.gold) rw.push('金幣 ×' + t.reward.gold); if (t.reward.silver) rw.push('銀幣 ×' + t.reward.silver);
      U.each(t.reward.items || [], function (it) { rw.push(G.itemName(it.item) + ' ×' + (it.n || 1)); });
      return '<div class="row-item">' + UI.icon('quest') + '<div class="ri-t"><b>' + U.esc(t.name) + '</b><small>' + U.esc(t.desc) + '<br>獎勵：' + U.esc(rw.join('、')) + '</small></div>' +
        (cl ? '<span class="dim2">已完成</span>' : (done ? '<a class="btn small" data-a="claimTask" data-v="' + t.id + '">領取</a>' : '<span class="dim2">未完成</span>')) + '</div>';
    });
    return UI.panel('任務', '<div class="rows">' + pg.html + '</div>' + pg.nav, { cls: 'mid' });
  };
  UI.actions.claimTask = function (id) { var r = G.claimTask(id); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('任務完成', r.got); } };

  // ---------- 商城 ----------
  function shopCategory(e) {
    if (e.item.indexOf('eq:') === 0) return 'equip';
    if (e.item.indexOf('gem_') === 0) return 'gem';
    if (e.item.indexOf('xf_') === 0 || e.item === 'xinfacanye') return 'xinfa';
    if (e.item.indexOf('seed_') === 0) return 'seed';
    return 'item';
  }
  function shopCurrency(e) { return e.price.silver ? 'silver' : 'gold'; }
  UI.shopCategory = shopCategory;
  UI.shopCurrency = shopCurrency;
  UI.modals.shop = function () {
    var s = S.state, cat = UI.sel.shopCategory || 'all', currency = UI.sel.shopCurrency || 'all';
    var categories = [['all', '全部'], ['equip', '裝備'], ['gem', '寶石'], ['xinfa', '心法'], ['seed', '種子'], ['item', '其他道具']], currencies = [['all', '全部'], ['silver', '銀幣'], ['gold', '金幣']];
    var list = U.filter(MJ.D.shop, function (e) { return (cat === 'all' || shopCategory(e) === cat) && (currency === 'all' || shopCurrency(e) === currency); });
    var pg = UI.pager('shopP', list, 6, function (e) {
      var nm, ic, sub = '';
      if (e.item.indexOf('eq:') === 0) { var tpl = R.equipTpl(e.item.slice(3)); nm = MJ.D.config.equipQualityNames[e.q || 0] + '·' + tpl.name; ic = UI.equipCell({ t: tpl.id, q: e.q || 0, uid: 0 }); sub = '需要 Lv' + tpl.lv + '　' + UI.equipLines(R.equipStats({ t: tpl.id, q: e.q || 0 })).join('　'); }
      else { var it = MJ.D.equipment.items[e.item]; nm = it.name + (e.n > 1 ? ' ×' + e.n : ''); ic = UI.icon(it.icon, it.color); sub = it.desc; }
      var cur = shopCurrency(e), category = shopCategory(e);
      return '<div class="row-item shop-item" data-shop-id="' + U.esc(e.id) + '" data-shop-category="' + category + '" data-shop-currency="' + cur + '">' + ic + '<div class="ri-t"><b>' + U.esc(nm) + '</b><small>' + U.esc(sub) + '</small></div><a class="btn small" data-a="buy" data-v="' + e.id + '">' + UI.icon(cur) + U.fmt(e.price[cur]) + '</a></div>';
    });
    var filters = '<div class="shop-filters"><div class="shop-filter-row"><b>類別</b>' + U.map(categories, function (x) { return '<a class="chip' + (cat === x[0] ? ' on' : '') + '" data-a="shopFilter" data-v="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div>' +
      '<div class="shop-filter-row"><b>貨幣</b>' + U.map(currencies, function (x) { return '<a class="chip' + (currency === x[0] ? ' on' : '') + '" data-a="shopCurrency" data-v="' + x[0] + '">' + x[1] + '</a>'; }).join('') + '</div>' +
      '<div class="shop-count">顯示 ' + list.length + ' / ' + MJ.D.shop.length + ' 件商品</div></div>';
    return UI.panel('商城', '<div class="shop-note">單機重製版：只用遊戲內貨幣，沒有任何真實付費。</div>' + filters + '<div class="rows">' + (list.length ? pg.html : '<div class="shop-empty">沒有符合篩選的商品</div>') + '</div>' + (list.length ? pg.nav : ''), { cls: 'mid' });
  };
  UI.actions.shopFilter = function (v) { UI.sel.shopCategory = v; UI.page.shopP = 0; UI.renderModal(); };
  UI.actions.shopCurrency = function (v) { UI.sel.shopCurrency = v; UI.page.shopP = 0; UI.renderModal(); };
  UI.actions.buy = function (id) { var r = G.buy(id); if (UI.res(r, '購得 ' + r.got.join('、'))) UI.renderModal(); };

  // ---------- 設置（存檔管理） ----------
  UI.modals.settings = function () {
    var s = S.state, st = s.settings;
    var b = '<div class="set-grid"><div class="set-col"><div class="set-h">存檔</div>' +
      '<div class="set-row">狀態：' + (S.storageAvailable() ? '本機儲存可用' + (S.lastSave ? '，上次存檔 ' + new Date(S.lastSave).toLocaleTimeString() : '') : '<b class="bad">瀏覽器不允許本機儲存（例如私密瀏覽），請記得匯出存檔</b>') + '</div>' +
      '<div class="btn-row left"><a class="btn" data-a="saveNow">手動存檔</a><a class="btn" data-a="exportSave">匯出存檔</a><a class="btn" data-a="importOpen">匯入存檔</a></div>' +
      '<div class="set-row small">每 30 秒及每次操作後自動存檔。手動存檔會先備份上一份存檔。</div>' +
      '<div class="btn-row left"><a class="btn red" data-a="resetSave">重置遊戲</a></div></div>' +
      '<div class="set-col"><div class="set-h">遊戲</div>' +
      '<div class="set-row">戰鬥速度：<a class="tog' + (st.speed === 1 ? ' on' : '') + '" data-a="setOpt" data-v="speed:1">1x</a><a class="tog' + (st.speed === 2 ? ' on' : '') + '" data-a="setOpt" data-v="speed:2">2x</a><a class="tog' + (st.speed === 4 ? ' on' : '') + '" data-a="setOpt" data-v="speed:4">4x</a></div>' +
      '<div class="set-row">無雙演出：<a class="tog' + (st.musou !== false ? ' on' : '') + '" data-a="setOpt" data-v="musou:1">開</a><a class="tog' + (st.musou === false ? ' on' : '') + '" data-a="setOpt" data-v="musou:0">關</a><br><small>關閉時無雙技不播放切入動畫與全屏特效，傷害直接結算（與戰鬥速度無關）。</small></div>' +
      '<div class="set-row">經濟模式：<a class="tog' + (st.econ !== 'fast' ? ' on' : '') + '" data-a="setEcon" data-v="std">標準</a><a class="tog' + (st.econ === 'fast' ? ' on' : '') + '" data-a="setEcon" data-v="fast">單機加速</a><br><small>標準：原速。單機加速：訓練經驗 2 倍、戰鬥銀幣與塔俸 ×1.5（D）。精力與現實時間等待已全部取消。</small></div>' +
      (UI.soundRows ? UI.soundRows() : '') +
      '<div class="set-row">手機直向時自動旋轉橫向：<a class="tog' + (st.rotate !== false ? ' on' : '') + '" data-a="setOpt" data-v="rotate:1">開</a><a class="tog' + (st.rotate === false ? ' on' : '') + '" data-a="setOpt" data-v="rotate:0">關</a></div>' +
      '<div class="set-row small">版本：' + S.RELEASE + '　存檔格式 v' + S.VERSION + '　戰鬥規則 v' + MJ.R.RV + '<br>建置編號：<b class="build-id">' + (window.MJ_BUILD || '開發版') + '</b>（GitHub Pages 更新後約 10 分鐘內可能仍拿到舊檔，重新整理後對照此編號）<br>本作為粉絲重製的單機版，所有美術均以程式繪製，與原版營運商無關。</div></div></div>';
    return UI.panel('設置', b, { cls: 'mid' });
  };
  UI.actions.setOpt = function (v) {
    var a = v.split(':'), st = S.state.settings;
    if (a[0] === 'speed') st.speed = +a[1];
    else if (a[0] === 'rotate') st.rotate = a[1] === '1';
    else if (a[0] === 'musou') st.musou = a[1] === '1'; // 無雙演出開關，與戰鬥速度獨立
    G.commit(); UI.layout(); UI.renderModal();
  };
  UI.actions.saveNow = function () { UI.toast(S.save(true) ? '已存檔' : '存檔失敗：瀏覽器不允許本機儲存，請改用匯出', S.storageOk ? 'good' : 'bad'); UI.renderModal(); };
  UI.actions.exportSave = function () {
    var text = S.exportText(), name = 'mengjiang-save-' + U.dayKey() + '.json', okDl = false;
    try {
      if (window.Blob && window.URL && URL.createObjectURL) {
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
        document.body.appendChild(a); a.click(); setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 500); okDl = true;
      }
    } catch (e) { okDl = false; }
    UI.open('exportBox', { text: text, dl: okDl });
  };
  UI.modals.exportBox = function (o) {
    return UI.panel('匯出存檔', '<div class="set-row">' + (o.dl ? '已嘗試下載檔案。' : '') + '若下載無效（例如部分 iPhone），請長按下方文字全選並複製，貼到備忘錄保存。</div><textarea class="savebox" id="exportText" readonly>' + U.esc(o.text) + '</textarea>' +
      '<div class="btn-row"><a class="btn" data-a="copyExport">複製</a><a class="btn" data-a="open" data-v="settings">返回</a></div>', { cls: 'mid' });
  };
  UI.actions.copyExport = function () {
    var t = document.getElementById('exportText'); t.removeAttribute('readonly'); t.select(); try { t.setSelectionRange(0, 999999); } catch (e) { }
    var ok = false; try { ok = document.execCommand('copy'); } catch (e2) { } t.setAttribute('readonly', 'readonly');
    UI.toast(ok ? '已複製到剪貼簿' : '無法自動複製，請手動長按全選複製');
  };
  UI.actions.importOpen = function () { UI.open('importBox'); };
  UI.modals.importBox = function () {
    return UI.panel('匯入存檔', '<div class="set-row">選擇先前匯出的 .json 檔，或把存檔文字貼到下方。匯入前會檢查格式，並覆蓋目前進度。</div>' +
      '<input type="file" accept=".json,application/json,text/plain" id="importFile" onchange="MJ.UI.importFile(this)">' +
      '<textarea class="savebox" id="importText" placeholder="在此貼上存檔文字"></textarea>' +
      '<div class="btn-row"><a class="btn" data-a="importPaste">匯入貼上的文字</a><a class="btn" data-a="' + (S.state ? 'open" data-v="settings' : 'close') + '">返回</a></div>', { cls: 'mid' });
  };
  UI.importFile = function (inp) {
    var f = inp.files && inp.files[0]; if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { UI.doImport(String(rd.result)); };
    rd.onerror = function () { UI.toast('讀取檔案失敗', 'bad'); };
    rd.readAsText(f);
  };
  UI.actions.importPaste = function () { UI.doImport(document.getElementById('importText').value); };
  UI.doImport = function (text) {
    var r = S.parse(String(text || '').replace(/^\s+|\s+$/g, ''));
    if (!r.ok) { UI.toast('匯入失敗：' + r.errors.slice(0, 3).join('；'), 'bad'); return; }
    var lead = U.find(r.state.heroes, function (h) { return h.id === 'lead'; });
    UI.confirm('確認匯入', '存檔角色：' + U.esc(r.state.player.name) + '（Lv' + lead.lv + '）<br>匯入後會覆蓋目前進度（目前進度會先備份一份）。', function () {
      if (S.state) S.save(true);
      S.state = r.state; G.tick(); G.commit(); S.save(true);
      UI.modal = null; UI.go('city'); UI.toast('匯入成功', 'good');
    }, '匯入');
  };
  UI.actions.resetSave = function () {
    UI.confirm('重置遊戲', '這會<b>刪除本機所有進度</b>（含備份），無法復原。建議先匯出存檔。', function () {
      UI.confirm('再次確認', '真的要從頭開始嗎？', function () { S.reset(); UI.modal = null; UI.go('newgame'); }, '刪除並重來');
    }, '我要重置');
  };

  // ---------- 新遊戲 ----------
  UI.screens.newgame = function () {
    var g = UI.sel.ngG || 'm', t = UI.sel.ngT || '力耐';
    var look = U.clone(MJ.D.heroes.lead.look); if (g === 'f') { look.g = 'f'; look.hs = 'long'; look.cloth = '#ad1457'; }
    look.art = 'c_lead_' + g;
    var h = '<div class="scr newgame">' + MJ.Art.sky() + '<div class="ng-logo">猛將無雙<small>單機重製版・' + S.RELEASE + '</small><small class="build-id">' + (window.MJ_BUILD || '') + '</small></div>' +
      '<div class="frame ng-box"><div class="plaque">創建角色</div><div class="ng-in"><div class="ng-fig"><div class="mc-wrap">' + MJ.Art.magicCircle() + '</div><div class="hero-fig">' + MJ.Art.figure(look, { cape: true }) + '</div></div><div class="ng-form">' +
      '<label>俠名 <input id="ngName" maxlength="8" value="' + U.esc(UI.sel.ngName || '') + '" placeholder="最多 8 字"></label>' +
      '<div class="ng-row">性別：<a class="tog' + (g === 'm' ? ' on' : '') + '" data-a="ngSet" data-v="G:m">男</a><a class="tog' + (g === 'f' ? ' on' : '') + '" data-a="ngSet" data-v="G:f">女</a></div>' +
      '<div class="ng-row">主屬性：';
    U.each(U.keys(MJ.D.config.leadTypes), function (k) { h += '<a class="tog' + (t === k ? ' on' : '') + '" data-a="ngSet" data-v="T:' + k + '">' + k + '</a>'; });
    h += '</div><div class="ng-desc">' + ({ '力耐': '力量與耐力並重，前排肉盾兼輸出（原版截圖主角即為此型）', '力敏': '力量與敏捷，攻擊較高、生命較低', '敏耐': '敏捷與耐力，攻守平均' })[t] + '</div>' +
      '<div class="btn-row"><a class="btn big" data-a="ngStart">踏入江湖</a><a class="btn" data-a="importOpen">匯入存檔</a></div>' +
      (S.storageAvailable() ? '' : '<div class="bad">注意：瀏覽器不允許本機儲存，進度只能靠「匯出存檔」保存。</div>') + '</div></div></div></div>';
    return h;
  };
  UI.actions.ngSet = function (v) { var n = document.getElementById('ngName'); if (n) UI.sel.ngName = n.value; if (v.charAt(0) === 'G') UI.sel.ngG = v.slice(2); else UI.sel.ngT = v.slice(2); UI.render(); };
  UI.actions.ngStart = function () {
    var n = document.getElementById('ngName');
    G.newGame(n ? n.value : '', UI.sel.ngT || '力耐', UI.sel.ngG || 'm');
    UI.go('city'); UI.toast('歡迎來到猛將無雙！', 'good');
  };
})();
