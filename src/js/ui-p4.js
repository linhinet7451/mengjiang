/* 第四階段：音樂／音效接線、靜音按鈕、場景切換的讀取提示、拜訪武將（AI 排名賽與戰報重播） */
(function () {
  var UI = MJ.UI, U = MJ.U, G = MJ.G, A = MJ.Audio;
  function bossFight() {
    var b = UI.battleState && UI.battleState(); if (!b || !b.r) return false;
    var r = b.r; if (r.mode === 'tower' && r.floor && r.floor % 10 === 0) return true;
    for (var i = 0; i < r.foes.length; i++) if (r.foes[i].unit.boss) return true;
    return false;
  }
  // 依目前畫面切換背景音樂
  var render0 = UI.render;
  function battleResult() { var b = UI.battleState && UI.battleState(); return b && b.done && b.r && UI.screen === 'battle' ? (b.r.win ? 'win' : 'lose') : null; }
  UI.battleResultMusic = function () { if (A) A.scene(A.sceneFor('battle', false, battleResult())); };
  UI.render = function () { render0.apply(UI, arguments); if (A) A.scene(A.sceneFor(UI.screen, bossFight(), battleResult())); };
  var start0 = UI.startBattle;
  UI.startBattle = function (res) {
    var from = UI.screen;
    start0.apply(UI, arguments);
    if (A) A.scene(A.sceneFor('battle', bossFight()));
    if (from !== 'battle') UI.veil();
  };
  // 喇叭按鈕
  var SPK = '<path d="M4 14 H10 L18 7 V33 L10 26 H4Z" fill="#fff6c8" stroke="#5a3a0a" stroke-width="1.5"/>';
  UI.muteBtn = function (cls) {
    var m = A ? A.muted() : true;
    return '<a class="mute-btn ' + (cls || '') + (m ? ' off' : '') + '" data-a="toggleMute" title="' + (m ? '開啟聲音' : '靜音') + '" aria-label="' + (m ? '開啟聲音' : '靜音') + '"><svg viewBox="0 0 40 40" class="art">' + SPK +
      (m ? '<path d="M24 14 L34 26 M34 14 L24 26" stroke="#ff6040" stroke-width="3.5" stroke-linecap="round"/>' : '<path d="M23 14 Q28 20 23 26 M27 10 Q35 20 27 30" stroke="#fff6c8" stroke-width="3" fill="none" stroke-linecap="round"/>') + '</svg></a>';
  };
  function repaintMute() {
    var els = document.getElementsByClassName('mute-btn');
    for (var i = els.length - 1; i >= 0; i--) { var e = els[i], small = /small/.test(e.className), d = document.createElement('div'); d.innerHTML = UI.muteBtn(small ? 'small' : ''); e.parentNode.replaceChild(d.firstChild, e); }
  }
  UI.actions.toggleMute = function () {
    if (!A) return;
    A.unlock(); A.toggle('all'); MJ.S.save();
    UI.toast(A.muted() ? '已靜音' : (A.supported ? '已開啟音樂與音效' : '此瀏覽器不支援 WebAudio，無法播放聲音'), A.muted() || A.supported ? '' : 'bad');
    repaintMute(); if (UI.modal && UI.modal.name === 'settings') UI.renderModal();
  };
  UI.actions.setSound = function (v) {
    if (!A) return; A.unlock();
    var a = v.split(':'), st = MJ.S.state.settings; st[a[0]] = a[1] === '1'; A.refresh(); MJ.S.save();
    UI.renderModal(); repaintMute();
  };
  // 第五階段：特效等級（省電模式關掉光環動畫、火花、閃光與大震動，適合舊手機）
  UI.lowFx = function () {
    var st = MJ.S.state && MJ.S.state.settings, fx = st && st.fx || 'auto';
    if (fx === 'low') return true; if (fx === 'full') return false;
    try { if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true; } catch (e) { }
    var mem = navigator.deviceMemory, cores = navigator.hardwareConcurrency;
    return !!((mem && mem <= 2) || (cores && cores <= 2));
  };
  UI.applyFx = function () {
    var b = document.body; if (!b) return;
    var low = UI.lowFx(), has = /(^| )lowfx( |$)/.test(b.className);
    if (low && !has) b.className = (b.className + ' lowfx').replace(/^ /, '');
    else if (!low && has) b.className = b.className.replace(/(^| )lowfx( |$)/, ' ').replace(/^ +| +$/g, '');
  };
  var lay0 = UI.layout; UI.layout = function () { var r = lay0.apply(UI, arguments); UI.applyFx(); return r; };
  UI.actions.setFx = function (v) { MJ.S.state.settings.fx = v; MJ.S.save(); UI.applyFx(); UI.renderModal(); };
  UI.fxRow = function () {
    var fx = MJ.S.state.settings.fx || 'auto';
    function t(k, n) { return '<a class="tog' + (fx === k ? ' on' : '') + '" data-a="setFx" data-v="' + k + '">' + n + '</a>'; }
    return '<div class="set-row">戰鬥特效：' + t('auto', '自動') + t('full', '完整') + t('low', '省電') + '<br><small>目前：' + (UI.lowFx() ? '省電（關閉光環動畫、火花與閃光）' : '完整') + '</small></div>';
  };
  UI.soundRows = function () {
    var st = MJ.S.state.settings, b = st.bgm !== false, s = st.sfx !== false;
    return UI.fxRow() + '<div class="set-row">背景音樂：<a class="tog' + (b ? ' on' : '') + '" data-a="setSound" data-v="bgm:1">開</a><a class="tog' + (!b ? ' on' : '') + '" data-a="setSound" data-v="bgm:0">關</a>　音效：<a class="tog' + (s ? ' on' : '') + '" data-a="setSound" data-v="sfx:1">開</a><a class="tog' + (!s ? ' on' : '') + '" data-a="setSound" data-v="sfx:0">關</a>' +
      (A && !A.supported ? '<br><small class="bad">此瀏覽器不支援 WebAudio</small>' : '<br><small>音樂與音效皆為程式即時合成的原創旋律。</small>') + '</div>';
  };
  // 第一次點擊解鎖音訊（瀏覽器規定），並為按鈕加上點擊音
  UI.bindSound = function () {
    var st = document.getElementById('stage'); if (!st || !A) return;
    st.addEventListener('click', function (ev) {
      A.unlock();
      var t = ev.target, n = 0;
      while (t && t !== st && n < 6) { if (t.getAttribute && t.getAttribute('data-a')) { var a = t.getAttribute('data-a'); if (a !== 'toggleMute' && UI.screen !== 'battle') A.sfx('click'); break; } t = t.parentNode; n++; }
    }, true);
    st.addEventListener('touchstart', function () { A.unlock(); }, true);
  };
  // 獎勵、失敗提示、招募結果的音效
  var rb0 = UI.rewardBox; UI.rewardBox = function () { if (A) A.sfx('coin'); return rb0.apply(UI, arguments); };
  var toast0 = UI.toast; UI.toast = function (msg, kind) { if (A && kind === 'bad') A.sfx('fail'); return toast0.apply(UI, arguments); };
  var open0 = UI.open; UI.open = function (name) { if (A && name === 'recruitResult') A.sfx('reveal'); return open0.apply(UI, arguments); };

  // 進入戰鬥時的讀取提示（不阻擋操作，0.9 秒淡出）
  UI.veil = function () {
    var st = document.getElementById('stage'); if (!st) return;
    var old = document.getElementById('veil'); if (old && old.parentNode) old.parentNode.removeChild(old);
    var T = MJ.LOAD_TIPS || [], v = document.createElement('div');
    v.id = 'veil'; v.className = 'veil';
    v.innerHTML = '<div class="vl-t">戰鬥準備中…</div><div class="vl-tip">' + U.esc(T.length ? T[Math.floor(Math.random() * T.length)] : '') + '</div>';
    st.appendChild(v);
    setTimeout(function () { v.className = 'veil out'; }, 650);
    setTimeout(function () { if (v.parentNode) v.parentNode.removeChild(v); }, 1200);
  };

  // ---------- 拜訪武將（名將切磋．AI 排名賽）＋戰報重播 ----------
  function rankTxt(r) { return r > G.ARENA_N ? '未上榜' : '第 ' + r + ' 名'; }
  function capLook(d) { return d.look; }
  UI.screens.arena = function () {
    var s = MJ.S.state, a = G.arenaState(), list = G.arenaList(), my = G.myPower(), d = U.dayKey(U.now());
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall arenaf"><div class="plaque">拜訪武將</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="parch ar-side"><div class="ar-rank">我的排名<b>' + (a.rank > G.ARENA_N ? '—' : a.rank) + '</b></div>' +
      '<div>最佳：' + rankTxt(a.best) + '</div><div>我的戰力：<b>' + U.fmt(my) + '</b></div>' +
      '<div>挑戰次數：<b class="ar-tries">不限</b></div>';
    var dr = G.arenaDailyReward(a.rank), atk = G.ticket('arena'), claimed = !atk.ready;
    h += '<div class="fg-box"><b>排名獎勵</b>（每贏 ' + atk.every + ' 場可領一次）<br>' + (dr ? U.esc(UI.rwText(dr).concat(['星魂 +' + dr.xinghun]).join('、')) : '擊敗任一位對手即可上榜') +
      '<div class="btn-row"><a class="btn small' + (!dr || claimed ? ' disabled' : '') + '" data-a="arDaily">' + (claimed ? '再勝 ' + atk.left + ' 場' : '領取') + '</a></div></div>';
    h += '<p class="note">挑戰排名在你前面 5 名以內的名將隊伍，勝利即交換排名。不限次數，戰敗無損失。對手為電腦 AI（D）。名次隊伍偶爾會刷成頂尖隊伍（紫框）：等級 1–99 隨機、練度拉滿，勝利銀幣更高、排名不變。下方固定的頂尖隊伍等級與主角相同，是當下能見到的最強組合。</p></div>';
    h += '<div class="ar-main"><div class="ar-h">可挑戰的名將</div><div class="ar-list">';
    if (!list.length) h += '<div class="parch ar-empty">你已是天下第一！</div>';
    U.each(list, function (rk) {
      var f = G.arenaListFoe(rk), hard = f.power > my * 1.3 ? ' hard' : (f.power < my * 0.8 ? ' easy' : '');
      h += '<div class="parch ar-card' + hard + (f.top ? ' top' : '') + '"><div class="ar-art">' + MJ.Art.portrait(capLook(f.cap), f.cap.quality, { enemy: true }) + '</div>' +
        '<div class="ar-info"><div class="ar-rk">第 ' + rk + ' 名' + (f.top ? ' <span class="top-tag">頂尖</span>' : '') + '</div><b>' + U.esc(f.name) + '</b><small>「' + U.esc(f.title) + '」</small>' +
        '<div>Lv' + f.lv + '．' + f.count + ' 人</div><div class="ar-pw">戰力 ' + U.fmt(f.power) + '</div></div>' +
        '<a class="btn small' + (a.tries <= 0 ? ' disabled' : '') + '" data-a="arFight" data-v="' + rk + '">挑戰</a>' +
        '<div class="ar-win">勝：銀幣 ×' + U.fmt(G.arenaRewardFor(f).silver) + '</div></div>';
    });
    // WL-9 固定第六組頂尖隊伍（D 級原創）：等級＝主角等級、練度拉滿，挑戰次數不限、勝利銀幣按第 25 名＋等級×10、不影響排名
    var top = G.arenaTopFoe();
    h += '<div class="parch ar-card top"><div class="ar-art">' + MJ.Art.portrait(capLook(top.cap), top.cap.quality, { enemy: true }) + '</div>' +
      '<div class="ar-info"><div class="ar-rk">頂尖隊伍 <span class="top-tag">固定</span></div><b>' + U.esc(top.name) + '</b><small>「' + U.esc(top.title) + '」</small>' +
      '<div>Lv' + top.lv + '．' + top.count + ' 人</div><div class="ar-pw">戰力 ' + U.fmt(top.power) + '</div></div>' +
      '<a class="btn small" data-a="arTopFight">挑戰</a>' +
      '<div class="ar-win">勝：銀幣 ×' + U.fmt(G.arenaTopReward(25, top.lv).silver) + '</div></div>';
    h += '</div><div class="ar-h">戰報（最近 ' + G.ARENA_RECS + ' 場，可重播）</div><div class="ar-recs">';
    if (!a.recs.length) h += '<div class="ar-rec none">還沒有戰報</div>';
    U.each(a.recs, function (r, i) {
      var t = new Date(r.ts);
      h += '<div class="ar-rec ' + (r.win ? 'w' : 'l') + '"><span class="ar-res">' + (r.win ? '勝' : '敗') + '</span>' +
        '<span>' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) + '</span>' +
        '<span>' + (r.top ? '挑戰頂尖 ' + U.esc(r.name) : '挑戰第 ' + r.target + ' 名 ' + U.esc(r.name)) + '</span><span>' + rankTxt(r.before) + '→' + rankTxt(r.after) + '</span>' +
        '<a class="btn small" data-a="arReplay" data-v="' + i + '">重播</a></div>';
    });
    h += '</div></div></div></div>';
    return h;
  };
  UI.actions.arena = function () { UI.go('arena'); };
  UI.actions.arFight = function (v) { var r = G.arenaFight(+v); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.arTopFight = function () { var r = G.arenaTopFight(); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.arReplay = function (v) { var r = G.arenaReplay(+v); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.arDaily = function () { var r = G.arenaClaimDaily(); if (UI.res(r)) { UI.render(); UI.rewardBox('排名獎勵', r.got); } };
  UI.actions.bArena = function () { var b = UI.battleState(); if (b) b.done = true; UI.go('arena'); };

  // ---------- 武林大會（單機 AI 淘汰賽，第 41 屆，海選 Lv.70-75） ----------
  // 入口：主城 → 原版玩法中心 → 武林大會（唯一入口）。對手、獎勵皆 D 級本作設計。
  UI.screens.wulin = function () {
    var s = MJ.S.state, w = G.wulinState(), lead = G.lead(), locked = lead.lv < G.WULIN_OPEN, rounds = ['八強', '四強', '決賽'];
    var h = '<div class="scr hall-scr"><div class="frame bigframe hall arenaf"><div class="plaque">武林大會</div><a class="xbtn" data-a="city">×</a>';
    h += '<div class="parch ar-side"><div class="ar-rank">第<b>' + G.WULIN_EDITION + '</b>屆</div>' +
      '<div>海選 Lv.70-75</div><div>主角：Lv' + lead.lv + (locked ? '（未滿 ' + G.WULIN_OPEN + ' 級，尚未開放）' : '') + '</div>' +
      '<div>歷屆冠軍：' + (w.champ ? '是' : '否') + '　累計勝場：' + (w.wins || 0) + '</div>' +
      '<div class="fg-box"><b>輪次獎勵</b><br>八強勝：銀幣 1,000＋培養丹 ×2<br>四強勝：銀幣 2,000＋技能書 ×1、培養丹 ×3<br>決賽勝：銀幣 5,000＋技能書 ×2、培養丹 ×5<br><small>單機 AI 對戰，無真人、無邀請（D）。</small></div>' +
      '<p class="note">8 人單淘汰賽：八強 → 四強 → 決賽。對手為電腦 AI（D）。</p></div>';
    h += '<div class="ar-main">';
    if (locked) { h += '<div class="parch ar-empty">主角未滿 ' + G.WULIN_OPEN + ' 級，武林大會海選尚未開放（海選 Lv.70-75）。請先提升主角等級。</div>'; }
    else if (!w.bracket) { h += '<div class="parch ar-empty">第 ' + G.WULIN_EDITION + ' 屆武林大會尚未開幕。</div><div class="btn-row"><a class="btn red" data-a="wlStart">開始本屆大會</a></div>'; }
    else {
      var b = w.bracket;
      h += '<div class="ar-h">對陣表（第 ' + G.WULIN_EDITION + ' 屆）</div><div class="parch wl-bracket">';
      U.each(b.qf, function (m, i) { h += '<div>八強 ' + (i + 1) + '：' + U.esc(m.a) + ' vs ' + U.esc(m.b) + (m.w ? ' → <b>' + U.esc(m.w) + '</b>' : '') + '</div>'; });
      h += '<div>四強對手：' + U.esc(b.foes[1].name) + '（Lv' + b.foes[1].lv + '）　決賽對手：' + U.esc(b.foes[2].name) + '（Lv' + b.foes[2].lv + '）</div></div>';
      if (b.done) h += '<div class="parch ar-empty">' + (b.champ ? '奪冠！你是第 ' + G.WULIN_EDITION + ' 屆武林盟主。' : '本屆已結束（止步' + rounds[b.round] + '）。') + '</div><div class="btn-row"><a class="btn red" data-a="wlStart">開始下一屆</a></div>';
      else {
        var f = b.foes[b.round];
        h += '<div class="parch ar-card wl-card"><div class="ar-info"><div class="ar-rk">' + rounds[b.round] + '</div><b>' + U.esc(f.name) + '</b><small>「' + U.esc(f.title) + '」</small><div>Lv' + f.lv + '．戰力 ' + U.fmt(f.power) + '</div></div>' +
          '<a class="btn small red" data-a="wlFight">出戰</a>' +
          '<div class="ar-win">勝：' + U.esc(UI.rwText(G.wulinRewards(b.round)).join('、')) + '</div></div>';
      }
    }
    h += '<div class="ar-h">戰報（最近 3 場，可重播）</div><div class="ar-recs">';
    if (!w.recs.length) h += '<div class="ar-rec none">還沒有戰報</div>';
    U.each(w.recs, function (r, i) {
      var t = new Date(r.ts);
      h += '<div class="ar-rec ' + (r.win ? 'w' : 'l') + '"><span class="ar-res">' + (r.win ? '勝' : '敗') + '</span>' +
        '<span>' + (t.getMonth() + 1) + '/' + t.getDate() + ' ' + ('0' + t.getHours()).slice(-2) + ':' + ('0' + t.getMinutes()).slice(-2) + '</span>' +
        '<span>' + rounds[r.round] + ' ' + U.esc(r.name) + '</span>' +
        '<a class="btn small" data-a="wlReplay" data-v="' + i + '">重播</a></div>';
    });
    h += '</div></div></div></div>';
    return h;
  };
  UI.actions.wulin = function () { UI.go('wulin'); };
  UI.actions.wlStart = function () { var r = G.wulinStart(); if (UI.res(r)) UI.render(); };
  UI.actions.wlFight = function () { var r = G.wulinFight(); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.wlReplay = function (v) { var r = G.wulinReplay(+v); if (!UI.res(r)) return; UI.startBattle(r); };
  UI.actions.bWulin = function () { var b = UI.battleState(); if (b) b.done = true; UI.go('wulin'); };
  var mr0 = UI.modeResult;
  UI.modeResult = function (r, summary) {
    if (r.mode === 'wulin') {
      var rounds = ['八強', '四強', '決賽'];
      var h = '<div class="dim"></div><div class="result ' + (r.win ? 'win' : 'lose') + '"><div class="banner">' + (r.replay ? '重播結束' : (r.win ? '勝 利' : '戰 敗')) + '</div><div class="parch rbody">';
      if (r.replay) h += '<div>' + (r.win ? '這場戰鬥你獲勝了。' : '這場戰鬥你落敗了。') + '回合數：' + r.battle.rounds + '</div><div>重播依保存的雙方陣容與亂數種子重新演算' + (r.consistent ? '，結果與當時一致。' : '。') + '</div>';
      else if (r.win) h += '<div>第 ' + rounds[r.round] + '擊敗了「' + U.esc(r.foe.name) + '」！回合數：' + r.battle.rounds + '</div>' + (r.bracket && r.bracket.champ ? '<div><b>奪冠！第 ' + G.WULIN_EDITION + ' 屆武林盟主！</b></div>' : (r.bracket ? '<div>晉級下一輪：' + rounds[r.bracket.round] + '</div>' : '')) + '<div class="rw-h">獲得獎勵</div><div class="reward-list">' + U.map(r.rewards, function (x) { return '<div class="rw">' + U.esc(x) + '</div>'; }).join('') + '</div>';
      else h += '<div>「' + U.esc(r.foe.name) + '」太強了，本屆止步' + rounds[r.round] + '。沒有損失，可以再開一屆。</div><div class="tips">・提升等級、強化裝備、點亮將星後再來挑戰</div>';
      h += '</div><div class="btn-row"><a class="btn" data-a="bWulin">返回武林大會</a><a class="btn" data-a="bCity">回主城</a></div></div>';
      return h;
    }
    if (r.mode !== 'arena') return mr0(r, summary);
    // WL-9：頂尖隊伍（固定第六組或名次隊伍隨機刷出）不影響排名；重播的頂尖標記在 r.rec.top
    var isTop = r.top || (r.rec && r.rec.top);
    var h = '<div class="dim"></div><div class="result ' + (r.win ? 'win' : 'lose') + '"><div class="banner">' + (r.replay ? '重播結束' : (r.win ? '勝 利' : '戰 敗')) + '</div><div class="parch rbody">';
    if (r.replay) h += '<div>' + (r.win ? '這場戰鬥你獲勝了。' : '這場戰鬥你落敗了。') + '回合數：' + r.battle.rounds + '</div><div>重播依保存的雙方陣容與亂數種子重新演算' + (r.consistent ? '，結果與當時一致。' : '。') + '</div>';
    else if (r.win) h += '<div>擊敗了「' + U.esc(r.foe.name) + '」！回合數：' + r.battle.rounds + '</div>' + (isTop ? '<div>頂尖隊伍：排名不變。</div>' : '<div>排名：' + rankTxt(r.before) + ' → <b>' + rankTxt(r.after) + '</b></div>') + '<div class="rw-h">獲得獎勵</div><div class="reward-list">' + U.map(r.rewards, function (x) { return '<div class="rw">' + U.esc(x) + '</div>'; }).join('') + '</div>';
    else h += '<div>「' + U.esc(r.foe.name) + '」太強了。' + (r.battle.timeout ? '（超過 ' + MJ.D.config.maxRounds + ' 回合）' : '') + '排名不變，沒有損失。</div><div class="tips">・提升等級、強化裝備、點亮將星後再來挑戰<br>・先挑戰戰力較低（綠色）的對手</div>';
    h += '</div><div class="btn-row"><a class="btn" data-a="bArena">返回拜訪武將</a><a class="btn" data-a="bCity">回主城</a></div></div>';
    return h;
  };
})();
