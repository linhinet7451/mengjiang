/* 第三階段介面：通天塔、無極幻境（三欄挑戰面板）、農田、任務（主線／每日／成就／簽到）、經濟模式 */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, R = MJ.R;
  function C() { return MJ.D.config; }
  function S() { return MJ.S.state; }

  // 獎勵物件 → 文字列表（不發放）
  UI.rwText = function (rw) {
    var out = [];
    if (!rw) return out;
    if (rw.gold) out.push('金幣 ×' + rw.gold);
    if (rw.silver) out.push('銀幣 ×' + U.fmt(rw.silver));
    U.each(rw.items || [], function (it) {
      if (it.item.indexOf('eq:') === 0) out.push(C().equipQualityNames[it.q || 0] + '·' + G.itemName(it.item));
      else out.push(G.itemName(it.item) + ' ×' + (it.n || 1));
    });
    return out;
  };
  function rwHtml(lines, cls) { return '<div class="reward-list">' + U.map(lines, function (x) { return '<div class="rw' + (cls ? ' ' + cls : '') + '">' + U.esc(x) + '</div>'; }).join('') + '</div>'; }
  function foeSummary(sg) {
    var lead = U.find(sg.enemies, function (e) { return e.leader; }), tpl = lead ? MJ.D.stages.enemies[lead.e] : null;
    return sg.enemies.length + ' 名敵將　Lv' + sg.enemies[sg.enemies.length - 1].lv + (tpl ? '　首領：' + tpl.name : '');
  }

  // ---------- 自動接續（WL-3 任務 2）：執行期狀態，不寫入存檔；預設開 ----------
  // 預設開：勝利結算出現後約 1.2 秒自動打下一層／播下一波；期間可按「停止」中斷。
  UI.autoContinue = { tower: true, wuji: true };
  UI.AUTO_DELAY = 1200;
  UI._autoTimer = null; UI._autoKind = null;
  UI.clearAuto = function () { if (UI._autoTimer) { clearTimeout(UI._autoTimer); UI._autoTimer = null; UI._autoKind = null; } };
  UI.scheduleAuto = function (kind, fn) {
    UI.clearAuto(); UI._autoKind = kind;
    UI._autoTimer = setTimeout(function () { UI._autoTimer = null; UI._autoKind = null; fn(); }, UI.AUTO_DELAY);
  };
  UI.actions.autoStop = function (v) {
    UI.clearAuto();
    if (v === 'tower' || v === 'wuji') UI.autoContinue[v] = false;
    var el = document.getElementById('autoNext');
    if (el) el.innerHTML = '已停止自動接續（可在通天塔／無極幻境畫面重新開啟）。';
  };
  UI.actions.autoToggle = function (v) {
    if (v !== 'tower' && v !== 'wuji') return;
    UI.autoContinue[v] = !UI.autoContinue[v];
    UI.render();
  };

  // =================== 通天塔 ===================
  UI.screens.tower = function () {
    var s = S(), best = s.tower.best, next = Math.min(best + 1, G.TOWER_MAX), sg = G.towerFloor(next);
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall towerf"><div class="plaque">通天塔</div><a class="xbtn" data-a="city">×</a>';
    // 塔身：顯示目前附近的 7 層
    var lo = Math.max(1, Math.min(next - 3, G.TOWER_MAX - 6));
    if (MJ.Art.has('bg_pagoda')) {
      h += '<div class="tw-art timg" style="background-image:url(' + MJ.Art.url('bg_pagoda') + ')"><div class="tw-floors">';
      for (var j = 0; j < 7; j++) {
        var ff = lo + j, cu = ff === next && best < G.TOWER_MAX, dn = ff <= best;
        h += '<div class="tw-fl' + (cu ? ' cur' : dn ? ' done' : '') + '">第 ' + ff + ' 層' + (ff % 10 === 0 ? '<em>王</em>' : ff % 5 === 0 ? '<em>精</em>' : '') + (dn ? '<em>已登</em>' : cu ? '<em>挑戰</em>' : '') + '</div>';
      }
      h += '</div></div>';
    } else {
    h += '<div class="tw-art"><svg viewBox="0 0 300 470" class="art"><defs><linearGradient id="twg" x1="0" x2="1"><stop offset="0" stop-color="#6a4a8a"/><stop offset=".5" stop-color="#9a7ac8"/><stop offset="1" stop-color="#5a3a7a"/></linearGradient></defs>';
    h += '<path d="M150 4 L162 34 L138 34 Z" fill="#ffd54f"/>';
    for (var i = 6; i >= 0; i--) {
      var f = lo + i, y = 40 + (6 - i) * 60, w = 120 + i * 0 + (6 - i) * 14, x = 150 - w / 2, cur = f === next && best < G.TOWER_MAX, done = f <= best;
      h += '<path d="M' + (x - 14) + ' ' + (y + 14) + ' L' + (x + w + 14) + ' ' + (y + 14) + ' L' + (x + w) + ' ' + y + ' L' + x + ' ' + y + ' Z" fill="#3a2a10"/>';
      h += '<rect x="' + x + '" y="' + (y + 14) + '" width="' + w + '" height="44" fill="' + (cur ? '#ffcf5a' : 'url(#twg)') + '" stroke="#2a1a40" stroke-width="2"/>';
      h += '<rect x="' + (150 - 12) + '" y="' + (y + 26) + '" width="24" height="32" rx="12" fill="' + (done ? '#ffe9a0' : '#2a1a3a') + '"/>';
      h += '<text x="' + (x + 8) + '" y="' + (y + 42) + '" font-size="15" font-weight="bold" fill="' + (cur ? '#5a2a00' : '#fff') + '">' + f + '</text>';
      if (f % 10 === 0) h += '<text x="' + (x + w - 8) + '" y="' + (y + 42) + '" font-size="13" text-anchor="end" fill="#ff8a65">王</text>';
      else if (f % 5 === 0) h += '<text x="' + (x + w - 8) + '" y="' + (y + 42) + '" font-size="13" text-anchor="end" fill="#ffd54f">精</text>';
      if (done) h += '<text x="' + (x + w - 8) + '" y="' + (y + 56) + '" font-size="10" text-anchor="end" fill="#c8ffc8">已登</text>';
    }
    h += '<rect x="60" y="460" width="180" height="10" fill="#4a3a20"/></svg></div>';
    }
    // 右側資訊
    h += '<div class="parch tw-side">';
    h += '<div class="tw-best">最高紀錄：第 <b>' + best + '</b> 層 / ' + G.TOWER_MAX + '</div>' + UI.bar(best, G.TOWER_MAX, 'tw-bar', best + '/' + G.TOWER_MAX);
    if (best >= G.TOWER_MAX) h += '<div class="fg-box"><b>已登上塔頂！</b></div>';
    else {
      h += '<div class="fg-box"><b>' + U.esc(sg.name) + '</b>（' + ({ normal: '一般', elite: '精英', boss: '首領' })[sg.kind] + '　景：' + U.esc(sg.chName) + '）<br>' + U.esc(foeSummary(sg)) +
        '<div class="rw-h">首次登頂獎勵</div>' + rwHtml(UI.rwText(sg.first).concat(['星魂 +' + sg.xinghun, '全隊經驗 +' + sg.exp]), 'first') +
        '<div class="btn-row"><a class="btn" data-a="twFight">挑　戰</a><a class="btn small" data-a="autoToggle" data-v="tower">自動接續：' + (UI.autoContinue.tower ? '開' : '關') + '</a></div></div>';
    }
    var sw = G.towerSweepReward(), twt = G.ticket('tower'), swDone = !twt.ready;
    h += '<div class="fg-box tw-sweep"><b>塔俸</b>（依最高層數；每贏 ' + twt.every + ' 場可領一次）<br>' + (best ? U.esc(UI.rwText(sw).join('、')) : '至少通過第 1 層才能領取') +
      '<div class="btn-row"><a class="btn small' + (swDone || !best ? ' disabled' : '') + '" data-a="twSweep">' + (swDone ? '再勝 ' + twt.left + ' 場' : '領取') + '</a></div></div>';
    h += '<p class="note">通天塔可無限挑戰；戰敗沒有懲罰。勝利後預設自動接續下一層（約 1.2 秒後，結算畫面按「停止」可中斷）；戰鬥重播或結算畫面按「跳過全部／跳過剩餘層數」可直接連打到戰敗或登頂再看總結。建築：A；樓層內容、獎勵：D。</p></div></div></div>';
    return h;
  };
  UI.actions.tower = function () { UI.go('tower'); };
  UI.actions.twFight = function () { var r = G.towerFight(); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.twSweep = function () { var r = G.towerSweep(); if (UI.res(r)) { UI.render(); UI.rewardBox('塔俸', r.got); } };

  // =================== 無極幻境 ===================
  UI.screens.wuji = function () {
    var s = S(), lead = G.lead();
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall wujif"><div class="plaque">無極幻境</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="wj-tip">無盡波次：連續挑戰敵軍，<b>生命與怒氣會延續到下一波</b>。<b>每 5 波得 1 個將魂</b>，每 10 波道具包，每次最多 ' + G.WUJI_SEG + ' 波。最深紀錄：第 <b>' + (s.wuji.best || 0) + '</b> 波<br>勝利後預設自動接續下一波（約 1.2 秒後，結算畫面按「停止」可中斷）；戰鬥重播按「跳過全部」或結算畫面按「略過，看結算」可直接跳到總結。</div><div class="wj-cards">';
    U.each(G.WUJI, function (t, i) {
      var locked = lead.lv < t.open, left = G.wujiLeft(t.id), boss = G.wujiWave(t, t.waves - 1, 1);
      var bu = R.enemyUnit(boss.enemies[0], boss);
      h += '<div class="wj-card wj' + i + (locked ? ' locked' : '') + '"><div class="wj-h">' + U.esc(t.name) + '</div>' +
        '<div class="wj-fig">' + MJ.Art.figure(bu.look, { enemy: true, cape: true }) + '</div>' +
        '<div class="wj-b">第 <b>' + t.start + '～' + (t.start + t.waves - 1) + '</b> 波<br>敵軍 Lv' + G.wujiLv(t.start) + '～' + G.wujiLv(t.start + t.waves - 1) + '<br>將魂：' + C().qualityNames[Math.min(4, G.wujiSoulQ(t.start))] + '～' + C().qualityNames[Math.min(4, G.wujiSoulQ(t.start + t.waves - 1))] + '<br>' +
        '次數 <b>不限</b>' +
        '<div class="rw-h">全破寶箱</div><small>' + U.esc(UI.rwText(t.bonus).join('、')) + '</small>' +
        (s.wuji.first[t.id] ? '' : '<div class="rw-h">首次全破</div><small class="wj-first">' + U.esc(UI.rwText(t.first).join('、')) + '</small>') + '</div>' +
        (locked ? '<div class="wj-lock">主角 ' + t.open + ' 級開放</div>' : '<div class="btn-row"><a class="btn" data-a="wjGo" data-v="' + t.id + '">挑　戰</a></div>') + '</div>';
    });
    h += '</div><p class="note wj-note">無極幻境：A（建築存在）；每 5 波 1 將魂：B（規格書）；三欄挑戰面板版面參考影片 3；波數、敵軍、獎勵數值：D。累計全破 ' + s.wuji.clears + ' 次。<a class="btn small" data-a="autoToggle" data-v="wuji">自動接續：' + (UI.autoContinue.wuji ? '開' : '關') + '</a></p></div></div>';
    return h;
  };
  UI.actions.wuji = function () { UI.go('wuji'); };
  UI.actions.wjGo = function (id) {
    var r = G.wujiRun(id); if (!UI.res(r)) return;
    UI.wujiPlay(r, 0);
  };
  UI.wujiPlay = function (run, i) {
    var w = run.waves[i];
    UI.startBattle({ mode: 'wuji', run: run, idx: i, win: w.win, battle: w.battle, stage: w.stage, team: w.team, foes: w.foes, rewards: [], levelUps: [], energyCost: 0 });
  };
  UI.actions.wjNext = function () { UI.clearAuto(); var b = UI.battleState(); if (!b) return; b.done = true; UI.wujiPlay(b.r.run, b.r.idx + 1); };
  UI.actions.wjSum = function () { UI.clearAuto(); var b = UI.battleState(); if (!b) return; var el = document.getElementById('bresult'); if (el) el.innerHTML = UI.modeResult(b.r, true); };

  // 戰鬥結算（通天塔／無極幻境）
  UI.modeResult = function (r, summary) {
    var h, lead = G.lead();
    var tips = '<div class="rw-h">如何提升戰鬥力</div><div class="tips">・到神武殿升級技能、培養、修練心法<br>・到神兵坊強化與鑲嵌寶石<br>・在將星錄點亮將星（全隊加成）<br>・調整陣法，把耐打的武將放在前排</div>';
    if (r.mode === 'tower') {
      var f = r.stage.floor;
      if (r.win) h = '<div class="dim"></div><div class="result win"><div class="banner">登 頂</div><div class="parch rbody"><div>成功登上通天塔第 <b>' + f + '</b> 層！回合數：' + r.battle.rounds + '</div>' +
        (r.exp ? '<div>全隊經驗 +' + r.exp + '</div>' : '') + (r.levelUps.length ? '<div class="lvup">升級！' + U.esc(r.levelUps.join('、')) + '</div>' : '') +
        '<div class="rw-h">首次登頂獎勵</div>' + rwHtml(r.rewards, 'first') + '</div>';
      else h = '<div class="dim"></div><div class="result lose"><div class="banner">戰 敗</div><div class="parch rbody"><div>第 ' + f + ' 層的守軍太強了。' + (r.battle.timeout ? '（超過 ' + C().maxRounds + ' 回合）' : '') + '通天塔戰敗沒有任何損失。</div>' + tips + '</div>';
      // 自動接續（預設開）：勝利且未登頂時，約 1.2 秒後走現有 bTower 路徑打下一層
      var autoT = r.win && UI.autoContinue.tower && G.towerAutoNext(r);
      if (autoT) {
        h += '<div class="auto-next" id="autoNext">即將挑戰下一層… <a class="btn small" data-a="autoStop" data-v="tower">停止</a></div>';
        UI.scheduleAuto('tower', function () { UI.actions.bTower('1'); });
      }
      h += '<div class="btn-row">' + (r.win && S().tower.best < G.TOWER_MAX ? '<a class="btn" data-a="bTower" data-v="1">下一層</a>' : '') + (!r.win ? '<a class="btn" data-a="bTower" data-v="1">再戰一次</a>' : '') + (r.win && S().tower.best < G.TOWER_MAX ? '<a class="btn" data-a="twSkipAll">跳過剩餘層數</a>' : '') + '<a class="btn" data-a="bTower">返回通天塔</a><a class="btn" data-a="bCity">回主城</a></div></div>';
      return h;
    }
    // 無極幻境
    var run = r.run, t = run.tier, last = r.idx === run.waves.length - 1;
    if (!summary && r.win && !last) {
      var autoW = UI.autoContinue.wuji && G.wujiAutoNext(r);
      var wh = '<div class="dim"></div><div class="result win"><div class="banner">第 ' + (r.idx + 1) + ' 波 勝</div><div class="parch rbody"><div>' + U.esc(t.name) + '：第 ' + (r.idx + 1) + '/' + t.waves + ' 波通過。</div>' +
        '<div>存活的武將會帶著目前的生命與怒氣進入下一波。</div>' +
        '<div>本波獎勵：銀幣 ×' + U.fmt(r.stage.silver) + '　全隊經驗 +' + r.stage.exp + '</div></div>' +
        (autoW ? '<div class="auto-next" id="autoNext">即將播放下一波… <a class="btn small" data-a="autoStop" data-v="wuji">停止</a></div>' : '') +
        '<div class="btn-row"><a class="btn" data-a="wjNext">下一波</a><a class="btn" data-a="wjSum">略過，看結算</a></div></div>';
      if (autoW) UI.scheduleAuto('wuji', function () { UI.actions.wjNext(); });
      return wh;
    }
    h = '<div class="dim"></div><div class="result ' + (run.full ? 'win' : 'lose') + '"><div class="banner">' + (run.full ? '全 破' : '結 算') + '</div><div class="parch rbody">' +
      '<div>' + U.esc(t.name) + '：通過 <b>' + run.cleared + '/' + t.waves + '</b> 波' + (run.full ? '，全部擊破！' : '。') + (run.souls ? '　將魂 ×' + run.souls : '') + '</div>' +
      (run.exp ? '<div>全隊經驗 +' + run.exp + '</div>' : '') + (run.levelUps.length ? '<div class="lvup">升級！' + U.esc(run.levelUps.join('、')) + '</div>' : '') +
      '<div class="rw-h">獲得獎勵</div>' + (run.rewards.length ? rwHtml(run.rewards) : '<div>沒有通過任何一波，沒有獎勵。</div>') +
      (run.firstRewards ? '<div class="rw-h">首次全破</div>' + rwHtml(run.firstRewards, 'first') : '') + (run.full ? '' : tips) + '</div>' +
      '<div class="btn-row"><a class="btn" data-a="bWuji">返回幻境</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    return h;
  };
  UI.actions.bTower = function (v) { UI.clearAuto(); var b = UI.battleState(); if (b) b.done = true; if (v === '1') { var r = G.towerFight(); if (!UI.res(r)) { UI.go('tower'); return; } UI.startBattle(r); } else UI.go('tower'); };
  UI.actions.bWuji = function () { UI.clearAuto(); var b = UI.battleState(); if (b) b.done = true; UI.go('wuji'); };

  // ---------- 通天塔跳過（WL-3 任務 2）：本層已打過，只彙總；其餘層走 G.towerSkip ----------
  // cur 為本層已打完的結果（獎勵已發放）。戰敗或已登頂時不再多打，直接以本層作結。
  UI.towerSkipRun = function (cur) {
    if (!cur || cur.mode !== 'tower') return { ok: false, msg: '不是通天塔戰鬥' };
    var base = { startBest: cur.stage.floor - 1, fought: 1, rewards: (cur.rewards || []).slice(), levelUps: (cur.levelUps || []).slice(), exp: cur.exp || 0, topped: false, lostAt: 0 };
    if (!cur.win) { base.reached = S().tower.best; base.lostAt = cur.stage.floor; base.win = false; return ok0(base); }
    if (S().tower.best >= G.TOWER_MAX) { base.reached = S().tower.best; base.topped = true; base.win = true; return ok0(base); }
    var skip = G.towerSkip();
    if (!skip.ok) return skip;
    base.reached = skip.reached; base.fought += skip.floors.length;
    base.rewards = base.rewards.concat(skip.rewards); base.levelUps = base.levelUps.concat(skip.levelUps);
    base.exp += skip.exp; base.topped = skip.topped; base.lostAt = skip.lostAt; base.win = skip.win;
    return ok0(base);
    function ok0(o) { o.ok = true; return o; }
  };
  UI.towerSkipSummary = function (agg) {
    var h = '<div class="dim"></div><div class="result ' + (agg.topped ? 'win' : 'lose') + '"><div class="banner">' + (agg.topped ? '登 頂' : '跳 過 結 算') + '</div><div class="parch rbody">' +
      '<div>跳過連戰：從第 <b>' + (agg.startBest + 1) + '</b> 層打到第 <b>' + agg.reached + '</b> 層' + (agg.topped ? '，登上塔頂！' : (agg.lostAt ? '，在第 ' + agg.lostAt + ' 層戰敗。' : '。')) + '</div>' +
      '<div>本輪共打 ' + agg.fought + ' 層' + (agg.exp ? '，全隊經驗 +' + agg.exp : '') + '</div>' +
      (agg.levelUps.length ? '<div class="lvup">升級！' + U.esc(agg.levelUps.join('、')) + '</div>' : '') +
      '<div class="rw-h">本輪拿到獎勵</div>' + (agg.rewards.length ? rwHtml(agg.rewards) : '<div>沒有拿到獎勵。</div>') + '</div>' +
      '<div class="btn-row"><a class="btn" data-a="bTower">返回通天塔</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    return h;
  };
  UI.actions.twSkipAll = function () {
    UI.clearAuto();
    var b = UI.battleState(); if (!b) return;
    var agg = UI.towerSkipRun(b.r);
    if (!agg.ok) { UI.toast(agg.msg || '無法跳過', 'bad'); return; }
    b.done = true;
    var bt = document.getElementById('bt'); if (bt && bt.className.indexOf('ended') < 0) bt.className += ' ended';
    var el = document.getElementById('bresult'); if (el) el.innerHTML = UI.towerSkipSummary(agg);
  };

  // =================== 農田 ===================
  var SEED_COL = { seed_yin: '#cfd8dc', seed_exp: '#7cb342', seed_gem: '#ba68c8', seed_soul: '#4fc3f7' };
  function crop(seed, pct, ready) {
    var c = SEED_COL[seed] || '#8bc34a', st = ready ? 3 : (pct < 0.34 ? 0 : (pct < 0.67 ? 1 : 2)), hgt = [14, 28, 40, 46][st];
    var s = '<svg viewBox="0 0 80 70" class="art crop"><ellipse cx="40" cy="60" rx="30" ry="8" fill="#5a3a1a"/>';
    s += '<path d="M40 60 L40 ' + (60 - hgt) + '" stroke="#3e7a1e" stroke-width="3"/>';
    for (var i = 0; i <= st; i++) { var y = 58 - i * 11; s += '<path d="M40 ' + y + ' q-14 -4 -16 -12 q10 0 16 8 Z" fill="#6aa83a"/><path d="M40 ' + (y - 4) + ' q14 -4 16 -12 q-10 0 -16 8 Z" fill="#7cbc44"/>'; }
    if (ready) {
      if (seed === 'seed_yin') s += '<circle cx="30" cy="16" r="6" fill="#eceff1" stroke="#90a4ae"/><circle cx="50" cy="14" r="6" fill="#eceff1" stroke="#90a4ae"/><circle cx="40" cy="8" r="6" fill="#fff" stroke="#90a4ae"/>';
      else if (seed === 'seed_gem') s += '<path d="M40 2 L48 12 L40 24 L32 12 Z" fill="' + c + '" stroke="#fff"/>';
      else if (seed === 'seed_soul') s += '<path d="M40 22 q-10 -10 0 -22 q10 12 0 22 Z" fill="' + c + '" opacity=".9"/>';
      else s += '<rect x="36" y="2" width="8" height="22" rx="3" fill="#9ccc65" stroke="#33691e"/>';
    }
    return s + '</svg>';
  }
  UI.screens.farm = function () {
    var s = S(), n = G.farmPlots(), lv = G.farmLv();
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall farmf"><div class="plaque">農田</div><a class="xbtn" data-a="city">×</a><div class="fm-field">';
    for (var i = 0; i < 9; i++) {
      h += '<div class="fm-plot' + (i >= n ? ' locked' : '') + '">';
      if (i >= n) h += '<div class="fm-lk">農田 Lv' + ((i - 2) * 3) + ' 開墾</div>';
      else {
        var x = G.plotState(i);
        if (x.empty) h += '<div class="fm-soil"></div><a class="btn small" data-a="fmPick" data-v="' + i + '">種植</a>';
        else {
          h += crop(x.seed, x.pct, x.ready) + '<div class="fm-nm">' + U.esc(G.itemName(x.seed).replace(/種$|苗$/, '')) + '</div>';
          if (x.ready) h += '<a class="btn small fm-ripe" data-a="fmHarvest" data-v="' + i + '">收成</a>';
          h += x.fert ? '<small class="fm-f">已施肥 +50%</small>' : '<a class="btn small" data-a="fmFert" data-v="' + i + '">施肥</a>';
        }
      }
      h += '</div>';
    }
    h += '</div><div class="parch fm-side"><b>農田 Lv' + lv + '</b>　已開墾 ' + n + '/9 塊<br><small>每級成長時間 −2%（最多 −30%），收成 +5%。</small>' +
      '<div class="btn-row"><a class="btn small" data-a="upBld" data-v="farm">升級（' + U.fmt(G.buildingCost('farm', lv)) + ' 銀）</a><a class="btn small" data-a="fmAll">一鍵收成</a></div><hr><b>種子與化肥</b><div class="rows">';
    U.each(['seed_yin', 'seed_exp', 'seed_gem', 'seed_soul', 'huafei'], function (k) {
      var it = MJ.D.equipment.items[k], sd = G.SEEDS[k];
      h += '<div class="row-item">' + UI.icon(it.icon, SEED_COL[k] || '#8bc34a') + '<div class="ri-t"><b>' + U.esc(it.name) + ' ×' + (s.bag.stack[k] || 0) + '</b><small>' + (sd ? '立即成熟　' : '') + U.esc(it.desc) + '</small></div></div>';
    });
    h += '</div><div class="btn-row"><a class="btn small" data-a="open" data-v="shop">到商城買種子</a></div>' +
      '<p class="note">作物依真實時間成長，關閉遊戲後也會繼續長。經濟模式：' + G.econ().name + (G.econ().farm > 1 ? '（成長 ' + G.econ().farm + ' 倍速）' : '') + '。農田：A；作物、時間、收成：D。</p></div></div></div>';
    return h;
  };
  UI.actions.farm = function () { UI.go('farm'); };
  UI.actions.fmPick = function (i) { UI.open('seedPick', i); };
  UI.modals.seedPick = function (i) {
    var s = S(), any = false, h = '<div class="rows">';
    U.each(['seed_yin', 'seed_exp', 'seed_gem', 'seed_soul'], function (k) {
      var n = s.bag.stack[k] || 0, it = MJ.D.equipment.items[k]; if (n) any = true;
      h += '<div class="row-item">' + UI.icon('seed', SEED_COL[k]) + '<div class="ri-t"><b>' + U.esc(it.name) + ' ×' + n + '</b><small>' + U.esc(it.desc) + '　立即成熟</small></div>' +
        (n ? '<a class="btn small" data-a="fmPlant" data-v="' + i + ':' + k + '">種下</a>' : '<span class="dim2">沒有</span>') + '</div>';
    });
    h += '</div>' + (any ? '' : '<p class="note">沒有種子，可到商城購買。</p><div class="btn-row"><a class="btn small" data-a="open" data-v="shop">商城</a></div>');
    return UI.panel('選擇種子', h, { cls: 'narrow2' });
  };
  UI.actions.fmPlant = function (v) { var a = v.split(':'), r = G.plant(+a[0], a[1]); if (UI.res(r, '已種下')) UI.close(); };
  UI.actions.fmFert = function (i) { if (UI.res(G.fertilize(+i), '施肥完成，剩餘時間減半')) UI.render(); };
  UI.actions.fmHarvest = function (i) { var r = G.harvest(+i); if (UI.res(r)) { UI.render(); UI.rewardBox('收成', r.got); } };
  UI.actions.fmAll = function () { var r = G.harvestAll(); if (UI.res(r)) { UI.render(); UI.rewardBox('收成 ' + r.n + ' 塊田', r.got); } };

  // =================== 任務：主線／每日／成就／簽到 ===================
  UI.taskDot = function () {
    var s = S(), d = G.daily();
    return !!(U.find(MJ.D.tasks, function (t) { return !s.tasksClaimed[t.id] && G.taskDone(t); }) || G.achPending() ||
      U.find(G.DAILY, function (q) { return !d.claimed[q.id] && G.dailyProgress(q) >= q.n; }) || U.find(G.DAILY_CHEST, function (c) { return !d.chest[c.id] && d.act >= c.need; }));
  };
  UI.modals.tasks = function () {
    var s = S(), tab = UI.sel.taskTab || 'daily', body = '';
    var dDot = U.find(G.DAILY, function (q) { return !G.daily().claimed[q.id] && G.dailyProgress(q) >= q.n; }), aDot = G.achPending(), sDot = !G.signState().signedToday;
    var mDot = U.find(MJ.D.tasks, function (t) { return !s.tasksClaimed[t.id] && G.taskDone(t); });
    body += '<div class="tabs">' + U.map([['daily', '歷練', dDot], ['main', '主線', mDot], ['ach', '成就', aDot], ['sign', '簽到', sDot]], function (t) {
      return '<a class="tab' + (tab === t[0] ? ' on' : '') + '" data-a="taskTab" data-v="' + t[0] + '">' + t[1] + (t[2] ? '<i class="dot"></i>' : '') + '</a>';
    }).join('') + '</div>';
    var claimable = G.taskRewardCount();
    body += '<div class="task-claimbar"><span>目前可領 <b>' + claimable + '</b> 項（不含簽到獎勵）</span><a class="btn small' + (claimable ? '' : ' disabled') + '" data-why="目前沒有可領取的任務獎勵" data-a="claimAllTasks">一鍵領取</a></div>';
    if (tab === 'main') {
      var pg = UI.pager('taskP', MJ.D.tasks, 5, function (t) {
        var done = G.taskDone(t), cl = s.tasksClaimed[t.id];
        return '<div class="row-item">' + UI.icon('quest') + '<div class="ri-t"><b>' + U.esc(t.name) + '</b><small>' + U.esc(t.desc) + '<br>獎勵：' + U.esc(UI.rwText(t.reward).join('、')) + '</small></div>' +
          (cl ? '<span class="dim2">已完成</span>' : (done ? '<a class="btn small" data-a="claimTask" data-v="' + t.id + '">領取</a>' : '<span class="dim2">未完成</span>')) + '</div>';
      });
      body += '<div class="rows">' + pg.html + '</div>' + pg.nav;
    } else if (tab === 'daily') {
      var d = G.daily();
      body += '<div class="act-bar">第 ' + d.round + ' 輪　活躍度 <b>' + d.act + '</b>' + UI.bar(d.act, 100, 'act', d.act + '/100') + '<span class="act-ch">' + U.map(G.DAILY_CHEST, function (c) {
        var got = d.chest[c.id], can = !got && d.act >= c.need;
        return '<a class="chestb' + (got ? ' got' : (can ? ' can' : '')) + '" data-a="dailyChest" data-v="' + c.id + '" title="' + U.esc(UI.rwText(c.reward).join('、')) + '">' + UI.icon('chest') + '<small>' + c.need + '</small></a>';
      }).join('') + '</span></div><div class="rows">';
      U.each(G.DAILY, function (q) {
        var p = G.dailyProgress(q), cl = d.claimed[q.id];
        body += '<div class="row-item">' + UI.icon('quest') + '<div class="ri-t"><b>' + U.esc(q.name) + '</b>（' + p + '/' + q.n + '）<small>' + U.esc(q.desc) + '　獎勵：' + U.esc(UI.rwText(q.reward).join('、')) + '、活躍 ' + q.act + '</small></div>' +
          (cl ? '<span class="dim2">已領取</span>' : (p >= q.n ? '<a class="btn small" data-a="claimDaily" data-v="' + q.id + '">領取</a>' : '<span class="dim2">進行中</span>')) + '</div>';
      });
      body += '</div><div class="btn-row"><a class="btn small' + (U.keys(d.claimed).length && !G.dailyPending() ? '' : ' disabled') + '" data-why="' + (U.keys(d.claimed).length ? '還有可以領取的獎勵，先領完' : '這一輪還沒有領取任何任務') + '" data-a="dailyRound">開始下一輪</a></div><p class="note">歷練任務不看日期：領完獎勵後可以馬上開始下一輪，沒有每日上限（本作改編）。內容與獎勵：D。</p>';
    } else if (tab === 'ach') {
      var pa = UI.pager('achP', G.ACH, 5, function (a) {
        var x = G.achState(a), stars = '';
        for (var i = 0; i < a.tiers.length; i++) stars += '<i class="' + (i < x.tier ? 'on' : '') + '">★</i>';
        return '<div class="row-item">' + UI.icon('star', '#ffd54f') + '<div class="ri-t"><b>' + U.esc(a.name) + '</b> <span class="ach-st">' + stars + '</span><small>' + U.esc(a.desc) + (x.done ? '　全部達成' : ' ' + U.fmt(x.val) + '/' + U.fmt(x.need) + '　獎勵：金幣 ×' + x.gold) + '</small></div>' +
          (x.done ? '<span class="dim2">完成</span>' : (x.can ? '<a class="btn small" data-a="claimAch" data-v="' + a.id + '">領取</a>' : '<span class="dim2">未達成</span>')) + '</div>';
      });
      body += '<div class="rows">' + pa.html + '</div>' + pa.nav;
    } else {
      var x = G.signState();
      body += '<div class="sg-wrap"><div class="sg-cal"><div class="sg-m">本輪已簽 <b>' + x.count + '</b>/' + x.daysInMonth + ' 次　累計 ' + s.sign.total + ' 次</div><div class="sg-g">';
      for (var dd = 1; dd <= x.daysInMonth; dd++) {
        var on = dd <= x.count;
        body += '<span class="sg-d' + (on ? ' on' : '') + (dd === x.count + 1 ? ' today' : '') + (dd > x.count + 1 ? ' fut' : '') + '">' + dd + (on ? '<i>簽</i>' : '') + '</span>';
      }
      body += '</div></div><div class="sg-side"><b>下一次獎勵</b><br><small>' + U.esc(UI.rwText(G.SIGN_REWARD[x.count % G.SIGN_REWARD.length]).join('、')) + '</small>' +
        '<div class="btn-row">' + (x.signedToday ? '<a class="btn disabled">再勝 ' + x.winsLeft + ' 場</a>' : '<a class="btn" data-a="signDo">簽　到</a>') + '</div>' +
        (x.canMakeup ? '<div class="btn-row"><a class="btn small" data-a="signMk">補簽（' + G.SIGN_MAKEUP_GOLD + ' 金）</a></div>' : '') + '<hr><b>累計簽到獎勵</b><div class="rows">';
      U.each([7, 14, 21, 28], function (n) {
        var got = x.bonus[n], can = !got && x.count >= n;
        body += '<div class="row-item sg-b"><div class="ri-t"><b>' + n + ' 次</b><small>' + U.esc(UI.rwText(G.SIGN_BONUS[n]).join('、')) + '</small></div>' + (got ? '<span class="dim2">已領</span>' : (can ? '<a class="btn small" data-a="signBonus" data-v="' + n + '">領取</a>' : '<span class="dim2">' + x.count + '/' + n + '</span>')) + '</div>';
      });
      body += '</div></div></div><p class="note">簽到不看日期：每贏 ' + x.every + ' 場戰鬥可簽一次，28 次為一輪（本作改編）。獎勵：D。</p>';
    }
    return UI.panel('任務', body, { cls: 'wide task-p' });
  };
  UI.actions.taskTab = function (v) { UI.sel.taskTab = v; UI.renderModal(); };
  UI.actions.dailyRound = function () { var r = G.dailyNewRound(); if (UI.res(r, r.ok ? '第 ' + r.round + ' 輪歷練任務開始' : '')) UI.renderModal(); };
  UI.actions.claimDaily = function (id) { var r = G.claimDaily(id); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('歷練任務', r.got); } };
  UI.actions.dailyChest = function (id) { var r = G.claimDailyChest(id); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('活躍寶箱', r.got); } };
  UI.actions.claimAch = function (id) { var r = G.claimAch(id); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('成就達成', r.got); } };
  UI.actions.claimAllTasks = function () {
    var r = G.claimAllTaskRewards();
    if (UI.res(r, r.ok ? '一鍵領取 ' + r.count + ' 項' : '')) { UI.renderModal(); UI.rewardBox('一鍵領取 ' + r.count + ' 項', r.got); }
  };
  UI.actions.signDo = function () { var r = G.sign(); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('簽到成功（本月第 ' + r.n + ' 天）', r.got); } };
  UI.actions.signMk = function () {
    UI.confirm('補簽', '花 ' + G.SIGN_MAKEUP_GOLD + ' 金幣補簽本月最早漏簽的一天？', function () { var r = G.signMakeup(); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('補簽 ' + r.day + ' 號', r.got); } }, '補簽');
  };
  UI.actions.signBonus = function (n) { var r = G.claimSignBonus(n); if (UI.res(r)) { UI.renderModal(); UI.rewardBox('累計簽到 ' + n + ' 天', r.got); } };
  UI.actions.openSign = function () { UI.sel.taskTab = 'sign'; UI.open('tasks'); };
  UI.actions.setEcon = function (v) { if (UI.res(G.setEcon(v), '經濟模式：' + G.ECON[v].name)) UI.renderModal(); };
})();
