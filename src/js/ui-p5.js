/* 加碼玩法介面：奇遇（華容道／觀星台／玄機盤）。美術全部為程式繪製的原創 SVG／CSS。 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G;
  function S() { return MJ.S.state; }
  function sfx(n) { if (MJ.Audio && MJ.Audio.sfx) MJ.Audio.sfx(n); }
  UI.qiyuDot = function () { if (!G.qiyuOpen()) return false; return G.starState().free || G.wheelState().free || G.ticket('hrd').ready; };

  UI.modals.qiyu = function () {
    var tab = UI.sel.qyTab || 'hrd', body = '';
    var hd = G.ticket('hrd').ready, sd = G.starState().free, wd = G.wheelState().free;
    body += '<div class="tabs">' + U.map([['hrd', '華容道', hd], ['star', '觀星台', sd], ['wheel', '玄機盤', wd]], function (t) {
      return '<a class="tab' + (tab === t[0] ? ' on' : '') + '" data-a="qyTab" data-v="' + t[0] + '">' + t[1] + (t[2] ? '<i class="dot"></i>' : '') + '</a>';
    }).join('') + '</div>';
    body += tab === 'star' ? starHtml() : (tab === 'wheel' ? wheelHtml() : hrdHtml());
    return UI.panel('奇遇', body, { cls: 'wide qiyu-p' });
  };
  UI.actions.qyTab = function (v) { UI.sel.qyTab = v; UI.renderModal(); };

  // ---------- 華容道 ----------
  var CELL = 58;
  var COLORS = { C: ['#c62828', '#7f0000'], H: ['#2e7d32', '#0f3d12'], V: ['#1565c0', '#0b3060'], S: ['#8d6e63', '#4e342e'] };
  function hrdHtml() {
    var h = G.hrd(), lv = G.HRD[h.lv], b = h.cur, sel = UI.sel.hrdSel, solved = G.hrdSolved(b);
    var out = '<div class="hrd-wrap"><div class="hrd-side">';
    out += '<div class="hrd-levels">' + U.map(G.HRD, function (x, i) {
      var un = G.hrdUnlocked(i), best = h.best[x.id];
      return '<a class="hrd-lv' + (i === h.lv ? ' on' : '') + (un ? '' : ' locked') + '" data-a="hrdLv" data-v="' + i + '"><b>' + (i + 1) + '. ' + x.name + '</b><small>' + (best ? '最佳 ' + best + ' 步' : (un ? '最少 ' + x.min + ' 步' : '未解鎖')) + '</small></a>';
    }).join('') + '</div>';
    out += '<p class="note">點選一塊棋子，再按方向鍵（或點旁邊的空格）移動一格。讓<b>曹操</b>從下方出口脫身即破解。每贏 5 場戰鬥後第一次破解可領銀幣（不看日期），每個布局首次破解另有獎勵。規則為公有領域的傳統益智遊戲；布局、獎勵：D。</p>';
    out += '</div><div class="hrd-main"><div class="hrd-head"><b>' + U.esc(lv.name) + '</b>　步數 <em class="hrd-moves">' + h.moves + '</em>　最少 ' + lv.min + ' 步</div>';
    out += '<div class="hrd-board" style="width:' + (CELL * 4 + 12) + 'px;height:' + (CELL * 5 + 12) + 'px">';
    var g = G.hrdGrid(b);
    for (var i = 0; i < 20; i++) if (g[i] === -1) out += '<a class="hrd-empty" data-a="hrdTo" data-v="' + i + '" style="left:' + (6 + (i % 4) * CELL) + 'px;top:' + (6 + Math.floor(i / 4) * CELL) + 'px;width:' + CELL + 'px;height:' + CELL + 'px"></a>';
    U.each(b, function (p, i) {
      var z = G.HRD_SIZE[p.t], col = COLORS[p.t];
      out += '<a class="hrd-pc t' + p.t + (sel === i ? ' sel' : '') + '" data-a="hrdSel" data-v="' + i + '" style="left:' + (8 + p.c * CELL) + 'px;top:' + (8 + p.r * CELL) + 'px;width:' + (z[1] * CELL - 4) + 'px;height:' + (z[0] * CELL - 4) + 'px;background:linear-gradient(' + col[0] + ',' + col[1] + ')">' +
        '<span>' + U.esc(p.n) + '</span></a>';
    });
    out += '<div class="hrd-exit" style="left:' + (6 + CELL) + 'px;width:' + (CELL * 2) + 'px">出 口</div>';
    if (solved) out += '<div class="hrd-win">脫 身！</div>';
    out += '</div><div class="hrd-ctrl">';
    out += '<a class="btn small" data-a="hrdDir" data-v="-1:0">▲</a><a class="btn small" data-a="hrdDir" data-v="0:-1">◀</a><a class="btn small" data-a="hrdDir" data-v="1:0">▼</a><a class="btn small" data-a="hrdDir" data-v="0:1">▶</a>';
    out += '<a class="btn small" data-a="hrdUndo">悔一步</a><a class="btn small" data-a="hrdReset">重來</a>';
    if (solved && G.HRD[h.lv + 1]) out += '<a class="btn small red" data-a="hrdLv" data-v="' + (h.lv + 1) + '">下一關</a>';
    out += '</div></div></div>';
    return out;
  }
  UI.actions.hrdLv = function (v) { if (UI.res(G.hrdStart(+v))) { UI.sel.hrdSel = null; UI.renderModal(); } };
  UI.actions.hrdSel = function (v) { UI.sel.hrdSel = +v; UI.renderModal(); };
  function afterMove(r) {
    if (!UI.res(r)) return;
    sfx('click');
    UI.renderModal();
    if (r.solved) {
      sfx('win');
      var lines = ['用了 ' + r.moves + ' 步（最少 ' + r.min + ' 步）　評價 ' + ['', '★', '★★', '★★★'][r.stars]].concat(r.rewards.length ? r.rewards : ['（今天的破解獎勵已領過）']);
      UI.rewardBox('華容道破解！', lines);
    }
  }
  UI.actions.hrdDir = function (v) {
    var sel = UI.sel.hrdSel; if (sel == null) { UI.toast('先點選一塊棋子', 'bad'); return; }
    var a = v.split(':'); afterMove(G.hrdMove(sel, +a[0], +a[1]));
  };
  UI.actions.hrdTo = function (v) {
    var sel = UI.sel.hrdSel, i = +v; if (sel == null) { UI.toast('先點選一塊棋子', 'bad'); return; }
    var p = G.hrd().cur[sel], z = G.HRD_SIZE[p.t], r = Math.floor(i / 4), c = i % 4, dr = 0, dc = 0;
    if (r < p.r) dr = -1; else if (r >= p.r + z[0]) dr = 1;
    if (c < p.c) dc = -1; else if (c >= p.c + z[1]) dc = 1;
    if (Math.abs(dr) + Math.abs(dc) !== 1) { UI.toast('只能往上下左右移動一格', 'bad'); return; }
    afterMove(G.hrdMove(sel, dr, dc));
  };
  UI.actions.hrdUndo = function () { if (UI.res(G.hrdUndo())) UI.renderModal(); };
  UI.actions.hrdReset = function () { if (UI.res(G.hrdReset())) { UI.sel.hrdSel = null; UI.renderModal(); } };

  // ---------- 觀星台 ----------
  var DIPPER = [[90, 70], [160, 60], [215, 95], [270, 120], [340, 110], [395, 60], [440, 120]];
  function starHtml() {
    var x = G.starState(), out = '<div class="star-wrap"><svg class="sky" viewBox="0 0 520 230" width="520" height="230">';
    out += '<defs><radialGradient id="skyg" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#283593"/><stop offset="1" stop-color="#0b0f2e"/></radialGradient></defs><rect width="520" height="230" rx="10" fill="url(#skyg)"/>';
    for (var i = 0; i < 40; i++) { var sx = (i * 137) % 510 + 5, sy = (i * 71) % 220 + 5; out += '<circle cx="' + sx + '" cy="' + sy + '" r="' + (i % 3 ? 0.8 : 1.4) + '" fill="#fff" opacity="' + (0.3 + (i % 5) / 10) + '"/>'; }
    out += '<polyline points="' + U.map(DIPPER, function (p) { return p.join(','); }).join(' ') + ' 395,60" fill="none" stroke="#9fa8da" stroke-width="1.5" stroke-dasharray="4 4" opacity=".7"/>';
    out += '<path d="M60 230 L60 214 L120 214 L120 202 L400 202 L400 214 L460 214 L460 230Z" fill="#37474f" stroke="#ffd54f" stroke-width="1.5"/><path d="M246 202 L246 186 L274 186 L274 202" fill="#263238" stroke="#ffd54f"/><circle cx="260" cy="178" r="7" fill="none" stroke="#ffd54f" stroke-width="2"/>';
    out += '</svg><div class="dipper">' + U.map(DIPPER, function (p, i) {
      var last = x.last && x.last.star === G.STAR_NAMES[i];
      return '<a class="star-pt' + (last ? ' last' : '') + '' + '" data-a="starDraw" data-v="' + i + '" style="left:' + (p[0] - 16) + 'px;top:' + (p[1] - 16) + 'px"><i></i><small>' + G.STAR_NAMES[i] + '</small></a>';
    }).join('') + '</div></div>';
    out += '<div class="star-info parch">';
    out += '<div>目前星運：' + (x.luck ? '<b class="luck-' + x.luck.id + '">' + x.luck.name + '</b>　虛空之門勝利時全隊額外經驗 <b>+' + x.luck.exp + '%</b>（還剩 ' + x.luckLeft + ' 場勝利）' : '尚未觀星') + '</div>';
    out += '<div>觀星不限次數　' + (x.free ? '<span class="good">本次免費</span>' : '本次花費 ' + x.cost + ' 金（再勝 ' + x.winsLeft + ' 場可免費）') + '　（點北斗七星任一顆）</div>';
    if (x.last) { var ll = G.starLuck(x.last.luck); out += '<div class="star-last">上次：' + x.last.star + '星 → <b class="luck-' + ll.id + '">' + ll.name + '</b>　「' + ll.poem + '」</div>'; }
    out += '<div class="small">運勢機率：' + U.map(G.STAR_LUCK, function (l) { return l.name + ' ' + l.w + '%（經驗 +' + l.exp + '%）'; }).join('、') + '。選哪顆星不影響機率。星運持續 ' + G.STAR_LAST + ' 場虛空之門勝利，期間取最好的一次。全部為 D 級（原創）。</div></div>';
    return out;
  }
  UI.actions.starDraw = function (v) {
    var r = G.starDraw(+v); if (!UI.res(r)) return;
    sfx(r.luck.id === 'daji' ? 'win' : 'coin');
    UI.renderModal();
    UI.rewardBox(r.star + '星 · ' + r.luck.name, ['「' + r.luck.poem + '」', '目前星運：' + r.todayLuck.name + '（經驗 +' + r.todayLuck.exp + '%）'].concat(r.rewards));
  };

  // ---------- 玄機盤（5 顆骰子） ----------
  // 宣傳片 0:50：金色橢圓盤上的 5 顆骰子。骰面為 CSS 點陣，無圖片。
  var DICE_PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  function dieHtml(d, rolling) {
    var pips = DICE_PIPS[d] || DICE_PIPS[1], h = '<div class="die' + (rolling ? ' rolling' : '') + '">';
    for (var i = 0; i < 9; i++) h += '<i class="' + (pips.indexOf(i) >= 0 ? 'pip' : '') + '"></i>';
    return h + '</div>';
  }
  function diceHtml(dice, rolling) {
    var ds = dice || UI._wheelDice || [1, 2, 3, 4, 5];
    return '<div class="dice-plate"><div class="dice-row">' + U.map(ds, function (d) { return dieHtml(d, rolling); }).join('') + '</div><div class="dice-cap">玄機盤</div></div>';
  }
  function wheelHtml() {
    var x = G.wheelState();
    var out = '<div class="wheel-wrap"><div id="diceBox">' + diceHtml(UI._wheelDice, false) + '</div>';
    out += '<div class="wheel-side parch"><div class="btn-row left"><a class="btn red" data-a="wheelSpin">' + (x.free ? '免費擲一次' : '擲骰（' + U.fmt(x.cost) + ' 銀）') + '</a></div>';
    out += '<div>擲 5 顆骰子決定獎項；距離保底「玄機大獎」還有 <b>' + x.pityLeft + '</b> 次（連續 ' + G.WHEEL_PITY + ' 次沒中，第 ' + G.WHEEL_PITY + ' 次必中）</div>';
    out += '<div>每贏 5 場戰鬥可免費擲一次（不看日期）；其餘每次 500＋主角等級×100 銀幣。累計擲骰 ' + x.spins + ' 次。</div>';
    out += '<div class="odds"><b>機率表</b>' + U.map(G.wheelOdds(), function (o) { return '<span>' + U.esc(o.name) + ' ' + o.pct + '%</span>'; }).join('') + '</div>';
    out += '<div class="small">骰子外觀：宣傳片 0:50 金色橢圓盤上的 5 顆骰子（B）；骰子到獎項的對應：D 級（本作設計，5 顆骰子作 base-6 數字均勻對應加權表）。獎項、機率與保底不變。單機版沒有任何真實付費。</div></div></div>';
    return out;
  }
  UI.actions.wheelSpin = function () {
    if (UI._wheelBusy) return;
    var r = G.wheelSpin(); if (!UI.res(r)) return;
    UI._wheelDice = r.dice; UI._wheelBusy = true; sfx('click');
    var box = document.getElementById('diceBox');
    var done = function () { UI._wheelBusy = false; UI.renderModal(); sfx(r.idx === 0 ? 'win' : 'coin'); UI.rewardBox('玄機盤：' + r.prize.name, ['擲出 ' + r.dice.join('・')].concat(r.free ? ['（免費）'] : ['花費 ' + U.fmt(r.cost) + ' 銀幣']).concat(r.rewards)); };
    if (box && !(UI.lowFx && UI.lowFx())) {
      var t = 0, iv = setInterval(function () {
        t += 120; var tmp = []; for (var i = 0; i < 5; i++) tmp.push(1 + Math.floor(Math.random() * 6));
        box.innerHTML = diceHtml(tmp, true);
        if (t >= 900) { clearInterval(iv); box.innerHTML = diceHtml(r.dice, false); done(); }
      }, 120);
    } else done();
  };
})();
