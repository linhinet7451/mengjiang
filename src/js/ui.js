/* UI 核心：舞台縮放/直式旋轉、事件委派、彈窗、提示、分頁、共用元件 */
MJ.UI = (function () {
  var UI = {}, U = MJ.U;
  UI.actions = {};
  UI.page = {};       // 各列表目前頁碼
  UI.sel = {};        // 各畫面選取狀態
  UI.screen = 'city';
  UI.modal = null;    // {name, arg}
  UI.W = 960; UI.H = 600;

  function $(id) { return document.getElementById(id); }
  UI.$ = $;
  UI.q = function () { var C = MJ.D.config; return C; };

  // ---------- 舞台縮放 ----------
  UI.layout = function () {
    var st = $('stage'); if (!st) return;
    var w = window.innerWidth || document.documentElement.clientWidth, h = window.innerHeight || document.documentElement.clientHeight;
    var s = MJ.S.state, rotate = (!s || s.settings.rotate !== false) && h > w * 1.1;
    var scale, tf, left, top;
    if (rotate) {
      scale = Math.min(h / UI.W, w / UI.H);
      left = (w - UI.H * scale) / 2 + UI.H * scale; top = (h - UI.W * scale) / 2;
      tf = 'translate(' + left + 'px,' + top + 'px) rotate(90deg) scale(' + scale + ')';
    } else {
      scale = Math.min(w / UI.W, h / UI.H);
      left = (w - UI.W * scale) / 2; top = (h - UI.H * scale) / 2;
      tf = 'translate(' + left + 'px,' + top + 'px) scale(' + scale + ')';
    }
    st.style.webkitTransform = tf; st.style.transform = tf;
    UI.rotated = rotate; UI.scale = scale;
    document.body.className = rotate ? 'rot' : '';
  };

  // ---------- 事件委派 ----------
  function findAct(el) {
    while (el && el !== document) {
      if (el.getAttribute && el.getAttribute('data-a')) return el;
      el = el.parentNode;
    }
    return null;
  }
  UI.bind = function () {
    var st = $('stage');
    st.addEventListener('click', function (ev) {
      var el = findAct(ev.target); if (!el) return;
      if (el.className && String(el.className).indexOf('disabled') >= 0 && !el.getAttribute('data-force')) { var why = el.getAttribute('data-why'); if (why) UI.toast(why); return; }
      var a = el.getAttribute('data-a'), v = el.getAttribute('data-v');
      var fn = UI.actions[a];
      if (!fn) { UI.toast('（未實作的動作：' + a + '）'); return; }
      ev.preventDefault();
      fn(v, el);
    }, false);
    window.addEventListener('resize', UI.layout, false);
    window.addEventListener('orientationchange', function () { setTimeout(UI.layout, 300); }, false);
  };

  // ---------- 畫面 ----------
  UI.screens = {};
  UI.go = function (name, arg) { UI.screen = name; UI.screenArg = arg; UI.modal = null; UI.render(); };
  UI.render = function () {
    if (!MJ.S.state && UI.screen !== 'newgame') UI.screen = 'newgame';
    var fn = UI.screens[UI.screen];
    $('screen').innerHTML = fn ? fn(UI.screenArg) : '';
    UI.renderModal();
    if (UI.afterRender) { var f = UI.afterRender; UI.afterRender = null; f(); }
  };
  UI.refresh = function () { if (UI.screen === 'battle') { UI.renderModal(); return; } UI.render(); };
  UI.modals = {};
  UI.open = function (name, arg) { if (!UI.modals[name]) { UI.toast('（未實作的動作：' + name + '）'); return; } UI.modal = { name: name, arg: arg }; UI.renderModal(); };
  UI.close = function () { UI.modal = null; UI.renderModal(); if (UI.screen !== 'battle') UI.render(); };
  UI.renderModal = function () {
    var m = $('modal');
    if (!UI.modal) { m.innerHTML = ''; m.style.display = 'none'; return; }
    var fn = UI.modals[UI.modal.name];
    if (!fn) { m.innerHTML = ''; m.style.display = 'none'; UI.modal = null; return; } // 未知的 modal 名稱不顯示空白遮罩（2026-11-09 武林大會當機：空白 #modal 蓋住全畫面且無關閉鈕）
    m.innerHTML = fn(UI.modal.arg);
    m.style.display = 'block';
  };
  UI.actions.close = function () { UI.close(); };
  UI.actions.go = function (v) { UI.go(v); };
  UI.actions.open = function (v) { UI.open(v); };
  UI.actions.noop = function () { };
  UI.actions.info = function (v) { UI.toast(v); };

  // ---------- 提示 ----------
  var toastTimer = null;
  UI.toast = function (msg, kind) {
    var t = $('toast');
    t.innerHTML = '<div class="toast ' + (kind || '') + '">' + U.esc(msg) + '</div>';
    // art4：神武殿／神兵坊／聚賢莊的提示移到下方金框上，不蓋住面板內容
    t.className = UI.screen === 'city' ? 'top' : (!UI.modal && (UI.screen === 'forge' || UI.screen === 'hall' || UI.screen === 'recruit') ? 'low' : '');
    t.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.style.display = 'none'; }, 2200);
  };
  UI.res = function (r, okMsg) {
    if (!r.ok) { UI.toast(r.msg, 'bad'); return false; }
    if (okMsg) UI.toast(okMsg, 'good');
    return true;
  };
  // 確認框
  UI.confirm = function (title, text, onYes, yesLabel) {
    UI._confirmYes = onYes;
    var c = $('confirm');
    c.innerHTML = '<div class="dim"></div><div class="frame confirm-box"><div class="plaque">' + U.esc(title) + '</div><div class="parch confirm-text">' + text + '</div>' +
      '<div class="btn-row"><a class="btn red" data-a="confirmYes">' + U.esc(yesLabel || '確定') + '</a><a class="btn" data-a="confirmNo">取消</a></div></div>';
    c.style.display = 'block';
  };
  UI.actions.confirmYes = function () { $('confirm').style.display = 'none'; var f = UI._confirmYes; UI._confirmYes = null; if (f) f(); };
  UI.actions.confirmNo = function () { $('confirm').style.display = 'none'; UI._confirmYes = null; };
  // 獎勵彈窗
  UI.rewardBox = function (title, lines) {
    UI.confirm(title, '<div class="reward-list">' + (lines.length ? U.map(lines, function (l) { return '<div class="rw">' + U.esc(l) + '</div>'; }).join('') : '<div class="rw">（沒有物品）</div>') + '</div>', null, '好的');
    var c = $('confirm'); var btns = c.getElementsByClassName('btn'); if (btns[1]) btns[1].style.display = 'none';
  };

  // ---------- 共用元件 ----------
  UI.panel = function (title, body, opt) {
    opt = opt || {};
    return '<div class="dim"' + (opt.noDimClose ? '' : ' data-a="close"') + '></div><div class="frame panel ' + (opt.cls || '') + '">' +
      '<div class="plaque">' + U.esc(title) + '</div><a class="xbtn" data-a="close" aria-label="關閉">×</a>' +
      '<div class="panel-body">' + body + '</div></div>';
  };
  UI.bar = function (cur, max, cls, text) {
    var p = max > 0 ? U.clamp(cur / max, 0, 1) * 100 : 0;
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + p.toFixed(1) + '%"></i><b>' + (text != null ? text : U.fmt(cur) + '/' + U.fmt(max)) + '</b></div>';
  };
  UI.qname = function (q) { return MJ.D.config.qualityNames[q]; };
  UI.qcls = function (q) { return 'q' + q; };
  UI.portrait = function (h, opt) {
    opt = opt || {};
    var def = MJ.R.heroDef(h.id), look = h.id === 'lead' ? MJ.S.state.player.look : def.look;
    var q = h.id === 'lead' ? MJ.R.leadQ(MJ.S.state) : def.quality;
    return '<div class="card ' + UI.qcls(q) + (opt.sel ? ' sel' : '') + (opt.cls ? ' ' + opt.cls : '') + '"' + (opt.act ? ' data-a="' + opt.act + '" data-v="' + (opt.v != null ? opt.v : h.uid) + '"' : '') + '>' +
      MJ.Art.portrait(look, q) + '<span class="lvb">' + h.lv + '</span>' + (opt.badge ? '<span class="badge">' + opt.badge + '</span>' : '') +
      '<span class="nm">' + U.esc(MJ.G.nameOf(h)) + '</span></div>';
  };
  // 裝備品質篩選列（依品質顏色：白／綠／藍／紫…），act 為點擊時的 action 名稱，cur 為目前選的品質（'' = 全部）
  UI.qualityChips = function (act, cur) {
    var names = MJ.D.config.equipQualityNames, h = '<div class="qkind"><a class="chip' + (cur === '' ? ' on' : '') + '" data-a="' + act + '" data-v="">全部</a>';
    for (var i = 0; i < names.length; i++) h += '<a class="chip qc' + i + (String(cur) === String(i) ? ' on' : '') + '" data-a="' + act + '" data-v="' + i + '">' + names[i] + '</a>';
    return h + '</div>';
  };
  UI.pager = function (key, items, per, renderFn, emptyText) {
    var pages = Math.max(1, Math.ceil(items.length / per));
    var p = U.clamp(UI.page[key] || 0, 0, pages - 1); UI.page[key] = p;
    var slice = items.slice(p * per, p * per + per), html = '';
    if (!items.length) html = '<div class="empty">' + U.esc(emptyText || '空') + '</div>';
    else U.each(slice, function (it, i) { html += renderFn(it, p * per + i); });
    return { html: html, nav: '<div class="pager"><a class="pbtn' + (p <= 0 ? ' disabled' : '') + '" data-a="pg" data-v="' + key + ':-1">◀</a><span>' + (p + 1) + '/' + pages + '</span><a class="pbtn' + (p >= pages - 1 ? ' disabled' : '') + '" data-a="pg" data-v="' + key + ':1">▶</a></div>' };
  };
  // art4：裝備格補滿空格（原版深橄欖色格子，空格也畫出來）
  UI.padSlots = function (key, items, per, wrap) {
    if (!items.length) return '';
    var p = UI.page[key] || 0, n = Math.max(0, per - Math.max(0, Math.min(per, items.length - p * per))), h = '';
    for (var i = 0; i < n; i++) h += wrap ? '<div class="fg-it"><div class="ecell vslot"></div></div>' : '<div class="ecell vslot"></div>';
    return h;
  };
  UI.actions.pg = function (v) { var a = v.split(':'); UI.page[a[0]] = (UI.page[a[0]] || 0) + (+a[1]); UI.refresh(); };
  UI.equipCell = function (e, opt) {
    opt = opt || {};
    var tpl = MJ.R.equipTpl(e.t), st = MJ.R.equipStats(e);
    var tip = UI.equipLines(st).join(' ');
    return '<div class="ecell eq' + e.q + (opt.sel ? ' sel' : '') + '"' + (opt.act ? ' data-a="' + opt.act + '" data-v="' + e.uid + '"' : '') + ' title="' + U.esc(tpl.name + ' ' + tip) + '">' +
      MJ.Art.icon(tpl.icon, e.q) + '<span class="elv">' + tpl.lv + '</span>' + (e.plus ? '<span class="eplus">+' + e.plus + '</span>' : '') + (e.gems && e.gems.length ? '<span class="egem">' + U.map(e.gems, function () { return '◆'; }).join('') + '</span>' : '') + '<span class="enm">' + U.esc(tpl.name) + '</span></div>';
  };
  UI.STAT_NAMES = { patk: '物攻', matk: '法攻', jatk: '絕技攻', pdef: '物防', mdef: '法防', jdef: '絕技防', hp: '生命', hit: '命中', crit: '暴擊', dodge: '閃避', all: '四維' };
  UI.stars = function (n) { var t = ''; for (var i = 0; i < 5; i++) t += i < n ? '★' : '☆'; return '<span class="stars5">' + t + '</span>'; };
  UI.equipLines = function (st) {
    return U.map(U.keys(st), function (k) { var pct = k === 'hit' || k === 'crit' || k === 'dodge'; return UI.STAT_NAMES[k] + '+' + (pct ? st[k].toFixed(2) + '%' : st[k]); });
  };
  UI.icon = function (n, q) { return MJ.Art.icon(n, q); };
  return UI;
})();
